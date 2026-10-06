# 5-2. 답글(1단계까지)

## 상황

> "댓글에 답글을 달 수 있게 해 주세요. 근데 답글의 답글은 안 돼요. 화면이 계속 오른쪽으로 밀려서요."

같은 API에 `parentId`를 받는다. 부모가 **같은 글의, 최상위, 지워지지 않은 댓글**인지 확인해야 한다.

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `POST /api/posts/{postId}/comments`(5-1과 같다) |
| 요청 | `{ "content": "...", "parentId": 1 }` — `parentId`가 없으면 5-1처럼 최상위 댓글 |
| 응답 | `201`, 5-1과 같은 JSON에 `parentId`가 채워진다 |
| `comment_count` | 답글도 1 증가 |

| 부모(`parentId`) 상황 | 결과 |
|---|---|
| 없는 댓글 id | `404` |
| 다른 글의 댓글 | `400` |
| 답글(부모가 또 부모를 가짐) | `400` |
| 지워진 댓글 | `400` |

## 직접 확인

11번 글(이스프링의 "트랜잭션은 어디에 거나요?")에는 시드 댓글이 있다: 1번(최상위), 2번(1번의 답글), 6번(지워진 최상위).

```bash
BASE=http://localhost:8080
K='Authorization: Bearer tok-kimjava'
post() { curl -s -i -X POST "$BASE/api/posts/$1/comments" -H "$K" -H 'Content-Type: application/json' -d "$2"; echo; echo ----; }

post 11 '{"content":"[채점] 답글","parentId":1}'          # Q1
post 11 '{"content":"[채점] 답글의 답글","parentId":2}'   # Q2
post 11 '{"content":"[채점] 지운 댓글에","parentId":6}'   # Q3
post 3  '{"content":"[채점] 다른 글 부모","parentId":1}'  # Q4
post 11 '{"content":"[채점] 없는 부모","parentId":999999}' # Q5
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| D1 | Q1 **전** `SELECT comment_count FROM post WHERE id = 11` | 값 c를 기억 |
| C1 | Q1 | `201`, `parentId`=1, `postId`=11 |
| C2 | Q2 / Q3 / Q4 | `400` / `400` / `400` |
| C3 | Q5 | `404` |
| D2 | Q5까지 끝난 뒤 같은 쿼리 | c+1 |
| D3 | `SELECT parent_id FROM comment WHERE id = {Q1 응답 id}` | `1` |
| R1 | 부모 검증 | 세 조건(같은 글·최상위·안 지워짐)을 서비스에서 확인하고, 실패를 의미 있는 예외로 던진다 |
| R2 | 자기 참조 | `Comment.parent`가 `@ManyToOne(LAZY)` 자기 참조다 |
| R3 | 400과 404 | "부모가 없다"(404)와 "부모가 규칙에 안 맞다"(400)를 나눈 이유를 설명할 수 있다 |

## 필요한 지식

- [P20 JPA 엔티티·연관관계 매핑](../../docs/knowledge/P20-jpa-entity-mapping.md)
- [W10 — 서비스와 DB: 안내 검사와 최종 고유성](../../docs/knowledge/W10-where-to-validate.md#53-서비스와-db-안내-검사와-최종-고유성) — 어떤 검사를 어디에 둘까
- [W08 예외는 어디서 잡나](../../docs/knowledge/W08-where-to-handle-exceptions.md)

## 다음 단계

[5-3. 댓글 목록과 삭제](5-3-comment-list-delete.md)
