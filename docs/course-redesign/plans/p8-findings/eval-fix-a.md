# 평가 지적 반영 1차: P06·P07·P08·P09·P10

확인일: 2026-10-24. 브랜치 `course/p1-spec-roadmap`, 시작·종료 HEAD `b59b918c72d5da4496681b264de6a270ec0a26ec`. 시작 작업 트리는 깨끗했다.

평가 원문 $USER_HOME$REVIEW_WORK_DIR/reviews/scenario-eval.md (기록 경로: `$USER_HOME$REVIEW_WORK_DIR/reviews/scenario-eval.md:227`)의 검사·누출·D15·경계·화면 각주(227~231행)를 읽고 현재 소스를 직접 대조했다. 평가 대상 HEAD와 이번 시작 HEAD가 같다.

| 지적 | 상태 | 확인 범위와 남은 일 |
|---|---|---|
| P06 | 수정·fixture 검사 통과, 서버 통합 테스트 미실행 | 실제 PUT/DELETE 혼합 및 관계·집계 일치 단언. 결과 분류는 실제 Bash 3.2로 검사. 서버 실행은 환경 제한으로 시작하지 못함 |
| P07 | 수정·회귀 검사 통과 | J00~J15 16개 원문과 생성 HTML의 연결부 확인. J11~J14 연결부 접기, J12~J14 도입 설명 정리 |
| P08 | 수정·회귀 검사 통과 | 오진·결함이 없을 때 배제·예방 근거를 인정. 수료 기준 추가 없음 |
| P09 | 수정·회귀 검사 통과 | flush/commit/rollback·별도 연결 관찰, JVM 락과 DB 락의 범위 구분 |
| P10 | 수정·DOM/CSS 회귀 검사 통과 | 수동 진도 안내, 899px 이하 선 범례 숨김. 실제 브라우저 시각 검증 미실행 |

## P06: 검사 과장

### 좋아요·취소 혼합 테스트

- 수정 파일: [$WORKTREE_ROOT/p1-spec-roadmap/board-server/src/test/java/com/example/board/post/PostLikeApiTest.java](../../../../board-server/src/test/java/com/example/board/post/PostLikeApiTest.java).
- 수정 전에는 같은 회원에 대한 worker 두 개가 모두 DELETE였다. 현재는 회원 10명 각각 PUT 하나와 DELETE 하나, 합계 20개를 같은 시작 latch로 실행한다. 초기 좋아요 등록도 204인지 확인한다.
- 모든 응답이 204인지, 회원별 관계 행이 0~1건인지, 전체 관계 행이 0~10건인지, `post.like_count`가 실제 관계 행 수와 같은지 단언한다. 마지막 요청의 순서는 보장되지 않으므로 최종 합계를 0으로 고정하지 않는다.
- `git log --format='%h %s' -- board-server/src/test/java/com/example/board/post/PostLikeApiTest.java` 결과는 **`907734b9 answer(D05-6): 좋아요 등록·취소 API (멱등)`** 한 건이다. `git show`로 그 커밋에 DELETE 두 작업이 들어 있음을 확인했다. 컨트롤러의 커밋 접두어는 **`answer-fix(D05-6)`**다.
- 통합 테스트는 **미실행**이다. 기존 테스트 문제는 정적으로 확인했으며 이 Java 테스트의 RED/GREEN 실행을 주장하지 않는다.
- 생성기는 Git의 `answer`/`answer-fix` 이력을 읽는다. 따라서 현재 D05 생성물의 기존 구현 예시에는 미커밋 테스트 변경이 포함되지 않는다. 컨트롤러가 위 접두어로 커밋한 뒤 `cd tools/site && npm run build`로 재생성해야 한다. 생성물을 직접 수정하지 않았다.

### 티켓 검증기

