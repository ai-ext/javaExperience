import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { JSDOM } from 'jsdom';
import { loadCourse } from './course-pages.mjs';
import { renderNavigationCatalog } from './navigation-catalog.mjs';

const root = new URL('../../', import.meta.url);
const course = loadCourse(fileURLToPath(root));
function render(source, data = course) {
  const body = marked.parse(fs.readFileSync(new URL(source, root), 'utf8'));
  return new JSDOM(renderNavigationCatalog(source, body, data), {url: new URL(source, 'https://example.test/').href});
}

test('Java와 티켓은 각자의 직접 목록에서 실제 메타를 연결한다', () => {
  for (const [source, entries, selector] of [
    ['course/java/README.md', course.java, '.resource-java-list'],
    ['course/tickets/README.md', course.tickets, '.resource-ticket-list'],
  ]) {
    const dom = render(source), doc = dom.window.document;
    assert.equal(doc.querySelectorAll('h1').length, 1);
    assert.equal(doc.querySelectorAll(`${selector} li`).length, entries.length);
    for (const entry of entries) {
      const link = doc.querySelector(`${selector} a[href="${entry.page.split('/').pop()}"]`);
      assert.equal(link.querySelector('span').textContent, entry.title);
    }
    assert.doesNotMatch(doc.querySelector(selector).textContent, /self-invocation|gap lock|캐시 무효화|인가 규칙 순서/);
    dom.window.close();
  }
});

test('미준비 목록은 링크 대신 상태를 표시하고 메타의 HTML 문자를 이스케이프한다', () => {
  const dom = render('course/java/README.md', {java:[{id:'J99',title:'<script>예시</script>',page:null}], tickets:[]});
  const doc = dom.window.document;
  assert.equal(doc.querySelector('.resource-java-list a'), null);
  assert.equal(doc.querySelector('.resource-java-list script'), null);
  assert.equal(doc.querySelector('.resource-java-list span span').textContent, '<script>예시</script>');
  dom.window.close();
});

test('레슨과 구현 티켓은 서로 다른 전체 목록으로 한 번씩 연결한다', () => {
  for (const folder of ['lessons', 'tickets']) {
    const dom = render(`${folder}/README.md`), doc = dom.window.document;
    const names = fs.readdirSync(new URL(`${folder}/`, root)).filter(name => name.endsWith('.md') && name !== 'README.md');
    const links = [...doc.querySelectorAll('.navigation-resource-list a')];
    assert.equal(links.length, names.length);
    for (const name of names) assert.ok(links.some(link => link.getAttribute('href') === name.replace(/\.md$/, '.html')), name);
    dom.window.close();
  }
});

test('묶음 주소는 짧은 안내만 남기며 학습 본문에는 목록을 주입하지 않는다', () => {
  for (const source of ['course/resources.md', 'course/archive.md']) {
    const body = fs.readFileSync(new URL(source, root), 'utf8');
    assert.doesNotMatch(body, /navigation-catalog:|이전 과정|옛 과정|예전 과정/);
    assert.equal(renderNavigationCatalog(source, body, course), body);
    assert.ok(body.length < 350);
  }
  const body = '<h1>기존 실습</h1><pre>한 줄 코드</pre>';
  assert.equal(renderNavigationCatalog('course/java/J01.md', body, course), body);
});
