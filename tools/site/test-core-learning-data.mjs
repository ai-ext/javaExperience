import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadCoreLearning } from './core-learning-data.mjs';

const root = new URL('../../', import.meta.url).pathname;
const data = loadCoreLearning(root);
const proof = JSON.parse(fs.readFileSync(`${root}docs/design/concept-curriculum-2026-10-25/proof/execution.json`));
const research = JSON.parse(fs.readFileSync(`${root}docs/design/concept-curriculum-2026-10-25/research/sources.json`));
assert.equal(data.units.length, 6);
assert.deepEqual(data.units.map(unit => unit.id), ['C01', 'C02', 'C03', 'C04', 'C05', 'C06']);
assert.equal(data.runtime.java, '21.0.6');
assert.equal(data.runtime.boot, '4.1.1');
assert.ok(data.units.every(unit => unit.stages.length >= 3 && unit.sourceLinks.length > 0 && unit.limit));
assert.ok(data.units.every(unit => unit.officialSources.length > 0 && unit.observations.length > 0));
assert.ok(data.units.find(unit => unit.id === 'C03').limit.includes('AOP'));
assert.ok(data.units.find(unit => unit.id === 'C06').limit.includes('setter'));
assert.ok(data.units.find(unit => unit.id === 'C05').limit.includes('Builder'));
assert.equal(data.units.find(unit => unit.id === 'C04').prerequisites.includes('C05'), false);
const c03 = data.units.find(unit => unit.id === 'C03');
const c03Map = c03.stages[2];
assert.equal(c03Map.title, '처리 주체와 시점을 연결합니다');
assert.match(c03Map.explanation, /이번 C03 실행은 보존 정책과 명시 호출에 한정합니다/);
assert.match(c03Map.explanation, /AOP 프록시 예제는 실행하지 않았습니다/);
assert.equal(c03Map.comparisonTitle, '애노테이션 처리 주체와 시점');
assert.deepEqual(c03Map.columns, ['처리 시점', '표식·대상', '처리 주체와 역할']);
assert.deepEqual(c03Map.rows, [
  ['컴파일', '@Getter · @RequiredArgsConstructor', 'Lombok processor가 getter·생성자 생성(C05)'],
  ['앱 기동', '@Bean', 'Spring이 설정을 읽어 Repository·Service 등록·조립(C02·C04)'],
  ['HTTP 요청', '@RequestParam', 'MVC가 name=Min을 메서드 인자로 준비(C02)'],
  ['메서드 호출', '@TraceCall + Aspect 설정', '설정된 프록시 경유 시 전후 부가기능 적용(P27 설명, 미실행)'],
]);
assert.match(c03Map.code, /method\.invoke\(instance\)/);
assert.ok(c03.observations.some(({ value }) => value.includes('calls-before=0;after=1')));
assert.equal(c03.limit, JSON.parse(fs.readFileSync(`${root}docs/design/concept-curriculum-2026-10-25/proof/execution.json`)).limits.C03);
assert.ok(c03.sourceLinks.some(source => source.id === 'P27'));
const claimSources = ['c03', 'c11', 'c14', 'c15'].flatMap(id => research.claims.find(claim => claim.id === id).sourceIds);
const unitClaimSources = research.claims.filter(claim => claim.unitId === 'C03').flatMap(claim => claim.sourceIds);
assert.deepEqual(new Set(c03.officialSources.map(source => source.id)), new Set([...unitClaimSources, ...claimSources]));
assert.ok(c03.officialSources.every(source => research.sources.some(item => item.id === source.id && item.status === 'read')));
assert.throws(() => loadCoreLearning(root, { proof: { ...proof, status: 'failed' } }), /실행|증거/);
const changedSource = structuredClone(proof);
changedSource.inputs[0].sha256 = '0'.repeat(64);
assert.throws(() => loadCoreLearning(root, { proof: changedSource }), /SHA|바이트|원문/);
assert.throws(() => loadCoreLearning(root, { proof: { ...proof, inputs: [] } }), /입력|증거/);
const wrongModel = structuredClone(research);
wrongModel.provenance.model = 'another-model';
assert.throws(() => loadCoreLearning(root, { research: wrongModel }), /조사|모델/);
const missingSource = structuredClone(research);
missingSource.sources = [];
assert.throws(() => loadCoreLearning(root, { research: missingSource }), /출처/);
const foreignSource = structuredClone(research);
foreignSource.sources[0].url = 'https://example.test/not-official';
assert.throws(() => loadCoreLearning(root, { research: foreignSource }), /공식|출처/);
console.log('core learning data: six units, real observations, exact source SHA and narrow evidence scopes passed');
