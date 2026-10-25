import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  describeSourceChecks,
  legacyClassification,
  manualBindingsForRequest,
  normalizedSourceProject,
  sourceAssertions,
} from '../service/build-api-recipes.mjs';
import { recipeReferenceErrors, sourceMappingErrors } from '../service/audit-service-coverage.mjs';

const readJson = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), 'utf8'));

test('여러 stage에서 같은 sourceId를 기능별로 매핑할 수 있지만 같은 tuple 중복은 거부한다', () => {
  const sourceUnits = [{ id: 'course:D05-2', project: 'board' }];
  const features = [{ id: 'posts-edit-remove', variants: [{ id: 'board', project: 'board', stages: [
    { id: 'replace', sourceUnits: ['course:D05-2'] },
    { id: 'partial', sourceUnits: ['course:D05-2'] },
  ] }] }];
  const mappings = [
    { sourceId: 'course:D05-2', featureId: 'posts-edit-remove', variantId: 'board', stageId: 'replace', project: 'board' },
    { sourceId: 'course:D05-2', featureId: 'posts-edit-remove', variantId: 'board', stageId: 'partial', project: 'board' },
  ];
  assert.deepEqual(sourceMappingErrors({ sourceUnits, features, mappings }), []);
  assert.match(sourceMappingErrors({ sourceUnits, features, mappings: [...mappings, mappings[0]] }).join('\n'), /매핑 tuple 중복/);
});

test('source-map 역방향 누락, 모르는 source, stage project 불일치를 검출한다', () => {
  const errors = sourceMappingErrors({
    sourceUnits: [{ id: 'support:L16', project: 'community' }],
    features: [{ id: 'sessions', variants: [{ id: 'project-v1', project: 'project-v1', stages: [{ id: 'read', sourceUnits: ['support:L16', 'support:extra'] }] }] }],
    mappings: [
      { sourceId: 'unknown', featureId: 'sessions', variantId: 'project-v1', stageId: 'read', project: 'project-v1' },
      { sourceId: 'support:L16', featureId: 'sessions', variantId: 'project-v1', stageId: 'read', project: 'project-v1', role: 'primary' },
    ],
  });
  assert.match(errors.join('\n'), /모르는 sourceId/);
  assert.match(errors.join('\n'), /stage\.sourceUnits에만 존재/);
  assert.match(errors.join('\n'), /project 불일치/);
});

test('모르는 recipe와 source project·variant project 불일치를 검출한다', () => {
  const errors = recipeReferenceErrors({
    sourceUnits: [{ id: 'course:D30-1', project: 'board' }],
    recipes: [
      { id: 'wrong-project', project: 'community', sourceUnits: ['course:D30-1'] },
      { id: 'unknown-source', project: 'board', binding: { sourceId: 'course:D99-1' } },
      { id: 'legacy:10-4:login', project: 'community', sourceUnits: ['course:D30-1'] },
    ],
    features: [{ id: 'posts', variants: [{ id: 'board', project: 'board', stages: [{ id: 'list', recipeIds: ['not-registered', 'wrong-project'] }] }] }],
  });
  assert.match(errors.join('\n'), /미등록 recipe/);
  assert.match(errors.join('\n'), /sourceUnit project 불일치/);
  assert.match(errors.join('\n'), /recipe project 불일치/);
  assert.match(errors.join('\n'), /모르는 recipe sourceUnit/);
});

test('JSONPath equals/contains 원문을 보존하고 자동 지원하지 않는다고 명시한다', () => {
  const checks = [{ id: 'C1', request: 'P', expect: { status: 200, json: [
    { path: '$.id', equals: '{{P.body.id}}' },
    { path: '$.title', contains: 'Spring' },
  ] } }];
  assert.deepEqual(sourceAssertions(checks), [
    { checkId: 'C1', request: 'P', jsonPath: '$.id', operators: { equals: '{{P.body.id}}' }, support: 'manual' },
    { checkId: 'C1', request: 'P', jsonPath: '$.title', operators: { contains: 'Spring' }, support: 'manual' },
  ]);
  assert.match(describeSourceChecks(checks), /HTTP 상태 200/);
  assert.match(describeSourceChecks(checks), /JSON 경로 \$\.id equals/);
});

test('assertion이 없는 준비 요청을 수동 검증으로 분류하고 상태를 만들지 않는다', () => {
  const request = { id: 'LOGIN', title: '로그인 준비 요청' };
  assert.equal(legacyClassification(request, []), 'preparation-without-assertion');
  assert.equal(legacyClassification({ id: 'X', title: '임의 요청' }, []), 'manual-only');
});

test('legacy 10장과 query-practice만 해당 project로 정규화하고 나머지는 community로 둔다', () => {
  assert.equal(normalizedSourceProject('10-2', 'community', '/api/v1/posts'), 'project-v1');
  assert.equal(normalizedSourceProject('L15', 'community', '/api/v1/session/me'), 'project-v1');
  assert.equal(normalizedSourceProject('L16', 'community', '/api/labs/post-summaries/2'), 'community');
  assert.equal(normalizedSourceProject('L12', 'community', '/api/posts'), 'practice');
  assert.equal(normalizedSourceProject('L12', 'community', '/api/query-practice/jpa/search'), 'practice');
  assert.equal(normalizedSourceProject('3-1', 'query-practice', '/api/posts'), 'practice');
  assert.equal(normalizedSourceProject('3-1', 'community', '/api/posts'), 'community');
});

