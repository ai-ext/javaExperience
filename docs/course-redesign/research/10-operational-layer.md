# 10. 게시판 서버 실습에 넣을 운영 계층 (비동기·장애 대응·관측성·외부 연동)

> 작성일 2026-10-22. 대상: Java/Spring Boot 3.x~4.x, 로컬 docker compose(Colima, Docker Desktop 불가).
> 근거 표기: **[공식]** 공식 문서를 이번 조사에서 직접 열어 확인 / **[블로그]** 국내 기업 기술블로그(검색 결과로 존재·요지 확인, 본문 전체 정독은 아님) / **[일반]** 출처 없는 일반 지식(검증 전, 학습 자료에 넣기 전 확인 필요).
> Spring Boot 4 기준 공식 문서는 4.1.x 페이지를 확인했다.

## 0. 공통 전제

- **우선순위 변경(SI 투입 전제)**: 학습자가 SI 프로젝트로 가므로 MyBatis/JPA 숙련, **커넥션 풀(9절)**, **외부 연동(8절)**이 최우선이고 메시징(2절)은 "알아두면 좋은 수준"으로 축소했다. 절 번호는 1~8은 기존 유지, 커넥션 풀은 9절, 미션 표는 10절.

- 경력 공고 25건 분석: 비동기·메시징 11/25, 장애 대응 9/25, 관측성 7/25. 기존 실습(CRUD 중심)에는 거의 없는 **운영 계층**이다.
- 게시판 도메인에서 자연스럽게 걸리는 지점: 조회수(캐시·동시성), 알림(메시징), 인기글 집계(스케줄러·락), 첨부파일/푸시/이메일 같은 외부 API(장애 격리), 글 작성 후 검색 색인/통계 반영(아웃박스).
- compose 기본 골격: `app` x2 인스턴스 + nginx(또는 traefik) + MySQL/PostgreSQL + Redis + Kafka(KRaft 단일 브로커) + Prometheus + Grafana + (Tempo 또는 Jaeger, Loki는 선택) + k6. 인스턴스 2개 이상이어야 4번 주제(분산 환경)가 의미를 가진다.
- 로컬 자원 주의: Colima 기본 VM(2 CPU/2GB)로는 위 전체가 안 돈다. 미션별로 compose `profiles`를 나눠 필요한 것만 올리게 하고, `colima start --cpu 4 --memory 8` 정도를 안내한다. [일반]

---

## 1. 관측성 (Actuator, Micrometer, Prometheus/Grafana, Tracing, MDC, 헬스체크)

### 실무 표준 구성
- `spring-boot-starter-actuator` + `micrometer-registry-prometheus`, `/actuator/prometheus`를 Prometheus가 scrape. 엔드포인트는 기본적으로 `health`만 HTTP 노출이므로 `management.endpoints.web.exposure.include`로 열고 반드시 보호(관리 포트 분리). [공식]
- JVM, HikariCP(`jdbc.connections`, `hikaricp.*`)는 자동 바인딩. 공통 태그(`management.metrics.tags.*`)로 환경 구분. [공식]
- 트레이싱: Boot 4는 `spring-boot-starter-opentelemetry` 한 개와 `management.opentelemetry.tracing.export.otlp.*`를 쓴다. 기본 샘플링은 10%(`management.tracing.sampling.probability`, 로컬 학습은 1.0). OpenTelemetry의 Zipkin 지원은 deprecated이고 4.2에서 auto-config 제거 예정이라고 문서가 명시. [공식] (Boot 3.x는 `micrometer-tracing-bridge-otel` + `opentelemetry-exporter-otlp` 조합. [일반])
- 로그 연결: Micrometer Tracing이 MDC에 `traceId`, `spanId`를 넣고 기본 correlation 포맷은 `[traceId-spanId]`. `logging.pattern.correlation`으로 변경. [공식]
- 헬스체크: `/actuator/health/liveness`, `/actuator/health/readiness` 그룹은 Kubernetes 환경에서 자동 활성(`management.endpoint.health.probes.enabled`로 제어). 관리 포트 분리 시 `add-additional-paths=true`면 메인 포트의 `/livez`, `/readyz`. [공식]

### 3~6년차 판단 포인트
- **liveness에 DB·Redis·외부 API를 넣지 않는다.** 외부가 죽으면 전 인스턴스가 재시작되어 연쇄 장애가 난다고 공식 문서가 직접 경고. readiness에 공유 외부 시스템을 넣을지는 판단 사항(넣으면 그 시스템 장애 시 전 인스턴스가 서비스 제외, 빼면 호출부에서 서킷브레이커로 처리). [공식]
- 샘플링률(비용 vs 가시성), 메트릭 카디널리티(userId·URL 원문을 태그로 쓰지 않기: 카디널리티 경고는 공식 페이지 미확인 부분이라 [일반]), 메트릭 알람 기준(평균이 아니라 p95/p99, 에러율, 포화도).
- 로그에서 trace 연결 후 "traceId로 한 요청을 끝까지 따라가는" 습관. 비동기 경계(스레드풀, Kafka)에서 컨텍스트가 끊기는지 확인하는 능력.
- Loki/Tempo 등 LGTM 스택 도입 경험담이 국내에도 있다(우아한형제들은 ELK에서 Loki로 전환, 젠킨스형 파일럿으로 OTel/Tempo 검토). [블로그]

### 흔한 사고
- liveness에 DB 체크를 넣어 DB 순간 장애 때 전 파드 재시작(위 공식 경고).
- actuator 전체 노출(`include=*`)로 `/env`, `/heapdump` 외부 노출. [일반]
- `@Async`/직접 만든 스레드풀에서 traceId 유실(컨텍스트 전파 누락). 공식 문서도 correlation이 context propagation에 의존한다고 명시. [공식]
- 샘플링 10% 기본값을 모른 채 "trace가 왜 안 남지"하고 헤맴. [공식]

### 로컬 compose 학습 형태
- 컨테이너: app x2, Prometheus, Grafana(대시보드 provisioning), Tempo(또는 Jaeger), (Loki + Alloy/promtail 선택).
- 관찰: (a) k6로 부하를 주고 Grafana에서 `http_server_requests` p95, Hikari active/pending 연결, JVM heap/GC를 본다. (b) 요청 1건의 traceId를 로그에서 찾아 trace 화면으로 점프. (c) DB 컨테이너를 `docker pause`한 뒤 readiness/liveness가 어떻게 바뀌는지, liveness에 DB를 일부러 넣었을 때 무슨 일이 생기는지 비교. (d) `management.tracing.sampling.probability`를 바꿔 trace 수 변화 관찰.

### 출처
- [공식] https://docs.spring.io/spring-boot/reference/actuator/tracing.html
- [공식] https://docs.spring.io/spring-boot/reference/actuator/endpoints.html (Kubernetes Probes 절)
- [공식] https://docs.spring.io/spring-boot/reference/actuator/metrics.html
- [블로그] 우아한형제들, 전사 로그 시스템 전환기: ELK에서 Loki로 https://techblog.woowahan.com/14505/
- [블로그] 여기어때(gccompany), Observability를 위한 LGTM 첫걸음 https://techblog.gccompany.co.kr/observability%EB%A5%BC-%EC%9C%84%ED%95%9C-lgtm-%EC%B2%AB%EA%B1%B8%EC%9D%8C-eceecde5aad4

---

## 2. 메시징 (알아두면 좋은 수준)

> 학습자가 SI 프로젝트로 가므로 우선순위를 낮췄다. Kafka 실습은 선택 과제로 두고, 개념과 판단 포인트만 짚는다.

### 알아둘 것
- **중복은 항상 온다**: 리밸런싱·컨슈머 크래시 후 재전달로 같은 메시지가 두 번 올 수 있으므로 설정이 아니라 애플리케이션이 멱등해야 한다(UPSERT, 처리 ID 유니크 제약). [블로그: 올리브영]
- **재시도와 DLQ**: spring-kafka `DefaultErrorHandler`는 기본 9회 재시도 후 로그, `DeadLetterPublishingRecoverer`는 `<토픽>-dlt`로 발행. 역직렬화·변환 오류는 기본 non-retryable. `@RetryableTopic`은 배치 리스너와 컨테이너 트랜잭션 병용 불가. [공식]
- **트랜잭셔널 아웃박스**: DB 커밋과 이벤트 발행을 원자적으로 묶는 기본 패턴(같은 트랜잭션에서 outbox 테이블에 기록, 별도 발행기가 전송, 최소 1회 전달). SI에서는 "DB 저장 후 타 시스템(MQ/외부 API)으로 알린다"는 요구에서 만나므로 외부 연동(8절)과 연결해 이해한다. [블로그: 컬리]
- **순서**는 파티션(key) 단위로만 보장. 재시도 토픽/DLQ 재처리는 순서를 깨뜨릴 수 있다. [블로그: Baeldung 등 일반 설명, 올리브영]
- 선택 실습: compose에 Kafka(KRaft 단일) + kafka-ui를 올려 (a) 예외 주입 시 `-dlt` 적재, (b) 컨슈머 kill 후 재전달 중복과 멱등 처리 효과, (c) Kafka 중단 중 글 저장 시 직접 발행 vs 아웃박스 비교.

### 출처
- [공식] https://docs.spring.io/spring-kafka/reference/kafka/annotation-error-handling.html
- [공식] https://docs.spring.io/spring-kafka/reference/retrytopic.html (인덱스만 확인)
- [블로그] 올리브영, Kafka 메시지 중복 및 유실 케이스별 해결 방법 https://oliveyoung.tech/2024-10-16/oliveyoung-scm-oms-kafka/
- [블로그] 컬리, 입고 시스템이 외부 인입 데이터를 안전하게 동기화하는 방법 https://helloworld.kurly.com/blog/2026-outbox-pattern-and-retry-topic
- [블로그] 우아한형제들, 우리 팀은 카프카를 어떻게 사용하고 있을까 https://techblog.woowahan.com/17386/

