import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderDb06FocusedJourney } from './db06-focused-journey.mjs';

const root = new URL('../../', import.meta.url);
const source = fs.readFileSync(new URL('scenario/db-query-journey/db-06-exists-not-exists.md', root), 'utf8');
const ddl = fs.readFileSync(new URL('docker/mysql/init/02-practice.sql', root), 'utf8');
const markup = renderDb06FocusedJourney(source);
assert.deepEqual([...markup.matchAll(/data-db06-panel="([^"]+)"/g)].map((match) => match[1]),
  ['scenario', 'mini', 'correlation', 'not-exists', 'exists', 'not-in', 'null', 'left-join', 'compare', 'java']);
const first = markup.slice(markup.indexOf('data-db06-panel="scenario"'), markup.indexOf('data-db06-panel="mini"'));
assert.match(first, /만들 것/);
assert.match(first, /직접 할 것/);
assert.doesNotMatch(first, /101|102|103|NOT EXISTS|NULL|SQL 복사/);
for (const id of ['101', '102', '103']) assert.match(markup, new RegExp(`data-db06-mini="${id}"`));
assert.match(markup, /b\.member_id = pl\.member_id/);
assert.match(markup, /b\.post_id = pl\.post_id/);
assert.match(markup, /101 NOT IN \(102, NULL\)/);
assert.match(markup, /UNKNOWN/);
assert.match(markup, /실제 bookmark\.post_id는 NOT NULL/);
assert.match(markup, /bookmark\(member_id, post_id\).*UNIQUE/);
for (const key of ['not-exists', 'exists', 'not-in', 'left-join']) {
  assert.match(markup, new RegExp(`data-db06-sql="${key}"`));
  assert.match(markup, new RegExp(`data-db06-record="${key}"`));
}
const blocks = [...source.matchAll(/<pre class="sql"><code>([\s\S]*?)<\/code><\/pre>/g)].map((match) => match[1].replaceAll('<span class="focus">', '').replaceAll('</span>', ''));
assert.equal(blocks.length, 4);
for (const block of blocks) assert.ok(markup.includes(block), '원문의 SQL을 그대로 표시해야 한다');
assert.match(ddl, /CREATE TABLE `bookmark` \([\s\S]*?`post_id` bigint NOT NULL,[\s\S]*?UNIQUE KEY `uk_bookmark` \(`member_id`,`post_id`\)/);
const built = fs.readFileSync(new URL('scenario/db-query-journey/db-06-exists-not-exists.html', root), 'utf8');
for (const asset of ['first-db-journey.css', 'db06-focused-journey.css', 'db06-focused-journey.js']) assert.ok(built.includes(asset));
assert.equal((built.match(/data-db06-panel="/g) || []).length, 10);
assert.match(built, /class="db06-original"/);
assert.match(built, /스키마 근거와 실행/);
console.log('DB-06 열 장면·원문 4 SQL·NOT NULL/UNIQUE·NULL 가상 경계 검사 통과');
