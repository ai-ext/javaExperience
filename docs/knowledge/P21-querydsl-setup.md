# P21. QueryDSL 설정과 동적 쿼리 실무
> 3줄 요약 — QueryDSL은 JPQL 문자열 대신 생성된 Q 타입과 fluent API로 조건을 조립하는 도구다.
> Boot 4.1/Jakarta에서는 OpenFeign 포크 7.7의 `querydsl-jpa`와 `querydsl-apt:jpa`를 사용하고, `annotationProcessor`가 Q 클래스를 만든다.
> 복잡한 검색은 Spring Data 커스텀 리포지토리에서 조건·페이지·DTO를 분리해 작성하고, 실행 SQL과 count 쿼리를 반드시 확인한다.
## 1. 한 줄로 말하면
QueryDSL은 annotation processor가 만든 `QMember`로 컴파일러가 타입을 검사하는 쿼리를 만든다. JPQL 문자열보다 오타를 일찍 잡고 조건 조립이 쉽다.
이 글은 Java 25, Spring Boot 4.1.1, Spring Framework 7, Jakarta Persistence 기준이다.
## 2. 당장 알아야 할 것
### 2.1 왜 JPQL 문자열이 불편한가
JPQL은 동적 조건마다 문자열 조각을 연결해야 하고 필드명 오타를 실행 시에야 발견한다. QueryDSL은 `QMember.name`처럼 생성된 경로를 컴파일러가 검사한다. 단, 최종 SQL과 실행 계획을 보장하는 도구는 아니다.
### 2.2 QueryDSL은 현재 어느 것을 쓰나
원 프로젝트 최신은 5.1.0(2024-01-29, Maven Central 메타데이터 확인), OpenFeign 포크 최신은 7.7(2026-09-23)이다. Spring Data JPA는 포크를 best-effort로 지원한다.
| 선택 | 좌표 | 판단 |
|---|---|---|
| 기본 추천 | `io.github.openfeign.querydsl:querydsl-jpa:7.7`, `querydsl-apt:7.7:jpa` | Jakarta·현재 릴리스 |
| 레거시 유지 | `com.querydsl:querydsl-jpa:5.1.0:jakarta` | 기존 BOM이 고정한 경우 |
두 groupId를 섞지 말고 `javax.persistence`/`jakarta.persistence` import도 통일한다.
### 2.3 Q 클래스는 소스가 아니라 빌드 산출물이다
`Member` 컴파일 때 processor가 Q 클래스를 만든다. 기본 출력은 보통 `build/generated/sources/annotationProcessor/java/main` 아래다. Q 클래스를 직접 작성하거나 커밋하지 않는다.
```kotlin
dependencies {
    implementation("io.github.openfeign.querydsl:querydsl-jpa:7.7")
    annotationProcessor("io.github.openfeign.querydsl:querydsl-apt:7.7:jpa")
    annotationProcessor("jakarta.persistence:jakarta.persistence-api")
    testAnnotationProcessor("io.github.openfeign.querydsl:querydsl-apt:7.7:jpa")
    testAnnotationProcessor("jakarta.persistence:jakarta.persistence-api")
}
```
Spring Data 공식 예제도 이 조합을 사용하며, Java 22 이상에서는 processor를 명시한다.
### 2.4 `JPAQueryFactory`는 한 번만 빈으로 만든다
```java
@Configuration
public class QuerydslConfig {
    @Bean
    JPAQueryFactory jpaQueryFactory(EntityManager entityManager) {
        return new JPAQueryFactory(entityManager);
    }
}
```
### 2.5 동적 조건은 null 반환 메서드로 만든다
```java
private BooleanExpression nameContains(String name) {
    return hasText(name) ? member.name.containsIgnoreCase(name) : null;
}
private BooleanExpression statusEq(MemberStatus status) {
    return status == null ? null : member.status.eq(status);
}
```
```java
query.selectFrom(member)
     .where(nameContains(condition.name()), statusEq(condition.status()))
     .fetch();
```
`where(Predicate...)`는 null predicate를 무시한다. 복잡한 누적·OR 분기에는 `BooleanBuilder`를 쓴다.
| 방식 | 적합한 상황 | 주의 |
|---|---|---|
| `BooleanExpression` + null | 정해진 검색 필드 | null을 직접 다시 호출하지 않는다 |
| `BooleanBuilder` | 반복문·OR 그룹 | 거대한 단일 메서드 주의 |
| 문자열 JPQL | 정적 레거시 | 오타·조합에 취약 |
## 3. 따라 하기
아래는 `compose.yaml`로 PostgreSQL을 띄우고 Spring Boot 4.1.1 애플리케이션이 `members`를 검색하는 실습이다. 포트 5432를 이미 사용하는 DB가 없다는 전제다.
### 3.1 디렉터리와 DB 만들기
`compose.yaml`
```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: querydsl_demo
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d querydsl_demo"]
      interval: 3s
      timeout: 3s
      retries: 10
```
```bash
docker compose up -d
docker compose ps
docker compose exec postgres psql -U app -d querydsl_demo -c 'select current_database();'
```
확인 방법: postgres가 `healthy`이고 psql 결과가 `querydsl_demo`다. 종료는 `docker compose down`이다.
### 3.2 Gradle 설정
`build.gradle.kts`
```kotlin
plugins {
    java
    id("org.springframework.boot") version "4.1.1"
    id("io.spring.dependency-management") version "1.1.7"
}
group = "com.example"
version = "0.0.1-SNAPSHOT"
java {
    toolchain { languageVersion = JavaLanguageVersion.of(25) }
}
repositories { mavenCentral() }
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("io.github.openfeign.querydsl:querydsl-jpa:7.7")
    runtimeOnly("org.postgresql:postgresql")
    annotationProcessor("org.springframework.boot:spring-boot-configuration-processor")
    annotationProcessor("io.github.openfeign.querydsl:querydsl-apt:7.7:jpa")
    annotationProcessor("jakarta.persistence:jakarta.persistence-api")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testAnnotationProcessor("io.github.openfeign.querydsl:querydsl-apt:7.7:jpa")
    testAnnotationProcessor("jakarta.persistence:jakarta.persistence-api")
}
tasks.withType<Test> { useJUnitPlatform() }
```
Maven은 dependency와 compiler plugin의 `annotationProcessorPaths`에 같은 좌표를 추가한다.
```bash
./gradlew clean compileJava
find build/generated -name 'Q*.java' -print
```
확인 방법: `compileJava` 성공 후 `build/generated/.../QMember.java`를 확인한다. IntelliJ는 Gradle Reload 후 `compileJava`를 실행한다.
### 3.3 설정과 엔티티
`src/main/resources/application.yml`
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/querydsl_demo
    username: app
    password: app
  jpa:
    hibernate:
      ddl-auto: create
    properties:
      hibernate:
        format_sql: true
