import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { renderInitialPage } from './initial-render.mjs';
import { courseDestinations, mapDestinations, renderSectionNavigation } from './site-navigation.mjs';
test('모든 과정 하위 페이지는 같은 영역 메뉴와 올바른 상대 링크를 갖는다',()=>{
 const root=new URL('../../',import.meta.url);
 let count=0;
 const visit=dir=>{
  for(const entry of fs.readdirSync(new URL(dir,root),{withFileTypes:true})){
   const name=`${dir}/${entry.name}`;
   if(entry.isDirectory()){if(name!=='course/days')visit(name);continue;}
   if(!entry.name.endsWith('.md'))continue;
   const dom=new JSDOM(renderSectionNavigation(name),{url:`https://learn.example/${name.replace(/\.md$/,'.html')}`});
   const links=[...dom.window.document.querySelectorAll('nav a')];
   // 지도는 독립 대주제이며 나머지 과정 주소는 서비스 만들기 참고 메뉴를 공유한다.
   const destinations=name==='course/map.md'?mapDestinations:courseDestinations;
   assert.deepEqual(links.map(e=>e.textContent),destinations.map(e=>e.label),name);
   assert.deepEqual(links.map(e=>new URL(e.href).pathname.slice(1)+new URL(e.href).hash),destinations.map(e=>e.target),name);
   const html=fs.readFileSync(new URL(name.replace(/\.md$/,'.html'),root),'utf8');
   assert.ok(html.includes('class="site-frame"'),name);
   assert.ok(html.includes(renderSectionNavigation(name)),`${name}: 생성된 영역 메뉴`);
   dom.window.close();count++;
  }
 };
 visit('course');assert.ok(count>100);
});
test('JS 전에도 공통 틀과 기본 내용이 있으며 런타임이 새 틀을 중복 생성하지 않는다',()=>{
 const html=renderInitialPage('<!doctype html><html><head></head><body><main><h1>출발</h1><h2 id="one">첫 내용</h2><p>원문 하나</p><h2 id="two">다음 내용</h2><p>원문 둘</p></main></body></html>','course/start/README.md');
 const dom=new JSDOM(html,{url:'https://learn.example/course/start/README.html',runScripts:'outside-only'});
 const {window:win}=dom,doc=win.document;win.scrollTo=()=>{};
 assert.equal(doc.querySelectorAll('.site-frame').length,1);
 assert.ok(doc.querySelector('.site-frame-sidebar .section-switcher'));
 assert.ok(doc.querySelector('.site-frame-content h1'));
 assert.ok(doc.head.textContent.includes('javaexperience.course.config-format.v1'));
 win.eval(fs.readFileSync(new URL('section-switcher.js',import.meta.url),'utf8'));doc.dispatchEvent(new win.Event('DOMContentLoaded'));
 assert.equal(doc.querySelectorAll('.page-navigation-layout').length,1);
 doc.querySelector('[data-section-target="two"]').click();
 assert.equal(doc.querySelector('#one').closest('[data-section-panel]').hidden,true);
 assert.equal(doc.querySelector('#two').closest('[data-section-panel]').hidden,false);
 win.close();
});


test('개념 분야와 필수 기초 6단원은 같은 영역 메뉴에서 이동한다',async()=>{
 const {CORE_UNITS,DOMAINS}=await import('./concept-curriculum.mjs');
 for(const source of ['docs/knowledge/README.md','docs/knowledge/P09-java-syntax-basics.md','lessons/concept-core.md']){
  const dom=new JSDOM(renderSectionNavigation(source),{url:`https://learn.example/${source.replace(/\.md$/,'.html')}`});
  const links=[...dom.window.document.querySelectorAll('a')];
  for(const unit of CORE_UNITS)assert.ok(links.some(link=>link.pathname==='/lessons/concept-core.html'&&link.search===`?unit=${unit.id}`),`${source}: ${unit.id}`);
  for(const domain of DOMAINS)assert.ok(links.some(link=>link.hash===`#kc-category-${domain.id}`),`${source}: ${domain.id}`);
  dom.window.close();
 }
});

