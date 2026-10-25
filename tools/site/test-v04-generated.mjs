import { loadSourceBaseline } from './learning-source-baseline.mjs';
import {rasterDimensions} from './raster-size.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {JSDOM} from 'jsdom';
import {V04_ASSETS,V04_LESSONS,V04_RUNS,v04Run} from './v04-lesson-data.mjs';
const root=new URL('../../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8'),base=loadSourceBaseline(root, 'docs/design/v04-2026-10-20/html-baseline.json');
assert.equal(crypto.createHash('sha256').update(read('docs/knowledge/V04-test-db-strategy.md')).digest('hex'),base.sourceSHA256);
const page=new JSDOM(read('docs/knowledge/V04-test-db-strategy.html'),{runScripts:'outside-only',url:'https://learn.example/docs/knowledge/V04-test-db-strategy.html'}),d=page.window.document;
const source=d.querySelector('#v04-original'),clone=source.cloneNode(true);clone.querySelector(':scope>summary').remove();clone.querySelectorAll('script').forEach(n=>n.remove());
assert.equal((d.querySelector('main>h1, h1.kr-source-title').textContent+' '+clone.textContent).replace(/\s+/g,' ').trim(),base.wholeSourceText);assert.deepEqual([...source.querySelectorAll('pre code')].map(n=>n.textContent),base.code);
for(const id of base.ids)assert.ok(d.getElementById(id));assert.deepEqual([...d.querySelectorAll('.v04-legacy>.knowledge-page-map')].map(n=>n.outerHTML),base.oldVisual);
const ids=[...d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(ids.length,new Set(ids).size);
const selected=JSON.parse(read('docs/design/v04-2026-10-20/image-records.json')).images.filter(image=>image.selected);
assert.equal(selected.length,10);
for(const asset of Object.values(V04_ASSETS)){
 assert.equal(asset.ready,true);const raw=fs.readFileSync(new URL('docs/design/v04-2026-10-20/images/'+asset.file,root));assert.equal(asset.width,rasterDimensions(raw).width);assert.equal(asset.height,rasterDimensions(raw).height);assert.ok(selected.some(image=>image.destination.endsWith('/'+asset.file)&&image.sha256===crypto.createHash('sha256').update(raw).digest('hex')));
 for(const region of Object.values(asset.focus))assert.ok(region.every(n=>n>=0)&&region[0]+region[2]<=100&&region[1]+region[3]<=100);
}
assert.ok(d.querySelector('script[src*="v04-learning.bundle.js"]'));page.window.eval(read('tools/site/v04-learning.bundle.js'));const ui=d.querySelector('[data-v04-learning]');
for(const lesson of V04_LESSONS){const topic=ui.querySelector('[data-v04-topic]');topic.value=lesson.id;topic.dispatchEvent(new page.window.Event('change'));for(const stage of lesson.stages){ui.querySelector(`[data-v04-stage="${stage.id}"]`).click();assert.equal(ui.querySelector('[data-v04-code]').textContent,stage.code);assert.equal(ui.querySelector('[data-v04-title]').textContent,stage.title);assert.equal(ui.querySelector('[data-v04-output]').open,false);for(const key of stage.runKeys)assert.ok(ui.querySelector('[data-v04-runs]').textContent.includes(JSON.stringify(v04Run(key),null,2)));}}
const actual=JSON.parse(read('docs/design/v04-2026-10-20/source-proof/execution.json'));assert.equal(actual.checks.length,9);assert.equal(actual.java.checks.length,28);assert.equal(actual.junit.length,22);assert.equal(Object.keys(actual.java.facts).length,32);const{trace,...uiActual}=actual;assert.deepEqual(V04_RUNS,uiActual);
const passes=['replay.log','java-run.log'].flatMap(file=>[...read('docs/design/v04-2026-10-20/source-proof/'+file).matchAll(/^\s*PASS ([^\r\n]+)$/gm)].map(m=>m[1]));assert.equal(passes.length,37);assert.equal(new Set(passes).size,37);assert.deepEqual([...new Set(V04_LESSONS.flatMap(l=>l.stages.flatMap(s=>s.checks)))].sort(),[...new Set(passes)].sort());
assert.ok(actual.junit.every(c=>c.passed&&!c.skipped));assert.ok(!actual.junit.some(c=>c.class==='com.example.practice.product.ProductRepositoryTest'));assert.equal(actual.junit.filter(c=>c.class==='com.example.practice.product.ProductServiceUnitTest').length,2);
assert.deepEqual(actual.java.facts['toy-end-commit-fires-once-and-observes-committed-row'].calls,[{id:72,independentConnectionRows:1}]);assert.deepEqual(actual.java.facts['observer-mutable-source'],{values:[{id:1}]});
const tcp=actual.java.facts['http-tcp-uses-other-thread-and-transaction'],mock=actual.java.facts['http-sync-mockmvc-joins-test-thread-tx'];assert.equal(tcp.serverThreadDifferent,true);assert.equal(tcp.serverTestManagedTxActive,false);assert.equal(tcp.serverApplicationTxActive,true);assert.equal(mock.sameThread,true);assert.equal(mock.testManagedTxActive,true);
const supplement=d.querySelector('.v04-supplement');assert.ok(supplement);for(const phrase of ['원문 OrderHttpTest','합집합','MySQL HTTP','syncMockMvc','wire캡처'])assert.ok(supplement.textContent.includes(phrase),phrase);
const currentScope=JSON.parse(read('docs/design/concept-cycle-2026-10-24/minor-repairs/current-v04-scope.json'));
assert.equal(currentScope.finalCounts.native,9);assert.equal(currentScope.finalCounts.java,28);assert.equal(currentScope.finalCounts.junit,22);assert.equal(currentScope.finalCounts.facts,32);
assert.match(currentScope.historicalPreparation.runtimeScope,/preparing/);assert.ok(currentScope.notExecuted.includes('Java 25 원문 환경'));
assert.match(supplement.textContent,/source\.json의 runtimeScope는 이전 준비 시점의 메모/);
const jsonFiles=['source-proof/source.json','source-proof/execution.json','source-proof/check-id-manifest.json','source-proof/independent-review.json','research/main-verification.json','source-proof/raw-final-runtime/http-listener.json','source-proof/raw-final-runtime/http-stop-check.json','source-proof/raw-final-runtime/actual-http-response.json','source-proof/raw-final-runtime/mockmvc-response.json'];const displayed=[...supplement.querySelectorAll('pre code')].flatMap(n=>{try{return[JSON.parse(n.textContent)];}catch{return[];}});assert.deepEqual(displayed,[currentScope,...jsonFiles.map(file=>JSON.parse(read('docs/design/v04-2026-10-20/'+file)))]);
assert.equal(V04_LESSONS.length,10);assert.equal(V04_LESSONS.flatMap(l=>l.stages).length,27);page.window.close();console.log(`V04 생성HTML: 원문${base.wholeSourceText.length}자/code${base.code.length}/id${base.ids.length}/map1·bundle27상태·10JPG·native9/Java28/JUnit22·관찰시점·실제TCP/MockMvc 범위 보존 통과`);
