# C11. dirty checking·flush·commit — 같은 값의 시점

판정: **보강 충분·입문 문장 조건 연결 필요** · 우선순위 **P2** · 확인일 2026-10-21 KST.

## 검사 기준

Java값/loadedState/같은 연결 행/별도 연결 행을 구분하고 flush가 commit이 아님을 결과로 설명한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [$WORKTREE_ROOT/concept-learning-night/lessons/E7-jpa-update-delete.md:9](../../../../../lessons/E7-jpa-update-delete.md) — 확인 범위 9–17행.

  발췌: `> **트랜잭션 안에서 읽어 온 엔티티의 값을 바꾸면, 트랜잭션이 끝날 때(커밋) Hibernate가 ’UPDATE’를 보낸다.**  이걸 **변경 감지**(dirty checking)라고 한다. 순서는 이렇다.`
- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/S09-jpa-hibernate.md:74](../../../../knowledge/S09-jpa-hibernate.md) — 확인 범위 74–76행.

  발췌: `영속성 컨텍스트는 ’(타입, 식별자)’마다 관리 인스턴스를 하나 둔다. 같은 컨텍스트의 두 번째 ’find()’는 캐시 객체를 줄 수 있지만, 컨텍스트 종료 후 공유되는 애플리케이션 캐시는 아니다.  ’persist()’와 변경은 쓰기 지연될 수 있다. ’FlushModeType.AUTO’이면 커밋 전, 결과와 겹치는 JPQL/HQL 실행 전 또는 명시적 ’flush()’에서 DML을 동기화한다. IDENTITY 생성 등은 더 일찍 INSERT가 필요할 수 있다. dirty checking은 현재 상태를 조회 당시 스냅샷과 비교한다. flush 후에도 트랜잭션은 rollback될 수 있으므로 flush는 커밋이 아니다.`
- $WORKTREE_ROOT/concept-learning-night/tools/site/s09-lesson-data.mjs:576 (기록 경로: `$WORKTREE_ROOT/concept-learning-night/tools/site/s09-lesson-data.mjs:576`) — 확인 범위 576–578행.

  발췌: `"id": "flush",     "question": "Java 값·loadedState·DB 행은 언제 같아질까?",     "source": "추가 native Hibernate 7.4.5.Final / H2 2.4.240 / JDK 21 · Boot 4.1.1 BOM만 사용 · 추가 ProbePost42 변경·commit / 별도 rollback DB",`
- $WORKTREE_ROOT/concept-learning-night/tools/site/s09-lesson-data.mjs:1300 (기록 경로: `$WORKTREE_ROOT/concept-learning-night/tools/site/s09-lesson-data.mjs:1300`) — 확인 범위 1300–1302행.

  발췌: `"id": "auto",     "question": "AUTO flush는 모든 조회 전에 UPDATE할까?",     "source": "추가 native Hibernate 7.4.5.Final / H2 2.4.240 / JDK 21 · Boot 4.1.1 BOM만 사용 · 별도 s09_auto DB · 추가 ProbePost42와 원문 PurchaseOrder",`

S09 추가 화면은 setter SQL0, flush UPDATE1와 version 변경, observer 옛값, commit 새값, rollback 뒤 DB만 복구되고 Java값은 남음을 비교한다. AUTO의 관련/무관 HQL 공간 차이도 관측한다. P20은 IDENTITY가 persist 중 INSERT하는 예외를 다룬다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

E7 첫 설명의 “트랜잭션 하나에 하나씩”과 “커밋되기 직전”을 모든 컨텍스트·flush에 일반화하지 않게 S09 AUTO/명시flush/OSIV 조건을 바로 연결할 필요가 있다. flush/commit 설명 자체가 없거나 전부 상자그림이라는 평가는 틀리다.

## 실습 수행 가능성과 보완 과제

같은 엔티티 수정 뒤 관련 HQL·무관 HQL·명시flush·rollback의 순서를 바꾸고 예측표를 작성하게 한다. Java 값은 rollback 후 새로 읽은 DB 값과 반드시 나란히 기록한다.

검증 기대값: 기존 S09 fixture는 setter0, 관련 HQL 앞 UPDATE, 무관 HQL에서는 UPDATE 없음. rollback DB는 첫 글/version0이지만 같은 Java객체는 수정된 글/version1. 이 결과를 모든 native SQL/flushmode로 확대하지 않는다.

선수 관계: C09/C10 → C12/C16

## 검증 수준과 제한

기존실행근거: S09 및 P20 원시 JSON. 이번실행 없음. E7 로그도 기존실행 기록이며 현 환경 재현으로 표시하지 않음. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 $USER_HOME/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `jakarta-entitymanager-api` — [EntityManager API Javadoc](https://jakarta.ee/specifications/persistence/3.2/apidocs/jakarta.persistence/jakarta/persistence/EntityManager.html)
- `hibernate-7-4-user-guide` — [Hibernate ORM 7.4 User Guide](https://docs.hibernate.org/orm/7.4/userguide/html_single/)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
