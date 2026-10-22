package com.example.board.admin;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import com.example.board.ApiTestSupport;
import com.example.board.member.AuthMember;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminApiTest extends ApiTestSupport {

    @Autowired
    ReportService reportService;

    @Autowired
    AdminService adminService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    String admin() {
        return bearer(newMember(Role.ADMIN));
    }

    Long reportOf(Long postId) {
        return reportService.report(postId, newMember(Role.USER).getId(), ReportReason.SPAM, "광고");
    }

    String reportStatus(Long reportId) {
        return jdbc.queryForObject("SELECT status FROM report WHERE id = ?", String.class, reportId);
    }

    String postStatus(Long postId) {
        return jdbc.queryForObject("SELECT status FROM post WHERE id = ?", String.class, postId);
    }

    // --- 신고 목록 ---

    @Test
    void ADMIN은_신고_목록을_200으로_받는다_기본은_OPEN이고_최신순() throws Exception {
        Member author = newMember(Role.USER);
        Long postId = insertPost(author, "신고된 글", "내용", "ACTIVE");
        Long first = reportOf(postId);
        Long second = reportOf(postId);
        Long resolved = reportOf(postId);
        jdbc.update("UPDATE report SET status = 'RESOLVED' WHERE id = ?", resolved);

        mockMvc.perform(get("/api/admin/reports").param("size", "2").header("Authorization", admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].id").value(second))
                .andExpect(jsonPath("$.items[0].postId").value(postId))
                .andExpect(jsonPath("$.items[0].postTitle").value("신고된 글"))
                .andExpect(jsonPath("$.items[0].reporterNickname").isString())
                .andExpect(jsonPath("$.items[0].reason").value("SPAM"))
                .andExpect(jsonPath("$.items[0].detail").value("광고"))
                .andExpect(jsonPath("$.items[0].status").value("OPEN"))
                .andExpect(jsonPath("$.items[0].createdAt").isString())
                .andExpect(jsonPath("$.items[1].id").value(first))
                .andExpect(jsonPath("$.items[?(@.id == %d)]", resolved).isEmpty())
                .andExpect(jsonPath("$.nextCursor").isString());
    }

    @Test
    void 신고_목록은_커서로_다음_쪽을_읽고_마지막_쪽은_nextCursor가_null() throws Exception {
        Long postId = newPost(newMember(Role.USER));
        Long r1 = reportOf(postId);
        Long r2 = reportOf(postId);
        jdbc.update("UPDATE report SET status = 'RESOLVED' WHERE id IN (?, ?)", r1, r2);
        String token = admin();

        String body = mockMvc.perform(get("/api/admin/reports").param("status", "RESOLVED").param("size", "1")
                        .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(r2))
                .andReturn().getResponse().getContentAsString();
        String cursor = com.jayway.jsonpath.JsonPath.read(body, "$.nextCursor");

        mockMvc.perform(get("/api/admin/reports").param("status", "RESOLVED").param("size", "1")
                        .param("cursor", cursor).header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(r1))
                .andExpect(jsonPath("$.items[0].status").value("RESOLVED"));
    }

    @Test
    void 신고_목록의_잘못된_status_size_cursor는_400() throws Exception {
        String token = admin();
        mockMvc.perform(get("/api/admin/reports").param("status", "CLOSED").header("Authorization", token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("/errors/validation"))
                .andExpect(jsonPath("$.errors[0].field").value("status"));
        mockMvc.perform(get("/api/admin/reports").param("size", "51").header("Authorization", token))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/admin/reports").param("size", "0").header("Authorization", token))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/admin/reports").param("cursor", "!!").header("Authorization", token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void USER_토큰으로_신고_목록은_403_problem_json() throws Exception {
        mockMvc.perform(get("/api/admin/reports").header("Authorization", bearer(newMember(Role.USER))))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("/errors/forbidden"));
    }

    // --- 글 숨김 ---

    @Test
    void 숨기면_200이고_상세는_404_연결한_신고는_RESOLVED() throws Exception {
        Long postId = newPost(newMember(Role.USER));
        Long reportId = reportOf(postId);
        Long other = reportOf(postId);

        mockMvc.perform(post("/api/admin/posts/{id}/hide", postId).header("Authorization", admin())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reportId\":" + reportId + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.postId").value(postId))
                .andExpect(jsonPath("$.status").value("HIDDEN"))
                .andExpect(jsonPath("$.reportId").value(reportId));

        mockMvc.perform(get("/api/posts/{id}", postId)).andExpect(status().isNotFound());
        assertThat(postStatus(postId)).isEqualTo("HIDDEN");
        assertThat(reportStatus(reportId)).isEqualTo("RESOLVED");
        // 연결하지 않은 신고는 그대로 둔다
        assertThat(reportStatus(other)).isEqualTo("OPEN");
    }

    // 캐시를 먼저 채워야 한다. 비어 있으면 DB가 ACTIVE만 읽으므로 캐시를 지우지 않아도 통과해 버린다.
    @Test
    void 숨긴_글은_인기글에서_바로_빠진다() throws Exception {
        Long postId = newPost(newMember(Role.USER));
        jdbc.update("UPDATE post SET like_count = 1000000 WHERE id = ?", postId);
        mockMvc.perform(get("/api/posts/popular"))
                .andExpect(jsonPath("$.items[?(@.id == %d)]", postId).isNotEmpty());
        assertThat(redis.hasKey("popular:posts")).as("캐시가 채워졌다").isTrue();

        mockMvc.perform(post("/api/admin/posts/{id}/hide", postId).header("Authorization", admin()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/posts/popular"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.id == %d)]", postId).isEmpty());
    }

    @Test
    void 본문_없이_숨겨도_200() throws Exception {
        Long postId = newPost(newMember(Role.USER));

        mockMvc.perform(post("/api/admin/posts/{id}/hide", postId).header("Authorization", admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reportId").doesNotExist());
        assertThat(postStatus(postId)).isEqualTo("HIDDEN");
    }

    @Test
    void 없는_글_삭제된_글은_404() throws Exception {
        Long deleted = insertPost(newMember(Role.USER), "삭제", "내용", "DELETED");
        String token = admin();

        for (Long postId : new Long[] {999_999_999L, deleted}) {
            mockMvc.perform(post("/api/admin/posts/{id}/hide", postId).header("Authorization", token))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.type").value("/errors/not-found"));
        }
        assertThat(postStatus(deleted)).isEqualTo("DELETED");
    }

    @Test
    void 없는_신고나_다른_글의_신고를_연결하면_404이고_글은_그대로() throws Exception {
        Long postId = newPost(newMember(Role.USER));
        Long otherPostReport = reportOf(newPost(newMember(Role.USER)));
        String token = admin();

        for (Long reportId : new Long[] {999_999_999L, otherPostReport}) {
            mockMvc.perform(post("/api/admin/posts/{id}/hide", postId).header("Authorization", token)
                            .contentType(MediaType.APPLICATION_JSON).content("{\"reportId\":" + reportId + "}"))
                    .andExpect(status().isNotFound());
        }
        assertThat(postStatus(postId)).isEqualTo("ACTIVE");
        assertThat(reportStatus(otherPostReport)).isEqualTo("OPEN");
    }

    @Test
    void 이미_숨긴_글을_다시_숨기면_200이고_연결한_신고를_RESOLVED로_바꾼다() throws Exception {
        Long postId = newPost(newMember(Role.USER));
        Long first = reportOf(postId);
        Long second = reportOf(postId);
        String token = admin();
        mockMvc.perform(post("/api/admin/posts/{id}/hide", postId).header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON).content("{\"reportId\":" + first + "}"));

        mockMvc.perform(post("/api/admin/posts/{id}/hide", postId).header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reportId\":" + second + "}"))
                .andExpect(status().isOk());

        assertThat(reportStatus(second)).isEqualTo("RESOLVED");
        assertThat(postStatus(postId)).isEqualTo("HIDDEN");
    }

    @Test
    void USER_토큰으로_숨기면_403이고_글은_그대로() throws Exception {
        Long postId = newPost(newMember(Role.USER));

        mockMvc.perform(post("/api/admin/posts/{id}/hide", postId).header("Authorization", bearer(newMember(Role.USER))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.type").value("/errors/forbidden"));
        assertThat(postStatus(postId)).isEqualTo("ACTIVE");
    }

    // --- 메서드 보안 (URL 규칙과 이중 방어) ---

    // 함정 가드: @PreAuthorize를 안쪽 메서드로 옮겨 같은 클래스 안에서 부르게 바꾸면 public 진입점이 USER에게 열려 이 테스트가 실패한다
    @Test
    void USER로_AdminService의_public_메서드를_직접_부르면_모두_막힌다() throws Exception {
        Long postId = newPost(newMember(Role.USER));
        authenticate(Role.USER);

        List<Method> methods = publicMethods(AdminService.class);
        assertThat(methods).isNotEmpty();
        for (Method m : methods) {
            Throwable thrown = catchThrowable(() -> invokeWithDefaults(adminService, m, postId));
            assertThat(thrown).as(m.getName()).isInstanceOf(AccessDeniedException.class);
        }
        assertThat(postStatus(postId)).isEqualTo("ACTIVE");
    }

    static void authenticate(Role role) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new AuthMember(1L, role), null, List.of(new SimpleGrantedAuthority("ROLE_" + role.name()))));
    }

    static List<Method> publicMethods(Class<?> type) {
        return java.util.Arrays.stream(type.getDeclaredMethods())
                .filter(m -> Modifier.isPublic(m.getModifiers()) && !Modifier.isStatic(m.getModifiers()))
                .toList();
    }

    /** Long 인자에는 실제 글 id를, 나머지는 기본값을 넣는다. 거부되면 본문까지 가지 않으므로 값은 중요하지 않다. */
    static Object invokeWithDefaults(Object target, Method m, Long id) throws Throwable {
        Object[] args = new Object[m.getParameterCount()];
        Class<?>[] types = m.getParameterTypes();
        for (int i = 0; i < args.length; i++) {
            if (types[i] == Long.class) {
                args[i] = id;
            } else if (types[i] == int.class) {
                args[i] = 20;
            } else if (types[i].isEnum()) {
                args[i] = types[i].getEnumConstants()[0];
            }
        }
        try {
            return m.invoke(target, args);
        } catch (InvocationTargetException e) {
            throw e.getCause();
        }
    }
}
