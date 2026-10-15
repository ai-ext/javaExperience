package org.example.querypractice;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

public record SearchFilter(String boardSlug, Long authorId, String pattern, String tag,
                           LocalDateTime from, LocalDateTime to, int page, int size, String sort) {
    public static SearchFilter parse(Map<String, String> params) {
        String board = QueryInputs.text(params, "boardSlug", 50);
        String keyword = QueryInputs.text(params, "keyword", 100);
        String tag = QueryInputs.text(params, "tag", 30);
        Long author = params.containsKey("authorId") ? QueryInputs.positive(params.get("authorId"), "authorId") : null;
        LocalDateTime from = date(params.get("from"), "from");
        LocalDateTime to = date(params.get("to"), "to");
        if (from != null && to != null && !from.isBefore(to)) throw QueryInputs.bad("from/to");
        String sort = params.getOrDefault("sort", "latest");
        if (!sort.equals("latest") && !sort.equals("likes")) throw QueryInputs.bad("sort");
        return new SearchFilter(board, author, QueryInputs.pattern(keyword), tag, from, to,
                QueryInputs.number(params, "page", 0, 0, 10000), QueryInputs.number(params, "size", 10, 1, 50), sort);
    }
    private static LocalDateTime date(String value, String field) {
        if (value == null) return null;
        try { return LocalDateTime.parse(value); }
        catch (DateTimeParseException e) { throw QueryInputs.bad(field); }
    }
    public long offset() { return (long) page * size; }
    public PageRequest pageable() {
        Sort order = Sort.by(Sort.Direction.DESC, "id");
        if (sort.equals("likes")) order = Sort.by(Sort.Direction.DESC, "likeCount").and(order);
        return PageRequest.of(page, size, order);
    }
}
