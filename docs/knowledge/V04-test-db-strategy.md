# V04. 테스트 DB 전략 — H2 vs Testcontainers, 데이터 준비, @Transactional의 함정

> 3줄 요약 — 서비스·도메인 로직은 DB 없이 빠르게 검증하고, SQL·제약·방언을 검증할 Repository/API 테스트에는 운영과 같은 DB 엔진을 쓴다.
> Spring Boot 4.1의 `@DataJpaTest`는 기본적으로 임베디드 DB로 바꾸고 테스트마다 트랜잭션을 롤백하므로, Testcontainers를 붙일 때는 DB 교체를 명시적으로 끈다.
> 테스트 메서드의 `@Transactional`은 편리한 격리 장치이자 현실과 다른 실행 조건이다. 지연 로딩·커밋 이벤트·flush·실제 HTTP 요청 경계를 별도로 검증한다.

## 1. 한 줄로 말하면

테스트 DB 전략은 테스트 목적에 맞는 데이터베이스 엔진과 테스트 데이터 수명 주기를 고르는 일이다. 애플리케이션의 판단 로직은 mock/fake로 빠르게 확인하고, 쿼리·DDL·인덱스·제약·잠금처럼 DB 구현에 맡긴 동작은 운영과 같은 MySQL로 확인해야 한다. H2만으로 검증하면 MySQL에서 깨지고, 전부 컨테이너로 돌리면 피드백이 느려질 수 있다.

기본 추천은 단위 테스트는 DB 없이, Repository/DB 통합 테스트는 운영 DB 컨테이너로 구성하는 것이다. 이 프로젝트는 MySQL 8.4다. H2는 빠른 매핑 실험에 쓰되 운영 SQL 호환성의 증거로 취급하지 않는다.

## 2. 당장 알아야 할 것

1. **목적에 맞게 경계를 고른다.** Service 분기는 DB 없는 mock/fake, JPA 쿼리·제약은 운영 DB 엔진으로 확인한다. 기존 `ProductServiceUnitTest`와 `ProductRepositoryTest`가 각각 그 역할을 한다.
2. **DB 선택:**

   | 방식 | 쓰는 곳 | 한계 |
   |---|---|---|
   | fake/mock | 계산·분기·호출 검증 | SQL이 실행되지 않음 |
   | H2 | 빠른 DB 중립 CRUD 실험 | MySQL 문법·함수·collation·잠금과 다름 |
   | Testcontainers MySQL | 운영 방언·제약·통합 | Docker와 컨테이너 기동 비용 필요 |
   | 공유 개발 DB | 특별한 수동 확인 | 데이터 오염·병렬 충돌·비결정성 |

   이 스키마는 MySQL 8.4의 `utf8mb4_0900_ai_ci`, `CHECK`, `AUTO_INCREMENT`를 쓴다. 대소문자 정렬 규칙이나 MySQL 함수·`ON DUPLICATE KEY UPDATE`·`SELECT ... FOR UPDATE`를 확인하려면 H2 `MODE=MySQL`이 아니라 MySQL 컨테이너에서 검증한다. 호환 모드는 MySQL 서버 자체가 아니다.
3. **`@DataJpaTest` 기본값에 주의한다.** JPA slice만 올리고 테스트마다 롤백하며 임베디드 DB가 있으면 DataSource를 교체한다. 실 DB를 쓰려면 `@AutoConfigureTestDatabase(replace = Replace.NONE)`를 둔다. Boot 4 import는 `org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest`, `org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase`다.
4. **연결 정보·버전:** `@ServiceConnection`으로 컨테이너 연결을 자동 설정한다. 이 프로젝트는 `spring-boot-starter-data-jpa-test`, `spring-boot-testcontainers`, `testcontainers-mysql`, `testcontainers-junit-jupiter`를 Boot 4.1.1 관리 버전(Testcontainers 2.0.5)으로 쓴다.
5. **작은 fixture부터 준비한다.** 고정 시드는 통계·페이지 총계처럼 넓은 데이터가 필요할 때만 쓴다. 한 테스트에 필요한 행은 테스트 본문/팩토리로 만들고, 정적 SQL은 `@Sql`, 공통 기반 데이터는 시드 파일로 둔다.
6. **초기화와 fixture를 분리한다.** `spring.sql.init.*`는 컨텍스트의 스키마·공통 시드, `@Sql`은 메서드 전후의 테스트별 SQL에 쓴다. 트랜잭션에 참여한 SQL은 롤백되지만 별도 커밋·연결은 정리 대상이다.
7. **SQL 시점을 확인한다.** JPA는 flush 때 쓰기를 모아 보낼 수 있으므로 제약 위반/쿼리 오류를 잡을 때 `entityManager.flush()`를 사용한다. 단 `Product`의 `IDENTITY` 키처럼 `save()` 때 일찍 INSERT하는 전략도 있다.
8. **트랜잭션 함정을 분리한다.** 테스트 `@Transactional`은 지연 로딩을 숨길 수 있고 rollback은 `AFTER_COMMIT`을 실행하지 않는다. `RANDOM_PORT`의 서버 요청은 테스트 스레드와 별도 트랜잭션이다.
9. **속도는 수명 관리로 개선한다.** static `@Container`는 클래스 내 공유, Boot-managed container Bean은 Spring context와 함께 관리한다. Testcontainers reusable은 종료 후에도 컨테이너가 남는 실험 기능이라 일반 CI의 기본값으로 삼지 않는다.

