# L-F1. F1. 검증과 에러 응답(ProblemDetail)

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/F1-validation-errors.md](../../../../../lessons/F1-validation-errors.md)

원문 SHA-256: `b966815a72ede2c6292fbae91f5e76fed13280c8c9f62fd1e3990662b6bfb6f7`

## 판정

서버 입력 검증과 RFC 9457 ProblemDetail 응답의 이유를 설명하고, validation·도메인 오류·깨진 JSON의 HTTP 상태를 구분한다. 실제 API 완성은 1-5 실습이 담당한다. 예제 Advice는 validation handler 중심의 발췌이고 나머지 404/403/malformed JSON은 1-5에 남는다. 과거 output은 source 기록이며 본 감사자는 재실행하지 않았다.

## 목표·선수 지식·학습자 작업

서버 입력 검증과 RFC 9457 ProblemDetail 응답의 이유를 설명하고, validation·도메인 오류·깨진 JSON의 HTTP 상태를 구분한다. 실제 API 완성은 1-5 실습이 담당한다.

빈 제목 요청을 보내고 @NotBlank/@Valid 추가 전후 DB와 응답을 관찰한다. 전체 Advice 구현은 1-5에서 수행한다.

## 요구·구현·검사 대조

### 1. 입력 검증과 Advice 전후 201/400·DB 결과 비교

구현 대조: DTO rule/@Valid/exception handler 핵심 코드가 제공된다. 1-5 정답 응답을 source에 역사적 실측으로 인용한다.

검사 대조: 자동 test 없음, auditor는 미실행.

공백 또는 한계: Advice 발췌는 전체 처리기가 아니다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F1-validation-errors.md](../../../../../lessons/F1-validation-errors.md) — 63~171행

### 2. ProblemDetail status/title/detail/instance/errors와 400/401/403/404/500 구분

구현 대조: RFC 9457와 Spring validation/advice 역할 설명.

검사 대조: 설명·확인 문제만 존재.

공백 또는 한계: 실제 전체 error handler는 1-5에서 확인.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F1-validation-errors.md](../../../../../lessons/F1-validation-errors.md) — 15~62행

### 3. 깨진 JSON은 validation 이전 별도 exception

구현 대조: HttpMessageNotReadableException 사례와 응답 예시.

검사 대조: source 기록의 과거 결과, 재실행 안 함.

공백 또는 한계: 1-5에서 별도 handler 구성.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F1-validation-errors.md](../../../../../lessons/F1-validation-errors.md) — 193~208행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

- content: 핵심은 DB에 닿기 전 validation과 exception mapping이다. 빈 문자열은 NOT NULL로 거절되지 않을 수 있고 Advice 누락은 500을 만든다.
- current_scope: 서버 입력 검증과 RFC 9457 ProblemDetail 응답의 이유를 설명하고, validation·도메인 오류·깨진 JSON의 HTTP 상태를 구분한다. 실제 API 완성은 1-5 실습이 담당한다.
- missing_scope: 예제 Advice는 validation handler 중심의 발췌이고 나머지 404/403/malformed JSON은 1-5에 남는다. 과거 output은 source 기록이며 본 감사자는 재실행하지 않았다.
- existing_links: 1-5 validation · 10-2 response · F6 boundaries

- 현재 난이도: 중급 개념/실전 연결 레슨
- 판정 이유: 서버 입력 검증과 RFC 9457 ProblemDetail 응답의 이유를 설명하고, validation·도메인 오류·깨진 JSON의 HTTP 상태를 구분한다. 실제 API 완성은 1-5 실습이 담당한다.
- 다음 단계: - 1-5 validation
  - 10-2 response
  - F6 boundaries

## 부족한 점

### G1 · medium

예제 Advice는 validation handler 중심의 발췌이고 나머지 404/403/malformed JSON은 1-5에 남는다. 과거 output은 source 기록이며 본 감사자는 재실행하지 않았다.

판정 범위: 레슨은 구현 예시와 실습 지시를 제공하며 이번 감사자가 실행/build한 것은 아니다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F1-validation-errors.md](../../../../../lessons/F1-validation-errors.md) — 15~208행

## 확장 개발 명세

### 1-5 API 오류 경로별 ProblemDetail 계약 확인

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

예제 Advice는 validation handler 중심의 발췌이고 나머지 404/403/malformed JSON은 1-5에 남는다. 과거 output은 source 기록이며 본 감사자는 재실행하지 않았다.

**시작 상태**

원문 지정 local/disposable app 또는 DB를 준비하고 historical output과 new result를 분리한다.

**학습자가 할 일**

- 1-5에서 validation/domain 404·403/bad JSON을 status, Content-Type, errors, no-save로 비교하는 요청 matrix를 만든다.

**정상 사례**

- 입력 검증과 Advice 전후 201/400·DB 결과 비교

**실패·경계 사례**

- 깨진 JSON은 validation 이전 별도 exception

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
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F1/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F1/screen.jpg`)
- 관찰: 렌더 캡처가 제공되지 않아 시각 검토 대기.
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F1/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F1/dom.txt`)

- source: corpus latest_source 기록에 따름
- html: source 동일, generated HTML hash 상이; screenshot 비교 대기
- comparison: HTML hash difference만으로 강의 내용이 바뀌었다고 판단하지 않는다.
- public_based_extra: 별도 CRUD UI 변경은 lesson 누락으로 보지 않는다.

별도 snapshot 답안 없음. 본문 속 실행결과는 과거 기록이며 auditor는 실행/build하지 않았다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F1-validation-errors.md](../../../../../lessons/F1-validation-errors.md) — 63~171행 (레슨 본문 코드/설명/과거 실험 결과; 별도 snapshot 없음)
- [$WORKTREE_ROOT/concept-census-20261021/lessons/F1-validation-errors.md](../../../../../lessons/F1-validation-errors.md) — 15~62행 (레슨 본문 코드/설명/과거 실험 결과; 별도 snapshot 없음)
- [$WORKTREE_ROOT/concept-census-20261021/lessons/F1-validation-errors.md](../../../../../lessons/F1-validation-errors.md) — 193~208행 (레슨 본문 코드/설명/과거 실험 결과; 별도 snapshot 없음)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-F1.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-F1.json`)
