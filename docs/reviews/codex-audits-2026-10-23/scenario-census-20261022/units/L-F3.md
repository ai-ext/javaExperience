# L-F3. F3. CORS — 브라우저가 막는 이유

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F3-cors.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F3-cors.md)

원문 SHA-256: `44f26f841ebb52a052c3ad2c9f4ba62e8e4b40c2f464f3c35fcd902d0a0ccfef`

## 판정

CORS는 browser JS response 접근 정책이며 API auth/CSRF와 다르다. Preflight의 요청/응답을 1-1/1-6과 연결한다. localhost 임의 port origin pattern은 개발용이다. production allowlist/credential cookie 설정은 제시하지 않는다.

## 목표·선수 지식·학습자 작업

CORS는 browser JS response 접근 정책이며 API auth/CSRF와 다르다. Preflight의 요청/응답을 1-1/1-6과 연결한다.

curl OPTIONS와 browser Network, config/cache on/off를 비교한다.

## 요구·구현·검사 대조

### 1. preflight 필요/차단/본요청 미전송

구현 대조: simple/non-simple 요청 구분표와 CORS 없는 상태의 browser/curl 응답 예시가 있다.

검사 대조: historical Chromium outputs, audit not rerun.

공백 또는 한계: cache 허가 후 POST 저장됐지만 JS가 읽지 못할 수 있음도 보인다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F3-cors.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F3-cors.md:9) — 9~86행

### 2. allow origin/method/header/expose

구현 대조: CorsConfig와 OPTIONS response headers가 있다.

검사 대조: historical output, no fresh browser run.

공백 또는 한계: localhost wildcard pattern은 dev 범위.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F3-cors.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F3-cors.md:87) — 87~130행

### 3. preflight auth bypass, actual request auth

구현 대조: interceptor blocking and CorsUtils bypass example.

검사 대조: 기존 관찰, 현재 재현 안 함.

공백 또는 한계: OPTIONS 예외처리는 인증을 우회하는 것이 아니다. 그 뒤의 실제 API 요청에서는 token을 확인한다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F3-cors.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F3-cors.md:155) — 155~185행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

- content: origin, OPTIONS preflight, 허용 headers/methods, JS에 공개되는 response headers와 실제 POST/DB 저장 여부를 구별한다.
- current_scope: CORS는 browser JS response 접근 정책이며 API auth/CSRF와 다르다. Preflight의 요청/응답을 1-1/1-6과 연결한다.
- missing_scope: localhost 임의 port origin pattern은 개발용이다. production allowlist/credential cookie 설정은 제시하지 않는다.
- existing_links: 1-1 CORS · 1-6 auth interceptor · F2 session/CSRF · L15 session

- 현재 난이도: 중급 개념/실전 연결 레슨
- 판정 이유: CORS는 browser JS response 접근 정책이며 API auth/CSRF와 다르다. Preflight의 요청/응답을 1-1/1-6과 연결한다.
- 다음 단계: - 1-1 CORS
  - 1-6 auth interceptor
  - F2 session/CSRF
  - L15 session

## 부족한 점

### G1 · medium

localhost 임의 port origin pattern은 개발용이다. production allowlist/credential cookie 설정은 제시하지 않는다.

판정 범위: 레슨은 구현 예시와 실습 지시를 제공하며 이번 감사자가 실행/build한 것은 아니다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F3-cors.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F3-cors.md:9) — 9~185행

## 확장 개발 명세

### local CORS와 production origin allowlist 분리

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

localhost 임의 port origin pattern은 개발용이다. production allowlist/credential cookie 설정은 제시하지 않는다.

**시작 상태**

원문 지정 local/disposable app 또는 DB를 준비하고 historical output과 new result를 분리한다.

**학습자가 할 일**

- dev origin과 exact production allowlist를 분리하고 Authorization 및 cookie credentials의 browser behavior를 검증한다.

**정상 사례**

- preflight 필요/차단/본요청 미전송

**실패·경계 사례**

- preflight auth bypass, actual request auth

**동시성·성능**

lesson scope에 직접 든 concurrency/performance만 environment를 기록해 측정.

**DB 관찰**

- 핵심 DB rows/cookie/SQL output 전후.

**합격 기준**

- 원문의 역사적 실행과 새 재현을 구분하고, 새 assertion이 해당 단위의 고유 계약을 검사한다.
- 격리 상태/버전/실행 결과를 기록하며 이번 감사가 재실행하지 않은 기존 출력은 통과로 쓰지 않는다.

**기존 과제와 중복·연결**

구현 책임이 후속 실습에 명시되면 해당 연결을 유지한다.

**우선순위**

medium

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F3/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F3/screen.jpg)
- 관찰: 렌더 캡처가 제공되지 않아 시각 검토 대기.
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F3/dom.txt](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F3/dom.txt)

- source: corpus latest_source 기록에 따름
- html: source 동일, generated HTML hash 상이; screenshot 비교 대기
- comparison: HTML hash difference만으로 강의 내용이 바뀌었다고 판단하지 않는다.
- public_based_extra: 별도 CRUD UI 변경은 lesson 누락으로 보지 않는다.

별도 snapshot 답안 없음. 본문 속 실행결과는 과거 기록이며 auditor는 실행/build하지 않았다.

## 읽은 구현 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F3-cors.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F3-cors.md:9) — 9~86행 (레슨 본문 코드/설명/과거 실험 결과; 별도 snapshot 없음)
- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F3-cors.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F3-cors.md:87) — 87~130행 (레슨 본문 코드/설명/과거 실험 결과; 별도 snapshot 없음)
- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F3-cors.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F3-cors.md:155) — 155~185행 (레슨 본문 코드/설명/과거 실험 결과; 별도 snapshot 없음)

구조화 원본: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-F3.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-F3.json)