## 3. 따라 하기

> **이 저장소에 없는 예제 프로젝트** — `practice/starter`는 원래 공부자료가 쓰던 상품 API 예제 프로젝트다(자체 `compose.yaml`: 호스트 `13307` → 컨테이너 `3306`, DB `ds_practice`, 계정 `practice`/`practice`). 이 저장소에는 없으므로 아래 경로·명령은 그런 프로젝트를 직접 만들었을 때의 예시로 읽는다. 이 저장소에서는 루트 프로젝트에 같은 패턴을 적용한다 — `./gradlew test`는 Testcontainers의 일회용 MySQL을 쓰고, 개발 DB는 루트 `compose.yaml`(호스트 `localhost:13308`, 계정 `community`/`community`)이다.

### 1단계 — 의존성 확인

기준 버전은 Java 25 / Boot 4.1.1이다. 연습 프로젝트는 현재 JDK 21 toolchain이므로 이 문서 코드는 21에서도 실행 가능한 문법을 쓴다.

`practice/starter/build.gradle.kts`에 아래 테스트 의존성이 이미 있다. Maven은 Boot parent/BOM 아래 같은 artifact(`spring-boot-starter-test`, `spring-boot-starter-data-jpa-test`, `spring-boot-testcontainers`, `testcontainers-mysql`, `testcontainers-junit-jupiter`)를 `<scope>test</scope>`로 선언하고 버전은 생략한다.

```kotlin
testImplementation("org.springframework.boot:spring-boot-starter-test")
testImplementation("org.springframework.boot:spring-boot-starter-data-jpa-test")
testImplementation("org.springframework.boot:spring-boot-testcontainers")
testImplementation("org.testcontainers:testcontainers-mysql")
testImplementation("org.testcontainers:testcontainers-junit-jupiter")
```

```bash
cd practice/starter
./gradlew -version
```

**확인 방법:** Gradle 9.8.0과 Java toolchain을 확인한다.

### 2단계 — Repository 테스트를 MySQL로 실행

`src/test/java/com/example/practice/product/ProductRepositoryTest.java`는 실제 프로젝트의 패키지·메서드·시드에 맞춘 형태다. `Replace.NONE`이 없으면 `@DataJpaTest`가 임베디드 DB로 바꿀 수 있다.

```java
package com.example.practice.product;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;
import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@DataJpaTest(properties = {"spring.sql.init.mode=always",
        "spring.sql.init.schema-locations=file:../schema/schema.sql,file:../schema/seed.sql"})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ProductRepositoryTest {
    @Container @ServiceConnection
    static final MySQLContainer mysql = new MySQLContainer("mysql:8.4")
            .withDatabaseName("ds_practice").withUsername("practice").withPassword("practice");
    @Autowired ProductRepository productRepository;

    @Test
    void excludesSoftDeletedProduct() {
        assertThat(productRepository.findByIdAndDeletedAtIsNull(1L)).isPresent();
        assertThat(productRepository.findByIdAndDeletedAtIsNull(80L)).isEmpty();
    }

    @Test
    void countsActiveProductsWithMysql() {
        Page<Product> page = productRepository.findAllByDeletedAtIsNull(PageRequest.of(0, 10));
        assertThat(page.getContent()).hasSize(10);
        assertThat(page.getTotalElements()).isEqualTo(79);
        assertThat(page.getTotalPages()).isEqualTo(8);
    }
}
```

`file:../schema/...`는 Gradle 프로젝트 루트에서 실행한다는 전제다. 이 SQL은 전용 컨테이너에서만 실행한다. 위 Spring 테스트 코드는 이번 문서 작업 중 실행하지 않았다(미실행).

```bash
./gradlew test --tests 'com.example.practice.product.ProductRepositoryTest'
```

