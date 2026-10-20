# DB-11. 인덱스를 숨기고 복원하고 제거하기

> 이번 시나리오: DB-10에서 설계한 `ix_post_like_member_created`가 **보이는 상태와 숨긴 상태**에서 실행 계획에 어떤 차이를 만드는지 격리 fixture에서 확인한다. 마지막에는 가시성을 되돌리고, 필요하면 이 실습용 인덱스를 제거한다. 기본 `practice` DB는 사용하지 않는다.

## 1. 현재 DB와 인덱스 확인

MySQL 8.4의 `127.0.0.1:13319`에 연결해 `javaexperience_perf` DB인지 먼저 확인한다. `post_like`의 인덱스 목록을 보고 `ix_post_like_member_created`가 이미 존재하는지, 보이는지 확인한다. DB-10을 마쳤다면 이미 존재할 수 있다. `tools/db-perf-fixture.sh up`은 실행 중인 컨테이너를 새로 만들지 않는다.

```sql
SELECT DATABASE();
SHOW INDEX FROM post_like;
```

## 2. 없다면 전용 인덱스 만들기

DB-10에서 인덱스를 만들지 않은 경우에만 다음 문장을 실행한다. 같은 이름이 이미 있으면 다시 만들지 않는다. 이 변경은 전용 fixture의 `post_like`에만 적용한다.

```sql
CREATE INDEX ix_post_like_member_created
    ON post_like (member_id, created_at, id);
ANALYZE TABLE post_like;
```

`ANALYZE TABLE`은 테이블 통계를 갱신한다. 읽기 SELECT를 실제 실행하는 `EXPLAIN ANALYZE`와 다르다.

## 3. 현재 보이는 인덱스의 계획 기록

같은 회원 12, 최신순, `LIMIT 11`을 계속 사용한다. 먼저 `SHOW INDEX`의 상태와 다음 `EXPLAIN`의 `key`, `rows`, `Extra`를 기록한다. 인덱스가 보인다고 무조건 선택되는 것은 아니다.

```sql
EXPLAIN
SELECT l.id, l.post_id, l.created_at
FROM post_like AS l
WHERE l.member_id = 12
ORDER BY l.created_at DESC, l.id DESC
LIMIT 11;
```

## 4. 옵티마이저에서 잠시 숨기기

MySQL 8.4의 보조 인덱스 `ix_post_like_member_created`를 `INVISIBLE`로 바꾼다. 인덱스 자체는 유지되지만 기본적으로 옵티마이저의 선택 대상에서 빠진다. Primary key에는 이 실습을 적용하지 않는다.

```sql
ALTER TABLE post_like
    ALTER INDEX ix_post_like_member_created INVISIBLE;
```

이 상태에서 `SHOW INDEX FROM post_like;`와 **같은 EXPLAIN**을 다시 실행해 현재 key·rows·Extra를 적는다. 계획이 달라지는지는 직접 관찰해야 한다. [9-2의 전체 API 실습](../ch9-schema-change/9-2-index-explain.md)은 `FORCE INDEX`를 사용하므로 그 API를 `INVISIBLE` 상태에서 호출해 비교하지 않는다. 이 DB-11 실습은 FORCE INDEX 없는 전용 fixture 쿼리다.

## 5. 반드시 가시성 복원

비교가 끝나면 다음 SQL을 실행하고 `SHOW INDEX` 및 EXPLAIN으로 복원 여부를 확인한다. 페이지를 떠나기 전에 이 상태를 점검한다.

```sql
ALTER TABLE post_like
    ALTER INDEX ix_post_like_member_created VISIBLE;
```

## 6. 실습용 인덱스를 제거하려면

원래 fixture 인덱스 집합으로 돌릴 때만 다음 SQL을 실행한다. `VISIBLE`로 복원한 뒤 이 전용 인덱스를 제거한다. 기본 FK·UNIQUE 인덱스는 지우지 않는다. 다시 비교하려면 2단계부터 생성한다.

```sql
DROP INDEX ix_post_like_member_created ON post_like;
ANALYZE TABLE post_like;
```

마지막으로 `SHOW INDEX FROM post_like;`와 같은 EXPLAIN을 실행해 현재 상태를 기록한다. `DROP INDEX`는 전용 fixture에서도 스키마 변경이다. 정말 제거할 때만 복사해 실행한다.

## 완료 기준

- 연결 DB와 인덱스 존재·가시성을 확인했다.
- VISIBLE → INVISIBLE → VISIBLE 각 상태의 계획을 같은 SELECT로 기록했다.
- `ANALYZE TABLE`과 `EXPLAIN ANALYZE`의 차이를 설명할 수 있다.
- 인덱스를 숨긴 채 실습을 끝내지 않았고, 제거를 선택했다면 전용 인덱스만 지웠다.
