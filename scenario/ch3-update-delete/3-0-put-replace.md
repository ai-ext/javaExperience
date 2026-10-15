# 3-0. PUT으로 게시글 전체 교체

## 상황

> "수정 화면에서 제목·본문·태그를 모두 다시 보냈어요. 서버도 그 값으로 글 전체를 바꿔 주세요."

1장에서 만든 글 하나를 `PUT`으로 **전체 교체**한다. 기존 `PATCH` 과제(3-1)는 보낸 칸만 바꾸지만, 여기서는 수정 폼의 새 상태를 모두 보낸다. 게시판은 이 API에서 옮기지 않는다.

## 화면 시나리오

```screen
{
  "title": "게시글 전체 수정",
  "summary": "수정 폼의 제목·본문·태그·공개 범위를 한 번에 보낸다.",
  "screen": [
    { "type": "field", "id": "title", "label": "제목", "value": "[PUT실습] 새 제목" },
    { "type": "field", "id": "content", "label": "본문", "value": "수정한 본문" },
    { "type": "chips", "id": "tags", "label": "태그", "items": ["java"] },
    { "type": "actions", "id": "save", "items": [{ "id": "submit", "label": "모두 저장", "variant": "primary" }] }
  ],
  "flows": [{
    "name": "내 글 교체",
    "steps": [
      { "kind": "user", "text": "수정 폼의 모든 값을 확인하고 저장한다", "focus": ["submit"] },
      { "kind": "request", "method": "PUT", "path": "/api/posts/22", "headers": ["Authorization: Bearer tok-kimjava"], "body": "{\"title\":\"[PUT실습] 새 제목\",\"content\":\"수정한 본문\",\"tags\":[\"java\"],\"visibility\":\"PUBLIC\"}" },
      { "kind": "server", "text": "서비스가 작성자를 확인하고 글 필드와 태그 연결 행을 같은 트랜잭션에서 교체한다" },
      { "kind": "db", "sql": "UPDATE post SET title='[PUT실습] 새 제목', content='수정한 본문' WHERE id=22; DELETE FROM post_tag WHERE post_id=22; INSERT INTO post_tag (post_id,tag_id) VALUES (22,1)", "note": "실제 SQL은 JPA 구현에 따라 다르며 변경 결과를 확인한다" },
      { "kind": "response", "status": 200, "body": "{\"id\":22,\"title\":\"[PUT실습] 새 제목\",\"content\":\"수정한 본문\",\"tags\":[\"java\"]}" }
    ]
  }]
}
```

## 만들 것

| 항목 | 계약 |
|---|---|
| 메서드·경로 | `PUT /api/posts/{id}`. `{id}`는 수정할 글, 작성자는 토큰에서 가져온다. |
| 요청 DTO | `title`·`content`는 필수, `tags`는 생략 시 빈 목록, `visibility`는 생략 시 `PUBLIC`. `boardSlug`를 받아 게시판을 옮기지 않는다. |
| 성공 | `200`, 2-1의 상세 DTO 형식. `id`·작성자·게시판은 그대로이고 제목·본문·태그·공개 범위는 새 값이다. |
| 실패 | 잘못된 필수값·태그·공개 범위 `400`, 토큰 없음 `401`, 보이는 남의 글 `403`, 없는/볼 수 없는 글 `404`. |
| 저장 | `post` 변경과 `post_tag` 연결 교체를 한 서비스 트랜잭션에서 처리한다. 검증 실패 시 두 테이블 모두 이전 상태다. |

1-5의 길이 규칙(제목 1~200, 태그 최대 5개·각 1~30)을 그대로 쓴다. 본문은 공백만이면 안 된다. 이 단계에서 `{"title":"새 제목"}`만 보내면 본문이 없어서 `400`이다. `tags`를 생략하거나 `[]`로 보내면 기존 태그가 모두 빠진다. `visibility`를 생략하면 기존 값 유지가 아니라 `PUBLIC`이 된다. 이 동작이 3-1 `PATCH`와 다르다.

Controller는 `@PathVariable`·`@Valid @RequestBody`로 입력을 받고 상세 DTO를 돌려준다. DTO의 태그 목록을 엔티티에 직접 대입하기 전에 Service에서 태그 이름을 확인한다. 작성자 판단은 요청 본문의 `authorId`를 믿지 않고 1-6의 인증 결과로 한다. `@Transactional` 안에서 글 수정과 연결 행 교체를 끝낸다.

## 구현 가이드

먼저 태그를 빼고 제목·본문·공개 범위의 전체 교체를 만든다. 그다음 태그 연결을 교체하고 실패 시 원상태가 유지되는지 확인한다.

