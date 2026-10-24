# L-E1. E1. 계층을 나누는 이유

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E1-why-layers.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E1-why-layers.md)

원문 SHA-256: `fa948666639bb0c9ca8da9cf5d647924937c160898dd0c39aedbbce71831c919`

## 판정

계층 역할과 DI의 이유는 구체적이다. 공유 빈의 동시성·생명주기를 관찰하는 후속 과제가 필요하다. 보완: singleton 저장소 공유의 장점만 실습하며 같은 객체에 요청별 가변상태를 두었을 때 사용자 간 값이 섞이는 반례가 없다. 생명주기와 L16 구현체 선택은 관련지식 링크 중심이다.

## 목표·선수 지식·학습자 작업

계층 역할과 DI의 이유는 구체적이다. 공유 빈의 동시성·생명주기를 관찰하는 후속 과제가 필요하다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. 수동조립→생성자주입→Spring 조립으로 계층 의존 방향을 비교한다.

구현 대조: 동일저장소와새저장소의상태차이를구체코드로 보여준다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: singleton 저장소 공유의 장점만 실습하며 같은 객체에 요청별 가변상태를 두었을 때 사용자 간 값이 섞이는 반례가 없다. 생명주기와 L16 구현체 선택은 관련지식 링크 중심이다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E1-why-layers.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E1-why-layers.md:35) — 35~108행

### 2. 구현교체·빈제목·누락의존성을 정상/실패로 확인한다.

구현 대조: id1과 100,빈배열,컴파일오류 및1-3순환참조로 연결한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: singleton 저장소 공유의 장점만 실습하며 같은 객체에 요청별 가변상태를 두었을 때 사용자 간 값이 섞이는 반례가 없다. 생명주기와 L16 구현체 선택은 관련지식 링크 중심이다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E1-why-layers.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E1-why-layers.md:110) — 110~180행

### 3. 변경 요구를 Controller/Service/Repository 중 어디에 둘지 판단한다.

구현 대조: 헤더추가·빈도규칙·알림·테스트대역 문제와정답이 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: singleton 저장소 공유의 장점만 실습하며 같은 객체에 요청별 가변상태를 두었을 때 사용자 간 값이 섞이는 반례가 없다. 생명주기와 L16 구현체 선택은 관련지식 링크 중심이다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E1-why-layers.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E1-why-layers.md:182) — 182~235행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: 계층 역할과 DI의 이유는 구체적이다. 공유 빈의 동시성·생명주기를 관찰하는 후속 과제가 필요하다.

- 현재 난이도: 입문·기초
- 판정 이유: 계층 역할과 DI의 이유는 구체적이다. 공유 빈의 동시성·생명주기를 관찰하는 후속 과제가 필요하다.
- 다음 단계: - S-1-3
  - S-7-2
  - L16

## 부족한 점

### L-E1-G1 · low

singleton 저장소 공유의 장점만 실습하며 같은 객체에 요청별 가변상태를 두었을 때 사용자 간 값이 섞이는 반례가 없다. 생명주기와 L16 구현체 선택은 관련지식 링크 중심이다.

판정 범위: 해당 레슨과 명시한 후속 경로의 판정이며 전체 개념의 부재를 뜻하지 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E1-why-layers.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E1-why-layers.md)

## 확장 개발 명세

### L-E1의 후속 실습 보완

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

singleton 저장소 공유의 장점만 실습하며 같은 객체에 요청별 가변상태를 두었을 때 사용자 간 값이 섞이는 반례가 없다. 생명주기와 L16 구현체 선택은 관련지식 링크 중심이다.

**시작 상태**

이 레슨의 제공 예시와 문서에 지정한 선행 단계를 마친 별도 실습 복사본.

**학습자가 할 일**

동일 서비스 인스턴스에 서로다른회원 요청2개를 barrier로겹치게해 마지막회원필드가섞이는 실패를 관찰하고 요청값을메서드인자로만유지한다. 두회원의결과가각각자기 ID이며 서비스가교체가능한 동일계약을 유지해야한다. L16과생명주기선택랩을후속으로연결한다.

**정상 사례**

수동조립→생성자주입→Spring 조립으로 계층 의존 방향을 비교한다.

**실패·경계 사례**

동일 서비스 인스턴스에 서로다른회원 요청2개를 barrier로겹치게해 마지막회원필드가섞이는 실패를 관찰하고 요청값을메서드인자로만유지한다. 두회원의결과가각각자기 ID이며 서비스가교체가능한 동일계약을 유지해야한다. L16과생명주기선택랩을후속으로연결한다.

**동시성·성능**

본문에 명시한 실험만 수행하며 단일 예시 통과를 동시성/운영 보장으로 확대하지 않는다.

**DB 관찰**

DB를 사용하는 후속이면 응답과 커밋된 행을 별도로 기록한다. 순수 Java 예시는 DB 대상이 아니다.

**합격 기준**

동일 서비스 인스턴스에 서로다른회원 요청2개를 barrier로겹치게해 마지막회원필드가섞이는 실패를 관찰하고 요청값을메서드인자로만유지한다. 두회원의결과가각각자기 ID이며 서비스가교체가능한 동일계약을 유지해야한다. L16과생명주기선택랩을후속으로연결한다.

**기존 과제와 중복·연결**

- S-1-3
- S-7-2
- L16

**우선순위**

P2

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E1/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E1/screen.jpg)
- 관찰: 없음
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E1/dom.txt](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E1/dom.txt)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E1-why-layers.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E1-why-layers.md:1) — 1~235행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-E1.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-E1.json)
