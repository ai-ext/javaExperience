import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { JSDOM } from 'jsdom';
import { D08_LESSONS, D08_ASSETS, D08_RUNS, D08_CLARIFICATIONS, d08AssetRoot, d08Run } from './d08-lesson-data.mjs';
import { renderD08Learning, d08AvailableLessons } from './d08-learning.mjs';
import { initD08Learning } from './d08-learning.js';
import { renderD08Supplementary } from './d08-supplement.mjs';
const proof = new URL('../../docs/design/d08-2026-10-21/source-proof/', import.meta.url);
const read = file => readFileSync(new URL(file, proof), 'utf8');
const load = file => JSON.parse(read(file));
const sha = value => createHash('sha256').update(value).digest('hex');
const execution = load('execution.json'), raw = load('runtime-last.json'), meta = load('source.json'), fixture = load('fixture-manifest.json');
assert.deepEqual(D08_RUNS, execution);
assert.deepEqual(execution, load('checkpoints/expected-execution.json'));
assert.deepEqual(execution.models, load('models.json'));
assert.deepEqual(D08_CLARIFICATIONS, load('model-clarifications.json'));
assert.equal(new Set(execution.checks).size, 22);
assert.deepEqual(new Set(Object.keys(execution.facts)), new Set(execution.checks));
assert.equal(Object.keys(execution.models).length, 6);
assert.ok(Object.values(execution.models).every(model => model.executed === false));
assert.deepEqual(new Set(read('main-replay.log').split('\n').filter(line => line.startsWith('PASS ')).map(line => line.slice(5))), new Set(execution.checks));
const sourceURL = new URL('../../docs/knowledge/D08-cicd-collaboration.md', import.meta.url), source = readFileSync(sourceURL, 'utf8');
assert.equal(sha(source), meta.sha256);
assert.equal(meta.lines, 319);
assert.equal(meta.originalBlocks.length, 8);
assert.deepEqual(meta.originalBlocks.reduce((a, row) => ({ ...a, [row.language]: (a[row.language] || 0) + 1 }), {}), { mermaid: 3, bash: 1, yaml: 3, groovy: 1 });
for (const row of meta.originalBlocks) assert.equal(sha(read('original/' + row.file)), row.sha256);
assert.equal(fixture.files.length, 12);
for (const row of fixture.files) assert.equal(sha(read('fixture/' + row.file)), row.sha256);
assert.equal(sha(read('run-proof.py')), fixture.runnerSHA256);
assert.equal(raw.completed, true);
for (const [name, exit] of [['ungated-clean-test-bootjar', 1], ['buggy-clean-test-bootjar', 1], ['fixed-clean-test-bootjar', 0]]) assert.equal(raw.commands.find(row => row.name === name).exitCode, exit);
const stages = D08_LESSONS.flatMap(lesson => lesson.stages);
const contract = {
  refs: ['working', 'index', 'commit', 'tag'], integration: ['merge', 'rebase', 'squash'], conflict: ['markers', 'resolved'],
  testgate: ['ungated', 'failed', 'fixed'], artifact: ['jar', 'mapping', 'copies'], pr: ['merge', 'head', 'gates'],
  syntax: ['actions', 'gitlab', 'jenkins', 'azure'], dag: ['success', 'failed'], cache: ['input', 'output'], delivery: ['approval', 'auto'],
  gitops: ['principles', 'actors', 'status'], argo: ['enabled', 'prune', 'drift', 'retry'], trust: ['original', 'current', 'context'], promotion: ['tag', 'digest'],
};
assert.deepEqual(D08_LESSONS.map(lesson => lesson.id), Object.keys(contract));
assert.equal(stages.length, 40);
assert.equal(new Set(stages.map(stage => stage.id)).size, 40);
for (const lesson of D08_LESSONS) assert.deepEqual(lesson.stages.map(stage => stage.id), contract[lesson.id].map(id => lesson.id + '-' + id));
assert.equal(stages.filter(stage => stage.checks.length).length, 15);
assert.equal(stages.filter(stage => stage.codeKind === 'model-json').length, 21);
assert.equal(stages.filter(stage => stage.codeKind === 'unrun-source').length, 4);
assert.deepEqual(new Set(stages.flatMap(stage => stage.checks)), new Set(execution.checks));
const codeFiles = ['run-proof.py', ...fixture.files.map(row => 'fixture/' + row.file), ...meta.originalBlocks.map(row => 'original/' + row.file)].map(read);
for (const stage of stages) {
  const lines = stage.code.split('\n');
  assert.ok(lines.length <= 14, stage.id + ' ≤14 lines');
  assert.ok(stage.active.length && stage.active.every(index => Number.isInteger(index) && index >= 0 && index < lines.length));
  if (stage.codeKind === 'model-json') {
    let value = d08Run(stage.codePath);
    if (stage.codeKeys) value = Object.fromEntries(stage.codeKeys.map(key => [key, value[key]]));
    assert.deepEqual(JSON.parse(stage.code), value, stage.id + ' exact explicit projection');
  } else assert.ok(codeFiles.some(file => file.includes(stage.code)), stage.id + ' actual continuous substring');
  for (const key of stage.runKeys) assert.notEqual(d08Run(key), undefined, key);
  if (!stage.checks.length) assert.ok(stage.runKeys.every(key => key.startsWith('models.') || key.startsWith('clarifications')));
  assert.ok(D08_ASSETS[stage.image].focus[stage.id]);
}
assert.ok(stages.filter(stage => stage.active.some(index => index > 0)).length >= 30);
assert.ok(stages.some(stage => stage.code.includes('\n\n')));
assert.equal(Object.keys(D08_ASSETS).length, 14);
assert.ok(Object.values(D08_ASSETS).every(asset => asset.file.endsWith('.jpg')));
const f = execution.facts, state = id => stages.find(stage => stage.id === id);
assert.equal(f['original-eight-blocks-preserved-unrun'].originalJavaPresent, false);
assert.equal(f['working-index-commit-and-branch-refs'].beforeCommit.committed, 'value=0\n');
assert.equal(f['working-index-commit-and-branch-refs'].afterCommit.index, 'value=1\n');
assert.equal(f['working-index-commit-and-branch-refs'].afterCommit.working, 'value=2\n');
assert.equal(f['lightweight-tag-stable-while-branch-moves'].tagMoved, false);
assert.equal(f['no-ff-merge-keeps-two-parents'].parents.length, 2);
assert.notEqual(f['rebase-changes-parent-and-commit-sha'].before, f['rebase-changes-parent-and-commit-sha'].after);
assert.deepEqual(f['squash-same-tree-without-feature-ancestry'].featureCommitsAncestorsOfTrunk, [false, false]);
assert.equal(f['conflict-resolution-tests-both-intents'].stdout, '5');
assert.equal(f['ungated-test-failure-can-leave-boot-jar'].exitCode, 1);
assert.equal(f['ungated-test-failure-can-leave-boot-jar'].bootJarExecutedBeforeTest, true);
assert.equal(f['ungated-test-failure-can-leave-boot-jar'].jarFiles.length, 1);
assert.equal(f['failed-test-stops-before-bootjar-and-no-jar'].bootJarTaskExecuted, false);
assert.deepEqual(f['failed-test-stops-before-bootjar-and-no-jar'].jarFiles, []);
assert.match(state('testgate-failed').code, /dependsOn tasks.named\('test'\)/);
assert.equal(f['corrected-same-command-junit-passes'].report.failures, 0);
assert.equal(f['corrected-same-command-junit-passes'].actual, 5);
assert.equal(f['artifact-mapped-to-actually-tested-commit'].fixedCommit, '97f2a0e544c8218a1e92d45ff3b2fb25f082d94c');
assert.equal(f['boot-jar-manifest-and-compiled-byte-evidence'].bytes, 9102150);
assert.equal(f['boot-jar-manifest-and-compiled-byte-evidence'].nestedLibraries, 20);
assert.equal(f['boot-jar-manifest-and-compiled-byte-evidence'].sha256.length, 64);
assert.deepEqual(Object.values(f['additional-java-classes-target21'].classfileMajors), [65, 65]);
assert.deepEqual([f['pinned-runtime-test-artifact-sha'].runtimeArtifacts, f['pinned-runtime-test-artifact-sha'].testArtifacts, f['pinned-runtime-test-artifact-sha'].uniqueArtifactUnion], [21, 29, 29]);
assert.equal(f['same-jar-three-local-folder-copies'].realEnvironmentPromotionExecuted, false);
assert.equal(f['bounded-local-command-scope-no-deployment'].HTTPExecuted, false);
assert.equal(f['all-toy-git-repositories-have-no-remotes'].repositories, 6);
for (const group of Object.values(raw.dependencyFiles)) for (const dep of group) assert.equal(sha(readFileSync(dep.file)), dep.sha256);
assert.equal(sha(readFileSync(raw.jar.path)), f['boot-jar-manifest-and-compiled-byte-evidence'].sha256);
assert.equal(execution.models['pr-policy'].refs.head, 'H2');
assert.equal(execution.models['pr-policy'].refs.pull_request_default_sha, 'M1 (시험 merge commit)');
assert.match(state('pr-gates').sourceNote, /모든 job 실행 성공과 같지/);
assert.match(state('pr-gates').values.find(([key]) => key === 'accepted check')[1], /successful\/skipped\/neutral/);
assert.match(state('pr-gates').sourceNote, /strict.*stale/);
assert.equal(Object.keys(D08_CLARIFICATIONS.clarification).length, 4);
assert.deepEqual(JSON.parse(state('argo-enabled').code), D08_CLARIFICATIONS.clarification);
for (const stage of D08_LESSONS.find(lesson => lesson.id === 'argo').stages) assert.match(stage.sourceNote, /자체 없음.*비활성.*\{\}.*활성.*생략\/null.*활성.*false.*비활성/);
assert.match(state('argo-drift').lead, /multi-source/);
assert.match(state('argo-retry').lead, /완료 시간 보장.*아닙니다/);
assert.match(state('promotion-digest').lead, /서명·승인·취약점 부재·DB 호환/);

