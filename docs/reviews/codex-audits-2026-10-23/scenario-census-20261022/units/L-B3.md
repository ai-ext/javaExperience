# L-B3. B3. static과 안쪽 클래스 — DTO 함정의 뿌리

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/B3-static-and-inner-classes.md](../../../../../lessons/B3-static-and-inner-classes.md)

원문 SHA-256: `e570546429e726f3cd011ebf6c9d03167e4dd19bf46ff86a5043416c0dff4162`

## 판정

문법→바이트코드→Jackson 실패→수정의 관찰이 연결돼 있다. static 카운터 예시는 순차 관찰이며 동시성 보장을 뜻하지 않는다. 입문 목표 기준 추가 필수 과제를 발견하지 않았다.

## 목표·선수 지식·학습자 작업

문법→바이트코드→Jackson 실패→수정의 관찰이 연결돼 있다. static 카운터 예시는 순차 관찰이며 동시성 보장을 뜻하지 않는다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. static 공유 필드와 inner/nested/record 생성자 차이를 실행·javap로 확인한다.

구현 대조: 독립 Java 코드와 숨은 외부 객체 인자의 예상 출력이 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 이 계약의 입문 목표에 대해 별도 공백을 확인하지 않았다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/B3-static-and-inner-classes.md](../../../../../lessons/B3-static-and-inner-classes.md) — 44~159행

### 2. 같은 JSON을 inner/nested/record DTO에 보내 500/200 차이를 보고 고친다.

구현 대조: 완전한 Controller와3개 curl 및 static 수정 후 200 확인이 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 이 계약의 입문 목표에 대해 별도 공백을 확인하지 않았다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/B3-static-and-inner-classes.md](../../../../../lessons/B3-static-and-inner-classes.md) — 161~246행

### 3. static에서 인스턴스 접근과 외부 객체 없는 inner 생성을 실패시킨다.

구현 대조: 컴파일 오류와 DTO 수정 대안을 구분한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 이 계약의 입문 목표에 대해 별도 공백을 확인하지 않았다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/B3-static-and-inner-classes.md](../../../../../lessons/B3-static-and-inner-classes.md) — 248~282행

## 이번 실행 근거

이번 독립 Java 예시 2개를 실행해 예상 출력/예외를 확인했다. Spring·DB·IDE 실습 전체의 실행이 아니다.

$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-lessons/summary.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-lessons/summary.json`)

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: 문법→바이트코드→Jackson 실패→수정의 관찰이 연결돼 있다. static 카운터 예시는 순차 관찰이며 동시성 보장을 뜻하지 않는다.

- 현재 난이도: 입문·기초
- 판정 이유: 문법→바이트코드→Jackson 실패→수정의 관찰이 연결돼 있다. static 카운터 예시는 순차 관찰이며 동시성 보장을 뜻하지 않는다.
- 다음 단계: - S-0-4
  - L-B4

## 부족한 점

이 단위의 명시된 학습 목표에서 별도 공백을 확인하지 않았다. 모든 운영 요구가 충족되었다는 뜻은 아니다.

## 확장 개발 명세

새 중복 과제를 추가하지 않는다. 기존 후속 단계와 함께 학습한다.

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B3/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B3/screen.jpg`)
- 관찰: 없음
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B3/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B3/dom.txt`)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/B3-static-and-inner-classes.md](../../../../../lessons/B3-static-and-inner-classes.md) — 1~335행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-B3.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-B3.json`)
