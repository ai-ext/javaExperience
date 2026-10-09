# 8-2. 최근 N일 인기글 랭킹 — 조건부 집계와 고정 시계

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다(8-1 참고).

## 상황

> "메인에 '이번 주 인기글'을 띄워 주세요. 누적 좋아요가 아니라 **최근에** 반응이 많은 글이요."

누적 좋아요 1등 글(18·55·103번, 각 22개)은 오래전에 받은 좋아요가 대부분이다. "최근 7일"만 세면 순위가 완전히 달라진다. 그리고 "최근"은 **지금 시각**에 따라 달라진다. 학습용 데이터는 2026-10-05 00:00 이전에 만들어졌으므로, practice 프로파일에서는 그 시각을 "지금"으로 고정한다.

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `GET /api/posts/popular?days=7&limit=10` |
| 인증 | 필요 없음(비로그인 기준으로 볼 수 있는 글만 — `PUBLISHED`·`PUBLIC`·삭제 안 됨) |
| 기간 | `[지금 − days, 지금)` — `days`는 1~30(기본 7), 밖이면 `400` |
| 점수 | 기간 안 좋아요 수 × 3 + 기간 안 댓글 수(삭제 제외) × 1. **점수 0인 글은 뺀다** |
| 정렬 | 점수 높은 순 → 같으면 `published_at` 최신 → `id` 큰 순 |
| `limit` | 1~50(기본 10) |
| 지금 시각 | `Clock` 빈에서 얻는다. `app.fixed-now`(practice 프로파일에 이미 `2026-10-05T00:00:00`)가 있으면 `Clock.fixed`, 없으면 시스템 시계 |

```json
[ { "postId": 145, "title": "…", "score": 61, "likes": 20, "comments": 1 } ]
```

## 직접 확인

```bash
BASE=http://localhost:8080
top() { python3 -c 'import sys,json; print([(r["postId"], r["score"], r["likes"], r["comments"]) for r in json.load(sys.stdin)])'; }
curl -s "$BASE/api/posts/popular?days=7&limit=5" | top       # H1
curl -s "$BASE/api/posts/popular?days=30&limit=3" | top      # H2
curl -s "$BASE/api/posts/popular?days=7&limit=50" | python3 -c 'import sys,json; print(len(json.load(sys.stdin)))'   # H3
curl -i "$BASE/api/posts/popular?days=31"                   # H4
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용). 항목은 (postId, score, likes, comments).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | H1 | `(145, 61, 20, 1) (143, 61, 20, 1) (144, 10, 3, 1) (140, 9, 2, 3) (139, 5, 1, 2)` — 145와 143은 동점이라 최신 글인 145가 먼저 |
| C2 | H2 | `(131, 68, …) (145, 61, …) (143, 61, …)` — 기간을 늘리면 다른 글이 1등 |
| C3 | H3 | `16` — 점수 0인 글은 없다 |
| C4 | H4 | `400` |
| R1 | 시간 | `LocalDateTime.now()`를 직접 부르지 않고 `Clock`을 주입받는다. 기간 경계가 `[시작, 끝)`이다(끝 포함 아님) |
| R2 | 쿼리 | 글마다 좋아요·댓글을 따로 세지 않는다. `SUM(CASE WHEN ... THEN 1 ELSE 0 END)` 같은 조건부 집계나 미리 집계한 서브쿼리 한두 번으로 계산한다 |
| R3 | 필터 위치 | 볼 수 있는 글만·점수 > 0·정렬·LIMIT이 모두 DB에서 처리된다(전부 가져와 자바에서 정렬하지 않는다) |
| R4 | 비정규화 숫자 | `post.like_count`(누적, 어긋날 수 있음)를 쓰지 않고 기간 안의 행을 센다 |

## 필요한 지식

- [W20 시간과 타임존](../../docs/knowledge/W20-time-timezone.md) — `Clock`, 기간 경계
- [V03 — 시간과 난수는 작은 의존성으로 넣는다](../../docs/knowledge/V03-mocking-in-practice.md#27-시간과-난수는-작은-의존성으로-넣는다)
- [R04 SQL로 데이터 다루기](../../docs/knowledge/R04-sql-crud-join.md)
- [W17 캐시는 어디에 두나](../../docs/knowledge/W17-where-to-cache.md) — 이런 랭킹은 보통 캐시한다(선택)

## 힌트 (막힐 때만)

<details>
<summary>힌트 — Clock 빈</summary>

`@Bean Clock clock(@Value("${app.fixed-now:}") String fixedNow)`에서 값이 비어 있으면 `Clock.systemDefaultZone()`, 있으면 `Clock.fixed(LocalDateTime.parse(fixedNow).atZone(ZoneId.of("Asia/Seoul")).toInstant(), ZoneId.of("Asia/Seoul"))`. 서비스는 `LocalDateTime.now(clock)`을 쓴다.
</details>

## 다음 단계

[8-3. 관계 쿼리](8-3-relations.md)
