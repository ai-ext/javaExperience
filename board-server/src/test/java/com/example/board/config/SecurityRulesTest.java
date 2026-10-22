package com.example.board.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.example.board.TestcontainersConfig;
import com.example.board.member.Role;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
@AutoConfigureMockMvc
class SecurityRulesTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    JwtProvider jwtProvider;

    @Test
    void health는_토큰_없이_200() throws Exception {
        mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }

    @Test
    void 토큰_없는_me는_401_problem_json() throws Exception {
        mockMvc.perform(get("/api/members/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("/errors/unauthorized"))
                .andExpect(jsonPath("$.instance").value("/api/members/me"));
    }

    @Test
    void actuator_env는_401() throws Exception {
        mockMvc.perform(get("/actuator/env")).andExpect(status().isUnauthorized());
    }

    @Test
    void 미등록_경로는_401() throws Exception {
        mockMvc.perform(get("/api/never-registered"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.type").value("/errors/unauthorized"));
    }

    @Test
    void 잘못된_토큰이어도_공개_경로는_통과한다() throws Exception {
        mockMvc.perform(get("/actuator/health").header("Authorization", "Bearer garbage"))
                .andExpect(status().isOk());
    }

    @Test
    void 잘못된_토큰으로_보호_경로는_401() throws Exception {
        mockMvc.perform(get("/api/members/me").header("Authorization", "Bearer garbage"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.type").value("/errors/unauthorized"));
    }

    @Test
    void preflight는_인증_없이_200_허용_출처를_돌려준다() throws Exception {
        for (String origin : new String[] {"http://localhost:3000", "http://127.0.0.1:8765"}) {
            mockMvc.perform(options("/api/posts").header("Origin", origin)
                            .header("Access-Control-Request-Method", "POST")
                            .header("Access-Control-Request-Headers", "authorization,content-type"))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Access-Control-Allow-Origin", origin));
        }
    }

    @Test
    void 로그인_preflight도_200() throws Exception {
        mockMvc.perform(options("/api/auth/login").header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
    }

    @Test
    void 허용_목록에_없는_출처의_preflight는_403() throws Exception {
        mockMvc.perform(options("/api/auth/login").header("Origin", "http://evil.example")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden());
    }

    @Test
    void 허용_출처의_실제_POST_응답에도_CORS_헤더가_붙는다() throws Exception {
        mockMvc.perform(post("/api/auth/login").header("Origin", "http://127.0.0.1:8765")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"x@t.com\",\"password\":\"pw\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://127.0.0.1:8765"));
    }

    @Test
    void ADMIN_토큰은_admin_경로의_인가를_통과한다() throws Exception {
        // 컨트롤러는 D10에 생기므로 지금은 404. 401·403이 아니면 인가는 통과한 것이다
        mockMvc.perform(get("/api/admin/reports").header("Authorization", "Bearer " + jwtProvider.issue(1L, Role.ADMIN)))
                .andExpect(status().isNotFound());
    }

    @Test
    void 공개_GET은_토큰_없이_인증에_막히지_않는다() throws Exception {
        for (String path : new String[] {"/api/posts", "/api/posts/popular", "/api/posts/1", "/api/posts/1/comments",
                "/api/rankings/activity", "/api/shop/items"}) {
            // 컨트롤러가 생기면 404가 405 등으로 바뀐다. 401·403이 아니면 인증은 통과한 것이다
            int status = mockMvc.perform(get(path)).andReturn().getResponse().getStatus();
            org.assertj.core.api.Assertions.assertThat(status).as(path).isNotIn(401, 403);
        }
    }

    @Test
    void 공개_경로가_아닌_쓰기는_401() throws Exception {
        mockMvc.perform(post("/api/posts").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }
}
