import fs from 'node:fs';
import crypto from 'node:crypto';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const root=process.cwd(),base='docs/design/d11-2026-10-25',out=base+'/ui-sol-logs/collector-addendum/';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const names=['tools/site/inventory-visual-work.mjs','tools/site/d11-lesson-data.mjs','docs/design/visual-inventory.jsonl','docs/design/visual-inventory-summary.json','docs/knowledge/D11-web-security-basics.md','docs/knowledge/D11-web-security-basics.html',base+'/selected-images.json',base+'/ui-luna-logs/inventory-mark.log','/tmp/d11-visual-inventory-baseline-2026-10-25.jsonl'];
const before=Object.fromEntries(names.map(p=>[p,sha(fs.readFileSync(p))]));
fs.writeFileSync(out+'00-input-start.json',JSON.stringify(before,null,2)+'\n');
const source=fs.readFileSync(names[0],'utf8'),head=cp.execFileSync('git',['show','HEAD:'+names[0]],{encoding:'utf8'});
const importLine="import { D11_LESSONS } from './d11-lesson-data.mjs';\n";
const tupleLine="    ['docs/knowledge/D11-web-security-basics.md', 'd11_learning_state', D11_LESSONS],\n";
assert.equal(source.split(importLine).length,2);assert.equal(source.split(tupleLine).length,2);
assert.equal(source.replace(importLine,'').replace(tupleLine,''),head,'collector differs from HEAD only by D11 import and tuple');
const {D11_LESSONS,D11_ASSETS}=await import(pathToFileURL(root+'/tools/site/d11-lesson-data.mjs'));
const expected=D11_LESSONS.flatMap(l=>l.stages.map(s=>({topic:l.id,question:l.question,stage:s.id,title:s.title,chars:s.lead.length,image:s.image})));
assert.equal(D11_LESSONS.length,12);assert.equal(expected.length,38);
fs.writeFileSync(out+'01-spec-review.json',JSON.stringify({time:new Date().toISOString(),verdict:'PASS',counts:{C:0,I:0,M:0},scope:'collector import1/typed tuple1; existing generic collector semantics preserved',questionCount:12,typedCount:38},null,2)+'\n');
const baselineBytes=fs.readFileSync(names.at(-1)),currentBytes=fs.readFileSync('docs/design/visual-inventory.jsonl');
assert.equal(sha(baselineBytes),'b9d914f26d5dd3260e9ab9fec3f67c5ba658b2534e35f3e1bfe7727922b49c87');
const parse=b=>b.toString('utf8').trimEnd().split('\n').map(JSON.parse);
const baseline=parse(baselineBytes),current=parse(currentBytes),old=new Map(baseline.map(r=>[r.id,r])),now=new Map(current.map(r=>[r.id,r]));
assert.equal(old.size,baseline.length);assert.equal(now.size,current.length);
assert.equal(baseline.length,47212);assert.equal(current.length,47254);
const lifecycleChanges=[],metadata=[];
for(const row of baseline){
 const n=now.get(row.id);assert.ok(n,'existing ID retained '+row.id);
 for(const k of ['status','evidence','updatedDate'])if(row[k]!==n[k])lifecycleChanges.push({id:row.id,key:k,before:row[k],after:n[k]});
 const keys=[...new Set([...Object.keys(row),...Object.keys(n)])].filter(k=>JSON.stringify(row[k])!==JSON.stringify(n[k]));
 if(keys.length)metadata.push({id:row.id,keys,before:row,after:n});
}
assert.deepEqual(lifecycleChanges,[]);assert.equal(metadata.length,2);
for(const m of metadata){assert.deepEqual(m.keys,['displayCondition']);assert.equal(m.after.kind,'reader_mode_button');assert.equal(m.after.page,'docs/knowledge/D11-web-security-basics.md');assert.equal(m.before.displayCondition,'실제 장면이 있는 문서에서만 표시');assert.equal(m.after.displayCondition,'실제 장면이 있는 문서');}
const html=fs.readFileSync('docs/knowledge/D11-web-security-basics.html','utf8');
const controls=html.match(/<div\b([^>]*\bclass="kr-controls"[^>]*)>/)?.[1];assert.ok(controls);assert.doesNotMatch(controls,/\bhidden(?:\s|=|$)/);assert.match(html,/data-d11-learning/);
const added=current.filter(r=>!old.has(r.id));assert.equal(added.length,42);assert.ok(added.every(r=>r.page==='docs/knowledge/D11-web-security-basics.md'));
const typed=added.filter(r=>r.kind==='d11_learning_state'),untyped=added.filter(r=>r.kind!=='d11_learning_state');assert.equal(typed.length,38);assert.equal(untyped.length,4);
assert.deepEqual(untyped.map(r=>r.kind).sort(),['toggle:d11-legacy','toggle:d11-original','toggle:d11-scope','toggle:d11-source-details']);assert.ok(untyped.every(r=>r.status==='unreviewed'&&r.evidence===''&&r.updatedDate===''));
const clean=s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/&[a-z]+;|&#\d+;/gi,' ').replace(/[`*_#|[\]()]/g,' ').replace(/\s+/g,' ').trim();
const selected=JSON.parse(fs.readFileSync(base+'/selected-images.json','utf8'));
assert.deepEqual(typed.map(r=>r.stageId).sort(),expected.map(r=>r.stage).sort());
for(const e of expected){
 const row=typed.find(r=>r.stageId===e.stage);assert.equal(row.topicId,e.topic);assert.equal(row.imageId,e.image);assert.equal(row.section,clean(e.question));assert.equal(row.label,clean(e.title).slice(0,160));assert.equal(row.chars,e.chars);
 const digest=sha(`${row.page}\0d11_learning_state\0${e.question}\0${clean(e.title)}`).slice(0,12);assert.equal(row.id,`${row.page}::d11_learning_state::${digest}:1`);
 assert.equal(row.status,'implemented');assert.equal(row.updatedDate,new Date().toISOString().slice(0,10));assert.equal(row.evidence,base+'/MAIN-REPORT.md · D11 implementation and main PC 38-state acceptance');
 assert.ok(selected.some(s=>s.id===e.image&&s.destination.endsWith('/'+D11_ASSETS[e.image].file)));assert.ok(fs.existsSync(base+'/MAIN-REPORT.md'));
}
const log=fs.readFileSync(base+'/ui-luna-logs/inventory-mark.log','utf8');
const calls=[...log.matchAll(/^CALL \d+ node inventory-visual-work\.mjs --mark (\S+) (\S+) /gm)].map(m=>({id:m[1],status:m[2]}));assert.equal(calls.length,76);
for(const row of typed)assert.deepEqual(calls.filter(c=>c.id===row.id).map(c=>c.status),['mockup_ready','implemented']);assert.ok(calls.every(c=>typed.some(r=>r.id===c.id)));
const byStatus=rows=>Object.fromEntries(['unreviewed','mockup_ready','implemented','verified'].map(s=>[s,rows.filter(r=>r.status===s).length]));
const oldStatus=byStatus(baseline),newStatus=byStatus(current);assert.equal(newStatus.verified,oldStatus.verified);assert.equal(newStatus.implemented,oldStatus.implemented+38);assert.equal(newStatus.unreviewed,oldStatus.unreviewed+4);
const summary=JSON.parse(fs.readFileSync('docs/design/visual-inventory-summary.json','utf8'));assert.equal(summary.units,current.length);assert.deepEqual(summary.byStatus,newStatus);assert.equal(summary.pages.find(p=>p.source==='docs/knowledge/D11-web-security-basics.md').status,'in_progress');
const after=Object.fromEntries(names.map(p=>[p,sha(fs.readFileSync(p))]));assert.deepEqual(after,before);
const result={time:new Date().toISOString(),specVerdict:'PASS',qualityVerdict:'PASS',counts:{C:0,I:0,M:0},collectorDiff:'exactly import1 + tuple1 versus Git HEAD',baselineSHA:sha(baselineBytes),baselineRows:baseline.length,currentRows:current.length,existingLifecycleChanges:lifecycleChanges.length,existingMetadataChanges:metadata,newTyped:typed.length,topics:D11_LESSONS.map(l=>({id:l.id,states:l.stages.length})),typedMapping:typed.map(r=>({id:r.id,topicId:r.topicId,stageId:r.stageId,imageId:r.imageId,status:r.status})),newUntyped:untyped,oldStatus,newStatus,markCalls:calls.length,verifiedPromotions:0,summaryD11Status:'in_progress',sourceSHA:after['docs/knowledge/D11-web-security-basics.md'],inputsAfter:after,inputChanges:[]};
fs.writeFileSync(out+'02-quality-review.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({spec:'PASS',quality:'PASS',counts:result.counts,baselineRows:baseline.length,currentRows:current.length,newTyped:typed.length,newUntyped:untyped.length,oldLifecycleChanges:0,metadataChanges:2,markCalls:76,verifiedPromotions:0}));
