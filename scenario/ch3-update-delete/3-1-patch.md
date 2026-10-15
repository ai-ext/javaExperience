# 3-1. 부분 수정(PATCH)과 본인 확인

## 상황

> "오타만 고치고 싶은데 글 전체를 다시 보내야 하나요? 바꾼 칸만 보내고 싶어요."

**보낸 필드만 바꾸는** 수정 API를 만든다. 그리고 남의 글은 고칠 수 없어야 한다. 이 확인을 빼먹으면 id만 바꿔서 남의 글을 고치는 사고(IDOR)가 난다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글 수정 화면",
  "summary": "고친 칸만 보낸다. 서버는 보낸 필드만 바꾸고, 남의 글이면 막는다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "글 수정",
      "right": "김자바"
    },
    {
      "type": "field",
      "id": "title",
      "label": "제목",
      "value": "[채점] 수정 후"
    },
    {
      "type": "field",
      "id": "content",
      "label": "본문",
      "value": "수정 전 본문",
      "multiline": true
    },
    {
      "type": "chips",
      "id": "tags",
      "label": "태그",
      "items": [
        "spring",
        "jpa"
      ]
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        {
          "id": "save",
          "label": "수정 완료",
          "variant": "primary"
        },
        {
          "id": "cancel",
          "label": "취소",
          "variant": "ghost"
        }
      ]
    },
    {
      "type": "toast",
      "id": "toast",
      "value": "내 글만 수정할 수 있어요",
      "tone": "error"
    }
  ],
  "flows": [
    {
      "name": "제목만 고치기",
      "steps": [
        {
          "kind": "user",
          "text": "제목만 바꾸고 [수정 완료]를 누른다",
          "focus": [
            "title",
            "save"
          ]
        },
        {
          "kind": "request",
          "method": "PATCH",
          "path": "/api/posts/22",
          "headers": [
            "Content-Type: application/json",
            "Authorization: Bearer tok-kimjava"
          ],
          "body": "{\"title\": \"[채점] 수정 후\"}"
        },
        {
          "kind": "server",
          "text": "볼 수 있는 글인가(아니면 404) → 작성자인가(아니면 403) → 보낸 필드만 바꾼다(null·생략은 그대로)"
        },
        {
          "kind": "db",
          "sql": "UPDATE post SET title = '[채점] 수정 후', updated_at = NOW() WHERE id = 22",
          "note": "save() 없이 트랜잭션 커밋 때 변경 감지로 반영"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"id\": 22, \"title\": \"[채점] 수정 후\", \"content\": \"수정 전 본문\", \"tags\": [\"spring\", \"jpa\"], ...}"
        },
        {
          "kind": "screen",
          "text": "응답으로 상세 화면을 다시 그린다 — 본문·태그는 그대로",
          "focus": [
            "title",
            "content",
            "tags"
          ]
        }
      ]
    },
    {
      "name": "남의 글 고치기",
      "steps": [
        {
          "kind": "user",
          "text": "이스프링이 김자바 글의 수정 주소를 직접 연다"
        },
        {
          "kind": "request",
          "method": "PATCH",
          "path": "/api/posts/22",
          "headers": [
            "Content-Type: application/json",
            "Authorization: Bearer tok-lee"
          ],
          "body": "{\"title\": \"[채점] 남의 수정\"}"
        },
        {
          "kind": "server",
          "text": "글은 볼 수 있다(공개) → 작성자가 아니다 → 403. 수정 버튼을 숨기는 건 화면의 일이고, 막는 건 서버의 일이다"
        },
        {
          "kind": "response",
          "status": 403,
          "headers": [
            "Content-Type: application/problem+json"
          ]
        },
        {
          "kind": "screen",
          "text": "'내 글만 수정할 수 있어요'",
          "focus": [
            "toast"
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

**필드 규칙** — 보낸 필드만 검사한다. 규칙은 1-5와 같고, 다른 점은 "생략·`null` = 그대로"뿐이다. 잘못된 입력은 저장 전에 막고 `500`이 나면 안 된다. 1-5처럼 틀린 필드를 **모두** `errors`에 담는 것이 목표지만, 이 단계 정답 코드는 서비스에서 차례로 검사해 **첫 번째 틀린 필드 하나만** 담는다(관찰 O1)

| 필드 | 필수 | null·빈 값 | 길이·범위 | 형식 | 기본값 | 틀렸을 때 |
|---|---|---|---|---|---|---|
| `title` | 선택 | 생략·`null`은 그대로. `""`·공백만은 거절 | 1~200자(정확히 200자는 성공, 201자는 거절) | 문자열 | 그대로 | `400`, `errors`에 `title` |
| `content` | 선택 | 생략·`null`은 그대로. `""`·공백만은 거절 | 제한 없음 | 문자열 | 그대로 | `400`, `errors`에 `content` |
| `tags` | 선택 | 생략·`null`은 그대로, `[]`는 모두 뗀다. 원소가 `""`·공백만·`null`이면 거절 | 최대 5개(5개 성공, 6개 거절), 각 1~30자(30자 성공, 31자 거절) | 문자열 배열 | 그대로 | `400`, `errors`에 `tags` |
| `visibility` | 선택 | 생략·`null`은 그대로 | `PUBLIC`·`FOLLOWERS` | 정해진 값 중 하나 | 그대로 | `400`, `errors`에 `visibility` |
| `{id}`(경로) | 필수 | — | — | 숫자 | — | 숫자가 아니면(`abc`) `400`, 없는 글 `404` |
| 본문 전체 | 필수 | — | — | JSON, `tags`는 배열 | — | JSON이 아니거나 배열 자리에 문자열(`"tags":"spring"`)이면 `400`(이 단계에서는 `errors` 없이 `problem+json`만 — 11-1에서 `errors`에 필드를 담는다) |

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- 볼 수 있는 글인가(아니면 404) → 작성자인가(아니면 403) → 보낸 필드만 바꾼다(null·생략은 그대로)
- save() 없이 트랜잭션 커밋 때 변경 감지로 반영
- 글은 볼 수 있다(공개) → 작성자가 아니다 → 403. 수정 버튼을 숨기는 건 화면의 일이고, 막는 건 서버의 일이다

<details>
<summary>Controller — HTTP 연결</summary>

`PostController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@PatchMapping("/{id}")`. 변경된 메서드: `patch`.

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`PostUpdateRequest.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다.

</details>

<details>
<summary>Service — 처리 순서</summary>

`PostService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 변경된 메서드: `patch`. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

</details>

<details>
<summary>Entity — 테이블·상태</summary>

`Post.java`. 실제 테이블의 컬럼·외래키와 엔티티 매핑을 대조한다. 변경된 메서드: `changeTitle`, `changeContent`, `changeVisibility`, `replaceTags`.

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`ApiExceptionHandler.java`, `InvalidPostFieldException.java`, `PostForbiddenException.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handlePostForbidden`, `handleInvalidPostField`.

</details>

<details>
<summary>MyBatis / Mapper — 보낸 필드만 UPDATE하기</summary>

MyBatis 대체 구현의 `PostPatchMyBatisService`는 JPA 서비스와 같은 순서로 `findVisibleDetail`의 404와 작성자 403을 확인한다. `PostUpdateRequest`에서 값이 `null`인 필드는 SQL의 `<if>`에서 제외한다.

`tags`가 `null`이면 `post_tag`를 건드리지 않고, 빈 배열이면 기존 연결을 모두 삭제한다. Service에 `@Transactional`을 두어 태그 행과 글 수정을 한 번에 처리한다.

```xml
<update id="patchPost">
  UPDATE post
  <set>
    <if test="title != null">title = #{title},</if>
    <if test="content != null">content = #{content},</if>
    <if test="visibility != null">visibility = #{visibility},</if>
    updated_at = CURRENT_TIMESTAMP
  </set>
  WHERE id = #{id}
</update>
```

`#{...}` 바인딩은 요청 문자열을 SQL 문법으로 해석하지 않는다. 새 태그 이름은 `tag`에서 ID와 원래 표기를 읽고, 같은 ID를 중복 연결하지 않는다. 전체 Controller·Service·Mapper Java/XML·DTO·설정은 이어지는 MyBatis 역할별 코드 접기에 있다.

</details>

## 직접 확인

채점용 글을 하나 만든 뒤(`dev` 게시판) 고친다.

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "E0",
      "title": "E0 채점용 글 만들기(김자바)",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "boardSlug": "dev",
        "title": "[채점] 수정 전",
        "content": "수정 전 본문",
        "tags": [
          "spring",
          "jpa"
        ],
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "E1",
      "title": "E1 제목만 수정",
      "method": "PATCH",
      "path": "/api/posts/{{E0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "title": "[채점] 수정 후"
      }
    },
    {
      "id": "E2",
      "title": "E2 태그 모두 떼기",
      "method": "PATCH",
      "path": "/api/posts/{{E0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "tags": []
      }
    },
    {
      "id": "E3",
      "title": "E3 공백 제목",
      "method": "PATCH",
      "path": "/api/posts/{{E0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "title": "   "
      }
    },
    {
      "id": "V1",
      "title": "V1 제목 201자",
      "method": "PATCH",
      "path": "/api/posts/{{E0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "title": "[채점] 경계-0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
      }
    },
    {
      "id": "V2",
      "title": "V2 빈 본문",
      "method": "PATCH",
      "path": "/api/posts/{{E0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "content": ""
      }
    },
    {
      "id": "V3",
      "title": "V3 태그 6개",
      "method": "PATCH",
      "path": "/api/posts/{{E0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "tags": [
          "a",
          "b",
          "c",
          "d",
          "e",
          "f"
        ]
      }
    },
    {
      "id": "V4",
      "title": "V4 태그 이름 31자",
      "method": "PATCH",
      "path": "/api/posts/{{E0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "tags": [
          "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        ]
      }
    },
    {
      "id": "V5",
      "title": "V5 빈 태그 이름",
      "method": "PATCH",
      "path": "/api/posts/{{E0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "tags": [
          ""
        ]
      }
    },
    {
      "id": "V10",
      "title": "V10 공백만 있는 태그 이름",
      "method": "PATCH",
      "path": "/api/posts/{{E0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "tags": [" "]
      }
    },
    {
      "id": "V6",
      "title": "V6 없는 공개 범위",
      "method": "PATCH",
      "path": "/api/posts/{{E0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "visibility": "SECRET"
      }
    },
    {
      "id": "V7",
      "title": "V7 태그 자리에 문자열",
      "method": "PATCH",
      "path": "/api/posts/{{E0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "tags": "spring"
      }
    },
    {
      "id": "V8",
      "title": "V8 깨진 JSON",
      "method": "PATCH",
      "path": "/api/posts/{{E0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava",
        "Content-Type": "application/json"
      },
      "body": "{\"title\":"
    },
    {
      "id": "V9",
      "title": "V9 경로 id가 숫자가 아님",
      "method": "PATCH",
      "path": "/api/posts/abc",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "title": "[채점] 숫자 아님"
      }
    },
    {
      "id": "O1",
      "title": "관찰 O1 — 세 필드가 함께 틀림(빈 제목·태그 6개·SECRET)",
      "method": "PATCH",
      "path": "/api/posts/{{E0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "title": "",
        "tags": [
          "a",
          "b",
          "c",
          "d",
          "e",
          "f"
        ],
        "visibility": "SECRET"
      }
    },
    {
      "id": "E4",
      "title": "E4 이스프링이 김자바 글 수정",
      "method": "PATCH",
      "path": "/api/posts/{{E0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "title": "[채점] 남의 수정"
      }
    },
    {
      "id": "E5",
      "title": "E5 토큰 없음",
      "method": "PATCH",
      "path": "/api/posts/{{E0.body.id}}",
      "body": {
        "title": "[채점] 토큰 없음"
      }
    },
    {
      "id": "E6",
      "title": "E6 지운 글(8번)",
      "method": "PATCH",
      "path": "/api/posts/8",
      "headers": {
        "Authorization": "Bearer tok-lee"
      },
      "body": {
        "title": "[채점] 지운 글"
      }
    },
    {
      "id": "E7",
      "title": "E7 없는 글",
      "method": "PATCH",
      "path": "/api/posts/999999",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "title": "[채점] 없는 글"
      }
    },
    {
      "id": "B0",
      "title": "B0 경계값용 글 만들기(김자바)",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "boardSlug": "dev",
        "title": "[채점] 경계 수정 전",
        "content": "경계 본문",
        "tags": [
          "spring"
        ],
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "B1",
      "title": "B1 제목 정확히 200자 + 태그 5개(하나는 30자)",
      "method": "PATCH",
      "path": "/api/posts/{{B0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "title": "[채점] 경계-000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "tags": [
          "spring",
          "jpa",
          "java",
          "mysql",
          "[채점]경계-xxxxxxxxxxxxxxxxxxxxxxx"
        ]
      }
    },
    {
      "id": "B2",
      "title": "B2 제목 1자",
      "method": "PATCH",
      "path": "/api/posts/{{B0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "title": "가"
      }
    },
    {
      "id": "B3",
      "title": "B3 title·content를 null로(그대로)",
      "method": "PATCH",
      "path": "/api/posts/{{B0.body.id}}",
      "headers": {
        "Authorization": "Bearer tok-kimjava"
      },
      "body": {
        "title": null,
        "content": null
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "E0",
      "expect": {
        "status": 201
      }
    },
    {
      "id": "C2",
      "request": "E1",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.title",
            "equals": "[채점] 수정 후"
          },
          {
            "path": "$.content",
            "equals": "수정 전 본문"
          },
          {
            "path": "$.tags",
            "length": 2
          },
          {
            "path": "$.tags",
            "contains": "spring"
          },
          {
            "path": "$.tags",
            "contains": "jpa"
          }
        ]
      }
    },
    {
      "id": "C3",
      "request": "E2",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.tags",
            "equals": []
          },
          {
            "path": "$.title",
            "equals": "[채점] 수정 후"
          }
        ]
      }
    },
    {
      "id": "C4",
      "request": "E3",
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
      "id": "C5",
      "request": "E4",
      "expect": {
        "status": 403
      }
    },
    {
      "id": "C6",
      "request": "E5",
      "expect": {
        "status": 401
      }
    },
    {
      "id": "C7",
      "request": "E6",
      "expect": {
        "status": 404
      }
    },
    {
      "id": "C8",
      "request": "E7",
      "expect": {
        "status": 404
      }
    },
    {
      "id": "C9",
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
                "contains": "title"
              }
            ]
          }
        },
        {
          "request": "V2",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "content"
              }
            ]
          }
        },
        {
          "request": "V3",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "tags"
              }
            ]
          }
        },
        {
          "request": "V4",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "tags"
              }
            ]
          }
        },
        {
          "request": "V5",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "tags"
              }
            ]
          }
        },
        {
          "request": "V10",
          "expect": {
            "status": 400,
            "json": [{ "path": "$.errors[*].field", "contains": "tags" }]
          }
        },
        {
          "request": "V6",
          "expect": {
            "status": 400,
            "json": [
              {
                "path": "$.errors[*].field",
                "contains": "visibility"
              }
            ]
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
            "status": 400
          }
        }
      ]
    },
    {
      "id": "C11",
      "all": [
        {
          "request": "B0",
          "expect": {
            "status": 201
          }
        },
        {
          "request": "B1",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.title",
                "equals": "[채점] 경계-000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
              },
              {
                "path": "$.tags",
                "length": 5
              }
            ]
          }
        },
        {
          "request": "B2",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.title",
                "equals": "가"
              }
            ]
          }
        },
        {
          "request": "B3",
          "expect": {
            "status": 200,
            "json": [
              {
                "path": "$.title",
                "equals": "가"
              },
              {
                "path": "$.content",
                "equals": "경계 본문"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C12",
      "manual": "관찰(채점 안 함) — O1 빈 제목·태그 6개·SECRET을 한 번에: 정답 코드에서는 400이지만 errors에 title 하나만 담긴다(PostService.patch가 필드마다 차례로 InvalidPostFieldException을 던진다). 1-5처럼 모두 담으려면 수정 DTO에 Bean Validation을 걸거나 오류를 모은 뒤 한 번에 던진다"
    }
  ]
}
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
| C9 | V1~V6·V10 | 모두 `400`이고 `errors`에 틀린 필드 — 제목 201자 `title`, 빈 본문 `content`, 태그 6개·31자·빈 이름·공백만 `tags`, `SECRET` `visibility`(V1은 `application/problem+json`). `500`이 아니다 |
| C10 | V7 / V8 / V9 | 배열 자리에 문자열·깨진 JSON `400`(`application/problem+json`) / 경로 `abc` `400` — 어느 것도 `500`이 아니다 |
| C11 | B0~B3 | 경계 바로 안쪽은 통과한다 — 제목 정확히 200자·태그 정확히 5개(하나 30자) `200`, 제목 1자 `200`, `title`·`content`를 `null`로 보내면 `200`이고 값은 그대로(`가`, `경계 본문`) |
| C12 | 관찰 O1 — 빈 제목·태그 6개·`SECRET`을 한 번에 | **채점 제외(관찰)** — 결과 줄의 필수 N/M에 세지 않는다. (정답 코드: `400`이지만 `errors`에 `title` 하나만 — 1-5처럼 모두 담지 않는다) |
| D1 | `SELECT title, content FROM post WHERE id = {X}` | `[채점] 수정 후`, `수정 전 본문` — E3~E5·V1~V10·O1이 아무것도 바꾸지 않았다 |
| D2 | `SELECT COUNT(*) FROM post_tag WHERE post_id = {X}` | `0` — V3~V5·V10이 태그를 붙이지 않았다 |
| R1 | 변경 방식 | 영속 상태 엔티티를 바꾸고 트랜잭션 커밋 때 반영되는 것(변경 감지)을 이해하고 쓴다. 불필요한 `save()` 재호출이 있다면 피드백 |
| R2 | 권한 확인 위치 | "작성자인가" 확인이 서비스에 있다(컨트롤러나 프론트에 기대지 않는다). 404(볼 수 없음)와 403(작성자 아님)의 순서가 맞다 |
| R3 | 부분 수정 표현 | 생략·`null`=그대로, 빈 값=400을 한 곳에서 일관되게 처리한다. 수정용 DTO가 생성용과 분리되어 있다 |
| R4 | 검증 일치 | 1-5의 제목·태그 길이·공백 규칙을 PATCH와 MyBatis 경로에도 똑같이 적용한다 |

## 필요한 지식

- [S09 — 영속 상태 변경과 flush](../../docs/knowledge/S09-jpa-hibernate.md#예제-2-영속-상태-변경과-flush) — `save()` 없이 바뀌는 이유
- [D11 — 안전한 SQL 바인딩과 IDOR 방어](../../docs/knowledge/D11-web-security-basics.md#41-안전한-sql-바인딩과-idor-방어를-먼저-설계하기)
- [W10 검증은 어디서 하나](../../docs/knowledge/W10-where-to-validate.md)
- [P16 — 알 수 없는 필드는 API 진화 정책으로 결정한다](../../docs/knowledge/P16-json-jackson-practical.md#28-알-수-없는-필드는-api-진화-정책으로-결정한다) — `boardSlug`를 보냈을 때

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 보낸 필드만</summary>

수정 DTO를 `record PostUpdateRequest(String title, String content, List<String> tags, Visibility visibility)`로 두고, 서비스에서 `if (req.title() != null) post.changeTitle(req.title());`처럼 `null`이 아닐 때만 바꾼다. 엔티티에 setter 대신 의미 있는 변경 메서드를 두면 규칙(빈 제목 금지)도 그 안에 넣을 수 있다. </details>

<details>
<summary>힌트 2 — 404와 403 순서</summary>

먼저 2-3 규칙으로 "볼 수 있나"를 확인해 아니면 404, 그다음 "작성자인가"를 확인해 아니면 403. 반대로 하면 볼 수 없는 글의 존재가 403으로 드러난다.
</details>

<details>
<summary>힌트 3 — 수정 응답에서 LazyInitializationException</summary>

`findById`로 읽은 글의 연관(게시판·작성자·태그)은 지연 프록시다. 서비스가 엔티티를 돌려주고 컨트롤러(트랜잭션 밖)에서 DTO로 옮기면 `post.getBoard().getSlug()`에서 터진다. DTO 변환을 서비스 안(트랜잭션 안)에서 하거나, 응답에 쓸 연관을 서비스에서 미리 읽어 둔다. 1-4·2-1에서 괜찮았던 같은 변환 메서드가 여기서만 터지는 이유는 "어디서 로딩됐나"가 달라서다.
</details>

## 다음 단계

[3-2. 삭제 — soft delete](3-2-soft-delete.md)
