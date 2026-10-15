# P02. MVC 패턴과 계층형 구조 — Controller·Service·Repository

<section class="p02-visual" aria-labelledby="p02-visual-title">
  <div class="p02-visual-heading">
    <p class="p02-kicker">01 · 한 게시글로 보는 MVC</p>
    <div class="p02-visual-title" id="p02-visual-title" role="heading" aria-level="2">MVC는 무엇을 나누는 걸까요?</div>
    <p>같은 게시글도 <strong>데이터</strong>, <strong>보이는 모습</strong>, <strong>사용자 행동</strong>은 서로 다른 역할입니다.</p>
    <p class="p02-example-note">게시글·작성자·숫자와 PATCH 경로는 모두 역할 설명용 예시입니다. 실제 API 계약이나 DB 조회 결과가 아닙니다.</p>
  </div>
  <div class="p02-post-scene" aria-label="게시글 데이터와 화면, 수정 요청을 각 MVC 역할에 연결한 예시">
    <article class="p02-role p02-model">
      <span class="p02-role-index">01</span>
      <h3>Model</h3>
      <p>화면에 보여줄 게시글 데이터와 상태</p>
      <pre><code>{
  "title": "첫 글",
  "author": "김자바"
}</code></pre>
    </article>
    <article class="p02-post-card">
      <div class="p02-post-meta"><span>자바 이야기</span><span>예시 데이터</span></div>
      <h3>첫 글</h3>
      <p class="p02-author">김자바 · 2026. 10. 15.</p>
      <p class="p02-post-body">Spring MVC의 역할을 데이터와 화면으로 나눠 봅니다.</p>
      <div class="p02-post-actions"><span>♡ 5</span><span>댓글 2</span><span class="p02-edit-action">수정 요청 →</span></div>
    </article>
    <div class="p02-role-stack">
      <article class="p02-role p02-controller">
        <span class="p02-role-index">02</span>
        <h3>Controller</h3>
        <p>HTTP 요청을 받아 알맞은 동작에 연결</p>
        <code>PATCH /api/posts/42</code>
      </article>
      <article class="p02-role p02-view">
        <span class="p02-role-index">03</span>
        <h3>View</h3>
        <p>Model 데이터를 사용자에게 보이는 형태로 표현</p>
        <div class="p02-browser-preview" aria-hidden="true"><i></i><i></i><i></i><b></b><b></b></div>
      </article>
    </div>
  </div>
  <div class="p02-change-scene">
    <div>
      <p class="p02-kicker">같은 데이터, 바뀐 값</p>
      <h3>제목을 수정하면?</h3>
      <div class="p02-value-change"><code>"첫 글"</code><span aria-hidden="true">→</span><code>"수정한 글"</code></div>
    </div>
    <div>
      <p class="p02-kicker">화면은 데이터를 표현</p>
      <h3>Model이 바뀌면 화면의 제목도 바뀝니다</h3>
      <div class="p02-title-change"><span>첫 글</span><span aria-hidden="true">→</span><strong>수정한 글</strong></div>
    </div>
  </div>
  <div class="p02-response-compare">
    <div class="p02-compare-title"><p class="p02-kicker">Spring MVC의 응답 경로</p><h3>화면을 그릴지, JSON 데이터를 보낼지 선택합니다</h3></div>
    <article class="p02-response-card p02-html">
      <h4>HTML 화면</h4><span class="p02-response-badge">Model + View</span>
      <p>Controller가 화면에 필요한 Model을 준비하고, View 기술이 HTML을 렌더링합니다.</p>
      <code>Model → Thymeleaf → HTML</code>
    </article>
    <article class="p02-response-card p02-json">
      <h4>JSON API</h4><span class="p02-response-badge">응답 DTO</span>
      <p>응답 객체는 메시지 변환기가 JSON 본문으로 직렬화합니다. 서버가 HTML View를 렌더링하는 경로는 거치지 않습니다.</p>
      <code>응답 DTO → HttpMessageConverter → JSON</code>
    </article>
  </div>
  <div class="p02-boundary">
    <h3>MVC와 Controller · Service · Repository는 서로 다른 분류입니다</h3>
    <div class="p02-boundary-columns">
      <div><p class="p02-kicker">웹 표현을 보는 MVC 관점</p><div class="p02-pills"><span>Model</span><span>View</span><span>Controller</span></div></div>
      <div><p class="p02-kicker">애플리케이션 책임을 나누는 계층 관점</p><div class="p02-pills p02-layer-pills"><span>Controller<br><small>HTTP 경계</small></span><span>Service<br><small>유스케이스·규칙</small></span><span>Repository<br><small>저장소 접근</small></span></div></div>
    </div>
    <p class="p02-boundary-note">둘은 일부 이름이 겹쳐도 같은 목록이 아닙니다. Spring MVC Controller가 계층 구조의 Controller 역할도 맡을 수 있습니다.</p>
  </div>
  <details class="p02-check">
    <summary>직접 확인: 제목을 바꾸는 기능에서 View와 Repository 중 무엇을 바꿀까요?</summary>
    <p><strong>화면 표시 방식만 바꾼다면 View 쪽을 확인합니다.</strong> 저장 위치나 조회 방식만 바꾼다면 Repository 쪽을 확인합니다. 실제 업무 규칙은 Service가 맡으며, Controller는 HTTP 요청을 연결합니다.</p>
  </details>
