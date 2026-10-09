# 8-1. 회원별 활동 요약 — LEFT JOIN과 집계

> **8장은 학습용 DB(`practice`)를 쓴다.** 앱을 `./gradlew bootRun --args='--spring.profiles.active=practice'`로 띄운다(IntelliJ: Active profiles에 `practice`). 회원 30명·글 145·좋아요 568에 함정이 섞여 있다([학습용 미션](../../practice/MISSIONS.md)의 "데이터에 숨겨 둔 함정"). 토큰은 `tok-p01`~`tok-p30`(번호 = 회원 id), 운영자는 `tok-p01`. 2~6장에서 만든 API와 규칙(볼 수 있는 글만 등)이 그대로 동작한다고 가정한다.

## 상황

> "관리자 화면에 회원별 활동 요약 표를 넣어 주세요. 쓴 글, 쓴 댓글, 받은 좋아요, 누른 좋아요요. 활동이 없는 회원도 0으로 나와야 해요."

여러 테이블을 묶어 세는 **집계 쿼리**다. 8장부터는 순서를 바꾼다. **SQL을 먼저 완성하고**(CloudBeaver의 `practice (학습용)` 연결), 그다음 API로 옮긴다.

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `GET /api/stats/member-activity` |
| 인증 | 필요 없음 |
| 응답 | 회원 30명 전부의 배열, `likesReceived` 많은 순, 같으면 `memberId` 작은 순 |
| SQL 파일 | 먼저 짠 SQL을 `sql/8-1-member-activity.sql`(레포 루트의 `sql/` 폴더)에 남긴다 — 리뷰에 쓴다 |

```json
[ { "memberId": 2, "nickname": "코딩하는고양이", "posts": 13, "comments": 13, "likesReceived": 74, "likesGiven": 18 } ]
```

| 칸 | 세는 것 |
|---|---|
| `posts` | 그 회원이 쓴 글 중 `PUBLISHED`이고 삭제되지 않은 글 |
| `comments` | 그 회원이 쓴 댓글 중 삭제되지 않았고, 달린 글도 삭제되지 않은 것 |
| `likesReceived` | 그 회원이 쓴 **삭제되지 않은 글**에 달린 좋아요 **행 수**(`post.like_count`가 아니다) |
| `likesGiven` | 그 회원이 누른 좋아요 행 수 |
| `nickname` | 탈퇴(`WITHDRAWN`) 회원은 `"탈퇴한 회원"` |

## 직접 확인

```bash
BASE=http://localhost:8080
curl -s "$BASE/api/stats/member-activity" | python3 -c '
import sys,json; d=json.load(sys.stdin); print(len(d))
for r in d[:5]: print(r)
print([r for r in d if r["memberId"] in (12, 26, 29, 30)])'
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용). 값은 (memberId, nickname, posts, comments, likesReceived, likesGiven) 순서다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 위 요청 | `200`, 30개 |
| C2 | 앞 5개 | `(2, 코딩하는고양이, 13, 13, 74, 18)` `(4, 스프링요정, 19, 19, 60, 23)` `(3, 자바초보탈출, 12, 16, 55, 15)` `(5, 쿼리장인, 9, 14, 40, 12)` `(22, 야근없는팀, 5, 10, 39, 24)` |
| C3 | 회원 30 / 26 / 29 | `(30, 새로온회원, 0, 0, 0, 0)` / `(26, 조용한독자, 0, 9, 0, 23)` / `(29, 탈퇴한 회원, 3, 10, 13, 14)` |
| C4 | 회원 12 | `(12, …, 6, 12, 10, 29)` — `likesReceived`가 10이다(`like_count`를 더하면 9가 나와 틀린다) |
| R1 | SQL 파일 | `sql/8-1-member-activity.sql`이 있고, API가 같은 결과를 낸다 |
| R2 | 곱해지는 JOIN | 글·댓글·좋아요를 한 번에 LEFT JOIN 한 뒤 `COUNT`하면 행이 곱해져 숫자가 부풀어 오른다(회원 2만 해도 182가 나온다). 서브쿼리나 미리 집계한 파생 테이블로 피했다 |
| R3 | 쿼리 수 | 회원마다 쿼리를 따로 날리지 않는다(30명 × 4 = 120번). 한두 번의 쿼리로 끝낸다 |
| R4 | 방식 선택 | 이런 통계는 엔티티 조회보다 네이티브 SQL·JPQL DTO 조회·QueryDSL 프로젝션이 맞다. 고른 이유를 설명할 수 있다 |

## 필요한 지식

- [R04 SQL로 데이터 다루기 — JOIN·집계](../../docs/knowledge/R04-sql-crud-join.md)
- [W03 DB 접근 방식 총비교](../../docs/knowledge/W03-db-access-comparison.md) — 엔티티 vs DTO vs 네이티브
- [W05 JPA vs MyBatis](../../docs/knowledge/W05-jpa-vs-mybatis-strategy.md) — 통계 쿼리를 어디서 짜나
- [S10 — `@Query`는 선언 시점에 쿼리를 분리한다](../../docs/knowledge/S10-spring-data-query.md#query는-선언-시점에-쿼리를-분리한다)

## 힌트 (막힐 때만)

<details>
<summary>힌트 — 곱해지지 않게</summary>

`member`를 기준으로 두고, 각 숫자를 상관 서브쿼리 `(SELECT COUNT(*) FROM ... WHERE ... = m.id)`로 따로 세거나, `(SELECT author_id, COUNT(*) cnt FROM post ... GROUP BY author_id) p`처럼 미리 집계한 결과를 LEFT JOIN한 뒤 `COALESCE(p.cnt, 0)`. 결과는 `record`/인터페이스 프로젝션으로 받는다.
</details>

## 다음 단계

[8-2. 최근 N일 인기글 랭킹](8-2-popular-ranking.md)
