import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSpecEndpoints, parseTalkCardIds, validate, validateDayPages, validateSql } from './validate.mjs';

const FX = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const load = () => ({
  spec: fs.readFileSync(path.join(FX, 'spec.md'), 'utf8'),
  roadmap: (() => {
    const roadmap = JSON.parse(fs.readFileSync(path.join(FX, 'roadmap.json'), 'utf8'));
    // 기존 엔드포인트 픽스처에 파일 동작 계약을 보충한다. 실제 로드맵은 별도로 전수 검증한다.
    for (const day of roadmap.days) for (const step of day.steps) step.fileActions = { create: [...step.files], modify: [], inspect: [] };
    return roadmap;
  })(),
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

test('파일 동작이 빠지거나 작업 범위와 다르면 오류', () => {
  const i = load();
  delete i.roadmap.days[0].steps[0].fileActions;
  assert.ok(has(validate(i), 'D01', 'step 1', 'fileActions'));
  const j = load();
  j.roadmap.days[0].steps[0].fileActions.modify.push('unlisted.java');
  assert.ok(has(validate(j), 'D01', 'step 1', 'fileActions'));
});

test('일자 수가 15가 아니면 오류', () => {
  const i = load();
  i.roadmap.days.pop();
  assert.ok(has(validate(i), '15'));
});

test('build 단계 순서에 파일이 없으면 오류', () => {
  const i = load();
  i.roadmap.days[0].steps[0].files = [];
  assert.ok(has(validate(i), 'D01', 'step 1'));
});

test('build 단계는 실제 작업 층을 빠뜨리지 않도록 파일 4개 이상도 허용한다', () => {
  const i = load();
  i.roadmap.days[0].steps[0].files = ['Post.java', 'PostRepository.java', 'PostService.java', 'PostController.java', 'PostTest.java'];
  i.roadmap.days[0].steps[0].fileActions.create = [...i.roadmap.days[0].steps[0].files];
  assert.deepEqual(validate(i), []);
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

test('실제 카드 문서는 일자마다 3~5장', () => {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const ids = parseTalkCardIds(fs.readFileSync(path.join(root, 'course/talk-cards.md'), 'utf8'));
  assert.equal(new Set(ids).size, ids.length, '카드 ID 중복');
  const byDay = new Map();
  for (const id of ids) {
    assert.match(id, /^TC-D\d{2}-\d$/);
    const d = id.slice(3, 6);
    byDay.set(d, (byDay.get(d) ?? 0) + 1);
  }
  assert.equal(byDay.size, 15);
  for (let n = 1; n <= 15; n++) {
    const d = `D${String(n).padStart(2, '0')}`;
    const c = byDay.get(d) ?? 0;
    assert.ok(c >= 3 && c <= 5, `${d}: ${c}장`);
  }
});

test('실제 course 파일 전체가 검증을 통과한다', () => {
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'course');
  const courseFiles = {};
  for (const f of fs.readdirSync(dir)) if (/\.(md|json)$/.test(f)) courseFiles[f] = fs.readFileSync(path.join(dir, f), 'utf8');
  assert.ok('roadmap.json' in courseFiles, 'course/roadmap.json이 없다');
  const errs = validate({
    spec: courseFiles['spec-v2.md'],
    roadmap: JSON.parse(courseFiles['roadmap.json']),
    cards: courseFiles['talk-cards.md'],
    courseFiles,
  });
  assert.deepEqual(errs, []);
});

test('README 일정표가 roadmap과 일치', () => {
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'course');
  const readme = fs.readFileSync(path.join(dir, 'README.md'), 'utf8');
  const roadmap = JSON.parse(fs.readFileSync(path.join(dir, 'roadmap.json'), 'utf8'));
  const rows = [...readme.matchAll(/^\|\s*(D\d{2})\s*\|\s*([^|]+?)\s*\|\s*(J\d{2})\s*\|\s*(\d+)\s*\|/gm)]
    .map((m) => [m[1], m[2], m[3], Number(m[4])]);
  const want = roadmap.days.map((d) => [d.id, d.title, d.java, d.talkCards.length]);
  assert.deepEqual(rows, want);
});

// ---------------------------------------------------------------- 일자 페이지
const CIRCLE = '⓪①②③④⑤⑥⑦⑧⑨';
const DAY_HEAD = '<!-- 생성물: tools/course/build-days.mjs가 만든다. 직접 고치지 마라 -->';
function fakePage(day) {
  const checks = day.steps.map((s) => `<li><input type="checkbox" class="step-check" data-step="${day.id}-${s.no}"></li>`).join('\n');
  const steps = day.steps.map((s) => `<section class="day-step" id="step-${s.no}" data-step="${day.id}-${s.no}">\n\n## ${CIRCLE[s.no]} ${s.title}\n\n</section>`).join('\n\n');
  const cards = day.talkCards.map((c) => `### ${c}\n\n**질문** q`).join('\n\n');
  return `${DAY_HEAD}\n\n# ${day.id}. ${day.title}\n\n> [${day.java}](../java/${day.java}.md)\n\n${checks}\n\n${steps}\n\n## 말하기 카드\n\n${cards}\n`;
}
const loadPages = () => {
  const { roadmap } = load();
  const pages = { 'D00.md': `${DAY_HEAD}\n# D00`, 'README.md': `${DAY_HEAD}\n# 목록` };
  for (const d of roadmap.days) pages[`${d.id}.md`] = fakePage(d);
  return { roadmap, pages };
};

test('정상 일자 페이지는 오류가 없다', () => {
  assert.deepEqual(validateDayPages(loadPages()), []);
});

test('D15 페이지가 없으면 오류', () => {
  const i = loadPages();
  delete i.pages['D15.md'];
  assert.ok(has(validateDayPages(i), 'D15.md'));
});

test('일자 페이지의 순서 수가 roadmap과 다르면 오류', () => {
  const i = loadPages();
  i.roadmap.days[3].steps.push({ no: 4, title: '새 순서', files: [], done: [], specRefs: [], tickets: [] });
  assert.ok(has(validateDayPages(i), 'D04.md', '순서 수'));
});

test('일자 페이지의 순서 제목이 roadmap과 다르면 오류', () => {
  const i = loadPages();
  i.pages['D02.md'] = i.pages['D02.md'].replace(`## ① ${i.roadmap.days[1].steps[0].title}`, '## ① 다른 제목');
  assert.ok(has(validateDayPages(i), 'D02.md', '순서 1'));
});

test('일자 페이지의 말하기 카드가 roadmap talkCards와 다르면 오류', () => {
  const i = loadPages();
  i.roadmap.days[0].talkCards = [...i.roadmap.days[0].talkCards].reverse();
  assert.ok(has(validateDayPages(i), 'D01.md', '말하기 카드'));
});

test('코드 블록 안의 제목 줄은 순서·카드로 세지 않는다', () => {
  const i = loadPages();
  i.pages['D03.md'] += '\n````markdown\n## ① 정답 코드 속 제목\n### TC-D03-9\n```\n안쪽 펜스\n```\n````\n';
  assert.deepEqual(validateDayPages(i), []);
});

test('생성물 표시가 없거나 오늘의 Java 링크가 없으면 오류', () => {
  const i = loadPages();
  i.pages['D05.md'] = i.pages['D05.md'].replace(DAY_HEAD, '').replace('(../java/J05.md)', '(../java/J04.md)');
  const errs = validateDayPages(i);
  assert.ok(has(errs, 'D05.md', '생성물'));
  assert.ok(has(errs, 'D05.md', 'J05'));
});

test('data-step의 일자가 다르면 오류(D05 → D99)', () => {
  const i = loadPages();
  i.pages['D05.md'] = i.pages['D05.md'].replaceAll('data-step="D05-', 'data-step="D99-');
  const errs = validateDayPages(i);
  assert.ok(has(errs, 'D05.md', '순서 칸'));
  assert.ok(has(errs, 'D05.md', '오늘 순서 체크'));
  assert.ok(has(errs, 'D05.md', 'D99-1'));
});

test('같은 날 순서 칸의 data-step을 서로 바꾸면 오류', () => {
  const i = loadPages();
  i.pages['D05.md'] = i.pages['D05.md'].replace('class="day-step" id="step-1" data-step="D05-1"', 'SWAP').replace('class="day-step" id="step-2" data-step="D05-2"', 'class="day-step" id="step-2" data-step="D05-1"').replace('SWAP', 'class="day-step" id="step-1" data-step="D05-2"');
  const errs = validateDayPages(i);
  assert.ok(has(errs, 'D05.md', '순서 칸'));
  assert.ok(has(errs, 'D05.md', '제목 번호'));
});

test('순서 칸 안의 힌트·정답 블록이 다른 순서(같은 날)를 가리키면 오류', () => {
  const i = loadPages();
  i.pages['D05.md'] = i.pages['D05.md'].replace(/(data-step="D05-1">\n\n## ① [^\n]+\n)/, '$1\n<details class="step-answer" data-step="D05-2" data-commits="x">\n</details>\n');
  assert.ok(has(validateDayPages(i), 'D05.md', 'D05-1 칸 안'));
});

test('실제 course/spring 일자 페이지가 roadmap과 일치한다', () => {
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'course');
  const roadmap = JSON.parse(fs.readFileSync(path.join(dir, 'roadmap.json'), 'utf8'));
  const spring = path.join(dir, 'spring');
  const pages = {};
  for (const f of fs.readdirSync(spring)) if (f.endsWith('.md')) pages[f] = fs.readFileSync(path.join(spring, f), 'utf8');
  assert.deepEqual(validateDayPages({ roadmap, pages }), []);
});


test('SQL 검증은 누락·예시 미분리·2단계 원인 누출을 거부한다', () => {
  const roadmap = {days:[{id:'D11',phase:'maintain'}]};
  const question={task:'실행 세션을 조사한다',expect:'시각과 실제 출력을 남긴다',example:'SHOW FULL PROCESSLIST;'};
  const hints={days:{D11:{sql:{context:'messy-server에서 진단',questions:[{...question},{...question}]}}}};
  assert.deepEqual(validateSql({roadmap,hints}),[]);
  const bad=structuredClone(hints);delete bad.days.D11.sql;
  assert.ok(validateSql({roadmap,hints:bad}).some(e=>e.includes('없다')));
  const leak=structuredClone(hints);leak.days.D11.sql.questions[0].task='PG 호출이 트랜잭션에 묶여 있다';
  assert.ok(validateSql({roadmap,hints:leak}).some(e=>e.includes('누출')));
  const noExample=structuredClone(hints);delete noExample.days.D11.sql.questions[0].example;
  assert.ok(validateSql({roadmap,hints:noExample}).some(e=>e.includes('예시')));
});
