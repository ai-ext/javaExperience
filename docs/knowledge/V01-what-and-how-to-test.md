# V01. 무엇을 어떻게 테스트하나 — 대상 고르기부터 테스트 하나의 구조까지

> 테스트는 코드가 아니라 **변경 위험과 외부 계약**을 검증한다.
> 먼저 깨지면 사용자에게 영향을 주는 규칙·경계·요청/응답을 고르고, 그 사실을 확인하는 가장 작고 빠른 테스트를 둔다.
> 실무 기본 조합은 Service 규칙 단위 테스트 + Controller MVC 슬라이스 + 중요한 DB 흐름 통합 테스트 소수다.

## 1. 한 줄로 말하면

백엔드 테스트는 입력이나 상태를 정해 둔 뒤 코드가 만든 결과와 부수 효과가 요구사항에 맞는지 자동으로 확인하는 실행 가능한 명세다. 테스트는 회귀를 잡고 보존할 동작을 알려 준다. 테스트가 있다는 사실보다 **무엇이 깨졌을 때 어떤 테스트가 실패하는지**가 품질을 좌우한다.

테스트 대상은 “코드를 많이 실행할 수 있는가”가 아니라 “이 동작이 틀렸을 때 손실이 큰가, 사람이 놓치기 쉬운가, 자동으로 안정되게 재현할 수 있는가”로 고른다. 운영 프레임워크가 약속한 기능이나 단순 getter/setter를 다시 증명하는 테스트는 거의 정보를 주지 않는다.

## 2. 당장 알아야 할 것

### 2.1 요구사항에서 테스트할 행동을 고른다

먼저 비즈니스 규칙, 경계값, 분기, 과거 버그, 외부 계약을 찾는다. 상품 API라면 “없는 ID는 404”, “삭제 상품은 일반 조회에서 제외”, “페이지 응답의 상품과 전체 건수가 맞다”가 후보다. 단순 getter/setter나 Spring 자체 기능은 애플리케이션이 보장하는 요구사항이 아니다.

실패 영향·수동 재현 난이도·자동 검증 가능성을 함께 본다. 위험이 낮거나 결과를 안정적으로 재현할 수 없는 테스트는 우선순위를 낮춘다.

### 2.2 검증할 계약에 맞춰 범위를 정한다

| 대상 | 확인할 것 | 흔한 선택 | 이 테스트만으로 알 수 없는 것 |
|---|---|---|---|
| Service/도메인 | 규칙·상태 전이·경계·분기 | 단위 테스트 | Spring 구성, 실제 SQL |
| Controller | URL·파라미터·검증·상태·JSON·오류 응답 | `@WebMvcTest` | DB 조회, 실제 서버 통신 |
| Repository/쿼리 | 조건·정렬·페이징·매핑 | DB 통합 또는 범위에 맞는 `@DataJpaTest` | 전체 사용자 흐름 |
| 핵심 엔드투엔드 경로 | 앱 설정부터 저장까지 이어짐 | 소수의 `@SpringBootTest` | 모든 입력 조합·운영 인프라 완전 재현 |
| 외부 계약 | 우리 요청과 응답의 규약 | 계약/경계 통합 테스트 | 상대 시스템 내부 구현 |

표는 선택을 시작하는 기준이다. Controller에 규칙이 섞여 복잡해졌다면 규칙을 Service/도메인으로 옮겨 작은 범위에서 검사한다. 계층별 실습은 → V02, mock 판단은 → V03, Spring 테스트 애노테이션 원리는 → S18 참조.

### 2.3 피라미드와 트로피는 비율표가 아니다

테스트 피라미드는 빠른 단위 테스트를 기반으로 두고, 통합 테스트와 느린 E2E를 상대적으로 적게 두자는 모델이다. 작은 테스트는 다양한 입력을 빨리 확인하고 실패 원인을 좁히기 쉽다. 통합 테스트는 DB·프레임워크 연결 문제를 잡지만 실행·유지 비용이 커질 수 있다. 트로피는 통합·계약 테스트의 비중을 강조하는 다른 관점이다.

