// 렌더러가 추가한 링크는 Markdown 링크 검사와 별도로 실제 생성 HTML에서 대조한다.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { FUNCTIONAL_TASKS } from './functional-scenario-data.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pages = [...FUNCTIONAL_TASKS.map(task => task.sourcePath.replace(/\.md$/, '.html')),
  'scenario/flow/README.html', 'scenario/README.html'];
const cache = new Map();
const read = absolute => {
  if (!cache.has(absolute)) cache.set(absolute, new JSDOM(fs.readFileSync(absolute, 'utf8')));
  return cache.get(absolute).window.document;
};
const errors = [];
const approved = JSON.parse(fs.readFileSync(path.join(root, 'docs/design/scenario-crud-2026-10-20/approved-assets.json'), 'utf8'));
const assets = JSON.parse(fs.readFileSync(path.join(root, 'docs/design/scenario-crud-2026-10-20/asset-index.json'), 'utf8')).assets;
const assetIds = new Set();
const assetFiles = new Set();
const jpegPixels = bytes => {
  assert.equal(bytes.subarray(0, 2).toString('hex'), 'ffd8', 'JPEG SOI');
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    assert.equal(bytes[offset++], 0xff, 'JPEG marker');
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    const size = bytes.readUInt16BE(offset);
    assert.ok(size >= 2 && offset + size <= bytes.length, 'JPEG segment bounds');
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3) };
    }
    assert.notEqual(marker, 0xda, 'SOF must precede image data');
    offset += size;
  }
  assert.fail('JPEG SOF missing');
};
for (const asset of assets) {
  assert.ok(!assetIds.has(asset.id) && !assetFiles.has(asset.file), '시안 이력의 ID·파일 경로 중복 금지');
  assetIds.add(asset.id); assetFiles.add(asset.file);
  assert.ok(asset.file.startsWith('docs/design/scenario-crud-2026-10-20/images/') && !asset.file.split('/').includes('..'));
  const bytes = fs.readFileSync(path.join(root, asset.file));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, `${asset.id}: JPG 배포 파일 무결성`);
  assert.deepEqual(asset.pixels, jpegPixels(bytes), `${asset.id}: 실제 JPEG 크기`);
  assert.deepEqual(asset.pixels, asset.original.pixels, `${asset.id}: PNG 원본과 픽셀 크기 동일`);
  assert.match(asset.original.sha256, /^[a-f0-9]{64}$/);
  assert.equal(asset.bytes, bytes.length, `${asset.id}: 실제 파일 크기`);
  if (asset.approvedForTeaching) {
    assert.equal(asset.kind, 'learning-image', 'UI 배치 시안은 학습 사실 자료로 사용하지 않음');
    assert.equal(asset.reviewed, true);
    assert.equal(asset.status, 'teaching_reviewed');
  }
}
for (const task of FUNCTIONAL_TASKS) {
  const filename = approved[task.id];
  const record = assets.find(asset => asset.file === filename);
  assert.ok(record?.approvedForTeaching, `${task.id}: 검토된 학습 그림만 사용`);
  const bytes = fs.readFileSync(path.join(root, filename));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), record.sha256, `${task.id}: 검토한 그림의 JPG 배포본`);
  assert.deepEqual(jpegPixels(bytes), { width: 1536, height: 1024 });
}
let checked = 0;
for (const page of pages) {
  const absolute = path.join(root, page);
  const doc = read(absolute);
  assert.ok(page === 'scenario/README.html' ? doc.querySelector('[data-sf-catalog]') : doc.body.classList.contains('functional-page'), `${page}: 기능/통합 목록 화면 스타일`);
  assert.equal(doc.querySelectorAll('main main').length, 0, `${page}: 중첩 main 금지`);
  assert.equal(doc.querySelectorAll('h1').length, 1, `${page}: 화면의 주 제목 하나`);
  const content = doc.querySelector('.functional-workspace,.functional-catalog,[data-sf-catalog]');
  assert.ok(content, `${page}: 기능 화면이 있어야 한다`);
  for (const element of content.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls]')) {
    for (const name of ['aria-labelledby', 'aria-describedby', 'aria-controls']) {
      for (const id of (element.getAttribute(name) || '').split(/\s+/).filter(Boolean)) {
        assert.ok(doc.getElementById(id), `${page}: ${name} 대상 ${id} 존재`);
      }
    }
  }
  for (const details of content.querySelectorAll('details')) {
    assert.equal(details.firstElementChild?.tagName, 'SUMMARY', `${page}: 접기 자료의 이름을 먼저 제공`);
  }
  for (const button of content.querySelectorAll('button')) {
    assert.ok((button.getAttribute('aria-label') || button.getAttribute('title') || button.textContent).trim(), `${page}: 이름 없는 버튼 금지`);
    if (button.closest('form') && !button.matches('[data-fw-send],[data-sf-reset]')) {
      assert.equal(button.type, 'button', `${page}: 도움 조작으로 요청이 전송되지 않음`);
    }
  }
  for (const control of content.querySelectorAll('input,textarea,select')) {
    assert.ok(control.labels.length || control.getAttribute('aria-label') || control.getAttribute('aria-labelledby'), `${page}: 입력에 이름 제공`);
  }
  for (const img of content.querySelectorAll('img')) assert.ok(img.getAttribute('alt')?.trim(), `${page}: 학습 그림의 대체 설명`);
  for (const element of content.querySelectorAll('[href],[src]')) {
    const value = element.getAttribute('href') ?? element.getAttribute('src');
    if (/^(?:https?:|mailto:|data:)/i.test(value)) continue;
    const target = new URL(value, pathToFileURL(absolute));
    if (target.protocol !== 'file:') { errors.push(`${page}: 잘못된 자산/이동 주소 ${value}`); continue; }
    const filename = fileURLToPath(target);
    checked++;
    if (!fs.existsSync(filename)) { errors.push(`${page}: 없는 파일 ${value}`); continue; }
    if (target.hash && filename.endsWith('.html')) {
      const anchor = decodeURIComponent(target.hash.slice(1));
      if (!read(filename).getElementById(anchor)) errors.push(`${page}: 없는 앵커 ${value}`);
    }
  }
  if (content.matches('.functional-workspace')) {
    const task = FUNCTIONAL_TASKS.find(item => item.id === content.dataset.fwTask);
    assert.ok(task);
    const context = content.querySelector('.fw-task-context');
    assert.ok(context && context.getAttribute('aria-label').includes(task.title));
    assert.equal(context.querySelector('strong').textContent, task.api.method);
    assert.equal(context.querySelector('code').textContent, task.api.path);
    assert.equal(context.querySelector('a').getAttribute('href'), '#fw-request');
    assert.equal(content.querySelectorAll('.fw-api').length, 1, '같은 API 표시를 중복해서 쌓지 않음');
    assert.equal(doc.querySelector('[data-home-controller]').dataset.homeTask, `flow-${task.id}`);
    assert.equal(doc.querySelectorAll('.fw-answer').length, 1);
    assert.equal(doc.querySelector('.fw-answer').open, false, '정답은 명시적으로 열어 본다');
    assert.equal(doc.querySelectorAll('[data-fw-state-panel]:not([hidden])').length, 1);
    assert.equal(doc.querySelector('[data-fw-status]').textContent, '미실행');
    assert.equal(doc.querySelector('[data-fw-token]').value, '');
    const ids = [...doc.querySelectorAll('[id]')].map(element => element.id);
    assert.equal(new Set(ids).size, ids.length, `${page}: 중복 id 금지`);
    assert.ok(doc.querySelector('script[src*="functional-scenario.js"][defer]'));
    assert.ok(doc.querySelector('link[href*="functional-scenario.css"]'));
    assert.ok(doc.querySelector('script[src*="functional-visual-learning.bundle.js"][defer]'));
    assert.equal(content.querySelectorAll('[data-fw-state-panel]').length, task.visualization.states.length);
    assert.equal(content.querySelectorAll('[data-frv-root], [data-fqv]').length, task.visualization.states.length,
      `${page}: 모든 비교 상태에 실제 값 모델을 표시`);
    assert.equal(content.querySelectorAll('[data-fw-view]').length, 2);
    const learningImage = content.querySelector('[data-fw-overview] img');
    assert.ok(learningImage);
    assert.equal(fileURLToPath(new URL(learningImage.getAttribute('src'), pathToFileURL(absolute))), path.join(root, approved[task.id]));
    assert.ok(content.querySelector('[data-fw-copy-request][type=button]'));
    if (task.id === 'create') {
      assert.equal(doc.querySelectorAll('[data-fnp-root]').length, 1, '작성 과제의 선택 설명 한 개');
      assert.equal(doc.querySelector('[data-fnp-open]').disabled, true, 'script 전 명시 진입 비활성');
      assert.equal(doc.querySelector('[data-fnp-dialog]').open, false);
      const focusImage = doc.querySelector('[data-fnp-image] img');
      assert.equal(fileURLToPath(new URL(focusImage.getAttribute('src'), pathToFileURL(absolute))), path.join(root, approved.newPostFocus));
      assert.equal(assets.find(asset => asset.file === approved.newPostFocus)?.approvedForTeaching, true);
      assert.ok(doc.querySelector('link[href*="functional-new-post-focus.css"]'));
    } else {
      assert.equal(doc.querySelector('[data-fnp-root]'), null, '다른 과제에는 생성 설명을 반복 노출하지 않음');
      assert.equal(doc.querySelector('link[href*="functional-new-post-focus.css"]'), null);
    }
    assert.equal(content.querySelector('[data-fw-send]').disabled, true, 'script 준비 전 기본 HTML 제출 차단');
    assert.equal(content.querySelector('[data-fw-copy-request]').disabled, true);
    assert.ok(content.querySelector('[data-fw-curl-fallback][hidden] textarea[readonly]'));
    for (const element of doc.querySelectorAll('script[src],link[rel=stylesheet][href]')) {
      const target = new URL(element.getAttribute('src') ?? element.getAttribute('href'), pathToFileURL(absolute));
      if (target.protocol !== 'file:') continue;
      const bytes = fs.readFileSync(fileURLToPath(target));
      assert.equal(target.searchParams.get('v'), createHash('sha256').update(bytes).digest('hex').slice(0, 12),
        `${page}: 현재 script/CSS와 캐시 해시 일치`);
    }
  }
}
// 원래 목차의 딥 링크를 기능 목록으로 옮기는 과정에서 없애지 않는다.
const original = new JSDOM(execFileSync('git', ['show', 'aed347f:scenario/README.html'], { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));
const catalog = read(path.join(root, 'scenario/README.html'));
for (const element of original.window.document.querySelectorAll('[id]')) {
  assert.ok(catalog.getElementById(element.id), `기존 목차 앵커 보존: ${element.id}`);
}
assert.ok(catalog.querySelector('details#legacy-scenarios .learning-journey'));
assert.equal(catalog.querySelector('details#legacy-scenarios').open, false);
assert.equal(errors.length, 0, errors.join('\n'));
original.window.close();
for (const dom of cache.values()) dom.window.close();
console.log(`생성 기능 화면 ${pages.length}개 · 실제 링크/자산 ${checked}개 · 기존 목차 앵커·미실행·정답 접기·진도 연결 검사 통과`);
