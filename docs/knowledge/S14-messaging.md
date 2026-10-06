# S14. 메시징 (Kafka·RabbitMQ)

> Kafka는 보관 가능한 파티션 로그와 소비자별 오프셋으로 이벤트를 재생하고, RabbitMQ는 교환기 라우팅으로 큐에 작업을 전달한다.
> 보통의 DB 연동 메시징은 at-least-once로 설계하고, 중복은 멱등 소비자로 흡수한다.
> DB 변경과 이벤트 발행을 함께 보장해야 하면 트랜잭셔널 아웃박스를 쓰며, 브로커의 확인 응답을 업무 처리 완료와 혼동하지 않는다.

## 1. 왜 알아야 하나

DB 저장 뒤 발행 전에 죽으면 이벤트가 빠지고, 발행 뒤 DB 롤백이면 유령 이벤트가 생긴다. 두 commit은 원자적이지 않다.

소비자가 업무 DB를 갱신한 직후 offset commit 전에 죽어도 같은 메시지가 다시 온다. 멱등 처리로 이중 결제를 막고, 재시도·DLT를 함께 설계해 적체를 통제한다.

## 2. 핵심 개념

| 용어 | 뜻 | 실무에서 확인할 점 |
|---|---|---|
| 토픽·파티션·오프셋 | Kafka 로그, 분할 단위, 파티션 내 위치 | 순서는 파티션 안에서 보장되고 offset은 그룹별이다. |
| 소비자 그룹 | 토픽을 나눠 읽는 consumer 집합 | 그룹 안에서 파티션은 한 시점에 한 consumer가 맡고, 다른 그룹은 독립 소비한다. |
| exchange·binding·queue | RabbitMQ의 라우팅 규칙·연결·저장 큐 | producer는 exchange로 발행하고 routing key와 binding이 queue를 고른다. |
| ack / offset commit | 소비 완료를 broker에 알림 | 각각 RabbitMQ 전달과 Kafka 재시작 위치를 전진시킨다. 업무 DB와 자동 원자화되지 않는다. |
| publisher confirm / return | RabbitMQ 발행 확인 / 미라우팅 반환 | consumer 업무 완료를 뜻하지 않는다. Kafka `send()` 결과도 별도 확인한다. |
| DLT / DLQ | 반복 실패 메시지의 토픽·큐 격리 위치 | 원인 분석과 재처리 절차가 따라야 한다. |
| 멱등 소비자 / outbox | 중복 업무 반영 차단 / DB 발행 기록 저장 | 고유 event ID와 DB 트랜잭션, relay/CDC를 조합한다. relay 중복은 여전히 가능하다. |

### Kafka 로그와 RabbitMQ 큐

| 기준 | Kafka | RabbitMQ (AMQP 0-9-1) |
|---|---|---|
| 모델 | 파티션에 추가되는 보존 로그 | exchange가 규칙에 따라 queue에 라우팅 |
| 소비 후 | 즉시 삭제하지 않고 보존 범위 안에서 재생 가능 | ack 뒤 queue에서 제거. 다른 소비 흐름에는 별도 queue를 둔다. |
| 확장 | 그룹 내 동시성 상한은 파티션 수 | 같은 queue의 여러 consumer가 경쟁 소비 |
| 적합한 일 | 이벤트 스트림, 여러 독립 구독자, 이력 재생 | 작업 큐, routing key로 목적지 분기, 개별 ack |
| 순서 | 같은 키를 같은 파티션으로 보내야 키 순서 유지 | 다중 consumer·재전달 때 완료 순서가 달라질 수 있음 |

Kafka는 보관 로그·그룹별 위치, RabbitMQ는 라우팅·개별 전달 확인이 중심이다. RabbitMQ에서 임의 재생을 기대하거나 Kafka 레코드가 ack 즉시 사라진다고 가정하면 안 된다.

### 전달 보장 세 가지