비율을 복사하지 말고 빠른 규칙 테스트, 프레임워크·DB 경계 테스트, 핵심 사용자 경로 몇 개를 둔다. 단위 테스트만 두어 DB/JSON을 놓치거나 E2E만 두어 모든 수정이 느려지는 양쪽을 피한다. Ham Vocke의 글도 수준별 피드백과 비용을 비교한다.

### 2.4 테스트 하나는 한 행동을 준비·실행·검증한다

Arrange–Act–Assert 또는 Given–When–Then 구조로 쓴다. 준비에서 입력과 상태를 만들고, 실행은 행동 한 번, 검증은 의미 있는 결과를 확인한다.

```java
given(productService.getById(1L)).willReturn(product);

mockMvc.perform(get("/api/products/1"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("상품A-01"));
```

성공·실패처럼 독립된 행동을 한 메서드에 넣으면 첫 실패가 뒤 검증을 가린다. 한 응답의 상태와 핵심 필드처럼 한 계약을 설명하는 단언 여러 개는 괜찮다. “assert 하나” 규칙 자체가 목표는 아니다.

### 2.5 이름에서 입력과 기대 결과를 읽을 수 있어야 한다

| 스타일 | 예 | 특징 |
|---|---|---|
| `@DisplayName` + 메서드 | `@DisplayName("상품 ID로 조회하면 상품을 반환한다") void returnsProductById()` | 한글 보고 문구와 검색하기 쉬운 식별자 |
| 한글 메서드 | `void 상품_ID로_조회하면_상품을_반환한다()` | 애노테이션 없이 문맥 전달, 팀 도구 관례 확인 |
| should 패턴 | `shouldReturnProductWhenIdExists()` | 영어 코드베이스에서 조건·결과 표시 |

팀 스타일을 통일한다. `test1`, `success`, `상품조회테스트`는 실패 목록에서 기대 행동을 알려 주지 않는다. 구현 메서드 이름만 반복하기보다 조건과 결과를 쓴다.

### 2.6 단언은 실패 원인을 드러내게 쓴다

AssertJ는 값 종류에 맞는 fluent assertion과 읽기 쉬운 오류를 제공한다. Boot의 `spring-boot-starter-test`에는 JUnit Jupiter, AssertJ 등이 포함된다. 응답은 `jsonPath`로 계약 필드를, 자바 객체·컬렉션은 `isEqualTo`, `containsExactly`, `isEmpty` 등으로 확인한다.

```java
assertThat(page.items()).as("요청한 페이지의 상품 순서")
        .extracting(ProductResponse::name)
        .containsExactly("상품A-01", "상품A-02");
```

`isNotNull()`로 끝나면 실질 값을 검증하지 않는다. DTO의 전 필드를 무조건 고정하면 의미 없는 수정에도 실패하므로 사용자 계약에 해당하는 값만 고른다.

### 2.7 테스트 수와 실행 시간은 얻는 정보로 판단한다

중요한 분기·경계·장애 재현이 수동 확인에만 남거나, 같은 회귀가 되풀이되면 테스트가 부족하다. 내부 구현을 고정한 테스트가 리팩터링마다 연쇄 실패하고, 같은 계약을 중복 확인하거나 외부 시스템 때문에 불안정하면 유지비가 크다. “새로 줄이는 위험이 유지비보다 큰가?”를 본다. 커버리지는 실행 범위이지 요구사항을 빠짐없이 확인했다는 증명이 아니다.

빠른 단위 테스트는 자주 실행하고 MVC 슬라이스로 HTTP 계약을 확인한다. DB 컨테이너·전체 컨텍스트 테스트는 실제 경계를 확인하는 핵심 사례로 제한하고 CI에서는 전체 흐름을 실행한다. `@SpringBootTest`의 실행 시간을 추정하지 말고 로컬·CI에서 측정한다. 보편적인 초 단위 목표는 두지 않는다.

## 3. 따라 하기

예제는 `practice/starter`의 실제 상품 API를 따르며 Java 25 전용 문법 없이 Boot 4.1.1 기준 **(미실행)**이다. README에는 JDK 21·Gradle 9.8.0·Boot 4.1.1로 테스트 2개가 통과한 기록이 있다.

