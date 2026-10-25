# V04 원문과 추가 검증의 경계

확인일:2026-10-20. 원문 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V04-test-db-strategy.md`264줄/9fence를 보존했다. 완전한 원문 ProductRepositoryTest1개는 수정 없이 컴파일만 했다. Docker Unixsocket2곳은 읽기 전용3초 _ping에서 접속거부였으며 Docker 서비스·컨테이너·ServiceConnection을 실행하지 않았다. Java4부분 패턴은 문서에 필요한 도메인/설정이 생략된 예제이므로 원문 전체를 그대로 실행했다고 하지 않는다. 원문 Kotlin/bash2도 외부 starter에서 실행한 것으로 표시하지 않는다.

외부 study의Product관련6Java와원본ServiceUnitTest2케이스·schema/seed는 SHA 사본으로 별도 보관했다. 기존 외부파일·학습자서버는 수정하지 않았다. ServiceUnitTest는 mock repository를 직접 new한 service에 전달하는 코드로 SQL·Spring proxy·DB를 검증하지 않는다. 실제 원본 unit2개가 통과했고, 원문 RepositoryTest의 assert body2개는 **추가 native adapter**에서 검증했다. 이 adapter는 TC 원문 class와 구분한다. Page요청은 정렬이 없으며 id목록은 추가 관찰기가 membership만 정렬 표시한 값이고 SQL ORDER BY 보장이 아니다.

추가 fixture는 Boot4.1.1 BOM/JDK21/Spring7.0.9/DataJPA4.1.1/Hibernate7.4.5.Final/H22.4.240/MySQL8.4.11/ConnectorJ9.7.0/TC2.0.5를 사용했다. 실제 HTTP toy app의 Tomcat은11.0.24다. dependencies.json의132개는 testRuntimeClasspath·annotationProcessor·compileClasspath에서 선택된 artifact의 합집합과 SHA이며132개 전부를 runtime class로 로드했다는 뜻은 아니다.

```bash
cd /Users/ds/code/javaExperience/.worktrees/concept-learning-night
/Users/ds/research/javaexperience-r03-20261020/_data/venv/bin/python docs/design/v04-2026-10-20/source-proof/run-proof.py \
  --mysql-base /Users/ds/research/javaexperience-r03-20261020/_data/portable/mysql-8.4.11-macos15-arm64 \
  --runtime-root /Users/ds/research/javaexperience-v04-20261020/_data/runtime
