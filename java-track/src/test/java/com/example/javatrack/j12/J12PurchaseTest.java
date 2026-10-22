package com.example.javatrack.j12;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * 주제 과제: 긴 메서드 나누기 — 구매 처리 메서드를 검증·계산·저장으로 나누고 특성화 테스트를 그대로 통과시킨다.
 * <p>
 * 앞의 특성화 테스트 4개는 나누기 전(뼈대)에도 통과한다. 나눈 뒤에도 그대로 통과해야 한다(동작이 바뀌지 않았다는 증거).
 * 뒤의 테스트는 purchase가 정말 세 메서드로 나뉘어 그것들을 부르는지 본다. 나누기 전에는 실패한다.
 */
class J12PurchaseTest {

    private static final long MEMBER = 1L;

    private ShopStore store;
    private PurchaseService service;

    @BeforeEach
    void setUp() {
        store = new ShopStore();
        store.addItem("BOOK", 12000, 5);
        store.setPoints(MEMBER, 10000);
        service = new PurchaseService(store);
    }

    // ---- 특성화: 나누기 전후 동작이 같다 ----

    @Test
    void 특성화_정상_구매는_재고를_줄이고_결제_금액의_1퍼센트를_적립하고_주문을_저장한다() {
        PurchaseResult result = service.purchase(new PurchaseRequest(MEMBER, "BOOK", 2, null, 0));

        assertThat(result).isEqualTo(new PurchaseResult(true, 1L, 24000, "구매 완료"));
        assertThat(store.findItem("BOOK").stock()).isEqualTo(3);
        assertThat(store.pointsOf(MEMBER)).isEqualTo(10000 + 240);
        assertThat(store.orders()).containsExactly(new PurchaseOrder(MEMBER, "BOOK", 2, 24000, 0, 0, 24000));
    }

    @Test
    void 특성화_포인트는_할인_뒤_금액의_절반까지만_쓴다() {
        // 12000 - 쿠폰 10%(1200) = 10800, 그 절반 5400까지만 쓴다. 8000을 요청해도 5400
        PurchaseResult result = service.purchase(new PurchaseRequest(MEMBER, "BOOK", 1, "SALE10", 8000));

        assertThat(result).isEqualTo(new PurchaseResult(true, 1L, 5400, "구매 완료"));
        assertThat(store.pointsOf(MEMBER)).isEqualTo(10000 - 5400 + 54);
        assertThat(store.orders()).containsExactly(new PurchaseOrder(MEMBER, "BOOK", 1, 12000, 1200, 5400, 5400));
    }

    @Test
    void 특성화_쿠폰_할인은_10퍼센트이고_최대_5000원이다() {
        PurchaseResult result = service.purchase(new PurchaseRequest(MEMBER, "BOOK", 5, "SALE10", 0));

        assertThat(result.paidAmount()).isEqualTo(60000 - 5000);
        assertThat(store.orders().get(0).discount()).isEqualTo(5000);
    }

    @Test
    void 특성화_검증에_걸리면_사유를_쉼표로_이어_실패를_돌려주고_아무것도_바꾸지_않는다() {
        PurchaseResult result = service.purchase(new PurchaseRequest(MEMBER, "BOOK", 11, "WELCOME", -1));

        assertThat(result).isEqualTo(new PurchaseResult(false, null, 0,
                "수량은 1~10개여야 합니다, 재고가 부족합니다, 사용 포인트는 0 이상이어야 합니다, 쓸 수 없는 쿠폰입니다"));
        assertThat(store.findItem("BOOK").stock()).isEqualTo(5);
        assertThat(store.pointsOf(MEMBER)).isEqualTo(10000);
        assertThat(store.orders()).isEmpty();
    }

    // ---- 구조: purchase가 세 메서드로 나뉘었다 ----

    @Test
    void calculate는_금액만_계산하고_저장소를_바꾸지_않는다() {
        Payment payment = service.calculate(new PurchaseRequest(MEMBER, "BOOK", 1, "SALE10", 8000));

        assertThat(payment).isEqualTo(new Payment(12000, 1200, 5400, 5400));
        assertThat(store.pointsOf(MEMBER)).isEqualTo(10000);
        assertThat(store.findItem("BOOK").stock()).isEqualTo(5);
        assertThat(store.orders()).isEmpty();
    }

    @Test
    void purchase는_validate가_돌려준_사유로_실패를_만든다() {
        // validate만 바꿔 끼운다. purchase가 validate를 부르지 않고 직접 검증하면 이 사유가 나오지 않는다
        PurchaseService swapped = new PurchaseService(store) {
            @Override
            List<String> validate(PurchaseRequest request) {
                return List.of("테스트가 심은 사유 1", "테스트가 심은 사유 2");
            }
        };

        PurchaseResult result = swapped.purchase(new PurchaseRequest(MEMBER, "BOOK", 1, null, 0));

        assertThat(result)
                .as("purchase가 직접 검증하지 말고 validate()가 돌려준 사유로 실패를 만들어야 합니다")
                .isEqualTo(new PurchaseResult(false, null, 0, "테스트가 심은 사유 1, 테스트가 심은 사유 2"));
        assertThat(store.orders()).isEmpty();
    }

    @Test
    void purchase는_calculate가_계산한_금액으로_저장한다() {
        PurchaseService swapped = new PurchaseService(store) {
            @Override
            Payment calculate(PurchaseRequest request) {
                return new Payment(1000, 100, 0, 900);
            }
        };

        PurchaseResult result = swapped.purchase(new PurchaseRequest(MEMBER, "BOOK", 1, null, 0));

        assertThat(result.paidAmount())
                .as("purchase가 직접 계산하지 말고 calculate()가 돌려준 Payment로 저장해야 합니다")
                .isEqualTo(900);
        assertThat(store.orders()).containsExactly(new PurchaseOrder(MEMBER, "BOOK", 1, 1000, 100, 0, 900));
    }

    @Test
    void purchase는_save가_돌려준_주문_번호를_돌려준다() {
        PurchaseService swapped = new PurchaseService(store) {
            @Override
            long save(PurchaseRequest request, Payment payment) {
                return 777L;
            }
        };

        PurchaseResult result = swapped.purchase(new PurchaseRequest(MEMBER, "BOOK", 1, null, 0));

        assertThat(result)
                .as("purchase가 직접 저장하지 말고 save()가 돌려준 주문 번호로 결과를 만들어야 합니다")
                .isEqualTo(new PurchaseResult(true, 777L, 12000, "구매 완료"));
        // 저장은 save가 맡으므로, save를 바꿔 끼우면 아무것도 저장되지 않는다
        assertThat(store.orders()).isEmpty();
        assertThat(store.findItem("BOOK").stock()).isEqualTo(5);
    }
}
