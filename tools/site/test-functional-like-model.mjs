import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { getLikeVisualModel as model, LIKE_VISUAL_PHASES } from './functional-like-model.mjs';

test('4-1 manifest와 실제 Git blob의 출처가 일치한다', () => {
  const snapshot = JSON.parse(readFileSync(new URL('../../scenario/snapshots/4-1.json', import.meta.url)));
  for (const file of model().source.files) {
    assert.equal(snapshot.files.find(f => f.path === file.path)?.blob, file.blob);
    const bytes = readFileSync(new URL(`../../scenario/snapshots/blobs/${file.blob}.txt`, import.meta.url));
    assert.equal(createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex'), file.blob);
  }
});
test('PUT은 전체 2→3, 내 관계 없음→있음, 다른 회원의 관계는 보존한다', () => {
  const m = model({method:'PUT',phase:'commit'});
  assert.equal(m.before.post.like_count, 2);
  assert.equal(m.java.post.likeCount, 3);
  assert.deepEqual(m.observer.post_like, [{post_id:42,member_id:3},{post_id:42,member_id:6},{post_id:42,member_id:2}]);
  assert.deepEqual(m.response, {status:200,body:{postId:42,liked:true,likeCount:3}});
  assert.equal(m.changes.relationDelta,1);
});
test('같은 PUT을 다시 보내도 상태를 뒤집거나 카운터를 추가 증가시키지 않는다', () => {
  const m=model({method:'PUT',phase:'repeat'});
  assert.equal(m.java.post.likeCount,3);
  assert.equal(m.observer.post_like.length,3);
  assert.equal(m.changes.relationDelta,0);
  assert.equal(m.changes.counterDelta,0);
  assert.deepEqual(m.response.body,{postId:42,liked:true,likeCount:3});
  assert.deepEqual(m.sql.mutations,[]);
});
test('처음부터 내 관계가 있으면 첫 PUT도 쓰기가 없다', () => {
  const m=model({method:'PUT',phase:'commit',initialLiked:true});
  assert.equal(m.changes.counterDelta,0);
  assert.equal(m.observer.post_like.length,3);
  assert.deepEqual(m.sql.mutations,[]);
});
test('DELETE는 내 관계만 제거하고 다른 회원의 두 관계와 post를 보존한다', () => {
  const m=model({method:'DELETE',phase:'commit'});
  assert.equal(m.before.post.like_count,3);
  assert.equal(m.observer.post.like_count,2);
  assert.deepEqual(m.observer.post_like,[{post_id:42,member_id:3},{post_id:42,member_id:6}]);
  assert.deepEqual(m.response,{status:200,body:{postId:42,liked:false,likeCount:2}});
  assert.equal(m.changes.relationDelta,-1);
  assert.ok(m.sql.mutations.every(s=>!s.startsWith('DELETE FROM post ')));
});
test('반복 DELETE와 처음부터 관계가 없는 DELETE는 추가로 감소하지 않는다', () => {
  for(const opts of [{phase:'repeat'},{phase:'commit',initialLiked:false}]) {
    const m=model({method:'DELETE',...opts});
    assert.equal(m.java.post.likeCount,2);
    assert.equal(m.changes.counterDelta,0);
    assert.equal(m.observer.post_like.length,2);
    assert.deepEqual(m.sql.mutations,[]);
  }
});
test('Service 반환 전후 SQL 발행 순서는 미측정이며 동기화와 commit을 구별한다', () => {
  for(const method of ['PUT','DELETE']) {
    const pending=model({method,phase:'service'});
    const flushed=model({method,phase:'flushed'});
    const committed=model({method,phase:'commit'});
    assert.equal(pending.appDatabase,null);
    assert.equal(flushed.appDatabase.post.like_count,committed.observer.post.like_count);
    assert.deepEqual(flushed.observer,pending.before);
    assert.notDeepEqual(committed.observer,pending.before);
    assert.equal(pending.response,null);
    assert.equal(flushed.response,null);
    assert.match(pending.sql.limit,/IDENTITY/);
    assert.equal(flushed.transaction.status,'active');
    assert.equal(committed.transaction.status,'committed');
  }
});
test('동기화 중 실패하면 DB와 외부 관찰은 원상태이며 Java 자동 원복을 주장하지 않는다', () => {
  for(const method of ['PUT','DELETE']) {
    const m=model({method,phase:'rollback'});
    assert.deepEqual(m.appDatabase,m.before);
    assert.deepEqual(m.observer,m.before);
    assert.notEqual(m.java.post.likeCount,m.before.post.like_count);
    assert.equal(m.transaction.objectAutomaticallyRestored,false);
    assert.equal(m.response,null,'실패 주입에 임의의 HTTP 상태를 만들지 않음');
    assert.equal(m.transaction.status,'rolled-back');
    assert.match(m.note,/객체 변경 뒤/,'표시한 마지막 Java 값이 성립하는 실패 시점을 한정한다');
  }
});
test('PUT 자기 글 400이지만 DELETE 자기 글에는 별도 금지 검사가 없다', () => {
  const put=model({method:'PUT',phase:'commit',scenario:'own'});
  const del=model({method:'DELETE',phase:'commit',scenario:'own',initialLiked:false});
  assert.equal(put.response.status,400);
  assert.deepEqual(put.observer,put.before);
  assert.equal(del.response.status,200);
  assert.equal(del.response.body.liked,false);
});
test('인증·회원 상태·가시성·발행 여부 오류는 두 메서드의 쓰기 전에 거절한다', () => {
  for(const method of ['PUT','DELETE']) for(const [scenario,status] of Object.entries({anonymous:401,inactive:403,missing:404,hidden:404,draft:404,deleted:404})) {
    const m=model({method,phase:'commit',scenario});
    assert.equal(m.response.status,status,`${method} ${scenario}`);
    assert.deepEqual(m.observer,m.before);
    assert.deepEqual(m.sql.mutations,[]);
  }
});
test('실제 실행·모든 동시 요청 해결로 과장하지 않고 각 상태는 독립 복제다', () => {
  for(const method of ['PUT','DELETE']) for(const phase of LIKE_VISUAL_PHASES) {
    const m=model({method,phase});
    assert.equal(m.kind,'educational-example');
    assert.equal(m.actualRuntime,false);
    assert.equal(m.transaction.guaranteesConcurrentRequests,false);
    assert.match(m.observation,/autocommit/);
    assert.ok(m.limits.some(s=>s.includes('4-2')));
  }
  const m=model();m.before.post_like.push({post_id:42,member_id:99});
  assert.equal(model().before.post_like.length,2);
});
test('조회한 Post의 기본 title은 표시하되 관계 여부를 Post 필드에 넣지 않는다',()=>{
  for(const method of ['PUT','DELETE'])for(const phase of LIKE_VISUAL_PHASES) {
    const m=model({method,phase});assert.equal(m.java.post.title,m.before.post.title);
    assert.equal(Object.hasOwn(m.java.post,'relationExists'),false);
  }
});
test('잘못된 설명 입력을 조용히 다른 흐름으로 바꾸지 않는다', () => {
  for(const opts of [{method:'POST'},{phase:'bad'},{scenario:'bad'},{initialLiked:'false'}]) {
    assert.throws(()=>model(opts));
  }
});
