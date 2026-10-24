import { loadCourseSources } from '../course/sources.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { renderSiteNavigation } from './site-navigation.mjs';
import { renderTicketSelection, loadCourse } from './course-pages.mjs';
const read = p => fs.readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const script = read('tools/site/course.js');
const KEY = 'javaexperience.course.progress.v1';
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
      assert.match(page.window.document.querySelector('[data-step="D14-5"] [data-step-kind]').textContent, /모두 필수/);
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
  for (let n=15;n<=45;n++) {
    const doc=new JSDOM(read(`course/spring/D${n}.html`)).window.document;
    assert.equal(doc.querySelectorAll('del').length,0,`D${n}: 범위 문구 보존`);
  }
});
