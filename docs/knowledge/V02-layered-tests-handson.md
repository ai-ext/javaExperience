# V02. 계층별 테스트 따라 하기 — Controller·Service·Repository·통합

> Controller는 HTTP 계약, Service는 규칙, Repository는 SQL 결과를 검증한다.
> 단위·슬라이스와 MySQL 통합으로 확인한다.
> Boot 4 모듈과 애노테이션 패키지를 확인한다.

## 1. 한 줄로 말하면

책임에 각 책임 범위를 확인한다: HTTP 계약, 서비스 규칙, 쿼리, 전체 연결.

## 2. 당장 알아야 할 것

1. **범위:** 로직은 바깥 계층을 mock하고 DB 동작은 실제 DB로 본다.
2. **Controller:** `@WebMvcTest` + `MockMvc`; Service는 `@MockitoBean`. Boot 4 패키지는 `org.springframework.boot.webmvc.test.autoconfigure`, Advice는 필요하면 `@Import`한다.
3. **Service:** Spring 없이 Repository mock을 생성자로 주입해 분기·변환을 본다. DI·SQL·HTTP는 보장하지 않는다.
4. **Repository:** `@DataJpaTest` + MySQL Testcontainers. `Replace.NONE`으로 DB 교체를 끈다. Boot 4 패키지는 `org.springframework.boot.data.jpa.test.autoconfigure`, `org.springframework.boot.jdbc.test.autoconfigure`다.
5. **통합·연결:** `@ServiceConnection`이 접속 정보를 제공한다. `@SpringBootTest` + `@AutoConfigureMockMvc`는 전체 앱을 띄우며 기본으로 실제 포트를 열지 않는다.
6. **데이터·버전:** `schema.sql`은 DB를 재생성하므로 컨테이너만 쓴다. 프로젝트는 Boot 4.1.1·JDK 21이다.

## 3. 따라 하기

> **이 저장소에 없는 예제 프로젝트** — `practice/starter`는 원래 공부자료가 쓰던 상품 API 예제 프로젝트다(자체 `compose.yaml`: 호스트 `13307` → 컨테이너 `3306`, DB `ds_practice`, 계정 `practice`/`practice`). 이 저장소에는 없으므로 아래 경로·명령은 그런 프로젝트를 직접 만들었을 때의 예시로 읽는다. 이 저장소에서는 루트 프로젝트에 같은 패턴을 적용한다 — `./gradlew test`는 Testcontainers의 일회용 MySQL을 쓰고, 개발 DB는 루트 `compose.yaml`(호스트 `localhost:13308`, 계정 `community`/`community`)이다.

> 검증(2026-10-05, 원래 작업공간): 아래 테스트 4개를 `practice/starter`에 실제 파일로 넣고 `./gradlew test`로 실행 — 기존 2개 포함 10개 테스트 전부 통과(Service 단위 테스트의 중첩 stubbing 실수 1건을 고친 뒤).

프로젝트는 `practice/starter`다. 기존 테스트는 두고 네 파일을 더한다. JPA 테스트 starter를 추가한다(Maven은 같은 좌표를 `test` scope로 선언).

```kotlin
testImplementation("org.springframework.boot:spring-boot-starter-data-jpa-test")
```

**확인:** 동기화 후 테스트 애노테이션 import를 확인한다.

### 1) Controller — `src/test/java/com/example/practice/product/ProductControllerSliceTest.java`

200 JSON과 404 `ProblemDetail`을 본다.

```java
package com.example.practice.product;

import com.example.practice.common.GlobalExceptionHandler;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductController.class)
@Import(GlobalExceptionHandler.class)
class ProductControllerSliceTest {
    @Autowired MockMvc mockMvc;
    @MockitoBean ProductService productService;

    @Test
    void returnsProductJsonAndProblemDetail() throws Exception {
        given(productService.getById(1L)).willReturn(new ProductResponse(
                1L, 3L, "상품A-01", "GOODS", new BigDecimal("9700"), 33, "ON_SALE",
                LocalDateTime.of(2026, 8, 31, 0, 0), LocalDateTime.of(2026, 9, 1, 0, 0)));
        given(productService.getById(999L)).willThrow(new ProductNotFoundException(999L));

        mockMvc.perform(get("/api/products/1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("상품A-01"))
                .andExpect(jsonPath("$.price").value(9700));
        mockMvc.perform(get("/api/products/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Product not found"))
                .andExpect(jsonPath("$.detail").value("Product 999 was not found"));
    }
}
```

