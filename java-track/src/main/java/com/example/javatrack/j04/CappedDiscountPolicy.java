package com.example.javatrack.j04;

/**
 * 주어진 추상 클래스: 고치지 않는다. "할인은 최대 maxDiscount원"이라는 규칙을 한 곳에서 강제한다.
 * 추상 클래스는 필드·생성자를 가질 수 있고, final 메서드로 자식이 바꾸면 안 되는 흐름을 고정한다.
 * 자식은 {@link #rawDiscount}(상한을 적용하기 전 할인액)만 채운다. 클래스는 하나만 상속할 수 있다.
 */
public abstract class CappedDiscountPolicy implements DiscountPolicy {

    private final int maxDiscount;

    protected CappedDiscountPolicy(int maxDiscount) {
        if (maxDiscount < 0) {
            throw new IllegalArgumentException("최대 할인액은 0 이상이어야 합니다: " + maxDiscount);
        }
        this.maxDiscount = maxDiscount;
    }

    /** final이라 자식이 덮어쓸 수 없다. 상한은 언제나 적용된다. */
    @Override
    public final int discount(int price) {
        return Math.min(rawDiscount(price), maxDiscount);
    }

    public int maxDiscount() {
        return maxDiscount;
    }

    /** 상한을 적용하기 전의 할인액. */
    protected abstract int rawDiscount(int price);
}
