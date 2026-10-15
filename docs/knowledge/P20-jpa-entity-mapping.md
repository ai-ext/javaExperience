# P20. JPA 엔티티·연관관계 매핑 따라 하기

> 엔티티는 자바 객체와 테이블 사이의 상태·식별자·관계를 선언한다.
> 연관관계에서는 FK를 쓰는 `@ManyToOne` 쪽을 주인으로 둔다.
> 기본 추천은 `LAZY`, 명시적 제약, DTO 응답, 제한된 범위의 cascade다.

## 1. 한 줄로 말하면

JPA 엔티티는 `@Entity`가 붙은 non-final 클래스이며, public/protected 무인자 생성자, `@Id`, persistent 필드를 가진다. 연관관계는 객체 참조를 외래 키로 매핑하는 선언이다. 엔티티를 API 응답으로 직접 반환하면 지연 로딩, 순환 JSON, 내부 필드 노출이 생기므로 DTO로 경계를 둔다.

## 2. 당장 알아야 할 것

### 2.1 최소 엔티티

JPA 3.2의 엔티티 조건은 non-final 클래스, public/protected 무인자 생성자, final이 아닌 persistent 필드/메서드다. 필드에 매핑 애노테이션을 두는 field access를 예제로 사용한다.

`@Table`을 생략하면 naming strategy의 영향을 받는다. 운영 스키마와 이름을 계약해야 하면 이름을 직접 적는다. `nullable=false`는 DB에도 실제 NOT NULL이 생겼는지 DDL로 확인한다.

### 2.2 ID와 기본 타입

```java
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "order_seq")
@SequenceGenerator(name = "order_seq", sequenceName = "orders_seq", allocationSize = 50)
private Long sequenceId;

@Column(nullable = false, precision = 19, scale = 2)
private BigDecimal amount;                 // 금액에 double을 쓰지 않는다
private LocalDate deliveryDate;
private LocalDateTime createdAt;

@Enumerated(EnumType.STRING)
@Column(nullable = false, length = 20)
private OrderStatus status;

@Lob
private String memo;
```

`IDENTITY`는 INSERT 때 DB가 키를 만든다. `SEQUENCE`는 DB 시퀀스에서 키를 먼저 얻는다. `AUTO`는 구현체에 맡기므로 운영 DDL을 명확히 해야 하면 전략을 적는다.

Enum의 기본값은 `ORDINAL`이므로 반드시 STRING을 쓴다. 상수 순서를 바꾸면 과거 숫자의 의미가 바뀐다. JSON은 이식성이 우선이면 문자열+검증, Hibernate 7 JSON 연산이 필요하면 `@JdbcTypeCode(SqlTypes.JSON)`을 검토한다.

### 2.3 감사 필드

설정 클래스에 `@EnableJpaAuditing(auditorAwareRef = "auditorAware")`를 붙이고 `AuditorAware<String>`이 현재 사용자를 `Optional`로 반환하게 한다. 날짜만 기록하면 AuditorAware는 필요 없다. Spring Data 공식 문서는 날짜 애노테이션과 사용자 SPI를 분리한다.

### 2.4 연관관계의 주인

FK가 `order_line.order_id`라면 그 값을 바꾸는 것은 child의 `OrderLine.order`다.

```java
@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "order_id", nullable = false)
private Order order;

@OneToMany(mappedBy = "order",
           cascade = CascadeType.ALL,
           orphanRemoval = true)
private List<OrderLine> lines = new ArrayList<>();

public void addLine(OrderLine line) {
    lines.add(line);
    line.order = this;
}
public void removeLine(OrderLine line) {
    lines.remove(line);
    line.order = null;
}
```

`mappedBy`는 자바 필드명이다. 편의 메서드가 없으면 owning side가 null인 채 flush될 수 있다. 컬렉션 setter 대신 도메인 메서드를 쓴다.

### 2.5 cascade, orphanRemoval, 다대다

cascade는 JPA 상태 전파이고 DB FK cascade가 아니다. `orphanRemoval=true`는 부모 컬렉션에서 빠진 자식을 삭제한다. 주문항목처럼 생명주기가 종속된 경우에만 함께 쓴다.

`@ManyToMany`는 수량·가격·생성일을 담기 어려우므로 중간 엔티티를 만든다.\n\n### 2.6 LAZY와 객체 계약

JPA 기본 fetch는 `@ManyToOne`·`@OneToOne`가 EAGER, 컬렉션이 LAZY다. 기본값은 모든 연관에 `LAZY`를 명시하고 필요한 관계만 가져오는 것이다.

