import { D05_LESSONS, D05_ASSETS, d05AssetRoot } from './d05-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const d05AvailableLessons = () => D05_LESSONS.filter(lesson => lesson.stages.every(stage => D05_ASSETS[stage.image]?.ready === true));

// 원문과 기존 설명은 main이 별도로 보존해 연결하는 D05 보충 section이다.
export function renderD05Learning() {
  const available = d05AvailableLessons();
  if (!available.length) return '<section class="p09-learning d05-learning" data-d05-learning aria-labelledby="d05-learning-heading"><h2 id="d05-learning-heading">디버깅 증거 보충 학습 그림을 검수하며 준비 중입니다.</h2></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = D05_ASSETS[stage.image];
  return `<section class="p09-learning d05-learning" data-d05-learning aria-labelledby="d05-learning-heading">
    <header class="d05-intro"><p>디버깅 증거 · 재현·스택·jdb·회귀 검증</p><h2 id="d05-learning-heading" data-d05-question>${escape(lesson.question)}</h2></header>
    <p class="d05-scope">원문 Java는 그대로 추가 Java21·Boot4.1.1 환경에서 실행했습니다. 실제 loopback HTTP·JUnit·jdb CLI·자체 thread/Git 실험이며 원문 Java25/8080·IDE UI·실DB·운영/Kubernetes는 미실행입니다.</p>
    <label class="p09-topic-label" for="d05-topic">살펴볼 질문<select id="d05-topic" data-d05-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="디버깅 증거 보충 학습 장면">
      <header class="p09-question"><p data-d05-source>${escape(lesson.source)}</p></header>
      <p class="d05-source-note" data-d05-source-note>${escape(lesson.sourceNote || '')}</p>
      <div class="p09-stages" data-d05-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-d05-mobile-prev aria-label="이전 학습 장면">이전</button><label class="p09-stage-label" for="d05-stage-select">장면<select id="d05-stage-select" data-d05-stage-select></select></label><button type="button" data-d05-mobile-next aria-label="다음 학습 장면">다음</button></div>
      <h3 data-d05-title>${escape(stage.title)}</h3><p class="p09-lead" data-d05-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame d05-image-frame"><div class="p09-image-window"><img data-d05-image src="${d05AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-d05-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-d05-figure-label>전체 관계 그림</span><button type="button" data-d05-zoom aria-pressed="false">강조 구간 확대</button><a data-d05-image-link href="${d05AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 입력·스택·실행 상태 관찰값</h3><dl data-d05-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드</h3><button type="button" data-d05-copy>코드 복사</button></div><pre><code data-d05-code></code></pre><p>원문·추가 Java21 관찰 fixture·명시적 모델의 짧은 발췌입니다. 강조는 설명하는 위치이며 실시간 실행 줄이 아닙니다.</p><p data-d05-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-d05-note>${escape(lesson.note)}</p>
      <details class="d05-output" data-d05-output hidden><summary>실제 관측·모델 근거 보기</summary><p>최종 frozen 실제 JSON/PASS 발췌입니다. 실제 CHECK23개와 모델3개를 구분합니다. 원문 Controller·추가 SourceProbe·Resource·DebugTarget·ThreadTarget·private Git은 별도 예시입니다. 모델 장면에는 PASS가 없으며 원문 전체나 운영 문제 해결을 보장하지 않습니다.</p><pre><code data-d05-stdout></code></pre><div class="d05-runs" data-d05-runs></div></details>
      <footer class="p09-controls"><button type="button" data-d05-prev disabled>← 이전</button><span data-d05-position role="status"></span><button type="button" data-d05-next>다음 →</button></footer>
    </section>
    <p class="p09-original-link"><a href="#d05-original">원문 전체 · 긴 코드·선택 기준·자가점검 보기 ↓</a></p>
  </section>`;
}

// 실행용 추가 구성과 원문 예제를 분리해 필요할 때 확인한다.
