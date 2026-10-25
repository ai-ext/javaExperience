import { readFileSync } from 'node:fs';
import { W09_LESSONS, W09_ASSETS, w09AssetRoot } from './w09-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function renderW09Supplementary() {
  const files=[['probe/W09Proof.java','격리 추가 실험 · Session/JDBC/Jackson/DTO/쿼리/record'],['generated/OrderSummaryMapStructImpl.java','MapStruct1.6.3의 실제 생성 구현'],['execution.json','관측 SQL·JSON·범위']];
  return `<details class="w09-supplement"><summary>추가 실험 전체 코드·생성 mapper·관측 기록</summary><p>원문 엔티티와 mapper를 별도 H2 메모리 DB에서 실행했습니다. 아래 fixture에는 추가 입력과 관찰 코드가 있습니다. 원문 단건 JPQL은 직접 Hibernate로 실행했고 목록 쿼리는 추가 변형입니다. MySQL·Spring Data Repository·Boot·OSIV 요청·HTTP·Java25는 실행하지 않았습니다.</p>${files.map(([file,label])=>`<details><summary>${escape(label)}</summary><pre><code>${escape(readFileSync(new URL('../../docs/design/w09-2026-10-20/source-proof/'+file,import.meta.url),'utf8'))}</code></pre></details>`).join('')}<p><a href="https://docs.spring.io/spring-data/jpa/reference/repositories/projections.html" target="_blank" rel="noopener">Spring Data projection</a> · <a href="https://mapstruct.org/documentation/1.6/reference/html/" target="_blank" rel="noopener">MapStruct1.6.3</a> · 공식 출처 확인2026-10-20. 격리실험에서 Spring Data Repository를 실행한 것은 아닙니다.</p></details>`;
}
export const w09AvailableLessons = () => W09_LESSONS.filter(lesson => lesson.stages.every(stage => W09_ASSETS[stage.image]?.ready === true));

// W09 첫 학습 화면이다. 원문 전체를 감싸는 wrapper는 사이트 빌드가 보존해 연결한다.
export function renderW09Learning() {
  const available = w09AvailableLessons();
  if (!available.length) return '<section class="p09-learning w09-learning" data-w09-learning aria-labelledby="w09-heading"><h1 id="w09-heading">DTO 학습 그림을 검수하며 준비 중입니다.</h1></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = W09_ASSETS[stage.image];
  return `<section class="p09-learning w09-learning" data-w09-learning aria-labelledby="w09-heading">
    <nav class="p09-return" aria-label="개념 학습 이동"><a href="README.html?from=detail" data-kc-catalog-return>← 개념 목록·검색 결과</a><a data-kc-task-return hidden></a></nav>
    <header class="w09-intro"><p>DTO · 조회 범위와 공개 계약</p><h1 id="w09-heading" data-w09-question>${escape(lesson.question)}</h1></header>
    <label class="p09-topic-label" for="w09-topic">살펴볼 질문<select id="w09-topic" data-w09-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="DTO 개념 학습 장면">
      <header class="p09-question"><p data-w09-source>${escape(lesson.source)}</p></header>
      <div class="p09-stages" data-w09-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-w09-mobile-prev aria-label="이전 학습 장면">이전</button><label class="p09-stage-label" for="w09-stage-select">장면<select id="w09-stage-select" data-w09-stage-select></select></label><button type="button" data-w09-mobile-next aria-label="다음 학습 장면">다음</button></div>
      <h3 data-w09-title>${escape(stage.title)}</h3><p class="p09-lead" data-w09-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame w09-image-frame"><div class="p09-image-window"><img data-w09-image src="${w09AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-w09-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-w09-figure-label>전체 관계 그림</span><button type="button" data-w09-zoom aria-pressed="false">강조 구간 확대</button><a data-w09-image-link href="${w09AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 값과 조회 경계</h3><dl data-w09-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드</h3><button type="button" data-w09-copy>코드 복사</button></div><pre><code data-w09-code></code></pre><p>강조는 설명하는 코드 구간입니다. 독립 H2 실험이며 HTTP 요청을 보내지 않습니다.</p><p data-w09-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-w09-note>${escape(lesson.note)}</p>
      <details class="w09-output" data-w09-output hidden><summary>추가 실행 검증 로그 보기</summary><p>PASS와 SQL은 격리된 추가 실험의 검증 증거입니다. 직렬화 중간 장면은 전체 실행의 종단 관측을 설명하며 getter 줄 계측 로그가 아닙니다. SQL의 ? 바인딩값은 기록되지 않았습니다.</p><pre><code data-w09-stdout></code></pre><div class="w09-sql" data-w09-sql></div></details>
      <footer class="p09-controls"><button type="button" data-w09-prev disabled>← 이전</button><span data-w09-position role="status"></span><button type="button" data-w09-next>다음 →</button></footer>
    </section>
    <p class="p09-original-link"><a href="#w09-original">원문 전체 · 긴 코드·선택 기준·자가점검 보기 ↓</a></p>
  </section>` + renderW09Supplementary();
}
