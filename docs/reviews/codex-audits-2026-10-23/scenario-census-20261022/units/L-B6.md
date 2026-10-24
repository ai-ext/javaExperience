# L-B6. B6. List·Map·Optional·람다 맛보기 — 목록 거르기·바꾸기와 없는 값

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/B6-collections-optional-lambda.md](../../../../../lessons/B6-collections-optional-lambda.md)

원문 SHA-256: `7d66b2ad9f00b423145ec3b85669166adc7d137789fa4aef5911cc54e666583c`

## 판정

맛보기로 선언한 범위의 정상·실패·응용이 충분하다. 전체 DB 데이터를 stream으로 옮겨 필터링하는 성능 설계까지 이 레슨의 통과가 보장하지 않는다. 입문 목표 기준 추가 필수 과제를 발견하지 않았다.

## 목표·선수 지식·학습자 작업

맛보기로 선언한 범위의 정상·실패·응용이 충분하다. 전체 DB 데이터를 stream으로 옮겨 필터링하는 성능 설계까지 이 레슨의 통과가 보장하지 않는다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. List 변환·Map 조회/순서·Optional 존재/부재를 jshell로 확인한다.

구현 대조: 예상 값과 Map.of 순서 비보장을 구분한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 이 계약의 입문 목표에 대해 별도 공백을 확인하지 않았다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/B6-collections-optional-lambda.md](../../../../../lessons/B6-collections-optional-lambda.md) — 47~166행

### 2. 불변컬렉션 수정·기본형 generic·빈 Optional.get을 실패시킨다.

구현 대조: 실패 타입과 수정 방향을 구체화한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 이 계약의 입문 목표에 대해 별도 공백을 확인하지 않았다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/B6-collections-optional-lambda.md](../../../../../lessons/B6-collections-optional-lambda.md) — 168~218행

### 3. filter/map과 저장소의 orElseThrow를 직접 작성한다.

구현 대조: 좋아요5/20/11 입력의[b,c] 등 전이 문제가 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 이 계약의 입문 목표에 대해 별도 공백을 확인하지 않았다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/B6-collections-optional-lambda.md](../../../../../lessons/B6-collections-optional-lambda.md) — 220~273행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: 맛보기로 선언한 범위의 정상·실패·응용이 충분하다. 전체 DB 데이터를 stream으로 옮겨 필터링하는 성능 설계까지 이 레슨의 통과가 보장하지 않는다.

- 현재 난이도: 입문·기초
- 판정 이유: 맛보기로 선언한 범위의 정상·실패·응용이 충분하다. 전체 DB 데이터를 stream으로 옮겨 필터링하는 성능 설계까지 이 레슨의 통과가 보장하지 않는다.
- 다음 단계: - L-B7

## 부족한 점

이 단위의 명시된 학습 목표에서 별도 공백을 확인하지 않았다. 모든 운영 요구가 충족되었다는 뜻은 아니다.

## 확장 개발 명세

새 중복 과제를 추가하지 않는다. 기존 후속 단계와 함께 학습한다.

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B6/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B6/screen.jpg`)
- 관찰: 없음
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B6/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B6/dom.txt`)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/B6-collections-optional-lambda.md](../../../../../lessons/B6-collections-optional-lambda.md) — 1~273행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-B6.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-B6.json`)
