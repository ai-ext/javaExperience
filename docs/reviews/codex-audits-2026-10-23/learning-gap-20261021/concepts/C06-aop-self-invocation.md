# C06. AOP self-invocation — 호출 경로가 계약

판정: **실행·실패 비교 충분** · 우선순위 **P3** · 확인일 2026-10-21 KST.

## 검사 기준

외부 프록시 호출·this 호출·직접 new의 차이를 transaction 이름과 DB commit/rollback으로 설명한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/S02-aop-proxy.md:79](../../../../knowledge/S02-aop-proxy.md) — 확인 범위 79–91행.

  발췌: `### self-invocation이 빠지는 이유  ’’’text 외부 호출: caller ──► proxy ──► advice ──► target.methodA()`
- [$WORKTREE_ROOT/concept-learning-night/lessons/G4-transaction-in-practice.md:68](../../../../../lessons/G4-transaction-in-practice.md) — 확인 범위 68–97행.

  발췌: `### ② 같은 객체 안에서 부르면 트랜잭션이 없다  ’’’java public void outerNoTx(String title) {         // @Transactional 없음`
- [$WORKTREE_ROOT/concept-learning-night/lessons/G4-transaction-in-practice.md:99](../../../../../lessons/G4-transaction-in-practice.md) — 확인 범위 99–140행.

  발췌: `### ③ ’REQUIRES_NEW’ — ’this.’로 부르면 / 다른 빈으로 부르면  본 작업이 실패해도 **감사 기록은 남기고** 싶다. 감사 기록 메서드에 ’REQUIRES_NEW’를 붙였다. 먼저 같은 클래스 안에 두고 ’this.’로 불렀다.`
- $WORKTREE_ROOT/concept-learning-night/tools/site/s08-lesson-data.mjs:1124 (기록 경로: `$WORKTREE_ROOT/concept-learning-night/tools/site/s08-lesson-data.mjs:1124`) — 확인 범위 1124–1126행.

  발췌: `{id:'proxy',question:'같은 애노테이션도 호출 경로에 따라 달라질까?',source:scope+' · 원문 직접 new / 추가 self-invocation / 추가 외부 프록시',sourceNote:'직접 new한 원문 서비스와 추가 selfInvoke/runtime 변형을 구분합니다. 애노테이션 존재와 실제 프록시 경계 적용은 다른 관측입니다.',note:transferNote+' ExtraRules.runtime은 추가 변형입니다. JDBC autocommit 결과를 Spring transaction commit과 같다고 표시하지 않습니다. '+limits,stages:[     stage('proxy','direct','직접 new는 transaction 없음','원문 서비스를 직접 new해 같은 강제 checked 실패를 호출했습니다. active=false이며 debit은 autocommit되어 observer가750/100을 읽었습니다.','new Tra`

S02는 JDK/CGLIB 모두 self invocation 경계를 설명한다. G4는 내부 호출로 save만 독립 commit되는 MySQL 로그와 REQUIRES_NEW 내부/외부 빈 비교를 보여준다. 최신 S08에는 direct/self/external 실제 JDBC 비교가 추가됐다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

자기호출 실습이 없다는 판정은 틀리다. 경계 판별을 학습자 API에서 수행하는 과제의 접근성과 실제 현재 설정 확인만 남는다. private/final을 단순 암기 목록으로 추가하는 것보다 이미 있는 실행 비교를 사용해야 한다.

## 실습 수행 가능성과 보완 과제

현재 서비스의 진입점 하나를 고른 뒤 외부 호출과 this 호출에서 실제 active/name과 저장 행을 예상하고 비교하게 한다. 실패 뒤 남는 행까지 설명하게 한다.

검증 기대값: G4 조건의 self-invocation에서는 service tx가 없고 Repository save의 tx로 행이 남는다. 외부 프록시 경계에서는 runtime 실패 뒤 행이 없어야 한다. 실제 다른 설정이면 그 차이를 기록한다.

선수 관계: C02/C03 → C12/C15

## 검증 수준과 제한

기존실행근거: G4 MySQL 실행 로그, S08 source-proof/execution.json 및 42 PASS 연결 검사. 이번실행 없음. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 $USER_HOME/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `spring-aop-proxy` — [Proxying Mechanisms — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
