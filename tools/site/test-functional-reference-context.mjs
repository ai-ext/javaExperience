import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { buildSync } from 'esbuild';
import { TASKS, PROGRESS_KEY } from './home-state.mjs';
import { initLearning } from './home-learning.mjs';
import { initKnowledgeCatalog, CATALOG_HISTORY_KEY } from './knowledge-catalog-controller.mjs';
import { renderKnowledgeVisual } from './knowledge-visual.mjs';

const root = new URL('../../', import.meta.url);
const manifest = JSON.parse(fs.readFileSync(new URL('scenario/scenario.json', root)));
const legacyPaths = manifest.chapters.filter(c => c.status !== 'planned').flatMap(c => c.levels.filter(l => l.file).map(l => `scenario/${c.dir}/${l.file.replace(/\.md$/, '.html')}`));
const knowledgePaths = ['docs/knowledge/README.html', 'docs/knowledge/S09-jpa-hibernate.html', 'docs/knowledge/W09-why-dto.html'];
const tasks = Object.values(TASKS).filter(t => t.functionalId).map(t => ({ id: t.id, title: t.title, api: { method: t.api.split(' ')[0], path: t.api.split(' ')[1] }, href: t.href }));
const pagePath = 'scenario/ch1-create-post/1-4-save-to-db.html';
const payload = (path = pagePath) => ({ version: 1, pagePath: path, rootHref: '../../index.html', legacyPaths, knowledgePaths, tasks });
const fixtures = [];
const module = () => import('./functional-reference-context.mjs');
const aside = '<aside data-frc-root hidden><strong data-frc-task></strong><b data-frc-method></b><code data-frc-api></code><a data-frc-open></a></aside>';
function page({ path = pagePath, query = 'fromTask=flow-create', base = 'https://learn.example/course/javaExperience/', data = payload(path), body = '', metadata = true } = {}) {
  const dom = new JSDOM(`${aside}<main><details id="original"><summary>원문</summary><h2 id="original-anchor">기존 앵커</h2><input id="token" value="private-token"><textarea id="body">private-body</textarea></details>${body}</main>${metadata ? `<script type="application/json" data-frc-data>${JSON.stringify(data).replaceAll('<', '\\u003c')}</script>` : ''}`, { url: new URL(path + (query ? '?' + query : ''), base).href, runScripts: 'outside-only' });
  const w = dom.window, d = w.document;
  w.fetch = () => { throw Error('참고자료는 HTTP를 자동 전송하지 않음'); };
  fixtures.push(dom);
  return { w, d, $: selector => d.querySelector(selector) };
}
const progress = id => JSON.stringify({ version: 1, selected: 'flow-create', active: id, records: { [id]: { status: 'in-progress', scene: { attribute: TASKS[id].panel, value: 'saved', label: '기존 장면' } } } });

test('유효한 과제에서 연 자료만 읽기 톤을 적용하고 원문·테마 선택은 보존한다', async () => {
  const { initFunctionalReferenceContext } = await module();
  for (const path of [pagePath, 'docs/knowledge/S09-jpa-hibernate.html']) {
    const p = page({ path });
    p.d.documentElement.setAttribute('data-theme', 'dark');
    p.d.documentElement.classList.add('foreign-class');
    const original = p.$('main').innerHTML;
    initFunctionalReferenceContext(p.d, p.w);
    assert.equal(p.d.documentElement.classList.contains('functional-reference-reading'), true);
    assert.equal(p.d.documentElement.getAttribute('data-theme'), 'dark');
    assert.equal(p.$('main').innerHTML, original);
    p.w.history.replaceState(null, '', p.w.location.pathname);
    initFunctionalReferenceContext(p.d, p.w);
    assert.equal(p.d.documentElement.classList.contains('functional-reference-reading'), false);
    assert.equal(p.d.documentElement.classList.contains('foreign-class'), true);
    assert.equal(p.d.documentElement.getAttribute('data-theme'), 'dark');
  }
});

