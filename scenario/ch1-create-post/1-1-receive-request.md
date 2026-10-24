# 1-1. 요청 받기 — 일단 success

## 상황

프론트 개발자가 글쓰기 화면을 만들면서 이렇게 말했다.

> "저장 버튼 누르면 이 JSON을 `POST /api/posts`로 보낼게요. 일단 받아지기만 하면 돼요."

아직 저장도, 응답 형식도 정하지 않았다. **요청이 서버에 들어오는 입구부터 연다.** 요청을 받아서 객체로 바꾸고, 받았다는 표시로 `success`만 돌려준다.

## 화면 시나리오

사용자가 화면에서 무엇을 하면 어떤 요청이 서버로 가고, 서버·DB에서 무슨 일이 일어나 어떤 응답이 돌아와 화면이 어떻게 바뀌는지다. 흐름의 단계를 누르면 관련된 화면 요소가 강조된다.

<section class="first-request-journey" aria-labelledby="first-request-journey-title">
  <div class="first-request-journey__heading">
    <p class="first-request-journey__eyebrow">POST /api/posts · 첫 요청의 여정</p>
    <h3 id="first-request-journey-title">저장을 눌렀지만, 아직 DB에는 저장되지 않았어요</h3>
    <p>같은 게시글 한 건이 화면 입력에서 HTTP 응답까지 어떻게 옮겨 가는지 따라가 보세요.</p>
  </div>
  <ol class="first-request-scenes" aria-label="게시글 요청의 네 장면">
    <li class="first-request-scene">
      <span class="first-request-scene__number" aria-hidden="true">01</span>
      <div class="first-request-scene__body">
        <h4>저장 버튼을 눌러요</h4>
        <p>화면에서 작성한 제목과 본문, 태그가 요청 데이터가 됩니다.</p>
        <div class="first-request-scene__visual first-request-form" aria-label="작성 화면의 값">
          <span class="first-request-form__top"><i aria-hidden="true"></i><i aria-hidden="true"></i><i aria-hidden="true"></i> 새 글 작성</span>
          <span><small>제목</small><strong>[채점] 첫 게시글</strong></span>
          <span><small>본문</small>Spring Boot로 만든 첫 게시글입니다.</span>
          <span><small>게시판 · 태그 · 공개 범위</small>dev · spring, jpa · PUBLIC</span>
          <span class="first-request-button">저장</span>
        </div>
      </div>
      <p class="first-request-scene__note">아직 저장 전</p>
    </li>
    <li class="first-request-scene">
      <span class="first-request-scene__number" aria-hidden="true">02</span>
      <div class="first-request-scene__body">
        <h4>값이 JSON으로 전송돼요</h4>
        <p>브라우저는 <code>POST</code> 요청 본문에 필드를 담아 서버로 보냅니다.</p>
        <div class="first-request-scene__visual first-request-packet">
          <div class="first-request-packet__meta"><strong>POST</strong><code>/api/posts</code><span>Content-Type: application/json</span></div>
          <pre aria-label="전송되는 JSON"><code>{
  "boardSlug": "dev",
  "title": "[채점] 첫 게시글",
  "content": "Spring Boot로 만든 첫 게시글입니다.",
  "tags": ["spring", "jpa"],
  "visibility": "PUBLIC"
}</code></pre>
          <span class="first-request-packet__destination" aria-hidden="true">→ 서버</span>
        </div>
      </div>
      <p class="first-request-scene__note">JSON 요청 본문</p>
    </li>
    <li class="first-request-scene">
      <span class="first-request-scene__number" aria-hidden="true">03</span>
      <div class="first-request-scene__body">
        <h4>Spring이 DTO로 바꿔 Controller에 전달해요</h4>
        <p><code>HttpMessageConverter</code>가 JSON 필드를 <code>PostCreateRequest</code>의 구성 요소에 맞춥니다. 본문 변환에 실패하면 Controller 메서드까지 오지 않아요.</p>
        <div class="first-request-scene__visual first-request-conversion" aria-label="JSON 본문에서 Controller까지의 변환">
          <div><span>JSON 본문</span><code>title: "[채점] 첫 게시글"</code></div>
          <span class="first-request-conversion__arrow" aria-hidden="true">→</span>
          <div><span>HttpMessageConverter</span><small>JSON 읽기</small></div>
          <span class="first-request-conversion__arrow" aria-hidden="true">→</span>
          <div><span>PostCreateRequest</span><code>title = "[채점] 첫 게시글"</code></div>
          <span class="first-request-conversion__arrow" aria-hidden="true">→</span>
          <div class="first-request-conversion__controller"><span>PostController</span><code>create(request)</code></div>
        </div>
        <p class="first-request-scene__subflow"><span>Spring 내부 연결</span>DispatcherServlet → HandlerAdapter → 본문 변환 → Controller</p>
      </div>
      <p class="first-request-scene__note">DTO는 요청 모양을 담아요</p>
    </li>
    <li class="first-request-scene first-request-scene--response">
      <span class="first-request-scene__number" aria-hidden="true">04</span>
      <div class="first-request-scene__body">
        <h4><code>success</code> 응답이 돌아와요</h4>
        <p>Controller가 제목을 로그로 남긴 뒤 문자열을 반환합니다. 화면에는 요청 완료 알림을 띄울 수 있지만, 글의 ID나 저장 결과는 아직 알 수 없어요.</p>
        <div class="first-request-scene__visual first-request-result">
          <div class="first-request-result__http"><strong>HTTP 200 OK</strong><span>Content-Type: text/plain;charset=UTF-8</span><code>success</code></div>
          <span class="first-request-result__arrow" aria-hidden="true">←</span>
          <div class="first-request-result__screen"><strong>✓ 요청을 받았어요</strong><span>새 글 작성 화면</span></div>
          <div class="first-request-result__db"><span aria-hidden="true">▤</span><strong>DB 저장 없음</strong></div>
        </div>
      </div>
      <p class="first-request-scene__note">응답 확인 ≠ 저장 완료</p>
    </li>
  </ol>
  <p class="first-request-journey__takeaway"><strong>이 단계의 경계</strong><span>Controller + 요청 DTO까지만 구현합니다. Service·Repository·MySQL 저장은 다음 단계들에서 추가합니다.</span></p>
