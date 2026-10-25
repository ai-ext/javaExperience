# 개념 학습 별도 worktree 통합 안내

- 작업 위치: `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night`
- 브랜치: `docs/concept-learning-night`
- 원본 worktree: `LOCAL_HOME/code/javaExperience/.worktrees/visual-learning-next`
- 분기 기준: 원본의 HEAD `b9e3982`와 당시 추적·미추적 변경을 복사해 만든 로컬 기준 커밋 `aed347f`.
- 원본 파일 3,403개를 복제하고 SHA-256을 대조했다. 원본 status가 복사 전후 그대로인지도 확인했다. 원본 미커밋 작업을 임의로 커밋하거나 정리하지 않았다.
- `baseline.json`은 복사 당시 전체 파일 해시, `preservation-baseline.json`은 개념 원문과 학습자 서버 파일의 보존 기준이다.

## 나중에 통합할 범위

`aed347f`는 기존 홈·P16 등의 미커밋 작업을 포함하는 기반 스냅샷이다. 이 커밋 전체를 원본에 다시 적용하는 방식으로 중복 통합하지 않는다. 개념 작업 자체는 이 커밋 **이후**의 diff와 후속 커밋에서 확인한다.

```bash
git -C LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night diff aed347f
git -C LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night log --oneline aed347f..HEAD
```

기존 worktree가 이후 바뀌면 같은 빌드 진입점·시각 목록 파일에서 충돌할 수 있다. worktree 분리는 작업 중 덮어쓰기를 막으며, 후속 통합 충돌이 없음을 보장하지 않는다. P09는 별도의 데이터·renderer·controller·CSS·classic bundle로 분리해 공통 카탈로그 번들의 재생성을 피했다. 초기 이미지 생성은 새 ChatGPT 대화 `https://chatgpt.com/c/6ad632f9-7120-83e8-a4aa-faf4b15cbccd`에서 진행했고, 후속 보완은 built-in image_gen을 사용했다.

## 현재 검사 범위

P09/P04와 P16/W09/P19/P20/S09/S08/W11 보강의 원문·실행·시안·상태 대응은 각각의 design 폴더와 `concept-queue.json`에 있다. 아래 경로는 첫 checkpoint의 예다.

P09의 원문·실행·시안·상태 대응은 `LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/p09-2026-10-20/`에 기록한다. 새로 생성한 이미지와 실제 구현을 구별하며, 실제 화면/모바일/조작 증거가 부족하면 verified로 올리지 않는다. 134개 개념 문서는 `concept-queue.json`에 원문 해시와 이번 실행에서의 읽기 상태를 구분했다. 목록 등록은 개별 문서 구현 완료가 아니다.

사용자가 나중에 통합하겠다고 요청했으므로 이 작업은 로컬에 보관하며 자동 merge·push·PR 생성은 하지 않는다.

## 로컬 checkpoint 구분

- P09 `66e657f`: Java 문법 학습 화면과 source/runtime/browser 근거.
- P04 `af88b1b`: 객체 생성·Builder·생성자 주입.
- P16 `3acd6a6`: JSON 계약 보강. 전체 원문 장면 완료는 아님.
- W09 `1659b0c`: DTO·Session·조회 계획 보강. 전체 원문 장면 완료는 아님.
- P19 `4206494`: 연결 설정·의존성·Hikari·타입 보강. MySQL/Docker 실행은 없음.
- P20 `7ad3a7c`: 엔티티·IDENTITY·관찰 시점·orphan·DTO 보강. 원문 compile 실패와 별도 한 식 DTO 교정 H2 실험을 구분한다. 이전 다섯 페이지의 앵커 history 회귀 수정은 별도 후속 checkpoint이며 `concept-history-2026-10-20/VERIFICATION.md`에 근거가 있다.

부분 보강과 모든 원문 장면의 완료를 구분한다. 전체 134개는 계속 진행 중이며 세부 제한은 각 VERIFICATION.md와 queue가 기준이다. 공통 build.mjs/package.json/inventory/parity에 접점이 있으므로 필요한 후속 커밋을 순서대로 검토한다. 통합 시점에는 원본 worktree의 최신 파일과 다시 대조한다.

