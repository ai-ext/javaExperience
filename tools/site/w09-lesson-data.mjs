// W09 원문 엔티티·mapper를 사용한 격리 추가 실험이다. 학습자 서버 계측이 아니다.
export const w09AssetRoot = '../design/w09-2026-10-20/images/';
export const W09_SQL = {
  "closedFindSql": [
    "select oe1_0.id,oe1_0.customer_id,oe1_0.status,oe1_0.total from orders oe1_0 where oe1_0.id=?"
  ],
  "closedFailureSql": [],
  "openFindSql": [
    "select oe1_0.id,oe1_0.customer_id,oe1_0.status,oe1_0.total from orders oe1_0 where oe1_0.id=?"
  ],
  "openGetterSql": [
    "select ce1_0.id,ce1_0.email,ce1_0.internalMemo,ce1_0.name from customers ce1_0 where ce1_0.id=?"
  ],
  "entitySerializationSql": [
    "select ce1_0.id,ce1_0.email,ce1_0.internalMemo,ce1_0.name from customers ce1_0 where ce1_0.id=?",
    "select i1_0.order_id,i1_0.id from order_items i1_0 where i1_0.order_id=?"
  ],
  "listRootSql": [
    "select oe1_0.id,oe1_0.customer_id,oe1_0.status,oe1_0.total from orders oe1_0 order by oe1_0.id"
  ],
  "manualMappingSql": [
    "select ce1_0.id,ce1_0.email,ce1_0.internalMemo,ce1_0.name from customers ce1_0 where ce1_0.id=?",
    "select ce1_0.id,ce1_0.email,ce1_0.internalMemo,ce1_0.name from customers ce1_0 where ce1_0.id=?",
    "select ce1_0.id,ce1_0.email,ce1_0.internalMemo,ce1_0.name from customers ce1_0 where ce1_0.id=?"
  ],
  "mapstructRootSql": [
    "select oe1_0.id,oe1_0.customer_id,oe1_0.status,oe1_0.total from orders oe1_0 order by oe1_0.id"
  ],
  "mapstructMappingSql": [
    "select ce1_0.id,ce1_0.email,ce1_0.internalMemo,ce1_0.name from customers ce1_0 where ce1_0.id=?",
    "select ce1_0.id,ce1_0.email,ce1_0.internalMemo,ce1_0.name from customers ce1_0 where ce1_0.id=?",
    "select ce1_0.id,ce1_0.email,ce1_0.internalMemo,ce1_0.name from customers ce1_0 where ce1_0.id=?"
  ],
  "originalSingleProjectionSql": [
    "select oe1_0.id,oe1_0.status,c1_0.name,oe1_0.total from orders oe1_0 join customers c1_0 on c1_0.id=oe1_0.customer_id where oe1_0.id=?"
  ],
  "projectionSql": [
    "select oe1_0.id,oe1_0.status,c1_0.name,oe1_0.total from orders oe1_0 join customers c1_0 on c1_0.id=oe1_0.customer_id order by oe1_0.id"
  ]
};
// 선택한 시안6개를 실제 실행·원문과 대조했다. 현재 구간 focus는 의미 영역을 가리킨다.
export const W09_ASSETS = {
  'W09-session': { file: 'W09-session-v3.jpg', width: 1671, height: 941, ready: true, alt: '추가 H2 실험: Session 종료 뒤 미초기화 고객 접근은 실패하고 추가 ORM SQL은0이다. 별도 JDBC에서는 기존 행을 읽을 수 있고 새 열린 Session의 고객 getter는 추가 조회1로 Mina를 읽는다.', focus: { 'session-find': [1, 17, 41, 24], 'session-closed': [1, 42, 41, 33], 'session-observer': [1, 77, 98, 20], 'session-open': [61, 17, 38, 58] } },
  'W09-serialization': { file: 'W09-serialization-v3.jpg', width: 1672, height: 941, ready: true, alt: '추가 열린Session 직렬화의 전체 종단 관측에서 고객 SQL 다음 항목 SQL이 실행돼 추가 SQL2였다. getter별 중간 장면은 설명용 재구성이며 순환 끝에 StreamConstraintsException으로 완성 JSON을 반환하지 못했다.', focus: { 'serialization-start': [1, 18, 24, 44], 'serialization-customer': [27, 18, 22, 44], 'serialization-items': [50, 18, 21, 44], 'serialization-failed': [71, 18, 28, 69] } },
  'W09-public-contract': { file: 'W09-public-contract-v3.jpg', width: 1672, height: 941, ready: true, alt: '별도 plainCustomer의 Mina·m@example.com·internal-only 세 프로퍼티가 직접 JSON에 나온다. 같은 객체에서 name만 복사한 CustomerPublic은 Mina 하나만 출력한다.', focus: { 'public-entity': [1, 23, 98, 36], 'public-dto': [46, 59, 52, 27] } },
  'W09-query-plan': { file: 'W09-query-plan-v2.jpg', width: 1672, height: 941, ready: true, alt: '추가 주문3개·서로 다른 고객3개·매번 새Session·batch0·L2cache off 실측. 수동과 MapStruct는 목록1+고객3=4 SQL이고 별도 목록 DTO projection은 같은 DTO3개를 SQL1로 읽는다.', focus: { 'query-manual': [1, 21, 33, 67], 'query-mapstruct': [35, 21, 31, 67], 'query-projection': [67, 21, 32, 67] } },
  'W09-projection': { file: 'W09-projection-v4.jpg', width: 1672, height: 941, ready: true, alt: '원문 단건 JPQL을 직접 Hibernate로 실행해 id1·PAID·Mina·12000.00의 OrderSummary를 만든다. 필요한 스칼라4개를 선택하며 Spring Data Repository와 HTTP는 실행하지 않았다.', focus: { 'projection-query': [1, 10, 98, 13], 'projection-result': [1, 24, 70, 43], 'projection-json': [1, 68, 98, 28] } },
  'W09-record': { file: 'W09-record-v3.jpg', width: 1672, height: 941, ready: true, alt: 'OrderSummary와 별개인 추가 ItemList record. 같은 mutable 목록을 참조하면 one에 two를 추가한 변화가 보인다. copyOf 뒤 원본에 three를 추가해도 복사한 목록은 one·two다.', focus: { 'record-shared': [1, 17, 98, 37], 'record-copied': [1, 56, 98, 37] } },
};
const scope = '격리 추가 실험 · Hibernate 7.4.5.Final / H2 2.4.240 / JDK 21 / Jackson 3.1.5 / MapStruct 1.6.3';
const limits = 'MySQL·Boot·OSIV 요청·실제 HTTP·Java 25·Spring Data Repository는 미실행입니다.';
const sqlRows = phase => W09_SQL[phase].map((statement, i) => [phase + '[' + i + '] · 바인딩값 미기록', statement]);
const stage = (id, title, lead, image, code, values, checks = [], sql = [], extra = {}) => ({ id, title, lead, image, code, values, checks, sql, active: [0], ...extra });
const singleJpql = 'select new example.order.OrderSummary(\n    o.id, o.status, c.name, o.total\n)\nfrom OrderEntity o\njoin o.customer c\nwhere o.id = :id';
const summaryJson = '{"id":1,"status":"PAID","customerName":"Mina","total":12000.00}';
export const W09_LESSONS = [
  { id: 'session', question: 'Session이 닫히면 DB 행도 사라질까?', source: scope + ' · W09Proof의 closed/open/observer 실험', note: '추가 fixture의 주문 id=1·PAID·고객 Mina·total=12000.00을 사용합니다. 실패한 것은 닫힌 Session을 통한 지연 초기화입니다. 별도 JDBC 연결의 관찰 SELECT는 ORM SQL 계수와 분리합니다. 각 새 Session 실험을 같은 연결의 연속 상태로 섞지 않습니다. ' + limits, stages: [
    stage('session-find', 'find 뒤 연관은 미초기화', '추가 fixture를 새 Session에서 find했습니다. 주문 본체를 읽어도 LAZY customer와 items는 아직 초기화하지 않았음을 직접 검사했습니다.', 'W09-session', 'detached = session.find(OrderEntity.class, 1L);\nHibernate.isInitialized(detached.getCustomer());\nHibernate.isInitialized(detached.getItems());', [['Java find 인자', 'OrderEntity / 1L'], ['customer / items', '미초기화 / 미초기화'], ['find ORM SQL', '1'], ['DB 관찰과 구분', '아직 연관 초기화 안 함']], ['closed-initial-customer-lazy', 'closed-initial-items-lazy'], sqlRows('closedFindSql'), { active: [0, 1, 2] }),
    stage('session-closed', 'Session 종료 뒤 getter 실패', 'Session이 닫힌 뒤 detached.getCustomer().getName()을 호출했습니다. LazyInitializationException이 나고, 이 실패 과정의 추가 ORM SQL은 0이었습니다.', 'W09-session', '// try-with-resources의 Session 종료 뒤\ndetached.getCustomer().getName();', [['연결 상태', '해당 Hibernate Session 닫힘'], ['실패', 'org.hibernate.LazyInitializationException'], ['추가 ORM SQL', '0'], ['DB 행', '삭제·변경 명령을 보낸 실험 아님']], ['closed-session-lazy-error', 'closed-error-no-query'], [], { active: [1] }),
    stage('session-observer', '별도 JDBC로는 같은 행 관찰', '지연 접근 실패 뒤 별도 JDBC 연결에서 SELECT했습니다. id=1의 주문과 고객 값을 읽었습니다. 이 SELECT는 별도의 실제 조회이며 ORM의 추가 SQL 0에 합치지 않습니다.', 'W09-session', 'select o.id, o.status, o.total, c.name\nfrom orders o join customers c on c.id=o.customer_id\nwhere o.id=1', [['관찰 주체', '별도 JDBC 연결 · Hibernate Session 아님'], ['별도 JDBC 관찰 행', 'id=1 / PAID / Mina / 12000.00'], ['관찰 SELECT', '자체 SELECT 1회 · ORM 계수 밖'], ['앞선 실패 영향', '행은 그대로 관찰됨']], ['closed-independent-observer-row'], [], { active: [0, 1, 2] }),
    stage('session-open', '새 열린 Session에서는 고객 조회', '독립된 새 Session에서 같은 주문을 다시 find했습니다. 초기 고객은 LAZY였고 getName()을 읽으니 Mina와 추가 고객 SELECT 1회를 확인했습니다.', 'W09-session', 'OrderEntity order = session.find(OrderEntity.class, 1L);\nString name = order.getCustomer().getName();', [['이번 Session', '앞선 닫힌 Session과 다른 새 Session'], ['접근 전 customer', '미초기화'], ['getter 결과', 'Mina'], ['추가 ORM SQL', '1 · 초기 find 제외']], ['open-before-customer-lazy', 'open-customer-name', 'open-getter-one-query'], sqlRows('openGetterSql'), { active: [1] }),
  ] },
  { id: 'serialization', question: '엔티티를 JSON으로 쓰다가 SQL도 실행될까?', source: scope + ' · 열린 Session 직렬화 / 별도 plain 순환 실험', note: '전체 writeValueAsString 실행 뒤 entitySerializationSql[0]은 고객, [1]은 항목 SELECT였으며 누계 2입니다. 첫 세 장면은 이 종단 관측과 원문 getter·LAZY 관계를 연결한 설명 구간입니다. 고객과 항목 연관은 둘 다 OrderEntity에서 읽으며 그림의 단계간 화살표는 읽는 순서를 나타냅니다. getter마다 멈춘 줄 계측이 아닙니다. 원시 SQL에는 바인딩값이 기록되지 않았습니다. 별도 plain 순환 객체도 같은 계열 예외를 확인했습니다. ' + limits, stages: [
    stage('serialization-start', '추가 조회를 세기 전', '설명 구간입니다. 독립된 새 열린 Session에서 find한 뒤 sql.clear()로 초기 find를 계수에서 제외했습니다. 원문의 LAZY 연관을 직렬화가 따라가는 시작점을 보여 줍니다.', 'W09-serialization', 'OrderEntity order = session.find(OrderEntity.class, 1L);\nsql.clear();\nmapper.writeValueAsString(order);', [['실행 범위', '독립 새 Session의 직접 Jackson 직렬화'], ['customer / items', 'LAZY · 읽기 전 미초기화 설명'], ['추가 SQL 시작 기준', 'sql.clear() · 초기 find 제외'], ['장면 근거', '전체 실행 종단 사이의 설명 구간']], [], [], { active: [0, 1, 2] }),
    stage('serialization-customer', 'customer를 읽는 연결', '설명 구간입니다. 원문 getter를 따라 고객 값을 읽는 흐름과 전체 실행의 첫 고객 SELECT를 연결했습니다. 이 화면에서 getter 호출 한 줄을 계측한 것은 아닙니다.', 'W09-serialization', '// 원문 OrderEntity의 getter\npublic CustomerEntity getCustomer() { return customer; }\n// 원문 CustomerEntity의 getter\npublic String getName() { return name; }', [['객체 연결', 'OrderEntity.customer → 고객'], ['고객 이름', 'Mina · 추가 fixture 값'], ['SQL 출처', 'entitySerializationSql[0] · 바인딩값 미기록'], ['관측 SQL 누계', '1 · 전체 실행 첫 SQL 기준 설명']], [], sqlRows('entitySerializationSql').slice(0, 1), { active: [1, 3] }),
    stage('serialization-items', 'items를 읽고 order로 돌아가는 연결', '설명 구간입니다. 두 번째 항목 SELECT와 원문의 items → order 관계를 연결합니다. 항목에서 같은 주문을 다시 따라갈 수 있어 그래프가 순환합니다.', 'W09-serialization', '// 원문 OrderEntity\npublic List<OrderItemEntity> getItems() { return items; }\n// 원문 OrderItemEntity\npublic OrderEntity getOrder() { return order; }', [['객체 연결', 'order.items → item.order → 같은 order'], ['SQL 출처', 'entitySerializationSql[1] · 바인딩값 미기록'], ['관측 SQL 누계', '2 · 초기 find 제외'], ['중간값의 범위', '실행 종단에서 재구성 · 줄별 계측 아님']], ['entity-serialization-triggered-query'], sqlRows('entitySerializationSql'), { active: [1, 3] }),
    stage('serialization-failed', '실행 종단: 예외로 완성 실패', '실제 전체 직렬화는 StreamConstraintsException으로 끝났습니다. writeValueAsString이 완성 JSON을 정상 반환하지 못했습니다. 프록시를 제외한 별도 plain 양방향 객체 그래프도 실패했습니다.', 'W09-serialization', 'try { mapper.writeValueAsString(order); }\ncatch (Throwable e) { serializationFailed = true; chain = causes(e); }\n// 별도 plain 그래프 검사: mapper.writeValueAsString(cycle);', [['실측 예외', 'tools.jackson.core.exc.StreamConstraintsException'], ['실측 추가 ORM SQL', '2 · 초기 find 제외'], ['완성 JSON', '없음 · writeValueAsString 정상 반환 실패'], ['별도 plain 순환 검사', 'StreamConstraintsException 계열로 실패']], ['entity-serialization-fails', 'plain-bidirectional-cycle-fails'], sqlRows('entitySerializationSql'), { active: [0, 1, 2] }),
  ] },
  { id: 'public-contract', question: '엔티티 내부 필드가 JSON에 나올까?', source: scope + ' · plainCustomer / CustomerPublic 추가 실험', note: 'DB fixture 고객의 이메일과 섞지 않습니다. 여기의 별도 plainCustomer는 Mina·m@example.com·internal-only를 넣은 원문 CustomerEntity 객체입니다. 조회나 권한 검사를 수행한 객체가 아닙니다. DTO의 공개 필드 선택과 접근 권한 검증은 별도 책임입니다. ' + limits, stages: [
    stage('public-entity', '직접 쓰면 세 프로퍼티 공개', '추가 plainCustomer의 원문 getter 세 개를 Jackson이 읽었습니다. 이름뿐 아니라 이메일과 내부 메모도 실제 JSON에 나왔습니다.', 'W09-public-contract', 'String customerJson = mapper.writeValueAsString(plainCustomer);\n// 원문 getter: getName(), getEmail(), getInternalMemo()', [['객체 구분', '별도 plainCustomer · DB fixture 고객 아님'], ['추가 입력', 'Mina / m@example.com / internal-only'], ['실측 JSON', '{"email":"m@example.com","internalMemo":"internal-only","name":"Mina"}'], ['JSON 프로퍼티 수', '3']], ['direct-customer-internal-visible']),
    stage('public-dto', '같은 객체에서 name만 복사', '별도 CustomerPublic(name) record에 같은 plainCustomer의 이름만 복사했습니다. 직렬화된 JSON은 name 하나이며 이메일·메모가 포함되지 않습니다.', 'W09-public-contract', 'record CustomerPublic(String name) {}\nString publicCustomer = mapper.writeValueAsString(\n    new CustomerPublic(plainCustomer.getName()));', [['원본 객체', '앞 장면의 같은 plainCustomer'], ['공개 DTO', '추가 CustomerPublic · name만'], ['실측 JSON', '{"name":"Mina"}'], ['권한 검증', 'DTO 생성이 자동 수행하지 않음']], ['customer-dto-only-name'], [], { active: [0, 1, 2] }),
  ] },
  { id: 'query-plan', question: '수동·MapStruct·projection은 SQL 수가 같을까?', source: scope + ' · 추가 3주문 목록 비교', note: '주문 3개와 서로 다른 고객 3개를 넣고 각 방법을 새 Session에서 실행했습니다. batch fetch=0, 2차 캐시 비활성화 조건입니다. DTO·MapStruct는 조회 계획을 자동으로 만들지 않습니다. 이 수치를 모든 데이터·설정의 결과로 일반화하지 않습니다. 목록 projection은 원문 단건 JPQL의 별도 목록 변형입니다. ' + limits, stages: [
    stage('query-manual', '수동 매핑도 고객 getter를 읽음', '추가 주문 세 개를 한 번에 읽은 뒤 원문 OrderSummaryMapper.from을 적용했습니다. 서로 다른 고객 이름을 읽는 SELECT 세 번이 더 필요했습니다.', 'W09-query-plan', 'List<OrderEntity> orders = session.createQuery(\n    "from OrderEntity o order by o.id", OrderEntity.class).list();\nsummaries = orders.stream().map(OrderSummaryMapper::from).toList();\n// 원문 mapper: order.getCustomer().getName()', [['추가 fixture', '주문 3개 / 서로 다른 고객 3개'], ['목록 SQL', '1'], ['고객 SQL', '3'], ['총 ORM SQL', '1 + 3 = 4']], ['list-three-orders', 'list-root-one-query', 'manual-three-customer-queries'], [...sqlRows('listRootSql'), ...sqlRows('manualMappingSql')], { active: [2, 3] }),
    stage('query-mapstruct', '생성된 mapper도 같은 getter', '다른 새 Session에서 생성된 OrderSummaryMapStructImpl을 호출했습니다. DTO 값은 수동 매핑과 같고 고객 추가 조회도 세 번이었습니다.', 'W09-query-plan', 'OrderSummaryMapStruct mapping = new OrderSummaryMapStructImpl();\nList<OrderSummary> mapped = orders.stream().map(mapping::toSummary).toList();\n// 실제 생성 코드 발췌\nCustomerEntity customer = orderEntity.getCustomer();\nreturn customer.getName();', [['호출 구현', 'MapStruct 1.6.3 생성 Java 구현'], ['목록 SQL / 고객 SQL', '1 / 3'], ['총 ORM SQL', '1 + 3 = 4'], ['DTO 값 비교', '수동 summaries와 equals = true']], ['mapstruct-values-equal', 'mapstruct-three-customer-queries'], [...sqlRows('mapstructRootSql'), ...sqlRows('mapstructMappingSql')], { active: [0, 1, 3, 4] }),
    stage('query-projection', '목록 projection은 필요한 값 직접 선택', '원문 단건 쿼리와 구분한 추가 목록 변형입니다. 주문·고객을 조인해 DTO 값 네 개만 선택하니 같은 세 DTO를 SQL 한 번으로 읽었습니다.', 'W09-query-plan', 'select new example.order.OrderSummary(o.id, o.status, c.name, o.total)\nfrom OrderEntity o join o.customer c order by o.id', [['쿼리 구분', '추가 목록 variant · 원문 단건 아님'], ['선택 값', 'id / status / customerName / total'], ['DTO 결과', '3개 · 수동 summaries와 equals = true'], ['총 ORM SQL', '1']], ['projection-values-equal', 'projection-one-query'], sqlRows('projectionSql'), { active: [0, 1] }),
  ] },
  { id: 'projection', question: '단건 projection은 무엇을 읽어 DTO로 만들까?', source: scope + ' · 원문 단건 JPQL 직접 실행', note: '원문 생성자 JPQL을 직접 Hibernate에서 실행했습니다. id=1은 추가 fixture 입력이고 선택 스칼라는 네 개입니다. Spring Data Repository 메서드를 실행한 결과가 아닙니다. ' + limits, stages: [
    stage('projection-query', '원문 단건 JPQL의 네 값', '원문 JPQL에 id=1L을 바인딩해 getSingleResult로 읽었습니다. orders·customers에서 id·status·name·total만 선택한 실제 SQL 한 번을 확인했습니다.', 'W09-projection', singleJpql + '\n// 직접 Hibernate: .setParameter("id", 1L).getSingleResult();', [['선택 스칼라', 'o.id / o.status / c.name / o.total'], ['Java 바인딩 입력', 'id = 1L'], ['실행 범위', '직접 Hibernate · Spring Data Repository 미실행'], ['실측 ORM SQL', '1 · SQL에는 ? / 바인딩값 미기록']], ['original-single-projection-one-query'], sqlRows('originalSingleProjectionSql'), { active: [0, 1, 5, 6] }),
    stage('projection-result', '네 값으로 OrderSummary 구성', '원문의 record 생성자 순서와 쿼리의 선택 순서가 대응합니다. 단건 projection 결과는 수동 매핑의 첫 DTO와 equals로 같았습니다.', 'W09-projection', 'public record OrderSummary(Long id, String status, String customerName,\n                           BigDecimal total) {}', [['OrderSummary', 'id=1 / status=PAID / customerName=Mina / total=12000.00'], ['수동 DTO와 비교', 'single.equals(summaries.get(0)) = true'], ['포함하지 않은 값', 'email / internalMemo / customer 객체 / items']], ['original-single-projection-values']),
    stage('projection-json', 'Session 밖에서는 DTO 값만 읽기', '단건 projection으로 얻은 singleProjection을 Session 닫힌 뒤 직접 직렬화했습니다. 추가 ORM SQL은 0이고 JSON 구조는 수동 매핑 DTO와 같았습니다.', 'W09-projection', 'sql.clear();\nString projectionJson = mapper.writeValueAsString(singleProjection);', [['직렬화 대상 실측', '단건 projection singleProjection · Session 닫힌 뒤'], ['실측 JSON', summaryJson], ['추가 ORM SQL', '0'], ['빠진 프로퍼티', 'email / internalMemo / customer / items']], ['dto-values-after-close', 'dto-serialization-no-query', 'dto-excludes-internal-fields', 'projection-serialization-after-close'], [], { note: '단건 projection DTO 자체를 Session 밖에서 직렬화해 추가 ORM SQL 0과 수동 DTO JSON과의 구조 동일성을 확인했습니다. 앞선 수동 DTO도 같은 경계를 별도로 검사했습니다. 제외 프로퍼티 검사는 수동 DTO JSON에 대한 검사이며 두 JSON 구조가 같습니다. ' + limits, active: [0, 1] }),
  ] },
  { id: 'record', question: 'record 안의 List도 자동으로 불변일까?', source: scope + ' · 별도 ItemList 추가 실험', note: 'ItemList(List<String> items)는 원문 OrderSummary와 별개인 추가 record입니다. record는 참조 필드 재대입을 막지만 참조한 mutable 목록의 내용 변경까지 막지 않습니다. List.copyOf는 구조의 얕은 복사이며 요소 객체까지 복제하지 않습니다. 이 두 상태는 DB·주문항목의 실험이 아닙니다.', stages: [
    stage('record-shared', '같은 mutable 목록을 공유', '별도 ArrayList에 one을 넣어 ItemList에 전달했습니다. original에 two를 추가하면 같은 목록을 가리키는 shallow.items()에서도 두 값이 보였습니다.', 'W09-record', 'record ItemList(List<String> items) {}\nList<String> original = new ArrayList<>(List.of("one"));\nItemList shallow = new ItemList(original);\noriginal.add("two");', [['초기 original', '[one]'], ['참조 연결', 'original과 shallow.items() → 같은 mutable 목록'], ['original / shallow.items()', '[one, two] / [one, two]']], ['record-shallow-change'], [], { active: [2, 3] }),
    stage('record-copied', '복사 뒤 원본만 three 추가', '현재 one·two 목록을 List.copyOf로 복사해 다른 ItemList에 넣었습니다. 원본에 three를 추가해도 copied.items()는 두 값을 유지했습니다.', 'W09-record', 'ItemList copied = new ItemList(List.copyOf(original));\noriginal.add("three");', [['original', '[one, two, three]'], ['copied.items()', '[one, two]'], ['얕은 복사의 범위', '목록 구조 · 요소까지 복제 아님']], ['record-copy-stays-two'], [], { active: [0, 1] }),
  ] },
];
