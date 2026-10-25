// 저자 원문과 생성 화면의 구성요소를 식별해 시안·구현·검증 상태를 추적한다.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { P09_LESSONS } from './p09-lesson-data.mjs';
import { P04_LESSONS } from './p04-lesson-data.mjs';
import { P16_CONTRACT_LESSONS } from './p16-contract-data.mjs';
import { W09_LESSONS } from './w09-lesson-data.mjs';
import { P19_LESSONS } from './p19-lesson-data.mjs';
import { P20_LESSONS } from './p20-lesson-data.mjs';
import { S09_LESSONS } from './s09-lesson-data.mjs';
import { S08_LESSONS } from './s08-lesson-data.mjs';
import { W11_LESSONS } from './w11-lesson-data.mjs';
import { R03_LESSONS } from './r03-lesson-data.mjs';
import { R04_LESSONS } from './r04-lesson-data.mjs';
import { W15_LESSONS } from './w15-lesson-data.mjs';
import { V04_LESSONS } from './v04-lesson-data.mjs';
import { B01_LESSONS } from './b01-lesson-data.mjs';
import { D01_LESSONS } from './d01-lesson-data.mjs';
import { D02_LESSONS } from './d02-lesson-data.mjs';
import { D03_LESSONS } from './d03-lesson-data.mjs';
import { D04_LESSONS } from './d04-lesson-data.mjs';
import { D05_LESSONS } from './d05-lesson-data.mjs';
import { D06_LESSONS } from './d06-lesson-data.mjs';
import { D07_LESSONS } from './d07-lesson-data.mjs';
import { D08_LESSONS } from './d08-lesson-data.mjs';
import { D09_LESSONS } from './d09-lesson-data.mjs';
import { D10_LESSONS } from './d10-lesson-data.mjs';
import { D11_LESSONS } from './d11-lesson-data.mjs';
import { D12_LESSONS } from './d12-lesson-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(root, 'docs/design/visual-inventory.jsonl');
const summaryPath = path.join(root, 'docs/design/visual-inventory-summary.json');
const checklistPath = path.join(root, 'docs/design/VISUAL-PAGES.md');
const states = ['unreviewed', 'mockup_ready', 'implemented', 'verified'];
const now = new Date().toISOString().slice(0, 10);

function readExisting() {
  if (!fs.existsSync(output)) return new Map();
  return new Map(fs.readFileSync(output, 'utf8').trim().split('\n').filter(Boolean)
    .map((line) => JSON.parse(line)).map((item) => [item.id, item]));
}

