# P24. Kafka 연결과 사용 실무

> Kafka는 토픽 파티션에 레코드를 append하고 컨슈머 그룹이 offset을 관리한다.
> Docker에서는 실행 위치에 맞는 advertised.listeners가 연결 성공의 첫 조건이다.
> Spring Boot의 기본 조합은 KafkaTemplate, @KafkaListener, DefaultErrorHandler다.

## 1. 한 줄로 말하면

Kafka는 이벤트를 토픽 파티션에 저장하고 생산자와 컨슈머를 분리하는 스트리밍 플랫폼이다. 컨슈머는 메시지를 삭제하지 않고 그룹별 offset을 전진시키므로 여러 그룹이 같은 이벤트를 읽는다. Spring Kafka는 이를 Spring 빈으로 감싼다. send 성공·브로커 기록·소비 처리·offset 커밋은 서로 다른 단계다.

## 2. 당장 알아야 할 것

1. 주소는 두 관점이다. bootstrap.servers는 최초 메타데이터 주소이고 advertised.listeners는 브로커가 돌려주는 실제 연결 주소다. 호스트 앱에는 localhost:9092를 광고해야 한다. 둘을 섞으면 bootstrap은 성공해도 node 연결이 실패한다.
2. 토픽·파티션·키. 파티션은 병렬성과 순서의 단위다. 같은 키는 같은 파티션으로 가므로 orderId를 키로 쓰면 한 주문의 상대적 순서를 유지하기 쉽다. 전역 순서는 파티션 하나일 때만 가능하다.
3. 컨슈머 그룹. 같은 group.id는 파티션을 나누고 다른 group.id는 같은 레코드를 각각 읽는다. 주문 처리와 감사 로그는 그룹을 분리한다. 파티션보다 컨슈머가 많으면 남는 인스턴스는 유휴다.
4. offset 초기값은 새 그룹에만 적용된다. auto-offset-reset: earliest는 커밋된 offset이 없을 때만 처음부터 읽는다. 이미 같은 group-id가 커밋했다면 설정을 바꿔도 과거를 다시 읽지 않는다.
5. 직렬화는 양쪽 계약이다. 문자열은 StringSerializer/StringDeserializer, JSON은 JsonSerializer/JsonDeserializer를 맞춘다. spring.json.trusted.packages는 애플리케이션 패키지만 명시한다.
6. KafkaTemplate.send는 CompletableFuture<SendResult<K,V>>를 반환한다. 브로커 기록을 HTTP 성공으로 정의하려면 future 성공에서 topic, partition, offset을 확인한다.
7. record listener는 정상 반환 뒤 offset을 커밋한다. DB 저장 후 커밋 전에 죽으면 재전달될 수 있으므로 DB 작업은 멱등해야 한다. 수동 ACK는 외부 작업 완료와 커밋 시점을 맞출 때만 쓴다.
8. DefaultErrorHandler에 BackOff와 DeadLetterPublishingRecoverer를 주면 일정 횟수 실패 후 <topic>.DLT로 보낼 수 있다. 무한 재시도는 파티션을 막을 수 있다.
9. NewTopic 빈은 개발 시 토픽을 만들고 이미 있으면 무시한다. 운영 설정은 배포로 관리한다.

## 3. 따라 하기

예제 파일은 compose.yaml, build.gradle.kts, src/main/resources/application.yml,
src/main/java/com/example/kafka 아래의 애플리케이션·토픽·송수신·오류 설정 클래스다.

### 3.1 Kafka를 Docker Compose로 띄운다

compose.yaml은 공식 Apache 이미지의 KRaft combined 모드다. 호스트 앱이 접속하므로 advertised.listeners는 localhost:9092다.

~~~yaml
services:
  broker:
    image: apache/kafka:4.3.1
    container_name: p24-kafka
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@localhost:9093
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
~~~

~~~bash
docker compose up -d
docker compose ps
~~~

### 3.2 CLI로 토픽·메시지를 확인한다

~~~bash
docker exec p24-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --create \
  --topic orders --partitions 3 --replication-factor 1

docker exec p24-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --describe --topic orders

