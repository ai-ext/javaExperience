import assert from 'node:assert/strict';
import { D10_LESSONS, D10_ASSETS, D10_RUNS } from './d10-lesson-data.mjs';
const contract = {
 schema:['relations','original','seed'], keys:['student','offering','enrollment','required','preserved'], null:['native','products'], normalization:['keys','partial','transitive'], join:['on','where','having'], exists:['native','predicate'], mutation:['update','zero'], visibility:['uncommitted','commit','snapshot'], contention:['busy','rollback','guard'], index:['before','after','restore'], plans:['estimate','prefix','covering'], isolation:['pg-rc','pg-rr','innodb','deadlock'], operations:['pool','replica','sharding'], products:['patterns','mongo'], original:['postgres','mysql','jvm'],
};
assert.deepEqual(D10_LESSONS.map(topic=>topic.id),Object.keys(contract));
for(const topic of D10_LESSONS)assert.deepEqual(topic.stages.map(stage=>stage.id),contract[topic.id].map(id=>topic.id+'-'+id));
const stages=D10_LESSONS.flatMap(topic=>topic.stages);
assert.equal(stages.length,44);
assert.deepEqual(['native-fixture','model-json','unrun-source'].map(kind=>stages.filter(stage=>stage.codeKind===kind).length),[22,18,4]);
assert.equal(Object.keys(D10_ASSETS).length,15);
assert.deepEqual(new Set(stages.flatMap(stage=>stage.checks)),new Set(D10_RUNS.checks));
import fs from 'node:fs';
import crypto from 'node:crypto';
import { JSDOM } from 'jsdom';
import { d10Run } from './d10-lesson-data.mjs';
import { renderD10Learning } from './d10-learning.mjs';
import { initD10Learning } from './d10-learning.js';
import { renderD10Supplementary } from './d10-supplement.mjs';
const proof = new URL('../../docs/design/d10-2026-10-21/source-proof/',import.meta.url);
const read = file=>fs.readFileSync(new URL(file,proof),'utf8'),json=file=>JSON.parse(read(file)),sha=value=>crypto.createHash('sha256').update(value).digest('hex');
assert.deepEqual(D10_RUNS,json('execution.json'));assert.deepEqual(D10_RUNS,json('checkpoints/expected-execution.json'));assert.deepEqual(D10_RUNS.models,json('models.json'));
assert.equal(D10_RUNS.checks.length,27);assert.equal(Object.keys(D10_RUNS.models).length,6);assert.ok(Object.values(D10_RUNS.models).every(m=>m.executed===false));
const source=fs.readFileSync(new URL('../../docs/knowledge/D10-database-basics.md',import.meta.url),'utf8'),meta=json('source.json'),manifest=json('fixture-manifest.json');
assert.equal(sha(source),meta.sha256);assert.equal(meta.lines,449);assert.equal(meta.originalBlocks.length,13);assert.equal(manifest.files.length,9);
for(const b of meta.originalBlocks)assert.equal(sha(read('original/'+b.file)),b.sha256);
for(const f of manifest.files)assert.equal(sha(read('fixture/'+f.file)),f.sha256);assert.equal(sha(read('run-proof.py')),manifest.runnerSHA256);
const f=D10_RUNS.facts,raw=json('runtime-last.json');assert.equal(raw.completed,true);assert.ok(raw.commands.every(c=>c.exitCode===0));assert.equal(Object.keys(raw.sqlite.connections).length,5);assert.ok(Object.values(raw.sqlite.connections).every(c=>c.closed));
assert.equal(new Set(Object.values(raw.sqlite.connections).map(c=>c.dbFile)).size,4);assert.equal(raw.sqlite.connections.writer.dbFile,raw.sqlite.connections.observer.dbFile);
assert.equal(raw.sqlite.statements.length,688);assert.equal(raw.sqlite.sqliteTrace.length,688);assert.equal(raw.sqlite.timeline.length,4);
assert.ok(raw.sqlite.statements.some(s=>s.error?.code===5));assert.equal(raw.sqlite.statements.filter(s=>s.error?.code===787).length,3);
assert.deepEqual(f['college-four-relations-fixed-seed'].counts,{student:2,course:1,offering:2,enrollment:1});
assert.deepEqual(f['surrogate-pk-and-two-business-unique-keys'].attempts.map(x=>x.sqliteErrorCode),[1555,2067,2067]);
assert.deepEqual(f['course-and-offering-business-rules'].attempts.map(x=>x.sqliteErrorCode),[2067,2067,787,275]);
assert.equal(f['rejected-writes-preserve-college-seed'].unchanged,true);
assert.deepEqual(f['nullable-unique-versus-required-unique-toy'].nullableRows,[[1,null],[2,null]]);
assert.deepEqual(f['additional-left-on-intermediate-counts'].rows.map(r=>[r[0],...r.slice(2)]),[[1,2,2,200],[2,1,0,0],[3,1,0,0]]);
assert.deepEqual(f['right-paid-where-removes-unmatched-customers'].rows.map(r=>r[0]),[1]);assert.deepEqual(f['translated-final-having-keeps-paid-customer-only'].rows,[[1,'ada@example.test',2,200]]);
assert.deepEqual(f['translated-exists-has-no-status-filter'].rows.map(r=>r[0]),[1,2]);assert.equal(f['translated-exists-has-no-status-filter'].statusPredicatePresent,false);
assert.deepEqual(f['guarded-write-501-one-zero-zero-and-paid-row'].updateRowcounts,[1,0]);assert.equal(f['guarded-write-501-one-zero-zero-and-paid-row'].deleteRowcount,0);
assert.deepEqual([f['sqlite-wal-uncommitted-change-hidden'].writerUncommittedValue,f['sqlite-wal-uncommitted-change-hidden'].otherConnectionValue],[20,10]);
assert.deepEqual(Object.values(f['sqlite-wal-read-snapshot-until-transaction-end']).slice(0,3),[20,20,30]);assert.equal(f['sqlite-begin-immediate-writer-contention-busy'].secondWriterError.code,5);
assert.deepEqual(f['sqlite-rollback-preserves-previous-state'].writerObserverAfterRollback,[30,30]);assert.deepEqual(f['guarded-stock-update-one-then-zero'].rowcounts,[1,0]);assert.equal(f['guarded-stock-update-one-then-zero'].finalOtherConnectionQuantity,2);
assert.equal(f['sqlite-eqp-before-index-observed-scan'].seedRows,512);assert.equal(f['sqlite-eqp-before-index-observed-scan'].observed.results.length,14);assert.equal(f['sqlite-eqp-drop-restore-and-results-match'].allFourResultsIdentical,true);
assert.ok(Object.values(f['all-own-connections-fk-on-and-integrity-clean'].foreignKeysPragma).every(v=>v===1));assert.equal(f['all-owned-sqlite-connections-closed'].allOwnedConnectionsClosed,true);
const budget=D10_RUNS.models['connections-operations'].specifiedBudget;assert.equal(budget.applicationInstanceCount*budget.maxPerInstance+budget.batch+budget.monitoring,budget.plannedNonReserveTotal);assert.equal(budget.plannedNonReserveTotal,93);assert.equal(budget.totalIncludingReserve,113);assert.equal(budget.additionalInstancesCase.plannedIncludingReserve,153);
for(const s of stages){
 assert.ok(s.code.endsWith('\n'));assert.ok(s.active.length&&s.active.every(i=>Number.isInteger(i)&&s.code.split('\n')[i]?.trim()));assert.ok(s.code.split('\n').length<=14,s.id);
 if(s.codeKind==='model-json'){let value=d10Run(s.codePath);if(s.codeKeys)value=Object.fromEntries(s.codeKeys.map(k=>[k,value[k]]));assert.deepEqual(JSON.parse(s.code),value);}
 else assert.ok(read(s.codePath).includes(s.code),s.id+' exact source substring');
 for(const key of s.runKeys)assert.notEqual(d10Run(key),undefined,key);
 if(!s.checks.length)assert.ok(s.runKeys.every(k=>k.startsWith('models.')));
}
const saved=structuredClone(D10_ASSETS);for(const a of Object.values(D10_ASSETS))a.ready=true;
try{
 const dom=new JSDOM('<main>'+renderD10Learning()+'<details class="d10-legacy"><summary>기존 지도</summary><a href="#source-deep">원문</a></details><details id="d10-original"><summary>원문</summary><details><summary id="source-deep">원문 절</summary><pre><code>unchanged</code></pre></details></details></main>',{url:'https://learn.example/d10.html',pretendToBeVisual:true});
 const w=dom.window,d=w.document,$=s=>d.querySelector(s),root=$('[data-d10-learning]');const copied=[];Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async v=>copied.push(v)},configurable:true});const media={matches:false,listeners:[],addEventListener(t,fn){this.listeners.push(fn);}};w.matchMedia=()=>media;
 const foreign={foreign:{anchor:7},__javaExperienceD09:{topic:'scrape',stage:'scrape-stopped'}};w.history.replaceState(foreign,'');initD10Learning(d,w);const old=['.d10-legacy','#d10-original'].map(s=>$(s).outerHTML);
 function topic(id){$('[data-d10-topic]').value=id;$('[data-d10-topic]').dispatchEvent(new w.Event('change'));}
 function stage(id){$('[data-d10-stage="'+id+'"]').click();}
 function resize(matches){media.matches=matches;for(const fn of media.listeners)fn({matches});}
 for(const lesson of D10_LESSONS){topic(lesson.id);for(const [i,s]of lesson.stages.entries()){
  stage(s.id);assert.equal(root.dataset.stage,s.id);assert.equal(root.dataset.topic,lesson.id);assert.equal($('[data-d10-title]').textContent,s.title);assert.equal($('[data-d10-lead]').textContent,s.lead);assert.equal($('[data-d10-source-note]').textContent,lesson.sourceNote);
  assert.equal($('[data-d10-code]').textContent,s.code);assert.deepEqual([...$('[data-d10-code]').querySelectorAll('mark')].map(n=>n.textContent),s.active.map(i=>s.code.split('\n')[i]));
  assert.deepEqual([...$('[data-d10-state]').querySelectorAll('dt')].map(n=>[n.textContent,n.nextElementSibling.textContent]),s.values);
  assert.equal($('[data-d10-stdout]').textContent,s.checks.map(c=>'PASS '+c).join('\n'));assert.equal($('[data-d10-stdout]').parentElement.hidden,s.checks.length===0);assert.equal($('[data-d10-output]').open,false);
  assert.deepEqual([...$('[data-d10-runs]').querySelectorAll('pre code')].map(n=>JSON.parse(n.textContent)),s.runKeys.map(d10Run));assert.equal($('[data-d10-position]').textContent,`${i+1} / ${lesson.stages.length}`);
  for(const sel of ['[data-d10-code]','[data-d10-state]','[data-d10-source-note]'])assert.equal($(sel).closest('details'),null);
  $('[data-d10-copy]').click();await Promise.resolve();await Promise.resolve();assert.equal(copied.at(-1),s.code);
  assert.deepEqual(['.d10-legacy','#d10-original'].map(s=>$(s).outerHTML),old);
 }}
 assert.deepEqual(w.history.state.foreign,foreign.foreign);assert.deepEqual(w.history.state.__javaExperienceD09,foreign.__javaExperienceD09);
 topic('keys');let buttons=[...root.querySelectorAll('[data-d10-stage]')];buttons[0].focus();buttons[0].dispatchEvent(new w.KeyboardEvent('keydown',{key:'End',bubbles:true,cancelable:true}));assert.equal(d.activeElement,buttons[4]);buttons[4].dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));assert.equal(root.dataset.stage,'keys-preserved');
 stage('keys-enrollment');$('[data-d10-next]').focus();$('[data-d10-next]').click();$('[data-d10-next]').click();assert.equal(d.activeElement.getAttribute('data-d10-stage'),'keys-preserved');
 $('[data-d10-output]').open=true;$('[data-d10-zoom]').click();resize(true);assert.equal($('[data-d10-output]').open,true);assert.equal($('[data-d10-zoom]').getAttribute('aria-pressed'),'true');$('[data-d10-zoom]').click();resize(false);resize(true);assert.equal($('[data-d10-zoom]').getAttribute('aria-pressed'),'false');assert.equal($('[data-d10-output]').open,true);stage('keys-student');assert.equal($('[data-d10-output]').open,false);
 topic('schema');stage('schema-original');w.navigator.clipboard.writeText=async()=>{throw Error('clipboard unavailable');};$('[data-d10-copy]').click();await Promise.resolve();await Promise.resolve();const actual=w.getSelection().toString(),expected=stages.find(s=>s.id==='schema-original').code;assert.equal(actual,expected);assert.ok(actual.includes('\n\n')&&actual.endsWith('\n'));
 const target={topic:'visibility',stage:'visibility-snapshot'};w.history.replaceState({...w.history.state,__javaExperienceD10:target},'');w.dispatchEvent(new w.PopStateEvent('popstate'));assert.equal(root.dataset.stage,target.stage);w.history.pushState({foreign:{next:true}},'','#entry');w.dispatchEvent(new w.PopStateEvent('popstate'));assert.deepEqual(w.history.state.__javaExperienceD10,target);assert.deepEqual(w.history.state.foreign,{next:true});
 w.location.hash='source-deep';w.dispatchEvent(new w.HashChangeEvent('hashchange'));assert.equal($('#d10-original').open,true);assert.equal($('#source-deep').closest('details').open,true);assert.equal(fs.readFileSync(new URL('../../docs/knowledge/D10-database-basics.md',import.meta.url),'utf8'),source);dom.window.close();
}finally{for(const[k,v]of Object.entries(saved))Object.assign(D10_ASSETS[k],v);}
const supplement=new JSDOM(renderD10Supplementary()).window.document;assert.ok(supplement.querySelector('details.d10-supplement'));const snippets=[...supplement.querySelectorAll('pre code')].map(n=>n.textContent);for(const b of meta.originalBlocks)assert.ok(snippets.includes(read('original/'+b.file)));for(const f of manifest.files){let expected=read('fixture/'+f.file);try{expected=JSON.stringify(JSON.parse(expected),null,2);}catch{}assert.ok(snippets.includes(expected),f.file);}
console.log('D10 unit: 15질문44상태/native22·model18·unrun4/27CHECK6모델·실제SQL/시점·원문/fixture·정확code/JSON·clipboard/history/mobile/zoom 보존 통과');
