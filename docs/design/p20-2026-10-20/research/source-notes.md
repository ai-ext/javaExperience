# 공식 출처 확인 노트

확인일: 2026-10-20

| 공식 문서 | 정확한 URL | 보고서에서 사용한 내용 | 확인 범위/한계 |
|---|---|---|---|
| Jakarta Persistence 3.2 Specification (HTML) | https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html | entity 규칙 §2.1; field/property access §2.2; owning side 및 `mappedBy` §2.11; lifecycle, persist, remove, flush, DB 동기화 §3.3; callbacks §3.5; generator §11.1.21; OneToMany §11.1.41 | 규범 문서, 공급자 구현 SQL 계획의 세부사항을 모두 보장하지 않음 |
| Jakarta Persistence 3.2 Specification (PDF) | https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.pdf | `@Enumerated`의 기본 ORDINAL 및 String `@EnumeratedValue` 추론 예외 | 같은 규범 문서의 PDF 대조용 |
| Jakarta Persistence 3.2 release page | https://jakarta.ee/specifications/persistence/3.2/ | 버전/릴리스 개요 및 Jakarta EE 11 관련 메타데이터 | 개요 페이지만으로 상세 동작을 추론하지 않음 |
| `Entity` API | https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/Entity.html | top-level/static inner, non-final, 생성자 및 final 제약 | JPA 3.2 API 문서 |
| `Enumerated` API | https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/Enumerated.html | default ORDINAL, String `@EnumeratedValue` 예외 | JPA 3.2 API 문서 |
| `EnumeratedValue` API | https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EnumeratedValue.html | final 필드 타입과 고유·non-null 값 조건 | JPA 3.2 API 문서 |
| `ManyToOne` API | https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/ManyToOne.html | association 및 기본 fetch 정의 참고 | 상세 소유권 해석은 명세 사용 |
| `OneToMany` API | https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/OneToMany.html | cascade 기본값, mappedBy, orphanRemoval API 요약 | detached/new/removed 제외는 명세 본문 대조 |
| `EntityManager` API | https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManager.html | persist가 persistence context 동기화 시 insert, flush 동작 | JPA 3.2 API 문서 |
| Spring Data JPA Auditing 4.1.1 | https://docs.spring.io/spring-data/jpa/reference/auditing.html | 날짜/사용자 annotation 구별, `AuditorAware`, `@EnableJpaAuditing`, listener 등록 | 접속 시 문서 상단에서 Spring Data JPA 4.1.1 표시 확인 |
| Hibernate ORM 7.0 User Guide | https://docs.hibernate.org/orm/7.0/userguide/html_single/Hibernate_User_Guide.html#identifiers-generators-identity | Hibernate IDENTITY는 식별값을 알기 전 row INSERT가 필요하다는 제공자 고유 동작; 일반적인 persist 직후 insert 설명 | 원본의 Hibernate 7.4.5.Final을 실행한 결과가 아님. 표준 보장과 분리 |
| Java SE 25 JLS §6.6 | https://docs.oracle.com/javase/specs/jls/se25/html/jls-6.html#jls-6.6 | package-private `LineStatus` 사용과 다른 package에서의 접근성 분석 | 소스 정적 독해. 컴파일 시도/재현 없음 |

## 출처 확인 과정

Jakarta API의 대소문자 포함 정확한 HTML 경로를 확인했다. 잘못된 첫 요청 경로는 404였고, 공식 검색 결과에서 반환된 `Entity.html`, `OneToMany.html` 등의 정식 링크로 재확인했다. 이후 Jakarta 명세의 직접 HTML에서 구체 조항을 찾았다. Spring Data JPA 공식 가이드는 현재 페이지 상단에 4.1.1로 표기되었다.

네트워크 조사에는 브라우저 검색/열기를 사용했다. CLI 대체나 다른 모델/공급자로 조사하지 않았다. 출처는 모두 프로젝트 관리 주체의 공식 명세/API/문서다. 외부 블로그와 2차 설명은 근거로 채택하지 않았다.
