import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderKnowledgePageVisual } from './knowledge-page-visual.mjs';

const source = fs.readFileSync(new URL('../../docs/knowledge/S09-jpa-hibernate.md', import.meta.url), 'utf8');
const visual = renderKnowledgePageVisual('/repo/docs/knowledge/S09-jpa-hibernate.md', '<h2 id="why">왜 알아야 하나</h2>');
const html = fs.readFileSync(new URL('../../docs/knowledge/S09-jpa-hibernate.html', import.meta.url), 'utf8');

for (const phrase of ['EntityManager → MySQL', 'find() · SELECT', 'setter · 메모리 변경', 'flush · SQL 동기화', 'commit 분기', 'rollback 분기', 'DBeaver · 별도 관찰 연결', 'REPEATABLE READ', '학습용 예상 흐름']) {
  assert.ok(visual.includes(phrase), `rendered S09 storyboard is missing: ${phrase}`);
}
assert.match(visual, /aria-pressed="true"/);
assert.match(visual, /data-value="snapshot"/);
assert.match(visual, /class="jpa-concept-flow" aria-label="JPA 처리 경로"/);
assert.match(visual, /role="table" aria-label="post 행 id와 title"/);
assert.match(visual, /data-value="entityId">—<\/span>/);
assert.match(visual, /data-value="snapshotId">—<\/span>/);
assert.match(visual, /EntityManager/);
assert.ok(visual.indexOf('jpa-journey-panel') < visual.indexOf('jpa-journey-roles'), 'id/title value comparison should precede the compact role strip');
assert.match(visual, /UPDATE post SET title = \?/);
assert.match(visual, /states\[Number\(button\.dataset\.step\)\]/);
assert.match(source, /## 4\. 코드로 확인/);
assert.ok(html.includes('jpa-journey'), 'generated S09 HTML must include the storyboard');
assert.ok(html.includes('## 4.' ) === false, 'generated HTML should be rendered from Markdown, not expose raw headings');
console.log('S09 JPA journey structural/content checks passed.');
