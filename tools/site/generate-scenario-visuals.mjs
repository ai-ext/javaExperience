// 101개 screen 시나리오를 읽어 단계별 탐색용 SVG 시안을 생성한다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'scenario/scenario.json'), 'utf8'));
const output = path.join(root, 'scenario/visuals');
fs.mkdirSync(output, { recursive: true });
const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const plain = (value) => typeof value === 'string' ? value : Array.isArray(value) ? value.map(plain).filter(Boolean).join(' · ')
  : value && typeof value === 'object' ? plain(value.label ?? value.title ?? value.value ?? value.name ?? value.text ?? '') : String(value ?? '');
const truncate = (value, size) => {
  const chars = [...plain(value).replace(/\s+/g, ' ').trim()];
  return chars.length > size ? chars.slice(0, size - 1).join('') + '…' : chars.join('');
};
const palettes = [
  ['#0f766e', '#ccfbf1'], ['#2563eb', '#dbeafe'], ['#7c3aed', '#ede9fe'], ['#b45309', '#fef3c7'],
  ['#be123c', '#ffe4e6'], ['#0891b2', '#cffafe'], ['#4f46e5', '#e0e7ff'], ['#0f766e', '#d1fae5'],
];
const text = (x, y, value, size = 15, weight = 600, color = '#15263b') =>
  `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-weight="${weight}" font-family="Pretendard,Apple SD Gothic Neo,Noto Sans KR,sans-serif">${esc(value)}</text>`;
const rect = (x, y, w, h, fill, rx = 10, stroke = 'none') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}"/>`;