<details>
<summary>Controller — 글 ID와 전체 요청 DTO 받기</summary>

기존 `PostController`의 `/api/posts` 아래에 PUT 매핑을 추가한다. 작성자는 본문이 아니라 토큰의 회원이다.

```java
@PutMapping("/{id}")
public PostDetailResponse replace(@PathVariable Long id,
        @LoginMember AuthenticatedMember loginMember,
        @Valid @RequestBody PostReplaceRequest request) {
    return postService.replace(id, loginMember, request);
}
```

없는 글과 볼 수 없는 글을 `404`, 볼 수 있는 남의 글을 `403`으로 나누는 판단은 Service에 둔다.

</details>

<details>
<summary>DTO — 필수값과 생략 시 기본값</summary>

`PATCH`의 DTO를 재사용하지 않는다. PUT에는 제목과 본문이 항상 필요하다. 다음은 생략한 두 선택값을 정규화하는 부분이다.

```java
public record PostReplaceRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank String content,
        @Size(max = 5) List<@NotBlank @Size(max = 30) String> tags,
        @Pattern(regexp = "PUBLIC|FOLLOWERS") String visibility) {
    public PostReplaceRequest {
        tags = tags == null ? List.of() : tags;
        visibility = visibility == null ? "PUBLIC" : visibility;
    }
}
```

태그 개수·각 이름 길이와 공개 범위 허용값도 1-5의 규칙을 적용한다. 응답은 기존 2-1 상세 DTO를 쓴다.

</details>

<details>
<summary>MyBatis / Mapper — 글과 연결 태그를 한 트랜잭션에서 교체</summary>

전체 코드 접기의 MyBatis 대체 구현은 `PostReplaceMyBatisService`가 PUT을 받고, `PostVisibilityMapper.findVisibleDetail`로 먼저 가시성과 작성자를 확인한다. `PostReplaceMapper`는 태그 이름을 기존 ID로 정규화하고 아래 세 쓰기를 실행한다. `@Transactional`이 Service 메서드에 있으므로 중간 쓰기 실패 시 모두 롤백된다.

```xml
<update id="updatePost">
  UPDATE post SET title = #{title}, content = #{content},
                  visibility = #{visibility}, updated_at = CURRENT_TIMESTAMP
  WHERE id = #{id}
</update>
<delete id="deletePostTags">
  DELETE FROM post_tag WHERE post_id = #{postId}
</delete>
<insert id="insertPostTag">
  INSERT INTO post_tag(post_id, tag_id) VALUES (#{postId}, #{tagId})
</insert>
```

같은 이름을 대소문자만 바꿔 중복 전송해도 `tag`의 기존 행 하나만 연결한다. Mapper는 `Tag`의 DB 표기명과 ID를 읽고 중복 ID를 제거한다. 완전한 Service·Mapper Java/XML·테스트 파일은 이 가이드 뒤의 역할별 코드 접기에 있다.

</details>

<details>
<summary>Service — 권한 검사 후 한 트랜잭션에서 교체</summary>

`@Transactional` 메서드에서 글 조회·가시성·작성자·입력 태그를 **쓰기 전에** 확인한다. 그 뒤 제목·본문·공개 범위를 바꾸고 기존 태그 연결을 지운 다음 요청 태그만 연결한다. 본문에 `authorId`나 `boardSlug`가 있어도 작성자·게시판을 옮기지 않는다.

```java
Post post = postRepository.findById(id).orElseThrow(PostNotFoundException::new);
// 먼저 2-3의 가시성 규칙을 적용한다.
if (!post.getAuthor().getId().equals(memberId)) {
    throw new ResponseStatusException(HttpStatus.FORBIDDEN);
}
// 요청값 전체를 검증한 뒤에만 post와 태그 연결을 바꾼다.
```

검증 실패 요청 V 뒤에 GET 요청 G가 여전히 새 제목·본문·`java` 태그를 돌려주는지 본다. 여러 테이블 중 하나에서 예외가 나면 트랜잭션 전체가 롤백되어야 한다.

</details>

<details>
<summary>JPA / Repository — 변경 감지와 연결 행 확인</summary>

관리 중인 `Post` 엔티티의 필드를 바꾸면 JPA가 flush할 때 `post`의 UPDATE를 만든다. 태그 연결 컬렉션을 교체하면 `post_tag`의 이전 연결이 빠지고 새 연결이 들어간다. 실제 SQL 순서는 매핑에 따라 다르므로 결과 행으로 확인한다.

```sql
SET @post_id = 22; -- 실제 생성 응답 id로 교체
SELECT p.id, p.title, p.content, p.visibility, p.author_id, p.board_id
FROM post p WHERE p.id = @post_id;
SELECT t.name FROM post_tag pt
JOIN tag t ON t.id = pt.tag_id
WHERE pt.post_id = @post_id ORDER BY t.name;
```

