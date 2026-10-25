import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'crud-starters-test-'));
const generator = path.join(root, 'tools/site/generate-functional-starters.py');
assert.ok(fs.existsSync(generator), '시작 패키지 생성기가 있어야 한다');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const readZip = filename => JSON.parse(execFileSync('python3', ['-c', `
import base64,json,sys,zipfile
with zipfile.ZipFile(sys.argv[1]) as z:
 print(json.dumps([{'path':i.filename,'date':i.date_time,'mode':i.external_attr >> 16,'data':base64.b64encode(z.read(i)).decode()} for i in z.infolist()]))
`, filename], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }));
const methodPattern = name => new RegExp(`(^    public [^\\n]*\\b${name}\\([^\\n]*\\) \\{)([\\s\\S]*?)(\\n    \\})`, 'm');
const methods = ['create', 'getDetail', 'list', 'patch', 'delete'];
const taskIds = ['create', 'detail', 'list', 'update', 'delete'];
const serviceFile = name => `src/main/java/org/example/post/${['getDetail', 'list'].includes(name) ? 'PostQueryService' : 'PostService'}.java`;
try {
  execFileSync('python3', [generator, '--output-dir', temp], { cwd: root });
  const manifestBytes = fs.readFileSync(path.join(temp, 'manifest.json'));
  const manifest = JSON.parse(manifestBytes);
  assert.equal(manifest.sourceSnapshot.id, '3-2');
  assert.equal(manifest.sourceSnapshot.fileCount, 75);
  const snapshotPath = path.join(root, 'scenario/snapshots/3-2.json');
  assert.equal(manifest.sourceSnapshot.sha256, hash(fs.readFileSync(snapshotPath)));
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath));
  assert.equal(manifest.packages.length, 6);
  for (const [index, taskId] of [...taskIds, 'reference'].entries()) {
    const pkg = manifest.packages.find(item => item.taskId === taskId);
    assert.ok(pkg, `${taskId}: 다운로드 항목`);
    assert.deepEqual(pkg.stubMethods, index === 5 ? [] : methods.slice(index));
    assert.deepEqual(pkg.providedMethods, index === 5 ? methods : methods.slice(0, index));
    const zipPath = path.join(temp, path.basename(pkg.url));
    const before = fs.readFileSync(zipPath);
    assert.equal(hash(before), pkg.sha256);
    const entries = readZip(zipPath);
    const files = new Map(entries.map(entry => [entry.path, Buffer.from(entry.data, 'base64')]));
    assert.equal(files.size, entries.length, '중복 ZIP 경로 금지');
    assert.equal(files.size, 75 + manifest.supplementalFiles.length + 2);
    for (const entry of entries) {
      assert.ok(!path.posix.isAbsolute(entry.path) && !entry.path.split('/').includes('..') && !entry.path.includes('\\'));
      assert.deepEqual(entry.date, [2026, 1, 1, 0, 0, 0]);
    }
    assert.ok(files.get('README-LEARNING.md').toString().includes(taskId === 'reference' ? '완성 참고 답안' : '교육용 starter'));
    assert.ok(files.get('README-LEARNING.md').toString().includes('학생 코드'));
    const readme = files.get('README-LEARNING.md').toString();
    for (const required of ['DB_PORT=13308 docker compose up -d mysql', 'docker compose ps mysql',
      'healthy', './gradlew bootRun', 'http://localhost:8080/api/start/ping', 'pong',
      'http://localhost:8080/api/posts', 'Authorization: Bearer tok-kimjava',
      'community / community', '김자바', '현재 프로젝트와 DB를 유지', '덮어쓰지', '중간 합류']) {
      assert.ok(readme.includes(required), `${taskId}: 실행 안내 ${required}`);
    }
    assert.match(readme, /코드 수정.*자동 반영되지 않습니다/s);
    assert.match(readme, /Ctrl\+C.*앱만.*종료.*같은 프로젝트.*bootRun.*다시/s);
    assert.match(readme, /DB.*응답 id.*유지/);
    assert.ok(!readme.includes('down -v') && !readme.includes('reset'), 'DB 삭제/초기화 명령 금지');
    const application = files.get('src/main/resources/application.yml').toString();
    assert.ok(application.includes('jdbc:mysql://localhost:13308/community'));
    assert.ok(application.includes('username: community') && application.includes('password: community'));
    assert.ok(files.get('compose.yaml').toString().includes('${DB_PORT:-13308}:3306'));
    const init = files.get('docker/mysql/init/01-community.sql').toString();
    assert.ok(init.includes("VALUES (2,'tok-kimjava',2,'2099-12-31 23:59:59',NULL"));
    assert.ok(init.includes("VALUES (2,'kimjava@example.invalid','김자바','USER','ACTIVE'"));
    assert.ok(files.has('docker/mysql/init/02-practice.sql') && files.has('docker/mysql/init/03-grants.sql'));

    const provenance = JSON.parse(files.get('PACKAGE-MANIFEST.json'));
    assert.equal(provenance.files.length, 75);
    for (const original of snapshot.files) {
      const source = fs.readFileSync(path.join(root, `scenario/snapshots/blobs/${original.blob}.txt`));
      const actual = files.get(original.path);
      assert.ok(actual, `${taskId}: ${original.path}`);
      let restored = actual.toString();
      for (const method of pkg.stubMethods.filter(name => serviceFile(name) === original.path)) {
        const pattern = methodPattern(method);
        const originalBody = source.toString().match(pattern);
        const stub = restored.match(pattern);
        assert.ok(originalBody && stub, `${taskId}: ${method} 메서드 존재`);
        assert.equal(stub[2].trim(), `throw new UnsupportedOperationException("학습용 미구현: ${method} 메서드를 완성하세요.");`);
        restored = restored.replace(pattern, () => originalBody[0]);
      }
      assert.deepEqual(Buffer.from(restored), source, `${taskId}: 허용된 메서드 body 이외 정본 보존 ${original.path}`);
      const record = provenance.files.find(item => item.path === original.path);
      assert.equal(record.sourceSha256, hash(source));
      assert.equal(record.sha256, hash(actual));
    }
    for (const extra of manifest.supplementalFiles) {
      assert.equal(hash(files.get(extra.path)), extra.sha256);
      assert.equal(extra.source, extra.path);
      assert.equal(hash(fs.readFileSync(path.join(root, extra.source))), extra.sha256);
    }
    execFileSync('python3', [generator, '--output-dir', temp], { cwd: root });
    assert.deepEqual(fs.readFileSync(zipPath), before, `${taskId}: 재생성 ZIP 바이트 동일`);
  }
  assert.deepEqual(fs.readFileSync(path.join(temp, 'manifest.json')), manifestBytes, 'manifest 재생성 동일');
  const helper = await import('./functional-code.mjs');
  const generated = helper.loadFunctionalPackageManifest();
  assert.equal(generated.packages.length, 6);
  assert.match(helper.readFunctionalCodeFile(serviceFile('create'), { taskId: 'create' }), /학습용 미구현: create/);
  assert.doesNotMatch(helper.readFunctionalCodeFile(serviceFile('create')), /학습용 미구현/);
  assert.throws(() => helper.readFunctionalCodeFile('../build.gradle'));
  assert.throws(() => helper.readFunctionalCodeFile('build.gradle', { taskId: 'unknown' }));
  assert.throws(() => helper.readFunctionalCodeFile('/etc/passwd'));
  console.log('PASS: 정적 blob 75개, 5단계의 정확한 미구현 body, 공통기반, 출처/해시, ZIP 재현성/안전 경로, 코드 helper');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
