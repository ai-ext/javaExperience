import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { JSDOM } from 'jsdom';

const root = new URL('../../', import.meta.url);
const script = fs.readFileSync(new URL('./section-switcher.js', import.meta.url), 'utf8');
test('페이지 선택은 왼쪽 세로 사이드바 하나에서 원문과 포커스를 보존한다', () => {
  const dom = new JSDOM('<main><h1>자료</h1><h2 id="one">첫 내용</h2><p>원문 하나</p><h2 id="two">다음 내용</h2><p>원문 둘</p></main>', {url:'https://learn.test/example.html',runScripts:'outside-only'});
  let y=400;
  Object.defineProperty(dom.window,'scrollY',{get:()=>y});
  dom.window.scrollTo=({top,behavior})=>{assert.equal(behavior,'instant');y=top;};
  dom.window.eval(script);dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  const doc=dom.window.document, tabs=[...doc.querySelectorAll('.section-switcher button')];
  assert.equal(doc.querySelectorAll('.page-sidebar').length,1);
  assert.equal(doc.querySelector('.section-switcher').getAttribute('aria-orientation'),'vertical');
  assert.ok(doc.querySelector('.page-sidebar .section-switcher'));
  assert.ok(doc.querySelector('.page-navigation-content h1'));
  doc.querySelector('.page-navigation-content').getBoundingClientRect=()=>({top:40-y});
  tabs[1].dispatchEvent(new dom.window.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));
  assert.equal(doc.activeElement,tabs[2]);assert.equal(y,20);
  assert.equal(doc.querySelector('#one').closest('[data-section-panel]').hidden,true);
  assert.equal(doc.querySelector('#two').closest('[data-section-panel]').hidden,false);
  assert.match(doc.body.textContent,/원문 하나/);dom.window.close();
});

test('이동한 개념 분야 필터는 현재 선택을 유지하고 검색을 다시 실행한다', async () => {
  const { initKnowledgeCatalog } = await import('./knowledge-catalog-controller.mjs');
  const html=fs.readFileSync(new URL('docs/knowledge/README.html',root),'utf8');
  const dom=new JSDOM(html,{url:'https://learn.test/docs/knowledge/README.html',runScripts:'outside-only'});
  const win=dom.window,doc=win.document;win.scrollTo=()=>{};
  initKnowledgeCatalog(doc,win);win.eval(script);doc.dispatchEvent(new win.Event('DOMContentLoaded'));
  const filters=doc.querySelector('.page-sidebar .kc-filters');assert.ok(filters);
  const buttons=[...filters.querySelectorAll('button[data-kc-category]')];
  buttons[1].click();assert.equal(buttons[1].getAttribute('aria-pressed'),'true');
  assert.ok(doc.querySelector('[data-kc-results-title]').textContent.startsWith(buttons[1].dataset.kcLabel));
  buttons[0].click();assert.equal(buttons[0].getAttribute('aria-pressed'),'true');
  doc.querySelector('.kc-search input').value='DTO';
  doc.querySelector('.kc-search').dispatchEvent(new win.Event('submit',{bubbles:true,cancelable:true}));
  assert.ok([...doc.querySelectorAll('[data-kc-document]')].some(row=>!row.hidden));win.close();
});

test('학습 장면 선택을 사이드바로 옮겨도 패널과 현재 표시가 함께 바뀐다', () => {
  const dom=new JSDOM('<main><h1>첫 Java</h1><section class="first-java-journey"><aside class="first-java-rail"><nav><button data-first-java-go="0">첫 장면</button><button data-first-java-go="1">다음 장면</button></nav></aside><div><article data-first-java-panel>첫 원문</article><article data-first-java-panel hidden>다음 원문</article></div></section></main>',{url:'https://learn.test/first.html',runScripts:'outside-only'});
  const win=dom.window,doc=win.document;win.scrollTo=()=>{};win.HTMLElement.prototype.scrollIntoView=()=>{};
  win.eval(fs.readFileSync(new URL('./first-java-journey.js',import.meta.url),'utf8'));
  win.eval(script);doc.dispatchEvent(new win.Event('DOMContentLoaded'));
  assert.ok(doc.querySelector('.page-sidebar .first-java-rail'));
  doc.querySelector('[data-section-target^="learning-scenes-"]').click();
  const button=doc.querySelector('.page-sidebar [data-first-java-go="1"]');button.click();
  assert.equal(button.getAttribute('aria-current'),'step');
  assert.deepEqual([...doc.querySelectorAll('[data-first-java-panel]')].map(p=>p.hidden),[true,false]);
  win.close();
});

