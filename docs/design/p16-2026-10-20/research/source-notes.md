# 공식 웹 원문 조사 메모

- 조사 시각(시스템): 2026-10-19 20:19:29 UTC / 2026-10-20 05:19:29 Asia/Seoul
- 확인 방법: web 공식 기술 사이트 URL 직접 open/find. 출처는 FasterXML 프로젝트 문서/저장소, Spring 공식 문서/Javadoc/저장소만 채택.
- 확인 범위: 사용자가 지정한 unknown/null/date/enum defaults, annotation namespace, strict/ignoreUnknown, Spring MVC 415/400/406 및 controller 호출.
- 사용자 지정 원문: `/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P16-json-jackson-practical.md` (읽기만 함)
- 기존 참고: `/Users/ds/research/java-beginner-theory/06-json-jackson.md` (기존 주장을 현재 라이브 공식 출처와 다시 대조; 참고용)

## 출처별 본문 확인 기록

### 1. Jackson Release 3.1.5
URL: https://github.com/FasterXML/jackson/wiki/Jackson-Release-3.1.5
확인 날짜: 2026-10-20 (UTC 조사 시각은 위에 기재)
확인한 본문: 페이지는 “Patch version of 3.1, released on July 7, 2026”라고 밝히고 core/databind/dataformats의 수정 이슈 목록을 제공한다. 목록에는 unknown-properties, null primitive, timestamp, Enum feature의 기본값 변경 공지가 없다.
한계: 패치 릴리스 노트는 전체 기본값 참조표가 아니다. 다른 버전 문서와 합쳐서 판단했으며, JAR을 실행해 확인하지 않았다.

### 2. Jackson Release 3.0
URL: https://github.com/FasterXML/jackson/wiki/Jackson-Release-3.0
확인 날짜: 2026-10-20
확인한 본문: 페이지의 “Config default changes”에서 `FAIL_ON_UNKNOWN_PROPERTIES=false`, `READ_ENUMS_USING_TO_STRING=true`, `WRITE_ENUMS_USING_TO_STRING=true`, `WRITE_DATES_AS_TIMESTAMPS=false`, `FAIL_ON_NULL_FOR_PRIMITIVES=true`를 기록한다. 또한 annotations는 2.x 버전을 사용하며 `tools.jackson.*` 이동 예외라고 설명한다. `java.time` 지원이 databind에 통합됐다고 적는다.
한계: 3.0 기준 릴리스 변경 목록이므로 3.1.5 적용은 3.1.5 patch note와 결합해 추론. `toString()`은 enum 구현이 재정의할 수 있다.

### 3. Jackson 3 Migration Guide
URL: https://github.com/FasterXML/jackson/blob/main/jackson3/MIGRATING_TO_JACKSON_3.md
확인 날짜: 2026-10-20
확인한 본문: 항목 5에서 unknown-property 기능을 3.0에서 disabled, null primitive를 enabled라고 설명한다. timestamp 출력은 3.0 disabled, 2.x enabled라고 쓴다. `JsonMapper.builder()` 구성 예를 보인다. 패키지/feature 이동 및 `EnumFeature`/`DateTimeFeature` 이동도 기술한다.
한계: `main` 문서라 지속 변경 가능. 현행 문서에서 본문 확인했고, 특정 tag 고정 링크 아님.

### 4. Jackson Annotations 공식 문서/저장소
URL: https://github.com/FasterXML/jackson-annotations/wiki/Jackson-Annotations
URL: https://github.com/FasterXML/jackson-annotations
확인 날짜: 2026-10-20
확인한 본문: annotations 문서는 `@JsonProperty`가 외부 속성명을 정한다고 설명한다. `@JsonIgnoreProperties`를 class-level 속성 무시 또는 unknown 무시로 설명하고 `ignoreUnknown=true`는 deserialization 입력 unknown에 적용되며 serialization에는 영향이 없다고 한다. 저장소 README는 모든 annotation의 Java package가 `com.fasterxml.jackson.annotation`라고 명시한다.
한계: Wiki는 Jackson 2 annotations의 일반 문서지만 Jackson 3이 실제로 annotations 2.x를 계속 쓴다는 것은 Jackson 3 release note와 함께 확인.

