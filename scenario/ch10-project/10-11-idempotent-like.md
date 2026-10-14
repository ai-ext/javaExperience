# 10-11. 토글의 문제 — 멱등 PUT/DELETE를 v2로 나란히

## 상황

10-10의 토글은 화면에서 잘 동작했다. 그런데 운영을 시작하자 문의가 들어온다.

> "좋아요를 눌렀는데 가끔 안 눌려 있어요." "가끔 에러 토스트가 떠요."

원인은 세 가지 상황이다.

| 상황 | 토글에서 생기는 일 |
|---|---|
| **재시도** — 모바일 네트워크가 느려 응답을 못 받자 앱이 같은 요청을 다시 보냄 | 서버는 두 번 다 처리했다. 좋아요 → 취소. 사용자는 한 번 눌렀는데 결과는 "안 누름" |
| **더블클릭** | 재시도와 같다 |
| **동시 도착** — 두 요청이 거의 같은 순간 | 둘 다 "없다"를 보고 둘 다 INSERT → 한쪽 500(`Duplicate entry`, 10-10 망가뜨리기 ③) |

토글은 **같은 요청을 두 번 보내면 결과가 달라지는** API다. 요청 하나가 "지금 상태를 뒤집어라"라는 **동작**이기 때문이다. 해결은 요청이 **원하는 상태**를 말하게 하는 것이다.

- `PUT .../like` — "좋아요 **된 상태**로 해라". 이미 그렇다면 아무것도 안 하고 성공한다.
- `DELETE .../like` — "좋아요 **안 된 상태**로 해라". 이미 그렇다면 역시 성공한다.

몇 번을 보내도 결과가 같은 성질을 **멱등(idempotent)** 이라고 한다. HTTP 명세가 `PUT`·`DELETE`를 멱등 메서드로 정한 이유가 이것이다. 재시도해도 안전하다.