**확인 방법:** 첫 페이지 10행·총 79행·총 8페이지 assertion이 통과해야 한다. H2 URL이 찍히면 `Replace.NONE`과 `@ServiceConnection`을 확인한다. README에는 같은 구성이 기존 프로젝트에서 통과한 기록이 있다.

### 3단계 — 테스트별 데이터 추가

전체 seed가 필요 없는 케이스는 `src/test/resources/sql/product-fixture.sql`처럼 FK 부모부터 필요한 행만 넣는다.

```sql
INSERT INTO category (id, name, depth, sort_order, created_at, updated_at)
VALUES (9001, '테스트 분류', 1, 1, '2026-09-01 00:00:00', '2026-09-01 00:00:00');
INSERT INTO product (id, category_id, name, product_type, price, stock, sale_status, created_at, updated_at)
VALUES (9001, 9001, '테스트 상품', 'GOODS', 12000, 3, 'ON_SALE', '2026-09-01 00:00:00', '2026-09-01 00:00:00');
```

기존 `ProductRepositoryTest` 안에 넣는 테스트 메서드 예시다(미실행). `org.springframework.test.context.jdbc.Sql`을 import한다.

```java
@Sql("/sql/product-fixture.sql")
@Test
void usesOnlyItsFixture() {
    assertThat(productRepository.findByIdAndDeletedAtIsNull(9001L)).isPresent();
}
```

**확인 방법:** `@Sql` 파일을 못 찾으면 경로를 `/sql/...` classpath 기준으로 확인한다. 같은 테스트를 반복 실행해 PK 중복이 없어야 한다. `@DataJpaTest` 트랜잭션에 참여한 행은 롤백되지만, commit·HTTP 경계의 행은 cleanup이 필요하다.

### 4단계 — `@Transactional` 함정을 재현

(미실행) 아래 Spring 코드는 개념을 가진 실제 도메인에 적용하는 패턴이다. starter에는 `Order` 관계·쓰기 API·커밋 리스너가 없어 그대로 실행할 수 없으며, 기존 `Product` 테스트와 혼동하지 않는다.

**지연 로딩:** 연관관계가 있는 서비스가 엔티티를 반환하면 테스트의 바깥 트랜잭션 때문에 서비스 종료 후에도 lazy 접근이 성공할 수 있다. 운영 코드에서 DTO를 트랜잭션 안에서 만들거나 필요한 연관을 fetch join/EntityGraph로 가져온다.

```java
// LAZY 연관을 가진 주문 서비스에 적용하는 실패 재현 형태
@Test
void returnedEntityCannotRelyOnTestTransaction() {
    Order order = orderService.getEntity(orderId); // 내부 서비스 tx 종료
    assertThatThrownBy(() -> order.getLines().size())
            .isInstanceOf(org.hibernate.LazyInitializationException.class);
}
```

현재 `Product`에는 lazy 연관관계가 없으므로 이 재현은 주문 같은 연관 도메인에 적용한다.

**커밋 이벤트:** `@TransactionalEventListener` 기본 phase는 `AFTER_COMMIT`이다. 테스트가 rollback하면 호출되지 않는다. 실제 커밋 테스트는 `TestTransaction.flagForCommit(); TestTransaction.end();`로 종료한 뒤 결과를 검사하고, commit된 행은 별도로 삭제한다. 외부 메일/결제는 fake로 바꾼다.

```java
@Component
class OrderListener {
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    void afterCommit(OrderCreated event) { notifier.send(event.id()); }
}
```

**flush:** 제약/쿼리 오류가 테스트 메서드 밖에서 뒤늦게 발생하지 않도록 변경 후 `entityManager.flush()`를 호출한다. 현재 `Product`는 테스트용 생성자/세터가 없고 `IDENTITY` 키이므로, 실제 도메인 factory로 위반 상태를 준비하고 예외가 `save()` 또는 `flush()` 중 어디서 발생하는지 감싼다. 존재하지 않는 상품 생성 API를 예제로 만들지 않는다.

