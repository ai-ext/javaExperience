import {rasterDimensions} from './raster-size.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {JSDOM} from 'jsdom';
import {W15_ASSETS,W15_LESSONS,W15_RUNS,w15Run} from './w15-lesson-data.mjs';
const root=new URL('../../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');
const base=JSON.parse(read('docs/design/w15-2026-10-20/html-baseline.json'));
assert.equal(crypto.createHash('sha256').update(read('docs/knowledge/W15-paging-offset-vs-cursor.md')).digest('hex'),base.sourceSHA256);
const page=new JSDOM(read('docs/knowledge/W15-paging-offset-vs-cursor.html'),{runScripts:'outside-only',url:'https://learn.example/docs/knowledge/W15-paging-offset-vs-cursor.html'}),d=page.window.document;
const source=d.querySelector('#w15-original'),clone=source.cloneNode(true);
clone.querySelector(':scope>summary').remove();clone.querySelectorAll('script').forEach(n=>n.remove());
assert.equal((d.querySelector('main>h1, h1.kr-source-title').textContent+' '+clone.textContent).replace(/\s+/g,' ').trim(),base.wholeSourceText);
assert.deepEqual([...source.querySelectorAll('pre code')].map(n=>n.textContent),base.code);
for(const id of base.ids)assert.ok(d.getElementById(id));
assert.deepEqual([...d.querySelectorAll('.w15-legacy>.knowledge-page-map')].map(n=>n.outerHTML),base.oldVisual);
const ids=[...d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(ids.length,new Set(ids).size);
for(const asset of Object.values(W15_ASSETS)){
 assert.equal(asset.ready,true);const raw=fs.readFileSync(new URL('docs/design/w15-2026-10-20/images/'+asset.file,root));
 assert.equal(asset.width,rasterDimensions(raw).width);assert.equal(asset.height,rasterDimensions(raw).height);
 for(const region of Object.values(asset.focus))assert.ok(region.every(n=>n>=0)&&region[0]+region[2]<=100&&region[1]+region[3]<=100);
}
assert.ok(d.querySelector('script[src*="w15-learning.bundle.js"]'));
page.window.eval(read('tools/site/w15-learning.bundle.js'));
const ui=d.querySelector('[data-w15-learning]');
for(const lesson of W15_LESSONS){
 const topic=ui.querySelector('[data-w15-topic]');topic.value=lesson.id;topic.dispatchEvent(new page.window.Event('change'));
 for(const stage of lesson.stages){
  ui.querySelector(`[data-w15-stage="${stage.id}"]`).click();
  assert.equal(ui.querySelector('[data-w15-code]').textContent,stage.code);
  assert.equal(ui.querySelector('[data-w15-title]').textContent,stage.title);
  assert.equal(ui.querySelector('[data-w15-output]').open,false);
  for(const key of stage.runKeys)assert.ok(ui.querySelector('[data-w15-runs]').textContent.includes(JSON.stringify(w15Run(key),null,2)));
 }
}
const actual=JSON.parse(read('docs/design/w15-2026-10-20/source-proof/execution.json'));
assert.equal(actual.checks.length,18);assert.equal(actual.java.checks.length,25);const {trace,...uiActual}=actual;assert.deepEqual(W15_RUNS,uiActual);
const passes=['replay.log','java-run.log'].flatMap(file=>[...read('docs/design/w15-2026-10-20/source-proof/'+file).matchAll(/^PASS (.+)$/gm)].map(m=>m[1]));assert.equal(passes.length,43);assert.equal(new Set(passes).size,43);
assert.deepEqual([...new Set(W15_LESSONS.flatMap(l=>l.stages.flatMap(s=>s.checks)))].sort(),[...new Set(passes)].sort());
for(const name of ['sourceFirst','sourceDeepOffset','sourceLiteralCursor','extraAlignedSeek']){
 const raw=read('docs/design/w15-2026-10-20/source-proof/plans/'+name+'-explain-analyze.txt');
 assert.ok([...d.querySelectorAll('.w15-supplement pre code')].some(node=>node.textContent===raw),'actual raw plan exact '+name);
 const canonical=actual.plans[name].actualOperatorsRowsLoops;
 assert.equal(canonical.includes('actual time='),false);
 assert.match(raw,/actual time=/);assert.match(canonical,/actual rows=/);
}
assert.equal(actual.trace.some(event=>event.sql.startsWith('EXPLAIN ANALYZE ')),false);
assert.deepEqual(actual.extra.alignedPage.rows,actual.source.sql[1].rows);
assert.notDeepEqual(actual.source.sql[1].rows,actual.source.sql[2].rows.slice(0,50));
const supplement=d.querySelector('.w15-supplement');assert.ok(supplement);assert.match(supplement.textContent,/물리/);assert.match(supplement.textContent,/consume 본문은 주석뿐/);
const displayed=[...supplement.querySelectorAll('pre code')].flatMap(n=>{try{return [JSON.parse(n.textContent)];}catch{return [];}});
assert.deepEqual(displayed,['source-proof/source.json','source-proof/execution.json','research/main-verification.json'].map(file=>JSON.parse(read('docs/design/w15-2026-10-20/'+file))));
assert.equal(W15_LESSONS.length,9);assert.equal(W15_LESSONS.flatMap(l=>l.stages).length,25);
page.window.close();console.log(`W15 생성 HTML: 원문${base.wholeSourceText.length}자/code${base.code.length}/id${base.ids.length}·기존map·bundle25상태·9JPG·native18/Java25PASS 보존 통과`);
