package com.example.board.tickets;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import com.example.board.ApiTestSupport;
import com.example.board.PgContainers;
import com.example.board.member.Member;
import com.example.board.member.Role;
import com.example.board.payment.ChargeService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * B10 확인 테스트: PG가 승인은 했는데 응답이 늦어(3초 응답 타임아웃 초과) 우리 서버가 못 받은 경우에도
 * 충전 한 번은 PG 승인 한 건, 포인트 적립 한 번이다.
 * PG 모의는 상태가 있다: 첫 승인 요청은 승인하되 4초 늦게 답하고, 그 뒤 요청은 바로 답한다.
 * 결과 불명으로 남은 건은 재처리 워커(reconcile)가 PG 조회로 확정한다(PG는 받은 승인 요청을 모두 승인했다).
 */
class B10ConfirmTest extends ApiTestSupport {

    private static final int AMOUNT = 7000;

    @Autowired
    ChargeService chargeService;

    @AfterEach
    void resetPg() {
        PgContainers.reset();
    }

    @Test
    void 승인_응답이_늦게_와도_PG_승인은_한_건이고_포인트는_한_번_쌓인다() throws Exception {
        stubApprovedButLateOnce();
        Member m = newMember(Role.USER);

        mockMvc.perform(post("/api/me/points/charges").contentType(MediaType.APPLICATION_JSON)
                .content("{\"amount\":" + AMOUNT + "}").header("Authorization", bearer(m))
                .header("Idempotency-Key", UUID.randomUUID().toString())).andReturn();

        // PG가 받은 승인 요청(= PG가 승인한 건)을 재처리 워커가 확정한다
        List<String> pgKeys = PgContainers.approveIdempotencyKeys();
        for (Map<String, Object> row : jdbc.queryForList(
                "SELECT order_id, idempotency_key FROM pg_payment WHERE member_id = ? AND status IN ('REQUESTED', 'UNKNOWN')",
                m.getId())) {
            if (pgKeys.contains((String) row.get("idempotency_key"))) {
                String orderId = (String) row.get("order_id");
                PgContainers.stubLookupDone(orderId, AMOUNT);
                chargeService.reconcile(orderId);
            }
        }

        Set<String> approvals = new HashSet<>(pgKeys);
        assertThat(approvals).as("PG가 승인한 건수(서로 다른 Idempotency-Key)").hasSize(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM point_ledger WHERE member_id = ? AND type = 'CHARGE'",
                Integer.class, m.getId())).as("충전 적립 원장 건수").isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT point_balance FROM member WHERE id = ?", Long.class, m.getId()))
                .as("잔액").isEqualTo(AMOUNT);
    }

    /** 첫 승인 요청: 승인하지만 4초 뒤에 답한다(응답 유실). 이후 요청: 바로 승인. paymentKey는 pk-{orderId}. */
    private static void stubApprovedButLateOnce() {
        String body = "\"{\\\"paymentKey\\\":\\\"pk-{{jsonPath request.body '$.orderId'}}\\\",\\\"status\\\":\\\"DONE\\\","
                + "\\\"amount\\\":{{jsonPath request.body '$.amount'}},\\\"approvedAt\\\":\\\"{{now}}\\\"}\"";
        PgContainers.stub("""
                {"priority":1,"scenarioName":"b10-late-approval","requiredScenarioState":"Started","newScenarioState":"approved",
                 "request":{"method":"POST","urlPath":"/pg/v1/payments"},
                 "response":{"status":200,"fixedDelayMilliseconds":4000,"headers":{"Content-Type":"application/json"},
                  "body":%s,"transformers":["response-template"]}}
                """.formatted(body));
        PgContainers.stub("""
                {"priority":1,"scenarioName":"b10-late-approval","requiredScenarioState":"approved",
                 "request":{"method":"POST","urlPath":"/pg/v1/payments"},
                 "response":{"status":200,"headers":{"Content-Type":"application/json"},
                  "body":%s,"transformers":["response-template"]}}
                """.formatted(body));
    }
}
