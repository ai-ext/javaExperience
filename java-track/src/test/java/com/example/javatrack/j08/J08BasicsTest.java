package com.example.javatrack.j08;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;

import java.util.List;

import org.junit.jupiter.api.Test;

/** 기본기 반복: 충전 요청 목록을 검사해 실패한 건을 모아 하나의 예외로 돌려준다(for·return·예외). */
class J08BasicsTest {

    @Test
    void 모두_통과하면_금액_합계를_돌려준다() {
        List<ChargeRequest> requests = List.of(
                new ChargeRequest("key-1", 1_000),        // 최소
                new ChargeRequest("key-2", 1_000_000),    // 최대
                new ChargeRequest("key-3", 25_000));

        assertThat(ChargeValidator.validateAndSum(requests)).isEqualTo(1_026_000L);
    }

    @Test
    void 빈_목록이면_0을_돌려준다() {
        assertThat(ChargeValidator.validateAndSum(List.of())).isZero();
    }

    @Test
    void 실패한_건을_첫_실패에서_멈추지_않고_모두_모아_한_번에_던진다() {
        List<ChargeRequest> requests = List.of(
                new ChargeRequest("key-1", 10_000),       // 통과
                new ChargeRequest("key-2", 1_500),        // 1,000 단위 아님
                new ChargeRequest("key-3", 999_000),      // 통과
                new ChargeRequest("key-4", 0),            // 최소 미만
                new ChargeRequest("key-5", 1_001_000));   // 최대 초과

        ChargeValidationException e = catchThrowableOfType(ChargeValidationException.class,
                () -> ChargeValidator.validateAndSum(requests));

        assertThat(e).isNotNull();
        assertThat(e.failures()).extracting(ChargeFailure::index).containsExactly(1, 3, 4);
        assertThat(e.failures()).extracting(ChargeFailure::reason).allSatisfy(reason -> assertThat(reason).isNotBlank());
    }

    @Test
    void 멱등_키가_없거나_공백뿐이면_실패이고_한_요청에는_실패_하나만_남긴다() {
        List<ChargeRequest> requests = List.of(
                new ChargeRequest(null, 10_000),
                new ChargeRequest("   ", 1_500),          // 키도 금액도 틀렸지만 실패는 하나만
                new ChargeRequest("key-3", 10_000));

        ChargeValidationException e = catchThrowableOfType(ChargeValidationException.class,
                () -> ChargeValidator.validateAndSum(requests));

        assertThat(e).isNotNull();
        assertThat(e.failures()).extracting(ChargeFailure::index).containsExactly(0, 1);
    }
}
