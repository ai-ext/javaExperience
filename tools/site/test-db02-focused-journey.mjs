import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderDb02FocusedJourney } from './db02-focused-journey.mjs';

const markup = renderDb02FocusedJourney();
assert.deepEqual([...markup.matchAll(/data-db02-panel="([^"]+)"/g)].map((match) => match[1]), ['scenario', 'rows', 'cursor', 'sql', 'insertion']);
const first = markup.slice(markup.indexOf('data-db02-panel="scenario"'), markup.indexOf('data-db02-panel="rows"'));
assert.match(first, /만들 것/);
assert.match(first, /직접 할 것/);
assert.doesNotMatch(first, /145|144|WHERE|LIMIT|2026-/);
for (const [id, date] of [['145', '2026-10-03 10:10:08'], ['144', '2026-10-02 21:57:53'], ['143', '2026-10-02 08:42:47'], ['140', '2026-09-26 13:03:17']]) {
  assert.match(markup, new RegExp(`<td>${id}</td><td>${date}</td>`));
}
assert.match(markup, /p\.published_at &lt; '2026-10-02 21:57:53'/);
assert.match(markup, /p\.id &lt; 144/);
assert.match(markup, /ORDER BY p\.published_at DESC, p\.id DESC/);
assert.match(markup, /LIMIT 3/);
assert.match(markup, /143 → 140/);
assert.match(markup, /개념 시뮬레이션/);
assert.equal((markup.match(/data-db02-copy/g) || []).length, 2);

const root = new URL('../../', import.meta.url);
const built = fs.readFileSync(new URL('scenario/db-query-journey/db-02-select-cursor.html', root), 'utf8');
const seed = fs.readFileSync(new URL('docker/mysql/init/02-practice.sql', root), 'utf8');
for (const asset of ['first-db-journey.css', 'db02-focused-journey.css', 'db02-focused-journey.js']) assert.ok(built.includes(asset));
assert.equal((built.match(/data-db02-panel="/g) || []).length, 5);
assert.match(built, /class="db02-original"/);
assert.match(built, /같은 데이터에서 offset과 비교하기/);
for (const [id, date] of [['145', '2026-10-03 10:10:08'], ['144', '2026-10-02 21:57:53'], ['143', '2026-10-02 08:42:47'], ['140', '2026-09-26 13:03:17']]) assert.match(seed, new RegExp(`\\(${id},2,.*'${date}'`));
console.log('DB-02 다섯 장면·커서 SQL·practice seed·원문 보존 검사 통과');
