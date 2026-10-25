import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rasterDimensions } from './raster-size.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const artifactDir = path.join(root, 'docs/design/concept-main-integration-2026-10-25');
const baseline = JSON.parse(fs.readFileSync(path.join(artifactDir, 'jpg-integration-baseline.json'), 'utf8'));
const receiptBytes = fs.readFileSync(path.join(root, baseline.historicalEvidence.receiptPath));
const questionsBytes = fs.readFileSync(path.join(root, baseline.historicalEvidence.pngEvidencePath));
const manifest = JSON.parse(receiptBytes);
const questions = JSON.parse(questionsBytes);
const provenance = JSON.parse(fs.readFileSync(path.join(artifactDir, 'jpg-provenance-verification.json'), 'utf8'));
const provenanceBytes = fs.readFileSync(path.join(artifactDir, 'jpg-provenance-verification.json'));
const proofRows = new Map(provenance.sourceVerification.map(row => [row.source, row]));
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const allPublicFiles = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root })
  .toString('utf8').split('\0').filter(Boolean).filter(file => !file.split('/').includes('node_modules'));

assert.equal(baseline.schemaVersion, 1);
assert.equal(baseline.fixedInputs.base, 'a70f1bd531c1b72077d56e7363ff424ba5795143');
assert.equal(baseline.fixedInputs.sourceSnapshot, 'af274f94e72ee2a344329c1e3bd3f1f70737c690');
assert.equal(baseline.expectedJpgCount, 2345);
assert.equal(baseline.inputCounts.baseJpg, 602);
assert.equal(baseline.inputCounts.conceptOnlyJpg, 1743);
assert.equal(baseline.inputCounts.sourceSnapshotCommonPaths, 141);
assert.equal(baseline.inputCounts.uniqueExpectedJpg, 2345);

const expectedByPath = new Map(baseline.expectedJpgs.map(row => [row.path, row]));
const extraByPath = new Map(baseline.extraCandidateJpgs.map(row => [row.path, row]));
const overlapByPath = new Map(baseline.overlapDifferences.map(row => [row.path, row]));
assert.equal(expectedByPath.size, 2345, '고정 JPG 경로 중복 없음');
assert.equal(extraByPath.size, baseline.extraCandidateJpgs.length, '추가 JPG 경로 중복 없음');
assert.equal(overlapByPath.size, baseline.overlapDifferences.length, 'main/source 차이 경로 중복 없음');
assert.equal(overlapByPath.size, 56, '같은 경로의 다른 JPG 56개 차이 근거');
for (const overlap of baseline.overlapDifferences) {
  const main = expectedByPath.get(overlap.path);
  assert.ok(main, `${overlap.path} main/source 차이 기준 등록`);
  assert.equal(main.originRef, 'base', `${overlap.path}는 main 입력 우선`);
  assert.equal(main.sha256, overlap.baseSha256, `${overlap.path} main SHA 기록`);
  assert.match(overlap.sourceSnapshotSha256, /^[a-f0-9]{64}$/);
  assert.equal(overlap.selectedOrigin, 'base');
}
for (const row of baseline.expectedJpgs) {
  assert.match(row.sha256, /^[a-f0-9]{64}$/);
  assert.match(row.gitBlob, /^[a-f0-9]{40}$/);
  assert.ok(['base', 'sourceSnapshot'].includes(row.originRef));
  assert.equal(row.originRevision, baseline.fixedInputs[row.originRef]);
  assert.equal(row.format, 'jpeg');
}

function verifyPinnedFile(row, bytes, label) {
  assert.ok(row, `${label} 기준 등록`);
  assert.equal(sha256(bytes), row.sha256, `${label} pinned SHA`);
  assert.equal(bytes.length, row.bytes, `${label} byte 수`);
  assert.deepEqual(rasterDimensions(bytes), { format: 'jpeg', width: row.width, height: row.height }, `${label} JPEG 치수`);
}

for (const row of baseline.expectedJpgs) {
  const file = path.join(root, row.path);
  assert.ok(fs.existsSync(file), `${row.path} 실제 파일 존재`);
  verifyPinnedFile(row, fs.readFileSync(file), row.path);
}

