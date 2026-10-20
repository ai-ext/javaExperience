import { renderJpaFocused } from './jpa-focused.mjs';
import { renderMybatisFocused } from './mybatis-focused.mjs';
import { renderTxWhyFocused } from './tx-why-focused.mjs';
import { renderTxLifecycleFocused } from './tx-lifecycle-focused.mjs';
import { renderEventScenes, renderCacheScenes, renderAuthScenes } from './concept-scenes.mjs';

const ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ESCAPE[ch]);
const textOnly = (html) => html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

const GROUPS = {
  B: ['Backend fundamentals', '서버·네트워크·개발 환경'], D: ['Delivery & operations', '개발 도구·배포·운영'],
  J: ['Java language', 'Java 문법·런타임·자료구조'], P: ['Practical backend', 'Spring·DB를 직접 구현하는 실습'],
  R: ['Relational database', 'SQL·스키마·인덱스'], S: ['Spring framework', 'Spring의 실행 흐름과 기능'],
  V: ['Verification & tests', '계층별 테스트와 검증'], W: ['Why & decisions', '선택 이유와 설계 기준'],
};

/** Render a per-document map from its real h2 headings and generated anchors. */
export function renderKnowledgePageVisual(abs, html) {
  const id = abs.split('/').at(-1).match(/^([A-Z]\d{2})-/)?.[1] || '';
  if (!id) return '';
  const headings = [...html.matchAll(/<h2\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)]
    .map((match) => ({ id: match[1], label: textOnly(match[2]).replace(/^#\s*/, '') }));
  if (!headings.length) return '';
  const [group, description] = GROUPS[id[0]] || ['Backend knowledge', '백엔드 공부자료'];
  const steps = headings.map((heading, index) => `<a class="knowledge-page-step" href="#${esc(heading.id)}"><span class="knowledge-page-step-no">${String(index + 1).padStart(2, '0')}</span><span>${esc(heading.label)}</span><span class="knowledge-page-step-arrow" aria-hidden="true">↘</span></a>`).join('');
  const concept = id === 'S09'
    ? renderJpaFocused() + `<details class="jpa-focus-deep"><summary>객체·스냅샷·SQL·DB 전체 시뮬레이션 펼치기</summary>${renderJpaConcept(id)}</details>`
    : id === 'W04' ? renderMybatisFocused() : id === 'W11' ? renderTxWhyFocused() : id === 'S08' ? renderTxLifecycleFocused()
      : id === 'S14' ? renderEventScenes() : id === 'W23' ? renderCacheScenes() : id === 'S12' ? renderAuthScenes() : renderJpaConcept(id);
  const entityTable = id === 'P20' ? renderP20EntityTable() : '';
  const map = `<section class="knowledge-page-map" aria-label="문서 읽기 지도"><div class="knowledge-page-map-head"><div><p class="knowledge-page-map-kicker">${esc(group)} <span>· ${esc(id)}</span></p><h2>이 문서에서 볼 내용</h2><p>${esc(description)}</p></div><span class="knowledge-page-map-count">${headings.length}개 주제</span></div><nav class="knowledge-page-steps" aria-label="문서의 실제 절로 이동">${steps}</nav></section>`;
  return `${entityTable}${concept}${id === 'S09' ? `<details class="jpa-focus-deep"><summary>원문 절 목록 보기</summary>${map}</details>` : id === 'W04' ? `<details class="mybatis-focus-deep"><summary>원문 절 목록 보기</summary>${map}</details>` : id === 'W11' ? `<details class="tx-why-map"><summary>원문 절 목록 보기</summary>${map}</details>` : id === 'S08' ? `<details class="tx-life-map"><summary>원문 절 목록 보기</summary>${map}</details>` : ['S14', 'W23', 'S12'].includes(id) ? `<details class="concept-original-map"><summary>원문 절 목록 보기</summary>${map}</details>` : map}`;
}

/** 원문의 제목과 코드를 보존하면서 공부자료 본문을 순서대로 펼쳐 읽게 한다. */
export function renderKnowledgePageSections(html) {
  const headings = [...html.matchAll(/<h2\b[^>]*id="[^"]+"[^>]*>[\s\S]*?<\/h2>/g)];
  if (!headings.length) return html;
  const before = html.slice(0, headings[0].index);
  const cards = headings.map((match, index) => {
    const next = headings[index + 1]?.index ?? html.length;
    const section = transformVersionTables(html.slice(match.index + match[0].length, next));
    const id = match[0].match(/\bid="([^"]+)"/)?.[1] || `knowledge-section-${index + 1}`;
    const title = textOnly(match[0]).replace(/^#\s*/, '');
    const subtopics = [...section.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/g)]
      .map((part) => textOnly(part[1]).replace(/^#\s*/, '')).filter(Boolean).slice(0, 4);
    const codeCount = (section.match(/<pre\b/g) || []).length;
    const topics = [...section.matchAll(/<h3\b[^>]*id="([^"]+)"[^>]*>[\s\S]*?<\/h3>/g)];
    const introduction = topics.length ? section.slice(0, topics[0].index) : section;
    const topicCards = topics.map((topic, topicIndex) => {
      const end = topics[topicIndex + 1]?.index ?? section.length;
      const body = section.slice(topic.index + topic[0].length, end);
      const label = textOnly(topic[0]).replace(/^#\s*/, '');
      return `<details class="knowledge-topic"><summary id="${esc(topic[1])}" aria-label="${esc(label)} 펼치기"><span class="knowledge-topic-no">${String(topicIndex + 1).padStart(2, '0')}</span><strong role="heading" aria-level="3">${esc(label)}</strong><span aria-hidden="true">↘</span></summary><div class="knowledge-topic-body">${body}</div></details>`;
    }).join('');
    return `<details class="knowledge-chapter"><summary id="${esc(id)}" aria-label="${esc(title)} 펼치기"><span class="knowledge-chapter-number">${String(index + 1).padStart(2, '0')}</span><span class="knowledge-chapter-heading"><strong role="heading" aria-level="2">${esc(title)}</strong>${subtopics.length ? `<small>${subtopics.map(esc).join(' · ')}</small>` : ''}</span><span class="knowledge-chapter-meta">${codeCount ? `${codeCount}개 코드 · ` : ''}열기 ↓</span></summary><div class="knowledge-chapter-body">${introduction}${topicCards}</div></details>`;
  }).join('');
  return `${before}<div class="knowledge-chapters" aria-label="공부자료 내용 펼쳐 읽기">${cards}</div><script>
(() => {
  const reveal = (hash) => {
    if (!hash || hash.length < 2) return;
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    let parent = target?.closest('details.knowledge-topic, details.knowledge-chapter');
    while (parent) {
      parent.open = true;
      parent = parent.parentElement?.closest('details.knowledge-topic, details.knowledge-chapter');
    }
    if (target) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  };
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (link) reveal(link.getAttribute('href'));
  });
  window.addEventListener('hashchange', () => reveal(location.hash));
  reveal(location.hash);
})();
</script>`;
}

/** 버전 비교 표는 내용을 유지한 채 배경과 실무 영향을 나눈 카드로 보여 준다. */
export function transformVersionTables(section) {
  return section.replace(/<div class="table-wrap"><table>([\s\S]*?)<\/table><\/div>/g, (whole, table) => {
    const rows = [...table.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((row) =>
      [...row[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/g)].map((cell) => cell[1].trim()));
    if (rows.length < 3 || rows[0].length !== 3 || rows.slice(1).some((row) => row.length !== 3)) return whole;
    const headers = rows[0].map((cell) => textOnly(cell));
    if (!/시기|버전/i.test(headers[0]) || !/변화|배경|이유/i.test(headers[1]) || !/영향|실무|근거/i.test(headers[2])) return whole;
    const cards = rows.slice(1).map(([period, why, impact], index) =>
      `<article class="version-card"><header><span class="version-card-index">${String(index + 1).padStart(2, '0')}</span><h4>${period}</h4></header><section class="version-card-why"><h5><span aria-hidden="true">↗</span> 왜 바뀌었나</h5><div>${why}</div></section><section class="version-card-impact"><h5><span aria-hidden="true">✓</span> 실무에서 확인</h5><div>${impact}</div></section></article>`).join('');
    return `<section class="version-cards" aria-label="버전별 변화 카드"><div class="version-card-grid">${cards}</div><details class="version-original"><summary>원문 표 보기 <span>버전별 주요 변경 사항 전체 표</span></summary>${whole}</details></section>`;
  });
}

const JPA_CARDS = {
  P19: { title: 'JPA 연결 경로', note: '이 문서의 Boot 설정과 MySQL 연결 구성', cards: [['애플리케이션', 'JPA 설정 · EntityManager'], ['DataSource', 'Boot가 JDBC URL로 구성'], ['HikariCP', 'DataSource에서 커넥션 대여'], ['Hibernate', 'JPA 구현체 · SQL 실행'], ['JDBC', 'MySQL Connector/J'], ['MySQL', '앱 DB · 직접 연결']], links: [['애플리케이션', 'DataSource'], ['DataSource', 'HikariCP'], ['HikariCP', 'Hibernate'], ['Hibernate', 'JDBC'], ['JDBC', 'MySQL']], detail: 'Spring 앱은 DataSource와 Hikari 커넥션 풀을 사용하고 Hibernate가 JDBC 드라이버를 통해 MySQL에 접근한다. DBeaver는 Hibernate 경로에 끼지 않고 MySQL에 직접 연결하는 별도 클라이언트다.', branches: [['DBeaver', 'MySQL에 직접 접속해 SQL·결과를 확인한다.']] },
  P20: { title: '엔티티와 테이블의 연결', note: '엔티티 선언과 FK 소유 관계를 읽는 지도', cards: [['Entity', '@Entity · @Id · persistent fields'], ['영속성 컨텍스트', 'EntityManager가 관리하는 객체 상태'], ['Hibernate', '매핑을 SQL로 실행'], ['JDBC', 'SQL 전달'], ['MySQL', '테이블 · FK']], links: [['Entity', '영속성 컨텍스트'], ['영속성 컨텍스트', 'Hibernate'], ['Hibernate', 'JDBC'], ['JDBC', 'MySQL']], detail: '연관관계에서는 FK가 있는 @ManyToOne 쪽이 보통 주인이다. mappedBy 컬렉션만 바꾸면 FK가 갱신되지 않을 수 있다.', branches: [['저장 예제', 'Order를 persist하고 트랜잭션 안에서 응답 DTO를 만든다.']] },
  S09: { title: 'Entity 상태가 MySQL까지 가는 길', note: '조회·변경 추적·flush·트랜잭션 결과를 문서 내용대로 연결', cards: [['Entity', 'new / managed / removed'], ['영속성 컨텍스트', '1차 캐시 · 스냅샷 · 동일성'], ['flush', 'dirty checking · DML 동기화'], ['Hibernate SQL', '필요한 INSERT / UPDATE / DELETE'], ['JDBC', '드라이버를 통한 SQL 전달'], ['MySQL', '현재 DB 트랜잭션']], links: [['Entity', '영속성 컨텍스트'], ['영속성 컨텍스트', 'flush'], ['flush', 'Hibernate SQL'], ['Hibernate SQL', 'JDBC'], ['JDBC', 'MySQL']], detail: 'flush는 SQL을 동기화하는 시점이며 커밋이 아니다. flush 뒤에도 트랜잭션은 rollback될 수 있다.', branches: [['조회', 'find는 먼저 1차 캐시를 확인한다. 없으면 SELECT 후 엔티티와 스냅샷을 컨텍스트에 등록한다.'], ['저장·변경', 'persist와 관리 엔티티의 변경은 지연될 수 있다. flush에서 스냅샷 비교 후 필요한 DML을 실행한다. IDENTITY는 INSERT가 더 일찍 필요할 수 있다.'], ['트랜잭션', 'AUTO flush는 커밋 전, 결과와 겹치는 JPQL/HQL 전 또는 명시 flush에서 발생할 수 있다. 이후 트랜잭션 관리자가 commit 또는 rollback한다.'], ['DBeaver', 'Hibernate/JDBC를 경유하지 않고 MySQL에 직접 연결하는 별도 확인 경로다.']] },
  S10: { title: 'Repository 호출에서 SQL까지', note: '쿼리 선택과 실행 경로', cards: [['Repository', '프록시 · 기본 CRUD / query method'], ['쿼리 해석', '@Query · 메서드 이름 · Specification'], ['EntityManager', '기본 CRUD 위임'], ['JPA 구현체', 'JPQL을 SQL로 변환'], ['JDBC', '실행 SQL 전달'], ['MySQL', '결과 행']], links: [['Repository', '쿼리 해석'], ['쿼리 해석', 'EntityManager'], ['EntityManager', 'JPA 구현체'], ['JPA 구현체', 'JDBC'], ['JDBC', 'MySQL']], detail: '문서의 설명에 따라 기본 CRUD는 EntityManager로 위임하고, 쿼리 메서드는 선언 쿼리 또는 이름 분석을 거쳐 JPA 구현체가 SQL로 변환한다.', branches: [['직접 SQL 도구', 'JdbcClient는 Spring JDBC에서 SQL을 직접 작성하는 경로다. MyBatis와 jOOQ도 문서에서 별도 SQL 도구로 비교한다.'], ['DBeaver', '애플리케이션 경로와 별개로 MySQL에 직접 연결한다.']] },
};

function renderJpaConcept(id) {
  const data = JPA_CARDS[id];
  if (!data) return '';
  if (id === 'S09') return renderJpaJourney(data);
  const flow = data.cards.map(([name, sub], i) => `${i ? `<span class="jpa-concept-edge" aria-hidden="true"><span>${esc(data.links[i - 1][0])} → ${esc(data.links[i - 1][1])}</span><b>↓</b></span>` : ''}<div class="jpa-concept-node"><span class="jpa-concept-index">${String(i + 1).padStart(2, '0')}</span><strong>${esc(name)}</strong><small>${esc(sub)}</small></div>`).join('');
  const branches = data.branches.map(([name, body]) => `<details class="jpa-concept-branch"><summary>${esc(name)}</summary><p>${esc(body)}</p></details>`).join('');
  return `<section class="jpa-concept" aria-label="${esc(data.title)}"><header><div><p class="jpa-concept-kicker">JPA CONCEPT · ${esc(id)}</p><h2>${esc(data.title)}</h2><p>${esc(data.note)}</p></div><span class="jpa-concept-badge">문서 근거</span></header><div class="jpa-concept-flow">${flow}</div><p class="jpa-concept-caption">${esc(data.detail)}</p><div class="jpa-concept-branches" aria-label="세부 흐름 펼치기">${branches}</div></section>`;
}

/** P20의 실제 Order 매핑을 필드·테이블·FK 값으로 연결한다. */
function renderP20EntityTable() {
  const entityCode = `@Entity @Table(name="orders")
public class Order extends BaseEntity {
  @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
  @Column(nullable=false, length=100) private String ordererName;
  @OneToMany(mappedBy="order", cascade=CascadeType.ALL, orphanRemoval=true)
  private List<OrderLine> lines = new ArrayList<>();
  // 생성자와 메서드는 아래 원문에서 확인
}`;
  const createCode = `Order o=Order.create("kim");
o.addLine(new OrderLine("coffee", new java.math.BigDecimal("4.50"), 2));
em.persist(o);`;
  const relationCode = `@ManyToOne(fetch=FetchType.LAZY, optional=false)
@JoinColumn(name="order_id", nullable=false) private Order order;`;
  const stages = [
    { label: '객체 생성', object: 'Order{ordererName=kim, lines=[OrderLine{productName=coffee}]}', context: 'transient · 아직 persist 전', sql: '아직 SQL 실행을 표시하지 않음', db: '저장된 행 없음', note: 'Controller 메서드는 @Transactional 경계 안에서 실행됩니다. Order와 OrderLine은 우선 Java 메모리의 객체입니다.' },
    { label: 'persist 요청', object: 'Order{ordererName=kim, lines=[OrderLine{productName=coffee}]}', context: 'Order managed · cascade PERSIST 대상', sql: '실제 SQL 시점은 전략·flush에 따라 달라짐', db: 'commit 전 · 별도 연결은 이전 상태', note: 'em.persist(o)는 새 Order를 영속성 컨텍스트에 등록합니다. CascadeType.ALL은 새 OrderLine에도 persist를 전파할 수 있습니다. Hibernate는 부모의 IDENTITY 키를 확보하려고 부모 INSERT를 persist 직후 실행할 수 있습니다. 자식 INSERT는 키·cascade·flush 경계에 따라 달라질 수 있습니다.' },
    { label: 'INSERT 예시', object: 'Order{id=1?, ordererName=kim, lines=[coffee]}', context: '트랜잭션 안 · 두 객체의 변경 추적', sql: "INSERT INTO orders (orderer_name, ...) VALUES ('kim', ...);\nINSERT INTO order_lines (order_id, product_name, ...) VALUES (1, 'coffee', ...);", db: '아직 commit 전 · 타 연결에는 미확정', note: '두 SQL은 저장될 열과 값의 모양을 보여 주는 예시입니다. 부모의 IDENTITY 키를 얻는 INSERT는 persist 중 앞당겨질 수 있고, cascade된 자식 INSERT 시점과 SQL 순서는 고정되어 있지 않습니다. 별도 연결은 보통 commit 전 미확정 행을 읽지 못합니다.' },
    { label: 'commit 후 행', object: '요청 처리 완료 · 영속성 컨텍스트 종료', context: 'Spring 트랜잭션 commit 완료', sql: 'commit 성공 뒤 새 조회로 확인', db: 'orders(1, kim)\norder_lines(10, 1, coffee)', note: '메서드가 정상 반환되고 트랜잭션이 commit된 뒤 새 DBeaver 조회에서 예시 행을 확인합니다. 실제 생성 ID와 감사 값은 실행 환경에서 조회하세요.' },
  ];
  const stageButtons = stages.map((stage, index) => `<button type="button" class="p20-stage-button${index === 0 ? ' is-active' : ''}" data-p20-stage="${index}" aria-pressed="${index === 0}" aria-controls="p20-runtime-panel"><span>${index + 1}</span>${esc(stage.label)}</button>`).join('');
  const fieldLink = (name, target, rule, key) => `<button type="button" class="p20-field-link" data-p20-link="${key}" aria-pressed="false" aria-label="${esc(name)} 필드에서 ${esc(target)} 열로 이동"><code>${esc(name)}</code><span aria-hidden="true">→</span><code>${esc(target)}</code><small>${esc(rule)}</small></button>`;
  return `<section class="p20-entity-map" aria-label="P20 Order 엔티티에서 MySQL 행까지">
    <header class="p20-entity-map-head"><div><p class="jpa-concept-kicker">ENTITY → TABLE · P20</p><h2>P20 엔티티 매핑 — Order 객체와 MySQL 행</h2><p>필드의 매핑 정보가 테이블 열과 외래 키가 되고, 생성한 객체가 트랜잭션을 지나 DB 행이 되는 길을 따라가 보세요.</p></div><span class="jpa-concept-badge">P20 코드 발췌</span></header>
    <div class="p20-map-columns">
      <article class="p20-map-code"><h3>① Java · Order 엔티티</h3><p>필드와 애노테이션이 저장 모양을 정합니다</p><pre><code>${esc(entityCode)}</code></pre><div class="p20-field-links" aria-label="Java 필드에서 DB 열로 가는 매핑">${fieldLink('id', 'orders.id', 'PK · IDENTITY', 'id')}${fieldLink('ordererName', 'orders.orderer_name', 'VARCHAR(100) · NOT NULL', 'name')}${fieldLink('lines', 'order_lines.order_id', 'OrderLine.order가 FK owning side', 'fk')}</div><small><code>orderer_name</code>은 기본 naming strategy 예시입니다. <code>BaseEntity</code>의 감사 필드는 짧은 화면에서 생략했습니다.</small></article>
      <article class="p20-map-db"><h3>② 관계형 DB · 테이블 행</h3><p>같은 주문도 객체와 행은 다른 모양입니다</p><div class="p20-db-table" role="table" aria-label="orders 예시 행"><div role="row"><b role="columnheader" data-p20-column="id">id</b><b role="columnheader" data-p20-column="name">orderer_name</b></div><div role="row" data-p20-row="scalar"><span role="cell" data-p20-column="id">1</span><span role="cell" data-p20-column="name">kim</span></div></div><div class="p20-map-arrow" aria-hidden="true">↓</div><div class="p20-db-table" role="table" aria-label="order_lines 예시 행"><div role="row"><b role="columnheader">id</b><b role="columnheader" data-p20-column="fk">order_id</b><b role="columnheader">product_name</b></div><div role="row" data-p20-row="relation"><span role="cell">10</span><span role="cell" data-p20-column="fk">1</span><span role="cell">coffee</span></div></div><small><code>order_lines.order_id = 1</code>이 <code>orders.id = 1</code>을 참조합니다.</small></article>
    </div>
    <details class="p20-map-source"><summary>FK 매핑과 실제 생성 코드 보기</summary><div class="p20-source-pair"><pre><code>${esc(relationCode)}</code></pre><pre><code>${esc(createCode)}</code></pre></div><p><code>Order.lines</code>는 Java 컬렉션입니다. FK 열을 쓰는 쪽은 <code>OrderLine.order</code>이며 <code>mappedBy="order"</code>는 반대편에서 그 필드를 가리킵니다.</p></details>
    <section class="p20-runtime" aria-label="주문 객체가 DB에 저장되는 예상 단계"><header><h3>주문 생성부터 DB 확인까지</h3><span>학습용 예상 흐름 · 실제 실행 로그 아님</span></header><nav class="p20-stage-controls" aria-label="주문 저장 단계">${stageButtons}</nav><div class="p20-runtime-panel" id="p20-runtime-panel" aria-live="polite"><div class="p20-runtime-values"><article><h4>Java 객체</h4><code data-p20-value="object">${esc(stages[0].object)}</code></article><article><h4>EntityManager / 트랜잭션</h4><span data-p20-value="context">${esc(stages[0].context)}</span></article><article><h4>예상 SQL 모양</h4><code data-p20-value="sql">${esc(stages[0].sql)}</code></article><article><h4>MySQL 행</h4><code data-p20-value="db">${esc(stages[0].db)}</code></article></div><p data-p20-note>${esc(stages[0].note)}</p></div></section>
    <p class="p20-map-caveat">표의 ID 1·10과 INSERT는 설명용 예시이며 실행하거나 측정한 값이 아닙니다. <code>GenerationType.IDENTITY</code>에서는 생성 키를 얻으려고 부모 INSERT가 <code>persist</code> 중 앞당겨질 수 있습니다. cascade된 자식의 INSERT 시점·순서까지 고정 단계로 보면 안 됩니다. 실제 DDL, SQL, ID, 감사 열은 앱 로그와 DBeaver에서 확인하세요.</p>
    <p class="p20-map-refs">기술 근거: <a href="https://docs.hibernate.org/orm/current/userguide/html_single/">Hibernate ORM User Guide · IDENTITY</a> · <a href="https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html">Jakarta Persistence 3.2 · 관계의 owning side</a></p>
  </section><script>
(() => {
  const root = document.querySelector('.p20-entity-map');
  if (!root) return;
  const states = ${JSON.stringify(stages)};
  const panel = root.querySelector('#p20-runtime-panel');
  const values = Object.fromEntries(['object', 'context', 'sql', 'db'].map((key) => [key, panel.querySelector('[data-p20-value="' + key + '"]')]));
  root.querySelectorAll('[data-p20-stage]').forEach((button) => button.addEventListener('click', () => {
    const state = states[Number(button.dataset.p20Stage)];
    for (const [key, value] of Object.entries(values)) value.textContent = state[key];
    panel.querySelector('[data-p20-note]').textContent = state.note;
    root.querySelectorAll('[data-p20-stage]').forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    root.dataset.stage = button.dataset.p20Stage;
  }));
  root.querySelectorAll('[data-p20-link]').forEach((button) => button.addEventListener('click', () => {
    const key = button.dataset.p20Link;
    root.querySelectorAll('[data-p20-link]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    root.querySelector('.p20-map-columns').dataset.activeLink = key;
  }));
})();
</script>`;
}

function renderJpaJourney(data) {
  const steps = [
    { label: 'DB에서 시작', code: '// 아직 EntityManager 호출 전', entityId: '—', snapshotId: '—', entity: '아직 없음', snapshot: '아직 없음', sql: '아직 실행 전', db: '첫 글', note: 'MySQL의 post 행이 시작 값이다. Java 객체와 스냅샷은 아직 없다.' },
    { label: 'find() · SELECT', code: 'Post post = em.find(Post.class, 42);', entityId: '42', snapshotId: '42', entity: '첫 글', snapshot: '첫 글', sql: 'SELECT ... FROM post WHERE id = 42', db: '첫 글', note: '같은 영속성 컨텍스트에 id=42가 이미 관리 중이면 기존 인스턴스를 반환해 SELECT를 생략할 수 있다. 첫 조회에서 객체와 읽은 값의 스냅샷을 등록한다. SQL은 이 학습 경로의 예상 형태다.' },
    { label: 'setter · 메모리 변경', code: 'post.setTitle("수정된 글");', entityId: '42', snapshotId: '42', entity: '수정된 글', snapshot: '첫 글', sql: '아직 UPDATE 없음', db: '첫 글', note: 'setter는 관리 중인 Java 객체만 바꾼다. Hibernate는 스냅샷과 비교해 변경을 알아챌 수 있다.' },
    { label: 'flush · SQL 동기화', code: 'em.flush();', entityId: '42', snapshotId: '42', entity: '수정된 글', snapshot: '수정된 글', sql: 'UPDATE post SET title = ? WHERE id = ?', db: '수정된 글', note: 'Hibernate가 JDBC로 UPDATE를 보내 트랜잭션에 반영한다. 아직 commit 전이라 다른 연결은 보통 이전 값인 첫 글을 본다.' },
  ];
  const buttons = steps.map((step, i) => `<button type="button" class="jpa-journey-step${i === 0 ? ' is-active' : ''}" data-step="${i}" aria-pressed="${i === 0}" aria-controls="jpa-journey-panel"><span>${i + 1}</span>${esc(step.label)}</button>`).join('');
  const flowNodes = [['EntityManager', 'JPA API · 관리 창구'], ['영속성 컨텍스트', '객체 + 스냅샷'], ['Entity', 'JVM 객체'], ['Hibernate', '변경 감지 · SQL'], ['JDBC', 'SQL 전달'], ['MySQL', 'post 행']];
  const flow = flowNodes.map(([name, sub], i) => `${i ? '<span class="jpa-concept-edge" aria-hidden="true">→</span>' : ''}<div class="jpa-concept-node"><strong>${esc(name)}</strong><small>${esc(sub)}</small></div>`).join('');
  const entityCard = (title, field, step) => `<article><h3>${title}</h3><p class="jpa-object-label">${field === 'entity' ? 'Post' : '스냅샷(Post)'}</p><div class="jpa-mini-table" role="table" aria-label="${title} id와 title"><div role="row"><b role="columnheader">id</b><b role="columnheader">title</b></div><div role="row"><span role="cell" data-value="${field}Id">${esc(step[`${field}Id`])}</span><span role="cell" data-value="${field}">${esc(step[field])}</span></div></div></article>`;
  const panel = (step) => `<div class="jpa-journey-values">${entityCard('Java 객체 · JVM', 'entity', step)}${entityCard('컨텍스트 스냅샷', 'snapshot', step)}<article><h3>Hibernate → JDBC</h3><p class="jpa-value-sql" data-value="sql">${esc(step.sql)}</p></article><article><h3>MySQL · 앱 트랜잭션의 post 행</h3><div class="jpa-mini-table" role="table" aria-label="post 행 id와 title"><div role="row"><b role="columnheader">id</b><b role="columnheader">title</b></div><div role="row"><span role="cell">42</span><span role="cell" data-value="db">${esc(step.db)}</span></div></div></article></div><p class="jpa-journey-note" data-note>${esc(step.note)}</p><code class="jpa-journey-code" data-code>${esc(step.code)}</code>`;
  return `<section class="jpa-concept jpa-journey" aria-label="${esc(data.title)}"><header><div><p class="jpa-concept-kicker">JPA CONCEPT · S09</p><h2>게시글 한 건으로 보는 EntityManager → MySQL</h2><p>같은 id=42의 값이 조회, 변경, SQL 동기화, 트랜잭션 종료를 거치며 어디에 있는지 눌러 보세요.</p></div><span class="jpa-concept-badge">학습용 예상 흐름</span></header><nav class="jpa-journey-controls" aria-label="게시글 상태 단계">${buttons}</nav><div id="jpa-journey-panel" class="jpa-journey-panel" aria-live="polite">${panel(steps[0])}</div><div class="jpa-journey-roles"><div class="jpa-concept-flow" aria-label="JPA 처리 경로">${flow}</div><p><b>flush</b>는 영속성 컨텍스트의 변경을 SQL로 동기화하는 시점이다. 실행 순서와 구체 SQL은 매핑·설정에 따라 달라진다.</p></div><section class="jpa-journey-outcomes" aria-label="같은 flush 뒤 트랜잭션 결과 분기"><article><h3>commit 분기</h3><p>트랜잭션이 확정된다. 이후 DBeaver에서 새 autocommit SELECT 또는 새 트랜잭션으로 읽으면 <b>42 · 수정된 글</b>을 관찰한다.</p></article><article><h3>rollback 분기</h3><p>UPDATE는 취소된다. 트랜잭션 종료 뒤 새로 읽은 DB 행은 <b>42 · 첫 글</b>이다.</p></article></section><aside class="jpa-journey-observer"><strong>DBeaver · 별도 관찰 연결</strong><span>앱의 EntityManager → Hibernate → JDBC 경로에 끼지 않는다. flush와 commit 사이에는 보통 이전 값 <b>첫 글</b>을 본다. commit 후 결과는 새 autocommit SELECT나 새 트랜잭션으로 확인한다. 이미 열린 REPEATABLE READ 스냅샷에서는 commit 후에도 이전 값을 볼 수 있다.</span></aside><p class="jpa-journey-caveat">commit과 rollback은 같은 flush 뒤 서로 갈리는 결과다. SQL은 설명용 예상 형태이며 실제 실행 로그나 계측 결과가 아니다. SQL은 매핑, DB 방언, Hibernate 설정에 따라 달라진다. 예제의 트랜잭션 범위에서 설명하며, flush 시점은 호출·flush mode·쿼리·식별자 전략 등에 따라 달라질 수 있다.</p></section><script>
(() => {
  const root = document.querySelector('.jpa-journey');
  if (!root) return;
  const states = ${JSON.stringify(steps)};
  const panel = root.querySelector('#jpa-journey-panel');
  const fields = Object.fromEntries(['entityId', 'snapshotId', 'entity', 'snapshot', 'sql', 'db'].map((key) => [key, panel.querySelector('[data-value="' + key + '"]')]));
  root.querySelectorAll('[data-step]').forEach((button) => button.addEventListener('click', () => {
    const state = states[Number(button.dataset.step)];
    for (const [key, value] of Object.entries(fields)) value.textContent = state[key];
    panel.querySelector('[data-note]').textContent = state.note;
    panel.querySelector('[data-code]').textContent = state.code;
    root.querySelectorAll('[data-step]').forEach((item) => {
      const active = item === button;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
  }));
})();
</script>`;
}
