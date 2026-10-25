import path from 'node:path';
import {rasterDimensions} from './raster-size.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {JSDOM} from 'jsdom';
import {S08_ASSETS,S08_LESSONS,S08_RUNS} from './s08-lesson-data.mjs';
const root=new URL('../../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');
const base=JSON.parse(read('docs/design/s08-2026-10-20/html-baseline.json'));
// 원본 baseline은 유지하고 사용자가 요청한 실제 이미지 URL 변환만 허용한다.
const convertedImageLinks=html=>{for(const row of JSON.parse(read('docs/design/jpg-2026-10-20/conversion-manifest.json')).images){html=html.replaceAll(path.posix.relative('docs/knowledge',row.source),path.posix.relative('docs/knowledge',row.destination));}return html;};
assert.equal(crypto.createHash('sha256').update(read('docs/knowledge/S08-transactions.md')).digest('hex'),base.sourceSHA256);
const page=new JSDOM(read('docs/knowledge/S08-transactions.html'),{runScripts:'outside-only',url:'https://learn.example/docs/knowledge/S08-transactions.html'}),d=page.window.document;
const source=d.querySelector('#s08-original'),clone=source.cloneNode(true);
clone.querySelector(':scope>summary').remove();clone.querySelectorAll('script').forEach(n=>n.remove());
assert.equal((d.querySelector('main>h1, h1.kr-source-title').textContent+' '+clone.textContent).replace(/\s+/g,' ').trim(),base.wholeSourceText);
assert.deepEqual([...source.querySelectorAll('pre code')].map(n=>n.textContent),base.code);
for(const id of base.ids)assert.ok(d.getElementById(id));
assert.equal(d.querySelector('.tx-life-focused').outerHTML,convertedImageLinks(base.oldFocused));
assert.equal(d.querySelector('.s08-legacy>.tx-life-map').outerHTML,base.oldMap);
const ids=[...d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(ids.length,new Set(ids).size);
for(const asset of Object.values(S08_ASSETS)){
  assert.equal(asset.ready,true);
  const raw=fs.readFileSync(new URL('docs/design/s08-2026-10-20/images/'+asset.file,root));
  assert.equal(asset.width,rasterDimensions(raw).width);assert.equal(asset.height,rasterDimensions(raw).height);
  for(const region of Object.values(asset.focus))assert.ok(region.every(n=>n>=0)&&region[0]+region[2]<=100&&region[1]+region[3]<=100);
}
assert.ok(d.querySelector('script[src*="s08-learning.bundle.js"]'));
page.window.eval(read('tools/site/s08-learning.bundle.js'));
const ui=d.querySelector('[data-s08-learning]');
for(const lesson of S08_LESSONS){
  const topic=ui.querySelector('[data-s08-topic]');topic.value=lesson.id;topic.dispatchEvent(new page.window.Event('change'));
  for(const stage of lesson.stages){
    ui.querySelector(`[data-s08-stage="${stage.id}"]`).click();
    assert.equal(ui.querySelector('[data-s08-code]').textContent,stage.code);
    assert.equal(ui.querySelector('[data-s08-title]').textContent,stage.title);
    assert.equal(ui.querySelector('[data-s08-output]').open,false);
    for(const key of stage.runKeys)assert.ok(ui.querySelector('[data-s08-runs]').textContent.includes(JSON.stringify(S08_RUNS[key],null,2)));
  }
}
const actual=JSON.parse(read('docs/design/s08-2026-10-20/source-proof/execution.json'));
assert.equal(actual.checks,42);assert.deepEqual(S08_RUNS,actual);
const passes=[...read('docs/design/s08-2026-10-20/source-proof/gradle-run.txt').matchAll(/^PASS (.+)$/gm)].map(m=>m[1]);
assert.equal(passes.length,42);
assert.deepEqual([...new Set(S08_LESSONS.flatMap(l=>l.stages.flatMap(s=>s.checks)))].sort(),[...new Set(passes)].sort());
assert.match(d.querySelector('.s08-supplement').textContent,/실행/);
assert.match(d.querySelector('.s08-supplement').textContent,/직접 TransactionSynchronization.afterCommit 콜백과 다릅니다/);
assert.match(d.querySelector('.s08-supplement').textContent,/실제 insertIfAbsent 또는 중복 키 구현이 아닙니다/);
page.window.close();
console.log(`S08 생성 HTML: 원문${base.wholeSourceText.length}자/code${base.code.length}/id${base.ids.length}·기존집중/map·실제bundle30상태·10JPG·42PASS/전체run 보존 통과`);
