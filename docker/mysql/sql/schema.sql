-- 게시판(커뮤니티) 클론 연습 스키마 — MySQL 8.4
-- 회원 · 게시판 · 게시글 · 댓글(1단계 답글) · 좋아요 · 북마크(폴더) · 태그 · 팔로우 · 차단 · API 토큰
-- DB를 만들거나 고르지 않는다(USE 없음). Docker 이미지가 앞에 `USE community;`/`USE practice;`를 붙여 두 DB에 각각 실행하고,
-- 테스트는 Testcontainers DB에 그대로 실행한다. 스키마는 이 파일 하나만 고친다.
-- 클라이언트 문자셋 고정 — 없으면 한글·이모지가 이중 인코딩돼 저장된다.
SET NAMES utf8mb4;

CREATE TABLE member (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(160) NOT NULL,
  nickname VARCHAR(40) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'USER',
  member_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME NULL,
  CONSTRAINT uk_member_email UNIQUE (email),
  CONSTRAINT uk_member_nickname UNIQUE (nickname),
  CONSTRAINT ck_member_role CHECK (role IN ('USER', 'ADMIN')),
  CONSTRAINT ck_member_status CHECK (member_status IN ('ACTIVE', 'SUSPENDED', 'WITHDRAWN'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='회원 — 탈퇴(WITHDRAWN)해도 행은 남고 deleted_at이 찍힌다';

CREATE TABLE board (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(30) NOT NULL,
  name VARCHAR(50) NOT NULL,
  write_role VARCHAR(20) NOT NULL DEFAULT 'USER',
  sort_order INT NOT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT uk_board_slug UNIQUE (slug),
  CONSTRAINT ck_board_write_role CHECK (write_role IN ('USER', 'ADMIN'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='게시판 — write_role=ADMIN이면 운영자만 글쓰기(공지)';

CREATE TABLE post (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  board_id BIGINT NOT NULL,
  author_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED',
  visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
  view_count INT NOT NULL DEFAULT 0,
  like_count INT NOT NULL DEFAULT 0,
  comment_count INT NOT NULL DEFAULT 0,
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_post_board FOREIGN KEY (board_id) REFERENCES board (id),
  CONSTRAINT fk_post_author FOREIGN KEY (author_id) REFERENCES member (id),
  CONSTRAINT ck_post_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'HIDDEN')),
  CONSTRAINT ck_post_visibility CHECK (visibility IN ('PUBLIC', 'FOLLOWERS')),
  CONSTRAINT ck_post_counts CHECK (view_count >= 0 AND like_count >= 0 AND comment_count >= 0),
  KEY ix_post_board_published (board_id, published_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='게시글 — like_count·comment_count는 목록 성능용 비정규화 컬럼(실제 행 수와 어긋날 수 있다)';

CREATE TABLE comment (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  parent_id BIGINT NULL,
  content VARCHAR(1000) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES post (id),
  CONSTRAINT fk_comment_member FOREIGN KEY (member_id) REFERENCES member (id),
  CONSTRAINT fk_comment_parent FOREIGN KEY (parent_id) REFERENCES comment (id),
  KEY ix_comment_post (post_id, parent_id, created_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='댓글 — parent_id가 있으면 답글(1단계까지만)';

CREATE TABLE post_like (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT NOT NULL,
  member_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT uk_post_like UNIQUE (post_id, member_id),
  CONSTRAINT fk_post_like_post FOREIGN KEY (post_id) REFERENCES post (id),
  CONSTRAINT fk_post_like_member FOREIGN KEY (member_id) REFERENCES member (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='게시글 좋아요 — 한 회원이 한 글에 한 번';

CREATE TABLE bookmark_folder (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT NOT NULL,
  name VARCHAR(50) NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT uk_bookmark_folder_name UNIQUE (member_id, name),
  CONSTRAINT fk_bookmark_folder_member FOREIGN KEY (member_id) REFERENCES member (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='북마크 폴더 — 회원별 이름 중복 불가';

CREATE TABLE bookmark (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  member_id BIGINT NOT NULL,
  post_id BIGINT NOT NULL,
  folder_id BIGINT NULL,
  memo VARCHAR(200) NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  CONSTRAINT uk_bookmark UNIQUE (member_id, post_id),
  CONSTRAINT fk_bookmark_member FOREIGN KEY (member_id) REFERENCES member (id),
  CONSTRAINT fk_bookmark_post FOREIGN KEY (post_id) REFERENCES post (id),
  CONSTRAINT fk_bookmark_folder FOREIGN KEY (folder_id) REFERENCES bookmark_folder (id),
  KEY ix_bookmark_member_folder (member_id, folder_id, created_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='북마크(즐겨찾기) — folder_id NULL은 기본 폴더';

CREATE TABLE tag (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NOT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT uk_tag_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='태그';

CREATE TABLE post_tag (
  post_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  CONSTRAINT fk_post_tag_post FOREIGN KEY (post_id) REFERENCES post (id),
  CONSTRAINT fk_post_tag_tag FOREIGN KEY (tag_id) REFERENCES tag (id),
  KEY ix_post_tag_tag (tag_id, post_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='게시글-태그 연결(복합 PK)';

CREATE TABLE follow (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  follower_id BIGINT NOT NULL,
  followee_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT uk_follow UNIQUE (follower_id, followee_id),
  CONSTRAINT ck_follow_self CHECK (follower_id <> followee_id),
  CONSTRAINT fk_follow_follower FOREIGN KEY (follower_id) REFERENCES member (id),
  CONSTRAINT fk_follow_followee FOREIGN KEY (followee_id) REFERENCES member (id),
  KEY ix_follow_followee (followee_id, follower_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='팔로우 — follower가 followee를 팔로우';

CREATE TABLE member_block (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  blocker_id BIGINT NOT NULL,
  blocked_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT uk_member_block UNIQUE (blocker_id, blocked_id),
  CONSTRAINT ck_member_block_self CHECK (blocker_id <> blocked_id),
  CONSTRAINT fk_member_block_blocker FOREIGN KEY (blocker_id) REFERENCES member (id),
  CONSTRAINT fk_member_block_blocked FOREIGN KEY (blocked_id) REFERENCES member (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='차단 — 어느 한쪽이라도 차단하면 서로의 글이 안 보인다';

CREATE TABLE api_token (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(100) NOT NULL,
  member_id BIGINT NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  CONSTRAINT uk_api_token UNIQUE (token),
  CONSTRAINT fk_api_token_member FOREIGN KEY (member_id) REFERENCES member (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='API 토큰 — 로그인 기능 대신 미리 발급해 둔 토큰. 요청 헤더 Authorization: Bearer <token>';
