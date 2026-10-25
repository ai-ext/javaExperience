package org.example.post;

import org.example.auth.AuthenticatedMember;
import org.example.board.Board;
import org.example.board.BoardNotFoundException;
import org.example.board.BoardRepository;
import org.example.member.MemberRepository;
import org.example.tag.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

// 글 조회 전용 서비스 — 1-3/1-4의 PostService(쓰기)와 책임을 나눈다
@Service
public class PostQueryService {

    private final PostRepository postRepository;
    private final BoardRepository boardRepository;
    private final MemberRepository memberRepository;
    private final PostAccessPolicy accessPolicy;

    public PostQueryService(PostRepository postRepository, BoardRepository boardRepository,
                             MemberRepository memberRepository,
                             PostAccessPolicy accessPolicy) {
        this.postRepository = postRepository;
        this.boardRepository = boardRepository;
        this.memberRepository = memberRepository;
        this.accessPolicy = accessPolicy;
    }

    @Transactional(readOnly = true)
    public List<PostHeadlineResponse> listPublicByAuthor(Long memberId, String boardSlug) {
        if (!memberRepository.existsById(memberId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "회원을 찾을 수 없습니다.");
        }
        boardRepository.findBySlug(boardSlug)
                .orElseThrow(() -> new BoardNotFoundException(boardSlug));
        return postRepository.findPublicPostsByAuthorAndBoard(memberId, boardSlug).stream()
                .map(post -> new PostHeadlineResponse(
                        post.getId(), post.getTitle(),
                        post.getAuthor().getNickname(), boardSlug))
                .toList();
    }

    @Transactional
    public PostDetailResponse getDetail(Long id, AuthenticatedMember viewer) {
        throw new UnsupportedOperationException("학습용 미구현: getDetail 메서드를 완성하세요.");
    }

    @Transactional(readOnly = true)
    public PostListResponse list(String boardSlug, int page, int size, AuthenticatedMember viewer) {
        throw new UnsupportedOperationException("학습용 미구현: list 메서드를 완성하세요.");
    }

    private PostListItemResponse toListItem(Post post) {
        return new PostListItemResponse(
                post.getId(),
                post.getTitle(),
                new AuthorResponse(post.getAuthor().getId(), post.getAuthor().getNickname()),
                post.getTags().stream().map(Tag::getName).toList(),
                post.getLikeCount(),
                post.getCommentCount(),
                post.getViewCount(),
                post.getPublishedAt()
        );
    }

    private PostDetailResponse toDetailResponse(Post post) {
        // 트랜잭션 안에서 지연 로딩 연관을 읽어 DTO로 옮긴다(open-in-view: false)
        return new PostDetailResponse(
                post.getId(),
                post.getBoard().getSlug(),
                post.getTitle(),
                post.getContent(),
                post.getTags().stream().map(Tag::getName).toList(),
                post.getVisibility(),
                new AuthorResponse(post.getAuthor().getId(), post.getAuthor().getNickname()),
                post.getViewCount(),
                post.getLikeCount(),
                post.getCommentCount(),
                post.getCreatedAt()
        );
    }
}
