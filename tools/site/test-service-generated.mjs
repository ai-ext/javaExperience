// 전체 저작 데이터가 실제 생성 DOM에서 선택·힌트·수동 진도로 연결되는지 검사합니다.
// JSDOM 동작 검사이며 실제 브라우저 레이아웃·학습자 API 실행 검증을 대신하지 않습니다.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {mountServiceFeaturePages} from './service-feature-client.mjs';
import {mountServiceRequestTools} from './service-request-client.mjs';
const root=new URL('../../',import.meta.url);
const catalog=JSON.parse(fs.readFileSync(new URL('service/catalog.json',root),'utf8'));
let pages=0,stages=0,hints=0,forms=0,fetches=0;
const rows=[];
for(const entry of catalog.features){
 const source=JSON.parse(fs.readFileSync(new URL(`service/${entry.file}`,root),'utf8'));
 const dom=new JSDOM(fs.readFileSync(new URL(`scenario/features/${entry.id}.html`,root),'utf8'),{url:`http://localhost:3000/scenario/features/${entry.id}.html`});
 const doc=dom.window.document;
 assert.ok([...doc.querySelectorAll('link[rel=stylesheet]')].some(link=>link.getAttribute('href').includes('service-request.css')),`${entry.id}: 요청 도구 stylesheet`);
 const values=new Map([['course.progress','kept'],['javaExperience.home.activeTask.v1','kept']]);
 const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
 const ids=[...doc.querySelectorAll('[id]')].map(node=>node.id);
 assert.equal(new Set(ids).size,ids.length,`${entry.id}: 고유 DOM id`);
 assert.equal(doc.querySelectorAll('h1').length,1,`${entry.id}: 주 제목 하나`);
 mountServiceFeaturePages(doc,{storage});
 mountServiceRequestTools(doc,{storage,fetchImpl:()=>{fetches++;throw Error('이 검사는 실제 API를 호출하지 않습니다.');}});
 for(const variant of source.variants){
  const select=doc.querySelector('[data-sf-variant-select]');select.value=variant.id;select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
  for(const stage of variant.stages){
   const button=[...doc.querySelectorAll('[data-sf-stage-link]')].find(node=>node.dataset.sfVariant===variant.id&&node.dataset.sfStage===stage.id);
   assert.ok(button,`${entry.id}/${variant.id}/${stage.id}: 진입 버튼`);button.click();
   const active=[...doc.querySelectorAll('[data-sf-stage-panel]')].filter(node=>!node.hidden);
   assert.equal(active.length,1,`${entry.id}: 활성 단계 하나`);assert.equal(active[0].dataset.sfStage,stage.id);assert.equal(active[0].dataset.sfVariant,variant.id);
   const aside=[...doc.querySelectorAll('[data-sf-aside-stage]')].find(node=>!node.hidden);
   assert.ok(aside,`${entry.id}: 현재 단계 힌트`);
   const open=aside.querySelector('[data-sf-hint-open]');open.click();
   const text=aside.querySelector('[data-sf-hint-text]');assert.equal(text.textContent,stage.hints[0]);
   for(let i=1;i<stage.hints.length;i++){aside.querySelector('[data-sf-hint-next]').click();assert.equal(text.textContent,stage.hints[i]);hints++;}
   if(stage.hints.length>1){aside.querySelector('[data-sf-hint-prev]').click();assert.equal(text.textContent,stage.hints.at(-2));}
   const progress=active[0].querySelector('[data-sf-stage-complete]');
   assert.ok(progress,`${entry.id}: 수동 단계 기록`);assert.equal(progress.checked,false,`${entry.id}: 힌트 열람으로 완료하지 않음`);
   progress.click();assert.equal(progress.checked,true);progress.click();assert.equal(progress.checked,false);
   forms+=active[0].querySelectorAll('[data-srq-root]').length;stages++;
  }
 }
 assert.equal(values.get('course.progress'),'kept');assert.equal(values.get('javaExperience.home.activeTask.v1'),'kept');
 rows.push({featureId:entry.id,variants:source.variants.length,stages:source.variants.reduce((n,v)=>n+v.stages.length,0)});pages++;dom.window.close();
}
assert.equal(fetches,0,'선택·힌트·수동 진도로 API가 자동 호출되지 않음');
console.log(JSON.stringify({scope:'generated DOM; not native browser',pages,stages,hintNextTransitions:hints,requestForms:forms,automaticFetches:fetches,features:rows}));
