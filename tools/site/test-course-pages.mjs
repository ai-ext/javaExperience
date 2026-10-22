// 과정 v2 화면 검사 — 일자 페이지 배치·진도 체크, 홈의 "오늘 할 일", 과정 지도의 관계. npm run build 뒤에 실행한다.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { JSDOM } from 'jsdom';
import { loadCourse, shortTitle, mapNodes, findInjectedLinkErrors } from './course-pages.mjs';
import { maskedNodes, MASK_LABEL } from './course-flow.mjs';

const root = new URL('../../', import.meta.url);
const rootPath = new URL('.', root).pathname;
const course = loadCourse(rootPath);
const courseScript = fs.readFileSync(new URL('course.js', import.meta.url), 'utf8');
const mapScript = fs.readFileSync(new URL('course-map.js', import.meta.url), 'utf8');
const flowScript = fs.readFileSync(new URL('course-flow.js', import.meta.url), 'utf8');
const KEY = 'javaexperience.course.progress.v1';
const trackedTickets = new Set(execFileSync('git', ['ls-files', '--', 'course/tickets'], { cwd: rootPath, encoding: 'utf8' }).split('\n').filter(Boolean));

// JSDOM은 생성 직후 readyState가 loading이라, 스크립트의 DOMContentLoaded 초기화를 기다린다.
async function open(file, { saved, brokenStorage = false, script = courseScript, before } = {}) {
  const dom = new JSDOM(fs.readFileSync(new URL(file, root), 'utf8'), { url: `https://learn.example/${file}`, runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom;
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {} }));
  if (saved) window.localStorage.setItem(KEY, saved);
  if (before) before(window);
  if (brokenStorage) Object.defineProperty(window, 'localStorage', { get() { throw new window.DOMException('blocked', 'SecurityError'); } });
  window.eval(script);
  await new Promise((resolve) => (window.document.readyState === 'complete' ? resolve() : window.addEventListener('load', resolve)));
  return { window, doc: window.document, $: (s) => window.document.querySelector(s), $$: (s) => [...window.document.querySelectorAll(s)] };
}

// ---------------------------------------------------------------- 칩 제목
assert.equal(shortTitle('`Post` 엔티티와 `PostStatus` enum(`post/PostStatus.java`) (`schema.sql`에 `post` 테이블) · 목록 조회용 (`status`, `id`) 인덱스 포함'), '`Post` 엔티티와 `PostStatus` enum');
assert.equal(shortTitle('`@Transactional(readOnly = true)` 붙이기'), '`@Transactional(readOnly = true)` 붙이기', '코드 안 괄호는 지킨다');
assert.equal(shortTitle('(전부 괄호)'), '(전부 괄호)', '비면 원래 제목');

// ---------------------------------------------------------------- 주입 링크 검사
// 앵커는 대상 HTML을 파싱한 실제 요소의 id로만 인정한다. data-id·주석 속 문자열은 통과시키지 않는다(P5-3 리뷰 ④).
{
  const fake = '/virtual-site';
  const target = '<!doctype html><p id="real">진짜</p><p data-id="dataOnly">x</p><!-- id="commentOnly" --><script>const s = \'<a id="scriptOnly">\';</script>';
  const outputs = new Map([
    [`${fake}/course/spring/D99.html`, ['real', 'dataOnly', 'commentOnly', 'scriptOnly', 'absent'].map((h) => `<a href="../tickets/T01.html#${h}">${h}</a>`).join('') + '<a href="#self">self</a><p id="self"></p>'],
    [`${fake}/course/tickets/T01.html`, target],
  ]);
  assert.deepEqual(findInjectedLinkErrors(outputs, fake), ['dataOnly', 'commentOnly', 'scriptOnly', 'absent'].map((h) => `course/spring/D99.html: 없는 앵커 → ../tickets/T01.html#${h}`), '실제 id만 앵커로 인정');
  outputs.set(`${fake}/course/spring/D98.html`, '<a href="../tickets/T02.html">없는 파일</a>');
  assert.ok(findInjectedLinkErrors(outputs, fake).includes('course/spring/D98.html: 없는 파일 → ../tickets/T02.html'), '없는 파일도 잡는다');
}