docker exec -i p24-kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 --topic orders <<'EOF'
cli-order-1
cli-order-2
EOF

docker exec p24-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 --topic orders \
  --from-beginning --group cli-check --timeout-ms 5000
~~~

### 3.3 Gradle 의존성

~~~kotlin
plugins {
    java
    id("org.springframework.boot") version "4.1.1"
    id("io.spring.dependency-management") version "1.1.7"
}
group = "com.example"
version = "0.0.1-SNAPSHOT"
java { toolchain { languageVersion = JavaLanguageVersion.of(25) } }
repositories { mavenCentral() }

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-kafka")
    testImplementation("org.springframework.boot:spring-boot-starter-kafka-test")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
tasks.withType<Test> { useJUnitPlatform() }
~~~

Maven은 같은 두 starter를 Boot parent/BOM 아래 선언한다. Spring Kafka 공식 문서는 stable 4.1.1을 표시한다.

### 3.4 application.yml

~~~yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      properties:
        spring.json.add.type.headers: true
    consumer:
      group-id: order-service
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: com.example.kafka
        spring.json.value.default.type: com.example.kafka.OrderEvent
    listener:
      ack-mode: record
~~~

### 3.5 송수신 코드 전체

KafkaApplication.java:

~~~java
package com.example.kafka;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class KafkaApplication {
    public static void main(String[] args) {
        SpringApplication.run(KafkaApplication.class, args);
    }
}
~~~

OrderEvent.java:

~~~java
package com.example.kafka;
public record OrderEvent(String orderId, String status, long amount) {}
~~~

KafkaTopics.java:

~~~java
package com.example.kafka;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class KafkaTopics {
    @Bean NewTopic ordersTopic() {
        return new NewTopic("orders", 3, (short) 1);
    }
    @Bean NewTopic ordersDlt() {
        return new NewTopic("orders.DLT", 3, (short) 1);
    }
}
~~~

OrderProducer.java. 키로 파티션을 고정하고 future에서 결과를 받는다.

~~~java
package com.example.kafka;
import java.util.concurrent.CompletableFuture;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

@Service
public class OrderProducer {
    private final KafkaTemplate<String, OrderEvent> template;
    public OrderProducer(KafkaTemplate<String, OrderEvent> template) {
        this.template = template;
    }
    public CompletableFuture<SendResult<String, OrderEvent>> send(OrderEvent event) {
        return template.send("orders", event.orderId(), event);
    }
}
~~~

OrderConsumer.java:

~~~java
package com.example.kafka;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class OrderConsumer {
    @KafkaListener(topics = "orders")
    public void consume(OrderEvent event) {
        if ("FAIL".equals(event.status())) {
            throw new IllegalStateException("처리할 수 없는 주문: " + event.orderId());
        }
        System.out.printf("orderId=%s status=%s amount=%d%n",
                event.orderId(), event.status(), event.amount());
    }
}
~~~

KafkaErrorConfig.java:

~~~java
package com.example.kafka;
import org.apache.kafka.common.TopicPartition;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
public class KafkaErrorConfig {
    @Bean
    CommonErrorHandler kafkaErrorHandler(KafkaTemplate<Object, Object> template) {
        var recoverer = new DeadLetterPublishingRecoverer(template,
            (record, ex) -> new TopicPartition(record.topic() + ".DLT",
                                             record.partition()));
        return new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 2L));
    }
}
~~~

확인 방법: future 성공에서 topic, partition, offset을 확인한다. FAIL은 재시도 후 orders.DLT로 이동한다. (Spring 예제 미실행)

### 3.6 HTTP로 보내고 DLT를 확인한다

OrderController.java:

~~~java
package com.example.kafka;
import java.util.concurrent.CompletableFuture;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class OrderController {
    private final OrderProducer producer;
    public OrderController(OrderProducer producer) { this.producer = producer; }

    @PostMapping("/orders")
    public CompletableFuture<ResponseEntity<String>> publish(
            @RequestBody OrderEvent event) {
        return producer.send(event).thenApply(result ->
            ResponseEntity.accepted().body(
                "offset=" + result.getRecordMetadata().offset()));
    }
}
~~~

