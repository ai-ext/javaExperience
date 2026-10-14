# 6-2. 폴더 — 최대 10개, 이름 중복 불가

## 상황

> "북마크를 폴더로 정리하고 싶어요. 폴더는 10개까지, 같은 이름은 못 만들게요. 폴더를 지우면 안에 있던 북마크는 지우지 말고 기본 폴더로 옮겨 주세요."

규칙이 여럿인 작은 CRUD다. **한도·중복·소유자 확인**을 각각 어디서 어떻게 막을지가 핵심이다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "북마크 폴더 관리",
  "summary": "폴더는 10개까지, 이름은 겹치면 안 된다. 폴더를 지우면 안의 북마크는 기본 폴더로 옮긴다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "북마크 폴더",
      "right": "이스프링"
    },
    {
      "type": "list",
      "id": "folders",
      "items": [
        {
          "id": "f11",
          "title": "스프링 공부",
          "meta": "북마크 2개"
        },
        {
          "id": "f12",
          "title": "나중에 읽기",
          "meta": "북마크 2개"
        }
      ]
    },
    {
      "type": "field",
      "id": "new-name",
      "label": "새 폴더 이름",
      "value": "스프링 공부",
      "error": "이미 있는 이름이에요"
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        {
          "id": "create",
          "label": "만들기",
          "variant": "primary"
        },
        {
          "id": "delete",
          "label": "폴더 삭제",
          "variant": "danger"
        }
      ]
    }
  ],
  "flows": [
    {
      "name": "폴더 목록",
      "steps": [
        {
          "kind": "user",
          "text": "북마크 폴더 화면을 연다"
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/me/bookmark-folders",
          "headers": [
            "Authorization: Bearer tok-lee"
          ]
        },
        {
          "kind": "db",
          "sql": "SELECT f.id, f.name, COUNT(b.id) FROM bookmark_folder f LEFT JOIN bookmark b ON b.folder_id = f.id WHERE f.member_id = 3 GROUP BY f.id, f.name ORDER BY f.created_at, f.id"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "[{\"id\": 11, \"name\": \"스프링 공부\", \"bookmarkCount\": 2}, {\"id\": 12, \"name\": \"나중에 읽기\", \"bookmarkCount\": 2}]"
        },
        {
          "kind": "screen",
          "text": "폴더와 개수",
          "focus": [
            "folders"
          ]
        }
      ]
    },
    {
      "name": "같은 이름으로 만들기",
      "steps": [
        {
          "kind": "user",
          "text": "'스프링 공부'를 또 만든다",
          "focus": [
            "new-name",
            "create"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/me/bookmark-folders",
          "headers": [
            "Content-Type: application/json",
            "Authorization: Bearer tok-lee"
          ],
          "body": "{\"name\": \"스프링 공부\"}"
        },
        {
          "kind": "server",
          "text": "서비스가 먼저 확인해도, 동시에 두 요청이 오면 DB의 UNIQUE(member_id, name)가 막는다 → 그 예외를 409로"
        },
        {
          "kind": "response",
          "status": 409,
          "headers": [
            "Content-Type: application/problem+json"
          ]
        },
        {
          "kind": "screen",
          "text": "'이미 있는 이름이에요'",
          "focus": [
            "new-name"
          ]
        }
      ]
    },
    {
      "name": "폴더 지우기",
      "steps": [
        {
          "kind": "user",
          "text": "'나중에 읽기' 폴더를 지운다",
          "focus": [
            "f12",
            "delete"
          ]
        },
        {
          "kind": "request",
          "method": "DELETE",
          "path": "/api/me/bookmark-folders/12",
          "headers": [
            "Authorization: Bearer tok-lee"
          ]
        },
        {
          "kind": "db",
          "sql": "UPDATE bookmark SET folder_id = NULL WHERE folder_id = 12",
          "note": "북마크는 지우지 않고 기본 폴더로 — 한 번의 UPDATE"
        },
        {
          "kind": "db",
          "sql": "DELETE FROM bookmark_folder WHERE id = 12"
        },
        {
          "kind": "response",
          "status": 204
        },
        {
          "kind": "screen",
          "text": "폴더가 사라지고, 안의 북마크는 '기본' 폴더에서 보인다",
          "focus": [
            "folders"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

| 메서드·경로 | 의미 | 성공 응답 |
|---|---|---|
| `GET /api/me/bookmark-folders` | 내 폴더 목록(만든 순) | `200` `[ { "id": 11, "name": "스프링 공부", "bookmarkCount": 2 } ]` |
| `POST /api/me/bookmark-folders` | 만들기 `{ "name": "..." }` | `201`, `Location: /api/me/bookmark-folders/{id}`, `{ "id", "name" }` |
| `PATCH /api/me/bookmark-folders/{id}` | 이름 바꾸기 `{ "name": "..." }` | `200` `{ "id", "name" }` |
| `DELETE /api/me/bookmark-folders/{id}` | 지우기 — 안의 북마크는 기본 폴더(`folder_id = NULL`)로 옮긴다 | `204` |
| `PATCH /api/me/bookmarks/{bookmarkId}` | 북마크를 다른 폴더로 `{ "folderId": 12 }`(`null`이면 기본 폴더) | `200` 6-1의 JSON |

| 상황 | 결과 |
|---|---|
| 이름이 비었거나 50자 초과(앞뒤 공백은 잘라서 판단) | `400` |
| 내 폴더 중 같은 이름이 이미 있음 | `409` |
| 폴더가 이미 10개인데 또 만들기 | `400` |
| 남의 폴더·남의 북마크, 없는 id | `404` |
| 토큰 없음 | `401` |

**필드 규칙** — 잘못된 입력은 저장 전에 막고 `500`이 나면 안 된다

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `name`(만들기·이름 바꾸기) | 필수 | 안 됨 — 없음·`null`·`""`·공백만 거절 | 앞뒤 공백을 자른 뒤 1~50자(자른 뒤 정확히 50자는 성공, 51자는 거절) | JSON 문자열(숫자·불리언은 거절) | 없음 | `400`(이 정답은 `detail`만 담고 `errors`는 없다) |
| `folderId`(북마크 옮기기) | 선택 | 생략·`null`이면 기본 폴더 | 내 폴더 id | 양의 정수(문자열 숫자·소수는 거절) | `null` | 형식이 틀리면 `400`, 남의 폴더·없는 폴더 `404` |
| `{id}`·`{bookmarkId}`(경로) | 필수 | — | — | 숫자 | — | 숫자가 아니면 `400`, 남의 것·없는 id `404` |
| 본문 전체 | 필수 | — | — | JSON | — | JSON이 아니면 `400` |

모든 API에 토큰이 필요하다.

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 서비스가 먼저 확인해도, 동시에 두 요청이 오면 DB의 UNIQUE(member_id, name)가 막는다 → 그 예외를 409로
- 북마크는 지우지 않고 기본 폴더로 — 한 번의 UPDATE

<details>
<summary>Controller — HTTP 연결</summary>

`BookmarkController.java`, `BookmarkFolderController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다.

이번 단계 매핑: `@PatchMapping("/api/me/bookmarks/{bookmarkId}")`, `@RequestMapping("/api/me/bookmark-folders")`, `@GetMapping`. 변경된 메서드: `move`, `list`, `create`, `rename`.

```java
@PostMapping
public ResponseEntity<BookmarkFolderResponse> create(@LoginMember AuthenticatedMember me,
                                                       @RequestBody JsonNode request) {
    BookmarkFolderResponse created = folderService.create(me, BookmarkFolderRequest.from(request));
    return ResponseEntity.created(URI.create("/api/me/bookmark-folders/" + created.id())).body(created);
}
```

`GET`은 읽기 요청이지만 내 자료이므로 토큰이 없으면 `AuthenticationRequiredException`으로 `401`을 돌린다.

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`BookmarkFolderRequest.java`, `BookmarkFolderResponse.java`, `BookmarkFolderSummaryResponse.java`, `BookmarkMoveRequest.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다. Controller는 `JsonNode`를 받은 뒤 `from`에서 타입을 검사한다.

```java
public record BookmarkFolderRequest(String name) {
    public static BookmarkFolderRequest from(JsonNode body) {
        if (body == null || !body.isObject() || body.get("name") == null
                || !body.get("name").isTextual()) {
            throw new InvalidBookmarkFolderException("폴더 이름은 문자열이어야 합니다.");
        }
        return new BookmarkFolderRequest(body.get("name").asText());
    }
}
public record BookmarkFolderSummaryResponse(Long id, String name, long bookmarkCount) {}
public record BookmarkMoveRequest(Long folderId) {
    public static BookmarkMoveRequest from(JsonNode body) {
        if (body == null || !body.isObject()) {
            throw new InvalidBookmarkFieldException("body", "JSON 객체를 보내 주세요.");
        }
        JsonNode folder = body.get("folderId");
        if (folder == null || folder.isNull()) return new BookmarkMoveRequest(null);
        if (!folder.isIntegralNumber() || !folder.canConvertToLong() || folder.longValue() <= 0) {
            throw new InvalidBookmarkFieldException("folderId", "폴더 ID는 양의 정수여야 합니다.");
        }
        return new BookmarkMoveRequest(folder.asLong());
    }
}
```

`BookmarkFolderRequest.from`은 `name`이 JSON 문자열인지, `BookmarkMoveRequest.from`은 `folderId`가 양의 정수인지 먼저 검사한다. 이름은 서비스에서 앞뒤 공백을 자른 뒤 검사한다. 북마크 이동 응답은 6-1의 `BookmarkResponse`를 그대로 쓴다.

</details>

<details>
<summary>Service — 처리 순서</summary>

`BookmarkFolderService.java`, `BookmarkService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `list`, `create`, `rename`, `delete`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

```java
@Transactional
public void delete(AuthenticatedMember me, Long folderId) {
    BookmarkFolder folder = findMine(folderId, me.id());
    bookmarkRepository.moveAllToDefaultFolder(folder.getId());
    folderRepository.delete(folder);
}
```

생성은 `normalizeName` → `MemberRepository.findByIdForUpdate`로 회원 행 잠금 → 내 폴더 수 10개 미만 확인 → 같은 이름 확인 → 저장 순서다. 서로 다른 이름의 동시 생성도 잠금 뒤 차례로 수를 읽어 최대 10개를 지킨다. 이름 바꾸기는 폴더 소유권과 중복 이름을 확인한다. 이동은 북마크와 목적지 폴더 모두 내 것인지 확인한다.

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`BookmarkFolderRepository.java`, `BookmarkRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다. 직접 작성한 JPQL·SQL과 아래 파일의 `@Query`를 비교한다.

```java
@Modifying
@Query("UPDATE Bookmark b SET b.folder = null WHERE b.folder.id = :folderId")
int moveAllToDefaultFolder(@Param("folderId") Long folderId);
```

폴더별 북마크 수는 `findSummaries`의 JPQL 한 번으로 읽고, `findByIdAndMember_Id`로 소유권을 제한한다. 폴더 삭제 시 위 UPDATE와 폴더 DELETE가 같은 트랜잭션이다.

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Bookmark.java`, `BookmarkFolder.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다. 변경된 메서드: `moveTo`, `rename`.

`BookmarkFolder`는 `(member_id, name)` 유일 제약을 전제로 한다. `Bookmark.moveTo`는 `folder_id`를 바꾸고 `updated_at`을 갱신한다.

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`BookmarkNotFoundException.java`, `DuplicateBookmarkFolderNameException.java`, `InvalidBookmarkFolderException.java`, `ApiExceptionHandler.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handleBookmarkNotFound`, `handleInvalidBookmarkFolder`, `handleDuplicateBookmarkFolderName`.

```java
// 저장 시점의 UNIQUE(member_id, name) 충돌도 409로 바꾼다.
try {
    return folderRepository.saveAndFlush(folder);
} catch (DataIntegrityViolationException e) {
    throw new DuplicateBookmarkFolderNameException();
}
```

이름 공백·길이·10개 한도는 `400`, 중복 이름은 `409`, 남의 폴더나 북마크는 `404`로 매핑한다.

</details>

<details>
<summary>MyBatis — 폴더 목록·생성·이동·삭제 SQL</summary>

MyBatis 대체 코드 토글의 `MyBatisBookmarkFolderService`와 Mapper XML을 펼쳐 JPA 경로와 비교한다.

```xml
<select id="findSummaries" resultType="org.example.bookmark.BookmarkFolderSummaryResponse">
    SELECT f.id, f.name, COUNT(b.id) AS bookmarkCount
    FROM bookmark_folder f LEFT JOIN bookmark b ON b.folder_id = f.id
    WHERE f.member_id = #{memberId}
    GROUP BY f.id, f.name, f.created_at
    ORDER BY f.created_at ASC, f.id ASC
</select>
<update id="moveAllToDefault">
    UPDATE bookmark SET folder_id = NULL, updated_at = NOW()
    WHERE folder_id = #{folderId} AND member_id = #{memberId}
</update>
```

생성은 `SELECT id FROM member WHERE id = #{memberId} FOR UPDATE`로 회원 행을 잠근 뒤 개수를 센다. 생성·이름 변경·삭제 SQL도 `member_id`를 조건에 포함한다. 삭제 트랜잭션은 북마크를 기본 폴더로 옮긴 뒤 폴더 행을 지운다.

</details>

## 직접 확인

이스프링은 폴더 2개("스프링 공부" 11번·"나중에 읽기" 12번), 박디비는 폴더 10개(한도)를 가지고 있다.

```bash
BASE=http://localhost:8080
K='Authorization: Bearer tok-kimjava'; L='Authorization: Bearer tok-lee'; P='Authorization: Bearer tok-park'
J='Content-Type: application/json'
jid() { python3 -c 'import sys,json; print(json.load(sys.stdin)["'"${1:-id}"'"])'; }
NAME="[채점] 폴더 $(date +%H%M%S)"

curl -s -H "$L" "$BASE/api/me/bookmark-folders"; echo                                                     # F1
curl -i -X POST "$BASE/api/me/bookmark-folders" -H "$P" -H "$J" -d '{"name":"[채점] 열한 번째"}'           # F2 한도
FID=$(curl -s -X POST "$BASE/api/me/bookmark-folders" -H "$K" -H "$J" -d "{\"name\":\"$NAME\"}" | jid)     # F3
curl -i -X POST "$BASE/api/me/bookmark-folders" -H "$K" -H "$J" -d "{\"name\":\"$NAME\"}"                 # F4 같은 이름
curl -i -X PATCH "$BASE/api/me/bookmark-folders/11" -H "$K" -H "$J" -d '{"name":"[채점] 남의 폴더"}'      # F5
BID=$(curl -s -X PUT "$BASE/api/posts/3/bookmark" -H "$K" -H "$J" -d '{}' | jid bookmarkId)               # F6
curl -s -X PATCH "$BASE/api/me/bookmarks/$BID" -H "$K" -H "$J" -d "{\"folderId\":$FID}"; echo             # F7 폴더로 옮기기
curl -i -X DELETE "$BASE/api/me/bookmark-folders/$FID" -H "$K"                                            # F8 폴더 지우기
curl -i -X PATCH "$BASE/api/me/bookmarks/1" -H "$K" -H "$J" -d '{"folderId":null}'                        # F9 남의 북마크

# 잘못된 입력 — 500이 아니다
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/me/bookmark-folders" -H "$K" -H "$J" -d '{"name":"   "}'      # V4 400
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/me/bookmark-folders" -H "$K" -H "$J" -d '{"name":null}'       # V2 400
N50="[채점]$(printf '폴%.0s' $(seq 1 46))"   # 정확히 50자
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/me/bookmark-folders" -H "$K" -H "$J" -d "{\"name\":\"${N50}x\"}"   # V5 51자 400
B1=$(curl -s -X POST "$BASE/api/me/bookmark-folders" -H "$K" -H "$J" -d "{\"name\":\"  $N50  \"}" | jid)               # B1 201
curl -s -o /dev/null -w '%{http_code}\n' -X PATCH "$BASE/api/me/bookmark-folders/$B1" -H "$K" -H "$J" -d '{"name":"   "}'  # V7 400
curl -s -o /dev/null -w '%{http_code}\n' -X PATCH "$BASE/api/me/bookmarks/$BID" -H "$K" -H "$J" -d '{"folderId":"abc"}'   # V12 400
curl -s -o /dev/null -w '%{http_code}\n' -X DELETE "$BASE/api/me/bookmark-folders/$B1" -H "$K"                              # B2 204
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "F1",
      "title": "이스프링의 폴더 목록",
      "method": "GET",
      "path": "/api/me/bookmark-folders",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "F2",
      "title": "박디비의 열한 번째 폴더(한도)",
      "method": "POST",
      "path": "/api/me/bookmark-folders",
      "headers": {
        "Authorization": "Bearer tok-park"
      },
      "body": {
        "name": "[채점] 열한 번째"
      }
    },
    {
      "id": "F0",
      "title": "김자바의 폴더 수(새 폴더 이름 끝에 붙인다 — 다시 눌러도 이름이 겹치지 않게)",
      "method": "GET",
      "path": "/api/me/bookmark-folders",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "F3",
      "title": "폴더 만들기",
      "method": "POST",
      "path": "/api/me/bookmark-folders",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "name": "[채점] 폴더 확인 {{F0.body.length}}"
      }
    },
    {
      "id": "F4",
      "title": "같은 이름으로 또",
      "method": "POST",
      "path": "/api/me/bookmark-folders",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "name": "[채점] 폴더 확인 {{F0.body.length}}"
      }
    },
    {
      "id": "F5",
      "title": "남의 폴더 이름 바꾸기",
      "method": "PATCH",
      "path": "/api/me/bookmark-folders/11",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "name": "[채점] 남의 폴더"
      }
    },
    {
      "id": "F6",
      "title": "3번 글 북마크",
      "method": "PUT",
      "path": "/api/posts/3/bookmark",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {}
    },
    {
      "id": "F7",
      "title": "북마크를 새 폴더로 옮기기",
      "method": "PATCH",
      "path": "/api/me/bookmarks/{{F6.body.bookmarkId}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "folderId": "{{F3.body.id}}"
      }
    },
    {
      "id": "F8",
      "title": "폴더 지우기",
      "method": "DELETE",
      "path": "/api/me/bookmark-folders/{{F3.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "F9",
      "title": "남의 북마크 옮기기",
      "method": "PATCH",
      "path": "/api/me/bookmarks/1",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "folderId": null
      }
    },
    {
      "id": "V1",
      "title": "V1 이름 없음",
      "method": "POST",
      "path": "/api/me/bookmark-folders",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {}
    },
    {
      "id": "V2",
      "title": "V2 이름 null",
      "method": "POST",
      "path": "/api/me/bookmark-folders",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "name": null
      }
    },
    {
      "id": "V3",
      "title": "V3 빈 이름",
      "method": "POST",
      "path": "/api/me/bookmark-folders",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "name": ""
      }
    },
    {
      "id": "V4",
      "title": "V4 공백만",
      "method": "POST",
      "path": "/api/me/bookmark-folders",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "name": "   "
      }
    },
    {
      "id": "V5",
      "title": "V5 51자",
      "method": "POST",
      "path": "/api/me/bookmark-folders",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "name": "[채점]폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴x"
      }
    },
    {
      "id": "V6",
      "title": "V6 깨진 JSON",
      "method": "POST",
      "path": "/api/me/bookmark-folders",
      "headers": {
        "Authorization": "Bearer tok-kimjava",
        "Content-Type": "application/json"
      },
      "body": "{\"name\":"
    },
    {
      "id": "B1",
      "title": "B1 앞뒤 공백 + 50자(통과)",
      "method": "POST",
      "path": "/api/me/bookmark-folders",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "name": "  [채점]폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴  "
      }
    },
    {
      "id": "V7",
      "title": "V7 이름 바꾸기 — 공백만",
      "method": "PATCH",
      "path": "/api/me/bookmark-folders/{{B1.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "name": "   "
      }
    },
    {
      "id": "V8",
      "title": "V8 이름 바꾸기 — 51자",
      "method": "PATCH",
      "path": "/api/me/bookmark-folders/{{B1.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "name": "[채점]폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴x"
      }
    },
    {
      "id": "V9",
      "title": "V9 이름 바꾸기 — null",
      "method": "PATCH",
      "path": "/api/me/bookmark-folders/{{B1.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "name": null
      }
    },
    {
      "id": "V10",
      "title": "V10 폴더 경로 id가 숫자가 아님",
      "method": "PATCH",
      "path": "/api/me/bookmark-folders/abc",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "name": "[채점] 숫자 아님"
      }
    },
    {
      "id": "V11",
      "title": "V11 없는 폴더 이름 바꾸기",
      "method": "PATCH",
      "path": "/api/me/bookmark-folders/999999",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "name": "[채점] 없는 폴더"
      }
    },
    {
      "id": "V12",
      "title": "V12 북마크 옮기기 — folderId가 숫자가 아님",
      "method": "PATCH",
      "path": "/api/me/bookmarks/{{F6.body.bookmarkId}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "folderId": "abc"
      }
    },
    {
      "id": "V13",
      "title": "V13 북마크 옮기기 — 없는 폴더",
      "method": "PATCH",
      "path": "/api/me/bookmarks/{{F6.body.bookmarkId}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "folderId": 999999
      }
    },
    {
      "id": "V14",
      "title": "V14 북마크 경로 id가 숫자가 아님",
      "method": "PATCH",
      "path": "/api/me/bookmarks/abc",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "folderId": null
      }
    },
    {
      "id": "B2",
      "title": "B2 경계값 폴더 지우기(정리)",
      "method": "DELETE",
      "path": "/api/me/bookmark-folders/{{B1.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "V15",
      "title": "V15 name 숫자",
      "method": "POST",
      "path": "/api/me/bookmark-folders",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "name": 123
      }
    },
    {
      "id": "V16",
      "title": "V16 name 불리언",
      "method": "POST",
      "path": "/api/me/bookmark-folders",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "name": true
      }
    },
    {
      "id": "V17",
      "title": "V17 folderId 문자열 숫자",
      "method": "PATCH",
      "path": "/api/me/bookmarks/{{F6.body.bookmarkId}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "folderId": "11"
      }
    },
    {
      "id": "V18",
      "title": "V18 folderId 소수",
      "method": "PATCH",
      "path": "/api/me/bookmarks/{{F6.body.bookmarkId}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "folderId": 11.5
      }
    },
    {
      "id": "V19",
      "title": "V19 이름 변경 name 숫자",
      "method": "PATCH",
      "path": "/api/me/bookmark-folders/11",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "name": 123
      }
    },
    {
      "id": "V20",
      "title": "V20 Long 범위 초과 folderId",
      "method": "PATCH",
      "path": "/api/me/bookmarks/{{F6.body.bookmarkId}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava",
        "Content-Type": "application/json"
      },
      "body": "{\"folderId\":9223372036854775808}"
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "F1",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$[*].id",
            "equals": [
              11,
              12
            ]
          },
          {
            "path": "$[*].name",
            "equals": [
              "스프링 공부",
              "나중에 읽기"
            ]
          },
          {
            "path": "$[*].bookmarkCount",
            "equals": [
              2,
              2
            ]
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "F2",
      "expect": {
        "status": 400
      }
    },
    {
      "id": "C3",
      "all": [
        {
          "request": "F3",
          "expect": {
            "status": 201,
            "headers": {
              "Location": {
                "present": true
              }
            }
          }
        },
        {
          "request": "F4",
          "expect": {
            "status": 409
          }
        }
      ],
      "note": "폴더 이름 끝에 그때의 폴더 수(F0)를 붙인다 — 도중에 멈춰 폴더가 남아도 다음 실행은 새 이름으로 만든다. 남은 폴더가 10개(한도)가 되면 F3이 400이 되니 그때는 직접 지운다"
    },
    {
      "id": "C4",
      "request": "F5",
      "expect": {
        "status": 404
      }
    },
    {
      "id": "C5",
      "request": "F7",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.folderId",
            "equals": "{{F3.body.id}}"
          }
        ]
      }
    },
    {
      "id": "C6",
      "request": "F8",
      "expect": {
        "status": 204
      }
    },
    {
      "id": "C7",
      "request": "F9",
      "expect": {
        "status": 404
      }
    },
    {
      "id": "C8",
      "all": [
        {
          "request": "V1",
          "expect": {
            "status": 400,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            }
          }
        },
        {
          "request": "V2",
          "expect": {
            "status": 400,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            }
          }
        },
        {
          "request": "V3",
          "expect": {
            "status": 400,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            }
          }
        },
        {
          "request": "V4",
          "expect": {
            "status": 400,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            }
          }
        },
        {
          "request": "V5",
          "expect": {
            "status": 400,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            }
          }
        },
        {
          "request": "V6",
          "expect": {
            "status": 400,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            }
          }
        }
      ]
    },
    {
      "id": "C9",
      "all": [
        {
          "request": "B1",
          "expect": {
            "status": 201,
            "json": [
              {
                "path": "$.name",
                "equals": "[채점]폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴폴"
              }
            ]
          }
        },
        {
          "request": "B2",
          "expect": {
            "status": 204
          }
        }
      ]
    },
    {
      "id": "C10",
      "all": [
        {
          "request": "V7",
          "expect": {
            "status": 400,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            }
          }
        },
        {
          "request": "V8",
          "expect": {
            "status": 400,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            }
          }
        },
        {
          "request": "V9",
          "expect": {
            "status": 400,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            }
          }
        },
        {
          "request": "V10",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "V11",
          "expect": {
            "status": 404,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            }
          }
        },
        {
          "request": "V12",
          "expect": {
            "status": 400,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            }
          }
        },
        {
          "request": "V13",
          "expect": {
            "status": 404,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            }
          }
        },
        {
          "request": "V14",
          "expect": {
            "status": 400
          }
        }
      ]
    },
    {
      "id": "C11",
      "all": [
        {
          "request": "V15",
          "expect": {
            "status": 400,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            }
          }
        },
        {
          "request": "V16",
          "expect": {
            "status": 400,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            }
          }
        },
        {
          "request": "V17",
          "expect": {
            "status": 400,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            }
          }
        },
        {
          "request": "V18",
          "expect": {
            "status": 400,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            }
          }
        },
        {
          "request": "V19",
          "expect": {
            "status": 400,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            }
          }
        }
      ]
    },
    {
      "id": "C12",
      "request": "V20",
      "expect": {
        "status": 400,
        "headers": {
          "Content-Type": {
            "contains": "application/problem+json"
          }
        }
      }
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). `{FID}`·`{BID}`는 F3·F6 응답의 id다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | F1 | `200`, `[{11, "스프링 공부", 2}, {12, "나중에 읽기", 2}]` 순서 |
| C2 | F2 | `400` — 박디비는 이미 10개 |
| C3 | F3 / F4 | `201`(`Location` 있음) / `409` |
| C4 | F5 | `404` |
| C5 | F7 | `200`, `folderId`={FID} |
| C6 | F8 | `204` |
| D1 | F8 뒤 `SELECT folder_id FROM bookmark WHERE id = {BID}` | `NULL` — 기본 폴더로 옮겨졌다 |
| D2 | F8 뒤 `SELECT COUNT(*) FROM bookmark_folder WHERE id = {FID}` | `0` |
| C7 | F9 | `404` |
| C8 | V1~V6 | 이름 없음·`null`·빈 문자열·공백만·51자·깨진 JSON 모두 `400`, `application/problem+json` — `500`이 아니다 |
| C9 | B1 / B2 | 앞뒤 공백을 붙인 50자 이름은 `201`이고 `name`은 자른 50자 — 경계 바로 안쪽은 통과 / 만든 폴더는 지운다 `204`(다시 실행해도 409가 나지 않게) |
| C10 | V7~V9 / V10·V11 / V12~V14 | 이름 바꾸기도 공백만·51자·`null`은 `400` / 폴더 경로 `abc` `400`, 없는 폴더 `404` / 북마크 옮기기 `folderId` `"abc"` `400`, 없는 폴더 `404`, 북마크 경로 `abc` `400` — 어느 것도 `500`이 아니다 |
| D3 | `SELECT COUNT(*) FROM bookmark_folder WHERE member_id = 4` | `10` — 한도 초과 요청이 아무것도 만들지 않았다 |
| C11 | V15~V19 | 이름 숫자·불리언, 이동 대상 폴더의 문자열 숫자·소수, 이름 변경 숫자는 모두 `400` — Jackson의 타입 변환에 맡기지 않는다 |
| C12 | V20 | Long 범위 초과 `folderId`는 `400` — `500`이 아니다 |
| R1 | 중복 이름 | 서비스에서 먼저 확인하더라도, 동시에 두 요청이 오면 DB의 UNIQUE(`member_id, name`)가 막는다는 것을 알고 그 예외를 409로 바꾼다 |
| R2 | 한도 | 회원 행 잠금 뒤 개수를 세므로 같은 회원의 동시 생성도 10개를 넘지 않는지 설명하고 실행해 확인한다 |
| R3 | 폴더 삭제 | 북마크 옮기기와 폴더 삭제가 한 트랜잭션이다. 옮기기는 북마크마다가 아니라 UPDATE 한 번으로 한다 |
| R4 | 소유자 | 모든 폴더·북마크 조회가 "내 것" 조건을 포함한다 |

## 필요한 지식

- [W10 — 서비스와 DB: 안내 검사와 최종 고유성](../../docs/knowledge/W10-where-to-validate.md#53-서비스와-db-안내-검사와-최종-고유성) — 409를 어디서 만드나
- [W10 — 중복 검사와 경쟁 조건](../../docs/knowledge/W10-where-to-validate.md#중복-검사와-경쟁-조건)
- [D11 — IDOR 방어](../../docs/knowledge/D11-web-security-basics.md#41-안전한-sql-바인딩과-idor-방어를-먼저-설계하기)
- [W08 예외는 어디서 잡나](../../docs/knowledge/W08-where-to-handle-exceptions.md) — `DataIntegrityViolationException`을 409로

## 다음 단계

[6-3. 내 북마크 목록](6-3-my-bookmarks.md)
