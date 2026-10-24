# 11-2. 글에 이미지 첨부

> 시나리오 DB(`community`). 이번 단계 마이그레이션은 `V20`이다.

## 상황

> "글에 사진을 넣고 싶다는 요청이 제일 많아요. 사진을 고르면 바로 올라가서 미리보기가 뜨고, [발행]을 누르면 그 사진들이 글에 붙게 해 주세요. 사진 아닌 파일이나 너무 큰 파일은 막아 주시고요."

지금까지 요청 본문은 전부 JSON이었다. 파일은 JSON에 담지 않고 **`multipart/form-data`**로 보낸다 — 본문을 경계 문자열(boundary)로 나눠 "파트"마다 이름·파일 이름·형식·내용을 담는 형식이다.

실무에서는 보통 두 번에 나눈다.

1. 사진을 고르는 순간 **이미지만 먼저 올린다** → 서버가 저장하고 `id`와 주소를 돌려준다(미리보기에 쓴다).
2. 글을 저장할 때 본문 JSON에 **그 이미지 `id`들만** 넣는다 → 서버가 이미지를 글에 연결한다.

파일 내용은 DB가 아니라 **디스크**(설정한 폴더)에 두고, DB에는 "누가 올린 어떤 파일인지, 어느 글에 붙었는지"만 남긴다. [T-007](../../tickets/007-post-thumbnail.md)은 외부 저장소가 준 주소만 받는 경우였다. 이번에는 서버가 파일을 직접 받는다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글쓰기 — 사진 첨부",
  "summary": "사진은 고르는 순간 먼저 올라가고(id를 받음), 글을 저장할 때 그 id만 보낸다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "글쓰기", "right": "김자바" },
    { "type": "field", "id": "title", "label": "제목", "value": "주말 등산 사진" },
    { "type": "field", "id": "content", "label": "본문", "value": "정상에서 찍었어요", "multiline": true },
    { "type": "actions", "id": "attach", "items": [{ "id": "pick", "label": "사진 추가", "variant": "secondary" }] },
    { "type": "chips", "id": "previews", "label": "첨부한 사진", "items": ["mountain.gif"] },
    { "type": "actions", "id": "write-actions", "items": [{ "id": "publish", "label": "발행", "variant": "primary" }] },
    { "type": "toast", "id": "too-big", "value": "사진은 1MB까지 올릴 수 있어요", "tone": "error" },
    { "type": "toast", "id": "not-image", "value": "PNG·JPEG·GIF·WebP만 올릴 수 있어요", "tone": "error" }
  ],
  "flows": [
    {
      "name": "사진 올리기",
      "steps": [
        { "kind": "user", "text": "[사진 추가]로 mountain.gif를 고른다", "focus": ["pick"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/images",
          "headers": ["Authorization: Bearer tok-kimjava", "Content-Type: multipart/form-data; boundary=----b1"],
          "body": "------b1\nContent-Disposition: form-data; name=\"file\"; filename=\"mountain.gif\"\nContent-Type: image/gif\n\nGIF89a…(파일 바이트)\n------b1--"
        },
        { "kind": "server", "text": "크기(1MB) → 파일 앞 바이트로 형식 판정(GIF89a) → 저장 이름은 서버가 짓는다(무작위 32자 + .gif)" },
        { "kind": "db", "sql": "INSERT INTO post_image (uploader_id, post_id, stored_name, original_name, content_type, size_bytes, created_at)\nVALUES (2, NULL, '3f2a…e1.gif', 'mountain.gif', 'image/gif', 14, NOW())", "note": "파일 내용은 디스크 uploads/3f2a…e1.gif — post_id는 아직 NULL" },
        { "kind": "response", "status": 201, "headers": ["Location: /api/images/3f2a…e1.gif"], "body": "{\"id\": 7, \"fileName\": \"3f2a…e1.gif\", \"url\": \"/api/images/3f2a…e1.gif\", \"contentType\": \"image/gif\", \"size\": 14}" },
        { "kind": "screen", "text": "url로 미리보기를 띄운다(GET /api/images/3f2a…e1.gif)", "focus": ["previews"] }
      ]
    },
    {
      "name": "글 저장 — 이미지 연결",
      "steps": [
        { "kind": "user", "text": "[발행]을 누른다", "focus": ["publish"] },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": ["Authorization: Bearer tok-kimjava", "Content-Type: application/json"],
          "body": "{\"boardSlug\": \"free\", \"title\": \"주말 등산 사진\", \"content\": \"정상에서 찍었어요\", \"imageIds\": [7]}"
        },
        { "kind": "server", "text": "이미지 7이 내가 올린 것이고 아직 어느 글에도 안 붙었나? → 글 저장과 같은 트랜잭션에서 연결" },
        { "kind": "db", "sql": "INSERT INTO post (...) VALUES (...);  -- 글 25\nUPDATE post_image SET post_id = 25 WHERE id = 7" },
        { "kind": "response", "status": 201, "body": "{\"id\": 25, ...}" },
        { "kind": "screen", "text": "글 상세(GET /api/posts/25)의 images로 사진을 그린다" }
      ]
    },
    {
      "name": "사진이 아닌 파일",
      "steps": [
        { "kind": "user", "text": "이름만 photo.png인 텍스트 파일을 고른다", "focus": ["pick"] },
        { "kind": "request", "method": "POST", "path": "/api/images", "headers": ["Authorization: Bearer tok-kimjava", "Content-Type: multipart/form-data; boundary=----b1"], "body": "…filename=\"photo.png\"\nContent-Type: image/png\n\nhello" },
        { "kind": "server", "text": "이름(.png)과 Content-Type은 보내는 쪽이 마음대로 쓴다 — 파일 앞 바이트가 PNG 서명이 아니다" },
        { "kind": "response", "status": 415, "body": "{\"status\": 415, \"detail\": \"PNG, JPEG, GIF, WebP 이미지만 올릴 수 있습니다.\"}" },
        { "kind": "screen", "text": "'PNG·JPEG·GIF·WebP만 올릴 수 있어요'", "focus": ["not-image"] }
      ]
    }
  ]
}
```

## 만들 것

**V20** — `db/migration/V20__create_post_image.sql`

| 컬럼 | 타입·규칙 |
|---|---|
| `id` | `BIGINT AUTO_INCREMENT PRIMARY KEY` |
| `uploader_id` | 올린 회원, FK → `member` |
| `post_id` | 붙은 글, FK → `post`. 업로드 직후에는 `NULL` |
| `stored_name` | 서버가 지은 저장 이름(`VARCHAR(64)`, `UNIQUE`) — 무작위 32자(16진수) + `.` + 확장자 |
| `original_name` | 사용자가 보낸 파일 이름(기록용, `VARCHAR(255)`) |
| `content_type` | 판정한 형식(`image/png` 등) |
| `size_bytes` | 바이트 수 |
| `created_at` | 올린 시각 |
| 인덱스 | `(post_id, id)` — 글의 이미지를 올린 순서대로 |

**업로드** — `POST /api/images`

필드(파트) 규칙 — 어떤 잘못된 입력에도 `500`이 나오면 안 된다.

| 파트 | 필수 | 빈 값 | 크기 | 형식 | 틀렸을 때 |
|---|---|---|---|---|---|
| `file` | 예 | 0바이트 안 됨 | 1MB(1,048,576바이트)까지 | 앞 바이트가 PNG·JPEG·GIF·WebP 서명 | 없음·0바이트 `400` / 형식 `415` / 크기 `413` |
| 그 밖의 파트 | — | — | — | 무시한다 | — |
| 본문이 multipart가 아님(JSON 등) | — | — | — | — | `415` |

| 항목 | 내용 |
|---|---|
| 인증 | 필요 |
| 요청 | `multipart/form-data`, 파일 파트 이름 `file` |
| 형식 | **파일 앞 바이트(서명)**로 판정: PNG(`89 50 4E 47 0D 0A 1A 0A`), JPEG(`FF D8 FF`), GIF(`GIF87a`·`GIF89a`), WebP(`RIFF????WEBP`). 이름·`Content-Type`은 믿지 않는다 |
| 성공 | `201`, `Location: /api/images/{fileName}`, 본문 `{ "id", "fileName", "url", "contentType", "size" }` — `url`=`/api/images/{fileName}`, `contentType`은 판정한 형식 |
| 저장 | 파일은 설정 폴더(`app.upload-dir`, 기본 `uploads`)에 `fileName`으로, DB에는 `post_image` 한 행(`post_id` NULL) |
| `file` 파트가 없거나 0바이트 | `400` |
| 허용하지 않는 형식 | `415` |
| 1MB 초과 | `413` |

**받기** — `GET /api/images/{fileName}`

| 항목 | 내용 |
|---|---|
| 인증 | 없음(이름이 추측할 수 없는 무작위라 주소를 아는 사람만 연다) |
| 성공 | `200`, `Content-Type`=저장할 때 판정한 형식, 본문=파일 바이트 |
| 서버가 지은 이름 모양이 아니거나(`../` 등) 없는 파일 | `404` |

**글에 연결** — `POST /api/posts`

필드 규칙 — 11-1 표에 `imageIds` 한 줄이 더해진다.

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `imageIds` | 아니오 | null·`[]` 허용(이미지 없음). 원소 `null`은 안 됨 | 서로 다른 id 10개까지(같은 id가 겹치면 하나로) | 정수 배열 — `"7"`, `7.5`, `"abc"`는 형식 오류 `400`(`errors`에 `imageIds[0]`) | `[]` | 400(`imageIds`) |

| 항목 | 내용 |
|---|---|
| 붙일 수 있는 이미지 | **내가 올렸고**, **아직 어느 글에도 안 붙은** 것. 하나라도 아니면(남의 이미지, 이미 다른 글에 붙은 이미지, 없는 id) `400`, `errors`의 `field`가 `imageIds` — 이때 글도 저장되지 않는다 |
| 상세 응답 | `GET /api/posts/{id}`에 `images: [ { "id", "url" } ]` — 올린 순서(`id`) |

- 수정(`PATCH`)으로 이미지를 바꾸거나 빼는 것, 글에 끝내 안 붙은 이미지를 지우는 정리 작업은 이번 범위가 아니다(R4에서 방법만 말한다).

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 크기(1MB) → 파일 앞 바이트로 형식 판정(GIF89a) → 저장 이름은 서버가 짓는다(무작위 32자 + .gif)
- 파일 내용은 디스크 uploads/3f2a…e1.gif — post_id는 아직 NULL
- 이미지 7이 내가 올린 것이고 아직 어느 글에도 안 붙었나? → 글 저장과 같은 트랜잭션에서 연결
- 이름(.png)과 Content-Type은 보내는 쪽이 마음대로 쓴다 — 파일 앞 바이트가 PNG 서명이 아니다

<details>
<summary>Controller — HTTP 연결</summary>

`ImageController.java`, `PostController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다.

