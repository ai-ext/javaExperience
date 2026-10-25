import fs from 'node:fs/promises';
import path from 'node:path';
import { arg, loadPlaywright, checkOutput, startCheckServer } from './check-runtime.mjs';
import assert from 'node:assert/strict';
const { chromium } = loadPlaywright();
const out = await checkOutput('reload');
const stage = arg('stage') || 'after';
export const pages = [['홈','index.html'],['일자 목록','course/spring/README.html'],['일자','course/spring/D05.html'],['지도','course/map.html'],['Java','course/java/J05.html'],['티켓','course/tickets/B01.html'],['출발 자료','course/start/README.html'],['개념','docs/knowledge/README.html'],['서비스 만들기','scenario/README.html'],['실전 미션','practice/MISSIONS.html'],['과정 안내','course/README.html'],['레슨','lessons/README.html'],['구현 티켓','tickets/README.html'],['설정 탭','course/spring/D01.html#step-d01-2'],['저장 설정','course/spring/D05.html#step-d05-2'],['더미 데이터','course/start/dummy/README.html'],['운영 실습','course/start/ops/README.html'],['서비스 상세','scenario/ch0-first-steps/0-1-ts-to-java.html'],['개념 상세','docs/knowledge/P16-json-jackson-practical.html'],['저장 진도 홈','index.html'],['선택 티켓 일자','course/spring/D14.html'],['입력 검증 상세','scenario/ch1-create-post/1-5-validation.html'],['DB 실습 상세','scenario/db-query-journey/db-01-response-to-query.html'],['JWT 상세','scenario/ch10-project/10-4-login-jwt.html']];
await fs.mkdir(path.join(out,stage),{recursive:true});
const server = await startCheckServer();
const base = server.base;
let browser;
const results=[];
try {
  browser = await chromium.launch({headless:true});
  for (const [index,[type,file]] of pages.entries()) {
    const context=await browser.newContext({viewport:{width:1440,height:900},colorScheme:'dark'});
    const page=await context.newPage(); const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    // JS 배달이 늦어져도 서버 HTML이 먼저 올바르게 표시되는지 같은 조건에서 검사한다.
    await page.route('**/*.js*',async route=>{await new Promise(resolve=>setTimeout(resolve,120));await route.continue();});
    await page.addInitScript(() => {
      const state=window.__reload={samples:[],shifts:[],changed:[],started:performance.now()};
      new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)state.shifts.push({time:e.startTime,value:e.value,sources:e.sources?.map(s=>s.node?.id||s.node?.className)});}).observe({type:'layout-shift',buffered:true});
      const seen=new Map();let serial=0;
      const sample=()=>{
        if(!document.body)return;
        const visible=el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&!el.closest('[hidden]')&&getComputedStyle(el).visibility!=='hidden';};
        const elements=[...document.querySelectorAll('main [id],main [data-day-panel],main [data-config-panel],main [data-section-panel],main nav,main aside')];
        const current=new Set();
        for(const el of elements){if(!seen.has(el))seen.set(el,{id:el.id||el.className||`node-${++serial}`,visible:false,flashed:false});const record=seen.get(el);if(visible(el)){record.visible=true;current.add(el);}else if(record.visible&&!record.flashed){record.flashed=true;state.changed.push({id:record.id,time:performance.now()});}}
        for(const [el,record]of seen)if(!el.isConnected&&record.visible&&!record.flashed){record.flashed=true;state.changed.push({id:record.id,time:performance.now(),removed:true});}
        const main=document.querySelector('main'),r=main?.getBoundingClientRect();
        state.samples.push({time:performance.now(),body:getComputedStyle(document.body).backgroundColor,html:getComputedStyle(document.documentElement).backgroundColor,main:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null,font:getComputedStyle(document.body).fontFamily,fonts:document.fonts.status,selected:[...document.querySelectorAll('main [aria-current],main [aria-selected="true"],main [aria-pressed="true"]')].filter(visible).filter(e=>!['false',''].includes(e.getAttribute('aria-current')||e.getAttribute('aria-selected')||e.getAttribute('aria-pressed')||'')).map(e=>e.id||e.getAttribute('href')||e.dataset.sectionTarget||e.textContent.trim()).join('|'),visible:current.size});
      };
      requestAnimationFrame(function frame(){sample();if(performance.now()<1600)requestAnimationFrame(frame);});
      setInterval(()=>{if(performance.now()<1600)sample();},40);
    });
    if(type==='저장 설정')await context.addInitScript(()=>localStorage.setItem('javaexperience.course.config-format.v1','properties'));
    if(type==='저장 진도 홈')await context.addInitScript(()=>localStorage.setItem('javaexperience.course.progress.v1',JSON.stringify({version:1,steps:{'D05-1':true}})));
    if(type==='선택 티켓 일자')await context.addInitScript(()=>localStorage.setItem('javaexperience.course.progress.v1',JSON.stringify({version:1,selectedTicket:'B16',steps:{'D14-5':true}})));
    await page.goto(`${base}/${file}`,{waitUntil:'networkidle'});
    errors.length=0;
    const cdp=await context.newCDPSession(page);
    await page.reload({waitUntil:'commit'});
    const screenshots=[];
    // 캡처는 DOM 측정과 독립적으로 40ms 간격 요청. 실제 응답 시각도 남긴다.
    const start=Date.now();let tick=0;
    while(Date.now()-start<1500){
      const shot=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}).catch(()=>null);
      if(!shot){await new Promise(resolve=>setTimeout(resolve,40));continue;}
      const time=await page.evaluate(()=>performance.now()).catch(()=>0);
      const filename=`${String(index).padStart(2,'0')}-${String(tick).padStart(3,'0')}.png`;
      await fs.writeFile(path.join(out,stage,filename),Buffer.from(shot.data,'base64'));screenshots.push({time,file:filename});tick++;
      await new Promise(resolve=>setTimeout(resolve,Math.max(0,start+tick*40-Date.now())));
    }
    await page.waitForLoadState('networkidle');
    const data=await page.evaluate(()=>({...window.__reload,height:document.documentElement.scrollHeight,elements:document.querySelectorAll('main *').length,overflow:document.documentElement.scrollWidth-innerWidth,nav:[...document.querySelectorAll('.site-topbar nav>a')].map(e=>({text:e.textContent,href:e.getAttribute('href'),top:e.getBoundingClientRect().top})),navOverflow:(()=>{const n=document.querySelector('.site-topbar nav');return n.scrollWidth-n.clientWidth;})()}));
    const white=data.samples.filter(s=>s.body==='rgb(255, 255, 255)'||(s.body==='rgba(0, 0, 0, 0)'&&['rgb(255, 255, 255)','rgba(0, 0, 0, 0)'].includes(s.html)));
    const selectionChanges=Math.max(0,new Set(data.samples.filter(s=>s.visible).map(s=>s.selected)).size-1);
    const fontChanges=Math.max(0,new Set(data.samples.map(s=>s.font)).size-1);
    const result={type,file,selectionChanges,fontChanges,cls:data.shifts.reduce((n,e)=>n+e.value,0),flashed:data.changed.length,whiteMs:white.length?Math.max(...white.map(s=>s.time))-Math.min(...white.map(s=>s.time))+40:0,errors,screenshots,...data};
    results.push(result);console.log(`${type}: CLS=${result.cls.toFixed(6)} flash=${result.flashed} white=${result.whiteMs}ms selection=${selectionChanges} font=${fontChanges} frames=${tick} errors=${errors.length}`);
    await page.screenshot({path:path.join(out,stage,`${index}-final.png`),fullPage:index===0});
    await context.close();
  }
} finally {try { await browser?.close(); } finally { await server.close(); }}
await fs.writeFile(path.join(out,`${stage}.json`),JSON.stringify({date:new Date().toISOString(),base,viewport:{width:1440,height:900},scriptDelayMs:120,intervalMs:40,results},null,2));
if(stage!=='before')for(const row of results){assert.equal(row.errors.length,0,`${row.file}: pageerror`);assert.equal(row.nav.length,5,`${row.file}: 메뉴 수`);assert.equal(row.navOverflow,0,`${row.file}: 메뉴 넘침`);assert.equal(row.overflow,0,`${row.file}: 화면 넘침`);assert.ok(row.cls<0.00001,`${row.file}: CLS ${row.cls}`);assert.equal(row.flashed,0,`${row.file}: 보였다 사라짐 ${JSON.stringify(row.changed)}`);assert.equal(row.whiteMs,0,`${row.file}: 흰 화면`);assert.equal(row.selectionChanges,0,`${row.file}: 선택 상태 점프`);assert.equal(row.fontChanges,0,`${row.file}: 글꼴 교체`);}