- **at-most-once**: 업무 전에 위치를 확정한다. 중복은 줄지만 장애 시 유실 가능.
- **at-least-once**: 업무 뒤 확정한다. 장애 시 재전달될 수 있어 중복 허용과 멱등성이 필요하다.
- **exactly-once**: 경계 안에서만 말할 수 있다. Kafka 트랜잭션은 Kafka 입력 offset과 출력 레코드 흐름을 다루며 외부 DB·결제까지 확장되지 않는다.

기준 문서의 Boot 4.1.1 관리 버전은 Spring Kafka·Spring AMQP 모두 4.1.1이다. Cloud Stream은 별도 릴리스 트레인에 속한다. 확인한 `current` 레퍼런스는 4.0.5를 표기하므로 Boot 4.1.1 호환 조합은 호환표를 확인한다.

## 3. 내부 동작·원리

### Kafka: 생산부터 커밋까지

```text
producer --(key/value)--> topic partition: [offset 0][1][2][3] ...
                                  ^                         |
                                  | group별 committed offset|
                                  +---- consumer poll <-----+
                                           |
                                  listener 업무 처리
                                           |
                                  처리 후 offset commit
```

1. `KafkaTemplate.send()`는 `CompletableFuture<SendResult<...>>`를 반환한다. 키로 같은 파티션에 보내면 키 순서를 유지할 수 있으므로 비동기 실패도 관측한다.
2. consumer는 `poll()` 레코드를 listener에 넘기고 coordinator는 파티션을 그룹 멤버에 할당한다. consumer 수가 파티션보다 많으면 일부가 쉰다. 다른 그룹은 각자의 위치로 같은 로그를 읽는다.
3. Spring Kafka는 기본적으로 `enable.auto.commit=false`로 두고 컨테이너가 commit한다(2.3부터). 기본 `AckMode.BATCH`는 poll 묶음 처리 후 확정하고, `RECORD`는 레코드별, `MANUAL`은 listener가 `Acknowledgment`를 호출한다.
4. DB commit 뒤 offset 확정 전에 죽으면 중복되고, 업무 처리 전에 확정하면 유실될 수 있다. 별도 원자화 없이 순서만 바꿔 두 창을 모두 닫을 수 없다.
5. listener 예외는 컨테이너 오류 처리기로 간다. `DefaultErrorHandler` 재시도·복구를 정하고 소진 시 DLT로 보낸다. 동기 재시도는 진행을 막고 `@RetryableTopic`은 순서가 바뀔 수 있다.

### RabbitMQ: 발행부터 ack까지

```text
RabbitTemplate --(exchange, routing key)--> exchange
                                                |
                                       binding 규칙으로 라우팅
                                                v
                                             queue --deliver--> @RabbitListener
                                                ^                    |
                                                +---- 재전달 <-- ack/nack
```

1. `RabbitTemplate`은 exchange·routing key로 발행한다. direct는 키 일치, topic은 패턴, fanout은 바인딩된 큐에 라우팅한다. `mandatory` return은 미라우팅, publisher confirm은 브로커 발행 확인이다.
2. `@RabbitListener`는 container가 호출한다. 기본 `AUTO`는 정상 반환 시 ack하며 `MANUAL`은 애플리케이션 책임이다. Rabbit ack는 전달 완료이지 offset 재생 위치가 아니다.
3. `defaultRequeueRejected` 기본값은 `true`다. 재큐잉 반복을 막도록 제한 재시도·DLX/DLQ를 정하고, 연결 복구와 listener 복구를 구분한다.

### DB 변경과 이벤트를 함께 보장하기

```text
업무 요청
   |
   +-- 같은 DB 트랜잭션 --> 업무 테이블 변경
   |                       outbox(eventId, aggregateId, payload)
   |
   +-- commit
          |
     CDC 또는 polling relay --(at-least-once)--> 브로커
                                                   |
                                           멱등 소비자 / inbox
```

