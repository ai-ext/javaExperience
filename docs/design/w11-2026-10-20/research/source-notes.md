# W11 공식 출처 조회 기록

조회일: 2026-10-20 (KST). 기존 기준선은 `/Users/ds/research/javaexperience-s08-20261020/REPORT.md` 및 `/Users/ds/research/javaexperience-s08-20261020/_data/source-notes.md`다. 아래 상태는 이번 조회에서 실제 확인한 범위를 뜻한다.

## URL 본문 조회 성공

| URL | 실제 확인한 본문·태그 위치 | 상태 및 범위 |
|---|---|---|
| https://docs.spring.io/spring-framework/reference/data-access/transaction/tx-resource-synchronization.html | “High-level Synchronization Approach”, “Low-level Synchronization Approach”; DataSourceUtils가 기존 transaction-synchronized 연결을 돌려주며 없으면 생성·동기화할 수 있다는 문단. JdbcTemplate의 내부 연결 조회 언급. | 직접 open 성공. 문서 상단에 Spring Framework 7.0.9 표시. |
| https://docs.spring.io/spring-framework/reference/data-access/jdbc/connections.html | “Using DataSourceUtils”, “Using DataSourceTransactionManager / JdbcTransactionManager”; thread-bound JDBC Connection, JdbcTemplate의 DataSourceUtils 사용, LazyConnectionDataSourceProxy 지연 취득 설명. | 직접 open 성공. 문서 상단에 Spring Framework 7.0.9 표시. |
| https://docs.spring.io/spring-framework/reference/data-access/transaction/programmatic.html | “Using the TransactionTemplate”; callback/execute 예제와 `setRollbackOnly()` 예제. | 직접 open 성공. 문서 상단에 Spring Framework 7.0.9 표시. |
| https://martinfowler.com/eaaCatalog/unitOfWork.html | Unit of Work 정의와 데이터베이스 변경을 업무 트랜잭션 단위로 추적·반영한다는 설명. | 직접 open 성공. 항목 작성일 2003-03-05 표시. Spring 동작 근거로 사용하지 않음. |
| https://raw.githubusercontent.com/spring-projects/spring-framework/v7.0.9/spring-webmvc/src/main/java/org/springframework/web/servlet/mvc/method/annotation/ServletInvocableHandlerMethod.java | `invokeAndHandle`: 먼저 `invokeForRequest`, 이후 response status 확인, 그 다음 return-value handlers 위임(106–127행). | raw 공식 GitHub URL 직접 open 성공. tag `v7.0.9`. |
| https://raw.githubusercontent.com/spring-projects/spring-framework/v7.0.9/spring-web/src/main/java/org/springframework/web/method/support/InvocableHandlerMethod.java | `invokeForRequest`에서 doInvoke 반환값을 받은 뒤 return(157–175행); `doInvoke`가 `method.invoke(getBean(), args)` 수행(223–233행). | raw 공식 GitHub URL 직접 open 성공. tag `v7.0.9`. |
| https://raw.githubusercontent.com/spring-projects/spring-framework/v7.0.9/spring-web/src/main/java/org/springframework/web/method/support/HandlerMethodReturnValueHandlerComposite.java | handler 선택 및 `handleReturnValue` 호출(63–70행). | raw 공식 GitHub URL 직접 open 성공. tag `v7.0.9`. |
| https://raw.githubusercontent.com/spring-projects/spring-framework/v7.0.9/spring-webmvc/src/main/java/org/springframework/web/servlet/mvc/method/annotation/RequestResponseBodyMethodProcessor.java | `@ResponseBody` return을 `HttpMessageConverter`로 쓰는 클래스 설명(49–52행). | raw 공식 GitHub URL 직접 open 성공. tag `v7.0.9`. |
| https://docs.spring.io/spring-framework/reference/core/aop/proxying.html | CGLIB proxy가 target subclass라는 설명, client proxy 호출과 advice가 target 메서드를 감싼다는 설명. | 직접 open/find 성공. 문서 상단에 Spring Framework 7.0.9 표시. W08에 이미 있던 근거를 현재 URL에서 재확인. |

## 검색 결과 본문만 확인

이번에 지정·추가한 URL 중 검색 결과만 확인한 출처는 없다. 모든 위 출처는 URL 본문 또는 raw source를 직접 열어 확인했다.

## 실패·미확인

- 지정한 외부 URL 조회 실패는 없었다.
- 사용자 메시지에 언급된 sourceA/B/C 원문 Java 블록은 W08/W11 작업 폴더에서 찾지 못했다. 따라서 sourceC listener body가 비어 있다는 점, B/C의 동명 대안 관계, Java 블록 개수 및 seed 세부사항은 이번 원문 대조가 아니라 사용자 제공 조건으로 취급했다.
- Controller transactional proxy 호출이 끝난 뒤 MVC 처리되는 순서는 Spring Framework 7.0.9 소스 흐름에서 확인했으나, 실제 HTTP 요청, MVC dispatch, message conversion/직렬화를 구동하지 않았다.
- 동일 물리 transaction, A의 선행 commit 보존, stub 경계 등은 문서 근거와 조건부 추론이다. 이번에 코드·DB를 실행해 관찰한 결과가 아니다.
