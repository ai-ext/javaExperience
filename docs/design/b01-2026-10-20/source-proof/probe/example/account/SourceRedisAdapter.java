package example.account;
import java.time.Duration;import java.util.List;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
/** 원문 필드/메서드를 그대로 삽입하고 추가 Redis client만 주입한다. */
class SourceRedisAdapter {
 final StringRedisTemplate redis;
 SourceRedisAdapter(StringRedisTemplate value){redis=value;}
private static final DefaultRedisScript<Long> INCR_WINDOW =
    new DefaultRedisScript<>("""
        local n = redis.call('INCR', KEYS[1])
        if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
        return n
        """, Long.class);

long failed(String opaqueKey, Duration window) {
    Long n = redis.execute(INCR_WINDOW, List.of(opaqueKey),
            Long.toString(window.toSeconds()));
    if (n == null) throw new IllegalStateException("rate counter unavailable");
    return n;
}

 long failWithInvalidExpiry(String key) {return redis.execute(INCR_WINDOW,List.of(key),"not-an-integer");}
}
