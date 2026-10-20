/** P16 원문 3.2의 예상값을 비교하는 상세 화면. 학습 서버 실행 결과가 아니다. */
export function renderP16JsonVisual() {
  return `<section class="p16-json-visual" aria-labelledby="p16-heading" data-p16-visual>
  <nav class="p16-breadcrumb" aria-label="개념 학습 이동"><a href="README.html?from=detail" data-kc-catalog-return>← 검색 결과</a><a class="kc-task-return" data-kc-task-return hidden></a></nav>
  <header class="p16-intro"><h1 id="p16-heading">요청 JSON은 어떻게 DTO가 될까요?</h1><p>같은 keyboard와 수량 2가 요청과 응답에 담기는 과정을 살펴봅니다.</p><span>P16 · JSON·Jackson <i aria-hidden="true">/</i> 원문 3.2 <i aria-hidden="true">/</i> 예제 예상값</span></header>
  <div class="p16-navigation" data-p16-navigation role="group" aria-label="예상 장면 선택. 좌우 화살표, Home, End로 이동">
    <div class="p16-step-buttons"><button type="button" data-p16-step="0" aria-current="step"><span>1</span>요청 인자 준비</button><button type="button" data-p16-step="1"><span>2</span>응답 객체 생성</button><button type="button" data-p16-step="2"><span>3</span>응답 JSON</button></div>
    <label class="p16-select-label" for="p16-step-select">예상 장면<select id="p16-step-select" data-p16-select><option value="0">1/3　요청 인자 준비</option><option value="1">2/3　응답 객체 생성</option><option value="2">3/3　응답 JSON</option></select></label>
  </div>
  <div class="p16-scene" aria-labelledby="p16-scene-heading"><div class="p16-scene-heading"><h2 id="p16-scene-heading" data-p16-title tabindex="-1">Controller 호출 전 · 요청 인자를 준비해요</h2><p data-p16-lead>Spring MVC가 Jackson 기반 메시지 변환기를 통해 요청 본문을 읽습니다.</p></div>
    <div class="p16-pair"><section class="p16-value-panel" data-p16-left aria-label="변환 전"><h3>HTTP 요청 JSON</h3><strong class="p16-endpoint">POST /orders</strong><p class="p16-meta">Content-Type: application/json</p><pre><code>{
  "product": "keyboard",
  "quantity": 2
}</code></pre></section><section class="p16-value-panel" data-p16-right aria-label="변환 후"><h3>Java 요청 객체</h3><p class="p16-type">CreateOrderRequest</p><table><thead><tr><th>필드</th><th>타입</th><th>값</th></tr></thead><tbody><tr><td>product</td><td>String</td><td>"keyboard"</td></tr><tr><td>quantity</td><td>int</td><td>2</td></tr></tbody></table></section></div>
    <div class="p16-code-location"><strong data-p16-code-label>지금 보는 코드 · 인자 준비 구간</strong><pre><code data-p16-code>OrderResponse create(<mark>@RequestBody CreateOrderRequest request</mark>) {</code></pre><p class="p16-code-note">강조는 학습 위치이며 실행 중인 줄을 뜻하지 않습니다. 아직 Controller 본문은 호출되지 않았습니다.</p></div>
    <p class="p16-boundary">이 예제는 DB를 사용하지 않습니다. id 1L과 시각은 원문 코드의 고정값입니다.</p>
    <p class="p16-scene-status" data-p16-status role="status">1/3 · 요청 인자 준비 · 설명용 예상 장면</p>
  </div>
  <footer class="p16-actions"><button type="button" data-p16-prev disabled>← 이전</button><button type="button" class="p16-error-toggle" data-p16-error-toggle aria-pressed="false">수량이 "two"라면?</button><button type="button" class="p16-next" data-p16-next>다음: 응답 객체 만들기 →</button></footer>
  <p class="p16-read-note" data-p16-read-note hidden>읽음 표시는 이 예제의 학습 확인용입니다. 자동 채점·API 실행 통과·과제 진도와 별도로 보관합니다.</p>
  <p class="p16-storage-note" data-p16-storage role="status" hidden></p>
  <div class="p16-source-links"><p class="p16-version-note">원문의 Boot 4.1 · Java 25 별도 예제입니다. 현재 저장소의 서버를 실행하거나 실제 HTTP 요청을 보내지 않습니다.</p><a href="#p16-original">원문 전체 보기 ↗</a></div>
</section>`;
}
