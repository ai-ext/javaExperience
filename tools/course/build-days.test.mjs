import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT, EXTRA_COMMITS, HEADER, buildAll, listAnswerCommits, commitFiles, collectAnswers, specLinks, parseSpecSections, parseTalkCards, renderDay, fence } from './build-days.mjs';
import { stripFences, parseDayPage } from './validate.mjs';

const roadmap = JSON.parse(fs.readFileSync(path.join(ROOT, 'course/roadmap.json'), 'utf8'));
const hints = JSON.parse(fs.readFileSync(path.join(ROOT, 'course/hints.json'), 'utf8'));
const built = buildAll(ROOT);
const readyDays = roadmap.days.filter((d) => hints.days[d.id]);
const page = (id) => built.files.get(`course/spring/${id}.md`);
const allCommits = listAnswerCommits(ROOT);
const stepCommits = allCommits.filter((c) => c.kind === 'answer');

test('정답 커밋이 있고 생성을 건너뛰지 않는다', () => {
  assert.equal(built.skipped, null);
  assert.ok(listAnswerCommits(ROOT).length > 0);
});

test('같은 입력이면 같은 출력이다(두 번 생성 비교)', () => {
  const again = buildAll(ROOT);
  assert.deepEqual([...again.files.keys()], [...built.files.keys()]);
  for (const [k, v] of built.files) assert.equal(again.files.get(k), v, k);
});

test('커밋된 course/spring 파일이 생성 결과와 같다(생성물이 최신)', () => {
  for (const [rel, content] of built.files) {
    const abs = path.join(ROOT, rel);
    assert.ok(fs.existsSync(abs), `${rel}이 없다`);
    assert.equal(fs.readFileSync(abs, 'utf8'), content, `${rel}이 최신이 아니다. node tools/course/build-days.mjs를 실행한다`);
  }
});

test('D00~D15와 README를 모두 만든다', () => {
  const names = [...built.files.keys()].map((k) => path.basename(k)).sort();
  const want = ['README.md', ...Array.from({ length: 16 }, (_, n) => `D${String(n).padStart(2, '0')}.md`)].sort();
  assert.deepEqual(names, want);
});

test('D01~D10은 완성 페이지, D11~D15는 준비 중 페이지다', () => {
  assert.deepEqual(readyDays.map((d) => d.id), ['D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09', 'D10']);
  for (const d of roadmap.days) {
    const md = page(d.id);
    if (hints.days[d.id]) {
      assert.ok(md.includes('## AI 채점 프롬프트'), `${d.id}: 채점 프롬프트`);
      assert.ok(md.includes('## 날짜별 snapshot'), `${d.id}: snapshot`);
      assert.ok(!md.includes('준비 중'), `${d.id}: 준비 중 표시`);
    } else {
      assert.ok(md.includes('**준비 중**'), `${d.id}: 준비 중 표시`);
      assert.ok(!md.includes('class="step-answer"'), `${d.id}: 정답이 들어가면 안 된다`);
    }
  }
});

test('일자 페이지의 순서 수·제목·카드가 roadmap과 같다', () => {
  for (const d of roadmap.days) {
    const p = parseDayPage(page(d.id));
    assert.deepEqual(p.steps.map((s) => s.title), d.steps.map((s) => s.title), d.id);
    assert.deepEqual(p.cards, d.talkCards, d.id);
  }
});

test('정답 커밋 매핑: D04 순서 수 = answer(D04-*) 커밋 수', () => {
  const d04 = roadmap.days.find((d) => d.id === 'D04');
  const commits = stepCommits.filter((c) => c.day === 'D04');
  assert.equal(commits.length, d04.steps.length);
  assert.deepEqual(commits.map((c) => c.m), d04.steps.map((s) => s.no));
});

test('정답 커밋 매핑: 순서와 어긋난 커밋은 허용 목록(D01-0, D08-6)뿐이다', () => {
  const commits = stepCommits;
  const stray = commits.filter((c) => !roadmap.days.find((d) => d.id === c.day).steps.some((s) => s.no === c.m)).map((c) => `${c.day}-${c.m}`);
  assert.deepEqual(stray.sort(), Object.keys(EXTRA_COMMITS).sort());
  for (const d of readyDays) {
    const extras = Object.keys(EXTRA_COMMITS).filter((k) => k.startsWith(`${d.id}-`)).length;
    assert.equal(commits.filter((c) => c.day === d.id).length, d.steps.length + extras, d.id);
  }
  const answers = collectAnswers(roadmap, ROOT);
  assert.deepEqual(answers.get('D01').steps.get(1).filter((c) => c.kind === 'answer').map((c) => c.m), [0, 1]);
  assert.deepEqual([...answers.get('D08').extras.keys()], ['D08-6']);
});

