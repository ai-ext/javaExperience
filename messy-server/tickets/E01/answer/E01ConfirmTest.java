package com.example.board.tickets;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.IntSupplier;

import org.apache.ibatis.executor.Executor;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.plugin.Interceptor;
import org.apache.ibatis.plugin.Intercepts;
import org.apache.ibatis.plugin.Invocation;
import org.apache.ibatis.plugin.Signature;
import org.apache.ibatis.session.ResultHandler;
import org.apache.ibatis.session.RowBounds;
import org.apache.ibatis.session.SqlSessionFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.board.ApiTestSupport;
import com.example.board.MyBatisQueryCounter;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

/**
 * E01 확인 테스트(D14-5 고도화): 인기글 캐시가 빈 순간(TTL 만료·무효화 직후)의 재적재.
 * - 동시 100요청에도 DB 목록 쿼리(findPopular)는 1번이고, 모든 응답은 평소 응답과 같은 모양이다.
 * - 적재가 늦거나 실패해도 기다리던 요청은 상한 안에 제 응답을 받는다(상한 없는 대기·실패 전파 금지).
 * - 적재 도중 글이 지워지면(무효화) 그 전에 읽은 옛 목록을 캐시에 쓰지도, 무효화 뒤 요청에 돌려주지도 않는다.
 * 순서는 시간에 맡기지 않는다. 첫 적재의 DB 조회가 끝난 직후에 멈춰 두고(HoldAfterQuery), 다른 요청을 들여보낸 뒤 푼다.
 * 구현 방식(락·future·Redis 락)은 보지 않는다. 쿼리 수·응답·캐시에 남은 값만 본다.
 */
class E01ConfirmTest extends ApiTestSupport {

    static final int REQUESTS = 100;
    // 기다리는 요청의 응답 상한(인기글 응답 예산 1초 + 여유). 상한 없이 첫 적재를 기다리면 넘는다.
    static final long WAITER_BUDGET_MS = 2500;

    @Autowired
    SqlSessionFactory sqlSessionFactory;

    MyBatisQueryCounter queries;
    HoldAfterQuery hold;
    Member author;
    Long top;

    record Response(int status, String body, long millis) {
    }

    @BeforeEach
    void seed() {
        clearPosts();
        author = newMember(Role.USER);
        for (int i = 1; i <= 25; i++) {
            Long id = insertPost(author, "글" + i, "내용", "ACTIVE");
            jdbc.update("UPDATE post SET like_count = ? WHERE id = ?", i, id);
            if (i % 3 == 0) {
                attachTag(id, "태그" + i);
            }
            top = id;
        }
        queries = MyBatisQueryCounter.attach(sqlSessionFactory);
        queries.clear();
        hold = HoldAfterQuery.attach(sqlSessionFactory);
    }

    @AfterEach
    void releaseHold() {
        hold.release();
    }

