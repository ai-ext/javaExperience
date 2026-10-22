package com.example.javatrack.j04;

/** 상한이 있는 정률 할인. 상한 적용은 부모 {@link CappedDiscountPolicy}가 하고, 여기서는 정률 계산만 채운다. */
public class CappedRateDiscountPolicy extends CappedDiscountPolicy {

    // TODO: 할인율 필드를 선언하세요

    /** ratePercent가 0~100이 아니면 IllegalArgumentException. maxDiscount 검사는 부모 생성자가 한다. */
    public CappedRateDiscountPolicy(int ratePercent, int maxDiscount) {
        super(maxDiscount);
        throw new UnsupportedOperationException("J04: CappedRateDiscountPolicy 생성자 — 할인율을 검사하고 담으세요");
    }

    @Override
    protected int rawDiscount(int price) {
        throw new UnsupportedOperationException("J04: CappedRateDiscountPolicy.rawDiscount — 상한 없이 price * 할인율 / 100");
    }

    /** 예: "정률 10% (최대 3000원)" */
    @Override
    public String name() {
        throw new UnsupportedOperationException("J04: CappedRateDiscountPolicy.name — \"정률 10% (최대 3000원)\" 모양으로");
    }
}
