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
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='API 토큰 — 로그인 기능 대신 미리 발급해 둔 토큰. 요청 헤더 Authorization: Bearer <token>';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (1,'tok-admin',1,'2099-12-31 23:59:59',NULL,'2026-09-01 09:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (2,'tok-kimjava',2,'2099-12-31 23:59:59',NULL,'2026-09-02 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (3,'tok-lee',3,'2099-12-31 23:59:59',NULL,'2026-09-03 11:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (4,'tok-park',4,'2099-12-31 23:59:59',NULL,'2026-09-04 12:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (5,'tok-kimjava-old',2,'2026-01-01 00:00:00',NULL,'2025-07-01 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (6,'tok-kimjava-revoked',2,'2099-12-31 23:59:59','2026-09-20 09:00:00','2026-09-02 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (7,'tok-choi',5,'2099-12-31 23:59:59',NULL,'2026-09-05 13:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (8,'tok-han',6,'2099-12-31 23:59:59',NULL,'2026-09-06 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (9,'tok-c01',7,'2099-12-31 23:59:59',NULL,'2026-09-07 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (10,'tok-c02',8,'2099-12-31 23:59:59',NULL,'2026-09-07 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (11,'tok-c03',9,'2099-12-31 23:59:59',NULL,'2026-09-07 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (12,'tok-c04',10,'2099-12-31 23:59:59',NULL,'2026-09-07 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (13,'tok-c05',11,'2099-12-31 23:59:59',NULL,'2026-09-07 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (14,'tok-c06',12,'2099-12-31 23:59:59',NULL,'2026-09-07 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (15,'tok-c07',13,'2099-12-31 23:59:59',NULL,'2026-09-07 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (16,'tok-c08',14,'2099-12-31 23:59:59',NULL,'2026-09-07 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (17,'tok-c09',15,'2099-12-31 23:59:59',NULL,'2026-09-07 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (18,'tok-c10',16,'2099-12-31 23:59:59',NULL,'2026-09-07 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (19,'tok-c11',17,'2099-12-31 23:59:59',NULL,'2026-09-07 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (20,'tok-c12',18,'2099-12-31 23:59:59',NULL,'2026-09-07 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (21,'tok-c13',19,'2099-12-31 23:59:59',NULL,'2026-09-07 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (22,'tok-c14',20,'2099-12-31 23:59:59',NULL,'2026-09-07 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (23,'tok-c15',21,'2099-12-31 23:59:59',NULL,'2026-09-07 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (24,'tok-c16',22,'2099-12-31 23:59:59',NULL,'2026-09-07 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (25,'tok-c17',23,'2099-12-31 23:59:59',NULL,'2026-09-07 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (26,'tok-c18',24,'2099-12-31 23:59:59',NULL,'2026-09-07 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (27,'tok-c19',25,'2099-12-31 23:59:59',NULL,'2026-09-07 10:00:00');
INSERT INTO `api_token` (`id`, `token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES (28,'tok-c20',26,'2099-12-31 23:59:59',NULL,'2026-09-07 10:00:00');
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='북마크(즐겨찾기) — folder_id NULL은 기본 폴더';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `bookmark` (`id`, `member_id`, `post_id`, `folder_id`, `memo`, `created_at`, `updated_at`) VALUES (1,3,5,11,'스터디 참고','2026-09-21 13:00:00','2026-09-21 13:00:00');
INSERT INTO `bookmark` (`id`, `member_id`, `post_id`, `folder_id`, `memo`, `created_at`, `updated_at`) VALUES (2,3,9,NULL,NULL,'2026-09-23 20:00:00','2026-09-23 20:00:00');
INSERT INTO `bookmark` (`id`, `member_id`, `post_id`, `folder_id`, `memo`, `created_at`, `updated_at`) VALUES (3,3,10,NULL,NULL,'2026-09-24 12:00:00','2026-09-24 12:00:00');
INSERT INTO `bookmark` (`id`, `member_id`, `post_id`, `folder_id`, `memo`, `created_at`, `updated_at`) VALUES (4,3,2,11,NULL,'2026-09-26 09:00:00','2026-09-26 09:00:00');
INSERT INTO `bookmark` (`id`, `member_id`, `post_id`, `folder_id`, `memo`, `created_at`, `updated_at`) VALUES (5,3,13,12,NULL,'2026-09-26 10:00:00','2026-09-26 10:00:00');
INSERT INTO `bookmark` (`id`, `member_id`, `post_id`, `folder_id`, `memo`, `created_at`, `updated_at`) VALUES (6,3,8,12,'나중에 다시','2026-09-23 12:00:00','2026-09-23 12:00:00');
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='북마크 폴더 — 회원별 이름 중복 불가';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `bookmark_folder` (`id`, `member_id`, `name`, `created_at`, `updated_at`) VALUES (1,4,'폴더01','2026-09-10 10:00:00','2026-09-10 10:00:00');
INSERT INTO `bookmark_folder` (`id`, `member_id`, `name`, `created_at`, `updated_at`) VALUES (2,4,'폴더02','2026-09-10 10:00:00','2026-09-10 10:00:00');
INSERT INTO `bookmark_folder` (`id`, `member_id`, `name`, `created_at`, `updated_at`) VALUES (3,4,'폴더03','2026-09-10 10:00:00','2026-09-10 10:00:00');
INSERT INTO `bookmark_folder` (`id`, `member_id`, `name`, `created_at`, `updated_at`) VALUES (4,4,'폴더04','2026-09-10 10:00:00','2026-09-10 10:00:00');
INSERT INTO `bookmark_folder` (`id`, `member_id`, `name`, `created_at`, `updated_at`) VALUES (5,4,'폴더05','2026-09-10 10:00:00','2026-09-10 10:00:00');
INSERT INTO `bookmark_folder` (`id`, `member_id`, `name`, `created_at`, `updated_at`) VALUES (6,4,'폴더06','2026-09-10 10:00:00','2026-09-10 10:00:00');
INSERT INTO `bookmark_folder` (`id`, `member_id`, `name`, `created_at`, `updated_at`) VALUES (7,4,'폴더07','2026-09-10 10:00:00','2026-09-10 10:00:00');
INSERT INTO `bookmark_folder` (`id`, `member_id`, `name`, `created_at`, `updated_at`) VALUES (8,4,'폴더08','2026-09-10 10:00:00','2026-09-10 10:00:00');
INSERT INTO `bookmark_folder` (`id`, `member_id`, `name`, `created_at`, `updated_at`) VALUES (9,4,'폴더09','2026-09-10 10:00:00','2026-09-10 10:00:00');
INSERT INTO `bookmark_folder` (`id`, `member_id`, `name`, `created_at`, `updated_at`) VALUES (10,4,'폴더10','2026-09-10 10:00:00','2026-09-10 10:00:00');
INSERT INTO `bookmark_folder` (`id`, `member_id`, `name`, `created_at`, `updated_at`) VALUES (11,3,'스프링 공부','2026-09-10 11:00:00','2026-09-10 11:00:00');
INSERT INTO `bookmark_folder` (`id`, `member_id`, `name`, `created_at`, `updated_at`) VALUES (12,3,'나중에 읽기','2026-09-10 11:05:00','2026-09-10 11:05:00');
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='댓글 — parent_id가 있으면 답글(1단계까지만)';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `comment` (`id`, `post_id`, `member_id`, `parent_id`, `content`, `created_at`, `updated_at`, `deleted_at`) VALUES (1,11,4,NULL,'트랜잭션은 서비스 메서드에 거는 게 기본이에요.','2026-09-25 09:00:00','2026-09-25 09:00:00',NULL);
INSERT INTO `comment` (`id`, `post_id`, `member_id`, `parent_id`, `content`, `created_at`, `updated_at`, `deleted_at`) VALUES (2,11,3,1,'감사합니다! 컨트롤러가 아니라 서비스군요.','2026-09-25 10:00:00','2026-09-25 10:00:00',NULL);
INSERT INTO `comment` (`id`, `post_id`, `member_id`, `parent_id`, `content`, `created_at`, `updated_at`, `deleted_at`) VALUES (3,11,6,NULL,'저는 리포지토리에도 붙였어요.','2026-09-25 11:00:00','2026-09-25 11:00:00',NULL);
INSERT INTO `comment` (`id`, `post_id`, `member_id`, `parent_id`, `content`, `created_at`, `updated_at`, `deleted_at`) VALUES (4,11,3,NULL,'질문이 하나 더 있어요.','2026-09-25 12:00:00','2026-09-25 13:30:00','2026-09-25 13:30:00');
INSERT INTO `comment` (`id`, `post_id`, `member_id`, `parent_id`, `content`, `created_at`, `updated_at`, `deleted_at`) VALUES (5,11,4,4,'어떤 질문이었나요?','2026-09-25 13:00:00','2026-09-25 13:00:00',NULL);
INSERT INTO `comment` (`id`, `post_id`, `member_id`, `parent_id`, `content`, `created_at`, `updated_at`, `deleted_at`) VALUES (6,11,4,NULL,'광고 같은 댓글','2026-09-25 14:00:00','2026-09-25 15:00:00','2026-09-25 15:00:00');
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
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='회원 — 탈퇴(WITHDRAWN)해도 행은 남고 deleted_at이 찍힌다';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (1,'admin@example.invalid','운영자','ADMIN','ACTIVE','2026-09-01 09:00:00','2026-09-01 09:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (2,'kimjava@example.invalid','김자바','USER','ACTIVE','2026-09-02 10:00:00','2026-09-02 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (3,'lee@example.invalid','이스프링','USER','ACTIVE','2026-09-03 11:00:00','2026-09-03 11:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (4,'park@example.invalid','박디비','USER','ACTIVE','2026-09-04 12:00:00','2026-09-04 12:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (5,'choi@example.invalid','최정지','USER','SUSPENDED','2026-09-05 13:00:00','2026-09-20 09:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (6,'han@example.invalid','한차단','USER','ACTIVE','2026-09-06 10:00:00','2026-09-06 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (7,'c01@example.invalid','동시성01','USER','ACTIVE','2026-09-07 10:00:00','2026-09-07 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (8,'c02@example.invalid','동시성02','USER','ACTIVE','2026-09-07 10:00:00','2026-09-07 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (9,'c03@example.invalid','동시성03','USER','ACTIVE','2026-09-07 10:00:00','2026-09-07 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (10,'c04@example.invalid','동시성04','USER','ACTIVE','2026-09-07 10:00:00','2026-09-07 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (11,'c05@example.invalid','동시성05','USER','ACTIVE','2026-09-07 10:00:00','2026-09-07 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (12,'c06@example.invalid','동시성06','USER','ACTIVE','2026-09-07 10:00:00','2026-09-07 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (13,'c07@example.invalid','동시성07','USER','ACTIVE','2026-09-07 10:00:00','2026-09-07 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (14,'c08@example.invalid','동시성08','USER','ACTIVE','2026-09-07 10:00:00','2026-09-07 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (15,'c09@example.invalid','동시성09','USER','ACTIVE','2026-09-07 10:00:00','2026-09-07 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (16,'c10@example.invalid','동시성10','USER','ACTIVE','2026-09-07 10:00:00','2026-09-07 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (17,'c11@example.invalid','동시성11','USER','ACTIVE','2026-09-07 10:00:00','2026-09-07 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (18,'c12@example.invalid','동시성12','USER','ACTIVE','2026-09-07 10:00:00','2026-09-07 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (19,'c13@example.invalid','동시성13','USER','ACTIVE','2026-09-07 10:00:00','2026-09-07 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (20,'c14@example.invalid','동시성14','USER','ACTIVE','2026-09-07 10:00:00','2026-09-07 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (21,'c15@example.invalid','동시성15','USER','ACTIVE','2026-09-07 10:00:00','2026-09-07 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (22,'c16@example.invalid','동시성16','USER','ACTIVE','2026-09-07 10:00:00','2026-09-07 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (23,'c17@example.invalid','동시성17','USER','ACTIVE','2026-09-07 10:00:00','2026-09-07 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (24,'c18@example.invalid','동시성18','USER','ACTIVE','2026-09-07 10:00:00','2026-09-07 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (25,'c19@example.invalid','동시성19','USER','ACTIVE','2026-09-07 10:00:00','2026-09-07 10:00:00',NULL);
INSERT INTO `member` (`id`, `email`, `nickname`, `role`, `member_status`, `created_at`, `updated_at`, `deleted_at`) VALUES (26,'c20@example.invalid','동시성20','USER','ACTIVE','2026-09-07 10:00:00','2026-09-07 10:00:00',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='차단 — 어느 한쪽이라도 차단하면 서로의 글이 안 보인다';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `member_block` (`id`, `blocker_id`, `blocked_id`, `created_at`) VALUES (1,6,2,'2026-09-25 09:00:00');
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
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='게시글 — like_count·comment_count는 목록 성능용 비정규화 컬럼(실제 행 수와 어긋날 수 있다)';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (1,1,1,'[공지] 실습 게시판 이용 안내','이 게시판은 API 실습용입니다. 공지 게시판에는 운영자만 글을 쓸 수 있습니다.','PUBLISHED','PUBLIC',30,0,0,'2026-09-10 09:00:00','2026-09-10 09:00:00','2026-09-10 09:00:00',NULL);
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (2,2,3,'JPA 연관관계 매핑 정리','@ManyToOne은 기본이 즉시 로딩이라 지연 로딩으로 바꿔 두는 편입니다. 예제와 함께 정리했습니다.','PUBLISHED','PUBLIC',12,1,0,'2026-09-15 20:00:00','2026-09-15 20:00:00','2026-09-15 20:00:00',NULL);
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (3,3,4,'인덱스는 언제 타나요?','WHERE 절에 함수를 씌웠더니 인덱스를 안 타는 것 같습니다. 이유가 뭘까요?','PUBLISHED','PUBLIC',8,0,0,'2026-09-18 14:30:00','2026-09-18 14:30:00','2026-09-18 14:30:00',NULL);
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (4,4,3,'주말 회고','이번 주에 배운 것을 정리했습니다.','PUBLISHED','PUBLIC',15,2,0,'2026-09-20 10:00:00','2026-09-20 10:00:00','2026-09-20 10:00:00',NULL);
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (5,4,4,'스터디원 구해요','스프링 스터디 같이 하실 분 구합니다.','PUBLISHED','PUBLIC',9,1,0,'2026-09-21 10:00:00','2026-09-21 10:00:00','2026-09-21 10:00:00',NULL);
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (6,4,3,'[팔로워 공개] 이직 고민','팔로워에게만 보이는 글입니다.','PUBLISHED','FOLLOWERS',4,1,0,'2026-09-22 10:00:00','2026-09-22 10:00:00','2026-09-26 09:00:00',NULL);
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (7,4,4,'[임시저장] 쓰다 만 글','아직 공개하지 않은 글입니다.','DRAFT','PUBLIC',0,0,0,NULL,'2026-09-22 15:00:00','2026-09-22 15:00:00',NULL);
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (8,4,3,'[삭제됨] 지운 글','작성자가 지운 글입니다.','PUBLISHED','PUBLIC',6,1,0,'2026-09-23 10:00:00','2026-09-23 10:00:00','2026-09-24 09:00:00','2026-09-24 09:00:00');
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (9,4,6,'차단 확인용 글','한차단 회원이 쓴 글입니다.','PUBLISHED','PUBLIC',7,1,0,'2026-09-23 18:00:00','2026-09-23 18:00:00','2026-09-23 18:00:00',NULL);
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (10,4,4,'[숨김] 운영자가 숨긴 글','신고로 숨겨진 글입니다.','HIDDEN','PUBLIC',20,1,0,'2026-09-24 10:00:00','2026-09-24 10:00:00','2026-09-25 18:00:00',NULL);
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (11,3,3,'트랜잭션은 어디에 거나요?','@Transactional을 컨트롤러에 붙여도 되나요?','PUBLISHED','PUBLIC',33,1,4,'2026-09-24 20:00:00','2026-09-24 20:00:00','2026-09-24 20:00:00',NULL);
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (12,4,3,'자유글 01','페이징 확인용 자유글 01입니다.','PUBLISHED','PUBLIC',1,1,0,'2026-09-25 09:00:00','2026-09-25 09:00:00','2026-09-25 09:00:00',NULL);
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (13,4,4,'자유글 02','페이징 확인용 자유글 02입니다.','PUBLISHED','PUBLIC',2,0,0,'2026-09-26 09:00:00','2026-09-26 09:00:00','2026-09-26 09:00:00',NULL);
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (14,4,3,'자유글 03','페이징 확인용 자유글 03입니다.','PUBLISHED','PUBLIC',3,1,0,'2026-09-27 09:00:00','2026-09-27 09:00:00','2026-09-27 09:00:00',NULL);
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (15,4,4,'자유글 04','페이징 확인용 자유글 04입니다.','PUBLISHED','PUBLIC',4,0,0,'2026-09-28 09:00:00','2026-09-28 09:00:00','2026-09-28 09:00:00',NULL);
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (16,4,3,'자유글 05','페이징 확인용 자유글 05입니다.','PUBLISHED','PUBLIC',5,0,0,'2026-09-29 09:00:00','2026-09-29 09:00:00','2026-09-29 09:00:00',NULL);
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (17,4,4,'자유글 06','페이징 확인용 자유글 06입니다.','PUBLISHED','PUBLIC',6,0,0,'2026-09-30 09:00:00','2026-09-30 09:00:00','2026-09-30 09:00:00',NULL);
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (18,4,3,'자유글 07','페이징 확인용 자유글 07입니다.','PUBLISHED','PUBLIC',7,0,0,'2026-10-01 09:00:00','2026-10-01 09:00:00','2026-10-01 09:00:00',NULL);
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (19,4,4,'자유글 08','페이징 확인용 자유글 08입니다.','PUBLISHED','PUBLIC',8,0,0,'2026-10-02 09:00:00','2026-10-02 09:00:00','2026-10-02 09:00:00',NULL);
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (20,4,3,'자유글 09','페이징 확인용 자유글 09입니다.','PUBLISHED','PUBLIC',9,0,0,'2026-10-03 09:00:00','2026-10-03 09:00:00','2026-10-03 09:00:00',NULL);
INSERT INTO `post` (`id`, `board_id`, `author_id`, `title`, `content`, `status`, `visibility`, `view_count`, `like_count`, `comment_count`, `published_at`, `created_at`, `updated_at`, `deleted_at`) VALUES (21,4,4,'자유글 10','페이징 확인용 자유글 10입니다.','PUBLISHED','PUBLIC',10,0,0,'2026-10-04 09:00:00','2026-10-04 09:00:00','2026-10-04 09:00:00',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='게시글 좋아요 — 한 회원이 한 글에 한 번';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `post_like` (`id`, `post_id`, `member_id`, `created_at`) VALUES (1,2,4,'2026-09-16 08:00:00');
INSERT INTO `post_like` (`id`, `post_id`, `member_id`, `created_at`) VALUES (2,4,4,'2026-09-20 12:00:00');
INSERT INTO `post_like` (`id`, `post_id`, `member_id`, `created_at`) VALUES (3,6,4,'2026-09-22 11:00:00');
INSERT INTO `post_like` (`id`, `post_id`, `member_id`, `created_at`) VALUES (4,8,4,'2026-09-23 11:00:00');
INSERT INTO `post_like` (`id`, `post_id`, `member_id`, `created_at`) VALUES (5,9,4,'2026-09-23 19:00:00');
INSERT INTO `post_like` (`id`, `post_id`, `member_id`, `created_at`) VALUES (6,11,4,'2026-09-25 08:00:00');
INSERT INTO `post_like` (`id`, `post_id`, `member_id`, `created_at`) VALUES (7,12,4,'2026-09-25 12:00:00');
INSERT INTO `post_like` (`id`, `post_id`, `member_id`, `created_at`) VALUES (8,14,4,'2026-09-27 12:00:00');
INSERT INTO `post_like` (`id`, `post_id`, `member_id`, `created_at`) VALUES (9,5,3,'2026-09-21 12:00:00');
INSERT INTO `post_like` (`id`, `post_id`, `member_id`, `created_at`) VALUES (10,10,3,'2026-09-24 11:00:00');
INSERT INTO `post_like` (`id`, `post_id`, `member_id`, `created_at`) VALUES (11,4,6,'2026-09-20 15:00:00');
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
INSERT INTO `post_tag` (`post_id`, `tag_id`) VALUES (4,7);
INSERT INTO `post_tag` (`post_id`, `tag_id`) VALUES (5,2);
INSERT INTO `post_tag` (`post_id`, `tag_id`) VALUES (11,2);
INSERT INTO `post_tag` (`post_id`, `tag_id`) VALUES (11,8);
INSERT INTO `post_tag` (`post_id`, `tag_id`) VALUES (12,1);
INSERT INTO `post_tag` (`post_id`, `tag_id`) VALUES (13,4);
INSERT INTO `post_tag` (`post_id`, `tag_id`) VALUES (14,1);
INSERT INTO `post_tag` (`post_id`, `tag_id`) VALUES (15,4);
INSERT INTO `post_tag` (`post_id`, `tag_id`) VALUES (16,1);
INSERT INTO `post_tag` (`post_id`, `tag_id`) VALUES (17,4);
INSERT INTO `post_tag` (`post_id`, `tag_id`) VALUES (18,1);
INSERT INTO `post_tag` (`post_id`, `tag_id`) VALUES (19,4);
INSERT INTO `post_tag` (`post_id`, `tag_id`) VALUES (20,1);
INSERT INTO `post_tag` (`post_id`, `tag_id`) VALUES (21,4);
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
