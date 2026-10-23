# L-D1. D1. JSON과 Jackson — 본문이 객체가 되기까지

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/D1-json-jackson.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/D1-json-jackson.md)

원문 SHA-256: `3a12957a20ed1bc0c9d1a0d16fd619b6e0dffc95c83ecb2bb6a7fdd259f7324d`

## 판정

입력 변환의 여러 숨은 실패와 정확한 값을 다룬다. 수량·금액을 지키는 서버 측 거부 계약으로 전이할 필요가 있다. 보완: 소수2.7을정수2로받는 문제는 재현하지만 정수계약을 서버에서 거부하도록 고친 뒤 400/DB 무변경을 확인하는 과제는 없다. 클라이언트에 정수로 보내라고 적는 것만으로 서버 계약이 검증되지는 않는다.

## 목표·선수 지식·학습자 작업

입력 변환의 여러 숨은 실패와 정확한 값을 다룬다. 수량·금액을 지키는 서버 측 거부 계약으로 전이할 필요가 있다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. 숫자·null·날짜·큰 ID·키이름/무시 규칙을 같은 echo에서 비교한다.

구현 대조: 완전한 Controller·예상객체/JSON·JS 정밀도반례가 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 소수2.7을정수2로받는 문제는 재현하지만 정수계약을 서버에서 거부하도록 고친 뒤 400/DB 무변경을 확인하는 과제는 없다. 클라이언트에 정수로 보내라고 적는 것만으로 서버 계약이 검증되지는 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/D1-json-jackson.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/D1-json-jackson.md:93) — 93~223행

### 2. 잘못된키·시간대·소수→정수 변환을 실패와 조용한 변형으로 구분한다.

구현 대조: unknown 키거부설정/검증연결과 Z/+09차이를 제시한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 소수2.7을정수2로받는 문제는 재현하지만 정수계약을 서버에서 거부하도록 고친 뒤 400/DB 무변경을 확인하는 과제는 없다. 클라이언트에 정수로 보내라고 적는 것만으로 서버 계약이 검증되지는 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/D1-json-jackson.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/D1-json-jackson.md:225) — 225~262행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: 입력 변환의 여러 숨은 실패와 정확한 값을 다룬다. 수량·금액을 지키는 서버 측 거부 계약으로 전이할 필요가 있다.

- 현재 난이도: 입문·기초
- 판정 이유: 입력 변환의 여러 숨은 실패와 정확한 값을 다룬다. 수량·금액을 지키는 서버 측 거부 계약으로 전이할 필요가 있다.
- 다음 단계: - S-1-1
  - S-1-5
  - L-F6

## 부족한 점

### L-D1-G1 · low

소수2.7을정수2로받는 문제는 재현하지만 정수계약을 서버에서 거부하도록 고친 뒤 400/DB 무변경을 확인하는 과제는 없다. 클라이언트에 정수로 보내라고 적는 것만으로 서버 계약이 검증되지는 않는다.

판정 범위: 해당 레슨과 명시한 후속 경로의 판정이며 전체 개념의 부재를 뜻하지 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/D1-json-jackson.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/D1-json-jackson.md)

## 확장 개발 명세

### L-D1의 후속 실습 보완

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

소수2.7을정수2로받는 문제는 재현하지만 정수계약을 서버에서 거부하도록 고친 뒤 400/DB 무변경을 확인하는 과제는 없다. 클라이언트에 정수로 보내라고 적는 것만으로 서버 계약이 검증되지는 않는다.

**시작 상태**

이 레슨의 제공 예시와 문서에 지정한 선행 단계를 마친 별도 실습 복사본.

**학습자가 할 일**

수량 정수 API에2/2.7/문자열3/null/누락을 보낸다. 정한형식외입력은 400이고저장행은0, 정상2는정확히2로저장됨을확인한다. 기존1-5/F6 검증과 연결하며 JSON 변환후 값만보는검증의한계를설명한다.

**정상 사례**

숫자·null·날짜·큰 ID·키이름/무시 규칙을 같은 echo에서 비교한다.

**실패·경계 사례**

수량 정수 API에2/2.7/문자열3/null/누락을 보낸다. 정한형식외입력은 400이고저장행은0, 정상2는정확히2로저장됨을확인한다. 기존1-5/F6 검증과 연결하며 JSON 변환후 값만보는검증의한계를설명한다.

**동시성·성능**

본문에 명시한 실험만 수행하며 단일 예시 통과를 동시성/운영 보장으로 확대하지 않는다.

**DB 관찰**

DB를 사용하는 후속이면 응답과 커밋된 행을 별도로 기록한다. 순수 Java 예시는 DB 대상이 아니다.

**합격 기준**

수량 정수 API에2/2.7/문자열3/null/누락을 보낸다. 정한형식외입력은 400이고저장행은0, 정상2는정확히2로저장됨을확인한다. 기존1-5/F6 검증과 연결하며 JSON 변환후 값만보는검증의한계를설명한다.

**기존 과제와 중복·연결**

- S-1-1
- S-1-5
- L-F6

**우선순위**

P2

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-D1/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-D1/screen.jpg)
- 관찰: 없음
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-D1/dom.txt](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-D1/dom.txt)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/D1-json-jackson.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/D1-json-jackson.md:1) — 1~318행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-D1.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-D1.json)
