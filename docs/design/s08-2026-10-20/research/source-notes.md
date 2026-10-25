# 공식 출처 조회 기록

조회일: 2026-10-20 KST. Codex CLI `gpt-6-luna` / `openai` 직접 사용, LiteLLM 미사용. 아래 Spring/AWS/DB 문서는 공식 제공처이며 웹 도구로 페이지 본문 또는 검색으로 반환된 본문 내용을 실제 확인했다. 검색 결과만 확인한 문서는 표시했다.

| URL | 읽은 부분·요약 | 상태/한계 |
|---|---|---|
| https://docs.spring.io/spring-framework/reference/core/aop/proxying.html | Proxying Mechanisms: JDK/CGLIB, subclass 및 final/private/비가시 메서드 제한. 문서가 Spring Framework 7.0.9로 표기. | 검색 결과 본문 확인 |
| https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html | Method visibility: Spring 6.0+ class proxy에서 protected/package-visible 허용, proxy를 통과한 외부 호출만 interception. self-invocation 제외. | 검색 결과 본문 확인. 페이지는 current 문서이며 7.0.9 기준으로 확인 |
| https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/rolling-back.html | 기본 runtime/Error rollback, checked 기본 commit, 타입 및 패턴 규칙, strongest rule, Future 반환 시점의 exceptionally completed 처리(6.1+). | 검색 결과 본문 확인. 검색 결과는 6.2 페이지이므로 API 변경점은 별도 버전 주의 |
| https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html | REQUIRED rollback-only의 UnexpectedRollbackException, REQUIRES_NEW 독립 물리 트랜잭션/추가 연결, NESTED savepoint. | 검색 결과 본문 확인. 결과는 7.1 reference URL로 반환되어 최신 7.0.9 안내와 내용 함께 확인 |
| https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/datasource/DataSourceTransactionManager.html | setEnforceReadOnly, 기본 JDBC readOnly hint와 선택 SQL enforcement; 7.0.9 API 표기. | 검색 결과 본문 확인 |
| https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/support/AbstractPlatformTransactionManager.html | validateExistingTransaction, 참여 시 outer 특성 적용; nested 지원 기본/설정 API; 7.0.9 API 표기. | 검색 결과 본문 확인 |
| https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/support/TransactionTemplate.html | execute callback, 반환 result와 예외/rollback lifecycle; 7.0.9 API 표기. | 검색 결과 본문 확인 |
| https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/TransactionExecution.html | setRollbackOnly 및 rollback-only 상태의 의미; 7.0.9 API 표기. | 검색 결과 본문 확인 |
| https://docs.spring.io/spring-framework/reference/data-access/transaction/event.html | `@TransactionalEventListener` 단계 및 fallback 동작을 참고 대상으로 삼았다. | 직접 URL 열기 실패: 웹 도구에서 URL inaccessible. 상세 문단 확인 미완료로 간주; 이 조사에서 세부 API 문구는 확정하지 않음 |
| https://docs.spring.io/spring-framework/reference/data-access/transaction/programmatic.html | `TransactionTemplate` programmatic management 맥락. | 이 턴에서 직접 본문 열기/검색 확인 미수행. API Javadoc만 직접 확인 |
| https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html | Managed coordinates: Boot 4.1.1과 org.springframework Spring Framework 모듈 7.0.9. | 검색 결과 본문 확인 |
| https://www.postgresql.org/docs/18/transaction-iso.html | PostgreSQL 18의 표준 격리 표, READ UNCOMMITTED mapping, REPEATABLE READ phantom behavior. URL 본문 직접 열기. | 직접 확인 완료; 문서는 PostgreSQL 18 명시 |
| https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html | MySQL 8.4 InnoDB transaction isolation 공식 장. URL 본문 직접 열기. | 직접 확인 완료; 실측은 하지 않음 |
| https://h2database.com/html/advanced.html | H2 공식 Advanced 문서. | 페이지 직접 열기 성공했으나 이번 핵심 주장에 인용할 상세 절은 추출하지 않음; H2 실동작 단정에 사용 안 함 |
| https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html | Outbox pattern 개요. URL 본문 직접 열기. | 직접 열기 성공; 요약은 DB transaction/outbox와 relay를 구분하는 수준 |

## 조회 실패 및 해석 한계

- Spring Reference의 버전 고정 `/reference/7.0/...` URL 세 개(event, propagation, rolling-back)를 `open`에 직접 넣자 `URL ... is not accessible via this tool`로 실패했다. 검색 결과에서 propagation/rollback 본문은 발견됐으나 event 페이지는 상세 본문을 검색 결과로도 받지 못했다. 따라서 `AFTER_COMMIT`/fallback/no transaction listener 관련 내용은 이번 확인에서 재확인되지 않은 기존 참고 지식으로 분리해야 한다.
- `/docs/current/javadoc-api/` 검색 결과가 7.0.9 API로 표기되었다. `current`는 장기 고정 URL이 아니므로 인용 시 확인일과 표시 버전을 함께 보존한다.
- 출처 확인은 문서 근거 확인이다. 별도 Spring `AnnotationConfigApplicationContext`, `DataSourceTransactionManager`, `JdbcTemplate`, H2 실험, outbox DDL, broker/CDC/failure/retry 동작은 이번 조사에서 실행하지 않았다.
