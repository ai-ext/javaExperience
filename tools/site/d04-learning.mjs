import { D04_LESSONS, D04_ASSETS, d04AssetRoot } from './d04-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const d04AvailableLessons = () => D04_LESSONS.filter(lesson => lesson.stages.every(stage => D04_ASSETS[stage.image]?.ready === true));

// 원문과 기존 설명은 main이 별도로 보존해 연결하는 D04 보충 section이다.
export function renderD04Learning() {
  const available = d04AvailableLessons();
  if (!available.length) return '<section class="p09-learning d04-learning" data-d04-learning aria-labelledby="d04-learning-heading"><h2 id="d04-learning-heading">빌드·Gradle 보충 학습 그림을 검수하며 준비 중입니다.</h2></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = D04_ASSETS[stage.image];
  return `<section class="p09-learning d04-learning" data-d04-learning aria-labelledby="d04-learning-heading">
    <header class="d04-intro"><p>빌드·Gradle · 태스크·파일·JUnit·캐시</p><h2 id="d04-learning-heading" data-d04-question>${escape(lesson.question)}</h2></header>
    <p class="d04-scope">추가 Java21·Gradle9.8.0·Boot4.1.1 환경에서 태스크·파일·JUnit·캐시를 비교합니다. 원문 Java25 설정은 보존했으며 이 환경에서 실행하지 않았습니다.</p>
    <label class="p09-topic-label" for="d04-topic">살펴볼 질문<select id="d04-topic" data-d04-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="빌드·Gradle 보충 학습 장면">
      <header class="p09-question"><p data-d04-source>${escape(lesson.source)}</p></header>
      <p class="d04-source-note" data-d04-source-note>${escape(lesson.sourceNote || '')}</p>
      <div class="p09-stages" data-d04-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-d04-mobile-prev aria-label="이전 학습 장면">이전</button><label class="p09-stage-label" for="d04-stage-select">장면<select id="d04-stage-select" data-d04-stage-select></select></label><button type="button" data-d04-mobile-next aria-label="다음 학습 장면">다음</button></div>
      <h3 data-d04-title>${escape(stage.title)}</h3><p class="p09-lead" data-d04-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame d04-image-frame"><div class="p09-image-window"><img data-d04-image src="${d04AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-d04-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-d04-figure-label>전체 관계 그림</span><button type="button" data-d04-zoom aria-pressed="false">강조 구간 확대</button><a data-d04-image-link href="${d04AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 태스크·출력 파일·검증 관찰값</h3><dl data-d04-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드</h3><button type="button" data-d04-copy>코드 복사</button></div><pre><code data-d04-code></code></pre><p>원문·추가 Java21 빌드 fixture·명시적 모델의 짧은 발췌입니다. 강조는 설명하는 위치이며 실시간 실행 줄이 아닙니다.</p><p data-d04-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-d04-note>${escape(lesson.note)}</p>
      <details class="d04-output" data-d04-output hidden><summary>실제 관측·모델 근거 보기</summary><p>최종 frozen 실제 JSON/PASS 발췌입니다. 실제 CHECK21개와 모델3개를 구분합니다. CHECK의 PASS는 기록한 경계·실패·동등관계 재현을 뜻하며 모든 빌드·운영 안전이나 모든 테스트 통과를 보장하지 않습니다. 모델 장면에는 PASS가 없습니다.</p><pre><code data-d04-stdout></code></pre><div class="d04-runs" data-d04-runs></div></details>
      <footer class="p09-controls"><button type="button" data-d04-prev disabled>← 이전</button><span data-d04-position role="status"></span><button type="button" data-d04-next>다음 →</button></footer>
    </section>
    <p class="d04-order-note">원문 §1 L23과 §3.4 L108의 test→JAR 서술은 개념 흐름을 요약하며 고정 실행 순서가 아닙니다. 플러그인 fixture의 실제 태스크 관계를 살펴보세요. <button type="button" data-d04-jump-stage="graph-branches">두 갈래 그래프</button> <button type="button" data-d04-jump-stage="assemble-boundary">assemble 경계</button></p>
    <p class="p09-original-link"><a href="#d04-original">원문 전체 · 긴 코드·선택 기준·자가점검 보기 ↓</a></p>
  </section>`;
}

// 실행용 추가 구성과 원문 예제를 분리해 필요할 때 확인한다.
