# S23. API 문서화 — OpenAPI와 Swagger UI

> - OpenAPI는 HTTP API 계약을 기술하는 명세이고, Swagger UI는 명세를 화면으로 보여 주며 요청도 실행하는 도구다.
> - springdoc-openapi는 Spring 애플리케이션에서 OpenAPI 문서를 만들고 Swagger UI를 연결한다.
> - 문서는 실제 인증·오류 응답까지 반영해야 한다. 생성된 명세와 실행 결과를 테스트로 함께 확인한다.

## 1. 왜 알아야 하나

API 사용자는 컨트롤러 코드를 읽지 않고도 어떤 경로에 어떤 요청을 보내야 하는지, 인증은 어떻게 하는지, 오류가 나면 어떤 형식으로 오는지 알아야 한다. 문서가 없거나 실제 응답과 다르면 호출자는 추측으로 클라이언트를 만들고, 서버 변경은 연동 장애로 이어진다.

Swagger UI의 `Try it out`은 보기 좋은 예제에 그치지 않는다. 명세에 정의된 서버 주소로 브라우저 요청을 전송하므로, 잘못된 서버 주소·보안 설정·CORS는 문서 화면에서는 보이던 API 호출이 실패하는 원인이 된다.

## 2. 핵심 개념

| 용어 | 뜻 | 설계 시 확인할 점 |
|---|---|---|
| OpenAPI 3.x | 경로, 메서드, 매개변수, 본문, 응답, 보안 등을 JSON/YAML로 표현하는 API 명세 | 명세는 API 계약이다. `servers`, `paths`, `components` 등이 주요 항목이다. |
| Swagger UI | OpenAPI 명세를 읽어 API 설명 화면과 `Try it out`을 제공하는 웹 UI | 화면에서 고른 서버 주소로 요청을 보낸다. UI 자체가 서버 API를 구현하지는 않는다. |
| springdoc-openapi | Spring MVC/WebFlux 애플리케이션을 분석해 OpenAPI 문서를 만들고 Swagger UI 리소스를 제공하는 라이브러리 | 컨트롤러의 타입·매핑은 자동으로 읽고, 설명·보안·오류는 애너테이션이나 설정으로 보완한다. |
| `@Operation` | 한 API 작업(경로와 HTTP 메서드)의 요약·설명·보안 등을 기술 | 경로와 메서드 자체는 Spring 매핑이 결정한다. |
| `@ApiResponse` | 작업이 돌려줄 상태 코드·설명·응답 본문 스키마를 기술 | 성공과 대표 오류를 실제 동작에 맞춘다. |
| `@Schema` | 요청·응답 모델과 필드의 타입·설명·예시를 기술 | 실제 JSON 필드명·제약과 어긋나지 않게 한다. |
| 서버(`servers`) | 명세가 가리키는 API 기본 URL 목록 | UI의 서버 선택 목록이다. 경로 뒤에 API의 각 operation path가 붙는다. |
| 보안 스키마 | 인증 방식의 이름과 종류를 기술하는 재사용 정의 | `HTTP bearer` 정의만으로 보호되는 것은 아니다. API 작업에 보안 요구사항도 적용해야 한다. |

### 세 도구의 관계

OpenAPI는 표준 명세 형식이다. Swagger는 OpenAPI를 다루는 도구 생태계의 이름이며, 이 문서에서는 Swagger UI를 명세 뷰어로 사용한다. springdoc-openapi는 Spring 코드에서 OpenAPI 문서를 만들어 `/v3/api-docs`로 제공하고 Swagger UI가 그 명세를 읽도록 연결한다. 따라서 **Spring 매핑·DTO → springdoc 생성 → OpenAPI JSON/YAML → Swagger UI** 순서로 이어진다.

코드 우선 방식에서는 컨트롤러와 DTO를 먼저 만들고 애너테이션으로 문서를 보강한다. 기존 Spring 앱과 함께 발전시키기 쉽다. 명세 우선(contract-first) 방식에서는 OpenAPI 계약을 먼저 검토·합의하고 구현을 맞춘다. 여러 팀이 동시에 연동하거나 외부 공개 계약을 엄격히 관리할 때 유리하다. 어느 방식이든 생성 또는 검토한 계약을 CI에서 검증해야 한다.

## 3. 내부 동작·원리

