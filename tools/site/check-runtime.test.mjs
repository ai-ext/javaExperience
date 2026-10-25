import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

for (const script of ['check-frame.mjs', 'check-reload.mjs', 'html-check/run-shared.mjs']) {
  test(`${script}: Playwright 미지정·오류는 안내와 exit 2`, () => {
    const result = spawnSync(process.execPath, [new URL(script, import.meta.url).pathname], {
      env: { ...process.env, PLAYWRIGHT_MODULE: 'missing-playwright-module' }, encoding: 'utf8',
    });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /PLAYWRIGHT_MODULE/);
    assert.match(result.stderr, /npm install/);
  });
}

test('자체 서버는 저장소 파일을 제공하고 종료 후 포트를 반환한다', async () => {
  const { startCheckServer } = await import('./check-runtime.mjs');
  const server = await startCheckServer();
  try {
    const response = await fetch(`${server.base}/index.html`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(await response.text(), /<!doctype html>/i);
    assert.equal((await fetch(`${server.base}/not-a-real-file`)).status, 404);
  } finally { await server.close(); }
  await assert.rejects(fetch(`${server.base}/index.html`));
});
