// 사이트 빌드 — 레포의 .md를 같은 자리에 .html로 렌더링한다(클론 후 브라우저로 바로 열 수 있게).
//   대상: README.md, docs/knowledge/*.md, scenario/**/*.md, practice/*.md
//   - 제목에 앵커(id)를 붙이고, 상대 .md 링크는 .html로 바꾼다
//   - 본문에 나오는 문서 ID(예: P19)는 그 공부자료로 자동 링크한다
//   - scenario/scenario.json에 있는 단계 페이지에는 "결과 테스트 프롬프트" 칸과 이전/다음 이동을 붙인다
//   - scenario/README.md의 목차(<!-- toc:start --> ~ <!-- toc:end -->)를 scenario.json으로 다시 쓴다
//   - 상대 링크의 파일이나 앵커가 없으면 실패한다(깨진 링크를 커밋하지 않게)
// 실행: cd tools/site && npm install && npm run build
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import { renderScreen, withImplementationCode } from './scenario-content.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const read = (p) => fs.readFileSync(p, 'utf8');
const assetUrl = (p, fromDir) => {
  const digest = createHash('sha256').update(fs.readFileSync(path.join(ROOT, p))).digest('hex').slice(0, 12);
  const relative = path.relative(fromDir, path.join(ROOT, p)).split(path.sep).join('/');
  return `${relative}?v=${digest}`;
};
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escapeTextarea = (s) => escapeHtml(s).replace(/\r/g, '&#13;').replace(/[ \t]+(?=\n|$)/gm, (trailing) => [...trailing].map((char) => char === '\t' ? '&#9;' : '&#32;').join(''));
const stripTags = (h) => h.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
// GitHub과 같은 규칙의 앵커: 소문자, 글자·숫자·공백·-·_만 남기고 공백은 -로
const slugify = (text) => text.toLowerCase().trim().replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '').replace(/ /g, '-');

// ---------------------------------------------------------------- 대상 파일
function listMd() {
  const out = [path.join(ROOT, 'README.md')];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) out.push(p);
    }
  };
  out.push(path.join(ROOT, 'errors.md'));
  for (const d of ['docs/knowledge', 'scenario', 'practice', 'lessons', 'tickets']) walk(path.join(ROOT, d));
  return out;
}

// 공부자료 ID → 파일(예: P19 → docs/knowledge/P19-mysql-jpa-setup.md)
const DOC_DIR = path.join(ROOT, 'docs/knowledge');
const DOC_BY_ID = new Map(fs.readdirSync(DOC_DIR).filter((f) => /^[A-Z]\d{2}-.*\.md$/.test(f)).map((f) => [f.slice(0, 3), path.join(DOC_DIR, f)]));

// ---------------------------------------------------------------- 시나리오 목록(scenario.json)
const MANIFEST = JSON.parse(read(path.join(ROOT, 'scenario/scenario.json')));
const CHAPTERS = [
  ...MANIFEST.chapters.filter((ch) => ch.project !== 'spec-board'),
  ...MANIFEST.chapters.filter((ch) => ch.project === 'spec-board'),
];
const LEVELS = []; // 준비된 단계만, 순서대로
for (const ch of CHAPTERS) {
  for (const lv of ch.levels) {
    if (ch.status !== 'planned' && lv.file) LEVELS.push({ ...lv, chapter: ch, abs: path.join(ROOT, 'scenario', ch.dir, lv.file) });
  }
}
const LEVEL_BY_ABS = new Map(LEVELS.map((l, i) => [l.abs, { ...l, index: i }]));

