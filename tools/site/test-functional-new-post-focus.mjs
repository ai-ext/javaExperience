import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { getFunctionalVisualModel } from './functional-visual-model.mjs';
import { getFunctionalNewPostFocusModel, renderFunctionalNewPostFocus, initFunctionalNewPostFocus } from './functional-new-post-focus.mjs';

const image = '../../docs/design/scenario-crud-2026-10-20/images/V06-new-post-focus-v1.jpg';
function mount({ native = true, failure = false, extra = '' } = {}) {
  const dom = new JSDOM(extra + renderFunctionalNewPostFocus({ idPrefix: 'test', image }), { url: 'https://example.test/create.html' });
  const doc = dom.window.document, win = dom.window;
  const root = doc.querySelector('[data-fnp-root]');
  const dialog = root.querySelector('dialog');
  let shows = 0;
  if (native) {
    dialog.showModal = () => { shows++; if (failure) throw new Error('unsupported context'); dialog.open = true; };
    dialog.close = () => { dialog.open = false; dialog.dispatchEvent(new win.Event('close')); };
  } else dialog.showModal = undefined;
  return { dom, doc, win, root, dialog, shows: () => shows, open: root.querySelector('[data-fnp-open]') };
}
const click = (root, selector) => root.querySelector(selector).click();

test('생성 전은 미대입이며 생성 후 15필드와 새 Set을 정본에서 복제한다', () => {
  const canonical = getFunctionalVisualModel('create', 'new-object');
  const snapshot = structuredClone(canonical);
  const model = getFunctionalNewPostFocusModel();
  assert.equal(model.before.object, null);
  assert.equal(model.before.collection, null);
  assert.deepEqual(model.before.local, { name: 'post', assigned: false });
  assert.deepEqual(model.after.local, { name: 'post', assigned: true, ref: 'Post@P' });
  assert.equal(Object.keys(model.after.object).length, 15);
  assert.deepEqual(model.after.object, { ...canonical.after.object, tags: { $ref: 'LinkedHashSet@S' } });
  assert.deepEqual(model.after.collection, { id: 'LinkedHashSet@S', type: 'Set<Tag>', elements: [] });
  assert.deepEqual(model.dbDelta, { post: 0, tag: 0, post_tag: 0 });
  assert.equal(model.after.object.id, null);
  assert.equal(model.after.object.deletedAt, null);
  for (const key of ['viewCount', 'likeCount', 'commentCount']) assert.equal(model.after.object[key], 0);
  for (const key of ['publishedAt', 'createdAt', 'updatedAt']) assert.equal(model.after.object[key], 't0');
  model.after.object.title = 'mutated'; model.after.collection.elements.push('mutated');
  assert.deepEqual(getFunctionalVisualModel('create', 'new-object'), snapshot);
  assert.equal(getFunctionalNewPostFocusModel().after.object.title, '새 게시글');
});

test('마크업은 명시적 disabled 진입, dialog 이름, 고유 ID와 안전한 이미지 속성을 갖는다', () => {
  const html = renderFunctionalNewPostFocus({ idPrefix: 'a', image: 'picture.png" onerror="alert(1)' }) + renderFunctionalNewPostFocus({ idPrefix: 'b', image });
  const doc = new JSDOM(html).window.document;
  const ids = [...doc.querySelectorAll('[id]')].map(n => n.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every(id => id.startsWith('fnp-')));
  for (const entry of doc.querySelectorAll('[data-fnp-open]')) { assert.equal(entry.type, 'button'); assert.equal(entry.disabled, true); }
  for (const dialog of doc.querySelectorAll('dialog')) assert.equal(doc.getElementById(dialog.getAttribute('aria-labelledby')).textContent, 'new Post가 만드는 것');
  assert.equal(doc.querySelector('[onerror]'), null);
  assert.equal(doc.querySelectorAll('[data-fnp-field]').length, 30);
  assert.match(doc.querySelector('summary').textContent, /나머지 7개 필드/);
  assert.match(doc.body.textContent, /설명용 고정값/);
  assert.match(doc.querySelector('pre').textContent, /new Post\(board, author, request.title\(\), request.content\(\),\s*"PUBLISHED", visibility, now\)/);
  assert.equal(doc.querySelector('img').getAttribute('src'), 'picture.png" onerror="alert(1)');
  assert.doesNotMatch(doc.body.textContent, /nickname/);
  assert.throws(() => renderFunctionalNewPostFocus({ idPrefix: 'bad"', image }), RangeError);
  assert.equal(new JSDOM(renderFunctionalNewPostFocus({ image: 'javascript:alert(1)' })).window.document.querySelector('img'), null);
});

