import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const checker = fileURLToPath(new URL('./contrast-check.mjs', import.meta.url));
test('CLI는 실제 위반에 1, 통과에 0, 실행 오류에 2를 반환한다', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(),'contrast-fixture-'));
  try {
    const run = () => spawnSync(process.execPath,[checker,'--root',fixture,'--out',path.join(fixture,'result')],{encoding:'utf8'});
    fs.writeFileSync(path.join(fixture,'index.html'),'<style>body{background:#fff;color:#fff}</style><p>보이지 않는 글자</p>');
    const bad = run(); assert.equal(bad.status,1,bad.stderr);
    assert.ok(JSON.parse(fs.readFileSync(path.join(fixture,'result/contrast-results.json'))).summary.severe>0);
    fs.writeFileSync(path.join(fixture,'index.html'),'<style>body{background:#171a1f;color:#fff}</style><p>읽을 수 있는 글자</p>');
    const good = run(); assert.equal(good.status,0,good.stderr);
    const missing = spawnSync(process.execPath,[checker],{env:{...process.env,PLAYWRIGHT_MODULE:'missing-playwright-module'},encoding:'utf8'});
    assert.equal(missing.status,2); assert.match(missing.stderr,/PLAYWRIGHT_MODULE/);
  } finally { fs.rmSync(fixture,{recursive:true,force:true}); }
});
