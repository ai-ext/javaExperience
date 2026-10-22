package com.example.javatrack.j07;

/**
 * 주어진 코드: 고치지 않는다. {@code boolean isURL} 필드에 {@code @Getter}를 붙여 delombok한 결과다.
 * getter는 isURL()이고, JavaBeans 규칙은 "is"를 뗀 "URL"의 앞 두 글자가 모두 대문자라 소문자로 바꾸지 않는다(URL 그대로).
 */
public class AcronymFlagResponse {

    private final boolean isURL;

    public AcronymFlagResponse(boolean isURL) {
        this.isURL = isURL;
    }

    public boolean isURL() {
        return isURL;
    }
}
