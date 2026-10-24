import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { renderSpringConfigTabs } from './spring-config-tabs.mjs';
const script = fs.readFileSync(new URL('./course.js', import.meta.url), 'utf8');
const source = '**application-local.yml**\n\n```yaml\nserver:\n  port: 8080\nspring:\n  datasource:\n    password: "${DB_PASSWORD:a<b&c}"\n```';
async function open(before) {
  const dom = new JSDOM(renderSpringConfigTabs(source), {url:'https://learn.test/',runScripts:'outside-only'});
  before?.(dom.window);
  dom.window.eval(script);
  await new Promise(r => dom.window.addEventListener('load', r));
  return dom;
}
test('탭 관계·고유 ID·HTML 이스케이프와 기본 선택', async () => {
  const dom = await open(); const doc = dom.window.document;
  const tabs = [...doc.querySelectorAll('[role=tab]')];
  assert.equal(tabs.length, 2);
  assert.equal(tabs[0].textContent, 'yml');
  assert.equal(tabs[1].textContent, 'properties');
  for (const tab of tabs) {
    const panel = doc.getElementById(tab.getAttribute('aria-controls'));
    assert.equal(panel.getAttribute('aria-labelledby'), tab.id);
    assert.equal(panel.hidden, tab.getAttribute('aria-selected') !== 'true');
  }
  assert.equal(tabs[0].tabIndex, 0); assert.equal(tabs[1].tabIndex, -1);
  assert.ok(doc.querySelector('.spring-config').textContent.includes('${DB_PASSWORD:a<b&c}'));
  assert.equal(doc.querySelector('.spring-config b'), null);
  dom.window.close();
});
test('화살표·Home·End로 선택과 포커스가 이동하며 모든 블록이 같은 형식으로 바뀐다', async () => {
  const dom = await open(); const doc = dom.window.document;
  const tabs = [...doc.querySelectorAll('[role=tab]')];
  for (const [key, index] of [['ArrowRight',1],['ArrowRight',0],['ArrowLeft',1],['Home',0],['End',1]]) {
    const current = doc.querySelector('[role=tab][aria-selected=true]');
    current.dispatchEvent(new dom.window.KeyboardEvent('keydown',{key,bubbles:true}));
    assert.equal(doc.activeElement, tabs[index]);
    assert.equal(tabs[index].getAttribute('aria-selected'), 'true');
  }
  tabs[0].click(); assert.equal(tabs[0].getAttribute('aria-selected'), 'true');
  dom.window.close();
});
test('저장한 선택을 복원하고 저장소 읽기·쓰기 실패에도 탭이 동작한다', async () => {
  for (const fail of ['', 'read', 'write']) {
    const dom = await open(win => {
      win.localStorage.setItem('javaexperience.course.config-format.v1','properties');
      if (fail === 'read') Object.defineProperty(win, 'localStorage', {get(){throw new Error('blocked');}});
      if (fail === 'write') win.Storage.prototype.setItem = () => {throw new Error('quota');};
    });
    const tabs = [...dom.window.document.querySelectorAll('[role=tab]')];
    assert.equal(tabs[fail === 'read' ? 0 : 1].getAttribute('aria-selected'), 'true');
    tabs[0].click(); tabs[1].click();
    assert.equal(tabs[1].getAttribute('aria-selected'), 'true');
    dom.window.close();
  }
});
test('여러 설정 블록의 ID가 중복되지 않고 diff는 원문으로 남는다', () => {
  const diff = '```diff\n-spring.application.name: old\n+spring.application.name: new\n```';
  const html = renderSpringConfigTabs(`${source}\n\n${source}\n\n${diff}`);
  const doc = new JSDOM(html).window.document;
  const ids = [...doc.querySelectorAll('[id]')].map(n => n.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(doc.querySelectorAll('.spring-config').length, 2);
  assert.ok(html.includes(diff));
});
test('한 블록의 선택이 다른 블록과 저장값에도 반영된다', async () => {
  const dom = new JSDOM(renderSpringConfigTabs(`${source}\n\n${source}`), {url:'https://learn.test/',runScripts:'outside-only'});
  dom.window.eval(script);
  await new Promise(r => dom.window.addEventListener('load', r));
  const doc = dom.window.document;
  doc.querySelector('[data-config-format="properties"]').click();
  assert.equal(doc.querySelectorAll('[data-config-format="properties"][aria-selected="true"]').length, 2);
  assert.equal(doc.querySelectorAll('[data-config-panel="yml"][hidden]').length, 2);
  assert.equal(dom.window.localStorage.getItem('javaexperience.course.config-format.v1'), 'properties');
  dom.window.close();
});
