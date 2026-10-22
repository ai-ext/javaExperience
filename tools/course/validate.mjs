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
        if (nf < 1 || nf > 3) errs.push(`${at}: build 단계 files는 1~3개(${nf})`);
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
      result = validate({ spec: courseFiles['spec-v2.md'], roadmap, cards: courseFiles['talk-cards.md'], courseFiles });
      if (!result.length) {
        console.log(`course OK: ${parseSpecEndpoints(courseFiles['spec-v2.md']).length} endpoints, ${roadmap.days.length} days, ${parseTalkCardIds(courseFiles['talk-cards.md']).length} cards`);
        return;
      }
    }
  }
  for (const e of result) console.log(e);
  process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) cli();
