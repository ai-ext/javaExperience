# 10-5. 게시글 작성 — JPA, 검증 규칙·태그·작성자는 토큰 주인

## 상황

명세서의 게시글 작성 줄을 그대로 옮긴다.

| API | 규칙 | 성공 | 실패 |
|---|---|---|---|
| `POST /api/v1/posts` | 토큰 필수. `title` 5~100자(앞뒤 공백 제거 후), `content` 없어도 됨(최대 10000자), `tags` 0~5개(각 1~20자, 소문자로, 중복 제거), `visibility` 기본 `PUBLIC`. 작성자 = 토큰 주인 | 201 + `Location`, `data` = 상세 | 400, 401 |

규칙 칸에 "다듬기"가 섞여 있다. 공백 제거, 소문자, 중복 제거, 기본값이다. **다듬은 다음에 검사한다**는 순서가 중요하다. `"  abc  "`는 7글자지만 다듬으면 3글자라 400이다. `["Java", "java"]`는 태그 두 개가 아니라 하나다.

쓰기는 JPA로 한다. 처음으로 엔티티끼리의 **연관관계**를 쓴다. 글 → 작성자는 다대일(`@ManyToOne`), 글 ↔ 태그는 다대다(`@ManyToMany`, 연결 테이블 `post_tags`)다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글쓰기 화면",
  "summary": "제목·본문·태그·공개 범위를 넣고 저장한다. 작성자는 화면이 보내지 않는다 — 서버가 토큰에서 꺼낸다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "새 글 쓰기", "right": "김자바" },
    { "type": "field", "id": "title", "label": "제목", "value": "  [채점] 10-5 첫 글  " },
    { "type": "field", "id": "content", "label": "본문", "value": "JPA로 저장한 글", "multiline": true },
    { "type": "chips", "id": "tags", "label": "태그", "items": ["API", "api", " Check "] },
    { "type": "select", "id": "visibility", "label": "공개 범위", "value": "(고르지 않음 → 전체 공개)" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "save", "label": "저장", "variant": "primary" }] },
    { "type": "toast", "id": "toast", "value": "로그인이 필요해요", "tone": "error" }
  ],
  "flows": [
    {
      "name": "저장",
      "steps": [
        { "kind": "user", "text": "칸을 채우고 [저장]", "focus": ["title", "content", "tags", "save"] },
        { "kind": "request", "method": "POST", "path": "/api/v1/posts", "headers": ["Authorization: Bearer eyJ...", "Content-Type: application/json"], "body": "{\n  \"title\": \"  [채점] 10-5 첫 글  \",\n  \"content\": \"JPA로 저장한 글\",\n  \"tags\": [\"API\", \"api\", \" Check \"]\n}" },
        { "kind": "server", "text": "인터셉터 → userId=1. PostRequest 압축 생성자가 다듬는다: 제목 strip, 태그 [api, check], 공개 범위 PUBLIC. 그다음 @Valid" },
        { "kind": "db", "sql": "SELECT * FROM tags WHERE name = 'api';      -- 없으면\nINSERT INTO tags (name) VALUES ('api');\nINSERT INTO posts (author_id, title, content, visibility, ...) VALUES (1, '[채점] 10-5 첫 글', ...);\nINSERT INTO post_tags (post_id, tag_id) VALUES (26, 7), (26, 8);" },
        { "kind": "response", "status": 201, "headers": ["Location: /api/v1/posts/26"], "body": "{\n  \"status\": 201,\n  \"message\": \"Created\",\n  \"data\": {\n    \"id\": 26,\n    \"title\": \"[채점] 10-5 첫 글\",\n    \"visibility\": \"PUBLIC\",\n    \"author\": { \"id\": 1, \"nickname\": \"김자바\" },\n    \"tags\": [\"api\", \"check\"],\n    ...\n  }\n}" },
        { "kind": "screen", "text": "Location의 주소로 상세 화면으로 이동한다(10-6)", "focus": ["bar"] }
      ]
    },
    {
      "name": "로그인 안 하고 저장",
      "steps": [
        { "kind": "user", "text": "(토큰이 없는 상태로) [저장]", "focus": ["save"] },
        { "kind": "request", "method": "POST", "path": "/api/v1/posts", "headers": ["Content-Type: application/json"], "body": "{\"title\": \"[채점] 익명 글\"}" },
        { "kind": "server", "text": "인터셉터가 컨트롤러보다 먼저 막는다 — 본문은 읽지도 않는다" },
        { "kind": "response", "status": 401, "headers": ["WWW-Authenticate: Bearer"], "body": "{ \"status\": 401, \"code\": \"UNAUTHORIZED\", ... }" },
        { "kind": "screen", "text": "화면이 버튼을 막지 않았어도 서버가 막는다", "focus": ["toast"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 엔티티 | `Post`(`posts`) — 작성자 `@ManyToOne(fetch = LAZY)`, 태그 `@ManyToMany` + `@JoinTable(name = "post_tags")`, 공개 범위 `@Enumerated(EnumType.STRING)`. `Tag`(`tags`), `Visibility` enum(`PUBLIC`·`PRIVATE`) |
| 메서드·경로 | `POST /api/v1/posts`, 로그인 필수(`@LoginUser Long userId`) |
| 요청 | `title`·`content`·`tags`·`visibility`. **작성자 필드는 받지 않는다** — 본문에 `authorId`가 와도 무시 |
| 다듬기 → 검증 | 제목 앞뒤 공백 제거 → 5~100자 · 본문 ≤ 10000자(없어도 됨) · 태그: 각각 공백 제거·소문자 → 중복 제거 → 0~5개, 각 1~20자 · 공개 범위: 없으면 `PUBLIC`, `PUBLIC`·`PRIVATE` 말고는 400 |
| 태그 저장 | 이름으로 찾고 없으면 만든다(`tags.name`은 UNIQUE). 같은 이름의 태그 행을 또 만들지 않는다 |
| 성공 | `201`, `Location: /api/v1/posts/{id}`, `data` = 상세 모양 — `id`, `title`, `content`, `visibility`, `viewCount`, `likeCount`, `author{id, nickname}`, `tags`(이름순), `createdAt`, `updatedAt` |
| 실패 | 토큰 없음·틀림 401(본문이 깨져 있어도 401) · 규칙 위반 400 `VALIDATION_FAILED`(목록 원소 오류는 `field`가 `tags[0]`처럼) · 깨진 JSON 400 `BAD_JSON` |

10-6에서 상세 응답에 `liked`와 `comments`가 더해진다. 그때 작성 응답도 같은 모양(`liked: false`, `comments: []`)으로 맞춘다.

**필드 규칙** — 다듬은 뒤 검사한다. 잘못된 입력은 저장 전에 막고 `500`이 나면 안 된다

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `title` | 필수 | 안 됨 — 없음·`null` 거절, 공백만은 다듬으면 0자라 거절 | 앞뒤 공백 제거 뒤 5~100자(5자·100자 성공, 4자·101자 거절) | 문자열 | 없음 | `400 VALIDATION_FAILED`, `errors`에 `title` |
| `content` | 선택 | 생략·`null` 허용(`null`로 저장), `""`도 받는다 | 10000자 이하(10001자는 거절) | 문자열 | `null` | `400`, `errors`에 `content` |
| `tags` | 선택 | 생략·`null`이면 `[]`. 원소가 `null`·공백만이면 거절 | 다듬고 중복 제거한 뒤 0~5개, 각 1~20자(20자 성공, 21자 거절) | 문자열 배열 | `[]` | `400`, `errors`에 `tags`(개수) 또는 `tags[0]`(원소) · 배열 자리에 문자열이면 `400 BAD_JSON` |
| `visibility` | 선택 | 생략·`null`이면 `PUBLIC` | `PUBLIC`·`PRIVATE`(대소문자 그대로 — `public`은 거절) | 정해진 값 | `PUBLIC` | `400`, `errors`에 `visibility` |
| 본문 전체 | 필수 | — | — | JSON | — | `400 BAD_JSON`(토큰이 없으면 그보다 먼저 `401`) |

## 설계 포인트

- **작성자는 토큰에서.** 요청 본문으로 작성자를 받으면 남의 이름으로 글을 쓸 수 있다. 요청 record에 `authorId` 필드를 아예 만들지 않으면, JSON에 그 키가 와도 Jackson이 버린다.
- **다듬기는 record 압축 생성자에서.** JSON → record 변환 때 압축 생성자가 먼저 돌고, `@Valid`는 그 결과를 검사한다(10-3의 이메일과 같다). 서비스에서 다듬으면 검사는 다듬기 전 값으로 하게 된다.
- **목록 원소 검증.** `List<@Size(min = 1, max = 20) String> tags`처럼 타입 인자에 애노테이션을 붙이면 원소마다 검사한다. 실패 필드 이름은 `tags[1]`이 된다. `@Size(max = 5)`를 목록 자체에 붙이면 개수를 본다.
- **`LAZY`.** 글을 읽을 때 작성자까지 매번 읽지 않게 기본을 지연 로딩으로 둔다. 필요할 때 한 번에 가져오는 법은 10-6에서 다룬다.
- **`@Enumerated(EnumType.STRING)`.** 기본값(`ORDINAL`)은 enum의 순번(0, 1)을 저장한다. 테이블은 `ENUM('PUBLIC','PRIVATE')` 문자열이라 반드시 `STRING`이다.
- **같은 이름 태그를 동시에 처음 만들면?** 두 요청이 동시에 "없다"를 보고 둘 다 INSERT하면 UNIQUE 위반으로 한쪽이 500이 난다. 이 단계에서는 넘어가지만, 실무에서는 생긴다(티켓 T-018에서 다룬다).

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 인터셉터 → userId=1. PostRequest 압축 생성자가 다듬는다: 제목 strip, 태그 [api, check], 공개 범위 PUBLIC. 그다음 @Valid
- 인터셉터가 컨트롤러보다 먼저 막는다 — 본문은 읽지도 않는다

<details>
<summary>Controller — HTTP 연결</summary>

`PostController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@PostMapping("/api/v1/posts")`. 변경된 메서드: `create`.

```java
@PostMapping("/api/v1/posts")
public ResponseEntity<ApiResponse<PostResponse>> create(
        @LoginUser Long userId, @Valid @RequestBody PostCreateRequest request) {
    PostResponse created = postService.create(userId, request);
    return ResponseEntity.created(URI.create("/api/v1/posts/" + created.id()))
            .body(ApiResponse.created(created));
}
```

작성자 id는 JSON이 아니라 `@LoginUser`에서 온다. 인증 인터셉터가 먼저 실행되므로 토큰이 없는 요청은 본문이 깨져 있어도 401이다.

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`AuthorResponse.java`, `PostCreateRequest.java`, `PostResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다. 변경된 메서드: `from`.

```java
public PostCreateRequest {
    title = title == null ? null : title.strip();
    tags = tags == null ? List.of() : tags.stream()
            .map(t -> Objects.requireNonNullElse(t, "").strip().toLowerCase(Locale.ROOT))
            .distinct().toList();
    visibility = visibility == null ? "PUBLIC" : visibility;
}
```

이 압축 생성자가 다듬은 뒤 `@Valid`가 제목 5~100자, 태그 0~5개·원소 1~20자, 본문 10000자, 공개 범위를 검사한다. `PostResponse.from`은 작성자 DTO와 이름순 태그를 만들며 해시를 내보내지 않는다. 어노테이션과 응답 필드 전문은 아래 DTO 접기에서 확인한다.

</details>

<details>
<summary>Service — 처리 순서</summary>

`PostService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `create`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

```java
@Transactional
public PostResponse create(Long userId, PostCreateRequest request) {
    User author = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED));
    Post post = new Post(author, request.title(), request.content(),
            Visibility.valueOf(request.visibility()), findOrCreateTags(request.tags()));
    postRepository.save(post);
    return PostResponse.from(post);
}
```

작성자 조회, 태그 조회·생성, 글과 연결 테이블 저장이 한 트랜잭션에 들어간다.

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`PostRepository.java`, `TagRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다.

```java
public interface PostRepository extends JpaRepository<Post, Long> {
}

public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findByName(String name);
}
```

`findByName`으로 먼저 찾고 없을 때만 저장한다. 마지막 중복 방어선은 V1 스키마의 `tags.name UNIQUE`다.

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Post.java`, `Tag.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다.

```java
@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "author_id")
private User author;

@ManyToMany
@JoinTable(name = "post_tags",
        joinColumns = @JoinColumn(name = "post_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id"))
private Set<Tag> tags = new LinkedHashSet<>();
```

JPA가 `posts.author_id`와 `post_tags` 연결 행을 저장한다. `Visibility`는 `@Enumerated(EnumType.STRING)`으로 DB의 문자열 값과 맞춘다.

</details>

<details>
<summary>설정·보조 코드</summary>

`Visibility.java`. 이 파일에서 바뀐 설정·보조 타입이 서버 흐름의 어느 단계에 필요한지 확인한다.

```java
public enum Visibility {
    PUBLIC, PRIVATE
}
```

요청의 문자열은 검증을 통과한 뒤 `Visibility.valueOf`로 변환한다.

</details>

<details>
<summary>MyBatis / Mapper — 글·태그·연결 행을 직접 저장하기</summary>

선택 경로에서는 JPA Repository와 엔티티 매핑 대신 `PostMapper` SQL을 쓴다. Controller와 요청·응답 DTO는 그대로 두고, Service의 한 `@Transactional` 안에서 작성자 조회 → 태그 조회/생성 → 글 INSERT → `post_tags` INSERT를 수행한다. 글과 새 태그의 id는 `useGeneratedKeys`로 받아 다음 INSERT에 쓴다.

```xml
<insert id="insertPost" useGeneratedKeys="true" keyProperty="id">
    INSERT INTO posts (author_id, title, content, visibility, view_count, like_count, created_at, updated_at, deleted_at)
    VALUES (#{author.id}, #{title}, #{content}, #{visibility}, 0, 0, #{createdAt}, #{updatedAt}, NULL)
</insert>
<insert id="linkTag">
    INSERT INTO post_tags (post_id, tag_id) VALUES (#{postId}, #{tagId})
</insert>
```

`#{...}`는 값 바인딩이다. 아래 **MyBatis 대체 구현 코드**에는 10-4의 가입·로그인 Mapper까지 포함해, 10-5 스냅샷에서 JPA를 교체할 15개 파일의 전문이 있다. 격리 DB에서 같은 C1~C9·D1·D2를 통과한 코드다.

</details>

## 직접 확인

```bash
BASE=http://localhost:8080
TOKEN=$(curl -s -X POST "$BASE/api/v1/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"kim@example.com","password":"password1234"}' | sed -E 's/.*"accessToken":"([^"]+)".*/\1/')
post() { curl -s -i -X POST "$BASE/api/v1/posts" -H 'Content-Type: application/json' "$@"; echo; echo ----; }

post -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"  [채점] 10-5 첫 글  ","content":"JPA로 저장한 글","tags":["API","api"," Check "],"authorId":3}'   # P 정상(authorId 무시)
post -H "Authorization: Bearer $TOKEN" -d '{"title":"[채점] 10-5 비공개","visibility":"PRIVATE"}'          # R 비공개·태그 없음
post -d '{"title":"[채점] 10-5 익명"}'                                                                   # N 토큰 없음
post -d '{"title":'                                                                                    # NJ 토큰 없음 + 깨진 본문
post -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"  abc  ","tags":["a","b","c","d","e","f"],"visibility":"SECRET"}'                    # V 제목·개수·공개 범위
post -H "Authorization: Bearer $TOKEN" -d '{"title":"[채점] 10-5 태그 길이","tags":["  ","123456789012345678901"]}'   # V2 태그 원소
post -H "Authorization: Bearer $TOKEN" -d '{}'                                                         # V3 제목 없음
post -H "Authorization: Bearer $TOKEN" -d '{"title":'                                                  # J 깨진 JSON

# 잘못된 입력 — 500이 아니다
post -H "Authorization: Bearer $TOKEN" -d '{"title":"    "}'                       # V5 400 title
post -H "Authorization: Bearer $TOKEN" -d '{"title":"[채점] 10-5 태그 null","tags":[null]}'   # V7 400 tags[0]
post -H "Authorization: Bearer $TOKEN" -d '{"title":"[채점] 10-5 태그 문자열","tags":"spring"}' # V8 400 BAD_JSON
post -H "Authorization: Bearer $TOKEN" -d '{"title":"  다섯글자다  ","tags":["a","b","c","d","tttttttttttttttttttt"]}'  # B1 201
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 실행할 때마다 글이 2개씩 늘어난다(제목이 `[채점]`으로 시작).

```check
{
  "requests": [
    { "id": "L", "title": "로그인(김자바)", "method": "POST", "path": "/api/v1/auth/login", "body": { "email": "kim@example.com", "password": "password1234" } },
    { "id": "P", "title": "정상(authorId는 무시)", "method": "POST", "path": "/api/v1/posts", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "body": { "title": "  [채점] 10-5 첫 글  ", "content": "JPA로 저장한 글", "tags": ["API", "api", " Check "], "authorId": 3 } },
    { "id": "R", "title": "비공개·본문·태그 없음", "method": "POST", "path": "/api/v1/posts", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "body": { "title": "[채점] 10-5 비공개", "visibility": "PRIVATE" } },
    { "id": "N", "title": "토큰 없음", "method": "POST", "path": "/api/v1/posts", "body": { "title": "[채점] 10-5 익명" } },
    { "id": "NJ", "title": "토큰 없음 + 깨진 본문", "method": "POST", "path": "/api/v1/posts", "headers": { "Content-Type": "application/json" }, "body": "{\"title\":" },
    { "id": "V", "title": "제목·태그 개수·공개 범위", "method": "POST", "path": "/api/v1/posts", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "body": { "title": "  abc  ", "tags": ["a", "b", "c", "d", "e", "f"], "visibility": "SECRET" } },
    { "id": "V2", "title": "태그 원소 길이", "method": "POST", "path": "/api/v1/posts", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "body": { "title": "[채점] 10-5 태그 길이", "tags": ["  ", "123456789012345678901"] } },
    { "id": "V3", "title": "제목 없음", "method": "POST", "path": "/api/v1/posts", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "body": {} },
    { "id": "J", "title": "깨진 JSON", "method": "POST", "path": "/api/v1/posts", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}", "Content-Type": "application/json" }, "body": "{\"title\":" },
    {"id": "V4", "title": "제목 101자", "method": "POST", "path": "/api/v1/posts", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}, "body": {"title": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"}},
    {"id": "V5", "title": "제목이 공백만", "method": "POST", "path": "/api/v1/posts", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}, "body": {"title": "    "}},
    {"id": "V6", "title": "본문 10001자", "method": "POST", "path": "/api/v1/posts", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}, "body": {"title": "[채점] 10-5 본문 초과", "content": "나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나"}},
    {"id": "V7", "title": "태그 원소 null", "method": "POST", "path": "/api/v1/posts", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}, "body": {"title": "[채점] 10-5 태그 null", "tags": [null]}},
    {"id": "V8", "title": "태그 자리에 문자열", "method": "POST", "path": "/api/v1/posts", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}, "body": {"title": "[채점] 10-5 태그 문자열", "tags": "spring"}},
    {"id": "V9", "title": "공개 범위 소문자", "method": "POST", "path": "/api/v1/posts", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}, "body": {"title": "[채점] 10-5 소문자", "visibility": "public"}},
    {"id": "B1", "title": "경계 안쪽 — 제목 다듬어 5자·태그 5개(하나 20자)", "method": "POST", "path": "/api/v1/posts", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}, "body": {"title": "  다섯글자다  ", "tags": ["a", "b", "c", "d", "tttttttttttttttttttt"]}},
    {"id": "B2", "title": "경계 안쪽 — 제목 100자", "method": "POST", "path": "/api/v1/posts", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}, "body": {"title": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"}}
  ],
  "checks": [
    {
      "id": "C1",
      "request": "P",
      "expect": {
        "status": 201,
        "headers": { "Location": { "endsWith": "/api/v1/posts/{{P.body.data.id}}" } },
        "json": [
          { "path": "$.status", "equals": 201 },
          { "path": "$.data.title", "equals": "[채점] 10-5 첫 글" },
          { "path": "$.data.content", "equals": "JPA로 저장한 글" },
          { "path": "$.data.tags", "equals": ["api", "check"] },
          { "path": "$.data.visibility", "equals": "PUBLIC" },
          { "path": "$.data.author", "equals": { "id": 1, "nickname": "김자바" } },
          { "path": "$.data.viewCount", "equals": 0 },
          { "path": "$.data.likeCount", "equals": 0 },
          { "path": "$.data.createdAt", "matches": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}" }
        ]
      }
    },
    {
      "id": "C2",
      "request": "R",
      "expect": {
        "status": 201,
        "json": [
          { "path": "$.data.visibility", "equals": "PRIVATE" },
          { "path": "$.data.content", "type": "null" },
          { "path": "$.data.tags", "equals": [] }
        ]
      }
    },
    {
      "id": "C3",
      "all": [
        { "request": "N", "expect": { "status": 401, "json": [{ "path": "$.code", "equals": "UNAUTHORIZED" }] } },
        { "request": "NJ", "expect": { "status": 401, "json": [{ "path": "$.code", "equals": "UNAUTHORIZED" }] } }
      ],
      "note": "인증을 먼저 본다 — 본문이 깨져 있어도 토큰이 없으면 401"
    },
    {
      "id": "C4",
      "request": "V",
      "expect": {
        "status": 400,
        "json": [
          { "path": "$.code", "equals": "VALIDATION_FAILED" },
          { "path": "$.errors[*].field", "contains": "title" },
          { "path": "$.errors[*].field", "contains": "tags" },
          { "path": "$.errors[*].field", "contains": "visibility" }
        ]
      }
    },
    {
      "id": "C5",
      "request": "V2",
      "expect": {
        "status": 400,
        "json": [
          { "path": "$.errors[*].field", "contains": "tags[0]" },
          { "path": "$.errors[*].field", "contains": "tags[1]" }
        ]
      }
    },
    { "id": "C6", "request": "V3", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "title" }] } },
    { "id": "C7", "request": "J", "expect": { "status": 400, "json": [{ "path": "$.code", "equals": "BAD_JSON" }] } },
    {"id": "C8", "all": [{"request": "V4", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "title"}, {"path": "$.code", "equals": "VALIDATION_FAILED"}]}}, {"request": "V5", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "title"}, {"path": "$.code", "equals": "VALIDATION_FAILED"}]}}, {"request": "V6", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "content"}, {"path": "$.code", "equals": "VALIDATION_FAILED"}]}}, {"request": "V7", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "tags[0]"}, {"path": "$.code", "equals": "VALIDATION_FAILED"}]}}, {"request": "V8", "expect": {"status": 400, "json": [{"path": "$.code", "equals": "BAD_JSON"}]}}, {"request": "V9", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "visibility"}, {"path": "$.code", "equals": "VALIDATION_FAILED"}]}}]},
    {"id": "C9", "all": [{"request": "B1", "expect": {"status": 201, "json": [{"path": "$.data.title", "equals": "다섯글자다"}, {"path": "$.data.tags", "length": 5}]}}, {"request": "B2", "expect": {"status": 201, "json": [{"path": "$.data.title", "equals": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"}]}}]}
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 P | `201`, `Location`이 `/api/v1/posts/{id}`로 끝남. `title`=`[채점] 10-5 첫 글`(공백 제거), `tags`=`["api","check"]`(소문자·중복 제거·이름순), `visibility`=`PUBLIC`(기본값), `author`=`{id: 1, nickname: 김자바}`(본문의 `authorId: 3` 무시), `viewCount`·`likeCount`=`0`, `createdAt`이 ISO-8601 |
| C2 | 요청 R | `201`, `visibility`=`PRIVATE`, `content`=`null`, `tags`=`[]` |
| C3 | 요청 N·NJ | 둘 다 `401 UNAUTHORIZED` — 깨진 본문보다 인증이 먼저 |
| C4 | 요청 V | `400 VALIDATION_FAILED`, `errors`의 `field`에 `title`(다듬으면 3자)·`tags`(6개)·`visibility` |
| C5 | 요청 V2 | `400`, `field`에 `tags[0]`(공백만 → 0자)·`tags[1]`(21자) |
| C6 | 요청 V3 | `400`, `field`에 `title` |
| C7 | 요청 J | `400 BAD_JSON` |
| C8 | V4~V9 | 제목 101자·공백만 `title` / 본문 10001자 `content` / 태그 원소 `null` `tags[0]` / 공개 범위 `public` `visibility` — 모두 `400 VALIDATION_FAILED` / 태그 자리에 문자열 `400 BAD_JSON` — `500`이 아니다 |
| C9 | B1 / B2 | 경계 바로 안쪽은 통과한다 — 제목 다듬어 정확히 5자(`다섯글자다`)·태그 5개(하나 20자) `201`, 제목 100자 `201`(본문 10000자 경계는 V6의 10001자 거절로 본다) |
| D1 | P 뒤 `SELECT name, COUNT(*) FROM tags WHERE name IN ('api','check') GROUP BY name` | 두 줄, 각 `1` — 여러 번 실행해도 태그 행이 늘지 않는다 |
| D2 | P 뒤 `SELECT t.name FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = <P의 id>` | `api`, `check` |
| R1 | 작성자 | 요청 DTO에 작성자 필드가 없고, `@LoginUser`로 받은 id로 회원을 찾아 작성자로 넣는다 |
| R2 | 연관관계 | 작성자는 `@ManyToOne(fetch = FetchType.LAZY)`, 태그는 `@ManyToMany` + `@JoinTable(name = "post_tags")`. `post_tags` 행을 SQL로 직접 넣지 않는다 |
| R3 | 다듬기 | 공백 제거·소문자·중복 제거·기본값을 검증 **전에** 한다 |

## 필요한 지식

- [E4 JPA 연관관계 첫걸음](../../lessons/E4-jpa-associations.md) — `@ManyToOne`·`@ManyToMany`·연관관계의 주인
- [E3 JPA는 무엇인가](../../lessons/E3-what-is-jpa.md) — 엔티티와 저장소
- [F1 검증과 에러 응답](../../lessons/F1-validation-errors.md)
- [B6 List·Map·Optional·람다](../../lessons/B6-collections-optional-lambda.md) — `stream().map().distinct()`
- [P20 JPA 엔티티 매핑](../../docs/knowledge/P20-jpa-entity-mapping.md) — `@ManyToOne`·`@ManyToMany`·`@Enumerated`
- [S09 JPA·Hibernate](../../docs/knowledge/S09-jpa-hibernate.md) — 지연 로딩과 영속성 컨텍스트
- [W10 검증은 어디서 하나](../../docs/knowledge/W10-where-to-validate.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 파일 구성</summary>

`org.example.board.post` 패키지: `Post`, `Tag`, `Visibility`, `PostRepository`, `TagRepository`(`Optional<Tag> findByName(String name)`), `PostRequest`(요청 record), `AuthorResponse`(`{id, nickname}`), 응답 record, `PostService`, `PostController`.

요청 record 이름은 `PostRequest`로 짓는다. 10-8의 수정(PUT)도 규칙이 같아서 이 record를 함께 쓴다.
</details>

<details>
<summary>힌트 2 — Post 엔티티의 연관관계</summary>

```java
@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "author_id")
private User author;

@ManyToMany
@JoinTable(name = "post_tags",
        joinColumns = @JoinColumn(name = "post_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id"))
private Set<Tag> tags = new LinkedHashSet<>();

@Enumerated(EnumType.STRING)
@Column(nullable = false)
private Visibility visibility;
```

`content`는 `@Column(length = 10000)`(V1의 `VARCHAR(10000)`과 맞춘다).
</details>

<details>
<summary>힌트 3 — 요청 record에서 다듬기</summary>

```java
public PostRequest {
    title = title == null ? null : title.strip();
    tags = tags == null ? List.of() : tags.stream()
            .map(t -> Objects.requireNonNullElse(t, "").strip().toLowerCase(Locale.ROOT))
            .distinct()
            .toList();
    visibility = visibility == null ? "PUBLIC" : visibility;
}
```

`visibility`를 `String` + `@Pattern(regexp = "PUBLIC|PRIVATE")`로 받으면 틀린 값이 `errors`의 `visibility` 필드로 나온다. enum 타입으로 바로 받으면 `"SECRET"`은 JSON 변환 단계에서 실패해 `BAD_JSON`이 된다.
</details>

<details>
<summary>힌트 4 — 태그 찾거나 만들기</summary>

```java
for (String name : names) {
    tags.add(tagRepository.findByName(name).orElseGet(() -> tagRepository.save(new Tag(name))));
}
```

`orElseGet`은 값이 없을 때만 람다를 실행한다. `orElse(tagRepository.save(...))`라고 쓰면 **있어도 save가 먼저 실행돼** UNIQUE 위반이 난다.
</details>

## 다음 단계

[10-6. 게시글 상세](10-6-post-detail.md) — 글 하나를 조회수·작성자·태그·댓글과 함께 돌려준다. 쿼리가 몇 번 나가는지 세어 본다.
