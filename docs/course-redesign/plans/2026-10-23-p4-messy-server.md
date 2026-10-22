# P4. 2단계 어수선한 서버와 티켓 B01~B16 Implementation Plan

**Goal:** 설계 §5-3대로 "다른 사람이 짠 코드"를 만든다. 출발점은 1단계 정답(`answer-d10`)이고, 결함 B01~B16을 심고 티켓에 필요한 기능(B04 알림, B09 출석)을 덧붙인다. 결함마다 재현 스크립트, 확인 테스트, 정답 수정이 있고, 티켓 페이지 `course/tickets/Bnn.md`가 있다.

**Spec:** 설계 `docs/course-redesign/research/14-redesign-design.md` §5-3(티켓 표: 증상·심은 원인·진단 도구·근거), `course/roadmap.json` days D11~D14(티켓 배정·단계 제목), `course/spec-v2.md`, 원장 `plans/2026-10-22-p2-ledger.md`의 deferred 항목(P4 티켓 후보).

**작업 위치:** PR #9 브랜치 `course/p1-spec-roadmap` 하나(`~/code/javaExperience/.worktrees/p1-spec-roadmap`). 설계는 별도 브랜치 `messy`였지만 브랜치 하나 원칙에 따라 **디렉터리 `messy-server/`**로 둔다(Ruling). 커밋 `9743ba3`이 answer-d10 복사본이다.

## 구조

```
messy-server/                       학습자가 넘겨받는 서버(결함이 심긴 상태). 자체 테스트는 모두 통과한다(결함을 드러내는 정답 테스트는 지우거나 약하게 바꾼다 — "남이 짠 코드"의 얇은 테스트)
messy-server/tickets/Bnn/
  repro.sh 또는 README의 재현 절차   학습자에게 공개: 증상을 재현하는 스크립트(curl·부하·SQL·장애 주입)
  answer/BnnConfirmTest.java        채점용 확인 테스트(package com.example.board.tickets). 결함 상태에서 실패, 수정 후 통과
  answer/fix.patch                  정답 수정(messy-server 루트 기준 git diff, `git apply`로 적용)
course/tickets/Bnn.md               티켓 페이지: 증상(티켓 문장)·환경·재현 방법·제출물(원인 서술 + 재현 테스트 + 수정) 칸, 원인 해설과 정답은 <details> 접기 안
tools/tickets/verify.sh             티켓 정답 검증: 복사본에서 ① 결함 상태 실패 ② fix.patch 적용 후 통과 (--full이면 전체 테스트도)
```

- `messy-server/tickets/`는 Gradle 소스 세트에 넣지 않는다(학습자 빌드에 확인 테스트가 섞이지 않게).
- 결함 하나 = 커밋 하나: `messy(Bnn): <증상 한 줄>` + 본문 끝 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. 커밋에는 결함 주입(코드) + 노출 테스트 제거/약화 + `tickets/Bnn/**` + `course/tickets/Bnn.md`가 함께 들어간다.
- 결함 코드에는 "결함" 주석을 달지 않는다(학습자가 읽는다). 대신 흔한 실무 코드처럼 그럴듯한 주석·이름을 쓴다. 단 금지 단어(`Docker Desktop`, `studymate`)는 쓰지 않는다.
- 티켓 페이지는 **증상만** 쓴다. 일부(설계: B01·B03·B06·B16 권장)에는 오진을 부르는 단서를 섞는다(예: "DB가 느린 것 같다").

## 결함 목록 (설계 §5-3 표)

| # | 증상 | 심는 원인 | 담당 |
|---|---|---|---|
| B01 필수 | PG가 느린 날 글 목록까지 멈춘다 | 충전에서 PG 호출을 트랜잭션 안으로 → Hikari 풀 고갈 | T |
| B02 필수 | 글 목록이 어느 날부터 느리다 | 목록 인덱스 순서 오류(`(id, status)`) → 데이터 증가 후 풀스캔·filesort | P |
| B03 필수 | 예외를 잡았는데도 구매가 롤백된다 / 안 된다 | self-invocation으로 `@Transactional` 무시 + 안쪽 REQUIRED 예외로 rollback-only | T |
| B04 필수 | 알림 채널 하나 추가하는데 세 군데가 깨진다 | 비대한 `PostService`(알림 채널 분기 포함, 800줄 규모) + 필드 주입 순환 | P |
| B05 | 부하 때만 다른 사람 값이 섞인다 | 싱글톤 빈의 상태 필드 | T |
| B06 | 컬럼 하나 추가했더니 상점 전체가 멈췄다 | 상점 흐름의 긴 트랜잭션 + ALTER의 MDL 대기 | T |
| B07 | 쿠폰 동시 사용에서 가끔 실패한다 | 없는 행 `SELECT … FOR UPDATE` 후 INSERT → gap lock 데드락 | T |
| B08 | 회원 API 응답에 비밀번호 해시가 보인다 | 엔티티 직접 응답 | S |
| B09 | 자정 전후 출석 포인트가 두 번 쌓인다 | 출석 기능(신규) — 시간대·`LocalDate` 경계 | P |
| B10 | 포인트 충전이 가끔 두 번 된다 | 타임아웃 후 재시도 + 멱등 키 없음 | T |
| B11 | prod에서 설정값이 안 바뀐다 | yml 우선순위 착각 | S |
| B12 | 새 프론트 도메인에서만 호출이 실패한다 | CORS 누락, preflight가 인증 필터에 막힘 | S |
| B13 | PG 결제 완료 콜백이 전부 401 | 콜백 경로가 인증 필터에 걸림 | S |
| B14 | 운영에서 `/actuator/env`가 인증 없이 열린다 | `permitAll` 규칙 순서, 노출 설정 | S |
| B15 | 숨긴 글이 인기글에 1분간 계속 보인다 | 커밋 전 캐시 삭제 → 옛 값 재적재 | P |
| B16 | Redis 점검 시간에 글쓰기까지 멈췄다 | Redis 타임아웃 미설정, 캐시 실패 전파 | S |