function widget(item, y, accent, tint) {
  const type = item.type || 'text';
  const label = truncate(item.label || item.title || item.id || '', 24);
  const value = truncate(item.value ?? item.right ?? item.text ?? '', 34);
  const entries = Array.isArray(item.items) ? item.items : [];
  const heading = label ? `${text(58, y + 14, label, 10, 700, '#617387')}` : '';
  if (type === 'bar') return { height: 42, markup: `${rect(48, y, 424, 39, '#eaf1f7', 8)}${text(62, y + 25, label, 14, 700)}${item.right ? text(358, y + 25, truncate(item.right, 14), 11, 600, '#617387') : ''}` };
  if (type === 'actions') {
    const actions = entries.slice(0, 4);
    const cols = Math.min(4, actions.length || 1);
    const cellW = 400 / cols;
    const rows = Math.ceil(actions.length / cols);
    const height = Math.max(42, rows * 38 + 8 + (label ? 16 : 0));
    const markup = `${rect(48, y, 424, height, '#f5f8fb', 8)}${heading}${actions.map((action, i) => {
      const col = i % cols; const row = Math.floor(i / cols);
      const x = 58 + col * cellW; const by = y + (label ? 20 : 6) + row * 38;
      const variant = action?.variant;
      const primary = variant === 'primary';
      const fill = primary ? accent : (variant === 'danger' ? '#ffe4e6' : tint);
      const color = primary ? '#fff' : (variant === 'danger' ? '#be123c' : accent);
      return `${rect(x, by, cellW - 8, 28, fill, 7)}${text(x + 6, by + 19, truncate(action?.label ?? action?.value ?? action, Math.max(8, Math.floor((cellW - 18) / 8))), 10, 700, color)}`;
    }).join('')}`;
    return { height, markup };
  }
  if (type === 'field' || type === 'select') return { height: 52, markup: `${rect(48, y, 424, 48, '#fff', 8, '#d9e3ec')}${label ? text(60, y + 17, label, 10, 650, '#5b6b7f') : ''}${value ? text(60, y + 36, value, 12, 600) : ''}${type === 'select' ? text(448, y + 32, '⌄', 18, 700, accent) : ''}` };
  if (type === 'stats') {
    const stats = entries.slice(0, 6);
    const cols = Math.min(3, stats.length || 1); const rows = Math.ceil(stats.length / cols);
    const cardH = 42; const gap = 6; const height = Math.max(42, rows * cardH + (rows - 1) * gap + (label ? 16 : 0));
    const markup = `${heading}${stats.map((stat, i) => {
      const col = i % cols; const row = Math.floor(i / cols); const cellW = 424 / cols;
      const x = 48 + col * cellW; const sy = y + (label ? 18 : 0) + row * (cardH + gap);
      const statLabel = truncate(stat?.label ?? stat?.title ?? stat?.id ?? '', Math.floor(cellW / 8));
      const statValue = truncate(stat?.value ?? stat?.right ?? '', Math.floor(cellW / 7));
      return `${rect(x, sy, cellW - 6, cardH, tint, 8)}${statLabel ? text(x + 10, sy + 16, statLabel, 10, 650, accent) : ''}${statValue ? text(x + 10, sy + 34, statValue, 12, 750) : ''}`;
    }).join('')}`;
    return { height, markup };
  }
  if (type === 'chips') {
    const chips = entries.slice(0, 6);
    const cols = Math.min(3, chips.length || 1); const rows = Math.ceil(chips.length / cols);
    const chipH = 26; const rowGap = 6; const height = Math.max(42, rows * chipH + (rows - 1) * rowGap + (label ? 28 : 16));
    const markup = `${rect(48, y, 424, height, '#f5f8fb', 8)}${heading}${chips.map((chip, i) => {
      const col = i % cols; const row = Math.floor(i / cols); const cellW = 400 / cols;
      const x = 58 + col * cellW; const cy = y + (label ? 20 : 8) + row * (chipH + rowGap);
      const chipText = truncate(chip?.label ?? chip?.value ?? chip?.title ?? chip, Math.max(8, Math.floor((cellW - 20) / 8)));
      return `${rect(x, cy, cellW - 8, chipH, tint, 13)}${text(x + 8, cy + 18, chipText, 10, 700, accent)}`;
    }).join('')}`;
    return { height, markup };
  }
  if (type === 'list') {
    const rows = entries.slice(0, 6); const rowH = 36; const footer = truncate(item.footer ?? '', 42);
    const height = Math.max(42, (label ? 18 : 6) + rows.length * rowH + 6 + (footer ? 18 : 0));
    const markup = `${rect(48, y, 424, height, '#f5f8fb', 8)}${label ? text(59, y + 14, label, 10, 700, '#617387') : ''}${rows.map((entry, i) => {
      const ry = y + (label ? 19 : 6) + i * rowH;
      const title = truncate(entry?.title ?? entry?.label ?? entry?.id ?? entry, 31);
      const meta = truncate(entry?.meta ?? '', 30);
      const badge = truncate(entry?.badge ?? '', 10);
      return `${i ? `<path d="M58 ${ry}h404" stroke="#e2e8ef"/>` : ''}${title ? text(60, ry + 14, title, 10, 700) : ''}${meta ? text(60, ry + 29, meta, 9, 500, '#617387') : ''}${badge ? text(389, ry + 16, badge, 8, 700, accent) : ''}`;
    }).join('')}${footer ? text(60, y + height - 6, footer, 9, 600, '#617387') : ''}`;
    return { height, markup };
  }
  if (type === 'code') return { height: 42, markup: `${rect(48, y, 424, 42, '#17263a', 8)}${text(60, y + 26, value || label, 11, 550, '#d9f7f0')}` };
  if (type === 'toast') return { height: 42, markup: `${rect(48, y, 424, 42, tint, 8)}${rect(48, y, 4, 42, accent, 2)}${text(61, y + 26, value || label, 12, 650)}` };
  return { height: 42, markup: `${rect(48, y, 424, 42, '#f5f8fb', 8)}${label ? text(60, y + 18, label, 11, 700) : ''}${value ? text(60, y + 34, value, 11, 500, '#5b6b7f') : ''}` };
}

