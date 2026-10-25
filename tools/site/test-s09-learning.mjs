import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { S09_LESSONS, S09_ASSETS, s09AssetRoot, S09_SQL_PHASES } from './s09-lesson-data.mjs';
import { renderS09Learning, s09AvailableLessons } from './s09-learning.mjs';
import { initS09Learning } from './s09-learning.js';

const sourceURL = new URL('../../docs/knowledge/S09-jpa-hibernate.md', import.meta.url);
const originalSource = readFileSync(sourceURL, 'utf8');
const proofRoot = new URL('../../docs/design/s09-2026-10-20/source-proof/', import.meta.url);
const stages = S09_LESSONS.flatMap(lesson => lesson.stages);
const activeValid = stage => Array.isArray(stage.active) && stage.active.length > 0 && stage.active.every(index => Number.isInteger(index) && index >= 0 && index < stage.code.split('\n').length);
for (const state of stages) assert.ok(activeValid(state), state.id + ' active 줄 범위');
const fetchJoin = stages.find(state => state.id === 'fetch-join');
assert.deepEqual(fetchJoin.active, [0, 1], 'fetch-join은 호출과 HQL 2줄만 강조');
assert.equal(activeValid({ ...fetchJoin, active: [999] }), false, '범위 밖 active 변이 감지');
assert.equal(S09_LESSONS.length, 9); assert.equal(stages.length, 31);
assert.deepEqual(S09_LESSONS.map(lesson => lesson.id), ['cache','flush','merge','remove','fetch','service','lock','auto','pagination']);
assert.deepEqual(S09_LESSONS.map(lesson => lesson.stages.length), [6,4,3,3,3,2,3,3,4]);
const execution = JSON.parse(readFileSync(new URL('execution.json', proofRoot), 'utf8'));
assert.equal(execution.checks, 61);
for (const [phase, statements] of Object.entries(S09_SQL_PHASES)) assert.deepEqual(statements, execution.sqlPhases[phase], phase + ' 실제 SQL 원문');
assert.equal(new Set(stages.map(stage => stage.id)).size, stages.length);
const logURL = new URL('gradle-run.txt', proofRoot);
assert.ok(existsSync(logURL), '실제 61 PASS 로그 필요');
if (existsSync(logURL)) {
  const checks = new Set(readFileSync(logURL, 'utf8').split('\n').filter(line => line.startsWith('PASS ')).map(line => line.slice(5)));
  assert.equal(checks.size, execution.checks);
  assert.deepEqual(new Set(stages.flatMap(stage => stage.checks)), checks, '61개 실제 PASS 전부 연결');
}
for (const stage of stages) {
  assert.ok(S09_ASSETS[stage.image], stage.id + '의 이미지 registry');
  assert.ok(Array.isArray(stage.checks)); assert.ok(Array.isArray(stage.sqlPhases));
  for (const phase of stage.sqlPhases) { assert.ok(Array.isArray(S09_SQL_PHASES[phase])); for (const statement of S09_SQL_PHASES[phase]) assert.equal(typeof statement, 'string'); }
}
assert.deepEqual(new Set(stages.flatMap(stage => stage.sqlPhases)), new Set(Object.keys(S09_SQL_PHASES)), '실제 SQL 구간 전부 연결');
const saved = structuredClone(S09_ASSETS);
Object.values(S09_ASSETS).forEach(asset => { asset.ready = false; });
assert.equal(s09AvailableLessons().length, 0); assert.match(renderS09Learning(), /준비 중/);
Object.values(S09_ASSETS).forEach(asset => { asset.ready = true; });
const foreign = { __javaExperienceP19: { topic: 'pool', stage: 'pool-waiting' }, catalog: { query: 'JPA' }, foreign: { keep: true } };
function setup(matches = false) {
  const page = new JSDOM('<h1 id="existing-s09-heading">기존 S09 역할</h1><section data-existing-map><button data-s09-stage="legacy" id="old-map-button" aria-pressed="true">기존 예상값 단계</button><p data-s09-note>기존 예상값 설명</p></section><section data-existing-generic>기존 역할 설명</section>' + renderS09Learning() + '<details id="s09-original"><summary>원문</summary><details><summary>기존 코드</summary><a id="original-deep" href="#old">기존 링크</a></details></details>', { url: 'https://learn.example/S09.html' });
  const win = page.window, doc = win.document, listeners = [];
  const media = { matches, addEventListener(type, callback) { assert.equal(type, 'change'); listeners.push(callback); } }; win.matchMedia = () => media;
  for (const name of ['localStorage', 'sessionStorage']) Object.defineProperty(win, name, { get() { throw Error('진도·읽음·storage 접근 금지'); } });
  win.fetch = () => { throw Error('서버 요청 금지'); };
  const copied = []; Object.defineProperty(win.navigator, 'clipboard', { value: { async writeText(code) { copied.push(code); } } });
  win.history.replaceState(structuredClone(foreign), '');
  const sourceHTML = doc.getElementById('s09-original').outerHTML;
  const mapHTML = doc.querySelector('[data-existing-map]').outerHTML, genericHTML = doc.querySelector('[data-existing-generic]').outerHTML;
  initS09Learning(doc, win);
  const learningRoot = doc.querySelector('[data-s09-learning]');
  const $ = selector => learningRoot.querySelector(selector);
  const topic = id => { $('[data-s09-topic]').value = id; $('[data-s09-topic]').dispatchEvent(new win.Event('change')); };
  const stage = id => $(`[data-s09-stage="${id}"]`).click();
  const valueOf = label => { const dt = [...$('[data-s09-state]').querySelectorAll('dt')].find(node => node.textContent === label); assert.ok(dt, label); return dt.nextElementSibling.textContent; };
  const resize = value => { media.matches = value; listeners.forEach(fn => fn({ matches: value })); };
  return { win, doc, $, topic, stage, valueOf, resize, copied, sourceHTML, mapHTML, genericHTML };
}
const { win, doc, $, topic, stage, valueOf, resize, copied, sourceHTML, mapHTML, genericHTML } = setup();
assert.equal(doc.querySelectorAll('h1').length, 1, '보충 화면은 H1을 추가하지 않는다');
assert.equal($('[data-s09-question]').tagName, 'H2');
assert.match($('.s09-scope').textContent, /원문 PurchaseOrder·OrderLine.*추가 ProbePost42/);
assert.match($('.s09-scope').textContent, /native Hibernate 7.4.5.*H2 2.4.240.*JDK 21/);
assert.match($('.s09-scope').textContent, /Boot 4.1.1 BOM.*Boot 앱·Spring 프록시·HTTP·MySQL·OSIV·Java 25는 미실행/);
for (const lesson of S09_LESSONS) {
  topic(lesson.id);
  for (const [i, state] of lesson.stages.entries()) {
    stage(state.id);
    assert.equal($('[data-s09-question]').textContent, lesson.question);
    assert.equal($('[data-s09-code]').textContent, state.code);
    assert.deepEqual([...$('[data-s09-code]').querySelectorAll('mark')].map(mark => mark.textContent), state.code.split('\n').filter((_, line) => state.active.includes(line)).map(line => line || ' '), state.id + ' DOM 강조 줄 일치');
    assert.equal($('[data-s09-lead]').textContent, state.lead);
    assert.equal($('[data-s09-note]').textContent, state.note || lesson.note);
    for (const [label, expected] of state.values) assert.equal(valueOf(label), expected);
    assert.equal($('[data-s09-state]').closest('details'), null); assert.equal($('[data-s09-code]').closest('details'), null);
    assert.equal($('[data-s09-output]').open, false, '현재 장면 증거는 기본 접힘');
    assert.equal($('[data-s09-output]').hidden, !(state.checks.length || state.sqlPhases.length));
    assert.equal($('[data-s09-stdout]').textContent, state.checks.map(check => 'PASS ' + check).join('\n'));
    for (const phase of state.sqlPhases) {
      assert.ok($('[data-s09-sql]').textContent.includes(phase + ' · 바인딩값 미기록'));
      for (const [index, statement] of S09_SQL_PHASES[phase].entries()) assert.ok($('[data-s09-sql]').textContent.includes(phase + '[' + index + ']' + statement));
    }
    assert.equal($('[data-s09-position]').textContent, `${i + 1} / ${lesson.stages.length}`);
    assert.equal($('[data-s09-image]').getAttribute('src'), s09AssetRoot + S09_ASSETS[state.image].file);
    $('[data-s09-copy]').click(); await Promise.resolve(); await Promise.resolve(); assert.equal(copied.at(-1), state.code);
    assert.equal(doc.getElementById('s09-original').outerHTML, sourceHTML);
    assert.equal(doc.querySelector('[data-existing-map]').outerHTML, mapHTML); assert.equal(doc.querySelector('[data-existing-generic]').outerHTML, genericHTML);
  }
}
topic('flush'); stage('flush-change');
assert.match(valueOf('Java id / title / version'), /수정된 글 \/ 0/);
assert.equal(valueOf('Hibernate loadedState'), `title=${execution.changedBeforeFlush.hibernateLoadedState.title} / version=${execution.changedBeforeFlush.hibernateLoadedState.version}`);
stage('flush-flush'); assert.equal(valueOf('Hibernate loadedState'), `title=${execution.changedAfterFlush.hibernateLoadedState.title} / version=${execution.changedAfterFlush.hibernateLoadedState.version}`);
assert.equal(valueOf('별도 observer DB'), `${execution.dirtyAfterFlushOutside.title} / version=${execution.dirtyAfterFlushOutside.version}`);
stage('flush-rollback');
assert.equal(valueOf('rollback·EM close 뒤 Java'), `${execution.rollbackAfterCompletionJava.title} / version=${execution.rollbackAfterCompletionJava.version}`);
assert.equal(valueOf('rollback 뒤 DB'), `${execution.rollbackFinalRow.title} / version=${execution.rollbackFinalRow.version}`);
topic('merge'); stage('merge-detached'); assert.equal(valueOf('em.contains'), 'false'); stage('merge-copied'); assert.equal(valueOf('em.contains'), 'true'); assert.equal(valueOf('객체 구분'), 'merged != first → true');
topic('remove'); stage('remove-scheduled'); assert.equal(valueOf('em.contains'), String(execution.removedBeforeFlush.managed)); assert.equal(valueOf('Hibernate Entry'), execution.removedBeforeFlush.hibernateEntryStatus);
topic('fetch'); stage('fetch-batch'); assert.equal(valueOf('총 ORM SQL'), 'root SELECT 1 + batch SELECT 1 = 2'); assert.deepEqual(execution.originalBatchAccesses.map(item => item.newSqlSoFar), [1,1,1]);
stage('fetch-join'); assert.equal(valueOf('별도 JDBC SQL 재실행 행 수'), `${execution.originalFetchJoin.separateRawSqlRows} · Hibernate wire 행 수 계측 아님`);
topic('service'); stage('service-source-add'); assert.equal(valueOf('flush 뒤 부모 version'), String(execution.originalService.versionAfterFlush)); stage('service-closed-lazy'); assert.equal(valueOf('DB 행 관찰'), '이 실패 구간에서는 미측정');
topic('pagination'); stage('pagination-api'); assert.equal(valueOf('실제 부모 IDs / 자식 수'), '[1,2,3] / [2,2,2]'); assert.deepEqual(execution.paginationCases.filter(item => ['fetch-api-max1','fetch-api-first0-max1'].includes(item.variant)).map(item => item.parentIds), [[1,2,3],[1,2,3]]);
for (const [stageId, variant] of [['pagination-memory','fetch-memory-hint-max1'],['pagination-hql','fetch-hql-limit1']]) { stage(stageId); assert.equal(valueOf('별도 JDBC 재실행 행 수'), String(execution.paginationCases.find(item => item.variant === variant).rawObserverRows)); }
assert.match($('[data-s09-note]').textContent, /정확성 통과 판정이 아닙니다/); assert.match($('[data-s09-note]').textContent, /원인과 upstream 수정 여부는 미확인/);
assert.deepEqual(win.history.state.__javaExperienceP19, foreign.__javaExperienceP19); assert.deepEqual(win.history.state.catalog, foreign.catalog); assert.deepEqual(win.history.state.foreign, foreign.foreign);
assert.deepEqual(Object.keys(win.history.state).sort(), [...Object.keys(foreign), '__javaExperienceS09'].sort()); assert.equal(win.history.length, 1);
const beforeOldMapClick = $('[data-s09-stage-select]').value; doc.getElementById('old-map-button').click(); assert.equal($('[data-s09-stage-select]').value, beforeOldMapClick, '기존 map의 같은 data-s09-stage 버튼은 새 학습 장면에 영향 없음');
const lesson = S09_LESSONS.find(item => item.stages.length > 1);
assert.ok(lesson); topic(lesson.id);
const buttons = [...doc.querySelector('[data-s09-learning]').querySelectorAll('[data-s09-stage]')]; buttons[0].focus();
for (const [key, expected] of [['End', buttons.length - 1], ['ArrowLeft', buttons.length - 2], ['Home', 0], ['ArrowRight', 1]]) { doc.activeElement.dispatchEvent(new win.KeyboardEvent('keydown', { key, bubbles: true })); assert.equal(doc.activeElement, buttons[expected]); }
const second = buttons[1]; second.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); assert.equal($('[data-s09-stage-select]').value, lesson.stages[1].id); assert.equal(doc.activeElement, second, 'Enter 뒤 장면 선택 포커스 보존');
stage(lesson.stages.at(-2).id); $('[data-s09-next]').focus(); $('[data-s09-next]').click(); assert.equal(doc.activeElement, buttons.at(-1)); assert.equal($('[data-s09-next]').disabled, true);
stage(lesson.stages[1].id); $('[data-s09-prev]').focus(); $('[data-s09-prev]').click(); assert.equal(doc.activeElement, buttons[0]); assert.equal($('[data-s09-prev]').disabled, true);
const zoomState = stages.find(state => S09_ASSETS[state.image].focus?.[state.id]);
assert.ok(zoomState, '최소 한 실제 의미 구간의 확대 좌표 필요');
const zoomLesson = S09_LESSONS.find(item => item.stages.some(state => state.id === zoomState.id)); topic(zoomLesson.id); stage(zoomState.id);
const proofState = stages.find(state => state.checks.length || state.sqlPhases.length);
assert.ok(proofState); const proofLesson = S09_LESSONS.find(item => item.stages.some(state => state.id === proofState.id)); topic(proofLesson.id); stage(proofState.id);
$('[data-s09-output]').open = true; $('[data-s09-zoom]').click(); assert.equal($('[data-s09-output]').open, true, '확대는 펼친 현재 장면 증거를 닫지 않는다');
resize(true); assert.equal($('[data-s09-output]').open, true, 'resize도 펼친 증거 유지');
$('[data-s09-zoom]').click(); resize(false); resize(true); assert.equal($('[data-s09-output]').open, true);
topic(zoomLesson.id); stage(zoomState.id); if ($('[data-s09-zoom]').getAttribute('aria-pressed') === 'false') $('[data-s09-zoom]').click();
assert.equal($('.s09-image-frame').tabIndex, 0); const focus = S09_ASSETS[zoomState.image].focus[zoomState.id]; assert.equal($('[data-s09-image]').style.transform, `translate(-${focus[0]}%, -${focus[1]}%)`);
$('[data-s09-zoom]').click(); resize(false); resize(true); assert.equal($('[data-s09-zoom]').getAttribute('aria-pressed'), 'false');
win.history.replaceState({ ...win.history.state, __javaExperienceS09: { topic: lesson.id, stage: lesson.stages[1].id } }, ''); win.dispatchEvent(new win.PopStateEvent('popstate')); assert.equal($('[data-s09-stage-select]').value, lesson.stages[1].id);
initS09Learning(doc, win); assert.equal($('[data-s09-topic]').value, lesson.id);
const beforeMissing = { topic: $('[data-s09-topic]').value, stage: $('[data-s09-stage-select]').value };
win.history.pushState({ foreign: { checkpoint: true } }, '', '#s09-anchor-entry'); win.dispatchEvent(new win.PopStateEvent('popstate'));
assert.deepEqual({ topic: $('[data-s09-topic]').value, stage: $('[data-s09-stage-select]').value }, beforeMissing);
assert.deepEqual(win.history.state.__javaExperienceS09, beforeMissing); assert.deepEqual(win.history.state.foreign, { checkpoint: true });
win.history.pushState(null, '', '#s09-null-entry'); win.dispatchEvent(new win.PopStateEvent('popstate')); assert.deepEqual(win.history.state.__javaExperienceS09, beforeMissing);
assert.equal($('[data-s09-stage-select]').value, beforeMissing.stage);