### 5. Spring Boot 4.1.1 JSON
URL: https://docs.spring.io/spring-boot/reference/features/json.html
확인 날짜: 2026-10-20
확인한 본문: 페이지 상단 제목은 Spring Boot 4.1.1. “Jackson 3 is the preferred and default library”; classpath에서 자동 구성 `JsonMapper` bean을 제공한다고 함. Jackson 2 지원은 deprecated, 향후 Boot 4.x에서 제거 예정이라고 기재.
한계: 자동 구성 전반의 실제 사용자 프로젝트 설정/빈 교체 여부는 검증하지 않음.

### 6. Spring Framework HTTP Message Conversion / converter configuration
URL: https://docs.spring.io/spring-framework/reference/web/webmvc/message-converters.html
URL: https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/message-converters.html
확인 날짜: 2026-10-20
확인한 본문: `HttpMessageConverter`는 요청·응답 본문을 읽고 쓴다. 기본 converter는 서버 `RequestMappingHandlerAdapter`에 등록. `JacksonJsonHttpMessageConverter`는 Jackson `JsonMapper` 기반이며 기본 지원 media type은 `application/json`; 사용자 `JsonMapper` 주입 가능. 설정 문서에 직접 구성 예가 있다.
한계: Reference page는 예외 상태 코드별 행위를 완전히 표로 만들지 않는다. 상태/예외는 아래 API와 MVC 구현으로 보충했다.

### 7. Spring Framework MVC 처리 구현
URL: https://github.com/spring-projects/spring-framework/blob/main/spring-webmvc/src/main/java/org/springframework/web/servlet/mvc/method/annotation/RequestResponseBodyMethodProcessor.java
확인 날짜: 2026-10-20
확인한 본문: 클래스 주석은 `@RequestBody` 인자를 converter로 읽는다고 함. `resolveArgument` 구현이 `readWithMessageConverters` 호출 후에만 인자를 반환. 따라서 read 실패 시 정상적인 해당 컨트롤러 본문 진입 전 예외가 발생한다. 응답 handler의 `handleReturnValue`는 반환값을 `writeWithMessageConverters`에 전달.
한계: 링크가 main 브랜치라 Boot BOM에 포함된 정확한 7.0.x 패치 소스와 완전히 동일하다는 보장은 없다. 프레임워크의 핵심 요청 처리 구조 근거로 사용.

### 8. Spring 예외 Javadoc
URL: https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/converter/HttpMessageNotReadableException.html
URL: https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/web/HttpMediaTypeNotSupportedException.html
URL: https://docs.spring.io/spring-framework/docs/7.0.x/javadoc-api/org/springframework/web/HttpMediaTypeNotAcceptableException.html
확인 날짜: 2026-10-20
확인한 본문: `HttpMessageNotReadableException`은 converter의 `read(...)` 실패 시 발생. Unsupported exception은 지원하지 않는 request Content-Type, Not Acceptable exception은 handler가 client가 받아들일 응답을 생성할 수 없는 경우라고 설명한다. API reference 페이지는 7.0.9로 표시됨.
한계: Javadoc 개별 페이지만으로 모든 오류를 400/415/406에 연결해 주지 않는다. Spring 표준 처리 매핑과 예외 의미를 근거로 설명하되, 사용자의 resolver/ControllerAdvice가 바꾸는 응답은 단정하지 않았다.

## 수집 한계 및 기록 방법

브라우저 도구가 공식 웹 페이지를 열어 반환한 본문을 바탕으로 핵심 문구와 해석을 기록했다. 전체 사이트를 크롤링하거나 HTML/WARC 원문 파일을 내려받지 않았다. 따라서 `_data`는 원 URL, 확인 일자, 발췌 요지, 확인 범위 및 검증 한계의 조사 로그이며 웹페이지 전체 사본은 아니다. 시스템 시간은 clock 도구에서 확인했다. Boot/Java 프로젝트 실행, 테스트, 로컬 dependency cache 검사는 수행하지 않았다.
