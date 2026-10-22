package com.example.javatrack.j12;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

/** 타입 한 컷: enum 확장 — 필드·생성자·메서드를 가진 enum, 상수별 메서드 구현으로 상태별 분기 정리. */
class J12TypeCutTest {

    @Test
    void 상태마다_라벨을_필드로_가진다() {
        assertThat(OrderStatus.PAID.label()).isEqualTo("결제 완료");
        assertThat(OrderStatus.SHIPPING.label()).isEqualTo("배송 중");
        assertThat(OrderStatus.DELIVERED.label()).isEqualTo("배송 완료");
        assertThat(OrderStatus.CANCELLED.label()).isEqualTo("취소됨");
    }

    @ParameterizedTest
    @EnumSource(OrderStatus.class)
    void 라벨_취소_가능_환불액이_레거시_if_else와_같다(OrderStatus status) {
        String code = status.name();

        assertThat(status.label()).isEqualTo(LegacyOrderStatus.label(code));
        assertThat(status.canCancel()).isEqualTo(LegacyOrderStatus.canCancel(code));
        assertThat(status.refundAmount(10000)).isEqualTo(LegacyOrderStatus.refundAmount(code, 10000));
        assertThat(status.refundAmount(2000)).isEqualTo(LegacyOrderStatus.refundAmount(code, 2000));
    }

    @Test
    void 배송_중_환불은_배송비_3000원을_빼고_0_아래로_내려가지_않는다() {
        assertThat(OrderStatus.SHIPPING.refundAmount(10000)).isEqualTo(7000);
        assertThat(OrderStatus.SHIPPING.refundAmount(2000)).isZero();
        assertThat(OrderStatus.PAID.refundAmount(2000)).isEqualTo(2000);
    }

    @Test
    void 함정_상수별_몸체가_있으면_getClass는_enum_타입이_아니다() {
        long refund = OrderStatus.SHIPPING.refundAmount(5000);

        // 상수에 { … } 몸체를 열면 그 상수는 enum을 상속한 익명 클래스의 객체가 된다
        assertThat(OrderStatus.SHIPPING.getClass()).isNotEqualTo(OrderStatus.class);
        // 그래서 "어느 enum의 상수인가"는 getClass()가 아니라 getDeclaringClass()로 묻는다
        assertThat(OrderStatus.SHIPPING.getDeclaringClass()).isEqualTo(OrderStatus.class);
        assertThat(OrderStatus.SHIPPING).isInstanceOf(OrderStatus.class);
        assertThat(refund).isEqualTo(2000);
    }

    @Test
    void 함정_valueOf는_대소문자까지_같아야_하고_없으면_예외다() {
        boolean canCancel = OrderStatus.valueOf("PAID").canCancel();

        assertThat(canCancel).isTrue();
        // 문자열 코드를 enum으로 바꾸는 곳은 한 곳뿐이다. 거기서 잘못된 코드를 바로 거절한다
        assertThatThrownBy(() -> OrderStatus.valueOf("paid"))
                .isInstanceOf(IllegalArgumentException.class);
        // 레거시는 모르는 코드를 조용히 "알 수 없음"으로 넘긴다
        assertThat(LegacyOrderStatus.label("paid")).isEqualTo("알 수 없음");
    }
}
