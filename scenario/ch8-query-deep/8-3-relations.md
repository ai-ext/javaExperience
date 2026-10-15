# 8-3. 관계 쿼리 — 맞팔·맞팔 추천·친구의 친구

> 학습용 DB(`practice`) — 앱을 `practice` 프로파일로 띄운다(8-1 참고).

## 상황

> "프로필에 '맞팔' 목록, 사이드바에 '나를 팔로우하는데 나는 안 한 사람'과 '알 수도 있는 사람'을 보여 주세요. 정지·탈퇴한 사람, 차단한 사람은 추천하면 안 돼요."

`follow` 테이블 하나를 **자기 자신과 JOIN**해서 관계를 찾는 쿼리들이다. "있는 것"뿐 아니라 "**없는 것**"(내가 아직 팔로우하지 않은)을 찾아야 해서 `NOT EXISTS`·`LEFT JOIN … IS NULL`을 쓴다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "사이드바 — 팔로우 추천",
  "summary": "follow 테이블을 자기 자신과 JOIN해서 관계를 찾는다. '아직 안 한 것'은 NOT EXISTS로.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "추천",
      "right": "회원 7"
    },
    {
      "type": "list",
      "id": "suggest",
      "label": "알 수도 있는 사람",
      "items": [
        {
          "id": "s3",
          "title": "자바초보탈출",
          "meta": "겹치는 친구 3명"
        },
        {
          "id": "s10",
          "title": "도커고래",
          "meta": "겹치는 친구 3명"
        },
        {
          "id": "s11",
          "title": "커피와코드",
          "meta": "겹치는 친구 2명"
        }
      ]
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        {
          "id": "follow",
          "label": "팔로우",
          "variant": "primary"
        }
      ]
    }
  ],
  "flows": [
    {
      "name": "알 수도 있는 사람",
      "steps": [
        {
          "kind": "user",
          "text": "사이드바를 연다",
          "focus": [
            "suggest"
          ]
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/me/suggestions?limit=5",
          "headers": [
            "Authorization: Bearer tok-p07"
          ]
        },
        {
          "kind": "db",
          "sql": "SELECT f2.followee_id, COUNT(*) AS c\nFROM follow f1 JOIN follow f2 ON f2.follower_id = f1.followee_id\nJOIN member m ON m.id = f2.followee_id AND m.member_status = 'ACTIVE'\nWHERE f1.follower_id = 7 AND f2.followee_id <> 7\n  AND NOT EXISTS (SELECT 1 FROM follow x WHERE x.follower_id = 7 AND x.followee_id = f2.followee_id)\n  AND NOT EXISTS (SELECT 1 FROM member_block b WHERE ...)\nGROUP BY f2.followee_id ORDER BY c DESC, f2.followee_id LIMIT 5"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "[{\"memberId\": 3, \"nickname\": \"자바초보탈출\", \"mutualCount\": 3}, {\"memberId\": 10, \"mutualCount\": 3}, {\"memberId\": 11, \"mutualCount\": 2}, …]"
        },
        {
          "kind": "screen",
          "text": "나·이미 팔로우한 사람·차단 관계·정지/탈퇴 회원은 나오지 않는다",
          "focus": [
            "s3",
            "s10"
          ]
        }
      ]
    },
    {
      "name": "맞팔 목록",
      "steps": [
        {
          "kind": "user",
          "text": "회원 2의 프로필에서 '맞팔'을 연다"
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/members/2/mutuals"
        },
        {
          "kind": "db",
          "sql": "SELECT a.followee_id FROM follow a JOIN follow b ON b.follower_id = a.followee_id AND b.followee_id = a.follower_id WHERE a.follower_id = 2 ORDER BY 1"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "[3, 4]"
        },
        {
          "kind": "screen",
          "text": "서로 팔로우하는 사람만"
        }
      ]
    }
  ]
}
```

## 만들 것

| 메서드·경로 | 의미 | 인증 |
|---|---|---|
| `GET /api/members/{id}/mutuals` | 그 회원과 서로 팔로우하는 회원 id 목록(작은 순) | 필요 없음 |
| `GET /api/me/follow-back` | 나를 팔로우하지만 내가 팔로우하지 않는 **활성(`ACTIVE`)** 회원 id 목록(작은 순) | 필요 |
| `GET /api/me/suggestions?limit=5` | 친구의 친구 추천: 내가 팔로우하는 사람들이 팔로우하는 사람 중 **나 아님·아직 안 팔로우·차단 관계 없음·활성**. 겹치는 사람 수 많은 순 → 같으면 id 작은 순. `limit` 1~20(기본 5) | 필요 |

```json
// mutuals, follow-back
[3, 4]
// suggestions
[ { "memberId": 3, "nickname": "자바초보탈출", "mutualCount": 3 } ]
```

## 구현 가이드

이 단계의 화면·DB 흐름을 아래 참조 파일과 연결한다. 요구 계약을 먼저 구현하고, 필요한 파일 역할만 펼쳐 전체 코드와 비교한다.

<details>
<summary>Controller</summary>

`RelationController.java`는 공개 맞팔 조회와 인증이 필요한 내 목록을 나눈다. `@LoginMember`가 없으면 `follow-back`·`suggestions`에서 401을 반환한다. 추천 `limit`은 1~20이며 생략할 때만 5를 사용한다. `@RequestParam(defaultValue = "5")`는 `?limit=`도 5로 바꾸므로 이 계약에는 쓰지 않는다.

```java
@GetMapping("/api/members/{id}/mutuals")
public List<Long> mutuals(@PathVariable Long id) {
    return relationService.mutuals(id);
}

