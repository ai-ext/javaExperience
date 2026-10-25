import { CORE_UNITS } from './concept-curriculum.mjs';
import fs from 'node:fs/promises';
import { measureServiceSpace } from './service-space.mjs';
import { arg, loadPlaywright, checkOutput, startCheckServer } from './check-runtime.mjs';
import assert from 'node:assert/strict';
const { chromium } = loadPlaywright();
const out = await checkOutput('frame');
const stage=arg('stage')||'after';
const routes={홈:'index.html','일자 목록':'course/spring/README.html','과정 지도':'course/map.html','기능 상세':'scenario/features/posts-create-read.html','상점 상세':'scenario/features/points-coupon-shop.html','호환 상세':'scenario/features/api-compatibility.html','출발 자료':'course/start/README.html','개념 학습':'docs/knowledge/README.html',Java:'course/java/README.html',티켓:'course/tickets/README.html','서비스 만들기':'scenario/README.html','실전 미션':'practice/MISSIONS.html','일자 상세':'course/spring/D05.html','Java 상세':'course/java/J05.html','티켓 상세':'course/tickets/B01.html','더미 데이터':'course/start/dummy/README.html','운영 실습':'course/start/ops/README.html','서비스 상세':'scenario/ch0-first-steps/0-1-ts-to-java.html','개념 상세':'docs/knowledge/P16-json-jackson-practical.html','레슨':'lessons/README.html','구현 티켓':'tickets/README.html'};
Object.assign(routes, {'Spring 분야':'docs/knowledge/README.html#kc-category-spring', ...Object.fromEntries(CORE_UNITS.map(unit=>[unit.id, `lessons/concept-core.html?unit=${unit.id}`]))});
const pairs=[['출발 자료','개념 학습'],['일자 목록','Java'],['티켓','서비스 만들기'],['홈','과정 지도'],['서비스 만들기','일자 목록'],['서비스 만들기','기능 상세'],['실전 미션','개념 학습']];
const server = await startCheckServer();
const base = server.base;
let browser;
const pages={},transitions=[],allPages=[];
try{
 browser = await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:900},colorScheme:'dark'});
 await fs.mkdir(`${out}/${stage}`,{recursive:true});
 for(const [name,file]of Object.entries(routes)){
  await page.goto(`${base}/${file}`);await page.waitForLoadState('networkidle');
  pages[name]=await page.evaluate(()=>{
   const rect=selector=>{const e=document.querySelector(selector),r=e?.getBoundingClientRect();return r?{x:r.x,y:r.y,width:r.width,height:r.height}:null;};
   return {header:rect('.site-topbar'),menu:rect('.site-topbar nav'),sidebar:rect('.site-frame-sidebar,.page-sidebar,.day-today'),content:rect('.site-frame-content,.page-navigation-content,.home-dashboard-content,.day-stepper-main'),labels:[...document.querySelectorAll('.site-topbar nav>a')].map(e=>e.textContent),floating:[...document.querySelectorAll('main *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.closest('[hidden]')&&!e.closest('.site-frame-sidebar')&&['sticky','fixed'].includes(getComputedStyle(e).position);}).map(e=>e.className)};
  });
  const space=await page.evaluate(measureServiceSpace);
  if(space){pages[name].space=space;if(stage!=='before'){assert.ok(space.firstViewport.blankRatio<0.5,`${name}: 첫 화면 빈 영역 50% 미만`);assert.ok(space.fullContent.blankRatio<0.4,`${name}: 전체 빈 영역 40% 미만`);assert.ok(space.fullContent.maxBlankHeight<=160,`${name}: 연속 빈 높이 160px 이하`);if(space.stageWidthRatio!==null)assert.ok(space.stageWidthRatio>=0.9,`${name}: 본문 너비 90% 이상`);}}
  await page.screenshot({path:`${out}/${stage}/frame-${file.replace(/[^a-zA-Z0-9.-]/g,'-')}.png`});
 }
 for(const [from,to]of pairs){
  await page.goto(`${base}/${routes[from]}`);await page.waitForLoadState('networkidle');
  const destination=new URL(routes[to],base+'/').pathname;
  // 기능 목록에서는 사용자가 묶음을 펼친 뒤 실제로 보이는 제목 링크를 고른다.
  const featureId=destination.match(/^\/scenario\/features\/([^/]+)\.html$/)?.[1];
  if(featureId&&await page.locator('[data-sf-catalog]').count()){
   const card=page.locator(`[data-sf-feature-card][data-sf-id="${featureId}"]`);
   const group=page.locator('[data-sf-feature-group]').filter({has:card});
   const expand=group.locator('[data-sf-group-collapse]');
   if(await expand.getAttribute('aria-expanded')!=='true')await expand.click();
   const titleLink=card.locator('.sf-card-body h3 a');
   assert.ok(await titleLink.isVisible(),`${from} → ${to}: 펼친 기능 제목`);
   await titleLink.click();
  }else{
   const link=await page.locator('a').evaluateAll((links,target)=>links.find(e=>new URL(e.href).pathname===target)?.getAttribute('href'),destination);
   assert.ok(link,`${from} → ${to}: 이동 링크`);
   await page.locator(`a[href="${link}"]:visible`).first().click();
  }
  await page.waitForLoadState('networkidle');
  const arrived=await page.evaluate(()=>{
    const rect=s=>{const r=document.querySelector(s)?.getBoundingClientRect();return r?{x:r.x,y:r.y,width:r.width,height:r.height}:null;};
    return {header:rect('.site-topbar'),menu:rect('.site-topbar nav'),sidebar:rect('.site-frame-sidebar,.page-sidebar,.day-today'),content:rect('.site-frame-content,.page-navigation-content,.home-dashboard-content,.day-stepper-main')};
  });
  const diff={};for(const [element,keys]of Object.entries({header:['x','y','height'],menu:['x','y'],sidebar:['x','y','width'],content:['x','y','width']}))for(const key of keys)diff[`${element}.${key}`]=pages[from][element]&&arrived[element]?arrived[element][key]-pages[from][element][key]:null;
  transitions.push({from,to,diff});
 }
 if(process.argv.includes('--all')){
  const root=new URL('../../',import.meta.url),files=['README.md','errors.md','docs/course-redesign/plans/2026-10-24-p9-d16-d30.md','docs/course-redesign/plans/2026-10-24-p9-ledger.md'];
  const collect=async dir=>{for(const entry of await fs.readdir(new URL(dir,root),{withFileTypes:true})){const file=`${dir}/${entry.name}`;if(file==='course/days')continue;if(entry.isDirectory())await collect(file);else if(file.endsWith('.md'))files.push(file);}};
  for(const dir of ['docs/knowledge','scenario','practice','lessons','tickets','course'])await collect(dir);
  for(const file of files){
   const response=await page.goto(`${base}/${file.replace(/\.md$/,'.html')}`,{waitUntil:'load'});assert.equal(response.status(),200,file);
   const row=await page.evaluate(()=>{
    const r=s=>{const v=document.querySelector(s)?.getBoundingClientRect();return v?{x:v.x,y:v.y,width:v.width,height:v.height}:null;};
    const nav=document.querySelector('.site-topbar nav');
    return {header:r('.site-topbar'),menu:r('.site-topbar nav'),sidebar:r('.site-frame-sidebar'),content:r('.site-frame-content'),labels:[...nav.children].map(e=>e.textContent),layers:new Set([...nav.children].map(e=>e.getBoundingClientRect().top)).size,navOverflow:nav.scrollWidth-nav.clientWidth,floating:[...document.querySelectorAll('main *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&!e.closest('[hidden]')&&!e.closest('.site-frame-sidebar')&&['sticky','fixed'].includes(getComputedStyle(e).position);}).map(e=>e.className)};
   });
   assert.deepEqual(row.labels,pages['홈'].labels,file);assert.equal(row.layers,1,file);assert.equal(row.navOverflow,0,file);assert.deepEqual(row.floating,[],`${file}: 떠다니는 바`);
   for(const[element,keys]of Object.entries({header:['x','y','height'],menu:['x','y'],sidebar:['x','y','width'],content:['x','y','width']}))for(const key of keys)assert.equal(row[element]?.[key],pages['홈'][element][key],`${file}: ${element}.${key}`);
   allPages.push({file,...row});if(allPages.length%50===0)console.log(`전체 틀 ${allPages.length}/${files.length}`);
  }
 }
}finally{try { await browser?.close(); } finally { await server.close(); }}
await fs.writeFile(`${out}/frame-${stage}.json`,JSON.stringify({viewport:{width:1440,height:900},pages,transitions,allPages},null,2));
console.table(transitions.map(t=>({이동:`${t.from} → ${t.to}`,...t.diff})));
// 사용자 결정의 대표 서비스 화면과 지도를 같은 1440px 공통 틀로 검사한다.
if(stage!=='before')for(const [name,row]of Object.entries(pages)){assert.deepEqual(row.labels,['홈','과정 지도','서비스 만들기','실전 미션','개념 학습'],name);assert.equal(row.header?.height,64,`${name}: 헤더 64px`);assert.equal(row.sidebar?.width,208,`${name}: 사이드바 208px`);assert.equal(row.content?.x,280,`${name}: 본문 시작 280px`);assert.deepEqual(row.floating,[],`${name}: 떠다니는 바`);for(const [element,keys]of Object.entries({header:['x','y','height'],menu:['x','y'],sidebar:['x','y','width'],content:['x','y','width']}))for(const key of keys)assert.equal(row[element]?.[key],pages['홈'][element][key],`${name}: ${element}.${key}`);}
if(stage!=='before')for(const t of transitions)for(const [key,value]of Object.entries(t.diff))assert.equal(value,0,`${t.from} → ${t.to}: ${key}`);
