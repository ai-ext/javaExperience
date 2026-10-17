/** 1-3: 상황·구현·실행·DB 증거·실패 실험을 서로 다른 장면으로 보여 준다. */
export function renderFirstTransactionJourney() {
  return `<section class="first-db-journey tx-journey" data-tx-screen="scenario" aria-label="1-3 글과 태그를 한 트랜잭션으로 저장">
    <article class="db-journey-screen tx-screen" data-tx-panel="scenario" aria-labelledby="tx-scenario-title">
      <p class="db-journey-kicker">1-3 · 글과 태그 저장</p><p class="db-journey-quote">“태그도 저장해 주세요. 같은 이름은 한 번만 붙여 주세요.”</p>
      <h2 id="tx-scenario-title">글과 태그를 한 작업으로 저장해 주세요.</h2>
      <div class="db-journey-story" aria-hidden="true"><div><span>새 게시글</span><strong>[채점] 태그 저장</strong><small>spring · 채점태그</small></div><b>→</b><div class="db-journey-row"><span>이번 작업</span><strong>글과 태그 저장</strong></div></div>
      <dl class="db-journey-brief"><div><dt>만들 것</dt><dd><code>PostService.java</code>에서 글·태그 저장 묶기</dd></div><div><dt>보낼 것</dt><dd><code>POST /api/posts</code> · <code>tags</code> 포함</dd></div></dl>
      <button type="button" class="db-journey-primary" data-tx-go="service">만들 파일 보기 →</button>
    </article>

    <article class="db-journey-screen tx-screen" data-tx-panel="service" hidden aria-labelledby="tx-service-title">
      <p class="db-journey-kicker">1-3 · Service 만들기</p><h2 id="tx-service-title">PostService.java에 저장 흐름을 옮기세요.</h2>
      <p class="db-journey-lead">Controller는 HTTP를 맡고, Service가 게시판·태그·글을 한 작업으로 저장합니다.</p>
      <div class="tx-service-work"><div class="db-journey-editor"><header><strong>PostService.java</strong><small>org.example.post · 직접 작성</small></header><pre><code>@Service
public class PostService {
    @Transactional
    public Post create(PostCreateRequest request) {
        // 게시판 찾기 → 태그 찾거나 만들기 → 글 저장
    }
}</code></pre><p>이 코드는 작업 위치만 보여 줍니다. 저장소 주입과 처리 로직은 직접 작성하세요.</p></div>
        <aside class="tx-service-boundary"><p>한 업무 경계</p><strong>PostService.create()</strong><span>게시판 조회</span><span>태그 찾거나 만들기</span><span>글과 태그 연결 저장</span><small>정상 종료는 commit, 이 단계의 DB 예외가 밖으로 나가면 rollback</small></aside></div>
      <details class="tx-extra-files"><summary>이어서 바꿀 파일 확인</summary><p><code>Tag.java</code> · <code>TagRepository.java</code> · <code>Post.java</code> · <code>PostController.java</code> · <code>PostResponse.java</code>. 1-2의 요청 DTO와 Board/Post Repository는 유지합니다.</p></details>
      <footer class="db-journey-actions"><button type="button" class="db-journey-back" data-tx-go="scenario">← 상황</button><a href="#구현-가이드" data-task-open="true">Service 구현 가이드 열기 ↗</a><button type="button" class="db-journey-next" data-tx-go="tags">다음: 태그 중복 처리 →</button></footer>
    </article>

    <article class="db-journey-screen tx-screen" data-tx-panel="tags" hidden aria-labelledby="tx-tags-title">
      <p class="db-journey-kicker">1-3 · 태그 규칙</p><h2 id="tx-tags-title">spring이 두 번 오면 태그도 두 번 저장될까요?</h2>
      <p class="db-journey-lead">요청 안의 같은 이름을 먼저 하나로 만든 뒤, DB에 있으면 재사용합니다.</p>
      <div class="tx-tag-comparison"><div><p>요청의 tags</p><code>spring</code><code>채점태그</code><code>spring</code></div><b aria-hidden="true">→</b><div><p>이번 작업에서 쓸 이름</p><code>spring <small>기존 태그</small></code><code>채점태그 <small>없으면 새로 생성</small></code></div></div>
      <p class="tx-tag-expected">구현 후 기대값 · <code>post_tag</code>에는 글 한 건과 태그를 잇는 행 두 개</p>
      <footer class="db-journey-actions"><button type="button" class="db-journey-back" data-tx-go="service">← Service</button><a href="#따라-치기" data-task-open="true">태그 구현 순서 열기 ↗</a><button type="button" class="db-journey-next" data-tx-go="run">다음: POST 요청 →</button></footer>
    </article>

    <article class="db-journey-screen tx-screen" data-tx-panel="run" hidden aria-labelledby="tx-run-title">
      <p class="db-journey-kicker">1-3 · 내 서버에 요청</p><h2 id="tx-run-title">태그를 넣어 POST 요청을 보내세요.</h2>
      <p class="db-journey-lead">정상 요청 A를 두 번 보냅니다. 입력에는 <code>spring</code>이 두 번 있지만 응답에는 태그 두 개만 있어야 합니다.</p>
      <div class="db-journey-pair db-journey-run-pair"><div class="db-journey-console"><header><strong>정상 요청 A</strong><small>같은 요청 두 번 · 실제 서버 호출</small></header><div data-tx-server-run-slot></div><div data-tx-request-run-slot></div></div>
        <aside class="db-journey-expect"><p>기대값 · 실행 결과 아님</p><strong>201 Created</strong><code>Location: /api/posts/{id}</code><span>응답의 <code>tags</code>: <code>spring</code>, <code>채점태그</code> · 중복 없음</span><span>두 번째 응답 id는 첫 번째보다 커야 합니다.</span><hr><p>내 서버 결과</p><strong class="db-journey-actual" data-tx-run-status>아직 실행 전</strong><pre data-tx-run-result></pre></aside></div>
      <footer class="db-journey-actions"><button type="button" class="db-journey-back" data-tx-go="tags">← 태그 규칙</button><button type="button" class="db-journey-next" data-tx-go="links">다음: DB에서 연결 확인 →</button></footer>
    </article>

    <article class="db-journey-screen tx-screen" data-tx-panel="links" hidden aria-labelledby="tx-links-title">
      <p class="db-journey-kicker">1-3 · DB 증거 1</p><h2 id="tx-links-title">방금 만든 글에 태그 두 개가 연결됐나요?</h2>
      <p class="db-journey-lead">응답에서 받은 id를 조건에 넣어 <code>post_tag</code>를 직접 조회합니다.</p>
      <div class="db-journey-pair"><div class="db-journey-id"><p>마지막 201 응답에서 받은 글 id</p><strong data-tx-post-id>아직 id를 받지 않았어요</strong><small data-tx-post-id-note>앞 화면에서 정상 요청 A를 보내세요.</small></div><div class="db-journey-query"><header><strong>DB에서 직접 실행</strong><small>community · post_tag + tag</small></header><pre><code data-tx-links-sql>SELECT t.name FROM post_tag pt JOIN tag t ON t.id = pt.tag_id
WHERE pt.post_id = {id} ORDER BY t.name;</code></pre><button type="button" data-tx-copy="links" disabled>조회 SQL 복사</button><p data-tx-copy-state="links" role="status" aria-live="polite"></p></div></div>
      <div class="tx-proof"><p>기대 결과 · 실제 DB 조회 전</p><strong>spring</strong><strong>채점태그</strong><small>실제 행은 이 페이지가 읽지 않습니다. DB 도구의 결과와 비교하세요.</small></div>
      <footer class="db-journey-actions"><button type="button" class="db-journey-back" data-tx-go="run">← 요청 결과</button><a href="#직접-확인" data-task-open="true">DB 접속 방법 열기 ↗</a><button type="button" class="db-journey-next" data-tx-go="count">다음: 태그 행 개수 →</button></footer>
    </article>

    <article class="db-journey-screen tx-screen" data-tx-panel="count" hidden aria-labelledby="tx-count-title">
      <p class="db-journey-kicker">1-3 · DB 증거 2</p><h2 id="tx-count-title">같은 태그를 또 만들지 않았을까요?</h2>
      <p class="db-journey-lead">정상 요청 A를 두 번 보낸 뒤 <code>tag</code> 테이블에서 이름의 개수를 셉니다.</p>
      <div class="tx-single-query db-journey-query"><header><strong>DB에서 직접 실행</strong><small>community · tag</small></header><pre><code data-tx-count-sql>SELECT COUNT(*) FROM tag WHERE name = '채점태그';</code></pre><button type="button" data-tx-copy="count">태그 개수 SQL 복사</button><p data-tx-copy-state="count" role="status" aria-live="polite"></p></div>
      <p class="tx-single-expect">기대값 · 실제 DB 조회 전 <strong>COUNT(*) = 1</strong></p>
      <footer class="db-journey-actions"><button type="button" class="db-journey-back" data-tx-go="links">← 연결된 태그</button><button type="button" class="db-journey-next" data-tx-go="failure">다음: 실패 관찰 요청 →</button></footer>
    </article>

    <article class="db-journey-screen tx-screen" data-tx-panel="failure" hidden aria-labelledby="tx-failure-title">
      <p class="db-journey-kicker">1-3 · 관찰 O2 · 채점 제외</p><h2 id="tx-failure-title">일부러 실패시켜도 새 태그가 남을까요?</h2>
      <p class="db-journey-lead">201자 제목과 새 태그를 보냅니다. 긴 제목은 현재 단계에서 DB가 거절합니다. 1-5에서 요청 검증을 추가합니다.</p>
      <div class="db-journey-pair db-journey-run-pair"><div class="db-journey-console"><header><strong>관찰 요청 O2</strong><small>정상 요청 뒤에 실행</small></header><div data-tx-server-failure-slot></div><div data-tx-request-failure-slot></div></div>
        <aside class="db-journey-expect"><p>현재 단계의 예상 · 채점 제외</p><strong class="tx-error-status">500</strong><span>제목이 DB 한도를 넘어서 글 저장이 실패합니다.</span><span>새 태그가 남는지는 다음 화면의 DB 조회로 증명합니다.</span><hr><p>내 서버 결과</p><strong class="db-journey-actual" data-tx-failure-status>아직 실행 전</strong></aside></div>
      <footer class="db-journey-actions"><button type="button" class="db-journey-back" data-tx-go="count">← 태그 개수</button><button type="button" class="db-journey-next" data-tx-go="rollback">다음: DB에서 되돌림 확인 →</button></footer>
    </article>

    <article class="db-journey-screen tx-screen" data-tx-panel="rollback" hidden aria-labelledby="tx-rollback-title">
      <p class="db-journey-kicker">1-3 · DB 증거 3</p><h2 id="tx-rollback-title">실패한 요청의 새 태그는 DB에 남았나요?</h2>
      <p class="db-journey-lead">HTTP 500만으로는 롤백을 증명할 수 없습니다. O2 뒤에 DB를 직접 조회하세요.</p>
      <div class="tx-single-query db-journey-query"><header><strong>DB에서 직접 실행</strong><small>community · tag</small></header><pre><code data-tx-rollback-sql>SELECT COUNT(*) FROM tag WHERE name = '[채점]롤백태그';</code></pre><button type="button" data-tx-copy="rollback">되돌림 확인 SQL 복사</button><p data-tx-copy-state="rollback" role="status" aria-live="polite"></p></div>
      <p class="tx-single-expect">트랜잭션이 있다면 기대값 · 실제 DB 조회 전 <strong>COUNT(*) = 0</strong></p>
      <p class="tx-rollback-meaning"><code>@Transactional</code> 경계 안에서 먼저 만든 태그와 실패한 글 저장이 함께 되돌아갑니다.</p>
      <footer class="db-journey-actions"><button type="button" class="db-journey-back" data-tx-go="failure">← O2 요청</button><a href="../../docs/knowledge/W11-why-tx-in-service.html">왜 Service에 트랜잭션을 둘까요? ↗</a><a class="db-journey-next" href="1-4-save-to-db.html">다음 과제 1-4 →</a></footer>
    </article>

    <details class="db-journey-reference"><summary>여덟 장면의 이미지 시안 보기</summary><p>이미지의 기대값은 실제 서버·DB 실행 결과가 아닙니다.</p><a href="../../docs/design/mockups-2026-10-15-batch12/01-scenario.png">상황</a><a href="../../docs/design/mockups-2026-10-15-batch12/02-service.png">Service</a><a href="../../docs/design/mockups-2026-10-15-batch12/03-tags.png">태그</a><a href="../../docs/design/mockups-2026-10-15-batch12/04-request.png">요청</a><a href="../../docs/design/mockups-2026-10-15-batch12/05-post-tag.png">연결 확인</a><a href="../../docs/design/mockups-2026-10-15-batch12/06-tag-count.png">한 행 확인</a><a href="../../docs/design/mockups-2026-10-15-batch12/07-failure-request.png">O2 요청</a><a href="../../docs/design/mockups-2026-10-15-batch12/08-rollback-proof.png">되돌림</a></details>
  </section>`;
}