---

## 3. 캐시 (Spring Cache + Redis, TTL, 무효화, 스탬피드, 로컬 vs 분산)

### 실무 표준 구성
- `@Cacheable/@CacheEvict` + Redis(`RedisCacheManager`) 또는 Caffeine. Boot가 provider를 자동 선택하며(Redis, Caffeine 등) `spring.cache.type`으로 강제. Redis TTL은 `spring.cache.redis.time-to-live`, 캐시별 TTL은 `RedisCacheManagerBuilderCustomizer`의 `entryTtl`, Caffeine은 spec의 `expireAfterWrite` 등 provider별로 다르다. 키 prefix는 기본 활성이며 직접 `RedisCacheManager`를 만들 때도 유지 권장. [공식]
- 다층 캐시: 로컬(Caffeine) + Redis, 캐시명/TTL/타입을 Enum으로 관리하는 방식(올리브영). [블로그]
- 스탬피드 방어: 짧은 TTL 락 키(올리브영), Redis Lua로 원자 처리(LINE). 요청 합치기는 `@Cacheable(sync=true)`가 있으나 **JVM 단위 동기화라 인스턴스 간에는 안 막는다**. (`sync` 속성은 Boot 페이지에 없음 → [일반])

### 3~6년차 판단 포인트
- 무엇을 캐시하나: 읽기 많고 변경 적고 약간의 stale을 허용하는 것(카카오페이는 로컬 캐시를 트랜잭션 없고 잘 안 바뀌는 정보성 데이터에 제한 적용하라고 조언). [블로그]
- 무효화 전략: TTL만 / 쓰기 시 evict / 이벤트로 evict. **다중 인스턴스에서 로컬 캐시 evict는 다른 인스턴스에 전파되지 않는다**(Redis Pub/Sub 등으로 전파하거나 로컬 TTL을 짧게). 이 부분을 직접 다룬 국내 글은 이번 검색에서 못 찾음.
- 직렬화: record + Spring Data Redis 직렬화 오류 사례(우아한형제들). 값 포맷 변경 시 배포 중 구/신 버전 인스턴스가 서로 못 읽는 문제도 같은 뿌리. [블로그, 후자는 일반]
- 캐시가 죽으면? Redis 장애 시 타임아웃이 요청마다 쌓이므로 서킷브레이커로 DB failover(올리브영 재고 API 사례). [블로그]

### 흔한 사고
- TTL 일괄 동일 → 동시 만료 → DB 폭주(스탬피드/썬더링 허드). 대응은 TTL 지터, 락, 사전 갱신. [일반, LINE/올리브영 글이 락·Lua 대응을 다룸]
- 존재하지 않는 키를 계속 조회(캐시 관통): null 캐싱/블룸 필터. [일반]
- 로컬 캐시 + 다중 인스턴스에서 인스턴스마다 다른 값이 보임. [일반]
- 캐시 직렬화 클래스 변경 후 배포 시 역직렬화 오류. [블로그/일반]

### 로컬 compose 학습 형태
- 컨테이너: Redis, app x2, MySQL, Prometheus/Grafana. (`redis-cli monitor`로 명령 관찰)
- 관찰: (a) 인기글 목록에 캐시 적용 전/후 k6 p95와 DB QPS 비교. (b) 모든 키 TTL이 같을 때 만료 시점에 DB 쿼리 스파이크를 Grafana에서 확인, 지터/락 적용 후 평탄화. (c) 인스턴스 A에서 글 수정(로컬 캐시 evict) 후 인스턴스 B 조회가 stale인 것을 증명, Pub/Sub 전파 또는 TTL로 해소. (d) Redis 컨테이너 stop 시 응답시간·에러율.

### 출처
- [공식] https://docs.spring.io/spring-boot/reference/io/caching.html
- [블로그] 올리브영, 고성능 캐시 아키텍처 설계: 로컬 캐시와 Redis https://oliveyoung.tech/2024-12-10/present-promotion-multi-layer-cache/
- [블로그] LINE, Atomic 처리와 cache stampede 대책을 위해 Redis Lua script를 활용한 이야기 https://engineering.linecorp.com/ko/blog/atomic-cache-stampede-redis-lua-script
- [블로그] 카카오페이, 온라인 결제 서비스 2.5배 성능 개선기 https://tech.kakaopay.com/post/improve-service-performance/
- [블로그] 우아한형제들, Spring Cache + Redis record 직렬화 오류 https://techblog.woowahan.com/22767/

---

## 4. 분산 환경 동시성 (Redisson 락, ShedLock, 다중 인스턴스에서 깨지는 것)

### 실무 표준 구성
- Redisson `RLock`: watchdog이 락 보유 클라이언트가 살아있는 동안 만료를 연장(기본 30초, `lockWatchdogTimeout`). `leaseTime`을 지정하면 자동 해제되고(watchdog 연장 없음은 Medium 글 주장, 공식 페이지는 leaseTime 자동 해제만 명시), `tryLock(waitTime, leaseTime, unit)`. 락은 소유 스레드만 unlock 가능(아니면 `IllegalMonitorStateException`). Fair Lock은 죽은 대기 스레드마다 5초 지연. [공식]
- AOP 어노테이션(`@DistributedLock`)으로 분리하고 **트랜잭션 커밋 이후에 락을 해제**하도록 `REQUIRES_NEW` 사용(컬리: 커밋 전 해제 시 재고 정합성 깨지는 시나리오 설명). SSG도 `@Transactional`+AOP 순서 주의를 다룸. [블로그]
- ShedLock: `@Scheduled` 중복 실행 방지용. 다른 노드는 **대기하지 않고 건너뛴다**. `lockAtMostFor`는 JVM 죽음 대비 안전장치로 실행시간보다 충분히 길게, `lockAtLeastFor`는 짧은 작업·시계 오차 시 반복 실행 방지. JDBC(`usingDbTime()` 권장)/Redis provider. 시계 동기화 전제, 작업이 `lockAtMostFor`를 넘으면 중복 실행 가능. 분산 스케줄러가 아니라 락일 뿐. [공식(GitHub README)]

### 3~6년차 판단 포인트
- 분산 락이 정말 필요한가: DB 유니크 제약, 낙관적 락(`@Version`), `UPDATE ... SET cnt = cnt + 1` 같은 원자 연산이 먼저. 락은 마지막 수단. [일반]
- Redis 락의 한계: 단일 Redis 장애 시 락 유실(ShedLock README도 Redis master 장애 시 불안정 명시). 재고·결제처럼 틀리면 안 되는 곳은 DB 락/유니크 제약과 병행. [공식 일부 + 블로그]
- 락 범위(키 단위: 게시글 ID vs 전체), waitTime/leaseTime 산정, 락을 잡은 채 외부 호출 금지. [블로그/일반]
- 다중 인스턴스에서 깨지는 것 체크리스트: ① `@Scheduled` 중복 실행 ② 로컬 캐시 불일치 ③ 인메모리 세션(→ Spring Session Redis 또는 stateless JWT) ④ 인메모리 카운터/레이트리밋 ⑤ 로컬 파일 업로드 ⑥ 인메모리 이벤트(`ApplicationEventPublisher`)가 인스턴스 경계를 못 넘음. [일반]

### 흔한 사고
- 락 해제 후 커밋 → 다른 요청이 커밋 전 데이터를 읽음(컬리). [블로그]
- leaseTime이 작업시간보다 짧아 락이 먼저 풀려 두 스레드 동시 진입(ShedLock `lockAtMostFor`도 동일 구조). [공식]
- 스케줄러 N대 동시 실행으로 알림/정산 N번 발송. [일반]
- 다른 스레드에서 unlock 시도(비동기 API 혼용). [공식]

### 로컬 compose 학습 형태
- 컨테이너: app x3(포트 8081~8083 또는 `--scale app=3` + nginx), Redis, MySQL.
- 관찰: (a) 조회수/좋아요를 100 동시 요청(k6 또는 JMeter)으로 증가시켜 락 없음/락 있음/원자 UPDATE 세 방식의 결과 개수와 처리시간 비교. (b) `@Scheduled` 인기글 집계가 인스턴스 수만큼 로그에 찍히는 것을 보고 ShedLock 적용 후 1회만 실행됨을 증명, 락 테이블/키를 직접 조회. (c) 락 보유 인스턴스를 `docker kill`하여 `lockAtMostFor`/watchdog 만료 후 다른 인스턴스가 이어받는 시간 측정. (d) 인메모리 세션으로 로그인 후 nginx round-robin에서 로그아웃되는 현상 → Redis 세션.

### 출처
- [공식] https://redisson.pro/docs/data-and-services/locks-and-synchronizers/
- [공식] https://github.com/lukas-krecan/ShedLock
- [블로그] 컬리, 풀필먼트 입고 서비스팀에서 분산락을 사용하는 방법 https://helloworld.kurly.com/blog/distributed-redisson-lock/
- [블로그] 우아한형제들, WMS 재고 이관을 위한 분산 락 사용기 https://techblog.woowahan.com/17416/
- [블로그] SSG, 자동화센터 운영시스템에서 분산 락을 사용하는 방법 https://medium.com/ssgtech/ssg-%EC%9E%90%EB%8F%99%ED%99%94%EC%84%BC%ED%84%B0-%EC%9A%B4%EC%98%81%EC%8B%9C%EC%8A%A4%ED%85%9C%EC%97%90%EC%84%9C-%EB%B6%84%EC%82%B0-%EB%9D%BD%EC%9D%84-%EC%82%AC%EC%9A%A9%ED%95%98%EB%8A%94-%EB%B0%A9%EB%B2%95-7c3aa89ec5c8

