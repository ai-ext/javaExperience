# C05. Singleton thread safety — final과 요청 상태

판정: **핵심·재현 모두 있음** · 우선순위 **P3** · 확인일 2026-10-21 KST.

## 검사 기준

싱글턴 서비스의 공유 필드와 호출별 지역 변수를 구분하고 final 참조가 내부 객체의 안전성까지 보장하지 않음을 설명한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W25-spring-multithreading.md:59](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W25-spring-multithreading.md:59) — 확인 범위 59–83행.

  발췌: `### 싱글턴은 한 객체를 공유한다  빈 스코프 표에서 ’singleton’은 기본 스코프이며 Spring IoC 컨테이너마다 빈 정의 하나에 객체 인스턴스 하나를 둔다. 같은 컨테이너에 들어온 요청들이 같은 컨트롤러·서비스 객체를 호출한다. 서버를 여러 인스턴스로 띄우면 인스턴스마다 컨테이너와 싱글턴 객체가 따로 생긴다. 따라서 “싱글턴”은 클러스터 전체에서 공유하는 전역 객체라는 뜻도 아니다.`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W25-spring-multithreading.md:100](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W25-spring-multithreading.md:100) — 확인 범위 100–161행.

  발췌: `### 5.1 공유 싱글턴 필드에서 요청 상태가 섞이는 순수 Java 재현  실제 서비스에서 요청별 이름을 필드에 보관하는 잘못된 형태다. 두 요청의 순서를 래치로 고정하여 Alice가 자기 이름을 쓴 뒤 Bob이 덮어쓰고, Alice가 다시 필드를 읽게 했다. 래치가 스레드 순서를 정하므로 출력은 재현 가능하다.`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P12-why-beans-ioc-intro.md:69](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P12-why-beans-ioc-intro.md:69) — 확인 범위 69–75행.

  발췌: `7. **’new’로 직접 만든 객체에는 Spring이 개입하지 않는다.** 클래스에 ’@Service’가 붙어 있어도 ’new OrderService(...)’로 만든 그 인스턴스를 컨테이너가 만든 건 아니다. 컨테이너의 의존성 주입, 초기화·종료 관리, 프록시 기반 기능은 그 객체에 자동으로 적용되지 않는다.  8. **Spring이 없는 곳에서는 계속 ’new’를 쓴다.** 순수 단위 테스트는 ’new OrderService(fakeRepository, fakePayment)’처럼 필요한 가짜를 직접 전달하면 된다. Spring을 띄우지 않아 빠르고 어떤 협력 객체를 쓸지 코드에서 분명하다.`

W25는 Alice/Bob 순서를 CountDownLatch로 고정한 누출 예제, stateless 개선, final의 한계, ThreadLocal 정리, 스레드 풀과 DB 풀 차이까지 다룬다. 단순 키워드 수준이 아니다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

핵심 공백은 확인되지 않았다. 남는 연결은 학습자 Service 필드 목록을 실제로 분류하는 평가이며, W25의 순수 Java 재현과 Tomcat 관찰을 동일한 실험으로 오해하지 않게 유지해야 한다.

## 실습 수행 가능성과 보완 과제

학습자 Service의 각 필드를 불변 설정/협력자 참조/요청 가변 데이터로 분류하고 W25의 누출 변형을 별도 fixture에 적용한다.

검증 기대값: Latch로 통제한 잘못된 구현에서 Alice 응답이 Bob 값, stateless 구현에서 각각 자기 값. final List를 공유하면 내부 변경은 가능한 점을 별도 검증한다.

선수 관계: Java 객체/스레드 → C04 → C09

## 검증 수준과 제한

기존실행근거: W25 순수 Java 재현 및 별도 12요청 Tomcat 기록. 이번실행 없음. 해당 주제를 새로 처음부터 제작할 필요는 낮다. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 /Users/ds/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `spring-bean-scopes` — [Bean Scopes — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html)
- `spring-tx-thread-bound` — [Understanding Declarative Transaction Implementation — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-decl-explained.html)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
