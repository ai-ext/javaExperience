package com.example.javatrack.j06;

import java.util.Comparator;

/**
 * 주어진 함정 코드: 고치지 않는다. {@link CursorOrders#byIdDesc()}와 비교하려고 둔다.
 * 두 long id의 차이를 int로 잘라 비교 결과로 쓴다. 차이가 int 범위를 넘으면 부호가 뒤집힌다.
 */
public final class LeakyComparators {

    private LeakyComparators() {
    }

    public static final Comparator<HasId> BY_ID_DESC_SUBTRACT = (a, b) -> (int) (b.id() - a.id());
}
