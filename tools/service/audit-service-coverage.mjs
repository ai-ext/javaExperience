// 최종 서비스 기획 coverage 감사. 임시/빈 기능 데이터는 통과시키지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
function runAudit() {
const errors = [];
const requiredFiles = ['service/generated-source-index.json', 'service/catalog.json', 'service/source-map.json', 'service/api-contracts.json'];
for (const file of requiredFiles) if (!fs.existsSync(path.join(ROOT, file))) errors.push(`필수 source 미작성: ${file}`);
if (errors.length) { fail(errors); process.exit(1); }

const sourceIndex = readJson('service/generated-source-index.json');
const catalog = readJson('service/catalog.json');
const sourceMap = readJson('service/source-map.json');
const contracts = readJson('service/api-contracts.json');
const sourceIds = new Set(sourceIndex.units.map((unit) => unit.id));
const requiredIds = new Set(sourceIndex.units.filter((unit) => unit.required).map((unit) => unit.id));
if (requiredIds.size !== 243) errors.push(`필수 source 단위가 243개가 아닙니다: ${requiredIds.size}`);
const sourceUnits = new Map(sourceIndex.units.map((unit) => [unit.id, unit]));

const features = new Map();
for (const entry of catalog.features || []) {
  if (features.has(entry.id)) errors.push(`catalog feature id 중복: ${entry.id}`);
  if (!entry.id || !entry.file) { errors.push('catalog feature id/file 누락'); continue; }
  if (!entry.group) errors.push(`${entry.id}: catalog group 미작성`);
  const featurePath = path.posix.normalize(`service/${entry.file}`);
  if (!featurePath.startsWith('service/features/') || !fs.existsSync(path.join(ROOT, featurePath))) {
    errors.push(`feature 원본 파일 없음 또는 허용 위치 밖: ${entry.id} → ${entry.file}`); continue;
  }
  const feature = readJson(featurePath);
  features.set(entry.id, feature);
  if (entry.status !== 'authored' || feature.status === 'draft') errors.push(`미작성 기능: ${entry.id} (status=${entry.status || feature.status || 'unset'})`);
  const stageLocations = new Set();
  for (const variant of feature.variants || []) for (const stage of variant.stages || []) {
    stageLocations.add(`${variant.id}/${stage.id}`);
    validateStage(entry.id, variant, stage, errors);
  }
  for (const stage of feature.stages || []) if (!stageLocations.size) errors.push(`${entry.id}: variant별 stage가 없습니다 (${stage.id})`);
}

errors.push(...sourceMappingErrors({ sourceUnits: sourceIndex.units, features: [...features.values()], mappings: sourceMap.units || [] }));

errors.push(...recipeReferenceErrors({ features: [...features.values()], recipes: contracts.recipes || [], sourceUnits: sourceIndex.units }));
if (errors.length) fail(errors);
else console.log(`service coverage OK: ${sourceIds.size} source units, ${features.size} authored features`);
}

function validateStage(featureId, variant, stage, errors) {
  const label = `${featureId}/${variant.id}/${stage.id}`;
  const brief = stage.brief || {};
  for (const key of ['purpose', 'task']) if (!meaningful(brief[key])) errors.push(`${label}: brief.${key} 미작성`);
  for (const key of ['preconditions', 'scenario', 'data', 'policies', 'inputs', 'success', 'failures', 'examples', 'work', 'done']) {
    if (!Array.isArray(brief[key]) || brief[key].length === 0) errors.push(`${label}: brief.${key} 미작성`);
  }
  if (!Array.isArray(stage.hints) || !stage.hints.length || stage.hints.some((hint) => !meaningful(hint))) errors.push(`${label}: 질문형 힌트 미작성`);
  if (!(stage.recipeIds || []).length && !(stage.executionChecks || []).length) errors.push(`${label}: API recipe 또는 실행 확인 미작성`);
  for (const check of stage.executionChecks || []) for (const key of ['title', 'command', 'expected', 'record']) {
    if (!meaningful(check[key])) errors.push(`${label}: executionChecks.${key} 미작성`);
  }
  for (const hint of stage.hints || []) if (!/[?？]/.test(hint)) errors.push(`${label}: 질문형이 아닌 힌트가 있습니다`);
}

function meaningful(value) { return typeof value === 'string' && value.trim().length > 0; }

