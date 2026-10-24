import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FORBIDDEN = [/Docker Desktop/, /studymate/i, /3주 만에 3~6년차/];
const CARD_RE = /^TC-D\d{2}-\d$/;

// 표 머리가 `| 메서드 | 경로 |`인 표의 행만 읽는다
export function parseSpecEndpoints(md) {
  const out = [];
  let inTable = false;
  for (const line of md.split('\n')) {
    const cells = line.trim().startsWith('|') ? line.trim().split('|').slice(1, -1).map((c) => c.trim()) : null;
    if (!cells) { inTable = false; continue; }
    if (cells[0] === '메서드' && cells[1] === '경로') { inTable = true; continue; }
    if (inTable && /^[A-Z]+$/.test(cells[0]) && cells[1]) out.push(`${cells[0]} ${cells[1]}`);
  }
  return out;
}

export function parseTalkCardIds(md) {
  return [...md.matchAll(/^###\s+(TC-\S+)/gm)].map((m) => m[1]);
}

export function validate({ spec, roadmap, cards, courseFiles }) {
  const errs = [];
  const endpoints = parseSpecEndpoints(spec);
  const epSet = new Set(endpoints);
  const days = roadmap.days ?? [];

  if (days.length !== 15) errs.push(`일자 수가 15가 아니다: ${days.length}`);

  const cardIds = parseTalkCardIds(cards);
  const seen = new Set();
  for (const id of cardIds) {
    if (seen.has(id)) errs.push(`카드 ID 중복: ${id}`);
    seen.add(id);
    if (!CARD_RE.test(id)) errs.push(`카드 ID 형식 오류(TC-Dnn-n): ${id}`);
  }

  const usedRefs = new Set();
  const tickets = new Set();
  for (const [idx, day] of days.entries()) {
    const d = day.id;
    const num = idx + 1;
    const expectId = `D${String(num).padStart(2, '0')}`;
    if (d !== expectId) errs.push(`${idx + 1}번째 일자 ID가 ${expectId}가 아니다: ${d}`);
    const expectPhase = num <= 10 ? 'build' : num <= 14 ? 'maintain' : 'wrap';
    if (day.phase !== expectPhase) errs.push(`${d}: phase는 ${expectPhase}여야 한다(${day.phase})`);
    if (day.java !== `J${String(d).slice(1)}`) errs.push(`${d}: java ${day.java}가 ${d}와 짝이 아니다`);
    const tc = day.talkCards ?? [];
    if (tc.length < 3 || tc.length > 5) errs.push(`${d}: talkCards는 3~5개(${tc.length})`);
    for (const c of tc) {
      if (!seen.has(c)) errs.push(`${d}: talkCards ${c}가 카드 문서에 없다`);
      if (!c.startsWith(`TC-${d}-`)) errs.push(`${d}: 다른 날 카드를 참조한다 ${c}`);
    }

    const steps = day.steps ?? [];
    if (day.phase === 'build' && (steps.length < 3 || steps.length > 6)) errs.push(`${d}: build 단계 steps는 3~6개(${steps.length})`);
    if (day.phase === 'wrap' && steps.length < 1) errs.push(`${d}: wrap 단계 steps가 1개 이상 필요`);
    for (const s of steps) {
      const at = `${d} step ${s.no}`;
      const nf = (s.files ?? []).length;
      if (day.phase === 'build') {
        // 층 표시는 files를 근거로 하므로 수정하는 파일을 개수 때문에 생략하지 않는다.
        if (nf < 1) errs.push(`${at}: build 단계 files는 1개 이상(${nf})`);
        if ((s.specRefs ?? []).length < 1) errs.push(`${at}: build 단계 specRefs가 1개 이상 필요`);
      }
      if (day.phase === 'maintain') {
        if (nf > 3) errs.push(`${at}: maintain 단계 files는 0~3개(${nf})`);
        if ((s.tickets ?? []).length < 1) errs.push(`${at}: maintain 단계 tickets가 1개 이상 필요`);
      }
      for (const r of s.specRefs ?? []) {
        usedRefs.add(r);
        if (!epSet.has(r)) errs.push(`${at}: 명세에 없는 specRef ${r}`);
      }
      if (day.phase === 'maintain') for (const t of s.tickets ?? []) tickets.add(t);
    }
  }

  const javaById = new Map((roadmap.java ?? []).map((j) => [j.id, j]));
  const j0 = javaById.get('J00');
  if (!j0 || j0.optional !== true) errs.push('java: J00(optional: true)이 없다');
  for (let n = 1; n <= 15; n++) {
    const nn = String(n).padStart(2, '0');
    const j = javaById.get(`J${nn}`);
    if (!j) errs.push(`java: J${nn}이 없다`);
    else if (j.day !== `D${nn}`) errs.push(`java: J${nn}의 day는 D${nn}여야 한다(${j.day})`);
  }

  for (const e of endpoints) if (!usedRefs.has(e)) errs.push(`미사용 엔드포인트: ${e}`);
  for (let n = 1; n <= 16; n++) {
    const t = `B${String(n).padStart(2, '0')}`;
    if (!tickets.has(t)) errs.push(`maintain 단계에 티켓 ${t}가 없다`);
  }

  for (const [name, text] of Object.entries(courseFiles ?? {})) {
    for (const re of FORBIDDEN) if (re.test(text)) errs.push(`${name}: 금지어 ${re.source}`);
  }
  return errs;
}

// 과제·결과의 성질·예시 답을 구분하고 2단계 SQL의 보이는 문구를 검사한다.
export function validateSql({roadmap,hints}) {
  const errors=[];
  const leak=/rollback-only|self-invocation|커밋 전|afterCommit|갭 락|메타데이터 락|randomUUID|Lettuce|RedisGuard|ALTER TABLE|인덱스를 고치|인덱스를 바꾸|PG 호출이 트랜잭션에 묶여/;
  for(const day of roadmap.days) {
    const sql=hints.days?.[day.id]?.sql;
    if(!sql?.questions?.length) {errors.push(`${day.id}: 오늘의 SQL이 없다`);continue;}
    const n=sql.questions.length;
    if(n<(day.phase==='wrap'?1:2)||n>(day.phase==='wrap'?2:4)) errors.push(`${day.id}: SQL 문항 수 오류`);
    if(!sql.context) errors.push(`${day.id}: SQL 실행 대상이 없다`);
    for(const q of sql.questions) {
      if(!q.task||!q.expect||!q.example) errors.push(`${day.id}: SQL 과제·성질·예시가 필요하다`);
      if(/```|<details|<pre/i.test((q.task??'')+(q.expect??''))) errors.push(`${day.id}: SQL 예시를 과제 문구에 섞지 않는다`);
    }
    if(day.phase==='maintain' && leak.test([sql.context,...sql.questions.flatMap(q=>[q.task,q.expect])].join(' '))) errors.push(`${day.id}: SQL 원인·해법 누출`);
  }
  return errors;
}

// ---------------------------------------------------------------- 일자 페이지(course/spring)
const DAY_HEADER = '<!-- 생성물: tools/course/build-days.mjs가 만든다. 직접 고치지 마라 -->';
const CIRCLED = '⓪①②③④⑤⑥⑦⑧⑨';

// 펜스 코드 블록을 지운다(정답 코드 안의 `## `·`### TC-` 줄을 페이지 구조로 읽지 않기 위해)
export function stripFences(md) {
  const out = [];
  let fence = null;
  for (const line of md.split('\n')) {
    const m = line.match(/^(`{3,}|~{3,})/);
    if (fence) { if (m && m[1][0] === fence[0] && m[1].length >= fence.length && line.trim() === m[1]) fence = null; continue; }
    if (m) { fence = m[1]; continue; }
    out.push(line);
  }
  return out.join('\n');
}

export function parseDayPage(md) {
  const body = stripFences(md);
  const steps = [...body.matchAll(/^## ([⓪①②③④⑤⑥⑦⑧⑨]) (.+)$/gm)].map((m) => ({ no: CIRCLED.indexOf(m[1]), title: m[2].trim() }));
  // data-step은 일자까지 포함한 전체 ID(Dnn-m)로 읽는다
  const blocks = [...body.matchAll(/<section class="day-step" [^>]*data-step="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)].map((m) => ({
    id: m[1],
    headingNo: CIRCLED.indexOf(m[2].match(/^## ([⓪①②③④⑤⑥⑦⑧⑨]) /m)?.[1] ?? '?'),
    innerSteps: [...m[2].matchAll(/data-step="([^"]+)"/g)].map((x) => x[1]),
  }));
  const sections = blocks.map((b) => b.id);
  const checks = [...body.matchAll(/<input type="checkbox" class="step-check" data-step="([^"]+)"/g)].map((m) => m[1]);
  const allSteps = [...body.matchAll(/data-step="([^"]+)"/g)].map((m) => m[1]);
  const cards = [...body.matchAll(/^### (TC-\S+)/gm)].map((m) => m[1]);
  const java = [...body.matchAll(/\]\(\.\.\/java\/(J\d{2})\.md\)/g)].map((m) => m[1]);
  return { steps, sections, blocks, checks, allSteps, cards, java, generated: md.startsWith(DAY_HEADER) };
}

// pages: { 'D01.md': 본문, ... } (course/spring의 파일)
export function validateDayPages({ roadmap, pages }) {
  const errs = [];
  for (const f of ['D00.md', 'README.md']) if (!(f in pages)) errs.push(`course/spring/${f}이 없다`);
  for (const day of roadmap.days ?? []) {
    const f = `${day.id}.md`;
    if (!(f in pages)) { errs.push(`course/spring/${f}이 없다`); continue; }
    const p = parseDayPage(pages[f]);
    const at = `course/spring/${f}`;
    if (!p.generated) errs.push(`${at}: 생성물 표시 주석이 맨 위에 없다`);
    const want = (day.steps ?? []).map((s) => ({ no: s.no, title: s.title }));
    if (p.steps.length !== want.length) errs.push(`${at}: 순서 수 ${p.steps.length}가 roadmap ${want.length}와 다르다`);
    want.forEach((w, i) => {
      const got = p.steps[i];
      if (got && (got.no !== w.no || got.title !== w.title)) errs.push(`${at}: 순서 ${w.no} 제목이 roadmap과 다르다(${got.no} ${got.title})`);
    });
    const ids = want.map((w) => `${day.id}-${w.no}`).join(',');
    if (p.sections.join(',') !== ids) errs.push(`${at}: 순서 칸(data-step)이 roadmap 순서 ${ids}와 다르다(${p.sections.join(',')})`);
    if (p.checks.join(',') !== ids) errs.push(`${at}: 오늘 순서 체크(data-step)가 roadmap 순서 ${ids}와 다르다(${p.checks.join(',')})`);
    for (const b of p.blocks) {
      if (b.id !== `${day.id}-${b.headingNo}`) errs.push(`${at}: 순서 칸 ${b.id}의 제목 번호(${b.headingNo})가 data-step과 다르다`);
      for (const s of b.innerSteps) if (s !== b.id) errs.push(`${at}: ${b.id} 칸 안에 ${s} 블록이 있다`);
    }
    for (const s of new Set(p.allSteps)) if (!s.startsWith(`${day.id}-`)) errs.push(`${at}: 다른 날의 data-step ${s}`);
    if (p.cards.join(',') !== (day.talkCards ?? []).join(',')) errs.push(`${at}: 말하기 카드 ${p.cards.join(',')}가 roadmap talkCards ${(day.talkCards ?? []).join(',')}와 다르다`);
    if (!p.java.includes(day.java)) errs.push(`${at}: 오늘의 Java ${day.java} 링크가 없다`);
  }
  return errs;
}

function readTextFiles(dir, re) {
  const out = {};
  if (!fs.existsSync(dir)) return out;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (re.test(e.name)) out[path.relative(dir, p).split(path.sep).join('/')] = fs.readFileSync(p, 'utf8');
    }
  };
  walk(dir);
  return out;
}

function cli() {
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'course');
  const errs = [];
  const courseFiles = {};
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) if (/\.(md|json)$/.test(f)) courseFiles[f] = fs.readFileSync(path.join(dir, f), 'utf8');
  }
  for (const f of ['spec-v2.md', 'roadmap.json', 'talk-cards.md']) if (!(f in courseFiles)) errs.push(`course/${f} 파일이 없다`);
  let result = errs;
  if (!errs.length) {
    let roadmap;
    try { roadmap = JSON.parse(courseFiles['roadmap.json']); } catch (e) { errs.push(`course/roadmap.json 파싱 실패: ${e.message}`); }
    if (roadmap) {
      const pages = readTextFiles(path.join(dir, 'spring'), /\.md$/);
      // 금지어 검사는 일자 페이지·출발 자료까지 넓힌다
      const extraFiles = {};
      for (const [sub, re] of [['spring', /\.(md|html)$/], ['start', /\.(md|html|json|yaml|yml)$/]]) {
        for (const [f, text] of Object.entries(readTextFiles(path.join(dir, sub), re))) extraFiles[`${sub}/${f}`] = text;
      }
      result = [
        ...validate({ spec: courseFiles['spec-v2.md'], roadmap, cards: courseFiles['talk-cards.md'], courseFiles: { ...courseFiles, ...extraFiles } }),
        ...validateDayPages({ roadmap, pages }),
        ...validateSql({roadmap,hints:JSON.parse(courseFiles['hints.json'])}),
      ];
      if (!result.length) {
        console.log(`course OK: ${parseSpecEndpoints(courseFiles['spec-v2.md']).length} endpoints, ${roadmap.days.length} days, ${parseTalkCardIds(courseFiles['talk-cards.md']).length} cards, ${Object.keys(pages).length} day pages`);
        return;
      }
    }
  }
  for (const e of result) console.log(e);
  process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) cli();
