package com.example.board.post;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.ResultActions;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PostListApiTest extends ApiTestSupport {

    Member author;

    @BeforeEach
    void setUp() {
        clearPosts();
        author = newMember(Role.USER);
    }

    ResultActions list(String... kv) throws Exception {
        var req = get("/api/posts");
        for (int i = 0; i < kv.length; i += 2) {
            req = req.param(kv[i], kv[i + 1]);
        }
        return mockMvc.perform(req);
    }

    @Test
    void 인증_없이_200과_items_nextCursor() throws Exception {
        insertPost(author, "제목", "내용", "ACTIVE");

        list().andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].title").value("제목"))
                .andExpect(jsonPath("$.items[0].authorId").value(author.getId()))
                .andExpect(jsonPath("$.items[0].tags", hasSize(0)))
                .andExpect(jsonPath("$.nextCursor").value(nullValue()));
    }

    @Test
    void 스물다섯_건은_20건과_커서_다음_5건과_null() throws Exception {
        for (int i = 0; i < 25; i++) {
            insertPost(author, "제목" + i, "내용", "ACTIVE");
        }

        String body = list().andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(20)))
                .andExpect(jsonPath("$.nextCursor").isString())
                .andReturn().getResponse().getContentAsString();
        String cursor = com.jayway.jsonpath.JsonPath.read(body, "$.nextCursor");

        list("cursor", cursor).andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(5)))
                .andExpect(jsonPath("$.nextCursor").value(nullValue()));
    }

    @Test
    void size가_범위를_벗어나면_400() throws Exception {
        list("size", "51").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("/errors/validation"));
        list("size", "0").andExpect(status().isBadRequest());
        list("size", "abc").andExpect(status().isBadRequest());
        list("size", "50").andExpect(status().isOk());
    }

    @Test
    void keyword_길이_위반은_400() throws Exception {
        list("keyword", "a").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("/errors/validation"))
                .andExpect(jsonPath("$.errors[0].field").value("keyword"));
        list("keyword", "a".repeat(51)).andExpect(status().isBadRequest());
        list("keyword", "ab").andExpect(status().isOk());
    }

    @Test
    void tag_길이_위반은_400() throws Exception {
        list("tag", "").andExpect(status().isBadRequest());
        list("tag", "t".repeat(21)).andExpect(status().isBadRequest());
    }

    @Test
    void sort는_latest만_허용한다() throws Exception {
        list("sort", "title").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("sort"));
        list("sort", "latest").andExpect(status().isOk());
    }

    @Test
    void 잘못된_cursor는_400() throws Exception {
        list("cursor", "!!!").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("/errors/validation"));
    }

    @Test
    void tag로_그_태그의_글만_거른다() throws Exception {
        Long spring = insertPost(author, "스프링글", "내용", "ACTIVE");
        Long other = insertPost(author, "다른글", "내용", "ACTIVE");
        attachTag(spring, "spring");
        attachTag(other, "java");

        list("tag", "spring").andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].title").value("스프링글"))
                .andExpect(jsonPath("$.items[0].tags", contains("spring")));
    }

    @Test
    void 숨김_삭제_글은_목록에_없다() throws Exception {
        insertPost(author, "보임", "내용", "ACTIVE");
        insertPost(author, "숨김", "내용", "HIDDEN");
        insertPost(author, "삭제", "내용", "DELETED");

        list().andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[*].title", not(contains("숨김"))));
    }
}