애플리케이션이 시작되면 springdoc은 Spring의 요청 매핑, 메서드 인자, 반환 타입과 문서 애너테이션을 바탕으로 OpenAPI 문서를 구성한다. Swagger UI는 설정에서 문서 URL을 읽어 명세를 렌더링한다. 기본 경로는 JSON 명세 `/v3/api-docs`, YAML 명세 `/v3/api-docs.yaml`, UI `/swagger-ui.html`이다. 경로와 기능은 설정으로 바꿀 수 있다.

`Try it out`에서는 선택한 서버 URL에 operation의 경로와 쿼리를 결합해 브라우저가 HTTP 요청을 보낸다. 예를 들어 서버가 `http://localhost:8080`이고 operation path가 `/api/posts/42`라면 그 주소로 요청한다. `servers`에 포트가 잘못 적혀 있으면 UI가 표시하는 API 설명은 맞아도 요청은 엉뚱한 포트로 간다. 포트가 바뀌면 API 경로를 고치는 대신 `servers`의 기본 URL을 실제 주소에 맞춘다.

브라우저는 출처(origin)가 다른 서버로 `fetch`/XHR을 보낼 때 CORS 규칙을 적용한다. 출처는 스킴·호스트·포트의 조합이므로 포트만 달라도 다른 출처다. UI가 API와 같은 출처에서 서비스되면 보통 별도 CORS 허용이 필요 없지만, 다른 호스트나 포트의 UI에서 호출하면 API 서버가 그 UI 출처를 허용해야 브라우저가 응답을 읽게 할 수 있다. 학습 화면의 **‘버튼 확인’** 동작이 브라우저에서 백엔드로 `fetch`를 보내는 구조라면 같은 원리로, 화면과 API의 출처가 다를 때 CORS 설정을 확인해야 한다.

## 4. 코드로 확인

예제는 Java 21 + Spring Boot 4.1 기준이다. 공식 springdoc 호환성 안내는 `springdoc-openapi` 3.x가 Spring Boot 4와 호환된다고 설명하고, 현재 안정판으로 3.1.1을 안내한다. 다만 같은 FAQ의 구체적인 “빌드한 조합” 표에는 Boot 4.0.x ↔ springdoc 3.0.x만 적혀 있고 Boot 4.1.x 조합은 별도로 열거되어 있지 않다. 따라서 아래는 현재 3.x 안정판을 사용하는 설정 예이며, Boot 4.1 프로젝트의 빌드와 문서 엔드포인트를 CI에서 확인한다. 2.x 계열은 Boot 3.x 호환 세대이므로 Boot 4 예제에 섞지 않는다.

### 의존성 추가

Spring MVC 프로젝트라면 UI를 포함한 starter를 추가한다. 버전은 springdoc 라이브러리 버전이며, Spring Boot 플러그인/BOM 버전과 같은 숫자로 맞추는 값이 아니다.

~~~~xml
<!-- Maven: pom.xml -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>3.1.1</version>
</dependency>
~~~~

Gradle(실습 레포):

```groovy
dependencies {
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:3.1.1'
}
```

Boot가 아닌 WebFlux 앱은 WebFlux용 starter를 고른다. MVC와 WebFlux용 starter를 한 애플리케이션에 함께 넣지 않는다.

### 게시판 API와 스키마 문서화

컨트롤러 매핑은 실제 동작을 결정한다. OpenAPI 애너테이션은 사람과 도구가 계약을 이해할 수 있도록 요약, 스키마, 응답, 보안을 덧붙인다.

~~~~java
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@SecurityRequirement(name = "bearerAuth")
class PostController {

    @PostMapping
    @Operation(summary = "게시글 작성", description = "새 게시글을 생성한다.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "게시글 생성",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = PostView.class))),
        @ApiResponse(responseCode = "400", description = "요청 본문 오류",
            content = @Content(mediaType = "application/problem+json",
                schema = @Schema(implementation = ProblemDetail.class))),
        @ApiResponse(responseCode = "401", description = "인증 필요",
            content = @Content(mediaType = "application/problem+json",
                schema = @Schema(implementation = ProblemDetail.class)))
    })
    ResponseEntity<PostView> create(@Valid @RequestBody CreatePostRequest request) {
        // 실제 예제에서는 서비스를 호출해 저장 결과를 반환한다.
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new PostView(42L, request.title(), request.content()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "게시글 단건 조회")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "게시글 조회",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = PostView.class))),
        @ApiResponse(responseCode = "404", description = "게시글 없음",
            content = @Content(mediaType = "application/problem+json",
                schema = @Schema(implementation = ProblemDetail.class))),
        @ApiResponse(responseCode = "401", description = "인증 필요",
            content = @Content(mediaType = "application/problem+json",
                schema = @Schema(implementation = ProblemDetail.class)))
    })
    PostView find(@PathVariable long id) {
        return new PostView(id, "OpenAPI", "문서 예제");
    }

    record CreatePostRequest(
        @Schema(description = "게시글 제목", example = "OpenAPI 시작하기")
        String title,
        @Schema(description = "게시글 본문", example = "요청과 응답 계약을 문서화합니다.")
        String content) {}

    record PostView(
        @Schema(description = "게시글 ID", example = "42")
        long id,
        String title,
        String content) {}
}
~~~~

