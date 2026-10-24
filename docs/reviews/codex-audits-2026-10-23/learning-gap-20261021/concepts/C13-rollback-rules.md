# C13. rollback 규칙·catch·rollback-only

판정: **기본 실험 충분·정책 판단 평가 추가** · 우선순위 **P2** · 확인일 2026-10-21 KST.

## 검사 기준

예외 타입, 예외가 프록시 밖으로 나왔는지, 참여 트랜잭션의 rollback-only 여부를 나눠 최종 DB 상태를 예측한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S08-transactions.md:110](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S08-transactions.md:110) — 확인 범위 110–118행.

  발췌: `### 롤백 규칙 매칭  기본 동작은 ’RuntimeException’과 ’Error’ 롤백, checked 예외 커밋이다. 따라서 업무 실패를 checked 예외로 표현한다면 ’rollbackFor = DomainException.class’처럼 타입을 구체적으로 선언한다.`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/lessons/G4-transaction-in-practice.md:202](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/lessons/G4-transaction-in-practice.md:202) — 확인 범위 202–240행.

  발췌: `## 일부러 틀려 보기  **1. 내가 던진 예외를 내가 잡는다** — 커밋된다.`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s08-lesson-data.mjs:1118](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s08-lesson-data.mjs:1118) — 확인 범위 1118–1120행.

  발췌: `{id:'rules',question:'예외를 던지면 언제나 rollback될까?',source:scope+' · 추가 ExtraRules',sourceNote:ruleNote,note:ruleNote+' 프록시 밖으로 나온 예외와 같은 메서드 안에서 잡은 예외를 구분합니다. '+limits,stages:[     stage('rules','checked','기본 checked 예외는 commit','추가 checked()가 ledger에 checked를 넣고 IOException을 던졌습니다. 기본 롤백 규칙에서는 checked가 대상이 아니어서 행이 남았습니다.','@Transactional public void checked() throws IOException {\n    jdbc.update("insert into ledger values(\'checked\')");\n    throw new IOException("checked");\n}',[['프록시 밖 예외','IOE`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s08-lesson-data.mjs:1133](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s08-lesson-data.mjs:1133) — 확인 범위 1133–1135행.

  발췌: `{id:'required',question:'안쪽 예외를 잡았는데 왜 바깥 commit도 실패할까?',source:scope+' · 추가 Outer/Inner REQUIRED',sourceNote:'추가 Outer와 Inner를 각각 프록시로 호출합니다. 같은 메서드 내부 catch 예제와 달리 안쪽 프록시가 먼저 rollback-only를 표시합니다.',note:'inner.required 실패를 outer가 잡아도 같은 물리 transaction의 rollback-only가 남았습니다. 최종 UnexpectedRollbackException과 전체 rollback을 구분해 봅니다. '+limits,stages:[     stage('required','inner','두 논리 범위는 같은 연결','추가 outer-required-start와 inner-required는 모두 active=true이며 같은 tracked connection85였습니다. 각각 outer와 inner-r`

checked 기본 commit/rollbackFor, RuntimeException, noRollbackFor, 직접 던진 예외 catch, 참여 저장소 실패 catch와 UnexpectedRollbackException은 G4와 S08에서 실제 사례로 다룬다. Framework 전역 ALL_EXCEPTIONS 선택도 원문에 있다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

부족한 것은 예외 종류 나열보다 업무 실패를 어떻게 표현할지의 판단 평가다. 특히 G4의 “저장 전에 값을 검사해 예외가 안 나게”를 DB 동시 제약 실패까지 제거하는 보장으로 읽지 않게 해야 한다. 사전 검사와 최종 DB 제약은 다른 역할이다.

## 실습 수행 가능성과 보완 과제

“알림 실패는 주문 유지”, “잔액 부족은 전체 취소”, “중복 신청 경합은 한 건만 허용”의 세 계약에서 rollback 규칙과 catch 위치를 선택하고 DB 최종상태를 예측하게 한다.

검증 기대값: own catch 정상반환은 조건상 commit, 참여 tx 실패는 rollback-only가 남아 outer 최종 실패. 중복 동시요청은 사전조회만으로 안전하다고 판단하지 않고 제약/동시성 결과를 검증한다.

선수 관계: C12 → C15/C16

## 검증 수준과 제한

기존실행근거: G4 JPA/MySQL 예외로그와 S08 JDBC 42 checks. 이번실행 없음. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 /Users/ds/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `spring-tx-rollback` — [Rolling Back a Declarative Transaction — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/rolling-back.html)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
