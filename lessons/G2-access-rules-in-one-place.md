# G2. 권한 규칙을 한 곳에

> 개념 레슨 · 30분

## 이게 뭐냐

화면이 남의 글에는 수정 버튼을 **안 보여 준다**고 하자. 그래도 요청은 보낼 수 있다. curl로 `PATCH /api/posts/3`을 직접 보내면 그만이다. 그래서 **서버가 요청마다 다시 확인**한다. 화면에서 숨기는 것은 편의이고, 막는 것은 서버다(F1의 "서버 검증은 마지막 문"과 같은 이야기).

### 같은 질문이 API마다 나온다

게시판에는 "이 사람이 이 글을 …할 수 있나"라는 질문이 계속 나온다.

| API | 묻는 것 |
|---|---|
| 상세 `GET /api/posts/{id}` (2-1·2-3) | 볼 수 있나 |
| 목록 `GET /api/boards/{slug}/posts` (2-2·2-3) | 볼 수 있나(여러 글을 한꺼번에) |
| 수정 `PATCH` (3-1) | 볼 수 있나 → 고칠 수 있나 |
| 삭제 `DELETE` (3-2) | 볼 수 있나 → 지울 수 있나 |
| 좋아요 `PUT …/like` (4-1) · 댓글 (5-1) · 북마크 (6-1) | 볼 수 있나 |

"볼 수 있나"의 규칙은 여러 줄이다. 지운 글은 아무도 못 본다. 임시저장(`DRAFT`)은 작성자만 본다. 운영자 숨김(`HIDDEN`)은 운영자만 본다. 2-3에서는 팔로워 공개와 차단까지 붙는다.

이 규칙을 API마다 복사해 넣으면, 규칙이 바뀔 때 한 곳을 빠뜨린다. 그러면 **상세에서는 안 보이는 글을 좋아요 API로는 건드릴 수 있는** 구멍이 생긴다. 그래서 규칙을 **클래스 하나**(예: `PostAccessPolicy`)에 모으고, 모든 서비스가 그 클래스에 묻는다.

### 404인가 403인가

| 상황 | 상태 코드 | 이유 |
|---|---|---|
| 글이 없다, 또는 이 사람은 볼 수 없다 | `404` | 볼 수 없는 글은 **있다는 사실도** 숨긴다 |
| 볼 수는 있는데 고칠·지울 권한이 없다 | `403` | 글이 있는 건 이미 아는 사람이다 |

그래서 확인 순서가 정해진다. **먼저 "볼 수 있나"(아니면 404), 그다음 "고칠 수 있나"(아니면 403).** 순서를 바꾸면 403이 "그 번호의 글이 있긴 하다"를 알려 준다. 아래 "일부러 틀려 보기"에서 실제로 본다.

## 예시

Spring 없이 순수 Java로 규칙 클래스와 서비스를 만든다. 시나리오 데이터의 회원·글을 몇 개 옮겼다(3번 공개 글, 7번 박디비의 임시저장, 8번 지운 글, 10번 운영자 숨김). JDK 21 `jshell`에서 실행한 그대로다.

```java
import java.util.*;

enum Role { USER, ADMIN }
enum Status { DRAFT, PUBLISHED, HIDDEN }
record Member(long id, String nickname, Role role) {}
record Post(long id, Member author, Status status, boolean deleted) {}

class NotFoundException extends RuntimeException { NotFoundException(long id) { super("404 글 없음: " + id); } }
class ForbiddenException extends RuntimeException { ForbiddenException() { super("403 권한 없음"); } }

// 규칙은 여기에만 있다
class PostAccessPolicy {
    boolean canView(Member viewer, Post post) {
        if (post.deleted()) return false;
        return switch (post.status()) {
            case PUBLISHED -> true;
            case DRAFT     -> isAuthor(viewer, post);
            case HIDDEN    -> isAdmin(viewer);
        };
    }
    boolean canEdit(Member viewer, Post post)   { return isAuthor(viewer, post); }
    boolean canDelete(Member viewer, Post post) { return isAuthor(viewer, post) || isAdmin(viewer); }
    private boolean isAuthor(Member viewer, Post post) { return viewer != null && viewer.id() == post.author().id(); }
    private boolean isAdmin(Member viewer)             { return viewer != null && viewer.role() == Role.ADMIN; }
}

// 서비스는 규칙을 묻기만 한다
class PostService {
    private final PostAccessPolicy policy;
    private final Map<Long, Post> store;
    PostService(PostAccessPolicy policy, Map<Long, Post> store) { this.policy = policy; this.store = store; }

    // "볼 수 있는 글 찾기" — 상세·수정·삭제가 모두 이 메서드로 글을 찾는다
    private Post findVisible(Member viewer, long id) {
        Post post = store.get(id);
        if (post == null || !policy.canView(viewer, post)) throw new NotFoundException(id);
        return post;
    }
    String detail(Member viewer, long id) { findVisible(viewer, id); return "200"; }
    String update(Member viewer, long id) {
        Post post = findVisible(viewer, id);                            // 1. 볼 수 있나 → 아니면 404
        if (!policy.canEdit(viewer, post)) throw new ForbiddenException(); // 2. 고칠 수 있나 → 아니면 403
        return "200 수정함";
    }
    String delete(Member viewer, long id) {
        Post post = findVisible(viewer, id);
        if (!policy.canDelete(viewer, post)) throw new ForbiddenException();
        return "204 지움";
    }
}
```

