// 외부 서버를 지정하지 않으면 검사 전용 서버를 열고 종료한다.
import fs from 'node:fs';
import { loadPlaywright, startCheckServer } from '../check-runtime.mjs';
const { chromium } = loadPlaywright();
const cases=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const check=fs.readFileSync(new URL('check.js',import.meta.url),'utf8')+'\n'+fs.readFileSync(new URL('extra.js',import.meta.url),'utf8');
const server = await startCheckServer();
let browser;
const [width,height]=(process.env.VIEWPORT||'1440x900').split('x').map(Number);
let failures=0;
try{
 browser = await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width,height},colorScheme:'dark'});
 for(const entry of cases){
  const errors=[];const onError=e=>errors.push(e.message);page.on('pageerror',onError);
  try{
   const response=await page.goto(`${server.base}/${entry.path}`,{waitUntil:'networkidle'});
   if(response.status()!==200)throw Error(`HTTP ${response.status()}`);
   await page.evaluate(async source=>{await document.fonts.ready;if(source)await (new Function(`return (async()=>{${source}})()`))();},entry.js);
   const inspectCode=check+'\n__hideSrOnly();const r=JSON.parse(__htmlCheck('+JSON.stringify(entry.root||null)+'));const h=__hscroll();if(h){r.ok=false;r.counts.hscroll=1;r.items.push(h);}'+(entry.flow?'const f=await __flowCheck();if(f!=="ok"){r.ok=false;r.counts.flow=1;r.items.push(f);}':'')+'return r;';
   const result=await page.evaluate(source=>(new Function('return (async()=>{'+source+'})()'))(),inspectCode);
   if(errors.length){result.ok=false;result.errors=errors;}
   if(!result.ok)failures++;
   console.log(entry.name,JSON.stringify(result));
  }catch(error){failures++;console.log(entry.name,JSON.stringify({ok:false,error:error.message}));}
  page.off('pageerror',onError);
 }
}finally{try { await browser?.close(); } finally { await server.close(); }}
console.log(`검사 ${cases.length}개, 실패 ${failures}개`);process.exitCode=failures?1:0;
