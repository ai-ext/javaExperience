# task5 · P19 독립 감사

판정: **needs_completion**. 원문 450줄을 대조한 문서 전체 감사이며, 기존 보강의 6질문·19상태가 문서 전체 완료를 뜻하지 않는다. 기준 HEAD `4b0493af52b1a06decca909d6bf9a8b6f9610686`. source SHA-256 `378a8c986a8fe4f70c9569f364fdda3258fcd9ac6057bea08e1420d44869f321`.

새 실행 `npm --prefix tools/site run test:p19`: UTC 2026-10-21T23:43:29.668750+00:00 → 2026-10-21T23:43:35.138325+00:00, **actual exit 0**. 원시 stdout/stderr와 HEAD·소스별 SHA는 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/concept-cycle-2026-10-22/tasks/task5/_data/`에 보존했다.

## 1. Spec 검토

주요 의미 단위 49개: partial 23, covered 6, missing 13, unrun 7. 행 수나 장면 수를 단순 완료율로 환산하지 않았다. 원문이 접기 안에 보존된 사실과 의미 장면이 완성된 사실을 구분했다.

원문 14609자·코드17개·앵커26개와 추출 Java4파일은 보존 검사에 일치했다. generated HTML과 실제 bundle의 19상태도 검사 통과했다.

| 원문 절/의미 | sourceLines | stageIds | 판정 | 남은 범위 |
|---|---:|---|---|---|
| 도입·DataSource/Hikari/Hibernate 역할 | 1–10 | boot-start, pool-idle | partial | 연결/저장 관찰은 있지만 JDBC URL→자동 구성→트랜잭션 수명 전체 설명은 부분적이다. |
| 2.1 BOM·JPA starter·runtimeOnly | 11–16 | dependency-starters, dependency-h2 | partial | BOM resolve와 H2 유무는 보인다. runtimeOnly와 전이 의존성의 역할은 별도 장면이 없다. |
| 2.1 build.gradle.kts 전체·Java25·테스트 의존성 | 17–46 | dependency-starters, dependency-testcontainers | partial | 의존성 일부를 추가 조회했다. plugins/toolchain25/전체 원문 build 실행은 하지 않았다. |
| 2.2 Compose MySQL8.4·초기 계정·volume·healthcheck | 48–75 | ports-host, ports-compose | partial | 포트만 설명한다. 초기화 변수·영속 volume·healthcheck 및 준비 판정은 장면이 없다. |
| 2.2 호스트와 Compose 주소 선택 | 77–77 | ports-host, ports-compose, ports-localhost | covered | 설정 설명 범위는 충족한다. 실제 MySQL 접속 관찰은 별도 미실행이다. |
| 2.3 공통 application.yml·default profile | 79–88 | 없음 | missing | 활성/default profile과 공통값 적용 순서 장면을 추가한다. |
| 2.3 OSIV/show-sql/validate/naming 설정 | 89–95 | boot-start, validate-missing, validate-ready | partial | validate/naming은 관찰했다. open-in-view/show-sql의 선택 의미는 가르치지 않는다. |
| 2.3 SQL format/highlight·JDBC UTC | 96–101 | 없음 | missing | 실행 시간대와 표시 옵션의 목적/적용 범위를 설명한다. |
| 2.3 Hikari10/30000/1700000·sql.init never | 102–110 | pool-idle, pool-timeout, validate-ready | partial | 추가풀1/250ms와 사전 DDL은 구분한다. maxLifetime·실서버 wait_timeout·초기화 정책 설명이 부족하다. |
| 2.3 SQL/bind 로깅 설정 | 112–116 | 없음 | missing | SQL/바인딩 로그의 차이·민감정보 경계를 기본 장면으로 연결한다. |
| 2.3 mysql profile·DB 환경변수/기본값 | 118–128 | 없음 | missing | DB_HOST/PORT/NAME/USERNAME/PASSWORD 적용과 비밀 분리를 보여 준다. |
| 2.3 TLS 로컬 예외·문자셋·시간대 | 130–130 | 없음 | missing | 로컬/운영 TLS 정책과 charset/timezone의 역할을 분리한다. |
| 2.3 H2 profile·MODE·create-drop | 132–145 | dependency-h2, boot-start | partial | H2 classpath와 MySQL 미실행 경계는 보인다. 원문 H2 create-drop 정책은 추가 validate 실험과 별도 장면이 없다. |
| 2.4 환경별 ddl-auto/Flyway 정책 | 147–154 | validate-missing, validate-ready | partial | validate 미생성은 충족한다. create-drop/update/none/Flyway 환경별 판단과 migration 역할은 빠졌다. |
| 2.5 show-sql과 SQL/bind logger | 155–164 | 없음 | missing | stdout/logger 레벨·appender·민감정보 사례를 추가한다. |
| 2.6 naming과 dialect 자동 감지 | 166–168 | boot-observer, boot-start | partial | displayName→display_name 관찰은 있다. dialect/JDBC metadata 설명과 OrderItem 예시는 없다. |
| 2.6 OSIV false와 서비스 트랜잭션 | 170–170 | 없음 | missing | OSIV false의 요청/트랜잭션 경계와 서비스 내 데이터 준비를 설명한다. |
| 3.1 프로젝트·Docker/DB 시작과 healthy 확인 | 172–185 | 없음 | unrun | 원문 MySQL Compose/CLI를 실행하지 않았다. 추가 H2 성공으로 대체 완료하지 않는다. |
| 3.2 원문 SpringApplication | 187–203 | boot-start | partial | 원문 부팅 진입점을 추가 non-web JDK21/H2 설정으로 썼다. 원문 MySQL 웹 부팅은 미실행이다. |
| 3.2 Customer IDENTITY·displayName 필드/생성자 | 205–226 | boot-create, boot-observer | covered | 추가 H2에서 id1/Kim과 명명 매핑을 확인한 범위다. MySQL 동일 동작 완료를 뜻하지 않는다. |
| 3.2 JpaRepository 선언 | 228–235 | boot-create, boot-list | partial | 호출 결과는 있으나 JpaRepository<Customer,Long> 선언의 역할/타입 설명은 원문에만 있다. |
| 3.2 validate/never·CLI 또는 migration 사전 스키마 | 238–240 | validate-missing, validate-ready | partial | 사전 DDL/validate 비생성은 충족하나 Flyway 의존성·migration 연결은 가르치지 않는다. |
| 3.2 Controller 입력 record→Entity→save/findAll | 242–270 | boot-create, boot-list, boot-observer | covered | 직접 Java 호출 의미는 충족한다. HTTP 직렬화/라우팅 실행은 아래 별도 unrun이다. |
| 3.2 MySQL CREATE TABLE·bootRun·Hikari 연결로그 | 272–285 | validate-ready | unrun | 원문 MySQL DDL/bootRun/시작 로그를 실행하지 않았다. |
| 3.2 HTTP POST/GET와 별도 MySQL 행 | 287–296 | boot-create, boot-list, boot-observer | unrun | Java 직접호출·직접 Jackson·H2 별도 JDBC는 추가 관찰이다. HTTP 응답/MySQL 행 관찰은 아니다. |
| 3.3 Actuator 의존성/health/details/DB component | 298–317 | 없음 | unrun | Actuator 장면·실행이 없다. health UP과 DB contributor/노출·인증 조건을 구분해야 한다. |
| 3.4 Docker/JUnit/Testcontainers/SpringBootTest 연결 | 319–340 | 없음 | unrun | 전체 테스트 lifecycle·ServiceConnection·JUnit 확장은 미검증이다. |
| 3.4 MySQLContainer generic·bean/ServiceConnection | 342–349 | tc-generic, tc-nongeneric | partial | 타입 매개변수0/작은 compile-only는 충족한다. bean lifecycle/접속 자동연결 실행은 아니다. |
| 3.4 생성자 주입·repository 검증·전체 테스트 | 351–363 | 없음 | unrun | 스키마 provisioning/생성자 주입 조건/JUnit 확장 의존성을 검토 후 전체 테스트를 별도 검증한다. |
| 3.5 PostgreSQL 전환 | 365–372 | 없음 | missing | 드라이버/URL/포트/테스트모듈/DB별DDL과 collation 차이 장면이 없다. |
| 4. 치트시트 URL/runtimeOnly | 374–379 | ports-host, dependency-starters, dependency-h2 | partial | 주소는 충족하나 runtimeOnly/BOM 선택 기준은 원문 표에 남았다. |
| 4. Pool max/timeout/maxLifetime | 380–382 | pool-idle, pool-borrowed, pool-waiting, pool-timeout, pool-returned | partial | 수치/대기 단위는 충족한다. maxLifetime와 DB전체연결한도·운영측정은 장면이 없다. |
| 4. ddl/OSIV/SQL logger 주의 | 383–386 | validate-missing, validate-ready | partial | validate 외 정책/OSIV/로깅 경계는 원문에만 남았다. |
| 4. health/db·ServiceConnection | 387–388 | 없음 | unrun | DB contributor 노출과 Testcontainers 접속정보 연결을 실행하지 않았다. |
| 5. Public Key Retrieval | 390–392 | 없음 | missing | 운영 TLS와 로컬 공개키 옵션을 구분한 진단 장면이 없다. |
| 5. Communications link failure | 393–393 | ports-host, ports-compose, ports-localhost | partial | 주소 오류 가능성은 다루지만 서버 미기동·ping/logs 진단은 없다. 실제 오류 재현도 없다. |
| 5. Access denied/Unknown database | 394–395 | 없음 | missing | 기존 volume 초기값/계정/DB 존재 확인 분기를 추가한다. |
| 5. DataSource URL/profile/driver 누락 | 396–396 | dependency-h2 | partial | H2 driver 누락만 설명한다. 활성 profile/URL 누락의 구성 실패 분기는 없다. |
| 5. missing table validate | 397–397 | validate-missing, validate-ready | covered | 추가 H2 실패 관찰이며 MySQL native 오류 실행과는 구분한다. |
| 5. Incorrect string value/utf8mb4 | 398–398 | 없음 | missing | DB/테이블/컬럼/URL charset 계층 진단이 없다. |
| 5. Hikari timeout 진단 | 399–399 | pool-waiting, pool-timeout, pool-returned | partial | 추가풀 timeout 실험은 있다. 느린SQL/긴트랜잭션/누수/장애·DB한도 구분은 없다. |
| 6. EntityManager→Hikari→JDBC/MySQL·관련문서 | 401–403 | boot-start, pool-idle | partial | 경로와 원인측정/수명/OSIV·S09/S17/D10/P14 연결은 원문에만 남았다. |
| 7. Q1 driver 추론/BOM | 405–411 | boot-start, dependency-starters, dependency-h2 | partial | H2 driver 추론은 관찰했다. jdbc:mysql 추론과 URL·embedded DB 부재 조건의 전체 설명은 빠졌다. |
| 7. Q2 운영 update/Flyway와 validate | 413–417 | validate-missing, validate-ready | partial | validate 미생성은 충족하지만 변경검토/순서/롤백/migration 정책은 없다. |
| 7. Q3 host/container 주소 | 419–423 | ports-host, ports-compose, ports-localhost | covered | 원문 설정 설명으로 충분히 전달한다. 접속 실행 증거는 요구하지 않는 설명 단위다. |
| 7. Q4 공개키·TLS/sslMode | 425–429 | 없음 | missing | 운영 TLS/서버 인증서/옵션 기본값은 원문에만 있다. |
| 7. Q5 show-sql/logger/p6spy | 431–435 | 없음 | missing | 로그 출력 경로/레벨/appender/마스킹·성능 선택 장면이 없다. |
| 7. Q6 timeout·원인/DB한도/maxLifetime | 437–441 | pool-waiting, pool-timeout | partial | 대기 timeout 의미는 보인다. 실제 원인 측정/용량/수명 정책 설명은 부분적이다. |
| 8. 참고문헌 | 443–450 | 없음 | covered | 참고 URL 보존의 의미만 covered다. 이번 감사에서 외부 URL의 최신 본문/가용성을 조회하지 않았다. |

### 문서 공백과 미실행 관문

**P19-S1 · important · 문서 범위 공백**
- 위치: `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P19-mysql-jpa-setup.md:79`
- 문제: 프로파일·비밀·TLS·문자셋/시간대의 주요 설정을 첫 학습 흐름에서 설명하지 않는다.
- 근거: tools/site/p19-lesson-data.mjs:310-342의 6질문에는 포트/추가H2만 있음. 원문 보존 자체는 통과.
- 후속 보강: profile/환경변수/default값과 local TLS/charset/timezone을 원문 기반 작은 장면으로 추가. 원문은 보존.
- 검증: 잘못된 profile/host/port/DB명 선택의 기대 해석과 stage data를 독립 검사. MySQL 미실행이면 모델로 표시.

**P19-S2 · important · 문서 범위 공백**
- 위치: `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P19-mysql-jpa-setup.md:147`
- 문제: 환경별 DDL/Flyway·OSIV·dialect 의미가 validate/naming 추가 실험 밖으로 확장되지 않았다.
- 근거: tools/site/p19-lesson-data.mjs:322-324 validate2stage는 실제H2를 정확히 설명하나 create-drop/update/none/Flyway/서비스 트랜잭션 판단은 없음.
- 후속 보강: 환경별 정책과 스키마 선행 준비/서비스 조회 경계를 구분해 보강.
- 검증: validate가 생성하지 않는 기존 검사 보존. 정책 결정 장면과 원문 참조·미실행 범위 검사.

**P19-S3 · important · 문서 범위 공백**
- 위치: `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P19-mysql-jpa-setup.md:155`
- 문제: SQL/bind 로그와 Actuator DB health 조건의 의미 장면·실행 관문이 없다.
- 근거: 원문155-164/298-317; 현재 lesson6질문에 해당 topic 없음. source-proof는 NONE/OFF로 실행.
- 후속 보강: SQL/바인딩/민감정보/health component·details·노출 조건을 별도 장면으로 설계.
- 검증: 로그/health를 모델과 실측으로 분리. 실제 HTTP 실행 전 실측 UP/DB응답을 표시하지 않기.

**P19-S4 · important · 문서 범위 공백**
- 위치: `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P19-mysql-jpa-setup.md:365`
- 문제: PostgreSQL 전환과 여러 연결오류·풀원인 진단·자가점검의 핵심이 원문 접기 안에만 남았다.
- 근거: coverage P19-U30 이후; ports/timeout 일부 외 TLS/Access denied/Unknown DB/utf8mb4/PG 장면 없음.
- 후속 보강: 오류→확인 대상→다음 조치와 PG 전환 점검을 작은 의미 장면으로 보강.
- 검증: 각 원문 오류/QA의 sourceLines-stageIds 연결을 갱신하고 부분장면 누락 검사.

**P19-S5 · important · 문서 범위 공백**
- 위치: `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P19-mysql-jpa-setup.md:172`
- 문제: 원문 Java25/MySQL/web/Actuator/Testcontainers 전체 실행은 완료되지 않았다.
- 근거: VERIFICATION/source.json/execution.scope가 이를 명시. 현재 추가JDK21/H2/non-web/typecompile는 원문 실행 대체가 아님.
- 후속 보강: 메인이 실행 범위를 별도 확정. 원문 테스트의 스키마 준비·생성자 주입·JUnit module 조건을 먼저 점검하고 가능환경에서 별도검증.
- 검증: 원문과 교정예제/추가실험을 분리한 native 로그·JVM 실제version·HTTP/DB관찰을 확보하기 전 unrun 유지.

## 2. Quality 진단 (승인 아님)

spec가 불완전하므로 quality 관문을 통과시킨 것이 아니다. 이번 범위에서 새로 재현한 현재 제품 기능 결함은 0건이다. 위 5건은 원문 의미의 공백·미실행 관문이며 현재 UI 기능 실패와 다르다. 원문 예제의 알려진 H2 누락·TC 좌표/generic 문제는 현재 보강에 정확히 설명되어 있다. 전체 원문 JUnit이 두 교정만으로 통과한다고 승인하지 않았다.

**환경/버전: bounded_consistent**
원문Java25/Boot4.1.1; 추가runtime/build.gradle toolchain21와 verify-source.py JAVA_HOME corretto-21.0.6; source.json/execution/lesson은JDK21을 명시. MySQL 실행 없음.. 한계: 역사 gradle-run에 System.java.version/정확JVM build 출력은 없다. 현재 Java -version/Gradle/native 실험은 금지하여 재실행하지 않음.

**DDL/schema: consistent**
P19Proof 36-40 missing DB validate실패/metadata 테이블부재; 별개ready DB에 원문DDL JDBC 사전실행 후validate. NOT NULL/PK/IDENTITY 일치.. 한계: 실제MySQL DDL호환/운영migration/validate가 모든constraint동등성을 검사한다는 주장 아님.

**입력→저장→별도관찰: consistent**
원문4Java전문추출일치; 직접CreateCustomer(Kim)→repository.save→id1/displayNameKim; 별도JDBC customer id/display_name; JacksonJSON 동일 필드.. 한계: HTTP응답/MySQL행/ORM SQL계측 없음. 저장 메서드 반환후 JDBC관찰이며 flush/commit/rollback 타임라인 측정이 아님.

**Pool 상태: consistent**
독립max1/minIdle1/250ms; idle1/0/1/0 borrowed1/1/0/0 waiting1/1/0/1 returned1/0/1/0; timeout은SQLTransientConnectionException. 한계: Boot풀max2/원문max10·30000ms와 별개. 250ms는 설정값/timeout카운터 미기록; 실제SQL시간/maxLifetime미측정.

**의존성/TC 타입: consistent_historical_artifacts**
originalMain/Web/Test resolve성공/원문mysql좌표실패/correctedtestcontainers-mysql2.0.5성공; mainH2없음; 88/88기존JAR SHA일치; 타입parameter0/generic거부/non-genericcompile성공. 한계: 새resolution/nativeJava없음. 원문전체JUnit·컨테이너생성/시작 미실행. 원문 ctor주입/스키마준비/JUnitmodule 조건은 전체수정예제 작성시 별도검증 필요.

**현재저장소와 원문 예제: separated**
compose.yaml DB_PORT기본13308/community, 원문3307/app, 추가H2 p19_ready/missing; lesson ports note가13308과분리. 현재appyml은별도학생구현파일.. 한계: 현재학습자src 설정의 적합성은 P19원문/lesson감사 대상이 아니며 변경하지 않음.

기존 Java 증거의 19 PASS와 execution.json은 일치하며 의존성 JAR88개의 현재 바이트 SHA도 모두 일치했다. 이 정적 일치는 새 Java 실행이 아니다. 실제 JVM patch/build 버전은 보존 로그에 별도 출력되지 않아 JDK21 toolchain/JAVA_HOME 설정까지 확인했다.

자동검사의 주된 기준은 현재 lesson data·기존 JSON·보존 baseline이다. 따라서 원문 범위 공백, native DB/HTTP 성공, 이미지 내부 모든 문장, 실제 모바일 배치/읽기성은 이 exit0으로 증명되지 않는다.

## 3. 직접 열람한 시안/과거 캡처

- `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p19-2026-10-20/images/P19-boot-h2-v4.jpg` — view_image 실제 열람, JPEG 1672×941.
- `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p19-2026-10-20/images/P19-validate-v2.jpg` — view_image 실제 열람, JPEG 1672×941.
- `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p19-2026-10-20/images/P19-pool-v2.jpg` — view_image 실제 열람, JPEG 1672×941.
- `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p19-2026-10-20/desktop-boot-h2.jpg` — view_image 실제 열람, JPEG 1672×2050.
- `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p19-2026-10-20/mobile-validate.jpg` — view_image 실제 열람, JPEG 360×2758.
- `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p19-2026-10-20/desktop-pool.jpg` — view_image 실제 열람, JPEG 1672×2001.

시안은 Boot/H2·validate·pool 대표3장만 읽었다. 나머지 선정3장과 draft8장은 미열람이다. 선정6장 전체의 해시는 generation/asset 기록과 일치했다. 과거 캡처3장은 저장 화면을 보는 범위이며 현재 브라우저 재조작을 대신하지 않는다. mobile validate에는 번역 확장 overlay가 보이며 사이트 오류로 판정하지 않았다. 당시 viewport1672×941/360×800과 full-page JPEG 높이를 구분했다.

## 4. 실행·보존 경계

새 실행: npm의 Node/JSDOM 검사와 정적 해시·추출·JPEG 헤더 대조. 미실행: 현재 브라우저, native Java/DB, 외부 웹/CLI, 추가 LLM/agent. source-proof/verify-source.py는 native 실행과 기존 증거를 수정하므로 읽기만 했다. application·원문·기존 증거·공유 장부·Git은 수정하지 않고 task5 폴더에만 썼다.

메인이 문서 공백별 좁은 사양을 확정하고 새 구현 후 독립 spec→quality 및 현재 desktop/mobile 검증을 수행해야 한다. 다른 환경 미실행을 완료로 올리지 않는다.

boundedVerdict: needs_completion
fullDocumentComplete: false
커버리지: 49 의미단위 / partial=23, covered=6, missing=13, unrun=7
이슈 수: 문서 공백 important 5 / 현재 제품 결함 critical 0, important 0, minor 0
actualexit: 0