### 1단계: 기존 구현과 테스트를 읽는다

```bash
cd practice/starter
sed -n '1,260p' src/test/java/com/example/practice/product/ProductControllerTest.java
```

`ProductController`의 `GET /api/products/{id}`와 실제 응답을 확인한다. 현재 테스트는 성공 응답과 없는 ID의 404를 한 메서드에서 검사하므로 시나리오를 나누면 어느 계약이 깨졌는지 바로 드러난다.

**확인 방법:** 서비스가 `ProductResponse`를 반환하고 없는 상품일 때 `ProductNotFoundException`을 던지는지 확인한다.

### 2단계: 테스트 의존성을 확인한다

이 프로젝트의 `build.gradle.kts`는 Boot 4.1.1을 사용하며 공통 테스트 스타터 외에 MVC 테스트 스타터도 선언한다.

```kotlin
dependencies {
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
}
```

Maven에서는 Boot 의존성 관리 아래 같은 항목을 쓴다.

```xml
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-test</artifactId><scope>test</scope></dependency>
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-webmvc-test</artifactId><scope>test</scope></dependency>
```

버전은 Boot 관리에 맡긴다. 브리프 기준 Boot 4.1.1의 JUnit Jupiter는 6.0.3이다. `./gradlew dependencies --configuration testRuntimeClasspath`로 의존성 해석을 확인한다.

### 3단계: 성공과 실패 HTTP 계약을 분리한다

아래 전체 코드는 `src/test/java/com/example/practice/product/ProductControllerTest.java`에 둘 수 있다. 컨트롤러를 MVC slice로 올리고 Service만 테스트 응답으로 대체한다. 예외 처리기는 앱의 실제 `GlobalExceptionHandler`를 import한다.

Boot 4.1의 `@WebMvcTest` import는 `org.springframework.boot.webmvc.test.autoconfigure`다. **예제 미실행.**

```java
package com.example.practice.product;

import com.example.practice.common.GlobalExceptionHandler;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.junit.jupiter.api.DisplayName;
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
class ProductControllerTest {
    @Autowired private MockMvc mockMvc;
    @MockitoBean private ProductService productService;

    @Test
    @DisplayName("상품 ID로 조회하면 상품 정보를 반환한다")
    void returnsProductById() throws Exception {
        LocalDateTime createdAt = LocalDateTime.of(2026, 8, 31, 0, 0);
        given(productService.getById(1L)).willReturn(new ProductResponse(
                1L, 3L, "상품A-01", "GOODS", new BigDecimal("9700"), 33,
                "ON_SALE", createdAt, LocalDateTime.of(2026, 9, 1, 0, 0)));

        mockMvc.perform(get("/api/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("상품A-01"))
                .andExpect(jsonPath("$.price").value(9700));
    }

    @Test
    @DisplayName("상품이 없으면 404 ProblemDetail을 반환한다")
    void returnsNotFoundWhenProductDoesNotExist() throws Exception {
        given(productService.getById(999L))
                .willThrow(new ProductNotFoundException(999L));

        mockMvc.perform(get("/api/products/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("Product not found"));
    }
}
```

**확인 방법:** `./gradlew test --tests 'com.example.practice.product.ProductControllerTest'`를 실행한다. 성공하면 두 계약이 통과한다. 이 요청은 DB를 거치지 않으므로 쿼리 검증으로 해석하지 않는다.

### 4단계: DB 쿼리에는 통합 테스트를 선택한다

기존 `ProductMySqlIntegrationTest`는 `@SpringBootTest`·MockMvc와 Testcontainers MySQL 8.4로 시드 상품을 API에서 읽어 `practice/schema/schema.sql`과 실제 DB 동작을 확인한다. 컨테이너 테스트는 대표 쿼리에 한정한다. 상세 전략은 → V02/V04 참조.

