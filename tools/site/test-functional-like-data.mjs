import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {FUNCTIONAL_LIKE_TASKS as tasks,getFunctionalLikeTask,readFunctionalLikeMethod} from './functional-like-data.mjs';
test('두 기능을 PUT 설정과 DELETE 취소로 구분하고 작성 응답 id를 요구한다',()=>{
  assert.equal(tasks.length,2);
  assert.deepEqual(tasks.map(t=>t.api.method),['PUT','DELETE']);
  for(const task of tasks) {
    assert.equal(task.api.path,'/api/posts/{id}/like');assert.equal(task.request.body,null);
    assert.equal(task.expected.status,200);assert.deepEqual(task.expected.fields,['postId','liked','likeCount']);
    assert.equal(task.captureScope,'like');assert.equal(task.target.snapshot,'4-1');
    assert.ok(task.completion.every(c=>c.verification&&c.source.snapshot==='4-1'));
    assert.equal(getFunctionalLikeTask(task.sourcePath.replace(/\.md$/,'.html')),task);
  }
  assert.ok(tasks[0].expected.failures[400].includes('본인'));
  assert.ok(!tasks[1].expected.failures[400].includes('본인'));
  assert.equal(getFunctionalLikeTask('scenario/ch4-like/4-1-like-toggle.md'),undefined);
  assert.equal(getFunctionalLikeTask('__proto__'),undefined);
  assert.throws(()=>readFunctionalLikeMethod('__proto__'));
});
test('코드 표시가 실제 단계 ZIP의 미구현 메서드·참고 정본과 일치한다',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../../scenario/flow/packages/like/manifest.json',import.meta.url)));
  for(const task of tasks) {
    assert.ok(manifest.packages.some(p=>p.url===task.packagePath));
    const code=readFunctionalLikeMethod(task.id);
    assert.match(code,/@Transactional/);assert.match(code,/UnsupportedOperationException/);
    assert.ok(code.includes(' '+task.target.symbol+'('));
    const answer=readFunctionalLikeMethod(task.id,{reference:true});
    assert.ok(answer.includes('existsByPost_IdAndMember_Id'));
    assert.ok(!answer.includes('UnsupportedOperationException'));
  }
  assert.throws(()=>readFunctionalLikeMethod('../reference'));
});
test('source의 실제 Controller 매핑과 응답 DTO·DB schema를 대조한다',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../../scenario/snapshots/4-1.json',import.meta.url)));
  const blob=p=>readFileSync(new URL(`../../scenario/snapshots/blobs/${manifest.files.find(f=>f.path===p).blob}.txt`,import.meta.url),'utf8');
  const controller=blob('src/main/java/org/example/like/LikeController.java');
  assert.ok(controller.includes('@PutMapping("/api/posts/{id}/like")'));
  assert.ok(controller.includes('@DeleteMapping("/api/posts/{id}/like")'));
  assert.ok(blob('src/main/java/org/example/like/LikeResponse.java').includes('Long postId, boolean liked, Integer likeCount'));
  const sql=blob('docker/mysql/init/01-community.sql');assert.ok(sql.includes('UNIQUE KEY `uk_post_like` (`post_id`,`member_id`)'));
});
