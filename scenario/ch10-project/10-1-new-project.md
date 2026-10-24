# 10-1. 새 프로젝트 시작 — 명세서 읽기, project DB·Flyway, 헬스 체크

> **과정 v2와 다른 점** — 10장은 과정 v2 이전의 참고 자료라 원문을 그대로 둔다. 과정 v2의 [명세서 v2](../../course/spec-v2.md)와는 응답 형식이 다르다. 10장은 성공·실패를 모두 `ApiResponse`(`{status, message, data}`)로 감싸지만, 명세서 v2는 성공 응답을 래퍼 없이 리소스 그대로 돌려주고 에러는 ProblemDetail(`application/problem+json`)로 통일한다. 인증도 10장은 JWT 인터셉터, 명세서 v2는 Spring Security 필터 체인이다. 과정 v2를 진행 중이라면 응답·에러 모양은 명세서 v2를 기준으로 한다.

## 상황

1~9장에서는 이미 있는 레포(javaExperience)에 기능을 하나씩 붙였다. 회사에서는 이런 일도 자주 생긴다. 팀장이 **명세서 한 장**을 주며 말한다.

> "게시판 API v1을 새로 만들어 주세요. 명세서대로요. DB 스키마랑 시드 데이터는 마이그레이션 파일로 드릴게요."

이번 장은 **빈 폴더에서 새 Spring 프로젝트를 만들어** 명세서의 API를 하나씩 채운다. 이 단계에서는 세 가지를 한다. 명세서를 끝까지 읽는다. 프로젝트를 만들어 DB(`project`)에 붙인다. 서버가 살아 있고 DB에 데이터가 들어갔는지 알려 주는 **헬스 체크** API를 연다.

- 기존 javaExperience 레포와 **다른 폴더**에 만든다(예: `~/code/board-api`). 새 git 레포로 시작하고 단계마다 커밋한다.
- DB는 javaExperience MySQL(`localhost:13308`) 안의 **빈 DB `project`** 다. 테이블과 데이터는 이 단계에서 넣는 Flyway 파일(V1)이 만든다.

## 명세서 읽기

명세서는 이 장 전체의 "정답지"다. 단계를 진행하다 헷갈리면 여기로 돌아온다. 처음 읽을 때는 **표의 칸이 무슨 뜻인지**부터 익힌다.

### 1. 공통 규칙

- 기본 경로는 `/api/v1`이다. 모든 API 주소가 이것으로 시작한다(`v1` = 1판. 계약이 크게 바뀌면 `v2`를 새로 연다 — 10-11).
- 본문은 JSON(UTF-8)이다. 시각은 ISO-8601 문자열이다(`2026-10-10T09:00:00`).
- 인증은 요청 헤더 `Authorization: Bearer <토큰>`으로 한다. 토큰은 로그인 API가 준다(10-4). JWT, HS256 서명, 유효 시간 1시간, 비밀키는 설정 `app.jwt.secret`, 페이로드의 `sub`가 회원 id다.

**공통 응답** — 성공이든 실패든 같은 틀로 감싼다(10-2).

```json
{ "status": 200, "message": "OK", "data": { "id": 1 } }
```

```json
{ "status": 400, "message": "입력값이 올바르지 않습니다.", "code": "VALIDATION_FAILED",
  "errors": [ { "field": "title", "reason": "제목은 5자 이상 100자 이하여야 합니다." } ], "data": null }
```

| 필드 | 뜻 | 성공 | 실패 |
|---|---|---|---|
| `status` | HTTP 상태 코드와 같은 숫자 | 있음 | 있음 |
| `message` | 사람이 읽는 문구 | `OK`·`Created` | 이유 |
| `data` | 실제 내용 | 내용(삭제 성공은 `null`) | 항상 `null` |
| `code` | **프로그램이 읽는** 실패 종류. 화면은 문구가 아니라 이 값으로 분기한다 | 없음 | 있음 |
| `errors` | 필드별 이유 목록 | 없음 | 있음(필드 오류가 없으면 `[]`) |

**상태 코드 표** — "언제 무엇을 돌려주나"의 약속이다. 엔드포인트 표의 "실패" 칸에 적힌 숫자는 모두 이 표의 뜻을 따른다.

| status | code | 언제 |
|---|---|---|
| 200 | — | 성공(조회·수정·삭제) |
| 201 | — | 생성 성공. 응답 헤더 `Location`에 만든 것의 주소 |
| 400 | `VALIDATION_FAILED` | 입력 규칙 위반(길이·개수·형식·허용 값) |
| 400 | `BAD_JSON` | 본문을 JSON으로 읽을 수 없음 |
| 401 | `UNAUTHORIZED` | 토큰 없음·형식 틀림·서명 틀림·만료, 로그인 실패 |
| 403 | `FORBIDDEN` | 로그인은 했지만 남의 글·댓글을 고치거나 지우려 함 |
| 404 | `NOT_FOUND` | 없는 글·댓글(삭제된 것, 남의 비공개 글 포함), 없는 주소 |
| 405 | `METHOD_NOT_ALLOWED` | 주소는 있는데 메서드가 다름 |
| 409 | `DUPLICATE` | 이메일 중복 |
| 500 | `INTERNAL_ERROR` | 서버가 예상 못 한 오류(원인은 로그에만) |

401과 403을 헷갈리지 않는다. **401은 "누구인지 모른다"**(로그인부터), **403은 "누구인지는 아는데 권한이 없다"** 다.

**목록 응답의 `data`**

```json
{ "items": [ … ], "page": 0, "size": 20, "totalElements": 57, "hasNext": true }
```

커서 방식이면 `{ "items": [ … ], "nextCursor": "17" }`이다. 다음이 없으면 `nextCursor`가 `null`이다.

### 2. 테이블 (DB `project`, 아래 V1이 만든다)

| 테이블 | 컬럼 | 메모 |
|---|---|---|
| `users` | `id`, `email`(UNIQUE), `password_hash`, `nickname`, `created_at` | 비밀번호는 해시만 저장 |
| `posts` | `id`, `author_id`(FK), `title`, `content`(NULL 가능), `visibility`(`PUBLIC`·`PRIVATE`), `view_count`, `like_count`, `created_at`, `updated_at`, `deleted_at`(NULL) | `deleted_at`이 있으면 삭제된 글(soft delete) |
| `tags` | `id`, `name`(UNIQUE) | |
| `post_tags` | `post_id`, `tag_id` (둘이 기본 키) | 글 ↔ 태그 다대다 연결 |
| `comments` | `id`, `post_id`(FK), `author_id`(FK), `parent_id`(NULL, FK), `content`, `created_at`, `deleted_at`(NULL) | `parent_id`가 있으면 답글 |
| `post_likes` | `post_id`, `user_id`, `created_at` (앞 둘이 기본 키) | 한 사람이 한 글에 한 번 |

### 3. 엔드포인트

표는 왼쪽부터 **어떤 요청 → 지킬 규칙 → 성공 응답 → 실패 응답** 순으로 읽는다. "실패" 칸의 숫자마다 "어떤 입력이면 이 숫자인가"를 스스로 하나씩 말해 보면 그것이 곧 채점 항목이다.

**회원**

