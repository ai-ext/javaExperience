// 이미지 시안과 구현 화면을 실제로 대조한 항목만 verified로 기록하도록 검사한다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ledger = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'docs/design/visual-parity.jsonl');
const rows = fs.readFileSync(ledger, 'utf8').trim().split('\n').filter(Boolean).map((line, index) => {
  try { return JSON.parse(line); }
  catch (error) { throw new Error(`${ledger}:${index + 1}: JSON 오류: ${error.message}`); }
});
const ids = new Set();
const errors = [];
const exists = (name) => typeof name === 'string' && name.length > 0 && fs.existsSync(path.resolve(root, name));

for (const row of rows) {
  if (!row.id || ids.has(row.id)) errors.push(`중복되거나 비어 있는 id: ${row.id || '(없음)'}`);
  ids.add(row.id);
  if (!['draft', 'mockup_ready', 'implemented', 'verified'].includes(row.status)) errors.push(`${row.id}: 알 수 없는 status`);
  if (!exists(row.mockup)) errors.push(`${row.id}: 시안 파일이 없다: ${row.mockup || '(없음)'}`);
  if (row.status === 'verified') {
    for (const field of ['desktopCapture', 'mobileCapture']) {
      if (!exists(row[field])) errors.push(`${row.id}: ${field} 파일이 없다: ${row[field] || '(없음)'}`);
    }
    for (const field of ['sourceCheck', 'visualDiff', 'interactionCheck']) {
      if (!String(row[field] || '').trim()) errors.push(`${row.id}: ${field} 기록이 없다`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`시안 대조 기록 ${rows.length}개 검사 완료 · verified ${rows.filter((row) => row.status === 'verified').length}개`);
