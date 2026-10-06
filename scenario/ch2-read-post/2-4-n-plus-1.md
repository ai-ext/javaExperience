# 2-4. 쿼리 수 줄이기(N+1)

## 상황

목록 API를 호출하고 SQL 로그(`org.hibernate.SQL: debug`)를 보면 글 목록을 한 번 가져온 뒤 **글마다** 작성자 조회·태그 조회가 따로 나간다. 20개를 보여 주면 40번 넘게 DB에 다녀온다. 사용자가 늘면 DB가 먼저 버티지 못한다.

**응답은 그대로 두고, 한 번 호출에 나가는 SQL 수를 페이지 크기와 상관없이 일정하게** 만든다. 그리고 그 사실을 테스트로 고정한다(다시 늘어나면 테스트가 깨지게).

## 만들 것

1. 2-3의 게시판 목록 API를 고쳐 SQL 문장 수를 줄인다.
   - 기준: `size=5`와 `size=20`의 문장 수가 **같고**, **5개 이하**다(목록·건수·태그 등).
   - 보는 사람 확인용 서브쿼리는 목록 쿼리 안에 들어가므로 따로 세지 않는다.
2. 테스트 클래스 **`PostListQueryCountTest`** 를 만든다(이름 그대로 — 채점에서 이 이름으로 실행한다).
   - `@SpringBootTest` + MockMvc로 `GET /api/boards/free/posts?size=5`와 `size=20`을 호출한다.
   - Hibernate가 실행한 SQL 문장 수를 세서 위 기준을 단언한다.
   - 테스트 DB에는 시나리오 데이터(`free` 게시판 글 13~14개)가 이미 들어 있다.

응답 JSON은 2-3과 완전히 같아야 한다.

## 직접 확인

```bash
BASE=http://localhost:8080
curl -s "$BASE/api/boards/free/posts?size=20" > /dev/null   # 앱 로그에서 SQL 줄 수를 세 본다
./gradlew test --tests '*PostListQueryCountTest'
```

## 채점 기준

C = HTTP 확인(필수), T = 테스트 실행(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | `curl -s "$BASE/api/boards/free/posts?size=20"` | `200`, id 순서 `21~12, 9, 5, 4`(13개). 각 항목의 `author`·`tags`가 2-2와 같다(예: 21번 `tags`=[`mysql`], 작성자 박디비) |
| T1 | `./gradlew test --tests '*PostListQueryCountTest'` | 통과 |
| R1 | 측정 방법 | 테스트가 실제 SQL 수를 센다(Hibernate `Statistics`의 `getPrepareStatementCount()`, 또는 datasource-proxy 같은 도구). 호출 전에 카운트를 초기화한다 |
| R2 | 기준 단언 | `size=5`와 `size=20`의 문장 수가 같다는 것과 상한(5 이하)을 둘 다 단언한다 |
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

테스트에 `@TestPropertySource(properties = "spring.jpa.properties.hibernate.generate_statistics=true")`를 붙이고, `EntityManagerFactory`를 주입받아 `emf.unwrap(SessionFactory.class).getStatistics()`를 얻는다. 호출 직전 `statistics.clear()`, 호출 뒤 `statistics.getPrepareStatementCount()`.
</details>

<details>
<summary>힌트 2 — 가장 쉬운 해결</summary>

작성자(`@ManyToOne`)는 목록 쿼리에 `join fetch`로 붙이고, 태그(컬렉션)는 `spring.jpa.properties.hibernate.default_batch_fetch_size: 100`으로 IN 쿼리 한 번에 가져오게 한다. 태그를 fetch join하면 페이징이 메모리에서 일어난다.
</details>

## 다음 단계

[3-1. 부분 수정(PATCH)과 본인 확인](../ch3-update-delete/3-1-patch.md)
