import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { renderKnowledgeVisual } from './knowledge-visual.mjs';
import { initKnowledgeCatalog, CATALOG_RETURN_KEY } from './knowledge-catalog-controller.mjs';
import { PROGRESS_KEY } from './home-state.mjs';
const HISTORY_KEY = '__javaExperienceKnowledge';
const root = new URL('../../', import.meta.url).pathname;
// 실제 Markdown 제목·소제목 및 검토된 웹 메타데이터로 controller를 검증한다.
const sessions = (win) => Object.fromEntries(Object.keys(win.sessionStorage).map((key) => [key, win.sessionStorage.getItem(key)]));
const fixtures = [];
function page(url='README.html', { session={}, progress=null, detail=false, referrer='', history={} }={}) {
  const html = detail ? '<a href="README.html" data-kc-catalog-return>검색 결과로 돌아가기</a>' : renderKnowledgeVisual(root)+'<details id="kc-original"><summary>원문</summary><h2 id="original-section">기존 절</h2></details>';
  const dom = new JSDOM(html, {url:new URL(url,'https://learn.example/docs/knowledge/').href, ...(referrer ? {referrer} : {})});
  const win=dom.window, doc=win.document;
  let scroll=0; let navigation=null; let backs=0;
  Object.defineProperty(win,'scrollY',{get:()=>scroll});
  win.scrollTo=(x,y)=>{scroll=typeof x==='object'?x.top:y;};
  win.history.replaceState(history,'');
  win.history.back=()=>{backs++;};
  const nativeGo=win.history.go.bind(win.history);
  doc.addEventListener('click',(event)=>{if(event.target.closest('a'))event.preventDefault();});
  for (const [key,value] of Object.entries(session)) win.sessionStorage.setItem(key,value);
  if(progress)win.localStorage.setItem(PROGRESS_KEY,progress);
  if (!detail) {
    const aliases=doc.querySelector('[data-kc-aliases]') || doc.createElement('script'); aliases.type='application/json';aliases.dataset.kcAliases=''; aliases.textContent=JSON.stringify({'데이터 전달 객체':'DTO'});if(!aliases.parentNode)doc.querySelector('.kc-catalog').append(aliases);
    const question=doc.querySelector('[data-kc-document="P16"]');question.dataset.kcQuestion='요청 JSON은 어떻게 DTO가 될까요?';
    for(const row of doc.querySelectorAll('[data-kc-document]')) row.getBoundingClientRect=()=>({top:200-scroll,bottom:280-scroll});
    // 구 renderer에서도 controller의 제목순 계약을 독립적으로 검증한다.
    const oldOption=doc.querySelector('[data-kc-sort] option[value="id"]');if(oldOption){oldOption.value='title';oldOption.textContent='제목순';}
  }
  initKnowledgeCatalog(doc,win,{navigate:(href)=>{navigation=href;}});
  const result={win,doc,$:(selector)=>doc.querySelector(selector),visible:()=>[...doc.querySelectorAll('[data-kc-document]')].filter((row)=>!row.hidden),scroll:()=>scroll,navigation:()=>navigation,backs:()=>backs,nativeGo};
  fixtures.push(result);return result;
}
const submit=(p,value)=>{p.$('#knowledge-search-input').value=value;p.$('.kc-search').dispatchEvent(new p.win.Event('submit',{cancelable:true}));};
const draft=(p,value)=>{p.$('#knowledge-search-input').value=value;p.$('#knowledge-search-input').dispatchEvent(new p.win.Event('input'));};
const change=(p,selector,value)=>{p.$(selector).value=value;p.$(selector).dispatchEvent(new p.win.Event('change'));};
const restore=(p,entry)=>{p.win.history.replaceState(entry.state,'',entry.href);p.win.dispatchEvent(new p.win.PopStateEvent('popstate',{state:entry.state}));};
const snapshot=(p)=>({state:structuredClone(p.win.history.state),href:p.win.location.href});

test('검색·분야·정렬은 history 한 개씩 추가하고 타 모듈 state를 보존한다',()=>{
  const p=page('README.html',{history:{home:{keep:true}}});const initial=p.win.history.length;
  submit(p,'DTO');
  assert.equal(p.win.history.length,initial+1,'새 검색을 확정하면 뒤로가기로 돌아갈 entry가 필요');
  assert.equal(p.visible().length,7);assert.equal(p.$('[data-kc-category-select]').value,'all');
  assert.deepEqual(p.win.history.state.home,{keep:true});
  submit(p,'DTO');assert.equal(p.win.history.length,initial+1,'동일 조건 재제출은 중복 entry 없음');
  p.$('button[data-kc-category="java"]').click();assert.equal(p.win.history.length,initial+2);
  assert.equal(p.visible().length,0);assert.match(p.$('[data-kc-filter-reset]').textContent,/7개/);
  submit(p,'DTO');assert.equal(p.visible().length,0,'결과 안 재검색은 현재 분야 유지');
  p.$('[data-kc-filter-reset]').click();assert.equal(p.visible().length,7);assert.equal(p.$('#knowledge-search-input').value,'DTO');
  change(p,'[data-kc-sort]','title');assert.equal(p.win.history.state[HISTORY_KEY].sort,'title');
  assert.deepEqual(p.win.history.state.home,{keep:true});
});

