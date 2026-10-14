import fs from 'node:fs';
import path from 'node:path';

const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function textOf(html) {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

/** Rendered root README body를 학습 경로 중심의 랜딩으로 만들고 원문 전체를 접어 보존한다. */
export function renderHomeVisual(root, fromAbs, renderedHtml) {
  const titleMatch = renderedHtml.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (!titleMatch) return renderedHtml;
  const title = textOf(titleMatch[1]).replace(/^#\s*/, '');
  const afterTitle = renderedHtml.slice(titleMatch.index + titleMatch[0].length);
  const introMatch = afterTitle.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  const intro = introMatch ? textOf(introMatch[1]) : 'Spring Boot 백엔드를 직접 만들며 배우는 공개 실습 레포입니다.';
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'scenario/scenario.json'), 'utf8'));
  const stageCount = manifest.chapters.filter((chapter) => chapter.status !== 'planned')
    .reduce((total, chapter) => total + chapter.levels.filter((level) => level.file).length, 0);
  const missionSource = fs.readFileSync(path.join(root, 'practice/MISSIONS.md'), 'utf8');
  const missionCount = [...missionSource.matchAll(/^### M\d+\./gm)].length;
  const knowledgeCount = fs.readdirSync(path.join(root, 'docs/knowledge'))
    .filter((file) => /^[A-Z]\d{2}-.*\.md$/.test(file)).length;
  const steps = [
    { n: '01', title: '시나리오', text: 'API를 만들고 요청부터 DB까지 따라가기', href: 'scenario/README.html', tag: `${stageCount}단계 · 전체 코드` },
    { n: '02', title: '학습용 미션', text: '함정이 있는 데이터로 쿼리와 운영 문제 풀기', href: 'practice/MISSIONS.html', tag: `${missionCount}개 미션 · practice DB` },
    { n: '03', title: '공부자료', text: '필요한 개념을 구현 흐름에서 찾아보기', href: 'docs/knowledge/README.html', tag: `${knowledgeCount}개 문서 · 개념 지도` },
  ];
  const cards = steps.map((step) => `<a class="home-path-card" href="${esc(step.href)}"><span class="home-path-top"><b>${step.n}</b><small>${esc(step.tag)}</small></span><strong>${esc(step.title)}</strong><span>${esc(step.text)}</span><i aria-hidden="true">↗</i></a>`).join('');
  const original = renderedHtml.replace(titleMatch[0], titleMatch[0].replace(/\bid="[^"]*"/, ''));
  const setup = afterTitle.match(/<pre\b[^>]*>[\s\S]*?<\/pre>/i)?.[0] || '';
  const setupMarkup = setup || '<p>Docker Desktop, IntelliJ IDEA, JDK 21을 준비합니다.</p>';
  const hero = `<section class="home-visual" aria-labelledby="home-visual-title">
    <div class="home-visual-hero"><div class="home-visual-copy"><p class="home-visual-kicker">JAVA EXPERIENCE · BACKEND PRACTICE</p><h1 id="home-visual-title">${esc(title)}</h1><p>${esc(intro)}</p><div class="home-visual-facts"><span><b>${stageCount}</b> API 학습 단계</span><span><b>${missionCount}</b> 실전 미션</span><span><b>${knowledgeCount}</b> 공부자료</span></div><a class="home-visual-start" href="scenario/README.html">학습 경로 열기 <span aria-hidden="true">→</span></a></div><div class="home-flow-card" aria-label="API 요청과 데이터베이스의 서로 다른 연결 경로"><span class="home-flow-label">요청은 계층을 지나 MySQL에 저장됩니다</span><div class="home-flow-route" aria-label="Browser 또는 Postman에서 Controller, Request DTO, Service, Repository와 JPA를 거쳐 MySQL로 흐릅니다"><span>Browser<br>Postman</span><i>→</i><span>Controller</span><i>→</i><span>Request<br>DTO</span><i>→</i><span>Service</span><i>→</i><span>Repository<br>JPA</span><i>→</i><span>MySQL</span></div><div class="home-db-branch"><span aria-hidden="true">↘</span><b>DBeaver</b><small>DB에 직접 연결해 저장 결과 확인</small><span class="home-db-branch-line" aria-hidden="true"></span></div><p>위는 API 처리 경로, 아래는 DB 확인 경로입니다. 두 흐름이 만나는 곳은 MySQL입니다.</p></div></div>
    <div class="home-path-heading"><div><p>CHOOSE YOUR NEXT STEP</p><h2>어디서 시작할까요?</h2></div><span>만들기 → 확인하기 → 더 깊게 이해하기</span></div><nav class="home-path-grid" aria-label="학습 경로">${cards}</nav>
    <div class="home-setup-card"><div><p>GETTING STARTED</p><h2>먼저 개발 환경 준비하기</h2><div class="home-setup-code">${setupMarkup}</div></div><a href="#전체-안내">설치와 실행 안내 보기 ↓</a></div>
    <details class="home-original" id="전체-안내"><summary><span><b>전체 안내 펼치기</b><small>실행 명령, DB 접속 정보, 테스트, 작업 방식</small></span><i aria-hidden="true">＋</i></summary><div class="home-original-content">${original}</div></details>
  </section>`;
  return hero;
}
