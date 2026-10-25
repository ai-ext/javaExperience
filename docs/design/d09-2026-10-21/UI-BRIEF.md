# D09 개념 학습 UI 계약

원문309줄/9fence(Mermaid4/YAML2/bash3), 기존지도/id22/code5, 원문135·서버17은 보존한다. 신규 D09 namespace만 추가한다. 핵심 질문·현재값·짧은코드·sourceNote·관찰 경계는 기본노출, 전체원문/로그/JSON만 접는다. actual imagegen 14개 시안을 제작하고 메인 검수 후 native-resolution JPG92 ready로 올린다. 이미지가 없거나 검수전이면 ready=false; 임의 PNG/SVG 대체 금지.

source-proof/execution.json22 native CHECK/6 models, source-proof/fixture4와 run-proof.py frozen, 원문 original9를 정확한 코드·values·runs 근거로 사용한다. 현재 지정된14topic/39state: native17, model19, unrun-source3. native CHECK22는 독립22실험이나39전체PASS가 아니다.

|topic/image|stage IDs|연결 내용·경계|
|---|---|---|
|business|business-success,business-httpfail,business-badpayload,business-invalid|추가 toy GET 네 case, status200/500/200/400, validT/T/T/F, businessOK T/F/F/F, outcome success/failure/failure/excluded. 각 고유 실제 CHECK. invalid제외는 toy정의이며모든4xx아님. native4|
|counters|counters-outcomes,counters-denominator,counters-query|native outcomes1/2/1→valid3/business1/HTTP2002→actualPromquery6counter. /metrics반복조회는업무건수불변,4업무와전체HTTP분모구분. native3|
|scrape|scrape-running,scrape-stopped,scrape-restarted|actualup1업무실패2→ownexporterstop/up0→sameport/newPID/up1,선택6counter0. TSDB과거이력남음. up0일반원인vs이번stop한정. native3|
|logs|logs-correlate,logs-trace|실제4JSON사건/응답requestID와필드일치→ID상관과span/context/export/storage/inspection구분. native1/model1|
|sli|sli-definition,sli-budget,sli-time|미실행SLI/SLO/SLA/기간/분모0모델→명시10000/9980/20/99.9% allowed10/remain-10/burn2→30일43.2분시간기준만. model1/native2. 4업무실측과샘플계산분리|
|percentile|percentile-vector,percentile-histogram|명시벡터10/20/30/40/50nearest-rankp50rank3value30/p95rank5value50,실제단위없음→classiclinear/nativeexponential구간보간·ratefirstaggregate미실행모델. native1/model1|
|backup|backup-snapshot,backup-later,backup-restored|새SQLite커밋seed1→source2/snapshot1→restored1/원본2보존/3integrityok/연결closed. 데이터toy≠실제RPO/RTO·서비스복구. native3|
|signals|signals-logs,signals-metrics,signals-traces|문헌모델3질문/수집저장/PromPULL/trace각단계. 3종만전체관측이라고하지않음. model3|
|labels|labels-bounded,labels-unbounded|미실행labels모델에서boundedoutcome·Promjob/instance별도vsrequestID폭증가능성. 조합계산≠실제seriescount. model2|
|alerts|alerts-signals,alerts-burn,alerts-no-data|goldensignals/실행가능사용자영향경보/조기자원위험경고도가능→빠른/긴windowburn→lowtraffic/no-data명시정책. 실제alert/page없음. model3|
|incident|incident-detect,incident-mitigate,incident-review|선언영향/역할→원인확정전완화와사용자회복확인→blameless/owner/deadline/검증action. 전부미실행. model3|
|capacity|capacity-scale,capacity-hpa,capacity-cache|up/out/state·병목→15s는설정가능loopdefault,기동/warmup완료아님→cachekey/TTL/invalidation/stampede/CDNminTTL>0override조건. 미실행model3|
|recovery|recovery-rpo,recovery-rto|허용데이터손실기간목표vs서비스복구목표·5m/2h원문목표·백업데이터/앱/key/dependency/사용가능확인,replication≠역사백업. model2|
|original|original-prometheus,original-compose,original-commands|원문block05Promconfig,block06Compose,block07~09bash의실제발췌. Java25/S16Actuatorprereq/hostdocker8080/15s,9090/3000/Grafanainternalprometheus:9090/latestunrun. 추가Python/metrics·1s/500ms·ephemeral별도. unrun-source3|

native stage: codeKind='native-fixture' 등 기존 controller가 지원하는 형태로 실제fixture/run-proof.py의 정확한 연속 substring/codePath(출처 file) 명시; model: codeKind='model-json'과frozenmodels실제 projection; 원문: codeKind='unrun-source'/실제원문block. active는설명위치이며실시간실행줄아님. 모든 code는원본빈줄/마지막개행보존. checks는실제native연관ID만, model/unrun []/PASS부모숨김. runKeys는fullfrozen실제경로. 각state기본노출values는해당fact/model에서재현가능하게짧게표시. snippet의전후새코드창작금지. fullfrozenRUNS JSON을bundle에포함하되원자료 timestamp/port/PID는RUNS가아닌supplement raw에둔다.

p04 새파일7개만작성: tools/site/d09-lesson-data.mjs,d09-learning.mjs/js/css,d09-supplement.mjs,test-d09-learning.mjs,test-d09-generated.mjs. main shared4(build.mjs/package.json/inventory-visual-work.mjs/preview-server.py)와별도bundle생성/메타데이터/이미지담당. D08컨트롤러의dtwrap·mobile끝focus·manualzoom/history외부fields·원본근거접힘·copyblank유지. ASSETS initiallyfalse/{file:id.jpg,width1672,height941,alt정확};각stagefocus는메인실제시안view후교체하므로임시합리적bbox만. 원문/sourceproof/frozen/이미지직접수정금지.

supplement: original309전체/9blocks/fixture4/runner/frozen/models6/runtime/Promartifact/원연구+main24primary정정/모델검토/authorfresh/mainfresh/indep근거긴raw보존. labels/counters/원문Java25를별개로분리한설명기본노출. 실제기동Python3.14.3/SQLite3.53.0/Prom3.15.0binarySHAedfbcf... vs archive920df... 구분. corecodevalues·native17/model19/unrun3/codeexact/selectedquery6/4업무vsHTTP/TSDBhistory/RPO/RTO기술회귀검사. generated검사는메인등록+이미지readytrue+build이후. 미실행모델을PASS나실제운영시간·측정rate/latency로표시하지않는다.
