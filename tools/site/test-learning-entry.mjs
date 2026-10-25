import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../../', import.meta.url);
const first = fs.readFileSync(new URL('scenario/ch1-create-post/1-1-receive-request.md', root), 'utf8');
const stored = fs.readFileSync(new URL('scenario/ch1-create-post/1-2-dto-response.md', root), 'utf8');
const home = fs.readFileSync(new URL('index.html', root), 'utf8');
const index = fs.readFileSync(new URL('scenario/README.html', root), 'utf8');

assert.match(first, /success/);
assert.match(first, /DB에 저장하지/);
assert.match(stored, /201/);
assert.match(stored, /id/);
/* 기능 목록 진입은 새 서비스 계약을 따르고, 기존 일자 주소와 원문 사실 검사는 유지한다. */
assert.match(home, /href="scenario\/README\.html"/);
assert.match(home, /href="course\/spring\/D01\.html"/);
assert.match(index, /data-sf-id="posts-create-read"/);
assert.match(index, /scenario\/features\/posts-create-read\.html/);
assert.match(index, /id="legacy-scenarios"/);
assert.doesNotMatch(index, /class="journey-learning-nav|class="journey-architecture-panel/);
console.log('기능 중심 시작과 기존 success/저장 원문·참고 진입 보존 통과');
