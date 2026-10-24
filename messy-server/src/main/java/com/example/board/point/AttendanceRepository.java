package com.example.board.point;

import java.time.LocalDate;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    boolean existsByMemberIdAndAttendedOn(Long memberId, LocalDate attendedOn);
}
