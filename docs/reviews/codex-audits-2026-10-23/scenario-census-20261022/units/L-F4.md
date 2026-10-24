# L-F4. F4. 비밀번호 저장 — 해시·salt·BCrypt

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/F4-password-storage.md](../../../../../lessons/F4-password-storage.md)

원문 SHA-256: `57aad9832363d5db29d5be7eaad186323786d68e4072d924c733dfb2f687d315`

## 판정

salted adaptive password hashing과 matches, BCrypt cost, 72-byte UTF-8 경계를 설명한다. 10-3 MaxBytes와 연결한다. cost timings lack CPU/JDK/provider/repetition metadata and cannot serve as portable benchmark.

## 목표·선수 지식·학습자 작업

salted adaptive password hashing과 matches, BCrypt cost, 72-byte UTF-8 경계를 설명한다. 10-3 MaxBytes와 연결한다.

security-crypto demo로 SHA/BCrypt, seed hash, cost, byte limit, Delegating prefix mismatch를 관찰하고 임시 코드를 지운다.

## 요구·구현·검사 대조

### 1. salt/matches/seed hash

구현 대조: Demo 출력은 SHA-256이 같은 입력에 같은 해시를 주고 BCrypt는 salt 때문에 달라지며, matches/seed hash/encoded 구조를 보여 준다.

검사 대조: historical run, no audit rerun.

공백 또는 한계: encode한 두 결과를 equals 비교하면 salt 차이 때문에 서로 일치하지 않는다. matches로 비교한다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F4-password-storage.md](../../../../../lessons/F4-password-storage.md) — 54~128행

### 2. 72-byte vs character limit

구현 대조: ASCII 72/73-byte 및 한글 25자 경계를 보여 주며 exception과 10-3 MaxBytes 연결을 설명한다.

검사 대조: historical Spring Security run only.

공백 또는 한계: implementation version limit must be verified.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F4-password-storage.md](../../../../../lessons/F4-password-storage.md) — 189~217행

### 3. Delegating prefix compatibility

구현 대조: prefix/raw hash mismatch outputs.

검사 대조: not rerun.

공백 또는 한계: one encoder/storage format policy.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F4-password-storage.md](../../../../../lessons/F4-password-storage.md) — 219~235행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

- content: DB에는 salt/cost가 포함된 encoded password hash를 저장하며 BCrypt 전에 byte cap을 검사한다. Cost 측정값은 machine-dependent다.
- current_scope: salted adaptive password hashing과 matches, BCrypt cost, 72-byte UTF-8 경계를 설명한다. 10-3 MaxBytes와 연결한다.
- missing_scope: Cost timing에는 CPU/JDK/provider/repetition metadata가 없어 서로 비교 가능한 benchmark로 볼 수 없다.
- existing_links: 10-3 BCryptPasswordEncoder/MaxBytes 검증, F6의 UTF-8 바이트 길이, F5의 JWT, OWASP 암호 저장 권고 문서.

- 현재 난이도: 중급 개념/실전 연결 레슨
- 판정 이유: salted adaptive password hashing과 matches, BCrypt cost, 72-byte UTF-8 경계를 설명한다. 10-3 MaxBytes와 연결한다.
- 다음 단계: - 10-3 BCrypt/MaxBytes
  - F6 byte length
  - F5 JWT
  - OWASP password storage

## 부족한 점

### G1 · medium

Cost timing에는 CPU/JDK/provider/repetition metadata가 없어 서로 비교 가능한 benchmark로 볼 수 없다.

판정 범위: 레슨은 구현 예시와 실습 지시를 제공하며 이번 감사자가 실행/build한 것은 아니다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F4-password-storage.md](../../../../../lessons/F4-password-storage.md) — 54~235행

## 확장 개발 명세

### BCrypt cost와 UTF-8 bytes 측정 재현성

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

Cost timing에는 CPU/JDK/provider/repetition metadata가 없어 서로 비교 가능한 benchmark로 볼 수 없다.

**시작 상태**

원문 지정 local/disposable app 또는 DB를 준비하고 historical output과 new result를 분리한다.

**학습자가 할 일**

- environment metadata, warmup/repeats/median을 고정해 encode/matches latency를 분리하고 10-3 byte validator를 검증한다.

**정상 사례**

- salt/matches/seed hash

**실패·경계 사례**

- Delegating prefix compatibility

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
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F4/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F4/screen.jpg`)
- 관찰: 렌더 캡처가 제공되지 않아 시각 검토 대기.
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F4/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-F4/dom.txt`)

- source: corpus latest_source 기록에 따름
- html: source 동일, generated HTML hash 상이; screenshot 비교 대기
- comparison: HTML hash difference만으로 강의 내용이 바뀌었다고 판단하지 않는다.
- public_based_extra: 별도 CRUD UI 변경은 lesson 누락으로 보지 않는다.

별도 snapshot 답안 없음. 본문 속 실행결과는 과거 기록이며 auditor는 실행/build하지 않았다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/F4-password-storage.md](../../../../../lessons/F4-password-storage.md) — 54~128행 (레슨 본문 코드/설명/과거 실험 결과; 별도 snapshot 없음)
- [$WORKTREE_ROOT/concept-census-20261021/lessons/F4-password-storage.md](../../../../../lessons/F4-password-storage.md) — 189~217행 (레슨 본문 코드/설명/과거 실험 결과; 별도 snapshot 없음)
- [$WORKTREE_ROOT/concept-census-20261021/lessons/F4-password-storage.md](../../../../../lessons/F4-password-storage.md) — 219~235행 (레슨 본문 코드/설명/과거 실험 결과; 별도 snapshot 없음)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-F4.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-F4.json`)
