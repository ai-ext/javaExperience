# 3-1. 부분 수정(PATCH)과 본인 확인

## 상황

> "오타만 고치고 싶은데 글 전체를 다시 보내야 하나요? 바꾼 칸만 보내고 싶어요."

**보낸 필드만 바꾸는** 수정 API를 만든다. 그리고 남의 글은 고칠 수 없어야 한다. 이 확인을 빼먹으면 id만 바꿔서 남의 글을 고치는 사고(IDOR)가 난다.

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `PATCH /api/posts/{id}` |
| 인증 | 필요(1-6의 401·403 규칙 그대로) |
| 요청 본문 | `{ "title"?, "content"?, "tags"?, "visibility"? }` — 보낸 필드만 바꾼다 |
| 응답 | `200`, 2-1의 상세 JSON(바뀐 값) |

| 상황 | 결과 |
|---|---|
| 필드를 안 보내거나 `null` | 그대로 둔다 |
| `title`·`content`가 빈 문자열이나 공백 | `400` |
| `title` 201자 이상, `tags` 6개 이상 | `400`(1-5와 같은 규칙) |
| `tags: []` | 태그를 모두 뗀다 |
| `boardSlug`를 보냄 | 무시한다(게시판은 못 옮긴다) |
| 없는 글, 또는 2-3 규칙상 볼 수 없는 글 | `404` |
| 볼 수는 있지만 작성자가 아님 | `403` |

수정하면 `updated_at`을 지금 시각으로 바꾼다.

## 직접 확인

채점용 글을 하나 만든 뒤(`dev` 게시판) 고친다.

```bash
BASE=http://localhost:8080
K='Authorization: Bearer tok-kimjava'; L='Authorization: Bearer tok-lee'
jid() { python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])'; }

X=$(curl -s -X POST "$BASE/api/posts" -H "$K" -H 'Content-Type: application/json' \
  -d '{"boardSlug":"dev","title":"[채점] 수정 전","content":"수정 전 본문","tags":["spring","jpa"],"visibility":"PUBLIC"}' | jid)
echo "X=$X"                                                                                                   # E0

curl -i -X PATCH "$BASE/api/posts/$X" -H "$K" -H 'Content-Type: application/json' -d '{"title":"[채점] 수정 후"}'     # E1
curl -i -X PATCH "$BASE/api/posts/$X" -H "$K" -H 'Content-Type: application/json' -d '{"tags":[]}'                 # E2
curl -i -X PATCH "$BASE/api/posts/$X" -H "$K" -H 'Content-Type: application/json' -d '{"title":"   "}'             # E3
curl -i -X PATCH "$BASE/api/posts/$X" -H "$L" -H 'Content-Type: application/json' -d '{"title":"[채점] 남의 수정"}'   # E4
curl -i -X PATCH "$BASE/api/posts/$X" -H 'Content-Type: application/json' -d '{"title":"[채점] 토큰 없음"}'           # E5
curl -i -X PATCH "$BASE/api/posts/8" -H "$L" -H 'Content-Type: application/json' -d '{"title":"[채점] 지운 글"}'      # E6
curl -i -X PATCH "$BASE/api/posts/999999" -H "$K" -H 'Content-Type: application/json' -d '{"title":"[채점] 없는 글"}' # E7
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). `{X}`는 E0에서 만든 글의 id다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | E0 | `201` |
| C2 | E1 | `200`. `title`=`[채점] 수정 후`, `content`=`수정 전 본문`(그대로), `tags`=[`spring`,`jpa`] — 그대로 |
| C3 | E2 | `200`, `tags`=[], `title`=`[채점] 수정 후`(그대로) |
| C4 | E3 | `400`, `application/problem+json` |
| C5 | E4(이스프링이 김자바 글 수정) | `403` |
| C6 | E5 | `401` |
| C7 | E6(작성자가 지운 글을 고치려 함) | `404` |
| C8 | E7 | `404` |
| D1 | `SELECT title, content FROM post WHERE id = {X}` | `[채점] 수정 후`, `수정 전 본문` — E3·E4·E5가 아무것도 바꾸지 않았다 |
| D2 | `SELECT COUNT(*) FROM post_tag WHERE post_id = {X}` | `0` |
| R1 | 변경 방식 | 영속 상태 엔티티를 바꾸고 트랜잭션 커밋 때 반영되는 것(변경 감지)을 이해하고 쓴다. 불필요한 `save()` 재호출이 있다면 피드백 |
| R2 | 권한 확인 위치 | "작성자인가" 확인이 서비스에 있다(컨트롤러나 프론트에 기대지 않는다). 404(볼 수 없음)와 403(작성자 아님)의 순서가 맞다 |
| R3 | 부분 수정 표현 | 생략·`null`=그대로, 빈 값=400을 한 곳에서 일관되게 처리한다. 수정용 DTO가 생성용과 분리되어 있다 |
| R4 | 검증 재사용 | 1-5의 제목·태그 규칙을 복사해 붙이지 않고 재사용한다 |

## 필요한 지식

- [S09 — 영속 상태 변경과 flush](../../docs/knowledge/S09-jpa-hibernate.md#예제-2-영속-상태-변경과-flush) — `save()` 없이 바뀌는 이유
- [D11 — 안전한 SQL 바인딩과 IDOR 방어](../../docs/knowledge/D11-web-security-basics.md#41-안전한-sql-바인딩과-idor-방어를-먼저-설계하기)
- [W10 검증은 어디서 하나](../../docs/knowledge/W10-where-to-validate.md)
- [P16 — 알 수 없는 필드는 API 진화 정책으로 결정한다](../../docs/knowledge/P16-json-jackson-practical.md#28-알-수-없는-필드는-api-진화-정책으로-결정한다) — `boardSlug`를 보냈을 때

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 보낸 필드만</summary>

수정 DTO를 `record PostUpdateRequest(String title, String content, List<String> tags, Visibility visibility)`로 두고, 서비스에서 `if (req.title() != null) post.changeTitle(req.title());`처럼 `null`이 아닐 때만 바꾼다. 엔티티에 setter 대신 의미 있는 변경 메서드를 두면 규칙(빈 제목 금지)도 그 안에 넣을 수 있다.
</details>

<details>
<summary>힌트 2 — 404와 403 순서</summary>

먼저 2-3 규칙으로 "볼 수 있나"를 확인해 아니면 404, 그다음 "작성자인가"를 확인해 아니면 403. 반대로 하면 볼 수 없는 글의 존재가 403으로 드러난다.
</details>

## 다음 단계

[3-2. 삭제 — soft delete](3-2-soft-delete.md)
