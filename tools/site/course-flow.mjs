// 흐름 재생 렌더러 — 일자 페이지의 [오늘 흐름](course/flows/days.json)과 티켓 페이지의 [장애 흐름](course/flows/tickets.json).
// 정지 상태에서도 모든 단계와 값이 읽히도록 단계 목록을 HTML로 다 그리고, 재생 조작(course-flow.js)은 그 위에 얹기만 한다.
// 티켓의 원인 쪽 단계(side=cause)는 "원인과 정답"과 같은 수준으로 접기 안에만 그린다. 지도·제목·aria 어디에도 원인 문장을 두지 않는다.
// 노드 아이콘은 미리캔버스 템플릿(정보 시스템 개발 제안서)의 선 아이콘·타일 톤을 참고해 직접 그린 인라인 SVG다(docs/design/COURSE-V2-MIRICANVAS-2026-10-23.md).
import fs from 'node:fs';
import path from 'node:path';

const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = (markdown) => esc(markdown).replace(/`([^`]+)`/g, '<code>$1</code>');
const TAGS = new Set(['예시', '코드', '대표']);
const SIDES = new Set(['open', 'cause']);

// 24×24 선 아이콘. stroke는 currentColor라 라이트·다크에서 글자색을 따른다.
const ICON_PATHS = {
  user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c1.2-4 4-6 7.5-6s6.3 2 7.5 6"/>',
  filter: '<path d="M4 5h16l-6.2 7.2V18l-3.6 2v-7.8z"/>',
  shield: '<path d="M12 3.2 19 6v5.4c0 4.4-2.9 7.7-7 9.4-4.1-1.7-7-5-7-9.4V6z"/><path d="m9 12 2.2 2.2L15.2 10"/>',
  globe: '<circle cx="12" cy="12" r="8.2"/><path d="M3.8 12h16.4M12 3.8c2.4 2.3 3.6 5 3.6 8.2s-1.2 5.9-3.6 8.2c-2.4-2.3-3.6-5-3.6-8.2s1.2-5.9 3.6-8.2z"/>',
  key: '<circle cx="8" cy="12" r="3.6"/><path d="M11.6 12H20M17 12v3M20 12v2.4"/>',
  route: '<path d="M12 3v18"/><path d="M6 5.5h10.5L19 8l-2.5 2.5H6z"/><path d="M18 13H7.5L5 15.5 7.5 18H18z"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3.5v2.6M12 17.9v2.6M3.5 12h2.6M17.9 12h2.6M6 6l1.8 1.8M16.2 16.2 18 18M6 18l1.8-1.8M16.2 7.8 18 6"/>',
  coins: '<ellipse cx="9" cy="7" rx="5" ry="2.4"/><path d="M4 7v4c0 1.3 2.2 2.4 5 2.4s5-1.1 5-2.4V7"/><ellipse cx="15" cy="14" rx="5" ry="2.4"/><path d="M10 14v3.6c0 1.3 2.2 2.4 5 2.4s5-1.1 5-2.4V14"/>',
  layers: '<path d="m12 4 8 4-8 4-8-4z"/><path d="m4 12 8 4 8-4"/><path d="m4 16 8 4 8-4"/>',
  stack: '<rect x="4.5" y="4" width="15" height="4.4" rx="1.2"/><rect x="4.5" y="9.8" width="15" height="4.4" rx="1.2"/><rect x="4.5" y="15.6" width="15" height="4.4" rx="1.2"/>',
  brackets: '<path d="M8.5 7 4 12l4.5 5M15.5 7 20 12l-4.5 5M13.6 5l-3.2 14"/>',
  db: '<ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6"/><path d="M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/>',
  bolt: '<path d="M13.2 3 5.5 13.2h5.6L10.2 21l8.3-10.4h-5.7z"/>',
  card: '<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M3.5 10h17M7 14.5h4"/>',
  bell: '<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z"/><path d="M10.2 20.2a2 2 0 0 0 3.6 0"/>',
  power: '<path d="M12 3.5V11"/><path d="M7.2 6.6a7 7 0 1 0 9.6 0"/>',
  sliders: '<path d="M5 6h14M5 12h14M5 18h14"/><circle cx="9" cy="6" r="1.8"/><circle cx="15" cy="12" r="1.8"/><circle cx="8" cy="18" r="1.8"/>',
  box: '<path d="m12 3.5 7.5 4v9L12 20.5l-7.5-4v-9z"/><path d="m4.5 7.5 7.5 4 7.5-4M12 11.5v9"/>',
  alert: '<path d="M12 4 21 19.5H3z"/><path d="M12 10v4.4M12 17.2v.1"/>',
  pulse: '<path d="M3 12h4l2-5 4 10 2.4-5H21"/>',
  pool: '<rect x="4" y="5" width="4.4" height="4.4" rx=".8"/><rect x="9.8" y="5" width="4.4" height="4.4" rx=".8"/><rect x="15.6" y="5" width="4.4" height="4.4" rx=".8"/><rect x="4" y="14.6" width="4.4" height="4.4" rx=".8"/><rect x="9.8" y="14.6" width="4.4" height="4.4" rx=".8"/><rect x="15.6" y="14.6" width="4.4" height="4.4" rx=".8"/>',
  doc: '<path d="M6.5 3.5h8l3 3v14h-11z"/><path d="M9 10h6M9 13.5h6M9 17h4"/>',
  window: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.8"/><path d="M3.5 8.5h17M6.5 6.5h.1M9 6.5h.1"/>',
  thread: '<path d="M4 6h10M4 12h16M4 18h7"/><path d="m16 4 3 2-3 2M14 16l3 2-3 2"/>',
  clock: '<circle cx="12" cy="12" r="8.2"/><path d="M12 7.5V12l3 2"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5M8 12.5v-2M10.5 12.5V8.5M13 12.5v-3"/>',
};
export const FLOW_ICONS = Object.keys(ICON_PATHS);
const icon = (name) => `<svg class="flow-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICON_PATHS[name]}</svg>`;

