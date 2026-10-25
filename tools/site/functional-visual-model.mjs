// 설명용 값 계산 전용. 3-2 파일별 blob에 근거하며 서버 실행/SQL 계측 결과가 아니다.
const clone = value => JSON.parse(JSON.stringify(value));
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const ref = id => ({ $ref: id });
const POST_PATH = 'src/main/java/org/example/post/';
const FILES = [
  ['Post.java', '6d40bf3b860292d5155d729b4b59e66c6fe2dd40'],
  ['PostService.java', 'ca164f353bb47e76f139a5d1054df57b8642fd57'],
  ['PostQueryService.java', 'f1df026a103887cf06eb09838fac0954cb386202'],
  ['PostRepository.java', 'be077956d4b6c3748d28832295f06aab867b1d81'],
  ['PostAccessPolicy.java', '21c2bef66b5f9bd2b2dd08c586d54df6059955d3'],
  ['BoardPostController.java', '38260fd4a644027e3ef3c8b5f37c1e889887e648'],
  ['PostController.java', '637493b0e62426b4d874ca80981e0d99099cbdc9'],
  ['PostResponse.java', '0cdc0b698d2e4bd62f5e851fa1b1c2ecbcca2e44'],
  ['PostListItemResponse.java', 'b54de245766691fbf2732f3a2bb76d6e3ae8e4c0'],
].map(([file, blob]) => ({ path: POST_PATH + file, blob }));
FILES.push({ path: 'src/main/java/org/example/tag/Tag.java', blob: '893852615fc2e334c6a12c8e46aa0a2153456198' });
FILES.push({ path: 'docker/mysql/init/01-community.sql', blob: 'f4c9c3dcf0940e0b8026e055856c879c4f7bccac' });
const SOURCE = { snapshot: '3-2', manifest: 'scenario/snapshots/3-2.json', files: FILES };
const ASSUMPTIONS = [
  '설명용 모델이며 실제 API·DB 실행 결과가 아닙니다.',
  'idP·boardIdDev·memberIdU·tagIdA 등은 실측 id가 아닌 기호입니다.',
  't0·t1·t2는 설명용 시각이며 기본 예시에서 t0 < t1 < t2를 가정합니다.',
  'spring 태그는 이미 있고 새태그·추가태그는 처음에 없다고 가정합니다.',
];
const OBSERVATION = '별도 연결에서 새 autocommit SELECT로 관찰하는 모델입니다. 열린 REPEATABLE READ 트랜잭션은 이전 스냅샷을 볼 수 있습니다.';
const SQL_LIMIT = 'SQL은 의미 예시입니다. 실제 Hibernate 열 목록·발행 순서·쿼리 수는 미측정입니다. 정본에 명시적 flush 호출은 없습니다.';
const FIELD_DEFS = [
  ['id', 'Long', 'id', 28], ['board', 'Board', 'board_id', 32], ['author', 'Member', 'author_id', 36],
  ['title', 'String', 'title', 40], ['content', 'String', 'content', 43], ['status', 'String', 'status', 46],
  ['visibility', 'String', 'visibility', 49], ['viewCount', 'Integer', 'view_count', 52],
  ['likeCount', 'Integer', 'like_count', 55], ['commentCount', 'Integer', 'comment_count', 58],
  ['publishedAt', 'LocalDateTime', 'published_at', 61], ['createdAt', 'LocalDateTime', 'created_at', 64],
  ['updatedAt', 'LocalDateTime', 'updated_at', 67], ['deletedAt', 'LocalDateTime', 'deleted_at', 70],
  ['tags', 'Set<Tag>', null, 73],
];
const STATES = {
  create: ['new-object', 'tag-new-object', 'tags-resolved', 'identity-insert', 'create-flush', 'create-commit', 'create-rollback'],
  detail: ['detail-select', 'detail-change', 'detail-flush', 'detail-commit', 'detail-hidden'],
  list: ['list-condition', 'list-select', 'list-response'],
  patch: ['patch-before', 'patch-title', 'patch-tags', 'patch-flush', 'patch-commit', 'patch-rollback'],
  delete: ['delete-before', 'delete-change', 'delete-flush', 'delete-commit', 'delete-again'],
};
STATES.update = STATES.patch;
const EVIDENCE = {
  create: { file: 'PostService.java', symbol: 'create/resolveTags', line: 53 },
  detail: { file: 'PostQueryService.java', symbol: 'getDetail', line: 52 },
  list: { file: 'PostRepository.java', symbol: 'findViewableByBoard/countViewableByBoard', line: 23 },
  patch: { file: 'PostService.java', symbol: 'patch', line: 131 },
  delete: { file: 'PostService.java', symbol: 'delete', line: 176 },
};

