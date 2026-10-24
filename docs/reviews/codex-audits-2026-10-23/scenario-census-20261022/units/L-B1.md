# L-B1. B1. 타입과 변수·메서드 — 타입이 이름 앞에 온다

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/B1-types-variables-methods.md](../../../../../lessons/B1-types-variables-methods.md)

원문 SHA-256: `63468590314ecac8651462566fa3e4b013de6f15a62c8abfb66c69c79c92f4e7`

## 판정

기초 오류 재현은 잘 구성되어 있다. DB 숫자 경계는 별도 전이 과제로 확장 가능하다. 보완: 숫자 범위는 long 리터럴로 설명하나 컴파일되는 정수 산술 overflow를 스스로 검출하는 입력은 없다. 기초 문법 합격과 업무 숫자 정확성은 구별해야 한다.

## 목표·선수 지식·학습자 작업

기초 오류 재현은 잘 구성되어 있다. DB 숫자 경계는 별도 전이 과제로 확장 가능하다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. 타입·박싱·var·문자열 동등성과 출력값을 직접 확인한다.

구현 대조: Types.java 완전 예시, jshell과 파일의 final 차이를 명시한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 숫자 범위는 long 리터럴로 설명하나 컴파일되는 정수 산술 overflow를 스스로 검출하는 입력은 없다. 기초 문법 합격과 업무 숫자 정확성은 구별해야 한다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/B1-types-variables-methods.md](../../../../../lessons/B1-types-variables-methods.md) — 64~184행

### 2. final 재할당·기본형 null 컴파일 오류와 unboxing NPE를 구별한다.

구현 대조: 실패 입력·오류 문구·수정 방향이 제공된다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 숫자 범위는 long 리터럴로 설명하나 컴파일되는 정수 산술 overflow를 스스로 검출하는 입력은 없다. 기초 문법 합격과 업무 숫자 정확성은 구별해야 한다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/B1-types-variables-methods.md](../../../../../lessons/B1-types-variables-methods.md) — 186~230행

## 이번 실행 근거

이번 독립 Java 예시 2개를 실행해 예상 출력/예외를 확인했다. Spring·DB·IDE 실습 전체의 실행이 아니다.

$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-lessons/summary.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-lessons/summary.json`)

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: 기초 오류 재현은 잘 구성되어 있다. DB 숫자 경계는 별도 전이 과제로 확장 가능하다.

- 현재 난이도: 입문·기초
- 판정 이유: 기초 오류 재현은 잘 구성되어 있다. DB 숫자 경계는 별도 전이 과제로 확장 가능하다.
- 다음 단계: - S-0-1
  - S-0-5
  - L-B2

## 부족한 점

### L-B1-G1 · low

숫자 범위는 long 리터럴로 설명하나 컴파일되는 정수 산술 overflow를 스스로 검출하는 입력은 없다. 기초 문법 합격과 업무 숫자 정확성은 구별해야 한다.

판정 범위: 해당 레슨과 명시한 후속 경로의 판정이며 전체 개념의 부재를 뜻하지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/B1-types-variables-methods.md](../../../../../lessons/B1-types-variables-methods.md)

## 확장 개발 명세

### L-B1의 후속 실습 보완

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

숫자 범위는 long 리터럴로 설명하나 컴파일되는 정수 산술 overflow를 스스로 검출하는 입력은 없다. 기초 문법 합격과 업무 숫자 정확성은 구별해야 한다.

**시작 상태**

이 레슨의 제공 예시와 문서에 지정한 선행 단계를 마친 별도 실습 복사본.

**학습자가 할 일**

후속 숫자 실습에서 int 경계값 2147483647에1을 더한 결과를 예측·관찰하고 long/정확 산술 선택을 비교한다. API/DB가 같은 값을 표현하는지 확인하며 기존 J01 타입 자료와 연결한다.

**정상 사례**

타입·박싱·var·문자열 동등성과 출력값을 직접 확인한다.

**실패·경계 사례**

후속 숫자 실습에서 int 경계값 2147483647에1을 더한 결과를 예측·관찰하고 long/정확 산술 선택을 비교한다. API/DB가 같은 값을 표현하는지 확인하며 기존 J01 타입 자료와 연결한다.

**동시성·성능**

본문에 명시한 실험만 수행하며 단일 예시 통과를 동시성/운영 보장으로 확대하지 않는다.

**DB 관찰**

DB를 사용하는 후속이면 응답과 커밋된 행을 별도로 기록한다. 순수 Java 예시는 DB 대상이 아니다.

**합격 기준**

후속 숫자 실습에서 int 경계값 2147483647에1을 더한 결과를 예측·관찰하고 long/정확 산술 선택을 비교한다. API/DB가 같은 값을 표현하는지 확인하며 기존 J01 타입 자료와 연결한다.

**기존 과제와 중복·연결**

- S-0-1
- S-0-5
- L-B2

**우선순위**

P2

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B1/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B1/screen.jpg`)
- 관찰: 없음
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B1/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B1/dom.txt`)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/B1-types-variables-methods.md](../../../../../lessons/B1-types-variables-methods.md) — 1~283행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-B1.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-B1.json`)
