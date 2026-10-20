import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
const root = new URL('../../', import.meta.url);
const html = fs.readFileSync(new URL('docs/knowledge/README.html', root), 'utf8');
const dom = new JSDOM(html, {url:'https://learn.example/docs/knowledge/README.html',runScripts:'outside-only'});
const {window:win}=dom;const doc=win.document;const $=(selector)=>doc.querySelector(selector);
win.scrollTo=()=>{};win.HTMLElement.prototype.scrollIntoView=()=>{};
doc.addEventListener('click',(event)=>{if(event.target.closest('a'))event.preventDefault();});
win.eval(fs.readFileSync(new URL('tools/site/knowledge-learning.bundle.js',root),'utf8'));
assert.ok(doc.body.classList.contains('knowledge-catalog-page'));
assert.equal(doc.querySelectorAll('[data-kc-document]').length,134);
const visible=()=>[...doc.querySelectorAll('[data-kc-document]')].filter((row)=>!row.hidden).map((row)=>row.dataset.kcDocument);
assert.deepEqual(visible(),['P09','P04','P29']);
$('[data-kc-query="DTO"]').click();assert.equal(visible().length,7);
$('button[data-kc-category="java"]').click();assert.equal(visible().length,0);
$('[data-kc-filter-reset]').click();assert.equal(visible().length,7);assert.equal($('#knowledge-search-input').value,'DTO');
$('button[data-kc-category="delivery"]').click();
$('[data-kc-reset]').click();
// 검색어를 지운 뒤에도 사용자가 선택한 분야를 유지한다.
assert.equal($('[data-kc-category-select]').value,'delivery');
$('[data-kc-query="DTO"]').click();
$('#knowledge-search-input').value='DTO는 왜 쓰나요?';
$('.kc-search').dispatchEvent(new win.Event('submit',{cancelable:true,bubbles:true}));
assert.equal(visible().length,7,'명시적으로 등록한 질문만 DTO 검색으로 연결');
for(const entry of JSON.parse(fs.readFileSync(new URL('docs/design/knowledge-2026-10-19/source-baseline.json',root))).documents.filter((item)=>['docs/knowledge/README.md','docs/knowledge/P16-json-jackson-practical.md'].includes(item.source))){
 const content=entry.source.endsWith('/README.md')?html:fs.readFileSync(new URL(entry.source.replace(/\.md$/,'.html'),root),'utf8');
 const page=new JSDOM(content);const ids=[...page.window.document.querySelectorAll('[id]')].map((node)=>node.id);
 assert.equal(new Set(ids).size,ids.length,'생성된 화면의 ID 중복 없음');
 for(const id of entry.htmlIds)assert.ok(page.window.document.getElementById(id),entry.source+' 원래 앵커 '+id);
 page.window.close();
}
assert.ok($('[data-kc-document="P16"] .kc-result-aside').textContent.includes('DB에 저장하고 201로 응답'));
assert.ok(!$('[data-kc-document="P16"] .kc-result-aside').textContent.includes('1-2 DTO 응답'));
for(const name of fs.readdirSync(new URL('docs/knowledge/',root)).filter((name)=>/^[A-Z]\d{2}-.*\.html$/.test(name))){
 const content=fs.readFileSync(new URL('docs/knowledge/'+name,root),'utf8');
 assert.ok(content.includes('data-kc-catalog-return'),name+' 목록 복귀');assert.ok(content.includes('knowledge-learning.bundle.js'),name+' 일반 script 연결');
}
win.close();
console.log('생성 HTML: 대표 3행·실제 134개/4분야·DTO 7건·필터·명시 질문·원문 앵커·134개 복귀 연결 통과');
