/** DB-05: 합성 2×3 행 곱셈과 실무 집계 경계를 한 장면씩 보여 준다. */
const screens = ['scenario', 'inputs', 'fanout', 'wrong-count', 'scratch', 'preaggregate', 'm6', 'm9', 'debug'];
const labels = ['상황', '원본 행', 'JOIN 6행', '잘못된 COUNT', '직접 SELECT', '사전 집계', 'M6 기간', 'M9 활동', '디버깅'];
const escapeHtml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const decodeSource = (value) => value.replaceAll('&gt;', '>').replaceAll('&lt;', '<').replaceAll('&amp;', '&');
const nav = (name) => {
  const index = screens.indexOf(name);
  return `<footer class="db-journey-actions db05-actions"><button type="button" class="db-journey-back" data-db05-go="${screens[Math.max(0, index - 1)]}"${index ? '' : ' disabled'}>← 이전</button><span>${index + 1} / ${screens.length}</span>${index < screens.length - 1 ? `<button type="button" class="db-journey-next" data-db05-go="${screens[index + 1]}">${labels[index + 1]} →</button>` : '<a class="db-journey-next" href="db-06-exists-not-exists.html">다음 DB-06 →</a>'}</footer>`;
};
const panel = (name, kicker, title, lead, body) => `<article class="db-journey-screen db05-screen" data-db05-panel="${name}"${name === 'scenario' ? '' : ' hidden'} aria-labelledby="db05-${name}-title"><p class="db-journey-kicker">${kicker}</p><h2 id="db05-${name}-title">${title}</h2><p class="db-journey-lead">${lead}</p>${body}${nav(name)}</article>`;
const code = (key, title, sql, buttonLabel = 'SQL 복사') => `<div class="db05-code"><header><strong>${title}</strong><small>${key === 'scratch' ? '합성 CTE · 읽기 전용' : '원문 집계 SQL'}</small></header><pre><code data-db05-sql="${key}">${escapeHtml(sql)}</code></pre><button type="button" data-db05-copy="${key}">${buttonLabel}</button><p data-db05-copy-state="${key}" role="status" aria-live="polite"></p></div>`;
const pairs = [[41,71],[41,72],[41,73],[42,71],[42,72],[42,73]];