</section>

### 요청 화면과 서버 흐름을 연결해서 보기

아래 화면 시나리오에서 단계를 선택하면 요청 요소와 서버 흐름이 함께 강조됩니다. 위 네 장면은 요청의 큰 흐름을 먼저 보여 주고, 아래에서는 실패·CORS 상황까지 살펴봅니다.

```screen
{
  "title": "글쓰기 화면",
  "summary": "저장 버튼을 누르면 이 JSON이 서버로 간다. 이 단계의 서버는 받기만 하고 success로 답한다.",
  "screen": [
    {
      "type": "bar",
      "id": "bar",
      "label": "새 글 쓰기",
      "right": "김자바"
    },
    {
      "type": "select",
      "id": "board",
      "label": "게시판",
      "value": "개발"
    },
    {
      "type": "field",
      "id": "title",
      "label": "제목",
      "value": "[채점] 첫 게시글"
    },
    {
      "type": "field",
      "id": "content",
      "label": "본문",
      "value": "Spring Boot로 만든 첫 게시글입니다.",
      "multiline": true
    },
    {
      "type": "chips",
      "id": "tags",
      "label": "태그",
      "items": [
        "spring",
        "jpa"
      ]
    },
    {
      "type": "select",
      "id": "visibility",
      "label": "공개 범위",
      "value": "전체 공개"
    },
    {
      "type": "actions",
      "id": "buttons",
      "items": [
        {
          "id": "save",
          "label": "저장",
          "variant": "primary"
        },
        {
          "id": "cancel",
          "label": "취소",
          "variant": "ghost"
        }
      ]
    },
    {
      "type": "toast",
      "id": "toast",
      "value": "저장 요청을 보냈어요"
    }
  ],
  "flows": [
    {
      "name": "저장 누르기",
      "steps": [
        {
          "kind": "user",
          "text": "게시판·제목·본문·태그를 채우고 [저장]을 누른다",
          "focus": [
            "title",
            "content",
            "save"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\n  \"boardSlug\": \"dev\",\n  \"title\": \"[채점] 첫 게시글\",\n  \"content\": \"Spring Boot로 만든 첫 게시글입니다.\",\n  \"tags\": [\n    \"spring\",\n    \"jpa\"\n  ],\n  \"visibility\": \"PUBLIC\"\n}"
        },
        {
          "kind": "server",
          "text": "PostController가 본문 JSON을 PostCreateRequest(record)로 바꿔 받는다 — @RequestBody"
        },
        {
          "kind": "server",
          "text": "받은 제목을 로그로 남긴다: 게시글 작성 요청: [채점] 첫 게시글"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Content-Type: text/plain;charset=UTF-8"
          ],
          "body": "success"
        },
        {
          "kind": "screen",
          "text": "응답에 글 정보가 없어서 화면은 알림만 띄운다. 무엇이 저장됐는지는 아직 모른다",
          "focus": [
            "toast"
          ]
        }
      ]
    },
    {
      "name": "프론트 버그로 JSON이 깨졌을 때",
      "steps": [
        {
          "kind": "user",
          "text": "(프론트 버그) 닫는 괄호가 빠진 JSON이 전송된다",
          "focus": [
            "save"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\"title\": \"[채점] 깨짐\""
        },
        {
          "kind": "server",
          "text": "Spring이 본문을 객체로 바꾸지 못한다(HttpMessageNotReadableException) — 컨트롤러 메서드는 실행되지 않는다"
        },
        {
          "kind": "response",
          "status": 400
        },
        {
          "kind": "screen",
          "text": "사용자가 고칠 수 있는 문제가 아니므로 '잠시 후 다시 시도해 주세요'를 띄우고, 프론트 개발자가 콘솔에서 400을 본다",
          "focus": [
            "toast"
          ]
        }
      ]
    },
    {
      "name": "CORS 설정이 없을 때(브라우저에서 보냄)",
      "steps": [
        {
          "kind": "user",
          "text": "http://localhost:3000에 뜬 화면(이 저장소 문서 사이트 http://127.0.0.1:8765의 실행 칸도 다른 출처다)에서 [저장]을 누른다. 서버는 http://localhost:8080 — 포트가 달라 다른 출처다",
          "focus": [
            "save"
          ]
        },
        {
          "kind": "request",
          "method": "POST",
          "path": "/api/posts",
          "headers": [
            "Content-Type: application/json"
          ],
          "body": "{\n  \"boardSlug\": \"dev\",\n  \"title\": \"[채점] 첫 게시글\",\n  \"content\": \"Spring Boot로 만든 첫 게시글입니다.\",\n  \"tags\": [\n    \"spring\",\n    \"jpa\"\n  ],\n  \"visibility\": \"PUBLIC\"\n}"
        },
        {
          "kind": "server",
          "text": "JSON 본문이라 브라우저가 이 POST를 바로 보내지 않고 먼저 묻는다(preflight): OPTIONS /api/posts — Origin: http://localhost:3000, Access-Control-Request-Method: POST, Access-Control-Request-Headers: content-type"
        },
        {
          "kind": "server",
          "text": "CORS 설정이 없으면 Spring은 preflight에 200으로 답하지만 Access-Control-Allow-Origin을 붙이지 않는다(아래 응답이 그 preflight 응답)"
        },
        {
          "kind": "response",
          "status": 200,
          "headers": [
            "Allow: GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH"
          ]
        },
        {
          "kind": "screen",
          "text": "허락 헤더가 없으니 브라우저는 본 POST를 보내지 않고 막는다. 콘솔에 'blocked by CORS policy', 코드에는 TypeError: Failed to fetch. 실행 칸에는 'CORS로 막혔어요'가 뜬다",
          "focus": [
            "toast"
          ]
        }
      ]
    }
  ]
}
```

