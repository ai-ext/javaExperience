package com.example.javatrack.j13;

import java.util.Locale;

/**
 * 쿠폰 코드 값 객체. 사용자가 입력한 코드를 정규화해서 담는다.
 * <ul>
 *   <li>앞뒤 공백을 지우고 대문자로 바꿔 담는다({@code " sale2024 "} → {@code "SALE2024"}). 서버 기본 로케일과 상관없이 같아야 한다</li>
 *   <li>정규화한 값은 영문 대문자·숫자만 6~12자여야 한다. 아니면(null 포함) {@link IllegalArgumentException}</li>
 * </ul>
 */
public record CouponCode(String value) {

    public static final int MIN_LENGTH = 6;
    public static final int MAX_LENGTH = 12;

    /** compact 생성자: 매개변수 {@code value}를 정규화해 다시 대입하면 그 값이 필드에 담긴다. */
    public CouponCode {
        if (value == null) {
            throw new IllegalArgumentException("쿠폰 코드가 없습니다");
        }
        // this.value = …는 쓸 수 없다. 매개변수에 대입하면 compact 생성자 끝에서 그 값이 필드에 담긴다
        // 인자 없는 toUpperCase()는 서버 기본 로케일을 쓴다. 터키어 로케일이면 "i"가 "İ"가 되므로 Locale.ROOT로 고정한다
        value = value.strip().toUpperCase(Locale.ROOT);
        if (value.length() < MIN_LENGTH || value.length() > MAX_LENGTH || !isUpperAlphanumeric(value)) {
            throw new IllegalArgumentException("쿠폰 코드는 영문·숫자 6~12자여야 합니다: " + value);
        }
    }

    private static boolean isUpperAlphanumeric(String text) {
        for (char c : text.toCharArray()) {
            if (!((c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9'))) {
                return false;
            }
        }
        return true;
    }
}
