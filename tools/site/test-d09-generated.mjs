import { resolveEvidencePath } from './evidence-path.mjs';
// main의 이미지 ready·공유 등록·빌드 뒤 실행한다. UI 작성 단계에서는 구문만 확인한다.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { JSDOM } from 'jsdom';
import { rasterDimensions } from './raster-size.mjs';
import { D09_LESSONS, D09_ASSETS, D09_RUNS, d09Run } from './d09-lesson-data.mjs';
const root = new URL('../../', import.meta.url), design = 'docs/design/d09-2026-10-21/', proof = design + 'source-proof/';
const read = file => fs.readFileSync(new URL(file, root), 'utf8'), json = file => JSON.parse(read(file));
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const base = json(design + 'html-baseline.json');
assert.equal(sha(read('docs/knowledge/D09-operations-observability.md')), base.sourceSHA256);
assert.deepEqual([base.wholeSourceText.length, base.withoutMermaidText.length, base.code.length, base.mermaid.length, base.ids.length, base.oldVisual.length], [14054, 12690, 5, 4, 22, 1]);
assert.equal(json(proof + 'source.json').lines, 309);
const page = new JSDOM(read('docs/knowledge/D09-operations-observability.html'), { runScripts: 'outside-only', url: 'https://learn.example/docs/knowledge/D09-operations-observability.html' });
const d = page.window.document, source = d.querySelector('#d09-original'); assert.ok(source, 'main의 원문 wrapper');
const clone = source.cloneNode(true); clone.querySelector(':scope>summary').remove(); clone.querySelectorAll('script').forEach(node => node.remove());
const normalized = node => (d.querySelector('main>h1, h1.kr-source-title').textContent + ' ' + node.textContent).replace(/\s+/g, ' ').trim();
assert.equal(normalized(clone), base.wholeSourceText);
assert.deepEqual([...source.querySelectorAll('pre code')].map(node => node.textContent), base.code);
assert.deepEqual([...source.querySelectorAll('.mermaid')].map(node => node.textContent), base.mermaid);
clone.querySelectorAll('.mermaid').forEach(node => node.remove()); assert.equal(normalized(clone), base.withoutMermaidText);
for (const id of base.ids) assert.ok(d.getElementById(id), id);
assert.deepEqual([...d.querySelectorAll('.d09-legacy>.knowledge-page-map')].map(node => node.outerHTML), base.oldVisual);
const ids = [...d.querySelectorAll('[id]')].map(node => node.id); assert.equal(ids.length, new Set(ids).size);
const selected = json(design + 'image-records.json').images.filter(row => row.selected);
assert.equal(selected.length, 14); assert.equal(Object.keys(D09_ASSETS).length, 14); assert.equal(new Set(Object.values(D09_ASSETS).map(asset => asset.file)).size, 14);
for (const asset of Object.values(D09_ASSETS)) {
 assert.equal(asset.ready, true); assert.ok(asset.file.endsWith('.jpg'));
 const bytes = fs.readFileSync(new URL(design + 'images/' + asset.file, root)), actual = rasterDimensions(bytes), record = selected.find(row => row.destination.endsWith('/' + asset.file));
 assert.equal(actual.format, 'jpeg'); assert.deepEqual([asset.width, asset.height], [actual.width, actual.height]); assert.ok(record); assert.equal(record.sha256, sha(bytes)); assert.deepEqual([record.width, record.height], [actual.width, actual.height]);
}
const stages = D09_LESSONS.flatMap(topic => topic.stages);
assert.equal(D09_LESSONS.length, 14); assert.equal(stages.length, 39); assert.equal(new Set(stages.map(stage => stage.id)).size, 39);
assert.deepEqual(['native-fixture', 'model-json', 'unrun-source'].map(kind => stages.filter(stage => stage.codeKind === kind).length), [17, 19, 3]);
for (const stage of stages) {
 const region = D09_ASSETS[stage.image].focus[stage.id]; assert.ok(Array.isArray(region) && region.length === 4 && region.every(value => Number.isFinite(value) && value >= 0)); assert.ok(region[2] > 0 && region[3] > 0 && region[0] + region[2] <= 100 && region[1] + region[3] <= 100);
 assert.ok(stage.code.endsWith('\n')); assert.ok(stage.code.split('\n').length <= 14);
 if (stage.codeKind === 'model-json') { let value = d09Run(stage.codePath); if (stage.codeKeys) value = Object.fromEntries(stage.codeKeys.map(key => [key, value[key]])); assert.deepEqual(JSON.parse(stage.code), value); }
 else assert.ok(read(proof + stage.codePath).includes(stage.code), stage.id + ' continuous source excerpt');
 if (!stage.checks.length) assert.ok(stage.runKeys.every(key => key.startsWith('models.')));
}
assert.ok(d.querySelector('link[href*="p09-learning.css"]')); assert.ok(d.querySelector('link[href*="d09-learning.css"]')); assert.ok(d.querySelector('script[src*="d09-learning.bundle.js"]'));
page.window.eval(read('tools/site/d09-learning.bundle.js'));
const ui = d.querySelector('[data-d09-learning]'); assert.ok(ui?.querySelector('[data-d09-topic]')); assert.equal(ui.querySelector('[data-d09-question]').tagName, 'H2');
for (const lesson of D09_LESSONS) {
 const topic = ui.querySelector('[data-d09-topic]'); topic.value = lesson.id; topic.dispatchEvent(new page.window.Event('change'));
 for (const stage of lesson.stages) {
  ui.querySelector(`[data-d09-stage="${stage.id}"]`).click(); assert.equal(ui.dataset.stage, stage.id);
  assert.equal(ui.querySelector('[data-d09-title]').textContent, stage.title); assert.equal(ui.querySelector('[data-d09-lead]').textContent, stage.lead); assert.equal(ui.querySelector('[data-d09-source-note]').textContent, stage.sourceNote || lesson.sourceNote);
  assert.equal(ui.querySelector('[data-d09-code]').textContent, stage.code); assert.ok(ui.querySelector('[data-d09-code]').textContent.endsWith('\n'));
  assert.deepEqual([...ui.querySelectorAll('[data-d09-code] mark')].map(node => node.textContent), stage.active.map(index => stage.code.split('\n')[index]));
  assert.equal(ui.querySelector('[data-d09-code-kind]').textContent, stage.codeKind === 'model-json' ? '미실행 모델 JSON · 설명 근거' : stage.codeKind === 'unrun-source' ? '미실행 원문 YAML·bash · ' + stage.codePath : '추가 native 예시 실제 발췌 · ' + stage.codePath);
  for (const [label, expected] of stage.values) { const term = [...ui.querySelectorAll('[data-d09-state] dt')].find(node => node.textContent === label); assert.ok(term, label); assert.equal(term.nextElementSibling.textContent, expected); }
  for (const selector of ['[data-d09-code]', '[data-d09-state]', '[data-d09-source-note]']) assert.equal(ui.querySelector(selector).closest('details'), null);
  assert.equal(ui.querySelector('[data-d09-output]').open, false); assert.equal(ui.querySelector('[data-d09-stdout]').textContent, stage.checks.map(key => 'PASS ' + key).join('\n')); assert.equal(ui.querySelector('[data-d09-stdout]').parentElement.hidden, !stage.checks.length);
  for (const key of stage.runKeys) assert.ok(ui.querySelector('[data-d09-runs]').textContent.includes(JSON.stringify(d09Run(key), null, 2)), key);
  assert.equal(ui.querySelector('[data-d09-image]').getAttribute('src'), '../design/d09-2026-10-21/images/' + D09_ASSETS[stage.image].file);
 }
}
const actual = json(proof + 'execution.json'); assert.deepEqual(D09_RUNS, actual); assert.deepEqual(actual, json(proof + 'checkpoints/expected-execution.json')); assert.deepEqual(actual.models, json(proof + 'models.json'));
assert.equal(actual.checks.length, 22); assert.equal(new Set(actual.checks).size, 22); assert.equal(Object.keys(actual.models).length, 6); assert.ok(Object.values(actual.models).every(model => model.executed === false)); assert.deepEqual(new Set(stages.flatMap(stage => stage.checks)), new Set(actual.checks)); assert.equal(stages.filter(stage => stage.checks.length).length, 17);
const f = actual.facts;
assert.deepEqual(['success', 'httpfail', 'badpayload', 'invalid'].map(caseName => [f['business-' + caseName + '-observed'].httpStatus, f['business-' + caseName + '-observed'].businessOK, f['business-' + caseName + '-observed'].valid]), [[200, true, true], [500, false, true], [200, false, true], [400, false, false]]);
assert.deepEqual(f['bounded-business-counter-outcomes'].outcomes, { success: 1, failure: 2, excluded: 1 }); assert.deepEqual(f['actual-prometheus-query-sees-selected-counters'].selectedCounterValues, { success: 1, failure: 2, excluded: 1, valid: 3, businessSuccess: 1, validHTTP200: 2 });
assert.deepEqual(['prometheus-scrape-up-despite-business-failures', 'exporter-stop-makes-actual-scrape-up-zero', 'restart-same-own-port-resets-counter-and-up-recovers'].map(key => f[key].up), [1, 0, 1]); assert.ok(Object.values(f['restart-same-own-port-resets-counter-and-up-recovers'].selectedCounterValues).every(value => value === 0));
assert.deepEqual([f['valid-business-versus-http200-denominator'].valid, f['valid-business-versus-http200-denominator'].businessSuccess, f['valid-business-versus-http200-denominator'].validHTTP200], [3, 1, 2]);
assert.deepEqual(f['sqlite-restored-snapshot-differs-from-newer-source'].sourceRows, [[1, 'seed'], [2, 'later']]); assert.deepEqual(f['sqlite-restored-snapshot-differs-from-newer-source'].restoredRows, [[1, 'seed']]); assert.equal(f['sqlite-restored-snapshot-differs-from-newer-source'].operationalRPOOrRTOAchieved, false);
assert.deepEqual([f['explicit-decimal-error-budget-not-measured-traffic'].allowedFailures, f['explicit-decimal-error-budget-not-measured-traffic'].remaining, f['explicit-decimal-error-budget-not-measured-traffic'].burn], ['10', '-10', '2']); assert.equal(f['explicit-decimal-error-budget-not-measured-traffic'].timeOnlyExample.minutes, '43.2'); assert.deepEqual(f['explicit-nearest-rank-vector-not-latency'].p95, { rank: 5, value: 50 });
const manifest = json(proof + 'fixture-manifest.json'); assert.equal(manifest.files.length, 4); for (const row of manifest.files) assert.equal(sha(read(proof + 'fixture/' + row.file)), row.sha256); assert.equal(sha(read(proof + 'run-proof.py')), manifest.runnerSHA256);
const raw = json(proof + 'runtime-last.json'); assert.equal(raw.completed, true); assert.equal(raw.processes.length, 3); assert.ok(raw.processes.every(row => row.exitCode === 0 && row.pidGone && row.portClosedWhenStopped && !row.killFallback)); assert.ok(raw.commands.every(row => row.exitCode === 0)); assert.equal(raw.requests.filter(row => row.label.startsWith('business-')).length, 4); assert.ok(raw.requests.length > 4 && raw.promQueries.length > 0);
const binary = raw.commands.find(row => row.name === 'prometheus-version').argv[0]; assert.equal(sha(fs.readFileSync(resolveEvidencePath(binary))), f['actual-prometheus-binary-version-sha'].binarySHA256);
const supplement = d.querySelector('.d09-supplement'); assert.ok(supplement && !source.contains(supplement)); assert.equal(supplement.open, false); assert.ok([...supplement.querySelectorAll('details')].every(node => !node.open));
for (const phrase of ['원문309줄9block', 'native22CHECK', 'native17·모델19·미실행 원문3', 'fixture4개', 'archive SHA920df', '실행파일 SHAedfbcf', '전체 HTTP가4번이라는 뜻이 아닙니다', 'RPO5분/RTO2시간', 'minimumTTL>0', '전수pixel']) assert.ok(supplement.textContent.includes(phrase), phrase);
const fullCode = [...supplement.querySelectorAll('pre code')].map(node => node.textContent);
assert.ok(fullCode.includes(read('docs/knowledge/D09-operations-observability.md'))); for (const row of json(proof + 'source.json').originalBlocks) assert.ok(fullCode.includes(read(proof + 'original/' + row.file))); for (const row of manifest.files) assert.ok(fullCode.includes(read(proof + 'fixture/' + row.file)));
for (const file of ['source.json', 'execution.json', 'models.json', 'checkpoints/expected-execution.json', 'runtime-last.json', 'fixture-manifest.json', 'prometheus-artifact.json', 'author-fresh-verification.json', 'main-fresh-verification.json']) assert.ok(fullCode.some(code => { try { return JSON.stringify(JSON.parse(code)) === JSON.stringify(json(proof + file)); } catch { return false; } }), file + ' full JSON');
for (const file of ['source-proof/independent-replay.json', 'model-review.json']) if (fs.existsSync(new URL(design + file, root))) assert.ok(fullCode.some(code => { try { return JSON.stringify(JSON.parse(code)) === JSON.stringify(json(design + file)); } catch { return false; } }), file + ' arrived optional proof preserved');
assert.ok(fullCode.some(code => { try { return JSON.stringify(JSON.parse(code)) === JSON.stringify(json(design + 'research/main-verification.json')); } catch { return false; } })); assert.ok(fullCode.includes(read(proof + 'run-proof.py'))); assert.ok(fullCode.includes(read(proof + 'main-replay.log')));
page.window.close();
console.log('D09 생성HTML: 원문14054/도표제외12690자·code5/Mermaid4/id22/map1·14주제39상태(native17/model19/unrun3)·선정14JPEG·22CHECK6모델·실제Prom/분모/SQLite/명시계산·fullraw 보존 통과');
