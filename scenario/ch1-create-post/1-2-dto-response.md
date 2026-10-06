# 1-2. DTO로 응답하기 — 201과 Location

## 상황

> "저장되면 만든 글 정보를 그대로 돌려주세요. 화면에 바로 띄우게요. 새 글 주소도 알려 주시고요."

`success` 대신 **만든 글을 JSON으로** 돌려준다. "새로 만들어졌다"는 뜻의 상태 코드와, 새 글의 주소를 알려 주는 헤더도 붙인다. 아직 DB는 없으니 글은 메모리에만 둔다.

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `POST /api/posts` — 요청 본문은 1-1과 같다 |
| 응답 상태 | `201 Created` |
| 응답 헤더 | `Location: /api/posts/{id}` — 방금 만든 글의 주소 |
| 응답 본문 | 아래 JSON(`Content-Type: application/json`) |
| id | 메모리 카운터로 1부터 1씩 늘린다. 서버를 다시 켜면 1부터 다시 시작해도 된다 |

응답 본문:

```json
{
  "id": 1,
  "boardSlug": "dev",
  "title": "[채점] 첫 게시글",
  "content": "Spring Boot로 만든 첫 게시글입니다.",
  "tags": ["spring", "jpa"],
  "visibility": "PUBLIC",
  "createdAt": "2026-10-06T17:30:00"
}
```

- `id` — 숫자
- `createdAt` — 서버가 글을 만든 시각, ISO-8601 문자열(소수점 이하 초가 붙어도 된다)
- 나머지 필드 — 요청에서 받은 값 그대로

## 직접 확인

```bash
BASE=http://localhost:8080

# 요청 A — 정상 요청(두 번 보내서 id가 늘어나는지 본다)
curl -i -X POST "$BASE/api/posts" -H 'Content-Type: application/json' \
  -d '{"boardSlug":"dev","title":"[채점] 첫 게시글","content":"Spring Boot로 만든 첫 게시글입니다.","tags":["spring","jpa"],"visibility":"PUBLIC"}'

# 요청 B — 깨진 JSON
curl -i -X POST "$BASE/api/posts" -H 'Content-Type: application/json' -d '{"title": "[채점] 깨짐"'
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A | 상태 `201` |
| C2 | 요청 A | 응답 헤더 `Location`이 있고, `/api/posts/{응답 본문의 id}`로 끝난다(앞에 `http://호스트`가 붙어도 된다) |
| C3 | 요청 A | `Content-Type`이 `application/json`이고, 본문에 `id`(숫자)·`boardSlug`·`title`·`content`·`tags`(배열)·`visibility`·`createdAt`(ISO-8601 문자열) 7개 필드가 있다. `id`·`createdAt` 말고는 요청 값과 같다 |
| C4 | 요청 A를 한 번 더 | 두 번째 응답의 `id`가 첫 번째 응답의 `id`보다 정확히 1 크다 |
| C5 | 요청 B | 상태 `400` |
| R1 | 응답 객체 | 응답 전용 DTO(권장: `record`, 예: `PostResponse`)를 만든다. 요청 객체나 `Map`을 그대로 돌려주지 않는다 |
| R2 | 201·Location | `ResponseEntity.created(URI)`처럼 상태와 `Location`을 함께 정한다. 경로 문자열을 손으로 이어 붙이기보다 `UriComponentsBuilder` 등을 쓰면 더 좋다 |
| R3 | id 발급 | 요청이 동시에 들어와도 id가 겹치지 않는다(예: `AtomicLong`). 일반 `long` 필드에 `++`면 피드백한다 |
| R4 | 시각 | `createdAt`을 클라이언트가 아니라 서버가 정한다 |

## 필요한 지식

- [W09 DTO는 왜 쓰나](../../docs/knowledge/W09-why-dto.md) — 요청·응답 모양을 따로 두는 이유
- [S06 REST API 설계 — 메서드와 상태 코드](../../docs/knowledge/S06-rest-api-clients.md#메서드와-상태-코드) — 200과 201, `Location` 헤더
- [P16 — 날짜·시간은 "문자열"이 아니라 계약이다](../../docs/knowledge/P16-json-jackson-practical.md#26-날짜시간은-문자열이-아니라-계약이다) — `createdAt`이 JSON에서 어떻게 보이나
- [P16 — 생성 규칙: getter, 생성자, record](../../docs/knowledge/P16-json-jackson-practical.md#25-생성-규칙-getter-생성자-record) — `record`가 JSON으로 바뀌는 방식
- [P18 동시성 문제 실전](../../docs/knowledge/P18-concurrency-inventory.md) — 카운터가 겹치는 이유(R3)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 응답 DTO</summary>

`record PostResponse(Long id, String boardSlug, String title, String content, List<String> tags, String visibility, LocalDateTime createdAt)` 같은 모양이면 된다. Jackson이 필드 이름 그대로 JSON을 만든다.
</details>

<details>
<summary>힌트 2 — 201과 Location을 한 번에</summary>

반환 타입을 `ResponseEntity<PostResponse>`로 바꾸고 `ResponseEntity.created(위치 URI).body(응답)`. 위치 URI는 `"/api/posts/" + id`를 `URI.create(...)`로 만들어도 되고, `UriComponentsBuilder`를 매개변수로 받아 만들어도 된다.
</details>

<details>
<summary>힌트 3 — 메모리 저장</summary>

이 단계에서는 컨트롤러 안에 `AtomicLong` 카운터를 두어도 된다. 다음 단계(1-3)에서 서비스·저장소로 옮긴다.
</details>

## 다음 단계

[1-3. 서비스·저장소로 나누기](1-3-service-layer.md) — API는 그대로 두고 코드 구조만 나눈다.