Boot 4.1.1 `@DataJpaTest`의 패키지는 `org.springframework.boot.data.jpa.test.autoconfigure`다. 이 slice는 JPA에 초점을 두고 기본으로 내장 DB를 사용하며 테스트 트랜잭션을 롤백한다. MySQL과 내장 DB의 SQL·collation·자료형 차이가 중요하면 MySQL을 연결한 테스트를 둔다. DB 전략은 → V04 참조.

**확인 방법:** Docker가 준비되면 `./gradlew test --tests 'com.example.practice.product.ProductMySqlIntegrationTest'`를 실행한다. 컨테이너 기동 로그와 assertion 실패를 구분한다. README에는 Docker 가상 디스크 부족으로 컨테이너가 시작하지 못한 사례가 있다.

### 5단계: 수정 중 빠른 테스트부터 넓힌다

관련 단위/MVC 테스트부터 실행하고 Repository·설정까지 바뀌면 통합 테스트와 전체 실행으로 넓힌다. CI에서는 `./gradlew test`를 수행한다.

**확인 방법:** 실패 테스트 이름과 첫 의미 있는 assertion만 보고 깨진 계약을 설명할 수 있어야 한다. 간헐 실패는 재실행으로 덮지 말고 시간·공유 상태·컨테이너 로그를 조사한다.

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| 단위 테스트 | 순수 규칙·계산 한 행동 | 입력 상태를 준비하고 반환값/예외 검증 | 컨테이너나 전체 컨텍스트를 불필요하게 띄우지 않기 |
| `@WebMvcTest` | MVC 라우팅과 HTTP 계약 | `@WebMvcTest(ProductController.class)` | Boot 4 패키지: `org.springframework.boot.webmvc.test.autoconfigure` |
| `@DataJpaTest` | JPA 엔티티·Repository 중심 | `org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest` | 기본 내장 DB 대체와 롤백 동작 확인 |
| `@SpringBootTest` | 전체 앱 구성으로 대표 흐름 검증 | `@SpringBootTest` + 필요 시 `@AutoConfigureMockMvc` | 기본은 실제 포트를 열지 않음. 설정 로딩 비용을 고려 |
| MockMvc | 모의 웹 요청으로 MVC 경로 실행 | `mockMvc.perform(get("/api/products/1"))` | 실제 네트워크 포트·실 DB의 동작을 증명하지 않음 |
| `given–when–then` | 조건·행동·기대 결과를 읽히게 함 | `given(...)`; 요청; `andExpect(...)` | 테스트 이름과 시나리오도 한 행동을 설명 |
| AssertJ | 객체·컬렉션 조건을 구체적으로 단언 | `assertThat(names).containsExactly("A", "B")` | 포괄적인 not-null 대신 요구사항을 검증 |
| `./gradlew test --tests ...` | 특정 테스트 클래스만 실행 | `./gradlew test --tests '...ProductControllerTest'` | 셸 패턴은 따옴표로 감싸고 wrapper를 사용 |
| `./gradlew test` | 전체 테스트 실행 | 로컬/CI 전체 회귀 확인 | 외부 컨테이너 테스트가 있으면 Docker 요구를 확인 |
| 테스트 이름 | 실패 목록만으로 조건과 결과 파악 | `returnsNotFoundWhenProductDoesNotExist` | `test1`, `success` 같은 이름 피하기 |

기본값 추천: **먼저 빠른 단위 테스트와 MVC 슬라이스로 규칙·계약을 확인하고, DB 및 전체 앱 테스트는 실제 경계가 중요한 소수 시나리오에 둔다.** 테스트 숫자나 피라미드 그림보다 각 테스트의 위험 감소와 실패 진단 정보를 기준으로 예외를 선택한다.

## 5. 자주 나는 에러와 해결

1. **`package org.springframework.boot.test.autoconfigure.web.servlet does not exist` → Boot 3 예제의 패키지를 Boot 4 프로젝트에 복사함 →** Boot 4.1에서는 MVC 테스트 패키지를 `org.springframework.boot.webmvc.test.autoconfigure`로 바꾸고 `spring-boot-starter-webmvc-test` 의존성을 확인한다. `@DataJpaTest`도 `org.springframework.boot.data.jpa.test.autoconfigure`로 옮겨졌으므로 실제 Boot 4.1 API에서 확인한다.

