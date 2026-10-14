# 1-9. 글의 태그 목록 조회 — 제네릭과 Stream

## 상황

> "글 상세 화면에서 태그를 따로 새로고침하고 싶어요. 글 ID로 태그 이름 목록을 주세요."

1-8까지 글을 만들고 복사했다. 이제 기존 글의 태그 목록을 읽는 작은 `GET` API를 추가한다. `Post`의 태그 `Set<Tag>`를 API 응답 `List<TagResponse>`로 바꾸면서 **제네릭 타입**과 Stream의 `map`을 함께 연습한다.

이 단계는 JPA 경로에서 컬렉션과 Stream 변환을 익히는 실습이다. 같은 계약의 MyBatis Mapper 대안은 아직 제공하지 않으며, MyBatis 평가는 별도 구현 전까지 보류한다.

## 화면 시나리오

```screen
{
  "title": "게시글 태그 목록",
  "summary": "글 상세에서 태그만 다시 읽는다. 서버는 연관된 Tag 객체를 TagResponse 목록으로 바꿔 JSON 배열로 돌려준다.",
  "screen": [
    { "type": "text", "id": "post", "label": "글 제목", "value": "JPA 연관관계 매핑 정리", "emphasis": "title" },
    { "type": "chips", "id": "tags", "label": "태그", "items": ["java", "jpa"] },
    { "type": "actions", "id": "reload", "items": [{ "id": "reload-tags", "label": "태그 새로고침", "variant": "primary" }] }
  ],
  "flows": [{
    "name": "태그 다시 읽기",
    "steps": [
      { "kind": "user", "text": "태그 새로고침을 누른다", "focus": ["reload-tags"] },
      { "kind": "request", "method": "GET", "path": "/api/posts/2/tags" },
      { "kind": "server", "text": "PostTagController가 postTagService.listTags(2)를 부르고, PostTagService가 읽기 트랜잭션 안에서 태그를 응답 DTO로 변환한다" },
      { "kind": "db", "sql": "SELECT t.* FROM tag t JOIN post_tag pt ON pt.tag_id=t.id WHERE pt.post_id=2" },
      { "kind": "response", "status": 200, "body": "[{\"name\":\"java\"},{\"name\":\"jpa\"}]" },
      { "kind": "screen", "text": "화면의 태그 칩이 응답 배열로 갱신된다", "focus": ["tags"] }
    ]
  }]
}
```

## 만들 것

| 항목 | 계약 |
|---|---|
| 메서드·경로 | `GET /api/posts/{postId}/tags` |
| 응답 | `200`, `[{"name":"java"},{"name":"jpa"}]`처럼 태그 이름만 담긴 JSON 배열 |
| 태그 없음 | `200`, 빈 배열 `[]` |
| 글 없음·삭제·비공개 | `404`, 글 정보나 태그를 노출하지 않는다 |
| 구현 경계 | Controller는 HTTP, Service는 조회·공개 여부·변환, Repository는 글 조회를 맡는다 |

## 먼저 읽기: 꺾쇠 괄호의 타입

`List<Tag>`는 `Tag` 여러 개를 담는 목록이다. 여기서 `<Tag>`의 `Tag`가 목록 안에 들어갈 타입이다. `List<String>`은 문자열 목록이다. 이처럼 컨테이너가 안에 들어갈 타입을 받아 여러 타입에 재사용되는 방식이 **제네릭**이다.

기존 코드에도 이미 같은 문법이 있다.

```java
JpaRepository<Post, Long> // Post 행을 다루며 ID 타입은 Long
Optional<Post>            // Post가 있거나 없을 수 있음
List<String>              // 문자열 여러 개
```

이번 응답은 `ResponseEntity<List<TagResponse>>`다. 바깥 `ResponseEntity`는 HTTP 응답을, 안쪽 `List<TagResponse>`는 JSON 배열의 원소 타입을 나타낸다. `TagResponse`를 명시하므로 `Tag` 엔티티 전체나 내부 DB 필드를 API에 그대로 내보내지 않는다.

## 구현 가이드

먼저 이름 하나를 DTO로 바꾸는 함수를 읽고, 그다음 목록의 각 원소에 같은 변환을 적용한다.

<details>
<summary>응답 DTO — 엔티티 대신 이름만 내보내기</summary>

```java
package org.example.post;

public record TagResponse(String name) {
}
```

</details>

<details>
<summary>PostTagService — Stream map으로 타입 변환하기</summary>

