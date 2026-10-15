import fs from 'node:fs';
import path from 'node:path';

const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// build.mjs의 GitHub 스타일 제목 앵커 규칙과 맞춘다.
function headingId(markdownHeading) {
  return markdownHeading.toLowerCase().trim()
    .replace(/[`*_~]/g, '')
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '')
    .replace(/ /g, '-');
}

function extractMissions(markdown) {
  const headings = [...markdown.matchAll(/^### (M\d+)\. (.+)$/gm)];
  return headings.map((match, index) => {
    const end = headings[index + 1]?.index ?? markdown.length;
    const section = markdown.slice(match.index, end);
    const title = `${match[1]}. ${match[2]}`;
    const api = section.match(/\b(GET|POST|PUT|PATCH|DELETE)\s+(\/api\/[^\s`]+)/);
    return {
      code: match[1], title: match[2], id: headingId(title),
      api: api ? `${api[1]} ${api[2].split('?')[0]}` : '',
    };
  });
}

/** practice/MISSIONS.md를 읽어 MISSIONS.html 상단에 들어갈 미션 탐색 UI를 만든다. */
export function renderMissionVisual(root, fromAbs) {
  const source = path.join(root, 'practice', 'MISSIONS.md');
  const missions = extractMissions(fs.readFileSync(source, 'utf8'));
  const cards = missions.map((mission, index) => `<li class="mission-visual-card">
    <a class="mission-visual-card-link" href="#${esc(mission.id)}" aria-label="${esc(mission.code)} ${esc(mission.title)} 미션으로 이동">
      <span class="mission-visual-number">${esc(mission.code)}</span>
      <span class="mission-visual-card-copy"><strong>${esc(mission.title)}</strong>
        ${mission.api ? `<code>${esc(mission.api)}</code>` : `<span class="mission-visual-kind">${index < 7 ? '구현 미션' : '쿼리 · 진단 미션'}</span>`}
      </span><span class="mission-visual-arrow" aria-hidden="true">↗</span>
    </a></li>`).join('');

  return `<section class="mission-visual" aria-labelledby="mission-visual-title">
  <header class="mission-visual-heading">
    <div><p class="mission-visual-eyebrow">PRACTICE DB · 10 MISSIONS</p>
      <h2 id="mission-visual-title">미션 경로</h2>
      <p>카드를 선택하면 아래 상세 내용으로 이동합니다. 완료 기준과 정답 확인값은 각 미션에 있습니다.</p></div>
    <a class="mission-visual-detail-link" href="#업무-규칙-모든-미션-공통">공통 규칙 보기 <span aria-hidden="true">↓</span></a>
  </header>
  <nav aria-label="미션 목록"><ol class="mission-visual-path">${cards}</ol></nav>
  <div class="mission-visual-shortcuts" aria-label="공통 참고 링크">
    <a href="#업무-규칙-모든-미션-공통"><span class="mission-visual-shortcut-icon" aria-hidden="true">§</span><span><strong>공통 업무 규칙</strong><small>열람 권한 · 반응 · 폴더 · 정렬 · 인증</small></span><span aria-hidden="true">→</span></a>
    <a href="#데이터에-숨겨-둔-함정"><span class="mission-visual-shortcut-icon" aria-hidden="true">!</span><span><strong>데이터 함정</strong><small>틀린 카운트 · 숨김 글 · 탈퇴 회원 · 중복 제목</small></span><span aria-hidden="true">→</span></a>
  </div>
</section><script>
(() => {
  const reveal = (hash) => {
    if (!hash) return;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    const setup = target?.closest('.mission-setup');
    if (setup) setup.open = true;
  };
  for (const link of document.querySelectorAll('.mission-visual a[href^="#"]')) {
    link.addEventListener('click', () => reveal(link.hash));
  }
  window.addEventListener('hashchange', () => reveal(location.hash));
  window.addEventListener('DOMContentLoaded', () => reveal(location.hash));
})();
</script>`;
}
