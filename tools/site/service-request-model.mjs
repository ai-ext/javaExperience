import {normalizeApiBase} from './course-api-contracts.mjs';

const HTTP_METHODS = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);

export function buildServiceRequest(recipe, options = {}) {
  if (!recipe || typeof recipe !== 'object') throw new Error('요청 계약을 확인할 수 없습니다.');
  const checkHeaders = {...(options.headers ?? recipe.headers ?? {})};
  if (options.token?.trim()) deleteHeader(checkHeaders, 'authorization');
  assertNoUnresolvedTemplates({
    path: options.path ?? recipe.path,
    query: options.query ?? recipe.query,
    headers: checkHeaders,
    body: (options.bodyKind ?? recipe.bodyKind) === 'multipart' ? options.fields : options.bodyText ?? recipe.body,
  });
  const base = normalizeApiBase(options.base);
  const method = String(options.method ?? recipe.method ?? '').toUpperCase();
  if (!HTTP_METHODS.has(method)) throw new Error('HTTP method를 확인해 주세요.');
  const path = resolvePath(options.path ?? recipe.path, options.pathParams ?? {});
  const url = new URL(path, `${base}/`);
  if (url.origin !== base || url.username || url.password) throw new Error('요청 경로는 입력한 서버의 같은 origin이어야 합니다.');
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value != null && String(value) !== '') url.searchParams.set(key, String(value));
  }
  const headers = normalizeHeaders(options.headers);
  if (options.token?.trim()) {
    deleteHeader(headers, 'authorization');
    headers.Authorization = `Bearer ${options.token.trim()}`;
  }
  const bodyKind = options.bodyKind ?? recipe.bodyKind ?? 'none';
  const credentials = options.credentials ?? recipe.credentials ?? 'omit';
  if (!['omit', 'include'].includes(credentials)) throw new Error('쿠키 전송 설정은 omit 또는 include여야 합니다.');
  const init = {method, headers, credentials};
  if (bodyKind === 'json') {
    const raw = options.bodyText ?? (recipe.body == null ? '' : JSON.stringify(recipe.body, null, 2));
    setHeaderIfAbsent(headers, 'Content-Type', 'application/json');
    init.body = raw;
  } else if (bodyKind === 'text') {
    init.body = options.bodyText ?? String(recipe.body ?? '');
    setHeaderIfAbsent(headers, 'Content-Type', 'text/plain;charset=UTF-8');
  } else if (bodyKind === 'multipart') {
    const FormDataImpl = options.FormDataImpl ?? globalThis.FormData;
    if (!FormDataImpl) throw new Error('이 브라우저는 multipart 전송을 지원하지 않습니다.');
    const form = new FormDataImpl();
    for (const [key, value] of Object.entries(options.fields ?? {})) {
      for (const item of Array.isArray(value) ? value : [value]) form.append(key, String(item));
    }
    if (options.file) form.append(options.fieldName || 'file', options.file, options.file.name);
    deleteHeader(headers, 'content-type');
    init.body = form;
  } else if (bodyKind !== 'none') {
    throw new Error('요청 본문 유형을 확인해 주세요.');
  }
  return {url: url.href, init, bodyKind};
}

export function manualBindingDefinitions(recipe) {
  const bindings = Array.isArray(recipe?.manualBindings) ? recipe.manualBindings : [];
  const definitions = new Map();
  for (const binding of bindings) {
    const expression = normalizeExpression(binding?.expression ?? binding?.sourceExpression, binding?.name);
    const name = String(binding?.name ?? expressionName(expression));
    if (!expression || !name) continue;
    const locations = normalizeLocations(binding?.locations ?? binding?.location);
    definitions.set(name, {name, expression, locations});
  }
  for (const rawName of Array.isArray(recipe?.needsInput) ? recipe.needsInput : []) {
    const name = typeof rawName === 'string' ? rawName : String(rawName?.name ?? '');
    if (!name || definitions.has(name)) continue;
    const expression = normalizeExpression(rawName?.expression, name);
    definitions.set(name, {name, expression, locations: findExpressionLocations(recipe, expression)});
  }
  return [...definitions.values()];
}

export function resolveManualBindings(recipe, values = {}, {rawJsonBody = false} = {}) {
  const resolved = {...recipe};
  const missing = [];
  for (const definition of manualBindingDefinitions(recipe)) {
    if (isAuthorizationBinding(definition)) continue;
    const value = values[definition.name] ?? values[definition.expression];
    if (value == null || String(value).trim() === '') { missing.push(definition.name); continue; }
    const replacement = String(value);
    for (const location of definition.locations) {
      if (location === 'path' && typeof resolved.path === 'string') resolved.path = replaceExpression(resolved.path, definition.expression, replacement);
      if (location === 'query') resolved.query = replaceInValue(resolved.query, definition.expression, replacement);
      if (location === 'headers') resolved.headers = replaceInValue(resolved.headers, definition.expression, replacement);
      if (location === 'body') resolved.body = rawJsonBody && typeof resolved.body === 'string'
        ? replaceRawJsonString(resolved.body, definition.expression, replacement)
        : replaceInValue(resolved.body, definition.expression, replacement);
    }
  }
  return {recipe: resolved, missing, unresolved: findUnresolvedTemplates({path:resolved.path, query:resolved.query, headers:resolved.headers, body:resolved.body})};
}

