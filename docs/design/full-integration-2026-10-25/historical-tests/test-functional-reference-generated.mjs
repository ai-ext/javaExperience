// 생성 HTML에 실제 연결된 공개 맥락과 원문 보존을 함께 검사한다.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { FUNCTIONAL_TASKS } from './functional-scenario-data.mjs';
import { FUNCTIONAL_LIKE_TASKS } from './functional-like-data.mjs';
import { readReferenceContext, initFunctionalReferenceContext } from './functional-reference-context.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'scenario/scenario.json'), 'utf8'));
const legacy = manifest.chapters.filter(ch => ch.status !== 'planned').flatMap(ch => ch.levels.filter(level => level.file).map(level => `scenario/${ch.dir}/${level.file.replace(/\.md$/, '.html')}`));
const knowledge = fs.readdirSync(path.join(root, 'docs/knowledge')).filter(name => name === 'README.html' || /^[A-Z]\d{2}-.*\.html$/.test(name)).map(name => 'docs/knowledge/' + name);
const compact = html => html.replace(/>\s+</g, '><').trim();
const migratedImages = JSON.parse(fs.readFileSync(path.join(root,
  'docs/design/jpg-migration-2026-10-20/manifest.json'), 'utf8')).records;
const originalImagePaths = (html, page) => {
  html = html.replace(/\b(href|src)="([^"]*)"/g, (attribute, key, value) => {
    if (/^(https?:|data:|mailto:)/.test(value)) return attribute;
    const url = new URL(value, pathToFileURL(path.join(root, page)));
    const image = migratedImages.find(item => path.join(root, item.file) === fileURLToPath(url));
    if (!image) return attribute;
    const previous = value.replace(/\.jpg(?=$|[?#])/, '.png')
      .replace(`?v=${image.sha256.slice(0, 12)}`, `?v=${image.originalSha256.slice(0, 12)}`);
    return `${key}="${previous}"`;
  });
  for (const image of migratedImages) html = html.replaceAll(image.file, image.original);
  return html;
};
const mainBody = html => compact(html.slice(html.indexOf('>', html.indexOf('<main')) + 1, html.lastIndexOf('</main>'))
  .replace(/<aside\b[^>]*data-frc-root[\s\S]*?<\/aside>/g, '')
  .replace(/<script\b[^>]*data-frc-data[\s\S]*?<\/script>/g, ''));
let preserved = 0;
for (const page of [...legacy, ...knowledge]) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  const url = pathToFileURL(path.join(root, page)); url.search = '?fromTask=flow-create';
  // 거대한 236개 원문을 반복 파싱하지 않는다. 실제 문맥 markup만 DOM으로 실행한다.
  const script = html.match(/<script\b[^>]*data-frc-data[\s\S]*?<\/script>/)?.[0];
  const aside = html.match(/<aside\b[^>]*data-frc-root[\s\S]*?<\/aside>/)?.[0] || '';
  assert.ok(script, `${page}: 공개 metadata 존재`);
  const dom = new JSDOM(aside + script, { url: url.href });
  const doc = dom.window.document;
  const data = JSON.parse(doc.querySelector('[data-frc-data]').textContent);
  assert.equal(data.pagePath, page);
  assert.deepEqual(new Set(data.legacyPaths), new Set(legacy));
  assert.deepEqual(new Set(data.knowledgePaths), new Set(knowledge));
  assert.deepEqual(data.tasks.map(task => task.id), [...FUNCTIONAL_TASKS,...FUNCTIONAL_LIKE_TASKS].map(task => 'flow-' + task.id));
  assert.equal(doc.querySelectorAll('[data-frc-data]').length, 1);
  const context = readReferenceContext(doc, dom.window.location);
  assert.equal(context?.kind, legacy.includes(page) ? 'legacy' : 'knowledge', page);
  assert.equal(doc.querySelectorAll('[data-frc-root]').length, legacy.includes(page) ? 1 : 0);
  if (legacy.includes(page)) {
    assert.match(html, /<script src="[^"]*functional-reference\.bundle\.js[^\"]*" defer>/);
    assert.match(html, /<link rel="stylesheet" href="[^"]*functional-reference-context\.css/);
    assert.ok(doc.querySelector('[data-frc-root]').hidden, '직접 방문·script 전에는 안내를 숨긴다');
    initFunctionalReferenceContext(doc, dom.window);
    assert.equal(doc.querySelector('[data-frc-root]').hidden, false);
    assert.equal(doc.querySelector('[data-frc-method]').textContent, 'POST');
    assert.equal(doc.querySelector('[data-frc-api]').textContent, '/api/posts');
    const open = doc.querySelector('[data-frc-open]');
    assert.equal(open.target, '_blank');
    assert.equal(open.rel, 'noopener noreferrer');
    assert.ok(open.getAttribute('aria-label').includes('새 탭'));
  }
  // 초기 HTML의 본문 비교: JS 전파 결과 대신 디스크의 원문 DOM을 비교한다.
  const previous = execFileSync('git', ['show', `a84b560:${page}`], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  assert.equal(mainBody(originalImagePaths(html, page)), mainBody(previous), `${page}: JPG 경로 외 원문·앵커·접기·코드 본문 유지`);
  preserved++;
  dom.window.close();
}
let references = 0;
for (const task of FUNCTIONAL_TASKS) {
  const absolute = path.join(root, task.sourcePath.replace(/\.md$/, '.html'));
  const dom = new JSDOM(fs.readFileSync(absolute, 'utf8'), { url: pathToFileURL(absolute).href });
  for (const link of dom.window.document.querySelectorAll('[data-fw-legacy]')) {
    const url = new URL(link.href);
    assert.deepEqual(url.searchParams.getAll('fromTask'), ['flow-' + task.id]);
    assert.ok(legacy.includes(path.relative(root, fileURLToPath(url)).split(path.sep).join('/')));
    references++;
  }
  assert.equal(dom.window.document.querySelector('[data-frc-data]'), null, '작업 화면에 참고문서 metadata 불필요');
  dom.window.close();
}
assert.equal(legacy.length, 101);
assert.equal(references, 12);
console.log(`참고 맥락: 기존 ${legacy.length}단계·개념 ${knowledge.length}페이지 metadata, 원문 ${preserved}개 main HTML 보존, 직접 링크 ${references}개 검사 통과 (실제 브라우저 렌더링 아님)`);
