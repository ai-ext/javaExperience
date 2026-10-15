// 단계 원문의 모든 대제목을 학습 여정 카드로 바꾼다. 원문은 카드 안에 그대로 보존한다.
const clean = (html) => String(html || '')
  .replace(/<pre\b[\s\S]*?<\/pre>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();
const esc = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function category(title) {
  if (/상황|만들 것|요구|설계/.test(title)) return ['understand', '무엇을 만들까', '◇'];
  if (/따라|구현|코드|준비|구조|쿼리/.test(title)) return ['build', '어떻게 만들까', '⌘'];
  if (/직접 확인|채점|테스트/.test(title)) return ['verify', '어떻게 확인할까', '↗'];
  if (/망가|에러|힌트|주의/.test(title)) return ['debug', '막히면 확인', '✳'];
  if (/지식|다음 단계/.test(title)) return ['connect', '다음으로 연결', '→'];
  return ['explore', '더 알아보기', '◈'];
}

function preview(content) {
  const paragraph = content.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '';
  const plain = clean(paragraph);
  return plain.length > 100 ? `${plain.slice(0, 97).trimEnd()}…` : plain;
}

function sectionCard(heading, content, index) {
  const id = heading.match(/\bid="([^"]+)"/)?.[1] || `lesson-section-${index + 1}`;
  const title = clean(heading.replace(/<a\b[^>]*>[\s\S]*?<\/a>/i, ''));
  const [kind, phase, glyph] = category(title);
  const subtopics = [...content.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi)]
    .map((match) => clean(match[1].replace(/<a\b[^>]*>[\s\S]*?<\/a>/i, '')))
    .filter(Boolean).slice(0, 3);
  const codeCount = (content.match(/<pre\b/g) || []).length;
  const summary = preview(content);
  const open = /^(만들 것|직접 확인)$/.test(title) ? ' open' : '';
  return `<details class="lesson-scene lesson-${kind}" data-lesson-kind="${kind}"${open}>
    <summary id="${esc(id)}" aria-label="${esc(title)} 내용 펼치기"><span class="lesson-scene-index">${String(index + 1).padStart(2, '0')}</span><span class="lesson-scene-glyph" aria-hidden="true">${glyph}</span><span class="lesson-scene-title"><small>${phase}</small><strong>${esc(title)}</strong>${summary ? `<em>${summary}</em>` : ''}</span><span class="lesson-scene-count">${codeCount ? `${codeCount}개 코드 · ` : ''}열기 ↓</span></summary>
    <div class="lesson-scene-content">${subtopics.length ? `<div class="lesson-scene-topics" aria-label="이 절의 세부 주제">${subtopics.map((topic) => `<span>${esc(topic)}</span>`).join('')}</div>` : ''}${content}</div>
  </details>`;
}

/** 시나리오의 화면 시안 다음에 작업·구현·검증·디버깅 지도를 놓고 긴 본문을 카드로 묶는다. */
export function renderLessonAtlas(body, stageId) {
  const start = body.indexOf('<h2 id="상황"');
  const grader = body.indexOf('<section class="grader"', start);
  if (start < 0) throw new Error(`${stageId}: 학습 본문의 상황 제목이 없다`);
  const end = grader < 0 ? body.length : grader;
  let before = body.slice(0, start);
  let source = body.slice(start, end);
  const serverUrl = source.match(/<section class="server-url">[\s\S]*?<\/section>/)?.[0] || '';
  if (serverUrl) source = source.replace(serverUrl, '');
  const headings = [...source.matchAll(/<h2\b[^>]*\bid="[^"]+"[^>]*>[\s\S]*?<\/h2>/gi)];
  if (headings.length < 4) throw new Error(`${stageId}: 학습 절 제목이 ${headings.length}개뿐이다`);
  const sections = headings.map((match, index) => {
    const next = headings[index + 1]?.index ?? source.length;
    const content = source.slice(match.index + match[0].length, next);
    return { heading: match[0], content, id: match[0].match(/\bid="([^"]+)"/)?.[1], title: clean(match[0].replace(/<a\b[^>]*>[\s\S]*?<\/a>/i, '')) };
  });
  const intro = source.slice(0, headings[0].index);
  const atlas = `<nav class="lesson-atlas" aria-label="${esc(stageId)} 학습 흐름"><div class="lesson-atlas-heading"><span>BUILD · RUN · UNDERSTAND</span><h2>이번 단계의 학습 흐름</h2><p>그림으로 요청의 경로를 먼저 본 다음, 필요한 절을 펼쳐 직접 만들고 확인하세요.</p></div><div class="lesson-atlas-track">${sections.map((section, index) => {
    const [kind, phase, glyph] = category(section.title);
    return `<a class="lesson-atlas-stop lesson-${kind}" href="#${esc(section.id)}"><b>${String(index + 1).padStart(2, '0')}</b><span aria-hidden="true">${glyph}</span><span><small>${phase}</small><strong>${esc(section.title)}</strong></span></a>`;
  }).join('')}</div></nav>`;
  const cards = sections.map((section, index) => sectionCard(section.heading, `${/직접 확인/.test(section.title) ? serverUrl : ''}${section.content}`, index)).join('');
  before += atlas;
  return before + intro + `<div class="lesson-scenes" aria-label="단계별 구현과 확인">${cards}</div>` + body.slice(end);
}
