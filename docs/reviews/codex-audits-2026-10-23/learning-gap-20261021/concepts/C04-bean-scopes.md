# C04. Bean scope — singleton·prototype·request

판정: **핵심 설명 있음·범위 실험 분산** · 우선순위 **P2** · 확인일 2026-10-21 KST.

## 검사 기준

주입 시점의 객체와 호출 시 선택되는 대상을 구분하며 prototype과 request scope의 수명·정리 책임을 설명한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S01-ioc-di.md:48](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S01-ioc-di.md:48) — 확인 범위 48–55행.

  발췌: `| Scope | 생존 범위와 주의 | |---|---| | singleton | 컨테이너 안 정의별 한 객체. 기본값이며 요청별 상태를 저장하지 않음 |`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S01-ioc-di.md:89](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S01-ioc-di.md:89) — 확인 범위 89–108행.

  발췌: `싱글턴 서비스는 보통 컨텍스트 시작 중 만들어지고, request 객체는 HTTP 요청 중 만들어진다. 범위 프록시는 주입 시점에는 대리 객체를 넣고 메서드 호출 때 현재 요청의 대상을 찾아 위임한다.  ~~~text singleton service → request-scope proxy → 현재 요청의 대상`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S01-ioc-di.md:170](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S01-ioc-di.md:170) — 확인 범위 170–211행.

  발췌: `@Component class RequestTrace {     private final String traceId = java.util.UUID.randomUUID().toString();`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W25-spring-multithreading.md:239](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/W25-spring-multithreading.md:239) — 확인 범위 239–239행.

  발췌: `요청 스코프는 객체 수명을 요청과 맞출 뿐, 같은 요청 내 병렬 접근이나 비동기 스레드의 문맥 전달을 보장하지 않는다. 문자열 하나라면 앞의 무상태 서비스가 단순하다.`

S01에 singleton에 prototype 직접 주입 시 한 인스턴스를 재사용한다는 설명과 ObjectProvider, request scoped proxy가 있다. request 없는 실행 실패와 prototype 파괴 책임도 명시되어 있다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

범위 자체는 빠지지 않았다. 학습자가 실제 요청 두 번과 같은 요청 내부 두 호출에서 객체 identity를 비교하고, request 없는 스케줄러 호출 실패를 수집하는 묶음은 확인 자료에서 완결되지 않는다.

## 실습 수행 가능성과 보완 과제

같은 소비자에서 직접 주입한 prototype과 ObjectProvider 조회 결과를 두 번 비교하고, request scope의 요청 내/요청 간 대상 ID를 기록한다.

검증 기대값: 일반 주입 prototype은 같은 소비자의 필드에서 재사용, provider 두 조회는 다른 객체. 요청 내 대상은 같고 요청 간 다름. request 없는 접근 실패는 별도 조건으로 검증한다.

선수 관계: C02/C03 → C05

## 검증 수준과 제한

정적확인: S01 request 예제는 미실행. W25는 범위와 비동기 제한을 설명. 이번실행 없음. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 /Users/ds/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `spring-bean-scopes` — [Bean Scopes — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
