# L-B5. B5. 인터페이스와 구현 — 왜 Repository는 인터페이스인가

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B5-interfaces.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B5-interfaces.md)

원문 SHA-256: `fe079b7c307b5213519441ebebaf7fc4fc6309e7b6c1dfe2994c39ddea88ee56`

## 판정

순수 Java 다형성은 충분하며 DI 심화는 기존 L16 재사용이 맞다. 보완: 직접 new 기반 다형성에서 Spring의 후보 빈0/2개·선택·실패대역으로 이어지는 L16이 이미 있지만 이 레슨 후속 링크에는 직접 연결되지 않는다.

## 목표·선수 지식·학습자 작업

순수 Java 다형성은 충분하며 DI 심화는 기존 L16 재사용이 맞다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. 동일 PostService에 Memory/Logging 구현을 넣어 호출 대상을 비교한다.

구현 대조: RepoDemo.java가 완전하며 저장 개수와구현 클래스를 출력한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 직접 new 기반 다형성에서 Spring의 후보 빈0/2개·선택·실패대역으로 이어지는 L16이 이미 있지만 이 레슨 후속 링크에는 직접 연결되지 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B5-interfaces.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B5-interfaces.md:53) — 53~138행

### 2. Upper 구현을 추가하고 서비스 코드를 유지한다.

구현 대조: 구현3 코드와 HELLO 기대값이 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 직접 new 기반 다형성에서 Spring의 후보 빈0/2개·선택·실패대역으로 이어지는 L16이 이미 있지만 이 레슨 후속 링크에는 직접 연결되지 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B5-interfaces.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B5-interfaces.md:140) — 140~173행

### 3. 구현 누락·interface new·implements 누락을 컴파일 오류로 확인한다.

구현 대조: 입력과진단메시지가 각각 명시돼 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 직접 new 기반 다형성에서 Spring의 후보 빈0/2개·선택·실패대역으로 이어지는 L16이 이미 있지만 이 레슨 후속 링크에는 직접 연결되지 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B5-interfaces.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B5-interfaces.md:175) — 175~230행

## 이번 실행 근거

이번 독립 Java 예시 1개를 실행해 예상 출력/예외를 확인했다. Spring·DB·IDE 실습 전체의 실행이 아니다.

[/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-lessons/summary.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/runtime-lessons/summary.json)

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: 순수 Java 다형성은 충분하며 DI 심화는 기존 L16 재사용이 맞다.

- 현재 난이도: 입문·기초
- 판정 이유: 순수 Java 다형성은 충분하며 DI 심화는 기존 L16 재사용이 맞다.
- 다음 단계: - S-1-3
  - L16
  - L-B6

## 부족한 점

### L-B5-G1 · low

직접 new 기반 다형성에서 Spring의 후보 빈0/2개·선택·실패대역으로 이어지는 L16이 이미 있지만 이 레슨 후속 링크에는 직접 연결되지 않는다.

판정 범위: 해당 레슨과 명시한 후속 경로의 판정이며 전체 개념의 부재를 뜻하지 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B5-interfaces.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B5-interfaces.md)

## 확장 개발 명세

### L-B5의 후속 실습 보완

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

직접 new 기반 다형성에서 Spring의 후보 빈0/2개·선택·실패대역으로 이어지는 L16이 이미 있지만 이 레슨 후속 링크에는 직접 연결되지 않는다.

**시작 상태**

이 레슨의 제공 예시와 문서에 지정한 선행 단계를 마친 별도 실습 복사본.

**학습자가 할 일**

새 중복 랩을 만들지 않고 L16 인터페이스 구현체 실습으로 연결한다. 같은 계약을 두 구현에 적용하고 빈이없음/둘임을 분리해 진단한 뒤 실패 구현의 상태 무변경을 검증한다.

**정상 사례**

동일 PostService에 Memory/Logging 구현을 넣어 호출 대상을 비교한다.

**실패·경계 사례**

새 중복 랩을 만들지 않고 L16 인터페이스 구현체 실습으로 연결한다. 같은 계약을 두 구현에 적용하고 빈이없음/둘임을 분리해 진단한 뒤 실패 구현의 상태 무변경을 검증한다.

**동시성·성능**

본문에 명시한 실험만 수행하며 단일 예시 통과를 동시성/운영 보장으로 확대하지 않는다.

**DB 관찰**

DB를 사용하는 후속이면 응답과 커밋된 행을 별도로 기록한다. 순수 Java 예시는 DB 대상이 아니다.

**합격 기준**

새 중복 랩을 만들지 않고 L16 인터페이스 구현체 실습으로 연결한다. 같은 계약을 두 구현에 적용하고 빈이없음/둘임을 분리해 진단한 뒤 실패 구현의 상태 무변경을 검증한다.

**기존 과제와 중복·연결**

- S-1-3
- L16
- L-B6

**우선순위**

P2

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B5/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B5/screen.jpg)
- 관찰: 없음
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B5/dom.txt](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-B5/dom.txt)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B5-interfaces.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/B5-interfaces.md:1) — 1~283행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-B5.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-B5.json)
