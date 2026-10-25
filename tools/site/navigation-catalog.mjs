import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const isCatalog = source => source === 'course/resources.md' || source === 'course/archive.md';

// 목록의 제목은 과정 메타를 그대로 쓰고 결함 영역·원인·해법은 추가하지 않는다.
export function renderNavigationCatalog(source, body, course) {
  if (!isCatalog(source)) return body;
  const href = target => path.posix.relative(path.posix.dirname(source), target);
  const item = (id, title, target, detail = '') => `<li>${target ? `<a href="${escape(href(target))}">` : '<span class="is-pending">'}<b>${escape(id)}</b><span>${escape(title)}</span>${detail ? `<small>${escape(detail)}</small>` : ''}${target ? '</a>' : '</span>'}</li>`;
  if (source === 'course/resources.md') {
    const java = course.java.map(entry => item(entry.id, entry.title, entry.page, entry.day ? `${entry.day} 연결` : '선택 워밍업')).join('');
    const tickets = course.tickets.filter(ticket => /^B\d{2}$/.test(ticket.id)).map(ticket => item(ticket.id, ticket.title, ticket.page, ticket.required ? '필수' : ticket.pool ? '선택 후보' : '추가 연습')).join('');
    body = body.replace('<!-- navigation-catalog:java -->', `<ul class="navigation-resource-list resource-java-list">${java}</ul>`)
      .replace('<!-- navigation-catalog:tickets -->', `<ul class="navigation-resource-list resource-ticket-list">${tickets}</ul>`);
  }
  if (source === 'course/archive.md') {
    const root = fileURLToPath(new URL('../../', import.meta.url));
    const legacyList = folder => fs.readdirSync(path.join(root, folder)).filter(name => name.endsWith('.md')).sort().map(name => {
      const title = fs.readFileSync(path.join(root, folder, name), 'utf8').match(/^# (.+)$/m)?.[1].replace(/[`*]/g, '').trim() || name.replace(/\.md$/, '');
      const id = folder === 'lessons' ? name.split('-')[0] : `T-${name.slice(0, 3)}`;
      return item(id, title.replace(new RegExp(`^${id.replace('T-', '')}[. ]*`), ''), `${folder}/${name.replace(/\.md$/, '.html')}`);
    }).join('');
    body = body.replace('<!-- navigation-catalog:lessons -->', `<ul class="navigation-resource-list">${legacyList('lessons')}</ul>`)
      .replace('<!-- navigation-catalog:legacy-tickets -->', `<ul class="navigation-resource-list">${legacyList('tickets')}</ul>`);
  }
  const dom = new JSDOM(`<article>${body}</article>`);
  const doc = dom.window.document;
  const original = doc.querySelector('article');
  const shell = doc.createElement('section');
  shell.className = 'course-guide navigation-catalog';
  shell.dataset.catalogType = source.endsWith('resources.md') ? 'resources' : 'archive';
  const head = doc.createElement('header'); head.className = 'guide-head';
  const layout = doc.createElement('div'); layout.className = 'guide-layout';
  const rail = doc.createElement('aside'); rail.className = 'guide-rail';
  const nav = doc.createElement('nav'); nav.className = 'guide-index';
  nav.setAttribute('aria-label', '이 페이지 자료');
  const list = doc.createElement('ol'); nav.append(list); rail.append(nav);
  const content = doc.createElement('div'); content.className = 'guide-content';
  let section;
  for (const node of [...original.childNodes]) {
    if (node.nodeType === 1 && node.tagName === 'H2') {
      section = doc.createElement('section'); section.className = 'guide-section';
      section.id = `${node.id}-view`; content.append(section);
      const entry = doc.createElement('li'); const link = doc.createElement('a');
      link.href = `#${node.id}`; link.textContent = node.textContent.replace(/^#\s*/, '').trim();
      entry.append(link); list.append(entry);
    }
    (section || head).append(node);
  }
  layout.append(rail, content); shell.append(head, layout);
  const result = shell.outerHTML;
  dom.window.close();
  return result;
}
