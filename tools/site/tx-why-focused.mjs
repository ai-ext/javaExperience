/** W11: 1-3의 태그/글 실패를 재사용해 업무 트랜잭션 경계를 설명한다. */
export function renderTxWhyFocused() {
  return `<section class="tx-why-focused" data-tx-why-screen="partial" aria-label="Service 트랜잭션 경계 비교">
    <article class="tx-why-screen" data-tx-why-panel="partial" aria-labelledby="tx-why-partial-title">
      <p class="tx-why-kicker">W11 · 1-3의 실패를 다시 보기</p><h2 id="tx-why-partial-title">왜 태그만 남고 글은 없을까요?</h2>
      <p class="tx-why-lead">바깥 Service 트랜잭션이 없다고 가정합니다. 저장소 호출이 각각 끝나면 앞의 성공을 되돌릴 수 없습니다.</p>
      <div class="tx-why-timeline" aria-label="Service 트랜잭션 경계가 없을 때"><div class="is-current"><small>먼저</small><strong>TagRepository.save()</strong><span>새 태그 저장 → 이 호출의 commit</span></div><b aria-hidden="true">→</b><div><small>그다음</small><strong>PostRepository.save()</strong><span>201자 제목으로 실패</span></div></div>
      <div class="tx-why-result"><small>설명용 결과 · 실제 DB 실행 전</small><span><b>tag</b> 남음</span><span><b>post</b> 없음</span></div>
      <p class="tx-why-meaning">이미 commit된 첫 저장은 뒤의 실패로 되돌아가지 않습니다.</p>
      <button type="button" class="tx-why-primary" data-tx-why-go="atomic">다음: Service에서 한 번에 묶기 →</button>
    </article>
    <article class="tx-why-screen" data-tx-why-panel="atomic" hidden aria-labelledby="tx-why-atomic-title">
      <p class="tx-why-kicker">W11 · 한 업무 경계 만들기</p><h2 id="tx-why-atomic-title">Service에서 두 저장을 묶으면 무엇이 달라질까요?</h2>
      <p class="tx-why-lead">외부에서 호출한 <code>PostService.create()</code>가 태그와 글 저장을 같은 DB 트랜잭션으로 묶습니다.</p>
      <div class="tx-why-boundary"><header><strong>@Transactional PostService.create()</strong><small>이 DB 작업들의 한 경계</small></header><div><span>태그 저장 <small>아직 commit 아님</small></span><b>→</b><span>글 저장 실패 <small>201자 제목</small></span></div><p>실패가 메서드 밖으로 나가면 이 트랜잭션의 DB 작업을 rollback</p></div>
      <div class="tx-why-result"><small>설명용 결과 · 실제 DB 실행 전</small><span><b>tag</b> 없음</span><span><b>post</b> 없음</span></div>
      <p class="tx-why-meaning">한 업무의 DB 저장을 Service 메서드 경계로 묶습니다. 다른 DB나 외부 메시지는 이 경계에 자동 포함되지 않습니다.</p>
      <footer class="tx-why-actions"><button type="button" data-tx-why-go="partial">← 묶기 전</button><a href="S08-transactions.html">다음: Spring은 경계를 언제 열고 닫을까? →</a></footer>
    </article>
    <details class="tx-why-reference"><summary>두 장면 이미지 시안 보기</summary><a href="../design/mockups-2026-10-15-batch13/01-without-service-boundary.png">경계 없음</a><a href="../design/mockups-2026-10-15-batch13/02-with-service-boundary.png">Service 경계</a></details>
  </section>`;
}
