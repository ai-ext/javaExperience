/** L12 Q01/Q02: 한 번에 하나의 구현 또는 HTTP 요청만 보여 준다. */
const screens = ['scenario', 'derived', 'create', 'jpa-request', 'mybatis', 'mybatis-request', 'board', 'author', 'search', 'exists', 'count', 'page', 'hidden-rule', 'hide', 'hidden-get', 'restore'];
const names = ['시나리오', 'JPA 조건', '글 만들기', 'JPA 조회', 'MyBatis SQL', 'MyBatis 조회', '게시판', '작성자', '제목 검색', '존재', '글 수', '페이지', '숨김 규칙', '숨기기', '404 확인', '복구'];
const nav = (name) => {
  const index = screens.indexOf(name);
  return `<footer class="db-journey-actions l12-actions"><button type="button" class="db-journey-back" data-l12-go="${screens[Math.max(index - 1, 0)]}"${index ? '' : ' disabled'}>← 이전</button><span>${index + 1} / ${screens.length}</span>${index < screens.length - 1 ? `<button type="button" class="db-journey-next" data-l12-go="${screens[index + 1]}">${names[index + 1]} →</button>` : '<a class="db-journey-next" href="../l13-declared-queries/README.html">다음 L13 →</a>'}</footer>`;
};
const panel = (name, kicker, title, lead, body) => `<article class="db-journey-screen l12-screen" data-l12-panel="${name}"${name === 'scenario' ? '' : ' hidden'} aria-labelledby="l12-${name}-title"><p class="db-journey-kicker">${kicker}</p><h2 id="l12-${name}-title">${title}</h2><p class="db-journey-lead">${lead}</p>${body}${nav(name)}</article>`;
const code = (label, value) => `<div class="l12-code"><small>${label}</small><pre><code>${value}</code></pre></div>`;
const request = (id, expected, explanation) => `<div class="l12-request-grid"><div class="l12-request-slot" data-l12-request-slot="${id}"><div class="l12-base-slot" data-l12-base-slot></div></div><aside class="l12-expected"><small>요청 ${id} · 실행 전 기대값</small><strong>${expected}</strong><p>${explanation}</p><span>실제 응답은 왼쪽에서 요청한 뒤 확인합니다.</span></aside></div>`;

