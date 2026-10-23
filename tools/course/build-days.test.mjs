import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, EXTRA_COMMITS, DEFERRED_FIXES, HEADER, buildAll, fixPlacementErrors, publicBasis, listAnswerCommits, commitFiles, netFixFiles, collectAnswers, specLinks, parseSpecSections, parseTalkCards, renderDay, fence, stepId } from './build-days.mjs';
import { stripFences, parseDayPage } from './validate.mjs';

const roadmap = JSON.parse(fs.readFileSync(path.join(ROOT, 'course/roadmap.json'), 'utf8'));
const hints = JSON.parse(fs.readFileSync(path.join(ROOT, 'course/hints.json'), 'utf8'));
const built = buildAll(ROOT);
const readyDays = roadmap.days.filter((d) => hints.days[d.id]);
// 정답 커밋(answer(Dnn-m))이 있는 날은 1단계뿐이다
const answerDays = readyDays.filter((d) => d.phase === 'build');
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

test('D01~D15 모두 완성 페이지다(snapshot은 1단계만)', () => {
  assert.deepEqual(readyDays.map((d) => d.id), roadmap.days.map((d) => d.id));
  for (const d of roadmap.days) {
    const md = page(d.id);
    assert.ok(md.includes('## AI 채점 프롬프트'), `${d.id}: 채점 프롬프트`);
    assert.ok(!md.includes('준비 중'), `${d.id}: 준비 중 표시`);
    assert.equal(md.includes('## 날짜별 snapshot'), d.phase === 'build', `${d.id}: snapshot은 1단계만`);
    if (d.phase !== 'build') assert.ok(!md.includes('class="step-answer"'), `${d.id}: 2단계·마무리 정답은 티켓 페이지에만`);
  }
  assert.ok(!page('README').includes('준비 중'), '일자 목록 상태');
});

