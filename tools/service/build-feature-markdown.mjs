// authored 기능 JSON의 공개 HTML 소스 파일을 생성한다. 기능 내용은 JSON만이 소유한다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CATALOG = path.join(ROOT, 'service/catalog.json');
if (!fs.existsSync(CATALOG)) {
  console.log('service/catalog.json 미작성: 기능 페이지 생성 생략');
  process.exit(0);
}
const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
const targetDir = path.join(ROOT, 'scenario/features');
fs.mkdirSync(targetDir, { recursive: true });
let count = 0;
for (const entry of catalog.features || []) {
  if (!/^[a-z0-9-]+$/.test(entry.id || '') || !/^features\/[a-z0-9-]+\.json$/.test(entry.file || '')) throw new Error(`catalog feature id/file 오류: ${entry.id || '(없음)'} / ${entry.file || '(없음)'}`);
  const sourcePath = path.join(ROOT, 'service', entry.file);
  if (!fs.existsSync(sourcePath)) {
    console.log(`${entry.id}: 기능 원본 미작성, 페이지 생성 생략`);
    continue;
  }
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  if (source.id !== entry.id) throw new Error(`${entry.id}: feature JSON id 불일치`);
  const title = source.title || entry.title;
  const summary = source.summary || entry.summary || '';
  const state = entry.status === 'authored' ? '기획 원본' : '작성 중';
  const markdown = `<!-- Generated from service/catalog.json and service/features/${entry.id}.json. Do not edit. -->\n# ${title}\n\n> ${state} · 상세 기획 원본은 service/features/${entry.id}.json입니다.\n\n${summary}\n`;
  fs.writeFileSync(path.join(targetDir, `${entry.id}.md`), markdown);
  count += 1;
}
console.log(`feature markdown ${count}개 생성`);