위 메서드는 구조를 보여 주는 예다. 실제 서비스에서는 저장 결과를 반환하고, 없는 ID와 유효성 오류를 공통 오류 처리기로 `ProblemDetail` 응답에 매핑한다. `@ApiResponse`의 상태 코드와 본문은 그 처리 결과와 일치시킨다.

### Bearer 보안, 서버, 그룹 설정

보안 스키마는 OpenAPI에 `Authorization: Bearer ...` 방식을 알린다. `@SecurityRequirement`가 적용된 API에 Swagger UI의 **Authorize** 버튼이 표시된다. 아래의 서버 주소는 UI의 기본 선택값이다. 실제 실행 포트가 다르면 그 주소만 환경에 맞춰 변경한다.

~~~~java
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info = @Info(title = "게시판 API", version = "1.0.0"),
    servers = @Server(url = "http://localhost:8080", description = "로컬 개발 서버")
)
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    scheme = "bearer"
)
class OpenApiConfiguration {
    @Bean
    GroupedOpenApi postsApi() {
        return GroupedOpenApi.builder()
                .group("posts-v1")
                .pathsToMatch("/api/posts/**")
                .build();
    }
}
~~~~

이 그룹 명세는 `/v3/api-docs/posts-v1`에서 확인할 수 있다. 그룹은 문서를 경로나 패키지 기준으로 나누는 기능이다. `info.version`은 API 계약 버전이고 springdoc 의존성 버전과 무관하다. `/api/v1/**`, `/api/v2/**`처럼 런타임 API도 버전이 나뉘어 있다면 그룹도 각각 정의하고, 각 문서의 경로·요청·응답을 해당 계약과 맞춘다. 그룹 이름만 바꾼다고 실제 API 라우팅이 바뀌지는 않는다.

ProblemDetail은 Spring MVC가 RFC 9457 형식 오류 본문을 표현하는 타입이다. API가 실제로 `application/problem+json`을 응답하도록 처리한 뒤, 위처럼 오류 코드마다 미디어 타입과 스키마를 기록한다. 확장 필드를 사용하는 경우에는 그 필드 설명도 별도로 추가해 실제 JSON과 맞춘다.

## 5. 실무 판단

- **코드 우선:** 내부 서비스나 기존 Spring 앱에 적합하다. 매핑과 타입에서 기본 문서를 만들고, 설명·보안·오류만 애너테이션으로 보강한다.
- **명세 우선(contract-first):** 외부 고객·여러 팀이 공유하는 계약, 클라이언트 생성이 중요한 API에 적합하다. 구현 전에 OpenAPI 변경을 리뷰하고, 생성 코드나 계약 테스트로 구현과 맞춘다.
- **운영 노출:** API 문서를 공개할지 내부 인증 뒤에 둘지 먼저 정한다. 공개하지 않기로 했다면 운영 프로파일에서 UI와 명세 엔드포인트를 모두 끄거나 접근 통제를 한다. UI만 숨기고 `/v3/api-docs`를 공개 상태로 두면 명세는 계속 노출될 수 있다.
- **문서와 응답의 일치:** 문서는 자동 생성돼도 모든 상태·보안 정책이 자동으로 발견되는 것은 아니다. OpenAPI 명세 검사와 실제 HTTP 응답 테스트를 함께 실행한다.

운영에서 끄는 예시는 `application-prod.yaml`에 둔다.

~~~~yaml
springdoc:
  api-docs:
    enabled: false
  swagger-ui:
    enabled: false
~~~~

조직 내부에서 운영 문서를 써야 한다면 무조건 끄기보다 인증·네트워크 정책으로 보호하고, 운영 주소와 실제 인가 정책을 점검한다. 문서 비활성화 여부는 보안 경계의 대체물이 아니다.

CI에서는 최소한 다음을 확인한다.

