import { getFunctionalVisualModel, getFunctionalFieldLinks } from './functional-visual-model.mjs';

// 정적 HTML과 설명용 값만 만든다. 서버 호출·DOM·진도 저장은 하지 않는다.
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const json = value => esc(JSON.stringify(value));
const display = value => value == null ? 'null' : Array.isArray(value) ? `{ ${value.map(display).join(', ')} }` : typeof value === 'object' && '$ref' in value ? `→ ${value.$ref}` : typeof value === 'object' ? JSON.stringify(value) : String(value);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const CORE = ['id', 'title', 'board', 'author', 'tags', 'viewCount', 'deletedAt'];
const CAPTIONS = {
  'new-object': ['new Post', '요청의 제목은 객체에 들어갔습니다. id는 null이고 새 post 행은 아직 없습니다.'],
  'tag-new-object': ['새 Tag 생성 직후 · 저장 전', '기존 태그를 먼저 찾고, 없는 이름은 id=null인 Tag 객체로 만듭니다. Post.tags에 추가하는 루프는 resolveTags 반환 뒤입니다.'],
  'tags-resolved': ['태그 해석과 Post.addTag', 'Tag 참조를 먼저 해석하고 Post.tags에 추가했습니다. 새 Tag의 id 확보와 Post의 id 확보는 서로 다른 저장입니다.'],
  'identity-insert': ['Post 저장 · id 확보', 'Post.id에 idP가 생겼지만 아직 commit이 아닙니다. post_tag 예정 관계와 현재 DB 행을 구별하세요.'],
  'create-flush': ['남은 영속 변경 동기화', 'flush는 객체 변경을 SQL로 동기화하는 개념입니다. 정본 create에 명시적인 flush 호출은 없습니다.'],
  'create-commit': ['commit · 저장 확정', '같은 idP가 Post 객체, post 행, 관계 행과 응답에 이어집니다. 별도 연결의 새 SELECT도 확정된 행을 봅니다.'],
  'create-rollback': ['rollback · 실패 분기', '이번 DB 변경은 취소됩니다. idP가 남은 Java 객체를 성공한 저장 결과로 재사용하면 안 됩니다.'],
  'detail-select': ['같은 idP 조회 · canView 확인', '볼 수 있는 글인지 확인한 다음 조회수를 증가시킵니다. 이 상세 요청은 읽기 전용 트랜잭션이 아닙니다.'],
  'detail-change': ['Post.increaseViewCount()', '객체의 viewCount만 1 증가했습니다. 앱 트랜잭션의 DB 값과 별도 연결의 관찰 값은 아직 이전 값입니다.'],
  'detail-flush': ['조회수 변경 동기화', '앱 트랜잭션 DB의 view_count가 바뀌어도 commit 전 다른 연결에서는 이전 확정값을 봅니다.'],
  'detail-commit': ['조회수 변경 확정', '응답과 별도 DB 관찰에서 같은 증가한 조회수를 비교합니다. 생성·수정·게시 시각은 유지됩니다.'],
  'detail-hidden': ['canView 실패 · 404', '없거나 삭제됐거나 볼 수 없는 글은 404입니다. increaseViewCount를 호출하지 않아 객체·DB 조회수가 바뀌지 않습니다.'],
  'delete-before': ['같은 글 · 삭제 전', 'canView를 먼저 통과하고 작성자 또는 ADMIN인지 확인합니다. 아직 deletedAt은 null입니다.'],
  'delete-change': ['Post.delete(now)', 'Java 객체의 deletedAt과 updatedAt을 같은 now로 바꿉니다. post 행과 태그 연결을 제거하지 않습니다.'],
  'delete-flush': ['삭제 시각 동기화', '앱 트랜잭션에서는 두 시각을 변경한 행을 봅니다. 별도 연결의 관찰은 commit 전 이전 확정 상태입니다.'],
  'delete-commit': ['삭제 표시 확정 · 행 보존', '204 뒤 일반 조회에서 제외됩니다. 별도 DB 클라이언트의 새 SELECT에는 같은 idP의 물리 행과 연결이 남습니다.'],
  'delete-again': ['이미 삭제된 글 · 다시 요청', 'canView를 통과하지 못해 404로 끝납니다. 추가로 변경하는 행은 없습니다.'],
};
const DEFAULT_FIELD = { create: 'id', detail: 'viewCount', delete: 'deletedAt' };

