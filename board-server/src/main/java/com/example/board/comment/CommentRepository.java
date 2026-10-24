package com.example.board.comment;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    List<Comment> findByPostIdOrderByIdAsc(Long postId);

    /** 작성자를 fetch join 해서 목록 한 번에 읽는다(N+1 방지). */
    @Query("""
            select c from Comment c
            join fetch c.member
            where c.post.id = :postId and c.deleted = false and c.id > :afterId
            order by c.id asc
            """)
    List<Comment> findPage(@Param("postId") Long postId, @Param("afterId") long afterId, Pageable pageable);

    Optional<Comment> findByIdAndDeletedFalse(Long id);
}
