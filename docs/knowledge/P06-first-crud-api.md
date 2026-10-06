# P06. 첫 CRUD API 만들기 — 처음부터 끝까지 따라 하기

> - HTTP로 게시글 CRUD를 DB에 연결한다.
> - POST 201+Location, GET/PUT 200, DELETE 204, 400/404.
> - Boot 4.1.1·Java 25, H2/MySQL.

## 1. 한 줄로 말하면

CRUD API는 HTTP로 게시글을 다룬다. Controller는 요청, Service는 로직, Repository는 DB다.

## 2. 당장 알아야 할 것

1. 생성 201·조회/수정 200·삭제 204·없음 404.
2. DTO와 `@Valid` 검증.
3. 없는 ID는 전역 예외로 404.
4. 쓰기는 `@Transactional`, 조회는 readOnly.
5. 목록은 크기 제한 `Pageable`.
6. H2 휘발성, MySQL 계정 환경 변수.
7. 웹 `@WebMvcTest`, 통합 `@SpringBootTest`.

## 3. 따라 하기

### 3.1 프로젝트 생성

Initializr: Gradle-Kotlin·Java, Boot 4.1.1·JDK 25, Web·JPA·Validation·H2·Lombok·MySQL.

`build.gradle.kts` (Boot 4 MVC starter):

```kotlin
plugins {
    java
    id("org.springframework.boot") version "4.1.1"
    id("io.spring.dependency-management") version "1.1.7"
}
java { toolchain { languageVersion = JavaLanguageVersion.of(25) } }
repositories { mavenCentral() }
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    runtimeOnly("com.h2database:h2")
    runtimeOnly("com.mysql:mysql-connector-j")
    compileOnly("org.projectlombok:lombok")
    annotationProcessor("org.projectlombok:lombok")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
tasks.withType<Test> { useJUnitPlatform() }
```

Maven: `spring-boot-starter-webmvc`, `spring-boot-starter-data-jpa`, `spring-boot-starter-validation`; H2/MySQL runtime, test scope, Lombok processor.

**확인:** `./gradlew dependencies` 성공.

### 3.2 설정·진입점

`src/main/resources/application.yml`:

```yaml
spring:
  application:
    name: first-crud-api
  datasource:
    url: jdbc:h2:mem:posts
    username: sa
    password:
  jpa:
    hibernate:
      ddl-auto: update
    open-in-view: false
    show-sql: true
    properties:
      hibernate:
        format_sql: true
  h2:
    console:
      enabled: true
      path: /h2-console
  data:
    web:
      pageable:
        max-page-size: 100
```

`update`는 실습용이고 운영 스키마는 마이그레이션으로 관리한다.

`src/main/java/com/example/posts/FirstCrudApiApplication.java`:

```java
package com.example.posts;
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
@SpringBootApplication
public class FirstCrudApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(FirstCrudApiApplication.class, args);
    }
}
```

**확인:** `./gradlew bootRun`; H2 콘솔 `/h2-console`, URL `jdbc:h2:mem:posts`.

### 3.3 Entity와 Repository

`src/main/java/com/example/posts/post/Post.java`:

```java
package com.example.posts.post;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name = "posts") @Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String title;
    private String content;
    public Post(String title, String content) {
        this.title = title; this.content = content;
    }
    public void change(String title, String content) {
        this.title = title; this.content = content;
    }
}
```

`src/main/java/com/example/posts/post/PostRepository.java`:

```java
package com.example.posts.post;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PostRepository extends JpaRepository<Post, Long> {}
```

**확인:** 시작 로그에 `posts` DDL이 보인다.

### 3.4 DTO와 Service

`src/main/java/com/example/posts/post/PostRequest.java`:

```java
package com.example.posts.post;
import jakarta.validation.constraints.*;
public record PostRequest(@NotBlank @Size(max = 200) String title,
                          @NotBlank @Size(max = 10000) String content) {}
```

`src/main/java/com/example/posts/post/PostResponse.java`:

```java
package com.example.posts.post;
public record PostResponse(Long id, String title, String content) {}
```

`src/main/java/com/example/posts/post/PostNotFoundException.java`:

```java
package com.example.posts.post;
public class PostNotFoundException extends RuntimeException {
    public PostNotFoundException(Long id) { super("게시글을 찾을 수 없습니다. id=" + id); }
}
```

`src/main/java/com/example/posts/post/PostService.java`:

