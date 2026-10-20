import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderFirstDbJourney } from './first-db-journey.mjs';

const root = new URL('../../', import.meta.url);
const source = fs.readFileSync(new URL('scenario/ch1-create-post/1-2-dto-response.md', root), 'utf8');
const html = renderFirstDbJourney();
const built = fs.readFileSync(new URL('scenario/ch1-create-post/1-2-dto-response.html', root), 'utf8');
assert.deepEqual([...html.matchAll(/data-db-panel="([^"]+)"/g)].map((item) => item[1]), ['scenario','entity','response','run','database']);
const first = html.slice(html.indexOf('data-db-panel="scenario"'), html.indexOf('data-db-panel="entity"'));
for (const term of ['Post.java', 'POST /api/posts', '만들 것', '보낼 것']) assert.ok(first.includes(term));
assert.doesNotMatch(first, /201 Created|SELECT id|Location:/);
for (const term of ['201 Created', 'Location: /api/posts/{id}', 'data-db-request-slot', 'data-db-response-id', 'SELECT id, board_id, author_id']) assert.ok(html.includes(term));
assert.match(source, /POST \/api\/posts/);
assert.match(source, /201 Created/);
assert.match(built, /first-db-journey\.js/);
assert.match(built, /first-db-journey\.css/);
console.log('1-2 첫 화면·엔티티·201·실제 요청·DB 확인 경계 통과');
