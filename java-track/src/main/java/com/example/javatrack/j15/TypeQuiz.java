package com.example.javatrack.j15;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Supplier;

/**
 * 타입 한 컷 정리 퀴즈(선택 과제): J1~J14 타입 한 컷에서 고른 8문항. 각 메서드를 함정에 빠지지 않게 채운다.
 * 기본 실행 {@code :java-track:test --tests 'J15*'}에는 들어가지 않고 {@code :java-track:optionalTest --tests 'J15*'}로 확인한다.
 */
public final class TypeQuiz {

    private TypeQuiz() {
    }

    /** Q1 (J01 int vs Integer): 보내지 않은 size(null)는 20, 보냈으면 그 값. */
    public static int sizeOrDefault(Integer size) {
        throw new UnsupportedOperationException("J15(선택): TypeQuiz.sizeOrDefault — null을 먼저 처리하세요");
    }

    /** Q2 (J03 언박싱 NPE): 잔액 캐시에 없는 회원은 0. */
    public static long balanceOrZero(Map<Long, Long> balances, Long memberId) {
        throw new UnsupportedOperationException("J15(선택): TypeQuiz.balanceOrZero — Map.get이 null일 때를 처리하세요");
    }

    /** Q3 (J04 == vs equals): 두 id가 같은 값인가. 둘 다 null이면 같다고 본다. */
    public static boolean sameId(Long a, Long b) {
        throw new UnsupportedOperationException("J15(선택): TypeQuiz.sameId — 참조가 아니라 값을 비교하세요");
    }

    /** Q4 (J05 IntStream·mapToLong): 가격 합계. 합이 int 범위를 넘어도 맞아야 한다. */
    public static long total(List<Integer> prices) {
        throw new UnsupportedOperationException("J15(선택): TypeQuiz.total — long으로 바꿔 더하세요");
    }

    /** Q5 (J06 Optional): 캐시에 있으면 그 값, 없을 때만 loader를 부른다. */
    public static String nicknameOrLoad(Optional<String> cached, Supplier<String> loader) {
        throw new UnsupportedOperationException("J15(선택): TypeQuiz.nicknameOrLoad — 값이 있으면 loader를 부르지 마세요");
    }

    /** Q6 (J09 Instant와 LocalDate): 그 순간의 KST 날짜. */
    public static LocalDate kstDate(Instant instant) {
        throw new UnsupportedOperationException("J15(선택): TypeQuiz.kstDate — KST로 날짜를 자르세요");
    }

    /** Q7 (J11 배열 vs List): 배열을 받아 add할 수 있고, 배열과 연결이 끊긴 List로 돌려준다. */
    public static List<String> growableList(String[] tags) {
        throw new UnsupportedOperationException("J15(선택): TypeQuiz.growableList — Arrays.asList의 크기 고정을 피하세요");
    }

    /** Q8 (J14 double vs BigDecimal): 문자열 금액들("0.1", "0.2")의 정확한 합. */
    public static BigDecimal sumExactly(List<String> amounts) {
        throw new UnsupportedOperationException("J15(선택): TypeQuiz.sumExactly — double 없이 BigDecimal로 더하세요");
    }
}
