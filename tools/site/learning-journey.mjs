const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const story = [
  { step: '01', method: 'POST', label: '게시글 저장', detail: '1-2에서 저장하고 새 id를 받는다', stage: '1-2' },
  { step: '02', method: 'GET', label: '게시글 조회', detail: '같은 id로 저장 결과를 읽는다', stage: '2-1' },
  { step: '03', method: 'PATCH', label: '게시글 수정', detail: '작성한 글의 일부를 바꾼다', stage: '3-1' },
  { step: '04', method: 'PUT', label: '좋아요', detail: '그 글에 회원의 반응을 남긴다', stage: '4-1' },
  { step: '05', method: 'POST', label: '댓글 작성', detail: '같은 글 아래 대화를 잇는다', stage: '5-1' },
  { step: '06', method: 'PUT', label: '북마크', detail: '나중에 볼 글로 저장한다', stage: '6-1' },
];

const concepts = [
  { id: 'W01', label: 'API', file: 'W01-api-dev-order', note: '요청과 응답의 약속' },
  { id: 'W02', label: 'Controller', file: 'W02-why-layers', note: 'HTTP 요청이 들어오는 곳' },
  { id: 'W09', label: 'DTO', file: 'W09-why-dto', note: '받고 돌려줄 데이터 모양' },
  { id: 'W11', label: 'Service', file: 'W11-why-tx-in-service', note: '업무 규칙과 트랜잭션' },
  { id: 'W03', label: 'Repository', file: 'W03-db-access-comparison', note: 'DB 접근의 경계' },
  { id: 'S09', label: 'JPA', file: 'S09-jpa-hibernate', note: '엔티티 저장·조회' },
  { id: 'W04', label: 'MyBatis', file: 'W04-mybatis-xml-practical', note: 'SQL을 직접 매핑' },
  { id: 'P21', label: 'QueryDSL', file: 'P21-querydsl-setup', note: '조건을 Java 코드로 조합' },
  { id: 'R04', label: 'SQL·쿼리', file: 'R04-sql-crud-join', note: 'DB에 보내는 질의' },
  { id: 'R03', label: '스키마·컬럼', file: 'R03-schema-types-constraints', note: '테이블과 데이터 구조' },
  { id: 'R01', label: 'MySQL', file: 'R01-what-is-db-server', note: '데이터가 저장되는 서버' },
  { id: 'R06', label: 'DBeaver', file: 'R06-db-client-tools', note: 'DB를 직접 확인하는 도구' },
  { id: 'S08', label: '트랜잭션', file: 'S08-transactions', note: '여러 변경을 한 작업으로' },
];

const methodClass = (method) => String(method || '').toLowerCase().replace(/[^a-z]/g, '');
const linkedStages = (route) => {
  const values = route.stages?.length ? route.stages : [route.firstStage];
  return values.map((stage) => typeof stage === 'string' ? stage : stage?.id).filter(Boolean);
};

