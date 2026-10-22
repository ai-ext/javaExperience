package com.example.board.post;

import java.time.Duration;
import java.time.ZoneId;
import java.util.List;
import java.util.concurrent.locks.ReentrantLock;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.example.board.common.CursorPage;
import com.example.board.config.RedisGuard;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/**
 * 좋아요 내림차순 상위 20개를 Redis에 60초 캐시한다. DB 조회는 트랜잭션 없이 하고, 트랜잭션 안에서 Redis를 부르지 않는다.
 * Redis가 느리거나 죽으면 캐시 없이 DB 결과를 돌려준다(spec-v2 §8).
 */
@Service
public class PopularPostService {

    static final String KEY = "popular:posts";
    static final Duration TTL = Duration.ofSeconds(60);
    static final int LIMIT = 20;
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final TypeReference<List<PopularPost>> LIST = new TypeReference<>() {
    };

    private final PostQueryMapper mapper;
    private final StringRedisTemplate redis;
    private final JsonMapper json;
    private final RedisGuard guard;

    // 스탬피드 방지(single-flight). 캐시가 빈 순간 서버 한 대 안에서는 한 요청만 DB를 읽고 나머지는 그 결과를 기다린다.
    // Redis SET NX 락 대신 JVM 락을 쓴 이유: DB 조회가 많아도 서버 대수만큼이라 충분하고, Redis 장애 때 락까지 함께 잃지 않는다.
    private final ReentrantLock loadLock = new ReentrantLock();

    public PopularPostService(PostQueryMapper mapper, StringRedisTemplate redis, JsonMapper json, RedisGuard guard) {
        this.mapper = mapper;
        this.redis = redis;
        this.json = json;
        this.guard = guard;
    }

    public List<PopularPost> getPopular() {
        List<PopularPost> cached = readCache();
        if (cached != null) {
            return cached;
        }
        loadLock.lock();
        try {
            // 락을 기다리는 동안 앞 요청이 채웠을 수 있다. 다시 보지 않으면 줄 선 요청이 모두 DB를 읽는다.
            cached = readCache();
            if (cached != null) {
                return cached;
            }
            List<PopularPost> loaded = mapper.findPopular(LIMIT).stream().map(PopularPost::from).toList();
            String value = json.writeValueAsString(loaded);
            guard.run("인기글 캐시 저장", () -> redis.opsForValue().set(KEY, value, TTL));
            return loaded;
        } finally {
            loadLock.unlock();
        }
    }

    /** 상위 20개 고정 목록이라 한 쪽뿐이다. size만큼 앞에서 자르고 nextCursor는 항상 null이다. */
    public CursorPage<PopularPost> page(String cursor, int size) {
        // 커서 형식만 검사한다(서버가 준 적 없는 값은 400). 다음 쪽이 없으니 위치로는 쓰지 않는다.
        CursorPage.decode(cursor);
        List<PopularPost> all = getPopular();
        return new CursorPage<>(all.subList(0, Math.min(size, all.size())), null);
    }

    /** 없거나 Redis 장애면 null(= DB에서 읽는다). */
    private List<PopularPost> readCache() {
        String value = guard.call("인기글 캐시 조회", () -> redis.opsForValue().get(KEY), () -> null);
        if (value == null) {
            return null;
        }
        // JSON에서 되읽은 시각은 UTC로 맞춰지므로 DB에서 바로 읽은 응답과 같은 KST 오프셋으로 되돌린다
        return json.readValue(value, LIST).stream()
                .map(p -> new PopularPost(p.id(), p.authorId(), p.authorNickname(), p.title(), p.tags(),
                        p.likeCount(), p.createdAt().atZoneSameInstant(KST).toOffsetDateTime()))
                .toList();
    }
}
