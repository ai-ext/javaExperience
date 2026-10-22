# T-024. 좋아요가 몰리면 30초씩 멈춘다 — 커넥션 풀 고갈

> 난이도 고급 · 유형 버그 · DB community · 예상 90분

## 티켓

> **요청자** 운영·SRE · **배경** 이벤트 글 두 개가 동시에 화제가 되자 API 전체가 30초 동안 응답하지 않다가 500을 쏟아냈다. 그 시간 DB CPU는 한가했고, 앱 로그에는 `HikariPool-1 - Connection is not available, request timed out after 30000ms (total=10, active=10, idle=0, waiting=…)`. 누군가 "풀을 50으로 늘리자"고 했다.

- 좋아요가 동시에 몰려도 요청이 멈추지 않게 고쳐 주세요. **풀 크기를 늘리는 것은 해결로 치지 않습니다**(왜 안 되는지도 설명).
- 좋아요·댓글 알림은 계속 만들어져야 합니다. 좋아요가 롤백되면 알림을 만들지 않는 규칙, 알림 저장이 실패해도 좋아요는 성공하는 규칙도 그대로입니다.
- **완료 조건**: 회원 20명이 글 두 개에 동시에 좋아요(서로 다른 40건)를 눌러도 모두 몇 초 안에 `200`, 두 글의 좋아요 수가 각각 20, 잠시 뒤 알림이 40개 생긴다.

