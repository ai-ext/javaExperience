import { D06_LESSONS, D06_ASSETS, d06AssetRoot } from './d06-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const d06AvailableLessons = () => D06_LESSONS.filter(lesson => lesson.stages.every(stage => D06_ASSETS[stage.image]?.ready === true));

// 원문과 기존 설명은 main이 별도로 보존해 연결하는 D06 보충 section이다.
export function renderD06Learning() {
  const available = d06AvailableLessons();
  if (!available.length) return '<section class="p09-learning d06-learning" data-d06-learning aria-labelledby="d06-learning-heading"><h2 id="d06-learning-heading">배포 관찰 보충 학습 그림을 검수하며 준비 중입니다.</h2></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = D06_ASSETS[stage.image];
  return `<section class="p09-learning d06-learning" data-d06-learning aria-labelledby="d06-learning-heading">
    <header class="d06-intro"><p>배포 관찰 · 산출물·준비 신호·경로·종료</p><h2 id="d06-learning-heading" data-d06-question>${escape(lesson.question)}</h2></header>
    <p class="d06-scope">원문에는 앱 Java가 없어 모든 Java·라우터·schema는 추가 fixture입니다. Java21·Boot4.1.1의 own loopback 관측이며 local/stg는 한 Mac의 profile 이름입니다. H2는 앱과 별도이고 원문 Java25/8080·실제 운영 배포·Kubernetes는 미실행입니다.</p>
    <label class="p09-topic-label" for="d06-topic">살펴볼 질문<select id="d06-topic" data-d06-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="배포 관찰 보충 학습 장면">
      <header class="p09-question"><p data-d06-source>${escape(lesson.source)}</p></header>
      <p class="d06-source-note" data-d06-source-note>${escape(lesson.sourceNote || '')}</p>
      <div class="p09-stages" data-d06-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-d06-mobile-prev aria-label="이전 학습 장면">이전</button><label class="p09-stage-label" for="d06-stage-select">장면<select id="d06-stage-select" data-d06-stage-select></select></label><button type="button" data-d06-mobile-next aria-label="다음 학습 장면">다음</button></div>
      <h3 data-d06-title>${escape(stage.title)}</h3><p class="p09-lead" data-d06-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame d06-image-frame"><div class="p09-image-window"><img data-d06-image src="${d06AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-d06-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-d06-figure-label>전체 관계 그림</span><button type="button" data-d06-zoom aria-pressed="false">강조 구간 확대</button><a data-d06-image-link href="${d06AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 산출물·요청·별도 DB 관찰값</h3><dl data-d06-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드</h3><button type="button" data-d06-copy>코드 복사</button></div><pre><code data-d06-code></code></pre><p>원문·추가 Java21 관찰 fixture·명시적 모델의 짧은 발췌입니다. 강조는 설명하는 위치이며 실시간 실행 줄이 아닙니다.</p><p data-d06-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-d06-note>${escape(lesson.note)}</p>
      <details class="d06-output" data-d06-output hidden><summary>실제 관측·모델 근거 보기</summary><p>최종 frozen 실제 JSON/PASS 발췌입니다. 실제 CHECK20개와 모델3개를 구분합니다. 앱 A/B·Python router·별도 H2 SchemaProof를 섞지 않습니다. cleanup은 각 관측 뒤 검증 종료 시점이며 모든 JVM이 exit0이라는 뜻은 아닙니다. 모델에는 PASS가 없습니다.</p><pre><code data-d06-stdout></code></pre><div class="d06-runs" data-d06-runs></div></details>
      <footer class="p09-controls"><button type="button" data-d06-prev disabled>← 이전</button><span data-d06-position role="status"></span><button type="button" data-d06-next>다음 →</button></footer>
    </section>
    <p class="p09-original-link"><a href="#d06-original">원문 전체 · 긴 코드·선택 기준·자가점검 보기 ↓</a></p>
  </section>`;
}

// 실행용 추가 구성과 원문 예제를 분리해 필요할 때 확인한다.