// 실제 Chrome의 원문 앵커 이동은 null state인 popstate를 만들 수 있다.
const selectedBeforeAnchor = { topic: lesson.id, stage: lesson.stages[1].id };
win.history.pushState({ catalog: foreign.catalog, foreign: foreign.foreign }, '', '#s09-original');
win.dispatchEvent(new win.PopStateEvent('popstate'));
assert.equal($('[data-s09-stage-select]').value, selectedBeforeAnchor.stage, '원문 앵커의 빈 학습 state로 현재 장면을 초기화하지 않음');
assert.deepEqual(win.history.state.__javaExperienceS09, selectedBeforeAnchor, '현재 장면을 새 앵커 항목에 보존');
assert.deepEqual(win.history.state.catalog, foreign.catalog); assert.deepEqual(win.history.state.foreign, foreign.foreign);

win.navigator.clipboard.writeText = async () => { throw Error('clipboard unavailable'); }; $('[data-s09-copy]').click(); await Promise.resolve(); await Promise.resolve(); assert.equal(win.getSelection().toString(), $('[data-s09-code]').textContent);
win.location.hash = 'original-deep'; win.dispatchEvent(new win.HashChangeEvent('hashchange')); assert.equal(doc.getElementById('s09-original').open, true); assert.equal(doc.getElementById('original-deep').closest('details').open, true); assert.equal(doc.getElementById('original-deep').getAttribute('href'), '#old');
assert.equal(doc.querySelector('[data-existing-map]').outerHTML, mapHTML); assert.equal(doc.querySelector('[data-existing-generic]').outerHTML, genericHTML); assert.equal(readFileSync(sourceURL, 'utf8'), originalSource);
win.close();
const mobile = setup(true); mobile.topic(lesson.id); mobile.$('[data-s09-stage-select]').value = lesson.stages.at(-2).id; mobile.$('[data-s09-stage-select]').dispatchEvent(new mobile.win.Event('change')); mobile.$('[data-s09-mobile-next]').focus(); mobile.$('[data-s09-mobile-next]').click(); assert.equal(mobile.doc.activeElement, mobile.$('[data-s09-stage-select]'));
mobile.stage(lesson.stages[1].id); mobile.$('[data-s09-mobile-prev]').focus(); mobile.$('[data-s09-mobile-prev]').click(); assert.equal(mobile.doc.activeElement, mobile.$('[data-s09-stage-select]')); mobile.win.close();
for (const [key, asset] of Object.entries(saved)) Object.assign(S09_ASSETS[key], asset);
console.log(`S09: ${S09_LESSONS.length}질문·${stages.length}상태, 코드/값/PASS/SQL 동기화, 기존역할/예상값·원문·history 보존, Enter/키보드·끝포커스·copy·증거열림/확대resize·모바일 통과`);
