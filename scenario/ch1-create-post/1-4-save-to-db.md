# 1-4. 엔티티와 테이블 정확히 맞추기 — 컬럼·NOT NULL·기본값

## 상황

1-3까지 저장한 글을 DB에서 열어 보면 이렇다(1-3 정답 코드로 저장한 행).

```text
id  board_id  author_id  title          status     visibility  published_at  view_count  like_count  comment_count
22  2         2          [채점] 태그 저장  PUBLISHED  PUBLIC      NULL          0           0           0
```

`status`·카운트는 엔티티에 없는데 값이 있다. 테이블 **기본값**(`DEFAULT 'PUBLISHED'`, `DEFAULT '0'`)이 채웠다. `published_at`은 기본값이 `NULL`이라 비어 있다. 2장의 게시판 목록은 `published_at` 최신순으로 정렬하므로, 이 글들은 최신 글인데도 목록 맨 뒤로 밀린다.

엔티티가 테이블의 **일부만** 알고 있어서 생긴 일이다. 이 단계에서 `post` 테이블의 컬럼을 하나도 빠짐없이 엔티티에 맞춘다.

- 모든 컬럼을 매핑하고, 값은 DB 기본값에 맡기지 않고 **서버가 정한다**(`status`, `published_at`, 카운트).
- `author_id`를 숫자 필드에서 `Member` 연관관계로 바꾸고, 응답에 작성자(`author`)를 싣는다. 로그인은 아직 없으니 작성자는 여전히 김자바(회원 id 2) 고정이다(1-6에서 토큰으로 바꾼다).
- `ddl-auto: validate`가 무엇을 잡고 무엇을 못 잡는지, SQL 로그로 실제로 들어간 값을 확인하는 법을 익힌다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글쓰기 → 모든 컬럼이 채워진 한 행",
  "summary": "post 행의 모든 컬럼을 서버가 정해 넣는다. 응답에 작성자가 실린다.",
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
      "value": "[채점] DB 저장"
    },
    {
      "type": "field",
      "id": "content",
      "label": "본문",
      "value": "Spring Boot로 만든 첫 게시글입니다.",
      "multiline": true
    },
    {
      "type": "chips",
      "id": "tags",
      "label": "태그",
      "items": [
        "spring",
        "채점태그"
      ]
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        {
          "id": "save",
          "label": "저장",
          "variant": "primary"
        }
      ]
    },
    {
      "type": "text",
      "id": "new-meta",
      "value": "#22 · 김자바 · 방금 전",
      "emphasis": "caption",
      "tone": "muted"
    }
  ],
  "flows": [
    {
      "name": "저장 — 모든 컬럼을 서버가 정한다",
      "steps": [
        {
          "kind": "user",
          "text": "태그를 붙여 저장한다",
          "focus": [
            "tags",
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
          "body": "{\n  \"boardSlug\": \"dev\",\n  \"title\": \"[채점] DB 저장\",\n  \"content\": \"Spring Boot로 만든 첫 게시글입니다.\",\n  \"tags\": [\n    \"spring\",\n    \"채점태그\"\n  ],\n  \"visibility\": \"PUBLIC\"\n}"
        },
        {
          "kind": "server",
          "text": "PostService(@Transactional): 게시판을 찾고, 작성자 2(김자바)를 붙이고, status=PUBLISHED·published_at=지금·카운트 0으로 엔티티를 만든다"
        },
        {
          "kind": "db",
          "sql": "INSERT INTO post (author_id, board_id, comment_count, content, created_at, deleted_at, like_count, published_at, status, title, updated_at, view_count, visibility) VALUES (2, 2, 0, ..., NOW(), NULL, 0, NOW(), 'PUBLISHED', '[채점] DB 저장', NOW(), 0, 'PUBLIC')",
          "note": "13개 컬럼이 모두 들어간다 — 기본값에 맡기는 컬럼이 없다"
        },
        {
          "kind": "db",
          "sql": "SELECT id, created_at, deleted_at, email, member_status, nickname, role, updated_at FROM member WHERE id = 2",
          "note": "응답에 쓸 닉네임을 트랜잭션 안에서 읽어 둔다"
        },
        {
          "kind": "db",
          "sql": "INSERT INTO post_tag (post_id, tag_id) VALUES (22, 2), (22, 9)"
        },
        {
          "kind": "response",
          "status": 201,
          "headers": [
            "Location: /api/posts/22"
          ],
          "body": "{\n  \"id\": 22,\n  \"boardSlug\": \"dev\",\n  \"title\": \"[채점] DB 저장\",\n  \"content\": \"Spring Boot로 만든 첫 게시글입니다.\",\n  \"tags\": [\n    \"spring\",\n    \"채점태그\"\n  ],\n  \"visibility\": \"PUBLIC\",\n  \"author\": {\n    \"id\": 2,\n    \"nickname\": \"김자바\"\n  },\n  \"createdAt\": \"2026-10-06T17:30:00\"\n}"
        },
        {
          "kind": "screen",
          "text": "작성자 이름이 응답에서 오므로 화면이 '김자바'를 표시한다",
          "focus": [
            "new-meta"
          ]
        }
      ]
    },
    {
      "name": "공개 범위를 빼고 보내면 — DB 기본값은 왜 안 들어가나",
      "steps": [
        {
          "kind": "user",
          "text": "공개 범위를 고르지 않고 저장한다",
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
          "body": "{\"boardSlug\": \"dev\", \"title\": \"[채점] 관찰-공개범위 생략\", \"content\": \"본문\", \"tags\": []}"
        },
        {
          "kind": "db",
          "sql": "INSERT INTO post (..., visibility) VALUES (..., NULL)",
          "note": "Column 'visibility' cannot be null — 테이블 기본값 'PUBLIC'이 있어도, NULL을 직접 넣으면 기본값은 쓰이지 않는다"
        },
        {
          "kind": "response",
          "status": 500,
          "body": "{\"status\": 500, \"error\": \"Internal Server Error\", \"path\": \"/api/posts\"}"
        },
        {
          "kind": "screen",
          "text": "저장 실패(1-5에서 '생략하면 PUBLIC'으로 서버가 정한다)"
        }
      ]
    }
  ]
}
```

## 만들 것

**API** — 요청은 그대로, 응답에 `author`가 추가된다(8개 필드).

```json
{
  "id": 22,
  "boardSlug": "dev",
  "title": "[채점] DB 저장",
  "content": "Spring Boot로 만든 첫 게시글입니다.",
  "tags": ["spring", "채점태그"],
  "visibility": "PUBLIC",
  "author": { "id": 2, "nickname": "김자바" },
  "createdAt": "2026-10-06T17:30:00"
}
```

상태 `201`, `Location: /api/posts/{id}`, 태그 규칙·트랜잭션은 1-3과 같다.

**테이블과 엔티티 대조** — `post`의 `CREATE TABLE`([`01-community.sql`](../../docker/mysql/init/01-community.sql))과 1-3까지의 엔티티를 나란히 놓았다.

| 컬럼 | 테이블 정의 | 1-3까지 엔티티 | 이 단계(1-4) |
|---|---|---|---|
| `id` | `bigint NOT NULL AUTO_INCREMENT` | `@Id @GeneratedValue(IDENTITY)` | 그대로 |
| `board_id` | `bigint NOT NULL`, FK → `board` | `@ManyToOne Board` | 그대로 |
| `author_id` | `bigint NOT NULL`, FK → `member` | `Long authorId`(숫자) | `@ManyToOne(fetch = LAZY) Member author` |
| `title` | `varchar(200) NOT NULL` | 매핑 | 그대로 |
| `content` | `text NOT NULL` | 매핑 | `columnDefinition = "text"` |
| `status` | `varchar(20) NOT NULL DEFAULT 'PUBLISHED'` | **없음** → DB 기본값 | `"PUBLISHED"`를 서버가 넣는다 |
| `visibility` | `varchar(20) NOT NULL DEFAULT 'PUBLIC'` | 매핑 | 그대로(요청 값) |
| `view_count`·`like_count`·`comment_count` | `int NOT NULL DEFAULT '0'` | **없음** → DB 기본값 | `0`을 서버가 넣는다 |
| `published_at` | `datetime DEFAULT NULL` | **없음** → `NULL` | 지금 시각 |
| `created_at`·`updated_at` | `datetime NOT NULL`(기본값 없음) | 매핑 | 그대로(지금 시각) |
| `deleted_at` | `datetime DEFAULT NULL` | **없음** | 매핑(값은 `NULL` — 삭제는 3-2) |

**저장 규칙**

| 컬럼 | 값 |
|---|---|
| `board_id` | `boardSlug`에 해당하는 `board.id`(`dev` → 2) |
| `author_id` | `2`(고정) |
| `status` | `PUBLISHED` |
| `visibility` | 요청 값 |
| `published_at`, `created_at`, `updated_at` | 지금 시각(셋 다 같다) |
| `view_count`, `like_count`, `comment_count` | `0` |
| `deleted_at` | `NULL` |

**지켜야 할 것**

- 테이블을 바꾸지 말고 엔티티를 테이블에 맞춘다. `application.yml`의 `ddl-auto: validate`는 그대로 둔다.
- 테이블은 CloudBeaver(`http://localhost:8978`)의 `community (Java 시나리오)` 연결, 아래 `SHOW CREATE TABLE`, dump 파일 중 편한 것으로 본다.

