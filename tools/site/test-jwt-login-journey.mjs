import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderJwtLoginJourney } from './jwt-login-journey.mjs';

const html = renderJwtLoginJourney();
assert.deepEqual([...html.matchAll(/data-jwt-panel="([^"]+)"/g)].map((match) => match[1]),
  ['scenario', 'dependencies', 'config', 'issuance', 'login', 'anatomy', 'me', 'credentials', 'normalize', 'validation', 'anonymous', 'jwt-errors', 'password-boundary', 'bad-json', 'preflight']);
const first = html.slice(html.indexOf('data-jwt-panel="scenario"'), html.indexOf('data-jwt-panel="dependencies"'));
assert.match(first, /만들 것/);
assert.match(first, /먼저 보낼 것/);
assert.doesNotMatch(first, /200 OK|401|3600|HS256|users 조회/);
const ids = ['L', 'W', 'U', 'K', 'V', 'P', ...Array.from({ length: 6 }, (_, index) => `V${index + 1}`), 'M', ...Array.from({ length: 5 }, (_, index) => `M${index}`)];
for (const id of ids) assert.match(html, new RegExp(`data-jwt-request="${id}"`));
assert.equal((html.match(/data-jwt-request="/g) || []).length, ids.length);
for (const dependency of ['jjwt-api:0.13.0', 'jjwt-impl:0.13.0', 'jjwt-jackson:0.13.0']) assert.ok(html.includes(dependency));
assert.match(html, /validity-seconds: 3600/);
assert.match(html, /JWT 문자열은 <code>api_token<\/code> 표에 저장하지 않습니다/);
assert.match(html, /api_token<\/code> 조회 없음/);
assert.match(html, /UserService\.me/);
assert.match(html, /users\.id=1 조회/);
assert.match(html, /CorsUtils\.isPreFlightRequest/);
assert.match(html, /V5 · 깨진 JSON/);
assert.match(html, /400 BAD_JSON/);
assert.match(html, /401 UNAUTHORIZED/);
assert.match(html, /실제 OPTIONS를 보냈다고 표시하지 않습니다/);

const root = new URL('../../', import.meta.url);
const built = fs.readFileSync(new URL('scenario/ch10-project/10-4-login-jwt.html', root), 'utf8');
for (const asset of ['first-db-journey.css', 'jwt-login-journey.css', 'jwt-login-journey.js']) assert.ok(built.includes(asset), `asset missing: ${asset}`);
for (const id of ids) assert.match(built, new RegExp(`data-request-id="${id}"`));
assert.equal((built.match(/class="api-request"/g) || []).length, ids.length);
console.log('10-4 JWT 15장면·원문 요청 18개·발급/검증/회원 조회·실패 경계 검사 통과');
