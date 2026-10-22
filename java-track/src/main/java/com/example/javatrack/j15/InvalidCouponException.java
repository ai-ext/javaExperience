package com.example.javatrack.j15;

/** 주어진 예외: 고치지 않는다. 없는 쿠폰이거나 쿠폰 조건에 맞지 않는다. */
public class InvalidCouponException extends RuntimeException {

    public InvalidCouponException(String message) {
        super(message);
    }
}