/** Java필드, 실제DB열, 참조대상과 FK 제약 이름을 구별한다. */
export function getFunctionalFieldLinks(taskId) {
  if (!STATES[taskId]) throw new RangeError(`알 수 없는 과제: ${taskId}`);
  return FIELD_DEFS.map(([field, type, column, line]) => ({
    field, type, table: column ? 'post' : 'post_tag', column,
    targets: field === 'board' ? ['Board@B.id', 'post.board_id', 'board.id']
      : field === 'author' ? ['Member@U.id', 'post.author_id', 'member.id']
      : field === 'tags' ? ['Set@Ptags', 'LinkedHashSet@Ptags', 'Tag@Ta.id', 'Tag@Tb.id', 'post_tag.post_id', 'post_tag.tag_id', 'tag.id', 'tag.name']
      : [`post.${column}`],
    foreignKeys: field === 'board' ? ['fk_post_board'] : field === 'author' ? ['fk_post_author']
      : field === 'tags' ? ['fk_post_tag_post', 'fk_post_tag_tag'] : [],
    source: { ...FILES[0], line, symbol: `Post.${field}` },
  }));
}

// before/after의 태그는 논리 계산용 fixture다. Java 표시에는 rows.java/nodes의 접근 확인 메타데이터를 적용한다.
function initialSnapshot({ viewCount = 0, title = '새 게시글', updatedAt = 't0' } = {}) {
  if (!Number.isInteger(viewCount) || viewCount < 0) throw new RangeError('viewCount는 0 이상의 정수여야 합니다.');
  const object = {
    id: 'idP', board: ref('Board@B'), author: ref('Member@U'), title, content: '본문',
    status: 'PUBLISHED', visibility: 'PUBLIC', viewCount, likeCount: 0, commentCount: 0,
    publishedAt: 't0', createdAt: 't0', updatedAt, deletedAt: null, tags: [ref('Tag@Ta'), ref('Tag@Tb')],
  };
  const snapshot = {
    object, collection: { id: 'Set@Ptags', type: 'Set<Tag>', elements: clone(object.tags) },
    database: { post: [], post_tag: [], tag: [
      { id: 'tagIdA', name: 'spring', created_at: 'tBefore' },
      { id: 'tagIdB', name: '새태그', created_at: 't0' },
    ], board: [{ id: 'boardIdDev', slug: 'dev' }], member: [{ id: 'memberIdU', nickname: '설명용 작성자' }], post_like: [], comment: [] },
  };
  synchronize(snapshot);
  return snapshot;
}
function dbPost(object) {
  return Object.fromEntries(FIELD_DEFS.filter(([, , column]) => column).map(([field, , column]) => [column,
    field === 'board' ? 'boardIdDev' : field === 'author' ? 'memberIdU' : object[field]]));
}
const tagRef = name => name === 'spring' ? 'Tag@Ta' : name === '새태그' ? 'Tag@Tb' : name === '추가태그' ? 'Tag@Tnew' : `Tag@name:${name}`;
const tagId = name => name === 'spring' ? 'tagIdA' : name === '새태그' ? 'tagIdB' : name === '추가태그' ? 'tagIdNew' : `tagId:${name}`;
function synchronize(snapshot) {
  snapshot.collection.elements = clone(snapshot.object.tags);
  snapshot.database.post = snapshot.object.id == null ? [] : [dbPost(snapshot.object)];
  snapshot.database.post_tag = snapshot.object.id == null ? [] : snapshot.object.tags.map(r => {
    const tag = snapshot.database.tag.find(t => tagRef(t.name) === r.$ref);
    return { post_id: snapshot.object.id, tag_id: tag.id };
  });
}
function resolveTags(snapshot, names, now) {
  const resolved = [...new Set(names ?? [])].map(name => {
    if (!snapshot.database.tag.some(row => row.name === name)) snapshot.database.tag.push({ id: tagId(name), name, created_at: now });
    return ref(tagRef(name));
  });
  snapshot.resolvedTags = { id: 'LinkedHashSet@Resolved', type: 'Set<Tag>', elements: resolved };
  snapshot.object.tags = clone(resolved);
  snapshot.collection.elements = clone(resolved);
}
function response(status, body = null, headers = {}) { return { status, body, headers }; }
function detailBody(object) {
  return {
    id: object.id, boardSlug: 'dev', title: object.title, content: object.content,
    tags: object.tags.map(r => r.$ref === 'Tag@Ta' ? 'spring' : r.$ref === 'Tag@Tb' ? '새태그' : r.$ref === 'Tag@Tnew' ? '추가태그' : r.$ref.slice('Tag@name:'.length)),
    visibility: object.visibility, author: { id: 'memberIdU', nickname: '설명용 작성자' },
    viewCount: object.viewCount, likeCount: object.likeCount, commentCount: object.commentCount, createdAt: object.createdAt,
  };
}
function createBody(object) {
  const { viewCount, likeCount, commentCount, ...body } = detailBody(object);
  return body;
}
// commit 여부와 Java 비식별자 필드 접근은 별개다. 각 장면이 포함하는 코드 경계로 판단한다.
function referenceAccess(taskId, stateId, phase) {
  const detailMapped = taskId === 'detail' && ['detail-change', 'detail-flush', 'detail-commit'].includes(stateId);
  const patchReturned = taskId === 'patch' && stateId === 'patch-commit' && phase === 'commit';
  const boardQuery = taskId === 'create' || taskId === 'list';
  const listAuthorsFetched = taskId === 'list' && ['list-select', 'list-response'].includes(stateId);
  return {
    slug: {
      confirmed: boardQuery || detailMapped || patchReturned,
      basis: boardQuery ? 'findBySlug로 Board를 읽은 뒤의 장면'
        : detailMapped ? '상세 DTO mapper의 post.getBoard().getSlug()까지 포함한 장면'
        : patchReturned ? '성공한 PATCH 서비스 반환 전 post.getBoard().getSlug() 접근'
        : '이 코드 경계에서 Board.slug 접근은 확인하지 않음',
    },
    nickname: {
      confirmed: (taskId === 'create' && stateId === 'create-commit') || detailMapped || patchReturned || listAuthorsFetched,
      basis: taskId === 'create' && stateId === 'create-commit' ? '작성 서비스 반환 전 saved.getAuthor().getNickname() 접근'
        : detailMapped ? '상세 DTO mapper의 post.getAuthor().getNickname()까지 포함한 장면'
        : patchReturned ? '성공한 PATCH 서비스 반환 전 post.getAuthor().getNickname() 접근'
        : listAuthorsFetched ? '목록 Repository에서 작성자를 JOIN FETCH로 읽은 장면'
        : '이 코드 경계에서 Member.nickname 접근은 확인하지 않음',
    },
  };
}
function referenceNode(id, type, identity, field, fixtureValue, access) {
  return {
    id, kind: 'reference', type,
    fields: { id: identity, [field]: access.confirmed ? fixtureValue : '미확인 · 지연 참조 가능' },
    fixtureFields: { id: identity, [field]: fixtureValue },
    fixtureLabel: '설명용 DB fixture 값 · 이 값 자체는 Java 필드 접근/초기화 증거가 아님',
    fieldAccess: { [field]: { ...access } },
    loading: `${access.basis}. ${access.confirmed ? '' : '이미 로딩되었을 수 있으며 '}실제 초기화 SQL 수는 미측정입니다.`,
  };
}
// DB fixture가 있다는 사실과 이 코드 경계가 LAZY 원소를 읽었다는 증거는 다르다.
function collectionAccess(taskId, stateId) {
  const mapped = taskId === 'detail' && ['detail-change', 'detail-flush', 'detail-commit'].includes(stateId);
  const fixtureOnly = taskId === 'patch' || taskId === 'list';
  return { elementsConfirmed: taskId === 'create' || mapped, fixtureOnly,
    basis: taskId === 'create' ? '직접 만든 Set과 resolveTags에서 보유한 참조'
      : mapped ? '상세 DTO mapper의 getTags().stream().map(Tag::getName)까지 포함'
      : fixtureOnly ? '논리적 기존 태그 집합을 고정한 대안 비교용 fixture; 실제 초기화 시점 미측정'
      : '이 코드 경계에서 tags 원소 접근 미확인 · 지연 컬렉션 가능',
  };
}
function graph(snapshot, access, taskId, tagAccess) {
  const nodes = [
    { id: 'Post@P', kind: 'entity', type: 'Post', fields: clone(snapshot.object) },
    referenceNode('Board@B', 'Board', 'boardIdDev', 'slug', 'dev', access.slug),
    referenceNode('Member@U', 'Member', 'memberIdU', 'nickname', '설명용 작성자', access.nickname),
    { id: snapshot.collection.id, kind: 'collection', type: 'Set<Tag>', elementsConfirmed: tagAccess.elementsConfirmed,
      ...(tagAccess.elementsConfirmed || tagAccess.fixtureOnly ? { elements: clone(snapshot.collection.elements) } : {}),
      loading: tagAccess.basis + '. ORM 저장·조회 뒤 실제 컬렉션 구현체와 초기화 SQL 수는 미측정입니다.' },
  ];
  if (snapshot.resolvedTags) nodes.push({ ...clone(snapshot.resolvedTags), kind: 'collection' });
  // 작성에서는 DB 기존 행만으로 Java Tag 존재를 주장하지 않고, 해석해서 보유한 참조만 투영한다.
  const heldTagRefs = new Set([...snapshot.object.tags, ...(snapshot.resolvedTags?.elements || [])].map(r => r.$ref));
  const opaque = !tagAccess.elementsConfirmed && !tagAccess.fixtureOnly;
  const tagRows = opaque ? [] : taskId === 'create' ? snapshot.database.tag.filter(t => heldTagRefs.has(tagRef(t.name))) : snapshot.database.tag;
  for (const t of tagRows) {
    const constructed = taskId === 'create' && t.name !== 'spring';
    nodes.push({ id: tagRef(t.name), kind: 'reference', type: 'Tag',
      fields: { id: t.id, name: t.name, createdAt: constructed ? t.created_at : 'getter 접근 미확인' },
      fixtureFields: { id: t.id, name: t.name, createdAt: t.created_at },
      loading: `${tagAccess.basis}. ${constructed ? '새 Tag 생성자의 createdAt 대입값입니다.' : `createdAt의 DB fixture 값은 ${t.created_at}이며 직접 getter 접근 증거가 아닙니다.`}` });
  }
  for (const t of snapshot.retainedTagObjects || []) nodes.push({ id: tagRef(t.name), kind: 'uncommitted-reference', type: 'Tag', fields: { id: t.id, name: t.name, createdAt: t.created_at }, committedRow: false });
  if (snapshot.pendingTag) nodes.push({ id: tagRef(snapshot.pendingTag.name), kind: 'transient', type: 'Tag', fields: clone(snapshot.pendingTag) });
  const edges = [
    { id: 'board', from: 'Post@P', field: 'board', to: 'Board@B', via: ['post.board_id', 'board.id'], foreignKey: 'fk_post_board' },
    { id: 'author', from: 'Post@P', field: 'author', to: 'Member@U', via: ['post.author_id', 'member.id'], foreignKey: 'fk_post_author' },
    { id: 'tags', from: 'Post@P', field: 'tags', to: snapshot.collection.id, via: [] },
    ...(opaque ? [] : snapshot.object.tags).map(r => ({ id: `tags:${r.$ref}`, from: snapshot.collection.id, to: r.$ref, field: 'elements', via: ['post_tag.post_id', 'post_tag.tag_id', 'tag.id'], foreignKeys: ['fk_post_tag_post', 'fk_post_tag_tag'] })),
  ];
  return { nodes, edges };
}
function present(taskId, stateId, before, after, observerDatabase, extra = {}) {
  const links = getFunctionalFieldLinks(taskId);
  const tagAccess = collectionAccess(taskId, stateId);
  const java = links.map(link => ({ ...link, before: clone(before.object[link.field]), value: clone(after.object[link.field]), changed: !equal(before.object[link.field], after.object[link.field]) }));
  if (!tagAccess.elementsConfirmed && !tagAccess.fixtureOnly) {
    const tags = java.find(row => row.field === 'tags');
    tags.before = tags.value = '원소 미확인 · 지연 컬렉션 가능'; tags.changed = false;
  }
  const tables = Object.entries(after.database).map(([name, rows]) => ({
    name, columns: name === 'post' ? FIELD_DEFS.filter(([, , c]) => c).map(([, , c]) => c) : name === 'post_tag' ? ['post_id', 'tag_id'] : name === 'tag' ? ['id', 'name', 'created_at'] : Object.keys(rows[0] || before.database[name]?.[0] || {}),
    beforeRows: clone(before.database[name] || []), rows: clone(rows), changed: !equal(before.database[name], rows),
  }));
  const evidence = EVIDENCE[taskId];
  return {
    model: true, label: '설명용 데이터 모델 · 실제 서버 미실행', assumptions: clone(ASSUMPTIONS),
    taskId, stateId, availableStates: [...STATES[taskId]],
    source: { ...clone(SOURCE), active: { path: POST_PATH + evidence.file, symbol: evidence.symbol, line: evidence.line } },
    fields: links, rows: { java, tables }, collectionAccess: tagAccess, ...graph(after, referenceAccess(taskId, stateId, extra.transaction?.phase), taskId, tagAccess),
    before, after, changes: java.filter(r => r.changed).map(r => r.field),
    observer: { label: OBSERVATION, database: clone(observerDatabase) },
    sql: { label: SQL_LIMIT, measured: false, statements: [] }, response: null,
    transaction: { phase: 'active', objectRestored: false }, ...extra,
  };
}