DB와 브로커 사이에는 일반적인 단일 트랜잭션이 없다. 먼저 발행하면 DB 롤백 뒤 유령 이벤트, DB commit 뒤 발행하면 장애 시 유실이 가능하다. 아웃박스는 업무 변경과 이벤트 행을 한 DB 트랜잭션으로 저장하고 CDC/polling relay가 발행하게 한다.

confirm 뒤 진행 상태 저장 전에 relay가 죽으면 재발행할 수 있다. Outbox는 유실 창을 닫지만 중복 제거 패턴은 아니다. event ID 멱등 처리와 aggregate 순서에 맞는 relay 정렬·동시성이 필요하다.

## 4. 코드로 확인

### 예제 1 — Kafka 발행과 DB 멱등 소비

축약 예제는 키를 `eventId`로 쓴다. 도메인 순서가 필요하면 키는 `aggregateId`, dedupe ID는 별도 payload/header로 보낸다. `ON CONFLICT`는 PostgreSQL 문법이다. (Spring Boot 4.1 / Spring Kafka 4.1.1 API, 미실행)

```java
import java.util.concurrent.CompletableFuture;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.kafka.support.SendResult;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class OrderEventPublisher {
    private final KafkaTemplate<String, String> kafka;

    OrderEventPublisher(KafkaTemplate<String, String> kafka) {
        this.kafka = kafka;
    }

    CompletableFuture<SendResult<String, String>> publish(String eventId, String json) {
        return kafka.send("orders.created", eventId, json);
    }
}

@Service
class InventoryConsumer {
    private final JdbcTemplate jdbc;

    InventoryConsumer(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @KafkaListener(topics = "orders.created", groupId = "inventory-v1")
    @Transactional
    public void onOrderCreated(
            @Payload String json,
            @Header(KafkaHeaders.RECEIVED_KEY) String eventId) {
        int inserted = jdbc.update("""
                INSERT INTO processed_message(consumer_name, event_id)
                VALUES (?, ?)
                ON CONFLICT DO NOTHING
                """, "inventory-v1", eventId);
        if (inserted == 0) {
            return; // 이미 반영한 eventId: 업무 변경도 다시 하지 않는다.
        }
        jdbc.update("""
                INSERT INTO inventory_event(event_id, payload)
                VALUES (?, ?)
                """, eventId, json);
    }
}
```

`processed_message(consumer_name, event_id)`를 unique로 만들고 표식·업무 변경을 한 DB 트랜잭션에 둔다. DB commit 뒤 재전달돼도 고유 제약이 막는다. producer future 실패도 처리한다.

### 예제 2 — RabbitMQ 토픽 라우팅과 listener

durable queue와 topic exchange를 binding하고 기본 `AUTO` ack를 쓴다. retry/DLX 정책은 별도로 선언한다. (Spring Boot 4.1 / Spring AMQP 4.1.1 API, 미실행)

```java
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Service;

@Configuration
class OrdersAmqpConfiguration {
    static final String EXCHANGE = "orders.events";
    static final String QUEUE = "inventory.orders";

    @Bean
    TopicExchange ordersExchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    Queue inventoryQueue() {
        return QueueBuilder.durable(QUEUE).build();
    }

    @Bean
    Binding orderCreatedBinding(Queue inventoryQueue, TopicExchange ordersExchange) {
        return BindingBuilder.bind(inventoryQueue)
                .to(ordersExchange)
                .with("orders.created");
    }
}

@Service
class OrdersAmqpClient {
    private final RabbitTemplate rabbit;

    OrdersAmqpClient(RabbitTemplate rabbit) {
        this.rabbit = rabbit;
    }

    void publish(String json) {
        rabbit.convertAndSend(OrdersAmqpConfiguration.EXCHANGE, "orders.created", json);
    }

    @RabbitListener(queues = OrdersAmqpConfiguration.QUEUE)
    public void consume(String json) {
        // 정상 반환하면 컨테이너가 ack한다. 실패 정책은 명시적으로 구성한다.
    }
}
```