test('2단계 순서 칸은 티켓마다 티켓 페이지 "원인과 정답" 절로 잇고, 훈련 순서는 훈련 페이지로 잇는다', () => {
  for (const d of roadmap.days.filter((x) => x.phase === 'maintain')) {
    const md = page(d.id);
    for (const s of d.steps) {
      const section = md.slice(md.indexOf(`id="step-${d.id.toLowerCase()}-${s.no}"`), md.indexOf('</section>', md.indexOf(`id="step-${d.id.toLowerCase()}-${s.no}"`)));
      const line = section.split('\n').find((l) => l.startsWith('**원인과 정답**'));
      assert.ok(line, `${d.id}-${s.no}: 원인과 정답 줄`);
      assert.ok(section.indexOf(line) < section.indexOf('class="step-hint"'), `${d.id}-${s.no}: 링크는 힌트 접기 앞(사실 칸)에`);
      for (const t of s.tickets) {
        assert.ok(line.includes(`](../tickets/${t}.md#원인과-정답)`), `${d.id}-${s.no}: ${t} 링크`);
        assert.match(fs.readFileSync(path.join(ROOT, `course/tickets/${t}.md`), 'utf8'), /^## 원인과 정답$/m, `${t}: 원인과 정답 절`);
      }
    }
  }
  const d14 = page('D14');
  const drill = d14.slice(d14.indexOf('id="step-d14-6"'), d14.indexOf('</section>', d14.indexOf('id="step-d14-6"')));
  assert.ok(drill.includes('](../tickets/drill.md)'), 'D14 ⑥: 모의 장애 훈련 페이지');
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
  for (const d of answerDays) {
    const extras = Object.keys(EXTRA_COMMITS).filter((k) => k.startsWith(`${d.id}-`)).length;
    assert.equal(commits.filter((c) => c.day === d.id).length, d.steps.length + extras, d.id);
  }
  const answers = collectAnswers(roadmap, ROOT);
  assert.deepEqual(answers.get('D01').steps.get(1).filter((c) => c.kind === 'answer').map((c) => c.m), [0, 1]);
  assert.deepEqual([...answers.get('D08').extras.keys()], ['D08-6']);
});

// 일자 페이지 본문의 정답 블록을 커밋과 대조해 오류 목록을 돌려준다.
// - 블록의 data-step(Dnn-m)과 커밋의 Dnn-m(EXTRA_COMMITS 부착 규칙 반영)이 같아야 한다
// - 블록의 파일 목록은 answer 커밋들의 board-server 파일 + answer-fix들의 순 변경 파일과 같고, 내용(새 파일 전체·수정 diff)도 같아야 한다
const fileCache = new Map();
const filesOfSha = (sha) => fileCache.get(sha) ?? fileCache.set(sha, commitFiles(sha, ROOT)).get(sha);
function answerBlockErrors(dayId, body) {
  const errs = [];
  const blocks = [...body.matchAll(/<details class="step-answer" data-step="([^"]+)" data-commits="([^"]+)">([\s\S]*?)\n<\/details>/g)];
  for (const [, step, shas, inner] of blocks) {
    if (!step.startsWith(`${dayId}-`)) errs.push(`${step}: ${dayId} 페이지에 다른 날 정답 블록`);
    const want = new Set();
    // 펜스 여는 줄 다음부터 닫는 줄까지가 그대로 있어야 한다
    const check = (f, from) => {
      want.add(f.path);
      const text = f.content ?? f.diff;
      if (text != null && !inner.includes(`\n${fence(text).split('\n').slice(1).join('\n')}`)) errs.push(`${step}: ${f.path} 내용이 ${from}과 다르다`);
    };
    const fixes = [];
    for (const sha of shas.split(' ')) {
      const c = allCommits.find((x) => x.sha === sha);
      if (!c) { errs.push(`${step}: 정답 커밋이 아니다 ${sha}`); continue; }
      const key = stepId(c.day, c.m);
      const expected = stepId(c.day, EXTRA_COMMITS[key]?.attachTo ?? c.m);
      if (expected !== step) errs.push(`${step}: 커밋 ${c.subject}은 ${expected} 순서다`);
      if (c.kind === 'fix') { fixes.push(c); continue; }
      for (const f of filesOfSha(sha)) check(f, `커밋(${sha.slice(0, 8)})`);
    }
    if (fixes.length) {
      for (const f of netFixFiles(fixes, ROOT)) check(f, '보완 순 변경');
      for (const c of fixes) if (!inner.includes(`- [\`${c.sha.slice(0, 8)}\`](`)) errs.push(`${step}: 보완 이력에 ${c.sha.slice(0, 8)}이 없다`);
    }
    const shown = new Set([...stripFences(inner).matchAll(/^\*\*(?:새 파일|수정|삭제)\*\* `([^`]+)`/gm)].map((m) => m[1]));
    if ([...shown].sort().join('\n') !== [...want].sort().join('\n')) errs.push(`${step}: 정답 블록 파일 목록이 커밋과 다르다`);
    for (const p of shown) if (p.startsWith('tools/') || p.startsWith('board-server/')) errs.push(`${step}: ${p}`);
  }
  return { blocks: blocks.length, errs };
}

test('정답 블록은 그 순서(Dnn-m) 커밋의 board-server 파일과 내용만 담는다', () => {
  for (const d of answerDays) {
    const { blocks, errs } = answerBlockErrors(d.id, page(d.id));
    const extras = Object.keys(EXTRA_COMMITS).filter((k) => k.startsWith(`${d.id}-`) && EXTRA_COMMITS[k].extra).length;
    const deferred = Object.keys(DEFERRED_FIXES).filter((k) => k.startsWith(`${d.id}-`)).length;
    assert.equal(blocks, d.steps.length + extras + deferred, `${d.id}: 정답 블록 수`);
    assert.deepEqual(errs, [], d.id);
  }
});

test('정답 블록 대조는 다른 날·같은 날 순서 교환·코드 훼손을 거부한다', () => {
  const md = page('D05');
  const commitsOf = (step) => md.match(new RegExp(`data-step="${step}" data-commits="([^"]+)"`))[1];
  const [c1, c2] = [commitsOf('D05-1'), commitsOf('D05-2')];
  const swapped = md.replace(`data-step="D05-1" data-commits="${c1}"`, 'SWAP1').replace(`data-step="D05-2" data-commits="${c2}"`, `data-step="D05-2" data-commits="${c1}"`).replace('SWAP1', `data-step="D05-1" data-commits="${c2}"`);
  assert.ok(answerBlockErrors('D05', swapped).errs.some((e) => e.startsWith('D05-1: 커밋') && e.includes('D05-2 순서')));
  const otherDay = md.replaceAll('data-step="D05-', 'data-step="D99-');
  assert.ok(answerBlockErrors('D05', otherDay).errs.some((e) => e.includes('다른 날')));
  assert.ok(answerBlockErrors('D05', otherDay).errs.some((e) => e.includes('D05-1 순서')));
  // 첫 정답 블록의 첫 코드 줄을 바꾼다
  const start = md.indexOf('<details class="step-answer"');
  const open = md.indexOf('\n```', start) + 1;
  const lineStart = md.indexOf('\n', open) + 1;
  const tampered = `${md.slice(0, lineStart)}// 훼손${md.slice(lineStart)}`;
  assert.ok(answerBlockErrors('D05', tampered).errs.some((e) => e.includes('내용이 커밋')));
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
    // 사이트 빌드는 마크다운 링크의 #앵커를 제목 앵커와만 대조하므로, raw HTML id를 마크다운 링크로 가리키면 빌드가 깨진다
    for (const [, target] of stripFences(md).matchAll(/\]\(#([^)]+)\)/g)) assert.ok(!ids.has(target), `${rel}: raw HTML id #${target}를 마크다운 링크로 가리킨다(<a href>로 쓴다)`);
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

test('2단계 채점 프롬프트는 티켓마다 3점 세트를, 마무리는 설명 세션·회고를 채점한다', () => {
  const talkCards = parseTalkCards(fs.readFileSync(path.join(ROOT, 'course/talk-cards.md'), 'utf8'));
  const prompt = (id) => { const md = page(id); return md.slice(md.indexOf('## AI 채점 프롬프트'), md.indexOf('## 내일 미리보기')); };
  for (const d of roadmap.days.filter((x) => x.phase !== 'build')) {
    const p = prompt(d.id);
    assert.ok(!p.includes('{{'), `${d.id}: 치환되지 않은 자리표시자`);
    for (const s of d.steps) s.done.forEach((_, i) => assert.ok(p.includes(`[C${s.no}-${i + 1}]`), `${d.id}: C${s.no}-${i + 1}`));
    for (const id of d.talkCards) assert.ok(p.includes(`[${id}]`), `${d.id}: ${id}`);
  }
  for (const d of roadmap.days.filter((x) => x.phase === 'maintain')) {
    const p = prompt(d.id);
    assert.match(p, /원인 서술 \+ 재현 테스트 \+ 수정/, `${d.id}: 3점 세트`);
    // 2단계 카드 답은 티켓 원인이라 화면의 프롬프트에 싣지 않는다(에이전트가 talk-cards.md에서 읽는다)
    for (const id of d.talkCards) for (const a of talkCards.get(id).answers) assert.ok(!p.includes(a.replace(/`/g, '')), `${d.id}: ${id} 답 줄이 프롬프트에 보인다`);
    for (const t of new Set(d.steps.flatMap((s) => s.tickets))) {
      assert.ok(p.includes(`[T-${t}]`) && p.includes(`tickets/${t}/answer/`), `${d.id}: ${t} 3점 세트와 대조 자료`);
    }
  }
  const p15 = prompt('D15');
  assert.ok(p15.includes('무작위로 10문항') && p15.includes('course/talk-cards.md'), 'D15: 카드 전체에서 10문항');
  assert.ok(p15.includes('내가 겪은 문제 5개'), 'D15: 회고 문서');
  assert.ok(!p15.includes('[T-'), 'D15: 티켓 3점 세트 없음');
});

test('2단계 채점: 고른 티켓을 먼저 적고, 고르지 않은 티켓의 C 항목은 빼고, 수정 전 증거는 기록으로 확인한다', () => {
  const prompt = (id) => { const md = page(id); return md.slice(md.indexOf('## AI 채점 프롬프트'), md.indexOf('## 내일 미리보기')); };
  const required = new Set(['B01', 'B02', 'B03', 'B04']);
  for (const d of roadmap.days.filter((x) => x.phase === 'maintain')) {
    const p = prompt(d.id);
    assert.ok(p.includes('B01·B02·B03·B04') && p.includes('고른 티켓'), `${d.id}: 필수 티켓과 고른 티켓 기록`);
    assert.match(p, /제외/, `${d.id}: 고르지 않은 티켓 항목 제외 규칙`);
    assert.match(p, /\(기록으로 확인\)/, `${d.id}: 수정 전 증거는 기록으로`);
    const g = hints.days[d.id].grader;
    for (const s of d.steps) s.done.forEach((_, i) => {
      const id = `C${s.no}-${i + 1}`;
      const line = p.split('\n').find((l) => l.includes(`[${id}]`));
      const ticket = id in (g.itemTickets ?? {}) ? g.itemTickets[id] : (s.tickets.length === 1 ? s.tickets[0] : '');
      if (ticket && !required.has(ticket)) assert.ok(line.includes(`(${ticket}`), `${d.id} ${id}: 선택 티켓 ${ticket} 표시`);
      assert.equal(line.includes('기록으로 확인'), (g.fromRecords ?? []).includes(id), `${d.id} ${id}: 기록 표시`);
    });
  }
  // 같은 서버에 수정 전·후를 함께 요구하지 않는다: D11 env 200(수정 전)은 기록, 401(수정 후)은 지금 서버
  const d11 = prompt('D11').split('\n');
  assert.ok(d11.find((l) => l.includes('[C1-2]')).includes('기록으로 확인'));
  assert.ok(!d11.find((l) => l.includes('[C3-3]')).includes('기록으로 확인'));
  assert.ok(d11.find((l) => l.includes('[C2-2]')).includes('기록으로 확인'), 'B08 특성화(수정 전 응답 고정)는 기록');
  for (const l of prompt('D13').split('\n').filter((x) => /^ {2}- \[C\d/.test(x))) assert.match(l, /\((B06|B07|B09|B10)/, `D13 선택 티켓 표시: ${l}`);
});

test('2단계 채점: 제외는 고르지 않은 선택 티켓에만 걸고, 필수 B01~B04·E01 항목은 분모에 남는다', () => {
  const prompt = (id) => { const md = page(id); return md.slice(md.indexOf('## AI 채점 프롬프트'), md.indexOf('## 내일 미리보기')); };
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'course/map-tickets.json'), 'utf8')).tickets;
  const optional = new Set(meta.filter((t) => !t.required && !t.enhancement).map((t) => t.id));
  const mustCount = new Set(['B01', 'B02', 'B03', 'B04', 'E01']);
  const seen = new Set();
  for (const d of roadmap.days.filter((x) => x.phase === 'maintain')) {
    const p = prompt(d.id);
    assert.match(p, /B01~B04\(필수\) \+ 학습자가 고른 선택 티켓 1건 \+ E01 \+ 모의 장애 훈련/, `${d.id}: 채점 대상 집합을 적는다`);
    const clause = p.match(/이 날 제외할 수 있는 선택 티켓: ([^)]+)\)/);
    assert.ok(clause, `${d.id}: 제외 조항이 제외할 수 있는 선택 티켓을 적는다`);
    const excludable = clause[1] === '없음' ? [] : clause[1].split('·');
    for (const t of excludable) assert.ok(optional.has(t), `${d.id}: 제외 조항에 선택이 아닌 티켓 ${t}`);
    const dayOptional = [...new Set(d.steps.flatMap((s) => s.tickets))].filter((t) => optional.has(t));
    assert.deepEqual([...excludable].sort(), dayOptional.sort(), `${d.id}: 그날 선택 티켓 전부`);
    const items = p.split('\n').filter((l) => /^ {2}- \[C\d+-\d+\]/.test(l)).map((l) => {
      const m = l.match(/^ {2}- \[C\d+-\d+\] \(([BE]\d{2})(?: (필수|선택|고도화))?/);
      return { line: l, ticket: m?.[1] ?? '', kind: m?.[2] ?? '' };
    });
    for (const it of items.filter((x) => x.ticket)) {
      const want = optional.has(it.ticket) ? '선택' : it.ticket === 'E01' ? '고도화' : '필수';
      assert.equal(it.kind, want, `${d.id}: 티켓 구분 표시 → ${it.line}`);
    }
    // 고른 선택 티켓이 {B14}일 때 문언대로 제외해도 필수·E01 항목은 분모에 남는다
    const chosen = new Set(['B14']);
    const counted = items.filter((it) => !(it.kind === '선택' && excludable.includes(it.ticket) && !chosen.has(it.ticket)));
    for (const it of items.filter((x) => mustCount.has(x.ticket))) {
      assert.ok(counted.includes(it), `${d.id}: 필수 항목이 제외됨 → ${it.line}`);
      seen.add(it.ticket);
    }
  }
  assert.deepEqual([...seen].sort(), ['B01', 'B02', 'B03', 'B04', 'E01'], '필수·E01 항목을 모두 확인했다');
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
  assert.ok(md12.includes('](../tickets/B01.md#원인과-정답)'));
  assert.ok(md12.includes('## AI 채점 프롬프트'));
  assert.ok(!md12.includes('## 날짜별 snapshot'));
  const d15 = roadmap.days.find((d) => d.id === 'D15');
  const md15 = renderDay(d15, ctxFor(d15));
  assert.ok(!md15.includes('class="step-answer"'));
  assert.ok(!md15.includes('../tickets/'));
  assert.deepEqual(parseDayPage(md15).cards, d15.talkCards);
});

test('answer-fix(Dnn-m)는 순서 수에 넣지 않고, 그 순서 원래 커밋 뒤에 보완으로 붙고, snapshot은 그날 마지막 answer 커밋이다', () => {
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
  // snapshot 기준은 answer 커밋만 본다. answer-fix 트리에는 뒤 날 코드가 섞인다
  const lastAnswer = list.filter((c) => c.day === 'D09' && c.kind === 'answer').at(-1);
  assert.equal(answers.get('D09').last.sha, lastAnswer.sha);
  assert.equal(answers.get('D09').lastFix.sha, fix.sha);
  assert.equal(answers.get('D08').extras.get('D08-6').at(-1).sha, fixExtra.sha);
  // 렌더링: 원래 커밋 코드 다음에 "보완"
  const cache = new Map();
  const filesOf = (sha) => sha === fix.sha
    ? [{ path: 'src/main/java/com/example/board/post/PostCacheEvictListener.java', status: 'M', binary: false, generated: false, diff: '@@ -1 +1 @@\n-a\n+b\n' }]
    : (cache.get(sha) ?? cache.set(sha, commitFiles(sha, ROOT)).get(sha));
  const fixFilesOf = (fixes) => fixes.some((c) => c.sha === fix.sha) ? filesOf(fix.sha) : netFixFiles(fixes, ROOT);
  const md = renderDay(d09, {
    root: ROOT, roadmap, hints, hintsDay: hints.days.D09, ready: true, answers: answers.get('D09'), filesOf, fixFilesOf, lastTouch: () => null,
    cards: parseTalkCards(fs.readFileSync(path.join(ROOT, 'course/talk-cards.md'), 'utf8')),
    specSections: parseSpecSections(fs.readFileSync(path.join(ROOT, 'course/spec-v2.md'), 'utf8')),
  });
  const block = md.match(/<details class="step-answer" data-step="D09-3"[\s\S]*?\n<\/details>/)[0];
  // 실제 이력의 answer-fix(D09-3)에 합성 커밋 하나가 더해진다
  const fixes = step3.filter((c) => c.kind === 'fix').length;
  assert.ok(block.includes(`<summary>정답 보기 · answer(D09-3) + 보완 ${fixes}개`));
  const orig = block.indexOf(step3[0].sha.slice(0, 8));
  const extra = block.indexOf('**보완**');
  assert.ok(orig >= 0 && extra > orig, '보완은 원래 커밋 코드 뒤에 온다');
  assert.ok(block.indexOf(`- [\`${fix.sha.slice(0, 8)}\`](`) > extra, '보완 커밋은 보완 이력 목록에 남는다');
  assert.ok(block.includes('PostCacheEvictListener.java` (바뀐 부분)\n\n```diff\n@@ -1 +1 @@\n-a\n+b'), '보완 코드는 순 변경으로 싣는다');
  assert.ok(md.includes(`/tree/${lastAnswer.sha}/board-server`), 'snapshot은 그날 마지막 answer 커밋');
  assert.ok(!md.includes(`/tree/${fix.sha}/`), 'answer-fix 커밋을 snapshot으로 쓰지 않는다');
  assert.ok(md.includes('[보완 반영 최신 코드: main의 board-server]('), '보완이 있는 날은 최신 코드 링크를 따로 둔다');
  // 원래 커밋 없이 answer-fix만 있으면 멈춘다
  const orphan = list.filter((c) => !(c.day === 'D09' && c.m === 3 && c.kind === 'answer'));
  assert.throws(() => collectAnswers(roadmap, ROOT, orphan.filter((c) => c.day !== 'D09' || c.m !== 3 || c.kind === 'fix')), /answer-fix/);
});

test('생성 페이지 맨 위에 생성물 표시가 있다', () => {
  for (const [rel, md] of built.files) assert.ok(md.startsWith(HEADER), rel);
});

// GIT_CONFIG_COUNT/KEY/VALUE로 사용자 설정을 흉내 내 주입하고, 끝나면 원래 환경으로 돌린다
function withGitConfig(pairs, fn) {
  const keys = ['GIT_CONFIG_COUNT', ...pairs.flatMap((_, i) => [`GIT_CONFIG_KEY_${i}`, `GIT_CONFIG_VALUE_${i}`])];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  process.env.GIT_CONFIG_COUNT = String(pairs.length);
  pairs.forEach(([k, v], i) => { process.env[`GIT_CONFIG_KEY_${i}`] = k; process.env[`GIT_CONFIG_VALUE_${i}`] = v; });
  try { return fn(); } finally {
    for (const [k, v] of Object.entries(saved)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  }
}

test('diff 출력에 영향을 주는 git 설정이 달라도 생성 결과가 같다', () => {
  const hostile = [
    ['diff.suppressBlankEmpty', 'true'], ['color.ui', 'always'], ['color.diff', 'always'],
    ['diff.noprefix', 'true'], ['diff.mnemonicPrefix', 'true'], ['diff.relative', 'true'],
    ['diff.renames', 'copies'], ['core.quotePath', 'true'], ['diff.algorithm', 'patience'],
    ['diff.indentHeuristic', 'false'], ['diff.context', '10'], ['diff.interHunkContext', '10'],
    ['log.showSignature', 'true'], ['i18n.logOutputEncoding', 'ISO-8859-1'],
    ['apply.whitespace', 'fix'], ['core.autocrlf', 'true'],
  ];
  // 주입이 실제로 git에 닿는지 먼저 확인한다
  withGitConfig(hostile, () => {
    assert.equal(execFileSync('git', ['config', 'diff.suppressBlankEmpty'], { cwd: ROOT, encoding: 'utf8' }).trim(), 'true');
    const again = buildAll(ROOT);
    assert.deepEqual([...again.files.keys()], [...built.files.keys()]);
    for (const [k, v] of built.files) assert.equal(again.files.get(k), v, k);
  });
});

test('저장소가 아니면 빈 목록이지만, git 실행 실패는 숨기지 않고 던진다', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'build-days-nogit-'));
  try {
    assert.deepEqual(listAnswerCommits(tmp), []);
    // git 실행 파일을 찾지 못하는 경우
    const savedPath = process.env.PATH;
    process.env.PATH = tmp;
    try { assert.throws(() => listAnswerCommits(ROOT)); } finally { process.env.PATH = savedPath; }
    // 저장소 안에서 git이 다른 이유(설정 오류)로 실패하는 경우: 종료 코드 128이어도 저장소 부재가 아니다
    withGitConfig([['', '']], () => {
      delete process.env.GIT_CONFIG_KEY_0;
      assert.throws(() => listAnswerCommits(ROOT), /GIT_CONFIG_KEY_0|config/);
    });
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
});

test('보완은 순서별 순 변경이다: D09-5는 0패딩·Lua 이전 없이 마지막 상태(DB 문자열 정렬)만 싣는다', () => {
  const md = page('D09');
  const block = md.match(/<details class="step-answer" data-step="D09-5"[\s\S]*?\n<\/details>/)[0];
  const fixes = allCommits.filter((c) => c.kind === 'fix' && c.day === 'D09' && c.m === 5);
  assert.ok(fixes.length >= 3);
  for (const c of fixes) assert.ok(block.includes(c.sha), `data-commits에 ${c.sha.slice(0, 8)}`);
  const extra = block.slice(block.indexOf('**보완**'));
  assert.ok(extra.length < block.length);
  for (const gone of ['%019d', 'MEMBER_FORMAT', 'MIGRATE_AND_INCR']) assert.ok(!extra.includes(gone), `보완 블록에 ${gone}`);
  assert.ok(extra.includes('cast(l.member.id as string) desc'));
  assert.equal((extra.match(/^- \[`[0-9a-f]{8}`\]\(/gm) ?? []).length, fixes.length, '보완 이력은 커밋마다 한 줄');
  // 구간 안에는 다른 순서 fix(D10-5)도 있지만 D09-5 fix 파일은 이 순서 커밋만 바꿨으므로,
  // 그 파일들의 순 변경 = 첫 fix 부모 → 마지막 fix 사이 diff
  const base = `${fixes[0].sha}^`;
  const last = fixes.at(-1).sha;
  const g = (args) => execFileSync('git', ['-c', 'color.ui=never', '-c', 'diff.noprefix=false', '-c', `core.attributesFile=${os.devNull}`, ...args], { cwd: ROOT, encoding: 'utf8' });
  const touched = [...new Set(fixes.flatMap((c) => commitFiles(c.sha, ROOT).map((f) => f.path)))].sort();
  for (const p of touched) assert.deepEqual(g(['log', '--format=%H', `${base}..${last}`, '--', `board-server/${p}`]).split('\n').filter(Boolean).sort(), fixes.filter((c) => commitFiles(c.sha, ROOT).some((f) => f.path === p)).map((c) => c.sha).sort(), p);
  const net = netFixFiles(fixes, ROOT);
  assert.deepEqual(net.map((f) => f.path).sort(), touched);
  for (const f of net) {
    assert.equal(f.status, 'M', f.path);
    const raw = g(['diff', '--no-renames', '--no-color', '--diff-algorithm=myers', '--indent-heuristic', '--inter-hunk-context=0', '-U3', base, last, '--', `board-server/${f.path}`]);
    assert.equal(f.diff, raw.slice(raw.indexOf('\n@@') + 1), f.path);
  }
  // 커밋 하나씩 이어 붙이지 않는다(중간 커밋 제목 줄이 없다)
  assert.ok(!/^커밋 \[`[0-9a-f]{8}`\][^\n]*answer-fix/m.test(block));
});

// 작은 임시 저장소: steps = [[제목, { 경로: 내용 | null(삭제) }], ...]
function tempRepo(steps, fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'build-days-repo-'));
  const env = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t', GIT_AUTHOR_DATE: '2026-01-01T00:00:00Z', GIT_COMMITTER_DATE: '2026-01-01T00:00:00Z' };
  const g = (...args) => execFileSync('git', ['-c', 'commit.gpgsign=false', '-c', `core.hooksPath=${os.devNull}`, '-c', 'init.defaultBranch=main', ...args], { cwd: tmp, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    g('init', '-q');
    for (const [subject, files] of steps) {
      for (const [rel, text] of Object.entries(files)) {
        const abs = path.join(tmp, 'board-server', rel);
        if (text == null) fs.rmSync(abs);
        else { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, text); }
      }
      g('add', '-A');
      g('commit', '-q', '-m', subject);
    }
    return fn(tmp, listAnswerCommits(tmp));
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}
const lines = (edit = {}) => `${Array.from({ length: 20 }, (_, i) => edit[i + 1] ?? `L${i + 1}`).join('\n')}\n`;

test('보완 순 변경에 다른 순서 fix가 같은 파일을 바꾼 내용은 섞이지 않고, 되돌린 파일은 빠진다', () => {
  tempRepo([
    ['answer(D09-1): 시작', { 'a.txt': lines() }],
    ['answer-fix(D09-1): 둘째 줄', { 'a.txt': lines({ 2: 'X2' }), 'tmp.txt': '임시\n' }],
    ['answer-fix(D09-2): 다른 순서', { 'a.txt': lines({ 2: 'X2', 18: 'Y18' }) }],
    ['answer-fix(D09-1): 셋째 줄, 임시 파일 되돌림', { 'a.txt': lines({ 2: 'X2', 3: 'X3', 18: 'Y18' }), 'tmp.txt': null }],
  ], (repo, commits) => {
    const own = commits.filter((c) => c.kind === 'fix' && c.m === 1);
    const net = netFixFiles(own, repo);
    assert.deepEqual(net.map((f) => [f.path, f.status]), [['a.txt', 'M']], '되돌린 tmp.txt는 빠진다');
    assert.match(net[0].diff, /^\+X2$/m);
    assert.match(net[0].diff, /^\+X3$/m);
    assert.ok(!net[0].diff.includes('Y18'), '다른 순서 fix의 변경이 섞였다');
    const other = netFixFiles(commits.filter((c) => c.m === 2), repo);
    assert.ok(other[0].diff.includes('+Y18') && !other[0].diff.includes('+X3'));
    // 같은 입력이면 같은 결과
    assert.deepEqual(netFixFiles(own, repo), net);
  });
});

test('보완 패치가 다른 순서 커밋과 겹쳐 적용되지 않으면 생성기가 멈춘다', () => {
  tempRepo([
    ['answer(D09-1): 시작', { 'a.txt': lines() }],
    ['answer-fix(D09-1): 둘째 줄', { 'a.txt': lines({ 2: 'X2' }) }],
    ['answer-fix(D09-2): 다섯째 줄', { 'a.txt': lines({ 2: 'X2', 5: 'Y5' }) }],
    ['answer-fix(D09-1): 셋째 줄', { 'a.txt': lines({ 2: 'X2', 3: 'X3', 5: 'Y5' }) }],
  ], (repo, commits) => {
    assert.throws(() => netFixFiles(commits.filter((c) => c.kind === 'fix' && c.m === 1), repo), /D09-1: answer-fix [0-9a-f]{8}\(answer-fix\(D09-1\): 셋째 줄\)의 패치/);
  });
});

test('snapshot: 보완이 있는 날도 그날 마지막 answer 커밋(태그 answer-dNN)을 가리키고, 보완 없는 날에는 최신 코드 안내가 없다', () => {
  const answers = collectAnswers(roadmap, ROOT);
  const g = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  for (const d of answerDays) {
    const entry = answers.get(d.id);
    const md = page(d.id);
    const snap = md.slice(md.indexOf('## 날짜별 snapshot'));
    assert.equal(entry.last.kind, 'answer', d.id);
    assert.ok(snap.includes(`/tree/${entry.last.sha}/board-server`), `${d.id}: snapshot 링크`);
    assert.equal(snap.includes('보완 반영 최신 코드'), Boolean(entry.lastFix), `${d.id}: 최신 코드 안내`);
    // 태그가 문서 커밋을 가리키는 날(D06)도 있으므로 board-server 트리로 비교한다
    let tag = null;
    try { tag = g(['rev-parse', '--verify', '-q', `answer-${d.id.toLowerCase()}^{commit}:board-server`]); } catch { /* 태그 없는 복제 */ }
    if (tag) assert.equal(g(['rev-parse', `${entry.last.sha}:board-server`]), tag, `${d.id}: snapshot과 태그 answer-${d.id.toLowerCase()}의 board-server`);
  }
});

test('뒤 순서 코드에 기대는 보완(D09-1)은 원래 순서 칸에서 빼고 after 순서 칸 뒤에 싣는다', () => {
  const md = page('D09');
  const rule = DEFERRED_FIXES['D09-1'];
  const fixes = allCommits.filter((c) => c.kind === 'fix' && c.day === 'D09' && c.m === 1);
  assert.ok(fixes.length >= 1);
  const own = md.match(/<details class="step-answer" data-step="D09-1" data-commits="([^"]+)">([\s\S]*?)\n<\/details>/);
  for (const c of fixes) assert.ok(!own[1].includes(c.sha), '원래 순서 칸에는 보완 커밋이 없다');
  assert.ok(!own[2].includes('**보완 이력**'));
  assert.ok(own[2].includes('<a href="#fix-d09-1">'), '원래 순서 칸이 보완 칸을 가리킨다');
  const sec = md.indexOf('<section class="day-step-extra" id="fix-d09-1" data-commit="D09-1">');
  const after = md.indexOf(`<section class="day-step" id="step-d09-${rule.after}"`);
  const next = md.indexOf(`<section class="day-step" id="step-d09-${rule.after + 1}"`);
  assert.ok(after >= 0 && sec > after && (next < 0 || sec < next), 'after 순서 칸 바로 뒤');
  const block = md.slice(sec).match(/<details class="step-answer" data-step="D09-1" data-commits="([^"]+)">/);
  assert.deepEqual(block[1].split(' '), fixes.map((c) => c.sha));
  // 규칙이 없으면 생성기 검사가 잡는다: 그 보완은 D09-1 시점 코드에 붙지 않는다
  const answers = collectAnswers(roadmap, ROOT);
  assert.deepEqual(fixPlacementErrors('D09', answers.get('D09'), ROOT), []);
  const errs = fixPlacementErrors('D09', answers.get('D09'), ROOT, {});
  assert.equal(errs.length, 1);
  assert.match(errs[0], /^D09-1: answer-fix [0-9a-f]{8}.*DEFERRED_FIXES/);
});

test('보완 적용 시점 검사: 뒤 순서 코드를 문맥으로 쓰는 보완은 규칙 없이 멈추고, after 규칙이 있으면 통과한다', () => {
  tempRepo([
    ['answer(D09-1): 시작', { 'a.txt': lines() }],
    ['answer(D09-2): 다른 파일', { 'b.txt': 'b\n' }],
    ['answer(D09-3): 열째 줄', { 'a.txt': lines({ 10: 'Z10' }) }],
    ['answer-fix(D09-1): 열한째 줄(③의 열째 줄이 문맥)', { 'a.txt': lines({ 10: 'Z10', 11: 'X11' }) }],
  ], (repo, commits) => {
    const day = { id: 'D09', steps: [1, 2, 3].map((no) => ({ no })) };
    const entry = collectAnswers({ days: [day] }, repo, commits).get('D09');
    assert.match(fixPlacementErrors('D09', entry, repo, {}).join('\n'), /^D09-1: answer-fix/);
    assert.deepEqual(fixPlacementErrors('D09', entry, repo, { 'D09-1': { after: 3, note: '' } }), []);
    assert.match(fixPlacementErrors('D09', entry, repo, { 'D09-1': { after: 1, note: '' } }).join('\n'), /뒤 순서여야/);
  });
});

test('말하기 카드 근거는 페이지에 명세 절만 싣는다(저장소 밖 자료 번호는 뺀다)', () => {
  assert.equal(publicBasis('10 §8, spec-v2 §5-5, spec-v2 §7'), 'spec-v2 §5-5, spec-v2 §7');
  assert.equal(publicBasis('06 §15'), '');
  for (const d of readyDays) {
    for (const [, basis] of page(d.id).matchAll(/^\*\*근거\*\* (.+)$/gm)) assert.match(basis, /^spec-v2 §[\d-]+(, spec-v2 §[\d-]+)*$/, d.id);
  }
});
