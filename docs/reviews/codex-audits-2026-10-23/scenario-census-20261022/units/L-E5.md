# L-E5. E5. MyBatis 첫걸음 — SQL을 내가 쥐는 방식

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E5-mybatis-first-steps.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E5-mybatis-first-steps.md)

원문 SHA-256: `da421179f34ab9cf42ed34a61a70ae55f45abac44f2e629239f1e7668ddcb26d`

## 판정

SQL 매핑과진단은상세하다. 현행실행준비와 SQL 입력·혼합트랜잭션의찾아갈경로보강이필요하다. 보완: 174행 studymate 컨테이너가고정되고 E4의 3306설정을재사용한다. L6/L7/L9심화는이름만있고실행링크가없다. 고정 lesson_post 테이블명이 E7과겹쳐시작/복구경계도명확히해야한다.

## 목표·선수 지식·학습자 작업

SQL 매핑과진단은상세하다. 현행실행준비와 SQL 입력·혼합트랜잭션의찾아갈경로보강이필요하다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. Mapper/XML namespace/id·resultMap·동적조건·generatedkey를구현한다.

구현 대조: SQL과 Java 필드를직접대응하는예시가 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 174행 studymate 컨테이너가고정되고 E4의 3306설정을재사용한다. L6/L7/L9심화는이름만있고실행링크가없다. 고정 lesson_post 테이블명이 E7과겹쳐시작/복구경계도명확히해야한다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E5-mybatis-first-steps.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E5-mybatis-first-steps.md:54) — 54~165행

### 2. practice 읽기와 lesson_post 쓰기의결과/행수/생성 ID를확인한다.

구현 대조: count 145/12/3과컬럼값,청소절차가 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 174행 studymate 컨테이너가고정되고 E4의 3306설정을재사용한다. L6/L7/L9심화는이름만있고실행링크가없다. 고정 lesson_post 테이블명이 E7과겹쳐시작/복구경계도명확히해야한다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E5-mybatis-first-steps.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E5-mybatis-first-steps.md:167) — 167~238행

### 3. camel 설정·mapper 위치/id·alias·generatedkey 누락을진단한다.

구현 대조: 기동 실패/호출 실패/조용한 null을구분한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 174행 studymate 컨테이너가고정되고 E4의 3306설정을재사용한다. L6/L7/L9심화는이름만있고실행링크가없다. 고정 lesson_post 테이블명이 E7과겹쳐시작/복구경계도명확히해야한다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E5-mybatis-first-steps.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E5-mybatis-first-steps.md:240) — 240~278행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: SQL 매핑과진단은상세하다. 현행실행준비와 SQL 입력·혼합트랜잭션의찾아갈경로보강이필요하다.

- 현재 난이도: 입문·기초
- 판정 이유: SQL 매핑과진단은상세하다. 현행실행준비와 SQL 입력·혼합트랜잭션의찾아갈경로보강이필요하다.
- 다음 단계: - S-10-7
  - S-10-12
  - Q05
  - Q09
  - Q15

## 부족한 점

### L-E5-G1 · low

174행 studymate 컨테이너가고정되고 E4의 3306설정을재사용한다. L6/L7/L9심화는이름만있고실행링크가없다. 고정 lesson_post 테이블명이 E7과겹쳐시작/복구경계도명확히해야한다.

판정 범위: 해당 레슨과 명시한 후속 경로의 판정이며 전체 개념의 부재를 뜻하지 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E5-mybatis-first-steps.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E5-mybatis-first-steps.md)

## 확장 개발 명세

### L-E5의 후속 실습 보완

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

174행 studymate 컨테이너가고정되고 E4의 3306설정을재사용한다. L6/L7/L9심화는이름만있고실행링크가없다. 고정 lesson_post 테이블명이 E7과겹쳐시작/복구경계도명확히해야한다.

**시작 상태**

이 레슨의 제공 예시와 문서에 지정한 선행 단계를 마친 별도 실습 복사본.

**학습자가 할 일**

각랩이소유한격리 DB에서초기화하고 L12~14/10-7/10-12의실제코드로연결한다. 검색어%/_/따옴표와허용되지않은 sort 입력에서문자그대로검색/정렬허용목록/SQLbind가유지되는반례를실행한다.

**정상 사례**

Mapper/XML namespace/id·resultMap·동적조건·generatedkey를구현한다.

**실패·경계 사례**

각랩이소유한격리 DB에서초기화하고 L12~14/10-7/10-12의실제코드로연결한다. 검색어%/_/따옴표와허용되지않은 sort 입력에서문자그대로검색/정렬허용목록/SQLbind가유지되는반례를실행한다.

**동시성·성능**

본문에 명시한 실험만 수행하며 단일 예시 통과를 동시성/운영 보장으로 확대하지 않는다.

**DB 관찰**

DB를 사용하는 후속이면 응답과 커밋된 행을 별도로 기록한다. 순수 Java 예시는 DB 대상이 아니다.

**합격 기준**

각랩이소유한격리 DB에서초기화하고 L12~14/10-7/10-12의실제코드로연결한다. 검색어%/_/따옴표와허용되지않은 sort 입력에서문자그대로검색/정렬허용목록/SQLbind가유지되는반례를실행한다.

**기존 과제와 중복·연결**

- S-10-7
- S-10-12
- Q05
- Q09
- Q15

**우선순위**

P2

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E5/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E5/screen.jpg)
- 관찰: 없음
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E5/dom.txt](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E5/dom.txt)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E5-mybatis-first-steps.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E5-mybatis-first-steps.md:1) — 1~334행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-E5.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-E5.json)
