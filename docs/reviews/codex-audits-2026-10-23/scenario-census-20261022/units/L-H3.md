# L-H3. H3. 스케줄링 — @Scheduled와 "지금 실행" API

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H3-scheduling.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H3-scheduling.md)

원문 SHA-256: `c0695de8207ace58442b66a323304299a98ffde7505a5ff14f98dc2feb9045f5`

## 판정

cron/zone과 고정 시각, scheduling thread pool, 실패 후 회차, concurrent manual run을 구체 관찰값으로 연결한다. 단일 프로세스/DB 범위와 분산 job 문제를 별도 둔다.

## 목표·선수 지식·학습자 작업

@Scheduled cron/fixedRate/fixedDelay, timezone, scheduler thread pool, exception behavior, manual API, unique key idempotency와 Clock을 익힌다.

문서의 h3 임시 package에서 schedule jobs, same service manual run, disposable digest table, Clock bean 및 malformed annotation을 직접 만든다. 원문에 출력된 Boot 4.1/MySQL 실험은 기록된 저자 실행이며 lesson source/test는 없다.

## 요구·구현·검사 대조

### 1. @EnableScheduling/@Scheduled의 6-field cron/zone/fixedRate/fixedDelay; scheduler thread pool queueing; 예외 뒤 다음 회차; manual/scheduled 공통 service 및 UNIQUE(job_name,run_date)로 중복 행 방지를 관찰한다.

구현 대조: 원문은 cron zone next time, pool1 blocking 후 pool2, 작업 길이가 주기보다 긴 경우, 실행 예외 후 다음 회차, concurrent manual API의 INSERT IGNORE, fixed Clock을 제시한다. fixed Clock은 날짜 계산에만 영향을 주고 scheduler timer는 실제 시각이라고 구분한다.

검사 대조: 실습은 concurrent POST, optional date, invalid date, 5-field cron startup failure, parameterized @Scheduled startup failure, pool logs/thread names를 기록한다. repo에 runnable H3 app/test 없음. 이번 실행 아님.

공백 또는 한계: UNIQUE는 한 DB 결과행만 보장하고 여러 JVM이 같은 schedule을 실행하는 것, DB 밖 메일/API를 정확히 한 번 보내는 것은 보장하지 않는다. FAILED run 기록·재시도·다중 인스턴스 잠금은 15-6 등 후속이 담당한다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H3-scheduling.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H3-scheduling.md:1) — 1~310행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

lesson_h3_digest의 UNIQUE(job_name,run_date)와 INSERT IGNORE는 INSERT idempotency다. 외부 부수효과는 별도 deduplication/outbox/lock 논점이다.

- 현재 난이도: 독립 개념 레슨(선수 기초 후 실무 전이)
- 판정 이유: @Scheduled cron/fixedRate/fixedDelay, timezone, scheduler thread pool, exception behavior, manual API, unique key idempotency와 Clock을 익힌다.
- 다음 단계: 15-1은 hall-of-fame schedule/manual request와 기준일/UNIQUE, 15-6은 persistent job run, failure, retry를 구현한다. H3는 기본 scheduling primitives만 설명한다.

## 부족한 점

### L-H3-G1 · medium

단일 실행 프로세스에서의 unique row 검사로 분산 스케줄의 외부 side effect를 정확히 한 번 보장하지 않는다. lesson 자체에는 job-run history나 multi-instance lock 구현이 없다.

판정 범위: UNIQUE는 한 DB 결과행만 보장하고 여러 JVM이 같은 schedule을 실행하는 것, DB 밖 메일/API를 정확히 한 번 보내는 것은 보장하지 않는다. FAILED run 기록·재시도·다중 인스턴스 잠금은 15-6 등 후속이 담당한다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H3-scheduling.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H3-scheduling.md:1) — 1~310행

## 확장 개발 명세

### @Scheduled cron/fixedRate/fixedDelay, timezone, scheduler thread pool, 구체 검증

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

