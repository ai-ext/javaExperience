import test from 'node:test';
import assert from 'node:assert/strict';

test('회차 재편 시 예전 기초 진도를 게시판 완료로 오인하지 않는다', async()=>{
  const {migrateLegacyProgress}=await import('./progress.mjs');
  assert.deepEqual(migrateLegacyProgress([1,2,3,4]),[]);
  assert.deepEqual(migrateLegacyProgress([5,12,19,57,58,60]),[1,8,15,53,58,60]);
  assert.deepEqual(migrateLegacyProgress([5,5,0,61,'5',null]),[1]);
  assert.deepEqual(migrateLegacyProgress(null),[]);
});