test('공통 틀의 리더 목차는 원문을 열고 기존 모드와 경쟁하지 않는다',()=>{
 const root=new URL('../../',import.meta.url);
 const html=fs.readFileSync(new URL('docs/knowledge/P09-java-syntax-basics.html',root),'utf8');
 const dom=new JSDOM(html,{url:'https://learn.example/docs/knowledge/P09-java-syntax-basics.html',runScripts:'outside-only'});
 const win=dom.window,doc=win.document;win.scrollTo=()=>{};win.HTMLElement.prototype.scrollIntoView=()=>{};
 win.eval(fs.readFileSync(new URL('knowledge-reader.js',import.meta.url),'utf8'));
 win.eval(fs.readFileSync(new URL('section-switcher.js',import.meta.url),'utf8'));
 doc.dispatchEvent(new win.Event('DOMContentLoaded'));
 assert.equal(doc.querySelectorAll('.site-frame').length,1);
 assert.equal(doc.querySelector('.section-switcher'),null);
 assert.equal(doc.querySelector('[data-knowledge-reader]').dataset.krMode,'scene');
 const link=doc.querySelector('.site-frame-sidebar [data-kr-toc-link]');assert.ok(link);
 link.click();
 assert.equal(doc.querySelector('[data-knowledge-reader]').dataset.krMode,'read');
 assert.equal(doc.querySelector('[data-kr-reading]').hidden,false);
 assert.ok(doc.getElementById(decodeURIComponent(link.hash.slice(1))));
 win.close();
});


test('문서의 현재 영역은 필터·다른 단원의 링크를 잘못 선택하지 않는다',()=>{
 for(const [source,expected] of [['docs/knowledge/P09-java-syntax-basics.md','docs/knowledge/README.html'],['docs/knowledge/S09-jpa-hibernate.md','docs/knowledge/README.html'],['lessons/A0-first-api.md','lessons/README.html'],['lessons/concept-core.md','lessons/concept-core.html?unit=C01']]){
  const dom=new JSDOM(renderSectionNavigation(source),{url:`https://learn.example/${source.replace(/\.md$/,'.html')}`});
  const selected=[...dom.window.document.querySelectorAll('a[aria-current]')].map(link=>new URL(link.href).pathname.slice(1)+new URL(link.href).search+new URL(link.href).hash);
  assert.deepEqual(selected,[expected],source);dom.window.close();
 }
});

// 목록·시안·API는 같은 원본 기능을 중복 나열하지 않고 각 보기로 이동한다.
test('서비스 만들기 사이드바는 기능·시안·API와 기존 참고 주소를 함께 보존한다',()=>{
 for(const source of ['scenario/README.md','scenario/features/posts-create-read.md','course/spring/D05.md','course/java/J05.md','course/tickets/B01.md','course/start/README.md']){
  const dom=new JSDOM(renderSectionNavigation(source),{url:`https://learn.example/${source.replace(/\.md$/,'.html')}`});
  const doc=dom.window.document,links=[...doc.querySelectorAll('nav a')];
  assert.deepEqual(links.map(link=>link.textContent),['기능 목록','단계별 시안','API EXPLORER','일자 목록','Java','티켓','출발 자료','더미 데이터','운영 실습','과정 안내']);
  assert.equal(doc.querySelector('.section-navigation-reference').textContent,'참고');
  assert.equal(links[1].hash,'#visual-catalog');assert.equal(links[2].hash,'#journey-all-apis');
  assert.equal(links[3].pathname,'/course/spring/README.html');
  dom.window.close();
 }
});

