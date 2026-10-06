# S17. Spring Boot 애플리케이션 성능

> - 성능 튜닝은 숫자를 크게 올리는 일이 아니라 포화 지점을 찾아 제한을 맞추는 일이다.
> - Tomcat worker, DB 커넥션 풀, DB 처리 능력은 각각 다른 자원이며 가장 좁은 곳이 전체 처리량을 제한한다.
> - 지표와 현실적인 부하로 가설을 검증하고, 시작 시간·메모리·지연 시간·오류율을 함께 본다.

## 1. 왜 알아야 하나

장애 때 Tomcat 스레드를 200에서 800으로 올렸더니 DB 풀 대기와 API p99가 함께 나빠질 수 있다. worker는 실행 자리를 늘려도 DB 처리 능력을 늘리지 않는다. 나머지 요청은 커넥션을 기다리며 worker와 메모리를 점유해 큐·timeout을 키운다. “스레드 부족” 로그만 보고 숫자를 바꾸면 병목을 옮길 뿐이다.

서버의 `connection-timeout`을 요청 제한 시간으로 착각해도 안 된다. 이 값은 Tomcat이 HTTP 연결에서 요청 데이터를 기다리는 단계와 관련되며 DB 쿼리 실행을 막지 않는다. DB가 끝나기 전에 프록시가 연결을 끊으면 서버 작업이 계속될 수 있다. 계층별 제한이 맞지 않으면 재시도까지 겹쳐 부하가 커진다.

기동 시간도 같은 원리다. “Started in 8 seconds”라는 합계만으로는 느린 자동 구성, 데이터베이스 연결, 빈 생성 중 무엇을 고칠지 알 수 없다. 지연 초기화로 시작 로그만 빨라졌는데 첫 사용자 요청이 설정 오류로 실패할 수도 있다. 측정 없이 옵션을 바꾸지 말고, 원인과 사용자에게 보이는 지연을 따로 확인해야 한다.

## 2. 핵심 개념

| 용어 | 뜻 | 성능 해석 |
|---|---|---|
| Tomcat worker | 서블릿 요청 작업을 실행하는 스레드 | 동시에 실행할 요청 수의 상한. DB 처리량을 늘리는 설정은 아니다. |
| `max-connections` | Tomcat이 처리할 수 있는 연결 수 한도 | 소켓 연결 상한이며 실제 요청 worker 수와 같지 않다. |
| `accept-count` | 연결 수 한도에 닿았을 때 연결을 받을 대기 영역 | 처리량을 늘리지 않고 대기를 허용한다. 대기가 길면 클라이언트 지연만 키운다. |
| HikariCP pool | 애플리케이션과 DB 사이의 재사용 커넥션 집합 | 풀의 크기는 DB에 동시 실행을 허용하는 폭이다. 풀을 무조건 크게 하면 DB 경합을 키운다. |
| active / idle / pending | 사용 중 / 대기 중 아닌 / 커넥션을 기다리는 풀 상태 | pending이 지속되면 풀 또는 DB 처리 능력이 병목일 수 있다. DB 지표와 함께 판단한다. |
| 기동 시간 | 프로세스 시작부터 애플리케이션 준비까지 걸린 시간 | 합계와 단계별 비용을 분리해야 개선할 곳을 찾는다. |
| lazy initialization | 빈을 컨텍스트 시작 때 만들지 않고 처음 필요할 때 생성 | 기동 비용을 첫 요청으로 옮긴다. 오류 발견 시점도 늦춰진다. |
| p95 / p99 | 전체 요청 중 95% / 99%가 그 시간 안에 끝난다는 분위수 | 평균이 감추는 긴 꼬리 지연을 보여준다. SLO는 보통 상위 분위수와 오류율로 정한다. |

### 헷갈리는 한계값

| 설정 또는 지표 | 제한하는 것 | 제한하지 않는 것 |
|---|---|---|
| `server.tomcat.threads.max` | worker 스레드 수 | DB 커넥션 수, DB 처리량, 총 HTTP 연결 수 |
| `server.tomcat.max-connections` | 연결 수 | 동시에 실행 가능한 요청 worker 수 |
| `server.tomcat.accept-count` | 연결 한도 도달 시 대기 수용 | 서버가 처리할 수 있는 초당 요청 수 |
| `spring.datasource.hikari.maximum-pool-size` | 인스턴스 한 개가 보유할 DB 연결 수 | 모든 애플리케이션 인스턴스의 총 연결 수 |
| `server.tomcat.connection-timeout` | HTTP 연결에서 요청 데이터를 기다리는 시간 | 동기 Controller나 SQL 전체 실행 시간 |
| Hikari `connection-timeout` | 풀에서 커넥션을 얻기 위해 기다리는 시간 | 이미 얻은 커넥션으로 실행하는 쿼리의 시간 |
| 요청 처리 deadline | 애플리케이션이 한 요청에 허용하는 전체 예산 | 그 요청을 호출한 클라이언트 자체의 대기 제한 |

