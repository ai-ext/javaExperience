import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { P09_LESSONS } from './p09-lesson-data.mjs';
import { P09_ASSETS } from './p09-assets.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));
const hash = (value) => createHash('sha256').update(value).digest('hex');
const lessonsById = new Map(P09_LESSONS.map((lesson) => [lesson.id, lesson]));
const shared = lessonsById.get('shared-state');
const varargs = lessonsById.get('varargs-selection');
const expectedActiveLines = {
  'shared-before':['        RequestState a = new RequestState(), b = new RequestState();'],
  'shared-after-a':['        void record(String name, int value) { quantity = value; latestName = name; }','        a.record("Ada", 2);'],
  'shared-after-b':['        void record(String name, int value) { quantity = value; latestName = name; }','        b.record("Grace", 5);'],
  'sum-empty':['        out("sumEmpty", sum());'],
  'sum-items':['out("sumItems", sum(2, 3));'],
  'sum-array':['        out("sumArray", sum(new int[]{4, 6}));'],
  'choose-fixed':['    static String choose(int first, int second) { return "fixed(int,int)"; }','        out("chooseTwo", choose(2, 3));'],
  'choose-array':['    static String choose(int... values) { return "varargs(int[])"; }','out("chooseArray", choose(new int[]{2, 3}));'],
  'choose-empty':['    static String choose(int... values) { return "varargs(int[])"; }','        out("chooseEmpty", choose());'],
};
const expectedFocus = {
  'sum-empty':[2,25,32,29], 'sum-items':[35,25,31,29], 'sum-array':[66,25,33,29],
  'choose-fixed':[2,72,32,17], 'choose-array':[35,72,31,17], 'choose-empty':[66,72,33,17],
};
assert.ok(shared, 'shared-state 질문 등록');
assert.ok(varargs, 'varargs-selection 질문 등록');
assert.equal(shared.stages.length, 3);
assert.equal(varargs.stages.length, 6);

const history = json('docs/design/p09-2026-10-20/browser-all-states.json').observations;
const historicalIds = new Set(history.map((item) => `${item.topic}/${item.expected}`));
const currentHistoricalIds = new Set(P09_LESSONS.flatMap((lesson) => lesson.stages
  .filter((stage) => !['shared-state', 'varargs-selection'].includes(lesson.id))
  .map((stage) => `${lesson.id}/${stage.id}`)));
assert.deepEqual(currentHistoricalIds, historicalIds, '기존84상태 ID 집합을 정확히 보존');
assert.equal(history.length, 168, '기존 browser history의 desktop/mobile 168행을 보존');
assert.equal(historicalIds.size, 84, '기존 browser history의 고유 상태는 84개');
assert.equal(json('docs/design/p09-2026-10-20/questions.json').questions.length, 27, '기존 질문 27개 보존');

