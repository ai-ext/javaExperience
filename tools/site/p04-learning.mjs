import { readFileSync } from 'node:fs';
import { P04_LESSONS, P04_ASSETS, p04AssetRoot } from './p04-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function renderP04Supplementary() {
  const files = [
    ['P04StateProof.java', '원문 Order·Builder·SignupRequest의 추가 입력 검사'],
    ['P04ConstructorProof.java', '생성자에서 override 호출 시점을 관찰한 독립 예시'],
    ['P04LombokProof.java', 'Lombok 1.18.46 · JDK21의 생성 코드와 결과 검사'],
    ['spring/P04SpringProof.java', 'Spring 7.0.9 독립 컨텍스트 · Bean3개·직접 메서드 호출 검사'],
  ];
  return `<details class="p04-supplement"><summary>추가 실험 전체 코드 · 원문과 구분</summary><p>아래 코드는 이 화면을 확인한 추가 실험입니다. Spring 실험은 원문의 Java 소스 파일4개를 함께 컴파일하고 Bean3개를 명시 등록했습니다. Boot·HTTP·JPA·Java25를 실행한 결과는 아닙니다.</p>${files.map(([file, label]) => `<details><summary>${escape(file)} · ${escape(label)}</summary><pre><code>${escape(readFileSync(new URL('../../docs/design/p04-2026-10-20/source-proof/' + file, import.meta.url),'utf8'))}</code></pre></details>`).join('')}</details>`;
}
export const p04AvailableLessons = () => P04_LESSONS.filter(lesson => lesson.stages.every(stage => P04_ASSETS[stage.image]?.ready === true));
export function renderP04Learning() {
  const available = p04AvailableLessons();
  if (!available.length) return '<section class="p09-learning p04-learning" data-p04-learning><p>객체 생성 학습 그림을 검수하며 준비 중입니다.</p><a href="#p04-original">원문 전체 보기 ↓</a></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = P04_ASSETS[stage.image];
  return `<section class="p09-learning p04-learning" data-p04-learning aria-labelledby="p04-heading">
    <nav class="p09-return" aria-label="개념 학습 이동"><a href="README.html?from=detail" data-kc-catalog-return>← 개념 목록·검색 결과</a><a data-kc-task-return hidden></a></nav>
    <header class="p09-intro"><p>객체 생성 · P04</p><h1 id="p04-heading" data-p04-question>${escape(lesson.question)}</h1></header>
    <label class="p09-topic-label" for="p04-topic">살펴볼 질문<select id="p04-topic" data-p04-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="선택한 질문의 학습 장면">
      <header class="p09-question"><p data-p04-source>${escape(lesson.source)}</p></header>
      <div class="p09-stages" data-p04-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-p04-mobile-prev aria-label="이전 장면">이전</button><label class="p09-stage-label" for="p04-stage-select">장면<select id="p04-stage-select" data-p04-stage-select></select></label><button type="button" data-p04-mobile-next aria-label="다음 장면">다음</button></div>
      <h3 data-p04-title>${escape(stage.title)}</h3><p class="p09-lead" data-p04-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p04-init-mobile" data-p04-init-mobile aria-label="한 Child 객체의 현재 두 필드" hidden></div><div class="p09-image-frame"><div class="p09-image-window"><img data-p04-image src="${p04AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-p04-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-p04-figure-label>전체 관계 그림</span><button type="button" data-p04-zoom aria-pressed="false" hidden>강조 구간 확대</button><a data-p04-image-link href="${p04AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 값과 연결</h3><p class="p04-snapshot" data-p04-snapshot hidden></p><dl data-p04-state></dl></section><section class="p09-code-sheet"><div><h3>현재 읽는 코드</h3><button type="button" data-p04-copy>코드 복사</button></div><pre><code data-p04-code></code></pre><p data-p04-copy-status role="status"></p></section></div></div>
      <details class="p04-output" data-p04-output hidden><summary data-p04-output-title>여기까지의 출력</summary><p data-p04-output-note hidden></p><pre><code data-p04-stdout></code></pre></details>
      <p class="p09-note" data-p04-note>${escape(lesson.note)}</p>
      <footer class="p09-controls"><button type="button" data-p04-prev disabled>← 이전</button><span data-p04-position role="status"></span><button type="button" data-p04-next>다음 →</button></footer>
    </section>
    <p class="p09-original-link"><a href="#p04-original">원문 전체 · 긴 코드·심화·자가점검 보기 ↓</a></p>
  </section>${renderP04Supplementary()}`;
}
