import { D09_LESSONS, D09_ASSETS, d09AssetRoot } from './d09-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const d09AvailableLessons = () => D09_LESSONS.filter(lesson => lesson.stages.every(stage => D09_ASSETS[stage.image]?.ready === true));

// 원문과 기존 설명은 main이 별도로 보존해 연결하는 D09 보충 section이다.
export function renderD09Learning() {
  const available = d09AvailableLessons();
  if (!available.length) return '<section class="p09-learning d09-learning" data-d09-learning aria-labelledby="d09-learning-heading"><h2 id="d09-learning-heading">운영·관측 보충 학습 그림을 검수하며 준비 중입니다.</h2></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = D09_ASSETS[stage.image];
  return `<section class="p09-learning d09-learning" data-d09-learning aria-labelledby="d09-learning-heading">
    <header class="d09-intro"><p>업무 응답·counter·scrape · 실제 관찰과 설명 모델</p><h2 id="d09-learning-heading" data-d09-question>${escape(lesson.question)}</h2></header>
    <p class="d09-scope">추가 Python exporter·실제 Prometheus·별도 SQLite 관찰입니다. 원문 Actuator·Java25·Docker·Grafana는 미실행이며, 명시 샘플·문헌 모델을 실제 운영 SLO·성능·복구 달성으로 읽지 않습니다.</p>
    <label class="p09-topic-label" for="d09-topic">살펴볼 질문<select id="d09-topic" data-d09-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="운영·관측 보충 학습 장면">
      <header class="p09-question"><p data-d09-source>${escape(lesson.source)}</p></header>
      <p class="d09-source-note" data-d09-source-note>${escape(lesson.sourceNote || '')}</p>
      <div class="p09-stages" data-d09-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-d09-mobile-prev aria-label="이전 학습 장면">이전</button><label class="p09-stage-label" for="d09-stage-select">장면<select id="d09-stage-select" data-d09-stage-select></select></label><button type="button" data-d09-mobile-next aria-label="다음 학습 장면">다음</button></div>
      <h3 data-d09-title>${escape(stage.title)}</h3><p class="p09-lead" data-d09-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame d09-image-frame"><div class="p09-image-window"><img data-d09-image src="${d09AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-d09-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-d09-figure-label>전체 관계 그림</span><button type="button" data-d09-zoom aria-pressed="false">강조 구간 확대</button><a data-d09-image-link href="${d09AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 업무값·counter·관찰 경계</h3><dl data-d09-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드·모델</h3><button type="button" data-d09-copy>코드 복사</button></div><p data-d09-code-kind>추가 코드·미실행 원문 발췌</p><pre><code data-d09-code></code></pre><p>추가 Python fixture·Prom query 관찰기 또는 미실행 모델 JSON·원문 YAML/bash의 연속 발췌입니다. 빈 줄과 마지막 개행도 복사합니다. 강조는 설명하는 위치이며 실시간 실행 줄이 아닙니다.</p><p data-d09-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-d09-note>${escape(lesson.note)}</p>
      <details class="d09-output" data-d09-output hidden><summary>실제 관측·모델 근거 보기</summary><p>최종 frozen 실제 JSON/PASS입니다. native CHECK22개와 미실행 모델6개를 구분합니다. native17·모델19·미실행 원문3상태이며 모델/원문에는 PASS가 없습니다. 업무 GET4건과 Prom polling·scrape 등 전체 HTTP 분모를 구분하며 운영 SLO·latency·RPO/RTO 측정으로 확대하지 않습니다.</p><pre><code data-d09-stdout></code></pre><div class="d09-runs" data-d09-runs></div></details>
      <footer class="p09-controls"><button type="button" data-d09-prev disabled>← 이전</button><span data-d09-position role="status"></span><button type="button" data-d09-next>다음 →</button></footer>
    </section>
    <p class="p09-original-link"><a href="#d09-original">원문 전체 · 운영 절차·실습·자가점검 보기 ↓</a></p>
  </section>`;
}

// 실행용 추가 구성과 원문 예제를 분리해 필요할 때 확인한다.
