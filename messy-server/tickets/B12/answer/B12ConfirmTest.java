package com.example.board.tickets;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * B12 확인: 브라우저가 보내는 preflight(OPTIONS + Origin + Access-Control-Request-*)를 그대로 흉내 낸다.
 * spec-v2 3절의 두 출처(기존 localhost:3000, 새 127.0.0.1:8765)는 인증 없이 통과하고, 목록에 없는 출처는 허용 헤더를 받지 못한다.
 */
class B12ConfirmTest extends ApiTestSupport {

    static final String OLD_FRONT = "http://localhost:3000";
    static final String NEW_FRONT = "http://127.0.0.1:8765";
    static final String EVIL = "http://evil.example";

    MockHttpServletResponse preflight(String path, String origin) throws Exception {
        return mockMvc.perform(options(path).header("Origin", origin)
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andReturn().getResponse();
    }

    @Test
    void 새_프론트_출처의_글쓰기_preflight는_인증_없이_200이고_허용_헤더를_돌려준다() throws Exception {
        MockHttpServletResponse r = preflight("/api/posts", NEW_FRONT);

        assertThat(r.getStatus()).isEqualTo(200);
        assertThat(r.getHeader("Access-Control-Allow-Origin")).isEqualTo(NEW_FRONT);
        assertThat(r.getHeader("Access-Control-Allow-Methods")).contains("POST");
        assertThat(r.getHeader("Access-Control-Allow-Headers").toLowerCase()).contains("authorization", "content-type");
    }

    @Test
    void 새_프론트_출처의_로그인_preflight도_200이다() throws Exception {
        MockHttpServletResponse r = preflight("/api/auth/login", NEW_FRONT);

        assertThat(r.getStatus()).isEqualTo(200);
        assertThat(r.getHeader("Access-Control-Allow-Origin")).isEqualTo(NEW_FRONT);
    }

    @Test
    void 기존_프론트_출처는_그대로_200이다() throws Exception {
        MockHttpServletResponse r = preflight("/api/posts", OLD_FRONT);

        assertThat(r.getStatus()).isEqualTo(200);
        assertThat(r.getHeader("Access-Control-Allow-Origin")).isEqualTo(OLD_FRONT);
    }

    @Test
    void 목록에_없는_출처는_허용_헤더를_받지_못한다() throws Exception {
        MockHttpServletResponse r = preflight("/api/posts", EVIL);

        assertThat(r.getStatus()).isNotEqualTo(200);
        assertThat(r.getHeader("Access-Control-Allow-Origin")).isNull();
    }

    @Test
    void 새_프론트_출처의_실제_글쓰기_응답에도_허용_출처_헤더가_붙는다() throws Exception {
        Member writer = newMember(Role.USER);

        MockHttpServletResponse r = mockMvc.perform(post("/api/posts").header("Origin", NEW_FRONT)
                        .header("Authorization", bearer(writer))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"새 프론트에서\",\"content\":\"내용\"}"))
                .andReturn().getResponse();

        assertThat(r.getStatus()).isEqualTo(201);
        assertThat(r.getHeader("Access-Control-Allow-Origin")).isEqualTo(NEW_FRONT);
    }
}