test('entry 미실행이어도 기존4과제의 legacy 진도 분기 전체를 제외한다', async () => {
  for (const id of ['0-1', '0-2', '1-1', '1-2']) {
    const task = TASKS[id];
    const p = page({ path: task.href, body: `<div class="${task.journey.slice(1)}"><button ${task.go}="saved">저장 장면</button><section ${task.panel}="current"><h2>현재 장면</h2></section></div><script data-home-controller data-home-root="../../index.html" data-home-task="${id}"></script>` });
    p.w.localStorage.setItem(PROGRESS_KEY, progress(id));
    const before = p.w.localStorage.getItem(PROGRESS_KEY);
    let clicks = 0, observers = 0;
    p.$('button').addEventListener('click', () => clicks++);
    p.w.MutationObserver = class { constructor() { observers++; } observe() {} };
    initLearning(p.d, p.w);
    assert.equal(p.$('.learning-progress-bar'), null, id);
    assert.equal(clicks, 0, '저장된 장면을 자동 클릭하지 않음');
    assert.equal(observers, 0, '진도 저장 observer를 생성하지 않음');
    assert.equal(p.w.localStorage.getItem(PROGRESS_KEY), before);
    assert.equal(p.$('[data-frc-root]').hidden, true, 'entry를 실행하지 않아도 gate는 독립 동작');
  }
});

test('직접 방문/무효 caller는 기존 legacy 진도 UI를 유지한다', () => {
  for (const query of ['', 'fromTask=unknown', 'fromTask=flow-create&fromTask=flow-create']) {
    const p = page({ path: TASKS['1-1'].href, query, body: '<script data-home-controller data-home-root="../../index.html" data-home-task="1-1"></script>' });
    initLearning(p.d, p.w);
    assert.ok(p.$('.learning-progress-bar'));
  }
});

test('공개 기능 과제를 표시하고 DOM·입력·history·저장소·HTTP를 보존한다', async () => {
  const { readReferenceContext, initFunctionalReferenceContext } = await module();
  for (const task of tasks) {
    const p = page({ query: `fromTask=${task.id}&token=private-url` });
    p.w.history.replaceState({ foreign: 'keep' }, '');
    p.w.localStorage.setItem(PROGRESS_KEY, progress('1-1'));
    const original = p.$('main').innerHTML, local = JSON.stringify(Object.entries(p.w.localStorage));
    const context = readReferenceContext(p.d, p.w.location);
    assert.equal(context.kind, 'legacy');
    assert.equal(context.task.id, task.id);
    initFunctionalReferenceContext(p.d, p.w);
    initFunctionalReferenceContext(p.d, p.w);
    assert.equal(p.$('[data-frc-root]').hidden, false);
    assert.equal(p.$('[data-frc-task]').textContent, task.title);
    assert.equal(p.$('[data-frc-method]').textContent, task.api.method);
    assert.equal(p.$('[data-frc-api]').textContent, task.api.path);
    const open = p.$('[data-frc-open]');
    assert.equal(open.href, new URL(task.href, 'https://learn.example/course/javaExperience/').href);
    assert.equal(open.target, '_blank');
    assert.equal(open.rel, 'noopener noreferrer');
    assert.match(open.textContent, /↗/); assert.match(open.getAttribute('aria-label'), /새 탭/);
    assert.equal(p.$('main').innerHTML, original);
    assert.equal(JSON.stringify(Object.entries(p.w.localStorage)), local);
    assert.equal(p.w.sessionStorage.length, 0);
    assert.deepEqual(p.w.history.state, { foreign: 'keep' });
    assert.equal(new URL(open.href).search, '');
  }
});

test('중복·prototype·unknown키와 부적합 metadata/route는 거절한다', async () => {
  const { readReferenceContext, initFunctionalReferenceContext } = await module();
  for (const query of ['', 'fromTask=', 'fromTask=1-1', 'fromTask=__proto__', 'fromTask=constructor', 'fromTask=toString', 'fromTask=unknown', 'fromTask=flow-create&fromTask=', 'fromTask=flow-create&%66romTask=flow-create']) {
    const p = page({ query });
    assert.equal(readReferenceContext(p.d, p.w.location), null, query);
    initFunctionalReferenceContext(p.d, p.w);
    assert.equal(p.$('[data-frc-root]').hidden, true);
  }
  const invalid = [null, {}, { ...payload(), version: 2 }, { ...payload(), rootHref: 'https://evil.example/index.html' }, { ...payload(), pagePath: TASKS['1-1'].href }, { ...payload(), legacyPaths: [...legacyPaths, '../outside.html'] }, { ...payload(), tasks: tasks.map((t, i) => i ? t : { ...t, href: 'https://evil.example/' }) }, { ...payload(), tasks: [tasks[0], ...tasks.slice(0, 4)] }];
  for (const data of invalid) {
    const p = page({ data });
    assert.equal(readReferenceContext(p.d, p.w.location), null);
  }
  const p = page(); p.$('[data-frc-data]').textContent = '{';
  assert.equal(readReferenceContext(p.d, p.w.location), null);
  p.$('[data-frc-data]').remove();
  assert.equal(readReferenceContext(p.d, p.w.location), null);
});

