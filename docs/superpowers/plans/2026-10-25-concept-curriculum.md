# Java·Spring Boot 개념 학습 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox syntax for tracking.

> 구현 및 정의된 하네스 검증 완료. 후속 C05 3단계에서 사용자 UI 복사 후 실제 macOS `/usr/bin/pbpaste` 결과와 예상 UTF-8 원문 139바이트가 일치함을 확인했다. 전체 6개 단원의 자동 OS 붙여넣기 인증은 미실시이며, 기존 134개 원문의 전체 내용·실행 완료를 뜻하지 않는다. 이번 새 raster는 없어 imagegen/parity 조건부 단계는 N/A이며 시안·parity 검증을 뜻하지 않는다.

**Goal:** 필수 여부·학습 깊이·분야를 분리한 개념 목록과 C01–C06 핵심 단원, 예제별 공식 근거·실행 범위를 제공한다.

**Architecture:** 원문 134개·학습자 서버·과거 근거는 유지한다. 별도 탐색 메타데이터를 현재 원문 SHA에 연결하고 기존 catalog의 검색/history를 확장한다. `lessons/concept-core.md`를 저자 원문으로 둔 집중 학습 화면을 기존 빌더에 연결한다. 최소 Spring/Lombok 실행 프로젝트는 `docs/design/concept-curriculum-2026-10-25/proof/`에서 실행하며 서버 답안으로 넣지 않는다.

**Tech Stack:** 기존 Node ESM/marked/esbuild/JSDOM, Java21/Gradle/Spring Boot4.1.1/Lombok BOM, 기존 정적 HTML/CSS, PC 다크 전용.

사용자 승인: 2026-10-25 “ㅇㅇ 해봐”. 메인 설계·통합·검증, Luna high의 작은 구현, Sol high 독립 spec→quality 검수 순환을 유지한다. 별도 실행 방식 질문은 하지 않는다.

## Task 1: 현재 원문에 결합하는 분류와 상태 모델

Files: `tools/site/concept-curriculum.mjs`, `tools/site/test-concept-curriculum.mjs`, `docs/design/concept-curriculum-2026-10-25/classification.json`, `PROGRESS.md`.

- [x] 기존 목록 134개와 원문 SHA를 대조한 입력을 고정한다.
- [x] 실패 검사를 먼저 실행한다. `classifyConcept('S01')`은 Spring 분야이고 필수·기초와 심화 포함 범위를 구분하며, J20은 선택·심화다. C04는 C05 없이 진입할 수 있다. 잘못된 ID·순환 선수·원문 SHA 불일치를 거부한다.
- [x] 별도 분류의 계약을 구현한다.

```js
// 우선순위는 이 저장소의 기본 API 입문 경로 기준이다.
// 여러 깊이는 원문이 포함하는 범위이며 문서 전체 완료가 아니다.
const example = {
  id: 'S01', domain: 'spring', priority: 'required',
  depths: ['foundation', 'applied', 'advanced'],
  classificationBasis: '기본 API에서 객체 조립과 공유 상태를 읽기 위한 입문 분류',
  contentReview: 'not_reassessed', execution: 'see_example_evidence'
};
const C04 = { id: 'C04', priority: 'required', depth: 'foundation', prerequisites: ['C01','C02','C03'] };
```

- [x] 필수/선택과 기초/응용/심화의 모든 조합, 미분류, 전체 탐색을 검사한다. 링크·URL 개수로 검증 상태를 만들지 않는다.
- [x] 메인에서 분류 근거를 검토하고 Sol spec→quality 검수를 받아 해결되지 않은 finding을 수정한다.

## Task 2: 핵심 개념의 공식 근거와 최소 실행

Files: `docs/design/concept-curriculum-2026-10-25/research/`, `proof/build.gradle`, `proof/src/test/java/learning/CoreConceptTest.java`, `proof/run-proof.py`, `proof/execution.json`.

- [x] Codex CLI OpenAI gpt-6-luna/high 직접 공식 조회를 수행한다. 이전 연구와 새 조회 결과를 구분하고 실패·버전 차이를 보존한다.
- [x] 최소 fixture는 learner source와 무관하게 Boot4.1.1, Java21, WebMVC 및 Lombok을 사용한다. MySQL·Docker가 필요한 의존성을 넣지 않는다. 실제 의존성 버전을 기록한다.
- [x] 다음 관찰을 assertions로 정의한 뒤 실행한다.

```text
C01: 같은 값의 객체 둘과 같은 참조를 구분, 생성자 입력과 메서드 반환을 확인
C02: 최소 MVC 앱 기동, 임시 loopback 포트 HTTP 응답과 종료 확인
C03: RUNTIME 표식 조회와 CLASS 표식의 런타임 비노출, 표식만으로 동작이 생기지 않음
C04: 직접 생성자 조립과 컨테이너 주입의 결과 일치, 같은 빈 참조, 누락 의존성 실패
C05: Lombok 생성자/getter 결과를 명시적 클래스와 비교, 실제 delombok 출력,
     processor 활성 컴파일 성공과 비활성 컴파일 실패를 별도 subprocess에서 확인
C06: 생성자→주입→PostConstruct→사용→PreDestroy의 정상 컨텍스트 종료 순서
```

