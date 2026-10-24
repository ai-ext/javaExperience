package com.example.board.payment;

import java.util.Set;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.example.board.common.BusinessException;
import com.example.board.common.ErrorCode;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

/** 공개 경로(SecurityConfig permitAll)다. JWT 대신 서명으로 보호한다. */
@RestController
public class PgCallbackController {

    private final PgSignatureVerifier signatureVerifier;
    private final ChargeService chargeService;
    private final JsonMapper jsonMapper;
    private final Validator validator;

    public PgCallbackController(PgSignatureVerifier signatureVerifier, ChargeService chargeService,
            JsonMapper jsonMapper, Validator validator) {
        this.signatureVerifier = signatureVerifier;
        this.chargeService = chargeService;
        this.jsonMapper = jsonMapper;
        this.validator = validator;
    }

    // 본문을 byte[]로 받는다. @RequestBody DTO로 받으면 서명을 확인할 원문이 이미 사라진다.
    @PostMapping(path = "/api/pg/callbacks", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> callback(@RequestBody byte[] rawBody,
            @RequestHeader(value = "X-PG-Signature", required = false) String signature) {
        if (!signatureVerifier.verify(rawBody, signature)) {
            throw new BusinessException(ErrorCode.INVALID_SIGNATURE, "서명이 올바르지 않습니다.");
        }
        chargeService.applyCallback(parse(rawBody));
        return ResponseEntity.ok().build();
    }

    private PgCallbackRequest parse(byte[] rawBody) {
        PgCallbackRequest request;
        try {
            request = jsonMapper.readValue(rawBody, PgCallbackRequest.class);
        } catch (JacksonException e) {
            throw new BusinessException(ErrorCode.VALIDATION, "본문을 읽을 수 없습니다.");
        }
        Set<ConstraintViolation<PgCallbackRequest>> violations = validator.validate(request);
        if (!violations.isEmpty()) {
            throw new ConstraintViolationException(violations);
        }
        return request;
    }
}
