# DB-08. 좋아요 목록의 실행 계획을 읽고 가설 세우기

> 이번 시나리오: `GET /api/me/likes?size=10`의 핵심 조회가 어디에서 비효율적일지 **EXPLAIN 계획을 읽고 한 문장으로 가설을 쓴다.** 실제 성능과 인덱스 전후 비교는 다음 실습으로 나눈다.

## 1. 상황과 범위

“내가 좋아요한 글 목록이 느린 것 같아요. DB가 어디를 읽을지 먼저 알고 싶어요.”

회원 12의 좋아요를 최신순으로 조회한다. 여기서는 `post_like` 테이블의 회원별 탐색과 정렬에만 초점을 둔다. 이 SELECT는 전체 API의 권한 JOIN이나 HTTP 응답을 재현하지 않는다. 현재 루트 앱의 API 구현·실행 여부도 이 페이지가 보증하지 않는다.

## 2. 격리된 데이터 준비

저장소 루트에서 `tools/db-perf-fixture.sh up`을 실행한다. 전용 MySQL 8.4 컨테이너는 `127.0.0.1:13319`, DB 이름은 `javaexperience_perf`다. 기본 합성 `post_like` 데이터는 500,000행이며 기존 `practice` DB와 분리된다. **이미 컨테이너가 실행 중이면 `up`은 데이터를 다시 생성하지 않는다.** [DB-10 fixture 원문](DB-10-performance-fixture.md)에서 연결·스키마와 정리 절차를 확인한다.

```bash
tools/db-perf-fixture.sh up
```

실행한 적이 없다면 결과값은 아직 모른다. 연결한 DB가 `javaexperience_perf`인지 확인한 후 아래 읽기 전용 SQL을 실행한다.

## 3. API 요구를 핵심 SELECT로 옮기기

`size=10`인 페이지의 `hasNext`를 판별할 수 있도록 `size + 1`, 즉 11행을 읽는다. 정렬 키는 좋아요 생성 시각과 ID다.

```sql
SELECT l.id, l.post_id, l.created_at
FROM post_like AS l
WHERE l.member_id = 12
ORDER BY l.created_at DESC, l.id DESC
LIMIT 11;
```

## 4. 같은 SELECT의 EXPLAIN

```sql
EXPLAIN
SELECT l.id, l.post_id, l.created_at
FROM post_like AS l
WHERE l.member_id = 12
ORDER BY l.created_at DESC, l.id DESC
LIMIT 11;
```

`EXPLAIN`은 옵티마이저의 계획과 추정치를 보여 준다. SELECT 결과 행이나 실제 걸린 시간은 아니다. 계획의 `type`, `possible_keys`, `key`, `rows`, `Extra`를 자신의 결과로 채운다. `possible_keys`는 후보, `key`는 실제 선택된 인덱스다. `rows`는 예상 행 수이며 실제 읽은 행 수가 아니다. `Extra`의 `Using filesort`는 별도 정렬 단계의 신호로 읽되, 디스크 정렬이나 API 지연이 확정됐다고 단정하지 않는다.

## 5. 한 문장 가설

내 계획에서 본 사실, 의심하는 이유, 다음에 비교할 것을 각각 적는다. “회원 조건으로 찾은 뒤 최신순 정렬에 추가 작업이 필요할 수 있다”처럼 실제 계획에 근거한 한 문장으로 좁힌다. `EXPLAIN ANALYZE`는 SELECT를 **실제로 실행**하므로 다음 단계에서 별도로 다룬다. 인덱스 생성과 복원도 전용 fixture에서만 수행한다. [9-2 전체 API 실습](../ch9-schema-change/9-2-index-explain.md)의 `FORCE INDEX` 경로와 인덱스 `INVISIBLE` 실험을 섞지 않는다.

## 완료 기준

- 격리된 `javaexperience_perf` 연결 대상을 확인했다.
- 위 SELECT와 같은 조건의 EXPLAIN 결과에서 `type`, `possible_keys`, `key`, `rows`, `Extra`를 기록했다.
- 관측한 계획을 바탕으로 병목 가설과 다음 비교 방법을 한 문장씩 적었다.
- 추정 계획과 실제 실행 측정을 구분해 설명할 수 있다.
