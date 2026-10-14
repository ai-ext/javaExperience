# 1-2. DB에 저장하고 201로 응답 — JPA 첫걸음

## 상황

> "저장되면 만든 글 정보를 그대로 돌려주세요. 화면에 바로 띄우게요. 새 글 주소도 알려 주시고요. 서버를 다시 켜도 글이 남아 있어야 해요."

1-1은 요청을 받기만 하고 `success`를 돌려줬다. 이제 받은 글을 **DB(`community`)의 `post` 테이블에 한 행으로 저장**하고, 저장된 글을 JSON으로 돌려준다. "새로 만들어졌다"는 상태 코드(`201`)와 새 글 주소(`Location` 헤더)도 붙인다.

이 단계는 일부러 작게 간다.

- 저장은 **JPA**로 한다. `Post` 엔티티 하나와 `JpaRepository` 하나면 `INSERT`를 내가 쓰지 않아도 된다.
- 컨트롤러가 저장소를 **바로** 부른다. 서비스로 나누는 일은 다음 단계(1-3)다.
- `post` 테이블의 컬럼 중 **저장에 꼭 필요한 것만** 엔티티에 매핑한다. 나머지 컬럼을 테이블에 정확히 맞추는 일은 1-4다.
- 로그인은 아직 없으니 **작성자는 김자바(회원 id 2)로 고정**한다(1-6에서 토큰으로 바꾼다). 태그는 아직 저장하지 않는다(1-3).


### 먼저 보는 역할

- `PostController`는 HTTP 요청을 받고 응답 상태·헤더·본문을 정한다.
- `PostCreateRequest`는 요청 JSON을 받는 DTO, `PostResponse`는 화면에 돌려줄 필드만 담는 응답 DTO다.
- `PostRepository`는 게시판 조회와 글 저장을 맡고, `Board`·`Post`는 DB 테이블 행을 나타내는 JPA `Entity`다.
- 이 단계에서는 `Controller`가 `Repository`를 직접 부른다. 처리 로직을 `Service`로 분리하는 내용은 다음 단계 [1-3](1-3-service-layer.md)에서 처음 다룬다.

### 응답 DTO는 class부터

첫 구현은 일반 Java 클래스로 필드·생성자·getter를 직접 확인한다. 아래는 `PostResponse.java` 전체 코드다.

~~~java
package org.example.post;

import java.time.LocalDateTime;

public class PostResponse {
    private final Long id;
    private final String boardSlug;
    private final String title;
    private final String content;
    private final String visibility;
    private final LocalDateTime createdAt;

