# D06 배포 개념 기술 사실 검수

조사일: 2026-10-21 (UTC 기준 웹 확인일, 로컬 날짜 동일)  
검토 원문: `/Users/ds/research/javaexperience-d06-20261021/SOURCE.md` (264줄, SHA-256 `0e67f2ea37cbf166229fc256d1cd3a5b81a9e48a164a9680840b4ec21e0f63f1`). 제공된 기존 경로의 D06 문서와 해시가 달라 이 원문만 검토했다. 아래는 구현 사실과 시각화·실험에서 보존해야 할 범위다.

## 1. Deploy, Release, Launch와 환경 이름

문서가 `Deploy`를 산출물의 환경 반영, `Release`를 버전 확정 또는 공개, `Launch`를 고객 공개라는 구분으로 설명하는 것은 팀별 용어가 다를 수 있음을 이미 밝혀 적절하다. 이를 보편적 표준 정의처럼 그리지 말고 조직 맥락의 용례로 표시한다. `local/dev/QA/stg/prod`도 보편적으로 고정된 환경 분류가 아니다. 특히 QA는 환경, 검증 단계, 팀을 모두 가리킬 수 있다. dev→QA→stg→prod 선형 흐름도 조직에 따라 달라지는 예시다.

검증한 같은 JAR 또는 이미지 digest를 환경별 설정으로 승격하는 것은 추적성 권고이지 보편 규칙은 아니다. 시각화에서 외부 설정·비밀값과 바이너리 변경을 구분한다. Boot는 동일 코드에 YAML, properties, 환경 변수, CLI 값을 외부화한다.[Spring Boot 외부 설정](https://docs.spring.io/spring-boot/4.1/reference/features/external-config.html)

## 2. Spring Boot 4.1.1 설정 우선순위

4.1 문서 URL은 현행 4.1.1 페이지로 리다이렉트하며 헤더에 `Spring Boot 4.1.1`을 표시한다. 전반적 `PropertySource` 순서에서 config data(application YAML 포함)보다 OS 환경 변수, 그보다 Java system properties(`-D`), 그보다 `--key=value` 명령행 인자가 우선한다. 따라서 해당 예시 속 동일 속성 값의 우선순위는 classpath YAML < 환경 변수 < `-Ddemo.greeting=...` < `--demo.greeting=...`이다. OS 변수와 system property 순서는 서로 바뀌지 않으므로 `-D` 값이 환경 변수 값보다 우선한다.[외부 설정 우선순위](https://docs.spring.io/spring-boot/4.1/reference/features/external-config.html)

동일한 `demo.greeting` 값의 일반 우선순위다. `SERVER_PORT`는 `server.port`, `DEMO_GREETING`은 `demo.greeting`의 env 표기다. `SPRING_PROFILES_ACTIVE`는 활성 프로파일과 config data 선택에 영향을 주므로 인사말 값 충돌과 같은 방식으로 그리지 않는다. 프로파일별 YAML 및 외부 파일 위치도 결과에 영향을 준다. `--demo.greeting`은 기본 명령행 속성이다.[Spring Boot 외부 설정](https://docs.spring.io/spring-boot/4.1/reference/features/external-config.html)

## 3. Health, 업무 endpoint, readiness와 liveness

Actuator 의존성과 HTTP 노출·접근 조건을 충족하면 기본 health URL은 `/actuator/health`다. `UP`은 구성된 health indicator의 요약이며 로그인·주문·결제 성공을 증명하지 않는다. 업무 성공은 별도 요청이나 지표로 본다.[Actuator endpoints](https://docs.spring.io/spring-boot/4.1/reference/actuator/endpoints.html)

Actuator liveness/readiness group은 기본 자동 활성화되고 `management.endpoint.health.probes.enabled`로 끌 수 있다. 로컬 설정에서 `true`를 명시할 수 있지만 필수 활성화 설정처럼 그리지 않는다. 기본 경로는 `/actuator/health/liveness`, `/actuator/health/readiness`다. 두 group은 기본적으로 다른 indicator를 추가하지 않는다. 전체 `/actuator/health`는 더 많은 indicator를 합산할 수 있어 readiness와 판정이 다를 수 있다.[Actuator health/probes](https://docs.spring.io/spring-boot/4.1/reference/actuator/endpoints.html)

readiness는 트래픽 수신 준비, liveness는 내부 상태의 자가 회복 가능성 판단이다. 외부 DB 장애를 liveness에 연결하면 대량 재시작과 연쇄 장애를 일으킬 수 있다. 업무 준비 검사를 readiness에 추가하는 것은 선택 설정이다.[Spring Boot availability](https://docs.spring.io/spring-boot/4.1/reference/features/spring-application.html)

Boot 4.1.1 API에서 `AvailabilityChangeEvent`, `ReadinessState`, `ApplicationAvailability`는 `org.springframework.boot.availability` 패키지다. 이벤트 발행으로 `ReadinessState.REFUSING_TRAFFIC` 상태를 알릴 수 있다. 실제 라우터가 이를 반영하려면 외부 구성요소가 probe를 읽고 경로에서 제외해야 한다.[AvailabilityChangeEvent API](https://docs.spring.io/spring-boot/api/java/org/springframework/boot/availability/AvailabilityChangeEvent.html), [ReadinessState API](https://docs.spring.io/spring-boot/api/java/org/springframework/boot/availability/ReadinessState.html)

## 4. Graceful shutdown 동작과 버전 경계

Boot 4.1.1은 embedded Jetty, Reactor Netty, Tomcat에서 graceful shutdown이 기본 활성이다. context 종료 때 진행 중 요청에 유예 시간을 주고 새 요청을 거절한다. `spring.lifecycle.timeout-per-shutdown-phase: 20s`는 앱 lifecycle phase 제한이며 모든 요청·비동기 작업이 20초 안에 완료된다는 보장은 아니다. 외부 supervisor의 유예 시간이 더 짧으면 강제 종료될 수 있어 두 제한을 함께 맞춰야 한다.[Boot graceful shutdown](https://docs.spring.io/spring-boot/4.1/reference/web/graceful-shutdown.html)

SIGTERM은 정상 종료를 시작하지만 SIGKILL, supervisor timeout은 유예 절차를 건너뛸 수 있다. IDE 정지 버튼이 SIGTERM을 보내지 않을 수도 있다. Boot 4.1.1 Tomcat은 종료 후 새 연결과 기존 유휴 연결의 새 요청을 거절한다.[TomcatWebServer 4.1.1 API](https://docs.spring.io/spring-boot/api/java/org/springframework/boot/tomcat/TomcatWebServer.html)

Boot 4 API 위치를 확인했다: `WebServer`는 `org.springframework.boot.web.server.WebServer`, Tomcat 구현은 `org.springframework.boot.tomcat.TomcatWebServer`, shutdown callback·result도 `org.springframework.boot.web.server` 아래다. 예전 클래스 패키지를 이미지 라벨이나 코드 예시에 복사하지 않는다. `WebServerApplicationContext.GRACEFUL_SHUTDOWN_PHASE`가 lifecycle phase 기준이며 4.0부터 deprecated `WebServerGracefulShutdownLifecycle`보다 권장되는 API다.[WebServer API](https://docs.spring.io/spring-boot/api/java/org/springframework/boot/web/server/WebServer.html), [WebServerApplicationContext API](https://docs.spring.io/spring-boot/api/java/org/springframework/boot/web/server/context/WebServerApplicationContext.html)

## 5. 자체 slow request 종료 관찰 실험의 한계

추가 fixture에서 release 파일로 자체 느린 HTTP 요청의 완료를 조절하고, 요청 진입을 관찰한 다음 해당 JVM에 SIGTERM을 보내 release 후 기존 요청의 200 응답과 프로세스 종료를 확인한다면, 그 관찰은 그 한 요청과 해당 로컬 실행에서 graceful drain이 작동했다는 증거다. 원문은 이미 생성된 Boot 앱만 가정하므로 request handler, release file, Java main/router, H2 schema는 원문 코드가 아니라 새 fixture라고 화면·캡션·실험 로그에서 명시한다.

그 한 건으로 모든 동시 요청, 비동기 작업, 메시지 소비, 백그라운드 task, 외부 side effect, 무중단 배포, SLA를 보장한다고 일반화하면 안 된다. 관찰값은 고정된 실험 결과로만 기록하고 속도나 오류율을 만들어내지 않는다. CLI timeout 1초 변형은 YAML의 `timeout-per-shutdown-phase: 20s`와 서로 다른 종료 제한 경로의 별도 변형이다. timeout 1초가 모든 플랫폼의 강제 종료 제한을 뜻한다고도 쓰지 않는다.

## 6. Rolling, blue-green, canary, feature flag와 호환성

Rolling은 인스턴스 일부씩 교체한다. Blue-green은 두 환경 간 경로 전환, canary는 작은 사용자/서버 집단에 새 버전을 먼저 노출해 관찰 후 확대, feature flag는 배포된 코드 동작의 조건부 제어다. 토글을 canary에 쓸 수 있어도 인프라 롤아웃과 같은 전략은 아니다.[Blue-green](https://martinfowler.com/bliki/BlueGreenDeployment.html), [Canary release](https://martinfowler.com/bliki/CanaryRelease.html), [Feature toggles](https://martinfowler.com/articles/feature-toggles.html)

전략 공통으로 구·신 앱이 잠시 같이 돌 수 있으므로 API 계약, 세션 형식, 메시지 포맷, shared DB schema/데이터 변경의 공존 호환성이 필요하다. 단순 앱 사본 두 개나 toy Python router의 route switch는 DNS, 실제 로드밸런서, Kubernetes Service/Gateway, 연결 draining, 용량 조정 등을 입증하지 않는다. 그 그림은 전략의 최소 개념 도식으로 표시한다.

## 7. Kubernetes Deployment와 weighted canary 경계

Deployment의 기본 strategy는 `RollingUpdate`; `maxUnavailable`과 `maxSurge`는 업데이트 중 가용/추가 Pod 수 범위를 제어한다. readiness 실패 Pod는 Service 트래픽을 받지 않으며 liveness/startup 실패는 컨테이너 재시작으로 이어진다. 종료 시 `terminationGracePeriodSeconds` 뒤 컨테이너 런타임이 종료를 강제할 수 있다. Deployment는 rollout 상태·revision·undo를 제공하지만 rollback은 Pod template revision을 되돌릴 뿐 DB/외부 side effect 복구는 아니다.[Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/), [Kubernetes probes](https://kubernetes.io/docs/concepts/workloads/pods/probes/)

기본 Deployment rolling만으로 HTTP 요청을 90/10처럼 weighted canary 분할한다고 설명하면 안 된다. Kubernetes 공식 canary tutorial은 stable/canary Deployment와 Service를 별도로 만들고, 정확한 퍼센트는 Gateway API `HTTPRoute` weight와 Gateway controller를 예시로 든다. replica 수에 따른 분배와 HTTP 비율은 같지 않을 수 있다.[Kubernetes canary tutorial](https://kubernetes.io/docs/tutorials/stateless-application/canary-deployment/)

## 8. Canary 표본과 판정의 범위

canary는 범위가 작은 실사용 표본이다. 사용자 특성·시간대·트래픽 종류에 치우치거나 드문 경로를 포함하지 않을 수 있다. 시작 전 비교 기준, 최소 관찰 기간/요청 범위, 오류율·지연·업무 성공률의 확대·중단 조건을 정하는 것이 바람직하다. 소수 요청 몇 건을 관찰한 사실은 그 요청들의 결과만 말해 준다. 일반 모집단의 오류 확률이나 성능 차이를 추론하기에는 표본 수·대표성·대조 조건이 필요하다. 사전 기준 없이 사후 결과만 보고 “안전/성능 개선”으로 확대하지 않는다.[Canary release](https://martinfowler.com/bliki/CanaryRelease.html)

## 9. Expand-migrate-contract와 앱 롤백

`full_name`에서 `given_name`·`family_name`으로 가는 예시는 expand(새 컬럼 추가), migrate(호환 앱의 읽기/쓰기 전환과 수동 backfill), contract(구 사용 종료를 확인한 뒤 구 컬럼 제거)로 나누는 것이 Fowler의 Parallel Change 단계와 일치한다. 옛 컬럼이 제거된 이후 구 앱을 실행하면 실패할 수 있다. 앱 이미지/Deployment 롤백은 DB schema나 이미 수행된 데이터 변환, 외부 side effect를 되돌리지 않는다. 데이터 복구나 roll-forward는 별도 계획이어야 한다.[Parallel Change](https://martinfowler.com/bliki/ParallelChange.html), [Kubernetes rollback](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)

추가 H2 예제는 이름 하나를 수동 분리하는 toy fixture다. 일반 이름 파싱, 대량 backfill, 온라인 DDL, Flyway, MySQL/운영 DB는 검증하지 않는다. H2 메모리 DB는 JVM 내에서 공유되며 마지막 연결 종료 시 기본적으로 데이터가 사라진다. 조사일 최신은 2.5.252이고 2.4.240은 이전 버전이다. features 페이지에 버전 헤더가 없어 이 설명을 2.4.240 전용 검증으로 표현하지 않는다.[H2 Features](https://h2database.com/html/features.html), [H2 changelog](https://h2database.com/html/changelog.html)

## 10. nohup, systemd, container, PaaS 책임

`nohup java -jar ... &`는 프로세스를 셸로부터 분리하는 실행 예시이지, 운영 배포 관리자·부팅 자동 등록·재시작 정책을 자동 구성하지 않는다. systemd service는 unit 설정에 따라 프로세스 실행·종료·재시작을 관리한다. 서비스 등록과 `Restart=` 정책은 unit 내용에 달렸다. Container는 실행 단위 포장이고 단독으로 rollout, traffic routing, persistent storage, secret 관리가 생기지 않는다. PaaS는 실행·확장·수명 관리 일부를 맡지만 조직의 변경 승인이나 사용자 공개 결정을 대신한다고 단정할 수 없다.[systemd.service](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html)

이번 검토 및 시각화 범위는 로컬 문서 대조와 공개 공식 문서 읽기다. 실제 Java 앱, Java 25, 포트 8080, 실제 prod, 클라우드 계정, registry, Kubernetes 클러스터, 외부 서비스는 확인·실험하지 않았다. 추가 fixture는 부모가 별도 구현·기록할 예정인 것으로 전제하며, 조사자는 코드·프로세스·DB를 실행하지 않았다.

## URL별 접근 이력

접근 상태와 한계는 [`source-access.json`](source-access.json)에 기록했다. Boot `/4.1/` 문서는 4.1.1로 리다이렉트됐고, `/4.1.1/reference/...` 직접 URL은 열리지 않았다. H2 features에는 버전 헤더가 없고 최신 changelog는 2.5.252, 2.4.240은 이전 릴리스다. Kubernetes 상단은 v1.37을 최신으로 표시했다.