---

## 5. 장애 격리 (타임아웃 예산, Resilience4j, 재시도 폭풍)

### 실무 표준 구성
- Spring Boot 3+ 에서는 `resilience4j-spring-boot3` + `spring-boot-starter-actuator` + `spring-boot-starter-aop`. 설정은 `resilience4j.<module>.instances.<name>`, 공통값은 `configs.default`와 `baseConfig`. [공식]
- 기본 어스펙트 순서: **Retry(가장 바깥) > CircuitBreaker > RateLimiter > TimeLimiter > Bulkhead > 함수**. 변경은 `*AspectOrder` 프로퍼티. [공식] 이 순서 때문에 재시도로 생긴 실패도 서킷브레이커 집계에 들어가 임계치에 빨리 도달한다는 점이 국내 글에서도 지적됨. [블로그]
- Circuit Breaker 핵심값: `failureRateThreshold`(기본 50), `minimumNumberOfCalls`, `slowCallDurationThreshold`, `waitDurationInOpenState`(기본 60s), 슬라이딩 윈도우(COUNT/TIME). [블로그: 올리브영/우아한형제들 글이 설명]
- 올리브영 OAuth2 전환 사례는 Timeout → Retry → Circuit Breaker를 겹쳐 사용. [블로그]

### 3~6년차 판단 포인트
- **타임아웃 예산**: 사용자 요청 전체 SLA(예: 3초) 안에서 하위 호출들의 (타임아웃 x 재시도 횟수) 합이 넘지 않게 배분. 상위 타임아웃보다 하위 타임아웃을 작게. [일반]
- 재시도는 멱등한 호출에만, 지수 백오프 + 지터, 총 재시도 횟수 상한, 서킷이 열리면 재시도 중단. 계층마다 재시도하면 곱셈(3x3x3=27배)으로 증폭 = 재시도 폭풍. [일반]
- Bulkhead로 느린 하위 시스템이 공용 스레드/커넥션을 다 먹지 않게 격리(서킷브레이커는 실패율, 벌크헤드는 동시성 제한). [일반]
- fallback을 무엇으로 할지(캐시 값, 기본값, 다른 저장소 failover, 오류 반환)는 비즈니스 결정. 올리브영 재고 API는 Redis 장애 시 Oracle RDB로 failover. [블로그]
- 서킷 설정은 트래픽이 적으면 `minimumNumberOfCalls` 때문에 안 열림. 트래픽 특성에 맞게 조정. [블로그]

### 흔한 사고
- 느린 외부 호출 → 톰캣 스레드/Hikari 커넥션 고갈 → 무관한 API까지 전면 장애(연쇄 장애).
- 기본 타임아웃 미설정(무한 대기)(8절 참조).
- 재시도 폭풍: 장애 서버가 회복하려는 순간 모든 클라이언트의 재시도가 몰려 다시 쓰러짐. [일반]
- 서킷브레이커가 4xx(클라이언트 오류)까지 실패로 집계해 열려 버림(`ignoreExceptions` 미설정). [일반]

### 로컬 compose 학습 형태
- 컨테이너: app, WireMock(또는 Toxiproxy를 앞에 둔 가짜 의존 서비스), Prometheus/Grafana(resilience4j 메트릭은 actuator/micrometer로 노출), k6.
- 관찰: (a) 의존 서비스에 2초 지연을 주고 k6로 부하 → 보호장치 없을 때 톰캣 스레드·Hikari pending이 차는 모습, 타임아웃+서킷+벌크헤드 적용 후 다른 API가 영향 안 받는 것. (b) 서킷 상태(CLOSED→OPEN→HALF_OPEN) 전이를 Grafana/`/actuator/circuitbreakers`에서 관찰. (c) 재시도 설정 켜고 의존 서비스를 중단·복구하며 의존 서비스 쪽 요청 수가 몇 배로 늘어나는지 WireMock 요청 로그로 계산.

### 출처
- [공식] https://resilience4j.readme.io/docs/getting-started-3
- [블로그] 올리브영, Circuitbreaker를 사용한 장애 전파 방지 https://oliveyoung.tech/2023-08-31/circuitbreaker-inventory-squad/
- [블로그] 우아한형제들, 개발자 의식의 흐름대로 적용해보는 서킷브레이커 https://techblog.woowahan.com/15694/
- [블로그] LINE, Channel Gateway에 CircuitBreaker 적용 https://engineering.linecorp.com/ko/blog/applying-circuitbreaker-to-channel-gateway/
- [블로그] 올리브영, 대규모 트래픽 레거시 시스템의 무중단 OAuth2 전환기 https://oliveyoung.tech/2025-10-28/oliveyoung-zero-downtime-oauth2-migration/
- [블로그] 토스, 우리는 어떻게 해외주식 서비스 안정화를 이뤘는가 https://toss.tech/article/28738

---

## 6. 배포·운영 (graceful shutdown, 이미지, JVM 메모리, 무중단·하위호환)

### 실무 표준 구성
- Graceful shutdown: Tomcat/Jetty/Reactor Netty에서 **기본 활성**(`server.shutdown=immediate`로 끔). 종료 시 새 요청은 받지 않고 `spring.lifecycle.timeout-per-shutdown-phase` 동안 진행 중 요청을 기다림. IDE 종료는 SIGTERM이 아닐 수 있음. 공식 페이지에 Kubernetes 가이드는 없고, 기본 타임아웃 값도 해당 페이지에 명시되지 않음. [공식]
- Kubernetes에서는 preStop sleep, `terminationGracePeriodSeconds`, 로드밸런서 idle timeout을 함께 맞춘다. 컬리는 유예 시간을 ALB idle timeout보다 길게 잡아 종료 중 502를 피하라고 설명. [블로그] (Spring 종료 대기 + preStop 합이 grace period를 넘으면 SIGKILL: Thoughtworks 글 [블로그, 해외])
- 이미지: Dockerfile(레이어드 jar, `layers.idx`의 dependencies/spring-boot-loader/snapshot-dependencies/application 4개 레이어로 캐시 효율) / Cloud Native Buildpacks(`bootBuildImage`) / Jib. uber jar를 그대로 실행하는 것은 컨테이너에서 오버헤드가 눈에 띌 수 있다고 공식 문서가 언급. [공식] Buildpacks/Jib 세부 비교는 이번 조사에서 공식 페이지 미확인 → [일반].
- JVM 메모리: `-XX:MaxRAMPercentage`로 컨테이너 한도 대비 힙 비율 지정(LINE 사례 70). 힙 = 한도로 잡으면 OOMKilled(메타스페이스·스레드 스택·다이렉트 버퍼 등 비힙 필요). [블로그 + 영문 블로그]
- 배포 직후 응답 지연은 JVM 웜업으로 해결한 사례(카카오페이). [블로그]
- 하위호환: 무중단 롤링 배포 중에는 **구/신 버전이 동시에 떠 있다.** DB 스키마는 expand → migrate → contract 순서, API/이벤트 스키마 필드 추가는 하위호환, 컬럼 삭제·이름 변경은 한 번에 하지 않는다. [일반]

### 3~6년차 판단 포인트
- 종료 순서: readiness를 먼저 내리고 LB에서 빠질 때까지 대기(preStop sleep) → graceful 종료 → 컨슈머 정지(Kafka `immediate-stop` 옵션 사례) → 풀 닫기. 타임아웃 합이 grace period보다 작은지. [블로그/공식 혼합]
- 이미지 크기·빌드 캐시·비root 실행·SBOM/취약점 스캔 중 팀 표준 선택(Buildpacks는 JVM 메모리 계산 자동화를 해주지만 이번 조사에서 공식 확인 못함).
- 컨테이너 JVM: 커널/cgroup 버전에 따른 한도 인식 이슈(Dell 문서가 커널 6.12 이상 이슈를 보고한 건 벤더 문서이므로 참고 수준).
- 배포 직후 에러율/지연 스파이크 대응(웜업, readiness 지연, 점진 배포).

### 흔한 사고
- 배포 때마다 일부 요청 502/503: preStop·idle timeout 불일치. [블로그]
- OOMKilled: 힙을 컨테이너 한도와 같게 설정. [블로그]
- 컨슈머 정리 없이 종료 → 메시지 중복/유실. [블로그]
- 롤링 중 컬럼을 먼저 삭제해 구버전 파드가 500. [일반]

### 로컬 compose 학습 형태
- 컨테이너: app x2 + nginx, k6(배포 중 지속 요청), docker compose `deploy.resources.limits.memory`로 메모리 제한.
- 관찰: (a) k6로 지속 부하를 주며 `docker compose up -d --no-deps app1`로 재기동 → graceful on/off 별 에러 건수 비교. (b) 메모리 제한 512MB에서 `-Xmx512m` vs `MaxRAMPercentage=70`일 때 `docker inspect`의 OOMKilled 여부와 `docker stats`. (c) 같은 앱을 Dockerfile(레이어드)/Buildpacks/Jib로 빌드해 이미지 크기, 코드만 바꾼 재빌드 시간 비교. (d) 구/신 앱 버전을 동시에 띄우고 컬럼 이름 변경이 어떻게 깨지는지 재현. Colima에서는 `docker compose`가 동작하나 resource limit 적용·cgroup 버전은 VM 설정에 따라 다를 수 있어 확인 필요. [일반]

