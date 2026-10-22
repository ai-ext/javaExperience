package com.example.board.post;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;

class PostQueryMapperTest extends ApiTestSupport {

    @Autowired
    PostQueryMapper mapper;

    @BeforeEach
    void setUp() {
        clearPosts();
    }

    @Test
    void ACTIVE_글만_최신순_20건() {
        Member m = newMember(Role.USER);
        for (int i = 0; i < 25; i++) {
            insertPost(m, "제목" + i, "내용", "ACTIVE");
        }
        insertPost(m, "숨김", "내용", "HIDDEN");
        insertPost(m, "삭제", "내용", "DELETED");

        List<Long> ids = mapper.search(new PostSearchCondition(null, null), null, 20).stream().map(PostSummary::getId).toList();

        assertThat(ids).hasSize(20).isSortedAccordingTo(java.util.Comparator.reverseOrder());
        assertThat(jdbc.queryForList("SELECT status FROM post WHERE id IN ("
                + ids.stream().map(String::valueOf).collect(java.util.stream.Collectors.joining(",")) + ")",
                String.class)).containsOnly("ACTIVE");
    }

    @Test
    void 글_20건과_태그를_쿼리_1번으로_매핑() {
        Member m = newMember(Role.USER);
        for (int i = 0; i < 25; i++) {
            Long id = insertPost(m, "제목" + i, "내용", "ACTIVE");
            if (i % 2 == 0) {
                attachTag(id, "spring");
                attachTag(id, "java" + i);
            }
        }
        long before = selectCount();

        List<PostSummary> rows = mapper.search(new PostSearchCondition(null, null), null, 20);

        assertThat(selectCount() - before).isEqualTo(1);
        assertThat(rows).hasSize(20);
        PostSummary withTags = rows.stream().filter(r -> r.getTitle().equals("제목24")).findFirst().orElseThrow();
        assertThat(withTags.getTags()).containsExactly("spring", "java24");
        assertThat(withTags.getAuthorId()).isEqualTo(m.getId());
        assertThat(withTags.getAuthorNickname()).isEqualTo(m.getNickname());
        PostSummary noTags = rows.stream().filter(r -> r.getTitle().equals("제목23")).findFirst().orElseThrow();
        assertThat(noTags.getTags()).isEmpty();
    }

    /** 서버가 실행한 SELECT 누적 횟수. 이 테스트 외에는 쿼리를 보내지 않는다. */
    private long selectCount() {
        return Long.parseLong((String) jdbc.queryForMap("SHOW GLOBAL STATUS LIKE 'Com_select'").get("Value"));
    }
}
