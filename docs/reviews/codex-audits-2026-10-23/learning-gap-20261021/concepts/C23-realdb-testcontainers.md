# C23. 실제 DB 테스트·Testcontainers — 원문/실행환경 정합성

판정: **지원자료 있음·원문 낡은 일반화·런타임 미완결** · 우선순위 **P1** · 확인일 2026-10-21 KST.

## 검사 기준

사용 DB엔진·연결 출처·테스트 DB교체·컨테이너 수명·seed를 확인하고 MySQL 호환성 보증 범위를 좁혀 말한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V04-test-db-strategy.md:3](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V04-test-db-strategy.md:3) — 확인 범위 3–31행.

  발췌: `> 3줄 요약 — 서비스·도메인 로직은 DB 없이 빠르게 검증하고, SQL·제약·방언을 검증할 Repository/API 테스트에는 운영과 같은 DB 엔진을 쓴다. > Spring Boot 4.1의 ’@DataJpaTest’는 기본적으로 임베디드 DB로 바꾸고 테스트마다 트랜잭션을 롤백하므로, Testcontainers를 붙일 때는 DB 교체를 명시적으로 끈다. > 테스트 메서드의 ’@Transactional’은 편리한 격리 장치이자 현실과 다른 실행 조건이다. 지연 로딩·커밋 이벤트·flush·실제 HTTP 요청 경계를 별도로 검증한다.`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V04-test-db-strategy.md:57](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/V04-test-db-strategy.md:57) — 확인 범위 57–108행.

  발췌: `### 2단계 — Repository 테스트를 MySQL로 실행  ’src/test/java/com/example/practice/product/ProductRepositoryTest.java’는 실제 프로젝트의 패키지·메서드·시드에 맞춘 형태다. ’Replace.NONE’이 없으면 ’@DataJpaTest’가 임베디드 DB로 바꿀 수 있다.`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/v04-lesson-data.mjs:429](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/v04-lesson-data.mjs:429) — 확인 범위 429–431행.

  발췌: `{id:'replace',question:'DataJpaTest는 항상 H2로 바꿀까?',source:'추가 Boot4.1.1 DataJpaTest 교체4조건 · ddl-auto=none',sourceNote:'원문의 항상 교체 설명을 보충합니다. Boot4.1.1 default는 NON_TEST이며 recognized test DB는 예외입니다. 여기의 dynamic URL은 DynamicPropertySource이지 Testcontainers가 아닙니다.',note:'네 조건 모두 자동 구성 DataSource와 ddl-auto=none으로 실제 엔진을 확인했습니다. 테스트 DB 교체를 Container/ServiceConnection 실행 성공으로 일반화하지 않습니다. '+limits,stages:[  stage('replace','static','default NON_TEST·static은 H2','일반 static URL을 지정한 추가 slice에서 default annot`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/v04-lesson-data.mjs:468](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/v04-lesson-data.mjs:468) — 확인 범위 468–470행.

  발췌: `{id:'containers',question:'원문 Testcontainers class는 어디까지 검증됐을까?',source:'원문 complete TC Java compile-only / 추가 native·H2·Boot 실행 범위',sourceNote:'Docker socket은 접속거부였고 TC·ServiceConnection·container lifetime은 실행하지 않았습니다. 원문 전체 class는 변경 없이 컴파일만 통과했습니다.',note:'static class 범위 공유·container Bean context 수명·reuse는 문헌 설명이며 이 실행에서 runtime 검증한 항목이 아닙니다. 메타 ASSERT/JUnit/facts는 겹치는 검증 단위입니다. '+limits,stages:[  stage('containers','compile','원문 TC는 compile-only','원문 @Testcontainers/@ServiceConnection Produc`

V04 최신은 NON_TEST 기본값에서 static URL은H2, DynamicPropertySource는MySQL 유지, explicit ANY/NONE을 비교한다. MySQL8.4.11과 H2 모드의 collation/unique 차이도 실제 관측한다. 원문 TC 클래스는 compile-only임을 분명히 한다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

원문 4·26행은 embedded DB 교체를 포괄적으로 설명하고 최신 보강은 recognized test DB 예외를 정정한다. Markdown만 읽는 경로와 HTML의 지식이 달라진다. Docker 실패로 원문 Testcontainers/ServiceConnection lifecycle runtime는 완료되지 않았으며 native MySQL 실행으로 대신 완료 처리하면 안 된다.

## 실습 수행 가능성과 보완 과제

원문 설명과 보강 교체표를 통일하고, 공개 재현fixture에서 TC/ServiceConnection 실제 경로와 native fallback을 명시 분리한다. 각 케이스는 JDBC metadata로 엔진/버전을 assert하고 전용 schema seed 및 cleanup을 확인한다.

검증 기대값: 의도한 테스트 연결에서 실제 엔진이MySQL이어야 한다. NON_TEST·ANY·NONE 기대값은 현재 버전/연결 기원에 따라 표와 일치. TC runtime 실패는 실패로 보고하며 H2/native성공을 동일 실행으로 대체하지 않는다.

선수 관계: C21/C22 → CI/DB 운영

## 검증 수준과 제한

기존실행근거: V04 native MySQL·H2 및 교체 비교; TC compile-only·Docker socket 접속거부 기록. 이번실행 없음. 메인이 learner baseline TC를 별도로 검증 중이며 이 문서 fixture 완료와는 다르다. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 /Users/ds/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `spring-test-thread-bound` — [Transaction Management in TestContext Framework](https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/tx.html)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
