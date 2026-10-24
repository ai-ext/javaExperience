package com.example.board.point;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/** GET /api/me/points/history 쿼리 파라미터. 규칙은 spec-v2 5-3과 같다. */
public record PointHistoryRequest(String cursor, @Min(1) @Max(50) Integer size) {

    public PointHistoryRequest {
        if (size == null) {
            size = 20;
        }
    }
}