    public PostResponse(Long id, String boardSlug, String title, String content,
                        String visibility, LocalDateTime createdAt) {
        this.id = id;
        this.boardSlug = boardSlug;
        this.title = title;
        this.content = content;
        this.visibility = visibility;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getBoardSlug() { return boardSlug; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public String getVisibility() { return visibility; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
~~~

Spring Boot의 Jackson은 getter를 읽어 같은 JSON 응답을 만든다. 필드는 `final`이고 setter가 없으므로 필드에 다른 값을 다시 대입할 수 없다. 다만 `List` 같은 참조 필드가 있으면 내부 요소까지 자동으로 불변이 되는 것은 아니다. 생성자에 전달한 필드가 곧 API 응답 계약이다.

Java 21에서는 같은 DTO를 `record`로 간결하게 쓸 수도 있다.

~~~java
package org.example.post;

import java.time.LocalDateTime;

public record PostResponse(
        Long id,
        String boardSlug,
        String title,
        String content,
        String visibility,
        LocalDateTime createdAt
) {
}
~~~

record는 구성 요소, 생성자, 접근자, `equals`·`hashCode`·`toString`을 만들어 주며, 구성 요소 참조를 다시 대입할 수 없게 하는 얕은 불변 데이터 표현이다. `List` 구성 요소를 둬도 그 목록 내부가 자동으로 불변이 되지는 않는다.

응답 DTO처럼 값을 담아 전달할 때 보일러플레이트가 적어 실무에서 편리하다. 우선 class 버전으로 필드와 생성자 관계를 익힌 뒤 record를 선택할 수 있다. 이 단계의 전체 답안 토글은 class 버전을 기준으로 한다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름의 단계를 누르면 관련된 화면 요소가 강조된다.

```screen
{
  "title": "글쓰기 → DB에 한 행 → 새 글 화면으로 이동",
  "summary": "글이 post 테이블의 한 행이 된다. 응답의 id는 DB가 붙인 번호(AUTO_INCREMENT)라서 서버를 다시 켜도 이어진다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "새 글 쓰기",
      "right": "김자바"
    },
    {
      "type": "select",
      "id": "board",
      "label": "게시판",
      "value": "개발"
    },
    {
      "type": "field",
      "id": "title",
      "label": "제목",
      "value": "[채점] 첫 게시글"
    },
    {
      "type": "field",
      "id": "content",
      "label": "본문",
      "value": "Spring Boot로 만든 첫 게시글입니다.",
      "multiline": true
    },
    {
      "type": "select",
      "id": "visibility",
      "label": "공개 범위",
      "value": "전체 공개"
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        {
          "id": "save",
          "label": "저장",
          "variant": "primary"
        },
        {
          "id": "cancel",
          "label": "취소",
          "variant": "ghost"
        }
      ]
    },
    {
      "type": "text",
      "id": "new-title",
      "value": "[채점] 첫 게시글",
      "emphasis": "title"
    },
    {
      "type": "text",
      "id": "new-meta",
      "value": "#22 · 방금 전 · 개발",
      "emphasis": "caption",
      "tone": "muted"
    },
    {
      "type": "toast",
      "id": "toast",
      "value": "글을 올렸어요",
      "tone": "success"
    }
  ],
  "flows": [
    {
      "name": "저장 → 새 글로 이동",
      "steps": [
        {
          "kind": "user",
          "text": "[저장]을 누른다",
          "focus": [
            "save"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\n  \"boardSlug\": \"dev\",\n  \"title\": \"[채점] 첫 게시글\",\n  \"content\": \"Spring Boot로 만든 첫 게시글입니다.\",\n  \"tags\": [\n    \"spring\",\n    \"jpa\"\n  ],\n  \"visibility\": \"PUBLIC\"\n}"
        },
        {
          "kind": "server",
          "text": "PostController: boardRepository.findBySlug(\"dev\")로 게시판을 찾고, Post 엔티티를 만들어 postRepository.save(post)를 부른다"
        },
        {
          "kind": "db",
          "sql": "SELECT id, created_at, name, slug, sort_order, write_role FROM board WHERE slug = 'dev'",
          "note": "dev 게시판은 id 2"
        },
        {
          "kind": "db",
          "sql": "INSERT INTO post (author_id, board_id, content, created_at, title, updated_at, visibility) VALUES (2, 2, 'Spring Boot로 만든 첫 게시글입니다.', NOW(), '[채점] 첫 게시글', NOW(), 'PUBLIC')",
          "note": "엔티티에 매핑한 7개 컬럼만 들어간다. id는 DB가 붙인다(시드 글이 21개라 22부터)"
        },
        {
          "kind": "response",
          "status": 201,
          "headers": [
            "Location: /api/posts/22",
            "Content-Type: application/json"
          ],
          "body": "{\n  \"id\": 22,\n  \"boardSlug\": \"dev\",\n  \"title\": \"[채점] 첫 게시글\",\n  \"content\": \"Spring Boot로 만든 첫 게시글입니다.\",\n  \"visibility\": \"PUBLIC\",\n  \"createdAt\": \"2026-10-06T17:30:00\"\n}"
        },
        {
          "kind": "screen",
          "text": "201이면 '만들어짐' — 응답 본문으로 새 글을 바로 그리고 주소창은 /posts/22로 바뀐다. 다시 불러올 필요가 없다",
          "focus": [
            "new-title",
            "new-meta",
            "toast"
          ]
        }
      ]
    },
    {
      "name": "서버를 다시 켜고 한 번 더 쓰기",
      "steps": [
        {
          "kind": "user",
          "text": "서버를 껐다 켠 뒤 새 글을 하나 더 저장한다",
          "focus": [
            "save"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\n  \"boardSlug\": \"dev\",\n  \"title\": \"[채점] 첫 게시글\",\n  \"content\": \"Spring Boot로 만든 첫 게시글입니다.\",\n  \"tags\": [\n    \"spring\",\n    \"jpa\"\n  ],\n  \"visibility\": \"PUBLIC\"\n}"
        },
        {
          "kind": "db",
          "sql": "INSERT INTO post (author_id, board_id, content, created_at, title, updated_at, visibility) VALUES (2, 2, ..., 'PUBLIC')",
          "note": "번호는 서버가 아니라 DB가 센다 — 서버를 다시 켜도 1로 돌아가지 않는다"
        },
        {
          "kind": "response",
          "status": 201,
          "headers": [
            "Location: /api/posts/23"
          ],
          "body": "{\"id\": 23, ...}"
        },
        {
          "kind": "screen",
          "text": "새 글 번호가 #23으로 보인다. 앞 글(#22)도 DB에 그대로 있다",
          "focus": [
            "new-meta"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `POST /api/posts` — 요청 본문은 1-1과 같다 |
| 저장 | `post` 테이블에 한 행. 아래 "저장 규칙" |
| 응답 상태 | `201 Created` |
| 응답 헤더 | `Location: /api/posts/{id}` — 방금 만든 글의 주소 |
| 응답 본문 | 아래 JSON(`Content-Type: application/json`) |

응답 본문:

```json
{
  "id": 22,
  "boardSlug": "dev",
  "title": "[채점] 첫 게시글",
  "content": "Spring Boot로 만든 첫 게시글입니다.",
  "visibility": "PUBLIC",
  "createdAt": "2026-10-06T17:30:00"
}
```

- `id` — DB가 붙인 번호(AUTO_INCREMENT). 시드에 글이 21개 있어서 처음 만든 글은 22 이상이다
- `createdAt` — 서버가 글을 만든 시각, ISO-8601 문자열(소수점 이하 초가 붙어도 된다)
- `boardSlug`·`title`·`content`·`visibility` — 요청에서 받은 값 그대로
- `tags`는 이 단계에서 저장하지 않으니 응답에도 넣지 않는다(저장 안 한 값을 돌려주지 않는다). 1-3에서 저장하고 응답에 싣는다

**저장 규칙** — 엔티티에 매핑할 컬럼

| 컬럼 | 값 |
|---|---|
| `id` | DB가 붙인다(`@GeneratedValue(strategy = GenerationType.IDENTITY)`) |
| `board_id` | `boardSlug`에 해당하는 `board.id`(`dev` → 2). `board` 테이블에서 slug로 찾는다 |
| `author_id` | `2`(고정) |
| `title`, `content`, `visibility` | 요청 값 |
| `created_at`, `updated_at` | 지금 시각(둘 다 같아도 된다) |

`post`에는 이 밖에도 `status`·`published_at`·`view_count`·`like_count`·`comment_count`·`deleted_at`이 있다. 엔티티에 없는 컬럼은 `INSERT`에 들어가지 않고 **테이블 기본값**이 채운다(`status`는 `'PUBLISHED'`, 카운트는 `0`, `published_at`은 `NULL`). 이 차이를 1-4에서 정확히 맞춘다.

**필드 규칙** — 이 단계는 검증을 하지 않는다. 규칙은 1-5에서 지키게 만든다. 아래 "지금 나오는 것"은 정답 코드(ref-1-2)에 실제로 보내 본 결과다.

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 지금 나오는 것(1-2, 관찰) | 1-5부터 |
|---|---|---|---|---|---|---|---|
| `boardSlug` | 필수 | 안 됨 | — | 있는 게시판의 slug | 없음 | 없는 slug(`nope`) → `500`(`IllegalArgumentException`) | `404` |
| `title` | 필수 | null·빈 문자열·공백만 안 됨 | 1~200자 | 문자열 | 없음 | `null` → `500`(`Column 'title' cannot be null`) · 공백만 → `201`로 그냥 저장 · 201자 → `500`(`Data too long for column 'title'`) | `400` |
| `content` | 필수 | null·빈 문자열·공백만 안 됨 | 제한 없음(`text`) | 문자열 | 없음 | 빈 문자열 → `201`로 그냥 저장 | `400` |
| `tags` | 선택 | `null`·`[]` 허용 | 최대 5개, 각 1~30자 | 문자열 배열 | `[]` | 저장하지 않는다(1-3부터 저장) | `400` |
| `visibility` | 선택 | 생략 가능 | `PUBLIC`·`FOLLOWERS` | 정해진 값 중 하나 | `PUBLIC` | `SECRET` → `500`(`Check constraint 'ck_post_visibility' is violated.`) · 생략 → `500`(`Column 'visibility' cannot be null`) | 틀린 값 `400` · 생략은 `PUBLIC` |

`500`은 "서버가 잘못했다"는 뜻이다. 그런데 위 경우는 서버가 아니라 **요청이 잘못된** 것이다. DB가 마지막 순간에 거절해서 `500`이 났을 뿐이다. 거꾸로 공백 제목은 DB가 막지 않아 **그냥 저장된다.** 둘 다 [1-5](1-5-validation.md)에서 저장 전에 막고 `400`으로 바꾼다.

## 설정 읽기

DB에 붙으려면 두 파일이 맞아야 한다. **`build.gradle`은 "무슨 라이브러리를 쓰나"**, **`application.yml`은 "어디에 어떻게 붙나"**다. 실습 레포에는 둘 다 처음부터 들어 있다. 이 단계부터 실제로 쓰니 한 줄씩 읽는다.

### build.gradle — 의존성

실습 레포의 `dependencies` 블록이다(이 단계에서 쓰는 줄).

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-webmvc'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    runtimeOnly 'com.mysql:mysql-connector-j'
    // … 테스트용 줄은 생략
}
```

| 줄 | 뜻 |
|---|---|
| `implementation '…:spring-boot-starter-webmvc'` | 웹 서버(Tomcat)·`@RestController`·JSON(Jackson 3). 1-1부터 쓰던 것이다. Boot 4부터 이름이 `starter-web`에서 `starter-webmvc`로 바뀌었다. |
| `implementation '…:spring-boot-starter-data-jpa'` | 이번 단계의 핵심이다. 한 줄에 여러 개가 같이 딸려 온다. JPA 표준(`jakarta.persistence.*` — `@Entity`·`@Id`), 그 구현체 Hibernate, `JpaRepository`를 주는 Spring Data JPA, 커넥션 풀 HikariCP, `JdbcTemplate`이 들어 있는 spring-jdbc다. |
| `runtimeOnly 'com.mysql:mysql-connector-j'` | MySQL 드라이버. 내 코드가 직접 `import`하지 않으니 **컴파일에는 필요 없고 실행할 때만** 필요하다. 그래서 `implementation`이 아니라 `runtimeOnly`다. |
| 버전이 없는 이유 | 맨 위 `id 'org.springframework.boot' version '4.1.1'` 플러그인이 서로 맞는 버전을 정해 준다. 직접 적으면 오히려 어긋날 수 있다. |

`build.gradle`을 고쳤으면 IntelliJ 오른쪽 **Gradle 창 → Reload(새로고침)**를 눌러야 반영된다. 안 누르면 고쳤는데도 같은 에러가 난다.

### application.yml — DB 연결

[시작하기](../../README.md)에서 넣은 블록이다. studymate MySQL의 `community` DB에 붙는다.

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/community?characterEncoding=UTF-8&serverTimezone=Asia/Seoul
    username: community
    password: community
  jpa:
    hibernate:
      ddl-auto: validate
```

| 키 | 뜻 |
|---|---|
| `spring.datasource.url` | 어디에 붙나. `jdbc:mysql://` 종류 · `localhost:3306` 호스트와 포트(studymate MySQL) · `/community` DB 이름 · `?characterEncoding=UTF-8&serverTimezone=Asia/Seoul` 한글과 시간대 옵션. |
| `username` · `password` | DB 계정. `community` 계정은 `community`·`practice` DB만 쓸 수 있다. |
| `jpa.hibernate.ddl-auto: validate` | 서버를 켤 때 Hibernate가 엔티티와 테이블을 **비교만** 한다. 엔티티가 가리키는 테이블·컬럼이 없으면 서버가 뜨지 않는다. 테이블은 절대 바꾸지 않는다. 무엇을 잡고 무엇을 못 잡는지는 [1-4](1-4-save-to-db.md#ddl-auto-validate가-잡는-것과-못-잡는-것)에서 본다. |

실습 레포의 `application.yml`에는 이 밖에 `open-in-view: false`, SQL 로그 설정(`org.hibernate.SQL`·`org.hibernate.orm.jdbc.bind`)도 있다. 지우지 말고 둔다. 로그 읽는 법은 [1-4의 SQL 로그 읽기](1-4-save-to-db.md#sql-로그-읽기)에 있다.

## 엔티티 한 장 읽기

`Post` 엔티티는 "`post` 테이블의 한 행 = 객체 하나"라는 약속이다. 이 단계의 정답 코드다(`org.example.post`).

```java
@Entity
@Table(name = "post")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    // 로그인 기능이 없는 동안 작성자는 id 숫자로만 둔다 — 1-4에서 Member 연관관계로 바꾼다
    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String content;

    @Column(nullable = false)
    private String visibility;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected Post() {
        // JPA
    }

    public Post(Board board, Long authorId, String title, String content,
                String visibility, LocalDateTime now) {
        this.board = board;
        this.authorId = authorId;
        this.title = title;
        this.content = content;
        this.visibility = visibility;
        this.createdAt = now;
        this.updatedAt = now;
    }

    // getter 생략
}
```

| 줄 | 뜻 |
|---|---|
| `@Entity` · `@Table(name = "post")` | 이 클래스는 `post` 테이블과 짝이다. `@Entity`가 없으면 저장소를 만들 수 없어 서버가 안 뜬다(아래 "일부러 망가뜨리기" 1번). |
| `@Id` + `@GeneratedValue(IDENTITY)` | 기본키. 번호는 내가 정하지 않고 MySQL의 AUTO_INCREMENT에 맡긴다. `save()`가 끝나면 이 필드에 번호가 들어온다. |
| `@ManyToOne` + `@JoinColumn(name = "board_id")` | `board_id` 컬럼을 숫자가 아니라 `Board` 객체로 다룬다. 저장할 때는 `board.getId()`가 `board_id`에 들어간다. `Board`도 `board` 테이블과 짝인 엔티티라 같이 만든다. |
| `@Column(name = "author_id")` | 필드 이름과 컬럼 이름을 잇는다. `name`을 안 적어도 Boot가 `authorId` → `author_id`로 바꿔 찾지만, 적어 두면 테이블과 대조하기 쉽다. |
| `protected Post() {}` | JPA가 DB 행을 객체로 만들 때 쓰는 인자 없는 생성자. 바깥에서 빈 글을 못 만들게 `protected`로 둔다. |
| `public Post(...)` | 내 코드가 새 글을 만들 때 쓰는 생성자. 시각은 한 번 정한 `now`로 두 컬럼을 채운다. |

저장소는 인터페이스만 만든다. 구현은 Spring Data JPA가 서버를 켤 때 만들어 준다.

```java
public interface PostRepository extends JpaRepository<Post, Long> {
}

public interface BoardRepository extends JpaRepository<Board, Long> {

    Optional<Board> findBySlug(String slug);   // 메서드 이름으로 SELECT … WHERE slug = ? 를 만든다
}
```

`postRepository.save(post)`를 부르면 Hibernate가 매핑을 보고 `INSERT`를 만든다. 이 단계 정답 코드가 실제로 낸 SQL이다(로그에서 줄바꿈만 줄였다).

```text
insert into post (author_id,board_id,content,created_at,title,updated_at,visibility) values (?,?,?,?,?,?,?)
```

매핑한 7개 컬럼만 들어간다. `status`·`published_at` 같은 나머지는 DB 기본값이 채운다.

## 일부러 망가뜨리기

다 만들어 통과한 뒤 하나씩 망가뜨려 보고 되돌린다. 메시지는 Spring Boot 4.1.1 · Hibernate 7.4.5에서 이 단계 정답 코드로 재현한 원문이다(경로는 줄였다).

**1. `Post`에서 `@Entity`를 지운다** → 서버가 안 뜬다.

```text
Caused by: org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'postRepository' defined in org.example.post.PostRepository defined in @EnableJpaRepositories declared on DataJpaRepositoriesRegistrar.EnableJpaRepositoriesConfiguration: Not a managed type: class org.example.post.Post
Caused by: java.lang.IllegalArgumentException: Not a managed type: class org.example.post.Post
```

- **어디를 보나** — 맨 아래 `Caused by:`의 `Not a managed type: class …Post`. "JPA가 관리하는 클래스(엔티티)가 아니다"라는 뜻이다.
- **고치는 법** — `@Entity`를 되돌린다. `JpaRepository<Post, Long>`의 `Post`는 엔티티여야 한다.

**2. `build.gradle`에서 data-jpa 줄을 지운다** → 컴파일이 안 된다(Reload 후).

```text
…/Post.java:3: error: package jakarta.persistence does not exist
import jakarta.persistence.Column;
                          ^
…/PostRepository.java:3: error: package org.springframework.data.jpa.repository does not exist
…/BoardRepository.java:3: error: package org.springframework.data.jpa.repository does not exist
```

`@Entity`도 `JpaRepository`도 이 한 줄이 준다. → [에러 도감: 의존성 누락](../../errors.md#의존성-누락--패키지-없음)

**3. `mysql-connector-j` 줄을 지운다** → 컴파일은 되는데 서버가 안 뜬다.

```text
Caused by: java.lang.RuntimeException: Failed to load driver class com.mysql.cj.jdbc.Driver
Caused by: java.lang.ClassNotFoundException: com.mysql.cj.jdbc.Driver
```

→ [에러 도감: MySQL 드라이버 없음](../../errors.md#mysql-드라이버-없음)

**4. DataSource URL을 틀린다**

- **포트를 아무도 안 쓰는 번호로 틀리거나 DB를 끄면** 두 경우 메시지가 같다. 로그 맨 끝 `Caused by:`는 진짜 원인이 아니니 **위쪽 `WARN`**을 본다.

  ```text
  WARN … org.hibernate.orm.jdbc.error : Communications link failure
  WARN … org.hibernate.orm.jdbc       : HHH100046: Could not obtain connection to query JDBC database metadata
  Caused by: java.net.ConnectException: Connection refused
  ```

  고치는 법 — studymate 레포 루트에서 `docker compose ps mysql`로 DB가 `healthy`인지, `url`의 포트가 `3306`인지 본다. → [에러 도감: DB에 연결 못 함](../../errors.md#db에-연결-못-함)

- **DB 이름을 틀리면(`/comunity`)** "없는 DB"가 아니라 **권한 없음**으로 나온다.

  ```text
  WARN … org.hibernate.orm.jdbc.error : Access denied for user 'community'@'%' to database 'comunity'
  ```

  → [에러 도감: DB 이름이나 계정이 틀림](../../errors.md#db-이름이나-계정이-틀림)

- **`url` 줄을 아예 지우면**

  ```text
  Description:

  Failed to configure a DataSource: 'url' attribute is not specified and no embedded datasource could be configured.

  Reason: Failed to determine a suitable driver class
  ```

  → [에러 도감: DataSource 설정 없음](../../errors.md#datasource-설정-없음)

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- PostController: boardRepository.findBySlug("dev")로 게시판을 찾고, Post 엔티티를 만들어 postRepository.save(post)를 부른다
- dev 게시판은 id 2
- 엔티티에 매핑한 7개 컬럼만 들어간다. id는 DB가 붙인다(시드 글이 21개라 22부터)
- 번호는 서버가 아니라 DB가 센다 — 서버를 다시 켜도 1로 돌아가지 않는다

<details>
<summary>Controller — HTTP 연결</summary>

`PostController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 변경된 메서드: `create`.

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`PostResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`BoardRepository.java`, `PostRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다.

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Board.java`, `Post.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다.

</details>

<details>
<summary>MyBatis — 같은 POST를 Mapper SQL로 구현하기</summary>

아래 **MyBatis 대체 구현 코드**의 7개 파일을 이 단계 전체 소스에 적용한다. `build.gradle`에 MyBatis starter를 추가하고 `application.yml`에서 XML 위치와 snake_case→camelCase 매핑을 설정한다.

`PostController`는 `PostCreationMapper.findBoardBySlug`로 `board.id`와 `slug`를 읽고, `PostInsert`에 고정 작성자 2와 요청 필드·서버 시각을 담아 `insertPost`를 부른다. `BoardWriteRow`는 조회 결과, `PostInsert`는 SQL 입력 객체다.

XML의 `#{...}`는 값을 SQL 문자열에 이어 붙이지 않고 바인딩한다. `useGeneratedKeys="true"`와 `keyProperty="id"`가 DB의 AUTO_INCREMENT 값을 `PostInsert.id`에 채운 뒤, 컨트롤러가 그 번호로 `201`과 `Location`을 만든다.

이 단계의 INSERT는 엔티티가 알던 7개 컬럼만 적으므로 `status`·카운트는 DB 기본값, `published_at`은 `NULL`이다. D1과 함께 `published_at`도 조회해 1-4와 비교한다. 선행 JPA 클래스는 코드 비교를 위해 남지만 이 POST 요청의 조회·저장은 Mapper를 통한다.

</details>

## 직접 확인

```bash
BASE=http://localhost:8080

# 요청 A — 정상 요청(두 번 보내서 id가 늘어나는지 본다)
curl -i -X POST "$BASE/api/posts" -H 'Content-Type: application/json' \
  -d '{"boardSlug":"dev","title":"[채점] 첫 게시글","content":"Spring Boot로 만든 첫 게시글입니다.","tags":["spring","jpa"],"visibility":"PUBLIC"}'

# 요청 B — 깨진 JSON
curl -i -X POST "$BASE/api/posts" -H 'Content-Type: application/json' -d '{"title": "[채점] 깨짐"'

# 관찰 O1~O5 — 잘못된 입력. 지금 무엇이 나오는지 본다(채점하지 않는다)
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/posts" -H 'Content-Type: application/json' \
  -d '{"boardSlug":"dev","title":null,"content":"본문","tags":[],"visibility":"PUBLIC"}'
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/posts" -H 'Content-Type: application/json' \
  -d '{"boardSlug":"dev","title":"   ","content":"","tags":[],"visibility":"PUBLIC"}'
```

**DB에서 확인** — 응답이 `201`이어도 정말 저장됐는지는 DB를 봐야 안다. 방금 저장된 행을 본다.

```bash
docker exec -i studymate-mysql-1 mysql --default-character-set=utf8mb4 -ucommunity -pcommunity community -e "
SELECT id, board_id, author_id, title, visibility, status, published_at, created_at FROM post ORDER BY id DESC LIMIT 1;"
```

studymate의 **'DB에서 확인'**으로 봐도 된다. 방금 저장된 행이 맨 위에 보인다. `status`가 `PUBLISHED`, `published_at`이 `NULL`인 것도 확인해 둔다. 내가 넣지 않은 컬럼은 테이블 기본값이 채웠다는 뜻이다(1-4에서 다룬다).

서버를 껐다 켠 뒤 요청 A를 한 번 더 보내면 `id`가 1로 돌아가지 않고 이어진다. 번호를 DB가 세기 때문이다.

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 관찰 요청(O1~O5)을 먼저 보내고 정상 요청 A를 나중에 보내므로, 실행 뒤 `ORDER BY id DESC LIMIT 1`로 보이는 행은 A의 두 번째 글이다.

```check
{
  "requests": [
    {
      "id": "O1",
      "title": "관찰 O1 — 제목 없음(null)",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "dev",
        "title": null,
        "content": "본문",
        "tags": [],
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "O2",
      "title": "관찰 O2 — 공백 제목 + 빈 본문",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "dev",
        "title": "   ",
        "content": "",
        "tags": [],
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "O3",
      "title": "관찰 O3 — 제목 201자",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "dev",
        "title": "[채점] 관찰-0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "content": "본문",
        "tags": [],
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "O4",
      "title": "관찰 O4 — 없는 공개 범위(SECRET)",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "dev",
        "title": "[채점] 관찰-공개범위",
        "content": "본문",
        "tags": [],
        "visibility": "SECRET"
      }
    },
    {
      "id": "O5",
      "title": "관찰 O5 — 없는 게시판(nope)",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "nope",
        "title": "[채점] 관찰-게시판",
        "content": "본문",
        "tags": [],
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "A",
      "title": "정상 요청(두 번)",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "dev",
        "title": "[채점] 첫 게시글",
        "content": "Spring Boot로 만든 첫 게시글입니다.",
        "tags": [
          "spring",
          "jpa"
        ],
        "visibility": "PUBLIC"
      },
      "repeat": 2
    },
    {
      "id": "B",
      "title": "깨진 JSON",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": "{\"title\": \"[채점] 깨짐\""
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A#1",
      "expect": {
        "status": 201,
        "json": [
          {
            "path": "$.id",
            "gt": 21
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "A#1",
      "expect": {
        "headers": {
          "Location": {
            "endsWith": "/api/posts/{{A#1.body.id}}"
          }
        }
      }
    },
    {
      "id": "C3",
      "request": "A#1",
      "expect": {
        "headers": {
          "Content-Type": {
            "contains": "application/json"
          }
        },
        "json": [
          {
            "path": "$.id",
            "type": "number"
          },
          {
            "path": "$.boardSlug",
            "equals": "dev"
          },
          {
            "path": "$.title",
            "equals": "[채점] 첫 게시글"
          },
          {
            "path": "$.content",
            "equals": "Spring Boot로 만든 첫 게시글입니다."
          },
          {
            "path": "$.visibility",
            "equals": "PUBLIC"
          },
          {
            "path": "$.createdAt",
            "matches": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}"
          }
        ]
      }
    },
    {
      "id": "C4",
      "request": "A#2",
      "expect": {
        "status": 201,
        "json": [
          {
            "path": "$.id",
            "gt": "{{A#1.body.id}}"
          }
        ]
      }
    },
    {
      "id": "C5",
      "request": "B",
      "expect": {
        "status": 400
      }
    },
    {
      "id": "C6",
      "manual": "관찰(채점 안 함) — O1 제목 null: 정답 코드에서는 500(DB가 Column 'title' cannot be null로 거절). 1-5에서 400으로 바꾼다"
    },
    {
      "id": "C7",
      "manual": "관찰(채점 안 함) — O2 공백 제목·빈 본문: 정답 코드에서는 201로 그냥 저장된다. 1-5에서 400으로 바꾼다"
    },
    {
      "id": "C8",
      "manual": "관찰(채점 안 함) — O3 제목 201자: 정답 코드에서는 500(Data too long for column 'title'). 1-5에서 400으로 바꾼다"
    },
    {
      "id": "C9",
      "manual": "관찰(채점 안 함) — O4 visibility SECRET: 정답 코드에서는 500(Check constraint 'ck_post_visibility' is violated). 1-5에서 400으로 바꾼다"
    },
    {
      "id": "C10",
      "manual": "관찰(채점 안 함) — O5 없는 게시판: 정답 코드에서는 500(IllegalArgumentException). 1-5에서 404로 바꾼다"
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). C6~C10은 **관찰**이다. 채점하지 않고(필수 N/M에 세지 않는다), 지금 무엇이 나오는지 보기만 한다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | 상태 `201`, `id`가 21보다 크다(DB가 붙인 번호) |
| C2 | 요청 A | 응답 헤더 `Location`이 있고, `/api/posts/{응답 본문의 id}`로 끝난다(앞에 `http://호스트`가 붙어도 된다) |
| C3 | 요청 A | `Content-Type`이 `application/json`이고, 본문에 `id`(숫자)·`boardSlug`·`title`·`content`·`visibility`·`createdAt`(ISO-8601 문자열)이 있다. `id`·`createdAt` 말고는 요청 값과 같다 |
| C4 | 요청 A를 한 번 더 | 상태 `201`, 두 번째 응답의 `id`가 첫 번째보다 크다 |
| C5 | 요청 B | 상태 `400` |
| C6 | 관찰 O1 — 제목 `null` | **채점 제외(관찰)** — 결과 줄의 필수 N/M에 세지 않는다. 받은 상태 코드를 적기만 한다. (정답 코드: `500` → 1-5에서 `400`) |
| C7 | 관찰 O2 — 공백 제목·빈 본문 | **채점 제외(관찰)** — 결과 줄의 필수 N/M에 세지 않는다. 받은 상태 코드를 적기만 한다. (정답 코드: `201`로 그냥 저장 → 1-5에서 `400`) |
| C8 | 관찰 O3 — 제목 201자 | **채점 제외(관찰)** — 결과 줄의 필수 N/M에 세지 않는다. 받은 상태 코드를 적기만 한다. (정답 코드: `500` → 1-5에서 `400`) |
| C9 | 관찰 O4 — `visibility` `SECRET` | **채점 제외(관찰)** — 결과 줄의 필수 N/M에 세지 않는다. 받은 상태 코드를 적기만 한다. (정답 코드: `500` → 1-5에서 `400`) |
| C10 | 관찰 O5 — 없는 게시판 | **채점 제외(관찰)** — 결과 줄의 필수 N/M에 세지 않는다. 받은 상태 코드를 적기만 한다. (정답 코드: `500` → 1-5에서 `404`) |
| D1 | `SELECT id, board_id, author_id, title, visibility FROM post ORDER BY id DESC LIMIT 1` | `id`가 마지막 `201` 응답의 `id`와 같고 `2, 2, [채점] 첫 게시글, PUBLIC` |
| R1 | 엔티티·저장소 | `post` 테이블에 맞는 `@Entity`와 `JpaRepository<Post, Long>`. 저장은 `save()`로 하고 SQL을 직접 쓰지 않는다 |
| R2 | 응답 객체 | 응답 전용 DTO(이 단계의 답안은 `class`이며, 같은 응답 형태를 `record`로도 표현할 수 있다)를 만든다. 엔티티나 요청 객체, `Map`을 그대로 돌려주지 않는다 |
| R3 | 201·Location | `ResponseEntity.created(URI)`처럼 상태와 `Location`을 함께 정한다. `Location`의 id는 저장 뒤 엔티티의 id다 |
| R4 | 시각 | `createdAt`을 클라이언트가 아니라 서버가 정한다 |

## 필요한 지식

- [E3 JPA는 무엇인가](../../lessons/E3-what-is-jpa.md) — 엔티티·저장소·`save()`가 하는 일
- [E2 DB와 테이블·SQL 기초](../../lessons/E2-db-sql-basics.md) — `post` 테이블 둘러보기
- [P19 MySQL 연결과 JPA 설정](../../docs/knowledge/P19-mysql-jpa-setup.md) — 연결 설정과 `ddl-auto`
- [W09 DTO는 왜 쓰나](../../docs/knowledge/W09-why-dto.md) — 엔티티 대신 응답 DTO를 돌려주는 이유
- [S06 REST API 설계 — 메서드와 상태 코드](../../docs/knowledge/S06-rest-api-clients.md#메서드와-상태-코드) — 200과 201, `Location` 헤더
- [P16 — 날짜·시간은 "문자열"이 아니라 계약이다](../../docs/knowledge/P16-json-jackson-practical.md#26-날짜시간은-문자열이-아니라-계약이다) — `createdAt`이 JSON에서 어떻게 보이나
- [R08 앱 서버와 DB 서버는 어떻게 연결되나](../../docs/knowledge/R08-app-to-db-connection.md) — 연결이 안 될 때

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 게시판 찾기</summary>

`Board` 엔티티(`board` 테이블)와 `BoardRepository extends JpaRepository<Board, Long>`를 만들고 `Optional<Board> findBySlug(String slug)`를 선언한다. 구현은 Spring Data JPA가 메서드 이름을 읽어 만든다.

컨트롤러에서 `boardRepository.findBySlug(request.boardSlug()).orElseThrow(...)`. </details>

<details>
<summary>힌트 2 — 저장소를 컨트롤러에 받기</summary>

컨트롤러에 `private final PostRepository postRepository;` 필드와 그것을 받는 생성자를 둔다. Spring이 서버를 켤 때 만들어 둔 저장소를 넣어 준다(자세한 이유는 1-3). `postRepository.save(post)`가 돌려준 객체의 `getId()`에 DB가 붙인 번호가 들어 있다.
</details>

<details>
<summary>힌트 3 — 201과 Location을 한 번에</summary>

반환 타입을 `ResponseEntity<PostResponse>`로 바꾸고 `ResponseEntity.created(URI.create("/api/posts/" + saved.getId())).body(응답)`.
</details>

<details>
<summary>힌트 4 — 서버가 안 뜰 때</summary>

로그에서 `Schema validation:`이 들어간 줄을 찾는다(Hibernate 7 표기 — 하이픈 없음). 엔티티의 테이블·컬럼 이름이 실제 테이블과 다르다는 뜻이다.

테이블은 CloudBeaver(`http://localhost:8978`)의 `community (Java 시나리오)` 연결이나 dump 파일 [`01-community.sql`](../../docker/mysql/init/01-community.sql)의 `CREATE TABLE`로 확인한다. </details>

## 다음 단계

[1-3. 서비스로 나누기](1-3-service-layer.md) — 태그까지 저장하려면 저장소가 셋으로 늘고, 저장이 중간에 실패해도 반쪽이 남지 않아야 한다. 그 일을 서비스와 트랜잭션에 맡긴다.
