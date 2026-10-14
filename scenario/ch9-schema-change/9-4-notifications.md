# 9-4. 새 테이블과 API — 알림

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다.

## 상황

> "내 글에 좋아요나 댓글이 달리면 알림을 주세요. 안 읽은 알림 개수도 보여 주고, 누르면 읽음 처리요."

새 기능에는 새 테이블이 필요하다. 테이블을 마이그레이션으로 만들고, **기존 기능(좋아요·댓글)이 성공할 때 알림이 함께 생기게** 연결한다.

기존 기능을 건드리는 일이라 같은 알림이 두 번 생기면 안 된다. 이 단계는 알림을 좋아요·댓글과 **같은 트랜잭션에서 함께 저장**하는 것까지다 — 그래서 알림 저장이 실패하면 좋아요도 함께 되돌려진다. "알림이 실패해도 좋아요는 성공"으로 떼어 내는 일(커밋 뒤 이벤트·별도 트랜잭션·재시도)은 R1에서 차이를 설명하는 데까지만 보고, 구현은 다음 과제로 남긴다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "알림",
  "summary": "새 테이블(notification) + API. 좋아요·댓글이 '새로' 생길 때만 알림을 만든다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "알림",
      "right": "코딩하는고양이 · 🔔 2"
    },
    {
      "type": "list",
      "id": "noti",
      "items": [
        {
          "id": "n-comment",
          "title": "자바초보탈출님이 댓글을 남겼어요",
          "meta": "방금 전",
          "badge": "안 읽음"
        },
        {
          "id": "n-like",
          "title": "자바초보탈출님이 좋아요를 눌렀어요",
          "meta": "방금 전",
          "badge": "안 읽음"
        }
      ]
    },
    {
      "type": "stats",
      "id": "badge",
      "items": [
        {
          "id": "unread",
          "label": "안 읽은 알림",
          "value": "2"
        }
      ]
    }
  ],
  "flows": [
    {
      "name": "남이 내 글에 좋아요",
      "steps": [
        {
          "kind": "user",
          "text": "회원 3이 회원 2의 글(12번)에 하트를 누른다"
        },
        {
          "kind": "request",
          "method": "PUT",
          "path": "/api/posts/12/like",
          "headers": [
            "Authorization: Bearer tok-p03"
          ]
        },
        {
          "kind": "server",
          "text": "좋아요가 새로 생김 → 같은 트랜잭션의 동기 이벤트 리스너에서 알림 저장. 이미 좋아요였으면 알림도 없다"
        },
        {
          "kind": "db",
          "sql": "INSERT INTO post_like ...; INSERT INTO notification (member_id, actor_id, type, post_id, created_at) VALUES (2, 3, 'LIKE', 12, NOW())"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"liked\": true, ...}"
        },
        {
          "kind": "screen",
          "text": "회원 2의 종에 숫자가 붙는다",
          "focus": [
            "unread"
          ]
        }
      ]
    },
    {
      "name": "알림 열고 읽기",
      "steps": [
        {
          "kind": "user",
          "text": "회원 2가 종을 눌러 알림을 열고 하나를 누른다",
          "focus": [
            "noti"
          ]
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/me/notifications?size=20",
          "headers": [
            "Authorization: Bearer tok-p02"
          ]
        },
        {
          "kind": "db",
          "sql": "SELECT ... FROM notification WHERE member_id = 2 ORDER BY created_at DESC, id DESC LIMIT 20; SELECT COUNT(*) FROM notification WHERE member_id = 2 AND read_at IS NULL",
          "note": "(member_id, read_at, created_at, id) 인덱스"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"items\": [{\"type\": \"COMMENT\", ...}, {\"type\": \"LIKE\", ...}], \"unreadCount\": 2}"
        },
        {
          "kind": "request",
          "method": "PATCH",
          "path": "/api/me/notifications/31/read",
          "headers": [
            "Authorization: Bearer tok-p02"
          ]
        },
        {
          "kind": "response",
          "status": 204
        },
        {
          "kind": "screen",
          "text": "읽은 알림은 '안 읽음' 표시가 빠지고 숫자가 줄어든다",
          "focus": [
            "n-like",
            "unread"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

**V4** — `db/migration/V4__create_notification.sql`

| 컬럼 | 타입·규칙 |
|---|---|
| `id` | `BIGINT AUTO_INCREMENT PRIMARY KEY` |
| `member_id` | 알림을 받는 회원(글 작성자), FK → `member` |
| `actor_id` | 좋아요·댓글을 한 회원, FK → `member` |
| `type` | `VARCHAR(20)`, `CHECK (type IN ('LIKE', 'COMMENT'))` |
| `post_id` | FK → `post` |
| `comment_id` | 댓글 알림이면 그 댓글, 아니면 `NULL`(FK → `comment`) |
| `read_at` | 읽은 시각, 안 읽었으면 `NULL` |
| `created_at` | 만든 시각 |
| 인덱스 | `(member_id, read_at, created_at, id)` — "내 안 읽은 알림 최신순" 조회용 |

**알림이 생기는 때**

| 사건 | 알림 |
|---|---|
| 좋아요가 **새로** 생김(4-1 PUT에서 행이 추가될 때) | 글 작성자에게 `LIKE` |
| 이미 좋아요인데 또 PUT | 만들지 않는다 |
| 좋아요 취소 | 이미 만든 알림은 지우지 않는다 |
| 댓글·답글 작성(5장) | 글 작성자에게 `COMMENT`(`comment_id` 채움) |
| 자기 글에 자기가 댓글 | 만들지 않는다 |

**API** — 토큰 필요

| 메서드·경로 | 응답 |
|---|---|
| `GET /api/me/notifications?unreadOnly=false&size=20` | `200` `{ "items": [ { "id", "type", "actor": { "id", "nickname" }, "postId", "commentId", "read", "createdAt" } ], "unreadCount": 3 }` — 최신순 |
| `PATCH /api/me/notifications/{id}/read` | `204`. 남의 알림·없는 알림 `404` |

**필드 규칙** — 읽음 처리는 본문이 없다. 입력은 경로의 알림 id 하나다

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `{id}`(경로) | 필수 | — | — | 숫자 | — | 숫자가 아니면(`abc`) `400`, 없는 알림·남의 알림 `404` |
| 본문 | 없음 | — | — | — | — | 보내도 읽지 않는다 |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 좋아요가 새로 생기면 같은 트랜잭션의 동기 이벤트 리스너가 알림을 저장한다. 이미 좋아요였으면 알림도 없다. 알림 저장이 실패하면 좋아요와 숫자 증가도 롤백된다.
- (member_id, read_at, created_at, id) 인덱스

<details>
<summary>Controller — HTTP 연결</summary>

`NotificationController.java`. `GET`은 인증된 회원의 목록과 미읽음 개수를 반환하고, `PATCH`는 본문 없이 자신의 알림만 읽음 처리해 `204`를 반환한다.

```java
@GetMapping("/api/me/notifications")
public NotificationListResponse list(@RequestParam(defaultValue = "false") boolean unreadOnly,
                                     @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
                                     @LoginMember AuthenticatedMember me) {
    if (me == null) throw new AuthenticationRequiredException("인증이 필요합니다.");
    return notificationService.list(me, unreadOnly, size);
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`NotificationListResponse.java`, `NotificationResponse.java`. `items`와 `unreadCount`, 각 항목의 `actor`·`postId`·`commentId`·`read`를 화면 응답과 대조한다.

</details>

<details>
<summary>Service — 처리 순서</summary>

`LikeService`는 `INSERT IGNORE`가 실제 새 좋아요일 때만 이벤트를 발행한다. `CommentService`는 댓글 저장·개수 증가 뒤 이벤트를 발행한다.

`NotificationEventListener`의 `@EventListener`가 즉시 실행되고 `NotificationService.notifyLike/notifyComment`의 `Propagation.MANDATORY`가 기존 트랜잭션을 요구한다. 리스너가 예외를 삼키지 않으므로 알림 저장 실패 시 원래 작업도 롤백된다.

```java
if (inserted > 0) {
    postRepository.incrementLikeCount(postId);
    eventPublisher.publishEvent(new PostLikedEvent(postId, loginMember.id()));
}
```

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`NotificationRepository.java`. `findMine`은 `memberId`로 범위를 제한하고 `createdAt DESC, id DESC`로 정렬한다. `countByMember_IdAndReadAtIsNull`은 목록 크기와 별도로 미읽음 총수를 센다. `findByIdAndMember_Id`는 남의 알림 ID를 `404`로 처리할 조건이다.

</details>

<details>
<summary>MyBatis Mapper — 알림 저장·목록·읽음</summary>

`MyBatisNotificationMapper.java`와 `MyBatisNotificationMapper.xml`은 알림 테이블을 직접 읽고 쓴다. `MyBatisLikeService`와 `MyBatisCommentService`는 관계 행이 새로 생겼을 때만 동기 이벤트를 발행한다.

`NotificationService`가 Mapper로 `member_id`를 제한한 목록·미읽음 개수·소유자 확인 후 읽음 처리를 실행한다. 알림 생성의 예외가 원래 트랜잭션으로 전파되는지 확인한다. 이 대체 앱의 일부 선행 글 작성 기능은 JPA 경로를 계속 사용한다.

```xml
<select id="findMine" resultType="org.example.notification.NotificationRow">
    SELECT n.id, n.type, a.id AS actorId, a.nickname AS actorNickname,
           n.post_id AS postId, n.comment_id AS commentId,
           n.read_at AS readAt, n.created_at AS createdAt
    FROM notification n JOIN member a ON a.id = n.actor_id
    WHERE n.member_id = #{memberId}
    <if test="unreadOnly">AND n.read_at IS NULL</if>
    ORDER BY n.created_at DESC, n.id DESC
    LIMIT #{size}
</select>
```

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Notification.java`. `member`는 받는 회원, `actor`는 사건을 만든 회원이다. `markRead`는 이미 읽은 알림을 다시 눌러도 `readAt`을 덮어쓰지 않는다.

</details>

<details>
<summary>Flyway / SQL — 스키마 변경</summary>

`V4__create_notification.sql`. `member_id`·`actor_id`·`post_id`·`comment_id`의 외래키와 `type` 제약, `(member_id, read_at, created_at, id)` 인덱스를 확인한다.

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`ApiExceptionHandler.java`, `NotificationNotFoundException.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handleNotificationNotFound`.

</details>

<details>
<summary>설정·보조 코드</summary>

`CommentCreatedEvent.java`, `PostLikedEvent.java`는 사건의 ID만 전달한다. `NotificationEventListener.java`의 `@EventListener`는 발행한 트랜잭션 안에서 동기로 실행된다. 커밋 뒤 알림은 R1에서 비교할 다음 과제다.

```java
@EventListener
public void onPostLiked(PostLikedEvent event) {
    notificationService.notifyLike(event.postId(), event.actorId());
}
```

</details>

<details>
<summary>테스트 — 계약 확인</summary>

`LikeServiceTest.java`는 새 좋아요와 중복 PUT의 발행 횟수를 확인한다. `NotificationRollbackIntegrationTest.java`는 알림 저장 예외를 주입한 뒤 좋아요 행과 `like_count`가 둘 다 0으로 롤백됐는지 실제 MySQL에서 확인한다.

</details>

## 직접 확인

학습용 DB의 12번 글은 회원 2가 썼다. 회원 3(`tok-p03`)이 좋아요와 댓글을 단다.

알림 행 수는 DB에서 비교한다. 먼저 아래 SQL로 현재 수를 기록하고, 실행 패널에서 Y0~Y3을 순서대로 보낸 뒤 같은 SQL을 다시 실행한다. Y1은 알림을 추가하고 Y2는 중복 알림을 만들지 않으며 Y3은 댓글 알림을 추가해야 한다. 나머지 Y4~Y7·V1~V2 요청은 실행 패널에서 확인한다. API 주소는 페이지 상단 공통 입력을 사용하고 Postman 설정은 접어서 확인할 수 있다.

API 서버 주소는 페이지 상단 공통 입력에서 설정한다. 먼저 아래 SQL로 현재 수를 기록하고, 실행 패널에서 Y0~Y3을 순서대로 보낸 뒤 같은 SQL을 다시 실행한다. Y1은 알림을 추가하고 Y2는 중복 알림을 만들지 않으며 Y3은 댓글 알림을 추가해야 한다. 나머지 Y4~Y7·V1~V2 요청은 실행 패널에서 확인한다. Postman 설정은 접어서 볼 수 있다.

```bash
cnt() { docker compose exec -T mysql mysql -ucommunity -pcommunity practice -N -e "SELECT COUNT(*) FROM notification WHERE member_id = 2" 2>/dev/null; }
cnt  # Y0~Y3 요청 전
# 실행 패널에서 Y0~Y3을 순서대로 보낸 다음 다시 실행한다.
cnt  # 요청 후
```

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "Y0",
      "title": "처음 상태로(회원 3의 좋아요 취소)",
      "method": "DELETE",
      "path": "/api/posts/12/like",
      "headers": {
        "Authorization": "Bearer tok-p03"
      }
    },
    {
      "id": "Y1",
      "title": "회원 3이 좋아요",
      "method": "PUT",
      "path": "/api/posts/12/like",
      "headers": {
        "Authorization": "Bearer tok-p03"
      }
    },
    {
      "id": "Y2",
      "title": "또 좋아요",
      "method": "PUT",
      "path": "/api/posts/12/like",
      "headers": {
        "Authorization": "Bearer tok-p03"
      }
    },
    {
      "id": "Y3",
      "title": "회원 3이 댓글",
      "method": "POST",
      "path": "/api/posts/12/comments",
      "headers": {
        "Authorization": "Bearer tok-p03"
      },
      "body": {
        "content": "[채점] 알림 확인 댓글"
      }
    },
    {
      "id": "Y4",
      "title": "회원 2의 알림(size=2)",
      "method": "GET",
      "path": "/api/me/notifications?size=2",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "N",
      "title": "최신 알림 id",
      "method": "GET",
      "path": "/api/me/notifications?size=1",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "Y5",
      "title": "남의 알림 읽음(회원 5)",
      "method": "PATCH",
      "path": "/api/me/notifications/{{N.body.items[0].id}}/read",
      "headers": {
        "Authorization": "Bearer tok-p05"
      }
    },
    {
      "id": "Y6",
      "title": "내 알림 읽음",
      "method": "PATCH",
      "path": "/api/me/notifications/{{N.body.items[0].id}}/read",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "V1",
      "title": "V1 알림 id가 숫자가 아님",
      "method": "PATCH",
      "path": "/api/me/notifications/abc/read",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "V2",
      "title": "V2 없는 알림",
      "method": "PATCH",
      "path": "/api/me/notifications/999999/read",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "Y7",
      "title": "안 읽은 알림",
      "method": "GET",
      "path": "/api/me/notifications?unreadOnly=true&size=50",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "Y4",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items[0].type",
            "equals": "COMMENT"
          },
          {
            "path": "$.items[0].actor.id",
            "equals": 3
          },
          {
            "path": "$.items[0].postId",
            "equals": 12
          },
          {
            "path": "$.items[1].type",
            "equals": "LIKE"
          },
          {
            "path": "$.unreadCount",
            "gte": 2
          }
        ]
      }
    },
    {
      "id": "C2",
      "all": [
        {
          "request": "Y5",
          "expect": {
            "status": 404
          }
        },
        {
          "request": "Y6",
          "expect": {
            "status": 204
          }
        }
      ]
    },
    {
      "id": "C3",
      "all": [
        {
          "request": "N",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items[0].id",
                "type": "number"
              }
            ]
          }
        },
        {
          "request": "Y7",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.items",
                "type": "array"
              },
              {
                "path": "$.items[*].id",
                "notContains": "{{N.body.items[0].id}}"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C4",
      "all": [
        {
          "request": "V1",
          "expect": {
            "status": 400
          }
        },
        {
          "request": "V2",
          "expect": {
            "status": 404,
            "headers": {
              "Content-Type": {
                "contains": "application/problem+json"
              }
            }
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
| D1 | Y1 **전** `SELECT COUNT(*) FROM notification WHERE member_id = 2` | 값 n을 기억 |
| D2 | Y3 뒤 같은 쿼리 | n+2 — 좋아요 1, 댓글 1(Y2는 알림을 만들지 않았다) |
| D3 | `SELECT type, actor_id, post_id, comment_id IS NOT NULL FROM notification WHERE member_id = 2 ORDER BY id DESC LIMIT 2` | `COMMENT, 3, 12, 1` / `LIKE, 3, 12, 0` |
| D4 | `SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = 'practice' AND table_name = 'notification' AND column_name = 'read_at'` | `1` 이상 — 안 읽은 알림 조회용 인덱스에 `read_at`이 들어 있다 |
| C1 | Y4 | `200`, 첫 항목 `type`=`COMMENT`·`actor.id`=3·`postId`=12, 둘째 항목 `type`=`LIKE`, `unreadCount` ≥ 2 |
| C2 | Y5 / Y6 | `404` / `204` |
| C3 | Y7 | `False` — 읽은 알림은 안 읽은 목록에서 빠진다 |
| C4 | V1 / V2 | 경로 `abc` `400` / 없는 알림 `404`(`application/problem+json`) — `500`이 아니다 |
| R1 | 연결 방식 | 이번 구현의 동기 `@EventListener`는 알림 실패 시 좋아요도 되돌린다. 커밋 뒤 `@TransactionalEventListener(AFTER_COMMIT)`와 별도 트랜잭션으로 떼면 무엇이 달라지는지 설명할 수 있다 |
| R2 | 중복 없음 | "새로 생겼을 때만" 알림을 만든다 — 4-1의 멱등 판단 결과를 재사용한다 |
| R3 | 소유자 | 읽음 처리가 "내 알림인가"를 확인한다(IDOR) |
| R4 | 개수 | `unreadCount`를 목록을 다 읽어 세지 않고 `COUNT` 쿼리(인덱스 사용)로 구한다 |

## 필요한 지식

- [S08 — 이벤트와 커밋의 관계](../../docs/knowledge/S08-transactions.md#이벤트와-커밋의-관계)
- [W14 동기 vs 비동기, 블로킹 vs 논블로킹](../../docs/knowledge/W14-sync-async-blocking.md)
- [R03 스키마와 테이블 설계 — PK·FK·제약](../../docs/knowledge/R03-schema-types-constraints.md)
- [D11 — IDOR 방어](../../docs/knowledge/D11-web-security-basics.md#41-안전한-sql-바인딩과-idor-방어를-먼저-설계하기)

## 다음 단계

[9-5. 서비스를 멈추지 않는 이름 변경](9-5-expand-contract.md)