이번 단계 매핑: `@PostMapping(value = "/api/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)`, `@GetMapping("/api/images/{fileName}")`. 변경된 메서드: `upload`, `download`.

```java
@PostMapping(value = "/api/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<ImageUploadResponse> upload(@LoginMember AuthenticatedMember me,
        @RequestPart(value = "file", required = false) MultipartFile file) {
    if (file == null) throw new EmptyImageException();
    PostImage image = imageService.upload(me.id(), file);
    return ResponseEntity.created(URI.create(image.url()))
            .body(new ImageUploadResponse(image.getId(), image.getStoredName(), image.url(),
                    image.getContentType(), image.getSizeBytes()));
}
```

받기는 저장 이름 형식을 먼저 검사하고 `Content-Type`을 DB의 판정 결과로 응답한다.

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`ImageUploadResponse.java`, `ImageResponse.java`, `PostCreateRequest.java`, `PostDetailResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

```java
public record ImageUploadResponse(Long id, String fileName, String url,
                                  String contentType, Integer size) {}

// PostCreateRequest: 원래 JSON 타입을 보존한다. 문자열·소수가 Long으로 바뀌지 않게 Service가 검사한다.
JsonNode imageIds

public record ImageResponse(Long id, String url) {}
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`ImageService.java`, `PostQueryService.java`, `PostService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `upload`, `afterCompletion`, `findByStoredName`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

```java
if (file.isEmpty()) throw new EmptyImageException();
byte[] bytes = file.getBytes();
ImageType type = ImageType.detect(bytes).orElseThrow(UnsupportedImageException::new);
String storedName = UUID.randomUUID().toString().replace("-", "") + "." + type.extension();
// 같은 트랜잭션에서 이미지 행을 만든다. 먼저 롤백 정리 콜백을 등록한 뒤 디스크에 쓴다.
TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
    @Override public void afterCompletion(int status) {
        if (status != STATUS_COMMITTED) storage.delete(storedName);
    }
});
storage.save(storedName, bytes);

