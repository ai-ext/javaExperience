# C07. Entity·값 객체·DTO — 식별성과 불변식

판정: **정의 있음·한 모델 연결 약함** · 우선순위 **P2** · 확인일 2026-10-21 KST.

## 검사 기준

같은 데이터가 식별자 기반 엔티티, 값 동등성 객체, 외부 DTO에서 어떤 변경 규칙을 갖는지 모델로 설명한다. 이 기준은 사용자의 실무 연결 학습 목적과 저장소 intent.md에서 도출했다. 특정 연차 전체에 적용되는 보편 필수 표준이나 학습자 개인 역량 판정이 아니다.

## 확인한 자료와 실제 커버리지

- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/S22-architecture-ddd.md:27](../../../../knowledge/S22-architecture-ddd.md) — 확인 범위 27–40행.

  발췌: `| 용어 | 의미 | 코드에서 보이는 형태 | |---|---|---| | 도메인 | 해결하려는 업무의 문제 영역과 규칙 | 주문, 재고, 환불 정책 | | 유비쿼터스 언어 | 기획자·개발자·코드가 공유하는 업무 단어 | ’confirm’, ’Refundable’, ’Reservation’ |`
- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/S22-architecture-ddd.md:129](../../../../knowledge/S22-architecture-ddd.md) — 확인 범위 129–175행.

  발췌: `### 예제 1 — 풍부한 애그리거트와 값 객체  다음은 Java 21에서 실행한 순수 Java 예제다. ’Order’가 상태 변경과 한도 불변식을 소유하고 ’Money’가 산술을 소유한다. ’OrderConfirmed’는 루트가 발행한 도메인 이벤트의 최소 형태다.`
- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/P20-jpa-entity-mapping.md:7](../../../../knowledge/P20-jpa-entity-mapping.md) — 확인 범위 7–17행.

  발췌: `## 1. 한 줄로 말하면  JPA 엔티티는 ’@Entity’가 붙은 non-final 클래스이며, public/protected 무인자 생성자, ’@Id’, persistent 필드를 가진다. 연관관계는 객체 참조를 외래 키로 매핑하는 선언이다. 엔티티를 API 응답으로 직접 반환하면 지연 로딩, 순환 JSON, 내부 필드 노출이 생기므로 DTO로 경계를 둔다.`
- [$WORKTREE_ROOT/concept-learning-night/docs/knowledge/W09-why-dto.md:17](../../../../knowledge/W09-why-dto.md) — 확인 범위 17–25행.

  발췌: `## 2. 짧은 답  - 엔티티는 영속성 컨텍스트가 추적하는 도메인·DB 모델이고, DTO는 호출 경계에 필요한 값을 전달하는 모양이다. - 요청 DTO는 클라이언트가 제출할 값만 받고, 응답 DTO는 외부에 공개할 값만 담는다. 내부 DTO/Command는 외부 JSON 계약이 아니라 애플리케이션 유스케이스·모듈 사이에 별도 모양이 필요할 때 둔다.`

S22는 Entity/ValueObject/Aggregate의 정의와 Money/ProductId/Order 순수 Java 예제를 제공한다. P20은 JPA 매핑, W09는 요청·응답·Command 목적을 구분한다.

검토한 주제 원문 Markdown은 main과 바이트 동일하다. 최신 학습 보강은 별도 tools/site 모듈 및 생성 HTML에 있으므로 main만 읽은 결론으로 대체하지 않았다.

## 부족하거나 서로 어긋난 지점

각 문서의 Order 모델이 다르고 값 객체를 JPA 필드·DB 열·DTO로 이어 비교하는 입문 과제는 약하다. “Entity는 테이블 한 행”을 정의의 전부로 배운 뒤 비영속 엔티티와 값 객체를 구분할 때 간극이 있다. S22가 전혀 없다고 보고하면 안 된다.

## 실습 수행 가능성과 보완 과제

게시글 제목 혹은 금액 하나를 값 객체로 분리하는 설계 문제를 제시하되 실제 구현은 별도 요청 범위로 둔다. 식별자 같음/값 같음/같은 객체의 세 관계를 표로 작성하게 한다.

검증 기대값: 같은 ID·변경된 제목은 같은 업무 엔티티, 같은 금액은 값 동등성 후보, 새 DTO는 응답 스냅샷임을 구분한다. 값 객체 검증 실패가 DB 접근 전에 발생하는 케이스를 단언한다.

선수 관계: Java equals/record → C24 → C08/C17

## 검증 수준과 제한

기존실행근거: S22 순수 Java 출력. JPA 값 객체 end-to-end 실행은 본 감사에서 확인하지 않음. 이번실행 없음. 이 감사 담당자는 저장소 수정·빌드·테스트·서버 실행을 하지 않았다. 정적확인과 기존 실행기록을 읽은 결과이며, 학습자 TODO/미완성 코드를 제품 결함으로 채점하지 않았다. 다른 담당자의 이번 실행은 전체 감사의 별도 runtime 보고서에서 확인한다. 하단 source-id에 연결한 일반 기술계약은 별도 Luna 공식출처 조사에서 확인한 근거를 따른다. 각 프로젝트 설정·드라이버·실행 시점에 따른 결과는 별도 실행 확인 사항이며, 이 문서의 미실행 표시는 그 환경별 검증에 적용한다.

## 공식 근거 연결

아래는 별도 Luna 조사에서 수집한 공식근거의 적용 지점이다. 이 담당자가 웹을 다시 조회한 결과는 아니며 출처의 적용한계는 $USER_HOME/research/javaexperience-learning-gap-audit-20261021/sources/SOURCES.md에서 확인한다.

- `jakarta-persistence-entity-class` — [Jakarta Persistence 3.2 Entity Class Requirements](https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html#the-entity-class)

발췌 표기 안내: 위 짧은 발췌는 줄바꿈을 공백으로 합치고 Markdown backtick을 표시용 따옴표로 정리했다. 바이트 단위 인용본은 아니며 정확한 원문은 연결한 파일·행과 SCOPE-MANIFEST.json의 SHA를 기준으로 한다.
