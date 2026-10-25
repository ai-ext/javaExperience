import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = new URL('../../../../', import.meta.url);
const baselinePath = '/tmp/d11-visual-inventory-baseline-2026-10-25.jsonl';
const inventoryPath = 'docs/design/visual-inventory.jsonl';
const summaryPath = 'docs/design/visual-inventory-summary.json';
const sourcePath = 'docs/knowledge/D11-web-security-basics.md';
const baselineBytes = readFileSync(baselinePath);
const inventoryBytes = readFileSync(new URL(inventoryPath, root));
const baseline = baselineBytes.toString('utf8').trimEnd().split('\n');
const current = inventoryBytes.toString('utf8').trimEnd().split('\n');
const baselineRows = baseline.map(JSON.parse), currentRows = current.map(JSON.parse);
const baselineById = new Map(baselineRows.map((row, i) => [row.id, { row, line: baseline[i] }]));
const currentById = new Map(currentRows.map((row, i) => [row.id, { row, line: current[i] }]));
const changedProtectedFields = [...baselineById].filter(([id, old]) => {
  const current = currentById.get(id)?.row;
  return !current || ['status', 'evidence', 'updatedDate'].some(field => current[field] !== old.row[field]);
}).map(([id]) => id);
assert.deepEqual(changedProtectedFields, [], 'prior row status/evidence/date fields remain byte-identical');
const changedNonLifecycleFields = [...baselineById].filter(([id, old]) => currentById.get(id)?.line !== old.line).map(([id]) => id);

