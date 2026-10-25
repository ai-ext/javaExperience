# D11 PC 다크 학습 장면 명세

메인 원문314줄 전문 대조. 연구 근거는 /Users/ds/research/javaexperience-d11-web-security-20261024/REPORT.md, CLAIM-MAP.json, SCENE-PLAN.md 및 _data/main-primary-verification.json이다. 원문 보존 SHA와 범위는 PLAN.md를 따른다. 다음 상태는 설계 계약이며 실행 로그가 생기기 전 관측값으로 게시하지 않는다.

## 학습 계약과 제품 구조

학습자는 주문1002/1003 한 쌍을 보며 로그인 주체7이 다른 소유자8의 주문을 요청할 때 서버가 무엇을 검사해야 하는지 설명한다. 이어 브라우저 전송·응답읽기·서버권한을 분리한다. SQL 값과 문법, 출력 문맥, 운영 자격 증명을 같은 경계 관점에서 판단한다. 처음에 전 보안 체크리스트나 성공률 대시보드를 보여 주지 않는다.

기존24의 선택기/시안/현재값/짧은 설명/코드/증거/원문 패턴을 재사용하되 D11전용 데이터·controller·stylesheet만 추가한다. 공통 reader는 이미 구현된것을 사용한다. 제목/질문/현재값은 선택·복사 가능한 DOM이다. 핵심판단과 짧은 코드가 접힌 영역 안에만 있으면 실패다. 긴 raw·전체fixture·참고만 details에 둔다. 원문 전체는 #d11-original에 보존하며 모든 기존ID/본문/코드·문서MD는 유지한다. 설명읽기/장면전환과 복귀query·초점은 공통계약을 따른다. PC 1280/1440/1672, 다크만 수용한다.

각 상태는 `evidenceKind`를 가진다. 추가 실행(Java/Python/SQLite/브라우저)과 공식 원칙에 기초한 설명 모델을 다른 문구로 보여 준다. 값이 실제인지 설명용인지 근거링크와 함께 기본노출한다. 이미지생성은 사실증거가 아니다. HTTP status는 fixture가 명시한 경우에만 그 fixture관측으로 표시한다.

## 질문12개 · 상태38개

| 질문ID | 질문과 상태ID | 핵심값/행동 | 원문범위 |
|---|---|---|---|
| request-boundaries | boundary-identity, boundary-owner, boundary-output | 주체확정→객체권한→출력. 각단계의 통과는 다른단계 보장을 하지 않음. 설명모델, 처리순서는 앱마다다름 | §1·§2 |
| object-ownership | own-order, other-unscoped, other-scoped, uuid-scoped | 주체7,1002owner7/1003owner8. 잘못된 ID-only 조회1003는8의행, 소유권predicate는빈결과. UUID값도같은owner조건필요 | §3.2·§4.1·오해1/5·Q1/4 |
| principal-mapping | numeric-name, textual-name | name='7'은추가fixture매핑전제에서7, name='alice@example.test'는숫자변환 불가. 내부ID7을검증된별도매핑으로찾는다는설명. email은가짜값 | §4.1 |
| cors-requests | simple-blocked-read, preflight-denied, preflight-allowed, credential-wildcard | simple POST수신/JSread거부; denied OPTIONS수신/POST없음; allowed OPTIONS→POST/read성공; credentials+* read거부. 각케이스 서버수신과JS결과를분리 | §3.1·§4.3·오해2·Q2 |
| csrf-credentials | cookie-automatic, bearer-explicit, cookie-token | 브라우저자동cookie vs JS명시Authorization, 토큰을cookie에두면다시자동전송고려. SameSite/CORS/CSRF는별도축. 정책비교모델, 실제cross-siteCSRF재현표현금지 | §3.4·Q2 |
| sql-boundary | value-concat, value-bound, sort-allowed, sort-rejected | 가짜문자열검색입력으로 SQL문법합성vs바인딩 결과비교. 정렬필드는정해진맵('createdAt'→created_at 등)만허용. 거부는DB실행전, 숫자/입력검증과독립 | §3.3·Q3 |
| output-context | output-text, output-markup, context-policy | 공격코드없는'<b>주문1002</b>'를 textContent로는그대로문자, innerHTML로는B노드. 실행코드없는DOM parsing관찰만. HTML본문과URL/JScontext인코딩차이·CSP보조는공식모델 | §3.3·오해3 |
| security-config | chain-rules, endpoint-missing, version-pinned | 원문체인에authz/csrf/headers만있음, permitAll은endpoint생성아님, 인증방식/UserDetailsService는별도. 미실행소스분석, HTTPstatus없음. 원문4.1.1과현재공식live4.1.2를확인일과구분 | §4.2·§4.4 |
| hsts-boundary | hsts-unseen, hsts-remembered, hsts-subdomains | 신뢰HTTPS로정책받기전/후개념, 최초방문공백·유효인증서필수·IP제외·subdomain운영범위. 설명모델, 실제HSTSstate/trust수정없음 | §3.1·오해6·Q6 |
| password-verification | password-store, password-check, password-rehash | 가짜비밀번호를예시로salt/cost/hashmetadata와검증, 재해시계기. 알고리즘권장수치/성능수치를만들지않음. model이면실측처럼시간출력없음 | §3.5·오해4·Q5 |
| secret-log-lifecycle | secret-injected, secret-exposed, secret-revoked | 합성키DEMO_ONLY_NOT_A_SECRET만사용. 주입→노출시폐기/회전→사용처감사/로그마스킹. Git문자삭제로자격취소아님, 실제비밀/환경출력금지 | §3.5·오해7 |
| dependency-response | sbom-inventory, sca-assessment, rebuild-verify | 가상component A→B전이관계, inventory와취약성판정분리, 실제배포물영향/공식공지/patch/예외만료/재빌드검증순서. 실제CVE/현재취약점수치생성금지 | §3.5·§4.4·오해8·Q7 |

