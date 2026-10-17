/** DB-02: 첫 페이지의 마지막 행에서 다음 페이지의 커서를 만든다. */
const screens = ['scenario', 'rows', 'cursor', 'sql', 'insertion'];
const labels = ['상황', '정렬된 행', '커서', '다음 SQL', '삽입 비교'];
const nav = (name) => {
  const index = screens.indexOf(name);
  return `<footer class="db-journey-actions db02-actions"><button type="button" class="db-journey-back" data-db02-go="${screens[Math.max(0, index - 1)]}"${index ? '' : ' disabled'}>← 이전</button><span>${index + 1} / ${screens.length}</span>${index < screens.length - 1 ? `<button type="button" class="db-journey-next" data-db02-go="${screens[index + 1]}">${labels[index + 1]} →</button>` : '<a class="db-journey-next" href="db-03-detail-join.html">다음 DB-03 →</a>'}</footer>`;
};
const panel = (name, kicker, title, lead, body) => `<article class="db-journey-screen db02-screen" data-db02-panel="${name}"${name === 'scenario' ? '' : ' hidden'} aria-labelledby="db02-${name}-title"><p class="db-journey-kicker">${kicker}</p><h2 id="db02-${name}-title">${title}</h2><p class="db-journey-lead">${lead}</p>${body}${nav(name)}</article>`;
const rows = [['145', '2026-10-03 10:10:08'], ['144', '2026-10-02 21:57:53'], ['143', '2026-10-02 08:42:47'], ['140', '2026-09-26 13:03:17']];

