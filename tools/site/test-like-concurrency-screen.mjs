import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../../', import.meta.url);
const source = fs.readFileSync(new URL('scenario/ch4-like/4-2-like-concurrency.md', root), 'utf8');
const built = fs.readFileSync(new URL('scenario/ch4-like/4-2-like-concurrency.html', root), 'utf8');
for (const term of ['UNIQUE(post_id, member_id)', 'UPDATE post SET like_count = like_count + 1', '동시에 5번 PUT', '5개 모두 `200`', '행은 1개']) assert.ok(source.includes(term), `${term} 원문 누락`);
for (const term of ['class="like-race-story"', '설명용 장면 · 실제 글 16의 초기값은 0', 'UNIQUE(post_id, member_id)', 'like_count = like_count + 1', 'PUT', '/api/posts/16/like']) assert.ok(built.includes(term), `${term} HTML 누락`);
assert.match(built, /like-concurrency-visual\.css/);
assert.match(built, /class="first-java-journey like-focus-journey"/);
assert.equal((built.match(/class="first-java-screen like-focus-screen"/g) || []).length, 8);
for (const id of ['P1', 'P2', 'P3']) assert.match(built, new RegExp(`data-first-java-request="${id}"`));
for (const term of ['4-2 · 상황', '4-2 · P3 · 취소', '기대: 20', '기대: 0', '4-3-my-likes.html', 'like-concurrency-journey.css', 'first-java-journey.js']) assert.ok(built.includes(term), `${term} 집중 화면 누락`);
assert.doesNotMatch(built, /4-3-like-count-performance\.html/);
console.log('4-2 갱신 손실·원자 UPDATE·같은 회원 5요청 원문/HTML 계약 통과');
