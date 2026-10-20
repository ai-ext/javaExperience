// 공통 JPG의 실제 바이트·출처·크기와 현재 HTML 이미지 링크를 확인한다.
// 전체 디코딩과 시각·브라우저 검증은 별도이며 이 검사로 상태를 승격하지 않는다.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = name => fs.readFileSync(path.join(root, name));
const manifest = JSON.parse(read('docs/design/common-jpg-2026-10-21/manifest.json'));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const byFile = new Map(manifest.records.map(row => [row.file, row]));
const originalPaths = new Set(manifest.records.map(row => row.original));
assert.equal(byFile.size, manifest.count, '배포 이미지 중복 또는 누락');
assert.equal(originalPaths.size, manifest.count, '원본 이미지 중복 또는 누락');
assert.equal(manifest.settings.quality, 95);
assert.equal(manifest.settings.subsampling, 0);
assert.equal(manifest.settings.resize, false);

function jpegSize(bytes) {
  assert.equal(bytes.readUInt16BE(0), 0xffd8, 'JPEG signature');
  let offset = 2;
  while (offset < bytes.length) {
    assert.equal(bytes[offset++], 0xff, 'JPEG marker');
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if ([0xd8, 0xd9].includes(marker) || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = bytes.readUInt16BE(offset);
    assert.ok(length >= 2 && offset + length <= bytes.length, 'JPEG segment 범위');
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      const data = bytes.subarray(offset + 2, offset + length);
      for (let i = 0; i < data[5]; i++) assert.equal(data[7 + i * 3], 0x11, '색상 sampling 1×1');
      return { width: data.readUInt16BE(3), height: data.readUInt16BE(1) };
    }
    offset += length;
  }
  throw new Error('JPEG 크기 marker가 없다');
}

for (const row of manifest.records) {
  assert.equal(row.file, row.original.replace(/\.png$/, '.jpg'));
  assert.ok(!fs.existsSync(path.join(root, row.original)), row.original + ' 배포 PNG 잔존');
  const bytes = read(row.file);
  assert.equal(digest(bytes), row.sha256, row.file + ' 배포 SHA');
  assert.equal(bytes.length, row.bytes, row.file + ' 배포 bytes');
  assert.deepEqual(jpegSize(bytes), row.pixels, row.file + ' 원본과 같은 크기');
  assert.match(row.originalSha256, /^[a-f0-9]{64}$/);
}
for (const name of ['4-2-desktop-full', '4-2-p2-desktop-final-full', '4-2-p2-desktop-full']) {
  for (const extension of ['png', 'jpg']) {
    const filename = `work/browser-qa/${name}.${extension}`;
    assert.ok(!fs.existsSync(path.join(root, filename)), '공개 제외 캡처: ' + filename);
    assert.ok(!byFile.has(filename) && !originalPaths.has(filename), '공개 제외 manifest: ' + filename);
  }
}

function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (['node_modules', '.git', '.gradle', 'build'].includes(entry.name)) return [];
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? files(target) : [target];
  });
}
let metadata = 0;
function inspectAssets(value, parent) {
  if (Array.isArray(value)) return value.forEach(item => inspectAssets(item, parent));
  if (!value || typeof value !== 'object') return;
  if (typeof value.file === 'string') {
    const paths = [path.resolve(root, value.file), path.resolve(parent, value.file)];
    const row = paths.map(target => byFile.get(path.relative(root, target))).find(Boolean);
    if (row) {
      assert.equal(value.sha256, row.sha256, value.file + ' 자산 SHA');
      assert.equal(value.bytes, row.bytes, value.file + ' 자산 bytes');
      assert.equal(value.original.sha256, row.originalSha256, value.file + ' 원본 SHA');
      assert.equal(value.original.repositoryPath, row.original, value.file + ' 원본 경로');
      metadata++;
    }
  }
  for (const [key, child] of Object.entries(value)) {
    if (key !== 'original') inspectAssets(child, parent);
  }
}
const allFiles = files(root);
for (const file of allFiles.filter(file => /\/(?:asset-index|mockup-manifest)\.json$/.test(file))) {
  inspectAssets(JSON.parse(fs.readFileSync(file, 'utf8')), path.dirname(file));
}

let imageLinks = 0;
const missing = [];
for (const file of allFiles.filter(file => file.endsWith('.html') && !file.includes('/web-handoff/'))) {
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+\.(?:png|jpg|jpeg)(?:[?#][^"']*)?)["']/gi)) {
    const value = match[1];
    if (/^(?:[a-z]+:|\/\/)/i.test(value)) continue;
    const target = fileURLToPath(new URL(value, pathToFileURL(file)));
    imageLinks++;
    if (!fs.existsSync(target)) missing.push(`${path.relative(root, file)} → ${value}`);
  }
}
assert.equal(missing.length, 0, missing.join('\n'));
console.log(`공통 JPG ${byFile.size}개 SHA·크기·sampling, 자산 출처 ${metadata}건, HTML 이미지 링크 ${imageLinks}개 통과 (시각·브라우저 검증 아님)`);