- S09 `db28b8e`: JPA 상태·loadedState·SQL/commit·조회·낙관적 락·AUTO·페이지 제한 관측9질문31상태. 원문4파일과추가ProbePost/61검사를구분한다. Spring프록시·MySQL·HTTP는미실행이며pagination원인/수정버전미확인. 개념전용부분보강이다.

- S08 `efa703e`: 원문3블록+추가SpringJDBC42관측/10질문30상태. 추가저장소/원문서비스·관찰시점·callback/resource/service반환을구별한다. Boot/JPA/MySQL/HTTP/broker/outbox는미실행이다. 공통build의S09HTML부수변경은추가rawJSON키순서동기화뿐이며논리값/나머지DOM은동일하다.

- W11 후속checkpoint: 원문5블록동명대안을별도B/CJVM으로실행한31관측/6질문19상태. sourceSQL/바인딩/writer·별도observer·사건순서를구분한다. Controller는Java proxy호출이며HTTP/MVC미실행,Risk는메모리stub,원문C리스너는empty라추가subclass관측과실제알림을구분한다.

R03 checkpoint: native MySQL8.4.11 private datadir/socket로 원문SQL2-5·외부학습schema사본·추가probe35관측/9질문30상태/9선택PNG/Chrome60/원문12848/code5/id13/map보존. 부분구현이며 자세한근거는 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/r03-2026-10-20/VERIFICATION.md . 생성HTML·공유build분기·inventory와parity를함께통합한다. native바이너리/실제datadir는연구폴더에만있어커밋대상이아니다.

R04 checkpoint: 원문SQL7·Java1보존/nativeMySQL8.4.11/Python41+JDK21JDBC8검사·독립재현/10질문34상태/10선택PNG/Chrome68/20cap/원문12933-code12-id14-map1. 부분구현이고 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/r04-2026-10-20/VERIFICATION.md 에조건·한계를기록했다. 원문설정실행과추가standaloneJDBC를구분하며관련build조건/registry/HTML/inventory/parity를함께통합한다. 기존서버·practice데이터·학습자코드는변경하지않았다.

W15 checkpoint: 원문SQL3·Java2를추가Article가정/privateMySQL8.4.11/DataJPACommons4.1.1에서실행한native18+Java25고유ASSERT43, 독립frozen재현/9질문25상태/9선택PNG/Chrome50·18cap·특수10·기존2. 부분보강이며 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/w15-2026-10-20/VERIFICATION.md 에조건·한계·원문보존과indexiterator/실제JDBC/커서·snapshot·toy token범위를기록했다. 원문Article가정을추가구현한것과학습자서버수정을구분한다. build/새module/bundle/생성HTML/inventory/parity를함께통합한다. native실제datadir·바이너리는Git에없다. 이후V04초기미추적파일은별도진행이다.

## V04 로컬 체크포인트

테스트 DB 개념 보충10질문27상태를추가했다. 원문TCclass는compile-only이고외부unit2·nativeadapter·추가H2/Boot실제TCP/동기MockMvc를구분한다. 원문135/학습자서버17/기존worktree3403 SHA보존. 최종build16suite3auditgreen. 상세 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/v04-2026-10-20/VERIFICATION.md . 전체goal/134문서는미완료이며merge/push/PR없다. 기존baseline aed347f를통째cherry-pick하지말고각개념checkpoint와공유build/inventory의연결을대조한다.

## B01 로컬 체크포인트

계정생명주기10질문27상태·선택10PNG/31실제생성·Java10/Redis9/MySQL14 고유33관측·메인/독립전체frozen일치·Chrome54관찰20캡처를기록했다. source301/7fence보존, 실제인증API/발송/JWT/session연동은미실행이다. build17suite3auditgreen/135원문17서버3403원본SHA보존. 상세 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/b01-2026-10-20/VERIFICATION.md . UI코드/CSS/bundle/build/package·HTML/inventory/parity를함께검토한다. datadir권한설명정정으로V04supplement/HTML1문단과W15/V04설계README/VERIFICATION의문구만함께바뀌었다. native원문/권한/frozen/학습자서버변경은없다. 이로써134중14문서의범위별구현기록이있지만전체완료가아니며사용자의후속통합을기다린다. merge/push/PR없다.


