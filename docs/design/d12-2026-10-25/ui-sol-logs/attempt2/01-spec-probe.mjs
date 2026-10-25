import fs from 'node:fs';
import assert from 'node:assert/strict';
import cp from 'node:child_process';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const root=process.cwd(),base=root+'/docs/design/d12-2026-10-25/',out=base+'ui-sol-logs/attempt2/';
const {JSDOM}=createRequire(root+'/tools/site/package.json')('jsdom');
const {D12_LESSONS:lessons,D12_ASSETS:assets,validateD12CanonicalProof}=await import(root+'/tools/site/d12-lesson-data.mjs');
const {initD12Learning}=await import(root+'/tools/site/d12-learning.js');
const read=p=>fs.readFileSync(root+'/'+p,'utf8'),json=p=>JSON.parse(read(p));
const meta=json('docs/design/d12-2026-10-25/selected-proof.json'),proof=json(meta.canonicalAttempt),linux=json(meta.linuxOutput);
assert.deepEqual(linux,proof.linuxActual);assert.deepEqual(linux,JSON.parse(proof.linuxFixtureOutput.stdout));
const original=read('docs/knowledge/D12-linux-terminal-basics.md');
assert.equal(createHash('sha256').update(original).digest('hex'),'bcdd88b289812a79e82d1a705d38c0f11477afaadfc76985b2eb50b231d79b0c');
const groups={
 'explanatory-model':['terminal-shell','ssh-host-key','ssh-user-key','exec-boundary','unit-edited','daemon-reloaded','process-restarted','boot-enabled','enable-now'],
 'original-prose':['log-sources','memory-available'],
 'original-ini-unrun':['unit-context','network-ordering'],
 'additional-linux-bash':['cd-builtin','stdout-first','stderr-first','append-output','overwrite-output','default-pipeline','pipefail-pipeline','variable-local','variable-exported','path-first','path-second'],
 'additional-linux-python-probe':['mode-owner','mode-group','mode-other'],
 'additional-linux-python':['term-released','disk-written','disk-unlinked-open','disk-closed'],
 'additional-linux-argv-json':['parent-no-search','known-path-search','directory-no-list','directory-unlink','term-ack-alive','kill-observed','socket-listen','tcp-connected','http-warming','http-ready','rsync-dry-run','container-pid1','container-exec','container-logs'],
};
const stages=lessons.flatMap(x=>x.stages),lookup=Object.fromEntries(stages.map(x=>[x.id,x]));
assert.equal(stages.length,45);assert.equal(Object.values(groups).flat().length,45);
for(const [kind,ids]of Object.entries(groups))for(const id of ids)assert.equal(lookup[id].codeKind,kind,id+' independent kind');
const focus=json('docs/design/d12-2026-10-25/FOCUS-DESIGN.json'),lead=json('docs/design/d12-2026-10-25/LEAD-DESIGN.json');
const html=read('docs/knowledge/D12-linux-terminal-basics.html');
const dom=new JSDOM(html,{url:'https://local.test/docs/knowledge/D12-linux-terminal-basics.html?read=1&catalogSearch=linux',runScripts:'outside-only'});
const doc=dom.window.document;let copies=[];Object.defineProperty(dom.window.navigator,'clipboard',{configurable:true,value:{writeText:async x=>copies.push(x)}});
initD12Learning(doc,dom.window);const ui=doc.querySelector('[data-d12-learning]'),sel=ui.querySelector('[data-d12-topic]');
const labels={'original-prose':'원문 산문 · 실행 코드 아님','original-ini-unrun':'원문 INI unit · 미실행','explanatory-model':'설명 모델 · 명령 실행 결과 아님','additional-linux-bash':'추가 Linux · Bash 실제 관측 · 실제 argv[-1]','additional-linux-python':'추가 Linux 실제 Python fixture 코드','additional-linux-python-probe':'추가 Linux 실제 Python 권한 probe','additional-linux-argv-json':'실제 실행 argv(JSON) · 복사값은 명령 예시 아님'};
for(const lesson of lessons){sel.value=lesson.id;sel.dispatchEvent(new dom.window.Event('change',{bubbles:true}));for(const stage of lesson.stages){
 ui.querySelector('[data-d12-stage="'+stage.id+'"]').click();assert.equal(ui.dataset.stage,stage.id);
 assert.equal(stage.lead,lead.states[stage.id]);assert.equal(ui.querySelector('[data-d12-lead]').textContent,lead.states[stage.id]);
 assert.deepEqual(assets[stage.image].focus[stage.id],focus.states[stage.id]);
 assert.equal(ui.querySelector('[data-d12-code-kind]').textContent,labels[stage.codeKind]);
 for(const fragment of stage.sourceFragments){assert.equal(fragment.content,read(fragment.path).replace(/\r\n/g,'\n').split('\n').slice(fragment.start-1,fragment.end).join('\n'));}
 const image=ui.querySelector('[data-d12-image]');assert.equal(image.getAttribute('src'),'../design/d12-2026-10-25/'+assets[stage.image].file);assert.ok(fs.existsSync(new URL(image.src).pathname.replace('/docs/design/',root+'/docs/design/')));
 const prose=stage.codeKind==='original-prose';assert.equal(ui.querySelector('[data-d12-code-frame]').hidden,prose);assert.equal(ui.querySelector('[data-d12-prose]').hidden,!prose);
 ui.querySelector('[data-d12-copy]').click();await Promise.resolve();await Promise.resolve();assert.equal(copies.at(-1),stage.code);
}}
assert.equal(copies.length,45);assert.equal(ui.querySelector('[data-d12-focus-status]'),null);
const css=read('tools/site/d12-learning.css');
assert.match(css,/\.kr-reader\.is-scene \[data-kr-scene\] \.d12-learning \.p09-workspace\{display:block(?:;[^}]*)?\}/);
assert.match(css,/\.kr-reader\.is-scene \[data-kr-scene\] \.d12-learning \.p09-workspace > \.p09-observation\{display:grid;grid-template-columns:minmax\(0,\.9fr\) minmax\(0,1\.2fr\);gap:28px\}/);
const before=json('docs/design/d12-2026-10-25/registry-before-task26.json'),after=json('docs/design/concept-cycle-2026-10-22/tasks.json');
const array=x=>Array.isArray(x)?x:x.tasks;const bt=array(before),at=array(after);assert.equal(bt.length,134);assert.equal(at.length,134);
let task26;for(let i=0;i<at.length;i++){if(at[i].id===26||at[i].task===26||at[i].taskNumber===26||at[i].taskId===26||at[i].id==='task26'){task26=i;}}
if(task26===undefined)task26=25;
for(let i=0;i<at.length;i++)if(i!==task26)assert.deepEqual(at[i],bt[i]);
const t26={...at[task26],harnessCommand:bt[task26].harnessCommand};assert.deepEqual(t26,bt[task26]);assert.deepEqual(at[task26].harnessCommand,['npm','--prefix','tools/site','run','test:d12']);
const collector=read('tools/site/inventory-visual-work.mjs');assert.match(collector,/import \{ D12_LESSONS \} from '\.\/d12-lesson-data\.mjs'/);assert.match(collector,/\['docs\/knowledge\/D12-linux-terminal-basics\.md', 'd12_learning_state', D12_LESSONS\]/);
const trackedHtml=cp.execFileSync('git',['ls-files','docs/knowledge/*.html','scenario/**/*.html'],{encoding:'utf8'}).trim().split('\n');const htmlChanges=[];for(const f of trackedHtml){const prior=cp.execFileSync('git',['show','HEAD:'+f],{maxBuffer:20e6});if(!prior.equals(fs.readFileSync(root+'/'+f)))htmlChanges.push(f);}
assert.deepEqual(htmlChanges,['docs/knowledge/D12-linux-terminal-basics.html']);
const payload=doc.querySelector('[data-d12-data]').textContent;const payloadData=JSON.parse(payload);
assert.equal(Object.keys(payloadData.assets).length,16);assert.equal((payload.match(/"fullEvidence"/g)||[]).length,0);
assert.ok(validateD12CanonicalProof());
const result={specVerdict:'PASS',counts:{C:0,I:0,M:0},originalSHA:'bcdd88b289812a79e82d1a705d38c0f11477afaadfc76985b2eb50b231d79b0c',stateKinds:Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,v.length])),DOMStatesChecked:45,copiesChecked:45,leadsAndFocusChecked:45,canonicalRawBinding:'embedded linuxActual and stdout equal separated raw',trackedHtmlChecked:trackedHtml.length,trackedHtmlChanged:htmlChanges,registryOtherEntriesUnchanged:133,task26Change:'harnessCommand only',payloadBytes:Buffer.byteLength(payload),htmlBytes:Buffer.byteLength(html),payloadHasFullRaw:false,notPerformed:['actual PC','Docker proof rerun','collector execution']};
fs.writeFileSync(out+'01-spec-review.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
