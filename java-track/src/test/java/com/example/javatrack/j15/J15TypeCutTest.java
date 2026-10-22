package com.example.javatrack.j15;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TimeZone;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/** 타입 한 컷 정리 퀴즈: J1~J14 타입 한 컷에서 고른 문항. 각 테스트가 함정을 먼저 보여 주고 학습자 답을 확인한다. */
class J15TypeCutTest {

    // 기본 시간대를 KST가 아닌 곳으로 바꿔 둔다. ZoneId.systemDefault()에 기대는 답이
    // KST 개발 PC에서 우연히 통과하지 않게 하려는 것이다(테스트가 끝나면 되돌린다)
    private TimeZone originalTimeZone;

    @BeforeEach
    void 기본_시간대를_KST가_아닌_곳으로_바꾼다() {
        originalTimeZone = TimeZone.getDefault();
        TimeZone.setDefault(TimeZone.getTimeZone("America/New_York"));
    }

    @AfterEach
    void 기본_시간대를_되돌린다() {
        TimeZone.setDefault(originalTimeZone);
    }

    @Test
    void 퀴즈1_J01_보내지_않은_Integer는_null이라_기본값을_쓴다() {
        assertThat(TypeQuiz.sizeOrDefault(null)).isEqualTo(20);
        assertThat(TypeQuiz.sizeOrDefault(0)).isZero();   // 0은 "보내지 않음"이 아니다
        assertThat(TypeQuiz.sizeOrDefault(30)).isEqualTo(30);
    }

    @Test
    void 퀴즈2_J03_Map_get이_null이면_long으로_받는_순간_NPE다() {
        Map<Long, Long> balances = Map.of(1L, 5_000L);

        assertThatThrownBy(() -> {
            long balance = balances.get(2L);
        }).isInstanceOf(NullPointerException.class);

        assertThat(TypeQuiz.balanceOrZero(balances, 1L)).isEqualTo(5_000L);
        assertThat(TypeQuiz.balanceOrZero(balances, 2L)).isZero();
    }

    @Test
    void 퀴즈3_J04_Long을_등호로_비교하면_128부터_틀린다() {
        Long small1 = 127L;
        Long small2 = 127L;
        Long big1 = 128L;
        Long big2 = 128L;
        // -128~127은 캐시된 같은 객체라 ==도 맞아 보인다
        assertThat(small1 == small2).isTrue();
        assertThat(big1 == big2).isFalse();

        assertThat(TypeQuiz.sameId(big1, big2)).isTrue();
        assertThat(TypeQuiz.sameId(small1, 128L)).isFalse();
        assertThat(TypeQuiz.sameId(null, null)).isTrue();
        assertThat(TypeQuiz.sameId(null, big1)).isFalse();
    }

    @Test
    void 퀴즈4_J05_int로_더하면_넘치므로_mapToLong으로_더한다() {
        List<Integer> prices = List.of(1_500_000_000, 1_500_000_000);

        // int 합은 21억을 넘는 순간 음수로 돌아간다
        assertThat(prices.stream().mapToInt(Integer::intValue).sum()).isNegative();

        assertThat(TypeQuiz.total(prices)).isEqualTo(3_000_000_000L);
    }

    @Test
    void 퀴즈5_J06_값이_있으면_loader를_부르지_않는다() {
        AtomicInteger loads = new AtomicInteger();

        // orElse의 인자는 값이 있어도 먼저 실행된다
        Optional.of("캐시값").orElse("DB값" + loads.incrementAndGet());
        assertThat(loads).hasValue(1);

        loads.set(0);
        String cached = TypeQuiz.nicknameOrLoad(Optional.of("캐시값"), () -> "DB값" + loads.incrementAndGet());
        String loaded = TypeQuiz.nicknameOrLoad(Optional.empty(), () -> "DB값" + loads.incrementAndGet());

        assertThat(cached).isEqualTo("캐시값");
        assertThat(loaded).isEqualTo("DB값1");
        assertThat(loads).hasValue(1);
    }

    @Test
    void 퀴즈6_J09_UTC_15시는_KST로_다음_날이다() {
        assertThat(TypeQuiz.kstDate(Instant.parse("2026-10-22T14:59:59Z"))).isEqualTo(LocalDate.of(2026, 10, 22));
        assertThat(TypeQuiz.kstDate(Instant.parse("2026-10-22T15:00:00Z"))).isEqualTo(LocalDate.of(2026, 10, 23));
    }

    @Test
    void 퀴즈7_J11_Arrays_asList는_크기가_고정이라_add하면_터진다() {
        String[] tags = {"java", "spring"};
        List<String> fixedSize = Arrays.asList(tags);
        assertThatThrownBy(() -> fixedSize.add("jpa")).isInstanceOf(UnsupportedOperationException.class);

        // 학습자 코드의 반환값은 람다 밖에서 먼저 받는다
        List<String> growable = TypeQuiz.growableList(tags);
        growable.add("jpa");
        growable.set(0, "kotlin");

        assertThat(growable).containsExactly("kotlin", "spring", "jpa");
        // 배열과 연결이 끊겨 있다
        assertThat(tags).containsExactly("java", "spring");
    }

    @Test
    void 퀴즈8_J14_double로는_0_1_더하기_0_2가_0_3이_아니다() {
        assertThat(0.1 + 0.2).isNotEqualTo(0.3);

        BigDecimal sum = TypeQuiz.sumExactly(List.of("0.1", "0.2"));

        // BigDecimal.equals는 자릿수(scale)까지 비교한다("0.30"과 "0.3"은 다르다). 값만 비교하려면 compareTo
        assertThat(sum).isEqualByComparingTo("0.3");
        assertThat(TypeQuiz.sumExactly(List.of())).isEqualByComparingTo("0");
    }
}
