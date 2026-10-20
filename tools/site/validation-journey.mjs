/** 1-5는 상황, 구현 규칙, 실제 요청, DB 증거를 서로 다른 장면으로 보여 준다. */
const screens = ['scenario', 'dto', 'tags', 'problem', 'invalid', 'no-write', 'default', 'board', 'boundary', 'null-tag', 'case-tag'];
const next = (name) => screens[screens.indexOf(name) + 1];
const prev = (name) => screens[screens.indexOf(name) - 1];
const nav = (name, label = '다음') => `<footer class="db-journey-actions validation-actions">
  ${prev(name) ? `<button type="button" class="db-journey-back" data-validation-go="${prev(name)}">← 이전 장면</button>` : '<span></span>'}
  ${next(name) ? `<button type="button" class="db-journey-next" data-validation-go="${next(name)}">${label} →</button>` : '<a class="db-journey-next" href="1-6-token-auth.html">다음 과제 →</a>'}
</footer>`;
const shell = (name, kicker, title, lead, content, label) => `<article class="db-journey-screen validation-screen" data-validation-panel="${name}"${name === 'scenario' ? '' : ' hidden'} aria-labelledby="validation-${name}-title">
  <p class="db-journey-kicker">${kicker}</p><h2 id="validation-${name}-title">${title}</h2>
  ${lead ? `<p class="db-journey-lead">${lead}</p>` : ''}
  ${content}${nav(name, label)}</article>`;
const request = (id, result, note) => `<div class="validation-request-pair" data-validation-case="${id}">
  <div class="db-journey-console"><header><strong>요청 ${id} · 내 서버에서 실행</strong><small>원문 요청을 그대로 사용</small></header><div data-validation-server="${id}"></div><div data-validation-request="${id}"></div></div>
  <aside class="db-journey-expect"><p>구현 후 기대값 · 실행 결과 아님</p><strong>${result}</strong><span>${note}</span><hr><p>내 서버 결과</p><strong class="db-journey-actual" data-validation-actual="${id}">아직 실행 전</strong></aside>
</div>`;
const choices = (ids, labels) => `<div class="validation-case-choice" role="group" aria-label="확인할 요청 고르기">${ids.map((id, i) => `<button type="button" data-validation-select="${id}" aria-pressed="${i === 0}">${labels[i]}</button>`).join('')}</div>`;
const sql = (id, query, description, expected) => `<div class="validation-sql"><div class="db-journey-query"><header><strong>${id} · DB에서 직접 실행</strong><small>community DB</small></header><pre><code data-validation-sql="${id}">${query}</code></pre><button type="button" data-validation-copy="${id}">SQL 복사</button><p data-validation-copy-state="${id}" role="status" aria-live="polite"></p></div><aside class="db-journey-expect"><p>구현 후 기대값 · 실제 DB 조회 전</p><strong>${expected}</strong><span>${description}</span></aside></div>`;

