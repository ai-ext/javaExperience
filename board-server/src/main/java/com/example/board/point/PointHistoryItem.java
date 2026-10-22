package com.example.board.point;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

import lombok.Getter;

/** 이력 한 줄. MyBatis가 필드에 직접 채우는 읽기 전용 모델이다. */
@Getter
public class PointHistoryItem {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private Long id;
    private PointLedgerType type;
    private long amount;
    private long balanceAfter;
    private String refType;
    private Long refId;
    private LocalDateTime createdAt;

    /** DB에는 KST 벽시계 시간이 저장된다. 다른 응답과 같은 오프셋 형식으로 내보낸다. */
    public OffsetDateTime getCreatedAt() {
        return createdAt.atZone(KST).toOffsetDateTime();
    }
}