const expectedStages = [
  ['object-ownership','own-order','object-own-order-v2'], ['object-ownership','other-unscoped','object-ownership'],
  ['object-ownership','other-scoped','object-ownership'], ['object-ownership','uuid-scoped','object-uuid-order'],
  ['request-boundaries','boundary-identity','request-boundaries'], ['request-boundaries','boundary-owner','request-boundaries'],
  ['request-boundaries','boundary-output','request-boundaries'], ['principal-mapping','numeric-name','principal-mapping'],
  ['principal-mapping','textual-name','principal-mapping'], ['cors-requests','simple-blocked-read','cors-requests-v3'],
  ['cors-requests','preflight-denied','cors-requests-v3'], ['cors-requests','preflight-allowed','cors-requests-v3'],
  ['cors-requests','credential-wildcard','cors-requests-v3'], ['csrf-credentials','cookie-automatic','csrf-credentials-v2'],
  ['csrf-credentials','bearer-explicit','csrf-credentials-v2'], ['csrf-credentials','cookie-token','csrf-credentials-v2'],
  ['sql-boundary','value-concat','sql-boundary-v2'], ['sql-boundary','value-bound','sql-boundary-v2'],
  ['sql-boundary','sort-allowed','sql-boundary-v2'], ['sql-boundary','sort-rejected','sql-boundary-v2'],
  ['output-context','output-text','output-context'], ['output-context','output-markup','output-context'],
  ['output-context','context-policy','output-context'], ['security-config','chain-rules','security-config'],
  ['security-config','endpoint-missing','security-config'], ['security-config','version-pinned','security-config'],
  ['hsts-boundary','hsts-unseen','hsts-boundary'], ['hsts-boundary','hsts-remembered','hsts-boundary'],
  ['hsts-boundary','hsts-subdomains','hsts-boundary'], ['password-verification','password-store','password-verification'],
  ['password-verification','password-check','password-verification'], ['password-verification','password-rehash','password-verification'],
  ['secret-log-lifecycle','secret-injected','secret-log-lifecycle-v2'], ['secret-log-lifecycle','secret-exposed','secret-log-lifecycle-v2'],
  ['secret-log-lifecycle','secret-revoked','secret-log-lifecycle-v2'], ['dependency-response','sbom-inventory','dependency-response-v2'],
  ['dependency-response','sca-assessment','dependency-response-v2'], ['dependency-response','rebuild-verify','dependency-response-v2'],
].map(([topicId, stageId, imageId]) => ({ topicId, stageId, imageId }));
const expectedStageIds = expectedStages.map(row => row.stageId).sort();
const expectedTopicCounts = Object.fromEntries([...new Set(expectedStages.map(row => row.topicId))].sort().map(topicId => [topicId, expectedStages.filter(row => row.topicId === topicId).length]));
const typed = currentRows.filter(row => row.page === sourcePath && row.kind === 'd11_learning_state');
assert.equal(typed.length, 38);
assert.deepEqual(typed.map(row => row.stageId).sort(), expectedStageIds);
const actualTopicCounts = Object.fromEntries([...new Set(typed.map(row => row.topicId))].sort().map(topicId => [topicId, typed.filter(row => row.topicId === topicId).length]));
assert.deepEqual(actualTopicCounts, expectedTopicCounts);
for (const row of typed) {
  const expected = expectedStages.find(stage => stage.stageId === row.stageId);
  assert.equal(row.topicId, expected.topicId, `${row.stageId} topic`);
  assert.equal(row.imageId, expected.imageId, `${row.stageId} image`);
  assert.equal(row.status, 'implemented');
  assert.equal(row.evidence, 'docs/design/d11-2026-10-25/MAIN-REPORT.md · D11 implementation and main PC 38-state acceptance');
  assert.match(row.updatedDate, /^\d{4}-\d{2}-\d{2}$/);
}
const newRows = currentRows.filter(row => !baselineById.has(row.id));
assert.equal(newRows.length, 42);
assert.ok(newRows.every(row => row.page === sourcePath));
assert.deepEqual(Object.fromEntries([...new Set(newRows.map(row => row.kind))].sort().map(kind => [kind, newRows.filter(row => row.kind === kind).length])), {
  'd11_learning_state': 38,
  'toggle:d11-legacy': 1,
  'toggle:d11-original': 1,
  'toggle:d11-scope': 1,
  'toggle:d11-source-details': 1,
});
assert.ok(newRows.filter(row => row.kind !== 'd11_learning_state').every(row => row.status === 'unreviewed'));
const sourceBytes = readFileSync(new URL(sourcePath, root));
assert.equal(createHash('sha256').update(sourceBytes).digest('hex'), 'a9ba3c0109c24d61fcfbaf0e013ab2b90cee5dceac5a8432326f4bc7f63e2fba');
const summary = JSON.parse(readFileSync(new URL(summaryPath, root), 'utf8'));
assert.equal(summary.pages.find(page => page.source === sourcePath).units, currentRows.filter(row => row.page === sourcePath).length);

const report = {
  baselineRows: baselineRows.length,
  currentRows: currentRows.length,
  existingRowsWithLifecycleFieldChanges: changedProtectedFields.length,
  existingRowsWithOtherRegeneratedMetadataChanges: changedNonLifecycleFields.length,
  changedOtherRowIds: changedNonLifecycleFields,
  newRows: newRows.length,
  typedD11Stages: typed.length,
  typedStageIds: expectedStageIds,
  typedTopicCounts: actualTopicCounts,
  unreviewedNonTypedD11Rows: newRows.filter(row => row.kind !== 'd11_learning_state' && row.status === 'unreviewed').length,
  otherNewD11Statuses: Object.fromEntries([...new Set(newRows.filter(row => row.kind !== 'd11_learning_state').map(row => row.status))].map(status => [status, newRows.filter(row => row.kind !== 'd11_learning_state' && row.status === status).length])),
  sourceSHA256: createHash('sha256').update(sourceBytes).digest('hex'),
  summaryD11Units: summary.pages.find(page => page.source === sourcePath).units,
  baselineSHA256: createHash('sha256').update(baselineBytes).digest('hex'),
};
writeFileSync(new URL('inventory-baseline-verification.json', import.meta.url), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
