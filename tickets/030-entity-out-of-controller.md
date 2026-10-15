# T-030. 엔티티가 컨트롤러까지 새어 나온다 — 서비스가 응답을 만들게

> 난이도 고급 · 유형 리팩터링 · DB community · 예상 90분

## 티켓

> **요청자** 테크 리드·모바일 앱 팀 · **배경** 지난달 장애 회고: 누군가 글 수정 응답에 필드 하나를 더 넣었다가 운영에서 `LazyInitializationException`(500)이 났다. 글·댓글 서비스가 엔티티를 돌려주고 컨트롤러가 트랜잭션 밖에서 응답을 만드는 구조라, 서비스마다 "컨트롤러가 쓸 연관을 미리 읽어 두는" 줄이 붙어 있고 하나 빠지면 터진다. 같은 시기 앱 팀 요청: 글을 쓰면 상세 화면으로 바로 가는데, **작성 응답에 조회·좋아요·댓글 수가 없어** 상세를 한 번 더 부른다.

- 글·댓글의 작성·수정 경로에서 **엔티티가 트랜잭션 밖(컨트롤러)으로 나가지 않게** 정리해 주세요. 엔티티 → 응답 변환은 한 곳에 둡니다(지금은 같은 변환이 두 군데에 복사돼 있다).
- 정리하면서 **글 작성 응답을 상세 응답과 같은 모양**으로 바꿔 주세요(조회·좋아요·댓글 수 포함). 그 외 모든 API의 동작·응답은 그대로여야 합니다.
- **완료 조건**: 작성 응답이 상세 모양이고, 아래 회귀 가드가 전부 그대로 통과하고, 기존 테스트가 (필요한 만큼만 고쳐서) 통과한다.

**DB 시작 상태**: `community` 처음 상태(`bash scripts/java-db.sh --reset`). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다. 김자바(`tok-kimjava`)가 자유 게시판에 글을 쓰고, 이스프링(`tok-lee`)이 댓글을 단다.

## 지금 코드

고급 티켓이라 실마리는 없다. 리팩터링은 고치기 전에 **지금 동작을 고정**하는 데서 시작한다 — 아래 버튼 확인을 기준 코드에 먼저 돌려 C2~C6이 통과하는 것을 본 뒤 손댄다(C1만 실패해야 한다).

## 화면 시나리오

```screen
{
  "title": "글쓰기 → 바로 상세",
  "summary": "글을 등록하면 응답으로 바로 상세 화면을 그린다. 상세를 한 번 더 부르지 않는다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "글쓰기", "right": "김자바(회원 2)" },
    { "type": "field", "id": "title", "label": "제목", "value": "[T-030] 새 글" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "submit", "label": "등록", "variant": "primary" }] },
    {
      "type": "stats",
      "id": "counts",
      "items": [
        { "id": "views", "label": "조회", "value": "0" },
        { "id": "likes", "label": "좋아요", "value": "0" },
        { "id": "comments", "label": "댓글", "value": "0" }
      ]
    }
  ],
  "flows": [
    {
      "name": "등록 → 상세",
      "steps": [
        { "kind": "user", "text": "제목·본문·태그를 넣고 등록", "focus": ["submit"] },
        { "kind": "request", "method": "POST", "path": "/api/posts", "headers": ["Authorization: Bearer tok-kimjava", "Content-Type: application/json"], "body": "{\"boardSlug\": \"free\", \"title\": \"[T-030] 새 글\", \"content\": \"본문\", \"tags\": [\"refactor\"]}" },
        { "kind": "server", "text": "서비스가 트랜잭션 안에서 글을 저장하고 응답 DTO까지 만들어 돌려준다. 컨트롤러는 201·Location만 붙인다" },
        { "kind": "response", "status": 201, "headers": ["Location: /api/posts/22"], "body": "{\"id\": 22, \"boardSlug\": \"free\", …, \"viewCount\": 0, \"likeCount\": 0, \"commentCount\": 0, …}" },
        { "kind": "screen", "text": "응답만으로 상세 화면(숫자 0)", "focus": ["counts"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 글 작성 응답 | `POST /api/posts` `201` 본문을 상세(`GET /api/posts/{id}`)와 같은 모양으로 — `viewCount`·`likeCount`·`commentCount` 추가(새 글이라 모두 0), 나머지 필드·`Location`은 그대로 |
| 구조 | 글·댓글 서비스의 작성·수정 메서드가 엔티티 대신 **응답 DTO**를 돌려준다. 변환은 트랜잭션 안에서, 한 곳(같은 변환을 복사하지 않는다) |
| 지울 것 | 컨트롤러가 트랜잭션 밖에서 연관을 읽을까 봐 넣어 둔 "미리 읽어 두기" 줄들, 쓰이지 않게 된 작성 전용 응답 DTO |
| 그대로인 것 | 수정 응답, 상세 응답, 댓글 작성 응답·`Location`, 404 → 403 순서, 검증(400), 인증(401) |
| 테스트 | 컨트롤러 슬라이스 테스트가 서비스의 새 반환 타입에 맞게 바뀐다 — 그 밖의 테스트는 손대지 않고 통과 |

## 직접 확인

```bash
BASE=http://localhost:8080; J='Content-Type: application/json'; K='Authorization: Bearer tok-kimjava'; L='Authorization: Bearer tok-lee'

