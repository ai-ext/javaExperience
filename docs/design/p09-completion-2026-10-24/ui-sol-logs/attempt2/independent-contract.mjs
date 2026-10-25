import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const root='LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night';
const require=createRequire(root+'/tools/site/package.json');
const {JSDOM}=require('jsdom');
const {buildSync}=require('esbuild');
const {P09_LESSONS}=await import(root+'/tools/site/p09-lesson-data.mjs');
const {P09_ASSETS}=await import(root+'/tools/site/p09-assets.mjs');
const {renderP09Learning}=await import(root+'/tools/site/p09-learning.mjs');
const read=p=>fs.readFileSync(root+'/'+p,'utf8');
const head=p=>execFileSync('git',['show','HEAD:'+p],{cwd:root,encoding:'utf8'});
const sha=s=>createHash('sha256').update(s).digest('hex');
const html=read('docs/knowledge/P09-java-syntax-basics.html');
const bundle=read('tools/site/p09-learning.bundle.js');
const source=read('docs/design/p09-completion-2026-10-24/proof/P09BoundariesProof.java');
const lines=source.split('\n');
const expected={
  'shared-before':[['a.quantity','0'],['b.quantity','0'],['RequestState.latestName','null'],['관찰','initial=0/0/null']],
  'shared-after-a':[['a.quantity','2'],['b.quantity','0'],['RequestState.latestName','Ada'],['관찰','afterA=2/0/Ada']],
  'shared-after-b':[['a.quantity','2'],['b.quantity','5'],['RequestState.latestName','Grace'],['관찰','afterB=2/5/Grace']],
  'sum-empty':[['호출 인자','[]'],['배열 길이','0'],['sum 반환','0'],['실행 관측','sumEmpty=0']],
  'sum-items':[['호출 인자','2, 3'],['values 배열 원소','[2, 3]'],['배열 길이','2'],['sum 반환','5'],['실행 관측','sumItems=5']],
  'sum-array':[['호출 인자','new int[]{4, 6}'],['values 배열 원소','[4, 6]'],['배열 길이','2'],['sum 반환','10'],['실행 관측','sumArray=10']],
  'choose-fixed':[['호출','choose(2, 3)'],['선택','fixed(int,int)'],['실행 관측','chooseTwo=fixed(int,int)'],['표시자 의미','합계가 아님']],
  'choose-array':[['호출','choose(new int[]{2, 3})'],['선택','varargs(int[])'],['실행 관측','chooseArray=varargs(int[])'],['범위','표시된 두 선언에 한정']],
  'choose-empty':[['호출','choose()'],['varargs 배열 길이','0'],['선택','varargs(int[])'],['실행 관측','chooseEmpty=varargs(int[])']],
};
const lessons=P09_LESSONS.filter(x=>['shared-state','varargs-selection'].includes(x.id));
assert.equal(P09_LESSONS.length,22);assert.equal(P09_LESSONS.flatMap(x=>x.stages).length,93);
const oldModule=await import('data:text/javascript;base64,'+Buffer.from(head('tools/site/p09-lesson-data.mjs')).toString('base64'));
assert.deepEqual(P09_LESSONS.filter(x=>!lessons.includes(x)),oldModule.P09_LESSONS,'기존20질문84상태 data 전체 동일');
const oldAssets=await import('data:text/javascript;base64,'+Buffer.from(head('tools/site/p09-assets.mjs')).toString('base64'));
for(const [key,value] of Object.entries(oldAssets.P09_ASSETS))assert.deepEqual(P09_ASSETS[key],value,key+' 기존 asset 완전보존');
const generated=buildSync({entryPoints:[root+'/tools/site/p09-learning.js'],outfile:root+'/tools/site/p09-learning.bundle.js',write:false,bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true,legalComments:'none',banner:{js:'// Generated from p09-learning.js by tools/site/build.mjs'}}).outputFiles[0].text;
assert.equal(bundle,generated,'제품파일 쓰기 없이 bundle 재생성 byte 일치');
const currentDoc=new JSDOM(html).window.document;
const previousDoc=new JSDOM(head('docs/knowledge/P09-java-syntax-basics.html')).window.document;
assert.equal(currentDoc.querySelector('#p09-original').outerHTML,previousDoc.querySelector('#p09-original').outerHTML,'sourceRoot 전체 HTML byte 동일');
const learning=new JSDOM(renderP09Learning()).window.document;
assert.equal(currentDoc.querySelector('[data-p09-learning]').outerHTML,learning.querySelector('[data-p09-learning]').outerHTML,'렌더러/실제 생성 HTML 일치');
for(const id of ['p09-boundaries-source','p09-boundaries-stdout']){
 assert.equal(currentDoc.querySelector('#'+id).outerHTML,learning.querySelector('#'+id).outerHTML,id+' 실제 생성 일치');
 assert.equal(currentDoc.querySelector('#p09-original').contains(currentDoc.querySelector('#'+id)),false);
}
function page(topic,stage,code=bundle){
 const dom=new JSDOM(html,{runScripts:'outside-only',url:'https://learn.example/docs/knowledge/P09-java-syntax-basics.html?from=detail&keep=42'}),w=dom.window;
 const $=s=>w.document.querySelector(s);
 w.fetch=()=>{throw Error('network forbidden');};
 Object.defineProperty(w.navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.resolve()}});
 if(topic)w.history.replaceState({foreign:{keep:42},__javaExperienceP09:{topic,stage,comparison:false}},'');
 w.eval(code);return {dom,w,$};
}
const states=[];
for(const lesson of lessons)for(const s of lesson.stages){
 assert.deepEqual(s.values,expected[s.id],s.id+' 모든 표시값 독립 기대값');
 let last=0;const pieces=s.sourceFragments.map(f=>{assert.ok(f.start>=last&&f.start>=1&&f.end>=f.start&&f.end<=lines.length);last=f.end;let a=lines.slice(f.start-1,f.end);if('startColumn'in f){assert.ok(Number.isInteger(f.startColumn)&&f.startColumn>=0&&f.endColumn<=a[0].length&&f.startColumn<f.endColumn);a=[a[0].slice(f.startColumn,f.endColumn)];}return a.join('\n');});
 assert.equal(pieces.join('\n'),s.code,s.id+' ordered exact source ranges, no normalization');
 const {w,$}=page(lesson.id,s.id);
 assert.equal($('[data-p09-topic]').value,lesson.id);assert.equal($('[data-p09-code]').textContent,s.code);
 assert.deepEqual([...w.document.querySelectorAll('[data-p09-state] dt')].map(x=>x.textContent),expected[s.id].map(x=>x[0]));
 assert.deepEqual([...w.document.querySelectorAll('[data-p09-state] dd')].map(x=>x.textContent),expected[s.id].map(x=>x[1]));
 assert.equal($('[data-p09-note]').textContent,lesson.note);
 assert.equal($('[data-p09-code]').closest('details'),null,'핵심코드 기본노출');
 assert.equal($('[data-p09-image-link]').getAttribute('href'),$('[data-p09-image]').getAttribute('src'));
 assert.equal(w.location.search,'?from=detail&keep=42','query 보존');assert.equal(w.history.state.foreign.keep,42);
 assert.equal(w.history.length,1);
 const mark=$('[data-p09-focus]');const focus=P09_ASSETS[s.image].focus[s.id];assert.deepEqual(['left','top','width','height'].map(k=>parseFloat(mark.style[k])),focus);
 const note=$('[data-p09-note]').textContent;assert.match(note,/HTTP/);assert.match(note,/Java 21/);
 w.history.replaceState({...w.history.state,__javaExperienceP09:{topic:lesson.id,stage:s.id}},'');w.dispatchEvent(new w.PopStateEvent('popstate'));
 assert.equal($('[data-p09-code]').textContent,s.code,'popstate 복원');
 $('a[href="#p09-original"]').click();assert.equal($('#p09-original').open,true);
 states.push(s.id);w.close();
}
console.log(JSON.stringify({PASS:true,states,sourceRootSHA256:sha(currentDoc.querySelector('#p09-original').outerHTML),bundleSHA256:sha(bundle),oldLessons:oldModule.P09_LESSONS.length,oldStates:oldModule.P09_LESSONS.flatMap(x=>x.stages).length,oldAssets:Object.keys(oldAssets.P09_ASSETS).length},null,2));
