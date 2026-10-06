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
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const read = (p) => fs.readFileSync(p, 'utf8');
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
  for (const d of ['docs/knowledge', 'scenario', 'practice']) walk(path.join(ROOT, d));
  return out;
}

// 공부자료 ID → 파일(예: P19 → docs/knowledge/P19-mysql-jpa-setup.md)
const DOC_DIR = path.join(ROOT, 'docs/knowledge');
const DOC_BY_ID = new Map(fs.readdirSync(DOC_DIR).filter((f) => /^[A-Z]\d{2}-.*\.md$/.test(f)).map((f) => [f.slice(0, 3), path.join(DOC_DIR, f)]));

// ---------------------------------------------------------------- 시나리오 목록(scenario.json)
const MANIFEST = JSON.parse(read(path.join(ROOT, 'scenario/scenario.json')));
const LEVELS = []; // 준비된 단계만, 순서대로
for (const ch of MANIFEST.chapters) {
  for (const lv of ch.levels) {
    if (ch.status !== 'planned' && lv.file) LEVELS.push({ ...lv, chapter: ch, abs: path.join(ROOT, 'scenario', ch.dir, lv.file) });
  }
}
const LEVEL_BY_ABS = new Map(LEVELS.map((l, i) => [l.abs, { ...l, index: i }]));

