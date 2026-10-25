import { W15_LESSONS, W15_ASSETS, w15AssetRoot } from './w15-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const w15AvailableLessons = () => W15_LESSONS.filter(lesson => lesson.stages.every(stage => W15_ASSETS[stage.image]?.ready === true));

// 원문과 기존 설명은 main이 별도로 보존해 연결하는 W15 보충 section이다.
export function renderW15Learning() {
  const available = w15AvailableLessons();
  if (!available.length) return '<section class="p09-learning w15-learning" data-w15-learning aria-labelledby="w15-learning-heading"><h2 id="w15-learning-heading">페이지 경계 보충 학습 그림을 검수하며 준비 중입니다.</h2></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = W15_ASSETS[stage.image];
  return `<section class="p09-learning w15-learning" data-w15-learning aria-labelledby="w15-learning-heading">
    <header class="w15-intro"><p>페이징 · 반환 경계·스크롤 위치·snapshot</p><h2 id="w15-learning-heading" data-w15-question>${escape(lesson.question)}</h2></header>
    <p class="w15-scope">추가 Article 데이터로 원문 SQL·Java를 실행한 관측값입니다. 실제 HTTP·DTO 전달은 구현하지 않았습니다. 전체 코드·버전·실험 조건은 아래 근거에서 확인할 수 있습니다.</p>
    <label class="p09-topic-label" for="w15-topic">살펴볼 질문<select id="w15-topic" data-w15-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="페이지 경계 보충 학습 장면">
      <header class="p09-question"><p data-w15-source>${escape(lesson.source)}</p></header>
      <p class="w15-source-note" data-w15-source-note>${escape(lesson.sourceNote || '')}</p>
      <div class="p09-stages" data-w15-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-w15-mobile-prev aria-label="이전 학습 장면">이전</button><label class="p09-stage-label" for="w15-stage-select">장면<select id="w15-stage-select" data-w15-stage-select></select></label><button type="button" data-w15-mobile-next aria-label="다음 학습 장면">다음</button></div>
      <h3 data-w15-title>${escape(stage.title)}</h3><p class="p09-lead" data-w15-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame w15-image-frame"><div class="p09-image-window"><img data-w15-image src="${w15AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-w15-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-w15-figure-label>전체 관계 그림</span><button type="button" data-w15-zoom aria-pressed="false">강조 구간 확대</button><a data-w15-image-link href="${w15AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 경계·반환 행·위치 관찰값</h3><dl data-w15-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드</h3><button type="button" data-w15-copy>코드 복사</button></div><pre><code data-w15-code></code></pre><p>원문과 추가 실험의 코드 발췌입니다. 강조는 설명하는 위치이며 실시간 실행 줄이 아닙니다.</p><p data-w15-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-w15-note>${escape(lesson.note)}</p>
      <details class="w15-output" data-w15-output hidden><summary>추가 실행 검증 로그 보기</summary><p>실제 frozen 관측 JSON과 원문 PASS 로그의 ASSERT ID입니다. native ASSERT18개·Java 실행 ASSERT25개의 고유 ID43개를 독립 실험43개로 세지 않습니다. 원문 SQL·추가 SQL·생성 실제 SQL·ResultSet 행·계획 iterator 행을 구분합니다. 앞 삽입/삭제/mutable는 같은 writer 제어 순서이며 두 연결 snapshot은 별도 실험입니다.</p><pre><code data-w15-stdout></code></pre><div class="w15-runs" data-w15-runs></div></details>
      <footer class="p09-controls"><button type="button" data-w15-prev disabled>← 이전</button><span data-w15-position role="status"></span><button type="button" data-w15-next>다음 →</button></footer>
    </section>
    <p class="p09-original-link"><a href="#w15-original">원문 전체 · 긴 코드·선택 기준·자가점검 보기 ↓</a></p>
  </section>`;
}

// 실행용 추가 구성과 원문 예제를 분리해 필요할 때 확인한다.