- [x] 실행 결과에는 source SHA, 명령, Java/라이브러리 버전, 실제 출력, 실패와 종료, assertion ID를 보존한다. 예상값을 실제값으로 쓰지 않는다.
- [x] 메인은 공식 출처의 본문·주장 대응과 실행 결과를 대조한다. Sol은 fixture와 결과의 검증력을 독립 검수한다.

## Task 3: 목록의 필터·이름·학습 경로

Files: 기존 `knowledge-visual.mjs`, `knowledge-catalog-view.mjs`, `knowledge-catalog-controller.mjs`, `knowledge-catalog.css`, 해당 tests.

- [x] 기본 진입에서 priority=required/depth=foundation/domain=all로 C01–C06 경로와 필수 문서가 보이는 실패 검사를 작성한다.
- [x] 분야를 Java/Spring·Boot/HTTP·API/DB·JPA/테스트/운영으로 표시하고 별도 두 필터를 제공한다. 검색어만 준 URL은 전체 우선순위·깊이를 대상으로 찾는다.
- [x] 기존 `category` URL과 과거 history는 호환한다. 새 priority/depth 상태도 뒤로가기·새로고침·검색 복귀에서 보존한다. 기존 ID와 새 domain을 명시적으로 대응한다.
- [x] 문서 제목을 먼저 표시하고 질문은 보조로 둔다. 코드 읽기 링크를 실행 과제와 구분한다. 조사/실행/화면 상태를 단일 완료 배지로 합치지 않는다.
- [x] 빈 결과에서 모든 필터를 풀어 접근할 수 있고, 미분류와 전체 134개 원문 접근을 유지한다.
- [x] Luna 구현 → 메인 회귀 확인 → Sol spec→quality 검수 순으로 완료한다.

## Task 4: C01–C06 집중 학습 화면

Files: `lessons/concept-core.md`, `tools/site/core-learning-data.mjs`, `core-learning.mjs`, `core-learning.js`, `core-learning.css`, tests, 기존 `build.mjs` 및 inventory collector의 단원 기록.

- [x] 실제 읽을 수 있는 정의·필요한 이유·동일 사례·코드·관찰·실패 조건을 먼저 두고, 원시 로그와 출처 상세만 접는다.
- [x] 단원 선택·이전/다음·URL unit 상태·키보드·복사(장면/요청 generation guard)를 실제 DOM 검사로 정의한다.
- [x] C01은 기존 P09/P04 근거와 비교하되 새 fixture 관찰을 구분한다. C02–C06의 실제 proof 결과와 공식 주장 ID를 각각 연결한다.
- [x] source ID/SHA/heading을 검증하고 원문 바로가기의 실제 생성 anchor를 대조한다. 과거 연구 사본이 현재와 다르거나 상충하면 재확인 필요를 표시한다.
- [x] PC 다크 1280/1440/1920에서 홈→목록→단원→원문→복귀를 확인한다. 자료·근거 확인 상태가 무엇을 뜻하는지 화면에서 설명한다. 새 raster 시안이 필요할 경우 imagegen 스킬을 적용하고 JPG로 저장한다.
- [x] Luna의 기계 구현·메인 통합 및 실제 화면 확인·Sol 독립 검수를 완료한다.

## Task 5: 빌드·감사·회귀와 진행표

- [x] 변경된 catalog/core/schema/proof 검사를 실행하고 실패를 해결한다.
- [x] `npm run build`, `audit:visual`, `audit:version-cards`, `audit:parity`, `test:knowledge-catalog`, `test:concept-reader`, `test:concept-dark`, `test:navigation`, `test:home`를 실행한다. 공통 builder/reader에 영향이 있으면 기존 26 하네스도 실행한다.
- [x] inventory는 새 항목을 미검토에서 시작하고 실제 근거가 있는 부분만 implemented로 올린다. 전체 원문 완료나 verified 승격을 추정하지 않는다.
- [x] 첫 출시 6개 단원, 원문 134개, 분류 검토, 공식 대조, 실행, 화면 검증을 진행표의 별도 열로 기록한다.
- [x] main 원문·learner source·역사 proof 보존과 공개 제외 캡처/PNG 재유입 0을 검사한다. 로컬 의미 단위 커밋 후 `check:generated`로 생성물 일치를 확인한다.
- [x] 최종 결과를 새 worktree 미리보기로 열고 링크·완료 범위·남은 범위를 보고한다. 사용자 요청 없는 push/PR/main merge를 진행하지 않는다.
