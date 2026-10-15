import fs from 'node:fs';
import path from 'node:path';

const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function parseKnowledge(markdown) {
  const groups = [];
  let group = null;
  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+?)\s*#*$/);
    if (heading) {
      group = { heading: heading[1].trim(), code: heading[1].trim().match(/^([A-Z])\s*[—-]/)?.[1] || '', topics: [] };
      groups.push(group);
      continue;
    }
    if (!group || !line.trim().startsWith('|')) continue;
    // Markdown table cells may contain pipes in inline code; the document's first
    // cell is a link, so capture that link directly rather than splitting cells.
    const match = line.match(/^\s*\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*(.*?)\s*\|?\s*$/);
    if (!match || /^[-: ]+$/.test(match[1])) continue;
    group.topics.push({ title: match[1].trim(), href: match[2].trim(), summary: match[3].trim() });
  }
  return groups.filter((item) => item.topics.length);
}

/** README.md에서 지식 문서 카테고리와 항목을 읽어 시각적 탐색 영역을 만든다. */
export function renderKnowledgeVisual(root, fromAbs) {
  const readmePath = path.join(root, 'docs/knowledge/README.md');
  if (!fs.existsSync(readmePath)) return '';
  const groups = parseKnowledge(fs.readFileSync(readmePath, 'utf8'));
  if (!groups.length) return '';
  const base = path.relative(path.dirname(fromAbs), path.dirname(readmePath)).split(path.sep).join('/') || '.';
  const idFor = (index) => `knowledge-category-${index + 1}`;
  const total = groups.reduce((sum, item) => sum + item.topics.length, 0);
  const categoryMap = groups.map((item, index) => `<a class="knowledge-map-link" href="#${idFor(index)}"><span class="knowledge-map-code">${esc(item.code || String(index + 1).padStart(2, '0'))}</span><span>${esc(item.heading.replace(/^[A-Z]\s*[—-]\s*/, ''))}</span><b>${item.topics.length}</b></a>`).join('');
  const cards = groups.map((item, index) => `<details class="knowledge-category" id="${idFor(index)}"><summary class="knowledge-category-heading"><span class="knowledge-category-index">${esc(item.code || String(index + 1).padStart(2, '0'))}</span><strong id="${idFor(index)}-title">${esc(item.heading.replace(/^[A-Z]\s*[—-]\s*/, ''))}</strong><span class="knowledge-category-count">${item.topics.length}개 문서</span></summary><ul class="knowledge-topic-grid">${item.topics.map((topic) => {
    const href = `${base}/${topic.href.replace(/\.md$/i, '.html')}`;
    return `<li><a class="knowledge-topic-card" href="${esc(href)}"><span class="knowledge-topic-title">${esc(topic.title)}</span><span class="knowledge-topic-summary">${esc(topic.summary.replace(/`/g, ''))}</span><span class="knowledge-topic-open" aria-hidden="true">읽기 <span>↗</span></span></a></li>`;
  }).join('')}</ul></details>`).join('');
  return `<section class="knowledge-visual" aria-labelledby="knowledge-visual-title"><header class="knowledge-visual-header"><p class="knowledge-visual-kicker">BACKEND KNOWLEDGE MAP</p><h2 id="knowledge-visual-title">무엇을 공부할까요?</h2><p>필요한 주제를 고르고, 카드에서 바로 문서로 이동하세요.</p><span class="knowledge-visual-total">${groups.length}개 분야 · ${total}개 문서</span></header><nav class="knowledge-category-map" aria-label="공부자료 분야">${categoryMap}</nav><div class="knowledge-category-list">${cards}</div></section><script>
  (() => {
    for (const link of document.querySelectorAll('.knowledge-map-link')) link.addEventListener('click', () => {
      const target = document.getElementById(link.hash.slice(1));
      if (target) target.open = true;
    });
  })();
  </script>`;
}
