// 기존 문서 링크와 외부 도구를 위한 호환용 합본. 편집 원본은 course/days/다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCourseSources, sourceBundles, checkSourceBundles } from './sources.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
if (process.argv.includes('--check')) {
  const stale = checkSourceBundles(root);
  if (stale.length) {
    console.error(`course 합본이 원본과 다르다. 직접 고치지 말고 tools/site에서 npm run build를 실행한다:\n${stale.join('\n')}`);
    process.exitCode = 1;
  } else console.log('course 합본 3개 확인');
} else {
  for (const [rel, content] of sourceBundles(loadCourseSources(root))) fs.writeFileSync(path.join(root, rel), content);
  console.log('course 합본 3개 생성');
}