function normalizeExpression(value, name) {
  const raw = String(value ?? '').trim() || (name ? `{{${name}}}` : '');
  if (/^\{\{[^{}]+\}\}$/.test(raw)) return raw;
  return /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/.test(raw) ? `{{${raw}}}` : '';
}

function expressionName(expression) { return /^\{\{([^{}]+)\}\}$/.exec(expression ?? '')?.[1] ?? ''; }
function normalizeLocations(value) {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  const aliases = {header:'headers', headers:'headers', body:'body', json:'body', path:'path', query:'query'};
  return [...new Set(values.map(item => aliases[String(item).toLowerCase()]).filter(Boolean))];
}
function isAuthorizationBinding(binding) { return /(?:^|\.)header\.authorization$/i.test(binding.name) || /header\.authorization/i.test(binding.expression); }
function findExpressionLocations(recipe, expression) {
  const locations = [];
  if (containsExpression(recipe?.path, expression)) locations.push('path');
  if (containsExpression(recipe?.query, expression)) locations.push('query');
  if (containsExpression(recipe?.headers, expression)) locations.push('headers');
  if (containsExpression(recipe?.body, expression)) locations.push('body');
  return locations;
}
function containsExpression(value, expression) {
  if (typeof value === 'string') return value.includes(expression);
  if (Array.isArray(value)) return value.some(item => containsExpression(item, expression));
  if (value && typeof value === 'object') return Object.values(value).some(item => containsExpression(item, expression));
  return false;
}
function replaceExpression(value, expression, replacement) { return value.split(expression).join(replacement); }
function replaceRawJsonString(value, expression, replacement) { return replaceExpression(value, expression, JSON.stringify(replacement).slice(1, -1)); }
function replaceInValue(value, expression, replacement) {
  if (typeof value === 'string') return replaceExpression(value, expression, replacement);
  if (Array.isArray(value)) return value.map(item => replaceInValue(item, expression, replacement));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, replaceInValue(item, expression, replacement)]));
  return value;
}
function findUnresolvedTemplates(value, result = new Set()) {
  if (typeof value === 'string') for (const match of value.matchAll(/\{\{([^{}]+)\}\}/g)) result.add(match[1]);
  else if (Array.isArray(value)) for (const item of value) findUnresolvedTemplates(item, result);
  else if (value && typeof value === 'object') for (const item of Object.values(value)) findUnresolvedTemplates(item, result);
  return [...result];
}
function assertNoUnresolvedTemplates(value) {
  const unresolved = findUnresolvedTemplates(value);
  if (unresolved.length) throw new Error(`템플릿 변수를 먼저 입력해 주세요: ${unresolved.join(', ')}`);
}

function resolvePath(pathValue, params) {
  if (typeof pathValue !== 'string' || !pathValue.startsWith('/') || pathValue.startsWith('//')) throw new Error('경로는 /로 시작하는 상대 경로여야 합니다.');
  const path = pathValue.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (_, key) => {
    const value = params[key];
    if (value == null || String(value) === '') throw new Error(`${key} 값을 입력해 주세요.`);
    if (/(?:^id$|id$)/i.test(key) && !/^(?:[1-9][0-9]*|[A-Za-z][A-Za-z0-9._:-]{0,127})$/.test(String(value))) throw new Error(`${key}는 0으로 시작하지 않는 양의 정수 ID 또는 안전한 자원 ID 문자열이어야 합니다.`);
    return encodeURIComponent(String(value));
  });
  if (/[{}]/.test(path)) throw new Error('경로의 변수 값을 확인해 주세요.');
  return path;
}

function normalizeHeaders(input) {
  const result = {};
  for (const [key, value] of Object.entries(input ?? {})) {
    if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(key) || /[\r\n]/.test(String(value))) throw new Error('헤더 이름 또는 값을 확인해 주세요.');
    if (isBrowserManagedHeader(key)) throw new Error(`${key}는 브라우저가 관리하는 헤더라 요청 도구에서 직접 설정할 수 없습니다. 실제 값은 개발자 도구 Network에서 확인해 주세요.`);
    if (String(value) !== '') result[key] = String(value);
  }
  return result;
}

function isBrowserManagedHeader(name) {
  const lower = name.toLowerCase();
  return ['origin','cookie','cookie2','host','jsessionid'].includes(lower)
    || lower.startsWith('access-control-request-')
    || lower.startsWith('sec-')
    || lower.startsWith('proxy-');
}

