package com.example.board.admin;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import javax.sql.DataSource;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.support.TransactionTemplate;

import com.example.board.ApiTestSupport;
import com.example.board.common.BusinessException;
import com.example.board.common.ErrorCode;
import com.example.board.member.Member;
import com.example.board.member.MemberRepository;
import com.example.board.member.Role;
import com.example.board.post.PostRepository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 저장소를 목으로 바꾸지 않고 실제 MySQL로 돌린다. UNIQUE(post_id, reporter_id) 위반 같은 DB 동작은 목으로는 확인할 수 없다.
 */
class ReportServiceTest extends ApiTestSupport {

    @Autowired
    ReportService reportService;

    @Autowired
    ReportRepository reportRepository;

    @Autowired
    PostRepository postRepository;

    @Autowired
    MemberRepository members;

    @Autowired
    TransactionTemplate tx;

    @Autowired
    DataSource dataSource;

    int reports(Long postId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM report WHERE post_id = ?", Integer.class, postId);
    }

    @Test
    void 신고하면_OPEN_상태로_저장된다() {
        Long postId = newPost(newMember(Role.USER));
        Member reporter = newMember(Role.USER);

        Long reportId = reportService.report(postId, reporter.getId(), ReportReason.SPAM, "광고 글");

        var row = jdbc.queryForMap("SELECT post_id, reporter_id, reason, detail, status FROM report WHERE id = ?",
                reportId);
        assertThat(row).containsEntry("post_id", postId).containsEntry("reporter_id", reporter.getId())
                .containsEntry("reason", "SPAM").containsEntry("detail", "광고 글").containsEntry("status", "OPEN");
    }

    @Test
    void 같은_회원이_같은_글을_다시_신고하면_duplicate() {
        Long postId = newPost(newMember(Role.USER));
        Member reporter = newMember(Role.USER);
        reportService.report(postId, reporter.getId(), ReportReason.SPAM, null);

        assertThatThrownBy(() -> reportService.report(postId, reporter.getId(), ReportReason.ABUSE, null))
                .isInstanceOfSatisfying(BusinessException.class, e -> {
                    assertThat(e.errorCode()).isEqualTo(ErrorCode.DUPLICATE);
                    assertThat(e.errorCode().type()).isEqualTo("/errors/duplicate");
                });
        assertThat(reports(postId)).isEqualTo(1);
    }

    @Test
    void 다른_회원은_같은_글을_신고할_수_있다() {
        Long postId = newPost(newMember(Role.USER));

        reportService.report(postId, newMember(Role.USER).getId(), ReportReason.SPAM, null);
        reportService.report(postId, newMember(Role.USER).getId(), ReportReason.ETC, null);

        assertThat(reports(postId)).isEqualTo(2);
    }

