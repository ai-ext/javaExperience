import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyConcept, CORE_UNITS, DOMAINS, validateCurriculum } from './concept-curriculum.mjs';
import { loadKnowledgeCatalog } from './knowledge-catalog-data.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const docs = loadKnowledgeCatalog(root);
const tasks = JSON.parse(fs.readFileSync(path.join(root, 'docs/design/concept-cycle-2026-10-22/tasks.json'), 'utf8')).tasks;
const classification = JSON.parse(fs.readFileSync(path.join(root, 'docs/design/concept-curriculum-2026-10-25/classification.json'), 'utf8'));
const byId = new Map(classification.documents.map(item => [item.id, item]));
const idSet = value => new Set(value.split(/\s+/).filter(Boolean));
const expectedDomain = new Map();
const assignDomain = (ids, domain) => ids.forEach(id => expectedDomain.set(id, domain));
assignDomain('J01 J02 J03 J04 J05 J06 J07 J08 J09 J10 J11 J12 J13 J14 J15 J16 J17 J20 J21 J22 J23 J24 J25'.split(' '), 'java');
assignDomain('P04 P09 P10 P29 P31 W19 W21 W26'.split(' '), 'java');
assignDomain('J19 V01 V02 V03 V04 V05 V06'.split(' '), 'testing');
assignDomain([...new Set(classification.documents.map(item => item.id).filter(id => id.startsWith('R')))], 'data');
assignDomain('P01 P02 P03 P07 P11 P12 P27 P28 P30 S01 S02 S03 S04 S07 S15 S21 S22 W02 W12 W14 W25'.split(' '), 'spring');
assignDomain('P06 P16 P17 P25 P26 S05 S06 S12 S13 S23 W01 W08 W09 W10 W13 W18 D02 D03 D11 B01'.split(' '), 'request');
assignDomain('P18 P19 P20 P21 P22 P23 S08 S09 S10 S11 W03 W04 W05 W11 W15 W16 W17 W20 W23 W24 D10'.split(' '), 'data');
const expectedRequired = idSet('J01 J02 J04 J19 P01 P02 P03 P04 P05 P06 P07 P08 P09 P10 P11 P12 P13 P14 P15 P16 P19 P20 P27 P28 P29 R01 R03 R04 R06 R08 S01 S04 S05 S08 S09 S18 V01 V02 V03 V04 W01 W02 W07 W08 W09 W10 W11 W12 W19 W21 W24 W25 W26 D02 D04 D05 D10');
const expectedFoundation = idSet('J01 J02 J04 J05 J06 J08 J19 J24 J25 P01 P02 P03 P04 P05 P06 P07 P08 P09 P10 P11 P12 P13 P14 P15 P16 P19 P20 P27 P28 P29 R01 R02 R03 R04 R06 R08 S01 S04 S05 V01 V02 V03 W01 W02 W06 W07 W08 W09 W10 W11 W12 W13 W19 W21 W22 W24 W25 W26 D01 D02 D03 D04 D05 D10 D11 D12 D13');
const expectedAdvanced = idSet('J07 J10 J11 J12 J13 J14 J15 J16 S02 S03 S07 S15 S17 S20 S21 S22 P18 P21 P22 P24 P30 R05 R07 D15 V05 V06');

assert.deepEqual(DOMAINS, [
  { id: 'java', label: 'Java' }, { id: 'spring', label: 'Spring · Boot' },
  { id: 'request', label: 'HTTP · API' }, { id: 'data', label: 'DB · JPA' },
  { id: 'testing', label: '테스트' }, { id: 'delivery', label: '개발 · 운영' },
]);
assert.equal(docs.length, 134, 'README에서 제목·ID·sourcePath 134개 로드');
assert.equal(new Set(docs.map(item => item.id)).size, 134);
assert.equal(tasks.length, 134);
assert.equal(classification.documents.length, 134);
for (const item of classification.documents) {
  const domain = expectedDomain.get(item.id) ?? (item.id.startsWith('J') ? 'java' : item.id.startsWith('R') ? 'data' : item.id.startsWith('V') ? 'testing' : 'delivery');
  assert.equal(item.domain, domain, `${item.id} 탐색 도메인`);
  assert.equal(item.priority, expectedRequired.has(item.id) ? 'required' : 'optional', `${item.id} 입문 기준 필수성`);
  const depths = ['S01', 'P27', 'J06'].includes(item.id) ? ['foundation', 'applied', 'advanced']
    : ['P03', 'P04', 'P11', 'P12', 'W19'].includes(item.id) ? ['foundation', 'applied']
      : item.id === 'J20' ? ['applied', 'advanced']
        : expectedFoundation.has(item.id) ? ['foundation']
          : expectedAdvanced.has(item.id) ? ['advanced'] : ['applied'];
  assert.deepEqual(item.depths, depths, `${item.id} 포함 깊이`);
}
for (const task of tasks) {
  const item = byId.get(task.documentId);
  assert.ok(item, `분류 누락: ${task.documentId}`);
  assert.equal(item.sourcePath, task.source);
  assert.equal(item.sourceSHA256, task.sourceSHA256, `${task.documentId} 원문 SHA`);
  assert.equal(item.classificationBasis, '기본 API 입문 경로와 문서 제목·소제목을 기준으로 한 탐색 분류; 내용·실행 검증과 별개');
  assert.equal(item.contentReview, 'not_reassessed');
  assert.equal(item.execution, 'see_example_evidence');
  assert.deepEqual(classifyConcept(task.documentId), item);
}
assert.equal(classifyConcept('S01').domain, 'spring');
assert.equal(classifyConcept('S01').priority, 'required');
assert.deepEqual(classifyConcept('S01').depths, ['foundation', 'applied', 'advanced']);
assert.equal(classifyConcept('J20').priority, 'optional');
assert.deepEqual(classifyConcept('J20').depths, ['applied', 'advanced']);
assert.throws(() => classifyConcept('NOPE'), /없는|찾을 수/);