</section>

> MVC는 HTTP 요청과 응답을 다루는 표현 계층의 방식이다.  
> Controller는 HTTP 경계를, Service는 유스케이스와 업무 규칙을, Repository는 저장소 접근을 맡긴다.  
> 요청·응답 DTO와 내부 도메인 객체를 분리하고, Controller → Service → Repository 방향을 지킨다.

## 1. 한 줄로 말하면

Spring MVC는 Servlet 기반 웹 프레임워크에서 HTTP 요청을 Controller에 연결해 HTML 뷰를 렌더링하거나 응답 본문을 만드는 구조다. MVC의 Model·View·Controller와 애플리케이션의 Controller·Service·Repository는 서로 다른 분류다. Controller·Service·Repository는 기능을 나누는 계층형 구조이며, 웹 요청이 업무 로직과 저장소 코드에 뒤섞이지 않도록 경계를 둔다.

이 경계를 놓치면 파라미터 검증, 업무 규칙, DB 코드가 Controller 하나에 몰린다. 같은 규칙을 다른 API에서 복사하다 동작이 달라지고, JSON에 DB Entity를 그대로 노출해 내부 필드가 계약에 새거나 순환 참조·지연 로딩 오류가 생긴다. 작은 기능을 만들 때부터 각 계층에 한 가지 책임을 두면 변경할 위치가 분명해진다.

## 2. 당장 알아야 할 것

아래 코드는 설명용 발췌이며 미실행이다.

### 2.1 MVC란

Model은 View에 전달할 데이터, View는 HTML 등의 표현, Controller는 요청 처리 연결을 맡는다. MVC의 Model은 Repository를 뜻하지 않는다. Spring MVC는 화면과 JSON API 모두 처리한다.

### 2.2 화면과 REST 응답

`@Controller`의 `return "hello"`는 뷰 이름이고, `@RestController`에서 반환한 객체는 HTTP 본문으로 변환된다. Thymeleaf 화면은 `Model`에 데이터를 담고, REST는 응답 DTO를 반환한다.

### 2.3 MVC와 계층형 구조

Spring MVC는 웹 처리 프레임워크다. Controller·Service·Repository는 책임을 나누는 계층이므로 REST API도 이 구조를 쓸 수 있다. 기본 호출 방향은 Controller → Service → Repository다.

### 2.4 Controller

