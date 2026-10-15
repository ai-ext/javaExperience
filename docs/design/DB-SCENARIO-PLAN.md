# DB 시나리오 확장 계획

> 상태: DB-01~07·12~14의 원문을 작성했고, DB-08~11은 9-2/R05와 격리 fixture에 연결했다. DB-14는 실제 스키마 조사와 게시판 목록 쿼리 실습을 추가했다. 새 화면의 시안 대조와 실제 API 검증은 진행 중이다.
> 대상: javaExperience의 API·DB 학습 경로. 기존 `practice` 정답 데이터와 채점값은 유지한다.

## 목표

학습자가 API 요구사항을 읽고 필요한 데이터와 쿼리를 스스로 떠올린 뒤, SQL을 작성하고 실제 결과와 실행 계획을 확인하고, 인덱스 또는 쿼리를 바꿔 같은 API의 결과를 유지하면서 비용을 줄이는 연습을 한다. SQL에서 끝내지 않고 같은 동작을 JPA, MyBatis, QueryDSL 코드에서 어디에 두는지 연결한다.

각 시나리오는 이 사슬을 이어 간다.

```text
API 계약 → 응답 필드 → 테이블·관계 → 필터·정렬·조인 선택
         → SQL 작성 → 실제 행·응답 확인 → 실행 계획 읽기
         → 인덱스/쿼리 변경 → 같은 API 재실행 → Java 접근 방식 비교
```

`practice/MISSIONS.md`의 회원·게시글·반응 데이터와 기대값은 기능 정확성 연습에 계속 사용한다. 성능 차이를 보여 주기 위해 기존 행이나 기대값을 바꾸지 않는다.

## 현재 자료와 확장 지점

이미 있는 자료를 먼저 재사용한다.

| 기존 자료 | 이미 다루는 내용 | 새 경로에서 연결할 내용 |
|---|---|---|
| `practice/MISSIONS.md` M1·M3·M6·M9·M10 | 목록·좋아요·인기글·활동 집계·쿼리 수·인덱스 전후 | 각 API 계약에서 테이블과 SQL을 찾아가는 단계, 관찰값을 시나리오 간 공유 |
| `scenario/ch8-query-deep/8-1`~`8-4` | SQL 우선 집계, 인기글, 관계 추천, 동적 검색 | JOIN/서브쿼리 선택 근거, 실제 응답과 계획 대조, 문제 난도 순서 |
| `scenario/ch9-schema-change/9-2-index-explain.md` | `GET /api/me/likes` 계획과 복합 인덱스 전후 | 추정 계획과 실제 실행 측정, 인덱스 비활성/복원/삭제 실습, 시각적 설명 |
| `scenario/labs/l12`~`l14` | 파생 메서드, 선언 쿼리·MyBatis SQL, QueryDSL | 앞의 SQL 미션과 같은 API·필터·응답임을 연결하고 각 구현이 생성/실행하는 SQL 확인 |
| `docs/knowledge/R04`·`R05` | SQL CRUD/JOIN/집계/서브쿼리, 인덱스와 EXPLAIN | 찾아보기 문서에서 실제 미션의 필요한 순간으로 연결 |

현재 자료의 핵심 공백은 개념 자체의 부재가 아니라 학습자의 작업 순서가 화면마다 끊긴다는 점이다. 특히 `EXPLAIN` 예상값, `ANALYZE TABLE` 통계 갱신, 실제 쿼리 실행 시간 측정이 섞여 보일 수 있다. `ANALYZE TABLE`은 통계 갱신이고 `EXPLAIN ANALYZE`는 SELECT를 실제 실행해 관측값을 얻으므로 각각의 역할을 구분한다.

## 커리큘럼

각 단계는 앞 단계와 같은 게시판 API·테이블을 사용한다. 완료 기준의 수치와 응답 필드는 기존 정답 데이터 또는 별도 fixture에서 실행해 확정하며, 계획 단계에서 검증되지 않은 수치를 지어내지 않는다.

### 단계별 작업 상태

