import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { CORE_UNITS, classifyConcept } from './concept-curriculum.mjs';

const directory = 'docs/design/concept-curriculum-2026-10-25';
const stage = (title, explanation, code, rows, view = {}) => ({ title, explanation, code, rows, ...view });
const content = {
  C01: {
    definition: '클래스로 객체의 구조와 동작을 정의하고, new로 인스턴스를 만듭니다. 참조 변수 둘이 같은 객체를 가리킬 수도 있습니다.',
    scenario: '같은 이름을 가진 값 객체 둘과, 한 객체를 함께 가리키는 변수 둘을 비교합니다.',
    stages: [
      stage('생성자로 상태를 정합니다', '생성자의 name 인자가 객체의 필드에 들어갑니다. 변수 first는 만들어진 객체를 가리킵니다.', 'var first = new PlainValue("민수");', [['생성자 인자', '객체 생성 전', '민수'], ['first.name', '객체 없음', '민수']]),
      stage('변수를 복사해도 객체가 늘지는 않습니다', 'alias에는 first와 같은 참조가 전달됩니다. 같은 객체를 두 이름으로 관찰합니다.', 'var alias = first;\nassertSame(first, alias);', [['객체 개수', '1개', '1개'], ['first와 alias', 'alias 미선언', '같은 객체']]),
      stage('같은 값으로 다시 new하면 다른 객체입니다', '이 예제의 두 객체는 이름이 같지만 같은 인스턴스는 아닙니다. 값 비교와 참조 비교를 구분하세요.', 'var second = new PlainValue("민수");\nassertNotSame(first, second);\nassertEquals(first.getName(), second.getName());', [['객체 개수', '1개', '2개'], ['이름 비교 / 참조 비교', '비교 전', '같음 / 다름']]),
    ],
  },
  C02: {
    definition: 'Spring은 객체 조립·웹 처리 같은 기반 기능을 제공합니다. Boot는 설정과 의존성을 묶고 애플리케이션을 시작하기 편하게 해 줍니다.',
    scenario: 'DB 없는 작은 MVC 앱을 임시 loopback 포트로 시작하고 GET 요청 한 건을 보낸 뒤 종료합니다.',
    stages: [
      stage('앱이 사용할 객체와 설정을 준비합니다', '이번 fixture는 스캔 대신 명시적 @Bean 등록을 사용합니다. 대표적인 @SpringBootApplication의 모든 동작을 실험한 것은 아닙니다.', '@Configuration(proxyBeanMethods = false)\n@EnableAutoConfiguration\nstatic class MinimalApp { /* @Bean 등록 */ }', [['설정', 'Java 클래스', '컨텍스트가 읽을 설정'], ['DB', '없음', '이 예제에서도 사용하지 않음']]),
      stage('HTTP 요청이 Controller와 Service로 이어집니다', '실제로 열린 임시 포트에 Java HttpClient가 요청했습니다. 화면의 단계 버튼이 새 요청을 보내는 것은 아닙니다.', '@GetMapping("/api/concepts/greeting")\nString greet(@RequestParam(name = "name") String name) {\n    return service.greet(name);\n}', [['요청 인자', 'name=Min', 'Controller의 name'], ['HTTP 응답', '요청 전', '200 · Hello, Min']]),
      stage('컨텍스트와 서버를 닫습니다', '관찰에 사용한 서버는 종료됐습니다. 기록의 임시 포트를 현재 실행 중인 서버 주소로 사용하지 마세요.', 'context.close();\n// 같은 포트로 새 연결을 시도해 닫혔는지 확인', [['컨텍스트', '실행 중', '닫힘'], ['관찰용 포트', '연결 가능', '새 연결 실패 확인']]),
    ],
  },
  C03: {
    definition: '애노테이션은 선언에 붙는 정보입니다. 컴파일러·도구·프레임워크가 그 정보를 읽고 처리해야 동작으로 이어집니다.',
    scenario: '같은 메서드에 RUNTIME과 CLASS 표식을 붙여 reflection 조회와 실제 메서드 호출을 분리합니다.',
    stages: [
      stage('표식을 붙이는 것과 호출하는 것은 다릅니다', '표식이 있는 메서드를 아직 부르지 않았을 때 calls는 0입니다. 이 표식 자체는 코드를 실행하지 않습니다.', '@RuntimeMark @ClassMark\nvoid run() { calls++; }', [['표식', '없음', '메서드에 정보가 붙음'], ['calls', '0', '호출 전이므로 0']]),
      stage('보존 정책이 조회 범위를 바꿉니다', '이 예제에서 RUNTIME 표식은 reflection으로 보이고 CLASS 표식은 보이지 않습니다. CLASS 정보가 class 파일에서 사라진다는 뜻은 아닙니다.', 'method.isAnnotationPresent(RuntimeMark.class); // true\nmethod.isAnnotationPresent(ClassMark.class);   // false', [['RUNTIME', 'class 파일에 보존', 'reflection 조회 가능'], ['CLASS', 'class 파일에 보존', '이 reflection 조회에는 없음']]),
      stage('처리 주체와 시점을 연결합니다', '같은 인사 API 주변 코드를 읽는 관점으로 표식과 처리 주체를 연결합니다. 아래 지도는 설명이며, 이번 C03 실행은 보존 정책과 명시 호출에 한정합니다. AOP 프록시 예제는 실행하지 않았습니다.', 'method.invoke(instance);\nassertEquals(1, instance.calls);', [
        ['컴파일', '@Getter · @RequiredArgsConstructor', 'Lombok processor가 getter·생성자 생성(C05)'],
        ['앱 기동', '@Bean', 'Spring이 설정을 읽어 Repository·Service 등록·조립(C02·C04)'],
        ['HTTP 요청', '@RequestParam', 'MVC가 name=Min을 메서드 인자로 준비(C02)'],
        ['메서드 호출', '@TraceCall + Aspect 설정', '설정된 프록시 경유 시 전후 부가기능 적용(P27 설명, 미실행)'],
      ], { comparisonTitle: '애노테이션 처리 주체와 시점', columns: ['처리 시점', '표식·대상', '처리 주체와 역할'] }),
    ],
  },
  C04: {
    definition: '의존 객체를 생성자 인자로 받으면 조립을 바깥에서 결정할 수 있습니다. Spring DI에서는 컨테이너가 빈을 만들며 그 연결을 담당합니다.',
    scenario: 'GreetingService가 GreetingRepository를 생성자로 받습니다. 직접 조립한 경우와 컨테이너가 조립한 경우를 비교합니다.',
    stages: [
      stage('생성자로 필요한 객체를 선언합니다', '의존성 주입은 Lombok 없이도 가능합니다. 먼저 평범한 Java 생성자로 연결을 읽어 보세요.', 'GreetingService(GreetingRepository repository) {\n    this.repository = repository;\n}\nvar manual = new GreetingService(new GreetingRepository());', [['의존 객체 생성', 'Service 안에서 직접 결정', '조립하는 바깥에서 결정'], ['필수 입력', '숨겨진 의존', '생성자 인자에 드러남']]),
      stage('Spring이 등록된 빈을 연결합니다', '이번 예제에서는 주입된 Repository가 컨테이너에서 조회한 빈과 같은 참조이고, Service를 다시 조회해도 같은 빈입니다.', 'context.registerBean(GreetingRepository.class);\ncontext.registerBean(GreetingService.class);\ncontext.refresh();', [['Repository', '타입으로 의존성 선언', '같은 빈 참조 주입'], ['Service 조회', '첫 조회', '재조회에도 같은 빈']]),
      stage('필수 의존 객체가 없으면 조립이 실패합니다', '이 예제의 일반 생성자 인자는 필수입니다. Repository 등록을 빼면 refresh 중 예외가 발생합니다. 컬렉션·선택 의존성까지 같은 규칙이라고 일반화하지 않습니다.', 'context.registerBean(GreetingService.class);\n// Repository 미등록\nassertThrows(UnsatisfiedDependencyException.class, context::refresh);', [['Repository 등록', '있음', '없음'], ['refresh 결과', '조립 성공', 'UnsatisfiedDependencyException']]),
    ],
  },
  C05: {
    definition: 'Lombok은 반복되는 생성자·접근자 코드를 컴파일 과정에서 만들어 줍니다. 생성된 생성자를 이용해 객체를 연결하는 Spring의 역할과는 다릅니다.',
    scenario: 'name이라는 final 필드를 가진 값 타입을 명시적 코드와 Lombok으로 비교하고, processor를 끈 컴파일도 따로 확인합니다.',
    stages: [
      stage('생성될 Java 코드를 먼저 예상합니다', '@RequiredArgsConstructor는 여기서 초기화되지 않은 final name을 받는 생성자를 만듭니다. @Getter는 name을 읽는 메서드를 만듭니다.', '@Getter @RequiredArgsConstructor\nstatic class Value {\n    private final String name;\n}', [['name', '필드 선언', '생성자 인자로 받음'], ['getName()', '소스에 직접 쓰지 않음', '생성 결과로 호출 가능']]),
      stage('생성 결과를 delombok으로 확인합니다', '실제 delombok 출력에서 생성자와 getter를 확인했고, processor를 켠 컴파일 결과를 실행해 Min을 얻었습니다. 아래는 생성 부분의 요약입니다.', 'Value(final String name) { this.name = name; }\npublic String getName() { return this.name; }', [['생성자', '소스에 표식만 있음', 'Value(String) 확인'], ['실행 결과', '컴파일 전', 'Min']]),
      stage('의존성 선언과 processor 동작을 구분합니다', '같은 소스에 -proc:none을 주면 이 예제의 생성자·getter 호출을 컴파일하지 못합니다. IDE 화면과 빌드 결과는 따로 확인해야 합니다.', 'compileOnly "org.projectlombok:lombok"\nannotationProcessor "org.projectlombok:lombok"\n// 별도 javac 관찰: processor 활성 / -proc:none', [['processor 활성', '생성 코드 사용', '컴파일 exit 0 · 실행 Min'], ['processor 비활성', '같은 소스', '컴파일 exit 1']]),
    ],
  },
  C06: {
    definition: '컨테이너는 빈을 생성하고 의존성을 연결한 뒤 초기화하며, 정상 종료 때 관리 중인 singleton 빈의 소멸 콜백을 호출합니다.',
    scenario: '단계를 분리해 보기 위해 이 관찰은 setter 주입을 사용합니다. 생성자 주입은 객체를 만들 때 이미 인자를 받는다는 차이도 함께 보세요.',
    stages: [
      stage('생성과 주입의 시점을 구분합니다', '이 fixture는 생성자를 먼저 호출한 뒤 @Autowired setter를 호출합니다. 생성자 주입이라면 의존성 전달은 생성자 호출에 포함됩니다.', 'ObservedLifecycle(Events events) { /* constructor 기록 */ }\n@Autowired void setRepository(GreetingRepository repository) {\n    this.repository = repository;\n}', [['이번 setter 관찰', 'constructor', 'setter-injection'], ['생성자 주입과 차이', '생성 이후 별도 전달', '생성자 주입은 인자로 전달']]),
      stage('초기화에서는 주입된 객체를 사용할 수 있습니다', 'PostConstruct 시점에 Repository가 null이 아님을 assertion으로 확인한 뒤 use를 호출했습니다. 표식을 읽는 후처리기가 등록된 컨텍스트의 관찰입니다.', '@PostConstruct void initialize() {\n    assertNotNull(repository);\n}\nbean.use();', [['실행 순서', 'setter-injection', 'postConstruct → use'], ['repository', '주입 전', '초기화 때 존재 확인']]),
      stage('정상 종료의 소멸 콜백을 봅니다', 'context.close() 뒤 preDestroy가 마지막으로 기록됐습니다. 강제 종료나 모든 scope의 소멸까지 실험한 것은 아닙니다.', '@PreDestroy void destroy() { /* preDestroy 기록 */ }\ncontext.close();', [['실행 순서', 'use까지 기록', '마지막 preDestroy'], ['확인 범위', '정상 컨텍스트 종료', '강제 종료는 미실험']]),
    ],
  },
};