| API | 요청 | 성공 | 실패 |
|---|---|---|---|
| `POST /api/v1/users` 가입 | `{email, password(8~64자·UTF-8 72바이트 이하), nickname(2~20자)}` | 201 `{id, email, nickname}` | 400, 409 |
| `POST /api/v1/auth/login` 로그인 | `{email, password}` | 200 `{accessToken, expiresIn}` | 400, 401(이메일이 없든 비밀번호가 틀리든 **같은 응답** — 가입 여부를 흘리지 않는다) |
| `GET /api/v1/users/me` 내 정보 | 토큰 | 200 `{id, email, nickname}` | 401 |

**게시글**

| API | 규칙 | 성공 | 실패 |
|---|---|---|---|
| `POST /api/v1/posts` | 토큰 필수. `title` 5~100자(앞뒤 공백 제거 후), `content` 없어도 됨(최대 10000자), `tags` 0~5개(각 1~20자, 소문자로, 중복 제거), `visibility` 기본 `PUBLIC`. 작성자 = 토큰 주인 | 201 + `Location`, `data` = 상세 | 400, 401 |
| `GET /api/v1/posts?sort=latest\|popular&page=&size=` · `?cursor=&size=` · `&tag=&q=` | `PUBLIC`만(로그인하면 내 `PRIVATE`도). `size` 1~50, 기본 20. `q`는 제목 검색. 인기순 = 좋아요 수 내림차순, 같으면 id 내림차순. 커서는 최신순만 | 200 페이지 또는 커서 | 400(size 범위·잘못된 sort·인기순+커서) |
| `GET /api/v1/posts/{postId}` | 조회수 +1(같은 응답에도 반영). 작성자 `{id, nickname}`, 태그, 좋아요 수, 내가 좋아요했나(로그인 시), 댓글 목록(시간순, 답글은 부모 아래) | 200 | 404(없음·삭제·남의 `PRIVATE`) |
| `PUT /api/v1/posts/{postId}` | 작성자만. 전체 교체 — 빠진 필드는 기본값 | 200 | 400, 401, 403, 404 |
| `DELETE /api/v1/posts/{postId}` | 작성자만. soft delete | 200 `data: null` | 401, 403, 404 |

**댓글**

| API | 규칙 | 성공 | 실패 |
|---|---|---|---|
| `POST /api/v1/posts/{postId}/comments` | 토큰. `content` 1~500자, `parentId` 선택(같은 글의 최상위 댓글만 — 답글의 답글 금지) | 201 | 400(부모가 답글·다른 글), 401, 404 |
| `GET /api/v1/posts/{postId}/comments` | 시간순, 답글은 `replies`로. 삭제된 부모는 "삭제된 댓글입니다"로 자리만 | 200 | 404 |
| `DELETE /api/v1/comments/{commentId}` | 작성자만, soft delete | 200 | 401, 403, 404 |

**좋아요**

| API | 규칙 | 성공 | 실패 |
|---|---|---|---|
| `POST /api/v1/posts/{postId}/like` | 토글: 없으면 만들고 있으면 취소. 응답 `{liked, likeCount}` | 200 | 401, 404 |

### 4. 단계 순서

| 단계 | 하는 일 | 난이도 |
|---|---|---|
| 10-1 | 프로젝트 만들기, DB·Flyway V1, CORS, 헬스 체크 | 쉬움 |
| 10-2 | 공통 응답 틀·전역 예외 처리 | 쉬움 |
| 10-3 | 회원 가입(BCrypt, 이메일 중복 409) | 쉬움 |
| 10-4 | 로그인과 JWT, `GET /users/me` | 중급 |
| 10-5 | 게시글 작성 — JPA | 중급 |
| 10-6 | 게시글 상세(조회수·댓글 함께, N+1 피하기) | 중급 |
| 10-7 | 목록 — 최신·인기·페이지·커서·태그·검색(JPA). 선택 칸: 같은 목록을 MyBatis로 | 중급 |
| 10-8 | 수정(PUT)·삭제(soft), 작성자 검증 403 | 중급 |
| 10-9 | 댓글 작성·목록(답글 트리)·삭제 | 중급 |
| 10-10 | 좋아요 토글 | 쉬움 |
| 10-11 | 토글의 문제 겪기 → 멱등 PUT/DELETE를 v2로 | 고급 |
| 10-12 | (선택) JPA로 쓰고 MyBatis로 바로 읽기 — flush | 고급 |

