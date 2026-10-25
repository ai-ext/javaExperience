import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { JSDOM } from 'jsdom';
import { rasterDimensions } from './raster-size.mjs';
import { D04_ASSETS, D04_LESSONS, D04_RUNS, d04Run } from './d04-lesson-data.mjs';

const root = new URL('../../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
const json = path => JSON.parse(read(path));
const design = 'docs/design/d04-2026-10-21/';
const proof = design + 'source-proof/';
const base = json(design + 'html-baseline.json');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
assert.equal(hash(read('docs/knowledge/D04-build-pipeline-explained.md')), base.sourceSHA256);
assert.equal(base.code.length, 5);
assert.equal(base.mermaid.length, 4);
assert.equal(base.ids.length, 21);
assert.equal(base.oldVisual.length, 1);
assert.equal(json(proof + 'source.json').lines, 325);
assert.equal(base.wholeSourceText.length, 13435);
assert.equal(base.withoutMermaidText.length, 12289);

// main의 원문 wrapper·기존 지도 보존과 실제 생성 HTML을 검사한다.
const page = new JSDOM(read('docs/knowledge/D04-build-pipeline-explained.html'), {
  runScripts: 'outside-only', url: 'https://learn.example/docs/knowledge/D04-build-pipeline-explained.html',
});
const d = page.window.document;
const source = d.querySelector('#d04-original');
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
assert.deepEqual([...d.querySelectorAll('.d04-legacy>.knowledge-page-map')].map(node => node.outerHTML), base.oldVisual);
const ids = [...d.querySelectorAll('[id]')].map(node => node.id);
assert.equal(ids.length, new Set(ids).size, '중복 id 없음');

const selected = json(design + 'image-records.json').images.filter(image => image.selected);
assert.equal(selected.length, 11);
assert.equal(Object.keys(D04_ASSETS).length, 11);
assert.equal(new Set(Object.values(D04_ASSETS).map(asset => asset.file)).size, 11);
for (const asset of Object.values(D04_ASSETS)) {
  assert.equal(asset.ready, true);
  assert.ok(asset.file.endsWith('.jpg'));
  const raw = fs.readFileSync(new URL(design + 'images/' + asset.file, root));
  const size = rasterDimensions(raw);
  assert.equal(size.format, 'jpeg', asset.file + ' 실제 JPEG header');
  assert.equal(asset.width, size.width);
  assert.equal(asset.height, size.height);
  assert.ok(selected.some(image => image.destination.endsWith('/' + asset.file) && image.sha256 === hash(raw)), asset.file + ' 선정 metadata SHA');
}
assert.equal(D04_LESSONS.length, 11);
const stages = D04_LESSONS.flatMap(lesson => lesson.stages);
assert.equal(stages.length, 29);
assert.equal(new Set(stages.map(stage => stage.id)).size, 29);
for (const stage of stages) {
  const region = D04_ASSETS[stage.image].focus[stage.id];
  assert.ok(Array.isArray(region) && region.length === 4, stage.id + ' 실제 focus');
  assert.ok(region.every(n => Number.isFinite(n) && n >= 0));
  assert.ok(region[2] > 0 && region[3] > 0 && region[0] + region[2] <= 100 && region[1] + region[3] <= 100);
}

assert.ok(d.querySelector('script[src*="d04-learning.bundle.js"]'));
page.window.eval(read('tools/site/d04-learning.bundle.js'));
const ui = d.querySelector('[data-d04-learning]');
assert.match(ui.querySelector('.d04-order-note').textContent,/§1 L23.*§3\.4 L108.*고정 실행 순서가 아닙니다/);ui.querySelector('[data-d04-jump-stage="graph-branches"]').click();assert.equal(ui.dataset.topic,'graph');assert.equal(ui.dataset.stage,'graph-branches');ui.querySelector('[data-d04-jump-stage="assemble-boundary"]').click();assert.equal(ui.dataset.topic,'assemble');assert.equal(ui.dataset.stage,'assemble-boundary');
assert.ok(ui?.querySelector('[data-d04-topic]'));
for (const lesson of D04_LESSONS) {
  const topic = ui.querySelector('[data-d04-topic]');
  topic.value = lesson.id;
  topic.dispatchEvent(new page.window.Event('change'));
  for (const stage of lesson.stages) {
    ui.querySelector(`[data-d04-stage="${stage.id}"]`).click();
    assert.equal(ui.querySelector('[data-d04-code]').textContent, stage.code);
    assert.equal(ui.querySelector('[data-d04-title]').textContent, stage.title);
    assert.equal(ui.querySelector('[data-d04-lead]').textContent, stage.lead);
    for (const [label, value] of stage.values) {
      const term = [...ui.querySelectorAll('[data-d04-state] dt')].find(node => node.textContent === label);
      assert.ok(term, label);
      assert.equal(term.nextElementSibling.textContent, value);
    }
    for (const selector of ['[data-d04-state]', '[data-d04-code]', '[data-d04-source-note]']) assert.equal(ui.querySelector(selector).closest('details'), null);
    assert.equal(ui.querySelector('[data-d04-output]').open, false);
    assert.equal(ui.querySelector('[data-d04-stdout]').textContent, stage.checks.map(check => 'PASS ' + check).join('\n'));
    if (!stage.checks.length) assert.equal(ui.querySelector('[data-d04-stdout]').parentElement.hidden, true);
    for (const key of stage.runKeys) assert.ok(ui.querySelector('[data-d04-runs]').textContent.includes(JSON.stringify(d04Run(key), null, 2)), key);
    const asset = D04_ASSETS[stage.image];
    assert.equal(ui.querySelector('[data-d04-image]').getAttribute('src'), '../design/d04-2026-10-21/images/' + asset.file);
  }
}

const actual = json(proof + 'execution.json');
assert.deepEqual(D04_RUNS, actual);
assert.deepEqual(actual, json(proof + 'checkpoints/expected-execution.json'));
assert.equal(actual.checks.length, 21);
assert.equal(new Set(actual.checks).size, 21);
assert.equal(Object.keys(actual.facts).length, 21);
assert.equal(Object.keys(actual.models).length, 3);
assert.deepEqual([...new Set(stages.flatMap(stage => stage.checks))].sort(), actual.checks);
for (const stage of stages.filter(stage => stage.id === 'repro-boundary' || stage.id.startsWith('delivery-'))) {
  assert.deepEqual(stage.checks, []);
  assert.ok(stage.runKeys.every(key => key.startsWith('models.')));
}
assert.equal(stages.find(stage => stage.id === 'repro-boundary').image, 'D04-delivery');
assert.ok(D04_ASSETS['D04-delivery'].focus['repro-boundary']);
assert.equal(D04_ASSETS['D04-repro'].focus['repro-boundary'], undefined);
const facts = actual.facts;
assert.equal(facts['source-java25-preserved-added-java21-runtime'].originalJava, 25);
assert.equal(facts['source-java25-preserved-added-java21-runtime'].addedJava, '21.0.6');
assert.equal(facts['actual-bom-and-transitive-runtime-files'].artifacts, 29);
assert.equal(facts['bootjar-and-plain-jar-have-different-structure'].bootLibraries, 20);
assert.equal(facts['actual-junit-executes-two-tests'].junit, '6.0.3');
assert.equal(facts['actual-junit-executes-two-tests'].tests, 2);
assert.equal(facts['junit-failure-does-not-remove-existing-jar'].failures, 1);
assert.equal(facts['junit-failure-does-not-remove-existing-jar'].existingJarUnchanged, true);
assert.equal(facts['clean-build-can-restore-compile-output-from-private-cache'].test, 'FROM-CACHE');
assert.equal(facts['test-no-source-is-not-two-tests-passed'].junitReportExists, false);
assert.equal(facts['private-verification-mismatch-rejects-unchanged-dependency'].globalDependencyBytesUnchanged, true);
assert.equal(facts['actual-bootjar-launch-loads-resource'].exitCode, 0);
const dependencies = json(proof + 'dependencies.json');
assert.equal(dependencies.length, 29);
for (const row of dependencies) assert.equal(hash(fs.readFileSync(row.file)), row.sha256);
const fixture = json(proof + 'fixture-files.json');
assert.equal(fixture.length, 6);
for (const row of fixture) assert.equal(hash(fs.readFileSync(new URL(proof + row.file, root))), row.sha256);
const originalKotlin = read(proof + 'original/block-05.gradle.kts');
assert.ok(read(proof + 'fixture/build.gradle.kts').includes(originalKotlin.replace('JavaLanguageVersion.of(25)', 'JavaLanguageVersion.of(21)')));
const raw = json(proof + 'runtime-last.json');
assert.deepEqual(raw.completedFacts, actual.facts);
assert.deepEqual([...new Set(raw.completedChecks)].sort(), actual.checks);
assert.equal(raw.initialJarSHA256, facts['two-scoped-clean-builds-have-equal-jar-bytes'].sha256);
const independent = json(proof + 'independent-replay.json');
assert.equal(independent.runnerExitCode, 0);
assert.equal(independent.freezeUsed, false);
assert.equal(independent.comparison.checks, 21);
assert.equal(independent.comparison.models, 3);
assert.equal(independent.comparison.wholeCopiedFrozenMatch, true);
assert.equal(independent.comparison.wholeCurrentSharedExecutionAndFrozenMatch, true);
assert.equal(independent.preservation.fixtureFiles, 6);
assert.equal(independent.preservation.allOriginalBodiesByteExact, true);
assert.equal(independent.dependencies.runtimeAndTestArtifacts, 29);
assert.equal(independent.runtimeEvidence.nonWebJarLauncherExitCode, 0);
assert.equal(independent.runtimeEvidence.junitJupiterAndLauncher, '6.0.3');
assert.equal(independent.runtimeEvidence.jarBytes, 9103378);
assert.equal(independent.runtimeEvidence.jarSHA256, facts['two-scoped-clean-builds-have-equal-jar-bytes'].sha256);
assert.equal(independent.criticalFindings, 0);
assert.equal(independent.importantFindings, 0);
assert.equal(independent.unresolvedMinorFindings, 0);

const supplement = d.querySelector('.d04-supplement');
assert.ok(supplement && !source.contains(supplement));
assert.equal(supplement.open, false);
assert.ok([...supplement.querySelectorAll('details')].every(node => !node.open));
for (const phrase of ['Java25', 'Java21.0.6', 'CHECK21', '모델3', 'fixture6', '해석 파일29', '플러그인 전체', 'lib20', '6.0.3', '중복2메시지', '정상 online', 'global dependency JAR bytes', 'CI runner', 'memory failure', '전수 pixel parity']) assert.ok(supplement.textContent.includes(phrase), phrase);
const fullCode = [...supplement.querySelectorAll('pre code')].map(node => node.textContent);
for (const file of ['source-proof/source.json', 'source-proof/execution.json', 'source-proof/checkpoints/expected-execution.json', 'source-proof/independent-replay.json', 'research/main-verification.json', 'source-proof/runtime-last.json', 'source-proof/attempt-notes.json', 'source-proof/dependencies.json', 'source-proof/fixture-files.json']) {
  assert.ok(fullCode.some(code => { try { return JSON.stringify(JSON.parse(code)) === JSON.stringify(json(design + file)); } catch { return false; } }), file + ' 전체 JSON 보존');
}
assert.ok(fullCode.includes(read('docs/knowledge/D04-build-pipeline-explained.md')), '전체 Markdown 원문');
for (const file of ['source-proof/original/block-05.gradle.kts', 'source-proof/fixture/build.gradle.kts', 'source-proof/fixture/settings.gradle.kts', 'source-proof/fixture/src/main/java/example/build/BuildDemoApplication.java', 'source-proof/fixture/src/main/java/example/build/BuildPolicy.java', 'source-proof/fixture/src/test/java/example/build/BuildPolicyTest.java', 'source-proof/fixture/src/main/resources/lesson.properties', 'source-proof/run-proof.py', 'source-proof/attempt-01-freeze.log', 'source-proof/verification-metadata-online.log', 'source-proof/replay.log']) assert.ok(fullCode.includes(read(design + file)), file + ' 전체 원문/추가 소스·로그 보존');
page.window.close();
console.log('D04 생성HTML: 원문13435/도표제외12289자·code5/Mermaid4/id21/map1·29상태·선정11JPEG 실제크기/SHA·21CHECK/3모델·전체 근거와 모델그림 경계 보존 통과');