const proofPath = 'docs/design/p09-completion-2026-10-24/proof/P09BoundariesProof.java';
const proof = read(proofPath);
const proofMeta = json('docs/design/p09-completion-2026-10-24/proof/execution.json');
assert.equal(hash(proof), '527af7d57af199b72a6c83cd61a4de1771a98e32c7b6e1eafb39410ce2bfe95b', '추가 Java proof 원문 SHA 보존');
assert.equal(hash(proof), proofMeta.sourceSHA256, 'execution source SHA 일치');
const expected = proofMeta.expected;
const actual = proofMeta.actual;
assert.deepEqual(actual, expected, '13개 Java 실행 관측값');
assert.equal(Object.keys(expected).length, 13);
const [initialA, initialB, initialName] = actual.initial.split('/');
const [afterAA, afterAB, afterAName] = actual.afterA.split('/');
const [afterBA, afterBB, afterBName] = actual.afterB.split('/');
const expectedStageValues = new Map([
  ['shared-before', [['a.quantity', initialA], ['b.quantity', initialB], ['RequestState.latestName', initialName], ['관찰', `initial=${actual.initial}`]]],
  ['shared-after-a', [['a.quantity', afterAA], ['b.quantity', afterAB], ['RequestState.latestName', afterAName], ['관찰', `afterA=${actual.afterA}`]]],
  ['shared-after-b', [['a.quantity', afterBA], ['b.quantity', afterBB], ['RequestState.latestName', afterBName], ['관찰', `afterB=${actual.afterB}`]]],
  ['sum-empty', [['호출 인자', '[]'], ['배열 길이', '0'], ['sum 반환', actual.sumEmpty], ['실행 관측', `sumEmpty=${actual.sumEmpty}`]]],
  ['sum-items', [['호출 인자', '2, 3'], ['values 배열 원소', '[2, 3]'], ['배열 길이', '2'], ['sum 반환', actual.sumItems], ['실행 관측', `sumItems=${actual.sumItems}`]]],
  ['sum-array', [['호출 인자', 'new int[]{4, 6}'], ['values 배열 원소', '[4, 6]'], ['배열 길이', '2'], ['sum 반환', actual.sumArray], ['실행 관측', `sumArray=${actual.sumArray}`]]],
  ['choose-fixed', [['호출', 'choose(2, 3)'], ['선택', actual.chooseTwo], ['실행 관측', `chooseTwo=${actual.chooseTwo}`], ['표시자 의미', '합계가 아님']]],
  ['choose-array', [['호출', 'choose(new int[]{2, 3})'], ['선택', actual.chooseArray], ['실행 관측', `chooseArray=${actual.chooseArray}`], ['범위', '표시된 두 선언에 한정']]],
  ['choose-empty', [['호출', 'choose()'], ['varargs 배열 길이', '0'], ['선택', actual.chooseEmpty], ['실행 관측', `chooseEmpty=${actual.chooseEmpty}`]]],
]);
const stdout = read('docs/design/p09-completion-2026-10-24/proof/run.stdout.log').trimEnd();
assert.deepEqual(stdout.split('\n'), Object.entries(expected).map(([key, value]) => `${key}=${value}`), 'raw stdout 전체·순서 보존');

function stripWhitespaceOutsideLiterals(text) {
  let result = '', quote = '', escaped = false;
  for (const char of text) {
    if (quote) {
      result += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
    } else if (char === '"' || char === "'") {
      quote = char;
      result += char;
    } else if (!/\s/.test(char)) result += char;
  }
  assert.equal(quote, '', '정규화 입력은 닫힌 문자열/문자 리터럴');
  return result;
}
for (const lesson of [shared, varargs]) {
  for (const stage of lesson.stages) {
    assert.ok(Array.isArray(stage.sourceFragments) && stage.sourceFragments.length, `${stage.id} sourceFragments`);
    const fragments = stage.sourceFragments.map(({ start, end, startColumn, endColumn }) => {
      assert.ok(Number.isInteger(start) && Number.isInteger(end) && start > 0 && end >= start, `${stage.id} fragment 범위`);
      const lines = proof.split('\n').slice(start - 1, end);
      if (startColumn !== undefined) {
        assert.equal(lines.length, 1, `${stage.id} 열 범위는 한 줄에만 적용`);
        lines[0] = lines[0].slice(startColumn, endColumn);
      }
      return lines.join('\n');
    });
    assert.deepEqual(stage.sourceFragments.map(({ start }) => start), [...stage.sourceFragments.map(({ start }) => start)].sort((a, b) => a - b), `${stage.id} source 순서`);
    assert.equal(stripWhitespaceOutsideLiterals(fragments.join('\n')), stripWhitespaceOutsideLiterals(stage.code), `${stage.id} source/code 정규화 일치`);
    assert.equal(stage.code, fragments.join('\n'), `${stage.id} 표시 코드 원문 바이트 내용 일치`);
  }
}
for (const [stageId, expectedRect] of Object.entries(expectedFocus)) {
  const stage = varargs.stages.find((item) => item.id === stageId);
  const rect = P09_ASSETS[stage.image].focus[stageId];
  assert.deepEqual(rect, expectedRect, `${stageId} crop focus는 원본 카드 경계에 맞춤`);
  const [left, top, width, height] = rect;
  assert.ok(left >= 0 && top >= 0 && width > 0 && height > 0 && left + width <= 100 && top + height <= 100, `${stageId} crop bounds가 이미지 안에 있음`);
}

