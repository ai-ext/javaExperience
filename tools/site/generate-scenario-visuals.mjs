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
const plain = (value) => typeof value === 'string' ? value : Array.isArray(value) ? value.join(' · ')
  : value && typeof value === 'object' ? String(value.label ?? value.title ?? value.value ?? value.name ?? '') : String(value ?? '');
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

function widget(item, index, accent, tint) {
  const y = 150 + index * 52;
  const type = item.type || 'text';
  const label = truncate(item.label || item.title || type, 20);
  const value = truncate(item.value ?? item.right ?? item.text ?? item.items ?? '', 34);
  if (type === 'bar') return `${rect(48, y, 424, 39, '#eaf1f7', 8)}${text(62, y + 25, label, 14, 700)}${text(358, y + 25, truncate(item.right || '', 10), 11, 600, '#617387')}`;
  if (type === 'actions') return `${rect(48, y, 424, 42, '#f5f8fb', 8)}${rect(60, y + 7, 130, 28, accent, 7)}${text(77, y + 26, truncate(value || label, 11), 12, 700, '#fff')}${rect(205, y + 7, 116, 28, tint, 7)}${text(216, y + 26, '다음 단계', 12, 650, accent)}`;
  if (type === 'field' || type === 'select') return `${rect(48, y, 424, 42, '#fff', 8, '#d9e3ec')}${text(60, y + 15, label, 10, 650, '#5b6b7f')}${text(60, y + 32, value || '입력값', 12, 600)}${type === 'select' ? text(448, y + 29, '⌄', 18, 700, accent) : ''}`;
  if (type === 'stats') return `${rect(48, y, 424, 42, tint, 8)}${text(61, y + 19, label, 11, 650, accent)}${text(61, y + 35, value, 13, 750)}`;
  if (type === 'chips') return `${rect(48, y, 424, 42, '#f5f8fb', 8)}${rect(60, y + 8, 84, 26, tint, 13)}${text(71, y + 26, truncate(value || label, 10), 11, 700, accent)}${rect(153, y + 8, 73, 26, '#e7edf4', 13)}${text(163, y + 26, '태그', 11, 650)}`;
  if (type === 'code') return `${rect(48, y, 424, 42, '#17263a', 8)}${text(60, y + 26, truncate(value || label, 40), 11, 550, '#d9f7f0')}`;
  if (type === 'toast') return `${rect(48, y, 424, 42, tint, 8)}${rect(48, y, 4, 42, accent, 2)}${text(61, y + 26, value || label, 12, 650)}`;
  return `${rect(48, y, 424, 42, '#f5f8fb', 8)}${rect(59, y + 12, 18, 18, tint, 6)}${text(86, y + 18, label, 11, 700)}${text(86, y + 34, value, 11, 500, '#5b6b7f')}`;
}

function render(level, chapter, scene) {
  const [accent, tint] = palettes[Number(chapter.id.replace(/\D/g, '')) % palettes.length];
  const request = scene.flows?.flatMap((flow) => flow.steps || []).find((step) => step.kind === 'request');
  const hasDb = scene.flows?.some((flow) => (flow.steps || []).some((step) => step.kind === 'db'));
  const title = truncate(scene.title || level.title, 31);
  const subtitle = truncate(scene.summary || level.title, 54);
  const widgets = (scene.screen || []).filter(Boolean).slice(0, 4).map((item, index) => widget(item, index, accent, tint)).join('');
  const pathText = request ? `${request.method || 'HTTP'} ${truncate(request.path || '', 24)}` : '시나리오 흐름';
  const nodes = hasDb ? ['요청', 'Spring', 'MySQL', '응답'] : ['요청', 'Spring', '응답'];
  const pipeline = nodes.map((node, index) => {
    const y = 180 + index * 53;
    return `${rect(505, y, 168, 38, index === 1 ? tint : '#f5f8fb', 8, index === 1 ? accent : '#e2e8ef')}${rect(515, y + 12, 14, 14, index === 1 ? accent : '#8ea3b8', 7)}${text(540, y + 25, node, 12, 700)}${index < nodes.length - 1 ? `<path d="M589 ${y + 38}v13" stroke="${accent}" stroke-width="2" stroke-linecap="round"/><path d="m585 ${y + 47} 4 4 4-4" fill="none" stroke="${accent}" stroke-width="2"/>` : ''}`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 420" role="img" aria-labelledby="title desc">
  <title id="title">${esc(level.id)} ${esc(level.title)} 화면 시안</title><desc id="desc">${esc(scene.summary || '')}</desc>
  <defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="${tint}"/><stop offset="1" stop-color="#f4f7fb"/></linearGradient></defs>
  ${rect(0, 0, 720, 420, 'url(#bg)', 0)}${rect(20, 20, 680, 380, '#fff', 20, '#c8d5e3')}
  ${rect(20, 20, 680, 47, '#15263b', 20)}${rect(20, 47, 680, 20, '#15263b', 0)}
  <circle cx="43" cy="43" r="5" fill="#f47c78"/><circle cx="59" cy="43" r="5" fill="#f5cb68"/><circle cx="75" cy="43" r="5" fill="#66cf9c"/>
  ${text(95, 48, `javaExperience · ${level.id}`, 12, 750, '#fff')}
  ${text(48, 101, title, 21, 800)}${text(48, 123, subtitle, 11, 500, '#617387')}
  ${rect(505, 96, 168, 55, tint, 10)}${text(516, 115, 'API 요청', 10, 700, accent)}${text(516, 137, truncate(pathText, 25), 12, 800)}
  ${widgets}${text(505, 170, '데이터 흐름', 11, 750, '#566a7f')}${pipeline}
  ${rect(48, 371, 424, 2, tint, 1)}${text(49, 389, `SCENARIO ${level.id} · ${chapter.title.split(' — ')[0]}`, 10, 750, accent)}
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
