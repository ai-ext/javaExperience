# 1-7. DB 직접 조작 — 여러 테이블과 트랜잭션

## 상황

> "글쓰기 API가 201을 줬는데, 실제로 어느 테이블에 들어갔나요? 제목을 SQL로 바꾸면 어떻게 되고, 실수했을 때 되돌릴 수 있나요?"

1-2~1-6에서 API로 글을 저장했다. 이번에는 `community` DB에 직접 접속해 **내가 만든 글만** 조회·수정·되돌리고, `post`·`member`·`board`·`tag`·`post_tag`의 관계를 확인한다. 기존 시드 행(id 1~21)은 수정하거나 지우지 않는다.

## 화면 시나리오

```screen
{
  "title": "API 응답과 DB 행 대조",
  "summary": "API로 만든 글의 id를 가지고 DB에서 여러 테이블을 JOIN한다. 트랜잭션 안에서 고친 뒤 ROLLBACK하면 원래 제목으로 돌아온다.",
  "screen": [
    { "type": "field", "id": "title", "label": "글 제목", "value": "[DB실습] 처음 제목" },
    { "type": "actions", "id": "send", "items": [{ "id": "submit", "label": "글 저장", "variant": "primary" }] },
    { "type": "text", "id": "db", "value": "post · board · member를 JOIN해 확인", "emphasis": "caption" }
  ],
  "flows": [{
    "name": "저장 뒤 DB 확인",
    "steps": [
      { "kind": "request", "method": "POST", "path": "/api/posts", "body": "{\"boardSlug\":\"dev\",\"title\":\"[DB실습] 처음 제목\",\"content\":\"SQL 실습 글입니다.\"}" },
      { "kind": "server", "text": "PostService가 작성자를 토큰에서 정해 저장한다" },
      { "kind": "db", "sql": "SELECT p.id, p.title, b.slug, m.nickname FROM post p JOIN board b ON b.id=p.board_id JOIN member m ON m.id=p.author_id WHERE p.id=:myPostId", "note": "응답의 id를 넣고 조회" },
      { "kind": "response", "status": 201, "body": "{\"id\":22,\"title\":\"[DB실습] 처음 제목\",...}" },
      { "kind": "screen", "text": "응답 id와 DB의 행이 같다", "focus": ["db"] }
    ]
  }]
}
```

## 만들 것

새 API를 만들지 않는다. 1-6의 `POST /api/posts`로 만든 **본인 글 한 행**을 SQL로 검산한다. SQL은 javaExperience CloudBeaver의 `community` 연결 또는 MySQL CLI에서 실행한다. 처음에는 아래의 완성 예시를 실행하고, 그다음 WHERE와 JOIN을 직접 바꿔 본다.

| 테이블 | 연결 열 | 이 단계에서 읽거나 바꿀 것 |
|---|---|---|
| `post` | `id`, `board_id`, `author_id` | API가 만든 글, 제목 변경·롤백, 표식 글 INSERT·DELETE |
| `board` | `id` | `post.board_id`가 가리키는 `slug='dev'` |
| `member` | `id` | `post.author_id`가 가리키는 토큰 주인(김자바 id 2) |
| `tag`·`post_tag` | `tag.id`, `post_tag.post_id`·`tag_id` | 표식 글에 `java` 태그 연결, 자식 행부터 삭제 |

`post`는 `board_id`와 `author_id`가 필수 외래키다. `post_tag`는 `(post_id, tag_id)` 복합 기본키라 같은 태그를 같은 글에 두 번 연결하면 오류가 난다. 1-3에서 JPA가 저장한 두 테이블의 행도 아래 SELECT로 볼 수 있다.

## 구현 가이드

이번 단계의 구현 위치는 Java 파일이 아니라 `community` DB의 **내가 만든 행**이다. 먼저 `post.id`와 토큰 회원 ID를 기록한다.

<details>
<summary>SQL — 외래키를 따라 요청 결과 찾기</summary>

`post.board_id → board.id`, `post.author_id → member.id`를 연결한다. 아래 `22`는 API 응답에서 받은 실제 글 ID로 바꾼다.