export function renderFunctionalRuntimeVisual({ taskId, stateId, options = {}, idPrefix } = {}) {
  if (!['create', 'detail', 'delete'].includes(taskId)) throw new RangeError(`지원하지 않는 native 과제: ${taskId}`);
  const model = getFunctionalVisualModel(taskId, stateId, options);
  const links = getFunctionalFieldLinks(taskId);
  const prefix = String(idPrefix || `frv-${taskId}-${model.stateId}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  const rootId = `${prefix}-runtime`;
  let serial = 0;
  const targets = [];
  const selected = DEFAULT_FIELD[taskId];
  const databasePhase = ({ commit: 'COMMIT 후', rollback: 'ROLLBACK 후', rejected: '거절 후' })[model.transaction.phase] || '앱 Tx 진행 중';
  const managedLabel = model.transaction.managed ? 'JPA 관리 중' : ['commit', 'rollback'].includes(model.transaction.phase) ? 'JPA 관리 종료' : 'JPA 관리 전';
  const management = typeof model.transaction.managed === 'boolean'
    ? `<small class="frv-managed" data-frv-managed="${model.transaction.managed}" aria-label="Post 영속성 · ${managedLabel}" title="JPA가 Post를 관리하는지 표시합니다. 정본 OSIV=false의 서비스 트랜잭션 기준 설명 모델입니다.">${managedLabel}</small>` : '';
  function target(anchor, extraFields = []) {
    const fields = [...new Set([...links.filter(link => link.targets.includes(anchor)).map(link => link.field), ...extraFields])];
    const id = `${prefix}-target-${++serial}`;
    targets.push({ id, fields });
    return `id="${id}" data-frv-target="${esc(anchor)}" data-frv-fields="${fields.join(' ')}" class="${fields.includes(selected) ? 'is-linked' : ''}"`;
  }
  const value = val => `<code data-frv-value="${json(val)}">${esc(display(val))}</code>`;
  function changedValue(before, after, changed) {
    return `${changed ? `<span class="frv-before">${esc(display(before))}</span><span class="frv-value-arrow" aria-label="변경 후">→</span>` : ''}${value(after)}${changed ? '<span class="frv-change-label">변경</span>' : ''}`;
  }
  function javaRows(rows) {
    return rows.map(row => `<div class="frv-field-row${row.field === selected ? ' is-linked' : ''}${row.changed ? ' is-changed' : ''}" data-frv-source-field="${row.field}" data-frv-fields="${row.field}" id="${prefix}-java-${row.field}"><span class="frv-field-name"><code>${row.field}</code><small>${row.type}</small></span><span class="frv-field-value">${changedValue(row.before, row.value, row.changed)}${row.field === 'tags' ? `<small class="frv-ref-handle">참조 대상: ${esc(model.after.collection.id)}</small>` : ''}</span></div>`).join('');
  }
  const core = taskId === 'delete' ? [...CORE, 'updatedAt'] : CORE;
  const java = `<section class="frv-java" aria-labelledby="${prefix}-java-heading"><header class="frv-lane-heading"><span>Java / 메모리의 객체${management}</span><h4 id="${prefix}-java-heading">Post@P <small>같은 설명용 객체</small></h4></header><div class="frv-field-list">${javaRows(model.rows.java.filter(row => core.includes(row.field)))}</div><details class="frv-extra"><summary>Post의 나머지 ${15 - core.length}개 필드 확인</summary><div class="frv-field-list">${javaRows(model.rows.java.filter(row => !core.includes(row.field)))}</div></details></section>`;
  const references = `<section class="frv-references" aria-labelledby="${prefix}-refs-title"><header class="frv-lane-heading"><span>객체 참조 · FK의 출발값</span><h4 id="${prefix}-refs-title">가리키는 객체와 컬렉션</h4></header><div class="frv-reference-list">${model.nodes.filter(node => node.id !== 'Post@P').map(node => {
    const field = node.type === 'Board' ? 'board' : node.type === 'Member' ? 'author' : 'tags';
    const edge = model.edges.find(edge => edge.to === node.id);
    return `<div class="frv-reference-node"><p class="frv-ref-path" data-frv-fields="${field}">${esc(edge ? `${edge.from}.${edge.field} →` : node.id === 'LinkedHashSet@Resolved' ? 'resolveTags의 임시 Set →' : '태그 저장 모델 →')}</p><div ${target(node.id, [field])}><strong>${esc(node.id)}</strong><span class="frv-type">${esc(node.type)}</span></div>${node.elementsConfirmed === false && !model.collectionAccess.fixtureOnly ? `<p class="frv-reference-note">원소 미확인 · 아직 태그를 읽었다고 판단하지 않습니다.</p>` : node.elements ? `<div ${target(node.id + '.elements', [field])}><div class="frv-elements">${node.elements.length ? node.elements.map((element, i) => `<span>${i}: ${esc(display(element))}</span>`).join('') : '<span>원소 0개</span>'}</div></div>` : `<dl class="frv-ref-fields">${Object.entries(node.fields || {}).map(([key, val]) => `<div ${target(`${node.id}.${key}`, [field])}><dt>${esc(key)}</dt><dd>${esc(display(val))}</dd></div>`).join('')}</dl>`}${node.loading ? `<p class="frv-reference-note">${esc(node.loading)}</p>` : ''}${node.committedRow === false ? '<p class="frv-warning">rollback 뒤 객체 참조 · 이번 DB 행 없음</p>' : ''}</div>`;
  }).join('')}</div><p class="frv-small">Post.board와 Post.author는 객체 참조입니다. DB에는 그 객체의 id가 FK로 저장됩니다. 객체 기호는 실제 메모리 주소가 아닙니다.</p></section>`;
  function postTable(table, observer = false) {
    const rows = observer ? model.observer.database.post : table.rows;
    const old = model.before.database.post[0];
    const current = rows[0];
    const mainCols = ['id', 'title', 'board_id', 'author_id', 'view_count', 'updated_at', 'deleted_at'];
    function columns(cols) {
      return cols.map(column => {
        const attrs = target(`post.${column}`);
        return `<div ${attrs}><dt>${esc(column)}</dt><dd>${current ? changedValue(old ? old[column] : '행 없음', current[column], !same(old?.[column], current[column])) : '<span class="frv-empty-value">행 없음</span>'}</dd></div>`;
      }).join('');
    }
    return `<section class="frv-db-table frv-post-table" ${observer ? '' : `data-frv-table="post" data-frv-rows="${json(table.rows)}"`}><h5><code>post</code><span>${rows.length}행${observer ? ' · 별도 연결' : ' · ' + databasePhase}</span></h5><dl class="frv-post-columns">${columns(mainCols)}</dl><details class="frv-extra"><summary>post의 나머지 열 · 시각과 카운터</summary><dl class="frv-post-columns">${columns(table.columns.filter(column => !mainCols.includes(column)))}</dl></details></section>`;
  }
  function relationalTable(table, observer = false) {
    const rows = observer ? model.observer.database[table.name] || [] : table.rows;
    const beforeRows = table.beforeRows;
    const count = observer ? `${rows.length}행` : beforeRows.length === rows.length ? `${rows.length}행 · 개수 유지` : `${beforeRows.length} → ${rows.length}행`;
    const rowMarkup = rows.map(row => {
      const inserted = !beforeRows.some(old => same(old, row));
      return `<tr data-frv-row-change="${inserted ? 'inserted' : 'retained'}">${table.columns.map((column, index) => `<td ${target(`${table.name}.${column}`)}>${esc(display(row[column]))}${index === 0 && inserted ? '<small class="frv-row-added">새 행</small>' : ''}</td>`).join('')}</tr>`;
    }).join('');
    return `<section class="frv-db-table" ${observer ? '' : `data-frv-table="${table.name}" data-frv-rows="${json(rows)}"`}><h5><code>${table.name}</code><span>${count}</span></h5><div class="frv-table-scroll"><table><thead><tr>${table.columns.map(column => `<th scope="col" ${target(`${table.name}.${column}`)}>${esc(column)}</th>`).join('')}</tr></thead><tbody>${rowMarkup || `<tr><td colspan="${Math.max(table.columns.length, 1)}" class="frv-empty-value">행 없음</td></tr>`}</tbody></table></div></section>`;
  }
  const dbPost = model.rows.tables.find(table => table.name === 'post');
  const relationTables = model.rows.tables.filter(table => ['post_tag', 'tag'].includes(table.name));
  const others = model.rows.tables.filter(table => !['post', 'post_tag', 'tag'].includes(table.name));
  const pending = model.pendingWrites?.post_tag || [];
  const database = `<section class="frv-database" aria-labelledby="${prefix}-db-title"><header class="frv-lane-heading"><span>MySQL / ${databasePhase}</span><h4 id="${prefix}-db-title">현재 행 · FK 값</h4></header>${postTable(dbPost)}${pending.length ? `<div class="frv-pending" data-frv-pending data-frv-fields="tags"><strong>post_tag 예정 관계 · DB 행 아님</strong>${pending.map(row => `<code>(post_id=${esc(row.post_id)}, tag_id=${esc(row.tag_id)})</code>`).join('')}<p>id 확보 직후의 pendingWrites 모델입니다. 실제 연결 INSERT 순서는 미측정입니다.</p></div>` : ''}${relationTables.map(table => relationalTable(table)).join('')}<details class="frv-extra"><summary>참조 원본 · 좋아요와 댓글 행</summary>${others.map(table => relationalTable(table)).join('')}</details></section>`;
  const observer = `<aside class="frv-observer" data-frv-observer data-frv-database="${json(model.observer.database)}" aria-labelledby="${prefix}-observer-title"><div><p class="frv-observer-label">앱 처리 경로 밖 · DBeaver / CloudBeaver</p><h4 id="${prefix}-observer-title">별도 DB 연결에서 새로 SELECT</h4><p>${model.transaction.phase === 'commit' ? 'commit 후: 이번 확정 행을 관찰합니다.' : model.transaction.phase === 'rollback' ? 'rollback 후: 이번 DB 변경이 취소된 상태를 관찰합니다.' : model.transaction.phase === 'rejected' ? '요청 거절 후: 추가 변경 없이 기존 확정 상태를 관찰합니다.' : 'commit 전: 이전에 확정된 행을 관찰합니다.'}</p><p class="frv-small">${esc(model.observer.label)}</p><div class="frv-observer-counts">${relationTables.map(table => `<span>${table.name}: ${(model.observer.database[table.name] || []).length}행</span>`).join('')}</div></div><div>${postTable(dbPost, true)}<details class="frv-extra"><summary>별도 연결의 tag · post_tag 값</summary>${relationTables.map(table => relationalTable(table, true)).join('')}</details></div></aside>`;
  const [title, caption] = CAPTIONS[model.stateId];
  const operation = taskId === 'create' ? 'new Post → resolveTags / Tag 저장 → post.addTag → postRepository.save → 남은 변경 동기화 → commit' : taskId === 'detail' ? '조회 → canView → increaseViewCount → 변경 동기화 → commit' : '조회 → canView → 작성자 또는 ADMIN → post.delete(now) → 변경 동기화 → commit';
  const extra = taskId === 'detail' ? `<p class="frv-boundary">${model.stateId === 'detail-hidden' ? '404 분기: 객체·DB 값 변경 없음.' : `조회수 ${esc(model.before.object.viewCount)} → ${esc(model.after.object.viewCount)} · createdAt=${esc(model.after.object.createdAt)}, updatedAt=${esc(model.after.object.updatedAt)}, publishedAt=${esc(model.after.object.publishedAt)} 유지.`} 동시 요청의 정확한 +N은 보장하지 않습니다.</p>` : taskId === 'delete' ? `<p class="frv-boundary">post·post_tag·tag 행 보존 · like_count=${esc(model.after.object.likeCount)}, comment_count=${esc(model.after.object.commentCount)} 유지. ${options.associationFixture === 'existing' ? '기존 좋아요·댓글이 있는 별도 설명 fixture입니다.' : '기본 신규 글 모델의 post_like·comment는 각각 0행입니다.'}${model.apiAfter ? ' 일반 GET → 404 · PATCH → 404 · 재DELETE → 404 · 목록에서 제외.' : ''}</p>` : '<p class="frv-boundary">기본 가정: spring은 기존 태그, 새태그는 없음. 태그 id와 이름은 다른 값이며 tag_id에는 이름을 저장하지 않습니다.</p>';
  const transaction = model.transaction.phase === 'rollback' ? 'rollback: DB 변경 취소. Java 객체는 자동으로 이전 값으로 복구되지 않습니다.' : model.transaction.phase === 'commit' ? 'commit: DB 변경 확정. 다른 연결의 새 조회도 이번 값을 관찰합니다.' : model.transaction.phase === 'rejected' ? '요청 거절: 추가 변경 없이 종료합니다.' : '진행 중: id 확보·flush는 commit과 다릅니다. 앱 트랜잭션 내부 값과 다른 연결의 값을 구분하세요.';
  const pickerFields = { create: ['id', 'title', 'board', 'author', 'tags'], detail: ['id', 'viewCount', 'tags'], delete: ['id', 'deletedAt', 'tags'] }[taskId];
  const toolbar = pickerFields.map(field => {
    const link = links.find(link => link.field === field);
    const description = field === 'tags' ? 'Post.tags → Set<Tag> 원소 → Tag.id → post_tag.tag_id ↔ tag.id. 이름은 tag.name에 있습니다.' : field === 'board' ? 'Post.board → Board@B.id → post.board_id ↔ board.id. Post에 boardSlug 필드는 없습니다.' : field === 'author' ? 'Post.author → Member@U.id → post.author_id ↔ member.id. Post에 authorId 필드는 없습니다.' : `Post.${field} ↔ post.${link.column} · 같은 값이 객체와 행에서 언제 다른지 비교하세요.`;
    const controls = [`${prefix}-java-${field}`, ...targets.filter(item => item.fields.includes(field)).map(item => item.id)];
    return `<button type="button" data-frv-field="${field}" data-frv-description="${esc(description)}" aria-pressed="${field === selected}" aria-controls="${controls.join(' ')}" aria-describedby="${prefix}-connection">${field}</button>`;
  }).join('');
  const initialDescription = selected === 'id' ? 'Post.id ↔ post.id · 생성 id가 생겨도 commit은 별도입니다.' : selected === 'viewCount' ? 'Post.viewCount ↔ post.view_count · 객체 변경, DB 동기화, commit을 비교하세요.' : 'Post.deletedAt ↔ post.deleted_at · 삭제 표시를 해도 같은 id의 행은 남습니다.';
  return `<section class="frv" id="${rootId}" data-frv-root data-frv-task="${taskId}" data-frv-state="${esc(model.stateId)}" data-frv-model="true" data-frv-selected="${selected}" aria-labelledby="${prefix}-title"><header class="frv-heading"><div><p class="frv-kicker">값 · 객체 참조 · DB 행</p><h3 id="${prefix}-title">${esc(title)}</h3></div><span class="frv-model-badge">설명용 모델 · 실제 서버 미실행</span></header><p class="frv-caption">${esc(caption)}</p><div class="frv-field-picker" role="group" aria-label="연결해서 볼 Post 필드">${toolbar}</div><p class="frv-connection" id="${prefix}-connection" data-frv-connection role="status" aria-live="polite">${esc(initialDescription)}</p><div class="frv-app-lanes">${java}${references}${database}</div><div class="frv-operation"><span>코드의 처리 순서</span><p>${esc(operation)}</p></div><div class="frv-transaction" data-frv-transaction data-frv-phase="${esc(model.transaction.phase)}"><strong>${esc(transaction)}</strong><p>SQL 의미 예시 · 실제 Hibernate SQL 아님</p><div class="frv-sql-scroll"><code>${model.sql.statements.map(esc).join('<br>') || '아직 저장 SQL을 의미상 표시할 단계가 아닙니다.'}</code></div><small>${esc(model.sql.label)}</small></div>${extra}${observer}${model.response ? `<p class="frv-response"><strong>이 상태의 예상 응답: ${model.response.status}</strong>${model.response.headers?.Location ? `<code>Location: ${esc(model.response.headers.Location)}</code>` : ''}${model.response.body?.id ? `<code>id=${esc(model.response.body.id)}</code>` : ''}${model.response.body?.viewCount != null ? `<code>viewCount=${esc(model.response.body.viewCount)}</code>` : ''}${model.response.status === 204 ? '<span>응답 본문 없음</span>' : ''}<span>실제 요청 결과와 별도로 비교하세요.</span></p>` : ''}<p class="frv-symbol-note">idP · tagIdA · t0/t1/t2 · Post@P는 설명용 기호입니다. 실제 id·시각·메모리 주소나 SQL 계측값이 아닙니다.</p></section>`;
}
