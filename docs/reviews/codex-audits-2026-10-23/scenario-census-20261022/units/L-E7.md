# L-E7. E7. JPA로 수정·삭제하기 — 변경 감지·삭제·대량 수정

기준일: 2026-10-22. 기준 HEAD: `ac41c5ed24b883742821f55da4e68a0ffc215b79`. 유형: `lesson`.

원문: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E7-jpa-update-delete.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E7-jpa-update-delete.md)

원문 SHA-256: `910c56a24ecc64eb353c8f944bf4f1173459e045b963d6dc99dabeb61c8c06a3`

## 판정

영속객체/SQL/커밋된 DB의 차이를 정상·실패 양쪽에서 다루는 강한 레슨이다. 격리 시작점과 동시 수정 후속 연결을 보강하면 된다. 보완: 409행 studymate 접속과 공유 practice의 고정 lesson_post/lesson_board를 DROP 후 재생성하는 시작점이 현재 환경과 분리되어 있지 않다. 값 변경과 자동 flush 관찰은 깊지만 동시 writer/version 충돌은 이 레슨의실험 범위가 아니다.

## 목표·선수 지식·학습자 작업

영속객체/SQL/커밋된 DB의 차이를 정상·실패 양쪽에서 다루는 강한 레슨이다. 격리 시작점과 동시 수정 후속 연결을 보강하면 된다.

문서의 예시를 실행하고 지정된 수정·실패 입력을 적용한다. 제공 코드 복사 단계와 확인 문제의 직접 작성 단계를 구분한다.

## 요구·구현·검사 대조

### 1. 트랜잭션/없음/save/readOnly/동일값의 SQL과 DB를비교한다.

구현 대조: 서로다른경로의완전 Service 코드와 DB 기대값이 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 409행 studymate 접속과 공유 practice의 고정 lesson_post/lesson_board를 DROP 후 재생성하는 시작점이 현재 환경과 분리되어 있지 않다. 값 변경과 자동 flush 관찰은 깊지만 동시 writer/version 충돌은 이 레슨의실험 범위가 아니다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E7-jpa-update-delete.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E7-jpa-update-delete.md:109) — 109~237행

### 2. 삭제·softdelete·벌크후 stale 객체·flush/clear를비교한다.

구현 대조: 다른테이블의미전송변경소실까지구체적으로다룬다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 409행 studymate 접속과 공유 practice의 고정 lesson_post/lesson_board를 DROP 후 재생성하는 시작점이 현재 환경과 분리되어 있지 않다. 값 변경과 자동 flush 관찰은 깊지만 동시 writer/version 충돌은 이 레슨의실험 범위가 아니다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E7-jpa-update-delete.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E7-jpa-update-delete.md:290) — 290~400행

### 3. 복사테이블을만들고14실험·HTTP/별도 SELECT 결과를대조한다.

구현 대조: 응답 200인데 DB 옛값인반례와실험테이블정리를명시한다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 409행 studymate 접속과 공유 practice의 고정 lesson_post/lesson_board를 DROP 후 재생성하는 시작점이 현재 환경과 분리되어 있지 않다. 값 변경과 자동 flush 관찰은 깊지만 동시 writer/version 충돌은 이 레슨의실험 범위가 아니다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E7-jpa-update-delete.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E7-jpa-update-delete.md:402) — 402~650행

### 4. enum 순서변경·Modifying/트랜잭션/Auditing 누락을실패시킨다.

구현 대조: 오류와조용한의미변경모두실행계약이 있다.

검사 대조: 문서 내 실행 예시·기대값·확인 문제를 대조했다. 본 레슨 전체 HTTP/IDE 실습은 이번에 재실행하지 않았다. 독립 Java 예시의 이번 실행은 runtime-lessons 결과를 별도로 연결한다.

공백 또는 한계: 409행 studymate 접속과 공유 practice의 고정 lesson_post/lesson_board를 DROP 후 재생성하는 시작점이 현재 환경과 분리되어 있지 않다. 값 변경과 자동 flush 관찰은 깊지만 동시 writer/version 충돌은 이 레슨의실험 범위가 아니다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E7-jpa-update-delete.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E7-jpa-update-delete.md:652) — 652~772행

## 이번 실행 근거

이번 단위 전체를 별도 실행하지 않았다. 문서의 기존 실행 예시·코드·검사 정의를 대조한 결과와 다른 단계의 실행 증거를 구분한다.

## 쿼리·DB 깊이와 다음 단계

