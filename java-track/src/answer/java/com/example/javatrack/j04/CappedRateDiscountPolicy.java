package com.example.javatrack.j04;

/** 상한이 있는 정률 할인. 상한 적용은 부모 {@link CappedDiscountPolicy}가 하고, 여기서는 정률 계산만 채운다. */
public class CappedRateDiscountPolicy extends CappedDiscountPolicy {

    private final int ratePercent;

    /** ratePercent가 0~100이 아니면 IllegalArgumentException. maxDiscount 검사는 부모 생성자가 한다. */
    public CappedRateDiscountPolicy(int ratePercent, int maxDiscount) {
        // 부모 생성자가 먼저 돌아 maxDiscount를 검사하고 담는다
        super(maxDiscount);
        if (ratePercent < 0 || ratePercent > 100) {
            throw new IllegalArgumentException("할인율은 0~100이어야 합니다: " + ratePercent);
        }
        this.ratePercent = ratePercent;
    }

    @Override
    protected int rawDiscount(int price) {
        return price * ratePercent / 100;
    }

    /** 예: "정률 10% (최대 3000원)" */
    @Override
    public String name() {
        // 부모의 private 필드는 못 보지만 public 메서드 maxDiscount()로 읽는다
        return "정률 " + ratePercent + "% (최대 " + maxDiscount() + "원)";
    }
}
