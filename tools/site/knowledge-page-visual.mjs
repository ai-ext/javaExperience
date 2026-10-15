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
  const concept = renderJpaConcept(id);
  return `${concept}<section class="knowledge-page-map" aria-label="문서 읽기 지도"><div class="knowledge-page-map-head"><div><p class="knowledge-page-map-kicker">${esc(group)} <span>· ${esc(id)}</span></p><h2>이 문서에서 볼 내용</h2><p>${esc(description)}</p></div><span class="knowledge-page-map-count">${headings.length}개 주제</span></div><nav class="knowledge-page-steps" aria-label="문서의 실제 절로 이동">${steps}</nav></section>`;
}

/** 원문의 제목과 코드를 보존하면서 공부자료 본문을 순서대로 펼쳐 읽게 한다. */
export function renderKnowledgePageSections(html) {
  const headings = [...html.matchAll(/<h2\b[^>]*id="[^"]+"[^>]*>[\s\S]*?<\/h2>/g)];
  if (!headings.length) return html;
  const before = html.slice(0, headings[0].index);
  const cards = headings.map((match, index) => {
    const next = headings[index + 1]?.index ?? html.length;
    const section = html.slice(match.index + match[0].length, next);
    const id = match[0].match(/\bid="([^"]+)"/)?.[1] || `knowledge-section-${index + 1}`;
    const title = textOnly(match[0]).replace(/^#\s*/, '');
    const subtopics = [...section.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/g)]
      .map((part) => textOnly(part[1]).replace(/^#\s*/, '')).filter(Boolean).slice(0, 4);
    const codeCount = (section.match(/<pre\b/g) || []).length;
    return `<details class="knowledge-chapter"><summary id="${esc(id)}" aria-label="${esc(title)} 펼치기"><span class="knowledge-chapter-number">${String(index + 1).padStart(2, '0')}</span><span class="knowledge-chapter-heading"><strong>${esc(title)}</strong>${subtopics.length ? `<small>${subtopics.map(esc).join(' · ')}</small>` : ''}</span><span class="knowledge-chapter-meta">${codeCount ? `${codeCount}개 코드 · ` : ''}열기 ↓</span></summary><div class="knowledge-chapter-body">${section}</div></details>`;
  }).join('');
  return `${before}<div class="knowledge-chapters" aria-label="공부자료 내용 펼쳐 읽기">${cards}</div><script>
(() => {
  const reveal = (hash) => {
    if (!hash || hash.length < 2) return;
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    const chapter = target?.closest('details.knowledge-chapter');
    if (chapter) chapter.open = true;
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

const JPA_CARDS = {
  P19: { title: 'JPA 연결 경로', note: '이 문서의 Boot 설정과 MySQL 연결 구성', cards: [['애플리케이션', 'JPA 설정 · EntityManager'], ['DataSource', 'Boot가 JDBC URL로 구성'], ['HikariCP', 'DataSource에서 커넥션 대여'], ['Hibernate', 'JPA 구현체 · SQL 실행'], ['JDBC', 'MySQL Connector/J'], ['MySQL', '앱 DB · 직접 연결']], links: [['애플리케이션', 'DataSource'], ['DataSource', 'HikariCP'], ['HikariCP', 'Hibernate'], ['Hibernate', 'JDBC'], ['JDBC', 'MySQL']], detail: 'Spring 앱은 DataSource와 Hikari 커넥션 풀을 사용하고 Hibernate가 JDBC 드라이버를 통해 MySQL에 접근한다. DBeaver는 Hibernate 경로에 끼지 않고 MySQL에 직접 연결하는 별도 클라이언트다.', branches: [['DBeaver', 'MySQL에 직접 접속해 SQL·결과를 확인한다.']] },
  P20: { title: '엔티티와 테이블의 연결', note: '엔티티 선언과 FK 소유 관계를 읽는 지도', cards: [['Entity', '@Entity · @Id · persistent fields'], ['영속성 컨텍스트', 'EntityManager가 관리하는 객체 상태'], ['Hibernate', '매핑을 SQL로 실행'], ['JDBC', 'SQL 전달'], ['MySQL', '테이블 · FK']], links: [['Entity', '영속성 컨텍스트'], ['영속성 컨텍스트', 'Hibernate'], ['Hibernate', 'JDBC'], ['JDBC', 'MySQL']], detail: '연관관계에서는 FK가 있는 @ManyToOne 쪽이 보통 주인이다. mappedBy 컬렉션만 바꾸면 FK가 갱신되지 않을 수 있다.', branches: [['저장 예제', 'Order를 persist하고 트랜잭션 안에서 응답 DTO를 만든다.']] },
  S09: { title: 'Entity 상태가 MySQL까지 가는 길', note: '조회·변경 추적·flush·트랜잭션 결과를 문서 내용대로 연결', cards: [['Entity', 'new / managed / removed'], ['영속성 컨텍스트', '1차 캐시 · 스냅샷 · 동일성'], ['flush', 'dirty checking · DML 동기화'], ['Hibernate SQL', '필요한 INSERT / UPDATE / DELETE'], ['JDBC', '드라이버를 통한 SQL 전달'], ['MySQL', '현재 DB 트랜잭션']], links: [['Entity', '영속성 컨텍스트'], ['영속성 컨텍스트', 'flush'], ['flush', 'Hibernate SQL'], ['Hibernate SQL', 'JDBC'], ['JDBC', 'MySQL']], detail: 'flush는 SQL을 동기화하는 시점이며 커밋이 아니다. flush 뒤에도 트랜잭션은 rollback될 수 있다.', branches: [['조회', 'find는 먼저 1차 캐시를 확인한다. 없으면 SELECT 후 엔티티와 스냅샷을 컨텍스트에 등록한다.'], ['저장·변경', 'persist와 관리 엔티티의 변경은 지연될 수 있다. flush에서 스냅샷 비교 후 필요한 DML을 실행한다. IDENTITY는 INSERT가 더 일찍 필요할 수 있다.'], ['트랜잭션', 'AUTO flush는 커밋 전, 결과와 겹치는 JPQL/HQL 전 또는 명시 flush에서 발생할 수 있다. 이후 트랜잭션 관리자가 commit 또는 rollback한다.'], ['DBeaver', 'Hibernate/JDBC를 경유하지 않고 MySQL에 직접 연결하는 별도 확인 경로다.']] },
  S10: { title: 'Repository 호출에서 SQL까지', note: '쿼리 선택과 실행 경로', cards: [['Repository', '프록시 · 기본 CRUD / query method'], ['쿼리 해석', '@Query · 메서드 이름 · Specification'], ['EntityManager', '기본 CRUD 위임'], ['JPA 구현체', 'JPQL을 SQL로 변환'], ['JDBC', '실행 SQL 전달'], ['MySQL', '결과 행']], links: [['Repository', '쿼리 해석'], ['쿼리 해석', 'EntityManager'], ['EntityManager', 'JPA 구현체'], ['JPA 구현체', 'JDBC'], ['JDBC', 'MySQL']], detail: '문서의 설명에 따라 기본 CRUD는 EntityManager로 위임하고, 쿼리 메서드는 선언 쿼리 또는 이름 분석을 거쳐 JPA 구현체가 SQL로 변환한다.', branches: [['직접 SQL 도구', 'JdbcClient는 Spring JDBC에서 SQL을 직접 작성하는 경로다. MyBatis와 jOOQ도 문서에서 별도 SQL 도구로 비교한다.'], ['DBeaver', '애플리케이션 경로와 별개로 MySQL에 직접 연결한다.']] },
};

function renderJpaConcept(id) {
  const data = JPA_CARDS[id];
  if (!data) return '';
  const flow = data.cards.map(([name, sub], i) => `${i ? `<span class="jpa-concept-edge" aria-hidden="true"><span>${esc(data.links[i - 1][0])} → ${esc(data.links[i - 1][1])}</span><b>↓</b></span>` : ''}<div class="jpa-concept-node"><span class="jpa-concept-index">${String(i + 1).padStart(2, '0')}</span><strong>${esc(name)}</strong><small>${esc(sub)}</small></div>`).join('');
  const branches = data.branches.map(([name, body]) => `<details class="jpa-concept-branch"><summary>${esc(name)}</summary><p>${esc(body)}</p></details>`).join('');
  return `<section class="jpa-concept" aria-label="${esc(data.title)}"><header><div><p class="jpa-concept-kicker">JPA CONCEPT · ${esc(id)}</p><h2>${esc(data.title)}</h2><p>${esc(data.note)}</p></div><span class="jpa-concept-badge">문서 근거</span></header><div class="jpa-concept-flow">${flow}</div><p class="jpa-concept-caption">${esc(data.detail)}</p><div class="jpa-concept-branches" aria-label="세부 흐름 펼치기">${branches}</div></section>`;
}
