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
assert.match(home, /href="scenario\/README\.html"/);
assert.match(home, /href="course\/spring\/D01\.html"/);
assert.match(index, /href="ch0-first-steps\/0-1-ts-to-java\.html"[^>]*>0-1 첫 API 만들기/);
assert.match(index, /data-flow-step="0" href="ch1-create-post\/1-2-dto-response\.html"/);
assert.match(index, /1-1은 <code>success<\/code>만 응답하고 DB에 저장하지 않습니다/);
console.log('홈에서 45일 과정과 서비스 만들기 진입, 서비스의 첫 진입 0-1, 성공만 반환하는 1-1, 저장·id 반환 1-2 연결 통과');
