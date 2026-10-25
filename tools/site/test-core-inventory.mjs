import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const collectorPath = path.join(root, 'tools/site/inventory-visual-work.mjs');
const collector = fs.readFileSync(collectorPath, 'utf8');
const inventoryPath = path.join(root, 'docs/design/visual-inventory.jsonl');
assert.ok(fs.existsSync(inventoryPath), '시각화 장부가 먼저 생성되어 있어야 함');

assert.match(collector, /import \{ loadCoreLearning \} from '\.\/core-learning-data\.mjs';/);
assert.match(collector, /if \(file === 'lessons\/concept-core\.md'\)/);
assert.match(collector, /'core_learning_state'/);
assert.match(collector, /status: old\?\.status \?\? 'unreviewed'/);
assert.match(collector, /evidence: old\?\.evidence \?\? ''/);
for (const component of ['core-learning', 'core-learning-layout', 'core-stage-nav', 'core-stage-columns', 'core-observation']) {
  assert.ok(collector.includes(`'${component}'`), `시각 교구 목록에 ${component}가 있어야 함`);
}

const rows = fs.readFileSync(inventoryPath, 'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
const pageRows = rows.filter(row => row.page === 'lessons/concept-core.md');
assert.ok(pageRows.length > 0, '생성 inventory에 핵심 단원 페이지가 있어야 함');
const typed = pageRows.filter(row => row.kind === 'core_learning_state');
assert.equal(typed.length, 18, '6개 단원마다 단계 상태 3개를 수집해야 함');
assert.equal(new Set(typed.map(row => row.id)).size, 18, 'typed state ID가 모두 고유해야 함');

const expectedUnits = ['C01', 'C02', 'C03', 'C04', 'C05', 'C06'];
const expectedStages = ['step1', 'step2', 'step3'];
for (const unitId of expectedUnits) {
  const unitRows = typed.filter(row => row.topicId === unitId);
  assert.equal(unitRows.length, 3, `${unitId}는 세 단계 상태를 가져야 함`);
  assert.deepEqual(unitRows.map(row => row.stageId).sort(), expectedStages, `${unitId}의 단계 연결`);
  for (const row of unitRows) {
    const stageIndex = Number(row.stageId.slice(-1)) - 1;
    assert.ok(['unreviewed', 'implemented'].includes(row.status), `${row.id}: 검토 단계가 자동 승격되면 안 됨`);
    if (row.status === 'implemented') {
      assert.ok(row.evidence?.trim(), `${row.id}: implemented에는 evidence가 필요함`);
      const evidencePath = path.resolve(root, row.evidence);
      assert.ok(fs.existsSync(evidencePath) && fs.statSync(evidencePath).isFile(), `${row.id}: evidence 파일이 있어야 함`);
    }
    assert.ok(row.sourcePath === 'tools/site/core-learning-data.mjs', `${row.id}: 실제 lesson 데이터 출처`);
    assert.ok(row.sourceFact?.trim(), `${row.id}: 설명 사실이 있어야 함`);
    assert.ok(row.codeFact?.trim(), `${row.id}: 코드 사실이 있어야 함`);
    assert.ok(Array.isArray(row.observationFacts) && row.observationFacts.length > 0, `${row.id}: 관찰 facts`);
    assert.match(row.currentSelector, new RegExp(`\\[data-core-learning\\].*data-core-unit="${unitId}"`));
    assert.match(row.currentSelector, new RegExp(`data-core-stage-nav.*data-core-step="${stageIndex}"`));
    assert.equal(Object.hasOwn(row, 'imageId'), false, `${row.id}: raster image ID를 붙이지 않아야 함`);
  }
}

for (const component of ['core-learning', 'core-learning-layout', 'core-stage-nav', 'core-stage-columns', 'core-observation']) {
  assert.ok(pageRows.some(row => row.kind === `visual:${component}`), `생성 교구 ${component}를 수집해야 함`);
}
assert.ok(pageRows.some(row => row.kind.startsWith('toggle:')), '내부 접기 항목을 collectHtml이 수집해야 함');
console.log('core inventory: 18 typed states, selectors, fact sources, review status and generated components passed');