logging:
  level:
    org.hibernate.SQL: debug
    org.hibernate.orm.jdbc.bind: trace
```
`src/main/java/com/example/querydsl/Member.java`
```java
package com.example.querydsl;
import jakarta.persistence.*;
@Entity
public class Member {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private String name;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    private MemberStatus status;
    protected Member() {}
    public Member(String name, MemberStatus status) { this.name = name; this.status = status; }
    public Long getId() { return id; }
    public String getName() { return name; }
    public MemberStatus getStatus() { return status; }
}
```
`src/main/java/com/example/querydsl/MemberStatus.java`
```java
package com.example.querydsl;
public enum MemberStatus { ACTIVE, INACTIVE }
```
### 3.4 리포지토리 fragment와 쿼리
Spring Data는 `XxxRepositoryCustom`와 `XxxRepositoryCustomImpl` fragment를 repository에 합성한다.
`src/main/java/com/example/querydsl/MemberSearchCondition.java`
```java
package com.example.querydsl;
public record MemberSearchCondition(String name, MemberStatus status) {}
```
`src/main/java/com/example/querydsl/MemberSummary.java`
```java
package com.example.querydsl;
import com.querydsl.core.annotations.QueryProjection;
public record MemberSummary(Long id, String name, MemberStatus status) {
    @QueryProjection public MemberSummary {}
}
```
`src/main/java/com/example/querydsl/MemberRepositoryCustom.java`
```java
package com.example.querydsl;
import org.springframework.data.domain.*;
public interface MemberRepositoryCustom {
    Page<MemberSummary> search(MemberSearchCondition condition, Pageable pageable);
}
```
`src/main/java/com/example/querydsl/MemberRepository.java`
```java
package com.example.querydsl;
import org.springframework.data.jpa.repository.JpaRepository;
public interface MemberRepository extends JpaRepository<Member, Long>, MemberRepositoryCustom {}
```
`src/main/java/com/example/querydsl/MemberRepositoryCustomImpl.java`
```java
package com.example.querydsl;
import static com.example.querydsl.QMember.member;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.List;
import org.springframework.data.domain.*;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.stereotype.Repository;
@Repository
class MemberRepositoryCustomImpl implements MemberRepositoryCustom {
    private final JPAQueryFactory query;
    MemberRepositoryCustomImpl(JPAQueryFactory query) { this.query = query; }
    @Override
    public Page<MemberSummary> search(MemberSearchCondition c, Pageable pageable) {
        List<MemberSummary> content = query.select(
                new QMemberSummary(member.id, member.name, member.status))
            .from(member)
            .where(nameContains(c.name()), statusEq(c.status()))
            .orderBy(member.id.desc())
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize())
            .fetch();
        return PageableExecutionUtils.getPage(content, pageable, () -> query
            .select(member.count()).from(member)
            .where(nameContains(c.name()), statusEq(c.status()))
            .fetchOne());
    }
    private BooleanExpression nameContains(String value) {
        return value == null || value.isBlank()
            ? null : member.name.containsIgnoreCase(value);
    }
    private BooleanExpression statusEq(MemberStatus value) {
        return value == null ? null : member.status.eq(value);
    }
}
```
DTO를 분리하려면 `new QMemberSummary(...)` 대신 생성자 projection을 쓴다.
```java
.select(com.querydsl.core.types.Projections.constructor(
    MemberSummary.class, member.id, member.name, member.status))
