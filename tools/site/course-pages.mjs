// 과정 v2 화면 렌더러 — 일자 페이지(course/spring/Dnn.md) 배치, 홈의 과정 진입 영역, 과정 지도(course/map.md).
// build.mjs가 marked로 만든 HTML을 받아 과정 전용 배치로 바꾼다. 다른 페이지에는 쓰지 않는다.
// 빌드가 주입하는 href는 marked 링크 검사를 거치지 않으므로, 여기서 대상 파일·앵커가 있는지 직접 확인한다.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { loadFlows, renderDayFlow, renderDayTicketLinks } from './course-flow.mjs';

const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const PHASE = { warmup: '선택 · Java 워밍업', build: '1단계 · 빈 프로젝트로 서버 만들기', maintain: '2단계 · 어수선한 서버 넘겨받기', wrap: '마무리 · 설명 세션' };
const PHASE_SHORT = { warmup: '선택', build: '1단계', maintain: '2단계', wrap: '마무리' };
const NUMS = '①②③④⑤⑥⑦⑧⑨⑩';

export const DAY_PAGE = /^course\/spring\/D\d{2}\.md$/;
export const MAP_PAGE = 'course/map.md';

// 백틱 코드 안의 괄호는 지키고, 바깥의 괄호 설명과 ' · ' 뒤 덧붙임을 떼어 칩용 짧은 제목을 만든다.
export function shortTitle(title) {
  const codes = [];
  let text = String(title).replace(/`[^`]*`/g, (code) => `\u0000${codes.push(code) - 1}\u0000`);
  let previous;
  do { previous = text; text = text.replace(/\s*\([^()]*\)/g, ''); } while (text !== previous);
  text = text.split(' · ')[0].trim();
  const restored = text.replace(/\u0000(\d+)\u0000/g, (_, index) => codes[Number(index)]);
  return restored || String(title);
}
const plain = (markdown) => String(markdown).replace(/`/g, '');
const inline = (markdown) => esc(markdown).replace(/`([^`]+)`/g, '<code>$1</code>');

// ---------------------------------------------------------------- 데이터
export function loadCourse(root) {
  const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
  const exists = (p) => fs.existsSync(path.join(root, p));
  const roadmap = JSON.parse(read('course/roadmap.json'));
  const meta = JSON.parse(read('course/map-tickets.json'));
  const h1 = (p) => (exists(p) ? read(p).match(/^# (.+)$/m)?.[1].replace(/[`*]/g, '').trim() : null);
  const java = roadmap.java.map((j) => {
    const title = h1(`course/java/${j.id}.md`);
    return { id: j.id, day: j.day || (j.id === 'J00' ? 'D00' : null), optional: Boolean(j.optional), title: title ? title.replace(/^J\d{2}\.\s*/, '') : plain(j.topic).split(/[:—]/)[0].trim(), page: exists(`course/java/${j.id}.md`) ? `course/java/${j.id}.html` : null };
  });
  const d00 = h1('course/spring/D00.md');
  const days = [
    { id: 'D00', phase: 'warmup', title: d00 ? d00.replace(/^D00\.\s*/, '') : 'Java 워밍업 (선택)', java: 'J00', steps: [], optional: true },
    ...roadmap.days.map((d) => ({ id: d.id, phase: d.phase, title: d.title, java: d.java, tomorrow: d.tomorrow,
      steps: d.steps.map((s) => ({ id: `${d.id}-${s.no}`, no: s.no, title: s.title, short: shortTitle(s.title), tickets: s.tickets || [] })) })),
  ].map((d) => ({ ...d, page: `course/spring/${d.id}.html`, source: `course/spring/${d.id}.md` }));
  for (const d of days) if (!exists(d.source)) throw new Error(`과정 데이터: ${d.source}가 없다`);
  // 티켓 페이지는 원문(md)이 git에 커밋돼 있을 때만 "준비됨"으로 잇는다. 작업 중인 원문(미추적)을 링크하면
  // 그 커밋 스냅샷에는 없는 페이지를 가리키게 된다. git이 없는 환경(압축본)에서는 파일이 있으면 준비됨으로 본다.
  const tracked = (() => {
    try { return new Set(execFileSync('git', ['ls-files', '-z', '--', 'course/tickets'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\0').filter(Boolean)); } catch { return null; }
  })();
  const ticketReady = (p) => exists(p) && (!tracked || tracked.has(p));
  const areaIds = new Set(meta.areas.map((a) => a.id));
  const tickets = meta.tickets.map((t) => {
    for (const a of t.areas) if (!areaIds.has(a)) throw new Error(`map-tickets.json: ${t.id}의 결함 영역 ${a}가 areas에 없다`);
    const pageTitle = ticketReady(`course/tickets/${t.id}.md`) ? h1(`course/tickets/${t.id}.md`) : null;
    const stepTitle = days.flatMap((d) => d.steps).find((s) => s.tickets.includes(t.id) && s.title.startsWith(`${t.id} "`))?.title.match(/^B\d{2} "([^"]+)"/)?.[1];
    const title = pageTitle ? pageTitle.replace(/^[BE]\d{2}\.\s*/, '') : stepTitle || t.title;
    const page = ticketReady(`course/tickets/${t.id}.md`) ? `course/tickets/${t.id}.html` : null;
    return { ...t, title, page };
  });
  // 관계: J→D(같은 날 먼저 연습), D→B(그날 다루는 티켓), B→영역(결함 영역). 방향이 "영향 주는/받는 쪽"을 정한다.
  const edges = [];
  const add = (from, to, kind) => { if (!edges.some((e) => e.from === from && e.to === to)) edges.push({ from, to, kind }); };
  for (const j of java) if (j.day) add(j.id, j.day, 'practice');
  for (const d of days) for (const s of d.steps) for (const t of s.tickets) add(d.id, t, 'ticket');
  for (const t of tickets) if (t.day) add(t.day, t.id, 'ticket');
  for (const t of tickets) for (const a of t.areas) add(t.id, a, 'area');
  const ticketIds = new Set(tickets.map((t) => t.id));
  for (const e of edges) if (e.kind === 'ticket' && !ticketIds.has(e.to)) throw new Error(`roadmap.json의 티켓 ${e.to}가 map-tickets.json에 없다`);
  const course = { days, java, tickets, areas: meta.areas, edges, exists };
  // 흐름 재생 데이터(course/flows/*.json). 일자 페이지 [오늘 흐름]과 티켓 페이지 [장애 흐름]이 쓴다.
  course.flows = loadFlows(root, course);
  return course;
}

const relHref = (fromRel, target) => path.posix.relative(path.posix.dirname(fromRel), target);

// ---------------------------------------------------------------- 일자 페이지
function between(html, startRe, endRe) {
  const start = html.search(startRe);
  if (start < 0) return null;
  const rest = html.slice(start);
  const endMatch = rest.slice(1).search(endRe);
  const end = endMatch < 0 ? html.length : start + 1 + endMatch;
  return { start, end, text: html.slice(start, end) };
}

// 티켓 구분은 일자 페이지 생성기(build-days.mjs)의 ticketKind와 같다: 필수·선택(Security·Redis 후보)·고도화·연습
const ticketKind = (t) => (t.required ? '필수' : t.enhancement ? '고도화' : t.pool ? '선택' : '연습');
// 홈 진도에서 빼는 추가 순서: 티켓 하나를 처리하는 순서(제목이 `Bnn "`로 시작)인데 그 티켓이 모두 선택·연습이다.
// 진도는 모두가 하는 순서(필수 티켓·고도화·훈련·코드 읽기 등)로만 세고, 고른 선택 1건은 채점이 확인한다(P8-4 리뷰 ②).
export function isExtraStep(step, course) {
  if (!/^B\d{2} "/.test(step.title) || !step.tickets.length) return false;
  return step.tickets.every((id) => {
    const ticket = course.tickets.find((t) => t.id === id);
    if (!ticket) throw new Error(`${step.id}: 티켓 ${id}가 map-tickets.json에 없다`);
    return ['선택', '연습'].includes(ticketKind(ticket));
  });
}

function ticketBadge(ticket, fromRel, course) {
  if (!ticket) return '';
  const kind = ticketKind(ticket);
  const inner = `<b>${esc(ticket.id)}</b><span>${kind}</span>`;
  const cls = `ticket-badge${ticket.required ? ' is-required' : ''}`;
  return ticket.page
    ? `<a class="${cls}" href="${esc(relHref(fromRel, ticket.page))}" title="${esc(ticket.title)}">${inner}</a>`
    : `<span class="${cls} is-pending" title="${esc(ticket.title)} · 티켓 페이지 준비 중">${inner}<small>페이지 준비 중</small></span>`;
}

const FACTS = { '만들 파일': 'files', '겪을 것': 'trap', '완료 조건': 'done', '명세': 'spec', '티켓': 'tickets', '원인과 정답': 'answer-link' };
function renderFacts(segment, fromRel, course) {
  const parts = segment.split(/(?=<p><strong>(?:만들 파일|겪을 것|완료 조건|명세|티켓|원인과 정답)<\/strong>)/);
  const lead = parts[0].startsWith('<p><strong>') ? '' : parts.shift();
  const facts = parts.map((part) => {
    const label = part.match(/^<p><strong>([^<]+)<\/strong>/)[1];
    const key = FACTS[label];
    let rest = part.replace(/^<p><strong>[^<]+<\/strong>\s*/, '<p>');
    let note = '';
    const first = rest.match(/^<p>([\s\S]*?)<\/p>/);
    if (first && /^\(.*\)$/.test(first[1].trim())) { note = ` <small>${first[1].trim()}</small>`; rest = rest.slice(first[0].length); }
    rest = rest.replace(/^<p>\s*<\/p>/, '').trim();
    if (key === 'tickets') {
      const ids = [...rest.matchAll(/<code>([BE]\d{2})<\/code>/g)].map((m) => m[1]);
      rest = `<p class="ticket-badges">${ids.map((id) => ticketBadge(course.tickets.find((t) => t.id === id), fromRel, course)).join('')}</p>`;
    }
    return `<div class="step-fact fact-${key}"><p class="fact-label">${label}${note}</p>${rest}</div>`;
  });
  return `${lead}${facts.length ? `<div class="step-facts">${facts.join('')}</div>` : ''}`;
}

function renderStepSection(section, fromRel, course, step) {
  const headEnd = section.indexOf('</h2>') + 5;
  if (headEnd < 5) throw new Error(`${step.id}: 순서 칸 제목이 없다`);
  const bodyEnd = (() => {
    const candidates = ['<details', '<blockquote', '</section>'].map((tag) => section.indexOf(tag, headEnd)).filter((i) => i >= 0);
    return Math.min(...candidates);
  })();
  const facts = renderFacts(section.slice(headEnd, bodyEnd).trim(), fromRel, course);
  const tail = section.slice(bodyEnd).replace(/<\/section>\s*$/, '');
  const done = `<p class="step-done"><label><input type="checkbox" class="step-check" data-step="${esc(step.id)}"> 이 순서를 끝냈다</label></p>`;
  return `${section.slice(0, headEnd)}${facts}${tail}${done}</section>`;
}

function dayPager(day, fromRel, course) {
  const index = course.days.findIndex((d) => d.id === day.id);
  const link = (d, dir) => (d
    ? `<a class="day-pager-${dir}" href="${esc(relHref(fromRel, d.page))}"><small>${dir === 'prev' ? '← 이전 날' : '다음 날 →'}</small><span><b>${d.id}</b> ${esc(d.title)}</span></a>`
    : '<span></span>');
  return `<nav class="day-pager" aria-label="이전·다음 날">${link(course.days[index - 1], 'prev')}<a class="day-pager-list" href="README.html">일자 목록</a>${link(course.days[index + 1], 'next')}</nav>`;
}

export function dayCrumbs(sourceRel, course) {
  const id = path.posix.basename(sourceRel, '.md');
  const day = course.days.find((d) => d.id === id);
  if (!day) return '';
  const index = course.days.indexOf(day);
  const prev = course.days[index - 1];
  const next = course.days[index + 1];
  return `<nav class="course-crumbs" aria-label="현재 위치"><p class="crumbs"><a href="../README.html">과정 v2</a> › <a href="README.html">Spring 일자</a> › ${esc(day.id)}</p><p class="course-crumbs-jump">${prev ? `<a href="${prev.id}.html">← ${prev.id}</a>` : ''}${next ? `<a href="${next.id}.html">${next.id} →</a>` : ''}</p></nav>`;
}

export function renderDayPage(sourceRel, body, course) {
  const id = path.posix.basename(sourceRel, '.md');
  const day = course.days.find((d) => d.id === id);
  if (!day) throw new Error(`${sourceRel}: roadmap에 없는 날`);
  const strict = day.phase === 'build';
  const fail = (what) => { if (strict) throw new Error(`${sourceRel}: ${what}`); };
  let html = body.replace(/<!-- 생성물:[^>]*-->\s*/, '');

  // 1) 제목 + 요약 줄 → 머리
  const head = html.match(/(<h1\b[\s\S]*?<\/h1>)\s*<blockquote>\s*<p>([\s\S]*?)<\/p>\s*<\/blockquote>/);
  if (!head) throw new Error(`${sourceRel}: 제목과 요약 줄이 없다`);
  const chips = head[2].split(' · ').map((part) => {
    const cls = /준비 중/.test(part) ? ' is-pending' : /^(1단계|2단계|마무리|선택)$/.test(part.trim()) ? ` is-phase phase-${day.phase}` : '';
    return `<span class="day-meta-chip${cls}">${part.trim()}</span>`;
  }).join('');
  html = html.replace(head[0], `<header class="day-head">${head[1]}<p class="day-meta">${chips}</p></header>`);

  // 2) 오늘 순서 → 체크 칩 목록. 체크박스와 이동 링크를 형제로 둬 제목을 눌러도 체크가 바뀌지 않게 한다.
  const steps = between(html, /<h2 id="오늘-순서"/, /<h2 /);
  if (steps) {
    const items = [...steps.text.matchAll(/<li data-step="(D\d{2}-\d+)">/g)].map((m) => m[1]);
    const expected = day.steps.map((s) => s.id);
    if (items.join() !== expected.join()) throw new Error(`${sourceRel}: 오늘 순서 ${items.join()} ≠ roadmap ${expected.join()}`);
    const chipList = day.steps.map((s, i) => {
      const anchor = `step-${s.id.toLowerCase()}`;
      if (!html.includes(`<section class="day-step" id="${anchor}"`)) throw new Error(`${sourceRel}: 순서 칸 #${anchor}가 없다`);
      return `<li class="day-chip" data-step="${s.id}"><input type="checkbox" class="step-check" data-step="${s.id}"${isExtraStep(s, course) ? ' data-extra' : ''} id="check-${s.id.toLowerCase()}" aria-label="${NUMS[i]} ${esc(plain(s.short))} 끝냄"><a href="#${anchor}"><span class="chip-no" aria-hidden="true">${NUMS[i]}</span><span class="chip-title">${inline(s.short)}</span></a></li>`;
    }).join('');
    const heading = steps.text.match(/<h2[\s\S]*?<\/h2>/)[0];
    // 홈 진도와 같은 기준: 선택·연습 티켓 순서는 따로 센다(course.js initDay의 진도 문구와 같다)
    const extraCount = day.steps.filter((s) => isExtraStep(s, course)).length;
    const coreCount = day.steps.length - extraCount || day.steps.length;
    const progress = `0/${coreCount} 끝냄${extraCount && extraCount < day.steps.length ? ` · 선택·연습 0/${extraCount}` : ''}`;
    const extraNote = extraCount && extraCount < day.steps.length ? ' 선택·연습 티켓 순서는 진도에 세지 않습니다.' : '';
    html = html.slice(0, steps.start)
      + `<section class="day-today" aria-labelledby="오늘-순서"><div class="day-today-head">${heading}<p class="day-progress" data-day-progress aria-live="polite">${progress}</p></div>`
      + `<ol class="day-steps day-chips" data-day="${day.id}">${chipList}</ol>`
      + `<p class="day-progress-note">체크는 이 브라우저에만 저장되고, 홈의 "오늘 할 일"이 이 체크로 다음 날을 고릅니다.${extraNote} <span data-course-storage></span></p></section>\n`
      + html.slice(steps.end);
  } else fail('오늘 순서가 없다');

  // 3) 오늘의 Java → 카드, 그 아래 [오늘 흐름]. 1단계는 요청 흐름 재생, 2단계는 그날 티켓의 장애 흐름으로 잇는다. 흐름이 없는 날(D00·D15)은 빈 자리만 둔다.
  const javaBlock = between(html, /<h2 id="오늘의-java"/, /<hr>|<h2 /);
  const dayFlow = course.flows.days.get(day.id);
  const flowSlot = dayFlow ? renderDayFlow(dayFlow)
    : (day.phase === 'maintain' && renderDayTicketLinks(day, course, course.flows, sourceRel)) || `<div class="day-flow" data-flow-day="${day.id}" hidden></div>\n`;
  if (javaBlock) {
    // 본문 첫 링크(Jnn. 제목 — 30~60분)가 여는 동작이라, 같은 목적의 버튼을 따로 두지 않는다.
    html = html.slice(0, javaBlock.start) + `<section class="day-java" aria-labelledby="오늘의-java">${javaBlock.text}</section>\n${flowSlot}` + html.slice(javaBlock.end);
  } else {
    fail('오늘의 Java가 없다');
    html = html.replace(/(<\/header>)/, `$1${flowSlot}`);
  }

  // 4) 순서 칸: 만들 파일·겪을 것·완료 조건·명세(2단계는 티켓 배지) 칸 배치 + 칸 끝 체크
  for (const step of day.steps) {
    const anchor = `step-${step.id.toLowerCase()}`;
    const start = html.indexOf(`<section class="day-step" id="${anchor}"`);
    if (start < 0) { fail(`#${anchor} 없음`); continue; }
    const end = html.indexOf('</section>', start) + '</section>'.length;
    html = html.slice(0, start) + renderStepSection(html.slice(start, end), sourceRel, course, step) + html.slice(end);
  }

  // 5) 정답 코드는 닫힌 채로 두고, 펼칠 때 하이라이트한다(course.js가 language- 클래스를 되돌린다)
  html = html.replace(/<details class="step-answer"[\s\S]*?<\/details>/g, (block) => block.replace(/<code class="language-([\w-]+)">/g, '<code data-lazy-lang="$1">'));

  // 6) AI 채점 프롬프트 복사
  const graderAt = html.indexOf('<h2 id="ai-채점-프롬프트"');
  if (graderAt >= 0) {
    const preAt = html.indexOf('<pre>', graderAt);
    if (preAt < 0) throw new Error(`${sourceRel}: 채점 프롬프트 코드 블록이 없다`);
    html = html.slice(0, preAt) + `<div class="copy-row"><button type="button" class="copy-button" data-copy-target="day-grader-prompt">프롬프트 복사</button><span class="copy-status" role="status" aria-live="polite"></span></div><pre class="grader-prompt" id="day-grader-prompt">` + html.slice(preAt + '<pre>'.length);
  } else fail('AI 채점 프롬프트가 없다');

  // 7) 맨 아래 이전·다음 줄 → 날 제목이 보이는 이동
  const pagerLine = /<p>(?:<a href="D\d{2}\.html">← D\d{2}[^<]*<\/a> · )?<a href="README\.html">일자 목록<\/a>(?: · <a href="D\d{2}\.html">D\d{2}[^<]*→<\/a>)?<\/p>\s*$/;
  if (!pagerLine.test(html)) throw new Error(`${sourceRel}: 맨 아래 이전·다음 줄을 찾지 못했다`);
  html = html.replace(pagerLine, dayPager(day, sourceRel, course));
  return `<article class="course-day" data-day-page="${day.id}">${html}</article>`;
}

// ---------------------------------------------------------------- 홈: 과정 v2 진입
export function renderCourseHome(course) {
  const from = 'README.md';
  const href = (target) => relHref(from, target);
  const main = course.days.filter((d) => d.id !== 'D00');
  const first = main[0];
  const coreCount = (d) => d.steps.filter((s) => !isExtraStep(s, course)).length || d.steps.length;
  const stepTotal = main.reduce((n, d) => n + coreCount(d), 0);
  const data = course.days.map((d) => ({ id: d.id, title: d.title, phase: d.phase, phaseLabel: PHASE[d.phase], java: d.java, href: href(d.page),
    javaHref: course.java.find((j) => j.id === d.java)?.page ? href(course.java.find((j) => j.id === d.java).page) : null,
    steps: d.steps.map((s) => ({ id: s.id, title: plain(s.short), ...(isExtraStep(s, course) ? { extra: true } : {}) })) }));
  const todaySteps = (d) => d.steps.map((s, i) => `<li><span aria-hidden="true">${NUMS[i]}</span> ${inline(s.short)}</li>`).join('');
  const phases = [['build', '1단계 · 만들기'], ['maintain', '2단계 · 넘겨받기'], ['wrap', '마무리']];
  const dayCell = (d) => `<li class="ch-day" data-day="${d.id}"><a href="${esc(href(d.page))}"><b>${d.id}</b><span class="ch-day-title">${esc(d.title)}</span><span class="ch-bar" aria-hidden="true"><i style="width:0%"></i></span><small data-day-count>0/${coreCount(d)}</small></a></li>`;
  const javaChips = course.java.map((j) => (j.page
    ? `<a href="${esc(href(j.page))}" title="${esc(j.title)}">${j.id}${j.optional ? '<small>선택</small>' : ''}</a>`
    : `<span>${j.id}</span>`)).join('');
  const ticketChips = course.tickets.filter((t) => !t.enhancement).map((t) => {
    const label = `<b>${t.id}</b>${t.required || t.pool ? `<small>${ticketKind(t)}</small>` : ''}`;
    return t.page ? `<a class="${t.required ? 'is-required' : ''}" href="${esc(href(t.page))}" title="${esc(t.title)}">${label}</a>` : `<span class="is-pending${t.required ? ' is-required' : ''}" title="${esc(t.title)} · 준비 중">${label}</span>`;
  }).join('');
  const readyTickets = course.tickets.filter((t) => t.page && !t.enhancement).length;
  return `<section class="course-home" data-course-home aria-labelledby="course-home-title">
  <div class="ch-intro"><p class="home-eyebrow">Java·Spring 온보딩 과정 v2 · 15일</p><h1 id="course-home-title">빈 프로젝트로 서버를 만들고, <span>넘겨받은 서버를 고칩니다.</span></h1><p>1단계 10일은 게시판·상점·결제 연동 서버를 직접 만들고, 2단계 4일은 결함이 심어진 서버의 티켓을 처리합니다. 매일 Spring 순서 전에 30~60분 Java 트랙을 먼저 합니다.</p></div>
  <div class="ch-hero">
    <article class="ch-today" aria-labelledby="ch-today-title">
      <p class="ch-tag" data-today-tag>오늘 할 일 · 처음 시작</p>
      <h2 id="ch-today-title"><b data-today-id>${first.id}</b> <span data-today-title>${esc(first.title)}</span></h2>
      <p class="ch-today-meta" data-today-meta>${esc(PHASE[first.phase])} · 순서 ${first.steps.length}개 · 오늘의 Java ${esc(first.java)}</p>
      <ol class="ch-today-steps" data-today-steps>${todaySteps(first)}</ol>
      <div class="ch-actions"><a class="ch-primary" data-today-open href="${esc(href(first.page))}">${first.id} 열기 <span aria-hidden="true">→</span></a><a class="ch-secondary" data-today-java href="${esc(href(course.java.find((j) => j.id === first.java).page))}">오늘의 Java ${esc(first.java)} →</a></div>
      <p class="ch-note" data-today-note>Java가 처음이면 <a href="${esc(href('course/spring/D00.html'))}">D00 Java 워밍업(선택)</a>을 먼저 하세요.</p>
    </article>
    <section class="ch-progress" aria-labelledby="ch-progress-title">
      <div class="ch-progress-head"><h2 id="ch-progress-title">15일 진도</h2><p data-progress-summary>체크한 순서 0/${stepTotal}</p></div>
      <p class="ch-progress-note">직접 체크한 진도이며 채점 결과는 아니다. Java·선택 티켓의 수행 여부와 역량은 별도로 확인한다.</p>
      ${phases.map(([phase, label]) => `<h3 class="ch-phase">${label}</h3><ol class="ch-days">${main.filter((d) => d.phase === phase).map(dayCell).join('')}</ol>`).join('')}
      <p class="ch-progress-note">일자 페이지의 순서 체크가 이 브라우저에 저장되고, 여기서 다음 날을 고릅니다. <span data-course-storage></span></p>
    </section>
  </div>
  <div class="ch-entries">
    <article class="ch-entry"><p class="home-eyebrow">Spring 트랙 · 메인</p><h3>일자 페이지 D00~D15</h3><p>오늘 순서 → 순서 칸(만들 파일·겪을 것·완료 조건) → 막히면 힌트 → 그 순서의 정답 → 말하기 카드와 AI 채점.</p><a href="${esc(href('course/spring/README.html'))}">일자 목록 열기 →</a></article>
    <article class="ch-entry"><p class="home-eyebrow">Java 트랙 · 매일 30~60분</p><h3>같은 날 쓰는 Java 먼저</h3><p class="ch-chips">${javaChips}</p></article>
    <article class="ch-entry"><p class="home-eyebrow">2단계 티켓 · 필수 4건 + 선택 1건(Security·Redis 후보)</p><h3>증상만 적힌 티켓 B01~B16</h3><p class="ch-chips ch-ticket-chips">${ticketChips}</p><p class="ch-entry-note">필수 B01~B04 + 선택 1건(B12·B13·B14 또는 B15·B16) + <a href="${esc(href('course/tickets/E01.html'))}">고도화 E01</a> + <a href="${esc(href('course/tickets/drill.html'))}">모의 장애 훈련</a>. B05~B11과 고르지 않은 후보는 연습으로 하고, 처리한 것만 채점합니다. 티켓 페이지 ${readyTickets}/16 준비됨.</p></article>
    <article class="ch-entry ch-entry-map"><p class="home-eyebrow">과정 지도</p><h3>날·Java·티켓·결함 영역의 관계</h3><p>어느 날의 Java가 어떤 날을 받치고, 2단계 티켓이 어떤 결함 영역에 속하는지 한 장에서 봅니다.</p><a href="${esc(href('course/map.html'))}">과정 지도 열기 →</a></article>
  </div>
  <p class="ch-links"><a href="${esc(href('course/README.html'))}">과정 안내</a><a href="${esc(href('course/start/README.html'))}">1단계 출발 자료</a><a href="${esc(href('course/spec-v2.html'))}">명세서 v2</a><a href="${esc(href('course/talk-cards.html'))}">말하기 카드 전체</a></p>
  <script type="application/json" id="course-days-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
</section>`;
}

// 기존 홈(시나리오 첫 과제·미리보기·FAQ·설치 안내)은 링크와 이어하기를 그대로 두고 "참고 도감"으로 내린다.
export function renderHomeReference(homeVisualHtml) {
  const demoted = homeVisualHtml.replace(/<h1 id="home-title"([^>]*)>([\s\S]*?)<\/h1>/, '<h2 id="home-title"$1>$2</h2>');
  if (demoted === homeVisualHtml) throw new Error('홈: 기존 제목(#home-title)을 찾지 못했다');
  return `<section class="home-reference" aria-labelledby="home-reference-title"><div class="home-reference-head"><p class="home-eyebrow">참고 도감</p><h2 id="home-reference-title">기존 게시판 시나리오·실전 미션·개념 학습</h2><p>과정 v2 이전에 만든 101단계 시나리오와 공부자료입니다. 일자 페이지 맨 아래 "참고 자료"가 이곳의 문서로 이어집니다. 하던 시나리오 과제의 이어하기 기록도 그대로 남아 있습니다.</p><p class="ch-links"><a href="scenario/README.html">서비스 만들기(시나리오)</a><a href="practice/MISSIONS.html">실전 미션</a><a href="docs/knowledge/README.html">개념 학습</a><a href="errors.html">에러 도감</a></p></div>${demoted}</section>`;
}

// ---------------------------------------------------------------- 과정 지도
const KIND_LABEL = { java: 'Java 트랙', day: 'Spring 일자', ticket: '티켓', area: '결함 영역' };
const EDGE_LABEL = { practice: '같은 날 먼저 연습', ticket: '그날 다루는 티켓', area: '결함 영역' };

export function mapNodes(course) {
  const ticketOrder = [];
  for (const d of course.days) for (const s of d.steps) for (const t of s.tickets) if (!ticketOrder.includes(t)) ticketOrder.push(t);
  for (const t of course.tickets) if (!ticketOrder.includes(t.id)) ticketOrder.push(t.id);
  return [
    ...course.java.map((j) => ({ id: j.id, kind: 'java', title: j.title, page: j.page, note: j.optional ? '선택' : '' })),
    ...course.days.map((d) => ({ id: d.id, kind: 'day', title: d.title, page: d.page, note: PHASE_SHORT[d.phase] })),
    ...ticketOrder.map((id) => course.tickets.find((t) => t.id === id)).map((t) => ({ id: t.id, kind: 'ticket', title: t.title,
      page: t.page || (t.day ? `${course.days.find((d) => d.id === t.day).page}#step-${t.day.toLowerCase()}-${t.step}` : null), note: ticketKind(t), pending: !t.page && !t.day })),
    ...course.areas.map((a) => ({ id: a.id, kind: 'area', title: a.label, page: null, note: '', desc: a.desc })),
  ];
}

export function renderCourseMap(course, fromRel = MAP_PAGE) {
  const nodes = mapNodes(course);
  const href = (target) => (target ? relHref(fromRel, target) : null);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const label = (id) => (byId.get(id).kind === 'area' ? byId.get(id).title : id);
  const nodeButton = (n) => `<button type="button" class="cm-node kind-${n.kind}${n.note === '필수' ? ' is-required' : ''}" data-node="${esc(n.id)}" title="${esc(n.title)}" aria-pressed="false"><b>${esc(n.kind === 'area' ? n.title : n.id)}</b>${n.kind === 'area' ? '' : `<span>${esc(n.title)}</span>`}${n.note ? `<small>${esc(n.note)}</small>` : ''}</button>`;
  const lanes = ['java', 'day', 'ticket', 'area'].map((kind) => `<div class="cm-lane lane-${kind}" data-lane="${kind}"><h3>${KIND_LABEL[kind]}</h3><div class="cm-lane-nodes">${nodes.filter((n) => n.kind === kind).map(nodeButton).join('')}</div></div>`).join('');
  const edgeChip = (e, show) => {
    const n = byId.get(show);
    const text = `${esc(label(show))}${n.kind === 'area' ? '' : ` <span>${esc(n.title)}</span>`}`;
    return `<li data-edge="${esc(e.from)}>${esc(e.to)}" data-kind="${e.kind}">${n.page ? `<a href="${esc(href(n.page))}">${text}</a>` : text}</li>`;
  };
  const out = (id, kind) => course.edges.filter((e) => e.from === id && (!kind || e.kind === kind));
  const into = (id, kind) => course.edges.filter((e) => e.to === id && (!kind || e.kind === kind));
  const list = (edges, side) => (edges.length ? `<ul class="cm-rel">${edges.map((e) => edgeChip(e, side === 'to' ? e.to : e.from)).join('')}</ul>` : '<span class="cm-none">없음</span>');
  const nodeCell = (n) => `${n.page ? `<a href="${esc(href(n.page))}"><b>${esc(n.id)}</b></a>` : `<b>${esc(n.id)}</b>`} ${esc(n.title)}`;
  const dayRows = course.days.map((d) => byId.get(d.id)).map((n) => `<tr><th scope="row">${nodeCell(n)}</th><td>${list(into(n.id, 'practice'), 'from')}</td><td>${list(out(n.id, 'ticket'), 'to')}</td></tr>`).join('');
  const ticketRows = nodes.filter((n) => n.kind === 'ticket').map((n) => `<tr><th scope="row">${nodeCell(n)} <small>${esc(n.note)}${n.pending ? ' · 페이지 준비 중' : ''}</small></th><td>${list(into(n.id, 'ticket'), 'from')}</td><td>${list(out(n.id, 'area'), 'to')}</td></tr>`).join('');
  const areaRows = nodes.filter((n) => n.kind === 'area').map((n) => `<tr><th scope="row"><b>${esc(n.title)}</b></th><td>${esc(n.desc)}</td><td>${list(into(n.id, 'area'), 'from')}</td></tr>`).join('');
  const graph = { nodes: nodes.map(({ id, kind, title, page, note }) => ({ id, kind, title, href: href(page), note })), edges: course.edges };
  return `<section class="course-map" data-course-map aria-labelledby="cm-title">
  <h2 id="cm-title">관계 지도</h2>
  <div class="cm-legend" aria-label="범례">
    <div><p class="cm-legend-title">노드</p><ul>${['java', 'day', 'ticket', 'area'].map((k) => `<li><span class="cm-swatch kind-${k}" aria-hidden="true"></span>${KIND_LABEL[k]}</li>`).join('')}<li><span class="cm-swatch kind-ticket is-required" aria-hidden="true"></span>굵은 테두리 = 필수 티켓</li></ul></div>
    <div class="cm-line-legend"><p class="cm-legend-title">연결선 (화살표 방향 = 영향이 흐르는 쪽)</p><ul>${Object.entries(EDGE_LABEL).map(([k, v]) => `<li><svg class="cm-line-sample" viewBox="0 0 44 10" aria-hidden="true"><line class="cm-edge edge-${k}" x1="2" y1="5" x2="36" y2="5"/><path class="cm-arrow edge-${k}" d="M36 1 L43 5 L36 9 Z"/></svg>${k === 'practice' ? 'J → D' : k === 'ticket' ? 'D → 티켓' : '티켓 → 영역'} · ${v}</li>`).join('')}</ul></div>
  </div>
  <div class="cm-toolbar">
    <fieldset class="cm-views"><legend>관계 보기</legend>
      <label><input type="radio" name="cm-view" value="direct" checked> 직접 연결</label>
      <label><input type="radio" name="cm-view" value="both"> 상·하류 전체</label>
      <label><input type="radio" name="cm-view" value="up"> 영향 주는 쪽</label>
      <label><input type="radio" name="cm-view" value="down"> 영향 받는 쪽</label>
    </fieldset>
    <button type="button" class="cm-clear" data-cm-clear>선택 해제</button>
  </div>
  <p class="cm-status" data-cm-status role="status" aria-live="polite">노드를 고르면 관계 보기에 맞는 노드만 밝힙니다. 아래 관계 표에 모든 연결이 글로 있습니다.</p>
  <div class="cm-board" data-cm-board><svg class="cm-lines" data-cm-lines aria-hidden="true"></svg>${lanes}</div>
  <div class="cm-detail" data-cm-detail hidden></div>
  <script type="application/json" id="course-map-data">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>
</section>
<section class="cm-tables" aria-labelledby="cm-table-title">
  <h2 id="cm-table-title">관계 표</h2>
  <p>지도와 같은 연결을 글로 적었습니다. 화살표 방향으로 읽습니다: Java → 같은 날 Spring 일자 → 그날 다루는 티켓 → 결함 영역.</p>
  <h3 id="cm-table-days">일자별: 오늘의 Java와 다루는 티켓</h3>
  <div class="table-wrap"><table><thead><tr><th>일자</th><th>먼저 연습하는 Java (J → D)</th><th>다루는 티켓 (D → 티켓)</th></tr></thead><tbody>${dayRows}</tbody></table></div>
  <h3 id="cm-table-tickets">티켓별: 다루는 날과 결함 영역</h3>
  <div class="table-wrap"><table><thead><tr><th>티켓</th><th>다루는 날 (D → 티켓)</th><th>결함 영역 (티켓 → 영역)</th></tr></thead><tbody>${ticketRows}</tbody></table></div>
  <h3 id="cm-table-areas">결함 영역별: 속한 티켓</h3>
  <div class="table-wrap"><table><thead><tr><th>결함 영역</th><th>무엇이 어긋나나</th><th>속한 티켓 (티켓 → 영역)</th></tr></thead><tbody>${areaRows}</tbody></table></div>
</section>`;
}

export function mapCrumbs() {
  return '<nav class="course-crumbs" aria-label="현재 위치"><p class="crumbs"><a href="README.html">과정 v2</a> › 과정 지도</p></nav>';
}

// 문서를 파싱해 실제 요소의 id만 모은다. data-id·주석·스크립트 문자열 속 id="…"는 앵커가 아니다(P5-3 리뷰 ④).
export function htmlIds(html) {
  const { window } = new JSDOM(html);
  const ids = new Set([...window.document.querySelectorAll('[id]')].map((el) => el.id));
  window.close();
  return ids;
}

// 과정 v2 렌더러가 넣은 링크(홈 진입·지도·이전/다음·티켓 배지·흐름 목록, JSON 데이터의 href)를 최종 HTML에서 검사한다.
// outputs: 이번 빌드가 쓸 페이지(절대 경로 → HTML). 이 페이지들은 있는 것으로 보고, 나머지는 디스크에서 읽는다.
export function findInjectedLinkErrors(outputs, root) {
  const rel = (p) => path.relative(root, p).split(path.sep).join('/');
  const idCache = new Map();
  const idsOf = (target, html) => {
    if (!idCache.has(target)) idCache.set(target, htmlIds(html));
    return idCache.get(target);
  };
  const errors = [];
  for (const [out, html] of outputs) {
    const relOut = rel(out);
    if (relOut !== 'README.html' && !relOut.startsWith('course/')) continue;
    const hrefs = [...html.matchAll(/\shref="([^"]+)"/g), ...html.matchAll(/"href":"([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
    for (const href of new Set(hrefs)) {
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) continue;
      const [pathPart, hash] = href.split('#');
      const target = pathPart ? path.resolve(path.dirname(out), pathPart.split('?')[0]) : out;
      if (!outputs.has(target) && !fs.existsSync(target)) { errors.push(`${relOut}: 없는 파일 → ${href}`); continue; }
      const targetHtml = outputs.get(target) ?? (target.endsWith('.html') ? fs.readFileSync(target, 'utf8') : null);
      if (hash && targetHtml !== null && !idsOf(target, targetHtml).has(decodeURIComponent(hash))) errors.push(`${relOut}: 없는 앵커 → ${href}`);
    }
  }
  return errors;
}
