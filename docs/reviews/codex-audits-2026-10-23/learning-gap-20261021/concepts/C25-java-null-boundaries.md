# C25. nullable wrapper·Optional·예외 — 저장 성공 뒤 조회 실패

판정: **이번 learner NPE 실측과 연결 필요** · 우선순위 **P1** · 확인일 2026-10-21 KST.

## 검사 기준

외부 입력→Entity 초기 상태→DB nullable→getter 언박싱→DTO→HTTP까지 null의 의미를 추적하고, 값 없음과 처리 실패를 구분한다. 사용자 목적에서 도출한 프로젝트별 기준이며 보편적인 경력연차 기준이 아니다.

## 읽은 근거

- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J01-types-string.md:39](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J01-types-string.md:39) — 39–52행. 발췌: `컴파일러는 문맥에 따라 변환 규칙을 적용한다. 예를 들어 ’Integer count = 3;’은 ’int’ 값을 ’Integer’ 참조로 박싱한다. ’int next = count + 1;’에서는 ’count’를 먼저 언박싱하고, 숫자 승격 규칙에 따라 ’int’ 산술을 수행한다. 연산 결과를 ’Integer’ 변수에 저장하면 다시 박싱한다. 자동 문법은 변환을 없애지 않고 코드 표면에서 숨긴다.  ’’’text Integer count = 3;`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J01-types-string.md:102](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J01-types-string.md:102) — 102–138행. 발췌: `### 예제 1 — 박싱, 캐시, 언박싱  ’’’java public class BoxingDemo {`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J04-exceptions.md:76](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/J04-exceptions.md:76) — 76–86행. 발췌: `### 예외 변환과 체이닝  하위 예외를 그대로 노출하면 상위 API가 구현에 묶일 수 있으므로 경계에서 의미 있는 타입으로 변환한다. ’new StorageException(message, e)’처럼 cause를 보존해야 실제 실패 타입과 호출 경로를 잃지 않는다.[Oracle 튜토리얼 ’Chained Exceptions’; ’Throwable’ API] `
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p04-lesson-data.mjs:537](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p04-lesson-data.mjs:537) — 537–540행. 발췌: `  { id: 'lombok-fields', question: 'Lombok 생성자는 어떤 필드를 인자로 받을까?', source: lombokSource, note: 'Fields는 독립 추가 fixture입니다. 원문의 AllArgs를 모든 필드라고 줄여 읽기 전에, 실제 생성자 시그니처를 확인합니다. 이 예제에서는 선언 시 초기화한 final fixed와 static shared가 두 생성자의 인자에서 제외됐습니다. final은 null 검증을 뜻하지 않습니다.', stages: [     stage('lombok-required', 'required는 두 인자', '미초기화 final Gateway gateway와 @NonNull String name이 required 생성자 인자입니다. 일반 int retries는 required 인자에 들지 않습니다.', 'lombok-fields',`
- [/Users/ds/code/javaExperience/src/main/java/org/example/domain/PostEntity.java:30](/Users/ds/code/javaExperience/src/main/java/org/example/domain/PostEntity.java:30) — 30–44행. 발췌: `    @Column     private Boolean heart;      public PostEntity(){};`
- [/Users/ds/code/javaExperience/src/main/java/org/example/domain/PostEntity.java:67](/Users/ds/code/javaExperience/src/main/java/org/example/domain/PostEntity.java:67) — 67–68행. 발췌: `    public boolean getLike(){         return this.heart;`
- [/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/01-LEARNER-CODE.md:23](/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/01-LEARNER-CODE.md:23) — 23–43행. 발췌: `검사 코드: /Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/learner-project/src/test/java/org/example/LearningGapAuditTest.java  최종 실행: 기존 1개 + 감사용 6개 = 7개, 실패 0개. 감사 테스트는 **문제 동작을 재현하는 것도 통과 조건**으로 삼는 관찰 테스트다. 따라서 7개 통과를 기능 정상 판정으로 읽으면 안 된다. `

## 현재 커버리지

J01은 nullable wrapper 언박싱 NPE의 발생식·DB/JSON 경계·기본값/거절 정책과 순수 Java 실제 출력을 제공한다. P04 최신 보강은 final만으로 null을 거부하지 않으며 Lombok NonNull과 다름을 실제 비교한다. J04는 정상적인 값 없음에 Optional을 쓰되 오류를 null로 위장하지 말라고 설명한다. null 이론이 빠진 자료가 아니다.

## 남은 학습 공백

