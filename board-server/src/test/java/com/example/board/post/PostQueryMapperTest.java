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

        List<Long> ids = mapper.findLatestIds(20);

        assertThat(ids).hasSize(20).isSortedAccordingTo(java.util.Comparator.reverseOrder());
        assertThat(jdbc.queryForList("SELECT status FROM post WHERE id IN ("
                + ids.stream().map(String::valueOf).collect(java.util.stream.Collectors.joining(",")) + ")",
                String.class)).containsOnly("ACTIVE");
    }
}
