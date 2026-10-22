package com.example.board.tickets;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * B14 확인: 운영 설정(application-prod.yml의 노출 설정 그대로)으로 띄웠을 때 /actuator/health만 공개이고,
 * env·metrics 같은 나머지 엔드포인트는 토큰 없이 401, 일반 회원 403, 관리자 200이다(spec-v2 3절).
 * DB·Redis·PG 접속은 테스트 컨테이너를 쓰고, 운영 yml의 비밀값 자리표시자만 테스트 값으로 채운다.
 */
@SpringBootTest(properties = {
        "DB_URL=jdbc:mysql://overridden-by-testcontainers/board",
        "DB_USERNAME=board",
        "DB_PASSWORD=b14-test-only",
        "BOARD_JWT_SECRET=b14-test-only-jwt-secret-b14-test-only",
        "BOARD_PG_SECRET=b14-test-only-pg-secret-b14-test-only-pg",
        "BOARD_PG_BASE_URL=http://overridden-by-testcontainers"})
@ActiveProfiles("prod")
class B14ConfirmTest extends ApiTestSupport {

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
    void 운영에서도_health는_토큰_없이_200이다() throws Exception {
        mockMvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }
}
