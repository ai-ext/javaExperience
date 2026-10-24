# C03. Bean 생명주기 — 초기화·종료와 프록시 준비

판정: **설명 충분·실행 과제 약함** · 우선순위 **P2** · 확인일 2026-10-21 KST.

## 검사 기준

생성자·의존성 설정·초기화·프록시·정상 종료의 관찰 순서를 구분하고 초기화에 외부 작업을 넣는 비용을 판단한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/S01-ioc-di.md:57](../../../../knowledge/S01-ioc-di.md) — 확인 범위 57–108행.

  발췌: `## 3. 내부 동작·원리  ### 컨텍스트 시작과 빈 하나의 생성`
- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/S01-ioc-di.md:110](../../../../knowledge/S01-ioc-di.md) — 확인 범위 110–126행.

  발췌: `## 4. 코드로 확인  다음은 Boot 4.1 / Framework 7 프로젝트용 코드다. 실행 환경을 구성하지 않아 모두 (미실행)이다.`
- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/S01-ioc-di.md:320](../../../../knowledge/S01-ioc-di.md) — 확인 범위 320–326행.

  발췌: `### Q7. @PostConstruct와 SmartLifecycle은 어떤 차이가 있는가?  @PostConstruct는 빈 의존성이 설정된 뒤 해당 빈을 초기화하는 콜백이다.   SmartLifecycle은 컨텍스트 시작·종료에 연동되는 컴포넌트의 자동 시작, 순서, 정지 완료를 다룬다.`

S01은 BeanDefinition/BFPP/BPP, PostConstruct→afterPropertiesSet→init, PreDestroy와 prototype 종료 관리 제외, SmartLifecycle까지 설명한다. 용어 누락으로 볼 수 없다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

세 단계 콜백을 실제 컨텍스트에서 기록하는 완결된 실패/정상 비교가 본문의 실행 예제로 제공되지 않는다. PostConstruct에서 같은 객체의 Transactional 메서드를 부를 때의 의미도 C06/G4와 학습 과제로 연결되지 않는다.

## 실습 수행 가능성과 보완 과제

작은 AnnotationConfigApplicationContext에서 생성자·PostConstruct·init·PreDestroy 로그를 모으고 close 전후를 비교한다. 초기화 중 자기호출/준비 후 외부 빈 호출을 분리한 프로브를 설계한다.

검증 기대값: 정상 close 때 종료 콜백, prototype 자동 파괴 제외를 관찰한다. 초기화 단계의 메서드 진입만으로 트랜잭션 적용을 판정하지 않고 actualTransactionActive와 실제 DB 결과를 함께 확인한다.

선수 관계: C01/C02 → C06

## 검증 수준과 제한

정적확인: S01의 Spring 예제는 미실행 표시. 기존실행근거를 새 런타임 검증으로 간주하지 않았다. 이번실행 없음. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 $USER_HOME/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `spring-lifecycle` — [Customizing the Nature of a Bean — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/core/beans/factory-nature.html)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
