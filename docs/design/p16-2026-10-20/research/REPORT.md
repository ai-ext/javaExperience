# P16 JSON·Jackson 실무 원문 검증 보고서

조사 기준 시각은 **2026-10-19 20:19:29 UTC**(시스템 시계, 한국 시간 2026-10-20 05:19:29)이다. 확인 대상 원문은 `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P16-json-jackson-practical.md`이며, 사용자가 지정한 쟁점만 대조했다. 이 보고서는 웹 공식 원문 조사 결과이고, 원문 파일은 수정하지 않았다. Boot 4.1.1·Java 25 조합 프로젝트를 빌드하거나 실행하지 않았다. Jackson 라이브러리 로컬 캐시 검증은 별도 메인 작업이므로 다루지 않는다.

## 판정 요약

대상 글은 “Boot 4에서는 Jackson 3가 기본이고 자동 구성 `JsonMapper`가 쓰인다”, “`com.fasterxml.jackson.annotation` 애노테이션 패키지는 유지된다”, “컨버터가 요청/응답 본문을 변환한다”는 큰 방향은 맞다. 다만 unknown property를 기본적으로 실패한다고 설명하는 대목, Enum 기본값 설명, 415/400 발생 원인 설명은 Jackson 3.1.5와 Spring Framework 7 문서에 맞게 고쳐야 한다. 수정은 원문 보존 요청에 따라 아래의 짧은 주석 형태로 제안한다.

## 1. Jackson 3.1.5 `JsonMapper`의 쟁점 기본값

Jackson 공식 3.0 릴리스 변경표와 3.x 마이그레이션 가이드는 설정 기본값 변경을 기록하고, 3.1.5의 릴리스 노트는 3.1.5에 포함된 수정 사항을 열거한다. 릴리스 노트에는 아래 설정을 뒤집는 변경이 나타나지 않는다. 따라서 3.1.5에 대한 근거는 3.1.5 패치 목록과 3.x 기본값 기록을 함께 읽은 것이다. 3.1.5 패치 노트가 모든 설정값을 다시 열거하는 것은 아니므로 이를 개별 라이브러리 실행 결과로 오인해서는 안 된다.

| 입력/출력 사례 | 3.x 기본값 및 의미 | 실무상 주석 |
|---|---|---|
| DTO에 없는 JSON 속성 | `FAIL_ON_UNKNOWN_PROPERTIES`는 기본 `false`; 기본적으로 역직렬화 오류를 일으키지 않는다. | Jackson 2에서 흔한 전역 기대와 반대. 오타도 묵살될 수 있다. |
| primitive에 명시적 JSON `null` | `FAIL_ON_NULL_FOR_PRIMITIVES`는 기본 `true`; 예컨대 `int`/`boolean`을 null로 읽을 때 실패한다. | `Integer` 같은 참조형 null이나 필드 누락을 같은 상황으로 뭉뚱그리지 말고 구분한다. 필드 누락 동작은 생성 방식/생성자 정책에 좌우될 수 있다. |
| 날짜·시간 출력 | `WRITE_DATES_AS_TIMESTAMPS` 기본 `false`; 날짜/시간 표현은 숫자 timestamp보다 문자열 방향이다. Jackson 3은 `java.time` 모듈을 databind에 통합했다. | 문자열이 구체적으로 ISO 형식인지, 값에 시간대/offset이 있는지는 Java 타입과 설정에 달렸다. `LocalDateTime`은 순간·시간대를 뜻하지 않는다. |
| Enum 읽기/쓰기 | `READ_ENUMS_USING_TO_STRING`, `WRITE_ENUMS_USING_TO_STRING` 모두 3.0에서 기본 활성화됐다. | 기본 구현의 `Enum.toString()`은 대개 상수명과 같지만, `toString()` 오버라이드 시 JSON 계약이 달라진다. “기본은 항상 enum 상수명”은 부정확하다. 외부 API 값은 `@JsonProperty` 등으로 고정하는 편이 안전하다. |