1. `GET /v3/api-docs`를 읽어 게시글 경로, 메서드, 성공·오류 응답, bearer 보안 정의가 있는지 검사한다.
2. 인증이 있는 성공 요청과 없는 요청, 유효하지 않은 요청, 없는 ID를 실제로 보내 상태 코드와 `Content-Type: application/problem+json`, 본문을 확인한다.
3. 생성 명세를 이전 릴리스 계약과 비교해 경로 제거, 필수 필드 추가, 타입 변경 같은 호환성 파괴가 의도된 것인지 리뷰한다.

## 직접 해보기

실습 레포의 Spring Boot 4.1 Web MVC 애플리케이션에 적용한다.

1. 위 Maven 의존성을 추가하고 애플리케이션을 실행한다. Gradle이면 동일한 `org.springdoc:springdoc-openapi-starter-webmvc-ui:3.1.1` 좌표를 의존성으로 선언한다.
2. 브라우저에서 `http://localhost:8080/swagger-ui.html`을 연다. OpenAPI JSON은 `http://localhost:8080/v3/api-docs`, 그룹 문서는 `http://localhost:8080/v3/api-docs/posts-v1`에서 확인한다.
3. `POST /api/posts`를 펼치고 **Try it out**을 누른 뒤 제목과 본문 JSON을 입력한다. 실행 결과가 실제 생성 응답의 상태 코드와 본문인지 확인한다.
4. UI의 **Authorize**를 눌러 bearer 토큰을 입력한다. 입력 칸이 토큰 값만 요구하면 `Bearer ` 접두사는 빼고 토큰만 넣는다. UI가 실제 요청 헤더 `Authorization: Bearer <토큰>`을 보내는지 확인한다. 인증 실패와 본문 오류도 각각 실행해 `ProblemDetail` 응답을 확인한다.
5. 애플리케이션 포트를 8081로 바꿔 다시 실행하고 OpenAPI의 `servers` 기본 URL도 `http://localhost:8081`로 바꾼 뒤 **Try it out**을 반복한다. 서버 주소 선택이 실제 요청 목적지를 바꾼다는 점을 확인한다.
6. Swagger UI를 API와 다른 포트 또는 도메인에서 열어 테스트한다면, API 서버의 CORS 허용 출처에 UI 출처를 추가한다. 출처가 같다면 이 단계의 CORS 변경은 필요하지 않다.

## 자주 하는 실수

1. **증상:** Spring Boot 4에서 클래스 로딩·자동 설정 오류가 난다 → **원인:** Boot 3용 springdoc 2.x나 다른 세대 starter를 섞었다 → **대처:** 4.x 호환 3.x 계열을 선택하고 Boot·Framework 조합으로 시작과 문서 응답을 확인한다.
2. **증상:** UI는 열리지만 API 호출이 실패한다 → **원인:** `servers`가 다른 포트·내부 주소를 가리킨다 → **대처:** 브라우저에서 접근 가능한 실제 API 기본 URL로 맞춘다.
3. **증상:** `Try it out`이 CORS 오류를 낸다 → **원인:** UI와 API의 출처가 다른데 API가 UI 출처를 허용하지 않는다 → **대처:** 필요한 출처·메서드·헤더만 Spring CORS 정책에서 허용한다.
4. **증상:** Authorize에 토큰을 넣어도 401이 난다 → **원인:** OpenAPI 보안 스키마를 빠뜨렸거나, 설정이 요구하는 토큰 형식과 입력이 다르다 → **대처:** HTTP bearer 스키마와 operation 보안 요구사항을 확인하고 UI가 만든 요청 헤더를 확인한다.
5. **증상:** 문서에 404가 없거나 실제 오류 본문이 다르다 → **원인:** 성공 반환 타입만 자동 문서화했다 → **대처:** `@ApiResponse`에 실제 상태·미디어 타입·ProblemDetail 스키마를 추가하고 오류 테스트와 대조한다.
6. **증상:** 운영에서 화면은 숨었지만 명세를 내려받을 수 있다 → **원인:** Swagger UI만 비활성화하고 API 문서 경로는 열어 두었다 → **대처:** `/v3/api-docs`의 노출 정책도 정하고 `springdoc.api-docs.enabled`와 접근 제어를 설정한다.
7. **증상:** DTO 필드 설명이나 예시가 실제 JSON과 다르다 → **원인:** 애너테이션 설명만 수정하고 직렬화 결과는 검증하지 않았다 → **대처:** 응답 본문 계약 테스트를 두고 생성 명세와 실제 JSON을 함께 리뷰한다.

