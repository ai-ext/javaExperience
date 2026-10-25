import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildSync } from 'esbuild';
import { JSDOM } from 'jsdom';
import { FUNCTIONAL_TASK_BY_ID } from './functional-scenario-data.mjs';
import { renderFunctionalWorkspace } from './functional-scenario.mjs';
import { initFunctionalVisualViews } from './functional-visual-learning.mjs';

const assets = { detail: 'docs/design/scenario-crud-2026-10-20/images/V02-detail-flow-v1.jpg' };
const mount = (task, images = assets, mobile = false) => {
  const dom = new JSDOM(renderFunctionalWorkspace({ task: FUNCTIONAL_TASK_BY_ID[task], assets: images }), {
    url: `https://example.test/scenario/flow/${task}.html`, runScripts: 'outside-only',
  });
  dom.window.matchMedia = () => ({ matches: mobile });
  return { dom, doc: dom.window.document, win: dom.window };
};
for (const mobile of [false, true]) {
  const { dom, doc, win } = mount('detail', assets, mobile);
  initFunctionalVisualViews(doc, win);
  const view = doc.querySelector('[data-fw-visual]');
  const overview = view.querySelector('[data-fw-overview]');
  const compare = view.querySelector('[data-fw-compare]');
  assert.equal(view.dataset.fwViewActive, mobile ? 'compare' : 'overview');
  assert.equal(overview.hidden, mobile);
  assert.equal(compare.hidden, !mobile);
  const buttons = [...view.querySelectorAll('[data-fw-view]')];
  initFunctionalVisualViews(doc, win); // 중복 연결로 키보드 선택이 두 번 움직이지 않아야 한다.
  const first = buttons.find(button => button.getAttribute('aria-selected') === 'true');
  first.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  const selected = buttons.find(button => button.getAttribute('aria-selected') === 'true');
  assert.notEqual(first, selected);
  assert.equal(doc.activeElement, selected);
  assert.equal(doc.querySelectorAll('[data-fw-view][tabindex="0"]').length, 1);
  const chosen = view.dataset.fwViewActive;
  win.dispatchEvent(new win.Event('resize'));
  assert.equal(view.dataset.fwViewActive, chosen, 'resize는 사용자의 선택을 바꾸지 않음');
  assert.equal(doc.querySelector('[data-fw-status]').textContent, '미실행');
  assert.equal(win.localStorage.length + win.sessionStorage.length, 0);
  dom.window.close();
}
{
  const { dom, doc, win } = mount('create', {});
  initFunctionalVisualViews(doc, win);
  assert.equal(doc.querySelector('[data-fw-compare]').hidden, false);
  assert.equal(doc.querySelectorAll('[data-fw-view]').length, 0, '승인 이미지가 없으면 모델을 바로 노출');
  dom.window.close();
}
const bundled = buildSync({ entryPoints: [new URL('./functional-visual-learning.mjs', import.meta.url).pathname], bundle: true, format: 'iife', platform: 'browser', write: false }).outputFiles[0].text;
const networkController = fs.readFileSync(new URL('./functional-scenario.js', import.meta.url), 'utf8');
for (const task of ['create', 'detail', 'list', 'update', 'delete']) {
  const { dom, doc, win } = mount(task, assets, true);
  let requests = 0;
  win.fetch = () => { requests++; throw new Error('설명 조작이 HTTP를 호출하면 안 됨'); };
  win.eval(networkController);
  win.eval(bundled);
  doc.dispatchEvent(new win.Event('DOMContentLoaded'));
  const token = doc.querySelector('[data-fw-token]');
  token.value = 'test-secret';
  const body = doc.querySelector('[data-fw-body]');
  const previousBody = body?.value;
  doc.querySelector('[data-fw-view="compare"]')?.click();
  const picker = doc.querySelector('[data-frv-field], [data-fqv-action="request"]');
  if (picker) picker.click();
  else {
    const control = doc.querySelector('select[data-fqv-control]');
    assert.ok(control, `${task}: 설명 모델 조작이 있어야 한다`);
    control.selectedIndex = (control.selectedIndex + 1) % control.options.length;
    control.dispatchEvent(new win.Event('change', { bubbles: true }));
  }
  assert.equal(requests, 0);
  assert.equal(token.value, 'test-secret');
  assert.equal(body?.value, previousBody, '설명 모델이 실제 전송 본문을 바꾸지 않음');
  assert.equal(doc.querySelector('[data-fw-status]').textContent, '미실행');
  assert.equal(win.localStorage.length + win.sessionStorage.length, 0, '그림·필드 조작은 진도를 기록하지 않음');
  assert.equal(doc.querySelectorAll('main main').length, 0);
  dom.window.close();
}
console.log('그림/값 비교: desktop·mobile 초기 보기, 키보드·중복 초기화·resize 선택 보존, 5기능 bundle 및 HTTP/진도/입력 격리 DOM 검사 통과');
