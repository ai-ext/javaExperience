package com.example.board.tickets;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import javax.sql.DataSource;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.support.TransactionTemplate;

import com.example.board.ApiTestSupport;
import com.example.board.admin.AdminService;
import com.example.board.member.AuthMember;
import com.example.board.member.Member;
import com.example.board.member.Role;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * B15 확인 테스트: 숨긴 글은 숨김이 커밋된 바로 다음 인기글 조회부터 빠진다.
 * "캐시 삭제 → 다른 요청의 재적재 → 커밋" 순서를 TTL을 기다리지 않고 매번 만든다.
 * 별도 커넥션이 그 글 행을 FOR UPDATE로 잡아 두면 숨김 요청은 커밋 직전 UPDATE에서 멈춘다. 그 틈에 인기글을 읽는다.
 */
class B15ConfirmTest extends ApiTestSupport {

    @Autowired
    DataSource dataSource;

    @Autowired
    AdminService adminService;

    @Autowired
    TransactionTemplate tx;

    Member admin;
    Long hidden;

    @BeforeEach
    void seed() throws Exception {
        clearPosts();
        Member author = newMember(Role.USER);
        admin = newMember(Role.ADMIN);
        hidden = insertPost(author, "숨길 글", "내용", "ACTIVE");
        jdbc.update("UPDATE post SET like_count = 50 WHERE id = ?", hidden);
        Long other = insertPost(author, "남을 글", "내용", "ACTIVE");
        jdbc.update("UPDATE post SET like_count = 1 WHERE id = ?", other);
        // 캐시를 먼저 채운다(숨길 글이 1위)
        assertThat(popularIds()).first().isEqualTo(hidden);
        assertThat(redis.hasKey("popular:posts")).isTrue();
    }

    @AfterEach
    void clearAuth() {
        SecurityContextHolder.clearContext();
    }

    List<Long> popularIds() throws Exception {
        String body = mockMvc.perform(get("/api/posts/popular")).andReturn().getResponse().getContentAsString();
        return com.jayway.jsonpath.JsonPath.<List<Number>>read(body, "$.items[*].id").stream()
                .map(Number::longValue).toList();
    }

    /** 글 행 UPDATE가 잠금을 기다리는 연결 수. 같은 DB 계정의 연결은 PROCESS 권한 없이도 보인다. */
    long blockedPostUpdates() {
        return jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.PROCESSLIST"
                + " WHERE COMMAND = 'Query' AND INFO LIKE 'update post%'", Long.class);
    }

    @Test
    void 숨김이_커밋되기_전에_다른_요청이_인기글을_읽어도_커밋_뒤_조회에는_숨긴_글이_없다() throws Exception {
        ExecutorService pool = Executors.newSingleThreadExecutor();
        try (Connection locker = dataSource.getConnection()) {
            locker.setAutoCommit(false);
            try (PreparedStatement ps = locker.prepareStatement("SELECT id FROM post WHERE id = ? FOR UPDATE")) {
                ps.setLong(1, hidden);
                ps.executeQuery().close();
            }
            Future<Integer> hide = pool.submit(() -> mockMvc
                    .perform(post("/api/admin/posts/{id}/hide", hidden).header("Authorization", bearer(admin)))
                    .andReturn().getResponse().getStatus());
            try {
                // 숨김 요청이 글 행 잠금을 기다릴 때까지(= 숨김 트랜잭션이 아직 커밋 전) 기다린다
                long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
                while (blockedPostUpdates() == 0 && !hide.isDone() && System.nanoTime() < deadline) {
                    Thread.sleep(20);
                }
                assertThat(blockedPostUpdates()).as("숨김 요청이 커밋 전 글 행 잠금에서 기다려야 한다").isPositive();

                // 커밋 전의 다른 요청. 이 시점의 DB에서는 아직 ACTIVE다.
                CompletableFuture.supplyAsync(() -> {
                    try {
                        return popularIds();
                    } catch (Exception e) {
                        throw new IllegalStateException(e);
                    }
                }).get(5, TimeUnit.SECONDS);
            } finally {
                locker.rollback();
            }
            assertThat(hide.get(10, TimeUnit.SECONDS)).isEqualTo(200);
        } finally {
            // 끼어들기(interrupt)로 끝내면 진행 중인 Redis 명령이 실패해 다음 테스트까지 캐시가 꺼진다
            pool.shutdown();
            pool.awaitTermination(10, TimeUnit.SECONDS);
        }

        assertThat(jdbc.queryForObject("SELECT status FROM post WHERE id = ?", String.class, hidden))
                .isEqualTo("HIDDEN");
        assertThat(popularIds()).as("숨김 커밋 직후 인기글").doesNotContain(hidden);
    }

    @Test
    void 숨김이_롤백되면_인기글_캐시는_그대로_남는다() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                new AuthMember(admin.getId(), Role.ADMIN), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
        String before = redis.opsForValue().get("popular:posts");

        tx.executeWithoutResult(s -> {
            adminService.hidePost(hidden, null);
            s.setRollbackOnly();
        });

        assertThat(jdbc.queryForObject("SELECT status FROM post WHERE id = ?", String.class, hidden))
                .isEqualTo("ACTIVE");
        assertThat(redis.opsForValue().get("popular:posts")).as("롤백 뒤 캐시").isEqualTo(before);
    }
}
