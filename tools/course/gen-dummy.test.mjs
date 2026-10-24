import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('더미 CSV는 결정적이며 관계·중복·대사가 맞고 훼손을 거부한다', async () => {
  assert.ok(fs.existsSync(new URL('./gen-dummy.mjs', import.meta.url)), '생성기 필요');
  const { generate } = await import('./gen-dummy.mjs');
  const { verify } = await import('./verify-dummy.mjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'course-dummy-test-'));
  try {
    generate(dir);
    const first = new Map(fs.readdirSync(dir).map(f => [f, fs.readFileSync(path.join(dir, f))]));
    generate(dir);
    for (const [f,b] of first) assert.deepEqual(fs.readFileSync(path.join(dir,f)), b, f);
    assert.deepEqual(verify(dir).errors, []);
    const likes = path.join(dir,'likes.csv');
    const lines = fs.readFileSync(likes,'utf8').trimEnd().split('\n');
    fs.appendFileSync(likes, lines[1]+'\n');
    assert.ok(verify(dir).errors.some(e => /중복/.test(e)));
    fs.writeFileSync(likes, first.get('likes.csv'));
    const posts = path.join(dir,'posts.csv');
    fs.writeFileSync(posts, fs.readFileSync(posts,'utf8').replace(/\n1,\d+,/, '\n1,999999,'));
    assert.ok(verify(dir).errors.some(e => /참조/.test(e)));
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