쓰기도 목록도 **JPA**로 만든다(0~9장과 같은 기술). 실무에서는 정렬·조건이 자주 바뀌는 조회를 SQL을 직접 쓰는 **MyBatis**로 짜는 곳도 많아서, 10-7에 같은 목록을 MyBatis로 짜 보는 **선택 칸**을 두었다. 한 서비스에서 둘을 함께 쓸 때 생기는 함정(flush)은 **선택 단계** 10-12에서 겪는다. 둘 다 건너뛰어도 명세서 프로젝트는 끝까지 간다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "서버 상태 화면",
  "summary": "운영자가 여는 상태 화면. 서버가 살아 있는지, 어느 DB에 붙었는지, 시드 데이터가 들어갔는지를 한 번에 본다.",
  "screen": [
    { "type": "bar", "id": "bar", "label": "board-api 상태", "right": "운영자" },
    { "type": "actions", "id": "buttons", "items": [{ "id": "refresh", "label": "새로고침", "variant": "primary" }] },
    { "type": "stats", "id": "counts", "items": [{ "id": "db", "label": "DB", "value": "project" }, { "label": "회원", "value": "3" }, { "label": "글", "value": "25" }, { "label": "댓글", "value": "40" }, { "label": "좋아요", "value": "30" }] },
    { "type": "toast", "id": "toast", "value": "서버 오류(500)", "tone": "error" }
  ],
  "flows": [
    {
      "name": "상태 보기",
      "steps": [
        { "kind": "user", "text": "[새로고침]을 누른다", "focus": ["refresh"] },
        { "kind": "request", "method": "GET", "path": "/api/v1/health" },
        { "kind": "server", "text": "HealthController가 JdbcTemplate으로 DB 이름과 테이블별 행 수를 읽는다" },
        { "kind": "db", "sql": "SELECT DATABASE();\nSELECT COUNT(*) FROM users;  -- posts·comments·post_likes도 같은 식", "note": "테이블은 앱이 뜰 때 Flyway가 V1__init.sql로 만들었다" },
        { "kind": "response", "status": 200, "headers": ["Content-Type: application/json"], "body": "{\n  \"up\": true,\n  \"database\": \"project\",\n  \"users\": 3,\n  \"posts\": 25,\n  \"comments\": 40,\n  \"likes\": 30\n}" },
        { "kind": "screen", "text": "숫자가 시드와 같으면 DB 연결과 마이그레이션이 모두 된 것이다", "focus": ["counts", "db"] }
      ]
    },
    {
      "name": "마이그레이션 파일 이름이 틀렸을 때",
      "steps": [
        { "kind": "server", "text": "V1_init.sql(밑줄 하나)은 Flyway가 마이그레이션으로 알아보지 못한다. 로그: No migrations found. Are your locations set up correctly? — 그래도 앱은 뜬다" },
        { "kind": "user", "text": "[새로고침]을 누른다", "focus": ["refresh"] },
        { "kind": "request", "method": "GET", "path": "/api/v1/health" },
        { "kind": "db", "sql": "SELECT COUNT(*) FROM users;", "note": "Table 'project.users' doesn't exist" },
        { "kind": "response", "status": 500 },
        { "kind": "screen", "text": "서버 오류 — 원인은 앱 로그에 있다(아래 일부러 망가뜨리기 ②)", "focus": ["toast"] }
      ]
    }
  ]
}
```

## 만들 것

| 항목 | 내용 |
|---|---|
| 프로젝트 | [start.spring.io](https://start.spring.io)에서 Gradle - Groovy, Java, Spring Boot **4.1.1**, Group `org.example`, Artifact `board-api`, Package name `org.example.board`, Java **21** |
| 의존성 | Spring Web, Spring Data JPA, Validation, MySQL Driver, Flyway Migration. MyBatis는 지금 고르지 않는다 — 10-7 선택 칸이나 10-12를 할 때 추가 |
| DB | javaExperience MySQL의 빈 DB `project`(계정 `community`/`community`) — 아래 [DB 준비](#db-준비) |
| 마이그레이션 | `src/main/resources/db/migration/V1__init.sql` — 아래 전문을 그대로 |
| CORS | `/api/**`를 브라우저 화면에 연다(1-1과 같은 설정) |
| 메서드·경로 | `GET /api/v1/health` |
| 응답 | 상태 `200`, `{ "up": true, "database": "project", "users", "posts", "comments", "likes" }` — 숫자는 각 테이블의 행 수. **이 단계에서는 공통 응답 틀 없이** 이 모양 그대로(틀은 10-2) |

### DB 준비

javaExperience 레포 루트에서 한 번 실행한다. 이미 있는 DB는 건드리지 않고 없는 `project`만 빈 DB로 만든다.

```bash
docker compose exec -T mysql mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS project; GRANT ALL PRIVILEGES ON project.* TO 'community'@'%';"
```

명령이 성공하면 빈 `project` DB와 권한이 준비된 것이다. 테이블은 앱이 처음 뜰 때 Flyway가 만든다. 처음 상태로 돌리고 싶으면 `docker compose down -v && docker compose up -d`을 실행한다. `project`가 다시 빈 DB가 되고, 앱을 띄우면 V1이 다시 돈다(`community`·`practice`도 함께 처음 상태로 돌아간다). **루트 compose의 `down -v`는 `community`·`practice`·`project` DB와 CloudBeaver 작업 공간(저장한 SQL·연결 설정)을 함께 초기화한다. 먼저 `./docker/mysql/dump.sh`로 DB를 백업하고 CloudBeaver 자료는 따로 보관한다(DB 덤프에 포함되지 않음).**

### 시드 데이터 (V1이 넣는 것)

**회원 3명** — 비밀번호는 셋 다 **`password1234`** 다. DB에는 BCrypt 해시로만 들어 있다(해시가 셋 다 다른 것은 솔트 때문이다 — 10-3).

| id | 이메일 | 닉네임 |
|---|---|---|
| 1 | `kim@example.com` | 김자바 — **여러분의 기본 계정** |
| 2 | `lee@example.com` | 이스프링 |
| 3 | `park@example.com` | 박디비 |

**글 25개** — 1~23은 공개 글, 작성자는 김자바·이스프링·박디비 순서로 돈다. 채점이 기대는 글은 아래와 같다. 여러분이 만드는 글은 id 26부터 붙는다.

| 글 | 특징 |
|---|---|
| 1 | 김자바 글. 댓글 트리 — 답글 2개 달린 댓글, **삭제됐지만 답글이 있는 댓글**, 지운 답글, 답글 없이 지운 댓글 |
| 2·6·11 | 좋아요 3개(인기순 맨 앞 — 같으면 id가 큰 11 → 6 → 2) |
| 1·4·9·14·17 | 좋아요 2개 |
| 5·11·17·21 | 태그 `mybatis` |
| 6·20 | 제목에 "트랜잭션" |
| 12·18·22 | 태그 `회고`(공개) |
| 24 | 김자바의 **`PRIVATE`** 글(태그 `회고`) — 김자바만 본다 |
| 25 | **삭제된 글**(`deleted_at`) — 아무도 못 본다 |

- 태그 6개: `java`, `spring`, `jpa`, `mybatis`, `mysql`, `회고`
- 좋아요 30개는 회원마다 10개씩이다. `posts.like_count`는 `post_likes` 행 수와 맞춰 두었다. 김자바(1)는 글 11에 좋아요를 눌러 두었다.

## 따라 치기

start.spring.io에서 받은 zip을 풀어 IntelliJ로 연다. 아래 파일들을 맞춘다.

### build.gradle

`build.gradle`

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '4.1.1'
    id 'io.spring.dependency-management' version '1.1.7'
}

group = 'org.example'
version = '0.0.1-SNAPSHOT'

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    // start.spring.io에서 고른 것: Spring Web · Spring Data JPA · Validation · MySQL Driver · Flyway Migration
    implementation 'org.springframework.boot:spring-boot-starter-webmvc'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    implementation 'org.springframework.boot:spring-boot-starter-flyway'
    runtimeOnly 'com.mysql:mysql-connector-j'
    runtimeOnly 'org.flywaydb:flyway-mysql'

    testImplementation 'org.springframework.boot:spring-boot-starter-webmvc-test'
    testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

| 코드 | 설명 |
|---|---|
| `id 'org.springframework.boot' version '4.1.1'` | Spring Boot 플러그인. `bootRun`(실행)·`bootJar`(실행 가능한 jar) 작업을 준다 |
| `id 'io.spring.dependency-management'` | Boot가 검증한 라이브러리 버전 묶음(BOM)을 적용한다. 그래서 아래 의존성 대부분에 버전이 없다 |
| `languageVersion = JavaLanguageVersion.of(21)` | 컴파일·실행에 쓸 JDK 버전 |
| `spring-boot-starter-webmvc` | Spring MVC + 내장 Tomcat + JSON(Jackson). Boot 4부터 이름이 `starter-web`에서 `starter-webmvc`로 바뀌었다 |
| `spring-boot-starter-data-jpa` | JPA(Hibernate)와 커넥션 풀(HikariCP) |
| `spring-boot-starter-validation` | `@NotBlank`·`@Size` 같은 입력 검증 |
| `spring-boot-starter-flyway` · `flyway-mysql` | 앱이 뜰 때 `db/migration`의 SQL을 순서대로 실행한다. MySQL용 모듈이 따로 있다 |
| `runtimeOnly 'com.mysql:mysql-connector-j'` | MySQL 드라이버. 코드에서 직접 부르지 않으니 실행할 때만 있으면 된다 |

start.spring.io가 만든 파일은 주석·순서가 다를 수 있다. dependencies 줄이 같으면 된다(Gradle 의존성은 [C2](../../lessons/C2-gradle-dependencies.md)). MyBatis(`mybatis-spring-boot-starter`)는 10-7 선택 칸이나 10-12를 할 때 그 단계의 안내대로 한 줄 추가한다.

### application.yml

`src/main/resources/application.yml` — 생성된 `application.properties`는 지우고 이 파일을 만든다.

```yaml
spring:
  application:
    name: board-api
  datasource:
    # compose.yaml의 mysql(호스트 13308 → 컨테이너 3306)의 project DB. 빈 DB면 Flyway가 V1으로 테이블·시드를 만든다
    url: jdbc:mysql://localhost:13308/project?characterEncoding=UTF-8&serverTimezone=Asia/Seoul
    username: community
    password: community
  jpa:
    hibernate:
      # 스키마는 Flyway만 만든다. 엔티티가 테이블과 다르면 기동이 실패한다
      ddl-auto: validate
    open-in-view: false
```

| 코드 | 설명 |
|---|---|
| `url: jdbc:mysql://localhost:13308/project?...` | compose.yaml의 mysql(호스트 13308 → 컨테이너 3306)의 `project` DB. `characterEncoding=UTF-8`은 한글, `serverTimezone`은 시각 변환 기준 |
| `username` · `password` | 실습 계정. 이 계정은 `community`·`practice`·`project` 세 DB에만 권한이 있다 |
| `ddl-auto: validate` | Hibernate가 테이블을 **만들거나 고치지 않고**, 엔티티와 테이블이 맞는지 확인만 한다. 테이블은 Flyway만 만든다 |
| `open-in-view: false` | DB 연결을 트랜잭션이 끝나면 바로 돌려준다(응답 JSON을 만드는 동안 붙잡지 않음) |

Flyway 설정은 따로 적지 않았다. 기본값이 `classpath:db/migration` 폴더를 읽는 것이라 그대로 쓴다(설정 파일은 [C3](../../lessons/C3-application-yml-profiles.md)).

### V1__init.sql — 스키마와 시드 전문

`src/main/resources/db/migration/V1__init.sql` — 파일 이름이 규칙이다. **`V` + 버전 + 밑줄 두 개(`__`) + 설명 + `.sql`**. 아래를 그대로 붙여 넣는다.

```sql
-- V1 — 명세서 프로젝트(게시판 API v1) 스키마와 시드 데이터
-- 시드 회원 3명의 비밀번호는 모두 password1234 (BCrypt 해시로 저장 — 해시가 셋 다 다른 것은 솔트 때문이다)

CREATE TABLE users (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    nickname      VARCHAR(20)  NOT NULL,
    created_at    DATETIME     NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE TABLE posts (
    id         BIGINT                     NOT NULL AUTO_INCREMENT,
    author_id  BIGINT                     NOT NULL,
    title      VARCHAR(100)               NOT NULL,
    content    VARCHAR(10000)             NULL,
    visibility ENUM ('PUBLIC', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    view_count INT                        NOT NULL DEFAULT 0,
    like_count INT                        NOT NULL DEFAULT 0,
    created_at DATETIME                   NOT NULL,
    updated_at DATETIME                   NOT NULL,
    deleted_at DATETIME                   NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_posts_author FOREIGN KEY (author_id) REFERENCES users (id),
    INDEX idx_posts_popular (like_count, id)
);

CREATE TABLE tags (
    id   BIGINT      NOT NULL AUTO_INCREMENT,
    name VARCHAR(20) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_tags_name UNIQUE (name)
);

CREATE TABLE post_tags (
    post_id BIGINT NOT NULL,
    tag_id  BIGINT NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    CONSTRAINT fk_post_tags_post FOREIGN KEY (post_id) REFERENCES posts (id),
    CONSTRAINT fk_post_tags_tag FOREIGN KEY (tag_id) REFERENCES tags (id)
);

CREATE TABLE comments (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    post_id    BIGINT       NOT NULL,
    author_id  BIGINT       NOT NULL,
    parent_id  BIGINT       NULL,
    content    VARCHAR(500) NOT NULL,
    created_at DATETIME     NOT NULL,
    deleted_at DATETIME     NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_comments_post FOREIGN KEY (post_id) REFERENCES posts (id),
    CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users (id),
    CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments (id)
);

CREATE TABLE post_likes (
    post_id    BIGINT   NOT NULL,
    user_id    BIGINT   NOT NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (post_id, user_id),
    CONSTRAINT fk_post_likes_post FOREIGN KEY (post_id) REFERENCES posts (id),
    CONSTRAINT fk_post_likes_user FOREIGN KEY (user_id) REFERENCES users (id)
);

-- 회원 3 (비밀번호 password1234)
INSERT INTO users (id, email, password_hash, nickname, created_at) VALUES
    (1, 'kim@example.com', '$2a$10$jmTUgTXkmVjHx6KM72lBku3ufsYi0KFoYZ6y8BzknkrxDUPnvfpaO', '김자바', '2026-08-31 09:00:00'),
    (2, 'lee@example.com', '$2a$10$iIfM01MHi3EG7/sAyms78ucqvCw4tDYz7FG6xI4fGNwgEZuJhpOcC', '이스프링', '2026-08-31 09:00:00'),
    (3, 'park@example.com', '$2a$10$p3sn.5r2aM7ii39XAbum.OHxesye.TaVYOy59GVDyeIEROyxpraUC', '박디비', '2026-08-31 09:00:00');

-- 태그 6
INSERT INTO tags (id, name) VALUES (1, 'java'), (2, 'spring'), (3, 'jpa'), (4, 'mybatis'), (5, 'mysql'), (6, '회고');

-- 글 25 — 24는 PRIVATE(김자바만 본다), 25는 삭제된 글(아무도 못 본다). like_count는 아래 post_likes 행 수와 같다
INSERT INTO posts (id, author_id, title, content, visibility, view_count, like_count, created_at, updated_at, deleted_at) VALUES
    (1, 1, '자바 record 정리', '자바 record 정리 — 본문입니다.', 'PUBLIC', 10, 2, '2026-09-01 09:00:00', '2026-09-01 09:00:00', NULL),
    (2, 2, '스프링 빈과 의존성 주입', '스프링 빈과 의존성 주입 — 본문입니다.', 'PUBLIC', 17, 3, '2026-09-02 09:00:00', '2026-09-02 09:00:00', NULL),
    (3, 3, 'MySQL 인덱스 처음 만들기', 'MySQL 인덱스 처음 만들기 — 본문입니다.', 'PUBLIC', 24, 1, '2026-09-03 09:00:00', '2026-09-03 09:00:00', NULL),
    (4, 1, 'JPA 엔티티 매핑 기초', 'JPA 엔티티 매핑 기초 — 본문입니다.', 'PUBLIC', 31, 2, '2026-09-04 09:00:00', '2026-09-04 09:00:00', NULL),
    (5, 2, 'MyBatis 동적 SQL 맛보기', 'MyBatis 동적 SQL 맛보기 — 본문입니다.', 'PUBLIC', 38, 1, '2026-09-05 09:00:00', '2026-09-05 09:00:00', NULL),
    (6, 3, '트랜잭션은 언제 커밋되나', '트랜잭션은 언제 커밋되나 — 본문입니다.', 'PUBLIC', 45, 3, '2026-09-06 09:00:00', '2026-09-06 09:00:00', NULL),
    (7, 1, 'Optional 제대로 쓰기', 'Optional 제대로 쓰기 — 본문입니다.', 'PUBLIC', 52, 1, '2026-09-07 09:00:00', '2026-09-07 09:00:00', NULL),
    (8, 2, '컨트롤러와 서비스 나누기', '컨트롤러와 서비스 나누기 — 본문입니다.', 'PUBLIC', 9, 0, '2026-09-08 09:00:00', '2026-09-08 09:00:00', NULL),
    (9, 3, 'JOIN 세 가지 비교', 'JOIN 세 가지 비교 — 본문입니다.', 'PUBLIC', 16, 2, '2026-09-09 09:00:00', '2026-09-09 09:00:00', NULL),
    (10, 1, 'JPA N+1 문제 겪어 보기', 'JPA N+1 문제 겪어 보기 — 본문입니다.', 'PUBLIC', 23, 1, '2026-09-10 09:00:00', '2026-09-10 09:00:00', NULL),
    (11, 2, 'MyBatis와 JPA 같이 쓰기', 'MyBatis와 JPA 같이 쓰기 — 본문입니다.', 'PUBLIC', 30, 3, '2026-09-11 09:00:00', '2026-09-11 09:00:00', NULL),
    (12, 3, '첫 주 회고', '첫 주 회고 — 본문입니다.', 'PUBLIC', 37, 1, '2026-09-12 09:00:00', '2026-09-12 09:00:00', NULL),
    (13, 1, '스트림 API 연습', '스트림 API 연습 — 본문입니다.', 'PUBLIC', 44, 1, '2026-09-13 09:00:00', '2026-09-13 09:00:00', NULL),
    (14, 2, '검증 애노테이션 모음', '검증 애노테이션 모음 — 본문입니다.', 'PUBLIC', 51, 2, '2026-09-14 09:00:00', '2026-09-14 09:00:00', NULL),
    (15, 3, '실행 계획 읽는 법', '실행 계획 읽는 법 — 본문입니다.', 'PUBLIC', 8, 1, '2026-09-15 09:00:00', '2026-09-15 09:00:00', NULL),
    (16, 1, '지연 로딩과 프록시', '지연 로딩과 프록시 — 본문입니다.', 'PUBLIC', 15, 1, '2026-09-16 09:00:00', '2026-09-16 09:00:00', NULL),
    (17, 2, 'resultMap 써 보기', 'resultMap 써 보기 — 본문입니다.', 'PUBLIC', 22, 2, '2026-09-17 09:00:00', '2026-09-17 09:00:00', NULL),
    (18, 3, '둘째 주 회고', '둘째 주 회고 — 본문입니다.', 'PUBLIC', 29, 1, '2026-09-18 09:00:00', '2026-09-18 09:00:00', NULL),
    (19, 1, '예외 처리 한곳에 모으기', '예외 처리 한곳에 모으기 — 본문입니다.', 'PUBLIC', 36, 0, '2026-09-19 09:00:00', '2026-09-19 09:00:00', NULL),
    (20, 2, '트랜잭션 격리 수준', '트랜잭션 격리 수준 — 본문입니다.', 'PUBLIC', 43, 1, '2026-09-20 09:00:00', '2026-09-20 09:00:00', NULL),
    (21, 3, '페이지와 커서 페이징', '페이지와 커서 페이징 — 본문입니다.', 'PUBLIC', 50, 1, '2026-09-21 09:00:00', '2026-09-21 09:00:00', NULL),
    (22, 1, '셋째 주 회고', '셋째 주 회고 — 본문입니다.', 'PUBLIC', 7, 0, '2026-09-22 09:00:00', '2026-09-22 09:00:00', NULL),
    (23, 2, '태그 없는 글입니다', '태그 없는 글입니다 — 본문입니다.', 'PUBLIC', 14, 0, '2026-09-23 09:00:00', '2026-09-23 09:00:00', NULL),
    (24, 1, '나만 보는 메모', '나만 보는 메모 — 본문입니다.', 'PRIVATE', 21, 0, '2026-09-24 09:00:00', '2026-09-24 09:00:00', NULL),
    (25, 2, '지워진 글입니다', '지워진 글입니다 — 본문입니다.', 'PUBLIC', 28, 0, '2026-09-25 09:00:00', '2026-09-25 09:00:00', '2026-09-25 14:00:00');

INSERT INTO post_tags (post_id, tag_id) VALUES
    (1, 1), (2, 2), (2, 1), (3, 5), (4, 3), (5, 4), (6, 2), (6, 5), (7, 1), (8, 2), (9, 5), (10, 3), (11, 4), (11, 3), (12, 6), (13, 1), (14, 2), (15, 5), (16, 3), (17, 4), (18, 6), (19, 2), (20, 5), (21, 4), (21, 5), (22, 6), (24, 6), (25, 6);

-- 댓글 40 — 1번 글에 트리(답글·삭제된 부모·삭제된 답글)를 모아 두었다
INSERT INTO comments (id, post_id, author_id, parent_id, content, created_at, deleted_at) VALUES
    (1, 1, 2, NULL, '좋은 정리네요', '2026-09-01 10:00:00', NULL),
    (2, 1, 3, 1, '저도 그렇게 생각해요', '2026-09-01 10:10:00', NULL),
    (3, 1, 1, 1, '감사합니다!', '2026-09-01 10:20:00', NULL),
    (4, 1, 3, NULL, '지울 댓글', '2026-09-01 10:30:00', '2026-09-01 10:35:00'),
    (5, 1, 2, 4, '삭제된 댓글에 단 답글', '2026-09-01 10:40:00', NULL),
    (6, 1, 1, NULL, 'record는 불변이라 좋아요', '2026-09-01 10:50:00', NULL),
    (7, 1, 2, 6, '지운 답글', '2026-09-01 11:00:00', '2026-09-01 11:05:00'),
    (8, 1, 3, NULL, '아무 답글 없이 지운 댓글', '2026-09-01 11:10:00', '2026-09-01 11:15:00'),
    (9, 2, 3, NULL, '저는 조금 다르게 했어요', '2026-09-02 11:00:00', NULL),
    (10, 2, 1, NULL, '덕분에 해결했습니다', '2026-09-02 12:00:00', NULL),
    (11, 3, 1, NULL, '덕분에 해결했습니다', '2026-09-03 11:00:00', NULL),
    (12, 3, 2, NULL, '잘 읽었습니다', '2026-09-03 12:00:00', NULL),
    (13, 4, 2, NULL, '잘 읽었습니다', '2026-09-04 11:00:00', NULL),
    (14, 4, 3, NULL, '질문이 있어요 — 예제 코드도 볼 수 있을까요?', '2026-09-04 12:00:00', NULL),
    (15, 5, 3, NULL, '질문이 있어요 — 예제 코드도 볼 수 있을까요?', '2026-09-05 11:00:00', NULL),
    (16, 5, 1, NULL, '저는 조금 다르게 했어요', '2026-09-05 12:00:00', NULL),
    (17, 6, 1, NULL, '저는 조금 다르게 했어요', '2026-09-06 11:00:00', NULL),
    (18, 6, 2, NULL, '덕분에 해결했습니다', '2026-09-06 12:00:00', NULL),
    (19, 7, 2, NULL, '덕분에 해결했습니다', '2026-09-07 11:00:00', NULL),
    (20, 7, 3, NULL, '잘 읽었습니다', '2026-09-07 12:00:00', NULL),
    (21, 8, 3, NULL, '잘 읽었습니다', '2026-09-08 11:00:00', NULL),
    (22, 8, 1, NULL, '질문이 있어요 — 예제 코드도 볼 수 있을까요?', '2026-09-08 12:00:00', NULL),
    (23, 9, 1, NULL, '질문이 있어요 — 예제 코드도 볼 수 있을까요?', '2026-09-09 11:00:00', NULL),
    (24, 9, 2, NULL, '저는 조금 다르게 했어요', '2026-09-09 12:00:00', NULL),
    (25, 10, 2, NULL, '저는 조금 다르게 했어요', '2026-09-10 11:00:00', NULL),
    (26, 10, 3, NULL, '덕분에 해결했습니다', '2026-09-10 12:00:00', NULL),
    (27, 11, 3, NULL, '덕분에 해결했습니다', '2026-09-11 11:00:00', NULL),
    (28, 11, 1, NULL, '잘 읽었습니다', '2026-09-11 12:00:00', NULL),
    (29, 12, 1, NULL, '잘 읽었습니다', '2026-09-12 11:00:00', NULL),
    (30, 12, 2, NULL, '질문이 있어요 — 예제 코드도 볼 수 있을까요?', '2026-09-12 12:00:00', NULL),
    (31, 13, 2, NULL, '질문이 있어요 — 예제 코드도 볼 수 있을까요?', '2026-09-13 11:00:00', NULL),
    (32, 13, 3, NULL, '저는 조금 다르게 했어요', '2026-09-13 12:00:00', NULL),
    (33, 14, 3, NULL, '저는 조금 다르게 했어요', '2026-09-14 11:00:00', NULL),
    (34, 14, 1, NULL, '덕분에 해결했습니다', '2026-09-14 12:00:00', NULL),
    (35, 15, 1, NULL, '덕분에 해결했습니다', '2026-09-15 11:00:00', NULL),
    (36, 15, 2, NULL, '잘 읽었습니다', '2026-09-15 12:00:00', NULL),
    (37, 16, 2, NULL, '잘 읽었습니다', '2026-09-16 11:00:00', NULL),
    (38, 16, 3, NULL, '질문이 있어요 — 예제 코드도 볼 수 있을까요?', '2026-09-16 12:00:00', NULL),
    (39, 17, 3, NULL, '질문이 있어요 — 예제 코드도 볼 수 있을까요?', '2026-09-17 11:00:00', NULL),
    (40, 17, 1, NULL, '저는 조금 다르게 했어요', '2026-09-17 12:00:00', NULL);

-- 좋아요 30 — 회원마다 10개. 3개: 2·6·11번 / 2개: 1·4·9·14·17번 / 1개: 나머지 11개 글
INSERT INTO post_likes (post_id, user_id, created_at) VALUES
    (2, 1, '2026-09-03 10:00:00'), (6, 1, '2026-09-07 10:00:00'), (11, 1, '2026-09-12 10:00:00'), (1, 1, '2026-09-02 10:00:00'), (9, 1, '2026-09-10 10:00:00'),
    (14, 1, '2026-09-15 10:00:00'), (3, 1, '2026-09-04 10:00:00'), (5, 1, '2026-09-06 10:00:00'), (7, 1, '2026-09-08 10:00:00'), (10, 1, '2026-09-11 10:00:00'),
    (2, 2, '2026-09-03 11:00:00'), (6, 2, '2026-09-07 11:00:00'), (11, 2, '2026-09-12 11:00:00'), (1, 2, '2026-09-02 11:00:00'), (4, 2, '2026-09-05 11:00:00'),
    (14, 2, '2026-09-15 11:00:00'), (17, 2, '2026-09-18 11:00:00'), (12, 2, '2026-09-13 11:00:00'), (13, 2, '2026-09-14 11:00:00'), (15, 2, '2026-09-16 11:00:00'),
    (2, 3, '2026-09-03 12:00:00'), (6, 3, '2026-09-07 12:00:00'), (11, 3, '2026-09-12 12:00:00'), (4, 3, '2026-09-05 12:00:00'), (9, 3, '2026-09-10 12:00:00'),
    (17, 3, '2026-09-18 12:00:00'), (16, 3, '2026-09-17 12:00:00'), (18, 3, '2026-09-19 12:00:00'), (20, 3, '2026-09-21 12:00:00'), (21, 3, '2026-09-22 12:00:00');
```

읽을 곳:

- `ENUM ('PUBLIC', 'PRIVATE')` — 이 두 값만 들어간다. JPA에서는 `@Enumerated(EnumType.STRING)`으로 맞춘다(10-5).
- `INDEX idx_posts_popular (like_count, id)` — 인기순 정렬(`like_count DESC, id DESC`)용 인덱스.
- `comments.parent_id`가 같은 테이블의 `id`를 가리킨다(자기 참조 외래 키). 답글을 이렇게 표현한다.
- 비밀번호 칸에 `$2a$10$...`가 들어 있다. `$2a$`는 BCrypt, `10`은 반복 강도(2의 10제곱 번)다.

Flyway는 실행한 파일을 `flyway_schema_history` 테이블에 적고 **다시 실행하지 않는다**. 한 번 적용한 V1을 고치면 다음 기동이 실패한다(아래 망가뜨리기 ③). 스키마를 바꾸려면 V2 파일을 새로 만든다(마이그레이션은 [J2](../../lessons/J2-why-migrations.md)).

### CorsConfig

`src/main/java/org/example/board/common/CorsConfig.java`

```java
package org.example.board.common;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// 별도 브라우저 실행 화면(다른 출처)이 /api/** 를 부를 수 있게 연다 — 1-1과 같은 설정
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("http://localhost:[*]", "http://127.0.0.1:[*]")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("Content-Type", "Authorization")
                .exposedHeaders("Location", "WWW-Authenticate");
    }
}
```

1-1의 [CORS 열기](../ch1-create-post/1-1-receive-request.md#cors-열기)와 같다. 왜 필요한지는 [F3](../../lessons/F3-cors.md)에 있다.

짧게 정리하면 이렇다. 브라우저 화면(`localhost:3000`)과 내 서버(`localhost:8080`)는 출처가 달라서, 서버가 허락해야 브라우저가 응답을 화면 코드에 넘겨준다. `PUT`·`DELETE`와 `Authorization` 헤더는 10-4 이후에 쓰지만 지금 같이 열어 둔다.

### HealthController

`src/main/java/org/example/board/common/HealthController.java`

```java
package org.example.board.common;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

// 서버가 떠 있고, project DB에 붙었고, Flyway V1이 시드를 넣었는지 한 번에 본다
@RestController
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/api/v1/health")
    public Map<String, Object> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("up", true);
        body.put("database", jdbcTemplate.queryForObject("SELECT DATABASE()", String.class));
        body.put("users", count("users"));
        body.put("posts", count("posts"));
        body.put("comments", count("comments"));
        body.put("likes", count("post_likes"));
        return body;
    }

    private long count(String table) {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + table, Long.class);
    }
}
```

| 코드 | 설명 |
|---|---|
| `private final JdbcTemplate jdbcTemplate;` + 생성자 | Spring이 만들어 둔 `JdbcTemplate`(SQL을 바로 실행하는 도구)을 생성자로 받는다. 생성자가 하나면 `@Autowired`를 안 적어도 된다 |
| `Map<String, Object> body = new LinkedHashMap<>();` | 응답 JSON 객체. `LinkedHashMap`은 넣은 순서를 지켜서 JSON 키 순서가 코드 순서와 같다 |
| `queryForObject("SELECT DATABASE()", String.class)` | 결과가 한 칸인 SQL을 실행해 그 값을 `String`으로 받는다. 지금 붙은 DB 이름이다 |
| `"SELECT COUNT(*) FROM " + table` | 테이블 이름은 `?` 자리표시자로 넣을 수 없어 문자열로 붙였다. **바깥 입력을 이렇게 붙이면 SQL 주입이 된다** — 여기서는 코드에 박힌 이름만 쓰므로 괜찮다 |

### 실행

IntelliJ에서 `BoardApiApplication`을 실행하거나 터미널에서 `./gradlew bootRun`을 실행한다. 로그에 아래 두 줄이 보이면 Flyway가 V1을 실행한 것이다.

```text
Migrating schema `project` to version "1 - init"
Successfully applied 1 migration to schema `project`, now at version v1 (execution time 00:00.084s)
```

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- HealthController가 JdbcTemplate으로 DB 이름과 테이블별 행 수를 읽는다
- 테이블은 앱이 뜰 때 Flyway가 V1__init.sql로 만들었다
- V1_init.sql(밑줄 하나)은 Flyway가 마이그레이션으로 알아보지 못한다. 로그: No migrations found. Are your locations set up correctly? — 그래도 앱은 뜬다
- Table 'project.users' doesn't exist

<details>
<summary>Controller — HTTP 연결</summary>

`HealthController.java`. 매핑과 메서드의 입력·응답을 위 **만들 것**의 HTTP 계약과 대조한다. 이번 단계 매핑: `@GetMapping("/api/v1/health")`. 변경된 메서드: `health`.

```java
@GetMapping("/api/v1/health")
public Map<String, Object> health() {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("up", true);
    body.put("database", jdbcTemplate.queryForObject("SELECT DATABASE()", String.class));
    body.put("users", count("users"));
    body.put("posts", count("posts"));
    body.put("comments", count("comments"));
    body.put("likes", count("post_likes"));
    return body;
}
```

테이블 이름은 사용자 입력이 아니라 컨트롤러 안의 고정 문자열 네 개다. `count`가 SQL 문자열에 이름을 붙일 수 있는 이유도 그 범위가 고정돼 있기 때문이다. 이 단계의 DB 읽기는 `JdbcTemplate`이 담당하며 JPA Entity나 MyBatis Mapper는 만들지 않는다.

</details>

<details>
<summary>Flyway / SQL — 스키마 변경</summary>

`V1__init.sql`. 실행 순서와 DDL·백필 대상을 시나리오의 스키마 계약과 대조한다.

위 **따라 치기**의 SQL 전문과 아래 전체 구현 코드 접기가 같은 파일이다. Flyway가 앱 기동 시 `V1__init.sql`을 한 번 적용하고 `flyway_schema_history`에 버전 `1`과 성공 여부를 기록한다. 테이블 여섯 개와 시드(회원 3·글 25·댓글 40·좋아요 30)를 SQL의 `CREATE TABLE`·`INSERT` 순서로 따라가 본다.

</details>

<details>
<summary>설정·보조 코드</summary>

`CorsConfig.java`, `application.yml`. 이 파일에서 바뀐 설정·보조 타입이 서버 흐름의 어느 단계에 필요한지 확인한다. 변경된 메서드: `addCorsMappings`.

```java
registry.addMapping("/api/**")
        .allowedOriginPatterns("http://localhost:[*]", "http://127.0.0.1:[*]")
        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        .allowedHeaders("Content-Type", "Authorization");
```

`application.yml`의 datasource는 `project` DB를 가리키고, `ddl-auto: validate`라 테이블을 만들지 않는다. 스키마 생성·시드의 책임은 Flyway V1에 있다.

</details>

## 직접 확인

API 서버 주소는 페이지 상단의 공통 입력에서 설정한다. 아래 실행 패널에서 요청을 보내고 응답과 채점 기준을 확인한다. Postman 설정은 접어서 필요할 때 확인할 수 있다.

DB도 터미널에서 직접 본다(javaExperience MySQL 컨테이너 이름이 다르면 `docker ps`로 찾는다).

```bash
docker compose exec -T mysql mysql -ucommunity -pcommunity project \
  -e "SELECT version, description, success FROM flyway_schema_history; SELECT id, email, nickname FROM users;"
```

버튼으로 확인 — 아래 실행 패널에서 요청을 보내고 채점 기준의 C 항목을 대조한다.

```check
{
  "requests": [
    { "id": "H", "title": "헬스 체크", "method": "GET", "path": "/api/v1/health" }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "H",
      "expect": {
        "status": 200,
        "json": [
          { "path": "$.up", "equals": true },
          { "path": "$.database", "equals": "project" },
          { "path": "$.users", "gte": 3 },
          { "path": "$.posts", "gte": 25 },
          { "path": "$.comments", "gte": 40 },
          { "path": "$.likes", "type": "number" },
          { "path": "$.status", "exists": false }
        ]
      }
    },
    {
      "id": "C2",
      "manual": "CORS preflight — 브라우저 코드는 Origin·Access-Control-Request-* 헤더를 직접 못 붙인다. Postman 요청 O로 200, Access-Control-Allow-Origin: http://localhost:3000, Allow-Methods에 PUT, Allow-Headers에 authorization이 있는지 본다"
    }
  ]
}
```

C1의 `$.status` "없음"은 이 단계에서 아직 공통 틀로 감싸지 않았는지 보는 것이다. 10-2에서 틀을 씌우면 C1은 실패하는 게 정상이다.

## 채점 기준

C = HTTP 확인(필수), D = DB 확인(필수, SELECT만), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| C1 | 요청 H | 상태 `200`, `up`=`true`, `database`=`project`, `users` ≥ 3, `posts` ≥ 25, `comments` ≥ 40, `likes`는 숫자. 아직 공통 틀(`status`) 없음 |
| C2 | Postman 수동 OPTIONS 요청 O | 상태 `200`, `Access-Control-Allow-Origin: http://localhost:3000`, `Access-Control-Allow-Methods`에 `PUT`, `Access-Control-Allow-Headers`에 `authorization` |
| D1 | `SELECT version, success FROM flyway_schema_history` | `1`, `1` 한 줄 |
| D2 | `SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM posts; SELECT COUNT(*) FROM comments; SELECT COUNT(*) FROM post_likes` | `3`·`25`·`40`·`30`(채점 전 다른 단계를 돌렸다면 그 이상) |
| R1 | 설정 | `ddl-auto`가 `validate`(또는 `none`)다 — Hibernate가 스키마를 만들지 않는다 |
| R2 | 마이그레이션 | V1 파일 이름이 `V1__init.sql` 규칙을 지키고, 내용을 고치지 않았다 |
| R3 | CORS | `allowedOrigins("*")`로 모두 열지 않았다 |

## 일부러 망가뜨리기

하나씩 바꾸고 다시 띄운 뒤 확인한다. 끝나면 되돌린다. 아래 원문은 모두 Boot 4.1.1·MySQL 8.0에서 재현했다(경로·시각·숫자는 환경마다 다르다).

### ① DB 이름 오타(또는 DB를 안 만듦) → 앱이 뜨지 않는다

`application.yml`의 URL을 `.../projet?...`로 바꾼다.

```text
ERROR ... o.s.boot.SpringApplication : Application run failed
...
Caused by: org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'flywayInitializer' defined in class path resource [org/springframework/boot/flyway/autoconfigure/FlywayAutoConfiguration$FlywayConfiguration.class]: Unable to obtain connection from database: Access denied for user 'community'@'%' to database 'projet'
...
Caused by: java.sql.SQLSyntaxErrorException: Access denied for user 'community'@'%' to database 'projet'
```

- 읽는 법: 맨 아래 `Caused by`가 진짜 원인이다. **없는 DB인데 "Access denied"(권한 없음)** 가 나온다.
  실습 계정은 권한을 받은 DB 말고는 있든 없든 "권한 없음"으로 답한다. `docker compose exec -T mysql mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS project"`를 한 번도 안 돌려 `project` 권한이 없을 때도 이 모양이다.
- 권한은 있는데 DB만 없으면(`--drop` 뒤 등) 원인 줄이 `java.sql.SQLSyntaxErrorException: Unknown database 'project'`로 바뀐다.
- 고치기: URL의 DB 이름을 확인한다. 맞으면 javaExperience 레포에서 `docker compose exec -T mysql mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS project; GRANT ALL PRIVILEGES ON project.* TO 'community'@'%';"`를 실행한다.

### ② V1 파일 이름에 밑줄을 하나만 → 앱은 뜨는데 500

파일 이름을 `V1_init.sql`로 바꾸고, DB를 처음 상태로(`docker compose down -v && docker compose up -d`) 돌린 뒤 띄운다. **루트 compose의 `down -v`는 `community`·`practice`·`project` DB와 CloudBeaver 작업 공간(저장한 SQL·연결 설정)을 함께 초기화한다. 먼저 `./docker/mysql/dump.sh`로 DB를 백업하고 CloudBeaver 자료는 따로 보관한다(DB 덤프에 포함되지 않음).**

```text
WARN ... o.f.core.internal.command.DbValidate : No migrations found. Are your locations set up correctly?
```

앱은 정상으로 뜬다. 요청 H를 보내면 500이다.

```text
ERROR ... Servlet.service() for servlet [dispatcherServlet] in context with path [] threw exception [Request processing failed: org.springframework.jdbc.BadSqlGrammarException: StatementCallback; bad SQL grammar [SELECT COUNT(*) FROM users]] with root cause

java.sql.SQLSyntaxErrorException: Table 'project.users' doesn't exist
```

- 읽는 법: Flyway는 이름 규칙에 안 맞는 파일을 **조용히 건너뛴다**(경고 한 줄뿐). 테이블이 안 생겼으니 첫 SQL에서 터진다. 기동 로그의 `WARN`을 놓치지 않는다.
- 고치기: 파일 이름을 `V1__init.sql`로 되돌리고 앱을 다시 띄운다.

### ③ 이미 적용된 V1을 고친다 → 앱이 뜨지 않는다

V1이 한 번 적용된 상태에서 파일 끝에 `INSERT INTO tags (name) VALUES ('docker');`를 한 줄 더하고 다시 띄운다.

```text
Migration checksum mismatch for migration version 1
-> Applied to database : 702228255
-> Resolved locally    : 2004495608
Either revert the changes to the migration, or run repair to update the schema history.
...
Caused by: org.springframework.beans.factory.BeanCreationException: Error creating bean with name 'flywayInitializer' defined in class path resource [org/springframework/boot/flyway/autoconfigure/FlywayAutoConfiguration$FlywayConfiguration.class]: Validate failed: Migrations have failed validation
```

- 읽는 법: Flyway는 실행한 파일의 **체크섬(내용 지문)** 을 기록해 둔다. 기록(`Applied to database`)과 지금 파일(`Resolved locally`)이 다르면 "누가 이미 실행한 이력을 고쳤다"로 보고 멈춘다. 운영 DB에서는 이게 안전장치다.
- 고치기: V1을 원래대로 되돌린다. 바꾸고 싶은 내용은 `V2__add_docker_tag.sql`처럼 **새 파일**로 만든다. 실습 DB라 처음부터 다시 하고 싶으면 `docker compose down -v && docker compose up -d`을 실행한다. **루트 compose의 `down -v`는 `community`·`practice`·`project` DB와 CloudBeaver 작업 공간(저장한 SQL·연결 설정)을 함께 초기화한다. 먼저 `./docker/mysql/dump.sh`로 DB를 백업하고 CloudBeaver 자료는 따로 보관한다(DB 덤프에 포함되지 않음).**

### ④ CorsConfig를 지운다 → 버튼만 실패, Postman은 응답 확인

`CorsConfig.java`를 지우고 다시 띄운 뒤 요청 O를 보낸다.

```text
HTTP/1.1 200
Allow: GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH
Content-Length: 0
```

`Access-Control-Allow-Origin`이 없다. 그래서 브라우저가 본 요청을 보내지 않고, 실행 칸에 "CORS로 막혔어요"가 뜬다. Postman은 브라우저의 CORS 정책을 적용하지 않아 요청 H의 응답을 그대로 보여 준다.

## 필요한 지식

- [A5 REST API 설계와 명세서 읽기](../../lessons/A5-rest-api-design.md) — 명세 표의 메서드·상태 코드·`Location`을 읽는 법
- [A3 서버 프로그램 — 포트·프로세스·localhost·로그](../../lessons/A3-server-process-port.md) — 8080, 기동 로그
- [A4 Spring Boot가 해 주는 것](../../lessons/A4-what-spring-boot-does.md) — starter와 자동 설정
- [C2 Gradle — 의존성이 뭐고 어디서 오나](../../lessons/C2-gradle-dependencies.md)
- [C3 application.yml과 프로필](../../lessons/C3-application-yml-profiles.md)
- [E2 DB와 테이블·SQL 기초](../../lessons/E2-db-sql-basics.md) — `CREATE TABLE`·외래 키·`INSERT`
- [J2 마이그레이션은 왜 필요한가](../../lessons/J2-why-migrations.md) — Flyway가 파일을 한 번만 실행하는 이유
- [F3 CORS](../../lessons/F3-cors.md)
- [P19 MySQL·JPA 설정](../../docs/knowledge/P19-mysql-jpa-setup.md) — datasource·`ddl-auto`

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — start.spring.io에 Spring Boot 4.1.1이 안 보인다</summary>

목록에 있는 4.1.x 중 가장 최신을 고른 뒤, 받은 `build.gradle`의 `org.springframework.boot` 플러그인 버전을 `4.1.1`로 고친다. IntelliJ에서 Gradle 새로고침(코끼리 아이콘)을 누른다.
</details>

<details>
<summary>힌트 2 — 앱이 Flyway에서 멈춘다</summary>

로그 맨 아래 `Caused by`를 읽는다. `Access denied ... to database`면 DB 이름이나 `docker compose exec -T mysql mysql -uroot -proot -e "CREATE DATABASE IF NOT EXISTS project"`를 확인한다(①).

`checksum mismatch`면 V1을 고친 것이다(③). `Communications link failure`면 MySQL 컨테이너가 안 떠 있다(`docker ps`로 `javaExperience mysql`을 확인한다). </details>

<details>
<summary>힌트 3 — 헬스 체크 숫자가 0이다</summary>

테이블은 있는데 비어 있다면 V1의 `INSERT` 부분을 빠뜨렸다. 이미 적용된 V1은 고칠 수 없으니 `docker compose down -v && docker compose up -d` 후 V1 전문을 다시 붙이고 띄운다. **루트 compose의 `down -v`는 `community`·`practice`·`project` DB와 CloudBeaver 작업 공간(저장한 SQL·연결 설정)을 함께 초기화한다. 먼저 `./docker/mysql/dump.sh`로 DB를 백업하고 CloudBeaver 자료는 따로 보관한다(DB 덤프에 포함되지 않음).**
</details>

## 다음 단계

[10-2. 공통 응답 틀과 전역 예외 처리](10-2-common-response.md) — 모든 응답을 `{status, message, data}`로 감싸고, 실패도 같은 틀로 돌려준다.