## 자가점검 Q&A

### Q1. OpenAPI와 Swagger UI는 무엇이 다른가?

OpenAPI는 API 계약을 표현하는 표준 명세다. Swagger UI는 그 명세를 읽어 사람이 탐색하고 요청을 실행하게 하는 화면 도구다.

**꼬리 질문:** Swagger UI를 제거하면 API 명세도 사라지는가? → 아니다. `/v3/api-docs`를 끄지 않았다면 UI 없이도 JSON/YAML 명세를 요청할 수 있다.

### Q2. `@SecurityScheme`만 선언하면 API가 JWT 인증으로 보호되는가?

아니다. 보안 스키마는 문서에서 인증 방법을 설명한다. 실제 요청 인증은 Spring Security 등이 수행하고, OpenAPI에는 해당 operation의 `@SecurityRequirement`도 지정해야 UI에 인증이 연결된다.

**꼬리 질문:** 토큰을 브라우저 UI에 넣어도 되는가? → 개발용 테스트 토큰만 사용하고, 운영 토큰·장기 비밀 키를 문서 UI에 입력하거나 공유하지 않는다.

### Q3. `servers`를 바꾸면 무엇이 달라지는가?

Swagger UI가 `Try it out` 요청을 보낼 기본 호스트·포트·기본 경로가 달라진다. operation의 `/api/posts` 경로나 실제 서버의 리스닝 포트 자체가 자동 변경되는 것은 아니다.

**꼬리 질문:** UI와 API가 다른 포트면 왜 CORS가 필요한가? → 포트가 다르면 브라우저 기준 출처가 다르다. API가 UI의 출처를 CORS 정책으로 허용해야 브라우저가 응답을 읽을 수 있다.

### Q4. 그룹 `posts-v1`을 만들면 API가 버전 관리되는가?

아니다. 그룹은 문서에 포함할 경로·패키지를 나누고 별도 명세 URL을 제공한다. API 버전은 실제 요청 매핑, 경로·헤더 정책과 호환성 약속으로 구현해야 한다.

**꼬리 질문:** `info.version`은 springdoc 버전인가? → 아니다. 해당 OpenAPI 문서에 표현한 API 계약의 버전이다.

### Q5. 문서를 자동 생성하는데 왜 테스트가 필요한가?

springdoc은 매핑과 모델에서 많은 정보를 얻지만, 인증 정책·대표 오류·미디어 타입·설명은 애너테이션과 설정에 의존한다. 실제 응답과 생성 명세가 어긋날 수 있다. 명세 검사와 HTTP 계약 테스트를 함께 실행해 차이를 잡는다.

## 참고문헌

- OpenAPI Specification 3.1.1 — https://spec.openapis.org/oas/v3.1.1.html — API 문서의 표준 구조와 필드 정의.
- springdoc-openapi 공식 문서 — https://springdoc.org/ — Spring 지원 버전 안내, starter, 기본 문서/UI 경로, 설정 키와 `GroupedOpenApi` 사용법.
- springdoc-openapi Releases — https://github.com/springdoc/springdoc-openapi/releases — 3.x 릴리스와 변경 내용. 3.1.1 릴리스 — https://github.com/springdoc/springdoc-openapi/releases/tag/v3.1.1
- Swagger: API Server and Base Path — https://swagger.io/docs/specification/v3_0/api-host-and-base-path/ — OpenAPI 3의 `servers`, 여러 서버, 상대 URL 동작.
- Swagger UI Configuration — https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/ — 문서 URL과 `Try it out` 등 UI 설정.
- swagger-core Annotations — https://github.com/swagger-api/swagger-core/wiki/Swagger-2.X---Annotations — `@Operation`, `@ApiResponse`, `@Schema`, 보안 애너테이션의 역할.
- Spring Framework: Error Responses — https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html — `ProblemDetail`, `ErrorResponse`, RFC 9457 오류 응답 처리.
- Spring Framework: CORS — https://docs.spring.io/spring-framework/reference/web/webmvc-cors.html — Spring MVC CORS 처리와 허용 정책.
- Spring Boot: Profiles — https://docs.spring.io/spring-boot/reference/features/profiles.html — 활성 프로파일 및 `application-{profile}` 설정.
- RFC 9457: Problem Details for HTTP APIs — https://www.rfc-editor.org/rfc/rfc9457.html — HTTP API 오류 본문 표준.
