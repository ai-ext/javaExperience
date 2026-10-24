# P7. 과정 전체 재검증 Implementation Plan

**Goal:** 전체 계획 지도 §P7(사용자 요청 2026-10-22)대로, P1~P6이 끝난 상태에서 **학습자 한 명이 처음 보는 눈으로** D0~D15, J00~J15, B01~B16(+E01)을 처음부터 끝까지 따라가며 정독·실행·화면을 검증하고, 문제 목록과 수정을 남긴다.

**작업 위치:** PR #9 브랜치 하나. 검증은 **커밋된 상태**(HEAD)를 기준으로 한다. 날짜별 정답 snapshot은 worktree를 만들지 않고 `git archive <태그 또는 SHA> board-server | tar -x -C <scratch>`로 풀어 본다(브랜치 하나·worktree 정리 원칙). 다 쓴 사본은 바로 지운다(디스크 여유가 작다).

## 검증 축 (전체 계획 지도 §P7)

1. **정독** — 일자 페이지마다
   - "오늘 순서"만 보고 무엇을 만들지 알 수 있는가(만들 파일·완료 조건·명세 링크가 충분한가)
   - 명세서 v2·순서표·말하기 카드·정답 코드·흐름 재생 값이 서로 맞는가
   - 기술 사실 오류가 없는가(Spring Boot 4.1.1·Hibernate 7·MyBatis 4·Redis·MySQL 8.4 기준)
2. **실행**
   - 날짜별 정답 snapshot(answer-d01~d10 태그 시점, 그리고 answer-fix 반영 HEAD)에서 board-server 테스트가 통과하는가(이 머신: 호스트 JDK 21, 환경 한정 PgClientRetryTest 2건 제외)
   - 일자 페이지의 요청 예시가 정답 서버에서 기대 응답을 돌려주는가(대표 요청 몇 개를 실제 bootRun + compose로)
   - Java 학습 테스트: 뼈대에서 실패, 정답으로 통과(`:java-track:check`), 학습자처럼 J 하나를 실제로 풀어 보기(표본 2개)
   - 티켓: `tools/tickets/verify.sh --full`(17개)·`--all-fixes`, repro.sh가 증상을 재현하는가(표본)
3. **화면** — 브라우저(Playwright)로 데스크톱(1440)·모바일(390), 라이트·다크
   - 홈, 과정 지도, D01·D04·D08·D09·D12·D15, J04·J11, B01·B05·B16·E01
   - 흐름 재생(이전·다음·재생·속도), 정지 상태 가독성, 진도 체크, 콘솔 오류 0, 가로 스크롤 없음

## 분담 (병행, 파일 수정 없이 검증 → 문제 목록. 수정은 컨트롤러가 묶어서 배정)

| 담당 | 범위 |
|---|---|
| R1 | 1단계 D00~D10 정독 + 날짜별 snapshot 테스트 + 대표 요청 실행 |
| R2 | 2단계·마무리 D11~D15 + 티켓 17개 정독 + verify.sh 전체 + repro 표본 + 장애 훈련 |
| R3 | Java 트랙 J00~J15 정독 + check + 표본 2개 직접 풀이 |
| R4 | 화면 전체(위 목록) + 접근성·모바일 |

각 담당은 `docs/course-redesign/plans/p7-findings/R*.md`에 문제 목록(심각도 blocker/major/minor, 위치, 근거, 재현, 제안)을 쓴다. 컨트롤러가 codex(gpt-6-astra)로 목록을 교차 검증하고, 수정 묶음을 배정·검증·커밋한다.

## 완료 조건

- R1~R4 문제 목록 커밋, blocker·major 전부 수정 또는 원장에 근거 있는 보류, minor는 수정 또는 목록화.
- 최종: board-server 전체 테스트, messy-server 전체 테스트, `verify.sh --full`·`--all-fixes`, `:java-track:check`, 사이트 빌드·audit·test:*, 브라우저 스모크.
- 원장 `plans/2026-10-23-p7-ledger.md`에 실행 기록.
