# 인계 — course v2 개편 (PR #9)

2026-10-23 초기 검증 환경에서 중단했다. 다른 개발 환경에서 이 문서만 보고 이어서 할 수 있게 적는다.

- PR: https://github.com/ai-ext/javaExperience/pull/9
- 브랜치: `course/p1-spec-roadmap` (이 브랜치 **하나**에서만 작업한다. 별도 PR·임시 브랜치·임시 worktree를 만들지 않는다 — 사용자 지시)
- 진행 표·계획서·원장 링크: [README.md](README.md)

## 1. 지금 어디까지 했나

| 단계 | 상태 | 비고 |
|---|---|---|
| P1 명세·순서표·말하기 카드 | 완료 | |
| P2 1단계 정답 서버 `board-server/` | 완료 | 테스트 377개(초기 검증 환경 375 통과, 아래 환경 한정 2건) |
| P3 Java 트랙 `java-track/` | 완료 | `:java-track:check` 통과, 개별 테스트 323개 |
| P4 2단계 `messy-server/` + 티켓 B01~B16·E01 | 완료 | P·T·S 영역 끝. S 영역 리뷰 반영은 2026-10-23 후속 검증 환경에서 마침 → 2절 |
| P5 일자 페이지·화면 | 완료 | 티켓 흐름 데이터 B04 동기화 1건 남음 → 3절 2번 |
| P6 기존 문서 정리 | 완료 | |
| P7 전체 재검증 | **진행 중** | R1(1단계)·R3(Java) 검증·반영 끝. R2(2단계·티켓)·R4(화면) 남음 |

## 2. P4 S 영역 리뷰 반영 — 완료 (2026-10-23)

codex 리뷰 [reviews/p4-S.md](handoff/reviews/p4-S.md)의 9건을 모두 반영했다. 초기 검증 환경에서 멈췄을 때 보관한 미완성 패치는 후속 검증 환경에서 적용해 마무리했고, 적용이 끝나 리포에서 지웠다.

- 커밋: `83b4647`(장애 훈련 도구·compose Redis 16381), `2dc8dc1` B11, `50751f7` B12, `f79fdc5` B14, `d8a3a6a` B16, `27591ee` 원장. 독립 리뷰 minor 4건 반영은 그 뒤 커밋(P8 원장)
- 검증: `verify.sh --full B08 B11 B12 B13 B14 B16` OK, 장애 훈련 주입·복구 실제 실행. 결과·Ruling은 [P4 원장](plans/2026-10-23-p4-ledger.md) 끝, [P8 원장](plans/2026-10-23-p8-ledger.md)

## 3. 남은 일 (순서대로)

1. ~~**P4 S 마무리**~~ — 완료(2절).
2. **티켓 전체 재검증과 흐름 데이터 동기화**
   - `TICKET_WORK_DIR=/tmp/tk tools/tickets/verify.sh --full` (17개 전부: 결함 상태에서 단언 실패 → 정답 패치 후 통과 → 전체 테스트 통과)
   - `TICKET_WORK_DIR=/tmp/tk tools/tickets/verify.sh --all-fixes` (정답 패치 17개 누적 적용 + 전체 테스트)
   - `course/flows/tickets.json`을 최종 티켓 페이지(`course/tickets/*.md`)와 맞춘다. 지금 B04가 어긋나 `cd tools/site && npm run test:course-pages`가 "B04 단계 3(open): … 접기 밖에 있다"로 실패한다. 증상 단계 문장은 티켓 페이지의 접기 **밖** 문장, 원인 단계는 "원인과 정답" 접기 **안** 문장에서만 가져온다(P5 원장 Ruling).
   - 사이트 빌드 후 생성 HTML(`course/tickets/*.html`·`drill.html`·`index.html`·`README.html` 등)을 커밋.
3. **P7 R2·R4** — [P7 계획](plans/2026-10-23-p7-full-review.md)의 R2(2단계 D11~D15·티켓 17개 정독·verify·repro 표본·장애 훈련), R4(화면: 홈·지도·D01·D04·D08·D09·D12·D15·J04·J11·B01·B05·B16·E01을 1440·390 폭, 라이트·다크) → 결과를 `plans/p7-findings/R2.md`·`R4.md`로 → 반영.
4. **2단계·마무리 일자 페이지 D11~D15 완성** — 지금 "준비 중" 자리표시다. `course/hints.json`에 D11~D15 항목(순서별 힌트, 채점 프롬프트)을 넣으면 `tools/course/build-days.mjs`가 완성 페이지를 만든다(2단계 날은 정답 칸 대신 티켓 페이지 "원인과 정답" 링크).
5. **미뤄 둔 항목** — 각 원장의 `minor (deferred)` 줄(P2·P4·P5·P6 원장). 대표: 랭킹 수동 rebuild 경합, 업로드 file 파트 누락 시 errors[], 덤프 복원 절차 없음, 없는 `practice/starter` compose를 가리키는 공부자료 일부.

## 4. 작업 방식 (지금까지 이렇게 했다 — 사용자 지시)

