# C01. IoC — 객체 조립과 컨테이너의 역할

판정: **설명 충분·입문 문장 과잉 일반화** · 우선순위 **P2** · 확인일 2026-10-21 KST.

## 검사 기준

객체의 생성·선택·수명 책임을 설명하고, DI를 Spring 없이도 적용하며, 실제 빈 생성 실패 원인을 객체 의존 그래프로 구분할 수 있어야 한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P12-why-beans-ioc-intro.md:11](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P12-why-beans-ioc-intro.md:11) — 확인 범위 11–36행.

  발췌: `’’’java class OrderService {     private final OrderRepository repository = new SqlOrderRepository(); }`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/lessons/E1-why-layers.md:23](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/lessons/E1-why-layers.md:23) — 확인 범위 23–33행.

  발췌: `### 의존성과 주입  - **의존성**: A가 일하려면 B가 있어야 하면 "A는 B에 의존한다"고 한다. 서비스는 저장소가 있어야 글을 저장할 수 있다. 그러니 서비스는 저장소에 의존한다. - **주입**: A가 B를 **자기 안에서 만들지 않는다.** 바깥에서 만들어 A에게 넣어 준다.`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/lessons/E1-why-layers.md:116](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/lessons/E1-why-layers.md:116) — 확인 범위 116–152행.

  발췌: `**2. 저장소를 하나 더 만들어 본다.**  ’’’text jshell> PostService other = new PostService(new MemoryPostRepository())`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S01-ioc-di.md:19](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S01-ioc-di.md:19) — 확인 범위 19–40행.

  발췌: `| 개념 | 정의와 구분 | |---|---| | IoC | 객체 생성·연결·생명주기 제어를 컨테이너로 옮기는 원칙 | | DI | 생성자·팩터리·프로퍼티로 협력 객체를 전달하는 조립 방식 |`

P12에는 직접 new→생성자→main 조립→Spring 조립의 단계와 순수 Java 출력이 있다. E1은 저장소 교체를 실제 jshell로 보여 준다. S01은 컨테이너별 정의·생명주기 및 등록 방식을 구분한다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

E1의 “저장소가 서비스를 부르면 ... 서버가 뜨지 않는다”는 역방향 의존과 실제 순환 그래프를 섞는다. “이 실수를 막으려고 Spring은 빈을 하나만”도 기본 singleton 조건을 생략한다. IoC 자체가 없다는 판정은 부정확하며, 입문 설명에서 S01의 정확한 조건으로 넘어가는 연결을 보완해야 한다.

## 실습 수행 가능성과 보완 과제

세 그래프 A→B, A→B→A, Repository→독립 Service를 나란히 두고 계층 설계 위반과 컨테이너 생성 가능성을 따로 판정하게 한다. P12 조립 코드에서 동일 저장소 공유/서로 다른 저장소 선택을 직접 바꾸게 한다.

검증 기대값: 양방향 생성자 순환만 시작 실패를 재현하는 케이스와, 역방향 의존이지만 고리가 없는 경우 시작되는 케이스를 분리한다. 생성자 주입은 Spring 없이도 동작하고 같은 인스턴스를 넘긴 두 서비스의 저장 상태는 공유됨을 확인한다.

선수 관계: Java 생성자·참조 동일성 → C02 DI → C03 생명주기

## 검증 수준과 제한

기존실행근거: P12 JDK21 stdout, E1 jshell 기록. Spring P12 예제는 문서에서 미실행. 이번실행 없음. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 /Users/ds/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `spring-di` — [Dependency Injection — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html)
- `spring-bean-scopes` — [Bean Scopes — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html)
- `spring-boot-circular-beans` — [Spring Boot application-properties reference: allow-circular-references](https://docs.spring.io/spring-boot/appendix/application-properties/index.html)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
