# L-B2. B2. 클래스·객체·생성자·this — 객체를 찍어 내는 틀

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/B2-classes-objects-constructors.md](../../../../../lessons/B2-classes-objects-constructors.md)

원문 SHA-256: `3a2a4e1e54a0f4b47c359655328dfdb442d5edb36b32e4ad2686d197386055b4`

## 판정

입문 목표에 대해 정상·컴파일 실패·조용한 논리 오류·후속 적용이 충분하다. 고급 생성 패턴은 P04 참조에 맡긴다. 입문 목표 기준 추가 필수 과제를 발견하지 않았다.

## 목표·선수 지식·학습자 작업

입문 목표에 대해 정상·컴파일 실패·조용한 논리 오류·후속 적용이 충분하다. 고급 생성 패턴은 P04 참조에 맡긴다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. 생성자 오버로드·참조 공유·기본생성자를 실행한다.

구현 대조: Member/Post의 독립 실행 예시와 정확한 출력이 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 이 계약의 입문 목표에 대해 별도 공백을 확인하지 않았다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/B2-classes-objects-constructors.md](../../../../../lessons/B2-classes-objects-constructors.md) — 35~118행

### 2. 생성자 추가·this 누락·void 생성자 오류를 재현한다.

구현 대조: 컴파일 실패와 컴파일은 되지만 null 인 실패를 구분한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 이 계약의 입문 목표에 대해 별도 공백을 확인하지 않았다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/B2-classes-objects-constructors.md](../../../../../lessons/B2-classes-objects-constructors.md) — 120~194행

### 3. 생성자 규칙을 Jackson/JPA로 옮긴다.

구현 대조: JPA 기본 생성자 오류와0-1/B3/B4에 연결한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 이 계약의 입문 목표에 대해 별도 공백을 확인하지 않았다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/B2-classes-objects-constructors.md](../../../../../lessons/B2-classes-objects-constructors.md) — 196~254행

## 이번 실행 근거

이번 독립 Java 예시 3개를 실행해 예상 출력/예외를 확인했다. Spring·DB·IDE 실습 전체의 실행이 아니다.

$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-lessons/summary.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-lessons/summary.json`)

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: 입문 목표에 대해 정상·컴파일 실패·조용한 논리 오류·후속 적용이 충분하다. 고급 생성 패턴은 P04 참조에 맡긴다.

- 현재 난이도: 입문·기초
- 판정 이유: 입문 목표에 대해 정상·컴파일 실패·조용한 논리 오류·후속 적용이 충분하다. 고급 생성 패턴은 P04 참조에 맡긴다.
- 다음 단계: - S-0-1
  - L-B3
  - L-B4
  - L-E3

## 부족한 점

이 단위의 명시된 학습 목표에서 별도 공백을 확인하지 않았다. 모든 운영 요구가 충족되었다는 뜻은 아니다.

## 확장 개발 명세

새 중복 과제를 추가하지 않는다. 기존 후속 단계와 함께 학습한다.

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B2/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B2/screen.jpg`)
- 관찰: 없음
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B2/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B2/dom.txt`)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/B2-classes-objects-constructors.md](../../../../../lessons/B2-classes-objects-constructors.md) — 1~254행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-B2.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-B2.json`)
