# C20. Repository.save·쿼리 — 상태판단과 SQL 계약

판정: **설명 풍부·save 일반화 경계 필요** · 우선순위 **P2** · 확인일 2026-10-21 KST.

## 검사 기준

Repository 메서드명이 곧 SQL 한 문장이라는 오해를 버리고 persist/merge 선택·조회조건·count 정확성을 검증한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S10-spring-data-query.md:44](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/S10-spring-data-query.md:44) — 확인 범위 44–74행.

  발췌: `### 리포지토리 메서드는 SQL로 바로 치환되지 않는다  시작 시 저장소 팩토리가 메타데이터를 읽어 프록시를 만든다. CRUD는 기본 구현으로 위임하고, 쿼리 메서드는 선언 쿼리를 찾거나 이름을 분석한다. JPA 파생 쿼리는 속성 경로와 키워드로 JPQL을 만들며, 실행 시 JPA 구현체가 SQL로 변환해 JDBC로 전달한다.`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/lessons/E7-jpa-update-delete.md:211](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/lessons/E7-jpa-update-delete.md:211) — 확인 범위 211–237행.

  발췌: `### ④ ’@Transactional’ 없이 ’save’를 부르면  ’’’text SQL: select lp1_0.id,…,lp1_0.view_count from lesson_post lp1_0 where lp1_0.id=?        ← findById`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/lessons/E7-jpa-update-delete.md:331](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/lessons/E7-jpa-update-delete.md:331) — 확인 범위 331–400행.

  발췌: `### ⑪~⑭ 벌크 수정 — ’@Modifying’  "게시판 2의 글 조회수를 전부 +1"을 변경 감지로 하면 글마다 읽고 ’UPDATE’가 한 줄씩 나간다. ’UPDATE’ 한 번으로 끝내려면 저장소에 직접 쓴다.`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-lesson-data.mjs:754](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/s09-lesson-data.mjs:754) — 확인 범위 754–756행.

  발췌: `"id": "merge",     "question": "merge는 원본을 managed로 바꿀까?",     "source": "추가 native Hibernate 7.4.5.Final / H2 2.4.240 / JDK 21 · Boot 4.1.1 BOM만 사용 · 추가 ProbePost42 detached 원본과 반환 객체",`

S10은 생성 프록시→기본구현/파생쿼리→EM→Hibernate→JDBC 경로, countQuery·정렬·projection 선택을 제공한다. E7은 bulk update/clearAutomatically/flushAutomatically와 오래된 관리객체 문제까지 실제 로그로 보여 준다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

E7 222행 “id가 있는 객체면 이미 있는 행으로 보고 merge”는 그 예제의 조건 설명이지만 새 엔티티판단 전체처럼 읽힐 여지가 있다. nullable version·Persistable·assigned ID를 S09의 id42 new와 이어 비교하는 과제가 확인되지 않는다. bulk가 없다는 공백 판정은 부정확하다.

## 실습 수행 가능성과 보완 과제

동일 모델을 IDENTITY 신규/assigned id 신규/nullable version/Persistable 선언으로 분리해 save 반환 동일성과 SELECT/INSERT/UPDATE를 기록하도록 설계한다. 필요성은 사용자 프로젝트의 ID 전략에 따라 우선순위를 조절한다.

검증 기대값: 객체에 ID가 있다는 사실만으로 기존 DB행/managed 상태를 단정하지 않는다. save 분기 기대값은 실제 Spring Data 버전의 새 상태판단 규칙과 대조하고 DB 최종행 및 반환 참조를 함께 확인한다.

선수 관계: C10/C11 → 쿼리 실습

## 검증 수준과 제한

기존실행근거: E7 MySQL로그·S09 merge. 새 상태판단 확장 이번실행 없음. 새 상태판단은 spring-data-new-state 공식근거로 확인했다. ID뿐 아니라 nullable version 및 Persistable의 isNew 전략을 고려한다. 본 과제의 각 전략별 SQL 비교 실행은 미실행이다. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 /Users/ds/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `spring-data-new-state` — [Entity State Detection Strategies — Spring Data JPA Reference](https://docs.spring.io/spring-data/jpa/reference/data-commons/is-new-state-detection.html)
- `spring-data-derived-delete` — [Spring Data JPA 4.1.1 Query Methods](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
