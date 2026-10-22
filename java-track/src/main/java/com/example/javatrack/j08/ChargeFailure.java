package com.example.javatrack.j08;

/**
 * 주어진 record: 고치지 않는다.
 * 검사에 실패한 요청 한 건. index는 요청 목록에서의 위치(0부터), reason은 사람이 읽을 사유다.
 */
public record ChargeFailure(int index, String reason) {
}