`기획 → 원문/HTML → 실제 imagegen 시안 → 화면 구현 → DB 실행·브라우저 대조`를 서로 다른 완료 상태로 기록한다. 아래의 `기획`은 요구사항을 나열했다는 뜻이며 실습 구현 완료가 아니다. 한 단계에 기존 자료가 있어도 새 경로에서 연결·검증하기 전에는 `원문/HTML`을 완료로 표시하지 않는다.

| 단계 | 기획 | 원문/HTML | 이미지 시안 | 화면 구현 | DB·브라우저 검증 |
|---|---|---|---|---|---|
| DB-01 API 응답→테이블 | 완료 | 원문·HTML 생성 | 텍스트 없는 시안 1장·사실 대조 | 4단 흐름·SQL/행 비교 구현 | 데스크톱·360px 표시 확인, 실제 API 미확인·시안 대조 미완료 |
| DB-02 SELECT·WHERE·커서 | 완료 | 원문·HTML 생성 | 텍스트 없는 imagegen 시안 1장·오류 검토 | 4단 커서 흐름·페이지 전환 구현 | practice seed 대조, 데스크톱·360px 표시와 전환 확인; 실제 API 미확인 |
| DB-03 상세 JOIN | 완료 | 원문·HTML 생성 | 텍스트 없는 imagegen 시안 1장 | 4단 JOIN 흐름·접힌 SQL 구현 | seed 대조·데스크톱 토글 확인, 모바일·실제 API 미확인 |
| DB-04 태그 JOIN·EXISTS | 완료 | 원문·HTML 생성 | 텍스트 없는 시안 1장 | 관계 행·중복·EXISTS 첫 화면 구현 | 데스크톱·360px 배치 확인, 실제 SQL 미확인 |
| DB-05 집계·JOIN 곱셈 | 완료 | 원문·HTML 생성 | 텍스트 없는 시안 1장 | 2×3 행 곱셈 첫 화면 구현 | 데스크톱·360px 배치 확인, 실제 SQL 미확인 |
| DB-06 포함·제외 서브쿼리 | 완료 | 원문·HTML 생성 | 텍스트 없는 imagegen 시안 1장 | 좋아요/북마크 행 비교·SQL 접기 구현 | 스키마 대조·데스크톱/360px 표시 확인, 실제 SQL 미확인 |
| DB-07 JPA·MyBatis·QueryDSL | 완료 | 원문·HTML 생성 | 텍스트 없는 시안 1장 | 5방식 분기·역할별 코드 접기 구현 | 데스크톱·360px 배치 확인, 실행 코드 미확인 |
| DB-08 EXPLAIN 가설 | 완료 | 9-2/R05 보강·HTML 생성 | 초안 1장·오류 검토 | 3상태 비교 교구 구현 | 데스크톱 상태·입력과 360px 배치 확인, 실제 API 미확인 |
| DB-09 EXPLAIN ANALYZE 실측 | 완료 | 9-2/R05 보강·HTML 생성 | DB-08과 공통 초안 | 추정/실측 탭 구현 | 전용 fixture 10만 행 SQL 확인, 실제 API 미확인 |
| DB-10 복합 인덱스 | 완료 | 9-2 보강·HTML 생성, 전용 fixture 실습 추가 | DB-08과 공통 초안 | 3상태 비교 교구 구현 | 전용 fixture 10만 행 계획·결과 확인, 실제 API 미확인 |
| DB-11 추가·가시성·삭제 | 완료 | R05 독립 실습·전용 fixture 추가, 게시판 연속 실습 대기 | DB-08과 공통 초안 | 3상태 비교 교구 구현 | 전용 fixture CREATE/INVISIBLE/VISIBLE/DROP 확인, 360px 배치 확인, 실제 API 미확인 |
| DB-12 JOIN·서브쿼리 계획 | 완료 | 원문·HTML 생성 | 텍스트 없는 시안 1장 | JOIN/EXISTS 대조·동일 결과 게이트·4단 흐름 구현 | 데스크톱·360px 배치 확인, 실제 EXPLAIN 미확인 |
| DB-13 전체 추적·N+1 | 완료 | 원문·HTML 생성 | 텍스트 없는 시안 1장 | 5단 경로·쿼리 수 대비 구현 | 데스크톱·360px 배치 확인, 실제 API 계측 대기 |
| DB-14 실제 스키마→느린 쿼리 | 완료 | 원문·HTML 생성 | imagegen 시안 2장 | 관계·요구사항·DB 탐색 3열과 계획 비교 구현 | 10만·50만 좋아요, FK·실행 계획·동일 결과 확인; 데스크톱·360px 배치 확인, 서버 API 미구현·캡처 대조 대기 |

