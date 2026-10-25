# D05 디버깅 개념 부분 보강 — 2026-10-21

원문을 보존하고11개 질문·30개 장면에서 HTTP 응답, 예외 관계, 로그, 회귀 검사, 디버거, 스레드와 이분 탐색 증거를 비교한다. 원문 전체 환경·운영 문제를 해결하거나 전체134문서를 완료했다는 기록은 아니다.

## 원문·환경과 실행 범위

- 원문343줄9fence(Mermaid3/text1/Java1/properties1/bash3)를 전문 검토·추출했다. SHA c3a875fb1940e05020301d8b0c5e88c607c870acb4c86c100f2c696155ff03e9. 완전 Java와 properties는 fixture에 byte 그대로 복사했다. 원문Java25/8080/IDE·DB·Kubernetes 전체 환경은 미실행이다.
- 추가Java21.0.6/Gradle9.8.0/Boot4.1.1/FW7.0.9/Tomcat11.0.24/Logback1.5.38/JUnit6.0.3을 사용했다. 실제 testRuntimeClasspath47artifact와 fixture9개 SHA를 고정했다. 전역설치나 사용자 캐시 삭제·데이터 초기화 없이 새0700실험 폴더의 자체 프로젝트/JVM·loopback포트만 제어했다.
- 실제23고유CHECK/3명시모델을 첫 성공 freeze, mainfresh, 독립temp에서 전체frozen JSON 동일하게 재현했다. 독립검수는 실물47artifact/9fixture/원문9block SHA,5개자체PID gone, HTTP/JDWP포트 닫힘까지 확인했다. HTTP JVM은 의도한 SIGTERM exit143이며 baseline/DebugTarget/jdb/ThreadTarget은exit0이다. 모두exit0이었다고 확대하지 않는다. loopback 미리보기 서버는 학습 화면용으로 별도 유지한다.

## 관측한 증거와 경계

- 원문 Controller의 GET /orders/7은2회200/id7/statusOK, /orders/13은2회500이었다. /orders/not-a-long은400, /missing은404다. 실제500 default JSON의 error/path/status/timestamp와 서버 예외 스택은 다르며 JSON에는 SQLException class나 simulated database timeout 메시지가 없었다. 이 fixture의 설정 관찰이며 모든 Boot 설정의 응답을 보장하지 않는다.
- 원문이 IllegalStateException(order lookup failed)의 cause로 SQLException(simulated database timeout)을 직접 생성한다. JDBC나DB를 호출하지 않는다. 추가 SourceProbe 직접 호출에서 첫앱프레임 OrderController.find/source line29·suppressed0·공통tail2frame생략을 확인했다. 이2는 HTTP 프레임워크 전체 스택의 생략 수가 아니다.
- 별도 추가 Resource 예시에서 body failed가 primary IllegalArgumentException이고 close failed가 suppressed1개에 참조로 보존되며 cause는null이다. 원문 OrderController/SQLException 예시와 섞지 않았다.
- 추가 SourceProbe에서 같은 find(7) 실행결과OK를 유지하면서 logger level만INFO/DEBUG로 바꾸면 추가 DEBUG marker의 가시성이 달랐다. 로그 부재만으로 미실행을 단정하지 않는다. requestId/trace/MDC 생성·전파를 구현한 것이 아니다.
- 원문 의도7정상/13가상실패를 추가JUnit2개로 확인했다. private 사본에서 조건13→7 한 곳만 변이시키면2개실패, 원문 byte 복원 뒤2개다시통과했다. 원문 가상실패를 실제 DB 버그로 고친 것이 아니며 학습자 서버는 수정하지 않았다. 표의 성공 결과는 status 선택필드임을 명시했다.
- 별도 DebugTarget 자체JDWP127.0.0.1:0에 JDK21 jdbCLI만 연결했다. 실제 배정 포트는raw에, P_DEBUG는그림별칭이다. suspend=n이어도 후속 breakpoint는대상을멈춘다. inspect breakpoint의id13/counter0에서 eval bump()가counter1을만들어후속결과27이됐다. 별도 no-eval baseline은26이다. 같은id13이라도 원문 Controller와 다른 프로그램이다. IntelliJ UI를 조작했다고 표시하지 않는다.
- 실제step은compute안으로, stepup은caller line11/bci4로돌아왔다. 첫next의line12는result대입전이며둘째next의line13에서27을읽었다. 최초에는첫next뒤result를읽으려해 Name unknown이났고관찰시점을고쳤다. 실패로그/jdb원시출력/attempt-notes를보존했으며기대값은전수성공뒤에만생성했다. 실제DebugTarget.class javap에서bci4=istore_1/localdoubledscope5이후를확인해stepup시doubled이미저장이라는잘못된그림도교정했다. 이 bytecode 해석과 직접jdb관측 범위를구분한다.
- 별도ThreadTarget의2개 Thread.print에서holderWAITING/blockedBLOCKED/waitingWAITING을관찰했다. holder만monitor를소유한채release latch를기다리고waiting은monitor밖에서기다린다. 도해는 THREADS_READY뒤release latch에집중하며held setup latch생략을명시했다. mainrelease/ownthreadsjoin/THREADS_DONE/exit0을확인했다. 두대기스레드의세부스케줄링순서·운영deadlock·CPU/heap/지연을실측한결론은아니다.
- 별도tempGit7커밋/C1knownGood/C7knownBad에서같은실제javac+Java회귀판정으로C4bad(exit1),C3good(exit0)만실행해첫badC4를찾았다. C2/C5/C6는probe하지않았다. C는실제커밋hash의별칭이다. bisectreset후C7/remotes0을확인했고productworktree를bisect하지않았다. 판정경계와보편적인과관계증명을구분한다.
- 가설·IDE조건/예외/로그breakpoint·All/Thread·IDE Evaluate·SQL/bind/plan/pool wait·지표/trace/heap/K8s/rollback/deploy는명시모델이다. 모델5상태에는 실제PASS를붙이지않았다.