const browserModule=process.env.PLAYWRIGHT_MODULE;
test('1440px 실제 화면의 전역 메뉴는 한 층·5개이고 본문 위 떠다니는 바는 없다', {skip:!browserModule,timeout:120000}, async () => {
  const require=createRequire(import.meta.url),{chromium}=require(browserModule);
  const externalBase=process.env.SITE_BASE_URL;
  const server=externalBase?null:spawn('python3',['-u','-m','http.server','0','--bind','127.0.0.1'],{cwd:root,stdio:['ignore','pipe','ignore']});
  const port=externalBase?null:await new Promise((resolve,reject)=>{server.stdout.on('data',chunk=>{const match=String(chunk).match(/port (\d+)/);if(match)resolve(match[1]);});server.once('error',reject);});
  let browser;
  try {
    browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1440,height:900},colorScheme:'dark'});
    for (const file of ['index.html','course/README.html','course/spring/README.html','course/spring/D00.html','course/spring/D11.html','course/map.html','course/resources.html','course/archive.html','course/java/README.html','course/tickets/README.html','lessons/README.html','tickets/README.html','course/java/J05.html','course/tickets/B01.html','course/start/README.html','docs/knowledge/README.html','docs/knowledge/README.html#kc-category-spring',...['C01','C02','C03','C04','C05','C06'].map(unit=>`lessons/concept-core.html?unit=${unit}`),'docs/knowledge/P16-json-jackson-practical.html','scenario/README.html','scenario/features/posts-create-read.html','scenario/ch0-first-steps/0-1-ts-to-java.html','docs/knowledge/P02-mvc-layered-architecture.html','practice/MISSIONS.html','tickets/001-board-list-api.html']) {
      const response=await page.goto(`${externalBase || `http://127.0.0.1:${port}`}/${file}`,{waitUntil:'load'});
      assert.equal(response.status(),200,file);
      assert.equal(await page.locator('.site-topbar nav[aria-label="주 메뉴"]').count(),1,file);
      const inspect=()=>{
        const visible=e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0&&!e.closest('[hidden]')&&getComputedStyle(e).visibility!=='hidden';
        const nav=document.querySelector('.site-topbar nav[aria-label="주 메뉴"]');
        return {items:nav.children.length,layers:new Set([...nav.children].map(e=>Math.round(e.getBoundingClientRect().top))).size,headerMenus:document.querySelectorAll('.site-topbar nav').length,floating:[...document.querySelectorAll('main *')].filter(visible).filter(e=>['sticky','fixed'].includes(getComputedStyle(e).position)&&!e.matches('.site-frame-sidebar,.page-sidebar,.day-today')&&!e.closest('.site-frame-sidebar,.page-sidebar,.day-today')).map(e=>e.className),sidebars:[...document.querySelectorAll('.page-sidebar,.day-today')].filter(visible).length,navOverflow:nav.scrollWidth-nav.clientWidth,overflow:document.documentElement.scrollWidth>1440};
      };
      if (/^course\/(?:java\/J\d+|tickets\/(?:B\d+|E\d+|drill))/.test(file)) {
        assert.equal(await page.locator('.exercise-kind').count(),0,`${file}: 종류 표시 중복 제거`);
        assert.equal(await page.locator('.content-page-kind').count(),1,`${file}: 종류 표시 한 번`);
      }
      let data=await page.evaluate(inspect);
      assert.equal(data.navOverflow,0,`${file}: 메뉴 가로 넘침`);assert.equal(data.items,5,`${file}: ${data.items} 항목`);assert.equal(data.layers,1,file);assert.equal(data.headerMenus,1,file);assert.deepEqual(data.floating,[],file);assert.ok(data.sidebars<=1,`${file}: 사이드바 중복`);assert.equal(data.overflow,false,`${file}: 가로 넘침`);
      if (file==='course/spring/D11.html') {await page.locator('[data-day-expand]').click();data=await page.evaluate(inspect);assert.deepEqual(data.floating,[],`${file}: 전체 보기`);assert.equal(data.sidebars,1);}
      const targets=page.locator('.page-sidebar .section-switcher button[data-section-target]');
      if(await targets.count()>1){await targets.nth(1).click();const samples=[await page.evaluate(()=>scrollY)];for(let n=0;n<10;n++){await page.waitForTimeout(100);samples.push(await page.evaluate(()=>scrollY));}assert.equal(Math.max(...samples)-Math.min(...samples),0,`${file}: 선택 후 지연 스크롤`);}
    }
  } finally {await browser?.close();server?.kill('SIGTERM');}
});
