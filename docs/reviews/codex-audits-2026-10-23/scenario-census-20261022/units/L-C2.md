# L-C2. C2. Gradle — 의존성은 무엇이고 어디서 오나

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/C2-gradle-dependencies.md](../../../../../lessons/C2-gradle-dependencies.md)

원문 SHA-256: `f460b09ee41f5eb527d1b27ed3a549cec541da8f51c646b2cea2884c05bebbed`

## 판정

의존성의 정상·해결실패·컴파일실패·실행실패를 구분하는 입문 흐름은 충분하다. 보완: 복구 종료조건이 git status에 아무것도 없음이라 기존 학습자의 미완성 변경이 있는 작업공간을 고려하지 않는다. 전체 파일을 깨끗하게 만드는 것이 이 실습의 요구는 아니다.

## 목표·선수 지식·학습자 작업

의존성의 정상·해결실패·컴파일실패·실행실패를 구분하는 입문 흐름은 충분하다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. BOM 선택·전이 의존성·classpath와 resolve/compile/runtime 오류를 구분한다.

구현 대조: 실제 트리·좌표·오류 예시가 단계별로 제시된다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 복구 종료조건이 git status에 아무것도 없음이라 기존 학습자의 미완성 변경이 있는 작업공간을 고려하지 않는다. 전체 파일을 깨끗하게 만드는 것이 이 실습의 요구는 아니다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/C2-gradle-dependencies.md](../../../../../lessons/C2-gradle-dependencies.md) — 66~165행

### 2. commons-lang3 추가→jshell 사용→API 사용→의존성제거실패→복구를 수행한다.

구현 대조: StringUtils 기대값과 파일/Gradle 원상복구가 구체적이다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 복구 종료조건이 git status에 아무것도 없음이라 기존 학습자의 미완성 변경이 있는 작업공간을 고려하지 않는다. 전체 파일을 깨끗하게 만드는 것이 이 실습의 요구는 아니다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/C2-gradle-dependencies.md](../../../../../lessons/C2-gradle-dependencies.md) — 167~247행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: 의존성의 정상·해결실패·컴파일실패·실행실패를 구분하는 입문 흐름은 충분하다.

- 현재 난이도: 입문·기초
- 판정 이유: 의존성의 정상·해결실패·컴파일실패·실행실패를 구분하는 입문 흐름은 충분하다.
- 다음 단계: - S-0-6
  - L-C3
  - L-A4

## 부족한 점

### L-C2-G1 · low

복구 종료조건이 git status에 아무것도 없음이라 기존 학습자의 미완성 변경이 있는 작업공간을 고려하지 않는다. 전체 파일을 깨끗하게 만드는 것이 이 실습의 요구는 아니다.

판정 범위: 해당 레슨과 명시한 후속 경로의 판정이며 전체 개념의 부재를 뜻하지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/C2-gradle-dependencies.md](../../../../../lessons/C2-gradle-dependencies.md)

## 확장 개발 명세

### L-C2의 후속 실습 보완

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

복구 종료조건이 git status에 아무것도 없음이라 기존 학습자의 미완성 변경이 있는 작업공간을 고려하지 않는다. 전체 파일을 깨끗하게 만드는 것이 이 실습의 요구는 아니다.

**시작 상태**

이 레슨의 제공 예시와 문서에 지정한 선행 단계를 마친 별도 실습 복사본.

**학습자가 할 일**

시작 시 변경 목록을 기록하고 이 실습에서 추가한 dependency와 Controller만 되돌려 시작 diff와 같음을 비교한다.의존성 충돌 심화는 P08의 dependencyInsight로 연결하되 현재 공용 Gradle 캐시 삭제를 복구 조건으로 삼지 않는다.

**정상 사례**

BOM 선택·전이 의존성·classpath와 resolve/compile/runtime 오류를 구분한다.

**실패·경계 사례**

시작 시 변경 목록을 기록하고 이 실습에서 추가한 dependency와 Controller만 되돌려 시작 diff와 같음을 비교한다.의존성 충돌 심화는 P08의 dependencyInsight로 연결하되 현재 공용 Gradle 캐시 삭제를 복구 조건으로 삼지 않는다.

**동시성·성능**

본문에 명시한 실험만 수행하며 단일 예시 통과를 동시성/운영 보장으로 확대하지 않는다.

**DB 관찰**

DB를 사용하는 후속이면 응답과 커밋된 행을 별도로 기록한다. 순수 Java 예시는 DB 대상이 아니다.

**합격 기준**

시작 시 변경 목록을 기록하고 이 실습에서 추가한 dependency와 Controller만 되돌려 시작 diff와 같음을 비교한다.의존성 충돌 심화는 P08의 dependencyInsight로 연결하되 현재 공용 Gradle 캐시 삭제를 복구 조건으로 삼지 않는다.

**기존 과제와 중복·연결**

- S-0-6
- L-C3
- L-A4

**우선순위**

P2

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-C2/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-C2/screen.jpg`)
- 관찰: 없음
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-C2/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-C2/dom.txt`)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/C2-gradle-dependencies.md](../../../../../lessons/C2-gradle-dependencies.md) — 1~300행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-C2.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-C2.json`)
