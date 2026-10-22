package com.example.javatrack.j02;

/**
 * 쿠폰 엔티티. Lombok으로 쓰면 아래 모양이다. 애노테이션이 만들어 줄 코드를 손으로 쓴다.
 * <pre>
 * {@literal @}Getter
 * {@literal @}NoArgsConstructor(access = AccessLevel.PROTECTED)
 * public class Coupon {
 *     ...
 *     {@literal @}Builder
 *     private Coupon(String name, int totalQuantity) { 검사 후 대입 }
 *     public void issue() { ... }
 * }
 * </pre>
 * setter와 public 생성자가 없다. 값은 빌더와 학습용 팩토리({@link #create})로만 넣고, 둘 다 같은 private 생성자의 검사를 거친다. 발급 수량은 {@link #issue()}로만 바뀐다.
 * 빌더({@link #builder()}·{@link CouponBuilder})는 선택 과제다. 기본 과제의 테스트는 주어진 {@link #create}로 쿠폰을 만든다.
 */
public class Coupon {

    private Long id;
    private String name;
    private int totalQuantity;
    private int issuedQuantity;

    // @NoArgsConstructor(access = AccessLevel.PROTECTED): JPA가 리플렉션으로 쓰는 빈 생성자. 밖에서는 못 쓴다
    protected Coupon() {
    }

    /** 이름이 null이거나 공백뿐이면, 총량이 1보다 작으면 IllegalArgumentException. 발급 수량은 0에서 시작한다. */
    private Coupon(String name, int totalQuantity) {
        throw new UnsupportedOperationException("J02: Coupon 생성자 — 이름·총량을 검사하고 필드에 담으세요");
    }

    /**
     * 주어진 코드: 고치지 않는다. Lombok에는 없는 메서드로, 빌더(선택 과제)를 채우지 않아도 기본 과제를 풀 수 있게 둔
     * 같은 패키지 전용 팩토리다. private 생성자를 부르므로 생성자의 검사를 그대로 거친다.
     */
    static Coupon create(String name, int totalQuantity) {
        return new Coupon(name, totalQuantity);
    }

    // @Builder가 만드는 static 메서드(선택 과제)
    public static CouponBuilder builder() {
        throw new UnsupportedOperationException("J02: Coupon.builder — 새 CouponBuilder를 돌려주세요");
    }

    /** 1장 발급한다. 이미 총량만큼 발급했으면 IllegalStateException. */
    public void issue() {
        throw new UnsupportedOperationException("J02: Coupon.issue — 남은 수량이 있으면 발급 수량을 1 올리세요");
    }

    // @Getter가 만드는 코드
    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public int getTotalQuantity() {
        return totalQuantity;
    }

    public int getIssuedQuantity() {
        return issuedQuantity;
    }

    /** {@code @Builder}가 만드는 중첩 클래스(선택 과제). 생성자 매개변수마다 필드와 같은 이름의 메서드가 있다. */
    public static class CouponBuilder {

        // TODO: 생성자 매개변수와 같은 필드를 선언하세요

        CouponBuilder() {
        }

        /** 값을 담고 자기 자신을 돌려준다(이어서 부를 수 있게). */
        public CouponBuilder name(String name) {
            throw new UnsupportedOperationException("J02: CouponBuilder.name — 값을 담고 this를 돌려주세요");
        }

        public CouponBuilder totalQuantity(int totalQuantity) {
            throw new UnsupportedOperationException("J02: CouponBuilder.totalQuantity — 값을 담고 this를 돌려주세요");
        }

        /** 담아 둔 값으로 private 생성자를 부른다. 넣지 않은 값은 필드 기본값(null·0)이 그대로 넘어간다. */
        public Coupon build() {
            throw new UnsupportedOperationException("J02: CouponBuilder.build — 담아 둔 값으로 Coupon 생성자를 부르세요");
        }
    }
}
