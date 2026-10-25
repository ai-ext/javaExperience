import fs from 'node:fs';import assert from 'node:assert/strict';import {JSDOM} from '../../../../tools/site/node_modules/jsdom/lib/api.js';
const original=fs.readFileSync('tools/site/knowledge-reader.js','utf8');const rawHtml=fs.readFileSync('docs/knowledge/P09-java-syntax-basics.html','utf8');const originalCss=fs.readFileSync('tools/site/knowledge-reader.css','utf8');
function boot(js=original,suffix='',html=rawHtml,css=originalCss){const dom=new JSDOM(html,{url:'https://learn.example/docs/knowledge/P09-java-syntax-basics.html'+suffix,runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window,d=w.document,errors=[];w.addEventListener('error',e=>{errors.push(e.error||e.message);e.preventDefault()});w.HTMLElement.prototype.scrollIntoView=function(){};w.history.replaceState({foreign:{keep:1}},'',w.location.href);const style=d.createElement('style');style.textContent=css;d.head.append(style);w.eval(js);d.dispatchEvent(new w.Event('DOMContentLoaded'));assert.equal(errors.length,0);return {dom,w,d};}
function runtimeContract(js){
 let noHash=boot(js,'?read=1');try{assert.equal(noHash.d.querySelector('#p09-original').open,true);}finally{noHash.w.close();}
 let x=boot(js,'?foreign=keep#1-한-줄로-말하면');try{
  assert.equal(x.d.querySelector('[data-knowledge-reader]').dataset.krMode,'read');assert.equal(x.d.querySelector('[data-kr-scene]').hidden,true);assert.equal(x.d.querySelector('#p09-original').open,true);assert.deepEqual(x.w.history.state.foreign,{keep:1});assert.equal(new URL(x.w.location.href).searchParams.get('foreign'),'keep');
  const qa=[...x.d.querySelectorAll('.knowledge-chapter')].find(c=>c.querySelector(':scope>summary strong')?.textContent.includes('자가점검'));assert.ok([...qa.querySelectorAll('.knowledge-topic')].every(t=>!t.open));
  x.d.querySelector('button[data-kr-mode="scene"]').click();assert.equal(x.w.location.hash,'');assert.equal(x.w.location.search,'?foreign=keep');
  x.w.eval('initKnowledgeReader(document,window)');let writes=0;const replace=x.w.history.replaceState.bind(x.w.history);x.w.history.replaceState=(...a)=>{writes++;return replace(...a)};x.d.querySelector('button[data-kr-mode="read"]').click();assert.equal(writes,1);assert.equal(x.d.activeElement,x.d.querySelector('.kr-reading-title'));
 }finally{x.w.close()}
 x=boot(js,'#%E0%A4%A');x.w.close();
}
function cssContract(css){const html=fs.readFileSync('docs/knowledge/J03-generics.html','utf8'),x=boot(original,'?read=1',html,css);try{const table=x.d.querySelector('.version-original');assert.equal(table.open,false);assert.notEqual(x.w.getComputedStyle(table.querySelector('summary')).display,'none');assert.equal(x.w.getComputedStyle(x.d.querySelector('.kr-toolbar-title')).display,'none');}finally{x.w.close()}}
const replaceOnce=(s,from,to)=>{assert.ok(s.includes(from),'mutation anchor exists: '+from);return s.replace(from,to)};
const cases=[
 ['foreign history state removed','js',"{ ...state, [READER_KEY]: normalized }","{ [READER_KEY]: normalized }"],
 ['scene remains exposed during reading','js','scene.hidden = readMode;','scene.hidden = false;'],
 ['read leaves source outer wrapper closed','js','item.open = !!item.querySelector(\'.knowledge-chapters, .knowledge-chapter\');','item.open = false;'],
 ['Q&A answers forced open','js','topic.open = !review && !optional;','topic.open = true;'],
 ['foreign URL query removed','js','url.search = p.toString();',"url.search = '';"],
 ['source hash retained on scene','js',"if (!readMode && reveal(currentHash, false)) url.hash = '';","if (false) url.hash = '';"],
 ['duplicate init allowed','js','if (!root || initialized.has(root)) return false;','if (!root) return false;'],
 ['malformed hash unsafe decode','js',"try { return decodeURIComponent(win.location.hash.slice(1)); } catch { return ''; }","return decodeURIComponent(win.location.hash.slice(1));"],
 ['nested original-table summary hidden','css','.knowledge-reader-original > details[class$="-original"] > summary','.knowledge-reader-original details[class$="-original"] > summary'],
 ['read toolbar heading remains visible','css','.kr-reader.is-reading .kr-toolbar-title { display: none; }','.kr-reader.is-reading .kr-toolbar-title { display: block; }'],
];
runtimeContract(original);cssContract(originalCss);const results=[];
for(const [name,type,from,to]of cases){const source=replaceOnce(type==='js'?original:originalCss,from,to);let rejected=false,reason='';try{(type==='js'?runtimeContract:cssContract)(source)}catch(e){rejected=true;reason=e.message.slice(0,240)}results.push({name,rejected,reason});assert.ok(rejected,'mutation not rejected: '+name)}
const result={phase:'quality',baseline:'PASS',mutations:results.length,rejected:results.filter(x=>x.rejected).length,productFilesMutated:false,results};fs.writeFileSync('docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt4/mutations.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
