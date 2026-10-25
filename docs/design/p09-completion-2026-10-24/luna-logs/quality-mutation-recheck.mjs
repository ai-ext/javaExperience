import fs from 'node:fs';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const root = 'LOCAL_HOME/code/javaExperience/.worktrees/concept-learning-night';
const outputDirectory = `${root}/docs/design/p09-completion-2026-10-24/luna-logs`;
const require = createRequire(`${root}/tools/site/package.json`);
const { build } = require('esbuild');
const { P09_LESSONS } = await import(`${root}/tools/site/p09-lesson-data.mjs`);
const read = (file) => fs.readFileSync(`${root}/${file}`, 'utf8');
const contract = read('tools/site/test-p09-boundaries.mjs');
const controller = read('tools/site/p09-learning.js');
const results = [];

async function run(name, mutate) {
  const lessons = structuredClone(P09_LESSONS);
  mutate(lessons.find((lesson) => lesson.id === 'varargs-selection').stages);
  const bundle = await build({
    stdin: { contents: controller, resolveDir: `${root}/tools/site`, sourcefile: 'p09-learning.js', loader: 'js' },
    write: false, bundle: true, format: 'iife', platform: 'browser', target: 'es2022',
    plugins: [{ name: 'isolated-lesson-data', setup(build) {
      build.onLoad({ filter: /p09-lesson-data\.mjs$/ }, () => ({ contents: `export const P09_LESSONS = ${JSON.stringify(lessons)};`, loader: 'js' }));
    } }],
  });
  const testModule = contract
    .replace("import { JSDOM } from 'jsdom';", `import { JSDOM } from ${JSON.stringify(`file://${root}/tools/site/node_modules/jsdom/lib/api.js`)};`)
    .replace("import { P09_LESSONS } from './p09-lesson-data.mjs';", `const P09_LESSONS = ${JSON.stringify(lessons)};`)
    .replace("import { P09_ASSETS } from './p09-assets.mjs';", `import { P09_ASSETS } from ${JSON.stringify(`file://${root}/tools/site/p09-assets.mjs`)};`)
    .replace("const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');", `const root = ${JSON.stringify(root)};`)
    .replace("const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');", `const read = (file) => file === 'tools/site/p09-learning.bundle.js' ? ${JSON.stringify(bundle.outputFiles[0].text)} : fs.readFileSync(path.join(root, file), 'utf8');`);
  try {
    await import(`data:text/javascript;base64,${Buffer.from(testModule).toString('base64')}`);
    results.push({ name, outcome: 'SURVIVED' });
  } catch (error) {
    results.push({ name, outcome: 'KILLED', errorName: error.name, message: error.message.split('\n')[0] });
  }
}

await run('corrupt-derived-array-length', (stages) => {
  stages.find((stage) => stage.id === 'sum-items').values.find(([key]) => key === '배열 길이')[1] = '99';
});
await run('corrupt-derived-array-elements', (stages) => {
  stages.find((stage) => stage.id === 'sum-array').values.find(([key]) => key === 'values 배열 원소')[1] = '[40, 60]';
});
fs.writeFileSync(`${outputDirectory}/quality-mutation-recheck.json`, JSON.stringify(results, null, 2) + '\n');
for (const result of results) console.log(JSON.stringify(result));
assert.ok(results.every((result) => result.outcome === 'KILLED' && result.errorName === 'AssertionError'), '각 값 변형은 독립 contract assertion에서 실패해야 한다');
