import { D08_LESSONS, D08_ASSETS, d08AssetRoot } from './d08-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const d08AvailableLessons = () => D08_LESSONS.filter(lesson => lesson.stages.every(stage => D08_ASSETS[stage.image]?.ready === true));

// 원문과 기존 설명은 main이 별도로 보존해 연결하는 D08 보충 section이다.
export function renderD08Learning() {
  const available = d08AvailableLessons();
  if (!available.length) return '<section class="p09-learning d08-learning" data-d08-learning aria-labelledby="d08-learning-heading"><h2 id="d08-learning-heading">Git·파이프라인 보충 학습 그림을 검수하며 준비 중입니다.</h2></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = D08_ASSETS[stage.image];
  return `<section class="p09-learning d08-learning" data-d08-learning aria-labelledby="d08-learning-heading">
    <header class="d08-intro"><p>Git·빌드 실측 · 미실행 PR·CI·GitOps 모델</p><h2 id="d08-learning-heading" data-d08-question>${escape(lesson.question)}</h2></header>
    <p class="d08-scope">원문에는 Java 앱이 없습니다. 추가 local Git·Java21 빌드 실측과 미실행 협업·정책 모델을 구분합니다. 원격 PR·CI·배포·HTTP·Docker·Argo는 실행하지 않았습니다.</p>
    <label class="p09-topic-label" for="d08-topic">살펴볼 질문<select id="d08-topic" data-d08-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="Git·파이프라인 보충 학습 장면">
      <header class="p09-question"><p data-d08-source>${escape(lesson.source)}</p></header>
      <p class="d08-source-note" data-d08-source-note>${escape(lesson.sourceNote || '')}</p>
      <div class="p09-stages" data-d08-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-d08-mobile-prev aria-label="이전 학습 장면">이전</button><label class="p09-stage-label" for="d08-stage-select">장면<select id="d08-stage-select" data-d08-stage-select></select></label><button type="button" data-d08-mobile-next aria-label="다음 학습 장면">다음</button></div>
      <h3 data-d08-title>${escape(stage.title)}</h3><p class="p09-lead" data-d08-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame d08-image-frame"><div class="p09-image-window"><img data-d08-image src="${d08AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-d08-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-d08-figure-label>전체 관계 그림</span><button type="button" data-d08-zoom aria-pressed="false">강조 구간 확대</button><a data-d08-image-link href="${d08AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 ref·빌드 결과·정책 모델</h3><dl data-d08-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드·모델</h3><button type="button" data-d08-copy>코드 복사</button></div><p data-d08-code-kind>추가 코드·미실행 원문 발췌</p><pre><code data-d08-code></code></pre><p>추가 Git·Java 관찰기 또는 미실행 모델 JSON·원문 YAML/Groovy의 짧은 발췌입니다. 강조는 설명하는 위치이며 실시간 실행 줄이 아닙니다.</p><p data-d08-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-d08-note>${escape(lesson.note)}</p>
      <details class="d08-output" data-d08-output hidden><summary>실제 관측·모델 근거 보기</summary><p>최종 frozen 실제 JSON/PASS와 별도 모델 명확화입니다. native CHECK22개와 미실행 모델6개를 구분합니다. native15상태와 모델·미실행 원문25상태를 연결하며 모델에는 PASS가 없습니다. 로컬 빌드·사본을 실제 CI·환경 승격으로 확대하지 않습니다.</p><pre><code data-d08-stdout></code></pre><div class="d08-runs" data-d08-runs></div></details>
      <footer class="p09-controls"><button type="button" data-d08-prev disabled>← 이전</button><span data-d08-position role="status"></span><button type="button" data-d08-next>다음 →</button></footer>
    </section>
    <p class="p09-original-link"><a href="#d08-original">원문 전체 · 도구별 예제·자가점검 보기 ↓</a></p>
  </section>`;
}

// 실행용 추가 구성과 원문 예제를 분리해 필요할 때 확인한다.
