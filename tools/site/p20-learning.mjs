import fs from 'node:fs';
import { P20_LESSONS, P20_ASSETS, p20AssetRoot } from './p20-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const p20AvailableLessons = () => P20_LESSONS.filter(lesson => lesson.stages.every(stage => P20_ASSETS[stage.image]?.ready === true));

// 기존 P20 엔티티 map·일반 시각 자료 아래에 붙이는 독립 보충 section이다.
export function renderP20Learning() {
  const available = p20AvailableLessons();
  if (!available.length) return '<section class="p09-learning p20-learning" data-p20-learning aria-labelledby="p20-learning-heading"><h2 id="p20-learning-heading">JPA 매핑 보충 학습 그림을 검수하며 준비 중입니다.</h2></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = P20_ASSETS[stage.image];
  return `<section class="p09-learning p20-learning" data-p20-learning aria-labelledby="p20-learning-heading">
    <header class="p20-intro"><p>JPA 매핑 · 객체 관계와 DB 상태</p><h2 id="p20-learning-heading" data-p20-question>${escape(lesson.question)}</h2></header>
    <p class="p20-scope">원문 6파일은 DTO 접근 오류로 컴파일 실패했습니다. 아래는 DTO 한 식 교정 후 Boot 4.1.1 non-web·H2·JDK 21로 실행한 추가 실험입니다. MySQL·Java 25·HTTP·Docker는 미실행입니다.</p>
    <label class="p09-topic-label" for="p20-topic">살펴볼 질문<select id="p20-topic" data-p20-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="JPA 매핑 보충 학습 장면">
      <header class="p09-question"><p data-p20-source>${escape(lesson.source)}</p></header>
      <div class="p09-stages" data-p20-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-p20-mobile-prev aria-label="이전 학습 장면">이전</button><label class="p09-stage-label" for="p20-stage-select">장면<select id="p20-stage-select" data-p20-stage-select></select></label><button type="button" data-p20-mobile-next aria-label="다음 학습 장면">다음</button></div>
      <h3 data-p20-title>${escape(stage.title)}</h3><p class="p09-lead" data-p20-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame p20-image-frame"><div class="p09-image-window"><img data-p20-image src="${p20AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-p20-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-p20-figure-label>전체 관계 그림</span><button type="button" data-p20-zoom aria-pressed="false">강조 구간 확대</button><a data-p20-image-link href="${p20AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 객체와 DB 관찰값</h3><dl data-p20-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드</h3><button type="button" data-p20-copy>코드 복사</button></div><pre><code data-p20-code></code></pre><p>원문과 추가 실험의 코드 발췌입니다. 추가 H2 관측을 MySQL·HTTP 실측으로 표시하지 않습니다.</p><p data-p20-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-p20-note>${escape(lesson.note)}</p>
      <details class="p20-output" data-p20-output hidden><summary>추가 실행 검증 로그 보기</summary><p>PASS와 SQL은 DTO 한 곳을 교정한 추가 Boot non-web·H2 실험의 증거입니다. SQL의 ?에 바인딩된 값은 이 기록에 포함되지 않습니다. 원문 전체 앱·MySQL·HTTP 실행과 구분합니다.</p><pre><code data-p20-stdout></code></pre><div class="p20-sql" data-p20-sql></div></details>
      <footer class="p09-controls"><button type="button" data-p20-prev disabled>← 이전</button><span data-p20-position role="status"></span><button type="button" data-p20-next>다음 →</button></footer>
    </section>
    <p class="p20-source-correction">원문 치트시트 교정: JPA 3.2 엔티티에는 public/protected 무인자 생성자가 필요합니다.</p>
    <p class="p09-original-link"><a href="#p20-original">원문 전체 · 긴 코드·선택 기준·자가점검 보기 ↓</a></p>
  </section>`;
}

// 원문을 바꾸지 않고 별도 교정식·실험 전체·공식 근거를 제공한다.
export function renderP20Supplementary() {
  return `<details class="p20-supplement"><summary>추가 실험 전체 코드·원문 compile 실패·실행값·교정 근거</summary>
  <p>원문 치트시트의 “무인자 생성자 금지”는 앞 절과 모순됩니다. JPA 3.2 엔티티에는 public/protected 무인자 생성자가 필요합니다. 원문 Markdown은 그대로 보존했습니다.</p>
  <p>이 실행은 원문 Java 5파일과 별도 OrderResponse 한 식 교정본을 사용합니다. 원문 6파일은 LineStatus의 접근 범위 때문에 컴파일 실패했습니다. 추가 실험은 Boot 4.1.1 non-web / JDK 21 / H2 2.4.240 / Hibernate 7.4.5.Final이며 원문 MySQL·Java 25·HTTP·Docker는 실행하지 않았습니다.</p>
  <p>독립 JDBC observer는 H2 READ_COMMITTED·autocommit 연결입니다. 같은 transaction JDBC와 구분하며 원시 ORM SQL에는 ?의 바인딩값을 기록하지 않았습니다. 아래 SQL문 개수는 이 조건의 관측이고 다른 실행 전략으로 일반화하지 않습니다. JPA 3.2의 enum 기본 추론에는 final String @EnumeratedValue 예외가 있으며 managed orphan 실험을 new/detached/removed에 일반화하지 않습니다.</p>
  <p>공식 근거: <a href="https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html">Jakarta Persistence 3.2 · entity·ownership·orphanRemoval·EnumeratedValue</a> · <a href="https://docs.spring.io/spring-data/jpa/reference/auditing.html">Spring Data JPA · Auditing</a></p>
  ${p20RawEvidence()}</details>`;
}

function p20RawEvidence() {
  const files = [['원문6파일 compile 실패','source-proof/original-compile.txt'],['추가 교정식과 범위','source-proof/correction.json'],['추가 probe 전체 Java','source-proof/probe/P20Proof.java'],['추가 실행 관측값·SQL·동적 감사 시각','source-proof/execution.json']];
  return files.map(([title,file]) => `<details><summary>${escape(title)}</summary><pre><code>${escape(fs.readFileSync(new URL('../../docs/design/p20-2026-10-20/'+file,import.meta.url),'utf8'))}</code></pre></details>`).join('');
}
