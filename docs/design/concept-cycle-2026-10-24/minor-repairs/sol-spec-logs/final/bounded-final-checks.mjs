import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const root=process.cwd(),url=p=>'file://'+root+'/'+p;
const require=createRequire(root+'/tools/site/package.json'),{JSDOM}=require('jsdom');
const {B01_LESSONS}=await import(url('tools/site/b01-lesson-data.mjs'));
const original=fs.readFileSync(root+'/docs/design/b01-2026-10-20/source-proof/probe/example/account/B01Proof.java','utf8');
const noSpace=x=>x.replace(/\s/g,'');
const report={b01:[],d02:{},d04:{},v04:{}};
for(const stage of B01_LESSONS.find(l=>l.id==='password').stages){
 assert.ok(stage.sourceFragments.every(f=>original.includes(f)),stage.id+' exact raw fragments');
 assert.equal(noSpace(stage.code),noSpace(stage.sourceFragments.join('')),stage.id+' only whitespace changes between displayed code and exact fragments');
 assert.doesNotMatch(stage.code,/\b(?:check|map)\(/);
 report.b01.push({stage:stage.id,characters:stage.code.length,active:stage.active,exactFragments:true,displayMatchesFragmentsIgnoringWhitespace:true});
}
function generated(id,name){
 const page=new JSDOM(fs.readFileSync(root+'/docs/knowledge/'+name,'utf8'),{url:'https://learn.example/',runScripts:'outside-only'});
 page.window.eval(fs.readFileSync(root+'/tools/site/'+id+'-learning.bundle.js','utf8'));return page;
}
const page=generated('d02','D02-server-network-basics.html'),ui=page.window.document.querySelector('[data-d02-learning]');
ui.querySelector('[data-d02-topic]').value='diagnose';ui.querySelector('[data-d02-topic]').dispatchEvent(new page.window.Event('change'));ui.querySelector('[data-d02-stage="diagnose-layers"]').click();
const items=[...ui.querySelectorAll('[data-d02-state] dt')];const state=items.find(n=>n.textContent==='잘못된 이름 TLS').nextElementSibling.textContent;
assert.equal(state,'완료 proxyRequests 기록 증가0 · handler 진입 미계측');report.d02={generatedDiagnoseValue:state};page.window.close();
const d4=generated('d04','D04-build-pipeline-explained.html'),u4=d4.window.document.querySelector('[data-d04-learning]');
for(const target of ['graph-branches','assemble-boundary']){u4.querySelector('[data-d04-jump-stage="'+target+'"]').click();assert.equal(u4.dataset.stage,target);assert.equal(u4.querySelector('[data-d04-stage-select]').value,target);report.d04[target]={stage:u4.dataset.stage,title:u4.querySelector('[data-d04-title]').textContent};}d4.window.close();
const v4=new JSDOM(fs.readFileSync(root+'/docs/knowledge/V04-test-db-strategy.html','utf8'));
const supplement=v4.window.document.querySelector('.v04-supplement'),firstJSON=supplement.querySelector('pre code');
assert.equal(JSON.parse(firstJSON.textContent).title,'V04 최종 실행 범위 정정');assert.match(supplement.querySelector('p').textContent,/이전 준비 시점의 메모/);
report.v04={firstJSONTitle:JSON.parse(firstJSON.textContent).title,historyLabelBeforeHistoricalJSON:true};v4.window.close();
console.log(JSON.stringify(report,null,2));
