# 1-4. DB에 저장하기 — JPA

## 상황

서버를 다시 켜면 글이 전부 사라진다. 이제 진짜 DB(`community`)의 `post` 테이블에 저장한다. 로그인은 아직 없으니 **작성자는 김자바(회원 id 2)로 고정**한다(1-6에서 토큰으로 바꾼다).

## 만들 것

**API** — 요청은 그대로, 응답에 `author`가 추가된다(8개 필드).

```json
{
  "id": 4,
  "boardSlug": "dev",
  "title": "[채점] DB 저장",
  "content": "Spring Boot로 만든 첫 게시글입니다.",
  "tags": ["spring", "채점태그"],
  "visibility": "PUBLIC",
  "author": { "id": 2, "nickname": "김자바" },
  "createdAt": "2026-10-06T17:30:00"
}
```

- `id` — DB가 붙인 번호(AUTO_INCREMENT). 시드에 글이 3개 있어서 처음 만든 글은 4 이상이다
- 상태 `201`, `Location: /api/posts/{id}`는 그대로

**저장 규칙** — `post` 한 행 + 태그 연결

| 컬럼 | 값 |
|---|---|
| `board_id` | `boardSlug`에 해당하는 `board.id`(`dev` → 2) |
| `author_id` | `2`(고정) |
| `status` | `PUBLISHED` |
| `visibility` | 요청 값 |
| `published_at`, `created_at`, `updated_at` | 지금 시각(셋 다 같아도 된다) |
| `view_count`, `like_count`, `comment_count` | `0` |

태그는 이렇게 처리한다.

- 이미 있는 이름(예: `spring`)은 그 태그를 연결한다.
- 없는 이름은 `tag`에 새로 만든 뒤 연결한다.
- 같은 이름이 요청에 두 번 와도 한 번만 연결한다.
- 연결 테이블은 `post_tag`(복합 기본키)다.

**지켜야 할 것**

- `application.yml`이 `ddl-auto: validate`라서 엔티티가 테이블과 다르면 서버가 뜨지 않는다. 테이블을 바꾸지 말고 엔티티를 테이블에 맞춘다. 테이블은 CloudBeaver(`http://localhost:8979`)의 `community (시나리오)` 연결이나 dump 파일 [`01-community.sql`](../../docker/mysql/init/01-community.sql)의 `CREATE TABLE`로 확인한다.
- 없는 `boardSlug`가 오면 어떻게 할지는 이 단계에서 채점하지 않는다(1-5).

## 직접 확인

```bash
BASE=http://localhost:8080

# 요청 A' — 새 태그 '채점태그' 포함
curl -i -X POST "$BASE/api/posts" -H 'Content-Type: application/json' \
  -d '{"boardSlug":"dev","title":"[채점] DB 저장","content":"Spring Boot로 만든 첫 게시글입니다.","tags":["spring","채점태그"],"visibility":"PUBLIC"}'

# DB 확인(레포 루트에서)
docker compose exec -T mysql mysql -ucommunity -pcommunity community \
  -e "SELECT id, board_id, author_id, status, title FROM post ORDER BY id DESC LIMIT 3"
```

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용). `{id}`는 C1 응답의 `id`다.

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 A' | 상태 `201`, `Location`이 `/api/posts/{id}`로 끝나고 `id`가 3보다 크다 |
| C2 | 요청 A' | 본문 8개 필드. `author.id` = `2`, `author.nickname` = `김자바`, `tags` = `["spring","채점태그"]`(순서 무관) |
| C3 | 요청 A'를 한 번 더 | 상태 `201`, `id`가 C1보다 크다 |
| D1 | `SELECT board_id, author_id, status, visibility, published_at IS NOT NULL AS published, like_count, comment_count FROM post WHERE id = {id}` | `2, 2, PUBLISHED, PUBLIC, 1, 0, 0` |
| D2 | `SELECT t.name FROM post_tag pt JOIN tag t ON t.id = pt.tag_id WHERE pt.post_id = {id} ORDER BY t.name` | 2행: `spring`, `채점태그` |
| D3 | `SELECT COUNT(*) FROM tag WHERE name = '채점태그'` | `1` — 요청을 여러 번 보내도 태그는 하나 |
| R1 | 엔티티 | `post` 테이블에 맞는 엔티티. 게시판·작성자는 `@ManyToOne(fetch = LAZY)` 연관관계(또는 id 필드)로, 컬럼 이름·타입이 테이블과 맞는다 |
| R2 | 트랜잭션 | 글과 태그 저장이 한 트랜잭션(서비스 메서드의 `@Transactional`). 중간에 실패하면 둘 다 저장되지 않는다 |
| R3 | 응답 | 엔티티를 그대로 응답하지 않고 DTO로 바꾼다(지연 로딩·순환 참조 문제를 피한다) |
| R4 | 태그 | 이름으로 찾고 없을 때만 만든다. 요청 안의 중복을 제거한다 |
| R5 | 교체 범위 | 1-3의 구조 덕분에 바뀐 곳이 주로 저장소·엔티티이고, 컨트롤러는 거의 그대로다 |

