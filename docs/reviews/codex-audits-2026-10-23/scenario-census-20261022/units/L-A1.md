# L-A1. A1. 클라이언트와 서버 — 요청 한 번이 오가는 길

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/A1-client-server-http.md](../../../../../lessons/A1-client-server-http.md)

원문 SHA-256: `48a617407c1b4c08109b8e0378df84faf9a8de5ede9ab1bbdca551adf15c74cb`

## 판정

HTTP 왕복 관찰 입문이며 세션·토큰 구현은 후속으로 분리되어 있다. 보완: 공개 httpbin HTTP 응답을 정상 200으로 고정한 실습은 네트워크 차단/HTTPS 강제와 앱 오류를 구분하는 합격 기준이 없다. 대체 서버 안내는 이미 있다.

## 목표·선수 지식·학습자 작업

HTTP 왕복 관찰 입문이며 세션·토큰 구현은 후속으로 분리되어 있다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. curl -v의 요청/응답 헤더와 본문을 분리한다.

구현 대조: 0-1 API 예시와 기존 실측의 다른 포트 8189를 명시한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 공개 httpbin HTTP 응답을 정상 200으로 고정한 실습은 네트워크 차단/HTTPS 강제와 앱 오류를 구분하는 합격 기준이 없다. 대체 서버 안내는 이미 있다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/A1-client-server-http.md](../../../../../lessons/A1-client-server-http.md) — 38~85행

### 2. 로컬 인사 API와 공개 echo 서버의 args/headers를 비교한다.

구현 대조: 실행 명령과 기대 필드·대체 HTTPS 서버가 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 공개 httpbin HTTP 응답을 정상 200으로 고정한 실습은 네트워크 차단/HTTPS 강제와 앱 오류를 구분하는 합격 기준이 없다. 대체 서버 안내는 이미 있다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/A1-client-server-http.md](../../../../../lessons/A1-client-server-http.md) — 87~132행

### 3. 서버 검증과 요청별 인증의 이유를 설명한다.

구현 대조: 확인 문제와 F2/D02/W13으로 이어진다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 공개 httpbin HTTP 응답을 정상 200으로 고정한 실습은 네트워크 차단/HTTPS 강제와 앱 오류를 구분하는 합격 기준이 없다. 대체 서버 안내는 이미 있다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/A1-client-server-http.md](../../../../../lessons/A1-client-server-http.md) — 134~176행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: HTTP 왕복 관찰 입문이며 세션·토큰 구현은 후속으로 분리되어 있다.

- 현재 난이도: 입문·기초
- 판정 이유: HTTP 왕복 관찰 입문이며 세션·토큰 구현은 후속으로 분리되어 있다.
- 다음 단계: - S-0-3
  - L-A2
  - L-F2

## 부족한 점

### L-A1-G1 · low

공개 httpbin HTTP 응답을 정상 200으로 고정한 실습은 네트워크 차단/HTTPS 강제와 앱 오류를 구분하는 합격 기준이 없다. 대체 서버 안내는 이미 있다.

판정 범위: 해당 레슨과 명시한 후속 경로의 판정이며 전체 개념의 부재를 뜻하지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/A1-client-server-http.md](../../../../../lessons/A1-client-server-http.md)

## 확장 개발 명세

### L-A1의 후속 실습 보완

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

공개 httpbin HTTP 응답을 정상 200으로 고정한 실습은 네트워크 차단/HTTPS 강제와 앱 오류를 구분하는 합격 기준이 없다. 대체 서버 안내는 이미 있다.

**시작 상태**

이 레슨의 제공 예시와 문서에 지정한 선행 단계를 마친 별도 실습 복사본.

**학습자가 할 일**

로컬 echo를 기준선으로 두고 외부 echo 실패 시 curl 종료 코드/HTTP 상태 유무를 기록한다. 외부 연결 실패를 로컬 구현 실패로 채점하지 않으며 name=김자바와 공백·&를 URL 인코딩해 round-trip을 확인한다.

**정상 사례**

curl -v의 요청/응답 헤더와 본문을 분리한다.

**실패·경계 사례**

로컬 echo를 기준선으로 두고 외부 echo 실패 시 curl 종료 코드/HTTP 상태 유무를 기록한다. 외부 연결 실패를 로컬 구현 실패로 채점하지 않으며 name=김자바와 공백·&를 URL 인코딩해 round-trip을 확인한다.

**동시성·성능**

본문에 명시한 실험만 수행하며 단일 예시 통과를 동시성/운영 보장으로 확대하지 않는다.

**DB 관찰**

DB를 사용하는 후속이면 응답과 커밋된 행을 별도로 기록한다. 순수 Java 예시는 DB 대상이 아니다.

**합격 기준**

로컬 echo를 기준선으로 두고 외부 echo 실패 시 curl 종료 코드/HTTP 상태 유무를 기록한다. 외부 연결 실패를 로컬 구현 실패로 채점하지 않으며 name=김자바와 공백·&를 URL 인코딩해 round-trip을 확인한다.

**기존 과제와 중복·연결**

- S-0-3
- L-A2
- L-F2

**우선순위**

P2

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-A1/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-A1/screen.jpg`)
- 관찰: 없음
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-A1/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-A1/dom.txt`)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/A1-client-server-http.md](../../../../../lessons/A1-client-server-http.md) — 1~176행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-A1.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-A1.json`)
