import { loadSourceBaseline, resolveHistoricalAsset } from './learning-source-baseline.mjs';
import {rasterDimensions} from './raster-size.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {JSDOM} from 'jsdom';
import {R03_ASSETS,R03_LESSONS,R03_RUNS,r03Run} from './r03-lesson-data.mjs';
const root=new URL('../../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');
const base=loadSourceBaseline(root, 'docs/design/r03-2026-10-20/html-baseline.json');
assert.equal(crypto.createHash('sha256').update(read('docs/knowledge/R03-schema-types-constraints.md')).digest('hex'),base.sourceSHA256);
const page=new JSDOM(read('docs/knowledge/R03-schema-types-constraints.html'),{runScripts:'outside-only',url:'https://learn.example/docs/knowledge/R03-schema-types-constraints.html'}),d=page.window.document;
const source=d.querySelector('#r03-original'),clone=source.cloneNode(true);
clone.querySelector(':scope>summary').remove();clone.querySelectorAll('script').forEach(n=>n.remove());
const correctedSourceText=base.wholeSourceText;
const approvedTextCorrections=[
 ['signed -128127, unsigned 0255','signed -128~127, unsigned 0~255'],
 ['signed -2⁶³2⁶³-1 / unsigned 02⁶⁴-1','signed -2⁶³~2⁶³-1 / unsigned 0~2⁶⁴-1'],
];
let expectedSourceText=correctedSourceText;
for(const[from,to]of approvedTextCorrections){
 assert.equal(expectedSourceText.split(from).length-1,1,`기존 baseline 보정 대상 1회: ${from}`);
 expectedSourceText=expectedSourceText.replace(from,to);
}
assert.equal((d.querySelector('main>h1, h1.kr-source-title').textContent+' '+clone.textContent).replace(/\s+/g,' ').trim(),expectedSourceText);
const tinyintRange=[...d.querySelectorAll('table tr')].find(row=>row.cells[0]?.textContent==='TINYINT')?.cells[1];
const bigintRange=[...d.querySelectorAll('table tr')].find(row=>row.cells[0]?.textContent==='BIGINT')?.cells[1];
assert.equal(tinyintRange?.textContent,'1바이트. signed -128~127, unsigned 0~255');
assert.equal(bigintRange?.textContent,'8바이트. signed -2⁶³~2⁶³-1 / unsigned 0~2⁶⁴-1');
assert.doesNotMatch(tinyintRange?.innerHTML||'',/<del\b/);
assert.doesNotMatch(bigintRange?.innerHTML||'',/<del\b/);
assert.deepEqual([...source.querySelectorAll('pre code')].map(n=>n.textContent),base.code);
for(const id of base.ids)assert.ok(d.getElementById(id));
assert.deepEqual([...d.querySelectorAll('.r03-legacy>.knowledge-page-map')].map(n=>n.outerHTML),base.oldVisual);
const ids=[...d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(ids.length,new Set(ids).size);
for(const asset of Object.values(R03_ASSETS)){
 assert.equal(asset.ready,true);const raw=fs.readFileSync(new URL('docs/design/r03-2026-10-20/images/'+asset.file,root));
 assert.equal(asset.width,rasterDimensions(raw).width);assert.equal(asset.height,rasterDimensions(raw).height);
 for(const region of Object.values(asset.focus))assert.ok(region.every(n=>n>=0)&&region[0]+region[2]<=100&&region[1]+region[3]<=100);
}
const correctionManifest=JSON.parse(read('docs/design/concept-cycle-2026-10-22/repairs/priority/correction-manifest.json'));
const foreignCorrection=correctionManifest.imageCorrections.find(item=>item.finding==='task10.fix2');
const activeForeign=R03_ASSETS[foreignCorrection.assetKey];
const activeForeignUrl=new URL('docs/design/r03-2026-10-20/images/'+activeForeign.file,root);
assert.equal(activeForeignUrl.pathname,resolveHistoricalAsset(root, foreignCorrection.targetJPEG),'활성 R03 asset이 승인 target JPEG를 가리켜야 한다');
const foreignBytes=fs.readFileSync(activeForeignUrl);
assert.equal(foreignCorrection.conversion.targetSHA256,crypto.createHash('sha256').update(foreignBytes).digest('hex'));
assert.deepEqual(foreignCorrection.conversion.targetDimensions,{width:1672,height:941});
assert.ok(fs.existsSync(new URL('docs/design/r03-2026-10-20/images/R03-foreign-v3.jpg',root)),'이전 FK asset 보존');
assert.ok(d.querySelector('script[src*="r03-learning.bundle.js"]'));
page.window.eval(read('tools/site/r03-learning.bundle.js'));
const ui=d.querySelector('[data-r03-learning]');
for(const lesson of R03_LESSONS){
 const topic=ui.querySelector('[data-r03-topic]');topic.value=lesson.id;topic.dispatchEvent(new page.window.Event('change'));
 for(const stage of lesson.stages){
  ui.querySelector(`[data-r03-stage="${stage.id}"]`).click();
  assert.equal(ui.querySelector('[data-r03-code]').textContent,stage.code);
  assert.equal(ui.querySelector('[data-r03-title]').textContent,stage.title);
  assert.equal(ui.querySelector('[data-r03-output]').open,false);
  for(const key of stage.runKeys)assert.ok(ui.querySelector('[data-r03-runs]').textContent.includes(JSON.stringify(r03Run(key),null,2)));
 }
}
const actual=JSON.parse(read('docs/design/r03-2026-10-20/source-proof/execution.json'));
assert.equal(actual.checks.length,35);const {trace,...uiActual}=actual;assert.deepEqual(R03_RUNS,uiActual);
const passes=[...read('docs/design/r03-2026-10-20/source-proof/replay-final.log').matchAll(/^PASS (.+)$/gm)].map(m=>m[1]);assert.equal(passes.length,35);
assert.deepEqual([...new Set(R03_LESSONS.flatMap(l=>l.stages.flatMap(s=>s.checks)))].sort(),[...new Set(passes)].sort());
const supplement=d.querySelector('.r03-supplement');assert.ok(supplement);assert.match(supplement.textContent,/물리/);assert.match(supplement.textContent,/원문 bash/);
const displayed=[...supplement.querySelectorAll('pre code')].flatMap(n=>{try{return [JSON.parse(n.textContent)];}catch{return [];}});
assert.deepEqual(displayed,['source-proof/source.json','source-proof/execution.json','research/main-verification.json'].map(file=>JSON.parse(read('docs/design/r03-2026-10-20/'+file))));
assert.equal(R03_LESSONS.length,9);assert.equal(R03_LESSONS.flatMap(l=>l.stages).length,30);
page.window.close();console.log(`R03 생성 HTML: 원문${base.wholeSourceText.length}자/code${base.code.length}/id${base.ids.length}·기존map·bundle30상태·9JPG·native35PASS 보존 통과`);
