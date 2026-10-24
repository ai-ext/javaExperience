package com.example.javatrack.j11;

import static org.junit.jupiter.api.Assertions.fail;

import org.junit.jupiter.api.Test;

/**
 * 주제 과제: 특성화 테스트 쓰기. <b>이 파일을 채운다.</b>
 * <p>
 * {@link LegacyPointCalculator#calculate}가 <b>지금</b> 돌려주는 값을 그대로 테스트로 고정한다.
 * "옳아 보이는 값"을 적으면 고치기 전부터 실패해 동작을 고정하지 못한다. 먼저 불러 보고 나온 값을 적는다.
 * <p>
 * 다 쓰면 {@link J11MutantTest}가 이 클래스를 원본과, 원본에서 한 곳만 바꾼 변형 3개에 돌려 본다.
 * 원본에서는 모두 통과하고 변형마다 하나 이상 실패해야 과제 끝이다.
 */
class J11CharacterizationTest {

    private final LegacyPointCalculator calculator = new LegacyPointCalculator();

    @Test
    void 특성화_테스트를_채우세요() {
        // TODO: 이 메서드를 지우고, 입력 조합마다 지금 나오는 포인트를 고정하는 테스트를 쓰세요
        fail("특성화 테스트를 채우세요");
    }
}
