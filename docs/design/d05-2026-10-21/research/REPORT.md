# D05 디버깅 방법론: 공식 근거와 관찰 한계

**조사 기준일: 2026-10-21**  
**직접 웹 확인:** 본 보고서 작성자가 활성 웹 검색/열기 도구를 10회 호출. 출처별 확인 상태는 [`source-access.json`](source-access.json), 짧은 요약은 [`_data/source-notes.md`](_data/source-notes.md)에 기록했다. 이 조사는 자료 확인이지 SOURCE 예제 실행이나 IDE/JVM/Kubernetes 실험이 아니다.

## 핵심 검토

1. **Throwable stack과 cause:** Throwable은 생성 당시 스레드의 stack snapshot을 보유한다. cause는 별도 예외 연결이다. `... n more`는 cause와 바깥 예외의 공통 하위 프레임 생략 수다. stack 하단은 최초 호출 프레임이지 자동으로 root cause가 아니다. 입력·시간·외부 상태로 가설을 검증한다. [Oracle Throwable Java 25](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Throwable.html) · [Java 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Throwable.html)

2. **Suppressed:** try 본문과 자원 종료가 모두 실패하면 본문 예외를 전파하고 close 실패를 suppressed로 붙인다. 이는 cause와 별도인 동반 예외 관계다. [Oracle Throwable Java 25](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Throwable.html)

