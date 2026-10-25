import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=process.cwd(),base=root+'/docs/design/d12-2026-10-25/',out=base+'ui-sol-logs/polish-addendum/';
const oldRoot='/Users/ds/research/javaexperience-d12-linux-terminal-20261025/_data/ui-sol-candidate3-source';
const before=await import(oldRoot+'/tools/site/d12-lesson-data.mjs');
const after=await import(root+'/tools/site/d12-lesson-data.mjs');
const oldStages=before.D12_LESSONS.flatMap(x=>x.stages),stages=after.D12_LESSONS.flatMap(x=>x.stages);
assert.equal(stages.length,45);assert.deepEqual(stages.map(x=>x.id),oldStages.map(x=>x.id));
const targets=['known-path-search','directory-no-list','container-exec','memory-available'];let untouched=0;
for(let i=0;i<stages.length;i++){const a=structuredClone(oldStages[i]),b=structuredClone(stages[i]);if(b.id==='memory-available'){for(const key of ['code','note','evidence']){assert.doesNotMatch(b[key],/SPEC/);assert.notEqual(a[key],b[key]);delete a[key];delete b[key];}assert.match(stages[i].code,/원문 설명:.*\n보강 설명:/s);assert.match(stages[i].code,/회수 가능한 cache.*추정값/s);assert.match(stages[i].code,/실행하지 않았고 숫자 관측값도 없습니다/);}assert.deepEqual(b,a,stages[i].id+' unchanged except allowed memory attribution wording');if(!targets.includes(stages[i].id))untouched++;}
assert.equal(untouched,41);
const rects={'known-path-search':[44,47,27,11],'directory-no-list':[44,58,27,10],'container-exec':[39,43,25,20]};
const oldAssets=structuredClone(before.D12_ASSETS),assets=structuredClone(after.D12_ASSETS);let unchangedFocus=0;
for(const [id,asset]of Object.entries(assets)){for(const [state,rect]of Object.entries(asset.focus)){if(rects[state]){assert.deepEqual(rect,rects[state]);delete asset.focus[state];delete oldAssets[id].focus[state];}else{assert.deepEqual(rect,oldAssets[id].focus[state]);unchangedFocus++;}}}
assert.equal(unchangedFocus,42);assert.deepEqual(assets,oldAssets,'all images and other asset fields unchanged');
const start=JSON.parse(fs.readFileSync(base+'ui-sol-logs/attempt3/00-input-start.json'));const changes={};
for(const [path,sha]of Object.entries(start.files)){const current=createHash('sha256').update(fs.readFileSync(root+'/'+path)).digest('hex');if(current!==sha)changes[path]={before:sha,after:current};}
const allowed=['docs/design/d12-2026-10-25/FOCUS-DESIGN.json','docs/design/d12-2026-10-25/UI-IMPLEMENTATION.md','docs/knowledge/D12-linux-terminal-basics.html','tools/site/d12-lesson-data.mjs','tools/site/test-d12-learning.mjs'];assert.ok(Object.keys(changes).every(x=>allowed.includes(x)),JSON.stringify(changes));
for(const path of ['tools/site/d12-learning.js','tools/site/d12-learning.css','tools/site/d12-learning.mjs','tools/site/d12-learning.bundle.js','tools/site/build.mjs','tools/site/inventory-visual-work.mjs','docs/design/concept-cycle-2026-10-22/tasks.json'])assert.equal(createHash('sha256').update(fs.readFileSync(root+'/'+path)).digest('hex'),start.files[path]);
const result={specVerdict:'PASS',counts:{C:0,I:0,M:0},states:45,unchangedStatesOutsideFourTargets:untouched,allNonMemoryStageObjectsEqual:true,memoryChangedFields:['code','note','evidence'],memoryCodeKind:'original-prose',memorySourceFragmentsUnchanged:true,focusChanged:rects,otherFocusUnchanged:unchangedFocus,assetsOtherFieldsUnchanged:true,controllerCssRenderBundleBuildCollectorRegistryUnchanged:true,sourceInputsChecked:Object.keys(start.files).length,changes,actualPC:'main separate gate; reviewer did not inspect actual crop images'};fs.writeFileSync(out+'01-bounded-spec.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
