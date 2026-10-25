import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
export const arg = name => {
  const index = process.argv.indexOf(`--${name}`);
  return process.argv.find(value => value.startsWith(`--${name}=`))?.slice(name.length + 3)
    ?? (index >= 0 ? process.argv[index + 1] : undefined);
};

export function loadPlaywright() {
  try {
    return require(process.env.PLAYWRIGHT_MODULE || require.resolve('playwright'));
  } catch {
    console.error('Playwright를 찾거나 불러오지 못했습니다. tools/site에서 npm install --no-save playwright 후 npx playwright install chromium을 실행하거나, PLAYWRIGHT_MODULE에 기존 Playwright 모듈 경로를 지정하세요.');
    process.exit(2);
  }
}

export async function checkOutput(name) {
  const out = arg('out') || await fs.mkdtemp(path.join(os.tmpdir(), `javaexperience-${name}-`));
  await fs.mkdir(out, { recursive: true });
  console.log(`검사 결과: ${out}`);
  return out;
}

// 포트 0에 직접 바인딩하여 다른 서버와 포트 선정 경쟁을 피한다.
export async function startCheckServer() {
  const external = arg('base-url') || process.env.SITE_BASE_URL;
  if (external) return { base: external.replace(/\/$/, ''), close: async () => {} };
  const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
  const server = http.createServer(async (req, res) => {
    let file;
    try { file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); }
    catch { res.writeHead(400).end(); return; }
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    try {
      if ((await fs.stat(file)).isDirectory()) file = path.join(file, 'index.html');
      const data = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  console.log(`자체 검사 서버: ${base}`);
  return { base, close: () => new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  }) };
}
