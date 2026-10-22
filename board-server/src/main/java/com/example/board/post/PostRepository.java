package com.example.board.post;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
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
}
