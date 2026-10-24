# L-B8. B8. 어노테이션은 무엇인가 — 붙여 둔 표시, 읽는 쪽은 따로 있다

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B8-annotations.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B8-annotations.md)

원문 SHA-256: `296856ac08c47e1a34144439212d0eb13b33c13c083e383646c0b67c907bea96`

## 판정

표시·읽는 주체·시점·실패를 구체 실험으로 연결한다. 빈 생명주기까지 이 레슨 하나가 담당할 필요는 없다. 입문 목표 기준 추가 필수 과제를 발견하지 않았다.

## 목표·선수 지식·학습자 작업

표시·읽는 주체·시점·실패를 구체 실험으로 연결한다. 빈 생명주기까지 이 레슨 하나가 담당할 필요는 없다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. 자작 Route를 리플렉션으로 읽고 실제 메서드를 호출한다.

구현 대조: AnnotationDemo 전체 코드와 정렬된5줄 출력이 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 이 계약의 입문 목표에 대해 별도 공백을 확인하지 않았다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B8-annotations.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B8-annotations.md:34) — 34~105행

### 2. JsonProperty/JsonIgnore·Controller 표시 유무를 HTTP 응답으로 비교한다.

구현 대조: 별도 Controller 코드와3개 curl·404→200 복구를 제시한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 이 계약의 입문 목표에 대해 별도 공백을 확인하지 않았다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B8-annotations.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B8-annotations.md:107) — 107~187행

### 3. Override 오타와 Retention 제거를 각각 컴파일/런타임 관찰로 구별한다.

구현 대조: 조용한 실패와 수정 후 결과가 명시된다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 이 계약의 입문 목표에 대해 별도 공백을 확인하지 않았다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B8-annotations.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B8-annotations.md:189) — 189~237행

## 이번 실행 근거

이번 독립 Java 예시 1개를 실행해 예상 출력/예외를 확인했다. Spring·DB·IDE 실습 전체의 실행이 아니다.

[/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-lessons/summary.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-lessons/summary.json)

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: 표시·읽는 주체·시점·실패를 구체 실험으로 연결한다. 빈 생명주기까지 이 레슨 하나가 담당할 필요는 없다.

- 현재 난이도: 입문·기초
- 판정 이유: 표시·읽는 주체·시점·실패를 구체 실험으로 연결한다. 빈 생명주기까지 이 레슨 하나가 담당할 필요는 없다.
- 다음 단계: - S-0-2
  - S-0-4

## 부족한 점

이 단위의 명시된 학습 목표에서 별도 공백을 확인하지 않았다. 모든 운영 요구가 충족되었다는 뜻은 아니다.

## 확장 개발 명세

새 중복 과제를 추가하지 않는다. 기존 후속 단계와 함께 학습한다.

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B8/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B8/screen.jpg)
- 관찰: 없음
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B8/dom.txt](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B8/dom.txt)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B8-annotations.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B8-annotations.md:1) — 1~291행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-B8.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-B8.json)