export function renderValidationJourney() {
  return `<section class="first-db-journey validation-journey" data-validation-screen="scenario" aria-label="1-5 잘못된 입력 막기">
    ${shell('scenario', '1-5 · 새 글 입력 검증', '빈 제목이 API로 들어오면 어떻게 될까요?', '화면에서 막아도 API에는 잘못된 입력이 직접 들어올 수 있습니다.', `
      <p class="validation-quote">“빈 제목으로 글이 저장됐어요.”</p>
      <div class="validation-scenario-line"><span>클라이언트의 입력</span><b>→</b><span>POST /api/posts</span><b>→</b><strong>저장 전에 확인</strong></div>
      <dl class="db-journey-brief"><div><dt>만들 것</dt><dd><code>PostCreateRequest.java</code> 검증과 <code>ApiExceptionHandler.java</code> 오류 응답</dd></div><div><dt>보낼 것</dt><dd><code>POST /api/posts</code> · 제목을 비운 요청부터</dd></div></dl>
    `, '첫 파일 보기')}

    ${shell('dto', '1-5 · 요청 DTO', '제목과 본문을 저장 전에 검사하세요.', '<code>PostCreateRequest</code>는 record입니다. 필드에 검증 규칙을 두고 Controller의 <code>@Valid</code>로 실행합니다.', `
      <div class="validation-rule-grid"><div class="validation-code-card"><small>직접 수정 · PostCreateRequest.java</small><pre><code>public record PostCreateRequest(
    String boardSlug,
    String title,
    String content,
    List&lt;String&gt; tags,
    String visibility
) { }</code></pre><p>기존 record를 유지하고 필요한 검증 애노테이션을 직접 작성하세요.</p></div>
      <div class="validation-rules"><div><code>boardSlug</code><strong>필수</strong></div><div><code>title</code><strong>공백 불가 · 최대 200자</strong></div><div><code>content</code><strong>공백 불가</strong></div><div><code>@Valid</code><strong>Service 호출 전에 검사 시작</strong></div></div></div>
      <a class="validation-reference-link" href="#구현-가이드" data-task-open="true">원문 DTO·Controller 가이드 열기 ↗</a>
    `, '태그 규칙 보기')}

    ${shell('tags', '1-5 · 태그와 공개 범위', '선택 입력과 잘못된 값을 구분하세요.', '태그 목록과 각 태그 이름, 공개 범위를 각각 확인합니다.', `
      <div class="validation-rule-grid validation-rule-grid-three"><div class="validation-rule-card"><small>tags 목록</small><strong>없거나 빈 목록은 허용</strong><p>보냈다면 최대 5개까지</p></div><div class="validation-rule-card"><small>tags의 각 요소</small><strong>null은 거절</strong><p>이름 길이 1–30자</p></div><div class="validation-rule-card"><small>visibility</small><strong>PUBLIC · FOLLOWERS</strong><p>생략한 값은 뒤에서 Service가 PUBLIC으로 정함</p></div></div>
      <div class="validation-flow"><span>요청 DTO 검증</span><b>→</b><span>Service에서 기본값 선택</span><b>→</b><span>저장</span></div>
      <a class="validation-reference-link" href="#구현-가이드" data-task-open="true">원문 태그·공개 범위 규칙 열기 ↗</a>
    `, '오류 응답 보기')}

    ${shell('problem', '1-5 · 오류 응답', '오류를 사람이 이해할 수 있게 돌려주세요.', '검증 실패와 게시판 오류를 한 곳에서 처리하고, 잘못된 필드는 빠짐없이 알려 줍니다.', `
      <div class="validation-problem-grid"><div class="validation-code-card"><small>직접 수정 · ApiExceptionHandler.java</small><pre><code>@RestControllerAdvice
class ApiExceptionHandler {
    // 검증 실패와 게시판 오류를
    // ProblemDetail로 변환하세요.
}</code></pre><p>컨트롤러마다 try-catch를 복제하지 않습니다.</p></div><div class="validation-example"><small>400 · application/problem+json · 기대 형태</small><pre><code>{
  "status": 400,
  "detail": "요청 값을 확인해 주세요.",
  "errors": [
    { "field": "title", "message": "..." },
    { "field": "content", "message": "..." }
  ]
}</code></pre><p>한 요청에 두 필드가 틀리면 <code>errors</code>에도 둘 다 있어야 합니다.</p></div></div>
      <a class="validation-reference-link" href="#구현-가이드" data-task-open="true">ProblemDetail 구현 가이드 열기 ↗</a>
    `, '요청 보내기')}

    ${shell('invalid', '1-5 · 실패 요청', '한 번에 한 요청만 보내 보세요.', '오류의 종류를 고르고, 실제 서버 응답을 기대값과 비교합니다.', `
      ${choices(['V1', 'V3', 'V4', 'V8'], ['V1 · 빈 제목', 'V3 · 오류 두 개', 'V4 · 잘못된 공개 범위', 'V8 · null 제목'])}
      ${request('V1', '400 · title 오류', '빈 제목은 저장되지 않아야 합니다.')}
      ${request('V3', '400 · content + tags 오류', '두 필드 오류가 errors 배열에 함께 있어야 합니다.')}
      ${request('V4', '400 · visibility 오류', 'PUBLIC·FOLLOWERS 외 값은 거절합니다.')}
      ${request('V8', '400 · title 오류', 'null도 필수 제목으로 인정되지 않습니다.')}
    `, 'DB에서 확인')}

    ${shell('no-write', '1-5 · DB 증거', '거절한 글은 DB에 남지 않았나요?', '실패 요청들을 보낸 뒤 SQL을 직접 실행합니다. 이 화면은 DB에 자동 접속하지 않습니다.', `
      <div class="validation-proof-flow"><span>400 응답</span><b>→</b><span>INSERT 없음</span><b>→</b><strong>COUNT 0</strong></div>
      ${sql('D1', "SELECT COUNT(*) FROM post WHERE title LIKE '[채점] 검증-실패%';", '실패 요청 제목의 글은 0건', '0')}
      ${sql('D2', "SELECT COUNT(*) FROM tag WHERE name IN ('a','b','c','d','e','f');", 'V3 때문에 새 태그가 생기면 안 됩니다.', '0')}
    `, '생략값 확인')}

    ${shell('default', '1-5 · 정상 요청 V5', '공개 범위를 안 보내면 누가 정할까요?', 'visibility를 생략한 실제 요청을 보내고, Service가 정한 값을 응답에서 확인합니다.', `
      <div class="validation-default-flow"><div><small>요청</small><strong>visibility 없음</strong></div><b>→</b><div><small>Service</small><strong>PUBLIC 선택</strong></div><b>→</b><div><small>응답</small><strong>visibility PUBLIC</strong></div></div>
      ${request('V5', '201 Created', '응답 visibility가 PUBLIC이어야 합니다.')}
    `, '게시판 오류 구분')}

    ${shell('board', '1-5 · 게시판 오류', '게시판이 없으면 404, 권한이 없으면 403.', '두 요청의 원인을 구분해 보세요. 둘 다 ProblemDetail의 detail이 사람에게 읽혀야 합니다.', `
      ${choices(['V6', 'V7'], ['V6 · 없는 게시판', 'V7 · 운영자 전용 게시판'])}
      <div class="validation-board-flow"><span>boardSlug 조회</span><b>→</b><span>게시판 존재 확인</span><b>→</b><span>쓰기 권한 확인</span></div>
      ${request('V6', '404 Not Found', 'boardSlug nope에 해당하는 게시판이 없습니다.')}
      ${request('V7', '403 Forbidden', '일반 회원은 notice 게시판에 글을 쓸 수 없습니다.')}
    `, '길이 경계 확인')}

    ${shell('boundary', '1-5 · 경계값', '제목 200자는 통과, 201자는 거절.', '큰 요청 본문을 모두 읽을 필요는 없습니다. 원문 요청은 열어 두고 경계에서 결과를 비교합니다.', `
      <div class="validation-ruler" aria-label="제목은 200자까지 허용하고 201자부터 거절"><span>제목 길이</span><div><b>200자 · 통과</b><b>201자 · 거절</b></div></div>
      <div class="validation-mini-rules"><span>V9 · 태그 5개까지 통과</span><span>V9 · 태그 이름 30자까지 통과</span><span>V10 · 제목 1자 통과</span></div>
      ${choices(['V2', 'V9', 'V10'], ['V2 · 201자', 'V9 · 상한', 'V10 · 1자'])}
      ${request('V2', '400 · title 오류', '제목 201자는 상한을 넘습니다.')}
      ${request('V9', '201 Created', '제목 200자·태그 5개·태그 이름 30자는 모두 통과합니다.')}
      ${request('V10', '201 Created', '제목 한 글자도 유효합니다.')}
    `, 'null 요소 확인')}

    ${shell('null-tag', '1-5 · 태그 요소 V11', '태그 목록 안의 null도 찾아야 합니다.', '목록이 존재해도 각 요소는 따로 검사해야 합니다.', `
      <div class="validation-default-flow"><div><small>입력</small><strong>tags[0] = null</strong></div><b>→</b><div><small>요소 검증</small><strong>@NotNull</strong></div><b>→</b><div><small>오류 필드</small><strong>tags[0]</strong></div></div>
      ${request('V11', '400 · tags[0] 오류', 'errors 배열에 tags[0]이 있어야 하며 글은 저장되지 않습니다.')}
    `, '대소문자 태그 확인')}

    ${shell('case-tag', '1-5 · DB의 태그 동등성 V12', 'spring과 Spring은 DB에서 같은 태그일까요?', 'DB의 대소문자 구분 방식에 따라 같은 태그 한 개로 연결되는지 확인합니다.', `
      <div class="validation-default-flow"><div><small>입력</small><strong>spring · Spring</strong></div><b>→</b><div><small>DB 태그</small><strong>spring 하나</strong></div><b>→</b><div><small>post_tag</small><strong>연결 한 건</strong></div></div>
      ${request('V12', '201 Created', '응답 tags는 DB에 저장된 spring 하나여야 합니다.')}
      ${sql('D3', "SELECT COUNT(*) FROM post_tag WHERE post_id = (SELECT MAX(id) FROM post WHERE title = '[채점] 검증-태그대소문자');", 'V12 글의 태그 연결이 한 건인지 직접 확인', '1')}
      <p class="validation-note">Java 문자열 비교만으로 판단하지 않습니다. DB의 collation과 실제 조회 결과를 대조하세요.</p>
    `)}

    <details class="db-journey-reference"><summary>장면별 이미지 시안 12장 보기</summary><p>시안은 설명용입니다. 실행 결과는 내 서버 응답과 DB 조회로 확인합니다.</p>
      ${['01-scenario', '02-dto-basic', '03-dto-tags', '04-problem-detail', '05-v1', '06-v3', '07-no-write', '08-default', '09-board-error', '10-boundary', '11-null-tag', '12-case-tag'].map((name) => `<a href="../../docs/design/mockups-2026-10-15-batch16/${name}.jpg">${name}</a>`).join('')}
    </details>
  </section>`.replace(/[ \t]+\n/g, '\n');
}