    @Test
    void 없는_글이나_숨김_삭제된_글은_404() {
        Member author = newMember(Role.USER);
        Long reporterId = newMember(Role.USER).getId();
        Long hidden = insertPost(author, "숨김", "내용", "HIDDEN");
        Long deleted = insertPost(author, "삭제", "내용", "DELETED");

        for (Long postId : new Long[] {999_999_999L, hidden, deleted}) {
            assertThatThrownBy(() -> reportService.report(postId, reporterId, ReportReason.SPAM, null))
                    .isInstanceOfSatisfying(BusinessException.class,
                            e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.NOT_FOUND));
        }
    }

    // 최종 방어선은 스키마다. UNIQUE를 지우면 이 테스트가 실패한다.
    @Test
    void 저장소로_같은_글_같은_회원을_두_번_저장하면_UNIQUE_위반이다() {
        Long postId = newPost(newMember(Role.USER));
        Long reporterId = newMember(Role.USER).getId();
        saveDirectly(postId, reporterId);

        assertThatThrownBy(() -> saveDirectly(postId, reporterId))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    // 함정: exists 선검사는 아직 커밋되지 않은 신고를 보지 못한다. 동시 요청은 둘 다 통과한다.
    @Test
    void 같은_회원이_동시에_10번_신고하면_하나만_성공하고_나머지는_duplicate() throws Exception {
        Long postId = newPost(newMember(Role.USER));
        Long reporterId = newMember(Role.USER).getId();
        List<Callable<String>> tasks = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            tasks.add(() -> {
                try {
                    reportService.report(postId, reporterId, ReportReason.SPAM, null);
                    return "OK";
                } catch (BusinessException e) {
                    return e.errorCode().name();
                }
            });
        }

        List<String> results = runConcurrently(tasks);

        assertThat(results).containsOnly("OK", "DUPLICATE");
        assertThat(results.stream().filter("OK"::equals)).hasSize(1);
        assertThat(reports(postId)).isEqualTo(1);
    }

    /**
     * 경쟁을 우연에 맡기지 않고 재현한다. 다른 트랜잭션이 같은 신고를 넣고 커밋하지 않은 채 멈춰 있으면
     * 서비스의 exists 선검사는 통과하고 INSERT는 UNIQUE 키 잠금에서 기다린다. 그 트랜잭션이 커밋되면
     * INSERT가 UNIQUE 위반으로 끝나는데, 이것도 409 duplicate여야 한다(500이면 안 된다).
     */
    @Test
    void 선검사를_통과한_신고도_UNIQUE_위반으로_막혀_duplicate가_된다() throws Exception {
        Long postId = newPost(newMember(Role.USER));
        Long reporterId = newMember(Role.USER).getId();
        CountDownLatch inserted = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<?> holder = pool.submit(() -> {
                try (Connection c = dataSource.getConnection()) {
                    c.setAutoCommit(false);
                    try (PreparedStatement ps = c.prepareStatement("INSERT INTO report (post_id, reporter_id, reason,"
                            + " status, created_at, updated_at) VALUES (?, ?, 'SPAM', 'OPEN', NOW(6), NOW(6))")) {
                        ps.setLong(1, postId);
                        ps.setLong(2, reporterId);
                        ps.executeUpdate();
                    }
                    inserted.countDown();
                    release.await(10, TimeUnit.SECONDS);
                    c.commit();
                }
                return null;
            });
            assertThat(inserted.await(10, TimeUnit.SECONDS)).isTrue();

            Future<Throwable> second = pool.submit(() -> {
                try {
                    reportService.report(postId, reporterId, ReportReason.SPAM, null);
                    return null;
                } catch (Throwable t) {
                    return t;
                }
            });
            // 선검사를 지나 INSERT에서 잠금을 기다리는 중인지 확인한 뒤 앞 트랜잭션을 커밋한다
            awaitInsertBlocked();
            release.countDown();
            holder.get(10, TimeUnit.SECONDS);

            assertThat(second.get(10, TimeUnit.SECONDS)).isInstanceOfSatisfying(BusinessException.class,
                    e -> assertThat(e.errorCode()).isEqualTo(ErrorCode.DUPLICATE));
            assertThat(reports(postId)).isEqualTo(1);
        } finally {
            release.countDown();
            pool.shutdownNow();
        }
    }

    private void saveDirectly(Long postId, Long reporterId) {
        tx.executeWithoutResult(s -> reportRepository.saveAndFlush(Report.create(postRepository.getReferenceById(postId),
                members.getReferenceById(reporterId), ReportReason.SPAM, null)));
    }

    /** 같은 DB 사용자의 연결은 PROCESS 권한 없이도 PROCESSLIST에서 보인다. */
    private void awaitInsertBlocked() throws InterruptedException {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
        while (System.nanoTime() < deadline) {
            Integer waiting = jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.PROCESSLIST"
                    + " WHERE COMMAND = 'Query' AND LOWER(INFO) LIKE 'insert into report%'", Integer.class);
            if (waiting != null && waiting > 0) {
                return;
            }
            Thread.sleep(20);
        }
        throw new AssertionError("두 번째 신고가 INSERT 잠금 대기에 들어가지 않았다");
    }

    private static <T> List<T> runConcurrently(List<Callable<T>> tasks) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(tasks.size());
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<T>> futures = new ArrayList<>();
            for (Callable<T> t : tasks) {
                futures.add(pool.submit(() -> {
                    start.await();
                    return t.call();
                }));
            }
            start.countDown();
            List<T> result = new ArrayList<>();
            for (Future<T> f : futures) {
                result.add(f.get(30, TimeUnit.SECONDS));
            }
            return result;
        } finally {
            pool.shutdownNow();
        }
    }
}
