// 통합 시점에만 실행한다. 기존 증거를 바꾸지 않고 main 원문 보존을 먼저 검증한다.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(new URL('../../../tools/site/package.json', import.meta.url));
const { JSDOM } = require('jsdom');
const root = fileURLToPath(new URL('../../../', import.meta.url));
const directory = path.dirname(fileURLToPath(import.meta.url));
const input = JSON.parse(fs.readFileSync(path.join(directory, 'INPUT.json')));
const read = p => fs.readFileSync(path.join(root, p));
const git = (ref, p) => execFileSync('git', ['show', `${ref}:${p}`], { cwd: root, maxBuffer: 8 * 1024 * 1024 });
const sha = data => createHash('sha256').update(data).digest('hex');
const normalized = n => n.textContent.replace(/\s+/g, ' ').trim();
const r03Corrections = [['signed -128127, unsigned 0255', 'signed -128~127, unsigned 0~255'], ['signed -2⁶³2⁶³-1 / unsigned 02⁶⁴-1', 'signed -2⁶³~2⁶³-1 / unsigned 0~2⁶⁴-1']];
const index = { integrationBase: input.base, sourceSnapshot: input.sourceSnapshot, sourceWorktreeAtCapture: input.sourceWorktree, policy: 'main source and code preserved; original records remain immutable', files: {}, core: [], historicalSources: {}, generatedFixtures: {} };
const write = (original, value, reason) => {
  assert.equal(sha(read(original)), sha(git(input.sourceSnapshot, original)), `${original}: 원래 증거 불변`);
  const destination = `docs/design/concept-main-integration-2026-10-25/baselines/${Object.keys(index.files).length + 1}-${path.basename(original)}`;
  fs.mkdirSync(path.dirname(path.join(root, destination)), { recursive: true });
  const data = Buffer.from(JSON.stringify(value, null, 2) + '\n');
  fs.writeFileSync(path.join(root, destination), data);
  index.files[original] = { historicalSHA256: sha(read(original)), file: destination, sha256: sha(data), reason };
};
const oldPreservation = 'docs/design/concept-learning-night-2026-10-20/preservation-baseline.json';
const preservation = JSON.parse(read(oldPreservation));
const sourceByHistoricalHash = new Map(preservation.documents.map(e => [e.sha256, e.path]));
for (const entry of preservation.documents) {
  const main = git(input.base, entry.path);
  assert.equal(sha(read(entry.path)), sha(main), `${entry.path}: main Markdown 보존`);
  entry.sha256 = sha(main);
}
const historicalLearner = preservation.learnerServer;
const mainLearnerPaths = execFileSync('git', ['ls-tree', '-r', '--name-only', input.base, '--', 'src', 'build.gradle', 'settings.gradle', 'compose.yaml'], { cwd: root }).toString().trim().split('\n');
preservation.learnerServer = {};
index.learnerMapping = { historicalFiles: Object.keys(historicalLearner).length, historicalPathsAbsentInMain: Object.keys(historicalLearner).filter(p => !mainLearnerPaths.includes(p)), policy: 'preserve main exercise source; do not copy private learner files missing from main' };
for (const p of mainLearnerPaths) {
  const main = git(input.base, p);
  assert.equal(sha(read(p)), sha(main), `${p}: main 학습자 코드 보존`);
  preservation.learnerServer[p] = sha(main);
}
write(oldPreservation, preservation, '135 main documents and main learner files, independently checked against base Git objects');
const oldCommon = 'docs/design/concept-ia-2026-10-24/source-baseline.json';
const common = JSON.parse(read(oldCommon));
const baselines = execFileSync('git', ['ls-tree', '-r', '--name-only', input.sourceSnapshot, '--', 'docs/design'], { cwd: root }).toString().split('\n').filter(p => p.endsWith('/html-baseline.json'));
const wanted = new Set(baselines.flatMap(p => { const old = JSON.parse(read(p)); const source = sourceByHistoricalHash.get(old.sourceSHA256); return source && sha(read(source)) !== old.sourceSHA256 ? [source] : []; }));
const documents = new Map();
for (const page of common.pages.filter(p => p.sourceSelector)) {
  const current = new JSDOM(read(page.file).toString());
  const main = new JSDOM(git(input.base, page.file).toString());
  const d = current.window.document, m = main.window.document;
  const source = d.querySelector(page.sourceSelector);
  assert.ok(source, `${page.file}: source wrapper`);
  const currentCore = source.matches('.knowledge-chapters') ? source : source.querySelector('.knowledge-chapters');
  const mainCore = m.querySelector('.knowledge-chapters');
  assert.ok(currentCore && mainCore, `${page.file}: main chapter contract`);
  const actualText = normalized(currentCore), mainText = normalized(mainCore);
  let acceptedText = mainText;
  if (page.documentId === 'R03') for (const [from, to] of r03Corrections) {
    assert.equal(acceptedText.split(from).length - 1, 1);
    acceptedText = acceptedText.replace(from, to);
  }
  assert.equal(actualText, acceptedText, `${page.file}: main 기술 본문 보존`);
  const codes = n => [...n.querySelectorAll('pre code')].map(e => e.textContent);
  assert.deepEqual(codes(currentCore), codes(mainCore), `${page.file}: main 코드 바이트 보존`);
  const mainIds = [...m.querySelectorAll('[id]')].map(e => e.id);
  for (const id of mainIds) assert.ok(d.getElementById(id), `${page.file}: main ID ${id}`);
  const markdown = git(input.base, page.source);
  assert.equal(sha(read(page.source)), sha(markdown));
  page.sourceSHA256 = sha(markdown);
  page.sourceTextSHA256 = sha(normalized(source));
  page.sourceCode = codes(source).map(sha);
  page.existingIds = [...new Set([...mainIds, ...page.existingIds.filter(id => d.getElementById(id))])];
  index.core.push({ file: page.file, source: page.source, mainSHA256: sha(markdown), mainCoreTextSHA256: sha(mainText), acceptedCoreTextSHA256: sha(acceptedText), codeSHA256: codes(mainCore).map(sha), mainIds, approvedDifference: page.documentId === 'R03' ? 'existing literal range tilde rendering repair, exactly four characters' : null });
  if (wanted.has(page.source)) documents.set(page.source, { page, current, main });
  else { current.window.close(); main.window.close(); }
}
common.integrationBase = input.base;
write(oldCommon, common, '134 main chapter texts and code arrays independently compared; main IDs retained; R03 literal repair recorded');
for (const original of baselines) {
  const historical = JSON.parse(read(original));
  const sourcePath = sourceByHistoricalHash.get(historical.sourceSHA256);
  if (!sourcePath || sha(read(sourcePath)) === historical.sourceSHA256) continue;
  const context = documents.get(sourcePath);
  assert.ok(context, `${original}: 상세 source 계약`);
  const { page, current } = context, d = current.window.document;
  const source = d.querySelector(page.sourceSelector), clone = source.cloneNode(true);
  clone.querySelector(':scope > summary')?.remove();
  clone.querySelectorAll('script').forEach(e => e.remove());
  const title = d.querySelector('main > h1, h1.kr-source-title').textContent;
  const whole = n => `${title} ${n.textContent}`.replace(/\s+/g, ' ').trim();
  const value = structuredClone(historical);
  const archivedSource = `docs/design/concept-main-integration-2026-10-25/historical/knowledge/${path.basename(sourcePath)}`;
  const historicalSource = git(input.sourceSnapshot, sourcePath);
  assert.equal(sha(historicalSource), historical.sourceSHA256, `${sourcePath}: 실행 당시 source SHA`);
  fs.mkdirSync(path.dirname(path.join(root, archivedSource)), { recursive: true });
  fs.writeFileSync(path.join(root, archivedSource), historicalSource);
  index.historicalSources[sourcePath] = { file: archivedSource, sha256: sha(historicalSource), currentMainSHA256: sha(git(input.base, sourcePath)) };
  value.sourceSHA256 = sha(git(input.base, sourcePath));
  value.wholeSourceText = whole(clone);
  // R03의 기존 생성 검사는 이 두 렌더링 교정을 별도로 엄격히 적용한다.
  if (page.documentId === 'R03') for (const [from, to] of r03Corrections) {
    assert.equal(value.wholeSourceText.split(to).length - 1, 1);
    value.wholeSourceText = value.wholeSourceText.replace(to, from);
  }
  value.code = [...source.querySelectorAll('pre code')].map(e => e.textContent);
  if ('mermaid' in value) value.mermaid = [...source.querySelectorAll('.mermaid')].map(e => e.textContent);
  if ('withoutMermaidText' in value) { clone.querySelectorAll('.mermaid').forEach(e => e.remove()); value.withoutMermaidText = whole(clone); }
  for (const id of value.ids) assert.ok(d.getElementById(id), `${original}: 과거 anchor 유지 ${id}`);
  write(original, value, `${sourcePath}: approved main changes; main core and code preservation checked before adapting expected source`);
}
for (const { current, main } of documents.values()) { current.window.close(); main.window.close(); }
for (const [id, page] of [['D11', 'D11-web-security-basics.html'], ['D12', 'D12-linux-terminal-basics.html']]) {
  const originalHtml = git(input.sourceSnapshot, `docs/knowledge/${page}`);
  const original = new JSDOM(originalHtml.toString());
  const d = original.window.document;
  const fixture = `<div class="knowledge-reader-original">${d.querySelector('.knowledge-chapters').outerHTML}</div>${d.querySelector('.knowledge-page-map').outerHTML}`;
  const destination = `docs/design/concept-main-integration-2026-10-25/historical/generated/${id}-original.html`;
  fs.mkdirSync(path.dirname(path.join(root, destination)), { recursive: true });
  fs.writeFileSync(path.join(root, destination), fixture);
  index.generatedFixtures[id] = { file: destination, sha256: sha(fixture), sourceHtmlSHA256: sha(originalHtml), sourceRef: input.sourceSnapshot };
  original.window.close();
}
const indexFile = path.join(directory, 'baseline-overrides.json');
fs.writeFileSync(indexFile + '.tmp', JSON.stringify(index, null, 2) + '\n');
fs.renameSync(indexFile + '.tmp', indexFile);
console.log(`main 원문135/상세134 검증; 별도 baseline ${Object.keys(index.files).length}개 생성; 원래 증거 수정0`);
