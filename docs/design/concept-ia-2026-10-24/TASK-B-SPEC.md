# taskB — PC 다크의 진입·설명 읽기

TaskA는119a8c5뒤scoped dark기반을구현했고,현재CSS최종SHA d9454cbdf2ce20b6884e31dff0fc2b5db084300debe000431270ede3fb43d14b다. 최초비대조색누락은두차례수정했고Sol spec→quality 승인,메인26화면806텍스트실측·7JPEG직접검토·PC1280/1440/1672확인. taskB는별도변경이다.

사용자범위: PC다크전용,모바일구성폐기가능. 새mobile/light분기/시안/QA없음. 원문/학습자/기존proof를그대로둔채 홈·목록·상세·산문배치를개선한다. 모델Luna high구현/Sol high검증/메인설계·최종실화면검증.

## 구현 파일

- 신규 tools/site/knowledge-reader.mjs: 현재문서원본HTML의H1/H2id/title에서toolbar/읽기제목/aside목차를만든다. 기존source heading을새교과내용처럼창작하지않는다.
- 신규 tools/site/knowledge-reader.js: initKnowledgeReader(doc=document,win=window), mode/hash/history/focus. 브라우저끝에서init1회. 외부통신/storage/완료진도쓰기없음.
- 신규 tools/site/knowledge-reader.css: PCdark읽기/장면2열/flat prose. 새mobile미디어분기없음.
- 신규 tools/site/test-knowledge-reader.mjs: 134sourceRoot보존+실제동작회귀, package.json test:concept-reader등록.
- build.mjs에모듈import·bundle·134개상세wrapper/controls·css/js등록. reader CSS는knowledge-dark.css앞에두어darkstylesheet가마지막이라는기존scope계약을유지한다.
- home-visual.mjs: intro부근에 `개념부터 이해하기 →` 링크를넣어 docs/knowledge/README.html로직행. 기존첫API시작점/작업기록/미리보기/환경안내변경없음.
- knowledge-catalog-view.mjs: 각행의질문제목링크는기존문서(장면)로,행의보조읽기링크는같은문서`?read=1`,표시`설명 읽기 →`,aria문서ID+설명읽기로분명히구분. data-kc-open문서id 유지하여현재검색·분야·뒤로가기복귀를그대로쓴다.

## DOM·원문 보존

원본HTML을renderKnowledgePageSections로바꾸기전실제H2목록을확보한다. 기존134원문영역안에는추가목차/toolbar/안내문구를넣지않는다. 원문전체의text/code/oldid는 source-baseline.json의sourceSelector별해시와동일해야한다. 원문MDir/기존각page baseline은수정하지않는다.

visual출력전체는새 `[data-kr-scene]` 바깥wrapper로묶고,기존원문부분(원문outerdetails또는.knowledge-chapters가있는후반)은 `[data-kr-reading]` wrapper로만묶는다. aside는원문영역밖에서reading wrapper와같은grid부모안에둔다. 기존visual내부나#p09-original등내부/기존map.outerHTML을재작성하지않는다. 기존P09/P04/W09/P19의sourceH1을original로옮기는처리와P16숨긴sourceH1처리를보존한다.

원문H2id를가진summary/heading의href목차는실제target와1:1이다. 같은id를새목차에복제하지않는다. 신규id는knowledge-reader전용prefix로중복을피한다. metadataJSON을HTML에넣을때 `<`를unicodeescape해script종료문자열이들어가지않게한다. 외부Miri응답/그림/폰트/자산은제품에복제하지않는다.

## 사용자 동작

toolbar group `개념 읽는 방식`: `장면으로 보기`/`설명 차근차근 읽기` 두button의aria-pressed와aria-controls로활성상태를보인다. 뒤로링크는기존data-kc-catalog-return/data-kc-task-return계약을재사용한다. 기존return nav가중복되면새reader활성시에만CSS로이전중복nav를숨기되,새bar에도하던과제복귀anchor가살아있어야한다. initDetailsNavigation의querySelector/전체선택동작을실제읽어first-element충돌을피한다.

실제장면UI가있는페이지는처음scene, `read=1`이면read직행. 순수문서목차만있는페이지는처음부터read로열고scene선택을숨기거나비활성화한다. **원문지도만있는110개를새interactive장면이라고표시하지않는다.** scene capability는renderer의실제제공UI/현재DOM으로결정하되 단순nav만으로장면이있다고하지않는다. 예: J01 같은일반문서의기본read회귀가필요하다.

read에서는scene wrapper를숨기고,source outerdetails와핵심.knowledge-chapter/.knowledge-topic을연다. 핵심정의·조건·오류판단은보여야한다. 참고문헌/명시적선택심화는접고,자가점검Q&A는질문은보이며답이있는topic은접혀있게한다. nested details를무조건전부open하지않는다. source원문의Mermaid/표/코드는유지하고부수generated지도는중복목차라면reading mode에서CSS로숨길수있다.

