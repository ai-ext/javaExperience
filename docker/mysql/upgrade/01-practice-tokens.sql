-- 이미 DB를 띄워 둔 학습자용 — 학습용 DB(practice)에 8·9장 토큰 30개만 추가한다(있으면 건너뜀).
-- 새로 clone했거나 'docker compose down -v'로 처음부터 띄우면 init 덤프에 이미 들어 있어 필요 없다.
-- id는 넣지 않는다 — 이미 쓰던 DB에서 그 번호를 다른 토큰이 쓰고 있어도 빠지지 않게. 같은 토큰 문자열(UNIQUE uk_api_token)이 있으면 건너뛴다.
-- 실행: docker compose exec -T mysql mysql -uroot -proot practice < docker/mysql/upgrade/01-practice-tokens.sql
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p01',1,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p02',2,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p03',3,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p04',4,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p05',5,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p06',6,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p07',7,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p08',8,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p09',9,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p10',10,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p11',11,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p12',12,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p13',13,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p14',14,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p15',15,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p16',16,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p17',17,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p18',18,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p19',19,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p20',20,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p21',21,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p22',22,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p23',23,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p24',24,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p25',25,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p26',26,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p27',27,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p28',28,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p29',29,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
INSERT IGNORE INTO `api_token` (`token`, `member_id`, `expires_at`, `revoked_at`, `created_at`) VALUES ('tok-p30',30,'2099-12-31 23:59:59',NULL,'2026-09-01 00:00:00');
