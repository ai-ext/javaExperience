package com.example.board.point;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.board.common.BusinessException;
import com.example.board.common.ErrorCode;
import com.example.board.member.MemberRepository;

/** 잔액 갱신과 원장 기록을 호출자의 트랜잭션에 함께 묶는다(없으면 새로 연다). */
@Service
public class PointService {

    private final MemberRepository memberRepository;
    private final PointLedgerRepository ledgerRepository;

    public PointService(MemberRepository memberRepository, PointLedgerRepository ledgerRepository) {
        this.memberRepository = memberRepository;
        this.ledgerRepository = ledgerRepository;
    }

    @Transactional
    public void earn(Long memberId, int amount, String refType, Long refId) {
        if (memberRepository.addBalance(memberId, amount) == 0) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "회원을 찾을 수 없습니다.");
        }
        record(memberId, PointLedgerType.EARN, amount, refType, refId);
    }

    @Transactional
    public void spend(Long memberId, int amount, String refType, Long refId) {
        if (memberRepository.subtractBalanceIfEnough(memberId, amount) == 0) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_POINTS, "포인트가 부족합니다.");
        }
        record(memberId, PointLedgerType.SPEND, -amount, refType, refId);
    }

    private void record(Long memberId, PointLedgerType type, long signedAmount, String refType, Long refId) {
        long after = memberRepository.findBalance(memberId).orElseThrow();
        ledgerRepository.save(PointLedger.create(memberRepository.getReferenceById(memberId), type, signedAmount,
                after, refType, refId));
    }
}