- 수정 파일: [$WORKTREE_ROOT/p1-spec-roadmap/tools/tickets/verify.sh](../../../../tools/tickets/verify.sh).
- 추가 검사: [$WORKTREE_ROOT/p1-spec-roadmap/tools/tickets/verify.test.mjs](../../../../tools/tickets/verify.test.mjs).
- 허용 목록의 테스트 이름과 JUnit XML의 실패 메시지·예외 종류·`Caused by:` 원인 체인을 함께 확인한다. 연결 실패·타임아웃 근거가 있어야 환경 예외다. 메서드 이름과 일반 stack frame은 원인 근거로 사용하지 않는다.
- 정상 통과 수, 환경 예외 수, 실제 실패 수, 건너뜀 수를 별도로 출력한다. 환경 예외의 테스트 이름과 실패 원인도 출력한다. 환경 예외가 있으면 최종 결과는 `통과(환경 예외 N건: …)`이며 `전체 통과`라고 출력하지 않는다. 실제 실패가 하나라도 있으면 종료 코드 1이다. 테스트 0건·건너뛴 테스트도 전체 통과로 처리하지 않는다.
- 회귀 fixture: 정상 통과, 알려진 이름의 일반 단언 실패, 연결 거부, 원인 체인의 타임아웃, 실제 관찰값 TIMEOUT, 허용 목록 밖 연결 실패, 기대값만 TIMEOUT인 실패, 컨텍스트 오류, 복합 단언 실패, stack frame에만 있는 연결 실패 이름, 환경 예외와 실제 실패의 혼합, 테스트 0건을 확인한다.
- RED는 6개 중 5개 실패·1개 통과, GREEN은 6/6 통과다. fixture가 실행한 셸은 `/bin/bash` 3.2.57이다. `mapfile`·연관 배열을 추가하지 않았고 `bash -n`도 통과했다.
- 실제 티켓 복사본을 만드는 `--full`/`--all-fixes` Gradle 실행은 미실행이다. fixture는 기존 스크립트의 XML 요약·판정 함수를 읽어 실행하고, 테스트 실행 부분만 저장된 XML로 대체한다.

## P07: Java 학습에서 티켓 해법 미리 노출

수정 파일:

- [$WORKTREE_ROOT/p1-spec-roadmap/course/java/J11.md](../../../../course/java/J11.md)
- [$WORKTREE_ROOT/p1-spec-roadmap/course/java/J12.md](../../../../course/java/J12.md)
- [$WORKTREE_ROOT/p1-spec-roadmap/course/java/J13.md](../../../../course/java/J13.md)
- [$WORKTREE_ROOT/p1-spec-roadmap/course/java/J14.md](../../../../course/java/J14.md)
- [$WORKTREE_ROOT/p1-spec-roadmap/tools/site/test-course-pages.mjs](../../../../tools/site/test-course-pages.mjs)

J00~J15 원문의 `B01~B16`·`E01`, `D11~D14`, `messy-server`, 구현 예시 경로와 각 페이지의 상황·Spring 연결부를 확인했다. J12의 `start → PG → apply`·트랜잭션 밖 재시도뿐 아니라 도입부에서 PG 호출과 트랜잭션을 원인으로 지목하는 문장도 제거했다. J11의 응답 필드·구조 변경, J13의 실제 정책 구현, J14의 캐시 조회 분기 비교도 티켓 완료 뒤 읽도록 연결부 전체를 닫힌 `티켓을 마친 뒤 읽기` 접기로 옮겼다. J13·J14 도입부는 일반 Java 연습의 상황으로 바꿨다.

J00~J10·J15의 일반 Java 학습 예제와 1단계 구현 연결은 유지했다. 예를 들어 J09의 시간 API와 J10의 프록시 원리 자체는 학습 내용이며, 티켓의 진단 결과를 설명하는 연결부와 구별했다. J09의 D13 연결은 증상과 고정 시계 재현 안내이며 직접적인 원인·수정 설명은 없었다.

기존 `causeTerms`·`ticketFixPhrases`를 Java 생성 HTML에도 적용한다. 모든 Java 페이지의 Spring 연결부와 티켓 번호·2단계 일자 순서를 직접 지목하는 본문, 접기 제목, 접근성 속성을 검사한다. 일반 Java 예제의 프록시·DTO·재시도라는 단어 자체를 전역 금지하지 않는다. 원문과 화면에서 접기가 닫혀 있음을 확인했으며 J12·J13 누출 RED → 수정 후 GREEN을 확인했다.