const candidateJpgPaths = allPublicFiles.filter(file => /\.jpe?g$/i.test(file)).sort();
const pinnedPaths = new Set([...expectedByPath.keys(), ...extraByPath.keys()]);
const candidateSet = new Set(candidateJpgPaths);
for (const file of pinnedPaths) assert.ok(candidateSet.has(file), `baseline 경로 누락: ${file}`);
const unexpectedJpgs = candidateJpgPaths.filter(file => !pinnedPaths.has(file));
assert.deepEqual(unexpectedJpgs, [], '새 추가 JPG는 고정 입력 baseline의 extra 목록에 등록');
for (const row of baseline.extraCandidateJpgs) {
  const bytes = fs.readFileSync(path.join(root, row.path));
  verifyPinnedFile(row, bytes, `추가 JPG ${row.path}`);
  assert.equal(row.pinnedInput, false, `${row.path}는 고정 입력 합계에서 제외`);
}

const publicPngPaths = allPublicFiles.filter(file => /\.png$/i.test(file));
assert.deepEqual(publicPngPaths, [], '공개 추적/비무시 파일 PNG 0개');

assert.equal(sha256(receiptBytes), baseline.historicalEvidence.receiptSha256, '419개 과거 receipt 원문 SHA 보존');
assert.equal(manifest.images.length, 419, '과거 JPG 전환 receipt 419행 보존');
assert.equal(manifest.images.filter(row => row.retainPNG).length, 56, '과거 receipt 보존 PNG 표기 56행 유지');
assert.equal(manifest.images.filter(row => !row.retainPNG).length, 363, '과거 receipt 제거 PNG 표기 363행 유지');
assert.equal(sha256(questionsBytes), baseline.historicalEvidence.pngEvidenceSha256, 'P09 imageEvidence 원문 SHA 보존');
const pngEvidenceEntries = questions.questions.flatMap(question => question.imageEvidence || []).filter(file => file.endsWith('.png'));
const pngEvidencePaths = [...new Set(pngEvidenceEntries)].sort();
assert.equal(pngEvidenceEntries.length, 79, 'P09 PNG imageEvidence 항목 79개 보존');
assert.equal(pngEvidencePaths.length, 44, 'P09 PNG imageEvidence 고유 경로 44개');
assert.deepEqual(pngEvidencePaths, baseline.historicalEvidence.pngEvidencePaths, 'P09 PNG source 경로 목록 고정');

const receiptBySource = new Map(manifest.images.map(row => [row.source, row]));
assert.equal(receiptBySource.size, 419, 'receipt source 등록 누락/중복 없음');
function rowForSource(source) {
  const row = receiptBySource.get(source);
  assert.ok(row, `${source} conversion-manifest source 등록`);
  return row;
}
function verifyHistoricalRegistration(row, source) {
  assert.equal(row.source, source, `${source} historical source 경로`);
  assert.match(row.sourceSHA256 || '', /^[a-f0-9]{64}$/, `${source} historical source SHA`);
  assert.match(row.sourceGitBlob || '', /^[a-f0-9]{40}$/, `${source} historical source Git blob ID`);
  assert.match(row.sha256 || '', /^[a-f0-9]{64}$/, `${source} destination SHA`);
  assert.equal(path.extname(row.destination), '.jpg', `${source} JPG 경로 매핑`);
  const proof = proofRows.get(source);
  assert.ok(proof, `${source} 조립 시점 provenance 등록`);
  assert.equal(row.sourceSHA256, proof.sourceSha256, `${source} historical source SHA pinned provenance`);
  assert.equal(row.sourceGitBlob, proof.sourceGitBlob, `${source} historical source blob pinned provenance`);
  assert.equal(row.sha256, proof.destinationSha256, `${source} historical destination SHA pinned provenance`);
}

for (const source of pngEvidencePaths) verifyHistoricalRegistration(rowForSource(source), source);
for (const row of manifest.images) verifyHistoricalRegistration(row, row.source);

