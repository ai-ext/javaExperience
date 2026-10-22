package com.example.board.point;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations.TypedTuple;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.example.board.common.CursorPage;
import com.example.board.config.RedisGuard;
import com.example.board.member.Member;
import com.example.board.member.MemberRepository;

/**
 * 활동 랭킹(Redis Sorted Set ranking:activity, 글 10·댓글 2). 점수의 원천은 point_ledger다.
 * Redis 데이터가 사라져도 rebuild()로 원장에서 다시 만들 수 있고, Redis 장애 중 조회는 원장 합계로 답한다.
 */
@Service
public class ActivityRankingService {

    static final String KEY = "ranking:activity";
    private static final String REBUILD_KEY = KEY + ":rebuild";
    // 랭킹에 들어가는 적립 종류. 원장 합산(rebuild)과 증분(add)이 같은 기준을 쓴다.
    static final Set<String> SCORED_REF_TYPES = Set.of("POST", "COMMENT");
    // 동점 규칙: 점수 내림차순 → memberId 내림차순. Redis(ZREVRANGE)와 원장 합계(sumActivityScores)가 같아야 한다.
    // 커서가 순위 위치라서, 쪽 사이에 Redis 장애로 원천이 바뀔 때 규칙이 다르면 같은 회원이 두 번 나오고 다른 회원이 빠진다.
    // Redis는 동점을 member 문자열의 사전순 역순으로 두므로 member를 19자리(long 최대 자릿수) 0패딩 문자열로 저장해
    // 사전순 = 숫자순으로 맞춘다("9" > "10"인 문제). 오름차순으로 맞추려면 점수를 음수로 저장해야 해 내림차순을 택했다.
    private static final String MEMBER_FORMAT = "%019d";
    // 0패딩 전 버전은 member를 "9"로 썼고 키 이름은 그대로다. 옛 형식이 남은 채 새 형식으로 가산하면 같은 회원이
    // 두 member로 갈라진다. 가산할 때 옛 형식 점수를 새 형식으로 옮기고 지운 뒤 더한다(쓰기 시 이전, Lua 한 번으로 원자).
    // 온라인 rebuild()는 진행 중 적립을 덮어쓸 수 있어 전환 수단으로 쓰지 않는다.
    // 19자리 id는 두 형식이 같아 옮기기를 건너뛴다(건너뛰지 않으면 ZREM이 방금 더한 member를 지운다).
    private static final RedisScript<Long> MIGRATE_AND_INCR = new DefaultRedisScript<>("""
            if ARGV[1] ~= ARGV[2] then
              local old = redis.call('ZSCORE', KEYS[1], ARGV[1])
              if old then
                redis.call('ZINCRBY', KEYS[1], old, ARGV[2])
                redis.call('ZREM', KEYS[1], ARGV[1])
              end
            end
            redis.call('ZINCRBY', KEYS[1], ARGV[3], ARGV[2])
            return 1
            """, Long.class);
    private static final Comparator<MemberScore> RANK_ORDER = Comparator.comparing(MemberScore::score)
            .thenComparing(MemberScore::memberId).reversed();

    private final StringRedisTemplate redis;
    private final PointLedgerRepository ledgerRepository;
    private final MemberRepository memberRepository;
    private final RedisGuard guard;

    public ActivityRankingService(StringRedisTemplate redis, PointLedgerRepository ledgerRepository,
            MemberRepository memberRepository, RedisGuard guard) {
        this.redis = redis;
        this.ledgerRepository = ledgerRepository;
        this.memberRepository = memberRepository;
        this.guard = guard;
    }

    public void add(Long memberId, int score) {
        guard.run("랭킹 가산", () -> redis.execute(MIGRATE_AND_INCR, List.of(KEY), Long.toString(memberId),
                member(memberId), Integer.toString(score)));
    }

    /** 원장 기록이 커밋된 뒤에만 올린다. 롤백된 적립이 점수로 남지 않고, 트랜잭션 안에서 Redis를 부르지 않는다. */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPointEarned(PointEarnedEvent event) {
        if (SCORED_REF_TYPES.contains(event.refType())) {
            add(event.memberId(), event.amount());
        }
    }