## 만들 것
<section class="first-request-build" aria-label="요청을 받고 success로 응답하는 구현 흐름"><p class="first-request-build__eyebrow">1-1 구현 범위 · POST /api/posts</p><div class="first-request-build__steps"><article class="first-request-build__step"><span class="first-request-build__number">01</span><div class="first-request-build__step-title"><h3>클라이언트가 요청</h3><p>JSON 본문을 전용 요청 DTO로 보냅니다.</p></div><div class="first-request-build__request"><div class="first-request-build__request-head"><strong>POST</strong><code>/api/posts</code></div><p>Content-Type: application/json</p><pre><code>{
  "boardSlug": "dev",
  "title": "[채점] 첫 게시글",
  "content": "Spring Boot로 만든 첫 게시글입니다.",
  "tags": ["spring", "jpa"],
  "visibility": "PUBLIC"
}</code></pre></div></article><div class="first-request-build__connector" aria-hidden="true">→</div><article class="first-request-build__step"><span class="first-request-build__number first-request-build__number--teal">02</span><div class="first-request-build__step-title"><h3>JSON 필드를 DTO에 매핑</h3><p>필드 이름이 맞으면 Spring이 요청 객체를 만듭니다.</p></div><div class="first-request-build__mapping" aria-label="JSON 요청 필드와 PostCreateRequest 구성 요소 매핑"><div class="first-request-build__mapping-row"><code>boardSlug</code><span aria-hidden="true">→</span><code>String boardSlug</code><small>게시판 주소 이름: notice · dev · qna · free</small></div><div class="first-request-build__mapping-row"><code>title</code><span aria-hidden="true">→</span><code>String title</code><small>게시글 제목</small></div><div class="first-request-build__mapping-row"><code>content</code><span aria-hidden="true">→</span><code>String content</code><small>게시글 본문</small></div><div class="first-request-build__mapping-row"><code>tags</code><span aria-hidden="true">→</span><code>List&lt;String&gt; tags</code><small>태그 이름 배열: spring · jpa</small></div><div class="first-request-build__mapping-row"><code>visibility</code><span aria-hidden="true">→</span><code>String visibility</code><small>PUBLIC 전체 공개 · FOLLOWERS 팔로워만</small></div><p class="first-request-build__mapping-note">값 검증은 아직 하지 않습니다. 검증은 1-5에서 추가합니다.</p></div><pre class="first-request-build__dto"><code>public record PostCreateRequest(
    String boardSlug, String title, String content,
    List&lt;String&gt; tags, String visibility
) { }</code></pre></article><div class="first-request-build__connector" aria-hidden="true">→</div><article class="first-request-build__step"><span class="first-request-build__number">03</span><div class="first-request-build__step-title"><h3>Controller가 요청을 받음</h3><p><code>@RequestBody</code>로 DTO를 받고 제목을 기록합니다.</p></div><div class="first-request-build__controller"><span>PostController.java</span><pre><code>@PostMapping("/api/posts")
public String create(@RequestBody PostCreateRequest request) {
    log.info("게시글 작성 요청: {}", request.title());
    return "success";
}</code></pre><a href="#구현-가이드">구현 가이드에서 전체 코드 보기 ↓</a></div></article></div><div class="first-request-build__outcomes"><article class="first-request-build__success"><p class="first-request-build__outcome-label">정상 요청의 응답</p><h3>HTTP 200 OK</h3><p>Content-Type: <code>text/plain;charset=UTF-8</code></p><pre><code>success</code></pre><p class="first-request-build__log"><strong>서버 로그</strong><code>게시글 작성 요청: [채점] 첫 게시글</code></p></article><article class="first-request-build__not-saved"><span aria-hidden="true">▤</span><h3>아직 DB에 저장하지 않아요</h3><p>이번 단계는 Controller와 요청 DTO까지만 만듭니다. Service·DB 저장은 다음 단계에서 다룹니다.</p></article></div><p class="first-request-build__cors">브라우저에서 다른 출처의 화면으로 요청하려면 <a href="#cors-열기">CORS 설정도 확인하세요</a>.</p></section>