```bash
docker compose exec -T mysql mysql --default-character-set=utf8mb4 -ucommunity -pcommunity community -e "SHOW CREATE TABLE post\G"
```

**필드 규칙** — 1-2의 표 그대로다. 아직 검증하지 않는다. 이 단계에서 눈여겨볼 관찰은 **`visibility`를 생략하면 `500`**이라는 것이다(관찰 O1). 테이블에 `DEFAULT 'PUBLIC'`이 있는데도 그렇다. 이유는 아래 "기본값은 언제 들어가나". 생략하면 `PUBLIC`이 되게 하는 일은 [1-5](1-5-validation.md)에서 서버가 한다.

## `ddl-auto: validate`가 잡는 것과 못 잡는 것

`validate`는 서버를 켤 때 **엔티티가 가리키는 테이블·컬럼이 있는지, 타입이 맞는지**만 본다. 아래는 이 단계 정답 코드를 하나씩 바꿔 Spring Boot 4.1.1 · Hibernate 7.4.5에서 재현한 결과다.

| 엔티티를 이렇게 틀리면 | `validate`가 | 언제 드러나나 |
|---|---|---|
| 테이블 이름(`@Table(name = "posts")`) | 잡는다 — `missing table [posts]` | 서버를 켤 때 |
| 컬럼 이름(`@Column(name = "view_cnt")`) | 잡는다 — `missing column [view_cnt] in table [post]` | 서버를 켤 때 |
| 타입(`view_count`를 `String`으로) | 잡는다 — `wrong column type encountered in column [view_count]` | 서버를 켤 때 |
| `NOT NULL`인데 기본값 없는 컬럼(`updated_at`)을 엔티티에서 뺐다 | **못 잡는다**(서버가 뜬다) | 저장 요청 때 `500` — `Field 'updated_at' doesn't have a default value` |
| `@Column(nullable = false)`를 뺐다(`title`) | **못 잡는다** — 서버가 그대로 뜬다 | 아무 일도 없다. `NULL`이 들어가면 그때 DB가 거절한다 |
| `CHECK` 제약에 없는 값(`status`에 `"OPEN"`) | **못 잡는다** — 값은 서버를 켤 때 알 수 없다 | 저장 요청 때 `500` — `Check constraint 'ck_post_status' is violated.` |