- 단계마다: 구현은 서브에이전트 → **컨트롤러가 직접 실행해 검증** → codex 리뷰 → 지적 반영 → 커밋 → `git push origin course/p1-spec-roadmap` → 해당 원장(`plans/*-ledger.md`)에 결과·판단(Ruling)·미룬 항목 기록.
- codex 리뷰: [handoff/codex-review.sh](handoff/codex-review.sh) `<이름> <지시파일>` — `gpt-6-astra`(실패 시 `gpt-6-sol`), `codex exec -c model_provider=openai -m gpt-6-astra -s read-only …`. 결과는 `$CODEX_REVIEW_DIR/reviews/<이름>.md`(기본 `./.codex-reviews`, 커밋하지 않는다).
- P4 구현자 공통 지시서: [handoff/p4-implementer-instructions.md](handoff/p4-implementer-instructions.md) (안의 scratch 경로는 초기 검증 환경 세션 경로라 바꿔 쓴다).
- 병행할 때는 담당별 **파일 소유**를 나누고, 커밋은 반드시 경로 지정(`git commit -m … -- <경로>`). `git add -A`·`commit -a`·stash·rebase·reset 금지. Gradle은 같은 빌드 디렉터리를 여러 담당이 동시에 쓰지 않게 각자 리포 밖 사본에서 돌린다(`tools/tickets/verify.sh`도 리포 밖 사본에서 돈다).
- 커밋 메시지 접두어는 추출 키라 바꾸지 않는다: `answer(Dnn-m)`·`answer-fix(Dnn-m)`(정답 서버), `java(Jnn)`(Java 트랙), `messy(Bnn)`(2단계). 그 밖은 gitmoji 형식(`📝 docs:` 등).
- 결정이 필요하면 멈추지 말고 판단해서 원장에 Ruling으로 남긴다(사용자는 대기를 싫어한다).

## 5. 환경 주의점

| 항목 | 내용 |
|---|---|
| JDK | 호스트 JDK 21로 `./gradlew` 직접 실행. 셸 기본 `JAVA_HOME`이 11일 수 있으니 확인(`verify.sh`는 `TICKET_JAVA_HOME`, 미지정 시 `JAVA_HOME` 또는 `PATH`를 쓴다) |
| Docker | Docker 런타임을 켜고 `docker info`·`docker compose version`으로 확인한다. 저장소와 임시 사본의 경로를 파일 공유 범위에 포함한다. 컨테이너 Gradle은 소켓 공유·host networking 지원이 필요하다(Docker Desktop은 해당 기능 활성화). 기본 방법은 호스트 JDK 21에서 실행하는 것이다. 과거 초기 환경에서는 파일 공유 범위가 제한되어 Testcontainers bind mount 경로를 옮겼다 |
| 환경 한정 실패 | `PgClientRetryTest`의 연결 실패 2건(`연결_실패는_재시도하고_복구되면_성공한다`, `연결_실패가_계속되면_백오프_후_3번째에_포기한다`)은 초기 검증 환경 포트 포워더가 끊긴 프록시 연결을 받아 둬서 항상 실패했다. 후속 검증 환경에서도 호스트 Gradle(Docker 포트 포워더 경유)로 돌리면 같은 이유(TIMEOUT)로 실패하고, Docker 런타임의 VM 안(`tools/course/gradle-docker.sh`, `--network host`)에서 실행했을 때는 통과했다(P8 원장). `verify.sh --full`은 이 2건만 허용한다 |
| 디스크 | 초기 검증 환경에서 디스크 99%로 Docker VM이 멈춘 적이 있다. Testcontainers 잔여 컨테이너·익명 볼륨이 쌓이면 `docker container prune --filter label=org.testcontainers=true`, `docker volume prune`(이름 없는 볼륨만)으로 정리 |
| bash | macOS 기본 bash 3.2 — `mapfile` 없음. 스크립트에서 `$N명`처럼 변수 뒤에 한글이 붙으면 변수 이름으로 읽혀 `set -u`에서 멈춘다 → `${N}명` |
| 사이트 | `cd tools/site && npm install` 먼저(새 장비). 빌드 `npm run build`, 검사 `test:course`·`validate:course`·`test:course-pages`·`audit:visual`·`audit:version-cards`·`audit:parity` |
| 태그 | `answer-d01`~`answer-d10`은 **로컬 태그**(push 안 함). 새 장비에는 없다. 필요하면 P2 원장의 "complete (commits X..Y)" 끝 SHA에 다시 단다 |

## 6. 바로 쓸 명령 모음

```bash
cd board-server && ./gradlew test                         # 정답 서버
./gradlew :java-track:check --rerun-tasks                 # Java 트랙(리포 루트)
TICKET_WORK_DIR=/tmp/tk tools/tickets/verify.sh --full    # 티켓 17개
TICKET_WORK_DIR=/tmp/tk tools/tickets/verify.sh --all-fixes
node tools/course/build-days.mjs --check                  # 일자 페이지 생성물 최신 여부
node --test tools/course/build-days.test.mjs
cd tools/site && npm run build && npm run test:course && npm run validate:course && npm run test:course-pages
```
