package com.example.board.post;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import com.example.board.common.BusinessException;
import com.example.board.common.ErrorCode;
import com.example.board.member.MemberRepository;

/** 이 클래스에는 @Transactional을 두지 않는다. 트랜잭션 경계를 안쪽(TransactionTemplate)에 두고 중복 예외를 바깥에서 잡기 위해서다. */
@Service
public class PostLikeService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final MemberRepository memberRepository;
    private final TransactionTemplate tx;

    public PostLikeService(PostRepository postRepository, PostLikeRepository postLikeRepository,
            MemberRepository memberRepository, TransactionTemplate tx) {
        this.postRepository = postRepository;
        this.postLikeRepository = postLikeRepository;
        this.memberRepository = memberRepository;
        this.tx = tx;
    }

    /** 이미 눌렀으면 아무 일도 하지 않는다(멱등). */
    public void like(Long postId, Long memberId) {
        try {
            tx.executeWithoutResult(s -> {
                // 글 행을 먼저 잠그고(+1) 그 뒤에 좋아요 행을 넣는다. 중복이면 INSERT 예외로 +1도 함께 롤백된다.
                if (postRepository.increaseLikeCount(postId) == 0) {
                    throw new BusinessException(ErrorCode.NOT_FOUND, "글을 찾을 수 없습니다.");
                }
                postLikeRepository.saveAndFlush(PostLike.create(postRepository.getReferenceById(postId),
                        memberRepository.getReferenceById(memberId)));
            });
        } catch (DataIntegrityViolationException duplicate) {
            // UNIQUE(post_id, member_id) 위반 = 이미 누른 상태. 트랜잭션은 이미 롤백됐으므로 여기서 삼켜도 안전하다.
        }
    }

    /** 누른 적이 없으면 아무 일도 하지 않는다(멱등). */
    public void unlike(Long postId, Long memberId) {
        tx.executeWithoutResult(s -> {
            postRepository.lockActiveId(postId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "글을 찾을 수 없습니다."));
            // 지운 행이 있을 때만 줄인다. 같은 쌍의 동시 취소 중 한 건만 지우므로 카운트가 두 번 줄지 않는다.
            if (postLikeRepository.deleteByPostAndMember(postId, memberId) > 0) {
                postRepository.decreaseLikeCount(postId);
            }
        });
    }
}
