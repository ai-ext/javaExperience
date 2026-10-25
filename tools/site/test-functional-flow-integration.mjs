// 실제 생성 HTML의 세 script를 연결하는 DOM 통합 검사다.
// HTTP는 아래 mock만 사용하며 서버·브라우저·DB 실행이나 화면 배치를 검증하지 않는다.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const root = new URL('../../', import.meta.url);
const origin = 'https://learning.example.test';
const homeKey = 'javaexperience.home.progress.v1';
const idKey = 'javaExperience.functional.capturedId.v1';
const selfKey = 'javaExperience.functional.selfChecks.v1';
const capturedId = 57041; // mock POST가 생성해 반환하는 값. seed id를 대신 넣지 않는다.
const flow = [
  { id: 'create', file: 'create-post.html', method: 'POST', status: 201 },
  { id: 'detail', file: 'read-post.html', method: 'GET', status: 200 },
  { id: 'list', file: 'list-posts.html', method: 'GET', status: 200 },
  { id: 'update', file: 'update-post.html', method: 'PATCH', status: 200 },
  { id: 'delete', file: 'delete-post.html', method: 'DELETE', status: 204 },
];
const expectedScripts = [
  '/tools/site/functional-scenario.js',
  '/tools/site/functional-visual-learning.bundle.js',
  '/tools/site/home-learning.bundle.js',
];
const jar = { localStorage: {}, sessionStorage: {} };
const requests = [];
const copies = [];
let mockPost;
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
const snapshot = w => Object.fromEntries(Object.keys(jar).map(kind => [kind, Object.fromEntries(Object.entries(w[kind]))]));
const progress = w => JSON.parse(w.localStorage.getItem(homeKey) || 'null');
function mockResponse(status, body, headers = {}) {
  return { status, headers: { get: name => headers[name.toLowerCase()] ?? null }, text: async () => body };
}
function handleMockRequest(task, url, init) {
  const parsed = new URL(url);
  assert.equal(parsed.origin, 'http://localhost:8080', '기본 서버 주소를 읽되 실제 네트워크는 사용하지 않음');
  assert.equal(init.method, task.method);
  if (['create', 'update', 'delete'].includes(task.id)) assert.equal(init.headers.Authorization, 'Bearer integration-fixture-' + task.id, '쓰기 요청은 현재 페이지에 직접 입력한 토큰 사용');
  requests.push({ task: task.id, url, method: init.method, body: init.body, headers: { ...init.headers } });
  const headers = { 'content-type': 'application/json' };
  if (task.id === 'create') {
    assert.equal(parsed.pathname, '/api/posts');
    const body = JSON.parse(init.body);
    mockPost = { ...body, id: capturedId, viewCount: 0, deletedAt: null };
    return mockResponse(201, JSON.stringify(mockPost), { ...headers, location: '/api/posts/' + capturedId });
  }
  assert.equal(mockPost.id, capturedId);
  if (task.id === 'list') {
    assert.equal(parsed.pathname, '/api/boards/dev/posts');
    assert.deepEqual([...parsed.searchParams], [['page', '0'], ['size', '10']], '비교용 capturedId는 목록 필터가 아님');
    assert.equal(init.body, undefined);
    assert.equal(init.headers.Authorization, undefined, '목록은 익명 요청');
    assert.equal(mockPost.viewCount, 1, 'mock 목록 자체는 상세에서 올린 조회수를 변경하지 않음');
    return mockResponse(200, JSON.stringify({ items: [{ id: capturedId, title: mockPost.title, viewCount: 1 }], page: 0, size: 10, totalElements: 1, totalPages: 1, hasNext: false }), headers);
  }
  assert.equal(parsed.pathname, '/api/posts/' + capturedId, '앞 POST 응답의 실제 mock id로 연결');
  if (task.id === 'detail') {
    assert.equal(init.body, undefined);
    assert.equal(init.headers.Authorization, undefined, '상세는 익명 요청');
    mockPost.viewCount++;
    return mockResponse(200, JSON.stringify(mockPost), headers);
  }
  if (task.id === 'update') {
    assert.deepEqual(JSON.parse(init.body), { title: '통합 검사에서 직접 바꾼 제목' });
    mockPost.title = JSON.parse(init.body).title;
    return mockResponse(200, JSON.stringify(mockPost), headers);
  }
  assert.equal(task.id, 'delete');
  assert.equal(init.body, undefined);
  mockPost.deletedAt = 'mock-delete-time';
  return mockResponse(204, '', {});
}
async function openGenerated(task) {
  const pagePath = 'scenario/flow/' + task.file;
  const html = fs.readFileSync(new URL(pagePath, root), 'utf8');
  // resources 옵션을 주지 않아 script/CSS/이미지의 자동 네트워크 로딩도 하지 않는다.
  const dom = new JSDOM(html, { url: origin + '/' + pagePath, runScripts: 'outside-only' });
  const w = dom.window, d = w.document;
  if (task.id === 'create') {
    const dialog = d.querySelector('[data-fnp-dialog]');
    assert.ok(dialog, '작성 HTML에 선택형 객체 생성 패널이 연결됨');
    // native modal API만 대체한다. 실제 focus trap/scroll/layout 증거는 아니다.
    dialog.showModal = function () { this.open = true; };
    dialog.close = function () { this.open = false; this.dispatchEvent(new w.Event('close')); };
  } else assert.equal(d.querySelector('[data-fnp-root]'), null, '다른 기능에 새 생성 패널을 반복해서 넣지 않음');
  for (const [kind, values] of Object.entries(jar)) for (const [key, value] of Object.entries(values)) w[kind].setItem(key, value);
  w.scrollTo = () => {};
  w.HTMLElement.prototype.scrollIntoView = () => {};
  // 실제 링크 이동은 다음 openGenerated 호출로 재현하고 실제 href를 별도로 검사한다.
  d.addEventListener('click', event => { if (event.target.closest('a')) event.preventDefault(); });
  w.fetch = async (url, init) => handleMockRequest(task, url, init);
  Object.defineProperty(w.navigator, 'clipboard', { configurable: true, value: { writeText: async command => { copies.push({ task: task.id, command }); } } });
  const scripts = [...d.querySelectorAll('script[src]')].filter(script => expectedScripts.includes(new URL(script.src).pathname));
  assert.deepEqual(scripts.map(script => new URL(script.src).pathname), expectedScripts, task.id + ': 실제 HTML에 세 script가 순서대로 연결');
  assert.equal(scripts[2].dataset.homeTask, 'flow-' + task.id);
  for (const script of scripts) {
    const sourcePath = new URL(script.src).pathname.slice(1);
    w.eval(fs.readFileSync(new URL(sourcePath, root), 'utf8'));
  }
  d.dispatchEvent(new w.Event('DOMContentLoaded'));
  await tick();
  const workspace = d.querySelector('[data-fw-root]');
  assert.equal(workspace.dataset.fwInitialized, 'true');
  assert.equal(d.querySelector('[data-fw-visual]').dataset.fwViewInitialized, 'true', '실제 native bundle 초기화');
  assert.match(d.querySelector('[data-fw-home-status]').textContent, /둘러보기/, '홈 bundle의 명시 시작 전 상태');
  return { dom, w, d, workspace };
}
function enter(env, selector, value) {
  const input = env.d.querySelector(selector);
  input.value = value;
  input.dispatchEvent(new env.w.Event('input', { bubbles: true }));
}

