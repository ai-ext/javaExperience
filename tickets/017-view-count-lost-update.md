# T-017. 조회수가 덜 오르고, 좋아요 수가 가끔 줄어든다

> 난이도 중급 · 유형 버그 · DB community · 예상 60분

## 티켓

> **요청자** 마케팅·운영 · **배경** 이벤트 글을 공유한 뒤 접속 로그로는 3만 번 열렸는데 글의 조회수는 9천이다. 같은 시기에 "좋아요를 눌렀는데 숫자가 하나 줄었다"는 문의도 왔다(밤마다 도는 정합성 배치가 다음 날 숫자를 고쳐 놓아서 재현이 안 된다고 넘겼던 건).

- 동시에 여러 명이 같은 글을 열어도 조회수가 연 횟수만큼 정확히 올라가게 고쳐 주세요.
- 상세 응답의 `viewCount`는 **이번 조회까지 반영된 값**이어야 합니다(동시에 연 사람들이 같은 숫자를 받으면 안 된다).
- 좋아요 수 문의도 같은 원인인지 확인해 주세요 — 조회 처리가 좋아요 수를 건드리면 안 됩니다.
- **완료 조건**: 동시 조회 30번 뒤 조회수가 정확히 30(+직접 연 횟수) 오르고, 좋아요 수는 실제 좋아요 행 수와 같다.

**DB 시작 상태**: `community` 처음 상태(이 저장소 루트에서 `docker compose down -v && docker compose up -d` — `community`·`practice`·`project` 세 DB를 모두 지우고 `docker/mysql/init/`의 처음 상태로 다시 만든다(`project`는 빈 DB, CloudBeaver 작업 공간도 초기화). 남길 데이터가 있으면 먼저 `./docker/mysql/dump.sh`로 세 DB를 `docker/mysql/backup/<시각>/`에 SQL 파일로 떠 둔다. CloudBeaver에 저장한 SQL 스크립트·바꾼 설정은 이 백업에 들어가지 않으니 따로 복사해 둔다 — 미리 만든 연결 세 개는 다시 들어간다). 기준 코드로 앱을 켜면 Flyway가 V2~V6을 적용한다. 글 12(자유 게시판, 이스프링의 공개 글)를 쓴다.

## 지금 코드

- 먼저 재현한다: 아래 버튼 확인을 기준 코드에 그대로 돌려 숫자가 얼마나 모자라는지 본다. 앱 로그(`org.hibernate.SQL`)에서 상세 조회 한 번에 나가는 `UPDATE post …` 문장을 찾아 **어떤 컬럼들을 SET 하는지** 읽는다.
- 좋아요 수는 이미 동시 요청에 안전하게 바꾸고 있다. 그 방식과 조회수 방식이 무엇이 다른지 비교한다.

## 화면 시나리오

```screen
{
  "title": "이벤트 글 — 동시에 열기",
  "summary": "많은 사람이 동시에 같은 글을 연다. 응답의 조회수는 저마다 달라야 하고, 끝난 뒤 조회수는 연 횟수만큼 올라 있어야 한다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "자유글 01", "right": "(비로그인)" },
    { "type": "text", "id": "title", "value": "자유글 01", "emphasis": "title" },
    {
      "type": "stats",
      "id": "counts",
      "items": [
        { "id": "views", "label": "조회", "value": "33" },
        { "id": "likes", "label": "좋아요", "value": "1" }
      ]
    },
    { "type": "code", "id": "sql", "label": "앱 로그", "value": "update post set author_id=?, board_id=?, comment_count=?, content=?, …, like_count=?, …, view_count=? where id=?" }
  ],
  "flows": [
    {
      "name": "지금(버그) — 30명이 동시에 열면",
      "steps": [
        { "kind": "user", "text": "30명이 거의 동시에 글 12를 연다", "focus": ["title"] },
        { "kind": "request", "method": "GET", "path": "/api/posts/12" },
        { "kind": "server", "text": "각 요청이 글을 읽어(view_count = 2) 엔티티에서 +1 → 커밋 때 변경 감지가 행 전체를 UPDATE. 여러 요청이 같은 2를 읽었으니 모두 3을 쓴다" },
        { "kind": "db", "sql": "UPDATE post SET …, like_count = 1, …, view_count = 3 WHERE id = 12", "note": "읽어 둔 like_count까지 다시 써서, 그사이 눌린 좋아요가 지워질 수 있다" },
        { "kind": "response", "status": 200, "body": "{\"id\": 12, …, \"viewCount\": 3, …}" },
        { "kind": "screen", "text": "30번 열었는데 조회수는 몇만 오른다", "focus": ["views", "sql"] }
      ]
    },
    {
      "name": "고친 뒤",
      "steps": [
        { "kind": "user", "text": "30명이 동시에 연다", "focus": ["title"] },
        { "kind": "request", "method": "GET", "path": "/api/posts/12" },
        { "kind": "server", "text": "읽고 더해서 쓰지 않고 DB가 한 번에 더한다. 응답 값은 더한 뒤 다시 읽는다" },
        { "kind": "db", "sql": "UPDATE post SET view_count = view_count + 1 WHERE id = 12" },
        { "kind": "response", "status": 200, "body": "{\"id\": 12, …, \"viewCount\": 17, …}" },
        { "kind": "screen", "text": "사람마다 다른 숫자, 끝나면 정확히 30 증가", "focus": ["views"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 대상 | `GET /api/posts/{id}` (상세) |
| 고칠 동작 | 동시 조회에도 `view_count`가 조회 수만큼 정확히 오른다 |
| 응답 `viewCount` | 이번 조회가 반영된 값 — 동시에 연 요청끼리 같은 값을 받지 않는다 |
| 함께 지킬 것 | 상세 조회가 `like_count`·`comment_count` 등 다른 컬럼을 다시 쓰지 않는다 |
| 그대로인 것 | 볼 수 없는 글은 404이고 조회수도 안 오른다, 응답 모양 |

## 직접 확인

```bash
BASE=http://localhost:8080