const headings = {
  P09: ['3. 따라 하기', '3-따라-하기'], P04: ['3. 따라 하기', '3-따라-하기'],
  P01: ['3. 따라 하기', '3-따라-하기'], P03: ['2. 당장 알아야 할 것', '2-당장-알아야-할-것'],
  P27: ['2. 당장 알아야 할 것', '2-당장-알아야-할-것'], J06: ['3. 내부 동작·원리', '3-내부-동작원리'],
  P12: ['3. 따라 하기', '3-따라-하기'], P11: ['3. 따라 하기', '3-따라-하기'],
  W19: ['5. 코드로 보기', '5-코드로-보기'], S01: ['3. 내부 동작·원리', '3-내부-동작원리'],
};

export function loadCoreLearning(root, options = {}) {
  const readJson = name => JSON.parse(fs.readFileSync(path.join(root, directory, name), 'utf8'));
  const proof = options.proof || readJson('proof/execution.json');
  const research = options.research || readJson('research/sources.json');
  if (proof.status !== 'passed' || proof.testCount !== 8) throw new Error('핵심 단원 실행 증거가 통과하지 않았습니다.');
  const requiredInputs = ['build.gradle', 'settings.gradle', 'run-proof.py', 'src/test/java/learning/CoreConceptTest.java']
    .map(name => `${directory}/proof/${name}`).concat('gradle/wrapper/gradle-wrapper.properties');
  if (!Array.isArray(proof.inputs) || requiredInputs.some(name => !proof.inputs.some(input => input.path === name))) {
    throw new Error('실행 증거의 필수 입력 manifest가 없습니다.');
  }
  for (const input of proof.inputs) {
    const actual = createHash('sha256').update(fs.readFileSync(path.join(root, input.path))).digest('hex');
    if (actual !== input.sha256) throw new Error(`실행 증거의 원문 SHA 불일치: ${input.path}`);
  }
  if (research.provenance?.model !== 'gpt-6-luna' || research.provenance?.provider !== 'openai'
      || research.provenance.shellCalls !== 0 || research.provenance.nestedDelegation !== 0) {
    throw new Error('공식 조사 모델·직접 실행 경로를 확인할 수 없습니다.');
  }
  const sources = new Map(research.sources.map(source => [source.id, source]));
  for (const source of sources.values()) {
    const url = new URL(source.url);
    if (url.protocol !== 'https:' || !['docs.oracle.com', 'docs.spring.io', 'projectlombok.org'].includes(url.hostname)) {
      throw new Error('공식 출처로 허용하지 않은 URL입니다.');
    }
  }
  const units = CORE_UNITS.map(unit => {
    const unitClaims = research.claims.filter(claim => claim.unitId === unit.id);
    const supplementalClaimIds = unit.id === 'C03' ? ['c03', 'c11', 'c14', 'c15'] : [];
    const supplementalClaims = supplementalClaimIds.map(id => research.claims.find(claim => claim.id === id));
    if (supplementalClaims.some(claim => !claim)) throw new Error(`연결 근거 claim 누락: ${unit.id}`);
    const claims = [...unitClaims, ...supplementalClaims];
    const sourceIds = [...new Set(claims.flatMap(claim => claim.sourceIds))];
    if (!claims.length || sourceIds.some(id => !sources.has(id))) throw new Error(`공식 출처 누락: ${unit.id}`);
    const officialSources = sourceIds.map(id => sources.get(id));
    if (officialSources.some(source => source.status !== 'read') || claims.some(claim => claim.status !== 'supported')) {
      throw new Error(`본문 확인이 안 된 공식 출처가 있습니다: ${unit.id}`);
    }
    const sourceLinks = unit.sources.map(id => {
      const document = classifyConcept(id);
      const [heading, anchor] = headings[id];
      const md = fs.readFileSync(path.join(root, document.sourcePath), 'utf8');
      const actual = createHash('sha256').update(md).digest('hex');
      if (actual !== document.sourceSHA256 || !md.includes(`## ${heading}`)) throw new Error(`원문 절·SHA 불일치: ${id}`);
      return { id, heading, sourceSHA256: actual, href: `../${document.sourcePath.replace(/\.md$/, '.html')}?read=1#${anchor}` };
    });
    const observations = Object.entries(proof.units[unit.id].facts).map(([key, value]) => ({ key, value }));
    return { ...unit, ...content[unit.id], sourceLinks, officialSources, observations, limit: proof.limits[unit.id] };
  });
  return { units, runtime: proof.runtime, researchLimits: research.limits, checkedAtUTC: research.provenance.checkedAtUTC,
    observedAtUTC: proof.finishedAtUTC, executionHref: `../${directory}/proof/execution.json`,
    codeHref: `../${directory}/proof/src/test/java/learning/CoreConceptTest.java`,
    researchHref: `../${directory}/research/sources.json`,
    replay: 'python3 -B docs/design/concept-curriculum-2026-10-25/proof/run-proof.py' };
}
