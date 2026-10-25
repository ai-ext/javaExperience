# 출처 접근 및 조사 메모

확인일: 2026-10-20 (Asia/Seoul). 검색 결과 및 공식 페이지 발췌를 사용했다. 결과가 직접 페이지를 보여준 경우와 검색 결과 발췌만 받은 경우를 구별한다. 링크는 모두 공식 표준/프로젝트 문서다.

| 주제 | URL | 접근 | 확인 내용 / 한계 |
|---|---|---|---|
| RFC 9110 | https://www.rfc-editor.org/rfc/rfc9110.html | 직접 페이지 및 검색 발췌 | safe/idempotent, POST 재시도 주의, 201/Location, 204, 401/403/404/409/422 의미. 개별 status 정의의 일부 문장은 검색 결과 발췌로 확인. |
| RFC 9457 | https://www.rfc-editor.org/rfc/rfc9457.html | 직접 페이지 및 검색 발췌 | `application/problem+json`, 표준 멤버와 확장, `detail` 파싱 금지 권고. |
| Spring MVC Error Responses | https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html | 검색 발췌 | RFC 9457 지원 추상화와 공통 예외 핸들러. 검색 결과가 Spring Framework 7.0.9 기준이라고 표시. |
| Spring MVC @RequestBody | https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/requestbody.html | 검색 발췌 | `@Valid`/`@Validated`, 기본 `MethodArgumentNotValidException` 및 400. 검색 결과가 Spring Framework 7.0.9 기준. |
| OpenAPI 공식 버전 인덱스 | https://spec.openapis.org/oas/ | 직접 페이지 및 검색 발췌 | 인덱스의 버전 목록 및 스키마 반복(iteration). 인덱스에 미래 날짜로 보이는 스키마 날짜가 존재하므로 버전 번호와 스키마 반복 날짜를 혼동하지 않도록 기록. |
| springdoc FAQ | https://springdoc.org/faq.html | 검색 발췌 | `springdoc-openapi 3.x`와 Spring Boot 4 호환 문구. 정확한 3.1.1 전용 항목은 확인되지 않음. |
| Spring Boot 테스트 | https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html | 직접 페이지 및 검색 발췌 | `MOCK` 기본값은 서버 미기동, `RANDOM_PORT`는 실제 내장 서버. 실제 포트 테스트에서 클라이언트/서버 트랜잭션이 분리된다는 주의도 문서화. |
| Google AIP-180 | https://google.aip.dev/180 | 검색 발췌 | 같은 major 버전에서 기존 클라이언트가 신규 minor/patch 서버에 동작해야 한다는 원칙. |
| Google AIP-158 | https://google.aip.dev/158 | 직접 페이지 및 검색 발췌 | 페이지네이션 초기 설계 필요, 기존 비페이지네이션 API에 추가 시 행동상 호환성 파괴 가능, page token 불투명성. |

## 명시적 미확인

- springdoc 3.1.1의 Boot 4 지원은 검색된 공식 FAQ의 포괄적 3.x 지원 문구만으로 그 특정 버전을 확정하지 않았다.
- `ResponseEntity.created(...)` 호출은 런타임 동작 코드의 증거일 뿐, springdoc이 OpenAPI 201 응답을 자동 생성한다는 근거가 아니다. 해당 자동 추론을 입증할 공식 자료는 확보하지 못했다.
- 이 작업의 출력은 웹 조사 기록이다. 지정된 입력 자료와 저장소 코드를 읽거나 네이티브 실험을 수행했다고 주장하지 않는다.
