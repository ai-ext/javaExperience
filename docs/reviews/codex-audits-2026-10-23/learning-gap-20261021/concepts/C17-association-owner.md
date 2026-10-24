# C17. 연관관계 주인 — mappedBy와 FK

판정: **실제 실패·전후값 보강 충분** · 우선순위 **P3** · 확인일 2026-10-21 KST.

## 검사 기준

양방향 Java 참조와 실제 FK쓰기 주체를 구분하고 inverse만 변경한 실패를 SQL/행으로 설명한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P20-jpa-entity-mapping.md:50](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/docs/knowledge/P20-jpa-entity-mapping.md:50) — 확인 범위 50–74행.

  발췌: `### 2.4 연관관계의 주인  FK가 ’order_line.order_id’라면 그 값을 바꾸는 것은 child의 ’OrderLine.order’다.`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p20-lesson-data.mjs:378](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p20-lesson-data.mjs:378) — 확인 범위 378–380행.

  발췌: `"id": "inverse",     "question": "부모 컬렉션에만 넣으면 FK가 채워질까?",     "source": "추가 의도적실패fixture · 원문 OrderLine.order mapping 그대로",`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p20-lesson-data.mjs:286](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/tools/site/p20-lesson-data.mjs:286) — 확인 범위 286–288행.

  발췌: `"id": "ownership",     "question": "addLine과 removeLine은 객체의 어느 쪽을 바꿀까?",     "source": "원문 §2.4 / §3.3 / §3.4 · 원문domain 순수Java 실행",`
- [/Users/ds/code/javaExperience/.worktrees/concept-learning-night/lessons/E4-jpa-associations.md:17](/Users/ds/code/javaExperience/.worktrees/concept-learning-night/lessons/E4-jpa-associations.md:17) — 확인 범위 17–29행.

  발췌: `### 연관관계의 주인 — 외래키 열을 누가 쓰나  ’comment.post_id’ 열은 댓글 테이블에 있다. 이 열과 짝인 자바 필드 ’Comment.post’(’@ManyToOne’)가 **주인**이다. 저장할 때 Hibernate는 주인 필드만 보고 ’post_id’를 채운다.`

P20은 addLine 양쪽 갱신, 순수 Java remove, inverse만 reflection으로 변경한 의도적 실패를 분리한다. null owner PropertyValueException과 부모INSERT 뒤 rollback하여 행0인 기록도 있다. E4가 게시판의 FK관계로 이어준다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

주인 설명·실패 재현은 이미 충분하다. 다만 P20 reflection은 원문 getLines가 불변복사라 의도적으로 우회한 fixture라는 설명을 유지해야 한다. 이것을 학습자 원문에 실제 존재하는 결함으로 오인하면 안 된다.

## 실습 수행 가능성과 보완 과제

E4 게시글→작성자, P20 주문→항목 두 모델에서 owning 필드를 직접 표시하고 helper를 건너뛰었을 때 메모리와 FK 상태를 예측한다.

검증 기대값: P20의 inverse-only는 owner=null, 자식INSERT 없음, rollback 뒤 broken 부모0. 정상 helper에서는 자식 FK가 부모 ID. 예외의 정확한 발생 단계는 설정별로 확인한다.

선수 관계: C07/C10 → C18/C19

## 검증 수준과 제한

기존실행근거: P20 pure Java 및 Hibernate/H2 원시기록. 이번실행 없음. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 /Users/ds/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `jakarta-persistence-spec` — [Jakarta Persistence 3.2 Specification](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.

## 최신 common 기반 추가 실행 결과

메인 담당자가 common 기반의 새 learner 소스를 격리복사해 실행했다. 감사용 4개 테스트가 실패0으로 끝났으며, 실패 현상 자체를 기대값으로 확인한 테스트도 포함하므로 기능 전체 정상 판정이 아니다. 본 담당자는 다음 검사 코드·XML·복사 소스를 읽어 결과 범위를 확인했다.

- [/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/src/test/java/org/example/CommonLearningGapAuditTest.java](/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/src/test/java/org/example/CommonLearningGapAuditTest.java)
- [/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/build/test-results/test/TEST-org.example.CommonLearningGapAuditTest.xml](/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/build/test-results/test/TEST-org.example.CommonLearningGapAuditTest.xml)
- 통합 설명: [/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/03-COMMON-LEARNER-CODE.md](/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/03-COMMON-LEARNER-CODE.md) — 메인 담당자의 완성 보고서를 추가로 읽고 대조했다.

새 기반은 [/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/src/main/java/org/example/domain/entity/TagsEntity.java:14](/Users/ds/research/javaexperience-learning-gap-audit-20261021/runtime/common-learner-project/src/main/java/org/example/domain/entity/TagsEntity.java:14)의 tag.title을 저장하지만 기존 seed에는 tag.name NOT NULL이 있다. XML에 alter table tag add column title 뒤 insert into tag(title), Field name doesn’t have a default value가 기록됐고 비어 있지 않은 태그 저장은 DataIntegrityViolationException으로 실패했다. transaction 뒤 tag 수는 전과 같고 post_txt는0이었다. 이는 현재 실행환경의 **Entity 열 매핑과 기존 스키마 계약 불일치**이며 mappedBy 설명 자체의 오류나 연관관계 이론 부재로 확대하지 않는다. 빈 tags 사례만으로 관계 저장 성공을 판정하지 않는 보완 과제가 필요하다.

common 실행의 DB는 저장소 seed를 사용한 일회용 MySQL이다. 개인 개발 DB의 스키마 변경 여부는 확인하지 않았으므로 개발 DB 전체가 같은 오류라고 단정하지 않는다.
