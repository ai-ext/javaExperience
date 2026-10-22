package com.example.board.payment;

import org.junit.jupiter.api.Test;

import com.example.board.PgContainers;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ChargeApiTest extends PgApiTestSupport {

    @Test
    void 충전하면_201이고_잔액이_늘며_연계_로그는_DONE() throws Exception {
        Member m = newMember(Role.USER);
        String key = newKey();

        charge(m, key, 5000)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderId").value(orderId(key)))
                .andExpect(jsonPath("$.amount").value(5000))
                .andExpect(jsonPath("$.status").value("DONE"))
                .andExpect(jsonPath("$.balance").value(5000));

        assertThat(balance(m)).isEqualTo(5000);
        assertThat(paymentStatus(key)).isEqualTo("DONE");
        assertThat(chargeLedgers(m)).isEqualTo(1);
        assertThat(PgContainers.approveIdempotencyKeys()).containsExactly(key);
    }

    @Test
    void PG가_4초_늦으면_504이고_UNKNOWN으로_남고_잔액은_그대로() throws Exception {
        PgContainers.stubApproveDelay(4000);
        Member m = newMember(Role.USER);
        String key = newKey();

        charge(m, key, 5000)
                .andExpect(status().isGatewayTimeout())
                .andExpect(jsonPath("$.type").value("/errors/pg-timeout"));

        assertThat(paymentStatus(key)).isEqualTo("UNKNOWN");
        assertThat(balance(m)).isZero();
    }

    @Test
    void PG가_거절하면_502이고_FAILED() throws Exception {
        Member m = newMember(Role.USER);
        String key = newKey();

        // 파일 스텁: 금액 999000은 항상 거절(400)
        charge(m, key, 999000)
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.type").value("/errors/pg-declined"));

        assertThat(paymentStatus(key)).isEqualTo("FAILED");
        assertThat(balance(m)).isZero();
    }

    @Test
    void PG가_5xx로만_답하면_504이고_UNKNOWN으로_남고_같은_키_재요청도_504() throws Exception {
        // 승인 요청은 언제나 503. 승인 여부를 모르므로 실패(502)로 단정하지 않는다
        PgContainers.stub("""
                {"priority":1,"request":{"method":"POST","urlPath":"/pg/v1/payments"},"response":{"status":503}}
                """);
        Member m = newMember(Role.USER);
        String key = newKey();

        charge(m, key, 5000)
                .andExpect(status().isGatewayTimeout())
                .andExpect(jsonPath("$.type").value("/errors/pg-timeout"));

        assertThat(paymentStatus(key)).isEqualTo("UNKNOWN");
        assertThat(balance(m)).isZero();
        int calls = PgContainers.approveRequestCount();
        charge(m, key, 5000)
                .andExpect(status().isGatewayTimeout())
                .andExpect(jsonPath("$.type").value("/errors/pg-timeout"));
        assertThat(PgContainers.approveRequestCount()).isEqualTo(calls);
    }

    @Test
    void 금액이_1000_단위가_아니거나_범위_밖이면_400() throws Exception {
        Member m = newMember(Role.USER);

        for (int amount : new int[] {1500, 999, 0, 1001000}) {
            charge(m, newKey(), amount)
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.type").value("/errors/validation"))
                    .andExpect(jsonPath("$.errors[0].field").value("amount"));
        }
        assertThat(PgContainers.approveRequestCount()).isZero();
    }

    @Test
    void Idempotency_Key가_없거나_형식이_틀리면_400() throws Exception {
        Member m = newMember(Role.USER);

        charge(m, null, 5000).andExpect(status().isBadRequest());
        charge(m, "short", 5000).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("/errors/validation"));
    }

    @Test
    void 같은_키로_다시_보내면_처음_결과를_돌려주고_PG는_한_번만_부른다() throws Exception {
        Member m = newMember(Role.USER);
        String key = newKey();
        charge(m, key, 5000).andExpect(status().isCreated());

        charge(m, key, 5000)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderId").value(orderId(key)))
                .andExpect(jsonPath("$.status").value("DONE"));

        assertThat(balance(m)).isEqualTo(5000);
        assertThat(PgContainers.approveRequestCount()).isEqualTo(1);
    }

    @Test
    void 같은_키에_다른_금액이면_422() throws Exception {
        Member m = newMember(Role.USER);
        String key = newKey();
        charge(m, key, 5000).andExpect(status().isCreated());

        charge(m, key, 6000).andExpect(status().isUnprocessableContent());
    }

    @Test
    void 로그인하지_않으면_401() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/me/points/charges").contentType("application/json").content("{\"amount\":5000}")
                        .header("Idempotency-Key", newKey()))
                .andExpect(status().isUnauthorized());
    }
}
