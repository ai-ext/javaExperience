package com.example.board.post;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.board.comment.CommentService;
import com.example.board.common.BusinessException;
import com.example.board.common.ErrorCode;
import com.example.board.common.ForbiddenWordChecker;
import com.example.board.member.Member;
import com.example.board.member.MemberRepository;
import com.example.board.notification.Notification;
import com.example.board.notification.NotificationChannel;
import com.example.board.notification.NotificationRepository;
import com.example.board.notification.NotificationType;
import com.example.board.point.PointService;

/**
 * 글 작성·조회·수정·삭제와 글에 딸린 알림(알림함·푸시·메일)을 처리한다.
 * 알림은 글 저장과 같은 트랜잭션에 notification 표로 쌓는다(푸시·메일은 발송 배치가 읽어 보낸다).
 *
 * 댓글 알림도 글 알림과 문구·채널 규칙이 같아서 여기서 같이 보낸다(CommentService가 notifyCommentAdded를 부른다).
 */
@Service
public class PostServiceImpl implements PostService {

    private static final Logger log = LoggerFactory.getLogger(PostServiceImpl.class);

    private static final int POST_EARN_POINTS = 10;

    // 푸시는 잠금 화면에 두 줄만 보인다
    private static final int PUSH_MAX_BODY = 40;
    private static final String PUSH_ELLIPSIS = "…";

    private static final String EMAIL_SUBJECT_PREFIX = "[게시판] ";
    private static final String EMAIL_FOOTER = "\n\n이 메일은 발신 전용입니다. 알림 설정은 내 정보에서 바꿀 수 있습니다.";

    private static final String FORBIDDEN_MESSAGE = "금칙어가 포함되어 있습니다.";

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private PointService pointService;

    @Autowired
    private ApplicationEventPublisher events;

    @Autowired
    private ForbiddenWordChecker forbiddenWordChecker;

    @Autowired
    private NotificationRepository notificationRepository;

    // CommentService도 이 클래스를 쓴다(댓글 알림). 서로 물려 기동이 안 돼서 @Lazy로 늦춰 받는다.
    @Autowired
    @Lazy
    private CommentService commentService;

    // ===================================================================================
    // 작성
    // ===================================================================================

    @Override
    @Transactional
    public Long create(Long memberId, PostCreateRequest request) {
        // 금칙어 검사. 제목과 본문 둘 다 본다.
        if (request.title() != null && forbiddenWordChecker.contains(request.title())) {
            log.info("금칙어 글 작성 거부 memberId={}", memberId);
            throw new BusinessException(ErrorCode.VALIDATION, FORBIDDEN_MESSAGE);
        }
        if (request.content() != null && forbiddenWordChecker.contains(request.content())) {
            log.info("금칙어 글 작성 거부 memberId={}", memberId);
            throw new BusinessException(ErrorCode.VALIDATION, FORBIDDEN_MESSAGE);
        }

        // 글 INSERT가 회원 행에 FK 공유 잠금을 걸기 전에 배타 잠금을 먼저 잡는다(잔액 UPDATE와의 교착 방지)
        Member member = memberRepository.findByIdForUpdate(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "회원을 찾을 수 없습니다."));
        Post post = Post.create(member, request.title(), request.content());

        // 입력 순서를 유지하며 중복을 제거한다. post_tag UNIQUE(post_id, tag_id)에 걸리기 전에 막는다.
        List<String> names = request.tags() == null ? List.of() : List.copyOf(new LinkedHashSet<>(request.tags()));
        for (String name : names) {
            Optional<Tag> found = tagRepository.findByName(name);
            if (found.isPresent()) {
                post.addTag(found.get());
            } else {
                post.addTag(tagRepository.save(Tag.create(name)));
            }
        }
        Long postId = postRepository.save(post).getId();

        pointService.earn(memberId, POST_EARN_POINTS, "POST", postId);

