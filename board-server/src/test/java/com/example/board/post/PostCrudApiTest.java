package com.example.board.post;

import org.junit.jupiter.api.Test;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PostCrudApiTest extends ApiTestSupport {

    @Test
    void 토큰_없이_상세_조회는_200() throws Exception {
        Member author = newMember(Role.USER);
        Long postId = newPost(author);

        mockMvc.perform(get("/api/posts/{id}", postId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(postId))
                .andExpect(jsonPath("$.authorId").value(author.getId()))
                .andExpect(jsonPath("$.title").value("제목"));
    }

    @Test
    void 없는_글은_404() throws Exception {
        mockMvc.perform(get("/api/posts/{id}", 999_999_999L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("/errors/not-found"));
    }

    @Test
    void postId_0은_400() throws Exception {
        mockMvc.perform(get("/api/posts/0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("/errors/validation"));
    }

    // 함정: 작성자·태그를 지연 로딩하면 쿼리가 추가로 나간다. fetch join 한 번이어야 한다.
    @Test
    void 태그가_여럿인_글_상세도_SQL_1번() throws Exception {
        Member author = newMember(Role.USER);
        Long postId = newPost(author);
        for (String name : new String[] {"a1", "b1", "c1"}) {
            jdbc.update("INSERT IGNORE INTO tag (name, created_at, updated_at) VALUES (?, NOW(6), NOW(6))", name);
            jdbc.update("INSERT INTO post_tag (post_id, tag_id, created_at, updated_at)"
                    + " SELECT ?, id, NOW(6), NOW(6) FROM tag WHERE name = ?", postId, name);
        }
        statistics().clear();

        mockMvc.perform(get("/api/posts/{id}", postId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tags.length()").value(3));

        assertThat(statistics().getPrepareStatementCount()).isEqualTo(1);
    }
}
