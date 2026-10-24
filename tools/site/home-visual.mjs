import { TASKS } from './home-state.mjs';
import { renderHomeServicePreview } from './home-service-preview.mjs';
import { renderHomeNewVisual } from './home-new-visual.mjs';
import { renderHomePreparation } from './home-preparation.mjs';
const esc = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** README 원문·앵커를 보존하면서 홈의 행동과 설명을 먼저 보여 준다. */
export function renderHomeVisual(root, fromAbs, renderedHtml) {
  const task = TASKS['0-1'];
  const choices = [
    ['0-1', 'Java부터 차근차근', '타입·객체·생성자를 작은 API로 익힙니다.'],
    ['1-1', '게시글 API부터', 'Java가 익숙하다면 요청 받기부터 시작합니다.'],
    ['DB-01', 'SQL과 DB부터', '기존 데이터로 응답과 테이블을 연결합니다.'],
  ];
  return `<section class="home-visual" aria-labelledby="home-title">
  <div class="home-intro"><p class="home-eyebrow">직접 만들며 배우는 백엔드</p><h1 id="home-title" data-home-intro-title>작은 API부터, <span>하나의 서비스까지.</span></h1><p data-home-intro-description>글 작성·조회·소통이 되는 게시판을 직접 만듭니다.<br>기능 하나씩 구현하고, 응답과 DB 결과로 확인하세요.</p></div>
  <div class="home-hero">
    <article class="home-task" aria-labelledby="home-task-title">
      <p class="home-task-tag" data-home-tag>첫 시작 · 0-1</p><h2 class="home-task-title" id="home-task-title" data-home-title>${task.title}</h2><p class="home-task-lead" data-home-description>${task.description}</p>
      <p class="home-api"><code data-home-api>${task.api}</code></p>
      <dl class="home-task-facts"><div><dt>지금 할 일</dt><dd data-home-work>${task.work}</dd></div><div><dt>완료 목표</dt><dd data-home-goal>${task.goal}</dd></div></dl>
      <div class="home-task-actions"><a class="home-primary" data-home-start href="${task.href}">0-1 첫 API 만들기 <span aria-hidden="true">→</span></a><button class="home-text-button" type="button" data-home-choose>시작점 바꾸기</button></div>
      <p class="home-prepare-shortcut" data-home-prepare-note><span>첫 실행이 아직이라면</span><button type="button" data-home-prepare>IDE·서버·DB 준비하기 →</button></p>
      <div class="home-return-work" data-home-return-card hidden><span>하던 과제는 그대로 보관했어요</span><a data-home-return href="${task.href}">하던 과제 이어가기 →</a><small data-home-return-position></small></div>
      <p class="home-progress-note" data-home-progress>개발은 내 IDE에서, 안내와 결과 확인은 여기서.</p>
      <p class="home-progress-note" data-home-next hidden></p>
    </article>
    <aside class="home-preview" aria-labelledby="home-preview-title">
      <div class="home-preview-heading"><h2 id="home-preview-title">이번 과제의 완성 예시</h2><span class="home-preview-label">예시 데이터</span></div>
      <div class="home-demo-window"><div class="home-window-bar"><span aria-hidden="true">● ● ●</span><span data-demo-path>/api/start/hello</span></div><div class="home-demo-body">
        <div data-demo="greeting"><label for="home-demo-name">어떤 이름으로 인사할까요?</label><form class="home-demo-input-row" id="home-greeting-form"><input id="home-demo-name" value="김자바" maxlength="24" autocomplete="off"><button type="submit" data-demo-send>인사 받기 <span aria-hidden="true">↗</span></button></form><p class="home-demo-note">입력한 이름이 응답의 값으로 이어집니다.</p></div>
        <form data-demo="receive" hidden><label for="home-demo-post-title">게시글 제목</label><input id="home-demo-post-title" value="나의 첫 게시글" maxlength="80"><label for="home-demo-post-content">본문</label><textarea id="home-demo-post-content" rows="2" maxlength="300">백엔드 만들기를 시작했어요.</textarea><button type="submit" data-demo-post>요청 예시 보내기 →</button></form>
        <div data-demo="query" hidden><p>글 목록에서 필요한 값</p><div class="home-query-fields"><span>제목 <code>post.title</code></span><span>작성자 <code>member.nickname</code></span><span>좋아요 <code>post.like_count</code></span></div></div>
        <div data-demo="cursor" hidden><p>첫 묶음의 마지막 글을 기준으로 다음 묶음을 고릅니다.</p><div class="home-cursor-preview"><div><small>첫 묶음</small><strong>145 · <mark>144</mark></strong></div><span aria-hidden="true">→</span><div><small>다음 묶음</small><strong>143 · 140</strong></div></div><p class="home-demo-note">practice seed의 기대 순서 · 직접 조회 전<br>144의 발행 시각과 id를 함께 커서로 사용합니다.</p></div>
        <div data-demo="ping" hidden><p>주소가 연결되면, 짧은 응답 하나가 돌아옵니다.</p><button type="button" data-demo-ping>ping 요청 예시 보기 →</button></div>
        <div class="home-demo-result" data-demo-result aria-live="polite" aria-atomic="true"><p class="home-demo-result-caption">사용자가 보는 화면 · 예시</p><strong data-demo-result-title>김자바님, 반가워요</strong><p data-demo-result-content>입력한 이름으로 인사말이 달라집니다.</p><small data-demo-result-meta>이름 글자 수: 3</small></div>
        <details class="home-demo-response-details"><summary data-demo-response-title>응답 JSON 보기</summary><pre aria-label="예시 응답" tabindex="0"><code data-demo-response>{
  "name": "김자바",
  "message": "김자바님, 반가워요",
  "nameLength": 3
}</code></pre></details><p class="home-demo-note" data-demo-status role="status">학습용 미리보기 · 내 서버에 요청하지 않습니다.</p>
      </div></div>
    </aside>
  </div>
  <nav class="home-roadmap" aria-label="앞으로 만들어 갈 흐름"><span><b>01</b> 작은 API</span><span aria-hidden="true">→</span><span><b>02</b> 게시글 저장</span><span aria-hidden="true">→</span><span><b>03</b> 조회·수정·확장</span><a href="scenario/README.html">전체 과정 보기 ↗</a></nav>
  ${renderHomeServicePreview()}
  <section class="home-section" aria-labelledby="home-method-title"><div class="home-section-heading"><p class="home-eyebrow">읽기에서 끝나지 않도록</p><h2 id="home-method-title">이렇게 배우면 됩니다</h2><p>기능 하나를 이해하고, 만들고, 확인하는 흐름을 반복합니다.</p></div>
  <div class="home-method-grid">
    <article><span class="home-step-number">01</span><div class="home-step-visual"><span>글을 작성해 주세요</span><b aria-hidden="true">→</b><code>POST /api/posts</code></div><h3>만들 상황을 먼저 이해해요</h3><p>사용자의 요구와 요청·응답을 보고 이번에 만들 범위를 확인합니다.</p></article>
    <article><span class="home-step-number">02</span><div class="home-step-visual"><code>Post.java</code><span>필드 · 생성자 · 매핑</span></div><h3>내 IDE에서 직접 구현해요</h3><p>작성할 파일과 가이드를 따라 코드를 만들고, 필요한 개념을 곁에서 확인합니다.</p></article>
    <article><span class="home-step-number">03</span><div class="home-step-visual"><code>201 Created</code><b aria-hidden="true">↔</b><code>post.id</code></div><h3>실제 결과로 확인해요</h3><p>내 서버의 응답을 기대값과 비교하고, 저장 과제에서는 DB 행까지 확인합니다.</p></article>
  </div><p class="home-demo-note">위 그림은 게시글 저장 단계의 예입니다. 첫 Java API와 요청 받기 단계에는 DB 저장이 없습니다.</p></section>
  <section class="home-section" aria-labelledby="home-explore-title"><div class="home-section-heading"><h2 id="home-explore-title">지금 필요한 방식으로 배워 보세요</h2><p>안내를 따라 만들다가, 필요한 공간으로 잠깐 이동해도 괜찮습니다.</p></div><div class="home-explore-grid">
    <article><div class="home-explore-head"><span class="home-eyebrow">실전 미션</span><span aria-hidden="true">↗</span></div><h3>이제 스스로 해결해 보고 싶다면</h3><p>활동 요약, 인기글 랭킹, 관계 조회처럼 조건이 있는 문제를 데이터로 풀어 봅니다.</p><div class="home-step-visual"><span>회원별 활동 요약</span><code>LEFT JOIN · 집계</code></div><a href="practice/MISSIONS.html">해결할 미션 찾아보기 →</a></article>
    <article><div class="home-explore-head"><span class="home-eyebrow">개념 학습</span><span aria-hidden="true">↗</span></div><h3>코드는 읽히는데, 원리가 궁금하다면</h3><p>같은 값이 코드와 객체에서 어떻게 달라지는지 장면을 바꾸며 살펴봅니다.</p><button class="home-concept-thumbnail" type="button" data-home-concept><img src="docs/design/home-2026-10-18/refinement/new-03-assignment-v2.jpg" width="1536" height="1024" loading="lazy" alt="greeting 참조가 김자바 값을 가진 Greeting 객체를 가리키는 설명 그림"><strong>new로 객체를 만들면 무엇이 생길까? <span aria-hidden="true">↗</span></strong><small>시각 설명 보기 · 5장면</small></button><a href="docs/knowledge/README.html">다른 개념 찾아보기 →</a></article>
  </div></section>
  <section class="home-section home-faq" aria-labelledby="home-faq-title"><div class="home-section-heading"><h2 id="home-faq-title">시작 전에 궁금할 수 있어요</h2></div>
    <details><summary>백엔드가 처음인데, 어디서 시작하나요?</summary><p>기본 시작점인 0-1에서 작은 Java API를 먼저 만드세요. Java 문법이 익숙하면 ‘시작점 바꾸기’에서 게시글 API를 선택하고, SQL을 연습하려면 DB 경로를 고르면 됩니다.</p></details>
    <details><summary>여기서 코드를 작성하고 실행하나요?</summary><p>코드는 내 IDE에서 작성하고 서버도 직접 실행합니다. 학습 화면에서 요구사항과 가이드를 확인하고, 과제의 요청 도구로 내 서버에 요청을 보냅니다. 홈의 미리보기는 예시 데이터로 동작합니다.</p></details>
    <details><summary>학습 기록과 완료 표시는 어떻게 남나요?</summary><p>직접 시작한 과제의 마지막 학습 장면을 이 브라우저에 저장합니다. 현재 이어하기는 Java·게시글 API·DB 시작 경로와 각각의 다음 과제, 총 6개 과제에서 지원합니다. 과제를 구경하거나 개념 설명을 열어도 하던 작업은 바뀌지 않습니다. ‘직접 확인 완료’는 본인의 확인 기록이며 자동 채점 결과가 아닙니다. 브라우저 데이터를 지우면 기록도 사라집니다.</p></details>
  </section>
  <section class="home-environment" id="home-environment"><div><p class="home-eyebrow">첫 실행을 위한 준비</p><h2>개발 환경이 아직이라면</h2><p>Docker 런타임 · IntelliJ IDEA · JDK 21<br>설치부터 서버 실행, DB 접속까지 차례로 확인하세요.</p></div><a class="home-text-button" href="#전체-안내" data-home-setup>개발 환경 안내 보기 →</a></section>
  <details class="home-original" id="전체-안내"><summary><span><strong>설치·실행과 전체 안내</strong><small>원문 README · DB 접속 · 테스트 · 작업 방식</small></span><span aria-hidden="true">＋</span></summary><div class="home-original-content">${renderedHtml}</div></details>
  <footer class="home-footer"><a href="index.html">javaExperience</a><span>한 번에 기능 하나씩, 직접 만들며 배웁니다.</span><a href="https://github.com/ai-ext/javaExperience">GitHub ↗</a></footer>
  <p class="home-progress-note" data-home-storage role="status"></p>
  <dialog class="home-dialog" id="home-start-dialog" aria-labelledby="home-start-dialog-title"><form method="dialog"><header class="home-dialog-head"><div><p class="home-eyebrow">내게 맞는 첫 과제</p><h2 id="home-start-dialog-title">어디서 시작할까요?</h2></div><button class="home-close" value="cancel" aria-label="시작점 선택 닫기">×</button></header><div class="home-dialog-body"><p>지금 익숙한 것에 맞춰 시작하세요. 나중에 바꿀 수 있습니다.</p><fieldset><legend>시작할 학습 경로</legend>${choices.map(([id,title,description]) => `<label class="home-choice"><input type="radio" name="start" value="${id}"${id === '0-1' ? ' checked' : ''}><span><strong>${title}</strong><small>${description}</small></span></label>`).join('')}</fieldset><div class="home-selection-detail" data-home-selection aria-live="polite">${esc(task.work)}<br>${esc(task.goal)}</div><p class="home-demo-note">선택을 적용하면 큰 과제 카드와 완성 예시가 바뀝니다. 하던 과제의 진도는 보관하며, 새 시작 버튼을 누를 때 진행 과제를 전환합니다.</p></div><footer class="home-dialog-actions"><button class="home-text-button" value="cancel">취소</button><button class="home-primary" type="button" data-home-apply>선택 적용</button></footer></form></dialog>
  <dialog class="home-dialog" data-kind="concept" id="home-concept-dialog" aria-labelledby="home-concept-dialog-title"><header class="home-dialog-head"><div><p class="home-eyebrow">0-1에서 만나는 개념 · 객체와 참조</p><h2 id="home-concept-dialog-title">new로 객체를 만들면 무엇이 생길까?</h2></div><button class="home-close" type="button" data-home-close aria-label="시각 설명 닫기">×</button></header>${renderHomeNewVisual()}</dialog>
  ${renderHomePreparation(root)}
  </section>`;
}