// 글 생성 트랜잭션: 중복 id 제거 → 행 잠금 → 업로더·미연결 상태 확인 → 연결.
if (!imageIds.isArray()) throw new InvalidPostFieldException("imageIds", "숫자 배열이어야 합니다.");
List<Long> requestedIds = new ArrayList<>();
for (int i = 0; i < imageIds.size(); i++) {
    JsonNode id = imageIds.get(i);
    if (!id.isIntegralNumber() || !id.canConvertToLong())
        throw new InvalidPostFieldException("imageIds[" + i + "]", "정수여야 합니다.");
    requestedIds.add(id.longValue());
}
List<Long> ids = requestedIds.stream().distinct().sorted().toList();
if (ids.size() > 10) throw new InvalidPostFieldException("imageIds", "이미지는 10개까지입니다.");
List<PostImage> images = postImageRepository.findAllByIdForUpdate(ids);
if (images.size() != ids.size() || images.stream().anyMatch(i ->
        !i.getUploader().getId().equals(authorId) || i.getPost() != null)) {
    throw new InvalidPostFieldException("imageIds", "사용할 수 없는 이미지입니다.");
}
images.forEach(image -> image.attachTo(post));
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`PostImageRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다.

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT image FROM PostImage image WHERE image.id IN :ids")
List<PostImage> findAllByIdForUpdate(@Param("ids") Collection<Long> ids);
```

잠금과 글 저장이 같은 트랜잭션에 있어야 두 요청이 같은 미연결 이미지를 동시에 붙이지 못한다.

</details>

<details>
<summary>MyBatis Mapper — 업로드·조회·첨부 SQL</summary>

