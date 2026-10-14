# 4-0. 좋아요 설정 — 관계 행 하나와 숫자 하나

## 상황

> "좋아요 버튼을 눌렀는데 새로고침해도 유지되어야 해요. 두 번 눌러도 좋아요가 두 개가 되면 안 돼요."

먼저 **좋아요 상태로 만드는 PUT 하나**만 구현한다. 취소 DELETE는 4-1에서 붙인다. 같은 URL과 응답 DTO를 쓰므로 이번 구현이 다음 단계의 출발점이다.

## 화면 시나리오

```screen
{
  "title": "좋아요 한 번 저장",
  "summary": "사용자와 글의 관계 행을 만들고 글의 좋아요 수를 맞춘다.",
  "screen": [
    { "type": "text", "id": "post", "value": "인덱스는 언제 타나요?", "emphasis": "title" },
    { "type": "actions", "id": "like", "items": [{ "id": "tap", "label": "좋아요", "variant": "primary" }] },
    { "type": "stats", "id": "count", "items": [{ "id": "likes", "label": "좋아요", "value": "1" }] }
  ],
  "flows": [{
    "name": "처음 누르기",
    "steps": [
      { "kind": "user", "text": "좋아요를 누른다", "focus": ["tap"] },
      { "kind": "request", "method": "PUT", "path": "/api/posts/3/like", "headers": ["Authorization: Bearer tok-kimjava"] },
      { "kind": "server", "text": "서비스가 볼 수 있는 남의 글인지 확인하고 관계가 없을 때만 저장한다" },
      { "kind": "db", "sql": "INSERT INTO post_like (post_id, member_id, created_at) VALUES (3,2,NOW()); UPDATE post SET like_count=like_count+1 WHERE id=3", "note": "두 쓰기는 한 트랜잭션" },
      { "kind": "response", "status": 200, "body": "{\"postId\":3,\"liked\":true,\"likeCount\":1}" },
      { "kind": "screen", "text": "숫자 1을 표시한다", "focus": ["count"] }
    ]
  }]
}
```

## 만들 것

| 항목 | 계약 |
|---|---|
| 메서드·경로 | `PUT /api/posts/{id}/like`, 본문 없음. 회원 ID는 토큰에서 가져온다. |
| 성공 | `200` `{ "postId": 3, "liked": true, "likeCount": 1 }`. 이미 눌렀어도 `200`, 수는 그대로다. |
| 실패 | 내 글 `400`, 토큰 없음 `401`, 정지 회원 `403`, 없는·볼 수 없는·미발행 글 `404`. 경로 ID 형식 오류는 `400`. |
| DB | `post_like(post_id, member_id)`에 최대 한 행. 새 행을 넣었을 때만 `post.like_count`를 1 늘린다. |

`post_like`에는 `UNIQUE(post_id, member_id)`가 있다. Controller는 경로 ID만 받고, Service는 2-3의 읽기 권한과 작성자 여부를 확인한다.

Repository의 `existsByPostIdAndMemberId` 같은 조회로 현재 상태를 확인하되, **존재 확인과 두 쓰기를 한 트랜잭션**에 둔다. 요청 둘이 동시에 도착하는 문제는 4-2에서 다룬다. 응답은 엔티티가 아니라 `postId`·`liked`·`likeCount`만 가진 DTO다.

## 구현 가이드

한 번 누른 뒤 같은 PUT을 다시 보내는 순서로 만든다. 처음 요청만 관계 행과 숫자를 바꾸고 두 번째는 조회 결과를 돌려준다.

<details>
<summary>Controller — 경로 ID와 토큰 회원 받기</summary>

```java
@PutMapping("/{id}/like")
public LikeResponse like(@PathVariable Long id,
        @LoginMember AuthenticatedMember loginMember) {
    return likeService.setLiked(id, loginMember);
}
```

본문의 회원 ID나 좋아요 수를 받지 않는다. 기존 Controller의 `/api/posts` 클래스 경로 안에 놓는다.

</details>

<details>
<summary>DTO — 저장 결과의 세 값만 반환</summary>

```java
public record LikeResponse(Long postId, boolean liked, long likeCount) { }
```

`liked`는 이 PUT이 성공했으므로 `true`다. `likeCount`는 요청 횟수가 아니라 DB에 저장된 글의 값이다.

</details>

<details>
<summary>Service — 관계가 없을 때만 두 쓰기</summary>

`@Transactional` 안에서 글 가시성·본인 글 여부를 검사한 다음 회원과 글의 좋아요 관계를 조회한다. 관계가 없을 때만 `PostLike`를 저장하고 `post.likeCount`를 1 늘린다. 이미 있으면 아무것도 쓰지 않고 같은 응답을 반환한다.

```java
boolean alreadyLiked = likes.existsByPost_IdAndMember_Id(postId, me.id());
if (!alreadyLiked) {
    likes.save(new PostLike(post, members.getReferenceById(me.id()), LocalDateTime.now()));
    post.increaseLikeCount();
}
```

생성자와 숫자 변경 메서드는 실습 엔티티에 맞춰 작성한다. 동시에 두 요청이 들어오는 경우는 4-2에서 유일 제약·잠금을 더해 해결한다.

