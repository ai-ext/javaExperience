package com.example.board.admin;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByPostIdAndReporterId(Long postId, Long reporterId);

    /** 응답에 글 제목·신고자 닉네임을 담으므로 한 번에 읽는다(N+1 방지). afterId가 null이면 처음부터. */
    @Query("""
            select r from Report r
            join fetch r.post
            join fetch r.reporter
            where r.status = :status and (:afterId is null or r.id < :afterId)
            order by r.id desc
            """)
    List<Report> findPage(@Param("status") ReportStatus status, @Param("afterId") Long afterId, Pageable pageable);
}