const supPage = new JSDOM(renderD08Supplementary(), { runScripts: 'outside-only' }), supplement = supPage.window.document.querySelector('.d08-supplement');
assert.ok(supplement && !supplement.open);
assert.ok([...supplement.querySelectorAll('details')].every(node => !node.open));
const fullCode = [...supplement.querySelectorAll('pre code')].map(node => node.textContent);
assert.ok(fullCode.includes(source));
for (const row of meta.originalBlocks) assert.ok(fullCode.includes(read('original/' + row.file)));
for (const row of fixture.files) assert.ok(fullCode.includes(read('fixture/' + row.file)));
for (const [file, data] of [['execution.json', execution], ['models.json', execution.models], ['model-clarifications.json', D08_CLARIFICATIONS], ['runtime-last.json', raw]]) assert.ok(fullCode.some(code => { try { return JSON.stringify(JSON.parse(code)) === JSON.stringify(data); } catch { return false; } }), file + ' full raw preserved');
assert.match(supplement.textContent, /원문에는 Java 앱 코드가 없습니다/);
assert.match(supplement.textContent, /bootJar dependsOn test/);
assert.match(supplement.textContent, /automated 자체가 없으면.*비활성.*\{\}로 존재하면 활성/);
supPage.window.close();

const saved = structuredClone(D08_ASSETS);
try {
  Object.values(D08_ASSETS).forEach(asset => { asset.ready = false; });
  assert.equal(d08AvailableLessons().length, 0);
  assert.match(renderD08Learning(), /준비 중/);
  Object.values(D08_ASSETS).forEach(asset => { asset.ready = true; });
  const foreign = { __javaExperienceD07: { topic: 'lifecycle', stage: 'lifecycle-clean' }, foreign: { keep: true } };
  function setup(matches = false) {
    const page = new JSDOM('<h1>기존 D08</h1><section class="d08-legacy"><button data-d08-stage="refs-tag" id="legacy-control">기존 지도</button></section>' + renderD08Learning() + '<details id="d08-original"><summary>원문</summary><details><summary>원문 코드</summary><a id="source-deep" href="#old">원문 링크</a></details></details>', { url: 'https://learn.example/D08.html' });
    const win = page.window, doc = win.document, listeners = [], media = { matches, addEventListener(type, callback) { assert.equal(type, 'change'); listeners.push(callback); } };
    win.matchMedia = () => media;
    for (const key of ['localStorage', 'sessionStorage']) Object.defineProperty(win, key, { get() { throw Error('storage/progress writes forbidden'); } });
    win.fetch = () => { throw Error('network forbidden'); };
    const copied = [];
    Object.defineProperty(win.navigator, 'clipboard', { value: { async writeText(code) { copied.push(code); } } });
    win.history.replaceState(structuredClone(foreign), '');
    const old = ['.d08-legacy', '#d08-original'].map(selector => doc.querySelector(selector).outerHTML);
    initD08Learning(doc, win);
    const root = doc.querySelector('[data-d08-learning]'), $ = selector => root.querySelector(selector);
    const topic = id => { $('[data-d08-topic]').value = id; $('[data-d08-topic]').dispatchEvent(new win.Event('change')); };
    const stage = id => $(`[data-d08-stage="${id}"]`).click();
    const value = label => { const dt = [...$('[data-d08-state]').querySelectorAll('dt')].find(node => node.textContent === label); assert.ok(dt, label); return dt.nextElementSibling.textContent; };
    return { win, doc, root, $, topic, stage, value, copied, old, resize(matches) { media.matches = matches; listeners.forEach(callback => callback({ matches })); } };
  }
  const { win, doc, root, $, topic, stage, value, copied, old, resize } = setup();
  assert.equal(doc.querySelectorAll('h1').length, 1);
  assert.equal($('[data-d08-question]').tagName, 'H2');
  assert.match($('.d08-scope').textContent, /原文|원문에는 Java 앱이 없습니다/);
  const kind = state => state.codeKind === 'model-json' ? '미실행 모델 JSON · 정책 근거' : state.codeKind === 'unrun-source' ? '미실행 원문 YAML·Groovy 발췌' : '추가 Git·Java 관찰기 실제 발췌';
  for (const lesson of D08_LESSONS) {
    topic(lesson.id);
    assert.equal($('[data-d08-stage-select]').options.length, lesson.stages.length);
    for (const [index, state] of lesson.stages.entries()) {
      stage(state.id);
      assert.equal(root.dataset.topic, lesson.id);
      assert.equal(root.dataset.stage, state.id);
      assert.equal($('[data-d08-question]').textContent, lesson.question);
      assert.equal($('[data-d08-title]').textContent, state.title);
      assert.equal($('[data-d08-lead]').textContent, state.lead);
      assert.equal($('[data-d08-source-note]').textContent, state.sourceNote || lesson.sourceNote);
      assert.equal($('[data-d08-code]').textContent, state.code);
      assert.equal($('[data-d08-code-kind]').textContent, kind(state));
      assert.deepEqual([...$('[data-d08-code]').querySelectorAll('mark')].map(node => node.textContent), state.active.map(index => state.code.split('\n')[index]));
      for (const [label, expected] of state.values) assert.equal(value(label), expected);
      for (const selector of ['[data-d08-state]', '[data-d08-code]', '[data-d08-source-note]']) assert.equal($(selector).closest('details'), null);
      assert.equal($('[data-d08-output]').open, false);
      assert.equal($('[data-d08-stdout]').textContent, state.checks.map(id => 'PASS ' + id).join('\n'));
      assert.equal($('[data-d08-stdout]').parentElement.hidden, !state.checks.length);
      for (const path of state.runKeys) {
        const model = path.startsWith('models.') || path.startsWith('clarifications');
        assert.ok($('[data-d08-runs]').textContent.includes(path + (model ? ' · 모델 기록' : ' · 실제 기록') + JSON.stringify(d08Run(path), null, 2)));
      }
      assert.equal($('[data-d08-position]').textContent, `${index + 1} / ${lesson.stages.length}`);
      assert.equal($('[data-d08-image]').getAttribute('src'), d08AssetRoot + D08_ASSETS[state.image].file);
      $('[data-d08-copy]').click(); await Promise.resolve(); await Promise.resolve(); assert.equal(copied.at(-1), state.code);
      assert.deepEqual(['.d08-legacy', '#d08-original'].map(selector => doc.querySelector(selector).outerHTML), old);
    }
  }
  topic('testgate'); stage('testgate-ungated'); assert.equal(value('JAR 존재 / bytes'), 'true / 9102149'); stage('testgate-failed'); assert.equal(value('bootJar / JAR files'), '미실행 / []'); stage('testgate-fixed'); assert.equal(value('input / result'), '2,3 / 5');
  assert.equal(copied.find(code => code.includes('public class Calculator') && code.includes('left + right')), state('testgate-fixed').code);
  topic('artifact'); stage('artifact-jar'); assert.equal(value('JAR SHA256'), f['boot-jar-manifest-and-compiled-byte-evidence'].sha256); assert.equal(value('JAR SHA256').length, 64); stage('artifact-mapping'); assert.match(value('매핑 위치'), /JAR 내부 아님/); stage('artifact-copies'); assert.equal(value('재빌드 / 실제 promotion'), 'false / false');
  topic('argo'); stage('argo-enabled'); assert.equal(value('enabled 생략 / null'), 'auto-sync 활성 취급'); assert.equal($('[data-d08-stdout]').parentElement.hidden, true); assert.match($('[data-d08-runs]').textContent, /clarifications · 모델 기록/);
  assert.deepEqual(win.history.state.foreign, foreign.foreign); assert.deepEqual(win.history.state.__javaExperienceD07, foreign.__javaExperienceD07); assert.equal(win.history.length, 1);
  const beforeLegacy = root.dataset.stage; doc.getElementById('legacy-control').click(); assert.equal(root.dataset.stage, beforeLegacy);
  topic('refs'); const buttons = [...root.querySelectorAll('[data-d08-stage]')]; buttons[0].focus();
  for (const [key, index] of [['End', 3], ['ArrowLeft', 2], ['Home', 0], ['ArrowRight', 1]]) { doc.activeElement.dispatchEvent(new win.KeyboardEvent('keydown', { key, bubbles: true })); assert.equal(doc.activeElement, buttons[index]); }
  buttons[1].dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); assert.equal(root.dataset.stage, 'refs-index');
  stage('refs-commit'); $('[data-d08-next]').focus(); $('[data-d08-next]').click(); assert.equal(doc.activeElement, buttons[3]); stage('refs-index'); $('[data-d08-prev]').focus(); $('[data-d08-prev]').click(); assert.equal(doc.activeElement, buttons[0]);
  $('[data-d08-output]').open = true; $('[data-d08-zoom]').click(); resize(true); assert.equal($('[data-d08-output]').open, true); assert.equal($('.d08-image-frame').tabIndex, 0);
  const region = D08_ASSETS['D08-refs'].focus['refs-working']; assert.equal($('[data-d08-image]').style.transform, `translate(-${region[0]}%, -${region[1]}%)`);
  $('[data-d08-zoom]').click(); resize(false); resize(true); assert.equal($('[data-d08-zoom]').getAttribute('aria-pressed'), 'false'); assert.equal($('[data-d08-output]').open, true); stage('refs-index'); assert.equal($('[data-d08-output]').open, false);
  const target = { topic: 'argo', stage: 'argo-drift' }; win.history.replaceState({ ...win.history.state, __javaExperienceD08: target }, ''); win.dispatchEvent(new win.PopStateEvent('popstate')); assert.equal(root.dataset.stage, target.stage); initD08Learning(doc, win); assert.equal(root.dataset.topic, target.topic);
  win.history.pushState({ foreign: { anchor: true } }, '', '#anchor-entry'); win.dispatchEvent(new win.PopStateEvent('popstate')); assert.deepEqual(win.history.state.__javaExperienceD08, target); assert.deepEqual(win.history.state.foreign, { anchor: true }); win.history.pushState(null, '', '#null-entry'); win.dispatchEvent(new win.PopStateEvent('popstate')); assert.deepEqual(win.history.state.__javaExperienceD08, target);
  topic('testgate'); stage('testgate-fixed'); win.navigator.clipboard.writeText = async () => { throw Error('clipboard unavailable'); }; $('[data-d08-copy]').click(); await Promise.resolve(); await Promise.resolve(); assert.equal(win.getSelection().toString(), state('testgate-fixed').code); assert.ok(win.getSelection().toString().includes('\n\n'));
  win.location.hash = 'source-deep'; win.dispatchEvent(new win.HashChangeEvent('hashchange')); assert.equal(doc.getElementById('d08-original').open, true); assert.equal(doc.getElementById('source-deep').closest('details').open, true); assert.equal(doc.getElementById('source-deep').getAttribute('href'), '#old'); assert.equal(readFileSync(sourceURL, 'utf8'), source); win.close();
  const mobile = setup(true); mobile.topic('refs'); mobile.$('[data-d08-stage-select]').value = 'refs-commit'; mobile.$('[data-d08-stage-select]').dispatchEvent(new mobile.win.Event('change')); mobile.$('[data-d08-mobile-next]').focus(); mobile.$('[data-d08-mobile-next]').click(); assert.equal(mobile.doc.activeElement, mobile.$('[data-d08-stage-select]')); mobile.stage('refs-index'); mobile.$('[data-d08-mobile-prev]').focus(); mobile.$('[data-d08-mobile-prev]').click(); assert.equal(mobile.doc.activeElement, mobile.$('[data-d08-stage-select]')); mobile.win.close();
  const css = readFileSync(new URL('./d08-learning.css', import.meta.url), 'utf8'); assert.match(css, /overflow-wrap:anywhere/); assert.match(css, /white-space:pre-wrap/); assert.match(css, /dt,dd/);
} finally { for (const [key, asset] of Object.entries(saved)) Object.assign(D08_ASSETS[key], asset); }
console.log('D08: 14주제40상태(native15/model21/미실행원문4)·22CHECK6모델·3build taskgate/실제SHA·Argo명확화·history/copyblank/keyboard/mobile 계약 통과');
