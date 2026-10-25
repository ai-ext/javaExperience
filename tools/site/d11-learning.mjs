import { D11_LESSONS, D11_ASSETS, d11AssetRoot } from './d11-lesson-data.mjs';

const escape = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

export function renderD11Learning() {
  const lesson = D11_LESSONS.find(item => item.id === 'object-ownership');
  const stage = lesson.stages[0];
  const asset = D11_ASSETS[stage.image];
  const json = JSON.stringify({ lessons: D11_LESSONS, assets: D11_ASSETS, assetRoot: d11AssetRoot }).replace(/</g, '\\u003c');
  return `<section class="p09-learning d11-learning" data-d11-learning aria-labelledby="d11-learning-heading">
    <script type="application/json" data-d11-data>${json}</script>
    <header class="d11-intro"><h2 id="d11-learning-heading" data-d11-question>${escape(lesson.question)}</h2></header>
    <label class="p09-topic-label" for="d11-topic">살펴볼 질문<select id="d11-topic" data-d11-topic>${D11_LESSONS.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="선택한 D11 웹 보안 질문의 학습 장면">
      <header class="p09-question"><p data-d11-source>${escape(lesson.source)}</p></header>
      <div class="p09-stages" data-d11-stages role="group" aria-label="학습 기록 단계 선택"></div>
      <h3 data-d11-title>${escape(stage.title)}</h3><p class="p09-lead" data-d11-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame d11-image-frame"><div class="p09-image-window"><img data-d11-image src="${d11AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-d11-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-d11-figure-label>전체 학습 그림 · 현재 관측값은 아래에 표시</span><button type="button" data-d11-zoom aria-pressed="false">강조 구간 확대</button><a data-d11-image-link href="${d11AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
        <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 값과 경계</h3><p data-d11-evidence-kind></p><dl data-d11-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드·설명</h3><button type="button" data-d11-copy>현재 코드 복사</button></div><p data-d11-code-kind></p><pre><code data-d11-code></code></pre><p data-d11-copy-status role="status"></p></section></div>
      </div><p class="p09-note" data-d11-note>${escape(lesson.note)}</p>
      <details class="d11-source-details" data-d11-source-details hidden><summary>출처·실험 원자료 보기</summary><p data-d11-source-fragments></p><div data-d11-source-code></div><p data-d11-evidence></p><p data-d11-evidence-link></p><pre data-d11-full-evidence hidden><code data-d11-full-evidence-code></code></pre></details>
      <footer class="p09-controls"><button type="button" data-d11-prev disabled>← 이전</button><span data-d11-position role="status"></span><button type="button" data-d11-next>다음 →</button></footer>
    </section>
    <details class="d11-scope"><summary>실험 범위와 읽는 방법</summary><p>추가 Python·SQLite·Chrome 관측과 원문 기반 설명 모델을 구분합니다. 단계 선택은 기록을 탐색하는 동작이며 HTTP 요청을 다시 보내지 않습니다. 원문 Spring Boot 4.1.1·Java 25와 live 공식 문서 4.1.2는 별도 기준입니다. HTTP 실패 응답에는 읽을 수 있는 status/body를 채우지 않습니다.</p></details>
    <p class="p09-original-link"><a href="#d11-original" data-d11-original-link>원문 전체 · 긴 코드·자가점검 보기 ↓</a></p>
  </section>`;
}