test('manifest의101경로와 knowledge 경로만 해당 kind로 읽는다', async () => {
  const { readReferenceContext } = await module();
  assert.equal(legacyPaths.length, 101);
  const p = page();
  for (const [kind, paths] of [['legacy', legacyPaths], ['knowledge', knowledgePaths]]) for (const path of paths) {
    p.w.history.replaceState(null, '', new URL(path + '?fromTask=flow-detail', 'https://learn.example/course/javaExperience/'));
    p.$('[data-frc-data]').textContent = JSON.stringify(payload(path));
    assert.equal(readReferenceContext(p.d, p.w.location)?.kind, kind, path);
  }
  p.$('[data-frc-data]').textContent = JSON.stringify(payload('scenario/flow/create-post.html'));
  p.w.history.replaceState(null, '', '/course/javaExperience/scenario/flow/create-post.html?fromTask=flow-create');
  assert.equal(readReferenceContext(p.d, p.w.location), null, 'flow는 참고 페이지가 아님');
  const duplicate = page();
  duplicate.$('[data-frc-data]').after(duplicate.$('[data-frc-data]').cloneNode(true));
  assert.equal(readReferenceContext(duplicate.d, duplicate.w.location), null);
});

test('file/subpath에서 정확한 route만 공개 맥락을 전달한다', async () => {
  const { initFunctionalReferenceContext } = await module();
  for (const base of ['https://learn.example/course/javaExperience/', 'file:///Users/ds/한글%20폴더/javaExperience/']) {
    const paths = { legacy: '../ch2-read-post/2-1-get-one.html?own=keep#value', knowledge: '../../docs/knowledge/S09-jpa-hibernate.html?q=DTO#flush', unknown: '../ch2-read-post/forged.html', outside: 'file:///tmp/outside.html', external: 'https://elsewhere.example/docs/knowledge/S09-jpa-hibernate.html', api: '../../api/posts', anchor: '#original-anchor', zip: '../../scenario/flow/packages/create.zip', download: '../../docs/knowledge/S09-jpa-hibernate.html', protocol: 'javascript:alert(1)', flow: '../../scenario/flow/create-post.html', rootOutside: '../../../outside.html', network: '//elsewhere.example/S09.html' };
    const p = page({ base, query: 'fromTask=flow-update&token=private-token&body=private-body&id=87&baseURL=private-server', body: Object.entries(paths).map(([id, href]) => `<a id="${id}" href="${href}" ${id === 'download' ? 'download' : ''}>링크</a>`).join('') });
    initFunctionalReferenceContext(p.d, p.w);
    for (const id of ['legacy', 'knowledge']) {
      const url = new URL(p.$('#' + id).href);
      assert.equal(url.searchParams.get('fromTask'), 'flow-update');
      for (const key of ['token', 'body', 'id', 'baseURL']) assert.equal(url.searchParams.has(key), false);
    }
    assert.equal(new URL(p.$('#legacy').href).searchParams.get('own'), 'keep');
    assert.equal(p.$('#legacy').hash, '#value');
    assert.equal(new URL(p.$('#knowledge').href).searchParams.get('q'), 'DTO');
    for (const [id, href] of Object.entries(paths).filter(([id]) => !['legacy', 'knowledge'].includes(id))) assert.equal(p.$('#' + id).getAttribute('href'), href, id);
  }
});

test('저장소 차단과 HTML 모양 title에도 안전한 textContent만 사용한다', async () => {
  const { initFunctionalReferenceContext } = await module();
  const data = payload(); data.tasks = data.tasks.map(t => t.id === 'flow-create' ? { ...t, title: '<img src=x onerror=alert(1)>' } : t);
  const p = page({ data });
  for (const kind of ['localStorage', 'sessionStorage']) Object.defineProperty(p.w, kind, { get() { throw Error('blocked'); } });
  initFunctionalReferenceContext(p.d, p.w);
  assert.equal(p.$('[data-frc-task]').children.length, 0);
  assert.equal(p.$('[data-frc-task]').textContent, data.tasks[0].title);
});

test('재초기화의 무효 맥락은 이전 띠를 숨기고 저장소 차단 home gate도 유지한다', async () => {
  const { initFunctionalReferenceContext } = await module();
  const p = page({ path: TASKS['1-1'].href, body: '<script data-home-controller data-home-root="../../index.html" data-home-task="1-1"></script>' });
  for (const kind of ['localStorage', 'sessionStorage']) Object.defineProperty(p.w, kind, { get() { throw Error('blocked'); } });
  initLearning(p.d, p.w);
  assert.equal(p.$('.learning-progress-bar'), null);
  initFunctionalReferenceContext(p.d, p.w);
  assert.equal(p.$('[data-frc-root]').hidden, false);
  p.w.history.replaceState(null, '', '?fromTask=unknown');
  initFunctionalReferenceContext(p.d, p.w);
  assert.equal(p.$('[data-frc-root]').hidden, true);
});