function createModel(stateId, options) {
  const request = { boardSlug: 'dev', title: '새 게시글', content: '본문', tags: ['spring', '새태그'], visibility: 'PUBLIC', ...clone(options.request || {}) };
  const after = initialSnapshot();
  after.collection.id = 'LinkedHashSet@Ptags';
  after.object.id = null;
  Object.assign(after.object, { title: request.title, content: request.content, visibility: request.visibility ?? 'PUBLIC', tags: [] });
  after.collection.elements = [];
  after.database.post = [];
  after.database.post_tag = [];
  after.database.tag = after.database.tag.filter(t => t.name === 'spring');
  const before = clone(after);
  const resolved = !['new-object', 'tag-new-object'].includes(stateId);
  if (stateId === 'tag-new-object') {
    const elements = [];
    for (const name of [...new Set(request.tags ?? [])]) {
      if (!after.database.tag.some(t => t.name === name)) { after.pendingTag = { id: null, name, createdAt: 't0' }; break; }
      elements.push(ref(tagRef(name)));
    }
    after.resolvedTags = { id: 'LinkedHashSet@Resolved', type: 'Set<Tag>', elements };
  }
  if (resolved) resolveTags(after, request.tags, 't0');
  const saved = ['identity-insert', 'create-flush', 'create-commit', 'create-rollback'].includes(stateId);
  if (saved) { after.collection.id = 'Set@Ptags'; after.object.id = 'idP'; synchronize(after); }
  const pendingWrites = { post_tag: stateId === 'identity-insert' ? clone(after.database.post_tag) : [] };
  // IDENTITY의 id 확보만으로 연결 SQL까지 실행됐다고 단정하지 않는다.
  if (stateId === 'identity-insert') after.database.post_tag = [];
  const committed = stateId === 'create-commit';
  const rollback = stateId === 'create-rollback';
  if (rollback) {
    after.retainedTagObjects = after.database.tag.filter(t => !before.database.tag.some(old => old.id === t.id));
    after.database = clone(before.database);
  }
  const result = present('create', stateId, before, after, committed ? after.database : before.database, {
    request, pendingWrites, transaction: { phase: rollback ? 'rollback' : committed ? 'commit' : saved ? 'saved-uncommitted' : 'active', managed: saved && !rollback && !committed, objectRestored: false, branchFrom: rollback ? 'identity-insert' : null },
    response: committed ? response(201, createBody(after.object), { Location: '/api/posts/idP' }) : null,
  });
  result.sql.statements = committed ? ['필요한 영속 변경 동기화', 'COMMIT'] : rollback ? ['ROLLBACK'] : saved ? ['IDENTITY id 확보용 post INSERT(commit 전)', 'post_tag 동기화의 세부 순서는 미측정'] : resolved ? ['Tag 이름으로 검색, 없으면 저장(post.save보다 코드상 먼저)'] : [];
  result.sql.explicitFlushInCanonical = false;
  return result;
}
function detailModel(stateId, options) {
  const before = initialSnapshot({ viewCount: options.viewCount ?? 0 });
  const after = clone(before);
  const hidden = stateId === 'detail-hidden';
  const changed = ['detail-change', 'detail-flush', 'detail-commit'].includes(stateId);
  if (changed) after.object.viewCount += 1;
  if (['detail-flush', 'detail-commit'].includes(stateId)) synchronize(after);
  const committed = stateId === 'detail-commit';
  return present('detail', stateId, before, after, committed ? after.database : before.database, {
    response: hidden ? response(404) : committed ? response(200, detailBody(after.object)) : null,
    transaction: { phase: hidden ? 'rejected' : committed ? 'commit' : stateId === 'detail-flush' ? 'flushed-uncommitted' : 'active', readOnly: false, objectRestored: false },
    concurrency: { exactPlusNGuaranteed: false, example: [{ tx: 'A', read: before.object.viewCount, write: before.object.viewCount + 1 }, { tx: 'B', read: before.object.viewCount, write: before.object.viewCount + 1 }], possibleFinal: before.object.viewCount + 1, label: '같은 v를 읽은 두 트랜잭션의 설명 스케줄이며 실측 결과가 아닙니다.' },
    sql: { label: SQL_LIMIT, measured: false, statements: hidden ? ['canView 실패: UPDATE 없음'] : committed ? ['의미상 view_count=v+1 UPDATE', 'COMMIT'] : stateId === 'detail-flush' ? ['의미상 view_count=v+1 UPDATE(미확정)'] : ['SELECT post; 변경은 flush 때 동기화'] },
  });
}

