package com.example.javatrack.j04;

/**
 * 주어진 코드: 고치지 않는다. 같은 이름의 메서드를 매개변수 타입만 달리해 두 개 둔 오버로딩이다.
 * 오버로딩은 <b>컴파일할 때 선언 타입</b>으로 어느 것을 부를지 정한다.
 */
public final class PolicyDescriber {

    private PolicyDescriber() {
    }

    public static String describe(DiscountPolicy policy) {
        return "할인 정책";
    }

    public static String describe(RateDiscountPolicy policy) {
        return "정률 할인 정책";
    }
}
