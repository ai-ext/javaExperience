-- javaExperience 실습 DB — community DB(시나리오용). USE 없음 — 컨테이너는 MYSQL_DATABASE(community)에, 테스트는 Testcontainers DB에 적재한다
-- docker/mysql/dump.sh 로 만든 파일(mysqldump). 직접 고치기보다 DB를 고친 뒤 다시 뜬다.
SET NAMES utf8mb4;
-- 테이블이 이름순으로 나와 참조 대상보다 먼저 만들어질 수 있어서 외래키 검사를 잠시 끈다
SET FOREIGN_KEY_CHECKS = 0;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_token` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `token` varchar(100) NOT NULL,
  `member_id` bigint NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_api_token` (`token`),
  KEY `fk_api_token_member` (`member_id`),
  CONSTRAINT `fk_api_token_member` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='API 토큰 — 로그인 기능 대신 미리 발급해 둔 토큰. 요청 헤더 Authorization: Bearer <token>';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (1,'tok-admin',1,'2099-12-31 23:59:59',NULL,'2026-09-01 09:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (2,'tok-kimjava',2,'2099-12-31 23:59:59',NULL,'2026-09-02 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (3,'tok-lee',3,'2099-12-31 23:59:59',NULL,'2026-09-03 11:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (4,'tok-park',4,'2099-12-31 23:59:59',NULL,'2026-09-04 12:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (5,'tok-kimjava-old',2,'2026-01-01 00:00:00',NULL,'2025-07-01 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (6,'tok-kimjava-revoked',2,'2099-12-31 23:59:59','2026-09-20 09:00:00','2026-09-02 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (7,'tok-choi',5,'2099-12-31 23:59:59',NULL,'2026-09-05 13:00:00');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `board` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `slug` varchar(30) NOT NULL,
  `name` varchar(50) NOT NULL,
  `write_role` varchar(20) NOT NULL DEFAULT 'USER',
  `sort_order` int NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_board_slug` (`slug`),
  CONSTRAINT `ck_board_write_role` CHECK ((`write_role` in (_utf8mb4'USER',_utf8mb4'ADMIN')))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='게시판 — write_role=ADMIN이면 운영자만 글쓰기(공지)';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `board` (`id`, `slug`, `name`, `write_role`, `sort_order`, `created_at`) VALUES (1,'notice','공지사항','ADMIN',1,'2026-09-01 09:00:00');
INSERT INTO `board` (`id`, `slug`, `name`, `write_role`, `sort_order`, `created_at`) VALUES (2,'dev','개발','USER',2,'2026-09-01 09:00:00');
INSERT INTO `board` (`id`, `slug`, `name`, `write_role`, `sort_order`, `created_at`) VALUES (3,'qna','질문','USER',3,'2026-09-01 09:00:00');
INSERT INTO `board` (`id`, `slug`, `name`, `write_role`, `sort_order`, `created_at`) VALUES (4,'free','자유','USER',4,'2026-09-01 09:00:00');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookmark` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `member_id` bigint NOT NULL,
  `post_id` bigint NOT NULL,
  `folder_id` bigint DEFAULT NULL,
  `memo` varchar(200) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_bookmark` (`member_id`,`post_id`),
  KEY `fk_bookmark_post` (`post_id`),
  KEY `fk_bookmark_folder` (`folder_id`),
  KEY `ix_bookmark_member_folder` (`member_id`,`folder_id`,`created_at`,`id`),
  CONSTRAINT `fk_bookmark_folder` FOREIGN KEY (`folder_id`) REFERENCES `bookmark_folder` (`id`),
  CONSTRAINT `fk_bookmark_member` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`),
  CONSTRAINT `fk_bookmark_post` FOREIGN KEY (`post_id`) REFERENCES `post` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='북마크(즐겨찾기) — folder_id NULL은 기본 폴더';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookmark_folder` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `member_id` bigint NOT NULL,
  `name` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_bookmark_folder_name` (`member_id`,`name`),
  CONSTRAINT `fk_bookmark_folder_member` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='북마크 폴더 — 회원별 이름 중복 불가';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comment` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `post_id` bigint NOT NULL,
  `member_id` bigint NOT NULL,
  `parent_id` bigint DEFAULT NULL,
  `content` varchar(1000) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_comment_member` (`member_id`),
  KEY `fk_comment_parent` (`parent_id`),
  KEY `ix_comment_post` (`post_id`,`parent_id`,`created_at`,`id`),
  CONSTRAINT `fk_comment_member` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`),
  CONSTRAINT `fk_comment_parent` FOREIGN KEY (`parent_id`) REFERENCES `comment` (`id`),
  CONSTRAINT `fk_comment_post` FOREIGN KEY (`post_id`) REFERENCES `post` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='댓글 — parent_id가 있으면 답글(1단계까지만)';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `follow` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `follower_id` bigint NOT NULL,
  `followee_id` bigint NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_follow` (`follower_id`,`followee_id`),
  KEY `ix_follow_followee` (`followee_id`,`follower_id`),
  CONSTRAINT `fk_follow_followee` FOREIGN KEY (`followee_id`) REFERENCES `member` (`id`),
  CONSTRAINT `fk_follow_follower` FOREIGN KEY (`follower_id`) REFERENCES `member` (`id`),
  CONSTRAINT `ck_follow_self` CHECK ((`follower_id` <> `followee_id`))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='팔로우 — follower가 followee를 팔로우';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `follow` (`id`, `follower_id`, `followee_id`, `created_at`) VALUES (1,2,3,'2026-09-12 10:00:00');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(160) NOT NULL,
  `nickname` varchar(40) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'USER',
  `member_status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_member_email` (`email`),
  UNIQUE KEY `uk_member_nickname` (`nickname`),
  CONSTRAINT `ck_member_role` CHECK ((`role` in (_utf8mb4'USER',_utf8mb4'ADMIN'))),
  CONSTRAINT `ck_member_status` CHECK ((`member_status` in (_utf8mb4'ACTIVE',_utf8mb4'SUSPENDED',_utf8mb4'WITHDRAWN')))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='회원 — 탈퇴(WITHDRAWN)해도 행은 남고 deleted_at이 찍힌다';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (1,'admin@example.invalid','운영자','ADMIN','ACTIVE','2026-09-01 09:00:00','2026-09-01 09:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (2,'kimjava@example.invalid','김자바','USER','ACTIVE','2026-09-02 10:00:00','2026-09-02 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (3,'lee@example.invalid','이스프링','USER','ACTIVE','2026-09-03 11:00:00','2026-09-03 11:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (4,'park@example.invalid','박디비','USER','ACTIVE','2026-09-04 12:00:00','2026-09-04 12:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (5,'choi@example.invalid','최정지','USER','SUSPENDED','2026-09-05 13:00:00','2026-09-20 09:00:00',NULL);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `member_block` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `blocker_id` bigint NOT NULL,
  `blocked_id` bigint NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_member_block` (`blocker_id`,`blocked_id`),
  KEY `fk_member_block_blocked` (`blocked_id`),
  CONSTRAINT `fk_member_block_blocked` FOREIGN KEY (`blocked_id`) REFERENCES `member` (`id`),
  CONSTRAINT `fk_member_block_blocker` FOREIGN KEY (`blocker_id`) REFERENCES `member` (`id`),
  CONSTRAINT `ck_member_block_self` CHECK ((`blocker_id` <> `blocked_id`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='차단 — 어느 한쪽이라도 차단하면 서로의 글이 안 보인다';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `board_id` bigint NOT NULL,
  `author_id` bigint NOT NULL,
  `title` varchar(200) NOT NULL,
  `content` text NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PUBLISHED',
  `visibility` varchar(20) NOT NULL DEFAULT 'PUBLIC',
  `view_count` int NOT NULL DEFAULT '0',
  `like_count` int NOT NULL DEFAULT '0',
  `comment_count` int NOT NULL DEFAULT '0',
  `published_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_post_author` (`author_id`),
  KEY `ix_post_board_published` (`board_id`,`published_at`,`id`),
  CONSTRAINT `fk_post_author` FOREIGN KEY (`author_id`) REFERENCES `member` (`id`),
  CONSTRAINT `fk_post_board` FOREIGN KEY (`board_id`) REFERENCES `board` (`id`),
  CONSTRAINT `ck_post_counts` CHECK (((`view_count` >= 0) and (`like_count` >= 0) and (`comment_count` >= 0))),
  CONSTRAINT `ck_post_status` CHECK ((`status` in (_utf8mb4'DRAFT',_utf8mb4'PUBLISHED',_utf8mb4'HIDDEN'))),
  CONSTRAINT `ck_post_visibility` CHECK ((`visibility` in (_utf8mb4'PUBLIC',_utf8mb4'FOLLOWERS')))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='게시글 — like_count·comment_count는 목록 성능용 비정규화 컬럼(실제 행 수와 어긋날 수 있다)';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (1,1,1,'[공지] 실습 게시판 이용 안내','이 게시판은 API 실습용입니다. 공지 게시판에는 운영자만 글을 쓸 수 있습니다.','PUBLISHED','PUBLIC',0,0,0,'2026-09-10 09:00:00','2026-09-10 09:00:00','2026-09-10 09:00:00',NULL);
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (2,2,3,'JPA 연관관계 매핑 정리','@ManyToOne은 기본이 즉시 로딩이라 지연 로딩으로 바꿔 두는 편입니다. 예제와 함께 정리했습니다.','PUBLISHED','PUBLIC',0,1,0,'2026-09-15 20:00:00','2026-09-15 20:00:00','2026-09-15 20:00:00',NULL);
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (3,3,4,'인덱스는 언제 타나요?','WHERE 절에 함수를 씌웠더니 인덱스를 안 타는 것 같습니다. 이유가 뭘까요?','PUBLISHED','PUBLIC',0,0,0,'2026-09-18 14:30:00','2026-09-18 14:30:00','2026-09-18 14:30:00',NULL);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_like` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `post_id` bigint NOT NULL,
  `member_id` bigint NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_post_like` (`post_id`,`member_id`),
  KEY `fk_post_like_member` (`member_id`),
  CONSTRAINT `fk_post_like_member` FOREIGN KEY (`member_id`) REFERENCES `member` (`id`),
  CONSTRAINT `fk_post_like_post` FOREIGN KEY (`post_id`) REFERENCES `post` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='게시글 좋아요 — 한 회원이 한 글에 한 번';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `post_like` (`id`, `post_id`, `member_id`, `created_at`) VALUES (1,2,4,'2026-09-16 08:00:00');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `post_tag` (
  `post_id` bigint NOT NULL,
  `tag_id` bigint NOT NULL,
  PRIMARY KEY (`post_id`,`tag_id`),
  KEY `ix_post_tag_tag` (`tag_id`,`post_id`),
  CONSTRAINT `fk_post_tag_post` FOREIGN KEY (`post_id`) REFERENCES `post` (`id`),
  CONSTRAINT `fk_post_tag_tag` FOREIGN KEY (`tag_id`) REFERENCES `tag` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='게시글-태그 연결(복합 PK)';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `post_tag` (`post_id`, `tag_id`) VALUES (2,2);
INSERT INTO `post_tag` (`post_id`, `tag_id`) VALUES (2,3);
INSERT INTO `post_tag` (`post_id`, `tag_id`) VALUES (3,4);
INSERT INTO `post_tag` (`post_id`, `tag_id`) VALUES (3,8);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tag` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tag_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='태그';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `tag` (`id`, `name`, `created_at`) VALUES (1,'java','2026-09-01 09:00:00');
INSERT INTO `tag` (`id`, `name`, `created_at`) VALUES (2,'spring','2026-09-01 09:00:00');
INSERT INTO `tag` (`id`, `name`, `created_at`) VALUES (3,'jpa','2026-09-01 09:00:00');
INSERT INTO `tag` (`id`, `name`, `created_at`) VALUES (4,'mysql','2026-09-01 09:00:00');
INSERT INTO `tag` (`id`, `name`, `created_at`) VALUES (5,'docker','2026-09-01 09:00:00');
INSERT INTO `tag` (`id`, `name`, `created_at`) VALUES (6,'테스트','2026-09-01 09:00:00');
INSERT INTO `tag` (`id`, `name`, `created_at`) VALUES (7,'회고','2026-09-01 09:00:00');
INSERT INTO `tag` (`id`, `name`, `created_at`) VALUES (8,'질문','2026-09-01 09:00:00');
SET FOREIGN_KEY_CHECKS = 1;