const assets = json('docs/design/p09-completion-2026-10-24/image-records.json').images;
for (const [name, file, sha, bytes] of [
  ['shared-dark', 'P09-shared-dark-20261024.jpg', '526c3b838c0fd0a7496297588d843ef00b317d68ff9a2955da3ae466d57588d1', 528762],
  ['varargs-dark', 'P09-varargs-dark-20261024.jpg', 'be8303ed18ae1af2c01b886082a07bda1564f4284e101ab7e9a4cbb7f806d35c', 515743],
]) {
  const record = assets.find((item) => item.name === name);
  assert.ok(record, `${name} image record`);
  assert.equal(record.destination, `docs/design/p09-2026-10-20/images/${file}`);
  const image = fs.readFileSync(path.join(root, record.destination));
  assert.equal(image.length, bytes);
  assert.equal(hash(image), sha);
  assert.equal(record.sha256, sha);
}

const page = new JSDOM(read('docs/knowledge/P09-java-syntax-basics.html'), { runScripts: 'outside-only', url: 'https://learn.example/docs/knowledge/P09-java-syntax-basics.html' });
const win = page.window, doc = win.document;
const $ = (selector) => doc.querySelector(selector);
win.fetch = () => { throw new Error('P09 장면은 서버 요청을 하지 않는다'); };
Object.defineProperty(win.navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.resolve() } });
win.eval(read('tools/site/p09-learning.bundle.js'));

function selectTopic(id) {
  $('[data-p09-topic]').value = id;
  $('[data-p09-topic]').dispatchEvent(new win.Event('change', { bubbles: true }));
}
function selectStage(id) { $(`[data-p09-stage="${id}"]`).click(); }
function verifyStage(lesson, stage) {
  selectStage(stage.id);
  assert.equal($('[data-p09-question]').textContent, lesson.question);
  assert.equal($('[data-p09-title]').textContent, stage.title);
  assert.equal($('[data-p09-lead]').textContent, stage.lead);
  assert.equal($('[data-p09-source]').textContent, lesson.source);
  assert.equal($('[data-p09-code]').textContent, stage.code);
  assert.equal($('[data-p09-position]').textContent, `${lesson.stages.indexOf(stage) + 1} / ${lesson.stages.length}`);
  assert.equal($('[data-p09-image]').getAttribute('src'), `../design/p09-2026-10-20/images/${P09_ASSETS[stage.image].file}`);
  assert.equal($('[data-p09-image]').alt, `${P09_ASSETS[stage.image].alt} · 현재 설명: ${stage.title}`);
  assert.deepEqual(stage.values, expectedStageValues.get(stage.id), `${stage.id}의 전체 표시값은 독립 기준/native13과 일치`);
  assert.equal($('[data-p09-state]').textContent, stage.values.flat().join(''));
  const activeLines = stage.active.map((index) => stage.code.split('\n')[index]);
  assert.deepEqual(activeLines, expectedActiveLines[stage.id], `${stage.id} 의미상 현재 선언/호출 강조`);
  assert.deepEqual([...doc.querySelectorAll('[data-p09-code] mark')].map((mark) => mark.textContent), activeLines, `${stage.id} 실제 강조 줄 내용`);
  assert.equal($('[data-p09-prev]').disabled, lesson.stages.indexOf(stage) === 0);
  assert.equal($('[data-p09-next]').disabled, lesson.stages.indexOf(stage) === lesson.stages.length - 1);
  const record = win.history.state?.__javaExperienceP09;
  assert.equal(record.topic, lesson.id);
  assert.equal(record.stage, stage.id);
}
for (const lesson of [shared, varargs]) {
  selectTopic(lesson.id);
  for (const stage of lesson.stages) verifyStage(lesson, stage);
}

assert.ok($('#p09-boundaries-source'), '전체 proof는 원문 밖 별도 details에 노출');
assert.ok($('#p09-boundaries-stdout'), 'raw 13개 관측은 원문 밖 별도 details에 노출');
assert.equal($('#p09-boundaries-source code').textContent, proof);
assert.equal($('#p09-boundaries-stdout code').textContent.trimEnd(), stdout);
assert.equal($('#p09-original').contains($('#p09-boundaries-source')), false, '추가 자료는 기존 원문 영역 밖');

