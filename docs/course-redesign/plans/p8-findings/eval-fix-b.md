# 평가 지적 반영 2차: 부분 해소 개념 보강

확인일: 2026-10-24. 시작 HEAD: `5516568e` · 브랜치: `course/p1-spec-roadmap`.

## 구현 계획과 완료 조건

- [x] D02/D04/D05/D07/D09의 기존 힌트·겪을 것에 선택 관찰 과제를 넣는다. 후보 수·객체 참조·SQL·DB 행을 구분하고 각 과제에 입력·순서·기대값·제출 증거를 둔다. 필수 순서와 채점 항목은 늘리지 않는다.
- [x] J09에 `DecimalAmount`의 정답·뼈대·선택 테스트를 같은 시그니처로 추가한다. 문자열 입력, scale 2 HALF_UP, 반올림 후 DECIMAL(5,2) 범위, 반올림 없는 입력 거절을 검사한다. 기존 Clock/시간대 과제와 DB 왕복 관찰을 연결한다.
- [x] 홈 진도 문구의 합니다체를 테스트에 먼저 반영하고 실패를 확인한 뒤 렌더러를 수정한다.
- [x] `tools/site`의 build로 일자 Markdown과 HTML을 생성하고 요청한 Java·과정·화면·audit 검사를 실행한다. 실행 실패와 미실행을 성공과 구별한다.
- [x] 원 지적별 배치 이유·실제 변경·검증 결과·미검증을 이 파일에 기록한다. 서버 main 코드와 Git index는 수정하지 않는다.

## 원 근거

평가 원문 `/Users/ds/.cache/jx-p8/reviews/scenario-eval.md` 4절, 보관본 `docs/reviews/codex-audits-2026-10-23/learning-gap-20261021/COVERAGE.md` 및 `IMPLEMENTATION-ROADMAP.md` 1·4·5절을 우선 대조했다. 개별 C02/C03/C04/C09/C11/C14/C16/C17/C18/C20/C27 및 I12의 보완 과제도 대조했다. 과거 실행 로그는 이번 실행 결과로 승계하지 않는다.

## 항목별 반영 위치와 이유

공통 입력 소스는 `course/roadmap.json`의 겪을 것과 `course/hints.json`의 해당 순서 힌트다. 선택 과제의 상세 순서·기대값은 hints.json의 observations에 두고 별도 선택 접기로 표시하며 겪을 것에는 관찰 주제와 선택 여부만 알린다. 아래 시간은 선택 실험의 계획용 예산이며 실측 소요 시간이 아니다. 하루에는 하나만 골라도 되고 필수 `done`·순서 수·말하기 카드 목록은 그대로다.

