package com.example.board.post;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.example.board.TestcontainersConfig;
import com.example.board.member.Member;
import com.example.board.member.MemberRepository;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
class PostRepositoryTest {

    @Autowired
    PostRepository postRepository;

    @Autowired
    MemberRepository memberRepository;

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void 저장한_글의_status_컬럼은_문자열_ACTIVE() {
        Member member = memberRepository.saveAndFlush(Member.create(UUID.randomUUID() + "@t.com", "hash",
                "m" + UUID.randomUUID().toString().replace("-", "").substring(0, 10), Role.USER));

        Post saved = postRepository.saveAndFlush(Post.create(member, "제목", "내용"));

        String raw = jdbc.queryForObject("SELECT status FROM post WHERE id = ?", String.class, saved.getId());
        assertThat(raw).isEqualTo("ACTIVE");
        assertThat(saved.getStatus()).isEqualTo(PostStatus.ACTIVE);
        assertThat(saved.getLikeCount()).isZero();
        assertThat(saved.getCreatedAt()).isNotNull();
    }
}
