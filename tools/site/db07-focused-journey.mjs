/** DB-07: 같은 M1 첫 페이지 계약을 다섯 조회 방식으로 하나씩 비교한다. */
const screens = ['scenario', 'contract', 'baseline', 'one-method', 'derived', 'jpql', 'native', 'mybatis', 'querydsl', 'tags', 'compare', 'logs', 'cursor'];
const labels = ['상황', '공통 계약', '기준 SQL', '한 방식 선택', '파생 메서드', 'JPQL', 'native SQL', 'MyBatis', 'QueryDSL', '태그 일괄', '결과 대조', 'SQL 로그', 'cursor 확장'];
const methods = [['derived','파생 메서드'],['jpql','JPQL @Query'],['native','native SQL'],['mybatis','MyBatis XML'],['querydsl','QueryDSL']];
const escapeHtml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const nav = (name) => {
  const index = screens.indexOf(name);
  return `<footer class="db-journey-actions db07-actions"><button type="button" class="db-journey-back" data-db07-go="${screens[Math.max(0, index - 1)]}"${index ? '' : ' disabled'}>← 이전</button><span>${index + 1} / ${screens.length}</span>${index < screens.length - 1 ? `<button type="button" class="db-journey-next" data-db07-go="${screens[index + 1]}">${labels[index + 1]} →</button>` : '<a class="db-journey-next" href="DB-08-explain-hypothesis.html">다음 EXPLAIN 실습 →</a>'}</footer>`;
};
const panel = (name, kicker, title, lead, body) => `<article class="db-journey-screen db07-screen" data-db07-panel="${name}"${name === 'scenario' ? '' : ' hidden'} aria-labelledby="db07-${name}-title"><p class="db-journey-kicker">${kicker}</p><h2 id="db07-${name}-title">${title}</h2><p class="db-journey-lead">${lead}</p>${body}${nav(name)}</article>`;
const code = (key, title, snippet, note = '원문 코드 조각 · 현재 루트 앱에 바로 붙는 완성 기능 아님') => `<div class="db07-code"><header><strong>${title}</strong><small>${note}</small></header><pre><code data-db07-code="${key}">${escapeHtml(snippet)}</code></pre><button type="button" data-db07-copy="${key}">${key === 'baseline' ? 'SQL 복사' : '코드 복사'}</button><p data-db07-copy-state="${key}" role="status" aria-live="polite"></p></div>`;

