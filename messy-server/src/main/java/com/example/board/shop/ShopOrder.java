package com.example.board.shop;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import com.example.board.common.BaseEntity;
import com.example.board.coupon.MemberCoupon;
import com.example.board.member.Member;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "shop_order")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ShopOrder extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private ShopItem item;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "paid_amount", nullable = false)
    private long paidAmount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_coupon_id")
    private MemberCoupon memberCoupon;

    @Column(name = "idempotency_key", nullable = false, length = 64)
    private String idempotencyKey;

    private ShopOrder(Member member, ShopItem item, int quantity, long paidAmount, MemberCoupon memberCoupon,
            String idempotencyKey) {
        this.member = member;
        this.item = item;
        this.quantity = quantity;
        this.paidAmount = paidAmount;
        this.memberCoupon = memberCoupon;
        this.idempotencyKey = idempotencyKey;
    }

    public static ShopOrder create(Member member, ShopItem item, int quantity, long paidAmount,
            MemberCoupon memberCoupon, String idempotencyKey) {
        return new ShopOrder(member, item, quantity, paidAmount, memberCoupon, idempotencyKey);
    }

    /** 같은 키의 재요청이 처음 요청과 같은 본문인지 판단한다. */
    public boolean matches(Long itemId, int quantity, Long memberCouponId) {
        Long ownCoupon = memberCoupon == null ? null : memberCoupon.getId();
        return item.getId().equals(itemId) && this.quantity == quantity && java.util.Objects.equals(ownCoupon, memberCouponId);
    }
}
