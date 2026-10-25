import path from 'node:path';
import {rasterDimensions} from './raster-size.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {JSDOM} from 'jsdom';
import {W11_ASSETS,W11_LESSONS,W11_RUNS,w11Run} from './w11-lesson-data.mjs';
const root=new URL('../../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');
const base=JSON.parse(read('docs/design/w11-2026-10-20/html-baseline.json'));
// 원본 baseline은 유지하고 사용자가 요청한 실제 이미지 URL 변환만 허용한다.
const convertedImageLinks=html=>{for(const row of JSON.parse(read('docs/design/jpg-2026-10-20/conversion-manifest.json')).images){html=html.replaceAll(path.posix.relative('docs/knowledge',row.source),path.posix.relative('docs/knowledge',row.destination));}return html;};
assert.equal(crypto.createHash('sha256').update(read('docs/knowledge/W11-why-tx-in-service.md')).digest('hex'),base.sourceSHA256);
const page=new JSDOM(read('docs/knowledge/W11-why-tx-in-service.html'),{runScripts:'outside-only',url:'https://learn.example/docs/knowledge/W11-why-tx-in-service.html'}),d=page.window.document;
const source=d.querySelector('#w11-original'),clone=source.cloneNode(true);
clone.querySelector(':scope>summary').remove();clone.querySelectorAll('script').forEach(n=>n.remove());
assert.equal((d.querySelector('main>h1, h1.kr-source-title').textContent+' '+clone.textContent).replace(/\s+/g,' ').trim(),base.wholeSourceText);
assert.deepEqual([...source.querySelectorAll('pre code')].map(n=>n.textContent),base.code);
for(const id of base.ids)assert.ok(d.getElementById(id));
assert.equal(d.querySelector('.tx-why-focused').outerHTML,convertedImageLinks(base.oldFocused));
assert.equal(d.querySelector('.w11-legacy>.tx-why-map').outerHTML,base.oldMap);
const ids=[...d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(ids.length,new Set(ids).size);
for(const asset of Object.values(W11_ASSETS)){
  assert.equal(asset.ready,true);
  const raw=fs.readFileSync(new URL('docs/design/w11-2026-10-20/images/'+asset.file,root));
  assert.equal(asset.width,rasterDimensions(raw).width);assert.equal(asset.height,rasterDimensions(raw).height);
  for(const region of Object.values(asset.focus))assert.ok(region.every(n=>n>=0)&&region[0]+region[2]<=100&&region[1]+region[3]<=100);
}
assert.ok(d.querySelector('script[src*="w11-learning.bundle.js"]'));
page.window.eval(read('tools/site/w11-learning.bundle.js'));
const ui=d.querySelector('[data-w11-learning]');
for(const lesson of W11_LESSONS){
  const topic=ui.querySelector('[data-w11-topic]');topic.value=lesson.id;topic.dispatchEvent(new page.window.Event('change'));
  for(const stage of lesson.stages){
    ui.querySelector(`[data-w11-stage="${stage.id}"]`).click();
    assert.equal(ui.querySelector('[data-w11-code]').textContent,stage.code);
    assert.equal(ui.querySelector('[data-w11-title]').textContent,stage.title);
    assert.equal(ui.querySelector('[data-w11-output]').open,false);
    for(const key of stage.runKeys)assert.ok(ui.querySelector('[data-w11-runs]').textContent.includes(JSON.stringify(w11Run(key),null,2)));
  }
}
const actual=JSON.parse(read('docs/design/w11-2026-10-20/source-proof/execution.json'));
assert.equal(actual.variantB.checks+actual.variantC.checks,31);assert.deepEqual(W11_RUNS,actual);
const passes=[...read('docs/design/w11-2026-10-20/source-proof/gradle-run.txt').matchAll(/^PASS (.+)$/gm)].map(m=>m[1]);
assert.equal(passes.length,31);
assert.deepEqual([...new Set(W11_LESSONS.flatMap(l=>l.stages.flatMap(s=>s.checks)))].sort(),[...new Set(passes)].sort());
assert.match(d.querySelector('.w11-supplement').textContent,/전체 실험의 모든 DB 연결0이라고 말하지 않습니다/);
assert.match(d.querySelector('.w11-supplement').textContent,/주석뿐인 no-op/);
assert.match(d.querySelector('.w11-supplement').textContent,/HTTP\/MVC·201 응답·응답 직렬화는 실행하지 않았습니다/);
const displayedJson=[...d.querySelectorAll('.w11-supplement pre code')].flatMap(node=>{try{return [JSON.parse(node.textContent)];}catch{return [];}});
assert.deepEqual(displayedJson,['source-proof/source.json','source-proof/execution.json','research/main-verification.json'].map(file=>JSON.parse(read('docs/design/w11-2026-10-20/'+file))));
page.window.close();
console.log(`W11 생성 HTML: 원문${base.wholeSourceText.length}자/code${base.code.length}/id${base.ids.length}·기존집중/map·실제bundle19상태·6JPG·31PASS/전체run 보존 통과`);