## 필요한 지식

- [P19 MySQL 연결과 JPA 설정](../../docs/knowledge/P19-mysql-jpa-setup.md) — 연결 설정과 `ddl-auto` 정책
- [P19 — `ddl-auto`는 환경별 정책이다](../../docs/knowledge/P19-mysql-jpa-setup.md#24-ddl-auto는-환경별-정책이다)
- [P20 JPA 엔티티·연관관계 매핑](../../docs/knowledge/P20-jpa-entity-mapping.md) — 엔티티 만들기
- [P20 — 연관관계의 주인](../../docs/knowledge/P20-jpa-entity-mapping.md#24-연관관계의-주인)
- [P20 — cascade, orphanRemoval, 다대다](../../docs/knowledge/P20-jpa-entity-mapping.md#25-cascade-orphanremoval-다대다) — `post_tag`를 어떻게 매핑할까
- [W11 트랜잭션은 왜 서비스 계층에 거나](../../docs/knowledge/W11-why-tx-in-service.md)
- [W03 DB 접근 방식 총비교](../../docs/knowledge/W03-db-access-comparison.md) — JPA가 하는 일과 안 하는 일
- [R08 앱 서버와 DB 서버는 어떻게 연결되나](../../docs/knowledge/R08-app-to-db-connection.md) — 연결이 안 될 때

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 엔티티 시작점</summary>

`@Entity @Table(name = "post")` 클래스에 `@Id @GeneratedValue(strategy = GenerationType.IDENTITY) Long id`. 문자열 상태는 `@Enumerated(EnumType.STRING)`. 컬럼 이름이 다르면 `@Column(name = "...")`. 서버가 안 뜨면 로그에서 `Schema-validation:`으로 시작하는 줄을 찾는다 — 어떤 컬럼이 안 맞는지 알려 준다.
</details>

<details>
<summary>힌트 2 — 게시판·작성자 찾기</summary>

`BoardRepository.findBySlug(String slug)`와 `MemberRepository`(또는 `getReferenceById(2L)`)를 쓴다. Spring Data JPA 리포지토리는 인터페이스만 만들면 구현을 Spring이 만든다.
</details>

<details>
<summary>힌트 3 — 태그</summary>

`post_tag`는 컬럼이 두 개뿐인 연결 테이블이라 `@ManyToMany` + `@JoinTable(name = "post_tag", ...)`로 매핑할 수 있다. 태그는 `TagRepository.findByName`으로 찾고 없으면 `save`한다.
</details>

## 다음 단계

[1-5. 입력 검증과 에러 응답](1-5-validation.md) — 잘못된 요청을 저장 전에 막는다.
