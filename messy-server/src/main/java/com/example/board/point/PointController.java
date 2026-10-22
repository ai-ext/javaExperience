package com.example.board.point;

import jakarta.validation.Valid;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.board.common.CursorPage;
import com.example.board.member.AuthMember;

@RestController
@RequestMapping("/api/me/points")
public class PointController {

    private final PointService pointService;

    public PointController(PointService pointService) {
        this.pointService = pointService;
    }

    @GetMapping
    public PointBalanceResponse balance(@AuthenticationPrincipal AuthMember auth) {
        return new PointBalanceResponse(pointService.getBalance(auth.id()));
    }

    @GetMapping("/history")
    public CursorPage<PointHistoryItem> history(@AuthenticationPrincipal AuthMember auth,
            @Valid PointHistoryRequest request) {
        return pointService.history(auth.id(), request.cursor(), request.size());
    }
}
