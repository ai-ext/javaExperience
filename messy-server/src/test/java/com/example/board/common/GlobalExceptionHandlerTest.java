package com.example.board.common;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

import com.example.board.TestcontainersConfig;
import com.example.board.admin.AdminService;
import com.example.board.admin.ReportStatus;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import({TestcontainersConfig.class, GlobalExceptionHandlerTest.Probe.class})
@ActiveProfiles("test")
@AutoConfigureMockMvc
class GlobalExceptionHandlerTest {

    @Autowired
    MockMvc mockMvc;

    record Body(@NotBlank String title) {
    }

    @RestController
    static class ProbeController {

        private final AdminService adminService;

        ProbeController(AdminService adminService) {
            this.adminService = adminService;
        }

        // URL 규칙(/api/admin/**)이 아니라 메서드 보안(@PreAuthorize)에서 막히는 경로
        @GetMapping("/test/method-security")
        Object methodSecurity() {
            return adminService.reports(ReportStatus.OPEN, null, 20);
        }
        @GetMapping("/test/not-found")
        void notFound() {
            throw new BusinessException(ErrorCode.NOT_FOUND, "없음");
        }

        @GetMapping("/test/illegal")
        void illegal() {
            throw new IllegalArgumentException("서버 버그");
        }

        @PostMapping("/test/validate")
        void validate(@Valid @RequestBody Body body) {
        }
    }

    @TestConfiguration
    static class Probe {
        @Bean
        ProbeController probeController(AdminService adminService) {
            return new ProbeController(adminService);
        }
    }

    @Test
    void 없는_경로는_404_problem_json() throws Exception {
        mockMvc.perform(get("/api/unknown").with(user("u")))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.instance").value("/api/unknown"));
    }

    @Test
    void BusinessException_NOT_FOUND는_404_type() throws Exception {
        mockMvc.perform(get("/test/not-found").with(user("u")))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("/errors/not-found"))
                .andExpect(jsonPath("$.detail").value("없음"))
                .andExpect(jsonPath("$.instance").value("/test/not-found"));
    }

    @Test
    void 검증_실패는_400_errors_배열() throws Exception {
        mockMvc.perform(post("/test/validate").with(user("u")).contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("/errors/validation"))
                .andExpect(jsonPath("$.errors[0].field").value("title"))
                .andExpect(jsonPath("$.errors[0].reason").isNotEmpty());
    }

    @Test
    void IllegalArgumentException은_400이_아니라_500() throws Exception {
        mockMvc.perform(get("/test/illegal").with(user("u")))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
    }

    // 메서드 보안 거부는 컨트롤러 안에서 난다. Exception 핸들러에 먹히면 500이 된다.
    @Test
    void 메서드_보안에서_막히면_403_problem_json() throws Exception {
        mockMvc.perform(get("/test/method-security").with(user("u").roles("USER")))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("/errors/forbidden"))
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.instance").value("/test/method-security"));
    }

    @Test
    void health_200() throws Exception {
        mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }
}