```sql
SELECT p.id, p.title, b.slug, m.nickname
FROM post p
JOIN board b ON b.id = p.board_id
JOIN member m ON m.id = p.author_id
WHERE p.id = 22 AND p.author_id = 2;
```

태그는 `post_tag.post_id`로 한 번 더 연결한다. JOIN을 하나씩 추가하면서 행 수가 어떻게 바뀌는지 확인한다.

</details>

<details>
<summary>롤백 — 직접 바꾼 행을 남기지 않기</summary>

같은 SQL 탭/연결에서 `START TRANSACTION`부터 `ROLLBACK`까지 실행한다. `WHERE`에는 **글 ID와 내 회원 ID 둘 다** 넣는다.

```sql
START TRANSACTION;
UPDATE post SET title = '[DB실습] 임시 제목', updated_at = NOW()
WHERE id = 22 AND author_id = 2;
SELECT id, title FROM post WHERE id = 22;
ROLLBACK;
SELECT id, title FROM post WHERE id = 22;
```

두 번째 SELECT가 원래 제목인지 확인한다. `ROLLBACK`은 `AUTO_INCREMENT` 번호를 되감지 않는다.

</details>

## 직접 확인

먼저 API로 글을 하나 만든다. 1-5의 제목·본문 길이 규칙에 맞춰 내용을 조정하고, 응답의 `id`를 기록한다. SQL 예시의 `22`는 **내 응답 id로 바꿔야 한다**. 시드에 글 21개가 있어 초기 상태에서는 22 이상이지만 채점 뒤에는 달라진다.

API 서버 주소는 페이지 상단 공통 입력에서 설정한다. 실행 패널의 A 요청을 보내고 응답 `id`를 SQL의 `22` 자리에 기록한다. Postman 설정은 접어서 확인할 수 있다.


버튼으로 확인 — 아래 실행 패널에서 글을 만들고 응답의 `id`를 기록한다.

```check
{
  "requests": [
    {
      "id": "A",
      "title": "SQL 실습용 글 만들기",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "boardSlug": "dev",
        "title": "[DB실습] 처음 제목",
        "content": "SQL로 행을 확인하고 트랜잭션을 연습합니다.",
        "tags": ["java"],
        "visibility": "PUBLIC"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 201,
        "json": [
          {"path": "$.title", "equals": "[DB실습] 처음 제목"},
          {"path": "$.boardSlug", "equals": "dev"}
        ]
      }
    }
  ]
}
```
CloudBeaver에서 `community` 연결을 열거나 MySQL CLI로 접속한다. 아래는 **완성된 3테이블 JOIN 예시**다. 먼저 실행해 `nickname='김자바'`, `slug='dev'`, 응답의 제목을 확인한다.

```sql
SELECT p.id, p.title, b.slug, m.nickname
FROM post p
JOIN board b ON b.id = p.board_id
JOIN member m ON m.id = p.author_id
WHERE p.id = 22 AND p.author_id = 2;
```

이제 `post_tag`와 `tag`를 JOIN해서 이 글의 태그 이름을 조회하는 SQL을 직접 작성한다. 시작 모양은 `FROM post_tag pt JOIN tag t ON t.id = pt.tag_id WHERE pt.post_id = 22`다. 기대 결과는 `java` 한 행이다.

### 트랜잭션 안에서 UPDATE 후 되돌리기

다음 SQL은 **같은 DB 세션**에서 차례로 실행한다. `SET @my_post_id = 22`의 22를 실제 내 글 id로 바꾼다. UPDATE 결과가 1행인지 보고, `ROLLBACK` 뒤 첫 제목으로 돌아왔는지 확인한다. DB 클라이언트가 문장마다 새 연결을 쓰면 같은 세션의 `@my_post_id`와 트랜잭션이 이어지지 않으므로 한 SQL 탭/연결에서 실행한다.

```sql
SET @my_post_id = 22;
START TRANSACTION;
SELECT title FROM post WHERE id = @my_post_id AND author_id = 2;
UPDATE post SET title = '[DB실습] SQL로 수정', updated_at = NOW()
WHERE id = @my_post_id AND author_id = 2;
SELECT title FROM post WHERE id = @my_post_id AND author_id = 2;
ROLLBACK;
SELECT title FROM post WHERE id = @my_post_id AND author_id = 2;
```

