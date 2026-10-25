# D03 REST API 개념 부분 보강 — 2026-10-21

원문을 바꾸지 않고10질문27상태에서 생성·조회·중복POST·검증·오류·명세·호환성·메모리 경계를 비교한다. 이 문서는 원문 전체의 실습·배포 완료가 아니라 관측 가능한 핵심을 추가한 부분 보강이다.

## 원문과 실제 실행

- 원문332줄/fence6(Mermaid3,Groovy1,Java1,bash1) 전문 검토·추출. SHA c91a9ac8a9f9168b51a174cf39084c684d3e0e52ced12446b9283b23676a71c7. 생성 원문13774자/code3/id22/map1,live Mermaid를제외한본문12903자와실제SVG3개가보존됐다. 원문Markdown135개/학습자서버17개SHA불변이다.
- 완전한원문Java block05는fixture의TaskExample.java와byte같다. 추가TasksApplication/bootstrap·Java21.0.6·Gradle9.8.0·Boot4.1.1/FW7.0.9/Tomcat11.0.24·springdoc3.1.1/-parameters로실행했다. 실제 의존성60개·fixture4개SHA를검사했다. 원문Java25/8080설정전체를실행했다고하지않는다.
- 새0700실행폴더/private127.0.0.1/port0의자체Boot프로세스2개에서18HTTP요청·고유19CHECK와명시모델3개를기록했다. main freeze/fresh와독립temp의전체frozen이같다. 관측후자체2JVM/port2종료확인. 기존사용자서비스·DB·데이터초기화는수행하지않았다.
- 최초offlinecompile는고정Jackson transitivecache가없어실패했다. 같은버전·declaredMavenCentral의일반online resolve1회뒤offline재현이통과했다. 실패로그를남겼으며디스크나LLM사용량문제로단정하지않는다.

## 관측한 계약 경계

- POST201/Location과본문UUIDv4일치,같은자원GET2회200/idtitle같음. 같은본문·같은추가Idempotency-Key재POST도201/newUUID를생성했다. 원문에멱등키구현이없다. T1/T2는각실제UUID의그림별칭이고UUID/요청URI리터럴이아니다.
- 누락/null/공백3title는400,앞2뒤2공백이있는title는201/공백보존. NotBlank검증은trim이아니다. 깨진JSON400/textplain415/잘못된UUID변환400은원문404advice의missingmap과다르다. 없는all-zeroUUID의404ProblemDetail type/title/status/detail/instance와Content-Type을실제로확인했다. type URI는식별자이고fetch하지않았다.
- GETcollection405/AllowPOST이며목록API는없다. 단건에status/limitquery를붙여도같은자원200이다. 필터/페이지가자동생긴것이아니다.
- 실제/v3/api-docs200/생성OAS3.1.0과라이브러리springdoc3.1.1구분. 생성POSTresponses는200만있지만실제201이었다. 해당CHECK PASS는불일치재현이며계약일치판정이아니다. title required/minLength1에공백길이3이통과하는추가lengthpredicate와실제blank400을비교했다. 전체JSONSchema validator를실행한것이아니다.
- Swagger HTTP302→/swagger-ui/index.html→HTML200을받았다. Swagger브라우저JS/render/try-it-out은미실행이다.
- 첫JVM성공POST3자원중T1만도해발췌했고나머지생략을표시했다. 같은소스의새JVM에서는이전T1GET404다. DBrollback이나migration시험이아니다.
- 소비자호환성은Python집합strict/tolerant/새필수입력모델이다. 실제Jackson/client설정/운영소비자시험이아니다. HTTP멱등의도/DELETE·개발전달과정도명시모델이며해당장면PASS를만들지않았다.

## 조사·이미지·화면 검증

