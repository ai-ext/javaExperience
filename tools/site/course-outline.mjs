import { JSDOM } from 'jsdom';
import { marked } from 'marked';

const guideType = source => {
  if (source === 'course/README.md') return { kind: 'overview', tag: '가이드', label: '과정 안내' };
  if (source === 'course/spring/README.md') return { kind: 'days', tag: '일정', label: '일자 목록' };
  if (source === 'course/spec-v2.md') return { kind: 'spec', tag: 'SPEC', label: '서버 명세' };
  if (/^course\/java\/J\d{2}\.md$/.test(source)) return { kind: 'java', tag: source.match(/J\d{2}/)[0], label: 'Java 연습' };
  if (/^course\/tickets\/(?:[BE]\d{2}|drill)\.md$/.test(source)) return { kind: 'ticket', tag: source.match(/([^/]+)\.md$/)[1].toUpperCase(), label: '티켓 과제' };
  if (/^course\/start\/.+\.md$/.test(source)) return { kind: 'start', tag: '참고', label: '출발 자료' };
  return null;
};

// 과정 설명은 흐름으로 읽고, 요청·응답·SQL·설정의 비교 표는 그대로 보존한다.
function isOutlineTable(source, headings) {
  if (['course/README.md', 'course/spring/README.md'].includes(source)) return headings.some(label => /^(일|일자|단계)$/.test(label));
  if (source.startsWith('course/start/')) return /^(파일|날·순서)$/.test(headings[0]);
  if (source === 'course/spec-v2.md') return headings.join('|') === '영역|기능';
  return false;
}

// 과정 안내에는 빈 줄 뒤의 일정 행이 문단으로 파싱되는 구간이 있다.
// 인접한 일정 행만 같은 tbody에 복원해 원문의 뒤쪽 일자도 흐름에 포함한다.
function appendScheduleContinuation(doc, source, table, headings) {
  if (source !== 'course/README.md' || headings[0] !== '일') return;
  const after = (table.closest('.table-wrap') || table).nextElementSibling;
  if (after?.tagName !== 'P') return;
  const lines = after.innerHTML.trim().split('\n');
  if (!lines.every(line => /^\|\s*D\d{2}\s*\|/.test(line))) return;
  const scratch = doc.createElement('div');
  scratch.innerHTML = marked.parse(`| ${headings.join(' | ')} |\n| ${headings.map(() => '---').join(' | ')} |\n${lines.join('\n')}`);
  const rows = [...scratch.querySelectorAll('tbody tr')];
  if (rows.length !== lines.length || rows.some(row => row.children.length !== headings.length)) throw new Error('과정 일정의 연속 행을 복원할 수 없다');
  table.querySelector('tbody').append(...rows);
  after.remove();
}

function renderOutline(doc, table, headings) {
  const flow = doc.createElement('ol');
  flow.className = 'course-outline';
  if (table.id) flow.id = table.id;
  flow.setAttribute('aria-label', headings.some(label => /^(일|일자)$/.test(label)) ? '일자별 과정 흐름' : '과정 단계 흐름');
  for (const row of table.querySelectorAll('tbody tr')) {
    const item = doc.createElement('li');
    if (row.id) item.id = row.id;
    [...row.children].forEach((cell, index) => {
      const field = doc.createElement(index === 0 ? 'h3' : 'p');
      if (cell.id) field.id = cell.id;
      const label = doc.createElement('small');
      label.textContent = headings[index] || '';
      field.append(label, ...cell.childNodes);
      item.append(field);
    });
    flow.append(item);
  }
  const parent = table.parentElement;
  if (parent.classList.contains('table-wrap') && parent.children.length === 1) parent.replaceWith(flow);
  else table.replaceWith(flow);
}

// 기존 노드를 옮겨 복사·다운로드·접기와 본문 앵커의 연결을 유지한다.
export function renderCourseOutline(source, html) {
  const type = guideType(source);
  if (!type) return html;
  const doc = new JSDOM(`<article>${html}</article>`).window.document;
  const article = doc.querySelector('article');
  if (article.querySelector(':scope > .course-guide')) { doc.defaultView.close(); return html; }
  for (const table of article.querySelectorAll('table')) {
    const headings = [...table.querySelectorAll('thead th')].map(node => node.textContent.trim());
    if (isOutlineTable(source, headings)) {
      appendScheduleContinuation(doc, source, table, headings);
      renderOutline(doc, table, headings);
    }
  }
  const shell = doc.createElement('section');
  shell.className = `course-guide guide-${type.kind}`;
  shell.dataset.guideKind = type.kind;
  const layout = doc.createElement('div');
  layout.className = 'guide-layout';
  const rail = doc.createElement('aside');
  rail.className = 'guide-rail';
  rail.setAttribute('aria-label', `${type.label} 목차`);
  const tag = doc.createElement('span');
  tag.className = 'guide-type';
  tag.setAttribute('aria-hidden', 'true');
  tag.textContent = type.tag;
  const title = doc.createElement('h2');
  title.textContent = type.label;
  rail.append(tag, title);
  const nav = doc.createElement('nav');
  nav.className = 'guide-index';
  nav.setAttribute('aria-label', '이 페이지 순서');
  const list = doc.createElement('ol');
  // 접힌 힌트·정답이나 코드 블록 안의 제목은 목차에 복제하지 않는다.
  const headings = [...article.querySelectorAll('h2')].filter(heading => !heading.closest('details, pre, .exercise-answer'));
  for (const [index, heading] of headings.entries()) {
    if (!heading.id) {
      let id = `guide-section-${index + 1}`;
      while (doc.getElementById(id)) id += '-section';
      heading.id = id;
    }
    const item = doc.createElement('li');
    const link = doc.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent.replace(/^#\s*/, '').trim();
    item.append(link);
    list.append(item);
  }
  if (type.kind === 'days') {
    for (const link of article.querySelectorAll('.course-outline h3 a[href]')) {
      const item = doc.createElement('li');
      item.append(link.cloneNode(true));
      list.append(item);
    }
  }
  nav.append(list);
  if (list.children.length) rail.append(nav);
  const content = doc.createElement('div');
  content.className = 'guide-content';
  content.append(...article.childNodes);
  // 설명·출발 문서의 절도 독립된 체크리스트 패널로 읽는다.
  if (['overview', 'start', 'spec'].includes(type.kind)) {
    for (const heading of [...content.querySelectorAll(':scope > h2')]) {
      const section = doc.createElement('section');
      section.className = 'guide-section';
      section.setAttribute('aria-labelledby', heading.id);
      heading.before(section);
      section.append(heading);
      while (section.nextElementSibling && !section.nextElementSibling.matches('h2')) section.append(section.nextElementSibling);
    }
  }
  layout.append(rail, content);
  shell.append(layout);
  article.append(shell);
  const result = article.innerHTML;
  doc.defaultView.close();
  return result;
}
