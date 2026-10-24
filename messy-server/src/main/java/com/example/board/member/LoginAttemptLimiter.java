package com.example.board.member;

import java.time.Duration;
import java.util.List;
import java.util.Locale;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Component;

import com.example.board.common.BusinessException;
import com.example.board.common.ErrorCode;
import com.example.board.config.RedisGuard;

/**
 * 로그인 실패 횟수 제한(계정당 10분 5회, spec-v2 §8). 카운터는 Redis 키 login:fail:{email}에 둔다.
 * 서버 메모리에 두면 인스턴스마다 따로 세어 서버 수만큼 더 시도할 수 있다.
 * Redis 장애면 제한 없이 통과시킨다(fail-open). 막으면 Redis 장애가 모든 회원의 로그인 장애가 된다.
 */
@Component
public class LoginAttemptLimiter {

    static final int MAX_FAILURES = 5;
    static final Duration WINDOW = Duration.ofMinutes(10);

    // 첫 실패에만 만료를 건다(첫 실패부터 10분). INCR과 EXPIRE 사이에 죽어 만료 없는 키가 남지 않게 한 번에 실행한다.
    private static final RedisScript<Long> INCREMENT = new DefaultRedisScript<>("""
            local n = redis.call('INCR', KEYS[1])
            if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
            return n
            """, Long.class);

    private final StringRedisTemplate redis;
    private final RedisGuard guard;

    public LoginAttemptLimiter(StringRedisTemplate redis, RedisGuard guard) {
        this.redis = redis;
        this.guard = guard;
    }

    /** 이미 5번 실패했으면 비밀번호를 확인하지 않고 429. */
    public void check(String email) {
        String count = guard.call("로그인 실패 횟수 조회", () -> redis.opsForValue().get(key(email)), () -> null);
        if (count != null && Integer.parseInt(count) >= MAX_FAILURES) {
            throw new BusinessException(ErrorCode.TOO_MANY_ATTEMPTS, "로그인 시도 횟수를 넘었습니다. 잠시 뒤 다시 시도하세요.");
        }
    }

    public void recordFailure(String email) {
        guard.run("로그인 실패 기록",
                () -> redis.execute(INCREMENT, List.of(key(email)), String.valueOf(WINDOW.toSeconds())));
    }

    public void reset(String email) {
        guard.run("로그인 실패 초기화", () -> redis.delete(key(email)));
    }

    // DB 비교(utf8mb4_0900_ai_ci)는 대소문자를 가리지 않는다. 키도 소문자로 맞춰 대소문자만 바꾼 우회를 막는다.
    private static String key(String email) {
        return "login:fail:" + email.toLowerCase(Locale.ROOT);
    }
}
