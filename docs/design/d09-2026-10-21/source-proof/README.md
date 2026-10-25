# D09 추가 native 관찰과 원문 경계

원문 `docs/knowledge/D09-operations-observability.md` 309줄·9fence(mermaid4/YAML2/bash3)를 `source.json`과 `original/`의 byte·SHA로 보존한다. 원문에는 Java 코드가 없고 Java25/Actuator·Docker Compose·Grafana 실습을 그대로 실행한 것이 아니다. `fixture/` 네 파일과 `run-proof.py`는 추가 stdlib Python·별도 native Prometheus·독립 SQLite·명시 샘플 계산이다. 사용자 서비스8080/9090/3000·DB·practice·cache·학습자 구현은 조작하거나 접속하지 않는다.

## 두 mode

```bash
# Prometheus 바이너리가 없을 때도 가능한 별도 component 관찰. freeze 금지.
python3 docs/design/d09-2026-10-21/source-proof/run-proof.py \
  --component-only \
  --runtime-root /Users/ds/research/javaexperience-d09-20261021/_data/native

# 실제 main-provided native binary로 전체 관찰. 최초 freeze 뒤에는 전체 JSON 비교.
python3 docs/design/d09-2026-10-21/source-proof/run-proof.py \
  --project-root /Users/ds/code/javaExperience/.worktrees/concept-learning-night \
  --runtime-root /Users/ds/research/javaexperience-d09-20261021/_data/native \
  --prometheus-binary /Users/ds/research/javaexperience-d09-20261021/_data/tools/extracted/prometheus-3.15.0.darwin-arm64/prometheus \
  --prometheus-version 3.15.0 \
  --prometheus-sha256 edfbcf257fff3694e345be7648ce8ee05aa0cf602662097c649f4923116d7145
```

component-only는 고유 CHECK17개·`prometheusExecuted=false`이고 `component-execution.json`·`component-runtime-last.json`·`component-status.json`만 쓴다. Prom 관련 CHECK/PASS·실제 Prom query 결과를 만들지 않는다. full은 native22CHECK이며 그 수가 독립 실험22회나 JUnit22개라는 뜻은 아니다. `--probe`는 full 관찰을 하되 체크포인트를 생성/비교하지 않고 `probe-execution.json`에 쓴다. `--freeze`는 component/probe와 함께 쓸 수 없고 main의 미실행 모델6개가 있어야 최초 checkpoint를 만들 수 있다. 기존 checkpoint가 있으면 실행 전 거부하고 `open('x')`로 덮어쓰기도 막는다. 원문/frozen/models는 runner가 고치지 않는다.

runtime마다 새0700 디렉터리를 만든다. exporter는127.0.0.1/port0으로 자기 새 포트를 배정받고, Prometheus는 소켓으로 새 ephemeral 번호를 예약·반환한 뒤 `--web.listen-address=127.0.0.1:<own-port>`에 지정한다. Prometheus의 port0 지원을 검증했다고 하지 않는다. 기존 서비스의 알려진 포트는 요청 함수에서도 거부하고, HTTP 클라이언트는 환경 proxy를 쓰지 않는 local opener를 사용한다. 새 TSDB·config만 지정하며 admin/lifecycle API나 remote-write는 켜지 않는다. `/-/ready`와 `/api/v1/query`는 직접 시작한 own Prometheus에서만 읽는다.

## 업무 응답·사건·분모

추가 `/business` GET4건은 순서대로 다음 고정 toy case다. 유효성/업무정상 여부는 이 toy의 명시한 값이며 실제 입력 검증·상품/결제 알고리즘이 아니다.

|case|HTTP|business_ok|valid|outcome|
|---|---:|---|---|---|
|success|200|true|true|success|
|httpfail|500|false|true|failure|
|badpayload|200|false|true|failure|
|invalid|400|false|false|excluded|

`invalid`를 분모에서 제외하는 것은 이 예시의 정의다. 모든400이나 실제 API의 제외 정책으로 확대하지 않는다. 고정 request_id `d09-<case>`와 실제 timestamp를 응답 및 JSON 사건에 함께 남겨 필드가 같은지 대조한다. 업무 사건은4개이며 Prom polling/API/scrape까지 전체 HTTP가4회라는 뜻이 아니다. raw의 HTTP/query 수·timestamp·port·PID는 실행마다 달라질 수 있어 canonical execution에는 섞지 않는다. request ID는 사건 상관 예시이고 OTel trace/span·전파·로그 수집기를 실행한 것이 아니다.

exporter `/metrics`는 원문 `/actuator/prometheus`가 아니다. exporter의 metric label은 bounded outcome3종뿐이며 request_id를 label로 넣지 않는다. Prometheus가 추가하는 job/instance label과도 구분한다.

- `d09_business_requests_total{outcome="success|failure|excluded"}` 값은 각각1/2/1이다.
- `d09_valid_business_requests_total=3`, `d09_business_successes_total=1`, `d09_valid_http_200_total=2`다. 업무 성공1/유효3과 유효 HTTP200의2/3은 다르다.
- `/metrics` 반복 조회는 업무 요청을 늘리지 않는다. Prom scrape의 실제 횟수·수집 지연·초당 rate나 장기 SLO를 측정한 결과가 아니다.

