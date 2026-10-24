# C24. Entity equals/hashCode·값 동등성·record 얕은 불변

판정: **경고 있음·엔티티 계약 검증 약함** · 우선순위 **P2** · 확인일 2026-10-21 KST.

## 검사 기준

객체 identity, 엔티티 ID, 값 동등성, HashSet 안정성을 분리하고 proxy/ID할당 시점에 따른 동작을 설명한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/P20-jpa-entity-mapping.md:82](../../../../knowledge/P20-jpa-entity-mapping.md) — 확인 범위 82–86행.

  발췌: `JPA 기본 fetch는 ’@ManyToOne’·’@OneToOne’가 EAGER, 컬렉션이 LAZY다. 기본값은 모든 연관에 ’LAZY’를 명시하고 필요한 관계만 가져오는 것이다.  Lombok ’@Data’는 쓰지 않는다. equals/hashCode/toString이 연관관계를 순회해 순환·지연 로딩·프록시 문제를 만든다. generated ID가 null일 때도 안전한 팀 표준을 정한다.`
- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/P20-jpa-entity-mapping.md:363](../../../../knowledge/P20-jpa-entity-mapping.md) — 확인 범위 363–365행.

  발췌: `### Q5. 왜 ’@Data’를 피하나? equals/hashCode/toString이 연관관계를 순회해 순환·지연 로딩·프록시 문제를 만든다. 필요한 메서드만 작성한다. 꼬리질문: generated ID equals는? → null·hash 안정성을 고려한다.`
- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/S22-architecture-ddd.md:153](../../../../knowledge/S22-architecture-ddd.md) — 확인 범위 153–159행.

  발췌: `record ProductId(String value) {}     record Money(BigDecimal value) {         Money(String value) { this(new BigDecimal(value)); }         Money add(Money other) { return new Money(value.add(other.value)); }`
- $WORKTREE_ROOT/concept-learning-night/tools/site/w09-lesson-data.mjs:83 (기록 경로: `$WORKTREE_ROOT/concept-learning-night/tools/site/w09-lesson-data.mjs:83`) — 확인 범위 83–85행.

  발췌: `{ id: 'record', question: 'record 안의 List도 자동으로 불변일까?', source: scope + ' · 별도 ItemList 추가 실험', note: 'ItemList(List<String> items)는 원문 OrderSummary와 별개인 추가 record입니다. record는 참조 필드 재대입을 막지만 참조한 mutable 목록의 내용 변경까지 막지 않습니다. List.copyOf는 구조의 얕은 복사이며 요소 객체까지 복제하지 않습니다. 이 두 상태는 DB·주문항목의 실험이 아닙니다.', stages: [     stage('record-shared', '같은 mutable 목록을 공유', '별도 ArrayList에 one을 넣어 ItemList에 전달했습니다. original에 two를 추가하면 같은 목록을 가리키는 shallow.items()에서도 두 값이 보였습니다.', 'W09-record', 'record ItemList(List<Str`

P20은 Lombok Data와 generated ID null/hash 안정성을 경고한다. S22는 record Money/ProductId, 최신 W09는 mutable List가 들어간 record와 List.copyOf의 얕은 복사를 별도 실험한다. equals/불변성 언급이 없다는 평가는 맞지 않는다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

P20의 “팀 표준을 정한다”에서 어떤 계약을 실제로 검증할지 연결이 약하다. ID할당 전후 HashSet에서 사라지는 사례와 detached/별도 EM동일 ID/proxy 비교의 판단과제가 읽은 매핑 경로에서는 제공되지 않는다. Money의 BigDecimal 값/scale 동등성 또한 업무정책을 명시할 필요가 있다.

## 실습 수행 가능성과 보완 과제

선택한 엔티티 동일성 정책을 먼저 문장으로 정한 뒤 new→persist→detach 과정의 equals/hashCode/Set.contains를 비교하는 과제를 낸다. Money 1.0/1.00 비교는 금액 정책과 record 기본동작을 구분한다.

검증 기대값: HashSet에 넣은 뒤 ID 할당으로 예상치 못한 검색 실패가 없는지 정책별 검증한다. 같은 DB ID 객체의 비교와 ==는 다를 수 있음을 설명한다. 모든 프로젝트에 하나의 equals 구현을 정답으로 강요하지 않는다.

선수 관계: Java 객체계약 → C07/C10 → C17

## 검증 수준과 제한

기존실행근거: W09 record/List 추가실험, S22 순수Java. 엔티티 identity 정책 검증 이번실행 없음. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 $USER_HOME/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `jakarta-persistence-spec` — [Jakarta Persistence 3.2 Specification](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html)

추가 본문 확인: $WORKTREE_ROOT/concept-learning-night/docs/knowledge/J02-oop-object-contracts.md:58–104는 equals/hashCode/정렬 계약과 가변 키 문제를 이미 상세히 설명한다. $WORKTREE_ROOT/concept-learning-night/docs/knowledge/J01-types-string.md:68–72도 BigDecimal scale 차이를 설명한다. 남는 공백은 일반 Java 계약 설명의 부재가 아니라 P20 generated ID/proxy 상태로의 적용 실험이다.

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
