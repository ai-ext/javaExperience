/** 사용자가 제공한 P02 시안 07~10을 원문의 계약에 맞춰 조작 가능한 장면으로 옮긴다. */
const image = (file, label) => `<a class="p02-image-link" href="../design/mockups-2026-10-15-batch2/${file}" target="_blank" rel="noopener">${label} 시안 보기 ↗</a>`;
const footer = (back, next, source) => `<footer class="p02-focus-footer"><button type="button" data-p02-go="${back}">← 이전 장면</button><a href="${source}" data-p02-source="true">원문 코드·설명 열기 ↗</a>${next ? `<button type="button" class="p02-image-next" data-p02-go="${next}">다음 장면 →</button>` : ''}</footer>`;

export function renderP02ImageScenes() {
  return `
    <article class="p02-focus-screen p02-image-screen" data-p02-screen="routing" hidden aria-labelledby="p02-routing-title">
      <p class="p02-focus-kicker">P02 · 시안 07 / 요청 라우팅</p><h2 id="p02-routing-title">같은 주소도 HTTP 메서드에 따라 다른 코드가 받습니다</h2>
      <p class="p02-image-lead"><code>/api/memos</code>에 보낼 요청을 고르세요. Spring MVC가 메서드와 경로를 함께 보고 매핑합니다.</p>
      <div class="p02-route-picker" role="group" aria-label="HTTP 요청 선택"><button type="button" data-p02-route="post" aria-pressed="true">POST <code>/api/memos</code><span>메모 만들기</span></button><button type="button" data-p02-route="get" aria-pressed="false">GET <code>/api/memos</code><span>목록 조회</span></button></div>
      <div class="p02-route-lanes"><div class="p02-route-start"><small>클라이언트 요청</small><strong data-p02-route-request>POST /api/memos</strong><pre data-p02-route-body>{"title":"첫 메모","content":"계층을 나눴다"}</pre></div><span aria-hidden="true">→</span><div class="p02-route-gate"><small>프런트 컨트롤러</small><strong>DispatcherServlet</strong><p>메서드 + 경로가 맞는 Controller 메서드를 찾습니다.</p></div><span aria-hidden="true">→</span><div class="p02-route-end"><small>선택된 메서드</small><strong data-p02-route-method>MemoController.create(request)</strong><code data-p02-route-mapping>@PostMapping</code></div></div>
      <div class="p02-route-result" data-p02-route-result><strong>구현 후 기대</strong><p>Service가 새 메모를 저장하면 Controller가 <code>201 Created</code>와 <code>MemoResponse</code>를 반환합니다. <code>id</code>는 실행 후 정해집니다.</p></div>
      ${image('07-request-routing-v3.png', '07 · 라우팅')}${footer('json', 'boundary', '#24-controller')}
    </article>
    <article class="p02-focus-screen p02-image-screen" data-p02-screen="boundary" hidden aria-labelledby="p02-boundary-title">
      <p class="p02-focus-kicker">P02 · 시안 08 / Controller 경계</p><h2 id="p02-boundary-title">Controller는 HTTP 경계를 맡고, 저장은 Service에 맡깁니다</h2>
      <p class="p02-image-lead">메모 하나가 이동하는 여섯 순간을 눌러 보세요. 현재 예제는 인메모리 저장소를 씁니다.</p>
      <div class="p02-boundary-lanes"><span>HTTP 경계 · Controller</span><span>업무 처리 · Service / Repository</span><span>HTTP 경계 · Controller</span></div>
      <div class="p02-boundary-steps" role="group" aria-label="메모 생성 흐름">
        <button type="button" data-p02-boundary="0" aria-pressed="true"><b>01</b>POST 요청</button><button type="button" data-p02-boundary="1" aria-pressed="false"><b>02</b>요청 DTO</button><button type="button" data-p02-boundary="2" aria-pressed="false"><b>03</b>Controller</button><button type="button" data-p02-boundary="3" aria-pressed="false"><b>04</b>Service</button><button type="button" data-p02-boundary="4" aria-pressed="false"><b>05</b>응답 DTO</button><button type="button" data-p02-boundary="5" aria-pressed="false"><b>06</b>201 응답</button>
      </div>
      <div class="p02-boundary-detail" aria-live="polite"><small data-p02-boundary-index>01 · 클라이언트</small><strong data-p02-boundary-value>POST /api/memos</strong><p data-p02-boundary-explain>title과 content를 JSON으로 보냅니다.</p></div>
      <p class="p02-image-boundary">현재 코드에서 Controller는 경로·요청 DTO·상태 코드를 다룹니다. 저장과 DTO 변환은 Service가 호출하는 저장소 흐름에 있습니다. 성공 응답의 id는 고정값이 아닙니다.</p>
      ${image('08-controller-boundary-v2.png', '08 · 경계')}${footer('routing', 'service-rule', '#24-controller')}
    </article>
    <article class="p02-focus-screen p02-image-screen" data-p02-screen="service-rule" hidden aria-labelledby="p02-service-rule-title">
      <p class="p02-focus-kicker">P02 · 시안 09 / Service 규칙</p><h2 id="p02-service-rule-title">여러 진입점에 같은 규칙이 필요하면 Service에서 판단합니다</h2>
      <p class="p02-image-lead">현재 예제의 <code>MemoService.create</code>는 저장과 응답 변환만 합니다. 아래 빈 제목 거절은 <strong>추가 구현을 생각해 보는 설계 예시</strong>입니다.</p>
      <div class="p02-rule-picker" role="group" aria-label="규칙 위치 비교"><button type="button" data-p02-rule="controller" aria-pressed="false">Controller에만 둔 경우</button><button type="button" data-p02-rule="service" aria-pressed="true">Service에 둔 경우</button></div>
      <div class="p02-rule-flow"><div><small>웹 요청</small><strong>POST /api/memos</strong><code>title = ""</code></div><div><small>다른 진입점 · 개념 예시</small><strong>배치 작업</strong><code>title = ""</code></div><span aria-hidden="true">→</span><div class="p02-rule-decision"><small>공통 판단 위치</small><strong data-p02-rule-target>MemoService</strong><p data-p02-rule-explain>두 진입점 모두 같은 규칙을 거치게 설계할 수 있습니다.</p></div></div>
      <p class="p02-image-boundary">현재 예제에 빈 제목 검증·배치 작업은 없습니다. 이 화면의 선택은 규칙 배치를 이해하는 설명용 상태이며, 요청 버튼으로 실제 서버를 실행하지 않습니다.</p>
      ${image('09-service-rule-v2.png', '09 · 규칙')}${footer('boundary', 'memory-repository', '#25-service')}
    </article>
    <article class="p02-focus-screen p02-image-screen" data-p02-screen="memory-repository" hidden aria-labelledby="p02-memory-title">
      <p class="p02-focus-kicker">P02 · 시안 10 / 인메모리 저장소</p><h2 id="p02-memory-title">메모리에 저장한 값은 앱을 다시 띄우면 사라집니다</h2>
      <p class="p02-image-lead"><code>InMemoryMemoRepository</code>의 <code>ConcurrentHashMap</code> 안에만 보관합니다. 아래는 <strong>설명용 상태 전환</strong>입니다.</p>
      <div class="p02-memory-picker" role="group" aria-label="인메모리 상태 선택"><button type="button" data-p02-memory="saved" aria-pressed="true">저장 직후</button><button type="button" data-p02-memory="restarted" aria-pressed="false">앱 재시작 뒤</button></div>
      <div class="p02-memory-shelf"><div><small>POST /api/memos · 예시 입력</small><code>{"title":"첫 메모","content":"계층을 나눴다"}</code><span>↓ repository.save(title, content)</span></div><div class="p02-memory-state"><small>ConcurrentHashMap&lt;Long, Memo&gt;</small><strong data-p02-memory-title>메모 1건 보관</strong><code data-p02-memory-row>id=1 · title="첫 메모"</code><p data-p02-memory-note>이 예시에서는 GET /api/memos가 저장된 메모를 돌려줍니다.</p></div></div>
      <p class="p02-image-boundary">시뮬레이션 버튼은 실제 Spring 앱을 재시작하지 않습니다. 직접 확인하려면 원문의 curl 순서대로 POST → GET → 앱 재시작 → GET을 실행하세요. id는 실행할 때 정해집니다.</p>
      ${image('10-memory-repository.png', '10 · 저장소')}${footer('service-rule', 'request-dto', '#35-curl로-요청-보내기')}
    </article>`;
}