## 조사·이미지·화면

- 현재 CodexCLI0.163 도움말과 direct gpt-6-luna/OpenAI ACCESS_OK를확인한뒤직접조사했다. ownweb10/nestedmodelCLI0/error0/turn.completed/exit0을확인했다. LiteLLM/profile/다른모델·제공자전환은없다. 원자료/확인날짜/실패URL은외부research와이폴더research에보존했다. 메인10primary대조에서canonicalBoot4.1.1을확인했고currentFrameworkjavadoc7.0.10과native7.0.9를구분했다. Oraclejdbmanpage에eval설명이없다는문헌한계와설치된interactivehelp·실제eval성공을구분한다.
- gpt-image-prompt/학습계약/검수기준과실제imagegen23회생성·교정을사용했다. 선정11JPG92/12draft이며raw생성PNG는외부도구원본이다. 메인은23개를실제열람했다. 가짜getOrder/Order/RuntimeException·SQLException직접throw·Resource클래스·잘못된source line/프레임·monitor소유·HTTP/JUnit/dump혼동·Map부분필드표시·그림패널넘침을교정했다. 독립최종11실제열람/6기존SHA일치연계로미해결0이며선정중regression/stepping의실제폭1671도registry에반영했다.
- 13상태의코드강조를실제설명줄(return/throw/cause/loglevel·결과/assertions/eval·계산/next2회/latch두thread)로교정했다. 정확한코드·현재값·그림focus30개를연결했고긴원문과추가전체fixture/raw근거를보존했다.
- 최종build339HTML/링크오류0·D05unit/generated와기존27개총28suite·필수3audit가통과했다. 초기readiness편집을tools/site의잘못된cwd에서실행해FileNotFound뒤readyfalsebuild가한번돈이력은attempt-01-unready-build/build-attempts에남겼다. 올바른root에서readytrue등록을마친뒤build와generated계약을다시통과한최종결과만채택했다.
- Chrome explicit target으로각case실제before/afterviewport를보존했다. desktop1672×941/mobile360×800각30개총60관찰·22topicJPEG캡처에서코드/강조mark/값/전체parsedrun·모델noPASS/이미지자연크기·focus·핵심기본노출/기본근거접힘/페이지넘침·제목폭이통과했다. 최초읽기helper에서제한evaluate환경의parseFloat미제공으로DOM읽기가실패해style문자열반환으로교정했다. 관찰행이나캡처기록전실패이며제품오류가아니다.
- 코드복사462자/빈줄1정확일치·모바일native키보드pan40px·끝단초점·zoom근거열림유지/단계변경닫힘·resize·EndEnter·실제backforwardreload특수10개가통과했다. 기존33/37앵커2개와live본문12865자/code6/id16/map1/Mermaid3SVG가보존됐다. 생성원문전체는13876자다. siteURL/message필터console0/raw206이며다른raw로그를전부분류했다고하지않는다.
- 메인대표5캡처를실제열람했다. 독립22캡처/60행대조는capture-review.json에별도기록한다. 일부fullpage캡처는sticky nav가현재document scroll위치에그려질수있으며전수픽셀동일을인증하지않는다. ChatGPT요청탭은기존대화로복원하고viewportreset/preview와함께deliverable표시했다.

## 보존·남은 범위

원문Markdown135개/학습자서버17개/원문9block·47artifact9fixture SHA가같다. 원본worktree초기3403개중3398개는같고5개는별도사용자작업의.gitignore/AGENTS/비공개캡처3개변경이다. 원본HEAD는같으나status는다르며root에도별도AGENTS메모가있다. 외부변경을덮어쓰거나이번커밋에stage하지않는다. 원본전체불변/rootclean으로표현하지않는다.

parity650prefix보존+11=661/verified0,inventory44938/implemented629/기존verified6에기록했다. 전수픽셀/모바일가로이동끝모든영역동시가독/학습자이해도·원문Java25전체/실제IDEUI/DB·운영/heap/K8s/CI·배포는미검증이다. 전체134문서/goal은미완료이며merge/push/PR은수행하지않는다.

최종 독립 캡처 검수:22topic JPEG 모두original크기로실제열람하고header/크기/bytes/SHA를불변manifest와대조했다. 현재data와60raw행·70parsedrun객체·active강조줄·before/after60쌍/aftercapture22건이일치하고미해결Critical/Important/Minor0이다. fullpage stickyheader위치/모바일pan·regression요약focus경계/desktopHTTP pre내부scroll·대표캡처밖상태시각전수미열람한계는capture-review에명시했다.

공백 검사: 원시조사Markdown의hard-break/Gradle·jdb stdout프롬프트와이를보존한생성HTML의경고40개를각filename/line/indexbyte·SHA로고정했다. HTML행은원문Markdown또는nativejdb행과unescape후일치하며rawlog/원문을trim하지않았다. 나머지staged파일diff --check는exit0이다.
