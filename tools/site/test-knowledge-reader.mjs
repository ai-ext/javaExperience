import { loadSourceBaseline } from './learning-source-baseline.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { renderKnowledgeReaderPage } from './knowledge-reader.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const baseline = loadSourceBaseline(ROOT, 'docs/design/concept-ia-2026-10-24/source-baseline.json');
const digest = (value) => createHash('sha256').update(value).digest('hex');
const normalize = (node) => node.textContent.replace(/\s+/g, ' ').trim();
const readerJs = fs.readFileSync(path.join(ROOT, 'tools/site/knowledge-reader.js'), 'utf8');
const sourcePages = baseline.pages.filter((page) => page.sourceSelector && page.file.startsWith('docs/knowledge/'));
assert.equal(sourcePages.length, 134, '기준 원문 상세 문서 수');

for (const page of sourcePages) {
  const html = fs.readFileSync(path.join(ROOT, page.file), 'utf8');
  const doc = new JSDOM(html, { url: `https://learn.example/${page.file}` }).window.document;
  const source = doc.querySelector(page.sourceSelector);
  assert.ok(source, `${page.file}: 원문 영역 존재`);
  assert.equal(digest(normalize(source)), page.sourceTextSHA256, `${page.file}: 원문 텍스트 보존`);
  assert.deepEqual([...source.querySelectorAll('pre code')].map((node) => digest(node.textContent)), page.sourceCode, `${page.file}: 코드 보존`);
  assert.equal(digest(fs.readFileSync(path.join(ROOT, page.source))), page.sourceSHA256, `${page.source}: Markdown 원본 보존`);
  for (const id of page.existingIds) assert.ok(doc.getElementById(id), `${page.file}: 기존 ID #${id} 유지`);
  assert.ok(doc.querySelector('[data-knowledge-reader]'), `${page.file}: reader root 생성`);
  assert.equal(doc.querySelectorAll('main').length, 1, `${page.file}: main landmark 하나만 존재`);
  const tocIds = [...doc.querySelectorAll('[data-kr-toc-link]')].map((link) => decodeURIComponent(link.hash.slice(1)));
  const sourceHeadingIds = [...source.querySelectorAll('details.knowledge-chapter > summary[id]')].map((node) => node.id);
  if (sourceHeadingIds.length) assert.deepEqual(tocIds, sourceHeadingIds, `${page.file}: 목차와 원문 장의 1:1 대응`);
  const metadata = JSON.parse(doc.querySelector('[data-knowledge-reader]').dataset.krMetadata);
  const tocLabels = [...doc.querySelectorAll('[data-kr-toc-link]')].map((link) => { const clone = link.cloneNode(true); clone.querySelector('span')?.remove(); return clone.textContent.trim(); });
  assert.deepEqual(metadata.headings.map((heading) => heading.id), tocIds, `${page.file}: metadata H2 ID 왕복`);
  assert.deepEqual(metadata.headings.map((heading) => heading.label), tocLabels, `${page.file}: metadata 문자열 왕복`);
  assert.equal(new Set([...doc.querySelectorAll('[id]')].map((node) => node.id)).size, doc.querySelectorAll('[id]').length, `${page.file}: 전체 생성 DOM ID 고유`);
  for (const id of ['kr-scene', 'kr-reading']) assert.equal(page.existingIds.includes(id), false, `${page.file}: reader 전용 ID #${id} 충돌 없음`);
}

