package com.example.board.admin;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.example.board.common.CursorPage;
import com.example.board.config.CorsConfig;
import com.example.board.config.JwtProvider;
import com.example.board.config.ProblemDetailSecurityHandler;
import com.example.board.config.SecurityConfig;
import com.example.board.member.AuthMember;
import com.example.board.member.Role;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * 웹 계층만 띄운 권한 슬라이스 테스트(DB 없음). 서비스는 목이라 메서드 보안이 아니라 URL 규칙(/api/admin/**)을 확인한다.
 * SecurityConfig는 스캔되지 않으므로 직접 가져온다. 안 가져오면 Boot 기본 보안이 떠서 다른 이유로 막힌다.
 */
@WebMvcTest(AdminController.class)
@Import({SecurityConfig.class, ProblemDetailSecurityHandler.class, CorsConfig.class})
@ActiveProfiles("test")
class AdminControllerTest {

    static final String USER_TOKEN = "Bearer user-token";
    static final String ADMIN_TOKEN = "Bearer admin-token";

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    AdminService adminService;

    @MockitoBean
    CouponBulkIssueService couponBulkIssueService;

    @MockitoBean
    JwtProvider jwtProvider;

    @BeforeEach
    void tokens() {
        given(jwtProvider.parse("user-token")).willReturn(new AuthMember(1L, Role.USER));
        given(jwtProvider.parse("admin-token")).willReturn(new AuthMember(2L, Role.ADMIN));
    }

    @Test
    void USER_토큰으로_신고_목록은_403_problem_json이고_서비스까지_가지_않는다() throws Exception {
        mockMvc.perform(get("/api/admin/reports").header("Authorization", USER_TOKEN))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("/errors/forbidden"))
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.instance").value("/api/admin/reports"));

        verifyNoInteractions(adminService);
    }

    @Test
    void ADMIN_토큰으로_신고_목록은_200() throws Exception {
        given(adminService.reports(any(), any(), anyInt())).willReturn(new CursorPage<>(List.of(), null));

        mockMvc.perform(get("/api/admin/reports").header("Authorization", ADMIN_TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty());
    }

    @Test
    void 토큰이_없으면_401() throws Exception {
        mockMvc.perform(get("/api/admin/reports"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.type").value("/errors/unauthorized"));
    }

    @Test
    void USER_토큰은_숨김_대량_지급_감사_로그도_403() throws Exception {
        mockMvc.perform(post("/api/admin/posts/1/hide").header("Authorization", USER_TOKEN))
                .andExpect(status().isForbidden());
        mockMvc.perform(multipart("/api/admin/coupons/1/bulk-issue")
                        .file(new MockMultipartFile("file", "m.xlsx", null, new byte[] {1}))
                        .header("Authorization", USER_TOKEN))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/audit-logs").header("Authorization", USER_TOKEN))
                .andExpect(status().isForbidden());

        verifyNoInteractions(adminService, couponBulkIssueService);
    }
}
