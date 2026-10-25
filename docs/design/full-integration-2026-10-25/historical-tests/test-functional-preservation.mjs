// 새 기능 화면 때문에 기존 과제·개념·학생 코드가 변경되지 않았는지 확인한다.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baseline = JSON.parse(fs.readFileSync(path.join(root,
  'docs/design/scenario-crud-2026-10-20/preservation-baseline.json'), 'utf8'));
const failures = [];
const migratedImages = JSON.parse(fs.readFileSync(path.join(root,
  'docs/design/jpg-migration-2026-10-20/manifest.json'), 'utf8')).records;
let imageLinksOnly = 0;
for (const file of baseline) {
  const target = path.join(root, file.path);
  if (!fs.existsSync(target)) {
    failures.push(`없어진 원문: ${file.path}`);
    continue;
  }
  const actual = createHash('sha256').update(fs.readFileSync(target)).digest('hex');
  if (actual !== file.sha256) {
    // 이미지 포맷 변경으로 허용한 정확한 경로만 되돌려 원래 본문 해시와 대조한다.
    let original = fs.readFileSync(target, 'utf8');
    for (const image of migratedImages) original = original.replaceAll(image.file, image.original);
    const normalized = createHash('sha256').update(original).digest('hex');
    if (normalized !== file.sha256) failures.push(`변경된 원문: ${file.path}`);
    else imageLinksOnly++;
  }
}
assert.equal(failures.length, 0, failures.join('\n'));
assert.ok(baseline.some(file => file.path.startsWith('src/')), '학생 코드가 보존 검사에 포함되어야 한다');
assert.ok(baseline.some(file => file.path === 'scenario/scenario.json'), '기존 단계 목록을 보존한다');
assert.ok(baseline.some(file => file.path === 'scenario/snapshots/3-2.json'), '정본 파일 목록을 보존한다');
console.log(`원문 보존: ${baseline.length - imageLinksOnly}개 SHA-256 동일, ${imageLinksOnly}개는 기록된 JPG 이미지 경로만 변경·원래 본문 SHA-256 동일`);
