# advanced 담당 레슨 외부 기술 근거

확인일: 2026-10-22

## 외부 HTTP 및 SSRF

- [OWASP Server Side Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) — 사용자 입력 URL을 서버가 가져오는 이미지/링크 미리보기도 SSRF 맥락에 해당한다. 전체 URL을 그대로 받지 않는 것을 권고하고, allowlist 및 리다이렉트 비활성화, DNS rebinding, 검증된 IP로 연결하는 문제를 다룬다. H8은 timeout/HTTP 실패 흐름은 실습하지만 URL destination 검증을 구현하지 않는 원리 레슨이므로 16-4에서 별도 안전 경로가 필요함을 설명하는 근거로 사용.
- [Spring Boot 4.1 Calling REST Services](https://docs.spring.io/spring-boot/4.1/reference/io/rest-client.html) — Boot 4.1.1 문서를 확인. `RestClient.Builder` auto-configuration과 imperative API, `spring.http.clients.connect-timeout`/`read-timeout`, `RestClient.create()`가 Boot auto-configuration을 받지 않는 점을 대조.

## 스케줄 및 비동기 실행

- [Spring Boot 4.1 Task Execution and Scheduling](https://docs.spring.io/spring-boot/4.1/reference/features/task-execution-and-scheduling.html) — Boot 4.1.1 문서. 실행기 auto-configuration, virtual threads 사용 시 `SimpleAsyncTaskExecutor`, scheduling pool 설정 및 기본 동작과 H3/H6의 설명을 대조.
- [Spring Boot 4.1 Caching](https://docs.spring.io/spring-boot/4.1/reference/io/caching.html) — Boot 4.1.1 문서. `@EnableCaching`으로 cache infrastructure를 구성하고 cache provider 선택을 별도로 둔다는 점을 H7과 대조.

## CSV·시간·DB 타입

- [RFC 4180: Common Format and MIME Type for CSV Files](https://www.rfc-editor.org/rfc/rfc4180.txt) — CSV quoting, embedded quote, record ending 예시를 H9 원문과 대조.
- [OWASP CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection) — 스프레드시트 수식으로 해석될 수 있는 셀 값과 작은따옴표/탭 처리의 한계를 대조. H9 원문 자체가 Excel 재저장 후 작은따옴표 처리 한계를 구분한다.
- [MySQL 8.0 DATE, DATETIME, and TIMESTAMP Types](https://dev.mysql.com/doc/refman/8.0/en/datetime.html) — MySQL `TIMESTAMP`/`DATETIME` 시간대 변환과 2038 범위 예시의 근거. 결과는 해당 MySQL 버전과 session time_zone 조건으로 한정.

## 검증 한계

위 자료는 2026-10-22 확인 당시 공식 페이지다. 레슨에 인쇄된 실행 로그·시간·결과는 원문에 기록된 저자 실행 예시이며 이번 감사에서 재현하지 않았다. 온라인 문서가 현재라는 사실은 별도 실습 결과의 재현을 뜻하지 않는다.