@GetMapping("/api/me/follow-back")
public List<Long> followBack(@LoginMember AuthenticatedMember me) {
    return relationService.followBack(requireLogin(me).id());
}

@GetMapping("/api/me/suggestions")
public List<SuggestionResponse> suggestions(
        @RequestParam(value = "limit", required = false) String limit,
        @LoginMember AuthenticatedMember me) {
    return relationService.suggestions(requireLogin(me).id(), parseLimit(limit));
}

private int parseLimit(String raw) {
    if (raw == null) return 5;
    if (!raw.matches("[0-9]+")) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
    try {
        int value = Integer.parseInt(raw);
        if (value >= 1 && value <= 20) return value;
    } catch (NumberFormatException ignored) { }
    throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
}
```

</details>

<details>
<summary>JPA / Repository</summary>

`RelationQueryRepository.java`는 네이티브 SQL 세 개를 선언한다. 맞팔은 역방향 follow 행의 `EXISTS`, 맞팔하지 않은 나의 팔로워는 `NOT EXISTS`, 친구의 친구는 `follow` 자기 JOIN 뒤 `NOT EXISTS` 두 개로 기존 팔로우와 차단 관계를 제외한다. 추천은 `ACTIVE`만 남기고 DB에서 `GROUP BY`·정렬·`LIMIT`까지 한다.

```sql
SELECT m.id AS memberId, m.nickname, COUNT(*) AS mutualCount
  FROM follow f1
  JOIN follow f2 ON f2.follower_id = f1.followee_id
  JOIN member m ON m.id = f2.followee_id
 WHERE f1.follower_id = :memberId
   AND f2.followee_id <> :memberId
   AND m.member_status = 'ACTIVE'
   AND NOT EXISTS (SELECT 1 FROM follow x
                    WHERE x.follower_id = :memberId AND x.followee_id = f2.followee_id)
   AND NOT EXISTS (SELECT 1 FROM member_block b
                    WHERE (b.blocker_id = :memberId AND b.blocked_id = f2.followee_id)
                       OR (b.blocked_id = :memberId AND b.blocker_id = f2.followee_id))
 GROUP BY m.id, m.nickname
 ORDER BY mutualCount DESC, m.id ASC
 LIMIT :limit;
```

`follow`에 같은 방향의 중복 행이 없다면 `COUNT(*)`는 추천 후보를 팔로우하는 내 팔로잉 수다. `NOT IN`은 서브쿼리에 `NULL`이 섞일 때 결과가 비는 함정이 있으므로 `NOT EXISTS`로 쓴다. MyBatis 선택 경로에서는 `MyBatisRelationMapper.xml`의 세 `<select>`에 같은 조건을 둔다.

</details>

<details>
<summary>Service</summary>

`RelationService.java`는 각 HTTP 요청당 Repository 메서드 한 번을 호출한다. 추천 행만 응답 DTO로 옮긴다. 조회 전용이므로 쓰기 트랜잭션이나 상태 변경은 없다.

```java
@Transactional(readOnly = true)
public List<SuggestionResponse> suggestions(Long memberId, int limit) {
    return relationQueryRepository.findSuggestions(memberId, limit).stream()
            .map(r -> new SuggestionResponse(r.getMemberId(), r.getNickname(), r.getMutualCount()))
            .toList();
}
```

</details>

<details>
<summary>DTO / 결과 행</summary>

`SuggestionResponse.java`는 JSON 응답, `SuggestionRow.java`는 JPA 네이티브 SQL의 결과 행 프로젝션이다. SQL 별칭 `memberId`·`mutualCount`를 getter 이름에 맞춘다.

```java
public record SuggestionResponse(Long memberId, String nickname, long mutualCount) {}

