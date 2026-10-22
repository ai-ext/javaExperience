package com.example.board.point;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations.TypedTuple;
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
        guard.run("랭킹 가산", () -> redis.opsForZSet().incrementScore(KEY, member(memberId), score));
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
        boolean hasNext = rows.size() > size;
        List<MemberScore> page = hasNext ? rows.subList(0, size) : rows;
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
        return ledgerRepository.sumActivityScores(SCORED_REF_TYPES, PageRequest.of(0, (int) (offset + count)))
                .stream().skip(offset).toList();
    }
}
