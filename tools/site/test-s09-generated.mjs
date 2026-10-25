import { loadSourceBaseline } from './learning-source-baseline.mjs';
import path from 'node:path';
import {rasterDimensions} from './raster-size.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {JSDOM}from'jsdom';
import {S09_ASSETS,S09_LESSONS,S09_SQL_PHASES}from'./s09-lesson-data.mjs';
const root=new URL('../../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');
const base=loadSourceBaseline(root, 'docs/design/s09-2026-10-20/html-baseline.json');
// 원본 baseline은 유지하고 사용자가 요청한 실제 이미지 URL 변환만 허용한다.
const convertedImageLinks=html=>{for(const row of JSON.parse(read('docs/design/jpg-2026-10-20/conversion-manifest.json')).images){html=html.replaceAll(path.posix.relative('docs/knowledge',row.source),path.posix.relative('docs/knowledge',row.destination));}return html;};
assert.equal(crypto.createHash('sha256').update(read('docs/knowledge/S09-jpa-hibernate.md')).digest('hex'),base.sourceSHA256);
const page=new JSDOM(read('docs/knowledge/S09-jpa-hibernate.html'),{runScripts:'outside-only',url:'https://learn.example/docs/knowledge/S09-jpa-hibernate.html'}),d=page.window.document;
const source=d.querySelector('#s09-original'),clone=source.cloneNode(true);clone.querySelector(':scope>summary').remove();clone.querySelectorAll('script').forEach(n=>n.remove());
assert.equal((d.querySelector('main>h1, h1.kr-source-title').textContent+' '+clone.textContent).replace(/\s+/g,' ').trim(),base.wholeSourceText);
assert.deepEqual([...source.querySelectorAll('pre code')].map(n=>n.textContent),base.code);
for(const id of base.ids)assert.ok(d.getElementById(id));
assert.equal(d.querySelector('.jpa-focused').outerHTML,convertedImageLinks(base.oldFocused));
assert.deepEqual([...d.querySelectorAll('.s09-legacy>.jpa-focus-deep')].map(n=>n.outerHTML),base.oldDeep);
const ids=[...d.querySelectorAll('[id]')].map(n=>n.id);assert.equal(ids.length,new Set(ids).size);
for(const a of Object.values(S09_ASSETS)){assert.equal(a.ready,true);const b=fs.readFileSync(new URL('docs/design/s09-2026-10-20/images/'+a.file,root));assert.equal(a.width,rasterDimensions(b).width);assert.equal(a.height,rasterDimensions(b).height);}
assert.ok(d.querySelector('script[src*="s09-learning.bundle.js"]'));
page.window.eval(read('tools/site/s09-learning.bundle.js'));const ui=d.querySelector('[data-s09-learning]');
for(const lesson of S09_LESSONS){const t=ui.querySelector('[data-s09-topic]');t.value=lesson.id;t.dispatchEvent(new page.window.Event('change'));for(const stage of lesson.stages){ui.querySelector(`[data-s09-stage="${stage.id}"]`).click();assert.equal(ui.querySelector('[data-s09-code]').textContent,stage.code);assert.equal(ui.querySelector('[data-s09-title]').textContent,stage.title);assert.equal(ui.querySelector('[data-s09-output]').open,false);}}
const x=JSON.parse(read('docs/design/s09-2026-10-20/source-proof/execution.json'));assert.equal(x.checks,61);assert.deepEqual(S09_SQL_PHASES,x.sqlPhases);
const actual=[...read('docs/design/s09-2026-10-20/source-proof/gradle-run.txt').matchAll(/^PASS (.+)$/gm)].map(m=>m[1]);assert.equal(actual.length,61);const covered=new Set(S09_LESSONS.flatMap(l=>l.stages.flatMap(s=>s.checks)));assert.deepEqual([...covered].sort(),[...new Set(actual)].sort());
const used=new Set(S09_LESSONS.flatMap(l=>l.stages.flatMap(s=>s.sqlPhases)));assert.deepEqual([...used].sort(),Object.keys(S09_SQL_PHASES).sort());
assert.match(d.querySelector('.s09-supplement').textContent,/원인·확정 bug명·수정 버전은 미확인/);
page.window.close();console.log(`S09 생성 HTML: 원문${base.wholeSourceText.length}자/code${base.code.length}/id${base.ids.length}·기존역할/deep2·실제bundle31상태·9JPG·61PASS/전체SQL 일치 통과`);