2. **테스트에서 `ProductService` 빈이 없어 컨텍스트 시작 실패 →** `@WebMvcTest`는 전체 애플리케이션을 올리지 않고 MVC 주변 빈만 선택한다. 컨트롤러 협력자는 `@MockitoBean` 등으로 테스트에서 제공하거나 필요한 실제 설정을 명시적으로 import한다. 전체 애플리케이션 동작이 목적일 때만 `@SpringBootTest`를 선택한다.

3. **예외가 나는데 404 대신 500 또는 테스트 컨텍스트 오류 →** 테스트 slice에 실제 `@RestControllerAdvice`가 포함되지 않았거나 예외 매핑이 누락됨. 이 프로젝트는 `GlobalExceptionHandler`를 `@Import`해 실제 ProblemDetail 매핑을 포함하고, 상태 코드와 본문을 각각 확인한다.

4. **`@DataJpaTest` 결과가 MySQL 운영 결과와 다름 →** 기본 내장 DB가 MySQL과 다른 SQL 문법·collation·자료형 동작을 할 수 있음. 쿼리 호환성이 요구사항이면 MySQL Testcontainers나 실제 호환 DB를 붙여 대표 쿼리를 검증한다. 내장 DB를 쓰는 테스트는 검증 범위를 그 DB에 한정해 해석한다.

5. **실제 HTTP 서버 테스트 데이터가 `@Transactional` 롤백되지 않음 →** `RANDOM_PORT`/`DEFINED_PORT`에서는 클라이언트·서버가 다른 스레드와 트랜잭션을 쓴다. 테스트 후 정리 전략을 마련한다.

6. **컨테이너 연결 오류/EOF →** Docker 데몬·이미지·디스크·포트 등 기동 실패일 수 있다. Docker와 컨테이너 로그를 확인해 애플리케이션 assertion과 분리한다.

## 6. 한 단계 더

테스트는 “실패를 재현하기 어려운 위험”에 우선순위를 두면 된다. 비즈니스 규칙은 가장 빠른 범위에서 확인하고, 프레임워크 연결이나 DB 쿼리 같은 경계는 실제 기술을 쓰는 테스트로 대표 조건을 검증한다. 넓은 통합 테스트는 설정·직렬화·저장 경로가 함께 이어지는지 확인하는 용도로 소수만 유지한다.

테스트 피라미드는 비용과 피드백 속도를 비교하는 도구이지 고정된 테스트 개수 비율이 아니다. 테스트는 작성 시점의 구현을 고정하지 말고 외부에서 관찰 가능한 동작을 문서화한다.

실패 이름·assertion·테스트 데이터가 원인 파악 시간을 줄여야 한다. JUnit·Mockito 기본 API → J19, Spring 테스트 애노테이션과 컨텍스트 → S18, 계층별 테스트 작성 → V02, mock 선택 → V03, DB 전략 → V04, 레거시·CI 테스트 운영 → V06 참조.

## 7. 자가점검 Q&A (면접 대비)

### Q1. 테스트는 왜 필요한가요? 컴파일만으로 안 되나요?

컴파일은 문법·타입 오류를 찾지만 규칙·HTTP 계약·DB 쿼리 결과가 맞는지 보장하지 않는다. 테스트는 반복 확인을 자동화하고 변경 뒤 회귀를 빨리 알려 준다. 중요한 건 개수가 아니라 실패 시 어떤 위험을 알려 주는가다.

**꼬리질문:** 테스트가 명세라는 말은? — 입력 조건과 기대 결과를 코드로 남겨 다음 변경자가 읽고 실행할 수 있다는 뜻이다.

### Q2. Service와 Controller 테스트 범위를 왜 나누나요?

Service 단위 테스트는 규칙을 빠르게 여러 입력으로 확인한다. Controller MVC 테스트는 URL·상태 코드·JSON·오류 응답을 확인한다. 한쪽만으로는 다른 계약이 검증되지 않으므로 테스트 대상에 맞춰 분리한다.