<section class="p02-topic-visual p02-controller-scene" aria-label="POST 요청이 Controller를 거쳐 응답되는 흐름">
<p class="p02-topic-kicker">2.4 · 요청을 받는 경계</p>
<p class="p02-topic-lead"><code>POST /api/memos</code>의 JSON은 <code>MemoCreateRequest</code>로 변환되어 Controller에 도착합니다. Controller는 Service를 호출하고 <code>201 Created</code>와 응답 DTO를 돌려줍니다.</p>
<div class="p02-controller-flow" role="group" aria-label="JSON 요청에서 201 JSON 응답까지">
<article class="p02-flow-card p02-flow-client"><span class="p02-flow-step">01 · 클라이언트</span><strong>POST /api/memos</strong><code>{ title, content }</code><small>Content-Type: application/json</small></article>
<span class="p02-flow-arrow" aria-hidden="true">→</span>
<article class="p02-flow-card p02-flow-request"><span class="p02-flow-step">02 · 요청 객체</span><strong>MemoCreateRequest</strong><code>title · content</code><small>Spring이 JSON을 객체로 변환</small></article>
<span class="p02-flow-arrow" aria-hidden="true">→</span>
<article class="p02-flow-card p02-flow-controller"><span class="p02-flow-step">03 · HTTP 경계</span><strong>MemoController</strong><code>service.create(request)</code><small>경로 매핑 · 입출력 연결</small></article>
<span class="p02-flow-arrow" aria-hidden="true">→</span>
<article class="p02-flow-card p02-flow-service"><span class="p02-flow-step">04 · 업무 처리</span><strong>MemoService</strong><code>create(request)</code><small>저장 요청과 응답 DTO 변환</small></article>
<span class="p02-flow-arrow" aria-hidden="true">→</span>
<article class="p02-flow-card p02-flow-response"><span class="p02-flow-step">05 · HTTP 응답</span><strong>201 Created</strong><code>{ id, title, content }</code><small>MemoResponse JSON</small></article>
</div>
<div class="p02-controller-code-grid"><div><p class="p02-topic-label">Controller의 역할</p><ul class="p02-role-list"><li>경로와 HTTP 메서드를 매핑합니다.</li><li>요청 DTO를 받아 Service에 전달합니다.</li><li>상태 코드와 응답 DTO를 정합니다.</li><li>업무 규칙과 SQL은 여기에 두지 않습니다.</li></ul></div><div><p class="p02-topic-label">실제 예제 코드 · 3.4 발췌</p><pre><code class="language-java">@PostMapping
public ResponseEntity&lt;MemoResponse&gt; create(
        @RequestBody MemoCreateRequest request) {
    MemoResponse created = service.create(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
}</code></pre></div></div>
</section>

### 2.5 Service

<section class="p02-topic-visual p02-service-scene" aria-label="MemoService의 메모 생성 유스케이스">
<p class="p02-topic-kicker">2.5 · 요청 하나를 유스케이스로 처리</p>
<p class="p02-topic-lead">현재 예제의 <code>create</code>는 요청 값을 저장소에 전달하고, 저장된 <code>Memo</code>를 <code>MemoResponse</code>로 바꿉니다. 공통 업무 규칙이 필요해지면 그 판단을 Service에 추가합니다.</p>
<div class="p02-service-flow" role="group" aria-label="입력 받기, 저장 요청, 응답 DTO 변환의 세 단계">
<article class="p02-service-step"><span>01 · 요청 받기</span><strong>MemoCreateRequest</strong><code>title · content</code><small>Controller가 전달</small></article>
<span class="p02-flow-arrow" aria-hidden="true">→</span>
<article class="p02-service-step p02-service-action"><span>02 · 저장 요청</span><strong>repository.save(...)</strong><code>request.title(), request.content()</code><small>Repository 계약 호출</small></article>
<span class="p02-flow-arrow" aria-hidden="true">→</span>
<article class="p02-service-step"><span>03 · 응답으로 변환</span><strong>toResponse(saved)</strong><code>MemoResponse</code><small>저장된 id · title · content</small></article>
</div>
<div class="p02-service-code-grid"><div><p class="p02-topic-label">실제 코드 · MemoService.create</p><pre><code class="language-java">public MemoResponse create(MemoCreateRequest request) {
    Memo saved = repository.save(request.title(), request.content());
    return toResponse(saved);
}
private MemoResponse toResponse(Memo memo) {
    return new MemoResponse(memo.id(), memo.title(), memo.content());
}</code></pre></div><aside class="p02-service-note"><strong>현재 예제의 범위</strong><span>지금 구현은 간단한 저장과 DTO 변환입니다. 유효성·중복 검사처럼 여러 진입점에서 함께 적용할 업무 판단은 필요해질 때 Service에 둘 수 있습니다. 현재 코드에 해당 규칙이나 스케줄러, DB는 구현되어 있지 않습니다.</span></aside></div>
</section>

### 2.6 Repository

<section class="p02-topic-visual p02-repository-scene" aria-label="MemoRepository 계약과 인메모리 구현의 저장 및 조회 흐름">
<p class="p02-topic-kicker">2.6 · 저장과 조회를 맡는 경계</p>
<p class="p02-topic-lead">Repository는 저장·조회 계약을 제공하고 구현을 감춥니다. 이 예제는 DB 쿼리 대신 <code>ConcurrentHashMap</code>에 보관하므로 앱을 다시 시작하면 데이터가 사라집니다.</p>
<div class="p02-repository-flows" role="group" aria-label="save 저장 흐름과 findAll 조회 흐름">
<article class="p02-repository-flow p02-repository-save"><header><span class="p02-repo-number">01</span><div><strong>저장 · save</strong><small>Service가 계약을 호출하고 인메모리 구현이 ID를 붙여 보관</small></div></header><div class="p02-repo-path"><span>MemoService</span><b aria-hidden="true">→</b><code>MemoRepository.save(String title, String content)</code><b aria-hidden="true">→</b><span>AtomicLong로 id 생성</span><b aria-hidden="true">→</b><code>new Memo(id, title, content)</code><b aria-hidden="true">→</b><span>ConcurrentHashMap에 저장</span></div><pre><code class="language-java">long id = sequence.incrementAndGet();
Memo memo = new Memo(id, title, content);
memos.put(id, memo);
return memo;</code></pre></article>
<article class="p02-repository-flow p02-repository-find"><header><span class="p02-repo-number">02</span><div><strong>전체 조회 · findAll</strong><small>저장된 값을 id 오름차순으로 정렬해 목록 반환</small></div></header><div class="p02-repo-path"><span>MemoService</span><b aria-hidden="true">→</b><code>MemoRepository.findAll()</code><b aria-hidden="true">→</b><span>Map 값 모으기</span><b aria-hidden="true">→</b><code>Memo::id 오름차순</code><b aria-hidden="true">→</b><span>List&lt;Memo&gt;</span></div><pre><code class="language-java">return memos.values().stream()
        .sorted(Comparator.comparingLong(Memo::id))
        .toList();</code></pre></article>
</div>
<div class="p02-repository-contract"><strong>인터페이스 계약</strong><code>Memo save(String title, String content);</code><code>List&lt;Memo&gt; findAll();</code><span><code>Memo</code>는 <code>record</code>라 변환할 때 <code>memo.title()</code>과 <code>memo.content()</code> 접근자를 사용합니다.</span></div>
<aside class="p02-repository-note"><strong>역할 경계</strong><span>Repository는 저장·조회만 담당합니다. 사용자가 메모를 만들거나 조회할 수 있는지 같은 업무 판단은 Service에 둡니다.</span></aside>
</section>

### 2.7 DTO와 Entity

<section class="p02-topic-visual p02-dto-scene" aria-label="요청 DTO, 내부 Memo 도메인 객체, 응답 DTO의 필드 비교">
<p class="p02-topic-kicker">2.7 · 경계마다 필요한 필드만 전달</p>
<p class="p02-topic-lead">요청 DTO는 입력을 제한하고 응답 DTO는 공개할 값을 고릅니다. 이 실습의 <code>Memo</code>는 JPA Entity가 아니라 메모리 저장소에서 쓰는 도메인 <code>record</code>입니다.</p>
<div class="p02-dto-flow" role="group" aria-label="title과 content 입력이 Memo에 저장된 뒤 id와 함께 응답되는 흐름">
<article class="p02-dto-card p02-dto-input"><span class="p02-flow-step">요청 DTO · 입력 허용</span><strong>MemoCreateRequest</strong><div class="p02-field-list"><span><b>title</b><small>입력 허용</small></span><span><b>content</b><small>입력 허용</small></span></div><code>record MemoCreateRequest(
    String title, String content) {}</code></article>
<span class="p02-flow-arrow" aria-hidden="true">→</span>
<article class="p02-dto-card p02-dto-domain"><span class="p02-flow-step">내부 도메인 객체 · InMemory</span><strong>Memo</strong><div class="p02-field-list"><span><b>id</b><small>저장 시 생성</small></span><span><b>title</b><small>내부 값</small></span><span><b>content</b><small>내부 값</small></span></div><code>record Memo(long id,
    String title, String content) {}</code></article>
<span class="p02-flow-arrow" aria-hidden="true">→</span>
<article class="p02-dto-card p02-dto-output"><span class="p02-flow-step">응답 DTO · 공개 필드</span><strong>MemoResponse</strong><div class="p02-field-list"><span><b>id</b><small>응답에 포함</small></span><span><b>title</b><small>응답에 포함</small></span><span><b>content</b><small>응답에 포함</small></span></div><code>record MemoResponse(long id,
    String title, String content) {}</code></article>
</div>
<div class="p02-mapping-strip"><span>request.title(), request.content()</span><b aria-hidden="true">→</b><span>repository.save(...)</span><b aria-hidden="true">→</b><span>new MemoResponse(id, title, content)</span></div>
<p class="p02-mapping-caption">이 예제는 Service에서 변환하며, 반복되는 변환은 Mapper로 분리할 수 있습니다.</p>
<aside class="p02-exposure-note"><strong>외부 Entity 직접 노출을 피하는 이유</strong><span>내부 필드가 API 응답에 섞이면 공개 계약이 의도치 않게 바뀔 수 있습니다. 요청에서 Entity를 그대로 받으면 허용하지 않은 필드까지 수정되는 대량 할당 위험이 생깁니다.</span></aside>
</section>

### 2.8 DTO에 `record`

<section class="p02-topic-visual p02-record-scene" aria-label="같은 데이터 구조를 일반 Java 클래스와 record로 표현하기">
<p class="p02-topic-kicker">2.8 · DTO를 선언하는 두 방식</p>
<p class="p02-topic-lead"><code>record</code>는 값 전달용 타입을 짧게 선언하는 방법이며 Java 16에서 정식화됐습니다(JEP 395). 컴포넌트 참조는 재할당할 수 없지만, 그 안에 든 객체까지 자동으로 깊은 불변이 되는 것은 아닙니다.</p>
<div class="p02-record-compare" role="group" aria-label="일반 클래스와 record 선언 비교">
<article class="p02-record-card p02-record-class"><header><strong>일반 클래스 · 별도 파일</strong><small>필드·생성자·접근자를 직접 선언</small></header><pre><code class="language-java">// MemoResponse.java
public class MemoResponse {
    private final long id;
    private final String title;
    public MemoResponse(long id, String title) {
        this.id = id;
        this.title = title;
    }
    public long id() { return id; }
    public String title() { return title; }
}</code></pre></article>
<article class="p02-record-card p02-record-record"><header><strong>record · 별도 파일</strong><small>같은 두 값을 간결하게 선언</small></header><pre><code class="language-java">// MemoResponse.java
public record MemoResponse(long id, String title) {}</code></pre><ul><li>생성자·접근자와 <code>equals</code>·<code>hashCode</code>·<code>toString</code>을 제공합니다.</li><li>컴포넌트 값은 생성 뒤 다시 대입할 수 없습니다.</li><li>값 전달 DTO를 간결하게 표현하기 좋습니다.</li></ul></article>
</div>
<p class="p02-record-class-note">상태 변경이 필요하면 일반 클래스로 가변 상태를 직접 설계할 수 있습니다. 비교용 클래스 예시는 같은 값들을 final 필드로 담았습니다.</p>
<div class="p02-record-json"><strong>Jackson 직렬화 개념 예시</strong><code>new MemoResponse(1, "첫 메모")</code><b aria-hidden="true">→</b><code>{ "id": 1, "title": "첫 메모" }</code><span>개념 예시이며, 현재 P02 실습의 <code>MemoResponse</code>는 <code>id · title · content</code> 세 필드를 가집니다.</span></div>
</section>

### 2.9 패키지 구조

<section class="p02-topic-visual p02-package-scene" aria-label="계층별과 기능별 패키지 구조 비교 및 컴포넌트 스캔 범위">
<p class="p02-topic-kicker">2.9 · 역할로 나누거나 기능으로 모으기</p>
<p class="p02-topic-lead">패키지는 정답 하나가 아니라 프로젝트와 팀 상황에 맞춰 고릅니다. 아래 기능별 예시는 실제 실습 경로인 <code>com.example.memo</code> 바로 아래에 역할별 하위 패키지를 둡니다.</p>
<div class="p02-package-compare" role="group" aria-label="계층별 및 기능별 패키지 구성의 장단점">
<article class="p02-package-card p02-package-layer"><header><strong>계층별 · 작은 프로젝트에 단순</strong><small>역할에 따라 파일을 모읍니다</small></header><ul class="p02-tree"><li><code>com.example.memo</code><ul><li><code>MemoApplication.java</code></li><li><code>controller/</code><ul><li><code>MemoController.java</code></li></ul></li><li><code>service/</code><ul><li><code>MemoService.java</code></li></ul></li><li><code>repository/</code><ul><li><code>MemoRepository.java</code></li><li><code>InMemoryMemo<wbr>Repository.java</code></li></ul></li></ul></li></ul><p>파일 수가 늘면 한 기능의 코드가 여러 폴더로 흩어질 수 있습니다.</p></article>
<article class="p02-package-card p02-package-feature"><header><strong>기능별 최상위 + 역할별 분리</strong><small>기능 관련 코드를 가까이 둡니다 · 이 실습의 구성</small></header><ul class="p02-tree"><li><code>com.example.memo</code><ul><li><code>MemoApplication.java</code></li><li><code>api/</code><ul><li><code>MemoController.java</code></li><li><code>MemoCreateRequest.java</code></li><li><code>MemoResponse.java</code></li></ul></li><li><code>application/</code><ul><li><code>MemoService.java</code></li></ul></li><li><code>domain/</code><ul><li><code>Memo.java</code></li></ul></li><li><code>repository/</code><ul><li><code>MemoRepository.java</code></li><li><code>InMemoryMemo<wbr>Repository.java</code></li></ul></li></ul></li></ul><p>기능 단위로 관련 파일을 찾고 함께 변경하기 편합니다.</p></article>
</div>
<aside class="p02-package-scan"><strong>컴포넌트 스캔 기준</strong><span><code>@SpringBootApplication</code>이 있는 <code>com.example.memo</code>에서 하위 패키지를 스캔합니다. 시작 클래스는 컴포넌트의 공통 상위 패키지에 두고 기본 패키지는 피합니다.</span></aside>
</section>

### 2.10 의존 방향

<section class="p02-topic-visual p02-dependency-scene" aria-label="생성자 주입으로 이어지는 Controller, Service, Repository 의존 방향">
<p class="p02-topic-kicker">2.10 · 한 방향으로 의존하고 생성자로 주입</p>
<p class="p02-topic-lead">요청 처리 의존성은 <code>Controller → Service → Repository</code>로 흐릅니다. Spring이 등록된 구현체를 생성자에 전달해 각 클래스의 의존 관계를 드러냅니다.</p>
<div class="p02-dependency-flow" role="group" aria-label="Controller가 Service를, Service가 Repository 계약을 생성자 주입 받는 구조">
<article class="p02-dependency-card p02-dependency-controller"><span>@RestController</span><strong>MemoController</strong><code>MemoController(MemoService service)</code><small>Service를 생성자 주입 받음</small></article>
<span class="p02-dependency-arrow" aria-hidden="true">→</span>
<article class="p02-dependency-card p02-dependency-service"><span>@Service</span><strong>MemoService</strong><code>MemoService(MemoRepository repository)</code><small>Repository 인터페이스에 의존</small></article>
<span class="p02-dependency-arrow" aria-hidden="true">→</span>
<article class="p02-dependency-card p02-dependency-repository"><span>@Repository · 구현체</span><strong>InMemoryMemoRepository</strong><code>implements MemoRepository</code><small>Map 기반 저장소 구현</small></article>
</div>
<div class="p02-injection-note"><strong>Spring 컨테이너가 연결합니다</strong><span><code>MemoRepository</code> 인터페이스 자체를 만드는 것이 아닙니다. 등록된 <code>InMemoryMemoRepository</code> 구현 객체를 생성자 매개변수의 인터페이스 타입에 주입합니다.</span></div>
<div class="p02-dependency-code-grid"><article><p class="p02-topic-label">실제 생성자 · Controller / Service</p><pre><code class="language-java">public MemoController(MemoService service) {
    this.service = service;
}
public MemoService(MemoRepository repository) {
    this.repository = repository;
}</code></pre></article><article><p class="p02-topic-label">실제 저장소 구현</p><pre><code class="language-java">@Repository
public class InMemoryMemoRepository
        implements MemoRepository {
    private final ConcurrentHashMap&lt;Long, Memo&gt; memos
            = new ConcurrentHashMap&lt;&gt;();
}</code></pre></article></div>
<aside class="p02-dependency-warning"><strong>피할 구조</strong><span>구현체를 직접 <code>new</code> 하면 교체와 테스트 격리가 어려워집니다. 양쪽 클래스가 서로 부르는 순환 의존도 책임과 테스트 경계를 흐립니다.</span><span class="p02-cycle" aria-label="순환 의존 예시">Controller ↔ Service</span></aside>
</section>

## 3. 따라 하기

Java 25·Boot 4.1.1·Gradle Kotlin DSL 예제다. 메모리는 재시작하면 사라진다. MVC 연습용이며 Spring 코드 **(미실행)**.

### 3.1 프로젝트 만들기

[start.spring.io](https://start.spring.io)에서 Gradle - Kotlin, Java 25, Boot 4.1.1, Spring Web MVC를 선택해 `memo-demo`를 만든다. Boot 4 MVC 아티팩트는 `spring-boot-starter-webmvc`다. Maven은 같은 artifact를 dependency로 추가한다.

Initializr의 wrapper와 생성 파일을 유지하고 `build.gradle.kts` 핵심 설정을 확인한다.

```kotlin
plugins {
    java
    id("org.springframework.boot") version "4.1.1"
}

group = "com.example"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

repositories { mavenCentral() }

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-webmvc")
}
```

Maven 대응 의존성:

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-webmvc</artifactId>
</dependency>
```

**확인:** Gradle은 `./gradlew dependencies --configuration runtimeClasspath`, Maven은 `./mvnw dependency:tree`로 starter를 확인한다. (미실행)

### 3.2 패키지와 파일 만들기

```bash
mkdir -p src/main/java/com/example/memo/{api,application,domain,repository}
```

시작 클래스 `src/main/java/com/example/memo/MemoApplication.java`:

```java
package com.example.memo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(MemoApplication.class, args);
    }
}
```

도메인 값 `src/main/java/com/example/memo/domain/Memo.java`:

```java
package com.example.memo.domain;

