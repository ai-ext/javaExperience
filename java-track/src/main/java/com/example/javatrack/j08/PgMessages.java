package com.example.javatrack.j08;

import java.util.Map;

/** 타입 한 컷: 외부 API URL과 로그 메시지 조립. */
public final class PgMessages {

    private PgMessages() {
    }

    /**
     * baseUrl 뒤에 {@code ?키=값&키=값}을 params 순서대로 붙인다. params가 비어 있으면 baseUrl을 그대로 돌려준다.
     * 값은 {@code URLEncoder.encode(값, UTF_8)}로 인코딩한다({@code &}가 값에 섞여도 파라미터가 갈라지지 않게).
     * StringBuilder로 조립한다.
     */
    public static String queryUrl(String baseUrl, Map<String, String> params) {
        throw new UnsupportedOperationException("J08: PgMessages.queryUrl — StringBuilder로 ?키=값&… 을 이어 붙이세요");
    }

    /** {@code "PG 승인 orderId=CHG-1 amount=10000 elapsedMs=120"} 모양의 로그 한 줄. String.format으로 만든다. */
    public static String approvalLog(String orderId, int amount, long elapsedMillis) {
        throw new UnsupportedOperationException("J08: PgMessages.approvalLog — String.format으로 자리를 채우세요");
    }
}