## 실제 Prometheus 관찰

메인이 공식 download/release를 대조해 native3.15.0/darwin-arm64 artifact를 취득했다. 초기 amd64 가정은 실제 host arm64로 정정됐다. archive109656029bytes의 SHA `920df4d17e78b3b0175af144eb318b0c74d1cf7b1d1251b326966f0e81977260`와 추출 실행파일의 SHA `edfbcf257fff3694e345be7648ce8ee05aa0cf602662097c649f4923116d7145`는 다른 대상이다. main 기록은 `prometheus-artifact.json`, runner의 실제 binary SHA·`--version`은 native fact와 raw command log에 둔다. 별도 설치나 PATH 변경은 하지 않는다.

full mode는 실제 Prometheus 프로세스에 추가 config를 주고1s scrape interval/500ms timeout을 선택한다. 이는 이 fixture의 선택값이며 제품 기본·측정 속도가 아니다. 관측은 실제 API vector sample로만 한다.

1. own Prometheus `/-/ready=200`·scrape up1. 업무 요청에는 실패2개가 있으므로 up1이 업무정상을 보장하지 않는다. up의 성공은 target scrape 성공이다.
2. 실제 PromQL query로 outcome1/2/1·valid3·businessSuccess1·validHTTP2002를 대조한다.
3. own exporter를 정상 종료한 통제된 사례에서 actual up0을 기다린다. 일반적으로 up0은 scrape 실패이며 프로세스 사망만 뜻하지 않는다. 이번 native가 보여 주는 원인은 own stop 사례뿐이다.
4. 같은 own 포트에서 새 exporter PID로 재시작한다. 새 메모리 counter는0, 실제 Prom query도0·up1이다. Prometheus의 과거 TSDB sample을 삭제하거나 누적 이력이0으로 지워졌다는 뜻은 아니다. rate/increase나 reset 해석은 별도다.

마지막에 exporter2개와 Prometheus1개, 장기 추적 프로세스3개를 정상 종료해 exit0/PIDgone·자체 두 포트 closed·kill fallback 없음을 검사한다. 별도 version/SQLite/Decimal 명령은 다른 분모다. 모든 HTTP/Java/서비스 프로세스를 종료했다는 주장이 아니다. 원문 서비스는 시작조차 하지 않았다.

## 별도 SQLite 복원 toy

새 source/snapshot/restored 파일3개만 만든다. source의 notes(id1,seed)를 commit한 뒤 `Connection.backup`으로 snapshot을 만든다. 이어 source에(id2,later)를 commit하고 snapshot을 새 target으로 backup/restore한다. source는2행, snapshot/restored는1행이고 원래 seed1은 보존된다. 세 파일의 `PRAGMA integrity_check=ok`와 실제 close 뒤 연결이 닫혔음을 확인한다. 원본 행 삭제·장애 주입·실제 운영 RPO/RTO 시간 달성·앱/서비스 복구 검사가 아니다. 학습자 서버 DB나 DB 시나리오를 확장하지 않는다.

## 명시 샘플 계산

Decimal 샘플은 valid10000/success9980/fail20/target99.9%로 allowed10·remaining-10·burn2를 계산한다. 이는 업무 GET4건과 별개인 명시 입력이며 실제 트래픽·측정 SLO·실제 alert/page가 아니다. 30일43.2분은 시간 기반 정의일 때의 계산 예시만 둔다. 요청 기준 실패율을 다운타임으로 환산하지 않는다.

percentile은 명시 벡터[10,20,30,40,50]에 nearest-rank 방법을 적용한 p50 rank3/value30·p95 rank5/value50다. 실제 latency 측정이나 Prometheus histogram/summary 쿼리가 아니며 값에 실제 지연 단위를 붙이지 않는다. 일반적인 percentile 구현·집계 가능성·성능을 인증하지 않는다.

## 근거와 한계

`records/<mode>/<own-run>/`·own runtime에는 프로세스/명령 stdout·stderr, 실제 JSON 사건, 선택한 Prom config를 보존한다. `runtime-last.json`의 actual query 응답에는 sample 시각·job/instance label·port가 원자료로 남는다. `fixture-manifest.json`은 fixture4개/runner SHA다. main 모델6은 별도 미실행 문헌 모델이며 native PASS를 붙이지 않는다.

원문 Java25·Actuator/Micrometer·Docker/Grafana·OTel Collector/trace·온콜 알림·Kubernetes/HPA·cache/CDN·운영 장애/RPO/RTO·실제 운영 SLO/기간/rate·실제 latency·학습자 이해·전수pixel 검증 완료를 주장하지 않는다. native frozen과 main fresh/독립 재현의 정확한 현재 결과는 해당 verification JSON/로그를 기준으로 읽는다. component 성공을 Prometheus 성공으로, query 성공을 사용자 업무 성공으로 대체하지 않는다.