export function renderDb07FocusedJourney(markdown) {
  const commonSql = markdown.match(/```sql\n([\s\S]*?)\n```/)?.[1];
  const details = [...markdown.matchAll(/<details>\s*<summary>(.*?)<\/summary>([\s\S]*?)<\/details>/g)].map((match) => match[2]);
  const snippets = details.map((body) => [...body.matchAll(/```(?:java|xml)\n([\s\S]*?)\n```/g)].map((match) => match[1]));
  if (!commonSql || details.length !== 5 || snippets.map((items) => items.length).join(',') !== '1,2,1,2,1') throw new Error('DB-07 원문 쿼리/다섯 방식 코드 조각 구조가 달라졌습니다');
  const [derived, jpql, native, mybatis, querydsl] = snippets;
  return `<section class="first-db-journey db07-focused" data-db07-screen="scenario" aria-label="DB-07 같은 API를 다섯 쿼리 방식으로">
    ${panel('scenario', 'DB-07 · 한 계약의 여러 구현', '“dev 게시판 목록을 같은 결과로 읽는 방법을 바꿔 보고 싶어요.”', '한 번에 조회 방식 하나를 골라 만들고, 같은 조건의 결과와 SQL을 대조합니다.', `
      <div class="db07-intent"><div><small>만들 것</small><strong>M1 목록의 쿼리 구현 한 방식</strong></div><div><small>직접 확인할 것</small><strong>같은 조건의 결과·SQL 로그 비교</strong></div></div>
      <p class="db07-note"><code>GET /api/boards/dev/posts?size=20&amp;cursor=</code>는 학습자 구현 계약입니다. 현재 루트 앱에는 이 HTTP API가 없습니다.</p>
    `)}
    ${panel('contract', 'DB-07 · 변하지 않는 계약', '조회 방식을 바꿔도 결과의 조건과 모양은 같아야 합니다.', '비로그인 dev 게시판의 첫 페이지를 기준으로 비교합니다.', `
      <div class="db07-contract-grid"><div><small>GET 계약</small><strong>/api/boards/dev/posts?size=20&amp;cursor=</strong><span>빈 cursor · 비로그인</span></div><div><small>WHERE · ORDER</small><strong>dev · PUBLISHED · 미삭제 · PUBLIC</strong><span>published_at DESC · id DESC · 첫 20개</span></div></div>
      <div class="db07-fields"><span>id</span><span>title</span><span>authorNickname</span><span>likeCount</span><span>commentCount</span><span>tags[]</span><span>publishedAt</span></div>
      <div class="db07-seed"><div><small>practice seed 기준 · 실행 전 기대 첫 다섯 ID</small><strong>145 · 144 · 143 · 140 · 138</strong></div><div><small>내 실제 API/쿼리 결과</small><strong>아직 실행 전</strong></div></div>
      <p class="db07-note"><code>content</code>는 목록 응답에 없습니다. 위 기대 ID는 현재 서버의 실측 응답이 아닙니다.</p>
    `)}
    ${panel('baseline', 'DB-07 · 모든 방식의 기준', '다섯 구현이 지켜야 할 첫 SQL을 직접 읽으세요.', '같은 WHERE·JOIN·ORDER BY·LIMIT으로 첫 페이지를 고르는 읽기 전용 쿼리입니다.', `
      <div class="db07-baseline-grid">${code('baseline', 'DB-01에서 이어 온 원문 기준 SQL', commonSql, 'practice DB · 읽기 전용 · 실행 전')}<aside class="db07-baseline-result"><div><small>practice seed 기준 · 실행 전 기대 첫 다섯 ID</small><strong>145 · 144 · 143 · 140 · 138</strong><span>지금 서버 응답을 측정한 값이 아닙니다.</span></div><div><small>내 실제 DB SELECT 결과</small><strong>아직 실행 전</strong><span>복사한 SQL을 practice DB에서 실행해 비교하세요.</span></div></aside></div>
      <p class="db07-note">이 SQL은 글의 목록 기본 정보만 읽습니다. <code>tags[]</code>는 페이지 글 ID로 별도 일괄 조회하고, <code>content</code>는 목록에서 제외합니다.</p>
    `)}
    ${panel('one-method', 'DB-07 · 계층 경계', '같은 요청에서 조회 방식은 정확히 하나만 선택합니다.', 'Controller와 Service, 응답 DTO는 공통이고 데이터 접근 방식만 교체합니다.', `
      <div class="db07-layer-flow"><span>요청</span><b>→</b><span>Controller</span><b>→</b><span>Service</span><b>→</b><span data-db07-selected-method>파생 메서드 한 개</span><b>→</b><span>MySQL</span><b>→</b><span>DTO</span></div>
      <div class="db07-method-choice" role="group" aria-label="설명할 조회 방식">${methods.map(([key,name],i) => `<button type="button" data-db07-method="${key}" aria-pressed="${i === 0}">${name}</button>`).join('')}</div>
      <p class="db07-note">이 선택은 계층 역할을 설명하는 조작입니다. 실행 중인 Spring 빈이나 서버 쿼리를 바꾸지 않습니다.</p>
    `)}
    ${panel('derived', 'DB-07 · 파생 메서드', '메서드 이름에서 첫 페이지 조건과 정렬을 읽습니다.', 'Board_Slug는 Java 연관 경로이고 DeletedAtIsNull은 미삭제 조건입니다.', `
      <div class="db07-tokens"><span>findTop20By</span><span>Board_Slug</span><span>Status</span><span>DeletedAtIsNull</span><span>Visibility</span><span>OrderByPublishedAtDescIdDesc</span></div>
      ${code('derived', 'PostListRepository.java · 원문 선언', derived[0])}
      <p class="db07-note"><code>Top20</code>은 고정 첫 페이지 상한입니다. 임의 size·opaque cursor와 DTO의 작성자·태그 로딩은 별도 설계가 필요합니다.</p>
    `)}
    ${panel('jpql', 'DB-07 · JPQL @Query', '엔티티 경로를 따라 필요한 값만 DTO 행으로 고릅니다.', 'SQL 테이블·열 이름이 아니라 Post의 Java 속성과 관계를 사용합니다.', `
      <div class="db07-paths"><span>Post p</span><span>p.board · p.author</span><span>p.deletedAt</span><span>PostListRow</span></div>
      ${code('jpql', 'PostListRepository.java · JPQL 원문', jpql[1])}
      <p class="db07-note"><code>PageRequest.of(0, 20)</code>은 첫 페이지 학습 예시입니다. offset Pageable이 M1의 opaque cursor 계약을 대체하지 않으며, <code>Page</code>는 count SQL을 더 보낼 수 있습니다. <code>tags[]</code>는 별도 조회합니다.</p>
    `)}
    ${panel('native', 'DB-07 · native SQL', '테이블·열 이름으로 작성한 SQL을 Repository에 둡니다.', '반환 alias가 projection getter에 맞는지 통합 테스트로 확인해야 합니다.', `
      <div class="db07-paths"><span>board b</span><span>post p · board_id</span><span>member m · author_id</span><span>alias → projection</span></div>
      ${code('native', 'PostListRepository.java · nativeQuery=true 원문', native[0])}
      <p class="db07-note"><code>:slug</code>는 바인딩 파라미터입니다. 사용자 입력을 SQL 문자열에 이어 붙이지 않습니다. provider별 alias 매핑은 실제 실행으로 확인하세요.</p>
    `)}
    ${panel('mybatis', 'DB-07 · MyBatis XML', 'Mapper 메서드와 XML SELECT를 같은 이름으로 연결합니다.', 'SQL을 직접 관리하므로 조건·정렬·페이지 제한을 스스로 일치시켜야 합니다.', `
      <div class="db07-mapper-flow"><div><small>PostListMapper.java</small><strong>findFirstPage(slug)</strong></div><b>→</b><div><small>PostListMapper.xml</small><strong>select id=findFirstPage</strong></div><b>→</b><div><small>MySQL</small><strong>작성한 SELECT 실행</strong></div></div>
      ${code('mybatis', 'PostListMapper.xml · 원문 SELECT', mybatis[1])}
      <div class="db07-binding"><span><code>#{slug}</code> · 값 바인딩</span><span><code>\${slug}</code> · SQL 텍스트 치환, 사용자 입력 금지</span></div>
      <p class="db07-note"><code>tags[]</code>는 반환된 페이지 ID를 모아 두 번째 Mapper 조회로 채웁니다.</p>
    `)}
    ${panel('querydsl', 'DB-07 · QueryDSL', 'QPost와 BooleanBuilder로 같은 필터를 조립합니다.', '조건이 선택적일 때 필요한 조건만 더하기 쉽지만 Q 타입 생성 설정이 필요합니다.', `
      <div class="db07-paths"><span>QPost p</span><span>BooleanBuilder</span><span>board · status · deleted · visibility</span><span>orderBy · limit20</span></div>
      ${code('querydsl', 'PostListRepositoryCustomImpl.java · 원문 핵심', querydsl[0])}
      <p class="db07-note">QPost는 L14 OpenFeign QueryDSL overlay의 annotation processor가 생성합니다. 현재 루트 <code>build.gradle</code>의 기능으로 표시하지 않습니다.</p>
    `)}
    ${panel('tags', 'DB-07 · 태그 일괄 조회', '글 페이지를 먼저 확정하고 그 ID의 태그를 한 번에 읽습니다.', '태그를 메인 목록 JOIN에 넣어 페이지 글 행을 늘리지 않습니다.', `
      <div class="db07-tag-steps"><div><small>1 · 메인 목록</small><strong>공개·미삭제 글 LIMIT 20</strong><span>published_at DESC · id DESC</span></div><b>→</b><div><small>2 · 현재 페이지</small><strong>반환된 글 ID만 수집</strong><span>seed 기준 첫 다섯: 145 · 144 · 143 · 140 · 138</span></div><b>→</b><div><small>3 · 태그 배치</small><strong>post_tag JOIN tag</strong><span>WHERE pt.post_id IN (:ids) → tags[]</span></div></div>
      <p class="db07-note">기대 ID는 seed 참조일 뿐, 내 실제 결과는 아직 실행 전입니다. <a href="db-01-response-to-query.html">DB-01 태그 일괄 SQL</a>에서 직접 실행할 수 있습니다.</p>
    `)}
    ${panel('compare', 'DB-07 · 다섯 방식 대조', '같은 조건으로 한 구현씩 실행해 ID 순서를 기록하세요.', '구현한 M1 API 또는 L12–L14 실습의 쿼리 함수를 같은 파라미터로 확인합니다.', `
      <p class="db07-compare-contract"><b>공통:</b> slug=dev · size=20 · cursor 비어 있음 <span>seed 기준 첫 다섯 ID 145 · 144 · 143 · 140 · 138</span></p>
      <div class="db07-record-grid">${methods.map(([key,name]) => `<label><strong>${name}</strong><textarea data-db07-record="${key}" rows="3" placeholder="아직 실행 전 · 실제 글 ID를 순서대로 기록"></textarea></label>`).join('')}</div>
      <p class="db07-compare-status" data-db07-compare-status role="status" aria-live="polite">각 구현을 하나씩 실행한 뒤 실제 첫 다섯 ID를 기록하세요.</p>
      <p class="db07-note">이 화면은 입력한 기록끼리 비교합니다. 서버 호출·쿼리 실행·채점이 자동으로 이루어지는 것은 아닙니다.</p>
    `)}
    ${panel('logs', 'DB-07 · 실제 SQL 찾기', 'Java 문법 뒤의 SQL과 바인딩 값을 함께 확인하세요.', '같은 계약이어도 어떤 SQL이 실행됐는지는 로그와 DB에서 확인해야 합니다.', `
      <div class="db07-log-lanes"><div><small>파생·JPQL·QueryDSL</small><strong>Hibernate SQL + bind 로그</strong></div><div><small>native SQL</small><strong>작성 SQL + projection alias</strong></div><div><small>MyBatis XML</small><strong>Mapper statement + JDBC SQL</strong></div></div>
      <div class="db07-checks"><span>WHERE</span><span>JOIN</span><span>ORDER BY</span><span>LIMIT</span><span>바인딩 값</span></div>
      <label class="db07-log-record">내 실제 SQL·MySQL SELECT 관찰<textarea data-db07-log rows="4" placeholder="아직 기록 전 · 실행 로그와 별도 DB SELECT 결과를 구분해 적으세요"></textarea></label>
      <p class="db07-note">SQL 로그만으로 실행 시간·인덱스 효율을 결론 내릴 수 없습니다. <code>EXPLAIN</code>은 계획이며 SELECT의 결과 행이 아닙니다.</p>
    `)}
    ${panel('cursor', 'DB-07 · 다음 페이지로 응용', '첫 페이지 예시가 같아도 cursor 구현은 별도입니다.', 'M1의 다음 페이지는 마지막 글의 (published_at, id) 뒤에서 시작합니다.', `
      <div class="db07-cursor"><div><small>여기서 비교한 고정 첫 페이지 예시</small><strong>Top20</strong><strong>PageRequest.of(0, 20)</strong><strong>LIMIT 20</strong></div><div><small>실제 M1 계약에 더 필요한 것</small><strong>요청 size + opaque cursor</strong><span>DB-02의 keyset WHERE · 마지막 (published_at, id)</span><span>같은 7개 필드 DTO · 별도 tags[] 배치</span></div></div>
      <p class="db07-note">위 다섯 코드 조각 자체는 가변 size와 다음 페이지 cursor를 완성하지 않습니다. <a href="db-02-select-cursor.html">DB-02의 커서 SQL</a>을 선택한 구현 방식에 옮기세요.</p>
    `)}
    <details class="db-journey-reference"><summary>장면별 이미지 시안 13장 보기</summary>${['01-db07-scenario','02-common-contract','03-baseline-sql','04-one-adapter','05-derived-method','06-jpql-projection','07-native-sql','08-mybatis-xml','09-querydsl','10-tags-batch','11-five-way-compare','12-sql-logs','13-cursor-extension'].map((name) => `<a href="../../docs/design/mockups-2026-10-16-batch28/${name}.jpg">${name}</a>`).join('')}</details>
  </section>`;
}
