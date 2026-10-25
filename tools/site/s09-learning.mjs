import fs from 'node:fs';
import { S09_LESSONS, S09_ASSETS, s09AssetRoot } from './s09-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const s09AvailableLessons = () => S09_LESSONS.filter(lesson => lesson.stages.every(stage => S09_ASSETS[stage.image]?.ready === true));

// 기존 S09 역할 설명·예상값 학습 화면 아래에 붙이는 독립 보충 section이다.
export function renderS09Learning() {
  const available = s09AvailableLessons();
  if (!available.length) return '<section class="p09-learning s09-learning" data-s09-learning aria-labelledby="s09-learning-heading"><h2 id="s09-learning-heading">영속성 컨텍스트 보충 학습 그림을 검수하며 준비 중입니다.</h2></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = S09_ASSETS[stage.image];
  return `<section class="p09-learning s09-learning" data-s09-learning aria-labelledby="s09-learning-heading">
    <header class="s09-intro"><p>JPA EntityManager API · Hibernate SQL 구현 · 상태와 조회 경계</p><h2 id="s09-learning-heading" data-s09-question>${escape(lesson.question)}</h2></header>
    <p class="s09-scope">원문 PurchaseOrder·OrderLine과 별도 추가 ProbePost42(title/version)를 구분한 native Hibernate 7.4.5·H2 2.4.240·JDK 21 실험입니다. Boot 4.1.1 BOM의 의존성만 사용했으며 Boot 앱·Spring 프록시·HTTP·MySQL·OSIV·Java 25는 미실행입니다.</p>
    <label class="p09-topic-label" for="s09-topic">살펴볼 질문<select id="s09-topic" data-s09-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="영속성 컨텍스트 보충 학습 장면">
      <header class="p09-question"><p data-s09-source>${escape(lesson.source)}</p></header>
      <div class="p09-stages" data-s09-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-s09-mobile-prev aria-label="이전 학습 장면">이전</button><label class="p09-stage-label" for="s09-stage-select">장면<select id="s09-stage-select" data-s09-stage-select></select></label><button type="button" data-s09-mobile-next aria-label="다음 학습 장면">다음</button></div>
      <h3 data-s09-title>${escape(stage.title)}</h3><p class="p09-lead" data-s09-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame s09-image-frame"><div class="p09-image-window"><img data-s09-image src="${s09AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-s09-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-s09-figure-label>전체 관계 그림</span><button type="button" data-s09-zoom aria-pressed="false">강조 구간 확대</button><a data-s09-image-link href="${s09AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 객체·loadedState·DB 관찰값</h3><dl data-s09-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드</h3><button type="button" data-s09-copy>코드 복사</button></div><pre><code data-s09-code></code></pre><p>원문과 추가 실험의 코드 발췌입니다. 강조는 설명하는 위치이며 실시간 실행 줄이 아닙니다.</p><p data-s09-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-s09-note>${escape(lesson.note)}</p>
      <details class="s09-output" data-s09-output hidden><summary>추가 실행 검증 로그 보기</summary><p>PASS와 SQL은 별도 native Hibernate·H2 실험의 관측입니다. 원문 PurchaseOrder와 추가 ProbePost를 구분하며 아래 ORM SQL에는 ? 바인딩값이 기록되지 않았습니다. 별도 JDBC 관찰·재실행과 명시 limit 바인딩은 JSON 기록으로 구분합니다.</p><pre><code data-s09-stdout></code></pre><div class="s09-sql" data-s09-sql></div></details>
      <footer class="p09-controls"><button type="button" data-s09-prev disabled>← 이전</button><span data-s09-position role="status"></span><button type="button" data-s09-next>다음 →</button></footer>
    </section>
    <p class="s09-source-note">원문 보충: EAGER는 데이터 로딩 요구이며 SQL JOIN 방식의 보장은 아닙니다. 페이지 제한은 구체 버전·쿼리 API·DB의 관측과 함께 읽어주세요.</p>
    <p class="p09-original-link"><a href="#s09-original">원문 전체 · 긴 코드·선택 기준·자가점검 보기 ↓</a></p>
  </section>`;
}