Lombok `@Data`는 쓰지 않는다. equals/hashCode/toString이 연관관계를 순회해 순환·지연 로딩·프록시 문제를 만든다. generated ID가 null일 때도 안전한 팀 표준을 정한다.

엔티티를 JSON으로 직접 반환하지 않는다. 양방향 순환과 세션 밖 LAZY 접근을 막기 위해 DTO로 복사한다.

## 3. 따라 하기

Docker Compose MySQL과 Spring Boot 4.1 / Java 25 앱을 연결한다.

### 3.1 DB

`compose.yaml`

```yaml
services:
  mysql:
    image: mysql:8.4
    environment:
      MYSQL_DATABASE: shop
      MYSQL_USER: app
      MYSQL_PASSWORD: app
      MYSQL_ROOT_PASSWORD: root
    ports: ["3306:3306"]
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 3s
      retries: 20
```

```bash
docker compose up -d
docker compose ps
docker compose exec mysql mysql -uapp -papp -e 'show databases;'
```

확인 방법: mysql이 healthy이고 `shop`이 보인다. 연결 설정은 P19 참조.

### 3.2 Gradle과 설정

`build.gradle.kts`

```kotlin
plugins {
    java
    id("org.springframework.boot") version "4.1.1"
    id("io.spring.dependency-management") version "1.1.7"
}
group = "example"
version = "0.0.1-SNAPSHOT"
java { toolchain { languageVersion = JavaLanguageVersion.of(25) } }
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    runtimeOnly("com.mysql:mysql-connector-j")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
```

Maven은 두 의존성을 `spring-boot-dependencies` BOM 아래에 선언한다.

`src/main/resources/application.yml`

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/shop?serverTimezone=Asia/Seoul
    username: app
    password: app
  jpa:
    hibernate:
      ddl-auto: create
    show-sql: true
    properties:
      hibernate:
        format_sql: true
logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.orm.jdbc.bind: TRACE
```

`ddl-auto: create`는 학습용이다. 운영은 마이그레이션과 `validate`를 쓴다. 로그에서 테이블·FK·NOT NULL을 확인한다.

### 3.3 코드 전체

`ShopApplication.java`

```java
package example.shop;

import java.util.Optional;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class ShopApplication {
  public static void main(String[] args) { SpringApplication.run(ShopApplication.class, args); }
  @Bean AuditorAware<String> auditorAware() { return () -> Optional.of("local-user"); }
}
```

`domain/BaseEntity.java`

```java
package example.shop.domain;
import java.time.Instant;
import jakarta.persistence.*;
import org.springframework.data.annotation.*;

@MappedSuperclass
@EntityListeners(org.springframework.data.jpa.domain.support.AuditingEntityListener.class)
public abstract class BaseEntity {
  @CreatedDate @Column(nullable=false, updatable=false) protected Instant createdAt;
  @LastModifiedDate @Column(nullable=false) protected Instant updatedAt;
  @CreatedBy @Column(nullable=false, updatable=false, length=80) protected String createdBy;
  @LastModifiedBy @Column(nullable=false, length=80) protected String updatedBy;
}
```

`domain/Order.java`

```java
package example.shop.domain;
import java.util.*;
import jakarta.persistence.*;

@Entity @Table(name="orders")
public class Order extends BaseEntity {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @Column(nullable=false, length=100) private String ordererName;
  @OneToMany(mappedBy="order", cascade=CascadeType.ALL, orphanRemoval=true)
  private List<OrderLine> lines = new ArrayList<>();
  protected Order() {}
  private Order(String name) { ordererName=name; }
  public static Order create(String name) { return new Order(name); }
  public void addLine(OrderLine line) { lines.add(line); line.attach(this); }
  public void removeLine(OrderLine line) { lines.remove(line); line.detach(); }
  public Long getId() { return id; }
  public String getOrdererName() { return ordererName; }
  public List<OrderLine> getLines() { return List.copyOf(lines); }
}
```

`domain/OrderLine.java`

```java
package example.shop.domain;
import java.math.BigDecimal;
import jakarta.persistence.*;