function writeRows(rows) {
  fs.writeFileSync(output, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
}
function writePageChecklist(summary) {
  const groups = new Map();
  for (const page of summary.pages) {
    const group = page.source.startsWith('scenario/ch') ? '시나리오 101단계'
      : page.source.startsWith('scenario/labs/') ? '쿼리 실습'
        : page.source.startsWith('docs/knowledge/') ? '공부자료'
          : page.source.startsWith('lessons/') ? '개념 레슨'
            : page.source.startsWith('tickets/') ? '티켓'
              : page.source.startsWith('course/') ? '과정 v2'
              : '홈·목차·미션·기타';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(page);
  }
  const lines = [
    '# 화면별 시각 개편 체크리스트', '',
    `저자 원문과 생성 HTML이 함께 있는 ${summary.sourcePages}개 화면의 목록이다. 상세한 산문·표·코드·토글·화면 요소 ${summary.units.toLocaleString()}개는 [visual-inventory.jsonl](visual-inventory.jsonl)에 한 줄씩 있다.`,
    '', '체크는 해당 화면의 모든 개별 항목이 `verified`일 때만 자동으로 붙는다. `imagegen` 시안 또는 공통 컴포넌트 한 개를 적용한 상태는 완료가 아니다.', '',
  ];
  for (const [group, pages] of groups) {
    lines.push(`## ${group} (${pages.length})`, '');
    for (const page of pages) {
      const checked = page.status === 'verified' ? 'x' : ' ';
      lines.push(`- [${checked}] [${page.source}](../../${page.html}) — 항목 ${page.units}, 긴 산문 ${page.longProse}, 토글 ${page.toggles}, 최대 접기 깊이 ${page.maxToggleDepth}; 상태: ${page.status}`);
    }
    lines.push('');
  }
  fs.writeFileSync(checklistPath, `${lines.join('\n').trimEnd()}\n`);
}

const args = process.argv.slice(2);
if (args[0] === '--mark') {
  const [, id, status, evidence] = args;
  if (!id || !states.includes(status) || !evidence) {
    throw new Error('사용법: node inventory-visual-work.mjs --mark <id> <unreviewed|mockup_ready|implemented|verified> <근거 파일 또는 검증 기록>');
  }
  const rows = [...readExisting().values()];
  const row = rows.find((item) => item.id === id);
  if (!row) throw new Error(`목록에서 찾을 수 없는 항목: ${id}`);
  if (states.indexOf(status) > states.indexOf(row.status) + 1) throw new Error('상태는 한 단계씩 올려야 한다.');
  row.status = status;
  row.evidence = evidence;
  row.updatedDate = now;
  writeRows(rows);
  if (fs.existsSync(summaryPath)) {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    summary.byStatus = Object.fromEntries(states.map((state) => [state, rows.filter((item) => item.status === state).length]));
    const page = summary.pages.find((item) => item.source === row.page);
    if (page) {
      const pageRows = rows.filter((item) => item.page === row.page);
      page.status = pageRows.every((item) => item.status === 'verified') ? 'verified'
        : pageRows.every((item) => item.status === 'unreviewed') ? 'unreviewed' : 'in_progress';
    }
    fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
    writePageChecklist(summary);
  }
  console.log(`${id}: ${status} · ${evidence}`);
  process.exit(0);
}

const previous = readExisting();
const rows = [];
const pages = [];
const duplicateIds = new Map();
const clean = (value) => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;|&#\d+;/gi, ' ')
  .replace(/[`*_#|[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
function add(page, section, kind, label, length = 0, extra = {}) {
  const text = clean(label);
  const digest = createHash('sha256').update(`${page}\0${kind}\0${section}\0${text}`).digest('hex').slice(0, 12);
  const base = `${page}::${kind}::${digest}`;
  const duplicate = (duplicateIds.get(base) ?? 0) + 1;
  duplicateIds.set(base, duplicate);
  const id = `${base}:${duplicate}`;
  const old = previous.get(id);
  rows.push({
    id, page, section: clean(section), kind, label: text.slice(0, 160), chars: length,
    status: old?.status ?? 'unreviewed', evidence: old?.evidence ?? '', updatedDate: old?.updatedDate ?? '',
    ...extra,
  });
}

function collectMarkdown(page, source) {
  let section = '문서 시작';
  const scan = (tokens) => {
    for (const token of tokens ?? []) {
      if (token.type === 'heading') {
        section = clean(token.text);
        add(page, section, `heading_h${token.depth}`, token.text, clean(token.text).length);
      } else if (token.type === 'paragraph' || token.type === 'text') {
        const value = clean(token.text);
        if (value) add(page, section, token.type === 'paragraph' ? 'prose' : 'list_text', value, value.length);
      } else if (token.type === 'table') {
        const headers = token.header.map((cell) => clean(cell.text)).join(' / ');
        add(page, section, 'table', headers, token.rows.length, { rows: token.rows.length });
      } else if (token.type === 'code') {
        add(page, section, 'code', `${token.lang || 'text'}: ${token.text.split('\n')[0] || ''}`, token.text.length, { lines: token.text.split('\n').length });
      } else if (token.type === 'list') {
        for (const item of token.items) {
          const value = clean(item.text);
          add(page, section, 'list_item', value, value.length);
          for (const child of item.tokens ?? []) if (child.type === 'code' || child.type === 'table') scan([child]);
        }
      } else if (token.type === 'blockquote') {
        const value = clean(token.text);
        add(page, section, 'blockquote', value, value.length);
      } else if (token.type === 'html') {
        const value = clean(token.text);
        if (value) add(page, section, 'source_html', value, value.length);
      }
    }
  };
  scan(marked.lexer(source, { gfm: true }));

  const match = source.match(/^```screen\s*\n([\s\S]*?)^```\s*$/m);
  if (!match) return;
  const scene = JSON.parse(match[1]);
  for (const widget of scene.screen ?? []) {
    add(page, '화면 시나리오', 'screen_widget', `${widget.id}: ${widget.type || ''} ${widget.label || ''}`, 0, { screenId: widget.id });
    for (const item of widget.items ?? []) if (item && typeof item === 'object' && item.id)
      add(page, '화면 시나리오', 'screen_item', `${widget.id}/${item.id}: ${item.label || item.text || ''}`, 0, { screenId: item.id });
  }
  for (const flow of scene.flows ?? []) {
    add(page, '화면 시나리오', 'flow', flow.title || flow.id || '요청 흐름');
    for (const [index, step] of (flow.steps ?? []).entries())
      add(page, '화면 시나리오', 'flow_step', `${flow.title || flow.id || '흐름'} ${index + 1}: ${step.label || step.text || step.description || step.kind || ''}`);
  }
}

function collectHtml(page, html) {
  let depth = 0;
  let maxDepth = 0;
  for (const tag of html.matchAll(/<\/?details\b[^>]*>/g)) {
    depth += tag[0].startsWith('</') ? -1 : 1;
    maxDepth = Math.max(maxDepth, depth);
  }
  for (const match of html.matchAll(/<details\b([^>]*)>/g)) {
    const start = match.index + match[0].length;
    const excerpt = html.slice(start, start + 900);
    const summary = excerpt.match(/^\s*<summary\b[^>]*>([\s\S]*?)<\/summary>/);
    const className = match[1].match(/\bclass="([^"]+)"/)?.[1] || 'unclassified';
    add(page, '생성 화면', `toggle:${className.split(' ')[0]}`, summary ? clean(summary[1]) : 'summary 구조 확인 필요', 0,
      { className, hasSummary: Boolean(summary) });
  }
  const attr = (attributes, name) => attributes.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1]
    ?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'") ?? '';
  const reader = html.match(/<div\b([^>]*\bdata-knowledge-reader\b[^>]*)>/);
  if (reader) {
    add(page, '개념 읽기', 'reader_shell', `${page.replace(/^docs\/knowledge\//, '').replace(/\.md$/, '')} 개념 읽기 화면`, 0,
      { className: 'kr-reader', route: page.replace(/\.md$/, '.html') });
    const controlsTag = html.match(/<div\b([^>]*\bclass="kr-controls"[^>]*)>/)?.[1] || '';
    const sceneAvailable = !/\bhidden(?:\s|=|$)/.test(controlsTag);
    for (const match of html.matchAll(/<button\b([^>]*\bdata-kr-mode="([^"]+)"[^>]*)>([\s\S]*?)<\/button>/g)) {
      const [, attributes, mode, label] = match;
      add(page, '개념 읽기', 'reader_mode_button', clean(label), 0,
        { mode, displayCondition: sceneAvailable ? '실제 장면이 있는 문서' : '실제 장면이 있는 문서에서만 표시', controls: attr(attributes, 'aria-controls') });
    }
    for (const match of html.matchAll(/<a\b([^>]*\bdata-kr-toc-link\b[^>]*)>([\s\S]*?)<\/a>/g)) {
      const [, attributes, label] = match;
      const href = attr(attributes, 'href');
      add(page, '개념 읽기 · 원문 목차', 'reader_toc_link', clean(label), 0,
        { href, targetId: href.replace(/^#/, ''), displayCondition: '설명 읽기 모드' });
    }
  }
  for (const match of html.matchAll(/<a\b([^>]*\bclass="[^"]*\bhome-concept-direct\b[^"]*"[^>]*)>([\s\S]*?)<\/a>/g)) {
    add(page, '홈 intro', 'home_concept_direct_link', clean(match[2]), 0,
      { href: attr(match[1], 'href'), route: attr(match[1], 'href') });
  }
  for (const match of html.matchAll(/<a\b([^>]*\bclass="[^"]*\bkc-result-open\b[^"]*"[^>]*)>([\s\S]*?)<\/a>/g)) {
    const [, attributes, label] = match;
    const documentId = attr(attributes, 'data-kc-open');
    const href = attr(attributes, 'href');
    const route = href.split('?')[0];
    add(page, '개념 목록 · 설명 읽기', 'catalog_read_link', `${documentId} ${clean(label)}`, 0,
      { documentId, href, route, query: new URLSearchParams(href.split('?')[1] || '').toString() });
  }
  // 새 시각 교구도 접기 UI와 별도 항목으로 남긴다. 같은 공통 구현이라도 페이지별 검증 상태는 독립적이다.
  const visualClasses = new Set(['jpa-journey', 'jpa-journey-step', 'jpa-journey-panel', 'jpa-journey-outcomes',
    'p20-entity-map', 'p20-field-link', 'p20-runtime', 'p20-stage-button',
    'home-intro', 'home-task', 'home-preview', 'home-roadmap', 'home-method-grid', 'home-explore-grid',
    'home-faq', 'home-environment', 'home-dialog', 'home-concept-thumbnail', 'home-object-stage',
    'home-demo-result', 'home-cursor-preview', 'home-service-section', 'home-service-board',
    'kc-catalog', 'kc-hero', 'kc-context', 'kc-browse', 'kc-empty', 'kc-sequence', 'kc-original-link', 'kc-detail-navigation',
    'p16-json-visual', 'p16-navigation', 'p16-scene', 'p16-pair', 'p16-code-location', 'p16-actions',
    'home-new-visual', 'home-new-stepper', 'home-new-plate', 'home-prepare-shortcut', 'home-return-work', 'home-preparation-steps',
    // 과정 v2(P5-2): 홈 과정 영역·참고 도감, 일자 페이지 배치, 과정 지도
    'course-home', 'ch-today', 'ch-progress', 'ch-entries', 'home-reference',
    'day-head', 'day-today', 'day-java', 'step-facts', 'copy-row', 'day-pager',
    'course-map', 'cm-legend', 'cm-toolbar', 'cm-board', 'cm-detail', 'cm-tables',
    // 과정 v2(P5-3): 일자 [오늘 흐름]·티켓 [장애 흐름] 재생, 2단계 일자의 티켓 흐름 목록
    'flow', 'flow-links',
    // 콘텐츠 종류·파일 카드·관계·비교·절차를 페이지마다 독립적으로 추적한다.
    'content-page-kind', 'visual-files', 'visual-file', 'visual-relations',
    'visual-comparison', 'visual-procedure', 'visual-flow', 'visual-rules']);
  for (const match of html.matchAll(/<(?:section|header|footer|div|nav|button|article|aside|dialog|figure|p|ol|ul)\b([^>]*\bclass="([^"]+)"[^>]*)>/g)) {
    const classes = match[2].split(/\s+/);
    for (const component of classes) {
      if (!visualClasses.has(component)) continue;
      const aria = match[1].match(/\baria-label="([^"]+)"/)?.[1];
      const tail = html.slice(match.index + match[0].length);
      const hint = (match[0].startsWith('<button') ? tail.slice(0, tail.indexOf('</button>')) : tail.slice(0, 240)).replace(/<[^>]*>/g, ' ');
      add(page, '생성 시각 교구', `visual:${component}`, aria || hint, 0, { className: component });
    }
  }
  return maxDepth;
}

function markdownFiles(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) return markdownFiles(relative);
    if (!entry.name.endsWith('.md')) return [];
    const html = relative.replace(/\.md$/, '.html');
    if (!fs.existsSync(path.join(root, html))) throw new Error(`생성 HTML이 없는 원문: ${relative} → ${html}`);
    return [relative];
  });
}

// 과정 v2의 모든 종류를 포함한다. Java·티켓의 새 시각 블록도 개별 항목으로 남긴다.
const courseFiles = ['course/README.md', 'course/map.md', ...['course/spring', 'course/start', 'course/java', 'course/tickets'].flatMap(markdownFiles)];
const sourceFiles = ['README.md', 'errors.md', ...['scenario', 'practice', 'docs/knowledge', 'lessons', 'tickets'].flatMap(markdownFiles), ...courseFiles].sort();
for (const file of sourceFiles) {
  const htmlFile = file.replace(/\.md$/, '.html');
  const before = rows.length;
  collectMarkdown(file, fs.readFileSync(path.join(root, file), 'utf8'));
  const maxToggleDepth = collectHtml(file, fs.readFileSync(path.join(root, htmlFile), 'utf8'));
  for (const [source, kind, lessons] of [
    ['docs/knowledge/P09-java-syntax-basics.md', 'p09_learning_state', P09_LESSONS],
    ['docs/knowledge/P04-constructors-builder.md', 'p04_learning_state', P04_LESSONS],
    ['docs/knowledge/P16-json-jackson-practical.md', 'p16_contract_state', P16_CONTRACT_LESSONS],
    ['docs/knowledge/W09-why-dto.md', 'w09_learning_state', W09_LESSONS],
    ['docs/knowledge/P19-mysql-jpa-setup.md', 'p19_learning_state', P19_LESSONS],
    ['docs/knowledge/P20-jpa-entity-mapping.md', 'p20_learning_state', P20_LESSONS],
    ['docs/knowledge/S09-jpa-hibernate.md', 's09_learning_state', S09_LESSONS],
    ['docs/knowledge/S08-transactions.md', 's08_learning_state', S08_LESSONS],
    ['docs/knowledge/W11-why-tx-in-service.md', 'w11_learning_state', W11_LESSONS],
    ['docs/knowledge/R03-schema-types-constraints.md', 'r03_learning_state', R03_LESSONS],
    ['docs/knowledge/R04-sql-crud-join.md', 'r04_learning_state', R04_LESSONS],
    ['docs/knowledge/W15-paging-offset-vs-cursor.md', 'w15_learning_state', W15_LESSONS],
    ['docs/knowledge/V04-test-db-strategy.md', 'v04_learning_state', V04_LESSONS],
    ['docs/knowledge/B01-account-lifecycle.md', 'b01_learning_state', B01_LESSONS],
    ['docs/knowledge/D01-dev-lifecycle-overview.md', 'd01_learning_state', D01_LESSONS],
    ['docs/knowledge/D02-server-network-basics.md', 'd02_learning_state', D02_LESSONS],
    ['docs/knowledge/D03-rest-api-dev-process.md', 'd03_learning_state', D03_LESSONS],
    ['docs/knowledge/D04-build-pipeline-explained.md', 'd04_learning_state', D04_LESSONS],
    ['docs/knowledge/D05-debugging-methodology.md', 'd05_learning_state', D05_LESSONS],
    ['docs/knowledge/D06-deployment-concepts.md', 'd06_learning_state', D06_LESSONS],
    ['docs/knowledge/D07-onprem-vs-cloud.md', 'd07_learning_state', D07_LESSONS],
    ['docs/knowledge/D08-cicd-collaboration.md', 'd08_learning_state', D08_LESSONS],
    ['docs/knowledge/D09-operations-observability.md', 'd09_learning_state', D09_LESSONS],
    ['docs/knowledge/D10-database-basics.md', 'd10_learning_state', D10_LESSONS],
    ['docs/knowledge/D11-web-security-basics.md', 'd11_learning_state', D11_LESSONS],
    ['docs/knowledge/D12-linux-terminal-basics.md', 'd12_learning_state', D12_LESSONS],
  ]) if (file === source) {
    for (const lesson of lessons) for (const stage of lesson.stages) {
      add(file, lesson.question, kind, stage.title, stage.lead.length,
        { topicId: lesson.id, stageId: stage.id, imageId: stage.image });
    }
  }
  const units = rows.slice(before);
  pages.push({ source: file, html: htmlFile, units: units.length, longProse: units.filter((unit) => unit.kind === 'prose' && unit.chars >= 280).length,
    toggles: units.filter((unit) => unit.kind.startsWith('toggle:')).length, maxToggleDepth,
    status: units.every((unit) => unit.status === 'verified') ? 'verified'
      : units.every((unit) => unit.status === 'unreviewed') ? 'unreviewed' : 'in_progress' });
}
writeRows(rows);
const byKind = Object.fromEntries([...new Set(rows.map((row) => row.kind))].sort().map((kind) => [kind, rows.filter((row) => row.kind === kind).length]));
const byStatus = Object.fromEntries(states.map((status) => [status, rows.filter((row) => row.status === status).length]));
const summary = { generatedDate: now, sourcePages: pages.length, units: rows.length, byStatus, longProse: pages.reduce((sum, page) => sum + page.longProse, 0), byKind, pages };
fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
writePageChecklist(summary);
console.log(JSON.stringify({ sourcePages: summary.sourcePages, units: summary.units, byStatus, longProse: summary.longProse,
  toggles: pages.reduce((sum, page) => sum + page.toggles, 0) }, null, 2));
