import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCourseSources, sourceBundles, checkSourceBundles, GENERATED_NOTICE } from './sources.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const scratch = (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'course-sources-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, 'course'));
  fs.cpSync(path.join(root, 'course/days'), path.join(dir, 'course/days'), { recursive: true });
  return dir;
};
const edit = (dir, name, change) => {
  const file = path.join(dir, 'course/days', name);
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  change(value);
  fs.writeFileSync(file, JSON.stringify(value));
};

test('현재 합본은 날짜 원본으로 재생성한 결과와 같다', () => {
  assert.deepEqual(checkSourceBundles(root), []);
});

test('날짜 원본은 합본 없이 로드되고 기존 합본의 모든 값·카드 원문을 복원한다', (t) => {
  const dir = scratch(t);
  const data = loadCourseSources(dir);
  for (const name of ['roadmap', 'hints']) {
    const { $comment, ...expected } = JSON.parse(read(`course/${name}.json`));
    assert.deepEqual(data[name], expected);
  }
  assert.equal(data.cards, read('course/talk-cards.md'));
  assert.deepEqual(data.roadmap.java.map((j) => j.id), Array.from({ length: 16 }, (_, n) => `J${String(n).padStart(2, '0')}`));
});

test('날짜 파일명 순으로 합치며 새 D16 파일을 자동 발견한다', (t) => {
  const dir = scratch(t);
  const source = JSON.parse(read('course/days/D15.json'));
  const next = JSON.parse(JSON.stringify(source).replaceAll('D15', 'D16').replaceAll('J15', 'J16'));
  fs.writeFileSync(path.join(dir, 'course/days/D16.json'), JSON.stringify(next));
  const data = loadCourseSources(dir);
  assert.equal(data.roadmap.days.at(-1).id, 'D16');
  assert.equal(data.roadmap.java.at(-1).id, 'J16');
  assert.ok(data.hints.days.D16);
  assert.ok(data.cards.endsWith(next.cards));
});

test('날짜 파일 누락·잘못된 파일명·본문 ID·Java 연결을 거부한다', (t) => {
  for (const [name, change, expected] of [
    ['D03.json', (d) => { d.id = 'D04'; }, /D03.*id/],
    ['D03.json', (d) => { d.roadmap.id = 'D04'; }, /D03.*roadmap/],
    ['D03.json', (d) => { d.java.day = 'D04'; }, /D03.*java/],
    ['D03.json', (d) => { d.java.id = 'J04'; }, /D03.*java/],
  ]) {
    const dir = scratch(t);
    edit(dir, name, change);
    assert.throws(() => loadCourseSources(dir), expected);
  }
  const missing = scratch(t);
  fs.unlinkSync(path.join(missing, 'course/days/D03.json'));
  assert.throws(() => loadCourseSources(missing), /D03/);
  const invalid = scratch(t);
  fs.renameSync(path.join(invalid, 'course/days/D03.json'), path.join(invalid, 'course/days/D3.json'));
  assert.throws(() => loadCourseSources(invalid), /D3.json/);
});

test('카드의 날짜·ID·순서가 roadmap과 다르면 거부한다', (t) => {
  for (const change of [
    (d) => { d.cards = d.cards.replace('## D03', '## D04'); },
    (d) => { d.cards = d.cards.replace('TC-D03-1', 'TC-D04-1'); },
    (d) => { d.roadmap.talkCards.reverse(); },
  ]) {
    const dir = scratch(t);
    edit(dir, 'D03.json', change);
    assert.throws(() => loadCourseSources(dir), /D03.*cards/);
  }
});

test('공통 원본에 날짜 목록이 중복되면 거부한다', (t) => {
  const dir = scratch(t);
  edit(dir, '_common.json', (d) => { d.hints.days = {}; });
  assert.throws(() => loadCourseSources(dir), /_common.*days/);
});

test('합본 경고는 표준 JSON이고 손편집·누락은 검사에서 감지한다', (t) => {
  const dir = scratch(t);
  const files = sourceBundles(loadCourseSources(dir));
  for (const [rel, content] of files) fs.writeFileSync(path.join(dir, rel), content);
  assert.deepEqual(checkSourceBundles(dir), []);
  for (const name of ['roadmap', 'hints']) {
    const text = fs.readFileSync(path.join(dir, `course/${name}.json`), 'utf8');
    assert.equal(JSON.parse(text).$comment, GENERATED_NOTICE);
    assert.ok(text.startsWith('{\n  "$comment":'));
  }
  fs.appendFileSync(path.join(dir, 'course/roadmap.json'), ' ');
  fs.unlinkSync(path.join(dir, 'course/hints.json'));
  fs.appendFileSync(path.join(dir, 'course/talk-cards.md'), '\n손편집');
  assert.deepEqual(checkSourceBundles(dir), ['course/roadmap.json', 'course/hints.json', 'course/talk-cards.md']);
});
