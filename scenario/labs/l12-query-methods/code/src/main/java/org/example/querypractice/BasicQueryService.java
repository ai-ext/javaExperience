package org.example.querypractice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.example.post.Post;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class BasicQueryService {
    private final DerivedPostRepository repository;
    private final BasicPostMapper mapper;

    public BasicQueryService(DerivedPostRepository repository, BasicPostMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    public QueryPostRow detail(String engine, String rawId) {
        QueryInputs.engine(engine);
        long id = QueryInputs.positive(rawId, "id");
        QueryPostRow row = "jpa".equals(engine)
                ? repository.findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(id, "PUBLISHED", "PUBLIC").map(QueryPostRow::of).orElse(null)
                : mapper.detail(id);
        if (row == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return row;
    }

    public QueryPage list(String engine, Map<String, String> params) {
        QueryInputs.engine(engine);
        String board = QueryInputs.text(params, "boardSlug", 50);
        String keyword = QueryInputs.text(params, "keyword", 100);
        Long author = params.containsKey("authorId") ? QueryInputs.positive(params.get("authorId"), "authorId") : null;
        // 기본편은 조건 하나씩 만든다. 조건 조합은 L13에서 같은 DTO로 확장한다.
        if ((board == null ? 0 : 1) + (keyword == null ? 0 : 1) + (author == null ? 0 : 1) > 1) throw QueryInputs.bad("filter");
        int page = QueryInputs.number(params, "page", 0, 0, 10000);
        int size = QueryInputs.number(params, "size", 10, 1, 50);
        if ("mybatis".equals(engine)) {
            String pattern = QueryInputs.pattern(keyword);
            return new QueryPage(mapper.list(board, author, pattern, size, (long) page * size), page, size, mapper.count(board, author, pattern));
        }
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<Post> result;
        if (board != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug("PUBLISHED", "PUBLIC", board, pageable);
        else if (author != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndAuthor_Id("PUBLISHED", "PUBLIC", author, pageable);
        else if (keyword != null) result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndTitleContainingIgnoreCase("PUBLISHED", "PUBLIC", keyword, pageable);
        else result = repository.findByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility("PUBLISHED", "PUBLIC", pageable);
        return new QueryPage(result.getContent().stream().map(QueryPostRow::of).toList(), page, size, result.getTotalElements());
    }

    public boolean exists(String engine, String rawId) {
        QueryInputs.engine(engine);
        long id = QueryInputs.positive(rawId, "id");
        return "jpa".equals(engine) ? repository.existsByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(id, "PUBLISHED", "PUBLIC") : mapper.exists(id);
    }

    public long count(String engine, String board) {
        QueryInputs.engine(engine);
        if (board == null || board.isBlank() || board.length() > 50) throw QueryInputs.bad("boardSlug");
        return "jpa".equals(engine) ? repository.countByDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibilityAndBoard_Slug("PUBLISHED", "PUBLIC", board) : mapper.count(board, null, null);
    }
}
