import fs from 'node:fs';import assert from 'node:assert/strict';import {JSDOM} from '../../../../tools/site/node_modules/jsdom/lib/api.js';
const js=fs.readFileSync('tools/site/knowledge-reader.js','utf8'),css=fs.readFileSync('tools/site/knowledge-reader.css','utf8');
const manifest=JSON.parse(fs.readFileSync('docs/design/concept-ia-2026-10-24/qa-source-formats.json','utf8'));
const result={qaPages:[],noQaPages:[],versionTables:[],uncoveredNodes:[],h1Visibility:[]};
const hidden=(node,win)=>{for(let p=node;p;p=p.parentElement){if(p.hidden||win.getComputedStyle(p).display==='none')return true;if(p.tagName==='DETAILS'&&!p.open&&!p.querySelector(':scope > summary')?.contains(node))return true;}return false;};
for(const entry of manifest){
 const file=entry.source.replace(/\.md$/,'.html'),dom=new JSDOM(fs.readFileSync(file,'utf8'),{url:'https://learn.example/'+file+'?read=1',runScripts:'outside-only'}),w=dom.window,d=w.document;
 const style=d.createElement('style');style.textContent=css;d.head.append(style);w.HTMLElement.prototype.scrollIntoView=function(){};w.eval(js);d.dispatchEvent(new w.Event('DOMContentLoaded'));
 const chapters=[...d.querySelectorAll('.knowledge-reader-original .knowledge-chapter')];
 const qa=chapters.filter(c=>/자가\s*점검.*Q&A|Q&A.*자가\s*점검/i.test(c.querySelector(':scope > summary strong')?.textContent||''));
 if(!entry.qaSections.length){assert.equal(qa.length,0,file);result.noQaPages.push(entry.documentId);}else{
  assert.equal(qa.length,entry.qaSections.length,file);
  for(const chapter of qa){assert.equal(chapter.open,true,file);const body=chapter.querySelector(':scope > .knowledge-chapter-body'),answers=[...body.querySelectorAll('details.knowledge-topic')];assert.ok(answers.length>0,file);assert.ok(answers.every(x=>!x.open),file);for(const a of answers){assert.ok(a.querySelector(':scope > summary')?.textContent.trim(),file);assert.ok(a.querySelector(':scope > .knowledge-topic-body')?.textContent.trim(),file);}
   const clone=body.cloneNode(true);clone.querySelectorAll('details.knowledge-topic').forEach(x=>x.remove());const remaining=clone.textContent.trim();if(remaining)result.uncoveredNodes.push({id:entry.documentId,text:remaining.slice(0,240)});
   result.qaPages.push({id:entry.documentId,answers:answers.length,newGroups:body.querySelectorAll('[data-kr-qa-answer]').length});
  }
 }
 for(const x of d.querySelectorAll('.knowledge-reader-original .version-original')){assert.equal(x.open,false,file);const summary=x.querySelector(':scope > summary');assert.notEqual(w.getComputedStyle(summary).display,'none',file);x.open=true;assert.equal(x.open,true);result.versionTables.push(entry.documentId);}
 const readingH1=[...d.querySelectorAll('h1')].filter(x=>!hidden(x,w));assert.equal(readingH1.length,1,file+' read visible h1');
 const r=d.querySelector('[data-knowledge-reader]'),m=JSON.parse(r.dataset.krMetadata);
 if(m.hasScene){d.querySelector('button[data-kr-mode="scene"]').click();const visible=[...d.querySelectorAll('h1')].filter(x=>!hidden(x,w));result.h1Visibility.push({id:entry.documentId,sceneH1:visible.length});assert.equal(visible.length,1,file+' scene visible h1');}
 w.close();
}
assert.equal(result.qaPages.length,133);assert.deepEqual(result.noQaPages,['D13']);assert.equal(result.versionTables.length,14);
fs.writeFileSync('docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt4/all-qa.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({qa:result.qaPages.length,noQa:result.noQaPages,answers:result.qaPages.reduce((s,x)=>s+x.answers,0),newGroups:result.qaPages.reduce((s,x)=>s+x.newGroups,0),versionTables:result.versionTables.length,uncovered:result.uncoveredNodes,sceneH1:result.h1Visibility},null,2));
assert.equal(result.uncoveredNodes.length,0,'Q&A 답이 접기 밖에 남지 않음');