## D01 로컬 체크포인트

개발 생명주기10질문25상태·선정10PNG/19실제생성·추가privateGit/plainJava21/Gradle9.8.0·11관찰3모델/독립frozen동일·Chrome50관찰20캡처다. 원문277줄9fence와code6/Mermaid3/id16/map1을보존했다. 실제PR·CI·registry·DB·운영배포·장애는미실행이다. 관련18suite/3auditgreen/원문135서버17원본3403SHA보존. 상세 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d01-2026-10-20/VERIFICATION.md . UI5파일·supplement·bundle/sharedbuild/package/inventory/parity·생성HTML을함께검토한다.134중15문서범위별기록/전체goalactive이며mergepushPR없다.


## D02 로컬 체크포인트

서버·네트워크10질문27상태/선정10PNG·13실제생성/원문Java그대로추가Java21Boot실제TCP·추가UDPtoy/TLS/Pythonproxy17관찰3모델/독립frozen동일·Chrome54관찰20캡처다. 원문304줄9fence/code6/Mermaid3/id23/map1과135문서17서버3403원본SHA보존. build19suite/3auditgreen. 상세 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d02-2026-10-20/VERIFICATION.md . UI5파일/supplement/bundle/sharedbuild/package/HTML/inventory/parity를함께검토한다. 실제Java25/8080/운영DNS/Nginx/방화벽·NAT/외부경로/QUIC은미실행.134중16개범위별기록/전체goalactive이며mergepushPR없다.


## JPG 전환 로컬 체크포인트

개념관련419JPG변환/363작업PNG제거·공유56PNG보존/419원본GitblobSHA복구확인. 대상자산729618982→218668480bytes(70.03%감소,전체저장소아님). registry16선정182/HTML96JPG참조/419HTTP HEAD와desktop·mobile32표본/25suite3auditgreen. parity629중239mockup참조만formatMigration갱신하고verified0유지. 원문135/서버17불변. 원본worktree의별도메모·공개제외5파일변경과rootAGENTS.md변경은별도보존하고이번커밋에서제외한다. 상세 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/jpg-2026-10-20/VERIFICATION.md . 과거PNG관찰과현재JPG관찰을구분해통합한다. D03미완료별도진행/mergepushPR없음.


## D03 로컬 체크포인트

REST API10질문27상태/원문332줄6fence/완전Java그대로추가Java21Boot4.1.1FW7.0.9Tomcat11.0.24/springdoc3.1.1·60deps4fixture/18HTTP19CHECK3models mainfresh·독립전체frozen일치. 실제201vs문서200·NotBlankvsminLength1·메모리재시작경계를드러냈고원문수정으로숨기지않았다.24실제imagegen중10선정JPG·14draft/현재정확viewport54관찰20cap/특수10·기존2/nativecopy287blank1/pan22.5/사이트console0. 첫잘못된viewport54/20은실패내용보존·최초독립리뷰와archivebyte동일미확인한계명시. 26suite3auditgreen/원문135서버17불변. parity629prefix+10=639verified0/inventory44816implemented570기존verified6. 상세 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d03-2026-10-20/VERIFICATION.md . 원본/root의별도AGENTS·공개제외변경은보존/이번커밋제외. 전체134중17개범위별기록이며전체goal미완료·mergepushPR없다.

## D04 로컬 체크포인트

빌드 개념11질문29상태·선정11JPG/27생성·추가Java21Gradle9.8Boot4.1.1의21CHECK3모델/메인·독립frozen일치다. 원문Java25설정은미실행/byte보존했다. exactviewport58관찰22cap/특수10legacy2/원문135서버17보존. build339/27suite와필수감사·독립캡처결과는 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d04-2026-10-21/VERIFICATION.md 를기준으로한다. UI7모듈·bundle·공유build/package/inventory/parity·생성HTML을함께검토한다. parity650verified0/inventory44871implemented599기존verified6. 외부AGENTS메모는이번커밋에서제외한다.134중18범위별기록/전체goal미완료이며mergepushPR없다.

## D05 로컬 체크포인트