function deleteHeader(headers, target) {
  for (const key of Object.keys(headers)) if (key.toLowerCase() === target) delete headers[key];
}

function setHeaderIfAbsent(headers, name, value) {
  if (!Object.keys(headers).some(key => key.toLowerCase() === name.toLowerCase())) headers[name] = value;
}

export function inspectServiceResponse(recipe, response = {}) {
  const expected = recipe?.expected ?? {};
  const statusMatches = Array.isArray(expected.statuses) && expected.statuses.includes(Number(response.status));
  let parsed;
  let parseError = false;
  if (typeof response.body === 'string' && response.body.trim()) {
    try { parsed = JSON.parse(response.body); } catch { parseError = true; }
  } else if (response.body && typeof response.body === 'object') parsed = response.body;
  const bodyMode = expected.bodyMode ?? 'any';
  let bodyMatches = false;
  if (bodyMode === 'empty') bodyMatches = response.body == null || String(response.body).trim() === '';
  else if (bodyMode === 'json') bodyMatches = !parseError && parsed !== undefined;
  else if (bodyMode === 'text') bodyMatches = typeof response.body === 'string';
  else if (bodyMode === 'any') bodyMatches = true;
  // 빈 본문 계약의 생성 ID는 JSON 필드가 아니라 선언된 Location에서 확인한다.
  const requiredFields = bodyMode === 'empty' ? [] : expected.fields ?? [];
  const fieldsMatch = !requiredFields.length || (parsed && typeof parsed === 'object' && requiredFields.every(field => hasJsonPath(parsed, field)));
  const resourceId = statusMatches && bodyMatches && fieldsMatch ? captureDeclaredResourceId(recipe, response) : null;
  const expectedStatusText = Array.isArray(expected.statuses) ? expected.statuses.join(' 또는 ') : '미등록';
  const note = !statusMatches
    ? `기획상 기대 상태 ${expectedStatusText}, 실제 HTTP 상태 ${response.status ?? '확인 불가'}입니다.`
    : !bodyMatches || !fieldsMatch
      ? '상태는 기대 범위입니다. 본문 형식/필드가 기획과 다른지 실제 원문을 확인해 주세요.'
      : '기획상 상태와 본문 조건을 확인했습니다. 이 결과는 학습 과제 자동 채점이 아닙니다.';
  return {statusMatches, bodyMatches: bodyMatches && fieldsMatch, parseError, resourceId, note};
}

export function captureDeclaredResourceId(recipe, response = {}) {
  const capture = recipe?.capture;
  if (!capture || typeof capture.key !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(capture.key)) return null;
  if (capture.locationPattern) {
    const location = getHeader(response.headers, 'location');
    if (!location || !response.requestUrl) return null;
    try {
      const request = new URL(response.requestUrl);
      const target = new URL(location, request);
      if (target.origin !== request.origin || target.search || target.hash) return null;
      const pattern = String(capture.locationPattern);
      const escaped = pattern.split(/(\{[A-Za-z][A-Za-z0-9_]*\})/).map(part => {
        const placeholder = /^\{([A-Za-z][A-Za-z0-9_]*)\}$/.exec(part);
        if (placeholder) return placeholder[1] === capture.key ? '([1-9][0-9]*)' : '[^/]+';
        return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }).join('');
      const match = new RegExp(`^${escaped}$`).exec(target.pathname);
      return match ? validResourceId(match[1]) : null;
    } catch { return null; }
  }
  if (capture.jsonPath) {
    let value;
    try { value = readJsonPath(typeof response.body === 'string' ? JSON.parse(response.body) : response.body, capture.jsonPath); } catch { return null; }
    return validResourceId(value);
  }
  return null;
}

function getHeader(headers, name) {
  if (headers?.get) return headers.get(name);
  const key = Object.keys(headers ?? {}).find(item => item.toLowerCase() === name);
  return key ? headers[key] : null;
}

function readJsonPath(object, path) {
  if (typeof path !== 'string' || !/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(path)) return null;
  let value = object;
  for (const key of path.split('.')) {
    if (value == null || typeof value !== 'object' || !Object.hasOwn(value, key)) return null;
    value = value[key];
  }
  return value;
}

function hasJsonPath(object, path) {
  if (typeof path !== 'string' || !/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(path)) return false;
  let value = object;
  for (const key of path.split('.')) {
    if (value == null || typeof value !== 'object' || !Object.hasOwn(value, key)) return false;
    value = value[key];
  }
  return true;
}

function validResourceId(value) {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value > 0 ? String(value) : null;
  return typeof value === 'string' && /^(?:[1-9][0-9]*|[A-Za-z][A-Za-z0-9._:-]{0,127})$/.test(value) ? value : null;
}