// 기능 심화 주소에서는 body 끝의 임시 CSS 해제 전에 실제 선택 상태를 인계해야 한다.
test('서비스 인라인 초기화는 DOMContentLoaded 전에 한 번만 실행하고 번들과 중복 연결하지 않는다',async()=>{
 const entry=fs.readFileSync(new URL('./service-feature-entry.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
 const dom=new JSDOM(`<html><head></head><body><script data-service-initial>${entry}</script><script>window.callsAtBodyEnd=[...window.mountCalls];</script><script>${entry}</script></body></html>`,{url:'https://learn.example/scenario/features/posts-create-read.html?variant=board&stage=read',runScripts:'dangerously',beforeParse(win){
  win.mountCalls=[];
  win.mountServiceFeaturePages=()=>win.mountCalls.push('feature');
  win.mountServiceRequestTools=()=>win.mountCalls.push('request');
 }});
 assert.deepEqual([...dom.window.callsAtBodyEnd],['feature','request'],'첫 화면 CSS가 해제되기 전에 선택·요청 폼 초기화');
 if(dom.window.document.readyState==='loading')await new Promise(resolve=>dom.window.document.addEventListener('DOMContentLoaded',resolve,{once:true}));
 assert.deepEqual([...dom.window.mountCalls],['feature','request'],'인라인과 캐시 번들 이벤트는 한 번만 연결');
 dom.window.close();
});

// 대형 HTML은 body 끝 controller가 파싱되기 전에 먼저 페인트될 수 있다.
test('개념 분야 해시는 늦게 도착하는 본문보다 먼저 패널과 사이드바 선택을 맞춘다',async()=>{
 const fixture='<html><head></head><body><main><section class="course-guide"><nav class="guide-index"><a href="#intro">소개</a><a href="#kc-browse-view">개념 분야</a></nav><div class="guide-content"><section class="guide-section kc-intro" id="intro"><h2>소개</h2></section><section class="guide-section" id="kc-browse-view"><h2>분야별 개념</h2><button data-kc-category="all" aria-pressed="true">전체</button><button data-kc-category="spring" aria-pressed="false">Spring</button></section></div></section></main></body></html>';
 const baked=new JSDOM(renderInitialPage(fixture,'docs/knowledge/README.md'));
 const early=baked.window.document.head.querySelector('script').textContent;
 const dom=new JSDOM('<html><head></head><body></body></html>',{url:'https://learn.example/docs/knowledge/README.html#kc-category-spring',runScripts:'outside-only'});
 const win=dom.window,doc=win.document;win.CSS={escape:value=>String(value)};win.scrollTo=()=>{};
 win.eval(early);
 doc.body.innerHTML=baked.window.document.body.innerHTML.replace(/<script[\s\S]*?<\/script>/g,'');
 await Promise.resolve(); // 파싱 중 추가된 노드는 첫 rendering task보다 먼저 MutationObserver로 인계된다.
 const selected=()=>doc.querySelector('.section-switcher [aria-selected="true"]')?.dataset.sectionTarget;
 assert.equal(selected(),'kc-browse-view');
 assert.equal(win.getComputedStyle(doc.getElementById('intro')).display,'none');
 assert.notEqual(win.getComputedStyle(doc.getElementById('kc-browse-view')).display,'none');
 win.eval(fs.readFileSync(new URL('./section-switcher.js',import.meta.url),'utf8'));doc.dispatchEvent(new win.Event('DOMContentLoaded'));
 assert.equal(selected(),'kc-browse-view','실제 controller 인계 때 선택이 바뀌지 않는다');
 doc.getElementById('first-paint-state').stopEarlySelection();doc.getElementById('first-paint-state').remove();
 assert.equal(doc.getElementById('intro').hidden,true);
 baked.window.close();win.close();
});


// 잘못된 해시와 다른 페이지는 분야 controller의 기본 선택을 덮어쓰지 않는다.
test('초기 분야 선택은 실제 분야 버튼과 개념 목록 패널이 모두 있을 때만 적용한다',async()=>{
 const controls='<button data-kc-category="all" aria-pressed="true">전체</button><button data-kc-category="spring" aria-pressed="false">Spring</button>';
 for(const [name,content,hash] of [
  ['알 수 없는 분야',`<section id="kc-browse-view">${controls}</section>`,'kc-category-unknown'],
  ['분야 버튼 없는 페이지','<section id="kc-browse-view">다른 자료</section>','kc-category-spring'],
  ['개념 목록 패널 없는 페이지',`<section id="other">${controls}</section>`,'kc-category-spring'],
 ]) {
  const fixture=`<html><head></head><body><main><h1>자료</h1><h2 id="intro">소개</h2>${content}</main></body></html>`;
  const baked=new JSDOM(renderInitialPage(fixture,'course/start/README.md'));
  const dom=new JSDOM(baked.serialize(),{url:`https://learn.example/course/start/README.html#${hash}`,runScripts:'outside-only'});
  const win=dom.window,doc=win.document;win.CSS={escape:value=>String(value)};
  win.eval(doc.head.querySelector('script').textContent);
  doc.body.append(doc.createElement('p'));await Promise.resolve();
  assert.equal(doc.getElementById('first-paint-state').stopEarlySelection,undefined,name);
  assert.equal(doc.querySelector('button[data-kc-category="all"]')?.getAttribute('aria-pressed')??'true','true',name);
  assert.equal(doc.querySelector('button[data-kc-category="spring"]')?.getAttribute('aria-pressed')??'false','false',name);
  baked.window.close();win.close();
 }
});
