package com.example.board.post;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PostCreateRequest(
        // @NotEmpty는 공백만 있는 문자열을 통과시킨다
        @NotBlank @Size(max = 100) String title,
        @NotNull @Size(min = 1, max = 5000) String content,
        @Size(max = 5) List<@NotBlank @Size(max = 20) String> tags) {
}