3. **IntelliJ stepping/breakpoint:** Over는 호출 안에 진입하지 않고, Into는 진입, Out은 현재 프레임을 빠져나간다. 조건·예외·비정지 logging breakpoint를 쓸 수 있다. 조건/evaluate/log 식은 side effect가 가능하다. Suspend `All`은 모든 스레드, `Thread`는 적중 스레드만 멈춘다. IntelliJ Evaluate는 별도 IDE 관찰이며, 확인한 JDK 21 `jdb` 문서에는 표현식 evaluate 명령 근거가 없어 jdb 실험으로 대체해 주장하지 않는다. UI는 실제 조작하지 않았다. [JetBrains debug](https://www.jetbrains.com/help/idea/debugging-code.html) · [breakpoints](https://www.jetbrains.com/help/idea/using-breakpoints.html)

4. **Boot logging:** starter 기본 구현은 Logback이다. `logging.level.<name>`로 수준을 설정하며 콘솔에는 시각·수준·PID·thread·logger·메시지 등이 포함된다. INFO/DEBUG 출력은 환경과 logger 설정으로 확인한다. 로그 부재는 미실행 증거가 아니다. [Boot 4.1 snapshot](https://docs.spring.io/spring-boot/4.1-SNAPSHOT/reference/features/logging.html) · [canonical](https://docs.spring.io/spring-boot/reference/features/logging.html)

5. **상관 ID:** request ID/MDC 자동 생성은 보장되지 않는다. Boot 문서는 tracing이 켜진 경우 correlation ID 출력을 설명한다. 생성·전파는 실제 tracing/filter/MDC 설정을 확인해야 한다. [Boot 4.1 snapshot](https://docs.spring.io/spring-boot/4.1-SNAPSHOT/reference/features/logging.html)

6. **HTTP 관찰:** Chrome Network는 status, headers, payload, response body, timing을 별도로 보여준다. 500만으로 DB 장애나 원인 예외를 단정할 수 없으며 서버 raw stack이 response body와 같다는 보장도 없다. [Chrome Network](https://developer.chrome.com/docs/devtools/network/reference) · [Spring Boot logging](https://docs.spring.io/spring-boot/reference/features/logging.html)

7. **SOURCE의 200/500:** `/orders/13`은 코드가 `IllegalStateException`과 `SQLException("simulated database timeout")`을 생성할 뿐 DB 호출이 없다. 이 cause와 메시지는 가상이며 실제 timeout/DB 상태 증거가 아니다. 원문 Java 25/Boot 4.1.1 샘플은 미실행이므로 200/500도 관찰값이 아닌 예상이다.

8. **malformed PathVariable:** Spring MVC는 URI 타입 변환 실패를 TypeMismatch로 설명하고 current resolver API는 기본 400 처리를 명시한다. `/orders/not-a-long`은 handler 예외 `/orders/13`과 구분되는 입력 사례다. 근거는 Framework current(7.x)이지 Boot 4.1.1 실험이 아니다. [mapping](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-requestmapping.html) · [resolver](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/mvc/support/DefaultHandlerExceptionResolver.html)

9. **JDK 21 jdb:** Oracle은 local/remote JVM, breakpoint, step/next, exception catch를 설명한다. 자체 fixture에서 breakpoint/step을 시험할 CLI 근거이며 IntelliJ UI의 Evaluate 확인과 다르다. JDK 21 jdb 페이지에서 evaluate 명령은 확인되지 않아 그 기능을 확정하지 않는다. 본 조사에서는 실행하지 않았다. [jdb](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jdb.html) · [JPDA](https://docs.oracle.com/en/java/javase/21/docs/specs/jpda/conninv.html)

10. **JDWP 범위:** JPDA에서 host 생략은 loopback, socket listener 기본은 loopback/ephemeral port, `suspend` 기본은 y다. 자체 프로세스에서 주소 생략 후 출력 포트를 쓰거나 지원을 확인해 `127.0.0.1:0`을 쓴다. `suspend=n`은 시작 정지만 끄며 연결 후 breakpoint는 실행을 멈출 수 있다. 기존 사용자/운영 JVM에 attach하지 않는다. [JPDA 21](https://docs.oracle.com/en/java/javase/21/docs/specs/jpda/conninv.html) · [JPDA 25](https://docs.oracle.com/en/java/javase/25/docs/specs/jpda/conninv.html) · [java 25](https://docs.oracle.com/en/java/javase/25/docs/specs/man/java.html)

11. **jcmd/thread:** `jcmd`는 같은 머신·effective user/group로 대상 JVM에 명령을 보낸다. `Thread.print`는 스레드 수에 따라 영향이 있고 한 시점의 stack snapshot이다. `BLOCKED`는 monitor lock 대기, `WAITING`은 다른 작업/통지를 기다리는 상태다. 반복 dump는 지속 단서를 보강하나 CPU 원인을 단독 입증하지 않는다. 전체 JVM 조회·PID 0·heap dump는 하지 않았다. [jcmd 21](https://docs.oracle.com/en/java/javase/21/docs/specs/man/jcmd.html) · [jcmd 25](https://docs.oracle.com/en/java/javase/25/docs/specs/man/jcmd.html) · [Thread.State](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/lang/Thread.State.html)

12. **git bisect:** run exit 0=good, 1–127(125 제외)=bad, 125=skip, 그 외=abort다. 격리 temp Git에서 동일 입력·환경·회귀 기준을 유지해야 한다. first bad는 판정에 따른 후보이지 인과 증명이 아니다. [Git bisect](https://git-scm.com/docs/git-bisect)

13. **SQL/Hibernate:** SQL 문장·bind 값·실행 계획은 별도 증거다. Hibernate current 7.4.13.Final의 `hibernate.show_sql`은 기본 false이며 생성 SQL을 출력한다. parameter logger는 별도다. statement만으로 실행값·plan·lock/pool wait·시간을 알 수 없다. SOURCE는 ORM/DB 호출이 없다. [Hibernate User Guide](https://docs.hibernate.org/stable/orm/userguide/html_single/)

14. **재현과 운영 증거:** 최소 재현에서 직접 얻은 HTTP/debugger/dump만 관찰로 기록한다. 미실행 metric, CI trace, Chrome/IDE 화면, Kubernetes pod/port-forward는 관찰값이 아니다. K8s 문서는 loopback/RBAC를 설명하지만 cluster 실험은 하지 않았다. [Kubernetes port-forward](https://kubernetes.io/docs/tasks/access-application-cluster/port-forward-access-application-cluster/) · [Chrome Network](https://developer.chrome.com/docs/devtools/network/reference)

## 그림·UI 구성과 기술 검수

- **Throwable:** 호출 stack과 cause를 분리하고 suppressed는 주 예외에 연결된 별도 예외로 표시한다. `... n more`는 공통 프레임 생략으로 설명하며 stack 하단을 root cause로 표시하지 않는다.
- **IDE/HTTP 화면:** 실제 IntelliJ 캡처와 도움말을 대조해 stepping, 조건/예외/log breakpoint, All/Thread 정지 범위를 구분한다. Network 캡처는 status, request/response, payload, timing을 별도 필드로 표시한다. raw stack/log와 response body를 합치지 않는다. 이 조사에서는 UI를 실행·캡처하지 않았다.
- **JDWP/K8s:** loopback과 실제 배정 포트를 명시하고 공용 interface/Ingress 노출처럼 보이는 그림을 피한다. port-forward는 별도 개발 클러스터 맥락으로 구분한다.
- **dump/bisect/SQL:** BLOCKED와 WAITING을 구분하고, 여러 dump는 시점 비교로, bisect는 일관된 판정 결과로 표현한다. bisect의 first bad를 인과 확정으로 그리지 않는다. SQL 본문·bind 값·실행 계획은 별도 증거로 보여주고 Hibernate 버전을 명시한다.

## 적용 범위 및 미실행 항목

- SOURCE.md 전문을 읽고 예제 코드와 설명을 대조했다. 디렉터리는 Git working tree가 아니어서 git status로 변경 상태를 확인하지 못했다. 요청한 연구 산출물만 작성했다.
- 부모가 예정한 Java 21.0.6 / Boot 4.1.1 private loopback fixture는 여기서 실행하지 않았고, 완료된 출처나 관찰로 취급하지 않았다. 원문 코드/parameters 불변 조건, 응답 body/raw stack 차이, 실제 관찰은 후속 fixture 결과가 있어야 확정할 수 있다.
- Boot 4.1.1 고정 logging URL은 웹 도구에서 Internal Error였다. 공식 4.1-SNAPSHOT 문서가 안정판 4.1.1을 안내하는 점과 canonical 현재 문서로 대조했다. Boot 4.1.1 고정 URL 본문을 직접 확인했다고 주장하지 않는다.
- SOURCE의 Java 25/Boot 4.1.1은 미실행. IDE, Chrome, jdb, jcmd, JDWP, DB/SQL, Kubernetes도 조작·실험하지 않았다. 따라서 관찰 이미지나 운영 metric/CI trace/Kubernetes 결과는 없다.
- Hibernate current 문서는 7.4.13.Final이고 Spring Framework current는 7.0.9 계열이다. SOURCE의 resolved dependency와 동일하다고 가정하지 않았다. JetBrains 도움말은 2026.2 기준, Chrome Network 문서는 오래된 크롤링 표기가 있어 실제 설치 버전 UI/세부 설정은 해당 버전에서 다시 확인해야 한다.

## 산출물

- [`LOCAL_HOME/research/javaexperience-d05-20261021/REPORT.md`](LOCAL_HOME/research/javaexperience-d05-20261021/REPORT.md)
- [`LOCAL_HOME/research/javaexperience-d05-20261021/source-access.json`](LOCAL_HOME/research/javaexperience-d05-20261021/source-access.json)
- [`LOCAL_HOME/research/javaexperience-d05-20261021/_data/source-notes.md`](LOCAL_HOME/research/javaexperience-d05-20261021/_data/source-notes.md)
