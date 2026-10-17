/** 1-4: 컬럼 누락, 작성자 연관관계, 저장 결과와 기본값의 출처를 나눈다. */
export function renderCompletePostMappingJourney() {
  return `<section class="first-db-journey mapping-journey" data-mapping-screen="scenario" aria-label="1-4 엔티티와 post 테이블 맞추기">
    <article class="db-journey-screen mapping-screen" data-mapping-panel="scenario" aria-labelledby="mapping-scenario-title">
      <p class="db-journey-kicker">1-4 · 새 글의 발행 시각</p><p class="db-journey-quote">“방금 쓴 글인데 최신 목록 맨 뒤에 보여요.”</p>
      <h2 id="mapping-scenario-title">새 글의 발행 시각과 상태를 서버가 채우게 해 주세요.</h2>
      <div class="mapping-story" aria-hidden="true"><div><span>새로 쓴 글</span><strong>published_at 비어 있음</strong></div><b>→</b><div><span>설명용 최신 목록</span><strong>새 글이 뒤로 밀림</strong></div></div>
      <dl class="db-journey-brief"><div><dt>만들 것</dt><dd><code>Post.java</code>를 실제 <code>post</code> 테이블 컬럼에 맞추기</dd></div><div><dt>보낼 것</dt><dd><code>POST /api/posts</code></dd></div></dl>
      <button type="button" class="db-journey-primary" data-mapping-go="mapping">만들 파일 보기 →</button>
    </article>

    <article class="db-journey-screen mapping-screen" data-mapping-panel="mapping" hidden aria-labelledby="mapping-fields-title">
      <p class="db-journey-kicker">1-4 · Post 엔티티</p><h2 id="mapping-fields-title">Post.java에 빠진 컬럼을 매핑하세요.</h2>
      <p class="db-journey-lead">1-3까지의 7개 매핑은 유지하고, DB 기본값에 맡겼던 칸을 서버가 정하게 만듭니다.</p>
      <div class="mapping-field-grid"><div class="db-journey-editor"><header><strong>Post.java</strong><small>org.example.post · 직접 수정</small></header><pre><code>@Entity
@Table(name = "post")
public class Post {
    // 기존 필드는 유지합니다.
    // 아래 컬럼의 매핑과 생성 시 값을 직접 정하세요.
}</code></pre><p>정답 필드·생성자는 원문 가이드에서 확인하고 직접 작성하세요.</p></div><div class="mapping-field-list"><p>이번에 이름과 값을 맞출 칸</p><div><code>status</code><span>PUBLISHED · 서버가 정함</span></div><div><code>published_at</code><span>이번 글의 서버 시각</span></div><div><code>view/like/comment_count</code><span>각각 0</span></div><div><code>deleted_at</code><span>NULL · 컬럼은 매핑</span></div><small>status 값은 전에도 PUBLISHED였지만, 전에는 DB DEFAULT가 채웠습니다.</small></div></div>
      <div class="mapping-image-fields"><p>시안 18 · 필드를 눌러 Java 값과 DB 컬럼을 대조하세요</p><div role="group" aria-label="Post 필드 선택"><button type="button" data-mapping-image-field="author" aria-pressed="true">author</button><button type="button" data-mapping-image-field="content" aria-pressed="false">content</button><button type="button" data-mapping-image-field="status" aria-pressed="false">status</button><button type="button" data-mapping-image-field="viewCount" aria-pressed="false">viewCount</button><button type="button" data-mapping-image-field="publishedAt" aria-pressed="false">publishedAt</button></div><div class="mapping-image-field-result"><span><small>Java 필드</small><code data-mapping-image-java>Member author</code></span><b aria-hidden="true">→</b><span><small>post 테이블</small><code data-mapping-image-column>author_id · BIGINT</code></span><span><small>이번 장의 기대값</small><strong data-mapping-image-value>회원 id 2</strong></span></div><small>설명용 대조입니다. 실제 DB 행은 요청 후 다음 화면의 SQL로 확인합니다.</small></div>
      <footer class="db-journey-actions"><button type="button" class="db-journey-back" data-mapping-go="scenario">← 상황</button><a href="#만들-것" data-task-open="true">테이블·엔티티 대조 열기 ↗</a><button type="button" class="db-journey-next" data-mapping-go="validate">다음: validate의 범위 →</button></footer>
    </article>

    <article class="db-journey-screen mapping-screen" data-mapping-panel="validate" hidden aria-labelledby="mapping-validate-title">
      <p class="db-journey-kicker">1-4 · 스키마 검증의 범위</p><h2 id="mapping-validate-title"><code>ddl-auto: validate</code>가 보지 못하는 것은?</h2>
      <p class="db-journey-lead">엔티티가 가리킨 테이블·컬럼·타입은 비교합니다. 엔티티가 모르는 DB 컬럼은 놓칠 수 있습니다.</p>
      <div class="mapping-case-choice" role="group" aria-label="검증 시점 비교"><button type="button" data-mapping-case="known" aria-pressed="true">없는 컬럼을 매핑</button><button type="button" data-mapping-case="unknown" aria-pressed="false">필수 컬럼을 매핑 안 함</button></div>
      <div class="mapping-case-result" aria-live="polite"><strong data-mapping-case-title>서버 시작 때 발견</strong><p data-mapping-case-body><code>view_cnt</code>는 <code>post</code>에 없습니다. 엔티티가 이 이름을 가리키므로 시작 때 잡습니다.</p></div>
      <div class="mapping-image-validate"><div data-mapping-image-known><span>엔티티가 없는 컬럼을 가리킴</span><code>@Column(name = "view_cnt")</code><b>→</b><strong>validate가 시작 때 missing column을 발견</strong></div><div data-mapping-image-unknown hidden><span>DB에는 필수 updated_at, 엔티티에는 매핑 없음</span><code>updated_at · DATETIME NOT NULL · 기본값 없음</code><b>→</b><strong>시작은 통과, INSERT 때 DB가 거절</strong></div></div>
      <p class="mapping-case-note">원문에서 재현한 고장 사례입니다. 지금 실행 중인 내 서버 결과가 아닙니다. 테이블을 바꾸지 말고 엔티티를 DDL과 대조하세요.</p>
      <footer class="db-journey-actions"><button type="button" class="db-journey-back" data-mapping-go="mapping">← 컬럼 매핑</button><a href="#ddl-auto-validate가-잡는-것과-못-잡는-것" data-task-open="true">validate 실험 원문 열기 ↗</a><button type="button" class="db-journey-next" data-mapping-go="author">다음: 작성자 연결 →</button></footer>
    </article>

    <article class="db-journey-screen mapping-screen" data-mapping-panel="author" hidden aria-labelledby="mapping-author-title">
      <p class="db-journey-kicker">1-4 · 작성자와 연결</p><h2 id="mapping-author-title">작성자 번호 2를 Member와 연결하세요.</h2>
      <p class="db-journey-lead">로그인은 아직 없습니다. 고정 회원 id 2의 닉네임을 응답에 싣습니다.</p>
      <div class="mapping-author-grid"><div><p>1-3의 Post.java</p><code>Long authorId</code></div><b>→</b><div><p>1-4의 Post.java</p><code>@ManyToOne(fetch = LAZY)</code><code>@JoinColumn(name = "author_id")</code><code>Member author</code></div><b>→</b><div><p>응답의 작성자 · 구현 후 기대값</p><strong>id 2 · 김자바</strong></div></div>
      <p class="mapping-author-note">닉네임은 Service 트랜잭션 안에서 읽어 둡니다. 컨트롤러에서 지연 로딩으로 다시 DB를 읽지 않게 합니다.</p>
      <footer class="db-journey-actions"><button type="button" class="db-journey-back" data-mapping-go="validate">← validate</button><a href="#구현-가이드" data-task-open="true">Member 연결 가이드 열기 ↗</a><button type="button" class="db-journey-next" data-mapping-go="run">다음: POST 응답 →</button></footer>
    </article>

    <article class="db-journey-screen mapping-screen" data-mapping-panel="run" hidden aria-labelledby="mapping-run-title">
      <p class="db-journey-kicker">1-4 · 내 서버에서 실행</p><h2 id="mapping-run-title">새 글을 보내고 작성자 응답을 확인하세요.</h2><p class="db-journey-lead">정상 요청 A′를 두 번 보냅니다. 새 글의 id와 작성자·태그를 실제 응답으로 확인하세요.</p>
      <div class="db-journey-pair db-journey-run-pair"><div class="db-journey-console"><header><strong>정상 요청 A′</strong><small>같은 POST 두 번 · 실제 서버 호출</small></header><div data-mapping-server-run-slot></div><div data-mapping-request-run-slot></div></div><aside class="db-journey-expect"><p>기대값 · 실행 결과 아님</p><strong>201 Created</strong><code>Location: /api/posts/{id}</code><span><code>author</code>: id 2 · 김자바</span><span><code>tags</code>: spring · 채점태그</span><hr><p>내 서버 결과</p><strong class="db-journey-actual" data-mapping-run-status>아직 실행 전</strong><pre data-mapping-run-result></pre></aside></div>
      <footer class="db-journey-actions"><button type="button" class="db-journey-back" data-mapping-go="author">← 작성자 연결</button><button type="button" class="db-journey-next" data-mapping-go="time">다음: 발행 시각 조회 →</button></footer>
    </article>

    <article class="db-journey-screen mapping-screen" data-mapping-panel="time" hidden aria-labelledby="mapping-time-title">
      <p class="db-journey-kicker">1-4 · DB 증거 1</p><h2 id="mapping-time-title">이제 발행 시각이 채워졌을까요?</h2><p class="db-journey-lead">응답에서 받은 실제 글 id를 조건에 넣어, 발행 시각과 작성 시각을 조회하세요.</p>
      <div class="db-journey-pair"><div class="db-journey-id"><p>마지막 201 응답의 글 id</p><strong data-mapping-post-id>아직 id를 받지 않았어요</strong><small data-mapping-post-id-note>앞 화면에서 정상 요청 A′를 보내세요.</small></div><div class="db-journey-query"><header><strong>DB에서 직접 실행</strong><small>community · post</small></header><pre><code data-mapping-sql="time">SELECT published_at, created_at FROM post WHERE id = {id};</code></pre><button type="button" data-mapping-copy="time" disabled>발행 시각 SQL 복사</button><p data-mapping-copy-state="time" role="status" aria-live="polite"></p></div></div>
      <p class="mapping-expected">구현 후 기대값 · 실제 DB 조회 전 <strong>published_at ≠ NULL</strong><strong>published_at = created_at</strong></p>
      <footer class="db-journey-actions"><button type="button" class="db-journey-back" data-mapping-go="run">← 요청 결과</button><button type="button" class="db-journey-next" data-mapping-go="values">다음: 상태·카운트 조회 →</button></footer>
    </article>

    <article class="db-journey-screen mapping-screen" data-mapping-panel="values" hidden aria-labelledby="mapping-values-title">
      <p class="db-journey-kicker">1-4 · DB 증거 2</p><h2 id="mapping-values-title">상태와 카운트도 기대한 값인가요?</h2><p class="db-journey-lead">같은 글 id로 현재 행을 조회합니다. 값의 출처는 뒤 화면에서 SQL 로그와 대조합니다.</p>
      <div class="mapping-wide-query db-journey-query"><header><strong>DB에서 직접 실행</strong><small>community · post</small></header><pre><code data-mapping-sql="values">SELECT status, author_id, view_count, like_count, comment_count, deleted_at FROM post WHERE id = {id};</code></pre><button type="button" data-mapping-copy="values" disabled>행 값 SQL 복사</button><p data-mapping-copy-state="values" role="status" aria-live="polite"></p></div>
      <div class="mapping-expected-row"><span>status <b>PUBLISHED</b></span><span>author_id <b>2</b></span><span>조회·좋아요·댓글 <b>각 0</b></span><span>deleted_at <b>NULL</b></span></div><p class="mapping-expected-label">구현 후 기대값 · 실제 DB 조회 전</p>
      <details class="mapping-full-check"><summary>채점 기준 D1 전체 SQL 보기</summary><pre><code data-mapping-sql="full">SELECT board_id, author_id, status, visibility, published_at IS NOT NULL AS published, published_at = created_at AS same_time, like_count, comment_count, deleted_at IS NULL AS not_deleted FROM post WHERE id = {id};</code></pre><button type="button" data-mapping-copy="full" disabled>전체 D1 SQL 복사</button><p data-mapping-copy-state="full" role="status" aria-live="polite"></p></details>
      <footer class="db-journey-actions"><button type="button" class="db-journey-back" data-mapping-go="time">← 발행 시각</button><a href="#직접-확인" data-task-open="true">태그 D2·D3와 DB 접속 보기 ↗</a><button type="button" class="db-journey-next" data-mapping-go="default">다음: DEFAULT와 NULL →</button></footer>
    </article>

    <article class="db-journey-screen mapping-screen" data-mapping-panel="default" hidden aria-labelledby="mapping-default-title">
      <p class="db-journey-kicker">1-4 · DB 기본값 이해</p><h2 id="mapping-default-title">DB 기본값은 언제 들어갈까요?</h2><p class="db-journey-lead">두 요청이 아니라, 서로 다른 단계의 INSERT 컬럼 목록을 비교합니다.</p>
      <div class="mapping-default-compare"><div><small>1-3의 status</small><strong>INSERT에서 생략</strong><span>엔티티에 없던 컬럼 → DB DEFAULT PUBLISHED</span></div><div><small>1-4 관찰 O1의 visibility</small><strong>INSERT에 NULL 포함</strong><span>매핑된 컬럼 → DB 기본값 대신 NOT NULL 오류</span></div></div>
      <p class="mapping-default-meaning">기본값은 그 컬럼을 INSERT에서 생략했을 때만 쓰입니다.</p>
      <footer class="db-journey-actions"><button type="button" class="db-journey-back" data-mapping-go="values">← DB 행</button><a href="#기본값은-언제-들어가나" data-task-open="true">기본값 원리 열기 ↗</a><button type="button" class="db-journey-next" data-mapping-go="observation">다음: 생략 요청 보내기 →</button></footer>
    </article>

    <article class="db-journey-screen mapping-screen" data-mapping-panel="observation" hidden aria-labelledby="mapping-observation-title">
      <p class="db-journey-kicker">1-4 · 관찰 O1 · 채점 제외</p><h2 id="mapping-observation-title">visibility를 빼고 보내면 무엇이 올까요?</h2><p class="db-journey-lead">현재 단계의 응답을 관찰합니다. 1-5에서 생략값을 서버가 PUBLIC으로 정하게 만듭니다.</p>
      <div class="db-journey-pair db-journey-run-pair"><div class="db-journey-console"><header><strong>관찰 요청 O1</strong><small>visibility 없는 JSON · 실제 서버 호출</small></header><div data-mapping-server-observation-slot></div><div data-mapping-request-observation-slot></div></div><aside class="db-journey-expect"><p>현재 단계의 예상 · 채점 제외</p><strong class="mapping-error-status">500</strong><span>매핑된 visibility가 NULL로 바인딩되어 DB의 NOT NULL에서 거절됩니다.</span><hr><p>내 서버 결과</p><strong class="db-journey-actual" data-mapping-observation-status>아직 실행 전</strong></aside></div>
      <footer class="db-journey-actions"><button type="button" class="db-journey-back" data-mapping-go="default">← DEFAULT 원리</button><button type="button" class="db-journey-next" data-mapping-go="logs">다음: SQL 로그의 출처 →</button></footer>
    </article>

    <article class="db-journey-screen mapping-screen" data-mapping-panel="logs" hidden aria-labelledby="mapping-logs-title">
      <p class="db-journey-kicker">1-4 · 값의 출처 읽기</p><h2 id="mapping-logs-title">PUBLISHED는 서버가 넣었을까요, DB가 채웠을까요?</h2><p class="db-journey-lead">DB 행의 값만으로 출처를 알 수 없습니다. 원문의 재현 SQL 로그와 내 서버 로그를 대조하세요.</p>
      <div class="mapping-provenance"><div><small>1-3의 post INSERT</small><strong>7개 매핑 컬럼</strong><span><code>status</code> 없음 → DB DEFAULT PUBLISHED</span><span><code>published_at</code> 없음 → NULL</span></div><b>→</b><div><small>1-4의 post INSERT</small><strong>13개 매핑 컬럼</strong><span><code>status</code> 포함 → 서버 바인딩 PUBLISHED</span><span><code>published_at</code> 포함 → 서버 시각 바인딩</span></div></div>
      <p class="mapping-log-note">위 내용은 원문 정답 코드의 재현 로그 개념입니다. 내 서버가 보낸 SQL인지 실제 로그에서 확인해야 합니다.</p>
      <footer class="db-journey-actions"><button type="button" class="db-journey-back" data-mapping-go="observation">← 생략 요청</button><a href="#sql-로그-읽기" data-task-open="true">실제 SQL 로그 읽는 방법 ↗</a><a class="db-journey-next" href="1-5-validation.html">다음 과제 1-5 →</a></footer>
    </article>

    <details class="db-journey-reference"><summary>열 장면과 전달받은 시안 보기</summary><p>시안의 시간·응답·DB 값은 원문 예시 또는 실행 전 기대값입니다.</p><a href="../../docs/design/mockups-2026-10-15-batch15/01-scenario.png">상황</a><a href="../../docs/design/mockups-2026-10-15-batch15/02-post-mapping.png">컬럼</a><a href="../../docs/design/mockups-2026-10-15-batch15/03-validate-limit.png">validate</a><a href="../../docs/design/mockups-2026-10-15-batch15/04-member-author.png">작성자</a><a href="../../docs/design/mockups-2026-10-15-batch15/05-request.png">요청</a><a href="../../docs/design/mockups-2026-10-15-batch15/06-published-time.png">발행 시각</a><a href="../../docs/design/mockups-2026-10-15-batch15/07-row-values.png">행 값</a><a href="../../docs/design/mockups-2026-10-15-batch15/08-default-vs-null.png">기본값</a><a href="../../docs/design/mockups-2026-10-15-batch15/09-observation-o1.png">O1</a><a href="../../docs/design/mockups-2026-10-15-batch15/10-insert-provenance.png">SQL 로그</a><a href="../../docs/design/mockups-2026-10-15-batch2/18-post-column-map-v2.png">사용자 시안 18 · 필드/컬럼</a><a href="../../docs/design/mockups-2026-10-15-batch2/19-ddl-validate-gap-v2.png">사용자 시안 19 · validate</a></details>
  </section>`;
}
