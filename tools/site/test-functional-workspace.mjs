import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { JSDOM } from 'jsdom';
import { FUNCTIONAL_TASKS, FUNCTIONAL_TASK_BY_ID } from './functional-scenario-data.mjs';
import { renderFunctionalWorkspace, renderFunctionalCatalog } from './functional-scenario.mjs';
import { getFunctionalVisualModel } from './functional-visual-model.mjs';

const controller = fs.readFileSync(new URL('./functional-scenario.js', import.meta.url), 'utf8');
const idKey = 'javaExperience.functional.capturedId.v1';
const progressKey = 'javaExperience.functional.selfChecks.v1';
const tick = () => new Promise(resolve => setTimeout(resolve, 0));
function mount(taskId, { fetch, storedId, savedChecks, blockedStorage = false, timeout, url } = {}) {
  const dom = new JSDOM(renderFunctionalWorkspace({ task: FUNCTIONAL_TASK_BY_ID[taskId] }), { url: url || 'https://example.test/scenario/flow/task.html', runScripts: 'outside-only' });
  const w = dom.window;
  if (savedChecks) w.localStorage.setItem(progressKey, JSON.stringify(savedChecks));
  if (storedId) { w.sessionStorage.setItem(idKey, storedId); w.sessionStorage.setItem('javaExperience.functional.serverBase.v1', 'http://localhost:8080'); }
  if (blockedStorage) for (const kind of ['sessionStorage', 'localStorage']) Object.defineProperty(w, kind, { get() { throw new Error('blocked'); } });
  if (timeout) w.document.querySelector('[data-fw-root]').dataset.requestTimeout = String(timeout);
  w.fetch = fetch || (() => { throw new Error('명시 전송 전에 fetch가 호출되면 안 됩니다.'); });
  w.eval(controller);
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  return { dom, w, d: w.document, root: w.document.querySelector('[data-fw-root]') };
}
function send(env) { env.d.querySelector('[data-fw-form]').dispatchEvent(new env.w.Event('submit', { bubbles: true, cancelable: true })); }
function response(status, text, headers = {}) { return { status, headers: { get: key => headers[key.toLowerCase()] || null }, text: async () => text }; }

{
  const env = mount('detail', { storedId: '87' });
  let copied;
  Object.defineProperty(env.w.navigator, 'clipboard', { value: { writeText: async text => { copied = text; } } });
  const before = [env.d.querySelector('[data-fw-token]').value, env.d.querySelector('[data-fw-id]').value, env.d.querySelector('[data-fw-status]').textContent];
  const button = env.d.querySelector('[data-fw-file-copy]');
  assert.ok(button, '현재 구현할 파일 경로를 복사하는 동작을 제공한다');
  button.click(); await tick();
  assert.equal(copied, FUNCTIONAL_TASK_BY_ID.detail.target.path);
  assert.match(env.d.querySelector('[data-fw-file-copy-status]').textContent, /복사했습니다/);
  assert.deepEqual([env.d.querySelector('[data-fw-token]').value, env.d.querySelector('[data-fw-id]').value, env.d.querySelector('[data-fw-status]').textContent], before);
  env.dom.window.close();
}
{
  const env = mount('update');
  Object.defineProperty(env.w.navigator, 'clipboard', { value: { writeText: async () => { throw new Error('unavailable'); } } });
  const button = env.d.querySelector('[data-fw-file-copy]');
  assert.ok(button);
  button.click(); await tick();
  const fallback = env.d.querySelector('[data-fw-file-copy-fallback]');
  const text = env.d.querySelector('[data-fw-file-copy-text]');
  assert.equal(fallback.hidden, false);
  assert.equal(text.readOnly, true);
  assert.equal(text.value, FUNCTIONAL_TASK_BY_ID.update.target.path);
  assert.equal(env.d.activeElement, text);
  assert.equal(text.selectionEnd, text.value.length);
  assert.equal(env.d.querySelector('[data-fw-status]').textContent, '미실행');
  env.dom.window.close();
}

// 요청 script가 로드되지 않아도 HTML 기본 GET이 토큰/본문을 URL로 직렬화하면 안 된다.
for (const task of FUNCTIONAL_TASKS) {
  const dom = new JSDOM(renderFunctionalWorkspace({ task }), { url: 'https://learning.example.test/task.html', runScripts: 'outside-only' });
  const d = dom.window.document;
  const form = d.querySelector('[data-fw-form]');
  d.querySelector('[data-fw-token]').value = 'not-a-real-token';
  if (d.querySelector('[data-fw-body]')) d.querySelector('[data-fw-body]').value = '{"title":"비공개 입력 예시"}';
  assert.equal(d.querySelector('[data-fw-send]').disabled, true, '요청 처리기가 준비되기 전에는 제출 불가');
  assert.equal(d.querySelector('[data-fw-copy-request]').disabled, true);
  assert.deepEqual([...new dom.window.FormData(form).entries()], [], '브라우저 기본 form 제출로 요청 정보가 직렬화되지 않음');
  dom.window.fetch = () => { throw new Error('초기화는 실제 요청을 보내지 않음'); };
  dom.window.eval(controller);
  d.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  assert.equal(d.querySelector('[data-fw-send]').disabled, false);
  assert.equal(d.querySelector('[data-fw-copy-request]').disabled, false);
  assert.equal(d.querySelector('[data-fw-startup]').hidden, true);
  assert.equal(d.querySelector('[data-fw-status]').textContent, '미실행');
  dom.window.close();
}

