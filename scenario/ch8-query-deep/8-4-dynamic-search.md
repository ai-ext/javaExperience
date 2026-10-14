# 8-4. 조합 검색 — 동적 쿼리

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다(8-1 참고).

## 상황

> "검색 화면에 필터가 여러 개예요. 게시판, 태그, 작성자, 기간, 제목 키워드. 아무거나 골라서 같이 걸 수 있어야 해요."

조건이 5개면 조합은 32가지다. 조합마다 메서드를 만들 수는 없다. **들어온 조건만 붙이는** 동적 쿼리를 만든다. 2-3의 "볼 수 있는 글만" 규칙도 그대로 붙어야 한다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "검색 화면",
  "summary": "필터 다섯 개를 아무거나 골라 같이 건다. 들어온 조건만 쿼리에 붙인다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "검색"
    },
    {
      "type": "select",
      "id": "board",
      "label": "게시판",
      "value": "질문"
    },
    {
      "type": "chips",
      "id": "tag",
      "label": "태그",
      "items": [
        "spring"
      ]
    },
    {
      "type": "field",
      "id": "q",
      "label": "제목 키워드",
      "value": ""
    },
    {
      "type": "field",
      "id": "from",
      "label": "시작일",
      "value": "2026-10-01"
    },
    {
      "type": "field",
      "id": "to",
      "label": "종료일",
      "value": "2026-09-01",
      "error": "시작일이 종료일보다 늦어요"
    },
    {
      "type": "list",
      "id": "results",
      "items": [
        {
          "id": "r139",
          "title": "#139",
          "meta": "질문"
        },
        {
          "id": "r130",
          "title": "#130",
          "meta": "질문"
        },
        {
          "id": "r111",
          "title": "#111",
          "meta": "질문"
        }
      ],
      "footer": "12개"
    }
  ],
  "flows": [
    {
      "name": "태그만",
      "steps": [
        {
          "kind": "user",
          "text": "태그 'jpa'만 고르고 검색한다",
          "focus": [
            "tag"
          ]
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/posts/search?tag=jpa&size=5"
        },
        {
          "kind": "server",
          "text": "값이 있는 조건만 붙인다 — 태그가 있을 때만 post_tag 존재 여부를 검사한다"
        },
        {
          "kind": "db",
          "sql": "SELECT ... FROM post p WHERE (볼 수 있는 글 조건) AND EXISTS (SELECT 1 FROM post_tag pt JOIN tag t ON t.id = pt.tag_id WHERE pt.post_id = p.id AND t.name = 'jpa')\nORDER BY p.published_at DESC, p.id DESC LIMIT 5"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"items\": [123, 118, 98, 87, 79], \"totalElements\": 13, ...}"
        },
        {
          "kind": "screen",
          "text": "13개 중 앞 5개",
          "focus": [
            "results"
          ]
        }
      ]
    },
    {
      "name": "게시판 + 태그",
      "steps": [
        {
          "kind": "user",
          "text": "게시판 '질문' + 태그 'spring'",
          "focus": [
            "board",
            "tag"
          ]
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/posts/search?board=qna&tag=spring&size=5"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"items\": [139, 130, 111, 106, 104], \"totalElements\": 12}"
        },
        {
          "kind": "screen",
          "text": "두 조건이 AND로",
          "focus": [
            "r139",
            "r130"
          ]
        }
      ]
    },
    {
      "name": "날짜를 거꾸로",
      "steps": [
        {
          "kind": "user",
          "text": "시작일을 종료일보다 늦게 넣는다",
          "focus": [
            "from",
            "to"
          ]
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/posts/search?from=2026-10-01&to=2026-09-01"
        },
        {
          "kind": "response",
          "status": 400,
          "headers": [
            "Content-Type: application/problem+json"
          ]
        },
        {
          "kind": "screen",
          "text": "'시작일이 종료일보다 늦어요'",
          "focus": [
            "to"
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
| 메서드·경로 | `GET /api/posts/search?board=&tag=&author=&from=&to=&q=&page=0&size=10` |
| 인증 | 선택(2-3과 같다 — 없으면 비로그인, 있으면 그 회원 기준) |
| `board` | 게시판 slug. 없는 게시판이면 결과 0건(`200`) — 없는 태그와 같다(2-2의 게시판 목록 404와 다르다: 검색은 "조건에 맞는 글이 없다"일 뿐이다) |
| `tag` | 태그 이름(정확히 일치). 없는 태그면 결과 0건(`200`), 공백만 입력하면 필터 생략 |
| `author` | 작성자 회원 id |
| `from`, `to` | `published_at`의 날짜 범위 `YYYY-MM-DD`, **둘 다 포함**(`to`는 그날 끝까지). MySQL `DATETIME`의 날짜 범위 `1000-01-01`~`9999-12-31`만 허용한다. 범위 밖이거나 `from > to`면 `400`. 게시판이 없어도 날짜 오류를 먼저 검사한다 |
| `q` | 제목에 포함(대소문자 무시) |
| 정렬·응답 | 2-2와 같다(`published_at` 최신 → `id`, `items`·`totalElements`·`hasNext` …) |
| 큰 `page` | `long` offset을 `int`로 잘라 앞 글을 다시 보여 주지 않는다. 범위 밖 페이지는 기존 `totalElements`를 유지한 빈 `items`, `hasNext=false` |

## 구현 가이드

`GET /api/posts/search?board=&tag=&author=&from=&to=&q=&page=0&size=10` 계약을 기준으로 아래 순서대로 구현한다. 먼저 직접 작성하고, 막힌 역할만 펼쳐 아래의 전체 구현 코드와 비교한다.

화면 시나리오에서 서버가 맡는 일:

- 값이 있는 조건만 붙인다. 태그는 `EXISTS`로 검사해 여러 태그가 달린 글이 중복되지 않게 한다.

<details>
<summary>Controller / HTTP</summary>

`PostSearchController.java`: 경로·쿼리 값을 받고 조회 결과를 응답 DTO로 돌린다. 인증이 선택인 조회와 필수인 조회를 구분한다. 확인할 메서드: `search`.

```java
@GetMapping("/api/posts/search")
public PostListResponse search(@RequestParam(required = false) String board,
                               @RequestParam(required = false) String tag,
                               @RequestParam(required = false) Long author,
                               @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                               @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
                               @RequestParam(required = false) String q,
                               @RequestParam(defaultValue = "0") @Min(0) int page,
                               @RequestParam(defaultValue = "10") @Min(1) @Max(50) int size,
                               @LoginMember AuthenticatedMember viewer) {
    PostSearchCondition.validateDates(from, to);
    return postQueryService.search(board, tag, author, from, to, q, page, size, viewer);
}
```

</details>

<details>
<summary>DTO / 입력·응답</summary>

`PostSearchCondition.java`: 요청 검증과 응답 필드를 계약에 맞춘다. 생략·null·기본값·길이의 차이를 확인한다. 확인할 메서드: `ofBoard`.

```java
public record PostSearchCondition(Long boardId, String tag, Long authorId,
                                  LocalDate from, LocalDate to, String q) {
    public PostSearchCondition {
        validateDates(from, to);
    }

    public static void validateDates(LocalDate from, LocalDate to) {
        LocalDate min = LocalDate.of(1000, 1, 1);
        LocalDate max = LocalDate.of(9999, 12, 31);
        if ((from != null && (from.isBefore(min) || from.isAfter(max)))
                || (to != null && (to.isBefore(min) || to.isAfter(max)))) {
            throw new InvalidSearchConditionException("날짜는 1000-01-01부터 9999-12-31까지 입력할 수 있습니다.");
        }
        if (from != null && to != null && from.isAfter(to)) {
            throw new InvalidSearchConditionException("from이 to보다 늦을 수 없습니다.");
        }
    }

    public static PostSearchCondition ofBoard(Long boardId) {
        return new PostSearchCondition(boardId, null, null, null, null, null);
    }
}
```

조건 DTO의 `null`은 필터를 적용하지 않는다는 뜻이다. Controller가 날짜를 먼저 검사해야 없는 게시판으로 조기 반환할 때도 잘못된 날짜를 `400`으로 응답한다. 응답은 선행 단계의 `PostListResponse`를 그대로 사용하며 `items`, `totalElements`, `totalPages`, `hasNext`가 조회 결과와 일치해야 한다.

</details>

<details>
<summary>Service / 규칙·트랜잭션</summary>

`PostAccessPolicy.java`, `PostQueryService.java`: 조회 가능 조건과 결과 조립을 담당한다. 페이지 조회 뒤에 Java에서 항목을 다시 걸러 총건수를 틀리게 만들지 않는다. 확인할 메서드: `search`.

```java
if (from != null && to != null && from.isAfter(to)) {
    throw new InvalidSearchConditionException("from이 to보다 늦을 수 없습니다.");
}
Long boardId = null;
if (boardSlug != null && !boardSlug.isBlank()) {
    Board board = boardRepository.findBySlug(boardSlug).orElse(null);
    if (board == null) {
        return toListResponse(Page.empty(pageRequest));
    }
    boardId = board.getId();
}
PostSearchCondition condition = new PostSearchCondition(boardId, tag, authorId, from, to, q);
return toListResponse(postSearchRepository.search(condition, viewerIdOf(viewer),
        pageRequest));
```

위 코드는 조립 흐름을 보여 주는 발췌다. `PageRequest pageRequest = PageRequest.of(page, size)`는 앞에서 생성한다. 없는 게시판의 조기 반환을 빼면 전체 글을 돌려주는 오류가 생긴다.

</details>

<details>
<summary>JPA / Repository·SQL</summary>

`PostRepository.java`, `PostSearchRepository.java`: JPA 파생 메서드 또는 `@Query`에서 필터·정렬·페이지를 DB에 적용한다. 목록이면 COUNT에도 같은 조건을 쓴다. 확인할 메서드: `search`.

```java
// SELECT와 COUNT 모두 conditions(...)를 사용한다.
query.select(post).where(conditions(cb, query, post, cond, viewerId))
        .orderBy(cb.desc(post.get("publishedAt")), cb.desc(post.get("id")));
countQuery.select(cb.count(countRoot))
        .where(conditions(cb, countQuery, countRoot, cond, viewerId));

if (cond.tag() != null && !cond.tag().isBlank()) {
    Subquery<Long> tagged = query.subquery(Long.class);
    Root<Post> sub = tagged.from(Post.class);
    Join<Post, Tag> tags = sub.join("tags");
    tagged.select(sub.get("id"))
            .where(cb.equal(sub, post), cb.equal(tags.get("name"), cond.tag()));
    predicates.add(cb.exists(tagged));
}
```

조회 가능 조건은 `viewable(...)`에 모으고, 게시판·작성자·기간·제목·태그 필터를 `conditions(...)`에서 추가한다. 태그를 `EXISTS`로 검사하면 글 한 건이 여러 행으로 늘어나지 않는다.

COUNT를 먼저 실행한 뒤 `pageable.getOffset() >= total`이면 빈 페이지를 반환한다. 그래야 큰 offset을 `int`로 바꿔 앞부분의 글을 다시 읽지 않는다. `hasNext`는 `page + 1`의 `int` 덧셈 대신 `long` offset과 조회 건수로 계산한다.

`to=9999-12-31`에서는 다음 날 00:00이 MySQL 범위를 벗어나므로 종료일 상한 조건을 생략한다. DB에 저장할 수 있는 모든 `DATETIME` 값이 이 최대 날짜 이하이기 때문이다.

</details>

<details>
<summary>예외 처리 / 실패 응답</summary>

`ApiExceptionHandler.java`, `InvalidSearchConditionException.java`: 도메인 실패를 계약에 적힌 HTTP 상태로 바꾼다. 검증 오류가 500으로 번지지 않는지 확인한다. 확인할 메서드: `handleInvalidSearchCondition`.

```java
@ExceptionHandler(InvalidSearchConditionException.class)
public ProblemDetail handleInvalidSearchCondition(InvalidSearchConditionException ex,
                                                  HttpServletRequest request) {
    ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
    problem.setInstance(URI.create(request.getRequestURI()));
    return problem;
}
```

</details>

<details>
<summary>MyBatis / SQL 선택 경로 — JPA 조건을 옮기기</summary>

JPA 참조 구현의 `PostSearchCondition`을 Mapper 매개변수로 그대로 쓴다. 공백 태그는 Service에서 `null`로 정규화한다. 아래는 실제 구현에서 검색 핵심을 발췌했다. 바로 실행할 수 있는 전체 구현은 이어지는 **MyBatis 대체 구현 코드**에 `PostVisibilityMapper.java`, `PostVisibilityMapper.xml`, `PostQueryService.java` 전문으로 들어 있다.

```xml
<sql id="searchWhere">
    <include refid="viewableWhere"/>
    <if test="condition.boardId != null">AND p.board_id = #{condition.boardId}</if>
    <if test="condition.authorId != null">AND p.author_id = #{condition.authorId}</if>
    <if test="fromAt != null">AND p.published_at &gt;= #{fromAt}</if>
    <if test="toExclusive != null">AND p.published_at &lt; #{toExclusive}</if>
    <if test="qPattern != null">AND LOWER(p.title) LIKE #{qPattern} ESCAPE '!'</if>
    <if test="condition.tag != null and condition.tag != ''">
        AND EXISTS (SELECT 1 FROM post_tag pt JOIN tag t ON t.id = pt.tag_id
                    WHERE pt.post_id = p.id AND t.name = #{condition.tag})
    </if>
</sql>
<select id="countSearch" resultType="long">
    SELECT COUNT(*) FROM post p
    <where><include refid="searchWhere"/></where>
</select>
```

`viewableWhere`는 게시판 목록과 검색이 공유하는 공개 범위·차단 조건이다. 검색 SELECT와 COUNT가 모두 `searchWhere`를 사용한다. `from > to` 검증, 종료일의 다음 날 00:00 변환, `LIKE` 특수문자 escape는 Service에서 처리한다.

```java
String normalizedTag = tag == null || tag.isBlank() ? null : tag;
LocalDateTime toExclusive = to == null || to.equals(LocalDate.of(9999, 12, 31))
        ? null : to.plusDays(1).atStartOfDay();
```

</details>

## 직접 확인

```bash
BASE=http://localhost:8080
s() { curl -s "$@" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["totalElements"], [i["id"] for i in d["items"]][:5])'; }
s "$BASE/api/posts/search?tag=jpa&size=5"                                      # Z1
s "$BASE/api/posts/search?board=qna&tag=spring&size=5"                         # Z2
s "$BASE/api/posts/search?author=2&from=2026-09-01&to=2026-09-30"              # Z3
s "$BASE/api/posts/search?q=n%2B1&size=5"                                      # Z4 (n+1, 소문자)
s "$BASE/api/posts/search?size=5"                                              # Z5 조건 없음
s "$BASE/api/posts/search?board=dev&q=%ED%8A%B8%EB%9E%9C%EC%9E%AD%EC%85%98&from=2026-08-01"   # Z6 (q=트랜잭션)
s -H 'Authorization: Bearer tok-p07' "$BASE/api/posts/search?author=2"          # Z7 회원 7은 회원 2를 차단
s "$BASE/api/posts/search?tag=no-such-tag"                                     # Z8
curl -i "$BASE/api/posts/search?from=2026-10-01&to=2026-09-01"                # Z9
s "$BASE/api/posts/search?page=85899346&size=50"                               # Z10
s "$BASE/api/posts/search?page=2147483647&size=50"                             # Z11
s "$BASE/api/posts/search?board=no-such-board&page=2147483647&size=50"         # Z12
s "$BASE/api/posts/search?tag=%20%20%20&size=5"                               # Z13
s "$BASE/api/posts/search?to=9999-12-31"                                     # Z14
s "$BASE/api/posts/search?from=9999-12-31&to=9999-12-31"                     # Z15
curl -i "$BASE/api/posts/search?board=no-such-board&to=0999-12-31"           # Z16
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "Z1",
      "title": "태그 jpa",
      "method": "GET",
      "path": "/api/posts/search?tag=jpa&size=5"
    },
    {
      "id": "Z2",
      "title": "qna 게시판 + 태그 spring",
      "method": "GET",
      "path": "/api/posts/search?board=qna&tag=spring&size=5"
    },
    {
      "id": "Z3",
      "title": "작성자 2 + 9월",
      "method": "GET",
      "path": "/api/posts/search?author=2&from=2026-09-01&to=2026-09-30"
    },
    {
      "id": "Z4",
      "title": "제목에 n+1(소문자)",
      "method": "GET",
      "path": "/api/posts/search?q=n%2B1&size=5"
    },
    {
      "id": "Z5",
      "title": "조건 없음",
      "method": "GET",
      "path": "/api/posts/search?size=5"
    },
    {
      "id": "Z6",
      "title": "dev + 트랜잭션 + 8월부터",
      "method": "GET",
      "path": "/api/posts/search?board=dev&q=%ED%8A%B8%EB%9E%9C%EC%9E%AD%EC%85%98&from=2026-08-01"
    },
    {
      "id": "Z7",
      "title": "회원 7(회원 2를 차단)이 작성자 2 검색",
      "method": "GET",
      "path": "/api/posts/search?author=2",
      "headers": {
        "Authorization": "Bearer tok-p07"
      }
    },
    {
      "id": "Z8",
      "title": "없는 태그",
      "method": "GET",
      "path": "/api/posts/search?tag=no-such-tag"
    },
    {
      "id": "Z9",
      "title": "from > to",
      "method": "GET",
      "path": "/api/posts/search?from=2026-10-01&to=2026-09-01"
    },
    {
      "id": "Z10",
      "title": "큰 페이지에서 앞 글을 다시 노출하지 않음",
      "method": "GET",
      "path": "/api/posts/search?page=85899346&size=50"
    },
    {
      "id": "Z11",
      "title": "최대 page에서도 빈 결과",
      "method": "GET",
      "path": "/api/posts/search?page=2147483647&size=50"
    },
    {
      "id": "Z12",
      "title": "없는 게시판의 최대 page",
      "method": "GET",
      "path": "/api/posts/search?board=no-such-board&page=2147483647&size=50"
    },
    {
      "id": "Z13",
      "title": "공백 태그는 필터 생략",
      "method": "GET",
      "path": "/api/posts/search?tag=%20%20%20&size=5"
    },
    {
      "id": "Z14",
      "title": "DB 최대 종료일 포함",
      "method": "GET",
      "path": "/api/posts/search?to=9999-12-31"
    },
    {
      "id": "Z15",
      "title": "최대 날짜 하루 범위",
      "method": "GET",
      "path": "/api/posts/search?from=9999-12-31&to=9999-12-31"
    },
    {
      "id": "Z16",
      "title": "없는 게시판이어도 범위 밖 날짜 거절",
      "method": "GET",
      "path": "/api/posts/search?board=no-such-board&to=0999-12-31"
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "Z1",
      "expect": {
        "json": [
          {
            "path": "$.totalElements",
            "equals": 13
          },
          {
            "path": "$.items[*].id",
            "equals": [
              123,
              118,
              98,
              87,
              79
            ]
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "Z2",
      "expect": {
        "json": [
          {
            "path": "$.totalElements",
            "equals": 12
          },
          {
            "path": "$.items[*].id",
            "equals": [
              139,
              130,
              111,
              106,
              104
            ]
          }
        ]
      }
    },
    {
      "id": "C3",
      "request": "Z3",
      "expect": {
        "json": [
          {
            "path": "$.totalElements",
            "equals": 1
          },
          {
            "path": "$.items[*].id",
            "equals": [
              112
            ]
          }
        ]
      }
    },
    {
      "id": "C4",
      "request": "Z4",
      "expect": {
        "json": [
          {
            "path": "$.totalElements",
            "equals": 9
          },
          {
            "path": "$.items[*].id",
            "equals": [
              118,
              98,
              79,
              74,
              71
            ]
          }
        ]
      }
    },
    {
      "id": "C5",
      "request": "Z5",
      "expect": {
        "json": [
          {
            "path": "$.totalElements",
            "equals": 111
          },
          {
            "path": "$.items[*].id",
            "equals": [
              145,
              144,
              143,
              141,
              140
            ]
          }
        ]
      }
    },
    {
      "id": "C6",
      "request": "Z6",
      "expect": {
        "json": [
          {
            "path": "$.totalElements",
            "equals": 1
          },
          {
            "path": "$.items[*].id",
            "equals": [
              145
            ]
          }
        ]
      }
    },
    {
      "id": "C7",
      "request": "Z7",
      "expect": {
        "json": [
          {
            "path": "$.totalElements",
            "equals": 0
          }
        ]
      }
    },
    {
      "id": "C8",
      "request": "Z8",
      "expect": {
        "json": [
          {
            "path": "$.totalElements",
            "equals": 0
          },
          {
            "path": "$.items",
            "equals": []
          }
        ]
      }
    },
    {
      "id": "C9",
      "request": "Z9",
      "expect": {
        "status": 400
      }
    },
    {
      "id": "C10",
      "request": "Z10",
      "expect": {
        "json": [
          {
            "path": "$.totalElements",
            "equals": 111
          },
          {
            "path": "$.items",
            "equals": []
          },
          {
            "path": "$.hasNext",
            "equals": false
          }
        ]
      }
    },
    {
      "id": "C11",
      "request": "Z11",
      "expect": {
        "json": [
          {
            "path": "$.totalElements",
            "equals": 111
          },
          {
            "path": "$.items",
            "equals": []
          },
          {
            "path": "$.hasNext",
            "equals": false
          }
        ]
      }
    },
    {
      "id": "C12",
      "request": "Z12",
      "expect": {
        "json": [
          {
            "path": "$.totalElements",
            "equals": 0
          },
          {
            "path": "$.items",
            "equals": []
          },
          {
            "path": "$.hasNext",
            "equals": false
          }
        ]
      }
    },
    {
      "id": "C13",
      "request": "Z13",
      "expect": {
        "json": [
          {
            "path": "$.totalElements",
            "equals": 111
          },
          {
            "path": "$.items[*].id",
            "equals": [
              145,
              144,
              143,
              141,
              140
            ]
          }
        ]
      }
    },
    {
      "id": "C14",
      "request": "Z14",
      "expect": {
        "json": [
          {
            "path": "$.totalElements",
            "equals": 111
          }
        ]
      }
    },
    {
      "id": "C15",
      "request": "Z15",
      "expect": {
        "json": [
          {
            "path": "$.totalElements",
            "equals": 0
          },
          {
            "path": "$.items",
            "equals": []
          }
        ]
      }
    },
    {
      "id": "C16",
      "request": "Z16",
      "expect": {
        "status": 400
      }
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용). 결과는 (totalElements, 앞 5개 id).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | Z1 | `13`, `[123, 118, 98, 87, 79]` |
| C2 | Z2 | `12`, `[139, 130, 111, 106, 104]` |
| C3 | Z3 | `1`, `[112]` |
| C4 | Z4 | `9`, `[118, 98, 79, 74, 71]` — 대소문자 무시 |
| C5 | Z5 | `111`, `[145, 144, 143, 141, 140]` — 비로그인이 볼 수 있는 전체 |
| C6 | Z6 | `1`, `[145]` |
| C7 | Z7 | `0` — 차단 관계라 하나도 안 보인다 |
| C8 | Z8 | `0`, `[]` |
| C9 | Z9 | `400` |
| C10 | Z10 | `111`, `[]`, `hasNext=false` — 큰 offset이 앞 글로 돌아가지 않는다 |
| C11 | Z11 | `111`, `[]`, `hasNext=false` — 최대 page도 오류 없이 빈 결과 |
| C12 | Z12 | `0`, `[]`, `hasNext=false` — 없는 게시판 |
| C13 | Z13 | `111`, `[145, 144, 143, 141, 140]` — 공백 태그는 필터 생략 |
| C14 | Z14 | `111` — DB 최대 종료일도 포함해 200 |
| C15 | Z15 | `0`, `[]` — DB 최대 날짜 하루 범위 |
| C16 | Z16 | `400` — 없는 게시판이어도 날짜 오류를 먼저 검사 |
| R1 | 동적 조건 | 조건별 if-else 메서드 조합이 아니라, 값이 있을 때만 조건을 붙이는 구조(QueryDSL `BooleanExpression`이 `null`이면 무시, `Specification` 조합, `Criteria` 등) |
| R2 | 규칙 재사용 | 2-3의 "볼 수 있는 글" 조건을 복사하지 않고 같은 조각을 재사용한다. 2-2 게시판 목록도 같은 조립기("board 조건만 있는 검색")로 옮길 수 있는데, 그때 건수 쿼리는 항상 따로 센다(`Page`·`findAll(spec, pageable)`의 건수 생략 — 2-4 참고) |
| R3 | 태그 존재 검사 | 태그 조건이 있을 때만 `post_tag`를 `EXISTS`로 검사해 같은 글이 중복되거나 `totalElements`가 부풀지 않는다 |
| R4 | 키워드 | `LIKE '%q%'`가 인덱스를 못 탄다는 것을 알고, 데이터가 커지면 어떻게 할지(전문 검색 인덱스·검색 엔진) 말할 수 있다 |

## 필요한 지식

- [P21 — 동적 조건은 null 반환 메서드로 만든다](../../docs/knowledge/P21-querydsl-setup.md#25-동적-조건은-null-반환-메서드로-만든다)
- [S10 — Specification과 Projection은 서로 다른 문제를 푼다](../../docs/knowledge/S10-spring-data-query.md#specification과-projection은-서로-다른-문제를-푼다)
- [W04 MyBatis XML 쿼리 실무](../../docs/knowledge/W04-mybatis-xml-practical.md) — MyBatis라면 동적 SQL을 어떻게 쓰나(비교)
- [R05 인덱스와 B-Tree](../../docs/knowledge/R05-index-btree.md) — `LIKE '%…%'`

## 다음 단계

[8-5. 정합성 배치](8-5-recount-batch.md)
