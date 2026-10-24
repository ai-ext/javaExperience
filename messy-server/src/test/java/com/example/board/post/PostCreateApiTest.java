package com.example.board.post;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.example.board.TestcontainersConfig;
import com.example.board.config.JwtProvider;
import com.example.board.member.Member;
import com.example.board.member.MemberRepository;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
@AutoConfigureMockMvc
class PostCreateApiTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    MemberRepository memberRepository;

    @Autowired
    JwtProvider jwtProvider;

    @Autowired
    JdbcTemplate jdbc;

    String token() {
        Member member = memberRepository.saveAndFlush(Member.create(UUID.randomUUID() + "@t.com", "hash",
                "m" + UUID.randomUUID().toString().replace("-", "").substring(0, 10), Role.USER));
        return "Bearer " + jwtProvider.issue(member.getId(), Role.USER);
    }

    org.springframework.test.web.servlet.ResultActions create(String token, String body) throws Exception {
        var req = post("/api/posts").contentType(MediaType.APPLICATION_JSON).content(body);
        if (token != null) {
            req = req.header("Authorization", token);
        }
        return mockMvc.perform(req);
    }

    @Test
    void 정상_요청은_201과_Location() throws Exception {
        MvcResult result = create(token(), "{\"title\":\"제목\",\"content\":\"내용\",\"tags\":[\"java\"]}")
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.matchesPattern("/api/posts/\\d+")))
                .andReturn();

        String location = result.getResponse().getHeader("Location");
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM post WHERE id = ?", Integer.class,
                Long.parseLong(location.substring(location.lastIndexOf('/') + 1)));
        assertThat(count).isEqualTo(1);
    }

    @Test
    void 토큰이_없으면_401() throws Exception {
        create(null, "{\"title\":\"제목\",\"content\":\"내용\"}").andExpect(status().isUnauthorized());
    }

    @Test
    void 제목이_공백만이면_400_errors의_field는_title() throws Exception {
        create(token(), "{\"title\":\"   \",\"content\":\"내용\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("/errors/validation"))
                .andExpect(jsonPath("$.errors[0].field").value("title"));
    }

    @Test
    void 태그_6개면_400() throws Exception {
        create(token(), "{\"title\":\"제목\",\"content\":\"내용\",\"tags\":[\"a\",\"b\",\"c\",\"d\",\"e\",\"f\"]}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("tags"));
    }

    @Test
    void 태그가_21자면_400() throws Exception {
        create(token(), "{\"title\":\"제목\",\"content\":\"내용\",\"tags\":[\"" + "a".repeat(21) + "\"]}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("tags[0]"));
    }

    @Test
    void 내용이_없으면_400() throws Exception {
        create(token(), "{\"title\":\"제목\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("content"));
    }

    @Test
    void 태그_중복은_제거된다() throws Exception {
        String dup = "d" + UUID.randomUUID().toString().substring(0, 8);
        MvcResult result = create(token(), "{\"title\":\"제목\",\"content\":\"내용\",\"tags\":[\"" + dup + "\",\"" + dup + "\"]}")
                .andExpect(status().isCreated()).andReturn();

        String location = result.getResponse().getHeader("Location");
        Integer links = jdbc.queryForObject("SELECT COUNT(*) FROM post_tag WHERE post_id = ?", Integer.class,
                Long.parseLong(location.substring(location.lastIndexOf('/') + 1)));
        assertThat(links).isEqualTo(1);
    }
}