**왜 v2인가.** 이미 나간 앱은 `POST /api/v1/posts/{id}/like`(토글)를 부른다. 같은 주소의 의미를 바꾸면 옛 앱이 깨진다. 그래서 새 계약은 **새 버전 경로**(`/api/v2/...`)로 열고, v1 토글은 그대로 둔다. 새 화면은 v2를 쓰고, 옛 앱이 사라지면 v1을 닫는다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글 상세의 하트 버튼(새 앱)",
  "summary": "새 앱은 지금 버튼 상태를 보고 PUT(누르기) 또는 DELETE(취소)를 보낸다. 응답이 늦어 다시 보내도 결과가 같다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "[채점] 10-11 멱등", "right": "김자바" },
    { "type": "stats", "id": "stats", "items": [{ "id": "likes", "label": "좋아요", "value": "1" }] },
    { "type": "actions", "id": "buttons", "items": [{ "id": "heart", "label": "♡ 좋아요", "variant": "secondary" }] },
    { "type": "toast", "id": "toast", "value": "네트워크가 느려 다시 보냈어요", "tone": "warning" }
  ],
  "flows": [
    {
      "name": "토글 + 재시도(옛 앱)",
      "steps": [
        { "kind": "user", "text": "♡를 한 번 눌렀는데 응답이 늦어 앱이 자동으로 다시 보낸다", "focus": ["heart", "toast"] },
        { "kind": "request", "method": "POST", "path": "/api/v1/posts/40/like", "headers": ["Authorization: Bearer (김자바)"] },
        { "kind": "request", "method": "POST", "path": "/api/v1/posts/40/like", "headers": ["Authorization: Bearer (김자바)"] },
        { "kind": "response", "status": 200, "body": "첫 번째: { \"liked\": true,  \"likeCount\": 1 }\n두 번째: { \"liked\": false, \"likeCount\": 0 }" },
        { "kind": "screen", "text": "한 번 눌렀는데 결과는 '안 누름'", "focus": ["likes"] }
      ]
    },
    {
      "name": "PUT + 재시도(새 앱)",
      "steps": [
        { "kind": "user", "text": "♡를 한 번 눌렀는데 앱이 다시 보낸다", "focus": ["heart", "toast"] },
        { "kind": "request", "method": "PUT", "path": "/api/v2/posts/40/like", "headers": ["Authorization: Bearer (김자바)"] },
        { "kind": "db", "sql": "SELECT ... FROM posts WHERE id = 40 FOR UPDATE;           -- 같은 글의 좋아요 요청은 여기서 줄을 선다\nINSERT IGNORE INTO post_likes (post_id, user_id, created_at) VALUES (40, 1, NOW());\n-- 바뀐 행 1이면\nUPDATE posts SET like_count = like_count + 1 WHERE id = 40;", "note": "두 번째 요청은 INSERT IGNORE가 0행 — 숫자를 건드리지 않는다" },
        { "kind": "response", "status": 200, "body": "첫 번째: { \"liked\": true, \"likeCount\": 1 }\n두 번째: { \"liked\": true, \"likeCount\": 1 }" },
        { "kind": "screen", "text": "몇 번을 보내도 ♥, 1", "focus": ["heart", "likes"] }
      ]
    },
    {
      "name": "취소(DELETE)",
      "steps": [
        { "kind": "user", "text": "♥를 눌러 취소", "focus": ["heart"] },
        { "kind": "request", "method": "DELETE", "path": "/api/v2/posts/40/like", "headers": ["Authorization: Bearer (김자바)"] },
        { "kind": "db", "sql": "DELETE FROM post_likes WHERE post_id = 40 AND user_id = 1;   -- 없으면 0행, 에러 아님\n-- 바뀐 행 1이면\nUPDATE posts SET like_count = like_count - 1 WHERE id = 40;" },
        { "kind": "response", "status": 200, "body": "{ \"status\": 200, \"data\": { \"liked\": false, \"likeCount\": 0 } }" },
        { "kind": "screen", "text": "♡, 0", "focus": ["heart", "likes"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| `PUT /api/v2/posts/{postId}/like` | 로그인 필수. 좋아요가 없으면 만들고 `like_count + 1`, 있으면 아무것도 안 한다. `200`, `data` = `{liked: true, likeCount}` |
| `DELETE /api/v2/posts/{postId}/like` | 로그인 필수. 있으면 지우고 `like_count - 1`, 없으면 아무것도 안 한다. `200`, `data` = `{liked: false, likeCount}` |
| 동시 | 같은 회원이 같은 글에 `PUT`을 동시에 10번 보내도 **모두 `200`**, 최종 `likeCount`는 1(한 번만 셈). `DELETE`도 같다 |
| 실패 | 토큰 없음 401, 글 없음·삭제·남의 비공개 404 |
| v1 | `POST /api/v1/posts/{postId}/like`(토글)는 **그대로 둔다** |
| CORS·인터셉터 | 둘 다 `/api/**`라 v2도 그대로 적용된다(`PUT`·`DELETE`는 10-1에서 이미 열었다) |

명세서는 10-1에서 "토글"로 시작했다. 이 단계는 명세 변경이다. "좋아요 v2 = PUT/DELETE `/api/v2/posts/{postId}/like`, v1 토글과 공존"을 명세서에 한 줄 더한 것으로 본다.

**필드 규칙** — 본문이 없는 API라 입력은 경로의 글 id 하나다(v1과 같다)

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `{postId}`(경로) | 필수 | — | `Long` 범위 | 숫자 | — | 숫자가 아니면 `400 VALIDATION_FAILED`(`errors`에 `postId`), 없는 글 `404` |

## 설계 포인트

### "없으면 넣기"를 한 문장으로

`existsById` → `save`처럼 두 번 나눠 하면, 그 사이에 다른 요청이 끼어든다(10-10의 500). MySQL의 `INSERT IGNORE`는 키가 이미 있으면 에러 대신 **0행**을 돌려준다. `@Modifying` 네이티브 쿼리의 반환값(바뀐 행 수)이 1일 때만 `like_count`를 올리면, 숫자도 한 번만 오른다. `DELETE`는 원래 없으면 0행이라 그대로 쓴다.

### 그런데 동시에 보내면 데드락 — 실측

`INSERT IGNORE` + 바뀐 행 수만으로 만들고 같은 토큰으로 `PUT` 5개를 동시에 보내면 이렇게 된다.

```text
200 500 500 500 500
```

```text
org.springframework.dao.CannotAcquireLockException: JDBC exception executing SQL [Deadlock found when trying to get lock; try restarting transaction] [insert ignore into post_likes (post_id, user_id, created_at) values (?, ?, now())]
...
Caused by: com.mysql.cj.jdbc.exceptions.MySQLTransactionRollbackException: Deadlock found when trying to get lock; try restarting transaction
```

MySQL이 남긴 데드락 기록(`SHOW ENGINE INNODB STATUS`의 `LATEST DETECTED DEADLOCK`, 줄임)은 다음과 같다.

```text
*** (1) TRANSACTION:
insert ignore into post_likes (post_id, user_id, created_at) values (39, 1, now())
*** (1) HOLDS THE LOCK(S):
... index PRIMARY of table `project`.`posts` ... lock mode S locks rec but not gap
*** (1) WAITING FOR THIS LOCK TO BE GRANTED:
... index PRIMARY of table `project`.`post_likes` ... lock mode S locks rec but not gap waiting

*** (2) TRANSACTION:
update posts p1_0 set like_count=(p1_0.like_count+1) where p1_0.id=39
*** (2) HOLDS THE LOCK(S):
... index PRIMARY of table `project`.`post_likes` ... lock_mode X locks rec but not gap
*** (2) WAITING FOR THIS LOCK TO BE GRANTED:
... index PRIMARY of table `project`.`posts` ... lock_mode X locks rec but not gap waiting
*** WE ROLL BACK TRANSACTION (1)
```

읽는 법은 이렇다.

1. (2)가 먼저 `post_likes`에 행을 넣었다(그 행에 X락).
2. (1)도 같은 행을 넣으려다 "이미 있나?"를 확인하려고 그 행의 S락을 기다린다. 그런데 (1)은 INSERT하면서 **외래 키 확인**을 위해 부모 행 `posts(39)`에 S락을 이미 잡았다.
3. (2)는 이제 `UPDATE posts ... like_count + 1`을 하려고 `posts(39)`에 X락이 필요하다. (1)의 S락 때문에 기다린다.
4. 서로가 서로를 기다린다. MySQL이 (1)을 되돌린다 → 500.

**고치는 법 — 부모 행을 먼저 잠근다.** 글을 확인할 때 `SELECT ... FOR UPDATE`로 읽는다(JPA: `@Lock(LockModeType.PESSIMISTIC_WRITE)`). 같은 글에 대한 좋아요 요청은 이 줄에서 한 줄로 서고, 앞 요청이 커밋한 뒤에 다음 요청이 `INSERT IGNORE`를 한다.

그러면 0행이 나오고 숫자는 그대로다. 실측으로 `PUT` 10개가 동시에 와도 모두 200, `likeCount` 1이었다.

- 대가: 같은 글의 좋아요가 줄을 선다. 인기 글 하나에 초당 수천 번이 몰리는 서비스라면 다른 설계(숫자를 따로 모아 나중에 반영 등)를 쓴다. 이 게시판 규모에서는 충분하다.
- 다른 선택지: 데드락이 나면 트랜잭션을 처음부터 **재시도**한다. MySQL 메시지도 "try restarting transaction"이라고 말한다. 재시도 코드가 늘고, 멱등이라서 가능한 방법이다.

### 토글은 왜 안 고치나

고칠 수도 있다. 하지만 토글은 **재시도에 약한 것이 본질**이다(같은 요청 = 다른 결과). 서버를 아무리 고쳐도 "두 번 보낸 요청"과 "두 번 누른 사용자"를 구별할 수 없다. 그래서 새 계약을 v2로 열고 옛 앱이 줄어들기를 기다린다. 실무에서는 v1 응답에 `Deprecation` 헤더를 붙여 알리기도 한다.

## 구현 가이드

이 단계의 화면·DB 흐름을 아래 참조 파일과 연결한다. 요구 계약을 먼저 구현하고, 필요한 파일 역할만 펼쳐 전체 코드와 비교한다.

구현 순서에서 확인할 흐름:
- 두 번째 요청은 INSERT IGNORE가 0행 — 숫자를 건드리지 않는다

<details>
<summary>Controller</summary>

`LikeController.java`: HTTP 매핑과 입력·응답을 **만들 것**의 계약과 대조한다.

```java
@PutMapping("/api/v2/posts/{postId}/like")
public ApiResponse<LikeResponse> like(@LoginUser Long userId, @PathVariable Long postId) {
    return ApiResponse.ok(likeService.like(userId, postId));
}

@DeleteMapping("/api/v2/posts/{postId}/like")
public ApiResponse<LikeResponse> unlike(@LoginUser Long userId, @PathVariable Long postId) {
    return ApiResponse.ok(likeService.unlike(userId, postId));
}
```

</details>

<details>
<summary>Service</summary>

`LikeService.java`: 조회·검증·상태 변경의 순서를 화면 흐름과 대조한다.

```java
@Transactional
public LikeResponse like(Long userId, Long postId) {
    lockVisiblePost(postId, userId);
    if (postLikeRepository.insertIfAbsent(postId, userId) == 1)
        postRepository.changeLikeCount(postId, userId, Visibility.PUBLIC, 1);
    return new LikeResponse(true, postRepository.findLikeCount(postId));
}

@Transactional
public LikeResponse unlike(Long userId, Long postId) {
    lockVisiblePost(postId, userId);
    if (postLikeRepository.deleteIfPresent(postId, userId) == 1)
        postRepository.changeLikeCount(postId, userId, Visibility.PUBLIC, -1);
    return new LikeResponse(false, postRepository.findLikeCount(postId));
}
```

`lockVisiblePost`는 `findByIdForUpdate`로 글 행을 먼저 잠그고, 삭제 여부와 비공개 권한을 검사한다. v1 토글은 그대로 둔다. 전체 메서드는 **전체 구현 코드** 토글에서 확인한다.

</details>

<details>
<summary>JPA / Repository</summary>

`PostLikeRepository.java`, `PostRepository.java`: JPA 조회 조건을 DB 예시와 대조한다.

```java
@Modifying
@Query(value = "insert ignore into post_likes (post_id, user_id, created_at) values (:postId, :userId, now())", nativeQuery = true)
int insertIfAbsent(Long postId, Long userId);

@Modifying
@Query(value = "delete from post_likes where post_id = :postId and user_id = :userId", nativeQuery = true)
int deleteIfPresent(Long postId, Long userId);

@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select p from Post p where p.id = :id and p.deletedAt is null")
Optional<Post> findByIdForUpdate(Long id);
```

`changeLikeCount`는 10-10의 조건부 UPDATE를 재사용한다. 좋아요 행을 실제로 넣거나 지운 경우에만 호출한다.

</details>

<details>
<summary>MyBatis Mapper — 잠금·멱등 변경</summary>

MyBatis에서는 `LikeMapper.xml`의 `SELECT ... FOR UPDATE`로 글을 먼저 잠그고, `INSERT IGNORE`의 영향 행 수가 1일 때만 카운터를 올린다. DELETE도 1행을 지웠을 때만 내린다. `LikeController`·`LikeService`·Mapper Java/XML 전문은 **MyBatis 대체 코드** 토글에서 본다.

```xml
<select id="lockVisiblePost" resultType="org.example.board.like.LikePostRow">
  SELECT p.id, p.author_id AS authorId, p.visibility
  FROM posts p WHERE p.id = #{postId} AND p.deleted_at IS NULL FOR UPDATE
</select>
<insert id="insertIfAbsent">
  INSERT IGNORE INTO post_likes (post_id, user_id, created_at)
  VALUES (#{postId}, #{userId}, NOW())
</insert>
```

</details>

## 직접 확인

```bash
BASE=http://localhost:8080
KIM=$(curl -s -X POST "$BASE/api/v1/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"kim@example.com","password":"password1234"}' | sed -E 's/.*"accessToken":"([^"]+)".*/\1/')
ID=$(curl -s -X POST "$BASE/api/v1/posts" -H "Authorization: Bearer $KIM" -H 'Content-Type: application/json' \
  -d '{"title":"[채점] 10-11 멱등"}' | sed -E 's/.*"data":\{"id":([0-9]+).*/\1/')

# 토글을 동시에 두 번 — 실행할 때마다 결과가 다를 수 있다
for i in 1 2; do curl -s -X POST "$BASE/api/v1/posts/$ID/like" -H "Authorization: Bearer $KIM" & done; wait; echo

# PUT 10번 동시에 — 모두 200, likeCount 1이어야 한다
for i in $(seq 10); do curl -s -o /dev/null -w '%{http_code} ' -X PUT "$BASE/api/v2/posts/$ID/like" -H "Authorization: Bearer $KIM" & done; wait; echo
curl -s "$BASE/api/v1/posts/$ID" -H "Authorization: Bearer $KIM"; echo

# DELETE 두 번 — 둘 다 200, liked false
curl -s -X DELETE "$BASE/api/v2/posts/$ID/like" -H "Authorization: Bearer $KIM"; echo
curl -s -X DELETE "$BASE/api/v2/posts/$ID/like" -H "Authorization: Bearer $KIM"; echo
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 요청 T는 토글 두 개를 **동시에** 보낸다. 결과가 실행마다 다를 수 있어서 자동 채점하지 않고 눈으로 본다(C1). 확인용 글은 매번 새로 만든다.

```check
{
  "requests": [
    { "id": "L", "title": "로그인(김자바)", "method": "POST", "path": "/api/v1/auth/login", "body": { "email": "kim@example.com", "password": "password1234" } },
    { "id": "M", "title": "로그인(이스프링)", "method": "POST", "path": "/api/v1/auth/login", "body": { "email": "lee@example.com", "password": "password1234" } },
    { "id": "P", "title": "토글 실험용 글", "method": "POST", "path": "/api/v1/posts", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "body": { "title": "[채점] 10-11 토글 실험" } },
    { "id": "T", "title": "v1 토글을 동시에 두 번", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/like", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "concurrent": { "count": 2 } },
    { "id": "S", "title": "동시 토글 뒤 상태", "method": "GET", "path": "/api/v1/posts/{{P.body.data.id}}", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" } },
    { "id": "R", "title": "v1 토글 재시도(같은 요청 두 번)", "method": "POST", "path": "/api/v1/posts/{{P.body.data.id}}/like", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "repeat": 2 },
    { "id": "Q", "title": "멱등 실험용 글", "method": "POST", "path": "/api/v1/posts", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "body": { "title": "[채점] 10-11 멱등" } },
    { "id": "U", "title": "v2 PUT을 동시에 10번", "method": "PUT", "path": "/api/v2/posts/{{Q.body.data.id}}/like", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "concurrent": { "count": 10 } },
    { "id": "G", "title": "PUT 뒤 상세", "method": "GET", "path": "/api/v1/posts/{{Q.body.data.id}}", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" } },
    { "id": "U2", "title": "PUT 재시도(두 번)", "method": "PUT", "path": "/api/v2/posts/{{Q.body.data.id}}/like", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "repeat": 2 },
    { "id": "D", "title": "v2 DELETE를 동시에 5번", "method": "DELETE", "path": "/api/v2/posts/{{Q.body.data.id}}/like", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "concurrent": { "count": 5 } },
    { "id": "D2", "title": "DELETE 한 번 더", "method": "DELETE", "path": "/api/v2/posts/{{Q.body.data.id}}/like", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" } },
    { "id": "G2", "title": "DELETE 뒤 상세", "method": "GET", "path": "/api/v1/posts/{{Q.body.data.id}}", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" } },
    { "id": "N", "title": "토큰 없음", "method": "PUT", "path": "/api/v2/posts/{{Q.body.data.id}}/like" },
    { "id": "X", "title": "없는 글", "method": "PUT", "path": "/api/v2/posts/999999/like", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" } },
    { "id": "PV", "title": "남의 비공개 글(24)", "method": "DELETE", "path": "/api/v2/posts/24/like", "headers": { "Authorization": "Bearer {{M.body.data.accessToken}}" } },
    {"id": "V2", "title": "v2 PUT 경로 id가 숫자가 아님", "method": "PUT", "path": "/api/v2/posts/abc/like", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}},
    {"id": "V3", "title": "v2 DELETE 경로 id가 숫자가 아님", "method": "DELETE", "path": "/api/v2/posts/abc/like", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}},
    { "id": "V1", "title": "v1 토글도 그대로", "method": "POST", "path": "/api/v1/posts/{{Q.body.data.id}}/like", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "repeat": 2 }
  ],
  "checks": [
    {
      "id": "C1",
      "manual": "요청 T(동시 토글 두 개)의 응답 둘을 본다 — 한쪽이 500(로그: Duplicate entry ... for key 'post_likes.PRIMARY')이거나, 둘 다 200인데 liked가 true·false로 갈린다. 어느 쪽이든 '두 번 보냈다'만으로는 결과를 예측할 수 없다"
    },
    {
      "id": "C2",
      "request": "S",
      "expect": {
        "status": 200,
        "anyOf": [
          { "json": [{ "path": "$.data.liked", "equals": true }, { "path": "$.data.likeCount", "equals": 1 }] },
          { "json": [{ "path": "$.data.liked", "equals": false }, { "path": "$.data.likeCount", "equals": 0 }] }
        ]
      },
      "note": "토글이 경합해도 숫자와 상태는 서로 맞는다(like_count를 DB에서 +1/-1 하고 한 트랜잭션이라서)"
    },
    {
      "id": "C3",
      "all": [
        { "request": "R#1", "expect": { "status": 200 } },
        { "request": "R#2", "expect": { "status": 200, "json": [{ "path": "$.data.liked", "notEquals": "{{R#1.body.data.liked}}" }] } }
      ],
      "note": "토글은 같은 요청 두 번 = 다른 결과(멱등이 아니다)"
    },
    { "id": "C4", "request": "U", "expect": { "status": 200, "json": [{ "path": "$.data.liked", "equals": true }, { "path": "$.data.likeCount", "equals": 1 }] }, "note": "10개 모두 200, 모두 liked true·likeCount 1" },
    { "id": "C5", "request": "G", "expect": { "status": 200, "json": [{ "path": "$.data.liked", "equals": true }, { "path": "$.data.likeCount", "equals": 1 }] } },
    {
      "id": "C6",
      "all": [
        { "request": "U2#1", "expect": { "status": 200, "json": [{ "path": "$.data", "equals": { "liked": true, "likeCount": 1 } }] } },
        { "request": "U2#2", "expect": { "status": 200, "json": [{ "path": "$.data", "equals": { "liked": true, "likeCount": 1 } }] } }
      ]
    },
    {
      "id": "C7",
      "all": [
        { "request": "D", "expect": { "status": 200, "json": [{ "path": "$.data", "equals": { "liked": false, "likeCount": 0 } }] } },
        { "request": "D2", "expect": { "status": 200, "json": [{ "path": "$.data", "equals": { "liked": false, "likeCount": 0 } }] } },
        { "request": "G2", "expect": { "status": 200, "json": [{ "path": "$.data.liked", "equals": false }, { "path": "$.data.likeCount", "equals": 0 }] } }
      ]
    },
    {
      "id": "C8",
      "all": [
        { "request": "N", "expect": { "status": 401, "json": [{ "path": "$.code", "equals": "UNAUTHORIZED" }] } },
        { "request": "X", "expect": { "status": 404, "json": [{ "path": "$.code", "equals": "NOT_FOUND" }] } },
        { "request": "PV", "expect": { "status": 404, "json": [{ "path": "$.code", "equals": "NOT_FOUND" }] } }
      ]
    },
    {
      "id": "C9",
      "all": [
        { "request": "V1#1", "expect": { "status": 200, "json": [{ "path": "$.data", "equals": { "liked": true, "likeCount": 1 } }] } },
        { "request": "V1#2", "expect": { "status": 200, "json": [{ "path": "$.data", "equals": { "liked": false, "likeCount": 0 } }] } }
      ],
      "note": "v1 토글은 남아 있고, v2와 같은 데이터를 본다"
    },
    {
      "id": "C10",
      "all": [
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
        },
        {
          "request": "V3",
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
| C1 | 요청 T (수동) | 동시 토글 두 응답이 "한쪽 500" 또는 "둘 다 200인데 liked가 갈림" — 토글의 문제를 눈으로 확인 |
| C2 | 요청 S | 동시 토글 뒤에도 `liked`·`likeCount`가 서로 맞다(`true`·`1` 또는 `false`·`0`) |
| C3 | 요청 R | 같은 토글 두 번 → 둘째의 `liked`가 첫째와 다르다 |
| C4 | 요청 U | 동시 `PUT` 10개 **모두** `200`, `liked`=`true`, `likeCount`=`1` |
| C5 | 요청 G | 상세 `liked`=`true`, `likeCount`=`1` |
| C6 | 요청 U2 | `PUT` 두 번 모두 `{liked: true, likeCount: 1}` — 멱등 |
| C7 | 요청 D·D2·G2 | 동시 `DELETE` 5개와 한 번 더 모두 `200` `{liked: false, likeCount: 0}`, 상세도 `0` |
| C8 | 요청 N·X·PV | 토큰 없음 `401`, 없는 글·남의 비공개 글 `404` |
| C9 | 요청 V1 | v1 토글이 여전히 동작한다(`true`·`1` → `false`·`0`) |
| C10 | V2 / V3 | v2 `PUT`·`DELETE` 경로 `abc` → `400 VALIDATION_FAILED`, `errors`에 `postId` — `500`이 아니다 |
| D1 | 요청 U 뒤 `SELECT COUNT(*) FROM post_likes WHERE post_id = <Q의 id>` | `1` |
| R1 | 멱등 | "확인 후 넣기" 두 단계가 아니라 `INSERT IGNORE`(또는 같은 효과)와 바뀐 행 수로 숫자를 바꾼다 |
| R2 | 데드락 | 부모 행 잠금(`PESSIMISTIC_WRITE`), 데드락 재시도 등 동시 `PUT`이 500 없이 끝나는 장치가 있고, 왜 필요한지 설명할 수 있다 |
| R3 | 버전 | 새 계약을 v2 경로로 열고 v1 토글을 지우지 않았다 |

## 필요한 지식

- [H1 동시성 맛보기](../../lessons/H1-concurrency-taste.md)
- [A2 HTTP 해부](../../lessons/A2-http-anatomy.md) — 메서드의 뜻, 멱등
- [G3 트랜잭션 첫 만남](../../lessons/G3-first-transaction.md)
- [S08 트랜잭션](../../docs/knowledge/S08-transactions.md) — 락, 격리 수준
- [P18 동시성 점검표](../../docs/knowledge/P18-concurrency-inventory.md)
- [4-2. 동시에 눌러도 맞는 like_count](../ch4-like/4-2-like-concurrency.md) — 1~9장의 같은 주제(테스트로 재현)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 네이티브 쿼리로 INSERT IGNORE</summary>

```java
@Modifying
@Query(value = "insert ignore into post_likes (post_id, user_id, created_at) values (:postId, :userId, now())",
        nativeQuery = true)
int insertIfAbsent(Long postId, Long userId);

@Modifying
@Query(value = "delete from post_likes where post_id = :postId and user_id = :userId", nativeQuery = true)
int deleteIfPresent(Long postId, Long userId);
```

`INSERT IGNORE`는 MySQL 문법이다. 중복 키 말고 다른 오류(외래 키 위반 등)도 경고로 바꿔 삼킨다. 그래서 글 확인(404)을 먼저 한다.
</details>

<details>
<summary>힌트 2 — 글 행 잠그기</summary>

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select p from Post p where p.id = :id and p.deletedAt is null")
Optional<Post> findByIdForUpdate(Long id);
```

SQL 로그에 `... for update`가 붙는다. 잠금은 트랜잭션이 끝날 때 풀리므로 서비스 메서드에 `@Transactional`이 있어야 한다.
</details>

<details>
<summary>힌트 3 — 컨트롤러</summary>

```java
@PutMapping("/api/v2/posts/{postId}/like")
public ApiResponse<LikeResponse> like(@LoginUser Long userId, @PathVariable Long postId) { … }

@DeleteMapping("/api/v2/posts/{postId}/like")
public ApiResponse<LikeResponse> unlike(@LoginUser Long userId, @PathVariable Long postId) { … }
```

v1 토글 메서드는 지우지 않는다.
</details>

## 다음 단계

여기까지가 명세서 프로젝트의 필수 단계다. [10-12. JPA로 쓰고 MyBatis로 바로 읽기 (선택)](10-12-jpa-mybatis-flush.md) — JPA와 MyBatis를 한 프로젝트에서 같이 쓸 때만 해당한다.

한 트랜잭션에서 두 기술을 섞으면 "방금 쓴 것이 안 보이는" 순간이 있다. 언제 보이고 언제 안 보이는지 직접 재현한다. 건너뛴다면 다음은 Java 탭의 티켓이다 — 실무에서 들어오는 요청 하나를 받아 이미 있는 코드를 고친다.
