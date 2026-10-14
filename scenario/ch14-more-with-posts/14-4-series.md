# 14-4. 시리즈(연재) — 글 묶기와 이전/다음 글

> 시나리오 DB(`community`) — 앱을 기본 프로파일로 띄운다.

## 상황

> "연재하는 분들이 '1편, 2편…'을 묶고 싶어 해요. 시리즈를 만들고 내 글을 순서대로 넣으면, 글 아래에 '이전 글 / 다음 글'이 나오게 해 주세요. 글 하나는 시리즈 하나에만 들어가고, 다른 시리즈에 넣으면 옮겨지면 돼요."

시리즈는 **글을 담는 그릇**이다. 테이블 두 개(시리즈, 시리즈-글 연결)와 **순서 칼럼**이 생긴다. 어려운 곳은 "이전/다음"이다.

- 시리즈 안에 **팔로워 공개 글**이 섞여 있으면, 비로그인 독자에게는 그 글을 **건너뛰고** 다음 글을 보여 줘야 한다. 순서 번호 ±1로 찾으면 안 보이는 글을 가리킨다.
- 중간 글을 빼면 번호에 **빈자리**가 생긴다(1, 3). 이것도 ±1로는 못 찾는다.

그래서 "보는 사람이 볼 수 있는 글만 순서대로 늘어놓고 그 안에서 앞뒤"를 찾는다. 같은 시리즈도 보는 사람마다 목록이 다르다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글 상세 — 시리즈 이전/다음",
  "summary": "글 아래에 시리즈 이름과 이전·다음 글이 나온다. 볼 수 없는 글은 건너뛴다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "자유글 01", "right": "비로그인" },
    { "type": "text", "id": "body", "value": "페이징 확인용 자유글 01입니다.", "emphasis": "body" },
    { "type": "text", "id": "series-name", "value": "📚 시리즈: [채점] JPA 연재", "emphasis": "caption" },
    {
      "type": "list",
      "id": "nav",
      "items": [
        { "id": "prev", "title": "← 이전 글 없음", "tone": "muted" },
        { "id": "next", "title": "다음 글 → 자유글 03" }
      ]
    },
    { "type": "field", "id": "new-title", "label": "새 시리즈 제목", "value": "가", "error": "2~100자로 입력해 주세요" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "create", "label": "시리즈 만들기", "variant": "primary" }, { "id": "add", "label": "이 글을 시리즈에 넣기", "variant": "secondary" }] }
  ],
  "flows": [
    {
      "name": "이전/다음 글(비로그인)",
      "steps": [
        { "kind": "user", "text": "비로그인으로 '자유글 01'을 연다" },
        { "kind": "request", "method": "GET", "path": "/api/posts/12/series" },
        { "kind": "db", "sql": "SELECT sp.*, s.* FROM series_post sp JOIN series s ON s.id = sp.series_id WHERE sp.post_id = 12" },
        { "kind": "db", "sql": "SELECT sp.*, p.*, m.* FROM series_post sp JOIN post p ON p.id = sp.post_id JOIN member m ON m.id = p.author_id WHERE sp.series_id = 1 ORDER BY sp.position", "note": "12 → 6(팔로워 공개) → 14" },
        { "kind": "server", "text": "보는 사람 기준(2-3)으로 거르면 12 → 14. 그 안에서 12의 앞뒤를 찾는다" },
        {
          "kind": "response",
          "status": 200,
          "headers": ["Content-Type: application/json"],
          "body": "{\"seriesId\": 1, \"title\": \"[채점] JPA 연재\", \"prev\": null, \"next\": {\"postId\": 14, \"title\": \"자유글 03\"}}"
        },
        { "kind": "screen", "text": "다음 글이 '자유글 03' — 팔로워 공개 글을 건너뛰었다", "focus": ["series-name", "nav"] }
      ]
    },
    {
      "name": "시리즈에 글 넣기",
      "steps": [
        { "kind": "user", "text": "이스프링이 '자유글 03'을 시리즈에 넣는다", "focus": ["add"] },
        { "kind": "request", "method": "PUT", "path": "/api/series/1/posts/14", "headers": ["Authorization: Bearer tok-lee"] },
        { "kind": "server", "text": "내 시리즈인가(403) → 글이 있나(404) → 내 글인가(403) → 다른 시리즈에 있으면 그 행을 지우고(옮기기) 이 시리즈 끝에 넣는다" },
        { "kind": "db", "sql": "SELECT COALESCE(MAX(position), 0) FROM series_post WHERE series_id = 1" },
        { "kind": "db", "sql": "INSERT INTO series_post (series_id, post_id, position, created_at) VALUES (1, 14, 3, ?)" },
        {
          "kind": "response",
          "status": 200,
          "headers": ["Content-Type: application/json"],
          "body": "{\"id\": 1, \"title\": \"[채점] JPA 연재\", \"description\": null, \"author\": {\"id\": 3, \"nickname\": \"이스프링\"}, \"posts\": [{\"postId\": 12, \"title\": \"자유글 01\"}, {\"postId\": 6, \"title\": \"[팔로워 공개] 이직 고민\"}, {\"postId\": 14, \"title\": \"자유글 03\"}]}"
        },
        { "kind": "screen", "text": "작성자에게는 세 편이 모두 보인다", "focus": ["series-name"] }
      ]
    },
    {
      "name": "제목이 너무 짧음",
      "steps": [
        { "kind": "user", "text": "시리즈 제목을 '가' 한 글자로 만든다", "focus": ["new-title", "create"] },
        { "kind": "request", "method": "POST", "path": "/api/series", "headers": ["Content-Type: application/json", "Authorization: Bearer tok-lee"], "body": "{\"title\": \"가\"}" },
        { "kind": "server", "text": "@Size(min = 2, max = 100) 위반 → MethodArgumentNotValidException → 400. 저장하지 않는다" },
        {
          "kind": "response",
          "status": 400,
          "headers": ["Content-Type: application/problem+json"],
          "body": "{\"detail\": \"입력값이 올바르지 않습니다.\", \"errors\": [{\"field\": \"title\", \"message\": \"시리즈 제목은 2~100자여야 합니다.\"}]}"
        },
        { "kind": "screen", "text": "제목 칸 아래 '2~100자로 입력해 주세요'", "focus": ["new-title"] }
      ]
    }
  ]
}
```

## 만들 것

**V53** — `db/migration/V53__create_series.sql`

| 테이블 | 컬럼·제약 |
|---|---|
| `series` | `id`, `author_id`(FK), `title VARCHAR(100) NOT NULL`, `description VARCHAR(500) NULL`, `created_at`, `updated_at` |
| `series_post` | `id`, `series_id`(FK), `post_id`(FK, **`UNIQUE`** — 글 하나는 시리즈 하나에만), `position INT`(1부터, 넣은 순), `created_at`, 인덱스 `(series_id, position)` |

**API**

| 메서드·경로 | 의미 | 성공 응답 |
|---|---|---|
| `POST /api/series` | 만들기 `{ "title": "...", "description": "..." }` | `201`, `Location: /api/series/{id}`, 시리즈 JSON |
| `PUT /api/series/{seriesId}/posts/{postId}` | 끝에 넣기. 이미 이 시리즈에 있으면 그대로, 내 다른 시리즈에 있으면 옮긴다 | `200` 시리즈 JSON |
| `DELETE /api/series/{seriesId}/posts/{postId}` | 빼기(없어도 성공) | `204` |
| `GET /api/series/{seriesId}` | 보기 — **비로그인 가능** | `200` 시리즈 JSON |
| `GET /api/posts/{postId}/series` | 이 글의 시리즈와 이전/다음 — **비로그인 가능** | `200` `{ "seriesId", "title", "prev": { "postId", "title" } \| null, "next": … }`, 시리즈에 없는 글이면 `204` |

시리즈 JSON — `posts`는 **보는 사람이 볼 수 있는 글만** 시리즈 순서대로.

```json
{ "id": 1, "title": "[채점] JPA 연재", "description": null, "author": { "id": 3, "nickname": "이스프링" },
  "posts": [ { "postId": 12, "title": "자유글 01" }, { "postId": 14, "title": "자유글 03" } ] }
```

**필드 규칙** — `POST /api/series`. 틀리면 `400`이고 `errors`에 틀린 필드가 모두 들어간다. 잘못된 입력은 어떤 경우에도 500이 아니다.

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `title` | 예 | 안 됨(`null`·`""`·공백만) | 앞뒤 공백을 자르고 **2~100**자 | 문자열(배열 등 → 400) | 없음 | `400`, `errors`에 `title` |
| `description` | 아니오 | `null`·생략 허용(빈 문자열·공백만이면 `null`로 저장) | 앞뒤 공백을 자른 뒤 **500**자 이하 | 문자열 | `null` | `400`, `errors`에 `description` |

경로 값 — `PUT`·`DELETE`

| 입력 | 규칙 | 틀렸을 때 |
|---|---|---|
| `{seriesId}` | 숫자, 있는 시리즈 | 문자 `400`, 없으면 `404` |
| 〃 | **내 시리즈** | `403` |
| `{postId}` | 숫자, 있고 지워지지 않은 글 | 문자 `400`, 없거나 지워졌으면 `404` |
| 〃 | **내 글** | `403` |

| 상황 | 결과 |
|---|---|
| 토큰 없이 POST·PUT·DELETE | `401` |
| `GET /api/posts/{postId}/series`에서 글 자체를 볼 수 없음 | `404` |
| 이전/다음 | 보는 사람이 볼 수 없는 글은 건너뛴다. 빼서 생긴 빈 번호와 무관하다 |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 12 → 6(팔로워 공개) → 14
- 보는 사람 기준(2-3)으로 거르면 12 → 14. 그 안에서 12의 앞뒤를 찾는다
- 내 시리즈인가(403) → 글이 있나(404) → 내 글인가(403) → 다른 시리즈에 있으면 그 행을 지우고(옮기기) 이 시리즈 끝에 넣는다
- @Size(min = 2, max = 100) 위반 → MethodArgumentNotValidException → 400. 저장하지 않는다

<details>
<summary>Controller — HTTP 연결</summary>

`SeriesController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@PostMapping("/api/series")`, `@GetMapping("/api/series/{seriesId}")`, `@PutMapping("/api/series/{seriesId}/posts/{postId}")`. 변경된 메서드: `create`, `get`, `addPost`, `removePost`.

`src/main/java/org/example/series/SeriesController.java`

```java
package org.example.series;