curl -si -X POST "$BASE/api/posts" -H "$K" -H "$J" -d '{"boardSlug":"free","title":"[T-030] 새 글","content":"본문","tags":["refactor"]}'   # 요청 A — 상세 모양
curl -s "$BASE/api/posts/<A의 id>"                                                         # 요청 G
curl -s -X PATCH "$BASE/api/posts/<A의 id>" -H "$K" -H "$J" -d '{"title":"[T-030] 고친 제목"}'   # 요청 P
curl -s -o /dev/null -w '%{http_code}\n' -X PATCH "$BASE/api/posts/<A의 id>" -H "$L" -H "$J" -d '{"title":"x"}'   # 요청 F — 403
curl -s -o /dev/null -w '%{http_code}\n' -X PATCH "$BASE/api/posts/999999" -H "$K" -H "$J" -d '{"title":"x"}'      # 요청 N — 404
curl -si -X POST "$BASE/api/posts/<A의 id>/comments" -H "$L" -H "$J" -d '{"content":"[T-030] 댓글"}'                # 요청 M
curl -s -X DELETE "$BASE/api/posts/<A의 id>" -H "$K"                                       # 요청 Z — 정리
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 매번 새 글을 만들고 마지막에 지우므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    { "id": "A", "title": "글 작성", "method": "POST", "path": "/api/posts", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "boardSlug": "free", "title": "[T-030] 새 글", "content": "본문", "tags": ["refactor"] } },
    { "id": "G", "title": "상세", "method": "GET", "path": "/api/posts/{{A.body.id}}" },
    { "id": "P", "title": "제목 수정", "method": "PATCH", "path": "/api/posts/{{A.body.id}}", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "title": "[T-030] 고친 제목" } },
    { "id": "F", "title": "남의 글 수정", "method": "PATCH", "path": "/api/posts/{{A.body.id}}", "headers": { "Authorization": "Bearer tok-lee" }, "body": { "title": "x" } },
    { "id": "N", "title": "없는 글 수정", "method": "PATCH", "path": "/api/posts/999999", "headers": { "Authorization": "Bearer tok-kimjava" }, "body": { "title": "x" } },
    { "id": "M", "title": "댓글 작성", "method": "POST", "path": "/api/posts/{{A.body.id}}/comments", "headers": { "Authorization": "Bearer tok-lee" }, "body": { "content": "[T-030] 댓글" } },
    { "id": "Z", "title": "글 지우기(정리)", "method": "DELETE", "path": "/api/posts/{{A.body.id}}", "headers": { "Authorization": "Bearer tok-kimjava" } }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 201,
        "headers": { "Location": { "endsWith": "/api/posts/{{A.body.id}}" } },
        "json": [
          { "path": "$.viewCount", "equals": 0 },
          { "path": "$.likeCount", "equals": 0 },
          { "path": "$.commentCount", "equals": 0 },
          { "path": "$.boardSlug", "equals": "free" },
          { "path": "$.tags", "equals": ["refactor"] },
          { "path": "$.visibility", "equals": "PUBLIC" },
          { "path": "$.author.nickname", "equals": "김자바" },
          { "path": "$.createdAt", "type": "string" }
        ]
      }
    },
    { "id": "C2", "request": "G", "expect": { "status": 200, "json": [{ "path": "$.title", "equals": "[T-030] 새 글" }, { "path": "$.content", "equals": "본문" }, { "path": "$.viewCount", "equals": 1 }, { "path": "$.tags", "equals": ["refactor"] }] } },
    { "id": "C3", "request": "P", "expect": { "status": 200, "json": [{ "path": "$.title", "equals": "[T-030] 고친 제목" }, { "path": "$.boardSlug", "equals": "free" }, { "path": "$.tags", "equals": ["refactor"] }, { "path": "$.author.nickname", "equals": "김자바" }, { "path": "$.viewCount", "equals": 1 }] } },
    {
      "id": "C4",
      "all": [
        { "request": "F", "expect": { "status": 403 } },
        { "request": "N", "expect": { "status": 404 } }
      ]
    },
    { "id": "C5", "request": "M", "expect": { "status": 201, "headers": { "Location": { "endsWith": "/api/comments/{{M.body.id}}" } }, "json": [{ "path": "$.postId", "equals": "{{A.body.id}}" }, { "path": "$.parentId", "type": "null" }, { "path": "$.author.nickname", "equals": "이스프링" }, { "path": "$.content", "equals": "[T-030] 댓글" }] } },
    { "id": "C6", "request": "Z", "expect": { "status": 204 } }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), T = 테스트(선택), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | 작성 응답이 상세 모양 — 조회·좋아요·댓글 수 0, 게시판·태그·공개 범위·작성자·작성 시각, `Location` |
