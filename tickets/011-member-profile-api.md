# T-011. 회원 프로필 API

> 난이도 중급 · 유형 새 API · DB community · 예상 60분

## 티켓

> **요청자** 프론트 팀 · **배경** 글 작성자 이름을 누르면 프로필 카드를 띄운다. 지금은 프론트가 검색 API로 그 사람 글을 다 받아 세고, 팔로워 수는 아예 못 보여 준다.

- 회원 한 명의 프로필을 내려주는 API를 만들어 주세요. 닉네임·가입일·글 수·팔로워 수·팔로잉 수, 그리고 내가 이 사람을 팔로우하는지.
- **글 수는 보는 사람 기준**입니다. 카드의 "글 9개"를 누르면 그 사람 글 목록(조합 검색 `author=`)으로 가는데, 숫자와 목록 건수가 다르면 안 됩니다.
- 나와 차단 관계인 회원(어느 쪽이 차단했든)의 프로필은 "없는 회원"과 똑같이 보여 주세요. 로그인은 선택입니다.
- **완료 조건**: 같은 회원을 비로그인·팔로워·본인이 보면 각자 다른 글 수가 나오고, 그 숫자가 검색 API의 전체 건수와 같다.

**DB 시작 상태**: `community` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 `docker/mysql/init/`의 처음 상태로 다시 만든다(`project`는 빈 DB, CloudBeaver 작업 공간도 초기화). 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다. 이스프링(회원 3)의 글 중 비로그인이 볼 수 있는 글은 8개, 팔로워 공개 글이 1개 더 있다. 김자바(회원 2)가 이스프링을 팔로우하고, 한차단(회원 6)이 김자바를 차단해 두었다.

## 지금 코드

- "이 사람이 볼 수 있는 글"을 세는 쿼리는 이미 있다. 목록 API가 페이지 응답의 전체 건수를 어떻게 구하는지 따라가 본다.
- 팔로우·차단을 판정하는 코드도 이미 여러 군데서 쓰고 있다. 새로 짜기 전에 찾는다.

## 화면 시나리오

```screen
{
  "title": "프로필 카드",
  "summary": "작성자 이름을 누르면 그 회원의 숫자를 한 번에 받아 카드로 띄운다. 글 수는 보는 사람마다 다르다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "자유 게시판", "right": "김자바" },
    { "type": "text", "id": "name", "value": "이스프링", "emphasis": "title" },
    { "type": "text", "id": "joined", "value": "2026-09-03 가입", "emphasis": "caption" },
    {
      "type": "stats",
      "id": "counts",
      "items": [
        { "id": "s-posts", "label": "글", "value": "9" },
        { "id": "s-followers", "label": "팔로워", "value": "1" },
        { "id": "s-following", "label": "팔로잉", "value": "0" }
      ]
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [{ "id": "follow", "label": "팔로잉 중", "variant": "secondary" }]
    },
    { "type": "toast", "id": "toast-none", "value": "없는 회원입니다", "tone": "warning" }
  ],
  "flows": [
    {
      "name": "팔로워가 프로필 열기",
      "steps": [
        { "kind": "user", "text": "글 목록에서 작성자 '이스프링'을 누른다", "focus": ["name"] },
        { "kind": "request", "method": "GET", "path": "/api/members/3", "headers": ["Authorization: Bearer tok-kimjava"] },
        { "kind": "server", "text": "회원을 찾고, 보는 사람과 차단 관계인지 본 뒤, 보는 사람 기준 글 수와 팔로우 숫자를 센다" },
        { "kind": "db", "sql": "SELECT COUNT(*) FROM post p WHERE p.author_id = 3 AND p.deleted_at IS NULL AND p.status = 'PUBLISHED' AND (p.visibility = 'PUBLIC' OR … 팔로우 …) AND NOT EXISTS (… 차단 …)" },
        {
          "kind": "response",
          "status": 200,
          "body": "{\"id\": 3, \"nickname\": \"이스프링\", \"joinedAt\": \"2026-09-03T11:00:00\", \"postCount\": 9, \"followerCount\": 1, \"followingCount\": 0, \"followedByMe\": true}"
        },
        { "kind": "screen", "text": "글 9 · 팔로워 1 · 팔로잉 0, 버튼은 '팔로잉 중'", "focus": ["counts", "follow"] }
      ]
    },
    {
      "name": "차단 관계 — 없는 회원처럼",
      "steps": [
        { "kind": "user", "text": "김자바가 한차단(회원 6)의 이름을 누른다(한차단이 김자바를 차단했다)", "focus": ["name"] },
        { "kind": "request", "method": "GET", "path": "/api/members/6", "headers": ["Authorization: Bearer tok-kimjava"] },
        { "kind": "server", "text": "차단 관계라 없는 회원과 같은 404 — 차단당했다는 사실도 드러내지 않는다" },
        { "kind": "response", "status": 404, "body": "{\"status\": 404, \"detail\": \"회원을 찾을 수 없습니다.\"}" },
        { "kind": "screen", "text": "'없는 회원입니다' 안내", "focus": ["toast-none"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `GET /api/members/{id}` |
| 인증 | 선택(토큰이 있으면 그 회원 기준) |
| 응답 `200` | `id` · `nickname` · `joinedAt`(가입 시각 `member.created_at`) · `postCount` · `followerCount` · `followingCount` · `followedByMe` |
| `postCount` | 보는 사람이 볼 수 있는 그 회원의 글 수 — `GET /api/posts/search?author={id}`의 `totalElements`와 같아야 한다 |
| `followedByMe` | 보는 사람이 그 회원을 팔로우하면 `true`. 비로그인·본인은 `false` |
| `404` | 없는 회원, **차단 관계**(어느 쪽이 차단했든). 다른 404처럼 Problem Details(`status`·`detail`) |

```json
{ "id": 3, "nickname": "이스프링", "joinedAt": "2026-09-03T11:00:00", "postCount": 8, "followerCount": 1, "followingCount": 0, "followedByMe": false }
```

- DB 변화 없음(조회만).

## 직접 확인

```bash
BASE=http://localhost:8080