const SAMPLE_ROWS = [
  ['A', 'memberIdOther', 'PUBLISHED', 'PUBLIC', null, 't2'],
  ['B', 'memberIdU', 'PUBLISHED', 'FOLLOWERS', null, 't2'],
  ['C', 'memberIdFollowed', 'PUBLISHED', 'FOLLOWERS', null, 't1'],
  ['D', 'memberIdBlocked', 'PUBLISHED', 'PUBLIC', null, 't2'],
  ['E', 'memberIdU', 'DRAFT', 'PUBLIC', null, 't2'],
  ['F', 'memberIdOther', 'PUBLISHED', 'PUBLIC', 'tDelete', 't0'],
].map(([key, authorId, status, visibility, deletedAt, publishedAt]) => ({ key, id: `id${key}`, boardId: key === 'F' ? 'boardIdOther' : 'boardIdDev', authorId, status, visibility, deletedAt, publishedAt }));
function desc(a, b) { return a == null ? b == null ? 0 : 1 : b == null ? -1 : a < b ? 1 : a > b ? -1 : 0; }

/** follows/blocks는 [fromId,toId][]; rowOverrides는 {A:{status,...},...}. 입력을 변경하지 않는다. */
export function evaluateFunctionalList(options = {}) {
  const { viewerId = 'memberIdU', boardId = 'boardIdDev', page = 0, size = 10,
    follows = [['memberIdU', 'memberIdFollowed']], blocks = [['memberIdU', 'memberIdBlocked']], rowOverrides = {} } = options;
  if (!Number.isInteger(page) || page < 0 || !Number.isInteger(size) || size < 1 || size > 50) throw new RangeError('page는 0 이상, size는 1~50 정수여야 합니다.');
  const rows = SAMPLE_ROWS.map(sample => {
    const row = { ...sample, ...clone(rowOverrides[sample.key] || {}) };
    const isAuthor = viewerId != null && viewerId === row.authorId;
    const followsAuthor = viewerId != null && follows.some(([from, to]) => from === viewerId && to === row.authorId);
    const blocked = viewerId != null && blocks.some(([from, to]) => (from === viewerId && to === row.authorId) || (to === viewerId && from === row.authorId));
    const conditions = { board: row.boardId === boardId, notDeleted: row.deletedAt == null, published: row.status === 'PUBLISHED', visible: row.visibility === 'PUBLIC' || isAuthor || followsAuthor, noBlock: !blocked };
    return { ...row, conditions, included: Object.values(conditions).every(Boolean), visibilityReasons: { public: row.visibility === 'PUBLIC', isAuthor, followsAuthor }, excludedBy: Object.keys(conditions).filter(key => !conditions[key]) };
  });
  // 동일 WHERE를 통과한 집합에서 count와 items를 만들고 그 뒤 페이지를 자른다.
  const countRows = rows.filter(row => row.included).sort((a, b) => desc(a.publishedAt, b.publishedAt) || desc(a.id, b.id));
  const totalElements = countRows.length;
  return { model: true, label: '가상 행 A..F 계산 · 실제 seed 건수 아님', assumptions: ['같은 t2에서 idD > idB > idA라고 가정합니다.', ...ASSUMPTIONS],
    viewerId, boardId, follows: clone(follows), blocks: clone(blocks), rows, countRows, items: countRows.slice(page * size, (page + 1) * size),
    page, size, offset: page * size, totalElements, totalPages: Math.ceil(totalElements / size), hasNext: (page + 1) * size < totalElements,
    ordering: ['publishedAt DESC', 'id DESC'], predicate: 'board AND deletedAt IS NULL AND PUBLISHED AND (PUBLIC OR author OR follows) AND noBlockEitherWay',
  };
}
function listModel(stateId, options) {
  const before = initialSnapshot({ viewCount: options.viewCount ?? 1 });
  const result = evaluateFunctionalList(options);
  return present('list', stateId, before, clone(before), before.database, {
    list: result, transaction: { phase: 'read-only', readOnly: true, objectRestored: false },
    response: stateId === 'list-response' ? response(200, { items: result.items.map(row => ({ id: row.id, title: `가상 글 ${row.key}`, author: { id: row.authorId, nickname: '설명용 작성자' }, tags: [], likeCount: 0, commentCount: 0, viewCount: 0, publishedAt: row.publishedAt })), page: result.page, size: result.size, totalElements: result.totalElements, totalPages: result.totalPages, hasNext: result.hasNext }) : null,
    sql: { label: SQL_LIMIT, measured: false, statements: ['SELECT items: 같은 WHERE→published_at DESC,id DESC→LIMIT/OFFSET', 'SELECT COUNT: 같은 WHERE, 페이지 제한 없음'] },
  });
}

