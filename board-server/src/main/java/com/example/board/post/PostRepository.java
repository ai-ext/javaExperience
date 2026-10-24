package com.example.board.post;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {

    /** 작성자·태그를 한 번에 읽는다. ACTIVE가 아닌 글(삭제·숨김)은 없는 글로 취급한다. */
    @Query("""
            select p from Post p
            join fetch p.member
            left join fetch p.postTags pt
            left join fetch pt.tag
            where p.id = :id and p.status = com.example.board.post.PostStatus.ACTIVE
            """)
    Optional<Post> findActiveDetail(@Param("id") Long id);

    boolean existsByIdAndStatus(Long id, PostStatus status);

    /** DB가 한 문장으로 더한다. 읽고 +1 해서 저장하면 동시 요청에서 갱신이 유실된다. ACTIVE가 아니면 0을 돌려준다. */
    @Modifying
    @Query("update Post p set p.likeCount = p.likeCount + 1 where p.id = :id and p.status = com.example.board.post.PostStatus.ACTIVE")
    int increaseLikeCount(@Param("id") Long id);

    @Modifying
    @Query("update Post p set p.likeCount = p.likeCount - 1 where p.id = :id and p.likeCount > 0")
    int decreaseLikeCount(@Param("id") Long id);

    /** 글 행을 잠근다. 좋아요 등록(글 UPDATE 후 INSERT)과 같은 순서로 잠가야 교착이 나지 않는다. */
    @Query(value = "select id from post where id = :id and status = 'ACTIVE' for update", nativeQuery = true)
    Optional<Long> lockActiveId(@Param("id") Long id);
}
