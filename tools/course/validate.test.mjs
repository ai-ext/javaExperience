import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSpecEndpoints, parseTalkCardIds, validate } from './validate.mjs';

const FX = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const load = () => ({
  spec: fs.readFileSync(path.join(FX, 'spec.md'), 'utf8'),
  roadmap: JSON.parse(fs.readFileSync(path.join(FX, 'roadmap.json'), 'utf8')),
  cards: fs.readFileSync(path.join(FX, 'cards.md'), 'utf8'),
  courseFiles: { 'spec-v2.md': '깨끗한 본문' },
});
const has = (errs, ...parts) => errs.some((e) => parts.every((p) => e.includes(p)));

test('parseSpecEndpoints는 엔드포인트 표만 읽는다', () => {
  const md = '| 메서드 | 경로 | 설명 |\n|---|---|---|\n| POST | /api/posts | a |\n| GET | /api/posts/{postId} | 조회 |\n\n| 코드 | 의미 |\n|---|---|\n| GET | /x |\n';
  assert.deepEqual(parseSpecEndpoints(md), ['POST /api/posts', 'GET /api/posts/{postId}']);
});

test('parseTalkCardIds는 TC-Dnn-n 제목만 읽는다', () => {
  assert.equal(parseTalkCardIds('### TC-D01-1\n\n### TC-D01-2\n\n### 기타\n').length, 2);
});

test('정상 픽스처는 오류가 없다', () => {
  assert.deepEqual(validate(load()), []);
});

test('일자 수가 15가 아니면 오류', () => {
  const i = load();
  i.roadmap.days.pop();
  assert.ok(has(validate(i), '15'));
});

test('build 단계 순서의 파일이 4개면 오류', () => {
  const i = load();
  i.roadmap.days[0].steps[0].files = ['a', 'b', 'c', 'd'];
  assert.ok(has(validate(i), 'D01', 'step 1'));
});

test('명세에 없는 specRef는 오류', () => {
  const i = load();
  i.roadmap.days[0].steps[0].specRefs.push('GET /api/posts/{id}');
  assert.ok(has(validate(i), 'GET /api/posts/{id}'));
});

test('어느 날에도 쓰이지 않은 엔드포인트는 오류', () => {
  const i = load();
  i.spec = i.spec.replace('| GET | /api/posts/{postId} | 조회 |\n', '| GET | /api/posts/{postId} | 조회 |\n| DELETE | /api/posts/{postId} | c |\n');
  assert.ok(has(validate(i), '미사용', 'DELETE /api/posts/{postId}'));
});

test('talkCards가 카드 문서에 없으면 오류', () => {
  const i = load();
  i.roadmap.days[0].talkCards.push('TC-D01-9');
  assert.ok(has(validate(i), 'TC-D01-9'));
});

test('카드 ID 중복이면 오류', () => {
  const i = load();
  i.cards += '\n### TC-D01-1\n\n중복\n';
  assert.ok(has(validate(i), '중복', 'TC-D01-1'));
});

test('카드 ID 형식(TC-D\\d{2}-\\d)이 아니면 오류', () => {
  const i = load();
  i.cards += '\n### TC-D1-1\n\n나쁜 형식\n';
  assert.ok(has(validate(i), 'TC-D1-1'));
});

test('하루 카드가 3개 미만이면 오류', () => {
  const i = load();
  i.roadmap.days[1].talkCards.pop();
  assert.ok(has(validate(i), 'D02', '3'));
});

test('Jn이 Dn과 짝이 아니면 오류', () => {
  const i = load();
  i.roadmap.days[4].java = 'J04';
  assert.ok(has(validate(i), 'D05', 'J04'));
});

test('maintain 단계에서 B01~B16 중 빠진 티켓이 있으면 오류', () => {
  const i = load();
  i.roadmap.days[13].steps[0].tickets = i.roadmap.days[13].steps[0].tickets.filter((t) => t !== 'B16');
  assert.ok(has(validate(i), 'B16'));
});

test('금지어가 course 파일에 있으면 오류', () => {
  for (const bad of ['Docker Desktop', 'StudyMate', '3주 만에 3~6년차']) {
    const i = load();
    i.courseFiles = { 'bad.md': `앞 ${bad} 뒤` };
    assert.ok(has(validate(i), 'bad.md'), bad);
  }
});

test('하루 카드가 5개 초과면 오류', () => {
  const i = load();
  for (let n = 4; n <= 6; n++) {
    i.roadmap.days[0].talkCards.push(`TC-D01-${n}`);
    i.cards += `\n### TC-D01-${n}\n\n본문\n`;
  }
  assert.ok(has(validate(i), 'D01', '5'));
});

test('D11이 build면 오류', () => {
  const i = load();
  i.roadmap.days[10].phase = 'build';
  assert.ok(has(validate(i), 'D11', 'maintain'));
});

test('일자 ID 순서가 어긋나면 오류', () => {
  const i = load();
  const d = i.roadmap.days;
  [d[1], d[2]] = [d[2], d[1]];
  assert.ok(has(validate(i), 'D02'));
});

test('java 배열에 J07이 없으면 오류', () => {
  const i = load();
  i.roadmap.java = i.roadmap.java.filter((j) => j.id !== 'J07');
  assert.ok(has(validate(i), 'J07'));
});

test('J05의 day가 D04면 오류', () => {
  const i = load();
  i.roadmap.java.find((j) => j.id === 'J05').day = 'D04';
  assert.ok(has(validate(i), 'J05', 'D05'));
});

test('다른 날 카드를 참조하면 오류', () => {
  const i = load();
  i.roadmap.days[4].talkCards[0] = 'TC-D03-1';
  assert.ok(has(validate(i), 'D05', 'TC-D03-1'));
});

test('실제 spec-v2는 엔드포인트 30개', () => {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const eps = parseSpecEndpoints(fs.readFileSync(path.join(root, 'course/spec-v2.md'), 'utf8'));
  assert.equal(eps.length, 30);
  assert.ok(eps.includes('POST /api/pg/callbacks'));
  assert.ok(eps.includes('GET /api/posts/{postId}'));
  assert.equal(new Set(eps).size, eps.length);
});
