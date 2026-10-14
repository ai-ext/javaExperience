# 3-2. 삭제 — soft delete

## 상황

> "삭제 버튼 누르면 글이 없어져야 해요. 근데 운영팀이 신고 처리하려면 지운 글도 남아 있어야 한대요."

행을 진짜로 지우지 않고 **"지웠다"는 표시만 남긴다**(soft delete). 그러면 사용자에게는 사라진 것처럼 보이고, 운영팀은 기록을 볼 수 있다. 달려 있던 좋아요·댓글 행도 그대로 남는다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글 삭제",
  "summary": "사용자에게는 사라지고, DB에는 남는다(deleted_at). 운영자도 지울 수 있다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "글 보기",
      "right": "김자바"
    },
    {
      "type": "text",
      "id": "post-title",
      "value": "[채점] 삭제용",
      "emphasis": "title"
    },
    {
      "type": "actions",
      "id": "menu",
      "items": [
        {
          "id": "edit",
          "label": "수정",
          "variant": "secondary"
        },
        {
          "id": "delete",
          "label": "삭제",
          "variant": "danger"
        }
      ]
    },
    {
      "type": "toast",
      "id": "toast",
      "value": "글을 삭제했어요",
      "tone": "success"
    },
    {
      "type": "text",
      "id": "not-found",
      "value": "글을 찾을 수 없어요",
      "emphasis": "body",
      "tone": "muted"
    }
  ],
  "flows": [
    {
      "name": "내 글 삭제",
      "steps": [
        {
          "kind": "user",
          "text": "[삭제] → 확인 창에서 [삭제]를 누른다",
          "focus": [
            "delete"
          ]
        },
        {
          "kind": "request",
          "method": "DELETE",
          "path": "/api/posts/23",
          "headers": [
            "Authorization: Bearer tok-kimjava"
          ]
        },
        {
          "kind": "server",
          "text": "작성자 또는 운영자인지 확인 → deleted_at만 채운다. 좋아요·댓글 행은 그대로"
        },
        {
          "kind": "db",
          "sql": "UPDATE post SET deleted_at = NOW(), updated_at = NOW() WHERE id = 23"
        },
        {
          "kind": "response",
          "status": 204
        },
        {
          "kind": "screen",
          "text": "204는 본문이 없다 — 목록으로 돌아가며 '삭제했어요'",
          "focus": [
            "toast"
          ]
        }
      ]
    },
    {
      "name": "지운 글 링크를 다시 열기",
      "steps": [
        {
          "kind": "user",
          "text": "뒤로 가기로 지운 글 주소에 다시 들어온다"
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/posts/23"
        },
        {
          "kind": "server",
          "text": "2-3 규칙 1번: 삭제된 글은 아무도 못 본다(작성자도)"
        },
        {
          "kind": "response",
          "status": 404
        },
        {
          "kind": "screen",
          "text": "'글을 찾을 수 없어요'",
          "focus": [
            "not-found"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 메서드·경로 | `DELETE /api/posts/{id}` |
| 인증 | 필요 |
| 지울 수 있는 사람 | 작성자, 또는 운영자(`ADMIN`) |
| 응답 | `204 No Content`(본문 없음) |
| 저장 | `post.deleted_at`에 지금 시각. 행·좋아요·댓글·태그 연결은 지우지 않는다 |

| 상황 | 결과 |
|---|---|
| 없는 글, 이미 지운 글, 볼 수 없는 글 | `404` |
| 작성자도 운영자도 아님 | `403` |

지운 뒤에는 상세(`GET`)·수정(`PATCH`)·다시 삭제가 모두 `404`이고, 목록에서도 빠진다(2-3 규칙 1번).

운영자가 글을 **숨기는 것**과 작성자·운영자가 글을 **삭제하는 것**은 다르다. 숨김은 `status = 'HIDDEN'`으로 남겨 운영자가 상세를 볼 수 있지만, 삭제는 `deleted_at`을 채워 운영자도 일반 상세에서 못 본다. 삭제 시각은 나중에 [휴지통·복구](../ch11-post-advanced/11-5-trash-restore.md)의 기준이 된다.

## 구현 가이드

`DELETE`를 받아 기존 행에 삭제 시각을 기록한다. 관련 행을 지우지 않고, 일반 조회 경로에서 삭제된 글이 빠지는지 확인한다.

<details>
<summary>Controller — DELETE와 빈 204 응답</summary>

```java
@DeleteMapping("/{id}")
@ResponseStatus(HttpStatus.NO_CONTENT)
public void delete(@PathVariable Long id,
                   @LoginMember AuthenticatedMember loginMember) {
    postService.delete(id, loginMember);
}
```

회원 id를 요청 본문에서 받지 않는다. 인증 인터셉터가 넣은 회원으로 권한을 판단한다.

</details>

<details>
<summary>Service — 살아 있는 글 확인과 권한 판단</summary>

```java
@Transactional
public void delete(Long id, AuthenticatedMember me) {
    Post post = postRepository.findById(id)
            .orElseThrow(PostNotFoundException::new);
    if (!accessPolicy.canView(me, post)) {
        throw new PostNotFoundException();
    }
    boolean author = post.getAuthor().getId().equals(me.id());
    boolean admin = "ADMIN".equals(me.role());
    if (!author && !admin) {
        throw new PostForbiddenException();
    }
    post.delete(LocalDateTime.now());
}
```

이 단계의 `post.delete(now)`는 `deletedAt`과 `updatedAt`을 채운다. 트랜잭션의 변경 감지로 `UPDATE`가 나가므로 `repository.delete(post)`를 호출하지 않는다. 13-1에서 역할 표를 만들면 위 `ADMIN` 문자열 비교를 그 권한 검사로 옮긴다.

</details>

<details>
<summary>JPA / Repository — 일반 조회와 복구용 조회 분리</summary>

```java
Post post = postRepository.findById(id)
        .orElseThrow(PostNotFoundException::new);
if (!accessPolicy.canView(me, post)) {
    throw new PostNotFoundException();
}
```

`findById(id)`에는 삭제 조건이 자동으로 붙지 않으므로, 이 단계의 서비스는 `PostAccessPolicy.canView`에서 `deletedAt`을 먼저 확인한다. 상세·수정·반응 같은 **일반 기능**도 같은 규칙이 필요하다. 목록은 `WHERE p.deletedAt IS NULL`과 같은 조건의 COUNT를 사용한다.

반대로 11-5 휴지통·복구는 삭제된 행을 찾아야 한다. 전체 엔티티에 `@SQLRestriction("deleted_at IS NULL")`을 붙이면 복구 경로에서도 안 보일 수 있으므로, 이 실습에서는 조회 목적에 맞는 메서드를 분리한다.

</details>

<details>
<summary>MyBatis / Mapper — deleted_at만 UPDATE하기</summary>

MyBatis 대체 구현도 `PostVisibilityMapper.findVisibleDetail`에서 삭제·공개 범위를 먼저 확인하고, 그다음 작성자 또는 `ADMIN`인지 검사한다. `PostDeleteMyBatisService`는 아래 Mapper를 호출한다. `DELETE FROM post`나 연관 테이블 삭제 SQL은 사용하지 않는다.

```xml
<update id="softDelete">
  UPDATE post SET deleted_at = CURRENT_TIMESTAMP,
                  updated_at = CURRENT_TIMESTAMP
  WHERE id = #{id} AND deleted_at IS NULL
</update>
```

영향받은 행이 0개면 이미 삭제됐거나 없는 글로 보고 `404`를 반환한다. 전체 Controller·Service·Mapper Java/XML·테스트 파일은 이 가이드 뒤의 역할별 코드 접기에 있다.

</details>

<details>
<summary>DB / SQL — 행이 남는지 검산</summary>

```sql
SELECT id, status, deleted_at FROM post WHERE id = @post_id;
SELECT id FROM post WHERE id = @post_id AND deleted_at IS NULL;
SELECT COUNT(*) FROM post_like WHERE post_id = @post_id;
SELECT COUNT(*) FROM comment WHERE post_id = @post_id;
```

첫 SELECT에는 행과 삭제 시각이 남고, 둘째에서는 빠진다. 좋아요·댓글 개수는 삭제 전과 같아야 한다. `@post_id`는 직접 확인에서 만든 Y의 id로 먼저 `SET @post_id = ...;` 하거나 숫자로 바꿔 실행한다. 새 글 Y에는 좋아요·댓글이 없으므로 `PostDeleteControllerTest`는 일회용 DB에 좋아요·댓글·태그 연결을 실제로 넣은 뒤 삭제하고 세 연결이 모두 남는지 검증한다.

</details>

## 직접 확인

```bash
BASE=http://localhost:8080
K='Authorization: Bearer tok-kimjava'; L='Authorization: Bearer tok-lee'; A='Authorization: Bearer tok-admin'
jid() { python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])'; }
mk() { curl -s -X POST "$BASE/api/posts" -H "$1" -H 'Content-Type: application/json' \
  -d "{\"boardSlug\":\"dev\",\"title\":\"$2\",\"content\":\"삭제 확인용\",\"tags\":[],\"visibility\":\"PUBLIC\"}" | jid; }

Y=$(mk "$K" '[채점] 삭제용'); echo "Y=$Y"                                         # S0
curl -i -X DELETE "$BASE/api/posts/$Y" -H "$L"                                     # S1 남의 글
curl -i -X DELETE "$BASE/api/posts/$Y" -H "$K"                                     # S2 작성자
curl -i "$BASE/api/posts/$Y"                                                       # S3 지운 뒤 조회
curl -i -X DELETE "$BASE/api/posts/$Y" -H "$K"                                     # S4 다시 삭제
curl -s "$BASE/api/boards/dev/posts?size=50" | python3 -c "import sys,json; print($Y in [i['id'] for i in json.load(sys.stdin)['items']])"   # S5 목록에 있나
Z=$(mk "$L" '[채점] 운영자가 지울 글'); echo "Z=$Z"
curl -i -X DELETE "$BASE/api/posts/$Z" -H "$A"                                     # S6 운영자
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "S0",
      "title": "S0 삭제용 글 Y 만들기(김자바)",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "boardSlug": "dev",
        "title": "[채점] 삭제용",
        "content": "삭제 확인용",
        "tags": [],
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "S1",
      "title": "S1 남의 글 삭제(이스프링)",
      "method": "DELETE",
      "path": "/api/posts/{{S0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "S2",
      "title": "S2 작성자가 삭제",
      "method": "DELETE",
      "path": "/api/posts/{{S0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "S3",
      "title": "S3 지운 뒤 조회",
      "method": "GET",
      "path": "/api/posts/{{S0.body.id}}"
    },
    {
      "id": "S4",
      "title": "S4 다시 삭제",
      "method": "DELETE",
      "path": "/api/posts/{{S0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "S5",
      "title": "S5 dev 목록(size=50)",
      "method": "GET",
      "path": "/api/boards/dev/posts?size=50"
    },
    {
      "id": "Z",
      "title": "운영자가 지울 글 Z 만들기(이스프링)",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "boardSlug": "dev",
        "title": "[채점] 운영자가 지울 글",
        "content": "삭제 확인용",
        "tags": [],
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "S6",
      "title": "S6 운영자가 Z 삭제",
      "method": "DELETE",
      "path": "/api/posts/{{Z.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-admin"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "S0",
      "expect": {
        "status": 201
      }
    },
    {
      "id": "C2",
      "request": "S1",
      "expect": {
        "status": 403
      }
    },
    {
      "id": "C3",
      "request": "S2",
      "expect": {
        "status": 204,
        "bodyText": {
          "equals": ""
        }
      }
    },
    {
      "id": "C4",
      "request": "S3",
      "expect": {
        "status": 404
      }
    },
    {
      "id": "C5",
      "request": "S4",
      "expect": {
        "status": 404
      }
    },
    {
      "id": "C6",
      "request": "S5",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items",
            "type": "array"
          },
          {
            "path": "$.items[*].id",
            "notContains": "{{S0.body.id}}"
          }
        ]
      }
    },
    {
      "id": "C7",
      "request": "S6",
      "expect": {
        "status": 204
      }
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). `{Y}`·`{Z}`는 직접 확인에서 만든 글의 id다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | S0 | `201` |
| C2 | S1 | `403` |
| C3 | S2 | `204`, 본문 없음 |
| C4 | S3 | `404` |
| C5 | S4 | `404` |
| C6 | S5 | `False` — 목록에 없다 |
| C7 | S6(운영자가 이스프링 글 삭제) | `204` |
| D1 | `SELECT deleted_at IS NOT NULL, title FROM post WHERE id = {Y}` | `1`, `[채점] 삭제용` — 행이 남아 있다 |
| D2 | `SELECT deleted_at IS NOT NULL FROM post WHERE id = {Z}` | `1` |
| R1 | 지운 글 거르기 | 일반 상세·목록·수정·좋아요는 `deleted_at IS NULL` 규칙을 공유한다. 휴지통·복구는 삭제된 행을 조회해야 하므로 목적별 메서드를 구분한다 |
| R2 | 권한 | "작성자 또는 운영자" 판단이 서비스에 있다 |
| R3 | 두 번째 삭제 | 두 번째 삭제를 404로 한 이유(이미 없는 자원)를 설명할 수 있다. 204로 하는 설계도 있다는 것을 안다 |
| R4 | 연관 데이터 | 좋아요·댓글을 같이 지우지 않았다(cascade 삭제나 `orphanRemoval`로 날아가지 않는다) |

## 필요한 지식

- [P20 — cascade, orphanRemoval, 다대다](../../docs/knowledge/P20-jpa-entity-mapping.md#25-cascade-orphanremoval-다대다) — 같이 지워지면 안 되는 것
- [S09 JPA·Hibernate](../../docs/knowledge/S09-jpa-hibernate.md)
- [W08 예외는 어디서 잡나](../../docs/knowledge/W08-where-to-handle-exceptions.md)
- [R07 백업과 복원](../../docs/knowledge/R07-backup-restore.md) — "지운 데이터"를 남겨 두는 다른 이유

## 힌트 (막힐 때만)

<details>
<summary>힌트 — 엔티티에 삭제 메서드</summary>

`post.delete(now)`가 `deletedAt`을 채우게 하고, 리포지토리의 `delete()`는 쓰지 않는다. 지운 글을 거르는 조건은 2-3의 규칙 클래스에 이미 있다면 상세·목록은 자동으로 따라온다. 수정(`PATCH`)·좋아요처럼 "글을 찾는" 다른 경로도 같은 조회 메서드를 쓰게 한다.
</details>

## 다음 단계

[4-0. 좋아요 설정](../ch4-like/4-0-set-like.md) — PUT 한 동작과 관계 행·숫자부터 맞춘다.