// ---------------------------------------------------------------- 데이터
function resolveNodes(flow, catalog, where) {
  return flow.nodes.map((n) => {
    const base = catalog[n.id];
    if (!base) throw new Error(`${where}: 노드 ${n.id}가 catalog에 없다`);
    const iconName = n.icon || base.icon;
    if (!ICON_PATHS[iconName]) throw new Error(`${where}: 아이콘 ${iconName}가 없다`);
    return { id: n.id, label: n.label || base.label, sub: n.sub || '', icon: iconName, isNew: Boolean(n.new) };
  });
}

function checkSteps(flow, nodes, where) {
  const ids = new Set(nodes.map((n) => n.id));
  if (ids.size !== nodes.length) throw new Error(`${where}: 노드 id가 겹친다`);
  if (flow.steps.length < 3) throw new Error(`${where}: 단계가 3개보다 적다`);
  for (const [i, s] of flow.steps.entries()) {
    const at = `${where} 단계 ${i + 1}`;
    if (!ids.has(s.node)) throw new Error(`${at}: 지도에 없는 노드 ${s.node}`);
    if (!s.title || !Array.isArray(s.values)) throw new Error(`${at}: 제목·값이 없다`);
    for (const v of s.values) {
      if (!Array.isArray(v) || v.length < 2 || !v[0] || !v[1]) throw new Error(`${at}: 값은 [이름, 값, 꼬리표?]`);
      if (v[2] && !TAGS.has(v[2])) throw new Error(`${at}: 모르는 값 꼬리표 ${v[2]}`);
    }
  }
}

export function loadFlows(root, course) {
  const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
  const days = new Map();
  const tickets = new Map();
  const dayData = read('course/flows/days.json');
  for (const f of dayData.days) {
    const day = course.days.find((d) => d.id === f.day);
    if (!day) throw new Error(`flows/days.json: roadmap에 없는 날 ${f.day}`);
    if (day.phase !== 'build') throw new Error(`flows/days.json: ${f.day}는 1단계 날이 아니다(2단계는 티켓 흐름으로 잇는다)`);
    if (days.has(f.day)) throw new Error(`flows/days.json: ${f.day}가 두 번 있다`);
    const nodes = resolveNodes(f, dayData.catalog, f.day);
    checkSteps(f, nodes, f.day);
    days.set(f.day, { ...f, kind: 'day', id: f.day, nodes });
  }
  const ticketData = read('course/flows/tickets.json');
  const known = new Set(course.tickets.map((t) => t.id));
  for (const f of ticketData.tickets) {
    if (!known.has(f.ticket)) throw new Error(`flows/tickets.json: map-tickets.json에 없는 티켓 ${f.ticket}`);
    if (tickets.has(f.ticket)) throw new Error(`flows/tickets.json: ${f.ticket}가 두 번 있다`);
    const nodes = resolveNodes(f, ticketData.catalog, f.ticket);
    checkSteps(f, nodes, f.ticket);
    for (const s of f.steps) if (!SIDES.has(s.side)) throw new Error(`${f.ticket}: side는 open 또는 cause`);
    const open = f.steps.filter((s) => s.side === 'open');
    if (open.length < 2) throw new Error(`${f.ticket}: 접기 밖에서 읽히는 증상 단계가 2개보다 적다`);
    if (!f.steps.some((s) => s.side === 'cause')) throw new Error(`${f.ticket}: 원인 단계가 없다`);
    tickets.set(f.ticket, { ...f, kind: 'ticket', id: f.ticket, nodes });
  }
  for (const p of ticketData.pending || []) if (!known.has(p.ticket)) throw new Error(`flows/tickets.json pending: 모르는 티켓 ${p.ticket}`);
  return { days, tickets, pending: ticketData.pending || [] };
}

