# Source notes (직접 확인, 2026-10-21)

아래는 공식 문서를 직접 열거나 검색 결과 본문을 확인한 자체 요약이다. 긴 원문 발췌는 포함하지 않았다.

- https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Throwable.html — 생성 시점 stack snapshot, cause 체인, 공통 프레임 ellipsis, try-with-resources 종료 예외 suppressed 의미를 확인.
- https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Throwable.html — Java 21에서도 Throwable 핵심 설명과 suppressed 동작이 같은 방향임을 확인.
- https://docs.oracle.com/en/java/javase/21/docs/specs/man/jdb.html — 로컬/원격 JVM 디버그, breakpoint, step/next, 예외 catch 설명. IDE UI 실험과는 별개.
- https://docs.oracle.com/en/java/javase/25/docs/specs/man/jdb.html — JDK 25 jdb의 발동·연결·stepping 설명.
- https://docs.oracle.com/en/java/javase/21/docs/specs/jpda/conninv.html — JPDA socket 주소의 host 생략 시 loopback, listening connector의 loopback/ephemeral 기본, JDWP 옵션을 확인.
- https://docs.oracle.com/en/java/javase/25/docs/specs/jpda/conninv.html — JDWP `suspend` 기본 y, loopback listen 예시, 주소/allow 옵션을 확인. 실제 포트를 열지는 않음.
- https://docs.oracle.com/en/java/javase/25/docs/specs/man/java.html — `-agentlib:jdwp` 실행 옵션 설명.
- https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html — jcmd가 같은 머신, 같은 effective user/group로 대상 JVM에 요청하는 도구임을 확인.
- https://docs.oracle.com/en/java/javase/25/docs/specs/man/jcmd.html — Thread.print가 모든 스레드 stack을 내고 영향도가 thread 수에 좌우됨을 확인.
- https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Thread.State.html — BLOCKED와 WAITING 상태 정의를 비교.
- https://www.jetbrains.com/help/idea/debugging-code.html — IntelliJ Debug 모드 절차와 stepping 도움말.
- https://www.jetbrains.com/help/idea/using-breakpoints.html — 조건, 예외, logging breakpoint, expression 부작용, All/Thread suspend 정책을 확인. 실제 UI 실행은 안 함.
- https://www.jetbrains.com/help/idea/examining-suspended-program.html — 정지된 프레임에서 변수·평가식을 다루는 IDE 문서.
- https://docs.spring.io/spring-boot/4.1.1/reference/features/logging.html — 직접 URL 열기 실패(Internal Error). 내용 근거로 쓰지 않음.
- https://docs.spring.io/spring-boot/4.1-SNAPSHOT/reference/features/logging.html — 공식 개발 문서가 starter 기본 Logback, logger level 설정, 출력 형식과 tracing correlation ID 조건을 기술. 페이지가 stable 4.1.1을 별도 안내함.
- https://docs.spring.io/spring-boot/reference/features/logging.html — Boot canonical 현재 문서로 기본 logging 구성과 log level 정보를 교차 확인. 4.1.1 고정판이라고 표현하지 않음.
- https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-requestmapping.html — URI 변수의 타입 변환과 TypeMismatchException을 확인.
- https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/mvc/support/DefaultHandlerExceptionResolver.html — 현재 API에서 type mismatch 기본 처리가 400임을 확인. Framework 7.0.9 계열.
- https://docs.hibernate.org/stable/orm/userguide/html_single/ — 현재 stable User Guide가 Hibernate ORM 7.4.13.Final을 가리킴. show_sql 기본 false/생성 SQL 출력, JDBC bind logger 별도 설정을 확인.
- https://git-scm.com/docs/git-bisect — 자동 판정 exit 0 good, 1–127(125 제외) bad, 125 skip, 그 밖의 코드 abort를 확인.
- https://developer.chrome.com/docs/devtools/network/reference — Chrome Network의 status, request/response header, payload, body, timing 항목이 분리되어 있음을 확인. 화면 실험은 안 함.
- https://kubernetes.io/docs/tasks/access-application-cluster/port-forward-access-application-cluster/ — port-forward의 local loopback listener, 선택적 ephemeral port, RBAC 제어를 확인. cluster 실험은 안 함.

## 미실행 경계

- 웹 출처 확인은 live web/search 도구로만 했다. 로컬 환경을 웹 검증 근거로 사용하지 않았다.
- SOURCE의 Boot 4.1.1 / Java 25 애플리케이션과 원문 HTTP 시나리오는 실행하지 않았다.
- 별도 예정 Java 21.0.6 / Boot 4.1.1 fixture 결과가 도착하기 전에는 응답 코드, stack, debugger, logging을 관찰 사실로 기록하지 않는다.
- IntelliJ breakpoint/evaluate/suspend, jdb, JDWP, jcmd, SQL/DB, Chrome Network UI, Kubernetes는 직접 조작하지 않았다.
