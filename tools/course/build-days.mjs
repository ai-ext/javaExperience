// 일자 페이지 생성기: course/roadmap.json + 정답 커밋 answer(Dnn-m) + course/talk-cards.md + course/hints.json
// → course/spring/D00~D15.md, course/spring/README.md
//
// - 같은 입력이면 같은 파일을 만든다(시각·환경 값을 쓰지 않는다).
// - hints.json에 항목이 있는 날만 완성 페이지로 만들고, 없는 날은 "준비 중" 자리표시 페이지로 만든다.
// - 정답 커밋을 하나도 찾지 못하면(얕은 복제·squash 병합) 아무것도 쓰지 않고 끝낸다. 커밋된 페이지의 인라인 정답을 지키기 위해서다.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const HEADER = '<!-- 생성물: tools/course/build-days.mjs가 만든다. 직접 고치지 마라 -->';
const REPO_URL = 'https://github.com/ai-ext/javaExperience';
const SERVER_DIR = 'board-server/';

// 순서 번호와 맞지 않는 정답 커밋. 여기 없는 커밋이 순서와 어긋나면 생성기가 멈춘다.
export const EXTRA_COMMITS = {
  'D01-0': { attachTo: 1, note: '순서 ①을 시작하기 전 준비 커밋(Gradle 실행 도구)이다.' },
  'D08-6': { extra: true, title: '보충: Hikari 운영 값과 타임아웃 테스트 안정화', note: '순서표에 없는 보충 커밋이다. 명세 8절의 Hikari 운영 값을 설정에 옮기고 타임아웃 테스트를 안정화한다.' },
};

// Gradle이 만드는 실행 스크립트는 내용을 싣지 않는다.
const GENERATED_FILES = new Set(['gradlew', 'gradlew.bat']);

const PHASE = {
  build: '1단계 · 빈 프로젝트로 서버 만들기',
  maintain: '2단계 · 어수선한 서버 넘겨받기',
  wrap: '마무리 · 설명 세션',
};
const CIRCLED = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];
export const circled = (n) => CIRCLED[n] ?? `(${n})`;