// ---------------------------------------------------------------- 마크업
function nodeMap(flow, prefix) {
  const items = flow.nodes.map((n, i) => `<li class="flow-node${n.isNew ? ' is-new' : ''}" data-node="${esc(n.id)}" data-index="${i}">`
    + `<span class="flow-tile">${icon(n.icon)}</span><span class="flow-node-text"><b>${esc(n.label)}</b>${n.sub ? `<small>${inline(n.sub)}</small>` : ''}</span>`
    + `${n.isNew ? '<em class="flow-new">오늘 만듦</em>' : ''}</li>`).join('');
  return `<ol class="flow-nodes" aria-label="${esc(prefix)} 지도: ${esc(flow.nodes.map((n) => n.label).join(' → '))}">${items}</ol>`;
}

function stepItem(flow, step, order, label, idBase) {
  const node = flow.nodes.find((n) => n.id === step.node);
  const values = step.values.map(([k, v, tag]) => `<div><dt>${inline(k)}</dt><dd>${inline(v)}${tag ? ` <span class="flow-tag tag-${tag === '예시' ? 'example' : tag === '코드' ? 'code' : 'repr'}">${tag}</span>` : ''}</dd></div>`).join('');
  return `<li class="flow-step${step.new ? ' is-new' : ''}${step.side === 'cause' ? ' is-cause' : ''}" id="${idBase}-${order}" data-order="${order}" data-node="${esc(step.node)}">`
    + `<p class="flow-step-head"><span class="flow-step-no">${esc(label)}</span><span class="flow-step-node">${esc(node.label)}</span>${step.when ? `<span class="flow-when">${esc(step.when)}</span>` : ''}${step.new ? '<span class="flow-new">오늘 만듦</span>' : ''}</p>`
    + `<p class="flow-step-title">${inline(step.title)}</p>`
    + `<dl class="flow-values">${values}</dl>`
    + `${step.note ? `<p class="flow-step-note">${inline(step.note)}</p>` : ''}</li>`;
}

const LEGEND = '<p class="flow-legend"><span><span class="flow-new">오늘 만듦</span> 그날 새로 만드는 층</span><span><span class="flow-tag tag-code">코드</span> 정답 코드·설정에 있는 값</span><span><span class="flow-tag tag-example">예시</span> 설명용으로 고른 값</span><span><span class="flow-tag tag-repr">대표</span> 같은 뜻으로 줄여 쓴 SQL·동작</span></p>';

function player(idBase) {
  return `<div class="flow-player" data-flow-player hidden>
  <div class="flow-controls" role="group" aria-label="흐름 재생 조작">
    <button type="button" class="flow-btn" data-flow-prev aria-controls="${idBase}-now">◀ 이전</button>
    <button type="button" class="flow-btn flow-play" data-flow-play aria-pressed="false" aria-controls="${idBase}-now">▶ 재생</button>
    <button type="button" class="flow-btn" data-flow-next aria-controls="${idBase}-now">다음 ▶</button>
    <span class="flow-speed" role="group" aria-label="재생 속도"><button type="button" class="flow-btn" data-flow-speed="0.5" aria-pressed="false">0.5×</button><button type="button" class="flow-btn" data-flow-speed="1" aria-pressed="true">1×</button><button type="button" class="flow-btn" data-flow-speed="2" aria-pressed="false">2×</button></span>
    <span class="flow-count" data-flow-count aria-hidden="true"></span>
  </div>
  <div class="flow-now" id="${idBase}-now" data-flow-now aria-live="polite" aria-atomic="true"></div>
  <p class="flow-keys">이 영역 안에서 <kbd>←</kbd> <kbd>→</kbd> 이전·다음, <kbd>Home</kbd> <kbd>End</kbd> 처음·끝. 재생은 마지막 단계에서 멈춥니다.</p>
</div>`;
}

export function renderDayFlow(flow) {
  const idBase = `flow-${flow.id.toLowerCase()}`;
  const steps = flow.steps.map((s, i) => stepItem(flow, s, i + 1, String(i + 1), idBase)).join('');
  return `<section class="day-flow flow" data-flow="${esc(flow.id)}" data-flow-kind="day" id="${idBase}" aria-labelledby="${idBase}-title">
  <div class="flow-head"><p class="flow-eyebrow">오늘 흐름 · 요청 하나 따라가기 · <code>${esc(flow.request)}</code></p><h2 id="${idBase}-title">${inline(flow.title)}</h2><p class="flow-summary">${inline(flow.summary)}</p></div>
  ${nodeMap(flow, '오늘 흐름')}
  ${player(idBase)}
  <h3 class="flow-list-title">단계별 값 <small>${flow.steps.length}단계 · 재생하지 않아도 아래에서 모두 읽힙니다</small></h3>
  ${LEGEND}
  <ol class="flow-steps">${steps}</ol>
  ${flow.note ? `<p class="flow-foot">${inline(flow.note)}</p>` : ''}
</section>\n`;
}

