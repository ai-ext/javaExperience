package com.example.board.admin;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.LazyInitializationException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import com.example.board.ApiTestSupport;
import com.example.board.coupon.Coupon;
import com.example.board.coupon.CouponRepository;
import com.example.board.member.Member;
import com.example.board.member.Role;
import com.jayway.jsonpath.JsonPath;

import static com.example.board.admin.Xlsx.file;
import static com.example.board.admin.Xlsx.withHeader;
import static com.example.board.admin.Xlsx.xlsx;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 신고 → 숨김 → 감사 로그, 대량 지급 → 감사 로그를 실제 MySQL·Redis로 끝까지 돌린다.
 * 테스트 메서드에 @Transactional을 붙이지 않는다. 붙이면 MockMvc 요청이 테스트 트랜잭션에 합류해
 * 영속성 컨텍스트가 끝까지 열려 있으므로, 운영에서 나는 LazyInitializationException이 숨고
 * 커밋이 없어 AFTER_COMMIT 리스너(인기글 캐시 삭제)도 돌지 않는다.
 */
class AdminFlowIntegrationTest extends ApiTestSupport {

    @Autowired
    ReportRepository reportRepository;

    @Autowired
    CouponRepository couponRepository;

    @Test
    void 신고하고_숨기면_상세는_404_신고는_RESOLVED_인기글에서_빠지고_감사_로그는_HIDE_POST_1건() throws Exception {
        Member author = newMember(Role.USER);
        Member reporter = newMember(Role.USER);
        Member admin = newMember(Role.ADMIN);
        String location = mockMvc.perform(post("/api/posts").header("Authorization", bearer(author))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"광고 글\",\"content\":\"내용\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getHeader("Location");
        Long postId = Long.valueOf(location.substring(location.lastIndexOf('/') + 1));
        jdbc.update("UPDATE post SET like_count = 1000000 WHERE id = ?", postId);
        // 인기글 캐시를 먼저 채운다. 비어 있으면 캐시를 지우지 않아도 DB가 ACTIVE만 읽어 통과해 버린다.
        mockMvc.perform(get("/api/posts/popular"))
                .andExpect(jsonPath("$.items[?(@.id == %d)]", postId).isNotEmpty());

        String reported = mockMvc.perform(post("/api/posts/{id}/reports", postId)
                        .header("Authorization", bearer(reporter)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"SPAM\",\"detail\":\"광고\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long reportId = ((Number) JsonPath.read(reported, "$.reportId")).longValue();

        // 응답에 LAZY 연관(글 제목·신고자 닉네임)이 담긴다. 트랜잭션 밖에서 변환하면 여기서 500이 난다.
        mockMvc.perform(get("/api/admin/reports").param("size", "50").header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.id == %d)].postTitle", reportId).value("광고 글"))
                .andExpect(jsonPath("$.items[?(@.id == %d)].reporterNickname", reportId)
                        .value(reporter.getNickname()));

        mockMvc.perform(post("/api/admin/posts/{id}/hide", postId).header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reportId\":" + reportId + "}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/posts/{id}", postId)).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/posts/popular"))
                .andExpect(jsonPath("$.items[?(@.id == %d)]", postId).isEmpty());
        mockMvc.perform(get("/api/admin/reports").param("status", "RESOLVED").param("size", "50")
                        .header("Authorization", bearer(admin)))
                .andExpect(jsonPath("$.items[?(@.id == %d)].status", reportId).value("RESOLVED"));
        mockMvc.perform(get("/api/admin/audit-logs").param("size", "50").header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.action == 'HIDE_POST' && @.targetId == %d)]", postId)
                        .value(hasSize(1)))
                .andExpect(jsonPath("$.items[?(@.action == 'HIDE_POST' && @.targetId == %d)].actorId", postId)
                        .value(admin.getId().intValue()));
    }

    @Test
    void 대량_지급_1000행은_200_issued_skipped이고_감사_로그는_BULK_ISSUE_COUPON_1건() throws Exception {
        Member admin = newMember(Role.ADMIN);
        Long couponId = couponRepository.saveAndFlush(
                Coupon.create("대량 쿠폰", 1000, java.time.LocalDateTime.now().plusDays(30))).getId();
        List<Long> ids = newMembers(1000);

        mockMvc.perform(multipart("/api/admin/coupons/{id}/bulk-issue", couponId)
                        .file(file("members.xlsx", xlsx(withHeader(ids)))).header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.issued").value(1000))
                .andExpect(jsonPath("$.skipped").isArray())
                .andExpect(jsonPath("$.skipped").isEmpty());

        mockMvc.perform(get("/api/admin/audit-logs").param("size", "50").header("Authorization", bearer(admin)))
                .andExpect(jsonPath("$.items[?(@.action == 'BULK_ISSUE_COUPON' && @.targetId == %d)]", couponId)
                        .value(hasSize(1)))
                .andExpect(jsonPath("$.items[?(@.action == 'BULK_ISSUE_COUPON' && @.targetId == %d)].detail",
                        couponId).value("result=SUCCESS, issued=1000, skipped=0"));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM member_coupon WHERE coupon_id = ?", Integer.class,
                couponId)).isEqualTo(1000);
    }

    // 함정의 정체: 트랜잭션이 끝난 뒤 LAZY 연관을 건드리면 예외다. 그래서 서비스가 트랜잭션 안에서 DTO로 바꿔 돌려준다.
    @Test
    void 트랜잭션_밖에서_LAZY_연관을_건드리면_LazyInitializationException이다() {
        Long postId = newPost(newMember(Role.USER));
        jdbc.update("INSERT INTO report (post_id, reporter_id, reason, status, created_at, updated_at)"
                + " VALUES (?, ?, 'SPAM', 'OPEN', NOW(6), NOW(6))", postId, newMember(Role.USER).getId());
        Long reportId = jdbc.queryForObject("SELECT MAX(id) FROM report WHERE post_id = ?", Long.class, postId);

        Report detached = reportRepository.findById(reportId).orElseThrow();

        assertThatThrownBy(() -> detached.getPost().getTitle()).isInstanceOf(LazyInitializationException.class);
    }

    private List<Long> newMembers(int n) {
        String tag = UUID.randomUUID().toString().substring(0, 8);
        List<Object[]> rows = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            rows.add(new Object[] {"flow-" + tag + "-" + i + "@t.com", "f" + tag + i});
        }
        jdbc.batchUpdate("INSERT INTO member (email, password_hash, nickname, role, point_balance, created_at,"
                + " updated_at) VALUES (?, 'hash', ?, 'USER', 0, NOW(6), NOW(6))", rows);
        return jdbc.queryForList("SELECT id FROM member WHERE email LIKE ? ORDER BY id", Long.class,
                "flow-" + tag + "-%");
    }
}
