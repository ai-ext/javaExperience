package com.example.javatrack.j02;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

/**
 * 실무 습관(선택 과제): Lombok이 만드는 코드를 손으로 써 보고, 엔티티에서 @Setter·@AllArgsConstructor를 피하는 이유를 확인한다.
 * 클래스 전체가 선택 과제다(@Tag("optional")). 기본 실행 {@code :java-track:test --tests 'J02*'}에서는 빠지고
 * {@code :java-track:optionalTest --tests 'J02*'}로 따로 돌린다. 빌더 테스트(선택_…) 말고는 주어진 {@code Coupon.create}로 쿠폰을 만든다.
 */
@Tag("optional")
class J02HabitTest {

    @Test
    void Setter와_전체_생성자가_열린_쿠폰은_총량을_넘는_발급_수량을_막지_못한다_Coupon은_막는다() {
        // @AllArgsConstructor: 아무 값이나 한 번에 넣을 수 있다
        LeakyCoupon leaky = new LeakyCoupon(1L, "웰컴 쿠폰", 10, 50);
        // @Setter: 어디서든 규칙을 거치지 않고 바꿀 수 있다
        leaky.setIssuedQuantity(999);
        assertThat(leaky.getIssuedQuantity()).isGreaterThan(leaky.getTotalQuantity());

        Coupon coupon = Coupon.create("웰컴 쿠폰", 1);
        coupon.issue();

        assertThatThrownBy(coupon::issue).isInstanceOf(IllegalStateException.class);
        assertThat(coupon.getIssuedQuantity()).isEqualTo(1);
    }

    @Test
    void 쿠폰은_이름과_총량을_검사해_만들고_발급_수량은_0에서_시작한다() {
        Coupon coupon = Coupon.create("웰컴 쿠폰", 10);

        assertThat(coupon.getName()).isEqualTo("웰컴 쿠폰");
        assertThat(coupon.getTotalQuantity()).isEqualTo(10);
        assertThat(coupon.getIssuedQuantity()).isZero();
        assertThat(coupon.getId()).isNull();
        assertThatThrownBy(() -> Coupon.create(null, 10)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> Coupon.create("  ", 10)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> Coupon.create("웰컴 쿠폰", 0)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void Coupon에는_public_생성자와_setter가_없다() {
        Coupon coupon = Coupon.create("웰컴 쿠폰", 10);
        assertThat(coupon.getName()).isEqualTo("웰컴 쿠폰");

        List<Constructor<?>> publicConstructors = Arrays.stream(Coupon.class.getDeclaredConstructors())
                .filter(constructor -> Modifier.isPublic(constructor.getModifiers()))
                .toList();
        List<String> setters = Arrays.stream(Coupon.class.getMethods())
                .map(Method::getName)
                .filter(name -> name.startsWith("set"))
                .toList();

        assertThat(publicConstructors).isEmpty();
        assertThat(setters).isEmpty();
    }

    @Test
    void 선택_빌더는_이름을_붙여_값을_넣고_발급_수량은_0에서_시작한다() {
        // 생성자 new Coupon("웰컴 쿠폰", 10)과 달리, 어느 값이 이름이고 어느 값이 총량인지 호출부에 드러난다
        Coupon coupon = Coupon.builder()
                .totalQuantity(10)
                .name("웰컴 쿠폰")
                .build();

        assertThat(coupon.getName()).isEqualTo("웰컴 쿠폰");
        assertThat(coupon.getTotalQuantity()).isEqualTo(10);
        assertThat(coupon.getIssuedQuantity()).isZero();
        assertThat(coupon.getId()).isNull();
    }

    @Test
    void 선택_빌더에서_총량을_빠뜨리면_0이_들어가_생성자_검사에_걸린다() {
        Coupon.CouponBuilder builder = Coupon.builder().name("웰컴 쿠폰");

        // 빌더는 빠뜨린 값을 알려 주지 않는다. int 필드의 기본값 0이 그대로 생성자로 간다
        assertThatThrownBy(builder::build).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void RequiredArgsConstructor는_선언에서_초기화하지_않은_final_필드만_받는다() {
        Coupon coupon = Coupon.create("웰컴 쿠폰", 10);
        CouponIssueService service = new CouponIssueService(coupon);
        assertThat(service.issue(1L)).isTrue();

        List<Field> finalFields = Arrays.stream(CouponIssueService.class.getDeclaredFields())
                .filter(field -> !Modifier.isStatic(field.getModifiers()))
                .filter(field -> Modifier.isFinal(field.getModifiers()))
                .toList();
        Constructor<?>[] constructors = CouponIssueService.class.getDeclaredConstructors();

        // final 필드는 쿠폰과 회원 id 집합 두 개다
        assertThat(finalFields).extracting(Field::getType)
                .anySatisfy(type -> assertThat(type).isEqualTo(Coupon.class))
                .anySatisfy(type -> assertThat(Set.class).isAssignableFrom(type));
        // 그런데 생성자는 쿠폰 하나만 받는다. 집합은 선언에서 이미 만들었기 때문이다
        assertThat(constructors).hasSize(1);
        assertThat(constructors[0].getParameterTypes()).containsExactly(Coupon.class);
    }

    @Test
    void 한_회원에게는_한_번만_발급한다() {
        Coupon coupon = Coupon.create("웰컴 쿠폰", 10);
        CouponIssueService service = new CouponIssueService(coupon);

        assertThat(service.issue(1L)).isTrue();
        assertThat(service.issue(1L)).isFalse();
        assertThat(service.issue(2L)).isTrue();
        assertThat(coupon.getIssuedQuantity()).isEqualTo(2);
    }
}