read/scene을오가도기존P09등의선택topic/stage는재초기화하지않는다. own key `__javaExperienceKnowledgeReader` 및URL `read=1`을사용한다. history.replaceState에기존state를spread하고foreignkeys/query를보존한다. 읽기대상의hash진입(새로고침/외부원문링크)은read를열고ancestor를노출한다. malformed hash는throw하지않는다. scene으로돌아갈때는read query를지우고현재hash가읽기source를가리킬때만그hash를정리해새로고침이반대로read로돌아가지않게한다. popstate/hashchange를해석하되무한루프/중복init없음.

모드선택/목차이동후해당읽기제목/target로focus·scroll이동. PCstickyheader에가리지않도록약96px scroll-margin. 초점강조유지. heading/sourceid와URL/nativeback동작을깨지않는다. 제목은원문H1의첫 ` — ` 앞부분을짧은읽기H1로쓰고전체제목은보조텍스트로보존할수있다. readmode에서기존중복H1은CSS로숨겨보이는H1이하나가되게하고 DOM원본은삭제하지않는다.

## PC 배치

실제imagegen참조: docs/design/concept-ia-2026-10-24/reader-pc-dark-v1.jpg (native1672×941, JPG92). 프롬프트 reader-image-prompt.txt. main이미원본열람. 원문본문은시안의발췌와달리전체를보존하고섹션순서를건너뛰지않는다. 고정슬라이드캡처를본문으로붙이지않는다.

읽기영역은좌측목차약210~230px+간격28~32px+본문minmax(0,1fr),본문약74ch·17px/1.85. .knowledge-chapter/.knowledge-topic의여러겹roundcard를flatsection/소제목으로낮추고단락·표·코드를직접읽게한다. coreparagraph최대폭을지켜전체화면길이로한줄이늘어나지않는다. 표/코드만자체가로scroll,document넘침없음. 원문코드를줄이거나강제재포맷하지않는다.

scene은기존.p09-workspace 및실제같은의미workspace에만PC2열(그림왼쪽,값·코드오른쪽)로맞춰한시점의값/코드를한눈에읽게한다. 그림은전체/확대조작을유지하고래스터내용filter변조없음. 기존references특수표현/코드focus가망가지지않는다. 읽기모드레이아웃에는모바일갈래/생성물없음. 1280/1440/1672PC폭을지원한다.

## 테스트와 검토

- RED→GREEN 로그 taskB-luna-logs/. 새generatedreader등록없음/모드source닫힘/foreignstate유실/잘못된hash/정답자동노출 등실제결함을잡는계약테스트.
- 134개원문root normalized text/codeSHA/기존id 및sourceMdSHA는기존source-baseline.json과동일. home/목록진입도검사. baseline파일은고쳐통과시키지않는다.
- TaskA의pure-style당시mainTextSHA는역사기록으로보존한다. taskB는의도적으로새UI문구를추가하므로 theme test에서source원문불변검사를유지하면서**새UI까지불변으로동결한mainText전체검사만설계변경사유를주석/로그로기록해reader검사로대체**할수있다. 기존source/text/code/ids/bodyclass/scope/stylesheet등록검사는삭제·약화금지. home/목록의핵심보존은기존test:home/knowledge-catalog/navigation에서검사한다. CSS미러링테스트추가금지.
- fresh build, test:concept-dark, test:concept-reader, test:home, test:knowledge-catalog, test:navigation, 기존24하네스(main최종실행) 통과. 다른기존tests가새UI때문에깨지면원인을보고하고변경승인받은테스트만수정한다.
- freshSol spec→quality→mainPCdark:홈진입→목록(검색/분야)→장면/설명직행→목차→scene복귀stage보존→catalog복귀. 대표P09/S09/R03/W11/V04/J01의산문/표/코드가독성. wholepixel/학습자이해검증이나134개고유내용완성이라고쓰지않는다.
- src/원문/practice/scenario/proof/기존24review/baseline/AGENTS/RESUME보존. push/PR/merge없음,main검증뒤로컬commit.

## 실제 원문 형식 대응에 대한 제한적 추가 승인

- R03/R04등28문서는Q&A가H3가아닌 `<p><strong>Q1…</strong>…` 형태라기존knowledge-topic이없다. chapter전체를열면답이노출되므로이형식도질문summary/답접기로그룹화한다. **이QA그룹에만** 원문노드를재배치/새detailswrapper를추가하는구조변경을허용한다. 원문MD·기존baseline을수정하지않으며질문strong을복제하지않고summary로옮겨모든기존text순서·code·ID를보존한다. 새숫자/답보기라벨을원문root안에더해해시를바꾸지않는다. 가능하면빌드단계에서생성하여inventory가실제toggle을추적하게한다. 기존jsdomdevdependency는이미설치돼있으므로필요시서버전용renderer의제한된변환에쓸수있고기타원문을통째재직렬화하지않는다. 전후sourceText/CODE/id동등성의134문서검사를그대로통과해야한다.
- `.version-original`처럼원문표의선택형summary는계속사용가능해야한다. 숨기는summary는reading원문의**직계outer source-wrapper**로한정하고nested선택원문까지suffix매칭으로숨기지않는다.
- scene자체에H1이없는R03같은문서는toolbar문서제목을H1로노출할수있다. scene에이미H1이있으면toolbar는H2/문단으로두고,read시에는짧은readingH1만보이게한다. Source원래H1을삭제하거나기존ID를새제목에복제하지않는다.
