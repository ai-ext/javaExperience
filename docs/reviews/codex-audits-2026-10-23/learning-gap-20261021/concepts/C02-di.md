# C02. DI — 후보 선택과 실패 진단

판정: **기초 충분·학습자 코드 진단 연결 약함** · 우선순위 **P2** · 확인일 2026-10-21 KST.

## 검사 기준

필수 의존성 주입뿐 아니라 후보가 0개/1개/2개일 때의 결과를 실제 빈 정의·스캔·Qualifier로 설명할 수 있어야 한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/P11-bean-registration-di.md:13](../../../../knowledge/P11-bean-registration-di.md) — 확인 범위 13–35행.

  발췌: `1. **등록:** 직접 작성한 클래스는 ’@Component’ 계열, 라이브러리 객체는 ’@Configuration’ + ’@Bean’으로 등록한다. 기본 이름은 클래스명의 첫 글자 소문자 또는 메서드명이다. 자동 설정은 ’@ConditionalOnMissingBean’으로 대체를 허용한다. 2. **역할:** ’@Component’는 일반 클래스, ’@Service’ 서비스, ’@Repository’ 저장소(예외 변환 포함), ’@Controller’ MVC 계층이다. JSON API에는 ’@RestController’를 쓴다. 3. **스캔:** 메인 ’@SpringBootApplication’ 패키지와 하위만 기본 탐색한다. 형제 패키지는 공통 상위 패키지에 메인 클래스를 두거나 스캔 범위를 명시한다. 4. **생성자 주입:** 필수 의존성을 생성 시 전달해 ’final’로 둘 수 있고 단위 테스트도 간단하다. 생성자가 하나면 ’@Autowired’는 생략한다.`
- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/P11-bean-registration-di.md:147](../../../../knowledge/P11-bean-registration-di.md) — 확인 범위 147–165행.

  발췌: `’Clock’은 JDK 타입이라 그 클래스에 ’@Component’를 붙일 수 없다. ’src/main/java/com/example/catalog/TimeConfiguration.java’에서 ’@Bean’으로 등록한다.     ’’’java    package com.example.catalog;`
- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/P12-why-beans-ioc-intro.md:63](../../../../knowledge/P12-why-beans-ioc-intro.md) — 확인 범위 63–75행.

  발췌: `4. **필드가 아니라 생성자에 주입한다.** 생성자에 필수 의존성이 드러나고, ’final’로 만들 수 있으며, Spring 없이도 테스트에서 가짜를 넣을 수 있다. Spring Boot 문서도 일반적으로 생성자 주입을 권장한다.  5. **생성자가 하나면 보통 ’@Autowired’를 쓰지 않는다.** Spring은 그 유일한 생성자를 선택한다. 생성자가 여럿이면 사용할 생성자를 표시하거나 설계를 다시 단순하게 한다. 상세한 선택·모호성 해결은 → P11.`

P11은 Component/Bean 등록, scan, Primary/Qualifier/List/Map, Lombok 생성자를 모두 다룬다. P12는 new로 만든 인스턴스에 Spring 프록시 기능이 붙지 않는 이유와 테스트 대역 조립을 설명한다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

Primary/Qualifier가 없다는 공백은 없다. 다만 예제는 별도 catalog 프로젝트 생성 중심이고 Spring 실행이 미검증으로 표시돼 있다. 현재 학습자의 PostService에서 어떤 타입을 누가 주입했는지 확인하는 짧은 진단 과제와 후보 변경 전후 증거가 약하다.

## 실습 수행 가능성과 보완 과제

학습자 코드에서 생성자 인자→실제 등록 빈 이름→등록 출처를 적게 하고, 별도 연습 구성에서 scan 밖 이동·두 구현 등록·명시 Qualifier 세 변형을 비교한다.

검증 기대값: 후보 없음/모호성 실패를 서로 다른 원인으로 설명하고, Qualifier 추가 후 선택된 구현 호출 결과가 달라지되 Service 업무 코드에는 구현 클래스 new가 없어야 한다.

선수 관계: C01 → 인터페이스 → C06 프록시

## 검증 수준과 제한

기존실행근거: P11 delombok 출력은 존재하나 Spring 따라하기는 미실행. 이번실행 없음. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 $USER_HOME/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `spring-di` — [Dependency Injection — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html)
- `spring-bean-definition` — [Bean Overview — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/core/beans/definition.html)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