test('탐색 대표 세 문서와 검색 관련도는 별도의 실제 메타데이터 순서를 따른다',()=>{
  const p=page();assert.deepEqual(p.visible().map((row)=>row.dataset.kcDocument),['P09','P04','P29']);
  p.$('button[data-kc-category="request"]').click();assert.deepEqual(p.visible().map((row)=>row.dataset.kcDocument),['P16','W09','P02']);
  submit(p,'DTO');assert.deepEqual(p.visible().map((row)=>row.dataset.kcDocument),['P16','W09','P06','P02','P03','P25','W10']);
  const count=p.win.history.length;const all=p.$('button[data-kc-category="all"]');all.focus();all.dispatchEvent(new p.win.KeyboardEvent('keydown',{key:'End',cancelable:true}));
  assert.equal(p.doc.activeElement.dataset.kcCategory,'delivery');assert.equal(p.win.history.length,count,'화살표 탐색은 선택 확정 전까지 history를 추가하지 않음');
});

test('미확정 초안은 분야를 바꿔도 제출 전 검색 조건을 덮어쓰지 않는다',()=>{
  const p=page();submit(p,'DTO');const count=p.win.history.length;
  draft(p,'객체');assert.match(p.$('[data-kc-results-title]').textContent,/DTO/);assert.equal(p.win.history.length,count);
  p.$('button[data-kc-category="java"]').click();assert.match(p.$('[data-kc-results-title]').textContent,/DTO/);
  assert.equal(p.win.history.length,count+1);assert.equal(p.$('#knowledge-search-input').value,'객체');
  submit(p,'객체');assert.match(p.$('[data-kc-results-title]').textContent,/객체/);assert.equal(p.$('[data-kc-category-select]').value,'java');
});

test('IME 조합 중 Enter와 submit은 확정 검색으로 처리하지 않는다',()=>{
  const p=page();const input=p.$('#knowledge-search-input');input.dispatchEvent(new p.win.CompositionEvent('compositionstart'));
  input.value='객';const enter=new p.win.KeyboardEvent('keydown',{key:'Enter',isComposing:true,cancelable:true});input.dispatchEvent(enter);
  const count=p.win.history.length;p.$('.kc-search').dispatchEvent(new p.win.Event('submit',{cancelable:true}));
  assert.equal(p.win.history.length,count);assert.equal(p.$('[data-kc-hero-title]').textContent,'막힌 개념을, 값의 변화로 이해하세요.');
  input.dispatchEvent(new p.win.CompositionEvent('compositionend'));submit(p,'객체');assert.match(p.$('[data-kc-results-title]').textContent,/객체 검색/);
});

test('검색 ×는 분야를 보존하고 전체 0건의 주 행동은 검색어를 보존한 수정이다',()=>{
  const p=page();submit(p,'DTO');p.$('button[data-kc-category="java"]').click();p.$('[data-kc-search-clear]').click();
  assert.equal(p.$('#knowledge-search-input').value,'');assert.equal(p.$('[data-kc-category-select]').value,'java');assert.equal(p.doc.activeElement,p.$('#knowledge-search-input'));
  submit(p,'확실히없는문서012345');assert.equal(p.visible().length,0);assert.equal(p.$('[data-kc-filter-reset]').hidden,false);assert.equal(p.$('[data-kc-filter-reset]').textContent,'검색어 수정');
  const count=p.win.history.length;p.$('[data-kc-filter-reset]').click();assert.equal(p.$('#knowledge-search-input').value,'확실히없는문서012345');assert.equal(p.win.history.length,count);assert.equal(p.doc.activeElement,p.$('#knowledge-search-input'));
  p.$('[data-kc-reset]').click();assert.equal(p.$('#knowledge-search-input').value,'');assert.equal(p.$('[data-kc-category-select]').value,'all');
});

test('literal NFKC AND 검색과 명시 alias·질문 일치만 확장한다',()=>{
  const p=page();submit(p,'ＤＴＯ');assert.equal(p.visible().length,7);
  submit(p,'데이터 전달 객체');assert.equal(p.visible().length,7,'명시 alias만 literal DTO로 연결');
  submit(p,'요청 JSON은 어떻게 DTO가 될까요?');assert.deepEqual(p.visible().map((row)=>row.dataset.kcDocument),['P16']);
  submit(p,'DTO jackson');assert.ok(p.visible().length>0);assert.ok(p.visible().every((row)=>/dto/.test(row.dataset.kcSearch)&&/jackson/.test(row.dataset.kcSearch)));
  submit(p,'object for transport');assert.equal(p.visible().length,0,'임의 의미검색으로 유사 결과를 발명하지 않음');
});

