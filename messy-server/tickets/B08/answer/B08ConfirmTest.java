package com.example.board.tickets;

import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * B08 확인: GET /api/members/me 응답은 spec-v2의 다섯 필드(id, email, nickname, role, createdAt)뿐이고
 * 비밀번호 해시는 어떤 이름으로도 실리지 않는다.
 */
class B08ConfirmTest extends ApiTestSupport {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    @Autowired
    PasswordEncoder passwordEncoder;

    Member savedMember() {
        return memberRepository.saveAndFlush(Member.create(UUID.randomUUID() + "@t.com", passwordEncoder.encode("password1"),
                "m" + UUID.randomUUID().toString().replace("-", "").substring(0, 10), Role.USER));
    }

    @Test
    void 내_정보_응답에_비밀번호_해시가_없다() throws Exception {
        Member member = savedMember();

        String body = mockMvc.perform(get("/api/members/me").header("Authorization", bearer(member)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        // 필드 이름을 바꿔 내보내도 걸리도록 해시 값 자체가 본문에 없는지 본다
        assertThat(body).doesNotContain(member.getPasswordHash());
        assertThat(body.toLowerCase()).doesNotContain("password");
    }

    @Test
    void 내_정보_응답은_spec의_다섯_필드뿐이다() throws Exception {
        Member member = savedMember();

        String body = mockMvc.perform(get("/api/members/me").header("Authorization", bearer(member)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        JsonNode json = JSON.readTree(body);

        Set<String> fields = new TreeSet<>();
        json.properties().forEach(e -> fields.add(e.getKey()));
        assertThat(fields).containsExactlyInAnyOrder("id", "email", "nickname", "role", "createdAt");
        assertThat(json.get("id").asLong()).isEqualTo(member.getId());
        assertThat(json.get("email").asString()).isEqualTo(member.getEmail());
        assertThat(json.get("nickname").asString()).isEqualTo(member.getNickname());
        assertThat(json.get("role").asString()).isEqualTo("USER");
        // spec-v2: 시각은 KST 오프셋을 붙인 ISO-8601
        assertThat(json.get("createdAt").asString()).endsWith("+09:00");
    }
}
