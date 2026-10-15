-- db-perf-fixture.sh가 @target_rows를 검증된 정수로 먼저 설정한다.
-- 이 스크립트는 전용 disposable 컨테이너 안의 DB만 구성한다.
-- 연속 번호는 0..999999의 10진수 자리 조합으로 생성한다.

CREATE TABLE board (
    id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    slug VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(80) NOT NULL
) ENGINE = InnoDB;

CREATE TABLE member (
    id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    nickname VARCHAR(80) NOT NULL
) ENGINE = InnoDB;

CREATE TABLE post (
    id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    board_id BIGINT UNSIGNED NOT NULL,
    author_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(160) NOT NULL,
    status VARCHAR(16) NOT NULL,
    visibility VARCHAR(16) NOT NULL,
    created_at DATETIME NOT NULL,
    like_count INT UNSIGNED NOT NULL DEFAULT 0,
    deleted_at DATETIME NULL,
    KEY ix_post_board (board_id),
    CONSTRAINT fk_post_board FOREIGN KEY (board_id) REFERENCES board (id),
    CONSTRAINT fk_post_author FOREIGN KEY (author_id) REFERENCES member (id)
) ENGINE = InnoDB;

-- DB-10 계약: 기본 인덱스는 member_id 하나뿐이다. 복합 인덱스는 학습자가 직접 추가한다.
CREATE TABLE post_like (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    member_id BIGINT UNSIGNED NOT NULL,
    post_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_post_like_member_post (member_id, post_id),
    KEY ix_post_like_member (member_id),
    CONSTRAINT fk_post_like_member FOREIGN KEY (member_id) REFERENCES member (id),
    CONSTRAINT fk_post_like_post FOREIGN KEY (post_id) REFERENCES post (id)
) ENGINE = InnoDB;

CREATE TABLE tag (
    id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    slug VARCHAR(40) NOT NULL UNIQUE
) ENGINE = InnoDB;

-- 의도적으로 post_id 선두 인덱스만 둔다. tag 조건의 접근 방식과 개선 후보를 관찰한다.
CREATE TABLE post_tag (
    post_id BIGINT UNSIGNED NOT NULL,
    tag_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    CONSTRAINT fk_post_tag_post FOREIGN KEY (post_id) REFERENCES post (id),
    CONSTRAINT fk_post_tag_tag FOREIGN KEY (tag_id) REFERENCES tag (id)
) ENGINE = InnoDB;

CREATE TABLE comment (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    post_id BIGINT UNSIGNED NOT NULL,
    member_id BIGINT UNSIGNED NOT NULL,
    body VARCHAR(240) NOT NULL,
    created_at DATETIME NOT NULL,
    deleted_at DATETIME NULL,
    PRIMARY KEY (id),
    KEY ix_comment_post (post_id),
    KEY ix_comment_member (member_id),
    CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES post (id),
    CONSTRAINT fk_comment_member FOREIGN KEY (member_id) REFERENCES member (id)
) ENGINE = InnoDB;

CREATE TABLE digit (
    n TINYINT UNSIGNED NOT NULL PRIMARY KEY
) ENGINE = MEMORY;

INSERT INTO digit (n) VALUES (0),(1),(2),(3),(4),(5),(6),(7),(8),(9);

INSERT INTO board (id, slug, name)
SELECT n + 1, CONCAT('board-', LPAD(n + 1, 2, '0')), CONCAT('게시판 ', n + 1)
FROM (SELECT d0.n + d1.n * 10 AS n FROM digit d0 CROSS JOIN digit d1) numbers
WHERE n < 20;

INSERT INTO member (id, nickname)
SELECT n + 1, CONCAT('member-', LPAD(n + 1, 5, '0'))
FROM (
    SELECT d0.n + d1.n * 10 + d2.n * 100 + d3.n * 1000 AS n
    FROM digit d0 CROSS JOIN digit d1 CROSS JOIN digit d2 CROSS JOIN digit d3
) numbers
WHERE n < 10000;

INSERT INTO tag (id, slug)
SELECT n + 1, CONCAT('tag-', LPAD(n + 1, 2, '0'))
FROM (SELECT d0.n + d1.n * 10 AS n FROM digit d0 CROSS JOIN digit d1) numbers
WHERE n < 50;