38상태는 이명세의 독립UI계약이며 공식원칙과 추가관측이 섞여있다. 모든state를실험결과로부르지 않는다. 용어사전24개와원문Q&A7은 공통reader원문으로모두보존·접근하고, 질문12개에서해당원문으로짧게연결한다. 개별사전모든단어에별도시안이생겼다는주장금지.

## 격리 증거 제작 계약

### SQLite/순수함수

source-proof/의 새Python파일이 tempfile DB(또는:memory:)를만들고 orders(id,owner_id,title,created_at)에1002/7/'내주문'/1,1003/8/'다른주문'/2 합성행만넣는다. ID-only/owner-scoped/UUIDalias+owner조건 각각SQL·bind값·result를 JSON으로기록한다. 실제MySQL/JPA/HTTP상태로일반화하지않는다. SQLinjection예시는owner조건을사용자입력문법으로우회시키는대량악성payload대신 합성title검색에서 quote-bearing입력을이어붙이면검색범위가바뀌는격리원리실험으로한정한다. 정상바인딩과allowlist정렬의허용·거부를관측한다. 실제nativePythonversion/SQLiteversion/sourceSHA/argv/stdout/stderr기록. 고정expected와actual구분, raw를테스트맞추려고변경금지.

### 브라우저/CORS와안전한DOM

기존8765/8766/8769서비스는건드리지않는다. 자기소유의새loopback두포트(사용가능확인후bind127.0.0.1)에서만fixture를시작한다. 첫서버는명확히이름붙인버튼4개/결과pre와무공격DOMtext/markup버튼을제공하고, 둘째API는case별OPTIONS·POST수신장부와합성응답만제공한다. 브라우저동작은 CUA를통해버튼클릭·DOM관측·network카운터 확인한다. 외부request/기존cookie조회/인증정보/실제서비스호출 없음. 필요cookie는전용합성d11_fixture_session만, 두포트는cross-origin이지만same-site임을라벨링한다.

1 simple case: no specialheader, text/plain POST, ACAO없음. 서버POST수신1/JSresponse미공개를따로기록.
2 denied preflight: application/json 또는X-D11-Probe, OPTIONS응답ACAO허용없음. OPTIONS1/POST0/JS거부.
3 allowed preflight:정확한Origin+허용메서드/헤더, 캐시회피고유caseURL. OPTIONS1/POST1/JSread성공. HTTPstatus/body는실제응답에서관측.
4 wildcardcredential: `credentials:include`, ACAO*응답. 쿠키존재여부는합성cookie이름의boolean만기록하고값/기존cookie를로그하지않는다. 요청수신과JSread거부를구분.
안전한DOMsample은'<b>주문1002</b>'뿐이고script/eventhandler/외부URL없음. child tag/B노드 개수·textContent/innerHTML 직렬화DOM을한국어기록한다. 삽입script가자동실행된다고쓰지않는다. 실행후소유HTTPprocess만정상종료. 신뢰store·인증서경고우회·보안설정변경없음.

### 미실행 모델

원문SpringSecurity전체체인/Boot4.1.1/Java25 HTTP·HSTS브라우저상태·passwordhash성능·실제secret회전·실제SCA/CVE검색은별도실행전까지모델/원문미실행표기를유지한다. 추가fixture는원문코드실행이라고부르지않는다.

## 시안·구현·회귀 수용 기준

