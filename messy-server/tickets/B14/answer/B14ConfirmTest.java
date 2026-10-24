package com.example.board.tickets;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * B14 확인: 운영 설정(application-prod.yml의 노출 설정 그대로)으로 띄웠을 때 /actuator/health만 공개이고,
 * env·metrics 같은 나머지 엔드포인트는 토큰 없이 401, 일반 회원 403, 관리자 200이다(spec-v2 3절).
 * 관리자에게도 env의 비밀값은 평문으로 보이지 않는다.
 * DB·Redis·PG 접속은 테스트 컨테이너를 쓰고, 운영 yml의 비밀값 자리표시자만 테스트 값으로 채운다.
 */
@SpringBootTest(properties = {
        "DB_URL=jdbc:mysql://overridden-by-testcontainers/board",
        "DB_USERNAME=board",
        "DB_PASSWORD=" + B14ConfirmTest.DB_PASSWORD,
        "BOARD_JWT_SECRET=" + B14ConfirmTest.JWT_SECRET,
        "BOARD_PG_SECRET=" + B14ConfirmTest.PG_SECRET,
        "BOARD_PG_BASE_URL=http://overridden-by-testcontainers"})
@ActiveProfiles("prod")
class B14ConfirmTest extends ApiTestSupport {

    static final String DB_PASSWORD = "b14-test-only-db-password";
    static final String JWT_SECRET = "b14-test-only-jwt-secret-b14-test-only";
    static final String PG_SECRET = "b14-test-only-pg-secret-b14-test-only-pg";

    @Test
    void 운영에서_토큰_없는_actuator_env는_401이다() throws Exception {
        mockMvc.perform(get("/actuator/env")).andExpect(status().isUnauthorized());
    }

    @Test
    void 운영에서_토큰_없는_actuator_metrics도_401이다() throws Exception {
        mockMvc.perform(get("/actuator/metrics")).andExpect(status().isUnauthorized());
    }

    @Test
    void 운영에서_일반_회원의_actuator_env는_403이다() throws Exception {
        Member user = newMember(Role.USER);

        mockMvc.perform(get("/actuator/env").header("Authorization", bearer(user))).andExpect(status().isForbidden());
    }

    @Test
    void 운영에서_관리자는_actuator_env를_볼_수_있다() throws Exception {
        Member admin = newMember(Role.ADMIN);

        mockMvc.perform(get("/actuator/env").header("Authorization", bearer(admin))).andExpect(status().isOk());
    }

    @Test
    void 관리자_env_응답에도_비밀값은_평문으로_실리지_않는다() throws Exception {
        Member admin = newMember(Role.ADMIN);

        String body = mockMvc.perform(get("/actuator/env").header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertThat(body).doesNotContain(DB_PASSWORD, JWT_SECRET, PG_SECRET);
    }

    @Test
    void 운영에서_일반_회원의_actuator_metrics는_403이고_관리자는_200이다() throws Exception {
        Member user = newMember(Role.USER);
        Member admin = newMember(Role.ADMIN);

        mockMvc.perform(get("/actuator/metrics").header("Authorization", bearer(user))).andExpect(status().isForbidden());
        mockMvc.perform(get("/actuator/metrics").header("Authorization", bearer(admin))).andExpect(status().isOk());
    }

    @Test
    void 운영에서도_health는_토큰_없이_200이다() throws Exception {
        mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }
}
