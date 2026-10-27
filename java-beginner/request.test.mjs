import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';

test('요청 도구는 잘못된 JSON과 외부/상위 경로를 전송 전에 거절한다', async () => {
  assert.ok(existsSync(new URL('./request.mjs', import.meta.url)), '새 요청 도구가 필요합니다');
  const {buildRequest} = await import('./request.mjs');
  const base = {method:'POST', path:'/api/posts', body:'{"title":"공지"}', headers:'{}', vars:{}};
  assert.throws(() => buildRequest({...base, body:'{oops'}), /JSON/);
  for (const path of ['https://evil.test/api', '//evil.test/api', '/api/../secret', '/api/%2e%2e/secret', '/api/%252e%252e/secret', '/api\\evil']) {
    assert.throws(() => buildRequest({...base, path}), /경로|주소/);
  }
  assert.throws(() => buildRequest({...base, path:'/api/posts/{postId}'}), /postId/);
  assert.throws(() => buildRequest({...base, headers:'{"Cookie":"secret"}'}), /헤더/);
  assert.throws(() => buildRequest({...base, method:'TRACE'}), /메서드/);
});

test('한글 query와 생성 번호를 사용하며 GET 본문을 보내지 않는다', async () => {
  const {buildRequest, captureResource, inspectResponse} = await import('./request.mjs');
  const request = buildRequest({method:'GET',path:'/api/posts/{postId}',vars:{postId:'42'},query:'keyword=배포&page=0',headers:'{}',body:'invalid unused'});
  assert.ok(request.url.includes('/__api/api/posts/42?'));
  assert.equal(new URL(request.url,'http://localhost').searchParams.get('keyword'),'배포');
  assert.equal(request.init.body, undefined);
  assert.deepEqual(captureResource('post-create', {id:42}), {postId:'42'});
  assert.deepEqual(captureResource('order-idempotent', {id:17}), {orderId:'17'});
  assert.deepEqual(captureResource('post-create', {id:'../../bad'}), {});
  assert.equal(inspectResponse(201, {id:42}, {expect:201, fields:['id']}).statusMatch,true);
  assert.equal(inspectResponse(201, {}, {expect:201, fields:['id']}).fieldsMatch,false);
  assert.equal(inspectResponse(500, {}, {expect:201, fields:['id']}).statusMatch,false);
});
