import fs from 'node:fs';
import { renderSectionNavigation } from './site-navigation.mjs';
import { JSDOM } from 'jsdom';
import { initP09Learning } from './p09-learning.js';
import { initCoreLearning } from './core-learning.js';
import { initKnowledgeCatalog } from './knowledge-catalog-controller.mjs';
import { mountServiceFeaturePages } from './service-feature-client.mjs';
import { mountServiceRequestTools } from './service-request-client.mjs';
const reader = fs.readFileSync(new URL('./knowledge-reader.js', import.meta.url),'utf8');
const switcher = fs.readFileSync(new URL('./section-switcher.js', import.meta.url),'utf8');
// 런타임과 같은 탐색 규칙으로 레이아웃을 먼저 확정한다.
export function renderInitialPage(html, sourcePath = 'README.md') {
  const dom = new JSDOM(html,{url:'https://learn.example/',runScripts:'outside-only'});
  const win=dom.window,doc=win.document;
  win.scrollTo=()=>{};
  if(doc.querySelector('.kc-catalog')){
    initKnowledgeCatalog(doc,win);
    delete doc.querySelector('.kc-catalog').dataset.ready;
  }
  if(doc.querySelector('[data-p09-learning]')) {
    initP09Learning(doc,win);
    delete doc.querySelector('[data-p09-learning]').dataset.ready;
  }
  if(doc.querySelector('[data-knowledge-reader]')) {
    win.eval(reader + '\ninitKnowledgeReader(document, window);');
  }
  if(doc.querySelector('[data-core-learning]')) {
    initCoreLearning(doc,win);
    delete doc.querySelector('[data-core-learning]').dataset.ready;
  }
  const map=doc.querySelector('[data-course-map]');
  if(map){
    const explore=doc.createElement('button');explore.type='button';explore.className='cm-explore';explore.dataset.cmExplore='';explore.textContent='전체 연결 탐색';explore.setAttribute('aria-pressed','false');map.querySelector('[data-cm-current]').after(explore);
    const tools=doc.createElement('details');tools.className='cm-tools';tools.innerHTML='<summary>관계 범례·보기 설정</summary>';
    const legend=map.querySelector('.cm-legend'),toolbar=map.querySelector('.cm-toolbar');legend.before(tools);tools.append(legend,toolbar);
  }
  if(map){
    win.matchMedia=()=>({matches:false});
    const script=fs.readFileSync(new URL('./course-map.js',import.meta.url),'utf8').replace("var tables = document.querySelector('.cm-tables');",'var tables = null;');
    win.eval(script);
  }
  // 서비스 원본 renderer의 JS 없는 전체 열람 계약은 보존하고, 배포 HTML만 런타임 첫 상태로 만든다.
  if(doc.querySelector('[data-sf-catalog],[data-sf-feature]')) {
    mountServiceFeaturePages(doc);
    mountServiceRequestTools(doc);
  }
  win.eval(switcher);doc.dispatchEvent(new win.Event('DOMContentLoaded'));
  const lessonDefault = doc.querySelector('[data-concept-default]')?.dataset.conceptDefault;
  if (lessonDefault) {
    const button = [...doc.querySelectorAll('.section-switcher [data-section-target]')].find(item => item.dataset.sectionTarget === lessonDefault);
    button?.click();
  }
  const main=doc.querySelector('main');
  if(main)delete main.dataset.sectionViewsReady;
  const day=doc.querySelector('[data-day-page]');
  if(day){
    const panels=[...day.querySelectorAll('.day-stepper-main > [data-day-panel]')];
    const active=panels.find(p=>p.matches('.day-step'))||panels[0];
    panels.forEach(panel=>{panel.hidden=panel!==active;});
    day.classList.add('day-stepper-ready');
    day.querySelectorAll('[data-panel-link]').forEach(link=>{const selected=link.hash===`#${active?.id}`;link.parentElement.classList.toggle('is-active',selected);if(selected)link.setAttribute('aria-current','step');});
    day.querySelectorAll('[data-day-expand],.day-wrap-tabs').forEach(el=>{el.hidden=false;});
    const wraps=[...day.querySelectorAll('[data-wrap-panel]')];wraps.forEach((panel,i)=>{panel.hidden=i!==0;});
    const position=day.querySelector('[data-day-position]');if(position)position.textContent='현재 화면 · '+(active?.matches('.day-step')?'구현 '+active.querySelector('.step-number')?.textContent:'준비');
  }
  doc.querySelectorAll('[data-config-tabs]').forEach(group=>{
    group.querySelector('[role="tablist"]').hidden=false;
    group.querySelectorAll('[data-config-panel]').forEach(panel=>{panel.hidden=panel.dataset.configPanel!=='yml';});
  });
  // 모든 문서에 동일한 바깥 틀을 만들고 기존 페이지 탐색을 같은 레일에 둔다.
  if(main){
    const frame=doc.createElement('div');frame.className='site-frame';
    if (sourcePath.startsWith('docs/knowledge/') || sourcePath.startsWith('lessons/')) frame.classList.add('site-concept-frame');
    const sidebar=doc.createElement('aside');sidebar.className='site-frame-sidebar';sidebar.setAttribute('aria-label','영역 및 페이지 탐색');
    sidebar.innerHTML=renderSectionNavigation(sourcePath);
    const local=main.querySelector('.page-sidebar,.day-today');
    if(local){local.classList.add('site-local-navigation');sidebar.append(local);}
    const toc=main.querySelector('.kr-toc');
    if(toc)sidebar.append(toc);
    const coreNav=main.querySelector('.core-learning-sidebar');
    if(coreNav) {
      const prerequisites=coreNav.querySelector('.core-prerequisites');
      if(prerequisites)sidebar.append(prerequisites);
      coreNav.hidden=true;
    }
    const content=doc.createElement('div');content.className='site-frame-content';
    content.append(...main.childNodes);frame.append(sidebar,content);main.append(frame);
    main.classList.add('site-main');
  }
  // 해시와 저장된 탭은 문서 파싱 전에 CSS 상태로 반영한다.
  const panelMap={};
  for(const node of doc.querySelectorAll('[id]')){
    const owner=node.closest('[data-day-panel],[data-section-panel]');
    if(owner)panelMap[node.id]=owner.id;
  }
  const knowledgeCategories=[...new Set([...doc.querySelectorAll('button[data-kc-category]')].map(button=>button.dataset.kcCategory))];
  const servicePanels=[...doc.querySelectorAll('[data-sf-stage-panel]')].map(e=>({id:e.id,variant:e.dataset.sfVariant,stage:e.dataset.sfStage}));
  const dayPanels=[...doc.querySelectorAll('.day-stepper-main > [data-day-panel]')].map(e=>({id:e.id,display:e.matches('.day-stage-wrap')?'grid':'block',initial:!e.hidden}));
  const prepare=doc.createElement('script');
  prepare.textContent=`(${prepareFirstPaint.toString()})(${JSON.stringify({panelMap,dayPanels,servicePanels,knowledgeCategories})});`;
  // 서비스 전용 보기는 다른 영역의 초기 렌더링 코드와 분리한다.
  if(doc.querySelector('[data-sf-catalog]')) prepare.textContent += `;(${prepareServiceCatalogFirstPaint.toString()})();`;
  if (doc.querySelector('.kc-catalog')) prepare.textContent += `;(${prepareConceptPanel.toString()})(${JSON.stringify(panelMap)});`;
  doc.head.append(prepare);
  const release=doc.createElement('script');release.textContent="document.getElementById('first-paint-state')?.stopEarlySelection?.();document.getElementById('first-paint-state')?.remove();";doc.body.append(release);
  const fallback=doc.createElement('noscript');
  const fallbackStyle=doc.createElement('style');fallbackStyle.textContent='body main [data-day-panel][hidden],body main [data-wrap-panel][hidden],body main [data-section-panel][hidden],body main [data-config-panel][hidden],body main [data-sf-stage-panel][hidden],body main [data-sf-aside-stage][hidden],body main [data-sf-group-cards][hidden],body main [data-sf-api-rows][hidden]{display:block!important}body .section-switcher,body .day-wrap-tabs,body [data-day-expand]{display:none!important}';fallback.append(fallbackStyle);
  doc.head.append(fallback);
  // 교육 예시의 구간 경계는 같은 글자로 표시하되 실제 병합 마커와 구분한다.
  const result=dom.serialize().replace(/^[ \t]+$/gm,'').replace(/^={7}$/gm,'&#61;======');win.close();return result;
}