const settled = () => new Promise((resolve) => setTimeout(resolve, 0));
const normalPayloads = [];
win.navigator.clipboard.writeText = (value) => { normalPayloads.push(value); return Promise.resolve(); };
for (const lesson of [shared, varargs]) {
  selectTopic(lesson.id);
  for (const stage of lesson.stages) {
    selectStage(stage.id);
    $('[data-p09-copy]').click();
    await settled();
    assert.equal(normalPayloads.at(-1), stage.code, `${stage.id} 정상 복사 payload는 현재 표시 fragment`);
    assert.equal($('[data-p09-copy-status]').textContent, '코드를 복사했습니다.');
  }
}
assert.equal(normalPayloads.length, 9, '신규 9상태 각각의 정상 복사 payload 확인');

let pending = [];
win.navigator.clipboard.writeText = (value) => new Promise((resolve, reject) => pending.push({ value, resolve, reject }));
selectTopic('shared-state'); selectStage('shared-after-a');
const copy = () => $('[data-p09-copy]').click();
copy();
assert.equal(pending.at(-1).value, shared.stages[1].code, '복사 시작 시 현재 fragment 문자열을 캡처');
selectStage('shared-after-b');
pending[0].resolve(); await settled();
assert.equal($('[data-p09-copy-status]').textContent, '', '장면 전환 뒤 낡은 성공 무시');

pending = []; selectStage('shared-after-a'); copy(); selectStage('shared-after-b'); selectStage('shared-after-a');
pending[0].reject(new Error('stale')); await settled();
assert.equal($('[data-p09-copy-status]').textContent, '', 'A→B→A 복귀여도 이전 실패 무시');
assert.equal(win.getSelection().toString(), '', 'stale 실패는 현재 코드 선택 범위도 바꾸지 않음');

pending = []; selectStage('shared-after-a'); copy(); selectTopic('varargs-selection');
pending[0].reject(new Error('old-topic')); await settled();
assert.equal($('[data-p09-copy-status]').textContent, '', '질문 전환 뒤 이전 실패 무시');
assert.equal(win.getSelection().toString(), '', '질문 전환 뒤 stale 실패는 selection도 바꾸지 않음');

pending = []; selectTopic('shared-state'); selectStage('shared-after-a'); copy(); copy();
assert.equal(pending.length, 2);
pending[1].resolve(); await settled();
assert.equal($('[data-p09-copy-status]').textContent, '코드를 복사했습니다.', '가장 최근 요청 성공 반영');
pending[0].reject(new Error('older')); await settled();
assert.equal($('[data-p09-copy-status]').textContent, '코드를 복사했습니다.', '역순 완료된 구 요청은 최신 status를 덮지 않음');

pending = []; copy(); copy();
pending[1].reject(new Error('latest-fallback')); await settled();
assert.equal($('[data-p09-copy-status]').textContent, '코드를 선택했습니다. 복사 키를 눌러 주세요.', '최신 요청 실패는 수동 선택 fallback 반영');
assert.equal(win.getSelection().toString(), shared.stages[1].code);
pending[0].resolve(); await settled();
assert.equal($('[data-p09-copy-status]').textContent, '코드를 선택했습니다. 복사 키를 눌러 주세요.', 'fallback 뒤 구 요청 성공은 status를 덮지 않음');
assert.equal(win.getSelection().toString(), shared.stages[1].code, 'fallback 뒤 구 요청 성공은 selection을 바꾸지 않음');

pending = []; copy();
pending[0].reject(new Error('fallback')); await settled();
assert.equal($('[data-p09-copy-status]').textContent, '코드를 선택했습니다. 복사 키를 눌러 주세요.', '현재 요청 실패는 수동 선택 fallback 유지');
assert.equal(win.getSelection().toString(), shared.stages[1].code, 'fallback 선택 범위가 현재 fragment와 일치');

win.close();
console.log('P09 추가 경계: 기존84 ID·질문27·Java proof/source SHA/raw13·JPG 2개·새9상태·코드 fragment·history·copy 경합 검사 통과');
