/** L16: 같은 조회 계약을 JPA와 JDBC로 각각 구현하고 검증한다. */
const screens = ['scenario', 'contract', 'jpa', 'jdbc', 'bean-selection', 'two-beans', 'zero-beans', 'run-jpa', 'run-jdbc', 'public-404', 'invalid-id', 'db-proof', 'contract-test', 'unit-fake', 'extension'];
const nav = (name, label = '다음 장면') => {
  const index = screens.indexOf(name);
  return `<footer class="db-journey-actions reader-actions">
    ${index ? `<button type="button" class="db-journey-back" data-reader-go="${screens[index - 1]}">← 이전 장면</button>` : '<span></span>'}
    ${index < screens.length - 1 ? `<button type="button" class="db-journey-next" data-reader-go="${screens[index + 1]}">${label} →</button>` : '<a class="db-journey-next" href="../l12-query-methods/README.html">다음 쿼리 실습 →</a>'}
  </footer>`;
};
const panel = (name, kicker, title, lead, body, nextLabel) => `<article class="db-journey-screen reader-screen" data-reader-panel="${name}"${name === 'scenario' ? '' : ' hidden'} aria-labelledby="reader-${name}-title">
  <p class="db-journey-kicker">${kicker}</p><h2 id="reader-${name}-title">${title}</h2>${lead ? `<p class="db-journey-lead">${lead}</p>` : ''}
  ${body}${nav(name, nextLabel)}</article>`;
const command = (name, text, note) => `<div class="reader-command"><header><strong>${name}</strong><small>${note}</small></header><pre><code data-reader-command="${name}">${text}</code></pre><button type="button" data-reader-copy="${name}">명령 복사</button><p data-reader-copy-state="${name}" role="status" aria-live="polite"></p></div>`;
const expected = (title, value, note) => `<aside class="reader-expected"><small>${title} · 실행 전 기대값</small><strong>${value}</strong><p>${note}</p><span>실제 결과는 직접 실행한 뒤 비교하세요.</span></aside>`;