MyBatis라면 `UPDATE post`와 `DELETE/INSERT post_tag`를 같은 `@Transactional` Service 메서드에서 호출한다. 두 방식 모두 실패 후 결과가 같아야 한다.

</details>

## 직접 확인

먼저 내 글을 만든 뒤 응답 `id`를 아래 `X`에 넣는다. 3-1의 PATCH와 비교할 때는 별도 글을 만들어 원래 본문·태그가 어떻게 달라지는지 본다.

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

```check
{
  "requests": [
    { "id": "P", "title": "내 글 만들기", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "boardSlug": "dev", "title": "[PUT실습] 이전 제목", "content": "이전 본문", "tags": ["spring"], "visibility": "FOLLOWERS" } },
    { "id": "U", "title": "전체 교체(공개 범위 기본값)", "method": "PUT", "path": "/api/posts/{{P.body.id}}", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "title": "[PUT실습] 새 제목", "content": "수정한 본문", "tags": ["java"] } },
    { "id": "V", "title": "본문 누락", "method": "PUT", "path": "/api/posts/{{P.body.id}}", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "title": "제목만" } },
    { "id": "G", "title": "실패 뒤 다시 조회", "method": "GET", "path": "/api/posts/{{P.body.id}}", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "F", "title": "남의 글 교체", "method": "PUT", "path": "/api/posts/{{P.body.id}}", "headers": { "Authorization": "Bearer tok-lee" }, "body": { "title": "남의 수정", "content": "본문" } },
    { "id": "A", "title": "인증 없음", "method": "PUT", "path": "/api/posts/{{P.body.id}}", "body": { "title": "인증 없음", "content": "본문" } },
    { "id": "N", "title": "없는 글", "method": "PUT", "path": "/api/posts/999999", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "title": "없는 글", "content": "본문" } }
  ],
  "checks": [
    { "id": "C1", "request": "P", "expect": { "status": 201 } },
    { "id": "C2", "request": "U", "expect": { "status": 200, "json": [{ "path": "$.title", "equals": "[PUT실습] 새 제목" }, { "path": "$.content", "equals": "수정한 본문" }, { "path": "$.tags[*]", "equals": ["java"] }, { "path": "$.visibility", "equals": "PUBLIC" }] } },
    { "id": "C3", "request": "V", "expect": { "status": 400 } },
    { "id": "C4", "request": "G", "expect": { "status": 200, "json": [{ "path": "$.title", "equals": "[PUT실습] 새 제목" }] } },
    { "id": "C5", "request": "F", "expect": { "status": 403 } },
    { "id": "C6", "request": "A", "expect": { "status": 401 } },
    { "id": "C7", "request": "N", "expect": { "status": 404 } }
  ]
}
```

자동 확인의 U는 `visibility`를 일부러 생략해, 처음 `FOLLOWERS`였던 글이 기본값 `PUBLIC`이 되는지도 확인한다. 그래서 U 뒤 이스프링은 글을 볼 수 있지만 작성자가 아니므로 F에서 `403`을 받는다.

DB에서도 `SELECT title, content, visibility FROM post WHERE id = {X}`와 `SELECT t.name FROM post_tag pt JOIN tag t ON t.id=pt.tag_id WHERE pt.post_id={X}`를 실행한다. `V` 뒤에도 새 제목과 `java` 태그가 남아야 한다. 조회에는 **실제 응답 id**를 넣는다.

## 채점 기준

| # | 방법 | 기대 |
|---|---|---|
| C1~C2 | 생성·PUT | `201` 뒤 `200`, 상세 DTO에 새 필드 값 |
| C3~C4 | 누락된 본문·재조회 | `400`, 직전 성공 값 유지 |
| C5~C7 | 남의 글·인증 없음·없는 글 | `403`·`401`·`404` |
| D1 | `post`·`post_tag` SELECT | 글 필드와 연결 태그가 함께 새 값. 실패 요청 뒤에도 그대로 |
| R1 | 코드 리뷰 | Controller 입력 DTO와 상세 응답 DTO를 구분하고, Service가 작성자 확인과 트랜잭션을 맡는다 |

## 필요한 지식

- [1-5. 입력 검증](../ch1-create-post/1-5-validation.md)
- [2-3. 볼 수 있는 글](../ch2-read-post/2-3-visibility.md)
- [1-7. 여러 테이블 확인](../ch1-create-post/1-7-direct-db-dml.md)

## 다음 단계

[3-1. 부분 수정](3-1-patch.md) — 일부 필드만 보내는 PATCH와 결과를 비교한다.
