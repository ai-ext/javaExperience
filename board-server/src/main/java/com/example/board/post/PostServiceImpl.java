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
}
