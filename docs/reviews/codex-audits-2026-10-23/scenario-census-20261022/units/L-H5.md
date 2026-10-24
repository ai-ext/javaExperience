# L-H5. H5. Spring 이벤트 — 저장이 끝난 뒤에 알리기

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H5-spring-events.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H5-spring-events.md)

원문 SHA-256: `e728ed4f665007e74a2f6c1bf363c4ed236b6812e5cae16e6ddfbb178a7fda66`

## 판정

rollback 직후 plain listener가 가짜 알림을 낸다는 문제, transaction listener skip, after-commit writer 전파 함정을 실제 로그/DB 결과로 설명한다. 이벤트는 message queue가 아니라고 명시한다.

## 목표·선수 지식·학습자 작업

ApplicationEventPublisher, @EventListener, @TransactionalEventListener phase와 commit 이후 DB write 전파를 commit/rollback 로그로 비교한다.

문서가 PostCreated record, transactional create service, listener 3종, transaction debug 설정, 임시 notice table의 실행 및 고의 failure를 포함한다. 레슨 전용 앱/source/test는 repo에 없다.

## 요구·구현·검사 대조

### 1. plain listener는 publish 순간에 실행되고 transactional listener 기본 phase AFTER_COMMIT은 성공 commit 뒤, rollback은 AFTER_ROLLBACK에서 처리한다. transaction 없는 publish는 기본 fallbackExecution=false라 skip된다. after-commit write의 실제 transaction을 확인한다.

구현 대조: 원문 성공/실패 HTTP, post row 존재 여부와 listener log를 비교한다. REQUIRED JPA save/no SQL, modifying query error, JdbcTemplate row, REQUIRES_NEW insert의 네 결과를 기록한다. 이 결과는 문서 작성 시점의 저자 실험이며 이번 audit 실행이 아니다.

검사 대조: 실패 주입은 save/event publish 뒤 throw하고 500, main row rollback, plain listener만 실행, AFTER_COMMIT 미실행을 확인한다. 별도 app/test source는 없음.

공백 또는 한계: AFTER_COMMIT callback은 primary data가 이미 commit된 뒤다. listener 실패가 나도 main POST는 되돌지 않고 retry/outbox가 자동으로 생기지 않는다. lesson은 이 한계를 설명하지만 durable delivery는 16-1/16-2 및 outbox 후속이다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H5-spring-events.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H5-spring-events.md:1) — 1~279행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

결과 event phase와 persistence boundary가 핵심이다. DB notice row가 실제로 생겼는지 직접 SELECT해야 하며 log만으로 저장을 증명할 수 없다. REQUIRES_NEW는 fresh transaction을 열어 commit한다.

- 현재 난이도: 독립 개념 레슨(선수 기초 후 실무 전이)
- 판정 이유: ApplicationEventPublisher, @EventListener, @TransactionalEventListener phase와 commit 이후 DB write 전파를 commit/rollback 로그로 비교한다.
- 다음 단계: H5는 Spring local event 및 commit phase, 16-1은 follower notification과 rollback test/REQUIRES_NEW, 16-2는 push를 별도 executor에 넘기고 SENT/FAILED 기록을 맡는다. Outbox는 별도 신뢰성 개선이다.

## 부족한 점

### L-H5-G1 · medium

listener delivery의 durable retry/outbox를 구현하지 않는다. 커밋 후 실패를 보상하는 동작은 현재 lesson 범위 밖이다.

판정 범위: AFTER_COMMIT callback은 primary data가 이미 commit된 뒤다. listener 실패가 나도 main POST는 되돌지 않고 retry/outbox가 자동으로 생기지 않는다. lesson은 이 한계를 설명하지만 durable delivery는 16-1/16-2 및 outbox 후속이다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H5-spring-events.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H5-spring-events.md:1) — 1~279행

## 확장 개발 명세

### ApplicationEventPublisher, @EventListener, @TransactionalEventListener 구체 검증

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

listener delivery의 durable retry/outbox를 구현하지 않는다. 커밋 후 실패를 보상하는 동작은 현재 lesson 범위 밖이다.

**시작 상태**

isolated practice profile에서 lesson_h5_post/notice를 사용한다. JpaTransactionManager debug logging을 켜고 성공/실패 경우의 DB counts를 먼저 기록한다.

**학습자가 할 일**

- 성공 POST: INSERT, plain log, commit, AFTER_COMMIT log 순서를 확인하고 post/notice row를 조회한다.
- fail=true: HTTP500, post id 부재, plain listener 실행, AFTER_COMMIT 미실행, AFTER_ROLLBACK 실행을 비교한다.
- transaction 없는 publisher 호출에서 transactional listeners가 skip되는 debug trace를 확인한다.
- NoticeWriter의 REQUIRED save/native modifying/JdbcTemplate/REQUIRES_NEW 변형을 비교하고 SQL 및 notice row count로 실제 persistence를 판정한다.
- AFTER_COMMIT listener 예외를 유도해 원글 commit 및 정상 response와 notification failure log를 대조한다.

**정상 사례**

- commit 성공 시 post row와 AFTER_COMMIT 알림 row가 남는다.
- rollback 시 post row 없음, AFTER_COMMIT 미실행, AFTER_ROLLBACK 실행.

**실패·경계 사례**

- plain listener가 rollback 전 실행되면 DB에 없는 post 알림을 보낼 수 있다.
- transaction 밖 publish는 default transactional listener를 호출하지 않는다.
- after-commit REQUIRED writer가 completed transaction에 묶이면 INSERT가 안 될 수 있으므로 실제 row를 조회한다.
- after-commit exception은 committed post를 rollback하지 않고 자동 retry하지 않는다.

**동시성·성능**

지연·처리량 테스트는 없다. listener는 동기이며 H6/16-2가 느린 후처리를 다룬다.

**DB 관찰**

- JpaTransactionManager begin/commit/rollback과 listener log order.
- 성공/rollback/listener 예외 뒤 post 및 notice 행 개수.
- 응답 status와 after-completion 예외 log.

**합격 기준**

- 각 phase의 trigger 시점을 transaction logs로 구분한다.
- DB row를 직접 확인해 log output과 persistence를 혼동하지 않는다.
- event listener 실패가 durable delivery되지 않는 한계를 분리 설명한다.

**기존 과제와 중복·연결**

16-1은 H5 primitive를 실제 follower notification에 적용하고 16-2는 async push·FAILED 기록을 추가한다.

**우선순위**

medium

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H5/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H5/screen.jpg)
- 관찰: HTML/캡처를 실제 열어 보지 않았다. source와 HTML 차이만으로 시각 검토를 완료하지 않는다.
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H5/dom.txt](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H5/dom.txt)

- source: [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H5-spring-events.md](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H5-spring-events.md)
- source_same: 예
- html: [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H5-spring-events.html](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H5-spring-events.html)
- html_same: 아니오
- difference: source는 corpus에서 최신 원문과 같다고 기록되어 있다. HTML byte hash가 다르지만 화면/원인을 미검토했다.

- 인쇄된 임시 앱 출력은 원문에 기록된 과거 저자 관찰이며 이번 실행이 아니다.
- 레슨별 runnable app/자동 테스트가 저장소에 확인되지 않아 수치를 이번 실행이나 자동 검증 성공으로 주장하지 않는다.

## 읽은 구현 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H5-spring-events.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H5-spring-events.md:1) — 1~279행 (원리·코드 예시·기록된 저자 실행·따라 하기·실패 반례·답안·후속 경로)

구조화 원본: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-H5.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-H5.json)
