import { loadSourceBaseline } from './learning-source-baseline.mjs';
import {rasterDimensions} from './raster-size.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {JSDOM} from 'jsdom';
import {R04_ASSETS,R04_LESSONS,R04_RUNS,r04Run} from './r04-lesson-data.mjs';
const root=new URL('../../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');
const base=loadSourceBaseline(root, 'docs/design/r04-2026-10-20/html-baseline.json');
assert.equal(crypto.createHash('sha256').update(read('docs/knowledge/R04-sql-crud-join.md')).digest('hex'),base.sourceSHA256);
const page=new JSDOM(read('docs/knowledge/R04-sql-crud-join.html'),{runScripts:'outside-only',url:'https://learn.example/docs/knowledge/R04-sql-crud-join.html'}),d=page.window.document;
const source=d.querySelector('#r04-original'),clone=source.cloneNode(true);
clone.querySelector(':scope>summary').remove();clone.querySelectorAll('script').forEach(n=>n.remove());
assert.equal((d.querySelector('main>h1, h1.kr-source-title').textContent+' '+clone.textContent).replace(/\s+/g,' ').trim(),base.wholeSourceText);
assert.deepEqual([...source.querySelectorAll('pre code')].map(n=>n.textContent),base.code);
for(const id of base.ids)assert.ok(d.getElementById(id));
assert.deepEqual([...d.querySelectorAll('.r04-legacy>.knowledge-page-map')].map(n=>n.outerHTML),base.oldVisual);
const ids=[...d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(ids.length,new Set(ids).size);
for(const asset of Object.values(R04_ASSETS)){
 assert.equal(asset.ready,true);const raw=fs.readFileSync(new URL('docs/design/r04-2026-10-20/images/'+asset.file,root));
 assert.equal(asset.width,rasterDimensions(raw).width);assert.equal(asset.height,rasterDimensions(raw).height);
 for(const region of Object.values(asset.focus))assert.ok(region.every(n=>n>=0)&&region[0]+region[2]<=100&&region[1]+region[3]<=100);
}
assert.ok(d.querySelector('script[src*="r04-learning.bundle.js"]'));
page.window.eval(read('tools/site/r04-learning.bundle.js'));
const ui=d.querySelector('[data-r04-learning]');
for(const lesson of R04_LESSONS){
 const topic=ui.querySelector('[data-r04-topic]');topic.value=lesson.id;topic.dispatchEvent(new page.window.Event('change'));
 for(const stage of lesson.stages){
  ui.querySelector(`[data-r04-stage="${stage.id}"]`).click();
  assert.equal(ui.querySelector('[data-r04-code]').textContent,stage.code);
  assert.equal(ui.querySelector('[data-r04-title]').textContent,stage.title);
  assert.equal(ui.querySelector('[data-r04-output]').open,false);
  for(const key of stage.runKeys)assert.ok(ui.querySelector('[data-r04-runs]').textContent.includes(JSON.stringify(r04Run(key),null,2)));
 }
}
const actual=JSON.parse(read('docs/design/r04-2026-10-20/source-proof/execution.json'));
assert.equal(actual.checks.length,41);assert.equal(actual.jdbc.checks.length,8);const {trace,...uiActual}=actual;assert.deepEqual(R04_RUNS,uiActual);
const passes=['replay.log','jdbc-run.log'].flatMap(file=>[...read('docs/design/r04-2026-10-20/source-proof/'+file).matchAll(/^PASS (.+)$/gm)].map(m=>m[1]));assert.equal(passes.length,49);assert.equal(new Set(passes).size,49);
assert.deepEqual([...new Set(R04_LESSONS.flatMap(l=>l.stages.flatMap(s=>s.checks)))].sort(),[...new Set(passes)].sort());
const supplement=d.querySelector('.r04-supplement');assert.ok(supplement);assert.match(supplement.textContent,/물리/);assert.match(supplement.textContent,/원문 Kotlin build/);
const displayed=[...supplement.querySelectorAll('pre code')].flatMap(n=>{try{return [JSON.parse(n.textContent)];}catch{return [];}});
assert.deepEqual(displayed,['source-proof/source.json','source-proof/execution.json','research/main-verification.json'].map(file=>JSON.parse(read('docs/design/r04-2026-10-20/'+file))));
assert.equal(R04_LESSONS.length,10);assert.equal(R04_LESSONS.flatMap(l=>l.stages).length,34);
page.window.close();console.log(`R04 생성 HTML: 원문${base.wholeSourceText.length}자/code${base.code.length}/id${base.ids.length}·기존map·bundle34상태·10JPG·native41/JDBC8PASS 보존 통과`);