**확인:** id 1은 200·JSON, 없는 id는 404·`title/detail`. 실제 서비스·DB는 이 테스트가 보장하지 않는다.

### 2) Service — `src/test/java/com/example/practice/product/ProductServiceUnitTest.java`

DTO·예외·페이지 위임을 확인한다.

```java
package com.example.practice.product;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

class ProductServiceUnitTest {
    private final ProductRepository repository = mock(ProductRepository.class);
    private final ProductService service = new ProductService(repository);

    @Test
    void mapsResponseAndThrowsForMissingProduct() {
        Product found = product(7L, "키보드");
        given(repository.findByIdAndDeletedAtIsNull(7L)).willReturn(Optional.of(found));
        given(repository.findByIdAndDeletedAtIsNull(404L)).willReturn(Optional.empty());

        ProductResponse response = service.getById(7L);
        assertThat(response.id()).isEqualTo(7L);
        assertThat(response.name()).isEqualTo("키보드");
        assertThat(response.price()).isEqualByComparingTo("9700");
        assertThatThrownBy(() -> service.getById(404L))
                .isInstanceOf(ProductNotFoundException.class).hasMessage("Product 404 was not found");
    }

    @Test
    void mapsPageAndDelegatesPageable() {
        var request = PageRequest.of(2, 2);
        var first = product(21L, "첫 상품");   // 먼저 만든다 — 아래 '자주 나는 에러' 참조
        var second = product(22L, "둘째 상품");
        given(repository.findAllByDeletedAtIsNull(request))
                .willReturn(new PageImpl<>(List.of(first, second), request, 5));

        ProductPageResponse response = service.getPage(2, 2);
        assertThat(response.items()).extracting(ProductResponse::id).containsExactly(21L, 22L);
        assertThat(response.page()).isEqualTo(2);
        assertThat(response.totalPages()).isEqualTo(3);
        verify(repository).findAllByDeletedAtIsNull(request);
    }

    private static Product product(Long id, String name) {
        Product p = mock(Product.class);
        given(p.getId()).willReturn(id);
        given(p.getName()).willReturn(name);
        given(p.getPrice()).willReturn(new BigDecimal("9700"));
        return p;
    }
}
```

**확인:** 존재하지 않는 상품은 도메인 예외, 페이지 결과는 요청한 `PageRequest`와 메타데이터를 반영한다. SQL은 실행하지 않는다.

### 3) Repository — `src/test/java/com/example/practice/product/ProductRepositoryTest.java`

MySQL 파생 쿼리와 페이지/count를 확인한다.

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
    void derivedFinderExcludesSoftDeletedProduct() {
        assertThat(productRepository.findByIdAndDeletedAtIsNull(1L)).isPresent();
        assertThat(productRepository.findByIdAndDeletedAtIsNull(80L)).isEmpty();
    }

    @Test
    void derivedPageQueryUsesMysqlCount() {
        Page<Product> page = productRepository.findAllByDeletedAtIsNull(PageRequest.of(0, 10));
        assertThat(page.getContent()).hasSize(10);
        assertThat(page.getTotalElements()).isEqualTo(79);
        assertThat(page.getTotalPages()).isEqualTo(8);
    }
}
```

seed에서 id 80은 삭제됐고 나머지 79행은 활성 상태다. **확인:** id 1 조회, id 80 미조회, 페이지 10행·79건·8페이지. 기본 트랜잭션은 롤백된다.

### 4) 통합 — `src/test/java/com/example/practice/product/ProductApiIntegrationTest.java`

전체 앱에서 요청을 MySQL까지 보낸다.

```java
package com.example.practice.product;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest(properties = {"spring.sql.init.mode=always",
        "spring.sql.init.schema-locations=file:../schema/schema.sql,file:../schema/seed.sql"})
