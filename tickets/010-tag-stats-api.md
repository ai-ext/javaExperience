# T-010. 태그별 글 수 통계 API

> 난이도 쉬움 · 유형 새 API · DB community · 예상 30분

## 티켓

> **요청자** 기획 · **배경** 메인 화면 사이드바에 "인기 태그" 박스를 넣는다. 태그 이름 옆에 글 수를 붙여 많이 쓰인 순으로 보여 준다.

- 태그별 글 수를 내려주는 API를 만들어 주세요. 로그인 없이 보는 박스라 **누구나 볼 수 있는 글**(게시됨·전체 공개·삭제 안 됨)만 셉니다. 팔로워 공개 글·임시저장·숨김·삭제된 글은 빼 주세요.
- 글이 하나도 없는 태그는 안 보여 줍니다. 몇 개까지 받을지는 프론트가 정합니다(기본 10개, 최대 50개).
- **완료 조건**: 글 수가 많은 순, 같으면 태그 이름 순. 숫자는 DB에서 센다(목록을 다 읽어 자바에서 세지 않는다).

**DB 시작 상태**: `community` 처음 상태(`bash scripts/java-db.sh --reset`). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다. 공개 글에 달린 태그는 `mysql` 6 · `java` 5 · `spring` 3 · `질문` 2 · `jpa` 1 · `회고` 1이고, `docker`·`테스트`는 글이 없다.

## 지금 코드

- 회원 활동 통계 API가 이미 있다 — 네이티브 SQL 한 번으로 집계하고 인터페이스 프로젝션으로 받는 방식이다. 같은 방식을 따른다.
- 글과 태그는 연결 테이블로 이어져 있다(복합 PK). "누구나 볼 수 있는 글" 조건은 인기글 API의 SQL에도 같은 모양으로 들어 있다.

## 화면 시나리오

```screen
{
  "title": "메인 — 인기 태그 박스",
  "summary": "메인을 열 때 태그별 글 수를 받아 많은 순으로 칩을 그린다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "커뮤니티" },
    {
      "type": "list",
      "id": "tag-box",
      "label": "인기 태그",
      "items": [
        { "id": "t-mysql", "title": "#mysql", "meta": "글 6" },
        { "id": "t-java", "title": "#java", "meta": "글 5" },
        { "id": "t-spring", "title": "#spring", "meta": "글 3" }
      ],
      "footer": "상위 10개"
    }
  ],
  "flows": [
    {
      "name": "메인 열기",
      "steps": [
        { "kind": "user", "text": "메인 화면을 연다", "focus": ["bar"] },
        { "kind": "request", "method": "GET", "path": "/api/stats/tags?limit=10" },
        { "kind": "server", "text": "태그 ⨝ 연결 테이블 ⨝ 글을 공개 글 조건으로 거른 뒤 태그별로 센다 — SQL 한 번" },
        {
          "kind": "db",
          "sql": "SELECT t.name, COUNT(*) AS postCount FROM tag t JOIN post_tag pt ON pt.tag_id = t.id JOIN post p ON p.id = pt.post_id WHERE p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND p.deleted_at IS NULL GROUP BY t.id, t.name ORDER BY postCount DESC, t.name LIMIT 10"
        },
        {
          "kind": "response",
          "status": 200,
          "body": "[\n  {\"name\": \"mysql\", \"postCount\": 6},\n  {\"name\": \"java\", \"postCount\": 5},\n  {\"name\": \"spring\", \"postCount\": 3},\n  {\"name\": \"질문\", \"postCount\": 2},\n  {\"name\": \"jpa\", \"postCount\": 1},\n  {\"name\": \"회고\", \"postCount\": 1}\n]"
        },
        { "kind": "screen", "text": "많이 쓰인 태그부터 칩이 보인다. 글이 없는 docker·테스트는 없다", "focus": ["tag-box", "t-mysql"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `GET /api/stats/tags?limit=10` |
| 인증 | 필요 없음 |
| `limit` | 기본 `10`, `1`~`50`. 벗어나면 `400` |
| 셀 글 | `status = 'PUBLISHED'` · `visibility = 'PUBLIC'` · `deleted_at IS NULL` |
| 응답 | `200`, 배열 `[{"name": "mysql", "postCount": 6}, …]` — 두 필드. 글 수↓, 같으면 이름↑. 글 0개인 태그는 빼고, 최대 `limit`개 |

- DB 변화 없음(조회만).

## 직접 확인

```bash
BASE=http://localhost:8080
H='Authorization: Bearer tok-kimjava'

# 준비 — 셀 대상이 아닌 글을 만든다: 팔로워 공개 글(docker), 쓰고 지운 글(테스트)
curl -s -X POST "$BASE/api/posts" -H "$H" -H 'Content-Type: application/json' \
  -d '{"boardSlug":"free","title":"[T-010] 팔로워 공개","content":"x","tags":["docker"],"visibility":"FOLLOWERS"}'   # 요청 A
curl -s -X POST "$BASE/api/posts" -H "$H" -H 'Content-Type: application/json' \
  -d '{"boardSlug":"free","title":"[T-010] 지울 글","content":"x","tags":["테스트"]}'                                # 요청 B
curl -i -X DELETE "$BASE/api/posts/{B의 id}" -H "$H"                                                               # 요청 C

