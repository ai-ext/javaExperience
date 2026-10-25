# REST API 개발 프로세스 조사 보고서

조사일: 2026-10-20. 공식 자료를 기준으로 계약 설계와 검증 방법을 정리했다. 출처 목록·접근 메모·한계는 [`_data/source-notes.md`](_data/source-notes.md), 기계 판독 가능한 URL 접근 기록은 [`_data/source-access.json`](_data/source-access.json)에 있다.

## HTTP 계약

RFC 9110에서 safe는 요청 의미가 본질적으로 읽기 전용이라는 속성이고, idempotent는 동일 요청을 반복해도 의도된 서버 효과가 동일하다는 속성이다. GET/HEAD/OPTIONS/TRACE는 safe이며, 이들과 PUT/DELETE는 명세상 idempotent다. 통신 실패 뒤 자동 재시도는 idempotent 요청에는 정당화되지만, POST는 메서드만으로 재시도 안전성을 보장하지 않는다. 클라이언트가 실제 의미상 idempotent임을 알거나, 원 요청이 적용되지 않았음을 확인할 방법이 없는 한 비-idempotent 요청을 자동 재시도하지 말아야 한다.

201은 새 리소스 생성 성공을 뜻하고 Location은 주 생성 리소스를 식별한다(없으면 요청 URI). 204는 성공했지만 응답 콘텐츠가 없다는 의미이며 본문을 보내면 안 된다. 401은 유효한 인증정보가 없음을 나타내며 WWW-Authenticate 챌린지가 필수다. 403은 서버가 요청을 이해했지만 거부했다는 뜻이다. 404는 현재 리소스를 찾지 못했거나 존재 여부를 공개하지 않으려는 경우에 쓸 수 있고 휴리스틱 캐시 가능성이 있다. 409는 현재 리소스 상태와 충돌해 처리할 수 없는 경우, 422(Unprocessable Content)는 요청 내용의 문법·형식은 이해했지만 지시를 처리할 수 없는 경우다. 상태 코드는 일반 의미를, 문제 응답 본문은 API별 세부 사유를 전달하도록 계약을 맞춘다.

## 오류 본문 및 Spring

RFC 9457의 표준 JSON 미디어 타입은 `application/problem+json`이며 주요 필드는 `type`, `title`, `status`, `detail`, `instance`다. 확장 필드로 검증 오류 목록과 JSON Pointer를 추가할 수 있다. 소비자는 사람이 읽는 `detail` 문장을 파싱하지 말고 안정된 `type` 및 구조화된 확장 필드를 사용해야 한다.

Spring Framework는 `ProblemDetail`, `ErrorResponse`, `ErrorResponseException`을 제공하며 `ResponseEntityExceptionHandler`로 MVC 예외를 공통 처리할 수 있다. `@RequestBody`에 `@Valid` 또는 `@Validated`를 적용하면 Bean Validation이 실행되고 기본적으로 `MethodArgumentNotValidException`과 400이 발생한다. 메서드 파라미터 제약조건에 따른 메서드 검증에는 `HandlerMethodValidationException`이 쓰일 수 있으므로 이를 동일한 오류 표현으로 매핑하는지 점검한다.

## OpenAPI 및 문서 자동화

공식 OpenAPI 인덱스는 현재 OAS 3.2.1, 3.2.0, 3.1.x, 3.0.x, 2.0을 열거한다. 조사 시점 페이지에는 향후 날짜의 스키마 개정 목록도 있으므로, 새 API의 기준 버전 선택은 실제 도구·생성기 호환성을 고려해 별도로 고정해야 한다. springdoc FAQ는 springdoc-openapi 3.x가 Spring Boot 4와 호환된다고 설명한다. 검색으로 공식 3.1.1 릴리스별 지원표는 확인하지 못했다.

컨트롤러가 런타임에 `ResponseEntity.created(...)`를 반환한다는 사실만으로 springdoc이 OpenAPI 문서에 201과 Location을 추론한다고 단정할 근거는 확보하지 못했다. 따라서 `@ApiResponse(responseCode="201", ...)` 등 명시적 응답 계약을 작성하고 실제 생성된 `/v3/api-docs` 산출물을 확인하는 방식이 안전하다. 런타임 응답과 문서 응답은 서로 다른 검증 대상이다.

## 테스트와 소비자 호환성

Spring Boot 기본 `@SpringBootTest`의 `MOCK`은 웹 애플리케이션 컨텍스트와 모의 웹 환경을 만들고 내장 서버를 띄우지 않는다. `RANDOM_PORT`는 실제 웹 서버를 임의 포트에서 시작하므로 HTTP 스택과 서버 동작을 확인하는 데 적합하다. 두 방식은 대체 관계가 아니라 검증 경계가 다르다. RFC 상태·본문 매핑은 빠른 mock 기반 테스트로 확인하고, 직렬화·헤더·실제 요청 경로가 중요한 계약은 random-port 테스트로 보완한다.

Google AIP-180은 기존 클라이언트가 새 minor/patch 서버 릴리스에서 깨지지 않는 것을 호환성 기준으로 설명한다. AIP-158은 컬렉션 API의 페이지네이션을 처음부터 설계하라고 권고하며, 이미 비페이지네이션으로 공개된 API에 페이지네이션을 추가하는 것도 기존 소비자의 동작을 바꿀 수 있다고 설명한다. page token은 불투명하고 URL-safe해야 하며, 이를 권한 증명으로 취급해서는 안 된다. 응답 필드 추가처럼 구조적으로 허용되는 변화도 동작상 호환성은 별도로 검토해야 한다.

## 근거의 경계

이 보고서는 공식 웹 문서에 직접 나타난 내용과, 그 내용에서 도출한 구현 권고를 구분한다. springdoc 3.1.1의 정확한 Boot 4 지원 여부 및 `ResponseEntity.created` 자동 문서 추론은 직접 입증되지 않았다. 저장소 원문/스냅샷 대조와 네이티브 실험은 이 보고서에서 수행했다고 주장하지 않는다. 구현 전 `/v3/api-docs`와 실제 HTTP 응답을 각각 관찰해 계약을 확정해야 한다.
