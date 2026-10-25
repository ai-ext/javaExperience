import { D03_LESSONS, D03_ASSETS, d03AssetRoot } from './d03-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const d03AvailableLessons = () => D03_LESSONS.filter(lesson => lesson.stages.every(stage => D03_ASSETS[stage.image]?.ready === true));

// 원문과 기존 설명은 main이 별도로 보존해 연결하는 D03 보충 section이다.
export function renderD03Learning() {
  const available = d03AvailableLessons();
  if (!available.length) return '<section class="p09-learning d03-learning" data-d03-learning aria-labelledby="d03-learning-heading"><h2 id="d03-learning-heading">REST API 계약 보충 학습 그림을 검수하며 준비 중입니다.</h2></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = D03_ASSETS[stage.image];
  return `<section class="p09-learning d03-learning" data-d03-learning aria-labelledby="d03-learning-heading">
    <header class="d03-intro"><p>REST API 계약 · 생성·검증·명세와 실제 응답</p><h2 id="d03-learning-heading" data-d03-question>${escape(lesson.question)}</h2></header>
    <p class="d03-scope">원문 Java를 그대로 추가 bootstrap·Java21·Boot4.1.1 loopback 앱에서 실행했습니다. 메모리 API의 실제 HTTP·생성 명세 관측이며 원문 Java25/8080·DB·인가·JUnit 슬라이스·PR/CI·스테이징·실제 배포는 미실행입니다.</p>
    <label class="p09-topic-label" for="d03-topic">살펴볼 질문<select id="d03-topic" data-d03-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="REST API 계약 보충 학습 장면">
      <header class="p09-question"><p data-d03-source>${escape(lesson.source)}</p></header>
      <p class="d03-source-note" data-d03-source-note>${escape(lesson.sourceNote || '')}</p>
      <div class="p09-stages" data-d03-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-d03-mobile-prev aria-label="이전 학습 장면">이전</button><label class="p09-stage-label" for="d03-stage-select">장면<select id="d03-stage-select" data-d03-stage-select></select></label><button type="button" data-d03-mobile-next aria-label="다음 학습 장면">다음</button></div>
      <h3 data-d03-title>${escape(stage.title)}</h3><p class="p09-lead" data-d03-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame d03-image-frame"><div class="p09-image-window"><img data-d03-image src="${d03AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-d03-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-d03-figure-label>전체 관계 그림</span><button type="button" data-d03-zoom aria-pressed="false">강조 구간 확대</button><a data-d03-image-link href="${d03AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 요청·응답·계약 관찰값</h3><dl data-d03-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드</h3><button type="button" data-d03-copy>코드 복사</button></div><pre><code data-d03-code></code></pre><p>원문·추가 loopback HTTP fixture·명시적 모델의 짧은 발췌입니다. 강조는 설명하는 위치이며 실시간 실행 줄이 아닙니다.</p><p data-d03-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-d03-note>${escape(lesson.note)}</p>
      <details class="d03-output" data-d03-output hidden><summary>실제 관측·모델 근거 보기</summary><p>최종 frozen 실제 JSON/PASS 발췌입니다. 실제 CHECK19개와 모델3개를 구분합니다. 불일치 CHECK의 PASS는 재현을 뜻하며 계약 일치를 뜻하지 않습니다. 모델 장면에는 PASS가 없습니다. 전체 원문의 구현·검증 완료가 아닌 선택 핵심 보강입니다.</p><pre><code data-d03-stdout></code></pre><div class="d03-runs" data-d03-runs></div></details>
      <footer class="p09-controls"><button type="button" data-d03-prev disabled>← 이전</button><span data-d03-position role="status"></span><button type="button" data-d03-next>다음 →</button></footer>
    </section>
    <p class="p09-original-link"><a href="#d03-original">원문 전체 · 긴 코드·선택 기준·자가점검 보기 ↓</a></p>
  </section>`;
}

// 실행용 추가 구성과 원문 예제를 분리해 필요할 때 확인한다.
