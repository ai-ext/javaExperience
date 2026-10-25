import { D01_LESSONS, D01_ASSETS, d01AssetRoot } from './d01-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const d01AvailableLessons = () => D01_LESSONS.filter(lesson => lesson.stages.every(stage => D01_ASSETS[stage.image]?.ready === true));

// 원문과 기존 설명은 main이 별도로 보존해 연결하는 D01 보충 section이다.
export function renderD01Learning() {
  const available = d01AvailableLessons();
  if (!available.length) return '<section class="p09-learning d01-learning" data-d01-learning aria-labelledby="d01-learning-heading"><h2 id="d01-learning-heading">개발 생명주기 보충 학습 그림을 검수하며 준비 중입니다.</h2></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = D01_ASSETS[stage.image];
  return `<section class="p09-learning d01-learning" data-d01-learning aria-labelledby="d01-learning-heading">
    <header class="d01-intro"><p>개발 생명주기 · 인수 조건·검증·같은 산출물</p><h2 id="d01-learning-heading" data-d01-question>${escape(lesson.question)}</h2></header>
    <p class="d01-scope">추가 임시 Git 저장소·plain Java21·Gradle9.8.0 CLI/JAR 실험입니다. 원문 Boot/Java25·JUnit·HTTP·DB·동시성·원격 CI/PR·registry·Docker·실제 배포는 실행하지 않았습니다. dev/stg/prod는 로컬 사본과 환경 문자열입니다.</p>
    <label class="p09-topic-label" for="d01-topic">살펴볼 질문<select id="d01-topic" data-d01-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="개발 생명주기 보충 학습 장면">
      <header class="p09-question"><p data-d01-source>${escape(lesson.source)}</p></header>
      <p class="d01-source-note" data-d01-source-note>${escape(lesson.sourceNote || '')}</p>
      <div class="p09-stages" data-d01-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-d01-mobile-prev aria-label="이전 학습 장면">이전</button><label class="p09-stage-label" for="d01-stage-select">장면<select id="d01-stage-select" data-d01-stage-select></select></label><button type="button" data-d01-mobile-next aria-label="다음 학습 장면">다음</button></div>
      <h3 data-d01-title>${escape(stage.title)}</h3><p class="p09-lead" data-d01-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame d01-image-frame"><div class="p09-image-window"><img data-d01-image src="${d01AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-d01-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-d01-figure-label>전체 관계 그림</span><button type="button" data-d01-zoom aria-pressed="false">강조 구간 확대</button><a data-d01-image-link href="${d01AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 코드·검증 결과·로컬 파일 관찰값</h3><dl data-d01-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드</h3><button type="button" data-d01-copy>코드 복사</button></div><pre><code data-d01-code></code></pre><p>원문·추가 CLI fixture·명시적 모델의 짧은 발췌입니다. 강조는 설명하는 위치이며 실시간 실행 줄이 아닙니다.</p><p data-d01-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-d01-note>${escape(lesson.note)}</p>
      <details class="d01-output" data-d01-output hidden><summary>추가 실행 검증 로그 보기</summary><p>최종 frozen 실제 JSON/PASS 발췌입니다. 실제 CHECK11개와 명시적 모델3개를 구분합니다. 모델 장면에는 PASS를 만들지 않습니다. 추가 CLI contract의 PASS는 JUnit이나 원격 CI 결과가 아닙니다.</p><pre><code data-d01-stdout></code></pre><div class="d01-runs" data-d01-runs></div></details>
      <footer class="p09-controls"><button type="button" data-d01-prev disabled>← 이전</button><span data-d01-position role="status"></span><button type="button" data-d01-next>다음 →</button></footer>
    </section>
    <p class="p09-original-link"><a href="#d01-original">원문 전체 · 긴 코드·선택 기준·자가점검 보기 ↓</a></p>
  </section>`;
}

// 실행용 추가 구성과 원문 예제를 분리해 필요할 때 확인한다.
