# 서비스 기능 통합 — 병렬 구현 인터페이스 v1

현재worktree /Users/ds/code/javaExperience/.worktrees/course-learning-integration, branch feat/course-learning-integration. 원본worktree는수정하지않는다. 기존개념26/134reader/legacy7functional/244기본sourceunits/기존과정135작업은이미현재workingtree에이식중이며마지막커밋e1124a46이후dirty보존. 사용자최종요구는모든작업의기능화/구체기획서/질문형힌트/실제API/진도보존이며대표과제만구현해완료처리금지. 구현gpt-6-luna/high,기획·검증main.

## 데이터 (main 소유, 구현자는 sample data를 production에 덮지 않는다)
service/catalog.json: {version:1,features:[{id,title,summary,difficulty,projects:[...],prerequisites:[...],preview:{kind,asset?},file:'features/id.json',status:'draft|authored'}]}
service/features/id.json:
{version:1,id,title,summary,difficulty,prerequisites:[],stages:[{id,title}],variants:[{id,project,label,stages:[
{id,title,sourceUnits:['course:D04-1',...],brief:{purpose:'',task:'',preconditions:[],scenario:[{start,action,result,after}],data:[{name,reason}],policies:[],inputs:[],success:[],failures:[{when,result,unchanged}],examples:[],work:[],done:[]},hints:['기능별 구체 질문?'],recipeIds:[],executionChecks:[{title,command,expected,record}],choices:[],concepts:[{label,href}],references:[{label,href}]}
]}]}
service/source-map.json: {units:[{sourceId,featureId,stageId,variantId,role:'primary|preparation|reference'}]}. main이전체소스를검토해작성한다.
service/api-contracts.json: {recipes:[...]} main이정확원본에따라작성. 각recipe {id,label,project,method,path,pathParams:{},query:{},headers:{},bodyKind:'none|json|text|multipart',body:null|object|string,expected:{statuses:[201],bodyMode:'empty|json|text|any',description,fields:[]},capture:{key:'postId',jsonPath:'id' OR locationPattern:'/api/posts/{postId}'},prepare:[],manualDb:[{title,sql,notes}],sourceRefs:[]}. capture는선언된자원id만허용하고토큰/비밀번호/전체응답은저장안함. 원본에없고학습자가정할API는recipe.method/path를발명하지않고 binding:{key,label,sourceId} 로명시.

## A 요청 도구 (소유 service-request-* 파일만)
renderServiceRequestTool({scopeKey,project,recipes,rootPrefix}) -> HTML string. root[data-srq-root], inline script[data-srq-data]. export from service-request-renderer.mjs.
mountServiceRequestTools(doc,{fetchImpl,storage,clipboard,now}={}) -> 명시적전송만. export service-request-client.mjs. service-request-model.mjs 순수빌더/예상부분검사/capture도우미. 기존course-api-contracts의normalizeApiBase 등안전도우미는재사용가능하되기존8계약변경금지.
지원: method/path/변수/query/headers/body편집,source사례선택,empty/json/text/multipartfile,정상/실패예상결과와실제HTTP상태/headers/rawbody/실측응답시간구분. 늦은응답은전송snapshot에묶고입력변경알림;프로젝트/서버/본문/토큰변경시이전생성ID를새상태에채택하지않음. 반환Location같은origin정확path검증,JSONid는safeinteger/decimalstring만. key별자원ID를project+server로분리sessionStorage;토큰/body/rawresponse 저장금지. 명시적수동id입력/이어쓰기도제공. 예상값/실제값구별,DB는수동SQL표시만. file://와CORS실패솔직히안내(http문서3000),실패를성공으로추정금지. status일치가전체기능채점아님. API가없는작업은executionChecks UI쪽에서실행기록,불필요API없음. 요청복사토큰포함명시+fallback. 필요계약미등록(binding)은편집가능한등록입력으로처리,원본에없던endpoint를default로넣지않음.

