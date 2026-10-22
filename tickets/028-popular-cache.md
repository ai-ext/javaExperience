# T-028. 인기글 캐시 — 60초 재사용, 그래도 비공개 글은 바로 빠지게

> 난이도 고급 · 유형 성능 · DB practice · 예상 90분

## 티켓

> **요청자** DBA·기획 · **배경** 앱 첫 화면이 인기글(`GET /api/posts/popular`)을 부른다. 요청마다 좋아요·댓글 테이블을 기간으로 훑어 집계해서, 접속이 몰리는 아침 9시에 DB CPU의 절반이 이 쿼리다. 기획과 합의: **좋아요·댓글 점수는 1분쯤 늦게 반영돼도 된다.** 단, 작성자가 글을 비공개로 바꾸거나 지운 글이 인기글에 남아 있으면 안 된다(신고 들어온다).

- 인기글 결과를 서버에서 **60초 동안 재사용**해 주세요(기간·개수 조합마다 따로).
- 캐시에서 준 응답인지 알 수 있게 `X-Cache: HIT` / `MISS` 헤더를 붙여 주세요. 응답 본문 모양(배열)은 그대로입니다.
- 글의 공개 범위·제목이 바뀌거나 글이 지워지면 **다음 요청부터 바로** 반영돼야 합니다.
- 캐시가 비어 있을 때 요청이 한꺼번에 몰려도 집계 쿼리는 **한 번만** 돌아야 합니다(9시 정각에 캐시가 만료되면 그 순간 DB가 다시 맞는다).
- **완료 조건**: 연속 두 번 부르면 두 번째는 `HIT`이고 같은 결과, 1위 글을 비공개로 바꾸면 바로 다음 요청에서 빠지고, 다시 공개하면 바로 돌아온다.

