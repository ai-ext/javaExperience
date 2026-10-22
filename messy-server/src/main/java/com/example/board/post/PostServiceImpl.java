package com.example.board.post;

import java.util.LinkedHashSet;
import java.util.List;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.board.common.BusinessException;
import com.example.board.common.ErrorCode;
import com.example.board.member.Member;
import com.example.board.member.MemberRepository;
import com.example.board.point.PointService;

@Service
public class PostServiceImpl implements PostService {

    private static final int POST_EARN_POINTS = 10;

    private final PostRepository postRepository;
    private final MemberRepository memberRepository;
    private final TagRepository tagRepository;
    private final PointService pointService;
    private final ApplicationEventPublisher events;

    public PostServiceImpl(PostRepository postRepository, MemberRepository memberRepository,
            TagRepository tagRepository, PointService pointService, ApplicationEventPublisher events) {
        this.postRepository = postRepository;
        this.memberRepository = memberRepository;
        this.tagRepository = tagRepository;
        this.pointService = pointService;
        this.events = events;
    }

    @Override
    @Transactional
    public Long create(Long memberId, PostCreateRequest request) {
        // 글 INSERT가 회원 행에 FK 공유 잠금을 걸기 전에 배타 잠금을 먼저 잡는다(잔액 UPDATE와의 교착 방지)
        Member member = memberRepository.findByIdForUpdate(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "회원을 찾을 수 없습니다."));
        Post post = Post.create(member, request.title(), request.content());
        // 입력 순서를 유지하며 중복을 제거한다. post_tag UNIQUE(post_id, tag_id)에 걸리기 전에 막는다.
        List<String> names = request.tags() == null ? List.of() : List.copyOf(new LinkedHashSet<>(request.tags()));
        for (String name : names) {
            post.addTag(tagRepository.findByName(name).orElseGet(() -> tagRepository.save(Tag.create(name))));
        }
        Long postId = postRepository.save(post).getId();
        pointService.earn(memberId, POST_EARN_POINTS, "POST", postId);
        // 인기글 캐시는 커밋 뒤 리스너가 지운다(PostCacheEvictListener). 여기서 Redis를 부르지 않는다.
        events.publishEvent(new PostChangedEvent(postId));
        return postId;
    }

    @Override
    @Transactional(readOnly = true)
    public PostDetailResponse getDetail(Long postId) {
        return PostDetailResponse.from(postRepository.findActiveDetail(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "글을 찾을 수 없습니다.")));
    }

    @Override
    @Transactional
    public PostDetailResponse update(Long postId, Long memberId, PostUpdateRequest request) {
        Post post = findOwned(postId, memberId);
        post.update(request.title(), request.content());
        post.replaceTags(resolveTags(request.tags()));
        events.publishEvent(new PostChangedEvent(postId));
        return flushAndRespond(post);
    }

    @Override
    @Transactional
    public PostDetailResponse patch(Long postId, Long memberId, PostPatchRequest request) {
        Post post = findOwned(postId, memberId);
        post.patch(request.title(), request.content());
        if (request.tags() != null) {
            post.replaceTags(resolveTags(request.tags()));
        }
        events.publishEvent(new PostChangedEvent(postId));
        return flushAndRespond(post);
    }

    @Override
    @Transactional
    public void delete(Long postId, Long memberId) {
        // save()를 부르지 않는다. 영속 상태 엔티티의 변경은 커밋 시점에 UPDATE로 나간다.
        findOwned(postId, memberId).delete();
        events.publishEvent(new PostChangedEvent(postId));
    }

    private Post findOwned(Long postId, Long memberId) {
        Post post = postRepository.findActiveDetail(postId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "글을 찾을 수 없습니다."));
        if (!post.isWrittenBy(memberId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "작성자만 수정·삭제할 수 있습니다.");
        }
        return post;
    }

    private List<Tag> resolveTags(List<String> names) {
        if (names == null) {
            return List.of();
        }
        return new LinkedHashSet<>(names).stream()
                .map(name -> tagRepository.findByName(name).orElseGet(() -> tagRepository.save(Tag.create(name))))
                .toList();
    }

    // 응답의 updatedAt이 감사 필드 갱신 이후 값이 되도록 먼저 flush 한다
    private PostDetailResponse flushAndRespond(Post post) {
        postRepository.flush();
        return PostDetailResponse.from(post);
    }
}