## 구현 가이드

> **Service 코드는 이 단계에 아직 없습니다.** 1-1은 요청을 받는 `Controller`와 요청 `DTO`만 만들어 흐름의 입구를 익히는 단계입니다. 컨트롤러가 `Repository`를 직접 부르는 1-2를 거친 뒤, 실제 `PostService` 클래스와 `@Transactional` 코드는 [1-3. 서비스로 나누기](1-3-service-layer.md)에서 처음 구현합니다. 지금 Service 구현을 먼저 보고 싶다면 [1-3 구현 가이드 — Service 코드](1-3-service-layer.md#구현-가이드)로 바로 이동하세요.

지금은 저장하지 않는다. JSON을 DTO로 받고 `success`를 돌려주는 가장 작은 API부터 만든다.

<details>
<summary>Controller — POST 요청을 받는 입구</summary>
<section class="first-request-controller-code" aria-label="POST 요청을 Controller가 처리하고 응답하는 흐름"><p class="first-request-controller-code__intro"><code>POST /api/posts</code> 요청은 DTO로 변환된 뒤 Controller 메서드에 도착합니다.</p><div class="first-request-controller-code__route"><article><span>01 · 요청</span><strong>POST /api/posts</strong><small>Content-Type: application/json</small></article><b aria-hidden="true">→</b><article><span>02 · 본문 변환</span><strong>@RequestBody</strong><small>PostCreateRequest request</small></article><b aria-hidden="true">→</b><article><span>03 · Controller 응답</span><strong>String</strong><small>200 · text/plain</small></article></div><div class="first-request-controller-code__editor"><header><strong>org.example.post.PostController.java</strong><span>실제 코드</span></header><pre><code class="language-java">package org.example.post;&#10;&#10;import org.slf4j.Logger;&#10;import org.slf4j.LoggerFactory;&#10;import org.springframework.web.bind.annotation.PostMapping;&#10;import org.springframework.web.bind.annotation.RequestBody;&#10;import org.springframework.web.bind.annotation.RestController;&#10;&#10;@RestController&#10;public class PostController {&#10;    private static final Logger log = LoggerFactory.getLogger(PostController.class);&#10;&#10;    @PostMapping("/api/posts")&#10;    public String create(@RequestBody PostCreateRequest request) {&#10;        log.info("게시글 작성 요청: {}", request.title());&#10;        return "success";&#10;    }&#10;}</code></pre></div><div class="first-request-controller-code__response"><strong>정상 요청</strong><span>HTTP 200 OK</span><code>Content-Type: text/plain;charset=UTF-8</code><pre><code>success</code></pre></div><div class="first-request-controller-code__error"><strong>본문 변환에 실패하면</strong><span>문법이 깨진 JSON 등은 Controller 메서드에 도착하기 전에 변환이 실패해 HTTP 400이 됩니다. 메서드는 실행되지 않습니다.</span><code>HttpMessageNotReadableException</code></div><p class="first-request-controller-code__boundary">이 단계에서는 Controller와 요청 DTO만 구현합니다. Service 호출과 DB 저장은 아직 없습니다. import는 위 코드에 적힌 Spring Web·SLF4J 타입을 사용합니다. 1-2에서 응답을 상태 201과 JSON으로 바꾸기 전까지는 문자열을 그대로 반환합니다.</p></section>
</details>

<details>
<summary>DTO — JSON의 필드와 record 구성 요소</summary>
<section class="first-request-dto-code" aria-label="요청 JSON 필드를 PostCreateRequest record에 매핑"><p class="first-request-dto-code__intro">JSON 키와 <code>record</code> 구성 요소 이름을 맞추면 Spring이 요청 본문을 객체로 변환합니다.</p><div class="first-request-dto-code__mapping" aria-label="JSON 필드와 record 필드 매핑"><div><code>boardSlug</code><span aria-hidden="true">→</span><strong>String boardSlug</strong><small>게시판 주소 이름</small></div><div><code>title</code><span aria-hidden="true">→</span><strong>String title</strong><small>제목</small></div><div><code>content</code><span aria-hidden="true">→</span><strong>String content</strong><small>본문</small></div><div><code>tags</code><span aria-hidden="true">→</span><strong>List&lt;String&gt; tags</strong><small>태그 이름 배열</small></div><div><code>visibility</code><span aria-hidden="true">→</span><strong>String visibility</strong><small>PUBLIC 또는 FOLLOWERS</small></div></div><div class="first-request-dto-code__record"><header><strong>PostCreateRequest.java</strong><span>요청 DTO · record</span></header><pre><code class="language-java">import java.util.List;&#10;&#10;public record PostCreateRequest(&#10;    String boardSlug,&#10;    String title,&#10;    String content,&#10;    List&lt;String&gt; tags,&#10;    String visibility&#10;) { }</code></pre></div><div class="first-request-dto-code__access"><strong>Controller에서 꺼내기</strong><code>request.title()</code><span>record 접근자는 <code>getTitle()</code>이 아니라 <code>title()</code>입니다.</span></div><div class="first-request-dto-code__caution"><strong>변환과 검증은 다른 단계예요</strong><span>이 단계에는 Bean Validation을 붙이지 않습니다. JSON 문법 오류나 대상 타입으로 변환할 수 없는 값은 변환 실패로 400이 될 수 있습니다. 필드 이름이 어긋났다고 매번 400이라고 단정하지 말고, JSON 키와 record 이름을 맞춰 필요한 값을 받으세요.</span></div></section>
</details>

## CORS 열기
<section class="first-request-cors" aria-label="브라우저 CORS 요청 흐름과 서버 허용 설정"><p class="first-request-cors__eyebrow">브라우저 교차 출처 요청 · POST /api/posts</p><div class="first-request-cors__origins"><article><span>브라우저 · 학습 화면</span><strong>http://localhost:<b>3000</b></strong><small>화면 코드가 요청을 보냅니다</small></article><div class="first-request-cors__different"><strong>출처가 달라요</strong><span>포트가 다름</span><b aria-hidden="true">↔</b></div><article><span>Spring API 서버</span><strong>http://localhost:<b>8080</b></strong><small>게시글 API가 요청을 받습니다</small></article></div><p class="first-request-cors__definition">출처(origin)는 프로토콜·호스트·포트의 조합입니다. <code>localhost:3000</code>과 <code>localhost:8080</code>은 포트가 달라 다른 출처예요.</p><h3>JSON 요청은 먼저 허락을 확인해요</h3><ol class="first-request-cors__flow"><li><span class="first-request-cors__step">01</span><div><strong>브라우저가 OPTIONS preflight를 보냄</strong><code>OPTIONS /api/posts</code><small>Origin: http://localhost:3000 · Access-Control-Request-Method: POST · Access-Control-Request-Headers: content-type</small></div></li><li><span class="first-request-cors__step first-request-cors__step--green">02</span><div><strong>서버가 허용 헤더로 답함</strong><code>Access-Control-Allow-Origin: http://localhost:3000</code><small>Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS</small><small>이 요청의 Access-Control-Allow-Headers: content-type</small></div></li><li><span class="first-request-cors__step">03</span><div><strong>허락을 확인한 뒤 실제 POST 전송</strong><code>POST /api/posts</code><small>이 1-1 요청의 헤더는 Content-Type: application/json 입니다.</small></div></li></ol><div class="first-request-cors__blocked"><strong>허락 헤더가 없으면?</strong><span>preflight 응답에 <code>Access-Control-Allow-Origin</code>이 없으면 브라우저는 실제 <code>POST</code>를 보내지 않고 차단합니다. 서버가 OPTIONS에 200으로 답해도 허락 헤더가 빠지면 같은 결과입니다.</span></div><div class="first-request-cors__facts"><article><strong>CORS는 로그인이나 권한 검사가 아니에요</strong><p>브라우저가 다른 출처 응답을 페이지 코드에 보여 줄지 정하는 규칙입니다. 실제 인증·권한 처리는 서버가 따로 해야 합니다.</p></article><article><strong>Postman은 브라우저 CORS를 검사하지 않아요</strong><p>서버 응답 헤더를 직접 확인할 수 있어도, 브라우저가 응답을 읽을 수 있는지는 브라우저에서 확인해야 합니다.</p></article></div><h3>서버에서 허용할 범위</h3><div class="first-request-cors__settings" role="list" aria-label="CorsConfig 설정과 이유"><div role="listitem"><strong>경로</strong><code>/api/&#42;&#42;</code><small>API만 열고 <code>/hello</code> 같은 경로는 그대로 둡니다.</small></div><div role="listitem"><strong>allowedOriginPatterns</strong><code>http&#58;//localhost:&#91;&#42;&#93;</code><code>http&#58;//127.0.0.1:&#91;&#42;&#93;</code><small>로컬 화면의 포트가 달라도 허용합니다. 배포 뒤에는 배포한 화면 주소를 추가합니다.</small></div><div role="listitem"><strong>allowedMethods</strong><code>GET · POST · PUT · PATCH · DELETE · OPTIONS</code><small>기본은 GET·HEAD·POST뿐이라 이후 PATCH·DELETE 단계가 preflight에서 막힐 수 있습니다.</small></div><div role="listitem"><strong>allowedHeaders</strong><code>Content-Type · Authorization · X-Client</code><small><code>X-Client</code>는 0-3 설정을 유지하고, <code>Authorization</code>은 1-6부터 사용합니다.</small></div><div role="listitem"><strong>exposedHeaders</strong><code>Location · WWW-Authenticate</code><small>브라우저 코드에서 읽을 응답 헤더입니다. 1-2와 1-6의 헤더 확인에 필요합니다. Postman은 이 제한을 받지 않습니다.</small></div></div><p class="first-request-cors__existing">0장에서 <code>CorsConfig</code>를 만들었다면 기존 설정을 유지하고 필요한 값을 합치세요. 구현은 <code>org.example</code> 아래 설정 클래스에서 <code>WebMvcConfigurer</code>의 <code>addCorsMappings</code>를 재정의합니다. Spring Framework 7.0(Spring Boot 4.1)의 <code>addMapping</code> 기본값을 기준으로 설명합니다.</p><aside class="first-request-cors__interceptor"><strong>1-6 토큰 인터셉터 주의</strong><span><code>OPTIONS</code> preflight에는 토큰이 없습니다. 인터셉터가 이를 차단하면 브라우저는 CORS 실패처럼 보입니다. 인터셉터 맨 앞에서 <code>CorsUtils.isPreFlightRequest(request)</code>가 true이면 통과시키세요.</span></aside></section>

## 직접 확인
<section class="first-request-check" aria-label="브라우저 요청 실행과 CORS 수동 확인 순서"><p class="first-request-check__intro">서버 주소를 확인하고 기존 요청 패널에서 A와 B를 실행하세요. 아래 요청 버튼과 실제 응답 패널은 그대로 사용합니다.</p><ol class="first-request-check__steps"><li><span>01</span><div><strong>서버 주소 확인</strong><p>페이지 상단의 <b>내 서버 주소</b>가 실행 중인 API 주소인지 확인합니다.</p></div></li><li><span>02</span><div><strong>브라우저에서 A → B 실행</strong><p>A는 정상 JSON 요청입니다. 브라우저 Network에서 <code>OPTIONS /api/posts</code> 뒤에 <code>POST /api/posts</code>가 보이는지 확인하세요. B는 깨진 JSON 요청입니다.</p></div></li><li><span>03</span><div><strong>예상 결과와 실제 응답 비교</strong><p>A의 기대값은 <code>200</code> + 본문 <code>success</code>, B는 <code>400</code>입니다. 실행 전 예상값과 실행 뒤 실제 응답을 구분해 확인합니다. 실제 결과는 요청을 보낸 뒤 응답 패널에 표시됩니다.</p></div></li></ol><div class="first-request-check__browser-note"><strong>브라우저가 막으면</strong><span>“CORS로 막혔어요”가 뜨면 Network에서 preflight 응답의 <code>Access-Control-Allow-Origin</code>을 확인하고 <a href="#cors-열기">CORS 설정</a>으로 돌아가세요.</span></div></section>

```check
{
  "requests": [
    {
      "id": "A",
      "title": "정상 요청",
      "method": "POST",
      "path": "/api/posts",
      "body": {
        "boardSlug": "dev",
        "title": "[채점] 첫 게시글",
        "content": "Spring Boot로 만든 첫 게시글입니다.",
        "tags": [
          "spring",
          "jpa"
        ],
        "visibility": "PUBLIC"
      }
    },
    {
      "id": "B",
      "title": "깨진 JSON",
      "method": "POST",
      "path": "/api/posts",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": "{\"title\": \"[채점] 깨짐\""
    }
  ],
  "checks": [
    {
      "id": "C1",
      "request": "A",
      "expect": {
        "status": 200,
        "bodyText": {
          "equals": "success"
        }
      }
    },
    {
      "id": "C2",
      "request": "B",
      "expect": {
        "status": 400
      }
    },
    {
      "id": "C3",
      "manual": "CORS preflight — 브라우저 코드는 Origin·Access-Control-Request-Method를 직접 못 붙인다. Postman 요청 C에 Access-Control-Request-Headers: content-type, authorization을 넣고 200, Access-Control-Allow-Origin: http://localhost:3000, Allow-Methods에 PATCH, Allow-Headers에 authorization이 있는지 본다"
    },
    {
      "id": "C4",
      "manual": "노출 헤더 — 브라우저 코드는 Access-Control-* 응답 헤더를 못 읽는다. Postman 요청 D로 Access-Control-Allow-Origin: http://localhost:3000, Access-Control-Expose-Headers에 Location·WWW-Authenticate가 있는지 본다"
    }
  ]
}
```

<section class="first-request-check__manual" aria-label="Postman에서만 확인하는 C3와 C4"><div class="first-request-check__manual-heading"><span>수동 확인 · Postman</span><p>브라우저 코드에서는 Origin과 preflight 요청 헤더를 직접 설정할 수 없어 C3·C4는 Postman에서 확인합니다.</p></div><article><strong>C3 · 요청 C · preflight</strong><p><code>OPTIONS /api/posts</code> 요청에 <code>Origin: http://localhost:3000</code>, <code>Access-Control-Request-Method: POST</code>, <code>Access-Control-Request-Headers: content-type, authorization</code>를 붙입니다. 기대값: <code>200</code>, <code>Access-Control-Allow-Origin: http://localhost:3000</code>, 허용 메서드에 <code>PATCH</code>, 허용 헤더에 <code>authorization</code>.</p></article><article><strong>C4 · 요청 D · 노출 헤더</strong><p>요청 A에 <code>Origin: http://localhost:3000</code>을 붙여 POST로 보냅니다. 기대값: <code>200</code>, 같은 allow-origin, <code>Access-Control-Expose-Headers</code>에 <code>Location</code>과 <code>WWW-Authenticate</code>.</p></article></section>

## 채점 기준
<section class="first-request-rubric" aria-label="필수 HTTP 확인 C1부터 C4와 피드백용 코드 리뷰 R1부터 R3"><div class="first-request-rubric__header"><p>C1–C4는 필수 HTTP 확인입니다. R1–R3는 코드 리뷰 피드백이며 통과·실패 판정에 넣지 않습니다.</p><aside>실행하기 전 기대값을 읽고, 요청을 보낸 뒤 실제 응답과 비교하세요.</aside></div><div class="first-request-rubric__columns"><section class="first-request-rubric__http" aria-label="필수 HTTP 확인"><h3>HTTP 확인 · 필수</h3><article><span>C1</span><div><strong>정상 요청 · A</strong><code>POST /api/posts</code><p>기대: 상태 <b>200</b>, 본문이 정확히 <code>success</code></p></div></article><article><span>C2</span><div><strong>깨진 JSON · B</strong><code>POST /api/posts</code><p>기대: 상태 <b>400</b></p></div></article><article><span>C3</span><div><strong>CORS preflight · 요청 C</strong><code>OPTIONS /api/posts</code><p>기대: 상태 <b>200</b>, <code>Access-Control-Allow-Origin: http://localhost:3000</code>; 허용 메서드에 <code>PATCH</code>, 허용 헤더에 <code>authorization</code></p><small>Origin·Access-Control-Request-Method 등은 Postman에서 지정합니다.</small></div></article><article><span>C4</span><div><strong>Origin 포함 요청 · D</strong><code>POST /api/posts</code><p>기대: 상태 <b>200</b>, 같은 allow-origin, <code>Access-Control-Expose-Headers</code>에 <code>Location</code>·<code>WWW-Authenticate</code></p><small>요청 A에 Origin: http://localhost:3000을 붙여 확인합니다.</small></div></article></section><section class="first-request-rubric__review" aria-label="피드백용 코드 리뷰"><h3>코드 리뷰 · 피드백용</h3><article><span>R1</span><div><strong>Controller 매핑</strong><p><code>@RestController</code>에서 <code>POST /api/posts</code>를 받는지 확인합니다. 메서드의 <code>@PostMapping</code> 또는 클래스의 <code>@RequestMapping("/api/posts")</code>와 메서드의 <code>@PostMapping</code> 조합이 가능합니다.</p><pre><code>@PostMapping("/api/posts")</code></pre></div></article><article><span>R2</span><div><strong>전용 요청 DTO</strong><p><code>@RequestBody PostCreateRequest</code>로 받고, DTO 필드명이 JSON 키와 같은지 봅니다. <code>Map</code>이나 <code>String</code>으로 직접 받지 않습니다.</p><pre><code>String boardSlug, String title,&#10;String content, List&lt;String&gt; tags,&#10;String visibility</code></pre></div></article><article><span>R3</span><div><strong>SLF4J 제목 로그</strong><p>받은 제목을 SLF4J로 기록하고 자리표시자 <code>{}</code>를 사용합니다. <code>System.out.println</code>은 사용하지 않습니다.</p><pre><code>log.info("게시글 작성 요청: {}", request.title());</code></pre></div></article></section></div><ol class="first-request-rubric__compare" aria-label="응답 확인 순서"><li><b>1</b><span>요청 보내기</span></li><li><b aria-hidden="true">→</b></li><li><b>2</b><span>실제 응답 확인</span></li><li><b aria-hidden="true">→</b></li><li><b>3</b><span>기대값과 비교</span></li></ol></section>

## 필요한 지식

- [W01 API 하나 만들 때 실제 작업 순서](../../docs/knowledge/W01-api-dev-order.md) — 지금 어디부터 만드는지 감 잡기
- [P03 애노테이션 — 웹 매핑과 입력 위치](../../docs/knowledge/P03-annotations-cheatsheet.md#23-웹-매핑과-입력-위치) — `@RestController`, `@PostMapping`, `@RequestBody`
- [P16 JSON·Jackson — `@RequestBody`가 동작하는 지점](../../docs/knowledge/P16-json-jackson-practical.md#22-requestbody가-동작하는-지점) — JSON이 객체가 되는 과정과 400이 나는 이유
- [P16 — 요청과 응답은 DTO로 고정한다](../../docs/knowledge/P16-json-jackson-practical.md#21-요청과-응답은-dto로-고정한다)
- [W07 왜 System.out.println 대신 로거를 쓰나](../../docs/knowledge/W07-why-logger.md)
- [D11 웹 보안 기초 — Origin과 CORS](../../docs/knowledge/D11-web-security-basics.md#31-요청-경계-https-origin-cors) — 같은 출처 정책, preflight, CORS가 인증이 아닌 이유

## 힌트 (막힐 때만)

<details>
<summary>힌트 1 — 어떤 파일을 만들까</summary>
<section class="first-request-hint-files" aria-label="게시글 기능 파일을 만드는 세 단계"><p>기존 <code>HelloController</code>를 살펴본 뒤 같은 애플리케이션 안에 게시글 전용 패키지와 파일을 더합니다.</p><ol><li><span>1</span><div><strong>기존 파일 살펴보기</strong><code>HelloController.java</code><small>패키지와 Controller 구조를 참고합니다.</small></div></li><li><span>2</span><div><strong>기능 패키지 만들기</strong><code>src/main/java/org/example/post/</code><small>게시글 기능의 파일을 한곳에 둡니다.</small></div></li><li><span>3</span><div><strong>두 파일 추가</strong><code>PostController.java</code><code>PostCreateRequest.java</code><small>요청을 받을 Controller와 요청 record부터 만듭니다.</small></div></li></ol><aside><strong>이번 단계 범위</strong><span>Service나 Repository는 아직 만들지 않습니다.</span></aside></section>
</details>

<details>
<summary>힌트 2 — 본문을 객체로 받기</summary>
<section class="first-request-hint-request" aria-label="요청 본문이 Controller 매개변수가 되는 과정"><p>메서드 매개변수의 <code>@RequestBody</code>가 Spring에 JSON 본문을 어떤 Java 타입으로 바꿀지 알려 줍니다.</p><ol><li><span>요청 JSON · 5개 필드</span><pre><code>{"boardSlug":"dev","title":"[채점] 첫 게시글","content":"Spring Boot로 만든 첫 게시글입니다.","tags":["spring","jpa"],"visibility":"PUBLIC"}</code></pre></li><li><span>@RequestBody가 붙은 매개변수</span><code>PostCreateRequest request</code></li><li><span>record 구성 요소</span><code>String title</code></li><li><span>Controller에서 읽기</span><code>request.title()</code></li></ol><div class="first-request-hint-request__return"><strong>반환 타입이 String이면</strong><span><code>@RestController</code>에서 반환한 문자열이 HTTP 응답 본문으로 전달됩니다.</span></div><div class="first-request-hint-request__caution"><strong>이름과 타입을 함께 확인</strong><span>JSON 필드명과 record 이름을 맞추세요. 문법 오류나 호환되지 않는 타입으로 본문 변환이 실패하면 Controller 실행 전에 400이 될 수 있습니다. 이 단계에서는 Bean Validation을 적용하지 않습니다.</span></div></section>
</details>

<details>
<summary>힌트 3 — SLF4J 로거</summary>
<section class="first-request-hint-logger" aria-label="명시적 SLF4J와 Lombok 로거 선택"><p><code>log.info(...)</code>를 호출하기 전에 <code>log</code>라는 로거 인스턴스가 필요합니다.</p><div class="first-request-hint-logger__ways"><article><header><span>이 레포의 기본 예제</span><strong>직접 선언</strong></header><pre><code class="language-java">import org.slf4j.Logger;&#10;import org.slf4j.LoggerFactory;&#10;&#10;private static final Logger log =&#10;    LoggerFactory.getLogger(PostController.class);&#10;&#10;log.info("게시글 작성 요청: {}", request.title());</code></pre><p>로거 필드가 어디서 오는지 코드에서 확인할 수 있습니다.</p></article><article><header><span>기존 프로젝트 관례가 있으면</span><strong>Lombok 선택</strong></header><pre><code class="language-java">import lombok.extern.slf4j.Slf4j;&#10;&#10;@Slf4j&#10;public class PostController { ... }</code></pre><p><code>@Slf4j</code>가 컴파일할 때 같은 이름의 <code>log</code> 필드를 생성하므로 직접 선언과 import를 생략합니다.</p></article></div><aside><strong>두 방식은 모두 SLF4J 로깅입니다.</strong><span>이 학습 레포는 명시적 필드 선언을 기본으로 사용합니다. 기존 코드가 <code>@Slf4j</code>를 쓰면 그 관례를 따르면 됩니다. <code>System.out.println</code> 대신 로거를 사용하세요.</span></aside></section>
</details>

<details>
<summary>힌트 4 — CORS 설정 코드</summary>
<section class="first-request-hint-cors" aria-label="CorsConfig 코드와 설정값"><p>브라우저가 학습 화면에서 API 서버를 호출할 수 있도록 <code>org.example</code> 아래 설정 클래스를 둡니다.</p><div class="first-request-hint-cors__grid"><div class="first-request-hint-cors__editor"><header><strong>org.example.config.CorsConfig</strong><span>Spring MVC 설정</span></header><pre><code class="language-java">package org.example.config;&#10;&#10;import org.springframework.context.annotation.Configuration;&#10;import org.springframework.web.servlet.config.annotation.CorsRegistry;&#10;import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;&#10;&#10;@Configuration&#10;public class CorsConfig implements WebMvcConfigurer {&#10;    @Override&#10;    public void addCorsMappings(CorsRegistry registry) {&#10;        registry.addMapping("/api/&#42;&#42;")&#10;            .allowedOriginPatterns("http&#58;//localhost:&#91;&#42;&#93;", "http&#58;//127.0.0.1:&#91;&#42;&#93;")&#10;            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")&#10;            .allowedHeaders("Content-Type", "Authorization", "X-Client")&#10;            .exposedHeaders("Location", "WWW-Authenticate");&#10;    }&#10;}</code></pre></div><div class="first-request-hint-cors__settings"><article><strong>경로</strong><code>/api/&#42;&#42;</code></article><article><strong>허용 출처 패턴</strong><code>http&#58;//localhost:&#91;&#42;&#93;</code><code>http&#58;//127.0.0.1:&#91;&#42;&#93;</code></article><article><strong>허용 메서드</strong><code>GET · POST · PUT · PATCH · DELETE · OPTIONS</code></article><article><strong>허용 요청 헤더</strong><code>Content-Type · Authorization · X-Client</code></article><article><strong>브라우저에 노출할 응답 헤더</strong><code>Location · WWW-Authenticate</code></article></div></div><aside><strong>적용할 때 확인하세요</strong><span><code>allowedOrigins("&#42;")</code>로 모두 열지 않습니다. 0장에서 만든 설정이 있다면 <code>X-Client</code> 허용을 포함해 유지하세요. 코드를 수정한 뒤에는 앱을 다시 띄워 반영합니다.</span></aside></section>
</details>

## 다음 단계

[1-2. DB에 저장하고 201로 응답](1-2-dto-response.md) — `success` 대신 받은 글을 DB에 저장하고, 저장된 글을 JSON으로 돌려준다. 그러면 이 단계의 채점(C1)은 실패하게 되는데, 정상이다.
