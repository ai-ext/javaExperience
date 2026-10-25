# D09 운영·관측 개념 부분 보강 · 2026-10-21

14개 질문·39개 상태(native17/미실행 모델19/원문3)를 보강했다. D09 모든 독립 장면·학습자 이해·134개 전체의 완료 기록은 아니다.

## 원문과 실제 관찰

원문309줄9fence(Mermaid4/YAML2/bash3), SHA6ed92233be6bfa75029c31c3bb89eff723192bdbc58d27677cf29b4247eeee79와 기존 본문14054자/도표제외12690자·code5/Mermaid4/id22/map1을 보존했다. 원문 Java25/S16 Actuator·Docker Compose·Grafana 예제는 미실행이다.

추가 fixture4개는 Python3.14.3 stdlib exporter, SQLite3.53.0 복원 toy, 지정 Decimal/nearest-rank 계산, 별도 Prom config다. 공식 Prometheus3.15.0 darwin-arm64 archive109656029bytes/SHA920df4d17e78b3b0175af144eb318b0c74d1cf7b1d1251b326966f0e81977260와 추출 binary SHAedfbcf257fff3694e345be7648ce8ee05aa0cf602662097c649f4923116d7145를 각각 검증했다. 초기 연구 amd64 가정은 실제 hostarm64 확인 후 공식 arm64로 정정했으며 모델/provider 전환이 아니다.

새0700 runtime·자기loopback포트·새 TSDB만 사용했다. Prom은 예약해 얻은 own port번호를 명시했고 port0 지원 실험이라 하지 않는다. 추가1s scrape/500ms timeout은 fixture 선택값이다. 사용자8080/9090/3000·기존DB·practice·cache는 접속/변경하지 않았다. `/-/ready=200`·실제 `/api/v1/query` vector를 관찰했다.

업무 GET4건은 success(200,true,true), httpfail(500,false,true), badpayload(200,false,true), invalid(400,false,false)이고 값 순서는 HTTP/business_ok/valid다. toy 정의의 outcome은1/2/1이며 invalid 제외는 모든4xx 정책이 아니다. 업무 성공1/유효3과 유효HTTP200의2/3은 다르다. /metrics 반복조회는 업무 건수를 늘리지 않고 전체 HTTP/polling/query는4건보다 많다. main fresh rawHTTP108/query99와 독립106/97은 동적 분모이고 native4업무/frozen facts와 구분한다.

실제 Prom up1일 때 업무 실패2건이 있었다. 자체 exporter 정상 중지에서 up0·Prom 계속 실행, 같은 ownport의 새 exporter에서 up1·선택 counter6개0을 확인했다. 과거 TSDB sample 삭제가 아니다. up0은 일반적으로 scrape 실패이며 이번 원인은 own stop 한 사례다. request_id·실제timestamp를 응답/JSON사건4개에서 대조했지만 OTel span/context 전파 증거로 부르지 않는다. exporter label은 outcome만, Prom job/instance는 별개다.

SQLite seed1행 commit→Connection.backup snapshot1행→원본 later 추가commit2행→새 target복원1행을 관찰했다. 원본2행 보존·세 integrityok·연결close를 확인했으며 운영 손실·서비스 복구·RPO/RTO 달성 실험이 아니다. 지정10000/9980/20/99.9% 계산은 allowed10/remaining-10/burn2·success99.8%이고 실제 트래픽이 아니다. 30일43.2분은 시간기준 정의일 때만의 예시다. 지정벡터[10,20,30,40,50]의 nearest-rank p50rank3/value30·p95rank5/value50은 실제 latency/단위·histogram 측정이 아니다.

native22CHECK·미실행6모델 전체를 최초freeze하고 작성자fresh·메인fresh·무수정 private독립사본에서 전체JSON 일치를 확인했다. frozenSHA d275c1ba2c11ddaf2156d04846dd8b83d54c8128d4bd026d457cbf4d1d8ee192, runnerSHAce4b833a7fb94cae2f44d66032f317ad1d241c0a8c0c518ebda29b4e2a7572c4다. 모델0 probe·component17/Prom미실행 역사기록과 freeze덮어쓰기거부를 보존한다. own장기프로세스3개(exporter2/Prom1)는exit0/PIDgone·ownport2closed·killfallback없음이다. 별도버전/SQLite/Decimal명령은 다른 분모다.

## 문헌·이미지

