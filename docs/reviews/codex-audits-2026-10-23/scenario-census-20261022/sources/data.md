# data 담당 외부 기술 근거

확인일: 2026-10-22 (UTC 조회일 기준)

## MySQL 8.4 실행 계획과 통계

- [MySQL 8.4 Reference Manual: EXPLAIN Statement](https://dev.mysql.com/doc/refman/8.4/en/explain.html) — MySQL 공식 매뉴얼. `EXPLAIN ANALYZE` 실행 측정 관련 문서를 J1, DB-09~11 용어 구분에 참고했다.
- [MySQL 8.4 Reference Manual: ANALYZE TABLE Statement](https://dev.mysql.com/doc/refman/8.4/en/analyze-table.html) — `ANALYZE TABLE`은 table/index 통계를 생성 또는 갱신한다. EXPLAIN ANALYZE 실행 측정과 별도 동작으로 기록했다.
- [MySQL 8.4 Reference Manual: Invisible Indexes](https://dev.mysql.com/doc/refman/8.4/en/invisible-indexes.html) — DB-11 인덱스 visibility 실습의 공식 참조다.

제한: 온라인 문서의 현재 내용은 조회일 기준이며, 감사 worktree compose는 MySQL 8.4를 선언하지만 담당자는 서버를 실행하지 않았다. 특정 DDL lock 시간, 실제 optimizer 선택, row estimate 정확도나 속도는 문서만으로 주장하지 않았다.

## Flyway baseline과 적용 이력

- [Redgate Flyway: Baseline On Migrate](https://documentation.red-gate.com/flyway/reference/configuration/flyway-namespace/flyway-baseline-on-migrate-setting) — 2026-10-22 확인. 기록 테이블이 없는 비어 있지 않은 schema에서 자동 baseline을 하고 baselineVersion보다 높은 migration만 실행한다. 잘못된 DB에 baseline하는 설정 위험도 명시한다. S9-1/J2 대조에 사용.
- [Redgate Flyway: Versioned Migrations](https://documentation.red-gate.com/fd/versioned-migrations-273973333.html) — 2026-10-22 확인. versioned migration은 순서대로 한 번 적용하고 flyway_schema_history에 checksum을 저장한다. 이미 적용된 파일은 수정하지 않고 새 버전을 추가하는 모범 관행을 설명한다. J2/S9-5 대조에 사용.

제한: 공식 문서의 현재 페이지를 확인했다. lesson J2의 임시 테이블 CRC32 예시는 Flyway checksum algorithm과 동일하다고 주장하지 않으며, 문서도 그 차이를 밝힌다. 실제 javaExperience migration 실행은 main runtime evidence와 구분한다.
