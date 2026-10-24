# I17 이벤트·비동기·outbox: 지금의 업무경계에서 나중으로 연결

우선순위: **P2** / 판정: **심화 내용 있음 · 기본학습 선행조건으로 확대하지 않음**

검토일: 2026-10-21 KST. 읽기 전용 정적 감사이며 이 담당자는 원본 수정·빌드·테스트·DB 실행을 하지 않았다. 현재 작업 중인 worktree의 파일을 읽었으므로 아래 SHA256 manifest 시점의 판단이다. 기존 문서의 실행 성공 기록은 과거 기록이며 이번 실행으로 표시하지 않는다. 학습자 미구현은 의도된 실습 상태다. 아래 기존 학습자 상태는 main 및 기존 두 worktree의 확보 시점 기준이다. 감사 중 별도로 발견한 common-learning-foundation의 새 학습자 소스는 해당 항목의 추가 확인 단락으로 구분한다.

## 학습 계약

기본 관계쓰기와 트랜잭션을 익힌 뒤 DB밖 부수 효과의 rollback 불가능성과 commit뒤전달 유실을 구분한다. 이벤트 발행, 실제전달, 재시도, 영속기록이 같은 보장이 아님을 설명한다.

## 실제 학습자 코드·정답·문서·UI의 상태

16-1은 AFTER_COMMIT과 알림저장REQUIRES_NEW, rollback시 미호출, 모든 발행 경로를 다룬다. 16-2는 전용executor, CallerRunsPolicy, 짧은tx, 실패 회원 기록, 서버 중단 시 미전달과 outbox 필요성을 채점R4까지 명시한다. 개념S08도 관련 실험이 있다. outbox 개념이 없다는 평가는 사실과 다르다.

## 빠진 설명·직접 연습·합격 판정

현재 사용자의 Service·관계모델 장벽을 해결하기 위해 outbox부터 추가할 필요는 없다. 다만 16장 도달 시 AFTER_COMMIT이 내구성 보장을 뜻하지 않는다는 장애전후 과제를 직접 수행해야 한다. 확인한16-1/16-2 범위에서 outbox의 실제 발행기·재처리 계약을 구현하는 과제는 별도 제공되지 않으므로 심화전이 공백으로 남긴다.

## 보완할 과제: 입력·전후 상태·SQL·실패

입력: 새글+팔로워2명. 먼저 commit→알림2, rollback→글0/알림0. 다음 FakePushSender 한명실패→다른회원계속, DB글유지. 선택심화: commit후알림전 종료에 글은 있고 전달기록은 없는 상태를 만든다. outbox를 택했다면 post와 outbox행의 같은tx, 전송후상태표시, 중복이벤트 식별키를 설계한다.

## 관찰 가능한 합격 기준

“응답201=모든알림전달”로 주장하지 않는다. 글정합성, 알림저장, 외부전달 성공을 각각 관찰한다. 재시도가 가능한 실패와 중복수신 처리, 종료후 복구범위를 설명한다. 선택심화에는 최소 한번전달의 중복가능성을 포함한다.

## 한계와 정확성 확인

기본 완료를 위한필수 범위가 아닌 후순위다. 외부 메시지 브로커 설치를 일괄 요구하지 않는다. 기존 supplemental 기록은 이번 실행이 아니다.

## 근거: 절대경로와 라인

- [$WORKTREE_ROOT/scenario-crud-redesign/scenario/ch16-events-async-cache/16-1-new-post-event.md:149](../../../../../scenario/ch16-events-async-cache/16-1-new-post-event.md) (L149–L168) — 직접 읽은 원문/코드
- [$WORKTREE_ROOT/scenario-crud-redesign/scenario/ch16-events-async-cache/16-2-async-notification.md:154](../../../../../scenario/ch16-events-async-cache/16-2-async-notification.md) (L154–L160) — 직접 읽은 원문/코드
- [$WORKTREE_ROOT/scenario-crud-redesign/scenario/ch16-events-async-cache/16-2-async-notification.md:1909](../../../../../scenario/ch16-events-async-cache/16-2-async-notification.md) (L1909–L1920) — 직접 읽은 원문/코드
- $WORKTREE_ROOT/concept-learning-night/tools/site/s08-lesson-data.mjs:1157 (기록 경로: `$WORKTREE_ROOT/concept-learning-night/tools/site/s08-lesson-data.mjs:1157`) (L1157–L1161) — 개념 worktree 표시 데이터, 기존 실험 기록
- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/S08-transactions.md:255](../../../../knowledge/S08-transactions.md) (L255–L275) — outbox 스키마/처리절차가 이미 있는 원문

## 구분해서 읽기

학습자 src는 본인이 구현 중인 프로젝트다. snapshot manifest와 blobs는 단계별 완성 참조 코드다. functional 화면은 제공된 공통 부분과 Service 구현 빈칸을 조합한 별도 과제다. 개념 worktree의 supplemental은 별도 모델/환경의 실험 기록이므로 게시판 API가 구현됐다는 증거가 아니다. HTML은 정적 내용과 참조 연결만 확인했으며 이 담당자는 브라우저에서 실행하지 않았다.