curl -s "$BASE/api/members/3"                                                     # 요청 A — 비로그인
curl -s "$BASE/api/members/3" -H 'Authorization: Bearer tok-kimjava'              # 요청 B — 팔로워
curl -s "$BASE/api/posts/search?author=3" -H 'Authorization: Bearer tok-kimjava'  # 요청 S — 같은 사람이 검색
curl -s "$BASE/api/members/3" -H 'Authorization: Bearer tok-lee'                  # 요청 C — 본인
curl -s "$BASE/api/members/2" -H 'Authorization: Bearer tok-kimjava'              # 요청 H — 본인(팔로잉 쪽)
curl -i "$BASE/api/members/6" -H 'Authorization: Bearer tok-kimjava'              # 요청 D — 나를 차단한 사람
curl -i "$BASE/api/members/2" -H 'Authorization: Bearer tok-han'                  # 요청 E — 내가 차단한 사람
curl -s "$BASE/api/members/6"                                                     # 요청 F — 비로그인은 보인다
curl -i "$BASE/api/members/9999"                                                  # 요청 G — 없는 회원
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    { "id": "A", "title": "비로그인", "method": "GET", "path": "/api/members/3" },
    { "id": "B", "title": "팔로워(김자바)", "method": "GET", "path": "/api/members/3", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "S", "title": "김자바가 검색 author=3", "method": "GET", "path": "/api/posts/search?author=3", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "C", "title": "본인(이스프링)", "method": "GET", "path": "/api/members/3", "headers": { "Authorization": "Bearer tok-lee" } },
    { "id": "H", "title": "본인(김자바)", "method": "GET", "path": "/api/members/2", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "D", "title": "나를 차단한 회원", "method": "GET", "path": "/api/members/6", "headers": { "Authorization": "Bearer tok-kimjava" } },
    { "id": "E", "title": "내가 차단한 회원", "method": "GET", "path": "/api/members/2", "headers": { "Authorization": "Bearer tok-han" } },
    { "id": "F", "title": "비로그인이 한차단", "method": "GET", "path": "/api/members/6" },
    { "id": "G", "title": "없는 회원", "method": "GET", "path": "/api/members/9999" }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$",
            "equals": { "id": 3, "nickname": "이스프링", "joinedAt": "2026-09-03T11:00:00", "postCount": 8, "followerCount": 1, "followingCount": 0, "followedByMe": false }
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "B",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.postCount", "equals": 9 },
          { "path": "$.postCount", "equals": "{{S.body.totalElements}}" },
          { "path": "$.followedByMe", "equals": true }
        ]
      }
    },
    {
      "id": "C3",
      "all": [
        { "request": "C", "expect": { "status": 200, "json": [{ "path": "$.postCount", "equals": 9 }, { "path": "$.followedByMe", "equals": false }] } },
        { "request": "H", "expect": { "status": 200, "json": [{ "path": "$.followingCount", "equals": 1 }, { "path": "$.followerCount", "equals": 0 }] } }
      ]
    },
    {
      "id": "C4",
      "all": [
        { "request": "D", "expect": { "status": 404 } },
        { "request": "E", "expect": { "status": 404 } },
        { "request": "F", "expect": { "status": 200, "json": [{ "path": "$.postCount", "equals": 1 }] } }
      ]
    },
    { "id": "C5", "request": "G", "expect": { "status": 404, "json": [{ "path": "$.detail", "exists": true }] } }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | `200`, 위 "만들 것"의 JSON과 같다(비로그인 글 수 8) |
