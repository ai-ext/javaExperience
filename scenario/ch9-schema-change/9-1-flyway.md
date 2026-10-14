# 9-1. Flyway 도입 — 지금 스키마를 기준선으로

> **9장은 학습용 DB(`practice`)로 채점한다.** 앱을 `practice` 프로파일로 띄운다(8-1 참고). 9장에서 만드는 마이그레이션은 `community`에도 똑같이 적용된다(두 DB는 같은 스키마). 스키마를 처음으로 되돌리려면 javaExperience 레포 루트에서 `docker compose down -v && docker compose up -d`.

## 상황

지금까지 테이블은 Docker가 처음 뜰 때 dump로 만들었다. 운영 DB는 그렇게 다시 만들 수 없다. 데이터가 이미 있기 때문이다. 앞으로 스키마를 바꾸려면 **"어떤 변경이 어느 DB에 적용됐는지"를 기록하면서 순서대로** 적용해야 한다. 그 일을 하는 도구가 Flyway다.

이미 테이블과 데이터가 있는 DB에 Flyway를 붙이는 것부터 한다. 지금 스키마를 **V1(기준선)** 으로 정하고, 이미 있는 DB에서는 V1을 건너뛰게 한다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름을 펼치면 사용자 행동부터 응답까지 차례대로 볼 수 있다.

```screen
{
  "title": "배포 — 사용자는 아무 변화도 못 느껴야 한다",
  "summary": "이미 데이터가 있는 DB에 Flyway를 붙인다. 앱이 뜰 때 Flyway가 먼저 돌고, 그다음 요청을 받는다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "앱 기동 로그"
    },
    {
      "type": "code",
      "id": "log",
      "label": "practice 프로파일로 기동",
      "value": "Flyway Community Edition 12.4.0\nSuccessfully baselined schema with version: 1\nStarted Main in 2.1 seconds"
    },
    {
      "type": "text",
      "id": "post-title",
      "value": "MySQL 인덱스 설계 질문드립니다",
      "emphasis": "title"
    },
    {
      "type": "text",
      "id": "note",
      "value": "글 145개가 그대로 있다",
      "emphasis": "caption",
      "tone": "muted"
    }
  ],
  "flows": [
    {
      "name": "기존 DB에 처음 붙일 때",
      "steps": [
        {
          "kind": "user",
          "text": "새 버전 앱을 띄운다",
          "focus": [
            "log"
          ]
        },
        {
          "kind": "server",
          "text": "Flyway: flyway_schema_history가 없다 + 테이블은 있다 → baseline-on-migrate → 'V1까지 됐다'고만 기록(V1을 실행하지 않음)"
        },
        {
          "kind": "db",
          "sql": "CREATE TABLE flyway_schema_history (...); INSERT INTO flyway_schema_history (version, type, ...) VALUES ('1', 'BASELINE', ...)"
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/posts/12"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"id\": 12, \"title\": \"MySQL 인덱스 설계 질문드립니다\", ...}"
        },
        {
          "kind": "screen",
          "text": "기존 글이 그대로 보인다 — 사용자에게는 아무 일도 없었다",
          "focus": [
            "post-title",
            "note"
          ]
        }
      ]
    },
    {
      "name": "빈 DB(테스트)",
      "steps": [
        {
          "kind": "user",
          "text": "./gradlew test",
          "focus": [
            "log"
          ]
        },
        {
          "kind": "server",
          "text": "Testcontainers의 빈 DB → Flyway가 V1(테이블)을 실제로 실행하고, 테스트 전용 V1_1(시드)을 넣는다"
        },
        {
          "kind": "request",
          "method": "GET",
          "path": "/api/posts/2"
        },
        {
          "kind": "response",
          "status": 200
        },
        {
          "kind": "screen",
          "text": "테스트도 같은 마이그레이션으로 만든 스키마 위에서 돈다"
        }
      ]
    }
  ]
}
```

## 만들 것

