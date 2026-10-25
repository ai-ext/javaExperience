import { P09_LESSONS } from './p09-lesson-data.mjs';
import { P09_ASSETS, p09AssetRoot } from './p09-assets.mjs';
import { readFileSync } from 'node:fs';
const escape = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const boundariesProof = readFileSync(new URL('../../docs/design/p09-completion-2026-10-24/proof/P09BoundariesProof.java', import.meta.url), 'utf8');
const boundariesOutput = readFileSync(new URL('../../docs/design/p09-completion-2026-10-24/proof/run.stdout.log', import.meta.url), 'utf8');
export const p09AvailableLessons = () => P09_LESSONS.filter((lesson) => lesson.stages.every((stage) => P09_ASSETS[stage.image]));
export const p09DefaultLesson = (available) => available.find((lesson)=>lesson.id==='references')||available[0];

export function renderP09Learning() {
  const available = p09AvailableLessons();
  if (!available.length) throw Error('P09에 검토된 실제 이미지가 없다');
  const lesson = p09DefaultLesson(available), stage = lesson.stages[0], asset = P09_ASSETS[stage.image];
  return `<section class="p09-learning" data-p09-learning aria-labelledby="p09-heading">
    <nav class="p09-return" aria-label="개념 학습 이동"><a href="README.html?from=detail" data-kc-catalog-return>← 개념 목록·검색 결과</a><a data-kc-task-return hidden></a></nav>
    <header class="p09-intro"><p>Java 문법 · P09</p><h1 id="p09-heading" data-p09-question>${escape(lesson.question)}</h1></header>
    <label class="p09-topic-label" for="p09-topic">살펴볼 질문<select id="p09-topic" data-p09-topic>${available.map((item) => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="선택한 질문의 학습 장면">
      <header class="p09-question"><p data-p09-source>${escape(lesson.source)}</p></header>
      <div class="p09-stages" data-p09-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-p09-mobile-prev aria-label="이전 장면">이전</button><label class="p09-stage-label" for="p09-stage-select">장면<select id="p09-stage-select" data-p09-stage-select></select></label><button type="button" data-p09-mobile-next aria-label="다음 장면">다음</button></div>
      <h3 data-p09-title>${escape(stage.title)}</h3><p class="p09-lead" data-p09-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div data-p09-reference-mobile class="p09-reference-mobile" aria-label="현재 변수와 객체의 참조 연결" hidden></div><div class="p09-image-frame"><div class="p09-image-window"><img data-p09-image src="${p09AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-p09-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-p09-figure-label>전체 관계 그림 · 강조한 구간을 읽어요</span><button type="button" data-p09-zoom aria-pressed="false">강조 구간 확대</button><a data-p09-image-link href="${p09AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 값과 연결</h3><dl data-p09-state></dl></section><section class="p09-code-sheet"><div><h3 data-p09-code-title>함께 읽을 코드</h3><button type="button" data-p09-copy>코드 복사</button></div><pre><code data-p09-code></code></pre><p>강조는 설명하는 코드 구간입니다.</p><details data-p09-context hidden><summary>주변 코드도 읽기</summary><pre><code data-p09-context-code></code></pre></details><p data-p09-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-p09-note>${escape(lesson.note)}</p>
      <footer class="p09-controls"><button type="button" data-p09-prev disabled>← 이전</button><span data-p09-position role="status"></span><button type="button" data-p09-next>다음 →</button></footer>
      <button type="button" class="p09-compare" data-p09-compare aria-pressed="false" aria-controls="p09-comparison" hidden>필드 변경과 재할당 비교</button>
      <div id="p09-comparison" class="p09-comparison" data-p09-comparison hidden></div>
    </section>
    <p class="p09-original-link"><a href="#p09-original">원문 전체 · 긴 코드·심화·자가점검 보기 ↓</a></p>
  </section>
    <details class="p09-boundaries-source" id="p09-boundaries-source"><summary>추가 Java 21 실행 자료 · 전체 소스 보기 / 직접 복사</summary><p>순수 Java 예시의 전체 파일입니다. 내용을 선택해 복사할 수 있습니다. 실행 근거는 HTTP·Spring·DB·동시 요청을 포함하지 않습니다.</p><pre><code>${escape(boundariesProof)}</code></pre></details>
    <details class="p09-boundaries-output" id="p09-boundaries-stdout"><summary>추가 Java 21 실행 자료 · raw 관측 13개 보기 / 직접 복사</summary><p>컴파일·실행 기록에 저장된 stdout 원문입니다. 내용을 선택해 복사할 수 있습니다.</p><pre><code>${escape(boundariesOutput)}</code></pre></details>`;
}
