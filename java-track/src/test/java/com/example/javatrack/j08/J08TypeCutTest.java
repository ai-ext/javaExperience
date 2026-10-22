package com.example.javatrack.j08;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

/** 타입 한 컷: String 불변, + 결합과 StringBuilder, String.format — 외부 API URL과 로그 메시지. */
class J08TypeCutTest {

    private static final String BASE = "https://pg.example.com/pg/v1/payments";

    @Test
    void 쿼리_파라미터를_넣은_순서대로_이어_붙인다() {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("orderId", "CHG-1");
        params.put("status", "DONE");

        assertThat(PgMessages.queryUrl(BASE, params)).isEqualTo(BASE + "?orderId=CHG-1&status=DONE");
    }

    @Test
    void 파라미터가_없으면_물음표_없이_기본_URL만_돌려준다() {
        assertThat(PgMessages.queryUrl(BASE, Map.of())).isEqualTo(BASE);
    }

    @Test
    void 값에_섞인_특수문자는_인코딩해_파라미터가_갈라지지_않게_한다() {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("memo", "a&b c");

        // 인코딩하지 않으면 ?memo=a&b c — PG는 memo=a와 이름이 "b c"인 파라미터로 읽는다
        assertThat(PgMessages.queryUrl(BASE, params)).isEqualTo(BASE + "?memo=a%26b+c");
    }

    @Test
    void 로그_메시지는_String_format으로_자리를_채운다() {
        assertThat(PgMessages.approvalLog("CHG-1", 10_000, 120L))
                .isEqualTo("PG 승인 orderId=CHG-1 amount=10000 elapsedMs=120");
    }

    @Test
    void 함정_String은_불변이라_concat_결과를_받지_않으면_그대로다() {
        String url = BASE;
        // concat·replace·toUpperCase는 새 String을 돌려줄 뿐 url 자신은 바꾸지 않는다
        url.concat("?orderId=CHG-1");
        assertThat(url).isEqualTo(BASE);

        // queryUrl도 받은 baseUrl을 바꿀 수 없다. 결과는 반환값으로만 나온다
        Map<String, String> params = new LinkedHashMap<>();
        params.put("orderId", "CHG-1");
        String built = PgMessages.queryUrl(BASE, params);

        assertThat(BASE).isEqualTo("https://pg.example.com/pg/v1/payments");
        assertThat(built).isEqualTo(BASE + "?orderId=CHG-1");
    }
}