**실제 HTTP:** `RANDOM_PORT` 요청은 서버 스레드가 별도 트랜잭션을 쓴다. 따라서 테스트 메서드 `@Transactional`이 서버 INSERT를 롤백하지 않는다.

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OrderHttpTest {
    @Autowired TestRestTemplate http;
    @Autowired OrderRepository orders;

    @Test
    void serverWriteIsOutsideTestTransaction() {
        http.postForEntity("/api/orders", request, Void.class);
        assertThat(orders.existsById(expectedId)).isTrue();
    }
}
```

POST 경로·요청·ID는 실제 쓰기 API에 맞춘다. 연습 상품 API는 GET만 있어 이 코드는 쓰기 API 보유 프로젝트에 적용한다. 단순 MVC+DB 검증은 MockMvc와 Testcontainers를 쓰면 정리가 쉽다.

**확인 방법:** 예외, 리스너 횟수, DB 행을 직접 assertion한다. 단순히 테스트 종료 때 예외가 없다는 것만으로 지연 flush/commit을 검증했다고 보지 않는다.

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| `@DataJpaTest` | Repository/JPA slice | JPA만 구성 | 임베디드 DB 교체·자동 롤백 |
| `@AutoConfigureTestDatabase` | DB 교체 제어 | `replace = NONE` | Boot 4 전용 패키지 확인 |
| `@ServiceConnection` | 컨테이너 연결 자동 설정 | MySQL container 필드/Bean | 컨테이너 타입 모듈 필요 |
| `@Container` | 컨테이너 수명 관리 | static 필드 | 클래스 안에서 공유 |
| `@Sql` | 케이스별 데이터 | `/sql/fixture.sql` | 별도 commit/연결은 자동 정리 아님 |
| `flush()` | 변경을 DB로 밀어 SQL 검증 | 저장 뒤 호출 | `IDENTITY`는 더 일찍 INSERT할 수 있음 |
| `TestTransaction.end()` | 테스트 트랜잭션 종료 | commit 검증 | 데이터 cleanup 별도 |
| H2 `MODE=MySQL` | 일부 문법 호환 | H2 URL 옵션 | 서버/collation 동등성은 없음 |

## 5. 자주 나는 에러와 해결

1. **테스트가 H2로 연결됨** → `@DataJpaTest` 기본 DB 교체 → `@ServiceConnection`과 `@AutoConfigureTestDatabase(replace = NONE)` 확인.
2. **`package ...test.autoconfigure.orm.jpa does not exist`** → Boot 3 import를 복사함 → Boot 4 JPA import는 `org.springframework.boot.data.jpa.test.autoconfigure`, DB 설정은 `org.springframework.boot.jdbc.test.autoconfigure`. `@WebMvcTest`/`@AutoConfigureMockMvc`는 `org.springframework.boot.webmvc.test.autoconfigure`.
3. **`Could not find a valid Docker environment` 또는 컨테이너 timeout** → Docker daemon·이미지 pull·디스크 확인. 이 프로젝트의 이전 EOF timeout은 Docker 디스크 부족이 원인이었다.
4. **Table not found / schema-validation 실패** → SQL 경로·작업 디렉터리·init 설정 문제 → starter 루트 실행, `file:../schema/schema.sql` 경로와 `spring.sql.init.mode=always` 확인. 오류를 감추려고 `ddl-auto=create`로 바꾸지 않는다.
5. **재실행 때 Duplicate entry** → 커밋 데이터가 남거나 공유 DB 사용 → rollback 가능한 fixture, 테스트 전용 컨테이너, commit/HTTP 테스트 cleanup을 적용한다.
6. **H2 통과·MySQL 실패** → 방언·함수·collation·락 차이 → 운영 엔진 Testcontainers로 최소 재현 SQL을 검증한다. H2 모드를 더 붙여 실제 엔진 동작이라고 간주하지 않는다.

## 6. 한 단계 더

테스트 트랜잭션은 현재 스레드에 바인딩된다. Spring 서비스의 `REQUIRED`는 대개 참여하지만 `REQUIRES_NEW`, 비동기 작업, 다른 스레드의 HTTP 요청은 같은 트랜잭션이 아니다. context 캐시는 Spring 설정 재사용이지 데이터 정리 기능이 아니다.

느리면 먼저 컨테이너·SQL seed·context 중 비용이 큰 구간을 찾고 수명을 조정한다. Testcontainers reusable은 테스트 뒤에도 남는 실험 기능이다.

Boot 3.1 릴리스에서 Testcontainers 의존성 관리가 포함됐고, Boot 4.1의 `DataJpaTest`는 `org.springframework.boot.data.jpa.test.autoconfigure`에 있으며 API 문서상 4.0.0부터 제공된다. Boot 4 프로젝트는 해당 테스트 모듈을 의존성에 포함한다.

JPA 원리 → S09 참조. 트랜잭션 → S08 참조. 계층별 테스트 → V02 참조.

## 7. 자가점검 Q&A (면접 대비)

### Q1. `@DataJpaTest`가 H2를 쓰는 이유와 MySQL을 쓰는 방법은?

임베디드 DB가 있으면 기본적으로 DataSource를 교체한다. 컨테이너에 `@ServiceConnection`, 테스트에 `@AutoConfigureTestDatabase(replace = NONE)`을 설정한다. 로그에서 실제 DB URL을 확인한다. 설정 후 실제 컨테이너 엔진도 재확인한다.

**꼬리질문:** H2가 완전히 쓸모없나? → 빠른 DB 중립 테스트에는 유용하지만 MySQL 호환 증거는 아니다.

### Q2. H2 `MODE=MySQL`은 Testcontainers와 동등한가?

아니다. 일부 문법 모드일 뿐 엔진 구현·collation·함수·잠금 의미를 복제하지 않는다. 운영 SQL은 MySQL로 검증한다. 방언 오류는 해당 서버 버전 회귀 테스트로 고정한다.

**꼬리질문:** 모든 테스트를 MySQL로 해야 하나? → 로직 테스트는 DB 없이, DB 경계만 실제 엔진으로 둔다.

### Q3. 테스트가 자동 rollback이면 왜 cleanup이 필요한가?

테스트 관리 트랜잭션에 참여한 작업만 롤백된다. HTTP 서버·다른 스레드·commit 테스트는 별도 정리한다. 특히 HTTP 요청과 `REQUIRES_NEW`를 확인한다.

**꼬리질문:** `RANDOM_PORT`를 언제 쓰나? → 실제 서버 스택을 확인할 때만. 일반 MVC 통합은 MockMvc가 단순하다.

### Q4. `save()`가 성공하면 SQL 제약도 검증된 것인가?

항상 그렇지는 않다. flush 전에 SQL이 보류될 수 있으므로 제약 위반을 재현할 땐 `flush()` 또는 실제 예외 발생 지점을 assertion한다. `IDENTITY`는 더 일찍 INSERT할 수 있다. 예외가 어느 호출에서 나는지 테스트가 직접 잡아야 한다.

**꼬리질문:** flush는 commit인가? → 아니다. 현재 트랜잭션에서 SQL을 실행하는 단계다.

### Q5. 테스트에서는 lazy loading이 되고 운영에서는 실패할 수 있나?

테스트 메서드 트랜잭션이 서비스 반환 뒤에도 영속성 컨텍스트를 유지할 수 있다. 운영에서는 트랜잭션 종료 뒤 접근해 `LazyInitializationException`이 날 수 있다. DTO를 트랜잭션 안에서 구성한다. API 경계의 로딩 범위를 검토한다.

**꼬리질문:** 테스트에 `@Transactional`을 빼는 게 해결책인가? → 재현에는 좋지만 조회 범위와 API DTO를 고치는 것이 해결이다.

### Q6. `AFTER_COMMIT` 이벤트를 테스트하려면?

rollback만 하는 `@DataJpaTest`로는 실행을 검증할 수 없다. 테스트 트랜잭션을 명시 커밋하고 결과를 확인한 다음 남은 데이터를 치운다. 외부 전송은 fake로 검증한다. commit 경로는 rollback 테스트와 분리한다.

**꼬리질문:** 이벤트 발행과 메일 전달 성공은 같은가? → 아니다. 외부 전달 보장은 outbox·재시도 등의 별도 문제다.

## 8. 참고문헌

- Testing Spring Boot Applications — https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html — `RANDOM_PORT` 서버와 테스트의 별도 트랜잭션.
- DataJpaTest (Spring Boot 4.1.1 API) — https://docs.spring.io/spring-boot/api/java/org/springframework/boot/data/jpa/test/autoconfigure/DataJpaTest.html — 패키지, 임베디드 DB 교체, 롤백 기본값.
- Testcontainers :: Spring Boot — https://docs.spring.io/spring-boot/reference/testing/testcontainers.html — JUnit·Spring 연결 및 컨테이너 관리.
- Reusable Containers — https://java.testcontainers.org/features/reuse/ — 실험적 재사용과 종료 후 상태.
- Transaction Management — https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/tx.html — 테스트 트랜잭션 바인딩과 rollback.
- Transaction-bound Events — https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html — `AFTER_COMMIT` phase 동작.
- Executing SQL Scripts — https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/executing-sql.html — 테스트 SQL 초기화와 실행.
- H2 Features — https://h2database.com/html/features.html — H2 기능 및 compatibility mode.
- Character Sets and Collations in MySQL — https://dev.mysql.com/doc/refman/8.4/en/charset-mysql.html — MySQL 8.4의 `utf8mb4` 기본 collation.
- Spring Boot 3.1 Release Notes — https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.1-Release-Notes — Testcontainers dependency management 이력.