**MyBatis 대체 코드** 토글은 이미지 행 INSERT와 저장 이름 조회, 글에 붙이는 UPDATE를 Mapper로 실행한다. 기존 글 저장과 응답용 엔티티 조회는 JPA를 유지한다. 글 저장과 이미지 연결은 같은 트랜잭션이며, UPDATE의 영향 행 수가 0이면 글 생성도 롤백한다.

```java
int insert(MyImageInsertRow row); // useGeneratedKeys로 id를 받는다
Long findIdByStoredName(@Param("storedName") String storedName);
int attach(@Param("id") Long id, @Param("uploaderId") Long uploaderId,
           @Param("postId") Long postId);
```

```xml
<insert id="insert" useGeneratedKeys="true" keyProperty="id">
  INSERT INTO post_image (uploader_id, post_id, stored_name, original_name,
                          content_type, size_bytes, created_at)
  VALUES (#{uploaderId}, NULL, #{storedName}, #{originalName},
          #{contentType}, #{sizeBytes}, #{createdAt})
</insert>
<update id="attach">
  UPDATE post_image SET post_id = #{postId}
  WHERE id = #{id} AND uploader_id = #{uploaderId} AND post_id IS NULL
</update>
```

미연결 조건을 UPDATE 안에 두면 두 글이 같은 이미지를 동시에 연결하려 할 때 하나만 성공한다.

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`PostImage.java`, `Post.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다. 변경된 메서드: `attachTo`, `url`.

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "post_id")
private Post post; // 업로드 직후 null

public void attachTo(Post post) { this.post = post; }
public String url() { return "/api/images/" + storedName; }
```

</details>

<details>
<summary>Flyway / SQL — 스키마 변경</summary>