        // 작성자에게 등록·적립 알림
        String title = "글이 등록되었습니다";
        String body = "'" + post.getTitle() + "' 글이 등록되어 " + POST_EARN_POINTS + "포인트가 적립되었습니다.";
        for (NotificationChannel channel : NotificationChannel.values()) {
            switch (channel) {
                case IN_APP -> notificationRepository.save(Notification.create(memberId, NotificationChannel.IN_APP,
                        NotificationType.POST_CREATED, title, body, postId));
                case PUSH -> {
                    String pushBody = body;
                    if (pushBody.codePointCount(0, pushBody.length()) > PUSH_MAX_BODY) {
                        pushBody = pushBody.substring(0, pushBody.offsetByCodePoints(0, PUSH_MAX_BODY - 1))
                                + PUSH_ELLIPSIS;
                    }
                    notificationRepository.save(Notification.create(memberId, NotificationChannel.PUSH,
                            NotificationType.POST_CREATED, title, pushBody, postId));
                }
                case EMAIL -> {
                    // 글 등록은 메일로 보내지 않는다(기획: 메일은 남이 한 일만)
                }
                default -> throw new IllegalStateException("알 수 없는 알림 채널: " + channel);
            }
        }

        // 인기글 캐시는 커밋 뒤 리스너가 지운다(PostCacheEvictListener). 여기서 Redis를 부르지 않는다.
        events.publishEvent(new PostChangedEvent(postId));
        log.info("글 작성 postId={} memberId={} tags={}", postId, memberId, names.size());
        return postId;
    }

    // ===================================================================================
    // 조회
    // ===================================================================================

    @Override
    @Transactional(readOnly = true)
    public PostDetailResponse getDetail(Long postId) {
        return PostDetailResponse.from(postRepository.findActiveDetail(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "글을 찾을 수 없습니다.")));
    }

    // ===================================================================================
    // 수정
    // ===================================================================================

    @Override
    @Transactional
    public PostDetailResponse update(Long postId, Long memberId, PostUpdateRequest request) {
        if (request.title() != null && forbiddenWordChecker.contains(request.title())) {
            log.info("금칙어 글 수정 거부 postId={} memberId={}", postId, memberId);
            throw new BusinessException(ErrorCode.VALIDATION, FORBIDDEN_MESSAGE);
        }
        if (request.content() != null && forbiddenWordChecker.contains(request.content())) {
            log.info("금칙어 글 수정 거부 postId={} memberId={}", postId, memberId);
            throw new BusinessException(ErrorCode.VALIDATION, FORBIDDEN_MESSAGE);
        }
        Post post = postRepository.findActiveDetail(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "글을 찾을 수 없습니다."));
        if (!post.isWrittenBy(memberId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "작성자만 수정·삭제할 수 있습니다.");
        }
        post.update(request.title(), request.content());
        List<Tag> tags = new ArrayList<>();
        if (request.tags() != null) {
            for (String name : new LinkedHashSet<>(request.tags())) {
                tags.add(tagRepository.findByName(name).orElseGet(() -> tagRepository.save(Tag.create(name))));
            }
        }
        post.replaceTags(tags);
        events.publishEvent(new PostChangedEvent(postId));
        // 응답의 updatedAt이 감사 필드 갱신 이후 값이 되도록 먼저 flush 한다
        postRepository.flush();
        return PostDetailResponse.from(post);
    }

    @Override
    @Transactional
    public PostDetailResponse patch(Long postId, Long memberId, PostPatchRequest request) {
        if (request.title() != null && forbiddenWordChecker.contains(request.title())) {
            log.info("금칙어 글 수정 거부 postId={} memberId={}", postId, memberId);
            throw new BusinessException(ErrorCode.VALIDATION, FORBIDDEN_MESSAGE);
        }
        if (request.content() != null && forbiddenWordChecker.contains(request.content())) {
            log.info("금칙어 글 수정 거부 postId={} memberId={}", postId, memberId);
            throw new BusinessException(ErrorCode.VALIDATION, FORBIDDEN_MESSAGE);
        }
        Post post = postRepository.findActiveDetail(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "글을 찾을 수 없습니다."));
        if (!post.isWrittenBy(memberId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "작성자만 수정·삭제할 수 있습니다.");
        }
        post.patch(request.title(), request.content());
        if (request.tags() != null) {
            List<Tag> tags = new ArrayList<>();
            for (String name : new LinkedHashSet<>(request.tags())) {
                tags.add(tagRepository.findByName(name).orElseGet(() -> tagRepository.save(Tag.create(name))));
            }
            post.replaceTags(tags);
        }
        events.publishEvent(new PostChangedEvent(postId));
        postRepository.flush();
        return PostDetailResponse.from(post);
    }

    // ===================================================================================
    // 삭제
    // ===================================================================================

    @Override
    @Transactional
    public void delete(Long postId, Long memberId) {
        Post post = postRepository.findActiveDetail(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "글을 찾을 수 없습니다."));
        if (!post.isWrittenBy(memberId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "작성자만 수정·삭제할 수 있습니다.");
        }
        // save()를 부르지 않는다. 영속 상태 엔티티의 변경은 커밋 시점에 UPDATE로 나간다.
        post.delete();
        events.publishEvent(new PostChangedEvent(postId));

        // 댓글을 단 사람들에게 글 삭제 알림(작성자 본인 제외)
        List<Long> commenterIds = commentService.commenterIdsOf(postId);
        String title = "댓글을 단 글이 삭제되었습니다";
        String body = "댓글을 단 글 '" + post.getTitle() + "'이(가) 작성자에 의해 삭제되었습니다.";
        int sent = 0;
        for (Long commenterId : commenterIds) {
            if (commenterId.equals(memberId)) {
                continue;
            }
            for (NotificationChannel channel : NotificationChannel.values()) {
                switch (channel) {
                    case IN_APP -> notificationRepository.save(Notification.create(commenterId,
                            NotificationChannel.IN_APP, NotificationType.POST_DELETED, title, body, postId));
                    case PUSH -> {
                        // 삭제는 푸시하지 않는다(새벽에 울리면 항의가 온다)
                    }
                    case EMAIL -> notificationRepository.save(Notification.create(commenterId,
                            NotificationChannel.EMAIL, NotificationType.POST_DELETED, EMAIL_SUBJECT_PREFIX + title,
                            body + EMAIL_FOOTER, postId));
                    default -> throw new IllegalStateException("알 수 없는 알림 채널: " + channel);
                }
            }
            sent++;
        }
        log.info("글 삭제 postId={} memberId={} 알림 대상={}", postId, memberId, sent);
    }

    // ===================================================================================
    // 댓글 알림 (CommentService에서 호출)
    // ===================================================================================

    /** 남의 글에 댓글이 달리면 글 작성자에게 세 채널로 알린다. 자기 글에 단 댓글은 알리지 않는다. */
    @Transactional
    public void notifyCommentAdded(Long postId, Member commenter, String content) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "글을 찾을 수 없습니다."));
        Long authorId = post.getMember().getId();
        if (authorId.equals(commenter.getId())) {
            return;
        }
        String title = "내 글에 새 댓글이 달렸습니다";
        String body = commenter.getNickname() + "님: " + content;
        for (NotificationChannel channel : NotificationChannel.values()) {
            switch (channel) {
                case IN_APP -> notificationRepository.save(Notification.create(authorId, NotificationChannel.IN_APP,
                        NotificationType.COMMENT_ADDED, title, body, postId));
                case PUSH -> {
                    String pushBody = body;
                    if (pushBody.codePointCount(0, pushBody.length()) > PUSH_MAX_BODY) {
                        pushBody = pushBody.substring(0, pushBody.offsetByCodePoints(0, PUSH_MAX_BODY - 1))
                                + PUSH_ELLIPSIS;
                    }
                    notificationRepository.save(Notification.create(authorId, NotificationChannel.PUSH,
                            NotificationType.COMMENT_ADDED, title, pushBody, postId));
                }
                case EMAIL -> notificationRepository.save(Notification.create(authorId, NotificationChannel.EMAIL,
                        NotificationType.COMMENT_ADDED, EMAIL_SUBJECT_PREFIX + title, body + EMAIL_FOOTER, postId));
                default -> throw new IllegalStateException("알 수 없는 알림 채널: " + channel);
            }
        }
    }
}
