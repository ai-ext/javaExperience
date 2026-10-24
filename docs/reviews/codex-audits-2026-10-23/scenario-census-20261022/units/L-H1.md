# L-H1. H1. 동시성 맛보기 — 두 요청이 동시에 오면

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/H1-concurrency-taste.md](../../../../../lessons/H1-concurrency-taste.md)

원문 SHA-256: `96f084cb80a6765e461737a0a9a08767dcef50ed67305df5eb2bb93d8b0d1665`

## 판정

경합 현상을 jshell·SQL·서비스 코드로 비교한다. synchronized의 JVM 범위와 DB 행 잠금을 구분하며 문서의 수치는 과거 저자 실행 관측으로만 취급했다.

## 목표·선수 지식·학습자 작업

두 개의 같은 시각 요청이 읽기-계산-쓰기 사이에서 갱신 손실을 만드는 과정을 Java 객체, DB 행 잠금, 원자 UPDATE로 비교한다. AtomicInteger가 JVM 한 대 안에서만 작동하고 DB가 여러 서버의 공유 상태라는 점을 구분한다.

문서에 포함된 jshell, 임시 Spring 앱, 임시 SQL 표를 복사해 실행한다. 저장소에 H1 전용 실험 앱이나 자동 테스트는 없다. 실제 CRUD 코드를 고치는 후속 과제는 4-2다.

## 요구·구현·검사 대조

### 1. 갱신 손실을 두 스레드와 두 DB 접속에서 재현하고, 앱이 읽은 절대값을 쓰는 방식과 DB 원자 증가를 비교한다. 서로 다른 회원의 동시 증가와 같은 회원 중복 요청은 별개로 구분한다.

구현 대조: 원문은 jshell 두 호출 뒤 1, AtomicInteger 뒤 2, 임시 Spring 앱 동시 2회 뒤 1, 원자 UPDATE 뒤 2 및 20회 동시 실험을 인쇄했다. SQL 로그와 두 mysql 세션의 순서/응답도 제시한다. 이는 원문에 기록된 과거 저자 실행이며 이번 감사 실행 결과가 아니다.

검사 대조: 문서에 sleep 100ms, 1ms, sleep 제거 반복, 20 요청, 두 DB 접속과 1205 대기 사례가 기록돼 있다. lesson 전용 테스트 파일은 없다. 4-2는 별도 LikeConcurrencyTest에서 20명 및 동일 사용자 요청을 요구한다.

공백 또는 한계: H1은 E2의 sql 함수로 lesson_counter를 만든다고 하고 G3 terminal 명령을 안내하지만 현재 E2 helper와 G3 command는 모두 DB community를 선택한다. H1 문장의 practice 대상과 달라 생성한 표와 확인 접속이 다른 schema가 될 수 있다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/H1-concurrency-taste.md](../../../../../lessons/H1-concurrency-taste.md) — 1~307행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

절대값 UPDATE는 두 요청이 같은 수를 읽으면 하나의 증가분을 덮는다. like_count = like_count + 1은 DB 현재 값에 상대 연산한다. 좋아요 관계 중복 방지는 counter 원자 증가와 별개로 UNIQUE(post_id,member_id) 및 중복 처리 정책이 필요하다.

- 현재 난이도: 독립 개념 레슨(선수 기초 후 실무 전이)
- 판정 이유: 두 개의 같은 시각 요청이 읽기-계산-쓰기 사이에서 갱신 손실을 만드는 과정을 Java 객체, DB 행 잠금, 원자 UPDATE로 비교한다. AtomicInteger가 JVM 한 대 안에서만 작동하고 DB가 여러 서버의 공유 상태라는 점을 구분한다.
- 다음 단계: H1은 실패 재현과 원자 증가 원리다. 4-1이 relation row idempotency를 만들고 4-2는 서로 다른 20명 및 같은 사용자 5회 요청, count 일치와 deadlock retry를 테스트한다.

## 부족한 점

### L-H1-G1 · medium

실습 표 생성은 practice라고 설명하지만 E2 sql helper 및 G3 접속 예시는 community DB를 명시한다. 두 DB가 같다고 보고 실습하면 table not found가 날 수 있다.

판정 범위: H1은 E2의 sql 함수로 lesson_counter를 만든다고 하고 G3 terminal 명령을 안내하지만 현재 E2 helper와 G3 command는 모두 DB community를 선택한다. H1 문장의 practice 대상과 달라 생성한 표와 확인 접속이 다른 schema가 될 수 있다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/H1-concurrency-taste.md](../../../../../lessons/H1-concurrency-taste.md) — 1~307행

## 확장 개발 명세

