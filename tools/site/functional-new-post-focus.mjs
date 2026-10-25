import { getFunctionalVisualModel } from './functional-visual-model.mjs';

const clone = value => JSON.parse(JSON.stringify(value));
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const CORE = ['id', 'board', 'author', 'title', 'content', 'status', 'visibility', 'tags'];
const CAPTIONS = {
  before: '생성 전 · 이 선언문 실행 직전입니다. 지역 변수 post에는 아직 참조가 대입되지 않았고, 이번 Post와 Set은 없습니다.',
  after: '생성 후 · 새 Post와 빈 Set을 만들고 post에 참조를 대입했습니다. 아직 태그 해석과 save 전입니다.',
};
const EDGES = [
  ['local-post', 'local-post', 'post-object'], ['title', 'input-title', 'field-title'],
  ['content', 'input-content', 'field-content'], ['board', 'field-board', 'ref-board'],
  ['author', 'field-author', 'ref-author'], ['tags', 'field-tags', 'ref-tags'],
];

// 기존 모델의 before도 생성 후다. 여기서는 실행 전 상태를 별도로 만든다.
export function getFunctionalNewPostFocusModel() {
  const object = clone(getFunctionalVisualModel('create', 'new-object').after.object);
  object.tags = { $ref: 'LinkedHashSet@S' };
  return {
    before: { local: { name: 'post', assigned: false }, object: null, collection: null },
    after: {
      local: { name: 'post', assigned: true, ref: 'Post@P' }, object,
      collection: { id: 'LinkedHashSet@S', type: 'Set<Tag>', elements: [] },
    },
    inputs: { title: object.title, content: object.content, visibility: object.visibility, now: 't0' },
    references: { board: { ref: 'Board@B', id: 'idB' }, author: { ref: 'Member@U', id: 'idU' } },
    dbDelta: { post: 0, tag: 0, post_tag: 0 },
  };
}