```
확인 방법: `./gradlew clean compileJava` 후 QMember와 QMemberSummary를 확인한다. (Spring 예제 미실행)
### 3.5 애플리케이션·API 실행
`src/main/java/com/example/querydsl/QuerydslApplication.java`
```java
package com.example.querydsl;
import jakarta.persistence.EntityManager;
import com.querydsl.jpa.impl.JPAQueryFactory;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.*;
@SpringBootApplication
public class QuerydslApplication {
    public static void main(String[] args) {
        SpringApplication.run(QuerydslApplication.class, args);
    }
}
@Configuration
class QuerydslConfig {
    @Bean JPAQueryFactory jpaQueryFactory(EntityManager em) {
        return new JPAQueryFactory(em);
    }
}
```
`src/main/java/com/example/querydsl/MemberController.java`
```java
package com.example.querydsl;
import org.springframework.data.domain.*;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/members")
class MemberController {
    private final MemberRepository repository;
    MemberController(MemberRepository repository) { this.repository = repository; }
    @PostMapping
    Member create(@RequestBody CreateMember request) {
        return repository.save(new Member(request.name(), request.status()));
    }
    @GetMapping
    Page<MemberSummary> search(@RequestParam(required = false) String name,
                               @RequestParam(required = false) MemberStatus status,
                               Pageable pageable) {
        return repository.search(new MemberSearchCondition(name, status), pageable);
    }
    record CreateMember(String name, MemberStatus status) {}
}
```
POST는 교육용이다. (미실행)
```bash
./gradlew bootRun
curl -X POST localhost:8080/members -H 'Content-Type: application/json' \
  -d '{"name":"Kim","status":"ACTIVE"}'
curl -X POST localhost:8080/members -H 'Content-Type: application/json' \
  -d '{"name":"Lee","status":"INACTIVE"}'
