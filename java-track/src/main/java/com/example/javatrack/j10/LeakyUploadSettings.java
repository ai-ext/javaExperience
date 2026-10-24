package com.example.javatrack.j10;

/**
 * 주어진 함정 코드: 고치지 않는다. {@link UploadLimits}와 비교하려고 둔다.
 * 설정 값을 static이지만 final이 아닌 public 필드로 둔다. 어디서든 바꿀 수 있고, 바꾸면 모든 곳에 퍼진다.
 */
public class LeakyUploadSettings {

    public static int maxRows = 1_000;

    public boolean accepts(int rows) {
        return rows >= 1 && rows <= maxRows;
    }
}