**DB 시작 상태**: `practice` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 `docker/mysql/init/`의 처음 상태로 다시 만든다(`project`는 빈 DB, CloudBeaver 작업 공간도 초기화). 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`). 기준 코드를 practice 프로파일로 켠다(“지금”이 2026-10-05 00:00으로 고정). 최근 7일 1위는 밤샘개발자(`tok-p06`)의 글 145다.

## 지금 코드

고급 티켓이라 실마리는 없다. 캐시를 어디에 두고(서버 메모리·Redis), 언제 지우고, 만료 시각을 무엇으로 잴지 먼저 정한다 — practice 프로파일의 "지금"은 고정돼 있다는 점을 기억한다.

## 화면 시나리오

```screen
{
  "title": "앱 첫 화면 — 이번 주 인기글",
  "summary": "모두가 같은 인기글을 본다. 1분 안의 점수 차이는 괜찮지만, 비공개로 바뀐 글은 바로 사라져야 한다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "홈", "right": "(비로그인)" },
    {
      "type": "list",
      "id": "popular",
      "label": "이번 주 인기글",
      "items": [
        { "id": "p-145", "title": "스프링 트랜잭션 전파 삽질기", "meta": "점수 61" },
        { "id": "p-143", "title": "MySQL 인덱스 설계 실전 적용 후기", "meta": "점수 61" }
      ]
    },
    { "type": "code", "id": "header", "label": "응답 헤더", "value": "X-Cache: HIT" }
  ],
  "flows": [
    {
      "name": "두 번째 요청은 캐시에서",
      "steps": [
        { "kind": "user", "text": "앱을 연다(누군가 10초 전에도 열었다)", "focus": ["popular"] },
        { "kind": "request", "method": "GET", "path": "/api/posts/popular?days=7&limit=5" },
        { "kind": "server", "text": "(7일, 5개) 결과가 60초 안에 만든 것 — 집계 쿼리 없이 그대로" },
        { "kind": "response", "status": 200, "headers": ["X-Cache: HIT"], "body": "[{\"postId\": 145, …}, {\"postId\": 143, …}, …]" },
        { "kind": "screen", "text": "같은 목록", "focus": ["header"] }
      ]
    },
    {
      "name": "1위 글을 비공개로",
      "steps": [
        { "kind": "user", "text": "글 145의 작성자가 공개 범위를 팔로워 공개로 바꾼다" },
        { "kind": "request", "method": "PATCH", "path": "/api/posts/145", "headers": ["Authorization: Bearer tok-p06", "Content-Type: application/json"], "body": "{\"visibility\": \"FOLLOWERS\"}" },
        { "kind": "server", "text": "수정이 커밋된 뒤 인기글 캐시를 비운다" },
        { "kind": "request", "method": "GET", "path": "/api/posts/popular?days=7&limit=5" },
        { "kind": "response", "status": 200, "headers": ["X-Cache: MISS"], "body": "[{\"postId\": 143, …}, …]" },
        { "kind": "screen", "text": "145가 바로 빠졌다", "focus": ["p-143"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 대상 | `GET /api/posts/popular?days=&limit=` |
| 캐시 | `(days, limit)`마다 결과를 60초 재사용. 서버 메모리면 충분(서버 한 대) — 라이브러리를 쓰든 직접 만들든 자유 |
| 헤더 | 캐시에서 준 응답 `X-Cache: HIT`, 새로 집계한 응답 `X-Cache: MISS` |
| 바로 반영 | 글 수정(제목·공개 범위 등)·삭제가 **커밋되면** 인기글 캐시를 비운다 |
| 늦어도 되는 것 | 좋아요·댓글로 바뀌는 점수(최대 60초) |
| 몰릴 때 | 비어 있는 같은 키에 동시에 요청이 와도 집계는 한 번(나머지는 그 결과를 기다려 받는다) |
| 그대로인 것 | 응답 본문 모양(배열)·순서·검증(days 1~30, limit 1~50) |

## 직접 확인

```bash
BASE=http://localhost:8080; J='Content-Type: application/json'; H='Authorization: Bearer tok-p06'

curl -si "$BASE/api/posts/popular?days=7&limit=5" | grep -i x-cache           # 요청 A
curl -si "$BASE/api/posts/popular?days=7&limit=5"                             # 요청 B — X-Cache: HIT, A와 같은 본문
curl -s -X PATCH "$BASE/api/posts/145" -H "$H" -H "$J" -d '{"visibility":"FOLLOWERS"}'   # 요청 V
curl -si "$BASE/api/posts/popular?days=7&limit=5"                             # 요청 C — MISS, 145 없음
curl -s -X PATCH "$BASE/api/posts/145" -H "$H" -H "$J" -d '{"visibility":"PUBLIC"}'      # 요청 R
curl -si "$BASE/api/posts/popular?days=7&limit=5"                             # 요청 E — MISS, 145가 다시 1위
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 바꾼 공개 범위를 되돌리므로 몇 번을 눌러도 같은 결과다.

> 버튼은 브라우저에서 CORS를 거친다. 브라우저 JS는 `exposedHeaders`에 없는 응답 헤더를 읽지 못하므로 CORS 설정의 `exposedHeaders`에 `X-Cache`를 더한다(터미널 `curl`은 상관없다).

```check
{
  "requests": [
    { "id": "A", "title": "인기글", "method": "GET", "path": "/api/posts/popular?days=7&limit=5" },
    { "id": "B", "title": "바로 다시", "method": "GET", "path": "/api/posts/popular?days=7&limit=5" },
    { "id": "V", "title": "1위 글을 팔로워 공개로", "method": "PATCH", "path": "/api/posts/145", "headers": { "Authorization": "Bearer tok-p06" }, "body": { "visibility": "FOLLOWERS" } },
    { "id": "C", "title": "인기글 — 바로 빠졌나", "method": "GET", "path": "/api/posts/popular?days=7&limit=5" },
    { "id": "R", "title": "다시 공개", "method": "PATCH", "path": "/api/posts/145", "headers": { "Authorization": "Bearer tok-p06" }, "body": { "visibility": "PUBLIC" } },
    { "id": "E", "title": "인기글 — 바로 돌아왔나", "method": "GET", "path": "/api/posts/popular?days=7&limit=5" }
  ],
  "checks": [
    { "id": "C1", "request": "B", "expect": { "status": 200, "headers": { "X-Cache": { "equals": "HIT" } }, "json": [{ "path": "$", "equals": "{{A.body}}" }] } },
    {
      "id": "C2",
      "all": [
        { "request": "V", "expect": { "status": 200 } },
        { "request": "C", "expect": { "status": 200, "headers": { "X-Cache": { "equals": "MISS" } }, "json": [{ "path": "$[*].postId", "notContains": 145 }, { "path": "$", "length": 5 }] } }
      ]
    },
    {
      "id": "C3",
      "all": [
        { "request": "R", "expect": { "status": 200 } },
        { "request": "E", "expect": { "status": 200, "headers": { "X-Cache": { "equals": "MISS" } }, "json": [{ "path": "$[0].postId", "equals": 145 }, { "path": "$", "equals": "{{A.body}}" }] } }
      ]
    }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), T = 테스트(선택), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A·B | 연속 두 번째는 `X-Cache: HIT`, 본문은 A와 같다 |
| C2 | 요청 V·C | 공개 범위를 바꾼 **바로 다음** 요청이 `MISS`(캐시를 비웠다)이고 145가 없다, 5개는 채워져 있다 |
| C3 | 요청 R·E | 되돌린 바로 다음 요청도 `MISS`, 145가 다시 1위 — 처음과 같은 목록 |
| D1 | `SELECT visibility FROM post WHERE id = 145` | `PUBLIC`(버튼 확인이 되돌려 놓았다) |
| D2 | (재현) 앱 로그 `org.hibernate.SQL`에서 버튼 한 번에 나간 인기글 집계 쿼리(`… FROM post p LEFT JOIN (SELECT post_id, COUNT(*) … FROM post_like …`) 수를 센다 — 로그를 보는 확인이라 SELECT 규칙의 예외 | 기준 코드 4번(A·B·C·E) → 고친 뒤 3번(A·C·E, 60초 안에 다시 누르면 A도 HIT라 2번) |
| T1 | (선택) 테스트 | 비어 있는 키에 스레드 20개가 동시에 요청 → 집계 함수 호출 1번·`MISS` 1번, 비운 뒤 다시 집계 |
| R1 | 언제 지우나 | 변경이 **커밋된 뒤** 지운다(`@TransactionalEventListener(AFTER_COMMIT)` 등). 커밋 전에 지우면 그 틈에 다른 요청이 옛 데이터로 다시 채워 60초 동안 남는다, 롤백된 변경으로 지우면 안 될 이유 |
| R2 | 만료와 몰림 | 만료 시각을 주입받은 `Clock`으로 재면 practice(고정 시각)에서 영영 만료되지 않는다 — 단조 시계(`System.nanoTime`)나 캐시 라이브러리의 시계. 같은 키 동시 미스는 한 요청만 집계하고 나머지는 기다리게(single-flight), 그 기다림을 **트랜잭션·커넥션을 쥔 채로** 하지 않는다(쥐고 기다리면 T-024처럼 풀이 마른다) |
| R3 | 서버가 여러 대라면 | 서버 메모리 캐시는 서버마다 따로 차고 따로 지워진다 — 공용 캐시(Redis)·지우기 브로드캐스트·짧은 TTL 중 무엇을 고를지, 캐시 키에 사용자 정보가 안 들어가는 이유(비로그인 기준 결과라 모두에게 같다) |

## 필요한 지식

- [W17 캐시는 어디에](../docs/knowledge/W17-where-to-cache.md) — 서버 로컬 vs Redis, 무효화
- [W23 캐시와 인메모리](../docs/knowledge/W23-cache-and-in-memory.md) — 적중률·만료
- [S11 캐시·Redis·DB 마이그레이션](../docs/knowledge/S11-cache-redis-migration.md) — Spring Cache, 캐시 스탬피드
- [J11 java.util.concurrent](../docs/knowledge/J11-juc.md) — `ConcurrentHashMap`·`CompletableFuture`로 한 번만 계산하기

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 캐시 한 개</summary>

`ConcurrentHashMap<키(days, limit), CompletableFuture<결과+만료시각>>`. `putIfAbsent`로 내 future를 넣는 데 성공한 요청만 집계하고 `complete`, 나머지는 기존 future를 `join`해 기다린다. 만료됐으면 `remove(key, 그 future)` 하고 다시. 결과가 HIT인지 MISS인지 함께 돌려줘 컨트롤러가 헤더를 붙인다. 서비스 메서드의 `@Transactional`은 걷어 낸다(집계는 저장소 메서드의 기본 트랜잭션으로 충분).
</details>

<details>
<summary>힌트 2 — 지우기</summary>

글 서비스의 수정·삭제에서 `PostChangedEvent` 같은 이벤트를 발행하고, `@TransactionalEventListener(phase = AFTER_COMMIT)` 리스너가 캐시를 통째로 비운다(키가 몇 개뿐이라 고르지 않아도 된다).
</details>