@Entity @Table(name="order_lines")
public class OrderLine {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @Column(nullable=false, length=120) private String productName;
  @Column(nullable=false, precision=19, scale=2) private BigDecimal price;
  @Column(nullable=false) private int quantity;
  @Enumerated(EnumType.STRING) @Column(nullable=false, length=20)
  private LineStatus status = LineStatus.PENDING;
  @ManyToOne(fetch=FetchType.LAZY, optional=false)
  @JoinColumn(name="order_id", nullable=false) private Order order;
  protected OrderLine() {}
  public OrderLine(String n, BigDecimal p, int q) {
    if (q < 1) throw new IllegalArgumentException("quantity must be positive");
    productName=n; price=p; quantity=q;
  }
  void attach(Order o) { order=o; } void detach() { order=null; }
  public Long getId() { return id; } public String getProductName() { return productName; }
  public BigDecimal getPrice() { return price; } public int getQuantity() { return quantity; }
  public LineStatus getStatus() { return status; }
}
enum LineStatus { PENDING, PAID, CANCELLED }
```

`web/OrderResponse.java`

```java
package example.shop.web;
import example.shop.domain.Order;
import java.math.BigDecimal;
import java.util.List;

public record OrderResponse(Long id, String ordererName, List<LineResponse> lines) {
  public static OrderResponse from(Order o) {
    return new OrderResponse(o.getId(), o.getOrdererName(),
      o.getLines().stream().map(l -> new LineResponse(l.getId(), l.getProductName(),
        l.getPrice(), l.getQuantity(), l.getStatus().name())).toList());
  }
  public record LineResponse(Long id, String productName, BigDecimal price,
                             int quantity, String status) {}
}
```

`web/OrderController.java`

```java
package example.shop.web;
import example.shop.domain.*;
import jakarta.persistence.EntityManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/orders")
public class OrderController {
  private final EntityManager em;
  public OrderController(EntityManager em) { this.em=em; }
  @PostMapping @Transactional
  public OrderResponse create() {
    Order o=Order.create("kim");
    o.addLine(new OrderLine("coffee", new java.math.BigDecimal("4.50"), 2));
    em.persist(o);
    return OrderResponse.from(o);
  }
}
```

확인 방법: `curl -X POST http://localhost:8080/orders`는 `lines`를 포함하되 내부 `order`는 없다. 로그의 child INSERT와 `docker compose exec mysql mysql -uapp -papp shop -e 'select id,order_id,product_name from order_lines;'`로 FK를 확인한다. (Spring 앱은 이 문서에서 미실행.) 조회 쿼리 상세는 S10 참조.

### 3.4 순수 Java 실행 검증

실행 출력:

```text
after add: count=1, attached=true
after remove: count=0, attached=false
```

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| `@Entity` | 영속 클래스 | `@Entity class Order` | final·무인자 생성자 금지 |
| `@Table` | 테이블명 | `name="orders"` | 운영 이름 명시 |
| `@Id` | PK | `Long id` | 모든 엔티티에 필요 |
| `@GeneratedValue` | PK 생성 | IDENTITY/SEQUENCE | AUTO 결과를 확인 |
| `@Column` | 제약 | nullable, length | DB DDL도 검증 |
| `@ManyToOne` | FK 주인 | `@JoinColumn` | LAZY 명시 |
| `@OneToMany` | 컬렉션 | `mappedBy="order"` | 필드명이지 컬럼명 아님 |
| `cascade` | 상태 전파 | `CascadeType.PERSIST` | DB cascade와 다름 |
| `orphanRemoval` | 고아 삭제 | `true` | 종속 생명주기만 |
| `@Enumerated` | Enum | `STRING` | ORDINAL 금지 |
| `@MappedSuperclass` | 공통 컬럼 | BaseEntity | 자체 테이블 없음 |
| Auditing | 생성/수정 정보 | `@CreatedDate` | Enable 필요 |
| DTO | API 경계 | `OrderResponse` | entity 직접 반환 금지 |

## 5. 자주 나는 에러와 해결

1. `org.hibernate.LazyInitializationException: failed to lazily initialize a collection of role: ... no Session` → 트랜잭션 뒤 컬렉션을 직렬화했다. → 트랜잭션 안에서 DTO로 변환한다.
2. `could not initialize proxy [example.shop.domain.Order#1] - no Session` → detached 프록시 getter 접근이다. → 트랜잭션 안에서 필요한 관계를 가져온다(S09·S10).
3. `org.hibernate.PersistentObjectException: detached entity passed to persist` → detached 객체를 새 객체처럼 persist했다. → 기존 aggregate를 로드해 변경한다.
4. `org.hibernate.TransientPropertyValueException: object references an unsaved transient instance` → 저장되지 않은 parent를 참조한다. → owning side와 생명주기에 맞는 cascade를 확인한다.
5. `JsonMappingException: Infinite recursion (StackOverflowError)` → 양방향 그래프를 Jackson이 순회했다. → DTO에서 단방향·필요 필드만 노출한다.
6. `DataIntegrityViolationException` 또는 `Column 'order_id' cannot be null` → FK 주인이 null이다. → add 메서드와 INSERT의 order_id를 확인한다.

