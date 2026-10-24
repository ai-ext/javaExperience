package com.example.board.coupon;

import java.util.List;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Component;

import com.example.board.config.RedisGuard;

/**
 * 선착순 쿠폰 잔여 수량의 앞단 거름망(Redis 키 coupon:{couponId}:stock). 기준 데이터는 DB의 issued_quantity다.
 * 수량이 0이면 DB까지 가지 않고 거절해 몰린 요청이 DB 커넥션을 잡지 않게 한다.
 * Redis 장애면 모두 통과시켜 DB 조건부 UPDATE만으로 판단한다.
 */
@Component
public class CouponStockCounter {

    private static final long DECREASED = 1;
    private static final long MISSING = -1;

    // 읽고 확인한 뒤 줄이면 그 사이 다른 요청이 끼므로 스크립트 하나로 원자 실행한다.
    // 키가 없으면 ARGV[1](DB에서 읽은 남은 수량)로 채운다. 0 아래로는 내려가지 않아 되돌리기(INCR)가 자리를 잃지 않는다.
    private static final RedisScript<Long> DECREASE = new DefaultRedisScript<>("""
            local v = redis.call('GET', KEYS[1])
            if not v then
              if not ARGV[1] then return -1 end
              redis.call('SET', KEYS[1], ARGV[1])
              v = ARGV[1]
            end
            if tonumber(v) <= 0 then return 0 end
            redis.call('DECR', KEYS[1])
            return 1
            """, Long.class);

    // 키가 없을 때 INCR하면 1로 새로 생겨 DB와 어긋난다. 있을 때만 되돌린다.
    private static final RedisScript<Long> RESTORE = new DefaultRedisScript<>("""
            if redis.call('EXISTS', KEYS[1]) == 1 then return redis.call('INCR', KEYS[1]) end
            return 0
            """, Long.class);

    private final StringRedisTemplate redis;
    private final CouponRepository couponRepository;
    private final RedisGuard guard;

    public CouponStockCounter(StringRedisTemplate redis, CouponRepository couponRepository, RedisGuard guard) {
        this.redis = redis;
        this.couponRepository = couponRepository;
        this.guard = guard;
    }

    /** 한 장 줄였거나 Redis로 판단할 수 없으면 true(DB로 진행), 남은 수량이 0이면 false. */
    public boolean tryDecrease(Long couponId) {
        List<String> keys = List.of(key(couponId));
        Long result = guard.call("쿠폰 수량 감소", () -> redis.execute(DECREASE, keys), () -> null);
        if (result != null && result == MISSING) {
            // 첫 요청: DB의 남은 수량으로 채운다. 없는 쿠폰이면 DB 경로가 404로 답하게 둔다.
            Coupon coupon = couponRepository.findById(couponId).orElse(null);
            if (coupon == null) {
                return true;
            }
            String remaining = String.valueOf(coupon.getTotalQuantity() - coupon.getIssuedQuantity());
            result = guard.call("쿠폰 수량 감소", () -> redis.execute(DECREASE, keys, remaining), () -> null);
        }
        return result == null || result == DECREASED;
    }

    /** tryDecrease를 통과했는데 DB 발급이 실패(중복 등)했으면 한 장 되돌린다. 안 그러면 실제보다 적게 나간다. */
    public void restore(Long couponId) {
        guard.run("쿠폰 수량 되돌리기", () -> redis.execute(RESTORE, List.of(key(couponId))));
    }

    /** DB가 소진이라고 답했으면 DB를 기준으로 Redis도 0으로 맞춘다. */
    public void markExhausted(Long couponId) {
        guard.run("쿠폰 수량 맞추기", () -> redis.opsForValue().set(key(couponId), "0"));
    }

    private static String key(Long couponId) {
        return "coupon:" + couponId + ":stock";
    }
}
