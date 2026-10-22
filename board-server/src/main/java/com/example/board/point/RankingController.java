package com.example.board.point;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.board.common.CursorPage;

@RestController
public class RankingController {

    private final ActivityRankingService rankingService;

    public RankingController(ActivityRankingService rankingService) {
        this.rankingService = rankingService;
    }

    @GetMapping("/api/rankings/activity")
    public CursorPage<ActivityRank> activity(@Valid RankingRequest request) {
        return rankingService.top(request.cursor(), request.size());
    }
}
