import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { loadCoreLearning } from './core-learning-data.mjs';
import { initCoreLearning } from './core-learning.js';

const data = loadCoreLearning(new URL('../../', import.meta.url).pathname);
function setup(query = '') {
  const text = ['title','definition','scenario','prerequisites','stage-title','stage-description','code','rows','counter','copy-status','observations','limit','sources','originals'];
  const html = `<section data-core-learning><script type="application/json" data-core-payload>${JSON.stringify(data).replace(/</g, '\\u003c')}</script><nav>${data.units.map(u => `<button data-core-unit="${u.id}">${u.title}</button>`).join('')}</nav><div data-core-stage-nav></div>${text.map(k => k === 'rows' ? '<table><tbody data-core-rows></tbody></table>' : `<div data-core-${k}></div>`).join('')}<button data-core-previous>이전</button><button data-core-next>다음</button><button data-core-copy>복사</button><a data-core-back href="../docs/knowledge/README.html">목록</a></section>`;
  const dom = new JSDOM(html, { url: 'https://learn.example/lessons/concept-core.html' + query });
  dom.window.history.replaceState({ foreign: 7 }, '');
  initCoreLearning(dom.window.document, dom.window);
  const $ = key => dom.window.document.querySelector(`[data-core-${key}]`);
  return { dom, $, win: dom.window, doc: dom.window.document };
}
const f = setup('?unit=C05&step=2');
assert.equal(f.$('title').textContent, 'Lombok 생성 코드');
assert.equal(f.$('counter').textContent, '2 / 3');
assert.equal(f.win.history.state.foreign, 7);
f.$('next').click();
assert.equal(f.$('counter').textContent, '3 / 3');
assert.equal(f.$('next').disabled, true);
assert.equal(f.doc.activeElement.dataset.coreStep, '2');
f.doc.querySelector('[data-core-unit="C04"]').click();
assert.equal(f.$('title').textContent, 'IoC·DI·생성자 주입');
assert.equal(f.$('counter').textContent, '1 / 3');
assert.ok(f.$('prerequisites').textContent.includes('C03'));
assert.equal(f.$('prerequisites').textContent.includes('C05'), false);
f.win.history.replaceState({ foreign: 9 }, '', '?unit=C06&step=3');
f.win.dispatchEvent(new f.win.PopStateEvent('popstate'));
assert.ok(f.$('limit').textContent.includes('setter'));
assert.equal(f.$('counter').textContent, '3 / 3');
assert.equal(f.win.history.state.foreign, 9);
f.dom.window.close();
const invalid = setup('?unit=NOPE&step=99');
assert.equal(invalid.$('counter').textContent, '1 / 3');
assert.equal(invalid.$('title').textContent, data.units[0].title);
invalid.dom.window.close();

const g = setup();
const requests = [];
Object.defineProperty(g.win.navigator, 'clipboard', { value: { writeText(text) {
  let resolve, reject; const promise = new Promise((a,b) => { resolve = a; reject = b; });
  requests.push({ text, resolve, reject }); return promise;
} } });
g.$('copy').click(); const oldCode = g.$('code').textContent;
g.$('next').click(); requests[0].resolve(); await new Promise(setImmediate);
assert.equal(requests[0].text, oldCode);
assert.equal(g.$('copy-status').textContent, '');
g.$('copy').click(); requests[1].resolve(); await new Promise(setImmediate);
assert.equal(g.$('copy-status').textContent, '코드를 복사했습니다.');
g.$('copy').click(); g.doc.querySelector('[data-core-unit="C05"]').click();
requests[2].reject(new Error('unavailable')); await new Promise(setImmediate);
assert.equal(g.$('copy-status').textContent, '');
g.dom.window.close();
console.log('core learning: URL, stage/unit transitions, prerequisites, history, focus and delayed-copy boundaries passed');