### 출처
- [공식] https://docs.spring.io/spring-boot/reference/web/graceful-shutdown.html
- [공식] https://docs.spring.io/spring-boot/reference/packaging/container-images/efficient-images.html
- [블로그] 컬리, 장바구니 추천 개발기 2부 (preStop/terminationGracePeriod/ALB idle timeout) https://helloworld.kurly.com/blog/cart-recommend-model-development_second/
- [블로그] LINE, messaging-hub 트러블 슈팅 (MaxRAMPercentage 등) https://engineering.linecorp.com/ko/blog/messaing-hub-troubleshooting
- [블로그] 카카오페이, 배포 직후 응답 지연 해결 (JVM 웜업) https://tech.kakaopay.com/post/jvm-warm-up/
- [블로그, 해외] Thoughtworks, shutdown services kubernetes https://www.thoughtworks.com/insights/blog/cloud/shutdown-services-kubernetes

---

## 7. 부하 테스트 (k6/nGrinder/JMeter, 병목 재현, 결과 읽기)

### 실무 표준 구성
- 도구: 국내는 nGrinder(Groovy/Jython) + JMeter가 오래된 표준, k6(JavaScript)는 개발자 친화적이라 추가 도입(카카오페이는 nGrinder 스크립트가 낯설어 k6를 제공). [블로그] 이 실습은 compose 한 줄로 도는 **k6 + Grafana 연동** 권장.
- k6 threshold: `http_req_failed: ['rate<0.01']`, `http_req_duration: ['p(95)<200']`. 미충족 시 non-zero exit, `abortOnFail`로 즉시 중단 가능 → CI 게이트화. [공식]
- breakpoint 테스트: 부하를 점차 올려 한계점을 찾는 시나리오. [공식(Grafana 학습 경로)]
- 병목 개선 루프: 시나리오 부하 → 모니터링으로 병목 지점 확인 → 수정 → 재측정. 튜닝 대상은 DB 커넥션, 커널 파라미터, nginx 등. [블로그]

### 3~6년차 판단 포인트
- 결과 읽기: 평균이 아닌 p95/p99, 에러율, 처리량(RPS), **포화도(CPU, 스레드, Hikari pending)**. 지연이 늘며 RPS가 평평해지면 포화 신호. [일반]
- 부하 생성기 자체가 병목이 될 수 있음(같은 노트북에서 돌릴 때 앱과 CPU 경쟁). 로컬 수치는 **절대값이 아니라 전/후 비교용**. [일반]
- 현실적 시나리오: 읽기:쓰기 비율, 데이터 크기, think time, 워밍업, 캐시 상태. coordinated omission 개념(open vs closed 모델: k6 `constant-arrival-rate`). [일반]
- 병목 사례: 컬리는 DB 입출력이 최대 병목이라 DB I/O를 줄여 TPS 향상, 로그 데이터를 MongoDB로 분리. 로드밸런서가 단순 분배라 CPU 100% 서버에도 트래픽이 계속 가는 점을 짚은 질문 답변도 있음(인프런 Q&A, 신뢰도 낮음). [블로그]

### 흔한 사고
- 앱 한 대, 로컬 DB 데이터 100건으로 테스트해 "빠르다"고 결론.
- Hikari 풀 사이즈를 키웠더니 DB가 더 느려짐(커넥션 과다). [일반]
- 부하 중 GC/메모리 모니터링 없이 TPS만 봄. [일반]

### 로컬 compose 학습 형태
- 컨테이너: k6(+ `--out experimental-prometheus-rw` 또는 InfluxDB 출력은 [일반], 공식 확인 안 함), Prometheus, Grafana, app, DB.
- 관찰 시나리오(병목을 일부러 심는다): (a) N+1 쿼리 목록 API → DB 쿼리 수·p95 급증. (b) Hikari 풀 10 + 느린 쿼리 → pending 증가. (c) 동기 외부 호출 → 스레드 포화. 각각 수정 후 같은 k6 스크립트로 전/후 비교표 작성.

### 출처
- [공식] https://grafana.com/docs/k6/latest/using-k6/thresholds/
- [공식] https://grafana.com/docs/learning-paths/find-k6-limits/run-breakpoint-test/
- [블로그] 카카오페이, 성능 테스트 존을 소개합니다 https://tech.kakaopay.com/post/perftest_zone/
- [블로그] 우아한형제들, 결제 시스템 성능, 부하, 스트레스 테스트 https://techblog.woowahan.com/2572/
- [블로그] 컬리, 신규 서비스 배포 전에 실험과 개선을 반복한 이야기 https://helloworld.kurly.com/blog/vsms-performance-experiment/
- [블로그] LINE, 서버 사이드 테스트 자동화 여정 4. 성능 테스트 https://engineering.linecorp.com/ko/blog/server-side-test-automation-4/

---

## 8. 외부 API 연동 (우리 서버가 클라이언트)

### 실무 표준 구성
**8-1. 클라이언트 선택**
- 동기 서블릿 앱의 현재 기본은 **RestClient**(RestTemplate 후속). 선언형이 필요하면 **HTTP Interface(`@HttpExchange`)**를 RestClient 위에 얹는다. Boot 4 문서는 `@ImportHttpServices`로 그룹을 만들고 `spring.http.serviceclient.<group>.base-url/connect-timeout/read-timeout`으로 그룹별 설정을 지원. 그룹 설정이 전역 `spring.http.clients.*`를 덮어쓴다. [공식]
- **WebClient**는 리액티브/논블로킹이 필요하거나 스트리밍·동시 다발 호출에 쓴다. 서블릿 MVC 앱에서 `.block()`으로 쓰면 이점이 없다는 점은 [일반]. 국내 사례: 올리브영 전시 프로젝트가 WebClient 채택, 우아한형제들은 가게노출 시스템에서 WebClient에 서킷브레이커 적용. [블로그]
- **OpenFeign**: 우아한형제들이 일찍부터 도입(feign 적용기/더 나아가기). 클라이언트별 설정은 `@FeignClient(configuration=…)`로 하고 Feign 설정 클래스에 `@Configuration`을 붙이면 전 클라이언트에 적용되는 함정이 있음. [블로그] Spring Cloud OpenFeign의 Boot 4 호환 상태는 이번에 미확인 → "확인 불가" 절 참조.
- 정리: 신규 코드는 RestClient 또는 HTTP Interface가 기본값, 리액티브면 WebClient, 레거시/MSA 내부는 Feign이 현역. 팀이 "무엇을 왜" 골랐는지 어떤 사고(타임아웃·풀 설정 누락)를 막기 위한 것인지가 판단 포인트. 세 가지를 직접 비교한 국내 글은 이번 검색에서 못 찾음.

**8-2. 타임아웃 3종과 기본값**
- Boot는 `spring.http.clients.connect-timeout`, `spring.http.clients.read-timeout`을 제공(전역, 서비스 그룹별 override). 지원 HTTP 클라이언트 우선순위: Apache HttpClient > Jetty > Reactor Netty > JDK `HttpClient` > `HttpURLConnection`. **공식 페이지는 기본 timeout 값을 명시하지 않는다.** [공식]
- 세 가지: ① connect timeout(TCP 연결) ② read/response timeout(응답 대기) ③ 커넥션 풀에서 커넥션을 얻는 대기(connection request/pending acquire timeout). ③은 Boot의 위 공통 프로퍼티에 없고 클라이언트 구현(Apache `ConnectionConfig`/`RequestConfig`, Reactor Netty `ConnectionProvider.pendingAcquireTimeout`)에서 따로 설정한다. [일반 — 아래 확인 불가]
- "기본값이 무한대"인 경우: `HttpURLConnection` 계열 기본은 무제한으로 알려져 있으나 이번에 공식 페이지에서 확인하지 못함. [일반] **학습 미션에서는 값을 명시하지 않은 클라이언트가 지연 서버에서 영원히 매달리는지 직접 증명하게 한다**(추측이 아니라 실측으로 확정).
- WebClient 사례: Reactor Netty HttpClient에서 연결/응답/Read-Write 핸들러 타임아웃을 함께 설정하고, 호출부에 `.timeout(...)`을 추가로 둔다. 빌드 후 불변이므로 변경은 `mutate()`. [블로그]
- **타임아웃 예산**: 상위 요청 SLA > (connect + read) x 시도 횟수 + 백오프 합. 예: 사용자 응답 3s이면 외부 호출 read 800ms x 최대 2회 + 백오프, 풀 대기 100ms. 업체별 특성도 반영해야 한다: 토스페이먼츠는 결제 승인·거래 조회 같은 API에 read timeout 최소 60초 설정을 안내. 즉 "무조건 짧게"가 정답이 아니라 **상대 API의 SLA에 맞추고, 그래서 사용자 요청 스레드에서 동기로 기다릴지 비동기로 뺄지를 설계**해야 한다. [공식(토스페이먼츠 문서)]

