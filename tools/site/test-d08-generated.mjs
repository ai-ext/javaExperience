import { resolveEvidencePath } from './evidence-path.mjs';
// 생성 HTML과 선정 JPG·원문·native·미실행 정책 모델의 실제 연결을 검사한다.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { JSDOM } from 'jsdom';
import { rasterDimensions } from './raster-size.mjs';
import { D08_ASSETS, D08_LESSONS, D08_RUNS, D08_CLARIFICATIONS, d08Run } from './d08-lesson-data.mjs';
const root = new URL('../../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const json = file => JSON.parse(read(file));
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const design = 'docs/design/d08-2026-10-21/', proof = design + 'source-proof/';
const base = json(design + 'html-baseline.json');
assert.equal(hash(read('docs/knowledge/D08-cicd-collaboration.md')), base.sourceSHA256);
assert.equal(base.wholeSourceText.length, 13715);
assert.equal(base.withoutMermaidText.length, 12776);
assert.deepEqual([base.code.length, base.mermaid.length, base.ids.length, base.oldVisual.length], [5, 3, 16, 1]);
assert.equal(json(proof + 'source.json').lines, 319);
const page = new JSDOM(read('docs/knowledge/D08-cicd-collaboration.html'), { runScripts: 'outside-only', url: 'https://learn.example/docs/knowledge/D08-cicd-collaboration.html' });
const d = page.window.document, source = d.querySelector('#d08-original');
assert.ok(source, 'main의 원문 전체 wrapper');
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
assert.deepEqual([...d.querySelectorAll('.d08-legacy>.knowledge-page-map')].map(node => node.outerHTML), base.oldVisual);
const ids = [...d.querySelectorAll('[id]')].map(node => node.id);
assert.equal(ids.length, new Set(ids).size, '중복 id 없음');
const selected = json(design + 'image-records.json').images.filter(row => row.selected);
assert.equal(selected.length, 14);
assert.equal(Object.keys(D08_ASSETS).length, 14);
assert.equal(new Set(Object.values(D08_ASSETS).map(asset => asset.file)).size, 14);
for (const asset of Object.values(D08_ASSETS)) {
  assert.equal(asset.ready, true);
  assert.ok(asset.file.endsWith('.jpg'));
  const bytes = fs.readFileSync(new URL(design + 'images/' + asset.file, root)), size = rasterDimensions(bytes);
  assert.equal(size.format, 'jpeg');
  assert.equal(asset.width, size.width);
  assert.equal(asset.height, size.height);
  const record = selected.find(row => row.destination.endsWith('/' + asset.file));
  assert.ok(record, asset.file + ' final selection');
  assert.equal(record.sha256, hash(bytes));
  assert.equal(record.width, size.width);
  assert.equal(record.height, size.height);
}
const stages = D08_LESSONS.flatMap(lesson => lesson.stages);
assert.equal(D08_LESSONS.length, 14);
assert.equal(stages.length, 40);
assert.equal(new Set(stages.map(stage => stage.id)).size, 40);
for (const stage of stages) {
  const region = D08_ASSETS[stage.image].focus[stage.id];
  assert.ok(Array.isArray(region) && region.length === 4);
  assert.ok(region.every(n => Number.isFinite(n) && n >= 0));
  assert.ok(region[2] > 0 && region[3] > 0 && region[0] + region[2] <= 100 && region[1] + region[3] <= 100, stage.id);
}
assert.ok(d.querySelector('link[href*="p09-learning.css"]'));
assert.ok(d.querySelector('link[href*="d08-learning.css"]'));
assert.ok(d.querySelector('script[src*="d08-learning.bundle.js"]'));
page.window.eval(read('tools/site/d08-learning.bundle.js'));
const ui = d.querySelector('[data-d08-learning]');
assert.ok(ui?.querySelector('[data-d08-topic]'));
assert.equal(ui.querySelector('[data-d08-question]').tagName, 'H2');
for (const lesson of D08_LESSONS) {
  const topic = ui.querySelector('[data-d08-topic]'); topic.value = lesson.id; topic.dispatchEvent(new page.window.Event('change'));
  for (const stage of lesson.stages) {
    ui.querySelector(`[data-d08-stage="${stage.id}"]`).click();
    assert.equal(ui.dataset.stage, stage.id);
    assert.equal(ui.querySelector('[data-d08-title]').textContent, stage.title);
    assert.equal(ui.querySelector('[data-d08-lead]').textContent, stage.lead);
    assert.equal(ui.querySelector('[data-d08-source-note]').textContent, stage.sourceNote || lesson.sourceNote);
    assert.equal(ui.querySelector('[data-d08-code]').textContent, stage.code);
    assert.deepEqual([...ui.querySelectorAll('[data-d08-code] mark')].map(node => node.textContent), stage.active.map(index => stage.code.split('\n')[index]));
    assert.equal(ui.querySelector('[data-d08-code-kind]').textContent, stage.codeKind === 'model-json' ? '미실행 모델 JSON · 정책 근거' : stage.codeKind === 'unrun-source' ? '미실행 원문 YAML·Groovy 발췌' : '추가 Git·Java 관찰기 실제 발췌');
    for (const [label, expected] of stage.values) {
      const term = [...ui.querySelectorAll('[data-d08-state] dt')].find(node => node.textContent === label);
      assert.ok(term, label); assert.equal(term.nextElementSibling.textContent, expected);
    }
    for (const selector of ['[data-d08-state]', '[data-d08-code]', '[data-d08-source-note]']) assert.equal(ui.querySelector(selector).closest('details'), null);
    assert.equal(ui.querySelector('[data-d08-output]').open, false);
    assert.equal(ui.querySelector('[data-d08-stdout]').textContent, stage.checks.map(check => 'PASS ' + check).join('\n'));
    assert.equal(ui.querySelector('[data-d08-stdout]').parentElement.hidden, !stage.checks.length);
    for (const key of stage.runKeys) assert.ok(ui.querySelector('[data-d08-runs]').textContent.includes(JSON.stringify(d08Run(key), null, 2)), key);
    assert.equal(ui.querySelector('[data-d08-image]').getAttribute('src'), '../design/d08-2026-10-21/images/' + D08_ASSETS[stage.image].file);
  }
}
const actual = json(proof + 'execution.json');
assert.deepEqual(D08_RUNS, actual);
assert.deepEqual(actual, json(proof + 'checkpoints/expected-execution.json'));
assert.deepEqual(actual.models, json(proof + 'models.json'));
assert.deepEqual(D08_CLARIFICATIONS, json(proof + 'model-clarifications.json'));
assert.equal(actual.checks.length, 22);
assert.equal(new Set(actual.checks).size, 22);
assert.equal(Object.keys(actual.facts).length, 22);
assert.equal(Object.keys(actual.models).length, 6);
assert.ok(Object.values(actual.models).every(model => model.executed === false));
assert.deepEqual(new Set(stages.flatMap(stage => stage.checks)), new Set(actual.checks));
assert.equal(stages.filter(stage => stage.checks.length).length, 15);
assert.equal(stages.filter(stage => stage.codeKind === 'model-json').length, 21);
assert.equal(stages.filter(stage => stage.codeKind === 'unrun-source').length, 4);
for (const stage of stages.filter(stage => !stage.checks.length)) {
  assert.ok(stage.runKeys.every(key => key.startsWith('models.') || key.startsWith('clarifications')));
  if (stage.codeKind === 'model-json') {
    let projection = d08Run(stage.codePath);
    if (stage.codeKeys) projection = Object.fromEntries(stage.codeKeys.map(key => [key, projection[key]]));
    assert.deepEqual(JSON.parse(stage.code), projection);
  }
}
const facts = actual.facts;
assert.equal(facts['original-eight-blocks-preserved-unrun'].originalJavaPresent, false);
assert.equal(facts['ungated-test-failure-can-leave-boot-jar'].bootJarExecutedBeforeTest, true);
assert.equal(facts['ungated-test-failure-can-leave-boot-jar'].jarFiles.length, 1);
assert.equal(facts['failed-test-stops-before-bootjar-and-no-jar'].bootJarTaskExecuted, false);
assert.deepEqual(facts['failed-test-stops-before-bootjar-and-no-jar'].jarFiles, []);
assert.match(stages.find(stage => stage.id === 'testgate-failed').code, /dependsOn tasks.named\('test'\)/);
assert.equal(facts['corrected-same-command-junit-passes'].report.failures, 0);
assert.equal(facts['same-jar-three-local-folder-copies'].realEnvironmentPromotionExecuted, false);
assert.equal(facts['boot-jar-manifest-and-compiled-byte-evidence'].bytes, 9102150);
assert.equal(facts['boot-jar-manifest-and-compiled-byte-evidence'].nestedLibraries, 20);
assert.equal(facts['artifact-mapped-to-actually-tested-commit'].fixedCommit, '97f2a0e544c8218a1e92d45ff3b2fb25f082d94c');
assert.deepEqual(JSON.parse(stages.find(stage => stage.id === 'argo-enabled').code), D08_CLARIFICATIONS.clarification);
const fixture = json(proof + 'fixture-manifest.json'); assert.equal(fixture.files.length, 12);
for (const file of fixture.files) assert.equal(hash(read(proof + 'fixture/' + file.file)), file.sha256);
assert.equal(hash(read(proof + 'run-proof.py')), fixture.runnerSHA256);
const raw = json(proof + 'runtime-last.json'); assert.equal(raw.completed, true);
assert.equal(hash(fs.readFileSync(resolveEvidencePath(raw.jar.path))), facts['boot-jar-manifest-and-compiled-byte-evidence'].sha256);
const dependencies = json(proof + 'dependencies.json');
assert.deepEqual([dependencies.runtime.length, dependencies.test.length], [21, 29]);
for (const [name, group] of Object.entries(raw.dependencyFiles)) {
  assert.deepEqual(group.map(({ coordinate, sha256 }) => ({ coordinate, sha256 })), dependencies[name]);
  for (const row of group) assert.equal(hash(fs.readFileSync(resolveEvidencePath(row.file))), row.sha256);
}
for (const [name, code] of [['ungated-clean-test-bootjar', 1], ['buggy-clean-test-bootjar', 1], ['fixed-clean-test-bootjar', 0]]) assert.equal(raw.commands.find(row => row.name === name).exitCode, code);
const independent = json(proof + 'independent-replay.json');
assert.equal(independent.execution.exitCode, 0);
assert.equal(independent.execution.freeze, false);
assert.equal(independent.execution.checks, 22);
assert.equal(independent.execution.models, 6);
assert.equal(independent.execution.allModelsExecutedFalse, true);
assert.equal(independent.execution.wholeCopiedExpectedMatch, true);
assert.equal(independent.execution.wholeCurrentSharedExpectedMatch, true);
assert.equal(independent.execution.wholeCurrentSharedExecutionMatch, true);
assert.equal(independent.preservation.fixtureFiles, 12);
assert.equal(independent.preservation.originalJavaPresent, false);
assert.equal(independent.jar.bytes, 9102150);
assert.equal(independent.jar.nestedLibraries, 20);
assert.equal(independent.jar.sha256, facts['boot-jar-manifest-and-compiled-byte-evidence'].sha256);
assert.equal(independent.isolationAndCompletion.applicationJVMStarted, false);
assert.equal(independent.isolationAndCompletion.HTTPExecuted, false);
const supplement = d.querySelector('.d08-supplement');
assert.ok(supplement && !source.contains(supplement));
assert.equal(supplement.open, false);
assert.ok([...supplement.querySelectorAll('details')].every(node => !node.open));
for (const text of ['원문에는 Java 앱 코드가 없습니다', 'native22CHECK', 'fixture12', '모델6', 'bootJar dependsOn test', 'Argo 별도 명확화', 'enabled 생략/null', '실제 환경 승격', '전수 pixel parity']) assert.ok(supplement.textContent.includes(text), text);
const fullCode = [...supplement.querySelectorAll('pre code')].map(node => node.textContent);
for (const file of ['source.json', 'execution.json', 'models.json', 'model-clarifications.json', 'checkpoints/expected-execution.json', 'runtime-last.json', 'dependencies.json', 'fixture-manifest.json', 'independent-replay.json']) assert.ok(fullCode.some(code => { try { return JSON.stringify(JSON.parse(code)) === JSON.stringify(json(proof + file)); } catch { return false; } }), file + ' full JSON preserved');
assert.ok(fullCode.some(code => { try { return JSON.stringify(JSON.parse(code)) === JSON.stringify(json(design + 'research/main-verification.json')); } catch { return false; } }));
assert.ok(fullCode.includes(read('docs/knowledge/D08-cicd-collaboration.md')));
for (const row of json(proof + 'source.json').originalBlocks) assert.ok(fullCode.includes(read(proof + 'original/' + row.file)));
for (const row of fixture.files) assert.ok(fullCode.includes(read(proof + 'fixture/' + row.file)));
assert.ok(fullCode.includes(read(proof + 'run-proof.py')));
assert.ok(fullCode.includes(read(proof + 'main-replay.log')));
page.window.close();
console.log('D08 생성HTML: 원문13715/도표제외12776자·code5/Mermaid3/id16/map1·14질문40상태·선정14JPEG·22CHECK6모델·ungated/gated/Argo별도명확화/fullraw 보존 통과');
