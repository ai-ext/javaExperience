import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
const read = p => fs.readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const open = p => new JSDOM(read(p), {url:`https://learn.test/${p}`, runScripts:'outside-only'});
const script = read('tools/site/course.js');
const KEY = 'javaexperience.course.progress.v1';
const ready = async dom => { dom.window.eval(script); await new Promise(r => dom.window.setTimeout(r, 30)); };
test('Java 다음 행동은 연결 사례 앵커가 아니라 해당 Spring 일자다', () => {
  for (const id of ['J01','J05','J16']) { const dom=open(`course/java/${id}.html`); const a=[...dom.window.document.querySelectorAll('.exercise-route a')].find(a=>/Spring.*시작|Spring.*이어서/.test(a.textContent)); assert.ok(a,id); assert.match(a.getAttribute('href'),new RegExp(`D${id.slice(1)}.html`)); dom.window.close(); }
});
test('설정 예시 바로가기는 설정 탭을 열고 준비 이력은 별도 접기다', async () => {
 const dom=open('course/spring/D01.html'); await ready(dom); const doc=dom.window.document;
 const a=doc.querySelector('.fact-files a[data-config-jump]'); assert.ok(a); a.click(); await new Promise(r=>dom.window.setTimeout(r,30)); const target=doc.getElementById(a.hash.slice(1)); assert.ok(target.matches('[data-config-tabs]')); assert.ok(target.closest('details').open); assert.ok(doc.querySelector('.step-answer details.example-preparation')); dom.window.close();
});
test('진도는 구현 완료·현재 화면·준비 및 마무리 확인을 나눠 쓴다', async () => {
 const dom=open('course/spring/D01.html'); await ready(dom); const doc=dom.window.document; assert.match(doc.querySelector('[data-day-progress]').textContent,/구현 완료 0\/4/); assert.match(doc.querySelector('[data-day-position]').textContent,/현재 화면/); assert.match(doc.querySelector('[data-stage-progress]').textContent,/준비 미확인.*마무리 미확인/); doc.querySelector('[data-stage-check]').click(); assert.match(doc.querySelector('[data-stage-progress]').textContent,/준비 확인/); dom.window.close();
});
test('D11 전환·D14 선택·D15 점검·D16 작업 대상은 첫 화면에 있다', () => {
 for (const [id,text] of [['D11','2단계 시작: 기존 서버 종료·messy-server 기동'],['D14','내 선택'],['D15','10문항 + 회고 5개 → D16 개인 경로'],['D16','messy-server 사본']]) {const dom=open(`course/spring/${id}.html`); assert.ok(dom.window.document.querySelector('.day-context').textContent.includes(text),id); if(id==='D14') assert.ok(dom.window.document.querySelector('#step-d14-6 [data-selected-ticket-compact]')); if(id==='D16') assert.match(dom.window.document.querySelector('.fact-files').textContent,/messy-server 사본/); dom.window.close();}
});
test('홈 복귀 주 행동과 순서별 필수·연습·선택 표시', async () => {
 const dom=open('README.html'); const steps={}; for(let d=1;d<=4;d++){const counts=[4,5,6,5];for(let i=1;i<=counts[d-1];i++) steps[`D0${d}-${i}`]=true;} steps['D05-1']=steps['D05-2']=true; dom.window.localStorage.setItem(KEY,JSON.stringify({version:1,steps})); await ready(dom); const doc=dom.window.document; assert.equal(doc.querySelector('[data-today-resume]').getAttribute('href'),'course/spring/D05.html#step-d05-3'); assert.ok(doc.querySelector('.course-home.is-returning')); dom.window.close();
 const d11=open('course/spring/D11.html'); assert.match(d11.window.document.querySelector('[data-step="D11-3"]').textContent,/리뷰 메모 필수.*B08·B11 연습.*B14 선택/); d11.window.close();
});
test('티켓 링크와 데이터·SQL 바로가기는 접기 밖에서 찾는다', () => {
 const dom=open('course/spring/D12.html'); const doc=dom.window.document; assert.equal(doc.querySelector('.fact-tickets').tagName,'DIV'); assert.ok(doc.querySelector('.day-quick-links a[href="#오늘의-sql"]')); dom.window.close();
});
test('일자 목록은 D45까지 바로 고를 수 있고 필터 역할은 정확하다', () => {
 const dom=open('course/spring/README.html'); assert.ok(dom.window.document.querySelector('.guide-index a[href="D45.html"]')); dom.window.close(); const java=open('course/java/J01.html'); const card=[...java.window.document.querySelectorAll('.visual-file')].find(e=>e.textContent.includes('RequestIdFilter.java')); assert.equal(card.querySelector('.file-layer').textContent,'요청 필터'); assert.ok(![...java.window.document.querySelectorAll('h2,summary,.guide-index a')].some(e=>e.textContent.trim()==='정답')); java.window.close();
});
test('지도는 저장 진도의 추천일과 현재 위치를 관계 선택과 따로 표시한다', async () => {
 const dom=open('course/map.html'); dom.window.localStorage.setItem(KEY,JSON.stringify({version:1,steps:{'D05-1':true,'D05-2':true}})); await ready(dom); assert.match(dom.window.document.querySelector('[data-cm-progress]').textContent,/D05.*2\/6.*③/); assert.ok(dom.window.document.querySelector('[data-node="D05"].is-learning')); dom.window.close();
});
test('헤더 높이가 바뀌면 sticky·앵커의 공통 기준도 갱신한다', async () => {
 const dom=open('course/README.html'); const doc=dom.window.document; let height=141;
 doc.querySelector('.site-topbar').getBoundingClientRect=()=>({height}); await ready(dom);
 assert.equal(doc.documentElement.style.getPropertyValue('--course-header-height'),'141px');
 height=173; dom.window.dispatchEvent(new dom.window.Event('resize'));
 assert.equal(doc.documentElement.style.getPropertyValue('--course-header-height'),'173px'); dom.window.close();
});
test('데이터 공통 안내는 요청한 일자의 데이터 작업으로 복귀한다', async () => {
 for(const day of ['D05','D45','D99','invalid']) {
  const dom=new JSDOM(read('course/start/dummy/README.html'),{url:`https://learn.test/course/start/dummy/README.html?day=${day}`,runScripts:'outside-only'}); await ready(dom);
  const a=dom.window.document.querySelector('.data-guide-return');
  if(['D05','D45'].includes(day)) assert.equal(a.getAttribute('href'),`../../spring/${day}.html#step-${day.toLowerCase()}-data`); else assert.equal(a,null);
  dom.window.close();
 }
});