test('knowledge bridge는 legacy를 전달하지만 기존 history 소유권은 만들지 않는다', () => {
  const path = 'docs/knowledge/S09-jpa-hibernate.html';
  const p = page({ path, body: '<a id="legacy-link" href="../../scenario/ch1-create-post/1-1-receive-request.html?own=keep#original-anchor">관련 과제</a><a data-kc-catalog-return href="README.html">목록</a><a id="download-link" download href="W09-why-dto.html">받기</a>' });
  p.w.history.replaceState({ foreign: 'keep' }, '');
  initKnowledgeCatalog(p.d, p.w);
  assert.equal(new URL(p.$('#legacy-link').href).searchParams.get('fromTask'), 'flow-create');
  assert.equal(new URL(p.$('#legacy-link').href).searchParams.get('own'), 'keep');
  assert.equal(p.$('[data-frc-root]').hidden, true, 'knowledge에는 legacy 띠를 표시하지 않음');
  assert.equal(p.$('#download-link').getAttribute('href'), 'W09-why-dto.html');
  assert.equal(p.w.history.state[CATALOG_HISTORY_KEY], undefined);
  assert.deepEqual(p.w.history.state, { foreign: 'keep' });
  assert.equal(p.w.sessionStorage.length, 0);
});

test('손상된 metadata는 knowledge-only fallback으로 전파하지 않는다', () => {
  const path = 'docs/knowledge/S09-jpa-hibernate.html';
  const p = page({ path, data: {}, body: '<a id="concept" href="W09-why-dto.html">개념</a>' });
  initKnowledgeCatalog(p.d, p.w);
  assert.equal(p.$('#concept').getAttribute('href'), 'W09-why-dto.html');
});

test('metadata bridge는 검색·clear·filter 후에도 관련 legacy 맥락만 전달한다', () => {
  const path = 'docs/knowledge/README.html';
  const data = payload(path);
  data.knowledgePaths = fs.readdirSync(new URL('docs/knowledge/', root)).filter(file => file.endsWith('.md')).map(file => 'docs/knowledge/' + file.replace(/\.md$/, '.html'));
  const p = page({ path, body: renderKnowledgeVisual(root.pathname), data });
  p.w.scrollTo = () => {};
  const original = progress('1-1');
  p.w.localStorage.setItem(PROGRESS_KEY, original);
  p.w.history.replaceState({ foreign: 'keep' }, '');
  initKnowledgeCatalog(p.d, p.w);
  const legacyUrls = new Set(legacyPaths.map(path => new URL(path, 'https://learn.example/course/javaExperience/').href));
  const related = () => [...p.d.querySelectorAll('.kc-catalog a[href]')].filter(link => { const url = new URL(link.href); url.search = ''; url.hash = ''; return legacyUrls.has(url.href); });
  const check = () => {
    assert.ok(related().length > 0);
    assert.ok(related().every(link => new URL(link.href).searchParams.get('fromTask') === 'flow-create'));
    assert.equal(p.w.localStorage.getItem(PROGRESS_KEY), original);
    assert.equal(p.w.history.state.foreign, 'keep');
  };
  check();
  p.$('#knowledge-search-input').value = 'DTO';
  p.$('.kc-search').dispatchEvent(new p.w.Event('submit', { cancelable: true }));
  p.$('button[data-kc-category="java"]').click();
  p.$('[data-kc-search-clear]').click();
  check();
  for (const value of Object.values(Object.fromEntries(Object.entries(p.w.sessionStorage)))) assert.ok(!value.includes('private-token') && !value.includes('private-body'));
});

test('browser entry는 Node 데이터 없이 bundle되고 독립 초기화한다', () => {
  const bundle = buildSync({ entryPoints: [new URL('./functional-reference-entry.mjs', import.meta.url).pathname], bundle: true, platform: 'browser', format: 'iife', write: false });
  const code = bundle.outputFiles[0].text;
  assert.doesNotMatch(code, /PostService|node:fs|FUNCTIONAL_TASKS|PROGRESS_KEY/);
  const p = page();
  p.w.eval(code);
  assert.equal(p.$('[data-frc-root]').hidden, false);
});

test.after(() => { for (const dom of fixtures) dom.window.close(); });
