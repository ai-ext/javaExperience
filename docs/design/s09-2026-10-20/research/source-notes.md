# S09 출처 확인 노트

확인일: 2026-10-20. 사용 범위: 공식 primary sources만 확인. `S09-source.md`의 문장은 사용자 제공 분석 대상 데이터로 취급했다.

## 핵심 공식 근거

| 항목 | 공식 URL | 확인 내용 / 제한 |
|---|---|---|
| JPA 3.2 규격 | https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html | context 당 identity별 유일한 인스턴스, new/managed/detached/removed, merge copy, contains/remove, flush, fetch 의미 확인. HTML canonical URL은 정상 응답. 확장자 없는 `...spec-3.2` 경로는 404. |
| EntityManager API | https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManager.html | merge 반환값의 distinct Java object identity(입력이 managed인 예외 명시), remove/contains/find 계약. |
| Hibernate ORM 7.4 User Guide | https://docs.hibernate.org/orm/7.4/userguide/html_single/ | live 페이지는 7.4.13.Final 표시. §7.1 AUTO flush의 commit 전, JPQL/HQL overlap, unsynchronized native SQL 조건; IDENTITY insert 조건; batch fetch, dirty checking 내부 선택 확인. 7.4.5와 동일 binary를 뜻하지 않는다. |
| Hibernate ORM 7.4 BatchSize API | https://docs.hibernate.org/orm/7.4/javadocs/org/hibernate/annotations/BatchSize.html | collection `@BatchSize`는 세션의 미초기화 collection 중 최대 size만큼 한 SELECT로 초기화 가능. 최대치이며 모든 실행에서 고정 count 아님. |
| Hibernate 7.4 What’s New | https://docs.hibernate.org/orm/7.4/whats-new/ | 7.4.13.Final, collection fetch join + limit/pagination이 subquery limit을 지원하는 DB에서 SQL로 처리되고 Sybase ASE 제외. 이전 6.x/7.x의 JVM limit 동작과 달라짐. 7.4.5 직접 실행 확인 아님. |
| Hibernate 7.4 HQL Guide | https://docs.hibernate.org/orm/7.4/querylanguage/html_single/ | limit/pagination 및 미지원 DB의 JVM 적용 조건 확인. |
| Hibernate 7.4 Migration Guide | https://docs.hibernate.org/orm/7.4/migration-guide/ | pagination/limit + collection fetch의 SQL 처리 변경, eager `@Any` join fetch 등 확인. |
| Hibernate 7.0 Migration Guide | https://docs.hibernate.org/orm/7.0/migration-guide/ | 원문 7.0 변경 서술 검토용 공식 링크. 본 보고서의 중심 행위 검증에는 7.4 docs를 우선. |
| Spring Boot managed coordinates | https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html | live 관리 좌표 페이지. Boot 4.1.1 / Hibernate 7.4.5.Final 주장은 현재 versioned release BOM으로 재확인하는 게 안전하며 live page 단독으로 역사적 고정값을 단정하지 않음. |

## 해석 메모

- EAGER는 반드시 로드하라는 fetch requirement이고 JOIN SQL 보장이 아니다.
- LAZY는 미초기화 상태에서의 접근을 뜻하며 실제 초기화 가능 여부는 entity/context 상태와 provider 구현에 좌우된다.
- JPA context는 반드시 transaction 범위가 아니다. transaction-scoped, extended, application-managed 사례가 존재한다.
- JPA flush는 commit과 별개다. 제약조건과 version conflict의 오류 시점은 flush/commit 경계에 걸칠 수 있고 optimistic version check는 merge 시에도 가능하다.
- `EntityEntry.loadedState`는 Hibernate 내부 검증 대상으로도 실행하지 않았다. 특정 provider 내부 field를 JPA 표준 또는 모든 엔티티의 snapshot guarantee처럼 쓰지 않는다.
- 원문의 PurchaseOrder.lines에는 `@BatchSize(32)`가 명시된다. 따라서 평범한 LAZY 3 collection 사례의 `1+3`을 이 코드에 적용하지 않는다. 실제 SQL count를 정하지 않는다.
- fetch join/EntityGraph 정의만으로 모든 구성에서 SQL count를 고정하지 않는다.

## 범위 밖 / 실패 조회

- 직접 실행하지 않은 것: Hibernate 7.4.5 / H2 2.4.240 / JDK 21의 독립 probe, Java 예제, MySQL, HTTP/OSIV, Spring proxy, query count, latency, migration DDL.
- 조회 실패: `https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2` (확장자 누락, HTTP 404). canonical `.html` 링크와 API 링크로 재확인.
- 다른 웹 접근 실패는 없음. 현재 7.4 문서와 과거 7.4.5 binary의 차이는 별도 limitation으로 REPORT.md에 표기.