@AutoConfigureMockMvc
class ProductApiIntegrationTest {
    @Container @ServiceConnection
    static final MySQLContainer mysql = new MySQLContainer("mysql:8.4")
            .withDatabaseName("ds_practice").withUsername("practice").withPassword("practice");
    @Autowired MockMvc mockMvc;

    @Test
    void requestLoadsSeededProductFromMysql() throws Exception {
        mockMvc.perform(get("/api/products/1")).andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1)).andExpect(jsonPath("$.name").value("상품A-01"));
    }

    @Test
    void requestReturnsProblemDetailForMissingProduct() throws Exception {
        mockMvc.perform(get("/api/products/999")).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Product not found"))
                .andExpect(jsonPath("$.detail").value("Product 999 was not found"));
    }

    @Test
    void requestReturnsPageCountFromMysql() throws Exception {
        mockMvc.perform(get("/api/products").param("page", "0").param("size", "10"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items.length()").value(10))
                .andExpect(jsonPath("$.totalElements").value(79)).andExpect(jsonPath("$.totalPages").value(8));
    }
}
```

**확인:** 상품 조회·404 ProblemDetail·페이징 count가 모두 DB seed와 일치해야 한다. DB 재생성 스크립트는 컨테이너에서만 쓴다. JUnit 컨테이너는 클래스 뒤 정지하며 캐시 컨텍스트와 수명이 달라질 수 있다. 공유가 필요하면 Spring Bean으로 관리한다.

`cd practice/starter && ./gradlew test`로 실행해 새 네 클래스와 기존 테스트를 확인한다. Gradle 실행: (미실행, 지시에 따름).

| 방식 | 보장 | 보장 못 함 | 비용 |
|---|---|---|---|
| Service 단위 | 분기·변환·위임 | DI·SQL·HTTP | 최저 |
| `@WebMvcTest` | 라우팅·상태·JSON·예외 | 실제 서비스·DB | 소형 컨텍스트 |
| `@DataJpaTest` + MySQL | 매핑·쿼리·DB count | MVC·전체 Bean 연결 | 컨테이너 |
| 전체 통합 + MockMvc | API부터 DB까지 연결 | 실제 포트·운영 성능 | 최고 |

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| `@WebMvcTest` | MVC 계약 | `MockMvc.perform(get(...))` | Service는 `@MockitoBean` |
| `@Import` | Advice 포함 | `GlobalExceptionHandler.class` | 슬라이스에 자동 포함 가정 금지 |
| `@DataJpaTest` | Repository 테스트 | `ProductRepository` 주입 | 기본 내장 DB·롤백 |
| `Replace.NONE` | DataSource 유지 | `@AutoConfigureTestDatabase` | Boot 4 패키지 이동 |
| `@ServiceConnection` | 컨테이너 연결 | `MySQLContainer` 필드 | Boot·TC 모듈 필요 |
| `@SpringBootTest` | 전체 앱 | `@AutoConfigureMockMvc` | 느리고 실패 범위가 큼 |

## 5. 자주 나는 에러와 해결

- `...test.autoconfigure.web.servlet does not exist` → Boot 3 import → Boot 4 `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest`.
- `DataJpaTest` 없음 → 모듈/패키지 오류 → JPA test starter와 Boot 4 패키지 확인.
- `NoSuchBeanDefinitionException: ProductService` → 슬라이스에서 서비스 제외 → `@MockitoBean` 추가.
- H2로 연결되거나 DataSource 교체 실패 → 기본 교체 동작 → `Replace.NONE` 지정.
- 드라이버/연결 오류 → Docker 또는 TC 모듈 누락 → `spring-boot-testcontainers`, MySQL 모듈, `@ServiceConnection` 확인.
- SQL 파일 없음 → 상대 경로 기준 오류 → Gradle 프로젝트에서 `file:../schema/...` 확인.
- ProblemDetail 누락 → Advice 미포함 → `@Import(GlobalExceptionHandler.class)`.
- H2 성공, MySQL 실패 → DB 방언·스키마 차이 → 운영 엔진 컨테이너에서 검증.
- 뒤 테스트에서 `container is not running` → JUnit 컨테이너와 캐시 컨텍스트 수명 불일치 → 공유 시 Spring Bean 컨테이너 검토.

- `UnfinishedStubbingException: Unfinished stubbing detected` → `willReturn(...)` 인자 안에서 **또 다른 mock을 stubbing하는 헬퍼**(예: `product()` 안의 `given(p.getId())`)를 호출했다. 바깥 stubbing이 끝나기 전에 안쪽 stubbing이 시작돼 Mockito 상태가 꼬인다 → 헬퍼로 만들 객체는 **바깥 `given(...)` 앞에서 변수로 먼저 만든다**. (2026-10-05 이 문서의 테스트를 실제로 빌드하다 겪은 실패. 근본적으로는 엔티티를 mock으로 만들지 말고 실제 객체를 쓰는 편이 낫다 → V03)

## 6. 한 단계 더

단위·슬라이스로 규칙과 DB 쿼리를 좁혀 검증하고, 통합 테스트는 비싸므로 대표 연결 경로에 둔다. 테스트 전략 → V01, mock 경계 → V03, 테스트 DB 선택 → V04, JUnit·Mockito → J19, Spring 테스트 컨텍스트 → S18 참조.

## 7. 자가점검 Q&A (면접 대비)

**Q1. `@WebMvcTest`와 `@SpringBootTest` 차이는?**  
MVC 일부와 전체 앱의 차이다. 앞은 빠르고 범위가 좁다.  
뒤는 연결 오류를 찾지만 느리다.  
꼬리: 실제 포트를 여나? 기본 mock 환경은 열지 않는다.

**Q2. Controller 테스트가 Service mock을 쓰면 놓치는 것은?**  
Service와 쿼리는 실행하지 않는다.  
HTTP 계약을 격리해 확인하기 위한 선택이다.  
꼬리: 404에서 무엇을 보나? 상태와 공개 `ProblemDetail` 필드다.

**Q3. `@DataJpaTest` 기본 DB 동작은?**  
보통 임베디드 DB를 사용하고 테스트 트랜잭션을 롤백한다.  
따라서 기본 설정은 MySQL 쿼리를 검증하지 않는다.  
꼬리: MySQL 컨테이너에서는? `Replace.NONE`과 연결 설정을 쓴다.

**Q4. `@ServiceConnection`의 역할은?**  
Testcontainers 서비스에서 Boot가 접속 정보를 만든다.  
JDBC URL을 테스트마다 수동 등록하지 않아도 된다.  
꼬리: 의존성은? Boot 연동과 DB 컨테이너 모듈이다.

**Q5. mock Repository로 쿼리 메서드도 검증되나?**  
아니다. mock은 지정된 결과를 돌려줄 뿐이다.  
파생 SQL은 실행하지 않는다.  
꼬리: 무엇으로 검증하나? 실제 DB Repository 테스트다.

**Q6. 모든 테스트를 통합 테스트로 만들지 않는 이유는?**  
느리고 실패 범위가 넓어 원인 파악이 어려워진다.  
단위·슬라이스에서 세부 규칙을 보고 대표 경로만 합친다.  
꼬리: 운영 성능도 보장하나? 부하·실서버 검증은 별도다.

## 8. 참고문헌

- Spring Boot Testing — https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html — 컨텍스트.
- Spring Boot Testcontainers — https://docs.spring.io/spring-boot/reference/testing/testcontainers.html — 연결.
- Testcontainers MySQL — https://java.testcontainers.org/modules/databases/mysql/ — MySQL.
- Boot 4.1.1 `@WebMvcTest` API — https://docs.spring.io/spring-boot/api/java/org/springframework/boot/webmvc/test/autoconfigure/WebMvcTest.html — MVC.
- Boot 4.1.1 `@DataJpaTest` API — https://docs.spring.io/spring-boot/api/java/org/springframework/boot/data/jpa/test/autoconfigure/DataJpaTest.html — 기본 동작.
- Boot 4.1.1 DB 교체 API — https://docs.spring.io/spring-boot/api/java/org/springframework/boot/jdbc/test/autoconfigure/AutoConfigureTestDatabase.Replace.html — DB 교체.
- Boot 4.1.1 `@ServiceConnection` API — https://docs.spring.io/spring-boot/api/java/org/springframework/boot/testcontainers/service/connection/ServiceConnection.html — 연결 API.
