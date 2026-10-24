package com.example.board.post;

import java.util.List;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** null은 "바꾸지 않음"이다. 보낸 필드만 검증한다. */
public record PostPatchRequest(
        @Size(max = 100) @Pattern(regexp = "[\\s\\S]*\\S[\\s\\S]*", message = "공백만 입력할 수 없습니다") String title,
        @Size(min = 1, max = 5000) String content,
        @Size(max = 5) List<@NotBlank @Size(max = 20) String> tags) {

    @AssertTrue(message = "변경할 필드가 하나 이상 필요합니다")
    public boolean isAnyFieldPresent() {
        return title != null || content != null || tags != null;
    }
}