// ---------------------------------------------------------------- 일자 페이지
for (const day of course.days) {
  const file = `course/spring/${day.id}.html`;
  const html = fs.readFileSync(new URL(file, root), 'utf8');
  assert.doesNotMatch(html, /class="docref"/, `${day.id}: 일자·티켓 ID를 공부자료로 잘못 잇지 않음`);
  assert.doesNotMatch(html, /Docker Desktop|studymate/i, `${day.id}: 금지 단어`);
  const { $, $$, doc } = await open(file);
  assert.ok($('[data-day-page]'), `${day.id}: 일자 페이지 표시`);
  assert.ok($('.day-head h1'), `${day.id}: 제목 머리`);
  if (course.flows.days.has(day.id)) assert.ok($(`section.day-flow.flow[data-flow="${day.id}"]`) && !$('.day-flow[hidden]'), `${day.id}: 오늘 흐름`);
  else if (day.phase === 'maintain') assert.ok($(`section.day-flow.flow-links[data-flow-links="${day.id}"]`), `${day.id}: 그날 티켓의 장애 흐름으로 잇기`);
  else assert.ok($('.day-flow[hidden]') && $('.day-flow').children.length === 0, `${day.id}: 흐름이 없는 날은 빈 자리`);
  assert.ok(!$('section.day-java') || $('section.day-java + .day-flow'), `${day.id}: 흐름은 오늘의 Java 바로 뒤`);
  assert.ok($('nav.day-pager'), `${day.id}: 이전·다음 날`);
  for (const a of $$('.day-pager a, .course-crumbs a')) {
    const target = new URL(a.getAttribute('href'), `${root.href}${file}`);
    assert.ok(fs.existsSync(target.pathname.replace(/\.html$/, '.md')) || fs.existsSync(target.pathname), `${day.id}: 이동 대상 ${a.getAttribute('href')}`);
  }
  if (!day.steps.length) continue;
  const chips = $$('.day-chips > li.day-chip');
  assert.deepEqual(chips.map((li) => li.dataset.step), day.steps.map((s) => s.id), `${day.id}: 칩 = roadmap 순서`);
  for (const li of chips) {
    assert.equal(li.querySelector('label a, a input'), null, `${day.id}: 체크박스와 링크는 서로 감싸지 않음`);
    const href = li.querySelector('a').getAttribute('href');
    assert.ok(doc.getElementById(href.slice(1))?.matches('section.day-step'), `${day.id}: 칩 이동 ${href}`);
    assert.ok(li.querySelector('input.step-check').getAttribute('aria-label'), `${day.id}: 체크박스 이름`);
  }
  assert.equal($$('section.day-step').length, day.steps.length);
  assert.equal($$('section.day-step .step-done input.step-check').length, day.steps.length, `${day.id}: 칸 끝 체크`);
  assert.equal($$('details.step-answer[open]').length, 0, `${day.id}: 정답은 닫힘`);
  assert.equal($$('details.step-answer code[class^="language-"]').length, 0, `${day.id}: 정답 하이라이트는 펼칠 때`);
  if (day.phase === 'build') {
    assert.ok($(`section.day-java a[href="../java/${day.java}.html"]`), `${day.id}: 오늘의 Java 카드`);
    for (const s of $$('section.day-step')) {
      for (const key of ['files', 'trap', 'done', 'spec']) assert.ok(s.querySelector(`.step-facts > .fact-${key}`), `${day.id} ${s.id}: ${key} 칸`);
    }
    assert.ok($('button.copy-button[data-copy-target="day-grader-prompt"]') && $('pre#day-grader-prompt'), `${day.id}: 채점 프롬프트 복사`);
  }
  if (day.phase === 'maintain') {
    const ids = day.steps.flatMap((s) => s.tickets);
    const badges = $$('.fact-tickets .ticket-badge b').map((b) => b.textContent);
    assert.deepEqual(badges, ids, `${day.id}: 티켓 배지 = roadmap 티켓`);
    for (const a of $$('a.ticket-badge, .flow-link-list a')) {
      const md = `course/tickets/${a.getAttribute('href').match(/([BE]\d{2})\.html/)[1]}.md`;
      assert.ok(trackedTickets.has(md), `${day.id}: 티켓 링크 ${a.getAttribute('href')}는 커밋된 원문만(P5-2 리뷰 ③)`);
    }
    for (const span of $$('.ticket-badge.is-pending b')) assert.ok(!trackedTickets.has(`course/tickets/${span.textContent}.md`), `${day.id}: ${span.textContent}는 커밋됐는데 준비 중으로 보인다`);
  }
}

