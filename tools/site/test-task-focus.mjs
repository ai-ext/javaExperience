import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderTaskFocus } from './task-focus.mjs';

// SQL·테스트 과제를 HTTP 구현으로 오인하게 만들지 않는지 검사한다.
for (const [id, file] of [
  ['1-7', '../../scenario/ch1-create-post/1-7-direct-db-dml.md'],
  ['7-2', '../../scenario/ch7-tests/7-2-service-unit.md'],
]) {
  const source = fs.readFileSync(new URL(file, import.meta.url), 'utf8');
  const html = renderTaskFocus({ id, title: source.split('\n')[0] }, source);
  assert.ok(!html.includes('Spring Boot 서버를 실행하고 요청을 보냅니다.'), `${id}: 실행 안내는 과제에 맞아야 한다`);
  assert.ok(!html.includes('task-focus-route'), `${id}: 보조 API를 주 과제로 표시하면 안 된다`);
  assert.ok(!html.includes('task-focus-steps'), `${id}: 첫 화면에 같은 과제를 세 칸으로 반복하지 않는다`);
}
const source = fs.readFileSync(new URL('../../scenario/ch1-create-post/1-1-receive-request.md', import.meta.url), 'utf8');
const first = renderTaskFocus({ id: '1-1', title: '요청 받기' }, source);
assert.match(first, /200 OK/);
assert.match(first, /success/);
assert.doesNotMatch(first, /201 Created/);
assert.match(first, /예상 흐름/);
assert.equal((first.match(/class="journey-primary"/g) || []).length, 1);
assert.match(first, /class="first-api-journey"/);
assert.match(first, /data-journey-screen="build"/);
assert.match(first, /data-journey-screen="run" hidden/);
assert.match(first, /data-journey-request-slot/);
for (const field of ['boardSlug', 'title', 'content', 'tags', 'visibility']) {
  assert.match(first, new RegExp(`data-field="${field}"`), `${field}: 요청 본문과 DTO 대응을 보여야 한다`);
}
assert.match(first, /게시글 작성 요청: \[채점\] 첫 게시글/);
assert.doesNotMatch(first, /return &quot;success&quot;/);
assert.match(first, /DB 저장 없음/);
assert.match(first, /실제 실행 결과 아님/);
assert.doesNotMatch(first, /INSERT INTO/);
assert.doesNotMatch(first, /data-first-api-step/);
const folderSource = fs.readFileSync(new URL('../../scenario/ch6-bookmark/6-2-folders.md', import.meta.url), 'utf8');
const folderFocus = renderTaskFocus({ id: '6-2', title: '폴더 만들기' }, folderSource);
const folderFirstView = folderFocus.split('<details class="task-focus-next">')[0];
assert.match(folderFirstView, /BookmarkFolderService\.java/);
assert.match(folderFirstView, /POST \/api\/me\/bookmark-folders/);
assert.doesNotMatch(folderFirstView, /201|409|한도 10개|F3|F4/);
assert.match(folderFocus, /<details class="task-focus-next">/);
assert.match(folderFocus, /201/);
assert.match(folderFocus, /F3/);
console.log('첫 과제 안내 검사 통과 · SQL/테스트 경계, 첫 API 계약, 예상 흐름, 주 행동 1개');
