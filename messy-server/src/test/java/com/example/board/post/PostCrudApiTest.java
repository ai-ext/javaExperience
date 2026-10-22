package com.example.board.post;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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

    @Test
    void 작성자의_PUT은_200이고_DB에_반영된다() throws Exception {
        Member author = newMember(Role.USER);
        Long postId = newPost(author);

        mockMvc.perform(put("/api/posts/{id}", postId).header("Authorization", bearer(author))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"새 제목\",\"content\":\"새 내용\",\"tags\":[\"x1\",\"y1\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("새 제목"))
                .andExpect(jsonPath("$.tags.length()").value(2));

        // save()를 부르지 않아도 변경 감지로 커밋 시점에 UPDATE가 나간다
        assertThat(jdbc.queryForObject("SELECT title FROM post WHERE id = ?", String.class, postId)).isEqualTo("새 제목");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM post_tag WHERE post_id = ?", Integer.class, postId))
                .isEqualTo(2);
    }

    @Test
    void PUT으로_태그를_바꿔도_겹치는_태그는_유지된다() throws Exception {
        Member author = newMember(Role.USER);
        Long postId = newPost(author);
        String h = bearer(author);
        for (String body : new String[] {"{\"title\":\"t\",\"content\":\"c\",\"tags\":[\"k1\",\"k2\"]}",
                "{\"title\":\"t\",\"content\":\"c\",\"tags\":[\"k2\",\"k3\"]}"}) {
            mockMvc.perform(put("/api/posts/{id}", postId).header("Authorization", h)
                    .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk());
        }
        assertThat(jdbc.queryForList("SELECT t.name FROM post_tag pt JOIN tag t ON t.id = pt.tag_id"
                + " WHERE pt.post_id = ? ORDER BY t.name", String.class, postId)).containsExactly("k2", "k3");
    }

    @Test
    void PATCH는_제목만_바꾸고_본문은_그대로() throws Exception {
        Member author = newMember(Role.USER);
        Long postId = newPost(author);

        mockMvc.perform(patch("/api/posts/{id}", postId).header("Authorization", bearer(author))
                .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"바뀐 제목\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("바뀐 제목"))
                .andExpect(jsonPath("$.content").value("내용"));
    }

    @Test
    void PATCH_빈_본문은_400() throws Exception {
        Member author = newMember(Role.USER);
        Long postId = newPost(author);

        mockMvc.perform(patch("/api/posts/{id}", postId).header("Authorization", bearer(author))
                .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("/errors/validation"));
    }

    @Test
    void PATCH_공백_제목은_400() throws Exception {
        Member author = newMember(Role.USER);
        Long postId = newPost(author);

        mockMvc.perform(patch("/api/posts/{id}", postId).header("Authorization", bearer(author))
                .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"  \"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void DELETE는_204이고_이후_GET은_404() throws Exception {
        Member author = newMember(Role.USER);
        Long postId = newPost(author);

        mockMvc.perform(delete("/api/posts/{id}", postId).header("Authorization", bearer(author)))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/posts/{id}", postId)).andExpect(status().isNotFound());
        // 소프트 삭제라 행은 남는다
        assertThat(jdbc.queryForObject("SELECT status FROM post WHERE id = ?", String.class, postId))
                .isEqualTo("DELETED");
    }

    @Test
    void 남의_글_PUT은_403() throws Exception {
        Long postId = newPost(newMember(Role.USER));

        mockMvc.perform(put("/api/posts/{id}", postId).header("Authorization", bearer(newMember(Role.USER)))
                .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"t\",\"content\":\"c\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.type").value("/errors/forbidden"));
    }

    @Test
    void 남의_글_DELETE는_403() throws Exception {
        Long postId = newPost(newMember(Role.USER));

        mockMvc.perform(delete("/api/posts/{id}", postId).header("Authorization", bearer(newMember(Role.USER))))
                .andExpect(status().isForbidden());
    }

    @Test
    void 삭제된_글_PUT은_404() throws Exception {
        Member author = newMember(Role.USER);
        Long postId = newPost(author);
        jdbc.update("UPDATE post SET status = 'DELETED' WHERE id = ?", postId);

        mockMvc.perform(put("/api/posts/{id}", postId).header("Authorization", bearer(author))
                .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"t\",\"content\":\"c\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("/errors/not-found"));
    }

    @Test
    void 토큰_없는_PUT은_401() throws Exception {
        mockMvc.perform(put("/api/posts/1").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"t\",\"content\":\"c\"}"))
                .andExpect(status().isUnauthorized());
    }

    // 경로 변수 검증(@Positive)이 있는 메서드는 본문 검증 오류도 같은 형식(field=필드명)이어야 한다
    @Test
    void PUT_공백_제목은_400이고_errors의_field는_title() throws Exception {
        Member author = newMember(Role.USER);
        Long postId = newPost(author);

        mockMvc.perform(put("/api/posts/{id}", postId).header("Authorization", bearer(author))
                .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"  \",\"content\":\"c\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("title"));
    }
}
