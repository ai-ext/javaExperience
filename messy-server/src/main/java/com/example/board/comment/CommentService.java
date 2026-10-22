package com.example.board.comment;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.board.common.BusinessException;
import com.example.board.common.ErrorCode;
import com.example.board.member.Member;
import com.example.board.member.MemberRepository;
import com.example.board.member.Role;
import com.example.board.point.PointService;
import com.example.board.post.PostRepository;
import com.example.board.post.PostServiceImpl;
import com.example.board.post.PostStatus;

@Service
public class CommentService {

    private static final int COMMENT_EARN_POINTS = 2;

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final MemberRepository memberRepository;
    private final PointService pointService;

    // 댓글 알림은 글 알림과 같은 규칙이라 PostServiceImpl의 것을 쓴다
    @Autowired
    private PostServiceImpl postService;

    public CommentService(CommentRepository commentRepository, PostRepository postRepository,
            MemberRepository memberRepository, PointService pointService) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.memberRepository = memberRepository;
        this.pointService = pointService;
    }

    @Transactional
    public CommentResponse create(Long postId, Long memberId, String content) {
        requireActivePost(postId);
        // 댓글 INSERT가 회원 행에 FK 공유 잠금을 걸기 전에 배타 잠금을 먼저 잡는다(잔액 UPDATE와의 교착 방지)
        Member member = memberRepository.findByIdForUpdate(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "회원을 찾을 수 없습니다."));
        Comment saved = commentRepository.save(Comment.create(postRepository.getReferenceById(postId), member,
                content));
        pointService.earn(memberId, COMMENT_EARN_POINTS, "COMMENT", saved.getId());
        postService.notifyCommentAdded(postId, member, content);
        return CommentResponse.from(saved);
    }

    /** 이 글에 (지우지 않은) 댓글을 단 회원 id. 글 삭제 알림 대상이다. */
    @Transactional(readOnly = true)
    public List<Long> commenterIdsOf(Long postId) {
        return commentRepository.findCommenterIds(postId);
    }

    @Transactional(readOnly = true)
    public CommentPage list(Long postId, String cursor, int size) {
        long afterId = decode(cursor);
        requireActivePost(postId);
        List<Comment> rows = commentRepository.findPage(postId, afterId, PageRequest.of(0, size + 1));
        boolean hasNext = rows.size() > size;
        List<Comment> page = hasNext ? rows.subList(0, size) : rows;
        String next = hasNext ? encode(page.get(page.size() - 1).getId()) : null;
        return new CommentPage(page.stream().map(CommentResponse::from).toList(), next);
    }

    /** 대상 없음(404)을 작성자 검사(403)보다 먼저 한다. */
    @Transactional
    public void delete(Long commentId, Long memberId, Role role) {
        Comment comment = commentRepository.findByIdAndDeletedFalse(commentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "댓글을 찾을 수 없습니다."));
        if (role != Role.ADMIN && !comment.isWrittenBy(memberId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "작성자만 삭제할 수 있습니다.");
        }
        comment.delete();
    }

    private void requireActivePost(Long postId) {
        if (!postRepository.existsByIdAndStatus(postId, PostStatus.ACTIVE)) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "글을 찾을 수 없습니다.");
        }
    }

    private static String encode(Long id) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(id.toString().getBytes(StandardCharsets.UTF_8));
    }

    private static long decode(String cursor) {
        if (cursor == null || cursor.isEmpty()) {
            return 0L;
        }
        try {
            return Long.parseLong(new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8));
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.VALIDATION, "cursor가 올바르지 않습니다.");
        }
    }
}