test('popstate는 검색조건·미완성초안·결과 focus·스크롤을 목적지 entry에서 복원한다',()=>{
  const p=page('README.html',{history:{foreign:'그대로'}});submit(p,'DTO');
  p.$('[data-kc-document="P16"] h3 a').focus();p.win.scrollTo(0,180);draft(p,'미완성 질문');const before=snapshot(p);
  change(p,'[data-kc-sort]','title');draft(p,'다른 초안');p.win.scrollTo(0,333);const departureId=p.win.history.state[HISTORY_KEY].entryId;
  restore(p,before);
  assert.equal(p.$('#knowledge-search-input').value,'미완성 질문');assert.equal(p.$('[data-kc-sort]').value,'relevance');assert.equal(p.visible().length,7);
  assert.equal(p.doc.activeElement.dataset.kcOpen,'P16');assert.equal(p.scroll(),180);assert.equal(p.win.history.state.foreign,'그대로');
  const departure=JSON.parse(p.win.sessionStorage.getItem('javaexperience:knowledge:v8:entry:'+departureId));assert.equal(departure.inputDraft,'다른 초안','출발 캐시는 목적지 history.state에 덮지 않고 자신의 entry에 저장');
  assert.equal(p.win.history.state[HISTORY_KEY].inputDraft,'미완성 질문');
});

test('native Back/Forward도 각 entry의 확정 조건과 미확정 입력을 따로 복원한다',async()=>{
  const p=page();submit(p,'DTO');draft(p,'이전 초안');change(p,'[data-kc-sort]','title');draft(p,'새 초안');
  const move=(delta)=>new Promise((resolve)=>{p.win.addEventListener('popstate',resolve,{once:true});p.nativeGo(delta);});
  await move(-1);assert.equal(p.$('[data-kc-sort]').value,'relevance');assert.equal(p.$('#knowledge-search-input').value,'이전 초안');assert.equal(p.visible().length,7);
  await move(1);assert.equal(p.$('[data-kc-sort]').value,'title');assert.equal(p.$('#knowledge-search-input').value,'새 초안');assert.equal(p.visible().length,7);
});

test('일반 상세 이동은 일회 origin을 넘기며 상세 복귀는 정확한 목록 entry로 돌아간다',()=>{
  const p=page();submit(p,'DTO');p.win.scrollTo(0,240);const listId=p.win.history.state[HISTORY_KEY].entryId;
  p.$('[data-kc-document="P16"] h3 a').click();const target=new URL(p.navigation());assert.ok(target.searchParams.get('kcOrigin'));
  const detail=page(target.href,{detail:true,session:sessions(p.win),referrer:p.win.location.href,history:{p16:{scene:1}}});
  assert.equal(detail.win.history.state[HISTORY_KEY].origin.listEntryId,listId);assert.deepEqual(detail.win.history.state.p16,{scene:1});
  assert.equal(new URL(detail.win.location.href).searchParams.has('kcOrigin'),false,'확인한 일회 토큰은 URL에서 제거');
  assert.match(detail.$('[data-kc-catalog-return]').textContent,/검색 결과로 돌아가기/);detail.$('[data-kc-catalog-return]').click();assert.equal(detail.backs(),1);
  assert.equal(detail.win.sessionStorage.getItem(CATALOG_RETURN_KEY),null,'handoff는 상세에서 소모');
});

test('상세 원문 hash 이동은 기본 history를 보존하고 명시 복귀만 목록 snapshot으로 연결한다',()=>{
  const p=page();submit(p,'DTO');p.$('[data-kc-document="P16"] h3 a').focus();p.win.scrollTo(0,170);draft(p,'DTO를 더 알아보기');
  p.$('[data-kc-document="P16"] h3 a').click();const detail=page(p.navigation(),{detail:true,session:sessions(p.win),referrer:p.win.location.href});
  const count=detail.win.history.length;detail.win.history.pushState(null,'','#p16-original');detail.win.dispatchEvent(new detail.win.HashChangeEvent('hashchange'));
  assert.equal(detail.win.history.length,count+1);assert.equal(detail.win.history.state,null,'원문 hash entry에 controller 상태를 주입하지 않음');
  detail.$('[data-kc-catalog-return]').click();assert.equal(detail.backs(),0);const target=new URL(detail.navigation());assert.ok(target.searchParams.get('kcReturn'));
  const returned=page(target.href,{session:sessions(detail.win)});assert.equal(returned.visible().length,7);assert.equal(returned.$('#knowledge-search-input').value,'DTO를 더 알아보기');assert.equal(returned.doc.activeElement.dataset.kcOpen,'P16');assert.equal(returned.scroll(),170);assert.equal(new URL(returned.win.location.href).searchParams.has('kcReturn'),false);
});

