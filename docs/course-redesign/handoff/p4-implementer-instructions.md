# P4 구현자 공통 지시 (결함 B01~B16 심기)

## 먼저 읽을 것 (끝까지)
1. 계획서: `$WORKTREE_ROOT/p1-spec-roadmap/docs/course-redesign/plans/2026-10-23-p4-messy-server.md` — 구조, 담당·파일 소유, 결함 하나를 만드는 절차, 티켓 페이지 형식. **반드시 그대로 따른다.**
2. 설계 §5-3: `docs/course-redesign/research/14-redesign-design.md` (105~146행 근처) — 티켓 표(증상·심은 원인·진단 도구·근거). 근거 문서(06·07·08·10·13 등)는 `docs/course-redesign/research/`에 있다. 네 결함의 근거 절을 읽고 그 장애 모양을 충실히 재현하라.
3. `course/roadmap.json`의 days D11~D14 — 네 티켓이 배정된 날·단계 제목(티켓 페이지의 "같은 날").
4. messy-server 코드(지금은 answer-d10 정답 상태): `$WORKTREE_ROOT/p1-spec-roadmap/messy-server/`. 정답 서버의 원장 `docs/course-redesign/plans/2026-10-22-p2-ledger.md`(정답이 어떤 함정을 어떻게 피했는지 — 네가 심을 결함은 대개 그 반대다).
5. 검증 도구: `tools/tickets/verify.sh` (읽어 보고 쓰는 법을 익혀라).

## 작업 위치와 실행 (고정)
- 리포: `$WORKTREE_ROOT/p1-spec-roadmap` (브랜치 `course/p1-spec-roadmap`). 다른 worktree를 만들지 마라.
- **다른 담당 2명이 같은 리포에서 동시에 일한다.** 너의 소유 파일만 고친다(계획서 "담당과 파일 소유"). 다른 담당 파일을 고쳐야 하면 고치지 말고 보고에 적어라.
- **Gradle을 `messy-server/`에서 직접 돌리지 마라.** 네 전용 복사본에서 돌린다:
  `C=<네 작업 디렉터리>; rsync -a --delete --exclude build --exclude .gradle --exclude tickets messy-server/ $C/base/ && cd $C/base && JAVA_HOME=<JDK21> ./gradlew --console=plain test [--tests …]`
  (`<네 작업 디렉터리>`는 아래 담당별로 정해 준다. 리포 밖이다.)
- 티켓 검증: `cd $WORKTREE_ROOT/p1-spec-roadmap && TICKET_WORK_DIR=<네 작업 디렉터리>/tickets tools/tickets/verify.sh --full Bnn` (JDK 21은 `TICKET_JAVA_HOME` 또는 `JAVA_HOME`으로 지정한다. JUnit XML로 판정: 결함 상태는 **단언 실패**만 인정하고 컨텍스트·환경 error는 거부, 수정 후 전부 통과, `--full`은 환경 한정 2건만 허용. 실패하면 메시지의 결과 디렉터리를 열어 원인을 본다)
- 환경 한정 실패: `PgClientRetryTest`의 연결 실패 2건(`연결_실패는_재시도하고_복구되면_성공한다`, `연결_실패가_계속되면_백오프_후_3번째에_포기한다`)은 이 머신에서 항상 실패한다(로컬 Docker 포트 포워더). 그 2건 외에는 모두 통과해야 한다. (T 담당은 PgClientRetryTest를 건드리지 않는다.)
- 시간 단언 테스트(`PgTimeoutTest`, `ChargeTransactionBoundaryTest`, Redis 1초 예산 테스트)는 다른 담당의 테스트와 CPU를 나눠 쓰면 흔들릴 수 있다. 한 번 실패하면 다시 돌려 판단하고, 흔들림이면 보고에 적어라.

## 커밋
- 결함 하나 = 커밋 하나(E01도 같다): `git commit -m "messy(Bnn): <증상 한 줄>" -m "<본문: 심은 원인·지운/약화한 테스트·재현 방법>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- <이 결함에서 바꾼 경로들>`
  - **반드시 `-- <경로>`로 커밋할 경로를 지정한다**(다른 담당이 스테이징한 파일이 섞이지 않게). 새 파일은 먼저 `git add <그 파일들>`. `git add -A`/`.`, `git commit -a`, stash, rebase, reset, amend, push 금지.
  - `index.lock` 오류가 나면 몇 초 뒤 다시 시도한다.
- push는 컨트롤러가 한다.

## 계획서의 "codex 계획 리뷰 반영" 절이 결함별 재현 설계의 기준이다. 네 티켓 항목을 그대로 따른다.

## 품질 기준
- 결함은 **실무에서 정말 볼 법한 모양**으로: 그럴듯한 이름·주석, "성능 때문에"·"편해서" 같은 그럴듯한 이유. 코드에 "결함/버그/TODO 고칠 것" 표시를 남기지 마라(학습자가 읽는다).
- 확인 테스트는 **증상을 관찰 가능한 동작으로** 고정한다(응답 코드·본문·DB 값·시간 예산·커넥션 수·로그). 구현 세부(특정 클래스 이름)에 덜 의존하게 해서 학습자의 다른 올바른 수정도 통과하게 하라.
- 정답 수정(`fix.patch`)은 학습자가 할 법한 올바른 수정. `git diff` 형식, messy-server 루트 기준 경로(`a/src/...`). 만드는 법: 결함본 복사본 `$C/broken`과 수정본 `$C/fixed`(둘 다 build·.gradle 제외)를 만들고 `cd $C && git diff --no-index --src-prefix=a/ --dst-prefix=b/ broken fixed | sed 's#\([ab]\)/\(broken\|fixed\)/#\1/#g' > fix.patch`처럼 경로 접두어를 messy-server 루트 기준으로 맞춘다. 마지막에 반드시 `verify.sh`로 적용·통과를 확인하라.
- 재현 스크립트 `tickets/Bnn/repro.sh`: 맨 위 주석에 전제(compose up, bootRun 프로파일, 포트), 실행법, 기대 증상. 실제로 실행해 보기 어려우면(브라우저 필요 등) 그 이유와 수동 절차를 주석으로.
- 티켓 페이지 `course/tickets/Bnn.md`: 계획서 형식. "받은 티켓"은 증상만, 오진 단서 권장 티켓(B01·B03·B06·B16)은 그럴듯한 오진 단서 1개. "원인과 정답"은 `<details>` 안.
- 주석·문서 한국어. `Docker Desktop`, `studymate` 단어 금지.
- 너의 결함들이 끝나면 복사본에서 messy-server 전체 테스트를 한 번 더 돌려(2건 외 통과), 네 티켓 전부 `verify.sh --full`을 다시 돌린다(다른 담당의 커밋이 섞인 최신 상태로 rsync해서).

## 보고 (한국어)
- 커밋 목록(SHA·메시지)
- 티켓별: 심은 결함(파일:줄), 지우거나 약화한 테스트, 확인 테스트 메서드, fix.patch 요지, verify 결과(결함 실패/수정 통과/전체 통과)
- Ruling(결정 — 이유 — 틀리면 바뀌는 범위)
- 다른 담당 파일을 고쳐야 했던 것(고치지 않음)
- 걱정거리
