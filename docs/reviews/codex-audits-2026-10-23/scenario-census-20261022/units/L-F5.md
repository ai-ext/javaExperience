# L-F5. F5. JWT 해부 — 토큰 안에 무엇이 있나

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F5-jwt-anatomy.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F5-jwt-anatomy.md)

원문 SHA-256: `629afc479f7af2d70d99a84f07e5c866694734227c90bc290b63d1f42ac57437`

## 판정

JWT 구조·서명/만료와 약한 키/alg=none 실패를 예시로 설명한다. production token lifecycle은 10-4/S13에서 구현하므로 이 단계에 누락으로 세지 않는다.

## 목표·선수 지식·학습자 작업

JWT의 header.payload.signature, Base64URL 인코딩, 서명/만료 검증, HS256 키 길이 및 alg=none 거부를 살펴본다. 실제 로그인은 10-4, 더 깊은 설계는 S13으로 연결한다.

jjwt 0.13.0 예제로 토큰 발급/해독, payload/signature 변조, 만료, 짧은 키, 서명 없는 알고리즘 거부를 확인한 뒤 연습용 키/클래스를 삭제한다.

## 요구·구현·검사 대조

### 1. JWT payload는 Base64URL로 읽을 수 있으나 내용을 바꾸면 서명 검증에 실패한다.

구현 대조: JwtDemo 코드/출력과 payload·signature 변조 관찰이 제공된다.

검사 대조: historical JDK21/JJWT output; not rerun.

공백 또는 한계: payload는 암호화되지 않으므로 비밀값을 넣지 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F5-jwt-anatomy.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F5-jwt-anatomy.md:5) — 5~129행

### 2. 서버가 허용 알고리즘을 정하고 서명·만료를 검사하며 HS256 키는 256비트 이상이어야 한다.

구현 대조: 만료·약한 키·alg=none 예시와 10-4의 JwtException→401 처리 경로를 설명한다.

검사 대조: historical output, not current run.

공백 또는 한계: one HS256 signing key and expiry path only.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F5-jwt-anatomy.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F5-jwt-anatomy.md:130) — 130~230행

### 3. 토큰 저장은 XSS/CSRF 상충관계가 있고 stateless JWT는 서버 상태 없이 만료 전에 즉시 폐기하기 어렵다.

구현 대조: localStorage/HttpOnly-cookie and stolen-token discussion.

검사 대조: conceptual material only; no client test.

공백 또는 한계: follow-up auth lifecycle is in 10-4/S13.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F5-jwt-anatomy.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F5-jwt-anatomy.md:49) — 49~61행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

- content: JWT는 클라이언트가 들고 다니는 서명된 payload다. 기본 검증은 DB 조회 없이 signature와 expiry를 검사한다. denylist/refresh를 더하면 서버 상태/DB 조회가 생긴다.
- current_scope: JWT 3부분 구조, Base64URL, 서명/만료, HS256 키 길이, alg=none 거부를 예시로 보여 주고 실제 login은 10-4로 넘긴다.
- missing_scope: 예제는 sub/iat/exp 및 HS256만 다룬다. issuer/audience, revoke/refresh, key rotation은 10-4/S13로 넘기므로 production 계약으로 오인하지 않는다.
- existing_links: 10-4 JwtProvider · F2 auth lifecycle · S13 JWT/OAuth2 · L15 session comparison

- 현재 난이도: 중급 개념·실전 연결 레슨
- 판정 이유: JWT의 header.payload.signature, Base64URL 인코딩, 서명/만료 검증, HS256 키 길이 및 alg=none 거부를 살펴본다. 실제 로그인은 10-4, 더 깊은 설계는 S13으로 연결한다.
- 다음 단계: - 10-4 JwtProvider
  - F2 auth lifecycle
  - S13 JWT/OAuth2
  - L15 session comparison

## 부족한 점

### G1 · medium

예제는 sub/iat/exp 및 HS256만 다룬다. issuer/audience, revoke/refresh, key rotation은 10-4/S13로 넘기므로 production 계약으로 오인하지 않는다.

판정 범위: 예시/과거 관찰을 본편 구현 또는 이번 감사 실행으로 혼동하지 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F5-jwt-anatomy.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F5-jwt-anatomy.md:5) — 5~230행

## 확장 개발 명세

### JWT claim 및 key lifecycle 검증 확장

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

예제는 sub/iat/exp 및 HS256만 다룬다. issuer/audience, revoke/refresh, key rotation은 10-4/S13로 넘기므로 production 계약으로 오인하지 않는다.

**시작 상태**

원문 지정 앱/격리 DB를 준비하고 source의 과거 출력과 이번 관찰을 분리한다. 기존 DB volume은 초기화하지 않는다.

**학습자가 할 일**

- 10-4 후속에서 issuer/audience/exp/nbf, key rotation, revoke/refresh 정책을 정한다.
- 잘못된 claim/signature/만료 토큰이 일관된 401을 받는지 test한다.

**정상 사례**

- 유효 key와 정상 exp/claim이면 검증을 통과한다.

**실패·경계 사례**

- 잘못된 claim/signature, 만료 토큰은 uniform 401이며 내부 상세를 노출하지 않는다.

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
- 화면 증거: - [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F5/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F5/screen.jpg)
- 관찰: 렌더 캡처 미제공으로 검토 대기.
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F5/dom.txt](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F5/dom.txt)

원문: corpus의 latest_source_same=True. 최신 HTML byte 해시 다름; 실제 캡처 기반 렌더 비교 전이므로 시각 차이는 pending_render. 원문 SHA/HTML 차이만으로 UI의 정확성이나 시각 완료를 추정하지 않는다.

별도 snapshot 답안은 없다. 본문에 포함된 실행 결과는 과거 기록이며 감사자는 실행/build하지 않았다.

## 읽은 구현 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F5-jwt-anatomy.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F5-jwt-anatomy.md:5) — 5~129행 (레슨 본문 설명/코드/과거 실험 기록; 별도 snapshot 없음)
- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F5-jwt-anatomy.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F5-jwt-anatomy.md:130) — 130~230행 (레슨 본문 설명/코드/과거 실험 기록; 별도 snapshot 없음)
- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F5-jwt-anatomy.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/F5-jwt-anatomy.md:49) — 49~61행 (레슨 본문 설명/코드/과거 실험 기록; 별도 snapshot 없음)

구조화 원본: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-F5.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-F5.json)