**8-3. 재시도**
- 재시도 대상: 연결 실패·타임아웃·5xx·429(`Retry-After` 준수)는 후보, 4xx(400/401/403/404/422 등)는 원칙적으로 재시도 금지(같은 요청은 같은 실패). [일반]
- 지수 백오프 + 지터, 최대 횟수·총 시간 상한. Resilience4j Retry의 기본 어스펙트 순서상 Retry가 CircuitBreaker 바깥이므로 재시도 실패가 서킷 집계에 들어간다. [공식]
- **POST(결제·발송) 재시도는 위험**: 응답만 못 받았을 뿐 상대는 처리했을 수 있다. 해법은 **멱등 키**. 토스페이먼츠는 모든 POST API에 `Idempotency-Key` 헤더를 지원, 키는 UUID 등 무작위 고유값(최대 300자), 유효기간 15일, 타임아웃·네트워크 오류 후 **같은 키로** 재요청하면 안전하며 같은 키는 오류도 같은 응답을 돌려준다. 첫 요청이 처리 중이면 409(`IDEMPOTENT_REQUEST_PROCESSING`), 키 길이 초과 400. [공식(토스페이먼츠)] 멱등 요청이 에러를 반환했을 때 **키만 바꿔서 재시도하는 건 위험**하며 원인을 확인하라는 안내(비공식 LLM 참조 문서에 기재라 신뢰도 낮음 → 공식 본문 재확인 필요). [블로그/참고]
- 우리 쪽에서도 요청 레코드에 키를 먼저 저장(`PROCESSING`)한 뒤 호출해야 파드가 죽어도 복구 가능. [블로그(Medium 개인 글)]

**8-4. 타임아웃인데 상대는 처리 완료(결과 불명)**
- 타임아웃 = 실패가 아니라 **결과 불명(UNKNOWN)** 상태. 카카오페이 글은 성공/실패/알 수 없음을 구분하고, 알 수 없는 예외는 재시도 후에도 불명확하면 별도 불명 상태로 표시하는 흐름을 소개. [블로그]
- 처리 순서: ① 같은 멱등 키로 재요청 또는 **상태 조회 API**로 실제 결과 확인(토스페이먼츠도 승인 실패 시 조회 API로 상태 확인 후 분기 안내 — 비공식 LLM 문서 기재라 본문 재확인 필요) ② 그래도 확정 안 되면 `UNKNOWN`으로 남기고 **재처리 큐/배치**로 대사(reconciliation) ③ 결제처럼 돈이 걸리면 확정 안 된 건을 **망취소/보상**. [일반 + 블로그]
- 게시판 예: 알림 발송 API 타임아웃 시 outbox 행을 `UNKNOWN`으로 두고 조회/재시도 워커가 처리.

**8-5. 서킷 브레이커·폴백, 연쇄 장애**
- 5절과 동일 원리. 외부 장애가 **우리 톰캣 스레드·Hikari 풀을 잡아먹는 경로**가 핵심: 외부 호출 지연 → 스레드 점유 → 대기열 → 무관한 API 포함 전면 장애. 방어: 타임아웃 + 서킷 + 벌크헤드(외부 시스템별 동시 호출 상한) + 폴백(큐잉 후 나중에 처리). 올리브영 배달대행 연동 사례에서 `REQUIRES_NEW` 변경으로 호출당 트랜잭션이 2배가 되어 서버가 멈춘 장애도 있다(커넥션 압박). [블로그]

**8-6. 인증·응답 매핑·로깅**
- 인증 방식 3종: API 키(헤더/Basic — 토스페이먼츠는 시크릿 키 기반 Authorization 헤더), OAuth2 client credentials(토큰 캐시·만료 전 갱신·401 시 1회 재발급 후 재시도), HMAC 서명(타임스탬프·nonce 포함, 시계 오차 주의). 토스페이먼츠 공식 인증 문서는 [공식] 존재(`https://docs.tosspayments.com/reference/using-api/authorization`)만 확인했고, OAuth2/HMAC 구현 세부는 [일반].
- 응답/에러 매핑: 외부 에러 코드를 **내부 도메인 예외로 변환**(재시도 가능/불가능·사용자 노출 메시지 분리), 외부 DTO를 도메인 모델로 직접 쓰지 않기(ACL). [일반]
- 요청·응답 로깅: 요청 ID/외부 거래 ID, 상태코드, 소요시간은 남기고 **본문의 카드번호·토큰·Authorization 헤더는 마스킹**. [일반] 결제 장애 대응 관점의 국내 글: 우아한형제들 "결제는 계속된다". [블로그]

**8-7. 트랜잭션 안에서 외부 호출 금지**
- 외부 호출은 DB 커넥션을 잡은 채 대기시킨다. 카카오페이 결제 서비스는 "transactional 사용 구간에 3rd party API가 끼지 않도록 persistence layer 바깥에서는 `@Transactional`을 쓰지 않는다"는 원칙. 올리브영 알림톡 사례는 비즈니스 트랜잭션 안의 발송을 SQS 이벤트로 분리해 커넥션 점유를 줄임. 우아한형제들 정산 사례도 외부 API 조회를 트랜잭션 밖(컨트롤러 쪽)에서 먼저 수행. [블로그]
- 해법 패턴: (1) 외부 호출 먼저, DB 쓰기는 짧은 트랜잭션 (2) 커밋 후 이벤트(`@TransactionalEventListener(AFTER_COMMIT)`) 또는 아웃박스로 후속 호출 [일반].

### 3~6년차 판단 포인트 (요약)
- 값 없는 타임아웃은 장애의 예약이다: 모든 클라이언트에 connect/read/풀 대기 3종을 명시하고 예산표를 만든다.
- 재시도는 "무엇을, 몇 번, 어떤 키로"를 결정: GET/멱등 PUT은 자동, POST는 멱등 키가 있을 때만.
- 결과 불명 상태를 모델에 **명시적으로 둔다**(성공/실패/불명).
- 외부 호출은 트랜잭션 밖, 그리고 스레드·커넥션 격리 대상.

### 흔한 사고
- 타임아웃 미설정으로 상대 지연 시 스레드가 무한 대기.
- 타임아웃 후 재시도로 결제·발송 이중 처리(멱등 키 없음).
- 타임아웃을 실패로 간주해 사용자에게 "실패" 표시했으나 실제는 승인 완료(고객 이중 결제 시도).
- `@Transactional` 안 외부 호출로 DB 커넥션 고갈.
- 로그에 Authorization 헤더·카드 정보 평문 기록. [일반]
- OAuth2 토큰 만료 시 동시 요청이 모두 토큰 재발급(캐시 락 없음). [일반]

### 로컬 compose 학습 형태
- 컨테이너: **WireMock**(가짜 외부 API), **Toxiproxy**(app → toxiproxy → wiremock 사이 네트워크 장애 주입), app, MySQL, Prometheus/Grafana.
- WireMock이 주입하는 것: 고정 지연(`fixedDelayMilliseconds`), 로그노멀·균등 분포 랜덤 지연, 청크 드리블(느린 본문 전송), 결함 `EMPTY_RESPONSE`, `MALFORMED_RESPONSE_CHUNK`, `RANDOM_DATA_THEN_CLOSE`, `CONNECTION_RESET_BY_PEER`(*nix에서 정상 동작, Windows 주의). 상태 기반 시나리오(첫 호출 실패·두 번째 성공)는 별도 Stateful Behaviour 페이지 참조(이번엔 미열람). [공식]
- Toxiproxy가 주입하는 것: `latency`(+jitter), `bandwidth`, `slow_close`, `timeout`(데이터 차단 후 연결 종료; 0이면 해제 전까지 데이터 폐기), `reset_peer`, `limit_data`. 포트 8474 HTTP API로 `POST /proxies/{proxy}/toxics`. API 무인증이므로 외부 노출 금지 또는 `TOXIPROXY_AUTH_TOKEN`. 이미지 `ghcr.io/shopify/toxiproxy`. [공식(GitHub README)]
- 관찰: (a) 타임아웃 미설정 클라이언트 + 지연 주입 → 요청이 안 끝나는 것과 스레드 덤프. (b) read timeout 설정 후 `timeout` toxic으로 응답 전에 끊어 **상대는 처리했는데 우리는 실패**인 상황을 WireMock에서 "요청 수신 로그는 있고 우리 DB는 PENDING"으로 증명 → 멱등 키로 재시도/조회로 해소. (c) 첫 호출 5xx·두 번째 성공 시나리오로 재시도 횟수와 백오프 간격 측정. (d) 외부 지연 중 다른 API p95 변화를 벌크헤드 전/후 비교. (e) 트랜잭션 안/밖 호출 비교: Hikari active/pending 메트릭.

### 출처
- [공식] https://docs.spring.io/spring-boot/reference/io/rest-client.html (타임아웃 프로퍼티, 클라이언트 우선순위, HTTP Interface 그룹)
- [공식] 토스페이먼츠 멱등키 https://docs.tosspayments.com/reference/using-api/idempotency-key
- [공식] 토스페이먼츠 타임아웃 https://docs.tosspayments.com/resources/glossary/timeout
- [블로그/공식 블로그] 토스페이먼츠, 멱등성이 뭔가요? https://docs.tosspayments.com/blog/what-is-idempotency
- [블로그] 카카오페이, MSA 환경에서 네트워크 예외를 잘 다루는 방법 https://tech.kakaopay.com/post/msa-transaction/
- [블로그] 카카오페이, JPA Transactional 잘 알고 쓰고 계신가요? https://tech.kakaopay.com/post/jpa-transactional-bri/
- [블로그] 올리브영, SQS 기반 알림톡 처리에서 발생한 DB 커넥션 데드락 분석기 https://oliveyoung.tech/2025-12-30/alimtalk_improve_event_driven_architecture/
- [블로그] 올리브영, 배달대행사 API 연동과 장애 대응 https://oliveyoung.tech/2025-12-01/o2o_delivery/
- [블로그] 우아한형제들, 우아한 feign 적용기 https://techblog.woowahan.com/2630/ / feign 좀더 나아가기 https://techblog.woowahan.com/2657/
- [블로그] 올리브영, 신규 전시 프로젝트에서 WebClient 사용하기 https://oliveyoung.tech/2022-11-10/oliveyoung-discovery-premium-webclient/
- [블로그] 우아한형제들, 잊을만 하면 돌아오는 정산 신병들 https://techblog.woowahan.com/2711/
- [블로그] 우아한형제들, 결제는 계속된다: 결제 담당자가 장애에 대응하는 방법 https://techblog.woowahan.com/15236/
- [공식] WireMock https://wiremock.org/docs/simulating-faults/
- [공식] Toxiproxy https://github.com/Shopify/toxiproxy