### 두 개의 같은 시각 요청이 읽기-계산-쓰기 사이에서 갱신 손실을 만드는 과정을 Java 객체, DB 행 잠금, 원자 UPDAT 구체 검증

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

실습 표 생성은 practice라고 설명하지만 E2 sql helper 및 G3 접속 예시는 community DB를 명시한다. 두 DB가 같다고 보고 실습하면 table not found가 날 수 있다.

**시작 상태**

기존 데이터는 건드리지 않고 격리 schema에서 시작한다. 연결 후 SELECT DATABASE()를 기록하고 임시 lesson_counter를 생성한다.

**학습자가 할 일**

- E2 sql 함수와 G3 terminal 접속의 실제 schema를 대조하고 lesson_counter를 만든 schema에서 SELECT DATABASE(), COUNT(*)를 확인한다.
- 두 접속이 모두 0을 읽은 뒤 절대값 1 저장을 실행해 최종 1을 확인한다.
- 값을 0으로 복구하고 원자 증가 문장 두 개를 실행한다. B가 A 행 잠금 해제까지 기다린 뒤 최종 2인지 확인한다.
- A가 commit하지 않은 경우 B가 1205로 실패하는 시점과 session timeout을 기록한다.
- 마지막에 동일 schema의 임시 표만 제거한다. 이후 4-2의 20명/같은 회원 5회 테스트로 넘어간다.

**정상 사례**

- 절대값 write 결과는 1, 원자 increment 결과는 2다.
- 후속 4-2에서 서로 다른 20명은 카운터 20 증가, 동일 회원 5회는 relation row 1개여야 한다.

**실패·경계 사례**

- 생성 schema와 접속 schema가 다르면 table not found가 난다.
- 동시 절대값 write로 둘 다 성공했어도 마지막 값은 1일 수 있다.
- 잠금 소유 트랜잭션이 끝나지 않으면 기다리는 요청이 1205를 낼 수 있다.

**동시성·성능**

H1은 성능 benchmark가 아니다. sleep 조건 결과와 sleep 없는 반복은 재현 빈도 예시이며 20 요청 3~5는 보편적 수치가 아니다.

**DB 관찰**

- 각 세션의 START/SELECT/UPDATE/COMMIT 순서, schema와 최종 행 값.
- 요청 결과 수와 relation row count/counter.
- B의 대기 시간, timeout 및 MySQL 오류.

**합격 기준**

- 두 방식의 최종 값 차이 1 대 2를 재현하고 원인을 설명한다.
- 생성·확인 연결이 같은 격리 schema임을 증명한다.
- relation idempotency와 counter atomicity를 별개 계약으로 서술한다.

**기존 과제와 중복·연결**

4-1은 중복 좋아요 상태, 4-2는 동시성 구현/테스트, H1은 원리와 손 재현이다.

**우선순위**

medium

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H1/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H1/screen.jpg`)
- 관찰: HTML/캡처를 실제 열어 확인하지 않았다. source와 HTML 차이만으로 시각 검토를 완료하지 않는다.
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H1/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H1/dom.txt`)

- source: [$WORKTREE_ROOT/scenario-crud-redesign/lessons/H1-concurrency-taste.md](../../../../../lessons/H1-concurrency-taste.md)
- source_same: 예
- html: [$WORKTREE_ROOT/scenario-crud-redesign/lessons/H1-concurrency-taste.html](../../../../../lessons/H1-concurrency-taste.html)
- html_same: 아니오
- difference: source는 corpus에서 최신 원문과 동일하다고 기록되어 있다. HTML byte hash가 다르지만 화면/원인을 미검토했다.

- 인쇄된 임시 앱 결과는 원문에 기록된 과거 저자 관찰이며 이번 실행이 아니다.
- 레슨별 runnable app/자동 테스트가 저장소에서 확인되지 않아 수치를 이번 검증 성공으로 주장하지 않는다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/H1-concurrency-taste.md](../../../../../lessons/H1-concurrency-taste.md) — 1~307행 (원리·코드 예시·기록된 저자 실행·따라 하기·실패 반례·정답과 후속 경로)
- [$WORKTREE_ROOT/concept-census-20261021/lessons/E2-db-sql-basics.md](../../../../../lessons/E2-db-sql-basics.md) — 54~54행 (E2 sql helper의 기본 database)
- [$WORKTREE_ROOT/concept-census-20261021/lessons/G3-first-transaction.md](../../../../../lessons/G3-first-transaction.md) — 46~46행 (G3 MySQL 접속 기본 database)
- [$WORKTREE_ROOT/concept-census-20261021/scenario/ch4-like/4-2-like-concurrency.md](../../../../../scenario/ch4-like/4-2-like-concurrency.md) — 169~177행 (후속 동시성 테스트 계약)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-H1.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-H1.json`)
