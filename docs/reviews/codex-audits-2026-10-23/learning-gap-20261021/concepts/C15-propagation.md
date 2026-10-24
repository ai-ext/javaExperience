# C15. Propagation — 물리 연결·NESTED·풀 비용

판정: **전파 실험 충분·자원 운영 과제 부족** · 우선순위 **P2** · 확인일 2026-10-21 KST.

## 검사 기준

논리 경계/물리 연결/독립 commit/savepoint를 나눠 전파를 고르고 연결 풀 비용을 설명한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/S08-transactions.md:32](../../../../knowledge/S08-transactions.md) — 확인 범위 32–46행.

  발췌: `### 전파 7종  | 전파 | 기존 트랜잭션이 있을 때 | 없을 때 | 흔한 용도·주의 | |---|---|---|---|`
- $WORKTREE_ROOT/concept-learning-night/tools/site/s08-lesson-data.mjs:1138 (기록 경로: `$WORKTREE_ROOT/concept-learning-night/tools/site/s08-lesson-data.mjs:1138`) — 확인 범위 1138–1140행.

  발췌: `{id:'new',question:'REQUIRES_NEW의 안쪽 commit은 바깥 rollback과 같을까?',source:scope+' · 추가 REQUIRES_NEW 독립 경계',sourceNote:'추가 run의 tracked connection91(outer)과92(inner)를 비교합니다. 이 번호는 트래킹용 연결 식별자이며 DB 세션 번호나 풀 사용량 계측이 아닙니다.',note:'보류된 outer와 독립 inner의 물리 경계를 비교한 추가 실험입니다. 이 실행에서 풀 고갈·연결 지연시간을 측정하지 않았습니다. '+limits,stages:[     stage('new','outer','바깥 연결91에서 시작','추가 outer transaction이 outer 행을 INSERT하고 안쪽 프록시를 호출합니다. 바깥은 tracked connection91에 묶여 있습니다.','@Transactional public void newThenFail() {\n    jdbc`
- $WORKTREE_ROOT/concept-learning-night/tools/site/s08-lesson-data.mjs:1143 (기록 경로: `$WORKTREE_ROOT/concept-learning-night/tools/site/s08-lesson-data.mjs:1143`) — 확인 범위 1143–1145행.

  발췌: `{id:'nested',question:'NESTED의 부분 rollback은 독립 commit일까?',source:scope+' · 추가 JDBC savepoint 실험',sourceNote:'이 DataSourceTransactionManager/H2 조합의 NESTED 실측입니다. 다른 관리자·JPA·드라이버에서 같은 지원을 보장한 결과가 아닙니다.',note:'같은 tracked connection98 안에서 savepoint를 만들고 그 지점으로 rollback했습니다. 안쪽의 독립 commit이 아니라 바깥 물리 transaction의 부분 rollback입니다. '+limits,stages:[     stage('nested','same','안팎은 같은 연결98','outer-nested-start와 inner-nested는 같은 연결98에서 실행됐습니다. 안쪽은 NESTED 선언으로 savepoint 경계를 사용합니다.','@Transactional(propagatio`
- $WORKTREE_ROOT/concept-learning-night/tools/site/s08-lesson-data.mjs:1148 (기록 경로: `$WORKTREE_ROOT/concept-learning-night/tools/site/s08-lesson-data.mjs:1148`) — 확인 범위 1148–1150행.

  발췌: `{id:'contracts',question:'transaction active와 synchronization은 같은 뜻일까?',source:scope+' · 추가 SUPPORTS / MANDATORY / NOT_SUPPORTED / NEVER',sourceNote:'active는 실제 transaction 활성 표시이고 synchronization은 동기화 범위 표시입니다. active=false여도 sync=true일 수 있습니다.',note:'전파 계약은 이 Spring JDBC 관리자에서 관찰했습니다. 자원 정리 중 남은 thread-local 표시나 synchronization만으로 DB commit 여부를 판단하지 않습니다. '+limits,stages:[     stage('contracts','outside','바깥 transaction 없는 SUPPORTS','추가 inner.supports()는 기존 transaction 없이 호출됐습니다. active=false지`

최신 S08은 REQUIRED 같은 연결, REQUIRES_NEW 다른 연결과 outer 재개, NESTED 동일 연결 savepoint, SUPPORTS active=false/sync=true, MANDATORY/NEVER 거부까지 기록한다. G4에도 REQUIRES_NEW JPA/MySQL 사례가 있다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

원문이 지적한 풀 고갈은 보강에서도 미측정으로 제한한다. 이미 전파 전종을 재현했으므로 비슷한 예제를 더 만드는 것보다 작은 pool에서 독립 transaction이 연결을 추가 요구하는 병목과 재시도 위치를 관찰하는 운영 연결이 남는다. JDBC NESTED 결과를 JPA 매니저 지원으로 확대하면 안 된다.

## 실습 수행 가능성과 보완 과제

별도 disposable 실험에서 작은 pool과 제한된 동시 호출로 outer 연결 보유/inner 신규 대기를 관찰하고 timeout 뒤 남는 행을 확인한다. NESTED는 실제 사용하는 매니저의 지원 여부부터 명시한다.

검증 기대값: REQUIRES_NEW inner commit 행은 outer rollback 뒤 남는다. savepoint rollback은 outer commit에 포함된 다른 변경을 보존한다. pool 실험의 대기·실패 시간은 측정 전 숫자를 만들지 않는다.

선수 관계: C06/C12/C13 → 커넥션 풀 관측

## 검증 수준과 제한

기존실행근거: S08 연결 추적값 및 G4 로그. 풀 부하/고갈 이번실행 없음. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 $USER_HOME/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `spring-propagation` — [Transaction Propagation — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/tx-propagation.html)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
