package com.example.javatrack.j04;

/**
 * 주어진 인터페이스: 고치지 않는다. 할인 정책이 지켜야 할 약속이다.
 * 인터페이스는 필드(상태)를 가질 수 없고, 구현 클래스는 여러 인터페이스를 함께 구현할 수 있다.
 */
public interface DiscountPolicy {

    /** price에서 깎을 금액. 0 이상 price 이하. */
    int discount(int price);

    /** 화면에 보일 정책 이름. */
    String name();

    /** 할인한 뒤의 가격. default 메서드라 구현 클래스가 쓰지 않아도 있다. 안에서 부르는 discount는 실제 객체의 것이다. */
    default int apply(int price) {
        return price - discount(price);
    }
}