assert.equal(provenance.receiptSha256, baseline.historicalEvidence.receiptSha256);
assert.equal(sha256(provenanceBytes), baseline.provenanceVerificationSha256, '원본 검증 provenance 기록 SHA 고정');
assert.equal(provenance.pngEvidenceSha256, baseline.historicalEvidence.pngEvidenceSha256);
assert.equal(provenance.receiptEntries, 419);
assert.equal(provenance.pngEvidenceEntries, 79);
assert.equal(provenance.pngEvidenceUniquePaths, 44);
assert.equal(proofRows.size, 419, '조립 시점 원본 PNG 검증 기록 419개');
for (const [source, row] of receiptBySource) {
  verifyHistoricalRegistration(row, source);
  const proof = proofRows.get(source);
  assert.ok(proof, `${source} 원본 검증 기록 등록`);
  assert.equal(proof.result, 'verified', `${source} 조립 시점 원본 검증 결과`);
  assert.equal(proof.sourceSha256, row.sourceSHA256, `${source} PNG SHA provenance 일치`);
  assert.equal(proof.sourceGitBlob, row.sourceGitBlob, `${source} PNG blob provenance 일치`);
  assert.equal(proof.destination, row.destination, `${source} JPG destination provenance 일치`);
  assert.equal(proof.destinationSha256, row.sha256, `${source} JPG destination receipt SHA 일치`);
  const expected = expectedByPath.get(row.destination);
  assert.ok(expected, `${source} JPG destination이 공개 baseline에 등록`);
  if (expected.sha256 !== row.sha256) {
    const overlap = overlapByPath.get(row.destination);
    assert.ok(overlap, `${source} main/source 바이트 차이 등록`);
    assert.equal(overlap.selectedOrigin, 'base', `${source} main 입력 우선`);
    assert.equal(overlap.baseSha256, expected.sha256, `${source} main SHA 차이 기록`);
    assert.equal(overlap.sourceSnapshotSha256, row.sha256, `${source} sourceSnapshot JPG와 receipt SHA 연결`);
  }
}

const historicalTests = [
  ['test-jpg-migration.mjs', 'historical-tests/test-jpg-migration.mjs'],
  ['test-raster-size.mjs', 'historical-tests/test-raster-size.mjs']
];
for (const [name, relativePath] of historicalTests) {
  const bytes = fs.readFileSync(path.join(artifactDir, relativePath));
  assert.equal(sha256(bytes), baseline.historicalTestCopies[name], `${name} 바이트 원본 복사`);
}

let htmlReferences = 0;
for (const file of fs.readdirSync(path.join(root, 'docs/knowledge')).filter(file => file.endsWith('.html'))) {
  const htmlPath = path.join(root, 'docs/knowledge', file);
  const html = fs.readFileSync(htmlPath, 'utf8');
  for (const match of html.matchAll(/(?:src|href)=["']([^"']+\.(?:png|jpe?g)(?:[?#][^"']*)?)["']/gi)) {
    const target = match[1].split(/[?#]/, 1)[0];
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    assert.equal(path.extname(target).toLowerCase(), '.jpg', `${file} 로컬 raster는 JPG`);
    const resolved = target.startsWith('/')
      ? path.join(root, target.replace(/^\/+/, ''))
      : path.resolve(path.dirname(htmlPath), target);
    assert.ok(fs.existsSync(resolved), `${file} 로컬 raster 파일 존재: ${target}`);
    assert.equal(rasterDimensions(fs.readFileSync(resolved)).format, 'jpeg', `${file} 실제 JPEG 형식: ${target}`);
    htmlReferences++;
  }
}
assert.ok(htmlReferences > 0, '지식 HTML local raster 참조를 검사');

assert.throws(() => rowForSource(`${pngEvidencePaths[0]}-unregistered`), /conversion-manifest source 등록/, '미등록 source 변이 거부');
assert.throws(() => verifyHistoricalRegistration({ ...receiptBySource.get(pngEvidencePaths[0]), sourceSHA256: '0'.repeat(64) }, pngEvidencePaths[0]), /historical source SHA/, '잘못된 source SHA 변이 거부');
assert.throws(() => verifyHistoricalRegistration({ ...receiptBySource.get(pngEvidencePaths[0]), sourceGitBlob: '' }, pngEvidencePaths[0]), /historical source Git blob ID/, '잘못된 source blob 변이 거부');
assert.throws(() => verifyPinnedFile({ ...baseline.expectedJpgs[0], sha256: '0'.repeat(64) }, fs.readFileSync(path.join(root, baseline.expectedJpgs[0].path)), '변이'), /pinned SHA/, '잘못된 공개 JPG SHA 변이 거부');

console.log(`JPG 통합 기준: ${baseline.expectedJpgCount}개 고정 입력 SHA/byte/치수, 추가 JPG ${extraByPath.size}개, PNG 0개, 과거 receipt 419행·imageEvidence 79항목 및 원본 provenance, knowledge HTML JPG 참조 ${htmlReferences}개 통과`);
