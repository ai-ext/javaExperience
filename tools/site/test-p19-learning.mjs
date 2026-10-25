import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { P19_LESSONS, P19_ASSETS, P19_DEPENDENCY_CASES, P19_ADDITIONAL_DEPENDENCIES } from './p19-lesson-data.mjs';
import { renderP19Learning, p19AvailableLessons } from './p19-learning.mjs';
import { initP19Learning } from './p19-learning.js';
const root = new URL('../../docs/design/p19-2026-10-20/source-proof/', import.meta.url);
const execution = JSON.parse(readFileSync(new URL('execution.json', root), 'utf8'));
const dependencyCases = JSON.parse(readFileSync(new URL('dependency-cases.json', root), 'utf8'));
const additional = JSON.parse(readFileSync(new URL('dependencies.json', root), 'utf8'));
const passes = readFileSync(new URL('gradle-run.txt', root), 'utf8').split('\n').filter(line => line.startsWith('PASS ')).map(line => line.slice(5));
const original = readFileSync(new URL('../../docs/knowledge/P19-mysql-jpa-setup.md', import.meta.url), 'utf8');
assert.equal(execution.checks, 19); assert.equal(passes.length, 19);
assert.equal(P19_LESSONS.length, 6); assert.deepEqual(P19_LESSONS.map(lesson => lesson.stages.length), [3, 4, 2, 5, 3, 2]);
assert.equal(new Set(P19_LESSONS.flatMap(lesson => lesson.stages.map(stage => stage.id))).size, 19);
assert.deepEqual(new Set(P19_LESSONS.flatMap(lesson => lesson.stages.flatMap(stage => stage.checks))), new Set(passes));
assert.deepEqual(P19_DEPENDENCY_CASES, dependencyCases);
assert.deepEqual(P19_ADDITIONAL_DEPENDENCIES, additional.map(item => item.coordinate));
assert.equal(dependencyCases.originalMain.resolved, true); assert.equal(dependencyCases.originalWeb.resolved, true); assert.equal(dependencyCases.originalTest.resolved, true);
assert.equal(dependencyCases.originalMysqlTest.resolved, false); assert.equal(dependencyCases.correctedMysqlTest.resolved, true);
assert.ok(!dependencyCases.originalMain.artifacts.some(item => item.startsWith('com.h2database:h2:')));
assert.ok(P19_ADDITIONAL_DEPENDENCIES.includes('com.h2database:h2:2.4.240'));
assert.equal(execution.poolFailure, 'java.sql.SQLTransientConnectionException');
assert.ok(!Object.hasOwn(execution, 'poolTimeout'), 'timeout 순간의 카운터 스냅샷은 미기록');
for (const label of ['poolIdle', 'poolBorrowed', 'poolWaiting', 'poolReturned']) assert.equal(execution[label].total, 1);
const originalCustomer = readFileSync(new URL('original/Customer.java', root), 'utf8');
assert.match(originalCustomer, /public Customer\(String displayName\) \{ this.displayName = displayName; \}/);
const saved = structuredClone(P19_ASSETS);
Object.values(P19_ASSETS).forEach(asset => { asset.ready = false; });
assert.equal(p19AvailableLessons().length, 0); assert.match(renderP19Learning(), /준비 중/);
Object.values(P19_ASSETS).forEach(asset => { asset.ready = true; });
const foreign = { foreign: { keep: true }, __javaExperienceW09: { topic: 'record', stage: 'record-shared' } };
function setup(matches = false) {
  const page = new JSDOM(renderP19Learning() + '<details id="p19-original"><summary>원문</summary><a id="original-anchor" href="#old">기존 링크</a></details>', { url: 'https://learn.example/P19.html' });
  const win = page.window, doc = win.document, listeners = [];
  const media = { matches, addEventListener(type, callback) { assert.equal(type, 'change'); listeners.push(callback); } }; win.matchMedia = () => media;
  for (const name of ['localStorage', 'sessionStorage']) Object.defineProperty(win, name, { get() { throw Error('저장 금지'); } });
  win.fetch = () => { throw Error('network 금지'); };
  const copied = []; Object.defineProperty(win.navigator, 'clipboard', { value: { async writeText(code) { copied.push(code); } } });
  win.history.replaceState(structuredClone(foreign), '');
  const sourceHTML = doc.getElementById('p19-original').outerHTML;
  initP19Learning(doc, win);
  const $ = selector => doc.querySelector(selector);
  const topic = id => { $('[data-p19-topic]').value = id; $('[data-p19-topic]').dispatchEvent(new win.Event('change')); };
  const stage = id => $(`[data-p19-stage="${id}"]`).click();
  const value = label => { const dt = [...$('[data-p19-state]').querySelectorAll('dt')].find(node => node.textContent === label); assert.ok(dt, label); return dt.nextElementSibling.textContent; };
  const resize = value => { media.matches = value; listeners.forEach(fn => fn({ matches: value })); };
  return { win, doc, $, topic, stage, value, resize, copied, sourceHTML };
}
const { win, doc, $, topic, stage, value, resize, copied, sourceHTML } = setup();
assert.equal(doc.querySelectorAll('h1').length, 1);
for (const lesson of P19_LESSONS) {
  topic(lesson.id);
  for (const [i, state] of lesson.stages.entries()) {
    stage(state.id);
    assert.equal($('[data-p19-question]').textContent, lesson.question);
    assert.equal($('[data-p19-code]').textContent, state.code);
    assert.equal($('[data-p19-lead]').textContent, state.lead);
    assert.equal($('[data-p19-note]').textContent, state.note || lesson.note);
    for (const [label, expected] of state.values) assert.equal(value(label), expected);
    assert.equal($('[data-p19-output]').open, false);
    assert.equal($('[data-p19-output]').hidden, !(state.checks.length || state.dependencies.length));
    assert.equal($('[data-p19-stdout]').textContent, state.checks.map(check => 'PASS ' + check).join('\n'));
    assert.equal($('[data-p19-position]').textContent, `${i + 1} / ${lesson.stages.length}`);
    for (const name of state.dependencies) {
      const result = name === 'additionalRuntime' ? { resolved: true, artifacts: P19_ADDITIONAL_DEPENDENCIES } : dependencyCases[name];
      assert.ok($('[data-p19-dependencies]').textContent.includes(name));
      assert.ok($('[data-p19-dependencies]').textContent.includes(JSON.stringify(result, null, 2)), '실제 raw resolved 결과 표시');
    }
    assert.equal($('[data-p19-state]').closest('details'), null, '핵심값은 접지 않는다');
    assert.equal($('[data-p19-code]').closest('details'), null, '현재 코드는 접지 않는다');
    assert.equal($('[data-p19-image]').getAttribute('src'), '../design/p19-2026-10-20/images/' + P19_ASSETS[state.image].file);
    $('[data-p19-copy]').click(); await Promise.resolve(); await Promise.resolve(); assert.equal(copied.at(-1), state.code);
    assert.equal(doc.getElementById('p19-original').outerHTML, sourceHTML);
  }
}
topic('ports'); stage('ports-host'); assert.equal(value('앱의 접속 주소'), 'localhost:3307'); assert.match($('[data-p19-source]').textContent, /원문 설정 설명.*MySQL 미실행/);
stage('ports-compose'); assert.equal(value('앱의 접속 주소'), 'mysql:3306'); stage('ports-localhost'); assert.equal(value('앱 컨테이너의 localhost'), '앱 컨테이너 자기 자신');
assert.equal($('[data-p19-output]').hidden, true, '포트 장면에 실행 PASS를 붙이지 않는다');
topic('boot-h2'); stage('boot-start'); assert.equal(value('실제 DataSource'), 'HikariDataSource'); assert.equal(value('추론된 driver'), 'org.h2.Driver'); assert.equal(value('이 Boot 실험의 최대 풀'), '2'); assert.match($('[data-p19-note]').textContent, /CamelCaseToUnderscoresNamingStrategy.*실제/);
stage('boot-create'); assert.equal(value('반환 Customer'), 'id=1 / displayName=Kim'); assert.match($('[data-p19-code]').textContent, /new Customer\(request.displayName\(\)\)/);
stage('boot-list'); assert.equal(value('목록 크기'), '1'); stage('boot-observer'); assert.equal(value('별도 JDBC 행'), 'id=1 / display_name=Kim'); assert.equal(value('실측 JSON'), execution.customerJson); assert.match($('[data-p19-note]').textContent, /객체 키 순서.*의미/);
topic('validate'); stage('validate-missing'); assert.match(value('부팅 결과'), /missing table \[customer\]/); assert.equal(value('CUSTOMER 테이블'), '없음 · validate가 생성하지 않음'); stage('validate-ready'); assert.match(value('DDL 실행 시점'), /Boot 시작 전.*명시 JDBC/); assert.equal(value('후속 관찰 행'), 'id=1 / display_name=Kim');
topic('pool');
for (const [id, key] of [['pool-idle', 'poolIdle'], ['pool-borrowed', 'poolBorrowed'], ['pool-waiting', 'poolWaiting'], ['pool-returned', 'poolReturned']]) { stage(id); const item = execution[key]; assert.equal(value('total / active / idle / waiting'), [item.total, item.active, item.idle, item.waiting].join(' / ')); }
stage('pool-timeout'); assert.equal(value('실측 예외'), execution.poolFailure); assert.equal(value('이 순간 카운터'), '미기록 · 앞선 waiting 값을 복제하지 않음'); assert.match($('[data-p19-note]').textContent, /250ms.*설정값.*측정.*아닙니다/);
topic('dependencies'); stage('dependency-starters'); assert.equal(value('원문 web starter'), '4.1.1 resolve 성공 · deprecated'); assert.equal(value('원문 test starter'), '4.1.1 resolve 성공 · 제거 아님'); stage('dependency-testcontainers'); assert.match(value('원문 좌표'), /org.testcontainers:mysql.*resolve 실패/); assert.match(value('교정 좌표'), /testcontainers-mysql:2.0.5.*resolve 성공/); stage('dependency-h2'); assert.equal(value('원문 main resolved 목록'), 'H2 없음'); assert.equal(value('추가 실행 classpath'), 'com.h2database:h2 명시 · resolve 2.4.240');
topic('tc-type'); stage('tc-generic'); assert.equal(value('실제 타입 매개변수 수'), '0'); assert.match(value('원문 generic 검사'), /거부/); stage('tc-nongeneric'); assert.equal(value('추가 교정 compile'), '성공 · diagnostics=[]'); assert.match($('[data-p19-note]').textContent, /컨테이너.*미시작.*전체 JUnit.*미실행/);
assert.deepEqual(win.history.state.foreign, foreign.foreign); assert.deepEqual(win.history.state.__javaExperienceW09, foreign.__javaExperienceW09); assert.equal(win.history.length, 1);
topic('pool'); const buttons = [...doc.querySelectorAll('[data-p19-stage]')]; buttons[0].focus();
for (const [key, expected] of [['End', 4], ['ArrowLeft', 3], ['Home', 0], ['ArrowRight', 1]]) { doc.activeElement.dispatchEvent(new win.KeyboardEvent('keydown', { key, bubbles: true })); assert.equal(doc.activeElement, buttons[expected]); }
stage('pool-timeout'); $('[data-p19-next]').focus(); $('[data-p19-next]').click(); assert.equal(doc.activeElement, buttons[4]);
stage('pool-borrowed'); $('[data-p19-prev]').focus(); $('[data-p19-prev]').click(); assert.equal(doc.activeElement, buttons[0]);
resize(true); assert.equal($('[data-p19-zoom]').getAttribute('aria-pressed'), 'true'); assert.equal($('.p19-image-frame').tabIndex, 0);
stage('pool-waiting'); const focus = P19_ASSETS['P19-pool'].focus['pool-waiting']; assert.equal($('[data-p19-image]').style.transform, `translate(-${focus[0]}%, -${focus[1]}%)`);
$('[data-p19-zoom]').click(); resize(false); resize(true); assert.equal($('[data-p19-zoom]').getAttribute('aria-pressed'), 'false');
win.history.replaceState({ ...win.history.state, __javaExperienceP19: { topic: 'ports', stage: 'ports-compose' } }, ''); win.dispatchEvent(new win.PopStateEvent('popstate')); assert.equal(value('앱의 접속 주소'), 'mysql:3306');
initP19Learning(doc, win); assert.equal($('[data-p19-topic]').value, 'ports');
win.navigator.clipboard.writeText = async () => { throw Error('clipboard unavailable'); }; $('[data-p19-copy]').click(); await Promise.resolve(); await Promise.resolve(); assert.equal(win.getSelection().toString(), $('[data-p19-code]').textContent);
win.location.hash = 'original-anchor'; win.dispatchEvent(new win.HashChangeEvent('hashchange')); assert.equal(doc.getElementById('p19-original').open, true); assert.equal(doc.getElementById('original-anchor').getAttribute('href'), '#old');
assert.equal(readFileSync(new URL('../../docs/knowledge/P19-mysql-jpa-setup.md', import.meta.url), 'utf8'), original);
win.close();
const mobile = setup(true); mobile.topic('pool'); mobile.$('[data-p19-stage-select]').value = 'pool-timeout'; mobile.$('[data-p19-stage-select]').dispatchEvent(new mobile.win.Event('change')); mobile.$('[data-p19-mobile-next]').focus(); mobile.$('[data-p19-mobile-next]').click(); assert.equal(mobile.doc.activeElement, mobile.$('[data-p19-stage-select]'));
mobile.stage('pool-borrowed'); mobile.$('[data-p19-mobile-prev]').focus(); mobile.$('[data-p19-mobile-prev]').click(); assert.equal(mobile.doc.activeElement, mobile.$('[data-p19-stage-select]')); mobile.win.close();
for (const [key, asset] of Object.entries(saved)) Object.assign(P19_ASSETS[key], asset);
console.log('P19: 6질문·19상태, 19 PASS·실측카운터/JSON/의존성 결과, 원문/history 보존·exact copy·키보드/포커스·확대resize·모바일 통과');