export function renderDb02FocusedJourney() {
  return `<section class="first-db-journey db02-focused" data-db02-screen="scenario" aria-label="DB-02 첫 페이지와 커서 SQL">
    ${panel('scenario', 'DB-02 · 다음 페이지의 시작점', '첫 페이지 다음에는 어떤 글부터 보여 줄까요?', 'dev 게시판의 목록을 안정적인 순서로 이어서 가져오는 SQL을 만듭니다.', `
      <div class="db02-intent"><div><small>만들 것</small><strong>dev 게시판 목록의 커서 SQL</strong></div><div><small>직접 할 것</small><strong>practice DB에서 읽기 전용 SELECT</strong><span>페이지 크기 2</span></div></div>
      <p class="db02-note">현재 체크아웃에는 M1 HTTP API가 없습니다. 이 실습은 DB 클라이언트에서 직접 SQL을 실행합니다.</p>
    `)}
    ${panel('rows', 'DB-02 · 정렬 기준', '같은 순서로 첫 두 행을 고르세요.', '먼저 발행 시각을 내림차순으로, 같은 시각이면 id를 내림차순으로 정렬합니다.', `
      <div class="db02-tables"><div class="db02-seed"><small>practice seed 기준 · 실행 전 기대 순서</small><table><thead><tr><th>id</th><th>published_at</th></tr></thead><tbody>${rows.map(([id, date], index) => `<tr${index < 2 ? ' class="first-page"' : ''}><td>${id}</td><td>${date}</td></tr>`).join('')}</tbody></table></div><div class="db02-actual"><small>내 DB의 실제 SELECT 결과</small><strong>아직 실행 전</strong><p>읽기 전용 SELECT를 실행해 순서를 비교하세요.</p></div></div>
      <div class="db02-rule">ORDER BY <strong>p.published_at DESC, p.id DESC</strong><span>id는 같은 시각의 순서를 고정합니다.</span></div>
      <a class="db02-source" href="#먼저-sql을-직접-확장하기" data-db02-source>정렬·SQL 원문 열기 ↗</a>
    `)}
    ${panel('cursor', 'DB-02 · 마지막 행의 경계', '첫 페이지의 마지막 행 144를 커서로 쓰세요.', 'size=2로 두 행을 반환했다면, 첫 행 145가 아니라 마지막 행 144의 두 값을 보냅니다.', `
      <div class="db02-pair"><div><small>첫 페이지 · seed 기대 순서</small><strong>145 → <em>144</em></strong><span>마지막 반환 행 선택</span></div><b>→</b><div><small>다음 커서</small><code>cursorPublishedAt = 2026-10-02 21:57:53</code><code>cursorId = 144</code></div></div>
      <p class="db02-note"><code>published_at</code>만 쓰면 같은 시각의 다른 글을 건너뛸 수 있습니다. 정렬에 사용한 id도 커서에 담습니다.</p>
      <a class="db02-source" href="#db02-original" data-db02-source>두 열 비교 설명 열기 ↗</a>
    `)}
    ${panel('sql', 'DB-02 · 직접 실행', '커서보다 뒤에 있는 글을 SQL로 읽으세요.', 'size=2의 다음 페이지와 hasNext 확인을 위해 최대 3행을 조회합니다.', `
      <div class="db02-query-grid"><div class="db02-code"><header><strong>practice DB · 읽기 전용</strong><small>실제 실행 전</small></header><pre><code data-db02-sql>SELECT p.id, p.title, p.published_at
FROM board b
JOIN post p ON p.board_id = b.id
WHERE b.slug = 'dev'
  AND p.status = 'PUBLISHED'
  AND p.deleted_at IS NULL
  AND p.visibility = 'PUBLIC'
  AND (
      p.published_at &lt; '2026-10-02 21:57:53'
      OR (p.published_at = '2026-10-02 21:57:53' AND p.id &lt; 144)
  )
ORDER BY p.published_at DESC, p.id DESC
LIMIT 3;</code></pre><button type="button" data-db02-copy>SQL 복사</button><p data-db02-copy-state role="status" aria-live="polite"></p></div><aside class="db02-results"><div><small>practice seed 기준 · 반환할 두 행</small><strong>143 → 140</strong><span>세 번째 조회 행은 hasNext 판정에만 사용</span></div><div><small>내 DB의 실제 결과</small><strong>아직 실행 전</strong><span>SQL을 실행해 직접 대조하세요.</span></div></aside></div>
      <p class="db02-note">실제 앱에서는 커서 값과 size를 SQL 파라미터로 바인딩합니다. 이 화면은 seed 값을 넣은 읽기 전용 연습 SQL입니다.</p>
    `)}
    ${panel('insertion', 'DB-02 · 새 글이 앞에 들어오면', 'offset은 이전 글을 다시 보여 줄 수 있습니다.', '아래는 개념 시뮬레이션입니다. 실제 practice DB의 행을 추가하거나 변경하지 않습니다.', `
      <div class="db02-compare"><div><small>삽입 전</small><strong>첫 페이지 145 · 144</strong><span>다음 페이지 143 · 140</span></div><b>↓ NEW 글이 맨 앞에 삽입된다고 가정</b><div><small>offset 2</small><strong>144 · 143</strong><span>이미 본 144가 다시 나올 수 있음</span></div><div><small>cursor · 마지막 행 144의 두 키</small><strong>143 · 140</strong><span>앞에 새 행이 생겨도 경계 뒤에서 계속</span></div></div>
      <p class="db02-note">두 방식 모두 <code>published_at DESC, id DESC</code>라는 안정적인 정렬 기준으로 비교합니다. 성능 수치는 측정하지 않았습니다.</p>
      <a class="db02-source" href="#같은-데이터에서-offset과-비교하기" data-db02-source>offset 비교 원문 열기 ↗</a>
    `)}
    <details class="db-journey-reference"><summary>장면별 이미지 시안 5장 보기</summary>${['01-db02-scenario','02-sort-rows','03-cursor-boundary','04-next-page-sql','05-offset-insert'].map((name) => `<a href="../../docs/design/mockups-2026-10-16-batch23/${name}.png">${name}</a>`).join('')}</details>
  </section>`;
}
