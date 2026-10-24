package com.example.javatrack.j15;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Supplier;

/** 타입 한 컷 정리 퀴즈: J1~J14 타입 한 컷에서 고른 8문항. 각 메서드를 함정에 빠지지 않게 채운다. */
public final class TypeQuiz {

    private TypeQuiz() {
    }

    /** Q1 (J01 int vs Integer): 보내지 않은 size(null)는 20, 보냈으면 그 값. */
    public static int sizeOrDefault(Integer size) {
        return size == null ? 20 : size;
    }

    /** Q2 (J03 언박싱 NPE): 잔액 캐시에 없는 회원은 0. */
    public static long balanceOrZero(Map<Long, Long> balances, Long memberId) {
        // get은 없으면 null을 돌려준다. long에 바로 담으면 언박싱 NPE
        return balances.getOrDefault(memberId, 0L);
    }

    /** Q3 (J04 == vs equals): 두 id가 같은 값인가. 둘 다 null이면 같다고 본다. */
    public static boolean sameId(Long a, Long b) {
        return Objects.equals(a, b);
    }

    /** Q4 (J05 IntStream·mapToLong): 가격 합계. 합이 int 범위를 넘어도 맞아야 한다. */
    public static long total(List<Integer> prices) {
        return prices.stream().mapToLong(Integer::longValue).sum();
    }

    /** Q5 (J06 Optional): 캐시에 있으면 그 값, 없을 때만 loader를 부른다. */
    public static String nicknameOrLoad(Optional<String> cached, Supplier<String> loader) {
        return cached.orElseGet(loader);
    }

    /** Q6 (J09 Instant와 LocalDate): 그 순간의 KST 날짜. */
    public static LocalDate kstDate(Instant instant) {
        return instant.atZone(ZoneId.of("Asia/Seoul")).toLocalDate();
    }

    /** Q7 (J11 배열 vs List): 배열을 받아 add할 수 있고, 배열과 연결이 끊긴 List로 돌려준다. */
    public static List<String> growableList(String[] tags) {
        // Arrays.asList는 배열을 감싼 고정 크기 뷰다. 새 ArrayList로 복사해 연결을 끊는다
        return new ArrayList<>(Arrays.asList(tags));
    }

    /** Q8 (J14 double vs BigDecimal): 문자열 금액들("0.1", "0.2")의 정확한 합. */
    public static BigDecimal sumExactly(List<String> amounts) {
        // new BigDecimal(0.1)처럼 double에서 만들면 이미 오차가 들어간다. 문자열에서 만든다
        return amounts.stream().map(BigDecimal::new).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