`null`인 `viewer`는 로그인하지 않은 사람이다. 데이터를 넣고 불러 본다.

```java
var admin = new Member(1, "운영자", Role.ADMIN)
var kim   = new Member(2, "김자바", Role.USER)
var lee   = new Member(3, "이스프링", Role.USER)
var park  = new Member(4, "박디비", Role.USER)
var store = Map.of(
    3L,  new Post(3,  park, Status.PUBLISHED, false),
    7L,  new Post(7,  park, Status.DRAFT,     false),
    8L,  new Post(8,  lee,  Status.PUBLISHED, true),
    10L, new Post(10, park, Status.HIDDEN,    false))
var service = new PostService(new PostAccessPolicy(), store)
```

```text
jshell> service.detail(null, 3)
$16 ==> "200"

jshell> service.detail(kim, 7)
|  Exception REPL.$JShell$15$NotFoundException: 404 글 없음: 7
|        at PostService.findVisible (#9:9)
|        at PostService.detail (#9:12)
|        at (#17:1)

jshell> service.detail(park, 7)
$18 ==> "200"

jshell> service.update(lee, 3)
|  Exception REPL.$JShell$16$ForbiddenException: 403 권한 없음
|        at PostService.update (#9:15)
|        at (#19:1)

jshell> service.update(park, 3)
$20 ==> "200 수정함"

jshell> service.delete(admin, 3)
$21 ==> "204 지움"

jshell> service.update(lee, 8)
|  Exception REPL.$JShell$15$NotFoundException: 404 글 없음: 8
|        at PostService.findVisible (#9:9)
|        at PostService.update (#9:14)
|        at (#22:1)

jshell> service.detail(admin, 10)
$23 ==> "200"
```

- `REPL.$JShell$15$`는 jshell이 클래스 이름 앞에 붙이는 것이다. `$16`·`#9` 같은 번호는 붙여 넣은 순서에 따라 다르다.
- 이스프링은 3번 글을 볼 수는 있지만 작성자가 아니다 → `403`.
- 8번은 이스프링 **자신의** 글이지만 지운 글이다 → 고치려 해도 `404`. 3-1 채점 C7("작성자가 지운 글을 고치려 함 → 404")이 이것이다. 수정이 상세와 같은 `findVisible`로 글을 찾기 때문에 따로 신경 쓰지 않아도 맞게 나온다.

실제 프로젝트에서는 `PostAccessPolicy`에 `@Component`를 붙여 빈으로 만들고, 서비스가 생성자로 받는다(E1). 팔로우·차단을 보려면 리포지토리도 필요하니 정책 클래스가 그것들을 생성자로 받는다(7-2 힌트의 `new PostAccessPolicy(followRepository, blockRepository)`).

### 목록은 쿼리로

상세는 글 하나를 꺼내 `canView`로 판정하면 된다. 목록은 다르다. 글을 다 꺼내 Java에서 거르면 G1에서 본 것처럼 쪽 크기와 전체 개수가 틀어진다. 그래서 같은 규칙을 **`WHERE` 조건으로 옮겨** 쿼리에서 거른다. 규칙이 두 군데(Java 판정, 쿼리 조건)에 있게 되는 셈이라, **같은 클래스 옆에** 두고 함께 고친다. 2-3의 힌트와 R1이 이 이야기다.