const valid = await validateCurriculum(docs, { root });
assert.equal(valid.length, 134);
assert.equal(CORE_UNITS.length, 6);
assert.deepEqual(CORE_UNITS.map(({ id, title, primarySourceId, sources, prerequisites }) => ({ id, title, primarySourceId, sources, prerequisites })), [
  { id: 'C01', title: '객체·생성자', primarySourceId: 'P09', sources: ['P09', 'P04'], prerequisites: [] },
  { id: 'C02', title: 'Spring과 Boot·앱 시작', primarySourceId: 'P01', sources: ['P01'], prerequisites: ['C01'] },
  { id: 'C03', title: '애노테이션은 누가 언제 읽나', primarySourceId: 'P03', sources: ['P03', 'P27', 'J06'], prerequisites: ['C01', 'C02'] },
  { id: 'C04', title: 'IoC·DI·생성자 주입', primarySourceId: 'P12', sources: ['P12', 'P11'], prerequisites: ['C01', 'C02', 'C03'] },
  { id: 'C05', title: 'Lombok 생성 코드', primarySourceId: 'W19', sources: ['W19', 'P11'], prerequisites: ['C01', 'C03'] },
  { id: 'C06', title: 'Bean 생명주기', primarySourceId: 'S01', sources: ['S01'], prerequisites: ['C04'] },
]);
assert.equal(CORE_UNITS.find(unit => unit.id === 'C04').prerequisites.includes('C05'), false);
assert.equal(CORE_UNITS.find(unit => unit.id === 'C04').prerequisites.includes('C03'), true);
assert.ok(CORE_UNITS.every(unit => unit.priority === 'required' && unit.depth === 'foundation'));
assert.ok(CORE_UNITS.every(unit => unit.href === `../../lessons/concept-core.html?unit=${unit.id}`));

const duplicate = [...docs, docs[0]];
await assert.rejects(validateCurriculum(duplicate, { root }), /중복|134/);
await assert.rejects(validateCurriculum(docs.filter(item => item.id !== 'P01'), { root }), /134|README/);
const wrongHash = docs.map(item => item.id === 'P09' ? { ...item, sourceSHA256: '0'.repeat(64) } : item);
await assert.rejects(validateCurriculum(wrongHash, { root }), /SHA|해시|P09/);
const p09Classification = classifyConcept('P09');
const originalP09SourcePath = p09Classification.sourcePath;
try {
  p09Classification.sourcePath = 'docs/knowledge/NOPE.md';
  await assert.rejects(validateCurriculum(docs, { root }), /sourcePath|경로|P09/);
} finally {
  p09Classification.sourcePath = originalP09SourcePath;
}
const originalP09Sha = p09Classification.sourceSHA256;
try {
  p09Classification.sourceSHA256 = '0'.repeat(64);
  await assert.rejects(validateCurriculum(docs, { root }), /SHA|해시|P09/);
} finally {
  p09Classification.sourceSHA256 = originalP09Sha;
}
const originalP09Review = p09Classification.contentReview;
try {
  p09Classification.contentReview = 'verified';
  await assert.rejects(validateCurriculum(docs, { root }), /검토|증거|승격|P09/);
} finally {
  p09Classification.contentReview = originalP09Review;
}
const originalP09Execution = p09Classification.execution;
try {
  p09Classification.execution = 'passed';
  await assert.rejects(validateCurriculum(docs, { root }), /검토|증거|승격|P09/);
} finally {
  p09Classification.execution = originalP09Execution;
}
await assert.rejects(validateCurriculum(docs, { root, units: [{ ...CORE_UNITS[0], id: 'X01', prerequisites: ['MISSING'] }] }), /선수|없는.*MISSING/);
await assert.rejects(validateCurriculum(docs, { root, units: [
  { ...CORE_UNITS[0], id: 'X01', prerequisites: ['X02'] },
  { ...CORE_UNITS[0], id: 'X02', prerequisites: ['X01'] },
] }), /순환|cycle/i);
await assert.rejects(validateCurriculum(docs, { root, units: [{ ...CORE_UNITS[0], sources: ['NOPE'] }] }), /source|문서|NOPE/i);
await assert.rejects(validateCurriculum(docs, { root, units: [{ ...CORE_UNITS[0], priority: 'maybe' }] }), /필수성|priority/i);
await assert.rejects(validateCurriculum(docs, { root, units: [{ ...CORE_UNITS[0], depth: 'expert' }] }), /깊이|depth/i);

const badDomain = docs.map(item => item.id === 'P09' ? { ...item, domain: 'unknown' } : item);
await assert.rejects(validateCurriculum(badDomain, { root }), /도메인|domain/i);
const badPriority = docs.map(item => item.id === 'P09' ? { ...item, priority: 'maybe' } : item);
await assert.rejects(validateCurriculum(badPriority, { root }), /필수성|priority/i);
const badDepth = docs.map(item => item.id === 'P09' ? { ...item, depths: ['expert'] } : item);
await assert.rejects(validateCurriculum(badDepth, { root }), /깊이|depth/i);
assert.equal(classifyConcept('P09').contentReview, 'not_reassessed', '분류 완료는 원문 내용 검토 완료가 아님');
assert.equal(classifyConcept('P09').execution, 'see_example_evidence', '분류 완료는 실행 성공이 아님');
console.log('concept curriculum: 134 documents, fixed taxonomy, six core units, source integrity, validation errors and evidence states passed');