## B 화면 (소유 service-feature-* 파일만)
renderServiceCatalog({features,sourceIndex,apiRecipes,rootPrefix}) / renderServiceFeature({feature,apiRecipes,sourceIndex,rootPrefix}) -> HTML. exports service-feature-pages.mjs. 카드복제목록금지,query/difficulty/project filters+기능그룹/참고세부단계+APIExplorer method/search/project/collapse+기존anchor visual-catalog,journey-all-apis보존. API구조도anchor api-map-title은build가하단reference로별도보존.
상세는feature/variant/stage선택(기능단위),목적/실행조건/업무정책/입출력/정상실패/전후사례/개발과제/완료체크를기본노출. 클래스조립순서/정답code/DDL첫공개금지. hints는첫질문만버튼으로열고이전/다음,답입력gate없음. 요청도구는A함수import+doc mount호출. references모든URL보존. feature 완료는수동별도key javaexperience.service.progress.v1,일자/legacy진도key전혀수정/자동환산금지. hintopen은진도아님. 새계약선택은method/path/status/fieldnames 등비민감정의만저장,token/body저장금지.
브라우저entry service-feature-entry.mjs 가mountServiceFeaturePages+mountServiceRequestTools를호출하고build에서IIFE service-feature.bundle.js로bundle. CSS service-feature.css. query와hash로뒤로가기/초점복구,loading/no-JS시전체기획내용읽기가능. 원본단계가file부품이면mainstage로다시쪼개지않고references안에보임. PCdark+360pxoverflow검증대비. 전역header 변경은C담당.

## C source/빌드/메뉴 (소유 tools/service/*, build.mjs/site-navigation.mjs/package.json, generated-source-index.json)
public source generator는원본course/days,scenario/scenario.json+MD,functional sourceSpec,APIarchitecture실제localdata에서읽는다. private research JSON/다른worktree/Gitunsafe객체를빌드의존으로두지않는다. 원본ID244의누락/중복검사+추가DB/lab/Java/ticket참조수집. main소유JSON의의미내용을임의생성하지않음.
새authored JSON을scenario/features/id.md/HTML로생성(파일상단generated 표기). renderServiceFeature hook으로본문작성; 시나리오대표scenario/README는renderServiceCatalog사용. 기존journey-learning-nav/큰게시글API여정/architecture-panel DOM제거. APIExplorer/시안탐색과하단원본참고/구조도anchor보존. 원본course/spring/README는참고그대로열리고신규목록으로이동.
독립과정v2 topmenu삭제,course/*는서비스만들기선택(단course/map은과정지도). top:홈,과정지도,서비스만들기,실전미션,개념학습. primaryheader기하안정규칙보존. 기존일자/Java/티켓/SQL/채점/원본자료URL삭제금지. src/board-server코드변경금지.
기획서/힌트/API/정상실패/전수mapping 누락은audit:service에서실패시켜빈템플릿을완료로표시못하게. draft는작업중으로구분,최종검사에서authored 아닌244대응은실패. 개발도중maindata작성전에는새모듈문법검사/fixture로검증가능하나기존원본비우거나가짜완료값넣지않음.

## 이미지 방향
service catalog: /Users/ds/.codex/generated_images/01a14efd-0411-77a2-a0b6-d1feed331f45/exec-ef7935be-41a3-4b0c-9129-d542aea0ad19.png
feature planning: .../exec-1a82048e-c3d7-453f-b023-dff2e9b0170d.png
request+hints: .../exec-5ae0ac19-465f-41c9-bba4-2abfad20cec1.png
APIExplorer: .../exec-282eb0c4-85fd-443a-91c7-aebd46fca272.png
실제시안은외부에원본보존후JPG로별도등록한다. 행/폴더/뜻은mockup대로, API/데이터는source JSON만이정본(그림에있다는이유로사실채택금지). 색 #141619/#1d2025/#f3f4f6/#b6beca/#80b0ff/#005eff,body16/label14/44pxcontrols,max1280,행간1.7. nestedcardpile금지.