for (const task of FUNCTIONAL_TASKS) {
  const { dom, d } = mount(task.id);
  assert.equal(d.querySelector('h1').textContent, task.title);
  assert.equal(d.querySelectorAll('.fw-actions li').length, task.actions.length);
  assert.match(d.querySelector('.fw-code-panel pre').textContent, new RegExp(task.target.symbol + '\\('));
  assert.equal(d.querySelector('[data-fw-status]').textContent, '미실행');
  assert.equal(d.querySelector('[data-fw-state-panel]:not([hidden])').dataset.fwStatePanel, task.visualization.initialState);
  assert.equal(d.querySelectorAll('.fw-state-grid > section').length, task.visualization.states.length * 6);
  assert.equal(d.querySelector('[data-fw-token]').value, '');
  assert.equal(d.querySelector('[data-fw-file-note]').hidden, true, '문서 HTTP 주소에서는 파일 안내를 숨김');
  assert.equal(d.querySelector('[data-fw-token]').required, false, '익명 GET과 토큰 없는 쓰기 401 연습을 막지 않음');
  assert.deepEqual([...d.querySelector('.fw-request-grid').children].map(item => item.className), ['fw-request-form', 'fw-actual', 'fw-expected', 'fw-db-check'], '보낼 요청→실제 응답→기대 기준→직접 DB 확인 순서');
  assert.ok([...d.querySelectorAll('.fw-image img')].every(img => !img.src.includes('F02-')), 'UI 시안을 본문 이미지로 사용하지 않음');
  assert.ok(d.querySelector('[data-fw-next]') || task.id === 'delete');
  dom.window.close();
}
{
  const e = mount('update');
  assert.equal(e.d.querySelectorAll('[data-fw-state]').length, 4, 'PATCH는 요청 전/객체 변경/확정/취소 네 상태로 구분');
  assert.equal(e.d.querySelectorAll('[data-fw-state="patch-tags"]').length, 0, '태그와 제목을 같은 시점의 중복 장면으로 나누지 않음');
  assert.ok(e.d.querySelector('[data-fw-state="patch-title"]').textContent.includes('객체 변경'));
  e.dom.window.close();
}
{
  const dom = new JSDOM(renderFunctionalWorkspace({ task: FUNCTIONAL_TASK_BY_ID.list }));
  const visual = dom.window.document.querySelector('[data-fw-visual]');
  const duplicateRegions = [...visual.querySelectorAll('[role="region"]')]
    .filter(element => element.getAttribute('aria-labelledby') === visual.getAttribute('aria-labelledby'));
  assert.equal(duplicateRegions.length, 0, '한 비교 영역 안에 같은 이름의 중복 region을 만들지 않음');
  dom.window.close();
}
const catalog = new JSDOM(renderFunctionalCatalog());
{
  const env = mount('list');
  assert.equal(env.d.querySelectorAll('[data-fqv="list"]').length, 1, '목록은 조건·정렬·COUNT·페이지를 한 모델에서 연속 비교');
  assert.equal(env.d.querySelectorAll('[data-fw-state]').length, 0, '같은 목록 그림을 반복하는 단계 탭을 만들지 않음');
  env.dom.window.close();
}
assert.equal(catalog.window.document.querySelectorAll('.fw-catalog-list .fw-task-link').length, 5, '게시글 기본 기능5개');
assert.equal(catalog.window.document.querySelectorAll('.functional-like-catalog .fw-task-link').length, 2, '좋아요 확장2개는 별도 그룹');
assert.match(catalog.window.document.body.textContent, /같은 프로젝트/);
assert.equal(catalog.window.document.querySelector('h1').textContent, '서비스 만들기 · 게시글 기능');
assert.match(catalog.window.document.body.textContent, /게시글 API 만들기/);
assert.equal(catalog.window.document.querySelectorAll('.fw-project-context').length, 1);
assert.match(catalog.window.document.querySelector('.fw-project-context').textContent, /community.*board-server/s);
assert.equal(catalog.window.document.querySelectorAll('.fw-catalog-columns > span').length, 4);
assert.equal(catalog.window.document.querySelectorAll('.fw-catalog-row').length, 5);
assert.equal(catalog.window.document.querySelector('.fw-common-start a[download]').getAttribute('href'), '../scenario/flow/packages/create.zip');
assert.match(catalog.window.document.querySelector('.fw-common-start').textContent, /Controller.*DTO.*인증.*Entity.*Repository/);
for (const [index, row] of [...catalog.window.document.querySelectorAll('.fw-catalog-row')].entries()) {
  const task = FUNCTIONAL_TASKS[index];
  assert.match(row.querySelector('.fw-catalog-name').textContent, new RegExp(task.title));
  assert.ok(row.querySelector('.fw-catalog-implementation').textContent.includes(task.target.symbol));
  assert.ok(row.querySelector('.fw-catalog-api').textContent.includes(task.api.method));
  assert.ok(row.querySelector('.fw-catalog-api').textContent.includes(task.api.path));
  assert.ok(row.querySelector('.fw-catalog-outcome').textContent.trim());
  assert.equal(row.querySelector('.fw-catalog-open').getAttribute('href'), '../' + task.sourcePath.replace(/\.md$/, '.html'));
  assert.equal(row.querySelectorAll('.fw-catalog-row, img').length, 0, 'flat 행 안에 중첩 카드와 이미지 없음');
}
assert.match(catalog.window.document.querySelector('.fw-catalog-continuity').textContent, /POST 실제 응답의 id/);
assert.ok(catalog.window.document.querySelector('[href$="scenario/README.html#legacy-scenarios"]'));
catalog.window.close();
// 파일 존재·원본 열기만 검사하는 기존 이미지 fixture. 이 파일을 새 과제의 승인 이미지로 등록하지 않는다.
const fixtureImage = 'docs/design/mockups-2026-10-16-batch21/06-tags-batch.jpg';
const injected = new JSDOM(renderFunctionalWorkspace({ task: FUNCTIONAL_TASK_BY_ID.create, assets: { create: fixtureImage } }));
assert.equal(injected.window.document.querySelectorAll('.fw-image img').length, 1);
const fullImage = injected.window.document.querySelector('.fw-image-open');
assert.equal(fullImage?.getAttribute('href'), '../../' + fixtureImage);
assert.equal(fullImage?.getAttribute('target'), '_blank');
assert.match(fullImage?.getAttribute('rel') || '', /noopener/);
injected.window.close();
const rejectedUi = new JSDOM(renderFunctionalWorkspace({ task: FUNCTIONAL_TASK_BY_ID.create, assets: { create: 'docs/design/scenario-crud-2026-10-20/images/F02-create-workspace-v1.jpg' } }));
assert.equal(rejectedUi.window.document.querySelectorAll('.fw-image img').length, 0, 'UI 시안은 명시 매핑되어도 학습 본문으로 거절');
rejectedUi.window.close();
const missing = new JSDOM(renderFunctionalWorkspace({ task: FUNCTIONAL_TASK_BY_ID.create, assets: { create: 'no-such-image.png' } }));
assert.equal(missing.window.document.querySelectorAll('img').length, 0);
missing.window.close();