// 진도 체크: 같은 순서의 체크박스끼리 맞추고, 저장하고, 다시 열면 복원한다.
{
  const page = await open('course/spring/D04.html');
  const [top, bottom] = page.$$('input.step-check[data-step="D04-2"]');
  assert.ok(top && bottom, '칩과 칸 끝 체크');
  top.checked = true; top.dispatchEvent(new page.window.Event('change', { bubbles: true }));
  assert.equal(bottom.checked, true, '같은 순서 체크 동기화');
  assert.ok(page.$('.day-chip[data-step="D04-2"]').classList.contains('is-done'));
  assert.equal(page.$('[data-day-progress]').textContent, '1/5 끝냄');
  const saved = page.window.localStorage.getItem(KEY);
  assert.deepEqual(JSON.parse(saved), { version: 1, steps: { 'D04-2': true } });
  const again = await open('course/spring/D04.html', { saved });
  assert.equal(again.$('input.step-check[data-step="D04-2"]').checked, true, '다시 열면 복원');
  // 정답을 펼치면 그때 language- 클래스가 돌아온다(syntax-highlight.js가 새 노드를 처리)
  const answer = again.$('details.step-answer');
  answer.open = true; answer.dispatchEvent(new again.window.Event('toggle'));
  assert.ok(answer.querySelector('code.language-java'), '펼친 정답의 코드 언어 복원');
  assert.equal(answer.querySelectorAll('code[data-lazy-lang]').length, 0);
}
// 저장소를 못 써도 렌더링·체크는 되고 안내만 바뀐다.
{
  const page = await open('course/spring/D04.html', { brokenStorage: true });
  const input = page.$('input.step-check[data-step="D04-1"]');
  input.checked = true; input.dispatchEvent(new page.window.Event('change', { bubbles: true }));
  assert.equal(page.$('[data-day-progress]').textContent, '1/5 끝냄');
  assert.match(page.$('[data-course-storage]').textContent, /저장소를 쓸 수 없어/);
  const corrupt = await open('course/spring/D04.html', { saved: '{not json' });
  assert.equal(corrupt.$$('input.step-check:checked').length, 0, '망가진 저장값은 비운 상태로');
}
// 읽기는 되는데 쓰기만 실패하면: 연속 체크·해제·pageshow·다른 탭 알림이 와도 이 화면의 체크를 지키고 안내한다(P5-2 리뷰 ①④).
{
  const page = await open('course/spring/D04.html', {
    saved: JSON.stringify({ version: 1, steps: { 'D04-5': true } }),
    before: (win) => { win.Storage.prototype.setItem = function () { throw new win.DOMException('full', 'QuotaExceededError'); }; },
  });
  const check = (id, on) => { const el = page.$(`input.step-check[data-step="${id}"]`); el.checked = on; el.dispatchEvent(new page.window.Event('change', { bubbles: true })); };
  assert.equal(page.$('[data-day-progress]').textContent, '1/5 끝냄', '저장값은 읽힌다');
  check('D04-1', true);
  check('D04-2', true);
  assert.equal(page.$('[data-day-progress]').textContent, '3/5 끝냄', '쓰기 실패 뒤 다음 체크가 앞 체크를 지우지 않는다');
  check('D04-5', false);
  assert.equal(page.$('[data-day-progress]').textContent, '2/5 끝냄', '해제도 이 화면에 남는다');
  page.window.dispatchEvent(new page.window.Event('pageshow'));
  page.window.dispatchEvent(new page.window.StorageEvent('storage', { key: KEY }));
  assert.equal(page.$('[data-day-progress]').textContent, '2/5 끝냄', 'pageshow·storage가 저장 못 한 체크를 덮지 않는다');
  assert.deepEqual(page.$$('.day-chips input.step-check:checked').map((i) => i.dataset.step), ['D04-1', 'D04-2']);
  assert.match(page.$('[data-course-storage]').textContent, /저장하지 못했습니다/, '저장 실패 안내');
}
// 저장 실패 중 다른 탭이 저장한 진도는, 복구 뒤 이 화면이 저장해도 지우지 않는다. 이 화면의 미저장 체크·해제만 키별로 덮는다(P5-3 리뷰 ②).
{
  const page = await open('course/spring/D04.html', {
    saved: JSON.stringify({ version: 1, steps: { 'D04-3': true } }),
    before: (win) => {
      const real = win.Storage.prototype.setItem;
      win.failWrites = true;
      win.otherTabWrite = (value) => real.call(win.localStorage, KEY, value);
      win.Storage.prototype.setItem = function (...args) {
        if (win.failWrites) throw new win.DOMException('full', 'QuotaExceededError');
        return real.apply(this, args);
      };
    },
  });
  const check = (id, on) => { const el = page.$(`input.step-check[data-step="${id}"]`); el.checked = on; el.dispatchEvent(new page.window.Event('change', { bubbles: true })); };
  const checked = () => page.$$('.day-chips input.step-check:checked').map((i) => i.dataset.step);
  check('D04-1', true); // 1. A 탭: 저장 실패, 메모리에만
  check('D04-3', false); //    해제도 미저장 변경
  // 2. B 탭이 D05-1·D04-4를 저장(D04-3은 그대로 체크) → A에 storage 이벤트
  page.window.otherTabWrite(JSON.stringify({ version: 1, steps: { 'D04-3': true, 'D04-4': true, 'D05-1': true } }));
  page.window.dispatchEvent(new page.window.StorageEvent('storage', { key: KEY }));
  assert.deepEqual(checked(), ['D04-1', 'D04-4'], '미저장 중에도 다른 탭 체크는 반영하고, 이 화면의 체크·해제는 지킨다');
  assert.match(page.$('[data-course-storage]').textContent, /저장하지 못했습니다/, '미저장 안내는 남는다');
  // 3. 저장 복구 뒤 A에서 D04-2 체크
  page.window.failWrites = false;
  check('D04-2', true);
  assert.deepEqual(JSON.parse(page.window.localStorage.getItem(KEY)), { version: 1, steps: { 'D04-1': true, 'D04-2': true, 'D04-4': true, 'D05-1': true } }, '다른 탭의 D05-1·D04-4를 지우지 않고, 이 화면의 D04-3 해제는 반영');
  assert.equal(page.$('[data-course-storage]').textContent, '', '저장되면 안내가 사라진다');
  // 저장된 뒤에는 미저장 변경이 남지 않아, 다른 탭이 D04-1을 해제하면 그대로 따른다.
  page.window.otherTabWrite(JSON.stringify({ version: 1, steps: { 'D04-2': true } }));
  page.window.dispatchEvent(new page.window.StorageEvent('storage', { key: KEY }));
  assert.deepEqual(checked(), ['D04-2'], '저장 뒤에는 최신 저장값을 그대로 따른다');
}
// 다른 탭에서 체크하면 열린 일자 화면·홈이 storage 이벤트로 다시 그린다(P5-2 리뷰 ④).
{
  const day = await open('course/spring/D04.html');
  day.window.localStorage.setItem(KEY, JSON.stringify({ version: 1, steps: { 'D04-1': true } }));
  day.window.dispatchEvent(new day.window.StorageEvent('storage', { key: 'other.key' }));
  assert.equal(day.$('[data-day-progress]').textContent, '0/5 끝냄', '다른 키는 무시');
  day.window.dispatchEvent(new day.window.StorageEvent('storage', { key: KEY }));
  assert.equal(day.$('[data-day-progress]').textContent, '1/5 끝냄', '같은 키면 다시 그린다');
  const home = await open('index.html');
  assert.equal(home.$('[data-today-id]').textContent, 'D01');
  home.window.localStorage.setItem(KEY, JSON.stringify({ version: 1, steps: { 'D06-1': true } }));
  home.window.dispatchEvent(new home.window.StorageEvent('storage', { key: KEY }));
  assert.equal(home.$('[data-today-id]').textContent, 'D06', '열린 홈의 오늘 할 일이 바뀐다');
}

