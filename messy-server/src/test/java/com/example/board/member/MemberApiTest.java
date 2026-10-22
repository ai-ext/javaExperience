package com.example.board.member;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.example.board.TestcontainersConfig;
import com.example.board.config.BoardProperties;
import com.example.board.config.JwtProvider;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
@AutoConfigureMockMvc
class MemberApiTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    MemberRepository memberRepository;

    @Autowired
    JwtProvider jwtProvider;

    @Autowired
    BoardProperties properties;

    @Autowired
    PasswordEncoder passwordEncoder;

    Member saveMember() {
        return memberRepository.saveAndFlush(Member.create(UUID.randomUUID() + "@t.com", passwordEncoder.encode("password1"),
                "m" + UUID.randomUUID().toString().replace("-", "").substring(0, 10), Role.USER));
    }

    @Test
    void me는_내_정보를_돌려준다() throws Exception {
        Member member = saveMember();

        mockMvc.perform(get("/api/members/me").header("Authorization", "Bearer " + jwtProvider.issue(member.getId(), Role.USER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(member.getId()))
                .andExpect(jsonPath("$.email").value(member.getEmail()))
                .andExpect(jsonPath("$.nickname").value(member.getNickname()))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void 만료_토큰은_401() throws Exception {
        Member member = saveMember();
        Clock past = Clock.fixed(Instant.now().minus(Duration.ofHours(2)), ZoneOffset.UTC);
        // 시계를 주입한 별도 인스턴스로 이미 만료된 토큰을 만든다
        String expired = new JwtProvider(properties, past).issue(member.getId(), Role.USER);

        mockMvc.perform(get("/api/members/me").header("Authorization", "Bearer " + expired))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("/errors/unauthorized"));
    }

    @Test
    void USER_토큰으로_admin_경로는_403_forbidden() throws Exception {
        Member member = saveMember();

        mockMvc.perform(get("/api/admin/reports").header("Authorization", "Bearer " + jwtProvider.issue(member.getId(), Role.USER)))
                .andExpect(status().isForbidden())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("/errors/forbidden"));
    }
}