direct CodexCLI0.163.0/gpt-6-luna/OpenAI ACCESS_OK·research exit0/turncompleted·completedweb13/error0/nestedLLM0을 확인했다. LiteLLM·다른모델/provider를 사용하지 않았다. raw nonGitstatus128/두sourcecountassert실패는 최종20source검증으로 복구한 조사파일 확인 오류이며 용량·LLM접근실패가 아니다. 부모가 공식24페이지를 직접 대조했다. `/-/ready`·native arm64취득·trace의span존재와backend검증 구분·CloudFrontminTTL·HPA15s·RPO/RTO 목표 경계 등 정정은 research/main-verification.json에 기록했다.

모델6은 SLI/SLO/SLA·기간/분모/no-data, 로그/metrics/traces·context, up/cardinality/rate-first/reset/histogram, alert/incident/postmortem, capacity/HPA/cacheCDN, recovery경계다. 모델에 native PASS를 붙이지 않고 original15s/Java25·Actuator와 native1s/Python/metrics를 분리한다. 실제rate/latency/월간SLO·온콜메시지·K8s/HPA·cache/CDN·운영DR는 실행하지 않았다.

`gpt-image-prompt`와`imagegen` 스킬의 학습계약/검수를 적용해 actualimagegen29회·메인29actualview·선정14JPG92·15draft를 남겼다. 실제URL/query·SQLitebody열·지정산술label·가짜로그필드제거·businessvalid·counter값vsseries수·Prompull방향·호스트/Compose경계·HPA평가loop·알림no-data표현·작은IP오기를 실제 재생성해 교정했다. 독립 선정14 최종C/I/M0이며 초기Important3 교정이력은 image-review.json에 보존한다. 코드로 raster글자/화살표를 덧칠하지 않았다.

선정14JPG는7404789bytes, 대응생성PNG24568451bytes이며 원본해상도를 유지했다. counters-v2만 실제1671×941이고 나머지28생성은1672×941다. 요청한widthassert 실패를 실제header기준으로 정정했고 강제늘림은 하지 않았다. task이미지29·캡처28은 모두실제JPEG이며 rawPNG는 외부생성폴더에만 있다. 프롬프트는 prompts/에 보존했다.

## 브라우저·검사·한계

Chrome1672×941/360×800에서39상태씩78행·96개 fullrunJSON·코드/강조/현재값/문구/loadedJPEG/실제크기/focus/모델PASS숨김/기본노출/접기/viewport를 대조했다. original이미지는v4교정 뒤 해당6상태를 재대조하고 대표2캡처를 교체했다. 수집helper의closurebuffer 문제는 실제DOM 반환값을명시수집해 해결하고 역사적v3행은 별도보존했다.

대표14상태 양쪽28JPG를 저장했다. 메인은desktopbusiness/scrape/labels·mobilebusiness/counters/original의6장actualview, 독립 전수검토는 capture-review.json이 최종근거다. 25다른상태의별도시각캡처는없고 전수pixel/학습자/다른브라우저인증이아니다. 모바일확대그림은내부pan, fullpage고정메뉴paint는캡처한계다.

실제clipboard183자·중간빈줄/끝개행·manualzoom/resize/proof유지·다른stage접힘·nativepan21.5·모바일끝focus·desktopEndEnter·원문anchor/back/reload·기존지도anchor10조작이통과했다. live원문12690/code5/id22/map1/MermaidSVG4가보존됐다. latest500warn/error반환217중검사window114건은전부브라우저확장오류이고ownURL/message0이다. 전체세션무오류로표시하지않는다. ChatGPT7927원래대화복원·viewportreset1698×832·별도7947D09preview유지했다.

HTML339/link0·D09unit/generated+기존31회귀=32suite·visual/version-cards/parity3audit가exit0이다. parity기존701prefixbyte그대로14추가715/verified0, inventory기존45154recordbyte그대로79추가45233이며39새state만implemented,40새toggle은unreviewed다. implemented774/기존verified6/unreviewed44453·D09pagein_progress다. audit의verified는형태검사출력이며학습검증을인증하지않는다.

원문135/서버17·source9/fixture4/runner/frozen·image29/capture28SHA를확인했다. 기존worktree3403중3398동일/외부.gitignore·AGENTS수정+3privatecapture없음의5차이는보존한다. root/task외부AGENTSmemo는stage제외한다. 준비metadatawrongcwd·reader환경·요청canvasassert·CUAeval/hostdocument·closure수집오류는 attempts-and-limits.json에기록했으며 최종통과와구분한다.

로컬분리브랜치체크포인트이며merge/push/PR은없다. 초기aed347f dirtybase에privatecapture가포함된이력을직접공개/통합하지않는다. 이후사용자가지정할실제최신통합대상에서정리된공통기반과scenario측sharedbuilder기능을함께보존해야한다. 134중23번째부분보강기록이며전체goal은미완료다.
