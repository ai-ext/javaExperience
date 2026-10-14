# 2-4. 쿼리 수 줄이기(N+1)

## 상황

목록 API를 호출하고 SQL 로그(`org.hibernate.SQL: debug`)를 보면 글 목록을 한 번 가져온 뒤 **글마다** 작성자 조회·태그 조회가 따로 나간다. 20개를 보여 주면 40번 넘게 DB에 다녀온다. 사용자가 늘면 DB가 먼저 버티지 못한다.

**응답은 그대로 두고, 한 번 호출에 나가는 SQL 수를 페이지 크기와 상관없이 일정하게** 만든다. 그리고 그 사실을 테스트로 고정한다(다시 늘어나면 테스트가 깨지게).

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "목록 화면 뒤의 SQL",
  "summary": "화면은 같아도 서버 로그를 보면 글마다 쿼리가 따로 나간다. 사용자가 늘면 DB가 먼저 지친다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "자유 게시판"
    },
    {
      "type": "list",
      "id": "posts",
      "items": [
        {
          "id": "row-21",
          "title": "자유글 10",
          "meta": "박디비 · 조회 10",
          "badge": "mysql"
        },
        {
          "id": "row-20",
          "title": "자유글 09",
          "meta": "이스프링 · 조회 9",
          "badge": "java"
        },
        {
          "id": "row-19",
          "title": "자유글 08",
          "meta": "박디비 · 조회 8"
        },
        {
          "id": "row-18",
          "title": "자유글 07",
          "meta": "이스프링 · 조회 7"
        },
        {
          "id": "row-17",
          "title": "자유글 06",
          "meta": "박디비 · 조회 6"
        }
      ],
      "footer": "20개 보기"
    },
    {
      "type": "code",
      "id": "sql-log",
      "label": "고치기 전 SQL 로그",
      "value": "select ... from post ... limit 20\nselect ... from member where id=?   ← 글마다\nselect ... from post_tag ... where post_id=?   ← 글마다\n… (40줄 이상)"
    },
    {
      "type": "code",
      "id": "sql-log-after",
      "label": "고친 뒤 SQL 로그",
      "value": "select ... from post p join member m ... limit 20\nselect count(*) ...\nselect ... from post_tag ... where post_id in (?, ?, …)"
    }
  ],
  "flows": [
    {
      "name": "고치기 전",
      "steps": [
        {
          "kind": "user",
          "text": "목록을 20개씩 본다",
          "focus": [
            "posts"
          ]
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/boards/free/posts?size=20"
        },
        {
          "kind": "db",
          "sql": "SELECT ... FROM post ... LIMIT 20"
        },
        {
          "kind": "db",
          "sql": "SELECT * FROM member WHERE id = ?",
          "note": "작성자가 지연 로딩이라 글마다 한 번씩"
        },
        {
          "kind": "db",
          "sql": "SELECT ... FROM post_tag JOIN tag ... WHERE post_id = ?",
          "note": "태그도 글마다 한 번씩"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"items\": [20개], ...}"
        },
        {
          "kind": "screen",
          "text": "응답은 같지만 SQL이 1 + 20 + 20번",
          "focus": [
            "sql-log"
          ]
        }
      ]
    },
    {
      "name": "고친 뒤",
      "steps": [
        {
          "kind": "user",
          "text": "같은 목록을 본다",
          "focus": [
            "posts"
          ]
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/boards/free/posts?size=20"
        },
        {
          "kind": "db",
          "sql": "SELECT p.*, m.* FROM post p JOIN member m ON m.id = p.author_id ... LIMIT 20",
          "note": "작성자는 fetch join"
        },
        {
          "kind": "db",
          "sql": "SELECT ... FROM post_tag JOIN tag ... WHERE post_id IN (21, 20, …)",
          "note": "태그는 IN 한 번(배치 조회)"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"items\": [20개], ...}"
        },
        {
          "kind": "screen",
          "text": "size를 5에서 20으로 늘려도 SQL 수가 늘지 않는다 — PostListQueryCountTest가 이걸 지킨다",
          "focus": [
            "sql-log-after"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것

1. 2-3의 게시판 목록 API를 고쳐 SQL 문장 수를 줄인다.
   - 기준: `size=20`의 문장 수가 `size=5`보다 **많지 않고**(글 수에 비례해 늘지 않는다), 둘 다 **5개 이하**다(목록·건수·태그 등).
   - 참고: Spring Data의 `Page`는 가져온 글이 `size`보다 적으면(마지막 페이지) 건수 쿼리를 생략한다. 자유 게시판은 13개라 `size=20`이 한 문장 적게 나올 수 있다 — 정상이다.
   - 보는 사람 확인용 서브쿼리는 목록 쿼리 안에 들어가므로 따로 세지 않는다.
2. 테스트 클래스 **`PostListQueryCountTest`** 를 만든다(이름 그대로 — 채점에서 이 이름으로 실행한다).
   - `@SpringBootTest` + MockMvc로 `GET /api/boards/free/posts?size=5`와 `size=20`을 호출한다.
   - Hibernate가 실행한 SQL 문장 수를 세서 위 기준을 단언한다.
   - 테스트 DB에는 시나리오 데이터(`free` 게시판 글 13~14개)가 이미 들어 있다.

응답 JSON은 2-3과 완전히 같아야 한다.

## 구현 가이드

이 단계의 화면·DB 흐름을 아래 참조 파일과 연결한다. 요구 계약을 먼저 구현하고, 필요한 파일 역할만 펼쳐 전체 코드와 비교한다.

구현 순서에서 확인할 흐름:
- 작성자가 지연 로딩이라 글마다 한 번씩
- 태그도 글마다 한 번씩
- 작성자는 fetch join
- 태그는 IN 한 번(배치 조회)

<details>
<summary>Service</summary>

`PostQueryService.java`: 조회·검증·상태 변경의 순서를 화면 흐름과 대조한다.

</details>

<details>
<summary>JPA / Repository</summary>

`PostRepository.java`: JPA 조회 조건을 DB 예시와 대조한다.

</details>

<details>
<summary>설정·보조 코드</summary>

`application.yml`: 이 파일의 변경이 화면 흐름에 필요한 위치를 확인한다.

</details>

<details>
<summary>테스트</summary>

`PostListQueryCountTest.java`, `application-test.yml`: 요청과 기대값을 채점 기준과 대조한다.

</details>

<details>
<summary>MyBatis — 페이지 크기가 늘어도 SELECT 수를 고정하기</summary>

아래 **MyBatis 대체 구현 코드**의 11개 파일을 이 단계 전체 소스에 적용한다. 2-3의 조회 권한 조건은 `PostVisibilityMapper.xml`의 목록·COUNT 공통 조건으로 유지한다.

목록 SQL에서 작성자를 JOIN해 한 번에 읽고, 페이지에 나온 글 ID를 모아 `post_tag`·`tag`를 `IN` 쿼리 한 번으로 읽는다. Mapper 실행 순서는 게시판 ID, 목록, COUNT, 태그로 페이지 크기와 관계없이 SELECT 4개다. 글마다 작성자·태그를 다시 읽는 N+1 루프는 없다.

기본 JPA 테스트의 Hibernate `Statistics`는 MyBatis SQL을 세지 못한다. 대체 코드의 `MyBatisStatementCounter`는 MyBatis `Executor.query`를 가로채 요청 스레드의 SELECT 호출 수를 세고, `PostListQueryCountTest`가 `size=5`와 `size=20`에서 **실제로 0보다 큰 수**인지, 두 수가 같은지, 5개 이하인지 검사한다.

격리 테스트 DB에서는 두 크기 모두 4개였다. JPA·MyBatis 양쪽의 C1 응답과 2-3 접근 조건도 대조한다.

</details>

## 직접 확인

앱 로그에서 SQL 줄 수는 실행 패널의 Q 요청으로 관찰한다. API 주소는 페이지 상단 공통 입력을 사용하고, Postman 설정은 접어서 확인할 수 있다.

```bash
./gradlew test --tests '*PostListQueryCountTest'
```

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    {
      "id": "Q",
      "title": "free 목록(size=20)",
      "method": "GET",
      "path": "/api/boards/free/posts?size=20"
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "Q",
      "expect": {
        "status": 200,
        "json": [
          {
            "path": "$.items[*].id",
            "equals": [
              21,
              20,
              19,
              18,
              17,
              16,
              15,
              14,
              13,
              12,
              9,
              5,
              4
            ]
          },
          {
            "path": "$.items[*].author.id",
            "length": 13
          },
          {
            "path": "$.items[*].tags",
            "length": 13
          },
          {
            "path": "$.items[0].tags",
            "equals": [
              "mysql"
            ]
          },
          {
            "path": "$.items[0].author.id",
            "equals": 4
          },
          {
            "path": "$.items[0].author.nickname",
            "equals": "박디비"
          },
          {
            "path": "$.items[1].tags",
            "equals": [
              "java"
            ]
          }
        ]
      }
    }
  ]
}
```

## 채점 기준

C = HTTP 확인(필수), T = 테스트 실행(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 Q | `200`, id 순서 `21~12, 9, 5, 4`(13개). 각 항목의 `author`·`tags`가 2-2와 같다(예: 21번 `tags`=[`mysql`], 작성자 박디비) |
| T1 | `./gradlew test --tests '*PostListQueryCountTest'` | 통과 |
| R1 | 측정 방법 | 테스트가 실제 SQL 수를 센다(Hibernate `Statistics`의 `getPrepareStatementCount()`, 또는 datasource-proxy 같은 도구). 호출 전에 카운트를 초기화한다 |
| R2 | 기준 단언 | `size=20`의 문장 수가 `size=5` 이하라는 것(글 수에 비례하지 않음)과 상한(5 이하)을 둘 다 단언한다 |
| R3 | 해결 방식 | fetch join·`@BatchSize`/`default_batch_fetch_size`·DTO 조회+태그 IN 조회 중 무엇을 썼는지, **컬렉션(태그) fetch join + 페이징**을 함께 쓰지 않았는지(메모리 페이징 경고 `HHH90003004`) |
| R4 | 응답 불변 | 쿼리를 바꾸면서 응답 모양·정렬·필터(2-3 규칙)가 바뀌지 않았다 |

## 필요한 지식

- [S09 — LAZY와 N+1](../../docs/knowledge/S09-jpa-hibernate.md#lazy와-n1)
- [P20 JPA 엔티티·연관관계 매핑](../../docs/knowledge/P20-jpa-entity-mapping.md)
- [W03 DB 접근 방식 총비교](../../docs/knowledge/W03-db-access-comparison.md) — 엔티티 조회 vs DTO 조회
- [V04 테스트 DB 전략](../../docs/knowledge/V04-test-db-strategy.md) — 실제 MySQL로 테스트하는 이유
- [S18 Spring Boot 테스트](../../docs/knowledge/S18-spring-testing.md)

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — SQL 세기</summary>

`src/test/resources/application-test.yml`에 `spring.jpa.properties.hibernate.generate_statistics: true`를 켠다. 테스트 클래스에 `@TestPropertySource`로 따로 켜면 스프링 컨텍스트가 하나 더 생기고, 같은 테스트 DB에 스키마 초기화가 다시 돌아 "Table already exists"로 실패한다.

그다음 `EntityManagerFactory`를 주입받아 `emf.unwrap(SessionFactory.class).getStatistics()`를 얻는다. 호출 직전 `statistics.clear()`, 호출 뒤 `statistics.getPrepareStatementCount()`. </details>

<details>
<summary>힌트 2 — 가장 쉬운 해결</summary>

작성자(`@ManyToOne`)는 목록 쿼리에 `join fetch`로 붙이고, 태그(컬렉션)는 `spring.jpa.properties.hibernate.default_batch_fetch_size: 100`으로 IN 쿼리 한 번에 가져오게 한다. 태그를 fetch join하면 페이징이 메모리에서 일어난다.
</details>

## 다음 단계

[2-5. JPA 쿼리 작성](2-5-guided-jpa-query.md) — SQL JOIN 결과를 Repository 쿼리와 DTO로 옮긴다.
