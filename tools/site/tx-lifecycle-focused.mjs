/** S08: 선언, 정상 종료, 런타임 실패의 서로 다른 시점을 먼저 보여 준다. */
export function renderTxLifecycleFocused() {
  return `<section class="tx-why-focused tx-life-focused" data-tx-life-screen="start" aria-label="Spring 트랜잭션 실행 시점">
    <article class="tx-why-screen tx-life-screen" data-tx-life-panel="start" aria-labelledby="tx-life-start-title">
      <p class="tx-why-kicker">S08 · 트랜잭션 시작</p><h2 id="tx-life-start-title">누가 트랜잭션을 시작할까요?</h2>
      <p class="tx-why-lead"><code>@Transactional</code>은 경계를 선언합니다. 외부 호출이 Spring 프록시를 지날 때 실행 규칙이 적용됩니다.</p>
      <div class="tx-life-flow" aria-label="호출자, Spring 프록시, 트랜잭션 관리자"><div><small>외부 호출자</small><strong>PostService.create()</strong><span>서비스 메서드 호출</span></div><b>→</b><div class="is-active"><small>Spring 프록시</small><strong>@Transactional 확인</strong><span>관리자에게 시작·참여 요청</span></div><b>→</b><div><small>PlatformTransactionManager</small><strong>DB 경계 준비</strong><span>기본 REQUIRED: 참여 또는 새로 시작</span></div></div>
      <p class="tx-why-meaning">프록시가 먼저 경계를 준비한 뒤 대상 Service 메서드를 실행합니다.</p>
      <details class="tx-life-hint"><summary>같은 객체 안에서 자기 메서드를 부르면?</summary><p>기본 proxy 모드에서는 새 프록시 경계를 지나지 않아 내부 메서드의 애노테이션이 새로 적용되지 않을 수 있습니다.</p></details>
      <button type="button" class="tx-why-primary" data-tx-life-go="commit">다음: 정상 반환이면 commit →</button>
    </article>
    <article class="tx-why-screen tx-life-screen" data-tx-life-panel="commit" hidden aria-labelledby="tx-life-commit-title">
      <p class="tx-why-kicker">S08 · 정상 종료</p><h2 id="tx-life-commit-title">Service가 정상으로 끝나면 언제 commit할까요?</h2>
      <p class="tx-why-lead">Service의 반환이 프록시로 돌아오면, 프록시가 TransactionManager에 완료를 요청합니다.</p>
      <div class="tx-life-flow" aria-label="정상 반환 뒤 commit"><div><small>대상 Service</small><strong>정상 반환</strong><span>작업 결과를 프록시에 전달</span></div><b>→</b><div class="is-active"><small>Spring 프록시</small><strong>commit 요청</strong><span>manager.commit(status)</span></div><b>→</b><div><small>DB 트랜잭션</small><strong>변경 확정</strong><span>호출자에게 결과 반환</span></div></div>
      <p class="tx-life-state">정상 반환 → commit 요청 → DB 확정</p>
      <p class="tx-life-caveat">이미 rollback-only 상태라면 최종 commit 대신 rollback되고 오류가 드러날 수 있습니다. <code>flush</code>는 commit과 다릅니다.</p>
      <footer class="tx-why-actions"><button type="button" data-tx-life-go="start">← 시작 시점</button><button type="button" class="tx-why-primary" data-tx-life-go="rollback">다음: RuntimeException이 밖으로 나오면 →</button></footer>
    </article>
    <article class="tx-why-screen tx-life-screen" data-tx-life-panel="rollback" hidden aria-labelledby="tx-life-rollback-title">
      <p class="tx-why-kicker">S08 · 실패 종료</p><h2 id="tx-life-rollback-title">RuntimeException이 Service 밖으로 나오면?</h2>
      <p class="tx-why-lead">프록시가 기본 롤백 규칙을 적용하고 TransactionManager에 되돌림을 요청합니다.</p>
      <div class="tx-life-flow" aria-label="런타임 예외 뒤 rollback"><div><small>대상 Service</small><strong>RuntimeException</strong><span>예외가 메서드 밖으로 나옴</span></div><b>→</b><div class="is-active is-error"><small>Spring 프록시</small><strong>rollback 요청</strong><span>manager.rollback(status)</span></div><b>→</b><div><small>DB 트랜잭션</small><strong>변경 취소</strong><span>예외는 호출자에게 전파</span></div></div>
      <p class="tx-life-state is-error">기본 규칙: RuntimeException·Error는 rollback</p>
      <p class="tx-life-caveat">checked 예외는 기본 롤백 대상이 아닙니다. 필요하면 <code>rollbackFor</code> 등으로 규칙을 명시합니다.</p>
      <footer class="tx-why-actions"><button type="button" data-tx-life-go="commit">← 정상 종료</button><a href="#롤백-규칙-매칭" data-tx-life-source="true">트랜잭션 규칙 더 보기 ↗</a></footer>
    </article>
    <details class="tx-why-reference"><summary>세 장면 이미지 시안 보기</summary><a href="../design/mockups-2026-10-15-batch14/01-transaction-start.png">시작</a><a href="../design/mockups-2026-10-15-batch14/02-normal-commit.png">commit</a><a href="../design/mockups-2026-10-15-batch14/03-runtime-rollback.png">rollback</a></details>
  </section>`;
}