| 원 지적 | 배치 | 실제 관찰과 판정 근거 | 주제 흐름상 이유 |
|---|---|---|---|
| C02 후보 빈 0/2개 | D02 ④ 선택 A | 독립 테스트 컨텍스트에서 0/1/2 후보 → refresh 실패 cause·후보 이름·실제 호출 결과 표. Primary/Qualifier 변형 비교 | 빈/static을 처음 나누는 자리에서 필수 주입점의 실패를 확인 |
| C04 prototype/request | D02 ④ 선택 B | 직접 주입/Provider 대상 ID, 요청 내 2호출/요청 2회, 요청 종료 콜백, 요청 없는 호출 실패 | singleton 필드의 공유 상태와 scope 수명을 구분 |
| C03 초기화·종료, C04 정리 책임 | D02 ⑤ 선택 C | 생성자→의존성 설정→PostConstruct→afterPropertiesSet→init, 정상 close의 PreDestroy→destroy→shutdown. prototype은 초기화 2회·자동 종료 없음 | ReadyEvent와 빈 초기화 시점의 차이를 배우는 순서에 연결 |
| C20 save 신규 판단·merge | D04 ① 선택 | 생성 ID/null, 할당 ID, nullable version, Persistable의 분기. detached 입력/관리 반환의 참조·contains·SQL·최종 행 비교 | 처음 Repository.save를 쓰는 날. ID만 보고 DB 행 존재를 단정하지 않게 함 |
| I12 공유 모델, C17·C18 수명 | D04 ② → D05 ② 선택 공유 수명 | 두 글/tag 1/연결 2 → 한 글 연결 해제 시 tag 1/연결 1, 다른 글 생존. soft delete 별도 비교, 후행 예외 rollback 후 글·태그·연결 원복 | D04는 모델과 재사용, D05는 수정·삭제를 만든 뒤 수명 관찰. 아직 없는 수정 API를 D04에 요구하지 않음 |
| C09 EM 프록시/실제 컨텍스트 | D05 ① 선택 A | 같은 주입 참조로 순차 두 tx. tx 내부 target EM 참조·관리 객체·contains 기록, 같은 tx/다른 tx 비교 | 상세 조회의 관리 객체를 처음 관찰하는 날. 순수 Java 트랙에 Spring 의존성을 추가하지 않음 |
| C14 readOnly | D05 ① 선택 B | Transactional import, 관리 변경·신규 persist/IDENTITY·JDBC 쓰기·바깥 REQUIRED 참여를 별도 fixture에서 비교. tx 플래그·flush mode·connection.isReadOnly·SQL·예외·같은 연결/종료 후 값 | 조회와 수정의 경계를 만드는 자리. 최적화 힌트와 DB 쓰기 거절/권한을 분리 |
| C11 flush/commit 잔여 | D05 ② 선택 | old→local Java 변경→flush. A JDBC/B 새 일반 SELECT 비교 후 commit/rollback 분기. Java 객체와 별도 연결의 확정값 분리 | 기존 변경 감지 과제를 짧은 값 비교로 확장. SQL 발행=확정이라는 혼동 방지 |
| C16 1차 캐시/DB snapshot/격리 | D07 ① 선택 A | 두 물리 연결, B commit 순서 고정. A find 재호출/clear 후 find/같은 tx JDBC/새 tx를 RC·RR 각각 비교. nonlocking consistent read 조건 명시 | 동시성 도입일에 D05 관찰을 확장. cache hit를 격리 증거로 오인하지 않게 함 |
| I12 서로 다른 회원의 새 태그 경합 | D07 ① 선택 B | 두 worker가 같은 이름 없음 확인 후 INSERT. UNIQUE 충돌·제약명·모든 Future·commit/rollback 회수. 기준 재현(tag 1·한 tx 실패)과 복구 목표(tag 1·연결 2)를 분리 | 동시성 도구를 익힌 날 D04 공유 엔티티를 다시 사용. 회원별 락과 공유 이름 경계를 비교 |
| C27 BigDecimal·반올림·범위 | J09 선택 DecimalAmount, D09 ① | 문자열 생성, scale 2 HALF_UP, 반올림 후 DECIMAL(5,2) 범위, UNNECESSARY, equals/compareTo, double 차이의 학습 테스트 5개 | D08의 금액 다음 날 기존 Clock/시간대와 저장 경계를 함께 관찰. J14 선택 금액 과제 뒤로 미뤄도 됨 |
| C27 실제 DB 정밀도·Clock·zone | D09 ① 선택 | 같은 연결 임시 DECIMAL(5,2)/DATETIME(6), set/getBigDecimal·LocalDateTime 왕복. 고정 Clock 나노초를 마이크로초로 명시 절삭, KST 약속으로 Instant 복원. DB 원본 입력 대조군의 sql_mode·warnings/예외 기록 | Java 테스트와 MySQL 저장 결과를 분리. 상점 정수 금액·운영 스키마 계약은 변경하지 않음 |

### J09 정답·뼈대·학습 테스트

- `java-track/src/main/java/com/example/javatrack/j09/DecimalAmount.java`: 기존 J 형식의 `UnsupportedOperationException("J09: …")` 뼈대.
- `java-track/src/answer/java/com/example/javatrack/j09/DecimalAmount.java`: 같은 시그니처의 정답. 반올림 뒤 범위 검사.
- `java-track/src/test/java/com/example/javatrack/j09/J09DecimalAmountTest.java`: `@Tag("optional")` 테스트 5개. 기본 `test`에는 빠지고 기존 `optionalTest`와 `check`의 전체 정답·뼈대 검사에 포함된다.
- `course/java/J09.md`: 선택 정책·입출력 표·실행 명령·DB 과제 연결. 정답 코드는 기존 정답 접기 안에 둔다. 기존 필수 19개는 유지.
- `java-track/build.gradle`: 선택 과제가 있는 J 목록 주석에 J09만 추가. 태스크/검증 방식 변경 없음.

