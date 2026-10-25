import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const script = () => fs.readFileSync(new URL('./section-switcher.js', import.meta.url), 'utf8');
function fixture(hash = '') {
  const dom = new JSDOM(`<main><section class="course-guide"><aside class="guide-rail"><nav class="guide-index"><ol><li><a href="#one">첫 내용</a></li><li><a href="#two">다음 내용</a></li></ol></nav></aside><div class="guide-content"><section class="guide-section"><h2 id="one">하나</h2><p>본문 하나</p></section><section class="guide-section"><h2 id="two">둘</h2><details><summary>코드</summary><pre id="deep">원문</pre></details></section></div></section></main>`, {url:`https://example.test/course/README.html${hash}`,runScripts:'outside-only'});
  dom.window.scrollTo = () => {};
  dom.window.eval(script());
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  return dom;
}
test('목차는 전체와 개별 내용 전환을 제공하고 원문 노드를 보존한다', () => {
  const dom = fixture(), doc = dom.window.document;
  const tabs = [...doc.querySelectorAll('.section-switcher [role="tab"]')];
  assert.equal(tabs.length, 3);
  tabs[1].click();
  assert.equal(doc.getElementById('one').closest('[data-section-panel]').hidden, false);
  assert.equal(doc.getElementById('two').closest('[data-section-panel]').hidden, true);
  assert.equal(dom.window.location.hash, '#one');
  tabs[2].click();
  assert.equal(tabs[2].getAttribute('aria-selected'), 'true');
  assert.equal(doc.getElementById('one').closest('[data-section-panel]').hidden, true);
  tabs[0].click();
  assert.ok([...doc.querySelectorAll('[data-section-panel]')].every(p=>!p.hidden));
  assert.equal(doc.getElementById('deep').textContent, '원문');
  dom.window.close();
});
test('내부 해시·뒤로 가기·방향키는 내용과 선택 상태를 함께 복원한다', () => {
  const dom = fixture('#deep'), doc = dom.window.document;
  assert.equal(doc.getElementById('two').closest('[data-section-panel]').hidden, false);
  assert.equal(doc.querySelector('details').open, true);
  const tabs = [...doc.querySelectorAll('.section-switcher [role="tab"]')];
  assert.equal(tabs[2].getAttribute('aria-selected'), 'true');
  dom.window.history.replaceState({}, '', '#one');
  dom.window.dispatchEvent(new dom.window.PopStateEvent('popstate'));
  assert.equal(tabs[1].getAttribute('aria-selected'), 'true');
  tabs[1].dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'End',bubbles:true,cancelable:true}));
  assert.equal(doc.activeElement,tabs[2]);
  assert.equal(tabs.filter(t=>t.tabIndex===0).length,1);
  dom.window.close();
});

test('전체 보기 왕복은 보이는 현재 순서와 화면 안의 읽던 위치를 유지한다', async () => {
  const html = fs.readFileSync(new URL('../../course/spring/D11.html',import.meta.url),'utf8');
  const dom = new JSDOM(html,{url:'https://example.test/course/spring/D11.html#step-d11-2',runScripts:'outside-only'});
  const win=dom.window,doc=win.document; let y=50;
  Object.defineProperty(win,'scrollY',{get:()=>y});
  win.scrollTo=value=>{y=value.top;};
  win.eval(fs.readFileSync(new URL('./course.js',import.meta.url),'utf8'));
  doc.dispatchEvent(new win.Event('DOMContentLoaded'));
  const page=doc.querySelector('[data-day-page]'), current=doc.getElementById('step-d11-2');
  doc.querySelector('.day-today').getBoundingClientRect=()=>({top:110,bottom:350,height:240});
  current.getBoundingClientRect=()=>{const top=(page.classList.contains('day-show-all')?1800:470)-y;return {top,bottom:top+700,height:700};};
  const before=current.getBoundingClientRect().top;
  doc.querySelector('[data-day-expand]').click();
  assert.equal(current.getBoundingClientRect().top,before);
  doc.querySelector('[data-day-expand]').click();
  assert.equal(current.hidden,false);
  assert.equal(current.getBoundingClientRect().top,before);
  assert.equal(y,50);
  dom.window.close();
});

