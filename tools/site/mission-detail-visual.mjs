import fs from 'node:fs';
import path from 'node:path';

const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function textOf(html) {
  return String(html).replace(/<br\s*\/?\s*>/gi, ' · ').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}

function methodClass(method) { return String(method).toLowerCase(); }

function expectedChecks(raw, index) {
  const lines = raw.split('\n');
  const checks = [];
  let nested = false;
  for (const line of lines) {
    const top = line.match(/^- (정답 확인[^\n]*|테스트:[^\n]*|동시성:[^\n]*|회원 6이[^\n]*)/);
    if (top) {
      checks.push(top[1]);
      nested = top[1].startsWith('정답 확인');
      continue;
    }
    if (nested && /^  - /.test(line)) { checks.push(line.trim().slice(2)); continue; }
    if (/^- /.test(line)) nested = false;
  }
  if (index === 6) checks.push('글 4의 댓글 12로 삭제 댓글 표시를 확인한다.');
  if (index === 8) checks.push(...lines.filter((line) => /^\d+\. /.test(line) && /회원 2:|회원 7:|회원\(30\)/.test(line)));
  if (index === 9) checks.push('N+1·동시성 손실·커넥션 타임아웃을 각각 재현하고 원인을 설명한다.');
  return checks.map((line) => line.replace(/^\d+\. /, '').replace(/`/g, '').trim()).filter(Boolean);
}

function missionCard(section, heading, index, raw) {
  const id = heading.match(/\bid="([^"]+)"/)?.[1] || `mission-${index + 1}`;
  const title = textOf(heading.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, ''));
  const content = section.replace(heading, '');
  const plain = textOf(content);
  const endpoints = [...plain.matchAll(/\b(GET|POST|PUT|PATCH|DELETE)\s+(\/api\/[^\s,;]+)/g)]
    .map((match) => ({ method: match[1], path: match[2].replace(/[.)]+$/, '').split('?')[0] }));
  const uniqueEndpoints = [...new Map(endpoints.map((endpoint) => [`${endpoint.method} ${endpoint.path}`, endpoint])).values()];
  const listItems = [...content.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => textOf(match[1])).filter(Boolean);
  const checks = expectedChecks(raw, index);
  const focus = listItems.filter((item) => !/^정답 확인/.test(item)).slice(0, 3);
  const endpointMarkup = uniqueEndpoints.length
    ? `<div class="mission-detail-endpoints" aria-label="관련 API">${uniqueEndpoints.map(({ method, path: apiPath }) => `<span class="mission-api-chip method-${methodClass(method)}"><b>${method}</b><code>${esc(apiPath)}</code></span>`).join('')}</div>`
    : `<span class="mission-detail-kind">${index < 7 ? '구현 미션' : '쿼리 · 진단 미션'}</span>`;
  const focusMarkup = focus.length
    ? `<ul class="mission-detail-focus">${focus.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`
    : `<p class="mission-detail-focus-empty">요구사항과 완료 기준을 원문에서 확인하세요.</p>`;
  const answerMarkup = checks.length
    ? `<div class="mission-answer"><span>검증할 기대값</span><ul>${checks.map((check) => `<li>${esc(check)}</li>`).join('')}</ul></div>`
    : `<div class="mission-answer"><span>완료 기준</span><p>정답 확인값을 기대값으로 둔 테스트가 통과해야 완료입니다.</p></div>`;
  return `<article class="mission-detail-card" id="${esc(id)}" aria-labelledby="${esc(id)}-title">
    <header class="mission-detail-head"><span class="mission-detail-number">M${index + 1}</span><div><p class="mission-detail-eyebrow">${index < 7 ? 'API BUILD' : index === 8 ? 'SQL PRACTICE' : 'DEBUG LAB'}</p><h3 id="${esc(id)}-title">${esc(title.replace(/^M\d+\.\s*/, ''))}</h3></div><span class="mission-detail-chevron" aria-hidden="true">↘</span></header>
    ${endpointMarkup}
    <div class="mission-detail-columns"><section><h4>이번 미션에서 할 일</h4>${focusMarkup}</section><section>${answerMarkup}</section></div>
    <details class="mission-original"><summary>전체 요구사항과 세부 조건 보기</summary><div class="mission-original-content">${content}</div></details>
  </article>`;
}

function knowledgeCatalog(root, fromAbs, section, headingId) {
  const plain = textOf(section);
  const codes = new Set([...plain.matchAll(/\b([A-Z]\d{2})\b/g)].map((match) => match[1]));
  for (const [, prefix, first, last] of plain.matchAll(/\b([A-Z])(\d{2})\s*[~～–-]\s*([A-Z]?\d{2})\b/g)) {
    const end = Number(last.replace(/^[A-Z]/, ''));
    for (let n = Number(first); n <= end; n++) codes.add(`${prefix}${String(n).padStart(2, '0')}`);
  }
  const docsDir = path.join(root, 'docs', 'knowledge');
  const files = fs.existsSync(docsDir) ? fs.readdirSync(docsDir).filter((name) => name.endsWith('.md')) : [];
  const groups = new Map();
  for (const code of [...codes].sort()) {
    const file = files.find((name) => name.startsWith(`${code}-`));
    if (!file) continue;
    const href = path.relative(path.dirname(fromAbs), path.join(docsDir, file)).replace(/\.md$/, '.html');
    const group = code[0];
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(`<a href="${esc(href)}"><b>${esc(code)}</b><span>${esc(file.replace(/^[A-Z]\d{2}-/, '').replace(/\.md$/, '').replace(/-/g, ' '))}</span><i aria-hidden="true">↗</i></a>`);
  }
  const names = { W: '웹·Spring 개념', P: '프로젝트·영속성', R: '관계형 DB·SQL', V: '검증·테스트', D: '디버깅', S: 'Spring 동작' };
  const cards = [...groups].map(([group, links]) => `<section class="mission-knowledge-group"><h4>${esc(names[group] || `${group} 자료`)}<small>${links.length}개</small></h4><div>${links.join('')}</div></section>`).join('');
  return `<section class="mission-knowledge-visual" id="${esc(headingId || 'mission-knowledge')}" aria-labelledby="mission-knowledge-title"><header><p>REFERENCE MAP</p><h3 id="mission-knowledge-title">미션에 필요한 공부자료</h3><span>개념을 열면 해당 문서로 이동합니다.</span></header><div class="mission-knowledge-groups">${cards}</div><details class="mission-knowledge-original"><summary>기존 참고 문장 보기</summary>${section}</details></section>`;
}

/** Rendered practice/MISSIONS HTML에서 M1–M10과 참고 문서를 카드형 학습 화면으로 바꾼다. */
export function renderMissionDetails(root, fromAbs, renderedHtml) {
  const start = renderedHtml.search(/<h2\b[^>]*id="미션"[^>]*>/i);
  if (start < 0) return renderedHtml;
  const afterHeading = renderedHtml.indexOf('</h2>', start) + 5;
  const nextH2 = renderedHtml.indexOf('<h2', afterHeading);
  const nextHeadingEnd = nextH2 < 0 ? -1 : renderedHtml.indexOf('</h2>', nextH2) + 5;
  const nextTitle = nextH2 < 0 ? '' : textOf(renderedHtml.slice(nextH2, nextHeadingEnd));
  const followingH2 = nextTitle.includes('참고 문서') ? renderedHtml.indexOf('<h2', nextHeadingEnd) : -1;
  const end = followingH2 >= 0 ? followingH2 : nextTitle.includes('참고 문서') || nextH2 < 0 ? renderedHtml.length : nextH2;
  const missionBlock = renderedHtml.slice(afterHeading, end);
  const headings = [...missionBlock.matchAll(/<h3\b[^>]*>[\s\S]*?<\/h3>/gi)];
  if (!headings.length) return renderedHtml;
  const firstMission = missionBlock.indexOf(headings[0][0]);
  const intro = missionBlock.slice(0, firstMission);
  const missionOnly = missionBlock.slice(firstMission);
  const refsAt = missionOnly.search(/<h2\b[^>]*id="참고-문서[^"]*"/i);
  const cardArea = refsAt < 0 ? missionOnly : missionOnly.slice(0, refsAt);
  const refsHeadingId = refsAt < 0 ? '' : missionOnly.slice(refsAt).match(/^<h2\b[^>]*id="([^"]+)"/i)?.[1] || '';
  const refsArea = refsAt < 0 ? '' : missionOnly.slice(refsAt).replace(/<h2\b[^>]*>[\s\S]*?<\/h2>/i, '');
  const cardHeadings = [...cardArea.matchAll(/<h3\b[^>]*>[\s\S]*?<\/h3>/gi)];
  const rawSource = fs.readFileSync(path.join(root, 'practice', 'MISSIONS.md'), 'utf8');
  const rawHeadings = [...rawSource.matchAll(/^### M\d+\. /gm)];
  const cards = cardHeadings.map((match, index) => {
    const next = cardHeadings[index + 1]?.index ?? cardArea.length;
    const raw = rawHeadings[index] ? rawSource.slice(rawHeadings[index].index, rawHeadings[index + 1]?.index ?? rawSource.indexOf('## 참고 문서', rawHeadings[index].index)) : '';
    return missionCard(cardArea.slice(match.index, next), match[0], index, raw);
  }).join('');
  const redesigned = `${intro}<div class="mission-detail-grid" aria-label="미션 상세 목록">${cards}</div>${refsArea ? knowledgeCatalog(root, fromAbs, refsArea, refsHeadingId) : ''}`;
  return renderedHtml.slice(0, afterHeading) + redesigned + renderedHtml.slice(end);
}
