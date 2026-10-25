# 근거 메모 (2026-10-20)

- Spring Boot 4.1.1 API `AutoConfigureTestDatabase`: `replace` default는 `NON_TEST`; `connection` default는 `NONE`. `NONE` connection 값과 enum `Replace.NONE`은 서로 다른 설정 축이다.
- Boot 4.1.1 API `AutoConfigureTestDatabase.Replace`: `NON_TEST` test DB 분류는 `ContainerImageMetadata`, `@DynamicPropertySource` 기반 `spring.datasource.url`, Testcontainers JDBC URL을 포함. `ANY`, `AUTO_CONFIGURED`, `NONE` 설명을 각각 구분했다.
- Boot reference Testcontainers: `spring-boot-testcontainers`가 service connection 사용에 필요; 서비스 연결 detail이 connection properties보다 우선. Testcontainers JUnit extension static container는 class 후 중지될 수 있고 Spring context cache가 더 오래 살아 있을 수 있어 lifecycle mismatch가 가능하다.
- Testcontainers 공식 2.0.0 release note: 모든 artifact에 `testcontainers-` prefix, package를 `org.testcontainers.<module>`로 이동. 2.0.5 release 확인만으로 Boot BOM 관리버전이라고 말할 수 없다. 고정 tag의 `MySQLContainer` 공식 source URL은 웹 접근 제한으로 실패했으므로 2.0.5 클래스 정의 세부사항은 version-pinned source 미검증 상태다.
- Spring Framework 7.0.9 `TransactionalTestExecutionListener`: 기본 rollback, 테스트 관리 transaction과 Spring/application-managed transaction 구별, propagation 주의. `TestTransaction` API: `flagForCommit`, `end`, `start` 용도를 직접 열어 확인했다.
- `@Sql` 개별 7.0.9 javadoc URL 조회가 실패함. transaction mode 및 execution phase의 정확한 현재 API 정의는 이번 수집에서 직접 확인하지 못했으며 실험안 문구는 알려진 의미를 제안으로 한정한다. 특정 실행 결과로 표현하지 않는다.
- H2 공식 Features는 MySQL 모드 URL을 제시하고, compatibility mode가 차이의 subset만 구현한다고 설명. H2 문자열은 기본 case-sensitive인 반면 MySQL 기본은 case-insensitive라고 설명.
- MySQL 8.4 공식 매뉴얼은 서버 기본 charset/collation을 `utf8mb4`/`utf8mb4_0900_ai_ci`로 밝히고 해당 collation을 case-insensitive/accent-insensitive로 설명. 구체 비교 SQL 결과는 실험 미실행이므로 예상 후보일 뿐이다.
- 전체 자료는 문헌 조사다. `ProductRepositoryTest`/서비스 구현/기존 knowledge 파일은 이 조사자에게 허용된 경로 밖이어서 읽지 않았으며 메인 담당이 읽은 원문을 수정하지 않았다.
