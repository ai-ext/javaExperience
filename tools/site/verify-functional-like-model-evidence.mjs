// 실행 보고서의 원시 응답·별도 SQL과 설명 모델을 다른 경로로 대조한다.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getLikeVisualModel } from './functional-like-model.mjs';

const sourceURL = process.argv[2] ? pathToFileURL(process.argv[2])
  : new URL('../../docs/design/scenario-like-2026-10-21/runtime-verification/round2.json',import.meta.url);
const report=JSON.parse(readFileSync(sourceURL));
assert.equal(report.status,'passed');
assert.equal(report.browserVerified,false);
assert.equal(report.likeSource.records.length,82);
for(const file of report.likeSource.records) {
  const bytes=readFileSync(new URL(`../../scenario/snapshots/blobs/${file.blob}.txt`,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),file.sha256);
  assert.equal(createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex'),file.blob);
}
const pairs=[['first-put','PUT','commit'],['repeated-put','PUT','repeat'],['first-delete','DELETE','commit'],['repeated-delete','DELETE','repeat'],['put-counter-failure-rollback','PUT','rollback'],['delete-counter-failure-rollback','DELETE','rollback']];
for(const [stage,method,phase] of pairs) {
  const actual=report.likeObservations.find(x=>x.stage===stage);
  const expected=getLikeVisualModel({method,phase});
  assert.ok(actual,stage);
  assert.equal(actual.post.id,report.capturedPostId);
  assert.equal(actual.post.author_id,4);
  assert.equal(actual.post.like_count,expected.observer.post.like_count);
  assert.deepEqual(actual.post_like.map(x=>x.member_id).sort((a,b)=>a-b),expected.observer.post_like.map(x=>x.member_id).sort((a,b)=>a-b));
  assert.ok(actual.post_like.every(x=>x.post_id===report.capturedPostId));
}
const ownCreated=report.requests.find(r=>r.method==='POST'&&r.path==='/api/posts'&&r.actor==='liker');
assert.ok(ownCreated);assert.equal(ownCreated.response.status,201);
const ownPost=JSON.parse(ownCreated.response.body);assert.equal(ownPost.author.id,2);
const ownResponses=report.requests.filter(r=>r.path===`/api/posts/${ownPost.id}/like`&&r.actor==='liker');
assert.ok(ownResponses.some(r=>r.method==='PUT'&&r.response.status===400));
assert.ok(ownResponses.some(r=>r.method==='DELETE'&&r.response.status===200&&JSON.parse(r.response.body).liked===false));
const sequential=report.requests.filter(r=>r.path===`/api/posts/${report.capturedPostId}/like`).slice(0,4);
for(const [index,expected] of [
  {method:'PUT',liked:true,likeCount:3},{method:'PUT',liked:true,likeCount:3},
  {method:'DELETE',liked:false,likeCount:2},{method:'DELETE',liked:false,likeCount:2},
].entries()) {
  const r=sequential[index];assert.equal(r.method,expected.method);assert.equal(r.response.status,200);
  assert.deepEqual(JSON.parse(r.response.body),{postId:report.capturedPostId,liked:expected.liked,likeCount:expected.likeCount});
}
assert.equal(report.cleanupErrors,undefined);
assert.ok(report.cleanup.some(x=>x.includes('removed own ID/name/run-label matched container')));
const result={status:'passed',sourceReport:fileURLToPath(sourceURL),sourceFiles:82,comparedSqlStages:pairs.length,httpRequests:report.requests.length,sqlObservations:report.likeObservations.length,
  scope:'원시 HTTP/SQL과 모델의 commit·repeat·DB rollback 값 대조. 요청 중 Java 값·SQL 발행 시점·동시성·브라우저 검증은 아님.'};
if(process.argv[3]) writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
