package com.example.javatrack.j11;

/**
 * 주어진 레거시 코드: 고치지 않는다. 오늘은 이 코드가 "지금 무엇을 돌려주는지"를 테스트로 고정한다.
 * <p>
 * 오픈 때 만든 구매 적립 포인트 계산에 이벤트마다 조건을 덧붙인 메서드다. 문서는 없고,
 * 이상해 보이는 규칙도 지금 운영에서 돌아가는 동작이다. 옳은지 그른지는 오늘 판단하지 않는다.
 */
public class LegacyPointCalculator {

    /**
     * 구매 한 건의 적립 포인트를 계산한다.
     *
     * @param amount     결제 금액(원)
     * @param grade      회원 등급 문자열. null일 수 있다
     * @param couponUsed 이 구매에 쿠폰을 썼는지
     * @return 적립 포인트. 금액이 음수면 -1
     */
    public int calculate(int amount, String grade, boolean couponUsed) {
        if (amount < 0) {
            return -1;
        }
        if (amount < 1000) {
            return 0;
        }
        int rate;
        if ("VIP".equals(grade)) {
            rate = 5;
        } else if ("GOLD".equals(grade)) {
            rate = 3;
        } else {
            rate = 1;
        }
        int point = amount * rate / 100;
        // 2021 여름 이벤트: 5만 원 이상 구매 보너스
        if (amount >= 50000) {
            if (!"VIP".equals(grade)) {
                point = point + 500;
            }
        }
        if (point > 3000) {
            point = 3000;
        }
        // 쿠폰을 쓰면 적립은 절반
        if (couponUsed) {
            point = point / 2;
        }
        return point;
    }

    /** 화면 등급 드롭다운에 쓰는 등급 이름. 레거시라 배열로 돌려준다. 부를 때마다 새 배열이다. */
    public static String[] gradeNames() {
        return new String[] {"VIP", "GOLD", "BASIC"};
    }

    /** 등급별 적립률(%)을 {@link #gradeNames()} 순서대로 담은 배열. 부를 때마다 새 배열이다. */
    public static int[] gradeRates() {
        return new int[] {5, 3, 1};
    }
}
