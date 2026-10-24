import { loadCourseSources } from '../course/sources.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { renderSiteNavigation } from './site-navigation.mjs';
import { renderTicketSelection, loadCourse, renderDayPage } from './course-pages.mjs';
import { renderD00 } from '../course/build-days.mjs';
import { marked } from 'marked';
const read = p => fs.readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const script = read('tools/site/course.js');
const KEY = 'javaexperience.course.progress.v1';

test('선택 워밍업도 세 장면을 이동하며 원문·앵커·확인 기록을 지킨다', async () => {
  const root = new URL('../../', import.meta.url).pathname;
  const { roadmap } = loadCourseSources();
  const original = marked.parse(renderD00(roadmap, root))
    .replace(/href="([^"]+)\.md"/g, 'href="$1.html"')
    .replace(/<h2>([^<]+)<\/h2>/g, (_, text) => `<h2 id="${text.replace(/\s+/g, '-')}">${text}</h2>`);
  const rendered = renderDayPage('course/spring/D00.md', original, loadCourse(root));
  const dom = new JSDOM(rendered, { url: 'https://learn.test/course/spring/D00.html', runScripts: 'outside-only' });
  const doc = dom.window.document;
  const panels = [...doc.querySelectorAll('.day-stepper-main > [data-day-panel]')];
  assert.equal(panels.length, 3);
  assert.ok(doc.querySelector('.day-stepper-layout > .day-today'));
  assert.deepEqual(panels.map(p => p.querySelector('h2').textContent), ['오늘 할 것', '워밍업 주제', '내일 미리보기']);
  for (const id of ['오늘-할-것', '워밍업-주제', '내일-미리보기']) assert.ok(doc.getElementById(id));
  const source = new JSDOM(original).window.document;
  for (const node of source.querySelectorAll('p:not(blockquote p), li')) {
    if (node !== source.body.lastElementChild) assert.ok(doc.body.textContent.includes(node.textContent), node.textContent);
  }
  for (const link of source.querySelectorAll('a')) assert.ok([...doc.querySelectorAll('a')].some(a => a.getAttribute('href') === link.getAttribute('href')), link.getAttribute('href'));
  for (const text of source.querySelector('blockquote').textContent.split(' · ')) assert.ok(doc.querySelector('.day-meta').textContent.includes(text.trim()));
  assert.equal(doc.querySelectorAll('input.step-check, [data-day-meter]').length, 0, '선택 확인을 필수 구현 진도에 합산하지 않는다');
  dom.window.eval(script);
  await new Promise(resolve => dom.window.addEventListener('load', resolve));
  const visible = () => panels.filter(panel => !panel.hidden);
  assert.deepEqual(visible(), [panels[0]]);
  doc.querySelector('.step-next').click();
  await new Promise(resolve => dom.window.setTimeout(resolve, 10));
  assert.deepEqual(visible(), [panels[1]]);
  dom.window.location.hash = '#오늘-할-것';
  await new Promise(resolve => dom.window.setTimeout(resolve, 10));
  assert.deepEqual(visible(), [panels[0]], '기존 내부 앵커로 이동해도 소유 장면을 연다');
  doc.querySelector('[data-day-expand]').click();
  assert.equal(visible().length, 3);
  doc.querySelector('[data-stage-check]').click();
  assert.equal(JSON.parse(dom.window.localStorage.getItem('javaexperience.course.stages.v1'))['step-d00-1'], true);
  assert.equal(dom.window.localStorage.getItem(KEY), null);
  source.defaultView.close();
  dom.window.close();
});

