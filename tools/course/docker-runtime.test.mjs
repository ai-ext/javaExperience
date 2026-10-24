import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));

// Docker 프로세스 경계만 대체해 실제 셸의 경로 검사와 인자 전달을 확인한다.
test('컨테이너 Gradle은 공유된 프로젝트를 HOME 밖에서도 실행하고 Ryuk을 강제로 끄지 않는다', (t) => {
  fs.mkdirSync(path.join(root, 'build'), { recursive: true });
  const dir = fs.mkdtempSync(path.join(root, 'build/docker-runtime-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const bin = path.join(dir, 'bin');
  const home = path.join(dir, 'home');
  const project = path.join(dir, 'shared project');
  for (const p of [bin, home, project]) fs.mkdirSync(p);
  fs.writeFileSync(path.join(bin, 'docker'), '#!/bin/sh\nprintf "%s\\n" "$@"\n', { mode: 0o755 });
  const env = { ...process.env, HOME: home, PATH: `${bin}:${process.env.PATH}` };
  delete env.TESTCONTAINERS_RYUK_DISABLED;
  const result = spawnSync('bash', [path.join(root, 'tools/course/gradle-docker.sh'), project, 'test', '--tests', '*HealthEndpointTest*'], { env, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const args = result.stdout.trim().split('\n');
  assert.ok(args.includes('/var/run/docker.sock:/var/run/docker.sock'));
  assert.ok(args.includes(`${project}:${project}`));
  assert.deepEqual(args.slice(-5), ['./gradlew', '--console=plain', 'test', '--tests', '*HealthEndpointTest*']);
  assert.ok(!args.some((arg) => arg.startsWith('TESTCONTAINERS_RYUK_DISABLED=')));
});
