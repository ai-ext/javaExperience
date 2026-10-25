# V04 테스트 DB 경계 보충 학습 검증

2026-10-20, 별도 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night 의 개념 전용 부분 보강이다. 10질문·27상태와 선택 이미지10장(실제20회 생성·10draft)을 구현했다. 전체 원문의 모든 독립 장면·전수 픽셀·학습자 이해도를 완료 처리하지 않는다. merge·push·PR은 하지 않았다.

## 원문과 실행 범위

원문264줄·9fence(Kotlin1/bash2/Java5/SQL1)를 전문 검토했고 SHA를 보존했다. 생성 HTML과 실제 Chrome에서 본문13,285자·code9개·id19개·기존 지도1개가 일치했다. 완전한 원문 ProductRepositoryTest는 Boot4.1.1/TC2.0.5 의존성으로 그대로 컴파일만 했다. Docker socket2곳의 bounded _ping은 connection refused였고 기존 서비스·설정을 바꾸지 않았다. Testcontainers·Docker·ServiceConnection·컨테이너 수명은 실행하지 않았다. 도메인이 생략된 나머지 Java 부분패턴은 그대로 실행했다고 표시하지 않는다.

외부 study의 Product 관련6Java·원본 ProductServiceUnitTest·schema/seed 총9사본을 SHA로 대조했다. 원본 unit2케이스는 mock Repository와 직접 new Service에서 실행됐다. SQL/DB/Spring proxy/HTTP 검증이 아니다. page2/size2·items21/22·totalPages3과 page/size 값이 같은 Pageable 전달(equals)을 확인하며 객체 identity는 검사하지 않는다. 원문 Repository assert body2개는 별도 native adapter가 재사용했다. source PageRequest는 정렬이 없고 idsUnordered는 관찰기가 membership만 정렬 기록한 것이므로 SQL 순서 계약이 아니다.

추가 Gradle Java21/BOM4.1.1 환경은 실제 Boot4.1.1·Spring7.0.9·DataJPA4.1.1·Hibernate7.4.5.Final·H22.4.240·Connector/J9.7.0·TC2.0.5·Tomcat11.0.24를 사용했다. dependencies.json의132 artifact는 testRuntimeClasspath/annotationProcessor/compileClasspath 합집합이고132개 전부가 런타임 로딩됐다는 뜻은 아니다. Java25·원문 OrderHttpTest·실제 학습자 상품 API·MySQL HTTP·async MVC는 미실행이다.

매회 0700 run 아래 새datadir(실측0750)·0700 socket디렉터리·자체PID·새 loopback port·mysqlxOFF를 확인한 portable MySQL8.4.11에서 외부 schema/seed 사본만 적재했다. Java는 private ds_practice/v04_extra 두 schema의 SELECT/INSERT/UPDATE/DELETE만 허용한 임시계정·새 암호·TLS REQUIRED로 연결했다. 암호를 로그에 남기지 않았다. Java에 root/DDL권한을 주지 않았고 기존DB/3306·학습자데이터는 사용하지 않았다. 자체 MySQL은 정상 shutdown exit0, 추가HTTP socket은 worker 종료 뒤 닫힘을 확인했다.

## 관찰한 경계

- Boot4.1.1 default replace=NON_TEST는 인식한 test database의 예외가 있다. 자동구성 DataSource·ddl-auto=none에서 static/default는H2, DynamicPropertySource/default는MySQL, static/NONE은MySQL, dynamic/ANY는H2였다. 원문의 항상 embedded 교체 일반화를 보충하며 dynamic URL을 TC 실행으로 부르지 않는다.
- native adapter는 seed총80/active79·activefinder1 present/80 empty·page content10/total79/pages8을 확인했다. baseDB row80 자체 부재라는 뜻은 아니다. 전체 seed 모든 값의 전후 동등성을 검사한 것도 아니다.
- 원문 SQL2문장의 category9001→product9001을 추가 @Sql 실험에서 그대로 사용했다. INFERRED는 test rollback뒤각0, ISOLATED는 outer rollback뒤각1이 남았다. product→category 순서로각1행삭제했고 최종9001은둘다0이다. context cache는 cleanup이 아니다.
- 추가 case_probe.word의 cafe를 CAFE/café와 비교했다. MySQL utf8mb4_0900_ai_ci는1/1, H2 MODE=MySQL;DATABASE_TO_LOWER=TRUE/noIGNORECASE override는0/0이었다. 기존cafe뒤café UNIQUE입력은MySQL1062/1행대H2accepted/2행이었다. 이 collation/설정의 측정이며 모든 H2설정·함수·잠금·속도로 일반화하지 않는다.
- 추가 LearnOrder/LearnLine H2 toy에서 service REQUIRED 반환 후 outer testTX가 있으면 미초기화 collection의 size1/준비문장2, 없으면 LazyInitializationException/준비문장1이었다. EntityManagerFactory 종료가 아니라 service EntityManager 경계다. 원문 Order/OSIV/HTTP 실행이 아니다.
- 추가 DeferredProbe assigned81/-1은 flush없이 persist반환/준비0/rollback행0이라 DB CHECK실행 검증이 아니다. assigned82는flush0→1/H2CHECK23513/rollback행0, IdentityProbe는persist중준비1/23513/rollback행0이다. 할당identity id는 미측정이다. Hibernate prepared counter는 observer JDBC SQL을 포함하지 않는다.
- 추가 event_probe71은 기본rollback뒤listener0/행0이다. 별도72의flagForCommit 직후는testTXactive/listener0이며 end가commit한뒤calls[{id:72,independentConnectionRows:1}]/행1을 관찰했다. 이후DELETE1/remaining0이었다. RowListener는 메일·결제 전송이 아닌 독립연결 관찰자다.
- 추가 TransactionTemplate REQUIRES_NEW는 inner73commit/outer74rollback뒤73=1/74=0이었다. 후속DELETE73은 실행했지만 영향행수/삭제뒤0은 별도 기록하지 않았다. 물리연결 개수·락·pool대기는 측정하지 않았다.
- 추가 Boot/JDBC/H2 앱에서 실제TCP POST1회와 동기MockMvc1회를 실행했다. actual connector127.0.0.1/임시port일치를 확인했다. TCP는다른thread/TestManagedTXfalse/ApplicationTXtrue로미커밋marker100을0으로읽고row201을commit했다. testrollback뒤marker0/server201행1이고명시DELETE1이었다. 동기MockMvc는TCP없이DispatcherServlet직접호출·같은thread/TestManagedTXtrue/ApplicationTXtrue로marker110을1로읽었다. marker110과쓰기211은testrollback뒤둘다0이다. HTTPstatus201과rowid201은다르다.

