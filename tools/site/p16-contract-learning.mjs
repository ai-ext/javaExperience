import { P16_CONTRACT_LESSONS, P16_CONTRACT_ASSETS, p16ContractAssetRoot } from './p16-contract-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const p16ContractAvailableLessons = () => P16_CONTRACT_LESSONS.filter(lesson => lesson.stages.every(stage => P16_CONTRACT_ASSETS[stage.image]?.ready === true));

// 기존 P16 학습 화면과 원문 사이에 붙이는 독립 보충 section이다.
export function renderP16ContractLearning() {
  const available = p16ContractAvailableLessons();
  if (!available.length) return '<section class="p09-learning p16-contract-learning" data-p16-contract-learning aria-labelledby="p16-contract-heading"><h2 id="p16-contract-heading">JSON 계약 학습 그림을 검수하며 준비 중입니다.</h2></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = P16_CONTRACT_ASSETS[stage.image];
  return `<section class="p09-learning p16-contract-learning" data-p16-contract-learning aria-labelledby="p16-contract-heading">
    <header class="p16-contract-intro"><p>JSON 계약의 이름·값·생성 규칙</p><h2 id="p16-contract-heading" data-p16-contract-question>${escape(lesson.question)}</h2></header>
    <label class="p09-topic-label" for="p16-contract-topic">살펴볼 질문<select id="p16-contract-topic" data-p16-contract-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="JSON 계약 보충 학습 장면">
      <header class="p09-question"><p data-p16-contract-source>${escape(lesson.source)}</p></header>
      <div class="p09-stages" data-p16-contract-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-p16-contract-mobile-prev aria-label="이전 보충 장면">이전</button><label class="p09-stage-label" for="p16-contract-stage-select">장면<select id="p16-contract-stage-select" data-p16-contract-stage-select></select></label><button type="button" data-p16-contract-mobile-next aria-label="다음 보충 장면">다음</button></div>
      <h3 data-p16-contract-title>${escape(stage.title)}</h3><p class="p09-lead" data-p16-contract-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame p16-contract-image-frame"><div class="p09-image-window"><img data-p16-contract-image src="${p16ContractAssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-p16-contract-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-p16-contract-figure-label>전체 관계 그림</span><button type="button" data-p16-contract-zoom aria-pressed="false">강조 구간 확대</button><a data-p16-contract-image-link href="${p16ContractAssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 값과 계약</h3><dl data-p16-contract-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드</h3><button type="button" data-p16-contract-copy>코드 복사</button></div><pre><code data-p16-contract-code></code></pre><p>강조는 설명하는 코드 구간입니다. mapper 실험은 HTTP 요청을 보내지 않습니다.</p><p data-p16-contract-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-p16-contract-note>${escape(lesson.note)}</p>
      <details class="p16-contract-output" data-p16-contract-output hidden><summary>추가 실행 검증 로그 보기</summary><p>PASS는 격리된 mapper 추가 실험의 assertion 로그입니다. 원문 예제의 출력·HTTP 응답과 구분합니다.</p><pre><code data-p16-contract-stdout></code></pre></details>
      <footer class="p09-controls"><button type="button" data-p16-contract-prev disabled>← 이전</button><span data-p16-contract-position role="status"></span><button type="button" data-p16-contract-next>다음 →</button></footer>
    </section>
  </section>`;
}
