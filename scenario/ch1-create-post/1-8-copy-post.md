# 1-8. 기존 글 복사 생성 — 경로·쿼리·본문을 함께

## 상황

> "공개된 글을 바탕으로 새 글을 쓰고 싶어요. 제목은 새로 정하고, 태그는 복사할 수도 있어요."

1-1~1-6의 일반 글 생성은 본문 DTO에 새 글의 값을 모두 담았다. 이번에는 **원본 ID는 경로**, **태그 복사 여부는 쿼리**, **새 제목은 본문 DTO**, **작성자는 토큰**에서 가져온다. 같은 `POST`라도 입력의 출처와 저장할 관계 행이 달라진다.

## 화면 시나리오

```screen
{
  "title": "공개 글 복사",
  "summary": "원본의 본문과 게시판을 쓰되 제목을 바꾸고 태그 복사 여부를 고른다.",
  "screen": [
    { "type": "text", "id": "source", "value": "JPA 연관관계 매핑 정리", "emphasis": "title" },
    { "type": "field", "id": "title", "label": "새 제목", "value": "[복사실습] JPA 복습" },
    { "type": "select", "id": "tags", "label": "태그", "value": "함께 복사" },
    { "type": "actions", "id": "save", "items": [{ "id": "submit", "label": "새 글 만들기", "variant": "primary" }] }
  ],
  "flows": [{
    "name": "태그와 함께 복사",
    "steps": [
      { "kind": "user", "text": "원본을 선택하고 제목을 적은 뒤 태그 복사를 켠다", "focus": ["title", "tags"] },
      { "kind": "request", "method": "POST", "path": "/api/posts/2/copies?copyTags=true", "headers": ["Authorization: Bearer tok-kimjava"], "body": "{\"title\":\"[복사실습] JPA 복습\"}" },
      { "kind": "server", "text": "서비스가 원본 공개 여부를 확인하고 새 작성자로 토큰 회원을 지정한다" },
      { "kind": "db", "sql": "INSERT INTO post (...,author_id,title,...) VALUES (...,2,'[복사실습] JPA 복습',...); INSERT INTO post_tag (post_id,tag_id) SELECT :newId,tag_id FROM post_tag WHERE post_id=2", "note": "글과 연결 행을 한 트랜잭션에서 저장" },
      { "kind": "response", "status": 201, "headers": ["Location: /api/posts/{newId}"], "body": "{\"id\":22,\"title\":\"[복사실습] JPA 복습\",\"tags\":[\"spring\",\"jpa\"]}" },
      { "kind": "screen", "text": "새 글로 이동한다", "focus": ["source"] }
    ]
  }]
}
```

## 만들 것

| 항목 | 계약 |
|---|---|
| 메서드·경로 | `POST /api/posts/{sourceId}/copies?copyTags=true|false`. `copyTags` 생략 시 `false`. |
| 요청 DTO | `{ "title": "..." }`만 받는다. 1-5와 같이 공백 아닌 1~200자. 본문·게시판·태그 ID·작성자 ID는 본문에서 받지 않는다. |
| 새 글 | 원본의 `content`·`board`를 복사한다. 새 제목·토큰 작성자, `PUBLISHED`·`PUBLIC`, 현재 시각을 쓴다. 좋아요·댓글·조회 수는 0이다. 원본은 수정하지 않는다. |
| 태그 | `copyTags=true`면 원본 `post_tag`가 가리키는 태그들을 새 글에 연결한다. `false`면 새 글의 태그는 빈 목록이다. |
| 성공 | `201`, `Location: /api/posts/{newId}`, 1-2의 생성 응답 DTO. 원본 ID와 새 ID는 달라야 한다. |
| 실패 | 제목 누락/공백·`copyTags` 형식 오류 `400`; 토큰 없음 `401`; 공지처럼 새 작성자에게 쓰기 권한이 없는 게시판 `403`; 원본이 없거나 비공개·미발행·삭제됨 `404`. |

Controller는 `@PathVariable Long sourceId`, `@RequestParam(defaultValue="false") boolean copyTags`, `@Valid @RequestBody CopyPostRequest`를 받는다. `CopyPostRequest`에는 제목만 둔다.

Service는 원본을 읽어 `status=PUBLISHED`, `visibility=PUBLIC`, `deletedAt=null`을 확인하고 **1-6의 게시판 쓰기 권한**도 다시 적용한 뒤 새 `Post`를 만든다. 원본을 그대로 `save()`하면 ID와 작성자까지 재사용되므로 **새 엔티티**에 복사할 필드만 채운다.

`@Transactional` 안에서 새 글과 태그 연결을 저장한다. 생성 응답 DTO의 author는 원본 작성자가 아닌 토큰 회원이다.

