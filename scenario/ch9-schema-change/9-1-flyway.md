# 9-1. Flyway 도입 — 지금 스키마를 기준선으로

> **9장은 학습용 DB(`practice`)로 채점한다.** 앱을 `practice` 프로파일로 띄운다(8-1 참고). 9장에서 만드는 마이그레이션은 `community`에도 똑같이 적용된다(두 DB는 같은 스키마). 스키마를 처음으로 되돌리려면 `docker compose down -v && docker compose up -d`.

## 상황

지금까지 테이블은 Docker가 처음 뜰 때 dump로 만들었다. 운영 DB는 그렇게 다시 만들 수 없다. 데이터가 이미 있기 때문이다. 앞으로 스키마를 바꾸려면 **"어떤 변경이 어느 DB에 적용됐는지"를 기록하면서 순서대로** 적용해야 한다. 그 일을 하는 도구가 Flyway다.

이미 테이블과 데이터가 있는 DB에 Flyway를 붙이는 것부터 한다. 지금 스키마를 **V1(기준선)** 으로 정하고, 이미 있는 DB에서는 V1을 건너뛰게 한다.

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
  > src/main/resources/db/migration/V1__init.sql
# 테스트 시드: 데이터만
docker compose exec -T mysql mysqldump -uroot -proot --no-create-info --compact --skip-extended-insert community \
  > src/test/resources/db/testdata/V1_1__community_seed.sql
```

시드 dump에는 다른 장에서 쌓인 채점 데이터가 섞이지 않도록 **DB를 초기화한 직후**에 뜬다(`docker compose down -v && docker compose up -d`). 데이터 파일 앞에도 `SET FOREIGN_KEY_CHECKS = 0;`을 붙인다.

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