원장 deferred 항목 중 P4 후보(태그 동시 생성 UNIQUE, 댓글·좋아요 잠금 교차, 숨김 중 수정으로 status 복귀, PostLikeService 예외 삼킴)는 이번 16개에 넣지 않는다. 티켓 페이지에서 "더 찾아볼 것"으로만 남겨도 된다.

## 담당과 파일 소유 (병행 — 같은 worktree, 파일이 겹치지 않게)

- **S (보안·설정·Redis 설정)**: B08, B11, B12, B13, B14, B16. 소유: `config/**`, `member/**`, `common/GlobalExceptionHandler.java`, `common/ErrorCode.java`, `src/main/resources/application*.yml`, `compose.yaml`.
- **T (트랜잭션·결제·상점·쿠폰·포인트)**: B01, B03, B05, B06, B07, B10. 소유: `payment/**`, `shop/**`, `coupon/**`, `point/**`. `schema.sql` 수정 금지.
- **P (글·스키마·캐시·신규 기능)**: B02, B04, B09, B15. 소유: `post/**`, `comment/**`, `admin/**`, `src/main/resources/schema.sql`, `src/main/resources/mapper/**`, 신규 패키지(`notification/**`, `attendance/**`). 포인트 적립은 `PointService`를 호출만 한다(수정은 T 소유).
- 공용 테스트 지원(`ApiTestSupport`, `TestcontainersConfig`, `PgContainers`, `RedisContainers`)은 수정하지 않는다. 꼭 필요하면 보고한다.
- 테스트 삭제·약화는 자기 소유 영역의 테스트만.
- 커밋은 반드시 경로를 지정한 `git commit -m "…" -- <경로들>`로 한다(다른 담당이 스테이징한 파일이 섞이지 않게). `git add -A`, `git commit -a`, stash, rebase, reset 금지.
- **Gradle은 `messy-server/`에서 직접 돌리지 않는다**(같은 build 디렉터리를 세 담당이 공유하면 깨진다). 자기 복사본에서 돌린다: `rsync -a --delete --exclude build --exclude .gradle --exclude tickets messy-server/ <내 작업 디렉터리>/` 후 그 안에서 `./gradlew test`. 티켓 검증은 `TICKET_WORK_DIR=<내 작업 디렉터리>/tickets tools/tickets/verify.sh Bnn`.

## 결함 하나를 만드는 절차

1. 정답 동작을 고정하는 확인 테스트 `tickets/Bnn/answer/BnnConfirmTest.java`를 먼저 쓴다(지금 messy-server = 정답 상태라 통과해야 한다 — 복사본에서 확인).
2. 결함을 심는다. 결함을 드러내는 기존 테스트는 지우거나 약하게 바꾼다. 복사본에서 messy-server 전체 테스트가 통과하는지 확인한다(환경 한정 `PgClientRetryTest` 연결 실패 2건 제외).
3. 결함 상태에서 확인 테스트가 **실패**하는지 확인한다.
4. 정답 수정 `tickets/Bnn/answer/fix.patch`를 만든다(결함 직전 상태로 되돌리는 것이 아니라 학습자가 할 법한 올바른 수정. 정답 서버 코드와 같아도 된다). `tools/tickets/verify.sh --full Bnn`이 OK인지 확인한다.
5. 재현 스크립트 `tickets/Bnn/repro.sh`(학습자용, 실행 전제·기대 증상을 주석으로)와 티켓 페이지 `course/tickets/Bnn.md`를 쓴다.
6. 커밋.

## 티켓 페이지 형식 (`course/tickets/Bnn.md`)

```markdown
# Bnn. <증상 한 줄>

> 같은 날: DNN ⓝ · 필수/선택 · 진단 도구: …

## 받은 티켓
운영자·CS가 쓴 듯한 2~4줄. 증상만. (일부 티켓은 오진 단서 포함)

## 환경과 재현
messy-server 실행 방법, `messy-server/tickets/Bnn/repro.sh` 실행법, 기대 증상

## 제출물
- 원인 서술(무엇이 왜) · 재현 테스트(실패 → 수정 후 통과) · 수정 diff

## 힌트
<details> 진단 도구 사용법 단계별 </details>

## 원인과 정답
<details> 원인 해설, 정답 수정 요지, 확인 테스트 이름, 1단계 정답 서버에서 같은 문제를 어떻게 피했는지(board-server 경로) </details>
```

## 검증 (컨트롤러)

- messy-server 전체 테스트 통과(환경 한정 2건 제외).
- `tools/tickets/verify.sh --full` 16개 모두 OK.
- 금지 단어 0건, 사이트 빌드·audit 통과.
