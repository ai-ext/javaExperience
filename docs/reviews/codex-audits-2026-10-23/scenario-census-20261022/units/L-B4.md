# L-B4. B4. record·getter·불변 — DTO가 record인 이유

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B4-record-getter-immutable.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B4-record-getter-immutable.md)

원문 SHA-256: `54ca5e95639cae85fcf785a91ee250d0b24dbce0981ef5a0e54b629a470e982f`

## 판정

직렬화 기초와 컴파일 오류는 충분하다. 중첩 가변값을 가진 DTO의 계약은 추가 심화가 필요하다. 보완: 불변 설명과 실습은 String/int 구성요소만 사용한다. record가 List를 포함할 때 외부/반환 참조로 내용이 바뀌는 얕은 불변 반례가 없어 DTO 불변을 과하게 일반화하기 쉽다.

## 목표·선수 지식·학습자 작업

직렬화 기초와 컴파일 오류는 충분하다. 중첩 가변값을 가진 DTO의 계약은 추가 심화가 필요하다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. record 구성요소·equals/hashCode·새 값 생성과 class를 비교한다.

구현 대조: RecordDemo.java와 예상 출력·가변 hash 표시를 제공한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 불변 설명과 실습은 String/int 구성요소만 사용한다. record가 List를 포함할 때 외부/반환 참조로 내용이 바뀌는 얕은 불변 반례가 없어 DTO 불변을 과하게 일반화하기 쉽다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B4-record-getter-immutable.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B4-record-getter-immutable.md:56) — 56~111행

### 2. record/getter/no-getter JSON 필드를 비교하고 getter를 추가한다.

구현 대조: Controller와3개요청·정확 JSON 키가 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 불변 설명과 실습은 String/int 구성요소만 사용한다. record가 List를 포함할 때 외부/반환 참조로 내용이 바뀌는 얕은 불변 반례가 없어 DTO 불변을 과하게 일반화하기 쉽다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B4-record-getter-immutable.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B4-record-getter-immutable.md:113) — 113~200행

### 3. record 필드 재할당과 잘못된 getter 호출을 실패시킨다.

구현 대조: 컴파일 오류/복구가 구체적이다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 불변 설명과 실습은 String/int 구성요소만 사용한다. record가 List를 포함할 때 외부/반환 참조로 내용이 바뀌는 얕은 불변 반례가 없어 DTO 불변을 과하게 일반화하기 쉽다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B4-record-getter-immutable.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B4-record-getter-immutable.md:202) — 202~236행

## 이번 실행 근거

이번 독립 Java 예시 1개를 실행해 예상 출력/예외를 확인했다. Spring·DB·IDE 실습 전체의 실행이 아니다.

[/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-lessons/summary.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-lessons/summary.json)

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: 직렬화 기초와 컴파일 오류는 충분하다. 중첩 가변값을 가진 DTO의 계약은 추가 심화가 필요하다.

- 현재 난이도: 입문·기초
- 판정 이유: 직렬화 기초와 컴파일 오류는 충분하다. 중첩 가변값을 가진 DTO의 계약은 추가 심화가 필요하다.
- 다음 단계: - L-B6
  - S-0-4

## 부족한 점

### L-B4-G1 · medium

불변 설명과 실습은 String/int 구성요소만 사용한다. record가 List를 포함할 때 외부/반환 참조로 내용이 바뀌는 얕은 불변 반례가 없어 DTO 불변을 과하게 일반화하기 쉽다.

판정 범위: 해당 레슨과 명시한 후속 경로의 판정이며 전체 개념의 부재를 뜻하지 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B4-record-getter-immutable.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B4-record-getter-immutable.md)

## 확장 개발 명세

### L-B4의 후속 실습 보완

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

불변 설명과 실습은 String/int 구성요소만 사용한다. record가 List를 포함할 때 외부/반환 참조로 내용이 바뀌는 얕은 불변 반례가 없어 DTO 불변을 과하게 일반화하기 쉽다.

**시작 상태**

이 레슨의 제공 예시와 문서에 지정한 선행 단계를 마친 별도 실습 복사본.

**학습자가 할 일**

List<String> tags를 포함한 record를 만들고 원본 ArrayList에 태그를 추가한 전후 DTO를 비교한다. 방어적 복사 뒤에는 외부 변경과 반환값 변경으로 응답이 달라지지 않아야 하며 List 요소까지 가변인 경우의 한계도 구분한다.

**정상 사례**

record 구성요소·equals/hashCode·새 값 생성과 class를 비교한다.

**실패·경계 사례**

List<String> tags를 포함한 record를 만들고 원본 ArrayList에 태그를 추가한 전후 DTO를 비교한다. 방어적 복사 뒤에는 외부 변경과 반환값 변경으로 응답이 달라지지 않아야 하며 List 요소까지 가변인 경우의 한계도 구분한다.

**동시성·성능**

본문에 명시한 실험만 수행하며 단일 예시 통과를 동시성/운영 보장으로 확대하지 않는다.

**DB 관찰**

DB를 사용하는 후속이면 응답과 커밋된 행을 별도로 기록한다. 순수 Java 예시는 DB 대상이 아니다.

**합격 기준**

List<String> tags를 포함한 record를 만들고 원본 ArrayList에 태그를 추가한 전후 DTO를 비교한다. 방어적 복사 뒤에는 외부 변경과 반환값 변경으로 응답이 달라지지 않아야 하며 List 요소까지 가변인 경우의 한계도 구분한다.

**기존 과제와 중복·연결**

- L-B6
- S-0-4

**우선순위**

P1

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B4/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B4/screen.jpg)
- 관찰: 없음
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B4/dom.txt](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B4/dom.txt)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B4-record-getter-immutable.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B4-record-getter-immutable.md:1) — 1~290행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-B4.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-B4.json)
