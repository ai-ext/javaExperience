// 이식된 검사가 원본 worktree 파일을 몰래 읽지 않는지 확인하는 진단 전용 preload.
const fs = require('node:fs');
const path = require('node:path');
const { fileURLToPath } = require('node:url');
const { syncBuiltinESMExports } = require('node:module');
const input = JSON.parse(fs.readFileSync(path.join(__dirname, 'INPUT.json')));
const forbidden = input.sourceWorktree + path.sep;
const attempts = [];
const append = fs.appendFileSync.bind(fs);
const inspect = value => {
  if (typeof value === 'number' || value == null) return;
  const filename = value instanceof URL ? fileURLToPath(value) : Buffer.isBuffer(value) ? value.toString() : value;
  if (typeof filename !== 'string') return;
  const absolute = path.resolve(filename);
  if (absolute === input.sourceWorktree || absolute.startsWith(forbidden)) {
    attempts.push(absolute);
    throw new Error('통합 검사의 원본 worktree 파일 의존: ' + absolute);
  }
};
for (const method of ['readFileSync','readFile','openSync','open','createReadStream','existsSync','accessSync','access']) {
  const original = fs[method];
  fs[method] = function (filename, ...args) { inspect(filename); return original.call(this, filename, ...args); };
}
const readPromise = fs.promises.readFile.bind(fs.promises);
fs.promises.readFile = function (filename, ...args) { inspect(filename); return readPromise(filename, ...args); };
syncBuiltinESMExports();
process.on('exit', () => append(path.join(__dirname, 'source-read-guard.jsonl'), JSON.stringify({ pid: process.pid, attempts }) + '\n'));
