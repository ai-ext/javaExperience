import fs from 'node:fs';
import cp from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const site = `${root}/tools/site`;
const output = `${root}/docs/design/d11-2026-10-25/ui-luna-logs/09-rendered-code-kind-mutant.json`;
const require = createRequire(`${site}/package.json`);
const { build } = require('esbuild');
const sourcePath = `${site}/d11-learning.js`;
const testPath = `${site}/test-d11-learning.mjs`;
const source = fs.readFileSync(sourcePath, 'utf8');
const before = "return 'Python fixture 서버 응답 조건 · Chrome 결과 별도';";
const after = "return '원문 Spring Security Java 실제 실행';";
if (!source.includes(before)) throw new Error('렌더 라벨 변이 지점을 찾을 수 없다');
const mutated = source.replace(before, after);
const bundled = await build({
  entryPoints: [testPath], bundle: true, write: false, format: 'esm', platform: 'node', packages: 'external', logLevel: 'silent',
  define: { 'import.meta.url': JSON.stringify(pathToFileURL(testPath).href) },
  plugins: [{ name: 'memory-only-rendered-label-mutant', setup(builder) {
    builder.onLoad({ filter: /d11-learning\.js$/ }, args => args.path === sourcePath ? { contents: mutated, loader: 'js', resolveDir: site } : null);
  } }],
});
const run = cp.spawnSync(process.execPath, ['--input-type=module'], { cwd: site, input: bundled.outputFiles[0].text, encoding: 'utf8', maxBuffer: 5e6 });
const result = {
  mutation: 'D11 additional HTTP source label changed to claim original Spring Security Java execution',
  productSourceWritten: false,
  before,
  after,
  exitCode: run.status,
  detected: run.status !== 0,
  stdout: run.stdout,
  stderr: run.stderr,
};
fs.writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ exitCode: result.exitCode, detected: result.detected, output }));
if (!result.detected) process.exitCode = 1;