async function inspectNewPostFocus({ w, d }, expectedRequests) {
  const focus = d.querySelector('[data-fnp-root]');
  const opener = focus.querySelector('[data-fnp-open]');
  const dialog = focus.querySelector('[data-fnp-dialog]');
  assert.equal(opener.disabled, false, '실제 visual bundle이 선택 진입을 활성화');
  const readOutside = () => ({
    storage: snapshot(w), location: w.location.href, history: JSON.stringify(w.history.state), copies: copies.length,
    inputs: [...d.querySelector('[data-fw-form]').querySelectorAll('input,textarea,select')].map(input => input.value),
    status: d.querySelector('[data-fw-status]').textContent,
    response: d.querySelector('[data-fw-response]').textContent,
    visual: d.querySelector('[data-fw-visual]').innerHTML,
  });
  const previous = readOutside();
  opener.click();
  assert.equal(dialog.open, true);
  assert.equal(focus.dataset.fnpViewActive, 'compare');
  assert.equal(focus.dataset.fnpPhaseActive, 'after');
  assert.match(dialog.textContent, /새 게시글/);
  assert.doesNotMatch(dialog.textContent, /패널에 넘기지 않는 개인 제목|개인 요청 본문|57041/,
    '설명은 입력·응답 id를 읽어 실측값처럼 표시하지 않음');
  focus.querySelector('[data-fnp-phase="before"]').click();
  assert.equal(focus.querySelector('[data-fnp-phase-panel="before"]').hidden, false);
  assert.match(focus.querySelector('[data-fnp-phase-caption]').textContent, /생성 전/);
  focus.querySelector('[data-fnp-view="image"]').click();
  assert.equal(focus.querySelector('[data-fnp-compare]').hidden, true);
  assert.equal(focus.querySelector('[data-fnp-image]').hidden, false);
  assert.match(focus.querySelector('figcaption').textContent, /생성 후/);
  focus.querySelector('[data-fnp-close]').click();
  assert.equal(dialog.open, false);
  assert.equal(d.activeElement, opener);
  opener.click();
  assert.equal(focus.dataset.fnpViewActive, 'image', '다시 열어도 선택한 보기 유지');
  assert.equal(focus.dataset.fnpPhaseActive, 'before');
  dialog.dispatchEvent(new w.Event('cancel', { cancelable: true }));
  assert.equal(dialog.open, false);
  assert.equal(d.activeElement, opener);
  await tick();
  assert.deepEqual(readOutside(), previous, '패널 왕복 뒤 입력·응답·저장소·진도·기존 시각화·URL/history 유지');
  assert.equal(requests.length, expectedRequests, '설명 열기/선택/닫기는 HTTP를 추가하지 않음');
}