## P08: 실수의 존재를 전제한 D15 회고

- [$WORKTREE_ROOT/p1-spec-roadmap/course/talk-cards.md](../../../../course/talk-cards.md): TC-D15-2는 오진이 없었다면 다른 가설의 배제 근거, TC-D15-3은 같은 결함이 없었다면 해당 코드·티켓 대조와 배제·예방 근거로 세 줄을 충족할 수 있다.
- [$WORKTREE_ROOT/p1-spec-roadmap/course/hints.json](../../../../course/hints.json): `graderTemplates.wrap`에 동일한 대안과 판정 규칙을 명시했다. 실수가 있었다는 사실을 요구하지 않으며, 근거 없이 “없었다”는 주장만으로는 통과시키지 않는다.
- [$WORKTREE_ROOT/p1-spec-roadmap/course/roadmap.json](../../../../course/roadmap.json): D15 설명 세션과 회고 완료 조건에 같은 대안을 반영했다. 수료 기준은 신설하지 않았다.
- [$WORKTREE_ROOT/p1-spec-roadmap/tools/course/build-days.test.mjs](../../../../tools/course/build-days.test.mjs): 카드·채점 템플릿·roadmap·생성 D15에 대안이 이어지는지 검사한다. 수정 전 실패, 수정 후 통과했다.

## P09: 기술 설명의 경계

- [$WORKTREE_ROOT/p1-spec-roadmap/course/roadmap.json](../../../../course/roadmap.json): D05의 `커밋(flush)`을 제거했다. flush는 UPDATE SQL 발행, commit은 확정이며 flush 뒤에도 rollback할 수 있음을 구분했다.
- [$WORKTREE_ROOT/p1-spec-roadmap/course/talk-cards.md](../../../../course/talk-cards.md): TC-D05-1에 명시적 flush·commit 전 flush·AUTO의 관련 JPQL 전 flush, rollback 가능성, 별도 연결의 새 조회와 기존 REPEATABLE READ 스냅샷의 차이를 적었다. 카드의 세 줄 구조는 유지했다.
- [$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/S09-jpa-hibernate.md](../../../knowledge/S09-jpa-hibernate.md): 관리 상태 표와 제약조건 오류·낙관적 락 충돌 설명의 `flush/commit` 축약을 SQL 실행 시점인 flush로 명확히 했다.
- [$WORKTREE_ROOT/p1-spec-roadmap/docs/knowledge/W05-jpa-vs-mybatis-strategy.md](../../../knowledge/W05-jpa-vs-mybatis-strategy.md): 그림의 SQL 동기화와 commit 확정을 분리하고 AUTO flush 문구를 `commit 전`으로 명확히 했다.
- [$WORKTREE_ROOT/p1-spec-roadmap/docs/course-redesign/research/05-competency-bar-3to6yrs.md](../../research/05-competency-bar-3to6yrs.md): JVM 안의 `synchronized`는 같은 모니터를 공유하는 스레드, DB 락은 같은 DB를 쓰는 모든 인스턴스의 충돌하는 작업 사이에 유효함을 구분했다.
- [$WORKTREE_ROOT/p1-spec-roadmap/tools/course/build-days.test.mjs](../../../../tools/course/build-days.test.mjs): D05 생성문·카드·기준선의 경계 설명 회귀 검사를 추가했다. 수정 전 실패, 수정 후 통과했다.

`course/**`와 `docs/knowledge/**`의 Markdown·JSON에서 `커밋(flush)`, flush/commit 인접 표현, DB 락·JVM 락·인스턴스 범위 표현을 `rg`로 검색하고 해당 문맥을 확인했다. `course/hints.json`의 D05에는 같은 혼동 문장이 없었다. 과정에 JVM 락과 DB 락의 범위를 뒤바꾼 추가 문장은 발견하지 못했다. 올바르게 차이를 설명하거나 오해 사례로 인용한 문장은 유지했다. 서버 실행이나 새로운 외부 리서치 결과를 기술 근거로 주장하지 않는다.

## P10: 수동 진도 안내와 모바일 범례

