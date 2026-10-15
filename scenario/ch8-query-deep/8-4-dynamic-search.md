# 8-4. 조합 검색 — 동적 쿼리

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다(8-1 참고).

## 상황

> "검색 화면에 필터가 여러 개예요. 게시판, 태그, 작성자, 기간, 제목 키워드. 아무거나 골라서 같이 걸 수 있어야 해요."

조건이 5개면 조합은 32가지다. 조합마다 메서드를 만들 수는 없다. **들어온 조건만 붙이는** 동적 쿼리를 만든다. 2-3의 "볼 수 있는 글만" 규칙도 그대로 붙어야 한다.

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `GET /api/posts/search?board=&tag=&author=&from=&to=&q=&page=0&size=10` |
| 인증 | 선택(2-3과 같다 — 없으면 비로그인, 있으면 그 회원 기준) |
| `board` | 게시판 slug |
| `tag` | 태그 이름(정확히 일치). 없는 태그면 결과 0건(`200`) |
| `author` | 작성자 회원 id |
| `from`, `to` | `published_at`의 날짜 범위 `YYYY-MM-DD`, **둘 다 포함**(`to`는 그날 끝까지). `from > to`면 `400` |
| `q` | 제목에 포함(대소문자 무시) |
| 정렬·응답 | 2-2와 같다(`published_at` 최신 → `id`, `items`·`totalElements`·`hasNext` …) |

## 직접 확인

```bash
BASE=http://localhost:8080
s() { curl -s "$@" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["totalElements"], [i["id"] for i in d["items"]][:5])'; }
s "$BASE/api/posts/search?tag=jpa&size=5"                                      # Z1
s "$BASE/api/posts/search?board=qna&tag=spring&size=5"                         # Z2
s "$BASE/api/posts/search?author=2&from=2026-09-01&to=2026-09-30"              # Z3
s "$BASE/api/posts/search?q=n%2B1&size=5"                                      # Z4 (n+1, 소문자)
s "$BASE/api/posts/search?size=5"                                              # Z5 조건 없음
s "$BASE/api/posts/search?board=dev&q=%ED%8A%B8%EB%9E%9C%EC%9E%AD%EC%85%98&from=2026-08-01"   # Z6 (q=트랜잭션)
s -H 'Authorization: Bearer tok-p07' "$BASE/api/posts/search?author=2"          # Z7 회원 7은 회원 2를 차단
s "$BASE/api/posts/search?tag=no-such-tag"                                     # Z8
curl -i "$BASE/api/posts/search?from=2026-10-01&to=2026-09-01"                # Z9
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용). 결과는 (totalElements, 앞 5개 id).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | Z1 | `13`, `[123, 118, 98, 87, 79]` |
| C2 | Z2 | `12`, `[139, 130, 111, 106, 104]` |
| C3 | Z3 | `1`, `[112]` |
| C4 | Z4 | `9`, `[118, 98, 79, 74, 71]` — 대소문자 무시 |
| C5 | Z5 | `111`, `[145, 144, 143, 141, 140]` — 비로그인이 볼 수 있는 전체 |
| C6 | Z6 | `1`, `[145]` |
| C7 | Z7 | `0` — 차단 관계라 하나도 안 보인다 |
| C8 | Z8 | `0`, `[]` |
| C9 | Z9 | `400` |
| R1 | 동적 조건 | 조건별 if-else 메서드 조합이 아니라, 값이 있을 때만 조건을 붙이는 구조(QueryDSL `BooleanExpression`이 `null`이면 무시, `Specification` 조합, `Criteria` 등) |
| R2 | 규칙 재사용 | 2-3의 "볼 수 있는 글" 조건을 복사하지 않고 같은 조각을 재사용한다 |
| R3 | 태그 JOIN | 태그 조건이 있을 때만 `post_tag`를 JOIN하고, JOIN 때문에 같은 글이 중복되거나 `totalElements`가 부풀지 않는다 |
| R4 | 키워드 | `LIKE '%q%'`가 인덱스를 못 탄다는 것을 알고, 데이터가 커지면 어떻게 할지(전문 검색 인덱스·검색 엔진) 말할 수 있다 |

## 필요한 지식

- [P21 — 동적 조건은 null 반환 메서드로 만든다](../../docs/knowledge/P21-querydsl-setup.md#25-동적-조건은-null-반환-메서드로-만든다)
- [S10 — Specification과 Projection은 서로 다른 문제를 푼다](../../docs/knowledge/S10-spring-data-query.md#specification과-projection은-서로-다른-문제를-푼다)
- [W04 MyBatis XML 쿼리 실무](../../docs/knowledge/W04-mybatis-xml-practical.md) — MyBatis라면 동적 SQL을 어떻게 쓰나(비교)
- [R05 인덱스와 B-Tree](../../docs/knowledge/R05-index-btree.md) — `LIKE '%…%'`

## 다음 단계

[8-5. 정합성 배치](8-5-recount-batch.md)
