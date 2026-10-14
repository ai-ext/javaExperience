# 4-1. 좋아요·취소(멱등)

## 상황

> "하트 누르면 좋아요, 다시 누르면 취소예요. 근데 네트워크가 느리면 사용자가 두 번 누르거나 앱이 자동으로 다시 보내요."

같은 요청이 두 번 와도 결과가 같아야 한다(**멱등**). "누를 때마다 뒤집기(toggle)"로 만들면 두 번 오면 원래대로 돌아가 버린다. 그래서 **좋아요(PUT)와 취소(DELETE)를 따로** 둔다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "좋아요 버튼",
  "summary": "누르기와 취소를 따로 둔다(PUT·DELETE). 두 번 와도 결과가 같다.",
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
      "value": "인덱스는 언제 타나요?",
      "emphasis": "title"
    },
    {
      "type": "stats",
      "id": "post-stats",
      "items": [
        {
          "id": "likes",
          "label": "좋아요",
          "value": "♥ 1"
        },
        {
          "id": "views",
          "label": "조회",
          "value": "8"
        }
      ]
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        {
          "id": "like",
          "label": "♥ 좋아요",
          "variant": "secondary"
        }
      ]
    },
    {
      "type": "toast",
      "id": "toast",
      "value": "내 글에는 좋아요를 누를 수 없어요",
      "tone": "warning"
    }
  ],
  "flows": [
    {
      "name": "하트 누르기",
      "steps": [
        {
          "kind": "user",
          "text": "하트를 누른다",
          "focus": [
            "like"
          ]
        },
        {
          "kind": "request",
          "method": "PUT",
          "path": "/api/posts/3/like",
          "headers": [
            "Authorization: Bearer tok-kimjava"
          ]
        },
        {
          "kind": "server",
          "text": "볼 수 있는 글인가 → 내 글이 아닌가 → 이미 눌렀나? 아니면 행 추가 + 숫자 +1(한 트랜잭션)"
        },
        {
          "kind": "db",
          "sql": "INSERT INTO post_like (post_id, member_id, created_at) VALUES (3, 2, NOW())"
        },
        {
          "kind": "db",
          "sql": "UPDATE post SET like_count = like_count + 1 WHERE id = 3"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"postId\": 3, \"liked\": true, \"likeCount\": 1}"
        },
        {
          "kind": "screen",
          "text": "하트를 채우고 숫자는 응답의 likeCount로 바꾼다",
          "focus": [
            "likes",
            "like"
          ]
        }
      ]
    },
    {
      "name": "느린 네트워크로 요청이 두 번 감",
      "steps": [
        {
          "kind": "user",
          "text": "응답이 늦어 앱이 같은 요청을 다시 보낸다"
        },
        {
          "kind": "request",
          "method": "PUT",
          "path": "/api/posts/3/like",
          "headers": [
            "Authorization: Bearer tok-kimjava"
          ]
        },
        {
          "kind": "server",
          "text": "이미 좋아요 상태 → 아무것도 하지 않는다(멱등). 뒤집기(toggle)였다면 여기서 취소돼 버린다"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"postId\": 3, \"liked\": true, \"likeCount\": 1}"
        },
        {
          "kind": "screen",
          "text": "숫자가 그대로다",
          "focus": [
            "likes"
          ]
        }
      ]
    },
    {
      "name": "취소",
      "steps": [
        {
          "kind": "user",
          "text": "채워진 하트를 다시 누른다",
          "focus": [
            "like"
          ]
        },
        {
          "kind": "request",
          "method": "DELETE",
          "path": "/api/posts/3/like",
          "headers": [
            "Authorization: Bearer tok-kimjava"
          ]
        },
        {
          "kind": "db",
          "sql": "DELETE FROM post_like WHERE post_id = 3 AND member_id = 2"
        },
        {
          "kind": "db",
          "sql": "UPDATE post SET like_count = like_count - 1 WHERE id = 3"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"postId\": 3, \"liked\": false, \"likeCount\": 0}"
        },
        {
          "kind": "screen",
          "text": "하트가 비워진다",
          "focus": [
            "likes"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

| 메서드·경로 | 의미 | 응답 |
|---|---|---|
| `PUT /api/posts/{id}/like` | 좋아요 상태로 만든다 | `200` `{ "postId": 3, "liked": true, "likeCount": 1 }` |
| `DELETE /api/posts/{id}/like` | 좋아요가 아닌 상태로 만든다 | `200` `{ "postId": 3, "liked": false, "likeCount": 0 }` |

| 상황 | 결과 |
|---|---|
| 이미 좋아요인데 또 PUT / 이미 아닌데 또 DELETE | `200`, 상태·숫자 그대로(행이 늘거나 줄지 않는다) |
| 내 글에 좋아요 | `400` |
| 없는 글, 2-3 규칙상 볼 수 없는 글, `PUBLISHED`가 아닌 글 | `404` |
| 토큰 없음 / 정지 회원 | `401` / `403` |

- `post_like`에 (글, 회원) 한 행이 있으면 좋아요 상태다. 테이블에는 이미 `UNIQUE (post_id, member_id)`가 걸려 있다.
- `post.like_count`는 행 수와 항상 같아야 한다. 응답의 `likeCount`는 바뀐 뒤의 값이다.

**필드 규칙** — 본문이 없는 API라 입력은 경로의 글 id 하나다. 잘못된 입력은 `500`이 나면 안 된다

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `{id}`(경로) | 필수 | — | — | 숫자 | — | 숫자가 아니면(`abc`) `400`, 없는 글·볼 수 없는 글 `404` |
| 본문 | 없음 | — | — | — | — | 보내도 읽지 않는다 |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 볼 수 있는 글인가 → 내 글이 아닌가 → 이미 눌렀나? 아니면 행 추가 + 숫자 +1(한 트랜잭션)
- 이미 좋아요 상태 → 아무것도 하지 않는다(멱등). 뒤집기(toggle)였다면 여기서 취소돼 버린다
- DELETE도 볼 수 있는 공개 글인지 확인한다 → 관계가 있으면 그 행을 지우고 숫자 -1(한 트랜잭션). 이미 관계가 없으면 그대로 반환한다.

<details>
<summary>Controller — HTTP 연결</summary>

`LikeController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@PutMapping("/api/posts/{id}/like")`, `@DeleteMapping("/api/posts/{id}/like")`. 변경된 메서드: `like`, `unlike`.

```java
@PutMapping("/api/posts/{id}/like")
public LikeResponse like(@PathVariable Long id, @LoginMember AuthenticatedMember me) {
    return likeService.like(id, me);
}

@DeleteMapping("/api/posts/{id}/like")
public LikeResponse unlike(@PathVariable Long id, @LoginMember AuthenticatedMember me) {
    return likeService.unlike(id, me);
}
```

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`LikeResponse.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

```java
public record LikeResponse(Long postId, boolean liked, Integer likeCount) { }
```

본문은 받지 않는다. 응답 숫자는 쓰기 이후 글의 `likeCount`다.

</details>

<details>
<summary>Service — 처리 순서</summary>

`LikeService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `like`, `unlike`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

```java
@Transactional
public LikeResponse unlike(Long postId, AuthenticatedMember me) {
    Post post = findLikeablePost(postId, me);
    if (postLikeRepository.existsByPost_IdAndMember_Id(postId, me.id())) {
        postLikeRepository.deleteByPost_IdAndMember_Id(postId, me.id());
        post.decreaseLikeCount();
    }
    return new LikeResponse(postId, false, post.getLikeCount());
}
```

PUT에서는 관계가 없을 때만 `save`와 `increaseLikeCount`를 함께 실행한다. DELETE에서는 관계가 있을 때만 두 쓰기를 함께 실행한다.

</details>

<details>
<summary>JPA / Repository — DB 조건</summary>

`PostLikeRepository.java`. 쿼리·파생 메서드의 조건을 화면 시나리오의 DB 단계 및 직접 확인 SQL과 대조한다.

```java
boolean existsByPost_IdAndMember_Id(Long postId, Long memberId);
long deleteByPost_IdAndMember_Id(Long postId, Long memberId);
```

두 메서드 모두 글 ID와 토큰 회원 ID를 조건으로 쓴다. 다른 회원의 관계 행을 지워서는 안 된다.

</details>

<details>
<summary>MyBatis / Mapper — 관계 삭제와 숫자 감소</summary>

MyBatis 경로도 `MyBatisLikeService`의 `@Transactional` 안에서 가시성·발행 상태를 확인한다. `deleteLike`가 실제로 1행을 지운 경우에만 숫자를 감소시킨다. 같은 DELETE를 반복하면 0행 삭제이므로 숫자가 유지된다.

```xml
<delete id="deleteLike">
  DELETE FROM post_like WHERE post_id = #{postId} AND member_id = #{memberId}
</delete>
<update id="decreaseLikeCount">
  UPDATE post SET like_count = GREATEST(0, like_count - 1) WHERE id = #{postId}
</update>
```

실행 가능한 Controller·Service·Mapper Java/XML과 테스트 전문은 아래 MyBatis 역할별 코드 접기에 있다. PUT의 `insertLike`·`increaseLikeCount`도 함께 펼쳐 두 방향을 비교한다.

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`PostLike.java`, `Post.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다. 변경된 메서드: `increaseLikeCount`, `decreaseLikeCount`.

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`ApiExceptionHandler.java`, `SelfLikeNotAllowedException.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handleSelfLikeNotAllowed`.

</details>

## 직접 확인

김자바(`tok-kimjava`)가 박디비의 3번 글에 누른다. 처음 상태가 어떻든 같은 결과가 나오도록 **취소부터** 한다.

```bash
BASE=http://localhost:8080
K='Authorization: Bearer tok-kimjava'; L='Authorization: Bearer tok-lee'; C='Authorization: Bearer tok-choi'

curl -s -X DELETE "$BASE/api/posts/3/like" -H "$K"; echo     # K0 처음 상태로
curl -s -X PUT    "$BASE/api/posts/3/like" -H "$K"; echo     # K1
curl -s -X PUT    "$BASE/api/posts/3/like" -H "$K"; echo     # K2 한 번 더
curl -s -X DELETE "$BASE/api/posts/3/like" -H "$K"; echo     # K3
curl -s -X DELETE "$BASE/api/posts/3/like" -H "$K"; echo     # K4 한 번 더
curl -i -X PUT "$BASE/api/posts/2/like" -H "$L"              # K5 이스프링이 자기 글(2번)에
curl -i -X PUT "$BASE/api/posts/9/like" -H "$K"              # K6 김자바를 차단한 회원의 글
curl -i -X PUT "$BASE/api/posts/7/like" -H "$K"              # K7 남의 임시저장 글
curl -i -X PUT "$BASE/api/posts/3/like"                      # K8 토큰 없음
curl -i -X PUT "$BASE/api/posts/3/like" -H "$C"              # K9 정지 회원
curl -s -o /dev/null -w '%{http_code}\n' -X PUT    "$BASE/api/posts/abc/like" -H "$K"      # V1 400
curl -s -o /dev/null -w '%{http_code}\n' -X DELETE "$BASE/api/posts/abc/like" -H "$K"      # V2 400
curl -s -o /dev/null -w '%{http_code}\n' -X PUT    "$BASE/api/posts/999999/like" -H "$K"   # V3 404
```

버튼으로 확인 — 아래 실행 칸이 위 요청을 그대로 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "K0",
      "title": "K0 처음 상태로(취소)",
      "method": "DELETE",
      "path": "/api/posts/3/like",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "K1",
      "title": "K1 좋아요",
      "method": "PUT",
      "path": "/api/posts/3/like",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "K2",
      "title": "K2 한 번 더 좋아요",
      "method": "PUT",
      "path": "/api/posts/3/like",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "K3",
      "title": "K3 취소",
      "method": "DELETE",
      "path": "/api/posts/3/like",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "K4",
      "title": "K4 한 번 더 취소",
      "method": "DELETE",
      "path": "/api/posts/3/like",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "K5",
      "title": "K5 이스프링이 자기 글(2번)에",
      "method": "PUT",
      "path": "/api/posts/2/like",
      "headers": {
        "Authorization": "Bearer tok-lee"
      }
    },
    {
      "id": "K6",
      "title": "K6·K7 — 차단한 회원의 글(9번) · 남의 임시저장 글(7번)",
      "method": "PUT",
      "path": "/api/posts/{{pid}}/like",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "concurrent": {
        "count": 2,
        "vars": {
          "pid": [
            "9",
            "7"
          ]
        }
      }
    },
    {
      "id": "K8",
      "title": "K8 토큰 없음",
      "method": "PUT",
      "path": "/api/posts/3/like"
    },
    {
      "id": "K9",
      "title": "K9 정지 회원",
      "method": "PUT",
      "path": "/api/posts/3/like",
      "headers": {
        "Authorization": "Bearer tok-choi"
      }
    },
    {
      "id": "V1",
      "title": "V1 경로 id가 숫자가 아님(PUT)",
      "method": "PUT",
      "path": "/api/posts/abc/like",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "V2",
      "title": "V2 경로 id가 숫자가 아님(DELETE)",
      "method": "DELETE",
      "path": "/api/posts/abc/like",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    },
    {
      "id": "V3",
      "title": "V3 없는 글",
      "method": "PUT",
      "path": "/api/posts/999999/like",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "K0",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.liked",
            "equals": false
          }
        ]
      }
    },
    {
      "id": "C2",
      "request": "K1",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.liked",
            "equals": true
          },
          {
            "path": "$.likeCount",
            "equals": "{{K0.body.likeCount + 1}}"
          }
        ]
      }
    },
    {
      "id": "C3",
      "request": "K2",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.liked",
            "equals": true
          },
          {
            "path": "$.likeCount",
            "equals": "{{K0.body.likeCount + 1}}"
          }
        ]
      }
    },
    {
      "id": "C4",
      "request": "K3",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.liked",
            "equals": false
          },
          {
            "path": "$.likeCount",
            "equals": "{{K0.body.likeCount}}"
          }
        ]
      }
    },
    {
      "id": "C5",
      "request": "K4",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.liked",
            "equals": false
          },
          {
            "path": "$.likeCount",
            "equals": "{{K0.body.likeCount}}"
          }
        ]
      }
    },
    {
      "id": "C6",
      "request": "K5",
      "expect": {
        "status": 400
      }
    },
    {
      "id": "C7",
      "request": "K6",
      "expect": {
        "status": 404
      }
    },
    {
      "id": "C8",
      "all": [
        {
          "request": "K8",
          "expect": {
            "status": 401
          }
        },
        {
          "request": "K9",
          "expect": {
            "status": 403
          }
        }
      ]
    },
    {
      "id": "C9",
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
            "status": 400
          }
        },
        {
          "request": "V3",
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

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). n은 K0 응답의 `likeCount`다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | K0 | `200`, `liked`=false |
| C2 | K1 | `200`, `liked`=true, `likeCount`=n+1 |
| C3 | K2 | `200`, `liked`=true, `likeCount`=n+1(그대로) |
| D1 | K2 뒤 `SELECT COUNT(*) FROM post_like WHERE post_id = 3 AND member_id = 2` | `1` |
| C4 | K3 | `200`, `liked`=false, `likeCount`=n |
| C5 | K4 | `200`, `liked`=false, `likeCount`=n(그대로) |
| D2 | K4 뒤 `SELECT p.like_count = (SELECT COUNT(*) FROM post_like l WHERE l.post_id = 3) FROM post p WHERE p.id = 3` | `1` — 숫자와 행 수가 같다 |
| C6 | K5 | `400` |
| C7 | K6 / K7 | `404` / `404` |
| C8 | K8 / K9 | `401` / `403` |
| C9 | V1 / V2 / V3 | 경로 `abc`는 PUT·DELETE 모두 `400` / 없는 글 `404`(`application/problem+json`) — 어느 것도 `500`이 아니다 |
| R1 | 멱등 | PUT·DELETE가 "현재 상태를 확인하고 필요할 때만 바꾸는" 방식이다. 이미 있는데 INSERT를 시도해 500(중복 키)이 나지 않는다 |
| R2 | 숫자 맞추기 | `like_count`를 행 추가·삭제와 같은 트랜잭션에서 바꾼다 |
| R3 | 규칙 재사용 | "볼 수 있는 글인가"를 2-3의 규칙으로 확인한다 |
| R4 | 응답 | 응답의 `likeCount`가 실제 DB 값과 같다(메모리 계산만 믿지 않는다) |

## 필요한 지식

- [P18 — 중복 요청은 동시성 락이 해결하지 않는다](../../docs/knowledge/P18-concurrency-inventory.md#27-중복-요청은-동시성-락이-해결하지-않는다)
- [P18 — 좌석은 재고보다 유니크 제약이 핵심이다](../../docs/knowledge/P18-concurrency-inventory.md#28-좌석은-재고보다-유니크-제약이-핵심이다) — `post_like`의 UNIQUE와 같은 이야기
- [S06 REST API 설계 — 메서드와 상태 코드](../../docs/knowledge/S06-rest-api-clients.md#메서드와-상태-코드) — PUT·DELETE가 멱등인 이유
- [W11 트랜잭션은 왜 서비스 계층에 거나](../../docs/knowledge/W11-why-tx-in-service.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 — 흐름</summary>

PUT: 글 찾기(2-3 규칙) → 내 글이면 400 → `existsByPostAndMember`가 false일 때만 `PostLike` 저장 + `likeCount` 1 증가 → 현재 상태 반환. DELETE는 반대. 동시에 두 번 오는 경우는 다음 단계(4-2)에서 다룬다.
</details>

## 다음 단계

[4-2. 동시에 눌러도 맞는 like_count](4-2-like-concurrency.md)
