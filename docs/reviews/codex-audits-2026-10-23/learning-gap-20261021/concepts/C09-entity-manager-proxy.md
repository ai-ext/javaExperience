# C09. EntityManager — 주입 프록시·실제 컨텍스트·스레드

판정: **실무 연결 핵심 공백** · 우선순위 **P1** · 확인일 2026-10-21 KST.

## 검사 기준

싱글턴 Service의 EntityManager 필드가 왜 가능한지와 실제 EntityManager/영속성 컨텍스트를 스레드 간 공유하면 안 되는 이유를 구분한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S09-jpa-hibernate.md:153](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S09-jpa-hibernate.md:153) — 확인 범위 153–173행.

  발췌: `import jakarta.persistence.EntityManager; import org.springframework.stereotype.Service; import org.springframework.transaction.annotation.Transactional;`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S09-jpa-hibernate.md:184](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S09-jpa-hibernate.md:184) — 확인 범위 184–203행.

  발췌: `import jakarta.persistence.EntityManager; import jakarta.persistence.PersistenceContext; import java.util.List; import org.springframework.stereotype.Service;`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W25-spring-multithreading.md:79](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W25-spring-multithreading.md:79) — 확인 범위 79–83행.

  발췌: `### ThreadLocal은 스레드별 칸이지 요청별 저장소가 아니다  ’ThreadLocal<T>’은 스레드마다 별도 값을 제공한다. Spring 트랜잭션은 ’TransactionSynchronizationManager’로 JDBC 자원을 현재 스레드에 바인딩한다. Spring Security의 ’SecurityContextHolder’는 인증 문맥을 제공하고, 전통적인 Servlet 설정은 스레드 로컬 전략을 쓴다. 로깅 MDC에도 요청 ID 등을 넣는다.`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P28-default-beans.md:26](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P28-default-beans.md:26) — 확인 범위 26–48행.

  발췌: `| ’tomcatServletWebServerFactory’ | ’org.springframework.boot.tomcat.servlet.TomcatServletWebServerFactory’ | 내장 Tomcat 생성 | WebMVC와 Tomcat 자동 구성 | ’server.*’; 서버 교체는 의존성과 설정 점검 | | ’dispatcherServlet’ | ’org.springframework.web.servlet.DispatcherServlet’ | MVC 요청을 핸들러에 전달 | WebMVC 자동 구성 | 보통 컨트롤러·’WebMvcConfigurer’로 확장 | | ’requestMappingHandlerAdapter’ | ’org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerAdapter’ | 컨트롤러 호출과 요청·응답 변환 | WebMVC 자동 구성 | ’WebMvcConfigurer#e`

S09는 EntityManager API·상태·컨텍스트·직접 native 실행을 상세히 다룬다. W25는 transaction ThreadLocal, P28은 EntityManagerFactory와 JpaTransactionManager를 보여 준다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

읽은 핵심 본문·레슨에서는 주입받은 공유 참조와 transaction마다 위임되는 실제 EntityManager를 연결하는 사례가 확인되지 않았다. native em를 직접 만드는 S09 추가 실험은 Spring 주입 프록시를 실행하지 않았다고 명시한다. 이는 “싱글턴은 공유되니 EM도 하나?”라는 질문을 남긴다. 전체 134문서 부재 단정은 하지 않는다.

## 실습 수행 가능성과 보완 과제

Spring 빈의 주입 EM proxy identity와 두 트랜잭션의 실제 delegate/managed 객체 identity를 비교하는 작은 과제를 만들고, @Async에는 엔티티나 EM 대신 ID/불변 입력을 넘기는 설계 이유를 설명하게 한다.

검증 기대값: 주입 참조 동일성만으로 실제 컨텍스트 동일성을 결론내리지 않는다. 각각의 transaction에서 contains와 객체 identity를 측정하고 종료 뒤 lazy 접근을 분리한다. 실제 EntityManager/영속성 컨텍스트의 비동시사용 계약과 Spring 공유 주입 프록시의 위임은 하단 spring-shared-entitymanager·jakarta-persistence-spec 공식근거로 확인했다. 이 프로젝트에서의 delegate 비교 실험은 미실행이다.

선수 관계: C04/C05/C06 → C10/C12

## 검증 수준과 제한

정적확인 및 기존 native 관측 검토. Spring EM 공유 프록시 비교를 이번에 실행하지 않음. 공유 프록시와 실제 EntityManager의 일반계약은 하단 공식근거 조사에서 확인됐으며, 본 프로젝트의 동시 delegate 관측은 미실행이다. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 /Users/ds/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `spring-shared-entitymanager` — [JPA — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/data-access/orm/jpa.html)
- `jakarta-persistence-spec` — [Jakarta Persistence 3.2 Specification](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