운영에서는 correlated confirm, `publisherReturns=true`, 메시지별 `mandatory`를 설정한다. confirm은 broker 발행 확인, return은 미라우팅이며 consumer 업무 완료는 보장하지 않는다.

### 예제 3 — 아웃박스 행을 업무 변경과 함께 저장

아래 두 SQL이 동일 DB 트랜잭션에서 커밋된다. 실제 배포에서는 `outbox` 테이블을 CDC 또는 polling relay가 읽어 브로커에 발행한다. (Spring Boot 4.1 / Spring Framework 7 API, 미실행)

```java
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class OrderCommandService {
    private final JdbcTemplate jdbc;

    OrderCommandService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public UUID createOrder(String orderId, String eventJson) {
        UUID eventId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO orders(order_id, status) VALUES (?, 'CREATED')
                """, orderId);
        jdbc.update("""
                INSERT INTO outbox(event_id, aggregate_id, event_type, payload)
                VALUES (?, ?, 'OrderCreated', ?)
                """, eventId, orderId, eventJson);
        return eventId;
    }
}
```

relay는 발행 완료와 재개 위치를 내구성 있게 관리한다. 행을 무조건 삭제하지 말고 중복 발행에 대비한다.

## 5. 버전별 변화 — 왜 바뀌었나

