import { D07_LESSONS, D07_ASSETS, d07AssetRoot } from './d07-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const d07AvailableLessons = () => D07_LESSONS.filter(lesson => lesson.stages.every(stage => D07_ASSETS[stage.image]?.ready === true));

// 원문과 기존 설명은 main이 별도로 보존해 연결하는 D07 보충 section이다.
export function renderD07Learning() {
  const available = d07AvailableLessons();
  if (!available.length) return '<section class="p09-learning d07-learning" data-d07-learning aria-labelledby="d07-learning-heading"><h2 id="d07-learning-heading">서버 배치·책임 보충 학습 그림을 검수하며 준비 중입니다.</h2></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = D07_ASSETS[stage.image];
  return `<section class="p09-learning d07-learning" data-d07-learning aria-labelledby="d07-learning-heading">
    <header class="d07-intro"><p>서버 배치·책임 · 원문 앱·실측·미실행 분류 모델</p><h2 id="d07-learning-heading" data-d07-question>${escape(lesson.question)}</h2></header>
    <p class="d07-scope">원문 Java를 그대로 추가 Java21·Boot4.1.1에서 실행했습니다. 한 Mac의 자체 두 HTTP JVM 관측과 미실행 분류·책임 모델을 구분합니다. 원문 Java25·Docker·VM/AZ·cloud·요금 실험은 하지 않았습니다.</p>
    <label class="p09-topic-label" for="d07-topic">살펴볼 질문<select id="d07-topic" data-d07-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="서버 배치·책임 보충 학습 장면">
      <header class="p09-question"><p data-d07-source>${escape(lesson.source)}</p></header>
      <p class="d07-source-note" data-d07-source-note>${escape(lesson.sourceNote || '')}</p>
      <div class="p09-stages" data-d07-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-d07-mobile-prev aria-label="이전 학습 장면">이전</button><label class="p09-stage-label" for="d07-stage-select">장면<select id="d07-stage-select" data-d07-stage-select></select></label><button type="button" data-d07-mobile-next aria-label="다음 학습 장면">다음</button></div>
      <h3 data-d07-title>${escape(stage.title)}</h3><p class="p09-lead" data-d07-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame d07-image-frame"><div class="p09-image-window"><img data-d07-image src="${d07AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-d07-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-d07-figure-label>전체 관계 그림</span><button type="button" data-d07-zoom aria-pressed="false">강조 구간 확대</button><a data-d07-image-link href="${d07AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 코드·분류·책임과 관찰값</h3><dl data-d07-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드·분류</h3><button type="button" data-d07-copy>코드 복사</button></div><p data-d07-code-kind>원문·추가 코드 발췌</p><pre><code data-d07-code></code></pre><p>원문 Java·추가 빌드 관찰기 또는 미실행 분류 JSON·원문 명령의 짧은 발췌입니다. 강조는 설명하는 위치이며 실시간 실행 줄이 아닙니다.</p><p data-d07-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-d07-note>${escape(lesson.note)}</p>
      <details class="d07-output" data-d07-output hidden><summary>실제 관측·모델 근거 보기</summary><p>최종 frozen 실제 JSON/PASS 발췌입니다. native CHECK10개와 미실행 모델6개를 구분합니다. native8상태와 모델28상태의 근거이며 모델에는 PASS가 없습니다. 두 로컬 JVM을 VM/AZ·자동 failover·운영 안전 증거로 확대하지 않습니다.</p><pre><code data-d07-stdout></code></pre><div class="d07-runs" data-d07-runs></div></details>
      <footer class="p09-controls"><button type="button" data-d07-prev disabled>← 이전</button><span data-d07-position role="status"></span><button type="button" data-d07-next>다음 →</button></footer>
    </section>
    <p class="p09-original-link"><a href="#d07-original">원문 전체 · 긴 코드·선택 기준·자가점검 보기 ↓</a></p>
  </section>`;
}

// 실행용 추가 구성과 원문 예제를 분리해 필요할 때 확인한다.