`validate`는 "엔티티가 아는 것"이 테이블에 있는지를 본다. 엔티티가 **모르는** 컬럼은 비교하지 않는다. 그래서 1-3까지 `status`·`published_at`이 없어도 서버가 떴다. 테이블과 정확히 맞추는 일은 결국 `CREATE TABLE`과 엔티티를 사람이 대조하는 일이다(위 대조표).

`ddl-auto` 값의 차이

| 값 | 서버를 켤 때 하는 일 | 이 실습에서 |
|---|---|---|
| `none` | 아무것도 안 한다. MySQL이면 이 값이 기본이다(줄을 지웠더니 엔티티와 테이블이 달라도 서버가 떴다). | 틀린 엔티티가 요청 때에야 `500`으로 드러난다. |
| `validate` | 엔티티와 테이블을 **비교만** 한다. 다르면 서버가 안 뜬다. | **실습 레포 기본값.** 테이블은 그대로 두고 엔티티를 맞추게 만든다. |
| `update` | 엔티티에 있는데 테이블에 없는 컬럼·테이블을 **추가**한다(지우지는 않는다). | 쓰지 않는다. 오타 난 컬럼이 조용히 새로 생겨 버린다. |
| `create` | 켤 때마다 테이블을 **지우고 새로 만든다.** | **쓰면 안 된다.** `community` DB의 시드 데이터(글 21개·회원·게시판)가 사라진다. |
| `create-drop` | `create` + 끌 때 또 지운다. | **쓰면 안 된다.** 위와 같다. |

시드가 날아갔다면 javaExperience 레포 루트에서 `docker compose down -v && docker compose up -d`으로 처음 상태로 되돌린다.

## 기본값은 언제 들어가나

DB 기본값(`DEFAULT …`)은 **`INSERT`의 컬럼 목록에 그 컬럼이 없을 때만** 쓰인다. 컬럼을 적고 `NULL`을 넣으면 "`NULL`을 넣으라"는 뜻이라 기본값이 쓰이지 않는다.

- 1-3까지는 엔티티에 `status`가 없었다 → `INSERT` 컬럼 목록에 `status`가 없다 → 기본값 `'PUBLISHED'`가 들어갔다.
- `visibility`는 엔티티에 있다 → Hibernate는 매핑한 컬럼을 **항상** `INSERT`에 적는다 → 요청에서 빠지면 `NULL`을 넣는다 → `NOT NULL`이라 거절(`Column 'visibility' cannot be null`). 관찰 O1이 이것이다.
- `updated_at`은 `NOT NULL`인데 기본값이 없다 → 엔티티에서 빼면 컬럼 목록에서 빠지고, 채울 값이 없어 거절(`Field 'updated_at' doesn't have a default value`, 아래 "일부러 망가뜨리기" 4번).

그래서 이 실습은 **기본값을 서버(엔티티 생성자·서비스)가 정한다.** 테이블 기본값은 SQL로 직접 넣을 때를 위한 안전망으로 남겨 둔다. 서버가 정하면 응답과 DB가 어긋날 일이 없고, 코드만 보고도 어떤 값이 들어가는지 알 수 있다.

