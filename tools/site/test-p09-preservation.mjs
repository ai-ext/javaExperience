import { loadSourceBaseline } from './learning-source-baseline.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const baseline = loadSourceBaseline(root, 'docs/design/concept-learning-night-2026-10-20/preservation-baseline.json');
for (const entry of baseline.documents) {
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, entry.path))).digest('hex'), entry.sha256, entry.path + ' 원문 전체 보존');
}
for (const [file, sha] of Object.entries(baseline.learnerServer)) {
  assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex'), sha, file + ' 학습자 코드 보존');
}
const original = JSON.parse(read('docs/design/p09-2026-10-20/html-baseline.json'));
const page = new JSDOM(read('docs/knowledge/P09-java-syntax-basics.html'), { runScripts: 'outside-only', url: 'https://learn.example/docs/knowledge/P09-java-syntax-basics.html' });
const doc = page.window.document, $ = (selector) => doc.querySelector(selector);
assert.ok($('[data-p09-learning]'));
assert.ok($('#p09-original'), '긴 원문을 보존하는 영역');
const ids = [...doc.querySelectorAll('[id]')].map((node) => node.id);
assert.equal(new Set(ids).size, ids.length, '중복 앵커 없음');
for (const id of original.ids) assert.ok(doc.getElementById(id), '기존 앵커 보존: ' + id);
const currentCodes = [...doc.querySelectorAll('#p09-original pre code')].map((node) => node.textContent);
assert.deepEqual(currentCodes, original.code, '원문 전체 코드·공백 보존');
const currentBlocks = [...doc.querySelectorAll('#p09-original .knowledge-chapter p, #p09-original .knowledge-chapter li, #p09-original .knowledge-chapter table')].map((node) => node.textContent.replace(/\s+/g, ' ').trim());
assert.deepEqual(currentBlocks, original.blocks, '원문 산문·목록·표 보존');
const completeSource=$('#p09-original').cloneNode(true);completeSource.querySelector(':scope > summary').remove();
assert.equal(completeSource.textContent.replace(/\s+/g,' ').trim(),original.wholeSourceText,'원문 전체 보기에 제목·서두·모든 본문 텍스트를 보존');
page.window.eval(read('tools/site/p09-learning.bundle.js'));
assert.equal($('[data-p09-topic]').value, 'references','대표 질문의 객체·참조 장면에서 시작');
$('[data-p09-topic]').value='file';$('[data-p09-topic]').dispatchEvent(new page.window.Event('change',{bubbles:true}));
assert.match($('[data-p09-code]').textContent, /package com.example.billing/);
$('[data-p09-stage="import"]').click();
assert.match($('[data-p09-state]').textContent, /java.math.BigDecimal/);
assert.match(doc.querySelector('mark').textContent, /import/);
assert.equal($('[data-p09-focus]').hidden, false);
$('[data-p09-stage="filename"]').click();
assert.equal($('[data-p09-next]').disabled, true);
$('a[href="#p09-original"]').click();
assert.equal($('#p09-original').open, true, '원문 전체 열기');
$('#p09-original').open = false;
const deepId = original.ids.find((id) => doc.getElementById(id)?.closest('#p09-original'));
page.window.location.hash = deepId;
page.window.dispatchEvent(new page.window.HashChangeEvent('hashchange'));
assert.equal($('#p09-original').open, true, '기존 깊은 앵커 진입 시 바깥 원문 접기 열기');
for (const img of doc.querySelectorAll('[data-p09-image]')) {
  const file = path.resolve(root, 'docs/knowledge', img.getAttribute('src'));
  assert.ok(fs.existsSync(file), '실제 이미지 파일 존재: ' + file);
}
page.window.close();
console.log(`P09: 원문 ${baseline.documents.length}개 SHA-256·학습자 파일 ${Object.keys(baseline.learnerServer).length}개·원문 코드 ${original.code.length}개·기존 앵커 ${original.ids.length}개 보존, 실제 생성 bundle 조작 통과`);
