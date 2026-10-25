import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { P20_LESSONS, P20_ASSETS, p20AssetRoot, P20_SQL_PHASES } from './p20-lesson-data.mjs';
import { renderP20Learning, p20AvailableLessons } from './p20-learning.mjs';
import { initP20Learning } from './p20-learning.js';

const sourceURL = new URL('../../docs/knowledge/P20-jpa-entity-mapping.md', import.meta.url);
const originalSource = readFileSync(sourceURL, 'utf8');
const proofRoot = new URL('../../docs/design/p20-2026-10-20/source-proof/', import.meta.url);
assert.match(readFileSync(new URL('original-compile.txt', proofRoot), 'utf8'), /Enum.name\(\) is defined in an inaccessible class or interface/);
const stages = P20_LESSONS.flatMap(lesson => lesson.stages);
assert.equal(P20_LESSONS.length, 8); assert.equal(stages.length, 21);
const execution = JSON.parse(readFileSync(new URL('execution.json', proofRoot), 'utf8'));
assert.equal(execution.checks, 27); assert.deepEqual(P20_SQL_PHASES, execution.sqlPhases, '실제 단계별 SQL을 그대로 연결');
assert.equal(new Set(stages.map(stage => stage.id)).size, stages.length);
const logURL = new URL('gradle-run.txt', proofRoot);
if (existsSync(logURL)) {
  const checks = new Set(readFileSync(logURL, 'utf8').split('\n').filter(line => line.startsWith('PASS ')).map(line => line.slice(5)));
  assert.equal(checks.size, 27);
  assert.deepEqual(new Set(stages.flatMap(stage => stage.checks)), checks, '모든 실제27 PASS를 장면에 연결');
}
for (const stage of stages) {
  assert.ok(P20_ASSETS[stage.image], stage.id + '의 이미지 registry');
  assert.ok(Array.isArray(stage.checks)); assert.ok(Array.isArray(stage.sqlPhases));
  for (const phase of stage.sqlPhases) { assert.ok(Array.isArray(P20_SQL_PHASES[phase])); for (const statement of P20_SQL_PHASES[phase]) assert.equal(typeof statement, 'string'); }
}
const saved = structuredClone(P20_ASSETS);
Object.values(P20_ASSETS).forEach(asset => { asset.ready = false; });
assert.equal(p20AvailableLessons().length, 0); assert.match(renderP20Learning(), /준비 중/);
Object.values(P20_ASSETS).forEach(asset => { asset.ready = true; });
const foreign = { __javaExperienceP19: { topic: 'pool', stage: 'pool-waiting' }, catalog: { query: 'JPA' }, foreign: { keep: true } };
function setup(matches = false) {
  const page = new JSDOM('<h1 id="existing-p20-heading">기존 P20</h1><section data-existing-map><button data-p20-stage="compile-original" id="old-map-button" aria-pressed="true">기존 엔티티 map 단계</button><p data-p20-note>기존 map 설명</p></section><section data-existing-generic>기존 일반 시각 자료</section>' + renderP20Learning() + '<details id="p20-original"><summary>원문</summary><details><summary>기존 코드</summary><a id="original-deep" href="#old">기존 링크</a></details></details>', { url: 'https://learn.example/P20.html' });
  const win = page.window, doc = win.document, listeners = [];
  const media = { matches, addEventListener(type, callback) { assert.equal(type, 'change'); listeners.push(callback); } }; win.matchMedia = () => media;
  for (const name of ['localStorage', 'sessionStorage']) Object.defineProperty(win, name, { get() { throw Error('진도·읽음·storage 접근 금지'); } });
  win.fetch = () => { throw Error('서버 요청 금지'); };
  const copied = []; Object.defineProperty(win.navigator, 'clipboard', { value: { async writeText(code) { copied.push(code); } } });
  win.history.replaceState(structuredClone(foreign), '');
  const sourceHTML = doc.getElementById('p20-original').outerHTML;
  const mapHTML = doc.querySelector('[data-existing-map]').outerHTML, genericHTML = doc.querySelector('[data-existing-generic]').outerHTML;
  initP20Learning(doc, win);
  const learningRoot = doc.querySelector('[data-p20-learning]');
  const $ = selector => learningRoot.querySelector(selector);
  const topic = id => { $('[data-p20-topic]').value = id; $('[data-p20-topic]').dispatchEvent(new win.Event('change')); };
  const stage = id => $(`[data-p20-stage="${id}"]`).click();
  const valueOf = label => { const dt = [...$('[data-p20-state]').querySelectorAll('dt')].find(node => node.textContent === label); assert.ok(dt, label); return dt.nextElementSibling.textContent; };
  const resize = value => { media.matches = value; listeners.forEach(fn => fn({ matches: value })); };
  return { win, doc, $, topic, stage, valueOf, resize, copied, sourceHTML, mapHTML, genericHTML };
}
const { win, doc, $, topic, stage, valueOf, resize, copied, sourceHTML, mapHTML, genericHTML } = setup();
assert.equal(doc.querySelectorAll('h1').length, 1, '보충 화면은 H1을 추가하지 않는다');
assert.equal($('[data-p20-question]').tagName, 'H2');
assert.match($('.p20-scope').textContent, /원문 6파일.*컴파일 실패/);
assert.match($('.p20-scope').textContent, /DTO 한 식 교정/);
assert.match($('.p20-scope').textContent, /Boot 4.1.1 non-web.*H2.*JDK 21.*MySQL·Java 25·HTTP·Docker는 미실행/);
for (const lesson of P20_LESSONS) {
  topic(lesson.id);
  for (const [i, state] of lesson.stages.entries()) {
    stage(state.id);
    assert.equal($('[data-p20-question]').textContent, lesson.question);
    assert.equal($('[data-p20-code]').textContent, state.code);
    assert.equal($('[data-p20-lead]').textContent, state.lead);
    assert.equal($('[data-p20-note]').textContent, state.note || lesson.note);
    for (const [label, expected] of state.values) assert.equal(valueOf(label), expected);
    assert.equal($('[data-p20-state]').closest('details'), null); assert.equal($('[data-p20-code]').closest('details'), null);
    assert.equal($('[data-p20-output]').open, false, '현재 장면 증거는 기본 접힘');
    assert.equal($('[data-p20-output]').hidden, !(state.checks.length || state.sqlPhases.length));
    assert.equal($('[data-p20-stdout]').textContent, state.checks.map(check => 'PASS ' + check).join('\n'));
    for (const phase of state.sqlPhases) {
      assert.ok($('[data-p20-sql]').textContent.includes(phase + ' · 바인딩값 미기록'));
      for (const [index, statement] of P20_SQL_PHASES[phase].entries()) assert.ok($('[data-p20-sql]').textContent.includes(phase + '[' + index + ']' + statement));
    }
    assert.equal($('[data-p20-position]').textContent, `${i + 1} / ${lesson.stages.length}`);
    assert.equal($('[data-p20-image]').getAttribute('src'), p20AssetRoot + P20_ASSETS[state.image].file);
    $('[data-p20-copy]').click(); await Promise.resolve(); await Promise.resolve(); assert.equal(copied.at(-1), state.code);
    assert.equal(doc.getElementById('p20-original').outerHTML, sourceHTML);
    assert.equal(doc.querySelector('[data-existing-map]').outerHTML, mapHTML); assert.equal(doc.querySelector('[data-existing-generic]').outerHTML, genericHTML);
  }
}
assert.deepEqual(win.history.state.__javaExperienceP19, foreign.__javaExperienceP19); assert.deepEqual(win.history.state.catalog, foreign.catalog); assert.deepEqual(win.history.state.foreign, foreign.foreign);
assert.deepEqual(Object.keys(win.history.state).sort(), [...Object.keys(foreign), '__javaExperienceP20'].sort()); assert.equal(win.history.length, 1);
const beforeOldMapClick = $('[data-p20-stage-select]').value; doc.getElementById('old-map-button').click(); assert.equal($('[data-p20-stage-select]').value, beforeOldMapClick, '기존 map의 같은 data-p20-stage 버튼은 새 학습 장면에 영향 없음');
const lesson = P20_LESSONS.find(item => item.stages.length > 1);
assert.ok(lesson); topic(lesson.id);
const buttons = [...doc.querySelector('[data-p20-learning]').querySelectorAll('[data-p20-stage]')]; buttons[0].focus();
for (const [key, expected] of [['End', buttons.length - 1], ['ArrowLeft', buttons.length - 2], ['Home', 0], ['ArrowRight', 1]]) { doc.activeElement.dispatchEvent(new win.KeyboardEvent('keydown', { key, bubbles: true })); assert.equal(doc.activeElement, buttons[expected]); }
const second = buttons[1]; second.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); assert.equal($('[data-p20-stage-select]').value, lesson.stages[1].id); assert.equal(doc.activeElement, second, 'Enter 뒤 장면 선택 포커스 보존');
stage(lesson.stages.at(-2).id); $('[data-p20-next]').focus(); $('[data-p20-next]').click(); assert.equal(doc.activeElement, buttons.at(-1)); assert.equal($('[data-p20-next]').disabled, true);
stage(lesson.stages[1].id); $('[data-p20-prev]').focus(); $('[data-p20-prev]').click(); assert.equal(doc.activeElement, buttons[0]); assert.equal($('[data-p20-prev]').disabled, true);
const zoomState = stages.find(state => P20_ASSETS[state.image].focus?.[state.id]);
assert.ok(zoomState, '최소 한 실제 의미 구간의 확대 좌표 필요');
const zoomLesson = P20_LESSONS.find(item => item.stages.some(state => state.id === zoomState.id)); topic(zoomLesson.id); stage(zoomState.id);
const proofState = stages.find(state => state.checks.length || state.sqlPhases.length);
assert.ok(proofState); const proofLesson = P20_LESSONS.find(item => item.stages.some(state => state.id === proofState.id)); topic(proofLesson.id); stage(proofState.id);
$('[data-p20-output]').open = true; $('[data-p20-zoom]').click(); assert.equal($('[data-p20-output]').open, true, '확대는 펼친 현재 장면 증거를 닫지 않는다');
resize(true); assert.equal($('[data-p20-output]').open, true, 'resize도 펼친 증거 유지');
$('[data-p20-zoom]').click(); resize(false); resize(true); assert.equal($('[data-p20-output]').open, true);
topic(zoomLesson.id); stage(zoomState.id); if ($('[data-p20-zoom]').getAttribute('aria-pressed') === 'false') $('[data-p20-zoom]').click();
assert.equal($('.p20-image-frame').tabIndex, 0); const focus = P20_ASSETS[zoomState.image].focus[zoomState.id]; assert.equal($('[data-p20-image]').style.transform, `translate(-${focus[0]}%, -${focus[1]}%)`);
$('[data-p20-zoom]').click(); resize(false); resize(true); assert.equal($('[data-p20-zoom]').getAttribute('aria-pressed'), 'false');
win.history.replaceState({ ...win.history.state, __javaExperienceP20: { topic: lesson.id, stage: lesson.stages[1].id } }, ''); win.dispatchEvent(new win.PopStateEvent('popstate')); assert.equal($('[data-p20-stage-select]').value, lesson.stages[1].id);
initP20Learning(doc, win); assert.equal($('[data-p20-topic]').value, lesson.id);