### 입문 — API에서 쿼리를 찾아낸다

#### DB-01. `GET` 응답에서 테이블 후보 찾기

- 시작 API: 게시판 글 목록 `GET /api/boards/{slug}/posts?size=&cursor=`.
- 학습 동작: 응답 필드(`title`, `authorNickname`, `likeCount`, `tags`, `publishedAt`)마다 소유 테이블과 필요한 관계를 표시한다.
- 스스로 정할 것: WHERE 조건, ORDER BY, 페이지 기준, 목록에 본문이 필요한지.
- 결과물: 테이블 관계 카드와 첫 SQL 초안. 실행 전에 어떤 행을 기대하는지 예측한다.
- 연결: 기존 M1, 시나리오 2장 목록 API.

#### DB-02. 기본 SELECT·WHERE·ORDER BY·커서

- 같은 목록 API에 `board.slug`, `status`, 삭제 여부, 정렬 키를 순서대로 추가한다.
- `LIMIT size + 1`과 `(published_at, id)` 커서 조건을 작은 결과 집합에서 직접 확인한다.
- offset 페이지와 cursor 페이지가 데이터 삽입 때 어떻게 달라지는지 같은 데이터로 비교한다.
- 정답 확인은 결과 행 순서와 다음 페이지 중복·누락 여부로 한다.

#### DB-03. 상세 조회의 JOIN과 반환 범위

- 시작 API: `GET /api/posts/{id}`.
- 글·작성자·게시판·좋아요 여부처럼 응답에 필요한 값을 테이블 관계에 연결한다.
- `JOIN`과 `LEFT JOIN`을 선택하는 이유, nullable 관계가 결과를 없애는 문제, DTO projection을 익힌다.
- 목록과 상세가 같은 엔티티를 조회해도 SQL 모양이 다른 이유를 비교한다.

### 중급 — 관계와 집계를 정확하게 만든다

#### DB-04. 태그 조건: JOIN과 EXISTS

- 시작 API: 태그가 포함된 글 검색.
- `post → post_tag → tag` 관계를 따라가며 `JOIN` 버전과 `EXISTS` 버전을 작성한다.
- 태그가 여러 개일 때 글 행이 중복되는 현상을 재현하고 `DISTINCT` 또는 `EXISTS`가 결과에 미치는 영향을 확인한다.
- 완료 기준은 같은 필터에서 같은 게시글 ID 집합과 정렬을 반환하는 것이다.

#### DB-05. 여러 테이블 집계와 JOIN 곱셈

- 시작 API: `GET /api/posts/popular?days=7` 또는 회원별 활동 요약.
- 글·좋아요·댓글을 한꺼번에 JOIN했을 때 각 1:N 관계가 곱해져 count/sum이 부풀어 오르는 예를 만든다.
- 독립 집계 서브쿼리, 미리 집계한 파생 테이블, `COUNT(DISTINCT ...)`의 차이를 비교한다.
- `LEFT JOIN`으로 활동 없는 회원이 0으로 남는지 확인한다.
- 연결: 기존 M6·M9-1, 시나리오 8-1·8-2.

#### DB-06. 포함·제외 조건: IN, EXISTS, NOT EXISTS

- 시작 API: 내가 좋아요한 글, 아직 팔로우하지 않은 회원 추천, 좋아요는 있지만 북마크는 없는 글.
- `IN`/`EXISTS`, `NOT IN`/`NOT EXISTS`를 nullable 데이터가 있을 때 비교한다.
- 상관 서브쿼리에서 바깥 행의 값이 안쪽 조회에 어떻게 전달되는지 행 단위로 따라간다.
- 결과 집합뿐 아니라 중복과 NULL 동작을 설명해야 통과한다.

