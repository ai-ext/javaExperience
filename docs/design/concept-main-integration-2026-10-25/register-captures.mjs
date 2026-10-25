// 새 통합 검증 캡처만 별도 등록한다. 고정 입력 2345개와 출처는 변경하지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { rasterDimensions } from '../../../tools/site/raster-size.mjs';
const directory = path.dirname(fileURLToPath(import.meta.url));
const root = fileURLToPath(new URL('../../../', import.meta.url));
const file = path.join(directory, 'jpg-integration-baseline.json');
const baseline = JSON.parse(fs.readFileSync(file));
const fixed = new Set(baseline.expectedJpgs.map(row => row.path));
baseline.extraCandidateJpgs = fs.readdirSync(directory).filter(name => /\.jpg$/i.test(name)).map(name => {
  const absolute = path.join(directory, name), relative = path.relative(root, absolute);
  if (fixed.has(relative)) return null;
  const bytes = fs.readFileSync(absolute), dimensions = rasterDimensions(bytes);
  if (dimensions.format !== 'jpeg') throw new Error(`${relative}: JPEG 형식 필요`);
  return { path: relative, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, ...dimensions, pinnedInput: false, origin: 'current integration browser QA capture' };
}).filter(Boolean).sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync(file, JSON.stringify(baseline, null, 2) + '\n');
console.log(`고정 입력 ${baseline.expectedJpgs.length}개 보존, 통합 캡처 ${baseline.extraCandidateJpgs.length}개 등록`);
