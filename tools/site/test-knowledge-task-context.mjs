import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { renderKnowledgeVisual } from './knowledge-visual.mjs';
import { initKnowledgeCatalog, CATALOG_RETURN_KEY, CATALOG_HISTORY_KEY } from './knowledge-catalog-controller.mjs';
import { TASKS, PROGRESS_KEY } from './home-state.mjs';

const root = new URL('../../', import.meta.url).pathname;
const fixtures = [];
const sessionOf = w => Object.fromEntries(Object.entries(w.sessionStorage));
const activeProgress = id => JSON.stringify({ version: 1, selected: 'flow-create', active: id, records: { [id]: { status: 'in-progress', scene: null, updatedAt: 'fixture' } } });
function page(url, { detail = false, session = {}, progress, history = {}, referrer, blocked = false } = {}) {
  const detailHtml = '<nav><a href="README.html" data-kc-catalog-return>개념 목록</a><a data-kc-task-return hidden></a></nav><a href="W09-why-dto.html#역할" id="concept">다른 개념</a><a href="https://outside.example/S09-jpa-hibernate.html" id="external">외부</a><a href="../../scenario/flow/read-post.html" id="scenario">다른 시나리오</a><a href="#현재절" id="anchor">현재 절</a>';
  const dom = new JSDOM(detail ? detailHtml : renderKnowledgeVisual(root), { url: new URL(url, 'https://learn.example/docs/knowledge/').href, ...(referrer ? { referrer } : {}) });
  const w = dom.window, d = w.document;
  w.scrollTo = () => {};
  w.history.replaceState(history, '');
  for (const [key, value] of Object.entries(session)) w.sessionStorage.setItem(key, value);
  if (progress) w.localStorage.setItem(PROGRESS_KEY, progress);
  if (blocked) for (const kind of ['localStorage', 'sessionStorage']) Object.defineProperty(w, kind, { get() { throw new w.DOMException('blocked', 'SecurityError'); } });
  let navigation, backs = 0;
  w.history.back = () => { backs++; };
  d.addEventListener('click', e => { if (e.target.closest('a')) e.preventDefault(); });
  initKnowledgeCatalog(d, w, { navigate: href => { navigation = href; } });
  const result = { w, d, $: s => d.querySelector(s), navigation: () => navigation, backs: () => backs };
  fixtures.push(dom);
  return result;
}
function submit(p, value) { p.$('#knowledge-search-input').value = value; p.$('.kc-search').dispatchEvent(new p.w.Event('submit', { cancelable: true })); }
function fromTask(href) { return new URL(href).searchParams.get('fromTask'); }

for (const [taskId, docId] of Object.entries({ 'flow-create': 'S09', 'flow-detail': 'W09', 'flow-list': 'S10', 'flow-update': 'W21', 'flow-delete': 'P20', 'flow-like': 'S08', 'flow-unlike': 'S08' })) {
  test(taskId + ': public caller가 다른 active보다 우선하며 검색 중에도 과제 링크를 유지한다', () => {
    const progress = activeProgress(taskId === 'flow-delete' ? 'flow-create' : 'flow-delete');
    const p = page('README.html?fromTask=' + taskId, { progress, history: { foreign: { keep: true } } });
    const link = p.$('[data-kc-task-return]');
    assert.ok(link);
    assert.equal(link.hidden, false);
    assert.equal(link.textContent, TASKS[taskId].title + ' 과제 열기 →');
    assert.equal(new URL(link.href).pathname, '/' + TASKS[taskId].href);
    assert.equal(new URL(link.href).search, '', '과제 링크에 개인 입력이나 추가 맥락을 붙이지 않음');
    assert.ok(p.$('[data-kc-context-body] [data-kc-open="' + docId + '"]'));
    assert.ok(!p.$('[data-kc-context-tag]').textContent.includes('flow-'));
    assert.equal(p.w.localStorage.getItem(PROGRESS_KEY), progress);
    submit(p, 'DTO');
    assert.equal(fromTask(p.w.location.href), taskId);
    assert.equal(link.closest('[hidden]'), null, '검색의 숨겨진 추천 영역 밖에 과제 링크 배치');
    p.$('button[data-kc-category="java"]').click();
    p.$('[data-kc-search-clear]').click();
    p.$('button[data-kc-category="all"]').click();
    assert.equal(fromTask(p.w.location.href), taskId, 'filter와 clear가 public caller를 지우지 않음');
    assert.deepEqual(p.w.history.state.foreign, { keep: true });
    assert.equal(p.w.localStorage.getItem(PROGRESS_KEY), progress, '개념 열람으로 active 진도를 바꾸지 않음');
  });
  test(taskId + ': fromTask 없이 활성 flow도 올바른 개념을 추천한다', () => {
    const p = page('README.html', { progress: activeProgress(taskId) });
    assert.ok(p.$('[data-kc-context-body] [data-kc-open="' + docId + '"]'));
    assert.ok(!p.$('[data-kc-context-tag]').textContent.includes('flow-'));
  });
}

