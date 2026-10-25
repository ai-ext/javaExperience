package example.paging;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.ScrollPosition;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Window;
import org.springframework.data.jpa.repository.JpaRepository;

interface ArticleRepository extends JpaRepository<Article, Long> {
    Page<Article> findByStatus(String status, Pageable pageable);

    Slice<Article> findSliceByStatus(String status, Pageable pageable);

    Window<Article> findFirst50ByStatusOrderByPublishedAtDescIdDesc(
            String status, ScrollPosition position);
}