export function renderFunctionalNewPostFocus({ idPrefix = 'new-post', image = '' } = {}) {
  if (!/^[a-zA-Z0-9_-]+$/.test(String(idPrefix))) throw new RangeError('idPrefix는 영문·숫자·밑줄·하이픈으로 지정하세요.');
  const prefix = `fnp-${idPrefix}`;
  const model = getFunctionalNewPostFocusModel();
  const source = String(image);
  // 통합 renderer가 검증한 상대 경로만 받는다. 원본 열기도 실행 가능한 URL을 받지 않는다.
  const safeImage = source && !/[\u0000-\u001f\u007f]/.test(source) && !source.includes('\\') && !/^[\s\\/]*\/|^[\s]*[a-z][a-z\d+.-]*:/i.test(source) ? source : '';
  const fieldValue = value => value === null ? 'null' : typeof value === 'object' ? value.$ref : String(value);
  const row = (field, major = true) => `<div class="fnp-field" data-fnp-field="${field}"><dt${major && ['title', 'content'].includes(field) ? ` data-fnp-anchor="field-${field}"` : ''}><code>${field}</code></dt><dd${major && !['title', 'content'].includes(field) ? ` data-fnp-anchor="field-${field}"` : ''}><code>${esc(fieldValue(model.after.object[field]))}</code>${['board', 'author', 'tags'].includes(field) ? `<small class="fnp-ref-label">→ ${field === 'tags' ? '새 Set' : '기존 참조'} ${esc(fieldValue(model.after.object[field]))}</small>` : field === 'title' || field === 'content' ? `<small class="fnp-ref-label">← request.${field}()</small>` : ''}</dd></div>`;
  const refs = (fromPost = true) => `<section class="fnp-reference" aria-label="기존 Board 참조"><p>기존 참조 · board</p><h4 data-fnp-anchor="ref-board">Board@B</h4><code>id = idB</code><small>${fromPost ? 'Post.board' : 'board'} → Board@B</small></section><section class="fnp-reference" aria-label="기존 Member 참조"><p>기존 참조 · author</p><h4 data-fnp-anchor="ref-author">Member@U</h4><code>id = idU</code><small>${fromPost ? 'Post.author' : 'author'} → Member@U</small></section>`;
  const choice = (kind, values, selected) => values.map(([value, label]) => `<button class="fnp-choice" id="${prefix}-${kind}-${value}" type="button" role="tab" data-fnp-${kind}="${value}" aria-selected="${value === selected}" tabindex="${value === selected ? 0 : -1}" aria-controls="${prefix}-${kind === 'phase' ? `state-${value}` : value}">${label}</button>`).join('');
  const imagePane = safeImage ? `<figure class="fnp-figure"><img src="${esc(safeImage)}" width="1536" height="1024" alt="생성 후 Post@P의 주요 8개 필드, 기존 Board와 Member 참조, 새 빈 LinkedHashSet과 이번 new의 DB 행 증가 0을 보여 주는 그림" loading="lazy"><figcaption>생성 후 · 태그 해석과 save 전의 그림입니다. <a href="${esc(safeImage)}" target="_blank" rel="noopener noreferrer">원본 그림 열기</a></figcaption></figure>` : '<p class="fnp-image-missing">이 페이지에는 원본 그림이 연결되지 않았습니다. 직접 비교에서 같은 값을 확인할 수 있습니다.</p>';
  return `<section class="fnp" data-fnp-root data-fnp-view-active="compare" data-fnp-phase-active="after">
<button class="fnp-open" id="${prefix}-open" type="button" data-fnp-open disabled aria-haspopup="dialog" aria-controls="${prefix}-dialog" aria-describedby="${prefix}-status">new Post가 만드는 것 보기 <span>선택 학습</span></button>
<p class="fnp-status" id="${prefix}-status" data-fnp-status role="status">설명 패널을 준비 중입니다.</p>
<dialog class="fnp-dialog" id="${prefix}-dialog" aria-labelledby="${prefix}-title" aria-describedby="${prefix}-scope" data-fnp-dialog>
<div class="fnp-sheet">
<header class="fnp-header"><div><p class="fnp-kicker">현재 과제 · 게시글 작성 <span class="fnp-fixed">고정 예시</span></p><h2 id="${prefix}-title"><span>new Post</span>가 만드는 것</h2></div><button class="fnp-close" type="button" data-fnp-close autofocus>닫기 <span aria-hidden="true">×</span></button></header>
<div class="fnp-controls"><div class="fnp-tabs" role="tablist" aria-label="new Post 설명 보기">${choice('view', [['image', '그림으로 보기'], ['compare', '직접 비교']], 'compare')}</div><div class="fnp-phase-bar"><span>시점</span><div class="fnp-tabs" role="tablist" aria-label="new Post 실행 시점">${choice('phase', [['before', '생성 전'], ['after', '생성 후']], 'after')}</div></div></div>
<div class="fnp-image" id="${prefix}-image" data-fnp-image role="tabpanel" aria-labelledby="${prefix}-view-image" hidden>${imagePane}</div>
<div class="fnp-compare" id="${prefix}-compare" data-fnp-compare role="tabpanel" aria-labelledby="${prefix}-view-compare">
<p class="fnp-phase-caption" data-fnp-phase-caption role="status">${CAPTIONS.after}</p>
<section class="fnp-code" aria-label="PostService create 생성 코드"><h3>PostService#create</h3><pre><code>Post post = <strong>new</strong> Post(board, author, request.title(), request.content(),
    <span>"PUBLISHED"</span>, visibility, now);</code></pre><p><code>visibility = "PUBLIC" · now = t0</code></p></section>
<div class="fnp-before" id="${prefix}-state-before" data-fnp-state="before" data-fnp-phase-panel="before" role="tabpanel" aria-labelledby="${prefix}-phase-before" hidden>
<div class="fnp-before-grid"><section class="fnp-inputs"><h3>생성자로 전달할 값</h3><p><code>request.title()</code> → 새 게시글</p><p><code>request.content()</code> → 본문</p><p><code>board</code> → Board@B</p><p><code>author</code> → Member@U</p></section><section class="fnp-not-created"><h3>지역 변수 post · 참조 미대입</h3><p>아직 Post@P와 LinkedHashSet@S는 없습니다.</p><p>post를 null로 초기화했다는 뜻이 아닙니다. 이 선언문의 오른쪽 생성식이 실행되기 전입니다.</p></section><div class="fnp-references">${refs(false)}</div></div>
</div>
<div class="fnp-after" id="${prefix}-state-after" data-fnp-state="after" data-fnp-phase-panel="after" role="tabpanel" aria-labelledby="${prefix}-phase-after">
<div class="fnp-graph" data-fnp-graph><div class="fnp-input-column"><section class="fnp-local"><h3>지역 변수</h3><p data-fnp-anchor="local-post"><code>post</code><span> → Post@P</span></p></section><section class="fnp-inputs"><h3>생성자로 전달한 값</h3><div class="fnp-input"><code>request.title()</code><strong data-fnp-anchor="input-title">새 게시글</strong><small>→ Post.title</small></div><div class="fnp-input"><code>request.content()</code><strong data-fnp-anchor="input-content">본문</strong><small>→ Post.content</small></div></section></div>
<section class="fnp-object"><header><h3 data-fnp-anchor="post-object">Post@P</h3><span>새 Post 인스턴스 · 주요 필드</span></header><dl class="fnp-fields">${CORE.map(field => row(field)).join('')}</dl></section>
<div class="fnp-references">${refs()}<section class="fnp-reference fnp-set" aria-label="새 Set"><p>새 Set · 필드 초기화로 생성</p><h4 data-fnp-anchor="ref-tags">LinkedHashSet@S</h4><strong>원소 0개</strong><small>Post.tags → LinkedHashSet@S</small><code>Set&lt;Tag&gt;</code></section></div>
<svg class="fnp-connectors" data-fnp-connectors aria-hidden="true" focusable="false"><defs><marker id="${prefix}-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M 0 0 L 8 4 L 0 8 Z"></path></marker></defs>${EDGES.map(([name, from, to]) => `<path data-fnp-edge="${name}" data-fnp-from="${from}" data-fnp-to="${to}" marker-end="url(#${prefix}-arrow)"></path>`).join('')}</svg>
</div>
<details class="fnp-extra"><summary>Post의 나머지 7개 필드 · 카운터와 시각</summary><dl class="fnp-fields">${Object.keys(model.after.object).filter(field => !CORE.includes(field)).map(field => row(field, false)).join('')}</dl><p><code>tags</code>의 빈 Set은 <code>private Set&lt;Tag&gt; tags = new LinkedHashSet&lt;&gt;();</code> 필드 초기화로 만듭니다.</p></details>
</div>
<section class="fnp-delta" aria-label="이번 new가 추가한 DB 행"><h3>이번 <span>new</span>가 추가한 DB 행</h3><dl>${Object.entries(model.dbDelta).map(([table, count]) => `<div><dt><code>${table}</code></dt><dd>${count}</dd></div>`).join('')}</dl></section>
<p class="fnp-boundary">기존 board/member 행과 앞선 조회는 표시 범위 밖입니다. 0은 DB 전체가 비었다는 뜻이 아닙니다. 이 한 줄에는 태그 해석·save·영속화·INSERT·commit·201 응답·id 생성이 포함되지 않습니다.</p>
</div>
<p class="fnp-scope" id="${prefix}-scope"><code>new Post(...)</code> 한 줄의 실행 전후에서 입력값·지역 변수·객체 참조를 비교합니다. 설명용 고정값이며 내 서버의 입력과 실행 결과를 읽지 않습니다.</p>
<footer class="fnp-symbols">Post@P · Board@B · Member@U · LinkedHashSet@S와 idB · idU · t0는 실제 주소·키·시각이 아닌 설명 기호입니다. 기존 참조의 나머지 필드와 로딩 상태는 표시하지 않습니다.</footer>
</div></dialog></section>`;
}

