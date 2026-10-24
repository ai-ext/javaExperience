# L-G4. G4. 트랜잭션 실전 — 롤백 규칙·readOnly·전파·프록시 함정

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/G4-transaction-in-practice.md](../../../../../lessons/G4-transaction-in-practice.md)

원문 SHA-256: `a56457819be1661e7c1dcd0ba96a34e59a215ccd3dd235381d5775895337569f`

## 판정

@Transactional behavior depends on proxy entry, exception type, propagation and readOnly. Self-invocation may bypass the proxy. Outputs are scoped to the stated standalone Boot/MySQL setup and are historical. No automated regression suite or REQUIRES_NEW pool capacity measurement is provided.

## 목표·선수 지식·학습자 작업

@Transactional은 proxy entry, exception type, propagation/readOnly 설정에 달린다. self-invocation은 proxy를 우회할 수 있다.

Standalone Boot 4.1.1/JPA/MySQL 예제에서 tx name/state log와 final rows를 checked exception, self call, REQUIRES_NEW, readOnly JDBC/JPA, catch exception별로 확인한다.

## 요구·구현·검사 대조

### 1. Checked exception은 기본 커밋되고 rollbackFor가 명시적 rollback rule을 더한다.

구현 대조: logs는 checkedDefault commit과 checkedRollbackFor rollback, DB row 결과를 비교한다.

검사 대조: source historical output; 재실행하지 않았다.

공백 또는 한계: 프록시를 통한 transactional call에서 적용되는 규칙이다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/G4-transaction-in-practice.md](../../../../../lessons/G4-transaction-in-practice.md) — 5~67행

### 2. proxy는 외부 call을 intercept하며 같은 객체 self-invocation은 inner @Transactional/REQUIRES_NEW를 적용하지 않는다.

구현 대조: TxProbe는 this-call에서 inner transaction이 없고 다른 bean 호출은 outer suspend/inner commit을 보인다.

검사 대조: historical logs only; 현재 실행 없음.

공백 또는 한계: 실제 proxy를 통과하는 bean boundary가 필요하다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/G4-transaction-in-practice.md](../../../../../lessons/G4-transaction-in-practice.md) — 17~153행

### 3. readOnly는 보편적인 write block이 아니며 JDBC 거부는 driver-specific, JPA dirty-check 변경은 저장되지 않을 수 있다.

구현 대조: lesson은 JDBC insert error와 E7 JPA dirty-check 결과를 대조하고 readOnly를 optimization hint라 설명한다.

검사 대조: source historical MySQL driver output; rerun 없음.

공백 또는 한계: readOnly를 authorization/integrity guard로 쓰면 안 된다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/G4-transaction-in-practice.md](../../../../../lessons/G4-transaction-in-practice.md) — 154~181행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

- content: JpaTransactionManager logs와 DB rows로 transaction start/participation/commit/rollback을 관찰한다. REQUIRES_NEW는 outer transaction suspend와 추가 connection이 필요하다.
- current_scope: rollback 규칙, proxy interception, transaction propagation 및 readOnly 동작.
- missing_scope: 기록은 Boot/MySQL 실험환경에 한정된 historical observation이다. automated regression test와 REQUIRES_NEW pool capacity 측정은 없다.
- existing_links: G3 트랜잭션 기초, S08 전파와 rollback 규칙, S02 관점지향 프록시, 16-1 커밋 이후 새 트랜잭션, 16-2 비동기 실행 문맥, E7 읽기 전용.

- 현재 난이도: 중급 개념·실전 연결 레슨
- 판정 이유: 프록시 호출 흐름과 예외/전파 설정을 DB commit state 및 transaction log에 연결한다.
- 다음 단계: - G3 transaction basics
  - S08 propagation/rollback
  - S02 AOP proxy
  - 16-1 after-commit/REQUIRES_NEW
  - 16-2 async context
  - E7 readOnly

## 부족한 점

### G1 · medium

기록은 Boot/MySQL 실험환경에 한정된 historical observation이다. automated regression test와 REQUIRES_NEW pool capacity 측정은 없다.

판정 범위: source historical output은 이번 감사 실행이 아니다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/G4-transaction-in-practice.md](../../../../../lessons/G4-transaction-in-practice.md) — 5~181행

## 확장 개발 명세

### 각 transaction trap의 상태/행 결과 integration assertions

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

기록은 Boot/MySQL 실험환경에 한정된 historical observation이다. automated regression test와 REQUIRES_NEW pool capacity 측정은 없다.

**시작 상태**

원문 지정 isolated app/DB에서 시작하고 historical output과 새 관찰을 나눠 기록한다. 기존 volume은 초기화하지 않는다.

**학습자가 할 일**

- 각 trap에서 transaction active/name, rollback-only와 final persisted rows를 단언한다.
- REQUIRES_NEW를 동시에 사용할 때만 pool headroom을 측정한다.

**정상 사례**

- source가 제시한 정상 case 결과와 상태를 확인한다.

**실패·경계 사례**

- 실패 예시 exception/HTTP response/DB side effect를 분리 확인한다.

**동시성·성능**

원문에 직접 나오는 동시성/성능만 환경·요청 수를 고정해 측정한다.

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
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-G4/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-G4/screen.jpg`)
- 관찰: 렌더 캡처 대기 중.
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-G4/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-G4/dom.txt`)

원문: corpus의 latest_source_same=True. 최신 HTML byte 해시 다름; 실제 캡처 기반 렌더 비교 전이므로 시각 차이는 pending_render. 원문 SHA/HTML 차이만으로 UI의 정확성이나 시각 완료를 추정하지 않는다.

별도 snapshot 구현 없음. lesson output은 과거 관찰이며 감사자는 실행/build하지 않았다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/G4-transaction-in-practice.md](../../../../../lessons/G4-transaction-in-practice.md) — 5~67행 (레슨 본문 예시/역사적 실험; 별도 snapshot 없음)
- [$WORKTREE_ROOT/concept-census-20261021/lessons/G4-transaction-in-practice.md](../../../../../lessons/G4-transaction-in-practice.md) — 17~153행 (레슨 본문 예시/역사적 실험; 별도 snapshot 없음)
- [$WORKTREE_ROOT/concept-census-20261021/lessons/G4-transaction-in-practice.md](../../../../../lessons/G4-transaction-in-practice.md) — 154~181행 (레슨 본문 예시/역사적 실험; 별도 snapshot 없음)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-G4.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-G4.json`)
