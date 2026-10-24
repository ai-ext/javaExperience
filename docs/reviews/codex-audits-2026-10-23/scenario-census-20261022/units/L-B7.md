# L-B7. B7. 예외 — try/catch, 체크·언체크

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/B7-exceptions.md](../../../../../lessons/B7-exceptions.md)

원문 SHA-256: `e01061a8fb887858e00072a82f2e0202a1c4c9bd4cf69d3d9d729c498151f970`

## 판정

예외 문법에서 HTTP 번역까지 충분하다. 트랜잭션 전이는 기존 G4로 연결해야 한다. 보완: 예외를 잡고 계속 진행하는 것과 DB 롤백 의미는 이 레슨의 실험 범위가 아니다. 후속 G4가 다루지만 B7의 더깊이 링크는 해당 실습에 직접 이어지지 않는다.

## 목표·선수 지식·학습자 작업

예외 문법에서 HTTP 번역까지 충분하다. 트랜잭션 전이는 기존 G4로 연결해야 한다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. 체크/언체크·catch/finally·미처리 예외를독립 Java로 확인한다.

구현 대조: 존재하지 않는 로컬 파일 읽기와 마지막 미처리 예외로 실패를 의도한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 예외를 잡고 계속 진행하는 것과 DB 롤백 의미는 이 레슨의 실험 범위가 아니다. 후속 G4가 다루지만 B7의 더깊이 링크는 해당 실습에 직접 이어지지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/B7-exceptions.md](../../../../../lessons/B7-exceptions.md) — 56~131행

### 2. 동일 없음 상황을 미처리 500/ResponseStatus 404/커스텀 404로 비교한다.

구현 대조: Controller 코드·상태·본문·로그 차이를 제시한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 예외를 잡고 계속 진행하는 것과 DB 롤백 의미는 이 레슨의 실험 범위가 아니다. 후속 G4가 다루지만 B7의 더깊이 링크는 해당 실습에 직접 이어지지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/B7-exceptions.md](../../../../../lessons/B7-exceptions.md) — 133~242행

### 3. 체크예외 미처리와 넓은 catch 우선의 컴파일 오류를 재현한다.

구현 대조: 구체 수정과 진단 메시지가 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 예외를 잡고 계속 진행하는 것과 DB 롤백 의미는 이 레슨의 실험 범위가 아니다. 후속 G4가 다루지만 B7의 더깊이 링크는 해당 실습에 직접 이어지지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/B7-exceptions.md](../../../../../lessons/B7-exceptions.md) — 244~282행

## 이번 실행 근거

이번 독립 Java 예시 1개를 실행해 예상 출력/예외를 확인했다. Spring·DB·IDE 실습 전체의 실행이 아니다.

$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-lessons/summary.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-lessons/summary.json`)

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: 예외 문법에서 HTTP 번역까지 충분하다. 트랜잭션 전이는 기존 G4로 연결해야 한다.

- 현재 난이도: 입문·기초
- 판정 이유: 예외 문법에서 HTTP 번역까지 충분하다. 트랜잭션 전이는 기존 G4로 연결해야 한다.
- 다음 단계: - S-0-5
  - L-F1
  - L-G4

## 부족한 점

### L-B7-G1 · low

예외를 잡고 계속 진행하는 것과 DB 롤백 의미는 이 레슨의 실험 범위가 아니다. 후속 G4가 다루지만 B7의 더깊이 링크는 해당 실습에 직접 이어지지 않는다.

판정 범위: 해당 레슨과 명시한 후속 경로의 판정이며 전체 개념의 부재를 뜻하지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/B7-exceptions.md](../../../../../lessons/B7-exceptions.md)

## 확장 개발 명세

### L-B7의 후속 실습 보완

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

예외를 잡고 계속 진행하는 것과 DB 롤백 의미는 이 레슨의 실험 범위가 아니다. 후속 G4가 다루지만 B7의 더깊이 링크는 해당 실습에 직접 이어지지 않는다.

**시작 상태**

이 레슨의 제공 예시와 문서에 지정한 선행 단계를 마친 별도 실습 복사본.

**학습자가 할 일**

G4로 연결해 checked/unchecked·catch로삼킴·rollback-only 각 경로의 HTTP 결과와 실제 DB 행을 나란히 확인한다. 동일 예외 문구가 동일 커밋 결과를 뜻한다고 채점하지 않는다.

**정상 사례**

체크/언체크·catch/finally·미처리 예외를독립 Java로 확인한다.

**실패·경계 사례**

G4로 연결해 checked/unchecked·catch로삼킴·rollback-only 각 경로의 HTTP 결과와 실제 DB 행을 나란히 확인한다. 동일 예외 문구가 동일 커밋 결과를 뜻한다고 채점하지 않는다.

**동시성·성능**

본문에 명시한 실험만 수행하며 단일 예시 통과를 동시성/운영 보장으로 확대하지 않는다.

**DB 관찰**

DB를 사용하는 후속이면 응답과 커밋된 행을 별도로 기록한다. 순수 Java 예시는 DB 대상이 아니다.

**합격 기준**

G4로 연결해 checked/unchecked·catch로삼킴·rollback-only 각 경로의 HTTP 결과와 실제 DB 행을 나란히 확인한다. 동일 예외 문구가 동일 커밋 결과를 뜻한다고 채점하지 않는다.

**기존 과제와 중복·연결**

- S-0-5
- L-F1
- L-G4

**우선순위**

P2

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B7/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B7/screen.jpg`)
- 관찰: 없음
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B7/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B7/dom.txt`)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/B7-exceptions.md](../../../../../lessons/B7-exceptions.md) — 1~342행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-B7.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-B7.json`)
