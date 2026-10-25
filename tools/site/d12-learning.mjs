import { D12_LESSONS, D12_ASSETS, d12AssetRoot } from './d12-lesson-data.mjs';

const escape = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

export function renderD12Learning(lessons = D12_LESSONS, assets = D12_ASSETS, assetRoot = d12AssetRoot) {
  const firstLesson = lessons[0];
  const firstStage = firstLesson?.stages?.[0];
  if (!firstLesson || !firstStage) throw new Error('D12 학습 질문과 상태가 필요합니다.');
  const data = JSON.stringify({ lessons, assets, assetRoot }).replace(/</g, '\\u003c');
  return `<section class="p09-learning d12-learning" data-d12-learning aria-labelledby="d12-learning-heading">
    <script type="application/json" data-d12-data>${data}</script>
    <header class="d12-intro"><h2 id="d12-learning-heading" data-d12-question>${escape(firstLesson.question)}</h2></header>
    <label class="p09-topic-label" for="d12-topic">살펴볼 질문<select id="d12-topic" data-d12-topic>${lessons.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="선택한 D12 리눅스·터미널 학습 상태">
      <header class="p09-question"><p data-d12-source>${escape(firstLesson.source)}</p></header>
      <div class="p09-stages" data-d12-stages role="group" aria-label="관측 상태 선택"></div>
      <h3 data-d12-title>${escape(firstStage.title)}</h3><p class="p09-lead" data-d12-lead>${escape(firstStage.lead || '')}</p>
      <div class="p09-workspace">
        <figure class="p09-figure"><div class="p09-image-frame d12-image-frame" data-d12-image-frame hidden><div class="p09-image-window"><img data-d12-image alt="" width="1672" height="941"><span class="p09-focus" data-d12-focus aria-hidden="true" hidden></span></div></div>
          <p class="d12-image-pending" data-d12-image-pending>이 상태에는 표시할 그림이 없습니다.</p>
          <figcaption><span data-d12-figure-label>상태에 연결된 그림</span><button type="button" data-d12-zoom aria-pressed="false" hidden>강조 구간 확대</button><a data-d12-image-link target="_blank" rel="noopener" hidden>원본 그림 보기 ↗</a></figcaption>
        </figure>
        <div class="p09-observation"><section class="p09-value-sheet"><h3>관측값과 근거 유형</h3><p data-d12-evidence-kind></p><dl data-d12-state></dl><p data-d12-pending role="status">이 상태에 표시할 관측 정보가 없습니다.</p></section>
          <section class="p09-code-sheet"><div><h3 data-d12-code-heading>함께 읽을 코드·설명</h3><button type="button" data-d12-copy disabled>현재 코드 복사</button></div><p data-d12-code-kind></p><pre data-d12-code-frame><code data-d12-code data-d12-copy-content></code></pre><p class="d12-prose" data-d12-prose data-d12-copy-content hidden></p><p data-d12-copy-status role="status"></p></section></div>
      </div>
      <p class="p09-note" data-d12-note>${escape(firstLesson.note)}</p>
      <details class="d12-source-details" data-d12-source-details hidden><summary>출처·원자료 보기</summary><p data-d12-source-fragments></p><div data-d12-source-code></div><p data-d12-evidence></p><p data-d12-evidence-link></p><details data-d12-full-evidence hidden><summary>원출력 보기</summary><pre><code data-d12-full-evidence-code></code></pre></details></details>
      <footer class="p09-controls"><button type="button" data-d12-prev disabled>← 이전</button><span data-d12-position role="status"></span><button type="button" data-d12-next>다음 →</button></footer>
    </section>
    <details class="d12-scope"><summary>실험 범위와 읽는 방법</summary><p>실제 관측값과 설명 모델, 실행하지 않은 원문 명령을 구분해서 읽습니다. 명령이나 서비스 제어를 실행하지 않고 보관된 관측을 선택합니다. Linux fixture의 로그·파일·프로세스·소켓·컨테이너 조건을 출처에서 확인할 수 있습니다.</p></details>
    <p class="p09-original-link"><a href="#d12-original" data-d12-original-link>원문 전체 · 실습과 자가점검 보기 ↓</a></p>
  </section>`;
}
