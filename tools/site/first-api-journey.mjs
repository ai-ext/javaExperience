/** 1-1: 만들기와 요청 확인은 서로 다른 화면이며, 원문의 정답·채점은 아래에 보존한다. */
export function renderFirstApiJourney() {
  const fields = [
    ['boardSlug', 'String'], ['title', 'String'], ['content', 'String'],
    ['tags', 'List<String>'], ['visibility', 'String'],
  ];
  return `<section class="first-api-journey" data-journey="scenario" aria-label="1-1 첫 API 직접 만들기">
    <div class="journey-shell">
      <aside class="journey-rail" aria-label="현재 학습 위치"><p>게시글 만들기</p>
        <div class="journey-rail-current"><span>1-1 · 지금</span><strong>요청 받기</strong><small>먼저 Controller 작성</small></div>
        <div class="journey-rail-next"><span>완료 후</span><strong>요청 보내 확인</strong><small>같은 1-1 단계</small></div>
        <a href="1-2-dto-response.html"><span>다음 과제</span><strong>1-2 · DB 저장</strong><small>201과 새 글 행</small></a>
        <p class="journey-rail-boundary">이번에는 요청만 받습니다. 글은 아직 DB에 저장하지 않습니다.</p>
      </aside>
      <div class="journey-main">
        <article class="journey-screen journey-scenario" data-journey-screen="scenario" aria-labelledby="journey-scenario-title">
          <p class="journey-scenario-kicker">1-1 · 첫 API</p><p class="journey-scenario-quote">“게시글 작성 요청을 받을 API가 필요해요.”</p>
          <h2 id="journey-scenario-title">먼저 JSON을 받는 API를 만들어 주세요.</h2>
          <div class="journey-scenario-story" aria-hidden="true"><div><span>JSON 요청</span><strong>새 게시글</strong></div><b>→</b><div><span>Spring Boot</span><strong>POST /api/posts</strong></div></div>
          <dl class="journey-scenario-brief"><div><dt>만들 것</dt><dd><code>PostCreateRequest.java</code> · <code>PostController.java</code></dd></div><div><dt>보낼 것</dt><dd><code>POST /api/posts</code></dd></div></dl>
          <button type="button" class="journey-next journey-scenario-start" data-journey-go="build">만들 파일 보기 <span aria-hidden="true">→</span></button>
        </article>
        <article class="journey-screen" data-journey-screen="build" hidden aria-labelledby="journey-build-title">
          <header class="journey-head"><div><p class="journey-eyebrow">1-1 · 먼저 만들기</p><h2 id="journey-build-title">PostController.java부터 만드세요</h2>
            <p><code>POST /api/posts</code>가 JSON을 받아 문자열 <code>success</code>를 돌려줍니다.</p></div>
            <div class="journey-head-actions"><button type="button" class="journey-back" data-journey-go="scenario">← 상황</button><a class="journey-primary" href="#구현-가이드" data-task-open="true" data-task-start="true">구현 가이드 열기 <span aria-hidden="true">↗</span></a></div></header>
          <div class="journey-build-grid">
            <div class="journey-editor"><header><strong>PostController.java</strong><span>직접 작성할 파일</span></header><p>src / main / java / org / example / post</p>
              <pre aria-label="PostController 작업 위치 예시"><code><span>01</span> package org.example.post;
<span>02</span>
<span>03</span> @RestController
<span>04</span> public class PostController {
<span>05</span>     // POST /api/posts 메서드를 직접 만드세요.
<span>06</span> }</code></pre>
              <footer>여기에 <code>@RequestBody PostCreateRequest</code>를 받는 메서드를 작성합니다. <code>log.info</code>로 제목을 기록하고 <code>success</code>를 반환하세요.</footer></div>
            <aside class="journey-contract" aria-label="요청 DTO 계약"><p class="journey-label">함께 만들 입력 형태</p><h3>PostCreateRequest</h3>
              <p>받을 JSON의 다섯 필드를 <code>record</code>로 선언합니다.</p>
              <div class="journey-field-list">${fields.map(([name, type]) => `<div data-field="${name}"><code>${name}</code><span>${type.replace('<','&lt;').replace('>','&gt;')}</span></div>`).join('')}</div>
              <small>파일: src/main/java/org/example/post/PostCreateRequest.java</small></aside>
          </div>
          <div class="journey-bottom"><div><strong>구현 후 기대 결과</strong><span><code>POST /api/posts</code> → <code>200 OK · success</code></span><small>예상 흐름 · 실제 실행 결과 아님 · DB 저장 없음</small></div>
            <button type="button" class="journey-next" data-journey-go="run">코드를 만들었으면 요청 보내기 <span aria-hidden="true">→</span></button></div>
        </article>
        <article class="journey-screen" data-journey-screen="run" hidden aria-labelledby="journey-run-title">
          <header class="journey-head"><div><p class="journey-eyebrow">1-1 · 직접 확인</p><h2 id="journey-run-title">이제 POST 요청을 보내세요</h2>
            <p>방금 만든 Controller가 JSON을 받는지 서버에 요청합니다.</p></div><button type="button" class="journey-back" data-journey-go="build">← 코드 작성 화면</button></header>
          <div class="journey-run-grid"><div class="journey-run-console"><div class="journey-console-title"><strong>HTTP 요청 보내기</strong><span>실제 서버 호출</span></div>
              <div data-journey-server-slot></div><div data-journey-request-slot></div></div>
            <aside class="journey-result-rail"><div class="journey-expected"><p class="journey-label">기대값</p><strong>200 OK</strong><code>success</code><small>이 값은 채점 계약입니다.</small></div>
              <div class="journey-observed" aria-live="polite"><p class="journey-label">내 결과</p><strong data-journey-observed-status>아직 실행하지 않았어요</strong><pre data-journey-observed-body></pre></div>
              <div class="journey-log"><p class="journey-label">기대 로그</p><code>게시글 작성 요청: [채점] 첫 게시글</code></div>
              <div class="journey-db"><p class="journey-label">DB 관찰</p><span>이번 단계: 저장한 행 없음</span></div></aside></div>
          <footer class="journey-run-footer"><details><summary>요청이 실패했다면 어디를 볼까요?</summary><p>서버 실행·경로·JSON과 CORS를 확인하세요. 깨진 JSON의 400은 정상 요청을 확인한 뒤 실험합니다.</p><a href="#browser-request-1-2" data-task-open="true">깨진 JSON 요청 열기 →</a></details>
            <a href="1-2-dto-response.html">200과 success를 확인했다면 1-2 DB 저장으로 →</a></footer>
        </article>
      </div>
    </div>
    <details class="journey-reference"><summary>화면 시안과 전체 흐름 다시 보기</summary><p>작업과 요청을 해 본 뒤 각 시안과 전체 흐름을 되짚어 보세요.</p><a href="../../docs/design/mockups-2026-10-15-batch10/01-first-api-scenario.png" target="_blank" rel="noopener">시나리오 첫 화면 ↗</a> · <a href="../../docs/design/mockups-2026-10-15-batch6/04-build-focused.png" target="_blank" rel="noopener">코드 작성 화면 시안 ↗</a> · <a href="../../docs/design/mockups-2026-10-15-batch6/05-run-focused.png" target="_blank" rel="noopener">요청 확인 화면 시안 ↗</a> · <a href="../../docs/design/mockups-2026-10-15-batch4/03-first-api-rich.png" target="_blank" rel="noopener">전체 흐름 참조 ↗</a></details>
  </section>`;
}