export function sourceMappingErrors({ sourceUnits, features, mappings }) {
  const errors = [];
  const unitsById = new Map((sourceUnits || []).map((unit) => [unit.id, unit]));
  const featuresById = new Map((features || []).map((feature) => [feature.id, feature]));
  const mappedTuples = new Set();
  const mappedRows = new Set();
  for (const row of mappings || []) {
    const tuple = `${row.sourceId}\0${row.featureId}\0${row.variantId}\0${row.stageId}`;
    if (!unitsById.has(row.sourceId)) errors.push(`source-map에 모르는 sourceId가 있습니다: ${row.sourceId}`);
    if (mappedTuples.has(tuple)) errors.push(`source-map 매핑 tuple 중복: ${row.sourceId}/${row.featureId}/${row.variantId}/${row.stageId}`);
    mappedTuples.add(tuple);
    mappedRows.add(tuple);
    const feature = featuresById.get(row.featureId);
    if (!feature) { errors.push(`${row.sourceId}: feature가 catalog에 없습니다 (${row.featureId})`); continue; }
    const variant = (feature.variants || []).find((item) => item.id === row.variantId);
    if (!variant) { errors.push(`${row.sourceId}: variant가 없습니다 (${row.variantId})`); continue; }
    const stage = (variant.stages || []).find((item) => item.id === row.stageId);
    if (!stage) { errors.push(`${row.sourceId}: stage가 없습니다 (${row.stageId})`); continue; }
    if (!(stage.sourceUnits || []).includes(row.sourceId)) errors.push(`${row.sourceId}: feature stage의 sourceUnits에 빠져 있습니다`);
    const sourceProject = unitsById.get(row.sourceId)?.project;
    if (row.role === 'primary' && sourceProject && variant.project && sourceProject !== variant.project) {
      errors.push(`${row.sourceId}: project 불일치 (${sourceProject} != ${variant.project})`);
    }
  }
  for (const sourceId of unitsById.keys()) {
    if (![...mappedRows].some((tuple) => tuple.startsWith(`${sourceId}\0`))) errors.push(`기능 매핑 누락: ${sourceId}`);
  }
  for (const feature of features || []) for (const variant of feature.variants || []) for (const stage of variant.stages || []) {
    for (const sourceId of stage.sourceUnits || []) {
      if (!unitsById.has(sourceId)) errors.push(`${feature.id}/${variant.id}/${stage.id}: 모르는 stage sourceUnit ${sourceId}`);
      const tuple = `${sourceId}\0${feature.id}\0${variant.id}\0${stage.id}`;
      if (!mappedRows.has(tuple)) errors.push(`${sourceId}: stage.sourceUnits에만 존재하고 source-map 행이 없습니다 (${feature.id}/${variant.id}/${stage.id})`);
    }
  }
  return errors;
}

export function recipeReferenceErrors({ features, recipes, sourceUnits }) {
  const errors = [];
  const unitsById = new Map((sourceUnits || []).map((unit) => [unit.id, unit]));
  const recipesById = new Map();
  for (const recipe of recipes || []) {
    if (recipesById.has(recipe.id)) errors.push(`recipe id 중복: ${recipe.id}`);
    recipesById.set(recipe.id, recipe);
    const recipeSourceIds = [...(recipe.sourceUnits || []), recipe.binding?.sourceId].filter(Boolean);
    for (const sourceId of recipeSourceIds) {
      const unit = unitsById.get(sourceId);
      if (!unit) errors.push(`${recipe.id}: 모르는 recipe sourceUnit ${sourceId}`);
      else if ((recipe.id.startsWith('legacy:') || recipe.id.startsWith('functional:') || recipe.binding?.sourceId === sourceId)
        && unit.project && recipe.project && unit.project !== recipe.project) {
        errors.push(`${recipe.id}: sourceUnit project 불일치 (${sourceId}: ${unit.project} != ${recipe.project})`);
      }
    }
  }
  for (const feature of features || []) for (const variant of feature.variants || []) for (const stage of variant.stages || []) {
    for (const id of stage.recipeIds || []) {
      const recipe = recipesById.get(id);
      if (!recipe) errors.push(`${feature.id}/${stage.id}: 미등록 recipe ${id}`);
      else if (recipe.project && recipe.project !== variant.project) {
        errors.push(`${feature.id}/${variant.id}/${stage.id}: recipe project 불일치 (${id}: ${recipe.project} != ${variant.project})`);
      }
    }
  }
  return errors;
}

function fail(errors) {
  console.error(`service coverage FAIL (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runAudit();
