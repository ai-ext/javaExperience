import { D02_LESSONS, D02_ASSETS, d02AssetRoot } from './d02-lesson-data.mjs';
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const d02AvailableLessons = () => D02_LESSONS.filter(lesson => lesson.stages.every(stage => D02_ASSETS[stage.image]?.ready === true));

// 원문과 기존 설명은 main이 별도로 보존해 연결하는 D02 보충 section이다.
export function renderD02Learning() {
  const available = d02AvailableLessons();
  if (!available.length) return '<section class="p09-learning d02-learning" data-d02-learning aria-labelledby="d02-learning-heading"><h2 id="d02-learning-heading">서버·네트워크 보충 학습 그림을 검수하며 준비 중입니다.</h2></section>';
  const lesson = available[0], stage = lesson.stages[0], asset = D02_ASSETS[stage.image];
  return `<section class="p09-learning d02-learning" data-d02-learning aria-labelledby="d02-learning-heading">
    <header class="d02-intro"><p>서버·네트워크 · URL·연결·TLS·HTTP 관찰</p><h2 id="d02-learning-heading" data-d02-question>${escape(lesson.question)}</h2></header>
    <p class="d02-scope">원문 Java를 그대로 추가 Java21·Boot4.1.1의 private loopback 앱에서 실행했습니다. 추가 DNS UDP·TCP·검증 활성 TLS proxy 관측이며 원문 Java25/8080·Nginx·외부 DNS/경로·firewall/NAT·QUIC·전달 헤더 정책은 미실행입니다.</p>
    <label class="p09-topic-label" for="d02-topic">살펴볼 질문<select id="d02-topic" data-d02-topic>${available.map(item => `<option value="${escape(item.id)}">${escape(item.question)}</option>`).join('')}</select></label>
    <section class="p09-scene" aria-label="서버·네트워크 보충 학습 장면">
      <header class="p09-question"><p data-d02-source>${escape(lesson.source)}</p></header>
      <p class="d02-source-note" data-d02-source-note>${escape(lesson.sourceNote || '')}</p>
      <div class="p09-stages" data-d02-stages role="group" aria-label="장면 선택"></div>
      <div class="p09-mobile-nav" role="group" aria-label="모바일 장면 이동"><button type="button" data-d02-mobile-prev aria-label="이전 학습 장면">이전</button><label class="p09-stage-label" for="d02-stage-select">장면<select id="d02-stage-select" data-d02-stage-select></select></label><button type="button" data-d02-mobile-next aria-label="다음 학습 장면">다음</button></div>
      <h3 data-d02-title>${escape(stage.title)}</h3><p class="p09-lead" data-d02-lead>${escape(stage.lead)}</p>
      <div class="p09-workspace"><figure class="p09-figure"><div class="p09-image-frame d02-image-frame"><div class="p09-image-window"><img data-d02-image src="${d02AssetRoot}${asset.file}" width="${asset.width}" height="${asset.height}" alt="${escape(asset.alt)}"><span class="p09-focus" data-d02-focus aria-hidden="true" hidden></span></div></div><figcaption><span data-d02-figure-label>전체 관계 그림</span><button type="button" data-d02-zoom aria-pressed="false">강조 구간 확대</button><a data-d02-image-link href="${d02AssetRoot}${asset.file}" target="_blank" rel="noopener">원본 그림 보기 ↗</a></figcaption></figure>
      <div class="p09-observation"><section class="p09-value-sheet"><h3>지금의 요청·연결·응답 관찰값</h3><dl data-d02-state></dl></section><section class="p09-code-sheet"><div><h3>함께 읽을 코드</h3><button type="button" data-d02-copy>코드 복사</button></div><pre><code data-d02-code></code></pre><p>원문·추가 loopback fixture·명시적 모델의 짧은 발췌입니다. 강조는 설명하는 위치이며 실시간 실행 줄이 아닙니다.</p><p data-d02-copy-status role="status"></p></section></div></div>
      <p class="p09-note" data-d02-note>${escape(lesson.note)}</p>
      <details class="d02-output" data-d02-output hidden><summary>실제 관측·모델 근거 보기</summary><p>최종 frozen 실제 JSON/PASS 발췌입니다. 실제 CHECK17개와 명시적 모델3개를 구분하며 모델 장면에는 PASS를 만들지 않습니다. 각 관측은 private loopback fixture 범위입니다. 원문 전체의 구현·검증 완료를 뜻하지 않습니다.</p><pre><code data-d02-stdout></code></pre><div class="d02-runs" data-d02-runs></div></details>
      <footer class="p09-controls"><button type="button" data-d02-prev disabled>← 이전</button><span data-d02-position role="status"></span><button type="button" data-d02-next>다음 →</button></footer>
    </section>
    <p class="p09-original-link"><a href="#d02-original">원문 전체 · 긴 코드·선택 기준·자가점검 보기 ↓</a></p>
  </section>`;
}

// 실행용 추가 구성과 원문 예제를 분리해 필요할 때 확인한다.