test('초기화만으로 열리지 않고 중복 초기화 후에도 명시 열기/닫기/Escape와 진입 focus 복귀', () => {
  const m = mount();
  initFunctionalNewPostFocus(m.doc, m.win); initFunctionalNewPostFocus(m.doc, m.win);
  assert.equal(m.shows(), 0); assert.equal(m.open.disabled, false);
  m.open.focus(); m.open.click(); assert.equal(m.shows(), 1); assert.equal(m.dialog.open, true);
  assert.equal(m.doc.activeElement, m.root.querySelector('[data-fnp-close]'));
  click(m.root, '[data-fnp-close]'); assert.equal(m.dialog.open, false); assert.equal(m.doc.activeElement, m.open);
  m.open.click();
  const cancel = new m.win.Event('cancel', { cancelable: true });
  m.dialog.dispatchEvent(cancel);
  assert.equal(cancel.defaultPrevented, true); assert.equal(m.dialog.open, false); assert.equal(m.doc.activeElement, m.open);
  m.dom.window.close();
});

test('native dialog 미지원과 showModal 실패는 비활성 안내로 끝난다', () => {
  for (const options of [{ native: false }, { failure: true }]) {
    const m = mount(options); initFunctionalNewPostFocus(m.doc, m.win);
    if (options.failure) m.open.click();
    assert.equal(m.open.disabled, true); assert.equal(m.dialog.open, false);
    assert.match(m.root.querySelector('[data-fnp-status]').textContent, /열 수 없/);
    m.dom.window.close();
  }
});

test('열린 패널의 Tab 경계는 현재 보기에 보이는 요소 사이에서 순환한다', () => {
  const m = mount(); initFunctionalNewPostFocus(m.doc, m.win); m.open.click();
  const close = m.root.querySelector('[data-fnp-close]');
  const forward = () => {
    const event = new m.win.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    m.doc.activeElement.dispatchEvent(event); return event;
  };
  const backward = () => {
    const event = new m.win.KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
    m.doc.activeElement.dispatchEvent(event); return event;
  };
  for (const [view, phase, lastSelector] of [
    ['compare', 'after', '[data-fnp-state="after"] summary'],
    ['compare', 'before', '[data-fnp-phase="before"]'],
    ['image', 'after', '[data-fnp-image] a'],
  ]) {
    click(m.root, `[data-fnp-view="${view}"]`);
    if (view === 'compare') click(m.root, `[data-fnp-phase="${phase}"]`);
    const last = m.root.querySelector(lastSelector);
    last.focus(); assert.equal(forward().defaultPrevented, true);
    assert.equal(m.doc.activeElement, close, `${view}/${phase}: 마지막에서 닫기로 복귀`);
    assert.equal(backward().defaultPrevented, true);
    assert.equal(m.doc.activeElement, last, `${view}/${phase}: 숨겨진 보기·접힌 본문은 제외`);
  }
  click(m.root, '[data-fnp-close]');
  assert.equal(m.doc.activeElement, m.open);
  m.dom.window.close();
});

