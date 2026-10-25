# D09 원문 byte 보존용 보충 메모

대상은 `LOCAL_HOME/research/javaexperience-d09-20261021/SOURCE.md`이다. 조사 시점에 309줄, fenced code block 9개임을 직접 확인했다. `_data/source-baseline.json`의 현재/이전 연구 SHA가 다르므로 이전 연구 문구를 현재 원문으로 간주하지 않았다. 이 메모는 보충 제안이며 SOURCE.md를 수정하지 않는다.

## 삽입/정정 제안

1. **3.1의 43.2분 환산 문장:** “30일을 시간 기반으로 측정하면 99.9%는 43.2분의 비가용 시간에 해당한다. 요청 기반 SLI는 실패 요청 수/전체 유효 요청 수로 산정하므로 이를 동일한 시간으로 환산할 수 없다.” Google의 availability table은 월을 달력별로 정의하기보다 표의 월 환산값을 제공하므로 교육 예에서는 “30일 기준”이라고 조건을 함께 둔다.
2. **3.2의 Prometheus 설명 뒤:** `up{job,instance}=1`은 scrape 성공/도달성을 말한다. 업무 성공률, DB 상태 또는 scrape되지 않는 별도 job/의존성의 상태가 아니다. Targets API는 discovered active/dropped target 및 scrape health/error 정보를 보여준다. 사용자 기능은 독립된 probe/SLI로 측정한다.
3. **메트릭 설명 뒤:** 모든 고유 label set은 시계열을 만든다. `userId`, email, request ID처럼 높은 cardinality의 라벨을 피한다. Counter rate는 `rate(counter[window])`; reset을 보정하며 aggregation 전에 적용한다. Window는 scrape 간격과 누락/대응 반응속도를 고려한다.
4. **p95 설명:** histogram quantile은 버킷 관측으로부터 구간 내 분포 가정을 사용해 계산한 근사값이다. classic histogram은 경계 사이 선형 보간을 하며, metric 이름이 seconds라면 결과 역시 초다. bucket 경계를 업무 지연 목표 주변에 설계한다.
5. **Trace diagram 설명 보완:** trace ID를 로그 필드로 생성·기록하는 것만으로 OTel trace가 되지 않는다. span 계측, context propagation, span 수집 및 export/backend 저장 과정이 필요하다. sampling 시 trace 일부가 의도적으로 기록되지 않을 수 있다. W3C Trace Context는 trace context 전달 표준이다.
6. **3.5 HPA:** 15초는 기본 sync cadence이며 설정 가능한 controller-manager 값이다. 확장 완료 SLA가 아니다. CPU initialization period 기본 5분과 startup/readiness 신호는 초기 CPU 관측에 영향을 준다. scale out은 DB, 외부 API, queue, connection pool 등의 하위 한계를 넘지 못한다.
7. **3.5 CDN:** CloudFront 기본 cache key는 도메인과 path를 포함한다. 응답 본문이 달라지는 query/header/cookie는 cache key에 적절히 포함하거나 개인화 응답을 caching하지 않는다. Origin request policy로 origin에 전달하는 값과 cache key 값은 서로 다르게 설정할 수 있지만, key에서 제외한 값에 응답이 의존하면 사용자 간 응답 혼합 위험이 생긴다.
8. **3.3/3.4 알림:** page는 즉시 대응할 사람과 조치가 있어야 한다. SLO burn-rate 알림은 관측기간, SLO window, error budget spend 기준을 명시한다. 저트래픽에서는 단일 요청 실패가 크게 보일 수 있다. 장애 대응은 원인 분석과 동시에 영향 완화 및 사용자 관점 복구 확인을 진행한다.
9. **3.6 SQLite toy:** `Connection.backup(target)`은 SQLite DB 연결 내용을 다른 DB 연결로 copy하는 API 예제다. toy snapshot/restore 실험은 실제 운영 백업 절차의 일관성, 보존, 분리 보관, 키/권한, 앱 재기동, 실측 RPO/RTO를 증명하지 않는다. 새 행 유무는 실험 중 데이터 시점 차이를 보여주는 것뿐이다.
10. **원문 직접 해보기:** Java 25/Spring Boot/Actuator 및 Docker Compose 예시, `latest` tag, Prometheus/Grafana URL은 문서상 미실행 예시로 둔다. 현 작업은 native Prometheus 별도 프로세스와 Python exporter를 위한 조사일 뿐 실제 계측·온콜 체계를 구축하거나 검증하지 않았다.

## 근거를 못 찾은 항목

- `sha256sums.txt`의 공식 release URL 후보는 기록했으나 browser tool이 GitHub release-assets redirect에서 오류를 내어 파일 본문은 직접 읽지 못했다. SHA는 공식 download page의 개별 artifact table과 GitHub release asset metadata에서 직접 확인했다.
- 공식 문서에서 `--web.listen-address=127.0.0.1:0` 사용 가능성을 확정하지 못했다. `--storage.tsdb.path` flag 존재는 공식 CLI reference에서 확인했으나, 이 조사에서 현재 상세 기본값/상호작용은 별도 검증하지 않았다.
- 문서상 scrape timeout이 interval 이하라는 조건은 확인했다. 초 단위 이하 cadence 허용 여부는 확인되지 않았다.
- HTTP API에서 instant/range query 및 `/api/v1/targets`를 확인했으나 `/ready` endpoint 여부/동작 근거는 확보하지 못했다.