---

## 9. 커넥션 풀 (DB HikariCP, 외부 HTTP 클라이언트 풀)

> SI에서 가장 자주 만나는 운영 장애 유형: "connection is not available", 응답 지연 후 전면 정지, 배포 후 끊긴 커넥션 오류. 설정 → 확인 → 장애 재현의 순서로 다룬다.

### 9-1. DB 커넥션 풀 (HikariCP) 설정 의미와 기본값 [공식: HikariCP README]
| 설정 | 기본값 | 판단 포인트 |
|------|--------|-------------|
| `maximum-pool-size` | 10 | 사용 중+유휴 합계 상한. 가득 차고 유휴가 없으면 `getConnection()`이 `connectionTimeout`까지 대기 |
| `minimum-idle` | `maximum-pool-size`와 동일 | README는 값을 주지 않고 **고정 크기 풀**로 두기를 권장(급증 대응) |
| `connection-timeout` | 30000ms (최소 250) | 풀에서 커넥션을 얻는 대기 시간. 초과 시 `SQLException` |
| `max-lifetime` | 1800000ms (30분, 최소 30000) | "DB·인프라가 강제하는 연결 제한 시간보다 **몇 초 짧게**". 사용 중 커넥션은 반납 후에야 폐기 |
| `idle-timeout` | 600000ms | `minimum-idle < maximum-pool-size`일 때만 적용 |
| `keepalive-time` | 120000ms(기본, README 기준) | 유휴 커넥션에 주기적 ping. `max-lifetime`보다 작아야 함 |
| `leak-detection-threshold` | 0(비활성), 최소 2000ms | 커넥션이 풀 밖에 이 시간 이상 머물면 "누수 가능" 로그 |
| `validation-timeout` | 5000ms | `connection-timeout`보다 작아야 함. `connectionTestQuery`는 JDBC4 드라이버에서는 설정 비권장 |
- README 부가 경고: TCP keepalive 설정(드물게 풀이 0이 되어 회복 못하는 경우 방지), 서버 NTP 동기화(VM 포함). [공식]
- 값은 Spring Boot에서 `spring.datasource.hikari.*`로 지정. [일반]

### 9-2. DB 쪽 타임아웃과의 관계
- **`max-lifetime` < DB `wait_timeout`(MySQL) / 프록시·방화벽 idle 제한**이어야 DB가 먼저 끊은 커넥션을 풀이 사용하는 사고를 막는다(README: "몇 초 짧게"). 우아한형제들 글은 wait_timeout보다 약 5초 짧게를 권고한 것으로 정리하며 max-lifetime 50초, 풀 50 이내(RDS 최대 연결 수의 약 50% 유지) 같은 환경별 값을 제시. 컬리는 max-lifetime을 50초로 줄이자 커넥션이 기본(30분) 대비 36배 빠르게 재생성되는 부작용을 보고. 즉 **너무 짧아도 비용**. [블로그]
- MySQL `wait_timeout` 기본값 28800초(8시간) 등 DB별 기본값은 [일반, 이번 미확인].
- 인스턴스 수 x `maximum-pool-size` <= DB `max_connections` 여유. 배포 중 구/신 인스턴스가 동시에 떠 있는 시간까지 계산. [일반]

### 9-3. 풀 크기 산정 근거
- HikariCP wiki "About Pool Sizing": 출발점은 PostgreSQL 프로젝트의 `connections = (core_count * 2) + effective_spindle_count`(코어 수는 HT 제외, 데이터가 전부 캐시면 spindle 0). 저자는 이를 최종값이 아니라 **부하 테스트의 출발점**으로 보라고 한다. 핵심 메시지는 "**작은 풀에 스레드가 대기하는 것**이 낫다": Oracle 시연은 풀을 2048에서 96으로 줄이자 응답이 약 100ms에서 2ms로 개선되었다고 소개. [공식]
- 반례/보정: 한 작업이 **동시에 커넥션을 여러 개 요구**하면 스레드 수 x 필요 커넥션 수만큼 필요하다. 우아한형제들 사례는 MQ 컨슈머 스레드 16개에 풀 기본값 10이라 데드락이 발생, 데드락 회피 최소치에 여유분(+a)을 더하라고 정리. [블로그]
- 실무 절차: ① 인스턴스당 동시 DB 사용 스레드 수 파악(톰캣 스레드 200 전부가 DB를 쓰지는 않음) ② 쿼리 평균 소요시간으로 필요 커넥션 추정(동시성 = 처리량 x 점유시간) ③ DB `max_connections`와 인스턴스 수로 상한 ④ k6로 풀 크기별 p95·pending 비교. ①②는 [일반].
- 사례의 값(카카오페이 `connection-timeout` 10000, `maximum-pool-size` 50, `minimum-idle` 20, 우아한형제들 50 이내)은 **각 시스템에 맞춘 값이지 권장 상수가 아니다**. [블로그]

### 9-4. 풀 고갈의 증상과 확인 방법
- **증상**: 로그에 `HikariPool-1 - Connection is not available, request timed out after 30000ms` 계열 예외(올리브영/카카오페이 글이 같은 증상 보고), 특정 API만이 아니라 DB를 쓰는 모든 요청 지연 후 일제히 실패, CPU는 한가한데 응답이 느림, 스레드 덤프에서 `HikariPool.getConnection` 대기. [블로그 + 일반]
- 원인 후보 3종: (1) 풀이 동시 요청·작업당 커넥션 수보다 작음 (2) 커넥션 점유 시간이 김(느린 쿼리, **트랜잭션 안 외부 호출**, 누수) (3) `max-lifetime`과 DB `wait_timeout` 불일치로 죽은 커넥션 사용. 카카오페이는 타임아웃 시점 메트릭에서 30개 전부 Active인 것을 보고 (1)(2) 계열로 판단, 올리브영은 `maximum-pool-size=1`로 같은 로그를 재현. [블로그]
- **확인 도구**:
  - Actuator/Micrometer: 모든 `DataSource`가 `jdbc.connections` 하위(active/idle/max/min)로, Hikari 전용은 `hikaricp` 접두사로 풀 이름 태그와 함께 노출. `spring.datasource.name`으로 풀 이름 지정. Prometheus에서는 보통 `hikaricp_connections_active/idle/pending`, `hikaricp_connections_timeout_total`, `hikaricp_connections_acquire_seconds`, `hikaricp_connections_usage_seconds`로 보인다(이름은 [일반], 접두사 존재는 [공식]).
  - **active가 max에 붙고 pending이 쌓이면 고갈**. usage(점유 시간) 분포로 누가 오래 잡는지, acquire 시간으로 대기 비용을 본다. [일반]
  - DB 쪽: MySQL `SHOW PROCESSLIST`(또는 `information_schema.processlist`)로 Sleep 상태 장기 커넥션과 실행 중 쿼리 확인, `SHOW STATUS LIKE 'Threads_connected'`. [일반]
  - `leak-detection-threshold` 활성화 시 호출 스택이 포함된 경고. 컬리는 DB Connection 누수 문제 글에서 누수 원인과 진단을 다룸. [블로그]
  - 스레드 덤프(`jcmd <pid> Thread.print`)로 대기 지점 확인. [일반]
- **SI 현장에서 특히 많은 원인**: 트랜잭션 범위가 커서(서비스 전체 `@Transactional`) 외부 호출·파일 처리·대량 루프 동안 커넥션 점유, Open-Session-In-View(`spring.jpa.open-in-view` 기본 true)로 뷰 렌더링/JSON 직렬화까지 커넥션 점유(이 기본값은 [일반]), MyBatis에서 수동 `SqlSession`/`Connection` close 누락, 카카오페이 결제 서비스의 "persistence layer 밖에서는 `@Transactional` 금지" 원칙. [블로그: 카카오페이 JPA Transactional]

### 9-5. 외부 HTTP 클라이언트 커넥션 풀
- **Apache HttpClient 5** (Boot는 클래스패스에 있으면 RestClient 기본 선택 1순위: Apache > Jetty > Reactor Netty > JDK > HttpURLConnection) [공식 Boot rest-client]
  - 풀 파라미터: 전체 최대(`maxTotal`), **라우트(호스트)별 최대(`defaultMaxPerRoute`)**, 풀에서 얻는 대기(connection request timeout), connect timeout, 응답/소켓 타임아웃, TTL, 유휴 evict. 5.x 마이그레이션 가이드는 **유한 TTL 설정을 권고**(`setConnectionTimeToLive(1, MINUTES)` 예시)하고 5.0부터 TTL 0은 "재사용하지 않음"으로 취급한다고 명시. [공식 Apache]
  - **기본값(maxTotal 25, per-route 5 등)은 이번 조사에서 공식 페이지로 확인하지 못했다.** 특히 per-route 기본이 작아 같은 외부 호스트로 몰리면 풀 대기가 먼저 걸린다는 점은 [일반, 확인 불가]. → 실습에서 실측해 확정.