    Response popular() {
        long started = System.nanoTime();
        try {
            var res = mockMvc.perform(get("/api/posts/popular")).andReturn().getResponse();
            return new Response(res.getStatus(), res.getContentAsString(),
                    TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started));
        } catch (Exception e) {
            return new Response(-1, e.toString(), TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started));
        }
    }

    static <T> T await(Future<T> f, long millis, String what) throws Exception {
        try {
            return f.get(millis, TimeUnit.MILLISECONDS);
        } catch (TimeoutException e) {
            return fail(what + ": " + millis + "ms 안에 끝나지 않았다");
        }
    }

    // ---- 스탬피드 ----

    @Test
    void 캐시가_빈_순간_동시_100요청에도_DB_목록_쿼리는_1번이고_응답은_평소와_같다() throws Exception {
        assertThat(redis.hasKey("popular:posts")).as("캐시가 비어 있는 채로 시작").isFalse();
        hold.arm("findPopular", false);
        Requests leader = new Requests(1);
        Requests followers = new Requests(REQUESTS - 1);
        try {
            leader.start(this::popular);
            assertThat(hold.awaitPaused()).as("첫 요청이 DB 조회 직후 멈춤").isTrue();
            // 첫 적재가 캐시를 채우기 전에 나머지 99요청이 모두 들어와 캐시 미스를 본다
            followers.start(this::popular);
            followers.awaitSettled(() -> queries.count("findPopular"), 500);
            hold.release();

            List<Response> responses = new ArrayList<>(leader.results(30_000));
            responses.addAll(followers.results(30_000));

            assertThat(responses).extracting(Response::status).containsOnly(200);
            assertThat(queries.count("findPopular")).as("동시 %d요청의 DB 목록 쿼리 수", REQUESTS).isEqualTo(1);

            // 응답 형식: 함께 받은 응답(동시 요청들)과 DB에서 바로 읽은 응답이 같다
            redis.delete("popular:posts");
            Response fromDb = popular();
            assertThat(fromDb.status()).isEqualTo(200);
            assertThat(responses).extracting(Response::body).containsOnly(fromDb.body());
            assertThat(fromDb.body()).contains("\"title\":\"글25\"").contains("\"nextCursor\":null");
        } finally {
            hold.release();
            leader.close();
            followers.close();
        }
    }

    // ---- 기다림의 상한과 실패 ----

    @Test
    void 첫_적재가_늦어도_기다리던_요청은_상한_안에_응답한다() throws Exception {
        hold.arm("findPopular", false);
        Requests leader = new Requests(1);
        Requests waiters = new Requests(5);
        try {
            leader.start(this::popular);
            assertThat(hold.awaitPaused()).as("첫 요청이 DB 조회 직후 멈춤").isTrue();
            // 첫 적재는 풀어 주지 않는다(느린 DB·Redis). 기다리던 요청은 스스로 상한을 두고 빠져나와야 한다.
            waiters.start(this::popular);
            for (Response r : waiters.results(WAITER_BUDGET_MS + 1000)) {
                assertThat(r.status()).as("기다리던 요청의 응답 %s", r.body()).isEqualTo(200);
                assertThat(r.millis()).as("기다리던 요청의 응답 시간(ms)").isLessThan(WAITER_BUDGET_MS);
            }
            hold.release();
            assertThat(leader.results(10_000)).extracting(Response::status).containsOnly(200);
        } finally {
            hold.release();
            leader.close();
            waiters.close();
        }
    }

    @Test
    void 첫_적재가_실패해도_기다리던_요청은_제_응답을_받는다() throws Exception {
        hold.arm("findPopular", true);
        Requests leader = new Requests(1);
        Requests waiters = new Requests(5);
        try {
            leader.start(this::popular);
            assertThat(hold.awaitPaused()).as("첫 요청이 DB 조회 직후 멈춤").isTrue();
            waiters.start(this::popular);
            waiters.awaitSettled(() -> queries.count("findPopular"), 500);
            hold.release(); // 첫 적재는 여기서 실패한다
            leader.results(10_000); // 첫 요청 자신의 응답(실패 주입이라 5xx여도 된다)은 보지 않는다
            assertThat(waiters.results(WAITER_BUDGET_MS + 1000)).extracting(Response::status)
                    .as("첫 적재의 실패가 기다리던 요청에 번지지 않는다").containsOnly(200);
        } finally {
            hold.release();
            leader.close();
            waiters.close();
        }
    }

    // ---- 적재 중 무효화 ----

    void deleteTop() throws Exception {
        int status = mockMvc.perform(delete("/api/posts/{id}", top).header("Authorization", bearer(author)))
                .andReturn().getResponse().getStatus();
        assertThat(status).as("글 삭제").isEqualTo(204);
    }

    static List<Long> ids(Response r) {
        return com.jayway.jsonpath.JsonPath.<List<Number>>read(r.body(), "$.items[*].id").stream()
                .map(Number::longValue).toList();
    }

    @Test
    void 적재_도중_글이_지워지면_그_전에_읽은_옛_목록을_캐시에_쓰지_않는다() throws Exception {
        hold.arm("findPopular", false);
        Requests loader = new Requests(1);
        try {
            loader.start(this::popular);
            assertThat(hold.awaitPaused()).as("적재 요청이 DB 조회 직후 멈춤(지울 글이 아직 1위)").isTrue();
            deleteTop(); // 커밋 → 커밋 뒤 캐시 무효화 → 204
            hold.release(); // 옛 목록을 들고 있던 적재가 이제 캐시에 쓰려 한다
            assertThat(loader.results(10_000)).extracting(Response::status).containsOnly(200);
        } finally {
            hold.release();
            loader.close();
        }

        Response after = popular();
        assertThat(after.status()).isEqualTo(200);
        assertThat(ids(after)).as("삭제 응답 뒤의 인기글").isNotEmpty().doesNotContain(top);
        assertThat(ids(popular())).as("한 번 더(캐시에서)").isNotEmpty().doesNotContain(top);
    }

    @Test
    void 무효화_뒤에_온_요청은_무효화_전에_시작한_적재_결과를_받지_않는다() throws Exception {
        hold.arm("findPopular", false);
        Requests loader = new Requests(1);
        Requests later = new Requests(1);
        try {
            loader.start(this::popular);
            assertThat(hold.awaitPaused()).as("적재 요청이 DB 조회 직후 멈춤(지울 글이 아직 1위)").isTrue();
            deleteTop();
            // 삭제 응답을 받은 뒤의 요청. 진행 중인 (옛) 적재를 기다리게 두었다가 그 적재를 푼다.
            later.start(this::popular);
            later.awaitSettled(() -> 0, 500);
            hold.release();
            Response r = later.results(10_000).get(0);
            assertThat(r.status()).isEqualTo(200);
            assertThat(ids(r)).as("삭제 응답 뒤에 시작한 요청의 인기글").isNotEmpty().doesNotContain(top);
            loader.results(10_000);
        } finally {
            hold.release();
            loader.close();
            later.close();
        }
    }

    /** 요청 묶음. 스레드마다 한 요청을 보내고, 들어간 요청이 모두 어딘가에서 기다리는지 스레드 상태로 본다. */
    static final class Requests implements AutoCloseable {

        private final int size;
        private final List<Thread> threads = new CopyOnWriteArrayList<>();
        private final ExecutorService pool;
        private final AtomicInteger started = new AtomicInteger();
        private final List<Future<Response>> futures = new ArrayList<>();

        Requests(int size) {
            this.size = size;
            this.pool = Executors.newFixedThreadPool(size, r -> {
                Thread t = new Thread(r, "e01-request");
                t.setDaemon(true);
                threads.add(t);
                return t;
            });
        }

        void start(java.util.function.Supplier<Response> request) {
            for (int i = 0; i < size; i++) {
                futures.add(pool.submit(() -> {
                    started.incrementAndGet();
                    return request.get();
                }));
            }
        }

        /**
         * 들어간 요청이 모두 멈춰(대기·끝남) 서너 번 연달아 그대로이거나, DB 조회가 더 나가거나(=캐시 미스를 보고 각자 읽는다),
         * maxMillis가 지날 때까지 기다린다. 멈춘 요청을 오래 붙잡으면 구현의 기다림 상한에 걸리므로 짧게 둔다.
         */
        void awaitSettled(IntSupplier dbQueries, long maxMillis) throws InterruptedException {
            int before = dbQueries.getAsInt();
            long deadline = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(maxMillis);
            int stable = 0;
            while (stable < 3 && System.nanoTime() < deadline) {
                if (before > 0 && dbQueries.getAsInt() > before) {
                    return;
                }
                boolean allParked = started.get() == size && threads.size() == size
                        && threads.stream().allMatch(Requests::parked);
                stable = allParked ? stable + 1 : 0;
                Thread.sleep(15);
            }
        }

        static boolean parked(Thread t) {
            Thread.State s = t.getState();
            return s == Thread.State.WAITING || s == Thread.State.TIMED_WAITING || s == Thread.State.BLOCKED
                    || s == Thread.State.TERMINATED;
        }

        List<Response> results(long maxMillis) throws Exception {
            long deadline = System.currentTimeMillis() + maxMillis;
            List<Response> out = new ArrayList<>();
            for (Future<Response> f : futures) {
                out.add(await(f, Math.max(1, deadline - System.currentTimeMillis()), "요청(스레드 " + size + "개 묶음)"));
            }
            return out;
        }

        @Override
        public void close() throws InterruptedException {
            // 끼어들기(interrupt)로 끝내지 않는다. 진행 중인 Redis 명령이 실패하면 다음 테스트까지 캐시가 꺼진다.
            pool.shutdown();
            pool.awaitTermination(10, TimeUnit.SECONDS);
        }
    }

    /**
     * 지정한 매퍼 메서드의 첫 DB 조회가 끝난 직후(결과를 받은 뒤, 호출자에게 돌려주기 전) 멈춘다. 나머지 호출은 그대로 지나간다.
     * fail이면 풀릴 때 예외를 던진다(적재 실패 주입). 빈으로 등록하면 컨텍스트가 하나 더 뜨므로 이미 뜬 SqlSessionFactory에 붙인다.
     */
    @Intercepts(@Signature(type = Executor.class, method = "query",
            args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class}))
    static final class HoldAfterQuery implements Interceptor {

        private final AtomicBoolean armed = new AtomicBoolean();
        private volatile String method;
        private volatile boolean fail;
        private volatile CountDownLatch paused = new CountDownLatch(1);
        private volatile CountDownLatch released = new CountDownLatch(1);

        static synchronized HoldAfterQuery attach(SqlSessionFactory factory) {
            for (Interceptor i : factory.getConfiguration().getInterceptors()) {
                if (i instanceof HoldAfterQuery h) {
                    return h;
                }
            }
            HoldAfterQuery h = new HoldAfterQuery();
            factory.getConfiguration().addInterceptor(h);
            return h;
        }

        void arm(String methodName, boolean failOnRelease) {
            method = methodName;
            fail = failOnRelease;
            paused = new CountDownLatch(1);
            released = new CountDownLatch(1);
            armed.set(true);
        }

        boolean awaitPaused() throws InterruptedException {
            return paused.await(10, TimeUnit.SECONDS);
        }

        void release() {
            armed.set(false);
            released.countDown();
        }

        @Override
        public Object intercept(Invocation invocation) throws Throwable {
            Object result = invocation.proceed();
            MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
            if (method != null && ms.getId().endsWith("." + method) && armed.compareAndSet(true, false)) {
                boolean failNow = fail;
                CountDownLatch gate = released;
                paused.countDown();
                gate.await(15, TimeUnit.SECONDS);
                if (failNow) {
                    throw new IllegalStateException("적재 실패 주입(테스트)");
                }
            }
            return result;
        }
    }
}