// 실제 Chrome의 원문 앵커 이동은 null state인 popstate를 만들 수 있다.
const selectedBeforeAnchor = { topic: lesson.id, stage: lesson.stages[1].id };
win.history.pushState({ catalog: foreign.catalog, foreign: foreign.foreign }, '', '#p20-original');
win.dispatchEvent(new win.PopStateEvent('popstate'));
assert.equal($('[data-p20-stage-select]').value, selectedBeforeAnchor.stage, '원문 앵커의 빈 학습 state로 현재 장면을 초기화하지 않음');
assert.deepEqual(win.history.state.__javaExperienceP20, selectedBeforeAnchor, '현재 장면을 새 앵커 항목에 보존');
assert.deepEqual(win.history.state.catalog, foreign.catalog); assert.deepEqual(win.history.state.foreign, foreign.foreign);

win.navigator.clipboard.writeText = async () => { throw Error('clipboard unavailable'); }; $('[data-p20-copy]').click(); await Promise.resolve(); await Promise.resolve(); assert.equal(win.getSelection().toString(), $('[data-p20-code]').textContent);
win.location.hash = 'original-deep'; win.dispatchEvent(new win.HashChangeEvent('hashchange')); assert.equal(doc.getElementById('p20-original').open, true); assert.equal(doc.getElementById('original-deep').closest('details').open, true); assert.equal(doc.getElementById('original-deep').getAttribute('href'), '#old');
assert.equal(doc.querySelector('[data-existing-map]').outerHTML, mapHTML); assert.equal(doc.querySelector('[data-existing-generic]').outerHTML, genericHTML); assert.equal(readFileSync(sourceURL, 'utf8'), originalSource);
win.close();
const mobile = setup(true); mobile.topic(lesson.id); mobile.$('[data-p20-stage-select]').value = lesson.stages.at(-2).id; mobile.$('[data-p20-stage-select]').dispatchEvent(new mobile.win.Event('change')); mobile.$('[data-p20-mobile-next]').focus(); mobile.$('[data-p20-mobile-next]').click(); assert.equal(mobile.doc.activeElement, mobile.$('[data-p20-stage-select]'));
mobile.stage(lesson.stages[1].id); mobile.$('[data-p20-mobile-prev]').focus(); mobile.$('[data-p20-mobile-prev]').click(); assert.equal(mobile.doc.activeElement, mobile.$('[data-p20-stage-select]')); mobile.win.close();
for (const [key, asset] of Object.entries(saved)) Object.assign(P20_ASSETS[key], asset);
console.log(`P20: ${P20_LESSONS.length}질문·${stages.length}상태, 코드/값/PASS/SQL 동기화, 기존map·원문·history 보존, Enter/키보드·끝포커스·copy·증거열림/확대resize·모바일 통과`);
