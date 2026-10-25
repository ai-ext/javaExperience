import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { renderKnowledgeVisual } from './knowledge-visual.mjs';
import { initKnowledgeCatalog } from './knowledge-catalog-controller.mjs';

const root = new URL('../../', import.meta.url).pathname;
const html = renderKnowledgeVisual(root);
const HISTORY_KEY = '__javaExperienceKnowledge';
const fixtures = [];

function page(url = 'README.html', { history = {}, session = {} } = {}) {
  const dom = new JSDOM(html, { url: new URL(url, 'https://learn.example/docs/knowledge/').href });
  const win = dom.window;
  win.history.replaceState(history, '');
  win.scrollTo = () => {};
  for (const [key, value] of Object.entries(session)) win.sessionStorage.setItem(key, value);
  initKnowledgeCatalog(win.document, win, { navigate: () => {} });
  const result = {
    win, doc: win.document,
    $: (selector) => win.document.querySelector(selector),
    visible: () => [...win.document.querySelectorAll('[data-kc-document]')].filter((row) => !row.hidden),
  };
  fixtures.push(result);
  return result;
}

const select = (p, selector, value) => {
  p.$(selector).value = value;
  p.$(selector).dispatchEvent(new p.win.Event('change', { bubbles: true }));
};
const search = (p, value) => {
  p.$('#knowledge-search-input').value = value;
  p.$('.kc-search').dispatchEvent(new p.win.Event('submit', { bubbles: true, cancelable: true }));
};
const close = () => fixtures.splice(0).forEach(({ win }) => win.close());

test('기본 진입은 필수 기초이며 CORE_UNITS 여섯 링크가 학습 순서에 보인다', () => {
  const p = page();
  assert.equal(p.$('[data-kc-priority]').value, 'required');
  assert.equal(p.$('[data-kc-depth]').value, 'foundation');
  assert.equal(new URL(p.win.location.href).searchParams.get('category'), 'all');
  assert.equal(new URL(p.win.location.href).searchParams.get('priority'), 'required');
  assert.equal(new URL(p.win.location.href).searchParams.get('depth'), 'foundation');
  assert.deepEqual(p.visible().slice(0, 6).map((row) => row.dataset.kcDocument), ['P09', 'P01', 'P03', 'P12', 'W19', 'S01']);
  const units = [...p.$('#kc-sequence').querySelectorAll('[data-kc-unit]')];
  assert.deepEqual(units.map((link) => link.dataset.kcUnit), ['C01', 'C02', 'C03', 'C04', 'C05', 'C06']);
  assert.equal(units.find((link) => link.dataset.kcUnit === 'C04').dataset.kcSource, 'P12');
  assert.equal(units.find((link) => link.dataset.kcUnit === 'C05').dataset.kcSource, 'W19');
  assert.deepEqual(units.find((link) => link.dataset.kcUnit === 'C04').dataset.kcPrerequisites.split(' '), ['C01', 'C02', 'C03']);
  assert.equal(p.$('[data-kc-evidence-status]').textContent.includes('전수 리서치 완료'), false);
});

test('6개 분야·필수성·깊이 조합으로 탐색하고 직접 q URL은 전체 조건으로 연다', () => {
  const p = page('?q=DTO');
  assert.equal(p.$('[data-kc-category-select]').value, 'all');
  assert.equal(p.$('[data-kc-priority]').value, 'all');
  assert.equal(p.$('[data-kc-depth]').value, 'all');
  assert.ok(p.visible().length > 0);
  for (const priority of ['required', 'optional']) {
    select(p, '[data-kc-priority]', priority);
    assert.ok(p.visible().every((row) => row.dataset.kcPriority === priority));
    for (const depth of ['foundation', 'applied', 'advanced']) {
      select(p, '[data-kc-depth]', depth);
      assert.ok(p.visible().every((row) => row.dataset.kcDepths.split(' ').includes(depth)));
    }
  }
  select(p, '[data-kc-priority]', 'all'); select(p, '[data-kc-depth]', 'all');
  for (const domain of ['java', 'spring', 'request', 'data', 'testing', 'delivery']) {
    select(p, '[data-kc-category-select]', domain);
    assert.ok(p.visible().every((row) => row.dataset.kcCategory === domain));
  }
});

test('URL·history entry·뒤로/앞으로·새로고침에 선택한 필터와 검색 초안을 보존한다', async () => {
  const p = page();
  select(p, '[data-kc-priority]', 'optional');
  select(p, '[data-kc-depth]', 'advanced');
  select(p, '[data-kc-category-select]', 'testing');
  search(p, 'Mockito');
  const state = p.win.history.state[HISTORY_KEY];
  assert.equal(state.priorityId, 'optional'); assert.equal(state.depthId, 'advanced'); assert.equal(state.categoryId, 'testing');
  const url = new URL(p.win.location.href);
  assert.equal(url.searchParams.get('priority'), 'optional'); assert.equal(url.searchParams.get('depth'), 'advanced');
  const stored = Array.from({ length: p.win.sessionStorage.length }, (_, index) => p.win.sessionStorage.key(index)).map((key) => [key, p.win.sessionStorage.getItem(key)]);
  const reloaded = page(url.href, { history: p.win.history.state, session: Object.fromEntries(stored) });
  assert.equal(reloaded.$('[data-kc-priority]').value, 'optional'); assert.equal(reloaded.$('[data-kc-depth]').value, 'advanced');
  const go = (delta) => new Promise((resolve) => { p.win.addEventListener('popstate', resolve, { once: true }); p.win.history.go(delta); });
  await go(-1); assert.equal(p.$('[data-kc-category-select]').value, 'testing'); assert.equal(p.$('[data-kc-depth]').value, 'advanced');
  await go(-2); assert.notEqual(p.$('[data-kc-depth]').value, 'advanced');
  await go(2); assert.equal(p.$('[data-kc-depth]').value, 'advanced');
});