test('정답 블록은 그 순서 커밋의 board-server 파일만 담는다', () => {
  for (const d of readyDays) {
    const body = page(d.id);
    const blocks = [...body.matchAll(/<details class="step-answer" data-step="([^"]+)" data-commits="([^"]+)">([\s\S]*?)\n<\/details>/g)];
    const extras = Object.keys(EXTRA_COMMITS).filter((k) => k.startsWith(`${d.id}-`) && EXTRA_COMMITS[k].extra).length;
    assert.equal(blocks.length, d.steps.length + extras, `${d.id}: 정답 블록 수`);
    for (const [, step, shas, inner] of blocks) {
      const want = new Set(shas.split(' ').flatMap((sha) => commitFiles(sha, ROOT).map((f) => f.path)));
      const shown = new Set([...stripFences(inner).matchAll(/^\*\*(?:새 파일|수정|삭제)\*\* `([^`]+)`/gm)].map((m) => m[1]));
      assert.deepEqual([...shown].sort(), [...want].sort(), `${step}: 정답 블록 파일`);
      for (const p of shown) assert.ok(!p.startsWith('tools/') && !p.startsWith('board-server/'), `${step}: ${p}`);
      // 커밋 SHA는 실제 정답 커밋이고, 그 순서(또는 허용 목록) 커밋이다
      for (const sha of shas.split(' ')) {
        const c = allCommits.find((x) => x.sha === sha);
        assert.ok(c && c.day === d.id, `${step}: ${sha}`);
      }
    }
  }
});

test('정답 블록: 새 파일은 전체 내용, 수정 파일은 diff로 싣는다', () => {
  const md = page('D04');
  assert.match(md, /\*\*새 파일\*\* `src\/main\/java\/com\/example\/board\/post\/Post\.java`\n\n```java\npackage com\.example\.board\.post;/);
  assert.match(md, /\*\*수정\*\* `src\/main\/resources\/schema\.sql` \(바뀐 부분\)\n\n```diff\n@@ /);
});

test('페이지 안 #step 링크는 모두 실제 순서 칸을 가리킨다', () => {
  for (const [rel, md] of built.files) {
    const ids = new Set([...md.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
    for (const [, target] of md.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(target), `${rel}: #${target}`);
  }
});

test('명세 링크는 엔드포인트 절과, 그 엔드포인트가 나오는 필드 규칙 절을 가리킨다', () => {
  const sections = parseSpecSections(fs.readFileSync(path.join(ROOT, 'course/spec-v2.md'), 'utf8'));
  const post = specLinks('POST /api/posts', sections);
  assert.equal(post.endpoint.id, '4-엔드포인트');
  assert.ok(post.extra.some((e) => e.id.startsWith('5-2')));
  // GET /api/posts는 /api/posts/{postId}·/api/posts/popular와 섞이지 않는다
  const list = specLinks('GET /api/posts', sections);
  assert.ok(!list.extra.some((e) => e.id.startsWith('5-2')));
});

test('채점 프롬프트에 그날 완료 조건과 말하기 카드가 모두 들어간다', () => {
  const md = page('D04');
  const prompt = md.slice(md.indexOf('## AI 채점 프롬프트'), md.indexOf('## 내일 미리보기'));
  const d04 = roadmap.days.find((d) => d.id === 'D04');
  for (const s of d04.steps) s.done.forEach((_, i) => assert.ok(prompt.includes(`[C${s.no}-${i + 1}]`), `C${s.no}-${i + 1}`));
  for (const s of d04.steps) assert.ok(prompt.includes(`[R${s.no}]`));
  for (const id of d04.talkCards) assert.ok(prompt.includes(`[${id}]`));
  assert.ok(!prompt.includes('{{'), '치환되지 않은 자리표시자');
});

test('모든 완성 순서에 힌트가 1~2줄 있다', () => {
  for (const d of readyDays) for (const s of d.steps) {
    const h = hints.days[d.id].steps[String(s.no)];
    assert.ok(Array.isArray(h) && h.length >= 1 && h.length <= 2, `${d.id}-${s.no}`);
  }
});

test('펜스는 내용 안의 가장 긴 백틱보다 길다', () => {
  assert.equal(fence('a\n```\nb', 'md').split('\n')[0], '````md');
  assert.equal(fence('x', 'java').split('\n')[0], '```java');
});

test('정답 커밋을 찾지 못하면 아무것도 쓰지 않고 건너뛴다', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'build-days-'));
  fs.mkdirSync(path.join(tmp, 'course'));
  for (const f of ['roadmap.json', 'hints.json', 'talk-cards.md', 'spec-v2.md']) fs.copyFileSync(path.join(ROOT, 'course', f), path.join(tmp, 'course', f));
  const r = buildAll(tmp);
  assert.ok(r.skipped);
  assert.equal(r.files.size, 0);
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('2단계·마무리 날도 hints가 생기면 완성 페이지로 만든다(정답 커밋 없이)', () => {
  const ctxFor = (day) => ({
    root: ROOT, roadmap, hints, ready: true, answers: null, filesOf: () => [], lastTouch: () => null,
    hintsDay: { steps: Object.fromEntries(day.steps.map((s) => [String(s.no), ['방향 힌트']])), grader: { focus: ['초점'] } },
    cards: parseTalkCards(fs.readFileSync(path.join(ROOT, 'course/talk-cards.md'), 'utf8')),
    specSections: parseSpecSections(fs.readFileSync(path.join(ROOT, 'course/spec-v2.md'), 'utf8')),
  });
  const d12 = roadmap.days.find((d) => d.id === 'D12');
  const md12 = renderDay(d12, ctxFor(d12));
  assert.ok(!md12.includes('class="step-answer"'));
  assert.ok(md12.includes('](../tickets/B01.md)'));
  assert.ok(md12.includes('## AI 채점 프롬프트'));
  assert.ok(!md12.includes('## 날짜별 snapshot'));
  const d15 = roadmap.days.find((d) => d.id === 'D15');
  const md15 = renderDay(d15, ctxFor(d15));
  assert.ok(!md15.includes('class="step-answer"'));
  assert.ok(!md15.includes('../tickets/'));
  assert.deepEqual(parseDayPage(md15).cards, d15.talkCards);
});

test('answer-fix(Dnn-m)는 순서 수에 넣지 않고, 그 순서 원래 커밋 뒤에 보완으로 붙고, snapshot은 가장 나중 커밋이다', () => {
  const fix = { sha: 'f'.repeat(40), subject: 'answer-fix(D09-3): 리뷰 반영', kind: 'fix', day: 'D09', m: 3, title: '리뷰 반영' };
  const fixExtra = { sha: 'e'.repeat(40), subject: 'answer-fix(D08-6): 리뷰 반영', kind: 'fix', day: 'D08', m: 6, title: '리뷰 반영' };
  const list = [...allCommits, fix, fixExtra];
  // 순서 수는 answer만 센다
  const d09 = roadmap.days.find((d) => d.id === 'D09');
  assert.equal(list.filter((c) => c.day === 'D09' && c.kind === 'answer').length, d09.steps.length);
  const answers = collectAnswers(roadmap, ROOT, list);
  const step3 = answers.get('D09').steps.get(3);
  assert.equal(step3[0].kind, 'answer');
  assert.equal(step3.at(-1).sha, fix.sha);
  assert.equal(answers.get('D09').last.sha, fix.sha);
  assert.equal(answers.get('D08').extras.get('D08-6').at(-1).sha, fixExtra.sha);
  // 렌더링: 원래 커밋 코드 다음에 "보완"
  const cache = new Map();
  const filesOf = (sha) => sha === fix.sha
    ? [{ path: 'src/main/java/com/example/board/post/PostCacheEvictListener.java', status: 'M', binary: false, generated: false, diff: '@@ -1 +1 @@\n-a\n+b\n' }]
    : (cache.get(sha) ?? cache.set(sha, commitFiles(sha, ROOT)).get(sha));
  const md = renderDay(d09, {
    root: ROOT, roadmap, hints, hintsDay: hints.days.D09, ready: true, answers: answers.get('D09'), filesOf, lastTouch: () => null,
    cards: parseTalkCards(fs.readFileSync(path.join(ROOT, 'course/talk-cards.md'), 'utf8')),
    specSections: parseSpecSections(fs.readFileSync(path.join(ROOT, 'course/spec-v2.md'), 'utf8')),
  });
  const block = md.match(/<details class="step-answer" data-step="D09-3"[\s\S]*?\n<\/details>/)[0];
  assert.ok(block.includes('<summary>정답 보기 · answer(D09-3) + 보완 1개'));
  const orig = block.indexOf(step3[0].sha.slice(0, 8));
  const extra = block.indexOf('**보완**');
  assert.ok(orig >= 0 && extra > orig, '보완은 원래 커밋 코드 뒤에 온다');
  assert.ok(md.includes(`/tree/${fix.sha}/board-server`), 'snapshot은 가장 나중 커밋');
  // 원래 커밋 없이 answer-fix만 있으면 멈춘다
  const orphan = list.filter((c) => !(c.day === 'D09' && c.m === 3 && c.kind === 'answer'));
  assert.throws(() => collectAnswers(roadmap, ROOT, orphan.filter((c) => c.day !== 'D09' || c.m !== 3 || c.kind === 'fix')), /answer-fix/);
});

test('생성 페이지 맨 위에 생성물 표시가 있다', () => {
  for (const [rel, md] of built.files) assert.ok(md.startsWith(HEADER), rel);
});
