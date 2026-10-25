# D09 운영·관측 조사 보고서

조사 시각: 2026-10-20 21:17 UTC (2026-10-21 06:17 KST), source 확인 기준일 2026-10-21. 지정된 `SOURCE.md` 전문(309줄, 9개 fenced code block)과 `_data/source-baseline.json`을 직접 읽었다. 기준 파일은 현재 원문 SHA-256 `6ed92233be6bfa75029c31c3bb89eff723192bdbc58d27677cf29b4247eeee79`, 이전 연구 `abcd50b4fa871d8c11f9482244a7e7715009891cdf5eeda681dc75a9856a0173`과 다르다고 기록돼 있다. 이번 보고서는 해당 SOURCE.md에 대한 보충이며 원문은 수정하지 않았다.

## 결론 및 교정

- **SLI/SLO/SLA 및 43.2분:** 99.9%의 월 43.2분은 30일을 가정한 *시간 기반* 허용 비가용 시간이다. 요청 기반 SLI의 0.1% 실패 예산은 요청 수·분포로 계산하므로 시간으로 그대로 바꾸면 안 된다. 원문의 단서가 정확하며 “30일 가정”을 문장에 덧붙이면 더 명료하다.
- **Prometheus `up` / Targets:** `up=1`은 해당 scrape target에 대한 최근 스크레이프가 도달·성공했다는 신호다. 사용자 업무 흐름의 성공, DB 정상, 다른 job 상태를 증명하지 않는다. `/api/v1/targets`는 discovery된 active/dropped targets의 상태와 scrape error 등을 조회하는 API다. Target 페이지가 한 job의 업무 상태 전부를 나타내는 것처럼 표현하지 않는다. `/api/v1/query`는 PromQL 실행 API다.
- **라벨·Counter·rate:** 각 고유 라벨 조합은 새 시계열이다. 사용자 ID·이메일 같은 높은/무제한 cardinality 값은 라벨로 넣지 않는다. Counter에 `rate()`를 적용하면 관측 범위에서 증가율을 초당 평균으로 추정하고 reset을 보정한다. `rate()`를 먼저 계산한 다음 합산해야 인스턴스별 reset을 감지할 수 있다. 짧은 range는 적은 scrape sample·scrape 간격·누락의 영향을 받고, 길면 변화 반응이 느리므로 운영 질문과 scrape cadence에 맞춰 정한다.
- **Histogram quantile 및 단위:** `histogram_quantile()` 결과는 관측값의 단위(예: `_seconds`면 초)를 따른다. Classic histogram의 버킷 경계 사이 quantile은 균등 분포 가정 선형 보간값이므로 실제 개별 요청의 정확한 백분위가 아니다. 관측 구간과 bucket 경계가 해석에 중요하다.
- **OTel trace:** 로그에 `trace_id`처럼 생긴 값이나 자체 correlation ID만 남기는 것으로 실제 OpenTelemetry trace가 생성되지는 않는다. SDK/API가 span을 만들고, 문맥이 서비스 사이 전파되며, span이 수집·export되고 backend에서 조회 가능해야 실제 trace 경로가 성립한다. W3C `traceparent`/`tracestate`는 전파 형식이지 span 생성·저장 자체의 증거가 아니다. Sampling은 overhead와 수집량을 줄이고 일부 trace를 버릴 수 있으므로 완전 기록을 전제하지 않는다.
- **HPA:** 문서의 sync 기본값 15초는 kube-controller-manager 설정에 종속되고 바꿀 수 있는 제어 루프 간격이지, 부하 증가 후 확장 완료 시간을 뜻하지 않는다. readiness 및 시작 직후 CPU initialization period(기본 5분) 관련 기준이 있고, 애플리케이션 기동·JVM warmup·metrics pipeline 지연은 별도다. 파드만 늘려도 DB/API/connection pool 병목은 해결되지 않을 수 있다.
- **CloudFront/CDN:** cache key는 기본적으로 배포 도메인과 URL path 중심이며, 응답을 바꾸는 query/header/cookie 값을 키에 넣어야 서로 다른 응답이 섞이지 않는다. 요청을 origin에 전달하면서 cache key에는 제외할 수 있는 정책도 있지만 그 값을 기반으로 응답이 달라진다면 공유 캐시가 안전하지 않다. 로그인·세션·개인화 응답은 캐시 키/쿠키/헤더와 `Cache-Control` 설계를 구체화하거나 캐시하지 않는 경로를 명시해야 한다.
- **알림·사고대응:** 페이지 알림은 수신자가 즉시 할 수 있는 행동과 연결해야 한다. SLO burn-rate 알림은 error ratio와 평가 window, SLO 기간, 허용 budget 소진량을 함께 정해야 한다. 저트래픽 서비스는 단일 실패가 과장된 burn rate를 만들어 오탐할 수 있어 multi-window 또는 별도 정책을 고려한다. 심각한 영향은 root cause 규명보다 완화·사용자 영향 감소·회복 확인을 먼저 진행하고, postmortem은 개인 비난 대신 대응/시스템 조건 및 재발 방지 작업을 다룬다.
- **복구:** RPO는 장애 전 복구 가능한 시점과 허용 데이터 손실량, RTO는 서비스 복구까지 허용되는 최대 시간이다. 백업 job 성공과 복제(replication)는 복원 성공 증거가 아니다. AWS는 목표에 맞춘 백업/DR과 주기적 recovery test를 권고한다. 격리된 환경의 실제 restore drill로 데이터와 서비스 동작, 측정된 RPO/RTO를 확인해야 한다.
- **Python sqlite3 `Connection.backup`:** API는 SQLite 연결의 현재 DB 내용을 다른 연결에 복사할 수 있게 한다. 로컬 toy DB snapshot 후 원본에 새 행을 추가하고 snapshot을 별도 restore target에 복원해 행 차이를 관찰하는 것은 API 작동 예시일 뿐이다. 운영 DB의 일관성, 복구 경로, 실제 손실량, 복구시간 목표 달성을 입증하지 않는다.