let paragraphQaPages = 0;
for (const page of sourcePages) {
  const markdown = fs.readFileSync(path.join(ROOT, page.source), 'utf8');
  const headers = [...markdown.matchAll(/^## .*$/gm)];
  const qaIndex = headers.findIndex((header) => /Q&A/.test(header[0]));
  const qaHeader = headers[qaIndex];
  const qa = qaHeader ? markdown.slice(qaHeader.index + qaHeader[0].length, headers[qaIndex + 1]?.index ?? markdown.length) : '';
  const questions = [...qa.matchAll(/^\*\*Q\d+\./gm)].length;
  if (!questions) continue;
  paragraphQaPages += 1;
  const doc = new JSDOM(fs.readFileSync(path.join(ROOT, page.file), 'utf8')).window.document;
  assert.equal(doc.querySelectorAll('[data-kr-qa-answer]').length, questions, `${page.file}: 모든 strong Q&A 질문이 toggle로 출력`);
}
assert.equal(paragraphQaPages, 28, '문단 strong Q&A 문서 전수 수');

const p16Page = new JSDOM(fs.readFileSync(path.join(ROOT, 'docs/knowledge/P16-json-jackson-practical.html'), 'utf8')).window.document;
const p16SceneTitle = p16Page.querySelector('#kr-scene #p16-heading');
const p16SourceTitle = p16Page.querySelector('#kr-reading h1.kr-source-title');
assert.ok(p16SceneTitle, 'P16 장면 질문 제목 유지');
assert.equal(p16SceneTitle.classList.contains('p16-original-title'), false, 'P16 장면 질문 제목은 숨김 원문 class를 사용하지 않음');
assert.ok(p16SourceTitle?.classList.contains('p16-original-title'), 'P16 원문 제목에만 숨김 class 적용');
assert.equal(new Set([...p16Page.querySelectorAll('[id]')].map((node) => node.id)).size, p16Page.querySelectorAll('[id]').length, 'P16 생성 DOM ID 고유');

const page = (file, suffix = '') => new JSDOM(fs.readFileSync(path.join(ROOT, file), 'utf8'), {
  url: `https://learn.example/${file}${suffix}`, runScripts: 'outside-only', pretendToBeVisual: true,
});
const p09 = page('docs/knowledge/P09-java-syntax-basics.html', '?foreign=keep#1-%ED%95%9C-%EC%A4%84%EB%A1%9C-%EB%A7%90%ED%95%98%EB%A9%B4');
p09.window.HTMLElement.prototype.scrollIntoView = function () {};
p09.window.eval(readerJs);
const doc = p09.window.document;
doc.dispatchEvent(new p09.window.Event('DOMContentLoaded'));
const root = doc.querySelector('[data-knowledge-reader]');
assert.equal(root.dataset.krMode, 'read', '원문 해시 진입은 읽기 모드');
assert.equal(p09.window.location.search, '?foreign=keep&read=1', '기존 query 보존');
assert.equal(doc.querySelector('#p09-original').open, true, '전체 원문 wrapper는 읽기 모드에서 열림');
assert.ok(doc.getElementById('1-한-줄로-말하면').closest('details').open, '원문 해시의 장 노출');
const quiz = [...doc.querySelectorAll('details.knowledge-topic')].find((item) => /자가\s*점검/.test(item.querySelector('summary')?.textContent || ''));
if (quiz) assert.equal(quiz.open, false, '자가 점검 답은 기본 접힘');
const scene = root.querySelector('[data-kr-mode="scene"]');
scene.click();
assert.equal(root.dataset.krMode, 'scene', '장면 모드 전환');
assert.equal(p09.window.history.state.__javaExperienceKnowledgeReader, 'scene', 'reader 전용 history key');
assert.equal(p09.window.location.search, '?foreign=keep', '장면 복귀 시 read query만 제거');
assert.equal(p09.window.location.hash, '', '읽기 원문 해시만 장면 전환 시 정리');
const foreignState = { existingKey: 'keep', __javaExperienceKnowledgeReader: 'scene' };
p09.window.history.replaceState(foreignState, '', '?foreign=keep#%E0%A4%A');
p09.window.dispatchEvent(new p09.window.HashChangeEvent('hashchange'));
assert.doesNotThrow(() => p09.window.eval(readerJs), '초기화 재호출은 안전');
assert.equal(p09.window.history.state.existingKey, 'keep', '외부 history state 보존');
assert.ok(doc.querySelector('.kr-toolbar [data-kc-catalog-return]'), '기존 카탈로그 복귀 링크를 toolbar에서 제공');
p09.window.history.replaceState(foreignState, '', '?read=1&foreign=keep#%E0%A4%A');
p09.window.dispatchEvent(new p09.window.HashChangeEvent('hashchange'));
assert.equal(root.dataset.krMode, 'read', 'read query는 오래된 scene history key보다 우선');
p09.window.close();

const j01 = page('docs/knowledge/J01-types-string.html');
j01.window.HTMLElement.prototype.scrollIntoView = function () {};
j01.window.eval(readerJs);
j01.window.document.dispatchEvent(new j01.window.Event('DOMContentLoaded'));
const generalRoot = j01.window.document.querySelector('[data-knowledge-reader]');
assert.equal(generalRoot.dataset.krMode, 'read', '일반 문서는 기본 읽기 모드');
assert.equal(generalRoot.querySelector('.kr-controls').hidden, true, '실제 조작이 없는 문서는 장면 버튼 숨김');
j01.window.close();

const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
assert.match(home, /class="home-concept-direct"[^>]+href="docs\/knowledge\/README\.html"/, '홈 intro에서 개념 목록으로 직행');
const catalog = new JSDOM(fs.readFileSync(path.join(ROOT, 'docs/knowledge/README.html'), 'utf8')).window.document;
const row = catalog.querySelector('[data-kc-document="P09"]');
assert.equal(row.querySelector('h3 a[data-kc-open]').getAttribute('href').includes('read=1'), false, '질문 제목은 기존 장면 링크');
assert.match(row.querySelector('.kc-result-open').getAttribute('href'), /[?&]read=1$/, '기존 보조 링크는 설명 읽기로 직행');
assert.equal(row.querySelector('.kc-result-open').dataset.kcOpen, 'P09', '기존 카탈로그 복귀 식별자 유지');
assert.equal(row.querySelectorAll('.kc-result-open').length, 1, '설명 읽기 링크는 기존 한 곳만 사용');
assert.equal(row.querySelector('.kc-result-read'), null, '중복 설명 읽기 링크 없음');

const roundTrip = new JSDOM(renderKnowledgeReaderPage({
  title: '<h1 id="generics-title">List&lt;T&gt; — 제네릭</h1>',
  visual: '',
  source: '<details class="knowledge-chapter"><summary id="generics"><span class="knowledge-chapter-heading"><strong role="heading">List&lt;T&gt; 선언</strong></span></summary></details>',
})).window.document;
const roundTripMetadata = JSON.parse(roundTrip.querySelector('[data-knowledge-reader]').dataset.krMetadata);
assert.equal(roundTripMetadata.title, 'List<T> — 제네릭', 'JSON metadata title의 <T> 왕복');
assert.equal(roundTripMetadata.headings[0].label, 'List<T> 선언', 'JSON metadata heading의 <T> 왕복');

const readModePage = (file) => {
  const dom = page(file, '?read=1');
  dom.window.HTMLElement.prototype.scrollIntoView = function () {};
  dom.window.eval(readerJs);
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  return dom;
};
for (const file of ['docs/knowledge/P09-java-syntax-basics.html', 'docs/knowledge/J01-types-string.html', 'docs/knowledge/S09-jpa-hibernate.html', 'docs/knowledge/W11-why-tx-in-service.html']) {
  const dom = readModePage(file);
  const doc = dom.window.document;
  const chapters = [...doc.querySelectorAll('details.knowledge-chapter')];
  const chapterTitle = (item) => item.querySelector('.knowledge-chapter-heading strong')?.textContent || '';
  const qa = chapters.find((item) => /자가\s*점검.*Q&A|Q&A.*면접/i.test(chapterTitle(item)));
  const references = chapters.find((item) => /참고문헌|참고\s*자료/i.test(chapterTitle(item)));
  assert.ok(qa, `${file}: 자가점검 chapter 존재`);
  assert.equal(qa.open, true, `${file}: Q&A 질문 chapter 노출`);
  assert.ok([...qa.querySelectorAll('details.knowledge-topic')].length > 0, `${file}: Q&A 항목 존재`);
  assert.ok([...qa.querySelectorAll('details.knowledge-topic')].every((topic) => topic.open === false), `${file}: Q&A 답변은 접힘`);
  assert.ok(references, `${file}: 참고문헌 chapter 존재`);
  assert.equal(references.open, false, `${file}: 참고문헌 chapter 접힘`);
  assert.ok(chapters.some((item) => item.open && ![qa, references].includes(item)), `${file}: core chapter 노출`);
  dom.window.close();
}

for (const [file, count] of [
  ['docs/knowledge/P11-bean-registration-di.html', 6],
  ['docs/knowledge/R03-schema-types-constraints.html', 6],
  ['docs/knowledge/R04-sql-crud-join.html', 7],
  ['docs/knowledge/B01-account-lifecycle.html', 6],
  ['docs/knowledge/D10-database-basics.html', 8],
]) {
  const dom = readModePage(file);
  const qa = [...dom.window.document.querySelectorAll('details.knowledge-chapter')]
    .find((chapter) => /자가\s*점검.*Q&A/i.test(chapter.querySelector('.knowledge-chapter-heading strong')?.textContent || ''));
  assert.ok(qa?.open, `${file}: 원문 문단형 Q&A chapter 열림`);
  const answers = [...qa.querySelectorAll('details.knowledge-topic[data-kr-qa-answer]')];
  assert.equal(answers.length, count, `${file}: 질문 원문을 토글로 변환`);
  assert.ok(answers.every((answer) => !answer.open), `${file}: 문단형 Q&A 답은 접힘`);
  assert.ok(answers.every((answer) => answer.querySelector('summary')?.textContent.trim()), `${file}: 질문 원문이 summary에 보임`);
  assert.ok(answers.every((answer) => answer.querySelector('.knowledge-topic-body')?.textContent.trim()), `${file}: 각 답 본문 노드가 보존됨`);
  dom.window.close();
}
const p11Read = readModePage('docs/knowledge/P11-bean-registration-di.html');
const p11Questions = [...p11Read.window.document.querySelectorAll('details[data-kr-qa-answer] > summary')].map((summary) => summary.textContent.trim());
assert.equal(p11Questions[0], 'Bean과 new 객체는 어떻게 다른가?', 'P11 첫 strong 질문은 번호를 추가하지 않고 summary로 이동');
assert.equal(p11Questions[0].startsWith('Q1.'), false, 'P11 원문에 없던 Q1 라벨을 만들지 않음');
p11Read.window.close();

const j03Read = readModePage('docs/knowledge/J03-generics.html');
const versionDetails = j03Read.window.document.querySelector('details.version-original');
assert.ok(versionDetails, 'J03 원문 버전 표 details 유지');
assert.equal(versionDetails.open, false, 'J03 원문 버전 표는 선택형으로 접힘');
assert.ok(versionDetails.querySelector(':scope > summary')?.textContent.includes('원문 표 보기'), 'J03 접힌 버전 표 summary가 남아 직접 열 수 있음');
j03Read.window.close();

const r03Read = readModePage('docs/knowledge/R03-schema-types-constraints.html');
const r03Reader = r03Read.window.document.querySelector('[data-knowledge-reader]');
assert.equal(r03Read.window.document.querySelector('#kr-scene h1'), null, 'R03 scene은 고유 H1이 없음');
assert.equal(r03Reader.querySelector('.kr-toolbar-title h1')?.textContent.trim(), 'R03. 스키마와 테이블 설계', 'R03 toolbar 제목이 scene H1 역할');
assert.ok(r03Reader.querySelector('#kr-reading h1.kr-reading-title'), 'R03 read에는 짧은 H1 존재');
r03Read.window.close();

const p09SceneHeadings = new JSDOM(fs.readFileSync(path.join(ROOT, 'docs/knowledge/P09-java-syntax-basics.html'), 'utf8')).window.document;
assert.ok(p09SceneHeadings.querySelector('#kr-scene h1'), 'P09 scene 기존 H1 보존');
assert.equal(p09SceneHeadings.querySelector('.kr-toolbar-title h2')?.textContent.trim(), 'P09. Java 문법 기초', 'scene H1이 있으면 toolbar는 H2');
const p16SceneHeadings = new JSDOM(fs.readFileSync(path.join(ROOT, 'docs/knowledge/P16-json-jackson-practical.html'), 'utf8')).window.document;
assert.ok(p16SceneHeadings.querySelector('#kr-scene h1#p16-heading'), 'P16 scene H1 및 ID 보존');
assert.equal(p16SceneHeadings.querySelector('.kr-toolbar-title h2')?.textContent.trim(), 'P16. JSON·Jackson 실무', 'P16 toolbar는 중복 H1 대신 H2');

const focusPage = page('docs/knowledge/P09-java-syntax-basics.html');
focusPage.window.HTMLElement.prototype.scrollIntoView = function () {};
focusPage.window.eval(readerJs);
focusPage.window.document.dispatchEvent(new focusPage.window.Event('DOMContentLoaded'));
const focusDoc = focusPage.window.document;
assert.equal(focusDoc.querySelector('[data-knowledge-reader]').dataset.krMode, 'scene', 'P09는 장면부터 시작');
const readButton = focusDoc.querySelector('[data-kr-mode="read"]');
readButton.focus(); readButton.click();
assert.equal(focusDoc.activeElement, focusDoc.querySelector('.kr-reading-title'), '읽기 전환은 새 제목으로 focus 이동');
focusPage.window.close();

const titleHashPage = page('docs/knowledge/P09-java-syntax-basics.html', '#p09-java-%EB%AC%B8%EB%B2%95-%EA%B8%B0%EC%B4%88--%ED%81%B4%EB%9E%98%EC%8A%A4%ED%95%84%EB%93%9C%EB%A9%94%EC%84%9C%EB%93%9C%EC%83%9D%EC%84%B1%EC%9E%90%EB%A5%BC-%EC%84%A0%EC%96%B8%ED%95%98%EA%B3%A0-%ED%98%B8%EC%B6%9C%ED%95%98%EA%B8%B0');
titleHashPage.window.HTMLElement.prototype.scrollIntoView = function () {};
titleHashPage.window.eval(readerJs);
titleHashPage.window.document.dispatchEvent(new titleHashPage.window.Event('DOMContentLoaded'));
assert.equal(titleHashPage.window.document.activeElement, titleHashPage.window.document.querySelector('.kr-reading-title'), '숨긴 원문 H1 hash는 새 제목에 focus');
titleHashPage.window.close();

console.log('PASS reader: 134개 원문·코드·ID·Markdown baseline, single main, parent chapter state, focus/hash/history, metadata and catalog contracts');