public interface SuggestionRow {
    Long getMemberId();
    String getNickname();
    Long getMutualCount();
}
```

MyBatis에서는 `SuggestionRow`를 setter가 있는 결과 클래스로 바꾸고 `MyBatisRelationMapper.java`·`.xml`을 사용한다. 아래 **MyBatis 대체 구현 코드**에서 Java와 XML 전문을 펼쳐 볼 수 있다.

</details>

## 직접 확인

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "F1",
      "title": "회원 2의 맞팔",
      "method": "GET",
      "path": "/api/members/2/mutuals"
    },
    {
      "id": "F2",
      "title": "회원 4의 맞팔",
      "method": "GET",
      "path": "/api/members/4/mutuals"
    },
    {
      "id": "F3",
      "title": "회원 2 — 나만 팔로우받는 회원",
      "method": "GET",
      "path": "/api/me/follow-back",
      "headers": {
        "Authorization": "Bearer tok-p02"
      }
    },
    {
      "id": "F4",
      "title": "회원 7 — 추천 5명",
      "method": "GET",
      "path": "/api/me/suggestions?limit=5",
      "headers": {
        "Authorization": "Bearer tok-p07"
      }
    },
    {
      "id": "F5",
      "title": "회원 10 — 추천 3명",
      "method": "GET",
      "path": "/api/me/suggestions?limit=3",
      "headers": {
        "Authorization": "Bearer tok-p10"
      }
    },
    {
      "id": "F6",
      "title": "토큰 없음",
      "method": "GET",
      "path": "/api/me/follow-back"
    },
    {
      "id": "F7",
      "title": "빈 추천 건수",
      "method": "GET",
      "path": "/api/me/suggestions?limit=",
      "headers": {
        "Authorization": "Bearer tok-p07"
      }
    }
  ],
  "checks": [
    {
      "id": "C1",
      "all": [
        {
          "request": "F1",
          "expect": {
            "json": [
              {
                "path": "$",
                "equals": [
                  3,
                  4
                ]
              }
            ]
          }
        },
        {
          "request": "F2",
          "expect": {
            "json": [
              {
                "path": "$",
                "equals": [
                  2,
                  5,
                  19
                ]
              }
            ]
          }
        }
      ]
    },
    {
      "id": "C2",
      "request": "F3",
      "expect": {
        "json": [
          {
            "path": "$",
            "equals": [
              8,
              9,
              11,
              12,
              15,
              16,
              20,
              21,
              22,
              24,
              27
            ]
          }
        ]
      }
    },
    {
      "id": "C3",
      "request": "F4",
      "expect": {
        "json": [
          {
            "path": "$[*].memberId",
            "equals": [
              3,
              10,
              11,
              13,
              17
            ]
          },
          {
            "path": "$[*].mutualCount",
            "equals": [
              3,
              3,
              2,
              1,
              1
            ]
          }
        ]
      }
    },
    {
      "id": "C4",
      "request": "F5",
      "expect": {
        "json": [
          {
            "path": "$[*].memberId",
            "equals": [
              4,
              2,
              5
            ]
          },
          {
            "path": "$[*].mutualCount",
            "equals": [
              3,
              2,
              2
            ]
          }
        ]
      }
    },
    {
      "id": "C5",
      "request": "F6",
      "expect": {
        "status": 401
      }
    },
    {
      "id": "C6",
      "request": "F7",
      "expect": {
        "status": 400
      }
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | F1 / F2 | `[3, 4]` / `[2, 5, 19]` |
| C2 | F3 | `[8, 9, 11, 12, 15, 16, 20, 21, 22, 24, 27]` — 정지(28)·탈퇴(29) 회원은 빠진다 |
| C3 | F4 | `(3, 3) (10, 3) (11, 2) (13, 1) (17, 1)` |
| C4 | F5 | `(4, 3) (2, 2) (5, 2)` |
| C5 | F6 | `401` |
| C6 | F7 | 빈 `limit`은 생략과 달리 `400` |
| R1 | 없는 것 찾기 | "아직 안 팔로우"를 `NOT EXISTS` 또는 `LEFT JOIN … IS NULL`로 표현하고, 둘의 차이를 안다(`NOT IN`은 NULL이 끼면 결과가 비는 함정) |
| R2 | 조건 누락 | 나 자신·차단(양방향)·비활성 회원 제외가 모두 쿼리에 있다 |
| R3 | 인덱스 | `follow`의 `(follower_id, followee_id)` 유니크·`(followee_id, follower_id)` 인덱스가 각 쿼리 방향에 쓰이는지 `EXPLAIN`으로 봤다 |

## 필요한 지식

- [R04 SQL로 데이터 다루기 — JOIN](../../docs/knowledge/R04-sql-crud-join.md)
- [R05 인덱스와 B-Tree](../../docs/knowledge/R05-index-btree.md) — 복합 인덱스 컬럼 순서
- [P21 QueryDSL 설정과 동적 쿼리](../../docs/knowledge/P21-querydsl-setup.md) — 서브쿼리 표현

## 다음 단계

[8-4. 조합 검색](8-4-dynamic-search.md)
