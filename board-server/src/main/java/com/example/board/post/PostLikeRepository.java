package com.example.board.post;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    /** 지운 행 수를 돌려준다. 0이면 원래 없던 좋아요다. */
    @Modifying
    @Query("delete from PostLike l where l.post.id = :postId and l.member.id = :memberId")
    int deleteByPostAndMember(@Param("postId") Long postId, @Param("memberId") Long memberId);
}
