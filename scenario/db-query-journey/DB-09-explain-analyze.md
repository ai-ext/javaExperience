# DB-09. 추정 계획과 실제 실행 비교하기

> 이번 시나리오: DB-08에서 세운 가설을 `EXPLAIN ANALYZE`로 확인한다. 같은 `post_like` 읽기 SELECT를 격리된 실습 DB에서 실제 실행하고, 추정과 실측을 구분해 기록한다.

## 1. 먼저 실행 범위를 확인

“DB는 예상만큼 읽었을까요?” 같은 회원 12의 좋아요 목록 `GET /api/me/likes?size=10`을 위한 핵심 SELECT를 계속 쓴다. 이 실습은 [DB-10 전용 fixture](DB-10-performance-fixture.md)의 MySQL 8.4 `javaexperience_perf`에서 수행한다. `127.0.0.1:13319`에 연결했고 쓰기문이 아닌 SELECT인지 확인한다. 이 페이지의 HTML은 SQL을 자동 실행하지 않는다. 비용을 알 수 없는 운영 쿼리에 무심코 붙이지 않는다.

## 2. DB 클라이언트에서 직접 실행

```sql
EXPLAIN ANALYZE
SELECT l.id, l.post_id, l.created_at
FROM post_like AS l
WHERE l.member_id = 12
ORDER BY l.created_at DESC, l.id DESC
LIMIT 11;
```

이 명령은 SELECT를 **실제로 실행**하고 MySQL 8.4의 TREE 형식 실행 계획을 돌려준다. 일반 SELECT의 `id, post_id, created_at` 결과 행을 보여 주는 명령이 아니다. 결과 ID와 순서를 비교하려면 같은 SELECT를 따로 실행해 기록한다.

## 3. 추정과 실측을 분리해 읽기

DB-08의 기본 `EXPLAIN`에서는 `type`, `possible_keys`, `key`, 예상 `rows`, `Extra`를 기록했다. `EXPLAIN ANALYZE` 트리의 각 반복자(iterator)에서는 예상 `rows`와 `actual rows`, `loops`, `actual time`을 읽는다. `actual rows`는 해당 노드가 한 번의 loop에서 반환한 행 수를 뜻하므로 `loops`와 떼어 전체 작업량으로 단정하지 않는다. `actual time`도 그 노드의 관측 시간이며 한 번의 측정이 API 전체 지연을 증명하지 않는다. 출력은 실행 환경과 통계에 따라 달라져 이 문서에는 정답 숫자를 넣지 않는다.

## 4. 다음 실험을 위한 기준 기록

현재 계획과 실제 트리, 별도 SELECT의 반환 ID·순서를 보관한다. DB-10의 복합 인덱스 전후를 비교할 때 **같은 DB·데이터·회원·정렬·LIMIT**를 유지한다. 가능하면 여러 번 관찰하고 캐시·워밍업·데이터 크기의 차이를 기록한다. 한 번의 시간 차이나 `Using filesort` 표시 하나만으로 개선이라고 결론 내리지 않는다.

## 완료 기준

- 격리된 DB와 읽기 전용 SELECT를 확인했다.
- `EXPLAIN ANALYZE`를 DB 클라이언트에서 직접 실행하고 TREE 출력을 기록했다.
- 추정 `rows`와 노드별 `actual rows`·`loops`·`actual time`을 구분했다.
- 같은 SELECT의 결과 ID·순서를 별도로 확인했고 다음 비교에서 고정할 조건을 적었다.