function writeToc() {
  const p = path.join(ROOT, 'scenario/README.md');
  const src = read(p);
  const lines = [];
  for (const ch of MANIFEST.chapters) {
    const planned = ch.status === 'planned';
    lines.push(`### ${ch.title}${planned ? ' — 준비 중' : ''}`, '', ch.summary, '');
    for (const lv of ch.levels) {
      const label = `${lv.id}. ${lv.title}`;
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
  let html = marked.parse(read(abs));
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
  html = autolinkDocIds(html, abs);
  return { html, anchors, links, hasMermaid };
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
  return `[javaExperience 결과 테스트] ${lv.id}. ${lv.title}
레포 경로: {{REPO}}
서버 주소: {{BASE}}

너는 이 레포로 Spring Boot 백엔드를 배우는 사람의 리뷰어다.
지킬 것: 코드는 절대 수정하지 마라. DB는 SELECT만 한다. 서버를 대신 띄우거나 끄지 마라. 정답 코드를 통째로 주지 말고 방향과 힌트로 알려 줘라.

1. {{REPO_STEP}} \`${mdPath}\` 를 읽어라. 그 파일의 "채점 기준" 표가 통과/실패의 유일한 기준이다. 표에 없는 것으로 실패 처리하지 말고, 다른 단계의 기준은 보지 마라.
2. \`curl -s -o /dev/null -w '%{http_code}' {{BASE}}/\` 로 서버가 응답하는지 확인해라(000이면 꺼진 것). 꺼져 있으면 README의 "실행" 방법만 알려 주고 멈춰라.
3. C 항목(HTTP)을 표의 순서대로 확인해라. 요청은 단계 파일 "직접 확인"에 있는 curl 명령을 그대로 쓰되 \`BASE\`만 위 서버 주소로 바꾼다(본문·제목의 [채점] 접두어는 그대로). 응답은 \`-i\`로 헤더까지 받아 상태코드·헤더·본문을 기대값과 비교해라.
4. D 항목(DB)은 레포 루트에서 \`docker compose exec -T mysql mysql -ucommunity -pcommunity community -e "<SELECT 문>"\` 으로 조회만 해라.
5. R 항목(코드 리뷰)은 관련 코드를 찾아 읽고 판단해라. 지적할 때는 \`파일:줄\`을 붙여라.
6. 아래 형식으로만 답해라.
   ① 채점표 — | 항목 | 기대 | 실제 | 결과 |  (결과: 통과 / 실패 / 확인 불가)
   ② 잘한 점
   ③ 부족한 점과 이유 — 실패한 C·D 항목부터
   ④ 다음 단계 전에 고칠 것 — 우선순위순, 3개 이내
   ⑤ 더 볼 문서 — 단계 파일의 "필요한 지식" 중 부족한 점과 관련된 것만(파일 경로로)
   마지막 줄: \`결과: 필수 N/M 통과\` (필수 = C·D 항목)`;
}

function graderPanel(lv) {
  return `
<section class="grader" id="result-test">
  <h2>결과 테스트 프롬프트</h2>
  <p>다 만들었으면 <strong>서버를 띄운 채로</strong> 아래 프롬프트를 복사해 Claude Code에 붙여 넣으세요. Claude가 API를 직접 호출하고 DB를 조회한 뒤 채점표와 피드백을 줍니다. 코드는 고치지 않습니다.</p>
  <div class="grader-inputs">
    <label>레포 경로 <input id="repo" autocomplete="off" placeholder="비워 두면 Claude를 연 폴더(레포 루트)를 쓴다 — 예: ~/IdeaProjects/javaExperience"></label>
    <label>서버 주소 <input id="base" autocomplete="off" placeholder="http://localhost:8080"></label>
  </div>
  <textarea id="prompt" readonly rows="20" aria-label="결과 테스트 프롬프트"></textarea>
  <div class="grader-actions"><button type="button" id="copy">프롬프트 복사</button><span id="copied" role="status"></span></div>
  <script type="application/json" id="prompt-template">${JSON.stringify(promptTemplate(lv)).replace(/</g, '\\u003c')}</script>
</section>
<script>
(() => {
  const $ = (id) => document.getElementById(id);
  const tpl = JSON.parse($('prompt-template').textContent);
  const store = { get(k) { try { return localStorage.getItem(k) || ''; } catch { return ''; } },
                  set(k, v) { try { localStorage.setItem(k, v); } catch {} } };
  $('repo').value = store.get('jx.repo');
  $('base').value = store.get('jx.base');
  function fill() {
    const repo = $('repo').value.trim();
    const base = ($('base').value.trim() || 'http://localhost:8080').replace(/\\/+$/, '');
    $('prompt').value = tpl
      .replaceAll('{{REPO}}', repo || '(Claude를 연 폴더 = 레포 루트)')
      .replaceAll('{{REPO_STEP}}', repo ? '레포 경로로 이동(cd)한 뒤' : '지금 작업 폴더(레포 루트)에서')
      .replaceAll('{{BASE}}', base);
    store.set('jx.repo', repo);
    store.set('jx.base', $('base').value.trim());
  }
  $('repo').addEventListener('input', fill);
  $('base').addEventListener('input', fill);
  fill();
  $('copy').addEventListener('click', async () => {
    const text = $('prompt').value;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch {}
    if (!ok) { $('prompt').select(); try { ok = document.execCommand('copy'); } catch {} }
    $('copied').textContent = ok ? '복사했어요. Claude Code에 붙여 넣으세요.' : '자동 복사가 막혔어요. 위 칸을 전체 선택(⌘A)해서 복사하세요.';
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
    crumbs = `<p class="crumbs"><a href="${up('scenario/README.html')}">시나리오</a> › ${escapeHtml(lv.chapter.title)} › ${escapeHtml(lv.id)}</p>`;
    const prev = LEVELS[lv.index - 1];
    const next = LEVELS[lv.index + 1];
    const link = (l, label) => (l ? `<a href="${path.relative(path.dirname(abs), l.abs).split(path.sep).join('/').replace(/\.md$/, '.html')}">${label} ${escapeHtml(l.id)}. ${escapeHtml(l.title)}</a>` : '<span></span>');
    pager = `<nav class="pager">${link(prev, '← 이전')}${link(next, '다음 →')}</nav>`;
    body = body + graderPanel(lv);
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
<link rel="stylesheet" href="${up('tools/site/site.css')}">
</head>
<body>
<header class="topbar"><a href="${up('README.html')}">javaExperience</a><a href="${up('scenario/README.html')}">시나리오</a><a href="${up('practice/MISSIONS.html')}">학습용 미션</a><a href="${up('docs/knowledge/README.html')}">공부자료</a></header>
<main>
${crumbs}
${body}
${pager}
</main>
${mermaid}
</body>
</html>
`;
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