2-3에서 팔로워·차단에 따른 조회 권한을 배운다. 이 단계에서는 **누구나 볼 수 있는 PUBLIC 원본만** 복사 가능하게 하여 조건을 단순하게 시작한다. 이후 더 넓은 복사 권한을 만들 때 2-3의 접근 규칙을 재사용한다.

## 구현 가이드

원본을 읽어 새 글을 만드는 순서로 작업한다. 처음에는 `copyTags=false`로 글 한 행을 만들고, 그다음 태그 연결을 같은 트랜잭션에 붙인다.

<details>
<summary>Controller — 경로·쿼리·본문·토큰을 분리해 받기</summary>

네 값의 출처가 다르다. `sourceId`는 경로, `copyTags`는 쿼리, 제목은 DTO, 새 작성자는 기존 `@LoginMember`에서 읽는다.

```java
@PostMapping("/{sourceId}/copies")
public ResponseEntity<PostResponse> copy(
        @PathVariable Long sourceId,
        @RequestParam(defaultValue = "false") boolean copyTags,
        @LoginMember AuthenticatedMember loginMember,
        @Valid @RequestBody CopyPostRequest request) {
    Post copied = postService.copy(sourceId, loginMember.id(), copyTags, request);
    return ResponseEntity.created(URI.create("/api/posts/" + copied.getId()))
            .body(toResponse(copied));
}
```

기존 `PostController`가 클래스 경로 `@RequestMapping("/api/posts")`를 갖는 경우의 조각이다. `toResponse`는 1-2의 생성 응답 변환을 재사용한다.

</details>

<details>
<summary>DTO — 새 제목만 검증</summary>

본문 DTO에 `authorId`, `boardSlug`, `tags`를 추가하지 않는다. 이 값들은 원본·토큰·쿼리에서 결정된다.

```java
public record CopyPostRequest(
        @NotBlank @Size(max = 200) String title
) { }
```

기존 제목 규칙에 맞춰 공백을 다듬는 위치도 확인한다. JSON에 제목이 없거나 공백뿐이면 저장 전에 `400`이어야 한다.

</details>

<details>
<summary>Service — 공개 원본·쓰기 권한·트랜잭션</summary>

`@Transactional` 메서드 안에서 원본을 조회하고 `deletedAt`, `status`, `visibility`를 검사한다. 원본 게시판의 쓰기 권한을 토큰 회원에게 다시 적용한다. 통과한 뒤 **새 Post**를 생성하고, `copyTags=true`일 때만 원본의 태그를 연결한다.

```java
Post source = postRepository.findById(sourceId)
        .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "원본 글을 찾을 수 없습니다."));
if (source.getDeletedAt() != null || !"PUBLISHED".equals(source.getStatus())
        || !"PUBLIC".equals(source.getVisibility())) {
    throw new ResponseStatusException(HttpStatus.NOT_FOUND, "원본 글을 찾을 수 없습니다.");
}
// 여기에서 source.board의 쓰기 권한과 토큰 작성자의 역할을 확인한다.
```

권한 실패 때는 `post`도 `post_tag`도 새 행이 없어야 한다. 원본 객체의 ID나 작성자를 바꾸지 않는다.
`PostNotFoundException`은 2-1에서 만들므로 지금은 Spring의 `ResponseStatusException`으로 `404`를 돌려준다.

</details>

<details>
<summary>JPA / Repository — 새 엔티티와 태그 연결 저장</summary>

원본 `Post`를 다시 `save()`하지 않는다. 기존 엔티티 생성자와 태그 연결 메서드를 이용해 새 객체에 복사할 필드만 넣는다.

```java
Post copied = new Post(source.getBoard(), author, request.title(),
        source.getContent(), "PUBLISHED", "PUBLIC", LocalDateTime.now());
if (copyTags) source.getTags().forEach(copied::addTag);
Post saved = postRepository.save(copied);
```

SQL 로그에서 새 `post` 한 행과 `copyTags=true`일 때의 `post_tag` 연결을 확인한다.

</details>

<details>
<summary>MyBatis — 공개 원본을 읽고 새 글·태그 연결을 저장하기</summary>

아래 **MyBatis 대체 구현 코드**의 16개 파일을 이 단계 전체 소스에 적용한다. 1-6의 토큰 조회·일반 글 생성 Mapper 경로도 함께 포함한다. Controller는 `sourceId`(경로), `copyTags`(쿼리), `CopyPostRequest.title`(본문), 작성자 ID(토큰)를 각각 서비스로 넘긴다.

`findCopySourceById`는 `post`와 `board`를 JOIN해 공개 상태·삭제 여부·본문·게시판 쓰기 역할을 `CopySourceRow`로 읽는다. 없거나 `PUBLISHED`/`PUBLIC`이 아니거나 삭제된 원본은 `404`, 작성자의 게시판 쓰기 권한이 없으면 `403`이다.