위 기본값은 `JsonMapper`의 Jackson 3 기본 동작을 말한다. Spring Boot 자동 구성이 별도 호환 설정이나 사용자 설정을 적용했는지 여부는 실제 애플리케이션 구성에 따라 달라진다. Boot 문서는 자동 구성 `JsonMapper` 빈을 확인해 주지만, 여기서 프로젝트의 최종 mapper가 순정 기본값이라고 단정하지 않는다.

## 2. Annotation namespace, strict unknown, 좁은 예외

Jackson 3에서 core/databind의 그룹 ID와 Java 패키지는 `tools.jackson.*`로 바뀌었지만, `jackson-annotations`는 Jackson 2.x 계열(3.0 당시 2.20)을 계속 사용한다. 그래서 `@JsonProperty`, `@JsonIgnoreProperties`, `@JsonFormat`, `@JsonInclude` 등의 import는 `com.fasterxml.jackson.annotation.*`다. 다만 databind 모듈 내부의 애노테이션 타입은 이동 대상이므로 “모든 Jackson 애노테이션이 유지”된다고 넓혀 쓰면 틀린다.

입력을 엄격히 검사하려면 `JsonMapper.builder().enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).build()`와 같이 명시적으로 켠다. 주의: 3.x에서 관련 날짜/Enum feature 일부는 `DateTimeFeature` 또는 `EnumFeature`로 이동했지만, unknown 설정은 현재 가이드에서 여전히 `DeserializationFeature`로 표기된다. 한편 외부 webhook처럼 호환성상 알려지지 않은 필드를 받아들여야 하는 타입에는 `@JsonIgnoreProperties(ignoreUnknown = true)`를 그 DTO에만 선언할 수 있다. Annotation 공식 설명상 이 옵션은 입력의 unknown property 무시에 관한 것이며 직렬화에는 영향을 주지 않는다. `@JsonIgnoreProperties({"foo"})`는 나열 속성을 무시하는 별도 좁은 선택이다.

따라서 대상 문서의 “기본 strict이고 webhook만 완화” 서술은 Jackson 3.1.5 기본값과 반대다. 권고하는 계약은 애플리케이션 기본을 명시적으로 strict로 설정하고, 허용해야 할 DTO에만 `ignoreUnknown=true`를 두는 방식이다. 이는 Jackson 기본 동작에 대한 설명이 아니라 애플리케이션이 선택할 정책이라고 분명히 밝혀야 한다.

## 3. Spring Framework 7 MVC의 415 / 400 / 406와 Controller 호출

Spring Framework 공식 메시지 변환 문서는 `HttpMessageConverter`가 서버에서 요청 본문을 읽고 응답 본문을 쓰며, 기본 converter가 `RequestMappingHandlerAdapter`에 등록된다고 설명한다. JSON용 `JacksonJsonHttpMessageConverter`는 Jackson `JsonMapper`를 이용하고 기본 지원 미디어 타입은 `application/json`이다. Boot는 JSON mapper를 자동 구성하지만 Spring MVC에서 매개변수/응답을 실제 본문으로 바꾸는 경계는 converter다.

- **415 Unsupported Media Type**: 요청 `Content-Type`이 해당 핸들러/converter가 읽을 수 있는 미디어 타입과 맞지 않을 때의 문제다. JSON payload의 문법이 틀렸다는 뜻은 아니다. JSON 본문이어도 Content-Type이 빠지거나 `text/plain`인 경우를 무조건 415라고 보장할 수는 없다. 핸들러의 consumes 조건, 등록 converter, 요청 헤더에 따라 달라진다. 특히 Spring의 예외 문서는 “지원하지 않는 타입의 POST/PUT/PATCH”를 설명한다.
- **400 Bad Request**: 요청 본문을 대상 타입으로 읽을 수 없는 경우(`HttpMessageNotReadableException`)나 검증 실패 등이 대표적이다. 잘못된 JSON 문법, 타입 변환 문제, strict unknown 설정에서 거부된 필드가 해당 본문 변환 오류로 이어질 수 있다. 단, 400 응답 표현은 예외 처리기/애플리케이션 구성의 영향을 받는다.
- **406 Not Acceptable**: 요청의 `Accept` 조건에 맞는 응답 표현을 핸들러가 만들 수 없을 때의 협상 오류다. 응답에 JSON converter가 있어도 클라이언트가 그 미디어 타입을 허용하지 않으면 문제가 될 수 있다. 항상 `Accept: application/json`을 보내야 하는 것은 아니다. `Accept: */*` 또는 생략은 환경에서 흔히 허용된다.

