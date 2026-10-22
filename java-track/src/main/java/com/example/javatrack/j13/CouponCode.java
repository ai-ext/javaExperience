package com.example.javatrack.j13;

/**
 * 쿠폰 코드 값 객체. 사용자가 입력한 코드를 정규화해서 담는다.
 * <ul>
 *   <li>앞뒤 공백을 지우고 대문자로 바꿔 담는다({@code " sale2024 "} → {@code "SALE2024"})</li>
 *   <li>정규화한 값은 영문 대문자·숫자만 6~12자여야 한다. 아니면(null 포함) {@link IllegalArgumentException}</li>
 * </ul>
 */
public record CouponCode(String value) {

    public static final int MIN_LENGTH = 6;
    public static final int MAX_LENGTH = 12;

    /** compact 생성자: 매개변수 {@code value}를 정규화해 다시 대입하면 그 값이 필드에 담긴다. */
    public CouponCode {
        throw new UnsupportedOperationException("J13: CouponCode 생성자 — 공백 제거·대문자로 정규화한 뒤 6~12자 영문 대문자·숫자인지 검사하세요");
    }
}