## SQL 로그 읽기

실습 레포 `application.yml`의 이 설정 덕분에, Hibernate가 보낸 SQL과 `?` 자리에 들어간 값이 로그에 찍힌다.

```yaml
spring:
  jpa:
    open-in-view: false
    properties:
      hibernate:
        format_sql: true

logging:
  level:
    org.hibernate.SQL: debug
    org.hibernate.orm.jdbc.bind: trace
```

| 키 | 뜻 |
|---|---|
| `jpa.open-in-view: false` | DB 연결을 트랜잭션(서비스 메서드)이 끝나면 바로 돌려준다. 그래서 컨트롤러에서 지연 로딩을 건드리면 에러가 난다(아래 "일부러 망가뜨리기" 6번). |
| `properties.hibernate.format_sql` | 로그에 찍히는 SQL을 여러 줄로 보기 좋게. |
| `logging.level.org.hibernate.SQL: debug` | 실행되는 SQL을 로그에 찍는다. |
| `logging.level.org.hibernate.orm.jdbc.bind: trace` | SQL의 `?` 자리에 들어간 값을 찍는다. 1-6부터는 토큰 같은 비밀값도 찍히므로 끈다. |

이 단계 정답 코드로 글 하나를 저장했을 때의 로그다(재현 로그, 앞부분 시각·스레드는 줄였다).

```text
DEBUG … org.hibernate.SQL :
    insert
    into
        post
        (author_id, board_id, comment_count, content, created_at, deleted_at, like_count, published_at, status, title, updated_at, view_count, visibility)
    values
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
TRACE … org.hibernate.orm.jdbc.bind : binding parameter (1:BIGINT) <- [2]
TRACE … org.hibernate.orm.jdbc.bind : binding parameter (2:BIGINT) <- [2]
TRACE … org.hibernate.orm.jdbc.bind : binding parameter (3:INTEGER) <- [0]
TRACE … org.hibernate.orm.jdbc.bind : binding parameter (4:VARCHAR) <- [Spring Boot로 만든 첫 게시글입니다.]
TRACE … org.hibernate.orm.jdbc.bind : binding parameter (5:TIMESTAMP) <- [2026-10-10T15:23:44.349760]
TRACE … org.hibernate.orm.jdbc.bind : binding parameter (6:TIMESTAMP) <- [null]
TRACE … org.hibernate.orm.jdbc.bind : binding parameter (7:INTEGER) <- [0]
TRACE … org.hibernate.orm.jdbc.bind : binding parameter (8:TIMESTAMP) <- [2026-10-10T15:23:44.349760]
TRACE … org.hibernate.orm.jdbc.bind : binding parameter (9:VARCHAR) <- [PUBLISHED]
TRACE … org.hibernate.orm.jdbc.bind : binding parameter (10:VARCHAR) <- [[채점] DB 저장]
TRACE … org.hibernate.orm.jdbc.bind : binding parameter (11:TIMESTAMP) <- [2026-10-10T15:23:44.349760]
TRACE … org.hibernate.orm.jdbc.bind : binding parameter (12:INTEGER) <- [0]
TRACE … org.hibernate.orm.jdbc.bind : binding parameter (13:VARCHAR) <- [PUBLIC]
DEBUG … org.hibernate.SQL :
    insert
    into
        post_tag
        (post_id, tag_id)
    values
        (?, ?)
TRACE … org.hibernate.orm.jdbc.bind : binding parameter (1:BIGINT) <- [22]
TRACE … org.hibernate.orm.jdbc.bind : binding parameter (2:BIGINT) <- [2]
```

읽는 법.

- 컬럼 목록의 순서와 `binding parameter (번호:타입)`의 번호가 짝이다. 9번째 컬럼 `status`에 9번 값 `PUBLISHED`가 들어갔다.
- 컬럼이 13개다. 1-2·1-3 때는 `insert into post (author_id,board_id,content,created_at,title,updated_at,visibility)` 7개였다. 빠진 컬럼이 DB 기본값으로 채워진 것이다.
- `<- [null]`이 보이면 그 컬럼에 `NULL`을 넣었다는 뜻이다(6번 `deleted_at`). 관찰 O1처럼 `500`이 나면, 여기서 `NULL`이 들어간 컬럼을 찾는다.
- `post_tag` `INSERT`의 `post_id`(22)는 바로 위 `post` `INSERT`로 DB가 붙인 번호다. 내가 넘긴 적이 없다.

## 데이터 넣는 두 가지

`post` 테이블에 행 하나를 넣는 방법은 크게 둘이다. **JPA가 SQL을 만들어 넣게 하거나, 내가 SQL을 직접 쓰거나.** 이 실습의 API는 JPA로 만든다. SQL로 넣어 보면 JPA가 대신 해 주는 일과, 테이블 정의(NOT NULL·기본값)가 하는 일이 보인다.

### SQL로 직접 넣기 — 터미널·CloudBeaver