### 말하기 카드와 누출 경계

`course/talk-cards.md`와 카드 ID 목록은 변경하지 않았다. 기존 TC-D02-1/2(초기화·공유 상태), TC-D05-1(flush/commit), TC-D07-3(새 tx)에 필요한 관찰 증거를 D 힌트와 J09에서 보충한다. 선택 실험을 새 필수 말하기 항목으로 올리지 않는다. D11~D15와 티켓 본문/정답은 수정하지 않았다. 신규 문구는 특정 2단계 티켓 번호나 원인·해법을 연결해 공개하지 않는다.

### 홈 문구

`tools/site/course-pages.mjs`의 문장을 “직접 체크한 진도이며 채점 결과가 아닙니다. Java·선택 티켓의 수행 여부와 역량은 따로 확인합니다.”로 바꿨다. `tools/site/test-course-pages.mjs`의 DOM 단언도 전체 문장에 맞췄다. 테스트 기대값을 먼저 바꾼 실행에서 P10 실패를 확인했다.

### 기존 힌트 검사 유지

일자 생성기 테스트에서 순서당 힌트 1~2개라는 계약을 확인했다. 기존 힌트 개수 제한을 완화하는 대신 `course/hints.json`에 `observations`를 분리하고 `tools/course/build-days.mjs`가 필수 힌트 다음 별도 닫힌 선택 접기를 만들도록 했다. 새 생성기 테스트는 렌더러 변경 전 접기 부재로 실패함을 확인했고, 원문·항목 순서·총 12개 선택 실험을 검사한다. 화면 DOM 검사도 닫힘·실험 개수·선택 안내를 확인한다.

## 검사 결과와 실행 한계

### Java

요청한 JDK 21의 `JAVA_HOME=/Users/ds/Library/Java/JavaVirtualMachines/corretto-21.0.6/Contents/Home`으로 루트 `./gradlew :java-track:check`를 시도했다.

- 기본 경로: Gradle wrapper의 `/Users/ds/.gradle/wrapper/dists/gradle-9.8.0-bin/3m7h6ceboy5k31n8kzwzuxssm/gradle-9.8.0-bin.zip.lck` 생성이 샌드박스에서 `Operation not permitted`로 실패.
- 쓰기 가능한 `GRADLE_USER_HOME=/tmp/jx-eval-b-gradle-home`으로 다시 실행: `https://services.gradle.org/distributions/gradle-9.8.0-bin.zip` 다운로드가 `UnknownHostException: services.gradle.org`로 실패.
- **Gradle check는 미실행**이다. `answerTest`·`skeletonTest`·`verifySkeleton` 전체 통과를 주장하지 않는다.
- 보조 검증: 이미 캐시된 JUnit 5.14.4·JUnit Platform 1.14.4·AssertJ 3.27.7을 읽어 같은 JDK 21의 javac/Java Launcher로 J09 테스트를 직접 실행했다. 신규 5개는 정답 작성 전 뼈대에서 5개 모두 의도한 `J09:` 미구현 예외로 실패, 정답 구현 후 5/5 통과. J09 전체는 정답 24/24 통과, 뼈대 24/24 실패를 확인했다. 이는 Gradle 소스 세트/태스크 연결의 전체 검증을 대체하지 않는다.

실행 로그: `/tmp/jx-eval-b-gradle.log`, `/tmp/jx-eval-b-gradle-network.log`, `/tmp/jx-eval-b-java-red.log`, `/tmp/jx-eval-b-java-green.log`, `/tmp/jx-eval-b-j09-answer.log`, `/tmp/jx-eval-b-j09-skeleton.log`. 보조 실행 스크립트는 `/tmp/jx-eval-b-java.py`, `/tmp/jx-eval-b-java-j09.py`다.

### 사이트 검사 환경