</details>

<details>
<summary>JPA / Repository — 관계 행과 숫자를 검산</summary>

`existsByPost_IdAndMember_Id`가 생성하는 조건은 `(post_id, member_id)`다. JPA 저장 뒤 `post_like`의 행 수와 `post.like_count`를 함께 확인한다.

```sql
SELECT COUNT(*) FROM post_like WHERE post_id = 3 AND member_id = 2;
SELECT like_count FROM post WHERE id = 3;
```

두 번째 PUT이 UPDATE를 다시 실행하지 않는지 SQL 로그를 본다.

</details>

<details>
<summary>MyBatis / Mapper — 관계 행과 개수를 함께 저장</summary>

MyBatis 대체 구현은 `PostVisibilityMapper.findVisibleDetail`로 볼 수 있는 글인지 확인하고, `MyBatisLikeMapper`에서 발행 상태·기존 관계를 읽는다. `MyBatisLikeService`의 `@Transactional` 안에서 처음 누른 경우에만 아래 두 SQL을 실행한다. 작성자는 토큰의 `AuthenticatedMember`에서 받는다.

```xml
<insert id="insertLike">
  INSERT INTO post_like(post_id, member_id, created_at)
  VALUES (#{postId}, #{memberId}, CURRENT_TIMESTAMP)
</insert>
<update id="increaseLikeCount">
  UPDATE post SET like_count = like_count + 1 WHERE id = #{postId}
</update>
```

실행 가능한 Controller·Service·Mapper Java/XML과 테스트의 파일 전문은 아래 MyBatis 역할별 코드 접기에 있다. 같은 요청을 두 번 보내고 `post_like` 한 행·`like_count` 한 번 증가를 DB에서 비교한다.

</details>

## 직접 확인

시드의 글 3은 박디비의 공개 글이고, 김자바의 좋아요가 없다. 반복 실행 전 4-1에서 만들 DELETE로 정리하거나 다른 본인 테스트 글을 사용한다. `likeCount`의 절대값은 이전 실습에 따라 바뀔 수 있으니 두 PUT 사이 값이 **같은지** 확인한다.

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

```check
{
  "requests": [
    { "id": "A", "title": "좋아요 설정", "method": "PUT", "path": "/api/posts/3/like", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "B", "title": "한 번 더 설정", "method": "PUT", "path": "/api/posts/3/like", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "P", "title": "내 글 만들기", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "boardSlug": "dev", "title": "[좋아요실습] 내 글", "content": "내 글에는 좋아요를 누를 수 없습니다.", "tags": [], "visibility": "PUBLIC" } },
    { "id": "C", "title": "내 글", "method": "PUT", "path": "/api/posts/{{P.body.id}}/like", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "D", "title": "인증 없음", "method": "PUT", "path": "/api/posts/3/like" },
    { "id": "E", "title": "없는 글", "method": "PUT", "path": "/api/posts/999999/like", "headers": { "Authorization": "Bearer tok-kimjava" } }
  ],
  "checks": [
    { "id": "C1", "request": "A", "expect": { "status": 200, "json": [{ "path": "$.postId", "equals": 3 }, { "path": "$.liked", "equals": true }, { "path": "$.likeCount", "type": "number" }] } },
    { "id": "C2", "request": "B", "expect": { "status": 200, "json": [{ "path": "$.likeCount", "equals": "{{A.body.likeCount}}" }] } },
    { "id": "C3", "all": [{ "request": "P", "expect": { "status": 201 } }, { "request": "C", "expect": { "status": 400 } }] },
    { "id": "C4", "request": "D", "expect": { "status": 401 } },
    { "id": "C5", "request": "E", "expect": { "status": 404 } }
  ]
}
```

SQL로 `SELECT COUNT(*) FROM post_like WHERE post_id=3 AND member_id=2`가 1인지 확인한다. `SELECT p.like_count, (SELECT COUNT(*) FROM post_like l WHERE l.post_id=p.id) AS actual FROM post p WHERE p.id=3`의 두 값도 같아야 한다. 자동 검사는 HTTP 계약을, SQL은 저장 결과를 확인한다.

## 채점 기준

| # | 방법 | 기대 |
|---|---|---|
| C1~C2 | 연속 PUT | 모두 `200`, `liked=true`, 숫자는 두 번째에 늘지 않는다 |
| C3~C5 | 내 글·인증 없음·없는 글 | `400`·`401`·`404` |
| D1 | `post_like`와 `post.like_count` | 관계 행 한 개, 전체 행 수와 저장된 개수가 같다 |
| R1 | 코드 리뷰 | 토큰의 회원을 사용하고 관계 저장·개수 갱신을 하나의 서비스 트랜잭션으로 묶는다 |

## 필요한 지식

- [2-3. 조회 권한](../ch2-read-post/2-3-visibility.md)
- [1-7. 여러 테이블의 행](../ch1-create-post/1-7-direct-db-dml.md)

## 다음 단계

[4-1. 좋아요·취소](4-1-like-toggle.md) — DELETE와 반복 취소를 붙여 상태를 완성한다.
