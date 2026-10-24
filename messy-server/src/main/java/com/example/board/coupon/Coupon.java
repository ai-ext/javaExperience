package com.example.board.coupon;

import java.time.LocalDateTime;

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

@Getter
@Entity
@Table(name = "coupon")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Coupon extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "total_quantity", nullable = false)
    private int totalQuantity;

    // 발급 수량은 조건부 UPDATE로만 바꾼다
    @Column(name = "issued_quantity", nullable = false)
    private int issuedQuantity;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    private Coupon(String name, int totalQuantity, LocalDateTime expiresAt) {
        this.name = name;
        this.totalQuantity = totalQuantity;
        this.expiresAt = expiresAt;
    }

    public static Coupon create(String name, int totalQuantity, LocalDateTime expiresAt) {
        return new Coupon(name, totalQuantity, expiresAt);
    }
}
