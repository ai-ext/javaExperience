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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
@AutoConfigureMockMvc
class SecurityRulesTest {

    @Autowired
    MockMvc mockMvc;

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
}
