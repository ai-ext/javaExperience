# T-008. 알림 목록에 글 제목 넣기

> 난이도 쉬움 · 유형 기존 API 변경 · DB community · 예상 25분

## 티켓

> **요청자** 프론트 팀 · **배경** 알림 목록에 "박디비님이 댓글을 남겼어요"만 보여서 어느 글인지 모른다. 지금은 알림마다 글 상세 API를 한 번씩 더 불러 제목을 가져오는데, 알림 20개면 요청이 21번 나간다.

- 내 알림 목록 응답의 각 항목에 글 제목을 넣어 주세요. "박디비님이 'JPA 연관관계 매핑 정리'에 댓글을 남겼어요"로 바꿉니다.
- 서버에서도 알림마다 글을 따로 조회하지 않게 해 주세요(목록 한 번에 쿼리 수가 알림 수에 따라 늘면 안 됩니다).
- **완료 조건**: 기존 필드는 그대로, `postTitle`만 추가된다.

**DB 시작 상태**: `community` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 처음 덤프로 다시 만든다. 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다. 알림 테이블(V4)은 비어 있다 — 아래 요청 A·B가 회원 3(이스프링)의 글 2에 좋아요·댓글을 달아 알림을 만든다.

## 지금 코드

- 좋아요·댓글이 생기면 커밋 뒤에 알림을 만드는 리스너가 있다. 알림 행에는 글 id만 있고 제목은 글 테이블에 있다.
- 내 알림 목록 쿼리가 이미 "보낸 사람"을 함께 읽고(fetch join) 있다. 같은 방법을 글에도 쓸 수 있다.
- 쿼리 수는 앱 로그(`org.hibernate.SQL`)로 센다.

## 화면 시나리오

```screen
{
  "title": "알림 목록",
  "summary": "알림 항목마다 글 제목을 함께 받아, 추가 요청 없이 문구를 만든다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "알림", "right": "이스프링" },
    {
      "type": "list",
      "id": "notifications",
      "items": [
        { "id": "n-comment", "title": "박디비님이 'JPA 연관관계 매핑 정리'에 댓글을 남겼어요", "meta": "방금 전", "badge": "새 알림" },
        { "id": "n-like", "title": "김자바님이 'JPA 연관관계 매핑 정리'를 좋아해요", "meta": "방금 전", "badge": "새 알림" }
      ]
    }
  ],
  "flows": [
    {
      "name": "알림 목록 열기",
      "steps": [
        { "kind": "user", "text": "종 아이콘을 누른다", "focus": ["bar"] },
        { "kind": "request", "method": "GET", "path": "/api/me/notifications", "headers": ["Authorization: Bearer tok-lee"] },
        { "kind": "server", "text": "내 알림을 최신순으로 읽을 때 보낸 사람과 글을 한 쿼리로 함께 읽고, 글 제목을 항목에 담는다" },
        {
          "kind": "db",
          "sql": "SELECT n.*, a.*, p.* FROM notification n JOIN member a ON a.id = n.actor_id JOIN post p ON p.id = n.post_id WHERE n.member_id = 3 ORDER BY n.created_at DESC, n.id DESC LIMIT 20",
          "note": "알림이 몇 개든 목록 쿼리 1번 + 안 읽은 개수 1번"
        },
        {
          "kind": "response",
          "status": 200,
          "body": "{\n  \"items\": [\n    {\"id\": 2, \"type\": \"COMMENT\", \"actor\": {\"id\": 4, \"nickname\": \"박디비\"}, \"postId\": 2, \"postTitle\": \"JPA 연관관계 매핑 정리\", \"commentId\": 7, \"read\": false, ...},\n    {\"id\": 1, \"type\": \"LIKE\", \"actor\": {\"id\": 2, \"nickname\": \"김자바\"}, \"postId\": 2, \"postTitle\": \"JPA 연관관계 매핑 정리\", ...}\n  ],\n  \"unreadCount\": 2\n}"
        },
        { "kind": "screen", "text": "알림 문구에 글 제목이 들어간다 — 글 상세를 따로 부르지 않는다", "focus": ["n-comment", "n-like"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 대상 | `GET /api/me/notifications` |
| 추가 필드 | 각 항목에 `postTitle`(문자열) — 알림이 가리키는 글의 지금 제목 |
| 쿼리 | 목록을 읽는 쿼리 한 번에 글까지 함께 읽는다(알림 수만큼 글 조회가 더 나가지 않는다) |
| 그대로인 것 | 나머지 필드(`id`·`type`·`actor`·`postId`·`commentId`·`read`·`createdAt`), `unreadCount`, 정렬, 인증 |

- DB 변화 없음.

## 직접 확인

```bash
BASE=http://localhost:8080