curl 'http://localhost:8080/members?name=ki&status=ACTIVE&page=0&size=10'
```
확인 방법: `content`에 Kim만 있고 `totalElements`가 1이며 로그에 content/count SQL이 보인다.
## 4. 치트시트
| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| `QMember.member` | 엔티티 경로 | `member.name` | Q 생성 전에는 컴파일 불가 |
| `JPAQueryFactory` | JPA 진입점 | `query.selectFrom(member)` | static/global factory 금지 |
| `where` | 조건 조립 | `.where(a(), b())` | null predicate는 무시됨 |
| `fetch` | 목록 실행 | `.fetch()` | 전부 메모리에 올림 |
| `fetchOne` | 단건/집계 | `.select(member.count())` | 다건이면 예외 |
| `fetchJoin` | 연관 즉시 로딩 | `.join(x.y).fetchJoin()` | 컬렉션 페이지와 충돌 |
| `Projections.constructor` | DTO 생성자 | `Projections.constructor(Dto.class,...)` | 순서·타입 일치 |
| `@QueryProjection` | DTO Q 타입 | `new QMemberSummary(...)` | DTO가 QueryDSL에 결합 |
| `PageableExecutionUtils` | 지연 count | `getPage(content,...)` | count 조건은 본문과 동일 |
| `BooleanBuilder` | 조건 누적 | `builder.and(...)` | 거대한 메서드 주의 |
| `annotationProcessor` | Q 생성 | `querydsl-apt:7.7:jpa` | implementation만으로 부족 |
대안: 단순 필터는 Specification, SQL은 jOOQ, 직접 SQL은 `JdbcClient`
## 5. 자주 나는 에러와 해결
1. **`cannot find symbol: class QMember`** → APT 누락 → `querydsl-apt:7.7:jpa`와 Jakarta API를 `annotationProcessor`에 넣고 `clean compileJava`.
2. **`NoClassDefFoundError: javax/persistence/Entity`** → `javax`와 `jakarta` 혼용 → import·실행 dependency·processor를 Jakarta 기준으로 통일.
3. **`Could not find ... querydsl-apt:7.7`** → classifier 누락 → `io.github.openfeign.querydsl:querydsl-apt:7.7:jpa` 사용.
4. **`Duplicate class ... QMember`** → 수동 Q 파일 또는 두 groupId 중복 → 수동 파일 제거, `clean`, dependency tree에서 하나만 남김.
5. **IntelliJ에서만 Q 타입이 빨간색** → generated source 미동기화 → Gradle Reload 후 `compileJava`.
6. **결과 중복·메모리 페이징 경고** → 컬렉션 fetch join과 페이지 결합 → ID 페이지와 본 조회를 분리.
## 6. 한 단계 더
Q 클래스는 엔티티 메타데이터를 코드로 재현해 JPA provider에 넘긴다. 타입 검사는 강해지지만 실행 계획까지 검증하지는 않는다. content와 count는 서로 다른 SQL이다.
일반 Spring Data는 → S10, JPA 원리는 → S09, Docker는 → P14 참조.
## 7. 자가점검 Q&A (면접 대비)
### Q1. 왜 JPQL보다 타입 안전한가?
생성된 `QMember` 경로를 Java 컴파일러가 검사하기 때문이다. 꼬리질문: Q가 없으면? → APT, classifier, `clean compileJava`, generated 경로를 확인한다.
### Q2. `implementation`만으로 Q가 생기나?
아니다. `querydsl-apt`를 `annotationProcessor`에 둬야 한다. 꼬리질문: 테스트는? → `testAnnotationProcessor`에도 둔다.
### Q3. null `BooleanExpression`과 `BooleanBuilder` 중 기본은?
정해진 검색 필드는 전자, 반복 누적·복잡한 OR은 후자다. 꼬리질문: null을 다시 호출하면? → NPE이므로 `where` 인자로 넘긴다.
### Q4. fetch join이 N+1을 항상 해결하나?
아니다. 컬렉션은 행 증폭과 페이지 문제도 만든다. 꼬리질문: 대안은? → ID 페이지 후 `in` 본 조회다.
### Q5. count를 분리하는 이유는?
content는 offset/limit, count는 조건의 개수만 필요하기 때문이다. 꼬리질문: `PageableExecutionUtils`는? → 가능한 경우 count 실행을 늦추거나 생략한다.
### Q6. 왜 `MemberRepositoryCustomImpl`인가?
Spring Data fragment가 interface 이름과 `Impl` postfix로 구현을 찾기 때문이다. 꼬리질문: 공식 권장 구조는? → fragment interface + 구현체를 repository가 상속한다.
## 8. 참고문헌
- OpenFeign QueryDSL 저장소 — https://github.com/OpenFeign/querydsl
- OpenFeign Releases — https://github.com/OpenFeign/querydsl/releases
- 원 QueryDSL 저장소·Releases — https://github.com/querydsl/querydsl
- Spring Data JPA Extensions — https://docs.spring.io/spring-data/jpa/reference/repositories/core-extensions.html
- Custom Repository Implementations — https://docs.spring.io/spring-data/jpa/reference/repositories/custom-implementations.html
