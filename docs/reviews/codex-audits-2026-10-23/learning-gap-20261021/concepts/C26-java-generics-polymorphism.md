# C26. Generic·interface·다형성 — Repository 계약 읽기

판정: **개념 충분·현재 타입에 대입하는 평가 약함** · 우선순위 **P2** · 확인일 2026-10-21 KST.

## 검사 기준

컴파일 시 선언 타입/타입인자와 런타임 구현 객체를 구분하고 Repository<T,ID>·List<DTO>·Optional<T>의 계약을 따라 읽는다. 사용자 목적에서 도출한 프로젝트별 기준이며 보편적인 경력연차 기준이 아니다.

## 읽은 근거

- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/J03-generics.md:17](../../../../knowledge/J03-generics.md) — 17–50행. 발췌: `## 2. 핵심 개념  제네릭 선언은 ’<T>’ 같은 타입 매개변수를 도입하고, ’Box<String>’은 그 자리에 실제 타입 인자를 넣은 매개변수화 타입이다. 컴파일러가 선언과 사용처의 타입 관계를 검사한다. 런타임에 임의 타입의 클래스를 생성하는 템플릿 인스턴스화는 아니다.[10] `
- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/J03-generics.md:71](../../../../knowledge/J03-generics.md) — 71–94행. 발췌: `## 3. 내부 동작·원리  소스에서 타입 검사를 한 뒤, 클래스 파일에는 제네릭 서명 일부를 남길 수 있지만 실행 메서드 서명은 소거된 타입을 쓴다. JVM은 보통 ’List<String>’과 ’List<Integer>’의 개별 클래스를 만들지 않는다. 기존 바이트코드·라이브러리 호환성을 돕고, 인자마다 클래스를 복제하지 않는다. “런타임 비용 0”과 같지는 않다. 박싱, 삽입된 캐스트, 메서드 호출 비용은 별개다.[6][10] `
- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/J02-oop-object-contracts.md:48](../../../../knowledge/J02-oop-object-contracts.md) — 48–56행. 발췌: `### 오버로딩·오버라이딩·동적 디스패치  | 구분 | 판정 시점 | 메서드 구분 | 핵심 | |---|---|---|---|`
- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/J02-oop-object-contracts.md:80](../../../../knowledge/J02-oop-object-contracts.md) — 80–94행. 발췌: `### 호출은 두 단계로 해석된다  ’ref.work(arg)’의 시그니처는 ’ref’의 선언 타입과 ’arg’의 컴파일 타입으로 먼저 선택된다. 인스턴스 호출의 구현은 런타임 수신 객체에서 찾는다. 오버로딩은 런타임 인자 클래스에 따라 다시 선택되지 않는다. `
- [$WORKTREE_ROOT/concept-learning-night/lessons/E1-why-layers.md:128](../../../../../lessons/E1-why-layers.md) — 128–152행. 발췌: `**3. 구현을 갈아 끼운다.** 서비스는 한 글자도 안 고치고, 넣어 주는 저장소만 바꾼다.  ’’’java class LoggingPostRepository implements PostRepository {`
- $WORKTREE_ROOT/concept-learning-night/tools/site/p09-lesson-data.mjs:97 (기록 경로: `$WORKTREE_ROOT/concept-learning-night/tools/site/p09-lesson-data.mjs:97`) — 97–105행. 발췌: `    id:'methods', question:'객체 필드·static·오버로드·내부 호출을 함께 읽어볼까요?', source:'§3 MethodsDemo · 원문 378~411줄',     note:'Hello, Hi! Hello, Hi! 뒤에는 공백이 하나 있습니다. Profile·Greeting 예제의 데이터와 섞지 않습니다.',     stages:[       state('methods-create','객체와 클래스 상태','P09-12','새 MethodsDemo의 prefix에 Hello, 공백 포함 문자열을 대입하고, 공유 static created를 0에서 1로 증가시킵니다.','private final String prefix;\nprivate static int created;\npublic MethodsDemo(String prefix) {\n    this.prefix `

## 현재 커버리지

J03은 invariance/PECS/raw type/erasure/bridge/type token까지 코드로 다룬다. J02는 overload와 override의 선택 시점을 분리한다. E1은 같은 인터페이스에 저장소 구현을 바꿔 조립한다. P09 최신 화면은 실제 overloading·내부 호출의 입력과 반환값을 단계별로 보여준다.

## 남은 학습 공백

학습자가 실제 PostRepository의 제네릭 두 인자, save/find 반환 타입, controller DTO 변환의 타입을 따라가는 짧은 검증 경로는 분산돼 있다. 제네릭 고급 이론을 더 쌓기보다 현재 타입의 컴파일 에러와 런타임 proxy를 구분하는 전이 과제가 적절하다. 모든 서비스에 interface/impl을 강제로 추가하는 교육은 피한다.

## 보완 과제와 검증 기대값

현재 Repository 선언에서 Entity와 ID 타입을 적고 findById·save·목록map의 입력/반환을 추론하게 한다. raw List를 끼운 실패와 컴파일에서 잡힌 불일치를 비교하고, 동일 Service 생성자에 실제/가짜 구현을 넣었을 때 어떤 메서드가 선택되는지 설명한다.

기대값: 타입이 다른 ID나 컬렉션 대입은 가능한 한 컴파일 단계에서 발견한다. 인터페이스 참조의 인스턴스 호출은 실제 구현으로 가지만 overload 선택은 인자의 선언 타입으로 결정된다. Spring Data proxy가 존재한다고 모든 메서드가 SQL 한 문장으로 치환된다고 설명하지 않는다.

선수 관계: P09 signature → J02/J03 → C02 DI → C20 Repository

## 실행 구분과 범위

정적확인 및 기존 J03/E1/P09 실행기록 검토. 본 과제 이번실행 없음. 원문과 최신 P09/P04 보강을 구분했으며 개념 worktree의 학생소스를 main 최신 구현으로 간주하지 않았다. 본문을 읽지 않은 134개 전체에 동일 판정을 확대하지 않는다.

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
