import { getFunctionalVisualModel, getFunctionalFieldLinks } from './functional-visual-model.mjs';

// 브라우저에서도 쓰는 순수 렌더러. 설명용 모델 외의 폼·서버·저장소에는 접근하지 않는다.
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const json = value => esc(JSON.stringify(value));
const value = v => v == null ? '<span class="fqv-null">null</span>' : esc(v);
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const author = id => ({ memberIdU: 'U · 기준 회원', memberIdOther: '다른 회원', memberIdFollowed: 'C · 작성자', memberIdBlocked: 'D · 작성자' }[id] || id);
const why = row => row.included ? row.visibilityReasons.public ? 'PUBLIC' : row.visibilityReasons.isAuthor ? '작성자 본인' : '작성자 팔로우' : row.excludedBy.map(k => ({ board: '다른 게시판', notDeleted: '삭제 시각 있음', published: 'PUBLISHED 아님', visible: '공개·본인·팔로우 불일치', noBlock: '양방향 중 차단 존재' }[k])).join(' · ');
const badge = (text, cls = '') => `<span class="fqv-chip ${cls}">${esc(text)}</span>`;
function table(caption, headers, rows, attr = '') {
  return `<div class="fqv-table-scroll" tabindex="0" role="region" aria-label="${esc(caption)}"><table ${attr}><caption>${esc(caption)}${headers.length > 2 ? '<span class="fqv-scroll-hint">좌우로 밀어 모든 열을 확인하세요.</span>' : ''}</caption><thead><tr>${headers.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>${rows.length ? '' : '<p class="fqv-empty">∅ · 연결 없음 (0개)</p>'}</div>`;
}
const row = cells => `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
const opt = (val, label, selected) => `<option value="${esc(val)}"${val === selected ? ' selected' : ''}>${esc(label)}</option>`;
function select(name, label, choices, selected) {
  return `<label class="fqv-control"><span>${esc(label)}</span><select data-fqv-control="${name}">${choices.map(([v, l]) => opt(v, l, selected)).join('')}</select></label>`;
}
function listVisual(stateId, options) {
  const initial = {
    viewer: options.viewerId === null ? 'anonymous' : options.viewerId === 'memberIdAdmin' ? 'admin' : 'member',
    follow: options.follows?.length === 0 ? 'off' : 'on',
    block: options.blocks?.length === 0 ? 'none' : options.blocks?.[0]?.[0] === 'memberIdBlocked' ? 'in' : 'out',
    estatus: options.rowOverrides?.E?.status || 'DRAFT', fboard: options.rowOverrides?.F?.boardId === 'boardIdDev' ? 'dev' : 'other',
    fdeleted: options.rowOverrides?.F?.deletedAt === null ? 'no' : 'yes', page: options.page ?? 0,
  };
  const ui = { ...initial, ...options.queryControls };
  const modelOptions = { ...options, size: options.size ?? 2, page: ui.page,
    viewerId: ui.viewer === 'anonymous' ? null : ui.viewer === 'admin' ? 'memberIdAdmin' : 'memberIdU',
    follows: ui.follow === 'on' ? [['memberIdU', 'memberIdFollowed']] : [],
    blocks: ui.block === 'none' ? [] : ui.block === 'in' ? [['memberIdBlocked', 'memberIdU']] : [['memberIdU', 'memberIdBlocked']],
    rowOverrides: { ...options.rowOverrides, E: { ...options.rowOverrides?.E, status: ui.estatus }, F: { ...options.rowOverrides?.F, boardId: ui.fboard === 'dev' ? 'boardIdDev' : 'boardIdOther', deletedAt: ui.fdeleted === 'no' ? null : 'tDelete' } },
  };
  const model = getFunctionalVisualModel('list', stateId, modelOptions);
  const list = model.list;
  const items = new Set(list.items.map(r => r.key));
  const controls = `<div class="fqv-controls" aria-label="설명용 목록 조건">${select('viewer', '조회자', [['member', '회원 U'], ['anonymous', '익명'], ['admin', '운영자 ADMIN']], ui.viewer)}${select('follow', 'U → C 작성자 팔로우', [['on', '팔로우함'], ['off', '팔로우 안 함']], ui.follow)}${select('block', 'U와 D 작성자 차단', [['out', 'U → D 차단'], ['in', 'D → U 역방향 차단'], ['none', '차단 없음']], ui.block)}</div>`;
  const candidates = list.rows.map(r => `<tr data-fqv-candidate data-fqv-row="${esc(r.key)}" data-included="${r.included}" class="${r.included ? 'fqv-included' : 'fqv-excluded'}"><th scope="row">${esc(r.key)}<small>${esc(r.id)}</small></th><td>${esc(author(r.authorId))}</td><td><code>${esc(r.status)}</code><small>${esc(r.visibility)}</small></td><td>${r.boardId === 'boardIdDev' ? 'dev' : '다른 게시판'}<small>deletedAt: ${value(r.deletedAt)}</small></td><td><strong class="fqv-verdict">${r.included ? '포함' : '제외'}</strong><small>${esc(why(r))}</small></td></tr>`);
  const sorted = list.countRows.map((r, i) => `<li class="${items.has(r.key) ? 'fqv-slice' : ''}"><span class="fqv-rank">${i + 1}</span><strong>${esc(r.key)}</strong><small>${esc(r.publishedAt)} · ${esc(r.id)}</small><span>${items.has(r.key) ? '현재 items' : '다른 페이지'}</span></li>`).join('');
  const body = `<header class="fqv-heading"><div><p class="fqv-kicker">조건 → 정렬 → 페이지</p><h3>같은 조건에서 목록과 COUNT를 나눕니다</h3></div><span class="fqv-model-label">설명용 · 서버·DB 미실행</span></header><p class="fqv-notice"><strong>6개 가상 행 A–F로 조건을 비교합니다.</strong> 앞서 작성한 글과 별도의 설명용 사례이며 실제 DB 전체 건수가 아닙니다. 아래 size=${list.size}는 설명용 조작값입니다. 실제 API 기본 size=10${list.size === 10 ? '과 같은 값입니다' : '과 다릅니다'}.</p>${controls}<div class="fqv-condition-line">${['board = dev', 'deletedAt IS NULL', 'status = PUBLISHED', 'PUBLIC 또는 본인 또는 팔로우', '로그인 시 양방향 차단 제외'].map(t => badge(t)).join('<span aria-hidden="true">∧</span>')}</div><p class="fqv-context">${ui.viewer === 'anonymous' ? '익명에는 특정 회원 U의 팔로우·차단 관계를 적용하지 않습니다.' : ui.viewer === 'admin' ? 'ADMIN도 이 목록 WHERE의 PUBLISHED·공개 범위 조건을 우회하지 않습니다. U의 관계는 ADMIN의 관계가 아닙니다.' : '본인 글 B는 FOLLOWERS여도 포함됩니다. 공개 글도 양방향 차단이 있으면 제외됩니다.'}</p>${table('가상 후보 6개 · 각 행이 포함되거나 제외되는 이유', ['행 / id', '작성자', '상태 / 공개 범위', '게시판 / 삭제', '같은 WHERE 판정'], candidates, 'class="fqv-candidates"')}<details class="fqv-advanced"><summary>심화 · E의 상태와 F의 게시판·삭제 조건을 따로 바꾸기</summary><div class="fqv-controls">${select('estatus', 'E · 상태', [['DRAFT', 'DRAFT'], ['PUBLISHED', 'PUBLISHED'], ['HIDDEN', 'HIDDEN']], ui.estatus)}${select('fboard', 'F · 게시판', [['other', '다른 게시판'], ['dev', 'dev']], ui.fboard)}${select('fdeleted', 'F · 삭제 시각', [['yes', 'tDelete 있음'], ['no', 'null · 삭제 안 됨']], ui.fdeleted)}</div></details><div class="fqv-list-results"><section class="fqv-order"><h4>① 조건 통과 집합 → 정렬</h4><p><code>published_at DESC, id DESC</code><br><span>같은 t2에서는 idD &gt; idB &gt; idA 가정</span></p><ol class="fqv-order-strip">${sorted || '<li>∅ · 조건을 통과한 행 없음</li>'}</ol></section><section class="fqv-count"><h4>② COUNT · 페이지 제한 없음</h4><p class="fqv-big-count" data-fqv-count>${list.totalElements}</p><p>위와 <strong>같은 WHERE</strong>를 통과한 전체 가상 행</p></section></div><section class="fqv-items"><div class="fqv-items-heading"><h4>items · 정렬 집합의 ${list.offset + 1}번째부터 최대 ${list.size}개</h4><div class="fqv-pagination"><button type="button" data-fqv-action="page" data-fqv-value="prev"${list.page === 0 ? ' disabled' : ''}>← 이전</button><span>page <strong data-fqv-page>${list.page}</strong></span><button type="button" data-fqv-action="page" data-fqv-value="next"${!list.hasNext ? ' disabled' : ''}>다음 →</button></div></div><div class="fqv-item-line">${list.items.map(r => `<span data-fqv-item data-fqv-row="${esc(r.key)}" class="fqv-result-item"><strong>${esc(r.key)}</strong><code>${esc(r.id)}</code><span>가상 글 ${esc(r.key)}</span></span>`).join('') || '<span class="fqv-empty">빈 items</span>'}</div><dl class="fqv-meta">${Object.entries({ page: list.page, size: list.size, totalElements: list.totalElements, totalPages: list.totalPages, hasNext: list.hasNext }).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section><p class="fqv-footer-note">SELECT만 설명합니다. post 값·viewCount는 바뀌지 않으며 페이지 버튼도 실제 API를 호출하지 않습니다. 이 값은 아래 실제 응답 영역과 독립입니다.</p>`;
  return { ui, body };
}

function presets() {
  const title = getFunctionalVisualModel('update', 'patch-title').request.title;
  return [
    ['omit', 'tags 생략', { title }], ['null', 'tags: null', { tags: null }], ['empty', 'tags: []', { tags: [] }],
    ['values', 'tags: 값 배열', { tags: ['새태그', '새태그', '추가태그'] }], ['object', '{} · 빈 요청', {}],
  ];
}
const tagLabels = model => model.after.collection.elements.map(ref => ({
  ref: ref.$ref,
  name: model.nodes.find(node => node.id === ref.$ref)?.fields?.name || ref.$ref,
}));
const linkRows = snapshot => snapshot.database.post_tag.map(r => row([`<code>${esc(r.post_id)}</code>`, `<code>${esc(r.tag_id)}</code>`]));
const tagsTable = (caption, rows, attr) => table(caption, ['tag.id', 'name'], rows.map(t => row([`<code>${esc(t.id)}</code>`, badge(t.name)])), attr);
function patchVisual(stateId, options) {
  const choices = presets();
  const seed = options.request == null ? stateId === 'patch-tags' ? 'empty' : 'omit' : choices.find(([, , r]) => equal(r, options.request))?.[0] || 'custom';
  const ui = { requestPreset: seed, ...options.queryControls };
  let request = choices.find(([id]) => id === ui.requestPreset)?.[2] ?? options.request;
  // 실패 분기는 선택 요청에 후행 검증 실패를 추가한다. 성공 상태와 같은 요청이라고 숨기지 않는다.
  if (stateId === 'patch-rollback') request = request?.tags != null ? { ...request, visibility: 'SECRET' } : { ...request, content: '   ' };
  const model = getFunctionalVisualModel('update', stateId, { ...options, request });
  const before = model.before, after = model.after;
  const committed = model.transaction.phase === 'commit';
  const rolledBack = model.transaction.phase === 'rollback';
  const commit = rolledBack ? null : getFunctionalVisualModel('update', 'patch-commit', { ...options, request });
  const beforePost = before.database.post[0], appPost = after.database.post[0], observerPost = model.observer.database.post[0];
  const fieldLink = getFunctionalFieldLinks('update').find(f => f.field === 'tags');
  const objectRows = ['title', 'content', 'updatedAt'].map(field => {
    const column = field === 'updatedAt' ? 'updated_at' : field;
    return `<tr${model.changes.includes(field) ? ' class="fqv-changed"' : ''}><th scope="row"><code>${field}</code></th><td>${value(before.object[field])}</td><td>${value(after.object[field])}</td><td>${value(appPost[column])}</td><td>${value(observerPost[column])}</td></tr>`;
  });
  const pending = model.pendingChanges;
  const setTags = tagLabels(model);
  const newTagNotice = after.database.tag.length > before.database.tag.length
    ? committed
      ? ' 새 Tag의 INSERT도 commit되어 별도 연결의 새 SELECT에서 관찰할 수 있습니다.'
      : ' 새 Tag는 IDENTITY id를 받아 앱 Tx에 INSERT된 상태이며 아직 외부에 확정되지 않았습니다.'
    : '';
  const body = `<header class="fqv-heading"><div><p class="fqv-kicker">요청 → Java 값 → 연결행</p><h3>태그 집합과 DB 연결을 구분해서 봅니다</h3></div><span class="fqv-model-label">설명용 · 전송하지 않음</span></header><div class="fqv-presets" role="group" aria-label="설명용 PATCH 요청 선택">${choices.map(([id, label]) => `<button type="button" data-fqv-action="request" data-fqv-value="${id}" aria-pressed="${ui.requestPreset === id}">${esc(label)}</button>`).join('')}</div><p class="fqv-context">각 선택은 <strong>같은 시작 값</strong>에서 비교하는 대안입니다. 연속 PATCH 실행이 아니며 실제 요청 폼을 바꾸지 않습니다. Java 컬렉션은 논리적 기존 태그 집합을 고정한 설명 fixture이며 실제 로딩 시점·구현체를 측정한 값이 아닙니다.</p><div class="fqv-patch-top"><section class="fqv-request"><h4>선택한 설명용 요청</h4><pre><code>${esc(JSON.stringify(model.request, null, 2))}</code></pre>${stateId === 'patch-rollback' ? '<p class="fqv-warning">실패 분기: 위 요청에 후행 검증 실패 값을 추가했습니다. 성공 요청과 별개의 예시입니다.</p>' : ''}<p>${model.request.tags == null ? 'tags 생략·null → 기존 원소 유지' : model.request.tags.length ? '같은 이름 중복 제거 → 지정한 원소로 교체' : '빈 배열 → 연결할 원소 0개'}</p></section><section class="fqv-set-panel"><h4>Post@P.tags · Java 컬렉션</h4><div class="fqv-set" data-fqv-set data-size="${after.collection.elements.length}"><code>${esc(after.collection.id)}</code><p class="fqv-set-before">시작 원소: ${before.collection.elements.map(ref => esc(model.nodes.find(node => node.id === ref.$ref)?.fields?.name || ref.$ref)).join(' · ')}</p><div>${setTags.length ? setTags.map(tag => `<span class="fqv-tag-ref">${badge(tag.name, 'fqv-tag')}<small>${esc(tag.ref)}</small></span>`).join('') : '<strong>∅ · 빈 집합</strong>'}</div><small>같은 Set 객체 · 원소 ${after.collection.elements.length}개</small></div><p class="fqv-set-operation"><code>${stateId === 'patch-before' ? '아직 변경하지 않음' : model.request.tags == null ? '유지' : 'clear() + addAll(resolved)'}</code></p><p class="fqv-reference">${esc(fieldLink.field)} → <code>post_tag(post_id, tag_id)</code> → <code>tag.id</code><br>태그 이름 문자열과 관계행은 서로 다른 표현입니다.</p></section></div><div class="fqv-phase-label"><strong>${rolledBack ? 'ROLLBACK · DB 변경 취소' : committed ? 'COMMIT 후 · 확정된 값' : stateId === 'patch-before' ? '요청 처리 전 · 시작 값' : stateId === 'patch-flush' ? 'FLUSH 후 · 아직 미확정' : '객체 변경 후 · 아직 post/post_tag 동기화 전'}</strong><span>앱 Tx와 외부 DB 관찰을 구분합니다</span></div>${table('필드 값 비교 · 같은 idP', ['Java 필드', '시작 값', '현재 Java 객체', '앱 Tx 현재 DB', '외부 DB 관찰'], objectRows, 'class="fqv-field-comparison"')}<p class="fqv-pending">${rolledBack ? 'DB 변경은 취소됐습니다. Java 객체를 자동으로 원복하는 동작이 아닙니다. 실패한 객체·영속성 컨텍스트를 성공 결과로 재사용하지 않습니다.' : committed ? '정상 commit 뒤 별도 연결의 새 SELECT에서도 확정된 값이 보이는 모델입니다.' : pending.post.length || pending.post_tag ? `미동기화 대상: ${pending.post.map(p => esc(p.column)).join(', ') || 'post 필드 없음'}${pending.post_tag ? ' · post_tag 관계 교체' : ''}. 객체 값과 앱 DB 행이 아직 다를 수 있습니다.` : '현재 상태에서 남은 post/post_tag 미동기화 변경이 없습니다.'}</p><div class="fqv-relations"><section><h4>앱 Tx 현재 DB · post_tag</h4>${table('앱 Tx의 현재 연결행', ['post_id', 'tag_id'], linkRows(after), 'data-fqv-app-links')}${tagsTable('앱 Tx 현재 DB · tag 원본행', after.database.tag, 'data-fqv-tag-table')}<p>연결 해제는 tag 원본행 삭제가 아닙니다.${newTagNotice}</p></section><section class="fqv-commit-comparison"><h4>${rolledBack ? '실패 결과 · 연결행 유지' : committed ? 'COMMIT 결과 · post_tag' : '정상 COMMIT 후 비교 · 현재 상태와 별도'}</h4>${table(rolledBack ? 'rollback 후 연결행' : '성공 commit을 가정한 연결행', ['post_id', 'tag_id'], linkRows(rolledBack ? after : commit.after), 'data-fqv-commit-links')}<p>${rolledBack ? '요청 전 DB의 post_tag·tag 행을 유지합니다.' : '필요한 관계 변경을 동기화한 뒤 확정된 모델입니다. 실제 SQL 순서·개수는 미측정입니다.'}</p><h4>외부 DB 관찰 · 현재 선택 상태</h4>${table('별도 연결의 현재 post_tag', ['post_id', 'tag_id'], model.observer.database.post_tag.map(r => row([`<code>${esc(r.post_id)}</code>`, `<code>${esc(r.tag_id)}</code>`])), 'data-fqv-observer-links')}${tagsTable('별도 연결의 현재 tag 원본행', model.observer.database.tag, 'data-fqv-observer-tags')}</section></div><p class="fqv-footer-note">성공 시 <code>updatedAt = now</code>를 대입합니다. t1 &gt; t0는 설명용 가정이며 항상 다른 저장 시각을 보장하지 않습니다. 별도 연결은 새 autocommit SELECT 기준이며 열린 REPEATABLE READ 트랜잭션은 이전 스냅샷을 볼 수 있습니다.</p>`;
  return { ui, body };
}

/** taskId: list | update. 상태 선택과 API 실행은 상위 workspace가 관리한다. */
export function renderFunctionalQueryVisual({ taskId, stateId, options = {}, idPrefix = `${taskId}-${stateId}` }) {
  if (!['list', 'update'].includes(taskId)) throw new RangeError(`지원하지 않는 query 시각화: ${taskId}`);
  const { body, ui } = taskId === 'list' ? listVisual(stateId, options) : patchVisual(stateId, options);
  return `<section class="fqv fqv-${taskId}" data-fqv="${taskId}" data-fqv-state="${esc(stateId)}" data-fqv-prefix="${esc(idPrefix)}" data-fqv-options="${json(options)}" data-fqv-controls="${json(ui)}" aria-label="${taskId === 'list' ? '목록 조건과 페이지 설명용 모델' : 'PATCH 객체와 DB 설명용 모델'}">${body}</section>`;
}
