-- db-perf-fixture.sh가 @target_rows를 검증된 정수로 먼저 설정한다.
-- 이 스크립트는 전용 disposable 컨테이너 안의 DB만 구성한다.

CREATE TABLE post_like (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    member_id BIGINT UNSIGNED NOT NULL,
    post_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY ix_post_like_member (member_id)
) ENGINE = InnoDB;

CREATE TABLE digit (
    n TINYINT UNSIGNED NOT NULL PRIMARY KEY
) ENGINE = MEMORY;

INSERT INTO digit (n) VALUES (0),(1),(2),(3),(4),(5),(6),(7),(8),(9);

INSERT INTO post_like (member_id, post_id, created_at)
SELECT MOD(sequence_rows.seq, 1000) + 1,
       sequence_rows.seq + 1,
       TIMESTAMP('2020-01-01 00:00:00') + INTERVAL sequence_rows.seq SECOND
FROM (
    SELECT d0.n
         + d1.n * 10
         + d2.n * 100
         + d3.n * 1000
         + d4.n * 10000
         + d5.n * 100000 AS seq
    FROM digit d0
    CROSS JOIN digit d1
    CROSS JOIN digit d2
    CROSS JOIN digit d3
    CROSS JOIN digit d4
    CROSS JOIN digit d5
) AS sequence_rows
WHERE sequence_rows.seq < @target_rows;

DROP TABLE digit;

ANALYZE TABLE post_like;

SELECT COUNT(*) AS row_count,
       COUNT(DISTINCT member_id) AS member_count,
       MIN(member_id) AS first_member_id,
       MAX(member_id) AS last_member_id
FROM post_like;
