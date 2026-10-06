# 2-1. 단건 조회와 404

## 상황

글을 쓸 수는 있는데 읽을 수가 없다. 프론트가 글 상세 화면을 만든다.

> "글 id로 상세를 가져오고 싶어요. 조회수도 하나 올려 주세요. 없는 글이면 404로 주시고요."

**조회는 로그인하지 않아도 된다.** 1-6에서 만든 토큰 확인이 모든 `/api/**`에 걸려 있다면 GET은 토큰 없이도 지나가게 바꿔야 한다.

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `GET /api/posts/{id}` |
| 인증 | 필요 없음(토큰 없이 200) |
| 응답 | `200`, 아래 JSON |
| 조회수 | 호출할 때마다 `post.view_count`를 1 올린다. 응답의 `viewCount`는 **올린 뒤의 값** |
| 없는 글 | `404`, `application/problem+json`(1-5의 에러 형식) |
| 숫자가 아닌 id | `400` |

이 단계에서는 임시저장·삭제·공개 범위를 따지지 않는다(2-3에서 한다). 채점도 공개 글(2번)과 없는 글로만 한다.

```json
{
  "id": 2,
  "boardSlug": "dev",
  "title": "JPA 연관관계 매핑 정리",
  "content": "@ManyToOne은 기본이 즉시 로딩이라 ...",
  "tags": ["spring", "jpa"],
  "visibility": "PUBLIC",
  "author": { "id": 3, "nickname": "이스프링" },
  "viewCount": 13,
  "likeCount": 1,
  "commentCount": 0,
  "createdAt": "2026-09-15T20:00:00"
}
```

## 직접 확인

```bash
BASE=http://localhost:8080

curl -i "$BASE/api/posts/2"          # G1 — 두 번 호출해 viewCount가 1씩 오르는지 본다
curl -i "$BASE/api/posts/2"          # G2
curl -i "$BASE/api/posts/999999"     # G3 — 없는 글
curl -i "$BASE/api/posts/abc"        # G4 — 숫자가 아닌 id
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| D1 | G1 **전에** `SELECT view_count FROM post WHERE id = 2` | 값을 기억해 둔다(= v) |
| C1 | G1(토큰 없음) | `200`. `id`=2, `boardSlug`=`dev`, `title`=`JPA 연관관계 매핑 정리`, `author`={3, 이스프링}, `tags`=[`spring`,`jpa`] — 순서 무관, `likeCount`=1, `commentCount`=0, `viewCount`=v+1 |
| C2 | G2 | `200`, `viewCount`=v+2 |
| D2 | G2 뒤 `SELECT view_count FROM post WHERE id = 2` | v+2 |
| C3 | G3 | `404`, `Content-Type: application/problem+json` |
| C4 | G4 | `400` |
| R1 | 연관 엔티티 | 작성자·태그를 트랜잭션 안에서 DTO로 옮긴다(`open-in-view: false`라서 밖에서 지연 로딩하면 `LazyInitializationException`) |
| R2 | 조회수 | 조회수를 올리는 위치·방법이 분명하다(변경 감지 또는 `UPDATE ... SET view_count = view_count + 1`). 읽기 전용 트랜잭션(`readOnly = true`)에서 쓰기를 하지 않는다 |
| R3 | 404 | 1-5의 전역 에러 처리(`@RestControllerAdvice`)를 재사용한다 |
| R4 | 인증 | 토큰 확인이 GET을 막지 않는다. 쓰기 API(POST)는 여전히 토큰이 필요하다 |

## 필요한 지식

- [S09 JPA·Hibernate — LAZY와 N+1](../../docs/knowledge/S09-jpa-hibernate.md#lazy와-n1) · [OSIV와 경계](../../docs/knowledge/S09-jpa-hibernate.md#osiv와-경계) — 지연 로딩이 어디서 터지나
- [P19 — 네이밍, dialect, OSIV](../../docs/knowledge/P19-mysql-jpa-setup.md#26-네이밍-dialect-osiv)
- [W09 DTO는 왜 쓰나](../../docs/knowledge/W09-why-dto.md)
- [S08 트랜잭션 관리](../../docs/knowledge/S08-transactions.md) — `readOnly`와 쓰기
- [W11 트랜잭션은 왜 서비스 계층에 거나](../../docs/knowledge/W11-why-tx-in-service.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — GET만 토큰 없이 통과시키기</summary>

인터셉터라면 `request.getMethod()`가 `GET`이고 헤더가 없을 때는 그냥 통과시킨다(헤더가 있으면 2-3에서 확인한다). 경로 패턴을 나눠 등록하는 방법도 있다.
</details>

<details>
<summary>힌트 2 — LazyInitializationException</summary>

서비스 메서드(`@Transactional`) 안에서 `post.getAuthor().getNickname()`, `post.getTags()`를 읽어 DTO를 만들어 반환한다. 컨트롤러에서 엔티티의 연관 필드를 건드리면 트랜잭션이 끝난 뒤라 실패한다.
</details>

## 다음 단계

[2-2. 게시판 목록과 페이징](2-2-board-list.md)
