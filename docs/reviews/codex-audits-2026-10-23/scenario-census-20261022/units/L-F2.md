# L-F2. F2. 인증과 토큰

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/F2-auth-token.md](../../../../../lessons/F2-auth-token.md)

원문 SHA-256: `ba3ca8e4d2d11888592f4a90db2beb95783ab5e9486fa96916ed1565258b2ef1`

## 판정

매 요청 인증, 세션-cookie·DB token·JWT 보관/재시작/철회 차이와 401 인증/403 인가를 구분한다. 후속은 1-6, 10-4, L15다. 연습 controller는 HttpOnly cookie와 같은 sessionId를 JSON으로 내보내 JS에 노출한다. practice-only 코드를 운영에 복사하지 않도록 경계를 명시한다.

## 목표·선수 지식·학습자 작업

매 요청 인증, 세션-cookie·DB token·JWT 보관/재시작/철회 차이와 401 인증/403 인가를 구분한다. 후속은 1-6, 10-4, L15다.

VisitController로 cookie jar/browser count와 재시작을 확인하고 api_token seed에서 1-6 상태를 예측한 뒤 controller를 삭제한다.

## 요구·구현·검사 대조

### 1. cookie jar 동일 session/누락/restart

구현 대조: HttpSession, cookie 예시, restart 후 새 id/count가 수록되며 body에도 sessionId가 있다.

검사 대조: historical curl/browser example; audit no rerun.

공백 또는 한계: sessionId body 노출은 HttpOnly 목적을 우회할 위험이 있어 lab 한정.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F2-auth-token.md](../../../../../lessons/F2-auth-token.md) — 39~104행

### 2. 401/403 및 token principal author

구현 대조: DB token 사례와 1-6 response examples가 제공된다.

검사 대조: 과거 HTTP 기록, 자동 test 없음.

공백 또는 한계: authorId request spoofing 금지, principal 사용.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F2-auth-token.md](../../../../../lessons/F2-auth-token.md) — 105~154행

### 3. 세션·DB token·JWT의 persistence/revoke

구현 대조: 비교표가 세 방식 차이를 설명한다.

검사 대조: 설명/확인 문제; test 없음.

공백 또는 한계: JWT lifecycle 심화는 F5/S13.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F2-auth-token.md](../../../../../lessons/F2-auth-token.md) — 25~36행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

- content: api_token+member join은 token principal/expiry/revocation/status를 보여 준다. 세션은 memory state이며 multi-node에는 공유 저장소가 필요하다.
- current_scope: 매 요청 인증, 세션-cookie·DB token·JWT 보관/재시작/철회 차이와 401 인증/403 인가를 구분한다. 후속은 1-6, 10-4, L15다.
- missing_scope: 연습 controller는 HttpOnly cookie와 같은 sessionId를 JSON으로 내보내 JS에 노출한다. practice-only 코드를 운영에 복사하지 않도록 경계를 명시한다.
- existing_links: 1-6 DB token · 10-4 JWT · L15 session · F7 authorization

- 현재 난이도: 중급 개념/실전 연결 레슨
- 판정 이유: 매 요청 인증, 세션-cookie·DB token·JWT 보관/재시작/철회 차이와 401 인증/403 인가를 구분한다. 후속은 1-6, 10-4, L15다.
- 다음 단계: - 1-6 DB token
  - 10-4 JWT
  - L15 session
  - F7 authorization

## 부족한 점

### G1 · medium

연습 controller는 HttpOnly cookie와 같은 sessionId를 JSON으로 내보내 JS에 노출한다. practice-only 코드를 운영에 복사하지 않도록 경계를 명시한다.

판정 범위: 레슨은 구현 예시와 실습 지시를 제공하며 이번 감사자가 실행/build한 것은 아니다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F2-auth-token.md](../../../../../lessons/F2-auth-token.md) — 25~154행

## 확장 개발 명세

### 세션 식별자를 응답에서 숨긴 쿠키 실험

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

연습 controller는 HttpOnly cookie와 같은 sessionId를 JSON으로 내보내 JS에 노출한다. practice-only 코드를 운영에 복사하지 않도록 경계를 명시한다.

**시작 상태**

원문 지정 local/disposable app 또는 DB를 준비하고 historical output과 new result를 분리한다.

**학습자가 할 일**

- 응답 body에서 sessionId를 제거하고 cookie jar/DevTools로만 관찰하며 로그/body에 식별자가 없는지 검사한다.

**정상 사례**

- cookie jar 동일 session/누락/restart

**실패·경계 사례**

- 세션·DB token·JWT의 persistence/revoke

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
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F2/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F2/screen.jpg`)
- 관찰: 렌더 캡처가 제공되지 않아 시각 검토 대기.
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F2/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F2/dom.txt`)

- source: corpus latest_source 기록에 따름
- html: source 동일, generated HTML hash 상이; screenshot 비교 대기
- comparison: HTML hash difference만으로 강의 내용이 바뀌었다고 판단하지 않는다.
- public_based_extra: 별도 CRUD UI 변경은 lesson 누락으로 보지 않는다.

별도 snapshot 답안 없음. 본문 속 실행결과는 과거 기록이며 auditor는 실행/build하지 않았다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F2-auth-token.md](../../../../../lessons/F2-auth-token.md) — 39~104행 (레슨 본문 코드/설명/과거 실험 결과; 별도 snapshot 없음)
- [$WORKTREE_ROOT/concept-census-20261021/lessons/F2-auth-token.md](../../../../../lessons/F2-auth-token.md) — 105~154행 (레슨 본문 코드/설명/과거 실험 결과; 별도 snapshot 없음)
- [$WORKTREE_ROOT/concept-census-20261021/lessons/F2-auth-token.md](../../../../../lessons/F2-auth-token.md) — 25~36행 (레슨 본문 코드/설명/과거 실험 결과; 별도 snapshot 없음)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-F2.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-F2.json`)
