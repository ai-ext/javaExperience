// 공개 main의 변경과 과거 실행 증거를 분리한 통합 검사 기준이다.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const digest = data => createHash('sha256').update(data).digest('hex');
const directoryOf = root => root instanceof URL ? fileURLToPath(root) : root;
const indexAt = root => JSON.parse(fs.readFileSync(path.join(directoryOf(root), 'docs/design/concept-main-integration-2026-10-25/baseline-overrides.json')));
export function loadSourceBaseline(root, relative) {
  const directory = directoryOf(root);
  const historical = fs.readFileSync(path.join(directory, relative));
  const index = JSON.parse(fs.readFileSync(path.join(directory, 'docs/design/concept-main-integration-2026-10-25/baseline-overrides.json')));
  const entry = index.files[relative];
  if (!entry) return JSON.parse(historical);
  assert.equal(digest(historical), entry.historicalSHA256, `${relative}: 과거 기준 불변`);
  const current = fs.readFileSync(path.join(directory, entry.file));
  assert.equal(digest(current), entry.sha256, `${relative}: 승인된 통합 기준 불변`);
  return JSON.parse(current);
}
export function readHistoricalSource(root, relative) {
  const entry = indexAt(root).historicalSources[relative];
  assert.ok(entry, `${relative}: 실행 당시 원문 등록`);
  const current = fs.readFileSync(path.join(directoryOf(root), relative));
  assert.equal(digest(current), entry.currentMainSHA256, `${relative}: 최신 main 원문 보존`);
  const historical = fs.readFileSync(path.join(directoryOf(root), entry.file));
  assert.equal(digest(historical), entry.sha256, `${relative}: 실행 당시 원문 보존`);
  return historical.toString('utf8');
}
export function resolveHistoricalAsset(root, recorded) {
  const oldRoot = indexAt(root).sourceWorktreeAtCapture;
  const original = recorded.startsWith('file:') ? fileURLToPath(recorded) : recorded;
  assert.ok(path.posix.isAbsolute(original));
  const relative = path.posix.relative(oldRoot, original);
  assert.ok(relative && !relative.startsWith('../') && !path.posix.isAbsolute(relative), '승인된 원본 worktree 안의 자산 경로');
  return path.resolve(directoryOf(root), relative);
}
export function readHistoricalGeneratedFixture(root, id) {
  const entry = indexAt(root).generatedFixtures[id];
  assert.ok(entry, `${id}: 고정 원문 DOM 기준 등록`);
  const data = fs.readFileSync(path.join(directoryOf(root), entry.file));
  assert.equal(digest(data), entry.sha256, `${id}: 고정 원문 DOM 기준 불변`);
  return data.toString('utf8');
}
