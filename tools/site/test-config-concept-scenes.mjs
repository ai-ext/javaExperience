import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { renderConfigConceptScenes } from './config-concept-scenes.mjs';

const root = new URL('../../', import.meta.url);
const groups = [
  ['P08-maven-gradle-practical', 6, [3,4,5,7,8,16]],
  ['S03-boot-autoconfig', 2, [6,17]],
  ['S04-config-profiles', 8, [9,10,13,20,21,22,23,24]],
  ['R08-app-to-db-connection', 2, [18,19]],
];
const assets = JSON.parse(fs.readFileSync(new URL('docs/design/mockups-2026-10-16-batch41/asset-index.json', root), 'utf8'));
for (const [name, count, ids] of groups) {
  const file = `docs/knowledge/${name}.md`;
  const html = renderConfigConceptScenes(file);
  assert.equal((html.match(/class="cc-screen"/g) || []).length, count);
  assert.equal((html.match(/class="cc-screen" data-cc-screen="0" hidden/g) || []).length, 0);
  for (const id of ids) {
    const image = assets.images.find((item) => item.scene === id);
    assert.ok(image && image.role === 'concept' && image.page === file);
    assert.ok(fs.existsSync(new URL(`docs/design/mockups-2026-10-16-batch41/${image.file}`, root)));
    assert.ok(html.includes(image.file), `${file}: ${image.file} 링크 없음`);
  }
  const built = fs.readFileSync(new URL(`docs/knowledge/${name}.html`, root), 'utf8');
  assert.ok(built.includes('config-concept-scenes.css'));
  assert.ok(built.includes('config-concept-scenes.js'));
  assert.equal((built.match(/class="cc-screen"/g) || []).length, count);
  assert.ok(built.includes('기존 전체 개념 지도 보기'));
}
assert.match(renderConfigConceptScenes('P08-maven-gradle-practical.md'), /spring-boot-starter-webmvc/);
assert.match(renderConfigConceptScenes('S04-config-profiles.md'), /TypeMismatchException → NumberFormatException/);
assert.match(renderConfigConceptScenes('S03-boot-autoconfig.md'), /조건 평가/);
assert.match(renderConfigConceptScenes('R08-app-to-db-connection.md'), /Connection refused/);
assert.equal(renderConfigConceptScenes(path.join('docs/knowledge','J01-types-string.md')), '');
console.log('0-6 개념 시안 18장 · P08/S03/S04/R08 분리·원문 지도 보존 통과');
