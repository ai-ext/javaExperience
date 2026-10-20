import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderTokenAuthorJourney } from './token-author-journey.mjs';

const rendered = renderTokenAuthorJourney();
assert.deepEqual([...rendered.matchAll(/data-token-panel="([^"]+)"/g)].map((match) => match[1]),
  ['scenario', 'interceptor', 'normal', 'spoof', 'unauthorized', 'priority', 'suspended', 'notice', 'database', 'preflight']);
const first = rendered.slice(rendered.indexOf('data-token-panel="scenario"'), rendered.indexOf('data-token-panel="interceptor"'));
assert.match(first, /만들 것/);
assert.match(first, /보낼 것/);
assert.doesNotMatch(first, /201|401|403|api_token|COUNT\(\*\)/);
for (let number = 1; number <= 11; number++) {
  assert.match(rendered, new RegExp(`data-token-request="T${number}"`));
}
assert.match(rendered, /tok-lee/);
assert.match(rendered, /member_id 3/);
assert.match(rendered, /2099-12-31/);
assert.match(rendered, /authorId: 1 → 무시/);
assert.match(rendered, /WWW-Authenticate: Bearer/);
assert.match(rendered, /SUSPENDED/);
assert.match(rendered, /CorsUtils\.isPreFlightRequest/);
assert.match(rendered, /SELECT author_id FROM post WHERE id = \{id\}/);
assert.match(rendered, /SELECT COUNT\(\*\) FROM post WHERE title =/);
assert.match(rendered, /1-7-direct-db-dml\.html/);
assert.doesNotMatch(rendered, /JWT 서명|JWT 발급|세션 로그인/);

const root = new URL('../../', import.meta.url);
const built = fs.readFileSync(new URL('scenario/ch1-create-post/1-6-token-auth.html', root), 'utf8');
for (const asset of ['token-author-journey.css', 'token-author-journey.js', 'first-db-journey.css']) {
  assert.ok(built.includes(asset), `asset missing: ${asset}`);
}
for (let number = 1; number <= 11; number++) {
  assert.match(built, new RegExp(`data-request-id="T${number}"`));
}
assert.equal((built.match(/class="api-request"/g) || []).length, 11);
const ddl = fs.readFileSync(new URL('docker/mysql/init/01-community.sql', root), 'utf8');
assert.match(ddl, /\(3,'tok-lee',3,'2099-12-31 23:59:59',NULL/);
console.log('1-6 10장면·원문 요청 11개·초기 토큰/SQL·빌드 연결 검사 통과');
