package com.example.board.post;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/** GET /api/posts/popular 쿼리 파라미터. 규칙은 spec-v2 5-3과 같다. */
public record PopularPostRequest(String cursor, @Min(1) @Max(50) Integer size) {

    public PopularPostRequest {
        if (size == null) {
            size = 20;
        }
    }
}
