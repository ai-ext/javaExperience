import { resolveEvidencePath } from './evidence-path.mjs';
// 생성 HTML·선정 JPG·원문·native 경계를 실제 산출물과 대조하는 계약 검사다.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { JSDOM } from 'jsdom';
import { rasterDimensions } from './raster-size.mjs';
import { D05_ASSETS, D05_LESSONS, D05_RUNS, d05Run } from './d05-lesson-data.mjs';

const root = new URL('../../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
const json = path => JSON.parse(read(path));
const design = 'docs/design/d05-2026-10-21/';
const proof = design + 'source-proof/';
const base = json(design + 'html-baseline.json');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
assert.equal(hash(read('docs/knowledge/D05-debugging-methodology.md')), base.sourceSHA256);
assert.equal(base.code.length, 6);
assert.equal(base.mermaid.length, 3);
assert.equal(base.ids.length, 16);
assert.equal(base.oldVisual.length, 1);
assert.equal(json(proof + 'source.json').lines, 343);
assert.equal(base.wholeSourceText.length, 13876);
assert.equal(base.withoutMermaidText.length, 12865);

// main의 원문 wrapper·기존 지도 보존과 실제 생성 HTML을 검사한다.
const page = new JSDOM(read('docs/knowledge/D05-debugging-methodology.html'), {
  runScripts: 'outside-only', url: 'https://learn.example/docs/knowledge/D05-debugging-methodology.html',
});
const d = page.window.document;
const source = d.querySelector('#d05-original');
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
assert.deepEqual([...d.querySelectorAll('.d05-legacy>.knowledge-page-map')].map(node => node.outerHTML), base.oldVisual);
const ids = [...d.querySelectorAll('[id]')].map(node => node.id);
assert.equal(ids.length, new Set(ids).size, '중복 id 없음');

const selected = json(design + 'image-records.json').images.filter(image => image.selected);
assert.equal(selected.length, 11);
assert.equal(Object.keys(D05_ASSETS).length, 11);
assert.equal(new Set(Object.values(D05_ASSETS).map(asset => asset.file)).size, 11);
for (const asset of Object.values(D05_ASSETS)) {
  assert.equal(asset.ready, true);
  assert.ok(asset.file.endsWith('.jpg'));
  const raw = fs.readFileSync(new URL(design + 'images/' + asset.file, root));
  const size = rasterDimensions(raw);
  assert.equal(size.format, 'jpeg', asset.file + ' 실제 JPEG header');
  assert.equal(asset.width, size.width);
  assert.equal(asset.height, size.height);
  assert.ok(selected.some(image => image.destination.endsWith('/' + asset.file) && image.sha256 === hash(raw)), asset.file + ' 선정 metadata SHA');
}
assert.equal(D05_LESSONS.length, 11);
const stages = D05_LESSONS.flatMap(lesson => lesson.stages);
assert.equal(stages.length, 30);
assert.equal(new Set(stages.map(stage => stage.id)).size, 30);
for (const stage of stages) {
  const region = D05_ASSETS[stage.image].focus[stage.id];
  assert.ok(Array.isArray(region) && region.length === 4, stage.id + ' 실제 focus');
  assert.ok(region.every(n => Number.isFinite(n) && n >= 0));
  assert.ok(region[2] > 0 && region[3] > 0 && region[0] + region[2] <= 100 && region[1] + region[3] <= 100);
}

assert.ok(d.querySelector('script[src*="d05-learning.bundle.js"]'));
page.window.eval(read('tools/site/d05-learning.bundle.js'));
const ui = d.querySelector('[data-d05-learning]');
assert.ok(ui?.querySelector('[data-d05-topic]'));
for (const lesson of D05_LESSONS) {
  const topic = ui.querySelector('[data-d05-topic]');
  topic.value = lesson.id;
  topic.dispatchEvent(new page.window.Event('change'));
  for (const stage of lesson.stages) {
    ui.querySelector(`[data-d05-stage="${stage.id}"]`).click();
    assert.equal(ui.querySelector('[data-d05-code]').textContent, stage.code);
    assert.equal(ui.querySelector('[data-d05-title]').textContent, stage.title);
    assert.equal(ui.querySelector('[data-d05-lead]').textContent, stage.lead);
    for (const [label, value] of stage.values) {
      const term = [...ui.querySelectorAll('[data-d05-state] dt')].find(node => node.textContent === label);
      assert.ok(term, label);
      assert.equal(term.nextElementSibling.textContent, value);
    }
    for (const selector of ['[data-d05-state]', '[data-d05-code]', '[data-d05-source-note]']) assert.equal(ui.querySelector(selector).closest('details'), null);
    assert.equal(ui.querySelector('[data-d05-output]').open, false);
    assert.equal(ui.querySelector('[data-d05-stdout]').textContent, stage.checks.map(check => 'PASS ' + check).join('\n'));
    if (!stage.checks.length) assert.equal(ui.querySelector('[data-d05-stdout]').parentElement.hidden, true);
    for (const key of stage.runKeys) assert.ok(ui.querySelector('[data-d05-runs]').textContent.includes(JSON.stringify(d05Run(key), null, 2)), key);
    const asset = D05_ASSETS[stage.image];
    assert.equal(ui.querySelector('[data-d05-image]').getAttribute('src'), '../design/d05-2026-10-21/images/' + asset.file);
  }
}

const actual = json(proof + 'execution.json');
assert.deepEqual(D05_RUNS, actual);
assert.deepEqual(actual, json(proof + 'checkpoints/expected-execution.json'));
assert.equal(actual.checks.length, 23);
assert.equal(new Set(actual.checks).size, 23);
assert.equal(Object.keys(actual.facts).length, 23);
assert.equal(Object.keys(actual.models).length, 3);
assert.deepEqual([...new Set(stages.flatMap(stage => stage.checks))].sort(), [...actual.checks].sort());
for (const stage of stages.filter(stage => /^(hypothesis|boundaries)-/.test(stage.id))) {
  assert.deepEqual(stage.checks, []);
  assert.ok(stage.runKeys.every(key => key.startsWith('models.')));
  assert.ok(['D05-hypothesis', 'D05-boundaries'].includes(stage.image));
}
const facts = actual.facts;
assert.equal(facts['original-source-preserved-added-java21'].originalJavaBytesPreserved, true);
assert.equal(facts['original-source-preserved-added-java21'].sourceExecutedAtJava25, false);
assert.equal(facts['resolved-runtime-and-test-artifacts'].artifactCount, 47);
assert.equal(facts['source-exception-cause-and-first-app-frame'].dbCall, false);
assert.equal(facts['http-error-body-is-not-raw-server-stack'].exceptionClassInBody, false);
assert.equal(facts['stack-common-frames-are-elided'].elidedCommonFrames, 2);
assert.equal(facts['try-with-resources-suppressed-is-not-cause'].cause, null);
assert.equal(facts['actual-jdb-evaluation-changes-target-state'].counterAfter, 1);
assert.equal(facts['actual-jdb-step-into-out-over'].firstNextBeforeResultAssignmentLine, 12);
assert.equal(facts['actual-jdb-step-into-out-over'].secondNextAfterAssignmentLine, 13);
assert.equal(facts['evaluation-changes-later-observed-result'].withoutDebuggerEvaluation, 26);
assert.equal(facts['evaluation-changes-later-observed-result'].afterBumpEvaluation, 27);
assert.deepEqual(facts['private-git-bisect-finds-controlled-first-bad'].actualPredicateRuns, [{ commit: 'C4', exit: 1 }, { commit: 'C3', exit: 0 }]);
const dependencies = json(proof + 'dependencies.json');
assert.equal(dependencies.length, 47);
for (const row of dependencies) assert.equal(hash(fs.readFileSync(resolveEvidencePath(row.file))), row.sha256);
const fixture = json(proof + 'fixture-files.json');
assert.equal(fixture.length, 9);
for (const row of fixture) assert.equal(hash(fs.readFileSync(new URL(proof + row.file, root))), row.sha256);
assert.equal(read(proof + 'original/block-05.java'), read(proof + 'fixture/java/com/example/debuglab/DebugLabApplication.java'));
assert.equal(read(proof + 'original/block-06.properties'), read(proof + 'fixture/resources/application.properties'));
const raw = json(proof + 'runtime-last.json');
assert.deepEqual(raw.http.map(row => row.status), [200, 200, 500, 500, 400, 404]);
assert.ok(raw.interactive.jdb.sent.includes('eval example.debug.DebugTarget.bump()'));
assert.equal(raw.interactive.jdb.sent.filter(command => command === 'next').length, 2);
assert.equal(raw.commands.find(command => command.name === 'mutant-regression').exitCode, 1);
const independent = json(proof + 'independent-replay.json');
assert.equal(independent.runnerExitCode, 0);
assert.equal(independent.freezeUsed, false);
assert.equal(independent.comparison.checks, 23);
assert.equal(independent.comparison.models, 3);
assert.equal(independent.comparison.wholePerRunActualVersusCopiedFrozenMatch, true);
assert.equal(independent.comparison.wholeCurrentSharedExecutionAndFrozenMatch, true);
assert.equal(independent.preservation.fixtureFiles, 9);
assert.equal(independent.preservation.allOriginalBodiesByteExact, true);
assert.equal(independent.dependencies.runtimeAndTestArtifacts, 47);
assert.equal(independent.cleanup.allFiveTrackedPIDsGone, true);
assert.ok(independent.cleanup.ports.every(port => port.closed));
for (const key of ['criticalFindings', 'importantFindings', 'minorFindings']) assert.equal(independent[key], 0);

const supplement = d.querySelector('.d05-supplement');
assert.ok(supplement && !source.contains(supplement));
assert.equal(supplement.open, false);
assert.ok([...supplement.querySelectorAll('details')].every(node => !node.open));
for (const phrase of ['Java25/8080', 'Java21.0.6', 'CHECK23', '모델3', 'fixture9', '47개', '가상', '공통2 frame', 'Resource', 'line12', '대입 전', 'line13', 'exit143', 'C4 exit1', 'C3 exit0', 'IDE', 'Kubernetes', '전수 pixel parity']) assert.ok(supplement.textContent.includes(phrase), phrase);
const fullCode = [...supplement.querySelectorAll('pre code')].map(node => node.textContent);
for (const file of ['source-proof/source.json', 'source-proof/execution.json', 'source-proof/checkpoints/expected-execution.json', 'source-proof/independent-replay.json', 'research/main-verification.json', 'source-proof/runtime-last.json', 'source-proof/attempt-notes.json', 'source-proof/dependencies.json', 'source-proof/fixture-files.json']) {
  assert.ok(fullCode.some(code => { try { return JSON.stringify(JSON.parse(code)) === JSON.stringify(json(design + file)); } catch { return false; } }), file + ' 전체 JSON 보존');
}
assert.ok(fullCode.includes(read('docs/knowledge/D05-debugging-methodology.md')), '전체 Markdown 원문');
for (const file of json(proof + 'source.json').originalBlocks) assert.ok(fullCode.includes(read(proof + 'original/' + file.file)), file.file + ' 원문9block 보존');
for (const file of fixture) assert.ok(fullCode.includes(read(proof + file.file)), file.file + ' fixture9 전체 보존');
for (const file of ['source-proof/run-proof.py', 'source-proof/attempt-01-jdb.log', 'source-proof/jdb-local-help.txt', 'source-proof/replay.log']) assert.ok(fullCode.includes(read(design + file)), file + ' 전체 관찰기/로그 보존');
page.window.close();
console.log('D05 생성HTML: 원문13876/도표제외12865자·code6/Mermaid3/id16/map1·30상태·선정11JPEG 실제크기/SHA·23CHECK/3모델·원문9block/fixture9/fullraw 경계 보존 통과');