| 할 일 | 내용 |
|---|---|
| 의존성 | `implementation 'org.springframework.boot:spring-boot-starter-flyway'` + `runtimeOnly 'org.flywaydb:flyway-mysql'`(버전은 Boot가 관리, Flyway 12.4) |
| V1 | `src/main/resources/db/migration/V1__init.sql` — 지금 스키마(테이블만, 데이터 없음). 아래 명령으로 만든 뒤 앞에 `SET FOREIGN_KEY_CHECKS = 0;`, 끝에 `SET FOREIGN_KEY_CHECKS = 1;`을 붙인다 |
| 기존 DB | `spring.flyway.baseline-on-migrate: true`, `baseline-version: 1` — 테이블이 이미 있는 DB는 V1을 실행하지 않고 "V1까지 됐다"고만 기록한다 |
| JPA | `ddl-auto: validate` 그대로 — 스키마는 Flyway만 바꾼다 |
| 테스트 | 빈 DB에 Flyway가 V1을 실행한 **다음** 시드 데이터가 들어가야 한다. `application-test.yml`의 `spring.sql.init`을 지우고, 시드 데이터를 테스트 전용 마이그레이션 `src/test/resources/db/testdata/V1_1__community_seed.sql`로 옮긴 뒤 `spring.flyway.locations: classpath:db/migration,classpath:db/testdata` |

```bash
# V1: 테이블 구조만
docker compose exec -T mysql mysqldump -uroot -proot --no-data --compact --skip-add-drop-table community \
  | sed -E 's/ AUTO_INCREMENT=[0-9]+//' > src/main/resources/db/migration/V1__init.sql   # 데이터에 따라 달라지는 시작 번호는 기준선에서 뺀다
# 테스트 시드: 데이터만
docker compose exec -T mysql mysqldump -uroot -proot --no-create-info --compact --skip-extended-insert community \
  > src/test/resources/db/testdata/V1_1__community_seed.sql
```

시드 dump에는 다른 장에서 쌓인 채점 데이터가 섞이지 않도록 **DB를 초기화한 직후**에 뜬다(javaExperience 레포 루트에서 `docker compose down -v && docker compose up -d`). 데이터 파일 앞에도 `SET FOREIGN_KEY_CHECKS = 0;`을 붙인다.

## 구현 가이드

화면 시나리오의 서버·DB 흐름을 이 단계에서 바뀐 파일에 연결한다. 먼저 **만들 것**의 계약대로 직접 작성하고, 필요한 역할만 펼쳐 파일 전문과 비교한다.

이 단계의 처리 흐름:
- Flyway: flyway_schema_history가 없다 + 테이블은 있다 → baseline-on-migrate → 'V1까지 됐다'고만 기록(V1을 실행하지 않음)
- Testcontainers의 빈 DB → Flyway가 V1(테이블)을 실제로 실행하고, 테스트 전용 V1_1(시드)을 넣는다

<details>
<summary>Flyway / SQL — 스키마 변경</summary>

`V1__init.sql`: 빈 DB에서 실행할 기준 스키마다. 기존 테이블이 있는 DB에서는 `baseline-on-migrate`가 V1을 실행하지 않고 이력을 남긴다. 파일 전문에는 이 단계까지 사용한 모든 테이블·외래키·인덱스가 들어 있다.

