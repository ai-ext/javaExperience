# D03 원문 메모리 API와 실제 생성 명세

원문332줄6fence(Mermaid3/Groovy1/Java1/bash1)를 전문 검토·SHA 추출했다. 이전 연구 Markdown과 달라 현재 저장소 원문을 기준으로 했다. 완전한 Java block05를 TaskExample.java에 바이트 그대로 복사했다. 추가 TasksApplication은 원문이 Initializr에서 제공한다고 가정한 bootstrap이다. Java21 Gradle9.8.0/BOM4.1.1/WebMVC·Validation·springdoc3.1.1/-parameters 설정과 새loopback/port0 실행 인수를 구분한다. 원문 Java25/8080/Initializr 전체 설정을 그대로 실행한 것은 아니다.

첫 offline compile은 springdoc 자체 JAR가 아닌 선택된 Jackson2.22/2.22.1 transitive cache 누락으로 실패했다. 같은 새 프로젝트에서 선언된 MavenCentral·동일 버전으로 recordRuntime을 한 번 online 실행해 해결했고 이후 새 run은 offline으로 통과했다. 원문이나 버전을 낮춰 바꾸지 않았고 저장공간·LLM 한도 문제가 아니었다. compile 실패와 resolve 로그를 보존했다.

실제 Java21.0.6/Boot4.1.1/FW7.0.9/Tomcat11.0.24/springdoc3.1.1과 runtime artifact60개 SHA를 확인했다. 새0700 run 아래 원문·추가 bootstrap의 private 사본을 컴파일하고 자체 Boot JVM을127.0.0.1/port0에서 실행했다. 기존8080·학습자 서버·DB·외부 API는 사용하지 않았다. actual raw에는18 HTTP 요청, 두 JVM의 PID/port·전체 응답·실제 UUID와 생성 명세를 보존했다. 19개 CHECK는 겹치는 관찰 단위이며19개 독립 API 시험이 아니다.

유효 POST는201·Location과body UUID가 일치하고 title='배포 점검'이었다. UUID는 매회 실제 생성한v4이며 T1/T2는 그림용 호칭이다. raw UUID를 바꾸거나 가짜 고정 UUID로 실행한 것이 아니다. T1의 GET두번은200·id/title동일이었다. 같은body·같은 추가 Idempotency-Key header로 다시 POST해도201/서로다른UUID였다. 원문에는 멱등 키 처리 코드가 없으며 header 자체가 중복을 막지 않는다. 분산 멱등성·경합·트랜잭션을 검증한 결과가 아니다.

없는 고정nilUUID는404/application/problem+json으로 type=https://api.example.test/problems/task-not-found,title=Task not found,status404,detail의nilUUID와instance=/api/v1/tasks/nilUUID전체경로가 나타났다. instance는 원문에서 setter로 지정하지 않았고 실제 Framework가 채운 결과다. type URI를 네트워크로 fetch하지 않았다. 이 객체는 원문 TaskNotFound advice이며 다른 모든 오류를 같은 형식으로 만든 것은 아니다.

제목 missing/null/공백3개는각400, 앞뒤공백이 있는 정상글자는201/공백그대로였다. @NotBlank는 trim이 아니다. malformedJSON400·Content-Type text/plain415·not-a-uuid 경로400·collection GET405/AllowPOST를 관찰했다. 원문은 collection POST·item GET만 구현하며 목록 API가 아니다. T1 GET에추가status=closed&limit=1을 붙여도 같은task를 반환했다. 실제 필터·페이지 기능을 구현했다고 해석하지 않는다.

실제 /v3/api-docs는200/OpenAPI3.1.0·경로2개였다. 라이브러리 springdoc3.1.1과 생성 설명의 OpenAPI3.1.0은 다른 버전이다. 원문의 create는실제201인데 생성된POSTresponses는['200']이고201/Location계약을명시하지않았다. 해당 CHECK의PASS는이불일치의재현이며 API계약일치통과가아니다. 명시적인응답annotation으로고칠수있다는문헌권고와원문수정·수정후실험을구분한다. 이번에는원문annotation을고치지않았다.

생성 CreateTask 스키마는object/title string/minLength1/requiredtitle, Task는id string uuid/title string이었다. 추가 Python length predicate에서 공백3자의길이3은minLength1을충족하지만 원문실제검증은400이었다. 전체JSONSchema validator를실행하거나스키마의모든제약동등성을증명한것은아니다. 생성required필드와실제NotBlank 의미를나누어읽는다.

Swagger 경로는HTTP302→/swagger-ui/index.html→HTML200을확인했다. 브라우저JS/UI/try-it-out을실행한결과가아니다. 첫 JVM을 종료하고 같은 소스의 새 JVM을 띄우면 기존T1 GET은404였다. source ConcurrentHashMap은메모리이므로 프로세스재시작경계의관찰이며 DBrollback·migration·서버간복제실험이아니다. 두자체JVM종료/자체포트2개닫힘을확인했고 전역서비스를조작하지않았다.

별도모델3개는 Pythonset소비자계약비교, HTTPsafe/idempotent문헌, 합의→검증→리뷰/CI→배포→관측의미실행흐름이다. strict/tolerant결과는필드이름집합계산이지실제Jackson/제품소비자의설정검증이아니다. 원문에는PUT/DELETE·DB·인증/인가·분산멱등저장소·페이지API·JUnit슬라이스·PR/CI·운영배포/지표가없거나이번범위에서미실행이다.

main최종19개freeze뒤새run의일반replay가19관찰·3모델전체frozen과일치했다. raw timestamp/UUID/PID/port/date header·절대경로는비교값에섞지않고원자료에남겼다. frozen은실제로확인한형식·동등관계·명시alias·고정nil예시·문서내용만비교한다. 일반재현은 `python3 docs/design/d03-2026-10-20/source-proof/run-proof.py --runtime-root /Users/ds/research/javaexperience-d03-20261020/_data/runtime`이며 --freeze를 넣지 않는다.

공식연구는CodexCLI gpt-6-luna/OpenAI직접경로다. 첫실행자가불필요한nestedCodex를시도해옵션/초기화오류를냈고부분보고서로남았다. 같은Luna/OpenAI직접retry에서재위임없이직접web3회/nestedCLI0/error0/turn.completed를확인했다. 다른model/provider/LiteLLM으로바꾸지않았다. 첫원시로그는연구폴더attempt-01에보존하며해당시도의무관한config조회출력은저장소로복사하지않았다. 메인이공식9본문과actualruntime을별도로대조했다. 버전별라이브러리일반성·전체스키마·실제소비자·보안/성능·운영안전성·원문전체실행완료를주장하지않는다.

별도temp사본의독립재현도19CHECK/3모델전체frozen/main일치·18HTTP·원문Java/60dependency/4fixtureSHA와own2PID·port닫힘을대조했다. 독립실행경로·한계는independent-replay.json에있다.