터미널에서 한글을 넣을 때는 **`--default-character-set=utf8mb4`를 꼭 붙인다.** 빼면 컨테이너 안 클라이언트 기본값(`latin1`) 때문에 `SQLë¡œ ë„£ì€ ê¸€`처럼 깨져 저장된다(재현 확인). → [에러 도감: 한글이 깨져 보임](../../errors.md#한글이-깨져-보임)

```bash
docker compose exec -T mysql mysql --default-character-set=utf8mb4 -ucommunity -pcommunity community -e "
INSERT INTO post (board_id, author_id, title, content, status, visibility, published_at, created_at, updated_at)
VALUES (2, 2, 'SQL로 넣은 글', '터미널에서 INSERT', 'PUBLISHED', 'PUBLIC', NOW(), NOW(), NOW());
SELECT LAST_INSERT_ID();"
```

CloudBeaver(`http://localhost:8978`)라면 `community (Java 시나리오)` 연결 → SQL 편집기에 `INSERT …` 문만 붙여 넣고 실행한다.

SQL로 넣어 보면 JPA가 대신 해 주던 일이 다 내 몫이다.

- `NOT NULL`이고 기본값 없는 컬럼(`created_at`·`updated_at` 등)을 내가 빠짐없이 채워야 한다. 위 `INSERT`에 없는 `view_count` 같은 건 테이블 기본값(`DEFAULT '0'`)이 채운다.
- `boardSlug` → `board_id`(dev → 2) 같은 변환을 내가 직접 해야 한다.
- 태그를 붙이려면 `tag`에 있는지 먼저 보고, `post_tag`에 `(post_id, tag_id)`를 따로 `INSERT`해야 한다. 이미 있는 태그 이름을 또 `INSERT`하면 `Duplicate entry`로 거절된다(`tag.name`이 UNIQUE). → [에러 도감: 중복 키](../../errors.md#중복-키)
- 앱의 규칙(작성자 고정, 상태 `PUBLISHED`)을 거치지 않는다. 시험 데이터 넣기에는 편하지만, **API의 동작을 확인하는 방법은 아니다.**

### JdbcTemplate로 한 줄 넣기 — 그 중간

앱 코드 안에서 SQL을 직접 쓰고 싶을 때는 `JdbcTemplate`을 쓴다. data-jpa 스타터에 이미 들어 있어서 의존성을 더 넣지 않아도 생성자로 받을 수 있다.

```java
package org.example.tag;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class JdbcInsertExample {

    private final JdbcTemplate jdbcTemplate;

    public JdbcInsertExample(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public int insertTag(String name) {
        // ? 자리에 값이 순서대로 들어간다(문자열을 이어 붙이지 않는다 — SQL 주입 방지)
        return jdbcTemplate.update(
                "INSERT INTO tag (name, created_at) VALUES (?, ?)",
                name, LocalDateTime.now());
    }
}
```

재현해 보니 `update(...)`는 넣은 행 수 `1`을 돌려줬다. 같은 이름으로 한 번 더 부르면 `DuplicateKeyException: … Duplicate entry 'jdbc태그' for key 'tag.uk_tag_name'`이 났다.

| | JPA `save()` | `JdbcTemplate` | 터미널·CloudBeaver SQL |
|---|---|---|---|
| SQL은 누가 쓰나 | Hibernate가 만든다 | 내가 쓴다(앱 코드 안) | 내가 쓴다(앱 밖) |
| 결과를 객체로 | 엔티티로 자동 | 내가 매핑(`RowMapper`) | 표로 보기만 |
| 언제 쓰나 | 이 실습의 기본. 객체 단위 저장·수정 | 통계·대량 처리처럼 SQL이 더 분명할 때 | 데이터 확인, 시험 데이터 넣기 |

## 일부러 망가뜨리기

다 만들어 통과한 뒤 하나씩 망가뜨려 보고 되돌린다. 메시지는 Spring Boot 4.1.1 · Hibernate 7.4.5에서 이 단계 정답 코드로 재현한 원문이다(경로·시각은 줄였다).

**1. 테이블 이름을 틀린다** — `@Table(name = "post")` → `"posts"`

```text
Caused by: org.hibernate.tool.schema.spi.SchemaManagementException: Schema validation: missing table [posts]
```

`ddl-auto: validate`라서 서버가 안 뜬다. `none`이었다면 서버는 뜨고, 저장 요청 때 `Table 'community.posts' doesn't exist`로 `500`이 난다. 고치는 법 — 엔티티를 테이블 이름에 맞춘다. → [에러 도감: 테이블 없음](../../errors.md#테이블-없음)

**2. 컬럼 이름을 틀린다** — `@Column(name = "view_count")` → `"view_cnt"`

```text
Caused by: org.hibernate.tool.schema.spi.SchemaManagementException: Schema validation: missing column [view_cnt] in table [post]
```

`[컬럼] in table [테이블]`이 어디가 틀렸는지 알려 준다. 참고로 `@Column(name=…)`을 아예 안 적으면 Boot가 `viewCount` → `view_count`로 바꿔 찾아서 통과한다(재현 확인). → [에러 도감: 컬럼 이름 불일치](../../errors.md#컬럼-이름-불일치)

**3. 타입을 틀린다** — `private Integer viewCount;` → `private String viewCount;`

```text
Caused by: org.hibernate.tool.schema.spi.SchemaManagementException: Schema validation: wrong column type encountered in column [view_count] in table [post]; found [int (Types#INTEGER)], but expecting [varchar(255) (Types#VARCHAR)]
```

`found`가 테이블, `expecting`이 엔티티 쪽이다. 고치는 법 — 테이블 타입에 맞는 Java 타입(`int` → `Integer`)으로.

**4. `NOT NULL` 컬럼을 엔티티에서 뺀다** — `updatedAt` 필드와 그 매핑을 지운다(같이 `title`의 `nullable = false`도 지워 봤다).

- 서버는 **정상으로 뜬다.** `validate`는 엔티티에 없는 컬럼도, `nullable`도 비교하지 않는다.
- 저장 요청이 `500`이다.

  ```text
  WARN … org.hibernate.orm.jdbc.error : HHH000247: ErrorCode: 1364, SQLState: HY000
  WARN … org.hibernate.orm.jdbc.error : Field 'updated_at' doesn't have a default value
  ```

- 고치는 법 — `CREATE TABLE`에서 `NOT NULL`인데 `DEFAULT`가 없는 컬럼은 엔티티에 반드시 매핑하고 서버가 값을 넣는다.

**5. `CHECK`에 없는 상태 값을 넣는다** — 서비스의 `"PUBLISHED"`를 `"OPEN"`으로

```text
WARN … org.hibernate.orm.jdbc.error : HHH000247: ErrorCode: 3819, SQLState: HY000
WARN … org.hibernate.orm.jdbc.error : Check constraint 'ck_post_status' is violated.
```

`status`는 `DRAFT`·`PUBLISHED`·`HIDDEN`만 받는다(`ck_post_status`). 서버는 뜨고 저장 때 `500`이다. 고치는 법 — 테이블의 `CHECK`를 보고 허용된 값만 쓴다. 값이 정해진 컬럼은 `enum` + `@Enumerated(EnumType.STRING)`으로 두면 오타를 컴파일러가 잡는다.

**6. 서비스의 `@Transactional`을 지운다** → 서버는 뜨지만 저장 요청이 `500`이다.

```text
org.hibernate.LazyInitializationException: Could not initialize proxy [org.example.member.Member#2] - no session
	…
	at org.example.member.Member$HibernateProxy.getNickname(Unknown Source) ~[main/:na]
	at org.example.post.PostService.create(PostService.java:56) ~[main/:na]
```

`getReferenceById(2L)`로 받은 작성자는 아직 DB에서 안 읽은 대리 객체(proxy)다. 닉네임을 처음 읽을 때 DB에 가야 하는데, 트랜잭션이 없으니 연결(세션)이 이미 닫혀 있다. `@Transactional`은 두고 서비스의 "미리 읽어 두기" 두 줄(`saved.getAuthor().getNickname();` 등)만 지워도 같은 에러가 **컨트롤러**(`PostController.toResponse`)에서 난다. 고치는 법 — 서비스 메서드에 `@Transactional`을 붙이고, 응답에 필요한 값은 그 안에서 읽어 둔다. → [에러 도감: 지연 로딩 — no session](../../errors.md#지연-로딩--no-session)

**7. 엔티티의 기본 생성자를 지운다** — `Tag`에서 `protected Tag() {}`를 지운다.

```text
org.hibernate.InstantiationException: No default constructor for entity 'org.example.tag.Tag'
	…
	at org.example.post.PostService.create(PostService.java:48) ~[main/:na]
```

서버는 뜬다. 이미 있는 태그(`spring`)를 `findByName`으로 **읽어 올 때** `500`이 난다. JPA는 DB 행을 객체로 만들 때 인자 없는 생성자로 빈 객체부터 만들기 때문이다. 같은 줄을 `Post`에서 지우면 이 단계의 저장은 `201`로 성공한다. 글을 읽어 오는 2장에서 터진다. 고치는 법 — 엔티티마다 `protected` 기본 생성자를 둔다. → [에러 도감: 엔티티 기본 생성자 없음](../../errors.md#엔티티-기본-생성자-없음)

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- PostService(@Transactional): 게시판을 찾고, 작성자 2(김자바)를 붙이고, status=PUBLISHED·published_at=지금·카운트 0으로 엔티티를 만든다
- 13개 컬럼이 모두 들어간다 — 기본값에 맡기는 컬럼이 없다
- 응답에 쓸 닉네임을 트랜잭션 안에서 읽어 둔다
- Column 'visibility' cannot be null — 테이블 기본값 'PUBLIC'이 있어도, NULL을 직접 넣으면 기본값은 쓰이지 않는다

<details>
<summary>Controller — HTTP 연결</summary>

`PostController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다.

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`AuthorResponse.java`, `PostResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

</details>

<details>
<summary>Service — 처리 순서</summary>

`PostService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`MemberRepository.java`, `PostRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다.

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Member.java`, `Post.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다.

</details>

<details>
<summary>MyBatis — 모든 컬럼과 작성자 응답을 SQL로 맞추기</summary>

아래 **MyBatis 대체 구현 코드**의 10개 파일을 이 단계 전체 소스에 적용한다. `PostService`가 Mapper로 게시판과 회원 2의 `id`·`nickname`을 조회한다. JPA의 지연 로딩 대신 필요한 회원 값을 `AuthorWriteRow`에 먼저 읽고, 서비스가 `AuthorResponse`를 만들어 컨트롤러에 돌려준다. 이 단계에는 1-5의 게시판 쓰기 권한·입력 검증 규칙을 앞당겨 적용하지 않는다.

`PostCreationMapper.xml`의 `insertPost`에는 post의 13개 컬럼을 모두 적는다. `status='PUBLISHED'`, 세 카운트 `0`, `published_at`·`created_at`·`updated_at`에 같은 `#{now}`, `deleted_at=NULL`을 대조한다. 요청에서 `visibility`를 빼면 `#{visibility}`가 `NULL`로 바인딩되어 DB의 `DEFAULT 'PUBLIC'`이 적용되지 않고 O1은 `500`이다. JPA와 MyBatis 모두 D1~D3에서 저장 행·태그·중복 방지를 확인한다. 태그·글·연결 행은 서비스의 `@Transactional` 안에서 저장한다.

</details>

## 직접 확인

```bash
BASE=http://localhost:8080

# 요청 A' — 새 태그 '채점태그' 포함
curl -i -X POST "$BASE/api/posts" -H 'Content-Type: application/json' \
  -d '{"boardSlug":"dev","title":"[채점] DB 저장","content":"Spring Boot로 만든 첫 게시글입니다.","tags":["spring","채점태그"],"visibility":"PUBLIC"}'

# 관찰 O1 — 공개 범위 생략(채점 안 함)
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/posts" -H 'Content-Type: application/json' \
  -d '{"boardSlug":"dev","title":"[채점] 관찰-공개범위 생략","content":"본문","tags":[]}'

# DB 확인 — 방금 행의 모든 컬럼
docker compose exec -T mysql mysql --default-character-set=utf8mb4 -ucommunity -pcommunity community -e "
SELECT id, board_id, author_id, status, visibility, published_at, view_count, like_count, comment_count, created_at, updated_at, deleted_at
FROM post ORDER BY id DESC LIMIT 1;"
```

CloudBeaver의 `community` 연결으로 방금 저장된 행을 봐도 된다. 1-3 때와 달리 `published_at`이 채워져 있어야 한다.

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 관찰 요청 O1을 먼저 보낸다.

```check
{
  "requests": [
    {
      "id": "O1",
      "title": "관찰 O1 — 공개 범위 생략",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "dev",
        "title": "[채점] 관찰-공개범위 생략",
        "content": "본문",
        "tags": []
      }
    },
    {
      "id": "A",
      "title": "요청 A'(두 번) — 새 태그 '채점태그' 포함",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "dev",
        "title": "[채점] DB 저장",
        "content": "Spring Boot로 만든 첫 게시글입니다.",
        "tags": [
          "spring",
          "채점태그"
        ],
        "visibility": "PUBLIC"
      },
      "repeat": 2
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A#1",
      "expect": {
        "status": 201,
        "headers": {
          "Location": {
            "endsWith": "/api/posts/{{A#1.body.id}}"
          }
        },
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
            "equals": "[채점] DB 저장"
          },
          {
            "path": "$.content",
            "equals": "Spring Boot로 만든 첫 게시글입니다."
          },
          {
            "path": "$.tags",
            "length": 2
          },
          {
            "path": "$.tags",
            "contains": "spring"
          },
          {
            "path": "$.tags",
            "contains": "채점태그"
          },
          {
            "path": "$.visibility",
            "equals": "PUBLIC"
          },
          {
            "path": "$.author.id",
            "equals": 2
          },
          {
            "path": "$.author.nickname",
            "equals": "김자바"
          },
          {
            "path": "$.createdAt",
            "matches": "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}"
          }
        ]
      }
    },
    {
      "id": "C3",
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
      "id": "C4",
      "manual": "관찰(채점 안 함) — O1 공개 범위 생략: 정답 코드에서는 500(Column 'visibility' cannot be null — DB 기본값 PUBLIC이 쓰이지 않는다). 1-5에서 서버가 PUBLIC으로 정한다"
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). C4는 **관찰**이다(채점 안 함 — 필수 N/M에 세지 않는다). `{id}`는 C1 응답의 `id`다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A' | 상태 `201`, `Location`이 `/api/posts/{id}`로 끝나고 `id`가 21보다 크다 |
| C2 | 요청 A' | 본문 8개 필드. `author.id` = `2`, `author.nickname` = `김자바`, `tags` = `["spring","채점태그"]`(순서 무관) |
| C3 | 요청 A'를 한 번 더 | 상태 `201`, `id`가 C1보다 크다 |
| C4 | 관찰 O1 — 공개 범위 생략 | **채점 제외(관찰)** — 결과 줄의 필수 N/M에 세지 않는다. 받은 상태 코드를 적기만 한다. (정답 코드: `500` → 1-5에서 `201`, `visibility`는 `PUBLIC`) |
| D1 | `SELECT board_id, author_id, status, visibility, published_at IS NOT NULL AS published, published_at = created_at AS same_time, like_count, comment_count, deleted_at IS NULL AS not_deleted FROM post WHERE id = {id}` | `2, 2, PUBLISHED, PUBLIC, 1, 1, 0, 0, 1` |
| D2 | `SELECT t.name FROM post_tag pt JOIN tag t ON t.id = pt.tag_id WHERE pt.post_id = {id} ORDER BY t.name` | 2행: `spring`, `채점태그` |
| D3 | `SELECT COUNT(*) FROM tag WHERE name = '채점태그'` | `1` — 요청을 여러 번 보내도 태그는 하나 |
| R1 | 엔티티 | `post`의 모든 컬럼이 매핑되어 있고 이름·타입이 테이블과 맞는다. 작성자는 `@ManyToOne(fetch = LAZY)` 연관관계(또는 id 필드) |
| R2 | 값 | `status`·`published_at`·카운트를 DB 기본값에 맡기지 않고 서버가 정한다(엔티티 생성자나 서비스 한 곳) |
| R3 | 응답 | 엔티티를 그대로 응답하지 않고 DTO로 바꾼다. 작성자 닉네임은 트랜잭션 안에서 읽어 둔다(지연 로딩) |
| R4 | 트랜잭션 | 글·태그 저장이 서비스 메서드 하나의 `@Transactional` 안에 있다(1-3 그대로) |
| R5 | 교체 범위 | 바뀐 곳이 주로 엔티티·서비스·응답 DTO이고, 컨트롤러는 응답 변환 한 줄 정도만 바뀐다 |

## 필요한 지식

- [P20 JPA 엔티티·연관관계 매핑](../../docs/knowledge/P20-jpa-entity-mapping.md) — 컬럼 매핑과 `@ManyToOne`
- [P20 — 연관관계의 주인](../../docs/knowledge/P20-jpa-entity-mapping.md#24-연관관계의-주인)
- [P19 — `ddl-auto`는 환경별 정책이다](../../docs/knowledge/P19-mysql-jpa-setup.md#24-ddl-auto는-환경별-정책이다)
- [E3 JPA는 무엇인가](../../lessons/E3-what-is-jpa.md) — `save`가 `INSERT`가 되는 길, SQL 로그
- [E4 JPA 연관관계](../../lessons/E4-jpa-associations.md) — 번호 대신 객체, 지연 로딩
- [W11 트랜잭션은 왜 서비스 계층에 거나](../../docs/knowledge/W11-why-tx-in-service.md)
- [W03 DB 접근 방식 총비교](../../docs/knowledge/W03-db-access-comparison.md) — JPA가 하는 일과 안 하는 일

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 엔티티 맞추기</summary>

`SHOW CREATE TABLE post`의 컬럼을 위에서부터 하나씩 필드로 옮긴다. 이름이 snake_case면 `@Column(name = "view_count")`. `text` 컬럼은 `@Column(columnDefinition = "text")`. 서버가 안 뜨면 로그에서 `Schema validation:`이 들어간 줄을 찾는다(Hibernate 7 표기 — 하이픈 없음) — 어떤 컬럼이 안 맞는지 알려 준다.
</details>

<details>
<summary>힌트 2 — 작성자</summary>

`Member` 엔티티(`member` 테이블)와 `MemberRepository`를 만들고, 서비스에서 `memberRepository.getReferenceById(2L)`로 작성자를 붙인다. `getReferenceById`는 `SELECT` 없이 id만 든 대리 객체를 준다. 응답에 닉네임이 필요하니 서비스(트랜잭션) 안에서 `getNickname()`을 한 번 불러 둔다.
</details>

<details>
<summary>힌트 3 — 기본값</summary>

엔티티 생성자에서 `this.status = "PUBLISHED"`(또는 서비스에서 넘기기), `this.viewCount = 0` …, `this.publishedAt = now`처럼 정한다. 같은 `now`로 `created_at`·`updated_at`·`published_at`을 채우면 세 시각이 같다.
</details>

## 다음 단계

[1-5. 입력 검증과 에러 응답](1-5-validation.md) — 지금까지 관찰한 `500`과 "그냥 저장"을 저장 전에 막고 `400`·`404`로 바꾼다.