| C2 | 요청 B·S | 팔로워는 글 수 9(팔로워 공개 글 포함)이고 **같은 사람이 검색했을 때의 `totalElements`와 같다**, `followedByMe: true` |
| C3 | 요청 C·H | 본인은 글 수 9·`followedByMe: false`, 김자바의 팔로잉 1·팔로워 0 |
| C4 | 요청 D·E·F | 차단 관계는 어느 방향이든 `404`, 차단과 상관없는 비로그인은 `200`(글 1) |
| C5 | 요청 G | 없는 회원 `404`, Problem Details 모양(`detail` 있음) |
| D1 | `SELECT (SELECT COUNT(*) FROM follow WHERE followee_id = 3) AS followers, (SELECT COUNT(*) FROM follow WHERE follower_id = 3) AS following, (SELECT COUNT(*) FROM post WHERE author_id = 3 AND status = 'PUBLISHED' AND deleted_at IS NULL AND visibility = 'PUBLIC') AS public_posts` | `1 0 8` — 응답 A와 같다 |
| D2 | `SELECT blocker_id, blocked_id FROM member_block` | `6 2` 한 행 — C4의 두 404가 이 한 행에서 나온다(양방향) |
| R1 | 글 수 | "볼 수 있는 글" 조건을 새로 쓰지 않고 목록·검색이 쓰는 조건을 재사용했다(COUNT만 하는 메서드를 더하는 정도). 조건을 복사하면 규칙이 바뀔 때 숫자와 목록이 어긋난다는 것을 말할 수 있다 |
| R2 | 숫자 세기 | 팔로워·팔로잉·글 수를 엔티티 목록을 읽어 `size()`로 세지 않고 DB `COUNT`로 센다 |
| R3 | 404 순서 | 차단 확인을 응답을 만들기 **전에** 한다. 차단 관계에서 403을 주면 "차단당했다"는 사실이 드러난다 |

## 필요한 지식

- [W01 API 하나 만들 때 실제 작업 순서](../docs/knowledge/W01-api-dev-order.md) — 이미 있는 저장소·정책을 먼저 찾는다
- [S10 Spring Data와 쿼리 도구](../docs/knowledge/S10-spring-data-query.md) — `countBy…` 파생 쿼리, Criteria COUNT
- [W09 DTO는 왜 쓰나](../docs/knowledge/W09-why-dto.md) — 회원 엔티티(email·role)를 내보내지 않는다
- [W08 예외는 어디서 잡나](../docs/knowledge/W08-where-to-handle-exceptions.md) — 새 404 예외를 전역 핸들러에

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 글 수</summary>

목록·검색은 내용 쿼리와 별도로 COUNT 쿼리를 보내고, 둘 다 같은 조건 조립 메서드를 쓴다. 그 클래스에 "조건만 받아 COUNT만 하는" 공개 메서드를 하나 더하면 프로필도 검색과 같은 숫자를 얻는다(작성자 조건만 채운 검색 조건을 넘긴다).
</details>

<details>
<summary>힌트 2 — 차단·팔로우</summary>

차단은 양방향 판정 메서드가 이미 있다. 팔로워·팔로잉 수는 팔로우 저장소에 `countByFollowee_Id`·`countByFollower_Id`를, 팔로우 여부는 이미 있는 `exists…` 메서드를 쓴다.
</details>
