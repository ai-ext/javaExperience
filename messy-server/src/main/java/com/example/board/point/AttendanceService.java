package com.example.board.point;

import java.time.Clock;
import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.board.common.BusinessException;
import com.example.board.common.ErrorCode;
import com.example.board.member.MemberRepository;

/** 하루 한 번 출석하면 포인트를 적립한다. */
@Service
public class AttendanceService {

    static final int ATTENDANCE_POINTS = 10;

    private final AttendanceRepository attendanceRepository;
    private final MemberRepository memberRepository;
    private final PointService pointService;
    private final Clock clock;

    public AttendanceService(AttendanceRepository attendanceRepository, MemberRepository memberRepository,
            PointService pointService, Clock clock) {
        this.attendanceRepository = attendanceRepository;
        this.memberRepository = memberRepository;
        this.pointService = pointService;
        this.clock = clock;
    }

    @Transactional
    public AttendanceResponse attend(Long memberId) {
        // 테스트에서 날짜를 바꿔 끼울 수 있게 LocalDate.now() 대신 주입받은 시계로 오늘을 구한다
        LocalDate today = LocalDate.now(clock);
        // 같은 회원의 동시 출석을 줄 세운다. 출석 INSERT(FK 공유 잠금)와 잔액 UPDATE 사이의 교착도 막는다.
        memberRepository.findByIdForUpdate(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "회원을 찾을 수 없습니다."));
        if (attendanceRepository.existsByMemberIdAndAttendedOn(memberId, today)) {
            throw new BusinessException(ErrorCode.DUPLICATE, "오늘은 이미 출석했습니다.");
        }
        Attendance saved = attendanceRepository.save(Attendance.create(memberId, today));
        pointService.earn(memberId, ATTENDANCE_POINTS, "ATTENDANCE", saved.getId());
        return new AttendanceResponse(today, ATTENDANCE_POINTS);
    }
}
