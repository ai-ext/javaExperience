# DB-10. 좋아요 조회를 EXPLAIN으로 개선하기

이 실습은 `GET /api/me/likes`에서 사용하는 정렬 조건을 작은 독립 데이터베이스로 살펴본다. 앱 전체의 권한 JOIN을 재현하는 실습은 아니며, `post_like`의 회원별 탐색과 최신순 정렬에 초점을 둔다. 기존 `practice` 데이터와 채점값은 사용하거나 변경하지 않는다.

이번 단계의 첫 목표는 `(member_id, created_at, id)` 열 순서를 설계하고 같은 SELECT의 전후 계획·결과 ID 순서를 비교하는 것이다. 인덱스의 `INVISIBLE`·`VISIBLE`·`DROP` 생명주기는 [DB-11](DB-11-index-lifecycle.md)에서 별도 실습한다.

## 1. 격리된 MySQL 8.4 준비

저장소 루트에서 실행한다.

```bash
tools/db-perf-fixture.sh up
```

스크립트는 MySQL 8.4 컨테이너 하나를 `127.0.0.1:13319`에 띄우고 `javaexperience_perf` DB에 기본 500,000개의 좋아요 행을 만든다. 게시판·회원·게시글·댓글·태그 테이블도 함께 생성하며 FK와 좋아요 중복 방지 제약을 둔다. `compose.yaml`, `mysql-data`, `practice`의 데이터와 설정을 변경하지 않는다. 컨테이너가 이미 실행 중이면 `up`은 데이터를 다시 만들지 않는다.

재실행할 때는 `SHOW INDEX FROM post_like;`로 현재 인덱스부터 확인한다. 앞선 실습에서 `ix_post_like_member_created`를 이미 만들었다면 `CREATE INDEX`를 다시 실행하지 않는다. 변경 전 계획을 새로 관찰하려면 [DB-11의 복원 절차](DB-11-index-lifecycle.md)를 먼저 읽는다.

```bash
# 선택 환경변수
PERF_DB_PORT=13319 PERF_ROW_COUNT=500000 tools/db-perf-fixture.sh up

# mysql 클라이언트로 접속: 암호는 기본 perf-local-only
mysql -h 127.0.0.1 -P 13319 -u root -p javaexperience_perf
```

회원 12에 좋아요 행의 2%를 집중시키고 나머지를 다른 회원에게 분배한다. `UNIQUE(member_id, post_id)`가 중복 좋아요를 막는다. 실제 실행 환경의 쿼리 계획과 속도는 MySQL 버전·통계·하드웨어에 따라 달라지므로 아래 결과를 정답 출력으로 외우지 않는다. 테이블·FK를 직접 확인하고 게시판 목록 쿼리까지 확장하려면 [DB-14 실제 스키마부터 느린 쿼리까지](db-14-live-schema-to-slow-query.md)로 이어 간다.

## 2. API에서 SQL 조건을 찾기

9-2에서 다루는 API는 `GET /api/me/likes?size=10`이다. DB가 정렬하는 핵심 조건은 다음과 같다. API는 다음 페이지 유무를 확인하려고 `size + 1`행을 읽는다.

```sql
SELECT l.id, l.post_id, l.created_at
FROM post_like AS l
WHERE l.member_id = 12
ORDER BY l.created_at DESC, l.id DESC
LIMIT 11;
```

응답의 좋아요 시각과 커서는 `(created_at, id)`다. 먼저 같은 쿼리의 결과 행과 기본 실행 계획을 기록한다.

```sql
SELECT COUNT(*) FROM post_like WHERE member_id = 12;
SELECT id, post_id, created_at
FROM post_like
WHERE member_id = 12
ORDER BY created_at DESC, id DESC
LIMIT 11;

EXPLAIN
SELECT l.id, l.post_id, l.created_at
FROM post_like AS l
WHERE l.member_id = 12
ORDER BY l.created_at DESC, l.id DESC
LIMIT 11;

EXPLAIN ANALYZE
SELECT l.id, l.post_id, l.created_at
FROM post_like AS l
WHERE l.member_id = 12
ORDER BY l.created_at DESC, l.id DESC
LIMIT 11;
```

