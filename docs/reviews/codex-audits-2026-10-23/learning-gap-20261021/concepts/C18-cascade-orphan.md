# C18. Cascade·orphanRemoval — 삭제 책임과 범위

판정: **핵심 실행 있음·상태별 경계는 설명** · 우선순위 **P2** · 확인일 2026-10-21 KST.

## 검사 기준

관계 제거, 부모 삭제, JPA 작업 전파, DB ON DELETE를 구분하고 공유 대상을 지우지 않는 소유권을 설계한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S09-jpa-hibernate.md:44](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S09-jpa-hibernate.md:44) — 확인 범위 44–53행.

  발췌: `### 헷갈리는 매핑 옵션  | 구분 | 동작 | 선택 기준 | |---|---|---|`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P20-jpa-entity-mapping.md:76](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P20-jpa-entity-mapping.md:76) — 확인 범위 76–86행.

  발췌: `### 2.5 cascade, orphanRemoval, 다대다  cascade는 JPA 상태 전파이고 DB FK cascade가 아니다. ’orphanRemoval=true’는 부모 컬렉션에서 빠진 자식을 삭제한다. 주문항목처럼 생명주기가 종속된 경우에만 함께 쓴다.`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p20-lesson-data.mjs:657](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p20-lesson-data.mjs:657) — 확인 범위 657–659행.

  발췌: `"id": "orphan",     "question": "managed 자식을 removeLine하면 언제 DB에서 없어질까?",     "source": "원문orphanRemoval=true · 추가managed삭제transaction",`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p20-lesson-data.mjs:753](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p20-lesson-data.mjs:753) — 확인 범위 753–755행.

  발췌: `"id": "mapping",     "question": "애노테이션이 실제 열과 감사 값에 어떻게 나타났을까?",     "source": "원문Column/Enumerated/BaseEntity · 추가JDBC metadata와commit행",`

P20 보강은 managed child 제거→flush DELETE→외부observer는 이전행→commit 뒤 자식0/부모1을 기록한다. FK deleteRule3(NoAction)로 DB cascade와 ORM cascade의 차이를 확인한다. new/detached/removed 제외는 실행 안 했다고 명시한다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

원문은 ALL 예제를 기본으로 보여 주고 공유 참조 경고는 설명에 머문다. 원문에 없는 상태별 경계를 보강이 정직하게 미실행 처리했으므로 실제 수행 과제는 new/detached/managed 차이 및 공유 참조의 삭제 불변식을 골라 추가하는 것이 적절하다.

## 실습 수행 가능성과 보완 과제

부모 종속 항목과 공유 상품을 구분한 두 관계에 대해 삭제 전후 행 수를 예측하게 하고, new/detached 자식 제거는 별도 fixture에서 실행한다.

검증 기대값: 기존 managed orphan 조건에서는 자식만 삭제되고 부모 유지. 공유 상품을 삭제하지 않는 도메인 계약을 assertion한다. new/detached 결과는 일반화하지 않고 JPA 계약과 실행환경을 함께 적는다.

선수 관계: C17/C10 → 삭제 정책

## 검증 수준과 제한

기존실행근거: P20 orphan 및 FK metadata. new/detached/removed 제외조건은 문헌 설명이며 이번실행 없음. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 /Users/ds/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `jakarta-persistence-spec` — [Jakarta Persistence 3.2 Specification](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
