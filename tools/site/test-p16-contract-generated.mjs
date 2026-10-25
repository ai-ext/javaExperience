import {rasterDimensions} from './raster-size.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { JSDOM } from 'jsdom';
import { P16_CONTRACT_ASSETS, P16_CONTRACT_LESSONS } from './p16-contract-data.mjs';
const root=new URL('../../',import.meta.url), read=p=>fs.readFileSync(new URL(p,root),'utf8');
const baseline=JSON.parse(read('docs/design/p16-2026-10-20/html-baseline.json'));
assert.equal(crypto.createHash('sha256').update(read(baseline.source)).digest('hex'),baseline.sourceSHA256);
const page=new JSDOM(read('docs/knowledge/P16-json-jackson-practical.html'),{runScripts:'outside-only',url:'https://learn.example/docs/knowledge/P16-json-jackson-practical.html'}),d=page.window.document;
const original=d.querySelector('#p16-original'),norm=s=>s.replace(/\s+/g,' ').trim();
assert.equal(norm(original.textContent),baseline.originalText,'원문 전체와 기존 내부 시각 자료 텍스트 보존');
assert.equal(norm(d.querySelector('.p16-original-title').textContent),baseline.originalTitle);
assert.deepEqual([...original.querySelectorAll('pre code')].map(n=>n.textContent),baseline.code);
for(const id of baseline.ids)assert.ok(original.querySelector(`[id="${id}"]`),id);
const ids=[...d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(ids.length,new Set(ids).size);
for(const asset of Object.values(P16_CONTRACT_ASSETS)){
 assert.equal(asset.ready,true);const b=fs.readFileSync(new URL('docs/design/p16-2026-10-20/images/'+asset.file,root));
 assert.equal(rasterDimensions(b).width,asset.width);assert.equal(rasterDimensions(b).height,asset.height);
}
assert.ok(d.querySelector('script[src*="p16-contract-learning.bundle.js"]'));
page.window.eval(read('tools/site/p16-contract-learning.bundle.js'));
assert.equal(d.querySelectorAll('[data-p16-contract-topic] option').length,8);
for(const lesson of P16_CONTRACT_LESSONS){
 const select=d.querySelector('[data-p16-contract-topic]');select.value=lesson.id;select.dispatchEvent(new page.window.Event('change'));
 for(const stage of lesson.stages){d.querySelector(`[data-p16-contract-stage="${stage.id}"]`).click();assert.equal(d.querySelector('[data-p16-contract-title]').textContent,stage.title);assert.equal(d.querySelector('[data-p16-contract-code]').textContent,stage.code);assert.equal(d.querySelector('[data-p16-contract-output]').open,false);}
}
assert.match(d.querySelector('.p16-execution-evidence').textContent,/24개/);
assert.match(d.querySelector('.p16-execution-evidence').textContent,/406.*응답 협상 실패.*이미 호출됨/);
assert.match(d.querySelector('.p16-execution-evidence').textContent,/Boot 4\.1\.1·Java 25·DB·실제 HTTP 포트는 실행하지/);
page.window.close();console.log(`P16 생성 HTML: 원문${baseline.originalText.length}자/코드${baseline.code.length}/앵커${baseline.ids.length}, 이미지8개/실제bundle20상태/추가실행경계 보존 통과`);
