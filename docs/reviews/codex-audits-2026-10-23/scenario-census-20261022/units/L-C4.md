# L-C4. C4. 로그와 스택트레이스 — 한 줄의 구조와 읽는 순서

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/C4-logs-and-stack-traces.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/C4-logs-and-stack-traces.md)

원문 SHA-256: `50f396ba0c3c74ca19981d1c8cb244262af07d4afea318073c7c3063e6d900d5`

## 판정

예외 원인·레벨 진단은 충분하다. 실제 운영 추적은 요청 상관관계와 비동기 경계가 추가 심화다. 보완: 74행은 같은스레드 칸을 같은 요청의 근거로 사용한다. 요청이 순차로 같은 풀스레드를 재사용하거나 @Async로 옮겨가면 요청 단위 추적이 끊기는 반례는 실행하지 않는다.

## 목표·선수 지식·학습자 작업

예외 원인·레벨 진단은 충분하다. 실제 운영 추적은 요청 상관관계와 비동기 경계가 추가 심화다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. 다중예외체인의 원인과 cause 제거로 잃는정보를 비교한다.

구현 대조: Wrap.java 완전 예시와 복구입력 8080이 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 74행은 같은스레드 칸을 같은 요청의 근거로 사용한다. 요청이 순차로 같은 풀스레드를 재사용하거나 @Async로 옮겨가면 요청 단위 추적이 끊기는 반례는 실행하지 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/C4-logs-and-stack-traces.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/C4-logs-and-stack-traces.md:88) — 88~167행

### 2. INFO/WARN/DEBUG로그 차이를 코드와 설정으로 관찰한다.

구현 대조: LogController/curl/패키지별 debug가 구체적이다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 74행은 같은스레드 칸을 같은 요청의 근거로 사용한다. 요청이 순차로 같은 풀스레드를 재사용하거나 @Async로 옮겨가면 요청 단위 추적이 끊기는 반례는 실행하지 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/C4-logs-and-stack-traces.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/C4-logs-and-stack-traces.md:169) — 169~213행

## 이번 실행 근거

이번 독립 Java 예시 1개를 실행해 예상 출력/예외를 확인했다. Spring·DB·IDE 실습 전체의 실행이 아니다.

[/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-lessons/summary.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-lessons/summary.json)

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: 예외 원인·레벨 진단은 충분하다. 실제 운영 추적은 요청 상관관계와 비동기 경계가 추가 심화다.

- 현재 난이도: 입문·기초
- 판정 이유: 예외 원인·레벨 진단은 충분하다. 실제 운영 추적은 요청 상관관계와 비동기 경계가 추가 심화다.
- 다음 단계: - S-0-5
  - S-16-2
  - L-H6

## 부족한 점

### L-C4-G1 · low

74행은 같은스레드 칸을 같은 요청의 근거로 사용한다. 요청이 순차로 같은 풀스레드를 재사용하거나 @Async로 옮겨가면 요청 단위 추적이 끊기는 반례는 실행하지 않는다.

판정 범위: 해당 레슨과 명시한 후속 경로의 판정이며 전체 개념의 부재를 뜻하지 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/C4-logs-and-stack-traces.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/C4-logs-and-stack-traces.md)

## 확장 개발 명세

### L-C4의 후속 실습 보완

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

74행은 같은스레드 칸을 같은 요청의 근거로 사용한다. 요청이 순차로 같은 풀스레드를 재사용하거나 @Async로 옮겨가면 요청 단위 추적이 끊기는 반례는 실행하지 않는다.

**시작 상태**

이 레슨의 제공 예시와 문서에 지정한 선행 단계를 마친 별도 실습 복사본.

**학습자가 할 일**

서로다른 요청 ID를가진동시요청2개와16-2비동기알림을 묶어 추적한다. 같은 thread 명으로요청을합치지않고 요청 ID가다르면 분리되며 작업이끝난후 다음요청에이전 ID가남지않아야한다.

**정상 사례**

다중예외체인의 원인과 cause 제거로 잃는정보를 비교한다.

**실패·경계 사례**

서로다른 요청 ID를가진동시요청2개와16-2비동기알림을 묶어 추적한다. 같은 thread 명으로요청을합치지않고 요청 ID가다르면 분리되며 작업이끝난후 다음요청에이전 ID가남지않아야한다.

**동시성·성능**

본문에 명시한 실험만 수행하며 단일 예시 통과를 동시성/운영 보장으로 확대하지 않는다.

**DB 관찰**

DB를 사용하는 후속이면 응답과 커밋된 행을 별도로 기록한다. 순수 Java 예시는 DB 대상이 아니다.

**합격 기준**

서로다른 요청 ID를가진동시요청2개와16-2비동기알림을 묶어 추적한다. 같은 thread 명으로요청을합치지않고 요청 ID가다르면 분리되며 작업이끝난후 다음요청에이전 ID가남지않아야한다.

**기존 과제와 중복·연결**

- S-0-5
- S-16-2
- L-H6

**우선순위**

P2

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-C4/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-C4/screen.jpg)
- 관찰: 없음
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-C4/dom.txt](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-C4/dom.txt)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/C4-logs-and-stack-traces.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/C4-logs-and-stack-traces.md:1) — 1~270행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-C4.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-C4.json)