- 일자 생성기는 임시 index에서 패치를 검사하면서 Git object를 쓴다. 기본 objects 경로의 쓰기 제한이 적용 시점 오류처럼 보고되는 것을 실제 `git apply` stderr로 확인했다. 실제 저장소 index는 건드리지 않고 `GIT_OBJECT_DIRECTORY=/tmp/jx-eval-b-git-objects`, `GIT_ALTERNATE_OBJECT_DIRECTORIES=/Users/ds/code/javaExperience/.git/objects`로 임시 객체만 분리해 실행했다. 검사를 생략하거나 보완 적용 규칙을 바꾸지 않았다.
- 기본 npm 실행의 x64 Node와 설치된 arm64 esbuild가 불일치했다. 패키지를 재설치하지 않고 `PATH=/opt/homebrew/bin:$PATH`로 설치된 arm64 Node 26.0.0을 선택했다.
- 첫 링크 검사에서 D09의 raw HTML section ID를 Markdown 앵커로 인정하지 않아 새 J09 링크가 실패했다. D09 페이지 링크와 '① 힌트' 문구로 안내해 해결했다.
- 순서당 힌트 1~2개 검사 실패는 observations 분리로 해결했다. 제한을 완화하지 않았다. 관련 새 테스트의 실패→통과도 확인했다.

### 못 한 것과 판정 범위

- 새 Spring/HTTP/MySQL 관찰 과제는 학습자가 작성할 선택 실험 절차다. 이번에 실제 DB·Testcontainers·HTTP 경합을 실행한 결과가 아니다. UNIQUE 충돌 복구, readOnly의 환경별 동작, 격리 수준, 실제 DECIMAL/DATETIME 왕복을 정상 동작으로 확정하지 않는다.
- 과거 C17·C18 전체(모든 new/detached orphan 제거 등)를 완결했다고 주장하지 않는다. 이번 대상인 공유 태그 수명·연결 소유권·후행 실패 원복을 보강했다.
- 관찰 예산/하루 분량은 실측하지 않았다. 실험 중 하나 선택 또는 후속 학습으로 미루는 경로를 제공했다.
- 브라우저에서 모바일 배치·접기 조작을 직접 확인하지 않았다. DOM/구조 검사 통과와 실제 시각 검증을 구별한다. inventory의 새 항목은 unreviewed로 남기고 parity 상태를 올리지 않는다.
- `board-server/` 변경 없음, 실제 Git index 변경 없음. 사용자 저장소에서 add/commit/stash/reset/checkout을 수행하지 않았다. 요청한 생성기 테스트가 만드는 임시 테스트 저장소는 실제 작업 저장소와 별개다.

### 최종 검사 결과

아래는 observations 분리와 DOM 검사를 반영한 최종 소스에서 실행한 결과다. 전체 사이트 실행 로그는 `/tmp/jx-eval-b-site-final.log`에 있다.

| 요청 검사 | 결과 |
|---|---|
| `./gradlew :java-track:check` | 미실행: wrapper lock 쓰기 제한, 임시 캐시 재시도는 배포 파일 DNS/네트워크 실패. 보조 J09 직접 실행은 정답 24/24 통과 |
| `cd tools/site && npm run build` | 통과: HTML 395개, 링크 오류 0. 일자 Markdown도 이 build에서 생성 |
| `npm run test:course` | 35/35 통과 |
| `npm run validate:course` | 30 endpoints · 15 days · 68 cards · 17 day pages 통과 |
| `npm run test:course-pages` | 7/7 및 내부 DOM·누출 검사 통과. 홈 새 문구와 선택 관찰 접기 검사 포함 |
| `npm run audit:visual` | failures 0. 구조 감사 결과이며 브라우저 시각 확인을 뜻하지 않음 |
| `npm run audit:version-cards` | S09 카드 4개 검사 통과 |
| `npm run audit:parity` | 446개 기록 검사 통과. verified 0개 유지 |
| `node --test tools/course/build-days.test.mjs` | 40/40 통과. 기존 힌트 1~2개 제한 유지, 선택 관찰 신규 테스트 포함 |
| `git diff --check` | 통과 |

`node tools/site/inventory-visual-work.mjs`로 장부도 갱신했다. 359화면·47,406항목이며 새 ID 45개는 모두 unreviewed다. 기존 상태를 임의 승격하지 않았다. 새 ID 수와 순증 항목 수는 수정 문구의 ID 교체 때문에 다르다. 기존 필수 순서·done·카드 ID 보존은 HEAD의 roadmap과 JSON 값으로 비교했다. 서버 변경 및 실제 index 변경 없음도 최종 확인했다.