export function renderL12QueryJourney() {
  return `<section class="first-db-journey l12-journey" data-l12-screen="scenario" aria-label="L12 JPA와 MyBatis 첫 조회 실습">
    ${panel('scenario', 'L12 · 생성한 글을 두 방식으로 읽기', '방금 쓴 글을 JPA와 MyBatis가 똑같이 읽을까요?', 'practice DB에 공개 글을 하나 만든 뒤, 응답의 id로 두 조회 API를 직접 확인합니다.', `
      <div class="l12-story"><div><small>사람의 상황</small><strong>내가 올린 공개 글을 다시 찾고 싶다</strong></div><b>→</b><div><small>이번에 만들 것</small><strong>JPA 상세 조회 + MyBatis 상세 조회</strong></div></div>
      <dl class="db-journey-brief"><div><dt>만들 것</dt><dd><code>GET /api/query-practice/{engine}/posts/{id}</code></dd></div><div><dt>보낼 것</dt><dd>글 생성 POST → 같은 id의 JPA·MyBatis GET</dd></div></dl>
      <p class="l12-note">L12는 복원한 <code>practice</code> 서버가 필요합니다. 실행 명령과 전체 구현 코드는 아래 원문에 보존했습니다.</p>
    `)}
    ${panel('derived', 'L12 · JPA 구현', '메서드 이름을 조건으로 읽어 보세요.', 'Spring Data는 Java 속성 이름과 키워드를 해석해 조회 조건을 만듭니다.', `
      <div class="l12-segments"><span>findById</span><span>DeletedAtIsNull</span><span>HiddenAtIsNull</span><span>Status</span><span>Visibility</span></div>
      ${code('DerivedPostRepository.java', 'findByIdAndDeletedAtIsNullAndHiddenAtIsNullAndStatusAndVisibility(\n    Long id, String status, String visibility\n)')}
      <p class="l12-note"><code>hide</code> boolean은 없습니다. 숨김 여부는 <code>hiddenAt</code>이 NULL인지로 판단합니다. <code>status</code>와 <code>visibility</code>는 원문 계약대로 String 인자입니다.</p>
      <a class="l12-source" href="#q01-생성-후-상세" data-l12-source>Q01 구현 코드 전문 열기 ↗</a>
    `)}
    ${panel('create', 'L12 · 요청 P', '비교할 공개 글을 하나 만드세요.', '201 응답의 id가 다음 두 GET 요청에 자동으로 전달됩니다.', `
      ${request('P', '201 · 응답에 id', '실제 글 번호는 고정하지 않습니다. 새로 생성된 응답을 확인하세요.')}
      <p class="l12-note">작성자 토큰 <code>tok-p05</code>와 원문의 요청 본문을 사용합니다.</p>
    `)}
    ${panel('jpa-request', 'L12 · 요청 A', '생성한 글을 JPA로 읽으세요.', '경로의 <code>{{P.body.id}}</code>는 앞서 받은 실제 id로 치환됩니다.', `
      ${request('A', '200 · 같은 id', '<code>QueryPostRow</code>의 id·title·boardSlug·authorId를 실제 응답에서 확인하세요.')}
    `)}
    ${panel('mybatis', 'L12 · MyBatis 구현', 'MyBatis는 메서드 이름 대신 XML의 SQL을 실행합니다.', 'Java 매퍼 메서드, XML namespace와 select id, 공개 조건을 한 줄씩 연결하세요.', `
      <div class="l12-mapper"><div><small>Java 매퍼</small><strong>BasicPostMapper.detail(id)</strong></div><b>→</b><div><small>XML 연결</small><strong>namespace = BasicPostMapper<br>select id = detail</strong></div><b>→</b><div><small>WHERE</small><strong>id = #{id} + visible</strong></div></div>
      ${code('BasicPostMapper.xml · visible', "p.deleted_at IS NULL\nAND p.hidden_at IS NULL\nAND p.status = 'PUBLISHED'\nAND p.visibility = 'PUBLIC'")}
      <p class="l12-note">실제 namespace의 전체 이름은 <code>org.example.querypractice.BasicPostMapper</code>입니다. 글과 게시판의 연결은 원문 SQL에서 확인하세요.</p>
      <a class="l12-source" href="#q02-숨김삭제비공개-제외" data-l12-source>Q02 매퍼 XML 전문 열기 ↗</a>
    `)}
    ${panel('mybatis-request', 'L12 · 요청 B', '같은 글을 MyBatis로 읽으세요.', '조회 방식이 달라도 같은 공개 글의 id·title·boardSlug·authorId를 대조합니다.', `
      ${request('B', '200 · 같은 공개 글', 'A와 B의 실제 응답을 비교하세요. 아직 같은 결과를 확인했다고 가정하지 않습니다.')}
    `)}
    ${panel('board', 'L12 · Q03 · 요청 C', 'dev 게시판 글만 모으세요.', '게시판 slug를 조건으로 공개 글 목록을 조회합니다.', `
      <div class="l12-rule"><strong>post.board_id → board.id → board.slug</strong><span><code>Board_Slug</code>는 <code>board.slug</code> 경로입니다.</span></div>
      ${request('C', 'items[] · total', '글 목록과 전체 개수의 형태를 확인합니다. 실제 개수는 실행한 DB에 달려 있습니다.')}
      <a class="l12-source" href="#q03-게시판-조회" data-l12-source>Q03 전체 구현 코드 열기 ↗</a>
    `)}
    ${panel('author', 'L12 · Q04 · 요청 D', '방금 쓴 글의 작성자로 찾으세요.', '글 생성 응답의 작성자 id를 조건에 넣습니다. 고정된 예시 id로 바꾸지 않습니다.', `
      <div class="l12-rule"><strong>p.author_id = #{authorId}</strong><span><code>{{P.body.author.id}}</code>를 실제 응답에서 치환합니다.</span></div>
      ${request('D', 'items[] · total', '같은 작성자가 쓴 공개 글만 결과에 있는지 확인하세요.')}
      <a class="l12-source" href="#q04-작성자-조회" data-l12-source>Q04 전체 구현 코드 열기 ↗</a>
    `)}
    ${panel('search', 'L12 · Q05 · 요청 E', '제목에 JPA가 든 공개 글을 찾으세요.', '대소문자를 구분하지 않고 제목에 단어가 들어 있는지 검사합니다.', `
      <div class="l12-rule"><strong>ContainingIgnoreCase</strong><span>MyBatis에서는 <code>LOWER(title) LIKE … ESCAPE !</code>로 같은 의미를 만듭니다. %와 _는 검색어의 문자로 처리합니다.</span></div>
      ${request('E', '조건에 맞는 items[]', '실제 반환 행은 쿼리를 실행한 뒤 제목과 공개 상태로 확인하세요.')}
      <a class="l12-source" href="#q05-제목-검색" data-l12-source>Q05 전체 구현 코드 열기 ↗</a>
    `)}
    ${panel('exists', 'L12 · Q06 · 요청 F', '글 본문 없이 존재 여부만 확인하세요.', '이 id가 공개 조건을 통과하는지만 묻습니다.', `
      <div class="l12-rule"><strong>existsBy… ↔ SELECT EXISTS</strong><span>글 객체 전체 대신 <code>exists</code> 결과를 읽습니다.</span></div>
      ${request('F', '{"exists": true | false}', '앞서 만든 글의 실제 id로 요청합니다. 아직 true라고 측정한 것은 아닙니다.')}
      <a class="l12-source" href="#q06-존재-확인" data-l12-source>Q06 전체 구현 코드 열기 ↗</a>
    `)}
    ${panel('count', 'L12 · Q07 · 요청 G', 'dev 게시판의 공개 글 수를 세세요.', '목록의 길이가 아니라 필터를 통과한 전체 글 수를 구합니다.', `
      <div class="l12-rule"><strong>COUNT(*)</strong><span><code>boardSlug=dev</code>와 공개·미삭제·미숨김 조건을 함께 적용합니다.</span></div>
      ${request('G', '{"count": n}', 'n은 현재 DB에 따라 달라집니다. 숫자를 미리 정해 두지 않았습니다.')}
      <a class="l12-source" href="#q07-게시판-글-수" data-l12-source>Q07 전체 구현 코드 열기 ↗</a>
    `)}
    ${panel('page', 'L12 · Q08 · 요청 H', '두 번째 페이지를 가져오세요.', '0부터 시작하는 page=1, size=2로 공개 글을 id 내림차순 조회합니다.', `
      <div class="l12-rule"><strong>page=1 · size=2 · id DESC</strong><span>허용 크기는 1~50입니다. 이번 요청의 결과 수는 DB 상태에 달려 있습니다.</span></div>
      ${request('H', 'items[] · total · page · size', '목록과 전체 개수, 현재 페이지, 크기를 실제 응답에서 대조하세요.')}
      <a class="l12-source" href="#q08-페이지" data-l12-source>Q08 전체 구현 코드 열기 ↗</a>
    `)}
    ${panel('hidden-rule', 'L12 · 숨김 상태 실험', '같은 글을 숨기면 상세 조회에서 사라져야 합니다.', '읽기 결과가 왜 달라지는지 상태 변경과 공개 조건을 연결합니다.', `
      <div class="l12-state"><div><small>변경 전</small><strong>status = PUBLISHED</strong><span>공개 조건 통과</span></div><b>→</b><div><small>변경 후</small><strong>status = HIDDEN</strong><span>공개 조건 실패</span></div><b>→</b><div><small>JPA 상세</small><strong>예상 404</strong><span>같은 글 id</span></div></div>
      <p class="l12-note">이 실험의 구조화된 확인 요청 J는 <strong>JPA GET</strong>입니다. MyBatis의 visible 조건도 별도 코드 장면에서 확인했습니다.</p>
    `)}
    ${panel('hide', 'L12 · 요청 I', '관리자 요청으로 같은 글을 숨기세요.', '이전 생성 응답의 id로 상태 변경 API를 호출합니다.', `
      ${request('I', '다음 GET의 예상 404', '<code>PATCH</code> 본문은 <code>{"status":"HIDDEN"}</code>입니다. PATCH 자체의 응답 코드를 추정하지 않습니다.')}
    `)}
    ${panel('hidden-get', 'L12 · 요청 J', '숨긴 글을 JPA로 다시 조회하세요.', '같은 id로 GET을 보내고 404인지 확인합니다.', `
      ${request('J', '404 Not Found', '원문의 자동 확인 C2가 J의 상태 코드 404를 검사합니다.')}
    `)}
    ${panel('restore', 'L12 · 요청 K', '실험한 글을 다시 공개 상태로 돌리세요.', '새 글을 만드는 대신 같은 글의 상태를 복구합니다.', `
      ${request('K', 'status = PUBLISHED', '<code>PATCH</code> 본문은 <code>{"status":"PUBLISHED"}</code>입니다. 실제 결과를 확인하세요.')}
      <p class="l12-note">여덟 과제의 구현 파일 전문과 수동 실행 준비는 아래 원문에서 확인할 수 있습니다. 화면은 요청 하나씩 나누었고 구현 깊이는 그대로 보존했습니다.</p>
    `)}
    <details class="db-journey-reference"><summary>이번 장면의 이미지 시안 16장 보기</summary>${['01-l12-scenario','02-derived-method','05-create-post','06-get-jpa','03-mybatis-detail','07-get-mybatis','11-q03-board','12-q04-author','13-q05-search','14-q06-exists','15-q07-count','16-q08-page','04-hidden-state','08-hide-patch','09-get-hidden','10-restore-patch'].map((name) => `<a href="../../../docs/design/mockups-2026-10-16-batch22/${name}.jpg">${name}</a>`).join('')}</details>
  </section>`;
}
