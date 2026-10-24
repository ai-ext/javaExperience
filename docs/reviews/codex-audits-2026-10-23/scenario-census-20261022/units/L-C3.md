# L-C3. C3. application.yml과 프로필 — 코드는 그대로, 설정만 바꾸기

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/C3-application-yml-profiles.md](../../../../../lessons/C3-application-yml-profiles.md)

원문 SHA-256: `38e66a7c411895f9db39d05fb568ef7b62d537397c39bfadca9704c4157063ec`

## 판정

설정 우선순위·문법 오류 실습은 충분하고 DB 대상 오인 방지의 실행 기준을 더해야 한다. 보완: 56/135행 datasource와 전제는 localhost 3306·studymate로 오래됐다. practice 프로필의 fixed-now/Flyway 추가설정까지 있는 실제 버전과 단순 DB 주소만 바뀐다는 설명을 구분해야 한다.

## 목표·선수 지식·학습자 작업

설정 우선순위·문법 오류 실습은 충분하고 DB 대상 오인 방지의 실행 기준을 더해야 한다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. 기본/프로필/env/CLI 우선순위와 오타의 조용한 실패를 구분한다.

구현 대조: 값 비교표와 잘못된 들여쓰기 반례가 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 56/135행 datasource와 전제는 localhost 3306·studymate로 오래됐다. practice 프로필의 fixed-now/Flyway 추가설정까지 있는 실제 버전과 단순 DB 주소만 바뀐다는 설명을 구분해야 한다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/C3-application-yml-profiles.md](../../../../../lessons/C3-application-yml-profiles.md) — 35~113행

### 2. 8080/8081/8082와프로필명·앱이름을실제로그로 확인한다.

구현 대조: ConfigController 없이도할수있는순서·정리방법을 제공한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 56/135행 datasource와 전제는 localhost 3306·studymate로 오래됐다. practice 프로필의 fixed-now/Flyway 추가설정까지 있는 실제 버전과 단순 DB 주소만 바뀐다는 설명을 구분해야 한다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/C3-application-yml-profiles.md](../../../../../lessons/C3-application-yml-profiles.md) — 115~171행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: 설정 우선순위·문법 오류 실습은 충분하고 DB 대상 오인 방지의 실행 기준을 더해야 한다.

- 현재 난이도: 입문·기초
- 판정 이유: 설정 우선순위·문법 오류 실습은 충분하고 DB 대상 오인 방지의 실행 기준을 더해야 한다.
- 다음 단계: - S-0-6
  - L-C4

## 부족한 점

### L-C3-G1 · low

56/135행 datasource와 전제는 localhost 3306·studymate로 오래됐다. practice 프로필의 fixed-now/Flyway 추가설정까지 있는 실제 버전과 단순 DB 주소만 바뀐다는 설명을 구분해야 한다.

판정 범위: 해당 레슨과 명시한 후속 경로의 판정이며 전체 개념의 부재를 뜻하지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/C3-application-yml-profiles.md](../../../../../lessons/C3-application-yml-profiles.md)

## 확장 개발 명세

### L-C3의 후속 실습 보완

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

56/135행 datasource와 전제는 localhost 3306·studymate로 오래됐다. practice 프로필의 fixed-now/Flyway 추가설정까지 있는 실제 버전과 단순 DB 주소만 바뀐다는 설명을 구분해야 한다.

**시작 상태**

이 레슨의 제공 예시와 문서에 지정한 선행 단계를 마친 별도 실습 복사본.

**학습자가 할 일**

실제 profile 파일을 시작자료로 제시하고 SELECT DATABASE() 및 기준시각을 읽어 community/practice/project를 확인한다.의도적으로 잘못된 프로필명을 주어도 시작할 수 있음을 재현한 뒤 잘못된 DB에는 쓰기 전에 멈추는 실행 체크를 추가한다.

**정상 사례**

기본/프로필/env/CLI 우선순위와 오타의 조용한 실패를 구분한다.

**실패·경계 사례**

실제 profile 파일을 시작자료로 제시하고 SELECT DATABASE() 및 기준시각을 읽어 community/practice/project를 확인한다.의도적으로 잘못된 프로필명을 주어도 시작할 수 있음을 재현한 뒤 잘못된 DB에는 쓰기 전에 멈추는 실행 체크를 추가한다.

**동시성·성능**

본문에 명시한 실험만 수행하며 단일 예시 통과를 동시성/운영 보장으로 확대하지 않는다.

**DB 관찰**

DB를 사용하는 후속이면 응답과 커밋된 행을 별도로 기록한다. 순수 Java 예시는 DB 대상이 아니다.

**합격 기준**

실제 profile 파일을 시작자료로 제시하고 SELECT DATABASE() 및 기준시각을 읽어 community/practice/project를 확인한다.의도적으로 잘못된 프로필명을 주어도 시작할 수 있음을 재현한 뒤 잘못된 DB에는 쓰기 전에 멈추는 실행 체크를 추가한다.

**기존 과제와 중복·연결**

- S-0-6
- L-C4

**우선순위**

P2

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-C3/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-C3/screen.jpg`)
- 관찰: 없음
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-C3/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-C3/dom.txt`)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/C3-application-yml-profiles.md](../../../../../lessons/C3-application-yml-profiles.md) — 1~232행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-C3.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-C3.json`)
