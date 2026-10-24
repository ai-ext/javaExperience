# L-A0. A0. API 개발이 뭔가 — API 하나를 띄우고 직접 고쳐 보기

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/A0-first-api.md](../../../../../lessons/A0-first-api.md)

원문 SHA-256: `11c9d7abe047d2b602c773feb413e1ba0da7c8155380d2919ae423b2c8c17159`

## 판정

기초 실행·수정·실패·복구가 모두 있으며 고급 DB 과제로 바로 뛰지 않는다. 보완: 199행 DB 조회 명령이 studymate-mysql-1 컨테이너를 고정한다. 현재 compose.yaml은 이 프로젝트의 mysql 서비스와 호스트 13308을 사용하므로 초보자가 그대로 실행할 시작 경로가 일치하지 않는다.

## 목표·선수 지식·학습자 작업

기초 실행·수정·실패·복구가 모두 있으며 고급 DB 과제로 바로 뛰지 않는다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. /hello 응답 변경 전후와 재시작·원상복구를 관찰한다.

구현 대조: 실제 HelloController 위치와 일치하고 HelloControllerTest 복구 요구도 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 199행 DB 조회 명령이 studymate-mysql-1 컨테이너를 고정한다. 현재 compose.yaml은 이 프로젝트의 mysql 서비스와 호스트 13308을 사용하므로 초보자가 그대로 실행할 시작 경로가 일치하지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/A0-first-api.md](../../../../../lessons/A0-first-api.md) — 15~89행

### 2. 신규 /api/first/ping에서 GET 200 JSON, 재시작 전 404, POST 405를 비교한다.

구현 대조: 완전한 Controller 코드·curl·예상 응답이 제공된다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 199행 DB 조회 명령이 studymate-mysql-1 컨테이너를 고정한다. 현재 compose.yaml은 이 프로젝트의 mysql 서비스와 호스트 13308을 사용하므로 초보자가 그대로 실행할 시작 경로가 일치하지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/A0-first-api.md](../../../../../lessons/A0-first-api.md) — 91~174행

### 3. Controller→Service→Repository→DB와 다음 실습을 연결한다.

구현 대조: 1-1~1-4와 A/B/D/E 레슨 링크가 구체적이다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 199행 DB 조회 명령이 studymate-mysql-1 컨테이너를 고정한다. 현재 compose.yaml은 이 프로젝트의 mysql 서비스와 호스트 13308을 사용하므로 초보자가 그대로 실행할 시작 경로가 일치하지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/A0-first-api.md](../../../../../lessons/A0-first-api.md) — 176~219행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: 기초 실행·수정·실패·복구가 모두 있으며 고급 DB 과제로 바로 뛰지 않는다.

- 현재 난이도: 입문·기초
- 판정 이유: 기초 실행·수정·실패·복구가 모두 있으며 고급 DB 과제로 바로 뛰지 않는다.
- 다음 단계: - S-0-1
  - S-1-1
  - S-1-3
  - L-A1
  - L-A3
  - L-E1

## 부족한 점

### L-A0-G1 · medium

199행 DB 조회 명령이 studymate-mysql-1 컨테이너를 고정한다. 현재 compose.yaml은 이 프로젝트의 mysql 서비스와 호스트 13308을 사용하므로 초보자가 그대로 실행할 시작 경로가 일치하지 않는다.

판정 범위: 해당 레슨과 명시한 후속 경로의 판정이며 전체 개념의 부재를 뜻하지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/A0-first-api.md](../../../../../lessons/A0-first-api.md)

## 확장 개발 명세

### L-A0의 후속 실습 보완

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

199행 DB 조회 명령이 studymate-mysql-1 컨테이너를 고정한다. 현재 compose.yaml은 이 프로젝트의 mysql 서비스와 호스트 13308을 사용하므로 초보자가 그대로 실행할 시작 경로가 일치하지 않는다.

**시작 상태**

이 레슨의 제공 예시와 문서에 지정한 선행 단계를 마친 별도 실습 복사본.

**학습자가 할 일**

현재 compose mysql 서비스를 대상으로 같은 SELECT를 실행하고 id/title/author_id 3행을 기록하는 준비 검사로 바꾼다. 다른 프로젝트가 꺼져 있어도 javaExperience 단독으로 /hello와 DB 조회가 가능해야 한다.

**정상 사례**

/hello 응답 변경 전후와 재시작·원상복구를 관찰한다.

**실패·경계 사례**

현재 compose mysql 서비스를 대상으로 같은 SELECT를 실행하고 id/title/author_id 3행을 기록하는 준비 검사로 바꾼다. 다른 프로젝트가 꺼져 있어도 javaExperience 단독으로 /hello와 DB 조회가 가능해야 한다.

**동시성·성능**

본문에 명시한 실험만 수행하며 단일 예시 통과를 동시성/운영 보장으로 확대하지 않는다.

**DB 관찰**

DB를 사용하는 후속이면 응답과 커밋된 행을 별도로 기록한다. 순수 Java 예시는 DB 대상이 아니다.

**합격 기준**

현재 compose mysql 서비스를 대상으로 같은 SELECT를 실행하고 id/title/author_id 3행을 기록하는 준비 검사로 바꾼다. 다른 프로젝트가 꺼져 있어도 javaExperience 단독으로 /hello와 DB 조회가 가능해야 한다.

**기존 과제와 중복·연결**

- S-0-1
- S-1-1
- S-1-3
- L-A1
- L-A3
- L-E1

**우선순위**

P1

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-A0/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-A0/screen.jpg`)
- 관찰: 없음
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-A0/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-A0/dom.txt`)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/A0-first-api.md](../../../../../lessons/A0-first-api.md) — 1~257행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-A0.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-A0.json`)