## 준비된 네이티브 바이너리 조사

공식 Prometheus Download 페이지와 공식 `prometheus/prometheus` release 목록에서 기준일 현재 stable 3.15.0을 확인했다. `darwin-amd64` artifact 이름은 `prometheus-3.15.0.darwin-amd64.tar.gz`, artifact URL은 `https://github.com/prometheus/prometheus/releases/download/v3.15.0/prometheus-3.15.0.darwin-amd64.tar.gz`, SHA-256은 `2d79e744c2d7e505db936fbc898e05abc74fcb6e437c25befd26e9c9f00aa58b`이다. 공식 download page 표와 GitHub release asset 메타데이터가 해시를 일치하게 표시했다. 다만 `sha256sums.txt` 파일을 web 도구로 직접 열어 본문을 확인하지 못했다(리다이렉트된 release-assets 응답 오류). 그 파일의 표준 URL 후보 `https://github.com/prometheus/prometheus/releases/download/v3.15.0/sha256sums.txt`는 기록하되 직접 열람되지 않았다고 표시했다. 공식 다운로드 페이지에 적힌 개별 artifact 해시 자체는 확인 완료다.

현재 공식 Prometheus CLI 문서는 `--web.listen-address` 기본 `0.0.0.0:9090`, `--config.file` 기본 `prometheus.yml`, `--storage.tsdb.path` 등의 flag가 있음을 보여준다. `127.0.0.1:0`의 ephemeral port bind 사용 가능 여부와 현재 HTTP API의 query/ready 응답 세부사항은 공식 문헌에서 확인하지 못해 설정 가능하다고 단정하지 않는다. 공식 scrape config 문서는 `scrape_timeout`이 `scrape_interval`보다 클 수 없다고 명시한다. 1초 미만 interval/timeout의 허용 여부는 문서 근거를 확보하지 못했다. `GET /api/v1/query`, `/api/v1/targets`는 문서화되어 있고, `/ready`는 현재 HTTP API 문헌에서 근거를 찾지 못했다.

조사 중 Docker, 서버, DB, 원격, 기존 Prometheus/서비스 포트에는 접속하지 않았다. Prometheus나 다른 native 프로그램도 실행하지 않았다. Java 25/Docker/Grafana/Actuator 예시는 원문 그대로 미실행 교육용 예시다. Collector/OTel/Grafana/클라우드 온콜·실제 복원·오토스케일·성능 측정을 수행한 사실은 없다.

## 산출물

- `sources.json`: 직접 열어 확인한 공식 primary source 목록과 URL, 확인일, 근거 범위, 주장 및 한계.
- `source-notes.md`: 기존 원문 byte를 변경하지 않고 보충할 편집 메모.
- `native-prometheus-source.json`: stable native binary 식별 및 해시와 직접 열람 한계.