```sql
SET FOREIGN_KEY_CHECKS = 0;
CREATE TABLE `board` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `slug` varchar(30) NOT NULL,
  `name` varchar(50) NOT NULL,
  `write_role` varchar(20) NOT NULL DEFAULT 'USER',
  `sort_order` int NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_board_slug` (`slug`),
  CONSTRAINT `ck_board_write_role` CHECK ((`write_role` in (_utf8mb4'USER',_utf8mb4'ADMIN')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='게시판 — write_role=ADMIN이면 운영자만 글쓰기(공지)';
SET FOREIGN_KEY_CHECKS = 1;
```

위 코드는 V1의 `board` DDL을 발췌했다. 실제 V1은 `post`를 포함한 모든 테이블을 생성하므로 아래 **전체 구현 코드**에서 원문을 확인한다. 적용된 V1을 수정하면 Flyway 체크섬 검증이 실패하므로 다음 변경은 V2 파일에 쓴다.

</details>

<details>
<summary>Gradle / Flyway 의존성</summary>

`build.gradle`: Boot가 Flyway 버전을 관리하고 MySQL용 확장을 실행할 때 로드한다.

```groovy
implementation 'org.springframework.boot:spring-boot-starter-flyway'
runtimeOnly 'org.flywaydb:flyway-mysql'
```

</details>

<details>
<summary>설정 / 기존 DB 기준선</summary>

`application.yml`: 테이블이 이미 있으면 버전 1까지 적용된 것으로 기록한다. 이후 버전만 실행한다. JPA는 스키마를 검증한다.

```yaml
spring:
  flyway:
    baseline-on-migrate: true
    baseline-version: 1
  jpa:
    hibernate:
      ddl-auto: validate
```

</details>

<details>
<summary>MyBatis / 같은 마이그레이션 적용</summary>

MyBatis를 선택해도 Flyway가 먼저 V1을 판정한다. MyBatis용 별도 스키마 파일은 만들지 않는다. 아래 **MyBatis 대체 구현 코드**는 8-5까지의 Mapper 경로를 유지하면서 이 단계의 Flyway 의존성과 설정을 합친 전체 파일을 제공한다.

```groovy
implementation 'org.mybatis.spring.boot:mybatis-spring-boot-starter:4.1.0'
implementation 'org.springframework.boot:spring-boot-starter-flyway'
runtimeOnly 'org.flywaydb:flyway-mysql'
```

```yaml
spring:
  flyway:
    baseline-on-migrate: true
    baseline-version: 1
mybatis:
  mapper-locations: classpath:mapper/*.xml
  configuration:
    map-underscore-to-camel-case: true
```

</details>

<details>
<summary>테스트 / 빈 DB의 스키마와 시드</summary>

`application-test.yml`은 빈 MySQL Testcontainer에서 V1을 실제 실행하고, 테스트 경로의 V1_1로 시드를 넣는다. `V1_1__community_seed.sql`은 운영 앱의 마이그레이션 경로에 두지 않는다.

```yaml
spring:
  datasource:
    url: jdbc:tc:mysql:8.4:///community
  flyway:
    locations: classpath:db/migration,classpath:db/testdata
```

```sql
-- V1_1__community_seed.sql의 실제 시드 일부
SET FOREIGN_KEY_CHECKS = 0;
INSERT INTO `board` VALUES (2,'dev','개발','USER',2,'2026-09-01 09:00:00');
-- 회원·게시글 등 나머지 시드는 파일 전문에 있다.
SET FOREIGN_KEY_CHECKS = 1;
```

</details>

## 직접 확인

```bash
./gradlew bootRun --args='--spring.profiles.active=practice'      # 로그에 "Successfully baselined schema with version: 1"
docker compose exec -T mysql mysql -ucommunity -pcommunity practice -e "SELECT installed_rank, version, type, success FROM flyway_schema_history"
./gradlew test
```

## 채점 기준

D = DB 확인(필수, SELECT만), T = 테스트 실행(필수), R = 코드 리뷰(피드백용).

| # | 확인 방법 | 기대 |
|---|---|---|
| D1 | `SELECT version, type, success FROM flyway_schema_history ORDER BY installed_rank LIMIT 1` | `1`, `BASELINE`, `1` |
| D2 | `SELECT COUNT(*) FROM post` | `145` 이상 — 기존 데이터가 그대로 있다(V1이 기존 DB에서 실행되지 않았다) |
| T1 | `./gradlew test` | 통과 — 빈 테스트 DB에서는 V1이 실제로 실행되고 그 위에 시드가 들어간다 |
| R1 | 한 가지 도구 | 스키마를 만드는 길이 Flyway 하나다. `spring.sql.init`·`ddl-auto: update/create`가 함께 쓰이지 않는다 |
| R2 | 기준선 | 왜 `baseline-on-migrate`가 필요한지(이미 있는 DB에서 V1의 `CREATE TABLE`이 실패) 설명할 수 있다 |
| R3 | 고치지 않기 | 적용된 마이그레이션 파일은 고치지 않고 새 버전을 추가한다는 규칙과 그 이유(체크섬 검증)를 안다 |
| R4 | 테스트 데이터 위치 | 시드 데이터가 운영용 마이그레이션 폴더(`db/migration`)에 섞이지 않았다 |

## 필요한 지식

- [S11 캐시·Redis·DB 마이그레이션](../../docs/knowledge/S11-cache-redis-migration.md) — Flyway의 원리
- [P19 — `ddl-auto`는 환경별 정책이다](../../docs/knowledge/P19-mysql-jpa-setup.md#24-ddl-auto는-환경별-정책이다)
- [V04 테스트 DB 전략](../../docs/knowledge/V04-test-db-strategy.md)
- [R07 백업과 복원](../../docs/knowledge/R07-backup-restore.md) — 스키마를 바꾸기 전에

## 다음 단계

[9-2. 인덱스와 실행 계획](9-2-index-explain.md)
