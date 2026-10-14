# 10-10. 좋아요 토글

## 상황

| API | 규칙 | 성공 | 실패 |
|---|---|---|---|
| `POST /api/v1/posts/{postId}/like` | 토글: 없으면 생성, 있으면 취소. 응답 `{liked, likeCount}` | 200 | 401, 404 |

하트 버튼 하나다. 누르면 좋아요, 다시 누르면 취소다. 서버는 두 곳을 함께 바꾼다.

- `post_likes`에 (글, 회원) 행을 넣거나 지운다. 기본 키가 두 컬럼이라 한 사람이 한 글에 두 번 들어갈 수 없다.
- `posts.like_count`를 1 올리거나 내린다. 목록의 인기순(10-7)이 이 숫자로 정렬한다.

두 곳이 **함께** 바뀌어야 한다. 하나만 바뀌면 "좋아요 행은 없는데 숫자는 1" 같은 어긋남이 남는다(아래 망가뜨리기 ①에서 직접 만든다). 그래서 한 트랜잭션으로 묶는다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글 상세의 하트 버튼",
  "summary": "하트를 누를 때마다 좋아요와 취소가 번갈아 된다. 응답의 liked·likeCount로 버튼과 숫자를 바꾼다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "[채점] 10-10 좋아요용 글", "right": "김자바" },
    { "type": "stats", "id": "stats", "items": [{ "id": "likes", "label": "좋아요", "value": "0" }] },
    { "type": "actions", "id": "buttons", "items": [{ "id": "heart", "label": "♡ 좋아요", "variant": "secondary" }] },
    { "type": "toast", "id": "toast", "value": "로그인이 필요해요", "tone": "error" }
  ],
  "flows": [
    {
      "name": "처음 누르기",
      "steps": [
        { "kind": "user", "text": "♡를 누른다", "focus": ["heart"] },
        { "kind": "request", "method": "POST", "path": "/api/v1/posts/29/like", "headers": ["Authorization: Bearer (김자바)"] },
        { "kind": "db", "sql": "SELECT ... FROM post_likes WHERE post_id = 29 AND user_id = 1;   -- 없음\nINSERT INTO post_likes (post_id, user_id, created_at) VALUES (29, 1, NOW());\nUPDATE posts SET like_count = like_count + 1 WHERE id = 29;\nSELECT like_count FROM posts WHERE id = 29;", "note": "한 트랜잭션 — 중간에 실패하면 모두 되돌린다" },
        { "kind": "response", "status": 200, "body": "{\n  \"status\": 200,\n  \"message\": \"OK\",\n  \"data\": { \"liked\": true, \"likeCount\": 1 }\n}" },
        { "kind": "screen", "text": "버튼이 ♥로, 숫자가 1로", "focus": ["heart", "likes"] }
      ]
    },
    {
      "name": "다시 누르기(취소)",
      "steps": [
        { "kind": "user", "text": "♥를 다시 누른다", "focus": ["heart"] },
        { "kind": "request", "method": "POST", "path": "/api/v1/posts/29/like", "headers": ["Authorization: Bearer (김자바)"] },
        { "kind": "db", "sql": "DELETE FROM post_likes WHERE post_id = 29 AND user_id = 1;\nUPDATE posts SET like_count = like_count - 1 WHERE id = 29;" },
        { "kind": "response", "status": 200, "body": "{\n  \"status\": 200,\n  \"message\": \"OK\",\n  \"data\": { \"liked\": false, \"likeCount\": 0 }\n}" },
        { "kind": "screen", "text": "버튼이 ♡로, 숫자가 0으로", "focus": ["heart", "likes"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 엔티티 | `PostLike`(`post_likes`) — 기본 키가 `(post_id, user_id)` 두 컬럼. 키 타입 `PostLikeId`를 따로 만들어 `@IdClass`로 연결 |
| 메서드·경로 | `POST /api/v1/posts/{postId}/like`, 로그인 필수 |
| 동작 | 글 확인(없음·삭제·남의 비공개 404) → 좋아요가 있으면 지우고 `like_count - 1`, 없으면 만들고 `like_count + 1` |
| `like_count` | 엔티티 값을 바꾸지 않고 `UPDATE posts SET like_count = like_count + :delta`로 DB에서 바로 |
| 응답 | `200`, `data` = `{liked, likeCount}` — `likeCount`는 바꾼 뒤 DB의 값 |
| 실패 | 토큰 없음 401, 글 없음·삭제·남의 비공개 404 |

**필드 규칙** — 본문이 없는 API라 입력은 경로의 글 id 하나다. 잘못된 입력은 `500`이 나면 안 된다

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `{postId}`(경로) | 필수 | — | `Long` 범위 | 숫자 | — | 숫자가 아니거나 `Long`을 넘으면 `400 VALIDATION_FAILED`(`errors`에 `postId`), 없는 글 `404` |

## 따라 치기

모두 `org.example.board.like` 패키지(새로 만든다). `PostRepository`에는 두 메서드를 더한다.

### PostLikeId — 두 컬럼짜리 키

`src/main/java/org/example/board/like/PostLikeId.java`

```java
package org.example.board.like;

import java.io.Serializable;

// post_likes의 기본 키가 (post_id, user_id) 두 컬럼이라 키를 담을 타입이 따로 필요하다
public record PostLikeId(Long postId, Long userId) implements Serializable {
}
```

| 코드 | 설명 |
|---|---|
| `public record PostLikeId(Long postId, Long userId)` | 키를 이루는 두 값. 이름과 타입이 엔티티의 `@Id` 필드와 같아야 한다 |
| `implements Serializable` | JPA 명세가 키 클래스에 요구한다(키 값을 직렬화할 수 있어야 한다). record는 `equals`·`hashCode`를 값으로 만들어 주므로 키로 쓰기 좋다 |

### PostLike — 엔티티

`src/main/java/org/example/board/like/PostLike.java`

```java
package org.example.board.like;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

@Entity
@Table(name = "post_likes")
@IdClass(PostLikeId.class)
public class PostLike {

    @Id
    @Column(name = "post_id")
    private Long postId;

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected PostLike() {
    }

    public PostLike(Long postId, Long userId) {
        this.postId = postId;
        this.userId = userId;
        this.createdAt = LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS);
    }
}
```

| 코드 | 설명 |
|---|---|
| `@IdClass(PostLikeId.class)` | "이 엔티티의 키는 `PostLikeId` 모양"이라고 알린다 |
| `@Id` 두 번 | `postId`·`userId`가 함께 기본 키다. 연관관계(`@ManyToOne Post`) 대신 id 값만 들고 있다 — 좋아요는 "누가 어느 글에"만 알면 되고, 글·회원 객체를 따라갈 일이 없다 |
| `protected PostLike() { }` | JPA용 빈 생성자 |

### PostLikeRepository

`src/main/java/org/example/board/like/PostLikeRepository.java`

```java
package org.example.board.like;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PostLikeRepository extends JpaRepository<PostLike, PostLikeId> {
}
```

`JpaRepository<PostLike, PostLikeId>` — 두 번째 타입 인자가 키 타입이다. `existsById(new PostLikeId(postId, userId))`, `deleteById(...)`를 그대로 쓴다.

### PostRepository — 두 메서드 추가

`src/main/java/org/example/board/post/PostRepository.java`에 더한다.

```java
    // 좋아요 수도 DB에서 바로 더하고 뺀다
    @Modifying
    @Query("update Post p set p.likeCount = p.likeCount + :delta where p.id = :id "
            + "and p.deletedAt is null and (p.visibility = :publicVisibility or p.author.id = :userId)")
    int changeLikeCount(Long id, Long userId, Visibility publicVisibility, int delta);

    @Query("select p.likeCount from Post p where p.id = :id")
    int findLikeCount(Long id);
```

| 코드 | 설명 |
|---|---|
| `@Modifying` | SELECT가 아니라 UPDATE·DELETE를 실행하는 쿼리라는 표시. 반환값 `int`는 바뀐 행 수 |
| `p.likeCount + :delta` | DB가 한 문장 안에서 더한다. 쓰는 순간에도 글이 삭제되지 않았고 이 사용자가 볼 수 있는지 조건에 넣어 확인한다. 0행이면 관계 변경도 롤백한다 |
| `select p.likeCount ...` | 바꾼 뒤의 숫자를 DB에서 다시 읽는다. 앞에서 읽어 둔 `Post` 엔티티의 `likeCount`는 벌크 UPDATE가 바꿔 주지 않아 옛 값이다 |

### LikeResponse

`src/main/java/org/example/board/like/LikeResponse.java`

```java
package org.example.board.like;

public record LikeResponse(boolean liked, int likeCount) {
}
```

### LikeService

`src/main/java/org/example/board/like/LikeService.java`

```java
package org.example.board.like;

import org.example.board.common.ApiException;
import org.example.board.common.ErrorCode;
import org.example.board.post.Post;
import org.example.board.post.PostRepository;
import org.example.board.post.Visibility;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LikeService {

    private final PostLikeRepository postLikeRepository;
    private final PostRepository postRepository;

    public LikeService(PostLikeRepository postLikeRepository, PostRepository postRepository) {
        this.postLikeRepository = postLikeRepository;
        this.postRepository = postRepository;
    }

    // 토글: 없으면 만들고, 있으면 지운다. like_count도 함께(한 트랜잭션)
    @Transactional
    public LikeResponse toggle(Long userId, Long postId) {
        findVisiblePost(postId, userId);
        PostLikeId id = new PostLikeId(postId, userId);
        boolean liked;
        if (postLikeRepository.existsById(id)) {
            postLikeRepository.deleteById(id);
            if (postRepository.changeLikeCount(postId, userId, Visibility.PUBLIC, -1) == 0)
                throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
            liked = false;
        } else {
            postLikeRepository.save(new PostLike(postId, userId));
            if (postRepository.changeLikeCount(postId, userId, Visibility.PUBLIC, 1) == 0)
                throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
            liked = true;
        }
        return new LikeResponse(liked, postRepository.findLikeCount(postId));
    }

    private Post findVisiblePost(Long postId, Long userId) {
        Post post = postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다."));
        if (post.getVisibility() == Visibility.PRIVATE && !post.getAuthor().getId().equals(userId)) {
            throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
        }
        return post;
    }
}
```

| 코드 | 설명 |
|---|---|
| `@Transactional` | 좋아요 행과 `like_count`를 **함께** 바꾸거나 함께 되돌린다. `@Modifying` 쿼리는 트랜잭션이 없으면 실행조차 안 된다(망가뜨리기 ①) |
| `findVisiblePost(postId, userId)` | 글이 없음·삭제·남의 비공개면 404. 10-9의 댓글과 같은 규칙 |
| `if (postLikeRepository.existsById(id))` | 있으면 → 지우고 −1, 없으면 → 만들고 +1. 이것이 **토글** |
| `postLikeRepository.save(new PostLike(postId, userId))` | 키를 우리가 정해서 넣는 엔티티라, Spring Data는 "새 것인지" 몰라 SELECT로 한 번 확인한 뒤 INSERT한다 |

### LikeController

`src/main/java/org/example/board/like/LikeController.java`

```java
package org.example.board.like;

import org.example.board.auth.LoginUser;
import org.example.board.common.ApiResponse;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LikeController {

    private final LikeService likeService;

    public LikeController(LikeService likeService) {
        this.likeService = likeService;
    }

    @PostMapping("/api/v1/posts/{postId}/like")
    public ApiResponse<LikeResponse> toggle(@LoginUser Long userId, @PathVariable Long postId) {
        return ApiResponse.ok(likeService.toggle(userId, postId));
    }
}
```

경로에 동사(`/like`)가 있지만 메서드는 `POST`다. "토글"은 상태를 정하는 게 아니라 **동작**이라 이렇게 생겼다. 이 모양의 약점은 10-11에서 다룬다.

## 구현 가이드

이 단계의 화면·DB 흐름을 아래 참조 파일과 연결한다. 요구 계약을 먼저 구현하고, 필요한 파일 역할만 펼쳐 전체 코드와 비교한다.

구현 순서에서 확인할 흐름:
- 한 트랜잭션 — 중간에 실패하면 모두 되돌린다

<details>
<summary>Controller</summary>

`LikeController.java`: HTTP 매핑과 입력·응답을 **만들 것**의 계약과 대조한다.

```java
@PostMapping("/api/v1/posts/{postId}/like")
public ApiResponse<LikeResponse> toggle(@LoginUser Long userId, @PathVariable Long postId) {
    return ApiResponse.ok(likeService.toggle(userId, postId));
}
```

</details>

<details>
<summary>DTO / 결과 행</summary>

`LikeResponse.java`: 필드 이름·타입을 요청·응답 예시와 대조한다.

```java
public record LikeResponse(boolean liked, int likeCount) { }
```

</details>

<details>
<summary>Service</summary>

`LikeService.java`: 조회·검증·상태 변경의 순서를 화면 흐름과 대조한다.

```java
@Transactional
public LikeResponse toggle(Long userId, Long postId) {
    findVisiblePost(postId, userId); // 공개 범위·삭제 여부를 확인한다.
    PostLikeId id = new PostLikeId(postId, userId);
    boolean liked;
    if (postLikeRepository.existsById(id)) {
        postLikeRepository.deleteById(id);
        if (postRepository.changeLikeCount(postId, userId, Visibility.PUBLIC, -1) == 0)
            throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
        liked = false;
    } else {
        postLikeRepository.save(new PostLike(postId, userId));
        if (postRepository.changeLikeCount(postId, userId, Visibility.PUBLIC, 1) == 0)
            throw new ApiException(ErrorCode.NOT_FOUND, "게시글을 찾을 수 없습니다.");
        liked = true;
    }
    return new LikeResponse(liked, postRepository.findLikeCount(postId));
}
```

</details>

<details>
<summary>Entity</summary>

`PostLike.java`: 컬럼·관계 매핑을 DB 테이블과 대조한다.

```java
@Entity
@Table(name = "post_likes")
@IdClass(PostLikeId.class)
public class PostLike {
    @Id @Column(name = "post_id") private Long postId;
    @Id @Column(name = "user_id") private Long userId;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;
}
```

</details>

<details>
<summary>설정·보조 코드</summary>

`PostLikeId.java`: 이 파일의 변경이 화면 흐름에 필요한 위치를 확인한다.

```java
public record PostLikeId(Long postId, Long userId) implements Serializable { }
```

</details>

<details>
<summary>JPA / Repository</summary>

`PostLikeRepository.java`, `PostRepository.java`: JPA 조회 조건을 DB 예시와 대조한다.

```java
public interface PostLikeRepository extends JpaRepository<PostLike, PostLikeId> { }

@Modifying
@Query("update Post p set p.likeCount = p.likeCount + :delta where p.id = :id "
        + "and p.deletedAt is null and (p.visibility = :publicVisibility or p.author.id = :userId)")
int changeLikeCount(Long id, Long userId, Visibility publicVisibility, int delta);

@Query("select p.likeCount from Post p where p.id = :id")
int findLikeCount(Long id);
```

</details>

<details>
<summary>MyBatis Mapper — 좋아요 행과 숫자 SQL</summary>

`LikeService`가 글을 확인하고 `post_likes` 존재 여부에 따라 INSERT/DELETE와 카운터 UPDATE를 한 트랜잭션에서 호출한다. 동시 토글의 한계는 아래 망가뜨리기 ③에서 확인하고 10-11에서 멱등 API와 잠금을 배운다. DELETE가 0행이면 다른 요청이 먼저 취소한 것이므로 예외를 던져 카운터 감소를 막는다. 관계 변경 뒤 조건부 카운터 UPDATE가 0행이면 404를 던져 트랜잭션 전체를 롤백한다. 전체 Java/XML은 **MyBatis 대체 코드** 토글을 펼쳐 확인한다.

```java
LikePostRow findVisiblePost(Long postId);
boolean exists(@Param("postId") Long postId, @Param("userId") Long userId);
void insert(@Param("postId") Long postId, @Param("userId") Long userId);
int delete(@Param("postId") Long postId, @Param("userId") Long userId);
int changeCount(@Param("postId") Long postId, @Param("userId") Long userId, @Param("delta") int delta);
int findCount(Long postId);
```

```xml
<select id="findVisiblePost" resultType="org.example.board.like.LikePostRow">
  SELECT p.id, p.author_id AS authorId, p.visibility
  FROM posts p WHERE p.id = #{postId} AND p.deleted_at IS NULL
</select>
<update id="changeCount">
  UPDATE posts SET like_count = like_count + #{delta}
  WHERE id = #{postId} AND deleted_at IS NULL
    AND (visibility = 'PUBLIC' OR author_id = #{userId})
</update>
```

</details>

## 직접 확인

```bash
BASE=http://localhost:8080
KIM=$(curl -s -X POST "$BASE/api/v1/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"kim@example.com","password":"password1234"}' | sed -E 's/.*"accessToken":"([^"]+)".*/\1/')
ID=$(curl -s -X POST "$BASE/api/v1/posts" -H "Authorization: Bearer $KIM" -H 'Content-Type: application/json' \
  -d '{"title":"[채점] 10-10 좋아요용 글"}' | sed -E 's/.*"data":\{"id":([0-9]+).*/\1/')

curl -s -X POST "$BASE/api/v1/posts/$ID/like" -H "Authorization: Bearer $KIM"; echo   # T1 좋아요
curl -s "$BASE/api/v1/posts/$ID" -H "Authorization: Bearer $KIM"; echo              # G1 상세 liked=true
curl -s -X POST "$BASE/api/v1/posts/$ID/like" -H "Authorization: Bearer $KIM"; echo   # T2 취소
curl -s -i -X POST "$BASE/api/v1/posts/$ID/like"; echo                               # N 토큰 없음
curl -s -i -X POST "$BASE/api/v1/posts/999999/like" -H "Authorization: Bearer $KIM"; echo  # X 없는 글
```

DB의 두 숫자가 맞는지 본다.

```bash
docker compose exec -T mysql mysql -ucommunity -pcommunity project -e "
SELECT p.id, p.like_count, (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS rows_
FROM posts p WHERE p.like_count <> (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id);"
```

결과가 비어 있어야 한다(어긋난 글이 없다).

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 매번 새 글을 만들고, 두 번 눌러 0으로 돌려놓는다.

```check
{
  "requests": [
    { "id": "L", "title": "로그인(김자바)", "method": "POST", "path": "/api/v1/auth/login", "body": { "email": "kim@example.com", "password": "password1234" } },
    { "id": "M", "title": "로그인(이스프링)", "method": "POST", "path": "/api/v1/auth/login", "body": { "email": "lee@example.com", "password": "password1234" } },
    { "id": "P", "title": "좋아요용 글 만들기", "method": "POST", "path": "/api/v1/posts", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "body": { "title": "[채점] 10-10 좋아요용 글" } },
    { "id": "T1", "title": "좋아요", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/like", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" } },
    { "id": "G1", "title": "상세 — 누른 뒤", "method": "GET", "path": "/api/v1/posts/{{P.body.data.id}}", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" } },
    { "id": "T2", "title": "다시 누르기(취소)", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/like", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" } },
    { "id": "G2", "title": "상세 — 취소 뒤", "method": "GET", "path": "/api/v1/posts/{{P.body.data.id}}", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" } },
    { "id": "N", "title": "토큰 없음", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/like" },
    { "id": "X", "title": "없는 글", "method": "POST", "path": "/api/v1/posts/999999/like", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" } },
    { "id": "PV", "title": "남의 비공개 글(24)", "method": "POST", "path": "/api/v1/posts/24/like", "headers": { "Authorization": "Bearer {{M.body.data.accessToken}}" } },
    {"id": "V1", "title": "경로 id가 숫자가 아님", "method": "POST", "path": "/api/v1/posts/abc/like", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}},
    {"id": "V2", "title": "경로 id가 Long 범위를 넘음", "method": "POST", "path": "/api/v1/posts/99999999999999999999/like", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}}
  ],
  "checks": [
    { "id": "C1", "request": "T1", "expect": { "status": 200, "json": [{ "path": "$.status", "equals": 200 }, { "path": "$.data", "equals": { "liked": true, "likeCount": 1 } }] } },
    { "id": "C2", "request": "G1", "expect": { "status": 200, "json": [{ "path": "$.data.liked", "equals": true }, { "path": "$.data.likeCount", "equals": 1 }] } },
    { "id": "C3", "request": "T2", "expect": { "status": 200, "json": [{ "path": "$.data", "equals": { "liked": false, "likeCount": 0 } }] } },
    { "id": "C4", "request": "G2", "expect": { "status": 200, "json": [{ "path": "$.data.liked", "equals": false }, { "path": "$.data.likeCount", "equals": 0 }] } },
    {
      "id": "C5",
      "all": [
        { "request": "N", "expect": { "status": 401, "json": [{ "path": "$.code", "equals": "UNAUTHORIZED" }] } },
        { "request": "X", "expect": { "status": 404, "json": [{ "path": "$.code", "equals": "NOT_FOUND" }] } },
        { "request": "PV", "expect": { "status": 404, "json": [{ "path": "$.code", "equals": "NOT_FOUND" }] } }
      ]
    },
    {
      "id": "C6",
      "all": [
        {
          "request": "V1",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "postId"
              },
              {
                "path": "$.code",
                "equals": "VALIDATION_FAILED"
              }
            ]
          }
        },
        {
          "request": "V2",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "postId"
              },
              {
                "path": "$.code",
                "equals": "VALIDATION_FAILED"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 T1 | `200`, `data` = `{liked: true, likeCount: 1}` |
| C2 | 요청 G1 | 상세의 `liked`=`true`, `likeCount`=`1` |
| C3 | 요청 T2 | `200`, `data` = `{liked: false, likeCount: 0}` |
| C4 | 요청 G2 | 상세의 `liked`=`false`, `likeCount`=`0` |
| C5 | 요청 N·X·PV | 토큰 없음 `401`, 없는 글·남의 비공개 글 `404` |
| C6 | V1 / V2 | 경로 `abc`, `99999999999999999999`(Long 초과) 모두 `400 VALIDATION_FAILED`, `errors`에 `postId` — `500`이 아니다 |
| D1 | 위 "두 숫자" 쿼리 | 결과 0행 — 모든 글의 `like_count`가 `post_likes` 행 수와 같다 |
| R1 | 트랜잭션 | 좋아요 행 변경과 `like_count` 변경이 한 `@Transactional` 메서드 안에 있다 |
| R2 | 숫자 갱신 | `like_count`를 엔티티에서 읽고 더해 저장하지 않고 `UPDATE ... + :delta` |

## 일부러 망가뜨리기

하나씩 바꾸고 다시 띄운 뒤 요청을 보낸다. 끝나면 되돌린다. 모두 Boot 4.1.1(Hibernate 7.4)에서 재현했다.

### ① `@Transactional`을 지운다 → 500, 그리고 숫자가 어긋난다

`LikeService.toggle`의 `@Transactional`을 지우고, **이미 좋아요를 누른** 글에 요청을 보낸다.

```text
{"status":500,"message":"서버 오류가 발생했습니다.","code":"INTERNAL_ERROR","errors":[],"data":null}
```

로그:

```text
org.springframework.dao.InvalidDataAccessApiUsageException: No active transaction for update or delete query
...
Caused by: jakarta.persistence.TransactionRequiredException: No active transaction for update or delete query
```

그 글의 두 숫자를 본다.

```bash
docker compose exec -T mysql mysql -ucommunity -pcommunity project \
  -e "SELECT (SELECT COUNT(*) FROM post_likes WHERE post_id = <글 id>) AS likes_rows, like_count FROM posts WHERE id = <글 id>;"
```

```text
likes_rows	like_count
0	1
```

- 읽는 법: `existsById`·`deleteById`는 Spring Data가 **각자** 작은 트랜잭션을 열어 실행하고 바로 커밋한다. 그래서 좋아요 행은 지워졌다. 그다음 `@Modifying` 쿼리는 트랜잭션이 없어서 실행을 거부했다. 결과는 500인데 **절반만 반영됐다**. 행은 0개인데 숫자는 1이다.
- 고치기: `@Transactional`을 되돌린다. 어긋난 숫자는 `UPDATE posts SET like_count = (SELECT COUNT(*) FROM post_likes WHERE post_id = posts.id) WHERE id = <글 id>`로 맞춘다(실습 DB라면 `--reset`).

### ② `@IdClass`를 지운다 → 앱이 뜨지 않는다

```text
Caused by: org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'postLikeRepository' defined in org.example.board.like.PostLikeRepository defined in @EnableJpaRepositories declared on DataJpaRepositoriesRegistrar.EnableJpaRepositoriesConfiguration: This class [class org.example.board.like.PostLike] does not define an IdClass
...
Caused by: java.lang.IllegalArgumentException: This class [class org.example.board.like.PostLike] does not define an IdClass
```

- 읽는 법: `@Id`가 둘인데 키 타입을 알려 주지 않았다. 저장소(`JpaRepository<PostLike, PostLikeId>`)를 만들다가 "이 엔티티의 키 클래스가 뭐냐"에서 멈췄다.
- 고치기: `@IdClass(PostLikeId.class)`를 되돌린다.

### ③ 같은 글에 두 번을 **동시에** 보낸다 → 한쪽이 500

망가뜨린 것은 없다. 정답 코드 그대로 두고, 같은 토큰으로 두 요청을 동시에 보낸다.

```bash
for i in 1 2; do curl -s -X POST "$BASE/api/v1/posts/$ID/like" -H "Authorization: Bearer $KIM" & done; wait; echo
```

```text
{"status":200,"message":"OK","data":{"liked":true,"likeCount":1}}{"status":500,"message":"서버 오류가 발생했습니다.","code":"INTERNAL_ERROR","errors":[],"data":null}
```

로그:

```text
WARN ... org.hibernate.orm.jdbc.error : Duplicate entry '29-1' for key 'post_likes.PRIMARY'
```

두 요청이 모두 "아직 없다"를 보고 둘 다 INSERT했다. 기본 키가 두 번째를 막았다. 더블클릭 한 번이면 생기는 일이다. 다음 단계에서 이 문제를 고친다.

## 필요한 지식

- [G3 트랜잭션 첫 만남](../../lessons/G3-first-transaction.md) — 둘 이상 쓰면 한 트랜잭션
- [H1 동시성 맛보기](../../lessons/H1-concurrency-taste.md) — 두 요청이 동시에 오면
- [B4 record·getter·불변](../../lessons/B4-record-getter-immutable.md) — record의 `equals`·`hashCode`
- [P20 JPA 엔티티 매핑](../../docs/knowledge/P20-jpa-entity-mapping.md) — 복합 키 `@IdClass`
- [4-1. 좋아요 토글](../ch4-like/4-1-like-toggle.md) — 1~9장의 같은 기능(다른 API 모양)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 저장소를 만들 때 키 타입</summary>

`JpaRepository<엔티티, 키 타입>`의 키 타입은 `@IdClass`에 적은 클래스다. `Long`이 아니다.
</details>

<details>
<summary>힌트 2 — 응답의 likeCount가 늘 옛 값이다</summary>

`findVisiblePost`로 읽은 `Post` 엔티티의 `getLikeCount()`를 응답에 쓰면, 벌크 UPDATE 전에 읽은 값이 나온다. 바꾼 뒤 `select p.likeCount ...`로 DB에서 다시 읽는다.
</details>

## 다음 단계

[10-11. 토글의 문제와 멱등 API](10-11-idempotent-like.md) — 망가뜨리기 ③처럼 동시·재시도에 약한 토글 옆에, 몇 번을 보내도 결과가 같은 `PUT`·`DELETE`를 v2로 연다.
