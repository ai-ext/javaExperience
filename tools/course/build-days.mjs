// 일자 페이지 생성기: course/days/Dnn.json + _common.json + 정답 커밋 answer(Dnn-m)
// → course/spring/D00~Dnn.md, course/spring/README.md
//
// - 같은 입력이면 같은 파일을 만든다(시각·환경 값을 쓰지 않는다).
// - Dnn.json의 hints가 있는 날만 완성 페이지로 만들고, 없는 날은 "준비 중" 자리표시 페이지로 만든다.
// - 정답 커밋을 하나도 찾지 못하면(얕은 복제·squash 병합) 아무것도 쓰지 않고 끝낸다. 커밋된 페이지의 인라인 정답을 지키기 위해서다.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadCourseSources } from './sources.mjs';
import { withSpringConfigVariants } from './spring-config.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const HEADER = '<!-- 생성물: tools/course/build-days.mjs가 만든다. 직접 고치지 마라 -->';
const REPO_URL = 'https://github.com/ai-ext/javaExperience';
const SERVER_DIR = 'board-server/';

// 순서 번호와 맞지 않는 정답 커밋. 여기 없는 커밋이 순서와 어긋나면 생성기가 멈춘다.
export const EXTRA_COMMITS = {
  'D01-0': { attachTo: 1, note: '순서 ①을 시작하기 전 준비 커밋(Gradle 실행 도구)이다.' },
  'D08-6': { extra: true, title: '보충: Hikari 운영 값과 타임아웃 테스트 안정화', note: '순서표에 없는 보충 커밋이다. 명세 8절의 Hikari 운영 값을 설정에 옮기고 타임아웃 테스트를 안정화한다.' },
};

// 보완(answer-fix)이 뒤 순서 코드에 기대고 있어 그 순서 시점 코드에 붙지 않는 경우: after 순서 칸 뒤에 따로 싣는다.
// 여기 없는 보완이 제 순서 시점 코드에 붙지 않으면 생성기가 멈춘다(fixPlacementErrors).
export const DEFERRED_FIXES = {
  'D09-1': { after: 3, note: '이 diff는 ③의 보완(옛 인기글 목록 다시 쓰기 막기)에서 생기는 `GEN_KEY`·`BUMP_AND_DELETE`와 ③의 삭제 테스트를 문맥 줄로 쓴다.' },
};

// Gradle이 만드는 실행 스크립트는 내용을 싣지 않는다.
const GENERATED_FILES = new Set(['gradlew', 'gradlew.bat']);

