import { V04_LESSONS, V04_ASSETS, v04AssetRoot } from './v04-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const v04AvailableLessons = () => V04_LESSONS.filter(lesson => lesson.stages.every(stage => V04_ASSETS[stage.image]?.ready === true));

// 원문과 기존 설명은 main이 별도로 보존해 연결하는 V04 보충 section이다.
export function renderV04Learning() {
  const available = v04AvailableLessons();
  if (!available.length) return '<section class="p09-learning v04-learning" data-v04-learning aria-labelledby="v04-learning-heading"><h2 id="v04-learning-heading">테스트 DB 경계 보충 학습 그림을 검수하며 준비 중입니다.</h2></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = V04_ASSETS[stage.image];
  return `<section class="p09-learning v04-learning" data-v04-learning aria-labelledby="v04-learning-heading">
    <header class="v04-intro"><p>테스트 DB · mock·실제 엔진·test transaction</p><h2 id="v04-learning-heading" data-v04-question>${escape(lesson.question)}</h2></header>
    <p class="v04-scope">원문 full Testcontainers class는 compile-only입니다. 외부 원본 unit2와 추가 native MySQL·H2/JPA·Boot TCP/동기 MockMvc 실행을 구분합니다. 원문 OrderHttpTest·학습자 상품 API·MySQL HTTP·Java25는 미실행이며 전체 버전·조건은 추가 근거로 확인합니다.</p>
    <label class="p09-topic-label" for="v04-topic">살펴볼 질문<select id="v04-topic" data-v04-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="테스트 DB 경계 보충 학습 장면">
      <header class="p09-question"><p data-v04-source>${escape(lesson.source)}</p></header>
      <p class="v04-source-note" data-v04-source-note>${escape(lesson.sourceNote || '')}</p>
      <div class="p09-stages" data-v04-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-v04-mobile-prev aria-label="이전 학습 장면">이전</button><label class="p09-stage-label" for="v04-stage-select">장면<select id="v04-stage-select" data-v04-stage-select></select></label><button type="button" data-v04-mobile-next aria-label="다음 학습 장면">다음</button></div>
      <h3 data-v04-title>${escape(stage.title)}</h3><p class="p09-lead" data-v04-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame v04-image-frame"><div class="p09-image-window"><img data-v04-image src="${v04AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-v04-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-v04-figure-label>전체 관계 그림</span><button type="button" data-v04-zoom aria-pressed="false">강조 구간 확대</button><a data-v04-image-link href="${v04AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 테스트 경계·DB 관찰값</h3><dl data-v04-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드</h3><button type="button" data-v04-copy>코드 복사</button></div><pre><code data-v04-code></code></pre><p>원문과 추가 실험의 코드 발췌입니다. 강조는 설명하는 위치이며 실시간 실행 줄이 아닙니다.</p><p data-v04-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-v04-note>${escape(lesson.note)}</p>
      <details class="v04-output" data-v04-output hidden><summary>추가 실행 검증 로그 보기</summary><p>최종 frozen 관측의 실제 JSON/PASS 발췌입니다. 원본 unit2는 JUnit PASSED로 구분하며 없는 PASS를 만들지 않습니다. native9·Java28의 고유 ASSERT37개, JUnit22/11classes, facts32는 겹치는 단위이며 독립59실험이 아닙니다. JUnit22에는 관찰기 회귀1개가 포함됩니다. 이전 가변 참조 오류 checkpoint는 쓰지 않습니다.</p><pre><code data-v04-stdout></code></pre><div class="v04-runs" data-v04-runs></div></details>
      <footer class="p09-controls"><button type="button" data-v04-prev disabled>← 이전</button><span data-v04-position role="status"></span><button type="button" data-v04-next>다음 →</button></footer>
    </section>
    <p class="p09-original-link"><a href="#v04-original">원문 전체 · 긴 코드·선택 기준·자가점검 보기 ↓</a></p>
  </section>`;
}

// 실행용 추가 구성과 원문 예제를 분리해 필요할 때 확인한다.
