# W09 보강 검증 기록

2026-10-20 KST. 원문388줄·Java9블록을 전문 검토했다. Session 수명·직렬화·공개 계약·조회 계획·단건 프로젝션·record의6질문18상태를 구현했다. 요청DTO→Command·권한/소유자 결정, ModelMapper·인터페이스 프로젝션 등 원문의 모든 내용을 새 이미지/실행으로 완성한 것은 아니다.

## 실행과 출처

- 원문5 Java파일(Entity3,OrderSummary+수동mapper,MapStruct인터페이스)을 그대로 추출했다. source-proof/verify-source.py가 원문SHA와추출본을 대조하고 별도 Gradle프로젝트/H2메모리DB만 실행한다. 학습자 서버·DB·practice는 수정하지 않았다.
- Hibernate7.4.5.Final/H22.4.240/JDK21.0.6/Jackson3.1.5/MapStruct1.6.3의 추가fixture28검사가 통과했다. 원문단건JPQL은직접Hibernate로실행했고 목록쿼리는추가변형이다. SpringDataRepository·Boot·OSIV요청·HTTP포트·MySQL·Java25는실행하지않았다.
- 주문3개/서로다른고객3개,매번새Session,batchfetch0/2차cacheoff,seedtransaction커밋후조건이다. closedfind1/닫힌getter추가0+LazyInitializationException/열린getter추가1/직렬화추가2+StreamConstraintsException/수동root1+고객3/MapStructroot1+고객3/단건·목록projection각1을관측했다. 별도JDBC관찰SELECT는ORM계수밖이며실패뒤행유지를확인했다.
- 직접반환객체의메모노출/추가CustomerPublic(name),단건projection의Session종료뒤직렬화추가0,별도ItemList의공유/복사를실행했다. DB고객(customer1@example.com/internal-1)과별도plainCustomer(m@example.com/internal-only)를섞지않았다.
- MapStruct실제생성구현/의존성좌표·SHA/실행JSON/원시로그를보관한다. runtime/build와.gradle은gitignore다. registry의정확한선언버전을Gradle로해결했고processor1.6.3도기록했다. 수치와속도를다른설정으로일반화하지않는다.
- CodexCLI gpt-6-luna/openai직접경로의공식문헌조사를 /Users/ds/research/javaexperience-w09-20261020 에보관했다. LiteLLM/재위임/임의모델전환없음. 메인은SpringData/MapStruct/Hibernate공식본문과실행을대조했다. 보고서·출처메모는research에복사했다.

## 이미지와 화면

built-in image_gen18개중6개선택,12개draft다. 원본/프롬프트/참조/SHA는generation-records.json,선택별근거와캡처는asset-review.json이다. 초기시안의가짜OrderItem상품/수량/가격,Jackson2예외경로,잘못된비선택필드/추가입력/record final대상/조회·반환방향/생성자열연결을교정했다. Session시안실측은1671×941,나머지는1672×941이며데이터선언도실제크기와일치한다.

Chrome1672×941/360×800에서18상태씩36관찰을수집했다. 질문/제목/값/코드/PASS/실측SQL/이미지경로가현재data와전부일치했고이미지로드성공·페이지가로넘침없음이다. 이미지별desktop/mobile full-page캡처12개를보관한다. 모바일은현재의미구간을확대하고내부좌우이동으로읽는다. 실제코드복사/로그펼침뒤확대유지/원시SQL열림넘침없음/끝포커스/새로고침/그림키보드pan/End포커스+Enter선택/원문펼침·깊은앵커스크롤을확인했다.

원문15,871자/code9개/기존id10개·전체코드공백을보존하고중복id없음·실제classicbundle18상태·PNG실측을검사했다. 직렬화의중간장면은전체실행SQL과원문getter를연결한설명용재구성이며줄별로멈춘계측이아니다. 원시SQL에는바인딩값을기록하지않았고Java입력과구분했다.

## 리뷰와 한계

독립리뷰가28PASS/execution.json전체/원문추출/MapStruct생성을재현했다. 선택6이미지를전부읽었고Important2(조회/반환방향,projection열연결)·Minor1(1671/1672너비)을지적해교정본2장을재검수했다. 최종지적해소와추가HTML/기록리뷰는REVIEW.md에기록한다.

최종명령/출력/종료코드는checks/final-checks.txt다. 실제학습자이해도·Chrome외환경·12캡처전수픽셀정밀대조는미검증이다. 일부모바일번역확장overlay는사이트UI가아니다. 이미지판과전체UI는배치/밀도/DOM조합이다르며전면동일성을주장하지않는다. parity와18상태는implemented이고verified로올리지않는다. 다른문서/기존원문블록전체로완료를전파하지않는다.

원문 OrderEntity.java의 마지막 빈 줄과 원시 gradle-run.txt의 Gradle 문장 끝 공백은 증거 보존용 예외다. checks/whitespace-exceptions.txt에서 두 진단만 확인했고 다른 공백 오류는 없었다.