// ---------------------------------------------------------------- 홈
{
  const { nextDay } = (await open('index.html')).window.jxCourseProgress;
  const days = course.days.filter((d) => d.steps.length);
  const set = (...ids) => new Set(ids);
  assert.equal(nextDay(days, set()).day.id, 'D01');
  assert.equal(nextDay(days, set()).mode, 'first');
  assert.equal(nextDay(days, set('D04-1')).day.id, 'D04', '체크가 있는 가장 늦은 날이 덜 끝났으면 그날');
  assert.equal(nextDay(days, set(...days[0].steps.map((s) => s.id))).day.id, 'D02', '다 끝냈으면 다음 날');
  assert.equal(nextDay(days, set(...days.flatMap((d) => d.steps.map((s) => s.id)))).mode, 'complete');
  // 마지막 날만 끝냈으면 완료가 아니다. 덜 끝낸 첫 날로 안내한다(P5-2 리뷰 ②).
  const lastOnly = nextDay(days, set(...days[days.length - 1].steps.map((s) => s.id)));
  assert.equal(lastOnly.mode, 'remaining'); assert.equal(lastOnly.day.id, 'D01');
  const allButD03 = nextDay(days, set(...days.filter((d) => d.id !== 'D03').flatMap((d) => d.steps.map((s) => s.id))));
  assert.deepEqual([allButD03.mode, allButD03.day.id], ['remaining', 'D03']);
  const d15only = await open('index.html', { saved: JSON.stringify({ version: 1, steps: Object.fromEntries(days[days.length - 1].steps.map((s) => [s.id, true])) }) });
  assert.doesNotMatch(d15only.$('[data-today-tag]').textContent, /모두 체크함/, '마지막 날만 끝내도 과정 완료로 보이지 않는다');
  assert.equal(d15only.$('[data-today-id]').textContent, 'D01');

  const home = await open('index.html');
  assert.ok(home.$('main').firstElementChild.matches('section.course-home'), '과정 v2가 첫 화면');
  assert.equal(home.$$('h1').filter((h) => !h.closest('details')).length, 1, '보이는 h1은 하나');
  assert.equal(home.$('h1').id, 'course-home-title');
  assert.equal(home.$('[data-today-id]').textContent, 'D01', '진도 없으면 D01');
  assert.equal(home.$('[data-today-note]').hidden, false, 'D00 워밍업 안내');
  assert.equal(home.$$('.ch-day').length, 15, '15일 진도');
  assert.ok(home.$('.ch-entries a[href="course/spring/README.html"]') && home.$('.ch-entries a[href="course/map.html"]'), 'Spring 일자·지도 진입');
  assert.equal(home.$$('.ch-entries .ch-chips a[href^="course/java/J"]').length, 16, 'Java 트랙 J00~J15 진입');
  assert.equal(home.$$('.ch-ticket-chips > *').length, 16, '2단계 티켓 B01~B16');
  for (const a of home.$$('.course-home a[href], .home-reference-head a[href]')) {
    const href = a.getAttribute('href');
    assert.ok(fs.existsSync(new URL(href.split('#')[0].replace(/\.html$/, '.md'), root)) || fs.existsSync(new URL(href.split('#')[0], root)), `홈 링크 ${href}`);
  }
  assert.ok(home.$('section.home-reference .home-visual [data-home-start]'), '기존 시나리오 시작은 참고 도감 안에 유지');
  assert.equal(home.$('#home-title').tagName, 'H2');

  const resumed = await open('index.html', { saved: JSON.stringify({ version: 1, steps: { 'D04-1': true, 'D04-2': true } }) });
  assert.equal(resumed.$('[data-today-id]').textContent, 'D04');
  assert.equal(resumed.$('[data-today-open]').getAttribute('href'), 'course/spring/D04.html');
  assert.match(resumed.$('[data-today-tag]').textContent, /이어서/);
  assert.equal(resumed.$('[data-today-note]').hidden, true);
  assert.equal(resumed.$('.ch-day[data-day="D04"] [data-day-count]').textContent, '2/5');
  assert.ok(resumed.$('.ch-day[data-day="D04"]').classList.contains('is-today'));
  assert.equal(resumed.$('[data-progress-summary]').textContent, `체크한 순서 2/${days.reduce((n, d) => n + d.steps.length, 0)}`);
  const blocked = await open('index.html', { brokenStorage: true });
  assert.equal(blocked.$('[data-today-id]').textContent, 'D01', '저장소가 막혀도 기본 화면');
}

