# 8-3. 관계 쿼리 — 맞팔·맞팔 추천·친구의 친구

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다(8-1 참고).

## 상황

> "프로필에 '맞팔' 목록, 사이드바에 '나를 팔로우하는데 나는 안 한 사람'과 '알 수도 있는 사람'을 보여 주세요. 정지·탈퇴한 사람, 차단한 사람은 추천하면 안 돼요."

`follow` 테이블 하나를 **자기 자신과 JOIN**해서 관계를 찾는 쿼리들이다. "있는 것"뿐 아니라 "**없는 것**"(내가 아직 팔로우하지 않은)을 찾아야 해서 `NOT EXISTS`·`LEFT JOIN … IS NULL`을 쓴다.

## 만들 것

| 메서드·경로 | 의미 | 인증 |
|---|---|---|
| `GET /api/members/{id}/mutuals` | 그 회원과 서로 팔로우하는 회원 id 목록(작은 순) | 필요 없음 |
| `GET /api/me/follow-back` | 나를 팔로우하지만 내가 팔로우하지 않는 **활성(`ACTIVE`)** 회원 id 목록(작은 순) | 필요 |
| `GET /api/me/suggestions?limit=5` | 친구의 친구 추천: 내가 팔로우하는 사람들이 팔로우하는 사람 중 **나 아님·아직 안 팔로우·차단 관계 없음·활성**. 겹치는 사람 수 많은 순 → 같으면 id 작은 순. `limit` 1~20(기본 5) | 필요 |

```json
// mutuals, follow-back
[3, 4]
// suggestions
[ { "memberId": 3, "nickname": "자바초보탈출", "mutualCount": 3 } ]
```

## 직접 확인

```bash
BASE=http://localhost:8080
curl -s "$BASE/api/members/2/mutuals"; echo                                                   # F1
curl -s "$BASE/api/members/4/mutuals"; echo                                                   # F2
curl -s -H 'Authorization: Bearer tok-p02' "$BASE/api/me/follow-back"; echo                  # F3
curl -s -H 'Authorization: Bearer tok-p07' "$BASE/api/me/suggestions?limit=5" | python3 -c 'import sys,json; print([(r["memberId"], r["mutualCount"]) for r in json.load(sys.stdin)])'   # F4
curl -s -H 'Authorization: Bearer tok-p10' "$BASE/api/me/suggestions?limit=3" | python3 -c 'import sys,json; print([(r["memberId"], r["mutualCount"]) for r in json.load(sys.stdin)])'   # F5
curl -i "$BASE/api/me/follow-back"                                                           # F6
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | F1 / F2 | `[3, 4]` / `[2, 5, 19]` |
| C2 | F3 | `[8, 9, 11, 12, 15, 16, 20, 21, 22, 24, 27]` — 정지(28)·탈퇴(29) 회원은 빠진다 |
| C3 | F4 | `(3, 3) (10, 3) (11, 2) (13, 1) (17, 1)` |
| C4 | F5 | `(4, 3) (2, 2) (5, 2)` |
| C5 | F6 | `401` |
| R1 | 없는 것 찾기 | "아직 안 팔로우"를 `NOT EXISTS` 또는 `LEFT JOIN … IS NULL`로 표현하고, 둘의 차이를 안다(`NOT IN`은 NULL이 끼면 결과가 비는 함정) |
| R2 | 조건 누락 | 나 자신·차단(양방향)·비활성 회원 제외가 모두 쿼리에 있다 |
| R3 | 인덱스 | `follow`의 `(follower_id, followee_id)` 유니크·`(followee_id, follower_id)` 인덱스가 각 쿼리 방향에 쓰이는지 `EXPLAIN`으로 봤다 |

## 필요한 지식

- [R04 SQL로 데이터 다루기 — JOIN](../../docs/knowledge/R04-sql-crud-join.md)
- [R05 인덱스와 B-Tree](../../docs/knowledge/R05-index-btree.md) — 복합 인덱스 컬럼 순서
- [P21 QueryDSL 설정과 동적 쿼리](../../docs/knowledge/P21-querydsl-setup.md) — 서브쿼리 표현

## 다음 단계

[8-4. 조합 검색](8-4-dynamic-search.md)