- [$WORKTREE_ROOT/p1-spec-roadmap/tools/site/course-pages.mjs](../../../../tools/site/course-pages.mjs): 홈의 `체크한 순서` 바로 아래에 `직접 체크한 진도이며 채점 결과는 아니다`를 추가했다. Java·선택 티켓과 역량은 별도 확인 대상임도 명시했다. 일자 페이지의 “이 브라우저에 체크 저장, 홈이 이 체크로 다음 날 선택” 안내와 같은 의미다.
- [$WORKTREE_ROOT/p1-spec-roadmap/tools/site/course-pages.mjs](../../../../tools/site/course-pages.mjs), [$WORKTREE_ROOT/p1-spec-roadmap/tools/site/course.css](../../../../tools/site/course.css): 선 범례에 `.cm-line-legend`를 붙이고 기존 지도 전환점과 같은 `max-width: 899px`에서 숨긴다. 노드 범례·관계 표와 노드 선택 기능은 유지한다.
- [$WORKTREE_ROOT/p1-spec-roadmap/tools/site/course-map.js](../../../../tools/site/course-map.js): 기존 `min-width: 900px` 연결선 생성 조건을 직접 확인했으며 변경할 필요가 없었다.
- [$WORKTREE_ROOT/p1-spec-roadmap/docs/course-redesign/plans/p7-findings/R4.md](../p7-findings/R4.md)의 R4-08과 대조했다. 과거 평가 문서는 당시 상태를 기록하므로 수정하지 않았다.
- [$WORKTREE_ROOT/p1-spec-roadmap/tools/site/test-course-pages.mjs](../../../../tools/site/test-course-pages.mjs): 홈 안내·선 범례 3종·모바일 CSS·선이 없는 DOM·남은 노드 범례와 관계 표를 검사한다. 두 검사 모두 RED → GREEN을 확인했다.
- **미실행**: 실제 브라우저 390px·넓은 화면의 렌더링·픽셀·겹침 검사. JSDOM과 CSS 규칙 검사를 실제 시각 검증으로 표시하지 않았다.

## 생성물과 전체 검사

모든 HTML과 `course/spring/*.md`는 소스를 수정한 뒤 `cd tools/site && npm run build`로 생성했다. 생성물을 손으로 수정하지 않았다. `board-server/src/main`의 diff는 없다.

| 실행 명령 | 최종 결과 |
|---|---|
| `cd tools/site && npm run build` | 통과, HTML 395개·링크 오류 0 |
| `cd tools/site && npm run test:course` | 통과, 35/35 |
| `cd tools/site && npm run validate:course` | 통과, 30 endpoints·15 days·68 cards·17 day pages |
| `cd tools/site && npm run test:course-pages` | 통과, 명명 검사 7/7 및 기존 흐름·DOM·Java 누출 검사 |
| `cd tools/site && npm run audit:visual` | 통과, failures 없음 |
| `cd tools/site && npm run audit:version-cards` | 통과, S09 카드 4개 |
| `cd tools/site && npm run audit:parity` | 통과, 기록 446개·verified 0개 |
| `cd tools/site && npm run test:navigation` | 통과, 공통 메뉴 생성물 339쪽 + index.html |
| `node --test tools/course/build-days.test.mjs` | 통과, 39/39 |
| `bash -n tools/tickets/verify.sh` | 통과, 실제 `/bin/bash` 3.2.57 |
| `node --test tools/tickets/verify.test.mjs` | 통과, 6/6 |
| `node tools/site/inventory-visual-work.mjs` | 통과, 359 source pages·47,372 units |
| `git diff --check` | 통과 |

시각 inventory도 생성기로 갱신했다. [$WORKTREE_ROOT/p1-spec-roadmap/docs/design/visual-inventory.jsonl](../../../design/visual-inventory.jsonl), [$WORKTREE_ROOT/p1-spec-roadmap/docs/design/visual-inventory-summary.json](../../../design/visual-inventory-summary.json), [$WORKTREE_ROOT/p1-spec-roadmap/docs/design/VISUAL-PAGES.md](../../../design/VISUAL-PAGES.md)에 반영됐다. 상태 집계는 unreviewed 47,313, implemented 53, verified 6이며 기존 implemented·verified 개수는 늘리지 않았다. 새 시각 검증 완료를 주장하지 않는다. inventory 갱신 후 세 audit을 다시 실행해 통과했다.