~~~bash
./gradlew bootRun
curl -X POST localhost:8080/orders -H 'Content-Type: application/json' \
  -d '{"orderId":"o-1","status":"PAID","amount":12000}'

docker exec p24-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 --topic orders.DLT \
  --from-beginning --group dlt-check --timeout-ms 5000
~~~

확인 방법: 정상 요청은 202와 offset=N, FAIL이면 재시도 후 DLT consumer에서 원본 이벤트를 확인한다. (Spring 예제 미실행)

### 3.7 수동 커밋과 동시성

~~~java
@Bean
ConcurrentKafkaListenerContainerFactory<String, OrderEvent> manualFactory(
        ConsumerFactory<String, OrderEvent> consumerFactory,
        CommonErrorHandler errorHandler) {
    var factory = new ConcurrentKafkaListenerContainerFactory<String, OrderEvent>();
    factory.setConsumerFactory(consumerFactory);
    factory.setCommonErrorHandler(errorHandler);
    factory.setConcurrency(3);
    factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);
    return factory;
}

@KafkaListener(topics = "orders", containerFactory = "manualFactory")
public void consumeManually(OrderEvent event, Acknowledgment ack) {
    paymentService.confirm(event);
    ack.acknowledge();
}
~~~

(미실행) 실제 ConsumerFactory와 paymentService 빈이 필요하다. concurrency=3은 파티션이 3 미만이면 일부가 유휴다. 수동 ACK도 중복을 제거하지 않는다.

### 3.8 Testcontainers

테스트 의존성은 org.testcontainers:kafka와 org.testcontainers:junit-jupiter다. (미실행) KafkaContainer를 선언하고 @DynamicPropertySource로 bootstrap-servers를 주입해 실제 Docker Kafka 계약을 검사한다. 테스트별 토픽·group-id를 분리한다.

## 4. 치트시트

| 이름 | 용도·예시 | 주의 |
|---|---|---|
| bootstrap.servers | 최초 접점, localhost:9092 | 광고 주소도 가능해야 한다 |
| advertised.listeners | 실제 주소 | 실행 환경마다 다르다 |
| KafkaTemplate.send | 비동기 생산 | future 성공 확인 |
| @KafkaListener/concurrency | 소비·병렬성 | 파티션 수를 넘으면 유휴 |
| AckMode.RECORD/MANUAL | 커밋 시점 | 재전달·중복 전제 |
| DefaultErrorHandler + DLT | 재시도·실패 격리 | 운영 절차 필요 |
| auto-offset-reset | 새 그룹 위치 | 기존 commit은 유지 |

## 5. 자주 나는 에러와 해결

1. **Connection to node -1 could not be established. Broker may not be available.** → 브로커 미기동 또는 주소 오류다. → docker compose ps/logs와 localhost:9092를 확인한다.
2. **Connection to node 1 반복** → advertised.listeners가 내부 주소를 광고한다. → 호스트 앱에는 PLAINTEXT://localhost:9092를 광고한다.
3. **SerializationException: Can't convert value of class ... to class ...** → serializer 계약이 다르다. → 양쪽 serializer, deserializer, default.type을 맞춘다.
4. **The class 'com.example.kafka.OrderEvent' is not in the trusted packages** → 타입 헤더 패키지가 불신 상태다. → trusted.packages에 정확한 패키지를 추가한다.
5. **컨슈머가 메시지를 못 받음** → 기존 offset 또는 latest 때문이다. → 새 group-id와 earliest로 확인한다.
6. **UnknownTopicOrPartitionException** → 토픽이 없거나 너무 일찍 전송했다. → CLI/NewTopic으로 먼저 만든다.
7. **같은 주문이 두 번 처리됨** → 커밋 전 장애다. → orderId를 DB unique key로 저장해 멱등 처리한다.

## 6. 한 단계 더

흐름은 Producer → partition append → poll → 처리 → offset commit이다. 순서는 파티션 안에서만 보장되며 DB 트랜잭션과 offset 커밋은 원자 작업이 아니므로 멱등 처리나 outbox가 필요하다. DLT는 재처리 경로다. 메시징 개념은 → S14 참조.