#### DB-07. 같은 API의 SQL을 JPA·MyBatis·QueryDSL로 옮기기

- DB-01~06 중 하나의 API 계약과 SQL을 고정해 각 구현에서 같은 요청·응답을 만든다.
- 순서: 파생 메서드로 가능한 범위 → JPQL `@Query` → native query → MyBatis XML SQL → QueryDSL 동적 조건.
- 각 구현은 Controller·Service·DTO·Repository/Mapper 위치를 표시한다. 응답 모양과 정렬·NULL·페이징 조건은 그대로 둔다.
- SQL 로그 또는 테스트로 실제 실행문을 확인하고, ORM/DSL 코드가 SQL을 대신 없애는 것이 아님을 확인한다.
- 연결: L12·L13·L14. 기존 lab의 같은 데이터와 API 경로를 사용하고 새롭고 평행한 예제를 불필요하게 만들지 않는다.

### 고급 — 실행 계획을 읽고 개선을 검증한다

#### DB-08. `EXPLAIN`으로 느린 지점 가설 세우기

- 기존 `GET /api/me/likes` JOIN SQL 또는 DB-01 목록 SQL을 시작점으로 삼는다.
- `type`/접근 방식, `key`, 예상 `rows`, `filtered`, `Extra`, 조인 순서를 한 항목씩 읽는다.
- 각 값이 추정치라는 점과 `Using filesort`가 항상 장애라는 뜻은 아니라는 점을 실제 쿼리 규모와 함께 해석한다.
- 첫 시도에서는 쿼리나 인덱스를 바꾸지 않고 계획에서 병목 가설을 기록한다.

#### DB-09. `EXPLAIN ANALYZE`로 추정과 실제 비교

- 읽기 전용 SELECT에 `EXPLAIN ANALYZE`를 실행하고 `actual time`, `actual rows`, `loops`와 추정 행 수를 비교한다.
- 쿼리가 실제 실행된다는 것을 화면에서 분명히 알리고, 쓰기문이나 비용이 큰 운영 쿼리에 적용하지 않는다.
- 인덱스가 바뀌기 전·후 같은 데이터·파라미터·응답을 사용해 측정한다.
- 캐시, 워밍업, 데이터 크기 때문에 작은 차이를 성능 결론으로 과장하지 않는다.

#### DB-10. 느린 쿼리 개선: 인덱스 열 순서 설계

- `GET /api/me/likes`의 `WHERE member_id = ? ORDER BY created_at DESC, id DESC LIMIT ?`를 사용한다.
- 단일 인덱스와 `(member_id, created_at, id)` 복합 인덱스의 왼쪽 prefix와 정렬 지원 여부를 행 흐름으로 설명한다.
- 계획의 `key`, 정렬 처리, 실제 읽은 행 수를 전후 비교한다.
- 완료 조건: 응답 ID·순서는 그대로이고 계획/실제 작업량에서 개선 근거가 관찰된다. 데이터가 작아 차이가 안 보이면 성능 향상을 주장하지 않고 이를 기록한다.
- 연결: 기존 M3과 `scenario/ch9-schema-change/9-2-index-explain.md`를 정식 실습 화면으로 확장한다.

#### DB-11. 인덱스 추가·가시성 전환·삭제

- 실험 DB에서 `CREATE INDEX`로 인덱스를 추가하고 같은 SELECT의 계획을 확인한다.
- MySQL 8.4에서 지원되는 경우 보조 인덱스를 `INVISIBLE`로 전환해 옵티마이저가 사용할 때와 사용하지 않을 때를 비교하고 `VISIBLE`로 복원한다. Primary key에는 이 방법을 적용하지 않는다.
- 마지막에는 실습용 인덱스를 `DROP INDEX`로 제거하고 원래 계획으로 돌아오는지 확인한다.
- 단계마다 현재 DB, 테이블, 인덱스 정의, 되돌리기 SQL을 보여 준다. 기본 `practice` 정답 데이터의 스키마·seed를 파괴하는 작업으로 연결하지 않는다.
- `ANALYZE TABLE`은 통계 갱신 단계로 별도 표기하고 `EXPLAIN ANALYZE`와 혼동하지 않는다.