```java
package com.example.posts.post;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service @Transactional(readOnly = true)
public class PostService {
    private final PostRepository repository;
    public PostService(PostRepository repository) { this.repository = repository; }
    @Transactional
    public PostResponse create(PostRequest r) {
        return response(repository.save(new Post(r.title(), r.content())));
    }
    public PostResponse find(Long id) { return response(get(id)); }
    @Transactional
    public PostResponse update(Long id, PostRequest r) {
        Post p = get(id); p.change(r.title(), r.content()); return response(p);
    }
    @Transactional public void delete(Long id) { repository.delete(get(id)); }
    public Page<PostResponse> list(Pageable p) { return repository.findAll(p).map(this::response); }
    private Post get(Long id) {
        return repository.findById(id).orElseThrow(() -> new PostNotFoundException(id));
    }
    private PostResponse response(Post p) {
        return new PostResponse(p.getId(), p.getTitle(), p.getContent());
    }
}
```

확인: UPDATE SQL 로그. 영속 Entity 변경은 커밋 때 반영된다. JPA → S09, 트랜잭션 → S08.

### 3.5 오류 응답과 Controller

`src/main/java/com/example/posts/ApiExceptionHandler.java`:

```java
package com.example.posts;
import java.util.*;
import com.example.posts.post.PostNotFoundException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(PostNotFoundException.class)
    public ProblemDetail notFound(PostNotFoundException e) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, e.getMessage());
        p.setTitle("Post not found"); return p;
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail invalid(MethodArgumentNotValidException e) {
        Map<String, String> errors = new TreeMap<>();
        e.getBindingResult().getFieldErrors().forEach(x -> errors.putIfAbsent(x.getField(),
                Objects.requireNonNullElse(x.getDefaultMessage(), "invalid value")));
        ProblemDetail p = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "요청 필드를 확인하세요.");
        p.setTitle("Invalid request"); p.setProperty("errors", errors); return p;
    }
}
```

`src/main/java/com/example/posts/post/PostController.java`:

```java
package com.example.posts.post;
import java.net.URI;
import jakarta.validation.Valid;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/posts")
public class PostController {
    private final PostService service;
    public PostController(PostService service) { this.service = service; }
    @PostMapping
    public ResponseEntity<PostResponse> create(@Valid @RequestBody PostRequest r) {
        PostResponse p = service.create(r);
        return ResponseEntity.created(URI.create("/api/posts/" + p.id())).body(p);
    }
    @GetMapping
    public Page<PostResponse> list(@PageableDefault(size = 20, sort = "id",
            direction = Sort.Direction.DESC) Pageable p) { return service.list(p); }
    @GetMapping("/{id}") public PostResponse find(@PathVariable Long id) { return service.find(id); }
    @PutMapping("/{id}")
    public PostResponse update(@PathVariable Long id, @Valid @RequestBody PostRequest r) {
        return service.update(id, r);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id); return ResponseEntity.noContent().build();
    }
}
```

확인: 없는 ID 404, 검증 실패 400. `ProblemDetail`은 RFC 9457 형식이다. → S05.

### 3.6 curl로 확인

`./gradlew bootRun` 후:

```bash
curl -i -X POST localhost:8080/api/posts -H 'Content-Type: application/json' \
  -d '{"title":"첫 글","content":"CRUD 실습"}'
```

**확인:** 201과 `Location` 헤더.

```bash
curl -i localhost:8080/api/posts/1
curl -i -X PUT localhost:8080/api/posts/1 -H 'Content-Type: application/json' \
  -d '{"title":"수정","content":"수정 내용"}'
curl -i -X DELETE localhost:8080/api/posts/1
curl -i localhost:8080/api/posts/1
curl -i 'localhost:8080/api/posts?page=0&size=10&sort=id,desc'
curl -i -X POST localhost:8080/api/posts -H 'Content-Type: application/json' -d '{"title":" ","content":""}'
```

**확인:** 200/204/404/400. 페이지 0부터, 최대 100.

### 3.7 MySQL 프로파일

```bash
docker run --name p06-mysql -e MYSQL_ROOT_PASSWORD=localpass -e MYSQL_DATABASE=posts -e MYSQL_USER=app -e MYSQL_PASSWORD=apppass -p 3306:3306 -d mysql:8.4
```

`src/main/resources/application-mysql.yml`:

```yaml
spring:
  datasource:
    url: "${DB_URL:jdbc:mysql://localhost:3306/posts?serverTimezone=UTC}"
    username: "${DB_USERNAME:app}"
    password: "${DB_PASSWORD:apppass}"
  jpa:
    hibernate:
      ddl-auto: update
```

`mysqladmin ping`으로 준비를 확인하고 `SPRING_PROFILES_ACTIVE=mysql ./gradlew bootRun`. H2 데이터는 옮겨지지 않는다.

### 3.8 테스트 2개

`src/test/java/com/example/posts/post/PostControllerTest.java`:

```java
package com.example.posts.post;
import com.example.posts.ApiExceptionHandler;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.*;
import org.springframework.boot.test.autoconfigure.web.servlet.*;
import org.springframework.context.annotation.*;
import org.springframework.http.*;
import org.springframework.test.context.bean.override.mockito.*;
import org.springframework.test.web.servlet.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@WebMvcTest(PostController.class) @Import(ApiExceptionHandler.class)
class PostControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean PostService service;
    @Test void createsWithLocation() throws Exception {
        when(service.create(any(PostRequest.class))).thenReturn(new PostResponse(7L, "첫 글", "본문"));
        mvc.perform(post("/api/posts").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"첫 글\",\"content\":\"본문\"}"))
            .andExpect(status().isCreated()).andExpect(header().string("Location", "/api/posts/7"))
            .andExpect(jsonPath("$.title").value("첫 글"));
    }
}
```

`src/test/java/com/example/posts/post/PostApiIntegrationTest.java`:

```java
package com.example.posts.post;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.*;
import org.springframework.boot.test.autoconfigure.web.servlet.*;
import org.springframework.boot.test.context.*;
import org.springframework.http.*;
import org.springframework.test.web.servlet.*;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@SpringBootTest @AutoConfigureMockMvc
class PostApiIntegrationTest {
    @Autowired MockMvc mvc;
    @Test void createsThenReadsFromH2() throws Exception {
        var result = mvc.perform(post("/api/posts").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"통합 테스트\",\"content\":\"H2 저장\"}"))
            .andExpect(status().isCreated()).andReturn();
        String location = result.getResponse().getHeader("Location");
        assertNotNull(location);
        mvc.perform(get(location)).andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("통합 테스트"))
            .andExpect(jsonPath("$.content").value("H2 저장"));
    }
}
```

Spring 코드 미실행. 실행: `./gradlew test`. 심화 → S18.

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| `@Valid` | 검증 | DTO | 실행점 |
| `@Transactional` | 트랜잭션 | Service | 프록시 |
| `ResponseEntity` | HTTP 응답 | `created(uri)` | 204 빈 본문 |
| `ProblemDetail` | 오류 | 400/404 | 정보 주의 |

## 5. 자주 나는 에러와 해결

- `Failed to configure a DataSource` → URL/드라이버 → runtime 확인.
- `Not a managed type` → Entity 미스캔 → 루트 패키지.
- 검증 안 됨 → `@Valid` 누락 → 인자에 추가.
- 조회 500 → `Optional.get()` → 404 예외 처리.
- MySQL 연결 실패 → 미준비/포트 오류 → ping, 3306.

## 6. 한 단계 더

JSON 변환기가 본문을 DTO로 읽고 `@Valid`가 검사한다.  
Controller는 HTTP 경로를 Service 호출에 연결한다.  
Service 트랜잭션이 Repository 접근을 감싼다.  
JPA는 커밋 때 변경 SQL을 보낸다.  
Advice는 `ProblemDetail`, Pageable은 조회 범위를 처리한다.  
심화: JPA S09, 트랜잭션 S08, HTTP·MVC S05/S06, 테스트 S18.

## 7. 자가점검 Q&A (면접 대비)

**Q1. 생성은 왜 201과 Location인가?** 201은 생성, Location은 생성된 URI다. 본문도 반환할 수 있다.

꼬리질문: URI 결정은? 답: 서버가 Location을 응답한다.

**Q2. Entity를 반환하면?** API가 내부 모델에 결합되고 순환 참조·조회·필드 노출이 생길 수 있다. DTO로 필드를 제한한다.

꼬리질문: 변환은? 답: 매퍼.

**Q3. `@Valid`의 역할은?** 요청에서 DTO 제약을 실행한다. 빠지면 검증 없이 Service로 넘어가므로 400 응답도 만들 수 없다.

꼬리질문: 규칙 위치는? 답: Service.

**Q4. 수정 후 `save()`가 불필요한 이유는?** 관리 Entity 변경이 커밋 때 SQL로 반영된다. → S09.

꼬리질문: 분리 객체도 같은가? 답: 저장 필요.

**Q5. `Pageable`의 장점은?** 페이지·정렬을 DB에 전달해 전체 조회 부담을 줄인다. 최대 크기도 제한한다.

꼬리질문: count가 불필요하면? 답: `Slice`.

**Q6. H2 테스트가 MySQL 운영을 보장하나?** 아니다. SQL·타입·제약 차이가 있어 MySQL 검증이 필요하다.

꼬리질문: 운영 DDL은? 답: 마이그레이션.

## 8. 참고문헌

- SQL Databases — https://docs.spring.io/spring-boot/reference/data/sql.html — H2.
- Validation — https://docs.spring.io/spring-boot/reference/io/validation.html — 검증.
- Error Responses — https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html — 오류.
- Testing Spring Boot — https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html — 테스트.
