# 13-7. API 문서 — Swagger UI

> 시나리오 DB(`community`) — 앱을 기본 프로파일로 띄운다.

## 상황

> "앱 팀이 새로 합류했는데 API가 몇 개인지, 요청에 뭘 넣어야 하는지 매번 물어봐요. 코드에서 문서를 자동으로 만들어서 브라우저로 보고 바로 호출도 해 볼 수 있게 해 주세요. 그런데 운영자 API까지 앱 팀 문서에 보이면 곤란해요."

13장까지 만든 API는 30개가 넘는다. 문서를 손으로 쓰면 코드가 바뀔 때마다 어긋난다. **springdoc-openapi**는 실행 중인 앱의 컨트롤러·DTO·검증 애노테이션을 읽어 OpenAPI 문서(JSON)를 만들고, 그 문서를 Swagger UI 화면으로 보여 준다.

이 단계에서 할 것은 네 가지다.

- **버전 맞추기** — Spring Boot 4에는 springdoc **3.x**를 쓴다(2.x는 Boot 3용). 3.1.1의 parent POM은 `spring-boot-starter-parent 4.1.0`이다(Maven Central에서 확인). Boot BOM이 관리하지 않는 라이브러리라 버전을 직접 적는다.
- **인증 표시** — Bearer 토큰 입력칸([Authorize])을 단다.
- **문서에 나오면 안 되는 것 빼기** — `@LoginMember AuthenticatedMember`는 요청 값이 아니라 인터셉터가 넣는 값이다. 그대로 두면 문서에 `me`라는 쿼리 파라미터로 나온다(실측).
- **나누기** — 사용자용(`public`)과 운영용(`admin`) 문서를 그룹으로 나눈다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "Swagger UI",
  "summary": "브라우저로 /swagger-ui/index.html — 위쪽에서 public/admin 문서를 고르고, [Authorize]에 토큰을 넣고 [Try it out].",
  "screen": [
    { "type": "bar", "id": "bar", "label": "javaExperience 게시판 API 13-7", "right": "Select a definition: public" },
    { "type": "actions", "id": "auth", "items": [{ "id": "authorize", "label": "Authorize", "variant": "secondary" }] },
    {
      "type": "list",
      "id": "ops",
      "items": [
        { "id": "op-report", "title": "POST /api/reports — 글·댓글 신고", "meta": "201 · 400 · 404 · 409" },
        { "id": "op-posts", "title": "POST /api/posts — 글쓰기", "meta": "1분에 5개까지" },
        { "id": "op-noti", "title": "GET /api/me/notifications", "meta": "unreadOnly · size · cursor" }
      ]
    },
    { "type": "code", "id": "json", "label": "/v3/api-docs/public", "value": "{\"openapi\": \"3.1.0\", \"info\": {\"title\": \"javaExperience 게시판 API\", ...}, \"paths\": {...}}" }
  ],
  "flows": [
    {
      "name": "문서 열기",
      "steps": [
        { "kind": "user", "text": "브라우저로 /swagger-ui/index.html을 연다", "focus": ["bar"] },
        { "kind": "request", "method": "GET", "path": "/v3/api-docs/public" },
        { "kind": "server", "text": "springdoc이 컨트롤러 매핑·DTO·검증 애노테이션·@Operation을 읽어 OpenAPI 3.1 JSON을 만든다(/api/admin/** 제외, AuthenticatedMember 제외)" },
        { "kind": "response", "status": 200, "body": "{\"openapi\": \"3.1.0\", \"paths\": {\"/api/reports\": {\"post\": {\"summary\": \"글·댓글 신고\", ...}}}, \"components\": {\"securitySchemes\": {\"bearerAuth\": {\"type\": \"http\", \"scheme\": \"bearer\"}}}}" },
        { "kind": "screen", "text": "API 목록이 그려진다", "focus": ["ops", "json"] }
      ]
    },
    {
      "name": "화면에서 호출해 보기",
      "steps": [
        { "kind": "user", "text": "[Authorize]에 tok-kimjava를 넣고 GET /api/me/notifications의 [Try it out] → [Execute]", "focus": ["authorize", "op-noti"] },
        { "kind": "request", "method": "GET", "path": "/api/me/notifications?size=20", "headers": ["Authorization: Bearer tok-kimjava"] },
        { "kind": "response", "status": 200, "body": "{\"items\": [...], \"unreadCount\": 0, \"nextCursor\": null}" },
        { "kind": "screen", "text": "응답 본문·헤더·curl 명령이 문서 안에 보인다", "focus": ["op-noti"] }
      ]
    }
  ]
}
```

## 만들 것

**의존성** — `build.gradle`

```groovy
implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:3.1.1'
```

**주소** — `/api` 밖이라 1-6 인터셉터(토큰 확인)와 상관없다

| 주소 | 내용 |
|---|---|
| `/swagger-ui/index.html` | 화면 |
| `/v3/api-docs/public` | 사용자용 문서 JSON — `/api/**`에서 `/api/admin/**`을 뺀 것 |
| `/v3/api-docs/admin` | 운영용 문서 JSON — `/api/admin/**`만 |
| `/v3/api-docs/swagger-config` | 화면이 읽는 그룹 목록 |

Swagger UI를 처음 열 때는 `public` 그룹을 선택한다(`springdoc.swagger-ui.urls-primary-name: public`). 그룹 구분은 **접근 권한이 아니다**. 이 학습 앱의 `/v3/api-docs/admin`은 주소를 알면 누구나 읽을 수 있으므로 운영 배포에서는 문서 기능을 끄거나 인증·인가를 따로 적용한다.

**문서 내용**

| 항목 | 내용 |
|---|---|
| 제목·버전 | `info.title` = `javaExperience 게시판 API` |
| 인증 | `components.securitySchemes.bearerAuth` = HTTP `bearer`, 모든 API에 적용(GET은 토큰 없이도 되지만 넣으면 그 회원 기준) |
| 숨길 것 | `AuthenticatedMember` 매개변수 — 문서의 `parameters`에 나오지 않는다 |
| 설명 | `POST /api/reports`에 `@Operation(summary = "글·댓글 신고")`와 응답 `201`·`400`·`404`·`409`(`409` 설명 "이미 신고함", 오류 본문은 `ProblemDetail`). `POST /api/posts`에도 `summary` |
| CORS | 문서 주소는 `/api/**` 매핑 밖이다. 브라우저 화면(다른 출처)에서 읽을 수 있게 `/v3/api-docs/**`·`/swagger-ui/**`에 GET 매핑을 더한다 |

- 새 입력 값은 없다(문서는 읽기 전용).
- **운영 프로파일** — `src/main/resources/application-prod.yml`에서 `springdoc.api-docs.enabled=false`와 `springdoc.swagger-ui.enabled=false`를 설정한다. 그룹은 접근 권한이 아니므로 운영 배포에서는 문서 엔드포인트 자체를 끈다.

## 구현 가이드

먼저 **만들 것**과 C 기준대로 작성한다. 역할을 펼치면 실행 검증한 코드의 파일 전문을 볼 수 있다. 이 단계는 컨트롤러·DTO에서 문서를 생성하며 DB 조회 코드를 바꾸지 않으므로 MyBatis에서도 같은 설정을 사용한다.

<details>
<summary>Controller — 글쓰기 문서화</summary>

`src/main/java/org/example/post/PostController.java`

```java
package org.example.post;

import jakarta.validation.Valid;
import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.example.tag.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private static final Logger log = LoggerFactory.getLogger(PostController.class);

    private final PostService postService;
    private final PostQueryService postQueryService;

    public PostController(PostService postService, PostQueryService postQueryService) {
        this.postService = postService;
        this.postQueryService = postQueryService;
    }

    @GetMapping("/{id}")
    public PostDetailResponse getOne(@PathVariable Long id, @LoginMember AuthenticatedMember viewer) {
        return postQueryService.getDetail(id, viewer);
    }

    @Operation(summary = "글쓰기", description = "1분에 5개까지(13-5, 넘으면 429 + Retry-After). 금칙어(13-4)가 있으면 400.")
    @PostMapping
    public ResponseEntity<PostResponse> create(@LoginMember AuthenticatedMember loginMember,
                                                @Valid @RequestBody PostCreateRequest request) {
        log.info("게시글 작성 요청 제목: {}", request.title());

        Post post = postService.create(loginMember.id(), request);
        PostResponse response = toResponse(post);

        return ResponseEntity.created(URI.create("/api/posts/" + post.getId())).body(response);
    }

    @PostMapping("/{sourceId}/copies")
    public ResponseEntity<PostResponse> copy(@PathVariable Long sourceId,
                                             @RequestParam(defaultValue = "false") boolean copyTags,
                                             @LoginMember AuthenticatedMember loginMember,
                                             @Valid @RequestBody CopyPostRequest request) {
        Post post = postService.copy(sourceId, loginMember.id(), copyTags, request);
        return ResponseEntity.created(URI.create("/api/posts/" + post.getId()))
                .body(toResponse(post));
    }

    @PutMapping("/{id}")
    public PostDetailResponse replace(@PathVariable Long id,
                                      @LoginMember AuthenticatedMember loginMember,
                                      @Valid @RequestBody PostReplaceRequest request) {
        return postService.replace(id, loginMember, request);
    }

    @PatchMapping("/{id}")
    public PostDetailResponse patch(@PathVariable Long id,
                                     @LoginMember AuthenticatedMember loginMember,
                                     @RequestBody PostUpdateRequest request) {
        Post post = postService.patch(id, loginMember, request);
        return toDetailResponse(post);
    }

    // 11-1 임시저장 글 발행
    @PostMapping("/{id}/publish")
    public PostDetailResponse publish(@PathVariable Long id, @LoginMember AuthenticatedMember loginMember) {
        return toDetailResponse(postService.publish(id, loginMember));
    }

    // 11-5 휴지통에서 되살리기
    @PostMapping("/{id}/restore")
    public PostDetailResponse restore(@PathVariable Long id, @LoginMember AuthenticatedMember loginMember) {
        if (id <= 0) throw new InvalidPostFieldException("id", "id는 양의 정수여야 합니다.");
        return toDetailResponse(postService.restore(id, loginMember));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @LoginMember AuthenticatedMember loginMember) {
        postService.delete(id, loginMember);
    }

    private PostDetailResponse toDetailResponse(Post post) {
        List<String> tagNames = post.getTags().stream().map(Tag::getName).toList();
        AuthorResponse author = new AuthorResponse(post.getAuthor().getId(), post.getAuthor().getNickname());
        return new PostDetailResponse(
                post.getId(),
                post.getBoard().getSlug(),
                post.getTitle(),
                post.getContent(),
                tagNames,
                post.getVisibility(),
                author,
                post.getViewCount(),
                post.getLikeCount(),
                post.getCommentCount(),
                post.getImages().stream().map(i -> new ImageResponse(i.getId(), i.url())).toList(),
                post.getStatus(),
                post.getPublishedAt(),
                post.getCreatedAt()
        );
    }

    private PostResponse toResponse(Post post) {
        List<String> tagNames = post.getTags().stream().map(Tag::getName).toList();
        AuthorResponse author = new AuthorResponse(post.getAuthor().getId(), post.getAuthor().getNickname());
        return new PostResponse(
                post.getId(),
                post.getBoard().getSlug(),
                post.getTitle(),
                post.getContent(),
                tagNames,
                post.getVisibility(),
                author,
                post.getStatus(),
                post.getPublishedAt(),
                post.getCreatedAt()
        );
    }
}
```

</details>

<details>
<summary>Controller — 신고 응답 코드 문서화</summary>

`src/main/java/org/example/report/ReportController.java`

```java
package org.example.report;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Validator;
import org.example.post.InvalidParametersException;
import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import tools.jackson.databind.JsonNode;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class ReportController {

    private final ReportService reportService;
    private final Validator validator;

    public ReportController(ReportService reportService, Validator validator) {
        this.reportService = reportService;
        this.validator = validator;
    }

    // POST라 토큰 없음은 인터셉터가 401로 막는다
    @Operation(summary = "글·댓글 신고",
            description = "같은 사람이 같은 대상을 두 번 신고하면 409. 사유가 ETC면 detail 필수.")
    @ApiResponse(responseCode = "201", description = "신고 접수")
    @ApiResponse(responseCode = "400", description = "필드 규칙 위반 — errors에 틀린 필드 모두",
            content = @Content(mediaType = "application/problem+json", schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "404", description = "대상 없음·지워짐·볼 수 없음",
            content = @Content(mediaType = "application/problem+json", schema = @Schema(implementation = ProblemDetail.class)))
    @ApiResponse(responseCode = "409", description = "이미 신고함",
            content = @Content(mediaType = "application/problem+json", schema = @Schema(implementation = ProblemDetail.class)))
    @PostMapping("/api/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public ReportResponse report(@LoginMember AuthenticatedMember me, @RequestBody JsonNode body) {
        ReportRequest.Parsed parsed = ReportRequest.parse(body);
        ReportRequest request = parsed.request();
        Map<String, String> errors = new LinkedHashMap<>(parsed.errors());
        validator.validate(request).forEach(v -> errors.putIfAbsent(v.getPropertyPath().toString(), v.getMessage()));
        if (!errors.isEmpty()) {
            throw new InvalidParametersException(errors);
        }
        return reportService.report(me, request);
    }
}
```

</details>

<details>
<summary>DTO — 검증 애노테이션이 스키마가 되는 요청</summary>

`src/main/java/org/example/post/PostCreateRequest.java`

```java
package org.example.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import tools.jackson.databind.JsonNode;

import java.util.List;

// 게시글 작성 요청 — Bean Validation으로 저장 전에 막는다
public record PostCreateRequest(
        @NotBlank(message = "게시판을 선택해 주세요.")
        String boardSlug,

        @NotBlank(message = "제목을 입력해 주세요.")
        @Size(max = 200, message = "제목은 200자 이하여야 합니다.")
        String title,

        @NotBlank(message = "본문을 입력해 주세요.")
        String content,

        @Size(max = 5, message = "태그는 5개까지입니다.")
        List<@NotNull @Size(min = 1, max = 30, message = "태그 이름은 1~30자여야 합니다.") String> tags,

        @Pattern(regexp = "PUBLIC|FOLLOWERS", message = "공개 범위는 PUBLIC 또는 FOLLOWERS여야 합니다.")
        String visibility,

        // 11-1 임시저장 — 생략하면 PUBLISHED(바로 발행)
        @Pattern(regexp = "DRAFT|PUBLISHED", message = "상태는 DRAFT 또는 PUBLISHED여야 합니다.")
        String status,

        // 11-2 먼저 올려 둔 이미지(POST /api/images)의 id — 이 글에 붙인다
        JsonNode imageIds
) {
}
```

</details>

<details>
<summary>OpenAPI 설정 — Bearer 인증·public/admin 그룹</summary>

`src/main/java/org/example/config/OpenApiConfig.java`

```java
package org.example.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.example.auth.AuthenticatedMember;
import org.springdoc.core.models.GroupedOpenApi;
import org.springdoc.core.utils.SpringDocUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// 13-7 API 문서 — /v3/api-docs/{그룹}(JSON), /swagger-ui/index.html(화면)
@Configuration
public class OpenApiConfig {

    static {
        // @LoginMember AuthenticatedMember는 요청 값이 아니라 인터셉터가 넣는 값 — 문서에 "me" 같은 쿼리 파라미터로 나오지 않게 뺀다
        SpringDocUtils.getConfig().addRequestWrapperToIgnore(AuthenticatedMember.class);
    }

    @Bean
    public OpenAPI boardOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("javaExperience 게시판 API")
                        .version("13-7")
                        .description("시나리오 1~13장에서 만든 게시판 API. 토큰은 [Authorize]에 tok-kimjava 같은 값을 넣는다(Bearer 생략)."))
                // 모든 API에 "Bearer 토큰" 입력칸을 붙인다 — GET은 토큰 없이도 되지만, 넣으면 그 회원 기준으로 답한다
                .components(new Components().addSecuritySchemes("bearerAuth",
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer")))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
    }

    // 사용자용과 운영용을 나눈다 — 운영 API를 앱 개발자 문서에 섞지 않는다
    @Bean
    public GroupedOpenApi publicApi() {
        return GroupedOpenApi.builder()
                .group("public")
                .pathsToMatch("/api/**")
                .pathsToExclude("/api/admin/**")
                .build();
    }

    @Bean
    public GroupedOpenApi adminApi() {
        return GroupedOpenApi.builder()
                .group("admin")
                .pathsToMatch("/api/admin/**")
                .build();
    }
}
```

</details>

<details>
<summary>설정 — springdoc 3.x 의존성</summary>

`build.gradle`

```groovy
plugins {
    id 'java'
    // bootRun / bootJar 태스크 제공 + 실행 가능한 fat jar 패키징
    id 'org.springframework.boot' version '4.1.1'
    // Boot BOM을 적용해서 아래 의존성들의 버전을 생략할 수 있게 해줌
    id 'io.spring.dependency-management' version '1.1.7'
}

group = 'org.example'
version = '1.0-SNAPSHOT'

java {
    toolchain {
        // 컴파일·실행 JDK를 고정 (Boot 4는 Java 17 이상 필요, 로컬에 설치된 21 사용)
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    // Spring MVC + 내장 Tomcat + Jackson (Boot 4부터 starter-web → starter-webmvc로 이름 변경)
    implementation 'org.springframework.boot:spring-boot-starter-webmvc'
    // JPA(Hibernate) + HikariCP 커넥션 풀
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    // @Valid, @NotBlank 같은 요청 값 검증
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    // MySQL JDBC 드라이버 — 컴파일엔 필요 없고 실행할 때만 필요
    runtimeOnly 'com.mysql:mysql-connector-j'
    // 9-1 스키마 변경은 Flyway 마이그레이션(db/migration)으로만 한다
    implementation 'org.springframework.boot:spring-boot-starter-flyway'
    runtimeOnly 'org.flywaydb:flyway-mysql'
    // 13-7 API 문서(OpenAPI 3.1 + Swagger UI) — springdoc 3.x가 Spring Boot 4용(3.1.1은 Boot 4.1.0 기준으로 빌드됨).
    // Boot BOM이 관리하지 않는 라이브러리라 버전을 직접 적는다
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:3.1.1'

    // 테스트: JUnit·AssertJ·Mockito·MockMvc 묶음 (버전은 Boot BOM이 관리하므로 junit-bom 따로 두지 않음)
    testImplementation 'org.springframework.boot:spring-boot-starter-webmvc-test'
    // @DataJpaTest(리포지토리만 띄우는 테스트)
    testImplementation 'org.springframework.boot:spring-boot-starter-data-jpa-test'
    // 테스트용 일회용 MySQL 컨테이너 — application-test.yml의 jdbc:tc: URL이 쓴다
    testImplementation 'org.testcontainers:testcontainers-mysql'
    // Gradle이 JUnit Platform 테스트를 실행할 때 필요한 런처
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}

tasks.named('test') {
    useJUnitPlatform()
    // 테스트는 application-test.yml(Testcontainers MySQL)을 쓰게 한다
    systemProperty 'spring.profiles.active', 'test'
}
```

</details>

<details>
<summary>설정 — public 기본 선택</summary>

`src/main/resources/application.yml`

```yaml
spring:
  application:
    name: javaExperience
  datasource:
    # javaExperience MySQL의 community DB. 시작하기 안내대로 javaExperience DB를 먼저 띄운다
    url: jdbc:mysql://localhost:13308/community?characterEncoding=UTF-8&serverTimezone=Asia/Seoul
    username: community
    password: community
  flyway:
    # 이미 테이블·데이터가 있는 DB(compose의 community·practice)는 V1(CREATE TABLE)을 실행하면 실패한다.
    # 그래서 기록 테이블이 없으면 "V1까지 됐다"고만 적고(baseline) V2부터 실행한다. 빈 DB면 V1부터 실제로 실행한다.
    baseline-on-migrate: true
    baseline-version: 1
  servlet:
    multipart:
      # 11-2 이미지 한 장 1MB, 요청 전체 2MB까지. 넘으면 MaxUploadSizeExceededException → 413
      max-file-size: 1MB
      max-request-size: 2MB
  jpa:
    hibernate:
      # 스키마는 Flyway만 바꾼다(9-1). 엔티티가 테이블과 다르면 기동이 실패한다(테이블을 몰래 바꾸지 않음)
      ddl-auto: validate
    # 트랜잭션이 끝나면 커넥션을 바로 반납한다(컨트롤러·직렬화 단계까지 붙잡지 않음)
    open-in-view: false
    properties:
      hibernate:
        format_sql: true
        # 컬렉션(태그) 지연 로딩을 글마다 1번이 아니라 IN (...) 한 번으로 묶는다(2-4, N+1 대응)
        default_batch_fetch_size: 100

# 11-2 올린 이미지를 저장할 폴더(앱을 실행한 위치 기준). git에는 올리지 않는다(.gitignore)
app:
  upload-dir: uploads

logging:
  level:
    # 실행 SQL은 확인하되 토큰을 포함한 바인딩 값은 로그에 남기지 않는다
    org.hibernate.SQL: debug
    org.hibernate.orm.jdbc.bind: info

# 0-6 — 내가 정한 설정 값. 코드에서 @Value("${start.greeting}")로 읽는다
start:
  greeting: 반가워요, 백엔드!
  max-items: 5

# 13-7 앱 개발자가 문서를 열면 사용자용 API 그룹을 먼저 보여 준다.
springdoc:
  swagger-ui:
    urls-primary-name: public
```

</details>

<details>
<summary>설정 — 운영 프로파일 문서 차단</summary>

`src/main/resources/application-prod.yml`

```yaml
# 13-7 운영 프로파일에서는 사용자용·운영용 문서와 Swagger UI를 공개하지 않는다.
springdoc:
  api-docs:
    enabled: false
  swagger-ui:
    enabled: false
```

</details>

<details>
<summary>CORS — 문서 주소 교차 출처 허용</summary>

`src/main/java/org/example/config/CorsConfig.java`

```java
package org.example.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// 브라우저 화면(브라우저)이 다른 출처에서 /api/**를 부를 수 있게 CORS를 연다(1-1 "CORS 열기").
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("http://localhost:[*]", "http://127.0.0.1:[*]")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type", "Authorization", "X-Client")
                // 13-5·13-6: 브라우저 JS가 429의 Retry-After, 내려받기의 파일 이름(Content-Disposition)을 읽으려면
                // 노출해야 한다(CORS 기본 노출 헤더가 아니다)
                .exposedHeaders("Location", "WWW-Authenticate", "Retry-After", "Content-Disposition");
        // 13-7: API 문서는 /api 밖이다 — 다른 출처(브라우저 화면)에서 문서 JSON·화면을 읽을 수 있게 GET만 연다
        registry.addMapping("/v3/api-docs/**")
                .allowedOriginPatterns("http://localhost:[*]", "http://127.0.0.1:[*]")
                .allowedMethods("GET");
        registry.addMapping("/swagger-ui/**")
                .allowedOriginPatterns("http://localhost:[*]", "http://127.0.0.1:[*]")
                .allowedMethods("GET");
    }
}
```

</details>

<details>
<summary>MyBatis — 추가 Mapper 없음</summary>

이번 단계는 OpenAPI 생성 설정만 다룬다. MyBatis를 선택해도 위 Controller·DTO·OpenApiConfig·CORS 코드를 그대로 사용한다. 앞 단계의 DB 조회·저장 구현에는 변경이 없다.

</details>

## 직접 확인

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

브라우저로 `http://localhost:8080/swagger-ui/index.html`을 연다. 위쪽 "Select a definition"에서 `public`·`admin`을 바꿔 본다. [Authorize]에 `tok-kimjava`를 넣고 `GET /api/me/notifications`를 [Try it out] → [Execute]로 호출해 본다.

운영 프로파일 확인: `bootRun --args='--spring.profiles.active=prod --server.port=8081'`로 별도 포트에 띄우고 `/v3/api-docs/public`, `/v3/api-docs/admin`, `/swagger-ui/index.html`이 모두 `404`인지 확인한다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다. 읽기만 하므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    {
      "id": "A",
      "title": "사용자용 문서(JSON)",
      "method": "GET",
      "path": "/v3/api-docs/public"
    },
    {
      "id": "B",
      "title": "운영용 문서(JSON)",
      "method": "GET",
      "path": "/v3/api-docs/admin"
    },
    {
      "id": "S",
      "title": "Swagger UI 설정",
      "method": "GET",
      "path": "/v3/api-docs/swagger-config"
    },
    {
      "id": "U",
      "title": "Swagger UI 화면",
      "method": "GET",
      "path": "/swagger-ui/index.html"
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.openapi",
            "matches": "^3\\.1\\."
          },
          {
            "path": "$.info.title",
            "equals": "javaExperience 게시판 API"
          },
          {
            "path": "$.components.securitySchemes.bearerAuth.type",
            "equals": "http"
          },
          {
            "path": "$.components.securitySchemes.bearerAuth.scheme",
            "equals": "bearer"
          },
          {
            "path": "$.paths./api/posts.post",
            "exists": true
          },
          {
            "path": "$.paths./api/posts/{id}.get",
            "exists": true
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "A",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.paths./api/reports.post.summary",
            "equals": "글·댓글 신고"
          },
          {
            "path": "$.paths./api/reports.post.responses.409.description",
            "equals": "이미 신고함"
          },
          {
            "path": "$.paths./api/reports.post.responses.400",
            "exists": true
          },
          {
            "path": "$.paths./api/me/notifications.get.parameters[*].name",
            "contains": "unreadOnly"
          },
          {
            "path": "$.paths./api/me/notifications.get.parameters[*].name",
            "contains": "size"
          },
          {
            "path": "$.paths./api/me/notifications.get.parameters[*].name",
            "contains": "cursor"
          },
          {
            "path": "$.paths./api/me/notifications.get.parameters[*].name",
            "notContains": "me"
          },
          {
            "path": "$.paths./api/reports.post.parameters",
            "exists": false
          }
        ]
      }
    },
    {
      "id": "C3",
      "all": [
        {
          "request": "A",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.paths./api/admin/reports",
                "exists": false
              },
              {
                "path": "$.paths./api/admin/posts/{id}/status",
                "exists": false
              }
            ]
          }
        },
        {
          "request": "B",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.paths./api/admin/reports.get",
                "exists": true
              },
              {
                "path": "$.paths./api/admin/reports/resolve.post",
                "exists": true
              },
              {
                "path": "$.paths./api/posts",
                "exists": false
              }
            ]
          }
        },
        {
          "request": "S",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.urls[*].name",
                "contains": "public"
              },
              {
                "path": "$.urls[*].name",
                "contains": "admin"
              }
            ],
            "bodyText": {
              "contains": "\"urls.primaryName\":\"public\""
            }
          }
        }
      ]
    },
    {
      "id": "C4",
      "request": "U",
      "expect": {
        "status": 200,
        "headers": {
          "Content-Type": {
            "contains": "text/html"
          }
        },
        "bodyText": {
          "contains": "swagger-ui"
        }
      }
    },
    {
      "id": "C5",
      "manual": "운영 프로파일을 별도 포트로 실행해 /v3/api-docs/public, /v3/api-docs/admin, /swagger-ui/index.html이 모두 404인지 확인한다. Swagger UI의 [Authorize]에 tok-kimjava를 입력한 후 GET /api/me/notifications?size=20을 [Try it out]으로 실행해 요청에 Authorization: Bearer tok-kimjava가 있고 응답이 200인지 확인한다."
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | A | `200`, `openapi` 3.1.x, 제목, `bearerAuth`(http·bearer), 글쓰기·글 상세 경로가 있다 |
| C2 | A | `POST /api/reports`의 `summary`·응답 `409` 설명·`400`이 있고, `GET /api/me/notifications`의 파라미터에 `unreadOnly`·`size`·`cursor`가 있고 `me`는 없다(15-5에서 `type`이 더해져도 그대로 통과하도록 "정확히"가 아니라 "있다·없다"로 본다), 신고 API에 `parameters`가 없다 |
| C3 | A / B / S | 사용자용 문서에 `/api/admin/**`이 없다 / 운영용 문서에는 신고 목록·처리가 있고 글쓰기는 없다 / 화면 설정에 `public`·`admin` 두 그룹, 기본 선택은 `public` |
| C4 | U | Swagger UI 화면 `200`, HTML |
| C5 | 운영 프로파일·브라우저 직접 확인 | prod에서 문서 JSON 두 주소와 UI 모두 `404`. 기본 프로파일의 Swagger UI는 `public`을 먼저 보여 주고 [Authorize] 뒤 알림 목록 요청에 Bearer 헤더를 넣어 `200`을 받는다 |
| R1 | 버전 | Boot 4에 맞는 springdoc 3.x를 골랐다(2.x는 Boot 3·Spring Framework 6용). 고른 근거를 어디서 확인했는지(라이브러리의 parent POM·릴리스 노트) 말할 수 있고, BOM이 관리하지 않는 의존성의 버전을 누가 올리나(Dependabot 등)도 안다 |
| R2 | 숨김 | `AuthenticatedMember`를 문서에서 뺐다(`SpringDocUtils…addRequestWrapperToIgnore` 또는 `@Parameter(hidden = true)`). 빼지 않으면 무엇이 보이는지(`me` 쿼리 파라미터) 실제로 확인했다 |
| R3 | 운영 환경 | `application-prod.yml`에서 문서 JSON·UI를 비활성화했다. 그룹 구분만으로 운영 API를 보호할 수 없다는 것을 안다 |
| R4 | 문서와 검증 | `@Size`·`@Pattern` 같은 검증 애노테이션이 문서의 스키마(`maxLength`·`pattern`)로 나온다는 것을 확인했고, 그래서 검증을 DTO에 두면 문서도 같이 맞는다는 것을 안다 |

## 필요한 지식

- [S23 OpenAPI·Swagger](../../docs/knowledge/S23-openapi-swagger.md)
- [S21 Boot 4 마이그레이션](../../docs/knowledge/S21-boot4-migration.md) — 라이브러리 호환 버전 고르기
- [C2 Gradle 의존성](../../lessons/C2-gradle-dependencies.md) — BOM이 관리하지 않는 버전
- [F3 CORS](../../lessons/F3-cors.md) — `/api` 밖 경로의 CORS

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 설정 빈</summary>

```java
@Bean OpenAPI boardOpenApi() {
    return new OpenAPI()
        .info(new Info().title("javaExperience 게시판 API").version("13-7"))
        .components(new Components().addSecuritySchemes("bearerAuth",
            new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer")))
        .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
}
@Bean GroupedOpenApi publicApi() {
    return GroupedOpenApi.builder().group("public").pathsToMatch("/api/**").pathsToExclude("/api/admin/**").build();
}
```

`admin` 그룹은 `pathsToMatch("/api/admin/**")`. `AuthenticatedMember`는 설정 클래스의 `static { SpringDocUtils.getConfig().addRequestWrapperToIgnore(AuthenticatedMember.class); }`로 뺀다.
</details>

<details>
<summary>힌트 2 — 화면이 빈 문서를 보여 준다</summary>

`/v3/api-docs/public`이 `200`인데 `paths`가 비어 있으면 그룹의 `pathsToMatch`가 틀렸다(`/api/*`는 한 단계만 맞는다 — `/api/**`). `404`면 의존성이 2.x이거나 `springdoc.api-docs.path`를 바꾼 것이다.
</details>

## 다음 단계

13장 끝. 14장에서는 같은 `community` DB로 글에 붙는 기능(공감·투표·고정·시리즈 등)을 더한다 — [14-1. 공감 종류 — 👍❤️😂😢 중 하나만](../ch14-more-with-posts/14-1-reactions.md)
