# 9-3. 컬럼 추가와 백필

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다.

## 상황

> "목록에 제목만 있으니 심심해요. 본문 앞부분을 한두 줄 미리 보여 주세요."

목록 쿼리에서 매번 `content`(TEXT, 긴 글은 8천 자)를 읽어 자르면 무겁다(2-2에서 본문을 목록에서 뺀 이유). 그래서 **미리 잘라 둔 요약 컬럼**을 만든다. 이미 있는 글 145개에도 값을 채워야 한다(**백필**). 그리고 앞으로 만들거나 고치는 글도 요약이 맞게 유지돼야 한다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "목록에 본문 미리보기",
  "summary": "미리 잘라 둔 요약 컬럼(excerpt)을 추가하고 기존 145개 글을 채운다(백필).",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "개발 게시판"
    },
    {
      "type": "list",
      "id": "posts",
      "items": [
        {
          "id": "x1",
          "title": "[채점] 요약 확인",
          "meta": "짧게 바꾼 본문"
        },
        {
          "id": "x2",
          "title": "MySQL 인덱스 설계 질문드립니다",
          "meta": "안녕하세요, 운영자입니다. 결론부터 말하면 설계를 바꾸…"
        }
      ]
    }
  ],
  "flows": [
    {
      "name": "목록 열기",
      "steps": [
        {
          "kind": "user",
          "text": "개발 게시판을 연다",
          "focus": [
            "posts"
          ]
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/boards/dev/posts?size=3"
        },
        {
          "kind": "db",
          "sql": "SELECT p.id, p.title, p.excerpt, ... FROM post p ... LIMIT 3",
          "note": "긴 content(TEXT)는 읽지 않는다"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"items\": [{\"id\": 145, \"title\": \"…\", \"excerpt\": \"앞 100자…\"}, …]}"
        },
        {
          "kind": "screen",
          "text": "제목 아래 한두 줄 미리보기",
          "focus": [
            "x2"
          ]
        }
      ]
    },
    {
      "name": "본문 고치기",
      "steps": [
        {
          "kind": "user",
          "text": "글 본문을 짧게 고친다"
        },
        {
          "kind": "request",
          "method": "PATCH",
          "path": "/api/posts/146",
          "headers": [
            "Content-Type: application/json",
            "Authorization: Bearer tok-p02"
          ],
          "body": "{\"content\": \"짧게 바꾼 본문\"}"
        },
        {
          "kind": "server",
          "text": "엔티티의 본문 변경 메서드가 excerpt도 같이 바꾼다 — 작성·수정 경로마다 따로 자르지 않는다"
        },
        {
          "kind": "db",
          "sql": "UPDATE post SET content = '짧게 바꾼 본문', excerpt = '짧게 바꾼 본문', updated_at = NOW() WHERE id = 146"
        },
        {
          "kind": "response",
          "status": 200
        },
        {
          "kind": "screen",
          "text": "미리보기도 바로 바뀐다",
          "focus": [
            "x1"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

| 할 일 | 내용 |
|---|---|
| V3 | `db/migration/V3__add_post_excerpt.sql` — 세 단계를 한 파일에: ① `excerpt VARCHAR(120) NULL` 추가 ② 기존 글 백필 `UPDATE post SET excerpt = LEFT(content, 100)` ③ `NOT NULL`로 바꾸기 |
| 규칙 | `excerpt` = 본문 앞 100자(`LEFT(content, 100)`과 같다) |
| 엔티티 | `excerpt` 필드 추가(`ddl-auto: validate`가 통과해야 한다) |
| 작성·수정 | 글을 만들거나(1장) 본문을 고치면(3-1) `excerpt`도 같이 바뀐다 |
| 목록 | 2-2·2-3 목록 항목과 8-4 검색 결과에 `excerpt` 필드 추가 |

**필드 규칙** — 입력 규칙은 1-5(작성)·3-1(수정) 그대로다. 이 단계에서 새로 생기는 위험은 "본문이 안 바뀌는 수정"에서 요약을 다시 계산하다 `null`을 다루지 못하는 것이다

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `content`(작성) | 필수 | 없음·`null`·`""`·공백만 거절 | 제한 없음 — `excerpt`는 앞 100자(101자 본문이면 100자로 잘린다) | 문자열 | 없음 | `400`, `errors`에 `content` |
| `content`(수정) | 선택 | 생략·`null`이면 본문·요약 그대로(`500`이 나면 안 된다). `""`·공백만은 거절 | 위와 같다 | 문자열 | 그대로 | `400`, `errors`에 `content` |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- Flyway V3가 컬럼을 추가하고 기존 행을 채운 뒤 `NOT NULL`을 적용한다.
- 목록·검색은 본문 `content(TEXT)` 대신 `excerpt`만 조회하고, 태그는 페이지의 글 ID로 한 번 더 가져온다.
- JPA는 엔티티의 `changeContent`에서, MyBatis는 공통 SQL 조각에서 본문과 요약을 함께 바꾼다.

<details>
<summary>Controller — 기존 요청 경로</summary>

`BoardPostController.list`의 `GET /api/boards/{slug}/posts`와 `PostSearchController`의 `GET /api/posts/search`는 `PostQueryService`로 이어진다. 작성 `POST /api/posts`, 전체 수정 `PUT /api/posts/{id}`, 부분 수정 `PATCH /api/posts/{id}`는 기존 `PostController`의 계약을 그대로 사용한다. 이 단계는 응답과 저장 규칙을 바꾸므로 컨트롤러를 중복 작성할 필요가 없다.

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`PostListItemResponse.java`에 `String excerpt`를 추가한다. `PostListRow.java`는 목록에서 DB가 돌려준 열을 담는 조회 DTO다. 상세 응답에는 전체 `content`를 계속 사용한다.

```java
public record PostListRow(Long id, String title, String excerpt,
                          Long authorId, String authorNickname,
                          Integer likeCount, Integer commentCount, Integer viewCount,
                          LocalDateTime publishedAt) { }
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`PostQueryService.java`는 게시판 목록과 검색에 같은 `PostSearchRepository.search`를 쓴다. `@Transactional(readOnly = true)` 안에서 조회 결과를 응답 DTO로 바꾸고, 태그는 `findTagsByPostIds` 한 번으로 모은다.

```java
List<Long> ids = result.getContent().stream().map(PostListRow::id).toList();
Map<Long, List<String>> tags = postSearchRepository.findTagsByPostIds(ids).stream()
        .collect(Collectors.groupingBy(PostTagRow::postId,
                Collectors.mapping(PostTagRow::name, Collectors.toList())));
```

</details>

<details>
<summary>JPA Repository — 본문을 읽지 않는 목록 투영</summary>

`PostSearchRepository.java`의 `CriteriaQuery<PostListRow>`는 목록에 필요한 열만 선택한다. `content`가 이 선택 목록에 없다는 점을 확인한다. `Page`의 건수는 별도 COUNT로 세며 태그는 선택된 글 ID의 `IN` 쿼리로 읽는다.

```java
query.select(cb.construct(PostListRow.class,
        post.get("id"), post.get("title"), post.get("excerpt"),
        post.get("author").get("id"), post.get("author").get("nickname"),
        post.get("likeCount"), post.get("commentCount"), post.get("viewCount"),
        post.get("publishedAt")));
```

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Post.java`의 생성자와 `changeContent`가 같은 계산을 쓴다. 전체 수정 `replace`도 `changeContent(content)`를 호출해야 한다. Java는 코드 포인트 기준으로 잘라 MySQL의 `LEFT(content, 100)`과 맞춘다.

```java
@Column(nullable = false, length = 120)
private String excerpt;

public void changeContent(String content) {
    this.content = content;
    this.excerpt = excerptOf(content);
}
```

</details>

<details>
<summary>Flyway / SQL — 스키마 변경</summary>

`V3__add_post_excerpt.sql`은 이미 저장된 글을 위한 마이그레이션이다. 기존 값이 채워진 것을 확인한 뒤 `NOT NULL`을 적용한다.

```sql
ALTER TABLE post ADD COLUMN excerpt VARCHAR(120) NULL AFTER content;
UPDATE post SET excerpt = LEFT(content, 100);
ALTER TABLE post MODIFY COLUMN excerpt VARCHAR(120) NOT NULL;
```

</details>

<details>
<summary>MyBatis Mapper — 조회와 본문 수정</summary>

이 단계의 MyBatis 대체 앱은 글 작성 `POST`와 복사 `POST /{sourceId}/copies`에 기존 JPA `PostService`를 사용한다. 생성자의 `excerptOf`가 작성 시 요약을 계산한다.

MyBatis가 맡는 게시판 목록·검색과 PATCH·PUT은 다음 Mapper를 쓴다. `PostVisibilityMapper.xml`의 목록·검색 `SELECT`에는 `p.excerpt`를 넣고 `p.content`는 넣지 않는다. `PostReplaceMapper.xml`은 PATCH와 PUT에서 같은 SQL 조각을 사용하며, PATCH의 `content: null`은 그 조각을 실행하지 않는다.

```xml
<sql id="contentAndExcerpt">content = #{content}, excerpt = LEFT(#{content}, 100),</sql>
<if test="content != null"><include refid="contentAndExcerpt"/></if>
```

</details>

## 직접 확인

```bash
BASE=http://localhost:8080
P='Authorization: Bearer tok-p02'; J='Content-Type: application/json'
jid() { python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])'; }
BODY=$(python3 -c 'print("가" * 150)')

curl -s "$BASE/api/boards/dev/posts?size=3" | python3 -c 'import sys,json; print([(i["id"], len(i["excerpt"])) for i in json.load(sys.stdin)["items"]])'   # A1
X=$(curl -s -X POST "$BASE/api/posts" -H "$P" -H "$J" -d "{\"boardSlug\":\"dev\",\"title\":\"[채점] 요약 확인\",\"content\":\"$BODY\",\"tags\":[]}" | jid); echo "X=$X"   # A2
curl -s -X PATCH "$BASE/api/posts/$X" -H "$P" -H "$J" -d '{"content":"짧게 바꾼 본문"}' > /dev/null                                                              # A3

# 잘못된 입력 — 요약 계산이 null을 다루나
curl -s -o /dev/null -w '%{http_code}\n' -X PATCH "$BASE/api/posts/$X" -H "$P" -H "$J" -d '{"content":null}'    # V1 200(그대로)
curl -s -o /dev/null -w '%{http_code}\n' -X PATCH "$BASE/api/posts/$X" -H "$P" -H "$J" -d '{"content":"   "}'  # V2 400
curl -s "$BASE/api/boards/dev/posts?size=1" | python3 -c 'import sys,json; i=json.load(sys.stdin)["items"][0]; print(i["id"], i["excerpt"])'   # V3 요약 그대로
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "A1",
      "title": "dev 게시판 목록(size=3)",
      "method": "GET",
      "path": "/api/boards/dev/posts?size=3"
    },
    {
      "id": "A2",
      "title": "150자 본문으로 글 쓰기",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-p02"
      },
      "body": {
        "boardSlug": "dev",
        "title": "[채점] 요약 확인",
        "content": "가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가가",
        "tags": []
      }
    },
    {
      "id": "B1",
      "title": "B1 본문 101자로 수정",
      "method": "PATCH",
      "path": "/api/posts/{{A2.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p02"
      },
      "body": {
        "content": "나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나다"
      }
    },
    {
      "id": "B2",
      "title": "B2 목록 첫 항목 — 101자 본문의 요약",
      "method": "GET",
      "path": "/api/boards/dev/posts?size=1"
    },
    {
      "id": "A3",
      "title": "본문 짧게 고치기",
      "method": "PATCH",
      "path": "/api/posts/{{A2.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p02"
      },
      "body": {
        "content": "짧게 바꾼 본문"
      }
    },
    {
      "id": "V1",
      "title": "V1 본문 null로 수정(그대로)",
      "method": "PATCH",
      "path": "/api/posts/{{A2.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p02"
      },
      "body": {
        "content": null
      }
    },
    {
      "id": "V2",
      "title": "V2 공백만 본문으로 수정",
      "method": "PATCH",
      "path": "/api/posts/{{A2.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-p02"
      },
      "body": {
        "content": "   "
      }
    },
    {
      "id": "V3",
      "title": "V3 목록 첫 항목 — 요약이 그대로인가",
      "method": "GET",
      "path": "/api/boards/dev/posts?size=1"
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A1",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items[0].excerpt",
            "matches": "^[\\s\\S]{0,100}$"
          },
          {
            "path": "$.items[1].excerpt",
            "matches": "^[\\s\\S]{0,100}$"
          },
          {
            "path": "$.items[2].excerpt",
            "matches": "^[\\s\\S]{0,100}$"
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "A2",
      "expect": {
        "status": 201
      }
    },
    {
      "id": "C3",
      "all": [
        {
          "request": "B1",
          "expect": {
            "status": 200
          }
        },
        {
          "request": "B2",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[0].id",
                "equals": "{{A2.body.id}}"
              },
              {
                "path": "$.items[0].excerpt",
                "equals": "나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나나"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C4",
      "all": [
        {
          "request": "V1",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.content",
                "equals": "짧게 바꾼 본문"
              }
            ]
          }
        },
        {
          "request": "V2",
          "expect": {
            "status": 400,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            },
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "content"
              }
            ]
          }
        },
        {
          "request": "V3",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[0].id",
                "equals": "{{A2.body.id}}"
              },
              {
                "path": "$.items[0].excerpt",
                "equals": "짧게 바꾼 본문"
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

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). `{X}`는 A2에서 만든 글의 id다.

| # | 확인 방법 | 기대 |
|---|---|---|
| D1 | `SELECT is_nullable, character_maximum_length FROM information_schema.columns WHERE table_schema = 'practice' AND table_name = 'post' AND column_name = 'excerpt'` | `NO`, `120` |
| D2 | `SELECT COUNT(*) FROM post WHERE excerpt <> LEFT(content, 100)` | `0` — 기존 글과 새 글 모두 규칙대로 |
| D3 | `SELECT CHAR_LENGTH(excerpt) FROM post WHERE id = 124` | `100` — 8천 자짜리 긴 글도 잘렸다 |
| D4 | `SELECT excerpt FROM post WHERE id = {X}` | `짧게 바꾼 본문` — 본문을 고치면 요약도 바뀐다 |
| C1 | A1 | `200`, 각 항목에 `excerpt`가 있고 길이 100 이하 |
| C2 | A2 | `201` |
| C3 | B1 / B2 | 본문을 101자로 고치면 `200`, 목록 첫 항목(방금 쓴 글)의 `excerpt`는 앞 100자 — 경계 바로 밖에서 잘린다 |
| C4 | V1 / V2 / V3 | `content: null` 수정은 `200`이고 본문 그대로(`500`이 아니다) / 공백만 본문은 `400`(`errors`에 `content`) / 그 뒤 목록의 `excerpt`는 여전히 `짧게 바꾼 본문` |
| R1 | 세 단계 | "NULL 허용으로 추가 → 채우기 → NOT NULL" 순서인 이유(처음부터 NOT NULL이면 기존 행 때문에 실패하거나 기본값이 들어간다)를 설명할 수 있다 |
| R2 | 한 곳에서 계산 | 요약 계산이 엔티티(예: `changeContent`)나 한 메서드에 있다. 작성·수정 경로마다 따로 자르지 않는다 |
| R3 | 큰 테이블 | 수백만 행이면 `UPDATE` 한 번이 오래 잠근다는 것과, 나눠서(배치) 채우는 방법을 안다 |

## 필요한 지식

- [S11 캐시·Redis·DB 마이그레이션](../../docs/knowledge/S11-cache-redis-migration.md)
- [R03 스키마와 테이블 설계 — 타입과 VARCHAR](../../docs/knowledge/R03-schema-types-constraints.md)
- [W09 DTO는 왜 쓰나](../../docs/knowledge/W09-why-dto.md) — 응답에 필드를 추가할 때

## 다음 단계

[9-4. 새 테이블과 API — 알림](9-4-notifications.md)
