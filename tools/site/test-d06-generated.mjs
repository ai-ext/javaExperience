import { resolveHistoricalAsset } from './learning-source-baseline.mjs';
// 생성 HTML·선정 JPG·원문·native 경계를 실제 산출물과 대조하는 계약 검사다.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { JSDOM } from 'jsdom';
import { rasterDimensions } from './raster-size.mjs';
import { D06_ASSETS, D06_LESSONS, D06_RUNS, d06Run } from './d06-lesson-data.mjs';

const root = new URL('../../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
const json = path => JSON.parse(read(path));
const design = 'docs/design/d06-2026-10-21/';
const proof = design + 'source-proof/';
const base = json(design + 'html-baseline.json');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
assert.equal(hash(read('docs/knowledge/D06-deployment-concepts.md')), base.sourceSHA256);
assert.equal(base.code.length, 5);
assert.equal(base.mermaid.length, 3);
assert.equal(base.ids.length, 20);
assert.equal(base.oldVisual.length, 1);
assert.equal(json(proof + 'source.json').lines, 264);
assert.equal(base.wholeSourceText.length, 14124);
assert.equal(base.withoutMermaidText.length, 13326);

// main의 원문 wrapper·기존 지도 보존과 실제 생성 HTML을 검사한다.
const page = new JSDOM(read('docs/knowledge/D06-deployment-concepts.html'), {
  runScripts: 'outside-only', url: 'https://learn.example/docs/knowledge/D06-deployment-concepts.html',
});
const d = page.window.document;
const source = d.querySelector('#d06-original');
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
assert.deepEqual([...d.querySelectorAll('.d06-legacy>.knowledge-page-map')].map(node => node.outerHTML), base.oldVisual);
const ids = [...d.querySelectorAll('[id]')].map(node => node.id);
assert.equal(ids.length, new Set(ids).size, '중복 id 없음');

const selected = json(design + 'image-records.json').images.filter(image => image.selected);
const corrections = json('docs/design/concept-cycle-2026-10-22/repairs/priority/correction-manifest.json');
const promotionCorrection = corrections.imageCorrections.find(item => item.finding === 'task20.fix1');
assert.equal(selected.length, 13);
assert.equal(Object.keys(D06_ASSETS).length, 13);
assert.equal(new Set(Object.values(D06_ASSETS).map(asset => asset.file)).size, 13);
for (const [assetKey, asset] of Object.entries(D06_ASSETS)) {
  assert.equal(asset.ready, true);
  assert.ok(asset.file.endsWith('.jpg'));
  const raw = fs.readFileSync(new URL(design + 'images/' + asset.file, root));
  const size = rasterDimensions(raw);
  assert.equal(size.format, 'jpeg', asset.file + ' 실제 JPEG header');
  assert.equal(asset.width, size.width);
  assert.equal(asset.height, size.height);
  if (assetKey === 'D06-promotion') {
    const activePromotionUrl = new URL(design + 'images/' + asset.file, root);
    assert.equal(activePromotionUrl.pathname, resolveHistoricalAsset(root, promotionCorrection.targetJPEG), '활성 D06 asset이 승인 target JPEG를 가리켜야 한다');
    assert.equal(promotionCorrection.conversion.targetSHA256, hash(raw), '보정 manifest의 새 asset SHA');
    assert.deepEqual(promotionCorrection.conversion.targetDimensions, {width:1672,height:941});
    assert.equal(promotionCorrection.conversion.quality, 92);
    assert.ok(fs.existsSync(new URL(design + 'images/promotion-v4.jpg', root)), '이전 promotion asset 보존');
  } else {
    assert.ok(selected.some(image => image.destination.endsWith('/' + asset.file) && image.sha256 === hash(raw)), asset.file + ' 선정 metadata SHA');
  }
}
assert.equal(D06_LESSONS.length, 12);
const stages = D06_LESSONS.flatMap(lesson => lesson.stages);
assert.equal(stages.length, 30);
assert.equal(new Set(stages.map(stage => stage.id)).size, 30);
for (const stage of stages) {
  const region = D06_ASSETS[stage.image].focus[stage.id];
  assert.ok(Array.isArray(region) && region.length === 4, stage.id + ' 실제 focus');
  assert.ok(region.every(n => Number.isFinite(n) && n >= 0));
  assert.ok(region[2] > 0 && region[3] > 0 && region[0] + region[2] <= 100 && region[1] + region[3] <= 100);
}

assert.ok(d.querySelector('script[src*="d06-learning.bundle.js"]'));
page.window.eval(read('tools/site/d06-learning.bundle.js'));
const ui = d.querySelector('[data-d06-learning]');
assert.ok(ui?.querySelector('[data-d06-topic]'));
for (const lesson of D06_LESSONS) {
  const topic = ui.querySelector('[data-d06-topic]');
  topic.value = lesson.id;
  topic.dispatchEvent(new page.window.Event('change'));
  for (const stage of lesson.stages) {
    ui.querySelector(`[data-d06-stage="${stage.id}"]`).click();
    assert.equal(ui.querySelector('[data-d06-code]').textContent, stage.code);
    assert.deepEqual([...ui.querySelectorAll('[data-d06-code] mark')].map(node => node.textContent), stage.active.map(index => stage.code.split('\n')[index]));
    assert.equal(ui.querySelector('[data-d06-title]').textContent, stage.title);
    assert.equal(ui.querySelector('[data-d06-lead]').textContent, stage.lead);
    for (const [label, value] of stage.values) {
      const term = [...ui.querySelectorAll('[data-d06-state] dt')].find(node => node.textContent === label);
      assert.ok(term, label);
      assert.equal(term.nextElementSibling.textContent, value);
    }
    for (const selector of ['[data-d06-state]', '[data-d06-code]', '[data-d06-source-note]']) assert.equal(ui.querySelector(selector).closest('details'), null);
    assert.equal(ui.querySelector('[data-d06-output]').open, false);
    assert.equal(ui.querySelector('[data-d06-stdout]').textContent, stage.checks.map(check => 'PASS ' + check).join('\n'));
    if (!stage.checks.length) assert.equal(ui.querySelector('[data-d06-stdout]').parentElement.hidden, true);
    for (const key of stage.runKeys) assert.ok(ui.querySelector('[data-d06-runs]').textContent.includes(JSON.stringify(d06Run(key), null, 2)), key);
    const asset = D06_ASSETS[stage.image];
    assert.equal(ui.querySelector('[data-d06-image]').getAttribute('src'), '../design/d06-2026-10-21/images/' + asset.file);
  }
}

const actual = json(proof + 'execution.json');
assert.deepEqual(D06_RUNS, actual);
assert.deepEqual(actual, json(proof + 'checkpoints/expected-execution.json'));
assert.equal(actual.checks.length, 20);
assert.equal(new Set(actual.checks).size, 20);
assert.equal(Object.keys(actual.facts).length, 20);
assert.equal(Object.keys(actual.models).length, 3);
assert.deepEqual([...new Set(stages.flatMap(stage => stage.checks))].sort(), [...actual.checks].sort());
assert.ok(stages.filter(stage => stage.active.some(index => index > 0)).length >= 12);
const modelStages = stages.filter(stage => /^(strategy|promotion)-/.test(stage.id));
assert.equal(modelStages.length, 5);
for (const stage of modelStages) {
  assert.deepEqual(stage.checks, []);
  assert.ok(stage.runKeys.every(key => key.startsWith('models.')));
  assert.ok(['D06-strategy', 'D06-promotion'].includes(stage.image));
}
const facts = actual.facts;
assert.equal(facts['source-fragments-preserved-added-java21'].originalAppProvided, false);
assert.equal(facts['source-fragments-preserved-added-java21'].originalJava, 25);
assert.equal(facts['actual-executable-jar-preserves-source-yaml'].h2Packaged, false);
assert.equal(facts['external-greeting-source-precedence'].selected, 'from-cli');
assert.equal(facts['deployed-artifact-and-feature-release-differ'].flagOff.status, 404);
assert.equal(facts['deployed-artifact-and-feature-release-differ'].flagOn.status, 200);
assert.equal(facts['health-up-does-not-test-business-success'].businessStatus, 500);
assert.equal(facts['readiness-is-signal-not-direct-request-blocking'].routerGuarded, 503);
assert.equal(facts['readiness-is-signal-not-direct-request-blocking'].routerBypassed, 200);
assert.equal(facts['readiness-restored-without-restarting-app'].appRestarted, false);
assert.deepEqual(facts['toy-route-switch-and-rollback'].statuses, [200, 500, 200]);
assert.equal(facts['finite-scheduled-canary-not-general-error-probability'].requests, 10);
assert.equal(facts['finite-scheduled-canary-not-general-error-probability'].observedFailures, 3);
assert.equal(facts['explicit-timeout-variant-does-not-guarantee-completion'].completed200, false);
assert.equal(facts['separate-memory-schema-expand-keeps-old-query'].oldFullName, 'Ada  Lovelace');
assert.equal(facts['contract-breaks-old-column-query'].oldQuerySqlState, '42S22');
assert.equal(facts['down-ddl-does-not-restore-lossy-data'].originalLength, 13);
assert.equal(facts['down-ddl-does-not-restore-lossy-data'].recreatedLength, 12);
assert.equal(facts['down-ddl-does-not-restore-lossy-data'].originalRestored, false);
assert.deepEqual(facts['all-own-jvms-and-target-ports-closed'].exitCodes, [143, 143, 143, 143, 143, 143]);
const dependencies = json(proof + 'dependencies.json');
assert.equal(dependencies.length, 50);
assert.equal(dependencies.filter(row => row.scope === 'runtimeClasspath').length, 49);
assert.equal(dependencies.filter(row => row.scope === 'proofRuntime').length, 1);
for (const row of dependencies) assert.equal(hash(fs.readFileSync(row.file)), row.sha256);
const fixture = json(proof + 'fixture-files.json');
assert.equal(fixture.length, 8);
for (const row of fixture) assert.equal(hash(fs.readFileSync(new URL(proof + row.file, root))), row.sha256);
assert.ok(read(proof + 'fixture/build.gradle').includes(read(proof + 'original/block-04.gradle')));
assert.equal(read(proof + 'original/block-05.yaml'), read(proof + 'fixture/resources/application.yaml'));
const raw = json(proof + 'runtime-last.json');
assert.equal(raw.apps.length, 6);
assert.ok(raw.apps.every(app => app.exitCode === 143 && app.portClosed));
assert.equal(raw.commands.find(command => command.name === 'h2-schema-proof').exitCode, 0);
const independent = json(proof + 'independent-replay.json');
assert.equal(independent.runnerExitCode, 0);
assert.equal(independent.freezeUsed, false);
assert.equal(independent.comparison.checks, 20);
assert.equal(independent.comparison.models, 3);
assert.equal(independent.comparison.wholePerRunActualVersusCopiedFrozenMatch, true);
assert.equal(independent.comparison.wholeCurrentSharedExecutionAndFrozenMatch, true);
assert.equal(independent.preservation.fixtureFiles, 8);
assert.equal(independent.preservation.allOriginalBodiesByteExact, true);
assert.equal(independent.dependencies.resolvedArtifacts, 50);
assert.equal(independent.dependencies.runtimeArtifacts, 49);
assert.equal(independent.dependencies.separateProofH2Artifacts, 1);
assert.equal(independent.artifacts.jars.length, 2);
for (const artifact of independent.artifacts.jars) assert.equal(artifact.nestedLibraryCount, 42);
assert.equal(independent.cleanup.allSixTrackedPIDsGone, true);
assert.deepEqual(independent.cleanup.allSixExitCodes, [143, 143, 143, 143, 143, 143]);
assert.equal(independent.cleanup.allSixHTTPPortsClosed, true);
assert.equal(independent.cleanup.router.closedAtIndependentCheck, true);
assert.equal(independent.cleanup.h2ConnectionClosed, true);
for (const key of ['criticalFindings', 'importantFindings', 'minorFindings']) assert.equal(independent[key], 0);

const supplement = d.querySelector('.d06-supplement');
assert.ok(supplement && !source.contains(supplement));
assert.equal(supplement.open, false);
assert.ok([...supplement.querySelectorAll('details')].every(node => !node.open));
for (const phrase of ['Java25/8080', 'Java21.0.6', 'CHECK20', '모델3', 'fixture8', 'runtime49', 'lib42', 'SchemaProof', 'profile도local/stg로 다릅니다', 'readiness', 'SIGTERM143', '단발 SchemaProof는exit0', '공백2개', '길이13', '길이12', '전수 pixel parity']) assert.ok(supplement.textContent.includes(phrase), phrase);
const fullCode = [...supplement.querySelectorAll('pre code')].map(node => node.textContent);
for (const file of ['source-proof/source.json', 'source-proof/execution.json', 'source-proof/checkpoints/expected-execution.json', 'source-proof/independent-replay.json', 'research/main-verification.json', 'source-proof/runtime-last.json', 'source-proof/dependencies.json', 'source-proof/fixture-files.json', 'source-proof/jar-observations.json']) {
  assert.ok(fullCode.some(code => { try { return JSON.stringify(JSON.parse(code)) === JSON.stringify(json(design + file)); } catch { return false; } }), file + ' 전체 JSON 보존');
}
assert.ok(fullCode.includes(read('docs/knowledge/D06-deployment-concepts.md')), '전체 Markdown 원문');
for (const file of json(proof + 'source.json').originalBlocks) assert.ok(fullCode.includes(read(proof + 'original/' + file.file)), file.file + ' 원문8block 보존');
for (const file of fixture) assert.ok(fullCode.includes(read(proof + file.file)), file.file + ' fixture8 전체 보존');
for (const file of ['source-proof/run-proof.py', 'source-proof/replay.log']) assert.ok(fullCode.includes(read(design + file)), file + ' 전체 관찰기/로그 보존');
page.window.close();
console.log('D06 생성HTML: 원문14124/도표제외13326자·code5/Mermaid3/id20/map1·30상태·선정13JPEG 크기/SHA·20CHECK/3모델·원문8block/fixture8/fullraw·앱/라우터/H2/종료 경계 보존 통과');