`@RequestBody`는 컨트롤러 메서드 인자 해결 중 `HttpMessageConverter`로 먼저 읽힌다. Spring Framework 7의 `RequestResponseBodyMethodProcessor.resolveArgument` 구현은 `readWithMessageConverters(...)` 후 인자를 반환하며, 읽기 실패는 예외로 빠진다. 그러므로 본문 변환이 실패하면 해당 컨트롤러 메서드 본문은 호출되지 않는다. 이는 본문을 읽고 인자로 준비한 뒤 메서드를 실행한다는 프레임워크 흐름에 대한 결론이다. 반대로 요청 변환이 성공한 뒤 컨트롤러를 실행하고 반환값을 쓰는 단계에서 406이 발생하면 Controller 본문은 이미 호출되었을 수 있다. 406 예외가 난 사실만으로 컨트롤러가 실행되지 않았다고 설명하면 안 된다.

## 4. 원문에 붙일 교정 주석 제안

다음 주석은 원문 문장을 삭제·대체하지 않고 추가하는 짧은 교정 메모로 쓸 수 있다.

> **Jackson 3.1.5 교정:** `FAIL_ON_UNKNOWN_PROPERTIES` 기본값은 `false`다. unknown 필드 거부가 계약 요건이면 `JsonMapper`에서 명시적으로 활성화하고, 호환성이 필요한 외부 DTO에 한해 `@JsonIgnoreProperties(ignoreUnknown = true)`를 둔다. primitive 명시적 null 거부는 기본 `true`이며, 날짜/시간 timestamp 출력은 기본 비활성화다. Enum은 기본적으로 `toString()`을 쓰고 읽으므로 `toString()` 재정의 시 값이 상수명과 달라질 수 있다.
>
> **Spring MVC 교정:** JSON converter의 기본 지원 타입은 `application/json`이다. 415는 요청 미디어 타입/consumes 및 converter 적합성, 400은 본문 역직렬화 또는 검증 실패, 406은 `Accept`와 응답 표현 협상 문제다. 요청 본문 변환 실패는 `@RequestBody` 인자 해석 단계에서 컨트롤러 호출 전에 발생하지만, 응답 쓰기 협상 실패는 컨트롤러 호출 뒤에도 발생할 수 있다. 헤더 조합만으로 상태 코드를 항상 단정하지 않는다.

### 구체적으로 원문에서 검토할 위치

1. 2.2절의 “Content-Type이 빠지거나 text/plain이면 ... 415”는 조건문을 약화한다. “해당 핸들러의 consumes/converter와 맞지 않아 읽을 converter가 없으면 415가 될 수 있다”가 정확하다. `Accept`는 응답 협상이라고 분리한다.
2. 2.7절의 “기본 Enum JSON은 상수명”은 Jackson 3에 한해 교정한다. 예제 Enum은 `toString()`을 재정의하지 않아 결과가 `"PAID"`일 수 있지만, 이를 일반 규칙으로 쓰면 안 된다.
3. 2.8절의 “기본은 strict” 및 질문 답변 “기본값 ... unknown property 처리를 명시”는 3.x에서는 반대로 기술한다. 기본 ignore와 strict opt-in을 구별한다.
4. 3절 상단의 Boot가 자동 구성 `JsonMapper`를 제공한다는 내용은 Boot 문서와 일치한다. 다만 Boot 전체 프로젝트 실행 증거로 간주하지 않는다.

