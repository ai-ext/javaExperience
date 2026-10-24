package com.example.board.coupon;

import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.Positive;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.board.member.AuthMember;

@RestController
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @PostMapping("/api/coupons/{couponId}/issue")
    public ResponseEntity<Map<String, Long>> issue(@AuthenticationPrincipal AuthMember auth,
            @PathVariable @Positive Long couponId) {
        Long memberCouponId = couponService.issue(couponId, auth.id());
        return ResponseEntity.status(201).body(Map.of("memberCouponId", memberCouponId));
    }

    @GetMapping("/api/me/coupons")
    public List<MemberCouponResponse> myCoupons(@AuthenticationPrincipal AuthMember auth) {
        return couponService.myCoupons(auth.id());
    }
}
