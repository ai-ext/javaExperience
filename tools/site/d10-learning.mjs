import { D10_LESSONS, D10_ASSETS, d10AssetRoot } from './d10-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const d10AvailableLessons = () => D10_LESSONS.filter(lesson => lesson.stages.every(stage => D10_ASSETS[stage.image]?.ready === true));

// 원문과 기존 설명은 main이 별도로 보존해 연결하는 D10 보충 section이다.
export function renderD10Learning() {
  const available = d10AvailableLessons();
  if (!available.length) return '<section class="p09-learning d10-learning" data-d10-learning aria-labelledby="d10-learning-heading"><h2 id="d10-learning-heading">DB 기초 보충 학습 그림을 검수하며 준비 중입니다.</h2></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = D10_ASSETS[stage.image];
  return `<section class="p09-learning d10-learning" data-d10-learning aria-labelledby="d10-learning-heading">
    <header class="d10-intro"><p>SQL·행·두 연결 관찰 · 실제 SQLite와 미실행 모델</p><h2 id="d10-learning-heading" data-d10-question>${escape(lesson.question)}</h2></header>
    <p class="d10-scope">추가 Python·SQLite 번역 예시 관찰입니다. 원문 PostgreSQL18·MySQL8.4·Docker·Java25·JDBC 앱은 미실행이며, SQLite 결과를 다른 엔진의 락·실행계획·성능 인증으로 읽지 않습니다.</p>
    <label class="p09-topic-label" for="d10-topic">살펴볼 질문<select id="d10-topic" data-d10-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="DB 기초 보충 학습 장면">
      <header class="p09-question"><p data-d10-source>${escape(lesson.source)}</p></header>
      <p class="d10-source-note" data-d10-source-note>${escape(lesson.sourceNote || '')}</p>
      <div class="p09-stages" data-d10-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-d10-mobile-prev aria-label="이전 학습 장면">이전</button><label class="p09-stage-label" for="d10-stage-select">장면<select id="d10-stage-select" data-d10-stage-select></select></label><button type="button" data-d10-mobile-next aria-label="다음 학습 장면">다음</button></div>
      <h3 data-d10-title>${escape(stage.title)}</h3><p class="p09-lead" data-d10-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame d10-image-frame"><div class="p09-image-window"><img data-d10-image src="${d10AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-d10-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-d10-figure-label>전체 관계 그림</span><button type="button" data-d10-zoom aria-pressed="false">강조 구간 확대</button><a data-d10-image-link href="${d10AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 SQL·행·관찰 시점</h3><dl data-d10-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드·모델</h3><button type="button" data-d10-copy>코드 복사</button></div><p data-d10-code-kind>추가 코드·미실행 원문 발췌</p><pre><code data-d10-code></code></pre><p>추가 SQLite fixture 또는 미실행 모델 JSON·원문 SQL/shell/Kotlin/properties의 연속 발췌입니다. 빈 줄과 마지막 개행도 복사합니다. 강조는 설명하는 위치이며 실시간 실행 줄이 아닙니다.</p><p data-d10-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-d10-note>${escape(lesson.note)}</p>
      <details class="d10-output" data-d10-output hidden><summary>실제 관측·모델 근거 보기</summary><p>고정한 실제 JSON/PASS입니다. native CHECK27개와 미실행 모델6개를 구분합니다. native22·모델18·미실행 원문4상태이며 모델/원문에는 PASS가 없습니다. 원문 엔진·실제 운영 성능·PG 행락/deadlock을 실행한 것으로 확대하지 않습니다.</p><pre><code data-d10-stdout></code></pre><div class="d10-runs" data-d10-runs></div></details>
      <footer class="p09-controls"><button type="button" data-d10-prev disabled>← 이전</button><span data-d10-position role="status"></span><button type="button" data-d10-next>다음 →</button></footer>
    </section>
    <p class="p09-original-link"><a href="#d10-original">원문 전체 · DB 예제·운영·자가점검 보기 ↓</a></p>
  </section>`;
}

// 실행용 추가 구성과 원문 예제를 분리해 필요할 때 확인한다.