## 5. 출처표 및 검증 한계

URL별 실제 웹 본문에서 확인한 발췌, 조사 시각, 해석 한계를 기록한 원자료는 [`_data/source-notes.md`](/Users/ds/research/javaexperience-p16-20261020/_data/source-notes.md)에 저장했다. 확인한 출처는 FasterXML Jackson 3.1.5 릴리스/3.0 변경 목록/마이그레이션 가이드/annotations 공식 문서, Spring Boot 4.1.1 JSON 문서, Spring Framework 7 메시지 변환 문서·Javadoc·MVC 구현 원문이다. 링크와 역할은 다음과 같다.

| 공식 원문 | 이 보고서에서 뒷받침하는 내용 |
|---|---|
| [Jackson 3.1.5 Release Notes](https://github.com/FasterXML/jackson/wiki/Jackson-Release-3.1.5) | 패치 릴리스 날짜와 수정 항목. 기본값 재정의 내용이 없음을 확인하는 데 사용 |
| [Jackson 3.0 Release Notes](https://github.com/FasterXML/jackson/wiki/Jackson-Release-3.0) / [Migration Guide](https://github.com/FasterXML/jackson/blob/main/jackson3/MIGRATING_TO_JACKSON_3.md) | unknown/primitive null/date/Enum 기본값, Java 패키지 이동 및 annotations 예외 |
| [Jackson Annotations](https://github.com/FasterXML/jackson-annotations/wiki/Jackson-Annotations) / [공식 저장소](https://github.com/FasterXML/jackson-annotations) | `@JsonIgnoreProperties`, `@JsonProperty` 기능 및 패키지 |
| [Spring Boot 4.1.1 JSON](https://docs.spring.io/spring-boot/reference/features/json.html) | Jackson 3 기본/선호, 자동 구성 `JsonMapper`, Jackson 2 deprecated 경로 |
| [Spring Framework HTTP Message Conversion](https://docs.spring.io/spring-framework/reference/web/webmvc/message-converters.html) / [converter configuration](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/message-converters.html) | 변환기 역할, 기본 등록, JSON converter 및 미디어 타입 |
| [Spring Framework 7 `RequestResponseBodyMethodProcessor`](https://github.com/spring-projects/spring-framework/blob/main/spring-webmvc/src/main/java/org/springframework/web/servlet/mvc/method/annotation/RequestResponseBodyMethodProcessor.java) | `resolveArgument`가 converter read 뒤 argument를 반환한다는 호출 순서 |
| [Spring `HttpMessageNotReadableException`](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/converter/HttpMessageNotReadableException.html), [Unsupported](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/web/HttpMediaTypeNotSupportedException.html), [Not Acceptable](https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/web/HttpMediaTypeNotAcceptableException.html) | 읽기 실패와 미디어 타입 예외 의미 |

확인 한계: Spring Framework 문서 사이트의 현행 참조 페이지에는 버전 표기가 7.0.9(Stable)로 나타났고, 구현 파일 링크는 `main` 브랜치다. 이는 요청의 Spring 7 계열 설명을 지지하지만 Boot 4.1.1 의존성 그래프의 정확한 Framework patch version을 증명하지 않는다. `HttpMessageNotReadableException` Javadoc은 converter read 실패를 설명하지만 모든 원인에 대해 HTTP 400이 자동 반환된다고 단독으로 말하지 않는다. 415/406 상태 연결은 Spring의 표준 예외 의미와 MVC 처리 흐름에 근거하며, 사용자 지정 예외 처리·converter·`consumes` 구성에 따라 관찰 응답이 달라질 수 있다. `Accept`/`Content-Type` 한 조합을 실행 테스트하지 않았다. Jackson 3.1.5 기본값은 공식 3.x 변경 문서와 3.1.5 패치 기록을 결합해 판단했으며 실제 JAR 검증은 메인의 로컬 캐시 검증 범위다.