메인의 이번 실행에서 PostEntity.heart가 생성자로 초기화되지 않은 null이고 getLike()의 boolean 반환 언박싱이 ListResponseDto 변환과 목록 GET을 실패시켰다. POST 저장·tags 왕복은 성공했으므로 저장 단독 성공이 읽기 계약을 보장하지 않는다는 실제 학습 지점이다. 학습자 진척을 오답 처리하거나 임의 수정하지 않고 이 경로를 다음 학습 과제로 연결해야 한다.

## 보완 과제와 검증 기대값

현재 API에 입력 미전달/null/false/true의 의미표를 작성한다. 좋아요를 단일 Boolean 기본값으로 처리할지 회원별 관계로 설계할지는 업무모델 판단으로 분리한다. 새 Entity의 id null→저장 후 생성값과 int getter 호출 시점도 같이 점검한다. Optional.empty, null 필드, 예외 발생을 서로 다른 계약으로 테스트한다.

기대값: 정상 저장→목록 조회까지 한 흐름이 성공하고 JSON의 각 필드 nullable 계약과 DB 제약이 일치해야 한다. 현재 문제 재현은 NPE이며 네트워크 HTTP500을 관찰했다고 쓰지 않는다. 수정 뒤 기대값은 요구사항에서 정하고 null을 무조건 false로 숨기는 것을 보편정답으로 삼지 않는다.

선수 관계: P09 생성자·필드기본값 → J01 boxing → P04 생성 불변식 → C08 DTO → C21 테스트

## 실행 구분과 범위

이번실행: 메인 담당자의 격리복사본 Java21/Boot4.1.1/MySQL8.4.11 관찰 테스트. 본 담당자는 실행보고서와 원본 코드를 읽었다. 기존실행근거: J01/P04. 원본 소스 변경 없음. 원문과 최신 P09/P04 보강을 구분했으며 개념 worktree의 학생소스를 main 최신 구현으로 간주하지 않았다. 본문을 읽지 않은 134개 전체에 동일 판정을 확대하지 않는다.

## 병행 작업에 따른 스냅샷 한정

감사 도중 common-learning-foundation worktree가 추가됐다. 여기의 learner NPE·annotation 관찰은 /Users/ds/code/javaExperience 의 main 스냅샷과 그 격리복사본 기준이며 새 worktree 소스 전체의 상태로 확대하지 않는다. 새 기반 소스 비교·검증은 메인 담당자의 /Users/ds/research/javaexperience-learning-gap-audit-20261021/_data/common-foundation-comparison.json 및 전체 감사 보고서를 따른다.

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.

## 최신 common 기반 추가 실행 결과

메인 담당자가 common 기반의 새 learner 소스를 격리복사해 실행했다. 감사용 4개 테스트가 실패0으로 끝났으며, 실패 현상 자체를 기대값으로 확인한 테스트도 포함하므로 기능 전체 정상 판정이 아니다. 본 담당자는 다음 검사 코드·XML·복사 소스를 읽어 결과 범위를 확인했다.

- [/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/src/test/java/org/example/CommonLearningGapAuditTest.java](/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/src/test/java/org/example/CommonLearningGapAuditTest.java)
- [/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/build/test-results/test/TEST-org.example.CommonLearningGapAuditTest.xml](/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/build/test-results/test/TEST-org.example.CommonLearningGapAuditTest.xml)
- 통합 설명: [/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/03-COMMON-LEARNER-CODE.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/03-COMMON-LEARNER-CODE.md) — 메인 담당자의 완성 보고서를 추가로 읽고 대조했다.

새 기반의 [/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/src/main/java/org/example/domain/entity/PostEntity.java:31](/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/src/main/java/org/example/domain/entity/PostEntity.java:31)은 primitive boolean heart이고, 빈 tags POST 뒤 목록 GET은 MockMvc HTTP200 및 like=false였다. 따라서 앞의 main Boolean 언박싱 NPE는 **main 스냅샷의 이력**이며 새 기반에는 그대로 남아 있지 않다. null/primitive 계약을 실제 변경으로 해결한 사례로 교육에 연결한다. 새 기반의 다음 경계는 DTO 변환 중 LAZY 조회이며 C19의 추가 관측을 따른다.

common 실행의 DB는 저장소 seed를 사용한 일회용 MySQL이다. 개인 개발 DB의 스키마 변경 여부는 확인하지 않았으므로 개발 DB 전체가 같은 오류라고 단정하지 않는다.