// tools/site/build.mjs와 같은 앵커 규칙
export const slugify = (text) => text.toLowerCase().trim().replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '').replace(/ /g, '-');
const stripMd = (s) => s.replace(/`/g, '').replace(/\*\*/g, '');
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// raw HTML 안에서는 마크다운이 처리되지 않으므로 인라인 코드만 직접 바꾼다
const inlineHtml = (s) => escapeHtml(s).replace(/`([^`]+)`/g, '<code>$1</code>');
const read = (p) => fs.readFileSync(p, 'utf8');
const dayNo = (id) => Number(id.slice(1));
const dd = (n) => String(n).padStart(2, '0');
export const stepId = (day, no) => `${day}-${no}`;
export const stepAnchor = (day, no) => `step-${day.toLowerCase()}-${no}`;

// ---------------------------------------------------------------- git
const GIT_FLAGS = ['-c', 'color.ui=never', '-c', 'diff.noprefix=false', '-c', 'diff.mnemonicPrefix=false', '-c', 'core.quotepath=off', '-c', 'diff.renames=false'];
function git(root, args) {
  return execFileSync('git', [...GIT_FLAGS, ...args], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
}

// 정답 커밋 목록: [{ sha, subject, kind, day, m }] (오래된 것부터)
// kind: 'answer' = 순서 커밋 answer(Dnn-m), 'fix' = 리뷰 반영 커밋 answer-fix(Dnn-m). 순서 수는 answer만 센다.
// git 저장소가 아니면(압축본 등) 빈 목록. 그 밖의 git 오류는 숨기지 않고 던진다.
// --grep은 사용자의 grep.patternType 설정에 따라 괄호 해석이 달라지므로 쓰지 않고 JS 정규식으로 거른다.
export function listAnswerCommits(root = ROOT) {
  try { git(root, ['rev-parse', '--is-inside-work-tree']); } catch { return []; }
  const out = git(root, ['log', '--reverse', '--format=%H%x09%s', 'HEAD']);
  const list = [];
  for (const line of out.split('\n')) {
    const [sha, subject] = line.split('\t');
    const m = subject?.match(/^answer(-fix)?\((D\d{2})-(\d+)\):\s*(.+)$/);
    if (m) list.push({ sha, subject, kind: m[1] ? 'fix' : 'answer', day: m[2], m: Number(m[3]), title: m[4] });
  }
  return list;
}

// 커밋 하나의 board-server 변경: [{ path, status, binary, generated, content | diff, lines }]
export function commitFiles(sha, root = ROOT) {
  const statusOut = git(root, ['show', '--format=', '--no-renames', '--name-status', sha, '--', SERVER_DIR]);
  const numOut = git(root, ['show', '--format=', '--no-renames', '--numstat', sha, '--', SERVER_DIR]);
  const binary = new Set(numOut.split('\n').filter(Boolean).map((l) => l.split('\t')).filter((c) => c[0] === '-').map((c) => c[2]));
  const files = [];
  for (const line of statusOut.split('\n').filter(Boolean)) {
    const [status, full] = line.split('\t');
    const rel = full.slice(SERVER_DIR.length);
    const f = { path: rel, status: status[0], binary: binary.has(full), generated: GENERATED_FILES.has(rel) };
    if (!f.binary && !f.generated) {
      if (f.status === 'A') f.content = git(root, ['show', `${sha}:${full}`]);
      else if (f.status === 'M') {
        const raw = git(root, ['show', '--format=', '--no-renames', '--no-ext-diff', '--diff-algorithm=myers', '--indent-heuristic', '--inter-hunk-context=0', '-U3', sha, '--', full]);
        f.diff = raw.slice(raw.indexOf('\n@@') + 1);
      }
    }
    files.push(f);
  }
  return files;
}

// 일자별 정답: Map(day → { steps: Map(no → [commit]), extras: Map(Dnn-m → [commit]), last: commit })
// 한 순서의 커밋 목록은 원래 answer 커밋(들) 다음에 같은 Dnn-m의 answer-fix 커밋이 시간순으로 붙는다.
// last는 그날 answer·answer-fix 중 가장 나중 커밋(snapshot 기준)이다.
export function collectAnswers(roadmap, root = ROOT, commits = listAnswerCommits(root)) {
  const byDay = new Map();
  for (const c of commits) {
    const day = roadmap.days.find((d) => d.id === c.day);
    if (!day) throw new Error(`roadmap에 없는 날의 정답 커밋: ${c.subject}`);
    if (!byDay.has(c.day)) byDay.set(c.day, { steps: new Map(), extras: new Map(), last: null });
    const entry = byDay.get(c.day);
    const key = stepId(c.day, c.m);
    const rule = EXTRA_COMMITS[key];
    const stepNos = day.steps.map((s) => s.no);
    if (rule?.extra) {
      if (!entry.extras.has(key)) entry.extras.set(key, []);
      entry.extras.get(key).push({ ...c, rule });
    } else {
      const no = rule?.attachTo ?? c.m;
      if (!stepNos.includes(no)) throw new Error(`순서와 맞지 않는 정답 커밋: ${c.subject} (EXTRA_COMMITS에 규칙이 없다)`);
      if (!entry.steps.has(no)) entry.steps.set(no, []);
      entry.steps.get(no).push({ ...c, rule });
    }
    entry.last = c;
  }
  // answer-fix가 원래 answer 커밋보다 앞에 오지 않게 한다(원래 커밋 → 보완 순서)
  for (const entry of byDay.values()) {
    for (const list of [...entry.steps.values(), ...entry.extras.values()]) {
      if (list[0]?.kind === 'fix') throw new Error(`answer-fix 커밋이 원래 answer 커밋보다 먼저 있다: ${list[0].subject}`);
    }
  }
  return byDay;
}

// ---------------------------------------------------------------- 재료 읽기
export function parseTalkCards(md) {
  const cards = new Map();
  const blocks = md.split(/^(?=### TC-)/m).slice(1);
  for (const block of blocks) {
    const body = block.split(/^## /m)[0];
    const id = body.match(/^### (TC-\S+)/)[1];
    const question = body.match(/\*\*질문\*\*\s*([\s\S]*?)(?=\n\*\*답에 들어가야 할 것\*\*)/)?.[1].trim();
    const answers = (body.match(/\*\*답에 들어가야 할 것\*\*\s*\n([\s\S]*?)(?=\n\*\*근거\*\*|$)/)?.[1] ?? '')
      .split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2).trim());
    const basis = body.match(/\*\*근거\*\*\s*(.+)/)?.[1].trim() ?? '';
    if (!question || !answers.length) throw new Error(`말하기 카드 형식 오류: ${id}`);
    cards.set(id, { id, question, answers, basis });
  }
  return cards;
}

// spec-v2.md의 제목 앵커와, 엔드포인트가 본문에 나오는 절
export function parseSpecSections(md) {
  const seen = new Map();
  const sections = [];
  let inFence = false;
  for (const line of md.split('\n')) {
    if (/^```/.test(line)) inFence = !inFence;
    const h = !inFence && line.match(/^(#{1,6}) (.+)$/);
    if (h) {
      let id = slugify(stripMd(h[2]));
      const n = seen.get(id) ?? 0;
      seen.set(id, n + 1);
      if (n) id = `${id}-${n}`;
      sections.push({ depth: h[1].length, title: stripMd(h[2]), id, body: '' });
    } else if (sections.length) sections[sections.length - 1].body += `${line}\n`;
  }
  return sections;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function specLinks(ref, sections) {
  const endpointSection = sections.find((s) => s.depth === 2 && /엔드포인트/.test(s.title));
  if (!endpointSection) throw new Error('spec-v2.md에 엔드포인트 절이 없다');
  const re = new RegExp(`(^|[^\\w/{}])${escapeRe(ref)}(?![\\w/{}])`, 'm');
  const extra = sections.filter((s) => s !== endpointSection && s.depth >= 2 && re.test(s.body)).map((s) => ({ id: s.id, title: s.title }));
  return { endpoint: { id: endpointSection.id, title: endpointSection.title }, extra };
}

function javaInfo(id, root) {
  const md = read(path.join(root, 'course/java', `${id}.md`));
  const title = md.match(/^# (.+)$/m)[1].trim();
  const duration = md.match(/소요\s*([^·\n]+)/)?.[1].trim() ?? '30~60분';
  return { id, title, duration };
}

// ---------------------------------------------------------------- 마크다운 조각
const LANG = { java: 'java', yml: 'yaml', yaml: 'yaml', xml: 'xml', sql: 'sql', gradle: 'groovy', md: 'markdown', json: 'json', properties: 'properties', sh: 'bash', http: 'http' };
export function fence(text, lang = '') {
  const longest = Math.max(0, ...[...text.matchAll(/`+/g)].map((m) => m[0].length));
  const tick = '`'.repeat(Math.max(3, longest + 1));
  return `${tick}${lang}\n${text.replace(/\n$/, '')}\n${tick}`;
}
const langOf = (p) => LANG[path.extname(p).slice(1)] ?? (path.basename(p).startsWith('.') ? '' : 'text');

const fileOrder = (stepFiles) => (a, b) => {
  const rank = (f) => {
    const i = stepFiles.indexOf(f.path);
    if (i >= 0) return [0, i];
    if (f.path.startsWith('src/main/')) return [1, 0];
    if (f.path.startsWith('src/test/')) return [2, 0];
    return [3, 0];
  };
  const [ra, ia] = rank(a); const [rb, ib] = rank(b);
  return ra - rb || ia - ib || (a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
};

function renderFile(f) {
  const label = { A: '새 파일', M: '수정', D: '삭제' }[f.status] ?? f.status;
  const head = `**${label}** \`${f.path}\``;
  if (f.status === 'D') return `${head} — 이 커밋에서 지운다.`;
  if (f.binary) return `${head} — 바이너리 파일이라 내용은 싣지 않는다.`;
  if (f.generated) return `${head} — Gradle이 만드는 실행 스크립트라 내용은 싣지 않는다(\`gradle wrapper\`로 만들고, start.spring.io 압축에도 들어 있다).`;
  if (f.status === 'A') return `${head}\n\n${fence(f.content, langOf(f.path))}`;
  return `${head} (바뀐 부분)\n\n${fence(f.diff, 'diff')}`;
}

function renderCommitAnswer(commit, files, stepFiles) {
  const sorted = [...files].sort(fileOrder(stepFiles));
  const link = `커밋 [\`${commit.sha.slice(0, 8)}\`](${REPO_URL}/commit/${commit.sha}) — ${commit.subject}`;
  const lines = commit.kind === 'fix' ? [`**보완** — 리뷰를 반영해 이 순서의 코드를 고친 커밋이다.`, '', link] : [link];
  if (commit.rule?.note) lines.push('', commit.rule.note);
  for (const f of sorted) lines.push('', renderFile(f));
  return lines.join('\n');
}

function answerBlock(dataStep, commits, stepFiles, filesOf, lastTouch) {
  const all = commits.flatMap((c) => filesOf(c.sha));
  const originals = commits.filter((c) => c.kind !== 'fix');
  const fixes = commits.length - originals.length;
  const names = originals.map((c) => `answer(${stepId(c.day, c.m)})`).join(' + ') + (fixes ? ` + 보완 ${fixes}개` : '');
  const touched = new Set(all.map((f) => f.path));
  const untouched = stepFiles.filter((f) => !touched.has(f)).map((f) => {
    const prev = lastTouch?.(commits[0].sha, f);
    return `- \`${f}\` — 이 순서에서는 바뀌지 않는다. ${prev ? `앞선 ${prev}에서 만든 코드를 그대로 쓴다.` : '앞선 순서에서 만든 코드를 그대로 쓴다.'}`;
  });
  return [
    `<details class="step-answer" data-step="${dataStep}" data-commits="${commits.map((c) => c.sha).join(' ')}">`,
    `<summary>정답 보기 · ${names} · board-server 파일 ${all.length}개</summary>`,
    '',
    commits.map((c) => renderCommitAnswer(c, filesOf(c.sha), stepFiles)).join('\n\n---\n\n'),
    ...(untouched.length ? ['', '**만들 파일 중 이 커밋에 없는 것**', '', ...untouched] : []),
    '',
    '</details>',
  ].join('\n');
}

function hintBlock(dataStep, hints) {
  return [
    `<details class="step-hint" data-step="${dataStep}">`,
    '<summary>막히면</summary>',
    '',
    ...hints.map((h) => `- ${h}`),
    '',
    '</details>',
  ].join('\n');
}

function cardBlock(card) {
  return [
    `### ${card.id}`,
    '',
    `**질문** ${card.question}`,
    '',
    `<details class="card-answer" data-card="${card.id}">`,
    '<summary>답에 들어가야 할 것</summary>',
    '',
    ...card.answers.map((a) => `- ${a}`),
    '',
    card.basis ? `**근거** ${card.basis}` : '',
    '',
    '</details>',
  ].filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
}

function checklist(day, steps) {
  const items = steps.map((s) => {
    const id = stepId(day.id, s.no);
    return `<li data-step="${id}"><label><input type="checkbox" class="step-check" data-step="${id}"> <a href="#${stepAnchor(day.id, s.no)}">${circled(s.no)} ${inlineHtml(s.title)}</a></label></li>`;
  });
  return [`<ol class="day-steps" data-day="${day.id}">`, ...items, '</ol>'].join('\n');
}

function navLine(day, roadmap) {
  const n = dayNo(day.id);
  const prev = n === 1 ? '[← D00 워밍업](D00.md)' : `[← D${dd(n - 1)}](D${dd(n - 1)}.md)`;
  const next = n < roadmap.days.length ? `[D${dd(n + 1)} →](D${dd(n + 1)}.md)` : '';
  return [prev, '[일자 목록](README.md)', next].filter(Boolean).join(' · ');
}

export function graderPrompt(day, cards, hintsDay, template) {
  const criteria = [];
  for (const s of day.steps) {
    criteria.push(`${circled(s.no)} ${stripMd(s.title)}`);
    s.done.forEach((d, i) => criteria.push(`  - [C${s.no}-${i + 1}] ${stripMd(d)}`));
    if (s.trap) criteria.push(`  - [R${s.no}] 함정을 피했는지 코드로 확인: ${stripMd(s.trap)}`);
  }
  const cardLines = [];
  for (const id of day.talkCards) {
    const c = cards.get(id);
    cardLines.push(`- [${id}] ${stripMd(c.question)}`);
    c.answers.forEach((a) => cardLines.push(`    · ${stripMd(a)}`));
  }
  const focus = (hintsDay.grader?.focus ?? []).map((f) => `- ${f}`).join('\n') || '- (없음)';
  return template
    .replaceAll('{{DAY}}', day.id)
    .replaceAll('{{TITLE}}', day.title)
    .replaceAll('{{CRITERIA}}', criteria.join('\n'))
    .replaceAll('{{CARDS}}', cardLines.join('\n'))
    .replaceAll('{{FOCUS}}', focus);
}

// ---------------------------------------------------------------- 페이지
function dayHeader(day, java, extra = '') {
  return [
    HEADER,
    '',
    `# ${day.id}. ${day.title}`,
    '',
    `> ${PHASE[day.phase]} · 오늘의 Java [${java.id}](../java/${java.id}.md) · 순서 ${day.steps.length}개 · 말하기 카드 ${day.talkCards.length}장${extra}`,
  ].join('\n');
}

function javaSection(java, roadmapJava) {
  return [
    '## 오늘의 Java',
    '',
    `[${java.title}](../java/${java.id}.md) — ${java.duration}. Spring 순서를 시작하기 전에 오늘 쓰는 Java를 먼저 연습한다.`,
    ...(roadmapJava?.topic ? ['', `- 주제: ${roadmapJava.topic}`] : []),
  ].join('\n');
}

function stepSection(day, s, ctx) {
  const id = stepId(day.id, s.no);
  const lines = [`<section class="day-step" id="${stepAnchor(day.id, s.no)}" data-step="${id}">`, '', `## ${circled(s.no)} ${s.title}`, ''];
  if (ctx.ready && s.files.length) lines.push('**만들 파일** (board-server 기준)', '', ...s.files.map((f) => `- \`${f}\``), '');
  if (s.tickets?.length) lines.push(`**티켓** ${s.tickets.map((t) => `\`${t}\``).join(' · ')}`, '');
  if (ctx.ready) {
    if (s.trap) lines.push(`**겪을 것** ${s.trap}`, '');
    lines.push('**완료 조건**', '', ...s.done.map((d) => `- ${d}`), '');
    if (s.specRefs.length) {
      const refs = s.specRefs.map((r) => {
        const l = specLinks(r, ctx.specSections);
        const more = l.extra.map((e) => `[${e.title}](../spec-v2.md#${e.id})`);
        return `[\`${r}\`](../spec-v2.md#${l.endpoint.id})${more.length ? ` (${more.join(', ')})` : ''}`;
      });
      lines.push(`**명세** ${refs.join(' · ')}`, '');
    }
    const hints = ctx.hintsDay.steps?.[String(s.no)];
    if (!hints?.length) throw new Error(`hints.json: ${id} 힌트가 없다`);
    lines.push(hintBlock(id, hints), '');
    if (day.phase === 'build') {
      // 1단계: 그 순서 커밋의 정답을 인라인으로 싣는다
      const commits = ctx.answers?.steps.get(s.no);
      if (!commits?.length) throw new Error(`${id}: 정답 커밋 answer(${id})이 없다`);
      lines.push(answerBlock(id, commits, s.files, ctx.filesOf, ctx.lastTouch), '');
    } else if (day.phase === 'maintain' && s.tickets?.length) {
      // 2단계: 티켓 정답은 티켓 페이지에만 둔다(마크다운 링크라 빌드 링크 검사가 티켓 페이지 누락을 잡는다)
      lines.push(`**원인과 정답** ${s.tickets.map((t) => `[${t} 티켓 페이지](../tickets/${t}.md)`).join(' · ')}의 "원인과 정답" 접기에 있다.`, '');
    }
    // 마무리(wrap): 정답 칸이 없다
  } else {
    lines.push(`> 준비 중: 이 순서의 만들 파일·겪을 것·완료 조건·힌트${day.phase === 'maintain' ? '·정답은 2단계 티켓 페이지와 함께' : '는 마무리 자료와 함께'} 채운다.`, '');
  }
  lines.push('</section>');
  return lines.join('\n');
}

function extraSection(day, commits, ctx) {
  const commit = commits[0];
  const id = stepId(day.id, commit.m);
  return [
    `<section class="day-step-extra" id="extra-${day.id.toLowerCase()}-${commit.m}" data-commit="${id}">`,
    '',
    `## ${commit.rule.title}`,
    '',
    commit.rule.note,
    '',
    answerBlock(id, commits, [], ctx.filesOf),
    '',
    '</section>',
  ].join('\n');
}

export function renderDay(day, ctx) {
  const java = javaInfo(day.java, ctx.root);
  const roadmapJava = ctx.roadmap.java.find((j) => j.id === day.java);
  const parts = [dayHeader(day, java, ctx.ready ? '' : ' · **준비 중**')];
  if (!ctx.ready) parts.push('> 이 날은 아직 준비 중이다. 순서 제목과 말하기 카드만 먼저 싣고, 티켓 페이지·힌트·채점 프롬프트는 2단계 자료가 끝난 뒤 채운다.');
  parts.push('## 오늘 순서', checklist(day, day.steps), javaSection(java, roadmapJava), '---');
  for (const s of day.steps) parts.push(stepSection(day, s, ctx));
  for (const group of ctx.answers?.extras.values() ?? []) parts.push(extraSection(day, group, ctx));
  parts.push('---', '## 말하기 카드', '하루가 끝나면 질문에 "문제 상황 → 원인 → 선택 → 결과" 순서로 소리 내어 답한 뒤, 접힌 "답에 들어가야 할 것"과 비교한다. 세 줄이 모두 나오면 통과다.');
  for (const id of day.talkCards) {
    const card = ctx.cards.get(id);
    if (!card) throw new Error(`${day.id}: 말하기 카드 ${id}가 talk-cards.md에 없다`);
    parts.push(cardBlock(card));
  }
  if (ctx.ready) {
    parts.push('## AI 채점 프롬프트', '오늘 순서를 다 만들었으면 서버를 띄운 채로 아래 프롬프트를 복사해 Codex 또는 Claude Code에 붙여 넣는다. 에이전트가 완료 조건·함정·말하기 카드로 채점표를 준다. 코드는 고치지 않는다.');
    parts.push(fence(graderPrompt(day, ctx.cards, ctx.hintsDay, ctx.hints.graderTemplate), 'text'));
  }
  parts.push('## 내일 미리보기', day.tomorrow);
  if (ctx.ready && ctx.answers?.last) {
    const sha = ctx.answers.last.sha;
    parts.push('## 날짜별 snapshot', `오늘 마지막 정답 커밋은 \`${sha.slice(0, 8)}\`(${ctx.answers.last.subject})이다. [이 시점의 board-server 전체 보기](${REPO_URL}/tree/${sha}/board-server). 기준은 위 순서 칸의 인라인 정답이고, 이 링크는 보조다(PR 병합 방식에 따라 커밋이 사라질 수 있다).`);
  }
  const refs = ctx.hintsDay?.refs ?? [];
  if (refs.length) {
    const items = refs.map((p) => {
      const abs = path.join(ctx.root, p);
      if (!fs.existsSync(abs)) throw new Error(`hints.json: ${day.id} 참고 자료가 없다 → ${p}`);
      const label = stripMd(read(abs).match(/^# (.+)$/m)?.[1].trim() ?? path.basename(p));
      return `- [${label}](../../${p})`;
    });
    parts.push('## 참고 자료', '<details class="day-refs">\n<summary>기존 시나리오·공부자료 (참고 도감)</summary>\n\n' + items.join('\n') + '\n\n</details>');
  }
  parts.push(navLine(day, ctx.roadmap));
  return `${parts.join('\n\n')}\n`;
}

export function renderD00(roadmap, root) {
  const j0 = roadmap.java.find((j) => j.id === 'J00');
  const java = javaInfo('J00', root);
  return [
    HEADER,
    '',
    '# D00. Java 워밍업 (선택)',
    '',
    `> 선택 · D01 전 반나절~1일 · 오늘의 Java [J00](../java/J00.md)`,
    '',
    'D01부터는 Spring 코드 안에서 메서드를 만들고, 필드를 선언하고, `List<Post>`를 돌며 DTO로 바꾸는 일이 매일 나온다. 그 전에 Spring 없이 순수 Java로 손을 푼다. 시간이 없으면 건너뛰고 D01로 간다.',
    '',
    '## 오늘 할 것',
    '',
    `1. [${java.title}](../java/J00.md) — ${java.duration}`,
    `2. [출발 자료](../start/README.md)로 JDK 21·Colima·IntelliJ를 준비하고 compose가 뜨는지 확인한다`,
    '',
    '## 워밍업 주제',
    '',
    `- ${j0.topic}`,
    j0.basics ? `- 기본기: ${j0.basics}` : '',
    '',
    '## 내일 미리보기',
    '',
    `D01은 start.spring.io로 빈 프로젝트를 만들고 헬스 체크를 여는 것부터 시작한다. 오늘 연습한 메서드·필드·값 전달이 D01의 요청 ID 필터와 J01의 \`Member\` 클래스에서 바로 쓰인다.`,
    '',
    '[일자 목록](README.md) · [D01 →](D01.md)',
    '',
  ].filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
}

export function renderIndex(roadmap, hints) {
  const rows = roadmap.days.map((d) => {
    const ready = Boolean(hints.days[d.id]);
    return `| [${d.id}](${d.id}.md) | ${PHASE[d.phase].split(' · ')[0]} | ${d.title} | [${d.java}](../java/${d.java}.md) | ${d.steps.length} | ${d.talkCards.length} | ${ready ? '준비됨' : '준비 중'} |`;
  });
  return [
    HEADER,
    '',
    '# Spring 트랙 일자 페이지',
    '',
    '하루 한 페이지다. 맨 위 [오늘 순서]대로 만들고, 막히면 순서 칸의 힌트를, 그래도 막히면 그 순서의 정답만 펼친다. 하루가 끝나면 말하기 카드에 답하고 AI 채점 프롬프트로 확인한다.',
    '',
    '- 1단계(D01~D10): 빈 프로젝트로 서버 만들기. 시작은 [출발 자료](../start/README.md)',
    '- 2단계(D11~D14): 어수선한 서버 넘겨받기',
    '- 마무리(D15): 설명 세션',
    '',
    '| 일 | 단계 | 마일스톤 | 오늘의 Java | 순서 | 말하기 카드 | 상태 |',
    '|---|---|---|---|---|---|---|',
    '| [D00](D00.md) | 선택 | Java 워밍업 | [J00](../java/J00.md) | - | 0 | 준비됨 |',
    ...rows,
    '',
    '과정 안내는 [과정 v2](../README.md), 계약은 [명세서 v2](../spec-v2.md), 카드 전체는 [말하기 카드](../talk-cards.md)에 있다.',
    '',
  ].join('\n');
}

// ---------------------------------------------------------------- 전체 생성
// 반환: { files: Map(상대 경로 → 내용), skipped: 이유 | null, warnings: [] }
export function buildAll(root = ROOT) {
  const roadmap = JSON.parse(read(path.join(root, 'course/roadmap.json')));
  const hints = JSON.parse(read(path.join(root, 'course/hints.json')));
  const cards = parseTalkCards(read(path.join(root, 'course/talk-cards.md')));
  const specSections = parseSpecSections(read(path.join(root, 'course/spec-v2.md')));
  const commits = listAnswerCommits(root);
  if (!commits.length) return { files: new Map(), skipped: 'answer(Dnn-m) 정답 커밋을 찾지 못했다(얕은 복제 또는 squash 병합). 커밋된 일자 페이지를 그대로 둔다.', warnings: [] };
  const answers = collectAnswers(roadmap, root);
  const cache = new Map();
  const filesOf = (sha) => { if (!cache.has(sha)) cache.set(sha, commitFiles(sha, root)); return cache.get(sha); };
  // 그 커밋 전에 파일을 마지막으로 바꾼 정답 커밋 이름(예: answer(D03-3))
  const lastTouch = (sha, file) => {
    const out = git(root, ['log', '--format=%s', `${sha}^`, '--', SERVER_DIR + file]);
    const m = out.split('\n').map((l) => l.match(/^(answer(?:-fix)?)\((D\d{2}-\d+)\):/)).find(Boolean);
    return m ? `${m[1]}(${m[2]})` : null;
  };
  const warnings = [];
  const files = new Map();
  files.set('course/spring/D00.md', renderD00(roadmap, root));
  for (const day of roadmap.days) {
    const hintsDay = hints.days[day.id];
    const ready = Boolean(hintsDay);
    const dayAnswers = answers.get(day.id);
    if (ready && day.phase === 'build') {
      for (const s of day.steps) {
        const commitsOf = dayAnswers?.steps.get(s.no) ?? [];
        if (!commitsOf.length) throw new Error(`${stepId(day.id, s.no)}: 정답 커밋이 없다`);
        const touched = new Set(commitsOf.flatMap((c) => filesOf(c.sha).map((f) => f.path)));
        for (const f of s.files) if (!touched.has(f)) warnings.push(`${stepId(day.id, s.no)}: roadmap 파일 ${f}을 정답 커밋이 건드리지 않는다`);
      }
    }
    files.set(`course/spring/${day.id}.md`, renderDay(day, { root, roadmap, hints, hintsDay: hintsDay ?? {}, cards, specSections, answers: ready && day.phase === 'build' ? dayAnswers : null, filesOf, lastTouch, ready }));
  }
  files.set('course/spring/README.md', renderIndex(roadmap, hints));
  return { files, skipped: null, warnings };
}

function cli() {
  const check = process.argv.includes('--check');
  const { files, skipped, warnings } = buildAll(ROOT);
  if (skipped) { console.warn(`build-days: ${skipped}`); return; }
  for (const w of warnings) console.warn(`build-days 경고: ${w}`);
  const stale = [];
  for (const [rel, content] of files) {
    const abs = path.join(ROOT, rel);
    const cur = fs.existsSync(abs) ? read(abs) : null;
    if (cur === content) continue;
    if (check) stale.push(rel);
    else { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, content); }
  }
  if (check && stale.length) { console.error(`build-days: 생성물이 최신이 아니다:\n${stale.join('\n')}`); process.exit(1); }
  console.log(`build-days: 일자 페이지 ${files.size}개 ${check ? '확인' : '생성'}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) cli();
