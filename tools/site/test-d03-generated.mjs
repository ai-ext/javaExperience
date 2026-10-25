import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { JSDOM } from 'jsdom';
import { rasterDimensions } from './raster-size.mjs';
import { D03_ASSETS, D03_LESSONS, D03_RUNS, d03Run } from './d03-lesson-data.mjs';

const root = new URL('../../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
const json = path => JSON.parse(read(path));
const design = 'docs/design/d03-2026-10-20/';
const proof = design + 'source-proof/';
const base = json(design + 'html-baseline.json');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
assert.equal(hash(read('docs/knowledge/D03-rest-api-dev-process.md')), base.sourceSHA256);
assert.equal(base.code.length, 3);
assert.equal(base.mermaid.length, 3);
assert.equal(base.ids.length, 22);
assert.equal(base.oldVisual.length, 1);
assert.equal(json(proof + 'source.json').lines, 332);

// main의 원문 wrapper·기존 지도 보존과 실제 생성 HTML을 검사한다.
const page = new JSDOM(read('docs/knowledge/D03-rest-api-dev-process.html'), {
  runScripts: 'outside-only', url: 'https://learn.example/docs/knowledge/D03-rest-api-dev-process.html',
});
const d = page.window.document;
const source = d.querySelector('#d03-original');
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
assert.deepEqual([...d.querySelectorAll('.d03-legacy>.knowledge-page-map')].map(node => node.outerHTML), base.oldVisual);
const ids = [...d.querySelectorAll('[id]')].map(node => node.id);
assert.equal(ids.length, new Set(ids).size, '중복 id 없음');

const expectedFiles = ['create-v3.jpg', 'validation-v2.jpg', 'conversion-v2.jpg', 'routing-v2.jpg', 'problem-v3.jpg', 'openapi-v4.jpg', 'swagger-v3.jpg', 'consumer-v2.jpg', 'memory-v2.jpg', 'delivery.jpg'];
const selected = json(design + 'image-records.json').images.filter(image => image.selected);
assert.equal(selected.length, 10);
assert.equal(Object.keys(D03_ASSETS).length, 10);
assert.deepEqual(new Set(Object.values(D03_ASSETS).map(asset => asset.file)), new Set(expectedFiles));
for (const asset of Object.values(D03_ASSETS)) {
  assert.equal(asset.ready, true);
  const raw = fs.readFileSync(new URL(design + 'images/' + asset.file, root));
  const size = rasterDimensions(raw);
  assert.equal(size.format, 'jpeg', asset.file + ' 실제 JPEG header');
  assert.equal(asset.width, size.width);
  assert.equal(asset.height, size.height);
  assert.ok(selected.some(image => image.destination.endsWith('/' + asset.file) && image.sha256 === hash(raw)), asset.file + ' 선정 metadata SHA');
}
assert.equal(D03_LESSONS.length, 10);
const stages = D03_LESSONS.flatMap(lesson => lesson.stages);
assert.equal(stages.length, 27);
assert.equal(new Set(stages.map(stage => stage.id)).size, 27);
for (const stage of stages) {
  const region = D03_ASSETS[stage.image].focus[stage.id];
  assert.ok(Array.isArray(region) && region.length === 4, stage.id + ' 실제 focus');
  assert.ok(region.every(n => Number.isFinite(n) && n >= 0));
  assert.ok(region[2] > 0 && region[3] > 0 && region[0] + region[2] <= 100 && region[1] + region[3] <= 100);
}

assert.ok(d.querySelector('script[src*="d03-learning.bundle.js"]'));
page.window.eval(read('tools/site/d03-learning.bundle.js'));
const ui = d.querySelector('[data-d03-learning]');
assert.ok(ui?.querySelector('[data-d03-topic]'));
for (const lesson of D03_LESSONS) {
  const topic = ui.querySelector('[data-d03-topic]');
  topic.value = lesson.id;
  topic.dispatchEvent(new page.window.Event('change'));
  for (const stage of lesson.stages) {
    ui.querySelector(`[data-d03-stage="${stage.id}"]`).click();
    assert.equal(ui.querySelector('[data-d03-code]').textContent, stage.code);
    assert.equal(ui.querySelector('[data-d03-title]').textContent, stage.title);
    assert.equal(ui.querySelector('[data-d03-lead]').textContent, stage.lead);
    for (const [label, value] of stage.values) {
      const term = [...ui.querySelectorAll('[data-d03-state] dt')].find(node => node.textContent === label);
      assert.ok(term, label);
      assert.equal(term.nextElementSibling.textContent, value);
    }
    for (const selector of ['[data-d03-state]', '[data-d03-code]', '[data-d03-source-note]']) assert.equal(ui.querySelector(selector).closest('details'), null);
    assert.equal(ui.querySelector('[data-d03-output]').open, false);
    assert.equal(ui.querySelector('[data-d03-stdout]').textContent, stage.checks.map(check => 'PASS ' + check).join('\n'));
    if (!stage.checks.length) assert.equal(ui.querySelector('[data-d03-stdout]').parentElement.hidden, true);
    for (const key of stage.runKeys) assert.ok(ui.querySelector('[data-d03-runs]').textContent.includes(JSON.stringify(d03Run(key), null, 2)), key);
    const asset = D03_ASSETS[stage.image];
    assert.equal(ui.querySelector('[data-d03-image]').getAttribute('src'), '../design/d03-2026-10-20/images/' + asset.file);
  }
}

const actual = json(proof + 'execution.json');
assert.deepEqual(D03_RUNS, actual);
assert.deepEqual(actual, json(proof + 'checkpoints/expected-execution.json'));
assert.equal(actual.checks.length, 19);
assert.equal(new Set(actual.checks).size, 19);
assert.equal(Object.keys(actual.models).length, 3);
assert.deepEqual([...new Set(stages.flatMap(stage => stage.checks))].sort(), actual.checks);
for (const stage of stages.filter(stage => stage.id === 'create-semantics' || /^(consumer|delivery)-/.test(stage.id))) {
  assert.deepEqual(stage.checks, []);
  assert.ok(stage.runKeys.every(key => key.startsWith('models.')));
}
assert.equal(actual.facts['actual-openapi-status-compared-to-runtime'].statusMismatch, true);
assert.equal(actual.facts['actual-openapi-status-compared-to-runtime'].documentsActual201, false);
assert.equal(actual.facts['actual-openapi-minlength-is-not-notblank-policy'].lengthPredicatePasses, true);
assert.equal(actual.facts['actual-openapi-minlength-is-not-notblank-policy'].actualBlankRequestStatus, 400);
assert.equal(json(proof + 'dependencies.json').length, 60);
assert.equal(json(proof + 'fixture-files.json').length, 4);
assert.equal(json(proof + 'runtime-last.json').requests.length, 18);
assert.deepEqual(actual.facts['private-boot-processes-and-ports-closed'], { processesEnded: 2, portsClosed: 2, scope: 'only own subprocesses; existing user services unchanged' });
const independent = json(proof + 'independent-replay.json');
assert.equal(independent.wholeFrozenMatch, true);
for (const [key, value] of Object.entries({ checks: 19, models: 3, actualHTTPRequests: 18, dependencySHA: 60, fixtureSHA: 4, ownBootProcessesEnded: 2, ownPortsClosed: 2 })) assert.equal(independent[key], value);
assert.ok(Object.values(independent.unresolved).every(value => value === 0));

const supplement = d.querySelector('.d03-supplement');
assert.ok(supplement && !source.contains(supplement));
assert.equal(supplement.open, false);
assert.ok([...supplement.querySelectorAll('details')].every(node => !node.open));
for (const phrase of ['Java21', 'Java25/8080', 'CHECK19', '모델3', '의존성60', 'fixture4', '18 HTTP', '프로세스2개', 'JUnit/WebMvcTest', '인증/인가', '계약 일치', 'JSON Schema', '실제 배포']) assert.ok(supplement.textContent.includes(phrase), phrase);
const fullCode = [...supplement.querySelectorAll('pre code')].map(node => node.textContent);
for (const file of ['source-proof/source.json', 'source-proof/execution.json', 'source-proof/independent-replay.json', 'research/main-verification.json', 'source-proof/runtime-last.json']) {
  assert.ok(fullCode.some(code => { try { return JSON.stringify(JSON.parse(code)) === JSON.stringify(json(design + file)); } catch { return false; } }), file + ' 전체 JSON 보존');
}
for (const file of ['source-proof/fixture/java/example/tasks/TaskExample.java', 'source-proof/fixture/java/example/tasks/TasksApplication.java', 'source-proof/fixture/build.gradle', 'source-proof/run-proof.py']) assert.ok(fullCode.includes(read(design + file)), file + ' 전체 소스 보존');
page.window.close();
console.log(`D03 생성HTML: 원문${base.wholeSourceText.length}자/code3/Mermaid3/id22/map1·27상태·선정10JPG 실제크기/SHA·19CHECK/3모델·추가 전체근거 보존 통과`);
