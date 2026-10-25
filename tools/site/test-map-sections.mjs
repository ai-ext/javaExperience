import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const html = fs.readFileSync(new URL('../../course/map.html', import.meta.url), 'utf8');
const script = fs.readFileSync(new URL('./course-map.js', import.meta.url), 'utf8');
function open(hash = '') {
  const dom = new JSDOM(html, { url: `https://learn.test/course/map.html${hash}`, runScripts: 'outside-only', pretendToBeVisual: true });
  const win = dom.window;
  win.document.querySelector('.cm-tables').id ||= 'course-relations-view';
  win.matchMedia = () => ({ matches: true });
  win.eval(script);
  return dom;
}

test('관계 분류는 접기 밖의 전체·일자·티켓·결함 탭에서 전환한다', () => {
  const dom = open(), doc = dom.window.document;
  const tabs = [...doc.querySelectorAll('.cm-relation-tabs [role="tab"]')];
  const panels = [...doc.querySelectorAll('.cm-relation-panel')];
  assert.deepEqual(tabs.map(tab => tab.textContent), ['전체', '일자별', '티켓별', '결함 영역별']);
  assert.equal(doc.querySelector('.cm-relation-tabs').closest('details'), null);
  assert.ok(doc.querySelector('.cm-relation-tabs.section-switcher'));
  assert.equal(panels.filter(panel => !panel.hidden).length, 1);
  tabs[2].click();
  assert.equal(dom.window.location.hash, '#cm-table-tickets');
  assert.equal(tabs[2].getAttribute('aria-selected'), 'true');
  assert.deepEqual(panels.map(panel => panel.hidden), [true, false, true]);
  tabs[0].click();
  assert.equal(dom.window.location.hash, '#cm-table-all');
  assert.ok(panels.every(panel => !panel.hidden));
  dom.window.close();
});

test('직접 해시·이력 복원과 방향키·Home·End는 분류와 선택 상태를 맞춘다', () => {
  const dom = open('#cm-table-areas-panel'), win = dom.window, doc = win.document;
  const tabs = [...doc.querySelectorAll('.cm-relation-tabs [role="tab"]')];
  const panels = [...doc.querySelectorAll('.cm-relation-panel')];
  assert.deepEqual(panels.map(panel => panel.hidden), [true, true, false]);
  const key = (tab, key) => tab.dispatchEvent(new win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  key(tabs[3], 'Home');
  assert.equal(doc.activeElement, tabs[0]);
  assert.equal(tabs[0].getAttribute('aria-selected'), 'true');
  key(tabs[0], 'ArrowRight');
  assert.equal(doc.activeElement, tabs[1]);
  key(tabs[1], 'End');
  assert.equal(doc.activeElement, tabs[3]);
  win.history.replaceState(null, '', '#cm-table-tickets');
  win.dispatchEvent(new win.PopStateEvent('popstate'));
  assert.deepEqual(panels.map(panel => panel.hidden), [true, false, true]);
  assert.equal(tabs.filter(tab => tab.tabIndex === 0).length, 1);
  win.history.replaceState(null, '', win.location.pathname);
  win.dispatchEvent(new win.PopStateEvent('popstate'));
  assert.deepEqual(panels.map(panel => panel.hidden), [false, true, true]);
  tabs[2].click();
  win.history.replaceState(null, '', '#course-relations-view');
  win.dispatchEvent(new win.PopStateEvent('popstate'));
  assert.deepEqual(panels.map(panel => panel.hidden), [false, true, true]);
  tabs[3].click();
  win.history.replaceState(null, '', '#cm-table-title');
  win.dispatchEvent(new win.PopStateEvent('popstate'));
  assert.equal(tabs[1].getAttribute('aria-selected'), 'true');
  dom.window.close();
});
