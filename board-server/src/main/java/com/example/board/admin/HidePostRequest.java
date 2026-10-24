package com.example.board.admin;

import jakarta.validation.constraints.Positive;

/** reportId는 선택이다. 있으면 그 신고를 RESOLVED로 바꾼다. */
public record HidePostRequest(@Positive Long reportId) {
}