test('원문 절을 가리키는 상세 링크도 토큰 처리에서 hash를 그대로 보존한다',()=>{
  const p=page();submit(p,'DTO');const link=p.$('[data-kc-document="P16"] h3 a');link.hash='#p16-original';link.click();
  assert.equal(new URL(p.navigation()).hash,'#p16-original');const detail=page(p.navigation(),{detail:true,session:sessions(p.win),referrer:p.win.location.href});
  assert.equal(new URL(detail.win.location.href).hash,'#p16-original');assert.match(detail.$('[data-kc-catalog-return]').textContent,/검색 결과/);
});

test('modifier·새탭·직접 URL·오래된 origin은 복사 세션의 검색 복귀를 상속하지 않는다',()=>{
  const p=page();submit(p,'DTO');const link=p.$('[data-kc-document="P16"] h3 a');
  link.dispatchEvent(new p.win.MouseEvent('click',{bubbles:true,ctrlKey:true,cancelable:true}));assert.equal(p.navigation(),null);assert.equal(p.win.sessionStorage.getItem(CATALOG_RETURN_KEY),null);
  link.target='_blank';link.click();assert.equal(p.navigation(),null);link.target='';link.click();const url=p.navigation();const cached=sessions(p.win);
  const direct=page(link.href,{detail:true,session:cached,referrer:p.win.location.href});assert.equal(direct.$('[data-kc-catalog-return]').textContent,'개념 목록으로');
  assert.equal(direct.win.history.state[HISTORY_KEY],undefined);
  const pending=JSON.parse(cached[CATALOG_RETURN_KEY]);pending.time=Date.now()-120000;cached[CATALOG_RETURN_KEY]=JSON.stringify(pending);
  const stale=page(url,{detail:true,session:cached,referrer:p.win.location.href});assert.equal(stale.$('[data-kc-catalog-return]').textContent,'개념 목록으로');
  const wrong=page(url,{detail:true,session:sessions(p.win),referrer:'https://learn.example/other.html'});assert.equal(wrong.$('[data-kc-catalog-return]').textContent,'개념 목록으로');
});

test('새로고침은 해당 history entry의 초안을 복원하며 copied session만으로 목록 조건을 바꾸지 않는다',()=>{
  const p=page();submit(p,'DTO');draft(p,'미확정');const same=page(p.win.location.href,{session:sessions(p.win),history:p.win.history.state});
  assert.equal(same.$('#knowledge-search-input').value,'미확정');assert.equal(same.visible().length,7);
  const direct=page('README.html',{session:sessions(p.win)});assert.equal(direct.$('#knowledge-search-input').value,'');assert.equal(direct.$('[data-kc-category-select]').value,'java');
});

test('학습 진도 불변·원문 앵커·모바일 select·저장 차단·텍스트 보안을 유지한다',()=>{
  const progress=JSON.stringify({version:1,selected:'1-1',active:'1-1',records:{'1-1':{status:'in-progress',scene:null}}});
  const active=page('README.html', {progress});assert.equal(active.$('[data-kc-context]').hidden,false);submit(active,'DTO');assert.equal(active.visible()[0].dataset.kcDocument,'P16');
  change(active,'[data-kc-category-select]','java');assert.equal(active.visible().length,0);active.$('[data-kc-filter-reset]').click();
  assert.equal(active.win.localStorage.getItem(PROGRESS_KEY),progress);submit(active,'<img src=x onerror=alert(1)>');assert.equal(active.$('[data-kc-results-title]').children.length,0);assert.equal(active.doc.querySelectorAll('img').length,0);
  const anchor=page('README.html#original-section');assert.equal(anchor.$('#kc-original').open,true);anchor.$('[data-kc-original]').click();assert.equal(anchor.$('#kc-original').open,true);
  const blocked=new JSDOM(renderKnowledgeVisual(root),{url:'https://learn.example/docs/knowledge/README.html'});
  blocked.window.scrollTo=()=>{};
  for(const name of ['sessionStorage','localStorage'])Object.defineProperty(blocked.window,name,{get(){throw new blocked.window.DOMException('차단됨','SecurityError');}});
  assert.doesNotThrow(()=>initKnowledgeCatalog(blocked.window.document,blocked.window));blocked.window.document.querySelector('[data-kc-query="DTO"]').click();assert.equal([...blocked.window.document.querySelectorAll('[data-kc-document]')].filter((row)=>!row.hidden).length,7);blocked.window.close();
});

test.after(()=>{for(const fixture of fixtures)fixture.win.close();});