export function renderInterfaceImplJourney() {
  return `<section class="first-db-journey reader-journey" data-reader-screen="scenario" aria-label="L16 interface와 JPA JDBC 구현">
    ${panel('scenario', 'L16 · 같은 API, 두 구현', '글 제목을 읽는 방식을 바꾸면 API 응답도 달라질까요?', '같은 공개 글을 JPA와 JDBC로 한 번씩 읽어 같은 응답을 만드는 실습입니다.', `
      <div class="reader-story"><div><small>첫 구현</small><strong>JPA로 공개 글 읽기</strong></div><b>→</b><div><small>같은 계약</small><strong>id 2 · 같은 제목</strong></div><b>←</b><div><small>다른 구현</small><strong>JDBC로 공개 글 읽기</strong></div></div>
      <dl class="db-journey-brief"><div><dt>만들 것</dt><dd><code>PostSummaryReader</code> interface와 JPA·JDBC 구현</dd></div><div><dt>보낼 것</dt><dd><code>GET /api/labs/post-summaries/2</code></dd></div></dl>
      <p class="reader-note">본편 2-3 이후 <code>community</code> DB에서, 익명에게도 보이는 공개 글만 대상으로 합니다.</p>
    `, '조회 계약 만들기')}

    ${panel('contract', 'L16 · interface 계약', 'Service는 구현체 이름이 아니라 인터페이스를 받습니다.', '구현체를 바꿔도 Service와 Controller 코드는 그대로 두는 것이 이번 계약입니다.', `
      <div class="reader-contract"><div><small>PostSummaryReader</small><code>Optional&lt;PostSummary&gt; findPublic(long id)</code></div><b>→</b><div><small>PostSummaryService</small><code>PostSummaryService(PostSummaryReader reader)</code></div><b>→</b><div><small>Controller</small><code>GET /api/labs/post-summaries/{id}</code></div></div>
      <p class="reader-note"><code>PostSummary</code>는 id·title 두 값만 담는 불변 DTO입니다. Service는 <code>new</code>나 구현체 이름 분기를 하지 않습니다.</p>
      <a class="reader-reference-link" href="#직접-만들-것" data-reader-source="true">계약 원문 열기 ↗</a>
    `, 'JPA 구현')}

    ${panel('jpa', 'L16 · JpaPostSummaryReader', 'JPA 구현은 공개 조건을 확인하고 두 값만 돌려줍니다.', '기존 Post Entity를 읽더라도 HTTP 응답에는 DTO의 id·title만 싣습니다.', `
      <div class="reader-flow"><div><small>Post Entity · id 2</small><strong>seed 행 읽기</strong></div><b>→</b><div><small>공개 조건</small><strong>PUBLISHED · PUBLIC · deletedAt null</strong></div><b>→</b><div><small>PostSummary</small><strong>id 2 · 제목만</strong></div></div>
      <p class="reader-note">구현 파일 <code>JpaPostSummaryReader.java</code>. 아직 실제 JPA 쿼리 수를 측정하지 않았습니다.</p>
      <a class="reader-reference-link" href="#직접-만들-것" data-reader-source="true">JPA 조건 원문 열기 ↗</a>
    `, 'JDBC 구현')}

    ${panel('jdbc', 'L16 · JdbcPostSummaryReader', 'JDBC 구현은 같은 공개 조건을 SQL로 적습니다.', '<code>JdbcTemplate</code>의 바인딩 파라미터로 글 id를 전달합니다.', `
      <div class="reader-sql-grid"><div class="reader-command"><header><strong>JdbcPostSummaryReader.java의 SQL</strong><small>직접 구현할 조회 조건</small></header><pre><code>SELECT id, title
FROM post
WHERE id = ?
  AND deleted_at IS NULL
  AND status = 'PUBLISHED'
  AND visibility = 'PUBLIC'</code></pre></div><div class="reader-expected"><small>파라미터 바인딩</small><strong>? ← 요청 id 2</strong><p>문자열에 id를 이어 붙이지 않습니다.</p><span>결과는 같은 불변 PostSummary로 매핑</span></div></div>
      <a class="reader-reference-link" href="#직접-만들-것" data-reader-source="true">JDBC SQL 원문 열기 ↗</a>
    `, '빈 하나 선택하기')}

    ${panel('bean-selection', 'L16 · Spring 빈 선택', '설정 하나로 Reader 구현체를 하나만 등록하세요.', '설정값을 바꾸고 앱을 다시 시작할 때 Spring이 등록할 구현체가 달라집니다.', `
      <div class="reader-choice" role="group" aria-label="설명할 빈 설정"><button type="button" data-reader-mode="jpa" aria-pressed="true">app.post-summary.reader=jpa</button><button type="button" data-reader-mode="jdbc" aria-pressed="false">app.post-summary.reader=jdbc</button></div>
      <div class="reader-bean-flow"><div><small>Spring 등록 후보</small><strong data-reader-bean>JpaPostSummaryReader 한 개</strong><span data-reader-condition>jpa · 설정이 없어도 기본값</span></div><b>→</b><div><small>생성자 주입</small><strong>PostSummaryService(PostSummaryReader)</strong><span>Service·Controller 수정 없음</span></div></div>
      <p class="reader-note">이 선택 버튼은 조건의 의미를 설명합니다. 실제 서버 빈을 전환하려면 설정을 바꾸고 재시작해야 합니다.</p>
    `, '후보 2개 실패 실험')}

    ${panel('two-beans', 'L16 · 의도적인 시작 실패', 'Reader 빈이 둘이면 Service가 어느 것을 받을지 모릅니다.', '두 조건을 잠시 제거해 후보 2개가 생기는 실패를 관찰하고 복구합니다.', `
      <div class="reader-bean-failure"><div><small>Spring 컨테이너</small><strong>JPA Reader + JDBC Reader</strong><span>PostSummaryReader 후보 2개</span></div><b>→</b><div><small>Service 생성자</small><strong>하나를 결정할 수 없음</strong></div><b>→</b><div><small>결과</small><strong>앱 시작 실패</strong><span>HTTP 요청 전 단계</span></div></div>
      <p class="reader-note">의도적으로 실패를 재현한 뒤 조건을 다시 넣어 후보 하나로 복구합니다. 아직 내 서버에서 관찰한 오류가 아닙니다.</p>
    `, '후보 0개 이해')}

    ${panel('zero-beans', 'L16 · 후보가 없는 경우', 'Reader 빈이 하나도 없어도 Service를 만들 수 없습니다.', '<code>app.post-summary.reader</code>가 jpa·jdbc 어느 조건에도 맞지 않을 때를 생각해 보세요.', `
      <div class="reader-bean-failure"><div><small>설정 예시</small><strong>reader=unsupported</strong></div><b>→</b><div><small>Spring 컨테이너</small><strong>PostSummaryReader 후보 0개</strong></div><b>→</b><div><small>결과</small><strong>앱 시작 실패</strong><span>HTTP 요청 전 단계</span></div></div>
      <p class="reader-note">jpa 기본값 또는 jdbc 설정으로 돌아가 정확히 한 구현체만 등록하세요.</p>
    `, 'JPA 실행')}

    ${panel('run-jpa', 'L16 · JPA로 직접 확인', '먼저 JPA 설정으로 공개 글 2번을 조회하세요.', '한 번에 서버 하나만 실행합니다. 같은 seed DB를 JDBC 단계에서도 다시 사용합니다.', `
      <label class="reader-base-input">API 서버 주소 <input type="url" value="http://localhost:8080" data-reader-base spellcheck="false"></label>
      <div class="reader-run-grid"><div>${command('start-jpa', "./gradlew bootRun --args='--app.post-summary.reader=jpa'", 'JPA 서버 시작')}${command('get-jpa', 'curl -i {{BASE}}/api/labs/post-summaries/2', '다른 터미널에서 요청')}</div>${expected('JPA 결과', '200 · {id: 2, title: "JPA 연관관계 매핑 정리"}', '실제 JSON 필드가 두 개뿐인지 확인하세요.')}</div>
      <p class="reader-note">다음 JDBC 서버를 실행하기 전에 이 JPA 서버를 종료하세요.</p>
    `, 'JDBC 실행')}

    ${panel('run-jdbc', 'L16 · JDBC로 직접 확인', 'JPA 서버를 끄고 JDBC 설정으로 같은 글을 조회하세요.', 'Service·Controller와 community seed는 바꾸지 않습니다.', `
      <div class="reader-run-grid"><div>${command('start-jdbc', "./gradlew bootRun --args='--app.post-summary.reader=jdbc'", 'JDBC 서버 시작')}${command('get-jdbc', 'curl -i {{BASE}}/api/labs/post-summaries/2', '다른 터미널에서 요청')}</div>${expected('JDBC 결과', '200 · {id: 2, title: "JPA 연관관계 매핑 정리"}', 'JPA 때의 실제 응답과 id·title을 대조하세요.')}</div>
      <p class="reader-note">두 서버를 동시에 띄워 서로 다른 포트·DB를 비교하지 않습니다.</p>
    `, '공개 조건 밖 확인')}

    ${panel('public-404', 'L16 · 공개 조건 밖', '글이 있어도 공개 조건 밖이면 이 API는 404입니다.', '선택한 seed 글의 세 조건을 보세요. 현재 실행 중인 설정에서 보내고, 다른 설정에서도 반복합니다.', `
      <div class="reader-choice" role="group" aria-label="확인할 seed 글"><button type="button" data-reader-seed="6" aria-pressed="true">6 · FOLLOWERS</button><button type="button" data-reader-seed="7" aria-pressed="false">7 · DRAFT</button><button type="button" data-reader-seed="8" aria-pressed="false">8 · 삭제</button><button type="button" data-reader-seed="10" aria-pressed="false">10 · HIDDEN</button><button type="button" data-reader-seed="999" aria-pressed="false">없는 id</button></div>
      <div class="reader-seed"><span>선택한 id <strong data-reader-seed-id>6</strong></span><span>status <strong data-reader-seed-status>PUBLISHED · 통과</strong></span><span>visibility <strong data-reader-seed-visibility>FOLLOWERS · 실패</strong></span><span>deleted_at <strong data-reader-seed-deleted>NULL · 통과</strong></span></div>
      <div class="reader-run-grid">${command('get-hidden', 'curl -i {{BASE}}/api/labs/post-summaries/{{ID}}', '선택한 id로 요청')}${expected('공개 전용 API', 'HTTP 404', 'id 6/7/8/10 또는 없는 양수 id는 응답 DTO를 만들지 않습니다.')}</div>
      <p class="reader-note">이 실습은 익명에게도 공개되는 글만 읽습니다. 본편 2-3의 회원별 접근 정책을 구현하는 API가 아닙니다.</p>
    `, '0 이하 id 확인')}

    ${panel('invalid-id', 'L16 · 경로 id 입력', '0 이하 글 번호는 DB 조회 전에 400입니다.', '양수지만 없는 글의 404와 원인을 구분합니다.', `
      <div class="reader-flow"><div><small>GET 요청</small><strong>/api/labs/post-summaries/0</strong></div><b>→</b><div><small>입력 검사</small><strong>id ≤ 0 → 중단</strong></div><b>→</b><div><small>Reader</small><strong>호출하지 않음</strong></div></div>
      <div class="reader-run-grid">${command('get-invalid', 'curl -i {{BASE}}/api/labs/post-summaries/0', '잘못된 id 확인')}${expected('입력 경계', 'HTTP 400', 'DB 조회 전에 거절합니다.')}</div>
    `, 'DB seed 확인')}

    ${panel('db-proof', 'L16 · DB 행 관찰', 'DB 행의 세 조건으로 공개 여부를 판단하세요.', '아래 SQL은 앱 경로 밖의 DB 도구에서 직접 실행합니다.', `
      <div class="reader-sql-grid"><div class="reader-command"><header><strong>community DB에서 직접 실행</strong><small>실제 조회 전</small></header><pre><code data-reader-sql>SELECT id,title,status,visibility,deleted_at
FROM post
WHERE id IN (2,6,7,8,10);</code></pre><button type="button" data-reader-copy-sql>SQL 복사</button><p data-reader-sql-state role="status" aria-live="polite"></p></div>
      <div class="reader-seed-table"><p>seed 기준 기대 의미 · 실제 DB 조회 전</p><div><b>2</b><span>PUBLISHED · PUBLIC · NULL</span><strong>200</strong></div><div><b>6</b><span>PUBLISHED · FOLLOWERS · NULL</span><strong>404</strong></div><div><b>7</b><span>DRAFT · PUBLIC · NULL</span><strong>404</strong></div><div><b>8</b><span>PUBLISHED · PUBLIC · 삭제됨</span><strong>404</strong></div><div><b>10</b><span>HIDDEN · PUBLIC · NULL</span><strong>404</strong></div></div></div>
      <p class="reader-note">JPA·JDBC는 같은 community DB를 읽습니다. GET으로 행을 수정하지 않고, 쿼리 수는 본인 로그로 확인합니다.</p>
    `, '계약 테스트')}

    ${panel('contract-test', 'L16 · 통합 계약 테스트', '같은 계약 테스트를 두 설정에서 각각 돌리세요.', '실제 Controller·Service·Reader·community DB가 연결되는지 확인하는 테스트입니다.', `
      <div class="reader-test-lanes"><div><small>첫 실행</small><strong>reader=jpa</strong><span>id 2 → 200 · 6/7/8/10/없는 id → 404</span><em>실제 테스트 결과 · 아직 기록 전</em></div><div><small>서버/테스트 설정 전환</small><strong>reader=jdbc</strong><span>같은 요청·같은 기대값</span><em>실제 테스트 결과 · 아직 기록 전</em></div></div>
      <p class="reader-note">최소 한 번은 동일한 통합 계약 테스트를 두 설정에서 돌립니다. 이 화면은 테스트가 통과했다고 주장하지 않습니다.</p>
    `, 'Service 단위 테스트')}

    ${panel('unit-fake', 'L16 · Service 단위 테스트', 'Service의 판단만 보려면 가짜 Reader를 넣으세요.', 'DB 연결과 실제 JPA/JDBC 빈 선택은 이 단위 테스트의 대상이 아닙니다.', `
      <div class="reader-choice" role="group" aria-label="가짜 Reader의 반환값"><button type="button" data-reader-fake="found" aria-pressed="true">PostSummary 반환</button><button type="button" data-reader-fake="empty" aria-pressed="false">Optional.empty()</button></div>
      <div class="reader-bean-flow"><div><small>가짜 PostSummaryReader</small><strong>findPublic(long id)</strong><span data-reader-fake-input>Optional.of(PostSummary id 2)</span></div><b>→</b><div><small>PostSummaryService</small><strong data-reader-fake-result>정상 DTO 반환</strong><span>404 변환도 별도 확인</span></div></div>
      <p class="reader-note">실제 SQL·빈 선택·HTTP 응답은 앞 장면의 통합 테스트에서 확인합니다.</p>
    `, '계약 변경에 응용')}

    ${panel('extension', 'L16 · 실무 응용', '응답에 boardSlug를 더하면 무엇을 함께 바꿔야 할까요?', '글 2번의 게시판 slug는 community seed에서 <code>dev</code>입니다.', `
      <div class="reader-extension"><div><small>1 · 계약</small><strong>PostSummary DTO</strong><span>boardSlug 필드 추가</span></div><div><small>2 · JPA</small><strong>JpaPostSummaryReader</strong><span>Post → Board 관계에서 slug 읽기</span></div><div><small>3 · JDBC</small><strong>JdbcPostSummaryReader</strong><span>post.board_id → board.id 연결</span></div><div><small>4 · 검증</small><strong>두 설정의 계약 테스트</strong><span>id 2에서 boardSlug=dev 확인</span></div></div>
      <p class="reader-note">빈 선택 조건과 Service 생성자는 그대로 둡니다. 먼저 영향 범위를 적고 실제 코드를 바꿔 두 구현을 다시 검증하세요.</p>
    `)}

    <details class="db-journey-reference"><summary>장면별 이미지 시안 15장 보기</summary><p>시안의 예시·기대값은 실제 실행 결과가 아닙니다.</p>
      ${['01-interface-scenario','02-reader-contract','03-jpa-reader','04-jdbc-reader','05-bean-selection','06-two-beans','07-zero-beans','08-run-jpa','09-run-jdbc','10-public-only-404','11-invalid-id','12-db-seed-proof','13-contract-tests','15-unit-fake','14-board-slug-extension'].map((name) => `<a href="../../../docs/design/mockups-2026-10-16-batch20/${name}.jpg">${name}</a>`).join('')}
    </details>
  </section>`.replace(/[ \t]+\n/g, '\n');
}
