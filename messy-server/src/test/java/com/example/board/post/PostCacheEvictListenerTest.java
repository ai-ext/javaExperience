package com.example.board.post;

import javax.sql.DataSource;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

import com.example.board.ApiTestSupport;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.HikariPoolMXBean;

import static org.assertj.core.api.Assertions.assertThat;

class PostCacheEvictListenerTest extends ApiTestSupport {

    @Autowired
    TransactionTemplate tx;

    @Autowired
    ApplicationEventPublisher events;

    @Autowired
    DataSource dataSource;

    @Autowired
    PostRepository postRepository;

    @BeforeEach
    void cached() {
        redis.opsForValue().set("popular:posts", "[]");
    }

    @Test
    void 롤백된_트랜잭션에서는_캐시를_지우지_않는다() {
        tx.executeWithoutResult(s -> {
            events.publishEvent(new PostChangedEvent(1L));
            s.setRollbackOnly();
        });

        assertThat(redis.hasKey("popular:posts")).isTrue();
    }

    // 함정: 커밋 전에 지우면 그 사이 다른 요청이 옛 값을 다시 적재해 TTL 동안 남는다
    @Test
    void 커밋_전에는_지우지_않고_커밋_뒤에_지운다() {
        tx.executeWithoutResult(s -> {
            events.publishEvent(new PostChangedEvent(1L));
            assertThat(redis.hasKey("popular:posts")).as("커밋 전").isTrue();
        });

        assertThat(redis.hasKey("popular:posts")).as("커밋 뒤").isFalse();
    }

    // AFTER_COMMIT 리스너는 요청 스레드에서 동기로 돈다. 그때 DB 커넥션을 쥐고 있으면 Redis 지연(최대 500ms) 동안 풀을 잡는다.
    @Test
    void 커밋_뒤_리스너가_도는_동안_DB_커넥션을_이미_반납했다() throws Exception {
        HikariPoolMXBean pool = dataSource.unwrap(HikariDataSource.class).getHikariPoolMXBean();
        int[] activeAfterCommit = {-1};

        tx.executeWithoutResult(s -> {
            postRepository.count();
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    activeAfterCommit[0] = pool.getActiveConnections();
                }
            });
        });

        assertThat(activeAfterCommit[0]).isZero();
    }
}