## 따라 해 보기

10분. `jshell`을 연다(JDK 21).

**1. 붙여 넣고 예측하기.** 위 코드를 붙여 넣는다. 아래를 실행하기 **전에** 결과(`200`·`204`·`403`·`404`)를 종이에 먼저 적는다.

| 호출 | 예측 |
|---|---|
| `service.detail(park, 10)` | |
| `service.delete(park, 10)` | |
| `service.delete(lee, 8)` | |
| `service.delete(kim, 3)` | |
| `service.update(admin, 3)` | |

<details>
<summary>실제 결과</summary>

| 호출 | 결과 | 이유 |
|---|---|---|
| `service.detail(park, 10)` | `404` | 작성자라도 운영자 숨김 글은 못 본다(2-3 C5) |
| `service.delete(park, 10)` | `404` | 볼 수 없으니 지우기 전에 404 |
| `service.delete(lee, 8)` | `404` | 이미 지운 글을 또 지우기(3-2 C5) |
| `service.delete(kim, 3)` | `403` | 볼 수는 있지만 작성자도 운영자도 아니다 |
| `service.update(admin, 3)` | `403` | 운영자는 지울 수는 있지만 고칠 수는 없다(지금 규칙) |
</details>

**2. 규칙을 한 곳만 고친다.** "운영자는 어떤 글이든 고칠 수 있다"로 규칙이 바뀌었다. `PostAccessPolicy`의 `canEdit` 한 줄만 바꿔 클래스 전체를 다시 붙여 넣는다.

```java
    boolean canEdit(Member viewer, Post post)   { return isAuthor(viewer, post) || isAdmin(viewer); }
```

jshell이 `modified class PostAccessPolicy`라고 알려 준다. 바뀐 클래스로 서비스를 다시 만들고 부른다.

```text
jshell> var service = new PostService(new PostAccessPolicy(), store)
service ==> PostService@2fd66ad3

jshell> service.update(admin, 3)
$37 ==> "200 수정함"

jshell> service.update(admin, 10)
$38 ==> "200 수정함"
```

`PostService`는 한 글자도 안 고쳤다. 수정 API가 열 개여도 고칠 곳은 `canEdit` 한 줄이다.

## 일부러 틀려 보기

같은 jshell에 이어서 친다. 아래 두 메서드는 `canView`만 쓰거나 아예 규칙 클래스를 안 써서, 따라 해 보기 2로 `canEdit`을 바꿨어도 결과가 같다.

**1. 규칙을 복사해 "작성자인가"만 본다.** 수정 기능을 급하게 만들면서 `findVisible`을 안 쓰고 직접 찾았다.

```java
String updateCopied(Member viewer, long id) {
    Post post = store.get(id);
    if (post == null) throw new NotFoundException(id);
    if (post.author().id() != viewer.id()) throw new ForbiddenException();
    return "200 수정함";
}
```

```text
jshell> updateCopied(lee, 8)
$30 ==> "200 수정함"
```

**지운 글이 고쳐졌다.** 작성자 확인은 맞게 했지만 "지운 글은 없는 글" 규칙이 빠졌다. 상세(`404`)와 수정(`200`)이 서로 다른 말을 한다. 3-1 C7이 잡는 실수다. 규칙을 복사하면 이렇게 한 줄씩 빠진다.

**2. 순서를 거꾸로 한다.** 작성자부터 확인하고, 볼 수 있는지는 나중에 본다.

```java
String updateReversed(Member viewer, long id) {
    Post post = store.get(id);
    if (post != null && post.author().id() != viewer.id()) throw new ForbiddenException();
    if (post == null || !new PostAccessPolicy().canView(viewer, post)) throw new NotFoundException(id);
    return "200 수정함";
}
```

```text
jshell> updateReversed(lee, 7)
|  Exception REPL.$JShell$16$ForbiddenException: 403 권한 없음

jshell> updateReversed(lee, 999)
|  Exception REPL.$JShell$15$NotFoundException: 404 글 없음: 999
```

(`at …` 줄은 뺐다.) 7번은 박디비의 임시저장 글이라 이스프링에게는 **없는 글**이어야 한다. 그런데 `403`이 나왔다. 999번(정말 없는 글)은 `404`다. 번호를 1부터 바꿔 가며 보내 보면 `403`이 나오는 번호마다 "남의 숨은 글이 있다"는 것을 알게 된다. 올바른 `service.update(lee, 7)`은 둘 다 `404`로 똑같이 답한다.

