# R04 SQL 개념 학습 보강 검증

2026-10-20 · LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night · partially_implemented_and_browser_checked. R04 전체 또는 개념134개 완료가 아니다. merge/push/PR은 하지 않는다.

- 원문 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/R04-sql-crud-join.md 351줄 전문을 검토했다. SHA78af924291e7161c8357e46a8ba08361a57d53509deab926262b0e81fbfaa780와13fence(SQL7/Java1/Kotlin1/YAML1/bash2/Mermaid1)를 보존했다. 들여쓴 목록 코드도 행 시작 기준 fence 추출로 원래 body바이트를 유지했다. 외부 원고 사본과 현재 repo 원고는 동일바이트다.
- LOCAL_HOME/research/java-spring/practice/schema/schema.sql 과 LOCAL_HOME/research/java-spring/practice/schema/seed.sql 의 SHA 사본을 사용했다. 저장소 practice DB와 구분한다. 원본 및 사본 두 파일의 현재SHA도 일치한다.
- 공식 조사는 LOCAL_HOME/research/javaexperience-r04-20261020/REPORT.md 에 있다. 첫 Luna 실행자는 금지된 중첩CLI를 다시 호출해 sandbox 초기화EPERM을 웹 실패로 오판했고 잘못된 worktree 경로도 사용했다. 실제 outer Luna 접근은 성공했고 웹 호출은 없었다. 이 시도는 근거에서 제외했다. 같은 Codex CLI gpt-6-luna/OpenAI로 직접 웹 조회를 재시도해 성공했다. LiteLLM이나 다른 모델·제공자로 전환하지 않았다. 실패 기록은 연구 _data/attempt1에 보존했다.
- 메인은 MySQL8.4 JOIN/GROUPBY/UPSERT/ROW_COUNT/EXISTS/비교연산자와 Spring7.0.9 JdbcTemplate·Java21 PreparedStatement 공식 자료를 열어 대조했다. EXISTS 공식 절은15.2.15.6으로 Luna 초안의15.2.15.7 표기를 바로잡았다. Connector/J 매뉴얼은 Luna에서 Internal Error로 열지 못했으며 일반적 호환성 확인으로 표시하지 않는다. 아래의 드라이버 버전·연결 결과는 별도 실측이다.
- R03에서 공식 목록MD5와 일치를 확인한 MySQL8.4.11 macOS15 ARM64 portable 바이너리를 사용했다. 새 datadir·0700 socket 디렉터리·--no-defaults·새127.0.0.1 전용 임시port·mysqlx OFF를 사용했다. 실제 @@datadir/socket/port/bind 및 자체PID를 검증한 뒤에만 사본의 DROP DATABASE를 전달했다. 기존 서비스·3306·사용자DB·설정·인증정보는 사용하지 않았다.
- 새 인스턴스의 root와 JDBC SELECT 전용 계정에 매run 새 임시 암호를 생성했다. 암호값·인증 SQL은 trace/log에 남기지 않았다. root는 setup용 전용socket, JDBC는 새 loopback 계정과 sslMode=REQUIRED로 연결했다. 각 자체 서버는 mysqladmin shutdown 뒤 exit0·정지를 확인했다. R03의 TCP OFF 실험과 이 R04의 별도 loopback JDBC 실험을 구분한다.
- Python orchestration의41검사(그중 JDBC결과 통합검사3개)와 Java의8검사를 합쳐 고유 CHECK49개다. SQL문장49개나 독립 실험49개라는 뜻이 아니다. 메인 새 인스턴스 재현과 독립 reviewer의 새 datadir 재현 모두 frozen/current execution 전체가 일치했다. 원문13블록·Java 사본·의존성15개SHA를 확인했다.
- 원문 Java OrderReadRepository는 public 파일명으로 복사해 그대로 JDK21/Spring7.0.9/ConnectorJ9.7.0의 추가 JdbcTemplate fixture에서 컴파일·실행했다. Boot4.1.1은 BOM만 사용했다. 원문 Java25·Kotlin build·YAML·bash3306 접속·Boot앱·HTTP는 실행하지 않았다. 원래 프로젝트의 build나 서버 코드를 바꾸지 않았다.
- 원문 SQL7블록은 줄 주석을 분할할 때만 제거했고 표현식을 보존했다. SHOW16테이블/DESCRIBE, 회원1 PAID정렬6행[id1,901,721,541,361,181], 원문 INNER6/LEFT2/RIGHT1/CROSS4/SELF2, ON의미매칭회원181/182보존, EXISTS96고유회원, 주문1의17919×3=53757, GROUP/HAVING20그룹을 실행했다. ORDERBY없는CROSS/EXISTS/ON의 관측순서는 보장순서로 표시하지 않는다.
- JDBC원문에는 order_status필터가 없고 SQLblock01에는 PAID필터가 있다. 이번seed의회원1주문6개가 모두PAID여서 결과만 일치했다. 이를 sourceNote로 명시하고 빠진설명에 대한 실패재현→교정통과와4assert를 기록했다. 두 쿼리의 일반적 동등성을 주장하지 않는다.
- 원문 JDBC의 prepareStatement→setLong(1,memberId)→실행→RowMapper순서와 값1/181, 실제 ServerPreparedStatement, BigDecimal record6개/빈목록을 확인했다. 추적한 source두호출의 연결2·statement2·resultset2가 종료됐다. setup/guard/metadata 연결은 제외하며 pool수나 전체연결수가 아니다. wrapper관찰이며 wire계측이 아니다.
- 원문 DML은 한 transaction 안에서 product81/82, coupon11신규경로, point_history1501/member1/order1/amount100을 생성했다. stock은writer32/observer33, member_coupon300은writer없음/observer1행이다. 원문 UPDATE/DELETE의ROW_COUNT각1을 확인했다. INSERT3회 뒤와 ROW_COUNT조회2회 뒤에만 writer snapshot을 추가했고 ROW_COUNT직전에는 추가 writer SELECT가 없다. 중간 관찰은 별도 autocommit READ COMMITTED observer라 writer의ROW_COUNT를 덮어쓰지 않는다. 마지막ROLLBACK 뒤stock33/추가상품·demo쿠폰·포인트0/membercoupon3001과각초기snapshot일치를 확인했다.
- 추가 r04_extra: 오른쪽조건WHERE이동은0행/outer COUNT(*)1·COUNT(o.id)0, NULL비교·NOTIN은UNKNOWN/NOTEXISTS1, 동금액주문2개의JOIN SUM300·SUMDISTINCT100·정답헤더200, 별칭1054/한정없는id1052/WHERE집계1111/미결정order_no1055와PK함수종속성허용, 식별자자리?PREPARE1064를 확인했다.
- 별도 UNIQUE UPSERT는 신규1·변경2·무변경0이며 PyMySQL CLIENT_FOUND_ROWS=false 조건이다. 이메일UNIQUE충돌은 요청id2를삽입하지않고기존id1amount20을갱신했다. JDBC의기본모드나모든연결에일반화하지 않는다. 원문 coupon실행은 신규삽입 경로였다.
- 추가 autocommit성공과명시COMMIT은후속ROLLBACK에도남았다. 별도CHECK3819문장실패는앞선INSERT까지자동취소하지않았고명시ROLLBACK뒤취소됐다. 모든오류/deadlock동작을일반화하지않는다. sql_safe_updates1에서키조건없는추가UPDATE1175와행유지를확인했다. 제어한두연결순서에서A의사전plainSELECTstock1뒤B가0으로확정하면Aguard는0행이었다. 동시부하/시간/잠금대기측정은아니다.
- 실제 imagegen20장 중10장을선택하고10장을draft로분리했다. JDBC준비/바인딩순서·누락INNER행·SELF원문구분/행순서·주문상태·COUNT(o.id)·point_history·관찰actor/시점·PK열·NOTEXISTS표기를교정했다. 그림은일부열의교육용표기이고실제전체SQL·값은HTML/JSON에서본다.
- 10질문34상태에이미지·현재값·코드·선택PASS/runJSON·확대/pan/native선택기·키보드·history복원을연결했다. 원문과추가실험을분리하고긴코드/로그만접는다. 새controller는기존progress/localStorage를쓰지않는다.
- 실제 Chrome1672×941/360×800에서각34상태(총68)와이미지별양쪽20캡처를확인했다. 질문·제목·정확코드·label-value·PASS·dottedrunJSON·PNG로드/크기·로그기본접힘·페이지넘침과대조했다. copy완료신호뒤실제clipboard일치,로그유지,모바일nativepan40px,EndEnter,원문anchor/reload/catalogBack/actualForward의특수10과기존지도2흐름·사이트console오류0이다.
- 독립 reviewer가선정10PNG와20브라우저캡처를모두실제열람하고68관찰을현데이터에대조해일치/상태누락중복0을확인했다. 현재미해결Critical/Important/Minor0. 브라우저직접조작·전수픽셀/학습자검증은그리뷰에서수행하지않았다.
- 원문HTML12,933자/code12/id14·기존지도1·고유id보존. 전체135문서/학습자17파일SHA불변·원래작업트리3,403파일SHA불변·루트clean. 기존parity570행바이트prefix를보존하고10implemented만추가해580행/verified0이다. 신규34상태만unreviewed→mockup_ready→implemented의68전이를기록했다. inventory339pages44,545units/implemented412/기존verified6이며새verified는없다.
- 최종 npm run build, test:r04포함14suite, audit:visual/audit:version-cards/audit:parity통과. HTML339개/링크0. 실행근거는 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/r04-2026-10-20/source-proof/execution.json 과 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/r04-2026-10-20/checks/ 에있다.

미완료: 원문 Java25/Boot실행설정·bash/HTTP,모든SQL/에러/동시성경우,다른clientflag조건,wire/물리계획/성능·부하시험,학습자서버·이해도·전수픽셀동일성. 캡처에는stickyheaderstitch/스크롤위치차이와모바일번역확장overlay가있다. 구현부분만implemented를유지한다. 다음개념은W15다.

원본Gradle출력 compile.log/jdbc-run.log의2행끝공백각1개는그대로보존했다. 두파일·2행·SHA를whitespace-exceptions.json에한정하고나머지staged파일의diff --check는통과했다. 코드나문서의새공백오류로확대하지않는다.
