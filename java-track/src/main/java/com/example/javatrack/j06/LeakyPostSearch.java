package com.example.javatrack.j06;

import java.util.Optional;

/**
 * 주어진 함정 코드: 고치지 않는다. {@link CouponLookup#normalizeKeyword}와 비교하려고 둔다.
 * 매개변수를 Optional로 받는다. 부르는 쪽이 Optional 대신 null을 넘기면 막을 길이 없다.
 */
public final class LeakyPostSearch {

    private LeakyPostSearch() {
    }

    public static String normalizeKeyword(Optional<String> keyword) {
        return keyword.map(String::strip).orElse("");
    }
}
