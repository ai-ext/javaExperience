// 조립 시점 전용 provenance 생성기다. 공개 CI는 이 파일을 실행하지 않고 고정 manifest만 검사한다.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rasterDimensions } from '../../../tools/site/raster-size.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const input = JSON.parse(fs.readFileSync(path.join(artifactDir, 'INPUT.json'), 'utf8'));
const sourceRoot = input.sourceWorktree;
const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const gitBlobOid = bytes => crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const git = args => execFileSync('git', args, { cwd: root, maxBuffer: 64 * 1024 * 1024 });
const gitText = args => git(args).toString('utf8');
const blobBytes = oid => git(['cat-file', 'blob', oid]);
const treeBlobMap = revision => new Map(gitText(['ls-tree', '-r', revision]).split('\n').filter(Boolean)
  .map(line => {
    const [metadata, file] = line.split('\t');
    const [, type, oid] = metadata.split(' ');
    return type === 'blob' && /\.jpe?g$/i.test(file) ? [file, oid] : null;
  }).filter(Boolean));
const trackedAndUntracked = git(['ls-files', '--cached', '--others', '--exclude-standard', '-z'])
  .toString('utf8').split('\0').filter(Boolean);

assert.equal(input.base, 'a70f1bd531c1b72077d56e7363ff424ba5795143');
assert.equal(input.sourceSnapshot, 'af274f94e72ee2a344329c1e3bd3f1f70737c690');
assert.equal(gitText(['rev-parse', 'HEAD']).trim(), input.base, '후보 부모가 고정 main 입력과 일치');

const baseBlobs = treeBlobMap(input.base);
const sourceBlobs = treeBlobMap(input.sourceSnapshot);
const expectedPaths = [...new Set([...baseBlobs.keys(), ...sourceBlobs.keys()])].sort();
const sourceCommonPaths = [...sourceBlobs.keys()].filter(file => baseBlobs.has(file));
assert.equal(baseBlobs.size, 602);
assert.equal(sourceBlobs.size, 1884);
assert.equal(sourceCommonPaths.length, 141);
assert.equal(sourceBlobs.size - sourceCommonPaths.length, 1743);
assert.equal(expectedPaths.length, 2345);

const candidates = trackedAndUntracked.filter(file => /\.jpe?g$/i.test(file) && !file.split('/').includes('node_modules'));
const candidateSet = new Set(candidates);
for (const file of expectedPaths) assert.ok(candidateSet.has(file), `고정 입력 JPG 누락: ${file}`);
const expectedSet = new Set(expectedPaths);
const extras = candidates.filter(file => !expectedSet.has(file)).sort();

const entries = expectedPaths.map(file => {
  const originRef = baseBlobs.has(file) ? 'base' : 'sourceSnapshot';
  const originRevision = originRef === 'base' ? input.base : input.sourceSnapshot;
  const originBlob = (originRef === 'base' ? baseBlobs : sourceBlobs).get(file);
  const actual = fs.readFileSync(path.join(root, file));
  const dimensions = rasterDimensions(actual);
  assert.equal(dimensions.format, 'jpeg', `${file} 고정 Git 입력이 JPEG`);
  assert.equal(gitBlobOid(actual), originBlob, `${file} 후보 파일이 우선순위 고정 Git blob과 동일`);
  return {
    path: file,
    sha256: sha256(actual),
    gitBlob: originBlob,
    originRef,
    originRevision,
    bytes: actual.length,
    format: dimensions.format,
    width: dimensions.width,
    height: dimensions.height
  };
});

const receiptPath = 'docs/design/jpg-2026-10-20/conversion-manifest.json';
const questionsPath = 'docs/design/p09-2026-10-20/questions.json';
const receiptBytes = fs.readFileSync(path.join(root, receiptPath));
const questionBytes = fs.readFileSync(path.join(root, questionsPath));
const receipt = JSON.parse(receiptBytes);
const questions = JSON.parse(questionBytes);
assert.equal(receipt.images.length, 419);
const pngEvidence = [...new Set(questions.questions.flatMap(question => question.imageEvidence || []).filter(file => file.endsWith('.png')))].sort();
const pngEvidenceEntries = questions.questions.flatMap(question => question.imageEvidence || []).filter(file => file.endsWith('.png'));
assert.equal(pngEvidenceEntries.length, 79);
assert.equal(pngEvidence.length, 44);