    /** 커서는 다음 쪽이 시작하는 순위 위치(0부터)다. */
    public CursorPage<ActivityRank> top(String cursor, int size) {
        Long after = CursorPage.decode(cursor);
        long offset = after == null ? 0 : after;
        // 한 건 더 읽어 다음 쪽이 있는지만 판단한다
        List<MemberScore> rows = guard.call("랭킹 조회", () -> fromRedis(offset, size + 1),
                () -> fromLedger(offset, size + 1));
        // 다음 쪽 판단은 합치기 전 행 수로 한다. 합친 뒤 세면 한 건이 줄어 다음 쪽이 있는데도 없다고 끊는다.
        boolean hasNext = rows.size() > size;
        List<MemberScore> page = mergeSameMember(hasNext ? rows.subList(0, size) : rows);
        Map<Long, String> nicknames = memberRepository.findAllById(page.stream().map(MemberScore::memberId).toList())
                .stream().collect(Collectors.toMap(Member::getId, Member::getNickname));
        List<ActivityRank> items = new ArrayList<>();
        for (int i = 0; i < page.size(); i++) {
            MemberScore s = page.get(i);
            items.add(new ActivityRank(offset + i + 1, s.memberId(), nicknames.get(s.memberId()), s.score()));
        }
        return new CursorPage<>(items, hasNext ? CursorPage.encode(offset + size) : null);
    }

    /**
     * 옛 형식("9")과 새 형식이 아직 함께 있으면(그 회원의 다음 가산 전) 같은 id가 두 번 나온다. 이 쪽 안에서만 점수를
     * 합쳐 한 번만 내보내고 다시 정렬한다. 한계: 커서는 Redis 위치라 nextCursor는 합치기 전 위치(offset + size)를 쓴다.
     * 그래서 합친 쪽은 size보다 짧을 수 있고 rank가 다음 쪽 시작 번호와 이어지지 않을 수 있으며, 두 형식이 서로 다른
     * 쪽에 있으면 각 쪽에 한 번씩 나온다. 그 회원의 다음 가산(쓰기 시 이전)이나 rebuild()로 해소된다.
     * 원장 합계에는 중복이 없어 결과가 바뀌지 않는다.
     */
    private static List<MemberScore> mergeSameMember(List<MemberScore> rows) {
        Map<Long, Long> merged = new LinkedHashMap<>();
        rows.forEach(r -> merged.merge(r.memberId(), r.score(), Long::sum));
        if (merged.size() == rows.size()) {
            return rows;
        }
        return merged.entrySet().stream().map(e -> new MemberScore(e.getKey(), e.getValue())).sorted(RANK_ORDER)
                .toList();
    }

    /**
     * Redis 랭킹을 원장에서 다시 만든다(Redis 데이터 유실·불일치 복구용). 임시 키에 채운 뒤 RENAME으로 바꿔 끼워
     * 만드는 동안에도 옛 랭킹이 보인다. 다시 만든 회원 수를 돌려준다.
     */
    public int rebuild() {
        List<MemberScore> scores = ledgerRepository.sumActivityScores(SCORED_REF_TYPES, Pageable.unpaged());
        redis.delete(REBUILD_KEY);
        if (scores.isEmpty()) {
            redis.delete(KEY);
            return 0;
        }
        Set<TypedTuple<String>> tuples = scores.stream()
                .map(s -> TypedTuple.of(member(s.memberId()), s.score().doubleValue()))
                .collect(Collectors.toSet());
        redis.opsForZSet().add(REBUILD_KEY, tuples);
        redis.rename(REBUILD_KEY, KEY);
        return scores.size();
    }

    /** 랭킹 Sorted Set의 member 값. 위 동점 규칙 때문에 고정 길이로 맞춘다. */
    static String member(Long memberId) {
        return String.format(MEMBER_FORMAT, memberId);
    }

    private List<MemberScore> fromRedis(long offset, int count) {
        Set<TypedTuple<String>> tuples = redis.opsForZSet().reverseRangeWithScores(KEY, offset, offset + count - 1);
        return tuples == null ? List.of() : tuples.stream()
                .map(t -> new MemberScore(Long.valueOf(t.getValue()), t.getScore().longValue()))
                .toList();
    }

    // Redis 장애 때만 쓴다. 앞 순위까지 읽고 건너뛰므로 깊은 쪽일수록 느리다.
    private List<MemberScore> fromLedger(long offset, int count) {
        // 쪽 크기(offset + count)가 int를 넘는 위치는 회원 수보다 뒤라 Redis 경로처럼 빈 목록이다.
        // 덧셈 비교는 Long.MAX_VALUE 커서에서 long으로도 넘쳐 음수가 되므로 빼기로 비교한다.
        if (offset > Integer.MAX_VALUE - count) {
            return List.of();
        }
        return ledgerRepository.sumActivityScores(SCORED_REF_TYPES, PageRequest.of(0, (int) (offset + count)))
                .stream().skip(offset).toList();
    }
}