```java
@Transactional(readOnly = true)
public List<TagResponse> listTags(Long postId) {
    Post post = postRepository.findById(postId)
            .filter(found -> found.getDeletedAt() == null
                    && "PUBLISHED".equals(found.getStatus())
                    && "PUBLIC".equals(found.getVisibility()))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

    return post.getTags().stream()
            .map(tag -> new TagResponse(tag.getName()))
            .toList();
}
```

`stream()`은 컬렉션의 원소들을 차례로 처리할 흐름을 만든다. `map`은 원소 하나를 다른 값으로 바꾸므로 `Tag`가 `TagResponse`가 된다. 마지막 `toList()`가 변환 결과를 `List<TagResponse>`로 모은다. 빈 `Set`이면 자연스럽게 빈 목록이 나온다. 트랜잭션 안에서 지연 로딩되는 태그도 읽는다.

`map(TagResponse::new)`로 줄여 쓸 수도 있지만, 첫 학습에서는 `tag.getName()`이 DTO 생성자에 들어가는 모습을 보이도록 람다를 쓴다.

</details>

<details>
<summary>PostTagController — 반환 타입에서 제네릭 읽기</summary>

```java
@GetMapping("/{postId}/tags")
public ResponseEntity<List<TagResponse>> listTags(@PathVariable Long postId) {
    return ResponseEntity.ok(postTagService.listTags(postId));
}
```

`List`와 `TagResponse`, `GetMapping`, `PathVariable`을 import한다. 컨트롤러는 DB나 태그 변환을 직접 처리하지 않는다.

</details>

## 직접 확인

먼저 기존 공개 글(기본 데이터의 ID `2`)에 태그가 있는지 화면과 DB에서 확인한다. 빈 목록 응답도 확인하려면 1-3의 글 생성 API로 공개 글을 하나 만들 때 `tags: []`를 보내고, 응답의 `id`를 아래 실행 요청의 `{{taglessPostId}}` 자리에 바꿔 넣은 뒤 전체 실행한다.

```bash
BASE=http://localhost:8080
curl -i "$BASE/api/posts/2/tags"
curl -i "$BASE/api/posts/{{taglessPostId}}/tags"
curl -i "$BASE/api/posts/999999/tags"
```

실제 DB에서 글 ID 2의 태그는 `post_tag`와 `tag`를 JOIN해 확인한다. 태그 없는 공개 글을 하나 만들고 그 글의 ID로 다시 요청하면 `[]`가 나와야 한다.

```sql
SELECT t.name
FROM post_tag pt
JOIN tag t ON t.id = pt.tag_id
WHERE pt.post_id = 2
ORDER BY t.name;
```

```check
{
  "requests": [
    { "id": "A", "title": "공개 글의 태그", "method": "GET", "path": "/api/posts/2/tags" },
    { "id": "B", "title": "태그 없는 공개 글", "method": "GET", "path": "/api/posts/{{taglessPostId}}/tags" },
    { "id": "C", "title": "없는 글", "method": "GET", "path": "/api/posts/999999/tags" }
  ],
  "checks": [
    { "id": "C1", "request": "A", "expect": { "status": 200, "json": [
      { "path": "$", "type": "array", "length": 2 },
      { "path": "$[0].name", "type": "string" },
      { "path": "$[1].name", "type": "string" }
    ] } },
    { "id": "C2", "request": "B", "expect": { "status": 200, "json": [
      { "path": "$", "type": "array", "length": 0 }
    ] } },
    { "id": "C3", "request": "C", "expect": { "status": 404 } }
  ]
}
```

## 채점 기준

| # | 방법 | 기대 |
|---|---|---|
| C1 | 공개 글의 태그 목록 요청 | `200`, 원소가 `{ "name": "..." }` 모양인 JSON 배열 |
| C2 | 태그 없는 공개 글 | `200`, `[]` |
| C3 | 존재하지 않는 글 | `404`, 태그 정보를 반환하지 않음 |
| R1 | 코드 리뷰 | 반환 타입이 `List<TagResponse>`이며 엔티티를 직접 반환하지 않음 |
| R2 | 코드 리뷰 | Stream `map`이 `Tag`를 `TagResponse`로 바꾸고 `toList()`가 결과 목록을 만듦 |
| R3 | 설명 | `ResponseEntity<List<TagResponse>>`에서 두 제네릭 타입의 역할을 말함 |

비공개·삭제된 글도 같은 `404` 규칙을 따른다. 이 둘은 공개 데이터 상태를 바꾸어 별도로 확인할 수 있지만, 위 실행 칸의 C3 요청은 존재하지 않는 글만 자동 검사한다.

## 다음 단계

[2-1. 게시글 단건 조회](../ch2-read-post/2-1-get-one.md) — 태그만 따로 읽는 API에서 글 상세 응답을 읽는 API로 넓힌다.
