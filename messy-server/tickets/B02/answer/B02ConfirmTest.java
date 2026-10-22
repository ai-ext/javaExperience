package com.example.board.tickets;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.ParameterMapping;
import org.apache.ibatis.session.SqlSessionFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;
import com.example.board.post.PostSearchCondition;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

/**
 * B02 확인 테스트: 최근 글이 대부분 숨김(스팸 일괄 숨김)인 분포에서도 글 목록 첫 쪽은 ACTIVE 글만 짚어 읽는다.
 * 실행 시간이 아니라 EXPLAIN ANALYZE의 "post 테이블에서 실제로 읽은 행 수"와 응답 결과로 판정한다.
 * 인덱스 이름·컬럼은 단언하지 않는다(어떤 올바른 인덱스든 통과).
 */
class B02ConfirmTest extends ApiTestSupport {

    /** 오래된 글 4,000건(ACTIVE·DELETED 반반) 위에 최근 스팸 4,000건(HIDDEN)이 쌓인 분포 */
    static final int OLD = 4000;
    static final int SPAM = 4000;
    /** 첫 쪽(size 20 + 다음 쪽 확인 1건)을 인덱스로 짚으면 21행 남짓이다. 넉넉히 잡은 상한 */
    static final int MAX_ROWS_READ = 100;

    // EXPLAIN ANALYZE 한 줄: "-> Index scan on post using PRIMARY (reverse) (...) (actual time=0.01..3.5 rows=4021 loops=1)"
    static final Pattern POST_ACCESS = Pattern.compile(
            "->[^\\n]*\\bon post\\b(?!_)[^\\n]*\\(actual time=[^ ]+ rows=([0-9.e+-]+) loops=([0-9]+)\\)");

    @Autowired
    SqlSessionFactory sqlSessionFactory;

    @Autowired
    JsonMapper json;

    @BeforeEach
    void seed() {
        clearPosts();
        Member m = newMember(Role.USER);
        // 재귀 깊이 기본값(1000)을 넘지 않게 0~99 두 개를 곱해 0~9999를 만든다
        String numbers = "WITH RECURSIVE d(i) AS (SELECT 0 UNION ALL SELECT i + 1 FROM d WHERE i < 99)"
                + " SELECT a.i * 100 + b.i AS n FROM d a CROSS JOIN d b";
        jdbc.update("INSERT INTO post (member_id, title, content, status, like_count, created_at, updated_at)"
                + " SELECT ?, CONCAT('글', n), '내용', IF(n % 2 = 0, 'ACTIVE', 'DELETED'), 0, NOW(6), NOW(6)"
                + " FROM (" + numbers + ") t WHERE n < ? ORDER BY n", m.getId(), OLD);
        jdbc.update("INSERT INTO post (member_id, title, content, status, like_count, created_at, updated_at)"
                + " SELECT ?, CONCAT('스팸', n), '광고', 'HIDDEN', 0, NOW(6), NOW(6)"
                + " FROM (" + numbers + ") t WHERE n < ? ORDER BY n", m.getId(), SPAM);
        jdbc.execute("ANALYZE TABLE post");
    }

    /** 같은 컨텍스트의 다른 목록 테스트에 8,000건을 남기지 않는다 */
    @AfterEach
    void cleanUp() {
        clearPosts();
    }

    @Test
    void 최근_글이_대부분_숨김이어도_목록_첫_쪽이_읽는_post_행은_100개_이하다() {
        String plan = explainAnalyze(null, 21);

        assertThat(maxRowsReadFromPost(plan))
                .as("post 테이블에서 실제로 읽은 행 수. 실행 계획:%n%s", plan)
                .isLessThanOrEqualTo(MAX_ROWS_READ);
    }

    @Test
    void 목록_첫_쪽과_다음_쪽은_최신_ACTIVE_글_순서_그대로다() throws Exception {
        List<Long> expected = jdbc.queryForList(
                "SELECT id FROM post WHERE status = 'ACTIVE' ORDER BY id DESC LIMIT 40", Long.class);

        JsonNode first = getList(null);
        String next = first.get("nextCursor").asString();
        JsonNode second = getList(next);

        List<Long> actual = new ArrayList<>(ids(first));
        actual.addAll(ids(second));
        assertThat(actual).isEqualTo(expected);
    }

    private JsonNode getList(String cursor) throws Exception {
        var request = get("/api/posts").param("size", "20");
        if (cursor != null) {
            request = request.param("cursor", cursor);
        }
        return json.readTree(mockMvc.perform(request).andReturn().getResponse().getContentAsString());
    }

    private static List<Long> ids(JsonNode page) {
        List<Long> ids = new ArrayList<>();
        page.get("items").forEach(item -> ids.add(item.get("id").asLong()));
        return ids;
    }

    /** 실제 매퍼(PostQueryMapper.search)가 만드는 SQL에 값을 채워 EXPLAIN ANALYZE 한다. */
    private String explainAnalyze(Long afterId, int limit) {
        Map<String, Object> params = new HashMap<>();
        params.put("cond", new PostSearchCondition(null, null));
        params.put("afterId", afterId);
        params.put("limit", limit);
        BoundSql bound = sqlSessionFactory.getConfiguration()
                .getMappedStatement("com.example.board.post.PostQueryMapper.search").getBoundSql(params);
        String sql = bound.getSql();
        for (ParameterMapping p : bound.getParameterMappings()) {
            Object value = params.get(p.getProperty());
            sql = sql.replaceFirst("\\?", String.valueOf(value));
        }
        List<Map<String, Object>> rows = jdbc.queryForList("EXPLAIN ANALYZE " + sql.replaceAll("\\s+", " "));
        return String.valueOf(rows.get(0).values().iterator().next());
    }

    /** post 테이블 접근 노드(Index scan/lookup/range, Table scan)의 실제 읽은 행 수 중 최댓값 */
    private static double maxRowsReadFromPost(String plan) {
        Matcher m = POST_ACCESS.matcher(plan);
        double max = -1;
        while (m.find()) {
            max = Math.max(max, Double.parseDouble(m.group(1)) * Integer.parseInt(m.group(2)));
        }
        assertThat(max).as("실행 계획에서 post 테이블 접근 줄을 찾지 못했다:%n%s", plan).isGreaterThanOrEqualTo(0);
        return max;
    }
}
