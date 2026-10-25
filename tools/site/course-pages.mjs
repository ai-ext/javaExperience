// 과정 v2 화면 렌더러 — 일자 페이지(course/spring/Dnn.md) 배치, 홈의 과정 진입 영역, 과정 지도(course/map.md).
// build.mjs가 marked로 만든 HTML을 받아 과정 전용 배치로 바꾼다. 다른 페이지에는 쓰지 않는다.
// 빌드가 주입하는 href는 marked 링크 검사를 거치지 않으므로, 여기서 대상 파일·앵커가 있는지 직접 확인한다.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { loadFlows, renderDayFlow, renderDayTicketLinks } from './course-flow.mjs';
import { loadCourseSources } from '../course/sources.mjs';
import { renderCourseApiWorkspace } from './course-api-workspace.mjs';
import { renderCoursePostVisual } from './course-post-visual.mjs';

const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const PHASE = { warmup: '선택 · Java 워밍업', build: '1단계 · 빈 프로젝트로 서버 만들기', maintain: '2단계 · 어수선한 서버 넘겨받기', wrap: '중간 점검 · 설명 세션', extend: '3단계 · 설계·운영·업무 적용' };
const PHASE_SHORT = { warmup: '선택', build: '1단계', maintain: '2단계', wrap: '중간 점검', extend: '3단계' };
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
  const { roadmap } = loadCourseSources(root);
  const meta = JSON.parse(read('course/map-tickets.json'));
  const h1 = (p) => (exists(p) ? read(p).match(/^# (.+)$/m)?.[1].replace(/[`*]/g, '').trim() : null);
  const java = roadmap.java.map((j) => {
    const title = h1(`course/java/${j.id}.md`);
    return { id: j.id, timing: j.timing || 'before', day: j.day || (j.id === 'J00' ? 'D00' : null), optional: Boolean(j.optional), title: title ? title.replace(/^J\d{2}\.\s*/, '') : plain(j.topic).split(/[:—]/)[0].trim(), page: exists(`course/java/${j.id}.md`) ? `course/java/${j.id}.html` : null };
  });
  const d00 = h1('course/spring/D00.md');
  const days = [
    { id: 'D00', phase: 'warmup', title: d00 ? d00.replace(/^D00\.\s*/, '') : 'Java 워밍업 (선택)', java: 'J00', steps: [], optional: true },
    ...roadmap.days.map((d) => ({ id: d.id, phase: d.phase, title: d.title, java: d.java, tomorrow: d.tomorrow, transition: d.transition, workTarget: d.workTarget, entryNotice: d.entryNotice,
      steps: d.steps.map((s) => ({ id: `${d.id}-${s.no}`, no: s.no, title: s.title, short: s.navTitle || shortTitle(s.title), requirement: s.requirement, tickets: s.tickets || [], guides: s.guides || [] })) })),
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
  for (const e of edges) if (e.kind === 'ticket' && !ticketIds.has(e.to)) throw new Error(`course/days/의 티켓 ${e.to}가 map-tickets.json에 없다`);
  const course = { days, java, tickets, areas: meta.areas, edges, exists };
  // 흐름 재생 데이터(course/flows/*.json). 일자 페이지 [오늘 흐름]과 티켓 페이지 [장애 흐름]이 쓴다.
  course.flows = loadFlows(root, course);
  return course;
}

// 연습을 쓰는 날은 roadmap에서 가져온다. 링크 이름에 티켓의 원인을 넣지 않는다.
export function renderExerciseNavigation(sourceRel, body, course) {
  if (!/^course\/(?:java\/J\d{2}|tickets\/(?:[BE]\d{2}|drill))\.md$/.test(sourceRel)) return body;
  const id = path.posix.basename(sourceRel, '.md');
  const java = course.java.find((j) => j.id === id);
  const uses = course.days.flatMap((day) => {
    if (java) return day.java === id ? [{ day, step: null }] : [];
    return day.steps.filter((s) => s.tickets.includes(id) || s.guides.includes(sourceRel)).map((step) => ({ day, step }));
  });
  if (!uses.length) throw new Error(`${sourceRel}: roadmap에 사용하는 날·순서가 없다`);
  const returns = uses.map(({ day, step }) => {
    const anchor = step ? `step-${step.id.toLowerCase()}` : day.id === 'D00' ? '오늘-할-것' : '오늘-순서';
    return `<a href="${esc(relHref(sourceRel, `${day.page}#${anchor}`))}">${esc(day.id)}${step ? ` ${NUMS[step.no - 1]}` : ''} · ${esc(day.title)}</a>`;
  }).join(' · ');
  const index = course.java.findIndex((j) => j.id === id);
  const neighbors = java ? [
    index > 0 ? `<a href="${course.java[index - 1].id}.html">← 이전 ${course.java[index - 1].id}</a>` : '',
    index < course.java.length - 1 ? `<a href="${course.java[index + 1].id}.html">다음 ${course.java[index + 1].id} →</a>` : '',
  ].filter(Boolean).join(' · ') : '';
  const location = Number(id.slice(1)) >= 16
    ? '확장 실험은 학습자 프로젝트 루트에서 작성·실행한다. 기존 java-track 과제는 해당 J 페이지의 모듈 명령을 따른다.'
    : 'Java는 저장소의 <code>java-track/</code>에서 작성하고 저장소 루트에서 실행한다.';
  const timing = ['J44','J45'].includes(id) ? '<p>요구 제시·초기 진단 뒤 수행 중 증거 또는 사후 확인으로 진행한다.</p>' : '';
  const nav = `<nav class="course-exercise-nav" aria-label="${java ? '연습' : '과제'}에서 일정으로 돌아가기"><p>${java ? '이 연습을 쓰는 날' : '이 과제를 하는 날'}: ${returns}</p>${java ? `<p>${location}</p>${timing}<p>${neighbors}</p>` : ''}</nav>`;
  const headEnd = body.indexOf('</h1>') + 5;
  if (headEnd < 5) throw new Error(`${sourceRel}: 제목이 없다`);
  return renderExerciseDocument(`${body.slice(0, headEnd)}\n${nav}\n${body.slice(headEnd)}\n${nav}`, id, Boolean(java), java ? relHref(sourceRel, uses[0].day.page) : null);
}

// 기존 본문을 DOM 단위로 옮겨 원문·접기·앵커를 보존한다.
function renderExerciseDocument(body, id, isJava, springHref) {
  const doc = new JSDOM(`<article>${body}</article>`).window.document;
  const article = doc.querySelector('article');
  article.className = `exercise-sheet ${isJava ? 'exercise-java' : 'exercise-ticket'}`;
  article.dataset.exercise = id;
  const title = article.querySelector('h1');
  const meta = article.querySelector(':scope > blockquote');
  const head = doc.createElement('header');
  head.className = 'exercise-head';
  head.innerHTML = `<p class="exercise-kind"><b>${esc(id)}</b> ${isJava ? '연습 · Java' : '과제 · 2단계 티켓'}</p>`;
  title.before(head);
  head.append(title);
  if (meta) { meta.className = 'exercise-meta'; head.append(meta); }

  // 재현과 제출물을 긴 흐름 재생보다 먼저 둔다. 원인 단계는 이동한 section의 details 안에 그대로 남는다.
  const flow = article.querySelector(':scope > .ticket-flow');
  const submit = article.querySelector(':scope > h2[id="제출물"]');
  if (flow && submit) {
    let last = submit;
    while (last.nextElementSibling && last.nextElementSibling.tagName !== 'H2') last = last.nextElementSibling;
    last.after(flow);
  }
  const headings = [...article.querySelectorAll(':scope > h2')];
  const primary = isJava
    ? ['만들 파일과 실행 위치', '만들 것', '오늘 실험', '실행과 완료 조건', '오늘 Spring에서 다시 만나는 곳']
    : id === 'drill' ? ['준비', '스크립트', '진행', '회고 양식'] : ['받은 티켓', '받은 요청', '환경과 재현', '제출물'];
  const label = h => h.textContent.replace(/^#\s*/, '').trim();
  const stops = headings.filter(h => primary.includes(label(h)));
  const route = doc.createElement('nav');
  route.className = 'exercise-route';
  route.setAttribute('aria-label', isJava ? 'Java 실험 순서' : '티켓 처리 순서');
  route.innerHTML = `<ol>${stops.map((h, i) => `<li><a href="${label(h) === '오늘 Spring에서 다시 만나는 곳' ? esc(springHref) : '#' + esc(h.id)}"><b>${String(i + 1).padStart(2, '0')}</b><span>${esc(label(h) === '오늘 Spring에서 다시 만나는 곳' ? 'D' + id.slice(1) + ' Spring 이어서 시작하기' : label(h))}</span></a></li>`).join('')}</ol>${flow ? `<a class="exercise-flow-link" href="#${esc(flow.id)}">장애 흐름 재생 →</a>` : ''}`;
  head.after(route);
  if (isJava && headings.some(h => label(h) === '오늘 Spring에서 다시 만나는 곳')) route.insertAdjacentHTML('beforeend', '<a class="exercise-connections" href="#오늘-spring에서-다시-만나는-곳">Java와 Spring 연결 사례</a>');
  for (const heading of headings) {
    const section = doc.createElement('section');
    section.className = 'exercise-section';
    if (['받은-티켓', '받은-요청'].includes(heading.id)) section.classList.add('exercise-received');
    if (heading.id === '환경과-재현') section.classList.add('exercise-repro');
    if (heading.id === '제출물') section.classList.add('exercise-submission');
    if (heading.id === '원인과-정답') section.classList.add('exercise-answer');
    section.setAttribute('aria-labelledby', heading.id);
    heading.before(section);
    section.append(heading);
    while (section.nextElementSibling && !section.nextElementSibling.matches('h2, .ticket-flow, .course-exercise-nav')) section.append(section.nextElementSibling);
  }
  if (isJava) {
    const sections = [...article.querySelectorAll(':scope > .exercise-section')];
    const work = sections.filter(section => /^(만들 파일과 실행 위치|만들 것|오늘 실험|실행과 완료 조건)$/.test(label(section.querySelector('h2'))));
    let cursor = route;
    for (const section of work) {
      section.classList.add('exercise-primary');
      cursor.after(section);
      cursor = section;
    }
    const topReturn = article.querySelector(':scope > .course-exercise-nav');
    if (topReturn) {
      const support = doc.createElement('details');
      support.className = 'exercise-context-links';
      support.innerHTML = '<summary>실행 위치·연결 일자·이전 연습</summary>';
      topReturn.before(support);
      const metadata = [...topReturn.querySelectorAll('p')].slice(1).filter(p => !p.querySelector('a'));
      support.append(topReturn, ...metadata);
    }
  }
  for (const nav of article.querySelectorAll('.course-exercise-nav')) {
    nav.classList.add('exercise-return');
    const back = nav.querySelector('p');
    back.className = 'exercise-return-links';
    if (nav === article.lastElementChild) {
      nav.insertAdjacentHTML('afterbegin', `<strong>${isJava ? '실험 결과를 남겼다면' : '제출물을 준비했다면'}</strong>`);
      nav.insertAdjacentHTML('beforeend', '<p class="exercise-return-note">연결된 일자로 돌아가 완료 조건을 확인하고 진행 기록을 남기세요.</p>');
    }
  }
  return article.outerHTML;
}

function renderStageTransition(day) {
  const t = day.transition;
  if (!t) return '';
  return `<aside class="stage-transition" aria-label="${esc(t.label)}"><p class="stage-transition-label">${esc(t.label)}</p><h2>${esc(t.title)}</h2><p>${esc(t.description)}</p><ol>${t.actions.map((a, i) => `<li><a href="${esc(a.href)}"><b>${String(i + 1).padStart(2, '0')}</b><span>${esc(a.label)}</span></a></li>`).join('')}</ol></aside>`;
}

function frameHandoff(html) {
  const doc = new JSDOM(`<div>${html}</div>`).window.document;
  const root = doc.body.firstElementChild;
  const heading = root.querySelector('#인수인계-시작');
  if (!heading) throw new Error('D11: 인수인계 시작 절이 없다');
  const sheet = doc.createElement('section');
  sheet.className = 'handoff-sheet';
  sheet.setAttribute('aria-labelledby', heading.id);
  heading.before(sheet);
  sheet.append(heading);
  while (sheet.nextElementSibling && !sheet.nextElementSibling.matches('h2, hr, .day-step, .day-overview, .practice-panel')) sheet.append(sheet.nextElementSibling);
  root.querySelector('.day-head').after(sheet);
  const selection = root.querySelector('.ticket-selection');
  if (selection) sheet.after(selection);
  return serializeLayout(root);
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

function stepRequirement(step, day, course) {
  if (day.phase !== 'maintain') return '';
  if (step.requirement) return step.requirement;
  const tickets = step.tickets.map(id => course.tickets.find(t => t.id === id));
  return tickets.length ? (!isExtraStep(step, course) ? '공통 작업 필수 / ' : '') + tickets.map(t => `${t.id} ${ticketKind(t)}${t.enhancement ? ' · 모두 수행' : ''}`).join(' / ') : '공통 작업 필수';
}

function ticketBadge(ticket, fromRel, course) {
  if (!ticket) return '';
  const kind = ticketKind(ticket);
  const inner = `<b>${esc(ticket.id)}</b><span>${kind}</span>`;
  const cls = `ticket-badge${ticket.required ? ' is-required' : ''}`;
  const dataKind = ticket.required ? 'required' : ticket.enhancement ? 'enhancement' : ticket.pool ? 'optional' : 'practice';
  return ticket.page
    ? `<a class="${cls}" data-ticket-kind="${dataKind}" href="${esc(relHref(fromRel, ticket.page))}" title="${esc(ticket.title)}">${inner}</a>`
    : `<span class="${cls} is-pending" data-ticket-kind="${dataKind}" title="${esc(ticket.title)} · 티켓 페이지 준비 중">${inner}<small>페이지 준비 중</small></span>`;
}

const FACTS = { '이 순서에서 만들 층': 'layers', '만들 파일': 'files', '겪을 것': 'trap', '완료 조건': 'done', '명세': 'spec', '데이터 요구사항': 'data-spec', '티켓': 'tickets', '원인과 정답': 'answer-link' };
function renderFacts(segment, fromRel, course) {
  const parts = segment.split(/(?=<p><strong>(?:이 순서에서 만들 층|만들 파일|겪을 것|완료 조건|명세|데이터 요구사항|티켓|원인과 정답)<\/strong>)/);
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
    if (key === 'files') {
      // 전체 경로는 복사·검색 가능하게 지키고, 파일 이름에만 읽는 무게를 준다.
      rest = rest.replace(/<code>([^<]*\/)([^/<]+)<\/code>/g, '<code><span class="file-directory">$1</span><b class="file-name">$2</b></code>');
      rest = rest.replace(/<li><strong>(새로 만들기|기존 수정|확인만)<\/strong>:\s*([\s\S]*?)<\/li>/g, (_, action, files) =>
        `<li class="file-action-row"><strong class="file-action">${action}</strong><span class="file-paths">${files.replace(/<\/code>\s*·\s*<code>/g, '</code><code>')}</span></li>`);
    }
    return { key, html: ['trap', 'answer-link'].includes(key) ? `<details class="step-fact fact-${key}"><summary>${label}${note}</summary>${rest}</details>` : `<div class="step-fact fact-${key}"><p class="fact-label">${key === 'files' ? '만들 것' : label}${note}</p>${rest}</div>` };
  });
  // 만들 것과 완료 조건을 먼저 읽고 필요할 때 명세를 연다. 시각·읽기 순서를 맞춘다.
  const order = ['layers', 'files', 'done', 'tickets', 'data-spec', 'spec', 'trap', 'answer-link'];
  facts.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  const refs = facts.filter(f => ['spec', 'data-spec'].includes(f.key));
  const body = facts.filter(f => !['spec', 'data-spec'].includes(f.key));
  const refAt = body.findIndex(f => ['trap', 'answer-link'].includes(f.key));
  if (refs.length) body.splice(refAt < 0 ? body.length : refAt, 0, { html: `<details class="step-references"><summary>명세·데이터 요구사항 보기</summary>${refs.map(f => f.html).join('')}</details>` });
  return `${lead}${facts.length ? `<div class="step-facts">${body.map(f => f.html).join('')}</div>` : ''}`;
}

function renderStepSection(section, fromRel, course, step) {
  const headEnd = section.indexOf('</h2>') + 5;
  if (headEnd < 5) throw new Error(`${step.id}: 순서 칸 제목이 없다`);
  const bodyEnd = (() => {
    const candidates = ['<details', '<blockquote', '</section>'].map((tag) => section.indexOf(tag, headEnd)).filter((i) => i >= 0);
    return Math.min(...candidates);
  })();
  let facts = renderFacts(section.slice(headEnd, bodyEnd).trim(), fromRel, course);
  let tail = section.slice(bodyEnd).replace(/<\/section>\s*$/, '');
  const observationId = `observations-${step.id.toLowerCase()}`;
  if (/<details class="step-observations"[^>]*>\s*<summary>꼭 할 관찰/.test(tail)) {
    tail = tail.replace('<details class="step-observations"', `<details id="${observationId}" class="step-observations"`);
    facts = facts.replace(/(<div class="step-fact fact-done">)([\s\S]*?)(<\/div>)/, `$1$2<p><a class="step-required" href="#${observationId}">꼭 할 관찰 절차와 제출 증거 확인 ↓</a></p>$3`);
  }
  const focusTitle = shortTitle(step.title).split(' — ')[0];
  const titleDetail = focusTitle !== step.title ? `<details class="step-context"><summary>순서 제목의 세부 조건 보기</summary><p>${inline(step.title)}</p></details>` : '';
  const head = section.slice(0, headEnd).replace(/(<h2[^>]*>(?:<a\b[^>]*>[\s\S]*?<\/a>)?)([①②③④⑤⑥⑦⑧⑨⑩])\s*/, '$1<span class="step-number">$2</span> <span class="step-title">').replace('</h2>', '</span></h2>').replace(/(<span class="step-title">)[\s\S]*?(<\/span><\/h2>)/, `$1${inline(focusTitle)}$2`);
  const day = course.days.find(d => d.steps.some(s => s.id === step.id));
  const next = day.steps[day.steps.indexOf(step) + 1];
  const nextLink = `<a class="step-next" href="${next ? `#step-${next.id.toLowerCase()}` : '#오늘-순서'}">${next ? `다음 순서 ${NUMS[next.no - 1]} →` : '오늘 순서로 돌아가기 ↑'}</a>`;
  const done = `<p class="step-done"><label><input type="checkbox" class="step-check" data-step="${esc(step.id)}"> 이 순서를 끝냈다</label></p>`;
  return `${head}${facts}${renderCoursePostVisual({ stepId: step.id })}${renderCourseApiWorkspace({ stepId: step.id })}<div class="step-help">${titleDetail}${tail}</div><div class="step-footer">${done}${nextLink}</div></section>`;
}

function dayPager(day, fromRel, course) {
  const index = course.days.findIndex((d) => d.id === day.id);
  const link = (d, dir) => (d
    ? `<a class="day-pager-${dir}" href="${esc(relHref(fromRel, d.page))}"><small>${dir === 'prev' ? '<svg class="pager-arrow" viewBox="0 0 18 18" aria-hidden="true"><path d="M15 9H3 M8 4L3 9L8 14" fill="none" stroke="currentColor" stroke-width="1.5"/></svg> 이전 날' : '다음 날 <svg class="pager-arrow" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 9h12 M10 4l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>'}</small><span><b>${d.id}</b> ${esc(d.title)}</span></a>`
    : '<span></span>');
  return `<nav class="day-pager" aria-label="이전·다음 날">${link(course.days[index - 1], 'prev')}<a class="day-pager-list" href="README.html">일자 목록</a>${link(course.days[index + 1], 'next')}</nav>`;
}

// 실습 후반부만 꾸민다. 원문·앵커·복사 대상은 그대로 두고 행동별 경계를 만든다.
function renderPracticeFinish(html, day, course) {
  const heading = (block, label) => block.replace(/(<h2\b[^>]*>[\s\S]*?<\/h2>)/, `<header class="practice-heading"><p class="practice-kicker">${label}</p>$1</header>`);
  html = html.replace(/<section class="day-data">([\s\S]*?)<\/section>/, (_, body) => `<section class="day-data practice-panel" aria-labelledby="이-날-데이터-넣기">${heading(body, '준비 · 테이블을 만든 뒤')}</section>`);
  html = html.replace(/<section class="day-sql">([\s\S]*?)<\/section>/, (_, body) => `<section class="day-sql practice-panel" aria-labelledby="오늘의-sql">${heading(body, '01 · 직접 풀기')}</section>`);
  html = html.replace(/(<div class="day-data-file" data-day-sql="(seed|bulk)"[^>]*>)/g, (_, tag, kind) => `${tag}<p class="data-file-label">${kind === 'seed' ? '기본 데이터 · 전체 블록' : '별도 실험 · 대량 데이터'}</p>`);
  // bulk는 기본 적재와 구분한다. D04의 실행 금지 안내는 접기 밖 원문에 남는다.
  html = html.replace(/(<div class="day-data-file" data-day-sql="bulk"[\s\S]*?<\/details>\s*<\/div>)/g, '<details class="day-bulk"><summary>대량 실험 데이터 · 별도 DB에서만 사용</summary>$1</details>');

  const talk = between(html, /<h2 id="말하기-카드"/, /<h2 /);
  if (talk) {
    const cards = talk.text.replace(/(<h3 id="tc-[^"]+"[\s\S]*?<\/details>)/g, '<div class="practice-talk-card">$1</div>');
    html = html.slice(0, talk.start) + `<section class="day-talk practice-panel" aria-labelledby="말하기-카드">${heading(cards, '02 · 소리 내어 설명하기')}<p class="practice-next"><a href="#ai-채점-프롬프트">설명을 마쳤으면 AI 채점으로 <span aria-hidden="true">→</span></a></p></section>` + html.slice(talk.end);
  }
  const grade = between(html, /<h2 id="ai-채점-프롬프트"/, /<h2 /);
  if (grade) {
    const content = grade.text.replace(/(<pre class="grader-prompt"[\s\S]*?<\/pre>)/, '<details class="grader-source"><summary>채점 프롬프트 내용 확인</summary>$1</details>');
    html = html.slice(0, grade.start) + `<section class="day-grade practice-panel" aria-labelledby="ai-채점-프롬프트">${heading(content, '03 · 결과 확인하기')}<p class="practice-grade-note">프롬프트를 복사한 뒤 에이전트에서 실행하고 채점표를 확인하세요. 복사와 구현 체크는 채점 완료가 아닙니다.</p></section>` + html.slice(grade.end);
  }
  const next = between(html, /<h2 id="내일-미리보기"/, /<h2 |<nav class="day-pager"/);
  if (next) {
    const index = course.days.indexOf(day);
    const tomorrow = course.days[index + 1];
    const title = tomorrow ? next.text : next.text.replace('내일 미리보기', '과정 마무리');
    const link = tomorrow ? `<a class="practice-continue" href="${tomorrow.id}.html"><small>다음 날</small><span>${tomorrow.id} · ${esc(tomorrow.title)}</span><span aria-hidden="true">→</span></a>` : '<a class="practice-continue" href="README.html">일자 목록에서 복습할 날 고르기 <span aria-hidden="true">→</span></a>';
    html = html.slice(0, next.start) + `<section class="day-finish practice-panel" aria-labelledby="내일-미리보기"><p class="practice-kicker">하루 마무리</p><nav class="practice-review" aria-label="하루 마무리 확인"><a href="#오늘의-sql">SQL 결과 확인</a><a href="#말하기-카드">말하기 답 기준 비교</a><a href="#ai-채점-프롬프트">AI 채점표 확인</a></nav>${title}${link}</section>` + html.slice(next.end);
  }
  return html;
}

export function dayCrumbs(sourceRel, course) {
  const id = path.posix.basename(sourceRel, '.md');
  const day = course.days.find((d) => d.id === id);
  if (!day) return '';
  const index = course.days.indexOf(day);
  const prev = course.days[index - 1];
  const next = course.days[index + 1];
  return `<nav class="course-crumbs day-crumbs" aria-label="현재 위치"><details class="day-location-menu"><summary>${esc(day.id)} · 일자 탐색</summary><div class="day-location-links"><p class="crumbs"><a href="../README.html">과정 안내</a> <svg class="crumb-separator" aria-hidden="true" viewBox="0 0 6 11"><polyline points="1,1 5,5.5 1,10" fill="none" stroke="currentColor" stroke-width="1.5"></polyline></svg> <a href="README.html">일자 목록</a> <svg class="crumb-separator" aria-hidden="true" viewBox="0 0 6 11"><polyline points="1,1 5,5.5 1,10" fill="none" stroke="currentColor" stroke-width="1.5"></polyline></svg> <span aria-current="page">${esc(day.id)}</span></p><p class="course-crumbs-jump">${prev ? `<a href="${prev.id}.html" rel="prev" aria-label="이전 날 ${prev.id}: ${esc(prev.title)}">← 이전 ${prev.id}</a>` : ''}${next ? `<a href="${next.id}.html" rel="next" aria-label="다음 날 ${next.id}: ${esc(next.title)}">다음 ${next.id} →</a>` : ''}</p></div></details></nav>`;
}

export function renderDayPage(sourceRel, body, course) {
  const id = path.posix.basename(sourceRel, '.md');
  const day = course.days.find((d) => d.id === id);
  if (!day) throw new Error(`${sourceRel}: roadmap에 없는 날`);
  const strict = day.phase === 'build';
  const fail = (what) => { if (strict) throw new Error(`${sourceRel}: ${what}`); };
  let html = body.replace(/<!-- 생성물:[^>]*-->\s*/, '');
  let todayPanel = '';

  // 1) 제목 + 요약 줄 → 머리
  const head = html.match(/(<h1\b[\s\S]*?<\/h1>)\s*<blockquote>\s*<p>([\s\S]*?)<\/p>\s*<\/blockquote>/);
  if (!head) throw new Error(`${sourceRel}: 제목과 요약 줄이 없다`);
  const chips = head[2].split(' · ').map((part) => {
    const cls = /준비 중/.test(part) ? ' is-pending' : /^(1단계|2단계|3단계|중간 점검|선택)$/.test(part.trim()) ? ` is-phase phase-${day.phase}` : '';
    return `<span class="day-meta-chip${cls}">${part.trim()}</span>`;
  }).join('');
  html = html.replace(head[0], `<header class="day-head">${head[1]}<p class="day-meta">${chips}</p></header>${['D11','D14'].includes(day.id) ? renderTicketSelection(course, sourceRel, day.id === 'D11') : ''}`);

  // 2) 오늘 순서 → 체크 칩 목록. 체크박스와 이동 링크를 형제로 둬 제목을 눌러도 체크가 바뀌지 않게 한다.
  const steps = between(html, /<h2 id="오늘-순서"/, /<h2 /);
  if (steps) {
    const items = [...steps.text.matchAll(/<li data-step="(D\d{2}-\d+)">/g)].map((m) => m[1]);
    const expected = day.steps.map((s) => s.id);
    if (items.join() !== expected.join()) throw new Error(`${sourceRel}: 오늘 순서 ${items.join()} ≠ roadmap ${expected.join()}`);
    const chipList = day.steps.map((s, i) => {
      const anchor = `step-${s.id.toLowerCase()}`;
      if (!html.includes(`<section class="day-step" id="${anchor}"`)) throw new Error(`${sourceRel}: 순서 칸 #${anchor}가 없다`);
      const candidates = isExtraStep(s, course) ? s.tickets.filter(id => course.tickets.find(t => t.id === id)?.pool) : [];
      const kind = stepRequirement(s, day, course);
      return `<li class="day-chip" data-step="${s.id}"${candidates.length ? ` data-choice-tickets="${candidates.join(',')}"` : ''}><input type="checkbox" class="step-check" data-step="${s.id}"${isExtraStep(s, course) ? ' data-extra' : ''} id="check-${s.id.toLowerCase()}" aria-label="${NUMS[i]} ${esc(plain(s.short))} 끝냄"><a href="#${anchor}"><span class="chip-no" aria-hidden="true">${NUMS[i]}</span><span class="chip-copy"><span class="chip-title">${inline(s.short)}</span>${kind ? `<small data-step-kind>${kind}</small>` : ''}</span></a></li>`;
    }).join('');
    const heading = steps.text.match(/<h2[\s\S]*?<\/h2>/)[0];
    // 홈 진도와 같은 기준: 선택·연습 티켓 순서는 따로 센다(course.js initDay의 진도 문구와 같다)
    const extraCount = day.steps.filter((s) => isExtraStep(s, course)).length;
    const coreCount = day.steps.length - extraCount || day.steps.length;
    const progress = `구현 완료 0/${coreCount}${extraCount && extraCount < day.steps.length ? ` · 선택·연습 0/${extraCount}` : ''}`;
    const extraNote = extraCount && extraCount < day.steps.length ? ' 선택한 티켓은 진도에 포함하며, 고르지 않은 선택·연습 티켓 순서는 진도에 세지 않습니다.' : '';
    const firstCore = day.steps.find((s) => !isExtraStep(s, course)) || day.steps[0];
    todayPanel = `<section class="day-today" aria-labelledby="오늘-순서"><div class="day-today-head"><div>${heading}</div><p class="day-progress day-progress-chip" data-day-progress aria-live="polite">${progress}</p></div>`
      + `<progress class="day-progress-track" data-day-meter max="${coreCount}" value="0" aria-label="필수 구현 순서 진도"></progress>`
      + `<ol class="day-steps day-chips" data-day="${day.id}">${chipList}</ol>`
      + `<a class="day-resume" data-day-resume href="#step-${firstCore.id.toLowerCase()}">${NUMS[day.steps.indexOf(firstCore)]} 시작하기 →</a>`
      + `<p class="day-progress-note">구현 체크는 이 브라우저에만 저장되며 채점 결과가 아닙니다. SQL·말하기·채점도 확인하세요. 다른 기기·브라우저에서는 일자 목록에서 하던 날로 직접 재진입하세요.${extraNote} <span data-course-storage></span></p></section>`;
    html = html.slice(0, steps.start) + html.slice(steps.end);
  } else fail('오늘 순서가 없다');

  // 3) Java·구현 목록 다음에 [오늘 흐름]을 둔다. 1단계는 요청 흐름 재생, 2단계는 그날 티켓의 장애 흐름으로 잇는다. 흐름이 없는 날(D00·D15)은 빈 자리만 둔다.
  const javaBlock = between(html, /<h2 id="오늘의-java"/, /<hr>|<h2 /);
  const dayFlow = course.flows.days.get(day.id);
  const flowSlot = dayFlow ? renderDayFlow(dayFlow)
    : (day.phase === 'maintain' && renderDayTicketLinks(day, course, course.flows, sourceRel)) || `<div class="day-flow" data-flow-day="${day.id}" hidden></div>\n`;
  if (javaBlock) {
    // 본문 첫 링크(Jnn. 제목 — 30~60분)가 여는 동작이라, 같은 목적의 버튼을 따로 두지 않는다.
    const timing = course.java.find((j) => j.id === day.java)?.timing;
    const javaPanel = `<section class="day-java" aria-labelledby="오늘의-java"><p class="day-panel-label">${timing === 'during-or-after' ? '수행 중 · 사후 확인' : '먼저 연습하기'}</p>${javaBlock.text}</section>`;
    const overview = `<div class="day-overview">${javaPanel}\n${todayPanel}${flowSlot}</div>`;
    html = html.slice(0, javaBlock.start) + (todayPanel ? '' : `${javaPanel}\n${flowSlot}`) + html.slice(javaBlock.end);
    // 긴 공통 안내 앞에 오늘의 작업대를 놓되, 안내·예시·과제 본문은 그대로 남긴다.
    if (todayPanel) html = html.replace(/(<nav class="day-sections"[\s\S]*?<\/nav>)/, (_, nav) => `${nav}\n${overview}`);
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

  // Markdown에는 원본 링크·접힌 SQL만 두고 HTML에만 파일별 동작을 붙인다.
  html = html.replace(/(<div class="day-data-file" data-day-sql="(seed|bulk)"[^>]*>)/g, (head, tag, name) => {
    const target = `${day.id.toLowerCase()}-${name}-sql`;
    return `${tag}<div class="copy-row"><button type="button" class="copy-button" data-sql-copy="${target}">SQL 복사</button><button type="button" class="copy-button" data-sql-download="${target}">파일 받기</button><span class="copy-status" role="status" aria-live="polite"></span></div>`;
  });

  html = html.replace(/(<div class="day-data-table"[^>]* data-sql-table="(\w+)"[^>]*>)/g, (_, tag, table) => {
    const target = `${day.id.toLowerCase()}-seed-${table}-sql`;
    return `${tag}<div class="copy-row"><button type="button" class="copy-button" data-table-copy="${table}" data-sql-copy="${target}">${table} 복사</button><span class="copy-status" role="status" aria-live="polite"></span></div>`;
  });

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
  if (day.id !== 'D00') html = renderPracticeFinish(html, day, course);
  if (day.id === 'D11') html = frameHandoff(html);
  const transition = renderStageTransition(day);
  if (day.id === 'D10') html = html.replace('<nav class="day-pager"', `${transition}<nav class="day-pager"`);
  else if (transition) html = html.replace('</header>', `</header>${transition}`);
  const notice = day.entryNotice;
  const context = notice ? `${notice.href && !notice.linkLabel ? '' : `<strong>${esc(notice.label)}</strong>`}${notice.selection ? ' <span data-selected-ticket-compact>선택 기록 없음 · D11에서 한 건을 고르세요.</span>' : ''}${notice.description ? `<p>${esc(notice.description)}</p>` : ''}${notice.href ? ` <a href="${esc(notice.href)}">${esc(notice.linkLabel || notice.label)} →</a>` : ''}`
    : day.phase === 'extend' ? `<strong>작업 대상</strong> ${esc(day.workTarget)}` : '';
  if (context) html = html.replace('</header>', `</header><aside class="day-context">${context}</aside>`);
  return `<article class="course-day" data-day-page="${day.id}" data-phase="${day.phase}">${renderDayStepper(html, day)}</article>`;
}


// DOM 이동으로 남은 레이아웃 공백만 정리한다. 복사할 코드의 공백은 보존한다.
function serializeLayout(root) {
  const walker = root.ownerDocument.createTreeWalker(root, 4);
  let node;
  while ((node = walker.nextNode())) {
    if (!node.parentElement.closest('pre, code, textarea, script') && node.textContent.includes('\n')) node.textContent = node.textContent.replace(/^[ \t]+$/gm, '');
  }
  // diff의 문맥 줄 공백은 HTML 문자 참조로 표현해 복사 원문과 whitespace 검사를 함께 지킨다.
  return root.innerHTML.replace(/^[ \t]+$/gm, blank => blank.replace(/ /g, '&#32;').replace(/\t/g, '&#9;'));
}

// 본문은 모두 서버에서 출력한다. JS는 이 패널들의 표시만 바꾸며, 기존 앵커·코드·접기를 옮겨 보존한다.
function renderDayStepper(html, day) {
  if (!day.steps.length) return renderWarmupStepper(html, day);
  const doc = new JSDOM(`<div>${html}</div>`).window.document;
  const root = doc.body.firstElementChild;
  const today = root.querySelector('.day-today');
  if (!today) return html;
  today.dataset.day = day.id;
  const layout = doc.createElement('div');
  layout.className = 'day-stepper-layout';
  const main = doc.createElement('div');
  main.className = 'day-stepper-main';
  const panel = (suffix, title) => {
    const el = doc.createElement('section');
    el.id = `step-${day.id.toLowerCase()}-${suffix}`;
    el.className = `day-stage day-stage-${suffix}`;
    el.setAttribute('data-day-panel', '');
    const heading = doc.createElement('h2');
    heading.textContent = title;
    el.append(heading);
    return el;
  };
  const prep = panel('prep', '준비 자료 · Java와 오늘 흐름');
  const data = panel('data', '데이터 넣기');
  const wrap = panel('wrap', '마무리 · SQL·말하기·채점');
  const steps = [...root.querySelectorAll('.day-step')];
  // 탐색은 작업대에 모으고 Java·공통 안내는 별도 준비 단계에 남긴다.
  today.remove();
  const overview = root.querySelector('.day-overview');
  if (overview) overview.replaceWith(...overview.childNodes);
  for (const node of [...root.childNodes]) {
    if (node.nodeType !== 1) {
      if (node.nodeType !== 3 || node.textContent.trim()) prep.append(node);
      continue;
    }
    if (node.matches('.day-head, .day-pager, .day-context')) continue;
    if (node.matches('.day-step')) continue;
    if (node.matches('.day-data')) data.append(node);
    else if (node.matches('.day-sql, .day-talk, .day-grade, .day-finish')) wrap.append(node);
    else prep.append(node);
  }
  for (const heading of [...prep.querySelectorAll(':scope > h2')].slice(1)) {
    const section = doc.createElement('section');
    section.className = 'day-prep-section';
    heading.before(section);
    section.append(heading);
    while (section.nextElementSibling && !section.nextElementSibling.matches('h2,hr')) section.append(section.nextElementSibling);
  }
  steps.forEach(step => {
    step.setAttribute('data-day-panel', '');
    if (day.entryNotice?.selection && step === steps.at(-1)) {
      const choice = doc.createElement('p');
      choice.dataset.selectedTicketCompact = '';
      choice.hidden = true;
      step.prepend(choice);
    }
    if (day.id === 'D11') {
      const no = Number(step.dataset.step?.split('-')[1]);
      const branches = no === 1 ? {1:'B14',2:'B11'} : no === 3 ? {1:'B08',2:'B14',3:'B11'} : {};
      const list = step.querySelector('.fact-done > ul');
      if (list) for (const [index, item] of [...list.children].entries()) {
        const ticket = branches[index];
        if (!ticket) continue;
        const fold = doc.createElement('details');
        fold.className = 'step-optional-criteria';
        fold.dataset.criterionTicket = ticket;
        fold.innerHTML = `<summary>${ticket} · ${ticket === 'B14' ? '선택한 경우 확인' : '추가 연습 확인'}</summary><ul></ul>`;
        fold.querySelector('ul').append(item);
        list.after(fold);
      }
    }
    const seenDirectories = new Set();
    for (const directory of step.querySelectorAll('.fact-files .file-directory')) {
      const value = directory.textContent;
      directory.parentElement.title = directory.parentElement.textContent;
      directory.classList.toggle('is-repeat-directory', seenDirectories.has(value));
      seenDirectories.add(value);
    }
    const configs = [...step.querySelectorAll('[data-config-tabs]')];
    if (configs.length) {
      const jump = doc.createElement('a');
      jump.dataset.configJump = '';
      jump.href = `#${configs[0].id}`;
      jump.textContent = '설정 예시 보기 · yml / properties';
      step.querySelector('.fact-files')?.append(jump);
      const index = doc.createElement('nav');
      index.className = 'example-file-index';
      index.setAttribute('aria-label', '설정 파일 바로가기');
      index.innerHTML = configs.map(config => `<a href="#${config.id}">${esc(config.dataset.configFile)} · properties</a>`).join(' · ');
      const answer = step.querySelector('.step-answer');
      answer.querySelector('summary').after(index);
    }
    // 도움말의 기존 details는 그대로 두고, 접기 밖 주석·부연만 별도 접기에 넣는다.
    const help = step.querySelector('.step-help');
    if (help) {
      const extra = [...help.children].filter(node => !node.matches('details'));
      if (extra.length) {
        const fold = doc.createElement('details');
        fold.className = 'step-extra';
        fold.innerHTML = '<summary>추가 안내 보기</summary>';
        extra[0].before(fold);
        extra.forEach(node => fold.append(node));
      }
    }
  });
  const wrapTabs = doc.createElement('nav');
  wrapTabs.className = 'day-wrap-tabs';
  wrapTabs.setAttribute('aria-label', '마무리 순서');
  wrapTabs.setAttribute('hidden', '');
  for (const [cls, key, label] of [['day-sql', 'sql', '오늘의 SQL'], ['day-talk', 'talk', '말하기'], ['day-grade', 'grade', '채점'], ['day-finish', 'finish', '다음 날']]) {
    const section = wrap.querySelector(`.${cls}`);
    if (!section) continue;
    section.id = `step-${day.id.toLowerCase()}-wrap-${key}`;
    section.setAttribute('data-wrap-panel', '');
    const link = doc.createElement('a');
    link.href = `#${section.id}`;
    link.setAttribute('data-wrap-target', section.id);
    link.textContent = label;
    wrapTabs.append(link);
  }
  wrap.firstElementChild.after(wrapTabs);
  const panels = [prep, ...steps, ...(data.querySelector('.day-data') ? [data] : []), wrap];
  const list = today.querySelector('.day-steps');
  list.id = `steps-${day.id.toLowerCase()}`;
  const listToggle = doc.createElement('details');
  listToggle.className = 'day-step-list-toggle';
  listToggle.innerHTML = `<summary aria-controls="${list.id}">다른 단계 보기</summary>`;
  list.after(listToggle);
  const progress = today.querySelector('[data-day-progress]');
  const track = today.querySelector('[data-day-meter]');
  listToggle.after(progress, track);
  for (const item of today.querySelectorAll('.day-chip a')) item.setAttribute('data-panel-link', '');
  for (const extra of [prep, ...(data.querySelector('.day-data') ? [data] : []), wrap]) {
    const li = doc.createElement('li');
    li.className = 'day-stage-item';
    const label = extra === prep ? '준비 자료' : extra === data ? '데이터 넣기' : '마무리: SQL·말하기·채점';
    li.innerHTML = `<input type="checkbox" data-stage-check="${extra.id}" aria-label="${label} 확인"><a href="#${extra.id}" data-panel-link><span class="chip-no" aria-hidden="true">${extra === prep ? '○' : extra === data ? '+' : '✓'}</span><span class="chip-copy"><span class="chip-title">${label}</span></span></a>`;
    list.append(li);
  }
  const tools = doc.createElement('div');
  tools.className = 'day-stepper-tools';
  tools.innerHTML = '<button type="button" data-day-expand aria-pressed="false" hidden>모두 펼쳐 보기</button><p data-day-position role="status" aria-live="polite"></p>';
  today.append(tools);
  const quick = doc.createElement('nav');
  quick.className = 'day-quick-links';
  quick.setAttribute('aria-label', '자주 찾는 자료');
  quick.innerHTML = `${data.querySelector('.day-data') ? `<a href="#${data.id}">데이터 넣기</a> · ` : ''}<a href="#오늘의-sql">오늘의 SQL</a>`;
  tools.after(quick);
  tools.insertAdjacentHTML('afterend', '<p data-stage-progress role="status"></p>');
  if (data.querySelector('.day-data')) {
    const note = doc.createElement('p');
    note.className = 'data-execution-guide';
    note.textContent = `앞선 날 완료 → ${day.id} 테이블 준비 → SQL 복사 → MySQL SQL 편집기에서 실행 → 행·키 확인. 내 테이블 이름에 맞춰 조정하세요.`;
    data.querySelector('.day-data').prepend(note);
    for (const link of data.querySelectorAll('a[href*="start/dummy/README.html"]')) link.href = link.getAttribute('href').replace('.html', `.html?day=${day.id}`);
  }
  panels.forEach((el, index) => {
    const next = panels[index + 1];
    let link = el.querySelector('.step-footer .step-next');
    if (!link && next) {
      const footer = doc.createElement('div');
      footer.className = 'step-footer';
      link = doc.createElement('a');
      link.className = 'step-next';
      footer.append(link);
      el.append(footer);
    }
    if (link && next) {
      link.href = `#${next.id}`;
      link.textContent = next === data ? '다음 순서 · 데이터 넣기 →' : next === wrap ? '다음 순서 · 마무리 →' : `다음 순서 ${NUMS[index] || ''} →`;
    }
    if (index > 0) {
      let footer = el.querySelector('.step-footer');
      if (!footer) { footer = doc.createElement('nav'); footer.className = 'step-footer'; el.append(footer); }
      footer.setAttribute('aria-label', '순서 이동');
      const previous = doc.createElement('a');
      previous.className = 'step-prev';
      previous.href = `#${panels[index - 1].id}`;
      previous.textContent = index === 1 ? '← 준비 자료' : '← 이전 순서';
      footer.prepend(previous);
    }
    main.append(el);
  });
  layout.append(today, main);
  (root.querySelector('.day-context') || root.querySelector('.day-head')).after(layout);
  return serializeLayout(root);
}

// 선택 워밍업은 구현 진도에 합산하지 않고, 원문의 세 장면만 같은 작업대로 묶는다.
function renderWarmupStepper(html, day) {
  const doc = new JSDOM(`<div>${html}</div>`).window.document;
  const root = doc.body.firstElementChild;
  const head = root.querySelector('.day-head');
  const headings = [...root.querySelectorAll(':scope > h2')];
  if (!head || !headings.length) throw new Error(`${day.id}: 워밍업 장면이 없다`);
  const layout = doc.createElement('div');
  layout.className = 'day-stepper-layout';
  const main = doc.createElement('div');
  main.className = 'day-stepper-main';
  const panels = headings.map((heading, index) => {
    const section = doc.createElement('section');
    section.className = 'day-stage day-stage-warmup';
    section.id = `step-${day.id.toLowerCase()}-${index + 1}`;
    section.setAttribute('data-day-panel', '');
    heading.before(section);
    section.append(heading);
    while (section.nextElementSibling && !section.nextElementSibling.matches('h2, .day-pager')) section.append(section.nextElementSibling);
    return section;
  });
  const intro = [...root.children].filter(node => !node.matches('.day-head, .day-stage, .day-pager'));
  for (const node of intro.reverse()) panels[0].firstElementChild.after(node);
  const today = doc.createElement('section');
  today.className = 'day-today';
  today.dataset.day = day.id;
  today.setAttribute('aria-labelledby', '오늘-순서');
  today.innerHTML = '<div class="day-today-head"><p class="day-panel-label">선택 · Java 워밍업</p><h2 id="오늘-순서">오늘 순서</h2></div><p class="day-progress">확인 기록 · 구현 진도와 별도</p><div class="day-stepper-tools"><button type="button" data-day-expand aria-pressed="false" hidden>모두 펼쳐 보기</button><p data-day-position role="status" aria-live="polite"></p></div><ol class="day-steps day-chips"></ol><p class="day-progress-note">체크는 이 브라우저의 확인 기록이며 채점 결과가 아닙니다. 워밍업은 선택입니다.</p>';
  const list = today.querySelector('ol');
  panels.forEach((section, index) => {
    const label = headings[index].textContent.replace(/^#\s*/, '').trim();
    const item = doc.createElement('li');
    item.className = 'day-stage-item';
    item.innerHTML = `<input type="checkbox" data-stage-check="${section.id}" aria-label="${esc(label)} 확인"><a href="#${section.id}" data-panel-link><span class="chip-no" aria-hidden="true">${NUMS[index]}</span><span class="chip-copy"><span class="chip-title">${esc(label)}</span></span></a>`;
    list.append(item);
    if (panels[index + 1]) section.insertAdjacentHTML('beforeend', `<div class="step-footer"><a class="step-next" href="#${panels[index + 1].id}">다음 순서 ${NUMS[index + 1]} →</a></div>`);
    main.append(section);
  });
  layout.append(today, main);
  head.after(layout);
  return serializeLayout(root);
}

// 증상·관찰 도구만 비교한다. 원인과 해법은 티켓의 접기 안에 남긴다.
export function renderTicketSelection(course, fromRel, editable = false) {
  const observe = { B12:'브라우저 Network의 요청·응답', B13:'Security 로그·콜백 응답', B14:'prod 프로필의 curl 응답·Security 인가 규칙', B15:'글 변경·인기글 조회 로그 시각', B16:'요청 응답 시간·스레드 덤프' };
  const choices = course.tickets.filter(t => t.pool).map(t => ({id:t.id,title:t.title,observe:observe[t.id],href:relHref(fromRel,t.page),day:t.id==='B14'?'D11':'D14'}));
  return `<section class="ticket-selection" aria-label="선택 티켓 기록">
  <p><strong>내 선택 티켓</strong> · 후보 5건 중 1건. 고르지 않은 후보는 추가 연습입니다.</p>${editable ? `
  <label>끝까지 처리할 티켓 <select data-ticket-choice><option value="">아직 고르지 않음</option>${choices.map(t=>`<option value="${t.id}">${t.id} · ${esc(t.title)}</option>`).join('')}</select></label>
  <ul class="ticket-comparison">${choices.map(t=>`<li><a href="${esc(t.href)}">${t.id} · ${esc(t.title)}</a> — 관찰: ${t.observe} · ${t.day} 수행</li>`).join('')}</ul>` : ''}
  <p data-record-storage role="status"></p>
  <p data-selected-ticket role="status">선택 기록 없음 · D11에서 한 건을 고르세요.</p>
  <p>B16을 처리하면 장애 훈련은 201/200·1초 이내가 기준입니다. 다른 선택자는 실패 여부와 대응 근거를 기록합니다. E01·모의 장애 훈련은 모두 수행합니다. 선택·체크 기록은 채점 결과가 아닙니다.</p>
  <p><a href="${esc(relHref(fromRel, 'course/spring/D14.html#step-d14-5'))}">모두 할 D14 ⑤ E01</a> · <a href="${esc(relHref(fromRel, 'course/spring/D14.html#step-d14-6'))}">D14 ⑥ 모의 장애 훈련</a></p>
  <script type="application/json" id="course-choice-data">${JSON.stringify(choices).replace(/</g,'\\u003c')}</script>
  </section>`;
}

// ---------------------------------------------------------------- 홈: 과정 v2 진입
export function renderCourseHome(course) {
  const from = 'README.md';
  const href = (target) => relHref(from, target);
  const main = course.days.filter((d) => d.id !== 'D00');
  const first = main[0];
  const coreCount = (d) => d.steps.filter((s) => !isExtraStep(s, course)).length || d.steps.length;
  const stepTotal = main.reduce((n, d) => n + coreCount(d), 0);
  const data = course.days.map((d) => ({ id: d.id, title: d.title, phase: d.phase, phaseLabel: PHASE[d.phase], java: d.java, javaTiming: course.java.find((j) => j.id === d.java)?.timing || 'before', href: href(d.page),
    javaHref: course.java.find((j) => j.id === d.java)?.page ? href(course.java.find((j) => j.id === d.java).page) : null,
    steps: d.steps.map((s) => ({ id: s.id, title: plain(s.short), requirement: stepRequirement(s, d, course), ...(isExtraStep(s, course) ? { extra: true, choiceTickets: s.tickets.filter(id => course.tickets.find(t => t.id === id)?.pool) } : {}) })) }));
  const todaySteps = (d) => d.steps.map((s, i) => `<li><span aria-hidden="true">${NUMS[i]}</span> <a href="${esc(href(d.page))}#step-${d.id.toLowerCase()}-${s.no}">${inline(s.short)}</a></li>`).join('');
  const phases = [['build', '1단계 · 만들기'], ['maintain', '2단계 · 넘겨받기'], ['wrap', '중간 점검'], ['extend', '3단계 · 설계·운영·업무 적용']];
  const dayCell = (d) => `<li class="ch-day" data-day="${d.id}"><a href="${esc(href(d.page))}" title="${esc(d.id + ' · ' + d.title)}"><b>${d.id}</b><span class="ch-day-title">${esc(d.title)}</span><span class="ch-bar" aria-hidden="true"><i style="width:0%"></i></span><small data-day-count>0/${coreCount(d)}</small></a></li>`;
  const javaChips = course.java.map((j) => (j.page
    ? `<a href="${esc(href(j.page))}" title="${esc(j.title)}">${j.id}${j.optional ? '<small>선택</small>' : ''}</a>`
    : `<span>${j.id}</span>`)).join('');
  const ticketChips = course.tickets.filter((t) => !t.enhancement).map((t) => {
    const label = `<b>${t.id}</b>${t.required || t.pool ? `<small>${ticketKind(t)}</small>` : ''}`;
    return t.page ? `<a class="${t.required ? 'is-required' : ''}" href="${esc(href(t.page))}" title="${esc(t.title)}">${label}</a>` : `<span class="is-pending${t.required ? ' is-required' : ''}" title="${esc(t.title)} · 준비 중">${label}</span>`;
  }).join('');
  const readyTickets = course.tickets.filter((t) => t.page && !t.enhancement).length;
  return `<section class="course-home" data-course-home aria-labelledby="course-home-title">
  <div class="ch-intro"><p class="home-eyebrow">Java·Spring 온보딩 과정 v2 · ${main.length}일</p><h1 id="course-home-title">빈 프로젝트로 서버를 만들고, <span>넘겨받은 서버를 고칩니다.</span></h1><p>직접 만들기 → 티켓 처리 → 설계·운영·독립 수행. 오늘의 Java를 연습하고 Spring에서 구현한 뒤, SQL·말하기·채점으로 마무리하세요.</p><div class="ch-cover-badge" aria-hidden="true"><span class="ch-badge-strap"></span><div class="ch-badge-face"><span class="ch-badge-welcome">WELCOME</span><b>JAVA<br>SPRING</b><span class="ch-badge-caption">BACKEND · 45 DAYS</span></div></div></div>
  <div class="ch-hero">
    <article class="ch-today" aria-labelledby="ch-today-title">
      <p class="ch-tag" data-today-tag>오늘 할 일 · 처음 시작</p>
      <h2 id="ch-today-title"><b data-today-id>${first.id}</b> <span data-today-title>${esc(first.title)}</span></h2>
      <p class="ch-today-meta" data-today-meta>${esc(PHASE[first.phase])} · 구현 순서 ${first.steps.length}개 · 오늘의 Java ${esc(first.java)}</p>
      <nav class="ch-actions" data-today-flow aria-label="오늘 진행 순서"><a class="ch-primary" data-today-java href="${esc(href(course.java.find((j) => j.id === first.java).page))}">Java ${esc(first.java)}</a><span aria-hidden="true">→</span><a class="ch-secondary" data-today-open href="${esc(href(first.page))}">Spring ${first.id}</a><span aria-hidden="true">→</span><a class="ch-secondary" data-today-grade href="${esc(href(first.page))}#ai-채점-프롬프트">채점</a></nav>
      <p><a class="ch-resume" data-today-resume hidden></a></p><p data-selected-ticket-compact></p>
      <p class="ch-flow-note">보통 Java 먼저 · D44·D45는 요구 제시·초기 진단 뒤 Java 증거 확인</p>
      <h3 class="ch-steps-label">오늘의 구현 순서 <small>항목을 누르면 작업 위치로 이동합니다</small></h3>
      <ol class="ch-today-steps" data-today-steps>${todaySteps(first)}</ol>
      <p data-course-wrapup></p>
      <p class="ch-note" data-today-note>Java가 처음이면 <a href="${esc(href('course/spring/D00.html'))}">D00 Java 워밍업(선택)</a>을 먼저 하세요.</p>
    </article>
    <aside class="ch-route" aria-labelledby="ch-route-title">
      <h2 id="ch-route-title">45일, 이렇게 이어집니다</h2>
      <ol class="ch-milestones">
        <li><b>01</b><div><small>D01–D10 · 만들기</small><strong>빈 프로젝트에서 서버까지</strong><p>게시판·상점·결제 연동을 직접 구현</p></div></li>
        <li><b>02</b><div><small>D11–D15 · 넘겨받기와 점검</small><strong>결함을 찾고 근거로 고치기</strong><p>4일 티켓 처리 후 D15 중간 점검</p></div></li>
        <li><b>03</b><div><small>D16–D45 · 설계·운영</small><strong>새 요구에서 독립 수행까지</strong><p>배포·재시작 작업·장애·회의 검증</p></div></li>
      </ol>
      <a href="course/map.html">Java·일자·티켓의 관계 지도 →</a>
    </aside>
  </div>
    <section class="ch-progress" aria-labelledby="ch-progress-title">
      <div class="ch-progress-head"><h2 id="ch-progress-title">${main.length}일 진도</h2><p data-progress-summary>체크한 순서 0/${stepTotal}</p></div>
      <p class="ch-progress-note">직접 체크한 진도이며 채점 결과가 아닙니다. 공통 구현과 선택한 티켓을 집계하며, 고르지 않은 후보는 제외합니다. Java 수행 여부와 역량은 따로 확인합니다.</p>
      <p class="ch-progress-key"><span class="ch-key-current">추천 구현일</span><span class="ch-key-done">구현 체크 끝</span><span>각 칸의 수치 = 체크한 순서 / 집계 순서</span></p>
      ${phases.map(([phase, label]) => {
        const days = main.filter(d => d.phase === phase);
        return `<div class="ch-phase-row"><h3 class="ch-phase">${label}<small>${days[0].id}${days.length > 1 ? '–' + days.at(-1).id : ''}</small></h3><ol class="ch-days">${days.map(dayCell).join('')}</ol></div>`;
      }).join('')}
      <p class="ch-progress-note">일자 페이지의 순서 체크가 이 브라우저에 저장되고, 여기서 다음 구현일을 추천합니다. 다른 기기·브라우저에서는 <a href="course/spring/README.html">일자 목록</a>에서 하던 날로 직접 재진입하세요. <span data-course-storage></span></p>
    </section>
  ${renderTicketSelection(course, from).replace('class="ticket-selection"', 'class="ticket-selection ch-ticket-summary"')}
  <div class="ch-entries">
    <article class="ch-entry" data-content-kind="action"><p class="home-eyebrow">일정 · 오늘 할 일</p><h3>일자 페이지 D00~${main.at(-1).id}</h3><p>오늘 순서 → 순서 칸(만들 파일·겪을 것·완료 조건) → 막히면 힌트 → 필요한 구현 예시(1·2단계) → 오늘의 SQL → 말하기 카드와 AI 채점.</p><a href="${esc(href('course/spring/README.html'))}">일자 목록 열기 →</a></article>
    <article class="ch-entry" id="course-java-entry" data-content-kind="practice"><p class="home-eyebrow">연습 · Java · 매일 30~60분</p><h3>같은 날 쓰는 Java 연결</h3><p>J16 이후는 기존 J 재사용과 오늘의 작은 경계 실험입니다. 보통 먼저 연습하고 J44·J45는 수행 중 증거·사후 확인으로 연결합니다. 실행 위치와 완료 조건을 확인하세요.</p><details class="ch-catalog"><summary>Java 연결 ${course.java.length}개 찾아보기</summary><p class="ch-chips">${javaChips}</p></details></article>
    <article class="ch-entry" id="course-ticket-entry" data-content-kind="action"><p class="home-eyebrow">과제 · 2단계 티켓 · 필수 4건 + 선택 1건(Security·Redis 후보)</p><h3>증상만 적힌 티켓 B01~B16</h3><p class="ch-entry-note">필수 B01~B04 + 선택 1건(B12·B13·B14 또는 B15·B16) + <a href="${esc(href('course/tickets/E01.html'))}">고도화 E01</a> + <a href="${esc(href('course/tickets/drill.html'))}">모의 장애 훈련</a>. B05~B11과 고르지 않은 후보는 연습으로 하고, 처리한 것만 채점합니다. 티켓 문서 ${readyTickets}/16 제공 · 학습 완료 표시와 별개입니다.</p><details class="ch-catalog"><summary>티켓 16건 찾아보기</summary><p class="ch-chips ch-ticket-chips">${ticketChips}</p></details></article>
    <article class="ch-entry" data-content-kind="action"><p class="home-eyebrow">3단계 · D16~${main.at(-1).id}</p><h3>설계에서 운영·회의·독립 수행까지</h3><p>미수행 개인 과제 → Java·DB 관찰 → 예약 쿠폰 → 배포·스키마·복원 → 계약·인증·재개 작업 → 새 업무·장애·회의 → 독립 평가. 실제 업무 이슈가 없어도 제공 변형으로 진행합니다.</p><a href="${esc(href('course/spring/D16.html'))}">D16 개인 경로 열기 →</a></article>
    <article class="ch-entry ch-entry-map"><p class="home-eyebrow">과정 지도</p><h3>날·Java·티켓·결함 영역의 관계</h3><p>어느 날의 Java가 어떤 날을 받치고, 2단계 티켓이 어떤 결함 영역에 속하는지 한 장에서 봅니다.</p><a href="${esc(href('course/map.html'))}">과정 지도 열기 →</a></article>
  </div>
  <p>데이터 요구사항으로 테이블을 직접 설계하고 더미 SQL을 내 테이블 이름에 맞춰 붙여 넣습니다. SQL을 매일 풀고, board-server는 구현 예시로 비교합니다.</p>
  <p class="ch-links"><a href="${esc(href('course/README.html'))}">가이드 · 과정 안내</a><a href="${esc(href('course/start/README.html'))}">참고 · 출발 자료</a><a href="${esc(href('course/spec-v2.html'))}">참고 · 서버 명세</a><a href="${esc(href('course/talk-cards.html'))}">말하기 카드 전체</a></p>
  <script type="application/json" id="course-days-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
</section>`;
}

// 기존 홈(시나리오 첫 과제·미리보기·FAQ·설치 안내)은 링크와 이어하기를 그대로 두고 "참고 도감"으로 내린다.
export function renderHomeReference(homeVisualHtml) {
  const demoted = homeVisualHtml.replace(/<h1 id="home-title"([^>]*)>([\s\S]*?)<\/h1>/, '<h2 id="home-title"$1>$2</h2>');
  if (demoted === homeVisualHtml) throw new Error('홈: 기존 제목(#home-title)을 찾지 못했다');
  return `<section class="home-reference" aria-labelledby="home-reference-title"><div class="home-reference-head"><p class="home-eyebrow">참고 도감</p><h2 id="home-reference-title">기존 게시판 시나리오·실전 미션·개념 학습</h2><p>과정 v2 이전에 만든 101단계 시나리오와 공부자료입니다. 일자 페이지 맨 아래 "참고 자료"가 이곳의 문서로 이어집니다. 하던 시나리오 과제의 이어하기 기록도 그대로 남아 있습니다.</p><p>데이터 요구사항으로 테이블을 직접 설계하고 더미 SQL을 내 테이블 이름에 맞춰 붙여 넣습니다. SQL을 매일 풀고, board-server는 구현 예시로 비교합니다.</p>
  <p class="ch-links"><a href="scenario/README.html">서비스 만들기(시나리오)</a><a href="practice/MISSIONS.html">실전 미션</a><a href="docs/knowledge/README.html">개념 학습</a><a href="errors.html">에러 도감</a></p></div>${demoted}</section>`;
}

// ---------------------------------------------------------------- 과정 지도
const KIND_LABEL = { java: 'Java 트랙', day: 'Spring 일자', ticket: '티켓', area: '결함 영역' };
const EDGE_LABEL = { practice: '같은 날 연결 실험 (J44·J45는 수행 중·사후)', ticket: '그날 다루는 티켓', area: '결함 영역' };

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
  const relationItem = (title, fields) => `<li><h4>${title}</h4>${fields.map(([label, value]) => `<div><small>${label}</small>${value}</div>`).join('')}</li>`;
  const dayRows = course.days.map((d) => byId.get(d.id)).map((n) => relationItem(nodeCell(n), [['Java → Spring', list(into(n.id, 'practice'), 'from')], ['Spring → 티켓', list(out(n.id, 'ticket'), 'to')]])).join('');
  const ticketRows = nodes.filter((n) => n.kind === 'ticket').map((n) => relationItem(`${nodeCell(n)} <small>${esc(n.note)}${n.pending ? ' · 페이지 준비 중' : ''}</small>`, [['Spring → 티켓', list(into(n.id, 'ticket'), 'from')], ['티켓 → 결함 영역', list(out(n.id, 'area'), 'to')]])).join('');
  const areaRows = nodes.filter((n) => n.kind === 'area').map((n) => relationItem(esc(n.title), [['무엇이 어긋나나', esc(n.desc)], ['티켓 → 결함 영역', list(into(n.id, 'area'), 'from')]])).join('');
  const graph = { nodes: nodes.map(({ id, kind, title, page, note }) => ({ id, kind, title, href: href(page), note })), edges: course.edges };
  return `<section class="course-map" data-course-map aria-labelledby="cm-title">
  <h2 id="cm-title">관계 지도</h2>
  <p data-cm-progress role="status"></p><button type="button" class="cm-clear" data-cm-current>내 학습 위치 보기</button>
  <script type="application/json" id="course-days-data">${JSON.stringify(course.days.filter(d => d.steps.length).map(d => ({id:d.id, steps:d.steps.map(s => ({id:s.id, extra:isExtraStep(s,course), choiceTickets:s.tickets.filter(id=>course.tickets.find(t=>t.id===id)?.pool)}))}))).replace(/</g, '\\u003c')}</script>
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
  <p class="cm-status" data-cm-status role="status" aria-live="polite">노드를 고르면 관계 보기에 맞는 노드만 밝힙니다. 아래 연결 흐름에 모든 연결이 글로 있습니다.</p>
  <div class="cm-workspace">
    <div class="cm-board-scroll" tabindex="0" role="region" aria-label="전체 관계 노드 목록. 아래로 스크롤하면 나머지 일자가 나옵니다."><div class="cm-board" data-cm-board><svg class="cm-lines" data-cm-lines aria-hidden="true"></svg>${lanes}</div></div>
    <aside class="cm-inspector" aria-label="선택한 노드의 관계와 페이지 이동">
      <h3>선택한 연결</h3>
      <div class="cm-empty"><b>노드 선택 → 관계 확인 → 페이지 열기</b><p>왼쪽에서 Java·일자·티켓을 고르세요. 연결된 학습과 이동 링크가 이곳에 표시됩니다.</p><p>지도는 관계를 선택하는 곳입니다. 문서로 이동하려면 ‘페이지 열기’를 누르세요.</p></div>
      <div class="cm-detail" data-cm-detail hidden></div>
    </aside>
  </div>
  <script type="application/json" id="course-map-data">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>
</section>
<section class="cm-tables" aria-labelledby="cm-table-title">
  <h2 id="cm-table-title">연결 흐름</h2>
  <p>지도와 같은 연결을 글로 적었습니다. 화살표 방향으로 읽습니다: Java → 같은 날 Spring 일자 → 그날 다루는 티켓 → 결함 영역.</p>
  <h3 id="cm-table-days">일자별: 오늘의 Java와 다루는 티켓</h3>
  <ol class="course-outline" aria-label="일자별 연결 흐름">${dayRows}</ol>
  <h3 id="cm-table-tickets">티켓별: 다루는 날과 결함 영역</h3>
  <ol class="course-outline" aria-label="티켓별 연결 흐름">${ticketRows}</ol>
  <h3 id="cm-table-areas">결함 영역별: 속한 티켓</h3>
  <ol class="course-outline" aria-label="결함 영역별 연결 흐름">${areaRows}</ol>
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
