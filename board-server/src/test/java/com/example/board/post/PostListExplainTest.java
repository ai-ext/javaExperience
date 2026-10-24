package com.example.board.post;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.session.SqlSessionFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

class PostListExplainTest extends ApiTestSupport {

    static final String INDEX = "idx_post_status_id";

    @Autowired
    SqlSessionFactory sqlSessionFactory;

    @BeforeEach
    void setUp() {
        clearPosts();
        Member m = newMember(Role.USER);
        // 옵티마이저가 풀스캔 대신 인덱스를 고를 만큼 행을 넣는다. ACTIVE가 아닌 글을 절반 섞는다.
        jdbc.execute("SET SESSION cte_max_recursion_depth = 5000");
        jdbc.update("INSERT INTO post (member_id, title, content, status, like_count, created_at, updated_at)"
                + " WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 4000)"
                + " SELECT ?, CONCAT('제목', i), '내용', IF(i % 2 = 0, 'ACTIVE', 'HIDDEN'), 0, NOW(6), NOW(6) FROM n",
                m.getId());
        jdbc.execute("ANALYZE TABLE post");
    }

    /** 실제 목록 쿼리(첫 쪽, 조건 없음)의 SQL. 값 자리 ?는 LIMIT 하나뿐이다. */
    String listSql() {
        Map<String, Object> params = new HashMap<>();
        params.put("cond", new PostSearchCondition(null, null));
        params.put("afterId", null);
        params.put("limit", 21);
        String sql = sqlSessionFactory.getConfiguration()
                .getMappedStatement("com.example.board.post.PostQueryMapper.search").getBoundSql(params).getSql();
        return sql.replaceAll("\\s+", " ").replace("?", "21");
    }

    Map<String, Object> explainPostRow() {
        List<Map<String, Object>> rows = jdbc.queryForList("EXPLAIN " + listSql());
        return rows.stream().filter(r -> "post".equals(r.get("table"))).findFirst().orElseThrow();
    }

    @Test
    void 목록_쿼리_EXPLAIN의_key는_status_id_인덱스이고_filesort가_없다() {
        Map<String, Object> row = explainPostRow();

        assertThat(row.get("key")).isEqualTo(INDEX);
        assertThat(String.valueOf(row.get("Extra"))).doesNotContain("filesort");
    }

    /** (id, status) 순서로 잡으면 WHERE status = ? ORDER BY id DESC에서 인덱스를 제대로 쓰지 못한다. */
    @Test
    void 인덱스_컬럼_순서는_status_다음_id() {
        List<String> columns = jdbc.queryForList("SELECT column_name FROM information_schema.statistics"
                + " WHERE table_schema = DATABASE() AND table_name = 'post' AND index_name = ?"
                + " ORDER BY seq_in_index", String.class, INDEX);

        assertThat(columns).containsExactly("status", "id");
    }

    @Test
    void 인덱스_전후_목록_응답은_같다() throws Exception {
        String with = mockMvc.perform(get("/api/posts").param("size", "50")).andReturn().getResponse().getContentAsString();
        try {
            jdbc.execute("DROP INDEX " + INDEX + " ON post");
            assertThat(explainPostRow().get("key")).isNotEqualTo(INDEX);
            String without = mockMvc.perform(get("/api/posts").param("size", "50")).andReturn().getResponse()
                    .getContentAsString();
            assertThat(without).isEqualTo(with);
        } finally {
            jdbc.execute("CREATE INDEX " + INDEX + " ON post (status, id)");
        }
    }
}
