# L-G1. G1. 페이징과 정렬

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G1-paging-and-sorting.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G1-paging-and-sorting.md)

원문 SHA-256: `2adffa1526407223993d897a6506a7d0b6aa485124d2ad18303e658279477161`

## 판정

Page 목록의 결정적 정렬, LIMIT/OFFSET, COUNT 및 입력 검증을 다룬다. 동률에 unique id를 추가해 행 중복/누락을 막는다. Deep offset과 신규 row 사이 page 이동은 W15/4-3의 후속 범위다.

## 목표·선수 지식·학습자 작업

Page 목록은 결정적 정렬, LIMIT/OFFSET, 전체 COUNT, page/size 검증을 결합한다. published_at 동률에 unique id tie-break가 필요하다. 2-2가 적용하고 W15/4-3에서 cursor를 심화한다.

community SQL, JDK21 PageInfo jshell, Spring Page first/last SQL을 비교하고 deleted filter 및 정렬 동률/잘못된 page-size를 실험한다.

## 요구·구현·검사 대조

### 1. OFFSET=page×size, totalPages 올림 계산, hasNext와 item COUNT 조건이 일치한다.

구현 대조: community SQL 결과 14개/3쪽 및 PageInfo/COUNT log 예시가 있다. 마지막 쪽에서 COUNT가 생략될 수 있다.

검사 대조: historical MySQL/JShell/Spring output이며 재실행하지 않았다.

공백 또는 한계: item/count WHERE 조건은 같아야 한다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G1-paging-and-sorting.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G1-paging-and-sorting.md:5) — 5~147행

### 2. published_at 동률에는 unique id를 추가해 전체 순서를 결정한다.

구현 대조: WITH RECURSIVE 예시에서 id tie-break가 없으면 page 사이 중복이 나오며 id DESC 추가 뒤 고정 순서가 된다.

검사 대조: source는 기존 MySQL 8.0 반복 결과를 적는다. 이번 실행 없음.

공백 또는 한계: DB plan이 달라지면 중복된 peer id는 다를 수 있지만 동률 순서는 보장되지 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G1-paging-and-sorting.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G1-paging-and-sorting.md:31) — 31~190행

### 3. 잘못된 page/size는 PageRequest error가 500으로 새기 전 400으로 거부한다.

구현 대조: PageRequest 예외와 작은 app의 500을 기록하고 2-2 parameter validation과 연결한다.

검사 대조: source historical jshell/server output; auditor 미실행.

공백 또는 한계: OFFSET 비용/동시 신규 row drift는 W15/4-3에서 다루며 본문에서 이미 연결한다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G1-paging-and-sorting.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G1-paging-and-sorting.md:153) — 153~228행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

- content: lesson은 WHERE와 ORDER BY·LIMIT/OFFSET 및 별도 COUNT를 보이고 Spring Page가 SQL을 만드는 경로와 last-page COUNT optimization을 설명한다. Deep offset/mutating data cursor는 후속이다.
- current_scope: 결정적 ordering, LIMIT/OFFSET, COUNT와 parameter boundary.
- missing_scope: deep OFFSET 비용 및 새 row가 페이지 사이에 들어올 때 생기는 drift는 W15/4-3으로 연결한다. 기초 Page lesson 누락으로 보지 않는다.
- existing_links: 2-2 게시판 Page API, W15 OFFSET/cursor, 4-3 keyset, 10-7 통합 목록.

- 현재 난이도: 중급 개념·실전 연결 레슨
- 판정 이유: page number, stable ordering, SQL count와 입력 범위를 함께 연결하는 조회 기초다.
- 다음 단계: - 2-2 board Page API
  - W15 OFFSET vs cursor
  - 4-3 keyset
  - 10-7 combined query

## 부족한 점

### G1 · medium

deep OFFSET 비용 및 새 row가 페이지 사이에 들어올 때 생기는 drift는 W15/4-3으로 연결한다. 기초 Page lesson 누락으로 보지 않는다.

판정 범위: source historical output은 이번 감사 실행이 아니다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G1-paging-and-sorting.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G1-paging-and-sorting.md:5) — 5~228행

## 확장 개발 명세

### OFFSET 변화와 keyset cursor를 후속에서 비교

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

deep OFFSET 비용 및 새 row가 페이지 사이에 들어올 때 생기는 drift는 W15/4-3으로 연결한다. 기초 Page lesson 누락으로 보지 않는다.

**시작 상태**

원문이 지정한 isolated app/DB에서 시작하고 과거 output과 새 관찰을 나눠 기록한다. 기존 volume은 초기화하지 않는다.

**학습자가 할 일**

- W15/4-3에서 새 row를 페이지 사이에 넣고 OFFSET과 keyset 결과를 대조한다.
- 동률 정렬값에서 id tie-break가 cursor 경계를 고정하는지 확인한다.

**정상 사례**

- source가 제시한 정상 case 결과와 상태를 확인한다.

**실패·경계 사례**

- 실패 예시의 exception/HTTP response/DB side effect를 분리 확인한다.

**동시성·성능**

원문에서 직접 다루는 동시성/성능이 있으면 환경과 요청수를 기록해 측정한다.

**DB 관찰**

- 핵심 row/SQL/log 상태 전후.

**합격 기준**

- 재현 조건과 기대 결과를 기록한다.
- 이번 실행이 없으면 과거 로그를 통과 근거로 쓰지 않는다.

**기존 과제와 중복·연결**

실제 endpoint implementation은 progression link의 scenario/lesson에서 맡는다.

**우선순위**

medium

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-G1/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-G1/screen.jpg)
- 관찰: 렌더 캡처 미제공으로 시각 검토 대기.
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-G1/dom.txt](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-G1/dom.txt)

원문: corpus의 latest_source_same=True. 최신 HTML byte 해시 다름; 실제 캡처 기반 렌더 비교 전이므로 시각 차이는 pending_render. 원문 SHA/HTML 차이만으로 UI의 정확성이나 시각 완료를 추정하지 않는다.

별도 snapshot 구현 없음. lesson output은 과거 관찰이며 auditor는 실행/build하지 않았다.

## 읽은 구현 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G1-paging-and-sorting.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G1-paging-and-sorting.md:5) — 5~147행 (레슨 본문 예시/역사적 실험; 별도 snapshot 없음)
- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G1-paging-and-sorting.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G1-paging-and-sorting.md:31) — 31~190행 (레슨 본문 예시/역사적 실험; 별도 snapshot 없음)
- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G1-paging-and-sorting.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/G1-paging-and-sorting.md:153) — 153~228행 (레슨 본문 예시/역사적 실험; 별도 snapshot 없음)

구조화 원본: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-G1.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-G1.json)
