package com.example.javatrack.j08;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
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
        // String은 불변이라 반복문에서 +=를 쓰면 매번 새 문자열을 만든다. 한 버퍼에 이어 붙인다
        StringBuilder url = new StringBuilder(baseUrl);
        char separator = '?';
        for (Map.Entry<String, String> param : params.entrySet()) {
            url.append(separator)
                    .append(param.getKey())
                    .append('=')
                    .append(URLEncoder.encode(param.getValue(), StandardCharsets.UTF_8));
            separator = '&';
        }
        return url.toString();
    }

    /** {@code "PG 승인 orderId=CHG-1 amount=10000 elapsedMs=120"} 모양의 로그 한 줄. String.format으로 만든다. */
    public static String approvalLog(String orderId, int amount, long elapsedMillis) {
        return String.format("PG 승인 orderId=%s amount=%d elapsedMs=%d", orderId, amount, elapsedMillis);
    }
}
