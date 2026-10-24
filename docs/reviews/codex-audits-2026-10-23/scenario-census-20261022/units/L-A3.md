# L-A3. A3. 서버 프로그램 — 포트·프로세스·localhost·로그

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/A3-server-process-port.md](../../../../../lessons/A3-server-process-port.md)

원문 SHA-256: `cd6f101eb1f8e6c6df98abc3f1396bce1757c2571ba8bd774be4354442d7ce46`

## 판정

프로세스 기초는 실행·실패·복구가 갖춰져 있다. graceful shutdown의 진행 중 요청/종료 제한시간은 별도 심화 후보다. 보완: 126행 준비 검사가 studymate-mysql이름에 묶여 현재 프로젝트 compose와 어긋난다. 43행의 로그 없음=요청 미도달은 요청 로그가 설정되지 않은 정상 200/처리된 404에서도 성립하지 않을 수 있다는 반례를 다루지 않는다.

## 목표·선수 지식·학습자 작업

프로세스 기초는 실행·실패·복구가 갖춰져 있다. graceful shutdown의 진행 중 요청/종료 제한시간은 별도 심화 후보다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. PID·LISTEN·포트 충돌·종료 로그를 실제 운영체제 관찰과 맞춘다.

구현 대조: 기존 macOS 출력과 실측 포트 차이를 명시한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 126행 준비 검사가 studymate-mysql이름에 묶여 현재 프로젝트 compose와 어긋난다. 43행의 로그 없음=요청 미도달은 요청 로그가 설정되지 않은 정상 200/처리된 404에서도 성립하지 않을 수 있다는 반례를 다루지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/A3-server-process-port.md](../../../../../lessons/A3-server-process-port.md) — 45~117행

### 2. 두 서버 충돌 후 첫 서버 유지, 종료 후 연결 실패를 확인한다.

구현 대조: lsof·curl·Ctrl+C와 자기 프로세스 확인 조건이 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 126행 준비 검사가 studymate-mysql이름에 묶여 현재 프로젝트 compose와 어긋난다. 43행의 로그 없음=요청 미도달은 요청 로그가 설정되지 않은 정상 200/처리된 404에서도 성립하지 않을 수 있다는 반례를 다루지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/A3-server-process-port.md](../../../../../lessons/A3-server-process-port.md) — 119~171행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: 프로세스 기초는 실행·실패·복구가 갖춰져 있다. graceful shutdown의 진행 중 요청/종료 제한시간은 별도 심화 후보다.

- 현재 난이도: 입문·기초
- 판정 이유: 프로세스 기초는 실행·실패·복구가 갖춰져 있다. graceful shutdown의 진행 중 요청/종료 제한시간은 별도 심화 후보다.
- 다음 단계: - L-A4
  - L-C4

## 부족한 점

### L-A3-G1 · medium

126행 준비 검사가 studymate-mysql이름에 묶여 현재 프로젝트 compose와 어긋난다. 43행의 로그 없음=요청 미도달은 요청 로그가 설정되지 않은 정상 200/처리된 404에서도 성립하지 않을 수 있다는 반례를 다루지 않는다.

판정 범위: 해당 레슨과 명시한 후속 경로의 판정이며 전체 개념의 부재를 뜻하지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/A3-server-process-port.md](../../../../../lessons/A3-server-process-port.md)

## 확장 개발 명세

### L-A3의 후속 실습 보완

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

126행 준비 검사가 studymate-mysql이름에 묶여 현재 프로젝트 compose와 어긋난다. 43행의 로그 없음=요청 미도달은 요청 로그가 설정되지 않은 정상 200/처리된 404에서도 성립하지 않을 수 있다는 반례를 다루지 않는다.

**시작 상태**

이 레슨의 제공 예시와 문서에 지정한 선행 단계를 마친 별도 실습 복사본.

**학습자가 할 일**

동일 /hello에서 200이지만 요청 로그가 없는 경우와 서버 종료로 curl7인 경우를 나란히 기록한다. HTTP 상태·LISTEN·PID로 구분하고 로그 부재만으로 네트워크 장애를 확정하지 않는다. 준비 명령은 현재 mysql 서비스에 맞춘다.

**정상 사례**

PID·LISTEN·포트 충돌·종료 로그를 실제 운영체제 관찰과 맞춘다.

**실패·경계 사례**

동일 /hello에서 200이지만 요청 로그가 없는 경우와 서버 종료로 curl7인 경우를 나란히 기록한다. HTTP 상태·LISTEN·PID로 구분하고 로그 부재만으로 네트워크 장애를 확정하지 않는다. 준비 명령은 현재 mysql 서비스에 맞춘다.

**동시성·성능**

본문에 명시한 실험만 수행하며 단일 예시 통과를 동시성/운영 보장으로 확대하지 않는다.

**DB 관찰**

DB를 사용하는 후속이면 응답과 커밋된 행을 별도로 기록한다. 순수 Java 예시는 DB 대상이 아니다.

**합격 기준**

동일 /hello에서 200이지만 요청 로그가 없는 경우와 서버 종료로 curl7인 경우를 나란히 기록한다. HTTP 상태·LISTEN·PID로 구분하고 로그 부재만으로 네트워크 장애를 확정하지 않는다. 준비 명령은 현재 mysql 서비스에 맞춘다.

**기존 과제와 중복·연결**

- L-A4
- L-C4

**우선순위**

P1

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-A3/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-A3/screen.jpg`)
- 관찰: 없음
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-A3/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-A3/dom.txt`)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/A3-server-process-port.md](../../../../../lessons/A3-server-process-port.md) — 1~216행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-A3.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-A3.json`)
