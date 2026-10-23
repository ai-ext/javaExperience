# L-F8. F8. 요청 수 제한·도배 방지 — 429와 Retry-After

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F8-rate-limiting.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F8-rate-limiting.md)

원문 SHA-256: `b87ca12a21e63c926245710c88f49accd4d9f41d5c618af50ecd9fe934aec315`

## 판정

회원별 분당 5개 고정 window와 429/Retry-After를 구현 예시로 보고, 경계 burst 및 count-insert concurrency race를 관찰한다. 고정 window는 1분 경계에서 10건을 허용할 수 있다. H1/13-3으로 연결된다.

## 목표·선수 지식·학습자 작업

서버는 회원별 fixed-window로 분당 5개 글쓰기를 제한하고 초과를 429/Retry-After로 알린다. Lesson은 경계 burst와 count/insert concurrency race를 보인다. H1/13-3으로 이어진다.

Practice DB 실험에서 COUNT, 6번째 요청, Retry-After 대기, 분 경계, member row FOR UPDATE 전/후 20개 병렬 요청을 비교한다.

## 요구·구현·검사 대조

### 1. 허용 시 post row를 저장하고 초과 시 429 및 올림된 초 단위 Retry-After를 주며 거절 요청은 저장하지 않는다.

구현 대조: COUNT/remaining time, exception handler 및 6번째 요청 응답을 제시한다.

검사 대조: 과거 local app 결과이며 이번 감사에서 실행하지 않았다.

공백 또는 한계: Retry-After는 app LocalDateTime으로 계산한다. 여러 노드의 clock skew는 측정하지 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F8-rate-limiting.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F8-rate-limiting.md:5) — 5~88행

### 2. Fixed window는 달력 분 단위라 경계에서 10개가 허용될 수 있어 최근 60초 제한과 다르다.

구현 대조: 약 1.6초 내 10개와 fixed count 0/sliding count 5 비교가 본문에 있다.

검사 대조: source의 과거 동시/SQL 실험이며 다시 실행하지 않았다.

공백 또는 한계: 이는 숨은 결함이 아니라 policy semantics의 알려진 제한이다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F8-rate-limiting.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F8-rate-limiting.md:89) — 89~139행

### 3. COUNT 후 INSERT는 동시 요청에서 quota를 초과할 수 있으며 transaction만으로 직렬화되지 않는다.

구현 대조: 20개 병렬 호출에서 row lock 없이 12개, SELECT FOR UPDATE 뒤 5개 허용된 결과를 기록한다.

검사 대조: 역사적 concurrency output만 있다. 이번 감사 재실행은 없다.

공백 또는 한계: row lock은 같은 회원 요청을 직렬화해 대기시간을 만들 수 있다. In-memory counter는 multi-node에서 공유되지 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F8-rate-limiting.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F8-rate-limiting.md:140) — 140~222행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

- content: Quota는 author_id와 created_at 기준 COUNT로 계산하며 index를 둔다. 같은 transaction에서 검사 후 글을 INSERT한다.
- current_scope: 고정 분 window, 429/Retry-After, COUNT 후 INSERT 경쟁, 회원 행 잠금.
- missing_scope: 경계 burst는 source가 직접 보여 준다. COUNT/lock 처리량, multi-node clock skew 및 production load는 측정되지 않았다.
- existing_links: F2 identity · F7 authorization · H1 concurrency · 13-3 suspension · P23 Redis

- 현재 난이도: 중급 개념·실전 연결 레슨
- 판정 이유: 서버는 회원별 fixed-window로 분당 5개 글쓰기를 제한하고 초과를 429/Retry-After로 알린다. Lesson은 경계 burst와 count/insert concurrency race를 보인다. H1/13-3으로 이어진다.
- 다음 단계: - F2 identity
  - F7 authorization
  - H1 concurrency
  - 13-3 suspension
  - P23 Redis

## 부족한 점

### G1 · medium

경계 burst는 source가 직접 보여 준다. COUNT/lock 처리량, multi-node clock skew 및 production load는 측정되지 않았다.

판정 범위: 예시/과거 관찰을 본편 구현 또는 이번 감사 실행으로 혼동하지 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F8-rate-limiting.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F8-rate-limiting.md:5) — 5~222행

## 확장 개발 명세

### quota window 정책과 동시성 선택 검증

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

경계 burst는 source가 직접 보여 준다. COUNT/lock 처리량, multi-node clock skew 및 production load는 측정되지 않았다.

**시작 상태**

원문 지정 앱/격리 DB를 준비하고 source의 과거 출력과 이번 관찰을 분리한다. 기존 DB volume은 초기화하지 않는다.

**학습자가 할 일**

- 정책을 calendar-minute vs rolling-60-second 중 결정한다.
- 여러 앱 노드와 clock offset/동시 요청에서 DB count와 Redis atomic counter를 비교한다.

**정상 사례**

- 정책 범위 내 요청은 저장되고 초과 요청은 429/Retry-After를 받는다.

**실패·경계 사례**

- 같은 회원 동시 요청도 정한 quota를 넘지 않고 다중 노드에서 count가 일치한다.

**동시성·성능**

원문에서 직접 다루는 동시성/성능만 환경과 요청수를 기록해 측정한다.

**DB 관찰**

- 핵심 row/cookie/SQL output 전후를 연결한다.

**합격 기준**

- 원문의 역사적 실행과 새 재현을 구분하고, 새 assertion이 해당 단위의 고유 계약을 검사한다.
- 격리 상태/버전/실행 결과를 기록하며 이번 감사가 재실행하지 않은 기존 출력은 통과로 쓰지 않는다.

**기존 과제와 중복·연결**

후속 실습의 실제 구현 책임은 그대로 유지한다.

**우선순위**

medium

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F8/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F8/screen.jpg)
- 관찰: 렌더 캡처 미제공으로 검토 대기.
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F8/dom.txt](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F8/dom.txt)

원문: corpus의 latest_source_same=True. 최신 HTML byte 해시 다름; 실제 캡처 기반 렌더 비교 전이므로 시각 차이는 pending_render. 원문 SHA/HTML 차이만으로 UI의 정확성이나 시각 완료를 추정하지 않는다.

별도 snapshot 답안은 없다. 본문에 포함된 실행 결과는 과거 기록이며 감사자는 실행/build하지 않았다.

## 읽은 구현 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F8-rate-limiting.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F8-rate-limiting.md:5) — 5~88행 (레슨 본문 설명/코드/과거 실험 기록; 별도 snapshot 없음)
- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F8-rate-limiting.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F8-rate-limiting.md:89) — 89~139행 (레슨 본문 설명/코드/과거 실험 기록; 별도 snapshot 없음)
- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F8-rate-limiting.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F8-rate-limiting.md:140) — 140~222행 (레슨 본문 설명/코드/과거 실험 기록; 별도 snapshot 없음)

구조화 원본: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-F8.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-F8.json)
