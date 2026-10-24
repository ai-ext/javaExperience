# L-A5. A5. REST API 설계와 명세서 읽기

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [$WORKTREE_ROOT/concept-census-20261021/lessons/A5-rest-api-design.md](../../../../../lessons/A5-rest-api-design.md)

원문 SHA-256: `e4f2d1b01dda60f1ef7e95d3f63170680d1997a5b3e268f8f3c68c3c7621d722`

## 판정

설계 선택·정상·실패·전이 문제가 모두 있다. 동시 Map 연산의 원자성까지 보장하는 예제로 일반화하면 안 된다. 보완: POST 응답 유실과 재전송은 설명하지만 이 레슨의 반복은 모두 순차 성공 응답이다. T-026에 이미 있는 멱등 키 심화로 직접 가는 링크는 없다.

## 목표·선수 지식·학습자 작업

설계 선택·정상·실패·전이 문제가 모두 있다. 동시 Map 연산의 원자성까지 보장하는 예제로 일반화하면 안 된다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. 메모리 자원으로 POST/PUT/DELETE 반복 결과·Location·Allow를 관찰한다.

구현 대조: AtomicLong·ConcurrentHashMap을 쓰는 완전한 예시가 있고 종료 시 데이터 소멸을 명시한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: POST 응답 유실과 재전송은 설명하지만 이 레슨의 반복은 모두 순차 성공 응답이다. T-026에 이미 있는 멱등 키 심화로 직접 가는 링크는 없다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/A5-rest-api-design.md](../../../../../lessons/A5-rest-api-design.md) — 122~247행

### 2. PUT 누락 필드와 잘못된 경로 타입을 비교한다.

구현 대조: 본문 null과 400의 구체 예가 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: POST 응답 유실과 재전송은 설명하지만 이 레슨의 반복은 모두 순차 성공 응답이다. T-026에 이미 있는 멱등 키 심화로 직접 가는 링크는 없다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/A5-rest-api-design.md](../../../../../lessons/A5-rest-api-design.md) — 249~273행

### 3. 명세의 입력·상태·응답을 Spring 인자로 바꾸고10장으로 이동한다.

구현 대조: 멱등은 응답동일성이 아니라 상태라는 구별과10-11 연결이 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: POST 응답 유실과 재전송은 설명하지만 이 레슨의 반복은 모두 순차 성공 응답이다. T-026에 이미 있는 멱등 키 심화로 직접 가는 링크는 없다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/A5-rest-api-design.md](../../../../../lessons/A5-rest-api-design.md) — 275~350행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: 설계 선택·정상·실패·전이 문제가 모두 있다. 동시 Map 연산의 원자성까지 보장하는 예제로 일반화하면 안 된다.

- 현재 난이도: 입문·기초
- 판정 이유: 설계 선택·정상·실패·전이 문제가 모두 있다. 동시 Map 연산의 원자성까지 보장하는 예제로 일반화하면 안 된다.
- 다음 단계: - S-10-1
  - S-10-2
  - S-10-11
  - T-026

## 부족한 점

### L-A5-G1 · low

POST 응답 유실과 재전송은 설명하지만 이 레슨의 반복은 모두 순차 성공 응답이다. T-026에 이미 있는 멱등 키 심화로 직접 가는 링크는 없다.

판정 범위: 해당 레슨과 명시한 후속 경로의 판정이며 전체 개념의 부재를 뜻하지 않는다.

- [$WORKTREE_ROOT/concept-census-20261021/lessons/A5-rest-api-design.md](../../../../../lessons/A5-rest-api-design.md)

## 확장 개발 명세

### L-A5의 후속 실습 보완

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

POST 응답 유실과 재전송은 설명하지만 이 레슨의 반복은 모두 순차 성공 응답이다. T-026에 이미 있는 멱등 키 심화로 직접 가는 링크는 없다.

**시작 상태**

이 레슨의 제공 예시와 문서에 지정한 선행 단계를 마친 별도 실습 복사본.

**학습자가 할 일**

T-026으로 연결해 서버는 저장했으나 응답을 못 받은 클라이언트가 같은 키/다른 payload로 재요청하는 실패 창을 추가한다. 키 없는 POST 두 행과 키 있는 요청 한 행을 DB로 대조한다.

**정상 사례**

메모리 자원으로 POST/PUT/DELETE 반복 결과·Location·Allow를 관찰한다.

**실패·경계 사례**

T-026으로 연결해 서버는 저장했으나 응답을 못 받은 클라이언트가 같은 키/다른 payload로 재요청하는 실패 창을 추가한다. 키 없는 POST 두 행과 키 있는 요청 한 행을 DB로 대조한다.

**동시성·성능**

본문에 명시한 실험만 수행하며 단일 예시 통과를 동시성/운영 보장으로 확대하지 않는다.

**DB 관찰**

DB를 사용하는 후속이면 응답과 커밋된 행을 별도로 기록한다. 순수 Java 예시는 DB 대상이 아니다.

**합격 기준**

T-026으로 연결해 서버는 저장했으나 응답을 못 받은 클라이언트가 같은 키/다른 payload로 재요청하는 실패 창을 추가한다. 키 없는 POST 두 행과 키 있는 요청 한 행을 DB로 대조한다.

**기존 과제와 중복·연결**

- S-10-1
- S-10-2
- S-10-11
- T-026

**우선순위**

P2

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-A5/screen.jpg (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-A5/screen.jpg`)
- 관찰: 없음
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-A5/dom.txt (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-A5/dom.txt`)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [$WORKTREE_ROOT/concept-census-20261021/lessons/A5-rest-api-design.md](../../../../../lessons/A5-rest-api-design.md) — 1~350행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: $WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-A5.json (기록 경로: `$WORKTREE_ROOT/concept-census-20261021/audits/scenario-census-20261022/units/L-A5.json`)