- **2.3**: Spring Kafka가 auto-commit을 기본 비활성화하고 `AckMode`를 관리한다. 처리와 commit 순서를 컨테이너가 제어하도록 한 변화다. [Listener containers](https://docs.spring.io/spring-kafka/reference/kafka/receiving-messages/message-listener-container.html)
- **2.7–2.9**: 비차단 재시도 토픽 도입 후 인프라 설정 방식을 정비했다. blocking 재시도로 파티션이 멈추는 경우를 줄이는 대신 별도 토픽·운영이 필요하다. [Non-Blocking Retries](https://docs.spring.io/spring-kafka/reference/retrytopic.html)
- **2.8**: record·batch listener 오류 처리를 `CommonErrorHandler`로 통합했다. [Handling Exceptions](https://docs.spring.io/spring-kafka/reference/kafka/annotation-error-handling.html)
- **3.0**: EOS V2만 지원하고 transaction ID 생성 차이를 없앴다. 인스턴스마다 `transactionIdPrefix`는 고유해야 한다. [Transactions](https://docs.spring.io/spring-kafka/reference/kafka/transactions.html)
- **4.0**: Kafka client 4.0과 함께 ZooKeeper 기능·`EmbeddedKafkaZKBroker`를 제거하고 KRaft로 전환했다. [Change History](https://docs.spring.io/spring-kafka/reference/appendix/change-history.html)
- **Spring AMQP 4.1**: 범용 AMQP 1.0용 `spring-amqp-client` 모듈을 추가했다. RabbitMQ AMQP 0-9-1 `RabbitTemplate`과 구분한다. [What’s New](https://docs.spring.io/spring-amqp/reference/whats-new.html)

## 6. 실무 가이드

- if 독립 소비자·이력 재생이 필요하면 then Kafka를 검토한다. 보존 기간과 그룹별 offset이 맞는지 계산한다.
- if routing key로 작업을 여러 queue에 분기하면 then RabbitMQ를 검토한다. exchange와 binding을 명시한다.
- if DB 변경에 따른 이벤트 유실이 핵심 위험이면 then **기본 추천은 outbox + at-least-once + 멱등 소비자**다.
- if 일시 오류·순서 유지가 중요하면 then 제한된 blocking retry를 쓴다. 대기 시간의 처리량 영향을 확인한다.
- if 실패 레코드 때문에 뒤의 정상 이벤트를 막으면 안 되면 then Kafka 지연 재시도 토픽을 검토한다. 순서 변경 및 batch·container transaction 제약을 수용해야 한다.
- if Rabbit 발행·라우팅 성공을 구분해야 하면 then publisher confirm과 mandatory return을 모두 처리한다. 둘 다 소비 완료는 아니다.
- if 새 구독자에서 과거부터 재생해야 하면 then Kafka 보존량을 확인한다. RabbitMQ는 별도 재생 경로가 필요하다.
- if scheduling 또는 배치 실행이 핵심이면 then S15를 참조한다.

Spring Cloud Stream은 함수형 `Supplier`·`Function`·`Consumer`와 binder를 제공한다. 그룹, partitioning, 오류·DLQ·ack 의미는 binder별로 확인하며 API 통일을 broker 의미의 동일성으로 오해하지 않는다.

## 7. 함정·안티패턴

1. **처리한 메시지가 다시 온다 →** DB commit 뒤 offset/ack 전에 죽었다 → `(consumer,eventId)` 고유 키와 업무 변경을 한 트랜잭션으로 처리한다.
2. **업무 실패인데 메시지가 사라진다 →** 처리 전 offset/ack 또는 auto-commit → 처리 후 확정하는 at-least-once 순서로 맞춘다.
3. **실패 메시지로 적체·로그 폭증 →** 즉시 재큐잉·무한 재시도 → 횟수와 backoff를 제한하고 DLT/DLQ 경보·재처리 절차를 둔다.
4. **이벤트 순서가 뒤집힌다 →** Kafka 키가 aggregate별로 다르거나 지연 재시도로 뒤 레코드가 먼저 처리됐다 → 순서 조건을 정하고 파티션 blocking 또는 순번 검증을 택한다.
5. **Rabbit 발행 호출은 성공했는데 큐가 비었다 →** 호출 완료를 broker 확인으로 오해하거나 미라우팅을 놓쳤다 → confirm과 mandatory return을 처리한다.
6. **Kafka 발행 실패가 보이지 않는다 →** `send()` future 무시 → 실패를 계측하고 동기 대기로 스레드를 막지 않는다.
7. **consumer를 늘려도 처리량이 같다 →** 파티션 수 또는 키 분포가 병목이다 → 파티션·키·처리시간을 점검한다. group 이름 변경은 병렬화가 아니라 독립 구독이다.

## 8. 자가점검 Q&A (면접 대비)

### Q1. Kafka 토픽과 RabbitMQ 큐는 둘 다 메시지 목록 아닌가?

Kafka는 로그와 그룹별 위치를 보존해 재생한다. RabbitMQ는 exchange에서 queue로 라우팅하고 ack 뒤 제거한다. 재생은 Kafka, 작업 라우팅은 RabbitMQ에 맞는다.

**꼬리질문 — Kafka에서 소비자 둘이 같은 레코드를 받을 수 있나?**

서로 다른 group이면 각자 읽는다. 같은 group 안에서는 파티션을 나누므로 한 파티션은 한 consumer가 맡는다.

### Q2. consumer group의 소비자를 무한히 늘리면 처리량도 계속 증가하나?

아니다. 파티션 수가 group 동시성 상한이라 초과 consumer는 쉰다. 키 쏠림도 병목이다.

**꼬리질문 — group 이름을 새로 배포할 때 바꾸면 어떤가?**

독립 구독이 되어 과거 레코드를 다시 읽을 수 있다. 재처리 의도와 업무 멱등성을 확인한다.

### Q3. offset commit은 언제 해야 중복과 유실을 모두 막나?

처리 전 commit은 유실, 처리 후는 중복 가능성이 있다. at-least-once와 멱등성을 조합한다. `BATCH`는 poll 묶음 뒤 확정한다.

**꼬리질문 — `MANUAL_IMMEDIATE`면 exactly-once인가?**

아니다. 외부 DB와 원자화되지 않는다. DB 변경·중복 표식을 함께 커밋하고 재전달에 대비한다.

### Q4. “Kafka exactly-once”가 결제 API 호출 중복도 없애나?

아니다. Kafka offset·출력 레코드 경계이며 외부 DB·HTTP API는 빠진다. 외부 효과에는 idempotency key나 outbox가 필요하다.

**꼬리질문 — Kafka를 DB 트랜잭션과 함께 쓰면?**

공유 원자성이 없으면 이중 쓰기 창이 남는다. DB outbox를 저장하고 relay가 Kafka로 전달한다.

### Q5. 재시도 토픽과 blocking retry 중 무엇을 고르나?

순서가 중요하면 제한된 blocking retry, 진행 분리가 필요하면 지연 토픽을 검토한다. 후자는 순서가 바뀔 수 있고 batch listener·container transaction과 조합되지 않는다.

**꼬리질문 — DLT에 보냈으면 복구가 끝났나?**

아니다. 원인·원본 위치를 분석하고 재발행 또는 폐기해야 한다.

### Q6. 업무 DB 업데이트 후 이벤트 발행에 Kafka 트랜잭션을 걸면 아웃박스가 필요 없나?

Kafka 트랜잭션은 DB commit과 원자적이지 않다. DB 변경과 발행 기록을 outbox로 한 로컬 트랜잭션에 넣는다.

**꼬리질문 — outbox relay도 중복을 만들 수 있나?**

그렇다. confirm 뒤 relay가 죽으면 재발행할 수 있다. eventId로 소비 측에서 멱등 처리한다.

### Q7. RabbitMQ publisher confirm은 consumer ack와 같은가?

아니다. confirm은 발행과 broker 사이 확인, return은 미라우팅, consumer ack는 수신 처리 완료를 뜻한다.

**꼬리질문 — confirm이 왔는데도 업무 결과가 실패할 수 있나?**

있다. consumer 장애나 DB 실패가 남는다. 재전달·격리와 멱등 처리를 소비 측에 둔다.

### Q8. Spring Cloud Stream을 쓰면 Kafka와 RabbitMQ를 설정만 바꿔 교체할 수 있나?

함수형 binding은 공통이지만 partition·offset·ack·DLQ 의미는 broker별이다. API 모양만으로 교체 가능성이 보장되지는 않는다.

**꼬리질문 — Cloud Stream의 group을 생략해도 되나?**

익명 구독 내구성은 binder마다 다르다. 경쟁 소비자라면 group을 지정하고 재시작 후 보존 동작을 확인한다.

## 9. 참고문헌

- Message Listener Containers — https://docs.spring.io/spring-kafka/reference/kafka/receiving-messages/message-listener-container.html — offset·`AckMode`.
- Sending Messages — https://docs.spring.io/spring-kafka/reference/kafka/sending-messages.html — `KafkaTemplate` 비동기 API.
- Handling Exceptions — https://docs.spring.io/spring-kafka/reference/kafka/annotation-error-handling.html — 오류 처리·DLT.
- Non-Blocking Retries — https://docs.spring.io/spring-kafka/reference/retrytopic.html — 지연 retry 제약.
- Transactions — https://docs.spring.io/spring-kafka/reference/kafka/transactions.html — Kafka transaction 범위.
- Spring Kafka Change History — https://docs.spring.io/spring-kafka/reference/appendix/change-history.html — 4.0 변경.
- Message Listener Container Configuration — https://docs.spring.io/spring-amqp/reference/amqp/containerAttributes.html — ack·재큐잉 기본값.
- Resilience — https://docs.spring.io/spring-amqp/reference/amqp/resilience-recovering-from-errors-and-broker-failures.html — 연결·listener 복구.
- AmqpTemplate — https://docs.spring.io/spring-amqp/reference/amqp/template.html — confirm·return.
- Spring AMQP What’s New — https://docs.spring.io/spring-amqp/reference/whats-new.html — AMQP 1.0 모듈.
- AMQP 0-9-1 Model — https://www.rabbitmq.com/tutorials/amqp-concepts — exchange·queue·ack.
- Transactional outbox — https://microservices.io/patterns/data/transactional-outbox.html — 이중 쓰기.
- Spring Cloud Stream Reference — https://docs.spring.io/spring-cloud-stream/docs/current/reference/html/spring-cloud-stream.html — binder·group·함수형 binding.