#### DB-12. JOIN·서브쿼리 선택을 계획까지 비교

- DB-04~06의 같은 논리 조건을 JOIN, EXISTS/NOT EXISTS, 집계 서브쿼리로 각각 작성한다.
- 동일 응답값을 먼저 검증한 다음 `EXPLAIN`/`EXPLAIN ANALYZE`의 조인 순서, 반복 실행(`loops`), 실제 행 수를 비교한다.
- 문법 선호가 아니라 결과의 정확성, 데이터 분포, 인덱스, 측정값으로 선택 이유를 설명한다.

#### DB-13. API부터 DB까지 전체 추적과 N+1 진단

- 시작 API: 목록 응답의 작성자·태그 또는 좋아요 수.
- 브라우저 요청 → Controller → Service → Repository/Mapper → 실제 SQL → 실행 계획 → MySQL 행 → 응답 필드를 한 화면에서 선택해 따라간다.
- SQL 실행 횟수를 계측해 N+1을 재현하고 DTO projection, batch fetch, fetch join의 장단점을 비교한다.
- 페이징과 다중 컬렉션 fetch join의 제약, 결과 중복 가능성을 함께 검사한다.
- 연결: M1·M10-1, 기존 `scenario/ch2-read-post/2-4`와 SQL/JPA/MyBatis 경로.

#### DB-14. 실제 DB 스키마를 열어 쿼리를 만들고 개선하기

- 시작 계약: `GET /api/boards/board-03/posts?size=20`의 발행·미삭제 글 목록. 현재 앱 API 구현과 구분한 SQL 설계 실습이다.
- disposable MySQL의 `board`·`post`·`member`와 관련 테이블을 DBeaver/CloudBeaver에서 열어 열·인덱스·FK를 확인한다.
- 요구사항에서 JOIN·WHERE·ORDER BY를 유도하고 실제 결과와 `EXPLAIN`/`EXPLAIN ANALYZE`를 기록한다.
- `(board_id,status,deleted_at,created_at,id)` 인덱스 전후 같은 결과인지 확인하고, 실험 인덱스를 제거한다.
- 10만 좋아요 기준 격리 fixture에서 FK 8개, 중복 좋아요 0건, 게시판 목록 1,000개 후보의 정렬 단계 제거를 확인했다. ID와 시간은 실행마다 달라질 수 있어 학습자 결과를 고정하지 않는다.

## 성능 데이터 원칙

- 정확성·업무 규칙 미션은 기존 `practice` dump와 그 정답값을 그대로 사용한다.
- 수십만 행 규모가 필요한 인덱스·실행 시간 비교에는 별도 disposable 성능 fixture를 제공한다. 예: 별도 DB/schema 또는 별도 compose profile과 생성 스크립트. 규모는 실제 실행 계획이 유의미하게 달라지는지 확인한 뒤 정한다.
- 성능 fixture에는 생성 seed와 정리/재생성 절차가 있어야 하며, 기본 `practice`에 대량 데이터를 삽입하거나 그 데이터를 덮어쓰지 않는다.
- 기본 완료 기준은 결과 집합 동등성 + 계획의 관찰값이다. wall-clock 시간 하나만으로 성능 개선을 합격 처리하지 않는다.
- 사용 중인 MySQL 버전과 지원 여부를 기준으로 명령을 정한다. 현재 저장소 compose는 MySQL 8.4이므로 `EXPLAIN ANALYZE` 및 invisible index 실습은 실제 8.4에서 검증한 뒤 공개한다.

## 화면·시안 acceptance

DB 시나리오도 산문·긴 SQL을 단순히 토글로 쌓지 않는다. 각 시나리오의 첫 화면에는 실제 API·데이터·관찰 결과를 보여 주고, 코드·실행 로그·전체 SQL은 목적이 분명한 상세 패널에서 연다.

