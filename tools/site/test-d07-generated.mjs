import { loadSourceBaseline, readHistoricalSource } from './learning-source-baseline.mjs';
// 생성 HTML과 선정 JPG·원문·실측·미실행 모델의 연결을 검사한다.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { JSDOM } from 'jsdom';
import { rasterDimensions } from './raster-size.mjs';
import { D07_ASSETS, D07_LESSONS, D07_RUNS, d07Run } from './d07-lesson-data.mjs';

const root = new URL('../../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
const json = path => JSON.parse(read(path));
const design = 'docs/design/d07-2026-10-21/';
const proof = design + 'source-proof/';
const historicalBase = json(design + 'html-baseline.json');
const base = loadSourceBaseline(root, design + 'html-baseline.json');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
assert.equal(hash(read('docs/knowledge/D07-onprem-vs-cloud.md')), base.sourceSHA256);
assert.equal(base.code.length, 4);
assert.equal(base.mermaid.length, 4);
assert.equal(base.ids.length, 24);
assert.equal(base.oldVisual.length, 1);
assert.equal(json(proof + 'source.json').lines, 300);
assert.equal(historicalBase.wholeSourceText.length, 14250, '과거 원문 기준 길이는 역사 증거로 유지');
assert.equal(historicalBase.withoutMermaidText.length, 13022, '과거 Mermaid 제외 길이는 역사 증거로 유지');

// main의 원문 wrapper·기존 지도 보존과 실제 생성 HTML을 검사한다.
const page = new JSDOM(read('docs/knowledge/D07-onprem-vs-cloud.html'), {
  runScripts: 'outside-only', url: 'https://learn.example/docs/knowledge/D07-onprem-vs-cloud.html',
});
const d = page.window.document;
const source = d.querySelector('#d07-original');
assert.ok(source, '원문 전체 wrapper');
const clone = source.cloneNode(true);
assert.ok(clone.querySelector(':scope>summary'));
clone.querySelector(':scope>summary').remove();
clone.querySelectorAll('script').forEach(node => node.remove());
const normalized = node => (d.querySelector('main>h1, h1.kr-source-title').textContent + ' ' + node.textContent).replace(/\s+/g, ' ').trim();
assert.equal(normalized(clone), base.wholeSourceText);
assert.deepEqual([...source.querySelectorAll('pre code')].map(node => node.textContent), base.code);
assert.deepEqual([...source.querySelectorAll('.mermaid')].map(node => node.textContent), base.mermaid);
clone.querySelectorAll('.mermaid').forEach(node => node.remove());
assert.equal(normalized(clone), base.withoutMermaidText);
for (const id of base.ids) assert.ok(d.getElementById(id), id);
assert.deepEqual([...d.querySelectorAll('.d07-legacy>.knowledge-page-map')].map(node => node.outerHTML), base.oldVisual);
const ids = [...d.querySelectorAll('[id]')].map(node => node.id);
assert.equal(ids.length, new Set(ids).size, '중복 id 없음');

const selected = json(design + 'image-records.json').images.filter(image => image.selected);
assert.equal(selected.length, 13);
assert.equal(Object.keys(D07_ASSETS).length, 13);
assert.equal(new Set(Object.values(D07_ASSETS).map(asset => asset.file)).size, 13);
for (const asset of Object.values(D07_ASSETS)) {
  assert.equal(asset.ready, true);
  assert.ok(asset.file.endsWith('.jpg'));
  const raw = fs.readFileSync(new URL(design + 'images/' + asset.file, root));
  const size = rasterDimensions(raw);
  assert.equal(size.format, 'jpeg', asset.file + ' 실제 JPEG header');
  assert.equal(asset.width, size.width);
  assert.equal(asset.height, size.height);
  assert.ok(selected.some(image => image.destination.endsWith('/' + asset.file) && image.sha256 === hash(raw)), asset.file + ' 선정 metadata SHA');
}
assert.equal(D07_LESSONS.length, 13);
const stages = D07_LESSONS.flatMap(lesson => lesson.stages);
assert.equal(stages.length, 36);
assert.equal(new Set(stages.map(stage => stage.id)).size, 36);
for (const stage of stages) {
  const region = D07_ASSETS[stage.image].focus[stage.id];
  assert.ok(Array.isArray(region) && region.length === 4, stage.id + ' 실제 focus');
  assert.ok(region.every(n => Number.isFinite(n) && n >= 0));
  assert.ok(region[2] > 0 && region[3] > 0 && region[0] + region[2] <= 100 && region[1] + region[3] <= 100);
}

assert.ok(d.querySelector('script[src*="d07-learning.bundle.js"]'));
page.window.eval(read('tools/site/d07-learning.bundle.js'));
const ui = d.querySelector('[data-d07-learning]');
assert.ok(ui?.querySelector('[data-d07-topic]'));
for (const lesson of D07_LESSONS) {
  const topic = ui.querySelector('[data-d07-topic]');
  topic.value = lesson.id;
  topic.dispatchEvent(new page.window.Event('change'));
  for (const stage of lesson.stages) {
    ui.querySelector(`[data-d07-stage="${stage.id}"]`).click();
    assert.equal(ui.querySelector('[data-d07-code]').textContent, stage.code);
    assert.deepEqual([...ui.querySelectorAll('[data-d07-code] mark')].map(node => node.textContent), stage.active.map(index => stage.code.split('\n')[index]));
    assert.equal(ui.querySelector('[data-d07-title]').textContent, stage.title);
    assert.equal(ui.querySelector('[data-d07-lead]').textContent, stage.lead);
    assert.equal(ui.querySelector('[data-d07-code-kind]').textContent, stage.codeKind === 'model-json' ? '미실행 모델 JSON · 분류 근거' : stage.codeKind === 'unrun-source' ? '미실행 원문 Dockerfile·명령 발췌' : '원문·추가 빌드 관찰기 실제 발췌');
    for (const [label, value] of stage.values) {
      const term = [...ui.querySelectorAll('[data-d07-state] dt')].find(node => node.textContent === label);
      assert.ok(term, label);
      assert.equal(term.nextElementSibling.textContent, value);
    }
    for (const selector of ['[data-d07-state]', '[data-d07-code]', '[data-d07-source-note]']) assert.equal(ui.querySelector(selector).closest('details'), null);
    assert.equal(ui.querySelector('[data-d07-output]').open, false);
    assert.equal(ui.querySelector('[data-d07-stdout]').textContent, stage.checks.map(check => 'PASS ' + check).join('\n'));
    if (!stage.checks.length) assert.equal(ui.querySelector('[data-d07-stdout]').parentElement.hidden, true);
    for (const key of stage.runKeys) assert.ok(ui.querySelector('[data-d07-runs]').textContent.includes(JSON.stringify(d07Run(key), null, 2)), key);
    const asset = D07_ASSETS[stage.image];
    assert.equal(ui.querySelector('[data-d07-image]').getAttribute('src'), '../design/d07-2026-10-21/images/' + asset.file);
  }
}

const actual = json(proof + 'execution.json');
assert.deepEqual(D07_RUNS, actual);
assert.deepEqual(actual, json(proof + 'checkpoints/expected-execution.json'));
assert.deepEqual(actual.models, json(proof + 'models.json'));
assert.equal(actual.checks.length, 10);
assert.equal(new Set(actual.checks).size, 10);
assert.equal(Object.keys(actual.facts).length, 10);
assert.equal(Object.keys(actual.models).length, 6);
assert.ok(Object.values(actual.models).every(model => model.executed === false));
assert.deepEqual([...new Set(stages.flatMap(stage => stage.checks))].sort(), [...actual.checks].sort());
assert.equal(stages.filter(stage => stage.checks.length).length, 8);
const modelStages = stages.filter(stage => !stage.checks.length);
assert.equal(modelStages.length, 28);
for (const stage of modelStages) {
  assert.ok(stage.runKeys.every(key => key.startsWith('models.')));
  if (stage.codeKind === 'model-json') {
    let expected = d07Run(stage.codePath);
    if (stage.codeKeys) expected = Object.fromEntries(stage.codeKeys.map(key => [key, expected[key]]));
    assert.deepEqual(JSON.parse(stage.code), expected);
  } else assert.equal(stage.codeKind, 'unrun-source');
}
assert.ok(stages.filter(stage => stage.active.some(index => index > 0)).length >= 25);
const facts = actual.facts;
assert.equal(facts['source-bodies-preserved-java25-container-unrun'].javaByteExact, true);
assert.equal(facts['source-bodies-preserved-java25-container-unrun'].originalJava25Executed, false);
assert.equal(facts['pinned-runtime-artifacts-and-sha'].artifacts, 39);
assert.deepEqual(Object.values(facts['original-java-compiled-on-added-target21'].compiledSourceClasses), [65, 65]);
assert.equal(facts['executable-jar-keeps-original-compiled-classes'].bytes, 19902934);
assert.equal(facts['executable-jar-keeps-original-compiled-classes'].nestedLibraries, 34);
assert.equal(facts['two-own-local-http-processes-not-two-azs'].explicitProfileSelected, false);
assert.equal(facts['literal-health-is-not-actuator-or-db-diagnosis'].actuatorHealthStatus, 404);
assert.equal(facts['literal-health-is-not-actuator-or-db-diagnosis'].actuatorDependencyPresent, false);
assert.equal(facts['stopping-one-local-process-leaves-other-answering'].bHealthStatus, 200);
assert.deepEqual(facts['all-own-http-processes-and-ports-closed'].exitCodes, [143, 143]);
const dependencies = json(proof + 'dependencies.json');
assert.equal(dependencies.length, 39);
for (const row of dependencies) assert.equal(hash(fs.readFileSync(row.file)), row.sha256);
const fixture = json(proof + 'fixture-files.json');
assert.equal(fixture.length, 4);
for (const row of fixture) assert.equal(hash(fs.readFileSync(new URL(proof + row.file, root))), row.sha256);
assert.equal(read(proof + 'original/block-04.java'), read(proof + 'fixture/java/com/example/demo/DemoApplication.java'));
assert.equal(read(proof + 'original/block-06.Dockerfile'), read(proof + 'fixture/Dockerfile'));
const raw = json(proof + 'runtime-last.json');
assert.equal(raw.completed, true);
assert.equal(raw.apps.length, 2);
assert.ok(raw.apps.every(app => app.exitCode === 143 && app.pidGone && app.portClosed && !app.killFallback));
assert.ok(raw.commands.every(command => command.exitCode === 0));
assert.deepEqual(raw.requests.map(request => request.status), [200, 200, 404, 200]);
const unmapped = raw.requests.find(request => request.label === 'a-actuator-unconfigured');
assert.equal(unmapped.headers['Content-Type'], 'application/json');
assert.deepEqual(Object.keys(JSON.parse(unmapped.bodyText)).sort(), ['error', 'path', 'status', 'timestamp']);
const independent = json(proof + 'independent-replay.json');
assert.equal(independent.execution.exitCode, 0);
assert.equal(independent.execution.freeze, false);
assert.equal(independent.execution.checks, 10);
assert.equal(independent.execution.models, 6);
assert.equal(independent.execution.allModelsExecutedFalse, true);
assert.equal(independent.execution.wholeCopiedExpectedMatch, true);
assert.equal(independent.execution.wholeCurrentSharedExpectedMatch, true);
assert.equal(independent.execution.wholeCurrentSharedExecutionMatch, true);
assert.equal(independent.preservation.fixtureFiles, 4);
assert.equal(independent.preservation.fixtureJavaByteExactOriginal, true);
assert.equal(independent.preservation.fixtureDockerfileByteExactOriginal, true);
assert.equal(independent.artifacts.dependencies, 39);
assert.equal(independent.artifacts.jar.nestedLibraries, 34);
assert.equal(independent.artifacts.jar.bytes, 19902934);
assert.equal(independent.artifacts.jar.sha256, facts['executable-jar-keeps-original-compiled-classes'].sha256);
assert.equal(independent.cleanup.twoOwnPidGone, true);
assert.equal(independent.cleanup.twoOwnPortsClosed, true);
assert.equal(independent.cleanup.killFallbackUsed, false);

const supplement = d.querySelector('.d07-supplement');
assert.ok(supplement && !source.contains(supplement));
assert.equal(supplement.open, false);
assert.ok([...supplement.querySelectorAll('details')].every(node => !node.open));
for (const phrase of ['D07에는 원문 Java가 있습니다', 'Java21.0.6', 'CHECK10', '모델6', 'fixture4', 'dependency39', 'lib34', 'application/json', 'SIGTERM143', '기본 HTTP 프로브', 'general purpose bucket', 'directory bucket', 'List API', 'SaaS', 'Darwin', 'TCO', 'Relocate', '전수 pixel parity']) assert.ok(supplement.textContent.includes(phrase), phrase);
const fullCode = [...supplement.querySelectorAll('pre code')].map(node => node.textContent);
for (const file of ['source-proof/source.json', 'source-proof/execution.json', 'source-proof/models.json', 'source-proof/checkpoints/expected-execution.json', 'source-proof/independent-replay.json', 'research/main-verification.json', 'source-proof/runtime-last.json', 'source-proof/dependencies.json', 'source-proof/fixture-files.json']) {
  assert.ok(fullCode.some(code => { try { return JSON.stringify(JSON.parse(code)) === JSON.stringify(json(design + file)); } catch { return false; } }), file + ' 전체 JSON 보존');
}
assert.ok(fullCode.includes(readHistoricalSource(root, 'docs/knowledge/D07-onprem-vs-cloud.md')), '실행 당시 전체 Markdown 원문');
for (const file of json(proof + 'source.json').originalBlocks) assert.ok(fullCode.includes(read(proof + 'original/' + file.file)), file.file + ' 원문8block 보존');
for (const file of fixture) assert.ok(fullCode.includes(read(proof + file.file)), file.file + ' fixture4 전체 보존');
for (const file of ['source-proof/run-proof.py', 'source-proof/replay.log']) assert.ok(fullCode.includes(read(design + file)), file + ' 전체 관찰기/로그 보존');
page.window.close();
console.log('D07 생성HTML: 원문14250/도표제외13022자·code4/Mermaid4/id24/map1·36상태(native8/model28)·선정13JPEG·10CHECK6모델·원문Java/4fixture/fullraw 경계 보존 통과');
