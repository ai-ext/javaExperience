package com.example.board.notification;

/** 알림을 내보내는 길. IN_APP은 알림함, PUSH·EMAIL은 발송 대기열(배치가 읽어 실제로 보낸다)이다. */
public enum NotificationChannel {
    IN_APP, PUSH, EMAIL
}
