# C14. readOnly·Transactional import — 힌트와 실제 동작

판정: **자료 존재·현재 코드 선택 연결 약함** · 우선순위 **P1** · 확인일 2026-10-21 KST.

## 검사 기준

같은 Transactional 이름의 패키지 차이와 readOnly의 설정/실제 동작을 구분해 조회·쓰기 경계를 선택한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/S08-transactions.md:64](../../../../knowledge/S08-transactions.md) — 확인 범위 64–76행.

  발췌: `### ’@Transactional’ 속성  | 속성 | 의미와 실무 주의 | |---|---|`
- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/S08-transactions.md:130](../../../../knowledge/S08-transactions.md) — 확인 범위 130–135행.

  발췌: `Spring 7 API 예제다. 저장소 구현·컨테이너·DB 구성에 연결해야 한다. **(미실행: Spring 컨테이너 및 DB 구성 필요)**  ’’’java import org.springframework.stereotype.Service;`
- [$WORKTREE_ROOT/concept-learning-night/lessons/G4-transaction-in-practice.md:154](../../../../../lessons/G4-transaction-in-practice.md) — 확인 범위 154–180행.

  발췌: `### ④ ’readOnly = true’에서 쓰면  ’’’java @Transactional(readOnly = true)`
- [$WORKTREE_ROOT/concept-learning-night/lessons/E7-jpa-update-delete.md:226](../../../../../lessons/E7-jpa-update-delete.md) — 확인 범위 226–237행.

  발췌: `### ⑤ ’@Transactional(readOnly = true)’에서 바꾸면  ’’’text TX: Creating new transaction with name [org.example.e7.LessonPostService.changeTitleReadOnly]: PROPAGATION_REQUIRED,ISOLATION_DEFAULT,readOnly`
- $WORKTREE_ROOT/concept-learning-night/tools/site/s08-lesson-data.mjs:1153 (기록 경로: `$WORKTREE_ROOT/concept-learning-night/tools/site/s08-lesson-data.mjs:1153`) — 확인 범위 1153–1155행.

  발췌: `{id:'readonly',question:'readOnly=true면 이 DB의 쓰기를 막았을까?',source:scope+' · 추가 readOnlyWrite',sourceNote:'readOnly는 권한 규칙이 아닌 힌트입니다. 여기서는 setReadOnly(true) 호출과 H2의 실제 쓰기 결과를 각각 확인했습니다.',note:'추가 H2 JDBC 결과를 다른 DB·드라이버·JPA 최적화·보안 권한으로 일반화하지 않습니다. '+limits,stages:[     stage('readonly','hint','readOnly 표시와 JDBC 힌트','추가 readOnlyWrite 진입 시 readOnly=true였고 실제 연결 메서드 setReadOnly(true)가 기록됐습니다. 이 사실만으로 쓰기 차단을 주장하지 않습니다.','@Transactional(readOnly=true)\npublic void readOnlyWrite() {\n    snap("read-only-w`

S08은 readOnly 힌트, 최신 H2에서는 JDBC 쓰기 commit 관측을 갖는다. G4는 MySQL 직접 INSERT/신규save 거부, E7은 readOnly에서 dirtychecking 미반영을 기록한다. 따라서 “readOnly 설명·실험이 없다”는 판정은 철회해야 한다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

핵심 학습 경로는 대개 import를 생략하고 S08/W11의 완전 코드만 Spring import를 쓴다. 메인이 확인한 현재 학습자 PostService의 jakarta.transaction.Transactional과 readOnly 사용 가능 속성의 차이를 진단하는 연결이 없다. Jakarta 사용 자체를 오류라 부르지 않는다. H2/드라이버/JPA의 다른 결과를 비교하는 단일 의사결정표도 필요하다.

## 실습 수행 가능성과 보완 과제

학습자가 현재 annotation 완전 수식명을 확인하고 같은 이름 두 API의 속성 표를 만든다. 별도 fixture에서 조회 후 변경/IDENTITY 신규저장/JDBC DML과 바깥 REQUIRED 참여를 환경별로 비교한다.

검증 기대값: 컴파일 가능한 속성 이름과 런타임 힌트를 나눈다. S08 H2 쓰기 성공, G4 MySQL DML 거부, E7 managed 변경 미반영은 각 기록 환경 한정값이다. readOnly는 권한 통제 검증의 대체가 아니어야 한다.

선수 관계: C06/C11/C12 → C15

## 검증 수준과 제한

기존실행근거는 여러 자료에 존재. 현재 learner import는 메인 확인을 참고했으며 본 파일에서 실행하지 않음. 두 annotation의 속성 차이는 spring-tx-annotation·jakarta-tx-annotation 공식근거에서 확인했다. Spring readOnly/rollbackFor와 Jakarta rollbackOn/dontRollbackOn을 구분하며, Jakarta annotation 자체가 Spring transaction 지원 밖이라는 뜻은 아니다. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 $USER_HOME/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `spring-tx-annotation` — [Using @Transactional — Spring Framework Reference](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html)
- `jakarta-tx-annotation` — [Jakarta Transactions Transactional API](https://jakarta.ee/specifications/platform/9/apidocs/jakarta/transaction/transactional)
- `spring-jdbc-enforce-readonly` — [DataSourceTransactionManager Javadoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/datasource/DataSourceTransactionManager.html)

이번 전체 감사의 learner 격리 실행에서 jakarta.transaction.Transactional 서비스는 외부 transaction에 참여했고 RuntimeException 뒤 행0이 관찰됐다. annotation 선택 자체는 오답이 아니다. 실제 관찰: $USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/01-LEARNER-CODE.md (기록 경로: `$USER_HOME/research/javaexperience-learning-gap-audit-20261021/runtime/01-LEARNER-CODE.md`).

## 병행 작업에 따른 스냅샷 한정

감사 도중 common-learning-foundation worktree가 추가됐다. 여기의 learner NPE·annotation 관찰은 $REPO_ROOT 의 main 스냅샷과 그 격리복사본 기준이며 새 worktree 소스 전체의 상태로 확대하지 않는다. 새 기반 소스 비교·검증은 메인 담당자의 $USER_HOME/research/javaexperience-learning-gap-audit-20261021/_data/common-foundation-comparison.json 및 전체 감사 보고서를 따른다.

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
