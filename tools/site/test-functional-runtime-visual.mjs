import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { getFunctionalVisualModel } from './functional-visual-model.mjs';

const moduleUrl = new URL('./functional-runtime-visual.mjs', import.meta.url);
assert.ok(fs.existsSync(moduleUrl), '값·참조·행을 렌더링할 native 컴포넌트가 있어야 한다');
const { renderFunctionalRuntimeVisual } = await import(moduleUrl);
const { initFunctionalRuntimeVisuals } = await import('./functional-runtime-visual-controller.mjs');
function mount(taskId, stateId, options = {}, idPrefix = `${taskId}-${stateId}`) {
  const html = renderFunctionalRuntimeVisual({ taskId, stateId, options, idPrefix });
  const dom = new JSDOM(`<main data-fw-root data-fw-task="${taskId}">${html}</main>`);
  initFunctionalRuntimeVisuals(dom.window.document);
  return { dom, d: dom.window.document, model: getFunctionalVisualModel(taskId, stateId, options) };
}
let states = 0;
for (const task of ['create', 'detail', 'delete']) {
  for (const state of getFunctionalVisualModel(task).availableStates) {
    const { dom, d, model } = mount(task, state); states++;
    const root = d.querySelector('[data-frv-root]');
    assert.equal(root.dataset.frvModel, 'true');
    if (typeof model.transaction.managed === 'boolean') {
      const managed = root.querySelector('[data-frv-managed]');
      assert.ok(managed, 'Post의 관리 상태가 모델에 있으면 화면에도 표시한다');
      assert.equal(managed.dataset.frvManaged, String(model.transaction.managed));
    }
    if (['commit', 'rollback', 'rejected'].includes(model.transaction.phase)) {
      assert.doesNotMatch(root.querySelector('.frv-database > header').textContent, /앱의 트랜잭션|진행 중/,
        '종료된 트랜잭션을 진행 중인 DB 관찰로 표시하지 않는다');
    }
    assert.deepEqual([...root.querySelectorAll('[data-frv-field]')].map(button => button.dataset.frvField), { create: ['id', 'title', 'board', 'author', 'tags'], detail: ['id', 'viewCount', 'tags'], delete: ['id', 'deletedAt', 'tags'] }[task]);
    assert.match(root.textContent, /실제 서버 미실행/);
    assert.match(root.textContent, /메모리 주소/);
    assert.equal(root.querySelectorAll('[data-frv-source-field]').length, 15);
    for (const row of model.rows.java) {
      const element = root.querySelector(`[data-frv-source-field="${row.field}"]`);
      assert.ok(element, row.field);
      assert.equal(element.querySelector('[data-frv-value]').dataset.frvValue, JSON.stringify(row.value));
    }
    for (const table of model.rows.tables) {
      const element = root.querySelector(`[data-frv-table="${table.name}"]`);
      assert.ok(element, table.name);
      assert.equal(element.dataset.frvRows, JSON.stringify(table.rows));
    }
    assert.deepEqual(JSON.parse(root.querySelector('[data-frv-observer]').dataset.frvDatabase), model.observer.database);
    if (model.transaction.phase === 'rejected') {
      const observation = root.querySelector('[data-frv-observer]').textContent;
      assert.match(observation, /요청 거절 후: 추가 변경 없이 기존 확정 상태를 관찰합니다/);
      assert.doesNotMatch(observation, /commit 전:/, '거절된 요청은 이후 commit을 기다리는 상태가 아니다');
    }
    const ids = [...d.querySelectorAll('[id]')].map(el => el.id);
    assert.equal(ids.length, new Set(ids).size, 'ID는 상태 패널 안에서도 고유해야 함');
    for (const button of root.querySelectorAll('[data-frv-field]')) {
      button.click();
      const field = button.dataset.frvField;
      assert.equal(button.getAttribute('aria-pressed'), 'true');
      assert.ok(root.querySelector(`[data-frv-source-field="${field}"].is-linked`));
      assert.ok([...root.querySelectorAll('[data-frv-target].is-linked')].some(el => el.dataset.frvFields.split(' ').includes(field)), `${task}/${state}/${field}의 실제 목적지 강조`);
      for (const targetId of button.getAttribute('aria-controls').split(' ')) assert.ok(d.getElementById(targetId));
    }
    dom.window.close();
  }
}
{
  const html = ['detail-select', 'detail-change', 'detail-commit'].map((stateId, i) => renderFunctionalRuntimeVisual({ taskId: 'detail', stateId, idPrefix: `sync-${i}` })).join('');
  const dom = new JSDOM(`<div data-fw-root>${html}<input data-fw-token value="untouched"><p data-fw-status>미실행</p></div>`);
  const d = dom.window.document;
  initFunctionalRuntimeVisuals(d); initFunctionalRuntimeVisuals(d);
  const buttons = [...d.querySelector('[data-frv-root]').querySelectorAll('[data-frv-field]')];
  buttons[0].dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  assert.equal(d.activeElement, buttons.at(-1));
  assert.ok([...d.querySelectorAll('[data-frv-root]')].every(root => root.dataset.frvSelected === buttons.at(-1).dataset.frvField));
  buttons.at(-1).dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  assert.equal(d.activeElement, buttons[0]);
  assert.equal(d.querySelector('[data-fw-token]').value, 'untouched');
  assert.equal(d.querySelector('[data-fw-status]').textContent, '미실행');
  dom.window.close();
}
{
  const hostile = '<img src=x onerror="globalThis.pwned=true">&"';
  const { dom, d } = mount('create', 'create-commit', { request: { title: hostile, tags: [hostile] } }, 'id" onclick="evil');
  assert.equal(d.querySelectorAll('img,script,[onclick],[onerror]').length, 0);
  assert.ok(d.body.textContent.includes(hostile));
  dom.window.close();
}
{
  const { dom, d } = mount('create', 'new-object');
  const references = d.querySelector('.frv-references');
  assert.equal(references.querySelector('[data-frv-target="Tag@Ta"]'), null, 'new 직후 객체 참조 영역에 조회 전 Tag가 없어야 함');
  assert.equal(references.querySelector('[data-frv-target="Tag@Tb"]'), null);
  assert.equal(JSON.parse(d.querySelector('[data-frv-table="tag"]').dataset.frvRows)[0].name, 'spring', '기존 DB tag 행은 그대로 표시');
  assert.deepEqual(JSON.parse(d.querySelector('[data-frv-source-field="tags"] [data-frv-value]').dataset.frvValue), []);
  dom.window.close();
}
{
  const { dom, d } = mount('create', 'tag-new-object');
  const references = d.querySelector('.frv-references');
  assert.ok(references.querySelector('[data-frv-target="Tag@Ta"]'), '이미 해석한 spring 참조');
  assert.ok(references.querySelector('[data-frv-target="Tag@Tb"]'), '아직 id=null인 새 Tag 객체');
  assert.match(references.querySelector('[data-frv-target="LinkedHashSet@Resolved.elements"]').textContent, /Tag@Ta/);
  assert.deepEqual(JSON.parse(d.querySelector('[data-frv-source-field="tags"] [data-frv-value]').dataset.frvValue), []);
  dom.window.close();
}
{
  const { dom, d } = mount('create', 'identity-insert');
  assert.equal(JSON.parse(d.querySelector('[data-frv-table="post_tag"]').dataset.frvRows).length, 0);
  assert.match(d.querySelector('[data-frv-pending]').textContent, /예정/);
  assert.match(d.querySelector('[data-frv-pending]').textContent, /tagIdB/);
  assert.equal(d.querySelectorAll('[data-frv-table=tag] [data-frv-row-change=inserted]').length, 1, '신규 tag 한 행과 기존 행을 구별');
  dom.window.close();
}
{
  const { dom, d } = mount('create', 'create-rollback');
  assert.match(d.querySelector('[data-frv-transaction]').textContent, /Java 객체.*자동.*복구.*않/);
  assert.equal(JSON.parse(d.querySelector('[data-frv-table="post"]').dataset.frvRows).length, 0);
  assert.equal(JSON.parse(d.querySelector('[data-frv-source-field="id"] [data-frv-value]').dataset.frvValue), 'idP');
  assert.ok(d.querySelector('.frv-references [data-frv-target="Tag@Tb"]'), 'rollback 뒤에도 해석한 새 Tag 참조는 남음');
  assert.match(d.querySelector('.frv-references [data-frv-target="Tag@Tb.id"]').textContent, /tagIdB/);
  assert.deepEqual(JSON.parse(d.querySelector('[data-frv-table="tag"]').dataset.frvRows).map(t => t.name), ['spring'], '새 Tag DB 행은 취소되고 기존 행만 남음');
  dom.window.close();
}
{
  const { dom, d } = mount('delete', 'delete-commit');
  assert.match(d.body.textContent, /like_count.*0/s);
  assert.match(d.body.textContent, /post_like.*0/s);
  assert.match(d.body.textContent, /GET.*404.*PATCH.*404.*DELETE.*404/s);
  dom.window.close();
}
{
  const dom = new JSDOM(`<div data-fw-root>${renderFunctionalRuntimeVisual({taskId:'detail', stateId:'detail-change', idPrefix:'first'})}</div><div data-fw-root>${renderFunctionalRuntimeVisual({taskId:'detail', stateId:'detail-commit', idPrefix:'second'})}</div>`);
  initFunctionalRuntimeVisuals(dom.window.document);
  const roots = [...dom.window.document.querySelectorAll('[data-frv-root]')];
  roots[0].querySelector('[data-frv-field=tags]').click();
  assert.equal(roots[0].dataset.frvSelected, 'tags');
  assert.equal(roots[1].dataset.frvSelected, 'viewCount', '독립 workspace에는 선택을 전파하지 않음');
  dom.window.close();
}
{
  const { dom, d, model } = mount('detail', 'detail-change', {viewCount: 9});
  assert.equal(JSON.parse(d.querySelector('[data-frv-source-field=viewCount] [data-frv-value]').dataset.frvValue), 10);
  assert.equal(JSON.parse(d.querySelector('[data-frv-table=post]').dataset.frvRows)[0].view_count, 9);
  assert.equal(JSON.parse(d.querySelector('[data-frv-observer]').dataset.frvDatabase).post[0].view_count, 9);
  assert.equal(model.after.object.updatedAt, model.before.object.updatedAt);
  dom.window.close();
}
const css = fs.readFileSync(new URL('./functional-runtime-visual.css', import.meta.url), 'utf8');
assert.match(css, /@media\s*\(max-width:\s*\d+px\)/);
assert.match(css, /min-height:\s*44px/);
assert.match(css, /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
assert.match(css, /overflow-x:\s*auto/);
const controller = fs.readFileSync(new URL('./functional-runtime-visual-controller.mjs', import.meta.url), 'utf8');
assert.doesNotMatch(controller, /fetch\(|localStorage|sessionStorage|XMLHttpRequest|\.submit\(/);
console.log(`functional runtime visual: ${states} states; model values, references, observer, keyboard, isolation and escaping passed (DOM checks; layout not measured)`);

for (const [task, state] of [['detail', 'detail-select'], ['detail', 'detail-hidden'], ['delete', 'delete-before'], ['delete', 'delete-commit']]) {
  const {dom, d} = mount(task, state);
  const refs = d.querySelector('.frv-references');
  assert.match(refs.textContent, /원소.*미확인/);
  assert.doesNotMatch(refs.textContent, /Tag@Ta|Tag@Tb|원소 0개/);
  assert.match(d.querySelector('[data-frv-table="tag"]').textContent, /spring|새태그/);
  assert.match(d.querySelector('[data-frv-source-field="tags"]').textContent, /미확인/);
  dom.window.close();
}
assert.match(renderFunctionalRuntimeVisual({taskId:'create',stateId:'tag-new-object'}), /새 Tag 생성 직후/);
