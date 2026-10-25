import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const root=process.cwd();
const require=createRequire(root+'/tools/site/package.json');
const {JSDOM}=require('jsdom');
const {renderW11Learning}=await import('file://'+root+'/tools/site/w11-learning.mjs');
const original=fs.readFileSync(root+'/tools/site/w11-learning.js','utf8').replace("'./w11-lesson-data.mjs'",JSON.stringify('file://'+root+'/tools/site/w11-lesson-data.mjs'));
const tick=async()=>{await Promise.resolve();await Promise.resolve();};
async function matrix(source){
 const {initW11Learning}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const results=[];
 for(const mode of ['same-success','same-failure','transition-success','transition-failure','roundtrip-success','roundtrip-failure','reverse-old-reject','reverse-old-resolve']){
  const page=new JSDOM(renderW11Learning(),{url:'https://learn.example/'}),win=page.window,doc=win.document;
  win.matchMedia=()=>({matches:false,addEventListener(){}});const deferred=[];
  Object.defineProperty(win.navigator,'clipboard',{value:{writeText:code=>new Promise((resolve,reject)=>deferred.push({code,resolve,reject}))}});
  initW11Learning(doc,win);const ui=doc.querySelector('[data-w11-learning]'),$=s=>ui.querySelector(s);
  const topic=id=>{$('[data-w11-topic]').value=id;$('[data-w11-topic]').dispatchEvent(new win.Event('change'));};
  const stage=id=>$('[data-w11-stage="'+id+'"]').click();
  topic('repository');stage('repository-insert');$('[data-w11-copy]').click();const initial=deferred[0].code;
  assert.equal(initial,$('[data-w11-code]').textContent);
  if(mode.startsWith('transition'))stage('repository-partial');
  if(mode.startsWith('roundtrip')){topic('service');topic('repository');stage('repository-insert');}
  if(mode==='reverse-old-reject'){$('[data-w11-copy]').click();deferred[1].resolve();await tick();deferred[0].reject(Error('old'));}
  else if(mode==='reverse-old-resolve'){$('[data-w11-copy]').click();deferred[1].reject(Error('latest'));await tick();deferred[0].resolve();}
  else if(mode.endsWith('failure'))deferred[0].reject(Error('denied'));else deferred[0].resolve();
  await tick();const status=$('[data-w11-copy-status]').textContent,selection=win.getSelection().toString();
  if(mode.startsWith('transition')||mode.startsWith('roundtrip')){assert.equal(status,'',mode);assert.equal(selection,'',mode+' must not select current code');}
  else if(mode==='same-failure'||mode==='reverse-old-resolve'){assert.equal(status,'코드를 선택했습니다. 복사 키를 눌러 주세요.',mode);assert.equal(selection,$('[data-w11-code]').textContent,mode);}
  else assert.equal(status,'코드를 복사했습니다.',mode);
  results.push({mode,status,selected:!!selection});win.close();
 }
 return results;
}
const result={current:await matrix(original),mutations:[]};
for(const [name,source] of [['without-scene-guard',original.replaceAll('requestScene !== sceneVersion || ','')],['without-request-guard',original.replaceAll(' || requestId !== copyRequestId','')]]){
 let error;try{await matrix(source);}catch(e){error=e.message;}assert.ok(error,name+' must be detected');result.mutations.push({name,detected:true,error});
}
console.log(JSON.stringify(result,null,2));
