package com.example.javatrack.j06;

/**
 * 주어진 함정 코드: 고치지 않는다. {@link CouponLookup}과 비교하려고 둔다.
 * {@code orElse(factory.create())}는 Optional에 값이 있어도 create()를 먼저 실행한다(인자는 메서드를 부르기 전에 계산된다).
 */
public class LeakyCouponLookup {

    private final CouponRepository repository;
    private final DefaultCouponFactory factory;

    public LeakyCouponLookup(CouponRepository repository, DefaultCouponFactory factory) {
        this.repository = repository;
        this.factory = factory;
    }

    public Coupon findOrDefault(long id) {
        return repository.findById(id).orElse(factory.create());
    }
}