`EXPLAIN`의 `rows`는 추정치다. `EXPLAIN ANALYZE`는 SELECT를 실제로 실행해 actual rows, loops, timing을 보여 준다. 매번 쿼리가 실행되므로 쓰기 SQL이나 운영 데이터에 이 실습 명령을 붙이지 않는다.

## 3. 인덱스 생성·숨김·복원·삭제

각 단계에서 계획을 저장하고, 좋아요 결과의 `id`와 순서가 같은지 확인한다.

```sql
-- 인덱스 추가
CREATE INDEX ix_post_like_member_created
    ON post_like (member_id, created_at, id);
ANALYZE TABLE post_like;

EXPLAIN
SELECT l.id, l.post_id, l.created_at
FROM post_like AS l
WHERE l.member_id = 12
ORDER BY l.created_at DESC, l.id DESC
LIMIT 11;

EXPLAIN ANALYZE
SELECT l.id, l.post_id, l.created_at
FROM post_like AS l
WHERE l.member_id = 12
ORDER BY l.created_at DESC, l.id DESC
LIMIT 11;

-- 옵티마이저에서만 잠시 제외하고 비교한다. 인덱스 자체는 유지된다.
ALTER TABLE post_like
    ALTER INDEX ix_post_like_member_created INVISIBLE;
EXPLAIN
SELECT l.id, l.post_id, l.created_at
FROM post_like AS l
WHERE l.member_id = 12
ORDER BY l.created_at DESC, l.id DESC
LIMIT 11;

-- 실험 후 복원
ALTER TABLE post_like
    ALTER INDEX ix_post_like_member_created VISIBLE;

-- 마지막에 인덱스를 제거하고 기본 계획과 비교
DROP INDEX ix_post_like_member_created ON post_like;
ANALYZE TABLE post_like;
```

기록할 것은 `key`, `rows`, 정렬 처리 표시, actual rows/loops다. 같은 조건과 데이터에서 응답 ID 순서가 유지되는지 먼저 보고, 계획의 행 처리 차이가 관측된 경우에만 개선 근거로 적는다. `EXPLAIN ANALYZE`의 시간 한 번만으로 성능 향상을 단정하지 않는다.

현재 FK·UNIQUE fixture를 10만 행으로 실행한 로컬 MySQL 8.4 관찰에서는 회원 12의 좋아요가 2,000행이었다. 인덱스 전에는 `uq_post_like_member_post`로 회원 행을 찾은 뒤 `Using filesort`가 보였고, 복합 인덱스 후에는 `ix_post_like_member_created`의 `Backward index scan`으로 바뀌었다. 두 실행의 첫 5개 `(post_id, created_at)`과 순서는 같았다. 자동 증가 `id`는 생성 순서에 따라 달라질 수 있으므로 각자의 실행에서 전후 ID를 직접 비교한다. 이는 단일 실행의 관찰이며 다른 장비나 기본 50만 행에서 동일한 계획·시간을 보장하지 않는다.

## 되돌리기와 다시 시작

- 인덱스를 `INVISIBLE`로 남겼다면 `ALTER TABLE post_like ALTER INDEX ix_post_like_member_created VISIBLE;`로 복원한다.
- 인덱스가 없어진 뒤 다시 비교하려면 위 `CREATE INDEX` 문부터 실행한다.
- 처음 데이터와 기본 인덱스 집합으로 되돌리는 가장 간단한 방법은 `tools/db-perf-fixture.sh reset`이다. 이 명령은 이 실습 전용 컨테이너만 제거하고 새로 만든다.
- 실습이 끝나면 `tools/db-perf-fixture.sh down`으로 전용 컨테이너를 제거한다. 이 컨테이너에는 호스트 디렉터리나 compose named volume을 연결하지 않았다.

전용 fixture는 `9-2-index-explain.md`의 전체 API/JPA/MyBatis JOIN 쿼리와 분리된 측정용 테이블이다. 실제 앱 쿼리의 최종 계획은 9-2의 `post_like`와 `post` JOIN에서도 별도로 확인한다.
