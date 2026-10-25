import { B01_LESSONS, B01_ASSETS, b01AssetRoot } from './b01-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const b01AvailableLessons = () => B01_LESSONS.filter(lesson => lesson.stages.every(stage => B01_ASSETS[stage.image]?.ready === true));

// 원문과 기존 설명은 main이 별도로 보존해 연결하는 B01 보충 section이다.
export function renderB01Learning() {
  const available = b01AvailableLessons();
  if (!available.length) return '<section class="p09-learning b01-learning" data-b01-learning aria-labelledby="b01-learning-heading"><h2 id="b01-learning-heading">계정 생명주기 보충 학습 그림을 검수하며 준비 중입니다.</h2></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = B01_ASSETS[stage.image];
  return `<section class="p09-learning b01-learning" data-b01-learning aria-labelledby="b01-learning-heading">
    <header class="b01-intro"><p>계정 생명주기 · 코드·소비·공유 카운터</p><h2 id="b01-learning-heading" data-b01-question>${escape(lesson.question)}</h2></header>
    <p class="b01-scope">원문 Java는 direct new로, 부분 코드는 추가 wrapper로 실행했습니다. Java21·private MySQL8.4.11·Redis8.10.2 관측이며 API·Spring proxy·로그인·JWT filter·실제 메일/SMS·Java25는 미실행입니다.</p>
    <label class="p09-topic-label" for="b01-topic">살펴볼 질문<select id="b01-topic" data-b01-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="계정 생명주기 보충 학습 장면">
      <header class="p09-question"><p data-b01-source>${escape(lesson.source)}</p></header>
      <p class="b01-source-note" data-b01-source-note>${escape(lesson.sourceNote || '')}</p>
      <div class="p09-stages" data-b01-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-b01-mobile-prev aria-label="이전 학습 장면">이전</button><label class="p09-stage-label" for="b01-stage-select">장면<select id="b01-stage-select" data-b01-stage-select></select></label><button type="button" data-b01-mobile-next aria-label="다음 학습 장면">다음</button></div>
      <h3 data-b01-title>${escape(stage.title)}</h3><p class="p09-lead" data-b01-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame b01-image-frame"><div class="p09-image-window"><img data-b01-image src="${b01AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-b01-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-b01-figure-label>전체 관계 그림</span><button type="button" data-b01-zoom aria-pressed="false">강조 구간 확대</button><a data-b01-image-link href="${b01AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 객체·저장 상태·독립 관찰값</h3><dl data-b01-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드</h3><button type="button" data-b01-copy>코드 복사</button></div><pre><code data-b01-code></code></pre><p>원문과 추가 실험의 코드 발췌입니다. 강조는 설명하는 위치이며 실시간 실행 줄이 아닙니다.</p><p data-b01-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-b01-note>${escape(lesson.note)}</p>
      <details class="b01-output" data-b01-output hidden><summary>추가 실행 검증 로그 보기</summary><p>최종 frozen 실제 JSON/PASS 발췌입니다. Java10·Redis9·MySQL14의 고유 CHECK33개는 서로 연결된 검증이며 독립33실험이 아닙니다. 공개 demo key·고정 시계·결정적 난수로 재현했으며 보안 인증이나 시간 동등성 측정이 아닙니다.</p><pre><code data-b01-stdout></code></pre><div class="b01-runs" data-b01-runs></div></details>
      <footer class="p09-controls"><button type="button" data-b01-prev disabled>← 이전</button><span data-b01-position role="status"></span><button type="button" data-b01-next>다음 →</button></footer>
    </section>
    <p class="p09-original-link"><a href="#b01-original">원문 전체 · 긴 코드·선택 기준·자가점검 보기 ↓</a></p>
  </section>`;
}

// 실행용 추가 구성과 원문 예제를 분리해 필요할 때 확인한다.
