# 1-1. 요청 받기 — 일단 success

## 상황

프론트 개발자가 글쓰기 화면을 만들면서 이렇게 말했다.

> "저장 버튼 누르면 이 JSON을 `POST /api/posts`로 보낼게요. 일단 받아지기만 하면 돼요."

아직 저장도, 응답 형식도 정하지 않았다. **요청이 서버에 들어오는 입구부터 연다.** 요청을 받아서 객체로 바꾸고, 받았다는 표시로 `success`만 돌려준다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름의 단계를 누르면 관련된 화면 요소가 강조된다.

```screen
{
  "title": "글쓰기 화면",
  "summary": "저장 버튼을 누르면 이 JSON이 서버로 간다. 이 단계의 서버는 받기만 하고 success로 답한다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "새 글 쓰기",
      "right": "김자바"
    },
    {
      "type": "select",
      "id": "board",
      "label": "게시판",
      "value": "개발"
    },
    {
      "type": "field",
      "id": "title",
      "label": "제목",
      "value": "[채점] 첫 게시글"
    },
    {
      "type": "field",
      "id": "content",
      "label": "본문",
      "value": "Spring Boot로 만든 첫 게시글입니다.",
      "multiline": true
    },
    {
      "type": "chips",
      "id": "tags",
      "label": "태그",
      "items": [
        "spring",
        "jpa"
      ]
    },
    {
      "type": "select",
      "id": "visibility",
      "label": "공개 범위",
      "value": "전체 공개"
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        {
          "id": "save",
          "label": "저장",
          "variant": "primary"
        },
        {
          "id": "cancel",
          "label": "취소",
          "variant": "ghost"
        }
      ]
    },
    {
      "type": "toast",
      "id": "toast",
      "value": "저장 요청을 보냈어요"
    }
  ],
  "flows": [
    {
      "name": "저장 누르기",
      "steps": [
        {
          "kind": "user",
          "text": "게시판·제목·본문·태그를 채우고 [저장]을 누른다",
          "focus": [
            "title",
            "content",
            "save"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\n  \"boardSlug\": \"dev\",\n  \"title\": \"[채점] 첫 게시글\",\n  \"content\": \"Spring Boot로 만든 첫 게시글입니다.\",\n  \"tags\": [\n    \"spring\",\n    \"jpa\"\n  ],\n  \"visibility\": \"PUBLIC\"\n}"
        },
        {
          "kind": "server",
          "text": "PostController가 본문 JSON을 PostCreateRequest(record)로 바꿔 받는다 — @RequestBody"
        },
        {
          "kind": "server",
          "text": "받은 제목을 로그로 남긴다: 게시글 작성 요청: [채점] 첫 게시글"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: text/plain;charset=UTF-8"
          ],
          "body": "success"
        },
        {
          "kind": "screen",
          "text": "응답에 글 정보가 없어서 화면은 알림만 띄운다. 무엇이 저장됐는지는 아직 모른다",
          "focus": [
            "toast"
          ]
        }
      ]
    },
    {
      "name": "프론트 버그로 JSON이 깨졌을 때",
      "steps": [
        {
          "kind": "user",
          "text": "(프론트 버그) 닫는 괄호가 빠진 JSON이 전송된다",
          "focus": [
            "save"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"title\": \"[채점] 깨짐\""
        },
        {
          "kind": "server",
          "text": "Spring이 본문을 객체로 바꾸지 못한다(HttpMessageNotReadableException) — 컨트롤러 메서드는 실행되지 않는다"
        },
        {
          "kind": "response",
          "status": 400
        },
        {
          "kind": "screen",
          "text": "사용자가 고칠 수 있는 문제가 아니므로 '잠시 후 다시 시도해 주세요'를 띄우고, 프론트 개발자가 콘솔에서 400을 본다",
          "focus": [
            "toast"
          ]
        }
      ]
    },
    {
      "name": "CORS 설정이 없을 때(브라우저에서 보냄)",
      "steps": [
        {
          "kind": "user",
          "text": "http://localhost:3000에 뜬 화면(studymate 실행 칸도 같다)에서 [저장]을 누른다. 서버는 http://localhost:8080 — 포트가 달라 다른 출처다",
          "focus": [
            "save"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\n  \"boardSlug\": \"dev\",\n  \"title\": \"[채점] 첫 게시글\",\n  \"content\": \"Spring Boot로 만든 첫 게시글입니다.\",\n  \"tags\": [\n    \"spring\",\n    \"jpa\"\n  ],\n  \"visibility\": \"PUBLIC\"\n}"
        },
        {
          "kind": "server",
          "text": "JSON 본문이라 브라우저가 이 POST를 바로 보내지 않고 먼저 묻는다(preflight): OPTIONS /api/posts — Origin: http://localhost:3000, Access-Control-Request-Method: POST, Access-Control-Request-Headers: content-type"
        },
        {
          "kind": "server",
          "text": "CORS 설정이 없으면 Spring은 preflight에 200으로 답하지만 Access-Control-Allow-Origin을 붙이지 않는다(아래 응답이 그 preflight 응답)"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Allow: GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH"
          ]
        },
        {
          "kind": "screen",
          "text": "허락 헤더가 없으니 브라우저는 본 POST를 보내지 않고 막는다. 콘솔에 'blocked by CORS policy', 코드에는 TypeError: Failed to fetch. 실행 칸에는 'CORS로 막혔어요'가 뜬다",
          "focus": [
            "toast"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `POST /api/posts` |
| 요청 헤더 | `Content-Type: application/json` |
| 요청 본문 | 아래 JSON — 전용 요청 클래스로 받는다 |
| 응답 | 상태 `200`, 본문은 문자열 `success` |
| 그 밖에 | 받은 제목(title)을 로그로 남긴다 |
| CORS | `/api/**`를 studymate 화면(다른 출처)에 연다 — 아래 [CORS 열기](#cors-열기) |

요청 본문:

```json
{
  "boardSlug": "dev",
  "title": "[채점] 첫 게시글",
  "content": "Spring Boot로 만든 첫 게시글입니다.",
  "tags": ["spring", "jpa"],
  "visibility": "PUBLIC"
}
```

| 필드 | 타입 | 뜻 |
|---|---|---|
| `boardSlug` | 문자열 | 게시판 주소 이름 — `notice`, `dev`, `qna`, `free` |
| `title` | 문자열 | 제목 |
| `content` | 문자열 | 본문 |
| `tags` | 문자열 배열 | 태그 이름들 |
| `visibility` | 문자열 | 공개 범위 — `PUBLIC`(전체) 또는 `FOLLOWERS`(팔로워만) |

이 단계에서는 값이 맞는지 검사하지 않는다(1-5에서 한다).

## 구현 가이드

지금은 저장하지 않는다. JSON을 DTO로 받고 `success`를 돌려주는 가장 작은 API부터 만든다.

<details>
<summary>Controller — POST 요청을 받는 입구</summary>

`org.example.post.PostController`에서 경로를 매핑한다. 1-2에서 응답을 `201`과 JSON으로 바꾸기 전까지는 문자열을 그대로 반환한다.

```java
@RestController
public class PostController {
    private static final Logger log = LoggerFactory.getLogger(PostController.class);

    @PostMapping("/api/posts")
    public String create(@RequestBody PostCreateRequest request) {
        log.info("게시글 작성 요청: {}", request.title());
        return "success";
    }
}
```

`@RestController`, `@PostMapping`, `@RequestBody`와 SLF4J `Logger`·`LoggerFactory`를 import한다. 잘못된 JSON은 메서드에 오기 전 변환 과정에서 `400`이 된다.

</details>

<details>
<summary>DTO — JSON의 필드와 record 구성 요소</summary>

`PostCreateRequest.java`를 만들고 JSON 키와 구성 요소 이름을 맞춘다. 이 단계에는 검증을 붙이지 않는다.

```java
public record PostCreateRequest(
    String boardSlug,
    String title,
    String content,
    List<String> tags,
    String visibility
) { }
```

`List`는 `java.util.List`를 import한다. 요청에서 `title`을 읽는 메서드는 `getTitle()`이 아니라 `title()`이다.

</details>

## CORS 열기

studymate 화면의 실행 칸은 **브라우저가** 내 서버로 직접 요청을 보낸다. 그러려면 서버가 "이 출처에서 오는 요청은 읽어도 된다"고 허락해야 한다. 0장에서 `CorsConfig`를 이미 만들었다면 그대로 둔다(0-3용 `X-Client` 헤더가 하나 더 들어 있다). `org.example` 아래 설정용 클래스 하나(예: `org.example.config.CorsConfig`)에서 `WebMvcConfigurer`를 구현하고 `addCorsMappings`를 재정의한다.

| 설정 | 값 | 이유 |
|---|---|---|
| 경로 | `/api/**` | API만 연다. `/hello` 같은 다른 경로는 그대로 |
| `allowedOriginPatterns` | `http://localhost:[*]`, `http://127.0.0.1:[*]` | studymate가 지금 뜨는 곳(로컬 `http://localhost:3000`). `[*]`라 포트가 바뀌어도 된다. **studymate를 배포하면 그 주소를 여기에 추가한다** |
| `allowedMethods` | `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` | 기본값은 `GET`·`HEAD`·`POST`뿐이다. 그대로 두면 3-1의 `PATCH`, 3-2의 `DELETE`가 preflight에서 막힌다 |
| `allowedHeaders` | `Content-Type`, `Authorization`, `X-Client` | 앞 단계 `/api/echo`의 `X-Client` 허용을 유지하고, 글 API의 `Content-Type`·`Authorization`을 추가한다(`Authorization`은 1-6부터) |
| `exposedHeaders` | `Location`, `WWW-Authenticate` | 기본값은 없음. 브라우저 코드는 노출된 응답 헤더만 읽는다. 빼면 1-2의 `Location`, 1-6의 `WWW-Authenticate` 확인이 **브라우저에서만** 실패한다(curl은 통과) |

기본값은 Spring Framework 7.0(Spring Boot 4.1)의 `addMapping` 기준이다.

#### 왜 필요한가

- **출처(origin)** 는 프로토콜·호스트·포트 묶음이다. studymate 화면(`http://localhost:3000`)과 내 서버(`http://localhost:8080`)는 포트가 달라 **다른 출처**다.
- 브라우저는 **같은 출처 정책**으로, 다른 출처의 응답을 페이지의 코드가 읽지 못하게 막는다. 서버가 응답 헤더 `Access-Control-Allow-Origin`으로 그 출처를 허락해야 읽힌다. 이 허락 규칙이 CORS다.
- JSON 본문(`Content-Type: application/json`), `Authorization` 헤더, `PUT`·`PATCH`·`DELETE`가 들어간 요청은 "단순 요청"이 아니다. 브라우저는 본 요청 전에 `OPTIONS` 요청(**preflight**)으로 "이 출처에서 이 메서드·헤더로 보내도 되나"를 먼저 묻고, 허락이 없으면 본 요청을 **아예 보내지 않는다**. 요청 A도 JSON이라 preflight를 거친다.
- curl·IntelliJ HTTP Client는 브라우저가 아니라 CORS를 검사하지 않는다. 그래서 "curl로는 되는데 버튼만 실패"가 생긴다.
- CORS는 보안 장치(로그인·권한 검사)가 아니다. 브라우저가 응답을 코드에 보여 줄지 정할 뿐이다.
- **1-6에서 인터셉터로 토큰을 확인하게 되면** preflight `OPTIONS`도 그 인터셉터를 지나는데, 토큰 없이 온다. 인터셉터가 막으면(401·500) 브라우저의 요청이 전부 CORS로 실패한다. 인터셉터 맨 앞에서 `CorsUtils.isPreFlightRequest(request)`면 `true`를 돌려 통과시킨다.

## 직접 확인

```bash
BASE=http://localhost:8080   # 서버 주소가 다르면 여기만 바꾼다

# 요청 A — 정상 요청
curl -i -X POST "$BASE/api/posts" -H 'Content-Type: application/json' \
  -d '{"boardSlug":"dev","title":"[채점] 첫 게시글","content":"Spring Boot로 만든 첫 게시글입니다.","tags":["spring","jpa"],"visibility":"PUBLIC"}'

# 요청 B — 깨진 JSON(닫는 괄호 없음)
curl -i -X POST "$BASE/api/posts" -H 'Content-Type: application/json' -d '{"title": "[채점] 깨짐"'

# 요청 C — CORS preflight(브라우저가 PATCH 전에 먼저 보내는 요청을 흉내)
curl -i -X OPTIONS "$BASE/api/posts" -H 'Origin: http://localhost:3000' \
  -H 'Access-Control-Request-Method: PATCH' -H 'Access-Control-Request-Headers: content-type,authorization'

# 요청 D — 요청 A에 Origin을 붙여(브라우저가 보내는 모양) 응답의 CORS 헤더 보기
curl -i -X POST "$BASE/api/posts" -H 'Origin: http://localhost:3000' -H 'Content-Type: application/json' \
  -d '{"boardSlug":"dev","title":"[채점] 첫 게시글","content":"Spring Boot로 만든 첫 게시글입니다.","tags":["spring","jpa"],"visibility":"PUBLIC"}'
```

브라우저로 확인 — 위쪽 **내 서버 주소**가 앱 주소와 같은지 보고 아래 실행 칸의 [전체 실행]을 누른다. C1·C2가 통과하면 브라우저에서도 CORS가 열린 것이다(요청 A는 preflight를 거친다). "CORS로 막혔어요"가 뜨면 [CORS 열기](#cors-열기)를 다시 본다. 개발자 도구(F12) → Network 탭에서 `OPTIONS /api/posts`(preflight)와 `POST /api/posts` 두 줄, 응답 헤더의 `Access-Control-Allow-Origin`을 볼 수 있다. C3·C4는 브라우저가 대신 보낼 수 없는 요청이라(코드는 `Origin` 헤더를 못 바꾼다) 위 curl로 확인한다.

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "A",
      "title": "정상 요청",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "dev",
        "title": "[채점] 첫 게시글",
        "content": "Spring Boot로 만든 첫 게시글입니다.",
        "tags": [
          "spring",
          "jpa"
        ],
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "B",
      "title": "깨진 JSON",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": "{\"title\": \"[채점] 깨짐\""
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 200,
        "bodyText": {
          "equals": "success"
        }
      }
    },
    {
      "id": "C2",
      "request": "B",
      "expect": {
        "status": 400
      }
    },
    {
      "id": "C3",
      "manual": "CORS preflight — 브라우저 코드는 Origin·Access-Control-Request-Method를 직접 못 붙인다. 위 요청 C(curl)로 200, Access-Control-Allow-Origin: http://localhost:3000, Allow-Methods에 PATCH, Allow-Headers에 authorization이 있는지 본다"
    },
    {
      "id": "C4",
      "manual": "노출 헤더 — 브라우저 코드는 Access-Control-* 응답 헤더를 못 읽는다. 위 요청 D(curl)로 Access-Control-Allow-Origin: http://localhost:3000, Access-Control-Expose-Headers에 Location·WWW-Authenticate가 있는지 본다"
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용 — 통과/실패에 넣지 않는다).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | 상태 `200`, 본문이 정확히 `success` |
| C2 | 요청 B | 상태 `400` |
| C3 | 요청 C (CORS preflight) | 상태 `200`, `Access-Control-Allow-Origin: http://localhost:3000`, `Access-Control-Allow-Methods`에 `PATCH`, `Access-Control-Allow-Headers`에 `authorization` |
| C4 | 요청 D (`Origin`을 붙인 요청 A) | 상태 `200`, `Access-Control-Allow-Origin: http://localhost:3000`, `Access-Control-Expose-Headers`에 `Location`·`WWW-Authenticate` |
| R1 | 컨트롤러 | `@RestController`이고 `POST /api/posts`에 매핑되어 있다(`@PostMapping`, 또는 클래스의 `@RequestMapping("/api/posts")` + `@PostMapping`) |
| R2 | 요청 객체 | 본문을 `Map`이나 `String`이 아니라 전용 클래스(권장: `record`, 예: `PostCreateRequest`)로 받는다. 필드 이름이 JSON과 같다 |
| R3 | 로그 | 받은 제목을 SLF4J 로거로 남긴다(`System.out.println`이 아님). 자리표시자 `{}`를 쓴다 |

## 필요한 지식

- [W01 API 하나 만들 때 실제 작업 순서](../../docs/knowledge/W01-api-dev-order.md) — 지금 어디부터 만드는지 감 잡기
- [P03 애노테이션 — 웹 매핑과 입력 위치](../../docs/knowledge/P03-annotations-cheatsheet.md#23-웹-매핑과-입력-위치) — `@RestController`, `@PostMapping`, `@RequestBody`
- [P16 JSON·Jackson — `@RequestBody`가 동작하는 지점](../../docs/knowledge/P16-json-jackson-practical.md#22-requestbody가-동작하는-지점) — JSON이 객체가 되는 과정과 400이 나는 이유
- [P16 — 요청과 응답은 DTO로 고정한다](../../docs/knowledge/P16-json-jackson-practical.md#21-요청과-응답은-dto로-고정한다)
- [W07 왜 System.out.println 대신 로거를 쓰나](../../docs/knowledge/W07-why-logger.md)
- [D11 웹 보안 기초 — Origin과 CORS](../../docs/knowledge/D11-web-security-basics.md#31-요청-경계-https-origin-cors) — 같은 출처 정책, preflight, CORS가 인증이 아닌 이유

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 어떤 파일을 만들까</summary>

`org.example` 아래에 게시글 기능용 패키지(예: `org.example.post`)를 하나 만들고, 컨트롤러 클래스 하나와 요청 `record` 하나로 시작한다. `HelloController`가 어떻게 생겼는지 먼저 보자.
</details>

<details>
<summary>힌트 2 — 본문을 객체로 받기</summary>

컨트롤러 메서드의 매개변수에 `@RequestBody`를 붙이면 Spring이 JSON을 그 타입으로 바꿔 준다. `record`의 구성 요소 이름이 JSON 필드 이름과 같아야 한다. 반환 타입이 `String`이면 그 문자열이 그대로 응답 본문이 된다.
</details>

<details>
<summary>힌트 3 — SLF4J 로거</summary>

`log.info(...)`를 호출하려면 먼저 `log`라는 로거 인스턴스가 있어야 한다. Lombok 없이 직접 선언하는 방법은 다음과 같다.

~~~java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
public class PostController {
    private static final Logger log = LoggerFactory.getLogger(PostController.class);

    // 메서드 안에서 log.info("게시글 작성 요청: {}", request.title());
}
~~~

Lombok의 `@Slf4j`를 클래스에 붙이면 컴파일할 때 같은 이름의 `log` 필드를 만들어 주므로 import와 필드 선언을 생략할 수 있다. 이 학습 레포는 명시적 SLF4J 필드를 기본 예제로 사용한다. 필드 선언을 눈으로 확인하고 로거가 어디서 오는지 이해하기 쉽기 때문이다. 기존 프로젝트가 `@Slf4j`를 쓰면 그 관례에 맞추면 된다.
</details>

<details>
<summary>힌트 4 — CORS 설정 코드</summary>

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("http://localhost:[*]", "http://127.0.0.1:[*]")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type", "Authorization", "X-Client")
                .exposedHeaders("Location", "WWW-Authenticate");
    }
}
```

`allowedOrigins("*")`로 모두 열지 않는다. 고친 뒤에는 앱을 다시 띄워야 반영된다.
</details>

## 다음 단계

[1-2. DB에 저장하고 201로 응답](1-2-dto-response.md) — `success` 대신 받은 글을 DB에 저장하고, 저장된 글을 JSON으로 돌려준다. 그러면 이 단계의 채점(C1)은 실패하게 되는데, 정상이다.
