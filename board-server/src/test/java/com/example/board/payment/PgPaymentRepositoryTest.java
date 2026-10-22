package com.example.board.payment;

import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.support.TransactionTemplate;

import com.example.board.ApiTestSupport;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PgPaymentRepositoryTest extends ApiTestSupport {

    @Autowired
    PgPaymentRepository repository;

    @Autowired
    TransactionTemplate tx;

    PgPayment requested(Member m, String key) {
        return repository.saveAndFlush(PgPayment.request(m, 5000, key, LocalDateTime.now()));
    }

    String key() {
        return "key-" + UUID.randomUUID();
    }

    String status(PgPayment p) {
        return jdbc.queryForObject("SELECT status FROM pg_payment WHERE id = ?", String.class, p.getId());
    }

    int done(PgPayment p) {
        return tx.execute(s -> repository.markDone(p.getId(), "pk-" + p.getOrderId(), LocalDateTime.now()));
    }

    int unknown(PgPayment p) {
        return tx.execute(s -> repository.markUnknown(p.getId(), LocalDateTime.now()));
    }

    int failed(PgPayment p) {
        return tx.execute(s -> repository.markFailed(p.getId(), null, LocalDateTime.now()));
    }

    @Test
    void 요청_기록은_REQUESTED이고_order_id는_CHG_UUID다() {
        PgPayment p = requested(newMember(Role.USER), key());

        assertThat(status(p)).isEqualTo("REQUESTED");
        assertThat(p.getOrderId()).matches("CHG-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}");
        assertThat(p.getRequestedAt()).isNotNull();
        assertThat(p.getPaymentKey()).isNull();
    }

    @Test
    void 같은_idempotency_key로_두_번_저장하면_UNIQUE_위반이다() {
        Member m = newMember(Role.USER);
        String key = key();
        requested(m, key);

        assertThatThrownBy(() -> requested(m, key)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void 같은_payment_key는_두_결제에_쓸_수_없다() {
        Member m = newMember(Role.USER);
        PgPayment a = requested(m, key());
        PgPayment b = requested(m, key());
        tx.executeWithoutResult(s -> repository.markDone(a.getId(), "pk-dup", LocalDateTime.now()));

        assertThatThrownBy(() -> tx.executeWithoutResult(
                s -> repository.markDone(b.getId(), "pk-dup", LocalDateTime.now())))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void DONE_전이는_REQUESTED나_UNKNOWN에서_한_번만_성공한다() {
        Member m = newMember(Role.USER);
        PgPayment p = requested(m, key());

        int first = done(p);
        int second = done(p);

        assertThat(first).isEqualTo(1);
        assertThat(second).isZero();
        assertThat(status(p)).isEqualTo("DONE");

        PgPayment unknown = requested(m, key());
        assertThat(unknown(unknown)).isEqualTo(1);
        assertThat(done(unknown)).isEqualTo(1);
    }

    @Test
    void 이미_확정된_결제는_UNKNOWN이나_FAILED로_되돌아가지_않는다() {
        PgPayment p = requested(newMember(Role.USER), key());
        done(p);

        assertThat(unknown(p)).isZero();
        assertThat(failed(p)).isZero();
        assertThat(status(p)).isEqualTo("DONE");
    }
}