디버깅개념11질문30상태·선정11JPG/23imagegen·원문Java/properties보존·추가Java21Boot4.1.1의23CHECK3모델/메인·독립frozen일치다. SourceProbe/Resource/DebugTarget/ThreadTarget·직접JUnit/tempGit은별도예시로표시했다. 실제before/afterviewport60행22cap·특수10legacy2·원문135서버17보존/build339/28suite3audit통과. 상세 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d05-2026-10-21/VERIFICATION.md . UI7모듈/bundle·sharedbuild/package/inventory/parity/생성HTML을함께검토한다. parity661verified0/inventory44938implemented629기존verified6. 외부AGENTS메모는이번커밋제외/134중19범위별기록·전체goal미완료/mergepushPR없다.

## D06 로컬 체크포인트

배포개념12질문30상태·선정13JPG/27imagegen·추가Java21Boot4.1.1/ownrouter/별도H2의20CHECK3모델은메인·독립전체frozen과일치한다. 원문Java앱없음/Java25미실행/GroovyYAML보존·50해석파일8fixture·각JAR42nestedlib·A/B/동일A사본/feature/profile·Bhealth와Areadiness·종료143/단발SchemaProof0를구분했다. actualbeforeafterviewport60행26cap·특수10legacy2·29suite/3audit통과. 원문135·서버17·원본3398동일+외부5변경보존/AGENTS외부메모stage제외. 상세 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d06-2026-10-21/VERIFICATION.md . 실제LB/Kubernetes/systemd/registry/cloud/운영배포·원문전체장면·전수pixel·학습자검증은없다. 전체134개념중20번째부분기록이며merge/push/PR없이별도worktree로계속한다. 처음스냅샷커밋을통째로통합하지않는기존원칙을유지한다.


## D07 로컬 체크포인트

D07 서버배치·책임13질문36상태(native8/model28)·원문300줄8fence Java/Dockerfile byte보존·추가Java21Boot4.1.1/Gradle9.8의10CHECK6모델 mainfresh/독립wholefrozenmatch·39deps4fixture/JAR34nested19,902,934bytes·sameMac2ownHTTPJVM4응답/143cleanup. 실제35imagegen선정13JPG92/draft22·13독립미해결0;Chrome72초기/74postdtwrap(2recapture+72전체)/26대표cap·특수10legacy2·live13022code4id24map1Mermaid4·consolewindow0. build339/link0/30suite·3audit0·parity674prefixbyte+13=687verified0/inventory45066implemented695기존verified6(기존45001모두동일/추가65중state36만implemented). 원문135서버17/원본3398동일+외부5변경/rootAGENTSmemo보존stage제외. 직접LunaOpenAIaccess/research성공,rawREPORTdefaultconfig접근추정오류는메인정정/용량실패없음/LiteLLMfallback없음. 상세 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d07-2026-10-21/VERIFICATION.md . 실제25/Docker/VM/cloud/AZ/LBfailover/가격/전체장면·전수pixel·learner미검증. 134중21번째부분기록/전체goalactive미완료/mergepushPR없음. UI7모듈/bundle/sharedbuild/package/inventory/parity/생성HTML을함께검토하며최초snapshot전체를통째통합하지않는다.


## D08 로컬 체크포인트

D08 CI/CD·협업14질문40상태(native15/modelJSON21/unrun4)·원문319줄8fence보존/추가privateGit6remote0·Java21Corretto/Gradle9.8Boot4.1.1JUnit6.0.3/native22CHECK6모델 메인새run·독립전체frozen일치. ungatedbadfail1인데bootJar先/JAR9102149→명시dependsOngatedbadfail1nojar→fixed1testpass/exit0/JAR9102150SHAcb98ccd...·runtime21/test29union29/nested20/fixture12. actual30imagegen선정14JPG92·16draft/선정bytes7,934,384vsPNG25,211,776·모두1672x941/독립14검수0. Chrome80행/100parsedruns/28대표cap·copy121blank2(중간1+끝newline1)/pan37·특수10legacy2·live12776code5id16map1Mermaid3/consolewindow0. build339link0/31suite3audit통과/parity687prefixbyte+14=701verified0/inventory45154implemented735기존verified6(old45066불변/추가88중40state만implemented). 원문135서버17/SHA·원본3398동일+외부5변경/rootAGENTSmemo보존stage제외. 직접LunaOpenAIaccess/research0/completedweb4·메인26primary확인/raw보고서현재버전누락정정;ArgoabsenceMinor별도clarification해소/frozen미수정. 상세 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d08-2026-10-21/VERIFICATION.md . 로컬commit직전·캡처독립28전수actualview/80행100runs검수미해결0/134중22번째부분기록·전체goalactive미완료/mergepushPR없음. UI7/bundle·공유build/package/inventory/parity·D08HTML접점을함께대조한다.