**꼬리질문:** 전부 `@SpringBootTest`로 하면 안 되나요? — 실행비용과 실패 원인 범위가 커진다. 전체 흐름이 필요한 대표 사례에 두고 나머지는 좁은 범위로 검사한다.

### Q3. `@WebMvcTest`와 `@SpringBootTest`+MockMvc는 언제 쓰나요?

MVC 계약만 확인하면 `@WebMvcTest`를 우선한다. Boot 문서상 MVC 관련 구성·컴포넌트에 집중하고 MockMvc를 제공한다. 전체 빈 구성과 요청 흐름이 함께 중요하면 `@SpringBootTest`를 택한다.

**꼬리질문:** `@SpringBootTest`는 기본으로 실제 서버를 여나요? — 아니다. 기본 `MOCK`은 포트를 열지 않는다. 실제 서버에는 `RANDOM_PORT` 또는 `DEFINED_PORT`를 선택한다.

### Q4. `@DataJpaTest`에서 통과했는데 운영 MySQL에서 실패할 수 있나요?

가능하다. 기본 내장 DB와 MySQL 사이에는 문법·정렬·collation·자료형 차이가 있다. 실제 DB 호환성이 요구되면 같은 DB 계열을 붙인 통합 테스트를 둔다.

**꼬리질문:** `@DataJpaTest`는 쓸모없나요? — 아니다. 빠른 JPA 확인에 쓸 수 있다. DB 종류와 검증 범위를 분명히 하고 차이가 중요한 경로를 별도 확인한다.

### Q5. 테스트마다 assertion 하나만 둬야 하나요?

아니다. 한 행동을 설명하는 상태 코드와 응답 필드처럼 관련 단언 여러 개는 적절하다. 성공과 실패처럼 독립된 시나리오는 분리해야 앞 실패가 뒤 검증을 가리지 않는다.

**꼬리질문:** 단언이 과한 기준은? — 깨졌을 때 요구사항의 무엇이 틀렸는지 모호한 내부 필드 나열은 줄이고 사용자 계약을 남긴다.

### Q6. 테스트 피라미드와 트로피 중 무엇이 맞나요?

정해진 비율은 없다. 피라미드는 작은 테스트의 빠른 피드백과 넓은 기반을 강조하고, 트로피는 통합 테스트의 가치도 강조한다. 이름 대신 결함 위험과 실행비용을 비교해 범위를 고른다.

**꼬리질문:** 팀에서는 어떻게 결론 내리나요? — 규칙·프레임워크 연결·외부 계약 각각에 가장 싸고 신뢰할 테스트를 배치한다.

## 8. 참고문헌

- JUnit User Guide — https://docs.junit.org/current/user-guide/ — JUnit Platform/Jupiter의 목적과 테스트 작성·실행 개요.
- Spring Boot Testing — https://docs.spring.io/spring-boot/reference/testing/index.html — Boot 테스트 모듈과 `spring-boot-starter-test`가 제공하는 일반 테스트 지원.
- Testing Spring Boot Applications — https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html — `@SpringBootTest` 웹 환경, 서버 실행 방식, 테스트 트랜잭션 동작.
- `WebMvcTest` API, Spring Boot 4.1.1 — https://docs.spring.io/spring-boot/api/java/org/springframework/boot/webmvc/test/autoconfigure/WebMvcTest.html — MVC 슬라이스 범위와 Boot 4 패키지.
- `DataJpaTest` API, Spring Boot 4.1.1 — https://docs.spring.io/spring-boot/api/java/org/springframework/boot/data/jpa/test/autoconfigure/DataJpaTest.html — JPA 슬라이스의 범위, 기본 DB 대체와 롤백.
- AssertJ Documentation — https://assertj.github.io/doc/ — fluent assertion, 타입별 검사와 실패 메시지.
- Ham Vocke, “The Practical Test Pyramid” — https://martinfowler.com/articles/practical-test-pyramid.html — 단위·통합·E2E 수준의 피드백 속도와 비용을 비교하는 실전 모델.
