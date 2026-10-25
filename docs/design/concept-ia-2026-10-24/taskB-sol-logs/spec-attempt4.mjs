import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {JSDOM} from '../../../../tools/site/node_modules/jsdom/lib/api.js';
import {renderKnowledgeReaderPage} from '../../../../tools/site/knowledge-reader.mjs';
import {initP09Learning} from '../../../../tools/site/p09-learning.js';
const out='docs/design/concept-ia-2026-10-24/taskB-sol-logs/attempt4/';
const js=fs.readFileSync('tools/site/knowledge-reader.js','utf8');
const baseline=JSON.parse(fs.readFileSync('docs/design/concept-ia-2026-10-24/source-baseline.json','utf8'));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const norm=x=>x.textContent.replace(/\s+/g,' ').trim();
const checks=[]; const ok=(name,fn)=>{fn();checks.push(name);};
const make=(name,suffix='',source=js)=>{let dom=new JSDOM(fs.readFileSync('docs/knowledge/'+name+'.html','utf8'),{url:'https://learn.example/docs/knowledge/'+name+'.html'+suffix,runScripts:'outside-only',pretendToBeVisual:true});dom.window.HTMLElement.prototype.scrollIntoView=function(){};dom.window.eval(source);dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));return dom;};
let maps=0;
for(const p of baseline.pages.filter(x=>x.sourceSelector)){
 const dom=new JSDOM(fs.readFileSync(p.file,'utf8')),d=dom.window.document,s=d.querySelector(p.sourceSelector);
 assert.equal(sha(norm(s)),p.sourceTextSHA256,p.file);assert.equal(sha(fs.readFileSync(p.source)),p.sourceSHA256,p.source);
 assert.deepEqual([...s.querySelectorAll('pre code')].map(x=>sha(x.textContent)),p.sourceCode);
 assert.equal(d.querySelectorAll('main').length,1);const ids=[...d.querySelectorAll('[id]')].map(x=>x.id);assert.equal(new Set(ids).size,ids.length,p.file);
 const head=new JSDOM(execFileSync('git',['show','HEAD:'+p.file],{encoding:'utf8',maxBuffer:16*1024*1024}));
 const selector='.knowledge-page-map';const old=[...head.window.document.querySelectorAll(selector)].map(x=>x.outerHTML);assert.deepEqual([...d.querySelectorAll(selector)].map(x=>x.outerHTML),old,p.file+' maps');maps+=old.length;
 for(const id of p.existingIds)assert.ok(d.getElementById(id));
 head.window.close();dom.window.close();
}
checks.push('134 source roots text/code/MD/oldids, single main, unique ids and '+maps+' old maps preserved');
for(const name of ['P09-java-syntax-basics','J01-types-string','S09-jpa-hibernate','W11-why-tx-in-service']){
 const dom=make(name,'?read=1'),d=dom.window.document;
 const qa=[...d.querySelectorAll('.knowledge-chapter')].find(x=>x.querySelector(':scope > summary strong')?.textContent.includes('자가점검'));
 const refs=[...d.querySelectorAll('.knowledge-chapter')].find(x=>x.querySelector(':scope > summary strong')?.textContent.includes('참고문헌'));
 ok(name+' Q&A and references',()=>{assert.ok(qa);assert.ok(refs);assert.equal(qa.open,true);const topics=[...qa.querySelectorAll('.knowledge-topic')];assert.ok(topics.length);assert.ok(topics.every(x=>!x.open));assert.equal(refs.open,false);});
 dom.window.close();
}
{
 const dom=make('P16-json-jackson-practical'),d=dom.window.document;
 ok('P16 scene title visible class and source full title',()=>{assert.equal(d.querySelector('#p16-heading').classList.contains('p16-original-title'),false);assert.equal(d.querySelector('h1.kr-source-title').textContent.includes('요청/응답 직렬화에서 막히는 것들'),true);assert.ok(d.querySelector('h1.kr-source-title.p16-original-title'));});dom.window.close();
}
{
 const dom=make('P09-java-syntax-basics','?foreign=x&sort=title#does-not-exist'),w=dom.window,d=w.document;initP09Learning(d,w);
 const read=d.querySelector('button[data-kr-mode="read"]'),scene=d.querySelector('button[data-kr-mode="scene"]');
 w.history.replaceState({...w.history.state,foreign:{a:1}},'',w.location.href);
 const stageButtons=[...d.querySelectorAll('[data-p09-stage]')];assert.ok(stageButtons.length>1);stageButtons[1].click();const selected={...w.history.state.__javaExperienceP09};
 read.focus();read.click();
 ok('missing hash read focus and foreign state',()=>{assert.equal(d.activeElement,d.querySelector('.kr-reading-title'));assert.deepEqual(w.history.state.foreign,{a:1});assert.equal(new URL(w.location.href).searchParams.get('foreign'),'x');assert.equal(w.location.hash,'#does-not-exist');});
 scene.click();ok('P09 stage survives reader modes',()=>assert.deepEqual(w.history.state.__javaExperienceP09,selected));
 w.history.replaceState({...w.history.state},'','?foreign=x#%E0%A4%A');ok('malformed hash safe',()=>w.dispatchEvent(new w.HashChangeEvent('hashchange')));
 w.history.replaceState({...w.history.state},'','?foreign=x#1-한-줄로-말하면');w.dispatchEvent(new w.HashChangeEvent('hashchange'));
 ok('source hash opens and focuses target',()=>{assert.equal(d.querySelector('[data-knowledge-reader]').dataset.krMode,'read');assert.equal(d.activeElement,d.getElementById('1-한-줄로-말하면'));assert.ok(d.querySelector('#p09-original').open);});
 scene.click();ok('source hash cleared only on scene',()=>assert.equal(w.location.hash,''));
 w.history.replaceState({...w.history.state},'','?read=1&foreign=x');w.dispatchEvent(new w.PopStateEvent('popstate'));ok('read query overrides stale scene state',()=>assert.equal(d.querySelector('[data-knowledge-reader]').dataset.krMode,'read'));
 const replace=w.history.replaceState.bind(w.history);let writes=0;w.history.replaceState=(...a)=>{writes++;return replace(...a)};
 w.eval('initKnowledgeReader(document, window)');read.click();ok('init idempotence',()=>assert.equal(writes,1));dom.window.close();
}
{
 const dom=make('J01-types-string');ok('J01 pure prose default',()=>{assert.equal(dom.window.document.querySelector('[data-knowledge-reader]').dataset.krMode,'read');assert.equal(dom.window.document.querySelector('.kr-controls').hidden,true);});dom.window.close();
}
{
 const label='List<T> </script><script id="injected">x</script> & "quoted"';const esc=x=>x.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
 const dom=new JSDOM(renderKnowledgeReaderPage({title:'<h1 id="g">'+esc(label)+' — title</h1>',source:'<h2 id="g2">'+esc(label)+'</h2>'}));const d=dom.window.document,m=JSON.parse(d.querySelector('[data-knowledge-reader]').dataset.krMetadata);
 ok('metadata JSON and HTML boundary roundtrip',()=>{assert.equal(m.title,label+' — title');assert.equal(m.headings[0].label,label);assert.equal(d.querySelector('#injected'),null);});dom.window.close();
}
const changed=execFileSync('git',['diff','--name-only','--','tools/site/test-*-generated.mjs'],{encoding:'utf8',maxBuffer:16*1024*1024}).trim().split('\n').filter(Boolean);
for(const f of changed){const old=execFileSync('git',['show','HEAD:'+f],{encoding:'utf8',maxBuffer:16*1024*1024});assert.equal(fs.readFileSync(f,'utf8'),old.replaceAll("'main>h1'","'main>h1, h1.kr-source-title'"),f);}
checks.push('19 generated test deltas are approved source-H1 selector only: '+changed.length);assert.equal(changed.length,19);
const result={status:'PASS_BOUNDED',time:new Date().toISOString(),checks,sourcePages:134,maps,approvedTestSelectorChanges:changed};fs.writeFileSync(out+'independent-spec.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
