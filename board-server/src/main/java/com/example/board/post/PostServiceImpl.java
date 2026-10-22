package com.example.board.post;

import java.util.LinkedHashSet;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.board.common.BusinessException;
import com.example.board.common.ErrorCode;
import com.example.board.member.Member;
import com.example.board.member.MemberRepository;

@Service
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final MemberRepository memberRepository;
    private final TagRepository tagRepository;

    public PostServiceImpl(PostRepository postRepository, MemberRepository memberRepository,
            TagRepository tagRepository) {
        this.postRepository = postRepository;
        this.memberRepository = memberRepository;
        this.tagRepository = tagRepository;
    }

    @Override
    @Transactional
    public Long create(Long memberId, PostCreateRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "회원을 찾을 수 없습니다."));
        Post post = Post.create(member, request.title(), request.content());
        // 입력 순서를 유지하며 중복을 제거한다. post_tag UNIQUE(post_id, tag_id)에 걸리기 전에 막는다.
        List<String> names = request.tags() == null ? List.of() : List.copyOf(new LinkedHashSet<>(request.tags()));
        for (String name : names) {
            post.addTag(tagRepository.findByName(name).orElseGet(() -> tagRepository.save(Tag.create(name))));
        }
        return postRepository.save(post).getId();
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
        return flushAndRespond(post);
    }

    @Override
    @Transactional
    public void delete(Long postId, Long memberId) {
        // save()를 부르지 않는다. 영속 상태 엔티티의 변경은 커밋 시점에 UPDATE로 나간다.
        findOwned(postId, memberId).delete();
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
