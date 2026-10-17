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
    { n: '01', title: 'Java부터 시작', text: '0-1 · 첫 API를 만들고 직접 요청하기', href: 'scenario/ch0-first-steps/0-1-ts-to-java.html', tag: '처음 시작하는 사람' },
    { n: '02', title: '게시글 API부터', text: '1-1 · POST /api/posts를 만들고 success 확인하기', href: 'scenario/ch1-create-post/1-1-receive-request.html', tag: 'Java 문법이 익숙한 사람' },
    { n: '03', title: 'DB 쿼리부터', text: 'DB-01 · API 응답에서 테이블·열을 찾아 SQL 쓰기', href: 'scenario/db-query-journey/db-01-response-to-query.html', tag: 'SQL을 직접 연습할 사람' },
  ];
  const cards = steps.map((step) => `<a class="home-path-card" href="${esc(step.href)}"><span class="home-path-top"><b>${step.n}</b><small>${esc(step.tag)}</small></span><strong>${esc(step.title)}</strong><span>${esc(step.text)}</span><i aria-hidden="true">↗</i></a>`).join('');
  const original = renderedHtml;
  const setup = afterTitle.match(/<pre\b[^>]*>[\s\S]*?<\/pre>/i)?.[0] || '';
  const setupMarkup = setup || '<p>Docker Desktop, IntelliJ IDEA, JDK 21을 준비합니다.</p>';
  const hero = `<section class="home-visual" aria-labelledby="home-visual-title">
    <div class="home-visual-hero"><div class="home-visual-copy"><p class="home-visual-kicker">JAVA EXPERIENCE · BACKEND PRACTICE</p><h1 id="home-visual-title">${esc(title)}</h1><p>${esc(intro)}</p><div class="home-visual-facts"><span><b>${stageCount}</b> API 학습 단계</span><span><b>${missionCount}</b> 실전 미션</span><span><b>${knowledgeCount}</b> 공부자료</span></div><a class="home-visual-start" href="scenario/ch0-first-steps/0-1-ts-to-java.html">0-1 첫 API 만들기 <span aria-hidden="true">→</span></a></div><div class="home-flow-card" aria-label="게시글 저장 API 요청과 데이터베이스 확인의 서로 다른 연결 경로"><span class="home-flow-label">게시글 저장 단계의 흐름 미리보기</span><div class="home-flow-route" aria-label="게시글 저장 요청 예시: Browser 또는 Postman에서 Controller, Request DTO, Service, Repository와 JPA를 거쳐 MySQL로 흐릅니다"><span>Browser<br>Postman</span><i>→</i><span>Controller</span><i>→</i><span>Request<br>DTO</span><i>→</i><span>Service</span><i>→</i><span>Repository<br>JPA</span><i>→</i><span>MySQL</span></div><div class="home-db-branch"><span aria-hidden="true">↘</span><b>DBeaver</b><small>DB에 직접 연결해 저장 결과 확인</small><span class="home-db-branch-line" aria-hidden="true"></span></div><p>0-1 첫 API에는 DB 저장이 없습니다. 글 저장 단계에서 위 API 경로와 별도의 DB 확인 경로가 만납니다.</p></div></div>
    <div class="home-path-heading"><div><p>CHOOSE YOUR START</p><h2>시작할 첫 과제를 고르세요</h2></div><span>어느 경로든 직접 만들고 요청해 봅니다.</span></div><nav class="home-path-grid" aria-label="첫 실습 경로">${cards}</nav><div class="home-support-links"><a href="scenario/README.html">전체 101단계 보기 →</a><a href="practice/MISSIONS.html">나중에 미션 풀기 →</a><a href="docs/knowledge/README.html">필요한 개념 찾아보기 →</a></div>
    <div class="home-setup-card"><div><p>GETTING STARTED</p><h2>먼저 개발 환경 준비하기</h2><div class="home-setup-code">${setupMarkup}</div></div><a href="#전체-안내">설치와 실행 안내 보기 ↓</a></div>
    <details class="home-original" id="전체-안내"><summary><span><b>전체 안내 펼치기</b><small>실행 명령, DB 접속 정보, 테스트, 작업 방식</small></span><i aria-hidden="true">＋</i></summary><div class="home-original-content">${original}</div></details>
  </section>`;
  return hero;
}