단일 실행 프로세스에서의 unique row 검사로 분산 스케줄의 외부 side effect를 정확히 한 번 보장하지 않는다. lesson 자체에는 job-run history나 multi-instance lock 구현이 없다.

**시작 상태**

격리 practice schema에서 lesson_h3_digest만 만든다. app profile 및 SQL 연결이 동일 DB인지 SELECT DATABASE()로 맞추고 fixed Clock 기준일 2026-10-05를 쓴다.

**학습자가 할 일**

- CronExpression next time를 2026-10-10 15:00 KST 기준 UTC/Asia-Seoul로 비교하고 0 0 9 * * MON-FRI의 시각을 기록한다.
- pool1에서 1초 tick+3초 slow job을 10초 실행해 밀림을 보고 size2에서 thread names를 비교한다.
- 2.5초 job을 1초 fixedRate/fixedDelay로 각각 실행해 start/end 시각을 기록한다.
- 같은 day에 concurrent POST 2개를 보내 result 만듦/이미 있음 및 table rows=1을 확인한다.
- fixed Clock 2026-10-04T15:00:00Z에서 Seoul runDate=2026-10-05인지 확인한다. 미래 date와 2026-1-5는 거절되는지 확인한다.
- 5-field cron과 argument method를 각각 넣어 startup exception을 확인한 뒤 복구한다.

**정상 사례**

- 동일 day 동시 INSERT 후 row는 1이고 trigger_type은 승자를 기록한다.
- fixed Clock이 날짜를 정해도 @Scheduled timer는 실시간 시계다.

**실패·경계 사례**

- cron 5 fields 및 argument method는 app startup을 실패시킨다.
- UNIQUE 없는 select-then-insert는 중복 행, conflict 처리 없는 UNIQUE는 한 호출 500일 수 있다.
- pool1의 long job은 다른 schedule callbacks를 지연시킨다.
- schedule 예외 뒤 다음 회차가 돈다고 실패 작업이 재시도된 것은 아니다.

**동시성·성능**

pool behavior와 5초 cron은 단일 프로세스의 시험값이다. 운영 schedule 성능/분산 실행 보장으로 일반화하지 않는다.

**DB 관찰**

- 실행 thread name과 시작/끝 시각, 예약/수동 trigger, CronExpression 다음 실행시각.
- digest 행의 job/date/trigger와 HTTP status.
- app profile과 MySQL schema, fixed Clock 및 JVM zone.

**합격 기준**

- zone/fixed rate/fixed delay 차이를 log timestamp로 설명한다.
- 같은 job/date 결과행은 하나이며 fixed Clock 날짜와 real timer를 구분한다.
- 분산 실행·retry·이력은 15-6/ShedLock 후속 계약으로 구분한다.

**기존 과제와 중복·연결**

15-1은 실제 업무 배치, 15-6은 이력/retry, P30/S15는 다중 프로세스 조정을 다룬다.

**우선순위**

medium

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H3/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H3/screen.jpg)
- 관찰: HTML/캡처를 실제 열어 확인하지 않았다. source와 HTML 차이만으로 시각 검토를 완료하지 않는다.
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H3/dom.txt](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H3/dom.txt)

- source: [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H3-scheduling.md](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H3-scheduling.md)
- source_same: 예
- html: [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H3-scheduling.html](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H3-scheduling.html)
- html_same: 아니오
- difference: source는 corpus에서 최신 원문과 동일하다고 기록되어 있다. HTML byte hash가 다르지만 화면/원인을 미검토했다.

- 인쇄된 임시 앱 결과는 원문에 기록된 과거 저자 관찰이며 이번 실행이 아니다.
- 레슨별 runnable app/자동 테스트가 저장소에서 확인되지 않아 수치를 이번 검증 성공으로 주장하지 않는다.

## 읽은 구현 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H3-scheduling.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H3-scheduling.md:1) — 1~310행 (원리·코드 예시·기록된 저자 실행·따라 하기·실패 반례·정답과 후속 경로)

구조화 원본: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-H3.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-H3.json)
