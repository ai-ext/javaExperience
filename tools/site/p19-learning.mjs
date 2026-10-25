import { readFileSync } from 'node:fs';
import { P19_LESSONS, P19_ASSETS, p19AssetRoot } from './p19-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function renderP19Supplementary() {
  const files=[['probe/P19Proof.java','추가 Boot/H2·Hikari·타입 컴파일 실험'],['execution.json','관측값·19검사·실행 범위'],['dependency-cases.json','원문·추가 구성의 의존성 resolve 결과']];
  return `<details class="p19-supplement"><summary>추가 실험 전체 코드·관측값·버전 교정 근거</summary><p>원문 Java4파일을 별도 Boot4.1.1/JDK21/H2 non-web 구성에서 실행했습니다. Controller 메서드는 Java로 직접 호출했습니다. 원문의 MySQL/Java25 전체 구성·HTTP·Actuator·Docker 컨테이너는 실행하지 않았습니다. 풀1개/250ms 실험은 원문10개/30000ms와 다른 별도 조건입니다.</p><p>원문의 web starter는 resolve되지만 deprecated입니다. Testcontainers 좌표와 generic 타입 사용, H2 의존성 누락은 위의 비교 장면을 참고하세요. 원문 전체는 아래에 보존했습니다.</p>${files.map(([file,label])=>`<details><summary>${escape(label)}</summary><pre><code>${escape(readFileSync(new URL('../../docs/design/p19-2026-10-20/source-proof/'+file,import.meta.url),'utf8'))}</code></pre></details>`).join('')}<p><a href="https://docs.spring.io/spring-boot/reference/using/build-systems.html" target="_blank" rel="noopener">Boot4.1.1 의존성</a> · <a href="https://java.testcontainers.org/modules/databases/mysql/" target="_blank" rel="noopener">Testcontainers MySQL</a> · <a href="https://github.com/brettwooldridge/HikariCP" target="_blank" rel="noopener">HikariCP</a> · 확인2026-10-20. 원문 테스트 전체의 실행 성공을 뜻하지 않습니다.</p></details>`;
}
export const p19AvailableLessons = () => P19_LESSONS.filter(lesson => lesson.stages.every(stage => P19_ASSETS[stage.image]?.ready === true));

// P19 첫 학습 화면이다. 원문 전체를 감싸는 wrapper는 사이트 빌드가 보존해 연결한다.
export function renderP19Learning() {
  const available = p19AvailableLessons();
  if (!available.length) return '<section class="p09-learning p19-learning" data-p19-learning aria-labelledby="p19-heading"><h1 id="p19-heading">MySQL·JPA 설정 학습 그림을 검수하며 준비 중입니다.</h1></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = P19_ASSETS[stage.image];
  return `<section class="p09-learning p19-learning" data-p19-learning aria-labelledby="p19-heading">
    <nav class="p09-return" aria-label="개념 학습 이동"><a href="README.html?from=detail" data-kc-catalog-return>← 개념 목록·검색 결과</a><a data-kc-task-return hidden></a></nav>
    <header class="p19-intro"><p>MySQL·JPA · 주소·자동 구성·연결 풀</p><h1 id="p19-heading" data-p19-question>${escape(lesson.question)}</h1></header>
    <label class="p09-topic-label" for="p19-topic">살펴볼 질문<select id="p19-topic" data-p19-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="MySQL·JPA 설정 학습 장면">
      <header class="p09-question"><p data-p19-source>${escape(lesson.source)}</p></header>
      <div class="p09-stages" data-p19-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-p19-mobile-prev aria-label="이전 학습 장면">이전</button><label class="p09-stage-label" for="p19-stage-select">장면<select id="p19-stage-select" data-p19-stage-select></select></label><button type="button" data-p19-mobile-next aria-label="다음 학습 장면">다음</button></div>
      <h3 data-p19-title>${escape(stage.title)}</h3><p class="p09-lead" data-p19-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame p19-image-frame"><div class="p09-image-window"><img data-p19-image src="${p19AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-p19-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-p19-figure-label>전체 관계 그림</span><button type="button" data-p19-zoom aria-pressed="false">강조 구간 확대</button><a data-p19-image-link href="${p19AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 설정과 관찰값</h3><dl data-p19-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드</h3><button type="button" data-p19-copy>코드 복사</button></div><pre><code data-p19-code></code></pre><p>원문 설정과 추가 실험의 코드 발췌입니다. 포트 설명·H2 실행·compile-only를 구분합니다.</p><p data-p19-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-p19-note>${escape(lesson.note)}</p>
      <details class="p19-output" data-p19-output hidden><summary>추가 실행 검증 로그 보기</summary><p>PASS는 추가 Boot non-web·H2·Hikari·타입 compile 검사 로그입니다. 의존성 목록은 별도 Gradle resolve 결과입니다. MySQL·Docker·HTTP 실행 결과가 아닙니다.</p><pre><code data-p19-stdout></code></pre><div class="p19-dependencies" data-p19-dependencies></div></details>
      <footer class="p09-controls"><button type="button" data-p19-prev disabled>← 이전</button><span data-p19-position role="status"></span><button type="button" data-p19-next>다음 →</button></footer>
    </section>
    <p class="p09-original-link"><a href="#p19-original">원문 전체 · 긴 코드·선택 기준·자가점검 보기 ↓</a></p>
  </section>` + renderP19Supplementary();
}
