package com.example.board.point;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import com.example.board.common.BaseEntity;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 출석 한 번. 회원·날짜마다 한 행(uk_attendance_member_date). */
@Getter
@Entity
@Table(name = "attendance")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Attendance extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false)
    private Long memberId;

    @Column(name = "attended_on", nullable = false)
    private LocalDate attendedOn;

    private Attendance(Long memberId, LocalDate attendedOn) {
        this.memberId = memberId;
        this.attendedOn = attendedOn;
    }

    public static Attendance create(Long memberId, LocalDate attendedOn) {
        return new Attendance(memberId, attendedOn);
    }
}