**DB 시작 상태**: `community` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 `docker/mysql/init/`의 처음 상태로 다시 만든다(`project`는 빈 DB, CloudBeaver 작업 공간도 초기화). 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`로 세 DB를 `docker/mysql/backup/<시각>/`에 SQL 파일로 떠 둔다. CloudBeaver에 저장한 SQL 스크립트·바꾼 설정은 이 백업에 들어가지 않으니 따로 복사해 둔다 — 미리 만든 연결 세 개는 다시 들어간다). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다. 박디비(회원 4)의 글 15·17(자유글 04·06, 처음 좋아요 0)에 동시성 회원 `tok-c01`~`tok-c20`이 좋아요를 누른다. 커넥션 풀은 Spring Boot 기본(HikariCP 최대 10개)이다.

## 지금 코드

고급 티켓이라 실마리는 없다. `직접 확인`의 `xargs -P 40` 줄로 재현하고, 멈춘 30초 동안 `jcmd <pid> Thread.print`(또는 IntelliJ 디버거의 스레드 덤프)로 요청 스레드들이 **어디서** 기다리는지 본다.

> 브라우저의 버튼 확인은 같은 서버로 동시에 6개 정도만 보낸다(HTTP/1.1 연결 수 제한). 6개로는 풀 10개가 바닥나지 않아 **기준 코드에서도 통과할 수 있다** — 재현은 터미널(`xargs -P 40`)로 한다.

## 화면 시나리오

```screen
{
  "title": "이벤트 글 두 개 — 좋아요 폭주",
  "summary": "서로 다른 회원 40명분의 좋아요가 거의 동시에 온다. 모두 바로 처리되고, 글 작성자에게 알림이 쌓여야 한다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "자유글 04", "right": "동시성01(회원 7)" },
    { "type": "stats", "id": "counts", "items": [{ "id": "likes", "label": "좋아요", "value": "20" }] },
    { "type": "actions", "id": "buttons", "items": [{ "id": "like", "label": "좋아요", "variant": "primary" }] },
    { "type": "code", "id": "log", "label": "앱 로그", "value": "HikariPool-1 - Connection is not available, request timed out after 30000ms (total=10, active=10, idle=0, waiting=30)" }
  ],
  "flows": [
    {
      "name": "지금(버그) — 40건이 동시에",
      "steps": [
        { "kind": "user", "text": "40건의 좋아요가 거의 동시에 들어온다", "focus": ["like"] },
        { "kind": "request", "method": "PUT", "path": "/api/posts/15/like", "headers": ["Authorization: Bearer tok-c01"] },
        { "kind": "server", "text": "좋아요 트랜잭션 커밋 → 커밋 뒤 리스너가 알림을 만들려고 새 트랜잭션(커넥션)을 연다. 그런데 요청의 첫 커넥션은 아직 반납 전이다" },
        { "kind": "server", "text": "커넥션 10개를 쥔 요청 10개가 모두 '두 번째 커넥션'을 기다린다 — 아무도 반납하지 않는다" },
        { "kind": "response", "status": 500, "body": "(30초 뒤) Could not open JPA EntityManager for transaction" },
        { "kind": "screen", "text": "버튼이 30초 동안 돌다가 실패 — 다른 API도 같이 멈춘다", "focus": ["log"] }
      ]
    },
    {
      "name": "고친 뒤",
      "steps": [
        { "kind": "user", "text": "40건이 동시에", "focus": ["like"] },
        { "kind": "request", "method": "PUT", "path": "/api/posts/15/like", "headers": ["Authorization: Bearer tok-c01"] },
        { "kind": "server", "text": "요청은 좋아요만 커밋하고 커넥션을 바로 반납한다. 알림은 커넥션을 하나만 쓰는 다른 곳에서 만든다" },
        { "kind": "response", "status": 200, "body": "{\"postId\": 15, \"liked\": true, \"likeCount\": 20}" },
        { "kind": "screen", "text": "모두 바로 처리, 잠시 뒤 작성자에게 알림 40개", "focus": ["likes"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 대상 | 좋아요(`PUT /api/posts/{id}/like`)·댓글 작성 뒤의 알림 생성 경로 |
| 고칠 동작 | 동시 요청이 풀 크기 이상 몰려도 요청 하나가 커넥션을 **두 개 동시에** 쥐지 않는다 → 멈추지 않는다 |
| 알림 | 좋아요·댓글이 커밋된 뒤에만 만든다(롤백이면 없음). 알림 저장 실패가 좋아요·댓글 응답을 실패로 만들지 않는다. 응답보다 조금 늦게 생겨도 된다 |
| 그대로인 것 | 좋아요 응답 모양, 멱등(이미 누른 좋아요는 알림 없음), 교착 상태 재시도 |
| 하지 말 것 | 풀 크기·대기 시간만 바꾸기 |

## 직접 확인

```bash
BASE=http://localhost:8080
pairs() { for p in 15 17; do for i in $(seq -w 1 20); do echo "tok-c$i $p"; done; done; }

pairs | xargs -P 40 -L1 sh -c 'curl -s -o /dev/null -X DELETE "'$BASE'/api/posts/$1/like" -H "Authorization: Bearer $0"'   # 요청 R — 다시 돌릴 수 있게 먼저 취소
time (pairs | xargs -P 40 -L1 sh -c 'curl -s -o /dev/null -w "%{http_code}\n" -X PUT "'$BASE'/api/posts/$1/like" -H "Authorization: Bearer $0"' | sort | uniq -c)   # 요청 P
curl -s "$BASE/api/posts/15"; curl -s "$BASE/api/posts/17"     # 요청 B1·B2 — likeCount 20
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 먼저 40건을 모두 취소하고 다시 누르므로 몇 번을 눌러도 같은 결과다(위 안내처럼 브라우저에서는 기준 코드도 통과할 수 있다).

```check
{
  "requests": [
    {
      "id": "R",
      "title": "먼저 40건 취소(다시 돌리기용)",
      "method": "DELETE",
      "path": "/api/posts/{{post}}/like",
      "headers": { "Authorization": "Bearer {{tok}}" },
      "concurrent": {
        "count": 40,
        "vars": {
          "tok": ["tok-c01", "tok-c02", "tok-c03", "tok-c04", "tok-c05", "tok-c06", "tok-c07", "tok-c08", "tok-c09", "tok-c10", "tok-c11", "tok-c12", "tok-c13", "tok-c14", "tok-c15", "tok-c16", "tok-c17", "tok-c18", "tok-c19", "tok-c20", "tok-c01", "tok-c02", "tok-c03", "tok-c04", "tok-c05", "tok-c06", "tok-c07", "tok-c08", "tok-c09", "tok-c10", "tok-c11", "tok-c12", "tok-c13", "tok-c14", "tok-c15", "tok-c16", "tok-c17", "tok-c18", "tok-c19", "tok-c20"],
          "post": ["15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17"]
        }
      }
    },
    {
      "id": "P",
      "title": "서로 다른 좋아요 40건 동시에",
      "method": "PUT",
      "path": "/api/posts/{{post}}/like",
      "headers": { "Authorization": "Bearer {{tok}}" },
      "concurrent": {
        "count": 40,
        "vars": {
          "tok": ["tok-c01", "tok-c02", "tok-c03", "tok-c04", "tok-c05", "tok-c06", "tok-c07", "tok-c08", "tok-c09", "tok-c10", "tok-c11", "tok-c12", "tok-c13", "tok-c14", "tok-c15", "tok-c16", "tok-c17", "tok-c18", "tok-c19", "tok-c20", "tok-c01", "tok-c02", "tok-c03", "tok-c04", "tok-c05", "tok-c06", "tok-c07", "tok-c08", "tok-c09", "tok-c10", "tok-c11", "tok-c12", "tok-c13", "tok-c14", "tok-c15", "tok-c16", "tok-c17", "tok-c18", "tok-c19", "tok-c20"],
          "post": ["15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "15", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17", "17"]
        }
      }
    },
    { "id": "B1", "title": "글 15 좋아요 수", "method": "GET", "path": "/api/posts/15" },
    { "id": "B2", "title": "글 17 좋아요 수", "method": "GET", "path": "/api/posts/17" }
  ],
  "checks": [
    { "id": "C1", "request": "P", "expect": { "status": 200, "json": [{ "path": "$.liked", "equals": true }] } },
    {
      "id": "C2",
      "all": [
        { "request": "B1", "expect": { "status": 200, "json": [{ "path": "$.likeCount", "equals": 20 }] } },
        { "request": "B2", "expect": { "status": 200, "json": [{ "path": "$.likeCount", "equals": 20 }] } }
      ]
    }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), T = 테스트(선택), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 P | 40건 모두 `200`·`liked: true` — 기준 코드는 30초 대기 끝에 대부분 `500`(검증 CLI는 15초에서 시간 초과로 멈춘다) |
| C2 | 요청 B1·B2 | 두 글 모두 `likeCount` 20 |
| D1 | `SELECT COUNT(*) FROM post_like l WHERE l.post_id IN (15, 17) AND NOT EXISTS (SELECT 1 FROM notification n WHERE n.type = 'LIKE' AND n.post_id = l.post_id AND n.actor_id = l.member_id)` | `0` — 지금 있는 좋아요마다 알림이 있다(버튼 확인 몇 초 뒤). 기준 코드로 재현한 직후엔 0보다 크다 |
| D2 | `SELECT post_id, like_count, (SELECT COUNT(*) FROM post_like l WHERE l.post_id = p.id) AS likes FROM post p WHERE p.id IN (15, 17)` | `15 20 20`, `17 20 20` |
| T1 | (선택) 테스트 | 스레드 40개로 좋아요(회원 20 × 글 2)를 동시에 부르고 10초 안에 모두 끝나는지 + 알림 40개(별도 스레드면 잠깐 기다렸다가). 고치기 전 코드에서는 실패해야 한다 |
| R1 | 원인 | `AFTER_COMMIT` 리스너는 요청 스레드에서, **커넥션 반납 전에** 돈다. 거기서 `REQUIRES_NEW`가 커넥션을 하나 더 빌리므로 요청 하나가 두 개를 쥔다. 풀 크기만큼의 요청이 동시에 그 지점에 오면 서로 반납을 기다리는 교착(풀 데드락)이 된다 — 스레드 덤프로 보여 줄 수 있다 |
| R2 | 풀을 늘리면? | 풀 크기 N이면 N개 동시에서 또 멈춘다(문제를 옮길 뿐). 요청당 필요한 커넥션 수의 최댓값을 1로 만드는 것이 해결이다 |
| R3 | 고친 방법과 대가 | 예: 리스너를 크기가 정해진 별도 스레드 풀로(`@Async`) — 큐가 넘칠 때 정책(`CallerRunsPolicy`가 왜 위험한지), 서버 종료 때 큐에 남은 알림. 다른 길: 같은 트랜잭션에서 알림을 쓰기(`BEFORE_COMMIT`·직접 호출 — 알림 실패가 좋아요를 롤백), 아웃박스 테이블(같은 트랜잭션에 기록 + 나중에 발송). 각각 무엇을 얻고 잃는지 말할 수 있다 |

## 필요한 지식

- [R08 앱 서버와 DB 서버 연결](../docs/knowledge/R08-app-to-db-connection.md) — 커넥션 풀과 대기
- [S08 트랜잭션](../docs/knowledge/S08-transactions.md) — 전파(`REQUIRES_NEW`)와 커밋 뒤 콜백
- [S15 비동기·스케줄링·배치](../docs/knowledge/S15-async-scheduling-batch.md) — `@Async`와 스레드 풀 설정
- [W25 Spring 멀티스레드](../docs/knowledge/W25-spring-multithreading.md) — 요청마다 스레드, 공유 자원

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 어디서 기다리나</summary>

멈춘 동안의 스레드 덤프에서 `http-nio-…-exec-N` 스레드 대부분이 `HikariPool.getConnection`에서 `TIMED_WAITING`이다. 그중 정확히 10개(풀 크기)는 아래쪽에 `NotificationEventListener.onPostLiked` → `TransactionSynchronizationUtils.invokeAfterCompletion` → `AbstractPlatformTransactionManager.processCommit`이 있고, 위쪽에 `handleExistingTransaction`(바깥 트랜잭션이 아직 살아 있다)이 있다. 커밋은 끝났지만 아직 `processCommit` 안 — 첫 커넥션을 정리(반납)하는 코드는 그 뒤에 있다. 나머지 스레드는 첫 커넥션을 기다린다.
</details>

<details>
<summary>힌트 2 — 고치기</summary>

`@EnableAsync` + 알림 전용 `ThreadPoolTaskExecutor`(코어·최대 2, 큐 수천, 넘치면 로그만 남기고 버리기)를 빈으로 만들고, 리스너 두 메서드에 `@Async("그 빈 이름")`을 `@TransactionalEventListener`와 함께 단다. 요청 스레드는 커밋 직후 커넥션을 반납하고, 알림은 스레드 수만큼만 커넥션을 쓴다.
</details>