test('전체에서 읽던 순서의 새 문서 위치가 화면보다 위여도 음수 스크롤 부족분을 보정한다', () => {
  const html=fs.readFileSync(new URL('../../course/spring/D05.html',import.meta.url),'utf8');
  const dom=new JSDOM(html,{url:'https://example.test/course/spring/D05.html#step-d05-3',runScripts:'outside-only'});
  const win=dom.window,doc=win.document;let y=0;
  Object.defineProperty(win,'scrollY',{get:()=>y});win.scrollTo=value=>{y=Math.max(0,value.top);};
  win.eval(fs.readFileSync(new URL('./course.js',import.meta.url),'utf8'));doc.dispatchEvent(new win.Event('DOMContentLoaded'));
  const page=doc.querySelector('[data-day-page]'),main=page.querySelector('.day-stepper-main'),current=doc.getElementById('step-d05-3');
  doc.querySelector('.day-today').getBoundingClientRect=()=>({bottom:350,height:240});
  current.getBoundingClientRect=()=>{const top=(page.classList.contains('day-show-all')?2856:342)+(parseFloat(main.style.paddingTop)||0)-y;return {top,bottom:top+700,height:700};};
  doc.querySelector('[data-day-expand]').click();y=2436;
  assert.equal(current.getBoundingClientRect().top,420);
  doc.querySelector('[data-day-expand]').click();
  assert.equal(current.hidden,false);assert.equal(current.getBoundingClientRect().top,420);assert.equal(y,0);
  win.close();
});

test('시나리오 목록에서 시안만 고르면 뒤쪽 원문도 숨기고 전체에서 복원한다', () => {
  const dom=new JSDOM('<main><h1>시나리오</h1><section class="learning-journey"><div class="journey-dashboard">학습 흐름</div><section class="visual-catalog" id="visual-catalog">시안</section><div class="journey-browser" id="journey-all-apis">API</div></section><h2 id="tail">전체 명세</h2><p id="tail-copy">원문 보존</p></main>',{url:'https://example.test/scenario/README.html',runScripts:'outside-only'});
  const win=dom.window,doc=win.document;win.scrollTo=()=>{};win.eval(script());doc.dispatchEvent(new win.Event('DOMContentLoaded'));
  doc.querySelector('[data-section-target="visual-catalog"]').click();
  assert.equal(doc.getElementById('tail-copy').closest('[data-section-panel]').hidden,true);
  assert.equal(doc.querySelector('.journey-dashboard').hidden,true);
  assert.equal(doc.getElementById('visual-catalog').hidden,false);
  doc.querySelector('[data-section-target="section-all"]').click();
  assert.equal(doc.getElementById('tail-copy').closest('[data-section-panel]').hidden,false);
  assert.equal(doc.getElementById('tail-copy').textContent,'원문 보존');
  win.close();
});

test('미션 메뉴와 공통 규칙도 선택한 본문만 전환하고 전체에서 복원한다', () => {
  const dom=new JSDOM('<main><section class="mission-visual"><nav><a href="#m1">M1</a><a href="#m2">M2</a></nav><div class="mission-visual-shortcuts"><a href="#rules">공통 규칙</a></div></section><details><summary>준비</summary><h2 id="rules">업무 규칙</h2><p>권한</p></details><section><article class="mission-detail-card" id="m1">첫 미션</article><article class="mission-detail-card" id="m2">다음 미션</article></section></main>',{url:'https://example.test/practice/MISSIONS.html',runScripts:'outside-only'});
  const win=dom.window,doc=win.document;win.scrollTo=()=>{};win.eval(script());doc.dispatchEvent(new win.Event('DOMContentLoaded'));
  doc.querySelector('[data-section-target="m2"]').click();assert.equal(doc.getElementById('m1').hidden,true);assert.equal(doc.getElementById('m2').hidden,false);
  doc.querySelector('[data-section-target="rules"]').click();assert.equal(doc.getElementById('m2').hidden,true);assert.equal(doc.getElementById('rules').closest('details').open,true);
  doc.querySelector('[data-section-target="section-all"]').click();assert.equal(doc.getElementById('m1').hidden,false);assert.equal(doc.getElementById('m2').hidden,false);
  win.close();
});