`V20__create_post_image.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.

```sql
CREATE TABLE post_image (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    uploader_id BIGINT NOT NULL,
    post_id BIGINT NULL,
    stored_name VARCHAR(64) NOT NULL,
    UNIQUE KEY uk_post_image_stored_name (stored_name),
    KEY ix_post_image_post (post_id, id),
    FOREIGN KEY (uploader_id) REFERENCES member(id),
    FOREIGN KEY (post_id) REFERENCES post(id)
    -- original_name, content_type, size_bytes, created_at도 실제 V20에 선언
);
```

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`ApiExceptionHandler.java`, `EmptyImageException.java`, `ImageNotFoundException.java`, `UnsupportedImageException.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handleEmptyImage`, `handleUnsupportedImage`, `handleMaxUploadSize`, `handleImageNotFound`.

```java
@ExceptionHandler(EmptyImageException.class)
public ProblemDetail handleEmptyImage(EmptyImageException ex, HttpServletRequest request) { /* 400 */ }
@ExceptionHandler(UnsupportedImageException.class)
public ProblemDetail handleUnsupportedImage(UnsupportedImageException ex, HttpServletRequest request) { /* 415 */ }
@ExceptionHandler(MaxUploadSizeExceededException.class)
public ProblemDetail handleMaxUploadSize(HttpServletRequest request) { /* 413 */ }
```

전체 응답 전문은 아래 **전체 구현 코드**에서 `ApiExceptionHandler.java`를 펼쳐 확인한다.

</details>

<details>
<summary>설정·보조 코드</summary>

`.gitignore`, `ImageStorage.java`, `ImageType.java`, `application.yml`. 이 파일에서 바뀐 설정·보조 타입이 서버 흐름의 어느 단계에 필요한지 확인한다. 변경된 메서드: `save`, `pathOf`, `delete`, `contentType`.

```java
public Path pathOf(String storedName) { return root.resolve(storedName); }
public void save(String storedName, byte[] bytes) {
    try {
        Files.createDirectories(root);
        Files.write(root.resolve(storedName), bytes);
    } catch (IOException e) {
        throw new UncheckedIOException("이미지를 저장하지 못했습니다.", e);
    }
}
```

`application.yml`의 `spring.servlet.multipart.max-file-size: 1MB`, `app.upload-dir`과 파일 서명 판정 `ImageType.detect`도 함께 확인한다.

</details>

## 직접 확인

API 서버 주소는 페이지 상단의 공통 입력에서 설정하고, HTTP 요청은 아래 실행 패널에서 순서대로 보낸다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

```bash
# Postman 수동 확인(C2 바이트 비교, C9 1MB 초과 등)에 올릴 파일을 만든다
printf 'GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;' > dot.gif   # 1×1 GIF
echo hello > fake.png
head -c 1200000 /dev/urandom > big.gif                                  # 1.2MB
```

C2 바이트 비교(수동) — Postman에서 `POST /api/images`를 Body `form-data`(key `file`, 종류 File)로 `dot.gif`를 골라 김자바 토큰으로 보낸다. 응답의 `url`로 `GET`을 보낼 때 Send 버튼 옆 화살표의 **Send and Download**로 응답을 위 파일들과 같은 폴더에 `got.gif`로 저장한다. 그다음 같은 폴더에서 올린 파일과 받은 파일을 바이트 단위로 비교한다.

```bash
cmp dot.gif got.gif && echo 같은파일   # C2 — 한 바이트라도 다르거나 길이가 다르면 cmp가 차이를 출력하고 같은파일이 나오지 않는다
```

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다. 실행 칸은 파일을 고를 수 없어서 `multipart/form-data` 본문을 글자로 직접 적어 보낸다(경계 `jx11`, 줄바꿈은 `\r\n`).


```check
{
  "requests": [
    {
      "id": "I0",
      "title": "I0 GIF 올리기(김자바)",
      "method": "POST",
      "path": "/api/images",
      "headers": { "Authorization": "Bearer tok-kimjava", "Content-Type": "multipart/form-data; boundary=jx11" },
      "body": "--jx11\r\nContent-Disposition: form-data; name=\"file\"; filename=\"dot.gif\"\r\nContent-Type: image/gif\r\n\r\nGIF89a\u0001\u0000\u0001\u0000\u0000\u0000\u0000;\r\n--jx11--\r\n"
    },
    { "id": "I1", "title": "I1 올린 파일 받기", "method": "GET", "path": "/api/images/{{I0.body.fileName}}" },
    {
      "id": "I2",
      "title": "I2 이름만 .png인 텍스트",
      "method": "POST",
      "path": "/api/images",
      "headers": { "Authorization": "Bearer tok-kimjava", "Content-Type": "multipart/form-data; boundary=jx11" },
      "body": "--jx11\r\nContent-Disposition: form-data; name=\"file\"; filename=\"photo.png\"\r\nContent-Type: image/png\r\n\r\nhello\r\n--jx11--\r\n"
    },
    {
      "id": "I3",
      "title": "I3 토큰 없이 올리기",
      "method": "POST",
      "path": "/api/images",
      "headers": { "Content-Type": "multipart/form-data; boundary=jx11" },
      "body": "--jx11\r\nContent-Disposition: form-data; name=\"file\"; filename=\"dot.gif\"\r\nContent-Type: image/gif\r\n\r\nGIF89a\u0001\u0000\u0001\u0000\u0000\u0000\u0000;\r\n--jx11--\r\n"
    },
    {
      "id": "I8",
      "title": "I8 file 파트 없이",
      "method": "POST",
      "path": "/api/images",
      "headers": { "Authorization": "Bearer tok-kimjava", "Content-Type": "multipart/form-data; boundary=jx11" },
      "body": "--jx11\r\nContent-Disposition: form-data; name=\"note\"\r\n\r\nfile 없음\r\n--jx11--\r\n"
    },
    {
      "id": "I5",
      "title": "I5 이미지를 붙여 글쓰기",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "boardSlug": "free", "title": "[채점] 사진 글", "content": "사진 첨부", "imageIds": ["{{I0.body.id}}"] }
    },
    { "id": "I6", "title": "I6 글 상세", "method": "GET", "path": "/api/posts/{{I5.body.id}}" },
    {
      "id": "I7",
      "title": "I7 이미 붙은 이미지로 또 글쓰기",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "boardSlug": "free", "title": "[채점] 같은 사진 또", "content": "x", "imageIds": ["{{I0.body.id}}"] }
    },
    {
      "id": "J0",
      "title": "J0 김자바가 하나 더 올리기",
      "method": "POST",
      "path": "/api/images",
      "headers": { "Authorization": "Bearer tok-kimjava", "Content-Type": "multipart/form-data; boundary=jx11" },
      "body": "--jx11\r\nContent-Disposition: form-data; name=\"file\"; filename=\"dot.gif\"\r\nContent-Type: image/gif\r\n\r\nGIF89a\u0001\u0000\u0001\u0000\u0000\u0000\u0000;\r\n--jx11--\r\n"
    },
    {
      "id": "E1",
      "title": "E1 0바이트 파일",
      "method": "POST",
      "path": "/api/images",
      "headers": { "Authorization": "Bearer tok-kimjava", "Content-Type": "multipart/form-data; boundary=jx11" },
      "body": "--jx11\r\nContent-Disposition: form-data; name=\"file\"; filename=\"empty.gif\"\r\nContent-Type: image/gif\r\n\r\n\r\n--jx11--\r\n"
    },
    { "id": "E3", "title": "E3 imageIds에 null", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "boardSlug": "free", "title": "[채점] 잘못된 이미지", "content": "x", "imageIds": [null] } },
    { "id": "E4", "title": "E4 imageIds에 문자", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "boardSlug": "free", "title": "[채점] 잘못된 이미지", "content": "x", "imageIds": ["abc"] } },
    { "id": "E5", "title": "E5 없는 이미지 id", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "boardSlug": "free", "title": "[채점] 잘못된 이미지", "content": "x", "imageIds": [99999999] } },
    { "id": "E6", "title": "E6 이미지 11개", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "boardSlug": "free", "title": "[채점] 잘못된 이미지", "content": "x", "imageIds": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] } },
    {"id": "T0", "title": "T0 형식 검사용 미연결 이미지", "method": "POST", "path": "/api/images", "headers": {"Authorization": "Bearer tok-kimjava", "Content-Type": "multipart/form-data; boundary=jx11"}, "body": "--jx11\r\nContent-Disposition: form-data; name=\"file\"; filename=\"dot.gif\"\r\nContent-Type: image/gif\r\n\r\nGIF89a\u0001\u0000\u0001\u0000\u0000\u0000\u0000;\r\n--jx11--\r\n"},
    {"id": "E7", "title": "E7 숫자처럼 보이는 문자열 ID", "method": "POST", "path": "/api/posts", "headers": {"Authorization": "Bearer tok-kimjava"}, "body": "{\"boardSlug\": \"free\", \"title\": \"[채점] 잘못된 형식 이미지\", \"content\": \"x\", \"imageIds\": [\"{{T0.body.id}}\"]}"},
    {"id": "E8", "title": "E8 소수 ID", "method": "POST", "path": "/api/posts", "headers": {"Authorization": "Bearer tok-kimjava"}, "body": "{\"boardSlug\": \"free\", \"title\": \"[채점] 잘못된 형식 이미지\", \"content\": \"x\", \"imageIds\": [{{T0.body.id}}.5]}"},
    {
      "id": "K",
      "title": "K 김자바가 10장 올리기",
      "method": "POST",
      "path": "/api/images",
      "repeat": 10,
      "headers": { "Authorization": "Bearer tok-c12", "Content-Type": "multipart/form-data; boundary=jx11" },
      "body": "--jx11\r\nContent-Disposition: form-data; name=\"file\"; filename=\"dot.gif\"\r\nContent-Type: image/gif\r\n\r\nGIF89a\u0001\u0000\u0001\u0000\u0000\u0000\u0000;\r\n--jx11--\r\n"
    },
    {
      "id": "K10",
      "title": "K10 정확히 10장 붙여 글쓰기",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer tok-c12" },
      "body": {
        "boardSlug": "free",
        "title": "[채점] 사진 10장",
        "content": "x",
        "imageIds": ["{{K#1.body.id}}", "{{K#2.body.id}}", "{{K#3.body.id}}", "{{K#4.body.id}}", "{{K#5.body.id}}", "{{K#6.body.id}}", "{{K#7.body.id}}", "{{K#8.body.id}}", "{{K#9.body.id}}", "{{K#10.body.id}}"]
      }
    },
    { "id": "K11", "title": "K11 10장 글 상세", "method": "GET", "path": "/api/posts/{{K10.body.id}}" },
    { "id": "K0", "title": "K0 imageIds 빈 배열", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-c12" }, "body": { "boardSlug": "free", "title": "[채점] 사진 없음", "content": "x", "imageIds": [] } },
    {
      "id": "J1",
      "title": "J1 이스프링이 김자바의 이미지로 글쓰기",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer tok-lee" },
      "body": { "boardSlug": "free", "title": "[채점] 남의 사진", "content": "x", "imageIds": ["{{J0.body.id}}"] }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "I0",
      "expect": {
        "status": 201,
        "headers": { "location": { "endsWith": "/api/images/{{I0.body.fileName}}" } },
        "json": [
          { "path": "$.id", "type": "number" },
          { "path": "$.fileName", "matches": "^[0-9a-f]{32}\\.gif$" },
          { "path": "$.url", "equals": "/api/images/{{I0.body.fileName}}" },
          { "path": "$.contentType", "equals": "image/gif" },
          { "path": "$.size", "equals": 14 }
        ]
      }
    },
    {
      "id": "C2",
      "request": "I1",
      "expect": {
        "status": 200,
        "headers": { "content-type": { "contains": "image/gif" } },
        "bodyText": { "contains": "GIF89a" }
      }
    },
    { "id": "C3", "request": "I2", "expect": { "status": 415 } },
    { "id": "C4", "request": "I3", "expect": { "status": 401 } },
    { "id": "C5", "request": "I8", "expect": { "status": 400 } },
    {
      "id": "C6",
      "all": [
        { "request": "I5", "expect": { "status": 201 } },
        {
          "request": "I6",
          "expect": {
            "status": 200,
            "json": [
              { "path": "$.images", "length": 1 },
              { "path": "$.images[0].id", "equals": "{{I0.body.id}}" },
              { "path": "$.images[0].url", "equals": "{{I0.body.url}}" }
            ]
          }
        }
      ]
    },
    {
      "id": "C7",
      "request": "I7",
      "expect": { "status": 400, "json": [{ "path": "$.errors[0].field", "equals": "imageIds" }] }
    },
    {
      "id": "C8",
      "all": [
        { "request": "J0", "expect": { "status": 201 } },
        { "request": "J1", "expect": { "status": 400, "json": [{ "path": "$.errors[0].field", "equals": "imageIds" }] } }
      ]
    },
    { "id": "C10", "request": "E1", "expect": { "status": 400 } },
    {
      "id": "C11",
      "all": [
        { "request": "E3", "expect": { "status": 400, "json": [{ "path": "$.errors[0].field", "matches": "^imageIds" }] } },
        { "request": "E4", "expect": { "status": 400, "json": [{ "path": "$.errors[*].field", "contains": "imageIds[0]" }] } },
        { "request": "E5", "expect": { "status": 400, "json": [{ "path": "$.errors[0].field", "equals": "imageIds" }] } },
        { "request": "E6", "expect": { "status": 400, "json": [{ "path": "$.errors[0].field", "equals": "imageIds" }] } }
      ]
    },
    {
      "id": "C12",
      "all": [
        { "request": "K", "expect": { "status": 201 } },
        { "request": "K10", "expect": { "status": 201 } },
        { "request": "K11", "expect": { "status": 200, "json": [{ "path": "$.images", "length": 10 }, { "path": "$.images[0].id", "equals": "{{K#1.body.id}}" }] } },
        { "request": "K0", "expect": { "status": 201 } }
      ]
    },
    {"id": "C13", "all": [{"request": "T0", "expect": {"status": 201}}, {"request": "E7", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "imageIds[0]"}]}}, {"request": "E8", "expect": {"status": 400, "json": [{"path": "$.errors[*].field", "contains": "imageIds[0]"}]}}]}
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). `{IMG}`·`{P}`는 직접 확인에서 올린 이미지·만든 글의 id, `{F}`는 이미지의 `fileName`이다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | I0 | `201`, `Location`이 `/api/images/{fileName}`, `fileName`이 `32자 16진수.gif`, `url`=`/api/images/{fileName}`, `contentType`=`image/gif`, `size`=`14` |
| C2 | I1 | `200`, `Content-Type: image/gif`, 본문이 올린 바이트 그대로 — 실행 칸에서는 본문이 `GIF89a`로 시작하는지 보고, 바이트 전체가 같은지는 직접 확인의 Postman 수동 절차에서 `cmp dot.gif got.gif`가 `같은파일`을 출력하는 것으로 확인한다 |
| C3 | I2(이름만 `.png`인 텍스트) | `415` |
| C4 | I3(토큰 없음) | `401` |
| C5 | I8(`file` 파트 없음) | `400` |
| C6 | I5 / I6 | `201` / 상세 `images`가 1개, 그 `id`·`url`이 I0과 같다 |
| C7 | I7(이미 붙은 이미지) | `400`, `errors[0].field`=`imageIds` |
| C8 | J0 / J1(이스프링이 김자바의 이미지를 붙임) | `201` / `400`, `errors[0].field`=`imageIds` |
| C9 | I4(1.2MB) | `413` — 수동(Postman) |
| C10 | E1(0바이트) | `400` — 500이 아니다. JSON으로 보내는 E2(`415`)는 Postman에서 JSON 본문으로 보내 본다(이 415는 컨트롤러를 고르기 전에 나서 CORS 헤더가 붙지 않아, 브라우저 실행 칸에서는 응답을 읽을 수 없다) |
| C11 | E3~E6(`imageIds`가 `[null]`·`["abc"]`·없는 id·11개) | 모두 `400`(`["abc"]`는 형식 오류라 `errors`에 `imageIds[0]`(11-1 공통 처리기), 나머지는 `errors[0].field`가 `imageIds`로 시작) |
| C12 | K(10장 올리기) / K10 / K11 / K0 | 경계 안쪽: 정확히 10장 붙인 글 `201`, 상세 `images` 10개(올린 순서) / `imageIds: []`도 `201` |
| C13 | T0 / E7 / E8 | 미연결 이미지 업로드 `201`; 그 ID를 문자열(`"7"`)·소수(`7.5`)로 보낸 글은 각각 `400` + `errors`의 `imageIds[0]` — Jackson의 Long 자동 변환을 허용하지 않는다 |
| D1 | `SELECT post_id, uploader_id, content_type, size_bytes, stored_name, original_name FROM post_image WHERE id = {IMG}` | `{P}`, `2`, `image/gif`, `43`(직접 확인의 1×1 GIF) 또는 `14`(실행 칸의 간단한 GIF 서명), `{F}`, `dot.gif` |
| D2 | `SELECT COUNT(*) FROM post WHERE title IN ('[채점] 같은 사진 또', '[채점] 잘못된 이미지', '[채점] 잘못된 형식 이미지')` | `0` — 400이면 글도 저장되지 않았다 |
| R1 | 형식 판정 | `Content-Type`·확장자가 아니라 파일 앞 바이트로 판정한다. 왜 그래야 하는지(보내는 쪽이 마음대로 적는다, 브라우저가 내용을 보고 실행할 수 있다) 말할 수 있다 |
| R2 | 저장 이름 | 사용자가 보낸 파일 이름을 경로에 쓰지 않는다(`../../`로 다른 폴더에 쓰기, 같은 이름 덮어쓰기). 받기 API가 서버가 지은 이름 모양만 받는다 |
| R3 | 크기 제한 | `spring.servlet.multipart.max-file-size`로 컨트롤러에 오기 전에 막고, `MaxUploadSizeExceededException`을 413으로 바꾼다. 컨트롤러에서 `file.getSize()`만 보면 이미 다 받은 뒤라는 것을 안다 |
| R4 | 남는 파일 | 파일 쓰기 전에 등록한 `afterCompletion`이 같은 프로세스의 DB 롤백 때 디스크 파일 삭제를 시도한다. 프로세스가 갑자기 종료되거나 글에 끝내 안 붙은 업로드(`post_id IS NULL`이 오래된 행)는 별도 정리 배치가 필요하다는 것을 말할 수 있다 |
| R5 | 저장 위치 설정 | 업로드 폴더를 코드에 박지 않고 `application.yml`(`app.upload-dir`)로 뺐다. 서버를 여러 대 띄우면 로컬 디스크가 왜 문제인지(다른 서버엔 파일이 없다 → S3 같은 공용 저장소) 안다 |
| R6 | 저장 결과 관찰 | 앱을 실행한 폴더(설정한 업로드 폴더)에 `{F}` 파일이 있고, 이름에 사용자가 보낸 `dot.gif`가 들어 있지 않다 |

