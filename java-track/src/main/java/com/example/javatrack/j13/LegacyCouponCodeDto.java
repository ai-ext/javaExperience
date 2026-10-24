package com.example.javatrack.j13;

/**
 * 주어진 레거시 코드: 고치지 않는다. {@link CouponCode}와 비교하려고 둔다.
 * 기본 생성자와 getter·setter만 있는 DTO. 규칙 검사도 equals도 없다.
 */
public class LegacyCouponCodeDto {

    private String value;

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
