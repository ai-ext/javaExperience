import assert from 'node:assert/strict';
import { D09_LESSONS, D09_ASSETS, D09_RUNS, d09AssetRoot, d09Run } from './d09-lesson-data.mjs';
const contract = {
 business:['success','httpfail','badpayload','invalid'], counters:['outcomes','denominator','query'], scrape:['running','stopped','restarted'], logs:['correlate','trace'], sli:['definition','budget','time'], percentile:['vector','histogram'], backup:['snapshot','later','restored'], signals:['logs','metrics','traces'], labels:['bounded','unbounded'], alerts:['signals','burn','no-data'], incident:['detect','mitigate','review'], capacity:['scale','hpa','cache'], recovery:['rpo','rto'], original:['prometheus','compose','commands'],
};
assert.deepEqual(D09_LESSONS.map(topic=>topic.id),Object.keys(contract));
for(const topic of D09_LESSONS)assert.deepEqual(topic.stages.map(stage=>stage.id),contract[topic.id].map(id=>topic.id+'-'+id));
const stages=D09_LESSONS.flatMap(topic=>topic.stages);
assert.equal(stages.length,39);
assert.deepEqual(['native-fixture','model-json','unrun-source'].map(kind=>stages.filter(stage=>stage.codeKind===kind).length),[17,19,3]);
assert.equal(Object.keys(D09_ASSETS).length,14);
assert.deepEqual(new Set(stages.flatMap(stage=>stage.checks)),new Set(D09_RUNS.checks));
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { JSDOM } from 'jsdom';
import { renderD09Learning, d09AvailableLessons } from './d09-learning.mjs';
import { initD09Learning } from './d09-learning.js';
import { renderD09Supplementary } from './d09-supplement.mjs';
const proof = new URL('../../docs/design/d09-2026-10-21/source-proof/', import.meta.url);
const read = file => readFileSync(new URL(file, proof), 'utf8');
const load = file => JSON.parse(read(file));
const sha = value => createHash('sha256').update(value).digest('hex');
const execution = load('execution.json'), raw = load('runtime-last.json'), meta = load('source.json'), manifest = load('fixture-manifest.json');
assert.deepEqual(D09_RUNS, execution);
assert.deepEqual(execution, load('checkpoints/expected-execution.json'));
assert.deepEqual(execution.models, load('models.json'));
assert.equal(execution.checks.length, 22);
assert.equal(new Set(execution.checks).size, 22);
assert.equal(Object.keys(execution.models).length, 6);
assert.ok(Object.values(execution.models).every(model => model.executed === false));
assert.deepEqual(new Set(read('main-replay.log').split('\n').filter(line => line.startsWith('PASS ')).map(line => line.slice(5))), new Set(execution.checks));
const sourceURL = new URL('../../docs/knowledge/D09-operations-observability.md', import.meta.url), source = readFileSync(sourceURL, 'utf8');
assert.equal(sha(source), meta.sha256);
assert.equal(meta.lines, 309);
assert.deepEqual(meta.originalBlocks.map(row => row.language), ['mermaid', 'mermaid', 'mermaid', 'mermaid', 'yaml', 'yaml', 'bash', 'bash', 'bash']);
for (const row of meta.originalBlocks) assert.equal(sha(read('original/' + row.file)), row.sha256);
assert.equal(manifest.files.length, 4);
for (const row of manifest.files) assert.equal(sha(read('fixture/' + row.file)), row.sha256);
assert.equal(sha(read('run-proof.py')), manifest.runnerSHA256);
assert.equal(raw.completed, true);
assert.equal(raw.processes.length, 3);
assert.ok(raw.processes.every(row => row.exitCode === 0 && row.pidGone && row.portClosedWhenStopped && !row.killFallback));
assert.ok(raw.commands.every(row => row.exitCode === 0));
const businessRequests = raw.requests.filter(row => row.label.startsWith('business-'));
assert.equal(businessRequests.length, 4);
assert.deepEqual(businessRequests.map(row => row.status), [200, 500, 200, 400]);
assert.ok(raw.requests.length > businessRequests.length, '업무4건과 전체HTTP 분모를 분리');
assert.ok(raw.requests.every(row => row.url.startsWith('http://127.0.0.1:') && ![8080, 9090, 3000].some(port => row.url.includes(':' + port + '/'))));
assert.ok(raw.promQueries.length > 0);
assert.ok(raw.promQueries.every(row => row.response.status === 'success'));
const upSamples = raw.promQueries.filter(row => row.expression === 'up{job="d09-extra-exporter"}').flatMap(row => row.response.data.result.map(result => Number(result.value[1])));
assert.ok(upSamples.includes(0) && upSamples.includes(1), '실제 Prom API up0/up1 sample');
const eventRows = readFileSync(raw.run + '/business-events.jsonl', 'utf8').trim().split('\n').map(line => JSON.parse(line));
assert.deepEqual(eventRows, businessRequests.map(row => JSON.parse(row.body)));
assert.ok(eventRows.every(row => Number.isFinite(Date.parse(row.timestamp))));
const f = execution.facts, state = id => stages.find(stage => stage.id === id);
assert.equal(f['original-nine-blocks-preserved-unrun'].sourceJavaPresent, false);
assert.equal(f['additional-private-stdlib-runtime'].python, '3.14.3');
assert.equal(f['additional-private-stdlib-runtime'].sqlite, '3.53.0');
assert.equal(f['actual-prometheus-binary-version-sha'].version, '3.15.0');
assert.equal(f['actual-prometheus-binary-version-sha'].binarySHA256, 'edfbcf257fff3694e345be7648ce8ee05aa0cf602662097c649f4923116d7145');
assert.deepEqual(['success', 'httpfail', 'badpayload', 'invalid'].map(caseName => {
 const fact = f['business-' + caseName + '-observed']; return [fact.httpStatus, fact.businessOK, fact.valid, fact.outcome];
}), [[200, true, true, 'success'], [500, false, true, 'failure'], [200, false, true, 'failure'], [400, false, false, 'excluded']]);
assert.deepEqual(f['bounded-business-counter-outcomes'].outcomes, { success: 1, failure: 2, excluded: 1 });
assert.deepEqual([f['valid-business-versus-http200-denominator'].valid, f['valid-business-versus-http200-denominator'].businessSuccess, f['valid-business-versus-http200-denominator'].validHTTP200], [3, 1, 2]);
assert.equal(f['metrics-fetch-does-not-add-business-requests'].metricsGETCountsAsBusiness, false);
assert.equal(f['request-id-is-log-context-not-metric-label'].requestIDInMetricLabels, false);
assert.deepEqual(f['actual-prometheus-query-sees-selected-counters'].selectedCounterValues, { success: 1, failure: 2, excluded: 1, valid: 3, businessSuccess: 1, validHTTP200: 2 });
assert.deepEqual(['prometheus-scrape-up-despite-business-failures', 'exporter-stop-makes-actual-scrape-up-zero', 'restart-same-own-port-resets-counter-and-up-recovers'].map(key => f[key].up), [1, 0, 1]);
assert.ok(Object.values(f['restart-same-own-port-resets-counter-and-up-recovers'].selectedCounterValues).every(value => value === 0));
assert.equal(f['restart-same-own-port-resets-counter-and-up-recovers'].businessRequestsAfterRestart, 0);
assert.deepEqual(f['sqlite-backup-captures-committed-seed-row'].snapshotRows, [[1, 'seed']]);
assert.deepEqual(f['sqlite-restored-snapshot-differs-from-newer-source'].sourceRows, [[1, 'seed'], [2, 'later']]);
assert.deepEqual(f['sqlite-restored-snapshot-differs-from-newer-source'].restoredRows, [[1, 'seed']]);
assert.equal(f['sqlite-restored-snapshot-differs-from-newer-source'].sourceRowsDeleted, false);
assert.equal(f['sqlite-restored-snapshot-differs-from-newer-source'].operationalRPOOrRTOAchieved, false);
assert.deepEqual(Object.values(f['sqlite-restored-integrity-and-own-connections-close'].integrity), ['ok', 'ok', 'ok']);
assert.ok(Object.values(f['sqlite-restored-integrity-and-own-connections-close'].connectionsClosed).every(value => value === true));
const budget = f['explicit-decimal-error-budget-not-measured-traffic'];
assert.deepEqual([budget.valid, budget.success, budget.failures, budget.targetPercent, budget.allowedFailures, budget.remaining, budget.burn], ['10000', '9980', '20', '99.9', '10', '-10', '2']);
assert.equal(budget.timeOnlyExample.minutes, '43.2');
assert.match(budget.timeOnlyExample.condition, /only a time-based.*never convert/);
assert.deepEqual(f['explicit-nearest-rank-vector-not-latency'].p95, { rank: 5, value: 50 });
assert.deepEqual(f['all-own-processes-and-loopback-ports-closed'].allExitCodes, [0, 0, 0]);
const forbiddenRawKeys = value => value && typeof value === 'object' ? Object.entries(value).flatMap(([key, child]) => /^(pid|port|timestamp)$/i.test(key) ? [key] : forbiddenRawKeys(child)) : [];
assert.deepEqual(forbiddenRawKeys(D09_RUNS), [], 'actual runtime PID/port/timestamp는 RUNS가 아닌 raw에만');
assert.equal(stages.filter(stage => stage.checks.length).length, 17);
assert.ok(stages.filter(stage => stage.active.some(index => index > 0)).length >= 30);
assert.ok(stages.every(stage => stage.code.endsWith('\n')), '끝 개행도 복사 대상');
assert.ok(stages.some(stage => stage.code.includes('\n\n')), '원문 빈 줄 보존');
for (const stage of stages) {
 const lines = stage.code.split('\n'); assert.ok(lines.length <= 14, stage.id);
 assert.ok(stage.active.length && stage.active.every(index => Number.isInteger(index) && index >= 0 && index < lines.length && lines[index].trim()));
 if (stage.codeKind === 'model-json') {
  let projection = d09Run(stage.codePath); if (stage.codeKeys) projection = Object.fromEntries(stage.codeKeys.map(key => [key, projection[key]]));
  assert.deepEqual(JSON.parse(stage.code), projection, stage.id + ' exact frozen projection');
 } else {
  assert.ok(read(stage.codePath).includes(stage.code), stage.id + ' actual continuous source substring');
  assert.ok(stage.codePath.startsWith(stage.codeKind === 'native-fixture' ? 'fixture/' : 'original/') || stage.codePath === 'run-proof.py');
 }
 for (const key of stage.runKeys) assert.notEqual(d09Run(key), undefined, key);
 if (!stage.checks.length) assert.ok(stage.runKeys.every(key => key.startsWith('models.')));
 assert.ok(D09_ASSETS[stage.image].focus[stage.id]);
}
assert.match(state('business-invalid').lead, /모든4xx.*아닙니다/);
assert.match(state('scrape-stopped').lead, /timeout·HTTP·형식/);
assert.match(state('scrape-restarted').lead, /이전 TSDB 이력을 지웠다는 뜻은 아닙니다/);
assert.match(state('scrape-restarted').sourceNote, /최종 cleanup CHECK.*별도 시점/);
assert.match(state('logs-trace').lead, /backend.*정의상 필수조건.*단정하지/);
assert.match(state('sli-budget').lead, /10000.*9980.*20.*99.9/);
assert.match(state('sli-time').lead, /down time|downtime/);
assert.match(state('percentile-histogram').lead, /classic.*native exponential/);
assert.match(state('capacity-hpa').lead, /설정 가능한 제어 루프 조회 간격/);
assert.match(state('capacity-cache').lead, /minimumTTL>0.*no-cache\/no-store\/private/);
assert.match(state('alerts-no-data').lead, /성공100%.*숨기지/);
assert.equal(state('original-prometheus').code, read('original/block-05.yaml'));
assert.equal(state('original-commands').code, read('original/block-08.sh'));
assert.ok(Object.values(D09_ASSETS).every(asset => asset.file.endsWith('.jpg')));
const supPage = new JSDOM(renderD09Supplementary(), { runScripts: 'outside-only' }), supplement = supPage.window.document.querySelector('.d09-supplement');
assert.ok(supplement && !supplement.open); assert.ok([...supplement.querySelectorAll('details')].every(node => !node.open));
const fullCode = [...supplement.querySelectorAll('pre code')].map(node => node.textContent);
assert.ok(fullCode.includes(source));
for (const row of meta.originalBlocks) assert.ok(fullCode.includes(read('original/' + row.file)));
for (const row of manifest.files) assert.ok(fullCode.includes(read('fixture/' + row.file)));
for (const file of ['execution.json', 'models.json', 'runtime-last.json', 'prometheus-artifact.json', 'fixture-manifest.json', 'author-fresh-verification.json', 'main-fresh-verification.json']) assert.ok(fullCode.some(code => { try { return JSON.stringify(JSON.parse(code)) === JSON.stringify(load(file)); } catch { return false; } }), file + ' full raw preserved');
assert.ok(fullCode.includes(read('run-proof.py')));
if (existsSync(new URL('independent-replay.json', proof))) assert.ok(fullCode.some(code => { try { return JSON.stringify(JSON.parse(code)) === JSON.stringify(load('independent-replay.json')); } catch { return false; } }));
assert.match(supplement.textContent, /업무 GET4건.*전체 HTTP가4번이라는 뜻이 아닙니다/s);
assert.match(supplement.textContent, /archive SHA920df.*실행파일 SHAedfbcf/);
assert.match(supplement.textContent, /기존 DB 삭제.*RPO5분\/RTO2시간 달성.*아닙니다/s);
supPage.window.close();
const saved = structuredClone(D09_ASSETS);
try {
 Object.values(D09_ASSETS).forEach(asset => { asset.ready = false; }); assert.equal(d09AvailableLessons().length, 0); assert.match(renderD09Learning(), /준비 중/);
 Object.values(D09_ASSETS).forEach(asset => { asset.ready = true; });
 const foreign = { __javaExperienceD08: { topic: 'scrape', stage: 'scrape-old' }, foreign: { keep: true } };
 function setup(matches = false) {
  const page = new JSDOM('<h1>기존 D09</h1><section class="d09-legacy"><button data-d09-stage="business-invalid" id="legacy-control">기존 지도</button></section>' + renderD09Learning() + '<details id="d09-original"><summary>원문</summary><details><summary>기존 코드</summary><a id="source-deep" href="#old">기존 링크</a></details></details>', { url: 'https://learn.example/D09.html' });
  const win = page.window, doc = win.document, listeners = [], media = { matches, addEventListener(type, callback) { assert.equal(type, 'change'); listeners.push(callback); } };
  win.matchMedia = () => media; for (const name of ['localStorage', 'sessionStorage']) Object.defineProperty(win, name, { get() { throw Error('storage/progress forbidden'); } }); win.fetch = () => { throw Error('network forbidden'); };
  const copied = []; Object.defineProperty(win.navigator, 'clipboard', { value: { async writeText(code) { copied.push(code); } } });
  win.history.replaceState(structuredClone(foreign), ''); const old = ['.d09-legacy', '#d09-original'].map(selector => doc.querySelector(selector).outerHTML);
  initD09Learning(doc, win); const root = doc.querySelector('[data-d09-learning]'), $ = selector => root.querySelector(selector);
  const topic = id => { $('[data-d09-topic]').value = id; $('[data-d09-topic]').dispatchEvent(new win.Event('change')); };
  const stage = id => $(`[data-d09-stage="${id}"]`).click();
  const value = label => { const dt = [...$('[data-d09-state]').querySelectorAll('dt')].find(node => node.textContent === label); assert.ok(dt, label); return dt.nextElementSibling.textContent; };
  return { win, doc, root, $, topic, stage, value, copied, old, resize(matches) { media.matches = matches; listeners.forEach(callback => callback({ matches })); } };
 }
 const { win, doc, root, $, topic, stage, value, copied, old, resize } = setup();
 assert.equal(doc.querySelectorAll('h1').length, 1); assert.equal($('[data-d09-question]').tagName, 'H2'); assert.match($('.d09-scope').textContent, /실제 Prometheus.*원문 Actuator·Java25·Docker·Grafana는 미실행/);
 const kind = state => state.codeKind === 'model-json' ? '미실행 모델 JSON · 설명 근거' : stageCodeKind(state);
 function stageCodeKind(state) { return state.codeKind === 'unrun-source' ? '미실행 원문 YAML·bash · ' + state.codePath : '추가 native 예시 실제 발췌 · ' + state.codePath; }
 for (const lesson of D09_LESSONS) {
  topic(lesson.id); assert.equal($('[data-d09-stage-select]').options.length, lesson.stages.length);
  for (const [index, state] of lesson.stages.entries()) {
   stage(state.id); assert.equal(root.dataset.topic, lesson.id); assert.equal(root.dataset.stage, state.id);
   assert.equal($('[data-d09-title]').textContent, state.title); assert.equal($('[data-d09-lead]').textContent, state.lead); assert.equal($('[data-d09-source-note]').textContent, state.sourceNote || lesson.sourceNote);
   assert.equal($('[data-d09-code]').textContent, state.code); assert.equal($('[data-d09-code-kind]').textContent, kind(state)); assert.ok($('[data-d09-code]').textContent.endsWith('\n'));
   assert.deepEqual([...$('[data-d09-code]').querySelectorAll('mark')].map(node => node.textContent), state.active.map(index => state.code.split('\n')[index]));
   for (const [label, expected] of state.values) assert.equal(value(label), expected);
   for (const selector of ['[data-d09-state]', '[data-d09-code]', '[data-d09-source-note]']) assert.equal($(selector).closest('details'), null);
   assert.equal($('[data-d09-output]').open, false); assert.equal($('[data-d09-stdout]').textContent, state.checks.map(check => 'PASS ' + check).join('\n')); assert.equal($('[data-d09-stdout]').parentElement.hidden, !state.checks.length);
   for (const path of state.runKeys) assert.ok($('[data-d09-runs]').textContent.includes(path + (path.startsWith('models.') ? ' · 모델 기록' : ' · 실제 기록') + JSON.stringify(d09Run(path), null, 2)));
   assert.equal($('[data-d09-position]').textContent, `${index + 1} / ${lesson.stages.length}`); assert.equal($('[data-d09-image]').getAttribute('src'), d09AssetRoot + D09_ASSETS[state.image].file);
   $('[data-d09-copy]').click(); await Promise.resolve(); await Promise.resolve(); assert.equal(copied.at(-1), state.code);
   assert.deepEqual(['.d09-legacy', '#d09-original'].map(selector => doc.querySelector(selector).outerHTML), old);
  }
 }
 topic('business'); stage('business-badpayload'); assert.equal(value('HTTP status'), '200'); assert.equal(value('valid / business_ok'), 'true / false'); stage('business-invalid'); assert.equal(value('outcome'), 'excluded');
 topic('counters'); stage('counters-denominator'); assert.equal(value('업무 성공 / 유효'), '1 / 3'); assert.equal(value('유효 HTTP200 / 유효'), '2 / 3');
 topic('scrape'); stage('scrape-stopped'); assert.equal(value('실제 up'), '0'); stage('scrape-restarted'); assert.equal(value('실제 up'), '1'); assert.match(value('선택 counter6개'), /validHTTP2000/);
 topic('sli'); stage('sli-budget'); assert.equal(value('remaining / burn'), '-10 / 2'); stage('sli-time'); assert.equal(value('명시 계산 결과'), '43.2분');
 topic('backup'); stage('backup-restored'); assert.equal(value('운영 RPO/RTO 달성'), 'false · 데이터 toy');
 assert.equal(win.history.length, 1); assert.deepEqual(win.history.state.foreign, foreign.foreign); assert.deepEqual(win.history.state.__javaExperienceD08, foreign.__javaExperienceD08);
 const beforeLegacy = root.dataset.stage; doc.getElementById('legacy-control').click(); assert.equal(root.dataset.stage, beforeLegacy);
 topic('business'); const buttons = [...root.querySelectorAll('[data-d09-stage]')]; buttons[0].focus();
 for (const [key, index] of [['End', 3], ['ArrowLeft', 2], ['Home', 0], ['ArrowRight', 1]]) { doc.activeElement.dispatchEvent(new win.KeyboardEvent('keydown', { key, bubbles: true })); assert.equal(doc.activeElement, buttons[index]); }
 buttons[1].dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); assert.equal(root.dataset.stage, 'business-httpfail'); stage('business-badpayload'); $('[data-d09-next]').focus(); $('[data-d09-next]').click(); assert.equal(doc.activeElement, buttons[3]); stage('business-httpfail'); $('[data-d09-prev]').focus(); $('[data-d09-prev]').click(); assert.equal(doc.activeElement, buttons[0]);
 $('[data-d09-output]').open = true; $('[data-d09-zoom]').click(); resize(true); assert.equal($('[data-d09-output]').open, true); assert.equal($('.d09-image-frame').tabIndex, 0); const region = D09_ASSETS['D09-business'].focus['business-success']; assert.equal($('[data-d09-image]').style.transform, `translate(-${region[0]}%, -${region[1]}%)`); $('[data-d09-zoom]').click(); resize(false); resize(true); assert.equal($('[data-d09-zoom]').getAttribute('aria-pressed'), 'false'); assert.equal($('[data-d09-output]').open, true); stage('business-httpfail'); assert.equal($('[data-d09-output]').open, false);
 const target = { topic: 'scrape', stage: 'scrape-restarted' }; win.history.replaceState({ ...win.history.state, __javaExperienceD09: target }, ''); win.dispatchEvent(new win.PopStateEvent('popstate')); assert.equal(root.dataset.stage, target.stage); initD09Learning(doc, win); assert.equal(root.dataset.topic, target.topic); win.history.pushState({ foreign: { anchor: true } }, '', '#anchor-entry'); win.dispatchEvent(new win.PopStateEvent('popstate')); assert.deepEqual(win.history.state.__javaExperienceD09, target); assert.deepEqual(win.history.state.foreign, { anchor: true }); win.history.pushState(null, '', '#null-entry'); win.dispatchEvent(new win.PopStateEvent('popstate')); assert.deepEqual(win.history.state.__javaExperienceD09, target);
 topic('original'); stage('original-prometheus'); win.navigator.clipboard.writeText = async () => { throw Error('clipboard unavailable'); }; $('[data-d09-copy]').click(); await Promise.resolve(); await Promise.resolve(); assert.equal(win.getSelection().toString(), state('original-prometheus').code); assert.ok(win.getSelection().toString().includes('\n\n')); assert.ok(win.getSelection().toString().endsWith('\n'));
 win.location.hash = 'source-deep'; win.dispatchEvent(new win.HashChangeEvent('hashchange')); assert.equal(doc.getElementById('d09-original').open, true); assert.equal(doc.getElementById('source-deep').closest('details').open, true); assert.equal(doc.getElementById('source-deep').getAttribute('href'), '#old'); assert.equal(readFileSync(sourceURL, 'utf8'), source); win.close();
 const mobile = setup(true); mobile.topic('business'); mobile.$('[data-d09-stage-select]').value = 'business-badpayload'; mobile.$('[data-d09-stage-select]').dispatchEvent(new mobile.win.Event('change')); mobile.$('[data-d09-mobile-next]').focus(); mobile.$('[data-d09-mobile-next]').click(); assert.equal(mobile.doc.activeElement, mobile.$('[data-d09-stage-select]')); mobile.stage('business-httpfail'); mobile.$('[data-d09-mobile-prev]').focus(); mobile.$('[data-d09-mobile-prev]').click(); assert.equal(mobile.doc.activeElement, mobile.$('[data-d09-stage-select]')); mobile.win.close();
 const css = readFileSync(new URL('./d09-learning.css', import.meta.url), 'utf8'); assert.match(css, /overflow-wrap:anywhere/); assert.match(css, /white-space:pre-wrap/); assert.match(css, /dt,dd/);
} finally { for (const [key, asset] of Object.entries(saved)) Object.assign(D09_ASSETS[key], asset); }
console.log('D09: 14질문39상태(native17/model19/미실행원문3)·22CHECK6모델·실제Prom/counter/분모·SQLite/명시계산 경계·copy끝개행/history/focus/mobile 계약 통과');