- **Reactor Netty (WebClient 기본)** [공식 Reactor Netty]
  - `HttpClient.create()`는 공유 기본 풀 사용, 원격 호스트당 **500 active channels**. 직접 만든 `ConnectionProvider.builder()`에서 값을 안 주면 `max connections` = max(16, 2 x 가용 CPU).
  - `pendingAcquireMaxCount` 기본 = 2 x maxConnections(-1이면 무제한), `pendingAcquireTimeout` 기본 **45초**(-1이면 비활성), `maxIdleTime`/`maxLifeTime` 기본 **무제한**(장시간 keep-alive 연결이 상대 LB에 끊겨도 모름), `evictInBackground` 기본 꺼짐, `metrics(true)`로 Micrometer `reactor.netty.connection.provider` 접두사 메트릭.
  - 풀 소진 시: 대기열에서 기다리다 `pendingAcquireTimeout` 초과 시 실패, 대기열 한계 초과 시 즉시 거부. 문서는 `maxConnections`를 지나치게 높이면 `PrematureCloseException`(Connect Timeout 원인)이 생길 수 있다고 경고. (`PoolAcquireTimeoutException` 클래스명은 공식 페이지 해당 부분에서 확인하지 못함.)
- **keep-alive 관련 판단**: 상대 서버/LB의 idle 종료 시간보다 **우리 클라이언트의 유휴 보존 시간을 짧게** 둬야 "죽은 연결 재사용 → Connection reset" 오류를 줄인다. 이는 DB의 `max-lifetime < wait_timeout`과 같은 원리. Apache는 TTL/idle evict, Reactor Netty는 `maxIdleTime`/`evictInBackground`로 설정. [일반(원리), 공식(옵션 존재)]
- **풀 고갈 시 증상**: 외부 호출 지연이 갑자기 "상대 응답 시간 + 풀 대기 시간"으로 늘어남, 풀 대기 타임아웃 예외(구현별 이름이 다름), 외부 호출 스레드가 풀 대기에 쌓여 톰캣 스레드까지 고갈(5·8절의 연쇄 장애). 확인: Reactor Netty `metrics(true)`의 pending/active, Apache는 풀 통계(`PoolStats`)를 Micrometer로 바인딩(Micrometer의 Apache 바인더 사용 가능 여부는 [일반, 미확인]), 스레드 덤프. WebClient 사용 사례(올리브영 전시 프로젝트)와 Feign 설정 함정(우아한형제들)은 8절 참조. [블로그]

### 9-6. 로컬 compose 학습 형태: 설정·확인·장애 재현
- 컨테이너: app, **mysql**(`command: --wait_timeout=60 --max_connections=...`로 조절), **toxiproxy**(app → toxiproxy → mysql로 연결 절단/지연), **wiremock**(외부 API 지연), prometheus, grafana, k6.
- 재현 A. **풀 고갈**: `maximum-pool-size=3`, 쿼리에 `SELECT SLEEP(2)` 또는 느린 쿼리 API에 k6 20 VU → Grafana에서 `active=max`, `pending` 상승, 로그에 timeout 예외, 같은 시각 DB는 한가함(`SHOW PROCESSLIST`로 Sleep/Query 상태 확인). `connection-timeout`을 250ms/30s로 바꿔 실패 양상(빠른 실패 vs 느린 실패)을 비교.
- 재현 B. **누수**: 일부러 `Connection`/`SqlSession`을 닫지 않는 엔드포인트 + `leak-detection-threshold=2000` → 경고 로그의 스택으로 위치 찾기, 풀이 점점 말라가는 것 관찰.
- 재현 C. **트랜잭션 안 외부 호출**: 서비스 메서드에 `@Transactional` + wiremock 2초 지연 호출 → 풀 점유 시간(usage) 증가, 호출을 트랜잭션 밖으로 빼서 비교(8-7과 연결). OSIV on/off 비교도 같은 방식.
- 재현 D. **죽은 커넥션**: `wait_timeout=60`인데 `max-lifetime`을 크게 둔 상태에서 60초 이상 유휴 후 요청 → 오류 로그, `max-lifetime`을 wait_timeout보다 짧게 조정해 사라짐 확인. toxiproxy `reset_peer`/`timeout`으로 DB 연결 절단 후 풀 복구 시간 측정.
- 재현 E. **풀 크기 곡선**: 풀 크기 2/5/10/50로 k6 동일 시나리오 실행, p95·RPS·DB CPU 비교(큰 풀이 항상 빠르지 않음을 확인, wiki 주장 검증).
- 재현 F. **외부 HTTP 풀**: Apache HC5 `maxTotal=5, perRoute=2` 또는 Reactor Netty `maxConnections=2, pendingAcquireTimeout=1s` + wiremock 지연 → 풀 대기 예외와 pending 메트릭, 이어서 keep-alive를 무제한으로 둔 클라이언트가 toxiproxy `reset_peer`/서버 측 idle 종료 후 첫 요청에서 실패하는지 확인.

### 9-7. MyBatis/JPA 숙련과의 연결 (SI 우선순위)
- 풀 고갈의 상당수는 **쿼리·트랜잭션 설계**에서 온다. 연결 고리: N+1(JPA `hibernate.default_batch_fetch_size`, fetch join, MyBatis의 collection/association 중첩 select), 1:N 조인과 페이징 충돌(메모리 페이징; id 먼저 조회 후 IN 절 재조회), 오프셋 페이징의 건수 비례 성능 저하(카카오페이 측정: JpaPagingItemReader 10만→50만 건에서 약 13배 느려짐, 커서/zero-offset 방식 대안), 트랜잭션 범위 최소화. [블로그: 우아한형제들 정산 글, 카카오페이 배치 리더 글]
- MyBatis 전용 튜닝 사례(국내 기업 블로그)는 이번 검색에서 **찾지 못했다**. MyBatis 쪽 학습 소재(`#{}` vs `${}`, 동적 SQL, resultMap의 N+1, `fetchSize`)는 [일반].

### 출처
- [공식] https://github.com/brettwooldridge/HikariCP (README: 설정 기본값)
- [공식] https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing
- [공식] https://docs.spring.io/spring-boot/reference/actuator/metrics.html (`jdbc.connections`, `hikaricp` 메트릭)
- [공식] https://docs.spring.io/spring-boot/reference/io/rest-client.html (HTTP 클라이언트 우선순위)
- [공식] https://hc.apache.org/httpcomponents-client-5.5.x/migration-guide/preparation.html (TTL 권고)
- [공식] https://projectreactor.io/docs/netty/release/reference/http-client.html (Connection Pool 절)
- [블로그] 우아한형제들, HikariCP Dead lock에서 벗어나기 이론편 https://techblog.woowahan.com/2664/ / 실전편 https://techblog.woowahan.com/2663/
- [블로그] 컬리, 99%가 모른다는 DB Connection 누수 문제 https://helloworld.kurly.com/blog/connection-leak/
- [블로그] 카카오페이, JPA Transactional 잘 알고 쓰고 계신가요? https://tech.kakaopay.com/post/jpa-transactional-bri/
- [블로그] 카카오페이, [if kakao 2022] Batch Performance를 고려한 최선의 Reader https://tech.kakaopay.com/post/ifkakao2022-batch-performance-read/
- [블로그] 우아한형제들, 잊을만 하면 돌아오는 정산 신병들 https://techblog.woowahan.com/2711/
- [블로그] 올리브영, SQS 기반 알림톡 처리에서 발생한 DB 커넥션 데드락 분석기 https://oliveyoung.tech/2025-12-30/alimtalk_improve_event_driven_architecture/

---

## 10. 게시판 서버에 넣을 운영 계층 미션 (SI 우선순위로 재구성, 16개)

> 우선순위: **A 필수(SI 즉시 투입)** = 커넥션 풀, 외부 연동, 쿼리/트랜잭션 숙련, 기본 관측성 / **B 권장** = 캐시, 동시성, 장애 격리, 배포, 부하 테스트 / **C 선택** = 메시징. 선행 조건의 번호는 이 표의 미션 번호.

