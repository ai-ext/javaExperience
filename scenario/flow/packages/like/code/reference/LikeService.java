package org.example.like;

import org.example.auth.AuthenticatedMember;
import org.example.member.Member;
import org.example.member.MemberRepository;
import org.example.post.Post;
import org.example.post.PostAccessPolicy;
import org.example.post.PostNotFoundException;
import org.example.post.PostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

// 좋아요·취소 규칙. PUT·DELETE 모두 "현재 상태를 확인하고 필요할 때만 바꾼다"(멱등).
@Service
public class LikeService {

    private static final String PUBLISHED = "PUBLISHED";

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final MemberRepository memberRepository;
    private final PostAccessPolicy accessPolicy;

    public LikeService(PostRepository postRepository, PostLikeRepository postLikeRepository,
                        MemberRepository memberRepository, PostAccessPolicy accessPolicy) {
        this.postRepository = postRepository;
        this.postLikeRepository = postLikeRepository;
        this.memberRepository = memberRepository;
        this.accessPolicy = accessPolicy;
    }

    @Transactional
    public LikeResponse like(Long postId, AuthenticatedMember loginMember) {
        Post post = findLikeablePost(postId, loginMember);
        if (post.getAuthor().getId().equals(loginMember.id())) {
            throw new SelfLikeNotAllowedException();
        }

        if (!postLikeRepository.existsByPost_IdAndMember_Id(postId, loginMember.id())) {
            Member member = memberRepository.getReferenceById(loginMember.id());
            postLikeRepository.save(new PostLike(post, member, LocalDateTime.now()));
            post.increaseLikeCount();
        }
        return new LikeResponse(postId, true, post.getLikeCount());
    }

    @Transactional
    public LikeResponse unlike(Long postId, AuthenticatedMember loginMember) {
        Post post = findLikeablePost(postId, loginMember);

        if (postLikeRepository.existsByPost_IdAndMember_Id(postId, loginMember.id())) {
            postLikeRepository.deleteByPost_IdAndMember_Id(postId, loginMember.id());
            post.decreaseLikeCount();
        }
        return new LikeResponse(postId, false, post.getLikeCount());
    }

    // 볼 수 있는 글인가(2-3 규칙 재사용) + PUBLISHED인가 — 둘 다 아니면 404
    private Post findLikeablePost(Long postId, AuthenticatedMember loginMember) {
        Post post = postRepository.findById(postId)
                .orElseThrow(PostNotFoundException::new);
        if (!accessPolicy.canView(loginMember, post) || !PUBLISHED.equals(post.getStatus())) {
            throw new PostNotFoundException();
        }
        return post;
    }
}
