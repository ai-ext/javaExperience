import { renderP02ImageScenes } from './p02-image-scenes.mjs';
import { renderP02DataScenes } from './p02-data-scenes.mjs';
import { renderP02PracticeScenes } from './p02-practice-scenes.mjs';

const esc = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const helloJava = `@GetMapping("/hello")
model.addAttribute("name", "Spring MVC");
return "hello";`;
const helloTemplate = `<h1 th:text="|안녕하세요, \${name}!|">인사</h1>`;
const memoCurl = `curl -i -X POST http://localhost:8080/api/memos \\
  -H 'Content-Type: application/json' \\
  -d '{"title":"첫 메모","content":"계층을 나눴다"}'`;

export function renderP02Focused() {
  return `<section class="p02-focused" data-p02-mode="concept" aria-label="P02 MVC 응답 방식 직접 확인">
    <article class="p02-focus-screen p02-concept-screen" data-p02-screen="concept" aria-labelledby="p02-concept-title">
      <p class="p02-focus-kicker">P02 · MVC 첫 이해</p><h2 id="p02-concept-title">MVC에서 누가 값을 화면에 보여 줄까요?</h2>
      <p class="p02-concept-lead"><code>GET /hello</code>가 한 화면이 되는 동안 맡은 역할을 눌러 보세요.</p>
      <label class="p02-demo-input">설명용 name 값 바꾸기 <input type="text" data-p02-demo-input value="Spring MVC" maxlength="40" aria-describedby="p02-demo-boundary"></label>
      <div class="p02-concept-roles" role="group" aria-label="Controller Model View 역할"><button type="button" data-mvc-step="controller" aria-pressed="false"><strong>Controller</strong><span>요청을 받고 값을 담기</span><code>name = "<span data-p02-demo-name>Spring MVC</span>"</code></button><b aria-hidden="true">→</b><button type="button" data-mvc-step="model" aria-pressed="true"><strong>Model</strong><span>이번 요청에서 View에 줄 값</span><code>name = "<span data-p02-demo-name>Spring MVC</span>"</code></button><b aria-hidden="true">→</b><button type="button" data-mvc-step="view" aria-pressed="false"><strong>View</strong><span>hello.html이 값 표시</span><code>안녕하세요, <span data-p02-demo-name>Spring MVC</span>!</code></button></div>
      <p class="p02-concept-explain" data-mvc-explain aria-live="polite">Model은 View에 건넬 값을 담습니다. DB 저장소가 아닙니다.</p>
      <div class="p02-concept-result"><small>설명용 기대 화면 · 실제 실행 전</small><strong>GET /hello → 안녕하세요, <span data-p02-demo-name>Spring MVC</span>!</strong></div>
      <p class="p02-demo-boundary" id="p02-demo-boundary">여기서 값을 바꿔도 Java 코드나 실행 중인 서버는 바뀌지 않습니다. 같은 값을 Model에 넣었다고 가정한 화면 예측입니다.</p>
      <button type="button" class="p02-concept-next" data-p02-go="hello">다음: /hello 화면으로 직접 확인하기 →</button>
    </article>
    <article class="p02-focus-screen" data-p02-screen="hello" hidden aria-labelledby="p02-hello-title">
      <header class="p02-focus-head"><p class="p02-focus-kicker">P02 · 먼저 HTML 화면</p><h2 id="p02-hello-title">name 값이 화면에 보이는지 확인하세요</h2>
        <p><code>GreetingPageController.java</code>에서 값을 넘긴 뒤 <code>GET /hello</code>를 엽니다.</p></header>
      <div class="p02-focus-grid"><div class="p02-focus-code"><header><strong>GreetingPageController.java</strong><small>com.example.memo 예제 · 핵심 발췌</small></header>
        <pre><code>${esc(helloJava)}</code></pre><p>Controller는 <code>name = "Spring MVC"</code>를 Model에 담고 View 이름 <code>hello</code>를 반환합니다.</p></div>
        <div class="p02-focus-view"><header><strong>templates/hello.html</strong><small>View · Thymeleaf</small></header><pre><code>${esc(helloTemplate)}</code></pre>
          <div class="p02-focus-browser"><small>GET /hello · 구현 후 기대 화면</small><strong>안녕하세요, <mark><span data-p02-demo-name>Spring MVC</span>!</mark></strong></div></div></div>
      <p class="p02-focus-boundary">Model은 View에 전달할 값입니다. Repository와 다릅니다. 이 예제는 DB를 읽거나 쓰지 않습니다.</p>
      <footer class="p02-focus-footer"><button type="button" data-p02-go="concept">← MVC 역할 보기</button><a href="#36-같은-프로젝트에-thymeleaf-화면-붙이기" data-p02-source="true">전체 코드와 실행 순서 열기 ↗</a>
        <button type="button" data-p02-go="response-compare">다음: HTML과 JSON 비교하기 →</button></footer>
    </article>
    <article class="p02-focus-screen p02-response-screen" data-p02-screen="response-compare" hidden aria-labelledby="p02-response-title">
      <header class="p02-focus-head"><p class="p02-focus-kicker">P02 · 사용자 시안 05·06 / 두 응답 경로</p><h2 id="p02-response-title">같은 Spring MVC인데 왜 HTML과 JSON이 다를까요?</h2><p>요청과 Controller의 반환 방식을 골라 두 경로를 비교하세요.</p></header>
      <div class="p02-response-switch" role="group" aria-label="응답 방식 선택"><button type="button" data-p02-response="html" aria-pressed="true">HTML · GET /hello</button><button type="button" data-p02-response="json" aria-pressed="false">JSON · GET /api/memos</button></div>
      <div class="p02-response-lanes" data-p02-response-mode="html"><div class="p02-response-lane" data-p02-lane="html"><small>HTML 화면</small><strong>Model → Thymeleaf → HTML</strong><p><code>@Controller</code>가 <code>name</code>을 Model에 넣고 뷰 이름 <code>hello</code>를 돌려줍니다. <code>hello.html</code>이 문장을 만듭니다.</p></div><div class="p02-response-lane" data-p02-lane="json"><small>JSON 데이터</small><strong>MemoResponse → HttpMessageConverter → JSON</strong><p><code>@RestController</code>가 DTO를 반환합니다. 메시지 변환기가 응답 본문으로 직렬화하며 서버의 HTML View를 렌더링하지 않습니다.</p></div></div>
      <p class="p02-response-observation" data-p02-response-observation aria-live="polite">GET /hello는 <code>hello.html</code>을 렌더링해 HTML을 응답합니다.</p>
      <details class="p02-response-question"><summary>JSON 응답에도 hello.html이 쓰일까요?</summary><p>아니요. <code>GET /api/memos</code>는 응답 DTO를 JSON으로 직렬화합니다. 이 비교는 같은 예제 앱의 두 경로를 설명하며, 실제 서버 요청 결과는 아닙니다.</p></details>
      <p class="p02-focus-boundary">이 화면의 <code>GET /api/memos</code>는 목록 조회 예시입니다. 다음 장면에서 직접 보내는 <code>POST /api/memos</code>는 새 메모를 만드는 별도 요청입니다.</p>
      <div class="p02-response-assets"><a href="../design/mockups-2026-10-15-batch2/05-mvc-premium.png">시안 05 · 값의 여행 ↗</a><a href="../design/mockups-2026-10-15-batch2/06-html-vs-json-v2.png">시안 06 · HTML/JSON ↗</a></div>
      <footer class="p02-focus-footer"><button type="button" data-p02-go="hello">← HTML 화면</button><button type="button" data-p02-go="json">다음: JSON API 직접 요청 →</button></footer>
    </article>
    <article class="p02-focus-screen" data-p02-screen="json" hidden aria-labelledby="p02-json-title">
      <header class="p02-focus-head"><p class="p02-focus-kicker">P02 · 다음은 JSON API</p><h2 id="p02-json-title">POST 요청으로 JSON을 확인하세요</h2><p>앞의 <code>GET /hello</code>와 다른 예제입니다. <code>POST /api/memos</code>에 메모를 보냅니다.</p></header>
      <div class="p02-focus-grid"><div class="p02-focus-code"><header><strong>터미널에서 실행</strong><small>서버가 실행 중인 예제 프로젝트</small></header>
        <pre><code>${esc(memoCurl)}</code></pre><button class="p02-copy" type="button" data-p02-copy="true">curl 명령 복사</button><p data-p02-copy-state role="status" aria-live="polite"></p></div>
        <div class="p02-focus-view"><header><strong>구현 후 기대 응답</strong><small>HTTP 201 Created · 실행 전</small></header><div class="p02-json-fields"><div><code>id</code><span>실행 후 받은 id</span></div><div><code>title</code><span>첫 메모</span></div><div><code>content</code><span>계층을 나눴다</span></div></div>
          <p><code>MemoResponse</code>를 메시지 변환기가 JSON으로 보냅니다. <code>hello.html</code>을 렌더링하지 않습니다.</p></div></div>
      <p class="p02-focus-boundary">이 예제는 메모리에 저장합니다. 서버를 재시작하면 만든 메모가 사라집니다.</p>
      <footer class="p02-focus-footer"><button type="button" data-p02-go="hello" class="p02-focus-back">← HTML 예제로 돌아가기</button><a href="#35-curl로-요청-보내기" data-p02-source="true">코드와 확인 방법 열기 ↗</a><button type="button" data-p02-go="routing">다음: 요청 라우팅 보기 →</button></footer>
    </article>
    ${renderP02ImageScenes().trimStart()}
    ${renderP02DataScenes().trimStart()}
    ${renderP02PracticeScenes().trimStart()}
    <details class="p02-focus-reference"><summary>화면 시안과 전체 흐름 다시 보기</summary><p>각 학습 장면의 원본 시안과 집중 화면을 비교해 보세요.</p><a href="../design/mockups-2026-10-15-batch11/01-mvc-roles.png" target="_blank" rel="noopener">MVC 역할 첫 화면 ↗</a><a href="../design/mockups-2026-10-15-batch6/07-p02-hello-focused.png" target="_blank" rel="noopener">HTML 집중 화면 ↗</a><a href="../design/mockups-2026-10-15-batch6/09-p02-json-focused.png" target="_blank" rel="noopener">JSON 집중 화면 ↗</a><a href="../design/mockups-2026-10-15-batch2/05-mvc-premium.png" target="_blank" rel="noopener">MVC 전체 지도 ↗</a><a href="../design/mockups-2026-10-15-batch2/06-html-vs-json-v2.png" target="_blank" rel="noopener">응답 비교 ↗</a><a href="../design/mockups-2026-10-15-batch2/07-request-routing-v3.png" target="_blank" rel="noopener">라우팅 ↗</a><a href="../design/mockups-2026-10-15-batch2/08-controller-boundary-v2.png" target="_blank" rel="noopener">경계 ↗</a><a href="../design/mockups-2026-10-15-batch2/09-service-rule-v2.png" target="_blank" rel="noopener">Service 규칙 ↗</a><a href="../design/mockups-2026-10-15-batch2/10-memory-repository.png" target="_blank" rel="noopener">인메모리 저장소 ↗</a></details>
  </section>`;
}
