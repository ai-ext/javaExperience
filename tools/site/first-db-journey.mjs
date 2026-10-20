/** 1-2: 상황 → 엔티티 → 응답 → 실제 요청 → DB 확인. 긴 원문은 별도로 보존한다. */
export function renderFirstDbJourney() {
  return `<section class="first-db-journey" data-db-screen="scenario" aria-label="1-2 첫 DB 저장 실습">
    <article class="db-journey-screen" data-db-panel="scenario" aria-labelledby="db-scenario-title">
      <p class="db-journey-kicker">1-2 · 첫 DB 저장</p>
      <p class="db-journey-quote">“글을 쓰면 서버를 껐다 켜도 남아야 해요.”</p>
      <h2 id="db-scenario-title">게시글을 DB에 저장하고 새 글 주소를 돌려주세요.</h2>
      <div class="db-journey-story" aria-hidden="true"><div><span>새 게시글</span><strong>[채점] 첫 게시글</strong></div><b>→</b><div class="db-journey-row"><span>community · post</span><strong>한 행으로 저장</strong></div></div>
      <dl class="db-journey-brief"><div><dt>먼저 만들 것</dt><dd><code>Post.java</code>부터 시작하기</dd></div><div><dt>보낼 것</dt><dd><code>POST /api/posts</code></dd></div></dl>
      <button type="button" class="db-journey-primary" data-db-go="entity">만들 파일 보기 <span aria-hidden="true">→</span></button>
    </article>
    <article class="db-journey-screen" data-db-panel="entity" hidden aria-labelledby="db-entity-title">
      <p class="db-journey-kicker">1-2 · 먼저 DB 표 연결하기</p><h2 id="db-entity-title">Post.java를 <code>post</code> 표와 연결하세요.</h2>
      <p class="db-journey-lead">엔티티를 만든 뒤 <code>Board</code>와 두 Repository를 선언합니다.</p>
      <div class="db-journey-pair"><div class="db-journey-editor"><header><strong>Post.java</strong><small>직접 작성할 파일</small></header><pre><code>@Entity
@Table(name = "post")
public class Post {
    // id와 저장할 필드를 직접 매핑하세요.
}</code></pre><p>위 코드는 시작 위치만 보여 줍니다. 필드·생성자·매핑은 직접 작성하세요.</p></div>
        <div class="db-journey-table"><header><strong>community.post</strong><small>이번 단계에 매핑할 컬럼</small></header><div><code>id</code><code>board_id</code><code>author_id</code><code>title</code><code>content</code><code>visibility</code><code>created_at</code><code>updated_at</code></div><p><code>id</code>는 DB가 붙입니다. 나머지 테이블 기본값은 1-4에서 더 자세히 다룹니다.</p></div></div>
      <footer class="db-journey-actions"><button type="button" class="db-journey-back" data-db-go="scenario">← 상황</button><a href="#엔티티-한-장-읽기" data-task-open="true">엔티티 작성 가이드 열기 ↗</a><button type="button" class="db-journey-next" data-db-go="response">다음: 응답 만들기 →</button></footer>
    </article>
    <article class="db-journey-screen" data-db-panel="response" hidden aria-labelledby="db-response-title">
      <p class="db-journey-kicker">1-2 · 저장한 글로 응답 만들기</p><h2 id="db-response-title">저장한 글의 주소를 응답에 넣으세요.</h2>
      <p class="db-journey-lead"><code>PostController.java</code>에서 게시판을 찾고 글을 저장한 뒤, 저장된 id로 응답을 만듭니다.</p>
      <div class="db-journey-pair"><div class="db-journey-editor db-journey-plan"><header><strong>PostController.java</strong><small>직접 작성할 파일</small></header><div><span>Board 조회</span><b>→</b><span>Post 저장</span><b>→</b><span>응답 구성</span></div><pre><code>postRepository.save(post)</code></pre><p>이번 단계에서는 Controller가 Repository를 직접 호출합니다. Service 분리는 1-3에서 합니다.</p></div>
        <div class="db-journey-receipt"><p>구현 후 기대값 · 실제 실행 전</p><strong>201 Created</strong><code>Location: /api/posts/{id}</code><span><code>PostResponse.id</code>도 같은 <code>{id}</code>입니다.</span><small>id는 DB가 붙입니다. 숫자를 미리 정하지 마세요.</small></div></div>
      <footer class="db-journey-actions"><button type="button" class="db-journey-back" data-db-go="entity">← 엔티티</button><a href="#구현-가이드" data-task-open="true">Controller 구현 가이드 열기 ↗</a><button type="button" class="db-journey-next" data-db-go="run">다음: 요청 보내기 →</button></footer>
    </article>
    <article class="db-journey-screen" data-db-panel="run" hidden aria-labelledby="db-run-title">
      <p class="db-journey-kicker">1-2 · 내 서버에서 실행</p><h2 id="db-run-title">이제 POST 요청을 보내세요.</h2>
      <p class="db-journey-lead">서버 주소를 확인한 뒤 정상 요청 A를 보내고, 실제 응답을 기대값과 비교합니다.</p>
      <div class="db-journey-pair db-journey-run-pair"><div class="db-journey-console"><header><strong>내 서버에 요청 보내기</strong><small>실제 HTTP 실행</small></header><div data-db-server-slot></div><div data-db-request-slot></div></div>
        <aside class="db-journey-expect"><p>기대값 · 실행 결과 아님</p><strong>201 Created</strong><code>Location: /api/posts/{id}</code><span>응답 본문의 <code>id</code>는 <code>Location</code>의 id와 같아야 합니다.</span><hr><p>내 서버 결과</p><strong class="db-journey-actual" data-db-actual>아직 실행 전</strong><pre data-db-actual-body></pre></aside></div>
      <footer class="db-journey-actions"><button type="button" class="db-journey-back" data-db-go="response">← 응답 구현</button><button type="button" class="db-journey-next" data-db-go="database">다음: DB 행 확인 →</button></footer>
    </article>
    <article class="db-journey-screen" data-db-panel="database" hidden aria-labelledby="db-database-title">
      <p class="db-journey-kicker">1-2 · DB에서 증명하기</p><h2 id="db-database-title">응답의 id가 정말 DB에 있을까요?</h2>
      <p class="db-journey-lead">응답에서 받은 id로 조회하세요. <code>201</code>만 보고 저장됐다고 판단하지 않습니다.</p>
      <div class="db-journey-pair"><div class="db-journey-id"><p>내 서버의 마지막 응답</p><strong data-db-response-id>아직 id를 받지 않았어요</strong><small data-db-response-note>앞 화면에서 정상 요청 A를 보내세요.</small></div>
        <div class="db-journey-query"><header><strong>DB에서 직접 실행</strong><small>community · post</small></header><pre><code data-db-query>SELECT id, board_id, author_id, title, visibility
FROM post WHERE id = {id};</code></pre><button type="button" data-db-copy disabled>조회 SQL 복사</button><p data-db-copy-state role="status" aria-live="polite"></p></div></div>
      <div class="db-journey-proof"><p>기대 행 · 직접 조회해서 비교</p><div><span>id <b data-db-expected-id>{id}</b></span><span>board_id <b>2</b></span><span>author_id <b>2</b></span><span>title <b>[채점] 첫 게시글</b></span><span>visibility <b>PUBLIC</b></span></div><small>실제 DB 조회 결과는 이 화면이 자동으로 읽지 않습니다. 서버를 재시작한 뒤에도 행이 남는지 확인하세요.</small></div>
      <footer class="db-journey-actions"><button type="button" class="db-journey-back" data-db-go="run">← 요청 결과</button><a href="#직접-확인" data-task-open="true">DB 접속 방법 열기 ↗</a><a class="db-journey-next" href="1-3-service-layer.html">다음 과제 1-3 →</a></footer>
    </article>
    <details class="db-journey-reference"><summary>다섯 화면 시안과 원문 다시 보기</summary><p>시안은 학습 흐름의 기준이며 실제 실행 결과가 아닙니다.</p><a href="../../docs/design/mockups-2026-10-15-batch7/01-scenario-v2.jpg">상황</a><a href="../../docs/design/mockups-2026-10-15-batch7/02-entity-v2.jpg">엔티티</a><a href="../../docs/design/mockups-2026-10-15-batch7/03-response.jpg">응답</a><a href="../../docs/design/mockups-2026-10-15-batch7/04-request.jpg">요청</a><a href="../../docs/design/mockups-2026-10-15-batch7/05-db-check-v2.jpg">DB 확인</a></details>
  </section>`;
}
