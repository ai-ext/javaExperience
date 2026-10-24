# 메인 심층 검토: DTO·Entity·Value Object를 왜 나누는가

확인일: 2026-10-21. 사용자의 질문은 용어 정의를 외우는 것이 아니라 '현재 만들 클래스는 무엇이며 어디서 사용해야 하는가'를 결정할 수 있는지다.

## 실제 자료에서 이미 설명하는 내용

- W09는 요청/응답 DTO, 내부 Command, 수동 매핑, MapStruct, DTO/인터페이스 프로젝션을 비교한다. Entity 직접 응답의 지연 로딩·순환·내부 필드 노출·API 계약 결합, DTO만으로 N+1이 해결되지 않는 점도 설명한다.
- P20은 Entity 필드/관계와 테이블, DTO 응답과 lazy 경계 등을 설명한다.
- S22는 Entity의 식별성, Value Object의 값/제약, 애그리거트 경계를 설명한다. Money/ProductId와 주문 규칙 예제를 포함한다.
- J02는 equals/hashCode/compareTo, 불변성·방어적 복사 등 값 객체 이해에 필요한 토대를 다룬다.

따라서 'DTO 또는 VO 개념이 없다'고 하면 부정확하다. 부족한 부분은 여러 문서에 흩어진 내용을 같은 요청과 동일한 값으로 연결하는 입문 경로다.

## 입문자가 구분해야 할 서로 다른 역할

| 질문 | 판단해야 하는 역할 | 오해하지 말아야 할 점 |
|---|---|---|
| 클라이언트가 어떤 값을 제출할 수 있나? | 요청 DTO | Entity의 모든 필드를 입력으로 허용하지 않음 |
| 같은 객체라고 판단하는 기준이 지속 식별자인가? | 도메인 Entity | JPA Entity 어노테이션과 DDD Entity 역할은 같은 분류가 아님 |
| 값과 불변식으로 의미를 표현하나? | Value Object | 무조건 DB에 저장되지 않는 타입이라는 뜻이 아님 |
| 외부에 어떤 형태의 값을 공개하나? | 응답 DTO | Entity를 복사하면 쿼리 비용까지 자동 해결되는 것은 아님 |
| 어떤 필드를 DB에서 선택해 읽나? | 프로젝션 | DTO를 조회 결과로 직접 만들 수 있어 조회마다 Entity 전체가 필요하지 않음 |

역할을 정한 뒤 record/class, 생성자, `@Embeddable`, JPA 매핑 등을 고른다. 단순히 필드가 같거나 class 이름에 DTO/VO를 붙였다고 역할이 완성되지 않는다.

## 저장 경로의 추가 과제

요청 DTO를 그대로 Entity로 복사하는 것과 유효한 업무 객체를 만드는 과정을 구별해야 한다.

1. 요청에서 허용한 제목·내용·태그를 받는다.
2. 작성자/권한은 인증 정보, 게시판/태그는 DB 조회, 생성 시각은 서버에서 얻는다.
3. 도메인 규칙에 맞춰 객체를 생성하거나 기존 관리 객체를 변경한다.
4. Service 트랜잭션에서 Repository/EntityManager로 상태를 저장한다.
5. 외부에 공개할 결과만 DTO로 구성한다.

사용자가 보낸 authorId/role/가격을 무조건 복사하는 사례, 값 객체 생성이 실패한 사례, 동일 데이터의 생성과 수정 경로를 비교하는 실습이 필요하다. API DTO와 도메인 타입을 나눈다고 모든 계층에 똑같은 타입을 무조건 복제하는 과잉 설계도 정답으로 가르치지 않는다.

## 시각적으로 보여 줘야 하는 장면

- 같은 요청의 '클라이언트 제출값 / 인증에서 얻는 값 / DB에서 찾는 값 / 서버가 만드는 값'을 서로 다른 출처로 표시한다.
- DTO → Service → Entity/VO → 관리 상태 → SQL → DB 행 → 응답 DTO를 같은 데이터로 이어 준다. 화살표마다 단순 복사인지 조회·검증·생성인지 표시한다.
- Entity 직접 반환과 DTO 반환을 같은 객체 그래프로 비교한다. 내부 필드, 양방향 참조, lazy getter, JSON 결과의 차이를 보여 준다.
- VO의 동등성은 같은 값/다른 식별자 사례와 바꿔 본다. BigDecimal scale, 통화·단위·시간대 같은 의미 규칙이 아직 정해지지 않았다면 'record라서 올바른 값 객체'라고 평가하지 않는다.
- 목록 조회의 DTO 프로젝션은 Entity 전체 조회 후 매핑과 선택 열/쿼리 수를 구별한다.

현재 S22의 Money 예제는 주문 한도·산술을 보여 주는 최소 예제다. 통화·반올림·scale 동등성 등 모든 금액 도메인을 다루는 완성 타입이라고 확대 해석하지 않는다. 이 확장은 현재 코드가 무조건 잘못됐다는 판정이 아니라 값 객체 설계를 선택하는 후속 과제다.

## 현재 발견 경로

실제 Chrome 검색에서 `DTO`는 P16/W09 등7개, `value object`는0개, `값 객체`는7개가 나왔다. 기술명 표기와 자연어 표현을 연결하지 않으면 내용이 있어도 찾을 수 없다. '요청으로 받은 필드를 전부 저장해도 되나', '같은 값을 담은 두 객체는 왜 다르다고 나오나', '응답에 DB 내부 필드가 왜 나오나'를 시작 질문으로 연결해야 한다.

원문: /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/docs/knowledge/W09-why-dto.md, /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/docs/knowledge/P20-jpa-entity-mapping.md, /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/docs/knowledge/S22-architecture-ddd.md, /Users/ds/code/javaExperience/.worktrees/concept-census-20261021/docs/knowledge/J02-oop-object-contracts.md.