- 조사실행은CodexCLI0.163.0/gpt-6-luna/OpenAI직접경로다. 최초실행자가Codex를안에서다시호출해option/appserver오류가난기록을분리보존했다. 같은모델/제공자retry는직접web3/nested0/error0/turn.completed. LiteLLM이나다른모델로전환하지않았다. 메인9개primary대조/확인날짜·한계를research에보존했다. 원자료에있던근거없는미래spec schema날짜는메인검증기록에서미확인으로교정했다. 현재spec index3.2.1과실제생성3.1.0을섞지않는다.
- gpt-image-prompt의학습계약·검수기준과실제imagegen을사용했다.24개실제생성/교정중10JPG선정·14draft. 사용자지시로전달자산은원해상도JPEGquality92다. raw생성PNG는도구외부원본으로남겼다. 잘못생긴source메서드/route/client·가짜UUID를그대로채택하지않았고imagegen교정후main/독립실제열람으로확인했다. openapi-v3는거절이력이고v4가선정본이다.
- 생성HTML339/링크오류0,관련26suite와필수3audit exit0. 27state codeExact/값·lead·CHECK·전체runJSON·실제JPEG자연크기·원문·명세불일치·모델noPASS검사가통과했다. 근거는checks/와browser-comparison.json이다.
- 첫브라우저검사는viewport capability가다른탭을제어했고함수closure는이전탭을참조하여54관찰이모두1668×832였다. 목표치수assert가없었던메인검사실수다. 모바일통과보고를사용자에게정정하고attempt-01-browser-viewport/에복사시점실패54행20캡처내용을보존했다. 독립리뷰의첫hash스냅샷과archive의byte동일은인증하지않으며두hash목록을구분한다. 진단중옛closurehelper가desktop-create를다시취득한시점과독립리뷰·교체가겹쳤을가능성을확정원인처럼쓰지않는다. 앱오류/용량문제로분류하지않는다.
- 새검사는탭을함수인자로명시하고각case전후실제1672×941/360×800을assert했다. 각27상태총54관찰/20topic캡처를새로취득했고코드/값/run/로드/자연크기/핵심details밖/초기근거접힘/페이지넘침/제목폭이모두통과했다. 실제nativecopy287자/빈줄1정확일치,모바일native키보드pan22.5px,끝단초점/zoom·openproof유지/장면변경근거닫힘/resize/EndEnter/historyback-forward/reload특수10검사를통과했다.
- 기존앵커2개와원문code3·본문12903자·map1/Mermaid3SVG를live브라우저에서확인했다. siteoriginerror/warn0/raw145는다른페이지/확장로그를구분했다. ChatGPT요청탭은검사뒤원래대화로복구했고viewport reset/요청탭과preview deliverable표시를마쳤다.

## 보존과 한계

원본worktree초기3403파일중3398개는같으며5파일은별도사용자작업의인계메모·공개제외(.gitignore/AGENTS/캡처3개)변경이다. root에도별도AGENTS메모가있다. 원본HEAD는같으나status는달라졌으므로원본전체불변/rootclean이라고주장하지않는다. 이작업에서는원본/root/외부메모를변경·stage하지않고보존했다. 캡처3개의외부백업SHA는JPG전환검사에서초기baseline과같음을확인했다.

전수픽셀동일/모바일pan밖모든영역동시가독/학습자이해는미검증이다. 원문Java25/전체Initializr·DB·인가·분산멱등store·목록/페이지·JUnit슬라이스·PR/CI·스테이징·운영배포/모니터링은미실행이다. parity/inventory는implemented까지만기록하고verified로올리지않는다. 전체134문서/goal은미완료이며merge/push/PR은수행하지않는다.

독립최종검토: 새20topic캡처를모두실제열람하고54행의전체값·코드·parsed runJSON·목표viewport를현재registry와대조해미해결0이었다. 첫needs-mobile-retake보고서자체바이트는first-review-snapshot.json에보존했다. 해당보고서의이전관찰/12캡처hash와archivehash는같다고인증하지않는다. 최종새54/20의SHA는capture-review.json에별도로고정했다. 필수3audit모두exit0,parity639verified0/inventory44816(implemented570/기존verified6)이다.

공백검사예외: Gradle native로그3개(attempt-01-offline-compile/compile/resolve-online)의2행끝U+0020을실제byte/SHA로고정해보존했다. staged-diff-check는이3개경고를정확히기록하고나머지staged파일검사는0이다. 원시로그를trim하지않았다.
