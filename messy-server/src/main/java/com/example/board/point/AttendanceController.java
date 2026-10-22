package com.example.board.point;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.board.member.AuthMember;

@RestController
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    /** 오늘 첫 출석이면 201과 적립 포인트, 이미 출석했으면 409 /errors/duplicate */
    @PostMapping("/api/me/attendance")
    public ResponseEntity<AttendanceResponse> attend(@AuthenticationPrincipal AuthMember auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceService.attend(auth.id()));
    }
}
