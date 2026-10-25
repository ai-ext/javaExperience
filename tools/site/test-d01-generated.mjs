import {rasterDimensions} from './raster-size.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';import crypto from 'node:crypto';import {JSDOM} from 'jsdom';
import {D01_ASSETS,D01_LESSONS,D01_RUNS,d01Run} from './d01-lesson-data.mjs';
const root=new URL('../../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8'),base=JSON.parse(read('docs/design/d01-2026-10-20/html-baseline.json'));
assert.equal(crypto.createHash('sha256').update(read('docs/knowledge/D01-dev-lifecycle-overview.md')).digest('hex'),base.sourceSHA256);
const page=new JSDOM(read('docs/knowledge/D01-dev-lifecycle-overview.html'),{runScripts:'outside-only',url:'https://learn.example/docs/knowledge/D01-dev-lifecycle-overview.html'}),d=page.window.document;
const source=d.querySelector('#d01-original'),clone=source.cloneNode(true);clone.querySelector(':scope>summary').remove();clone.querySelectorAll('script').forEach(n=>n.remove());
assert.equal((d.querySelector('main>h1, h1.kr-source-title').textContent+' '+clone.textContent).replace(/\s+/g,' ').trim(),base.wholeSourceText);assert.deepEqual([...source.querySelectorAll('pre code')].map(n=>n.textContent),base.code);assert.deepEqual([...source.querySelectorAll('.mermaid')].map(n=>n.textContent),base.mermaid);clone.querySelectorAll('.mermaid').forEach(n=>n.remove());assert.equal((d.querySelector('main>h1, h1.kr-source-title').textContent+' '+clone.textContent).replace(/\s+/g,' ').trim(),base.withoutMermaidText);
for(const id of base.ids)assert.ok(d.getElementById(id));assert.deepEqual([...d.querySelectorAll('.d01-legacy>.knowledge-page-map')].map(n=>n.outerHTML),base.oldVisual);const ids=[...d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(ids.length,new Set(ids).size);
const selected=JSON.parse(read('docs/design/d01-2026-10-20/image-records.json')).images.filter(image=>image.selected);assert.equal(selected.length,10);
for(const asset of Object.values(D01_ASSETS)){
 assert.equal(asset.ready,true);const raw=fs.readFileSync(new URL('docs/design/d01-2026-10-20/images/'+asset.file,root));assert.equal(asset.width,rasterDimensions(raw).width);assert.equal(asset.height,rasterDimensions(raw).height);assert.ok(selected.some(image=>image.destination.endsWith('/'+asset.file)&&image.sha256===crypto.createHash('sha256').update(raw).digest('hex')));
 for(const region of Object.values(asset.focus))assert.ok(region.every(n=>n>=0)&&region[0]+region[2]<=100&&region[1]+region[3]<=100);
}
assert.ok(d.querySelector('script[src*="d01-learning.bundle.js"]'));page.window.eval(read('tools/site/d01-learning.bundle.js'));const ui=d.querySelector('[data-d01-learning]');
for(const lesson of D01_LESSONS){const topic=ui.querySelector('[data-d01-topic]');topic.value=lesson.id;topic.dispatchEvent(new page.window.Event('change'));for(const stage of lesson.stages){ui.querySelector(`[data-d01-stage="${stage.id}"]`).click();assert.equal(ui.querySelector('[data-d01-code]').textContent,stage.code);assert.equal(ui.querySelector('[data-d01-title]').textContent,stage.title);assert.equal(ui.querySelector('[data-d01-output]').open,false);for(const key of stage.runKeys)assert.ok(ui.querySelector('[data-d01-runs]').textContent.includes(JSON.stringify(d01Run(key),null,2)));}}
const actual=JSON.parse(read('docs/design/d01-2026-10-20/source-proof/execution.json'));
assert.deepEqual(D01_RUNS,actual);assert.equal(actual.checks.length,11);assert.equal(Object.keys(actual.models).length,3);
assert.deepEqual(actual,JSON.parse(read('docs/design/d01-2026-10-20/source-proof/checkpoints/expected-execution.json')));
assert.deepEqual([...new Set(D01_LESSONS.flatMap(l=>l.stages.flatMap(s=>s.checks)))].sort(),actual.checks);
const supplement=d.querySelector('.d01-supplement');assert.ok(supplement);
for(const phrase of ['Java21','Gradle9.8.0','CLI','0755']){assert.ok(supplement.textContent.includes(phrase),phrase);}
for(const file of ['source-proof/source.json','source-proof/execution.json','source-proof/independent-replay.json','research/main-verification.json'])assert.ok([...supplement.querySelectorAll('pre code')].some(n=>{try{return JSON.stringify(JSON.parse(n.textContent))===JSON.stringify(JSON.parse(read('docs/design/d01-2026-10-20/'+file)));}catch{return false;}}),file);
assert.equal(D01_LESSONS.length,10);assert.equal(D01_LESSONS.flatMap(l=>l.stages).length,25);page.window.close();console.log(`D01 생성HTML: 원문${base.wholeSourceText.length}자/code${base.code.length}/Mermaid${base.mermaid.length}/id${base.ids.length}/map1·25상태·10JPG·11관측/3모델 보존 통과`);