test('필터 전체 해제는 검색어를 유지하고 원문 134개를 필터 밖에 보존한다', () => {
  const p = page();
  search(p, 'DTO');
  select(p, '[data-kc-category-select]', 'java');
  select(p, '[data-kc-priority]', 'optional');
  p.$('[data-kc-filter-reset]').click();
  assert.equal(p.$('#knowledge-search-input').value, 'DTO');
  assert.equal(p.$('[data-kc-category-select]').value, 'all');
  assert.equal(p.$('[data-kc-priority]').value, 'all');
  assert.equal(p.$('[data-kc-depth]').value, 'all');
  assert.equal(p.$('[data-kc-document]').closest('ul').querySelectorAll('[data-kc-document]').length, 134);
  assert.equal(p.$('[data-kc-original]').textContent.includes('134개'), true);
  search(p, '');
  select(p, '[data-kc-priority]', 'all'); select(p, '[data-kc-depth]', 'all');
  p.$('[data-kc-more]').click();
  assert.equal(p.visible().length, 134);
});

test('기본 행 제목·증거 상태·코드 예제·검토된 연결 실습 문구를 구분한다', () => {
  const p = page();
  const annotation = p.$('[data-kc-document="P03"]');
  assert.match(annotation.querySelector('h3').textContent, /애노테이션/);
  assert.doesNotMatch(annotation.querySelector('h3').textContent, /누가|언제/);
  assert.equal(p.$('[data-kc-document="P09"] [data-kc-practice]').textContent, '코드 예제 읽기');
  assert.ok(p.$('[data-kc-evidence-status]'));
  assert.equal(p.$('[data-kc-evidence-status]').dataset.contentReview, 'not_reassessed');
});

test('검색 시작은 기본 필수·기초에서 전체 범위로 확장하고 선택한 필터는 다음 검색에 유지한다', () => {
  const p = page();
  search(p, 'DTO');
  assert.equal(p.$('[data-kc-priority]').value, 'all'); assert.equal(p.$('[data-kc-depth]').value, 'all');
  assert.equal(p.$('[data-kc-category-select]').value, 'all');
  select(p, '[data-kc-priority]', 'optional'); search(p, 'Spring');
  assert.equal(p.$('[data-kc-priority]').value, 'optional');
});

test('잘못된 URL 필터는 안전한 전체/필수 기초 기본값으로 정규화한다', () => {
  const p = page('?priority=bogus&depth=bogus&category=nope');
  assert.equal(p.$('[data-kc-priority]').value, 'required'); assert.equal(p.$('[data-kc-depth]').value, 'foundation');
  assert.equal(p.$('[data-kc-category-select]').value, 'all');
  const q = page('?q=DTO&priority=bogus&depth=bogus&category=nope');
  assert.equal(q.$('[data-kc-priority]').value, 'all'); assert.equal(q.$('[data-kc-depth]').value, 'all');
  assert.equal(q.$('[data-kc-category-select]').value, 'all');
});

test('새 필드가 없는 이전 history entry는 query 유무로 기본값을 복구한다', () => {
  const legacy = (queryRaw) => ({ schema: 1, entryId: `old-${queryRaw || 'browse'}`, route: '/docs/knowledge/README.html', view: queryRaw ? 'results' : 'browse', queryRaw, inputDraft: queryRaw, categoryId: 'all', sort: 'relevance' });
  const oldBrowse = page('README.html', { history: { [HISTORY_KEY]: legacy('') } });
  assert.equal(oldBrowse.$('[data-kc-priority]').value, 'required'); assert.equal(oldBrowse.$('[data-kc-depth]').value, 'foundation');
  const oldSearch = page('README.html?q=DTO', { history: { [HISTORY_KEY]: legacy('DTO') } });
  assert.equal(oldSearch.$('[data-kc-priority]').value, 'all'); assert.equal(oldSearch.$('[data-kc-depth]').value, 'all');
});

test('화면에 표시된 보조 질문 134개를 그대로 검색하면 해당 문서를 찾는다', () => {
  const p = page();
  const questions = [...p.doc.querySelectorAll('[data-kc-document]')].map(row => ({
    id: row.dataset.kcDocument, text: row.querySelector('.kc-result-question').textContent,
  }));
  assert.equal(questions.length, 134);
  for (const question of questions) {
    search(p, question.text);
    const result = p.visible().find(row => row.dataset.kcDocument === question.id);
    assert.ok(result, `${question.id}: 표시한 질문으로 자기 문서를 찾을 수 있어야 함`);
    assert.equal(result.querySelector('[data-kc-match-reason]').textContent, '등록된 질문과 일치');
  }
});

test('첫 진입에서 필수 기초 화면으로 바로 들어가고 Spring 핵심을 빠르게 찾는다', () => {
  const p = page();
  const start = p.$('[data-kc-core-start]');
  assert.ok(start, '필수 기초 시작 링크가 있어야 한다');
  assert.equal(start.getAttribute('href'), '../../lessons/concept-core.html?unit=C01');
  for (const [query, id] of [['IoC', 'S01'], ['애노테이션', 'P03'], ['Lombok', 'W19']]) {
    p.$(`[data-kc-query="${query}"]`).click();
    assert.ok(p.visible().some(row => row.dataset.kcDocument === id), `${query}: 핵심 문서가 검색되어야 함`);
  }
});

test.after(close);
