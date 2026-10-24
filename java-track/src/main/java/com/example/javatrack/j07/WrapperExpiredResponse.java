package com.example.javatrack.j07;

/**
 * 주어진 코드: 고치지 않는다. {@link LombokCouponResponse}의 {@code boolean isExpired}를 null을 담으려고
 * {@code Boolean isExpired}로만 바꾼 뒤 delombok한 결과다. getter가 isExpired()에서 getIsExpired()로 바뀐다.
 */
public class WrapperExpiredResponse {

    private final Boolean isExpired;

    public WrapperExpiredResponse(Boolean isExpired) {
        this.isExpired = isExpired;
    }

    public Boolean getIsExpired() {
        return isExpired;
    }
}