test('모든 구현일의 데이터·SQL·채점은 단계 안에 있고 핵심 조건만 먼저 보인다', () => {
  for (const day of loadCourseSources().roadmap.days) {
    const doc = new JSDOM(read(`course/spring/${day.id}.html`)).window.document;
    for (const node of doc.querySelectorAll('.day-data, .day-sql, .day-grade')) assert.ok(node.closest('[data-day-panel]'), `${day.id}: 행동별 단계 안에 ${node.className}`);
    for (const step of doc.querySelectorAll('.day-step')) {
      for (const key of ['files', 'done', 'layers', 'tickets']) {
        const fact = step.querySelector(`.fact-${key}`);
        if (fact) assert.equal(fact.closest('details'), null, `${day.id}: ${key} 기본 노출`);
      }
      for (const key of ['trap', 'answer-link', 'spec', 'data-spec']) {
        const fact = step.querySelector(`.fact-${key}`);
        if (fact) assert.equal(fact.closest('details').open, false, `${day.id}: ${key} 기본 접힘`);
      }
    }
    doc.defaultView.close();
  }
});
test('실습 노트: SQL·질문은 노출하고 채점·다음 날은 같은 행동 영역에 둔다', () => {
  const days = loadCourseSources().roadmap.days;
  for (const [i, day] of days.entries()) {
    const doc = new JSDOM(read(`course/spring/${day.id}.html`)).window.document;
    assert.ok(doc.querySelector('.day-sql.practice-panel .sql-questions'));
    for (const item of doc.querySelectorAll('.sql-questions > li')) assert.equal(item.closest('details'), null);
    const cards = [...doc.querySelectorAll('.practice-talk-card')];
    assert.equal(cards.length, day.talkCards.length, day.id);
    for (const card of cards) {
      assert.ok(card.querySelector('h3') && card.querySelector(':scope > p'));
      assert.equal(card.querySelector(':scope > p').closest('details'), null);
      assert.equal(card.querySelector('details.card-answer').open, false);
    }
    const grade = doc.querySelector('.day-grade');
    assert.ok(grade.querySelector('button[data-copy-target="day-grader-prompt"]'));
    assert.equal(grade.querySelector('.grader-source').open, false);
    const finish = doc.querySelector('.day-finish');
    assert.ok(finish.querySelector('#내일-미리보기'));
    assert.equal(finish.querySelector('.practice-continue').getAttribute('href'), days[i + 1] ? `${days[i + 1].id}.html` : 'README.html');
    assert.equal(finish.querySelectorAll('.practice-review a').length, 3);
    for (const bulk of doc.querySelectorAll('[data-day-sql="bulk"]')) assert.equal(bulk.closest('.day-bulk').open, false);
    doc.defaultView.close();
  }
});

