import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {JSDOM} from '../../../../tools/site/node_modules/jsdom/lib/api.js';
const root=process.cwd();
const js=fs.readFileSync('tools/site/knowledge-reader.js','utf8');
const make=(file,suffix='?read=1')=>{const dom=new JSDOM(fs.readFileSync(file,'utf8'),{url:'https://learn.example/'+file+suffix,runScripts:'outside-only',pretendToBeVisual:true});dom.window.HTMLElement.prototype.scrollIntoView=function(){};dom.window.eval(js);dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));return dom;};
const results={};
for(const file of ['P09-java-syntax-basics','J01-types-string','S09-jpa-hibernate','W11-why-tx-in-service']){
 const path='docs/knowledge/'+file+'.html', dom=make(path),d=dom.window.document;
 const chapters=[...d.querySelectorAll('[data-kr-reading] details.knowledge-chapter')];
 results[file]={specialChapters:chapters.filter(x=>/자가|Q&A|참고|심화/.test(x.querySelector('summary')?.textContent)).map(x=>({id:x.querySelector('summary').id,label:x.querySelector('summary').textContent.trim().replace(/\s+/g,' '),open:x.open,topics:[...x.querySelectorAll('details.knowledge-topic')].map(t=>({label:t.querySelector('summary').textContent.trim().replace(/\s+/g,' '),open:t.open})).slice(0,4)})),h1:[...d.querySelectorAll('[data-kr-reading] h1')].map(x=>({id:x.id,cls:x.className,insideOriginal:!!x.closest('.knowledge-reader-original')}))};
 const head=new JSDOM(execFileSync('git',['show','HEAD:'+path],{encoding:'utf8'})).window.document;
 const count=(doc)=>[...doc.querySelectorAll('[id]')].reduce((m,x)=>(m[x.id]=(m[x.id]||0)+1,m),{});
 const old=count(head),now=count(d);results[file].newDuplicateIds=Object.entries(now).filter(([id,n])=>n>1&&n>(old[id]||0)).map(([id,n])=>({id,head:old[id]||0,current:n}));
 dom.window.close();
}
{
 const dom=make('docs/knowledge/P09-java-syntax-basics.html',''), d=dom.window.document;
 const read=d.querySelector('[data-kr-mode="read"]');read.focus();read.click();
 results.modeFocus={expected:'kr-reading-title',actual:d.activeElement.outerHTML.slice(0,240)};
 dom.window.close();
}
{
 const dom=make('docs/knowledge/P09-java-syntax-basics.html',''),w=dom.window,d=w.document;
 const original=d.querySelector('#p09-original');
 w.history.replaceState({foreign:'keep',__javaExperienceKnowledgeReader:'scene'},'','?read=1&foreign=keep');
 w.dispatchEvent(new w.PopStateEvent('popstate'));
 results.queryHistoryConflict={url:w.location.href,mode:d.querySelector('[data-knowledge-reader]').dataset.krMode};
 dom.window.close();
}
console.log(JSON.stringify(results,null,2));
fs.writeFileSync('docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt2/spec-probe.json',JSON.stringify(results,null,2)+'\n');
