-- 시나리오(따라 만들기)용 최소 데이터 — community DB.
-- 게시글은 여러분이 API로 직접 만든다. 여기에는 회원·게시판·태그·토큰과, 좋아요·댓글 단계에서 쓸 남의 글 몇 개만 있다.
-- 처음 상태로 되돌리기: docker compose down -v && docker compose up -d --build
SET NAMES utf8mb4;

INSERT INTO member (id, email, nickname, role, member_status, created_at, updated_at, deleted_at) VALUES
(1, 'admin@example.invalid',   '운영자',   'ADMIN', 'ACTIVE',    '2026-09-01 09:00:00', '2026-09-01 09:00:00', NULL),
(2, 'kimjava@example.invalid', '김자바',   'USER',  'ACTIVE',    '2026-09-02 10:00:00', '2026-09-02 10:00:00', NULL),
(3, 'lee@example.invalid',     '이스프링', 'USER',  'ACTIVE',    '2026-09-03 11:00:00', '2026-09-03 11:00:00', NULL),
(4, 'park@example.invalid',    '박디비',   'USER',  'ACTIVE',    '2026-09-04 12:00:00', '2026-09-04 12:00:00', NULL),
(5, 'choi@example.invalid',    '최정지',   'USER',  'SUSPENDED', '2026-09-05 13:00:00', '2026-09-20 09:00:00', NULL);

INSERT INTO board (id, slug, name, write_role, sort_order, created_at) VALUES
(1, 'notice', '공지사항', 'ADMIN', 1, '2026-09-01 09:00:00'),
(2, 'dev',    '개발',     'USER',  2, '2026-09-01 09:00:00'),
(3, 'qna',    '질문',     'USER',  3, '2026-09-01 09:00:00'),
(4, 'free',   '자유',     'USER',  4, '2026-09-01 09:00:00');

INSERT INTO tag (id, name, created_at) VALUES
(1, 'java', '2026-09-01 09:00:00'), (2, 'spring', '2026-09-01 09:00:00'), (3, 'jpa', '2026-09-01 09:00:00'),
(4, 'mysql', '2026-09-01 09:00:00'), (5, 'docker', '2026-09-01 09:00:00'), (6, '테스트', '2026-09-01 09:00:00'),
(7, '회고', '2026-09-01 09:00:00'), (8, '질문', '2026-09-01 09:00:00');

-- 남이 쓴 글 3개(좋아요·댓글 단계에서 쓴다). 여러분이 만드는 글은 id 4부터 붙는다.
INSERT INTO post (id, board_id, author_id, title, content, status, visibility, view_count, like_count, comment_count,
                  published_at, created_at, updated_at, deleted_at) VALUES
(1, 1, 1, '[공지] 실습 게시판 이용 안내', '이 게시판은 API 실습용입니다. 공지 게시판에는 운영자만 글을 쓸 수 있습니다.', 'PUBLISHED', 'PUBLIC', 0, 0, 0,
 '2026-09-10 09:00:00', '2026-09-10 09:00:00', '2026-09-10 09:00:00', NULL),
(2, 2, 3, 'JPA 연관관계 매핑 정리', '@ManyToOne은 기본이 즉시 로딩이라 지연 로딩으로 바꿔 두는 편입니다. 예제와 함께 정리했습니다.', 'PUBLISHED', 'PUBLIC', 0, 1, 0,
 '2026-09-15 20:00:00', '2026-09-15 20:00:00', '2026-09-15 20:00:00', NULL),
(3, 3, 4, '인덱스는 언제 타나요?', 'WHERE 절에 함수를 씌웠더니 인덱스를 안 타는 것 같습니다. 이유가 뭘까요?', 'PUBLISHED', 'PUBLIC', 0, 0, 0,
 '2026-09-18 14:30:00', '2026-09-18 14:30:00', '2026-09-18 14:30:00', NULL);

INSERT INTO post_tag (post_id, tag_id) VALUES (2, 2), (2, 3), (3, 4), (3, 8);
INSERT INTO post_like (id, post_id, member_id, created_at) VALUES (1, 2, 4, '2026-09-16 08:00:00');
INSERT INTO follow (id, follower_id, followee_id, created_at) VALUES (1, 2, 3, '2026-09-12 10:00:00');

-- 로그인 대신 쓰는 토큰. 요청 헤더: Authorization: Bearer <token>
INSERT INTO api_token (id, token, member_id, expires_at, revoked_at, created_at) VALUES
(1, 'tok-admin',          1, '2099-12-31 23:59:59', NULL,                  '2026-09-01 09:00:00'),
(2, 'tok-kimjava',        2, '2099-12-31 23:59:59', NULL,                  '2026-09-02 10:00:00'),
(3, 'tok-lee',            3, '2099-12-31 23:59:59', NULL,                  '2026-09-03 11:00:00'),
(4, 'tok-park',           4, '2099-12-31 23:59:59', NULL,                  '2026-09-04 12:00:00'),
(5, 'tok-kimjava-old',    2, '2026-01-01 00:00:00', NULL,                  '2025-07-01 10:00:00'),
(6, 'tok-kimjava-revoked',2, '2099-12-31 23:59:59', '2026-09-20 09:00:00', '2026-09-02 10:00:00'),
(7, 'tok-choi',           5, '2099-12-31 23:59:59', NULL,                  '2026-09-05 13:00:00');