// head에서 실행된다. 런타임이 같은 선택을 인계받은 뒤 임시 CSS만 제거한다.
function prepareFirstPaint({panelMap,dayPanels,servicePanels,knowledgeCategories}) {
  const root=document.documentElement;
  root.classList.add('js');
  document.addEventListener('click',event=>{
    const apiButton=event.target?.closest?.('[data-sf-api-collapse]');
    if(apiButton){
      const catalog=apiButton.closest('[data-sf-catalog]');
      for(const group of catalog?.querySelectorAll('[data-sf-api-group]')||[]){
        if(group===apiButton.closest('[data-sf-api-group]'))continue;
        const rows=group.querySelector('[data-sf-api-rows]'),button=group.querySelector('[data-sf-api-collapse]');
        if(rows&&button){rows.hidden=true;button.setAttribute('aria-expanded','false');const icon=button.querySelector('[aria-hidden="true"]');if(icon)icon.textContent='›';}
      }
    }
    const link=event.target?.closest?.('a[href]');if(!link)return;
    let target;try{target=new URL(link.href,location.href)}catch{return}
    if(!/\/(?:docs\/knowledge|lessons)\//.test(target.pathname))return;
    const current=new URL(location.href);
    const carried=current.searchParams.get('return');
    const eligible=/\/(?:course\/(?:spring\/D\d{2}|java\/J\d{2})|scenario\/features\/[^/]+)\.html$/.test(current.pathname);
    const destination=carried|| (eligible?current.pathname+current.search+current.hash:'');
    if(destination)target.searchParams.set('return',destination);
    link.href=target.href;
  },true);
  const returnValue=new URLSearchParams(location.search).get('return');
  if(returnValue && /^(?:\/(?:course\/(?:spring\/D\d{2}|java\/J\d{2})|scenario\/features\/[^/]+)\.html)(?:[?#].*)?$/.test(returnValue)){
    const addReturn=()=>{
      if(!document.querySelector('main.site-main .site-concept-frame'))return;
      if(document.querySelector('.concept-return-link'))return;
      const heading=document.querySelector('main.site-main .site-frame-content h1');if(!heading)return;
      const link=document.createElement('a');link.className='concept-return-link';link.href=returnValue;link.textContent='이전 작업 화면으로 돌아가기';heading.before(link);
    };
    document.addEventListener('DOMContentLoaded',addReturn,{once:true});
  }
  let format='yml';try {if(localStorage.getItem('javaexperience.course.config-format.v1')==='properties')format='properties';}catch{}
  root.dataset.configFormat=format;
  let id='';try{id=decodeURIComponent(location.hash.slice(1));}catch{}
  const style=document.createElement('style');style.id='first-paint-state';
  const active=panelMap[id]||dayPanels.find(p=>p.initial)?.id;
  const category=id.startsWith('kc-category-')?id.slice('kc-category-'.length):null;
  if(category && knowledgeCategories.includes(category) && panelMap['kc-browse-view']) {
    // 큰 문서는 body 끝의 controller보다 먼저 페인트될 수 있어 분야 패널과 선택 표시를 먼저 인계한다.
    const target='kc-browse-view';
    style.textContent+=`html.js body main [data-section-panel]:not(#${target}):not(:has(#${target})):not(#${target} [data-section-panel]){display:none!important}html.js body main #${target}{display:block!important}`;
    const select=()=>{
      for(const button of document.querySelectorAll('.section-switcher [data-section-target]')) {
        const selected=button.dataset.sectionTarget===target;
        button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;
      }
      for(const button of document.querySelectorAll('button[data-kc-category]')) {
        const selected=button.dataset.kcCategory===category;
        button.setAttribute('aria-pressed',String(selected));button.tabIndex=selected?0:-1;
      }
    };
    const observer=new MutationObserver(select);
    observer.observe(document,{childList:true,subtree:true});
    style.stopEarlySelection=()=>observer.disconnect();
    select();
  }
  if(servicePanels.length){
    const params=new URLSearchParams(location.search);
    const selected=servicePanels.find(p=>p.id===id)||servicePanels.find(p=>p.variant===params.get('variant')&&p.stage===params.get('stage'))||servicePanels[0];
    style.textContent+=servicePanels.map(p=>`html.js body main #${CSS.escape(p.id)}{display:${p.id===selected.id?'block':'none'}!important}`).join('');
    style.textContent+=`html.js body main [data-sf-aside-stage]{display:none!important}html.js body main [data-sf-aside-stage][data-sf-variant="${CSS.escape(selected.variant)}"][data-sf-stage="${CSS.escape(selected.stage)}"]{display:block!important}`;
  }
  if(dayPanels.length)style.textContent+=dayPanels.map(p=>`html.js body main #${CSS.escape(p.id)}{display:${p.id===active?p.display:'none'}!important}`).join('');
  // 설정 형식은 CSS가 첫 페인트부터, controller가 DOM·키보드 상태를 이어받는다.
  style.textContent+=`html.js body main [data-config-panel]{display:none!important}html.js body main [data-config-panel="${format}"]{display:block!important}`;
  document.head.append(style);
}

function prepareServiceCatalogFirstPaint() {
  const style=document.getElementById('first-paint-state');
  if(!style) return;
  const api=location.hash==='#journey-all-apis';
  style.textContent+=`html.js body main [data-sf-catalog] .sf-feature-list{display:${api?'none':'block'}!important}html.js body main [data-sf-catalog] .sf-api-explorer{display:${api?'block':'none'}!important}`;
  if(location.hash!=='#visual-catalog')style.textContent+='html.js body main [data-sf-catalog] .sf-card-preview{display:none!important}';
}

// 개념 목록에만 넣는다. 다른 대주제의 초기 HTML과 스크롤 계약은 그대로 둔다.
function prepareConceptPanel(panelMap) {
  let id = ''; try { id = decodeURIComponent(location.hash.slice(1)); } catch {}
  if (!['kc-browse-view','kc-sequence','kc-original'].includes(id) || !panelMap[id]) return;
  const originalHash = location.hash;
  window.__javaExperienceConceptHash = originalHash;
  history.replaceState(history.state, '', location.pathname + location.search);
  const style = document.getElementById('first-paint-state');
  style.textContent += `html.js body main [data-section-panel]:not(#${id}):not(:has(#${id})):not(#${id} [data-section-panel]){display:none!important}html.js body main #${id}{display:block!important}${id === 'kc-browse-view' ? '' : 'html.js body main .page-sidebar-filters{display:none!important}'}`;
  const select = () => {
    for (const button of document.querySelectorAll('.section-switcher [data-section-target]')) {
      const selected = button.dataset.sectionTarget === id;
      button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
    }
  };
  const observer = new MutationObserver(select); observer.observe(document, {childList:true, subtree:true});
  style.stopEarlySelection = () => observer.disconnect(); select();
  window.addEventListener('load', () => {
    history.replaceState(history.state, '', location.pathname + location.search + originalHash);
    delete window.__javaExperienceConceptHash;
  }, {once:true});
}
