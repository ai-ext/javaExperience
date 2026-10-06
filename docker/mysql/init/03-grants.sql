-- 앱 계정(community)에 practice DB 권한을 준다.
-- 공식 mysql 이미지는 MYSQL_USER에게 MYSQL_DATABASE(community) 권한만 주기 때문에 두 번째 DB는 직접 GRANT 해야 한다.
-- /docker-entrypoint-initdb.d 의 파일은 이름 순서로, root 권한으로, DB를 처음 만들 때 한 번만 실행된다.
GRANT ALL PRIVILEGES ON practice.* TO 'community'@'%';