curl -s "$BASE/api/posts/12"                                                    # 요청 A — 지금 viewCount
seq 30 | xargs -P 30 -I{} curl -s -o /dev/null -w '%{http_code}\n' "$BASE/api/posts/12" | sort | uniq -c   # 요청 P — 동시에 30번
curl -s "$BASE/api/posts/12"                                                    # 요청 B — A의 viewCount + 31이어야 한다
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다. 앞뒤 값의 차이만 보므로 몇 번을 눌러도 같은 결과다.

```check
{
  "requests": [
    { "id": "A", "title": "처음 조회수", "method": "GET", "path": "/api/posts/12" },
    { "id": "P", "title": "동시에 30번 열기", "method": "GET", "path": "/api/posts/12", "concurrent": { "count": 30 } },
    { "id": "B", "title": "다시 조회수", "method": "GET", "path": "/api/posts/12" }
  ],
  "checks": [
    { "id": "C1", "request": "P", "expect": { "status": 200 } },
    { "id": "C2", "request": "B", "expect": { "status": 200, "json": [{ "path": "$.viewCount", "equals": "{{A.body.viewCount + 31}}" }] } },
    { "id": "C3", "request": "P", "expect": { "distinct": { "path": "$.viewCount", "count": 30 } } },
    { "id": "C4", "request": "B", "expect": { "json": [{ "path": "$.likeCount", "equals": "{{A.body.likeCount}}" }] } }
  ]
}
```

## 채점 기준

C = HTTP(필수), D = DB(필수, SELECT만), T = 테스트(선택), R = 코드 리뷰(피드백)

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 P | 동시 30번 모두 `200` |
| C2 | 요청 A·B | B의 `viewCount` = A의 `viewCount + 31`(P 30번 + B 자신 1번) |
| C3 | 요청 P | 30개 응답의 `viewCount`가 모두 다르다 — 각자 자기 조회가 반영된 값을 받았다 |
| C4 | 요청 A·B | 좋아요 수는 그대로 |
| D1 | `SELECT p.view_count, p.like_count, (SELECT COUNT(*) FROM post_like l WHERE l.post_id = p.id) AS likes FROM post p WHERE p.id = 12` | `view_count`가 B 응답과 같고, `like_count`와 `likes`가 같다(`1 1`) |
| T1 | (선택) 동시성 테스트 | 스레드 여러 개로 상세를 동시에 부른 뒤 조회수를 확인하는 테스트(기존 좋아요 동시성 테스트와 같은 방식) |
| R1 | 원인 | "읽고 → 자바에서 +1 → 변경 감지로 저장"이 왜 갱신 손실(lost update)을 만드는지, 그리고 Hibernate 기본 UPDATE가 **바뀐 컬럼만이 아니라 모든 컬럼**을 쓰기 때문에 읽어 둔 `like_count`까지 덮어써서 좋아요 수가 줄 수 있다는 것을 로그로 보여 줄 수 있다 |
| R2 | 고친 방법 | `UPDATE … SET view_count = view_count + 1`(원자적 증가) 뒤 값을 다시 읽었다. 비관적 락(`SELECT … FOR UPDATE`)·낙관적 락(`@Version`)과 비교해 조회수에 무엇이 맞는지, `@DynamicUpdate`만으로는 왜 조회수 손실이 안 고쳐지는지 말할 수 있다 |
| R3 | 응답 값 | 원자적 UPDATE는 영속성 컨텍스트의 엔티티를 바꾸지 않는다 — 엔티티 값에 +1 해서 돌려주면 C3이 깨지는 이유를 안다 |

## 필요한 지식

- [P18 동시성 — 재고·카운터](../docs/knowledge/P18-concurrency-inventory.md) — 갱신 손실과 원자적 증가
- [S08 트랜잭션](../docs/knowledge/S08-transactions.md) — 격리 수준과 "읽고 쓰기" 사이의 틈
- [S09 JPA·Hibernate](../docs/knowledge/S09-jpa-hibernate.md) — 변경 감지가 만드는 UPDATE 문장, 벌크 연산과 영속성 컨텍스트
- [W25 Spring 멀티스레드](../docs/knowledge/W25-spring-multithreading.md) — 요청마다 다른 스레드, 같은 행

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 재현 로그</summary>

상세 조회 한 번의 로그에 `update post set author_id=?, board_id=?, comment_count=?, content=?, … like_count=?, … view_count=? where id=?`가 보인다. 이 요청이 읽은 시점의 `like_count`가 그대로 다시 쓰인다. 조회수만 바꾸고 싶은데 행 전체를 쓰고 있다.
</details>

<details>
<summary>힌트 2 — 고치기</summary>

글 저장소에 `@Modifying @Query("UPDATE Post p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")`를 두고, 상세 서비스는 엔티티의 `increaseViewCount()` 대신 이것을 부른다. 응답의 조회수는 `SELECT p.viewCount FROM Post p WHERE p.id = :id`로 다시 읽는다(좋아요 수를 다시 읽는 메서드가 이미 같은 모양이다). 엔티티를 더는 바꾸지 않으니 행 전체 UPDATE도 사라진다.
</details>
