package com.example.javatrack.j11;

/**
 * {@link J11MutantTest}가 쓰는 변형. 원본 {@link LegacyPointCalculator} 소스에서 한 곳만 바꾼다.
 * 특성화 테스트가 지금 동작을 제대로 고정했다면 변형마다 하나 이상 실패해야 한다. 이 파일은 고치지 않는다.
 */
enum LegacyPointCalculatorMutant {

    보너스_경계를_5만원_초과로_옮김("amount >= 50000", "amount > 50000"),
    VIP_보너스_제외_규칙을_지움("if (!\"VIP\".equals(grade)) {", "if (true) {"),
    쿠폰_절반을_반올림으로_바꿈("point = point / 2;", "point = (point + 1) / 2;"),
    천_원_경계를_1000원_이하로_옮김("amount < 1000", "amount <= 1000"),
    상한에서_자른_값을_3500으로_바꿈("point = 3000;", "point = 3500;"),
    등급_비교에서_대소문자를_무시함("if (\"VIP\".equals(grade)) {", "if (\"VIP\".equalsIgnoreCase(grade)) {");

    private final String original;
    private final String mutated;

    LegacyPointCalculatorMutant(String original, String mutated) {
        this.original = original;
        this.mutated = mutated;
    }

    /** 원본 소스에 바꿀 자리가 정확히 한 곳일 때만 바꾼다. 원본이 바뀌어 자리를 못 찾으면 바로 알린다. */
    String applyTo(String source) {
        int first = source.indexOf(original);
        if (first < 0 || source.indexOf(original, first + 1) >= 0) {
            throw new IllegalStateException("변형 " + name() + ": 원본에서 '" + original + "'를 정확히 한 곳에서 찾지 못했습니다");
        }
        return source.replace(original, mutated);
    }
}
