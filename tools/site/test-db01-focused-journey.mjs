import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderDb01FocusedJourney } from './db01-focused-journey.mjs';

const markup = renderDb01FocusedJourney();
assert.deepEqual([...markup.matchAll(/data-db01-panel="([^"]+)"/g)].map((match) => match[1]),
  ['scenario', 'fields', 'conditions', 'sql', 'first-row', 'tags']);
const first = markup.slice(markup.indexOf('data-db01-panel="scenario"'), markup.indexOf('data-db01-panel="fields"'));
assert.match(first, /만들 것/);
assert.match(first, /먼저 확인할 것/);
assert.doesNotMatch(first, /145|HTTP 200|SELECT p\.id|ORDER BY|COUNT/);
for (const field of ['title', 'authorNickname', 'likeCount', 'tags', 'publishedAt']) assert.match(markup, new RegExp(`data-db01-field="${field}"`));
for (const relation of ['post.author_id → member.id → member.nickname', 'board.slug → board.id → post.board_id', 'post → post_tag → tag']) assert.ok(markup.includes(relation));
assert.match(markup, /p\.deleted_at IS NULL/);
assert.match(markup, /p\.visibility = 'PUBLIC'/);
assert.match(markup, /ORDER BY p\.published_at DESC, p\.id DESC/);
assert.match(markup, /LIMIT 20/);
assert.match(markup, /WHERE pt\.post_id IN \(145,144,143,140,138\)/);
assert.match(markup, /글 145 → tag java/);
assert.match(markup, /M1 API 서버 구현은 없어/);
assert.equal((markup.match(/data-db01-copy="/g) || []).length, 2);

const root = new URL('../../', import.meta.url);
const built = fs.readFileSync(new URL('scenario/db-query-journey/db-01-response-to-query.html', root), 'utf8');
for (const asset of ['first-db-journey.css', 'db01-focused-journey.css', 'db01-focused-journey.js']) assert.ok(built.includes(asset), `asset missing: ${asset}`);
assert.equal((built.match(/data-db01-panel="/g) || []).length, 6);
assert.match(built, /class="db01-original"/);
assert.match(built, /기준 SQL 보기 — 게시글 목록과 태그 일괄 조회/);

const seed = fs.readFileSync(new URL('docker/mysql/init/02-practice.sql', root), 'utf8');
assert.match(seed, /\(145,2,6,'스프링 트랜잭션 전파 삽질기'.*'PUBLISHED','PUBLIC',193,20,1/);
assert.match(seed, /\(6,'user06@example\.invalid','밤샘개발자'/);
assert.match(seed, /\(145,1\);/);
assert.match(seed, /\(1,'java'/);
console.log('DB-01 여섯 장면·SQL/관계·practice seed·원문 보존 검사 통과');
