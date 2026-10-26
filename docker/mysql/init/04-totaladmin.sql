-- 사내 통합 어드민 실습용 빈 DB. 테이블은 실습하면서 직접 만든다.
CREATE DATABASE IF NOT EXISTS totaladmin CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
GRANT ALL PRIVILEGES ON totaladmin.* TO 'community'@'%';
