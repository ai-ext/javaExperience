package com.example.board.comment;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CommentApiTest extends ApiTestSupport {

    org.springframework.test.web.servlet.ResultActions write(Long postId, Member who, String body) throws Exception {
        var req = post("/api/posts/{id}/comments", postId).contentType(MediaType.APPLICATION_JSON).content(body);
        if (who != null) {
            req = req.header("Authorization", bearer(who));
        }
        return mockMvc.perform(req);
    }

    Long newComment(Long postId, Member who) {
        jdbc.update("INSERT INTO comment (post_id, member_id, content, deleted, created_at, updated_at)"
                + " VALUES (?, ?, '댓글', FALSE, NOW(6), NOW(6))", postId, who.getId());
        return jdbc.queryForObject("SELECT MAX(id) FROM comment WHERE post_id = ?", Long.class, postId);
    }

    @Test
    void 댓글_작성은_201() throws Exception {
        Member m = newMember(Role.USER);
        Long postId = newPost(newMember(Role.USER));

        write(postId, m, "{\"content\":\"안녕\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("안녕"))
                .andExpect(jsonPath("$.authorId").value(m.getId()));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM comment WHERE post_id = ?", Integer.class, postId))
                .isEqualTo(1);
    }

    @Test
    void 댓글_501자는_400이고_빈_내용도_400() throws Exception {
        Member m = newMember(Role.USER);
        Long postId = newPost(m);

        write(postId, m, "{\"content\":\"" + "a".repeat(501) + "\"}").andExpect(status().isBadRequest());
        write(postId, m, "{\"content\":\"\"}").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("content"));
        write(postId, m, "{\"content\":\"" + "a".repeat(500) + "\"}").andExpect(status().isCreated());
    }

    @Test
    void 토큰_없는_댓글_작성은_401() throws Exception {
        write(newPost(newMember(Role.USER)), null, "{\"content\":\"x\"}").andExpect(status().isUnauthorized());
    }

    @Test
    void 삭제된_글에_댓글_작성은_404() throws Exception {
        Member m = newMember(Role.USER);
        Long postId = newPost(m);
        jdbc.update("UPDATE post SET status = 'DELETED' WHERE id = ?", postId);

        write(postId, m, "{\"content\":\"x\"}").andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("/errors/not-found"));
    }

    @Test
    void 없는_글에_댓글_작성은_404() throws Exception {
        write(999_999_999L, newMember(Role.USER), "{\"content\":\"x\"}").andExpect(status().isNotFound());
    }

    // 함정: 댓글마다 작성자를 지연 로딩하면 20개에 SQL 21번(N+1). 작성자가 모두 달라야 드러난다.
    @Test
    void 토큰_없이_댓글_20개_목록은_200이고_SQL_2번_이하() throws Exception {
        Long postId = newPost(newMember(Role.USER));
        for (int i = 0; i < 20; i++) {
            newComment(postId, newMember(Role.USER));
        }
        statistics().clear();

        mockMvc.perform(get("/api/posts/{id}/comments", postId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(20))
                .andExpect(jsonPath("$.items[0].authorNickname").isNotEmpty())
                .andExpect(jsonPath("$.nextCursor").value((Object) null));

        assertThat(statistics().getPrepareStatementCount()).isLessThanOrEqualTo(2);
    }

    @Test
    void 커서로_이어_읽고_삭제된_댓글은_빠진다() throws Exception {
        Member m = newMember(Role.USER);
        Long postId = newPost(m);
        Long c1 = newComment(postId, m);
        Long c2 = newComment(postId, m);
        Long c3 = newComment(postId, m);
        jdbc.update("UPDATE comment SET deleted = TRUE WHERE id = ?", c2);

        String body = mockMvc.perform(get("/api/posts/{id}/comments?size=1", postId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(c1))
                .andReturn().getResponse().getContentAsString();
        String cursor = com.jayway.jsonpath.JsonPath.read(body, "$.nextCursor");

        mockMvc.perform(get("/api/posts/{id}/comments?size=1&cursor={c}", postId, cursor))
                .andExpect(jsonPath("$.items[0].id").value(c3))
                .andExpect(jsonPath("$.nextCursor").value((Object) null));
    }

    @Test
    void 목록_size_0이나_잘못된_cursor는_400() throws Exception {
        Long postId = newPost(newMember(Role.USER));
        mockMvc.perform(get("/api/posts/{id}/comments?size=0", postId)).andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/posts/{id}/comments?size=51", postId)).andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/posts/{id}/comments?cursor=!!", postId)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("/errors/validation"));
    }

    @Test
    void 삭제된_글의_댓글_목록은_404() throws Exception {
        Long postId = newPost(newMember(Role.USER));
        jdbc.update("UPDATE post SET status = 'HIDDEN' WHERE id = ?", postId);
        mockMvc.perform(get("/api/posts/{id}/comments", postId)).andExpect(status().isNotFound());
    }

    @Test
    void 댓글_삭제는_작성자_204_다른_USER_403_ADMIN_204() throws Exception {
        Member author = newMember(Role.USER);
        Long postId = newPost(author);
        Long mine = newComment(postId, author);
        Long other = newComment(postId, author);

        mockMvc.perform(delete("/api/comments/{id}", other).header("Authorization", bearer(newMember(Role.USER))))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.type").value("/errors/forbidden"));
        mockMvc.perform(delete("/api/comments/{id}", mine).header("Authorization", bearer(author)))
                .andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/comments/{id}", other).header("Authorization", bearer(newMember(Role.ADMIN))))
                .andExpect(status().isNoContent());

        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM comment WHERE post_id = ? AND deleted = TRUE",
                Integer.class, postId)).isEqualTo(2);
    }

    @Test
    void 없는_댓글_삭제는_404이고_이미_삭제된_댓글도_404() throws Exception {
        Member m = newMember(Role.USER);
        Long c = newComment(newPost(m), m);
        mockMvc.perform(delete("/api/comments/{id}", 999_999_999L).header("Authorization", bearer(m)))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/comments/{id}", c).header("Authorization", bearer(m)))
                .andExpect(status().isNoContent());
        // 대상 없음(404)이 작성자 검사(403)보다 먼저다
        mockMvc.perform(delete("/api/comments/{id}", c).header("Authorization", bearer(newMember(Role.USER))))
                .andExpect(status().isNotFound());
    }

    @Test
    void 토큰_없는_댓글_삭제는_401() throws Exception {
        mockMvc.perform(delete("/api/comments/1")).andExpect(status().isUnauthorized());
    }
}
