# C21. 단위 테스트·mock — 검증 경계와 실습 경로

판정: **교육 내용 있음·복제본 실행 진입점 차단** · 우선순위 **P1** · 확인일 2026-10-21 KST.

## 검사 기준

업무 결과와 대역 상호작용을 구분하고, 주어진 저장소에서 문서의 테스트 명령을 실행할 수 있어야 한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V01-what-and-how-to-test.md:15](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V01-what-and-how-to-test.md:15) — 확인 범위 15–37행.

  발췌: `### 2.1 요구사항에서 테스트할 행동을 고른다  먼저 비즈니스 규칙, 경계값, 분기, 과거 버그, 외부 계약을 찾는다. 상품 API라면 “없는 ID는 404”, “삭제 상품은 일반 조회에서 제외”, “페이지 응답의 상품과 전체 건수가 맞다”가 후보다. 단순 getter/setter나 Spring 자체 기능은 애플리케이션이 보장하는 요구사항이 아니다.`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V01-what-and-how-to-test.md:81](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V01-what-and-how-to-test.md:81) — 확인 범위 81–94행.

  발췌: `## 3. 따라 하기  예제는 ’practice/starter’의 실제 상품 API를 따르며 Java 25 전용 문법 없이 Boot 4.1.1 기준 **(미실행)**이다. README에는 JDK 21·Gradle 9.8.0·Boot 4.1.1로 테스트 2개가 통과한 기록이 있다.`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V03-mocking-in-practice.md:148](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V03-mocking-in-practice.md:148) — 확인 범위 148–189행.

  발췌: `### 2.3 Boot 4 MVC 슬라이스는 Controller를 실물로 둔다  현재 실습 프로젝트의 정확한 import는 ’org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest’와 ’AutoConfigureMockMvc’다. ’@MockitoBean’은 ’org.springframework.test.context.bean.override.mockito.MockitoBean’이다. Controller·MVC 변환은 실제로 돌리고 다음 Service 경계를 mock한다.`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V03-mocking-in-practice.md:212](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V03-mocking-in-practice.md:212) — 확인 범위 212–214행.

  발췌: `## 3. 따라 하기  실습은 Boot 4.1.1·Gradle 9.8·JDK 21인 ’practice/starter’ 상품 API를 쓴다. Java 25 호환 코드이며 새 예제는 실행하지 않았다.`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/v04-2026-10-20/source-proof/source.json:62](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/design/v04-2026-10-20/source-proof/source.json:62) — 확인 범위 62–84행.

  발췌: `"externalStudyData": [     {       "source": "/Users/ds/research/java-spring/practice/starter/src/main/java/com/example/practice/product/Product.java",       "copy": "external/java/com/example/practice/product/Product.java",`

V01은 위험·계약 기반 테스트 선정과 테스트 수준의 맹점을 설명한다. V03은 mock/stub/fake/spy, doReturn, 실제 서비스 생성자 주입, 시간/난수 통제까지 구체적이다. V04 보강은 외부 원본 unit2 실제 통과를 기록한다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

V01/V03은 현재 프로젝트의 practice/starter/ProductService를 전제로 cd와 파일읽기를 안내하지만 감사 대상 checkout의 practice에는 MISSIONS.md/html만 있다. 최신 V04는 원본이 /Users/ds/research/java-spring/practice/starter임을 source.json에 기록한다. 외부 자료 존재는 clone 학습자의 실행 가능성을 해결하지 않는다.

## 실습 수행 가능성과 보완 과제

본 저장소 학습자 PostService를 대상으로 같은 원칙을 적용하는 최소 테스트 진입점 또는 독립 다운로드 fixture의 정확한 경로·실행명령·의존성을 제공해야 한다. 예제 대상만 바꾸고 테스트 의도는 보존한다.

검증 기대값: 새 clone에서 안내한 디렉터리가 존재하고 단위 테스트가 DB 없이 실행된다. 정책 위반 시 저장소 미호출/기대 예외, 정상 시 저장 결과가 맞는다. mock 통과를 실제 SQL/rollback 검증으로 표시하지 않는다.

선수 관계: C02 → V01/V03 → C22/C23

## 검증 수준과 제한

정적확인: practice 파일 목록과 source.json 외부 출처. 기존 unit2 PASS는 보강 기록. 이번실행 없음. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 /Users/ds/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `spring-di` — [Dependency Injection — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