{
  const env = mount('create');
  const tabs = [...env.d.querySelectorAll('[data-fw-state]')];
  tabs[0].dispatchEvent(new env.w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  assert.equal(env.d.activeElement, tabs[1]);
  assert.equal(tabs[1].getAttribute('aria-selected'), 'true');
  assert.equal(env.d.querySelector('[data-fw-state-panel]:not([hidden])').dataset.fwStatePanel, tabs[1].dataset.fwState);
  assert.equal(env.root.dataset.taskId, 'create', '시각화 조작은 과제를 바꾸지 않음');
  const check = env.d.querySelector('[data-fw-check]');
  check.checked = true;
  check.dispatchEvent(new env.w.Event('change', { bubbles: true }));
  assert.deepEqual(JSON.parse(env.w.localStorage.getItem(progressKey)).create, [check.value]);
  assert.equal(env.d.querySelector('[data-fw-status]').textContent, '미실행', '자기확인은 API 판정과 별개');
  env.dom.window.close();
}
{
  let resolveFetch, calls = 0, options;
  const env = mount('create', { fetch: (_url, init) => { calls++; options = init; return new Promise(resolve => { resolveFetch = resolve; }); } });
  env.d.querySelector('[data-fw-token]').value = 'secret-token';
  send(env); send(env);
  assert.equal(calls, 1, '중복 전송 방지');
  assert.equal(env.d.querySelector('[data-fw-send]').disabled, true);
  assert.equal(options.headers.Authorization, 'Bearer secret-token');
  resolveFetch(response(201, JSON.stringify({ id: 87, title: '<img src=x onerror=alert(1)>' }), { location: '/api/posts/87' }));
  await tick(); await tick();
  assert.equal(env.w.sessionStorage.getItem(idKey), '87');
  assert.equal(env.d.querySelector('[data-fw-response]').querySelector('img'), null, '서버 문자열은 HTML로 삽입하지 않음');
  assert.match(env.d.querySelector('[data-fw-response]').textContent, /<img/);
  assert.equal(env.d.querySelector('[data-fw-check]').checked, false, '응답으로 자기확인을 자동 체크하지 않음');
  assert.equal(env.w.localStorage.getItem(progressKey), null);
  assert.ok(!Object.values(env.w.localStorage).some(value => value.includes('secret-token')));
  assert.ok(!Object.values(env.w.sessionStorage).some(value => value.includes('secret-token')));
  env.d.querySelector('[data-fw-body]').value = '{}';
  env.d.querySelector('[data-fw-body]').dispatchEvent(new env.w.Event('input', { bubbles: true }));
  assert.match(env.d.querySelector('[data-fw-status]').textContent, /입력 변경/);
  env.dom.window.close();
}
for (const taskId of ['detail', 'list', 'update', 'delete']) {
  let url, init;
  const env = mount(taskId, { storedId: '87', fetch: async (u, i) => { url = u; init = i; return response(taskId === 'delete' ? 204 : 200, taskId === 'delete' ? '' : '{}'); } });
  assert.equal(env.d.querySelector('[data-fw-id]').value, '87');
  assert.equal(env.d.querySelector('[data-fw-token]').value, '', '토큰은 다음 과제로 전달하지 않음');
  send(env); await tick(); await tick();
  if (taskId !== 'list') assert.match(url, /\/87$/);
  else assert.match(url, /\/dev\/posts\?page=0&size=10$/);
  if (taskId === 'delete') {
    assert.equal(init.body, undefined);
    assert.match(env.d.querySelector('[data-fw-response]').textContent, /본문 없음/);
  }
  env.dom.window.close();
}
{
  let calls = 0;
  const env = mount('update', { storedId: '87', fetch: async () => { calls++; return response(200, '{}'); } });
  const variants = [...env.d.querySelectorAll('[data-fw-variant]')];
  variants[1].click();
  assert.deepEqual(JSON.parse(env.d.querySelector('[data-fw-body]').value), { tags: null });
  variants[2].click();
  assert.deepEqual(JSON.parse(env.d.querySelector('[data-fw-body]').value), { tags: [] });
  assert.equal(calls, 0, '요청 예시 선택은 전송하지 않음');
  env.d.querySelector('[data-fw-body]').value = '{broken';
  send(env); await tick();
  assert.equal(calls, 0);
  assert.match(env.d.querySelector('[data-fw-status]').textContent, /JSON/);
  const unsentOutput = env.d.querySelector('[data-fw-response]').textContent;
  env.d.querySelector('[data-fw-body]').value = '{"title":"다시 확인할 입력"}';
  env.d.querySelector('[data-fw-body]').dispatchEvent(new env.w.Event('input', { bubbles: true }));
  assert.equal(env.root.dataset.fwRequestState, 'idle', '전송 전 오류 뒤 입력 변경은 미실행으로 되돌린다');
  assert.match(env.d.querySelector('[data-fw-status]').textContent, /미실행/);
  assert.doesNotMatch(env.d.querySelector('[data-fw-status]').textContent, /JSON 문법/);
  assert.equal(env.d.querySelector('[data-fw-response]').textContent, unsentOutput);
  assert.equal(calls, 0, '입력 수정은 서버 요청이나 유효성 통과 판정이 아니다');
  env.dom.window.close();
}
{
  const env = mount('create', { blockedStorage: true, fetch: async () => response(201, '{"id":88}', { location: '/api/posts/88' }) });
  send(env); await tick(); await tick();
  assert.match(env.d.querySelector('[data-fw-storage]').textContent, /저장/);
  assert.equal(env.d.querySelector('[data-fw-captured]').textContent, '88');
  env.dom.window.close();
}
{
  const env = mount('create', { fetch: async () => { throw new TypeError('Failed to fetch'); } });
  send(env); await tick();
  assert.match(env.d.querySelector('[data-fw-status]').textContent, /실패/);
  assert.match(env.d.querySelector('[data-fw-response]').textContent, /CORS/);
  assert.equal(env.d.querySelector('[data-fw-send]').disabled, false);
  env.dom.window.close();
}
{
  const env = mount('create', { timeout: 10, fetch: (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new env.w.DOMException('timeout', 'AbortError')))) });
  send(env); await new Promise(resolve => setTimeout(resolve, 30));
  assert.match(env.d.querySelector('[data-fw-status]').textContent, /시간 초과/);
  assert.equal(env.d.querySelector('[data-fw-send]').disabled, false);
  env.dom.window.close();
}
{
  const ids = FUNCTIONAL_TASK_BY_ID.detail.completion.map(item => item.id);
  const env = mount('detail', { savedChecks: { detail: ids, create: ['created'] } });
  assert.equal(env.root.dataset.fwSelfComplete, 'true', '재방문 자기확인 복원');
  let observed;
  env.d.addEventListener('functional-progress-change', event => { observed = event.detail; });
  const check = env.d.querySelector('[data-fw-check]');
  check.checked = false;
  check.dispatchEvent(new env.w.Event('change', { bubbles: true }));
  assert.equal(observed.taskId, 'detail');
  assert.equal(observed.complete, false, '완료 해제 이벤트');
  assert.deepEqual(JSON.parse(env.w.localStorage.getItem(progressKey)).create, ['created'], '다른 과제 기록 보존');
  const storage = JSON.parse(env.w.localStorage.getItem(progressKey));
  storage.detail = ids;
  env.w.localStorage.setItem(progressKey, JSON.stringify(storage));
  env.w.dispatchEvent(new env.w.StorageEvent('storage', { key: progressKey }));
  assert.equal(env.root.dataset.fwSelfComplete, 'true', '다른 탭의 저장 변경 반영');
  assert.equal(env.d.querySelector('[data-fw-status]').textContent, '미실행');
  env.dom.window.close();
}
{
  let resolveFetch;
  const env = mount('create', { fetch: () => new Promise(resolve => { resolveFetch = resolve; }) });
  send(env);
  env.d.querySelector('[data-fw-body]').value = '{"title":"다른 입력"}';
  env.d.querySelector('[data-fw-body]').dispatchEvent(new env.w.Event('input', { bubbles: true }));
  resolveFetch(response(201, '{"id":99}'));
  await tick(); await tick();
  assert.equal(env.root.dataset.fwRequestState, 'stale');
  assert.match(env.d.querySelector('[data-fw-status]').textContent, /현재 입력의 결과가 아닙니다/);
  assert.equal(env.w.sessionStorage.getItem(idKey), null, '편집한 입력과 다른 POST 결과 id는 자동 연결하지 않음');
  env.dom.window.close();
}
{
  let requested;
  const env = mount('detail', { storedId: '87', fetch: async url => { requested = url; return response(200, '{}'); } });
  const base = env.d.querySelector('[data-fw-base]');
  base.value = 'https://other-server.example.test';
  base.dispatchEvent(new env.w.Event('input', { bubbles: true }));
  assert.equal(env.d.querySelector('[data-fw-id]').value, '');
  assert.equal(env.w.sessionStorage.getItem(idKey), null, '서버를 바꾸면 다른 서버의 글 id 해제');
  assert.match(env.d.querySelector('[data-fw-storage]').textContent, /서버 주소/);
  send(env); await tick();
  assert.equal(requested, undefined, '새 서버 id 입력 없이 전송하지 않음');
  env.dom.window.close();
}
{
  const env = mount('create', { fetch: async () => response(400, '{"message":"검증 오류"}') });
  send(env); await tick(); await tick();
  assert.match(env.d.querySelector('[data-fw-status]').textContent, /HTTP 400/);
  assert.match(env.d.querySelector('[data-fw-status]').textContent, /기대 상태 코드는 201/);
  assert.equal(env.w.sessionStorage.getItem(idKey), null);
  assert.equal(env.root.dataset.fwSelfComplete, 'false');
  env.dom.window.close();
}
{
  const env = mount('create');
  const setup = env.d.querySelector('#functional-setup');
  assert.equal(setup.querySelectorAll('.fw-setup-step').length, 4);
  for (const term of ['JDK 21', 'DB_PORT=13308 docker compose up -d mysql', 'docker compose ps mysql', 'community', './gradlew bootRun', '/api/start/ping', 'tok-kimjava', '별도 교육용 패키지']) assert.ok(setup.textContent.includes(term), term);
  assert.doesNotMatch(setup.textContent, /docker compose down|down -v/);
  assert.match(setup.textContent, /코드 수정.*Ctrl\+C.*앱만.*bootRun.*다시/s);
  assert.match(env.d.querySelector('.fw-request').textContent, /코드 수정 후.*앱만 재시작/);
  assert.doesNotMatch(setup.textContent, /이미 이 학습 서버가 실행 중이라면 같은 서버를 사용/);
  assert.equal(env.d.querySelector('.fw-setup-link').getAttribute('href'), '#functional-setup');
  assert.equal(env.d.querySelector('[data-fw-token]').value, '');
  assert.match(env.d.querySelector('[data-fw-token]').parentElement.nextElementSibling.textContent, /tok-kimjava/);
  env.w.location.hash = '#functional-setup';
  env.w.dispatchEvent(new env.w.HashChangeEvent('hashchange'));
  assert.equal(setup.open, true);
  assert.equal(env.root.dataset.fwRequestState, 'idle');
  assert.equal(env.w.localStorage.getItem(progressKey), null);
  env.dom.window.close();
}
for (const hash of ['#legacy-scenarios', '#%EA%B8%B0%EC%A1%B4-%EB%AA%A9%EC%B0%A8']) {
  const dom = new JSDOM('<section class="functional-catalog"></section><details id="legacy-scenarios"><summary>기존 안내</summary><details id="inner"><summary>목차</summary><h2 id="기존-목차">원문 목차</h2></details></details>', { url: 'https://example.test/scenario/README.html' + hash, runScripts: 'outside-only' });
  let events = 0, otherHashHandler = 0;
  dom.window.document.addEventListener('functional-progress-change', () => events++);
  dom.window.addEventListener('hashchange', () => otherHashHandler++);
  dom.window.eval(controller);
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  assert.equal(dom.window.document.querySelector('#legacy-scenarios').open, true, 'workspace가 없는 catalog에서도 원문 진입 열기');
  if (hash !== '#legacy-scenarios') assert.equal(dom.window.document.querySelector('#inner').open, true, '원문 앵커 상위 details 모두 열기');
  dom.window.document.querySelectorAll('details').forEach(item => { item.open = false; });
  dom.window.history.replaceState(null, '', '#%EA%B8%B0%EC%A1%B4-%EB%AA%A9%EC%B0%A8');
  dom.window.dispatchEvent(new dom.window.HashChangeEvent('hashchange'));
  assert.equal(dom.window.document.querySelector('#legacy-scenarios').open, true);
  assert.equal(dom.window.document.querySelector('#inner').open, true);
  assert.equal(otherHashHandler, 1, '기존 hash handler와 공존');
  assert.equal(events, 0, '단순 원문 열람은 과제 진도를 바꾸지 않음');
  assert.equal(dom.window.localStorage.getItem(progressKey), null);
  dom.window.close();
}
for (const testCase of [
  { label: '201 id 누락', body: {}, location: '/api/posts/87', warning: /body.id/ },
  { label: '정본 Long과 다른 문자열 id', body: { id: '87' }, location: '/api/posts/87', warning: /숫자/ },
  { label: '안전 범위를 벗어난 id', body: { id: 9007199254740992 }, location: '/api/posts/9007199254740992', warning: /안전/ },
  { label: 'id와 Location 불일치', body: { id: 87 }, location: '/api/posts/999', warning: /불일치/ },
  { label: '다른 서버의 Location', body: { id: 87 }, location: 'https://other.example.test/api/posts/87', warning: /불일치/ },
  { label: 'Location 읽기 불가', body: { id: 87 }, location: null, warning: /Location.*미확인/ },
]) {
  const env = mount('create', { storedId: '86', fetch: async () => response(201, JSON.stringify(testCase.body), { location: testCase.location }) });
  assert.equal(env.d.querySelector('[data-fw-captured]').textContent, '86');
  send(env); await tick(); await tick();
  assert.equal(env.w.sessionStorage.getItem(idKey), null, testCase.label + ': 이전/오류 id 자동 연결 금지');
  assert.equal(env.d.querySelector('[data-fw-id]').value, '', testCase.label + ': 이전 id 입력 해제');
  assert.equal(env.d.querySelector('[data-fw-captured]').textContent, '아직 없음');
  assert.match(env.d.querySelector('[data-fw-storage]').textContent, testCase.warning, testCase.label);
  assert.equal(env.root.dataset.fwSelfComplete, 'false');
  env.dom.window.close();
}
{
  const env = mount('create', { storedId: '86', fetch: async () => response(201, '{"id":87}', { location: 'http://localhost:8080/api/posts/87' }) });
  send(env); await tick(); await tick();
  assert.equal(env.w.sessionStorage.getItem(idKey), '87', '동일 서버의 숫자 id와 절대 Location이 일치할 때만 자동 연결');
  env.dom.window.close();
}
{
  const task = structuredClone(FUNCTIONAL_TASK_BY_ID.create);
  task.visualization.states[0].code = ['String example = "<img src=x onerror=alert(1)>";'];
  const dom = new JSDOM(renderFunctionalWorkspace({ task }), { runScripts: 'outside-only' });
  const d = dom.window.document;
  assert.equal(d.querySelector('.fw-code-panel pre code').className, 'language-java');
  assert.equal(d.querySelector('.fw-answer pre code').className, 'language-java');
  assert.equal(d.querySelectorAll('.fw-lane-code code.language-java').length, task.visualization.states.length);
  assert.equal(d.querySelectorAll('.fw-lane-sql code.language-sql').length, task.visualization.states.length);
  const codeNodes = [...d.querySelectorAll('code.language-java, code.language-sql')];
  const before = codeNodes.map(code => code.textContent);
  dom.window.eval(fs.readFileSync(new URL('./syntax-highlight.js', import.meta.url), 'utf8'));
  assert.deepEqual(codeNodes.map(code => code.textContent), before, '실제 기존 syntax highlighter 적용 전후 코드 텍스트 보존');
  assert.ok(d.querySelector('.fw-code-panel .syntax-keyword'), '새 라이브러리 없이 기존 Java 강조 연결');
  assert.equal(d.querySelectorAll('.fw-lane-code img').length, 0, '코드의 사용자 문자열은 HTML로 실행하지 않음');
  assert.equal(d.querySelector('.fw-lane-code code').textContent, task.visualization.states[0].code[0]);
  dom.window.close();
}
{
  const env = mount('create');
  const id = env.d.querySelector('[data-fw-id]');
  assert.equal(id.readOnly, true, '작성 id는 서버가 생성하므로 직접 입력하지 않음');
  assert.equal(id.required, false);
  assert.match(id.parentElement.textContent, /생성된 글 id · 응답 후 연결/);
  assert.match(env.d.querySelector('[data-fw-base]').parentElement.textContent, /실습 서버 주소/);
  env.dom.window.close();
}
for (const taskId of ['detail', 'update', 'delete']) {
  const env = mount(taskId);
  assert.equal(env.d.querySelector('[data-fw-id]').readOnly, false);
  assert.equal(env.d.querySelector('[data-fw-id]').required, true);
  env.dom.window.close();
}
{
  let requested;
  const env = mount('list', { storedId: '87', fetch: async url => { requested = url; return response(200, '{}'); } });
  const id = env.d.querySelector('[data-fw-id]');
  assert.equal(id.readOnly, false);
  assert.equal(id.required, false);
  assert.match(id.parentElement.textContent, /DB에서 비교할 글 id · 목록 요청에는 미사용/);
  assert.match(env.d.querySelector('[data-fw-path="slug"]').parentElement.textContent, /게시판 slug/);
  assert.match(env.d.querySelector('[data-fw-query="page"]').parentElement.textContent, /페이지 · 0부터/);
  assert.match(env.d.querySelector('[data-fw-query="size"]').parentElement.textContent, /페이지당 개수 · 1~50/);
  send(env); await tick(); await tick();
  assert.deepEqual([...new URL(requested).searchParams.keys()], ['page', 'size'], '비교용 id를 목록 필터에 추가하지 않음');
  env.dom.window.close();
}
{
  const dom = new JSDOM(renderFunctionalCatalog());
  const first = dom.window.document.querySelector('.fw-catalog-open');
  assert.equal(first.textContent, '구현하기 →');
  assert.equal(first.getAttribute('aria-label'), '게시글 작성 과제 열기');
  dom.window.close();
}
{
  const siteRoot = new URL('../../', import.meta.url);
  const command = 'python3 -m http.server 3000 --bind 127.0.0.1';
  const snapshot = JSON.parse(fs.readFileSync(new URL('scenario/snapshots/3-2.json', siteRoot), 'utf8'));
  const corsEntry = snapshot.files.find(file => file.path.endsWith('/CorsConfig.java'));
  const cors = fs.readFileSync(new URL('scenario/snapshots/blobs/' + corsEntry.blob + '.txt', siteRoot), 'utf8');
  assert.match(cors, /allowedOriginPatterns\("http:\/\/localhost:\[\*\]", "http:\/\/127\.0\.0\.1:\[\*\]"\)/);
  assert.doesNotMatch(cors, /allowedOriginPatterns\([^)]*["']null["']/);
  for (const task of FUNCTIONAL_TASKS) {
    const env = mount(task.id);
    const setup = env.d.querySelector('.fw-doc-server');
    assert.ok(setup, '별도의 문서 서버 안내 표시');
    assert.ok(setup.textContent.includes(command));
    assert.equal(new URL(setup.querySelector('a').href).origin, env.w.location.origin, '학습 링크가 다른 worktree의 고정 포트로 벗어나지 않는다');
    assert.ok(new URL(setup.querySelector('a').href).pathname.endsWith('/' + task.sourcePath.replace(/\.md$/, '.html')));
    assert.match(setup.textContent, /이미 HTTP|이미.*HTTP/);
    assert.match(setup.textContent, /저장소 루트/);
    assert.match(setup.textContent, /별도.*starter/);
    assert.match(setup.textContent, /localhost:8080/);
    assert.equal(env.root.dataset.fwRequestState, 'idle');
    env.dom.window.close();
  }
}
{
  const env = mount('create', { url: 'file:///tmp/javaExperience/scenario/flow/create-post.html', fetch: async () => { throw new TypeError('Failed to fetch'); } });
  assert.equal(env.d.querySelector('[data-fw-file-note]').hidden, false, '파일로 연 경우 전송 전에 문서 주소 안내');
  assert.match(env.d.querySelector('[data-fw-file-note]').textContent, /파일로 열/);
  assert.equal(env.d.querySelector('[data-fw-file-note] a').getAttribute('href'), '#functional-setup');
  send(env); await tick(); await tick();
  const text = env.d.querySelector('[data-fw-response]').textContent;
  assert.match(text, /file:\/\//);
  assert.ok(text.includes('python3 -m http.server 3000 --bind 127.0.0.1'));
  assert.ok(text.includes('http://localhost:3000/scenario/flow/create-post.html'));
  assert.ok(text.includes('localhost:8080'));
  assert.doesNotMatch(text, /allowedOriginPatterns.*null/);
  assert.match(env.d.querySelector('[data-fw-status]').textContent, /실패/);
  env.dom.window.close();
}
{
  let total = 0;
  for (const task of FUNCTIONAL_TASKS) {
    const env = mount(task.id);
    const ids = [...env.d.querySelectorAll('[id]')].map(node => node.id);
    assert.equal(new Set(ids).size, ids.length, task.id + ': 모든 native/panel id 고유');
    for (const state of task.visualization.states) {
      total++;
      const panel = env.d.querySelector(`[data-fw-state-panel="${state.id}"]`);
      const runtime = ['create', 'detail', 'delete'].includes(task.id);
      const component = panel.querySelector(runtime ? '[data-frv-root]' : '[data-fqv]');
      assert.ok(component, task.id + '/' + state.id + ': 올바른 native component 연결');
      assert.equal(component.dataset[runtime ? 'frvState' : 'fqvState'], state.id);
      assert.equal(component.closest('details'), null, '핵심 native 값은 산문 details 밖에 노출');
      const explanation = panel.querySelector('.fw-state-explanation');
      assert.ok(explanation);
      assert.equal(explanation.open, false, '6lane 긴 설명은 접기로 이동');
      assert.equal(explanation.querySelectorAll('.fw-state-grid > section').length, 6);
      assert.equal(explanation.querySelector('.fw-lane-code code').textContent, state.code.join('\n'));
      assert.equal(panel.querySelector('.fw-state-summary').textContent, state.summary);
      if (runtime) {
        assert.equal(component.id, `fw-model-${task.id}-${state.id}-runtime`);
        const options = { viewCount: task.id === 'delete' ? 1 : 0 };
        const model = getFunctionalVisualModel(task.id, state.id, options);
        const displayed = JSON.parse(component.querySelector('[data-frv-source-field="viewCount"] [data-frv-value]').dataset.frvValue);
        assert.equal(displayed, model.after.object.viewCount, '설명용 직선 여정의 조회수 가정 전달');
        const table = component.querySelector('[data-frv-table="post"]');
        assert.deepEqual(JSON.parse(table.dataset.frvRows), model.after.database.post, 'native 객체/DB 상태는 순수 모델과 일치');
      } else {
        assert.equal(component.dataset.fqvPrefix, `fw-model-${task.id}-${state.id}`);
        assert.equal(JSON.parse(component.dataset.fqvOptions).viewCount, 1);
      }
    }
    for (const node of env.d.querySelectorAll('[aria-controls]')) for (const id of node.getAttribute('aria-controls').split(/\s+/)) assert.ok(env.d.getElementById(id), id + ': 조작 대상 존재');
    assert.equal(env.d.querySelector('[data-fw-status]').textContent, '미실행');
    assert.equal(env.d.querySelector('[data-fw-token]').value, '');
    const visual = env.d.querySelector('[data-fw-visual]');
    assert.ok(visual);
    assert.equal(visual.querySelector('[data-fw-views]'), null, '이미지 없으면 보기 선택 불필요');
    assert.equal(visual.querySelector('[data-fw-overview]'), null);
    assert.equal(visual.querySelector('[data-fw-compare]').hidden, false, '이미지 없어도 native 비교 즉시 제공');
    env.dom.window.close();
  }
  assert.equal(total, 17, '같은 시점의 목록/PATCH 대안을 통합한 17개 노출 상태 전부 연결');
}
{
  const dom = new JSDOM(renderFunctionalWorkspace({ task: 'detail', assets: { detail: fixtureImage } }));
  const d = dom.window.document;
  const views = [...d.querySelectorAll('[data-fw-views] [data-fw-view]')];
  assert.deepEqual(views.map(button => button.dataset.fwView), ['overview', 'compare']);
  assert.deepEqual(views.map(button => button.textContent), ['전체 흐름 그림', '값 직접 비교']);
  assert.equal(views[0].getAttribute('aria-selected'), 'true');
  assert.equal(views[1].getAttribute('aria-selected'), 'false');
  assert.equal(d.querySelector('[data-fw-overview]').hidden, false);
  assert.equal(d.querySelector('[data-fw-compare]').hidden, true);
  assert.equal(d.querySelectorAll('.fw-image').length, 1, '그림은 하나의 overview pane에만 배치');
  assert.ok(d.querySelector('[data-fw-overview] .fw-image'));
  for (const button of views) {
    const pane = d.getElementById(button.getAttribute('aria-controls'));
    assert.equal(pane.getAttribute('role'), 'tabpanel');
    assert.equal(pane.getAttribute('aria-labelledby'), button.id);
  }
  const image = d.querySelector('img');
  assert.equal(image.width, 1536); assert.equal(image.height, 1024);
  assert.match(d.querySelector('.fw-image-legend').textContent, /실제 실행 로그/);
  dom.window.close();
}
{
  const unrelated = '<aside id="unrelated"><button data-fw-state="outside">다른 화면</button><form><input value="유지"></form></aside>';
  const dom = new JSDOM(unrelated + renderFunctionalWorkspace({ task: 'create' }), { url: 'https://example.test/', runScripts: 'outside-only' });
  const before = dom.window.document.querySelector('#unrelated').outerHTML;
  dom.window.fetch = () => { throw new Error('자동 fetch 금지'); };
  dom.window.eval(controller);
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  dom.window.document.querySelector('[data-fw-root] [data-fw-state]').click();
  assert.equal(dom.window.document.querySelector('#unrelated').outerHTML, before, '소유 workspace 밖 DOM에 영향 없음');
  assert.equal(dom.window.localStorage.getItem(progressKey), null);
  dom.window.close();
}
const parseShellArguments = command => JSON.parse(execFileSync('python3', ['-c', 'import sys, shlex, json; print(json.dumps(shlex.split(sys.stdin.read()), ensure_ascii=False))'], { input: command, encoding: 'utf8' }));
{
  let copied, calls = 0;
  const env = mount('create', { fetch: async () => { calls++; throw new Error('복사 중 fetch 금지'); } });
  Object.defineProperty(env.w.navigator, 'clipboard', { configurable: true, value: { writeText: async text => { copied = text; } } });
  const token = "fixture'$(printf never)`printf never`";
  const body = JSON.stringify({ title: "작은'따옴표 `printf never` $(printf never)\n한국어", content: '본문' }, null, 2);
  env.d.querySelector('[data-fw-token]').value = token;
  env.d.querySelector('[data-fw-body]').value = body;
  const beforeStorage = [JSON.stringify(Object.entries(env.w.sessionStorage)), JSON.stringify(Object.entries(env.w.localStorage))];
  const copy = env.d.querySelector('[data-fw-copy-request]');
  assert.ok(copy, '명시적인 curl 복사 버튼');
  assert.equal(copy.type, 'button');
  copy.click(); await tick();
  const argv = parseShellArguments(copied);
  assert.ok(copied.startsWith("'curl' '--request' 'POST' '--url' '"), '실행 파일과 옵션을 포함해 모든 인자를 single quote로 감쌈');
  assert.ok(copied.includes("'\\''"), '본문/토큰의 작은따옴표는 POSIX 닫기-escape-열기로 인용');
  assert.deepEqual(argv.slice(0, 5), ['curl', '--request', 'POST', '--url', 'http://localhost:8080/api/posts']);
  assert.equal(argv[argv.indexOf('--data-raw') + 1], body, 'shell 파서에서 작은따옴표·명령치환 기호·줄바꿈·한글 원문 보존');
  assert.ok(argv.includes('Authorization: Bearer ' + token));
  assert.ok(argv.includes('Content-Type: application/json'));
  assert.equal(calls, 0);
  assert.deepEqual([JSON.stringify(Object.entries(env.w.sessionStorage)), JSON.stringify(Object.entries(env.w.localStorage))], beforeStorage, '복사로 storage를 변경하지 않음');
  assert.equal(env.d.querySelector('[data-fw-status]').textContent, '미실행');
  assert.equal(env.root.dataset.fwRequestState, 'idle');
  assert.match(env.d.querySelector('[data-fw-copy-status]').textContent, /복사/);
  assert.equal(env.d.querySelector('[data-fw-curl-fallback]').hidden, true);
  env.d.querySelector('[data-fw-body]').dispatchEvent(new env.w.Event('input', { bubbles: true }));
  assert.match(env.d.querySelector('[data-fw-copy-status]').textContent, /입력 변경/);
  assert.equal(env.d.querySelector('[data-fw-curl-text]').value, '');
  assert.equal(env.d.querySelector('[data-fw-status]').textContent, '미실행');
  env.dom.window.close();
}
for (const taskId of ['detail', 'delete', 'update']) {
  let copied;
  const env = mount(taskId, { storedId: '87' });
  Object.defineProperty(env.w.navigator, 'clipboard', { configurable: true, value: { writeText: async value => { copied = value; } } });
  env.d.querySelector('[data-fw-copy-request]').click(); await tick();
  const argv = parseShellArguments(copied);
  assert.equal(argv[2], FUNCTIONAL_TASK_BY_ID[taskId].api.method);
  assert.match(argv[4], /\/87$/);
  assert.equal(argv.includes('--data-raw'), taskId === 'update');
  assert.ok(!argv.some(arg => arg.startsWith('Authorization:')), '빈 토큰은 헤더에 넣지 않음');
  assert.equal(env.d.querySelector('[data-fw-status]').textContent, '미실행');
  env.dom.window.close();
}
{
  const env = mount('create');
  Object.defineProperty(env.w.navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('denied'); } } });
  const body = env.d.querySelector('[data-fw-body]');
  env.d.querySelector('[data-fw-copy-request]').click(); await tick();
  const fallback = env.d.querySelector('[data-fw-curl-text]');
  assert.equal(env.d.querySelector('[data-fw-curl-fallback]').hidden, false);
  assert.equal(fallback.readOnly, true);
  assert.equal(env.d.activeElement, fallback);
  assert.equal(fallback.selectionStart, 0);
  assert.equal(fallback.selectionEnd, fallback.value.length);
  assert.equal(parseShellArguments(fallback.value)[2], 'POST');
  body.dispatchEvent(new env.w.Event('input', { bubbles: true }));
  assert.equal(fallback.value, '');
  assert.equal(env.d.querySelector('[data-fw-curl-fallback]').hidden, true);
  let writes = 0;
  Object.defineProperty(env.w.navigator, 'clipboard', { configurable: true, value: { writeText: async () => { writes++; } } });
  body.value = '{broken';
  env.d.querySelector('[data-fw-copy-request]').click(); await tick();
  assert.equal(writes, 0, '잘못된 JSON은 복사하지 않음');
  assert.match(env.d.querySelector('[data-fw-copy-status]').textContent, /JSON/);
  assert.equal(env.d.querySelector('[data-fw-status]').textContent, '미실행');
  env.dom.window.close();
}
{
  const env = mount('create', { fetch: async () => response(401, '{"message":"인증 필요"}', { 'content-type': 'application/json', 'www-authenticate': 'Bearer realm="<img src=x>"' }) });
  send(env); await tick(); await tick();
  const text = env.d.querySelector('[data-fw-response]').textContent;
  assert.ok(text.includes('Content-Type: application/json'));
  assert.ok(text.includes('WWW-Authenticate: Bearer realm="<img src=x>"'));
  assert.match(text, /Location: 미확인/);
  assert.equal(env.d.querySelector('[data-fw-response] img'), null);
  assert.match(env.d.querySelector('[data-fw-status]').textContent, /HTTP 401/);
  env.dom.window.close();
}
{
  let rejectCopy;
  const env = mount('create');
  Object.defineProperty(env.w.navigator, 'clipboard', { configurable: true, value: { writeText: () => new Promise((_resolve, reject) => { rejectCopy = reject; }) } });
  env.d.querySelector('[data-fw-copy-request]').click();
  env.d.querySelector('[data-fw-body]').dispatchEvent(new env.w.Event('input', { bubbles: true }));
  rejectCopy(new Error('permission denied after edit')); await tick();
  assert.equal(env.d.querySelector('[data-fw-curl-fallback]').hidden, true, '입력 변경 후 clipboard 거절은 예전 명령을 재노출하지 않음');
  assert.equal(env.d.querySelector('[data-fw-curl-text]').value, '');
  assert.match(env.d.querySelector('[data-fw-copy-status]').textContent, /입력 변경/);
  assert.equal(env.d.querySelector('[data-fw-status]').textContent, '미실행');
  env.dom.window.close();
}
{
  const env = mount('delete');
  let writes = 0;
  Object.defineProperty(env.w.navigator, 'clipboard', { configurable: true, value: { writeText: async () => { writes++; } } });
  env.d.querySelector('[data-fw-copy-request]').click(); await tick();
  assert.equal(writes, 0, '필수 id 없이 복사하지 않음');
  assert.match(env.d.querySelector('[data-fw-copy-status]').textContent, /입력/);
  assert.equal(env.d.querySelector('[data-fw-status]').textContent, '미실행');
  env.dom.window.close();
}
console.log('기능 작업 공간: 5과제 정본·키보드·미실행·요청·204·에러·토큰 비저장·id 연속·자기확인 DOM 검사 통과 (실서버/브라우저 검증 아님)');
