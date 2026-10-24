# L-H6. H6. @Async와 스레드 풀 — 느린 일은 뒤에서

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H6-async-thread-pool.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H6-async-thread-pool.md)

원문 SHA-256: `03bf7be9c370b7402dfd8c612289c561b5d2a5c0bb4194e9375391d738b648c6`

## 판정

thread names, latency, proxy self-call failure, void/future exception, bounded queue rejection과 virtual thread 실행기를 구체 관찰값으로 보여 준다. 임시 앱 실행자료임을 repo test와 구분한다.

## 목표·선수 지식·학습자 작업

@Async 프록시, Executor 실행기의 core/queue/max/rejection, 응답과 작업 완료 분리, 예외 전달 및 Java 가상 스레드 실행기를 비교한다.

문서는 Boot 4.1 임시 앱에서 500ms sleep push로 sync/cross-bean async/self call, void/future exception, queue saturation, CallerRuns, virtual thread를 측정한 결과를 싣는다. runnable package/test는 repo에 없고 이번 감사에서도 실행하지 않는다.

## 요구·구현·검사 대조

### 1. @EnableAsync와 다른 bean proxy call이 있어야 async dispatch된다. core를 채운 뒤 queue, 이후 max, 마지막 reject/C​​allerRuns 동작을 관찰하고 response time과 task completion을 분리한다.

구현 대조: 문서 기록에서 sync ~1.66s, async ~0.023s, self call ~1.55s; void exception은 async handler log, future join은 CompletionException; core2/max4/queue2에서 7/8 rejection; CallerRuns는 caller를 약 2s 잡는다. virtual thread mode는 Boot auto executor를 SimpleAsyncTaskExecutor로 바꾼다.

검사 대조: 따라하기는 lab.h6 package 생성, sync/async/self HTTP timing, core-size=1 task thread spacing을 본 뒤 package를 제거한다. repo tests는 없다. 수치는 작성 당시 관찰이지 현재 재실행 값이 아니다.

공백 또는 한계: 비동기 submit은 durable queue가 아니다. process shutdown, rejected task, async void failure가 notification 업무를 유실시킬 수 있다. fast HTTP response는 work completion을 의미하지 않는다. 16-2는 bounded executor와 SENT/FAILED 상태를 추가한다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H6-async-thread-pool.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H6-async-thread-pool.md:1) — 1~265행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

Async task는 다른 thread에서 실행되어 caller transaction/security/request context를 자동 공유하지 않는다. H6는 pool behavior가 주 범위고 DB delivery status는 16-2를 맡긴다.

- 현재 난이도: 독립 개념 레슨(선수 기초 후 실무 전이)
- 판정 이유: @Async 프록시, Executor thread pool의 core/queue/max/rejection, response/work 분리, exception 전달과 Java virtual thread executor를 비교한다.
- 다음 단계: H6는 proxy/executor 개념이고 16-2는 notificationExecutor(core2,max4,queue100,CallerRunsPolicy), member별 실패 처리 및 push_status 기록을 구현한다.

## 부족한 점

### L-H6-G1 · medium

저장소에는 해당 executor 데모/자동 검사가 없다. 16-2의 FAILED 기록은 업무상 결과 추적이며 H6 자체에 durable queue/retry를 추가한 것은 아니다.

판정 범위: 비동기 submit은 durable queue가 아니다. process shutdown, rejected task, async void failure가 notification 업무를 유실시킬 수 있다. fast HTTP response는 work completion을 의미하지 않는다. 16-2는 bounded executor와 SENT/FAILED 상태를 추가한다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H6-async-thread-pool.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H6-async-thread-pool.md:1) — 1~265행

## 확장 개발 명세

### @Async 프록시, Executor thread pool의 core/queue/max/rejection, response/w 구체 검증

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

저장소에는 해당 executor 데모/자동 검사가 없다. 16-2의 FAILED 기록은 업무상 결과 추적이며 H6 자체에 durable queue/retry를 추가한 것은 아니다.

**시작 상태**

격리 lab.h6 package와 세 receiver 작업, 각 500ms delay로 시작한다. 외부 서비스나 DB를 바꾸지 않는다.

**학습자가 할 일**

- sync/async/self endpoint를 순서대로 호출해 HTTP total time과 작업 thread별 완료 시각을 비교한다.
- @EnableAsync 제거와 same-class self call을 개별 재현해 요청 thread에서 다시 실행되는지 확인한다.
- void failure의 uncaught handler log와 CompletableFuture.join의 CompletionException을 각각 관찰한다.
- core2/max4/queue2에서 8개 작업을 latch로 동시에 제출하고 task7/8 rejection 및 실행 순서를 기록한다.
- CallerRunsPolicy를 적용해 일부 작업이 요청 thread에서 실행되고 response가 늘어나는지 측정한다.
- virtual thread mode + core-size=2에서 10개 작업의 isVirtual/완료시간을 확인하고 custom executor 동작과 구분한다.

**정상 사례**

- cross-bean async는 3 작업을 submit 후 응답, 완료 log는 별도 task threads.
- self call/async 미활성화는 요청 thread에서 실행한다.

**실패·경계 사례**

- void async 예외는 caller의 try/catch로 안 잡히고 log만 남을 수 있다.
- bounded queue overflow는 explicit reject policy가 없으면 TaskRejectedException을 낸다.
- CallerRuns는 유실 대신 caller 응답 지연을 만들 수 있다.
- virtual threads는 pool-size limit과 동등하지 않다.

**동시성·성능**

500ms sleep과 1.66s/0.023s은 demo 한 번의 timing이지 production throughput이 아니다. 운영 평가는 active/queue/reject 및 downstream capacity가 필요하다.

**DB 관찰**

- HTTP 응답 시간과 작업 완료 시각/thread name.
- 실행기 core/max/queue 설정, 실행 중/대기/거절 수 및 caller-run 여부.
- void 오류 log, Future 결과, 작업 상태 기록.

**합격 기준**

- proxy dispatch/self-call behavior를 identify한다.
- queue saturation/rejection/CallerRuns tradeoff를 fixed 8-job test로 설명한다.
- 16-2에서 submission과 FAILED/SENT 업무결과를 분리 기록한다.

**기존 과제와 중복·연결**

H5는 AFTER_COMMIT event phase, H6는 Async executor, 16-2는 두 흐름을 push 알림 업무에 결합한다.

**우선순위**

medium

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H6/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H6/screen.jpg)
- 관찰: HTML/캡처를 실제 열어 보지 않았다. source와 HTML 차이만으로 시각 검토를 완료하지 않는다.
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H6/dom.txt](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-H6/dom.txt)

- source: [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H6-async-thread-pool.md](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H6-async-thread-pool.md)
- source_same: 예
- html: [/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H6-async-thread-pool.html](/Users/ds/code/javaExperience/.worktrees/scenario-crud-redesign/lessons/H6-async-thread-pool.html)
- html_same: 아니오
- difference: source는 corpus에서 최신 원문과 같다고 기록되어 있다. HTML byte hash가 다르지만 화면/원인을 미검토했다.

- 인쇄된 임시 앱 출력은 원문에 기록된 과거 저자 관찰이며 이번 실행이 아니다.
- 레슨별 runnable app/자동 테스트가 저장소에 확인되지 않아 수치를 이번 실행이나 자동 검증 성공으로 주장하지 않는다.

## 읽은 구현 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H6-async-thread-pool.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/H6-async-thread-pool.md:1) — 1~265행 (원리·코드 예시·기록된 저자 실행·따라 하기·실패 반례·답안·후속 경로)

구조화 원본: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-H6.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-H6.json)
