// Source: p1-spec-roadmap/tools/site/course-content.mjs (SHA-256 d2fddcf46e6767015c88fbaf052b6630b1289f8eb247833ae7969ea245275b52)
import { JSDOM } from 'jsdom';

const layouts = new Set(['contract', 'sequence', 'comparison', 'evidence']);

function trimBoundary(fragment, fromStart) {
  const walker = fragment.ownerDocument.createTreeWalker(fragment, 4);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  if (!fromStart) texts.reverse();
  for (const text of texts) {
    text.textContent = fromStart ? text.textContent.trimStart() : text.textContent.trimEnd();
    if (text.textContent) break;
  }
}

function splitCriterion(item) {
  if (item.querySelector('.criterion-result')) return;
  const doc = item.ownerDocument;
  const walker = doc.createTreeWalker(item, 4);
  let text;
  while ((text = walker.nextNode())) {
    // 코드와 링크 안의 화살표는 대조 구분자로 나누지 않는다.
    if (text.parentElement.closest('code, pre, a')) continue;
    const at = text.textContent.indexOf('→');
    if (at < 0) continue;
    const before = doc.createRange();
    before.selectNodeContents(item);
    before.setEnd(text, at);
    const after = doc.createRange();
    after.selectNodeContents(item);
    after.setStart(text, at + 1);
    const left = before.cloneContents(), right = after.cloneContents();
    const spacing = [left.textContent.match(/\s*$/)[0], right.textContent.match(/^\s*/)[0]];
    trimBoundary(left, false); trimBoundary(right, true);
    if (!left.textContent.trim() || !right.textContent.trim()) return;
    const condition = doc.createElement('span'); condition.className = 'criterion-condition'; condition.append(left);
    const result = doc.createElement('span'); result.className = 'criterion-result'; result.append(right);
    const arrow = doc.createElement('span'); arrow.className = 'criterion-arrow'; arrow.textContent = `${spacing[0]}→${spacing[1]}`;
    item.replaceChildren(condition, arrow, result);
    item.classList.add('has-result');
    return;
  }
}

export function renderLearningContent(html, steps = []) {
  // JSDOM은 pre 내부 HTML을 재직렬화할 수 있어 파싱 전에 원문 블록을 주석으로 격리한다.
  const preservedPre = [];
  const prepared = html.replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, (source) => {
    let marker = `<!--course-criteria-pre-${preservedPre.length}-->`;
    let suffix = 0;
    while (html.includes(marker)) marker = `<!--course-criteria-pre-${preservedPre.length}-${++suffix}-->`;
    preservedPre.push([marker, source]);
    return marker;
  });
  const fragment = JSDOM.fragment(prepared);
  for (const step of steps) {
    if (!layouts.has(step.presentation)) throw new Error(`${step.id}: 표시 유형이 없다`);
    const section = fragment.querySelector(`#step-${step.id.toLowerCase()}`);
    if (section) section.dataset.presentation = step.presentation;
  }
  for (const list of fragment.querySelectorAll('.fact-done > ul')) {
    list.classList.add('criteria-list');
    const layout = list.closest('.day-step')?.dataset.presentation;
    if (layout === 'contract' || layout === 'comparison') {
      for (const item of list.querySelectorAll(':scope > li')) splitCriterion(item);
    }
  }
  for (const observation of fragment.querySelectorAll('.step-observations')) {
    const required = observation.querySelector('summary')?.textContent.startsWith('꼭 할 관찰');
    observation.classList.toggle('is-required-observation', Boolean(required));
    if (required) observation.open = true;
    observation.querySelector(':scope > ul')?.classList.add('observation-records');
  }
  for (const item of fragment.querySelectorAll('.sql-questions > li')) {
    const paragraphs = item.querySelectorAll(':scope > p');
    paragraphs[0]?.classList.add('sql-task');
    paragraphs[1]?.classList.add('sql-evidence');
  }
  const container = fragment.ownerDocument.createElement('div');
  container.append(fragment);
  let rendered = container.innerHTML;
  for (const [marker, source] of preservedPre) rendered = rendered.replace(marker, source);
  return rendered;
}