## D09 로컬 부분 체크포인트

D09 운영·관측14질문39상태(native17/model19/unrun3)·원문309/9 SHA보존·추가Python3.14.3/Prom3.15.0arm64/SQLite3.53.0/fixture4/native22CHECK6모델 mainfresh·독립wholefrozen일치. 업무4/valid3/business1/validHTTP2002·counter1/2/1·actualup1→0→1/newcounter0/TSDB과거보존·SQLite source2/snapshot1/restored1원본보존·명시10000Decimal과벡터측정아님. 자체3PIDexit0/2portclosed. directLunaOpenAIresearch0/completedweb13·main24primary정정/LiteLLM없음. actual29imagegen/main29view/선정14JPG92·15draft·독립Important3교정후0·bytes7404789vsPNG24568451/countersv2만1671x941나머지1672x941. Chrome78행96parsedruns28대표cap·originalv4뒤6재대조·copy183blank끝개행/pan21.5/특수10/live12690code5id22map1SVG4·currentextension114own0. build339/link0/32suite3audit0·parity701prefixbyte+14=715verified0/inventory45233implemented774기존verified6unreviewed44453/old45154byte그대로. 원문135서버17·source/fixture/frozen/JPG/capsSHA불변·원본3398동일+외부5/rootAGENTSmemo보존stage제외. capture독립최종검토진행중/로컬commit직전. 상세 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d09-2026-10-21/VERIFICATION.md . 134중23번째부분기록/전체goalactive미완료/mergepushPR없음. UI7/bundle·shared4·D09HTML·inventory/parity접점을함께대조한다. 초기dirtybase/privatecapturehistory직접통합금지는기존통합메모를따른다.

D09 최종독립검토확정: 선정14이미지CIM0·캡처28전수actualview/SHA·78Chrome행96parsedruns/39case·UI7정적대조새CIM0. 원문wrapperID21+외부H1ID1=22구분. 원본source/native/frozen/JPG미수정·추가공백은optional빈문구template한줄만제거,생성HTML/관련test3audit재통과. 701기존parityprefixbyte보존/신규14만capture-review근거연결. 현재로컬커밋직전/전체goalactive미완료.


D10 부분 보강 · 2026-10-21: 원문449줄13block·135문서17서버 SHA 보존. 15질문44상태(native22/model18/unrun4), 추가Python3.14.3/SQLite3.53.0 native27CHECK6미실행모델의 메인fresh/이전독립 wholefrozen 일치. 실제31imagegen 중 메인31열람/선정15JPG92(9005205bytes vs PNG27550090), 기술 오류 재생성 교정. Chrome88행100fullruns, 최종30대표캡처 메인전수열람·DOM일치(desktop1672x819/mobile360x800), 원문16138/code9/id16/map1/SVG4, copy189빈줄끝개행/pan6.5/history 각entry복원. 중간90캡처 외부archive. 원문PG18/MySQL8.4/Java25/JDBC·운영부하/wholepixel/learner 미검증. 기존32회귀exit0; 최종build/D10/3audit는 D10 checks/final-command-results.json의 실제 결과를 따른다. inventory45324/implemented818/기존verified6/unreviewed44500; 기존45233행 bytes보존. parity715prefix보존+15=730/verified0. 134중24번째부분기록/나머지110queued/전체미완료. 최신사용자지시에 따라 설계·핵심구현·기술검증메인, Luna는기계작업. 로컬commit준비/mergepushPR없음. 근거 LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night/docs/design/d10-2026-10-21/VERIFICATION.md .

D10 최종 검사: build339/link0·test:d10·기존32회귀·3audit 모두exit0. main source135/server17/원본3398+외부5 보존 재확인. 현재 로컬커밋 직전이며 실제commit해시는 다음 기록을 따른다.
