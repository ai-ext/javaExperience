package com.example.board.admin;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.ResultActions;

import com.example.board.ApiTestSupport;
import com.example.board.coupon.Coupon;
import com.example.board.coupon.CouponRepository;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static com.example.board.admin.Xlsx.file;
import static com.example.board.admin.Xlsx.withHeader;
import static com.example.board.admin.Xlsx.xls;
import static com.example.board.admin.Xlsx.xlsx;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CouponBulkIssueApiTest extends ApiTestSupport {

    @Autowired
    CouponRepository couponRepository;

    Long newCoupon(int total) {
        return couponRepository.saveAndFlush(Coupon.create("대량 쿠폰", total, LocalDateTime.now().plusDays(30))).getId();
    }

    /** 회원 n명을 한 번에 넣고 id를 돌려준다. */
    List<Long> newMembers(int n) {
        String tag = UUID.randomUUID().toString().substring(0, 8);
        List<Object[]> rows = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            rows.add(new Object[] {"bulk-" + tag + "-" + i + "@t.com", "b" + tag + i});
        }
        jdbc.batchUpdate("INSERT INTO member (email, password_hash, nickname, role, point_balance, created_at,"
                + " updated_at) VALUES (?, 'hash', ?, 'USER', 0, NOW(6), NOW(6))", rows);
        return jdbc.queryForList("SELECT id FROM member WHERE email LIKE ? ORDER BY id", Long.class,
                "bulk-" + tag + "-%");
    }

    ResultActions upload(Long couponId, MockMultipartFile file, String token) throws Exception {
        return mockMvc.perform(multipart("/api/admin/coupons/{id}/bulk-issue", couponId).file(file)
                .header("Authorization", token));
    }

    int owned(Long couponId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM member_coupon WHERE coupon_id = ?", Integer.class, couponId);
    }

    int issued(Long couponId) {
        return jdbc.queryForObject("SELECT issued_quantity FROM coupon WHERE id = ?", Integer.class, couponId);
    }

    List<String> audit(Long couponId) {
        return jdbc.queryForList("SELECT detail FROM audit_log WHERE action = 'BULK_ISSUE_COUPON' AND target_id = ?",
                String.class, couponId);
    }

    @Test
    void 엑셀_1000행이면_200이고_1000명에게_지급하며_감사_로그는_1건() throws Exception {
        Long couponId = newCoupon(1000);
        List<Long> ids = newMembers(1000);
        MockMultipartFile file = file("members.xlsx", xlsx(withHeader(ids)));

        long started = System.nanoTime();
        upload(couponId, file, bearer(newMember(Role.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.issued").value(1000))
                .andExpect(jsonPath("$.skipped").isEmpty());
        long elapsedMs = (System.nanoTime() - started) / 1_000_000;

        assertThat(owned(couponId)).isEqualTo(1000);
        assertThat(issued(couponId)).isEqualTo(1000);
        assertThat(audit(couponId)).containsExactly("result=SUCCESS, issued=1000, skipped=0");
        assertThat(elapsedMs).as("1,000행 처리 시간(ms)").isLessThan(30_000);
    }

    /**
     * 함정: 1,000행을 트랜잭션 하나로 묶으면 한 행의 실패로 전체가 롤백된다.
     * 소진은 행 트랜잭션 안(조건부 UPDATE)에서 감지되는 실패라, 트랜잭션을 하나로 묶으면(bulkIssue에 @Transactional)
     * 전체가 rollback-only가 되어 이 테스트가 실패한다.
     */
    @Test
    void 없는_회원_이미_보유_잘못된_값_소진이_섞여도_나머지_행은_지급된다() throws Exception {
        Long couponId = newCoupon(3);
        List<Long> ids = newMembers(5);
        Long missing = ids.get(4) + 1_000_000;
        // 이미 보유: 먼저 선착순으로 받게 한다
        Member owner = memberRepository.findById(ids.get(0)).orElseThrow();
        mockMvc.perform(post("/api/coupons/{id}/issue", couponId).header("Authorization", bearer(owner)))
                .andExpect(status().isCreated());
        // Redis 수량을 DB보다 넉넉하게 어긋나게 둬 거름망을 통과시킨다. 그래야 소진이 행 트랜잭션 안(조건부 UPDATE)에서 감지된다.
        redis.opsForValue().set("coupon:" + couponId + ":stock", "100");
        // 행 번호: 헤더 1, 이후 2부터
        List<Object> values = withHeader(List.of(ids.get(0), missing, "abc", ids.get(1), ids.get(2), ids.get(3)));

        upload(couponId, file("members.xlsx", xlsx(values)), bearer(newMember(Role.ADMIN)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.issued").value(2))
                .andExpect(jsonPath("$.skipped", hasSize(4)))
                .andExpect(jsonPath("$.skipped[0].row").value(2))
                .andExpect(jsonPath("$.skipped[0].reason").value("ALREADY_ISSUED"))
                .andExpect(jsonPath("$.skipped[1].row").value(3))
                .andExpect(jsonPath("$.skipped[1].reason").value("MEMBER_NOT_FOUND"))
                .andExpect(jsonPath("$.skipped[2].row").value(4))
                .andExpect(jsonPath("$.skipped[2].value").value("abc"))
                .andExpect(jsonPath("$.skipped[2].reason").value("NOT_A_NUMBER"))
                .andExpect(jsonPath("$.skipped[3].row").value(7))
                .andExpect(jsonPath("$.skipped[3].reason").value("COUPON_EXHAUSTED"));

        assertThat(owned(couponId)).isEqualTo(3);
        assertThat(issued(couponId)).isEqualTo(3);
        assertThat(audit(couponId)).containsExactly("result=SUCCESS, issued=2, skipped=4");
    }

    @Test
    void 같은_파일을_다시_올리면_모두_ALREADY_ISSUED이고_더_지급하지_않는다() throws Exception {
        Long couponId = newCoupon(10);
        List<Long> ids = newMembers(3);
        String token = bearer(newMember(Role.ADMIN));
        byte[] bytes = xlsx(withHeader(ids));
        upload(couponId, file("members.xlsx", bytes), token).andExpect(jsonPath("$.issued").value(3));

        upload(couponId, file("members.xlsx", bytes), token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.issued").value(0))
                .andExpect(jsonPath("$.skipped[*].reason").value(
                        org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is("ALREADY_ISSUED"))));
        assertThat(issued(couponId)).isEqualTo(3);
    }

    // 대량 지급도 Redis 수량 키(coupon:{id}:stock)와 어긋나지 않아야 선착순 발급이 남은 수량만큼만 된다
    @Test
    void 대량_지급_뒤의_선착순_발급은_남은_수량만큼만_성공한다() throws Exception {
        Long couponId = newCoupon(4);
        Member early = newMember(Role.USER);
        mockMvc.perform(post("/api/coupons/{id}/issue", couponId).header("Authorization", bearer(early)))
                .andExpect(status().isCreated());
        upload(couponId, file("members.xlsx", xlsx(withHeader(newMembers(2)))), bearer(newMember(Role.ADMIN)))
                .andExpect(jsonPath("$.issued").value(2));

        mockMvc.perform(post("/api/coupons/{id}/issue", couponId).header("Authorization", bearer(newMember(Role.USER))))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/coupons/{id}/issue", couponId).header("Authorization", bearer(newMember(Role.USER))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.type").value("/errors/coupon-exhausted"));
        assertThat(issued(couponId)).isEqualTo(4);
    }

    @Test
    void 파일_6MB는_400() throws Exception {
        Long couponId = newCoupon(10);

        upload(couponId, file("members.xlsx", new byte[6 * 1024 * 1024]), bearer(newMember(Role.ADMIN)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("/errors/validation"));
        assertThat(audit(couponId)).containsExactly("result=FAILURE, error=VALIDATION");
    }

    @Test
    void xls와_1001행은_400이고_아무에게도_지급하지_않는다() throws Exception {
        Long couponId = newCoupon(2000);
        String token = bearer(newMember(Role.ADMIN));
        List<Long> ids = newMembers(1001);

        upload(couponId, file("members.xls", xls(List.of(ids.get(0)))), token)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("/errors/validation"));
        upload(couponId, file("members.xlsx", xlsx(withHeader(ids))), token)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("/errors/validation"));
        assertThat(owned(couponId)).isZero();
    }

    @Test
    void file_파트가_없으면_400() throws Exception {
        mockMvc.perform(multipart("/api/admin/coupons/{id}/bulk-issue", newCoupon(1))
                        .header("Authorization", bearer(newMember(Role.ADMIN))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("/errors/validation"));
    }

    @Test
    void 없는_쿠폰은_404() throws Exception {
        upload(999_999_999L, file("members.xlsx", xlsx(List.of(1))), bearer(newMember(Role.ADMIN)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("/errors/not-found"));
    }

    @Test
    void USER_토큰은_403이고_지급하지_않는다() throws Exception {
        Long couponId = newCoupon(10);
        Member user = newMember(Role.USER);

        upload(couponId, file("members.xlsx", xlsx(List.of(user.getId()))), bearer(user))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.type").value("/errors/forbidden"));
        assertThat(owned(couponId)).isZero();
    }
}
