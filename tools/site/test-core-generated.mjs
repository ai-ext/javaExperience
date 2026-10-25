import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { loadCoreLearning } from './core-learning-data.mjs';

const root = new URL('../../', import.meta.url).pathname;
const file = path.join(root, 'lessons/concept-core.html');
assert.ok(fs.existsSync(file), '핵심 학습 생성 HTML이 있어야 함');
const html = fs.readFileSync(file, 'utf8');
const doc = new JSDOM(html).window.document;
assert.equal(doc.documentElement.dataset.theme, 'dark');
assert.equal(doc.body.classList.contains('concept-core-page'), true);
assert.equal(doc.querySelectorAll('main').length, 1);
assert.equal(doc.querySelectorAll('script[src*="core-learning.bundle.js"]').length, 1);
assert.equal(doc.querySelectorAll('link[href*="core-learning.css"]').length, 1);
assert.equal(doc.querySelector('nav[aria-label="주 메뉴"] [aria-current="page"]').textContent, '개념 학습');
for (const unit of loadCoreLearning(root).units) for (const source of unit.sourceLinks) {
  const url = new URL(source.href, 'https://learn.example/lessons/concept-core.html');
  const target = path.join(root, url.pathname);
  const targetDoc = new JSDOM(fs.readFileSync(target, 'utf8')).window.document;
  assert.ok(targetDoc.getElementById(decodeURIComponent(url.hash.slice(1))), `${unit.id}: ${source.href}`);
}
const catalog = new JSDOM(fs.readFileSync(path.join(root, 'docs/knowledge/README.html'), 'utf8')).window.document;
for (const a of catalog.querySelectorAll('a[href*="concept-core.html"]')) {
  const url = new URL(a.getAttribute('href'), 'https://learn.example/docs/knowledge/README.html');
  assert.equal(url.pathname, '/lessons/concept-core.html');
  assert.ok(loadCoreLearning(root).units.some(unit => unit.id === url.searchParams.get('unit')));
}
assert.equal(catalog.querySelectorAll('[data-kc-document]').length, 134);
console.log('core generated: one main, PC dark, exact assets, active navigation, unit routes and original anchors passed');