새 `PostInsert`에는 원본의 `boardId`·`content`, 요청의 새 제목, 토큰 회원 ID, 새 시각을 담는다. `insertPost`의 `useGeneratedKeys`가 돌려준 **새 ID**로만 연결 행을 만든다. 원본 행은 UPDATE하지 않는다.

`copyTags=true`일 때만 `findTagsByPostId`로 원본의 태그 ID·DB 저장 이름을 읽고 새 글의 `post_tag`에 연결한다. `false`면 태그 조회·연결을 건너뛴다. 서비스 `@Transactional` 안에서 새 글과 연결을 함께 저장하므로 중간 SQL 실패 시 둘 다 되돌아간다. JPA와 MyBatis 각각 C1~C7, D1에서 새 글 두 행의 작성자·본문·태그 수와 원본 불변을 대조한다.

</details>

## 직접 확인

시드 글 2에는 `spring`, `jpa` 태그가 있다. 같은 원본을 두 번 복사해 한 글에는 태그를 두고 다른 글에는 비워 둔다. 새 글 ID는 매번 달라지므로 응답에서 읽는다.

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

```check
{
  "requests": [
    { "id": "A", "title": "태그까지 복사", "method": "POST", "path": "/api/posts/2/copies?copyTags=true", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "title": "[복사실습] 태그 있음" } },
    { "id": "B", "title": "태그 없이 복사", "method": "POST", "path": "/api/posts/2/copies?copyTags=false", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "title": "[복사실습] 태그 없음" } },
    { "id": "C", "title": "잘못된 옵션", "method": "POST", "path": "/api/posts/2/copies?copyTags=maybe", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "title": "잘못된 옵션" } },
    { "id": "D", "title": "제목 누락", "method": "POST", "path": "/api/posts/2/copies", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": {} },
    { "id": "E", "title": "비공개 원본", "method": "POST", "path": "/api/posts/6/copies", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "title": "비공개 원본" } },
    { "id": "F", "title": "인증 없음", "method": "POST", "path": "/api/posts/2/copies", "body": { "title": "인증 없음" } },
    { "id": "G", "title": "공지 쓰기 권한 없음", "method": "POST", "path": "/api/posts/1/copies", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "title": "공지 복사" } }
  ],
  "checks": [
    { "id": "C1", "request": "A", "expect": { "status": 201, "headers": { "Location": { "contains": "/api/posts/" } }, "json": [{ "path": "$.tags", "length": 2 }, { "path": "$.tags[*]", "contains": "spring" }, { "path": "$.tags[*]", "contains": "jpa" }, { "path": "$.author.id", "equals": 2 }] } },
    { "id": "C2", "request": "B", "expect": { "status": 201, "json": [{ "path": "$.tags", "length": 0 }, { "path": "$.author.id", "equals": 2 }] } },
    { "id": "C3", "request": "C", "expect": { "status": 400 } },
    { "id": "C4", "request": "D", "expect": { "status": 400 } },
    { "id": "C5", "request": "E", "expect": { "status": 404 } },
    { "id": "C6", "request": "F", "expect": { "status": 401 } },
    { "id": "C7", "request": "G", "expect": { "status": 403 } }
  ]
}
```

DB에서 `SELECT p.id,p.title,p.author_id,p.board_id,p.content FROM post p WHERE p.id IN ({A의 id},{B의 id})`와 `SELECT pt.post_id,t.name FROM post_tag pt JOIN tag t ON t.id=pt.tag_id WHERE pt.post_id IN ({A의 id},{B의 id}) ORDER BY pt.post_id,t.name`을 실행한다. A는 태그 2행, B는 0행이고 두 새 글 모두 작성자 2·게시판 2다. `post`와 `post_tag` 저장 중 예외가 나면 두 테이블 모두 새 글이 남지 않아야 한다.

## 채점 기준

| # | 방법 | 기대 |
|---|---|---|
| C1~C2 | 두 종류의 복사 | 각각 `201`·Location; 작성자는 김자바, 태그는 2개/0개 |
| C3~C7 | 잘못된 옵션·제목·원본·인증·쓰기 권한 | `400`·`400`·`404`·`401`·`403` |
| D1 | `post`·`post_tag` JOIN | 원본은 그대로, 새 글 둘의 연결 행만 다름 |
| R1 | 코드 리뷰 | DTO는 제목만, Service가 원본 확인·새 엔티티 생성·트랜잭션을 담당 |

## 필요한 지식

- [1-2. 생성 응답](1-2-dto-response.md)
- [1-3. 여러 테이블 저장](1-3-service-layer.md)
- [1-6. 토큰 작성자](1-6-token-auth.md)
- [1-7. DB 행 확인](1-7-direct-db-dml.md)

## 다음 단계

[1-9. 글의 태그 목록 조회](1-9-list-post-tags.md) — 응답 타입에 쓰이는 제네릭과 Stream 변환을 연습한다.