12질문각각독립수평시안. 각시안은한질문의2~4상태만읽을수있게배치하고다른질문을작게구겨넣지않는다. 기준시안확정후같은재질/팔레트참조로다음이미지를만든다. 선택이미지JPG92/native치수/수정내역/출처/메인판독을기록한다. 숫자나결과가틀리면draft이며제품등록불가. 정확코드/라벨DOM을함께제공한다.

모든38상태의JSDOM선택·값·코드·활성줄·이미지·source/evidenceURL·history·동일현재코드copy·disabled/keyboard/zoom계약을검사한다. 문자열값을훼손하는공백정규화금지. sourceFragments는실제소스순서/내용과대조한다. 기존readercontroller반복초기화/foreignquery보존/장면간복사늦은응답/A→B→A/역순copy resolve/reject/fallback을회귀검사한다. 실제OSclipboard순서보장의검증으로확대하지않는다.

독립Sol이사양검토를먼저통과한뒤별도quality검토를진행한다. 메인은PC다크38상태를실제전환하고복사·원문·reader·확대·폭1280/1440/1672를확인한다. build/audit3/기존24및새D11하네스·원문보존해시가통과해야로컬커밋한다. inventory/parity는단위별증거만추가하며원문전체완성은커버리지와남은공백을검토한별도판정이다.

## 2026-10-25 선정·기본 진입·원문 코드 확정

기본 진입은 object-ownership/own-order다. 경계전체지도는첫화면대신별도질문으로고른다. 원문상층지도는실제SQL호출순서/필터순서가아니며객체권한검사자체가DB조회와결합할수있음을note로밝힌다.

선정시안은질문12개에JPG14장이다. object-ownership만 own1002/other1003/UUID1003의3장을쓴다. 숫자가다른단계에GET1003고정그림을재사용하지않는다. selected-images.json에정확경로/SHA/native1672×941/JPG92/출처/의도차이와메인raw및JPG판독이있다. CORS·CSRF·secret·SBOM최초4장과후속교정전3장총7장은draft이며선정한최신수정본만제품등록한다. 전체생성21장이고rawPNG는외부generated_images에유지한다.

own-order는object-own-order-v2-pc-dark.jpg, other-unscoped/other-scoped는object-ownership-pc-dark.jpg의상단/하단, uuid-scoped는object-uuid-order-pc-dark.jpg의오른쪽을쓴다. 원본SQL그림의literal은bind값을풀어쓴설명이며실제bind문장/파라미터를별도DOM으로보여준다. 추가2비교id-only1002/uuid-only1003는원래proof를수정하지않은sqlite_compare_addendum.py와전용로그에있다.

모든stage의코드패널은 codeKind를명확히한다. actualPython/SQL은정확한추가proof발췌및SQL+별도bind값, 원문Java/HTTP/Bash는원문MD정확발췌, 설명모델의절차는'설명용절차·실행코드아님'으로표시한다. 모델을컴파일가능한Java원문으로위장하지않는다. sourceFragments는path/start/end(필요열)로순서가있는정확원문범위를대조하며문자열값을훼손하지않는다. 모델의새설명문구는이SPEC의해당행을출처로하고native값단정없음.

CORS4상태의실제값은 proof-logs/main-browser-cors.json/serverJSONL을대조한다. fetch실패에는response.status/body가없으며200/403을가짜로넣지않는다. 성공case만실제200/body를보인다. 서버OPTIONS/POST카운트는별도관측API기록이고원래차단응답body를읽었다고하지않는다. DOM2상태는 main-browser-dom.json의B0/B1/text/HTML로대조한다. 실제브라우저fixture캡처는기본PC1668×832이며P09의1672×941override와다른실측임을기록했다. 이를imagegen시안동일뷰포트제품검증으로취급하지않는다.

fullfixture/SQLraw/브라우저JSON·실행한계는부가details및로컬파일링크에서접근하며기존D11 sourceRoot .knowledge-chapters와MD/oldIDs/코드블록을보존한다. 새 #d11-original을추가해도해당원문해시불변이며기존개념지도는한번만legacydetails에보존한다. 공통reader자체리팩터링·다른24controller수정없음. nativeproof/sourceSHA/expected/raw수정으로UI검사를맞추지않는다.

최종재검수수정본은 object-own-order-v2, cors-requests-v3, sql-boundary-v2다. own-order의잘못남은상향화살표를제거했고CORS전송과읽기열을분리했다. SQL그림의따옴표가모호한코드조각은명시적인비코드설명식으로대체했다. 실제코드는추가fixture원문DOM발췌를쓴다. 기존시안/첫검수3minor는history로보존한다.
