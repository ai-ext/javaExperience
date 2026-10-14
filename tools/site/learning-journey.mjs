const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const story = [
  { step: '01', method: 'POST', label: '게시글 작성', detail: '새 글을 저장하고 id를 받는다', stage: '1-1' },
  { step: '02', method: 'GET', label: '게시글 조회', detail: '같은 id로 저장 결과를 읽는다', stage: '2-1' },
  { step: '03', method: 'PATCH', label: '게시글 수정', detail: '작성한 글의 일부를 바꾼다', stage: '3-1' },
  { step: '04', method: 'PUT', label: '좋아요', detail: '그 글에 회원의 반응을 남긴다', stage: '4-1' },
  { step: '05', method: 'POST', label: '댓글 작성', detail: '같은 글 아래 대화를 잇는다', stage: '5-1' },
  { step: '06', method: 'PUT', label: '북마크', detail: '나중에 볼 글로 저장한다', stage: '6-1' },
];

const concepts = [
  { id: 'W01', label: 'API 개발 순서', file: 'W01-api-dev-order', note: '무엇부터 구현할까' },
  { id: 'W09', label: 'DTO', file: 'W09-why-dto', note: '요청과 응답의 모양' },
  { id: 'P20', label: 'JPA 엔티티', file: 'P20-jpa-entity-mapping', note: 'Java 객체와 DB 연결' },
  { id: 'R04', label: 'SQL', file: 'R04-sql-crud-join', note: '데이터 저장과 조회' },
  { id: 'S08', label: '트랜잭션', file: 'S08-transactions', note: '여러 저장을 한 작업으로' },
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
  const storyMarkup = story.map((item) => {
    const href = levelHref(item.stage);
    if (!href) throw new Error(`API 여정의 ${item.stage} 단계가 없다`);
    return `<a class="journey-step" href="${esc(href)}"><span class="journey-step-number">${item.step}</span><span class="journey-method method-${methodClass(item.method)}">${item.method}</span><strong>${item.label}</strong><small>${item.detail}</small><span class="journey-step-link">${item.stage} 단계 열기 <span aria-hidden="true">↗</span></span></a>`;
  }).join('');
  const conceptMarkup = concepts.map((item) => `<a href="../docs/knowledge/${esc(item.file)}.html"><span>${esc(item.id)}</span><strong>${esc(item.label)}</strong><small>${esc(item.note)}</small><span aria-hidden="true">↗</span></a>`).join('');
  const chapterMarkup = chapters.map((chapter) => {
    const levels = chapter.levels.filter((level) => level.file);
    const href = levelHref(levels[0]?.id);
    if (!href) return '';
    return `<a class="journey-chapter" href="${esc(href)}"><span>${esc(chapter.title.split(' — ')[0])}</span><strong>${esc(chapter.title.split(' — ')[1] || chapter.title)}</strong><small>${levels.length}개 단계 · ${esc(levels[0].id)}부터</small></a>`;
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
    <div class="journey-hero"><div><p class="journey-eyebrow">JAVA API LEARNING PATH</p><h2 id="journey-title">게시글 하나로 백엔드의 전체 흐름 보기</h2><p>글을 만들고 받은 <code>id</code>로 조회·수정·반응을 이어 갑니다. 카드를 누르면 해당 API 시나리오로 이동합니다.</p><div class="journey-stats"><span><b>${count}</b> 학습 단계</span><span><b>${routesCount}</b> API 매핑</span><span><b>${chapters.length}</b> 기능 묶음</span></div></div><div class="journey-post" aria-label="하나의 게시글을 여러 API가 함께 다루는 예시"><span class="journey-post-top">COMMUNITY POST</span><strong>나의 첫 Spring 게시글</strong><p>POST 응답의 <code>id</code>가 다음 요청의 경로가 됩니다.</p><div><span>♡ 좋아요</span><span>▤ 댓글</span><span>♧ 북마크</span></div></div></div>
    <div class="journey-story-head"><h3>한 글에서 이어지는 6개 기능</h3><a href="#journey-all-apis">전체 API 찾아보기 ↓</a></div><div class="journey-story">${storyMarkup}</div>
    <div class="journey-concepts"><div><strong>이 흐름의 핵심 개념</strong><small>API를 만들다가 막히는 지점에서 바로 열어 보세요.</small></div>${conceptMarkup}</div>
    <details class="journey-chapters"><summary>장별 학습 경로 보기 <span>${chapters.length}개 기능 묶음 · 기초부터 고급까지</span></summary><div class="journey-chapter-grid">${chapterMarkup}</div></details>
    <div class="journey-browser" id="journey-all-apis"><div class="journey-browser-head"><div><p class="journey-eyebrow">API EXPLORER</p><h3>구현할 API 찾아보기</h3><p>기능을 펼쳐 경로를 고르세요. 각 경로는 해당 단계의 Controller·Service·Repository 흐름으로 이어집니다.</p></div><a href="#api-map-title">전체 구조도 보기 ↗</a></div><div class="journey-controls"><label>API 검색 <input type="search" data-journey-search placeholder="경로·기능·단계 검색" autocomplete="off"></label><label>HTTP 메서드 <select data-journey-method><option value="all">전체</option><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select></label></div><p class="journey-result" data-journey-result aria-live="polite">${routesCount}개 API</p><div class="journey-projects">${routeMarkup}</div></div>
  </section><script>
  (() => {
    const root = document.querySelector('.learning-journey');
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
  })();
  </script>`;
}
