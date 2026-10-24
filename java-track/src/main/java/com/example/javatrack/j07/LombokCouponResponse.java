package com.example.javatrack.j07;

/**
 * 주어진 코드: 고치지 않는다. 필드에 {@code @Getter}를 붙인 응답 DTO를 delombok한 결과와 같다.
 * JSON 라이브러리(Jackson)는 필드가 아니라 getter 이름으로 응답 필드 이름을 정한다.
 */
public class LombokCouponResponse {

    private final String name;
    private final boolean used;
    private final boolean isExpired;
    private final boolean issued;
    private final Boolean isHidden;
    private final Boolean autoRenew;

    public LombokCouponResponse(String name, boolean used, boolean isExpired, boolean issued, Boolean isHidden,
            Boolean autoRenew) {
        this.name = name;
        this.used = used;
        this.isExpired = isExpired;
        this.issued = issued;
        this.isHidden = isHidden;
        this.autoRenew = autoRenew;
    }

    public String getName() {
        return name;
    }

    public boolean isUsed() {
        return used;
    }

    // boolean 필드 isExpired: Lombok은 isIsExpired가 아니라 isExpired()를 만든다
    public boolean isExpired() {
        return isExpired;
    }

    // "is" 다음이 소문자라 접두어가 아니다. isIssued()
    public boolean isIssued() {
        return issued;
    }

    // Boolean(래퍼) 필드는 언제나 get 접두어. isHidden → getIsHidden()
    public Boolean getIsHidden() {
        return isHidden;
    }

    public Boolean getAutoRenew() {
        return autoRenew;
    }
}
