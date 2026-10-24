package com.example.board.shop;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.board.common.BusinessException;
import com.example.board.common.ErrorCode;
import com.example.board.coupon.MemberCouponRepository;
import com.example.board.member.Member;
import com.example.board.member.MemberRepository;
import com.example.board.point.PointService;

/**
 * 상점 주문. 주문 한 건(재고·쿠폰·주문·포인트)은 placeOnce 트랜잭션 하나로 묶고,
 * 데드락이면 트랜잭션 밖(order)에서 다시 시도한다.
 */
@Service
public class OrderService {

    private static final int MAX_ATTEMPTS = 3;
    private static final int COUPON_DISCOUNT_PERCENT = 10;
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final ShopItemRepository shopItemRepository;
    private final ShopOrderRepository shopOrderRepository;
    private final MemberCouponRepository memberCouponRepository;
    private final MemberRepository memberRepository;
    private final PointService pointService;
    private final ThanksCouponService thanksCouponService;

    public OrderService(ShopItemRepository shopItemRepository, ShopOrderRepository shopOrderRepository,
            MemberCouponRepository memberCouponRepository, MemberRepository memberRepository,
            PointService pointService, ThanksCouponService thanksCouponService) {
        this.shopItemRepository = shopItemRepository;
        this.shopOrderRepository = shopOrderRepository;
        this.memberCouponRepository = memberCouponRepository;
        this.memberRepository = memberRepository;
        this.pointService = pointService;
        this.thanksCouponService = thanksCouponService;
    }

    public OrderResponse order(Long memberId, String idempotencyKey, OrderRequest request) {
        for (int attempt = 1;; attempt++) {
            try {
                return placeOnce(memberId, idempotencyKey, request);
            } catch (PessimisticLockingFailureException deadlock) {
                if (attempt >= MAX_ATTEMPTS) {
                    throw deadlock;
                }
            }
        }
    }

    @Transactional
    public OrderResponse placeOnce(Long memberId, String idempotencyKey, OrderRequest request) {
        try {
            return place(memberId, idempotencyKey, request);
        } catch (DataIntegrityViolationException duplicateKey) {
            // UNIQUE(member_id, idempotency_key) 위반 = 같은 키의 주문이 먼저 커밋됐다. 처음 응답을 돌려준다.
            return findReplay(memberId, idempotencyKey, request).orElseThrow(() -> duplicateKey);
        }
    }

    private OrderResponse place(Long memberId, String idempotencyKey, OrderRequest request) {
        // 같은 키로 다시 온 요청은 아래 조회로 처음 주문을 돌려준다(동시에 오면 UNIQUE가 막는다)
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "회원을 찾을 수 없습니다."));
        Optional<OrderResponse> replay = findReplay(memberId, idempotencyKey, request);
        if (replay.isPresent()) {
            return replay.get();
        }

        ShopItem item = shopItemRepository.findById(request.itemId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "아이템을 찾을 수 없습니다."));
        long total = item.getPrice() * request.quantity();
        Long memberCouponId = request.memberCouponId();
        long paid = memberCouponId == null ? total : total - total * COUPON_DISCOUNT_PERCENT / 100;

        // 재고 행 → 쿠폰 행 → 주문 INSERT 순으로 배타 잠금을 먼저 잡는다. INSERT의 FK 공유 잠금이 먼저 걸리면 동시 주문이 교착한다.
        if (shopItemRepository.decreaseStock(item.getId(), request.quantity()) == 0) {
            throw new BusinessException(ErrorCode.OUT_OF_STOCK, "재고가 부족합니다.");
        }
        if (memberCouponId != null
                && memberCouponRepository.markUsed(memberCouponId, memberId, LocalDateTime.now(KST)) == 0) {
            throw new BusinessException(ErrorCode.COUPON_UNUSABLE, "사용할 수 없는 쿠폰입니다.");
        }
        ShopOrder order = shopOrderRepository.saveAndFlush(ShopOrder.create(member, item, request.quantity(), paid,
                memberCouponId == null ? null : memberCouponRepository.getReferenceById(memberCouponId),
                idempotencyKey));
        if (paid > 0) {
            pointService.spend(memberId, Math.toIntExact(paid), "ORDER", order.getId());
        }
        // 구매 감사 쿠폰(이벤트 기간에만). 쿠폰이 떨어졌거나 이미 받았으면 그냥 넘어간다.
        thanksCouponService.giveAfterPurchase(memberId);
        return OrderResponse.from(order);
    }

    /** 같은 키의 주문이 있으면 같은 본문일 때만 처음 응답을 돌려주고, 다르면 422다. */
    private Optional<OrderResponse> findReplay(Long memberId, String idempotencyKey, OrderRequest request) {
        return shopOrderRepository.findByMemberIdAndIdempotencyKey(memberId, idempotencyKey).map(existing -> {
            if (!existing.matches(request.itemId(), request.quantity(), request.memberCouponId())) {
                throw new BusinessException(ErrorCode.IDEMPOTENCY_MISMATCH, "같은 Idempotency-Key에 다른 요청 본문입니다.");
            }
            return OrderResponse.from(existing);
        });
    }
}
