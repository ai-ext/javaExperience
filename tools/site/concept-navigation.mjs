import path from 'node:path';
import { CORE_UNITS, DOMAINS, classifyConcept } from './concept-curriculum.mjs';
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// 개념 영역만 묶는다. 다른 대주제의 레일과 주소는 변경하지 않는다.
export function renderConceptNavigation(source) {
  const href = target => path.posix.relative(path.posix.dirname(source), target);
  const core = source === 'lessons/concept-core.md';
  const id = path.posix.basename(source).match(/^([A-Z]\d{2})-/)?.[1];
  let domain; try { if (source.startsWith('docs/knowledge/') && id) domain = classifyConcept(id).domain; } catch {}
  const link = (target, label, current = false) => `<a href="${esc(href(target))}"${current ? ' aria-current="page"' : ''}>${esc(label)}</a>`;
  const groups = `<details class="concept-nav-group" data-concept-nav="units"${core ? ' open' : ''}><summary>필수 기초 · 6단원</summary>${CORE_UNITS.map(unit => link(`lessons/concept-core.html?unit=${unit.id}`, `${unit.id} · ${unit.title}`, core && unit.id === 'C01')).join('')}</details>
  <details class="concept-nav-group" data-concept-nav="domains"${!core && source !== 'docs/knowledge/README.md' ? ' open' : ''}><summary>분야별 개념 · 134문서</summary>${DOMAINS.map(item => `<span data-concept-domain="${item.id}"${domain === item.id ? ' data-concept-current="true"' : ''}>${link(`docs/knowledge/README.html#kc-category-${item.id}`, item.label)}</span>`).join('')}</details>`;
  return `<p class="page-sidebar-caption">개념 학습</p><nav class="section-navigation" aria-label="개념 학습 영역">${link('docs/knowledge/README.html','개념 목록',!core && !source.startsWith('lessons/'))}${groups}${link('lessons/README.html','레슨',source.startsWith('lessons/')&&!core)}</nav>`;
}
