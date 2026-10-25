import { loadCoreLearning } from './core-learning-data.mjs';

const esc = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** 실제 실행 증거가 붙은 여섯 개 핵심 단원의 초기 HTML과 controller 슬롯을 만든다. */
export function renderCoreLearning(root) {
  const data = loadCoreLearning(root);
  const first = data.units[0];
  const stage = first.stages[0];
  const units = data.units.map((unit, index) => `<li><button type="button" class="core-unit-button" data-core-unit="${esc(unit.id)}" aria-pressed="${index === 0}"><span class="core-unit-number">${String(index + 1).padStart(2, '0')}</span><span><span class="core-unit-id">${esc(unit.id)}</span><span class="core-unit-label">${esc(unit.title)}</span></span></button></li>`).join('');
  const rows = stage.rows.map(([label, before, after]) => `<tr><th scope="row">${esc(label)}</th><td>${esc(before)}</td><td>${esc(after)}</td></tr>`).join('');
  const observations = first.observations.map(item => `<li>${esc(item.key)}: ${esc(item.value)}</li>`).join('');
  const payload = JSON.stringify(data).replace(/</g, '\\u003c');
  const runtime = `Java ${data.runtime.java} · Spring Boot ${data.runtime.boot} · Spring Framework ${data.runtime.framework} · ${data.runtime.lombokJar}`;
  return `<section class="core-learning" data-core-learning aria-labelledby="core-learning-heading">
  <header class="core-learning-header">
    <a class="core-learning-back" data-core-back href="../docs/knowledge/README.html">← 개념 목록</a>
    <h1 id="core-learning-heading">Java · Spring Boot 필수 기초</h1>
    <p class="core-learning-kicker">필수 기초 · 6단원</p>
  </header>
  <div class="core-learning-layout">
    <nav class="core-learning-sidebar" aria-label="필수 기초 6단원"><p>학습 순서</p><ol>${units}</ol><div class="core-prerequisites" aria-label="선수 단원"><span>선수 단원</span><div data-core-prerequisites>${first.prerequisites.length ? first.prerequisites.map(id => `<a href="concept-core.html?unit=${esc(id)}">${esc(id)}</a>`).join('') : '<span>선수 단원 없음</span>'}</div></div></nav>
    <div class="core-learning-main">
      <header class="core-unit-heading">
        <h2 data-core-title>${esc(first.title)}</h2>
        <p class="core-unit-definition" data-core-definition>${esc(first.definition)}</p>
        <p class="core-unit-scenario" data-core-scenario>${esc(first.scenario)}</p>
      </header>
      <section class="core-stage" aria-labelledby="core-stage-title">
        <nav class="core-stage-nav" data-core-stage-nav aria-label="단계"></nav>
        <div class="core-stage-heading"><div class="core-stage-kicker"><p class="core-learning-kicker">단계별 설명</p><span class="core-stage-mode">설명 재생</span></div><h3 id="core-stage-title" data-core-stage-title>${esc(stage.title)}</h3><p data-core-stage-description>${esc(stage.explanation)}</p></div>
        <div class="core-stage-columns visual-file-grid">
          <section class="core-code-section visual-file" aria-label="핵심 코드 요약"><div class="core-section-heading"><h4>핵심 코드 요약</h4><button type="button" class="core-button core-copy-button" data-core-copy>코드 복사</button></div><pre><code data-core-code>${esc(stage.code)}</code></pre><p class="core-copy-status" data-core-copy-status role="status" aria-live="polite"></p></section>
          <section class="core-comparison visual-file" aria-labelledby="core-comparison-title"><div class="core-section-heading"><h4 id="core-comparison-title">상태 비교</h4><span>설명용 비교</span></div><div class="core-table-wrap"><table><thead><tr><th scope="col">대상</th><th scope="col">비교 A</th><th scope="col">비교 B</th></tr></thead><tbody data-core-rows>${rows}</tbody></table></div></section>
        </div>
        <div class="core-stage-controls"><button type="button" class="core-button" data-core-previous disabled>이전 단계</button><span data-core-counter>${esc(`1 / ${first.stages.length}`)}</span><button type="button" class="core-button core-next-button" data-core-next>다음 단계</button></div>
      </section>
      <div class="core-evidence-grid visual-file-grid"><section class="core-observation visual-file" aria-labelledby="core-observation-title"><h3 id="core-observation-title">실제 관찰</h3><ul data-core-observations>${observations}</ul><div class="core-observation-limit"><h4>관찰 범위와 한계</h4><p data-core-limit>${esc(first.limit)}</p></div><p class="core-evidence-scope">최소 예제의 확인 결과입니다. 프로젝트 전체나 원문 전체를 실행한 결과가 아닙니다.</p><div class="core-observation-environment"><h4>근거 환경과 조작 범위</h4><p class="core-learning-runtime" data-core-runtime>${esc(runtime)}</p><p class="core-learning-notice">단계 버튼은 설명을 재생합니다. 새 서버를 실행하거나 요청을 보내지 않습니다.</p></div></section>
      <section class="core-reference visual-file" aria-label="출처와 원문">
        <details><summary>공식 출처와 버전 범위</summary><ul data-core-sources></ul><p>조사 기록: <a data-core-research-link href="${esc(data.researchHref)}">조사 출처와 범위</a></p></details>
        <details><summary>실행 증거와 재현 방법</summary><p>실행 코드: <a data-core-code-link href="${esc(data.codeHref)}">최소 예제 전체 코드</a></p><p>기록: <a data-core-execution-link href="${esc(data.executionHref)}">실행 증거와 관찰값</a></p><p>재현 명령: <code>${esc(data.replay)}</code></p></details>
        <details><summary>기존 문서의 해당 원문 절</summary><div data-core-originals>${first.sourceLinks.map(source => `<a href="${esc(source.href)}">${esc(`${source.id} · ${source.heading}`)}</a>`).join('')}</div></details>
      </section></div>
    </div>
  </div>
  <noscript><p class="core-learning-noscript">단계별 화면에는 JavaScript가 필요합니다. 원문 절 링크를 열어 기존 문서를 읽어 주세요.</p></noscript>
  <script type="application/json" data-core-payload>${payload}</script>
</section>`;
}
