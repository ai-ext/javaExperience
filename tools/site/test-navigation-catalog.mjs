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

test('자료 목록은 Java·티켓 실제 메타를 연결하며 원인 영역을 노출하지 않는다', () => {
  const dom = render('course/resources.md'), doc = dom.window.document;
  assert.equal(doc.querySelectorAll('h1').length, 1);
  assert.equal(doc.querySelectorAll('.guide-index').length, 1);
  assert.equal(doc.querySelectorAll('.guide-index a').length, 5);
  assert.equal(doc.querySelectorAll('.resource-java-list li').length, course.java.length);
  const tickets = course.tickets.filter(ticket => /^B\d{2}$/.test(ticket.id));
  assert.equal(doc.querySelectorAll('.resource-ticket-list li').length, tickets.length);
  for (const entry of course.java) {
    assert.equal(doc.querySelector(`.resource-java-list a[href="java/${entry.id}.html"] span`).textContent, entry.title);
  }
  for (const ticket of tickets) {
    const link = doc.querySelector(`.resource-ticket-list a[href="tickets/${ticket.id}.html"]`);
    assert.equal(link.querySelector('span').textContent, ticket.title);
    assert.equal(link.querySelector('small').textContent, ticket.required ? '필수' : ticket.pool ? '선택 후보' : '추가 연습');
  }
  assert.equal(doc.querySelector('.resource-ticket-list [data-area]'), null);
  assert.doesNotMatch(doc.querySelector('.resource-ticket-list').textContent, /self-invocation|gap lock|캐시 무효화|인가 규칙 순서/);
  for (const link of doc.querySelectorAll('.guide-index a')) assert.ok(doc.getElementById(link.hash.slice(1)), link.hash);
  dom.window.close();
});

test('미준비 목록은 링크 대신 상태를 표시하고 메타의 HTML 문자를 이스케이프한다', () => {
  const dom = render('course/resources.md', {java:[{id:'J99',title:'<script>예시</script>',page:null}], tickets:[{id:'B99',title:'관찰 & 비교',page:null}]});
  const doc = dom.window.document;
  assert.equal(doc.querySelector('.resource-java-list a'), null);
  assert.equal(doc.querySelector('.resource-java-list script'), null);
  assert.equal(doc.querySelector('.resource-java-list span span').textContent, '<script>예시</script>');
  assert.equal(doc.querySelector('.resource-ticket-list span span').textContent, '관찰 & 비교');
  dom.window.close();
});

test('이전 과정은 서비스·미션과 모든 레슨·기존 티켓의 실제 경로를 제공한다', () => {
  const dom = render('course/archive.md'), doc = dom.window.document;
  assert.equal(doc.querySelectorAll('h1').length, 1);
  for (const [section, folder] of [['archive-lessons', 'lessons'], ['archive-tickets', 'tickets']]) {
    const names = fs.readdirSync(new URL(`${folder}/`, root)).filter(name => name.endsWith('.md'));
    const links = [...doc.querySelectorAll(`#${section}-view .navigation-resource-list a`)];
    assert.equal(links.length, names.length);
    for (const name of names) assert.ok(links.some(link => link.getAttribute('href') === `../${folder}/${name.replace(/\.md$/, '.html')}`), name);
  }
  assert.ok(doc.querySelector('a[href="../scenario/README.md"]'));
  assert.ok(doc.querySelector('a[href="../practice/MISSIONS.md"]'));
  dom.window.close();
});

test('목록 밖의 학습 본문은 변경하지 않는다', () => {
  const body = '<h1>기존 실습</h1><pre>한 줄 코드</pre>';
  assert.equal(renderNavigationCatalog('course/java/J01.md', body, course), body);
});
