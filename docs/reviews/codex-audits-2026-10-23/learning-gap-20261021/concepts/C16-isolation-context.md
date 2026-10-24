# C16. Isolation — 1차 캐시와 DB 스냅샷을 혼동하지 않기

판정: **DB 자료 있음·JPA 통합 판별 과제 약함** · 우선순위 **P2** · 확인일 2026-10-21 KST.

## 검사 기준

반복 조회의 같은 값이 JPA 1차 캐시 때문인지 DB isolation 때문인지 별도 관찰로 구분한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S08-transactions.md:48](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S08-transactions.md:48) — 확인 범위 48–62행.

  발췌: `### 격리수준과 동시성 이상  | 수준 | 방지하는 이상(표준 정의) | 남을 수 있는 이상 | |---|---|---|`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S09-jpa-hibernate.md:59](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S09-jpa-hibernate.md:59) — 확인 범위 59–76행.

  발췌: `’’’text EntityManager.find(Order, id)         │         ├─ 1차 캐시에 식별자 존재 → 같은 인스턴스 반환`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-lesson-data.mjs:353](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-lesson-data.mjs:353) — 확인 범위 353–355행.

  발췌: `"id": "cache",     "question": "id가 있는 객체는 이미 영속 상태일까?",     "source": "추가 native Hibernate 7.4.5.Final / H2 2.4.240 / JDK 21 · Boot 4.1.1 BOM만 사용 · 추가 ProbePost42 생성·저장·find",`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/r04-lesson-data.mjs:1817](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/r04-lesson-data.mjs:1817) — 확인 범위 1817–1819행.

  발췌: `{id:'transaction',question:'나중 ROLLBACK은 어느 변경까지 취소할까?',source:scope+' · 추가 r04_extra transaction probe',sourceNote:'이 네 가지는 원문 demo와 다른 추가 작은 테이블입니다. autocommit·명시commit·CHECK3819·통제된 두 연결 교차 실행을 구분합니다.',note:'한 CHECK 오류의 관측을 모든 에러·deadlock의 처리로 일반화하지 않습니다. 교차 실행은 통제된 문장 순서이며 thread 부하시험이나 시간 측정이 아닙니다. '+limits,stages:[  stage('transaction','autocommit','autocommit 성공 뒤 ROLLBACK에도 남음','추가 autocommit_probe id1을 기본autocommit1에서 INSERT한 뒤 ROLLBACK했습니다. observer에도 id1은 남았습니다.','INSERT INTO autocomm`

S08은 표준 isolation 이상과 DB별 차이를 설명한다. S09는 같은 컨텍스트 반복find의 SQL0을 관측하고 observer는 READ_COMMITTED/autocommit으로 고정한다. R04 추가 native MySQL은 두 연결 교차 실행과 rollback을 별도 실험한다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

“같은 값을 두 번 봤다”만으로 REPEATABLE READ를 증명하면 EM 캐시가 가릴 수 있다. 읽은 S09/S08 핵심 흐름에는 em.clear 또는 새컨텍스트/직접 JDBC 비교로 DB 스냅샷과 관리객체를 분리하는 일관된 과제가 없다. DB isolation 자체가 전 저장소에 없다고 판단하지 않는다.

## 실습 수행 가능성과 보완 과제

연결 A가 읽고 B가 commit한 뒤 A에서 find 재호출/clear 후 조회/새 transaction/독립 JDBC를 비교하게 한다. DB 격리수준과 조회 시작 시점을 각 결과에 기록한다.

검증 기대값: 같은 EM의 find SQL0은 DB 재조회 증거가 아니다. 새 transaction 관찰은 B commit값을 확인해야 하며 열린 snapshot의 관찰값은 엔진·isolation·쿼리 유형에 따라 예상표와 대조한다.

선수 관계: C10/C11/C12 → DB isolation 실습

## 검증 수준과 제한

기존실행근거: S09 H2 observer 및 R04 MySQL 교차 관측. 본 통합 비교 이번실행 없음. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 /Users/ds/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `mysql-isolation` — [InnoDB Transaction Isolation Levels — MySQL 8.4 Manual](https://dev.mysql.com/doc/refman/8.4/en/innodb-transaction-isolation-levels.html)
- `mysql-consistent-read` — [Consistent Nonlocking Reads — MySQL 8.4 Manual](https://dev.mysql.com/doc/refman/8.4/en/innodb-consistent-read.html)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