const provenance = {
  schemaVersion: 1,
  checkedAtUTC: new Date().toISOString(),
  policy: 'PNG 원본 Git 객체는 조립 시점에 검증한다. 공개 CI는 PNG를 재보관하거나 private sourceSnapshot blob을 읽지 않는다. 기대 JPG는 공개 후보의 파일이므로 고정 Git 입력 SHA와 파일 SHA를 비교한다.',
  sourceWorktree: sourceRoot,
  sourceHead: input.sourceHead,
  sourceSnapshot: input.sourceSnapshot,
  receiptPath,
  receiptSha256: sha256(receiptBytes),
  receiptEntries: receipt.images.length,
  pngEvidencePath: questionsPath,
  pngEvidenceSha256: sha256(questionBytes),
  pngEvidenceEntries: pngEvidenceEntries.length,
  pngEvidenceUniquePaths: pngEvidence.length,
  sourceVerification: []
};
const sourceRows = new Map(receipt.images.map(row => [row.source, row]));
assert.equal(sourceRows.size, 419, 'receipt source 경로 중복 없음');
for (const [index, row] of receipt.images.entries()) {
  const sourceBytes = blobBytes(row.sourceGitBlob);
  assert.equal(sha256(sourceBytes), row.sourceSHA256, `${row.source} 원본 PNG blob SHA`);
  const sourceDimensions = rasterDimensions(sourceBytes);
  assert.deepEqual(sourceDimensions, { format: 'png', width: row.sourceWidth, height: row.sourceHeight }, `${row.source} PNG IHDR 치수`);
  const destination = fs.readFileSync(path.join(sourceRoot, row.destination));
  assert.equal(sha256(destination), row.sha256, `${row.destination} source worktree destination SHA`);
  assert.equal(destination.length, row.bytes, `${row.destination} source worktree destination byte 수`);
  assert.deepEqual(rasterDimensions(destination), { format: 'jpeg', width: row.width, height: row.height }, `${row.destination} JPEG 치수`);
  provenance.sourceVerification.push({
    source: row.source,
    sourceSha256: row.sourceSHA256,
    sourceGitBlob: row.sourceGitBlob,
    sourceBytes: sourceBytes.length,
    sourceFormat: sourceDimensions.format,
    sourceWidth: sourceDimensions.width,
    sourceHeight: sourceDimensions.height,
    destination: row.destination,
    destinationSha256: sha256(destination),
    destinationBytes: destination.length,
    destinationWidth: row.width,
    destinationHeight: row.height,
    result: 'verified'
  });
  if (index % 100 === 99) process.stderr.write(`PNG 원본과 JPG 출처 검증 ${index + 1}/419\n`);
}

const overlapDifferences = [];
for (const file of [...baseBlobs.keys()].filter(file => sourceBlobs.has(file)).sort()) {
  if (baseBlobs.get(file) !== sourceBlobs.get(file)) {
    const baseBytes = fs.readFileSync(path.join(root, file));
    const sourceBytes = fs.readFileSync(path.join(sourceRoot, file));
    assert.equal(gitBlobOid(baseBytes), baseBlobs.get(file), `${file} main 입력 bytes`);
    assert.equal(gitBlobOid(sourceBytes), sourceBlobs.get(file), `${file} sourceSnapshot 입력 bytes`);
    overlapDifferences.push({
      path: file,
      baseSha256: sha256(baseBytes),
      baseGitBlob: baseBlobs.get(file),
      sourceSnapshotSha256: sha256(sourceBytes),
      sourceSnapshotGitBlob: sourceBlobs.get(file),
      selectedOrigin: 'base',
      reason: '같은 경로가 서로 다른 입력 바이트를 가지므로 공개 main 입력 보존 우선'
    });
  }
}

const baseline = {
  schemaVersion: 1,
  checkedAtUTC: new Date().toISOString(),
  fixedInputs: { base: input.base, sourceSnapshot: input.sourceSnapshot },
  policy: 'base에 있는 경로는 base blob, 그 외 경로는 sourceSnapshot blob을 기대값으로 사용한다. 공개 CI는 이 두 private 입력 객체를 읽지 않고 이 manifest에 고정된 공개 JPG SHA를 후보 파일과 대조한다.',
  expectedJpgCount: entries.length,
  inputCounts: {
    baseJpg: baseBlobs.size,
    sourceSnapshotJpg: sourceBlobs.size,
    sourceSnapshotCommonPaths: sourceCommonPaths.length,
    conceptOnlyJpg: sourceBlobs.size - sourceCommonPaths.length,
    uniqueExpectedJpg: expectedPaths.length
  },
  overlapDifferences,
  expectedJpgs: entries,
  extraCandidateJpgs: extras.map(file => {
    const bytes = fs.readFileSync(path.join(root, file));
    const dimensions = rasterDimensions(bytes);
    return { path: file, sha256: sha256(bytes), bytes: bytes.length, format: dimensions.format, width: dimensions.width, height: dimensions.height, pinnedInput: false };
  }),
  historicalEvidence: {
    receiptPath,
    receiptSha256: provenance.receiptSha256,
    receiptEntries: provenance.receiptEntries,
    pngEvidencePath: questionsPath,
    pngEvidenceSha256: provenance.pngEvidenceSha256,
    pngEvidenceEntries: provenance.pngEvidenceEntries,
    pngEvidenceUniquePaths: provenance.pngEvidenceUniquePaths,
    pngEvidencePaths: pngEvidence
  },
  historicalTestCopies: {
    'test-jpg-migration.mjs': '7666e9a694305c7d8ee397321bf97b8dd48b80284e5f94130bdaef3b575f1ec3',
    'test-raster-size.mjs': 'b13f10c0766bf9fd74537ff0cc47fc316c8b88953caffb03347649d27699e639'
  },
  provenanceVerificationSha256: sha256(Buffer.from(`${JSON.stringify(provenance, null, 2)}\n`))
};
assert.equal(provenance.sourceVerification.length, 419);
fs.writeFileSync(path.join(artifactDir, 'jpg-integration-baseline.json'), `${JSON.stringify(baseline, null, 2)}\n`);
fs.writeFileSync(path.join(artifactDir, 'jpg-provenance-verification.json'), `${JSON.stringify(provenance, null, 2)}\n`);
console.log(JSON.stringify({ expectedJpgs: entries.length, extras: extras.length, overlapDifferences: overlapDifferences.length, pngSourcesVerified: provenance.sourceVerification.length, receiptSha256: provenance.receiptSha256, pngEvidenceSha256: provenance.pngEvidenceSha256 }));
