# T-019. 댓글 목록 N+1 — 로그인하면 쿼리가 댓글 수만큼

> 난이도 중급 · 유형 성능 · DB practice · 예상 60분

## 티켓

> **요청자** DBA · **배경** 인기 글의 댓글 목록 API가 슬로우 쿼리는 아닌데 DB 초당 쿼리 수 1위다. 앱 로그를 보니 **로그인한 사람**이 댓글 목록을 한 번 열면 `member_block`을 조회하는 짧은 쿼리가 댓글 수의 두 배쯤 나간다. 비로그인은 2개뿐이다.

- 댓글 목록 API의 쿼리 수를 댓글 수와 상관없이 일정하게 줄여 주세요. 응답(누가 보이고 누가 숨는지, 순서, 모양)은 한 글자도 바뀌면 안 됩니다.
- 쿼리 수가 다시 늘지 않게 테스트로 고정해 주세요. 이번 티켓은 그 테스트(T1)까지가 완료 조건입니다.
- **완료 조건**: 로그인 사용자가 댓글 8개짜리 글의 목록을 열 때 SQL 문장이 지금 20개 → 6개 이하, 댓글이 늘어도 그대로. 차단 규칙 결과는 지금과 같다.

**DB 시작 상태**: `practice` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 `docker/mysql/init/`의 처음 상태로 다시 만든다(`project`는 빈 DB, CloudBeaver 작업 공간도 초기화). 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`). 기준 코드를 practice 프로파일로 켜면(`./gradlew bootRun --args='--spring.profiles.active=practice'`) Flyway가 V2~V6을 적용한다. 글 97(작성자 회원 4)에 댓글 8개(최상위 6·답글 2)가 있다. 회원 7은 회원 2를, 14는 3을 차단했고 10↔11은 서로 차단했다. 토큰은 `tok-p07`처럼 `tok-p` + 회원 번호 두 자리.

## 지금 코드

- 먼저 잰다: 앱 로그(`org.hibernate.SQL`)에서 `tok-p07`로 글 97의 댓글 목록을 한 번 열 때 찍히는 SQL을 센다. 같은 모양의 짧은 쿼리가 반복되는 곳을 찾는다.
- "여러 건을 한꺼번에 판정할 때"를 위한 메서드가 이미 준비돼 있다. 북마크 목록이 그것을 어떻게 쓰는지 본다.
- SQL 수를 세는 테스트도 이미 하나 있다(목록 API용). 같은 방법을 쓴다.

## 화면 시나리오

```screen
{
  "title": "글 상세 — 댓글",
  "summary": "로그인한 사람이 댓글을 연다. 화면은 그대로, 서버가 DB에 묻는 횟수만 줄어든다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "글 97", "right": "리액트에서왔어요(회원 7)" },
    {
      "type": "list",
      "id": "comments",
      "label": "댓글 5",
      "items": [
        { "id": "c-179", "title": "좋은 글 감사합니다!", "meta": "로그분석가" },
        { "id": "c-194", "title": "예제 코드도 볼 수 있을까요?", "meta": "밤샘개발자" },
        { "id": "c-215", "title": "…", "meta": "스프링요정 · 답글 1" }
      ]
    },
    { "type": "code", "id": "log", "label": "앱 로그(요청 한 번)", "value": "select … from api_token …\nselect … from post …\nselect … from comment … join member …\nselect … from member_block … where blocker_id=? and blocked_id=?   ← 댓글마다 2번씩\n…(총 20개)" }
  ],
  "flows": [
    {
      "name": "지금 — 댓글마다 차단 확인",
      "steps": [
        { "kind": "user", "text": "회원 7이 글 97의 댓글을 연다", "focus": ["comments"] },
        { "kind": "request", "method": "GET", "path": "/api/posts/97/comments", "headers": ["Authorization: Bearer tok-p07"] },
        { "kind": "server", "text": "댓글은 한 번에 읽지만, 트리를 조립하면서 최상위·답글마다 '이 작성자와 차단 관계인가'를 양방향으로 DB에 묻는다" },
        { "kind": "db", "sql": "SELECT … FROM member_block WHERE blocker_id = 7 AND blocked_id = ?  -- 댓글마다 × 2" },
        { "kind": "response", "status": 200, "body": "[{\"id\": 179, …}, {\"id\": 194, …}, {\"id\": 202, …}, {\"id\": 215, …, \"replies\": [{\"id\": 246, …}]}, {\"id\": 221, …, \"replies\": [{\"id\": 253, …}]}]" },
        { "kind": "screen", "text": "회원 2의 댓글(172)은 안 보인다 — 결과는 맞지만 SQL이 20개", "focus": ["comments", "log"] }
      ]
    },
    {
      "name": "고친 뒤 — 차단 목록을 한 번에",
      "steps": [
        { "kind": "user", "text": "같은 화면을 연다", "focus": ["comments"] },
        { "kind": "request", "method": "GET", "path": "/api/posts/97/comments", "headers": ["Authorization: Bearer tok-p07"] },
        { "kind": "server", "text": "나와 차단 관계인 회원 id를 한 번에 읽어 Set으로 들고 메모리에서 판정한다" },
        { "kind": "db", "sql": "SELECT CASE WHEN blocker_id = 7 THEN blocked_id ELSE blocker_id END FROM member_block WHERE blocker_id = 7 OR blocked_id = 7" },
        { "kind": "response", "status": 200, "body": "(같은 응답)" },
        { "kind": "screen", "text": "같은 화면, SQL 6개 이하", "focus": ["comments"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 대상 | `GET /api/posts/{postId}/comments` |
| 바꿀 것 | 로그인 사용자의 차단 판정을 댓글마다 묻지 않고 **요청당 한 번**으로. SQL 문장 수가 댓글 수와 무관 |
| 바꾸지 않을 것 | 응답 전체(보이는 댓글·숨는 댓글·자리 남김·순서·모양), 비로그인 동작 |
| 테스트(T1, 이 티켓은 필수) | 로그인 상태로 댓글 목록을 부를 때 SQL 문장 수를 세는 테스트 — 상한(6 이하)과 "댓글을 더 달아도 늘지 않는다"를 함께 단언 |

## 직접 확인

```bash
BASE=http://localhost:8080   # practice 프로파일로 켠 앱

curl -s "$BASE/api/posts/97/comments"                                   # 요청 A — 비로그인
curl -s "$BASE/api/posts/97/comments" -H 'Authorization: Bearer tok-p07' # 요청 B — 회원 2를 차단한 회원
curl -s "$BASE/api/posts/97/comments" -H 'Authorization: Bearer tok-p10' # 요청 C — 회원 11과 서로 차단
curl -s "$BASE/api/posts/97/comments" -H 'Authorization: Bearer tok-p14' # 요청 D — 회원 3을 차단
# 요청 B를 보내면서 앱 로그의 SQL 줄 수를 센다(고치기 전 20개 안팎 → 고친 뒤 6개 이하)
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 성능 티켓이라 C 항목은 **응답이 그대로인지**(회귀)를 본다 — 기준 코드에서도 통과한다. 쿼리 수 개선은 D·T 항목으로 판정한다.

```check
{
  "requests": [
    { "id": "A", "title": "비로그인", "method": "GET", "path": "/api/posts/97/comments" },
    { "id": "B", "title": "회원 7(2를 차단)", "method": "GET", "path": "/api/posts/97/comments", "headers": { "Authorization": "Bearer tok-p07" } },
    { "id": "C", "title": "회원 10(11과 서로 차단)", "method": "GET", "path": "/api/posts/97/comments", "headers": { "Authorization": "Bearer tok-p10" } },
    { "id": "D", "title": "회원 14(3을 차단)", "method": "GET", "path": "/api/posts/97/comments", "headers": { "Authorization": "Bearer tok-p14" } }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$[*].id", "equals": [172, 179, 194, 202, 215, 221] },
          { "path": "$[4].replies[*].id", "equals": [246] },
          { "path": "$[5].replies[*].id", "equals": [253] }
        ]
      }
    },
    { "id": "C2", "request": "B", "expect": { "status": 200, "json": [{ "path": "$[*].id", "equals": [179, 194, 202, 215, 221] }, { "path": "$[4].replies[*].id", "equals": [253] }] } },
    { "id": "C3", "request": "C", "expect": { "status": 200, "json": [{ "path": "$[*].id", "equals": [172, 179, 194, 202, 215, 221] }, { "path": "$[5].replies", "equals": [] }] } },
    { "id": "C4", "request": "D", "expect": { "status": 200, "json": [{ "path": "$[*].id", "equals": [172, 179, 194, 202, 215] }, { "path": "$[4].replies[*].id", "equals": [246] }] } }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), T = 테스트(이 티켓은 필수), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | 비로그인: 최상위 6개 + 답글 2개 그대로 |
| C2 | 요청 B | 회원 7: 회원 2의 댓글 172만 빠진다 |
| C3 | 요청 C | 회원 10: 회원 11의 답글 253만 빠진다(답글 단위 판정) |
| C4 | 요청 D | 회원 14: 회원 3의 최상위 221이 **답글째** 빠진다 |
| D1 | `SELECT CASE WHEN blocker_id = 7 THEN blocked_id ELSE blocker_id END AS other FROM member_block WHERE blocker_id = 7 OR blocked_id = 7` | `2` 한 행 — 고친 코드가 요청당 한 번 보내는 바로 그 조회. 이 결과만으로 C2를 판정할 수 있다 |
| D2 | `SELECT id, member_id, parent_id FROM comment WHERE post_id = 97 AND deleted_at IS NULL ORDER BY created_at, id` | 8행 — C1과 같고, 작성자 2·11·3이 C2~C4에서 빠진 그 댓글들이다 |
| T1 | 쿼리 수 테스트(필수) | `Statistics.getPrepareStatementCount()`로 로그인 상태 댓글 목록의 SQL 수를 센다: 6 이하, 그리고 그 글에 댓글을 몇 개 더 단 뒤에도 늘지 않는다. **기준 코드에서는 실패**해야 한다(먼저 돌려 본다) |
| R1 | 원인 | 차단 판정이 댓글·답글마다 `exists` 2번(양방향)이었다는 것을 로그 줄 수로 보여 줄 수 있다. 댓글은 fetch join으로 한 번에 읽었는데도 N+1이 생길 수 있다는 점(연관 로딩이 아니라 "반복문 안의 조회") |
| R2 | 고친 방법 | 이미 있는 "차단 관계 id 한꺼번에" 메서드를 재사용하고, 판정은 `Set.contains`로 했다. 차단 규칙(양방향, 최상위째 제외, 답글 단위 제외)을 새로 쓰지 않았다 |
| R3 | 측정 | 고치기 전후 숫자(20 → 6 이하)를 직접 쟀고, 테스트가 그 숫자를 지킨다. 실제 시간이 아니라 문장 수로 고정하는 이유를 말할 수 있다 |

## 필요한 지식

- [S09 JPA·Hibernate](../docs/knowledge/S09-jpa-hibernate.md) — N+1의 여러 모양(연관 로딩 말고 반복문 안의 조회)
- [S17 Spring Boot 애플리케이션 성능](../docs/knowledge/S17-performance-tuning.md) — 쿼리 수를 재고 줄이는 순서
- [V05 까다로운 것 테스트하기](../docs/knowledge/V05-testing-tricky-things.md) — SQL 수 같은 비기능 요구를 테스트로 고정
- [V04 테스트 DB 전략](../docs/knowledge/V04-test-db-strategy.md) — 테스트 안에서 댓글을 더 달고 되돌리기

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 고칠 곳</summary>

댓글 서비스의 목록 메서드가 최상위·답글을 돌면서 `blockPolicy.isBlockedEitherWay(viewerId, 작성자 id)`를 부른다. 그 전에 `Set<Long> blocked = viewer == null ? Set.of() : blockPolicy.blockRelatedIds(viewerId)`를 한 번 읽고, 반복문 안에서는 `blocked.contains(작성자 id)`만 본다.
</details>

<details>
<summary>힌트 2 — 테스트</summary>

기존 목록 SQL 수 테스트처럼 `@SpringBootTest @AutoConfigureMockMvc`에서 `Statistics`를 `clear()` → 요청 → `getPrepareStatementCount()`. 테스트 DB는 시나리오용 데이터라 글 11(댓글 6개)과 `tok-kimjava`(한차단에게 차단당함)로 잰다. "댓글이 늘어도 늘지 않는다"는 테스트 메서드에 `@Transactional`을 붙이고 MockMvc로 댓글을 몇 개 더 단 뒤 다시 잰다(끝나면 되돌려진다). 이때 요청들이 한 트랜잭션·한 영속성 컨텍스트를 공유해서 두 번째 측정은 글·토큰 조회가 1차 캐시로 빠져 오히려 줄 수 있다 — 그래서 `같다`가 아니라 `늘지 않는다(≤)`로 단언한다.
</details>
