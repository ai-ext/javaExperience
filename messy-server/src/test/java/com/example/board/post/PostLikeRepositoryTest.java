package com.example.board.post;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PostLikeRepositoryTest extends ApiTestSupport {

    @Autowired
    PostRepository postRepository;

    @Autowired
    PostLikeRepository postLikeRepository;

    @Test
    void 같은_글_회원_쌍을_두_번_저장하면_예외() {
        Member m = newMember(Role.USER);
        Post post = postRepository.saveAndFlush(Post.create(m, "제목", "내용"));
        postLikeRepository.saveAndFlush(PostLike.create(post, m));

        assertThatThrownBy(() -> postLikeRepository.saveAndFlush(PostLike.create(post, m)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 다른_회원이면_같은_글에_저장된다() {
        Member a = newMember(Role.USER);
        Member b = newMember(Role.USER);
        Post post = postRepository.saveAndFlush(Post.create(a, "제목", "내용"));

        postLikeRepository.saveAndFlush(PostLike.create(post, a));
        postLikeRepository.saveAndFlush(PostLike.create(post, b));

        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM post_like WHERE post_id = ?", Integer.class,
                post.getId())).isEqualTo(2);
    }
}
