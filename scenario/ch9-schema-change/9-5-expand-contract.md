# 9-5. 서비스를 멈추지 않는 이름 변경 — expand와 contract

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다.
>
> 9장 마이그레이션은 앱이 붙는 DB마다 돈다. 기본 프로파일로 한 번 띄우면 시나리오 DB(`community`)도 V6까지 올라가 `bookmark.memo`가 사라진다 — 그 뒤 6장 결과 테스트를 다시 돌리면 D 쿼리의 `memo`를 `note`로 읽는다(API의 `memo` 필드는 그대로).

## 상황

> "`bookmark.memo` 컬럼 이름을 `note`로 바꾸기로 했어요. 근데 서버를 멈출 수는 없어요."

`ALTER TABLE … RENAME COLUMN` 한 줄이면 이름은 바뀐다. 문제는 **배포하는 동안** 생긴다. 서버가 여러 대면 새 코드와 옛 코드가 잠깐 함께 돈다. 이름을 바꾸는 순간 옛 서버는 `memo`를 찾다가 전부 실패한다.

그래서 이름 변경을 **넓히기(expand) → 옮기기 → 좁히기(contract)** 로 나눠 배포한다. 그리고 바깥 계약(API JSON의 `memo` 필드)은 바뀌지 않는다는 것도 확인한다. 컬럼 이름과 API 필드 이름은 다른 것이다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "북마크 메모 — 이름 변경 배포 중",
  "summary": "컬럼 memo를 note로 바꾼다. 배포 중에는 옛 서버와 새 서버가 함께 돌아도 깨지면 안 된다. API 필드 이름(memo)은 그대로.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "북마크 메모",
      "right": "회원 10"
    },
    {
      "type": "field",
      "id": "memo",
      "label": "메모",
      "value": "[채점] 이름 변경 뒤"
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        {
          "id": "save",
          "label": "저장",
          "variant": "primary"
        }
      ]
    },
    {
      "type": "code",
      "id": "phases",
      "label": "배포 단계",
      "value": "1. 넓히기  V5: note 추가 + memo 값 복사\n2. 양쪽 쓰기: 새 코드는 memo·note 둘 다 씀, 읽기는 아직 memo\n3. 맞추기: 바이트가 다른 행 전부 note = memo, 그다음 읽기를 note로\n4. 좁히기: memo 안 쓰는 코드를 모든 서버에 → 그다음 V6에서 memo 삭제"
    }
  ],
  "flows": [
    {
      "name": "배포 중(옛 서버·새 서버가 함께 돈다)",
      "steps": [
        {
          "kind": "user",
          "text": "메모를 고쳐 저장한다",
          "focus": [
            "memo",
            "save"
          ]
        },
        {
          "kind": "request",
          "method": "PUT",
          "path": "/api/posts/2/bookmark",
          "headers": [
            "Content-Type: application/json",
            "Authorization: Bearer tok-p10"
          ],
          "body": "{\"memo\": \"[채점] 이름 변경 뒤\"}"
        },
        {
          "kind": "server",
          "text": "요청이 새 서버로 가면 memo·note 둘 다 쓰고, 옛 서버로 가면 memo에만 쓴다 — 둘 다 성공한다"
        },
        {
          "kind": "db",
          "sql": "UPDATE bookmark SET memo = ?, note = ? WHERE member_id = 10 AND post_id = 2"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"bookmarkId\": …, \"memo\": \"[채점] 이름 변경 뒤\"}"
        },
        {
          "kind": "screen",
          "text": "사용자는 아무것도 못 느낀다",
          "focus": [
            "memo",
            "phases"
          ]
        }
      ]
    },
    {
      "name": "좁히기 뒤",
      "steps": [
        {
          "kind": "user",
          "text": "배포가 끝난 뒤 다시 저장한다",
          "focus": [
            "save"
          ]
        },
        {
          "kind": "request",
          "method": "PUT",
          "path": "/api/posts/2/bookmark",
          "headers": [
            "Content-Type: application/json",
            "Authorization: Bearer tok-p10"
          ],
          "body": "{\"memo\": \"[채점] 이름 변경 뒤\"}"
        },
        {
          "kind": "db",
          "sql": "UPDATE bookmark SET note = ? WHERE member_id = 10 AND post_id = 2",
          "note": "memo 컬럼은 없다"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"memo\": \"[채점] 이름 변경 뒤\"}"
        },
        {
          "kind": "screen",
          "text": "API 필드 이름은 여전히 memo — DTO와 컬럼을 분리해 둔 덕분",
          "focus": [
            "phases"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

| 순서 | 마이그레이션·코드 | 그 시점에 옛 서버는? |
|---|---|---|
| 1. 넓히기 | `V5__add_bookmark_note.sql` — `note VARCHAR(200) NULL` 추가 + `UPDATE bookmark SET note = memo` | `memo`만 읽고 쓴다 — 문제없음 |
| 2. 양쪽 쓰기 | 코드: 쓸 때 `memo`와 `note`에 **둘 다** 쓴다. 읽기는 **아직 `memo`** — 옛 서버가 `memo`에만 쓰는 동안은 `memo`가 정본이다 | 옛 서버가 `memo`만 고쳐도 새 서버가 `memo`를 읽으니 최신 값이 보인다 |
| 3. 맞추고 읽기 전환 | 모든 서버가 2의 코드가 된 뒤: `UPDATE bookmark SET note = memo WHERE NOT (CAST(note AS BINARY) <=> CAST(memo AS BINARY))` — 옛 서버가 **고친 값·지운 값(null)·대소문자만 바꾼 값까지** 맞춘다. 그다음 읽기를 `note`로 바꾼다(쓰기는 둘 다 유지 — 되돌릴 수 있게) | 옛 서버 없음 |
| 4. 좁히기 | (a) `memo`를 읽지도 쓰지도 않는 코드(매핑 제거)를 **모든 서버에** 배포한다 → (b) 그다음 `ALTER TABLE bookmark DROP COLUMN memo` | 없음 — (a) 전에 지우면 아직 `memo`에 쓰는 서버가 실패한다 |

왜 3의 조건이 `note IS NULL`이 아닌가: V5가 이미 `note`를 채웠기 때문에, 그 뒤 옛 서버가 `memo`를 **고친** 행은 `note`가 null이 아니라 옛 값이다. `note IS NULL`로는 그 행을 못 잡고, 2에서 읽기를 `note`로 먼저 바꿨다면 사용자는 고치기 전 메모를 보게 된다.

`<=>`는 null까지 같다고 보는 비교다. 그리고 `CAST(… AS BINARY)`로 **바이트 그대로** 비교한다 — 이 테이블의 기본 비교 규칙(`utf8mb4_0900_ai_ci`)은 대소문자·악센트를 무시해서 `'ABC' <=> 'abc'`가 참이다. 그냥 비교하면 옛 서버가 `ABC`를 `abc`로만 고친 행을 놓쳐, DROP 뒤 그 수정이 사라진다(실측).

실제 여러 대 배포라면 3과 4는 서로 다른 배포다(맞추기 마이그레이션 → 지우기 마이그레이션). 실습은 서버가 한 대라 3의 UPDATE와 4의 DROP을 `V6__drop_bookmark_memo.sql` 한 파일에 **UPDATE 먼저** 넣고, 그 V6과 함께 `memo` 매핑을 지운 코드를 띄운다(서버가 한 대면 4-(a)와 (b)가 같은 순간이다). 다만 **V5와 V6은 반드시 따로**(한 파일에 합치지 않는다) 두고, 2의 코드가 V6 전에도 동작하게 만든다.

**여러 서버의 운영 배포에는 이 실습용 최종 artifact를 그대로 첫 서버에 올리지 않는다.** 여기에 V6이 들어 있어 Flyway가 첫 서버 기동 때 `memo`를 삭제하고, 남은 중간 서버가 실패하기 때문이다. 운영에서는 (1) V5만 적용 → (2) `memo` 읽기·양쪽 쓰기 코드를 모든 서버에 배포 → (3) 마지막 옛 서버가 사라진 뒤 `note = memo` 맞추기 마이그레이션을 **별도 버전**으로 적용 → (4) `note` 읽기·양쪽 쓰기 코드를 모든 서버에 배포 → (5) `note`만 읽고 쓰는 코드를 모든 서버에 배포 → (6) 마지막에 `DROP memo`만 담은 마이그레이션을 적용한다.

5의 서버가 이미 `note`만 고쳤다면 6에서 `note = memo`를 다시 실행하면 안 된다. 실습용 V6의 UPDATE와 DROP은 운영 마이그레이션 두 파일로 나눠야 한다.

- API(6-1·6-3)의 JSON 필드 이름은 계속 `memo`다.

**필드 규칙** — API 입력은 6-1 그대로다(`memo` 0~200자). 컬럼이 바뀌어도 규칙이 그대로 지켜지는지 본다 — 새 컬럼 `note`가 `VARCHAR(200)`보다 좁으면 200자 메모가 `500`이 된다

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `memo` | 선택 | 생략·`null`이면 메모 없음 | 0~200자(정확히 200자는 성공, 201자는 거절) | 문자열 | `null` | `400`, `errors`에 `memo` |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 요청이 새 서버로 가면 memo·note 둘 다 쓰고, 옛 서버로 가면 memo에만 쓴다 — 둘 다 성공한다
- memo 컬럼은 없다

<details>
<summary>Controller · DTO — API의 memo 계약</summary>

6-1의 `BookmarkController`와 `BookmarkRequest`·`BookmarkResponse`는 그대로 쓴다. 컬럼이 바뀌어도 요청·응답 필드 이름은 `memo`다.

```java
@PutMapping("/api/posts/{id}/bookmark")
public BookmarkResponse bookmark(@PathVariable Long id,
        @LoginMember AuthenticatedMember member, @RequestBody(required = false) JsonNode json) {
    return bookmarkService.bookmark(id, member, BookmarkRequest.from(json));
}
// BookmarkRequest.from: memo가 문자열이 아니거나 200자를 넘으면
// new InvalidBookmarkFieldException("memo", ...) → 400
// BookmarkResponse(..., String memo): 응답 키도 memo
```

</details>

<details>
<summary>Service — 처리 순서</summary>

`BookmarkService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

```java
@Transactional
public BookmarkResponse bookmark(Long postId, AuthenticatedMember member, BookmarkRequest request) {
    Post post = findBookmarkablePost(postId, member);
    BookmarkFolder folder = findMyFolder(request.folderId(), member.id());
    bookmarkRepository.upsert(member.id(), postId,
            folder == null ? null : folder.getId(), request.memo());
    Bookmark saved = bookmarkRepository.findCurrentForUpdate(member.id(), postId).orElseThrow();
    return toResponse(saved); // getNote()를 응답 DTO의 memo 자리에 넣는다
}
```

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Bookmark.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다. 변경된 메서드: `change`.

```java
@Column(length = 200)
private String note; // V6 뒤에는 memo 컬럼이 없다

public void changeMemo(String memo, LocalDateTime now) {
    this.note = memo;
    this.updatedAt = now;
}
```

</details>

<details>
<summary>Repository / JPA — 최종 note 컬럼에 쓰기</summary>

`BookmarkRepository.java`의 native upsert와 잠금 조회가 최종 스키마를 따른다. `:memo`는 Java 매개변수 이름이고 SQL 컬럼은 `note`다.

```sql
INSERT INTO bookmark(member_id, post_id, folder_id, note, created_at, updated_at)
VALUES (:memberId, :postId, :folderId, :memo, NOW(), NOW())
ON DUPLICATE KEY UPDATE folder_id = VALUES(folder_id), note = VALUES(note), updated_at = NOW();
SELECT * FROM bookmark WHERE member_id = :memberId AND post_id = :postId FOR UPDATE;
```

</details>

<details>
<summary>Flyway / SQL — 스키마 변경</summary>

`V5__add_bookmark_note.sql`, `V6__drop_bookmark_memo.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.

```sql
-- V5: 기존 서버와 함께 돌아갈 수 있는 넓히기
ALTER TABLE bookmark ADD COLUMN note VARCHAR(200) NULL AFTER memo;
UPDATE bookmark SET note = memo;

-- V6: 옛 서버가 사라진 뒤 변경분을 다시 복사하고 좁히기
UPDATE bookmark SET note = memo
WHERE NOT (CAST(note AS BINARY) <=> CAST(memo AS BINARY));
ALTER TABLE bookmark DROP COLUMN memo;
```

실제 여러 서버에 배포할 때는 V5 뒤 **중간 버전**을 먼저 배포한다. 중간 버전은 `memo`를 읽고 `memo`·`note`에 함께 쓴다.

`Bookmark`에는 두 필드를 매핑하고, `changeMemo`는 둘 다 갱신하며, 응답은 아직 `getMemo()`로 만든다. native upsert와 PATCH처럼 엔티티 변경을 거치지 않는 경로도 모두 양쪽에 쓴다.

위 운영 순서대로 마지막 옛 서버가 사라진 뒤 값을 맞추고 `note` 읽기·양쪽 쓰기 버전을 거쳐 최종 `note` 전용 버전으로 간다. 실습의 최종 답안은 V6 뒤 소스이므로 중간 버전의 Java 파일은 별도 코드 접기에 보인다.

```sql
-- 중간 버전의 양쪽 쓰기: 읽기는 여전히 memo
INSERT INTO bookmark(member_id, post_id, folder_id, memo, note, created_at, updated_at)
VALUES (:memberId, :postId, :folderId, :memo, :memo, NOW(), NOW())
ON DUPLICATE KEY UPDATE folder_id = VALUES(folder_id), memo = VALUES(memo),
                        note = VALUES(note), updated_at = NOW();

-- insertIfAbsent: 새 행에 둘 다 쓰고, 기존 행은 그대로 둔다
INSERT INTO bookmark(member_id, post_id, folder_id, memo, note, created_at, updated_at)
VALUES (:memberId, :postId, :folderId, :memo, :memo, NOW(), NOW())
ON DUPLICATE KEY UPDATE id = id;

-- PATCH /api/posts/{id}/bookmark: 생략이면 UPDATE하지 않고, null이면 둘 다 NULL
UPDATE bookmark SET memo = :memo, note = :memo, updated_at = NOW()
WHERE member_id = :memberId AND post_id = :postId;

-- 과도기 조회와 응답은 memo를 정본으로 삼는다
SELECT id, folder_id, memo FROM bookmark
WHERE member_id = :memberId AND post_id = :postId FOR UPDATE;
```

</details>

<details>
<summary>MyBatis / Mapper · SQL — 같은 컬럼 전환</summary>

MyBatis 대체 앱에서는 `MyBatisBookmarkService`가 `BookmarkRequest.memo()`를 `BookmarkInsertRow.memo`로 넘기고 Mapper XML이 `note`에 저장한다. 조회는 `note AS memo`로 매핑해 Java 응답 필드를 유지한다. 좋아요·댓글·알림은 MyBatis 경로이며 일부 선행 글 작성은 JPA 경로가 남아 있다.

아래는 **최종 실습 소스**다. 여러 서버의 V5 배포에서는 별도 단계 접기의 `MyBatisBookmarkMapper.xml`처럼 `upsert`와 `updateMemo`가 `memo`·`note`를 함께 쓰고, 첫 버전은 `memo`를 읽는다. 별도 정합화 V6 뒤에는 `note AS memo`로 읽기를 전환하되 양쪽 쓰기를 계속한다. 마지막 서버까지 최종 `note` 전용 코드로 바뀐 뒤에만 V7의 `DROP memo`를 실행한다.

```xml
<select id="findBookmark" resultType="org.example.bookmark.BookmarkRow">
    SELECT id, folder_id, note AS memo FROM bookmark
    WHERE member_id = #{memberId} AND post_id = #{postId} FOR UPDATE
</select>
<insert id="upsert" parameterType="org.example.bookmark.BookmarkInsertRow">
    INSERT INTO bookmark(member_id, post_id, folder_id, note, created_at, updated_at)
    VALUES (#{memberId}, #{postId}, #{folderId}, #{memo}, #{at}, #{at})
    ON DUPLICATE KEY UPDATE folder_id = VALUES(folder_id), note = VALUES(note), updated_at = NOW()
</insert>
```

</details>

## 직접 확인

학습용 DB에는 메모가 있는 북마크가 51개 있다. 9번 북마크(회원 10)의 메모는 `예제 따라 해 보기`.

```bash
BASE=http://localhost:8080
T='Authorization: Bearer tok-p10'; J='Content-Type: application/json'
curl -s -H "$T" "$BASE/api/me/bookmarks?size=100" | python3 -c 'import sys,json; print([(i["bookmarkId"], i["memo"]) for i in json.load(sys.stdin)["items"] if i["bookmarkId"] == 9])'   # Q1
curl -s -o /dev/null -w '%{http_code}\n' -X PUT "$BASE/api/posts/2/bookmark" -H "$T" -H "$J" -d "{\"memo\":\"[채점] 경계-$(printf '노%.0s' $(seq 1 193))\"}"   # V1 201자 → 400
curl -s -o /dev/null -w '%{http_code}\n' -X PUT "$BASE/api/posts/2/bookmark" -H "$T" -H "$J" -d "{\"memo\":\"[채점] 경계-$(printf '노%.0s' $(seq 1 192))\"}"   # V2 200자 → 200
curl -s -X PUT "$BASE/api/posts/2/bookmark" -H "$T" -H "$J" -d '{"memo":"[채점] 이름 변경 뒤"}'; echo                                                                    # Q2
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "Q1",
      "title": "회원 10의 북마크(size=100)",
      "method": "GET",
      "path": "/api/me/bookmarks?size=100",
      "headers": {
        "Authorization": "Bearer tok-p10"
      }
    },
    {
      "id": "V1",
      "title": "V1 메모 201자",
      "method": "PUT",
      "path": "/api/posts/2/bookmark",
      "headers": {
        "Authorization": "Bearer tok-p10"
      },
      "body": {
        "memo": "[채점] 경계-노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노"
      }
    },
    {
      "id": "V2",
      "title": "V2 메모 정확히 200자(통과)",
      "method": "PUT",
      "path": "/api/posts/2/bookmark",
      "headers": {
        "Authorization": "Bearer tok-p10"
      },
      "body": {
        "memo": "[채점] 경계-노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노"
      }
    },
    {
      "id": "Q2",
      "title": "메모 쓰기",
      "method": "PUT",
      "path": "/api/posts/2/bookmark",
      "headers": {
        "Authorization": "Bearer tok-p10"
      },
      "body": {
        "memo": "[채점] 이름 변경 뒤"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "Q1",
      "expect": {
        "status": 200,
        "anyOf": [
          {
            "json": [
              {
                "path": "$.items[0].bookmarkId",
                "equals": 9
              },
              {
                "path": "$.items[0].memo",
                "equals": "예제 따라 해 보기"
              }
            ]
          },
          {
            "json": [
              {
                "path": "$.items[1].bookmarkId",
                "equals": 9
              },
              {
                "path": "$.items[1].memo",
                "equals": "예제 따라 해 보기"
              }
            ]
          },
          {
            "json": [
              {
                "path": "$.items[2].bookmarkId",
                "equals": 9
              },
              {
                "path": "$.items[2].memo",
                "equals": "예제 따라 해 보기"
              }
            ]
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "Q2",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.memo",
            "equals": "[채점] 이름 변경 뒤"
          }
        ]
      }
    },
    {
      "id": "C3",
      "all": [
        {
          "request": "V1",
          "expect": {
            "status": 400,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            },
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "memo"
              }
            ]
          }
        },
        {
          "request": "V2",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.memo",
                "equals": "[채점] 경계-노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노노"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| D1 | `SELECT GROUP_CONCAT(column_name ORDER BY column_name) FROM information_schema.columns WHERE table_schema = 'practice' AND table_name = 'bookmark' AND column_name IN ('memo', 'note')` | `note` — `memo`는 없다 |
| D2 | `SELECT note FROM bookmark WHERE id = 9` | `예제 따라 해 보기` — 옛 값이 옮겨졌다 |
| D3 | `SELECT COUNT(*) FROM bookmark WHERE note IS NOT NULL` | `51` 이상 |
| D4 | `SELECT GROUP_CONCAT(version ORDER BY installed_rank) FROM flyway_schema_history WHERE success = 1` | `1,2,3,4,5,6`(앞에 `1`은 기준선) — V5·V6이 따로 있다 |
| C1 | Q1 | `[(9, '예제 따라 해 보기')]` — API 필드 이름은 여전히 `memo` |
| C2 | Q2 | `200`, `memo`=`[채점] 이름 변경 뒤` |
| C3 | V1 / V2 | 메모 201자 `400`(`errors`에 `memo`) / 정확히 200자 `200` — 새 컬럼 `note`에도 200자가 들어간다(Q2보다 먼저 보내므로 D5는 Q2 값) |
| D5 | Q2 뒤 `SELECT note FROM bookmark WHERE member_id = 10 AND post_id = 2` | `[채점] 이름 변경 뒤` |
| R1 | 단계 이유 | 한 번에 이름을 바꾸면 배포 중에 무엇이 깨지는지, 각 단계가 그걸 어떻게 막는지 설명할 수 있다 |
| R2 | 양쪽 쓰기 흔적 | 2단계(양쪽 쓰기) 코드를 거쳤다는 것이 커밋 기록이나 설명으로 남아 있다(바로 4단계로 건너뛰지 않았다) |
| R3 | 계약 분리 | DTO 필드(`memo`)와 엔티티 컬럼(`note`)이 분리되어 있어서 API 사용자는 아무것도 바꿀 필요가 없다 |
| R4 | 되돌리기 | 4단계(DROP) 뒤에는 데이터 없이 되돌릴 수 없다는 것과, 그 전에 백업·확인을 하는 이유를 안다 |
| R5 | 맞추기 조건 | 2단계에서 읽기는 `memo`를 유지했고, 3단계 UPDATE가 `note IS NULL`이 아니라 값이 다른 행 전체(`NOT (CAST(note AS BINARY) <=> CAST(memo AS BINARY))`)를 맞추는 이유(옛 서버가 고친·지운 값, 대소문자만 바꾼 값)와 DROP 전에 `memo`를 안 쓰는 코드가 모든 서버에 깔려야 하는 이유를 설명한다 |

## 필요한 지식

- [S11 캐시·Redis·DB 마이그레이션](../../docs/knowledge/S11-cache-redis-migration.md)
- [D06 배포 개념](../../docs/knowledge/D06-deployment-concepts.md) — 무중단 배포(롤링)
- [W09 DTO는 왜 쓰나](../../docs/knowledge/W09-why-dto.md) — 저장 구조와 API 계약 분리
- [R07 백업과 복원](../../docs/knowledge/R07-backup-restore.md)

## 다음 단계

끝. 9장까지 오면 API를 만들고, 쿼리를 키우고, 데이터가 이미 있는 DB의 구조를 안전하게 바꾸는 데까지 해 본 것이다.
