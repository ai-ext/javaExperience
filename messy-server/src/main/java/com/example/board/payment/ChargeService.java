package com.example.board.payment;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import com.example.board.common.BusinessException;
import com.example.board.common.ErrorCode;
import com.example.board.member.MemberRepository;
import com.example.board.point.PointService;

/**
 * 충전은 두 단계다: REQUESTED 저장(트랜잭션 1) → PG 승인과 결과 반영(트랜잭션 2).
 * REQUESTED를 먼저 커밋해 두므로 PG가 실패해도 연계 로그는 남는다.
 */
@Service
public class ChargeService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final String REF_TYPE = "PG_PAYMENT";

    private final PgPaymentRepository paymentRepository;
    private final MemberRepository memberRepository;
    private final PointService pointService;
    private final PgClient pgClient;
    private final TransactionTemplate tx;

    public ChargeService(PgPaymentRepository paymentRepository, MemberRepository memberRepository,
            PointService pointService, PgClient pgClient, TransactionTemplate tx) {
        this.paymentRepository = paymentRepository;
        this.memberRepository = memberRepository;
        this.pointService = pointService;
        this.pgClient = pgClient;
        this.tx = tx;
    }

    /**
     * PG가 잠깐 느린 경우가 많아 응답 타임아웃이면 한 번 더 시도한다.
     * 같은 키로 다시 보내면 "결과 확인 중"(504)만 돌아오므로 재시도는 새 키로 한다.
     */
    public ChargeResponse charge(Long memberId, String idempotencyKey, int amount) {
        try {
            return chargeOnce(memberId, idempotencyKey, amount);
        } catch (BusinessException e) {
            if (e.errorCode() != ErrorCode.PG_TIMEOUT) {
                throw e;
            }
            return chargeOnce(memberId, UUID.randomUUID().toString(), amount);
        }
    }

    private ChargeResponse chargeOnce(Long memberId, String idempotencyKey, int amount) {
        Started started = start(memberId, idempotencyKey, amount);
        PgPayment payment = started.payment();
        if (!started.fresh()) {
            return replay(payment);
        }

        try {
            // 승인과 결과 반영을 한 트랜잭션으로 묶는다. PG는 승인했는데 우리 쪽 반영이 빠지는 틈을 없앤다.
            return tx.execute(s -> apply(payment, pgClient.approve(payment.getOrderId(), amount, idempotencyKey)));
        } catch (PgException e) {
            throw fail(payment, e);
        }
    }

    /**
     * 결과 불명 건을 PG 조회로 확정한다(재처리 워커가 부른다). 추측으로 정하지 않고, PG에 없으면 그대로 둔다.
     * 조회도 외부 호출이라 트랜잭션 밖에서 한다.
     */
    public PgPaymentStatus reconcile(String orderId) {
        PgPayment payment = tx.execute(s -> paymentRepository.findByOrderId(orderId))
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "충전 기록이 없습니다."));
        if (payment.getStatus() == PgPaymentStatus.DONE || payment.getStatus() == PgPaymentStatus.FAILED) {
            return payment.getStatus();
        }
        pgClient.findByOrderId(orderId).ifPresent(found -> tx.executeWithoutResult(s -> {
            switch (found.status()) {
                case DONE -> settleDone(payment, found.paymentKey());
                case FAILED -> paymentRepository.markFailed(payment.getId(), found.paymentKey(), now());
                case PENDING -> {
                    // 아직 PG도 처리 중이다
                }
            }
        }));
        return tx.execute(s -> reload(payment).getStatus());
    }

    /**
     * PG 콜백 반영. 승인 응답·조회와 같은 조건부 전이를 쓰므로 어느 쪽이 먼저 와도 적립은 한 번이다.
     * 이미 확정된 건의 재전송은 아무것도 바꾸지 않고 성공으로 끝낸다(PG가 재전송을 멈추도록).
     */
    public void applyCallback(PgCallbackRequest callback) {
        tx.executeWithoutResult(s -> {
            PgPayment payment = paymentRepository.findByOrderId(callback.orderId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "충전 기록이 없습니다."));
            if (payment.getAmount() != callback.amount()) {
                throw new BusinessException(ErrorCode.VALIDATION, "금액이 충전 요청과 다릅니다.");
            }
            if ("DONE".equals(callback.status())) {
                settleDone(payment, callback.paymentKey());
            } else {
                paymentRepository.markFailed(payment.getId(), callback.paymentKey(), now());
            }
        });
    }

    /** 트랜잭션 1: 호출 전에 REQUESTED를 커밋해 둔다. 같은 키가 이미 있으면 그 기록을 돌려준다. */
    private Started start(Long memberId, String idempotencyKey, int amount) {
        try {
            return tx.execute(s -> paymentRepository.findByIdempotencyKey(idempotencyKey)
                    .map(existing -> new Started(sameRequest(existing, memberId, amount), false))
                    .orElseGet(() -> new Started(paymentRepository.saveAndFlush(PgPayment.request(
                            memberRepository.getReferenceById(memberId), amount, idempotencyKey, now())), true)));
        } catch (DataIntegrityViolationException duplicateKey) {
            // UNIQUE(idempotency_key) 위반 = 같은 키의 요청이 먼저 커밋됐다
            return tx.execute(s -> paymentRepository.findByIdempotencyKey(idempotencyKey)
                    .map(existing -> new Started(sameRequest(existing, memberId, amount), false))
                    .orElseThrow(() -> duplicateKey));
        }
    }

    private PgPayment sameRequest(PgPayment existing, Long memberId, int amount) {
        if (!existing.getMember().getId().equals(memberId) || existing.getAmount() != amount) {
            throw new BusinessException(ErrorCode.IDEMPOTENCY_MISMATCH, "같은 Idempotency-Key에 다른 요청 본문입니다.");
        }
        return existing;
    }

    /** 같은 키의 재요청은 PG를 다시 부르지 않는다. 결과 불명 건은 콜백·조회로만 확정한다. */
    private ChargeResponse replay(PgPayment payment) {
        return switch (payment.getStatus()) {
            case DONE -> response(payment);
            case FAILED -> throw declined(payment);
            case REQUESTED, UNKNOWN -> throw timeout(payment);
        };
    }

    /** 트랜잭션 2: 승인 결과를 반영한다. */
    private ChargeResponse apply(PgPayment payment, PgApproval approval) {
        return switch (approval.status()) {
            case DONE -> tx.execute(s -> {
                settleDone(payment, approval.paymentKey());
                return response(reload(payment));
            });
            case FAILED -> {
                tx.executeWithoutResult(s -> paymentRepository.markFailed(payment.getId(), approval.paymentKey(), now()));
                throw declined(payment);
            }
            case PENDING -> tx.execute(s -> {
                paymentRepository.markUnknown(payment.getId(), now());
                return response(reload(payment));
            });
        };
    }

    private BusinessException fail(PgPayment payment, PgException e) {
        return switch (e.kind()) {
            // 요청을 보냈지만 답을 못 받았다. 실패로 단정하지 않는다.
            case TIMEOUT -> {
                markUnknown(payment);
                yield timeout(payment);
            }
            case SERVER_ERROR -> {
                markUnknown(payment);
                yield declined(payment);
            }
            // PG에 닿지 않았거나 PG가 명시적으로 거절했다
            case UNREACHABLE, POOL_TIMEOUT, DECLINED -> {
                tx.executeWithoutResult(s -> paymentRepository.markFailed(payment.getId(), null, now()));
                yield declined(payment);
            }
        };
    }

    /** 영향 행 수 1일 때만 적립한다. 승인 응답·콜백·조회 중 먼저 온 하나만 1을 받는다. */
    void settleDone(PgPayment payment, String paymentKey) {
        if (paymentRepository.markDone(payment.getId(), paymentKey, now()) == 1) {
            pointService.charge(payment.getMember().getId(), payment.getAmount(), REF_TYPE, payment.getId());
        }
    }

    private void markUnknown(PgPayment payment) {
        tx.executeWithoutResult(s -> paymentRepository.markUnknown(payment.getId(), now()));
    }

    private PgPayment reload(PgPayment payment) {
        return paymentRepository.findById(payment.getId()).orElseThrow();
    }

    private ChargeResponse response(PgPayment payment) {
        Long memberId = payment.getMember().getId();
        return new ChargeResponse(payment.getOrderId(), payment.getAmount(), payment.getStatus(),
                pointService.getBalance(memberId));
    }

    private static BusinessException timeout(PgPayment payment) {
        return new BusinessException(ErrorCode.PG_TIMEOUT,
                "PG 응답을 받지 못했습니다. 결과를 확인 중입니다. orderId=" + payment.getOrderId());
    }

    private static BusinessException declined(PgPayment payment) {
        return new BusinessException(ErrorCode.PG_DECLINED, "PG 승인에 실패했습니다. orderId=" + payment.getOrderId());
    }

    private static LocalDateTime now() {
        return LocalDateTime.now(KST);
    }

    private record Started(PgPayment payment, boolean fresh) {
    }
}
