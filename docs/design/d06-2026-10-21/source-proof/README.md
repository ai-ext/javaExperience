# D06 원문 보존·추가 로컬 배포 개념 실험

원문264줄8fence와 Actuator dependency Groovy블록/YAML20s를 byte 그대로 보존한다. 원문은 기존 Boot앱을 가정하며 Java를 제공하지 않으므로 모든 Java/bootstrap/router/H2schema는 추가 fixture다. 원문 Java25/8080·실제prod/registry/Kubernetes/OS서비스등록을 실행하지 않는다.

추가 Java21.0.6·Wrapper9.8.0·Boot4.1.1의 fixture8개를 새0700프로젝트 사본에서만 사용한다. Gradle runtimeClasspath와 별도 proofRuntime H2의 실제artifact/SHA를 구분하며 H2는 Boot JAR에 포함하지 않고 별도 SchemaProof에서만 사용한다. Java서버에는 공개 demo 설정을 포함한 최소환경만 전달하고 전체 사용자환경값/secret를 출력하지 않는다.

20고유CHECK/3명시모델의 첫freeze·mainfresh·독립temp 전체frozen재현이모두통과했다. 실제50artifact/fixture8SHA·JarA/B실물SHA/각nestedlib42와BootJVM6PIDgone/HTTP6+router7port닫힘을독립검수했다. replay.log/independent-replay.json에근거를보존한다. run-proof.py 기본실행은 기존frozen과전체 JSON 비교, --freeze는기대값이없을때만생성하며덮어쓰기금지다.

관찰은A실행JAR의원문YAML20s보존/H2미포함·물리SHA/두프로파일이름사본동일SHA·설정source우선순위·같은바이너리의startup featurefalse404/true200·별도Bversion/defaultbusiness변형·healthUP/readinessUP지만business500·Pythonrouter의A200→B500→A200·readinessrefuse의health503/liveness200/directbusiness200/routerguard503/bypass200·인스턴스재시작없는readiness복원·명시10요청7blue200/3green500후사전fixture정지규칙으로blue복귀다.

두profile이름local/stg는같은컴퓨터의추가JVM이름이며실제staging/prod환경이아니다. feature는각자체JVM시작설정이며runtime hot-toggle/provider/cohort서비스를구현한것이아니다. router는실제HTTP전달이지만운영LB/DNS/Kubernetes·무중단/SLA/일반오류확률·성능검증이아니다. 기본readiness발행만으로직접HTTP요청을거절하지않는것과router가신호를읽는제어를구분한다.

자체/slow요청의파일gate진입을확인한뒤해당JVM에만SIGTERM을보내고 graceful log시작후release하면기존요청200과종료를관찰했다. 원문YAML20s와별도CLI1s변형을구분한다. 1s변형에서gate미해제상태의요청은completed200이되지않았다. raw예외/status는각runtime에보존하며유형을모든플랫폼의고정응답으로일반화하지않는다. 상시HTTP BootJVM6개는의도SIGTERM143/자체port닫힘이며,별도단발SchemaProof JVM은정상exit0이다. 미리보기서버의지속과구분한다.

별도in-memoryH2는autocommittrue/row1에서full_name='Ada  Lovelace'(중간공백2개/길이13)를수동givenAda/familyLovelace로옮긴다. expand후oldSELECT유지,contract뒤oldcolumnSQLSTATE42S22,downDDL로컬럼을다시추가하고단일공백으로concat하면'Ada Lovelace'(길이12)가되어원본과다르다. 이름보편파싱/온라인DDL/실제Flyway·MySQL/앱A·B의DB호출이아니다. App/router실험과SchemaProof는별도프로그램이다. 기존practice/DB/학습자src를변경하지않는다.

원시동적port/PID/HTTPheader/경로는runtime-last와각외부실행폴더에남기고canonical은관측값과명시별칭/한계를고정한다. artifactSHA는해당입력·환경에서검증하며모든빌드환경의재현성을보장하지않는다. 실제운영승인/환경승격·Rolling용량·platform운영책임·외부부작용보상은모델3개로구분한다.
