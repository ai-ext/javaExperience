package com.example.board.point;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.http.MediaType;
import org.springframework.transaction.support.TransactionTemplate;

import com.example.board.ApiTestSupport;
import com.example.board.config.RedisGuard;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ActivityRankingApiTest extends ApiTestSupport {

    @Autowired
    ActivityRankingService rankingService;

    @Autowired
    PointService pointService;

    @Autowired
    TransactionTemplate tx;

    @Autowired
    RedisGuard guard;

    Long writePost(Member m) throws Exception {
        String location = mockMvc.perform(post("/api/posts").header("Authorization", bearer(m))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"제목\",\"content\":\"내용\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getHeader("Location");
        return Long.valueOf(location.substring(location.lastIndexOf('/') + 1));
    }

    void writeComment(Long postId, Member m) throws Exception {
        mockMvc.perform(post("/api/posts/{id}/comments", postId).header("Authorization", bearer(m))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"댓글\"}"))
                .andExpect(status().isCreated());
    }

    long balance(Member m) {
        return jdbc.queryForObject("SELECT point_balance FROM member WHERE id = ?", Long.class, m.getId());
    }

    @Test
    void 글_댓글_작성_뒤_랭킹은_점수_높은_순이다() throws Exception {
        Member a = newMember(Role.USER);
        Member b = newMember(Role.USER);
        Member c = newMember(Role.USER);
        Long postId = writePost(a);
        writePost(a);
        writePost(b);
        for (int i = 0; i < 3; i++) {
            writeComment(postId, b);
        }
        writeComment(postId, c);

        mockMvc.perform(get("/api/rankings/activity"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(3))
                .andExpect(jsonPath("$.items[0].memberId").value(a.getId()))
                .andExpect(jsonPath("$.items[0].score").value(20))
                .andExpect(jsonPath("$.items[0].rank").value(1))
                .andExpect(jsonPath("$.items[0].nickname").value(a.getNickname()))
                .andExpect(jsonPath("$.items[1].memberId").value(b.getId()))
                .andExpect(jsonPath("$.items[1].score").value(16))
                .andExpect(jsonPath("$.items[2].memberId").value(c.getId()))
                .andExpect(jsonPath("$.items[2].score").value(2))
                .andExpect(jsonPath("$.nextCursor").doesNotExist());
    }

    @Test
    void 댓글을_쓰면_포인트_2가_EARN으로_적립된다() throws Exception {
        Member writer = newMember(Role.USER);
        Long postId = newPost(newMember(Role.USER));

        writeComment(postId, writer);

        assertThat(balance(writer)).isEqualTo(2);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM point_ledger WHERE member_id = ? AND type = 'EARN'"
                + " AND amount = 2 AND ref_type = 'COMMENT'", Integer.class, writer.getId())).isEqualTo(1);
    }

    @Test
    void size는_1에서_50이고_넘으면_400() throws Exception {
        mockMvc.perform(get("/api/rankings/activity").param("size", "51"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.type").value("/errors/validation"));
        mockMvc.perform(get("/api/rankings/activity").param("size", "0")).andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/rankings/activity").param("size", "50")).andExpect(status().isOk());
    }

    @Test
    void 커서로_다음_쪽을_읽는다() throws Exception {
        Member a = newMember(Role.USER);
        Member b = newMember(Role.USER);
        Member c = newMember(Role.USER);
        writePost(a);
        writePost(a);
        writePost(a);
        writePost(b);
        writePost(b);
        writePost(c);

        String next = com.jayway.jsonpath.JsonPath.read(mockMvc.perform(get("/api/rankings/activity").param("size", "2"))
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[1].memberId").value(b.getId()))
                .andReturn().getResponse().getContentAsString(), "$.nextCursor");

        mockMvc.perform(get("/api/rankings/activity").param("size", "2").param("cursor", next))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].memberId").value(c.getId()))
                .andExpect(jsonPath("$.items[0].rank").value(3))
                .andExpect(jsonPath("$.nextCursor").doesNotExist());
    }

    @Autowired
    PointLedgerRepository ledgerRepository;

    /** 지금 회원 id보다 큰 10의 거듭제곱. 자릿수가 다른 id를 기존 회원과 겹치지 않게 만들 때 쓴다. */
    long powerOfTenAboveMaxMemberId() {
        Long max = jdbc.queryForObject("SELECT COALESCE(MAX(id), 0) FROM member", Long.class);
        long p = 10;
        while (p <= max) {
            p *= 10;
        }
        return p;
    }

    void insertMember(long id) {
        jdbc.update("INSERT INTO member (id, email, password_hash, nickname, role, point_balance, created_at, updated_at)"
                + " VALUES (?, ?, 'hash', ?, 'USER', 0, NOW(6), NOW(6))", id, "r" + id + "@t.com", "r" + id);
    }

    // 동점 규칙(점수 내림차순 → member 문자열 내림차순)은 Redis와 원장 합계가 같아야 한다. 커서가 순위 위치라서
    // 쪽 사이에 Redis 장애로 원천이 바뀌면 규칙이 다른 만큼 같은 회원이 두 번 나오고 다른 회원이 빠진다.
    // id는 자릿수를 걸쳐 숫자 오름차순·내림차순 어느 쪽과도 다른 순서가 되게 고른다.
    @Test
    void 동점에서_Redis로_첫_쪽을_읽고_장애로_원장으로_넘어가도_중복_누락이_없다() throws Exception {
        long p = powerOfTenAboveMaxMemberId();
        long nine = 9 * p;
        long ten = 10 * p;
        long tenPlusOne = 10 * p + 1;
        for (long id : new long[] {nine, ten, tenPlusOne}) {
            insertMember(id);
            // 다른 테스트의 회원보다 확실히 위에 오도록 큰 점수로 동점을 만든다(커밋 뒤 Redis에도 오른다)
            pointService.earn(id, 1_000_000, "POST", 1L);
        }

        String body = mockMvc.perform(get("/api/rankings/activity").param("size", "1"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        Number first = com.jayway.jsonpath.JsonPath.read(body, "$.items[0].memberId");
        String next = com.jayway.jsonpath.JsonPath.read(body, "$.nextCursor");

        List<Number> rest;
        try {
            // Redis 장애를 주입한다. RedisGuard가 실패 뒤 5초 동안 Redis를 건너뛰므로 다음 조회는 원장 합계에서 나온다.
            guard.call("테스트 장애 주입", () -> {
                throw new RedisConnectionFailureException("주입한 장애");
            }, () -> null);
            String fallback = mockMvc.perform(get("/api/rankings/activity").param("size", "2").param("cursor", next))
                    .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
            rest = com.jayway.jsonpath.JsonPath.read(fallback, "$.items[*].memberId");
        } finally {
            guard.reset();
        }

        List<Long> ids = new ArrayList<>(List.of(first.longValue()));
        rest.forEach(n -> ids.add(n.longValue()));
        // "9000…" > "10000…1" > "10000…0"
        assertThat(ids).containsExactly(nine, tenPlusOne, ten);
    }

    // Redis는 동점을 member 문자열의 사전순 역순으로 둔다. "9" > "10"이라 숫자 순서와 다르다.
    @Test
    void 동점이면_Redis는_member_문자열_역순이라_9가_10보다_앞이다() {
        rankingService.add(9L, 5_000_000);
        rankingService.add(10L, 5_000_000);

        assertThat(rankingService.top(null, 2).items()).extracting(ActivityRank::memberId).containsExactly(9L, 10L);
    }

    // 원장 합계의 동점 정렬(MySQL 문자열 비교)이 Redis 바이트 비교와 같은 순서인지 고정한다.
    // 9와 10, 2와 19(첫 글자가 이긴다), 1과 10(앞부분이 같으면 짧은 쪽이 작다)을 자릿수만 키워 같은 점수로 둔다.
    @Test
    void 동점_순서는_Redis와_원장_합계가_숫자_문자열에서_같다() {
        long p = powerOfTenAboveMaxMemberId();
        List<Long> ids = List.of(p, 2 * p, 9 * p, 10 * p, 19 * p);
        for (long id : ids) {
            insertMember(id);
            pointService.earn(id, 3, "COMMENT", 1L);
        }
        List<Long> expected = List.of(9 * p, 2 * p, 19 * p, 10 * p, p);

        // Redis는 테스트마다 비우므로 이 테스트의 회원만 있다
        assertThat(rankingService.top(null, 50).items()).extracting(ActivityRank::memberId)
                .containsExactlyElementsOf(expected);
        // 원장에는 다른 테스트의 3점 회원도 있으므로 이 테스트의 회원만 상대 순서를 본다
        assertThat(ledgerRepository.sumActivityScores(ActivityRankingService.SCORED_REF_TYPES,
                        org.springframework.data.domain.Pageable.unpaged()).stream()
                .map(MemberScore::memberId).filter(ids::contains).toList())
                .containsExactlyElementsOf(expected);
    }

    // 위치 커서는 양수 long이면 디코더를 통과한다. 원장 폴백이 offset + count를 int로 자르면 음수 쪽 크기로 500이 났다.
    @Test
    void 끝을_넘는_큰_위치_커서는_Redis_정상과_장애_모두_200_빈_목록이다() throws Exception {
        rankingService.add(9L, 1);
        for (long position : new long[] {Integer.MAX_VALUE, Long.MAX_VALUE}) {
            String cursor = com.example.board.common.CursorPage.encode(position);
            mockMvc.perform(get("/api/rankings/activity").param("size", "1").param("cursor", cursor))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.items.length()").value(0))
                    .andExpect(jsonPath("$.nextCursor").doesNotExist());
            try {
                guard.call("테스트 장애 주입", () -> {
                    throw new RedisConnectionFailureException("주입한 장애");
                }, () -> null);
                mockMvc.perform(get("/api/rankings/activity").param("size", "1").param("cursor", cursor))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.items.length()").value(0))
                        .andExpect(jsonPath("$.nextCursor").doesNotExist());
            } finally {
                guard.reset();
            }
        }
    }

    // 함정: 점수를 Redis에만 쌓으면 Redis 데이터가 사라질 때 되살릴 원천이 없다
    @Test
    void 랭킹_키가_사라져도_point_ledger에서_같은_점수로_다시_만든다() throws Exception {
        Member a = newMember(Role.USER);
        Member b = newMember(Role.USER);
        Long postId = writePost(a);
        writeComment(postId, b);
        writeComment(postId, b);
        writeComment(postId, a);
        // 충전·구매 같은 활동 아닌 원장 행은 랭킹에 들어가지 않는다
        jdbc.update("INSERT INTO point_ledger (member_id, type, amount, balance_after, ref_type, ref_id, created_at,"
                + " updated_at) VALUES (?, 'CHARGE', 5000, 5000, 'PG', 1, NOW(6), NOW(6))", b.getId());
        Double aBefore = redis.opsForZSet().score("ranking:activity", a.getId().toString());
        Double bBefore = redis.opsForZSet().score("ranking:activity", b.getId().toString());

        redis.delete("ranking:activity");
        int rebuilt = rankingService.rebuild();

        // 같은 DB를 쓰는 다른 테스트의 회원도 원장에 있으므로 이 테스트의 회원만 비교한다
        assertThat(rebuilt).isGreaterThanOrEqualTo(2);
        assertThat(redis.opsForZSet().score("ranking:activity", a.getId().toString()))
                .isEqualTo(aBefore).isEqualTo(12.0);
        assertThat(redis.opsForZSet().score("ranking:activity", b.getId().toString()))
                .isEqualTo(bBefore).isEqualTo(4.0);
    }

    @Test
    void 롤백된_적립은_랭킹에_오르지_않는다() {
        Member m = newMember(Role.USER);

        tx.executeWithoutResult(s -> {
            pointService.earn(m.getId(), 10, "POST", 1L);
            s.setRollbackOnly();
        });

        assertThat(redis.opsForZSet().score("ranking:activity", m.getId().toString())).isNull();
    }

    // 댓글 INSERT(회원 FK 공유 잠금) 뒤 잔액 UPDATE(배타 잠금)를 하면 동시 요청끼리 교착이 난다
    @Test
    void 같은_회원이_댓글_20개를_동시에_써도_모두_201이고_잔액은_40이다() throws Exception {
        Member m = newMember(Role.USER);
        Long postId = newPost(newMember(Role.USER));
        ExecutorService pool = Executors.newFixedThreadPool(20);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Integer>> futures = new ArrayList<>();
            for (int i = 0; i < 20; i++) {
                futures.add(pool.submit(() -> {
                    start.await();
                    return mockMvc.perform(post("/api/posts/{id}/comments", postId).header("Authorization", bearer(m))
                            .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"댓글\"}"))
                            .andReturn().getResponse().getStatus();
                }));
            }
            start.countDown();
            for (Future<Integer> f : futures) {
                assertThat(f.get(30, TimeUnit.SECONDS)).isEqualTo(201);
            }
        } finally {
            pool.shutdownNow();
        }

        assertThat(balance(m)).isEqualTo(40);
        assertThat(redis.opsForZSet().score("ranking:activity", m.getId().toString())).isEqualTo(40.0);
    }
}