// 원문 source와 추가 실험/예상 그림/현재 가이드의 버전 경계를 분리한다.
export function renderS09Supplementary() {
  const sources = [['원문 원본 4Java 추출/SHA/범위','source-proof/source.json'],['추가 ProbePost 엔티티','source-proof/probe/ProbePost.java'],['추가 native 실험 전체 Java','source-proof/probe/S09Proof.java'],['실제 관측값·loadedState·SQL','source-proof/execution.json'],['추가 pagination 변형 관측','source-proof/pagination-observations.json']];
  return `<details class="s09-supplement"><summary>추가 실험 전체 코드·원문/추가 모델·버전별 관측 근거</summary>
    <p>원문4Java파일은 그대로 컴파일했습니다. PurchaseOrder/OrderLine과 원문 서비스는 native Hibernate의 수동 JPA transaction 안에서 직접 Java로 실행했습니다. Spring @Transactional 프록시·Boot 앱·HTTP·OSIV·MySQL·Java25·Docker는 실행하지 않았습니다. Boot4.1.1은 의존성 BOM으로만 사용했습니다.</p>
    <p>id42/title/version을 가진 ProbePost는 원문에 없는 추가 엔티티입니다. 기존 Post42 화면은 설명용 예상 흐름으로 보존했으며 이 추가 실행의 로그로 바꾸어 부르지 않습니다. Hibernate loadedState는 provider 내부 관찰입니다. rollback 후 view(null,p)의 false/no-entry/{}는 기본 표기이며 닫힌 context를 실제 조사한 결과가 아닙니다.</p>
    <p>별도 JDBC observer는 READ_COMMITTED·autocommit입니다. ORM SQL 구간과 독립 조회·동일 SQL 재실행의 행 수를 나눕니다. 원시 ORM SQL은 바인딩값을 기록하지 않았고, plain pagination 대조군에서 observer가 limit 파라미터1에 1을 넣은 사실은 별도 기록입니다. SQL문 수·재실행 행 수를 속도나 네트워크 wire 계측으로 바꾸어 말하지 않습니다.</p>
    <p>현재 온라인 Hibernate7.4 문서는7.4.13.Final입니다. 추가7.4.5/H2에서 API max1 fetchjoin은 부모3개, memory hint는 부모1개/별도SQL6행, HQL inline limit1은 부모1개/별도SQL2행, plain root API 대조군은 부모1개/별도SQL1행이 관측됐습니다. 원인·확정 bug명·수정 버전은 미확인입니다. 이 관측을 올바른 API 제한이나 hint/업그레이드 권고로 표시하지 않습니다.</p>
    <p>JPA EntityManager와 transaction의 수명은 동일한 개념이 아닙니다. 이 추가 실험은 application-managed EntityManager를 명시적으로 열고 닫는 조건이며 다른 transaction-scoped/extended 범위로 일반화하지 않습니다. EAGER도 SQL JOIN 자체를 보장하는 선언은 아닙니다.</p>
    <p>공식 근거: <a href="https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html">Jakarta Persistence3.2</a> · <a href="https://docs.hibernate.org/orm/7.4/migration-guide/">Hibernate7.4 migration guide · 현재7.4.13</a> · <a href="https://docs.hibernate.org/orm/7.4/whats-new/">Hibernate7.4 새 기능</a> · <a href="https://raw.githubusercontent.com/hibernate/hibernate-orm/7.4.5/hibernate-core/src/main/java/org/hibernate/jpa/HibernateHints.java">7.4.5 tag의 limitInMemory hint</a></p>
    ${sources.map(([title,file])=>`<details><summary>${escape(title)}</summary><pre><code>${escape(fs.readFileSync(new URL('../../docs/design/s09-2026-10-20/'+file,import.meta.url),'utf8'))}</code></pre></details>`).join('')}
  </details>`;
}
