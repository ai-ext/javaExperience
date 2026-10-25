# P19 보강 검증 기록

2026-10-20 KST. 원문450줄을 전문 검토했다. 주소·Boot 구성·validate·연결 풀·의존성·Testcontainers 타입의6질문19상태를 보강했다. MySQL 접속/전체원문JUnit/Actuator 등 모든 내용을 실행한 완료는 아니다.

## 실행과 출처

원문Java4파일을 그대로 추출했다. 격리 Boot4.1.1 non-web/JDK21/H22.4.240/Hibernate7.4.5.Final/HikariCP7.0.2/Jackson3.1.5에서 추가19검사를 실행했다. source-proof/verify-source.py가 원문SHA·추출코드·실행JSON·의존성SHA를 대조한다. 학습자 서버·실습DB·scenario·practice는 수정하지 않았다.

없는 p19_missing의validate실패는 실제SchemaManagementException과CUSTOMER테이블부재로 확인했다. 행COUNT는 측정하지 않았다. p19_ready는 원문DDL을 별도JDBC로 Boot시작 전에 적용한 뒤 validate했다. Boot가HikariDataSource와org.h2.Driver를 구성했고 원문Controller를Java로직접호출해Kim/id1을 저장·조회했다. 별도JDBC행display_name과실제직렬화JSON {"displayName":"Kim","id":1}을 비교한다. 원문CamelCaseToUnderscoresNamingStrategy클래스는 실제존재/작동을 확인했고 deprecation대체주장은 미확인이다. 이추가Bootpool의max2는원문10과다르다.

독립Hikari추가pool의max1/minIdle1/connectionTimeout250ms조건에서 idle(1/0/1/0),borrowed(1/1/0/0),waiting(1/1/0/1),returned(1/0/1/0)의total/active/idle/waiting을관찰했다. timeout예외는SQLTransientConnectionException이며timeout순간카운터는미기록이다.250ms는설정값으로측정SQL시간이아니다. waiting은thread이며추가물리연결이아니다.

BootBOM4.1.1의실제resolve결과를따로기록했다. 원문main/web/test는resolve되고원문main에는H2가없다. 원문org.testcontainers:mysql의무버전선언은이BOM에서실패하며testcontainers-mysql은2.0.5로resolve된다. 실제MySQLContainer의타입매개변수0개조회와독립TypeCasegeneric거부/non-genericcompile성공을확인했다. 컨테이너생성·시작과원문JUnit전체실행은아니다. Connector/J는실제9.7.0이다.

DockerCLI/앱설치/desktop-linuxcontext/프로세스는확인했으나읽기전용version조회가8초안에응답하지않았다. 원인은미확정이며backend재시작·종료·설정변경을하지않았다. 원문Java25/MySQL전체구성·실제HTTP·Actuator·Docker컨테이너는미실행이다.

공식조사는CodexCLI gpt-6-luna/OpenAI직접경로로 /Users/ds/research/javaexperience-p19-20261020 에저장했다. 첫시도는잘못된재위임절차/산출물누락으로실패했고같은모델/제공자의재시도로완료했다. LiteLLM과모델전환은없다. 메인은Boot/Testcontainers/Hikari공식본문과로컬실행을대조했다. research에보고서·출처메모를복사했다.

## 이미지와 화면

built-in image_gen14장중6장선택·8장draft다.프롬프트/원본/교정/SHA는generation-records.json과correction-prompts.json에있다. 포트양끝·DataSource역할·정확한namingclass·DB이름·원문DDL·CreateCustomer입력타입·미측정COUNT제거·pool조건·버전·독립컴파일소스를교정했다. 최종6PNG실측1672×941을메인과독립리뷰가읽었다.

Chrome1672×941/360×800에서19상태씩38관찰을수집해현재질문/제목/값/코드/PASS/의존성JSON/이미지/로드/넘침/증거접기와전부대조했다. 이미지별양쪽full-page캡처12개를저장했다. 실제코드복사·증거펼침뒤확대유지·새로고침복원·모바일그림키보드pan·긴의존성펼침·End포커스/Enter선택·원문과깊은앵커자동펼침을확인했다. 원문14609자/code17/id26·코드공백을보존했고중복id없음·실제bundle19상태·PNG실측을검사했다.

## 완료 범위와 한계

최종필수build/test:p19/w09/p16/p04/p09/knowledge-catalog/visual/version-cards/parity와추가19검사의명령·출력·exit는checks/final-checks.txt다. 독립리뷰는실행19PASS와execution.json전체를재현했고최종이미지6개를검수했다. 최종HTML/브라우저기록리뷰는REVIEW.md다.

19항목은mockup_ready를거쳐implemented로만올렸고전이38건을보관한다. 다른원문블록/전체문서를verified로올리지않는다. 전체픽셀정밀대조·실제학습자이해도·Chrome외환경은미검증이다. 일부모바일번역확장overlay는사이트UI가아니다. 이미지판과DOM화면의밀도/배치가같다는주장도하지않는다.
