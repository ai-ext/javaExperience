package com.example.board.payment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.example.board.member.AuthMember;

@RestController
public class ChargeController {

    private final ChargeService chargeService;

    public ChargeController(ChargeService chargeService) {
        this.chargeService = chargeService;
    }

    @PostMapping("/api/me/points/charges")
    public ResponseEntity<ChargeResponse> charge(@AuthenticationPrincipal AuthMember auth,
            @RequestHeader("Idempotency-Key") @Pattern(regexp = "[A-Za-z0-9-]{8,64}") String idempotencyKey,
            @Valid @RequestBody ChargeRequest request) {
        ChargeResponse response = chargeService.charge(auth.id(), idempotencyKey, request.amount());
        // PG가 PENDING으로 답하면 아직 확정 전이라 202다
        HttpStatus status = response.status() == PgPaymentStatus.DONE ? HttpStatus.CREATED : HttpStatus.ACCEPTED;
        return ResponseEntity.status(status).body(response);
    }
}