test('직접 비교의 시점과 그림 caption은 충돌하지 않고 선택은 재열기와 resize 후 유지', () => {
  const m = mount(); initFunctionalNewPostFocus(m.doc, m.win); m.open.click();
  assert.equal(m.root.dataset.fnpViewActive, 'compare'); assert.equal(m.root.dataset.fnpPhaseActive, 'after');
  click(m.root, '[data-fnp-phase="before"]');
  const before = m.root.querySelector('[data-fnp-state="before"]');
  assert.equal(before.hidden, false); assert.match(before.textContent, /참조 미대입/);
  assert.match(m.root.querySelector('[data-fnp-phase-caption]').textContent, /생성 전/);
  assert.equal(before.querySelector('[data-fnp-field]'), null);
  assert.doesNotMatch(before.querySelector('.fnp-references').textContent, /Post\.(board|author)/, '아직 없는 Post 필드에서 참조가 시작됐다고 표시하지 않음');
  assert.match(before.querySelector('.fnp-references').textContent, /board → Board@B/);
  assert.match(before.querySelector('.fnp-references').textContent, /author → Member@U/);
  assert.match(before.textContent, /Post@P.*없|아직.*Post/s);
  click(m.root, '[data-fnp-view="image"]');
  assert.equal(m.root.querySelector('[data-fnp-compare]').hidden, true);
  assert.ok(m.root.querySelector('[data-fnp-phase]').closest('[hidden]'), '고정 그림 보기에서 생성 시점 조작은 숨긴다');
  assert.equal(m.root.querySelector('[data-fnp-image]').hidden, false);
  assert.match(m.root.querySelector('figcaption').textContent, /생성 후.*태그 해석.*save 전/);
  click(m.root, '[data-fnp-close]'); m.open.click(); m.win.dispatchEvent(new m.win.Event('resize'));
  assert.equal(m.root.dataset.fnpViewActive, 'image'); assert.equal(m.root.dataset.fnpPhaseActive, 'before');
  click(m.root, '[data-fnp-view="compare"]'); assert.equal(before.hidden, false);
  m.dom.window.close();
});

