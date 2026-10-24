package com.example.javatrack.j10;

/**
 * 타입 한 컷: 쿠폰 대량 지급 엑셀 업로드 한 건의 크기.
 * 한도는 {@code static final} 상수, 이 업로드의 값은 만든 뒤 바뀌지 않는 {@code private final} 필드에 담는다.
 * 행 수는 1~{@value #MAX_ROWS}, 파일 크기는 1~{@value #MAX_FILE_BYTES}바이트여야 하고, 어기면 {@link IllegalArgumentException}.
 */
public final class UploadLimits {

    public static final int MAX_ROWS = 1_000;
    public static final long MAX_FILE_BYTES = 5L * 1024 * 1024;

    private final int rows;
    private final long fileBytes;

    public UploadLimits(int rows, long fileBytes) {
        if (rows < 1 || rows > MAX_ROWS) {
            throw new IllegalArgumentException("행 수는 1~" + MAX_ROWS + "이어야 합니다: " + rows);
        }
        if (fileBytes < 1 || fileBytes > MAX_FILE_BYTES) {
            throw new IllegalArgumentException("파일 크기는 1~" + MAX_FILE_BYTES + "바이트여야 합니다: " + fileBytes);
        }
        // final 필드는 생성자에서 딱 한 번 대입한다. 빠뜨리거나 두 번 대입하면 컴파일 오류다
        this.rows = rows;
        this.fileBytes = fileBytes;
    }

    public int rows() {
        return rows;
    }

    public long fileBytes() {
        return fileBytes;
    }
}
