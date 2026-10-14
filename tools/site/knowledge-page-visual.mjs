const ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ESCAPE[ch]);
const textOnly = (html) => html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

const GROUPS = {
  B: ['Backend fundamentals', '서버·네트워크·개발 환경'], D: ['Delivery & operations', '개발 도구·배포·운영'],
  J: ['Java language', 'Java 문법·런타임·자료구조'], P: ['Practical backend', 'Spring·DB를 직접 구현하는 실습'],
  R: ['Relational database', 'SQL·스키마·인덱스'], S: ['Spring framework', 'Spring의 실행 흐름과 기능'],
  V: ['Verification & tests', '계층별 테스트와 검증'], W: ['Why & decisions', '선택 이유와 설계 기준'],
};

/** Render a per-document map from its real h2 headings and generated anchors. */
export function renderKnowledgePageVisual(abs, html) {
  const id = abs.split('/').at(-1).match(/^([A-Z]\d{2})-/)?.[1] || '';
  if (!id) return '';
  const headings = [...html.matchAll(/<h2\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)]
    .map((match) => ({ id: match[1], label: textOnly(match[2]).replace(/^#\s*/, '') }));
  if (!headings.length) return '';
  const [group, description] = GROUPS[id[0]] || ['Backend knowledge', '백엔드 공부자료'];
  const steps = headings.map((heading, index) => `<a class="knowledge-page-step" href="#${esc(heading.id)}"><span class="knowledge-page-step-no">${String(index + 1).padStart(2, '0')}</span><span>${esc(heading.label)}</span><span class="knowledge-page-step-arrow" aria-hidden="true">↘</span></a>`).join('');
  return `<section class="knowledge-page-map" aria-label="문서 읽기 지도"><div class="knowledge-page-map-head"><div><p class="knowledge-page-map-kicker">${esc(group)} <span>· ${esc(id)}</span></p><h2>이 문서에서 볼 내용</h2><p>${esc(description)}</p></div><span class="knowledge-page-map-count">${headings.length}개 주제</span></div><nav class="knowledge-page-steps" aria-label="문서의 실제 절로 이동">${steps}</nav></section>`;
}
