package com.example.board.comment;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.support.TransactionTemplate;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;
import com.example.board.post.Post;
import com.example.board.post.PostRepository;

import static org.assertj.core.api.Assertions.assertThat;

class CommentRepositoryTest extends ApiTestSupport {

    @Autowired
    CommentRepository commentRepository;

    @Autowired
    PostRepository postRepository;

    @Autowired
    TransactionTemplate tx;

    @Test
    void 한_글의_댓글을_id_순으로_조회한다() {
        Member m = newMember(Role.USER);
        Post post = postRepository.saveAndFlush(Post.create(m, "제목", "내용"));
        Post other = postRepository.saveAndFlush(Post.create(m, "다른 글", "내용"));
        Comment c1 = commentRepository.save(Comment.create(post, m, "첫째"));
        commentRepository.save(Comment.create(other, m, "다른 글 댓글"));
        Comment c2 = commentRepository.save(Comment.create(post, m, "둘째"));

        List<Comment> result = commentRepository.findByPostIdOrderByIdAsc(post.getId());

        assertThat(result).extracting(Comment::getId).containsExactly(c1.getId(), c2.getId());
    }

    // 함정: @ManyToOne 기본값(EAGER)이면 댓글만 읽어도 글·작성자가 따라 로딩된다
    @Test
    void 댓글만_읽으면_글과_작성자는_로딩되지_않는다() {
        Member m = newMember(Role.USER);
        Post post = postRepository.saveAndFlush(Post.create(m, "제목", "내용"));
        Long id = commentRepository.saveAndFlush(Comment.create(post, m, "내용")).getId();

        tx.executeWithoutResult(s -> {
            Comment found = commentRepository.findById(id).orElseThrow();
            var util = emf.getPersistenceUnitUtil();
            assertThat(util.isLoaded(found, "post")).isFalse();
            assertThat(util.isLoaded(found, "member")).isFalse();
        });
    }
}