DB/트랜잭션을 직접 다루는 레슨은 별도 행 비교를 기록한다. 이 레슨의 상세 범위: 영속객체/SQL/커밋된 DB의 차이를 정상·실패 양쪽에서 다루는 강한 레슨이다. 격리 시작점과 동시 수정 후속 연결을 보강하면 된다.

- 현재 난이도: 입문·기초
- 판정 이유: 영속객체/SQL/커밋된 DB의 차이를 정상·실패 양쪽에서 다루는 강한 레슨이다. 격리 시작점과 동시 수정 후속 연결을 보강하면 된다.
- 다음 단계: - L-G3
  - L-G4
  - S-3-1
  - S-3-2
  - S-10-12
  - T-025

## 부족한 점

### L-E7-G1 · low

409행 studymate 접속과 공유 practice의 고정 lesson_post/lesson_board를 DROP 후 재생성하는 시작점이 현재 환경과 분리되어 있지 않다. 값 변경과 자동 flush 관찰은 깊지만 동시 writer/version 충돌은 이 레슨의실험 범위가 아니다.

판정 범위: 해당 레슨과 명시한 후속 경로의 판정이며 전체 개념의 부재를 뜻하지 않는다.

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E7-jpa-update-delete.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E7-jpa-update-delete.md)

## 확장 개발 명세

### L-E7의 후속 실습 보완

상태: **제안·미구현**. 이 문서 작성만으로 학습 실습이 구현됐다고 표시하지 않는다.

**이유**

409행 studymate 접속과 공유 practice의 고정 lesson_post/lesson_board를 DROP 후 재생성하는 시작점이 현재 환경과 분리되어 있지 않다. 값 변경과 자동 flush 관찰은 깊지만 동시 writer/version 충돌은 이 레슨의실험 범위가 아니다.

**시작 상태**

이 레슨의 제공 예시와 문서에 지정한 선행 단계를 마친 별도 실습 복사본.

**학습자가 할 일**

현재설정에맞춘개별 disposable DB를복원가능한시작점으로제공한다. 동시 수정은 T-025로직접연결하고 bulk DML이 version/감사필드를자동갱신하는지별도계약을정해정확행수·stale 객체·재조회·rollback 결과로검증한다.

**정상 사례**

트랜잭션/없음/save/readOnly/동일값의 SQL과 DB를비교한다.

**실패·경계 사례**

현재설정에맞춘개별 disposable DB를복원가능한시작점으로제공한다. 동시 수정은 T-025로직접연결하고 bulk DML이 version/감사필드를자동갱신하는지별도계약을정해정확행수·stale 객체·재조회·rollback 결과로검증한다.

**동시성·성능**

본문에 명시한 실험만 수행하며 단일 예시 통과를 동시성/운영 보장으로 확대하지 않는다.

**DB 관찰**

DB를 사용하는 후속이면 응답과 커밋된 행을 별도로 기록한다. 순수 Java 예시는 DB 대상이 아니다.

**합격 기준**

현재설정에맞춘개별 disposable DB를복원가능한시작점으로제공한다. 동시 수정은 T-025로직접연결하고 bulk DML이 version/감사필드를자동갱신하는지별도계약을정해정확행수·stale 객체·재조회·rollback 결과로검증한다.

**기존 과제와 중복·연결**

- L-G3
- L-G4
- S-3-1
- S-3-2
- S-10-12
- T-025

**우선순위**

P2

## 화면·최신 변형·검증 한계

- 상태: captured_not_reviewed
- 화면 증거: - [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E7/screen.jpg](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E7/screen.jpg)
- 관찰: 없음
- 검증 한계: 실제 첫 화면/해당 앵커의 캡처와 DOM은 저장했다. 이 단위의 전 화면·모바일·상호작용을 시각 검증한 것은 아니다.
- dom_snapshot: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E7/dom.txt](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/_data/screens/L-E7/dom.txt)

- markdown_same: 예
- html_same: 아니오

- 문서의 기존 실측 출력은 이번 실측과 구분한다.
- 모든 변형·확인 문제·IDE 조작을 재실행하지 않았다.

## 읽은 구현 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E7-jpa-update-delete.md](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/lessons/E7-jpa-update-delete.md:1) — 1~786행 (독립 학습 예시의 Java/curl/출력/확인문제와 정답)

구조화 원본: [/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-E7.json](/Users/ds/code/javaExperience/.worktrees/concept-census-20261021/audits/scenario-census-20261022/units/L-E7.json)