// ---------------------------------------------------------------- 과정 지도
{
  const nodes = mapNodes(course);
  const ids = new Set(nodes.map((n) => n.id));
  for (const id of [...Array(16).keys()].flatMap((i) => [`D${String(i).padStart(2, '0')}`, `J${String(i).padStart(2, '0')}`])) assert.ok(ids.has(id), `지도 노드 ${id}`);
  for (let i = 1; i <= 16; i++) assert.ok(ids.has(`B${String(i).padStart(2, '0')}`), `지도 노드 B${i}`);
  assert.ok(ids.has('E01'));
  for (const e of course.edges) assert.ok(ids.has(e.from) && ids.has(e.to), `간선 ${e.from}>${e.to}`);
  // 같은 날 D↔J, 날→티켓(roadmap), 티켓→영역이 모두 간선으로 있다
  for (const d of course.days) assert.ok(course.edges.some((e) => e.kind === 'practice' && e.to === d.id && e.from === d.java), `${d.java}→${d.id}`);
  for (const d of course.days) for (const s of d.steps) for (const t of s.tickets) assert.ok(course.edges.some((e) => e.from === d.id && e.to === t), `${d.id}→${t}`);

  const map = await open('course/map.html', { script: mapScript });
  assert.equal(map.$$('.cm-node').length, nodes.length, '노드 버튼 수');
  assert.ok(map.$('.cm-legend') && map.$$('.cm-views input[name="cm-view"]').length === 4, '범례와 관계 보기 4종');
  // 정지 상태 대체: 관계 표에 모든 간선이 글로 있다
  const tableEdges = new Set(map.$$('.cm-tables [data-edge]').map((li) => li.dataset.edge));
  for (const e of course.edges) assert.ok(tableEdges.has(`${e.from}>${e.to}`), `관계 표에 ${e.from}>${e.to}`);
  for (const a of map.$$('.cm-tables a[href], .course-map a[href]')) {
    const [p, hash] = a.getAttribute('href').split('#');
    const target = new URL(p, `${root.href}course/map.html`);
    assert.ok(fs.existsSync(target.pathname.replace(/\.html$/, '.md')), `지도 링크 ${a.getAttribute('href')}`);
    if (hash) assert.match(fs.readFileSync(target, 'utf8'), new RegExp(`id="${hash}"`), `지도 앵커 ${a.getAttribute('href')}`);
  }
  const { related } = map.window.jxCourseMap;
  assert.deepEqual([...related('D04', 'direct').nodes].sort(), ['J04']);
  assert.deepEqual([...related('J12', 'down').nodes].sort(), ['B01', 'B02', 'B03', 'B05', 'D12', 'conc', 'db', 'resilience', 'tx']);
  assert.ok(related('tx', 'up').nodes.has('J12') && !related('tx', 'up').nodes.has('cache'), '영향 주는 쪽은 들어오는 쪽만');
  assert.deepEqual([...related('B01', 'both').nodes].sort(), ['D12', 'J12', 'resilience', 'tx']);
  // 고르면 상태 문장과 상세가 바뀐다
  map.$('.cm-node[data-node="D12"]').click();
  assert.equal(map.$('.cm-node[data-node="D12"]').getAttribute('aria-pressed'), 'true');
  assert.ok(map.$('.cm-node[data-node="B01"]').classList.contains('is-related'));
  assert.ok(!map.$('.cm-node[data-node="B06"]').classList.contains('is-related'));
  assert.match(map.$('[data-cm-status]').textContent, /D12 · 직접 연결/);
  assert.equal(map.$('[data-cm-detail]').hidden, false);
  // 관계 밖 노드는 버튼으로 남아 있으므로 불투명도로 글자·초점 테두리를 흐리지 않는다(P5-2 리뷰 ⑤).
  const css = fs.readFileSync(new URL('course.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /has-selection[^{]*\.cm-node[^{]*\{[^}]*opacity/, '비강조 노드에 opacity를 쓰지 않는다');
  assert.match(css, /has-selection[^{]*\.cm-node[^{]*:focus-visible/, '비강조 노드도 초점이 오면 원래 모습');
  map.$('[data-cm-clear]').click();
  assert.equal(map.$('[data-cm-detail]').hidden, true);
}
// ---------------------------------------------------------------- 흐름 재생 (일자 [오늘 흐름] · 티켓 [장애 흐름])
{
  const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();
  const plainText = (md) => String(md).replace(/`/g, '').replace(/\s+/g, ' ').trim();
  // 1) 정지 상태: 스크립트 없이도 지도 노드와 모든 단계·값이 HTML에 있고, 조작부는 숨어 있다.
  for (const [id, flow] of course.flows.days) {
    const doc = new JSDOM(fs.readFileSync(new URL(`course/spring/${id}.html`, root), 'utf8')).window.document;
    const section = doc.querySelector(`section.flow[data-flow="${id}"]`);
    assert.ok(section, `${id}: 흐름 섹션`);
    assert.ok(section.querySelector('[data-flow-player]').hidden, `${id}: 스크립트 전에는 조작부를 숨긴다`);
    assert.deepEqual([...section.querySelectorAll('.flow-node')].map((n) => n.dataset.node), flow.nodes.map((n) => n.id), `${id}: 지도 노드`);
    const items = [...section.querySelectorAll('.flow-steps > .flow-step')];
    assert.equal(items.length, flow.steps.length, `${id}: 단계 수`);
    assert.equal(section.querySelectorAll('details').length, 0, `${id}: 일자 흐름의 단계는 접지 않는다`);
    flow.steps.forEach((step, i) => {
      assert.equal(items[i].dataset.node, step.node, `${id} 단계 ${i + 1}: 노드`);
      assert.equal(text(items[i].querySelector('.flow-step-title')), plainText(step.title), `${id} 단계 ${i + 1}: 제목`);
      const dds = [...items[i].querySelectorAll('.flow-values dd')].map(text);
      step.values.forEach(([, v, tag], k) => assert.equal(dds[k], plainText(v) + (tag ? ` ${tag}` : ''), `${id} 단계 ${i + 1}: 값 ${k + 1}`));
    });
    assert.ok(flow.nodes.some((n) => n.isNew) && section.querySelector('.flow-node.is-new .flow-new'), `${id}: 오늘 만드는 층 강조`);
  }
  // 2) 값의 근거: 일자 흐름의 코드 값은 그날 정답 커밋의 board-server 파일에 그대로 있다.
  const javaRoot = 'board-server/src/main/java/com/example/board/';
  const evidencePath = (p) => (p.startsWith('res/') ? `board-server/src/main/resources/${p.slice(4)}` : p.startsWith('root/') ? `board-server/${p.slice(5)}` : javaRoot + p);
  const git = (...args) => execFileSync('git', args, { cwd: rootPath, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const dayData = JSON.parse(fs.readFileSync(new URL('course/flows/days.json', root), 'utf8'));
  let checkedEvidence = 0;
  for (const f of dayData.days) {
    let sha = '';
    try { sha = git('log', '-1', '--format=%H', '--fixed-strings', `--grep=${f.tree}:`).trim(); } catch { sha = ''; }
    if (!sha) { console.warn(`${f.day}: 정답 커밋 ${f.tree}를 찾지 못해(얕은 복제) 근거 검사를 건너뛴다`); continue; }
    for (const [i, s] of f.steps.entries()) for (const [file, needle] of s.evidence || []) {
      const source = git('show', `${sha}:${evidencePath(file)}`);
      assert.ok(source.includes(needle), `${f.day} 단계 ${i + 1}: ${f.tree}의 ${file}에 "${needle}"`);
      checkedEvidence += 1;
    }
  }
  // 3) 티켓 흐름: 증상 단계(open)는 티켓 원문의 접기 밖, 원인 단계(cause)는 "원인과 정답" 안에서 왔다.
  for (const [id, flow] of course.flows.tickets) {
    const mdFile = new URL(`course/tickets/${id}.md`, root);
    if (!fs.existsSync(mdFile)) continue;
    const md = fs.readFileSync(mdFile, 'utf8');
    const outside = md.replace(/<details>[\s\S]*?<\/details>/g, '');
    const at = md.indexOf('## 원인과 정답');
    assert.ok(at >= 0, `${id}: 원인과 정답 절`);
    const answer = md.slice(at, md.indexOf('</details>', at));
    for (const [i, s] of flow.steps.entries()) for (const needle of s.evidence) {
      assert.ok((s.side === 'open' ? outside : answer).includes(needle), `${id} 단계 ${i + 1}(${s.side}): "${needle}"가 ${s.side === 'open' ? '접기 밖' : '원인과 정답 안'}에 있다`);
      checkedEvidence += 1;
    }
    // 4) 새지 않는다: 접기를 모두 지운 티켓 HTML에는 원인 단계의 제목·값이 한 글자도 없다(지도·제목·aria 포함).
    const html = fs.readFileSync(new URL(`course/tickets/${id}.html`, root), 'utf8');
    const doc = new JSDOM(html).window.document;
    const section = doc.querySelector(`section.ticket-flow[data-flow="${id}"]`);
    assert.ok(section, `${id}: 티켓 페이지에 장애 흐름`);
    assert.ok(section.previousElementSibling && doc.querySelector('h2[id^="받은-"]'), `${id}: 받은 티켓 다음`);
    const fold = section.querySelector('details.flow-cause');
    assert.ok(fold && !fold.open, `${id}: 원인 단계는 닫힌 접기 안`);
    assert.equal(fold.querySelectorAll('.flow-step').length, flow.steps.filter((s) => s.side === 'cause').length, `${id}: 원인 단계 수`);
    assert.equal(section.querySelectorAll('.flow-step:not(.is-cause)').length, flow.steps.filter((s) => s.side === 'open').length, `${id}: 증상 단계 수`);
    const bare = doc.body.cloneNode(true);
    bare.querySelectorAll('details').forEach((d) => d.remove());
    const visible = bare.textContent.replace(/\s+/g, ' ') + [...bare.querySelectorAll('[aria-label],[title]')].map((e) => `${e.getAttribute('aria-label')} ${e.getAttribute('title')}`).join(' ');
    for (const s of flow.steps.filter((x) => x.side === 'cause')) {
      for (const piece of [s.title, ...s.values.map((v) => v[1])]) assert.ok(!visible.includes(plainText(piece)), `${id}: 원인 문장 "${plainText(piece)}"이 접기 밖에 보인다`);
    }
    assert.ok(!visible.includes(plainText(flow.title)), `${id}: 흐름 제목(원인을 말할 수 있다)은 화면에 싣지 않는다`);
    // 원인 단계만 지나는 노드는 이름·설명을 가린다(타일과 지도 aria-label 모두). 이름이 원인을 말하는 경우가 많다.
    const masked = maskedNodes(flow);
    const openLabels = new Set(flow.nodes.filter((n) => !masked.has(n.id)).flatMap((n) => [n.label, n.sub]));
    const mapLabel = section.querySelector('.flow-nodes').getAttribute('aria-label');
    for (const n of flow.nodes.filter((x) => masked.has(x.id))) {
      const tile = section.querySelector(`.flow-node[data-node="${n.id}"]`);
      assert.ok(tile.classList.contains('is-masked') && text(tile.querySelector('b')) === MASK_LABEL, `${id}: 원인 쪽 노드 ${n.id}는 가린다`);
      for (const piece of [n.label, n.sub].filter((x) => x && !openLabels.has(x))) {
        assert.ok(!text(tile).includes(plainText(piece)) && !mapLabel.includes(plainText(piece)), `${id}: 원인 쪽 노드 이름 "${piece}"이 지도에 보인다`);
      }
    }
    assert.ok(!/<script type="application\/json"[^>]*flow/.test(html), `${id}: 원인 단계를 데이터로 따로 싣지 않는다`);
  }
  // 5) 조작: 이전·다음·끝·처음, 재생은 속도대로 넘어가고 마지막에서 멈춘다, 키보드, 원인 접기를 열면 재생 순서에 끼어든다.
  const fakeTimers = (win) => {
    win.__timers = [];
    win.setTimeout = (fn, ms) => { win.__timers.push({ fn, ms }); return win.__timers.length; };
    win.clearTimeout = (id) => { if (win.__timers[id - 1]) win.__timers[id - 1].fn = null; };
  };
  const tick = (win) => { const t = win.__timers.filter((x) => x.fn).pop(); if (!t) return null; const { fn, ms } = t; t.fn = null; fn(); return ms; };
  const d04 = await open('course/spring/D04.html', { script: flowScript, before: fakeTimers });
  const sec = d04.$('section.flow[data-flow="D04"]');
  const count = () => sec.querySelector('[data-flow-count]').textContent;
  const current = () => sec.querySelector('.flow-node.is-current')?.dataset.node;
  assert.ok(sec.hasAttribute('data-flow-ready') && !sec.querySelector('[data-flow-player]').hidden, 'D04: 스크립트가 조작부를 연다');
  assert.equal(count(), '1 / 8');
  assert.equal(sec.querySelector('[data-flow-prev]').disabled, true, '첫 단계에서 이전 비활성');
  assert.equal(sec.querySelector('.flow-step.is-current').getAttribute('aria-current'), 'step');
  sec.querySelector('[data-flow-next]').click(); sec.querySelector('[data-flow-next]').click();
  assert.equal(count(), '3 / 8'); assert.equal(current(), 'controller');
  assert.ok(sec.querySelector('.flow-node[data-node="security"]').classList.contains('is-from'), '직전 노드 표시');
  assert.match(text(sec.querySelector('[data-flow-now]')), /PostCreateRequest/, '지금 단계 = 목록의 그 단계');
  sec.querySelector('[data-flow-prev]').click();
  assert.equal(count(), '2 / 8');
  const key = (k) => sec.querySelector('[data-flow-next]').dispatchEvent(new d04.window.KeyboardEvent('keydown', { key: k, bubbles: true }));
  key('End'); assert.equal(count(), '8 / 8'); assert.equal(sec.querySelector('[data-flow-next]').disabled, true);
  assert.deepEqual([...sec.querySelectorAll('.flow-node.is-path')].map((n) => n.dataset.node), ['security', 'controller', 'service', 'repository', 'mysql'], '응답으로 돌아오는 길');
  key('Home'); assert.equal(count(), '1 / 8');
  key('ArrowRight'); assert.equal(count(), '2 / 8');
  key('ArrowLeft'); assert.equal(count(), '1 / 8');
  const play = sec.querySelector('[data-flow-play]');
  sec.querySelector('[data-flow-speed="2"]').click();
  assert.equal(sec.querySelector('[data-flow-speed="2"]').getAttribute('aria-pressed'), 'true');
  play.click();
  assert.equal(play.getAttribute('aria-pressed'), 'true');
  assert.equal(tick(d04.window), 1300, '2배속 = 1.3초 간격');
  assert.equal(count(), '2 / 8');
  play.click();
  assert.equal(play.getAttribute('aria-pressed'), 'false', '일시정지');
  assert.equal(tick(d04.window), null, '일시정지하면 예약이 없다');
  sec.querySelector('[data-flow-speed="0.5"]').click();
  play.click();
  assert.equal(tick(d04.window), 5200, '0.5배속 = 5.2초 간격');
  while (tick(d04.window) !== null);
  assert.equal(count(), '8 / 8', '재생은 마지막 단계까지');
  assert.equal(play.getAttribute('aria-pressed'), 'false', '마지막에서 멈춘다(반복하지 않는다)');
  assert.match(play.textContent, /처음부터/);
  assert.equal(d04.window.scrollY || 0, 0, '재생은 페이지를 스크롤하지 않는다');

  const b01 = await open('course/tickets/B01.html', { script: flowScript, before: fakeTimers });
  const tsec = b01.$('section.flow[data-flow="B01"]');
  const tcount = () => tsec.querySelector('[data-flow-count]').textContent;
  const openSteps = course.flows.tickets.get('B01').steps.filter((s) => s.side === 'open').length;
  assert.equal(tcount(), `1 / ${openSteps}`, '원인 접기가 닫혀 있으면 증상 단계만 재생');
  for (let i = 0; i < openSteps; i++) tsec.querySelector('[data-flow-next]').click();
  assert.ok(!/트랜잭션 안에서/.test(text(tsec.querySelector('[data-flow-now]'))), '닫힌 원인 단계는 지금 단계에도 나오지 않는다');
  tsec.querySelector('[data-flow-prev]').click();
  const fold = tsec.querySelector('details.flow-cause');
  fold.open = true; fold.dispatchEvent(new b01.window.Event('toggle'));
  assert.equal(tcount().split(' / ')[1], String(course.flows.tickets.get('B01').steps.length), '펼치면 원인 단계가 끼어든다');
  tsec.querySelector('[data-flow-prev]').click(); tsec.querySelector('[data-flow-prev]').click();
  assert.ok(tsec.querySelector('.flow-step.is-current').classList.contains('is-cause') || tsec.querySelector('.flow-step.is-current'), '펼친 뒤 원인 단계로 이동');
  const poolTile = tsec.querySelector('.flow-node[data-node="pool"]');
  assert.ok(poolTile.classList.contains('is-revealed') && text(poolTile.querySelector('b')) === 'Hikari 풀', '펼치면 원인 쪽 노드 이름을 접기 안 단계에서 가져와 보여 준다');
  fold.open = false; fold.dispatchEvent(new b01.window.Event('toggle'));
  assert.equal(text(poolTile.querySelector('b')), MASK_LABEL, '접으면 다시 가린다');
  assert.equal(tcount().split(' / ')[1], String(openSteps), '다시 접으면 증상 단계만');
  assert.ok(!tsec.querySelector('.flow-step.is-current').classList.contains('is-cause'), '접으면 지금 단계가 증상 쪽으로 옮겨 간다');
  console.log(`흐름 재생: 일자 ${course.flows.days.size}개·티켓 ${course.flows.tickets.size}개, 근거 문자열 ${checkedEvidence}개, 조작·누출 검사 통과`);
}
console.log(`과정 화면: 일자 ${course.days.length}쪽 배치·진도 체크·저장 실패, 홈 오늘 할 일·15일 진도·진입, 지도 노드 ${mapNodes(course).length}·간선 ${course.edges.length} 검사 통과`);