/** 긴 목차 앞에 배치하는 탐색 화면. 기존 시나리오와 역할별 구조도는 그대로 유지한다. */
export function renderLearningJourney(manifest, catalog, levelHref) {
  const chapters = manifest.chapters.filter((chapter) => chapter.status !== 'planned');
  const count = chapters.reduce((total, chapter) => total + chapter.levels.filter((level) => level.file).length, 0);
  const projectRoutes = catalog.projects.map((project) => {
    const groups = new Map();
    for (const route of project.routes) {
      const feature = route.feature || '기타 기능';
      if (!groups.has(feature)) groups.set(feature, []);
      groups.get(feature).push(route);
    }
    return { project, groups };
  });
  const routesCount = catalog.projects.reduce((total, project) => total + project.routes.length, 0);
  const firstJavaHref = levelHref('0-1');
  const firstPostHref = levelHref('1-1');
  if (!firstJavaHref || !firstPostHref) throw new Error('처음 시작할 0-1·1-1 단계 링크가 없다');
  const gradeOrder = ['basic', 'intermediate', 'advanced'];
  const gradeLabels = { basic: '기초', intermediate: '중급', advanced: '고급' };
  const gradeCounts = Object.fromEntries(gradeOrder.map((grade) => [grade,
    chapters.reduce((total, chapter) => total + chapter.levels.filter((level) => level.file && level.difficulty === grade).length, 0),
  ]));
  const gradeNav = gradeOrder.map((grade) => `<button type="button" class="journey-grade-link" data-journey-grade="${grade}" aria-label="${gradeLabels[grade]} 단계 ${gradeCounts[grade]}개 보기"><span class="journey-grade-dot grade-${grade}"></span><span>${gradeLabels[grade]}</span><b>${gradeCounts[grade]}</b></button>`).join('');
  const chapterNav = chapters.map((chapter) => {
    const levels = chapter.levels.filter((level) => level.file);
    const first = levels[0];
    if (!first) return '';
    return `<a class="journey-nav-chapter" href="${esc(levelHref(first.id))}"><span>${esc(first.id)}</span><span>${esc(chapter.title.split(' — ')[1] || chapter.title)}</span></a>`;
  }).join('');
  const storyItems = story.map((item, index) => {
    const href = levelHref(item.stage);
    if (!href) throw new Error(`API 여정의 ${item.stage} 단계가 없다`);
    return `<a class="journey-step" data-flow-step="${index}" href="${esc(href)}"><span class="journey-step-number">${item.step}</span><span class="journey-method method-${methodClass(item.method)}">${item.method}</span><strong>${item.label}</strong><small>${item.detail}</small><span class="journey-step-link">${item.stage} 단계 열기 <span aria-hidden="true">↗</span></span></a>`;
  });
  const conceptMarkup = concepts.map((item) => `<a href="../docs/knowledge/${esc(item.file)}.html"><span>${esc(item.id)}</span><strong>${esc(item.label)}</strong><small>${esc(item.note)}</small><span aria-hidden="true">↗</span></a>`).join('');
  const chapterMarkup = chapters.map((chapter) => {
    const levels = chapter.levels.filter((level) => level.file);
    const href = levelHref(levels[0]?.id);
    if (!href) return '';
    return `<a class="journey-chapter" href="${esc(href)}"><span>${esc(chapter.title.split(' — ')[0])}</span><strong>${esc(chapter.title.split(' — ')[1] || chapter.title)}</strong><small>${levels.length}개 단계 · ${esc(levels[0].id)}부터</small></a>`;
  }).join('');
  const stagesById = new Map();
  for (const project of catalog.projects) for (const route of project.routes) {
    for (const id of linkedStages(route)) if (!stagesById.has(id)) stagesById.set(id, route);
  }
  const gradeLabel = gradeLabels;
  const visualChapters = chapters.map((chapter) => {
    const levels = chapter.levels.filter((level) => level.file);
    const first = levels[0];
    const cards = levels.map((level) => {
      const route = stagesById.get(level.id);
      const routeText = route ? `${route.method} ${route.path}` : '설계 · 테스트 · 데이터 실습';
      const search = `${level.id} ${level.title} ${routeText}`.toLocaleLowerCase('ko');
      return `<a class="visual-stage-card" data-visual-grade="${esc(level.difficulty)}" data-visual-search="${esc(search)}" href="${esc(levelHref(level.id))}"><img src="visuals/${esc(level.id)}.svg" alt="${esc(level.id)} ${esc(level.title)} 화면 시안" loading="lazy"><span class="visual-stage-meta"><b>${esc(level.id)}</b><em>${esc(gradeLabel[level.difficulty] || '')}</em></span><strong>${esc(level.title)}</strong><small>${esc(routeText)}</small></a>`;
    }).join('');
    return `<details class="visual-chapter"><summary><img src="visuals/${esc(first.id)}.svg" alt="" loading="lazy"><span><small>${esc(chapter.title.split(' — ')[0])} · ${levels.length}단계</small><strong>${esc(chapter.title.split(' — ')[1] || chapter.title)}</strong></span><span class="visual-chapter-open">시안 보기 ↓</span></summary><div class="visual-stage-grid">${cards}</div></details>`;
  }).join('');
  const routeMarkup = projectRoutes.map(({ project, groups }) => {
    const features = [...groups].map(([feature, routes]) => {
      const endpoints = routes.map((route) => {
        const stages = linkedStages(route);
        const firstHref = stages.map(levelHref).find(Boolean);
        const search = `${route.method} ${route.path} ${feature} ${stages.join(' ')}`.toLocaleLowerCase('ko');
        const primary = firstHref
          ? `<a href="${esc(firstHref)}">${esc(route.path)}<span class="journey-endpoint-open">시나리오 ${esc(stages[0])} ↗</span></a>`
          : `<span>${esc(route.path)}<span class="journey-endpoint-open">연결 단계 없음</span></span>`;
        return `<li class="journey-endpoint" data-method="${esc(route.method)}" data-search="${esc(search)}"><span class="journey-method method-${methodClass(route.method)}">${esc(route.method)}</span>${primary}</li>`;
      }).join('');
      return `<details class="journey-feature" data-feature><summary><span>${esc(feature)}</span><small>${routes.length}개 API</small></summary><ul>${endpoints}</ul></details>`;
    }).join('');
    return `<section class="journey-project" aria-label="${esc(project.label)}"><h4>${esc(project.label)}</h4><p>${esc(project.description || '')}</p>${features}</section>`;
  }).join('');
  return `<section class="learning-journey" aria-labelledby="journey-title">
    <section class="journey-entry" aria-labelledby="journey-entry-title"><div><p class="journey-eyebrow">START · 첫 실습</p><h2 id="journey-entry-title">처음이면 작은 API 하나부터 만드세요</h2><p>0-1에서 Java와 요청을 익힙니다. 이미 익숙하면 1-1의 <code>success</code> 응답부터 시작하세요. DB 조회는 별도 SQL 경로로 연습할 수 있습니다.</p></div><nav aria-label="첫 실습 선택"><a class="journey-entry-primary" href="${esc(firstJavaHref)}">0-1 첫 API 만들기 →</a><a href="${esc(firstPostHref)}">1-1 게시글 요청부터 →</a><a href="db-query-journey/db-01-response-to-query.html">DB-01 SQL부터 →</a></nav></section>
    <div class="journey-dashboard">
      <aside class="journey-learning-nav" aria-label="학습 경로 탐색"><a class="journey-nav-brand" href="../index.html"><span aria-hidden="true">⌘</span><span><b>학습 경로</b><small>게시판 API를 단계별로 만들어요</small></span></a><div class="journey-grade-nav" aria-label="난이도별 단계">${gradeNav}</div><nav class="journey-chapter-nav" aria-label="장별 학습 경로">${chapterNav}</nav><a class="journey-nav-all" href="#visual-catalog">전체 ${count}단계 시안 보기 <span aria-hidden="true">→</span></a></aside>
      <div class="journey-workspace">
        <header class="journey-page-heading"><div><p class="journey-eyebrow">${chapters.length}개의 기능 묶음 · ${routesCount}개의 API 경로</p><h2 id="journey-title">하나의 게시글이 이어지는 API 여정</h2><p>1-1은 <code>success</code>만 응답하고 DB에 저장하지 않습니다. 1-2에서 받은 새 <code>id</code>로 조회·수정·반응을 이어갑니다.</p></div><a href="#journey-all-apis">API 찾아보기 <span aria-hidden="true">↗</span></a></header>
        <div class="journey-workbench"><section class="journey-story-panel" aria-labelledby="journey-story-title"><div class="journey-story-head"><div><p class="journey-eyebrow">ONE POST · MANY FEATURES</p><h3 id="journey-story-title">한 게시글로 이어지는 기능</h3></div><a href="#journey-all-apis">전체 API 보기 ↓</a></div><div class="journey-flow-canvas"><div class="journey-create-node">${storyItems[0]}</div><span class="journey-flow-bridge" aria-hidden="true"><i></i></span><article class="journey-post" aria-label="여러 API가 함께 다루는 게시글"><span class="journey-post-top">POST RESPONSE · 201 CREATED</span><strong>나의 첫 Spring 게시글</strong><p><code>id</code>가 생기면 다음 API의 <code>/posts/{id}</code>에서 다시 사용합니다.</p><div><span>♡ 좋아요</span><span>▤ 댓글</span><span>♧ 북마크</span></div><b class="journey-post-id">postId: 응답에서 받기</b></article><div class="journey-branch-label">같은 글에 연결되는 API</div><div class="journey-story">${storyItems.slice(1).join('')}</div></div></section>
          <aside class="journey-architecture-panel" aria-label="요청이 처리되는 서버 흐름"><div class="journey-architecture-head"><span aria-hidden="true">▣</span><div><p class="journey-eyebrow">API REQUEST FLOW</p><h3>요청 흐름 미리보기</h3></div><span class="journey-architecture-method">POST</span></div><p class="journey-architecture-caption">계층별로 담당하는 일을 눈으로 따라가 보세요.</p><ol class="journey-architecture"><li class="flow-client"><b>① Browser · Postman</b><small>HTTP 요청과 JSON 본문을 보냅니다.</small></li><li class="flow-controller"><b>② Controller</b><small>경로와 입력값을 확인하고 호출합니다.</small></li><li class="flow-dto"><b>③ Request DTO</b><small>요청 JSON을 Java 객체로 받습니다.</small></li><li class="flow-service"><b>④ Service</b><small>게시글 규칙과 트랜잭션을 처리합니다.</small></li><li class="flow-repository"><b>⑤ Repository · JPA</b><small>엔티티를 저장하도록 DB에 요청합니다.</small></li><li class="flow-mysql"><b>⑥ MySQL</b><small>테이블에 게시글을 기록합니다.</small></li></ol><div class="journey-db-client"><span class="journey-db-client-icon" aria-hidden="true">⌕</span><span><b>DBeaver</b><small>SQL로 DB에 직접 연결해 저장 결과를 확인합니다.</small></span><span class="journey-db-direct">↗ MySQL 직접 연결</span></div><p class="journey-architecture-foot">실제 API를 호출하면 시나리오 화면에서 응답 결과와 흐름을 확인할 수 있습니다.</p></aside></div>
        <section class="journey-concept-section" aria-label="백엔드 용어 지도"><div class="journey-concept-heading"><div><p class="journey-eyebrow">BACKEND TERM MAP</p><h3>도구와 개념을 제자리에 놓아보기</h3></div><p>Browser·Postman은 API를 호출하고, DBeaver는 MySQL에 직접 연결합니다. 카드를 눌러 각 개념을 더 살펴보세요.</p></div><div class="journey-concepts">${conceptMarkup}</div></section>
      </div>
    </div>
    <section class="visual-catalog" id="visual-catalog" aria-labelledby="visual-catalog-title"><div class="visual-catalog-head"><div><p class="journey-eyebrow">SCENARIO VISUALS · ${count} STAGES</p><h3 id="visual-catalog-title">단계별 시안으로 고르기</h3><p>각 단계의 화면·요청을 실제 시나리오 데이터로 그렸습니다. 장을 펼치고 시안을 누르면 구현 과정으로 이동합니다.</p></div><a href="#journey-all-apis">API 경로로 찾기 ↗</a></div><div class="visual-catalog-controls"><label>단계 검색 <input type="search" data-visual-search-input placeholder="예: DTO, 좋아요, 2-1" autocomplete="off"></label><div class="visual-grade-filter" role="group" aria-label="단계 난이도"><button type="button" data-visual-filter="all" aria-pressed="true">전체</button><button type="button" data-visual-filter="basic" aria-pressed="false">기초</button><button type="button" data-visual-filter="intermediate" aria-pressed="false">중급</button><button type="button" data-visual-filter="advanced" aria-pressed="false">고급</button></div></div><p class="visual-result" data-visual-result aria-live="polite">${count}개 단계</p><div class="visual-chapters">${visualChapters}</div></section>
    <details class="journey-chapters"><summary>장별 학습 경로를 글로 보기 <span>${chapters.length}개 기능 묶음</span></summary><div class="journey-chapter-grid">${chapterMarkup}</div></details>
    <div class="journey-browser" id="journey-all-apis"><div class="journey-browser-head"><div><p class="journey-eyebrow">API EXPLORER</p><h3>구현할 API 찾아보기</h3><p>기능을 펼쳐 경로를 고르세요. 각 경로는 해당 단계의 Controller·Service·Repository 흐름으로 이어집니다.</p></div><a href="#api-map-title">전체 구조도 보기 ↗</a></div><div class="journey-controls"><label>API 검색 <input type="search" data-journey-search placeholder="경로·기능·단계 검색" autocomplete="off"></label><label>HTTP 메서드 <select data-journey-method><option value="all">전체</option><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select></label></div><p class="journey-result" data-journey-result aria-live="polite">${routesCount}개 API</p><div class="journey-projects">${routeMarkup}</div></div>
  </section><script>
  (() => {
    const root = document.querySelector('main');
    const search = root.querySelector('[data-journey-search]');
    const method = root.querySelector('[data-journey-method]');
    const endpoints = [...root.querySelectorAll('.journey-endpoint')];
    const apply = () => {
      const term = search.value.trim().toLocaleLowerCase('ko');
      const selected = method.value;
      let visible = 0;
      for (const item of endpoints) {
        item.hidden = !item.dataset.search.includes(term) || (selected !== 'all' && item.dataset.method !== selected);
        if (!item.hidden) visible++;
      }
      for (const group of root.querySelectorAll('[data-feature]')) {
        group.hidden = !group.querySelector('.journey-endpoint:not([hidden])');
        if (!group.hidden && (term || selected !== 'all')) group.open = true;
      }
      for (const project of root.querySelectorAll('.journey-project')) {
        project.hidden = !project.querySelector('.journey-feature:not([hidden])');
      }
      root.querySelector('[data-journey-result]').textContent = visible ? visible + '개 API 표시' : '일치하는 API가 없습니다';
    };
    search.addEventListener('input', apply);
    method.addEventListener('change', apply);
    const visualSearch = root.querySelector('[data-visual-search-input]');
    const gradeButtons = [...root.querySelectorAll('[data-visual-filter]')];
    const visualCards = [...root.querySelectorAll('.visual-stage-card')];
    let grade = 'all';
    const applyVisual = () => {
      const term = visualSearch.value.trim().toLocaleLowerCase('ko');
      let visible = 0;
      for (const card of visualCards) {
        card.hidden = (grade !== 'all' && card.dataset.visualGrade !== grade) || !card.dataset.visualSearch.includes(term);
        if (!card.hidden) visible++;
      }
      for (const chapter of root.querySelectorAll('.visual-chapter')) {
        chapter.hidden = !chapter.querySelector('.visual-stage-card:not([hidden])');
        if (!chapter.hidden && (term || grade !== 'all')) chapter.open = true;
      }
      root.querySelector('[data-visual-result]').textContent = visible ? visible + '개 단계 표시' : '일치하는 단계가 없습니다';
    };
    visualSearch.addEventListener('input', applyVisual);
    function chooseGrade(button, save) {
      grade = button.dataset.visualFilter;
      for (const other of gradeButtons) { other.setAttribute('aria-pressed', String(other === button)); other.tabIndex = other === button ? 0 : -1; }
      applyVisual();
      if (save) {
        history.pushState(history.state, '', '#visual-grade-' + grade);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
    }
    function restoreGrade() {
      const selected = location.hash.match(/^#visual-grade-(all|basic|intermediate|advanced)$/)?.[1] || 'all';
      chooseGrade(gradeButtons.find(button => button.dataset.visualFilter === selected), false);
    }
    for (const [index, button] of gradeButtons.entries()) {
      button.addEventListener('click', () => chooseGrade(button, true));
      button.addEventListener('keydown', event => {
        const next = event.key === 'ArrowRight' ? (index + 1) % gradeButtons.length : event.key === 'ArrowLeft' ? (index + gradeButtons.length - 1) % gradeButtons.length : event.key === 'Home' ? 0 : event.key === 'End' ? gradeButtons.length - 1 : null;
        if (next === null) return;
        event.preventDefault(); chooseGrade(gradeButtons[next], true); gradeButtons[next].focus({ preventScroll:true });
      });
    }
    window.addEventListener('popstate', restoreGrade);
    window.addEventListener('hashchange', restoreGrade);
    restoreGrade();
    for (const button of root.querySelectorAll('[data-journey-grade]')) button.addEventListener('click', () => {
      const matching = gradeButtons.find((item) => item.dataset.visualFilter === button.dataset.journeyGrade);
      matching?.click();
    });
  })();
  </script>`;
}
