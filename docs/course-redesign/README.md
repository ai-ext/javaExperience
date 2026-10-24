# 온보딩 과정 개편 (course v2) — 작업 기록

2026-10-22 작업분. 설계·조사·계획 문서와 진행 원장이다.

| 폴더 | 내용 |
|---|---|
| [research/](research/README.md) | 현 시나리오 평가(01~04), 3~6년차 기준선·Spring·DB·장애·운영·커뮤니티·넷마블 조사(05~13), **개편 설계(14)** |
| [plans/](plans/2026-10-22-00-overall-roadmap.md) | 전체 계획 지도(P1~P7), P1·P2 상세 계획, 원장(판단 기록 포함) |

> **다른 장비에서 이어 할 때는 [HANDOFF.md](HANDOFF.md)부터 읽는다.** (2026-10-23 중단 지점·미커밋 작업 패치·남은 일·작업 방식·환경 주의점)

## 현재 확장 (2026-10-24)

P9는 D01~D15 번호·카드를 유지하고 D16~D45를 추가한다. D15는 중간 점검, 후반은 개인 과제·필수 관찰·새 요구 설계·운영 변경·재개 작업·네 회의·독립 평가다. [설계·날별 분량·구현 결과](plans/2026-10-24-p9-d16-d30.md) · [원장](plans/2026-10-24-p9-ledger.md). 아래 P1~P7 표는 당시 기록이며 현재 확장/검사 상태를 대신하지 않는다.

## 이전 상태 (2026-10-23)

| 단계 | 내용 | 상태 | 계획서 · 원장(판단 기록) |
|---|---|---|---|
| P1 | 명세서 v2(엔드포인트 30개), 순서표 D1~D15·J0~J15·B1~B16, 말하기 카드 68장, 검증기 `tools/course/` | **완료** | [계획](plans/2026-10-22-p1-spec-roadmap.md) · [원장](plans/2026-10-22-p1-ledger.md) |
| P2 | 1단계 정답 서버 `board-server/` D01~D10 — 순서마다 커밋 `answer(Dnn-m)`, 리뷰 반영 `answer-fix(Dnn-m)` | **완료** (테스트 377개, 이 장비 375 통과 + 환경 한정 2) | [계획](plans/2026-10-22-p2-answer-server.md) · [원장](plans/2026-10-22-p2-ledger.md) |
| P3 | Java 트랙 `java-track/` J00~J15 학습 테스트(뼈대 `src/main`·정답 `src/answer`) + 페이지 `course/java/` | **완료** (`:java-track:check` 통과, 개별 테스트 323개) | [계획·실행 기록](plans/2026-10-22-p3-java-track.md) |
| P4 | 2단계 어수선한 서버 `messy-server/` + 결함 티켓 B01~B16·고도화 E01 (확인 테스트·정답 패치 `messy-server/tickets/`, 페이지 `course/tickets/`, 검증 `tools/tickets/verify.sh`) | **마무리 중** — 17개 모두 커밋, P·T 영역은 리뷰 반영·검증 끝, S 영역(B08·B11~B14·B16·장애 훈련) 리뷰 반영 중 | [계획](plans/2026-10-23-p4-messy-server.md) · [원장](plans/2026-10-23-p4-ledger.md) |
| P5 | 일자 페이지 `course/spring/D00~D15`(생성기 `tools/course/build-days.mjs`), 렌더러·홈·과정 지도 `course/map`, 요청·장애 흐름 재생, 미캔 요소 | **완료** (리뷰 반영 끝, 티켓 흐름 데이터 B04 동기화 1건 남음) | [계획](plans/2026-10-23-p5-day-pages.md) · [원장](plans/2026-10-23-p5-ledger.md) |
| P6 | 기존 문서 정리(다른 저장소 흔적, 포트 13308, Docker 런타임 문구, 깨진 셸 예시, 10장 v2 안내, 참고 도감 링크) | **완료** (리뷰 반영 끝) | [계획](plans/2026-10-23-p6-doc-cleanup.md) · [원장](plans/2026-10-23-p6-ledger.md) |
| P7 | 과정 전체 재검증(학습자 눈으로 정독·실행·화면) | **진행 중** — R1(1단계)·R3(Java 트랙) 결과 반영 끝, R2(2단계·티켓)·R4(화면)는 P4 마무리 뒤 | [계획](plans/2026-10-23-p7-full-review.md) · [원장](plans/2026-10-23-p7-ledger.md) · [결과](plans/p7-findings/) |

검증 방식: 단계마다 구현은 서브에이전트, 검증은 컨트롤러가 직접 실행 + codex(gpt-6-astra) 리뷰 → 지적 반영 → 커밋·PR #9 push → 원장 기록.

## 이어서 할 일

1. P4 S 영역 리뷰 반영 마무리 → 티켓 17개 `tools/tickets/verify.sh --full`·`--all-fixes` 전체 재검증 → 티켓 흐름 데이터(`course/flows/tickets.json`)를 최종 티켓 페이지와 동기화
2. P7 R2(2단계 D11~D15·티켓·장애 훈련)·R4(화면 데스크톱·모바일) 검증 → 반영
3. 2단계 일자 페이지 D11~D15 완성(지금은 "준비 중" 자리표시) — hints.json D11~D15
4. 미뤄 둔 항목(각 원장의 `minor (deferred)`)
   - P2: 랭킹 수동 rebuild 경합, 업로드 file 파트 누락 시 errors[], 위치 커서의 캐시 재적재 겹침
   - P2→P4 티켓 후보: 좋아요 예외 삼킴, 태그 동시 생성 UNIQUE, 작성자 수정과 숨김 경합
   - P6: 덤프 복원 절차 없음, 없는 practice/starter compose를 가리키는 공부자료 일부

## 실행 메모

- 호스트에 JDK 21이 있으면 `cd board-server && ./gradlew test`. 없으면 `tools/course/gradle-docker.sh board-server test` (JDK 21 컨테이너 + Colima 소켓, Colima 전용)
- Java 트랙: `./gradlew :java-track:test --tests 'J05*'`(학습자 상태, 뼈대면 실패), `./gradlew :java-track:check`(정답 검증). 루트 `./gradlew test`는 java-track을 돌리지 않는다
- 문서 검증: `cd tools/site && npm run test:course && npm run validate:course`
