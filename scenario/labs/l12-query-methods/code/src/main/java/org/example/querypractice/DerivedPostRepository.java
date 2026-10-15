package org.example.querypractice;

import org.example.post.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.Repository;
import java.util.Optional;

// 이름의 프로퍼티 경로·키워드를 Spring Data가 분석한다. 직접 SQL 문자열을 만든 메서드가 아니다.
public interface DerivedPostRepository extends Repository<Post, Long> {
    @EntityGraph(attributePaths = {"board", "author"})
    Optional<Post> findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(Long id, String status, String visibility);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(String status, String visibility, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug(String status, String visibility, String boardSlug, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndAuthor_Id(String status, String visibility, Long authorId, Pageable pageable);

    @EntityGraph(attributePaths = {"board", "author"})
    Page<Post> findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndTitleContainingIgnoreCase(String status, String visibility, String keyword, Pageable pageable);

    boolean existsByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(Long id, String status, String visibility);
    long countByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug(String status, String visibility, String boardSlug);
}
