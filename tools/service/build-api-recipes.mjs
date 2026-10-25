// 로컬 계약 원본에서 API 요청 recipe와 중복 제거한 route metadata를 생성한다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COURSE_API_CONTRACTS } from '../site/course-api-contracts.mjs';
import { FUNCTIONAL_TASKS } from '../site/functional-scenario-data.mjs';
import { FUNCTIONAL_LIKE_TASKS } from '../site/functional-like-data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'service/api-contracts.json');
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), 'utf8'));
const readText = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const unique = (values) => [...new Set(values)];

const ALLOWED_VALUES = Object.freeze({
  email: 'learner@example.test',
  password: 'Learning123',
  nickname: '김자바',
  title: '첫 기록',
  content: '오늘 배운 내용',
  tags: ['spring'],
  quantity: 1,
  itemId: 1,
  memberCouponId: null,
  reportId: null,
  reason: 'SPAM',
  amount: 1000,
  status: 'DONE',
  paymentKey: 'payment-demo',
  orderId: '',
});
// D10 원문은 가입 성공 201을 본문 규칙으로 명시하고 check 표의 상태칸만 비워 둔다.
// O1은 채점 제외 관찰이므로 자동 기대 상태를 추가하지 않는다.
const LEGACY_EXPECTED_STATUS_OVERRIDES = Object.freeze({
  'legacy:10-3:A': [201],
  'legacy:10-3:B1': [201],
  'legacy:10-3:B2': [201],
});
const DEFAULT_PATH_VALUES = Object.freeze({ couponId: '1' });

function refsFor(sourcePath, pointer, other = []) {
  return [{ path: sourcePath, ...(pointer ? { pointer } : {}) }, ...other]
    .filter((ref, index, all) => all.findIndex((item) => item.path === ref.path && item.pointer === ref.pointer) === index);
}

function fieldsByLocation(fields, location) {
  return (fields || []).filter((field) => field.in === location);
}

