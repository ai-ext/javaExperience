import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderTxWhyFocused } from './tx-why-focused.mjs';
import { renderTxLifecycleFocused } from './tx-lifecycle-focused.mjs';

const w11 = fs.readFileSync(new URL('../../docs/knowledge/W11-why-tx-in-service.md', import.meta.url), 'utf8');
const s08 = fs.readFileSync(new URL('../../docs/knowledge/S08-transactions.md', import.meta.url), 'utf8');
const boundary = renderTxWhyFocused();
const lifecycle = renderTxLifecycleFocused();

assert.match(w11, /Repository A와 B가 각각 트랜잭션을 끝내면/);
assert.match(boundary, /tag<\/b> 남음/);
assert.match(boundary, /tag<\/b> 없음/);
assert.match(boundary, /다른 DB나 외부 메시지는 이 경계에 자동 포함되지 않습니다/);
assert.deepEqual([...lifecycle.matchAll(/data-tx-life-panel="([^"]+)"/g)].map((item) => item[1]), ['start', 'commit', 'rollback']);
assert.match(s08, /RuntimeException.*Error.*롤백/);
assert.match(lifecycle, /RuntimeException·Error는 rollback/);
assert.match(lifecycle, /checked 예외는 기본 롤백 대상이 아닙니다/);
assert.match(lifecycle, /기본 REQUIRED: 참여 또는 새로 시작/);
assert.match(lifecycle, /flush<\/code>는 commit과 다릅니다/);
assert.doesNotMatch(lifecycle, /모든 예외는 rollback|애노테이션이 트랜잭션을 시작/);
console.log('Service 경계·Spring 시작/commit/rollback 개념 계약 검사 통과');
