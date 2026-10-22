package com.example.board.admin;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** enum으로 받으면 잘못된 값이 본문 파싱 실패가 되어 errors[]가 비므로 문자열로 받아 검증한다. */
public record ReportRequest(@NotNull @Pattern(regexp = "SPAM|ABUSE|ETC") String reason, @Size(max = 300) String detail) {

    public ReportReason reasonValue() {
        return ReportReason.valueOf(reason);
    }
}