function render(level, chapter, scene) {
  const [accent, tint] = palettes[Number(chapter.id.replace(/\D/g, '')) % palettes.length];
  const request = scene.flows?.flatMap((flow) => flow.steps || []).find((step) => step.kind === 'request');
  const title = truncate(scene.title || level.title, 31);
  const subtitle = truncate(scene.summary || level.title, 54);
  const screenItems = (scene.screen || []).filter(Boolean);
  let widgetY = 150;
  const widgetMarkup = screenItems.map((item) => {
    const rendered = widget(item, widgetY, accent, tint);
    widgetY += rendered.height + 10;
    return rendered.markup;
  }).join('');
  const pathText = request ? `${request.method || 'HTTP'} ${truncate(request.path || '', 24)}` : '시나리오 흐름';
  const stepLabel = (step) => {
    if (step.kind === 'request') return `${step.method || 'HTTP'} 요청`;
    if (step.kind === 'response') return `${step.status || ''} 응답`;
    if (step.kind === 'db') return 'MySQL · SQL';
    if (step.kind === 'user') return '사용자 행동';
    if (step.kind === 'screen') return '화면 반영';
    const value = `${step.text || ''} ${step.class || ''}`;
    if (/controller|컨트롤러/i.test(value)) return 'Controller';
    if (/dto|record/i.test(value)) return 'DTO · JSON';
    if (/service|서비스/i.test(value)) return 'Service';
    if (/repository|리포지토리/i.test(value)) return 'Repository';
    if (/mybatis|mapper|매퍼/i.test(value)) return 'MyBatis · Mapper';
    if (/jpa|hibernate/i.test(value)) return 'JPA · Hibernate';
    return truncate(step.text || '서버 처리', 17);
  };
  const nodes = (scene.flows?.[0]?.steps || []).map(stepLabel);
  const pipeline = nodes.map((node, index) => {
    const y = 180 + index * 53;
    return `${rect(505, y, 168, 38, index === 1 ? tint : '#f5f8fb', 8, index === 1 ? accent : '#e2e8ef')}${rect(515, y + 12, 14, 14, index === 1 ? accent : '#8ea3b8', 7)}${text(540, y + 25, truncate(node, 18), 12, 700)}${index < nodes.length - 1 ? `<path d="M589 ${y + 38}v13" stroke="${accent}" stroke-width="2" stroke-linecap="round"/><path d="m585 ${y + 47} 4 4 4-4" fill="none" stroke="${accent}" stroke-width="2"/>` : ''}`;
  }).join('');
  const height = Math.max(420, widgetY + 48, 180 + nodes.length * 53 + 65);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${esc(level.id)} ${esc(level.title)} 화면 시안</title><desc id="desc">${esc(scene.summary || '')}</desc>
  <defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="${tint}"/><stop offset="1" stop-color="#f4f7fb"/></linearGradient></defs>
  ${rect(0, 0, 720, height, 'url(#bg)', 0)}${rect(20, 20, 680, height - 40, '#fff', 20, '#c8d5e3')}
  ${rect(20, 20, 680, 47, '#15263b', 20)}${rect(20, 47, 680, 20, '#15263b', 0)}
  <circle cx="43" cy="43" r="5" fill="#f47c78"/><circle cx="59" cy="43" r="5" fill="#f5cb68"/><circle cx="75" cy="43" r="5" fill="#66cf9c"/>
  ${text(95, 48, `javaExperience · ${level.id}`, 12, 750, '#fff')}
  ${text(48, 101, title, 21, 800)}${text(48, 123, subtitle, 11, 500, '#617387')}
  ${rect(505, 96, 168, 55, tint, 10)}${text(516, 115, 'API 요청', 10, 700, accent)}${text(516, 137, truncate(pathText, 25), 12, 800)}
  ${widgetMarkup}${text(505, 170, '데이터 흐름', 11, 750, '#566a7f')}${pipeline}
  ${rect(48, height - 49, 424, 2, tint, 1)}${text(49, height - 30, `SCENARIO ${level.id} · ${chapter.title.split(' — ')[0]}`, 10, 750, accent)}
  </svg>\n`;
}

let count = 0;
for (const chapter of manifest.chapters) for (const level of chapter.levels) {
  if (!level.file) continue;
  const source = fs.readFileSync(path.join(root, 'scenario', chapter.dir, level.file), 'utf8');
  const match = source.match(/^```screen\s*\n([\s\S]*?)^```\s*$/m);
  if (!match) throw new Error(`${level.id} screen 시나리오가 없다`);
  const scene = JSON.parse(match[1]);
  fs.writeFileSync(path.join(output, `${level.id}.svg`), render(level, chapter, scene));
  count++;
}
if (count !== 101) throw new Error(`시안 개수 불일치: ${count}`);
console.log(`시나리오 SVG 시안 ${count}개 생성`);