### 실행 환경과 재현

기본 `npm` 실행에서는 `/usr/local/bin`의 x64 Node 25.9.0이 선택되어 설치된 arm64 esbuild와 맞지 않았다. 의존성이나 lockfile을 바꾸지 않고 실행 PATH에 `/opt/homebrew/bin`을 앞세워 arm64 Node 26.0.0으로 빌드·검사를 통과시켰다.

일자 생성기는 `git apply --cached`와 `write-tree`로 임시 정답 트리를 계산한다. 공유 Git object 경로가 읽기 전용인 현재 샌드박스에서는 이 계산이 실패하므로 아래 환경으로 임시 object 저장소만 사용했다. 저장소의 index·HEAD는 변경하지 않았다.

```bash
mkdir -p /tmp/eval-fix-a-objects
export PATH="/opt/homebrew/bin:$PATH"
export GIT_OBJECT_DIRECTORY=/tmp/eval-fix-a-objects
export GIT_ALTERNATE_OBJECT_DIRECTORIES=$REPO_ROOT/.git/objects
cd $WORKTREE_ROOT/p1-spec-roadmap/tools/site
npm run build
npm run test:course
npm run validate:course
npm run test:course-pages
npm run audit:visual
npm run audit:version-cards
npm run audit:parity
npm run test:navigation
cd $WORKTREE_ROOT/p1-spec-roadmap
node --test tools/course/build-days.test.mjs
/bin/bash -n tools/tickets/verify.sh
node --test tools/tickets/verify.test.mjs
```

### 미실행 서버 테스트와 로그

1. `board-server`에서 JDK 21, `GRADLE_USER_HOME=/tmp/eval-fix-a-gradle`로 `./gradlew --offline --console=plain test --tests 'com.example.board.post.PostLikeApiTest'`를 시도했다. wrapper 배포본 다운로드가 `UnknownHostException: services.gradle.org`로 실패했다. `--offline`은 wrapper 자체의 배포본 다운로드를 막지 못했다.
2. 이미 설치된 `$USER_HOME/.gradle/wrapper/dists/gradle-9.8.0-bin/3m7h6ceboy5k31n8kzwzuxssm/gradle-9.8.0/bin/gradle`로 `--offline --no-daemon` 재시도했다. `FileLockContentionHandler` 생성 중 `java.net.SocketException: Operation not permitted`로 빌드 시작 전에 실패했다.
3. **JUnit·Testcontainers·Docker 동시성 테스트는 미실행**이다. Java 컴파일 성공도 확인하지 못했다. Docker 테스트 통과나 환경 예외 인정으로 세지 않는다.
4. 실제 AI 채점 세션도 미실행이다. P08은 질문·템플릿·생성문 검사 결과다.

로그는 임시 파일이며 장기 보관본은 아니다.

- RED: `/tmp/eval-fix-a-verify-red.log`, `/tmp/eval-fix-a-days-red.log`, `/tmp/eval-fix-a-pages-red.log`
- 최종: `/tmp/eval-fix-a-build.log`, `/tmp/eval-fix-a-test-course.log`, `/tmp/eval-fix-a-validate-course.log`, `/tmp/eval-fix-a-test-course-pages.log`, `/tmp/eval-fix-a-audit-visual.log`, `/tmp/eval-fix-a-audit-version-cards.log`, `/tmp/eval-fix-a-audit-parity.log`, `/tmp/eval-fix-a-test-navigation.log`, `/tmp/eval-fix-a-build-days-test.log`, `/tmp/eval-fix-a-verify-test.log`, `/tmp/eval-fix-a-inventory.log`
- 서버 실행 제한: `/tmp/eval-fix-a-board-test.log`, `/tmp/eval-fix-a-board-local-gradle.log`

현재 저장소에서 git add·commit·stash·reset·checkout·push를 수행하지 않았다. 컨트롤러가 변경을 검토하고 커밋한다. P06은 `answer-fix(D05-6)`로 커밋 후 재빌드와 Docker 통합 테스트 확인이 남아 있다.