public record Memo(long id, String title, String content) {}
```

요청 DTO `src/main/java/com/example/memo/api/MemoCreateRequest.java`:

```java
package com.example.memo.api;

public record MemoCreateRequest(String title, String content) {}
```

응답 DTO `src/main/java/com/example/memo/api/MemoResponse.java`:

```java
package com.example.memo.api;

public record MemoResponse(long id, String title, String content) {}
```

**확인:** 모든 package가 `com.example.memo` 아래인지 확인한다. 시작 클래스가 하위 컴포넌트 스캔의 기준이다.

### 3.3 저장소와 업무 계층 구현하기

`src/main/java/com/example/memo/repository/MemoRepository.java`:

```java
package com.example.memo.repository;

import com.example.memo.domain.Memo;
import java.util.List;

public interface MemoRepository {
    Memo save(String title, String content);
    List<Memo> findAll();
}
```

`src/main/java/com/example/memo/repository/InMemoryMemoRepository.java`:

```java
package com.example.memo.repository;

import com.example.memo.domain.Memo;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Repository;

@Repository
public class InMemoryMemoRepository implements MemoRepository {
    private final AtomicLong sequence = new AtomicLong();
    private final ConcurrentHashMap<Long, Memo> memos = new ConcurrentHashMap<>();

    @Override
    public Memo save(String title, String content) {
        long id = sequence.incrementAndGet();
        Memo memo = new Memo(id, title, content);
        memos.put(id, memo);
        return memo;
    }