## 확인 문제

**1.** 화면에서는 남의 글에 수정 버튼을 안 보여 준다. 그래도 누군가 curl로 `PATCH /api/posts/3`을 직접 보낼 수 있다. 서버의 수정 API에서 작성자 확인을 빼도 되나?

<details>
<summary>정답</summary>

**안 된다.** 버튼을 숨긴 것은 화면 편의일 뿐이다. 요청은 curl 등으로 누구나 보낼 수 있다. id만 바꿔 남의 글을 고치는 사고를 IDOR라고 부른다(3-1 상황). 확인은 서버가 요청마다 한다.
</details>

**2.** 이스프링이 박디비의 임시저장 글(7번)을 지우려 한다. `403`과 `404` 중 무엇을 돌려주나? 왜인가?

<details>
<summary>정답</summary>

**`404`.** 임시저장 글은 작성자만 볼 수 있으니 이스프링에게는 없는 글이다. `403`을 주면 "그 번호에 글이 있긴 한데 네 것이 아니다"를 알려 주게 된다. 볼 수 있는지(404) → 권한이 있는지(403) 순서로 확인한다.
</details>

**3.** "숨김 글은 운영자만 본다" 규칙을 상세 API에만 넣고 좋아요 API에는 안 넣었다. 무슨 일이 생기나? 어떻게 막나?

<details>
<summary>정답</summary>

일반 회원이 숨김 글 번호로 좋아요를 누를 수 있다. 응답에 `likeCount`가 오면 숨김 글이 있다는 것과 그 숫자까지 새어 나간다. 막는 법은 좋아요 서비스도 상세와 **같은 "볼 수 있는 글 찾기"**(규칙 클래스)로 글을 찾게 하는 것이다. 4-1 R3("볼 수 있는 글인가를 2-3의 규칙으로 확인")이 이것을 본다.
</details>

**4.** 규칙 클래스를 만들었더니 목록 API는 `findAll()`로 다 가져온 뒤 `stream().filter(p -> policy.canView(viewer, p))`로 거르게 되었다. 상세와 규칙이 똑같으니 괜찮은가?

<details>
<summary>정답</summary>

**규칙은 같지만 쪽 자르기가 틀어진다.** DB에서 5개를 잘라 온 뒤 거르면 4개만 남을 수 있고, 다 가져와서 거르면 글이 많을 때 느리다. `totalElements`도 DB의 `COUNT`와 맞지 않는다. 목록은 같은 규칙을 `WHERE` 조건으로 옮겨 쿼리에서 거른다(2-3 R3). 대신 두 표현이 어긋나지 않게 같은 클래스 옆에 두고 함께 고친다.
</details>

## 더 깊이

- [D11 — 인증과 인가: 신원 확인 후 객체까지 확인](../docs/knowledge/D11-web-security-basics.md#32-인증과-인가-신원-확인-후-객체까지-확인)
- [D11 — 안전한 SQL 바인딩과 IDOR 방어](../docs/knowledge/D11-web-security-basics.md#41-안전한-sql-바인딩과-idor-방어를-먼저-설계하기)
- [D11 — 인증과 인가를 실제 API에서 어떻게 나누나(403과 404)](../docs/knowledge/D11-web-security-basics.md#q1-인증과-인가를-실제-api에서-어떻게-나누나)
- [W13 프론트와 백엔드의 경계](../docs/knowledge/W13-frontend-backend-boundary.md) — 화면에서 숨기는 것과 서버가 막는 것
- [W02 왜 Controller·Service·Repository로 나누나](../docs/knowledge/W02-why-layers.md) — 규칙이 서비스 쪽에 있는 이유

## 다음

- 레슨: [G3. 트랜잭션 첫 만남](G3-first-transaction.md) — 글과 태그를 "한 번에" 저장하는 이유.
- 실습: [2-3. 볼 수 있는 글만](../scenario/ch2-read-post/2-3-visibility.md) — 오늘의 규칙에 팔로워 공개·차단을 더하고 상세·목록에 똑같이 건다. [3-1](../scenario/ch3-update-delete/3-1-patch.md)·[3-2](../scenario/ch3-update-delete/3-2-soft-delete.md)에서 403·404 순서를 다시 쓴다.
