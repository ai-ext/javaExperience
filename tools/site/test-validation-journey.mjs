import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderValidationJourney } from './validation-journey.mjs';

const html = renderValidationJourney();
const panels = [...html.matchAll(/data-validation-panel="([^"]+)"/g)].map((match) => match[1]);
assert.deepEqual(panels, ['scenario', 'dto', 'tags', 'problem', 'invalid', 'no-write', 'default', 'board', 'boundary', 'null-tag', 'case-tag']);
const first = html.slice(html.indexOf('data-validation-panel="scenario"'), html.indexOf('data-validation-panel="dto"'));
assert.match(first, /만들 것/);
assert.match(first, /보낼 것/);
assert.doesNotMatch(first, /400|201|COUNT\(\*\)|errors/);
for (let n = 1; n <= 12; n++) assert.match(html, new RegExp(`data-validation-request="V${n}"`));
assert.match(html, /PostCreateRequest\.java/);
assert.match(html, /record PostCreateRequest/);
assert.match(html, /ApiExceptionHandler\.java/);
assert.match(html, /@RestControllerAdvice/);
assert.match(html, /tags\[0\]/);
assert.match(html, /ProblemDetail/);
assert.match(html, /SELECT COUNT\(\*\) FROM post WHERE title LIKE/);
assert.match(html, /SELECT COUNT\(\*\) FROM tag WHERE name IN/);
assert.match(html, /SELECT COUNT\(\*\) FROM post_tag WHERE post_id/);
assert.match(html, /1-6-token-auth\.html/);

const built = fs.readFileSync(new URL('../../scenario/ch1-create-post/1-5-validation.html', import.meta.url), 'utf8');
assert.match(built, /validation-journey\.css\?v=/);
assert.match(built, /validation-journey\.js\?v=/);
assert.match(built, /class="validation-page"/);
for (let n = 1; n <= 12; n++) {
  assert.match(built, new RegExp(`data-request-id="V${n}"`));
}
assert.equal((built.match(/class="api-request"/g) || []).length, 12);
console.log('1-5 장면·요청 12개·SQL 증거·빌드 연결 검사 통과');
