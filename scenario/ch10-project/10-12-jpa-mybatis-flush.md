# 10-12. JPA로 쓰고 같은 트랜잭션에서 MyBatis로 읽기 — flush (선택)

> **선택 단계 — JPA와 MyBatis를 한 프로젝트에서 같이 쓸 때만** 해당한다. 10-11까지 JPA만으로 만들었다면 명세서 프로젝트는 이미 끝났다. 회사 코드처럼 두 기술이 섞인 서비스를 다룰 일이 있거나, 10-7 [선택 칸](10-7-post-list.md#선택--같은-목록을-mybatis로-짜-보기)을 MyBatis로 짰다면 여기서 그 경계의 함정을 직접 겪는다. MyBatis가 아직 없으면 아래 [MyBatis 넣기](#mybatis-넣기)부터 한다.

## 상황

프론트 개발자의 요청으로 명세가 바뀐다.

> "글을 쓰거나 고친 뒤에 목록을 다시 불러오기 싫어요. 응답에 **목록 카드 한 줄**을 같이 주시면 목록에 바로 끼울게요. 목록 API랑 모양이 똑같아야 해요."

| 바뀐 API | 추가되는 것 |
|---|---|
| `POST /api/v1/posts`, `PUT /api/v1/posts/{postId}` | 응답 `data.listItem` — 10-7 목록의 항목과 **같은 모양**(`id, title, visibility, viewCount, likeCount, author, tags, createdAt`) |

이 단계는 그 카드 한 줄을 **MyBatis**로 읽는다(10-7을 MyBatis로 짰다면 목록과 같은 쿼리 조각을 그대로 쓰니 모양이 저절로 같다). 그러면 한 서비스 메서드 안에서 이렇게 된다.

1. JPA로 쓴다(엔티티 저장·변경).
2. 같은 트랜잭션에서 MyBatis로 방금 그 글을 읽는다.

여기에 함정이 있다. JPA는 바뀐 내용을 **바로 DB에 보내지 않는다.** 모아 두었다가 커밋 직전이나 필요할 때 한꺼번에 보낸다(flush). MyBatis는 JPA 밖에 있어서, JPA가 아직 안 보낸 변경을 모른다. 이 단계에서는 "언제 보이고 언제 안 보이는지"를 직접 재현하고, 확실히 보이게 만든다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글 수정 → 목록으로 돌아가기",
  "summary": "수정 응답의 listItem을 목록의 해당 줄에 그대로 바꿔 끼운다. 목록을 다시 부르지 않는다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "게시판", "right": "김자바" },
    { "type": "list", "id": "items", "items": [
      { "id": "row", "title": "[채점] 10-12 수정 후", "meta": "김자바 · #after", "badge": "비공개" },
      { "title": "셋째 주 회고", "meta": "김자바 · #회고" }
    ] },
    { "type": "toast", "id": "toast", "value": "수정했어요" }
  ],
  "flows": [
    {
      "name": "flush하고 읽기(정상)",
      "steps": [
        { "kind": "user", "text": "수정 폼에서 제목·태그·공개 범위를 바꿔 저장", "focus": ["bar"] },
        { "kind": "request", "method": "PUT", "path": "/api/v1/posts/39", "headers": ["Authorization: Bearer (김자바)", "Content-Type: application/json"], "body": "{\n  \"title\": \"[채점] 10-12 수정 후\",\n  \"tags\": [\"after\"],\n  \"visibility\": \"PRIVATE\"\n}" },
        { "kind": "server", "text": "post.replace(...) — 아직 JPA 안에만 있는 변경 → postRepository.flush()로 DB에 보낸다(커밋은 아직) → MyBatis 카드 쿼리로 id 39 한 줄" },
        { "kind": "db", "sql": "UPDATE posts SET title = ?, visibility = ? WHERE id = 39;\nDELETE FROM post_tags WHERE post_id = 39 AND tag_id = ...;\nINSERT INTO post_tags (post_id, tag_id) VALUES (39, ...);\n-- 같은 트랜잭션·같은 커넥션이라 커밋 전 변경이 보인다\nSELECT p.id, p.title, ... FROM posts p JOIN users u ... WHERE p.id = 39;" },
        { "kind": "response", "status": 200, "body": "{\n  \"status\": 200,\n  \"data\": {\n    \"id\": 39, \"title\": \"[채점] 10-12 수정 후\", ...,\n    \"listItem\": { \"id\": 39, \"title\": \"[채점] 10-12 수정 후\", \"visibility\": \"PRIVATE\", \"tags\": [\"after\"], ... }\n  }\n}" },
        { "kind": "screen", "text": "목록의 그 줄이 새 제목·태그로 바뀐다", "focus": ["row", "toast"] }
      ]
    },
    {
      "name": "flush 없이 읽기(버그)",
      "steps": [
        { "kind": "user", "text": "같은 수정을 flush 없는 코드에 보낸다", "focus": ["bar"] },
        { "kind": "request", "method": "PUT", "path": "/api/v1/posts/39", "headers": ["Authorization: Bearer (김자바)"], "body": "{ \"title\": \"[채점] 10-12 수정 후\", \"tags\": [\"after\"] }" },
        { "kind": "db", "sql": "SELECT p.id, p.title, ... WHERE p.id = 39;   -- MyBatis: 아직 옛 제목\nUPDATE posts SET title = ? WHERE id = 39;   -- JPA가 나중에 보냄", "note": "실측 SQL 로그 순서 그대로" },
        { "kind": "response", "status": 200, "body": "{\n  \"data\": {\n    \"title\": \"[채점] 10-12 수정 후\",\n    \"listItem\": { \"title\": \"[채점] 10-12 flush 없이\", \"tags\": [\"check\", \"flush\"], ... }\n  }\n}" },
        { "kind": "screen", "text": "상세는 새 제목인데 목록 줄은 옛 제목 — 새로고침하면 그제야 맞는다", "focus": ["row"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| MyBatis | 목록 카드 컬럼으로 글 하나를 읽는 쿼리(예: `findListRowById`) + 태그 쿼리. 10-7 선택 칸을 했다면 그 `columns` 조각·태그 쿼리를 그대로 쓴다 |
| `POST /api/v1/posts` | 저장 뒤 **flush** → MyBatis로 그 글 한 줄 → 응답 `data.listItem` |
| `PUT /api/v1/posts/{postId}` | 변경 뒤 **flush** → MyBatis로 한 줄 → 응답 `data.listItem` |
| 상세·목록 | `GET` 응답에는 `listItem`이 없다(키째 없음) |
| 모양 | `listItem`이 같은 글의 목록 항목(`GET /api/v1/posts`의 `items[n]`)과 **완전히 같다** |

**필드 규칙** — 작성·수정 규칙은 10-5·10-8 그대로다. flush·MyBatis를 끼워 넣어도 검증이 먼저라 잘못된 입력은 저장·flush 전에 `400`이어야 한다

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `title` | 필수 | 안 됨 | 다듬은 뒤 5~100자 | 문자열 | 없음 | `400 VALIDATION_FAILED`, `errors`에 `title` |
| `tags` | 선택 | 생략·`null`이면 `[]` | 0~5개, 각 1~20자 | 문자열 배열 | `[]` | `400`, `errors`에 `tags` |
| 본문 전체 | 필수 | — | — | JSON | — | `400 BAD_JSON` |

### MyBatis 넣기

10-7을 JPA로만 짰다면 MyBatis가 아직 없다. 이 단계에서 처음 넣는다(10-7 선택 칸을 했다면 이미 있으니 건너뛴다).

`build.gradle`의 `dependencies`에 한 줄 — MyBatis는 Boot BOM에 없어서 버전을 직접 적는다(4.1.x가 Boot 4.1용).

```groovy
implementation 'org.mybatis.spring.boot:mybatis-spring-boot-starter:4.1.0'
```

`application.yml`에 둔다.

```yaml
mybatis:
  mapper-locations: classpath:mapper/*.xml
  configuration:
    map-underscore-to-camel-case: true   # 컬럼 view_count → 필드 viewCount
```

매퍼는 인터페이스(`post/PostQueryMapper.java`, `@Mapper`)와 XML(`src/main/resources/mapper/PostQueryMapper.xml`) 한 쌍이다. XML의 `namespace`가 인터페이스의 전체 이름과 같아야 하고, `<select id>`가 메서드 이름이다(자세히는 [E5 MyBatis 첫걸음](../../lessons/E5-mybatis-first-steps.md)).

```java
@Mapper
public interface PostQueryMapper {
    PostListRow findListRowById(@Param("id") Long id);
    List<PostTagRow> findTagsByPostIds(@Param("postIds") List<Long> postIds);
}
```

결과 한 줄은 컬럼이 평평한(`author_id`, `author_nickname`) 클래스 `PostListRow`로 받고, 목록 항목 record로 옮길 때 `author{id, nickname}`으로 묶는다. MyBatis는 setter가 없어도 필드에 값을 넣는다. 태그 한 쌍은 10-7의 `PostTagRow` record를 그대로 쓴다.

## 설계 포인트 — 직접 재현한 것

아래는 정답 코드에서 `postRepository.flush()`를 빼거나 순서를 바꿔 SQL 로그(`org.hibernate.SQL`·MyBatis 매퍼 DEBUG)로 확인한 결과다(Boot 4.1.1, Hibernate 7.4, MyBatis 3.5.19).

### ① 작성 — 글은 보이는데 태그가 비어 있다

flush 없이 작성하면 응답이 이렇다.

```text
data.tags            ['check', 'flush']
data.listItem.title  [채점] 10-12 flush 없이      ← 글은 보인다
data.listItem.tags   []                           ← 태그는 안 보인다
```

SQL 로그 순서는 다음과 같다.

```text
insert into posts (author_id,content,created_at,...) values (...)    ← save() 순간 바로 나감
==>  Preparing: SELECT p.id, p.title, ... (MyBatis 목록 한 줄)
==>  Preparing: SELECT pt.post_id, t.name ... (MyBatis 태그)
insert into post_tags (post_id,tag_id) values (?,?)                  ← 커밋 직전 flush 때
insert into post_tags (post_id,tag_id) values (?,?)
```

- 글 행이 보이는 이유: id가 `IDENTITY`(AUTO_INCREMENT)라 JPA는 **id를 알려고 `save` 순간 INSERT를 보낸다**. 다른 변경처럼 미뤄 둘 수 없다.
- 태그가 안 보이는 이유: `post_tags`(연결 테이블) INSERT는 미뤄 두었다가 flush 때 나간다.
- "작성 직후 MyBatis로 읽어 봤더니 되더라"는 **우연히 IDENTITY라서**다. 연관된 행은 여전히 늦다.

### ② 수정 — 통째로 옛 값

flush 없이 수정하면 이렇다.

```text
data.title           [채점] 10-12 수정 후
data.listItem.title  [채점] 10-12 flush 없이     ← 옛 제목
data.listItem.tags   ['check', 'flush']          ← 옛 태그
```

```text
==>  Preparing: SELECT p.id, p.title, ... (MyBatis)
update posts set title=? where id=?                               ← MyBatis 조회 뒤에야 나감
delete from post_tags where post_id=? and tag_id=?
insert into post_tags (post_id,tag_id) values (?,?)
select count(*) from post_likes where post_id = ? and user_id = ?   ← (좋아요 여부 네이티브 쿼리)
```

변경 감지는 엔티티의 값만 바꿔 두고, UPDATE는 flush 때 만든다. 로그를 보면 UPDATE가 **JPA 네이티브 쿼리(`countLike`) 바로 앞에서** 나갔다. Hibernate는 자기가 실행하는 쿼리 앞에서는 결과가 틀리지 않게 알아서 flush한다(auto flush). **MyBatis 쿼리는 Hibernate가 모르는 쿼리라 그 앞에서는 flush하지 않는다.**

함정이 하나 더 있다. MyBatis 조회를 우연히 `countLike` **뒤에** 두면 flush 없이도 맞게 나온다. 순서를 바꾸는 순간 깨지는 코드다. 필요한 곳에 `flush()`를 직접 적는다.

### ③ flush하면 왜 보이나 — 같은 커넥션

`flush()`는 SQL을 DB로 보낼 뿐 **커밋하지 않는다.** 커밋 전의 변경은 원래 다른 커넥션에서 안 보인다. 그런데도 MyBatis가 새 값을 읽는다는 것은 **MyBatis가 JPA와 같은 트랜잭션·같은 커넥션을 쓰고 있다**는 뜻이다.

`@Transactional`(JPA 트랜잭션 관리자)이 연 커넥션을 MyBatis-Spring이 그대로 받아 쓴다. 그래서 둘을 섞으려면 반드시 **같은 `@Transactional` 메서드 안**에서 부른다.

### ④ 그래도 옛 값 — MyBatis 1차 캐시

수정 메서드 **앞부분**에서 같은 MyBatis 쿼리로 "수정 전 카드"를 한 번 읽고, 변경 → flush → 다시 읽어 보았다.

```text
data.title           [채점] 10-12 수정 후
data.listItem.title  [채점] 10-12 캐시 실험     ← flush했는데도 옛 값
data.listItem.tags   ['check']
```

MyBatis는 한 트랜잭션 안에서 **같은 쿼리·같은 파라미터**의 결과를 기억해 두고(1차 캐시) DB에 다시 묻지 않는다. JPA의 flush는 MyBatis 캐시를 비우지 않는다. 그 쿼리에 `flushCache="true"`를 주자 새 값이 나왔다(실측). 한 트랜잭션에서 같은 MyBatis 조회를 두 번 할 일이 있으면 이 점을 기억한다.

| 조건 | MyBatis가 보나 |
|---|---|
| JPA `save` + IDENTITY id — 그 글 행 | 보인다(INSERT가 즉시) |
| 연관 행(`post_tags`), 변경 감지 UPDATE — flush 전 | **안 보인다** |
| flush 뒤, 같은 트랜잭션 | 보인다 |
| JPA 쿼리(JPQL·네이티브)가 사이에 실행된 뒤 | 보인다(auto flush) — 우연에 기대지 말 것 |
| 같은 MyBatis 쿼리를 앞에서 이미 읽었음 | flush해도 **옛 값**(1차 캐시) |
| 커밋 뒤(다른 요청) | 보인다 |

## 구현 가이드

`POST /api/v1/posts` · `PUT /api/v1/posts/{postId}` · `GET /api/v1/posts` 계약을 기준으로 아래 순서대로 구현한다. 먼저 직접 작성하고, 막힌 역할만 펼쳐 아래의 전체 구현 코드와 비교한다.

화면 시나리오에서 서버가 맡는 일:

- post.replace(...) — 아직 JPA 안에만 있는 변경 → postRepository.flush()로 DB에 보낸다(커밋은 아직) → MyBatis 카드 쿼리로 id 39 한 줄

<details>
<summary>DTO / 목록 카드 응답</summary>

`PostDetailResponse.java`, `PostListItemResponse.java`: 방금 쓴 글의 목록 카드 필드를 작성·수정 응답에 담는다. `withListItem`이 MyBatis 조회 결과를 기존 응답 구조에 연결하는지 확인한다.

```java
// 상세 GET은 null이라 listItem 키가 빠지고, 작성·수정 응답에만 값을 넣는다.
@JsonInclude(JsonInclude.Include.NON_NULL) PostListItemResponse listItem

public PostDetailResponse withListItem(PostListItemResponse item) {
    return new PostDetailResponse(id, title, content, visibility, viewCount, likeCount, liked,
            author, tags, comments, createdAt, updatedAt, item);
}

static PostListItemResponse of(PostListRow row, List<String> tags) {
    return new PostListItemResponse(row.getId(), row.getTitle(), row.getVisibility(),
            row.getViewCount(), row.getLikeCount(),
            new AuthorResponse(row.getAuthorId(), row.getAuthorNickname()), tags, row.getCreatedAt());
}
```

</details>

<details>
<summary>Service / 규칙·트랜잭션</summary>

`PostQueryService.java`, `PostService.java`: JPA 쓰기와 MyBatis 읽기를 같은 `@Transactional` 안에 두고, 조회 전에 `postRepository.flush()`를 호출한다. `listItem`은 읽은 행과 태그를 응답 DTO로 조립한다.

```java
// PostService.create: save(IDENTITY INSERT)만으로는 post_tags가 아직 DB에 없을 수 있다.
postRepository.save(post);
postRepository.flush();
return PostDetailResponse.of(post, post.getViewCount(), false, List.of())
        .withListItem(postQueryService.listItem(post.getId()));

// PostService.update: replace의 변경 감지를 MyBatis 조회 전에 확정한다.
post.replace(request.title(), request.content(), Visibility.valueOf(request.visibility()),
        findOrCreateTags(request.tags()));
postRepository.flush();
PostListItemResponse listItem = postQueryService.listItem(postId);
```

```java
// PostQueryService: 현재 트랜잭션의 같은 커넥션에서 Mapper를 호출한다.
PostListRow row = postQueryMapper.findListRowById(postId);
List<String> tags = postQueryMapper.findTagsByPostIds(List.of(postId)).stream()
        .map(PostTagRow::name).toList();
return PostListItemResponse.of(row, tags);
```

</details>

<details>
<summary>MyBatis / Mapper·SQL</summary>

`PostQueryMapper.java`, `PostQueryMapper.xml`: Mapper 인터페이스 메서드와 XML `<select id>`를 같은 이름으로 연결한다. `#{id}`를 바인딩하고 여러 태그 ID는 `<foreach>`로 넘긴다. JPA가 쓴 직후 읽는 쿼리는 같은 트랜잭션·커넥션에서 실행한다.

```java
PostListRow findListRowById(@Param("id") Long id);
List<PostTagRow> findTagsByPostIds(@Param("postIds") List<Long> postIds);
```

```xml
<select id="findListRowById" resultType="org.example.board.post.PostListRow">
  <include refid="columns"/>
  WHERE p.id = #{id}
</select>
<select id="findTagsByPostIds" resultType="org.example.board.post.PostTagRow">
  SELECT pt.post_id, t.name FROM post_tags pt JOIN tags t ON t.id = pt.tag_id
  WHERE pt.post_id IN
  <foreach collection="postIds" item="id" open="(" separator="," close=")">#{id}</foreach>
</select>
```

</details>

<details>
<summary>설정 / 보조 코드</summary>

`build.gradle`, `application.yml`에서 MyBatis 의존성과 Mapper 경로를 확인한다. `PostListRow.java`는 Mapper SQL의 결과 열을 받는 DTO이므로 XML의 컬럼 별칭과 필드 이름을 맞춘다.

```groovy
implementation 'org.mybatis.spring.boot:mybatis-spring-boot-starter:4.1.0'
```

```yaml
mybatis:
  mapper-locations: classpath:mapper/*.xml
  configuration:
    map-underscore-to-camel-case: true
```

</details>

<details>
<summary>JPA → MyBatis — flush와 1차 캐시 확인</summary>

이 단계는 MyBatis를 실제로 추가하는 선택 과제다. JPA `save`·변경 감지 뒤에 `flush()`로 SQL을 보내고 Mapper를 호출한다. 같은 Mapper 쿼리를 트랜잭션 안에서 이미 실행했다면 MyBatis 1차 캐시가 옛 값을 줄 수 있으므로 XML의 `flushCache="true"` 또는 캐시 범위 설정을 검토한다. 전체 구현은 아래 Java·XML 파일에서 확인한다.

</details>

## 직접 확인

```bash
BASE=http://localhost:8080
KIM=$(curl -s -X POST "$BASE/api/v1/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"kim@example.com","password":"password1234"}' | sed -E 's/.*"accessToken":"([^"]+)".*/\1/')

curl -s -X POST "$BASE/api/v1/posts" -H "Authorization: Bearer $KIM" -H 'Content-Type: application/json' \
  -d '{"title":"[채점] 10-12 작성","tags":["Flush","check"]}'; echo                 # P — listItem.tags가 [check, flush]인가
ID=…   # 위 응답의 data.id
curl -s -X PUT "$BASE/api/v1/posts/$ID" -H "Authorization: Bearer $KIM" -H 'Content-Type: application/json' \
  -d '{"title":"[채점] 10-12 수정 후","tags":["after"],"visibility":"PRIVATE"}'; echo   # U — listItem이 새 값인가
curl -s -G "$BASE/api/v1/posts" --data-urlencode 'q=10-12 수정 후' -H "Authorization: Bearer $KIM"; echo   # 목록 첫 줄과 비교
```

SQL 순서를 직접 보려면 `application.yml`에 둔다.

```yaml
logging:
  level:
    org.hibernate.SQL: debug
    org.example.board.post.PostQueryMapper: debug   # MyBatis 매퍼의 SQL(==> Preparing)
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 요청 I는 수정한 글을 목록 API로 다시 읽어 `listItem`과 통째로 비교한다(상세 G보다 먼저 — 상세를 열면 조회수가 올라 달라진다). 수정한 글은 비공개라 김자바의 목록에만 나온다.

```check
{
  "requests": [
    { "id": "L", "title": "로그인(김자바)", "method": "POST", "path": "/api/v1/auth/login", "body": { "email": "kim@example.com", "password": "password1234" } },
    { "id": "P", "title": "작성 — 응답에 listItem", "method": "POST", "path": "/api/v1/posts", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "body": { "title": "[채점] 10-12 작성", "tags": ["Flush", "check"] } },
    { "id": "U", "title": "수정 — 응답에 listItem", "method": "PUT", "path": "/api/v1/posts/{{P.body.data.id}}", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" }, "body": { "title": "[채점] 10-12 수정 후", "tags": ["after"], "visibility": "PRIVATE" } },
    { "id": "I", "title": "목록에서 같은 글", "method": "GET", "path": "/api/v1/posts?q=10-12%20%EC%88%98%EC%A0%95%20%ED%9B%84&size=1", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" } },
    { "id": "G", "title": "상세 — listItem 없음", "method": "GET", "path": "/api/v1/posts/{{P.body.data.id}}", "headers": { "Authorization": "Bearer {{L.body.data.accessToken}}" } },
    {"id": "V1", "title": "작성 — 제목 4자", "method": "POST", "path": "/api/v1/posts", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}, "body": {"title": "넷글자다"}},
    {"id": "V2", "title": "작성 — 태그 6개", "method": "POST", "path": "/api/v1/posts", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}, "body": {"title": "[채점] 10-12 태그 초과", "tags": ["a", "b", "c", "d", "e", "f"]}},
    {"id": "V3", "title": "수정 — 제목 101자", "method": "PUT", "path": "/api/v1/posts/{{P.body.data.id}}", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}"}, "body": {"title": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가"}},
    {"id": "V4", "title": "수정 — 깨진 JSON", "method": "PUT", "path": "/api/v1/posts/{{P.body.data.id}}", "headers": {"Authorization": "Bearer {{L.body.data.accessToken}}", "Content-Type": "application/json"}, "body": "{\"title\":"}
  ],
  "checks": [
    {
      "id": "C1",
      "request": "P",
      "expect": {
        "status": 201,
        "json": [
          { "path": "$.data.listItem.id", "equals": "{{P.body.data.id}}" },
          { "path": "$.data.listItem.title", "equals": "[채점] 10-12 작성" },
          { "path": "$.data.listItem.tags", "equals": ["check", "flush"] },
          { "path": "$.data.listItem.author", "equals": { "id": 1, "nickname": "김자바" } },
          { "path": "$.data.listItem.likeCount", "equals": 0 }
        ]
      },
      "note": "flush 없이 읽으면 tags가 []로 나온다(post_tags는 flush 때 들어간다)"
    },
    {
      "id": "C2",
      "request": "U",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.data.title", "equals": "[채점] 10-12 수정 후" },
          { "path": "$.data.listItem.id", "equals": "{{P.body.data.id}}" },
          { "path": "$.data.listItem.title", "equals": "[채점] 10-12 수정 후" },
          { "path": "$.data.listItem.tags", "equals": ["after"] },
          { "path": "$.data.listItem.visibility", "equals": "PRIVATE" }
        ]
      },
      "note": "flush 없이 읽으면 옛 제목·옛 태그·PUBLIC이 나온다"
    },
    { "id": "C3", "request": "G", "expect": { "status": 200, "json": [{ "path": "$.data.listItem", "exists": false }] } },
    {
      "id": "C4",
      "request": "I",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.data.items[0].id", "equals": "{{P.body.data.id}}" },
          { "path": "$.data.items[0]", "equals": "{{U.body.data.listItem}}" }
        ]
      },
      "note": "listItem이 목록 항목과 필드·값까지 같다"
    },
    {
      "id": "C5",
      "all": [
        {
          "request": "V1",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "title"
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
                "contains": "tags"
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
                "contains": "title"
              },
              {
                "path": "$.code",
                "equals": "VALIDATION_FAILED"
              }
            ]
          }
        },
        {
          "request": "V4",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.code",
                "equals": "BAD_JSON"
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

C = HTTP 확인(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 P | `201`, `listItem.id`=새 글, `title`, `tags`=`["check","flush"]`(**비어 있지 않다**), `author`, `likeCount`=`0` |
| C2 | 요청 U | `200`, `listItem`의 `title`=`[채점] 10-12 수정 후`, `tags`=`["after"]`, `visibility`=`PRIVATE` — 수정 **후** 값 |
| C3 | 요청 G | 상세에는 `listItem` 키가 없다 |
| C4 | 요청 I | 목록의 그 글 항목이 U의 `listItem`과 통째로 같다 |
| C5 | V1~V4 | 작성 제목 4자 `title`·태그 6개 `tags`, 수정 제목 101자 `title` — `400 VALIDATION_FAILED` / 수정 깨진 JSON `400 BAD_JSON` — `500`이 아니다(10-5·10-8 규칙이 그대로 산다) |
| R1 | flush 위치 | JPA로 쓴 뒤, MyBatis로 읽기 **바로 전에** `flush()`(또는 `EntityManager.flush()`)를 명시한다. 다른 JPA 쿼리의 auto flush에 기대지 않는다 |
| R2 | 트랜잭션 | 쓰기와 MyBatis 읽기가 같은 `@Transactional` 메서드 안에 있다 |
| R3 | 재사용 | `listItem`을 목록 항목과 같은 record로 만든다(모양을 따로 손으로 맞추지 않는다). 10-7을 MyBatis로 짰다면 같은 컬럼 조각(`<sql>`)과 태그 쿼리를 재사용한다 |
| R4 | 설명 | 작성 직후 글 행은 flush 없이도 보이는데 태그는 안 보이는 이유(IDENTITY)를 설명할 수 있다 |

## 필요한 지식

- [E5 MyBatis 첫걸음](../../lessons/E5-mybatis-first-steps.md) — Mapper 인터페이스+XML, `#{}`
- [G3 트랜잭션 첫 만남](../../lessons/G3-first-transaction.md)
- [E3 JPA는 무엇인가](../../lessons/E3-what-is-jpa.md) — 영속성 컨텍스트
- [W05 JPA와 MyBatis를 어떻게 나눠 쓰나](../../docs/knowledge/W05-jpa-vs-mybatis-strategy.md)
- [S09 JPA·Hibernate](../../docs/knowledge/S09-jpa-hibernate.md) — flush·변경 감지
- [S08 트랜잭션](../../docs/knowledge/S08-transactions.md) — 커밋 전 변경은 누가 보나
- [W16 id는 어떻게 만드나](../../docs/knowledge/W16-id-generation.md) — IDENTITY가 INSERT를 앞당기는 이유

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — MyBatis 쿼리</summary>

목록 카드의 컬럼을 `<sql id="columns">` 조각으로 둔다(10-7 선택 칸을 했다면 이미 있다).

```xml
<sql id="columns">
    SELECT p.id, p.title, p.visibility, p.view_count, p.like_count, p.created_at,
           u.id AS author_id, u.nickname AS author_nickname
    FROM posts p
    JOIN users u ON u.id = p.author_id
</sql>
```

```xml
<select id="findListRowById" resultType="org.example.board.post.PostListRow">
    <include refid="columns"/>
    WHERE p.id = #{id}
</select>
```

태그는 `SELECT pt.post_id, t.name FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id IN <foreach …>#{id}</foreach> ORDER BY t.name`. 목록 서비스에 `listItem(Long postId)`를 두고, 행 하나와 그 글의 태그로 항목 하나를 만든다.

태그도 **MyBatis로** 읽어야 한다 — JPA 쿼리로 읽으면 그 앞에서 Hibernate가 auto flush해 버려 아래 ①을 재현할 수 없다. </details>

<details>
<summary>힌트 2 — 서비스에서의 순서</summary>

```java
postRepository.save(post);          // 작성: posts INSERT는 여기서
postRepository.flush();             // post_tags INSERT를 지금 보낸다
PostListItemResponse item = postQueryService.listItem(post.getId());
```

```java
post.replace(...);                  // 수정: 엔티티 값만 바뀜
postRepository.flush();             // UPDATE·post_tags 교체를 지금 보낸다
PostListItemResponse item = postQueryService.listItem(postId);
```

`JpaRepository`에 `flush()`가 있다. `EntityManager`를 주입받아 `em.flush()`를 불러도 같다.
</details>

<details>
<summary>힌트 3 — 응답에 listItem 붙이기</summary>

상세 응답 record에 `@JsonInclude(JsonInclude.Include.NON_NULL) PostListItemResponse listItem` 필드를 더하고, 상세(`GET`)에서는 `null`로 둔다. 그러면 `GET` 응답에는 키가 없고, 10-5·10-8의 확인도 그대로 통과한다.
</details>

<details>
<summary>더 깊이 — 처음부터 피하는 설계</summary>

이 함정은 "한 메서드 안에서 쓰기 기술과 읽기 기술이 다르다"에서 생긴다. 실무에서 흔히 쓰는 길은 셋이다.

- 쓰는 메서드는 쓰기만 하고 id만 돌려준다. 읽기는 커밋 뒤 따로 한다(컨트롤러에서 서비스 두 번 호출 — 둘째 호출은 새 트랜잭션).
- 응답을 JPA 엔티티에서 바로 만든다(MyBatis를 안 거친다). 10-7을 JPA로 짰다면 목록 항목을 만드는 `PostListItemResponse.of(Post, 태그)`를 그대로 쓰면 되니 가장 단순하다. 목록이 MyBatis라면 "목록과 같은 모양"을 사람이 맞춰야 한다.
- 이 단계처럼 같은 트랜잭션에서 읽되, 경계에 `flush()`를 명시한다.

어느 쪽이든 "왜 그렇게 했는지"를 코드 주석 한 줄로 남긴다.
</details>

## 다음 단계

명세서 프로젝트를 끝냈다. 명세서 표의 "실패" 칸을 하나씩 짚으며 그 상황을 만드는 요청을 스스로 떠올려 본다. 모두 떠오르면 이 API를 처음부터 다시 만들 수 있다. 다음은 Java 탭의 티켓이다. 실무에서 들어오는 요청 하나를 받아 이미 있는 코드를 고친다.
