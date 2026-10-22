# P6. 기존 문서 정리 Implementation Plan

**Goal:** 과정 v2와 함께 쓰는 기존 자료(시나리오 1~16장, labs, DB-01~14, 공부자료, lessons, 티켓 30개, README, 에러 도감)를 "참고 도감"으로 쓸 수 있게 오류·흔적을 고친다. 원문 내용은 바꾸지 않고(설계 §6 "보관"), 틀린 사실·다른 저장소 흔적·깨진 예시·초안 문구만 고친다.

**근거:** 설계 `research/14-redesign-design.md` §6(저장소 변경 "수정·보관" 행), 조사 `research/01-javaExperience-analysis.md` §문제 표, `research/04-scenario-evaluation.md` §확인된 문제 표(2·3·5·7·8·11행), 전체 계획 지도 P6 행.

**작업 위치:** PR #9 브랜치 하나(`~/code/javaExperience/.worktrees/p1-spec-roadmap`).

## 범위

| # | 항목 | 대상 | 처리 |
|---|---|---|---|
| 1 | 다른 저장소 흔적 `studymate`·`StudyMate` | 학습자가 읽는 문서: `scenario/**`, `lessons/**`, `tickets/**`, `docs/knowledge/**`, `README.md`, `errors.md`, `intent.md`, `practice/**` | 이 저장소 기준 명령·경로·컨테이너 이름으로 바꾼다(예: `docker exec studymate-mysql-1` → 이 저장소 `compose.yaml`의 서비스 기준 `docker compose exec mysql`). 티켓의 `scripts/java-db.sh --reset` 전제는 이 저장소에 있는 대체 수단(`docker compose down -v`·덤프 복원 안내, 또는 snapshot)으로 바꾸거나 "이 저장소에는 없다"고 명시 |
| 2 | DB 포트 혼재 3306/13308 | 문서와 루트 `compose.yaml`·`src/main/resources/application.yml` | **호스트에서 접속하는 포트**는 루트 compose 기준(13308)으로 통일. 컨테이너 안 포트 3306(서비스 간 접속·`EXPOSE` 설명)은 맞는 문맥이면 그대로 둔다. 루트 `application.yml`이 3306을 가리키면 학습자 연습 코드라 고치지 않고(AGENTS.md "학습자 코드 보존"), 문서에 "compose를 쓰면 13308" 안내를 단다 — 이 판단을 Ruling으로 |
| 3 | `Docker Desktop` 전제 | `README.md`, `errors.md`, `docs/knowledge/D07·D15·R08`, `scenario/db-query-journey/db-14-*` | 로컬 Docker 런타임 중립 문구(예: "Docker 런타임(Colima 등)")로. 사내 표준은 Colima. 특정 제품 설치 절차가 필요하면 Colima 기준 |
| 4 | 깨진 셸 예시 | `scenario/ch11-*/11-2*` 358~369행(for … do / done 사이 빔, `up.json` 만드는 줄 없음), `scenario/ch10-*/10-4*` 265행 | 실제로 실행 가능한 명령으로 고치고, 가능하면 `bash -n`으로 문법 확인 |
| 5 | 지시 오기 | `scenario/ch16-*/16-2*` 1600행 "T4와 P" | 실제 항목(가짜 푸시 설정 요청은 마지막 항목)에 맞게 |
| 6 | 초안 문구 | DB-01 259행 "아직 … 시안 비교를 마치지 않은 초안", DB-02 79행 "DB-03 (현재 계획 단계)" | 현재 상태에 맞게(DB-03이 있으면 링크, 없으면 문구 제거) |
| 7 | 10장 v2 안내 | `scenario/ch10-project/` 상단 | 원문은 고치지 않고 상단에 "과정 v2의 명세서(course/spec-v2.md)와 응답 형식이 다르다(ApiResponse 래퍼 vs ProblemDetail 등)" 안내 상자 |
| 8 | 참고 도감 링크 | 시나리오 목차(`scenario/README.md` — 생성 영역 밖), 루트 `README.md` | 과정 v2(`course/README.md`, 홈)로 가는 안내 한 줄과, 일자 페이지 "참고 자료" 접기가 가리키는 문서들이 실제로 있는지 확인 |

**범위 밖:** `docs/design/**`, `docs/course-redesign/**`(작업 기록·이력 문서 — 흔적이 있어도 당시 기록이므로 고치지 않는다, Ruling), `board-server/`·`messy-server/`·`java-track/`·`course/`(과정 v2 산출물), 학습자 연습 코드 `src/`.

## 절차

1. 위 표의 대상마다 grep으로 전부 찾고, 바꾸기 전에 문맥을 읽는다(맞는 3306을 지우지 않게).
2. 고친다. 문장 단위로 최소 변경. 생성 영역(`<!-- toc:start -->` 등)은 손으로 고치지 않는다.
3. `cd tools/site && npm run build`(링크 오류 0) → `npm run audit:visual`·`audit:version-cards`·`audit:parity` → 생성 HTML을 함께 커밋(바뀐 md에 대응하는 HTML만).
4. 커밋은 항목 단위(1~8)로, `📝 docs: …`.
5. codex 리뷰 → 반영 → push → 원장(`plans/2026-10-23-p6-ledger.md`) 기록.

## 검증

- 학습자 문서 범위에서 `studymate`(대소문자 무시)·`Docker Desktop` 0건.
- 호스트 접속 포트 문맥에서 3306 잔존 0건(남긴 3306은 문맥 목록으로 보고).
- 고친 셸 예시 `bash -n` 통과.
- 사이트 빌드 링크 오류 0, audit 3종 통과.