## 7. 자가점검 Q&A (면접 대비)

### Q1. bootstrap.servers와 advertised.listeners의 차이는?

bootstrap은 최초 메타데이터 요청 주소이고 advertised.listeners는 그 뒤 실제 broker 접속 주소다. Docker의 localhost는 접속 프로세스가 실행되는 환경을 뜻한다. 

꼬리질문: bootstrap은 되는데 node 연결이 실패하면? → 광고 주소가 클라이언트에서 라우팅 가능한지 확인한다.

### Q2. 두 서비스가 같은 토픽을 모두 받아야 하면 group-id는?

서비스마다 다른 group-id를 준다. 같은 group은 작업을 분산하고 다른 group은 독립적으로 전체 이벤트를 읽는다. 주문 처리와 알림을 같은 group으로 두면 한쪽이 레코드를 가져간다.

꼬리질문: 파티션보다 consumer가 많으면? → 초과 consumer는 할당받지 못한다.

### Q3. 왜 orderId를 key로 보내나?

같은 키를 같은 파티션으로 보내 한 주문의 상대 순서를 유지하기 위해서다. 키가 없으면 주문별 순서를 가정할 수 없다. 전역 순서는 파티션 하나라는 비용이 든다.

꼬리질문: 파티션을 늘리면? → 키-파티션 매핑이 달라질 수 있다.

### Q4. send가 반환되면 끝인가?

아니다. future 성공을 확인해야 브로커 기록 metadata를 안다. 소비 처리와 offset 커밋은 별도 단계다.

꼬리질문: 실패 future는? → 재시도 가능 여부를 분류한다.

### Q5. earliest인데도 예전 메시지가 안 보이는 이유는?

auto-offset-reset은 커밋된 offset이 없을 때만 적용된다. 기존 group-id가 커밋한 위치가 있으면 earliest로 바꿔도 그 위치부터 읽는다. 새 group-id를 사용한다.

꼬리질문: 테스트 권장값은? → earliest와 테스트별 토픽·그룹이다.

### Q6. DefaultErrorHandler와 DLT의 관계는?

DefaultErrorHandler가 backoff와 시도 횟수를 정하고 모두 실패하면 recoverer를 호출한다. DeadLetterPublishingRecoverer는 원본을 DLT로 보낸다.

꼬리질문: 무한 재시도의 문제는? → 영구 오류가 파티션을 막고 lag를 키운다.

### Q7. at-least-once에서 중복을 어떻게 다루나?

커밋 전 장애로 재전달될 수 있으므로 소비자는 멱등해야 한다. orderId를 처리 이력의 unique key로 저장하고 이미 존재하면 성공 처리한다.

꼬리질문: 외부 API는? → idempotency key를 사용한다.

## 8. 참고문헌

- Spring for Apache Kafka Overview — https://docs.spring.io/spring-kafka/reference/ — Spring Kafka 4.1.1 범위.
- Apache Kafka Quickstart — https://kafka.apache.org/quickstart — Docker 실행과 CLI.
- Apache Kafka Docker Image — https://hub.docker.com/r/apache/kafka — 공식 KRaft 환경 변수.
- Apache Kafka Support :: Spring Boot — https://docs.spring.io/spring-boot/reference/messaging/kafka.html — Boot Kafka 자동 설정.
- Sending Messages :: Spring Kafka — https://docs.spring.io/spring-kafka/reference/kafka/sending-messages.html — KafkaTemplate 전송.
- Handling Exceptions :: Spring Kafka — https://docs.spring.io/spring-kafka/reference/kafka/annotation-error-handling.html — 오류 처리와 DLT.
- @KafkaListener Annotation :: Spring Kafka — https://docs.spring.io/spring-kafka/reference/kafka/receiving-messages/listener-annotation.html — 그룹·동시성·ACK.
- Testing Applications :: Spring Kafka — https://docs.spring.io/spring-kafka/reference/testing.html — Kafka test starter와 KRaft 테스트 브로커.
- Testcontainers :: Spring Boot — https://docs.spring.io/spring-boot/reference/testing/testcontainers.html — Docker 통합 테스트.
