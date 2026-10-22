package com.example.board.notification;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.board.member.AuthMember;

@RestController
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /** 내 알림함(IN_APP) 최신 20건. PUSH·EMAIL은 발송 대기열이라 여기 나오지 않는다. */
    @GetMapping("/api/me/notifications")
    @Transactional(readOnly = true)
    public List<NotificationResponse> list(@AuthenticationPrincipal AuthMember auth) {
        return notificationRepository.findTop20ByMemberIdAndChannelOrderByIdDesc(auth.id(), NotificationChannel.IN_APP)
                .stream().map(NotificationResponse::from).toList();
    }
}
