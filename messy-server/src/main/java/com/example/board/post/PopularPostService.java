package com.example.board.post;

import java.time.Duration;
import java.time.ZoneId;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(PopularPostService.class);

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
        // 캐시가 비는 건 60초에 한 번이고 상위 20개 조회라 가볍다. 락 없이 읽어 채운다(락 대기로 응답이 밀리는 것보다 낫다).
        List<PopularPost> loaded = mapper.findPopular(LIMIT).stream().map(PopularPost::from).toList();
        String value = json.writeValueAsString(loaded);
        guard.run("인기글 캐시 저장", () -> redis.opsForValue().set(KEY, value, TTL));
        log.info("인기글 캐시 적재 {}건 (DB 조회)", loaded.size());
        return loaded;
    }

    /** 글 변경이 커밋된 뒤 부른다. 실패해도 TTL(60초) 뒤에는 새 값이 되므로 경고만 남긴다. */
    public void evict() {
        guard.run("인기글 캐시 삭제", () -> redis.delete(KEY));
        log.info("인기글 캐시 삭제");
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
