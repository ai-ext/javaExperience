# L-G3. G3. 트랜잭션 첫 만남 — 왜 한 번에 커밋하나

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/G3-first-transaction.md](../../../../../lessons/G3-first-transaction.md)

원문 SHA-256: `edd046d8d2586cefe92e3109d9f4ad2e3fbce6322c752fa08cd240af98466921`

## 판정

post와 post_tag를 한 service transaction으로 저장해야 하고 실패한 SQL statement만 자동 rollback되지 않는다. standalone app 관찰은 source의 과거 기록이며 G4에서 proxy/rollback 세부로 이어진다.

## 목표·선수 지식·학습자 작업

post/post_tag 여러 write는 한 Service transaction으로 묶어 all-or-nothing이 돼야 한다. MySQL statement failure만으로 앞선 write가 rollback되지는 않아 app이 rollback해야 한다.

temporary MySQL tables로 transaction/rollback/commit/autocommit을 보고 standalone Spring Boot/JPA app에서 @Transactional 유무 및 checked exception을 비교한다.

## 요구·구현·검사 대조

### 1. Service transaction 없이는 이전 save가 개별 commit될 수 있고 @Transactional runtime failure는 업무 전체를 rollback한다.

구현 대조: MySQL/Spring log 예시가 반쪽 post와 전체 rollback 차이를 보여 준다.

검사 대조: historical Boot/MySQL output, rerun하지 않았다.

공백 또는 한계: Repository save의 개별 transaction은 proxy를 거치는 call을 전제하며 self-call은 G4다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/G3-first-transaction.md](../../../../../lessons/G3-first-transaction.md) — 5~193행

### 2. 실패한 statement 하나는 열린 MySQL transaction의 이전 성공 statement를 자동으로 취소하지 않는다.

구현 대조: temporary table에서 post는 실패 뒤에도 보이며 ROLLBACK은 모두 없애고 COMMIT은 성공한 write를 확정한다.

검사 대조: source에 적힌 SQL session output만 있으며 재실행 안 함.

공백 또는 한계: 동일 connection에서 실행해야 하며 temp table은 connection-local임을 lesson이 경고한다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/G3-first-transaction.md](../../../../../lessons/G3-first-transaction.md) — 21~112행

### 3. Spring default rollback은 unchecked exception에 적용되며 rollback 뒤 auto_increment id는 재사용되지 않는다.

구현 대조: checked Exception example commit과 ID gap/rollbackFor 확인 문제를 제공한다.

검사 대조: historical app output, audit rerun 없음.

공백 또는 한계: proxy/rollback-only/propagation은 G4가 이어받는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/G3-first-transaction.md](../../../../../lessons/G3-first-transaction.md) — 217~278행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

- content: 예시는 post/post_tag write, 같은 session visibility, 다른 connection에서의 commit 관찰, auto_increment gap과 Repository save transaction boundaries를 연결한다.
- current_scope: post/tag 원자성, statement failure, rollback, visibility/commit.
- missing_scope: Standalone app observation은 자동 test가 아니며 현재 감사에서 재실행하지 않았다. proxy/self-invocation/propagation은 G4 범위다.
- existing_links: 1-3 글과 태그 transaction, W11 service boundary, G4 rollback/proxy, 2-1 readOnly, H1 concurrency.

- 현재 난이도: 중급 개념·실전 연결 레슨
- 판정 이유: 여러 SQL write가 실패할 때 partial row가 남는지 transaction boundary와 exception type으로 설명한다.
- 다음 단계: - 1-3 post+tag transaction
  - W11 service transaction boundary
  - G4 rollback/proxy
  - 2-1 readOnly
  - H1 concurrency

## 부족한 점

### G1 · medium

Standalone app observation은 자동 test가 아니며 현재 감사에서 재실행하지 않았다. proxy/self-invocation/propagation은 G4 범위다.

판정 범위: source historical output은 이번 감사 실행이 아니다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/G3-first-transaction.md](../../../../../lessons/G3-first-transaction.md) — 5~278행

## 확장 개발 명세

### 태그 저장 실패 transaction atomicity 재현

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

Standalone app observation은 자동 test가 아니며 현재 감사에서 재실행하지 않았다. proxy/self-invocation/propagation은 G4 범위다.

**시작 상태**

원문 지정 isolated app/DB에서 시작하고 historical output과 새 관찰을 나눠 기록한다. 기존 volume은 초기화하지 않는다.

**학습자가 할 일**

- disposable MySQL에서 두 번째 tag insert를 fault-inject한다.
- 서비스 transaction on/off 및 checked/unchecked failure 뒤 post/post_tag 행을 비교한다.

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
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-G3/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-G3/screen.jpg`)
- 관찰: 렌더 캡처 대기 중.
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-G3/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-G3/dom.txt`)

원문: corpus의 latest_source_same=True. 최신 HTML byte 해시 다름; 실제 캡처 기반 렌더 비교 전이므로 시각 차이는 pending_render. 원문 SHA/HTML 차이만으로 UI의 정확성이나 시각 완료를 추정하지 않는다.

별도 snapshot 구현 없음. lesson output은 과거 관찰이며 감사자는 실행/build하지 않았다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/G3-first-transaction.md](../../../../../lessons/G3-first-transaction.md) — 5~193행 (레슨 본문 예시/역사적 실험; 별도 snapshot 없음)
- [$WORKTREE_ROOT/concept-census-20261021/lessons/G3-first-transaction.md](../../../../../lessons/G3-first-transaction.md) — 21~112행 (레슨 본문 예시/역사적 실험; 별도 snapshot 없음)
- [$WORKTREE_ROOT/concept-census-20261021/lessons/G3-first-transaction.md](../../../../../lessons/G3-first-transaction.md) — 217~278행 (레슨 본문 예시/역사적 실험; 별도 snapshot 없음)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-G3.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-G3.json`)