## 6. 한 단계 더

객체 그래프와 관계형 FK는 다르다. JPA는 owning field와 inverse collection을 나눈다. `mappedBy` 컬렉션만 수정하면 FK는 바뀌지 않는다. flush SQL과 DDL을 확인하고, 큰 목록은 child의 `@ManyToOne`과 페이지 조회를 기본으로 둔다. 영속성 컨텍스트·N+1은 → S09, 쿼리는 → S10, 연결은 → P19 참조.

## 7. 자가점검 Q&A (면접 대비)

### Q1. `mappedBy`는 무엇인가?
FK를 관리하는 필드의 반대편이다. `OrderLine.order`가 `order_id`를 쓰며 컬렉션은 읽는 쪽이다. 값은 컬럼명이 아닌 필드명이다.
꼬리질문: 컬렉션만 add하면? → FK가 저장되지 않는다.

### Q2. 왜 `@ManyToOne(fetch=LAZY)`를 명시하나?
기본 EAGER는 불필요한 연관까지 즉시 준비한다. LAZY와 유스케이스별 조회로 범위를 통제한다. 단, 세션 밖 접근은 예외이므로 트랜잭션 안에서 DTO를 만든다.
꼬리질문: LAZY면 SQL 한 번인가? → 추가 SQL이 나올 수 있다.

### Q3. cascade와 orphanRemoval의 차이는?
cascade는 persist/remove 상태 전파이고 orphanRemoval은 컬렉션에서 빠진 자식 삭제다. 종속 생명주기에서만 함께 쓴다.
꼬리질문: DB cascade와 같은가? → 별개 규칙이다.

### Q4. Enum ORDINAL의 문제는?
상수 순서가 숫자의 의미가 된다. 중간 삽입으로 과거 데이터가 다른 상태로 해석된다. `@Enumerated(EnumType.STRING)`을 명시한다.
꼬리질문: 이름을 바꾸면? → 마이그레이션이 필요하다.

### Q5. 왜 `@Data`를 피하나?
equals/hashCode/toString이 연관관계를 순회해 순환·지연 로딩·프록시 문제를 만든다. 필요한 메서드만 작성한다.
꼬리질문: generated ID equals는? → null·hash 안정성을 고려한다.

### Q6. Entity를 직접 반환하지 않는 이유는?
API가 영속 모델에 종속되고 순환 그래프와 세션 밖 LAZY가 실패한다. DTO에서 필요한 필드만 복사해 계약과 조회 범위를 분리한다.
꼬리질문: `JsonIgnore`면? → 장기 경계는 DTO가 낫다.

### Q7. 언제 `@OneToMany` 대신 `@ManyToOne`만 두나?
자식 수가 크거나 검색·페이지네이션이 필요할 때다. child를 조건 조회하는 편이 부모 컬렉션보다 안정적이다.
꼬리질문: 양방향이 항상 좋은가? → 아니다.

## 8. 참고문헌

- Hibernate ORM 7.0 User Guide — https://docs.jboss.org/hibernate/orm/7.0/userguide/html_single/Hibernate_User_Guide.html#domain-model — 매핑.
- Jakarta Persistence 3.2 — https://jakarta.ee/specifications/persistence/3.2/ — JPA.
- `@Entity` API — https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/entity — 조건.
- `@Column` API — https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/column — 제약.
- `@ManyToOne` API — https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/manytoone — FK.
- `@OneToMany` API — https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/onetomany — mappedBy.
- `@Enumerated` API — https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/enumerated — Enum.
- Auditing :: Spring Data JPA — https://docs.spring.io/spring-data/jpa/reference/auditing.html — 감사.
- SQL Databases :: Spring Boot — https://docs.spring.io/spring-boot/reference/data/sql.html — JPA.
- The best way to map a @OneToMany relationship with JPA and Hibernate — https://vladmihalcea.com/the-best-way-to-map-a-onetomany-association-with-jpa-and-hibernate/ — 양방향 SQL 비교.