const PHASE = {
  build: '1단계 · 빈 프로젝트로 서버 만들기',
  maintain: '2단계 · 어수선한 서버 넘겨받기',
  wrap: '중간 점검 · 설명 세션',
  extend: '3단계 · 설계·운영·업무 적용',
};
// 티켓 페이지의 "## 원인과 정답" 제목 앵커(사이트 빌드와 같은 slugify)
const ANSWER_ANCHOR = '원인과-정답';
// 채점 프롬프트 앞 안내. 템플릿은 _common.json의 hints 안에 있는 graderTemplate(1단계)·graderTemplates.<단계>(2단계·마무리)
const GRADER_INTRO = {
  build: '오늘 순서를 다 만들었으면 서버를 띄운 채로 아래 프롬프트를 복사해 Codex 또는 Claude Code에 붙여 넣는다. 에이전트가 완료 조건·함정·말하기 카드로 채점표를 준다. 코드는 고치지 않는다.',
  maintain: '오늘 티켓을 다 처리했으면 `messy-server`를 띄운 채로 아래 프롬프트를 복사해 `messy-server` 폴더에서 연 Codex 또는 Claude Code에 붙여 넣는다. 에이전트가 완료 조건·함정·티켓 3점 세트(원인 서술·재현 테스트·수정)·말하기 카드로 채점표를 준다. 코드는 고치지 않는다.',
  extend: '내 프로젝트 또는 messy-server 사본에서 오늘의 증거 파일을 준비하고 아래 프롬프트로 채점받는다. 체크는 자가 기록이며 SQL·카드·회의·독립 수행은 별도로 판정한다.',
  wrap: '설명 세션을 시작할 때 아래 프롬프트를 복사해 javaExperience 저장소 루트에서 연 Codex 또는 Claude Code에 붙여 넣는다. 에이전트가 말하기 카드 전체에서 10문항을 골라 묻고, 회고 문서와 함께 채점표를 준다. 파일은 고치지 않는다.',
};
const graderTemplate = (hints, phase) => {
  const t = phase === 'build' ? hints.graderTemplate : hints.graderTemplates?.[phase];
  if (!t) throw new Error(`_common.json: ${phase} 단계 채점 프롬프트 템플릿이 없다`);
  return t;
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

// API 순서의 층 판정은 이곳에서만 한다. 테스트 파일은 검증 대상의 이름으로 층을 중복 계산하지 않는다.
export function stepLayers(step) {
  const layers = new Set();
  if (/직접 설계/.test(step.title)) layers.add('DB');
  for (const file of step.files) {
    const name = path.posix.basename(file);
    if (/(?:^|\/)src\/test\//.test(file) || /Tests?\.[^.]+$/.test(name)) { layers.add('테스트'); continue; }
    if (name === 'schema.sql') layers.add('DB');
    if (/Repository|Mapper/.test(name) || (/\.xml$/.test(name) && !/^logback/.test(name))) layers.add('쿼리');
    if (/Service/.test(name)) layers.add('서비스');
    if (/Controller|(?:Request|Response)\.java$/.test(name)) layers.add('컨트롤러');
  }
  return ['DB', '쿼리', '서비스', '컨트롤러', '테스트'].filter(layer => layers.has(layer));
}

export function apiGuide(guide) {
  return ['### API 하나 만드는 순서', '', ...guide.steps.map((line, i) => `${circled(i + 1)} ${line}<br>`), '', `**끝났는지 아는 법** ${guide.done}`].join('\n');
}

// ---------------------------------------------------------------- git
// 출력에 영향을 주는 사용자 git 설정을 모두 명령줄에서 고정한다(-c는 전역·저장소·GIT_CONFIG_* 설정보다 우선한다).
// diff 알고리즘·문맥 줄 수는 commitFiles의 show 옵션으로 고정한다.
const GIT_FLAGS = [
  'color.ui=never', 'color.diff=never', 'diff.noprefix=false', 'diff.mnemonicPrefix=false', 'diff.relative=false',
  'diff.renames=false', 'diff.suppressBlankEmpty=false', 'core.quotepath=off', 'log.showSignature=false',
  'i18n.logOutputEncoding=UTF-8', `core.attributesFile=${os.devNull}`,
  // 보완 순 변경 계산(git apply)이 사용자 설정으로 내용을 고치지 않게 한다
  'apply.whitespace=nowarn', 'core.autocrlf=false',
].flatMap((kv) => ['-c', kv]);
function git(root, args, env = process.env) {
  return execFileSync('git', [...GIT_FLAGS, ...args], { cwd: root, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
}

// 저장소 안인지 확인한다. 저장소가 아니면 false, 그 밖의 실패(git 실행 파일 없음·권한·설정 오류·소유자 확인 등)는 던진다.
// 오류 문구로 구분하므로 메시지 번역을 끈다.
function insideRepo(root) {
  try {
    git(root, ['rev-parse', '--is-inside-work-tree'], { ...process.env, LC_ALL: 'C', LANGUAGE: 'C' });
    return true;
  } catch (e) {
    if (e.status === 128 && /not a git repository/i.test(String(e.stderr ?? ''))) return false;
    throw e;
  }
}

// 정답 커밋 목록: [{ sha, subject, kind, day, m }] (오래된 것부터)
// kind: 'answer' = 순서 커밋 answer(Dnn-m), 'fix' = 리뷰 반영 커밋 answer-fix(Dnn-m). 순서 수는 answer만 센다.
// git 저장소가 아니면(압축본 등) 빈 목록. 그 밖의 git 오류는 숨기지 않고 던진다.
// --grep은 사용자의 grep.patternType 설정에 따라 괄호 해석이 달라지므로 쓰지 않고 JS 정규식으로 거른다.
export function listAnswerCommits(root = ROOT) {
  if (!insideRepo(root)) return [];
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
  return serverFiles(root, ['show', '--format=', sha], sha);
}

// diffCmd(['show', '--format=', sha] 또는 ['diff', from, to])가 만드는 board-server 변경. 새 파일 내용은 toRev에서 읽는다.
function serverFiles(root, diffCmd, toRev) {
  const statusOut = git(root, [...diffCmd, '--no-renames', '--name-status', '--', SERVER_DIR]);
  const numOut = git(root, [...diffCmd, '--no-renames', '--numstat', '--', SERVER_DIR]);
  const binary = new Set(numOut.split('\n').filter(Boolean).map((l) => l.split('\t')).filter((c) => c[0] === '-').map((c) => c[2]));
  const files = [];
  for (const line of statusOut.split('\n').filter(Boolean)) {
    const [status, full] = line.split('\t');
    const rel = full.slice(SERVER_DIR.length);
    const f = { path: rel, status: status[0], binary: binary.has(full), generated: GENERATED_FILES.has(rel) };
    if (!f.binary && !f.generated) {
      if (f.status === 'A') f.content = git(root, ['show', `${toRev}:${full}`]);
      else if (f.status === 'M') {
        const raw = git(root, [...diffCmd, '--no-renames', '--no-ext-diff', '--no-textconv', '--no-color', '--diff-algorithm=myers', '--indent-heuristic', '--inter-hunk-context=0', '-U3', '--', full]);
        f.diff = raw.slice(raw.indexOf('\n@@') + 1);
        // 변경 diff는 보존하고 같은 시점의 Spring 설정 전체도 비교할 수 있게 한다.
        if (/application(?:-[\w-]+)?\.ya?ml$/.test(rel)) f.configContent = git(root, ['show', `${toRev}:${full}`]);
      }
    }
    files.push(f);
  }
  return files;
}

// 한 순서의 answer-fix 커밋들(시간순)을 합친 순 변경: commitFiles와 같은 모양의 목록.
// 첫 answer-fix의 부모 트리를 임시 index에 읽고, 이 순서 fix 커밋들의 board-server 패치만 차례로 git apply --cached 한 뒤
// 시작 트리와 결과 트리를 비교한다. 그 사이 다른 순서 커밋이 같은 파일을 바꿨어도 그 변경은 섞이지 않는다.
// 패치가 맞지 않으면(다른 커밋과 겹침) 어림 적용하지 않고 던진다. 되돌려서 원상복구된 파일은 목록에서 빠진다.
// 작업 트리·저장소 index는 건드리지 않는다(임시 index만 쓴다).
export function netFixFiles(fixes, root = ROOT) {
  if (!fixes.length) return [];
  const id = stepId(fixes[0].day, fixes[0].m);
  const base = git(root, ['rev-parse', '--verify', `${fixes[0].sha}^`]).trim();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'build-days-fix-'));
  try {
    const env = { ...process.env, GIT_INDEX_FILE: path.join(tmp, 'index') };
    git(root, ['read-tree', base], env);
    for (const c of fixes) {
      const patch = git(root, ['show', '--format=', '--no-renames', '--no-ext-diff', '--no-textconv', '--no-color', '--binary', '--full-index', '--diff-algorithm=myers', '-U3', c.sha, '--', SERVER_DIR]);
      if (!patch.trim()) continue;
      const file = path.join(tmp, 'patch');
      fs.writeFileSync(file, patch);
      try {
        git(root, ['apply', '--cached', '--whitespace=nowarn', file], env);
      } catch (e) {
        throw new Error(`${id}: answer-fix ${c.sha.slice(0, 8)}(${c.subject})의 패치를 이 순서 보완만 적용한 코드에 맞출 수 없다. 다른 순서 커밋이 같은 줄을 바꿨는지 확인한다.\n${String(e.stderr ?? e.message).trim()}`);
      }
    }
    const tree = git(root, ['write-tree'], env).trim();
    return serverFiles(root, ['diff', base, tree], tree);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// 일자별 정답: Map(day → { steps: Map(no → [commit]), extras: Map(Dnn-m → [commit]), last: commit, lastFix: commit | null })
// 한 순서의 커밋 목록은 원래 answer 커밋(들) 다음에 같은 Dnn-m의 answer-fix 커밋이 시간순으로 붙는다.
// last는 그날 answer 커밋 중 가장 나중 커밋(snapshot 기준)이다. answer-fix는 다음 날 이후 커밋 뒤에 만들어질 수 있어
// 그 트리에는 뒤 날 코드가 섞이므로 snapshot으로 쓰지 않는다. lastFix는 그날 순서의 answer-fix 중 가장 나중 커밋이다.
export function collectAnswers(roadmap, root = ROOT, commits = listAnswerCommits(root)) {
  const byDay = new Map();
  for (const c of commits) {
    const day = roadmap.days.find((d) => d.id === c.day);
    if (!day) throw new Error(`roadmap에 없는 날의 정답 커밋: ${c.subject}`);
    if (!byDay.has(c.day)) byDay.set(c.day, { steps: new Map(), extras: new Map(), last: null, lastFix: null });
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
    if (c.kind === 'fix') entry.lastFix = c;
    else entry.last = c;
  }
  // answer-fix가 원래 answer 커밋보다 앞에 오지 않게 한다(원래 커밋 → 보완 순서)
  for (const entry of byDay.values()) {
    for (const list of [...entry.steps.values(), ...entry.extras.values()]) {
      if (list[0]?.kind === 'fix') throw new Error(`answer-fix 커밋이 원래 answer 커밋보다 먼저 있다: ${list[0].subject}`);
    }
  }
  return byDay;
}

// 보완을 싣는 자리(순서 번호): DEFERRED_FIXES가 있으면 after, 없으면 제 순서
export const fixPlace = (day, no, deferred = DEFERRED_FIXES) => deferred[stepId(day, no)]?.after ?? no;

// 순서마다 보완(answer-fix)이 싣는 자리 시점 코드에 붙는지 검사해 오류 목록을 돌려준다.
// 시점 코드 = 그 자리 순서의 마지막 answer 커밋 트리 + 같은 날 자리가 그 순서 이하인 보완들(시간순).
// 붙지 않으면 그 보완 diff의 문맥이 아직 없는 뒤 순서 코드라는 뜻이다. 작업 트리·저장소 index는 건드리지 않는다.
export function fixPlacementErrors(dayId, entry, root = ROOT, deferred = DEFERRED_FIXES) {
  const errs = [];
  const fixesOf = (no) => (entry.steps.get(no) ?? []).filter((c) => c.kind === 'fix');
  const withFixes = [...entry.steps.keys()].filter((no) => fixesOf(no).length);
  for (const [key, rule] of Object.entries(deferred)) {
    if (!key.startsWith(`${dayId}-`)) continue;
    const no = Number(key.split('-')[1]);
    if (!fixesOf(no).length) errs.push(`${key}: DEFERRED_FIXES에 있지만 보완 커밋이 없다`);
    if (!entry.steps.has(rule.after) || rule.after <= no) errs.push(`${key}: DEFERRED_FIXES.after(${rule.after})는 뒤 순서여야 한다`);
  }
  if (errs.length) return errs;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'build-days-place-'));
  try {
    const env = { ...process.env, GIT_INDEX_FILE: path.join(tmp, 'index') };
    const order = new Map(listAnswerCommits(root).map((c, i) => [c.sha, i]));
    for (const no of withFixes) {
      const place = fixPlace(dayId, no, deferred);
      const base = entry.steps.get(place).filter((c) => c.kind !== 'fix').at(-1);
      const fixes = withFixes.filter((n) => fixPlace(dayId, n, deferred) <= place).flatMap(fixesOf);
      fixes.sort((a, b) => order.get(a.sha) - order.get(b.sha));
      git(root, ['read-tree', base.sha], env);
      for (const c of fixes) {
        const patch = git(root, ['show', '--format=', '--no-renames', '--no-ext-diff', '--no-textconv', '--no-color', '--binary', '--full-index', '--diff-algorithm=myers', '-U3', c.sha, '--', SERVER_DIR]);
        if (!patch.trim()) continue;
        const file = path.join(tmp, 'patch');
        fs.writeFileSync(file, patch);
        try {
          git(root, ['apply', '--cached', '--whitespace=nowarn', file], env);
        } catch {
          const own = c.m === no;
          errs.push(own
            ? `${stepId(dayId, no)}: answer-fix ${c.sha.slice(0, 8)}(${c.subject})가 ${place === no ? '이 순서' : `${circled(place)}`}까지의 코드에 붙지 않는다(뒤 순서 코드에 기댄다). DEFERRED_FIXES에 적용 시점(after)을 적는다`
            : `${stepId(dayId, no)}: 앞서 적용할 보완 ${c.sha.slice(0, 8)}(${c.subject})가 ${circled(place)} 시점 코드에 붙지 않는다`);
          break;
        }
      }
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  return errs;
}

// ---------------------------------------------------------------- 재료 읽기
// 머리 주석부터 다음 머리 직전까지를 자른다. 줄바꿈·공백을 정규화하지 않는다.
export function parseDaySql(sql) {
  const heads = [...sql.matchAll(/^-- 이 블록을 쓰는 날: ([^\r\n]+)/gm)];
  const days = new Map();
  heads.forEach((head, i) => {
    const block = sql.slice(head.index, heads[i + 1]?.index ?? sql.length);
    for (const id of new Set(head[1].match(/\bD\d{2}\b/g) ?? [])) {
      if (!days.has(id)) days.set(id, []);
      days.get(id).push(block);
    }
  });
  return days;
}

// seed.sql의 SQL 문 단위 분리. 문자열·식별자·주석 안의 세미콜론은 경계가 아니다.
function sqlStatements(sql) {
  const statements = [];
  let start = 0, quote = '', comment = '';
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i], next = sql[i + 1];
    if (comment === 'line') { if (c === '\n') comment = ''; continue; }
    if (comment === 'block') { if (c === '*' && next === '/') { comment = ''; i++; } continue; }
    if (quote) {
      if (c === '\\') { i++; continue; }
      if (c === quote) { if (next === quote) i++; else quote = ''; }
      continue;
    }
    if ((c === '-' && next === '-' && /\s/.test(sql[i + 2] ?? '')) || c === '#') { comment = 'line'; continue; }
    if (c === '/' && next === '*') { comment = 'block'; i++; continue; }
    if ("'\"`".includes(c)) { quote = c; continue; }
    if (c === ';') { statements.push(sql.slice(start, i + 1).trim()); start = i + 1; }
  }
  if (quote || comment === 'block' || sql.slice(start).replace(/--[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\//g, '').trim()) throw new Error('seed SQL 문이 끝나지 않았다');
  return statements;
}

export function splitSeedTables(sql) {
  const chunks = new Map();
  // 여러 날짜 블록이 연결돼도 각 블록의 SET 값과 트랜잭션을 유지한다.
  for (const block of sql.split(/(?=^-- 이 블록을 쓰는 날:)/m)) {
    const groups = new Map(), head = [], tail = [];
    let previous;
    for (const statement of sqlStatements(block)) {
      const body = statement.replace(/^(?:\s|--[^\n]*(?:\n|$)|#[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)+/, '');
      const insert = body.match(/^INSERT INTO\s+`?(\w+)`?\s/i);
      if (insert) {
        previous = insert[1];
        if (!groups.has(previous)) groups.set(previous, []);
        groups.get(previous).push(statement);
      } else if (/^(SET\b|START TRANSACTION\b)/i.test(body) && !previous) head.push(statement);
      else if (/^COMMIT\b/i.test(body)) tail.push(statement);
      // 원본 seed에서 카운터·잔액 UPDATE는 바로 앞 INSERT의 파생 값 보정이다.
      else if (/^UPDATE\b/i.test(body) && previous) groups.get(previous).push(statement);
      else throw new Error(`테이블별 복사를 지원하지 않는 seed SQL: ${body.slice(0, 60)}`);
    }
    for (const [table, statements] of groups) {
      const fragment = [...head, ...statements, ...tail].join('\n') + '\n';
      chunks.set(table, (chunks.get(table) ?? '') + fragment);
    }
  }
  return [...chunks].map(([table, sql]) => ({ table, sql }));
}

// 데이터는 테이블을 준비한 순서에서 필요한 조각으로 왕복한다.
export const DATA_STEPS = {
  D02: {5:['banned_word','common_code']}, D03: {2:['member']},
  D04: {1:['post'],2:['tag','post_tag']}, D05: {3:['comment'],5:['post_like']},
  D07: {1:['point_ledger'],3:['coupon','member_coupon'],5:['shop_item'],6:['shop_order']},
  D06: {5:['bulk']}, D08: {2:['pg_payment'],3:['point_ledger']}, D10: {1:['report'],3:['audit_log']},
};
const dataStep = (day, table) => Object.entries(DATA_STEPS[day.id] ?? {}).find(([,tables]) => tables.includes(table))?.[0];

function dayDataSection(day, root) {
  const entries = ['seed', 'bulk'].flatMap((name) => {
    const blocks = parseDaySql(read(path.join(root, `course/start/dummy/${name}.sql`))).get(day.id);
    if (!blocks?.length) return [];
    return [
      `<div class="day-data-file" data-day-sql="${name}" data-sql-filename="${day.id}-${name}.sql">`,
      `<p><a href="../start/dummy/${name}.sql">원본 ${name}.sql</a> · ${name === 'bulk' ? '대량 재실험용 · seed D05까지 넣은 별도 DB에서 한 번 실행' : '기본 데이터 · 앞선 날 seed 블록을 순서대로 넣은 뒤 한 번 실행'}</p>`,
      '<details class="day-data-sql">', `<summary>${day.id} ${name} SQL 보기</summary>`,
      `<pre><code id="${day.id.toLowerCase()}-${name}-sql">${escapeHtml(blocks.join(''))}</code></pre>`,
      '</details>',
      ...(name === 'seed' ? [
        '<p>테이블별 복사에도 SET·트랜잭션과 필요한 카운터·잔액 보정을 포함합니다. 앞선 날 데이터와 참조할 테이블을 먼저 넣고, 아래 순서로 한 번씩 실행하세요. 전체 복사와 중복 실행하지 마세요. 실패하면 ROLLBACK 후 확인하세요.</p>',
        ...splitSeedTables(blocks.join('')).map(({ table, sql }) => [
          `<div class="day-data-table" id="data-${day.id.toLowerCase()}-${table}" data-sql-table="${table}">`,
          `<p>${table} 테이블을 준비한 뒤 넣으세요. <a data-work-return href="#${stepAnchor(day.id, dataStep(day, table))}">넣었으면 ${circled(Number(dataStep(day, table)))} 작업으로 복귀</a></p>`,
          '<details class="day-data-sql">', `<summary>${table} SQL 보기</summary>`,
          `<pre><code id="${day.id.toLowerCase()}-${name}-${table}-sql">${escapeHtml(sql)}</code></pre>`,
          '</details>', '</div>',
        ].join('\n')),
      ] : []),
      '</div>',
    ].join('\n');
  });
  if (!entries.length) return '';
  return [
    '<section class="day-data">', '', '## 이 날 데이터 넣기', '',
    '기본 DB에서 테이블을 먼저 준비하고 해당 테이블 조각을 넣은 뒤 작업으로 돌아오세요. 전체 블록은 이 날 필요한 테이블을 모두 만든 뒤 실행합니다. 컬럼 생략·복합 키·COUNT 설계는 [SQL 조정법](../start/dummy/README.md)을 따라 수정하세요.', '',
    `<p><a data-work-return href="#${stepAnchor(day.id, Number(Object.keys(DATA_STEPS[day.id] ?? {})[0] ?? 1))}">데이터 준비를 마치고 오늘 작업으로 복귀</a></p>`, '',
    ...(day.id === 'D04' ? ['**bulk는 지금 실행하지 않는다. D05 테이블·seed 준비를 마친 뒤 [D06 실험 진입점](D06.md#이-날-데이터-넣기)에서 별도 실험 DB로 재실험한다. 기본 DB는 그대로 둔다.**', ''] : []),
    ...(day.id === 'D06' ? ['**실험 진입점:** 별도 실험 DB에 D05까지의 테이블·seed가 준비됐는지 먼저 확인하고 bulk를 한 번 넣는다. <a href="#step-d06-5">⑤ EXPLAIN 실험으로 복귀</a>. 기본 seed DB와 구분하고 끝나면 원래 연결로 돌아간다.', ''] : []),
    '[넣는 순서와 확인 방법](../start/dummy/README.md)을 확인하세요. 기본 데이터는 앞선 날 → 오늘 순서로 넣고, 대량 데이터는 별도 실험 DB에서 실행하세요. 이미 넣은 블록은 다시 실행하지 마세요.', '',
    ...entries, '', '</section>',
  ].join('\n');
}

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
  const duration = (md.match(/소요\s*([^·\n]+)/)?.[1].trim() ?? '30~60분').replaceAll('~', '–');
  return { id, title, duration };
}

// 티켓 구분: 필수(B01~B04), 선택(pool이 있는 Security·Redis 후보 — 이 중 1건을 골라 꼭 채점), 고도화(E01), 연습(나머지)
export const ticketKind = (meta) => (meta.required ? '필수' : meta.enhancement ? '고도화' : meta.pool ? '선택' : '연습');
const ticketMeta = (root) => JSON.parse(read(path.join(root, 'course/map-tickets.json'))).tickets;

// 채점 프롬프트에 싣는 티켓 이름과 구분
function ticketInfo(id, root) {
  const title = read(path.join(root, 'course/tickets', `${id}.md`)).match(/^# (?:[BE]\d{2}\. )?(.+)$/m)[1].trim();
  const meta = ticketMeta(root).find((t) => t.id === id);
  if (!meta) throw new Error(`map-tickets.json에 티켓 ${id}가 없다`);
  return { id, title: stripMd(title), kind: ticketKind(meta) };
}

// 2단계 일자 페이지 머리에 싣는 티켓 규칙(설계 §5-3: 필수 4건 + Security·Redis에서 고른 선택 1건). 목록은 map-tickets.json에서 만든다.
export function ticketRule(root = ROOT) {
  const meta = ticketMeta(root);
  const ids = (f) => meta.filter(f).map((t) => t.id).join('·');
  return `**2단계 티켓 규칙** 필수는 ${ids((t) => t.required)} 4건이다. 선택 1건은 D11을 시작할 때 Security 후보(${ids((t) => t.pool === 'Security')})나 Redis 후보(${ids((t) => t.pool === 'Redis')})에서 골라 끝까지 처리한다. 고도화 E01과 D14 ⑥ 모의 장애 훈련은 모두 한다. 연습 티켓은 나머지 ${meta.filter((t) => ticketKind(t) === '연습').length}건(${ids((t) => ticketKind(t) === '연습')})이다. 연습 티켓과 고르지 않은 선택 후보는 했으면 채점 프롬프트에 알려 채점받고, 하지 않았으면 채점에서 빠진다. 필수·고른 선택·E01·훈련을 하지 않으면 그 항목은 실패다.`;
}

// 저장소 기준 경로 문서의 제목. 없으면 멈춘다(Dnn.json의 hints.refs·guides).
function docTitle(p, root, dayId) {
  const abs = path.join(root, p);
  if (!fs.existsSync(abs)) throw new Error(`course/days/${dayId}.json: 참고 자료가 없다 → ${p}`);
  return stripMd(read(abs).match(/^# (.+)$/m)?.[1].trim() ?? path.basename(p));
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
  const yamlTestNote = /ApplicationYmlTest|ProfileConfigTest|LocalProfileSeedTest/.test(f.path) ? '\n\n이 예시는 YAML 원본을 읽는 검사다. properties를 선택했다면 같은 키·값과 프로파일 적용을 Spring Environment 또는 Properties 로딩으로 검증한다. YAML 파일 구조 자체를 제출 조건으로 요구하지 않는다.' : '';
  if (f.status === 'A') return `${head}\n\n${fence(f.content, langOf(f.path))}${yamlTestNote}`;
  const fullConfig = f.configContent === undefined ? '' : `\n\n**이 변경을 반영한 전체 설정** \`${f.path}\`\n\n${fence(f.configContent, 'yaml')}`;
  return `${head} (바뀐 부분)\n\n${fence(f.diff, 'diff')}${fullConfig}${yamlTestNote}`;
}

function renderCommitAnswer(commit, files, stepFiles) {
  const sorted = [...files].sort(fileOrder(stepFiles));
  const lines = [`커밋 [\`${commit.sha.slice(0, 8)}\`](${REPO_URL}/commit/${commit.sha}) — ${commit.subject}`];
  if (commit.rule?.note) lines.push('', commit.rule.note);
  for (const f of sorted) lines.push('', renderFile(f));
  return lines.join('\n');
}

// 보완: 커밋 목록은 이력으로만 남기고, 코드는 그 커밋들을 합친 순 변경(files)만 싣는다
function renderFixAnswer(fixes, files, stepFiles) {
  const sorted = [...files].sort(fileOrder(stepFiles));
  const many = fixes.length > 1;
  const lines = [
    `**보완** — 리뷰를 반영해 이 순서의 코드를 고친 ${many ? `커밋 ${fixes.length}개다.` : '커밋이다.'}${many && files.length ? ' 아래 코드는 이 커밋들을 차례로 적용한 최종 변경만 싣는다.' : ''}`,
    '',
    '**보완 이력**',
    '',
    ...fixes.map((c) => `- [\`${c.sha.slice(0, 8)}\`](${REPO_URL}/commit/${c.sha}) ${c.subject}`),
  ];
  for (const f of sorted) lines.push('', renderFile(f));
  return lines.join('\n');
}

// deferred: 이 순서 보완을 뒤 순서 칸 뒤에 따로 싣는 경우 { after, note }. 이 블록에는 원래 커밋만 싣고 그 칸을 가리킨다.
function answerBlock(dataStep, commits, stepFiles, filesOf, lastTouch, fixFilesOf, deferred) {
  const originals = commits.filter((c) => c.kind !== 'fix');
  const fixes = deferred ? [] : commits.filter((c) => c.kind === 'fix');
  const fixFiles = fixes.length ? fixFilesOf(fixes) : [];
  const all = [...originals.flatMap((c) => filesOf(c.sha)), ...fixFiles];
  const names = originals.map((c) => `answer(${stepId(c.day, c.m)})`).join(' + ') + (fixes.length ? ` + 보완 ${fixes.length}개` : '');
  // 보완을 뒤로 미룬 순서도 "만들 파일" 대조는 원래 커밋과 그 보완을 함께 본다
  const touched = new Set([...all, ...(deferred ? fixFilesOf(commits.filter((c) => c.kind === 'fix')) : [])].map((f) => f.path));
  const untouched = stepFiles.filter((f) => !touched.has(f)).map((f) => {
    const prev = lastTouch?.(commits[0].sha, f);
    return `- \`${f}\` — 이 순서에서는 바뀌지 않는다. ${prev ? `앞선 ${prev}에서 만든 코드를 그대로 쓴다.` : '앞선 순서에서 만든 코드를 그대로 쓴다.'}`;
  });
  const shown = [...originals, ...fixes];
  return [
    `<details class="step-answer" data-step="${dataStep}" data-commits="${shown.map((c) => c.sha).join(' ')}">`,
    `<summary>구현 예시 보기 · ${names} · board-server 파일 ${all.length}개</summary>`,
    '',
    [...originals.map((c) => renderCommitAnswer(c, filesOf(c.sha), stepFiles)), ...(fixes.length ? [renderFixAnswer(fixes, fixFiles, stepFiles)] : [])].join('\n\n---\n\n'),
    ...(deferred ? ['', `**보완** — 이 순서의 보완은 뒤 순서 코드에 맞춘 diff라 <a href="#${fixAnchor(dataStep)}">${circled(deferred.after)} 뒤 보완 칸</a>에 따로 싣는다.`] : []),
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

// 필수 힌트와 별도인 관찰 절차. required 관찰은 완료 조건과 채점에도 포함한다.
function observationBlock(dataStep, observations) {
  const required = observations.some((o) => o.required);
  return [
    `<details class="step-observations" data-step="${dataStep}">`,
    `<summary>${required ? '꼭 할 관찰 · 증거를 완료 조건과 함께 제출하세요' : '선택 관찰 실험 · 필요한 실험을 골라 하세요'}</summary>`,
    '',
    ...observations.map((observation) => `- ${observation.text}`),
    '',
    '</details>',
  ].join('\n');
}

// 카드 근거 중 학습자가 열 수 있는 명세 절(spec-v2 §…)만 페이지에 싣는다. 숫자 번호(예: 06 §15)는 저장소 밖 작성 자료다.
export const publicBasis = (basis) => basis.split(/,\s*/).filter((b) => b.startsWith('spec-v2')).join(', ');

function cardBlock(card) {
  const basis = publicBasis(card.basis);
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
    basis ? `**근거** ${basis}` : '',
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

export function graderPrompt(day, cards, hintsDay, template, root = ROOT) {
  const criteria = [];
  // 2단계: C 항목마다 담당 티켓(고르지 않은 선택 티켓이면 채점에서 뺀다)과 "기록으로 확인"(수정 전 증거) 표시를 붙인다
  const g = hintsDay.grader ?? {};
  const allIds = day.steps.flatMap((s) => s.done.map((_, i) => `C${s.no}-${i + 1}`));
  for (const id of [...(g.fromRecords ?? []), ...Object.keys(g.itemTickets ?? {})]) if (!allIds.includes(id)) throw new Error(`course/days/${day.id}.json: 채점 표시가 없는 항목을 가리킨다 → ${id}`);
  const tagOf = (s, id) => {
    if (day.phase !== 'maintain') return '';
    const ticket = completionTicket(day, s, id, hintsDay);
    // 구분(필수·선택·고도화)을 붙여야 채점 에이전트가 선택 티켓 항목만 제외한다
    const tags = [ticket && `${ticket} ${ticketInfo(ticket, root).kind}`, (g.fromRecords ?? []).includes(id) ? '기록으로 확인' : ''].filter(Boolean);
    return tags.length ? `(${tags.join(' · ')}) ` : '';
  };
  for (const s of day.steps) {
    criteria.push(`${circled(s.no)} ${stripMd(s.title)}`);
    s.done.forEach((d, i) => criteria.push(`  - [C${s.no}-${i + 1}] ${tagOf(s, `C${s.no}-${i + 1}`)}${stripMd(d)}`));
    // 마무리(wrap)는 코드를 보지 않는 날이라 설명·회고에서 확인한다
    if (s.trap) criteria.push(`  - [R${s.no}] 함정을 피했는지 ${day.phase === 'wrap' ? '설명·회고에서' : day.phase === 'extend' ? '실행 증거·설계·회고에서' : '코드로'} 확인: ${stripMd(s.trap)}`);
  }
  const cardLines = [];
  for (const id of day.talkCards) {
    const c = cards.get(id);
    cardLines.push(`- [${id}] ${stripMd(c.question)}`);
    c.answers.forEach((a) => cardLines.push(`    · ${stripMd(a)}`));
  }
  const session = [
    ...(g.meeting ? [`회의 역할: ${g.meeting.kind}. 먼저 학습자의 제안을 듣고 다음 반론을 제시한다: ${g.meeting.objection}`, ...g.meeting.criteria.map((c,i) => `[M${i+1}] ${c}`)] : []),
    ...(g.explanation ? [`설명 세션: ${g.explanation.range} 실제 수행 사례에서 무작위 ${g.explanation.count}문항, 같은 날 최대 ${g.explanation.maxPerDay}개. ${g.explanation.requiredAreas.join('·')} 영역을 모두 포함하고 답변 전 기준을 공개하지 않는다.`] : []),
    ...(g.independent ? ['독립 수행 평가: 해법·힌트를 먼저 제공하지 않는다. 도움 횟수와 범위·시간·미실행을 기록하고 역량별 판정한다.'] : []),
  ].join('\n') || '오늘은 별도 회의 역할극 없이 완료 조건·SQL·카드를 검증한다.';
  const focus = (hintsDay.grader?.focus ?? []).map((f) => `- ${f}`).join('\n') || '- (없음)';
  const ticketIds = [...new Set(day.steps.flatMap((s) => s.tickets ?? []))];
  const tickets = ticketIds.map((id) => {
    const t = ticketInfo(id, root);
    const at = day.steps.filter((s) => s.tickets?.includes(id)).map((s) => circled(s.no)).join('');
    return `- [T-${id}] ${id}. ${t.title} (${t.kind} · ${at}) — 티켓 페이지 ../course/tickets/${id}.md · 대조 자료 tickets/${id}/answer/`;
  });
  return template
    .replaceAll('{{SQL}}', [hintsDay.sql?.context, ...(hintsDay.sql?.questions ?? []).map((q,i) => `[SQL${i+1}] ${q.task} / 확인할 성질: ${q.expect}`)].filter(Boolean).join('\n'))
    .replaceAll('{{SESSION}}', session)
    .replaceAll('{{DAY}}', day.id)
    .replaceAll('{{TITLE}}', day.title)
    .replaceAll('{{CRITERIA}}', criteria.join('\n'))
    .replaceAll('{{CARDS}}', cardLines.join('\n'))
    // 2단계 카드의 "답에 들어가야 할 것"은 티켓 원인이라, 화면에 보이는 프롬프트에는 질문만 싣고 답은 에이전트가 원문에서 읽게 한다
    .replaceAll('{{CARD_QUESTIONS}}', day.talkCards.map((id) => `- [${id}] ${stripMd(cards.get(id).question)}`).join('\n'))
    .replaceAll('{{TICKETS}}', tickets.join('\n') || '- (없음)')
    .replaceAll('{{OPTIONAL}}', ticketIds.filter((id) => ['선택', '연습'].includes(ticketInfo(id, root).kind)).join('·') || '없음')
    .replaceAll('{{FOCUS}}', focus);
}

// ---------------------------------------------------------------- 페이지
function dayHeader(day, java, extra = '') {
  return [
    HEADER,
    '',
    `# ${day.id}. ${day.title}`,
    '',
    `> ${PHASE[day.phase]} · 오늘의 Java [${java.id}](../java/${java.id}.md) · 전체 구현 순서 ${day.steps.length}개 · 말하기 카드 ${day.talkCards.length}장${extra}`,
  ].join('\n');
}

function javaSection(java, roadmapJava) {
  return [
    '## 오늘의 Java',
    '',
    `[${java.title}](../java/${java.id}.md) — ${java.duration}. ${roadmapJava?.timing === 'during-or-after' ? '오늘의 요구 제시·초기 진단 뒤 수행 중 증거 또는 사후 확인으로 연결한다.' : 'Spring 순서를 시작하기 전에 오늘 쓰는 Java를 먼저 연습한다.'}`,
    ...(roadmapJava?.topic ? ['', `- 주제: ${roadmapJava.topic}`] : []),
  ].join('\n');
}

// 본문과 채점이 같은 담당 표를 사용한다. 빈 담당은 모두 하는 공통 항목이다.
function completionTicket(day, step, id, hintsDay) {
  const assignments = hintsDay.grader?.itemTickets ?? {};
  const ticket = id in assignments ? assignments[id] : (step.tickets?.length === 1 ? step.tickets[0] : '');
  if (ticket && !step.tickets.includes(ticket)) throw new Error(`course/days/${day.id}.json: ${id}의 티켓 ${ticket}이 그 순서 티켓이 아니다`);
  return ticket;
}

function stepSection(day, s, ctx) {
  const id = stepId(day.id, s.no);
  const lines = [`<section class="day-step" id="${stepAnchor(day.id, s.no)}" data-step="${id}">`, '', `## ${circled(s.no)} ${s.title}`, ''];
  if (day.phase === 'build' && s.specRefs.length) {
    const layers = stepLayers(s);
    lines.push(`**이 순서에서 만들 층** ${layers.join(' · ') || '해당 없음 · 공통 설정·지원 코드'}`, '');
  }
  if (ctx.ready && s.files.length) {
    lines.push(`**만들 파일** (${day.phase === 'maintain' ? 'messy-server' : '내 프로젝트 · 경로는 구현 예시'} 기준)`, '');
    for (const [action, label] of Object.entries({create:'새로 만들기',modify:'기존 수정',inspect:'확인만'})) {
      const files = s.fileActions?.[action] ?? (action === 'create' ? s.files : []);
      if (files.length) lines.push(`- **${label}**: ${files.map(f => `\`${f}\``).join(' · ')}`);
    }
    lines.push('');
  }
  if (s.tickets?.length) lines.push(`**티켓** ${s.tickets.map((t) => `\`${t}\``).join(' · ')}`, '');
  if (ctx.ready) {
    if (s.trap) lines.push(`**겪을 것** ${s.trap}`, '');
    if (day.phase === 'extend' && ctx.hintsDay.dataSetup?.length && s.no === 1) lines.push('<a data-data-return href="#이-날-데이터-넣기">오늘 실험 데이터 준비 → 작업 복귀</a>', '');
    if (day.phase === 'extend') {
      const refs = (s.dayRefs ?? []).map(r => `[${r.day} ${r.label}](${r.day}.md#${stepAnchor(r.day,r.step)})`);
      lines.push('**명세** ' + [...refs, '[기존 API 계약](../spec-v2.md)'].join(' · ') + ' · 오늘의 완료 조건으로 내 합의 명세에 요구·오류·불변식을 먼저 적는다.', '');
    }
    const tables = DATA_STEPS[day.id]?.[s.no];
    if (tables?.length && day.id !== 'D06') lines.push(`<p class="data-handoff">테이블 준비 후 기본 DB에 필요한 데이터: ${tables.map(table => `<a data-data-return href="#data-${day.id.toLowerCase()}-${table}">${table} 넣기 → 작업 복귀</a>`).join(' · ')}</p>`, '');
    if (day.id === 'D06' && s.no === 5) lines.push('<p><a data-data-return href="#이-날-데이터-넣기">D05 준비 이후 별도 실험 DB · bulk 넣기</a></p>', '');
    lines.push('**완료 조건**', '', ...s.done.map((d, i) => {
      const ticket = completionTicket(day, s, `C${s.no}-${i + 1}`, ctx.hintsDay);
      const label = day.phase === 'maintain' ? `[${ticket ? `${ticket} ${ticketInfo(ticket, ctx.root).kind}` : '공통'}] ` : '';
      return `- ${label}${d}`;
    }), '');
    if (s.dataRefs?.length) lines.push('**데이터 요구사항** ' + s.dataRefs.map(ref => {
      const section = ctx.specSections.find(x => x.title.startsWith(ref + '.'));
      if (!section) throw new Error(`${day.id}: 데이터 요구사항 ${ref} 없음`);
      return `[§${ref}](../spec-v2.md#${section.id})`;
    }).join(' · '), '');
    if (s.specRefs.length) {
      const refs = s.specRefs.map((r) => {
        const l = specLinks(r, ctx.specSections);
        const more = l.extra.map((e) => `[${e.title}](../spec-v2.md#${e.id})`);
        return `[\`${r}\`](../spec-v2.md#${l.endpoint.id})${more.length ? ` (${more.join(', ')})` : ''}`;
      });
      lines.push(`**명세** ${refs.join(' · ')}`, '');
    }
    if (day.phase === 'maintain' && s.tickets?.length) {
      // 2단계: 티켓 정답은 티켓 페이지에만 둔다(마크다운 링크라 빌드 링크 검사가 티켓 페이지·절 누락을 잡는다).
      // 힌트 접기보다 앞에 둬야 사이트 빌드가 사실 칸(원인과 정답)으로 묶는다.
      const guides = (s.guides ?? []).map((p) => `[${docTitle(p, ctx.root, day.id)}](${path.posix.relative('course/spring', p)})`);
      lines.push(`**원인과 정답** ${s.tickets.map((t) => `[${t} 티켓 페이지](../tickets/${t}.md#${ANSWER_ANCHOR})`).join(' · ')}의 "원인과 정답" 접기에 있다.${guides.length ? ` 진행 순서와 양식은 ${guides.join(' · ')}에 있다.` : ''}`, '');
    }
    const hints = ctx.hintsDay.steps?.[String(s.no)];
    if (!hints?.length) throw new Error(`course/days/${id.split('-')[0]}.json: 힌트가 없다`);
    lines.push(hintBlock(id, hints), '');
    const observations = ctx.hintsDay.observations?.[String(s.no)];
    if (observations?.length) lines.push(observationBlock(id, observations), '');
    if (day.phase === 'build') {
      // 1단계: 그 순서 커밋의 정답을 인라인으로 싣는다
      const commits = ctx.answers?.steps.get(s.no);
      if (!commits?.length) throw new Error(`${id}: 정답 커밋 answer(${id})이 없다`);
      lines.push(answerBlock(id, commits, s.files, ctx.filesOf, ctx.lastTouch, ctx.fixFilesOf, (ctx.deferred ?? DEFERRED_FIXES)[id]), '');
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
    answerBlock(id, commits, [], ctx.filesOf, undefined, ctx.fixFilesOf),
    '',
    '</section>',
  ].join('\n');
}

// 순서 칸·보완 칸의 id는 raw HTML이라 사이트 빌드의 마크다운 앵커 검사(제목 앵커만 안다)를 통과하지 못한다. 이 id로는 <a href>만 쓴다.
const fixAnchor = (id) => `fix-${id.toLowerCase()}`;

// 뒤로 미룬 보완: 그 순서(Dnn-m)의 보완만 담은 정답 블록을 after 순서 칸 뒤에 둔다
function deferredFixSection(day, no, rule, ctx) {
  const id = stepId(day.id, no);
  const step = day.steps.find((s) => s.no === no);
  const fixes = ctx.answers.steps.get(no).filter((c) => c.kind === 'fix');
  const files = ctx.fixFilesOf(fixes);
  return [
    `<section class="day-step-extra" id="${fixAnchor(id)}" data-commit="${id}">`,
    '',
    `## 보완: ${circled(no)} ${step.title}`,
    '',
    `${circled(rule.after)}까지(그 순서의 보완 포함) 만들었으면 <a href="#${stepAnchor(day.id, no)}">${circled(no)}</a>의 보완을 적용한다. ${rule.note}`,
    '',
    `<details class="step-answer" data-step="${id}" data-commits="${fixes.map((c) => c.sha).join(' ')}">`,
    `<summary>구현 예시 보기 · answer(${id}) 보완 ${fixes.length}개 · board-server 파일 ${files.length}개</summary>`,
    '',
    renderFixAnswer(fixes, files, step.files),
    '',
    '</details>',
    '',
    '</section>',
  ].join('\n');
}

// SQL 과제·기대 성질은 기본 노출하고 예시 답만 접는다.
function sqlSection(day, sql, root) {
  if (!sql?.questions?.length) throw new Error(`${day.id}: 오늘의 SQL이 없다`);
  const count = sql.questions.length;
  if (count < (day.id === 'D15' ? 1 : 2) || count > (day.id === 'D15' ? 2 : 4)) throw new Error(`${day.id}: SQL 문항 수 오류`);
  const questions = sql.questions.map((q) => {
    if (!q.task || !q.expect || !q.example) throw new Error(`${day.id}: SQL 과제·기대 성질·예시 필요`);
    return `<li><p>${inlineHtml(q.task)}</p><p><strong>확인할 성질</strong> ${inlineHtml(q.expect)}</p></li>`;
  });
  return [
    '<section class="day-sql">', '', '## 오늘의 SQL', '', sql.context, '',
    ...(day.phase === 'build' ? ['[더미 SQL·붙여 넣는 순서](../start/dummy/README.md)를 먼저 확인한다.', ''] : []),
    '<ol class="sql-questions">', ...questions, '</ol>', '',
    '<details class="sql-answer">', '<summary>구현 예시 SQL · 직접 작성한 뒤 비교하기</summary>', '',
    (day.phase === 'extend' ? '아래는 비교용 SQL이다. 예약·대상·작업 모델은 내가 정한 물리 이름과 필터로 옮긴다. ' : '') + 'board-server의 설계 기준이다. 2단계에서는 같은 계열의 기존 스키마를 관찰한다. 내 물리 이름·키·정렬이 다르면 매핑해 비교한다. 아래 SQL은 실제 실행 결과가 아니며 예시 서버가 모든 불변식을 보장한다는 뜻도 아니다. 오류가 예상되는 문장은 하나씩 실행하고 실패 뒤 ROLLBACK을 별도로 보낸다.', '',
    ...sql.questions.flatMap((q,i) => [`**문항 ${i+1} 구현 예시**`, '', fence(q.example,'sql'), '']),
    '</details>', '',
    ...((sql.refs ?? []).length ? ['**선택 자료** — 이전 과정은 별도 스키마(community·practice·성능 실험 DB)를 전제한다. 이름·필터를 내 설계로 옮겨 풀고 기존 DB를 덮어쓰지 않는다.', '', ...(sql.refs ?? []).map(p => `- [${docTitle(p,root,day.id)}](../../${p})`)] : []),
    '', '</section>',
  ].join('\n');
}

export function renderDay(day, ctx) {
  const roadmapJava = ctx.roadmap.java.find((j) => j.id === day.java);
  const java = day.phase === 'extend' ? {id: day.java, title: `${day.java}. ${roadmapJava.title}`, duration: '20~40분 · 이미 증거가 있으면 확인 후 다음 순서'} : javaInfo(day.java, ctx.root);
  const data = ctx.hintsDay.dataSetup?.length ? ['<section class="day-data">', '', '## 이 날 데이터 넣기', '', ...ctx.hintsDay.dataSetup.map(x => `- ${x}`), '', `<a data-work-return href="#${stepAnchor(day.id,1)}">① 작업으로 복귀</a>`, '', '</section>'].join('\n') : dayDataSection(day, ctx.root);
  const sections = [['Java','오늘의-java'], ['구현 순서','오늘-순서'], ...(data ? [['이 날 데이터 넣기','이-날-데이터-넣기']] : []), ['오늘의 SQL','오늘의-sql'], ['말하기','말하기-카드'], ['채점','ai-채점-프롬프트']];
  const parts = [dayHeader(day, java, ctx.ready ? '' : ' · **준비 중**')];
  if (day.purpose) parts.push(day.purpose);
  parts.push(`<nav class="day-sections" aria-label="오늘 섹션 바로가기">${sections.map(([label,id]) => `<a href="#${id}">${label}</a>`).join('')}</nav>`);
  if (!ctx.ready) parts.push('> 이 날은 아직 준비 중이다. 순서 제목과 말하기 카드만 먼저 싣고, 티켓 페이지·힌트·채점 프롬프트는 2단계 자료가 끝난 뒤 채운다.');
  if (day.phase === 'maintain') {
    parts.push(ticketRule(ctx.root));
    if (day.note) parts.push(`**오늘** ${day.note}`);
  }
  if (day.phase === 'extend') {
    parts.push('## 작업 위치와 개인 경로', `**작업 대상** ${day.workTarget}`, `**먼저 확인** ${day.prerequisite}`, day.note);
    if (ctx.hintsDay.pathTickets?.length) parts.push('**개인 과제 자료** ' + ctx.hintsDay.pathTickets.map(id => `[${id} 증상·재현·제출물](../tickets/${id}.md)`).join(' · '));
    if (ctx.hintsDay.grader?.meeting) parts.push(`**회의 역할극** ${ctx.hintsDay.grader.meeting.kind} · 최초 제안 → 반론 → 수정 발언 → 합의/보류. 다섯 기준 각 0–2점, 각 1점 이상·합계 8/10 이상. 사실/가정·대안 비용·결정 요청·검증/배포/실패 대응·반론 후 수정.`);
  }
  if (day.id === 'D01') parts.push([
    '## 작업 위치와 출발 자료',
    '',
    '- **Java**: 이 저장소의 `java-track/`에 작성한다. 실행은 **저장소 루트**에서 `./gradlew :java-track:test --tests \'J01*\'`.',
    '- **Spring**: [출발 자료 안내](../start/README.md)의 설정값으로 **새로 만드는 내 프로젝트 루트**에서 작성·실행한다. ①은 `./gradlew bootRun`, ③ 이후에는 `./gradlew bootRun --args=\'--spring.profiles.active=local\'`.',
    '- [출발 자료에서 복사](../start/README.md): [compose.yaml](../start/compose.yaml) · [toxiproxy.json](../start/toxiproxy.json) → 내 프로젝트 루트.',
    '- [PG 승인 응답](../start/wiremock/mappings/pg-approve.json) · [PG 거절 응답](../start/wiremock/mappings/pg-approve-declined.json) → 내 프로젝트의 `src/test/resources/wiremock/mappings/`. 파일을 먼저 복사한 뒤 compose를 띄운다.',
  ].join('\n'));
  if (day.id === 'D04') parts.push(apiGuide(ctx.hints.apiGuide));
  if (day.id === 'D11') parts.push([
    '## 인수인계 시작',
    '',
    '1. **1단계 앱 종료**: 실행 중인 터미널에서 `Ctrl+C`(IDE라면 Stop). 1단계 프로젝트 루트에서 `docker compose down`으로 의존 서비스도 멈춘다. 데이터 삭제 옵션은 붙이지 않는다.',
    '2. **작업 대상 전환**: 저장소 루트에서 `cd messy-server`. 이제 코드·명령의 기준은 `messy-server/`다. 1단계 내 프로젝트와 구분한다.',
    '3. **서버의 compose·DB 기동**: 아래 명령을 `messy-server/`에서 실행한다. [compose.yaml](../../messy-server/compose.yaml)과 [local 설정](../../messy-server/src/main/resources/application-local.yml)의 MySQL은 `localhost:13311/board`다(1단계는 13310). Redis·PG도 이 compose를 쓴다.',
    '',
    fence('docker compose up -d --wait\ndocker compose ps\n./gradlew bootRun --args=\'--spring.profiles.active=local\'', 'bash'),
    '',
    '4. **최초 기동 확인**: 별도 터미널에서 `curl -i http://localhost:8080/actuator/health` → 200과 `UP`. 실패하면 기동 로그를 먼저 기록한다.',
    '5. **기준 테스트**: 별도 터미널의 `messy-server/`에서 `./gradlew test`를 실행한다(Docker 필요, 테스트는 별도 컨테이너 사용). 수정 전 성공·실패 개수와 실패 테스트·로그를 저장한다. 이 기록과 수정 후 결과를 비교한다.',
    '6. **이번 주 규칙 확인**: [2단계 티켓 규칙](../README.md#2단계-티켓-규칙)을 읽고 필수 B01~B04·선택 1건·[E01](../tickets/E01.md)·[훈련](../tickets/drill.md)을 구분한다.',
    '',
    '<div data-preparation>',
    '<p><strong>준비 기록</strong> — 환경 전환 확인용이며 구현 진도·채점 결과에 포함하지 않는다. 위 절차를 마칠 때마다 기록한다.</p>',
    ...['1단계 앱 종료','messy-server 폴더 전환','13311 DB·의존 서비스 기동','health 200·UP 확인','수정 전 기준 테스트 결과 저장','필수·선택·훈련 규칙 확인'].map((label,i) => `<label class="prep-item"><input type="checkbox" data-prep="D11-${i+1}"> ${label}</label>`),
    '</div>',
  ].join('\n'));
  parts.push('## 오늘 순서', checklist(day, day.steps), javaSection(java, roadmapJava), '---');
  const deferred = Object.entries(ctx.deferred ?? DEFERRED_FIXES).filter(([k]) => k.startsWith(`${day.id}-`));
  for (const s of day.steps) {
    parts.push(stepSection(day, s, ctx));
    if (!ctx.answers) continue;
    for (const [k, rule] of deferred) if (rule.after === s.no) parts.push(deferredFixSection(day, Number(k.split('-')[1]), rule, ctx));
  }
  for (const group of ctx.answers?.extras.values() ?? []) parts.push(extraSection(day, group, ctx));
  if (data) parts.push(data);
  if (ctx.ready) parts.push(sqlSection(day, ctx.hintsDay.sql, ctx.root));
  if (ctx.hintsDay?.diagnostics) {
    const diag = ctx.hintsDay.diagnostics;
    parts.push('## 진단 도구 예행 관찰', diag.intro, ...diag.tasks.map((text, i) => `${i+1}. ${text}`), '관찰 파일·설정 복원 기록과 도구별 해석 한 문장을 채점 때 제출한다.');
  }
  parts.push('---', '## 말하기 카드', '하루가 끝나면 질문에 "문제 상황 → 원인 → 선택 → 결과" 순서로 소리 내어 답한 뒤, 접힌 "답에 들어가야 할 것"과 비교한다. 세 줄이 모두 나오면 통과다.');
  for (const id of day.talkCards) {
    const card = ctx.cards.get(id);
    if (!card) throw new Error(`${day.id}: 말하기 카드 ${id}가 course/days/${day.id}.json의 cards에 없다`);
    const link = day.talkCardLinks?.[id];
    if (link) parts.push(`<p class="card-task-link"><a href="#${stepAnchor(day.id, link.step)}">${circled(link.step)} 과제 · ${link.ticket}</a>를 설명하는 카드</p>`);
    parts.push(cardBlock(card));
  }
  if (ctx.ready) {
    parts.push('## AI 채점 프롬프트', GRADER_INTRO[day.phase]);
    if (Object.values(ctx.hintsDay.observations ?? {}).flat().some((o) => o.required)) {
      parts.push('**꼭 할 관찰**의 관찰 증거도 함께 채점받는다. 미제출은 해당 완료 조건 실패다. 선택 관찰은 제외한다.');
    }
    parts.push(fence(graderPrompt(day, ctx.cards, ctx.hintsDay, graderTemplate(ctx.hints, day.phase), ctx.root), 'text'));
  }
  parts.push('## 내일 미리보기', day.tomorrow);
  if (ctx.ready && ctx.answers?.last) {
    const sha = ctx.answers.last.sha;
    const lines = [`오늘 마지막 구현 예시 커밋은 \`${sha.slice(0, 8)}\`(${ctx.answers.last.subject})이다. [이 시점의 board-server 전체 보기](${REPO_URL}/tree/${sha}/board-server). 직접 설계한 뒤 비교할 구현 예시는 위 순서 칸의 인라인 코드이며, 이 링크는 보조다(PR 병합 방식에 따라 커밋이 사라질 수 있다).`];
    if (ctx.answers.lastFix) lines.push('', `오늘 순서의 보완(answer-fix)은 뒤 날 정답까지 만든 뒤에 커밋했으므로 위 링크에는 없다. 보완을 반영한 코드는 순서 칸의 "보완"에서 보고, 보완이 모두 들어간 최신 코드는 [보완 반영 최신 코드: main의 board-server](${REPO_URL}/tree/main/board-server)에서 본다(뒤 날 코드도 함께 들어 있다).`);
    parts.push('## 날짜별 snapshot', lines.join('\n'));
  }
  const refs = ctx.hintsDay?.refs ?? [];
  if (refs.length) {
    const items = refs.map((p) => `- [${docTitle(p, ctx.root, day.id)}](../../${p})`);
    parts.push('## 참고 자료', '<details class="day-refs">\n<summary>기존 시나리오·공부자료 (참고 도감)</summary>\n\n' + items.join('\n') + '\n\n</details>');
  }
  parts.push(navLine(day, ctx.roadmap));
  return withSpringConfigVariants(`${parts.join('\n\n')}\n`);
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
    `2. [출발 자료](../start/README.md)로 JDK 21·Docker 런타임·IntelliJ를 준비한다. compose는 D01 ①에서 프로젝트를 만든 뒤 출발 자료의 파일 3개(\`compose.yaml\`, \`toxiproxy.json\`, WireMock 스텁)를 먼저 복사하고 띄운다. 복사하기 전에 띄우면 \`toxiproxy.json\`이 빈 디렉터리로 생긴다`,
    '',
    '## 워밍업 주제',
    '',
    `- ${j0.topic}`,
    j0.basics ? `- 기본기: ${j0.basics}` : '',
    '',
    '데이터 요구사항을 보고 테이블·키·제약·인덱스는 직접 설계한다. D01부터 매일 SQL을 풀고, [더미 SQL](../start/dummy/README.md)은 내 테이블 이름에 맞춰 붙여 넣는다. board-server는 직접 설계한 뒤 비교할 구현 예시다.',
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
    '하루 한 페이지다. 맨 위 [오늘 순서]대로 만들고, 막히면 순서 칸의 힌트를, 그래도 막히면 그 순서의 구현 예시만 펼친다. 내 테이블에서 오늘의 SQL을 풀고, 하루가 끝나면 말하기 카드에 답하고 AI 채점 프롬프트로 확인한다.',
    '',
    '- 1단계(D01\\~D10): 데이터 요구사항으로 테이블을 직접 설계하고 빈 프로젝트로 서버 만들기. 시작은 [출발 자료](../start/README.md)',
    '- 2단계(D11\\~D14): 어수선한 서버 넘겨받기. 티켓은 필수 B01\\~B04 4건 + 선택 1건(Security·Redis 후보에서 고른다) + 고도화 E01 + 모의 장애 훈련이고, 나머지는 연습 티켓이다',
    '- 중간 점검(D15): 설명·회고를 남기고 D16 개인 경로로 연결',
    `- 3단계(D16\\~${roadmap.days.at(-1).id}): 미수행 과제·설계·운영 변경·회의·새 사례 독립 평가. 하루 분량은 완료 조건 기준으로 조절한다`,
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

export function renderExtendedJava(j, roadmap) {
  const previous = `J${dd(dayNo(j.id)-1)}`;
  const next = roadmap.java.find(x => x.id === `J${dd(dayNo(j.id)+1)}`);
  return [HEADER, '', `# ${j.id}. ${j.title}`, '',
    `> 소요 20~40분 · ${j.day} ${j.timing === 'during-or-after' ? '수행 중 증거·사후 확인' : '연결 실험'} · 기존 J 재사용과 새 경계 관찰을 구분한다.`, '',
    '## 만들 파일과 실행 위치', '',
    j.evidence ? `**내 프로젝트 루트**에서 진행한다. ${j.evidence.instructions}` : `**내 프로젝트 루트**에서 \`${j.labFile}\`를 만든다. 기존 테스트로 동일 증거가 있으면 재실행·조건을 기록하고 재사용한다. java-track에 존재하지 않는 J16 이후 테스트가 있다고 가정하지 않는다.`, '',
    '## 오늘 실험', '', j.topic, '',
    ...(j.timing === 'during-or-after' ? ['요구 제시·초기 진단 뒤에 테스트를 선택한다. Java를 독립 평가의 선행 과제로 수행하지 않는다.', ''] : []),
    ...(j.experiment ?? []).flatMap(x => [x, '']),
    '## 재사용할 Java', '', ...j.reuse.map(id => `- [${id} 기존 연습](${id}.md)`), '',
    '## 실행과 완료 조건', '',
    ...(j.evidence ? j.evidence.commands.map(x => `- ${x}`) : [`- \`./gradlew test --tests '${j.id}EvidenceTest'\` (직접 이 이름으로 만든 테스트). 기존 테스트를 재사용하면 실제 클래스 이름으로 실행한다.`]),
    ...j.acceptance.map(x => `- ${x}`), '',
    '통합 관찰은 disposable DB/별도 JVM에서 실행한다. 실행 불가는 이유와 함께 확인 불가로 기록한다. 성공/실패·예상/실측을 나눈다.', '',
    '## 오늘 Spring에서 다시 만나는 곳', '',
    `[오늘 Spring ${j.day} →](../spring/${j.day}.md) · [이전 ${previous}](${previous}.md)${next ? ` · [다음 ${next.id}](${next.id}.md)` : ''}`, '',
  ].join('\n');
}

// ---------------------------------------------------------------- 전체 생성
// 반환: { files: Map(상대 경로 → 내용), skipped: 이유 | null, warnings: [] }
export function buildAll(root = ROOT) {
  const { roadmap, hints, cards: cardsText } = loadCourseSources(root);
  const cards = parseTalkCards(cardsText);
  const specSections = parseSpecSections(read(path.join(root, 'course/spec-v2.md')));
  const commits = listAnswerCommits(root);
  if (!commits.length) return { files: new Map(), skipped: 'answer(Dnn-m) 정답 커밋을 찾지 못했다(얕은 복제 또는 squash 병합). 커밋된 일자 페이지를 그대로 둔다.', warnings: [] };
  const answers = collectAnswers(roadmap, root);
  const placeErrs = [...answers].flatMap(([dayId, entry]) => fixPlacementErrors(dayId, entry, root));
  if (placeErrs.length) throw new Error(`보완 적용 시점 오류:\n${placeErrs.join('\n')}`);
  const cache = new Map();
  const filesOf = (sha) => { if (!cache.has(sha)) cache.set(sha, commitFiles(sha, root)); return cache.get(sha); };
  const fixFilesOf = (fixes) => netFixFiles(fixes, root);
  // 그 커밋 전에 파일을 마지막으로 바꾼 정답 커밋 이름(예: answer(D03-3))
  const lastTouch = (sha, file) => {
    const out = git(root, ['log', '--format=%s', `${sha}^`, '--', SERVER_DIR + file]);
    const m = out.split('\n').map((l) => l.match(/^(answer(?:-fix)?)\((D\d{2}-\d+)\):/)).find(Boolean);
    return m ? `${m[1]}(${m[2]})` : null;
  };
  const warnings = [];
  const files = new Map();
  for (const j of roadmap.java.filter(j => j.reuse?.length)) files.set(`course/java/${j.id}.md`, renderExtendedJava(j, roadmap));
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
    files.set(`course/spring/${day.id}.md`, renderDay(day, { root, roadmap, hints, hintsDay: hintsDay ?? {}, cards, specSections, answers: ready && day.phase === 'build' ? dayAnswers : null, filesOf, fixFilesOf, lastTouch, ready }));
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
