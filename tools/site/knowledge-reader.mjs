const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const text = (html) => html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

export function renderKnowledgeReaderPage({ title, navigation = '', visual = '', source }) {
  const titleTag = title.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/i)?.[0] || '<h1>개념</h1>';
  const originalTitle = titleTag.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '개념';
  const fullTitle = text(originalTitle).replace(/^#\s*/, '');
  const shortTitle = fullTitle.split(/\s+—\s+/)[0] || fullTitle;
  const sceneHasH1 = /<h1\b/i.test(visual);
  const headings = [...source.matchAll(/<details\b[^>]*class="knowledge-chapter"[^>]*>\s*<summary\b[^>]*id="([^"]+)"[^>]*>[\s\S]*?<strong[^>]*>([\s\S]*?)<\/strong>[\s\S]*?<\/summary>/g)]
    .map((m) => ({ id: m[1], label: text(m[2]) }));
  const fallback = headings.length ? headings : [...source.matchAll(/<h2\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => ({ id: m[1], label: text(m[2]) }));
  const toc = fallback.map((h) => `<a href="#${esc(h.id)}" data-kr-toc-link>${esc(h.label)}</a>`).join('');
  const hasScene = /<(?:button|input|select|textarea)\b|data-(?:step|stage|scene|p09|jpa|concept-scene)\b/.test(visual);
  const metadata = JSON.stringify({ title: fullTitle, hasScene, headings: fallback }).replace(/</g, '\\u003c');
  const titleId = titleTag.match(/\bid="([^"]+)"/)?.[1];
  const sourceHasTitle = titleId && [...source.matchAll(/<h1\b[^>]*>/gi)].some(([tag]) => tag.match(/\bid="([^"]+)"/)?.[1] === titleId);
  const retainedTitle = sourceHasTitle ? '' : titleTag.replace(/<h1\b([^>]*)>/, (_tag, attrs) => {
    const existingClass = attrs.match(/\bclass="([^"]*)"/);
    if (existingClass) return `<h1${attrs.replace(existingClass[0], `class="${existingClass[1]} kr-source-title"`)}>`;
    return `<h1 class="kr-source-title"${attrs}>`;
  });
  const toolbarTitle = sceneHasH1 ? `<h2>${esc(shortTitle)}</h2>` : `<h1>${esc(shortTitle)}</h1>`;
  return `<div class="kr-reader" data-knowledge-reader data-kr-metadata="${esc(metadata)}">
  <header class="kr-toolbar"><div class="kr-toolbar-title"><p>개념 학습</p>${toolbarTitle}</div><div class="kr-controls" role="group" aria-label="개념 읽는 방식"${hasScene ? '' : ' hidden'}><button type="button" data-kr-mode="scene" aria-pressed="false" aria-controls="kr-scene">장면으로 보기</button><button type="button" data-kr-mode="read" aria-pressed="true" aria-controls="kr-reading">설명 차근차근 읽기</button></div>${navigation}</header>
  <div class="kr-layout">${toc ? `<aside class="kr-toc" aria-label="이 문서의 목차"><strong>이 문서에서 볼 내용</strong><nav>${toc}</nav></aside>` : ''}<div class="kr-content"><section id="kr-scene" data-kr-scene${visual ? '' : ' hidden'}>${visual}</section><section id="kr-reading" data-kr-reading aria-label="${esc(shortTitle)} 설명"><h1 class="kr-reading-title" tabindex="-1">${esc(shortTitle)}</h1>${retainedTitle}<div class="knowledge-reader-original">${source}</div></section></div></div></div>`;
}