function patchError(request, after, now) {
  const invalid = (field, reason) => ({ field, reason });
  if (request.title != null) {
    if (typeof request.title !== 'string' || !request.title.trim() || request.title.length > 200) return invalid('title', '공백 또는 200자 초과');
    after.object.title = request.title;
  }
  if (request.content != null) {
    if (typeof request.content !== 'string' || !request.content.trim()) return invalid('content', '본문 공백');
    after.object.content = request.content;
  }
  if (request.tags != null) {
    if (!Array.isArray(request.tags) || request.tags.length > 5 || request.tags.some(t => typeof t !== 'string' || !t.trim() || t.length > 30)) return invalid('tags', '최대 5개, 이름 1~30자·공백 불가');
    resolveTags(after, request.tags, now);
  }
  if (request.visibility != null) {
    if (!['PUBLIC', 'FOLLOWERS'].includes(request.visibility)) return invalid('visibility', 'PUBLIC/FOLLOWERS 이외');
    after.object.visibility = request.visibility;
  }
  after.object.updatedAt = now;
  return null;
}
function patchModel(stateId, options) {
  const before = initialSnapshot({ viewCount: options.viewCount ?? 1 });
  const after = clone(before);
  const defaultRequest = stateId === 'patch-tags' ? { tags: [] } : stateId === 'patch-rollback' ? { title: '수정한 제목', content: '   ' } : { title: '수정한 제목' };
  const request = clone(options.request ?? defaultRequest);
  const error = stateId === 'patch-before' ? null : patchError(request, after, options.now ?? 't1');
  const rollback = error != null;
  const committed = stateId === 'patch-commit' && !rollback;
  const flushed = ['patch-flush', 'patch-commit'].includes(stateId) && !rollback;
  // Tag도 IDENTITY다. id를 받은 새 Tag의 INSERT 행은 앱 Tx에 이미 있고 외부에는 미확정이다.
  // post 필드/관계의 동기화와 분리하며 실패한 경우에만 DB tag 행까지 취소한다.
  const resolvedTagRows = clone(after.database.tag);
  after.database = clone(before.database);
  if (!rollback) after.database.tag = resolvedTagRows;
  if (flushed) synchronize(after);
  const pendingChanges = { post: [], post_tag: null };
  if (!rollback && !flushed) {
    const target = dbPost(after.object);
    pendingChanges.post = Object.keys(target).filter(column => !equal(after.database.post[0][column], target[column]))
      .map(column => ({ column, before: after.database.post[0][column], after: target[column] }));
    const targetTags = after.object.tags.map(r => ({ post_id: after.object.id, tag_id: resolvedTagRows.find(t => tagRef(t.name) === r.$ref).id }));
    const keys = rows => rows.map(r => JSON.stringify([r.post_id, r.tag_id])).sort();
    if (!equal(keys(after.database.post_tag), keys(targetTags))) pendingChanges.post_tag = { before: clone(after.database.post_tag), after: targetTags };
  }
  const result = present('patch', stateId, before, after, committed ? after.database : before.database, {
    request, error, pendingChanges, response: rollback ? response(400, { field: error.field }) : committed ? response(200, detailBody(after.object)) : null,
    transaction: { phase: rollback ? 'rollback' : committed ? 'commit' : flushed ? 'flushed-uncommitted' : 'active', objectRestored: false, touchCalled: stateId !== 'patch-before' && !rollback, branchFrom: rollback ? 'patch-before' : null },
    collectionOperation: request.tags == null ? '유지' : '기존 Set.clear() + addAll(resolved); Set identity 유지',
    sql: { label: SQL_LIMIT, measured: false, statements: rollback ? ['ROLLBACK; tag 신규 저장도 취소'] : flushed ? ['의미상 변경된 post/post_tag 동기화; tag 원본 삭제 없음', ...(committed ? ['COMMIT'] : [])] : [...(resolvedTagRows.length > before.database.tag.length ? ['새 Tag: IDENTITY id와 앱 Tx INSERT 행 존재, commit 전 외부에는 안 보임'] : []), 'post 필드·post_tag 변경은 미동기화 대상으로 구분'] },
  });
  // 실패 직전의 새 Tag 참조는 남을 수 있으나 확정 DB tag 행으로 표시하지 않는다.
  for (const tag of resolvedTagRows.filter(t => !after.database.tag.some(r => r.id === t.id))) result.nodes.push({ id: tagRef(tag.name), kind: 'uncommitted-reference', type: 'Tag', fields: { id: tag.id, name: tag.name, createdAt: tag.created_at }, committedRow: false });
  return result;
}
function deleteModel(stateId, options) {
  const before = initialSnapshot({ title: '수정한 제목', viewCount: options.viewCount ?? 1, updatedAt: 't1' });
  if (options.associationFixture === 'existing') {
    before.database.post_like = [{ id: 'likeRowK', post_id: 'idP', member_id: 'memberIdOther' }];
    before.database.comment = [{ id: 'commentRowK', post_id: 'idP', member_id: 'memberIdOther', content: '보존할 댓글' }];
    before.object.likeCount = 1; before.object.commentCount = 1; synchronize(before);
  }
  if (stateId === 'delete-again') {
    before.object.deletedAt = 't2'; before.object.updatedAt = 't2'; synchronize(before);
  }
  const after = clone(before);
  if (stateId !== 'delete-before' && stateId !== 'delete-again') { after.object.deletedAt = options.now ?? 't2'; after.object.updatedAt = options.now ?? 't2'; }
  const committed = stateId === 'delete-commit';
  if (committed || stateId === 'delete-flush') synchronize(after);
  return present('delete', stateId, before, after, committed ? after.database : before.database, {
    response: committed ? response(204) : stateId === 'delete-again' ? response(404) : null,
    transaction: { phase: committed ? 'commit' : stateId === 'delete-again' ? 'rejected' : stateId === 'delete-flush' ? 'flushed-uncommitted' : 'active', objectRestored: false },
    apiAfter: committed || stateId === 'delete-again' ? { detail: 404, patch: 404, delete: 404, listIncluded: false } : null,
    sql: { label: SQL_LIMIT, measured: false, statements: stateId === 'delete-again' ? ['canView 실패: 추가 UPDATE 없음'] : committed ? ['의미상 deleted_at/updated_at 두 값 UPDATE', 'COMMIT; post 행·연관 행 보존'] : ['물리 DELETE 없음; 변경은 flush 때 동기화'] },
  });
}

/** options.request는 설명용 PATCH/POST 입력. 계산 결과와 입력 사이에 공유 참조가 없다. */
export function getFunctionalVisualModel(taskId, stateId, options = {}) {
  if (!STATES[taskId]) throw new RangeError(`알 수 없는 과제: ${taskId}`);
  stateId ??= STATES[taskId][0];
  if (!STATES[taskId].includes(stateId)) throw new RangeError(`알 수 없는 상태: ${taskId}/${stateId}`);
  const modelTask = taskId === 'update' ? 'patch' : taskId;
  return { ...({ create: createModel, detail: detailModel, list: listModel, patch: patchModel, delete: deleteModel })[modelTask](stateId, options), taskId };
}