## 필요한 지식

- [P17 파일 업로드·다운로드와 외부 스토리지](../../docs/knowledge/P17-file-upload-storage.md) — `MultipartFile`, 크기 제한, 저장 이름과 표시 이름, S3
- [A2 HTTP 요청·응답 뜯어보기](../../lessons/A2-http-anatomy.md) — `Content-Type`과 본문 형식
- [D11 웹 보안 기초](../../docs/knowledge/D11-web-security-basics.md) — 사용자 입력(파일 이름 포함)을 믿지 않는다
- [C3 application.yml과 프로파일](../../lessons/C3-application-yml-profiles.md) — 설정 값을 코드 밖으로
- [R03 스키마와 테이블 설계 — PK·FK·제약](../../docs/knowledge/R03-schema-types-constraints.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — multipart 받기</summary>

```java
@PostMapping(value = "/api/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<ImageUploadResponse> upload(@LoginMember AuthenticatedMember loginMember,
                                                  @RequestPart(value = "file", required = false) MultipartFile file) {
```

`required = false`로 받고 `null`이거나 `file.isEmpty()`면 400 예외를 직접 던지면 응답 모양을 다른 400과 맞추기 쉽다. 크기 제한은 `application.yml`에:

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 1MB
      max-request-size: 2MB
```

넘으면 요청을 읽는 단계에서 `MaxUploadSizeExceededException`이 난다 — `@RestControllerAdvice`에 핸들러를 더해 `413`(`HttpStatus.CONTENT_TOO_LARGE`)으로 바꾼다.
</details>

<details>
<summary>힌트 2 — 형식 판정과 저장</summary>

`file.getBytes()`로 읽어 앞 바이트를 비교한다. GIF는 `"GIF89a".getBytes(StandardCharsets.US_ASCII)`와 앞 6바이트를 `Arrays.equals`로 비교하면 된다. PNG·JPEG 서명은 `(byte) 0x89`처럼 `byte`로 바꿔 적는다(자바 `byte`는 -128~127이라 `0x89`를 그대로 못 넣는다).

저장 이름은 `UUID.randomUUID().toString().replace("-", "") + "." + 확장자`. 폴더는 `@Value("${app.upload-dir:uploads}")`로 받아 `Files.createDirectories` → `Files.write(root.resolve(이름), bytes)`.

받기는 `ResponseEntity.ok().contentType(MediaType.parseMediaType(행의 content_type)).body(new FileSystemResource(경로))`. 이름은 `[0-9a-f]{32}\.(png|jpg|gif|webp)` 정규식에 맞을 때만 찾는다.
</details>

<details>
<summary>힌트 3 — 글에 연결</summary>

`PostImage`에 `@ManyToOne Post post`(nullable)를 두고, `PostService.create()`에서 글을 `save`한 뒤 `postImageRepository.findAllById(ids)`로 읽어 "개수가 같은가, 모두 `uploader`가 나인가, 모두 `post == null`인가"를 본다. 하나라도 아니면 3-1에서 만든 `InvalidPostFieldException("imageIds", …)`를 던진다 — 같은 트랜잭션이라 방금 저장한 글도 롤백된다.

상세 응답은 `Post`에 `@OneToMany(mappedBy = "post") @OrderBy("id")`를 두거나 `findByPostIdOrderById`로 따로 읽는다(트랜잭션 안에서). </details>

## 다음 단계

[11-3. 조회수 — 같은 사람은 하루 한 번](11-3-view-count.md)