| C2 | 요청 G | 상세 그대로(조회수 1) — 회귀 가드 |
| C3 | 요청 P | 수정 응답 그대로(게시판·태그·작성자 — 지연 로딩 연관이 모두 채워져 있다) — 회귀 가드 |
| C4 | 요청 F·N | 남의 글 `403`, 없는 글 `404` — 회귀 가드 |
| C5 | 요청 M | 댓글 작성 응답·`Location` 그대로 — 회귀 가드 |
| C6 | 요청 Z | 삭제 `204` — 회귀 가드 |
| D1 | `SELECT p.title, t.name, p.deleted_at IS NOT NULL AS deleted FROM post p JOIN post_tag pt ON pt.post_id = p.id JOIN tag t ON t.id = pt.tag_id WHERE p.title = '[T-030] 고친 제목' ORDER BY p.id DESC LIMIT 1` | `[T-030] 고친 제목 refactor 1` — 저장·수정·삭제가 예전처럼 DB에 남았다 |
| T1 | `./gradlew test` | 컨트롤러 슬라이스 테스트는 서비스가 DTO를 돌려주는 모양으로만 바뀌고(가짜 엔티티·게시판 mock이 사라진다), 다른 테스트는 손대지 않고 통과 |
| R1 | 경계 | `grep -rnE "\.getNickname\(\);\|forEach\(Tag::getName\);\|getBoard\(\)\.getSlug\(\);" src/main/java`가 기준 코드에서는 6줄(글 서비스 5·댓글 서비스 1 — "미리 읽어 두기")을 찾고, 고친 뒤엔 0줄이다. 컨트롤러가 `Post`·`Comment` 엔티티를 import하지 않는다. 변환이 트랜잭션 안에 있어서 연관을 새로 읽어도 안전한 이유(`open-in-view: false`) |
| R2 | 한 곳 | 상세 변환이 두 군데(컨트롤러·조회 서비스)에 있던 것을 하나로(예: 응답 record의 정적 팩터리 `from(Post)`). 작성 전용 응답 DTO는 쓰는 곳이 없어져서 지웠다 |
| R3 | 리팩터링 순서 | 동작 고정(회귀 가드·기존 테스트)을 먼저 확인하고, 구조 변경과 응답 변경(C1)을 구분해 설명할 수 있다. 서비스가 DTO를 돌려줄 때의 대가(서비스가 응답 모양을 알게 된다 — 다른 소비자가 생기면?)도 말할 수 있다 |

## 필요한 지식

- [W09 DTO는 왜 쓰나](../docs/knowledge/W09-why-dto.md) — 엔티티를 그대로 내보내면 생기는 일
- [W02 왜 Controller·Service·Repository로 나누나](../docs/knowledge/W02-why-layers.md) — 계층마다 아는 것
- [S09 JPA·Hibernate](../docs/knowledge/S09-jpa-hibernate.md) — 지연 로딩과 영속성 컨텍스트 범위
- [V06 현업 테스트 실무](../docs/knowledge/V06-testing-at-work.md) — 레거시를 고치기 전에 동작 고정

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 변환 한 곳</summary>

상세 응답 record에 `public static PostDetailResponse from(Post post)`를 두고, 조회 서비스의 상세 변환과 컨트롤러의 상세 변환을 이걸로 바꾼다. 글 서비스의 `create`·`patch`는 `return PostDetailResponse.from(...)`, 컨트롤러는 받은 DTO의 `id()`로 `Location`만 만든다. 댓글도 같은 모양(`CommentResponse.from(Comment)`).
</details>

<details>
<summary>힌트 2 — 테스트가 깨지면</summary>

컨트롤러 슬라이스 테스트가 `postService.create(...)`가 엔티티(mock `Post`·`Board`)를 돌려준다고 가정하고 있다. 이제 DTO를 돌려주므로 `new PostDetailResponse(22L, "dev", …)` 하나로 바꾸면 mock 엔티티가 필요 없다 — 테스트가 오히려 단순해진다. 그 밖의 테스트가 깨지면 동작이 바뀐 것이니 코드를 의심한다.
</details>
