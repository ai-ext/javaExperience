package com.example.board.post;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** GET /api/posts 쿼리 파라미터. 규칙은 spec-v2 5-3과 같다. */
public record PostListRequest(
        String cursor,
        @Min(1) @Max(50) Integer size,
        @Size(min = 2, max = 50) String keyword,
        @Size(min = 1, max = 20) String tag,
        @Pattern(regexp = "latest") String sort) {

    public PostListRequest {
        if (size == null) {
            size = 20;
        }
    }

    public PostSearchCondition toCondition() {
        return new PostSearchCondition(keyword, tag);
    }
}