curl -s "$BASE/api/stats/tags"            # 요청 D
curl -s "$BASE/api/stats/tags?limit=2"    # 요청 E
curl -i "$BASE/api/stats/tags?limit=0"    # 요청 F
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "A",
      "title": "팔로워 공개 글(docker)",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "boardSlug": "free", "title": "[T-010] 팔로워 공개", "content": "x", "tags": ["docker"], "visibility": "FOLLOWERS" }
    },
    {
      "id": "B",
      "title": "지울 글(테스트)",
      "method": "POST",
      "path": "/api/posts",
      "headers": { "Authorization": "Bearer tok-kimjava" },
      "body": { "boardSlug": "free", "title": "[T-010] 지울 글", "content": "x", "tags": ["테스트"] }
    },
    {
      "id": "C",
      "title": "B 삭제",
      "method": "DELETE",
      "path": "/api/posts/{{B.body.id}}",
      "headers": { "Authorization": "Bearer tok-kimjava" }
    },
    { "id": "D", "title": "태그 통계", "method": "GET", "path": "/api/stats/tags" },
    { "id": "E", "title": "상위 2개", "method": "GET", "path": "/api/stats/tags?limit=2" },
    { "id": "F", "title": "limit=0", "method": "GET", "path": "/api/stats/tags?limit=0" }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "D",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$[0]", "equals": { "name": "mysql", "postCount": 6 } },
          { "path": "$[*].name", "equals": ["mysql", "java", "spring", "질문", "jpa", "회고"] },
          { "path": "$[*].postCount", "equals": [6, 5, 3, 2, 1, 1] }
        ]
      }
    },
    {
      "id": "C2",
      "request": "D",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$", "type": "array" },
          { "path": "$[*].name", "notContains": "docker" },
          { "path": "$[*].name", "notContains": "테스트" }
        ]
      }
    },
    {
      "id": "C3",
      "request": "E",
      "expect": { "status": 200, "json": [{ "path": "$[*].name", "equals": ["mysql", "java"] }] }
    },
    { "id": "C4", "request": "F", "expect": { "status": 400 } }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 D | `200`, `mysql 6 · java 5 · spring 3 · 질문 2 · jpa 1 · 회고 1` 순서, 항목은 `name`·`postCount` 두 필드 |
| C2 | 요청 D | `200` 배열이고, 팔로워 공개 글의 `docker`, 지운 글의 `테스트`가 세어지지 않았다 |
| C3 | 요청 E | `limit=2`면 `mysql`, `java` 두 개 |
| C4 | 요청 F | `limit=0`은 `400` |
| D1 | `SELECT t.name, COUNT(*) FROM tag t JOIN post_tag pt ON pt.tag_id = t.id JOIN post p ON p.id = pt.post_id WHERE p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND p.deleted_at IS NULL GROUP BY t.id, t.name ORDER BY COUNT(*) DESC, t.name` | 요청 D와 같은 6행 |
| D2 | `SELECT t.name, COUNT(*) FROM tag t JOIN post_tag pt ON pt.tag_id = t.id GROUP BY t.id, t.name ORDER BY t.name` | 조건 없이 세면 `docker`·`테스트`도 나온다 — 조건이 왜 필요한지 비교 |
| R1 | 집계 위치 | `GROUP BY`·`COUNT`·`ORDER BY`·`LIMIT`을 DB에서 한다. 태그나 글을 모두 읽어 자바에서 세지 않는다 |
| R2 | 공개 글 조건 | 세는 조건이 "비로그인이 볼 수 있는 글"과 같다. 같은 조건이 다른 SQL(인기글)에도 있다는 걸 알고, 규칙이 바뀌면 같이 고쳐야 할 곳으로 꼽을 수 있다 |
| R3 | 응답 DTO | 프로젝션(행)을 그대로 내보내지 않고 응답 record로 옮긴다(회원 활동 통계와 같은 방식). `COUNT(*)`가 `Long`으로 온다는 점을 처리했다 |
| R4 | 정렬 끝까지 | 글 수가 같을 때 이름 순으로 정해서 결과가 매번 같다 |

## 필요한 지식

- [R04 SQL로 데이터 다루기](../docs/knowledge/R04-sql-crud-join.md) — JOIN·GROUP BY·COUNT
- [S10 Spring Data와 쿼리 도구](../docs/knowledge/S10-spring-data-query.md) — 네이티브 쿼리와 인터페이스 프로젝션
- [W03 DB 접근 방식 총비교](../docs/knowledge/W03-db-access-comparison.md) — 집계는 SQL로

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 저장소</summary>

통계 저장소에 `@Query(nativeQuery = true, value = """ … """)` 메서드를 하나 더 둔다. 별칭을 `AS name`, `AS postCount`로 주고 `interface TagStatRow { String getName(); Long getPostCount(); }`로 받는다. `LIMIT :limit`과 `@Param("limit") int limit`.
</details>

<details>
<summary>힌트 2 — 컨트롤러</summary>

`@GetMapping("/api/stats/tags")`, `@RequestParam(defaultValue = "10") @Min(1) @Max(50) int limit` — 범위를 벗어나면 다른 목록 API의 `size`처럼 400이 된다.
</details>
