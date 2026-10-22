package com.example.board.notification;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /** 알림함: idx_notification_member_channel_id(member_id, channel, id)로 최신 20건 */
    List<Notification> findTop20ByMemberIdAndChannelOrderByIdDesc(Long memberId, NotificationChannel channel);
}