function pathVariables(pathValue) {
  return [...String(pathValue || '').matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map((match) => match[1]);
}

function normalizedRoute(pathValue) {
  return String(pathValue || '').replace(/^https?:\/\/[^/]+/i, '').split('?')[0].replace(/\{[A-Za-z][A-Za-z0-9_]*\}/g, '{}');
}

function sourceUnitIdsForApi(sourceIndex, method, pathValue) {
  const allowedKinds = new Set(['course', 'java-exercise', 'course-ticket', 'database-lab', 'database-journey']);
  return (sourceIndex?.units || []).filter((unit) => allowedKinds.has(unit.kind)
    && (unit.apiRefs || []).some((ref) => ref.method === method && normalizedRoute(ref.path) === normalizedRoute(pathValue)))
    .map((unit) => unit.id);
}

function safeBody(fields, { allowRaw = false } = {}) {
  const jsonFields = fieldsByLocation(fields, 'json');
  const body = {};
  const missingRequired = [];
  for (const field of jsonFields) {
    if (!Object.hasOwn(ALLOWED_VALUES, field.name)) {
      if (field.required) missingRequired.push(field.name);
      continue;
    }
    body[field.name] = ALLOWED_VALUES[field.name];
  }
  if (!jsonFields.length) return { body: null, bodyKind: 'none', missingRequired };
  if (allowRaw) return { body: JSON.stringify(body), bodyKind: 'text', missingRequired };
  return { body, bodyKind: 'json', missingRequired };
}

function requestHeaders(endpoint, bodyKind) {
  const result = {};
  const manualCheck = [];
  const fields = endpoint.request?.fields || [];
  const headerFields = fieldsByLocation(fields, 'header');
  for (const field of headerFields) {
    if (/^authorization$/i.test(field.name)) {
      manualCheck.push('인증 헤더는 기본값으로 전송하지 않습니다. 유효한 토큰을 요청 도구의 Bearer 토큰 입력란에 직접 입력하세요.');
    } else if (/^idempotency-key$/i.test(field.name)) {
      result[field.name] = endpoint.id === 'shop-order' ? 'order-learning-001' : endpoint.id === 'points-charge' ? 'charge-learning-001' : '';
      if (!result[field.name]) manualCheck.push(`${field.name} 예시값을 원본에서 확인하지 못했습니다. 요청 전에 계약을 확인하세요.`);
    } else if (/^x-pg-signature$/i.test(field.name)) {
      result[field.name] = '';
      manualCheck.push('X-PG-Signature는 빈 입력 상태입니다. 원문 body bytes에 대한 HMAC-SHA256을 비밀값 없이 로컬 CLI에서 계산해 입력하세요. JSON 편집 뒤에는 서명도 다시 계산해야 합니다.');
    } else if (/^content-type$/i.test(field.name)) {
      result[field.name] = String(field.type || 'application/json');
    } else if (field.required) {
      manualCheck.push(`필수 헤더 ${field.name}의 실제 값은 원본에서 자동 예시를 정의하지 않았습니다.`);
    }
  }
  if (bodyKind === 'json' && !Object.keys(result).some((key) => /^content-type$/i.test(key))) result['Content-Type'] = 'application/json';
  return { headers: result, manualCheck };
}

function expectedStatuses(status) {
  if (Number.isInteger(status)) return [status];
  if (Array.isArray(status)) return unique(status.flatMap((item) => expectedStatuses(item)));
  if (typeof status !== 'string') return [];
  return unique([...status.matchAll(/\b([1-5]\d\d)\b/g)].map((match) => Number(match[1])));
}

export function sourceAssertions(checks) {
  return (checks || []).flatMap(({ id, request, expect }) => (expect?.json || []).map(({ path: jsonPath, ...operators }) => ({
    checkId: id,
    request,
    jsonPath,
    operators,
    support: 'manual',
  })));
}

export function describeSourceChecks(checks) {
  const descriptions = [];
  for (const { id, request, expect = {}, manual } of checks || []) {
    if (manual) { descriptions.push(`${id}: ${manual}`); continue; }
    if (expect.status != null) descriptions.push(`${id}: HTTP 상태 ${expect.status}이어야 합니다.`);
    for (const assertion of expect.json || []) {
      const { path: jsonPath, ...operators } = assertion;
      const detail = Object.entries(operators).map(([operator, value]) => `${operator} ${JSON.stringify(value)}`).join(', ');
      descriptions.push(`${id}: JSON 경로 ${jsonPath} ${detail}이어야 합니다.`);
    }
    for (const [name, assertions] of Object.entries(expect.headers || {})) {
      descriptions.push(`${id}: 응답 헤더 ${name} ${JSON.stringify(assertions)}이어야 합니다.`);
    }
    if (expect.body != null) descriptions.push(`${id}: 응답 본문 ${JSON.stringify(expect.body)}이어야 합니다.`);
    if (!expect.status && !expect.json?.length && !Object.keys(expect.headers || {}).length && expect.body == null) {
      descriptions.push(`${id}: ${request || '요청'}에 대한 원문 확인 내용을 직접 기록합니다.`);
    }
  }
  return descriptions.join(' ');
}

export function legacyClassification(request, checks) {
  if ((checks || []).some((item) => item.manual)) return 'manual-only';
  if ((checks || []).some((item) => item.expect?.status != null)) return 'asserted';
  if ((checks || []).some((item) => item.expect && Object.keys(item.expect).length)) return 'manual-only';
  if (/준비|setup|prepare|가입|로그인|토큰/i.test(String(request?.title || '')) || request?.purpose === 'preparation') {
    return 'preparation-without-assertion';
  }
  return 'manual-only';
}

export function manualBindingsForRequest(request) {
  const bindings = [];
  const add = (value, location) => {
    for (const match of String(value ?? '').matchAll(/\{\{([^{}]+)\}\}/g)) {
      const name = match[1];
      const binding = { name, location, sourceExpression: match[0], required: true };
      if (!bindings.some((item) => item.name === name && item.location === location)) bindings.push(binding);
    }
  };
  const path = String(request?.path || '');
  const queryStart = path.indexOf('?');
  add(queryStart < 0 ? path : path.slice(0, queryStart), 'path');
  if (queryStart >= 0) add(path.slice(queryStart + 1), 'query');
  for (const value of Object.values(request?.query || {})) add(value, 'query');
  for (const value of Object.values(request?.headers || {})) add(value, 'header');
  const walk = (value) => {
    if (typeof value === 'string') add(value, 'body');
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(request?.body);
  return bindings;
}

export function normalizedSourceProject(levelId, project, routePath = '') {
  const sourceId = String(levelId || '');
  if (sourceId.startsWith('10-') || sourceId === 'L15') return 'project-v1';
  if (/^L1[234]$/.test(sourceId) || project === 'query-practice' || project === 'practice'
    || String(routePath).startsWith('/api/query-practice/')) return 'practice';
  return 'community';
}

function outputFields(bodyDescription) {
  if (/(?:Response|Page|Item)\[\]/.test(String(bodyDescription || ''))) return [];
  const text = String(bodyDescription || '');
  const objectStart = text.indexOf('{');
  if (objectStart < 0) return [];
  let depth = 0, objectEnd = -1;
  for (let index = objectStart; index < text.length; index += 1) {
    if (text[index] === '{') depth += 1;
    else if (text[index] === '}' && --depth === 0) { objectEnd = index; break; }
  }
  if (objectEnd < 0) return [];
  const root = text.slice(objectStart + 1, objectEnd);
  const entries = [];
  let start = 0, nested = 0;
  for (let index = 0; index <= root.length; index += 1) {
    if (root[index] === '{' || root[index] === '[') nested += 1;
    else if (root[index] === '}' || root[index] === ']') nested -= 1;
    else if ((root[index] === ',' || index === root.length) && nested === 0) {
      entries.push(root.slice(start, index));
      start = index + 1;
    }
  }
  const fields = [];
  for (const entry of entries) {
    const name = entry.trim().split(':', 1)[0].replace(/\[\]$/, '');
    if (/^[A-Za-z_$][\w$]*$/.test(name)) fields.push(name);
  }
  return unique(fields);
}

function captureFromSource(endpoint) {
  const body = String(endpoint.success?.body || '');
  const location = body.match(/Location\s*:\s*(\/[^\s,;]+)/i)?.[1]
    || body.match(/Location\s+(\/[^\s,;]+)/i)?.[1];
  if (location) {
    const last = [...location.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].at(-1)?.[1];
    if (last) return { key: last, locationPattern: location };
  }
  const jsonFields = outputFields(body);
  const preferred = ({ signup: 'id', 'post-report': 'reportId', 'coupon-issue': 'memberCouponId', 'points-charge': 'orderId', 'shop-order': 'orderId' })[endpoint.id];
  const key = preferred && jsonFields.includes(preferred) ? preferred : null;
  return key ? { key, jsonPath: key } : null;
}

function boardRecipe(endpoint, courseContractByEndpoint, endpointIndex, sourceIndex) {
  const id = `board:${endpoint.id}:normal`;
  const sourceFields = endpoint.request?.fields || [];
  const routeParams = pathVariables(endpoint.path);
  const pathParams = Object.fromEntries(routeParams.map((name) => [name, Object.hasOwn(DEFAULT_PATH_VALUES, name) ? DEFAULT_PATH_VALUES[name] : '']));
  const { body, bodyKind: bodyType, missingRequired } = safeBody(sourceFields, { allowRaw: endpoint.id === 'pg-callback' });
  const isMultipart = sourceFields.some((field) => field.in === 'multipart/form-data' || field.type === 'xlsx file');
  const bodyKind = isMultipart ? 'multipart' : bodyType;
  const { headers, manualCheck } = requestHeaders(endpoint, bodyKind);
  const successBody = String(endpoint.success?.body || '');
  if (/\[[^\]]*\]|;\s*\w+\s*\{/.test(successBody)) {
    manualCheck.push('응답 자동 확인은 JSON 최상위 필드까지입니다. 배열 원소·중첩 DTO는 기대 응답 설명과 실제 JSON을 직접 비교하세요.');
  }
  const query = {};
  const requiredQuery = fieldsByLocation(sourceFields, 'query').filter((field) => field.required).map((field) => field.name);
  const statuses = expectedStatuses(endpoint.success?.status);
  const bodyMode = /empty body/i.test(String(endpoint.success?.body || '')) ? 'empty' : 'json';
  const sourceCases = (endpoint.specificErrors || []).map((error, index) => ({
    id: `${id}:error:${error.status ?? index + 1}`,
    label: `실패 사례 · ${expectedStatuses(error.status).join('/') || error.status || '상태 미명시'} · ${error.condition || '원본 조건 확인'}`,
    expected: { statuses: expectedStatuses(error.status), bodyMode: 'any', description: error.condition || '' },
    condition: error.condition || '',
    ...(error.type ? { type: error.type } : {}),
  }));
  const courseContracts = courseContractByEndpoint.get(endpoint.id) || [];
  const manualDb = courseContracts.flatMap((contract) => (contract.dbSql || []).map((item) => ({
    title: item.title, sql: item.sql, notes: item.explanation,
  })));
  const needsReview = [];
  const capture = captureFromSource(endpoint);
  const sourceUnits = unique([
    ...courseContracts.map((contract) => `course:${contract.stepId}`),
    ...sourceUnitIdsForApi(sourceIndex, endpoint.method, endpoint.path),
  ]);
  if (!statuses.length) needsReview.push({ reason: '원본 success.status에서 상태 코드를 얻지 못했습니다.' });
  if (!sourceUnits.length) needsReview.push({ reason: '정확한 method/path를 근거로 한 canonical source unit이 없습니다.' });
  if (missingRequired.length) needsReview.push({ reason: '허용된 안전 예시값이 없는 필수 JSON 입력 필드입니다.', fields: missingRequired });
  if (requiredQuery.length) needsReview.push({ reason: '필수 query의 안전한 기본값이 원본에 선언되지 않았습니다.', fields: requiredQuery });
  if (sourceCases.some((item) => !item.expected.statuses.length)) needsReview.push({ reason: 'specificErrors의 상태 코드가 숫자로 기록되지 않은 사례가 있습니다.' });
  if (endpoint.id === 'admin-bulk-coupon') manualCheck.push('업로드할 .xlsx 파일은 사용자가 직접 선택합니다. 파일 경로를 가짜로 채우지 않습니다.');
  if (endpoint.id === 'pg-callback') {
    manualCheck.push('orderId는 points-charge 실제 응답에서 복사해 넣으세요. 서명은 현재 raw body 문자열의 정확한 바이트를 대상으로 계산해야 합니다.');
    needsReview.push({ reason: '허용된 기본 body에서는 실제 충전 응답을 아직 모르므로 orderId를 빈 입력으로 둡니다.', fields: ['orderId'] });
  }
  if (capture && routeParams.length && capture.key !== routeParams[0]) {
    manualCheck.push(`응답의 ${capture.key}는 요청 경로의 부모 ID ${routeParams[0]}와 다르므로 응답 ID를 수동으로 다른 요청에 입력하세요.`);
    needsReview.push({ reason: '요청 도구는 경로 첫 ID를 저장 키로 사용하므로 응답에서 반환한 별도 자원 ID는 자동 연결하지 않습니다.', fields: [capture.key, routeParams[0]] });
  }
  for (const contract of courseContracts) for (const sql of contract.dbSql || []) {
    if (!manualDb.some((item) => item.sql === sql.sql && item.title === sql.title)) manualDb.push({ title: sql.title, sql: sql.sql, notes: sql.explanation });
  }
  const actualRefs = (endpoint.sourceRefs || []).map((ref) => ({
    path: ref.path,
    ...(ref.lines ? { pointer: `L${ref.lines[0]}-L${ref.lines[1]}` } : {}),
  }));
  const courseRefs = courseContracts.map((contract) => ({ path: 'tools/site/course-api-contracts.mjs', pointer: `/COURSE_API_CONTRACTS/${contract.id}` }));
  const sourceRefs = refsFor('service/API-SOURCE-FACTS.json', `/endpoints/${endpointIndex}`, [...actualRefs, ...courseRefs]);
  const sourceCourseChecks = courseContracts.flatMap((contract) => contract.expectedChecks || []);
  return {
    id, caseId: id, label: endpoint.label || endpoint.id, project: 'spec-board',
    method: endpoint.method, path: endpoint.path, pathParams, query, headers, bodyKind, body,
    requiresToken: /\b(?:USER|ADMIN)\b/.test(endpoint.auth || '') || fieldsByLocation(sourceFields, 'header').some((field) => /^authorization$/i.test(field.name)),
    requestFields: sourceFields.map((field) => ({ ...field })),
    expected: {
      statuses,
      bodyMode,
      description: successBody,
      fields: outputFields(endpoint.success?.body),
      sourceStatusText: endpoint.success?.status,
      sourceChecks: sourceCourseChecks,
    },
    sourceCases,
    prepare: [endpoint.seedPreparation].filter(Boolean),
    manualCheck: unique(manualCheck),
    manualDb,
    sourceRefs,
    sourceUnits,
    ...(capture && (!routeParams.length || capture.key === routeParams[0]) ? { capture } : {}),
    ...(sourceFields.some((field) => field.type === 'xlsx file') ? { fieldName: 'file' } : {}),
    ...(needsReview.length ? { needsReview } : {}),
  };
}

function parseLegacyManifests() {
  const manifest = readJson('scenario/scenario.json');
  const apiModel = readJson('scenario/api-architecture.json');
  const stageProject = new Map();
  const allApiModelRoutes = [];
  for (const group of apiModel.projects || []) for (const route of group.routes || []) {
    allApiModelRoutes.push({ ...route, projectId: group.id });
    for (const stage of route.stages || []) {
      const key = `${stage}\0${route.method}\0${route.path.split('?')[0]}`;
      if (!stageProject.has(key)) stageProject.set(key, group.id);
    }
  }
  const sources = [];
  for (const chapter of manifest.chapters || []) for (const level of chapter.levels || []) {
    if (!level.file) continue;
    sources.push({ sourcePath: `scenario/${chapter.dir}/${level.file}`, id: level.id, title: level.title, project: chapter.project, sourceUnitId: `legacy:${level.id}`, category: 'stage' });
  }
  const labRoot = path.join(ROOT, 'scenario/labs');
  for (const entry of fs.readdirSync(labRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const sourcePath = `scenario/labs/${entry.name}/README.md`;
    if (!fs.existsSync(path.join(ROOT, sourcePath))) continue;
    const source = readText(sourcePath);
    const id = source.match(/^#\s+(L\d+)\b/m)?.[1];
    if (!id) continue;
    sources.push({ sourcePath, id, title: source.match(/^#\s+(.+)$/m)?.[1] || id, project: null, sourceUnitId: `support:${sourcePath}`, category: 'lab' });
  }
  const all = [];
  let blocks = 0;
  let stageBlocks = 0;
  let labBlocks = 0;
  for (const sourceMeta of sources) {
    const { sourcePath, id: levelId, title: levelTitle, project: sourceProject, sourceUnitId, category } = sourceMeta;
    const source = readText(sourcePath);
    let blockNo = 0;
    for (const fence of source.matchAll(/```check\s*\n([\s\S]*?)\n```/g)) {
      blockNo += 1; blocks += 1;
      if (category === 'lab') labBlocks += 1;
      else stageBlocks += 1;
      const data = JSON.parse(fence[1]);
      const requests = Array.isArray(data.requests) ? data.requests : [];
      const checks = Array.isArray(data.checks) ? data.checks : [];
      requests.forEach((request, requestIndex) => {
        if (!request?.id || !request.method || !request.path) return;
        const caseId = `legacy:${levelId}:${request.id}`;
        const checksForRequest = checks.flatMap((check, checkIndex) => {
          if (check.request === request.id || check.request?.startsWith(`${request.id}#`)) return [{ check, checkIndex, assertion: check }];
          return (check.all || []).filter((item) => item.request === request.id || item.request?.startsWith(`${request.id}#`))
            .map((assertion) => ({ check, checkIndex, assertion }));
        });
        const exactProject = stageProject.get(`${levelId}\0${request.method}\0${String(request.path).split('?')[0]}`);
        const stageCandidates = allApiModelRoutes.filter((route) => route.stages?.includes(levelId) && route.method === request.method)
          .map((route) => ({ route, score: templateMatchScore(route.path, request.path) })).filter((item) => item.score >= 0).sort((a, b) => b.score - a.score);
        const allCandidates = allApiModelRoutes.filter((route) => route.method === request.method)
          .map((route) => ({ route, score: templateMatchScore(route.path, request.path) })).filter((item) => item.score >= 0).sort((a, b) => b.score - a.score);
        const sourceProjectCandidates = allCandidates.filter((item) => item.route.projectId === sourceProject);
        const projectMatch = exactProject || stageCandidates[0]?.route.projectId || sourceProjectCandidates[0]?.route.projectId || allCandidates[0]?.route.projectId;
        const project = request.project || projectMatch || sourceProject || 'needsReview';
        const requestHeaders = { ...(request.headers || {}) };
        const manualCheck = [];
        for (const key of Object.keys(requestHeaders)) {
          if (/^authorization$/i.test(key)) {
            delete requestHeaders[key];
            manualCheck.push('원문 요청에 Authorization 사례가 있지만 자동 기본값은 비워 뒀습니다. 실제 토큰을 직접 입력하세요.');
          } else if (isBrowserManagedHeader(key)) {
            delete requestHeaders[key];
            manualCheck.push(`${key}는 브라우저 관리 헤더라 수동 요청에서 제외했습니다. 실제 Network 요청을 확인하세요.`);
          }
        }
        const body = request.body ?? null;
        const bodyKind = body == null ? 'none' : typeof body === 'string' ? (looksLikeJson(body) ? 'json' : 'text') : 'json';
        const statuses = unique([
          ...checksForRequest.flatMap(({ assertion }) => expectedStatuses(assertion.expect?.status)),
          ...(LEGACY_EXPECTED_STATUS_OVERRIDES[caseId] || []),
        ]);
        const sourceChecks = checksForRequest.map(({ check, checkIndex, assertion }) => ({
          id: check.id || `check-${checkIndex + 1}`,
          pointer: `/checks/${checkIndex}`,
          request: assertion.request || request.id,
          expect: assertion.expect ? { ...assertion.expect } : {},
          ...(assertion.manual ? { manual: assertion.manual } : {}),
          ...(assertion.note || check.note ? { note: assertion.note || check.note } : {}),
        }));
        const assertions = sourceAssertions(sourceChecks);
        const classification = legacyClassification(request, sourceChecks);
        const manualBindings = manualBindingsForRequest(request);
        const requiredFields = body && typeof body === 'object' && !Array.isArray(body) ? Object.keys(body) : [];
        const capturesSignupId = ['A', 'B1', 'B2'].includes(request.id)
          && String(sourceUnitId) === 'legacy:10-3' && request.method === 'POST' && request.path === '/api/v1/users';
        const recipe = {
          id: caseId, caseId, label: request.title || `${levelTitle} · ${request.id}`,
          project, method: request.method, path: request.path,
          pathParams: Object.fromEntries(pathVariables(request.path).map((name) => [name, ''])),
          query: request.query && typeof request.query === 'object' ? { ...request.query } : {},
          headers: requestHeaders, bodyKind, body,
          requiresToken: manualCheck.some((note) => note.includes('Authorization')),
          requestFields: requiredFields.map((name) => ({ name, in: 'json', source: 'legacy-request-body' })),
          expected: {
            statuses,
            bodyMode: 'any',
            description: describeSourceChecks(sourceChecks) || (classification === 'preparation-without-assertion'
              ? '준비 요청입니다. 원문에 연결된 자동 기대 상태가 없으므로 실행 결과를 따로 기록하세요.'
              : '원문에 연결된 기대 상태가 없습니다. 응답을 직접 확인하고 기록하세요.'),
            fields: capturesSignupId ? ['data.id'] : [], sourceChecks, assertions,
            assertionSupport: { httpStatus: statuses.length > 0 ? 'automatic' : 'unavailable', jsonPath: 'manual', responseHeaders: 'manual' },
          },
          sourceCases: [],
          prepare: [],
          manualCheck: unique(manualCheck),
          manualDb: [],
          sourceRefs: refsFor(sourcePath, `/check-blocks/${blockNo - 1}/requests/${requestIndex}`,
            sourceChecks.map((check) => ({ path: sourcePath, pointer: `/check-blocks/${blockNo - 1}${check.pointer}` }))),
          sourceUnits: [sourceUnitId],
          classification,
          ...(capturesSignupId ? { capture: { key: 'userId', jsonPath: 'data.id' } } : {}),
          ...(manualBindings.length ? { manualBindings, needsInput: unique(manualBindings.map((item) => item.name)) } : {}),
        };
        if (!checksForRequest.length && !statuses.length) recipe.needsReview = [{ reason: classification === 'preparation-without-assertion'
          ? '준비 요청이라 이 요청 자체의 기대 상태를 원문에서 확인할 수 없습니다.'
          : '연결된 원문 check가 없어 기대 상태를 채우지 않았습니다.', classification }];
        else if (!statuses.length && assertions.length) recipe.needsReview = [{ reason: '원문 JSON/header assertion은 보존했지만 HTTP 상태 코드는 이 요청에 연결되어 있지 않습니다.', classification }];
        if (project === 'needsReview') recipe.needsReview = [...(recipe.needsReview || []), { reason: 'API architecture 프로젝트 매핑이 없습니다.' }];
        all.push(recipe);
      });
    }
  }
  const stageRecipes = all.filter((recipe) => recipe.sourceUnits[0]?.startsWith('legacy:'));
  const labRecipes = all.filter((recipe) => recipe.sourceUnits[0]?.startsWith('support:scenario/labs/'));
  return {
    recipes: all,
    blocks,
    filesWithRequests: new Set(all.map((recipe) => recipe.sourceRefs[0]?.path).filter(Boolean)).size,
    stageBlocks,
    stageFilesWithRequests: new Set(stageRecipes.map((recipe) => recipe.sourceRefs[0]?.path).filter(Boolean)).size,
    stageRequests: stageRecipes.length,
    labBlocks,
    labFilesWithRequests: new Set(labRecipes.map((recipe) => recipe.sourceRefs[0]?.path).filter(Boolean)).size,
    labRequests: labRecipes.length,
  };
}

function looksLikeJson(value) {
  try { JSON.parse(value); return true; } catch { return false; }
}

function isBrowserManagedHeader(name) {
  const lower = String(name).toLowerCase();
  return ['origin', 'cookie', 'cookie2', 'host', 'jsessionid'].includes(lower)
    || lower.startsWith('access-control-request-') || lower.startsWith('sec-') || lower.startsWith('proxy-');
}

function functionalRecipe(task, sourceKind) {
  const endpoint = { method: task.api?.method, path: task.api?.path };
  const request = task.request || {};
  const rawBody = request.body;
  const sourceBodyFields = rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody) ? Object.keys(rawBody) : [];
  const body = {};
  const missingFields = [];
  for (const name of sourceBodyFields) {
    if (Object.hasOwn(ALLOWED_VALUES, name)) body[name] = ALLOWED_VALUES[name];
    else missingFields.push(name);
  }
  const headers = {};
  const manualCheck = [];
  for (const [name, value] of Object.entries(request.headers || {})) {
    if (/^authorization$/i.test(name)) manualCheck.push('원본의 토큰 예시는 자동 전송에서 제외했습니다. Bearer 토큰을 직접 입력하세요.');
    else if (/^content-type$/i.test(name)) headers[name] = value;
    else if (isBrowserManagedHeader(name)) manualCheck.push(`${name}는 브라우저 관리 헤더라 수동 요청에서 제외했습니다.`);
    else headers[name] = value;
  }
  const variables = pathVariables(endpoint.path);
  const pathParams = { ...(request.pathParams || {}) };
  for (const name of variables) {
    const current = pathParams[name];
    if (current == null || /capturedId|\{.*\}/.test(String(current))) pathParams[name] = '';
  }
  const requiresToken = Boolean(task.expected?.failures && Object.keys(request.headers || {}).some((name) => /^authorization$/i.test(name)))
    || /토큰.*필요|인증.*필요|유효한.*토큰/i.test([request.authentication, request.exampleLabel].filter(Boolean).join(' '));
  const query = request.query && typeof request.query === 'object' ? { ...request.query } : {};
  const bodyKind = rawBody == null ? 'none' : 'json';
  const expectedStatus = Number(task.expected?.status);
  const sourcePath = task.sourcePath || `scenario/flow/${task.file}.md`;
  const sourceRefs = refsFor(sourcePath, null, [{ path: sourceKind === 'functional-like' ? 'tools/site/functional-like-data.mjs' : 'tools/site/functional-scenario-data.mjs', pointer: `${sourceKind === 'functional-like' ? 'FUNCTIONAL_LIKE_TASKS' : 'FUNCTIONAL_TASKS'}/${task.id}` }]);
  for (const legacy of task.legacy || []) sourceRefs.push(...refsFor(legacy.path, legacy.anchor ? `#${legacy.anchor}` : undefined));
  const responseFields = Array.isArray(task.expected?.fields) ? task.expected.fields.map((field) => String(field)) : [];
  const outputFieldsValue = unique(responseFields.map((field) => field.match(/^[A-Za-z_$][\w$]*/)?.[0]).filter(Boolean));
  const capture = task.id === 'create' && outputFieldsValueFrom(task.expected?.fields).includes('id')
    ? { key: 'id', jsonPath: 'id' }
    : null;
  const sourceCases = Object.entries(task.expected?.failures || {}).map(([status, condition], index) => ({
    id: `community:${task.id}:failure:${status}`,
    label: `실패 사례 · ${status} · ${condition}`,
    expected: { statuses: expectedStatuses(status), bodyMode: 'any', description: condition },
    condition,
  }));
  const needsReview = [];
  if (missingFields.length) needsReview.push({ reason: '허용된 기본 요청값 목록에 없는 요청 body 필드는 자동 입력하지 않았습니다.', fields: missingFields });
  if (!Number.isInteger(expectedStatus)) needsReview.push({ reason: '기능 원본에서 기대 상태 코드를 확인할 수 없습니다.' });
  const nestedResponseFields = responseFields.filter((field) => /[.[\]]/.test(field));
  if (nestedResponseFields.length) {
    needsReview.push({ reason: '요청 도구의 현재 자동 필드 확인은 JSON root 필드까지만 수행합니다. 원문 기준의 중첩 필드는 실제 응답에서 직접 확인하세요.', fields: nestedResponseFields });
    manualCheck.push('중첩 응답 필드와 배열 항목은 원문 기능 계약에 따라 직접 확인하세요.');
  }
  const recipe = {
    id: `community:${task.id}:normal`, caseId: `community:${task.id}:normal`, label: task.title,
    project: 'community-board', method: endpoint.method, path: endpoint.path,
    pathParams, query, headers, bodyKind, body: rawBody == null ? null : body,
    requiresToken,
    requestFields: sourceBodyFields.map((name) => ({ name, in: 'json', source: sourceKind })),
    expected: {
      statuses: Number.isInteger(expectedStatus) ? [expectedStatus] : [],
      bodyMode: expectedStatus === 204 ? 'empty' : 'json',
      description: task.goal || task.situation || '',
      fields: outputFieldsValue,
      responseFields,
      sourceChecks: [...(task.expected?.checks || []), ...(task.expected?.failures ? Object.entries(task.expected.failures).map(([status, condition]) => ({ status, condition })) : [])],
    },
    sourceCases, prepare: [request.authentication, request.exampleLabel].filter(Boolean),
    manualCheck: unique(manualCheck),
    manualDb: (task.expected?.dbChecks || []).map((item) => ({ title: item.label || item.title, sql: item.sql, notes: item.compare || item.explanation })),
    sourceRefs, sourceUnits: [`functional:${task.id}`],
    ...(capture ? { capture } : {}),
    ...(needsReview.length ? { needsReview } : {}),
  };
  return recipe;
}

function outputFieldsValueFrom(fields) {
  return Array.isArray(fields) ? fields.map((field) => String(field).split('.').at(-1)) : [];
}

function canonicalRouteId(project, method, routePath) { return `route:${project}:${method}:${routePath}`; }

function requestPathname(rawPath) {
  if (typeof rawPath !== 'string' || !rawPath.trim()) return { pathname: null, invalidUrl: true };
  const value = rawPath.trim();
  if (/^https?:\/\//i.test(value)) {
    try { return { pathname: new URL(value).pathname, invalidUrl: true }; }
    catch { return { pathname: null, invalidUrl: true }; }
  }
  if (!value.startsWith('/') || value.startsWith('//')) return { pathname: null, invalidUrl: true };
  const clean = value.split(/[?#]/, 1)[0];
  if (!clean || clean.includes('\\')) return { pathname: null, invalidUrl: true };
  return { pathname: clean, invalidUrl: false };
}

function templateMatchScore(routePath, requestPath) {
  const routeSegments = String(routePath || '').split('?')[0].split('/').filter(Boolean);
  const requestSegments = requestPathname(requestPath).pathname?.split('/').filter(Boolean);
  if (!requestSegments || routeSegments.length !== requestSegments.length) return -1;
  let literalCount = 0;
  for (let index = 0; index < routeSegments.length; index += 1) {
    if (/^\{[A-Za-z][A-Za-z0-9_]*\}$/.test(routeSegments[index])) continue;
    if (routeSegments[index] !== requestSegments[index]) return -1;
    literalCount += 1;
  }
  return literalCount;
}

function matchCanonicalRoute(routes, project, method, rawPath) {
  const parsed = requestPathname(rawPath);
  if (!parsed.pathname) return { route: null, caseOnly: true, reason: '요청 경로가 route로 해석되지 않는 원문 사례입니다.' };
  const incoming = parsed.pathname.split('/').filter(Boolean);
  const matches = [];
  for (const route of routes) {
    if (route.project !== project || route.method !== method) continue;
    const pattern = String(route.path || '').split('/').filter(Boolean);
    if (pattern.length !== incoming.length) continue;
    let literalCount = 0;
    let badNumericId = false;
    let unresolvedTemplate = false;
    let valid = true;
    for (let index = 0; index < pattern.length; index += 1) {
      const variable = /^\{([A-Za-z][A-Za-z0-9_]*)\}$/.exec(pattern[index]);
      if (!variable) {
        if (pattern[index] !== incoming[index]) { valid = false; break; }
        literalCount += 1;
      } else if (/^(?:id|[A-Za-z][A-Za-z0-9_]*Id)$/i.test(variable[1])
        && !/^\{[A-Za-z][A-Za-z0-9_]*\}$/.test(incoming[index])) {
        if (/\{\{[^{}]+\}\}/.test(incoming[index])) unresolvedTemplate = true;
        else if (!/^[1-9][0-9]*$/.test(incoming[index])) badNumericId = true;
      }
    }
    if (valid) matches.push({ route, literalCount, badNumericId, unresolvedTemplate, exact: normalizedRoute(route.path) === normalizedRoute(parsed.pathname) });
  }
  matches.sort((a, b) => b.literalCount - a.literalCount || Number(b.exact) - Number(a.exact));
  const best = matches[0];
  if (!best) return { route: null, caseOnly: true, reason: '원본 요청이 canonical route 목록에 없습니다. 별도 API route를 만들지 않았습니다.' };
  const caseOnly = parsed.invalidUrl || best.badNumericId || best.unresolvedTemplate;
  const reason = parsed.invalidUrl ? '원본은 절대 URL이어서 route 사례로만 보존합니다.'
    : best.badNumericId ? '경로 변수 자리에 원본의 잘못된 숫자 ID 사례가 있습니다.'
      : best.unresolvedTemplate ? '경로 변수 표현식은 source request에 그대로 남기고 이 요청은 실행 route로 사용하지 않습니다.' : null;
  return { route: best.route, caseOnly, reason };
}

function deduplicateRefs(refs) {
  return refs.filter((ref, index, all) => all.findIndex((item) => item.path === ref.path && item.pointer === ref.pointer) === index);
}

function hasUnresolvedTemplate(recipe) {
  return /\{\{[^{}]+\}\}/.test(JSON.stringify({ path: recipe.path, query: recipe.query, headers: recipe.headers, body: recipe.body }));
}

function buildCanonicalRoutes(recipes, sourceIndex) {
  const apiModel = readJson('scenario/api-architecture.json');
  const routeMap = new Map();
  const knownSourceIds = new Set((sourceIndex?.units || []).map((unit) => unit.id));
  const routeSourceUnits = (stages) => unique((stages || []).flatMap((stage) => {
    const value = typeof stage === 'string' ? stage : stage?.id;
    if (!value) return [];
    const candidates = [`legacy:${value}`, `course:${value}`].filter((id) => knownSourceIds.has(id));
    if (candidates.length) return candidates;
    if (/^L\d+$/.test(value)) return (sourceIndex.units || []).filter((unit) => unit.kind === 'database-lab' && unit.id.includes(`/l${value.slice(1)}-`)).map((unit) => unit.id);
    return [];
  }));
  let canonicalBaseCount = 0;
  for (let projectIndex = 0; projectIndex < (apiModel.projects || []).length; projectIndex += 1) {
    const project = apiModel.projects[projectIndex];
    for (let routeIndex = 0; routeIndex < (project.routes || []).length; routeIndex += 1) {
      const source = project.routes[routeIndex];
      const projectId = project.id === 'spec-board' ? 'project-v1' : project.id === 'query-practice' ? 'practice' : 'community';
      const id = canonicalRouteId(projectId, source.method, source.path);
      const key = `${projectId}\0${source.method}\0${source.path}`;
      if (routeMap.has(key)) continue;
      const sourceUnits = routeSourceUnits(source.stages?.length ? source.stages : source.firstStage ? [source.firstStage] : []);
      routeMap.set(key, {
        ...source,
        id,
        canonicalRouteId: id,
        project: projectId,
        projectLabel: project.label || project.id,
        recipeIds: [],
        sourceUnits,
        sourceRefs: [{ path: 'scenario/api-architecture.json', pointer: `/projects/${projectIndex}/routes/${routeIndex}` }],
      });
      canonicalBaseCount += 1;
    }
  }
  const mainRouteKeys = new Set();
  for (const recipe of recipes.filter((item) => (item.id.startsWith('board:') && item.id.endsWith(':normal')) || item.canonicalRoute === true)) {
    const key = `${recipe.project}\0${recipe.method}\0${recipe.path}`;
    if (routeMap.has(key)) continue;
    const projectMeta = (apiModel.projects || []).find((item) => item.id === recipe.project);
    routeMap.set(key, {
      id: canonicalRouteId(recipe.project, recipe.method, recipe.path),
      canonicalRouteId: canonicalRouteId(recipe.project, recipe.method, recipe.path),
      project: recipe.project,
      projectLabel: projectMeta?.label || recipe.project,
      method: recipe.method,
      path: recipe.path,
      recipeIds: [],
      sourceUnits: [],
      sourceRefs: [],
    });
    mainRouteKeys.add(key);
  }
  const addRoute = (project, method, routePath, recipe) => {
    const key = `${project}\0${method}\0${routePath}`;
    let route = routeMap.get(key);
    if (!route) {
      const projectMeta = (apiModel.projects || []).find((item) => item.id === project);
      route = {
        id: canonicalRouteId(project, method, routePath),
        canonicalRouteId: canonicalRouteId(project, method, routePath),
        project,
        projectLabel: projectMeta?.label || project,
        method,
        path: routePath,
        recipeIds: [],
        sourceUnits: [],
        sourceRefs: [],
      };
      routeMap.set(key, route);
    }
    if (!route.recipeIds.includes(recipe.id)) route.recipeIds.push(recipe.id);
    route.sourceUnits = unique([...(route.sourceUnits || []), ...(recipe.sourceUnits || [])]);
    route.sourceRefs = deduplicateRefs([...(route.sourceRefs || []), ...(recipe.sourceRefs || [])]);
    return route;
  };
  let unmatchedCases = 0;
  let caseOnlyCount = 0;
  for (const recipe of recipes) {
    const match = matchCanonicalRoute([...routeMap.values()], recipe.project, recipe.method, recipe.path);
    if (!match.route) {
      recipe.caseOnly = true;
      recipe.canonicalRouteId = null;
      recipe.caseOnlyReason = match.reason;
      unmatchedCases += 1;
      caseOnlyCount += 1;
      continue;
    }
    if (hasUnresolvedTemplate(recipe) && !match.caseOnly) {
      match.caseOnly = true;
      match.reason = '원문 경로·query·header·body 표현식은 그대로 남기고 이 요청은 실행 route 사례로만 사용합니다.';
    }
    const route = addRoute(recipe.project, recipe.method, match.route.path, recipe);
    recipe.canonicalRouteId = route.canonicalRouteId;
    recipe.caseOnly = match.caseOnly;
    if (match.reason) recipe.caseOnlyReason = match.reason;
    if (match.caseOnly) caseOnlyCount += 1;
  }
  return {
    routes: [...routeMap.values()].map((route) => ({
      ...route,
      recipeIds: unique(route.recipeIds),
      sourceUnits: unique(route.sourceUnits),
      sourceRefs: deduplicateRefs(route.sourceRefs),
    })),
    canonicalBaseCount,
    addedBeyondCanonical: mainRouteKeys.size,
    unmatchedCases,
    caseOnlyCount,
  };
}

export function buildApiContracts() {
  const facts = readJson('service/API-SOURCE-FACTS.json');
  const sourceIndex = readJson('service/generated-source-index.json');
  const existingByStep = new Map();
  const factByCourseId = new Map([
    ['create', 'post-create'], ['detail', 'post-detail'], ['replace', 'post-replace'],
    ['partial', 'post-patch'], ['delete', 'post-delete'], ['like', 'like-put'],
    ['unlike', 'like-delete'], ['list', 'post-list'],
  ]);
  for (const contract of COURSE_API_CONTRACTS) {
    const endpointId = factByCourseId.get(contract.id);
    if (!endpointId) continue;
    existingByStep.set(endpointId, [...(existingByStep.get(endpointId) || []), contract]);
  }
  const boardRecipes = facts.endpoints.map((endpoint, endpointIndex) => boardRecipe(endpoint, existingByStep, endpointIndex, sourceIndex));
  const legacy = parseLegacyManifests();
  const functionalRecipes = [...FUNCTIONAL_TASKS.map((task) => functionalRecipe(task, 'functional')),
    ...FUNCTIONAL_LIKE_TASKS.map((task) => functionalRecipe(task, 'functional-like'))];
  // 기존 architecture의 spec-board는 10장 명세 프로젝트이며 과정 board와 다릅니다.
  for (const recipe of boardRecipes) recipe.project = 'board';
  for (const recipe of functionalRecipes) recipe.project = 'community';
  for (const recipe of legacy.recipes) {
    recipe.project = normalizedSourceProject(recipe.id.split(':')[1], recipe.project, recipe.path);
  }
  const authored = fs.existsSync(path.join(ROOT, 'service/authored-api-contracts.json'))
    ? readJson('service/authored-api-contracts.json').recipes : [];
  const recipes = [...boardRecipes, ...functionalRecipes, ...legacy.recipes, ...authored];
  const ids = recipes.map((recipe) => recipe.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  const mappedCourseContracts = [...existingByStep.values()].reduce((count, contracts) => count + contracts.length, 0);
  const absoluteSourceRefs = recipes.flatMap((recipe) => recipe.sourceRefs || []).filter((ref) => path.isAbsolute(ref.path) || /^[A-Za-z]:[\\/]/.test(ref.path || ''));
  if (boardRecipes.length !== 30 || mappedCourseContracts !== 8 || functionalRecipes.length !== 7
    || legacy.stageBlocks !== 97 || legacy.stageFilesWithRequests !== 97 || legacy.stageRequests !== 1383
    || legacy.labBlocks !== 3 || legacy.labFilesWithRequests !== 3 || legacy.labRequests !== 32 || duplicateIds.length || absoluteSourceRefs.length) {
    throw new Error(`API recipe coverage 오류: ${JSON.stringify({ board: boardRecipes.length, courseContracts: mappedCourseContracts, functional: functionalRecipes.length, legacyStageBlocks: legacy.stageBlocks, legacyStageFiles: legacy.stageFilesWithRequests, legacyStageRequests: legacy.stageRequests, legacyLabBlocks: legacy.labBlocks, legacyLabFiles: legacy.labFilesWithRequests, legacyLabRequests: legacy.labRequests, duplicateIds: duplicateIds.slice(0, 10), absoluteSourceRefs: absoluteSourceRefs.length })}`);
  }
  const routeResult = buildCanonicalRoutes(recipes, sourceIndex);
  const routes = routeResult.routes;
  const needsReview = recipes.filter((recipe) => recipe.needsReview).map((recipe) => ({ id: recipe.id, items: recipe.needsReview }));
  return {
    version: 1,
    recipes,
    routes,
    validation: {
      sourceCounts: {
        boardEndpoints: facts.endpoints.length,
        courseApiContracts: COURSE_API_CONTRACTS.length,
        courseApiContractsMapped: mappedCourseContracts,
        functionalTasks: FUNCTIONAL_TASKS.length,
        functionalLikeTasks: FUNCTIONAL_LIKE_TASKS.length,
        legacyRequestBlocks: legacy.blocks,
        legacyRequestFiles: legacy.filesWithRequests,
        legacyStageRequestBlocks: legacy.stageBlocks,
        legacyStageRequestFiles: legacy.stageFilesWithRequests,
        legacyStageRequests: legacy.stageRequests,
        legacyLabRequestBlocks: legacy.labBlocks,
        legacyLabRequestFiles: legacy.labFilesWithRequests,
        legacyLabRequests: legacy.labRequests,
        legacyRequests: legacy.recipes.length,
        canonicalApiArchitectureRoutes: routeResult.canonicalBaseCount,
        mainRoutesAdded: routeResult.addedBeyondCanonical,
        caseOnlyRecipes: routeResult.caseOnlyCount,
        unmatchedCaseOnlyRecipes: routeResult.unmatchedCases,
        recipes: recipes.length,
        routes: routes.length,
        absoluteSourceRefs: absoluteSourceRefs.length,
      },
      duplicateRecipeIds: duplicateIds,
      invalidOrMissing: needsReview,
    },
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = buildApiContracts();
  const serialized = `${JSON.stringify(result, null, 2)}\n`;
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(OUT) || fs.readFileSync(OUT, 'utf8') !== serialized) throw new Error('service/api-contracts.json이 원본과 다릅니다. npm run build:service-recipes 실행');
    console.log(`API recipes OK: ${result.validation.sourceCounts.recipes} recipes / ${result.validation.sourceCounts.routes} routes`);
  } else {
    fs.writeFileSync(OUT, serialized);
    console.log(`generated service/api-contracts.json (${result.validation.sourceCounts.recipes} recipes / ${result.validation.sourceCounts.routes} routes)`);
  }
}
