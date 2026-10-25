import { loadSourceBaseline } from './learning-source-baseline.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baseline = loadSourceBaseline(ROOT, 'docs/design/concept-ia-2026-10-24/source-baseline.json');
const hash = (value) => createHash('sha256').update(value).digest('hex');
const normalizedText = (node) => node.textContent.replace(/\s+/g, ' ').trim();
const darkHref = (href) => /(?:^|\/)tools\/site\/knowledge-dark\.css\?v=[a-f0-9]{12}$/.test(href || '');

assert.equal(baseline.pages.length, 136, '홈·목록·상세 기준 페이지 수');
for (const page of baseline.pages) {
  const outputPath = path.join(ROOT, page.file);
  assert.ok(fs.existsSync(outputPath), `${page.file} 생성 파일 존재`);
  const html = fs.readFileSync(outputPath, 'utf8');
  const document = new JSDOM(html).window.document;
  assert.equal(document.documentElement.dataset.theme, 'dark', `${page.file} html data-theme`);
  assert.equal(document.body.dataset.conceptSurface, 'dark', `${page.file} body data-concept-surface`);
  const expectedBodyClass = page.file === 'index.html' ? 'home-page'
    : page.file === 'docs/knowledge/README.html' ? 'knowledge-catalog-page'
      : page.file.endsWith('/P02-mvc-layered-architecture.html') ? 'p02-focused-page'
        : page.file.endsWith('/P16-json-jackson-practical.html') ? 'knowledge-detail-page' : '';
  assert.equal(document.body.getAttribute('class') || '', expectedBodyClass, `${page.file} 기존 body class 보존`);
  const stylesheets = [...document.querySelectorAll('link[rel="stylesheet"]')];
  assert.ok(stylesheets.length > 0 && darkHref(stylesheets.at(-1).getAttribute('href')), `${page.file} knowledge-dark.css가 마지막 stylesheet`);

  // taskB는 reader 제목·모드 도구를 main 바깥 원문은 그대로 둔 채 추가한다.
  // 따라서 TaskA 당시의 전체 main text 해시는 역사 기준으로 남기고 원문 selector 해시와 reader 계약으로 검증한다.
  if (page.file.startsWith('docs/knowledge/') && page.sourceSelector) {
    assert.ok(document.querySelector('[data-knowledge-reader]'), `${page.file} reader 계약 등록`);
    assert.ok(document.querySelector('[data-kr-reading]'), `${page.file} 설명 읽기 영역 등록`);
  } else if (page.file !== 'index.html' && page.file !== 'docs/knowledge/README.html') {
    assert.equal(hash(normalizedText(document.querySelector('main'))), page.mainTextSHA256, `${page.file} main 텍스트 보존`);
  }
  if (page.sourceSelector) {
    const source = document.querySelector(page.sourceSelector);
    assert.ok(source, `${page.file} 원문 selector ${page.sourceSelector}`);
    assert.equal(hash(normalizedText(source)), page.sourceTextSHA256, `${page.file} 원문 텍스트 보존`);
    assert.deepEqual([...source.querySelectorAll('pre code')].map((code) => hash(code.textContent)), page.sourceCode, `${page.file} 코드 블록 보존`);
    const ids = new Set([...document.querySelectorAll('[id]')].map((element) => element.id));
    for (const id of page.existingIds) assert.ok(ids.has(id), `${page.file} 기존 id #${id} 보존`);
    assert.equal(hash(fs.readFileSync(path.join(ROOT, page.source))), page.sourceSHA256, `${page.source} 원본 파일 보존`);
  }
}

for (const file of ['scenario/README.html', 'practice/MISSIONS.html']) {
  const document = new JSDOM(fs.readFileSync(path.join(ROOT, file), 'utf8')).window.document;
  assert.notEqual(document.documentElement.dataset.theme, 'dark', `${file} 다크 테마 미적용`);
  assert.notEqual(document.body.dataset.conceptSurface, 'dark', `${file} 개념 표식 미적용`);
  assert.ok(![...document.querySelectorAll('link[rel="stylesheet"]')].some((link) => darkHref(link.getAttribute('href'))), `${file} 다크 stylesheet 미적용`);
}

const css = fs.readFileSync(path.join(ROOT, 'tools/site/knowledge-dark.css'), 'utf8');
assert.doesNotMatch(css, /filter\s*:/i, '기존 이미지 색상 반전 금지');
assert.doesNotMatch(css, /@media/i, '다크 전용 새 responsive 분기 없음');
console.log('PASS knowledge dark scope, stylesheet registration, and 136-page source baseline');
