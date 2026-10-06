# 2-2. 게시판 목록과 페이징

## 상황

> "게시판 들어가면 최신 글부터 10개씩 보여 주고, 아래에 페이지 번호를 붙일 거예요. 전체 몇 개인지도 알려 주세요."

글이 수천 개여도 한 번에 다 보내지 않는다. **한 페이지만 잘라서** 보내고, 전체 건수와 다음 페이지가 있는지를 같이 알려 준다.

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `GET /api/boards/{slug}/posts?page=0&size=10` |
| 인증 | 필요 없음 |
| 대상 | 그 게시판에서 `status = 'PUBLISHED'`이고 삭제되지 않은(`deleted_at IS NULL`) 글. 공개 범위·차단은 2-3에서 |
| 정렬 | `published_at` 최신순, 같으면 `id` 큰 순 |
| `page` | 0부터. 생략하면 0. 음수면 `400` |
| `size` | 생략하면 10. 1~50만 허용, 밖이면 `400` |
| 없는 게시판 | `404` |
| 응답 | 아래 JSON — **목록에는 본문(`content`)을 넣지 않는다** |

```json
{
  "items": [
    {
      "id": 21,
      "title": "자유글 10",
      "author": { "id": 4, "nickname": "박디비" },
      "tags": ["mysql"],
      "likeCount": 0,
      "commentCount": 0,
      "viewCount": 10,
      "publishedAt": "2026-10-04T09:00:00"
    }
  ],
  "page": 0,
  "size": 5,
  "totalElements": 14,
  "totalPages": 3,
  "hasNext": true
}
```

## 직접 확인

`free`(자유) 게시판으로 확인한다. 채점은 이 게시판의 시드 글로 하므로, **`free`에 직접 글을 쓰면 기대값이 달라진다**(그럴 땐 DB 초기화).

```bash
BASE=http://localhost:8080

curl -s "$BASE/api/boards/free/posts?page=0&size=5"      # L1
curl -s "$BASE/api/boards/free/posts?page=2&size=5"      # L2
curl -i "$BASE/api/boards/free/posts?size=51"            # L3
curl -i "$BASE/api/boards/free/posts?page=-1"            # L4
curl -i "$BASE/api/boards/nope/posts"                    # L5
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | L1 | `200`. `items`의 id 순서 = `21, 20, 19, 18, 17`. `totalElements`=14, `totalPages`=3, `hasNext`=true, `page`=0, `size`=5 |
| C2 | L1 | 각 항목에 `id`·`title`·`author`(id·nickname)·`tags`·`likeCount`·`commentCount`·`viewCount`·`publishedAt`가 있고 **`content`가 없다**. id 21의 `tags`=[`mysql`], id 20의 `tags`=[`java`] |
| C3 | L2 | `200`. id 순서 = `9, 6, 5, 4`, `hasNext`=false |
| C4 | L3 | `400` |
| C5 | L4 | `400` |
| C6 | L5 | `404` |
| R1 | 페이징 | `Pageable`/`PageRequest`(또는 직접 LIMIT·OFFSET)와 정렬 조건이 분명하다. 동률 정렬(`id`)까지 넣었다 |
| R2 | 건수 | 전체 건수를 구하는 쿼리가 따로 있다는 것을 알고 있다(로그로 확인) |
| R3 | 응답 모양 | 목록 전용 DTO를 쓴다. `Page` 객체를 그대로 직렬화하지 않는다(응답 모양이 라이브러리에 묶인다) |
| R4 | 입력 검증 | `page`·`size` 범위를 서버가 검사한다 |

7·8·10번은 임시저장·삭제·숨김이라 빠지고, 6번(팔로워 공개)·9번(차단 확인용)은 이 단계에서는 보이는 게 맞다.

## 필요한 지식

- [W15 페이징 — OFFSET vs 커서](../../docs/knowledge/W15-paging-offset-vs-cursor.md) — 지금은 OFFSET, 4-3에서 커서
- [W15 — 총 건수는 별도 질문이다](../../docs/knowledge/W15-paging-offset-vs-cursor.md#총-건수는-별도-질문이다)
- [S10 — 페이징은 정렬과 건수 계산의 계약이다](../../docs/knowledge/S10-spring-data-query.md#페이징은-정렬과-건수-계산의-계약이다)
- [W09 DTO는 왜 쓰나](../../docs/knowledge/W09-why-dto.md)
- [W10 검증은 어디서 하나](../../docs/knowledge/W10-where-to-validate.md) — 쿼리 파라미터 검증

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 리포지토리</summary>

`Page<Post> findByBoardAndStatusAndDeletedAtIsNull(Board board, PostStatus status, Pageable pageable)` 같은 파생 쿼리와 `PageRequest.of(page, size, Sort.by(DESC, "publishedAt").and(Sort.by(DESC, "id")))`로 시작할 수 있다. 결과 `Page`에서 `getTotalElements()`, `getTotalPages()`, `hasNext()`를 꺼내 DTO에 담는다.
</details>

<details>
<summary>힌트 2 — 파라미터 검증</summary>

`@RequestParam(defaultValue = "10") @Min(1) @Max(50) int size`처럼 쓰고 컨트롤러에 `@Validated`를 붙이면 범위 밖 값이 예외가 된다. 그 예외(`HandlerMethodValidationException` 등)도 Advice에서 400으로 바꾼다.
</details>

## 다음 단계

[2-3. 볼 수 있는 글만](2-3-visibility.md)