test('직접 상세→다른 개념→목록에서도 caller를 전달하고 외부/시나리오/hash 링크는 건드리지 않는다', () => {
  const progress = activeProgress('flow-delete');
  const p = page('S09-jpa-hibernate.html?fromTask=flow-create#flush', { detail: true, progress, history: { external: 'keep' } });
  assert.equal(p.$('[data-kc-task-return]').textContent, '게시글 작성 과제 열기 →');
  assert.equal(fromTask(p.$('#concept').href), 'flow-create');
  assert.equal(decodeURIComponent(p.$('#concept').hash), '#역할');
  assert.equal(p.$('#external').getAttribute('href'), 'https://outside.example/S09-jpa-hibernate.html');
  assert.equal(p.$('#scenario').getAttribute('href'), '../../scenario/flow/read-post.html');
  assert.equal(p.$('#anchor').getAttribute('href'), '#현재절');
  assert.equal(fromTask(p.$('[data-kc-catalog-return]').href), 'flow-create');
  assert.equal(p.w.history.state[CATALOG_HISTORY_KEY], undefined, 'public caller만으로 검색 origin을 만들지 않음');
  assert.equal(p.w.history.state.external, 'keep');
  const other = page(p.$('#concept').href, { detail: true, progress });
  const catalog = page(other.$('[data-kc-catalog-return]').href, { progress });
  assert.equal(catalog.$('[data-kc-task-return]').textContent, '게시글 작성 과제 열기 →');
  submit(catalog, 'DTO');
  const snapshot = { state: structuredClone(catalog.w.history.state), href: catalog.w.location.href };
  catalog.$('button[data-kc-category="java"]').click();
  catalog.w.history.replaceState(snapshot.state, '', snapshot.href);
  catalog.w.dispatchEvent(new catalog.w.PopStateEvent('popstate', { state: snapshot.state }));
  assert.equal(fromTask(catalog.w.location.href), 'flow-create');
  assert.equal(catalog.$('#knowledge-search-input').value, 'DTO');
  assert.equal(catalog.w.localStorage.getItem(PROGRESS_KEY), progress);
});