| # | 우선 | 미션 | 선행 조건 | 로컬 구성(compose 서비스) | 학습자가 관찰/증명할 것 | 근거 |
|---|------|------|----------|--------------------------|------------------------|------|
| 1 | A | Actuator + Prometheus + Grafana 기본 대시보드, liveness/readiness 설계 | CRUD 기본 | app, mysql, prometheus, grafana | RPS/p95/에러율/Hikari/JVM 패널 작성, DB `docker pause` 시 readiness·liveness 반응, liveness에 DB를 넣으면 재시작 연쇄 재현 | 1절 [공식] endpoints, metrics |
| 2 | A | **HikariCP 설정 해부와 풀 고갈 재현** | 1 | app, mysql, prometheus, grafana, k6 | `maximum-pool-size=3` + 느린 쿼리로 active=max/pending 상승/timeout 로그 재현, `connection-timeout` 250ms vs 30s 실패 양상 비교, 풀 이름 태그로 메트릭 확인 | 9-1, 9-4 [공식] HikariCP, Boot metrics, [블로그] 카카오페이·올리브영 |
| 3 | A | **풀 크기 산정 실험과 DB 한도 계산** | 2 | app x2, mysql(`max_connections` 제한), k6 | 풀 2/5/10/50에서 p95·RPS·DB CPU 곡선, 인스턴스 수 x 풀 크기 <= max_connections 계산서 작성, 배포 중 일시 증가분 포함 | 9-3 [공식] About Pool Sizing, [블로그] 우아한형제들 |
| 4 | A | **max-lifetime과 DB wait_timeout, 커넥션 누수 진단** | 2 | mysql(`--wait_timeout=60`), toxiproxy, app | wait_timeout 이후 죽은 커넥션 오류를 재현하고 max-lifetime을 짧게 해 해소, `leak-detection-threshold`로 누수 위치 특정, `SHOW PROCESSLIST` 대조 | 9-2, 9-4 [공식] HikariCP, [블로그] 컬리, 우아한형제들 |
| 5 | A | **쿼리·트랜잭션 숙련: N+1, 1:N 페이징, 오프셋 페이징, 트랜잭션 범위 축소, OSIV** (JPA와 MyBatis 둘 다 구현) | 2 | mysql(슬로우 쿼리 로그 on), app, k6 | 쿼리 수/응답시간 전후 비교(batch fetch size, fetch join, id 선조회, keyset 페이징), 트랜잭션·OSIV 범위에 따른 Hikari usage 시간 비교 | 9-7 [블로그] 우아한형제들 정산, 카카오페이 배치 리더·JPA Transactional |
| 6 | A | **외부 API 클라이언트: RestClient/HTTP Interface + 타임아웃 3종 + 예산표** | 1 | wiremock, toxiproxy, app | 타임아웃 미설정 시 무한 대기 실측(스레드 덤프), connect/read/풀 대기를 각각 유발해 예외 구분, 상위 SLA 안의 예산표 작성 | 8절 [공식] Boot rest-client, 토스페이먼츠 timeout |
| 7 | A | **외부 HTTP 커넥션 풀 설정·고갈·keep-alive 재현** (Apache HC5 / Reactor Netty 중 택1, 가능하면 둘) | 6 | wiremock, toxiproxy, app, prometheus | per-route/max connections를 작게 두고 풀 대기 예외·pending 메트릭 확인, `reset_peer`로 죽은 keep-alive 연결의 첫 요청 실패와 TTL/maxIdleTime 조정 효과 | 9-5 [공식] Reactor Netty, Apache HC5 |
| 8 | A | **재시도·멱등 키·결과 불명 처리** (알림/결제 모사 POST) | 6 | wiremock(stateful), toxiproxy, mysql, app | `timeout` toxic으로 "상대는 처리, 우리는 실패" 재현, 멱등 키 없는 버전은 이중 처리/있는 버전은 1회, 상태 조회·`UNKNOWN` 재처리 워커, 4xx는 재시도 안 함 | 8절 [공식] 토스페이먼츠 멱등키, [블로그] 카카오페이 |
| 9 | A | **트랜잭션 밖 외부 호출과 연쇄 장애 방어** (서킷브레이커·벌크헤드) | 2, 6, 7 | wiremock, toxiproxy, app, prometheus, k6 | 트랜잭션 안 외부 호출이 Hikari 포화와 무관 API 장애를 일으키는 것 재현, 호출을 밖으로 빼고 서킷+벌크헤드 적용 후 회복 비교, 재시도 증폭 배수 계산 | 8-5·8-7, 5절 [공식] resilience4j, [블로그] 카카오페이·올리브영 |
| 10 | A | **외부 API 인증·마스킹·에러 변환** (OAuth2 client credentials + HMAC) | 6 | wiremock(토큰·서명 스텁), app | 토큰 만료 시 1회 재발급·동시 재발급 방지, 서명 시계 오차 실패 재현, 로그 마스킹 검증, 외부 에러 코드의 내부 예외 변환 테스트 | 8-6 [일반], 토스페이먼츠 authorization 문서(존재 확인) |
| 11 | B | 조회수 캐시 + TTL·스탬피드·다중 인스턴스 로컬 캐시 불일치 | 1 | redis, mysql, app x2, nginx, k6 | 캐시 전후 p95/DB QPS, 동시 만료 스파이크와 지터/락, 인스턴스 간 stale 증명 | 3절 [공식] caching, [블로그] 올리브영, LINE |
| 12 | B | 동시성: 원자 UPDATE vs 낙관적 락 vs Redisson 락, `@Scheduled` 중복과 ShedLock | 11 | redis, mysql, app x3, k6 | 100~1000 동시 요청 정합성·처리시간 비교, 락 해제와 커밋 순서 오류 재현, N대 중복 실행 vs ShedLock 1회, 보유 인스턴스 kill 후 인계 시간 | 4절 [공식] redisson, ShedLock, [블로그] 컬리 |
| 13 | B | 무중단 배포: graceful shutdown, readiness, 하위호환 스키마 변경 | 1 | app x2, nginx, k6 | 지속 부하 중 재기동 시 graceful on/off별 에러 수, 구/신 버전 공존 중 컬럼 변경 재현 | 6절 [공식] graceful-shutdown, [블로그] 컬리 |
| 14 | B | 컨테이너 JVM 메모리·이미지 빌드 비교, k6 병목 리포트 | 1, 5 | app(memory limit), k6, prometheus, grafana | `-Xmx`=한도 vs `MaxRAMPercentage`의 OOMKilled, 이미지 크기·재빌드 시간, 병목 3종(N+1/풀/동기 호출) 전후 비교표 | 6·7절 [공식] efficient-images, k6 thresholds |
| 15 | C | (선택) traceId 전파와 로그-trace 연결 | 1 | app x2, tempo 또는 jaeger | 요청 1건을 trace와 로그로 따라가 지연 구간 지목, 샘플링 변경 효과, `@Async` 경계 traceId 유실 재현 | 1절 [공식] tracing |
| 16 | C | (선택) Kafka 재시도·DLQ·멱등 컨슈머와 아웃박스 | 8 | kafka, kafka-ui, mysql, app | `-dlt` 적재, 컨슈머 kill 후 중복 반영 차이, Kafka 중단 중 직접 발행은 유실/아웃박스는 복구 후 발행 | 2절 [공식] spring-kafka, [블로그] 올리브영, 컬리 |

필수 압축안(일정이 빠듯할 때): 2, 4, 5, 6, 7, 8, 9 (커넥션 풀 + 쿼리 숙련 + 외부 연동), 보조로 1, 11.

---

## 확인 불가 / 한계

1. **국내 기업 블로그 본문은 대부분 검색 결과 요약과 제목으로 존재만 확인**했고 전문을 정독하지 못했다. 위 "[블로그]" 근거는 요지 수준이므로 학습 자료에 인용하기 전에 원문 확인이 필요하다.
2. 토스(toss.tech)의 아웃박스 패턴 글, 카카오페이의 Resilience4j 적용 글, 우아한형제들의 Kafka DLQ 멱등 글은 검색에서 **찾지 못했다**(해당 소스로 단정하지 않았다). 아웃박스는 컬리 글과 외부 설명 자료로 대체했다.
3. Spring Kafka `@RetryableTopic` 세부(토픽 네이밍, 순서 주의, DLT 전략)는 인덱스 페이지만 확인, 하위 페이지 미확인.
4. Spring Boot 공식 페이지에는 `RestClient`/HTTP 클라이언트의 **기본 타임아웃 값이 명시되어 있지 않아**, "기본값이 무한대" 사례(예: `HttpURLConnection`)와 3번째 타임아웃(풀 대기)의 클라이언트별 기본값은 미확인이다. 실습에서 실측으로 확정하도록 설계했다.
5. Spring Cloud OpenFeign의 Spring Boot 4 호환 상태, Resilience4j의 Boot 4 전용 모듈명(공식 페이지는 `resilience4j-spring-boot3`만 확인), Spring Cloud 릴리스 트레인 현황은 미확인.
6. `@Cacheable(sync=true)`, 메트릭 카디널리티 경고, `percentiles-histogram`, `@Observed`는 Boot 공식 페이지의 열람 범위(약 100,000자 중 앞부분) 밖이거나 해당 페이지에 없어 [일반]으로 분류했다.
7. Buildpacks/Jib의 JVM 메모리 자동 계산 동작, Jib 공식 문서는 미확인.
8. 토스페이먼츠 "에러 시 키만 바꿔 재시도는 위험", "승인 실패 시 조회 API로 상태 확인" 안내는 비공식 LLM 참고 문서(`/guides/v2/get-started/llms-quick-reference`)에서 나온 요약이라 공식 본문에서 재확인이 필요하다. 타임아웃 60초 권장은 공식 용어 페이지/검색 요약 기준.
9. Redisson의 `leaseTime` 지정 시 watchdog 비활성 동작은 공식 페이지에서는 "leaseTime 후 자동 해제"만 확인했고 watchdog 비활성은 Medium 요약 주장.
10. Colima에서의 compose resource limit 적용, cgroup v2 환경 JVM 한도 인식, Kafka KRaft 이미지 선택, k6→Prometheus 출력 옵션(`experimental-prometheus-rw`)은 실제로 돌려보지 않았다. 구현 전 PoC가 필요하다.
11. 영문 블로그(Thoughtworks 등), Medium 개인 글, 인프런 Q&A는 신뢰도가 낮아 참고용으로만 표기했다.
12. RabbitMQ와 Kafka의 국내 사례 비교, Spring Session, Debezium CDC 아웃박스 세부는 이번 조사 범위에서 다루지 못했다.
13. 커넥션 풀: Apache HttpClient 5의 `maxTotal`/`defaultMaxPerRoute`/connection request timeout 기본값, Apache·Reactor Netty 풀의 Micrometer 메트릭 바인딩 이름, MySQL `wait_timeout` 기본값, `spring.jpa.open-in-view` 기본값은 공식 페이지에서 확인하지 못했다([일반]로 표기). HikariCP 메트릭 이름(`hikaricp_connections_*`)도 Prometheus 출력으로 직접 확인하지 않았다.
14. MyBatis 전용 튜닝 사례(국내 기업 블로그)는 검색에서 찾지 못했다. SI 현장 사례 자체가 기업 기술블로그에 드물 수 있어 별도 자료(사내 사례, 서적) 필요.
15. 미션 번호는 재구성되어 1~9절 본문 안의 일부 "미션" 언급과 무관하다. 표는 10절이 기준이다.
