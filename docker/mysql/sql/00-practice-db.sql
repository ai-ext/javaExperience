-- 학습용 DB(practice)를 만들고 앱 계정에 권한을 준다.
-- 공식 mysql 이미지는 MYSQL_USER(community)에게 MYSQL_DATABASE(community) 권한만 준다 → 두 번째 DB는 여기서 직접 GRANT 해야 한다.
-- 이 스크립트는 엔트리포인트가 root로 실행한다(community DB·계정이 이미 만들어진 뒤).
CREATE DATABASE IF NOT EXISTS practice CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
GRANT ALL PRIVILEGES ON practice.* TO 'community'@'%';