for (const [index, task] of flow.entries()) {
  const env = await openGenerated(task);
  const { w, d, workspace } = env;
  assert.equal(requests.length, index, '페이지를 여는 것만으로 요청하지 않음');
  assert.equal(d.querySelector('[data-fw-token]').value, '', '다음 페이지에 토큰을 전달하지 않음');
  assert.equal(d.querySelector('[data-fw-status]').textContent, '미실행');
  assert.equal(workspace.dataset.fwSelfComplete, 'false');
  const beforeProgress = progress(w);
  assert.equal(beforeProgress?.active ?? null, index ? 'flow-' + flow[index - 1].id : null, '새 과제 열람은 이전 홈 active를 바꾸지 않음');
  if (index) {
    assert.equal(d.querySelector('[data-fw-id]').value, String(capturedId));
    assert.equal(w.sessionStorage.getItem(idKey), String(capturedId));
  }
  if (['create', 'update', 'delete'].includes(task.id)) enter(env, '[data-fw-token]', 'integration-fixture-' + task.id);
  if (task.id === 'create') enter(env, '[data-fw-body]', JSON.stringify({
    ...JSON.parse(d.querySelector('[data-fw-body]').value),
    title: '패널에 넘기지 않는 개인 제목', content: '개인 요청 본문',
  }));
  if (task.id === 'update') enter(env, '[data-fw-body]', '{"title":"통합 검사에서 직접 바꾼 제목"}');

  const beforeVisualAndCopy = snapshot(w);
  const requestBody = d.querySelector('[data-fw-body]')?.value;
  d.querySelector('[data-fw-view="compare"]')?.click();
  const stateButtons = [...d.querySelectorAll('[data-fw-state]')];
  if (task.id === 'list') assert.equal(stateButtons.length, 0, '목록은 한 모델에서 조건부터 페이지까지 비교');
  else stateButtons[1].click();
  const panel = d.querySelector('[data-fw-state-panel]:not([hidden])');
  if (panel.querySelector('[data-frv-root]')) {
    panel.querySelector('[data-frv-field="tags"]').click();
    assert.equal(panel.querySelector('[data-frv-root]').dataset.frvSelected, 'tags', '실제 runtime controller의 필드 강조');
  } else if (task.id === 'list') {
    const viewer = panel.querySelector('[data-fqv-control="viewer"]');
    viewer.value = 'anonymous';
    viewer.dispatchEvent(new w.Event('change', { bubbles: true }));
    assert.equal(JSON.parse(panel.querySelector('[data-fqv]').dataset.fqvControls).viewer, 'anonymous', '실제 query controller의 설명용 조건 전환');
  } else {
    panel.querySelector('[data-fqv-action="request"][data-fqv-value="empty"]').click();
    assert.equal(JSON.parse(panel.querySelector('[data-fqv]').dataset.fqvControls).requestPreset, 'empty');
  }
  d.querySelector('[data-fw-copy-request]').click();
  await tick();
  assert.equal(copies.length, index + 1);
  assert.equal(d.querySelector('[data-fw-body]')?.value, requestBody, 'native 조작은 실제 요청 본문을 변경하지 않음');
  assert.deepEqual(snapshot(w), beforeVisualAndCopy, 'copy/native/view 조작은 storage·진도에 영향 없음');
  assert.equal(requests.length, index, '설명 조작과 curl 복사는 API를 호출하지 않음');
  assert.equal(d.querySelector('[data-fw-status]').textContent, '미실행');

  d.querySelector('[data-fw-begin]').focus();
  d.querySelector('[data-fw-begin]').click();
  assert.equal(d.activeElement, d.querySelector('.fw-code-panel h2'), '시작 버튼이 사라진 뒤 구현할 메서드 제목으로 초점 연결');
  assert.equal(progress(w).active, 'flow-' + task.id, '명시 시작만 홈 active를 현재 과제로 변경');
  assert.equal(progress(w).records['flow-' + task.id].status, 'in-progress');
  assert.equal(d.querySelector('[data-fw-begin]').hidden, true);
  d.querySelector('[data-fw-send]').click();
  await tick(); await tick();
  assert.equal(requests.length, index + 1, '명시 전송 한 번에 요청 한 번');
  assert.match(d.querySelector('[data-fw-status]').textContent, new RegExp('HTTP ' + task.status));
  assert.equal(workspace.dataset.fwSelfComplete, 'false', 'HTTP 수신은 수동 완료와 별개');
  assert.equal(progress(w).records['flow-' + task.id].status, 'in-progress');
  assert.equal(d.querySelectorAll('[data-fw-check]:checked').length, 0);
  if (task.id === 'create') {
    assert.equal(w.sessionStorage.getItem(idKey), String(capturedId));
    assert.equal(d.querySelector('[data-fw-id]').value, String(capturedId));
    await inspectNewPostFocus(env, index + 1);
  }
  if (task.id === 'delete') {
    assert.match(d.querySelector('[data-fw-response]').textContent, /HTTP 204[\s\S]*본문 없음/);
    assert.equal(mockPost.deletedAt, 'mock-delete-time', '이 값은 mock 결과이며 실제 DB 관찰이 아님');
  }
  const checks = [...d.querySelectorAll('[data-fw-check]')];
  for (const check of checks.slice(0, -1)) check.click();
  assert.equal(progress(w).records['flow-' + task.id].status, 'in-progress', '완료 기준 일부 확인은 완료가 아님');
  checks.at(-1).click();
  assert.equal(workspace.dataset.fwSelfComplete, 'true');
  assert.equal(progress(w).records['flow-' + task.id].status, 'complete', '수동 확인 이벤트가 실제 home bundle에 연결');
  assert.equal(JSON.parse(w.localStorage.getItem(selfKey))[task.id].length, checks.length);
  if (index < flow.length - 1) {
    assert.equal(new URL(d.querySelector('[data-fw-next]').href).pathname, '/scenario/flow/' + flow[index + 1].file);
    assert.equal(progress(w).active, 'flow-' + task.id, '다음 링크 노출만으로 자동 시작하지 않음');
  }
  Object.assign(jar, snapshot(w));
  assert.doesNotMatch(JSON.stringify(jar), /integration-fixture-/, '입력한 쓰기 토큰은 모든 공유 storage에서 제외');
  env.dom.window.close();
}
assert.deepEqual(requests.map(request => request.method), ['POST', 'GET', 'GET', 'PATCH', 'DELETE']);
assert.equal(jar.sessionStorage[idKey], String(capturedId));
const finalHome = JSON.parse(jar.localStorage[homeKey]);
assert.equal(finalHome.active, 'flow-delete');
for (const task of flow) assert.equal(finalHome.records['flow-' + task.id].status, 'complete');
console.log('생성 HTML 5쪽 × 실제 script 3개 통합: capturedId 연속·홈 명시 시작/수동 완료·선택형 new 패널·native/curl 비실행·입력 격리·토큰 비저장·204 분리 통과 (HTTP mock 5회; native API 대체; 실서버/브라우저/DB/레이아웃 검증 아님)');
