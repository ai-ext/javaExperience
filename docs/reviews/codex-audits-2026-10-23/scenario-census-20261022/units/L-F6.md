# L-F6. F6. 입력 검증 실전 — null·빈 값·길이, 400과 500이 갈리는 곳

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/F6-validation-in-practice.md](../../../../../lessons/F6-validation-in-practice.md)

원문 SHA-256: `2ede7833a827fe213f131ccd3b513e5d567ed8ff2ad1445a9fa913c727c2a961`

## 판정

null/empty/blank/nested/byte 경계를 예시로 분리한다. method parameter validation이 body validation과 다른 exception을 만드는 점은 실제 Spring 버전에 맞춰 handler/test해야 한다.

## 목표·선수 지식·학습자 작업

입력의 absent/null/empty/blank/length/list element/nested 차이를 다룬다. validation을 DB 이후로 미루면 500이 될 수 있다. F1/1-5/10-3이 선수/적용 단계다.

Standalone Boot 4.1.1 앱에서 Bean Validation cascade, MaxBytes, DB 제약, query parameter validation exception을 curl/SQL로 비교한다.

## 요구·구현·검사 대조

### 1. @NotNull/@NotEmpty/@NotBlank/@Size/@Positive treat absent/null/empty differently; list/nested cascade is separate.

구현 대조: 요청 record와 결과는 null/empty/blank, tags 원소, address.city 검증을 나눠 보여 준다.

검사 대조: historical standalone Boot 4.1.1 output, not rerun.

공백 또는 한계: 경계 동작의 정확한 provider/version metadata를 실제 사용 버전에서 확인한다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F6-validation-in-practice.md](../../../../../lessons/F6-validation-in-practice.md) — 5~125행

### 2. 글자 수와 UTF-8 바이트 수는 다르며 BCrypt 바이트 한계는 encode 전에 검사한다.

구현 대조: MaxBytes annotation/validator와 한글/ASCII 경계, DB 500 예시 및 10-3 연결이 있다.

검사 대조: source historical result, no audit execution.

공백 또는 한계: MaxBytes는 null을 유효 처리하므로 필수값 제약을 별도로 함께 둬야 한다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F6-validation-in-practice.md](../../../../../lessons/F6-validation-in-practice.md) — 126~230행

### 3. JSON 파싱, request-body validation, method validation, DB constraint는 서로 다른 exception path를 탄다.

구현 대조: Exception table lists HttpMessageNotReadableException/MethodArgumentNotValidException/HandlerMethodValidationException/DataIntegrityViolationException.

검사 대조: 부모는 S-2-2 runtime에서 HTTP 400과 Spring 기본 JSON을 확인했다. F6 standalone 응답 본문은 재실행하지 않았다.

공백 또는 한계: F1의 MethodArgumentNotValidException 처리기만으로 method-parameter validation은 처리되지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F6-validation-in-practice.md](../../../../../lessons/F6-validation-in-practice.md) — 231~301행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

- content: request validation은 DB 및 BCrypt 이전에 잘못된 값을 막는다. 검증이 빠지면 DB 제약 실패가 뒤늦은 DataIntegrityViolationException/500이 될 수 있다.
- current_scope: absent/null/empty/blank/길이/list element/nested 값의 validation 결과와 DB 전 검증을 비교한다.
- missing_scope: 예시 응답은 standalone Boot 4.1.1/Jackson 3.1.5 환경이다. F1의 MethodArgumentNotValidException 처리기는 HandlerMethodValidationException을 자동으로 잡지 않는다.
- existing_links: F1 ProblemDetail · 1-5 request validation · 10-3 MaxBytes · 2-2 method validation · F7 authorization

- 현재 난이도: 중급 개념·실전 연결 레슨
- 판정 이유: 입력의 absent/null/empty/blank/length/list element/nested 차이를 다룬다. validation을 DB 이후로 미루면 500이 될 수 있다. F1/1-5/10-3이 선수/적용 단계다.
- 다음 단계: - F1 ProblemDetail
  - 1-5 request validation
  - 10-3 MaxBytes
  - 2-2 method validation
  - F7 authorization

## 부족한 점

### G1 · medium

예시 응답은 standalone Boot 4.1.1/Jackson 3.1.5 환경이다. F1의 MethodArgumentNotValidException 처리기는 HandlerMethodValidationException을 자동으로 잡지 않는다.

판정 범위: 예시/과거 관찰을 본편 구현 또는 이번 감사 실행으로 혼동하지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F6-validation-in-practice.md](../../../../../lessons/F6-validation-in-practice.md) — 5~301행

## 확장 개발 명세

### 버전 고정 validation 경계 행렬

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

예시 응답은 standalone Boot 4.1.1/Jackson 3.1.5 환경이다. F1의 MethodArgumentNotValidException 처리기는 HandlerMethodValidationException을 자동으로 잡지 않는다.

**시작 상태**

원문 지정 앱/격리 DB를 준비하고 source의 과거 출력과 이번 관찰을 분리한다. 기존 DB volume은 초기화하지 않는다.

**학습자가 할 일**

- Boot/validation provider 버전을 고정한 matrix에서 body/nested/query/path/DB/BCrypt byte 입력을 각각 보낸다.
- status, Content-Type, field path, 거절 뒤 저장 행이 없는지 assertion한다.

**정상 사례**

- 유효 입력과 경계 바로 안쪽 값은 저장/응답 계약을 만족한다.

**실패·경계 사례**

- 예외 종류별 400/500 구분, FieldError path 및 DB side effect가 계약에 맞는다.

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
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F6/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F6/screen.jpg`)
- 관찰: 렌더 캡처 미제공으로 검토 대기.
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F6/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F6/dom.txt`)

원문: corpus의 latest_source_same=True. 최신 HTML byte 해시 다름; 실제 캡처 기반 렌더 비교 전이므로 시각 차이는 pending_render. 원문 SHA/HTML 차이만으로 UI의 정확성이나 시각 완료를 추정하지 않는다.

별도 snapshot 답안은 없다. 본문에 포함된 실행 결과는 과거 기록이며 감사자는 실행/build하지 않았다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F6-validation-in-practice.md](../../../../../lessons/F6-validation-in-practice.md) — 5~125행 (레슨 본문 설명/코드/과거 실험 기록; 별도 snapshot 없음)
- [$WORKTREE_ROOT/concept-census-20261021/lessons/F6-validation-in-practice.md](../../../../../lessons/F6-validation-in-practice.md) — 126~230행 (레슨 본문 설명/코드/과거 실험 기록; 별도 snapshot 없음)
- [$WORKTREE_ROOT/concept-census-20261021/lessons/F6-validation-in-practice.md](../../../../../lessons/F6-validation-in-practice.md) — 231~301행 (레슨 본문 설명/코드/과거 실험 기록; 별도 snapshot 없음)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-F6.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-F6.json`)