Spring Boot 4.1.1의 공통 속성 문서에서 Tomcat worker 기본값은 `server.tomcat.threads.max=200`, `min-spare=10`이다. `max-queue-capacity`의 문서 기본값은 2147483647이며 0보다 큰 값에서 설정이 적용된다. 이는 운영에서 대기열을 사실상 무제한으로 열어 두라는 권고가 아니다. 큐가 쌓이면 완료율은 늘지 않은 채 대기 시간과 메모리 점유가 늘 수 있으므로 실제 부하와 실패 동작을 보고 제한한다. 값은 [공통 속성 문서](https://docs.spring.io/spring-boot/appendix/application-properties/index.html)의 현재 버전을 기준으로 삼고, 배포 버전에서 다시 확인한다.

## 3. 내부 동작·원리

### 요청 경로와 포화 전파

```text
클라이언트
   │ 요청·deadline
   ▼
로드밸런서 / 프록시 ── 제한 시간·연결 제한
   │
   ▼
Tomcat 연결 수 → worker / executor queue
   │ 요청 실행
   ├── CPU / 메모리 / 파일·네트워크 I/O
   ▼
HikariCP ── idle 있으면 대여, 없으면 대기(pending)
   │
   ▼
DB ── CPU·디스크·락·동시 세션 한도
```

Tomcat worker가 늘면 대기 요청 중 더 많은 수가 애플리케이션 코드를 실행할 수 있다. 요청 대부분이 CPU 작업이라면 코어보다 훨씬 많은 플랫폼 스레드는 문맥 교환 비용을 높인다. 요청 대부분이 블로킹 I/O라면 실행 스레드는 I/O 완료를 기다리며 다른 작업에 CPU를 양보하므로 코어 수보다 많은 worker가 유리할 수 있다. 그러나 이 효과도 DB와 외부 서비스의 동시 처리 능력 안에서만 유효하다.

Hikari 풀 크기는 “요청 스레드 수와 같게” 정하는 값이 아니다. DB는 CPU, 저장장치, 네트워크, 락 경합과 쿼리 특성에 따라 동시에 효율적으로 처리할 수 있는 양이 달라진다. 풀을 크게 하면 더 많은 SQL이 동시에 DB로 들어가 경합, 컨텍스트 전환, 캐시 압박을 높일 수 있다. HikariCP의 pool sizing 문서는 Oracle Real-World Performance 시연에서 풀을 줄인 특정 조건에 응답 시간이 약 100ms에서 2ms로 줄었다는 사례를 소개한다. 이는 블로그/영상 인용 사례이지 일반적인 보장값이 아니다. 핵심은 작은 풀부터 실제 쿼리 부하로 확인하는 것이다.

전체 연결 예산은 인스턴스별 값으로 계산한다.

```text
최대 동시 DB 연결 ≈ (애플리케이션 replica 수 × 인스턴스별 maximum-pool-size)
                  + 배치·관리 도구·다른 서비스의 DB 연결
```

롤링 배포 중에는 구 버전과 신 버전 인스턴스가 동시에 살아 있을 수 있다. 평시 replica 수만 곱해 DB 연결 한도를 맞추면 배포 순간에 초과할 수 있다. DB 운영·모니터링용 여유분을 남기고, 배포 중 최대 인스턴스 수를 기준으로 계산한다.

### 시간 제한의 전파

바깥 제한을 설정해도 내부 작업이 자동 취소되지는 않는다. 일반적인 동기 요청의 예산을 다음처럼 나눈다.

```text
DB 쿼리 제한 < 애플리케이션 요청 예산 < 프록시 응답 제한 < 호출자 제한
```

바깥 제한에는 애플리케이션이 오류를 전달할 여유를 둔다. 순차 DB·HTTP 호출의 제한 합계는 요청 예산 안에 두고, 외부 호출은 남은 deadline 이내로 제한한다. 모든 계층이 같은 값이면 정리할 시간이 없고 실패 지점도 알기 어렵다.

Tomcat의 `connection-timeout`, 애플리케이션의 요청 deadline, Hikari의 커넥션 획득 제한, JDBC/DB의 쿼리 제한은 서로 다른 단계다. DB 드라이버나 데이터베이스가 쿼리 취소를 어떻게 처리하는지는 사용하는 드라이버·DB와 설정에 달려 있다. 애플리케이션이 클라이언트 연결 종료를 알아차렸다는 이유만으로 이미 시작한 모든 JDBC 작업이 즉시 중단된다고 가정하지 않는다. 재시도는 실패를 더 빠르게 만들 수도 있지만, 원래 요청이 계속 실행 중이면 DB 부하를 중복시킨다.

### 기동 시간 계측과 lazy initialization

SpringApplication 로그는 전체 시작 시간만 보여 주므로 느린 빈은 `ApplicationStartup` 단계 기록으로 찾는다. `BufferingApplicationStartup`은 단계별 시간을 유한 버퍼에 저장한다. 가득 차면 기록이 멈추므로 용량·필터·drain을 고려한다. Actuator `startup` endpoint에는 이 구성이 필요하다.

`@Lazy` 또는 전역 지연 초기화는 singleton 생성을 첫 요청으로 미룬다. eager singleton이 의존하면 시작 중 생성될 수 있다. 기동 검증을 늦추고 첫 요청을 느리게 할 수 있으므로 단계별 계측 후 사용하고 콜드 스타트도 잰다.

### 메모리 사용을 추적하는 순서

1. 같은 트래픽·인스턴스 수에서 기준선을 만든다. 프로세스 메모리와 컨테이너 한도, JVM heap의 used/committed/max를 같은 시간축에 놓고 배포·트래픽 이벤트를 표시한다.
2. 순간 최대치보다 부하 전후의 추세를 본다. 트래픽이 줄고 수집 주기가 지나도 heap 사용량이 계속 올라가는지, 재시작 후에만 내려가는지, 부하 때만 높아지는지 구분한다.
3. heap 압력이라면 힙 덤프를 수집해 큰 객체와 참조 경로를 조사한다. Actuator `heapdump`는 덤프 파일을 반환하므로 민감 데이터가 포함될 수 있고, 큰 파일 생성이 서비스에 부담을 줄 수 있다. 장애 중 무작정 반복 호출하지 말고 인증·노출·보관을 통제한다.
4. 프로세스 RSS 또는 컨테이너 메모리만 늘고 heap 사용이 설명하지 못하면 direct buffer, 스레드 스택, 메타데이터와 JVM 밖 메모리 등 heap 외부를 조사한다. 컨테이너 메모리 한도와 JVM heap 한도는 같은 값이 아니다.
5. 변경 전후 같은 부하에서 메모리 기울기, GC 후 생존량, 요청 지연과 오류율을 비교한다. 힙을 무조건 키우면 컨테이너 OOM을 해결하는 게 아니라 늦출 수 있다.

Actuator/Micrometer는 메트릭을 레지스트리에 연결해 시간에 따른 JVM과 프로세스 상태를 관측하는 기반을 제공한다. 진단 endpoint를 켜는 것과 HTTP로 외부에 노출하는 것은 별도 설정으로 확인한다. Boot endpoint 문서는 웹 애플리케이션에서 `heapdump`를 제공하며 endpoint 접근 정책상 기본 unrestricted 예외에 해당한다고 설명한다. 그렇다고 모든 애플리케이션에서 자동으로 외부 공개된다는 뜻은 아니지만, 운영 노출 목록과 인증·접근 제어를 반드시 확인해야 한다.

## 4. 코드로 확인

다음 숫자는 공통 기본값이 아니라 시작점 예시다. 실제 replica 수, DB 용량, 지연 목표에 맞춰 부하 시험으로 바꾼다.

### 예제 1 — Tomcat, Hikari, 시간 제한의 출발 설정

```yaml
# application.yml — Boot 4.1 설정 예시 (미실행)
server:
  tomcat:
    threads:
      max: 120
      min-spare: 10
      max-queue-capacity: 64
    max-connections: 1000
    accept-count: 100
    connection-timeout: 5s

spring:
  mvc:
    async:
      request-timeout: 8s
  datasource:
    hikari:
      maximum-pool-size: 16
      connection-timeout: 1500ms
      validation-timeout: 1000ms
```

`connection-timeout: 5s`는 요청 전체 처리 deadline이 아니다. MVC async 제한은 비동기 응답 처리에 대한 제한이며 일반 동기 Controller의 SQL 실행 제한으로 오해하면 안 된다. Hikari의 `connection-timeout`은 풀에서 연결을 기다리는 단계다. 쿼리 실행에는 DB/JDBC 쿼리 제한을 별도로 적용하고, 요청의 남은 예산과 일치시킨다. 예시의 16개 풀을 replica 5개가 쓰면 애플리케이션만으로 최대 80개 연결을 점유할 수 있으므로 DB 전체 예산과 비교해야 한다.

### 예제 2 — 단계별 Spring 기동 기록

```java
// Spring Boot 4.1 예시 (미실행)
package com.example.performance;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.metrics.buffering.BufferingApplicationStartup;

@SpringBootApplication
public class PerformanceApplication {

    public static void main(String[] args) {
        SpringApplication application =
                new SpringApplication(PerformanceApplication.class);
        application.setApplicationStartup(new BufferingApplicationStartup(2_048));
        application.run(args);
    }
}
```

이 코드는 Spring Boot 기동 단계를 저장할 뿐 측정 결과를 자동으로 개선하지 않는다. `startup` Actuator endpoint로 확인하려면 Actuator 의존성 및 endpoint 노출·접근 정책을 별도로 구성한다. 운영에 둘 경우 버퍼 용량과 endpoint 보안을 점검한다. 계측 전후로 시작 시각만 비교하지 말고 어떤 단계가 줄었는지 확인한다.

### 예제 3 — k6에서 요청률과 SLO를 함께 고정

```javascript
// load.js — k6 실행 예시 (미실행)
import http from 'k6/http';

export const options = {
  scenarios: {
    api: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 50,
      maxVUs: 200,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<300', 'p(99)<800'],
  },
};

export default function () {
  http.get(`${__ENV.BASE_URL}/api/orders`);
}
```

예를 들어 `BASE_URL=https://staging.example.com k6 run load.js`처럼 실행한다. 50 req/s와 임계값은 문법 예시일 뿐 서비스 SLO나 목표 부하가 아니다. 시나리오 executor는 고정 VU, 반복 수, 도착률 등 서로 다른 부하 형태를 모델링한다. 고정 도착률은 요청 처리 시간이 늘어도 시작 요청률을 유지하려는 부하에 적합하지만, 생성기 자체가 충분한 VU와 자원을 확보했는지 확인해야 한다. threshold는 시험 결과를 성공/실패로 판정해 CI에서 SLO를 강제하는 기준이 된다.

## 5. 버전별 변화 — 왜 바뀌었나

- **Spring Boot 2.4.0 — `BufferingApplicationStartup` 도입.** 전체 시작 로그만으로는 개별 초기화 단계의 비용을 분리하기 어려워 단계별 기록과 시간 분석을 위한 구현이 추가됐다. API 문서가 `Since: 2.4.0`으로 명시한다. 현재 문서 기준 Boot 4.1에서는 클래스 패키지가 `org.springframework.boot.context.metrics.buffering`이다.
- **Java 19·20 preview → Java 21 정식화 — Virtual Threads (JEP 444).** 전통적인 스레드당 요청 방식은 많은 블로킹 I/O 대기 작업에서 플랫폼 스레드 관리 비용이 커질 수 있어, 더 가벼운 동시성 방식이 도입됐다. Boot의 Tomcat 속성 문서도 virtual threads가 활성화되면 `server.tomcat.threads.max`가 영향을 주지 않는다고 명시한다. 가벼운 스레드가 CPU나 DB 연결을 늘리지는 않으므로 DB 풀과 downstream 한도는 계속 측정한다.
- **현재 기준 — Boot 4.1.1 / Framework 7.0.9.** 서버 속성 이름과 기본값은 버전에 따라 문서에서 확인한다. 이 문서의 worker 기본값은 Boot 4.1.1 공통 속성 문서 기준이며, 오래된 블로그의 Tomcat 설정 키나 기본값을 복사하지 않는다.

## 6. 실무 가이드

- Tomcat worker가 max에 붙지만 DB 풀 여유·CPU 비포화라면 worker를 조금 늘려 p95/p99·오류율·큐를 비교한다. `max-queue-capacity`는 유한하게 둔다.
- DB `pending`·CPU·락 대기가 늘면 worker를 키우지 말고 쿼리 시간과 전체 연결 예산을 본다. 풀은 DB 처리량이 늘어나는 범위에서 정한다.
- 연결 대기 없이 연결 수 한도에 닿으면 `max-connections`와 keep-alive를 본다. `accept-count`를 키우면 대기가 길어질 수 있다.
- I/O 중심 요청에 플랫폼 스레드가 병목이고 Java 21 이상을 쓰면 virtual threads를 검토한다. 전환 후에도 DB 풀, 외부 API 동시 호출 제한, 메모리와 p99를 같은 부하로 검증한다. ThreadLocal 사용량이나 제한된 리소스 동시 진입을 살핀다.
- 준비 시간이 문제면 시작 로그와 `BufferingApplicationStartup`으로 느린 단계를 찾고, 해당 초기화만 제거·병렬화·지연한다.
- 첫 요청만 느린 서비스는 lazy initialization, DNS/커넥션 생성, JIT 등 cold path를 조사한다. readiness 이후 워밍업 요청을 허용할 수 있는지와 시작 시 구성 오류 검증이 필요한지 함께 판단한다.
- p99가 사용자 제한 시간에 닿으면, 먼저 전체 요청 deadline을 정하고 DB·외부 HTTP 작업마다 남은 예산 이내의 하위 timeout을 둔다. 프록시와 클라이언트에는 오류 응답을 전달할 여유를 준다.
- heap이 상승하면 트래픽과 heap 사용 추세를 기록한 뒤 dump를 비교한다. RSS만 상승하면 힙만 키우지 말고 컨테이너 한도와 heap 밖 사용을 구분한다.
- **기본값 추천:** Boot 기본 worker에서 시작하고, Hikari 풀은 전체 DB 연결 예산 안의 작은 값으로 고정해 부하 시험으로 조정한다. 요청 대기열은 측정 가능한 유한값으로 둔다.

### 부하 시험 설계

1. 질문과 조건을 고정한다. 예: “풀을 12에서 16으로 바꾸면 같은 DB 데이터·replica·JVM에서 100 req/s의 p99와 DB CPU가 어떻게 달라지는가?” 생성기가 먼저 CPU·네트워크 포화에 닿지 않도록 분리한다.
2. 기준·목표·한계·급증·장시간 안정성 부하를 구분하고, 매번 설정 하나만 바꾼다. 처리량, p50/p95/p99, 오류율, Tomcat worker·queue, Hikari active/idle/pending, DB CPU·대기·락, 메모리를 같은 시간축으로 본다.
3. 시험 후 큐·커넥션 대기·메모리가 정상으로 돌아오는지 확인한다. 회복되지 않으면 누수, 재시도 폭주, 정리 지연이 남았을 수 있다.

k6은 JavaScript 시나리오에 executor와 metric threshold를 선언하는 방식이라 작은 스크립트와 CI 성능 게이트를 만들기 쉽다. Gatling은 시뮬레이션에 `injectOpen` 또는 `injectClosed` 프로파일을 설정하고 주입 단계를 순서대로 조합하며 Java, Kotlin, Scala, JavaScript API를 제공한다. open 모델은 사용자 도착률을 고정하는 서비스 트래픽에, closed 모델은 동시 사용자 수와 사용자 think time이 부하를 정하는 경우에 가깝다. 어떤 도구든 스크립트가 실제 사용자 경로, 인증, 데이터 분포, think time을 대표하는지가 결과 신뢰도를 좌우한다.

## 7. 함정·안티패턴

1. **worker 숫자만 크게 올림** — busy thread 경고는 줄었는데 p99와 DB 대기가 악화된다 → 처리량이 아니라 동시에 실행·대기하는 작업만 늘었다 → CPU, Hikari pending, DB wait를 함께 확인하고 가장 먼저 포화되는 자원을 제한한다.
2. **풀 크기를 요청 스레드 수와 1:1로 설정** — DB 세션 수가 replica 수와 함께 폭증한다 → 인스턴스별 한도만 보고 전체 연결 예산을 계산하지 않았다 → 배포 중 최대 replica와 batch·운영 연결까지 더해 DB 한도 내에서 재시험한다.
3. **대기열을 크게 잡으면 안전하다고 판단** — 오류는 줄어 보여도 사용자는 오래 기다린 뒤 timeout을 받는다 → queue는 처리 능력을 추가하지 않고 지연을 저장한다 → 지연 SLO를 기준으로 유한 큐·빠른 거절·부하 차단을 설계한다.
4. **Tomcat connection timeout을 쿼리 timeout으로 착각** — 느린 SQL은 계속 실행되고 클라이언트만 먼저 끊긴다 → 연결 수신, 요청 처리, 풀 대기, SQL 실행은 서로 다른 단계다 → 단계마다 제한을 두고 애플리케이션 deadline과 취소 동작을 확인한다.
5. **클라이언트 timeout을 높이고 재시도 추가** — 원 요청과 재시도가 함께 DB에 도착해 장애가 더 커진다 → 호출자가 포기해도 서버 작업이 취소된다는 보장이 없다 → idempotency, 재시도 횟수·backoff·jitter, 남은 deadline, 실제 취소 전파를 점검한다.
6. **lazy initialization을 켜고 시작만 측정** — 기동은 빨라졌지만 첫 요청 p99가 커지거나 첫 사용자에게 구성 오류가 노출된다 → 비용과 실패 발견 시점을 요청 경로로 옮겼다 → startup 단계와 cold request를 각각 재고 readiness 전 검증·워밍업 여부를 결정한다.
7. **heap만 보고 컨테이너 메모리를 판단** — JVM heap은 안정적인데 컨테이너 OOM으로 재시작한다 → RSS에는 direct memory, 스레드 스택 등 heap 외부 영역도 포함된다 → cgroup 메모리, 프로세스 RSS, heap을 같은 축에서 비교한다.
8. **평균 응답 시간으로 통과 판정** — 평균은 괜찮지만 일부 요청이 timeout을 넘는다 → 극단 지연 꼬리가 평균에 가려졌다 → 요청 유형별 p95/p99와 오류율 threshold를 정하고 같은 데이터 크기로 반복한다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. Tomcat worker를 늘렸는데 처리량이 줄 수도 있는 이유는?

worker는 동시에 실행 가능한 서블릿 작업의 수만 늘린다. DB나 CPU가 이미 포화이면 추가 worker는 더 많은 경쟁 요청과 문맥 전환, 커넥션 대기를 만든다. busy worker 수 하나만 보지 말고 DB 풀 pending, DB wait, p99가 함께 어떻게 움직이는지 확인한다.

- **꼬리질문:** worker가 max에 붙고 CPU가 낮으면 무엇을 볼까? **답:** 요청이 블로킹 I/O인지, 외부 연결·DB 커넥션을 기다리는지 확인한다. downstream 대기가 원인이면 worker 증가보다 해당 연결·timeout·병렬 호출 제한을 먼저 본다.

### Q2. Tomcat thread 수와 `max-connections`는 어떻게 다른가?

thread 수는 worker가 처리할 작업 수이고, `max-connections`는 받아들일 연결 수 한도다. keep-alive 연결은 요청을 실행하지 않는 동안에도 연결 수에 포함될 수 있다. 연결 한도가 worker 수보다 커도 동시에 처리 가능한 worker가 저절로 늘지는 않는다.

- **꼬리질문:** `accept-count`를 올리면 처리량이 늘까? **답:** 처리량은 그대로다. 연결 한도에 도달한 뒤 대기를 더 허용해 응답 지연을 늘릴 수 있으므로 제한 시간과 함께 결정한다.

### Q3. Hikari 풀을 키우면 DB 처리량이 항상 늘지 않는 이유는?

동시 커넥션이 늘면 DB가 동시에 처리해야 할 쿼리도 늘어난다. DB CPU, 디스크, 락, 메모리 한계에서는 경합 때문에 전체 완료 시간이 오히려 나빠질 수 있다. 풀은 DB가 실제로 처리량을 더 내는 범위에서 부하 시험으로 조정한다.

- **꼬리질문:** 앱 replica가 두 배가 되면 풀도 그대로 두어도 될까? **답:** 인스턴스별 풀 값이 같으면 총 연결은 두 배가 된다. 배포 중 최대 replica와 다른 DB 사용자의 연결까지 포함해 전체 예산을 다시 계산한다.

### Q4. `server.tomcat.connection-timeout`을 요청 제한 시간으로 써도 될까?

안 된다. 이 설정은 HTTP 연결에서 요청 데이터를 기다리는 단계와 관련 있고, 동기 Controller의 전체 실행 시간이나 SQL 시간을 제한하지 않는다. Hikari 커넥션 획득 제한, 쿼리 제한, 애플리케이션 deadline, 프록시 timeout을 단계별로 둬야 한다.

- **꼬리질문:** 외부 호출이 timeout되면 내부 서버 작업도 취소될까? **답:** 반드시 그렇지 않다. 취소 신호가 HTTP client, 애플리케이션 로직, JDBC 드라이버와 DB까지 전달되는지 따로 검증한다.

### Q5. `BufferingApplicationStartup`은 어떤 문제를 해결하나?

전체 기동 시간만으로 알기 어려운 단계별 초기화 비용을 기록한다. 버퍼 크기를 넘으면 새 단계가 기록되지 않으므로 용량을 정하고 필요하면 필터링하거나 drain한다. 결과를 보고 비용이 큰 구성·빈 생성을 찾으며, 계측 자체가 성능을 개선한다고 보지는 않는다.

- **꼬리질문:** `startup` endpoint를 열었는데 데이터가 없으면? **답:** 애플리케이션에 `BufferingApplicationStartup`이 설정됐는지 확인한다. 다음으로 Actuator endpoint 활성화·노출·접근 설정을 확인한다.

### Q6. lazy initialization은 언제 좋은 선택인가?

시작할 때 꼭 필요하지 않은 빈이 많고 기동 시간을 줄이는 것이 중요할 때 후보가 된다. 그러나 eager singleton의 의존 빈은 시작 중 만들어질 수 있고, 첫 호출에 생성 지연과 설정 오류가 나타날 수 있다. startup 비용과 첫 요청 지연, readiness 검증을 함께 비교해야 한다.

- **꼬리질문:** lazy 설정 후 시작 시간이 줄지 않으면? **답:** eager 빈이 해당 빈에 의존하거나 다른 초기화 작업이 병목일 수 있다. startup timeline으로 실제 생성 경로를 찾는다.

## 9. 참고문헌

- SpringApplication :: Spring Boot — https://docs.spring.io/spring-boot/reference/features/spring-application.html — 기동 로그와 SpringApplication 시작 동작을 확인.
- About Pool Sizing — https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing — 작은 DB 풀과 CPU·I/O 경합의 원리를 설명하며 소개된 개선 수치는 특정 시연 사례.
- Common Application Properties — https://docs.spring.io/spring-boot/appendix/application-properties/index.html — Boot 4.1의 Tomcat worker·queue 기본값과 설명을 확인.
- BufferingApplicationStartup API — https://docs.spring.io/spring-boot/api/java/org/springframework/boot/context/metrics/buffering/BufferingApplicationStartup.html — 단계 기록, 유한 버퍼, 필터·drain, 도입 버전(2.4.0)을 확인.
- TomcatServerProperties API — https://docs.spring.io/spring-boot/api/java/org/springframework/boot/tomcat/autoconfigure/TomcatServerProperties.html — Boot 4.1 Tomcat 속성에 connection timeout, keep-alive, accept count, max connections가 있음을 확인.
- Lazy-initialized Beans :: Spring Framework — https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-lazy-init.html — 기본 eager singleton과 lazy 생성 및 eager 의존성에 의한 조기 생성 동작을 확인.
- Metrics :: Spring Boot — https://docs.spring.io/spring-boot/reference/actuator/metrics.html — Actuator/Micrometer 기반과 메트릭 레지스트리 연결을 확인.
- Endpoints :: Spring Boot — https://docs.spring.io/spring-boot/reference/actuator/endpoints.html — startup·heapdump endpoint와 접근 정책을 확인.
- Scenarios :: Grafana k6 — https://grafana.com/docs/k6/latest/using-k6/scenarios/ — executor를 이용해 사용자 수·도착률 부하를 모델링하는 방식을 확인.
- Thresholds :: Grafana k6 — https://grafana.com/docs/k6/latest/using-k6/thresholds/ — 지표 기준을 통과 조건으로 선언하는 방법을 확인.
- Injection scripting reference :: Gatling — https://docs.gatling.io/concepts/injection/ — open/closed 주입 프로파일과 언어별 API를 확인.
- JEP 444: Virtual Threads — https://openjdk.org/jeps/444 — Java 21 정식화와 경량 스레드의 목표·이력을 확인.

GC·JIT 세부는 → J14/J15, native·AOT는 → S19 참조.