- [ ] API 응답 필드에서 테이블/열로 연결되는 화면 시안.
- [ ] JOIN, 관계 다중성, EXISTS/서브쿼리의 행 흐름을 비교하는 시안.
- [ ] `EXPLAIN` 추정값과 `EXPLAIN ANALYZE` 실제 실행값을 나란히 보여 주는 시안.
- [ ] 인덱스 B-tree 순서와 복합 키 prefix, 쿼리 정렬을 연결하는 시안.
- [ ] 인덱스 생성 → invisible/visible → drop → 계획 복귀 상태를 비교하는 시안.
- [ ] JPA·MyBatis·QueryDSL에서 API 요청이 SQL로 이어지는 구현 위치 비교 시안.
- [ ] 각 시안은 `imagegen`으로 실제 생성하고, 잘못된 텍스트·쿼리·데이터 흐름은 출처와 대조한 뒤 구현한다.
- [ ] 각 구현 화면은 시안과 같은 정보 구조를 데스크톱·360px에서 비교하고, 각 페이지/콘텐츠 항목에 개별 증거를 기록한다. 공통 컴포넌트 적용만으로 모든 시나리오를 완료 처리하지 않는다.
- [ ] 개념을 보여 주는 색·애니메이션은 학습용 예상 경로와 실제 실행 결과를 구분한다. 실제 측정값은 실행한 DB와 명령의 결과만 표시한다.

## 단계별 완료 게이트

각 시나리오마다 아래를 만족해야 다음 단계로 표시한다.

1. 요구 API와 응답 필드, 사용할 테이블·관계, 데이터 출처를 특정한다.
2. 이미지 시안의 기술 사실을 원문/실제 실행과 대조하고 파일 경로를 기록한다.
3. 학습자가 API에서 SQL을 유도하고 직접 실행할 수 있는 미션을 제공한다.
4. 예상 응답/결과 행을 기존 정답 또는 새 성능 fixture에서 재현해 기록한다.
5. 필요한 Java 구현 위치와 실제 SQL 확인 경로(JPA/MyBatis/QueryDSL)를 연결한다.
6. DB 명령의 영향 범위와 되돌리기 방법을 안내한다.
7. 자동 문서 검증과 브라우저 데스크톱·360px 확인을 통과하고, 시안 대비 차이 및 미완료 범위를 기록한다.

## 공식 기술 참고

- [MySQL 8.4 EXPLAIN](https://dev.mysql.com/doc/refman/8.4/en/explain.html) — `EXPLAIN ANALYZE`는 쿼리를 실제 실행하며 실행 시간·행·반복 정보를 제공한다.
- [MySQL 8.4 Invisible Indexes](https://dev.mysql.com/doc/refman/8.4/en/invisible-indexes.html) — 인덱스를 유지하면서 optimizer 선택에서 제외하는 실험에 사용한다.
- [MySQL 8.4 DROP INDEX](https://dev.mysql.com/doc/refman/8.4/en/drop-index.html) — 실습 fixture에서 인덱스 삭제와 되돌림을 다룬다.
- [MySQL 8.4 ANALYZE TABLE](https://dev.mysql.com/doc/refman/8.4/en/analyze-table.html) — 옵티마이저 통계 갱신과 `EXPLAIN ANALYZE`를 분리해 설명한다.

## 남은 검증

DB-04·05·07·12·13·14의 HTML과 데스크톱·360px 브라우저 배치는 확인했다. imagegen 시안과 같은 뷰포트의 캡처 파일을 저장해 나란히 대조하는 일은 남았다. DB-08·09·11은 기존 9-2/R05와 연결되어 있으며 독립 단계 화면은 미완료다. 실제 M1/M3/M6 API의 실행과 SQL 로그 계측은 해당 API가 아직 루트 앱에 구현되지 않아 수행하지 못했다. 격리 fixture에서 확인한 인덱스 결과를 그 API의 성능 결과로 대체하지 않는다.
