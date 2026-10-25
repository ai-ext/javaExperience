package example.paging;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.ScrollPosition;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Window;

class ArticlePagingExample {
    void compare(ArticleRepository repository) {
        Sort order = Sort.by(
                Sort.Order.desc("publishedAt"),
                Sort.Order.desc("id"));
        var pageable = PageRequest.of(0, 50, order);

        Page<Article> numbered = repository.findByStatus("PUBLISHED", pageable);
        long total = numbered.getTotalElements();

        Slice<Article> chunk = repository.findSliceByStatus("PUBLISHED", pageable);
        boolean hasMoreOffset = chunk.hasNext();

        Window<Article> window = repository.findFirst50ByStatusOrderByPublishedAtDescIdDesc(
                "PUBLISHED", ScrollPosition.keyset());
        while (!window.isEmpty()) {
            window.forEach(this::consume);
            if (window.isLast()) {
                break;
            }
            ScrollPosition next = window.positionAt(window.size() - 1);
            window = repository.findFirst50ByStatusOrderByPublishedAtDescIdDesc(
                    "PUBLISHED", next);
        }
    }

    private void consume(Article article) {
        // DTO 변환 또는 호출자에게 전달
    }
}