test('접힌 채점 프롬프트: 복사 원문을 지키고 실패 시 펼쳐 직접 선택한다', async () => {
  const copied = [];
  const dom = await open('course/spring/D04.html', null, win => Object.defineProperty(win.navigator, 'clipboard', { configurable:true, value:{writeText:async value=>copied.push(value)} }));
  const doc = dom.window.document;
  const target = doc.querySelector('#day-grader-prompt');
  const button = doc.querySelector('[data-copy-target="day-grader-prompt"]');
  button.click(); await Promise.resolve();
  assert.equal(copied[0], target.textContent);
  assert.equal(doc.querySelector('.grader-source').open, false);
  Object.defineProperty(dom.window.navigator, 'clipboard', {value:undefined});
  button.click();
  assert.equal(doc.querySelector('.grader-source').open, true);
  assert.equal(dom.window.getSelection().toString(), target.textContent);
  dom.window.close();
});
async function open(file, saved, before) {
  const dom = new JSDOM(read(file), { url: `https://learn.test/${file}`, runScripts: 'outside-only' });
  if (saved) dom.window.localStorage.setItem(KEY, saved);
  before?.(dom.window);
  dom.window.eval(script);
  await new Promise(r => dom.window.addEventListener('load', r));
  return dom;
}
test('실행안 2: 파일 작업 구분이 생성된 각 순서에 보인다', () => {
  const roadmap = loadCourseSources().roadmap;
  for (const d of roadmap.days.filter(d => d.phase === 'build')) {
    const doc = new JSDOM(read(`course/spring/${d.id}.html`)).window.document;
    for (const s of d.steps) {
      const section = doc.querySelector(`#step-${d.id.toLowerCase()}-${s.no}`);
      assert.ok(section.querySelector('.fact-files'), `${d.id}-${s.no}`);
      for (const [action, label] of Object.entries({create:'새로 만들기', modify:'기존 수정', inspect:'확인만'})) {
        if (s.fileActions?.[action]?.length) assert.ok(section.textContent.includes(label));
      }
      assert.ok(s.fileActions, `${d.id}-${s.no}: 파일 구분`);
    }
  }
});
test('순서 칸: 만들 것·완료 조건을 먼저 읽고, 접힌 계약·필수 관찰과 다음 순서를 찾는다', async () => {
  const { roadmap } = loadCourseSources();
  for (const id of ['D04', 'D05', 'D11', 'D19']) {
    const day = roadmap.days.find(d => d.id === id);
    const dom = await open(`course/spring/${id}.html`);
    const doc = dom.window.document;
    for (const [index, step] of day.steps.entries()) {
      const section = doc.querySelector(`#step-${id.toLowerCase()}-${step.no}`);
      assert.ok(section.querySelector('h2 .step-number'), `${id}-${step.no}: 자동 앵커 뒤의 순서 번호도 분리한다`);
      assert.ok(section.querySelector('h2 .step-title'), `${id}-${step.no}: 제목을 독립 열에 배치한다`);
      assert.ok(section.querySelector('h2 > a.anchor'), `${id}-${step.no}: 기존 제목 앵커 보존`);
      for (const files of Object.values(step.fileActions ?? {})) for (const file of files) {
        assert.ok([...section.querySelectorAll('.fact-files code')].some(code => code.textContent === file), `${id}-${step.no}: 전체 파일 경로 보존`);
      }
      const spec = section.querySelector('.fact-spec');
      const done = section.querySelector('.fact-done');
      if (spec && done) {
        assert.ok(done.compareDocumentPosition(spec) & 4, `${id}-${step.no}: 완료 조건을 보인 뒤 명세를 찾아본다`);
        assert.equal(spec.closest('details').open, false, `${id}-${step.no}: 명세는 기본 접힘`);
      }
      const fullTitle = section.querySelector('.step-context');
      if (fullTitle) assert.equal(fullTitle.querySelector('p').textContent, step.title.replace(/`/g, ''), `${id}-${step.no}: 제목의 세부 조건 원문도 보존`);
      const next = section.querySelector('.step-next');
      assert.ok(next, `${id}-${step.no}: 다음 행동 링크`);
      assert.equal(next.getAttribute('href'), day.steps[index + 1] ? `#step-${id.toLowerCase()}-${day.steps[index + 1].no}` : `#step-${id.toLowerCase()}-${doc.querySelector('.day-data') ? 'data' : 'wrap'}`);
      const before = [...doc.querySelectorAll('input.step-check')].map(input => input.checked);
      next.click();
      assert.deepEqual([...doc.querySelectorAll('input.step-check')].map(input => input.checked), before, '순서 이동만으로 완료 체크하지 않는다');
    }
    dom.window.close();
  }
  const doc = new JSDOM(read('course/spring/D05.html')).window.document;
  const required = doc.querySelector('#step-d05-2 .step-required');
  assert.ok(required, '필수 관찰 진입점을 접기 밖에 공개');
  assert.ok(doc.querySelector(required.getAttribute('href')).matches('details.step-observations'), '실제 관찰 절차를 가리킨다');
});
test('실행안 3: 실제 존재하는 섹션만 머리에서 이동하고 데이터 적재 후 작업에 복귀한다', () => {
  for (let n=1;n<=loadCourseSources().roadmap.days.length;n++) {
    const id = `D${String(n).padStart(2,'0')}`;
    const doc = new JSDOM(read(`course/spring/${id}.html`)).window.document;
    const nav = doc.querySelector('nav.day-sections');
    assert.ok(nav, id);
    for (const a of nav.querySelectorAll('a')) assert.ok(doc.getElementById(decodeURIComponent(a.hash.slice(1))), `${id}: ${a.hash}`);
    assert.equal(Boolean(nav.querySelector('[href="#이-날-데이터-넣기"]')), Boolean(doc.querySelector('.day-data')), id);
    if (doc.querySelector('.day-data')) {
      assert.ok(doc.querySelector('.day-step a[data-data-return]'), `${id}: 데이터 진입`);
      assert.ok(doc.querySelector('.day-data a[data-work-return]'), `${id}: 작업 복귀`);
      for(const a of doc.querySelectorAll('[data-work-return], [data-data-return]')) assert.ok(doc.getElementById(decodeURIComponent(a.hash.slice(1))), `${id}: 데이터 왕복 ${a.hash}`);
    }
  }
  assert.match(read('course/spring/D04.md'), /D05.*준비.*D06/);
  assert.match(read('course/spring/D06.md'), /별도 실험 DB/);
});
test('일자 머리: 긴 안내보다 먼저 Java·구현 목록이 보이고 시점 예외를 보존한다', () => {
  for (const day of loadCourseSources().roadmap.days) {
    const doc = new JSDOM(read(`course/spring/${day.id}.html`)).window.document;
    const overview = doc.querySelector('.day-stepper-layout');
    assert.ok(overview, day.id);
    assert.equal((doc.querySelector('.day-context') || doc.querySelector('.day-head')).nextElementSibling, overview, `${day.id}: 일자 제목 다음 단계 작업대`);
    assert.ok(overview.querySelector('.day-java'), `${day.id}: Java 접근`);
    assert.equal(overview.firstElementChild, overview.querySelector('.day-today'), `${day.id}: 순서 목록 다음에 본문 패널`);
    assert.ok(overview.querySelector('.day-stage-prep .day-java'), `${day.id}: Java는 별도 준비 자료 단계`);
    assert.equal(overview.querySelectorAll('.day-chip').length, day.steps.length);
    const meter = overview.querySelector('progress');
    assert.ok(meter && meter.getAttribute('aria-label').includes('구현'), `${day.id}: 하루 전체 진도로 오인하지 않음`);
    assert.ok(doc.querySelector('.day-crumbs [aria-current="page"]'), `${day.id}: 현재 일자`);
    for (const link of overview.querySelectorAll('.day-today a[href^="#"]')) assert.ok(doc.getElementById(decodeURIComponent(link.hash.slice(1))), `${day.id}: 작업대 링크 목적지`);
    if (['D44','D45'].includes(day.id)) {
      assert.match(overview.querySelector('.day-java').textContent, /수행 중.*사후 확인/);
      assert.doesNotMatch(overview.querySelector('.day-java').textContent, /먼저 연습하기/);
    }
  }
});
test('일자 머리: 진행 막대·다음 구현은 체크와 동기화하고 필수 종료 뒤 SQL로 잇는다', async () => {
  const page = await open('course/spring/D14.html');
  const doc = page.window.document;
  const core = [...doc.querySelectorAll('.day-chip input:not([data-extra])')];
  const meter = doc.querySelector('[data-day-meter]');
  const resume = doc.querySelector('[data-day-resume]');
  assert.equal(meter.max, core.length);
  assert.equal(meter.value, 0);
  assert.equal(resume.hash, doc.querySelector('.day-chip.is-current a').hash);
  core[0].click();
  assert.equal(meter.value, 1);
  assert.equal(doc.querySelectorAll('.day-chip.is-current').length, 1);
  core.slice(1).forEach(input => input.click());
  assert.equal(meter.value, core.length);
  assert.equal(doc.querySelectorAll('.day-chip.is-current').length, 0);
  assert.equal(decodeURIComponent(resume.hash), '#오늘의-sql');
  assert.match(resume.textContent, /구현 체크 완료/);
  assert.doesNotMatch(resume.textContent, /하루 완료/);
  assert.ok([...doc.querySelectorAll('.day-chip input[data-extra]')].every(input => !input.checked));
  const saved = page.window.localStorage.getItem(KEY);
  page.window.close();
  const restored = await open('course/spring/D14.html', saved);
  assert.equal(restored.window.document.querySelector('[data-day-meter]').value, core.length);
  assert.equal(decodeURIComponent(restored.window.document.querySelector('[data-day-resume]').hash), '#오늘의-sql');
  restored.window.close();
  const chosen = await open('course/spring/D14.html', JSON.stringify({...JSON.parse(saved), selectedTicket:'B16'}));
  const chosenDoc = chosen.window.document;
  assert.equal(chosenDoc.querySelector('[data-day-resume]').hash, '#step-d14-4', '고른 티켓이 남았으면 필수 체크 종료 뒤에도 건너뛰지 않는다');
  assert.equal(chosenDoc.querySelector('[data-day-meter]').value, core.length, '선택 티켓은 기존 집계 기준을 바꾸지 않는다');
  chosenDoc.querySelector('.day-chip[data-step="D14-4"] input').click();
  assert.equal(decodeURIComponent(chosenDoc.querySelector('[data-day-resume]').hash), '#오늘의-sql');
  chosen.window.close();
});
test('실행안 4: D11 선택은 기존 진도를 보존하고 D14·홈에 같은 티켓·훈련 기준을 표시한다', async () => {
  const saved = JSON.stringify({version:1,steps:{'D01-1':true}});
  const d11 = await open('course/spring/D11.html', saved);
  const select = d11.window.document.querySelector('[data-ticket-choice]');
  assert.ok(select, 'D11 선택 도구');
  select.value = 'B14'; select.dispatchEvent(new d11.window.Event('change'));
  const stored = d11.window.localStorage.getItem(KEY);
  assert.equal(JSON.parse(stored).selectedTicket, 'B14');
  assert.equal(JSON.parse(stored).steps['D01-1'], true);
  for (const file of ['course/spring/D14.html','index.html']) {
    const page = await open(file, stored);
    assert.match(page.window.document.querySelector('[data-selected-ticket]').textContent, /B14/);
    if (file.includes('D14')) {
      assert.match(page.window.document.querySelector('[data-selected-ticket]').textContent, /E01/);
      assert.match(page.window.document.querySelector('[data-step="D14-1"] [data-step-kind]').textContent, /고르지 않은 후보/);
      assert.match(page.window.document.querySelector('[data-step="D14-5"] [data-step-kind]').textContent, /고도화 필수/);
    }
    page.window.close();
  }
  select.value='B16'; select.dispatchEvent(new d11.window.Event('change'));
  const d14 = await open('course/spring/D14.html', d11.window.localStorage.getItem(KEY));
  assert.match(d14.window.document.querySelector('[data-selected-ticket]').textContent, /201\/200.*1초/);
  d14.window.close(); d11.window.close();
});
test('실행안 5: 어디서나 일자 목록·지도로 이동하고 D11 준비 기록은 진도와 분리된다', async () => {
  for (const from of ['README.md','course/java/J09.md','scenario/ch1-create-post/1-1-project-setup.md']) {
    const doc = new JSDOM(renderSiteNavigation(from), {url:`https://learn.test/${from}`}).window.document;
    assert.ok([...doc.querySelectorAll('a')].some(a => a.href === 'https://learn.test/course/spring/README.html'));
    assert.ok([...doc.querySelectorAll('a')].some(a => a.href === 'https://learn.test/course/map.html'));
  }
  const page = await open('course/spring/D11.html');
  const prep = page.window.document.querySelector('[data-preparation]');
  assert.ok(prep && !prep.closest('details'), '준비 절차는 노출');
  const input=prep.querySelector('input'); input.click();
  const state=JSON.parse(page.window.localStorage.getItem(KEY));
  assert.equal(Object.keys(state.steps).length,0);
  assert.equal(state.preparation[input.dataset.prep],true);
  page.window.close();
  assert.match(read('course/spring/D10.md'), /1단계.*완성/);
  assert.match(read('course/spring/D10.md'), /별도.*인수인계 서버/);
});
test('실행안 6: D02 최소 공유 설명과 D10 자기 서버 진단 도구 예행 관찰', () => {
  const hints=loadCourseSources().hints;
  assert.match(hints.days.D02.steps['4'].join(' '), /싱글톤.*요청 스레드.*J07/);
  const day=read('course/spring/D10.md');
  for (const word of ['jcmd','/actuator/metrics','slow_query_log','EXPLAIN ANALYZE','내 서버']) assert.ok(day.includes(word),word);
  assert.match(day,/노출.*되돌/);
});
test('실행안 8: 채점 현황·다른 브라우저 복귀·터치 복사 대체 안내', async () => {
  assert.doesNotMatch(read('course/README.md'), /채점 프롬프트가 아직 없는 날/);
  const dom = await open('course/spring/D04.html', null, win => Object.defineProperty(win.navigator,'clipboard',{value:undefined}));
  const button=dom.window.document.querySelector('[data-sql-copy]'); button.click();
  assert.match(dom.window.document.querySelector('.day-data [role="status"]').textContent,/길게.*파일 받기/);
  assert.match(dom.window.document.querySelector('.day-progress-note').textContent,/다른.*브라우저.*일자 목록/);
  dom.window.close();
});

test('선택·준비 기록은 다른 탭의 구현 체크와 함께 보존하며 잘못된 선택값은 무시한다', async () => {
  const dom = await open('course/spring/D11.html', JSON.stringify({version:1,steps:{'D01-2':true},selectedTicket:'B14',preparation:{'D11-1':true}}));
  const doc=dom.window.document;
  doc.querySelector('input.step-check').click();
  let value=JSON.parse(dom.window.localStorage.getItem(KEY));
  assert.equal(value.selectedTicket,'B14'); assert.equal(value.preparation['D11-1'],true);
  const selection=doc.querySelector('[data-ticket-choice]'); selection.value=''; selection.dispatchEvent(new dom.window.Event('change'));
  value=JSON.parse(dom.window.localStorage.getItem(KEY)); assert.equal(value.selectedTicket,undefined); assert.equal(value.steps['D01-2'],true);
  dom.window.localStorage.setItem(KEY,JSON.stringify({version:1,steps:{'D03-1':true},selectedTicket:'<script>'}));
  dom.window.dispatchEvent(new dom.window.StorageEvent('storage',{key:KEY}));
  assert.equal(selection.value,'');
  doc.querySelector('[data-prep="D11-2"]').click();
  value=JSON.parse(dom.window.localStorage.getItem(KEY)); assert.equal(value.steps['D03-1'],true);
  dom.window.close();
});
test('저장 실패 시 선택과 준비 기록은 화면에서 유지되고 실패 사실을 알린다', async () => {
  const dom=await open('course/spring/D11.html',null, win => Object.defineProperty(win.Storage.prototype,'setItem',{value(){throw new Error('quota');}}));
  const doc=dom.window.document, select=doc.querySelector('[data-ticket-choice]');
  select.value='B16'; select.dispatchEvent(new dom.window.Event('change'));
  doc.querySelector('[data-prep="D11-1"]').click();
  dom.window.dispatchEvent(new dom.window.Event('pageshow'));
  assert.equal(select.value,'B16'); assert.equal(doc.querySelector('[data-prep="D11-1"]').checked,true);
  assert.match(doc.querySelector('[data-record-storage]').textContent,/저장하지 못/);
  dom.window.close();
});

test('선택 비교의 B14 관찰 도구는 원 티켓의 prod·curl·인가 규칙과 맞는다', () => {
  const course=loadCourse(new URL('../../',import.meta.url).pathname);
  const doc=new JSDOM(renderTicketSelection(course,'course/spring/D11.md',true)).window.document;
  const row=[...doc.querySelectorAll('.ticket-comparison li')].find(li=>li.textContent.startsWith('B14'));
  assert.match(row.textContent,/prod.*curl.*인가 규칙/);
});

test('선택 요약에서 모두 할 E01·훈련의 D14 과제로 바로 이동한다', () => {
  const course=loadCourse(new URL('../../',import.meta.url).pathname);
  for(const from of ['README.md','course/spring/D14.md']) {
    const dom=new JSDOM(renderTicketSelection(course,from),{url:`https://learn.test/${from}`});
    const hrefs=[...dom.window.document.querySelectorAll('a')].map(a=>a.href);
    for(const no of [5,6]) assert.ok(hrefs.includes(`https://learn.test/course/spring/D14.html#step-d14-${no}`));
    dom.window.close();
  }
});

test('P9: D15 체크 후 D16을 추천하고 45일·3단계를 표시한다', async () => {
  const {roadmap} = loadCourseSources();
  const saved=JSON.stringify({version:1,steps:Object.fromEntries(roadmap.days.slice(0,15).flatMap(d=>d.steps.map(s=>[`${d.id}-${s.no}`,true])))});
  const dom=await open('index.html',saved);
  const doc=dom.window.document;
  assert.equal(doc.querySelector('[data-today-id]').textContent,'D16');
  assert.equal(doc.querySelector('.ch-progress-head h2').textContent,'45일 진도');
  assert.equal(doc.querySelectorAll('.ch-day').length,45);
  assert.match([...doc.querySelectorAll('.ch-phase')].map(x=>x.textContent).join(' '),/3단계/);
  assert.equal(doc.querySelectorAll('.ch-days [data-day="D45"]').length,1);
  dom.window.close();
});

test('P9: 확장 화면은 작업 대상·선행·개인 경로와 정상적인 Java 복귀 링크를 제공한다', () => {
  for (const n of [16,25,30,45]) {
    const doc=new JSDOM(read(`course/spring/D${n}.html`)).window.document;
    assert.match(doc.body.textContent,/작업 대상/);
    assert.match(doc.body.textContent,/먼저 확인/);
    assert.doesNotMatch(doc.body.textContent,/undefined/);
    assert.ok(doc.querySelector(`a[href="../java/J${n}.html"]`));
    const java=new JSDOM(read(`course/java/J${n}.html`)).window.document;
    assert.ok(java.querySelector(`a[href="../spring/D${n}.html"]`));
  }
});

test('P9: 날짜·티켓 범위가 취소선으로 렌더링되지 않는다', () => {
  const index = new JSDOM(read('course/spring/README.html')).window.document;
  assert.equal(index.querySelectorAll('del').length, 0, '일자 목록: 날짜·티켓 범위를 취소선으로 오인하지 않는다');
  for (let n=15;n<=45;n++) {
    const doc=new JSDOM(read(`course/spring/D${n}.html`)).window.document;
    assert.equal(doc.querySelectorAll('del').length,0,`D${n}: 범위 문구 보존`);
  }
});

test('디자인 E: 티켓 작업 순서·원문 코드·닫힌 정답과 Java 복귀를 보존한다', () => {
  for (const id of ['B01','E01']) {
    const doc=new JSDOM(read(`course/tickets/${id}.html`)).window.document;
    const sheet=doc.querySelector('.exercise-ticket');
    assert.ok(sheet, id);
    const order=[...sheet.children];
    assert.ok(order.indexOf(sheet.querySelector('.exercise-submission')) < order.indexOf(sheet.querySelector('.ticket-flow')), `${id}: 제출물 뒤 흐름 재생`);
    assert.equal(sheet.querySelectorAll('.exercise-route a').length,4);
    const answer=doc.getElementById('원인과-정답').nextElementSibling;
    assert.equal(answer.tagName,'DETAILS');
    assert.equal(answer.open,false);
    assert.equal(doc.querySelector('.flow-cause').open,false);
    for (const a of sheet.querySelectorAll('.exercise-route a')) assert.ok(doc.getElementById(decodeURIComponent(a.hash.slice(1))), a.hash);
    // DOM 재배치로 코드가 누락되거나 중복되지 않도록 원문의 모든 fenced code를 비교한다.
    const blocks=[...read(`course/tickets/${id}.md`).matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map(m=>m[1].trim());
    const actual=[...sheet.querySelectorAll('pre code')].map(c=>c.textContent.trim());
    for (const block of blocks) assert.ok(actual.includes(block),`${id}: 원문 코드 보존`);
  }
  for (const id of ['J05','J16']) {
    const doc=new JSDOM(read(`course/java/${id}.html`)).window.document;
    assert.ok(doc.querySelector('.exercise-java .exercise-meta'));
    assert.equal(doc.querySelectorAll('.exercise-return').length,2);
    assert.ok(doc.querySelector('.exercise-route a'));
    assert.match(doc.querySelector('.exercise-return:last-child').textContent,/완료 조건/);
  }
});

test('디자인 E: 환경 전환·중간 점검 경로는 해당 세 일자에만 표시한다', () => {
  for (const id of ['D10','D11','D15']) {
    const doc=new JSDOM(read(`course/spring/${id}.html`)).window.document;
    assert.equal(doc.querySelectorAll('.stage-transition').length,1,id);
    for (const a of doc.querySelectorAll('.stage-transition a[href^="#"]')) assert.ok(doc.getElementById(decodeURIComponent(a.hash.slice(1))),`${id}: ${a.hash}`);
    if(id==='D11') {
      assert.equal(doc.querySelectorAll('.handoff-sheet [data-prep]').length,6);
      const prep=doc.querySelector('.handoff-sheet');
      const selection=doc.querySelector('.ticket-selection');
      assert.ok(prep.compareDocumentPosition(selection) & 4, '준비 뒤 선택 티켓');
    }
  }
  for (const file of ['course/spring/D05.html','course/spring/D14.html','index.html']) {
    const doc=new JSDOM(read(file)).window.document;
    assert.equal(doc.querySelectorAll('.stage-transition, .exercise-sheet').length,0,file);
    assert.ok(![...doc.querySelectorAll('link[rel="stylesheet"]')].some(l=>l.href.includes('course-exercise.css')),file);
  }
});


test('통합: D11 인수인계·구현 작업대·순서 칸은 서로 독립된 구획이다', () => {
  const doc = new JSDOM(read('course/spring/D11.html')).window.document;
  const handoff = doc.querySelector('.handoff-sheet');
  assert.equal(handoff.querySelectorAll('[data-prep]').length, 6);
  assert.equal(handoff.querySelectorAll('.day-overview, .day-step, .practice-panel').length, 0);
  assert.equal(doc.querySelectorAll('.day-stepper-layout > .day-today').length, 1);
  assert.equal(doc.querySelectorAll('.day-step').length, 4);
  assert.ok(doc.querySelector('.day-stage-prep').contains(handoff), '인수인계는 준비 자료 단계에서 읽는다');
});