```

매번 0700 run 아래 새datadir(실측0750)·0700 socket디렉터리·자체PID·새127.0.0.1port·mysqlxOFF를 guard한 뒤 외부 study schema/seed사본만 적재한다. Java는 두 private schema의 SELECT/INSERT/UPDATE/DELETE만 허용한 새 임시 계정과 TLS REQUIRED를 쓴다. 암호는 매번 생성하고 기록하지 않는다. 기존 DB·3306·서버·설정·실습 데이터는 사용하지 않는다. 자기 MySQL은 정상 종료했다.

## 관측한 것

- @DataJpaTest의 기본 replace는 NON_TEST다. 자동 구성 DataSource에서 일반 static URL은H2로 교체, DynamicPropertySource URL은MySQL유지, explicitNONE static은MySQL유지, explicitANY dynamic은H2교체였다. 네가지 replacement case는 ddl-auto=none으로 엔진을 확인하기 전에 DDL을 실행하지 않았다. 이것은 TC/ServiceConnection의 실행 검증이 아니다.
- native adapter는 soft-delete조회 id1 present/id80 empty, 첫 page10/active total79/pages8의 원문 assert body를 검증했다. 원본 seed의 rowcount는80/active79다. 전체 seed 모든 값의 전후 동등성을 검사했다는 뜻은 아니다.
- 원문 fixture SQL2문장(category9001→product9001)은 Spring @Sql에서 실행했다. INFERRED의 테스트TX 참여 데이터는 rollback뒤둘다0이었다. ISOLATED는 테스트 rollback뒤둘다1이 남아 product→category 순서로 각1행 삭제했고 최종9001두테이블0을 확인했다. cleanup과 context cache를 혼동하지 않는다.
- 추가 case_probe에서 같은cafe/CAFE/café 입력을 비교했다. MySQL columncollation utf8mb4_0900_ai_ci는 case/accent 비교1/1, H2 MODE=MySQL·DATABASE_TO_LOWER=TRUE의 기본 문자열 조건은0/0이었다. cafe뒤café UNIQUE입력은 native1062/1행과H2모드2행이었다. H2설정을 바꾼 모든 경우나 모든 방언·잠금을 검증한 것이 아니다.
- 별도 H2/JPA toy의 LearnOrder1/line101은 @BeforeAll에서 TestTransaction비활성 상태로 별도커밋했다. 바깥 테스트TX가 있으면 service REQUIRED반환뒤lazy size1이 되고 Hibernate prepared2문장, 없으면 service가열고닫은뒤LazyInitializationException/준비문장1이었다. OSIV·실제주문도메인·DTO가 아니다.
- assignedID DeferredProbe의 amount-1을persist한뒤flush없이rollback하면 준비문장0/DB행0이라 DB CHECK를 검증한것이아니다. explicitflush는 준비0→1에서H2CHECK23513, IDENTITY IdentityProbe는persist중준비1에서23513이었다. 이 counter는 Hibernate 준비문장만 세며 JDBC observer SQL은 제외한다. provider/engine/키전략의 이 조건을 모든 save 호출로 일반화하지 않는다.
- 추가 RowListener는 외부메일/결제를 보내지 않고 독립connection에서행을읽는다. 기본rollback row71은AFTER_COMMIT0/행0, row72에서flagForCommit만할때는active true/call0, TestTransaction.end뒤call1/독립connection행1이었고 별도삭제했다. REQUIRES_NEW TransactionTemplate의inner73은outer74rollback뒤에도1행이고outer74는0이었다. inner73의별도DELETE를실행했으며이사례의delete영향행수는별도관측값으로기록하지않았다.
- 실제HTTP는 **추가 Boot/JDBC/H2 toy app**이다. 원문OrderHttpTest/실제상품쓰기API를구현한것이아니다. 자체Tomcat의actualconnector가127.0.0.1·선택port와맞는지확인했다. 실제TCP POST1개는다른worker/TestManagedTX=false/ApplicationTX=true/미커밋marker100관찰0/status201이었다. 테스트rollback뒤marker100은0/서버행201은1이라명시삭제했다. 동기MockMvc1개는같은thread/TestManagedTX=true/marker110관찰1이었고테스트rollback뒤marker110/쓰기211은둘다0이었다. asyncMVC/모든전파/다른엔진HTTP는미검증이다.

현재 full결과는 native9·Java28개의 고유 ASSERT ID37개와 JUnit22케이스/11클래스, 관찰facts32개다. 서로겹치는검증단위를합쳐서59개독립실험이라고하지않는다. JUnit22에는 관찰기회귀1개가포함된다. sourceTCclass의실행없음/선언된probe CHECK·fact및expected22케이스누락없음을검사했다. 전체frozenJSON은메인새인스턴스와독립임시복사재현에서일치했다.

## 원자료와 오류 교정

HTTP port·PID·실제response body·threadID·원시JUnitXML은 run별연구runtime에보존한다. frozen은이러한자원식별자의숫자대신실제비교한same/differentthread·bind/portmatch·DB행을기록한다. source-proof의rawJava로그도보존한다. 실제HTTPsocket은worker종료후닫힘을확인했고MySQL은shutdown exit0였다. 이를브라우저제품UI/원문API검증이나wire캡처로표시하지않는다.

추가fixture에서annotationProcessorBOM누락, ToyConfig닫는brace누락, nested@RestController가memberbean으로등록된상태에서@Bean을다시만든중복mapping, JDBC-onlyapp에JPArepositories자동구성이남은오류를교정했다. 원문문제나실제학습자앱오류가아니다. 실패로그는별도파일에남겼다.

관찰기가listener.calls의가변참조를보관해다음@BeforeEach.clear가과거facts를[]로바꾸는오류를발견했다. ObservationSnapshotTest로수정전실패를재현하고 record에서Map/List를deep-copy한뒤수정후통과시켰다. 그후fullfreeze와새replay를다시실행해 실제commit시점의calls[{id72,independentConnectionRows1}]를보존했다. 원본list를clear하고nestedid를99로바꿔도기록은id1/1row인회귀도확인했다. 잘못된중간관찰은 checkpoints/observation-alias-before-fix.json에명시적으로남겼고최종근거로쓰지않는다.