# 요청 A — 김자바가 이스프링의 글 2에 좋아요(이미 눌렀으면 그대로)
curl -s -X PUT "$BASE/api/posts/2/like" -H 'Authorization: Bearer tok-kimjava'
# 요청 B — 박디비가 글 2에 댓글
curl -s -X POST "$BASE/api/posts/2/comments" -H 'Authorization: Bearer tok-park' -H 'Content-Type: application/json' \
  -d '{"content":"[T-008] 알림 확인 댓글"}'
# 요청 C — 이스프링의 알림 목록
curl -s "$BASE/api/me/notifications" -H 'Authorization: Bearer tok-lee'
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "A",
      "title": "글 2에 좋아요",
      "method": "PUT",
      "path": "/api/posts/2/like",
      "headers": { "Authorization": "Bearer tok-kimjava" }
    },
    {
      "id": "B",
      "title": "글 2에 댓글",
      "method": "POST",
      "path": "/api/posts/2/comments",
      "headers": { "Authorization": "Bearer tok-park" },
      "body": { "content": "[T-008] 알림 확인 댓글" }
    },
    {
      "id": "C",
      "title": "이스프링의 알림 목록",
      "method": "GET",
      "path": "/api/me/notifications",
      "headers": { "Authorization": "Bearer tok-lee" }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "C",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.items[0].type", "equals": "COMMENT" },
          { "path": "$.items[0].commentId", "equals": "{{B.body.id}}" },
          { "path": "$.items[0].postTitle", "equals": "JPA 연관관계 매핑 정리" }
        ]
      }
    },
    {
      "id": "C2",
      "request": "C",
      "expect": {
        "json": [
          { "path": "$.items[*].postTitle", "contains": "JPA 연관관계 매핑 정리" },
          { "path": "$.items[*].type", "contains": "LIKE" },
          { "path": "$.items[1].postTitle", "equals": "JPA 연관관계 매핑 정리" }
        ]
      }
    },
    {
      "id": "C3",
      "request": "C",
      "expect": {
        "json": [
          { "path": "$.items[0].postId", "equals": 2 },
          { "path": "$.items[0].actor.nickname", "equals": "박디비" },
          { "path": "$.items[0].read", "equals": false },
          { "path": "$.unreadCount", "type": "number" }
        ]
      }
    }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 C | `200`, 맨 위가 방금 단 댓글(B) 알림이고 `postTitle`이 `JPA 연관관계 매핑 정리` |
| C2 | 요청 C | 좋아요(LIKE) 알림도 있고, 모든 항목에 `postTitle`이 있다 |
| C3 | 요청 C | 기존 필드(`postId`·`actor`·`read`·`unreadCount`)는 그대로 |
| D1 | `SELECT n.type, n.post_id, p.title FROM notification n JOIN post p ON p.id = n.post_id WHERE n.member_id = 3 ORDER BY n.created_at DESC, n.id DESC` | 첫 행 `COMMENT 2 JPA 연관관계 매핑 정리`, `LIKE` 행이 하나 — 응답과 같은 제목 |
| R1 | 쿼리 수 | 목록 쿼리에 글을 fetch join했다(또는 같은 효과). 알림마다 `SELECT … FROM post`가 따로 나가지 않는다는 것을 로그로 확인했다 |
| R2 | 엔티티 노출 | 글 엔티티를 응답에 넣지 않고 제목 문자열만 DTO에 옮긴다 |
| R3 | 제목 시점 | 알림을 만들 때 제목을 복사해 두는 방법(알림 테이블에 컬럼)과 읽을 때 조인하는 방법의 차이(글 제목이 바뀌면?)를 말할 수 있다 |

## 필요한 지식

- [S09 JPA·Hibernate](../docs/knowledge/S09-jpa-hibernate.md) — 지연 로딩과 fetch join, N+1
- [W09 DTO는 왜 쓰나](../docs/knowledge/W09-why-dto.md) — 엔티티 대신 필요한 값만
- [W13 프론트와 백엔드의 경계](../docs/knowledge/W13-frontend-backend-boundary.md) — 화면이 요청을 21번 보내게 두지 않기

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 응답</summary>

알림 응답 record에 `String postTitle`을 추가하고, 서비스에서 `n.getPost().getTitle()`을 넣는다. 이것만 하면 동작은 하지만 알림마다 글 조회가 한 번씩 더 나간다(로그를 보라).
</details>

<details>
<summary>힌트 2 — 한 번에 읽기</summary>

내 알림 목록 JPQL에 `JOIN FETCH n.actor`가 있다. 그 아래 `JOIN FETCH n.post`를 더한다. `Pageable`과 fetch join을 같이 써도 되는 건 둘 다 "하나"(ManyToOne)라서다 — 컬렉션 fetch join이면 얘기가 다르다.
</details>