export function renderDb05FocusedJourney(markdown) {
  const scratch = markdown.match(/<!-- DB05_SYNTHETIC_SQL -->\s*```sql\n([\s\S]*?)\n```/)?.[1];
  const originalSql = [...markdown.matchAll(/<pre class="sql"><code>([\s\S]*?)<\/code><\/pre>/g)].map((match) => decodeSource(match[1]));
  if (!scratch || originalSql.length !== 3) throw new Error(`DB-05 원문 SQL 4개가 필요합니다: scratch=${!!scratch}, original=${originalSql.length}`);
  const [wrongSql, safeSql, popularSql] = originalSql;
  return `<section class="first-db-journey db05-focused" data-db05-screen="scenario" aria-label="DB-05 좋아요와 댓글 JOIN 곱셈">
    ${panel('scenario', 'DB-05 · 집계 값의 이상', '“좋아요와 댓글 수를 한 번에 세었더니 숫자가 커졌어요.”', '두 1:N 관계를 한꺼번에 붙였을 때 무엇을 세고 있는지 찾아봅니다.', `
      <div class="db05-intent"><div><small>만들 것</small><strong>좋아요·댓글을 각각 정확히 세는 집계 SQL</strong></div><div><small>직접 할 것</small><strong>설명용 행 조합을 읽기 전용 SELECT로 재현</strong></div></div>
      <p class="db05-note">뒤에서 M6 인기글과 M9 회원 활동 요약에 같은 판단을 적용합니다.</p>
    `)}
    ${panel('inputs', 'DB-05 · 설명용 원본 행', '좋아요 둘과 댓글 셋이 따로 있습니다.', '특정 게시글의 practice seed가 아닌 합성 예시입니다.', `
      <div class="db05-source-rows"><div><small>좋아요 원본 · 2행</small><strong>like 41</strong><strong>like 42</strong></div><div><small>댓글 원본 · 3행</small><strong>comment 71</strong><strong>comment 72</strong><strong>comment 73</strong></div></div>
      <p class="db05-note">둘 다 같은 가상 글에 연결됐다고 가정합니다. 아직 JOIN 결과는 보지 않았습니다.</p>
    `)}
    ${panel('fanout', 'DB-05 · 행 곱셈', '두 1:N 관계가 만나면 2×3, 여섯 행이 됩니다.', '하나의 좋아요가 댓글 셋과 각각 짝지어지는 것을 눌러 확인하세요.', `
      <div class="db05-like-choice" role="group" aria-label="강조할 좋아요"><button type="button" data-db05-like="41" aria-pressed="true">like 41</button><button type="button" data-db05-like="42" aria-pressed="false">like 42</button></div>
      <div class="db05-matrix" role="table" aria-label="좋아요 두 행과 댓글 세 행의 여섯 조합"><div class="db05-matrix-head">like × comment</div><div class="db05-matrix-head">71</div><div class="db05-matrix-head">72</div><div class="db05-matrix-head">73</div>${[41,42].map((like) => `<div class="db05-matrix-label">${like}</div>${[71,72,73].map((comment) => `<div class="db05-matrix-cell" data-db05-matrix-like="${like}">${like} × ${comment}</div>`).join('')}`).join('')}</div>
      <div class="db05-count-line"><span>좋아요 원본 <b>2</b></span><span>댓글 원본 <b>3</b></span><strong>JOIN 결과 <b>6행</b></strong></div><p class="db05-note">이 여섯 조합은 합성 예시의 기대 형태입니다. 실제 DB에서 관찰한 결과가 아닙니다.</p>
    `)}
    ${panel('wrong-count', 'DB-05 · 무엇을 세었나', 'JOIN 직후 COUNT는 원본 행을 중복해서 셉니다.', '각 like는 댓글 셋과, 각 comment는 좋아요 둘과 만납니다.', `
      <div class="db05-count-compare"><div><small>원시 JOIN 뒤 잘못된 집계 · 합성 예시</small><strong>COUNT(pl.id) = 6</strong><strong>COUNT(c.id) = 6</strong></div><div><small>원본 관계의 실제 개수 · 합성 예시</small><strong>좋아요 = 2</strong><strong>댓글 = 3</strong></div></div>
      <p class="db05-note">같은 값이 여러 JOIN 행에 반복되므로 <code>SUM</code>도 커질 수 있습니다. <code>COUNT(DISTINCT ...)</code>는 개수 보정일 뿐 모든 가중 합계를 고치지 않습니다.</p>
      <details class="db05-inline-source"><summary>원문의 잘못된 쿼리 구조 보기</summary><pre><code>${escapeHtml(wrongSql)}</code></pre></details>
    `)}
    ${panel('scratch', 'DB-05 · DB에서 직접 재현', '합성 2×3을 읽기 전용 SELECT로 확인하세요.', 'CTE가 쿼리 안에서만 다섯 행을 만들며 실제 테이블은 읽거나 바꾸지 않습니다.', `
      <div class="db05-query-grid">${code('scratch', '합성 CTE · 실행 가능한 SELECT', scratch)}<aside class="db05-result"><div><small>합성 데이터 기준 · 실행 전 기대</small><strong>여섯 쌍</strong><span>${pairs.map(([like,comment]) => `${like}×${comment}`).join(' · ')}</span></div><div><small>내 SQL 편집기의 실제 결과</small><strong>아직 실행 전</strong><span>실행 뒤 여섯 행을 대조하세요.</span></div></aside></div>
      <p class="db05-note">공통 키 <code>synthetic</code>은 실제 게시글 id가 아닙니다. DB에 INSERT하지 않습니다.</p>
    `)}
    ${panel('preaggregate', 'DB-05 · 안전한 기본형', '각 관계를 먼저 한 행로 세고 붙이세요.', '좋아요와 댓글을 각각 post_id별로 집계하면 두 원본 관계가 서로 곱해지지 않습니다.', `
      <div class="db05-preagg"><div><small>like 41 · 42</small><strong>GROUP BY post_id</strong><span>like_count = 2</span></div><div><small>comment 71 · 72 · 73</small><strong>GROUP BY post_id</strong><span>comment_count = 3</span></div><div><small>post에 각각 LEFT JOIN</small><strong>한 글 · 2 / 3</strong><span>COALESCE(NULL, 0)</span></div></div>
      <div class="db05-query-grid">${code('safe', '원문 사전 집계 SQL · 실제 DB 값 미측정', safeSql)}<aside class="db05-result"><div><small>합성 2×3에서 배운 결과 형태</small><strong>좋아요 2 · 댓글 3</strong><span>원문 SQL이 실제 DB에서 같은 숫자를 낸다는 뜻은 아닙니다.</span></div><div><small>내 DB의 실제 결과</small><strong>아직 실행 전</strong><span>실제 게시글별 개수는 직접 확인하세요.</span></div></aside></div>
    `)}
    ${panel('m6', 'DB-05 · M6 인기글 응용', '기간 필터는 좋아요·댓글 집계 안에 각각 넣습니다.', 'M6의 인기 점수는 최근 기간의 좋아요×3과 삭제되지 않은 댓글을 더합니다.', `
      <div class="db05-period"><div><small>post_like.created_at</small><strong>[since, now)</strong><span>기간 안 좋아요</span></div><div><small>comment.created_at</small><strong>[since, now)</strong><span>deleted_at IS NULL</span></div><div><small>score</small><strong>likes_in_period × 3 + comments_in_period</strong><span>동점: published_at DESC → id DESC</span></div></div>
      <div class="db05-query-grid">${code('m6', 'M6 원문 SQL 뼈대', popularSql, '뼈대 복사')}<aside class="db05-result"><div><small>구현할 API 계약</small><strong>GET /api/posts/popular?days=7</strong><span>비로그인 공개 글 · 상위 10개</span></div><div><small>내 서버/DB의 실제 결과</small><strong>아직 실행 전</strong><span><code>:since</code>, <code>:now</code>는 구현에서 바인딩합니다.</span></div></aside></div>
      <p class="db05-note">원문의 이름 있는 파라미터는 SQL 클라이언트에 그대로 붙여 실행할 리터럴이 아닙니다. 서버 구현 또는 실습 환경에서 값을 바인딩하세요.</p>
    `)}
    ${panel('m9', 'DB-05 · M9 활동 요약 응용', '활동이 없는 회원도 결과에서 0으로 남겨야 합니다.', '회원별 네 활동을 각각 집계한 뒤 회원을 기준으로 LEFT JOIN합니다.', `
      <div class="db05-activity"><div><small>각각 별도 집계</small><span>쓴 글 · 삭제 제외</span><span>쓴 댓글</span><span>받은 좋아요</span><span>누른 좋아요</span></div><b>→</b><div><small>M9-1 기대 계약 · 회원 30</small><strong>0 · 0 · 0 · 0</strong><span>COALESCE로 NULL을 0으로</span></div></div>
      <p class="db05-note">회원 30이 활동 없는 회원이라는 점은 M9 미션 계약입니다. 위 네 값은 학습자의 실제 DB 실행 결과가 아닙니다.</p>
    `)}
    ${panel('debug', 'DB-05 · 실무 디버깅', '집계가 이상할 때 한 행의 뜻부터 확인하세요.', '내 SQL과 DB 결과를 단계별로 기록하며 원인을 좁힙니다.', `
      <ol class="db05-debug-steps"><li>각 원본 관계의 행 수를 따로 센다.</li><li>JOIN을 하나씩 추가하며 결과 행 수를 본다.</li><li>현재 결과의 한 행이 무엇인지 말로 적는다.</li><li>각 1:N 관계를 먼저 집계한 뒤 붙인다.</li></ol>
      <label class="db05-observation">내 SQL·DB 관찰 기록<textarea data-db05-observation rows="4" placeholder="실제로 실행한 SQL, 원본 행 수, JOIN 뒤 행 수를 적어 보세요. 이 내용은 서버에 저장되지 않습니다."></textarea></label>
      <p class="db05-note"><code>COUNT(DISTINCT ...)</code>는 개수만 보정할 수 있습니다. 임의의 SUM·가중치 점수를 자동으로 바로잡지 않습니다.</p>
    `)}
    <details class="db-journey-reference"><summary>장면별 이미지 시안 9장 보기</summary>${['01-db05-scenario','02-synthetic-inputs','03-fanout-matrix','04-count-distortion','05-scratch-select','06-preaggregate','07-m6-period-score','08-m9-activity','09-debugging-gate'].map((name) => `<a href="../../docs/design/mockups-2026-10-16-batch26/${name}.jpg">${name}</a>`).join('')}</details>
  </section>`;
}
