import {rasterDimensions} from './raster-size.mjs';
import assert from'node:assert/strict';
import fs from'node:fs';
import crypto from'node:crypto';
import{JSDOM}from'jsdom';
import{W09_ASSETS,W09_LESSONS}from'./w09-lesson-data.mjs';
const root=new URL('../../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');
const baseline=JSON.parse(read('docs/design/w09-2026-10-20/html-baseline.json'));
assert.equal(crypto.createHash('sha256').update(read('docs/knowledge/W09-why-dto.md')).digest('hex'),baseline.sourceSHA256);
const p=new JSDOM(read('docs/knowledge/W09-why-dto.html'),{runScripts:'outside-only',url:'https://learn.example/docs/knowledge/W09-why-dto.html'}),d=p.window.document;
const original=d.querySelector('#w09-original'),clone=original.cloneNode(true);clone.querySelector(':scope>summary').remove();
assert.equal(clone.textContent.replace(/\s+/g,' ').trim(),baseline.wholeSourceText);
assert.deepEqual([...original.querySelectorAll('pre code')].map(n=>n.textContent),baseline.code);
for(const id of baseline.ids)assert.ok(original.querySelector(`[id="${id}"]`));
const ids=[...d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(ids.length,new Set(ids).size);
for(const a of Object.values(W09_ASSETS)){assert.equal(a.ready,true);const b=fs.readFileSync(new URL('docs/design/w09-2026-10-20/images/'+a.file,root));assert.equal(a.width,rasterDimensions(b).width);assert.equal(a.height,rasterDimensions(b).height);}
assert.ok(d.querySelector('script[src*="w09-learning.bundle.js"]'));
p.window.eval(read('tools/site/w09-learning.bundle.js'));
for(const lesson of W09_LESSONS){const t=d.querySelector('[data-w09-topic]');t.value=lesson.id;t.dispatchEvent(new p.window.Event('change'));for(const stage of lesson.stages){d.querySelector(`[data-w09-stage="${stage.id}"]`).click();assert.equal(d.querySelector('[data-w09-code]').textContent,stage.code);assert.equal(d.querySelector('[data-w09-title]').textContent,stage.title);assert.equal(d.querySelector('[data-w09-output]').open,false);}}
assert.match(d.querySelector('.w09-supplement').textContent,/MySQL·Spring Data Repository·Boot·OSIV 요청·HTTP·Java25는 실행하지/);
p.window.close();console.log(`W09 생성 HTML: 원문${baseline.wholeSourceText.length}자/code${baseline.code.length}/id${baseline.ids.length}, 실제bundle18상태·이미지6개·중복ID없음 통과`);