INSERT INTO post (id, board_id, author_id, title, status, visibility, created_at, like_count, deleted_at)
SELECT n + 1,
       MOD(n, 20) + 1,
       MOD(n * 37, 10000) + 1,
       CONCAT('게시글 ', n + 1),
       IF(MOD(n, 10) = 0, 'DRAFT', 'PUBLISHED'),
       IF(MOD(n, 5) = 0, 'PRIVATE', 'PUBLIC'),
       TIMESTAMP('2024-01-01 00:00:00') + INTERVAL n SECOND,
       MOD(n * 13, 500),
       IF(MOD(n, 50) = 0, TIMESTAMP('2025-01-01 00:00:00') + INTERVAL n SECOND, NULL)
FROM (
    SELECT d0.n + d1.n * 10 + d2.n * 100 + d3.n * 1000 + d4.n * 10000 AS n
    FROM digit d0 CROSS JOIN digit d1 CROSS JOIN digit d2 CROSS JOIN digit d3 CROSS JOIN digit d4
) numbers
WHERE n < 20000;

-- 각 게시글에 서로 다른 태그 3개. tag-07은 게시글의 약 6%와 매치된다.
INSERT INTO post_tag (post_id, tag_id)
SELECT post_id, MOD(FLOOR((post_id - 1) / 20) + slot * 17, 50) + 1
FROM (
    SELECT post_numbers.n + 1 AS post_id, d.n AS slot
    FROM (
        SELECT d0.n + d1.n * 10 + d2.n * 100 + d3.n * 1000 + d4.n * 10000 AS n
        FROM digit d0 CROSS JOIN digit d1 CROSS JOIN digit d2 CROSS JOIN digit d3 CROSS JOIN digit d4
    ) post_numbers
    CROSS JOIN digit d
    WHERE post_numbers.n < 20000 AND d.n < 3
) post_slots;

-- 좋아요 행 수는 PERF_ROW_COUNT와 정확히 같다. member 12는 2%를 받아
-- ix_post_like_member로 후보를 찾은 뒤 정렬하는 DB-10 실습을 재현한다.
-- 나머지 회원은 member_id 12를 건너뛰며, 각 회원의 post_id는 1M 범위에서 중복되지 않는다.
INSERT INTO post_like (member_id, post_id, created_at)
SELECT IF(MOD(n, 50) = 0, 12, IF(MOD(n, 998) + 2 >= 12, MOD(n, 998) + 3, MOD(n, 998) + 2)),
       IF(MOD(n, 50) = 0, FLOOR(n / 50) + 1, MOD(n, 20000) + 1),
       TIMESTAMP('2020-01-01 00:00:00') + INTERVAL n SECOND
FROM (
    SELECT d0.n + d1.n * 10 + d2.n * 100 + d3.n * 1000 + d4.n * 10000 + d5.n * 100000 AS n
    FROM digit d0 CROSS JOIN digit d1 CROSS JOIN digit d2
    CROSS JOIN digit d3 CROSS JOIN digit d4 CROSS JOIN digit d5
) numbers
WHERE n < @target_rows;

INSERT INTO comment (post_id, member_id, body, created_at, deleted_at)
SELECT MOD(n, 20000) + 1,
       MOD(n * 17, 10000) + 1,
       CONCAT('댓글 ', n + 1),
       TIMESTAMP('2024-01-01 00:00:00') + INTERVAL n SECOND,
       IF(MOD(n, 40) = 0, TIMESTAMP('2025-01-01 00:00:00') + INTERVAL n SECOND, NULL)
FROM (
    SELECT d0.n + d1.n * 10 + d2.n * 100 + d3.n * 1000 + d4.n * 10000 + d5.n * 100000 AS n
    FROM digit d0 CROSS JOIN digit d1 CROSS JOIN digit d2
    CROSS JOIN digit d3 CROSS JOIN digit d4 CROSS JOIN digit d5
) numbers
WHERE n < FLOOR(@target_rows / 5);

DROP TABLE digit;

ANALYZE TABLE board, member, post, post_like, tag, post_tag, comment;

SELECT 'board' AS table_name, COUNT(*) AS row_count FROM board
UNION ALL SELECT 'member', COUNT(*) FROM member
UNION ALL SELECT 'post', COUNT(*) FROM post
UNION ALL SELECT 'post_like', COUNT(*) FROM post_like
UNION ALL SELECT 'tag', COUNT(*) FROM tag
UNION ALL SELECT 'post_tag', COUNT(*) FROM post_tag
UNION ALL SELECT 'comment', COUNT(*) FROM comment;

SELECT COUNT(*) AS member_12_likes,
       MIN(member_id) AS only_member_id,
       MIN(created_at) AS first_liked_at,
       MAX(created_at) AS last_liked_at
FROM post_like
WHERE member_id = 12;
