package com.example.board.post;

import java.time.Duration;
import java.time.ZoneId;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.locks.ReentrantLock;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
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
    // 무효화 세대 번호. 무효화할 때마다 1 올린다. 적재는 DB를 읽기 전에 본 세대가 그대로일 때만 저장한다.
    // 만료 없이 둔다. 만료돼 0으로 돌아가면 그 사이 적재가 옛 세대와 우연히 같아질 수 있다.
    static final String GEN_KEY = KEY + ":gen";
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final TypeReference<List<PopularPost>> LIST = new TypeReference<>() {
    };

    // 적재 중 무효화 경합: A가 DB를 읽고 → B가 글을 숨기거나 지우고 커밋한 뒤 캐시를 지우고 → A가 옛 목록을 저장하면
    // 숨긴 글이 TTL 동안 다시 보인다. 적재·무효화를 JVM 락으로 묶으면 서버 한 대 안에서만 막히므로(다른 서버의 무효화는
    // 못 막는다) 세대 번호를 Redis에 두고, "세대 확인 + 저장"과 "세대 증가 + 삭제"를 각각 Lua 한 번으로 원자 실행한다.
    // 세대를 읽은 뒤에 끝난 커밋은 세대를 올리므로 그 전에 읽은 옛 목록은 저장되지 않는다.
    private static final RedisScript<Long> SET_IF_SAME_GEN = new DefaultRedisScript<>("""
            if (redis.call('GET', KEYS[2]) or '0') ~= ARGV[1] then return 0 end
            redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
            return 1
            """, Long.class);
    private static final RedisScript<Long> BUMP_AND_DELETE = new DefaultRedisScript<>("""
            redis.call('INCR', KEYS[2])
            return redis.call('DEL', KEYS[1])
            """, Long.class);

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
            // 반드시 DB 조회 전에 읽는다. 세대를 못 읽으면(Redis 장애) 저장하지 않고 DB 결과만 돌려준다.
            String gen = guard.call("인기글 세대 조회",
                    () -> Objects.requireNonNullElse(redis.opsForValue().get(GEN_KEY), "0"), () -> null);
            List<PopularPost> loaded = mapper.findPopular(LIMIT).stream().map(PopularPost::from).toList();
            if (gen != null) {
                String value = json.writeValueAsString(loaded);
                guard.run("인기글 캐시 저장", () -> redis.execute(SET_IF_SAME_GEN, List.of(KEY, GEN_KEY), gen, value,
                        String.valueOf(TTL.toSeconds())));
            }
            return loaded;
        } finally {
            loadLock.unlock();
        }
    }

    /** 글 변경이 커밋된 뒤 부른다. 실패해도 TTL(60초) 뒤에는 새 값이 되므로 경고만 남긴다. */
    public void evict() {
        guard.run("인기글 캐시 삭제", () -> redis.execute(BUMP_AND_DELETE, List.of(KEY, GEN_KEY)));
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
