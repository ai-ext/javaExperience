const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export function renderFunctionalProjectContext({ rootPrefix = '../../' } = {}) {
  return `<section class="fw-project-context" aria-labelledby="fw-project-context-title">
    <div class="fw-project-context-heading">
      <div><p class="fw-eyebrow">학습 프로젝트 안내</p><h2 id="fw-project-context-title">별도 커뮤니티 프로젝트 실습</h2></div>
      <a href="${esc(rootPrefix + 'course/spring/README.html')}">45일 과정으로 →</a>
    </div>
    <p>제공된 시작 ZIP의 community 프로젝트에서 진행합니다. 45일 과정의 board-server와 요청·응답·DB 구조가 다릅니다.</p>
    <p class="fw-project-server-note">지금 실행한 실습 프로젝트의 서버 주소를 입력하세요.</p>
    <details>
      <summary>프로젝트 차이 확인</summary>
      <div class="fw-project-table-wrap"><table>
        <thead><tr><th scope="col">동작</th><th scope="col">45일 과정 · board</th><th scope="col">community</th></tr></thead>
        <tbody>
          <tr><th scope="row">글 작성</th><td>201 Created · Location · 본문 없음</td><td>201 Created · JSON 본문</td></tr>
          <tr><th scope="row">좋아요</th><td>204 No Content · 본문 없음</td><td>200 OK · liked · likeCount</td></tr>
        </tbody>
      </table></div>
    </details>
  </section>`;
}
