package com.example.board.post;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.example.board.TestcontainersConfig;
import com.example.board.common.BusinessException;
import com.example.board.common.ErrorCode;
import com.example.board.member.Member;
import com.example.board.member.MemberRepository;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Import(TestcontainersConfig.class)
@ActiveProfiles("test")
class PostServiceImplTest {

    @Autowired
    PostService postService;

    @Autowired
    MemberRepository memberRepository;

    @Autowired
    JdbcTemplate jdbc;

    Member saveMember() {
        return memberRepository.saveAndFlush(Member.create(UUID.randomUUID() + "@t.com", "hash",
                "m" + UUID.randomUUID().toString().replace("-", "").substring(0, 10), Role.USER));
    }

    @Test
    void 중복_태그는_한_번만_저장한다() {
        Member member = saveMember();
        String a = "a" + UUID.randomUUID().toString().substring(0, 8);
        String b = "b" + UUID.randomUUID().toString().substring(0, 8);

        Long postId = postService.create(member.getId(), new PostCreateRequest("제목", "내용", List.of(a, b, a)));

        Integer links = jdbc.queryForObject("SELECT COUNT(*) FROM post_tag WHERE post_id = ?", Integer.class, postId);
        assertThat(links).isEqualTo(2);
    }

    @Test
    void 작성자는_로그인_회원이고_기존_태그는_재사용한다() {
        Member member = saveMember();
        String tag = "r" + UUID.randomUUID().toString().substring(0, 8);

        Long first = postService.create(member.getId(), new PostCreateRequest("제목1", "내용", List.of(tag)));
        Long second = postService.create(member.getId(), new PostCreateRequest("제목2", "내용", List.of(tag)));

        Long author = jdbc.queryForObject("SELECT member_id FROM post WHERE id = ?", Long.class, first);
        assertThat(author).isEqualTo(member.getId());
        assertThat(second).isNotEqualTo(first);
        Integer tags = jdbc.queryForObject("SELECT COUNT(*) FROM tag WHERE name = ?", Integer.class, tag);
        assertThat(tags).isEqualTo(1);
    }

    @Test
    void 태그가_null이어도_저장된다() {
        Member member = saveMember();

        Long postId = postService.create(member.getId(), new PostCreateRequest("제목", "내용", null));

        assertThat(postId).isNotNull();
    }

    @Test
    void 없는_회원이면_NOT_FOUND() {
        assertThatThrownBy(() -> postService.create(Long.MAX_VALUE, new PostCreateRequest("제목", "내용", null)))
                .isInstanceOfSatisfying(BusinessException.class, e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.NOT_FOUND));
    }
}
