package com.example.board.admin;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByPostIdAndReporterId(Long postId, Long reporterId);
}