export function initFunctionalNewPostFocus(doc, win) {
  if (!doc || !win) return;
  for (const root of doc.querySelectorAll('[data-fnp-root]')) {
    if (root.dataset.fnpInitialized) continue;
    root.dataset.fnpInitialized = 'true';
    const dialog = root.querySelector('[data-fnp-dialog]');
    const openButton = root.querySelector('[data-fnp-open]');
    const closeButton = root.querySelector('[data-fnp-close]');
    const status = root.querySelector('[data-fnp-status]');
    const fail = () => { openButton.disabled = true; status.textContent = '이 환경에서는 설명 패널을 열 수 없습니다.'; };
    if (!dialog || !openButton || !closeButton || !status) continue;
    if (typeof dialog.showModal !== 'function' || typeof dialog.close !== 'function') { fail(); continue; }
    const compare = root.querySelector('[data-fnp-compare]');
    const imagePane = root.querySelector('[data-fnp-image]');
    const phaseBar = root.querySelector('.fnp-phase-bar');
    const graph = root.querySelector('[data-fnp-graph]');
    const svg = graph.querySelector('[data-fnp-connectors]');
    let frame = null;
    let observer = null;
    function active() {
      return dialog.open && !graph.closest('[hidden]');
    }
    function updatePaths() {
      if (!active()) return;
      // 모바일은 명시한 참조 라벨을 읽는다. 숨긴 SVG 때문에 geometry를 측정하지 않는다.
      if (typeof win.matchMedia === 'function' && win.matchMedia('(max-width: 900px)').matches) return;
      const area = graph.getBoundingClientRect();
      if (!(area.width > 0 && area.height > 0)) return;
      svg.setAttribute('viewBox', `0 0 ${area.width} ${area.height}`);
      for (const path of svg.querySelectorAll('[data-fnp-edge]')) {
        const from = graph.querySelector(`[data-fnp-anchor="${path.dataset.fnpFrom}"]`).getBoundingClientRect();
        const to = graph.querySelector(`[data-fnp-anchor="${path.dataset.fnpTo}"]`).getBoundingClientRect();
        if (!(from.width > 0 && from.height > 0 && to.width > 0 && to.height > 0)) { path.removeAttribute('d'); continue; }
        const x1 = from.right - area.left, y1 = from.top + from.height / 2 - area.top;
        const x2 = to.left - area.left, y2 = to.top + to.height / 2 - area.top;
        const middle = (x1 + x2) / 2;
        path.setAttribute('d', `M ${x1} ${y1} C ${middle} ${y1}, ${middle} ${y2}, ${x2} ${y2}`);
      }
    }
    function schedule() {
      if (!active() || frame !== null) return;
      if (typeof win.requestAnimationFrame !== 'function') { updatePaths(); return; }
      frame = win.requestAnimationFrame(() => { frame = null; updatePaths(); });
    }
    function stop() {
      if (frame !== null && typeof win.cancelAnimationFrame === 'function') win.cancelAnimationFrame(frame);
      frame = null;
      observer?.disconnect();
    }
    function resume() { if (active()) { observer?.observe(graph); schedule(); } else stop(); }
    function select(kind, value, focus = false) {
      const buttons = [...root.querySelectorAll(`[data-fnp-${kind}]`)];
      if (!buttons.some(button => button.dataset[`fnp${kind === 'view' ? 'View' : 'Phase'}`] === value)) return;
      root.dataset[kind === 'view' ? 'fnpViewActive' : 'fnpPhaseActive'] = value;
      for (const button of buttons) {
        const selected = button.getAttribute(`data-fnp-${kind}`) === value;
        button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
        if (selected && focus) button.focus();
      }
      if (kind === 'view') { compare.hidden = value !== 'compare'; imagePane.hidden = value !== 'image'; if (phaseBar) phaseBar.hidden = value !== 'compare'; }
      else {
        for (const pane of root.querySelectorAll('[data-fnp-state]')) pane.hidden = pane.dataset.fnpState !== value;
        root.querySelector('[data-fnp-phase-caption]').textContent = CAPTIONS[value];
      }
      resume();
    }
    if (typeof win.ResizeObserver === 'function') observer = new win.ResizeObserver(schedule);
    for (const kind of ['view', 'phase']) {
      const buttons = [...root.querySelectorAll(`[data-fnp-${kind}]`)];
      buttons.forEach((button, index) => {
        button.addEventListener('click', () => select(kind, button.getAttribute(`data-fnp-${kind}`)));
        button.addEventListener('keydown', event => {
          const next = event.key === 'ArrowRight' ? (index + 1) % buttons.length
            : event.key === 'ArrowLeft' ? (index + buttons.length - 1) % buttons.length
            : event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : undefined;
          if (next === undefined) return;
          event.preventDefault(); select(kind, buttons[next].getAttribute(`data-fnp-${kind}`), true);
        });
      });
    }
    dialog.addEventListener('keydown', event => {
      if (!dialog.open || event.key !== 'Tab') return;
      const stops = [...dialog.querySelectorAll('button:not([disabled]), a[href], summary, [tabindex]')].filter(element => {
        if (element.tabIndex < 0 || element.closest('[hidden]')) return false;
        const collapsed = element.closest('details:not([open])');
        return !collapsed || element === collapsed.querySelector('summary');
      });
      const first = stops[0], last = stops.at(-1);
      if (!first) return;
      if (event.shiftKey && doc.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    dialog.addEventListener('close', () => { stop(); openButton.focus(); });
    closeButton.addEventListener('click', () => dialog.close());
    dialog.addEventListener('cancel', event => { event.preventDefault(); dialog.close(); });
    openButton.addEventListener('click', () => {
      if (dialog.open) return;
      try { dialog.showModal(); closeButton.focus(); resume(); }
      catch { stop(); fail(); }
    });
    win.addEventListener('resize', schedule);
    openButton.disabled = false;
    status.textContent = '선택해서 여는 설명용 패널입니다.';
  }
}