export function renderTicketFlow(flow) {
  const idBase = `flow-${flow.id.toLowerCase()}`;
  let openNo = 0;
  let causeNo = 0;
  const open = [];
  const cause = [];
  flow.steps.forEach((s, i) => {
    if (s.side === 'open') open.push(stepItem(flow, s, i + 1, String(++openNo), idBase));
    else cause.push(stepItem(flow, s, i + 1, `원인 ${++causeNo}`, idBase));
  });
  return `<section class="ticket-flow flow" data-flow="${esc(flow.id)}" data-flow-kind="ticket" id="${idBase}" aria-labelledby="${idBase}-title">
  <div class="flow-head"><p class="flow-eyebrow">장애 흐름 · 증상에서 관찰 지점까지</p><h2 id="${idBase}-title">${esc(flow.id)} 장애가 번지는 흐름</h2><p class="flow-summary">밖에서 보이는 증상과 관찰 지점만 먼저 보여 줍니다. 원인 쪽 단계는 직접 진단한 뒤 아래 접기에서 펼쳐 맞춰 보세요. 펼치면 재생에도 원인 단계가 끼어듭니다.</p></div>
  ${nodeMap(flow, '장애 흐름')}
  ${player(idBase)}
  <h3 class="flow-list-title">보이는 증상과 관찰 지점 <small>${open.length}단계</small></h3>
  <ol class="flow-steps">${open.join('')}</ol>
  <details class="flow-cause"><summary>원인 쪽 단계 ${cause.length}개 펼치기 — "원인과 정답"과 같은 수준</summary>
  <p class="flow-cause-note">원인 서술을 먼저 써 본 뒤 펼치세요. 단계 번호는 위 증상 단계와 섞인 실제 순서로 재생됩니다.</p>
  <ol class="flow-steps is-cause">${cause.join('')}</ol></details>
</section>\n`;
}

// D11~D14: 그날 다루는 티켓의 장애 흐름으로 잇는다(증상 제목만, 원인은 티켓 페이지 접기 안).
export function renderDayTicketLinks(day, course, flows, fromRel) {
  const ids = [];
  for (const s of day.steps) for (const t of s.tickets) if (!ids.includes(t)) ids.push(t);
  for (const t of course.tickets) if (t.day === day.id && !ids.includes(t.id)) ids.push(t.id);
  if (!ids.length) return null;
  const rel = (target) => path.posix.relative(path.posix.dirname(fromRel), target);
  const items = ids.map((id) => {
    const t = course.tickets.find((x) => x.id === id);
    const flow = flows.tickets.get(id);
    const md = `course/tickets/${id}.md`;
    const ready = flow && course.exists(md);
    const openSteps = flow ? flow.steps.filter((s) => s.side === 'open').length : 0;
    const body = `<b>${esc(id)}</b><span>${esc(t.title)}</span><small>${ready ? `증상 단계 ${openSteps}개 · 원인 단계는 티켓 페이지에서 펼침` : '티켓 페이지·흐름 준비 중'}</small>`;
    return `<li${ready ? '' : ' class="is-pending"'}>${ready ? `<a href="${esc(rel(`course/tickets/${id}.html`))}#flow-${id.toLowerCase()}">${body}</a>` : body}</li>`;
  }).join('');
  return `<section class="day-flow flow-links" data-flow-links="${esc(day.id)}" aria-labelledby="flow-links-${day.id.toLowerCase()}"><h2 id="flow-links-${day.id.toLowerCase()}">오늘 티켓의 장애 흐름</h2><p>2단계는 요청 하나 대신 장애가 번지는 길을 따라갑니다. 티켓 페이지의 흐름은 증상 쪽만 먼저 보여 주고, 원인 쪽은 접혀 있습니다.</p><ul class="flow-link-list">${items}</ul></section>\n`;
}

// 티켓 페이지: "받은 티켓(요청)" 절 다음, 다음 h2 앞에 넣는다. 자리를 못 찾으면 넣지 않는다(P4가 쓰는 중인 페이지).
export function injectTicketFlow(body, flow) {
  const start = body.search(/<h2 id="받은-(?:티켓|요청)"/);
  if (start < 0) return body;
  const next = body.indexOf('<h2 ', start + 4);
  if (next < 0) return body;
  return body.slice(0, next) + renderTicketFlow(flow) + body.slice(next);
}

