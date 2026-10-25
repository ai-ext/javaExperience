import {rasterDimensions} from './raster-size.mjs';
import assert from'node:assert/strict';
import fs from'node:fs';
import crypto from'node:crypto';
import{JSDOM}from'jsdom';
import{P19_ASSETS,P19_LESSONS}from'./p19-lesson-data.mjs';
const root=new URL('../../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');
const baseline=JSON.parse(read('docs/design/p19-2026-10-20/html-baseline.json'));
assert.equal(crypto.createHash('sha256').update(read('docs/knowledge/P19-mysql-jpa-setup.md')).digest('hex'),baseline.sourceSHA256);
const p=new JSDOM(read('docs/knowledge/P19-mysql-jpa-setup.html'),{runScripts:'outside-only',url:'https://learn.example/docs/knowledge/P19-mysql-jpa-setup.html'}),d=p.window.document;
const original=d.querySelector('#p19-original'),clone=original.cloneNode(true);clone.querySelector(':scope>summary').remove();
assert.equal(clone.textContent.replace(/\s+/g,' ').trim(),baseline.wholeSourceText);
assert.deepEqual([...original.querySelectorAll('pre code')].map(n=>n.textContent),baseline.code);
for(const id of baseline.ids)assert.ok(original.querySelector(`[id="${id}"]`));
const ids=[...d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(ids.length,new Set(ids).size);
for(const a of Object.values(P19_ASSETS)){assert.equal(a.ready,true);const b=fs.readFileSync(new URL('docs/design/p19-2026-10-20/images/'+a.file,root));assert.equal(a.width,rasterDimensions(b).width);assert.equal(a.height,rasterDimensions(b).height);}
assert.ok(d.querySelector('script[src*="p19-learning.bundle.js"]'));
p.window.eval(read('tools/site/p19-learning.bundle.js'));
for(const lesson of P19_LESSONS){const t=d.querySelector('[data-p19-topic]');t.value=lesson.id;t.dispatchEvent(new p.window.Event('change'));for(const stage of lesson.stages){d.querySelector(`[data-p19-stage="${stage.id}"]`).click();assert.equal(d.querySelector('[data-p19-code]').textContent,stage.code);assert.equal(d.querySelector('[data-p19-title]').textContent,stage.title);assert.equal(d.querySelector('[data-p19-output]').open,false);}}
assert.match(d.querySelector('.p19-supplement').textContent,/MySQL\/Java25 전체 구성·HTTP·Actuator·Docker 컨테이너는 실행하지/);
p.window.close();console.log(`P19 생성 HTML: 원문${baseline.wholeSourceText.length}자/code${baseline.code.length}/id${baseline.ids.length}, 실제bundle19상태·이미지6개·중복ID없음 통과`);