native9/Java28 고유ASSERT37개·JUnit22케이스/11클래스·facts32는 겹치는 단위다.59개 독립실험으로 합산하지 않는다. JUnit22에는 관찰기 회귀1개가 포함된다. 가변 list 참조가 다음 단계에서 지워져 관측값을 덮던 추가 관찰기 버그를 실제 실패회귀 뒤 deep record-time snapshot으로 고쳤다. 수정 전 실패로그·이전checkpoint는 구분 보존하고 최종 freeze/새 replay/독립 임시복사 전체JSON 일치를 확인했다. 실제 listenerport/PID/threadID는 해당 run 식별자이고 frozen 계약이 아니다.

## 이미지·브라우저·검사

실제 image_gen20회 중10장을 선택했다. 나머지10장은draft다. 표이름category, unaccented cafe, lazy 예외, flush전부추가실행, AFTER_COMMIT단계, REQUIRES_NEW삭제측정범위, MockMvc직접호출과미커밋, Pageable equals 표현을 실제 열람해 교정했다. 원시이미지를 Python으로 편집하지 않았다.

Chrome1672×941/360×800 각각27상태·총54관찰/20캡처에서 exactcode/values/ASSERT/run JSON·PNG실제크기/로드·본문가로넘침없음·핵심기본노출·로그기본접기를 확인했다. special10은 nativepan(실제39.5px)·완료메시지후정확clipboard문자열·로그/zoom/resize·키보드·원문앵커/reload·catalogBack/실제Forward다. 기존지도/원문검사2개도 통과했다. siteURL필터warn/error0이며 bounded원시183로그는모두외부chrome-extension notKey오류다. 전체browserconsole0이나확장문제수정을주장하지않는다. 모바일확대그림은nativepan/전체그림전환이필요하고번역확장overlay설정은바꾸지않았다.

DOM read-only facade에cloneNode가없어원문검사helper를textContent에서정확summary/script만빼는방식으로바꿨다. 마지막 unit표현/이미지수정뒤양쪽4관찰과2캡처를재취득했고, reload로열린원문을접어최종mobile캡처를다시저장했다. 이들은관찰도우미/촬영조건수정이며학습자코드수정이아니다.

최종 build exit0/HTML339·링크오류0, 관련16suite/필수3audit 모두exit0다. 개념문서135·학습자서버17·원본worktree3403 SHA불변/루트main clean/132dependency SHA/외부study9 SHA를확인했다. parity기존589의바이트prefix를유지해10건만append(599/verified0). inventory44,640항목중464implemented/기존verified6이며이번27상태는미검토→시안준비→구현으로만올렸다.

공식조사는 Codex CLI gpt-6-luna/OpenAI 직접경로이며LiteLLM미사용이다. 메인은공식8개출처를별도대조했다. TC2.0.5GitHub/BOM웹조회실패는연구에남겼고실제Gradle의존성해석/컴파일과구분했다. 근거는 source-proof/, research/, browser-*.json, image-records.json, asset-review.json, inventory-transitions.jsonl, parity-append.json, checks/에있다. 독립 최종이미지/캡처검토결과는 REVIEW.md에기록한다.

독립최종검토자는선택10PNG·최종20캡처전부를실제열람하고54관찰을현행data와대조했다. Pageable identity표현Minor1건을수정한뒤미해결소견0, test:v04독립exit0이다. runMatches는기록경로/성공값의대조이며브라우저로그본문전수독립재구성이아니다. 상세 REVIEW.md.

원시Gradle진단13파일의146공백경고는정확한파일SHA/줄번호로한정한예외다. 실패fixture stacktrace의공백도진단원문으로보존했다. 나머지staged diff-check는exit0이며raw로그를잘라내지않았다.
