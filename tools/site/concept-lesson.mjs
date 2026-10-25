import { JSDOM } from 'jsdom';

// 레슨 원문을 H2 단위로 묶는다. H3 이하와 코드·표·앵커는 같은 절 안에서 보존한다.
export function renderConceptLesson(source, html) {
  if (!/^lessons\/(?!README\.md$|concept-core\.md$).+\.md$/.test(source)) return html;
  const dom = new JSDOM(`<article>${html}</article>`), doc = dom.window.document;
  const original = doc.querySelector('article');
  const shell = doc.createElement('section'); shell.className = 'course-guide concept-lesson';
  const head = doc.createElement('header'); head.className = 'guide-head';
  const layout = doc.createElement('div'); layout.className = 'guide-layout';
  const rail = doc.createElement('aside'); rail.className = 'guide-rail';
  const nav = doc.createElement('nav'); nav.className = 'guide-index'; nav.setAttribute('aria-label', '레슨 내용');
  const content = doc.createElement('div'); content.className = 'guide-content';
  let section;
  for (const node of [...original.childNodes]) {
    if (node.nodeType === 1 && node.tagName === 'H2') {
      section = doc.createElement('section'); section.className = 'guide-section';
      section.id = `${node.id}-view`; content.append(section);
      if (!shell.dataset.conceptDefault) shell.dataset.conceptDefault = node.id;
      const link = doc.createElement('a'); link.href = `#${node.id}`; link.textContent = node.textContent.replace(/^#\s*/, ''); nav.append(link);
    }
    (section || head).append(node);
  }
  rail.append(nav); layout.append(rail, content); shell.append(head, layout);
  const result = shell.outerHTML; dom.window.close(); return result;
}