import jakarta.validation.Validator;
import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.example.post.InvalidParametersException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class SeriesController {

    private final SeriesService seriesService;
    private final Validator validator;

    public SeriesController(SeriesService seriesService, Validator validator) {
        this.seriesService = seriesService;
        this.validator = validator;
    }

    @PostMapping("/api/series")
    public ResponseEntity<SeriesResponse> create(@LoginMember AuthenticatedMember loginMember,
                                                 @RequestBody JsonNode body) {
        SeriesCreateRequest.Parsed parsed = SeriesCreateRequest.parse(body);
        Map<String, String> errors = new LinkedHashMap<>(parsed.errors());
        validator.validate(parsed.request()).forEach(v -> errors.putIfAbsent(v.getPropertyPath().toString(), v.getMessage()));
        if (!errors.isEmpty()) {
            throw new InvalidParametersException(errors);
        }
        Series series = seriesService.create(loginMember, parsed.request());
        return ResponseEntity.created(URI.create("/api/series/" + series.getId()))
                .body(seriesService.get(series.getId(), loginMember));
    }

    @GetMapping("/api/series/{seriesId}")
    public SeriesResponse get(@PathVariable Long seriesId, @LoginMember AuthenticatedMember viewer) {
        return seriesService.get(seriesId, viewer);
    }

    @PutMapping("/api/series/{seriesId}/posts/{postId}")
    public SeriesResponse addPost(@PathVariable Long seriesId, @PathVariable Long postId,
                                  @LoginMember AuthenticatedMember loginMember) {
        return seriesService.addPost(seriesId, postId, loginMember);
    }

    @DeleteMapping("/api/series/{seriesId}/posts/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removePost(@PathVariable Long seriesId, @PathVariable Long postId,
                           @LoginMember AuthenticatedMember loginMember) {
        seriesService.removePost(seriesId, postId, loginMember);
    }

    // 시리즈에 없는 글이면 204(본문 없음) — 화면은 "이전/다음" 칸을 그리지 않는다
    @GetMapping("/api/posts/{postId}/series")
    public ResponseEntity<SeriesNavResponse> nav(@PathVariable Long postId, @LoginMember AuthenticatedMember viewer) {
        return seriesService.nav(postId, viewer)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`SeriesCreateRequest.java`, `SeriesNavResponse.java`, `SeriesResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

`src/main/java/org/example/series/SeriesCreateRequest.java`

```java
package org.example.series;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.example.post.InvalidParametersException;
import tools.jackson.databind.JsonNode;

import java.util.LinkedHashMap;
import java.util.Map;

// 제목은 앞뒤 공백을 자른 길이로 2~100자(서비스에서 다시 확인), 소개는 없어도 된다(null 허용, 500자까지)
public record SeriesCreateRequest(
        @NotBlank(message = "시리즈 제목을 입력해 주세요.")
        @Size(min = 2, max = 100, message = "시리즈 제목은 2~100자여야 합니다.")
        String title,

        @Size(max = 500, message = "소개는 500자 이하여야 합니다.")
        String description
) {
    // 길이는 공백을 제거한 값으로 검사하고, Jackson의 숫자→문자열 변환 전에 타입을 확인한다.
    public static Parsed parse(JsonNode body) {
        if (body == null || !body.isObject()) {
            throw new InvalidParametersException(Map.of("body", "JSON 객체가 필요합니다."));
        }
        Map<String, String> errors = new LinkedHashMap<>();
        String title = text(body.get("title"), "title", errors);
        String description = text(body.get("description"), "description", errors);
        SeriesCreateRequest request = new SeriesCreateRequest(title,
                description == null || description.isBlank() ? null : description);
        return new Parsed(request, Map.copyOf(errors));
    }

    public record Parsed(SeriesCreateRequest request, Map<String, String> errors) {
    }

    private static String text(JsonNode value, String field, Map<String, String> errors) {
        if (value == null || value.isNull()) {
            return null;
        }
        if (!value.isTextual()) {
            errors.put(field, "문자열이어야 합니다.");
            return null;
        }
        return value.asText().strip();
    }
}
```

`src/main/java/org/example/series/SeriesNavResponse.java`

```java
package org.example.series;

// 글 상세 아래의 "이전 글 / 다음 글" — 보는 사람이 볼 수 있는 글 중에서 앞뒤. 없으면 null
public record SeriesNavResponse(Long seriesId, String title, SeriesResponse.Item prev, SeriesResponse.Item next) {
}
```

`src/main/java/org/example/series/SeriesResponse.java`

```java
package org.example.series;

import org.example.post.AuthorResponse;

import java.util.List;

// posts — 보는 사람이 볼 수 있는 글만, 시리즈 순서대로
public record SeriesResponse(Long id, String title, String description, AuthorResponse author, List<Item> posts) {

    public record Item(Long postId, String title) {
    }
}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`SeriesService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `create`, `addPost`, `removePost`, `get`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

`src/main/java/org/example/series/SeriesService.java`

```java
package org.example.series;

import org.example.auth.AuthenticatedMember;
import org.example.member.MemberRepository;
import org.example.post.AuthorResponse;
import org.example.post.InvalidPostFieldException;
import org.example.post.Post;
import org.example.post.PostAccessPolicy;
import org.example.post.PostNotFoundException;
import org.example.post.PostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.function.Predicate;

// 시리즈 — 작성자가 자기 글을 묶는다. 글 하나는 시리즈 하나에만(다른 시리즈에 넣으면 옮긴다).
// 목록·이전/다음은 보는 사람 기준(2-3)으로 볼 수 있는 글만 — 중간 글을 못 보면 건너뛴다.
@Service
public class SeriesService {

    private static final int TITLE_MIN = 2;

    private final SeriesRepository seriesRepository;
    private final SeriesPostRepository seriesPostRepository;
    private final PostRepository postRepository;
    private final MemberRepository memberRepository;
    private final PostAccessPolicy accessPolicy;
    private final Clock clock;

    public SeriesService(SeriesRepository seriesRepository, SeriesPostRepository seriesPostRepository,
                         PostRepository postRepository, MemberRepository memberRepository,
                         PostAccessPolicy accessPolicy, Clock clock) {
        this.seriesRepository = seriesRepository;
        this.seriesPostRepository = seriesPostRepository;
        this.postRepository = postRepository;
        this.memberRepository = memberRepository;
        this.accessPolicy = accessPolicy;
        this.clock = clock;
    }

    @Transactional
    public Series create(AuthenticatedMember me, SeriesCreateRequest request) {
        // @Size는 공백을 포함한 길이를 본다 — " 가 "는 3자로 통과하므로 자른 뒤 다시 확인한다
        String title = request.title().strip();
        if (title.length() < TITLE_MIN) {
            throw new InvalidPostFieldException("title", "시리즈 제목은 2~100자여야 합니다.");
        }
        String description = request.description() == null || request.description().isBlank()
                ? null : request.description().strip();
        Series series = new Series(memberRepository.getReferenceById(me.id()), title, description,
                LocalDateTime.now(clock));
        return seriesRepository.save(series);
    }

    // 끝에 넣기. 이미 이 시리즈에 있으면 그대로, 내 다른 시리즈에 있으면 옮긴다
    @Transactional
    public SeriesResponse addPost(Long seriesId, Long postId, AuthenticatedMember me) {
        Series series = findMine(seriesId, me);
        Post post = postRepository.findByIdForUpdate(postId)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(PostNotFoundException::new);
        if (!post.getAuthor().getId().equals(me.id())) {
            throw new SeriesForbiddenException("내 글만 시리즈에 넣을 수 있습니다.");
        }
        Optional<SeriesPost> current = seriesPostRepository.findByPostIdForUpdate(postId);
        if (current.isEmpty() || !current.get().getSeries().getId().equals(seriesId)) {
            current.ifPresent(sp -> {
                seriesPostRepository.delete(sp);
                seriesPostRepository.flush(); // UNIQUE(post_id) — 지우기가 먼저 DB에 반영돼야 새 행을 넣을 수 있다
            });
            int next = seriesPostRepository.findMaxPosition(seriesId) + 1;
            seriesPostRepository.save(new SeriesPost(series, post, next, LocalDateTime.now(clock)));
        }
        return view(series, me);
    }

    @Transactional
    public void removePost(Long seriesId, Long postId, AuthenticatedMember me) {
        findMine(seriesId, me);
        seriesPostRepository.deleteFromSeries(seriesId, postId);
    }

    @Transactional(readOnly = true)
    public SeriesResponse get(Long seriesId, AuthenticatedMember viewer) {
        Series series = seriesRepository.findById(seriesId).orElseThrow(SeriesNotFoundException::new);
        return view(series, viewer);
    }

    // 글이 시리즈에 없으면 빈 값(컨트롤러가 204로). 글 자체를 볼 수 없으면 404
    @Transactional(readOnly = true)
    public Optional<SeriesNavResponse> nav(Long postId, AuthenticatedMember viewer) {
        Post post = postRepository.findById(postId).orElseThrow(PostNotFoundException::new);
        if (!accessPolicy.canView(viewer, post)) {
            throw new PostNotFoundException();
        }
        return seriesPostRepository.findByPostId(postId).map(sp -> {
            List<Post> visible = visiblePosts(sp.getSeries().getId(), viewer);
            int i = indexOf(visible, postId);
            SeriesResponse.Item prev = i > 0 ? item(visible.get(i - 1)) : null;
            SeriesResponse.Item next = i >= 0 && i < visible.size() - 1 ? item(visible.get(i + 1)) : null;
            return new SeriesNavResponse(sp.getSeries().getId(), sp.getSeries().getTitle(), prev, next);
        });
    }

    SeriesResponse view(Series series, AuthenticatedMember viewer) {
        List<SeriesResponse.Item> posts = visiblePosts(series.getId(), viewer).stream().map(this::item).toList();
        return new SeriesResponse(series.getId(), series.getTitle(), series.getDescription(),
                new AuthorResponse(series.getAuthor().getId(), series.getAuthor().getNickname()), posts);
    }

    private List<Post> visiblePosts(Long seriesId, AuthenticatedMember viewer) {
        Predicate<Post> viewable = accessPolicy.viewableBy(viewer);
        return seriesPostRepository.findInOrder(seriesId).stream()
                .map(SeriesPost::getPost)
                .filter(viewable)
                .toList();
    }

    private static int indexOf(List<Post> posts, Long postId) {
        for (int i = 0; i < posts.size(); i++) {
            if (posts.get(i).getId().equals(postId)) {
                return i;
            }
        }
        return -1;
    }

    private SeriesResponse.Item item(Post post) {
        return new SeriesResponse.Item(post.getId(), post.getTitle());
    }

    private Series findMine(Long seriesId, AuthenticatedMember me) {
        Series series = seriesRepository.findByIdForUpdate(seriesId).orElseThrow(SeriesNotFoundException::new);
        if (!series.isOwnedBy(me.id())) {
            throw new SeriesForbiddenException("내 시리즈만 고칠 수 있습니다.");
        }
        return series;
    }
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`SeriesPostRepository.java`, `SeriesRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.

`src/main/java/org/example/series/SeriesPostRepository.java`

```java
package org.example.series;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;
import java.util.Optional;

public interface SeriesPostRepository extends JpaRepository<SeriesPost, Long> {

    // 시리즈의 글을 순서대로, 글·작성자까지 한 번에
    @Query("""
            SELECT sp FROM SeriesPost sp
            JOIN FETCH sp.post p
            JOIN FETCH p.author
            WHERE sp.series.id = :seriesId
            ORDER BY sp.position ASC, sp.id ASC
            """)
    List<SeriesPost> findInOrder(@Param("seriesId") Long seriesId);

    @Query("SELECT sp FROM SeriesPost sp JOIN FETCH sp.series WHERE sp.post.id = :postId")
    Optional<SeriesPost> findByPostId(@Param("postId") Long postId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT sp FROM SeriesPost sp WHERE sp.post.id = :postId")
    Optional<SeriesPost> findByPostIdForUpdate(@Param("postId") Long postId);

    @Query("SELECT COALESCE(MAX(sp.position), 0) FROM SeriesPost sp WHERE sp.series.id = :seriesId")
    int findMaxPosition(@Param("seriesId") Long seriesId);

    @Modifying
    @Query("DELETE FROM SeriesPost sp WHERE sp.series.id = :seriesId AND sp.post.id = :postId")
    int deleteFromSeries(@Param("seriesId") Long seriesId, @Param("postId") Long postId);
}
```

`src/main/java/org/example/series/SeriesRepository.java`

```java
package org.example.series;

import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SeriesRepository extends JpaRepository<Series, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Series s WHERE s.id = :id")
    Optional<Series> findByIdForUpdate(@Param("id") Long id);
}
```

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Series.java`, `SeriesPost.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다.

`src/main/java/org/example/series/Series.java`

```java
package org.example.series;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.example.member.Member;

import java.time.LocalDateTime;

@Entity
@Table(name = "series")
public class Series {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private Member author;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected Series() {
        // JPA
    }

    public Series(Member author, String title, String description, LocalDateTime now) {
        this.author = author;
        this.title = title;
        this.description = description;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public boolean isOwnedBy(Long memberId) {
        return author.getId().equals(memberId);
    }

    public Long getId() {
        return id;
    }

    public Member getAuthor() {
        return author;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }
}
```

`src/main/java/org/example/series/SeriesPost.java`

```java
package org.example.series;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.example.post.Post;

import java.time.LocalDateTime;

// 시리즈 안의 글 하나 — position은 1부터, 빼면 빈 번호가 생긴다(이전/다음은 번호 ±1이 아니라 앞뒤 순서로 찾는다)
@Entity
@Table(name = "series_post")
public class SeriesPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "series_id", nullable = false)
    private Series series;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(nullable = false)
    private Integer position;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected SeriesPost() {
        // JPA
    }

    public SeriesPost(Series series, Post post, int position, LocalDateTime now) {
        this.series = series;
        this.post = post;
        this.position = position;
        this.createdAt = now;
    }

    public Series getSeries() {
        return series;
    }

    public Post getPost() {
        return post;
    }
}
```

</details>

<details>
<summary>Flyway / SQL — 스키마 변경</summary>

`V53__create_series.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.

`src/main/resources/db/migration/V53__create_series.sql`

```sql
-- 14-4 시리즈(연재) — 작성자가 자기 글을 순서대로 묶는다. 글 하나는 시리즈 하나에만(UNIQUE post_id).
-- 다른 시리즈에 넣으면 옮겨진다(행을 지우고 새 시리즈 끝에 넣는다).
CREATE TABLE series (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    author_id   BIGINT       NOT NULL,
    title       VARCHAR(100) NOT NULL,
    description VARCHAR(500) NULL,
    created_at  DATETIME     NOT NULL,
    updated_at  DATETIME     NOT NULL,
    PRIMARY KEY (id),
    KEY fk_series_author (author_id),
    CONSTRAINT fk_series_author FOREIGN KEY (author_id) REFERENCES member (id)
);

CREATE TABLE series_post (
    id         BIGINT   NOT NULL AUTO_INCREMENT,
    series_id  BIGINT   NOT NULL,
    post_id    BIGINT   NOT NULL,
    position   INT      NOT NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_series_post_post (post_id),
    KEY ix_series_post_order (series_id, position),
    CONSTRAINT fk_series_post_series FOREIGN KEY (series_id) REFERENCES series (id),
    CONSTRAINT fk_series_post_post FOREIGN KEY (post_id) REFERENCES post (id)
);
```

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`ApiExceptionHandler.java`, `SeriesForbiddenException.java`, `SeriesNotFoundException.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handleSeriesNotFound`, `handleSeriesForbidden`.

`src/main/java/org/example/common/ApiExceptionHandler.java`

```java
package org.example.common;

import jakarta.servlet.http.HttpServletRequest;
import tools.jackson.core.JacksonException;
import org.example.admin.AdminOnlyException;
import org.example.admin.ModerationConflictException;
import org.example.auth.AuthenticationRequiredException;
import org.example.auth.MemberNotActiveException;
import org.example.auth.MemberSuspendedException;
import org.example.board.BoardNotFoundException;
import org.example.board.BoardWriteForbiddenException;
import org.example.bookmark.BookmarkFolderNotFoundException;
import org.example.bookmark.InvalidBookmarkFieldException;
import org.example.bookmark.BookmarkNotFoundException;
import org.example.bookmark.DuplicateBookmarkFolderNameException;
import org.example.bookmark.InvalidBookmarkFolderException;
import org.example.comment.CommentForbiddenException;
import org.example.comment.CommentNotFoundException;
import org.example.comment.InvalidParentCommentException;
import org.example.image.EmptyImageException;
import org.example.image.ImageNotFoundException;
import org.example.image.UnsupportedImageException;
import org.example.like.SelfLikeNotAllowedException;
import org.example.member.MemberNotFoundException;
import org.example.moderation.BannedContentException;
import org.example.moderation.BannedWordNotFoundException;
import org.example.moderation.DuplicateBannedWordException;
import org.example.notification.NotificationNotFoundException;
import org.example.post.InvalidParametersException;
import org.example.post.InvalidPostFieldException;
import org.example.post.InvalidSearchConditionException;
import org.example.post.PostForbiddenException;
import org.example.post.PostNotDeletedException;
import org.example.revision.RevisionForbiddenException;
import org.example.post.PostNotDraftException;
import org.example.post.PostRestoreExpiredException;
import org.example.post.PostRestoreForbiddenException;
import org.example.post.PostNotFoundException;
import org.example.post.PostStatusConflictException;
import org.example.post.TooManyPostsException;
import org.example.report.DuplicateReportException;
import org.example.report.NothingToResolveException;
import org.example.report.ReportTargetNotFoundException;
import org.example.report.SelfReportNotAllowedException;
import org.example.social.FollowBlockedException;
import org.example.social.SelfFollowNotAllowedException;
import org.example.social.SelfMuteNotAllowedException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.net.URI;
import java.util.List;
import java.util.Map;
import org.example.poll.InvalidPollException;
import org.example.poll.PollConflictException;
import org.example.poll.PollNotFoundException;
import org.example.pin.InvalidPinException;
import org.example.series.SeriesForbiddenException;
import org.example.series.SeriesNotFoundException;

// 모든 컨트롤러의 에러 응답을 한 곳에서 RFC 9457 Problem Details로 만든다.
// 컨트롤러마다 try-catch를 두지 않는다.
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        List<Map<String, String>> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> Map.of(
                        "field", fieldError.getField(),
                        "message", fieldError.getDefaultMessage() == null ? "" : fieldError.getDefaultMessage()
                ))
                .toList();
        problem.setProperty("errors", errors);
        return problem;
    }

    // 13-4 금칙어 — 1-5 검증 오류와 같은 모양(어느 필드인지 errors에)
    @ExceptionHandler(BannedContentException.class)
    public ProblemDetail handleBannedContent(BannedContentException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", ex.getErrors());
        return problem;
    }

    @ExceptionHandler(DuplicateBannedWordException.class)
    public ProblemDetail handleDuplicateBannedWord(DuplicateBannedWordException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(BannedWordNotFoundException.class)
    public ProblemDetail handleBannedWordNotFound(BannedWordNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleUnreadable(HttpMessageNotReadableException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "요청 본문을 읽을 수 없습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        // 11-1 JSON 문법은 맞는데 한 필드의 형식이 틀린 경우(숫자 자리에 "abc", 목록 자리에 문자열) —
        // Jackson이 남긴 경로로 어느 필드인지 errors에 담는다. 목록 안이면 Bean Validation과 같은 모양(imageIds[0]).
        // JSON 문법 자체가 깨졌으면 경로가 비어 있어 errors 없이 400만 나간다. Jackson은 첫 오류에서 멈추므로 하나만 들어간다.
        if (ex.getCause() instanceof JacksonException jackson && !jackson.getPath().isEmpty()) {
            problem.setProperty("errors", List.of(Map.of("field", fieldPath(jackson), "message", "형식이 올바르지 않습니다.")));
        }
        return problem;
    }

    // 11-1 경로·쿼리 값의 형식 오류(/api/posts/abc, ?size=abc) — 그대로 두면 Spring 기본 응답이라 어느 값이 틀렸는지 없다
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", List.of(Map.of("field", ex.getName(),
                "message", "형식이 올바르지 않습니다: " + ex.getValue())));
        return problem;
    }

    private static String fieldPath(JacksonException jackson) {
        StringBuilder field = new StringBuilder();
        for (JacksonException.Reference ref : jackson.getPath()) {
            if (ref.getPropertyName() != null) {
                if (!field.isEmpty()) {
                    field.append('.');
                }
                field.append(ref.getPropertyName());
            } else {
                field.append('[').append(ref.getIndex()).append(']');
            }
        }
        return field.toString();
    }

    @ExceptionHandler(BoardNotFoundException.class)
    public ProblemDetail handleBoardNotFound(BoardNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(PostNotFoundException.class)
    public ProblemDetail handlePostNotFound(PostNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(BoardWriteForbiddenException.class)
    public ProblemDetail handleBoardWriteForbidden(BoardWriteForbiddenException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(SelfLikeNotAllowedException.class)
    public ProblemDetail handleSelfLikeNotAllowed(SelfLikeNotAllowedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(PostForbiddenException.class)
    public ProblemDetail handlePostForbidden(PostForbiddenException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // 11-1 임시저장이 아닌 글을 발행 — 지금 상태와 충돌
    @ExceptionHandler(PostNotDraftException.class)
    public ProblemDetail handlePostNotDraft(PostNotDraftException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // 11-6 이력은 작성자·운영자만
    @ExceptionHandler(RevisionForbiddenException.class)
    public ProblemDetail handleRevisionForbidden(RevisionForbiddenException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // 11-5 복구
    @ExceptionHandler(PostNotDeletedException.class)
    public ProblemDetail handlePostNotDeleted(PostNotDeletedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(PostRestoreForbiddenException.class)
    public ProblemDetail handlePostRestoreForbidden(PostRestoreForbiddenException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(PostRestoreExpiredException.class)
    public ProblemDetail handlePostRestoreExpired(PostRestoreExpiredException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.GONE, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // 11-2 이미지 업로드
    @ExceptionHandler(EmptyImageException.class)
    public ProblemDetail handleEmptyImage(EmptyImageException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(UnsupportedImageException.class)
    public ProblemDetail handleUnsupportedImage(UnsupportedImageException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNSUPPORTED_MEDIA_TYPE, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // spring.servlet.multipart.max-file-size를 넘으면 컨트롤러에 오기 전에(요청을 읽는 단계에서) 터진다
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ProblemDetail handleMaxUploadSize(HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONTENT_TOO_LARGE, "파일은 1MB까지 올릴 수 있습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(ImageNotFoundException.class)
    public ProblemDetail handleImageNotFound(ImageNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // 11-4 쿼리 파라미터 여러 개를 한꺼번에 검사한 결과
    @ExceptionHandler(InvalidParametersException.class)
    public ProblemDetail handleInvalidParameters(InvalidParametersException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", ex.getErrors().entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> Map.of("field", e.getKey(), "message", e.getValue()))
                .toList());
        return problem;
    }

    @ExceptionHandler(InvalidPostFieldException.class)
    public ProblemDetail handleInvalidPostField(InvalidPostFieldException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", List.of(Map.of("field", ex.getField(), "message", ex.getMessage())));
        return problem;
    }

    @ExceptionHandler(CommentNotFoundException.class)
    public ProblemDetail handleCommentNotFound(CommentNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidParentCommentException.class)
    public ProblemDetail handleInvalidParentComment(InvalidParentCommentException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(CommentForbiddenException.class)
    public ProblemDetail handleCommentForbidden(CommentForbiddenException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(BookmarkFolderNotFoundException.class)
    public ProblemDetail handleBookmarkFolderNotFound(BookmarkFolderNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(BookmarkNotFoundException.class)
    public ProblemDetail handleBookmarkNotFound(BookmarkNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidBookmarkFolderException.class)
    public ProblemDetail handleInvalidBookmarkFolder(InvalidBookmarkFolderException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(DuplicateBookmarkFolderNameException.class)
    public ProblemDetail handleDuplicateBookmarkFolderName(DuplicateBookmarkFolderNameException ex,
                                                           HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidCursorException.class)
    public ProblemDetail handleInvalidCursor(InvalidCursorException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidSearchConditionException.class)
    public ProblemDetail handleInvalidSearchCondition(InvalidSearchConditionException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(AdminOnlyException.class)
    public ProblemDetail handleAdminOnly(AdminOnlyException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(PostStatusConflictException.class)
    public ProblemDetail handlePostStatusConflict(PostStatusConflictException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(ModerationConflictException.class)
    public ProblemDetail handleModerationConflict(ModerationConflictException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(NotificationNotFoundException.class)
    public ProblemDetail handleNotificationNotFound(NotificationNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(MemberNotFoundException.class)
    public ProblemDetail handleMemberNotFound(MemberNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(SelfFollowNotAllowedException.class)
    public ProblemDetail handleSelfFollow(SelfFollowNotAllowedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(SelfMuteNotAllowedException.class)
    public ProblemDetail handleSelfMute(SelfMuteNotAllowedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(FollowBlockedException.class)
    public ProblemDetail handleFollowBlocked(FollowBlockedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(ReportTargetNotFoundException.class)
    public ProblemDetail handleReportTargetNotFound(ReportTargetNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(SelfReportNotAllowedException.class)
    public ProblemDetail handleSelfReport(SelfReportNotAllowedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(NothingToResolveException.class)
    public ProblemDetail handleNothingToResolve(NothingToResolveException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(DuplicateReportException.class)
    public ProblemDetail handleDuplicateReport(DuplicateReportException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    // 13-5 도배 방지 — 429 + Retry-After(몇 초 뒤에 다시 하면 되는지). 본문에도 같은 값을 싣는다
    @ExceptionHandler(TooManyPostsException.class)
    public ResponseEntity<ProblemDetail> handleTooManyPosts(TooManyPostsException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.TOO_MANY_REQUESTS, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("retryAfterSeconds", ex.getRetryAfterSeconds());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, String.valueOf(ex.getRetryAfterSeconds()))
                .body(problem);
    }

    @ExceptionHandler(PollNotFoundException.class)
    public ProblemDetail handlePollNotFound(PollNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidPollException.class)
    public ProblemDetail handleInvalidPoll(InvalidPollException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", List.of(Map.of("field", ex.getField(), "message", ex.getMessage())));
        return problem;
    }

    @ExceptionHandler(PollConflictException.class)
    public ProblemDetail handlePollConflict(PollConflictException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidPinException.class)
    public ProblemDetail handleInvalidPin(InvalidPinException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        if (ex.getField() != null) {
            problem.setProperty("errors", List.of(Map.of("field", ex.getField(), "message", ex.getMessage())));
        }
        return problem;
    }

    @ExceptionHandler(SeriesNotFoundException.class)
    public ProblemDetail handleSeriesNotFound(SeriesNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(SeriesForbiddenException.class)
    public ProblemDetail handleSeriesForbidden(SeriesForbiddenException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(InvalidBookmarkFieldException.class)
    public ProblemDetail handleInvalidBookmarkField(InvalidBookmarkFieldException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.");
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("errors", List.of(Map.of("field", ex.getField(), "message", ex.getMessage())));
        return problem;
    }

    // 누구인지 모름 — WWW-Authenticate 헤더를 함께 내려준다
    @ExceptionHandler(AuthenticationRequiredException.class)
    public ResponseEntity<ProblemDetail> handleAuthenticationRequired(AuthenticationRequiredException ex,
                                                                       HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .header(HttpHeaders.WWW_AUTHENTICATE, "Bearer")
                .body(problem);
    }

    // 13-3 기간 정지 중 쓰기 — 언제 풀리는지·왜인지를 함께 준다(화면이 안내 문구를 만들 수 있게)
    @ExceptionHandler(MemberSuspendedException.class)
    public ProblemDetail handleMemberSuspended(MemberSuspendedException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("suspendedUntil", ex.getSuspendedUntil());
        problem.setProperty("reason", ex.getReason());
        return problem;
    }

    // 누구인지는 알지만(토큰은 유효) 회원 상태 때문에 안 됨
    @ExceptionHandler(MemberNotActiveException.class)
    public ProblemDetail handleMemberNotActive(MemberNotActiveException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, ex.getMessage());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }
}
```

`src/main/java/org/example/series/SeriesForbiddenException.java`

```java
package org.example.series;

// 남의 시리즈를 고치거나, 남의 글을 내 시리즈에 넣으려 함 — 403
public class SeriesForbiddenException extends RuntimeException {
    public SeriesForbiddenException(String message) {
        super(message);
    }
}
```

`src/main/java/org/example/series/SeriesNotFoundException.java`

```java
package org.example.series;

public class SeriesNotFoundException extends RuntimeException {
    public SeriesNotFoundException() {
        super("시리즈를 찾을 수 없습니다.");
    }
}
```

</details>

### MyBatis 대안 — 시리즈 행·연결 행을 SQL로 다루기

시리즈 생성·소유권 잠금·끝 순서 계산·글 이동은 `SeriesMapper`의 SQL로 처리한다. 글과 작성자는 ID 목록으로 한 번에 가져와 기존 `PostAccessPolicy`를 적용한다. 동일 시리즈의 순서 경쟁은 `series FOR UPDATE`, 같은 글의 이동 경쟁은 `post FOR UPDATE`와 `series_post FOR UPDATE`로 직렬화한다. JPA와 MyBatis가 같은 DataSource/트랜잭션을 쓴다. 아래 접기를 역할별로 열어 실제 코드를 비교한다.

<details>
<summary>MyBatis / 설정 — build.gradle</summary>

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
    implementation 'org.mybatis.spring.boot:mybatis-spring-boot-starter:4.1.0'
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
<summary>MyBatis / 설정 — application.yml</summary>

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

mybatis:
  mapper-locations: classpath:mapper/*.xml
```

</details>

<details>
<summary>MyBatis / DTO — SeriesRow.java</summary>

`src/main/java/org/example/series/SeriesRow.java`

```java
package org.example.series;

// Mapper의 생성 키와 조회 결과를 담는다. API 응답은 SeriesResponse로 따로 만든다.
public class SeriesRow {
    private Long id;
    private Long authorId;
    private String authorNickname;
    private String title;
    private String description;

    public SeriesRow() {
    }

    public SeriesRow(Long authorId, String title, String description) {
        this.authorId = authorId;
        this.title = title;
        this.description = description;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getAuthorId() { return authorId; }
    public void setAuthorId(Long authorId) { this.authorId = authorId; }
    public String getAuthorNickname() { return authorNickname; }
    public void setAuthorNickname(String authorNickname) { this.authorNickname = authorNickname; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
```

</details>

<details>
<summary>MyBatis / Mapper — SeriesMapper.java</summary>

`src/main/java/org/example/series/SeriesMapper.java`

```java
package org.example.series;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface SeriesMapper {
    SeriesRow findById(@Param("id") Long id);
    SeriesRow findByIdForUpdate(@Param("id") Long id);
    Long findSeriesIdByPostId(@Param("postId") Long postId);
    Long findSeriesIdByPostIdForUpdate(@Param("postId") Long postId);
    List<Long> findPostIdsInOrder(@Param("seriesId") Long seriesId);
    int findMaxPosition(@Param("seriesId") Long seriesId);
    void insertSeries(@Param("row") SeriesRow row, @Param("now") LocalDateTime now);
    int deleteByPostId(@Param("postId") Long postId);
    void insertPost(@Param("seriesId") Long seriesId, @Param("postId") Long postId,
                    @Param("position") int position, @Param("now") LocalDateTime now);
    int deleteFromSeries(@Param("seriesId") Long seriesId, @Param("postId") Long postId);
}
```

</details>

<details>
<summary>MyBatis / SQL — SeriesMapper.xml</summary>

`src/main/resources/mapper/SeriesMapper.xml`

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.series.SeriesMapper">
    <resultMap id="seriesRow" type="org.example.series.SeriesRow">
        <id property="id" column="id"/>
        <result property="authorId" column="author_id"/>
        <result property="authorNickname" column="author_nickname"/>
        <result property="title" column="title"/>
        <result property="description" column="description"/>
    </resultMap>

    <sql id="seriesWithAuthor">
        SELECT s.id, s.author_id, m.nickname AS author_nickname, s.title, s.description
          FROM series s JOIN member m ON m.id = s.author_id
         WHERE s.id = #{id}
    </sql>
    <select id="findById" resultMap="seriesRow">
        <include refid="seriesWithAuthor"/>
    </select>
    <select id="findByIdForUpdate" resultMap="seriesRow">
        <include refid="seriesWithAuthor"/> FOR UPDATE
    </select>
    <select id="findSeriesIdByPostId" resultType="long">
        SELECT series_id FROM series_post WHERE post_id = #{postId}
    </select>
    <select id="findSeriesIdByPostIdForUpdate" resultType="long">
        SELECT series_id FROM series_post WHERE post_id = #{postId} FOR UPDATE
    </select>
    <select id="findPostIdsInOrder" resultType="long">
        SELECT post_id FROM series_post WHERE series_id = #{seriesId} ORDER BY position, id FOR SHARE
    </select>
    <select id="findMaxPosition" resultType="int">
        SELECT COALESCE(MAX(position), 0) FROM series_post WHERE series_id = #{seriesId}
    </select>
    <insert id="insertSeries" useGeneratedKeys="true" keyProperty="row.id">
        INSERT INTO series (author_id, title, description, created_at, updated_at)
        VALUES (#{row.authorId}, #{row.title}, #{row.description}, #{now}, #{now})
    </insert>
    <delete id="deleteByPostId">
        DELETE FROM series_post WHERE post_id = #{postId}
    </delete>
    <insert id="insertPost">
        INSERT INTO series_post (series_id, post_id, position, created_at)
        VALUES (#{seriesId}, #{postId}, #{position}, #{now})
    </insert>
    <delete id="deleteFromSeries">
        DELETE FROM series_post WHERE series_id = #{seriesId} AND post_id = #{postId}
    </delete>
</mapper>
```

</details>

<details>
<summary>MyBatis / JPA 조회 — PostRepository.java</summary>

`src/main/java/org/example/post/PostRepository.java`

```java
package org.example.post;

import jakarta.persistence.LockModeType;
import org.example.board.Board;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

// Spring Data JPA가 구현을 만들어 준다(1-3의 메모리 구현을 대체)
public interface PostRepository extends JpaRepository<Post, Long> {

    // MyBatis가 고른 시리즈 글 id를 작성자와 함께 한 번에 읽고 기존 공개 정책을 적용한다.
    @EntityGraph(attributePaths = {"author"})
    @Query("SELECT p FROM Post p WHERE p.id IN :ids")
    List<Post> findSeriesPostsWithAuthor(@Param("ids") Collection<Long> ids);

    // 발행 중 같은 글을 다시 발행하지 않도록 트랜잭션 끝까지 글 행을 잠근다.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Post p WHERE p.id = :id")
    java.util.Optional<Post> findByIdForUpdate(@Param("id") Long id);

    // 6-5: 두 표시의 합집합/교집합을 페이지 적용 전에 DB에서 판정한다.
    @EntityGraph(attributePaths = {"author", "board"})
    @Query(value = """
            SELECT p FROM Post p
            WHERE p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND p.deletedAt IS NULL
              AND NOT EXISTS (SELECT 1 FROM MemberBlock b
                  WHERE (b.blocker.id = :memberId AND b.blocked = p.author)
                     OR (b.blocked.id = :memberId AND b.blocker = p.author))
              AND (:liked = false OR EXISTS (SELECT 1 FROM PostLike l
                  WHERE l.member.id = :memberId AND l.post = p))
              AND (:bookmarked = false OR EXISTS (SELECT 1 FROM Bookmark bm
                  WHERE bm.member.id = :memberId AND bm.post = p))
              AND (EXISTS (SELECT 1 FROM PostLike l
                  WHERE l.member.id = :memberId AND l.post = p)
                   OR EXISTS (SELECT 1 FROM Bookmark bm
                  WHERE bm.member.id = :memberId AND bm.post = p))
            """,
            countQuery = """
            SELECT COUNT(p) FROM Post p
            WHERE p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND p.deletedAt IS NULL
              AND NOT EXISTS (SELECT 1 FROM MemberBlock b
                  WHERE (b.blocker.id = :memberId AND b.blocked = p.author)
                     OR (b.blocked.id = :memberId AND b.blocker = p.author))
              AND (:liked = false OR EXISTS (SELECT 1 FROM PostLike l
                  WHERE l.member.id = :memberId AND l.post = p))
              AND (:bookmarked = false OR EXISTS (SELECT 1 FROM Bookmark bm
                  WHERE bm.member.id = :memberId AND bm.post = p))
              AND (EXISTS (SELECT 1 FROM PostLike l
                  WHERE l.member.id = :memberId AND l.post = p)
                   OR EXISTS (SELECT 1 FROM Bookmark bm
                  WHERE bm.member.id = :memberId AND bm.post = p))
            """)
    Page<Post> findMarkedPosts(@Param("memberId") Long memberId,
                               @Param("liked") boolean liked,
                               @Param("bookmarked") boolean bookmarked,
                               Pageable pageable);

    // 2-3의 "볼 수 있나" 규칙 중 목록에 해당하는 부분을 쿼리로 옮긴 것 — PostAccessPolicy.canView와
    // 같은 규칙이지만, 목록은 PUBLISHED 글만 대상이다(자기 임시저장·운영자 숨김 글도 목록에는 넣지 않는다).
    // 메모리에서 거르지 않고 쿼리에서 걸러야 페이지 크기·totalElements가 맞는다.
    //
    // Page<Post> 대신 List<Post> + 아래 countViewableByBoard를 따로 둔다: Page<>로 받으면
    // Spring Data가 "content 개수 < size면 count 쿼리를 생략"하는 최적화를 적용해서, size=5(꽉 찬
    // 페이지, count 쿼리 나감)와 size=20(13개뿐이라 마지막 페이지, count 쿼리 생략)의 SQL 문장 수가
    // 13과1씩 달라졌다(2-4의 PostListQueryCountTest가 요구하는 "size와 무관하게 문장 수 동일"이 깨짐).
    // count를 항상 명시적으로 실행해 문장 수를 size와 무관하게 고정한다(R2와도 맞다).
    @Query("""
            SELECT p FROM Post p
            JOIN FETCH p.author
            WHERE p.board = :board
              AND p.deletedAt IS NULL
              AND p.status = 'PUBLISHED'
              AND (
                   p.visibility = 'PUBLIC'
                   OR (:viewerId IS NOT NULL AND p.author.id = :viewerId)
                   OR (:viewerId IS NOT NULL AND EXISTS (
                           SELECT 1 FROM Follow f
                           WHERE f.follower.id = :viewerId AND f.followee = p.author))
              )
              AND (
                   :viewerId IS NULL OR NOT EXISTS (
                       SELECT 1 FROM MemberBlock b
                       WHERE (b.blocker.id = :viewerId AND b.blocked = p.author)
                          OR (b.blocked.id = :viewerId AND b.blocker = p.author)
                   )
              )
            """)
    List<Post> findViewableByBoard(@Param("board") Board board,
                                    @Param("viewerId") Long viewerId,
                                    Pageable pageable);

    // findViewableByBoard와 같은 조건의 건수 — 반드시 같이 고친다
    @Query("""
            SELECT COUNT(p) FROM Post p
            WHERE p.board = :board
              AND p.deletedAt IS NULL
              AND p.status = 'PUBLISHED'
              AND (
                   p.visibility = 'PUBLIC'
                   OR (:viewerId IS NOT NULL AND p.author.id = :viewerId)
                   OR (:viewerId IS NOT NULL AND EXISTS (
                           SELECT 1 FROM Follow f
                           WHERE f.follower.id = :viewerId AND f.followee = p.author))
              )
              AND (
                   :viewerId IS NULL OR NOT EXISTS (
                       SELECT 1 FROM MemberBlock b
                       WHERE (b.blocker.id = :viewerId AND b.blocked = p.author)
                          OR (b.blocked.id = :viewerId AND b.blocker = p.author)
                   )
              )
            """)
    long countViewableByBoard(@Param("board") Board board, @Param("viewerId") Long viewerId);

    @Query("""
            SELECT p FROM Post p
            JOIN FETCH p.author a
            JOIN p.board b
            WHERE a.id = :memberId
              AND b.slug = :boardSlug
              AND p.status = 'PUBLISHED'
              AND p.visibility = 'PUBLIC'
              AND p.deletedAt IS NULL
            ORDER BY p.publishedAt DESC, p.id DESC
            """)
    List<Post> findPublicPostsByAuthorAndBoard(@Param("memberId") Long memberId,
                                                @Param("boardSlug") String boardSlug);
    // 4-2: "읽고 +1 해서 저장" 대신 DB가 한 번에 더한다 — 두 요청이 동시에 와도 읽고 쓰는 사이에
    // 끼어들 틈이 없다(갱신 손실 방지). 영속성 컨텍스트를 거치지 않으므로 최신 값은 findLikeCountById로 다시 읽는다.
    @Modifying
    @Query("UPDATE Post p SET p.likeCount = p.likeCount + 1 WHERE p.id = :id")
    int incrementLikeCount(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Post p SET p.likeCount = p.likeCount - 1 WHERE p.id = :id AND p.likeCount > 0")
    int decrementLikeCount(@Param("id") Long id);

    @Query("SELECT p.likeCount FROM Post p WHERE p.id = :id")
    Integer findLikeCountById(@Param("id") Long id);

    // 11-1 내 임시저장 글 — 게시판 slug를 같이 쓰므로 fetch join(글마다 board를 따로 읽지 않는다)
    @Query("""
            SELECT p FROM Post p JOIN FETCH p.board
             WHERE p.author.id = :authorId AND p.status = 'DRAFT' AND p.deletedAt IS NULL
             ORDER BY p.updatedAt DESC, p.id DESC
            """)
    List<Post> findMyDrafts(@Param("authorId") Long authorId);

    // 11-3 조회수 +1 — 4-2의 좋아요 수처럼 DB가 한 문장 안에서 더한다. 다시 읽는 값은 findViewCountById로
    @Modifying
    @Query("UPDATE Post p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
    int incrementViewCount(@Param("id") Long id);

    // REPEATABLE READ의 오래된 읽기 스냅샷 대신 현재 커밋된 값을 본다.
    @Query(nativeQuery = true, value = "SELECT view_count FROM post WHERE id = :id FOR UPDATE")
    Integer findViewCountById(@Param("id") Long id);

    // 11-5 휴지통 — 내가 쓰고 내가 지운 글, since 이후에 지운 것만(30일 안)
    @Query("""
            SELECT p FROM Post p JOIN FETCH p.board
             WHERE p.author.id = :memberId AND p.deletedBy = :memberId
               AND p.deletedAt IS NOT NULL AND p.deletedAt >= :since
             ORDER BY p.deletedAt DESC, p.id DESC
            """)
    List<Post> findMyTrash(@Param("memberId") Long memberId, @Param("since") LocalDateTime since);

    // 5-1: 댓글 저장과 같은 트랜잭션에서 comment_count를 원자적으로 올린다(4-2와 같은 방식)
    @Modifying
    @Query("UPDATE Post p SET p.commentCount = p.commentCount + 1 WHERE p.id = :id")
    int incrementCommentCount(@Param("id") Long id);

    // 5-3: 댓글 삭제와 같은 트랜잭션에서 내린다
    @Modifying
    @Query("UPDATE Post p SET p.commentCount = p.commentCount - 1 WHERE p.id = :id AND p.commentCount > 0")
    int decrementCommentCount(@Param("id") Long id);

    // 8-2: 기간 [from, to) 안의 좋아요×3 + 댓글(삭제 제외)×1. 누적 like_count(어긋날 수 있음)를 쓰지 않고
    // 기간 안의 행을 센다. 글마다 따로 세지 않고 미리 집계한 서브쿼리 두 개를 LEFT JOIN한다.
    // 볼 수 있는 글(비로그인 기준)·점수 > 0·정렬·LIMIT을 모두 DB에서 처리한다.
    @Query(nativeQuery = true, value = """
            SELECT p.id AS postId,
                   p.title AS title,
                   COALESCE(l.cnt, 0) * 3 + COALESCE(c.cnt, 0) AS score,
                   COALESCE(l.cnt, 0) AS likes,
                   COALESCE(c.cnt, 0) AS comments
              FROM post p
              LEFT JOIN (SELECT post_id, COUNT(*) AS cnt
                           FROM post_like
                          WHERE created_at >= :from AND created_at < :to
                          GROUP BY post_id) l ON l.post_id = p.id
              LEFT JOIN (SELECT post_id, COUNT(*) AS cnt
                           FROM comment
                          WHERE deleted_at IS NULL AND created_at >= :from AND created_at < :to
                          GROUP BY post_id) c ON c.post_id = p.id
             WHERE p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND p.deleted_at IS NULL
               AND (l.cnt IS NOT NULL OR c.cnt IS NOT NULL)
             ORDER BY score DESC, p.published_at DESC, p.id DESC
             LIMIT :limit
            """)
    List<PopularPostRow> findPopular(@Param("from") LocalDateTime from,
                                     @Param("to") LocalDateTime to,
                                     @Param("limit") int limit);

    // 12-5 피드 — 작성자가 나이거나 내가 팔로우하는 회원인 게시된 글. 차단 관계(어느 쪽이든)와 내가 뮤트한 회원의 글은 뺀다.
    // 팔로워 공개 글은 따로 걸지 않는다 — 작성자가 나 또는 팔로잉뿐이라 저절로 볼 수 있다.
    // 키셋 커서 (published_at, id). 작성자는 함께 읽고 태그는 batch fetch(2-4)가 묶어 읽는다.
    @Query("""
            SELECT p FROM Post p
            JOIN FETCH p.author a
            WHERE p.deletedAt IS NULL
              AND p.status = 'PUBLISHED'
              AND (a.id = :me OR EXISTS (SELECT 1 FROM Follow f WHERE f.follower.id = :me AND f.followee = a))
              AND NOT EXISTS (SELECT 1 FROM MemberBlock b
                              WHERE (b.blocker.id = :me AND b.blocked = a) OR (b.blocked.id = :me AND b.blocker = a))
              AND NOT EXISTS (SELECT 1 FROM MemberMute m WHERE m.muter.id = :me AND m.muted = a)
              AND (
                   :cursorAt IS NULL
                   OR p.publishedAt < :cursorAt
                   OR (p.publishedAt = :cursorAt AND p.id < :cursorId)
              )
            ORDER BY p.publishedAt DESC, p.id DESC
            """)
    List<Post> findFeed(@Param("me") Long me,
                        @Param("cursorAt") LocalDateTime cursorAt,
                        @Param("cursorId") Long cursorId,
                        Pageable pageable);

    // 13-5 도배 방지 — 이 회원이 from 이후에 쓴, 지우지 않은 글의 작성 시각(최신순). ix_post_author_created를 탄다
    @Query("""
            SELECT p.createdAt FROM Post p
            WHERE p.author.id = :authorId AND p.deletedAt IS NULL AND p.createdAt > :from
            ORDER BY p.createdAt DESC
            """)
    List<LocalDateTime> findRecentCreatedAt(@Param("authorId") Long authorId, @Param("from") LocalDateTime from,
                                            Pageable pageable);
}
```

</details>

<details>
<summary>MyBatis / Controller — SeriesController.java</summary>

`src/main/java/org/example/series/SeriesController.java`

```java
package org.example.series;

import jakarta.validation.Validator;
import org.example.auth.AuthenticatedMember;
import org.example.auth.LoginMember;
import org.example.post.InvalidParametersException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class SeriesController {

    private final SeriesService seriesService;
    private final Validator validator;

    public SeriesController(SeriesService seriesService, Validator validator) {
        this.seriesService = seriesService;
        this.validator = validator;
    }

    @PostMapping("/api/series")
    public ResponseEntity<SeriesResponse> create(@LoginMember AuthenticatedMember loginMember,
                                                 @RequestBody JsonNode body) {
        SeriesCreateRequest.Parsed parsed = SeriesCreateRequest.parse(body);
        Map<String, String> errors = new LinkedHashMap<>(parsed.errors());
        validator.validate(parsed.request()).forEach(v -> errors.putIfAbsent(v.getPropertyPath().toString(), v.getMessage()));
        if (!errors.isEmpty()) {
            throw new InvalidParametersException(errors);
        }
        SeriesResponse response = seriesService.create(loginMember, parsed.request());
        return ResponseEntity.created(URI.create("/api/series/" + response.id())).body(response);
    }

    @GetMapping("/api/series/{seriesId}")
    public SeriesResponse get(@PathVariable Long seriesId, @LoginMember AuthenticatedMember viewer) {
        return seriesService.get(seriesId, viewer);
    }

    @PutMapping("/api/series/{seriesId}/posts/{postId}")
    public SeriesResponse addPost(@PathVariable Long seriesId, @PathVariable Long postId,
                                  @LoginMember AuthenticatedMember loginMember) {
        return seriesService.addPost(seriesId, postId, loginMember);
    }

    @DeleteMapping("/api/series/{seriesId}/posts/{postId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removePost(@PathVariable Long seriesId, @PathVariable Long postId,
                           @LoginMember AuthenticatedMember loginMember) {
        seriesService.removePost(seriesId, postId, loginMember);
    }

    // 시리즈에 없는 글이면 204(본문 없음) — 화면은 "이전/다음" 칸을 그리지 않는다
    @GetMapping("/api/posts/{postId}/series")
    public ResponseEntity<SeriesNavResponse> nav(@PathVariable Long postId, @LoginMember AuthenticatedMember viewer) {
        return seriesService.nav(postId, viewer)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
```

</details>

<details>
<summary>MyBatis / Service — SeriesService.java</summary>

`src/main/java/org/example/series/SeriesService.java`

```java
package org.example.series;

import org.example.auth.AuthenticatedMember;
import org.example.post.AuthorResponse;
import org.example.post.InvalidPostFieldException;
import org.example.post.Post;
import org.example.post.PostAccessPolicy;
import org.example.post.PostNotFoundException;
import org.example.post.PostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

// MyBatis 대안: series/series_post는 SQL Mapper, 글 공개 판정은 기존 PostAccessPolicy를 쓴다.
@Service
public class SeriesService {
    private final SeriesMapper mapper;
    private final PostRepository postRepository;
    private final PostAccessPolicy accessPolicy;
    private final Clock clock;

    public SeriesService(SeriesMapper mapper, PostRepository postRepository,
                         PostAccessPolicy accessPolicy, Clock clock) {
        this.mapper = mapper;
        this.postRepository = postRepository;
        this.accessPolicy = accessPolicy;
        this.clock = clock;
    }

    @Transactional
    public SeriesResponse create(AuthenticatedMember me, SeriesCreateRequest request) {
        String title = request.title().strip();
        if (title.length() < 2 || title.length() > 100) {
            throw new InvalidPostFieldException("title", "시리즈 제목은 2~100자여야 합니다.");
        }
        String description = request.description() == null || request.description().isBlank()
                ? null : request.description().strip();
        SeriesRow row = new SeriesRow(me.id(), title, description);
        mapper.insertSeries(row, LocalDateTime.now(clock));
        return view(requireSeries(row.getId()), me);
    }

    @Transactional
    public SeriesResponse addPost(Long seriesId, Long postId, AuthenticatedMember me) {
        SeriesRow series = findMineForUpdate(seriesId, me);
        // 시리즈 행 잠금으로 이 시리즈의 다음 position을 직렬화하고 글 행 잠금으로 이동을 직렬화한다.
        Post post = postRepository.findByIdForUpdate(postId)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(PostNotFoundException::new);
        if (!post.getAuthor().getId().equals(me.id())) {
            throw new SeriesForbiddenException("내 글만 시리즈에 넣을 수 있습니다.");
        }
        Long current = mapper.findSeriesIdByPostIdForUpdate(postId);
        if (current == null || !current.equals(seriesId)) {
            if (current != null) {
                mapper.deleteByPostId(postId);
            }
            mapper.insertPost(seriesId, postId, mapper.findMaxPosition(seriesId) + 1, LocalDateTime.now(clock));
        }
        return view(series, me);
    }

    @Transactional
    public void removePost(Long seriesId, Long postId, AuthenticatedMember me) {
        findMineForUpdate(seriesId, me);
        mapper.deleteFromSeries(seriesId, postId);
    }

    @Transactional(readOnly = true)
    public SeriesResponse get(Long seriesId, AuthenticatedMember viewer) {
        return view(requireSeries(seriesId), viewer);
    }

    @Transactional(readOnly = true)
    public Optional<SeriesNavResponse> nav(Long postId, AuthenticatedMember viewer) {
        Post post = postRepository.findById(postId).orElseThrow(PostNotFoundException::new);
        if (!accessPolicy.canView(viewer, post)) {
            throw new PostNotFoundException();
        }
        Long seriesId = mapper.findSeriesIdByPostId(postId);
        if (seriesId == null) {
            return Optional.empty();
        }
        SeriesRow series = requireSeries(seriesId);
        List<Post> visible = visiblePosts(seriesId, viewer);
        int i = indexOf(visible, postId);
        SeriesResponse.Item prev = i > 0 ? item(visible.get(i - 1)) : null;
        SeriesResponse.Item next = i >= 0 && i < visible.size() - 1 ? item(visible.get(i + 1)) : null;
        return Optional.of(new SeriesNavResponse(seriesId, series.getTitle(), prev, next));
    }

    private SeriesResponse view(SeriesRow series, AuthenticatedMember viewer) {
        List<SeriesResponse.Item> posts = visiblePosts(series.getId(), viewer).stream().map(this::item).toList();
        return new SeriesResponse(series.getId(), series.getTitle(), series.getDescription(),
                new AuthorResponse(series.getAuthorId(), series.getAuthorNickname()), posts);
    }

    private List<Post> visiblePosts(Long seriesId, AuthenticatedMember viewer) {
        List<Long> ids = mapper.findPostIdsInOrder(seriesId);
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<Long, Post> posts = postRepository.findSeriesPostsWithAuthor(ids).stream()
                .collect(Collectors.toMap(Post::getId, Function.identity()));
        Predicate<Post> viewable = accessPolicy.viewableBy(viewer);
        return ids.stream().map(posts::get).filter(p -> p != null && viewable.test(p)).toList();
    }

    private SeriesRow requireSeries(Long id) {
        SeriesRow row = mapper.findById(id);
        if (row == null) {
            throw new SeriesNotFoundException();
        }
        return row;
    }

    private SeriesRow findMineForUpdate(Long id, AuthenticatedMember me) {
        SeriesRow row = mapper.findByIdForUpdate(id);
        if (row == null) {
            throw new SeriesNotFoundException();
        }
        if (!row.getAuthorId().equals(me.id())) {
            throw new SeriesForbiddenException("내 시리즈만 고칠 수 있습니다.");
        }
        return row;
    }

    private static int indexOf(List<Post> posts, Long postId) {
        for (int i = 0; i < posts.size(); i++) {
            if (posts.get(i).getId().equals(postId)) {
                return i;
            }
        }
        return -1;
    }

    private SeriesResponse.Item item(Post post) {
        return new SeriesResponse.Item(post.getId(), post.getTitle());
    }
}
```

</details>

## 직접 확인

이스프링의 글 12·6(팔로워 공개)·14로 시리즈를 만든다. 김자바는 이스프링을 팔로우하고 있어서 6번이 보이고, 비로그인에게는 안 보인다. 다시 실행하면 새 시리즈를 만들고 같은 글을 그쪽으로 옮긴다.

```bash
BASE=http://localhost:8080
K='Authorization: Bearer tok-kimjava'; L='Authorization: Bearer tok-lee'; J='Content-Type: application/json'
jid() { python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])'; }

SID=$(curl -s -X POST "$BASE/api/series" -H "$L" -H "$J" -d '{"title":"[채점] JPA 연재"}' | jid)       # S1
curl -i -X POST "$BASE/api/series" -H "$L" -H "$J" -d '{"title":"가"}'                                  # S1e 1자 → 400
curl -i -X POST "$BASE/api/series" -H "$L" -H "$J" -d '{"title":null}'                                  # S1b → 400
for p in 12 6 14; do curl -s -o /dev/null -X PUT "$BASE/api/series/$SID/posts/$p" -H "$L"; done          # S2~S4
curl -i -X PUT "$BASE/api/series/$SID/posts/3" -H "$L"                                                  # S6 남의 글 → 403
curl -s "$BASE/api/series/$SID"; echo                                                                   # S7 [12, 14]
curl -s "$BASE/api/series/$SID" -H "$K"; echo                                                           # S8 [12, 6, 14]
curl -s "$BASE/api/posts/12/series"; echo                                                               # S9 next=14
curl -s "$BASE/api/posts/12/series" -H "$K"; echo                                                       # S10 next=6
curl -i "$BASE/api/posts/3/series"                                                                      # S14 204
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "S1",
      "title": "시리즈 만들기",
      "method": "POST",
      "path": "/api/series",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "title": "[채점] JPA 연재",
        "description": null
      }
    },
    {
      "id": "S1a",
      "title": "잘못된 입력 — title 없음",
      "method": "POST",
      "path": "/api/series",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "description": "소개"
      }
    },
    {
      "id": "S1b",
      "title": "잘못된 입력 — title null",
      "method": "POST",
      "path": "/api/series",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "title": null
      }
    },
    {
      "id": "S1c",
      "title": "잘못된 입력 — title 빈 문자열",
      "method": "POST",
      "path": "/api/series",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "title": ""
      }
    },
    {
      "id": "S1d",
      "title": "잘못된 입력 — title 공백만",
      "method": "POST",
      "path": "/api/series",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "title": "   "
      }
    },
    {
      "id": "S1e",
      "title": "잘못된 입력 — title 1자",
      "method": "POST",
      "path": "/api/series",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "title": "가"
      }
    },
    {
      "id": "S1f",
      "title": "잘못된 입력 — title 앞뒤 공백 자르면 1자",
      "method": "POST",
      "path": "/api/series",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "title": " 가 "
      }
    },
    {
      "id": "S1g",
      "title": "잘못된 입력 — title 101자",
      "method": "POST",
      "path": "/api/series",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "title": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"
      }
    },
    {
      "id": "S1h",
      "title": "잘못된 입력 — description 501자",
      "method": "POST",
      "path": "/api/series",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "title": "정상 제목",
        "description": "나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나"
      }
    },
    {
      "id": "S1i",
      "title": "잘못된 입력 — title 자리에 배열",
      "method": "POST",
      "path": "/api/series",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "title": [
          "가나"
        ]
      }
    },
    {
      "id": "S1j",
      "title": "잘못된 입력 — JSON이 아님",
      "method": "POST",
      "path": "/api/series",
      "headers": {
        "Authorization": "Bearer tok-lee",
        "Content-Type": "application/json"
      },
      "body": "title=연재"
    },
    {
      "id": "S1k",
      "title": "경계값 안쪽 — title 2자·description 500자",
      "method": "POST",
      "path": "/api/series",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "title": "연재",
        "description": "나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나"
      }
    },
    {
      "id": "S1l",
      "title": "경계값 안쪽 — title 100자",
      "method": "POST",
      "path": "/api/series",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "title": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"
      }
    },
    {
      "id": "S1m",
      "title": "토큰 없이 만들기",
      "method": "POST",
      "path": "/api/series",
      "body": {
        "title": "토큰 없음"
      }
    },
    {
      "id": "S1n",
      "title": "앞뒤 공백을 지우면 제목 100자·소개 500자",
      "method": "POST",
      "path": "/api/series",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "title": " aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa ",
        "description": " bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb "
      }
    },
    {
      "id": "S1o",
      "title": "숫자 제목·불리언 소개는 문자열이 아니다",
      "method": "POST",
      "path": "/api/series",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "title": 12,
        "description": true
      }
    },
    {
      "id": "S1p",
      "title": "배열 소개는 문자열이 아니다",
      "method": "POST",
      "path": "/api/series",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "title": "연재",
        "description": [
          "x"
        ]
      }
    },
    {
      "id": "S1q",
      "title": "제목 공백·소개 501자 오류를 함께 반환",
      "method": "POST",
      "path": "/api/series",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "title": " ",
        "description": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    },
    {
      "id": "S1r",
      "title": "공백뿐인 소개는 null",
      "method": "POST",
      "path": "/api/series",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "title": "공백 소개",
        "description": "   "
      }
    },
    {
      "id": "S1s",
      "title": "제목 타입 오류와 소개 길이 오류를 함께 반환",
      "method": "POST",
      "path": "/api/series",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "title": 42,
        "description": "나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나"
      }
    },
    {
      "id": "S1t",
      "title": "제목 길이 오류와 소개 타입 오류를 함께 반환",
      "method": "POST",
      "path": "/api/series",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "title": "가",
        "description": 17
      }
    },
    {
      "id": "S2",
      "title": "12번 넣기",
      "method": "PUT",
      "path": "/api/series/{{S1.body.id}}/posts/12",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "S3",
      "title": "6번(팔로워 공개) 넣기",
      "method": "PUT",
      "path": "/api/series/{{S1.body.id}}/posts/6",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "S4",
      "title": "14번 넣기",
      "method": "PUT",
      "path": "/api/series/{{S1.body.id}}/posts/14",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "S4b",
      "title": "이미 같은 시리즈에 있는 14번 다시 넣기",
      "method": "PUT",
      "path": "/api/series/{{S1.body.id}}/posts/14",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "S5",
      "title": "남의 시리즈에 넣기(김자바)",
      "method": "PUT",
      "path": "/api/series/{{S1.body.id}}/posts/3",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "S6",
      "title": "남의 글(3번, 박디비)을 내 시리즈에",
      "method": "PUT",
      "path": "/api/series/{{S1.body.id}}/posts/3",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "S6b",
      "title": "없는 글",
      "method": "PUT",
      "path": "/api/series/{{S1.body.id}}/posts/999999",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "S6c",
      "title": "글 id 자리에 문자",
      "method": "PUT",
      "path": "/api/series/{{S1.body.id}}/posts/abc",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "S6d",
      "title": "삭제된 내 글(8번)",
      "method": "PUT",
      "path": "/api/series/{{S1.body.id}}/posts/8",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "S6e",
      "title": "없는 시리즈",
      "method": "PUT",
      "path": "/api/series/999999/posts/12",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "S7",
      "title": "시리즈 보기(비로그인)",
      "method": "GET",
      "path": "/api/series/{{S1.body.id}}"
    },
    {
      "id": "S8",
      "title": "시리즈 보기(김자바 — 이스프링을 팔로우)",
      "method": "GET",
      "path": "/api/series/{{S1.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "S9",
      "title": "12번의 이전/다음(비로그인)",
      "method": "GET",
      "path": "/api/posts/12/series"
    },
    {
      "id": "S10",
      "title": "12번의 이전/다음(김자바)",
      "method": "GET",
      "path": "/api/posts/12/series",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "S11",
      "title": "14번의 이전/다음(비로그인)",
      "method": "GET",
      "path": "/api/posts/14/series"
    },
    {
      "id": "S12",
      "title": "6번 빼기",
      "method": "DELETE",
      "path": "/api/series/{{S1.body.id}}/posts/6",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "S13",
      "title": "뺀 뒤 12번의 이전/다음(김자바)",
      "method": "GET",
      "path": "/api/posts/12/series",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "S14",
      "title": "시리즈에 없는 글(3번)",
      "method": "GET",
      "path": "/api/posts/3/series"
    },
    {
      "id": "S15",
      "title": "삭제된 글(8번)",
      "method": "GET",
      "path": "/api/posts/8/series"
    },
    {
      "id": "S16",
      "title": "14번을 다른 시리즈로 옮기기",
      "method": "PUT",
      "path": "/api/series/{{S1k.body.id}}/posts/14",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "S17",
      "title": "옮긴 뒤 처음 시리즈(비로그인)",
      "method": "GET",
      "path": "/api/series/{{S1.body.id}}"
    },
    {
      "id": "S18",
      "title": "옮긴 뒤 14번의 시리즈",
      "method": "GET",
      "path": "/api/posts/14/series"
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "S1",
      "expect": {
        "status": 201,
        "headers": {
          "Location": {
            "endsWith": "/api/series/{{S1.body.id}}"
          }
        },
        "json": [
          {
            "path": "$.title",
            "equals": "[채점] JPA 연재"
          },
          {
            "path": "$.description",
            "type": "null"
          },
          {
            "path": "$.author.id",
            "equals": 3
          },
          {
            "path": "$.posts",
            "length": 0
          }
        ]
      }
    },
    {
      "id": "C2",
      "all": [
        {
          "request": "S1a",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "title"
              }
            ]
          }
        },
        {
          "request": "S1b",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "title"
              }
            ]
          }
        },
        {
          "request": "S1c",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "title"
              }
            ]
          }
        },
        {
          "request": "S1d",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "title"
              }
            ]
          }
        },
        {
          "request": "S1e",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "title"
              }
            ]
          }
        },
        {
          "request": "S1f",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "title"
              }
            ]
          }
        },
        {
          "request": "S1g",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "title"
              }
            ]
          }
        },
        {
          "request": "S1i",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "title"
              }
            ]
          }
        }
      ],
      "note": "title이 없음·null·빈 값·공백만·1자·자르면 1자·101자·배열이면 400이고 errors에 title — 500·201이 아니다"
    },
    {
      "id": "C3",
      "all": [
        {
          "request": "S1h",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "description"
              }
            ]
          }
        },
        {
          "request": "S1j",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "S1m",
          "expect": {
            "status": 401
          }
        }
      ]
    },
    {
      "id": "C4",
      "all": [
        {
          "request": "S1k",
          "expect": {
            "status": 201,
            "json": [
              {
                "path": "$.title",
                "equals": "연재"
              }
            ]
          }
        },
        {
          "request": "S1l",
          "expect": {
            "status": 201
          }
        }
      ],
      "note": "경계값 바로 안쪽(2자·100자·소개 500자)은 성공한다"
    },
    {
      "id": "C5",
      "all": [
        {
          "request": "S2",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "S3",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "S4",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.posts[*].postId",
                "equals": [
                  12,
                  6,
                  14
                ]
              }
            ]
          }
        }
      ],
      "note": "작성자 본인에게는 팔로워 공개 글(6번)도 보인다"
    },
    {
      "id": "C6",
      "all": [
        {
          "request": "S5",
          "expect": {
            "status": 403
          }
        },
        {
          "request": "S6",
          "expect": {
            "status": 403
          }
        }
      ]
    },
    {
      "id": "C7",
      "all": [
        {
          "request": "S6b",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "S6c",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "S6d",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "S6e",
          "expect": {
            "status": 404
          }
        }
      ]
    },
    {
      "id": "C8",
      "all": [
        {
          "request": "S7",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.posts[*].postId",
                "equals": [
                  12,
                  14
                ]
              }
            ]
          }
        },
        {
          "request": "S8",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.posts[*].postId",
                "equals": [
                  12,
                  6,
                  14
                ]
              }
            ]
          }
        }
      ],
      "note": "같은 시리즈도 보는 사람마다 목록이 다르다 — 비로그인에게는 팔로워 공개 글이 빠진다"
    },
    {
      "id": "C9",
      "all": [
        {
          "request": "S9",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.prev",
                "type": "null"
              },
              {
                "path": "$.next.postId",
                "equals": 14
              },
              {
                "path": "$.seriesId",
                "equals": "{{S1.body.id}}"
              }
            ]
          }
        },
        {
          "request": "S10",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.next.postId",
                "equals": 6
              }
            ]
          }
        },
        {
          "request": "S11",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.prev.postId",
                "equals": 12
              },
              {
                "path": "$.next",
                "type": "null"
              }
            ]
          }
        }
      ],
      "note": "이전/다음은 볼 수 없는 글을 건너뛴다"
    },
    {
      "id": "C10",
      "all": [
        {
          "request": "S12",
          "expect": {
            "status": 204
          }
        },
        {
          "request": "S13",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.next.postId",
                "equals": 14
              }
            ]
          }
        }
      ],
      "note": "뺀 자리(빈 번호)가 있어도 다음 글을 찾는다"
    },
    {
      "id": "C11",
      "all": [
        {
          "request": "S14",
          "expect": {
            "status": 204
          }
        },
        {
          "request": "S15",
          "expect": {
            "status": 404
          }
        }
      ]
    },
    {
      "id": "C12",
      "all": [
        {
          "request": "S16",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.posts[*].postId",
                "equals": [
                  14
                ]
              }
            ]
          }
        },
        {
          "request": "S17",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.posts[*].postId",
                "equals": [
                  12
                ]
              }
            ]
          }
        },
        {
          "request": "S18",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.seriesId",
                "equals": "{{S1k.body.id}}"
              }
            ]
          }
        }
      ],
      "note": "글 하나는 시리즈 하나에만 — 다른 시리즈에 넣으면 옮겨진다"
    },
    {
      "id": "C13",
      "all": [
        {
          "request": "S1n",
          "expect": {
            "status": 201,
            "json": [
              {
                "path": "$.title",
                "equals": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
              },
              {
                "path": "$.description",
                "equals": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
              }
            ]
          }
        },
        {
          "request": "S1o",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "title"
              },
              {
                "path": "$.errors[*].field",
                "contains": "description"
              }
            ]
          }
        },
        {
          "request": "S1p",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "description"
              }
            ]
          }
        },
        {
          "request": "S1q",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "title"
              },
              {
                "path": "$.errors[*].field",
                "contains": "description"
              }
            ]
          }
        },
        {
          "request": "S1r",
          "expect": {
            "status": 201,
            "json": [
              {
                "path": "$.description",
                "type": "null"
              }
            ]
          }
        },
        {
          "request": "S1s",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "title"
              },
              {
                "path": "$.errors[*].field",
                "contains": "description"
              }
            ]
          }
        },
        {
          "request": "S1t",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "title"
              },
              {
                "path": "$.errors[*].field",
                "contains": "description"
              }
            ]
          }
        }
      ],
      "note": "공백 제거 후 길이, 원문 JSON 문자열 타입, 다중 필드 오류"
    },
    {
      "id": "C14",
      "all": [
        {
          "request": "S4b",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.posts[*].postId",
                "equals": [
                  12,
                  6,
                  14
                ]
              }
            ]
          }
        }
      ],
      "note": "같은 글을 같은 시리즈에 다시 넣어도 순서·행을 늘리지 않는다"
    },
    {
      "id": "C15",
      "manual": "같은 시리즈에 서로 다른 글을 동시에 넣고, 같은 글을 서로 다른 시리즈에 동시에 옮긴다. 모든 요청 200, series_post의 post_id는 1행, 각 시리즈의 position은 중복되지 않아야 한다."
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). `{SID}`는 S1 응답의 id다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | S1 | `201`, `Location`이 `/api/series/{SID}`로 끝남, `description`=`null`, 작성자 3, 글 0개 |
| C2 | S1a~S1g·S1i(title 없음·null·빈 값·공백만·1자·자르면 1자·101자·배열) | 모두 `400`, `errors`에 `title` — 500·201이 아니다 |
| C3 | S1h / S1j / S1m | `400`(`errors`에 `description`) / `400`(JSON이 아님) / `401` |
| C4 | S1k / S1l | `201` / `201` — 경계값 바로 안쪽(제목 2자·소개 500자, 제목 100자) |
| C5 | S2~S4 | `200`, 작성자에게는 `[12, 6, 14]` |
| C6 | S5 / S6 | `403`(남의 시리즈) / `403`(남의 글) |
| C7 | S6b / S6c / S6d / S6e | `404` / `400` / `404`(삭제된 글) / `404`(없는 시리즈) |
| C8 | S7 / S8 | 비로그인 `[12, 14]` / 김자바 `[12, 6, 14]` |
| C9 | S9 / S10 / S11 | 비로그인 12번: `prev`=`null`·`next`=14 / 김자바 12번: `next`=6 / 비로그인 14번: `prev`=12·`next`=`null` |
| C10 | S12 / S13 | `204` / 김자바 12번의 `next`=14 — 빈 번호를 건너뛴다 |
| C11 | S14 / S15 | `204`(시리즈에 없는 글) / `404`(삭제된 글) |
| C12 | S16 / S17 / S18 | 14번을 다른 시리즈로 옮김: 새 시리즈 `[14]`, 처음 시리즈(비로그인) `[12]`, 14번의 `seriesId`=새 시리즈 |
| D1 | `SELECT COUNT(*) FROM series_post WHERE post_id = 14` | `1` — 옮기기는 행을 하나만 남긴다 |
| D2 | `SELECT COUNT(*) FROM series_post WHERE series_id = {SID} AND post_id = 14` (S4b 직후) | `1` — 다시 넣어도 중복되지 않는다 |
| C13 | S1n~S1t | 공백 제거 후 100/500자 성공, 원문 JSON 타입 오류와 다중 필드 오류는 `400`, 공백 소개는 `null` |
| C14 | S4b | `200`, 순서 `[12,6,14]` 유지 |
| C15 | 동시 PUT 두 종류(수동 확인) | 모두 `200`, 글 하나는 한 행, 시리즈 내 순서 중복 없음 |
| D2 | `SELECT post_id, position FROM series_post WHERE series_id = {SID} ORDER BY position` | `12, 1` 한 줄 — 6은 뺐고 14는 옮겼다 |
| D3 | `SELECT COUNT(*) FROM series WHERE title IN ('가', '')` | `0` — 잘못된 입력은 아무것도 만들지 않았다 |
| R1 | 이전/다음 | 번호 ±1이 아니라 "볼 수 있는 글을 순서대로 늘어놓고 앞뒤"로 찾는다. 2-3 규칙(`PostAccessPolicy`)을 다시 쓴다 |
| R2 | 옮기기 | 옛 행 삭제와 새 행 추가가 한 트랜잭션이다. `UNIQUE(post_id)` 때문에 삭제가 먼저 DB에 반영돼야 한다(Hibernate는 flush 때 INSERT를 DELETE보다 먼저 보낸다 — `flush()`로 순서를 정한다) |
| R3 | 소유자 | 시리즈와 글 모두 "내 것"인지 확인한다. 하나만 보면 남의 글을 내 시리즈에 넣거나, 남의 시리즈에 내 글을 넣을 수 있다 |
| R4 | 제목 검증 | `@Size`는 공백을 포함한 길이를 본다(`" 가 "`는 3자로 통과). 자른 뒤의 길이를 서비스에서 다시 확인한다 |

## 필요한 지식

- [G2 레슨 — 접근 규칙을 한 곳에](../../lessons/G2-access-rules-in-one-place.md) — 이전/다음도 같은 규칙
- [F1 레슨 — 검증과 오류 응답](../../lessons/F1-validation-errors.md)
- [W10 — 각 층에서 확인할 것](../../docs/knowledge/W10-where-to-validate.md#각-층에서-확인할-것) — DTO(`@Size`)와 서비스(자른 길이)가 나눠 보는 것
- [D11 — 인증과 인가](../../docs/knowledge/D11-web-security-basics.md#32-인증과-인가-신원-확인-후-객체까지-확인) — 객체(시리즈·글)마다 소유자 확인
- [S08 트랜잭션](../../docs/knowledge/S08-transactions.md) — 옮기기를 한 트랜잭션으로
- [E4 레슨 — JPA 연관관계](../../lessons/E4-jpa-associations.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 이전/다음 찾기</summary>

시리즈의 글을 `ORDER BY position`으로 글·작성자까지 한 번에 읽고(fetch join), `accessPolicy.viewableBy(viewer)`로 거른 목록에서 내 글의 위치 `i`를 찾는다. `prev`는 `i - 1`, `next`는 `i + 1`(범위 밖이면 `null`). 시리즈가 아주 길다면(수백 편) `WHERE series_id = ? AND position < ? ORDER BY position DESC LIMIT 1` 같은 이웃 쿼리를 생각할 수 있지만, 그때도 "볼 수 없는 글 건너뛰기"를 SQL로 옮겨야 한다.
</details>

<details>
<summary>힌트 2 — 옮기기에서 UNIQUE 위반이 날 때</summary>

`delete(old)` 다음에 `save(new)`를 부르면, 커밋 때 Hibernate가 INSERT를 먼저 보내서 `Duplicate entry … for key 'uk_series_post_post'`가 난다. 지운 직후 `flush()`를 불러 DELETE를 먼저 DB에 보낸다.
</details>

## 다음 단계

[14-5. 최근 본 글](14-5-recent-views.md)