test('요청 템플릿은 원문 보존용 manualBindings와 needsInput에 노출한다', () => {
  const bindings = manualBindingsForRequest({
    path: '/api/posts/{{P.body.id}}?owner={{X.body.member.id}}',
    headers: { 'X-Token': '{{X.header.Authorization}}' },
    body: { targetId: '{{P.body.id}}' },
  });
  assert.deepEqual(bindings.map(({ name, location }) => [name, location]), [
    ['P.body.id', 'path'],
    ['X.body.member.id', 'query'],
    ['X.header.Authorization', 'header'],
    ['P.body.id', 'body'],
  ]);
});

test('L15·L16와 course/API 프로젝트가 정규 project 이름으로 생성되고 route 수는 유지된다', () => {
  const sourceIndex = readJson('../../service/generated-source-index.json');
  const contracts = readJson('../../service/api-contracts.json');
  const projectBySource = new Map(sourceIndex.units.map((unit) => [unit.id, unit.project]));
  assert.equal(projectBySource.get('support:scenario/labs/l15-session-auth/README.md'), 'project-v1');
  assert.equal(projectBySource.get('support:scenario/labs/l16-interface-implementations/README.md'), 'community');
  assert.equal(projectBySource.get('support:scenario/db-query-journey/db-01-response-to-query.md'), 'practice');
  assert.equal(projectBySource.get('course:D30-1'), 'board');
  assert.equal(contracts.validation.sourceCounts.routes, 162, '기존127 + board30 + 명시된L15/L16의5개 경로');
  assert.equal(contracts.routes.filter(route => route.path.startsWith('/api/v1/session/')).length, 4);
  assert.ok(contracts.routes.some(route => route.project === 'community' && route.path === '/api/labs/post-summaries/{id}'));
  assert.ok(contracts.routes.some((route) => route.project === 'practice'));
  const board = contracts.recipes.filter((recipe) => recipe.id.startsWith('board:'));
  const legacy10 = contracts.recipes.filter((recipe) => recipe.id.startsWith('legacy:10-'));
  const queryPractice = contracts.recipes.filter((recipe) => recipe.path?.startsWith('/api/query-practice/'));
  assert.equal(board.length, 30);
  assert.ok(board.every((recipe) => recipe.project === 'board'));
  assert.ok(legacy10.length > 0 && legacy10.every((recipe) => recipe.project === 'project-v1'));
  assert.ok(queryPractice.length > 0 && queryPractice.every((recipe) => recipe.project === 'practice'));
  assert.equal(contracts.recipes.find((recipe) => recipe.id === 'legacy:L12:P')?.project, 'practice');
});

test('상태가 없는 legacy 요청은 원문을 보존하고 준비/수동 확인으로 분류한다', () => {
  const contracts = readJson('../../service/api-contracts.json');
  const blank = contracts.recipes.filter((recipe) => recipe.id.startsWith('legacy:') && !recipe.expected.statuses.length);
  assert.ok(blank.length > 0);
  for (const recipe of blank) {
    assert.ok(['preparation-without-assertion', 'manual-only'].includes(recipe.classification), recipe.id);
    assert.ok(recipe.expected.description, recipe.id);
  }
  const unresolved = contracts.recipes.find((recipe) => recipe.id === 'legacy:3-0:U');
  assert.ok(unresolved.path.includes('{{P.body.id}}'));
  assert.ok(unresolved.needsInput.includes('P.body.id'));
  assert.equal(unresolved.manualBindings.find((item) => item.name === 'P.body.id').location, 'path');
  assert.ok(unresolved.caseOnly);
});

test('L15 auth recipe는 README에 적힌 네 route만 선언하고 cookie/token 값은 저장하지 않는다', () => {
  const data = readJson('../../service/authoring/session-recipes.json');
  assert.equal(data.source.sourceUnitId, 'support:scenario/labs/l15-session-auth/README.md');
  assert.deepEqual(data.recipes.map(({ method, path }) => `${method} ${path}`), [
    'GET /api/v1/session/csrf',
    'POST /api/v1/session/login',
    'GET /api/v1/session/me',
    'POST /api/v1/session/logout',
  ]);
  const csrf = data.recipes.find((recipe) => recipe.id === 'session-lab:csrf');
  assert.deepEqual(csrf.expected.statuses, []);
  assert.equal(csrf.expected.assertionSupport.httpStatus, 'unavailable');
  assert.deepEqual(csrf.needsInput, []);
  assert.equal(data.transport.tokenPersistence, 'none');
  assert.equal(data.transport.csrfTokenPersistence, 'none');
  assert.equal(data.transport.sessionCookiePersistence, 'none');
  assert.ok(data.recipes.every((recipe) => recipe.credentials === 'include'));
});
