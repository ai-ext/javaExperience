package com.example.board.member;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);

    /** DB가 한 문장으로 더한다. 읽고 더해 저장하면 동시 적립에서 갱신이 유실된다. */
    @Modifying
    @Query("update Member m set m.pointBalance = m.pointBalance + :amount where m.id = :id")
    int addBalance(@Param("id") Long id, @Param("amount") long amount);

    /** 잔액이 충분할 때만 뺀다. 영향 행 수 0이면 부족(또는 없는 회원)이다. */
    @Modifying
    @Query("update Member m set m.pointBalance = m.pointBalance - :amount where m.id = :id and m.pointBalance >= :amount")
    int subtractBalanceIfEnough(@Param("id") Long id, @Param("amount") long amount);

    /** UPDATE로 잠근 행의 잔액을 읽는다. 같은 트랜잭션이라 방금 바꾼 값이 보인다. */
    @Query("select m.pointBalance from Member m where m.id = :id")
    Optional<Long> findBalance(@Param("id") Long id);

    /** 글 작성처럼 자식 INSERT(FK 공유 잠금) 전에 배타 잠금을 먼저 잡아 잔액 UPDATE와의 교착을 막는다. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from Member m where m.id = :id")
    Optional<Member> findByIdForUpdate(@Param("id") Long id);

    /** 있는 회원 id만 돌려준다. 대량 지급에서 파일의 id를 한 번에 확인할 때 쓴다(행마다 조회하지 않는다). */
    @Query("select m.id from Member m where m.id in :ids")
    List<Long> findExistingIds(@Param("ids") Collection<Long> ids);
}
