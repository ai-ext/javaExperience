/** 홈에서 실제로 눌러 볼 수 있는 최종 서비스 예시. 학습자의 API 결과와 분리한다. */
export function renderHomeServicePreview() {
  return `<section class="home-service-section" aria-labelledby="home-service-heading">
  <header class="home-service-intro">
    <span class="home-service-badge">완성 모습 예시</span>
    <h2 id="home-service-heading">이런 커뮤니티를 직접 만들어요</h2>
    <p>작은 API를 연결해 글을 쓰고, 저장하고, 다시 읽는 서비스를 만듭니다.</p>
  </header>
  <div class="home-service-board" data-service-board data-service-mode="list">
    <header class="home-service-board-header">
      <div><span class="home-service-wordmark">java<span>Experience</span></span><span class="home-service-board-label">개발 이야기</span></div>
      <span class="home-service-example-label">직접 눌러 보는 예시</span>
    </header>
    <div class="home-service-workspace">
      <div class="home-service-list-pane" data-service-list-pane>
        <div class="home-service-list-header"><div><h3>글 목록</h3><p>배우고 만든 이야기를 나눠요.</p></div><button type="button" data-service-write>글쓰기 <span aria-hidden="true">＋</span></button></div>
        <div class="home-service-posts" data-service-posts></div>
      </div>
      <div class="home-service-reading-pane">
        <article class="home-service-detail" data-service-detail>
          <button type="button" class="home-service-back" data-service-back><span aria-hidden="true">←</span> 글 목록</button>
          <p class="home-service-view-label">글 상세</p>
          <h3 tabindex="-1" data-service-detail-title></h3>
          <div class="home-service-detail-byline"><span class="home-service-avatar" data-service-detail-avatar aria-hidden="true"></span><span><strong data-service-detail-author></strong><small>예시 게시글</small></span></div>
          <div class="home-service-detail-content" data-service-detail-content></div>
          <div class="home-service-comment" data-service-comment><h4>댓글 <span>1</span></h4><div><span class="home-service-avatar home-service-avatar-green" aria-hidden="true">이</span><div><strong>이코딩 <small>예시 댓글</small></strong><p>저장한 글을 다시 읽어 오는 기능도 함께 만들어 봐요!</p></div></div></div>
        </article>
        <section class="home-service-compose" data-service-compose hidden aria-labelledby="home-service-compose-heading">
          <p class="home-service-view-label">글 작성</p><h3 id="home-service-compose-heading">새로운 이야기 남기기</h3>
          <p class="home-service-compose-note">입력한 글이 이 예시의 목록과 상세에 추가됩니다.</p>
          <form data-service-form novalidate>
            <label for="home-service-title">제목 <span>필수</span></label><input id="home-service-title" name="title" maxlength="120" aria-describedby="home-service-title-error" placeholder="어떤 이야기를 나누고 싶나요?" required>
            <p class="home-service-error" id="home-service-title-error" hidden></p>
            <label for="home-service-content">본문 <span>필수</span></label><textarea id="home-service-content" name="content" maxlength="3000" rows="6" aria-describedby="home-service-content-error" placeholder="만들면서 알게 된 것을 적어 보세요." required></textarea>
            <p class="home-service-error" id="home-service-content-error" hidden></p>
            <div class="home-service-compose-actions"><button type="button" data-service-cancel>취소</button><button type="submit" class="home-service-submit">예시 글 추가하기</button></div>
          </form>
        </section>
      </div>
    </div>
    <p class="home-service-status" data-service-status role="status">화면 체험용 예시입니다. 실제 API 요청이나 DB 저장은 하지 않으며, 새로고침하면 초기화됩니다.</p>
  </div>
  <ol class="home-service-milestones" aria-label="서비스가 완성되는 과정">
    <li><span>1</span><div><strong>글 작성</strong><p>제목과 본문을 요청으로 받아요.</p></div></li>
    <li><span>2</span><div><strong>DB 저장</strong><p>작성한 글을 데이터로 남겨요.</p></div></li>
    <li><span>3</span><div><strong>목록·상세 조회</strong><p>저장한 글을 다시 불러와요.</p></div></li>
    <li><span>4</span><div><strong>댓글·좋아요</strong><p>글에 반응하는 기능을 더해요.</p></div></li>
  </ol>
  <p class="home-service-scope">각 기능은 과정을 따라 순서대로 추가합니다.</p>
  <a class="home-service-course-link" href="scenario/README.html">서비스 만들기 전체 과정 보기 <span aria-hidden="true">→</span></a>
</section>`;
}