    @Override
    public List<Memo> findAll() {
        return memos.values().stream()
                .sorted(Comparator.comparingLong(Memo::id))
                .toList();
    }
}
```

`src/main/java/com/example/memo/application/MemoService.java`:

```java
package com.example.memo.application;

import com.example.memo.api.MemoCreateRequest;
import com.example.memo.api.MemoResponse;
import com.example.memo.domain.Memo;
import com.example.memo.repository.MemoRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class MemoService {
    private final MemoRepository repository;

    public MemoService(MemoRepository repository) {
        this.repository = repository;
    }

    public MemoResponse create(MemoCreateRequest request) {
        Memo saved = repository.save(request.title(), request.content());
        return toResponse(saved);
    }

    public List<MemoResponse> findAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    private MemoResponse toResponse(Memo memo) {
        return new MemoResponse(memo.id(), memo.title(), memo.content());
    }
}
```

간결성을 위해 Service가 DTO 변환을 맡았다. 커지면 별도 Command/Query나 Mapper로 분리하되 Entity를 HTTP 응답으로 직접 노출하지 않는다.

**확인:** 구현에 `@Repository`, Service에 `@Service`가 있고 생성자에서 Repository를 받는지 본다. (미실행)

### 3.4 Controller에서 HTTP 입출력을 연결하기

`src/main/java/com/example/memo/api/MemoController.java`:

```java
package com.example.memo.api;