test('public caller는 기존 일회 kcOrigin·원문 hash·kcReturn 검색 복원을 유지한다', () => {
  const p = page('README.html?fromTask=flow-update', { history: { foreign: 1 } });
  submit(p, 'DTO');
  const link = p.$('[data-kc-document="W09"] h3 a');
  link.hash = '#역할'; link.click();
  const target = new URL(p.navigation());
  assert.equal(target.searchParams.get('fromTask'), 'flow-update');
  assert.ok(target.searchParams.get('kcOrigin'));
  const detail = page(target.href, { detail: true, session: sessionOf(p.w), referrer: p.w.location.href, history: { unrelated: { keep: true } } });
  assert.ok(detail.w.history.state[CATALOG_HISTORY_KEY].origin);
  assert.deepEqual(detail.w.history.state.unrelated, { keep: true });
  assert.equal(new URL(detail.w.location.href).searchParams.get('kcOrigin'), null);
  assert.equal(fromTask(detail.w.location.href), 'flow-update');
  assert.equal(detail.w.sessionStorage.getItem(CATALOG_RETURN_KEY), null);
  assert.equal(decodeURIComponent(detail.w.location.hash), '#역할');
  const validDetailEntry = structuredClone(detail.w.history.state[CATALOG_HISTORY_KEY]);
  detail.w.history.pushState(null, '', '#다른절');
  detail.$('[data-kc-catalog-return]').click();
  const returned = new URL(detail.navigation());
  assert.equal(returned.searchParams.get('fromTask'), 'flow-update');
  assert.ok(returned.searchParams.get('kcReturn'));
  const restored = page(returned.href, { session: sessionOf(detail.w) });
  assert.equal(restored.$('#knowledge-search-input').value, 'DTO');
  assert.equal(fromTask(restored.w.location.href), 'flow-update');
  assert.equal(new URL(restored.w.location.href).searchParams.get('kcReturn'), null);
  const copied = page(target.href, { detail: true, session: sessionOf(p.w), referrer: 'https://outside.example/' });
  assert.equal(copied.w.history.state[CATALOG_HISTORY_KEY], undefined, 'public caller가 잘못된 referrer의 일회 token을 승인하지 않음');
  const changedTarget = new URL(target); changedTarget.searchParams.set('fromTask', 'flow-delete');
  const changed = page(changedTarget.href, { detail: true, session: sessionOf(p.w), referrer: p.w.location.href });
  assert.equal(changed.w.history.state[CATALOG_HISTORY_KEY], undefined, 'caller를 바꾼 URL은 원래 일회 handoff를 승인하지 않음');
  assert.equal(fromTask(changed.$('[data-kc-catalog-return]').href), 'flow-delete');
  const mixedHistory = page('W09-why-dto.html?fromTask=flow-delete', { detail: true, session: sessionOf(detail.w), history: { [CATALOG_HISTORY_KEY]: validDetailEntry } });
  assert.equal(fromTask(mixedHistory.$('[data-kc-catalog-return]').href), 'flow-delete');
  assert.equal(mixedHistory.$('[data-kc-catalog-return]').textContent, '개념 목록으로', '다른 caller의 검색 entry는 복귀 origin으로 쓰지 않음');

});

test('저장소 차단에서도 public caller 링크만 유지하며 기록을 만들지 않는다', () => {
  const p = page('S09-jpa-hibernate.html?fromTask=flow-list', { detail: true, blocked: true });
  assert.equal(p.$('[data-kc-task-return]').textContent, '게시글 목록 조회 과제 열기 →');
  assert.equal(fromTask(p.$('[data-kc-catalog-return]').href), 'flow-list');
  const catalog = page('README.html?fromTask=flow-list', { blocked: true });
  submit(catalog, 'DTO');
  assert.equal(fromTask(catalog.w.location.href), 'flow-list');
  assert.equal(catalog.$('[data-kc-task-return]').hidden, false);
});

for (const query of ['fromTask=unknown', 'fromTask=1-1', 'fromTask=__proto__', 'fromTask=flow-create&fromTask=flow-delete', 'fromTask=https%3A%2F%2Fevil.example%2Fsecret-token']) {
  test('허용되지 않은 public 맥락 거절: ' + query, () => {
    const progress = activeProgress('flow-detail');
    const p = page('README.html?' + query, { progress, history: { keep: 'foreign' } });
    assert.equal(p.$('[data-kc-task-return]').textContent, '게시글 상세 조회 과제 열기 →', '유효하지 않은 caller는 정상 active fallback');
    assert.equal(new URL(p.w.location.href).searchParams.has('fromTask'), false);
    submit(p, 'DTO');
    assert.equal(fromTask(p.w.location.href), null);
    assert.ok([...p.d.querySelectorAll('[data-kc-open]')].every(link => fromTask(link.href) === null));
    assert.equal(p.w.localStorage.getItem(PROGRESS_KEY), progress);
    assert.equal(p.w.history.state.keep, 'foreign');
    assert.ok(!JSON.stringify(sessionOf(p.w)).includes('secret-token'));
  });
}

test.after(() => { for (const dom of fixtures) dom.window.close(); });