test('두 선택 그룹은 Arrow/Home/End로 이동하고 tabindex와 focus가 일치한다', () => {
  const m = mount(); initFunctionalNewPostFocus(m.doc, m.win); m.open.click();
  for (const attr of ['view', 'phase']) {
    const buttons = [...m.root.querySelectorAll(`[data-fnp-${attr}]`)];
    const selected = buttons.find(b => b.getAttribute('aria-selected') === 'true');
    selected.dispatchEvent(new m.win.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    const next = buttons.find(b => b.getAttribute('aria-selected') === 'true');
    assert.notEqual(next, selected); assert.equal(m.doc.activeElement, next);
    assert.equal(buttons.filter(b => b.tabIndex === 0).length, 1);
    next.dispatchEvent(new m.win.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    assert.equal(m.doc.activeElement, buttons.at(-1));
    buttons.at(-1).dispatchEvent(new m.win.KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    assert.equal(m.doc.activeElement, buttons[0]);
    if (attr === 'view') click(m.root, '[data-fnp-view="compare"]');
  }
  m.dom.window.close();
});

test('폼/외부 선택/HTTP/storage/history/clipboard와 설명용 고정값을 격리한다', () => {
  const extra = '<form><input name="token" value="secret"><textarea name="body">student content</textarea><input name="id" value="42"><input name="server" value="https://private.test"></form><div data-fw-status>응답 보존</div><button data-frv-field="title" aria-pressed="true">기존 선택</button>';
  const m = mount({ extra });
  const formBefore = m.doc.querySelector('form').outerHTML;
  let forbidden = 0;
  const deny = () => { forbidden++; throw new Error('접근 금지'); };
  m.win.fetch = deny; m.win.XMLHttpRequest = deny;
  for (const control of m.doc.querySelectorAll('form input, form textarea')) Object.defineProperty(control, 'value', { get: deny, set: deny });
  Object.defineProperty(m.win, 'localStorage', { get: deny }); Object.defineProperty(m.win, 'sessionStorage', { get: deny });
  Object.defineProperty(m.win, 'history', { get: deny }); Object.defineProperty(m.win.navigator, 'clipboard', { get: deny });
  initFunctionalNewPostFocus(m.doc, m.win); m.open.click();
  click(m.root, '[data-fnp-phase="before"]'); click(m.root, '[data-fnp-view="image"]'); click(m.root, '[data-fnp-view="compare"]'); click(m.root, '[data-fnp-phase="after"]'); click(m.root, '[data-fnp-close]');
  assert.equal(forbidden, 0); assert.equal(m.doc.querySelector('form').outerHTML, formBefore);
  assert.equal(m.doc.querySelector('[data-fw-status]').textContent, '응답 보존');
  assert.equal(m.doc.querySelector('[data-frv-field]').getAttribute('aria-pressed'), 'true');
  assert.match(m.root.querySelector('[data-fnp-field="title"]').textContent, /새 게시글/);
  assert.match(m.root.querySelector('[data-fnp-field="content"]').textContent, /본문/);
  m.dom.window.close();
});

test('SVG는 열린 생성 후에만 own anchors의 상대 geometry를 연결한다', () => {
  const m = mount();
  let reads = 0;
  const graph = m.root.querySelector('[data-fnp-graph]');
  graph.getBoundingClientRect = () => { reads++; return { left: 100, top: 50, width: 1000, height: 600 }; };
  for (const [i, node] of [...graph.querySelectorAll('[data-fnp-anchor]')].entries()) node.getBoundingClientRect = () => { reads++; return { left: 120 + i * 25, top: 80 + i * 20, right: 140 + i * 25, bottom: 100 + i * 20, width: 20, height: 20 }; };
  initFunctionalNewPostFocus(m.doc, m.win); assert.equal(reads, 0);
  m.open.click(); assert.ok(reads > 0);
  const svg = graph.querySelector('svg'); assert.equal(svg.getAttribute('aria-hidden'), 'true'); assert.equal(svg.getAttribute('viewBox'), '0 0 1000 600');
  assert.equal(svg.querySelectorAll('path[data-fnp-edge]').length, 6);
  const edge = svg.querySelector('path[data-fnp-edge="local-post"]'); assert.match(edge.getAttribute('d'), /^M 40 40 C /);
  assert.doesNotMatch(svg.innerHTML, /NaN|Infinity/);
  assert.equal(svg.querySelector('[data-fnp-edge="title"]').dataset.fnpFrom, 'input-title');
  assert.equal(svg.querySelector('[data-fnp-edge="board"]').dataset.fnpTo, 'ref-board');
  assert.equal(graph.querySelector('[data-fnp-anchor="field-title"]').tagName, 'DT', '입력 화살표는 필드 이름 바깥에서 끝나고 값 위를 덮지 않는다');
  click(m.root, '[data-fnp-phase="before"]'); const beforeReads = reads; m.win.dispatchEvent(new m.win.Event('resize')); assert.equal(reads, beforeReads);
  click(m.root, '[data-fnp-view="image"]'); m.win.dispatchEvent(new m.win.Event('resize')); assert.equal(reads, beforeReads);
  click(m.root, '[data-fnp-close]'); m.win.dispatchEvent(new m.win.Event('resize')); assert.equal(reads, beforeReads);
  m.dom.window.close();
});

test('모바일은 숨긴 SVG를 측정하지 않고 여러 패널의 선택도 공유하지 않는다', () => {
  const m = mount({ extra: renderFunctionalNewPostFocus({ idPrefix: 'other', image }) });
  m.win.matchMedia = () => ({ matches: true });
  const roots = [...m.doc.querySelectorAll('[data-fnp-root]')];
  let reads = 0;
  for (const root of roots) {
    root.querySelector('[data-fnp-graph]').getBoundingClientRect = () => { reads++; throw new Error('모바일 geometry 접근 금지'); };
    const dialog = root.querySelector('dialog');
    dialog.showModal = () => { dialog.open = true; };
    dialog.close = () => { dialog.open = false; dialog.dispatchEvent(new m.win.Event('close')); };
  }
  initFunctionalNewPostFocus(m.doc, m.win);
  const first = roots[0], second = roots[1];
  click(first, '[data-fnp-open]'); click(first, '[data-fnp-phase="before"]'); click(first, '[data-fnp-close]');
  assert.equal(second.dataset.fnpPhaseActive, 'after');
  click(second, '[data-fnp-open]'); assert.equal(second.querySelector('dialog').open, true); click(second, '[data-fnp-view="image"]');
  assert.equal(first.dataset.fnpViewActive, 'compare');
  m.win.dispatchEvent(new m.win.Event('resize'));
  assert.equal(reads, 0);
  m.dom.window.close();
});

test('예약된 rAF와 ResizeObserver도 닫힘/숨김 이후 geometry를 읽지 않는다', () => {
  const m = mount();
  let reads = 0, callback, observed = 0, disconnected = 0;
  m.root.querySelector('[data-fnp-graph]').getBoundingClientRect = () => { reads++; return { left: 0, top: 0, width: 800, height: 400 }; };
  m.win.requestAnimationFrame = fn => { callback = fn; return 1; };
  m.win.cancelAnimationFrame = () => {};
  m.win.ResizeObserver = class { constructor(fn) { this.fn = fn; } observe() { observed++; } disconnect() { disconnected++; } };
  initFunctionalNewPostFocus(m.doc, m.win);
  assert.equal(observed, 0);
  m.open.click(); assert.equal(observed, 1); assert.equal(reads, 0);
  const stale = callback;
  click(m.root, '[data-fnp-close]'); stale();
  assert.ok(disconnected > 0); assert.equal(reads, 0);
  m.open.click(); click(m.root, '[data-fnp-view="image"]'); callback(); assert.equal(reads, 0);
  m.dom.window.close();
});

for (const target of ['dialog', 'graph']) {
  test(`${target}.hidden 설정 중 geometry 접근은 0이며 원복하면 다시 측정한다`, () => {
    const m = mount();
    const graph = m.root.querySelector('[data-fnp-graph]');
    const hiddenTarget = target === 'dialog' ? m.dialog : graph;
    let reads = 0;
    graph.getBoundingClientRect = () => { reads++; return { left: 0, top: 0, width: 800, height: 400 }; };
    initFunctionalNewPostFocus(m.doc, m.win);
    m.open.click(); assert.equal(reads, 1);
    hiddenTarget.hidden = true;
    m.win.dispatchEvent(new m.win.Event('resize'));
    assert.equal(reads, 1, `${target}를 직접 숨긴 동안 측정하지 않는다`);
    assert.equal(m.dialog.open, true, '닫힘이 아니라 hidden을 검사한다');
    assert.equal(m.root.dataset.fnpViewActive, 'compare');
    assert.equal(m.root.dataset.fnpPhaseActive, 'after');
    hiddenTarget.hidden = false;
    m.win.dispatchEvent(new m.win.Event('resize'));
    assert.equal(reads, 2, 'hidden 원복 뒤 다시 좌표를 계산한다');
    m.dom.window.close();
  });
}

for (const [label, control] of [['newline', '\n'], ['tab', '\t']]) {
  test(`${label}로 나눈 javascript 이미지 URL을 원본 링크로 만들지 않는다`, () => {
    const dom = new JSDOM(renderFunctionalNewPostFocus({ image: `java${control}script:alert(1)` }), { url: 'https://example.test/create.html' });
    const doc = dom.window.document;
    assert.notEqual(doc.querySelector('a')?.protocol, 'javascript:', '브라우저 정규화 뒤 실행 가능한 원본 링크가 없어야 한다');
    assert.equal(doc.querySelector('a'), null);
    assert.equal(doc.querySelector('img'), null);
    dom.window.close();
  });
}

test('ASCII 제어문자는 모두 거부하고 정상 상대 PNG 경로는 보존한다', () => {
  for (const code of [...Array.from({ length: 32 }, (_, index) => index), 127]) {
    const dom = new JSDOM(renderFunctionalNewPostFocus({ image: `pic${String.fromCharCode(code)}ture.png` }));
    assert.equal(dom.window.document.querySelector('img, a'), null, `ASCII ${code}는 이미지와 링크에 쓰지 않는다`);
    dom.window.close();
  }
  const dom = new JSDOM(renderFunctionalNewPostFocus({ image }));
  assert.equal(dom.window.document.querySelector('img').getAttribute('src'), image);
  assert.equal(dom.window.document.querySelector('a').getAttribute('href'), image);
  dom.window.close();
});

// 작업 코드 패널 안에 열리는 dialog가 부모의 코드/제목 스타일을 상속받지 않아야 한다.
test('실제 작업 CSS는 현재 메서드에만 적용되고 new 설명 코드와 제목으로 새지 않는다', () => {
  const styles = ['functional-scenario.css', 'functional-new-post-focus.css'].map(file => readFileSync(new URL(file, import.meta.url), 'utf8')).join('\n');
  const dom = new JSDOM(`<style>${styles}</style><section class="fw-code-panel"><h2>현재 메서드</h2><pre><code>current()</code></pre>${renderFunctionalNewPostFocus({ idPrefix: 'css', image })}</section>`);
  const win = dom.window, doc = win.document;
  assert.equal(win.getComputedStyle(doc.querySelector('.fw-code-panel > pre')).minHeight, '142px');
  assert.notEqual(win.getComputedStyle(doc.querySelector('.fnp-code pre')).minHeight, '142px');
  assert.notEqual(win.getComputedStyle(doc.querySelector('.fnp-code pre code')).fontSize, '13px');
  assert.notEqual(win.getComputedStyle(doc.querySelector('.fnp-header h2')).backgroundColor, 'rgb(241, 246, 252)');
  dom.window.close();
});
