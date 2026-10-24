package com.example.javatrack.j10;

/**
 * 타입 한 컷: 쿠폰 대량 지급 엑셀 업로드 한 건의 크기.
 * 한도는 {@code static final} 상수, 이 업로드의 값은 만든 뒤 바뀌지 않는 {@code private final} 필드에 담는다.
 * 행 수는 1~{@value #MAX_ROWS}, 파일 크기는 1~{@value #MAX_FILE_BYTES}바이트여야 하고, 어기면 {@link IllegalArgumentException}.
 */
public final class UploadLimits {

    public static final int MAX_ROWS = 1_000;
    public static final long MAX_FILE_BYTES = 5L * 1024 * 1024;

    // TODO: 행 수·파일 크기 필드를 선언하세요(밖에서 못 건드리고, 만든 뒤 다시 대입할 수 없게)

    public UploadLimits(int rows, long fileBytes) {
        throw new UnsupportedOperationException("J10: UploadLimits 생성자 — 한도를 검사하고 final 필드에 담으세요");
    }

    public int rows() {
        throw new UnsupportedOperationException("J10: UploadLimits.rows — 행 수 필드를 돌려주세요");
    }

    public long fileBytes() {
        throw new UnsupportedOperationException("J10: UploadLimits.fileBytes — 파일 크기 필드를 돌려주세요");
    }
}
