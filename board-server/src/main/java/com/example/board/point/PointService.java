package com.example.board.point;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.board.common.BusinessException;
import com.example.board.common.CursorPage;
import com.example.board.common.ErrorCode;
import com.example.board.member.MemberRepository;

/** 잔액 갱신과 원장 기록을 호출자의 트랜잭션에 함께 묶는다(없으면 새로 연다). */
@Service
public class PointService {

    private final MemberRepository memberRepository;
    private final PointLedgerRepository ledgerRepository;
    private final PointHistoryMapper historyMapper;

    public PointService(MemberRepository memberRepository, PointLedgerRepository ledgerRepository,
            PointHistoryMapper historyMapper) {
        this.memberRepository = memberRepository;
        this.ledgerRepository = ledgerRepository;
        this.historyMapper = historyMapper;
    }

    @Transactional
    public void earn(Long memberId, int amount, String refType, Long refId) {
        if (memberRepository.addBalance(memberId, amount) == 0) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "회원을 찾을 수 없습니다.");
        }
        record(memberId, PointLedgerType.EARN, amount, refType, refId);
    }

    /** PG 승인이 확정된 충전 적립. 호출자가 같은 결제로 두 번 부르지 않도록 상태 전이로 막는다. */
    @Transactional
    public void charge(Long memberId, int amount, String refType, Long refId) {
        if (memberRepository.addBalance(memberId, amount) == 0) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "회원을 찾을 수 없습니다.");
        }
        record(memberId, PointLedgerType.CHARGE, amount, refType, refId);
    }

    @Transactional
    public void spend(Long memberId, int amount, String refType, Long refId) {
        if (memberRepository.subtractBalanceIfEnough(memberId, amount) == 0) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_POINTS, "포인트가 부족합니다.");
        }
        record(memberId, PointLedgerType.SPEND, -amount, refType, refId);
    }

    @Transactional(readOnly = true)
    public long getBalance(Long memberId) {
        return memberRepository.findBalance(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "회원을 찾을 수 없습니다."));
    }

    @Transactional(readOnly = true)
    public CursorPage<PointHistoryItem> history(Long memberId, String cursor, int size) {
        Long afterId = CursorPage.decode(cursor);
        // 한 건 더 읽어 다음 쪽이 있는지만 판단한다
        List<PointHistoryItem> rows = historyMapper.findByMember(memberId, afterId, size + 1);
        boolean hasNext = rows.size() > size;
        List<PointHistoryItem> page = hasNext ? rows.subList(0, size) : rows;
        String next = hasNext ? CursorPage.encode(page.get(page.size() - 1).getId()) : null;
        return new CursorPage<>(page, next);
    }

    private void record(Long memberId, PointLedgerType type, long signedAmount, String refType, Long refId) {
        long after = memberRepository.findBalance(memberId).orElseThrow();
        ledgerRepository.save(PointLedger.create(memberRepository.getReferenceById(memberId), type, signedAmount,
                after, refType, refId));
    }
}
