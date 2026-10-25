import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import test from 'node:test';

const moduleUrl = new URL('./functional-visual-model.mjs', import.meta.url);
const exists = await import(moduleUrl).catch(() => null);
test('기능 시각화 순수 모델 모듈이 제공된다', () => assert.ok(exists, 'functional-visual-model.mjs 구현 필요'));
if (exists) {
  const { getFunctionalVisualModel: model, evaluateFunctionalList: list, getFunctionalFieldLinks: links } = exists;
  const root = new URL('../../', import.meta.url);
  const json = (path) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
  const manifest = json('scenario/snapshots/3-2.json');
  const blobText = (path) => readFileSync(new URL(`scenario/snapshots/blobs/${manifest.files.find(f => f.path === path).blob}.txt`, root), 'utf8');
  test('실제 3-2 blob의 필드15개·post열14개·동일WHERE와 근거 해시를 대조한다', () => {
    const m = model('create', 'create-commit');
    for (const s of m.source.files) {
      assert.equal(manifest.files.find(f => f.path === s.path).blob, s.blob);
      const bytes = readFileSync(new URL(`scenario/snapshots/blobs/${s.blob}.txt`, root));
      assert.equal(createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex'), s.blob);
    }
    const fields = [...blobText('src/main/java/org/example/post/Post.java').matchAll(/private (Long|Board|Member|String|Integer|LocalDateTime|Set<Tag>) (\w+)(?:\s*=.*)?;/g)].map(x => x[2]);
    assert.deepEqual(links('create').map(f => f.field), fields);
    assert.equal(m.rows.java.length, 15);
    const sql = blobText('docker/mysql/init/01-community.sql').match(/CREATE TABLE `post` \(([\s\S]*?)\n\)/)[1];
    const columns = [...sql.matchAll(/^  `(\w+)`/gm)].map(x => x[1]);
    assert.deepEqual(Object.keys(m.after.database.post[0]), columns);
    assert.equal(columns.length, 14);
    const repo = blobText('src/main/java/org/example/post/PostRepository.java');
    const wheres = [...repo.matchAll(/@Query\("""([\s\S]*?)"""\)/g)].slice(0, 2).map(x => x[1].slice(x[1].indexOf('WHERE p.board')).replace(/\s+/g, ' ').trim());
    assert.equal(wheres[0], wheres[1]);
    assert.ok(links('create').find(f => f.field === 'board').foreignKeys.includes('fk_post_board'));
    assert.ok(links('create').find(f => f.field === 'tags').foreignKeys.includes('fk_post_tag_tag'));
    assert.equal(links('create').find(f => f.field === 'tags').column, null);
  });
  test('작성은 태그 해석→별도Set참조→IDENTITY→확정/취소를 구분한다', () => {
    const n = model('create', 'new-object');
    const t = model('create', 'tags-resolved');
    const s = model('create', 'identity-insert');
    const c = model('create', 'create-commit');
    const r = model('create', 'create-rollback');
    assert.equal(n.after.object.id, null);
    assert.deepEqual(n.after.object.tags, []);
    assert.equal(t.after.object.id, null);
    assert.equal(t.after.object.tags.length, 2);
    assert.notEqual(t.after.collection.id, t.after.resolvedTags.id);
    assert.deepEqual(t.after.collection.elements, t.after.resolvedTags.elements);
    assert.equal(s.after.object.id, 'idP');
    assert.equal(s.observer.database.post.length, 0);
    assert.equal(c.observer.database.post[0].id, 'idP');
    assert.deepEqual(r.after.database.post, []);
    assert.equal(r.after.database.tag.length, 1);
    assert.equal(r.after.object.id, 'idP');
    assert.equal(r.transaction.objectRestored, false);
    assert.equal(c.response.status, 201);
  });
  test('작성 Java Tag 노드는 실제 해석한 참조만 표시하고 기존 DB 행과 구분한다', () => {
    const tags = x => x.nodes.filter(n => n.type === 'Tag');
    const n = model('create', 'new-object');
    assert.deepEqual(tags(n), [], 'resolveTags 전 DB spring 행을 Java Tag 객체로 표시하지 않음');
    assert.deepEqual(n.after.object.tags, []);
    assert.equal(n.after.database.tag[0].name, 'spring');
    const pending = model('create', 'tag-new-object');
    assert.deepEqual(tags(pending).map(n => n.id), ['Tag@Ta', 'Tag@Tb']);
    assert.equal(tags(pending).find(n => n.id === 'Tag@Tb').fields.id, null);
    assert.deepEqual(pending.after.object.tags, []);
    assert.deepEqual(pending.after.resolvedTags.elements, [{ $ref: 'Tag@Ta' }]);
    assert.equal(pending.after.database.tag.length, 1);
    const resolved = model('create', 'tags-resolved');
    assert.deepEqual(tags(resolved).map(n => n.id), ['Tag@Ta', 'Tag@Tb']);
    for (const refs of [resolved.after.object.tags, resolved.after.resolvedTags.elements]) {
      assert.deepEqual(refs.map(r => r.$ref), ['Tag@Ta', 'Tag@Tb']);
    }
    const empty = model('create', 'tags-resolved', { request: { tags: [] } });
    assert.deepEqual(tags(empty), [], '입력 태그가 없으면 기존 DB 태그를 해석하지 않음');
    assert.equal(empty.after.database.tag[0].name, 'spring');
    const onlyNew = model('create', 'tags-resolved', { request: { tags: ['새태그'] } });
    assert.deepEqual(tags(onlyNew).map(n => n.id), ['Tag@Tb']);
    assert.equal(onlyNew.after.database.tag.length, 2);
    const rolled = model('create', 'create-rollback', { request: { tags: ['새태그'] } });
    assert.deepEqual(tags(rolled).map(n => n.id), ['Tag@Tb']);
    assert.equal(tags(rolled)[0].fields.id, 'tagIdB');
    assert.equal(tags(rolled)[0].committedRow, false);
    assert.deepEqual(rolled.after.database.tag.map(t => t.name), ['spring']);
    assert.equal(rolled.after.object.tags[0].$ref, 'Tag@Tb');
  });
  test('상세 객체·flush·commit 관측을 분리하며404와 시각은 불변이다', () => {
    const a = model('detail', 'detail-change', { viewCount: 7 });
    const f = model('detail', 'detail-flush', { viewCount: 7 });
    const c = model('detail', 'detail-commit', { viewCount: 7 });
    const h = model('detail', 'detail-hidden', { viewCount: 7 });
    assert.equal(a.after.object.viewCount, 8);
    assert.equal(a.after.database.post[0].view_count, 7);
    assert.equal(f.after.database.post[0].view_count, 8);
    assert.equal(f.observer.database.post[0].view_count, 7);
    assert.equal(c.observer.database.post[0].view_count, 8);
    assert.equal(c.after.object.updatedAt, 't0');
    assert.equal(h.after.object.viewCount, 7);
    assert.equal(h.response.status, 404);
    assert.equal(c.concurrency.exactPlusNGuaranteed, false);
  });
  test('동일조건 count·필터→정렬→페이지와 관찰자 관계를 계산한다', () => {
    const x = list({ page: 0, size: 2 });
    assert.deepEqual(x.items.map(r => r.key), ['B', 'A']);
    assert.deepEqual(x.countRows.map(r => r.key), ['B', 'A', 'C']);
    assert.deepEqual([x.totalElements, x.totalPages, x.hasNext, x.offset], [3, 2, true, 0]);
    assert.deepEqual(list({ page: 1, size: 2 }).items.map(r => r.key), ['C']);
    assert.deepEqual(list({ viewerId: null }).items.map(r => r.key), ['D', 'A']);
    assert.deepEqual(list({ follows: [] }).items.map(r => r.key), ['B', 'A']);
    assert.deepEqual(list({ blocks: [] }).items.map(r => r.key), ['D', 'B', 'A', 'C']);
    assert.deepEqual(list({ blocks: [['memberIdBlocked', 'memberIdU']] }).items.map(r => r.key), ['B', 'A', 'C']);
    assert.deepEqual(list({ viewerId: 'admin', viewerRole: 'ADMIN', follows: [], blocks: [] }).items.map(r => r.key), ['D', 'A']);
    assert.equal(list({ page: 99 }).items.length, 0);
    assert.throws(() => list({ size: 0 }), RangeError);
    assert.throws(() => list({ size: 51 }), RangeError);
    assert.equal(list().size, 10);
    assert.throws(() => list({ page: -1 }), RangeError);
  });
  test('각 조건 조작은 status/deleted/board/visibility와 실제 JPQL의 follow 분기를 보존한다', () => {
    assert.ok(list({ rowOverrides: { E: { status: 'PUBLISHED' } } }).items.some(r => r.key === 'E'));
    assert.ok(!list({ viewerRole: 'ADMIN', rowOverrides: { E: { status: 'HIDDEN' } } }).items.some(r => r.key === 'E'));
    const f = list({ rowOverrides: { F: { boardId: 'boardIdDev' } } }).rows.find(r => r.key === 'F');
    assert.equal(f.conditions.board, true);
    assert.equal(f.conditions.notDeleted, false);
    assert.ok(list({ rowOverrides: { F: { boardId: 'boardIdDev', deletedAt: null } } }).items.some(r => r.key === 'F'));
    // 스키마 밖의 설명값이어도 실제 JPQL의 follow OR에 visibility 제약을 추가하지 않는다.
    assert.ok(list({ rowOverrides: { C: { visibility: 'OUTSIDE_SCHEMA' } } }).items.some(r => r.key === 'C'));
  });
  test('PATCH 생략/null/[]/값 배열/빈 객체는 Set identity와 tag 원본을 지킨다', () => {
    for (const request of [{ title: '수정한 제목' }, { tags: null }, {}]) {
      const x = model('patch', 'patch-commit', { request });
      assert.deepEqual(x.after.object.tags, x.before.object.tags);
      assert.equal(x.after.collection.id, x.before.collection.id);
      assert.equal(x.after.object.updatedAt, 't1');
    }
    const empty = model('patch', 'patch-commit', { request: { tags: [] } });
    assert.equal(empty.after.collection.id, empty.before.collection.id);
    assert.deepEqual(empty.after.database.post_tag, []);
    assert.equal(empty.after.database.tag.length, 2);
    const values = model('patch', 'patch-commit', { request: { tags: ['새태그', '새태그', '추가태그'] } });
    assert.deepEqual(values.after.object.tags, [{ $ref: 'Tag@Tb' }, { $ref: 'Tag@Tnew' }]);
    assert.equal(values.after.database.tag.length, 3);
    assert.ok(values.after.database.tag.some(r => r.name === 'spring'));
    assert.deepEqual(values.after.database.post_tag.map(r => r.tag_id), ['tagIdB', 'tagIdNew']);
    const sameTime = model('patch', 'patch-commit', { request: {}, now: 't0' });
    assert.equal(sameTime.after.object.updatedAt, sameTime.before.object.updatedAt);
    assert.equal(sameTime.transaction.touchCalled, true);
  });
  test('PATCH 중간 실패는 Java 변경을 남기고 DB 전체를 확정 전 값으로 되돌린다', () => {
    const x = model('patch', 'patch-rollback');
    assert.equal(x.after.object.title, '수정한 제목');
    assert.equal(x.after.database.post[0].title, '새 게시글');
    assert.equal(x.transaction.touchCalled, false);
    assert.equal(x.transaction.objectRestored, false);
    assert.equal(x.response.status, 400);
    const y = model('patch', 'patch-commit', { request: { tags: ['추가태그'], visibility: 'SECRET' } });
    assert.equal(y.response.status, 400);
    assert.deepEqual(y.after.database, y.before.database);
    assert.deepEqual(y.after.object.tags, [{ $ref: 'Tag@Tnew' }]);
    assert.equal(y.after.database.tag.length, 2);
  });
  test('DELETE는 두 시각만 변경하고 행·연관 보존, 204 본문 없음과 일반 API 제외를 표현한다', () => {
    const x = model('delete', 'delete-commit');
    assert.deepEqual(Object.keys(x.after.database.post[0]).filter(k => x.after.database.post[0][k] !== x.before.database.post[0][k]).sort(), ['deleted_at', 'updated_at']);
    for (const name of ['post_tag', 'tag', 'post_like', 'comment']) assert.deepEqual(x.after.database[name], x.before.database[name]);
    assert.equal(x.after.database.post.length, 1);
    assert.equal(x.response.status, 204);
    assert.equal(x.response.body, null);
    assert.deepEqual(x.apiAfter, { detail: 404, patch: 404, delete: 404, listIncluded: false });
    assert.equal(model('delete', 'delete-again').response.status, 404);
  });
  test('응답 모델은 실제 DTO 필드만 사용하고 생성/목록 내부 표현을 노출하지 않는다', () => {
    const created = model('create', 'create-commit');
    assert.deepEqual(Object.keys(created.response.body), ['id', 'boardSlug', 'title', 'content', 'tags', 'visibility', 'author', 'createdAt']);
    const item = model('list', 'list-response').response.body.items[0];
    assert.deepEqual(Object.keys(item), ['id', 'title', 'author', 'tags', 'likeCount', 'commentCount', 'viewCount', 'publishedAt']);
    assert.equal(item.content, undefined);
  });
  test('작성 태그 중복과 IDENTITY 시점의 관계행 미확정, 별도 기존 연관행 보존을 구분한다', () => {
    const duplicate = model('create', 'tags-resolved', { request: { tags: ['spring', 'spring', '새태그'] } });
    assert.equal(duplicate.after.object.tags.length, 2);
    const saved = model('create', 'identity-insert');
    assert.equal(saved.after.database.post_tag.length, 0);
    assert.equal(saved.pendingWrites.post_tag.length, 2);
    const deleted = model('delete', 'delete-commit', { associationFixture: 'existing' });
    assert.equal(deleted.before.database.post_like.length, 1);
    assert.equal(deleted.before.database.comment.length, 1);
    assert.equal(deleted.after.object.likeCount, deleted.before.object.likeCount);
    assert.deepEqual(deleted.before.database.comment, deleted.after.database.comment);
  });
  test('PATCH 신규 Tag의 IDENTITY id·앱 Tx 행·외부 관찰과 관계 동기화 대상을 구분한다', () => {
    const request = { title: '수정한 제목', tags: ['새태그', '새태그', '추가태그'] };
    for (const state of ['patch-title', 'patch-tags', 'patch-flush', 'patch-commit']) {
      const x = model('update', state, { request });
      const node = x.nodes.find(n => n.id === 'Tag@Tnew');
      assert.equal(node.fields.id, 'tagIdNew');
      assert.ok(x.after.database.tag.some(t => t.id === node.fields.id), `${state}: IDENTITY id를 받은 Tag는 앱 Tx 행 존재`);
      assert.equal(x.observer.database.tag.some(t => t.id === node.fields.id), state === 'patch-commit', `${state}: 외부 새 SELECT에는 commit 후 관찰`);
      const preflush = ['patch-title', 'patch-tags'].includes(state);
      assert.equal(x.after.database.post[0].title, preflush ? '새 게시글' : '수정한 제목');
      assert.deepEqual(x.after.database.post_tag.map(t => t.tag_id), preflush ? ['tagIdA', 'tagIdB'] : ['tagIdB', 'tagIdNew']);
      assert.equal(x.pendingChanges.post.length > 0, preflush);
      assert.equal(x.pendingChanges.post_tag !== null, preflush);
    }
    const rollback = model('update', 'patch-rollback', { request: { ...request, visibility: 'SECRET' } });
    assert.equal(rollback.nodes.find(n => n.id === 'Tag@Tnew').fields.id, 'tagIdNew');
    assert.deepEqual(rollback.after.database, rollback.before.database);
    assert.deepEqual(rollback.pendingChanges, { post: [], post_tag: null });
    const source = model('create', 'create-commit').source;
    assert.ok(source.files.some(f => f.path === 'src/main/java/org/example/tag/Tag.java'));
    assert.match(blobText('src/main/java/org/example/tag/Tag.java'), /@GeneratedValue\(strategy = GenerationType.IDENTITY\)/);
  });
  test('작성 pendingWrites는 동기화 전만 남고 flush·commit·rollback 뒤에는 비운다', () => {
    assert.equal(model('create', 'identity-insert').pendingWrites.post_tag.length, 2);
    for (const state of ['create-flush', 'create-commit', 'create-rollback']) {
      assert.deepEqual(model('create', state).pendingWrites.post_tag, [], `${state}: 남은 관계 쓰기 없음`);
    }
  });
  test('삭제 commit은 비식별자 접근을 만들지 않으며 Java 미확인값과 DB fixture를 분리한다', () => {
    for (const stateId of model('delete').availableStates) {
      const x = model('delete', stateId);
      const board = x.nodes.find(n => n.id === 'Board@B');
      const member = x.nodes.find(n => n.id === 'Member@U');
      assert.match(board.fields.slug, /미확인/, `${stateId}: slug 접근 확인 없음`);
      assert.match(member.fields.nickname, /미확인/, `${stateId}: nickname 접근 확인 없음`);
      assert.equal(board.fieldAccess.slug.confirmed, false);
      assert.equal(member.fieldAccess.nickname.confirmed, false);
      assert.equal(board.fixtureFields.slug, 'dev');
      assert.equal(member.fixtureFields.nickname, '설명용 작성자');
      assert.equal(x.after.database.board[0].slug, 'dev');
      assert.equal(x.after.database.member[0].nickname, '설명용 작성자');
      assert.doesNotMatch(board.loading, /findBySlug로 읽은/);
      assert.doesNotMatch(member.loading, /서비스 안에서 필요한 nickname 접근/);
      assert.match(board.loading, /이미 로딩.*수|로딩되었을 수/);
    }
    const service = blobText('src/main/java/org/example/post/PostService.java');
    const deletion = service.slice(service.indexOf('public void delete('), service.indexOf('private void validateTitle('));
    assert.match(deletion, /findById/);
    assert.doesNotMatch(deletion, /getSlug|getNickname|findBySlug/);
  });
  test('과제별 실제 조회·mapper 경계로 참조 필드값의 접근 확인을 정한다', () => {
    const cases = [
      ['create', 'new-object', true, false], ['create', 'identity-insert', true, false], ['create', 'create-commit', true, true],
      ['detail', 'detail-select', false, false], ['detail', 'detail-hidden', false, false],
      ['detail', 'detail-change', true, true], ['detail', 'detail-flush', true, true], ['detail', 'detail-commit', true, true],
      ['update', 'patch-before', false, false], ['update', 'patch-title', false, false], ['update', 'patch-tags', false, false],
      ['update', 'patch-flush', false, false], ['update', 'patch-rollback', false, false], ['update', 'patch-commit', true, true],
      ['list', 'list-condition', true, false], ['list', 'list-select', true, true], ['list', 'list-response', true, true],
    ];
    for (const [taskId, stateId, boardRead, nicknameRead] of cases) {
      const x = model(taskId, stateId);
      const board = x.nodes.find(n => n.id === 'Board@B');
      const member = x.nodes.find(n => n.id === 'Member@U');
      assert.ok(board.fieldAccess && member.fieldAccess, '필드 접근 메타데이터 필요');
      assert.equal(board.fieldAccess.slug.confirmed, boardRead, `${taskId}/${stateId}: Board.slug`);
      assert.equal(member.fieldAccess.nickname.confirmed, nicknameRead, `${taskId}/${stateId}: Member.nickname`);
      assert.equal(board.fields.slug, boardRead ? 'dev' : '미확인 · 지연 참조 가능');
      assert.equal(member.fields.nickname, nicknameRead ? '설명용 작성자' : '미확인 · 지연 참조 가능');
    }
    const failedCommit = model('update', 'patch-commit', { request: { title: '수정한 제목', visibility: 'SECRET' } });
    assert.equal(failedCommit.transaction.phase, 'rollback');
    assert.equal(failedCommit.nodes.find(n => n.id === 'Board@B').fieldAccess.slug.confirmed, false, 'commit 선택이어도 후행검증 실패는 getter에 도달하지 않음');
    assert.equal(failedCommit.nodes.find(n => n.id === 'Member@U').fieldAccess.nickname.confirmed, false);
    const query = blobText('src/main/java/org/example/post/PostQueryService.java');
    assert.match(query, /post.increaseViewCount\(\);\s*return toDetailResponse\(post\)/);
    assert.match(query, /post.getBoard\(\).getSlug\(\)/);
    assert.match(query, /post.getAuthor\(\).getNickname\(\)/);
    const patch = blobText('src/main/java/org/example/post/PostService.java');
    assert.ok(patch.indexOf('post.touchUpdatedAt(now)') < patch.indexOf('post.getBoard().getSlug()', patch.indexOf('public Post patch(')));
  });
  test('모든 기존 stateId를 처리하고 반환값·입력을 공유하지 않으며 부수 효과가 없다', async () => {
    const { FUNCTIONAL_TASKS } = await import('./functional-scenario-data.mjs');
    for (const task of FUNCTIONAL_TASKS) {
      const available = model(task.id).availableStates;
      assert.ok(task.visualization.states.every(state => available.includes(state.id)));
      for (const stateId of available) {
        const x = model(task.id, stateId);
        assert.equal(x.model, true);
        assert.ok(x.assumptions.length);
        assert.ok(x.rows && x.nodes && x.edges && x.observer);
        for (const edge of x.edges) {
          assert.ok(x.nodes.some(n => n.id === edge.from), `${task.id}/${stateId}: ${edge.from} 노드`);
          assert.ok(x.nodes.some(n => n.id === edge.to), `${task.id}/${stateId}: ${edge.to} 노드`);
        }
        for (const node of x.nodes.filter(n => n.type === 'Tag' && n.fields.id != null)) {
          if (x.transaction.phase !== 'rollback') assert.ok(x.after.database.tag.some(t => t.id === node.fields.id), `${task.id}/${stateId}: 할당된 Tag id의 앱 Tx 행`);
        }
        if (x.transaction.phase === 'commit') assert.deepEqual(x.observer.database, x.after.database);
        if (x.transaction.phase === 'rollback') assert.deepEqual(x.after.database, x.before.database);
      }
    }
    const options = { request: { tags: [] } };
    const before = JSON.stringify(options);
    const x = model('patch', 'patch-commit', options);
    x.after.database.tag[0].name = 'changed';
    assert.equal(model('patch', 'patch-commit', options).after.database.tag[0].name, 'spring');
    assert.equal(JSON.stringify(options), before);
    assert.throws(() => model('unknown', 'bad'), RangeError);
    assert.throws(() => model('create', 'bad'), RangeError);
    const code = readFileSync(moduleUrl, 'utf8');
    assert.ok(!/\b(?:document|localStorage|sessionStorage|fetch)\b|node:|from ['"](?:fs|https?)['"]/.test(code));
    assert.ok(Buffer.byteLength(code) < 40000);
  });
  test('태그를 읽지 않은 조회·삭제는 Java 로딩을 단정하지 않고 DB fixture를 보존한다', () => {
    for (const [task, states] of [['detail', ['detail-select', 'detail-hidden']], ['delete', model('delete').availableStates]]) {
      for (const state of states) {
        const x = model(task, state);
        assert.equal(x.collectionAccess.elementsConfirmed, false, `${task}/${state}`);
        const set = x.nodes.find(n => n.kind === 'collection');
        assert.equal(set.elements, undefined);
        assert.equal(set.elementsConfirmed, false);
        assert.match(set.loading, /미확인/);
        assert.equal(x.nodes.filter(n => n.type === 'Tag').length, 0);
        assert.match(x.rows.java.find(n => n.field === 'tags').value, /미확인/);
        assert.equal(x.after.database.post_tag.length, 2);
        assert.equal(x.after.database.tag.length, 2);
      }
    }
    for (const state of ['detail-change', 'detail-flush', 'detail-commit']) {
      const x = model('detail', state);
      assert.equal(x.collectionAccess.elementsConfirmed, true);
      assert.equal(x.nodes.find(n => n.kind === 'collection').elements.length, 2);
      assert.equal(x.nodes.filter(n => n.type === 'Tag').length, 2);
    }
    const post = blobText('src/main/java/org/example/post/Post.java');
    assert.match(post, /@ManyToMany[^;]*fetch\s*=\s*FetchType.LAZY/s);
  });
  test('컬렉션 기호는 직접 생성과 ORM 조회를 구분하고 서비스 종료 뒤 managed가 아니다', () => {
    assert.equal(model('create', 'new-object').after.collection.id, 'LinkedHashSet@Ptags');
    assert.equal(model('create', 'identity-insert').after.collection.id, 'Set@Ptags');
    assert.equal(model('detail', 'detail-select').after.collection.id, 'Set@Ptags');
    assert.equal(model('patch', 'patch-before').after.collection.id, 'Set@Ptags');
    assert.doesNotMatch(model('patch', 'patch-commit', { request: { tags: [] } }).collectionOperation, /LinkedHashSet/);
    assert.equal(model('create', 'identity-insert').transaction.managed, true);
    assert.equal(model('create', 'create-commit').transaction.managed, false);
  });

}