### 표식 글 INSERT·연결·DELETE

아래는 새로운 행의 필수 열을 채우는 **동작하는 예시**다. `board_id=2`는 dev, `author_id=2`는 김자바다. 시작 전 `SELECT id, slug FROM board`와 `SELECT id, nickname FROM member WHERE id=2`로 확인한다. 트랜잭션을 열고 표식 글을 넣은 뒤 `LAST_INSERT_ID()`를 변수에 담는다. 기존 글·태그를 건드리지 않는다.

```sql
START TRANSACTION;
INSERT INTO post (board_id, author_id, title, content, status, visibility,
                  published_at, created_at, updated_at)
VALUES (2, 2, '[DB실습] SQL 표식 글', '직접 INSERT한 글입니다.',
        'PUBLISHED', 'PUBLIC', NOW(), NOW(), NOW());
SET @sql_post_id = LAST_INSERT_ID();
INSERT INTO post_tag (post_id, tag_id)
SELECT @sql_post_id, id FROM tag WHERE name = 'java';
SELECT p.id, p.title, t.name
FROM post p JOIN post_tag pt ON pt.post_id = p.id
JOIN tag t ON t.id = pt.tag_id
WHERE p.id = @sql_post_id;
DELETE FROM post_tag WHERE post_id = @sql_post_id;
DELETE FROM post WHERE id = @sql_post_id AND author_id = 2;
SELECT COUNT(*) AS remaining FROM post WHERE id = @sql_post_id;
ROLLBACK;
```

`remaining`은 0이어야 한다. `post`를 먼저 DELETE하면 아직 `post_tag`가 가리켜 외래키 오류가 난다. 일부러 순서를 바꿔 오류를 본 경우에도 **같은 세션에서 `ROLLBACK`을 실행**해 실습 행을 정리한다. `ROLLBACK`은 행과 연결을 되돌리지만 `AUTO_INCREMENT` 번호를 되감지는 않는다. 다음 글 id가 건너뛰어도 정상이다.

## 채점 기준

이 단계는 DB에서 직접 실행하므로 자동 HTTP 채점 대신 SQL 결과와 실행 기록을 확인한다.

| # | 방법 | 기대 |
|---|---|---|
| D1 | API 응답 id로 3테이블 JOIN | `post.title`, `board.slug`, `member.nickname`이 요청·토큰과 일치 |
| D2 | `post_tag`·`tag` JOIN | 자신이 붙인 `java`가 한 행 |
| D3 | UPDATE 전·후·ROLLBACK 후 SELECT | 원래 제목 → 수정 제목 → 원래 제목 |
| D4 | 표식 글 INSERT·연결·삭제 | `post`·`post_tag` 두 테이블에 행이 보인 뒤 둘 다 없어짐 |
| R1 | 설명 | 외래키와 자식 행을 먼저 지우는 이유, `ROLLBACK`과 `AUTO_INCREMENT` 차이를 설명 |

## 필요한 지식

- [E2 DB와 SQL 기초](../../lessons/E2-db-sql-basics.md) — SELECT·JOIN·INSERT·UPDATE·DELETE
- [E3 JPA는 무엇인가](../../lessons/E3-what-is-jpa.md) — `save`와 DB의 INSERT
- [1-3 서비스로 나누기](1-3-service-layer.md) — 태그까지 한 트랜잭션

DB를 처음 상태로 돌려야 한다면 javaExperience 레포에서 `docker compose down -v && docker compose up -d`을 쓴다. **이 명령은 `community`·`practice`·`project` 세 DB와 CloudBeaver 작업 공간을 함께 초기화한다. 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`로 세 DB를 `docker/mysql/backup/<시각>/`에 떠 두고, CloudBeaver에 저장한 SQL 스크립트는 이 백업에 들어가지 않으니 따로 복사해 둔다.**

## 다음 단계

[1-8. 기존 글 복사 생성](1-8-copy-post.md) — 경로·쿼리·본문을 함께 받아 새 글과 태그 연결 행을 저장한다.