function writeToc() {
  const p = path.join(ROOT, 'scenario/README.md');
  const src = read(p);
  const lines = [];
  for (const ch of CHAPTERS) {
    const planned = ch.status === 'planned';
    lines.push(`### ${ch.title}${planned ? ' — 준비 중' : ''}`, '', ch.summary, '');
    for (const lv of ch.levels) {
      const grade = { basic: '기초', intermediate: '중급', advanced: '고급' }[lv.difficulty] || '';
      const label = `${lv.id}. ${lv.title}${grade ? ` · ${grade}` : ''}`;
      lines.push(planned || !lv.file ? `- ${label}` : `- [${label}](${ch.dir}/${lv.file})`);
    }
    lines.push('');
  }
  const toc = `<!-- toc:start — tools/site/build.mjs가 scenario.json으로 다시 쓴다. 직접 고치지 마라 -->\n${lines.join('\n')}<!-- toc:end -->`;
  const next = src.replace(/<!-- toc:start[\s\S]*?<!-- toc:end -->/, toc);
  if (next === src && !src.includes('<!-- toc:start')) throw new Error('scenario/README.md에 toc 표시가 없다');
  fs.writeFileSync(p, next);
}

// ---------------------------------------------------------------- 렌더링
function render(abs) {
  const dir = path.dirname(abs);
  const anchors = new Set();
  const links = []; // {href, target, hash}
  const seen = new Map();
  let hasMermaid = false;
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        let id = slugify(stripTags(html));
        const n = seen.get(id) ?? 0;
        seen.set(id, n + 1);
        if (n) id = `${id}-${n}`;
        anchors.add(id);
        return `<h${depth} id="${escapeHtml(id)}"><a class="anchor" href="#${escapeHtml(id)}" aria-hidden="true">#</a>${html}</h${depth}>\n`;
      },
      code({ text, lang }) {
        if ((lang || '').trim() === 'check') return renderRequests(text);
        if ((lang || '').trim() === 'manual-command') return `<details class="manual-command"><summary>터미널 명령어 참고</summary><pre><code>${escapeHtml(text)}</code></pre></details>\n`;
        if ((lang || '').trim() === 'screen') return renderScreen(text);
        if ((lang || '').trim() === 'mermaid') {
          hasMermaid = true;
          return `<pre class="mermaid">${escapeHtml(text)}</pre>\n`;
        }
        const cls = lang ? ` class="language-${escapeHtml(lang.trim().split(/\s+/)[0])}"` : '';
        return `<pre><code${cls}>${escapeHtml(text)}</code></pre>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const t = title ? ` title="${escapeHtml(title)}"` : '';
        if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return `<a href="${escapeHtml(href)}"${t} target="_blank" rel="noopener">${text}</a>`;
        const [p, hash = ''] = href.split('#');
        const target = p ? path.resolve(dir, decodeURI(p)) : abs;
        links.push({ href, target, hash: decodeURIComponent(hash) });
        const out = p.endsWith('.md') ? p.slice(0, -3) + '.html' : p;
        return `<a href="${escapeHtml(out + (hash ? '#' + hash : ''))}"${t}>${text}</a>`;
      },
    },
  });
  const level = LEVEL_BY_ABS.get(abs);
  let source = level ? withImplementationCode(read(abs), ROOT, level.id, abs) : read(abs);
  if (level) {
    if (!/```check\s/.test(source)) {
      const legacy = legacyCurlRequest(source);
      if (legacy) source = source.replace(/(## 직접 확인[\s\S]*?)(?=\n## |$)/, (section) => `${section}\n\n\`\`\`check\n${JSON.stringify({ requests: [legacy] }, null, 2)}\n\`\`\``);
    }
    // 실행 요청은 check 블록의 버튼으로 제공하고, 원래 curl은 접어서 정확한 원문을 보존한다.
    source = source.replace(/(## 직접 확인[\s\S]*?)(?=\n## |$)/, (section) => section.replace(/```(?:bash|sh|shell)\n([\s\S]*?)\n```/g, '```manual-command\n$1\n```'));
  }
  let html = marked.parse(source);
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
  html = autolinkDocIds(html, abs);
  return { html, anchors, links, hasMermaid };
}

function legacyCurlRequest(markdown) {
  const section = markdown.match(/## 직접 확인([\s\S]*?)(?=\n## |$)/)?.[1] || '';
  const lines = section.split('\n');
  const start = lines.findIndex((line) => /\bcurl\b/.test(line));
  let command = start < 0 ? '' : lines[start].trim();
  for (let index = start; index >= 0 && command.endsWith('\\') && index + 1 < lines.length;) {
    command = `${command.slice(0, -1)} ${lines[++index].trim()}`;
  }
  if (!command) return null;
  const url = command.match(/["']\$BASE([^"']*)["']/)?.[1];
  if (!url) return null;
  const method = command.match(/(?:-X|--request)\s+([A-Z]+)/)?.[1] || (/-d\s/.test(command) ? 'POST' : 'GET');
  const headers = {};
  for (const match of command.matchAll(/-H\s+'([^']+)'/g)) {
    const colon = match[1].indexOf(':');
    if (colon > 0) headers[match[1].slice(0, colon).trim()] = match[1].slice(colon + 1).trim();
  }
  const body = command.match(/(?:-d|--data-raw)\s+'([^']*)'/)?.[1];
  return { id: 'HTTP', title: '직접 확인 요청', method, path: url, headers, ...(body === undefined ? {} : { body }) };
}

// 본문 텍스트의 "P19" 같은 문서 ID를 공부자료 링크로 바꾼다(코드·링크·제목 안은 건드리지 않는다)
function autolinkDocIds(html, abs) {
  const selfId = path.basename(abs).slice(0, 3);
  const parts = html.split(/(<[^>]+>)/);
  let skip = 0;
  return parts.map((part) => {
    if (part.startsWith('<')) {
      const m = part.match(/^<(\/?)(pre|code|a|h[1-6])\b/i);
      if (m) skip += m[1] ? -1 : 1;
      return part;
    }
    if (skip > 0) return part;
    return part.replace(/\b([BDJPRSVW]\d{2})\b/g, (id) => {
      const f = DOC_BY_ID.get(id);
      if (!f || id === selfId) return id;
      const href = path.relative(path.dirname(abs), f).split(path.sep).join('/').replace(/\.md$/, '.html');
      return `<a class="docref" href="${href}">${id}</a>`;
    });
  }).join('');
}

// ---------------------------------------------------------------- 결과 테스트 프롬프트
function promptTemplate(lv) {
  const mdPath = rel(lv.abs);
  const db = lv.db || lv.chapter.db || 'community';
  const dbNote = db === 'practice'
    ? "\n이 단계는 학습용 DB(practice)를 쓴다. 앱이 practice 프로파일로 떠 있어야 한다(README의 \"학습용 데이터로 앱 실행\"). 아니면 그 방법만 알려 주고 멈춰라."
    : '';
  return `[javaExperience 결과 테스트] ${lv.id}. ${lv.title}
레포 경로: {{REPO}}
서버 주소: {{BASE}}

너는 이 레포로 Spring Boot 백엔드를 배우는 사람의 리뷰어다.${dbNote}
지킬 것: 코드는 절대 수정하지 마라. DB는 SELECT만 한다. 서버를 대신 띄우거나 끄지 마라. 정답 코드를 통째로 주지 말고 방향과 힌트로 알려 줘라.

1. {{REPO_STEP}} \`${mdPath}\` 를 읽어라. 그 파일의 "채점 기준" 표가 통과/실패의 유일한 기준이다. 표에 없는 것으로 실패 처리하지 말고, 다른 단계의 기준은 보지 마라.
2. 서버 주소의 응답 가능 여부를 확인해라. 꺼져 있으면 README의 "실행" 방법만 알려 주고 멈춰라.
3. C 항목(HTTP)을 표의 순서대로 확인해라. 단계 페이지의 요청 정의(method·경로·헤더·본문)를 그대로 보내고, 동적 값은 앞선 응답의 참조 규칙을 따른다. 상태 코드·응답 헤더·본문을 기대값과 비교해라.
4. D 항목(DB)은 레포 루트에서 \`docker compose exec -T mysql mysql -ucommunity -pcommunity ${db} -e "<SELECT 문>"\` 으로 조회만 해라(SELECT·SHOW·EXPLAIN만, 바꾸는 문장 금지). "요청 전후"를 비교하는 항목은 해당 C 요청을 보내기 전에 먼저 조회해 둔다.
5. T 항목(테스트)은 레포 루트에서 표에 적힌 \`./gradlew test --tests ...\` 명령을 실행해 통과 여부를 본다. 실패하면 실패한 테스트 이름과 이유를 적는다. 테스트 코드도 고치지 마라.
6. R 항목(코드 리뷰)은 관련 코드를 찾아 읽고 판단해라. 지적할 때는 \`파일:줄\`을 붙여라.
7. 아래 형식으로만 답해라.
   ① 채점표 — | 항목 | 기대 | 실제 | 결과 |  (결과: 통과 / 실패 / 확인 불가)
   ② 잘한 점
   ③ 부족한 점과 이유 — 실패한 C·D·T 항목부터
   ④ 다음 단계 전에 고칠 것 — 우선순위순, 3개 이내
   ⑤ 더 볼 문서 — 단계 파일의 "필요한 지식" 중 부족한 점과 관련된 것만(파일 경로로)
   마지막 줄: \`결과: 필수 N/M 통과\` (필수 = C·D 항목, T는 선택)`;
}

function graderPanel(lv) {
  return `
<section class="grader" id="result-test">
  <h2>결과 테스트 프롬프트</h2>
  <p>다 만들었으면 <strong>서버를 띄운 채로</strong> 아래 프롬프트를 복사해 Codex 또는 Claude Code에 붙여 넣으세요. 에이전트가 API와 DB를 확인하고 채점표를 줍니다. 코드는 고치지 않습니다.</p>
  <div class="grader-inputs">
    <label>레포 경로 <input id="repo" autocomplete="off" placeholder="비워 두면 에이전트를 연 폴더(레포 루트)를 쓴다"></label>
  </div>
  <textarea id="prompt" readonly rows="20" aria-label="결과 테스트 프롬프트"></textarea>
  <div class="grader-actions"><button type="button" id="copy">프롬프트 복사</button><span id="copied" role="status"></span></div>
  <script type="application/json" id="prompt-template">${JSON.stringify(promptTemplate(lv)).replace(/</g, '\\u003c')}</script>
</section>
<script>
(() => {
  const $ = (id) => document.getElementById(id);
  const tpl = JSON.parse($('prompt-template').textContent);
  const baseInput = $('scenario-base-url');
  const store = { get(k) { try { return localStorage.getItem(k) || ''; } catch { return ''; } },
                  set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  $('repo').value = store.get('jx.repo');
  function fill() {
    const repo = $('repo').value.trim();
    const base = (baseInput?.value.trim() || 'http://localhost:8080').replace(/\\/+$/, '');
    $('prompt').value = tpl
      .replaceAll('{{REPO}}', repo || '(에이전트를 연 폴더 = 레포 루트)')
      .replaceAll('{{REPO_STEP}}', repo ? '레포 경로로 이동(cd)한 뒤' : '지금 작업 폴더(레포 루트)에서')
      .replaceAll('{{BASE}}', base);
    store.set('jx.repo', repo);
  }
  $('repo').addEventListener('input', fill);
  baseInput?.addEventListener('input', fill);
  fill();
  $('copy').addEventListener('click', async () => {
    const text = $('prompt').value;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch {}
    if (!ok) { $('prompt').select(); try { ok = document.execCommand('copy'); } catch {} }
    $('copied').textContent = ok ? '복사했어요. Codex 또는 Claude Code에 붙여 넣으세요.' : '자동 복사가 막혔어요. 위 칸을 전체 선택(⌘A)해서 복사하세요.';
  });
})();
</script>`;
}

// ---------------------------------------------------------------- 페이지 틀
function page({ abs, title, body, hasMermaid }) {
  const up = (p) => path.relative(path.dirname(abs), path.join(ROOT, p)).split(path.sep).join('/') || '.';
  const lv = LEVEL_BY_ABS.get(abs);
  let crumbs = '';
  let pager = '';
  if (lv) {
    const grade = { basic: '기초', intermediate: '중급', advanced: '고급' }[lv.difficulty] || '';
    const project = lv.chapter.project === 'spec-board' ? '별도 명세서 프로젝트' : '게시판 본편';
    crumbs = `<p class="crumbs"><a href="${up('scenario/README.html')}">시나리오</a> › ${escapeHtml(lv.chapter.title)} › ${escapeHtml(lv.id)}</p><p class="level-tags"><span>${escapeHtml(grade)}</span><span>${project}</span><span>DB ${escapeHtml(lv.db || lv.chapter.db || 'community')}</span></p>`;
    const prev = LEVELS[lv.index - 1]?.chapter.project === lv.chapter.project ? LEVELS[lv.index - 1] : null;
    const next = LEVELS[lv.index + 1]?.chapter.project === lv.chapter.project ? LEVELS[lv.index + 1] : null;
    const link = (l, label) => (l ? `<a href="${path.relative(path.dirname(abs), l.abs).split(path.sep).join('/').replace(/\.md$/, '.html')}">${label} ${escapeHtml(l.id)}. ${escapeHtml(l.title)}</a>` : '<span></span>');
    pager = `<nav class="pager">${link(prev, '← 이전')}${link(next, '다음 →')}</nav>`;
    body = requestPageTools() + body + graderPanel(lv);
  }
  if (abs === path.join(ROOT, 'scenario/README.md')) {
    body = `<nav class="difficulty-filter" aria-label="시나리오 난이도">
      <button type="button" data-grade="all" aria-pressed="true">전체</button>
      <button type="button" data-grade="기초" aria-pressed="false">기초</button>
      <button type="button" data-grade="중급" aria-pressed="false">중급</button>
      <button type="button" data-grade="고급" aria-pressed="false">고급</button>
    </nav>` + body + `<script>
(() => {
  const buttons = [...document.querySelectorAll('[data-grade]')];
  const entries = [...document.querySelectorAll('main li')].map((item) => ({
    item, grade: item.textContent.trim().match(/ · (기초|중급|고급)$/)?.[1] || null,
  })).filter((entry) => entry.grade);
  for (const button of buttons) button.addEventListener('click', () => {
    const grade = button.dataset.grade;
    for (const entry of entries) entry.item.hidden = grade !== 'all' && entry.grade !== grade;
    for (const other of buttons) other.setAttribute('aria-pressed', String(other === button));
  });
})();
</script>`;
  }
  const mermaid = hasMermaid
    ? `<script type="module">import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs';
const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
mermaid.initialize({ startOnLoad: true, theme: dark ? 'dark' : 'default' });</script>`
    : '';
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="${assetUrl('tools/site/site.css', path.dirname(abs))}">
<script src="${assetUrl('tools/site/syntax-highlight.js', path.dirname(abs))}" defer></script>
</head>
<body>
<header class="topbar"><a href="${up('README.html')}">javaExperience</a><a href="${up('scenario/README.html')}">시나리오</a><a href="${up('practice/MISSIONS.html')}">학습용 미션</a><a href="${up('docs/knowledge/README.html')}">공부자료</a></header>
<main>
${crumbs}
${body}
${pager}
</main>
${mermaid}
${lv ? `<script src="${assetUrl('tools/site/scenario-runner.js', path.dirname(abs))}" defer></script><script src="${assetUrl('tools/site/scenario-snapshots.js', path.dirname(abs))}" defer></script>` : ''}
</body>
</html>
`;
}

function renderRequests(text) {
  let data;
  try { data = JSON.parse(text); } catch (error) { throw new Error(`check 블록 JSON 오류: ${error.message}`); }
  const requests = Array.isArray(data) ? data : data.requests;
  if (!Array.isArray(requests)) return `<pre><code>${escapeHtml(text)}</code></pre>`;
  const checks = data.checks || [];
  const requestIds = new Set(requests.map((request) => request.id));
  const cards = requests.map((request, index) => {
    const expect = checks.filter((check) => check.request === request.id || check.all?.some((item) => item.request === request.id))
      .map((check) => `${check.id}: ${JSON.stringify(check.expect || check.all?.find((item) => item.request === request.id)?.expect || {})}`).join('\n');
    const refs = new Set(`${request.path || ''} ${typeof request.body === 'string' ? request.body : JSON.stringify(request.body ?? '')}`.match(/\{\{([^}]+)\}\}/g) || []);
    const concurrentVars = request.concurrent?.vars || {};
    const clientConcurrentVars = Object.fromEntries(Object.entries(concurrentVars).map(([name, values]) => [
      name, /token|auth|^tok$/i.test(name) ? Array(values.length).fill('') : values,
    ]));
    const variables = [...refs].map((ref) => ({ ref, name: ref.slice(2, -2), response: requestIds.has(ref.slice(2, -2).split('.')[0]), grouped: Object.hasOwn(concurrentVars, ref.slice(2, -2)) }));
    const headerInputs = Object.entries(request.headers || {}).map(([name, value]) => {
      const isAuth = /^authorization$/i.test(name);
      const hasTemplate = String(value).includes('{{');
      // 공개 학습용 정적 예시 토큰은 바로 실행할 수 있게 표시하고 편집 가능하게 둔다.
      // 템플릿 토큰은 실제 값을 추측하지 않고 학습자가 입력하도록 비워 둔다.
      const shown = isAuth && hasTemplate ? '' : String(value);
      const placeholder = isAuth && hasTemplate ? '연습용 토큰을 직접 입력' : '';
      return `<label>헤더 · ${escapeHtml(name)} <input class="request-header" data-name="${escapeHtml(name)}" data-template="${escapeHtml(value)}" value="${escapeHtml(shown)}" placeholder="${escapeHtml(placeholder)}" autocomplete="off" spellcheck="false"></label>`;
    }).join('');
    const bodyText = request.body === undefined ? '' : typeof request.body === 'string' ? request.body : JSON.stringify(request.body, null, 2);
    const bodyInput = request.body === undefined ? '' : `<label>Raw body <textarea class="request-body" data-body-kind="${typeof request.body === 'string' ? 'text' : 'json'}" rows="4" spellcheck="false">${escapeTextarea(bodyText)}</textarea></label>`;
    const groupedInputs = Object.entries(concurrentVars).map(([name, values]) => {
      const tokenVar = /token|auth|^tok$/i.test(name);
      return `<label>${escapeHtml(name)} — ${tokenVar ? '토큰을 직접 입력 (한 줄에 하나)' : '요청별 값'} <textarea class="request-var-values" data-name="${escapeHtml(name)}" rows="${Math.min(Math.max(values.length, 2), 6)}" placeholder="${values.length}개 값, 한 줄에 하나씩">${escapeTextarea(tokenVar ? '' : values.join('\n'))}</textarea></label>`;
    }).join('');
    const mode = request.concurrent ? `동시 요청 ${request.concurrent.count}개` : request.repeat ? `같은 요청 ${request.repeat}회 순차 전송` : '';
    const variableInputs = variables.length || groupedInputs ? `<div class="request-variables">${groupedInputs}${variables.filter((v) => !v.response && !v.grouped).map((v) => `<label>${escapeHtml(v.name)} <input class="request-variable" data-ref="${escapeHtml(v.ref)}" autocomplete="off"></label>`).join('')}<p>선행 요청 참조는 해당 요청을 먼저 보내면 응답 값으로 자동 채웁니다.</p></div>` : '';
    const expected = expect || '직접 확인 절의 기대 결과를 참고하세요.';
    return `<article class="api-request" data-request-id="${escapeHtml(request.id)}" data-method="${escapeHtml(request.method)}" data-request-index="${index}" data-concurrent-count="${String(request.concurrent?.count || 0)}" data-concurrent-vars="${escapeHtml(JSON.stringify(clientConcurrentVars))}" data-repeat="${String(request.repeat || 0)}"><header class="request-card-head"><div><p class="request-method">${escapeHtml(request.method)}${mode ? ` · ${escapeHtml(mode)}` : ''}</p><h4>${escapeHtml(request.id)} · ${escapeHtml(request.title || '요청')}</h4></div><span class="request-number">요청 ${index + 1}</span></header><div class="request-editor"><label>경로 <input class="request-path" value="${escapeHtml(request.path || '')}" autocomplete="off" spellcheck="false"></label>${variableInputs}<div class="request-fields">${headerInputs}</div>${bodyInput}<div class="request-actions"><button type="button" class="send-request" aria-describedby="request-status-${index}">${escapeHtml(request.method)} ${mode ? escapeHtml(mode) : '요청 보내기'}</button><p id="request-status-${index}" class="request-status" role="status" aria-live="polite"></p></div></div><details class="request-response" hidden><summary>응답 확인</summary><p class="response-status"></p><h5>Headers</h5><pre class="response-headers"></pre><h5>Body</h5><pre class="response-body"></pre></details><details class="postman"><summary>Postman 설정 보기</summary><dl><dt>Method</dt><dd>${escapeHtml(request.method)}</dd><dt>Full URL</dt><dd class="postman-url"></dd><dt>Headers</dt><dd><pre>${escapeHtml(JSON.stringify(request.headers || {}, null, 2))}</pre></dd><dt>Raw body</dt><dd><pre>${request.body === undefined ? '(본문 없음)' : escapeTextarea(bodyText)}</pre></dd><dt>Expected result</dt><dd><pre>${escapeHtml(expected)}</pre></dd></dl></details></article>`;
  }).join('');
  return `<section class="api-practice" aria-label="HTTP 요청 실행"><h3>브라우저에서 요청 보내기</h3><p>서버 주소를 입력한 뒤 요청 버튼을 누르세요. 토큰은 직접 입력하며 페이지에 저장하지 않습니다.</p><div class="api-request-list">${cards}</div></section>`;
}

function requestPageTools() {
  return `<section class="server-url"><label>서버 주소 <input id="scenario-base-url" type="url" value="http://localhost:8080" spellcheck="false"></label><p>요청은 이 페이지가 열린 출처에서 브라우저로 전송됩니다. CORS 설정에 이 출처가 허용되어 있어야 합니다.</p></section>`;
}

// ---------------------------------------------------------------- 실행
writeToc();
const files = listMd();
const results = new Map(files.map((f) => [f, render(f)]));
const errors = [];
for (const [f, r] of results) {
  for (const l of r.links) {
    if (!fs.existsSync(l.target)) { errors.push(`${rel(f)}: 없는 파일 → ${l.href}`); continue; }
    if (l.hash) {
      const t = results.get(l.target);
      if (!t) { errors.push(`${rel(f)}: 앵커 검사 불가(빌드 대상 아님) → ${l.href}`); continue; }
      if (!t.anchors.has(l.hash)) errors.push(`${rel(f)}: 없는 앵커 → ${l.href}`);
    }
  }
}
if (errors.length) {
  console.error(`깨진 링크 ${errors.length}개:\n` + errors.join('\n'));
  process.exit(1);
}
for (const [f, r] of results) {
  const title = (read(f).match(/^# (.+)$/m)?.[1] ?? path.basename(f)).replace(/[`*]/g, '');
  fs.writeFileSync(f.replace(/\.md$/, '.html'), page({ abs: f, title, body: r.html, hasMermaid: r.hasMermaid }));
}
console.log(`HTML ${results.size}개 생성 · 시나리오 단계 ${LEVELS.length}개 · 링크 오류 0`);
