package com.example.board.post;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** PUT은 전체 교체라 생성 요청과 규칙이 같다. */
public record PostUpdateRequest(
        @NotBlank @Size(max = 100) String title,
        @NotNull @Size(min = 1, max = 5000) String content,
        @Size(max = 5) List<@NotBlank @Size(max = 20) String> tags) {
}