import com.example.memo.application.MemoService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/memos")
public class MemoController {
    private final MemoService service;

    public MemoController(MemoService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<MemoResponse> create(@RequestBody MemoCreateRequest request) {
        MemoResponse created = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public List<MemoResponse> findAll() {
        return service.findAll();
    }
}
```

`@RequestMapping`과 메서드 애노테이션을 조합해 두 URL을 처리한다. JSON POST 요청은 `Content-Type: application/json`으로 보낸다.

**확인:** `./gradlew bootRun` 또는 `./mvnw spring-boot:run` 후 로그의 기동 메시지와 8080 포트를 확인한다. (미실행)

### 3.5 curl로 요청 보내기

새 터미널에서 메모를 등록한다. 예상 응답은 `201 Created`와 id가 포함된 JSON이다.

```bash
curl -i -X POST http://localhost:8080/api/memos \
  -H 'Content-Type: application/json' \
  -d '{"title":"첫 메모","content":"계층을 나눴다"}'
```

목록 조회를 이어서 요청한다.

```bash
curl -i http://localhost:8080/api/memos
```

목록 본문은 등록된 DTO 배열이다. 재시작하면 데이터가 사라진다. **미실행: 응답은 코드 기준 예상값이다.**

### 3.6 같은 프로젝트에 Thymeleaf 화면 붙이기

HTML 렌더링을 위해 다음 의존성(또는 Maven의 같은 artifact)을 추가한다.

```kotlin
implementation("org.springframework.boot:spring-boot-starter-thymeleaf")
```

`src/main/java/com/example/memo/api/GreetingPageController.java`:

```java
package com.example.memo.api;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class GreetingPageController {
    @GetMapping("/hello")
    public String hello(Model model) {
        model.addAttribute("name", "Spring MVC");
        return "hello";
    }
}
```

`src/main/resources/templates/hello.html`:

```html
<!doctype html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org">
<head><meta charset="UTF-8"><title>인사</title></head>
<body><h1 th:text="|안녕하세요, ${name}!|">인사</h1></body>
</html>
```

**확인:** 서버에서 `/hello`를 열어 `안녕하세요, Spring MVC!`가 렌더링되는지 본다. (미실행)

## 4. 치트시트

| 이름 | 용도 | 예시 | 주의 |
|---|---|---|---|
| `@Controller` | 화면 라우팅 | `return "hello"` | 문자열은 뷰 이름 |
| `@RestController` | HTTP API | `return response` | 객체는 응답 본문 |
| `@GetMapping` | 조회 매핑 | `@GetMapping("/{id}")` | 경로를 요청과 맞춘다 |
| `@PostMapping` | 본문 요청 | `@PostMapping` | JSON은 Content-Type 지정 |
| `@RequestBody` | 본문 DTO 변환 | `create(RequestDto dto)` | Entity를 직접 받지 않는다 |
| `ResponseEntity<T>` | 상태·헤더·본문 | `status(201).body(dto)` | 필요한 경우 사용 |
| `@Service` | 업무 계층 빈 | `MemoService` | 업무 규칙을 둔다 |
| `@Repository` | 저장소 빈 | `MemoRepository` | 저장 접근을 맡긴다 |
| `record` | 값 DTO | `record Result(long id)` | 변경 가능한 상태에는 부적합 |
| `spring-boot-starter-webmvc` | Boot 4 MVC | Gradle `implementation(...)` | 화면은 Thymeleaf starter 추가 |

## 5. 자주 나는 에러와 해결

1. **`404 Not Found`** → URL·HTTP 메서드가 매핑과 다르다. `@RequestMapping`과 요청 주소를 대조한다.
2. **`415 Unsupported Media Type`** → 요청 형식을 표시하지 않았다. JSON 본문에 `Content-Type: application/json`을 보낸다.
3. **`No qualifying bean of type 'MemoRepository' available`** → 구현 빈이 없거나 스캔 범위 밖이다. 구현에 `@Repository`를 붙이고 시작 클래스를 루트 패키지에 둔다.
4. **`TemplateInputException: Error resolving template [hello]`** → Thymeleaf 의존성·템플릿 위치·뷰 이름 중 하나가 안 맞는다. `templates/hello.html`과 `return "hello"`를 확인한다.
5. **`@Controller`가 문자열을 뷰로 찾음** → 문자열을 응답 본문으로 생각했다. 본문이면 `@ResponseBody`나 `@RestController`를 쓴다.
6. **JSON 요청에 400 응답** → JSON 문법이나 DTO 필드 타입·이름이 맞지 않는다. 요청 본문과 record 선언을 비교하고 변환 오류 로그를 확인한다.
7. **`Port 8080 was already in use`** → 포트를 다른 프로세스가 사용한다. 기존 프로세스를 종료하거나 `server.port`를 바꾼다.

## 6. 한 단계 더

요청 매핑과 메시지 변환의 내부 순서는 → S05 참조. REST 자원·상태 코드 설계는 → S06, 여러 DB 변경을 원자 처리하는 방법은 → S08 참조. 여기서는 HTTP 경계를 Controller, 업무 판단을 Service, 데이터 접근을 Repository에 두고 도메인 객체를 HTTP 계약에 직접 노출하지 않는 원칙을 익힌다. 복잡한 도메인 의존이 생기면 포트·어댑터를 검토한다.

## 7. 자가점검 Q&A (면접 대비)

### Q1. MVC의 Model은 Repository와 같은 뜻인가?

아니다. Model은 View가 렌더링할 데이터이고 Repository는 저장소 접근 계층이다. JSON 응답 DTO가 Model의 일부 역할을 해도 Repository는 아니다.

**꼬리질문:** REST에 View가 없어도 Spring MVC인가?  
**답:** 그렇다. 요청 매핑은 Spring MVC가 처리하고 JSON은 메시지 변환기로 본문에 쓴다.

### Q2. `@Controller`와 `@RestController`의 반환값 차이는?

`@Controller`의 문자열은 보통 뷰 이름이다. 응답 본문 어노테이션이 적용되면 값을 본문으로 기록하며 `@RestController`는 이 동작을 기본 적용한다.

**꼬리질문:** `@Controller`에서 JSON을 반환하려면?  
**답:** 메서드에 `@ResponseBody`를 붙이거나 `@RestController`를 쓴다.

### Q3. 업무 규칙을 Controller에 넣으면 왜 문제가 되나?

HTTP 진입점에 규칙이 묶여 다른 진입 방식에서 재사용하기 어렵고 중복 규칙이 달라질 수 있다. 유스케이스 판단은 Service에 둔다.

**꼬리질문:** 한 줄짜리 Service도 항상 만들어야 하나?  
**답:** 기계적으로 늘릴 필요는 없다. 규칙·재사용 책임이 생기는 시점에 경계를 둔다.

### Q4. DTO와 Entity를 왜 분리하는가?

Entity를 요청으로 받으면 내부 필드를 외부에서 변경하는 대량 할당 위험이 있다. 응답으로 내보내면 내부 구조가 API 계약이 된다. DTO로 입출력 필드를 명시한다.

**꼬리질문:** 필드가 같아도 분리하는가?  
**답:** 공개 계약과 내부 모델의 변경 이유가 다르면 분리한다. 단순 매핑 비용과 독립성의 균형을 팀 기준으로 정한다.

### Q5. Repository에 업무 규칙을 두면 안 되는가?

Repository는 조회·저장 방식과 쿼리 책임을 갖고, 업무상 허용 여부는 Service가 판단한다. 저장소 제약은 데이터 무결성의 최종 방어로 함께 쓸 수 있다.

**꼬리질문:** 이메일 중복 가입을 막는다면?  
**답:** 중복 조회는 Repository, 가입 거절 결정은 Service, 동시 요청 보장은 DB unique 제약으로 처리한다.

### Q6. 계층별과 기능별 패키지 중 무엇을 선택할까?

작은 앱에선 계층별이 간단하지만 기능이 많아지면 한 기능의 코드가 흩어진다. 기능별 최상위 패키지 아래 역할을 나누는 구성을 기본값으로 삼는다.

**꼬리질문:** 기능 내부 계층은 항상 나눠야 하나?  
**답:** 작으면 생략할 수 있다. 책임이 섞이고 클래스가 늘 때 하위 패키지를 만든다.

### Q7. Repository 인터페이스를 Service 생성자로 받는 이유는?

Service를 저장소 구현에서 분리해 교체할 수 있고 생성자 주입이 의존성을 드러낸다. 구현 빈이 여러 개면 `@Primary`나 `@Qualifier` 등으로 선택을 명시한다.

**꼬리질문:** 구현을 직접 `new` 하면 어떤 비용이 있나?  
**답:** 구현 교체와 테스트 격리가 어려워지고 객체 생명주기를 컨테이너에 맡길 수 없다.

## 8. 참고문헌

- Spring Web MVC — https://docs.spring.io/spring-framework/reference/web/webmvc.html — Servlet 기반 Spring MVC 개요.
- Building a RESTful Web Service — https://spring.io/guides/gs/rest-service — JSON REST 가이드와 생성 절차.
- Serving Web Content with Spring MVC — https://spring.io/guides/gs/serving-web-content — Spring MVC 화면 가이드.
- Annotated Controllers — https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller.html — Controller 애노테이션 모델.
- Return Values — https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-methods/return-types.html — 본문 변환과 뷰 반환 규칙.
- View Technologies — https://docs.spring.io/spring-framework/reference/web/webmvc-view.html — Thymeleaf 등 뷰 기술.
- Servlet Web Applications — https://docs.spring.io/spring-boot/reference/web/servlet.html — Boot Servlet MVC 자동 구성.
- Web — https://docs.spring.io/spring-boot/reference/web/index.html — Boot MVC 스타터.
- Structuring Your Code — https://docs.spring.io/spring-boot/reference/using/structuring-your-code.html — 메인 클래스 및 패키지 구조 권장.
