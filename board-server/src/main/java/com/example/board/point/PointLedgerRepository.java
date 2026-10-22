package com.example.board.point;

import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PointLedgerRepository extends JpaRepository<PointLedger, Long> {

    /** 활동 랭킹의 원천. 글·댓글 적립(EARN)만 합산한다(충전·구매는 활동이 아니다). */
    @Query("select new com.example.board.point.MemberScore(l.member.id, sum(l.amount)) from PointLedger l"
            + " where l.type = com.example.board.point.PointLedgerType.EARN and l.refType in :refTypes"
            + " group by l.member.id order by sum(l.amount) desc, l.member.id")
    List<MemberScore> sumActivityScores(@Param("refTypes") Collection<String> refTypes, Pageable pageable);
}
