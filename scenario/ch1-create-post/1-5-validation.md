# 1-5. 입력 검증과 에러 응답

## 상황

프론트 화면이 빈 제목을 막아 줘도, API는 curl·Postman·다른 서비스 누구나 호출할 수 있다. 지금은 빈 제목도, 없는 게시판도 그대로 들어오거나 500이 난다. 1-2~1-4의 관찰 항목(O)에서 직접 본 그대로다.

**잘못된 요청은 저장 전에 막고, 무엇이 왜 틀렸는지 정해진 형식으로 알려 준다.**

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "글쓰기 — 잘못 입력했을 때",
  "summary": "서버가 정한 형식(ProblemDetail)으로 무엇이 틀렸는지 알려 주면, 프론트는 필드 이름으로 칸을 찾아 오류를 붙인다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "새 글 쓰기",
      "right": "김자바"
    },
    {
      "type": "select",
      "id": "board",
      "label": "게시판",
      "value": "개발"
    },
    {
      "type": "field",
      "id": "title",
      "label": "제목",
      "value": "",
      "error": "제목을 입력해 주세요."
    },
    {
      "type": "field",
      "id": "content",
      "label": "본문",
      "value": "   ",
      "multiline": true,
      "error": "본문을 입력해 주세요."
    },
    {
      "type": "chips",
      "id": "tags",
      "label": "태그",
      "items": [
        "a",
        "b",
        "c",
        "d",
        "e",
        "f"
      ]
    },
    {
      "type": "text",
      "id": "tags-error",
      "value": "태그는 5개까지입니다.",
      "emphasis": "caption",
      "tone": "error"
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
      "type": "toast",
      "id": "toast",
      "value": "공지 게시판에는 운영자만 쓸 수 있어요",
      "tone": "error"
    }
  ],
  "flows": [
    {
      "name": "빈 칸으로 저장",
      "steps": [
        {
          "kind": "user",
          "text": "제목을 비우고 본문엔 공백만, 태그는 6개 넣고 저장한다",
          "focus": [
            "title",
            "content",
            "tags",
            "save"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\n  \"boardSlug\": \"dev\",\n  \"title\": \"\",\n  \"content\": \"   \",\n  \"tags\": [\n    \"a\",\n    \"b\",\n    \"c\",\n    \"d\",\n    \"e\",\n    \"f\"\n  ],\n  \"visibility\": \"PUBLIC\"\n}"
        },
        {
          "kind": "server",
          "text": "@Valid가 요청 DTO의 제약(@NotBlank·@Size)을 검사 → MethodArgumentNotValidException → @RestControllerAdvice가 ProblemDetail로 바꾼다"
        },
        {
          "kind": "server",
          "text": "저장 코드까지 가지 않는다 — 글도 태그도 생기지 않는다"
        },
        {
          "kind": "response",
          "status": 400,
          "headers": [
            "Content-Type: application/problem+json"
          ],
          "body": "{\n  \"status\": 400,\n  \"title\": \"Bad Request\",\n  \"detail\": \"입력값이 올바르지 않습니다.\",\n  \"errors\": [\n    {\n      \"field\": \"title\",\n      \"message\": \"제목을 입력해 주세요.\"\n    },\n    {\n      \"field\": \"content\",\n      \"message\": \"본문을 입력해 주세요.\"\n    },\n    {\n      \"field\": \"tags\",\n      \"message\": \"태그는 5개까지입니다.\"\n    }\n  ]\n}"
        },
        {
          "kind": "screen",
          "text": "errors[].field로 칸을 찾아 message를 칸 아래에 붙인다 — 틀린 칸이 한 번에 다 보인다",
          "focus": [
            "title",
            "content",
            "tags-error"
          ]
        }
      ]
    },
    {
      "name": "공지 게시판에 쓰기",
      "steps": [
        {
          "kind": "user",
          "text": "게시판을 '공지사항'으로 바꿔 저장한다",
          "focus": [
            "board",
            "save"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"boardSlug\": \"notice\", \"title\": \"[채점] 검증-실패-공지\", ...}"
        },
        {
          "kind": "server",
          "text": "입력은 맞다. 서비스가 board.write_role = ADMIN인데 작성자가 일반 회원임을 확인 → 권한 예외"
        },
        {
          "kind": "response",
          "status": 403,
          "headers": [
            "Content-Type: application/problem+json"
          ],
          "body": "{\"status\": 403, \"detail\": \"공지 게시판에는 운영자만 글을 쓸 수 있습니다.\"}"
        },
        {
          "kind": "screen",
          "text": "칸 오류가 아니라 화면 전체 알림으로 보여 준다",
          "focus": [
            "toast"
          ]
        }
      ]
    },
    {
      "name": "없는 게시판",
      "steps": [
        {
          "kind": "user",
          "text": "(오래된 화면) 사라진 게시판으로 저장한다",
          "focus": [
            "save"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"boardSlug\": \"nope\", ...}"
        },
        {
          "kind": "server",
          "text": "서비스가 게시판을 못 찾는다 → BoardNotFoundException"
        },
        {
          "kind": "response",
          "status": 404,
          "headers": [
            "Content-Type: application/problem+json"
          ],
          "body": "{\"status\": 404, \"detail\": \"게시판을 찾을 수 없습니다.\"}"
        },
        {
          "kind": "screen",
          "text": "'게시판이 없어졌어요. 다시 골라 주세요'"
        }
      ]
    }
  ]
}
```

## 만들 것

**입력 규칙**

| 필드 | 규칙 |
|---|---|
| `boardSlug` | 필수 |
| `title` | 필수, 공백만 있으면 안 됨, 200자 이하 |
| `content` | 필수, 공백만 있으면 안 됨 |
| `tags` | 없어도 됨(`null`이나 `[]`). 있으면 최대 5개, 각 이름 1~30자 |
| `visibility` | `PUBLIC` 또는 `FOLLOWERS`. **생략하면 `PUBLIC`** |

**게시판 규칙**

| 상황 | 상태 |
|---|---|
| 없는 `boardSlug` | `404` |
| 글쓰기가 운영자 전용인 게시판(`board.write_role = 'ADMIN'`, 예: `notice`)에 일반 회원(지금은 작성자 고정 = 김자바)이 쓴다 | `403` |

**에러 응답 형식** — 모든 에러(400·403·404)에 공통이다. 표준 형식인 RFC 9457 Problem Details를 쓴다.

- `Content-Type: application/problem+json`
- 본문에 `status`(숫자)와 사람이 읽을 `detail`을 담는다.
- Bean Validation으로 거절한 `400`이면 `errors` 배열에 **틀린 필드를 모두** 담는다. 첫 번째 필드만 담으면 안 된다. JSON 문법 오류처럼 요청 본문을 읽지 못한 `400`은 필드별 검증이 실행되지 않았으므로 `errors`를 생략한다.

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "입력값이 올바르지 않습니다.",
  "instance": "/api/posts",
  "errors": [
    { "field": "content", "message": "본문을 입력해 주세요." },
    { "field": "tags", "message": "태그는 5개까지입니다." }
  ]
}
```

검증에 실패한 요청은 아무것도 저장하지 않는다(글도, 새 태그도).

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- @Valid가 요청 DTO의 제약(@NotBlank·@Size)을 검사 → MethodArgumentNotValidException → @RestControllerAdvice가 ProblemDetail로 바꾼다
- 저장 코드까지 가지 않는다 — 글도 태그도 생기지 않는다
- 입력은 맞다. 서비스가 board.write_role = ADMIN인데 작성자가 일반 회원임을 확인 → 권한 예외
- 서비스가 게시판을 못 찾는다 → BoardNotFoundException

<details>
<summary>Controller — HTTP 연결</summary>

`PostController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 변경된 메서드: `create`.

</details>

<details>
<summary>DTO — 요청·응답 필드</summary>

`PostCreateRequest.java`. 필드 이름·타입·검증·응답 형태를 위 **만들 것**과 대조한다. 태그 원소에는 `@NotNull @Size`를 함께 둬 `tags: [null]`도 저장 전에 `400`으로 막는다.

</details>

<details>
<summary>MyBatis — 같은 검증·저장 계약의 대체 구현</summary>

아래 **MyBatis 대체 구현 코드** 접기의 10개 파일을 기본 JPA 스냅샷에 적용한다. `PostCreateRequest`와 `ApiExceptionHandler`는 그대로 사용하므로 V1~V12의 검증·ProblemDetail 응답도 같다.

`PostCreationMapper.xml`이 게시판·고정 작성자(회원 2번)를 조회하고 글·태그·연결 행을 INSERT한다. 태그는 DB에서 읽은 ID와 이름으로 중복을 판단하고 응답을 구성하므로 `spring`과 `Spring`을 함께 보내도 연결 행은 하나이며 응답 이름은 저장된 `spring`이다.

`PostService`의 `@Transactional`은 여러 INSERT를 한 트랜잭션으로 묶고, 게시판 권한을 저장 전에 검사한다. `PostController`는 MyBatis 서비스가 돌려준 응답 DTO로 `201`과 `Location`을 만든다. JPA와 MyBatis 양쪽에서 C1~C12와 실패 글·태그 무저장을 대조한다.

</details>

<details>
<summary>Service — 처리 순서</summary>

`PostService.java`. 위 서버 처리 순서가 어디에서 검증·조회·상태 변경으로 이어지는지 따라간다. 트랜잭션 경계는 아래 코드의 `@Transactional` 위치에서 확인한다.

</details>

<details>
<summary>예외 처리 — 실패 응답</summary>

`BoardNotFoundException.java`, `BoardWriteForbiddenException.java`, `ApiExceptionHandler.java`. 예외가 어떤 HTTP 상태와 오류 본문으로 바뀌는지 실패 계약과 대조한다. 변경된 메서드: `handleValidation`, `handleUnreadable`, `handleBoardNotFound`, `handleBoardWriteForbidden`.

</details>

## 직접 확인

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "V1",
      "title": "V1 빈 제목",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "dev",
        "title": "",
        "content": "본문",
        "tags": [],
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "V2",
      "title": "V2 제목 201자",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "dev",
        "title": "[채점] 검증-실패-0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "content": "본문",
        "tags": [],
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "V3",
      "title": "V3 공백 본문 + 태그 6개",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "dev",
        "title": "[채점] 검증-실패-본문태그",
        "content": "   ",
        "tags": [
          "a",
          "b",
          "c",
          "d",
          "e",
          "f"
        ],
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "V4",
      "title": "V4 없는 공개 범위",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "dev",
        "title": "[채점] 검증-실패-공개범위",
        "content": "본문",
        "tags": [],
        "visibility": "SECRET"
      }
    },
    {
      "id": "V5",
      "title": "V5 공개 범위 생략(통과)",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "dev",
        "title": "[채점] 검증-통과",
        "content": "본문",
        "tags": [
          "spring"
        ]
      }
    },
    {
      "id": "V6",
      "title": "V6 없는 게시판",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "nope",
        "title": "[채점] 검증-실패-게시판",
        "content": "본문",
        "tags": [],
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "V7",
      "title": "V7 운영자 전용 게시판",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "notice",
        "title": "[채점] 검증-실패-공지",
        "content": "본문",
        "tags": [],
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "V8",
      "title": "V8 제목 없음(null)",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "dev",
        "title": null,
        "content": "본문",
        "tags": [],
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "V9",
      "title": "V9 경계값 안쪽 — 제목 200자·태그 5개·태그 30자(통과)",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "dev",
        "title": "[채점] 검증-경계-000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "content": "본",
        "tags": [
          "spring",
          "jpa",
          "java",
          "mysql",
          "[채점]경계-xxxxxxxxxxxxxxxxxxxxxxx"
        ],
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "V10",
      "title": "V10 하한 안쪽 — 제목 1자(통과)",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "dev",
        "title": "가",
        "content": "본문",
        "tags": [],
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "V11",
      "title": "V11 null 태그 이름(실패)",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "dev",
        "title": "[채점] 검증-실패-null태그",
        "content": "본문",
        "tags": [
          null
        ],
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "V12",
      "title": "V12 같은 DB 태그의 대소문자 입력",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "dev",
        "title": "[채점] 검증-태그대소문자",
        "content": "본문",
        "tags": [
          "spring",
          "Spring"
        ],
        "visibility": "PUBLIC"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
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
      "id": "C2",
      "request": "V2",
      "expect": {
        "status": 400,
        "json": [
          {
            "path": "$.errors[*].field",
            "contains": "title"
          }
        ]
      }
    },
    {
      "id": "C3",
      "request": "V3",
      "expect": {
        "status": 400,
        "json": [
          {
            "path": "$.errors[*].field",
            "contains": "content"
          },
          {
            "path": "$.errors[*].field",
            "contains": "tags"
          }
        ]
      }
    },
    {
      "id": "C4",
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
      "id": "C5",
      "request": "V5",
      "expect": {
        "status": 201,
        "json": [
          {
            "path": "$.visibility",
            "equals": "PUBLIC"
          }
        ]
      }
    },
    {
      "id": "C6",
      "request": "V6",
      "expect": {
        "status": 404,
        "headers": {
          "Content-Type": {
            "contains": "application/problem+json"
          }
        },
        "json": [
          {
            "path": "$.detail",
            "exists": true
          }
        ]
      }
    },
    {
      "id": "C7",
      "request": "V7",
      "expect": {
        "status": 403,
        "headers": {
          "Content-Type": {
            "contains": "application/problem+json"
          }
        },
        "json": [
          {
            "path": "$.detail",
            "exists": true
          }
        ]
      }
    },
    {
      "id": "C8",
      "all": [
        {
          "request": "V1",
          "expect": {
            "json": [
              {
                "path": "$.status",
                "equals": "{{V1.status}}"
              },
              {
                "path": "$.trace",
                "exists": false
              },
              {
                "path": "$.exception",
                "exists": false
              }
            ],
            "bodyText": {
              "notContains": "Exception"
            }
          }
        },
        {
          "request": "V2",
          "expect": {
            "json": [
              {
                "path": "$.status",
                "equals": "{{V2.status}}"
              },
              {
                "path": "$.trace",
                "exists": false
              },
              {
                "path": "$.exception",
                "exists": false
              }
            ],
            "bodyText": {
              "notContains": "Exception"
            }
          }
        },
        {
          "request": "V3",
          "expect": {
            "json": [
              {
                "path": "$.status",
                "equals": "{{V3.status}}"
              },
              {
                "path": "$.trace",
                "exists": false
              },
              {
                "path": "$.exception",
                "exists": false
              }
            ],
            "bodyText": {
              "notContains": "Exception"
            }
          }
        },
        {
          "request": "V4",
          "expect": {
            "json": [
              {
                "path": "$.status",
                "equals": "{{V4.status}}"
              },
              {
                "path": "$.trace",
                "exists": false
              },
              {
                "path": "$.exception",
                "exists": false
              }
            ],
            "bodyText": {
              "notContains": "Exception"
            }
          }
        },
        {
          "request": "V6",
          "expect": {
            "json": [
              {
                "path": "$.status",
                "equals": "{{V6.status}}"
              },
              {
                "path": "$.trace",
                "exists": false
              },
              {
                "path": "$.exception",
                "exists": false
              }
            ],
            "bodyText": {
              "notContains": "Exception"
            }
          }
        },
        {
          "request": "V7",
          "expect": {
            "json": [
              {
                "path": "$.status",
                "equals": "{{V7.status}}"
              },
              {
                "path": "$.trace",
                "exists": false
              },
              {
                "path": "$.exception",
                "exists": false
              }
            ],
            "bodyText": {
              "notContains": "Exception"
            }
          }
        }
      ]
    },
    {
      "id": "C9",
      "request": "V8",
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
      "id": "C10",
      "all": [
        {
          "request": "V9",
          "expect": {
            "status": 201,
            "json": [
              {
                "path": "$.title",
                "equals": "[채점] 검증-경계-000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
              },
              {
                "path": "$.tags",
                "length": 5
              }
            ]
          }
        },
        {
          "request": "V10",
          "expect": {
            "status": 201,
            "json": [
              {
                "path": "$.title",
                "equals": "가"
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C11",
      "request": "V11",
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
            "contains": "tags[0]"
          }
        ]
      }
    },
    {
      "id": "C12",
      "request": "V12",
      "expect": {
        "status": 201,
        "json": [
          {
            "path": "$.tags",
            "length": 1
          },
          {
            "path": "$.tags[0]",
            "equals": "spring"
          }
        ]
      }
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). 요청은 위 V1~V12를 그대로 쓴다. 잘못된 입력은 모두 `500`이 아니라 정해진 `4xx`여야 한다(1-2~1-4에서 관찰한 `500`이 여기서 사라진다).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | V1 | `400`, `Content-Type: application/problem+json`, `errors`에 `field`가 `title`인 항목 |
| C2 | V2 | `400`, `errors`에 `title` |
| C3 | V3 | `400`, `errors`에 `content`와 `tags`가 **둘 다** 있다 |
| C4 | V4 | `400`, `Content-Type: application/problem+json`(`errors`는 없어도 된다) |
| C5 | V5 | `201`, 응답 `visibility` = `PUBLIC` |
| C6 | V6 | `404`, `Content-Type: application/problem+json`, `detail`이 있다 |
| C7 | V7 | `403`, `Content-Type: application/problem+json`, `detail`이 있다 |
| C8 | 아무 오류 응답 | 본문 `status` 값이 응답 상태 코드와 같다. 스택 트레이스·예외 클래스 이름이 보이지 않는다 |
| C9 | V8 | `400`(1-2~1-4에서는 `500`), `Content-Type: application/problem+json`, `errors`에 `title` |
| C10 | V9·V10 | 경계값 바로 안쪽은 통과한다 — 제목 정확히 200자·태그 정확히 5개·태그 하나 정확히 30자(V9), 제목 1자(V10) 모두 `201` |
| C11 | V11 | `tags: [null]`은 `400`, `errors`에 `tags[0]`이 있다. D1에서 글이 저장되지 않은 것도 확인한다 |
| C12 | V12 | `201`, 응답 태그는 DB에 저장된 `spring` 하나다 |
| D1 | `SELECT COUNT(*) FROM post WHERE title LIKE '[채점] 검증-실패%'` | `0` |
| D2 | `SELECT COUNT(*) FROM tag WHERE name IN ('a','b','c','d','e','f')` | `0` — 실패한 요청이 태그를 만들지 않았다 |
| D3 | `SELECT COUNT(*) FROM post_tag WHERE post_id = (SELECT MAX(id) FROM post WHERE title = '[채점] 검증-태그대소문자')` | `1` — 대소문자만 다른 이름을 한 태그로 연결했다 |
| R1 | 입력 검증 | 요청 DTO에 Bean Validation 애노테이션(`@NotBlank`, `@Size` 등) + 컨트롤러에 `@Valid` |
| R2 | 에러 응답 | `@RestControllerAdvice` 한 곳에서 `ProblemDetail`로 만든다. 컨트롤러마다 `try-catch`가 없다 |
| R3 | 업무 오류 | 게시판 없음·권한 없음은 서비스가 판단하고, 의미가 드러나는 예외(예: `BoardNotFoundException`)로 던진다 |
| R4 | 순서 | 검증·게시판 확인이 저장보다 먼저이거나, 같은 트랜잭션이라 실패 시 함께 롤백된다 |
| R5 | 기본값 | `visibility` 생략 → `PUBLIC`을 한 곳(DTO 또는 서비스)에서 정한다 |

## 필요한 지식

- [W10 검증은 어디서 하나](../../docs/knowledge/W10-where-to-validate.md) — 프론트에서 막아도 서버가 또 검사하는 이유
- [W10 — 서버: DTO 제약과 검증 오류 응답](../../docs/knowledge/W10-where-to-validate.md#52-서버-dto-제약과-검증-오류-응답)
- [W08 예외는 어디서 잡나](../../docs/knowledge/W08-where-to-handle-exceptions.md) — 컨트롤러별 처리와 전역 Advice
- [P03 — 요청 검증](../../docs/knowledge/P03-annotations-cheatsheet.md#24-요청-검증) · [예외 응답](../../docs/knowledge/P03-annotations-cheatsheet.md#25-예외-응답)
- [S05 — RFC 9457 응답에 ProblemDetail과 전역 Advice를 어떻게 쓰나](../../docs/knowledge/S05-mvc-request-flow.md#q5-rfc-9457-응답에-problemdetail과-전역-advice를-어떻게-쓰는가)
- [P16 — Enum은 이름과 표시값을 분리한다](../../docs/knowledge/P16-json-jackson-practical.md#27-enum은-이름과-표시값을-분리한다) — 나중에 `visibility`를 Enum으로 바꿀 때 읽을 자료

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 어떤 예외가 나나</summary>

V4의 `SECRET`은 지금 `String` 필드의 `@Pattern`에 걸리므로 `MethodArgumentNotValidException`이 난다. 깨진 JSON처럼 요청을 객체로 만들 수 없으면 `HttpMessageNotReadableException`이 난다. 서로 다른 예외라 Advice에서 각각 처리한다.
</details>

<details>
<summary>힌트 2 — problem+json</summary>

`ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "...")`로 만들고 `setProperty("errors", 목록)`. `@ExceptionHandler` 메서드가 `ProblemDetail`을 반환하면 Spring이 `application/problem+json`으로 내보낸다. `ResponseEntityExceptionHandler`를 상속하는 방법도 있다.
</details>

<details>
<summary>힌트 3 — 403과 404</summary>

`board.write_role`이 `ADMIN`인데 작성자 `member.role`이 `ADMIN`이 아니면 403. 이 판단은 서비스에서 하고, 예외 → 상태 코드 매핑은 Advice에서 한다.
</details>

## 다음 단계

[1-6. 토큰으로 작성자 정하기](1-6-token-auth.md) — 고정된 작성자(김자바)를 요청한 사람으로 바꾼다.
