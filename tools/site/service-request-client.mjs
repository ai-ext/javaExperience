import {buildServiceRequest, inspectServiceResponse, manualBindingDefinitions, resolveManualBindings} from './service-request-model.mjs';

const STORAGE_PREFIX = 'javaexperience.service.resources.v1';
const CONTRACT_STORAGE_PREFIX = 'javaexperience.service.contracts.v1';
const memoryContractDefinitions = new Map();

export function mountServiceRequestTools(doc, {fetchImpl, storage, contractStorage, clipboard, now} = {}) {
  const mounted = [];
  if (!doc?.querySelectorAll) return mounted;
  for (const root of doc.querySelectorAll('[data-srq-root]')) mounted.push(mountOne(root, {fetchImpl, storage, contractStorage, clipboard, now}));
  return mounted;
}

function mountOne(root, deps) {
  const doc = root.ownerDocument;
  const get = name => root.querySelector(`[data-srq-${name}]`);
  let recipes = [];
  try { recipes = JSON.parse(get('data')?.textContent ?? '[]'); } catch { recipes = []; }
  const store = deps.storage ?? safeSessionStorage(doc);
  const contractStore = deps.contractStorage ?? safeLocalStorage(doc);
  const runFetch = deps.fetchImpl ?? doc.defaultView?.fetch?.bind(doc.defaultView) ?? globalThis.fetch;
  const readNow = deps.now ?? (() => globalThis.performance?.now?.() ?? Date.now());
  let currentRecipe = null;
  let customRecipe = null;
  let activeCases = [];
  let pending = false;
  let editedAfterSend = false;
  let revision = 0;
  let lastRequest = null;

  const recipeSelect = get('recipe');
  const selectRecipe = () => {
    const index = Number(recipeSelect?.value ?? 0);
    currentRecipe = recipes[index] ?? null;
    customRecipe = null;
    fillRecipe(currentRecipe);
    editedAfterSend = false;
    revision++;
    restoreId();
    updateSendState();
  };

  // 준비 조건과 SQL은 안내이며, 브라우저가 DB를 읽거나 실행하지 않는다.
  function renderVerification(recipe) {
    const target = get('verification');
    if (!target) return;
    target.replaceChildren();
    const section = (title, values) => {
      if (!values?.length) return;
      const card = doc.createElement('section');
      const heading = doc.createElement('h4'); heading.textContent = title; card.append(heading);
      const ul = doc.createElement('ul');
      for (const value of values) { const li = doc.createElement('li'); li.textContent = typeof value === 'string' ? value : value.text || value.description || JSON.stringify(value); ul.append(li); }
      card.append(ul); target.append(card);
    };
    section('요청 전 준비', recipe.prepare);
    section('요청 뒤 확인', recipe.manualCheck);
    for (const check of recipe.manualDb || []) {
      const card = doc.createElement('section');
      const title = doc.createElement('h4'); title.textContent = check.title || 'DB 확인 SQL'; card.append(title);
      const pre = doc.createElement('pre'); pre.textContent = check.sql || ''; card.append(pre);
      const note = doc.createElement('p'); note.textContent = check.notes || '확인한 실제 ID로 별도 DB 클라이언트에서 실행하세요. 자동 실행하지 않습니다.'; card.append(note);
      target.append(card);
    }
    if (recipe.capture?.key) section('생성 ID로 사후 조회', [`응답에서 확인한 ${recipe.capture.key}를 같은 서버·프로젝트의 다음 조회 단계에서 이어 씁니다. 자동 완료로 기록하지 않습니다.`]);
    target.hidden = !target.children.length;
  }

  function fillRecipe(recipe) {
    let source = recipe ?? {};
    const bindingDefinition = loadBindingDefinition(source);
    if (source.binding?.key) {
      source = bindingDefinition
        ? {...source, method:bindingDefinition.method, path:bindingDefinition.path, bodyKind:'none', body:null,
          expected:{...source.expected, statuses:bindingDefinition.statuses, bodyMode:source.expected?.bodyMode ?? 'any', fields:bindingDefinition.fields},
          contractRegistered:true, userDefinedContract:true}
        : {...source, method:'', path:'', bodyKind:'none', body:null,
          expected:{...source.expected, statuses:[], bodyMode:source.expected?.bodyMode ?? 'any', fields:[]},
          contractRegistered:false, userDefinedContract:true};
      currentRecipe = source;
      get('bind-method').value = bindingDefinition?.method ?? '';
      get('bind-path').value = bindingDefinition?.path ?? '';
      get('bind-status').value = bindingDefinition?.statuses.join(', ') ?? '';
      get('bind-fields').value = bindingDefinition?.fields.join(', ') ?? '';
      const panel = get('register');
      if (panel) panel.open = !bindingDefinition;
      get('apply-binding').textContent = '계약 저장 후 사용';
    } else {
      currentRecipe = source;
      get('bind-method').value = ''; get('bind-path').value = ''; get('bind-status').value = ''; get('bind-fields').value = '';
      const panel = get('register'); if (panel) panel.open = !recipes.length;
      get('apply-binding').textContent = '입력한 계약 적용';
    }
    get('method').value = source.method ?? '';
    get('path').value = source.path ?? '';
    get('body-kind').value = ['none','json','text','multipart'].includes(source.bodyKind) ? source.bodyKind : 'none';
    get('body').value = source.binding?.key || source.body == null ? '' : typeof source.body === 'string' ? source.body : JSON.stringify(source.body, null, 2);
    get('query').value = JSON.stringify(source.query ?? {}, null, 2);
    const sourceHeaders = {...(source.headers ?? {})};
    let removedManagedHeader = false, removedAuthorization = false;
    for (const key of Object.keys(sourceHeaders)) {
      if (['origin','cookie','cookie2','host'].includes(key.toLowerCase()) || key.toLowerCase().startsWith('access-control-request-') || key.toLowerCase().startsWith('sec-') || key.toLowerCase().startsWith('proxy-')) { delete sourceHeaders[key]; removedManagedHeader = true; }
      else if (key.toLowerCase() === 'authorization') { delete sourceHeaders[key]; removedAuthorization = true; }
    }
    get('headers').value = JSON.stringify(sourceHeaders, null, 2);
    get('token').value = '';
    get('cookies').checked = source.credentials === 'include';
    updateCookieState();
    get('expected').textContent = expectedLabel(source);
    get('description').textContent = source.binding?.key && !source.contractRegistered
      ? '선택사항입니다. API 경로와 응답 계약은 확정된 사실이 아닙니다. 내 프로젝트에서 정한 값을 등록하고 원본 실습 fixture를 직접 입력하세요.'
      : source.binding?.key ? '내 프로젝트에서 정한 계약입니다. 요청 본문은 원본 실습의 fixture를 직접 입력하세요.'
        : source.description ?? source.expected?.description ?? '';
    activeCases = Array.isArray(source.examples) ? source.examples : Array.isArray(source.sourceCases) ? source.sourceCases : Array.isArray(source.choices) ? source.choices : [];
    get('example-row').hidden = activeCases.length === 0;
    get('example').innerHTML = activeCases.map((item,index)=>`<option value="${index}">${escapeHtml(item.label ?? item.title ?? `사례 ${index + 1}`)}</option>`).join('');
    const params = [...(source.path ?? '').matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map(match => match[1]);
    const resourceKey = params[0] ?? source.capture?.key ?? null;
    root.dataset.srqResourceKey = resourceKey ?? '';
    get('resource-row').hidden = !resourceKey;
    get('resource-label').textContent = resourceKey ? `이 ID는 ${source.project ?? root.dataset.srqProject ?? '현재 프로젝트'} 서버별 sessionStorage에만 보관합니다.` : '';
    get('path-params').innerHTML = params.filter(key => key !== resourceKey).map(key => `<label class="srq-field"><span>${escapeHtml(key)}</span><input data-srq-param="${escapeHtml(key)}" autocomplete="off"></label>`).join('');
    get('file').value = '';
    get('file-row').hidden = get('body-kind').value !== 'multipart';
    get('body').closest('.srq-body-field').hidden = get('body-kind').value === 'none';
    renderManualBindings(source);
    updateBodyLabel();
    get('result').hidden = false;
    get('actual-status').textContent = '미실행';
    get('duration').textContent = '—';
    get('response-headers').textContent = '';
    get('response-body').textContent = '요청을 보내면 실제 응답이 표시됩니다.';
    get('verdict').textContent = '';
    get('snapshot').textContent = '';
    renderVerification(source);
    get('status').textContent = source.binding?.key && !source.contractRegistered
      ? '선택사항의 API 계약이 아직 등록되지 않았습니다. 내 프로젝트에서 정한 method, 경로, 상태, JSON 응답 필드명을 입력해 주세요.'
      : removedManagedHeader || source.removedManagedHeader
      ? '계약에 브라우저 관리 헤더가 있어 편집 요청에서 제외했습니다. 실제 값은 개발자 도구 Network에서 확인하세요.'
      : removedAuthorization || source.requiresToken ? 'Authorization 원문은 기본 헤더에서 제외했습니다. 인증이 필요한 요청이면 token field에 직접 입력하세요.'
        : recipe ? '미실행' : '계약을 적용해 주세요.';
  }

  function renderManualBindings(recipe) {
    const panel = get('manual-bindings');
    const definitions = manualBindingDefinitions(recipe).filter(binding => !isAuthorizationBinding(binding));
    if (!panel) return;
    panel.hidden = definitions.length === 0;
    panel.innerHTML = definitions.length
      ? `<p class="srq-binding-intro">원문 요청의 template 값입니다. 앞 요청의 실제 응답 또는 seed/fixture에서 확인한 값을 직접 입력하세요. 자동 추출하거나 저장하지 않습니다.</p>${definitions.map(binding => `<label class="srq-field"><span>${escapeHtml(binding.name)}</span><input type="text" data-srq-manual-binding="${escapeHtml(binding.name)}" autocomplete="off"><small>${escapeHtml(manualBindingHint(binding))}</small></label>`).join('')}`
      : '';
  }

  function manualBindingValues() {
    return Object.fromEntries([...root.querySelectorAll('[data-srq-manual-binding]')].map(input => [input.dataset.srqManualBinding, input.value]));
  }

  function templateResolution() {
    const bodyKind = get('body-kind').value;
    let body = get('body').value;
    if (bodyKind === 'multipart') body = parseObject(body, 'Multipart fields');
    return resolveManualBindings({
      path:get('path').value,
      query:parseObject(get('query').value, 'Query parameter'),
      headers:parseObject(get('headers').value, 'Headers'),
      body,
      manualBindings:currentRecipe?.manualBindings,
      needsInput:currentRecipe?.needsInput,
    }, manualBindingValues(), {rawJsonBody:bodyKind === 'json'});
  }

  function updateBodyLabel() {
    const label = root.querySelector('[data-srq-body-label]');
    if (label) label.textContent = get('body-kind').value === 'multipart' ? 'Multipart 추가 필드 (JSON object)' : '요청 본문 (JSON 또는 text)';
  }

  function updateCookieState() {
    get('cookie-state').textContent = get('cookies').checked ? 'fetch credentials: include — 브라우저 쿠키 전송을 요청합니다.' : 'fetch credentials: omit — 브라우저 쿠키를 보내지 않습니다.';
  }

  function applyBinding() {
    const method = get('bind-method').value;
    const path = get('bind-path').value.trim();
    let definition;
    try { definition = validateBindingDefinition({method,path,statuses:get('bind-status').value,fields:get('bind-fields').value}); }
    catch (error) { get('status').textContent = error.message; return; }
    if (!currentRecipe?.binding?.key && (!method || !path || !definition.statuses.length)) {
      get('status').textContent = '요청 방식, /로 시작하는 경로, 기대 상태 코드를 먼저 입력해 주세요.';
      return;
    }
    const binding = currentRecipe?.binding;
    if (binding?.key) {
      const key = contractStorageKey(currentRecipe);
      if (!key) { get('status').textContent = '계약을 저장하려면 project와 binding key가 필요합니다.'; return; }
      const persisted = saveBindingDefinition(currentRecipe, definition);
      customRecipe = {...currentRecipe, method:definition.method, path:definition.path, bodyKind:get('body-kind').value, body:null,
        expected:{...currentRecipe.expected, statuses:definition.statuses, fields:definition.fields, bodyMode:currentRecipe.expected?.bodyMode ?? 'any'},
        contractRegistered:true, userDefinedContract:true};
      get('apply-binding').textContent = '계약 저장 후 사용';
      const panel = get('register'); if (panel) panel.open = false;
      get('expected').textContent = expectedLabel(customRecipe);
      get('description').textContent = '내 프로젝트에서 정한 계약입니다. 요청 본문은 원본 실습의 fixture를 직접 입력하세요.';
      get('status').textContent = persisted
        ? '계약 정의만 저장했습니다. 요청 본문과 Bearer 토큰은 저장하지 않았습니다. 요청은 보내지 않았습니다.'
        : '브라우저 저장소를 사용할 수 없어 계약 정의를 현재 문서의 메모리에만 유지합니다. 요청은 보내지 않았습니다.';
    } else {
      customRecipe = {id:`manual-${root.dataset.srqScope}`, project:root.dataset.srqProject || 'manual', method:definition.method, path:definition.path, bodyKind:get('body-kind').value, body:null, expected:{statuses:definition.statuses,bodyMode:'any',fields:definition.fields}, description:'내 프로젝트에서 정한 계약입니다.'};
    }
    currentRecipe = customRecipe;
    get('method').value = definition.method; get('path').value = definition.path;
    const params = [...definition.path.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map(match=>match[1]);
    const resourceKey = params[0] ?? null; root.dataset.srqResourceKey = resourceKey ?? '';
    get('resource-row').hidden = !resourceKey;
    get('resource-label').textContent = resourceKey ? '사용자가 선언한 자원 ID입니다. project와 서버별로 현재 세션에만 보관합니다.' : '';
    get('path-params').innerHTML = params.slice(1).map(key=>`<label class="srq-field"><span>${escapeHtml(key)}</span><input data-srq-param="${escapeHtml(key)}"></label>`).join('');
    if (!binding?.key) get('status').textContent = '내 프로젝트에서 정한 계약을 적용했습니다. 본문/토큰을 입력한 뒤 직접 요청하세요.';
    revision++; editedAfterSend = false; restoreId(); updateSendState();
  }

  function contractStorageKey(recipe) {
    const bindingKey = recipe?.binding?.key, project = projectFor(recipe);
    if (typeof bindingKey !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(bindingKey) || typeof project !== 'string' || !project.trim()) return '';
    return `${CONTRACT_STORAGE_PREFIX}:${encodeURIComponent(project)}:${encodeURIComponent(bindingKey)}`;
  }

  function loadBindingDefinition(recipe) {
    const key = contractStorageKey(recipe);
    if (!key) return null;
    try {
      const saved = contractStore?.getItem(key);
      if (saved) {
        const definition = validateStoredBindingDefinition(JSON.parse(saved));
        if (definition) { memoryContractDefinitions.set(key, definition); return definition; }
      }
    } catch {}
    return memoryContractDefinitions.get(key) ?? null;
  }

  function saveBindingDefinition(recipe, definition) {
    const key = contractStorageKey(recipe);
    if (!key) return false;
    memoryContractDefinitions.set(key, definition);
    try { if (!contractStore) return false; contractStore.setItem(key, JSON.stringify(definition)); return true; }
    catch { return false; }
  }

  function projectFor(recipe = currentRecipe) { return recipe?.project || root.dataset.srqProject || ''; }
  function storageKey(key, base, recipe = currentRecipe) {
    return `${STORAGE_PREFIX}:${encodeURIComponent(projectFor(recipe))}:${encodeURIComponent(base)}:${encodeURIComponent(key)}`;
  }
  function restoreId() {
    const key = root.dataset.srqResourceKey;
    const base = safeOrigin(get('base').value);
    if (!key || !base || !store) return;
    try { get('resource-id').value = store.getItem(storageKey(key, base)) ?? ''; } catch { get('resource-id').value = ''; }
  }

  function readSnapshot() {
    const sourceQuery = parseObject(get('query').value, 'Query parameter');
    const sourceHeaders = parseObject(get('headers').value, 'Headers');
    const bodyKind = get('body-kind').value;
    const sourceBody = bodyKind === 'multipart' ? parseObject(get('body').value, 'Multipart fields') : get('body').value;
    const resolution = resolveManualBindings({
      path:get('path').value, query:sourceQuery, headers:sourceHeaders, body:sourceBody,
      manualBindings:currentRecipe?.manualBindings, needsInput:currentRecipe?.needsInput,
    }, manualBindingValues(), {rawJsonBody:bodyKind === 'json'});
    if (resolution.missing.length) throw new Error(`template 입력이 필요합니다: ${resolution.missing.join(', ')}`);
    if (resolution.unresolved.length) throw new Error(`처리하지 않은 template이 남았습니다: ${resolution.unresolved.join(', ')}`);
    const query = resolution.recipe.query;
    const headers = resolution.recipe.headers;
    const multipartFields = bodyKind === 'multipart' ? resolution.recipe.body : {};
    const pathParams = Object.fromEntries([...root.querySelectorAll('[data-srq-param]')].map(input=>[input.dataset.srqParam,input.value]));
    const resourceKey = root.dataset.srqResourceKey;
    if (resourceKey) pathParams[resourceKey] = get('resource-id').value;
    const built = buildServiceRequest(currentRecipe, {
      base:get('base').value, method:get('method').value, path:resolution.recipe.path, pathParams,
      query, headers, bodyKind, bodyText:bodyKind === 'multipart' ? '' : resolution.recipe.body, fields:multipartFields, token:get('token').value,
      credentials:get('cookies').checked ? 'include' : 'omit',
      file:get('file').files?.[0], fieldName:get('file-field').value,
      FormDataImpl:doc.defaultView?.FormData ?? globalThis.FormData,
    });
    return {built, query, headers, pathParams, resourceKey, project:projectFor(), token:get('token').value, bodyText:bodyKind === 'multipart' ? '' : resolution.recipe.body,
      fileName:get('file').files?.[0]?.name ?? '', fileSize:get('file').files?.[0]?.size ?? 0, recipe:currentRecipe,
      recipeId:currentRecipe?.id ?? '', method:get('method').value, path:get('path').value, credentials:get('cookies').checked ? 'include' : 'omit',
      bodyKind, base:safeOrigin(get('base').value)};
  }

  function updateSendState() {
    if (!get('send')) return;
    const contractReady = Boolean(currentRecipe && (!currentRecipe.binding?.key || currentRecipe.contractRegistered));
    const complete = Boolean(contractReady && get('base').value.trim() && get('method').value && get('path').value.startsWith('/'));
    let missing = [], unresolved = [];
    try { ({missing, unresolved} = templateResolution()); } catch {}
    const authBinding = manualBindingDefinitions(currentRecipe).some(isAuthorizationBinding);
    const tokenMissing = Boolean((currentRecipe?.requiresToken || authBinding) && !get('token').value.trim());
    const blockedByInput = missing.length > 0 || unresolved.length > 0 || tokenMissing;
    get('send').disabled = pending || !complete || blockedByInput;
    if (!pending && blockedByInput) {
      get('status').textContent = missing.length
        ? `먼저 입력하세요: ${missing.join(', ')}. 앞 요청의 실제 응답 또는 seed/fixture에서 확인해 주세요.`
        : unresolved.length
          ? `처리되지 않은 template이 있어 전송할 수 없습니다: ${unresolved.join(', ')}`
          : '이 요청은 인증이 필요합니다. token field에 Bearer 토큰을 직접 입력하세요.';
    } else if (!pending && /^(먼저 입력하세요:|처리되지 않은 template이 있어 전송할 수 없습니다:|이 요청은 인증이 필요합니다\.)/.test(get('status').textContent)) {
      get('status').textContent = '미실행';
    }
  }

  async function sendRequest() {
    let snapshot;
    try { snapshot = readSnapshot(); }
    catch (error) { get('status').textContent = `요청을 만들 수 없습니다: ${error.message}`; return; }
    if (typeof runFetch !== 'function') { get('status').textContent = '이 브라우저에서 fetch를 사용할 수 없습니다.'; return; }
    const sentRevision = revision;
    editedAfterSend = false; pending = true; updateSendState();
    const started = readNow();
    lastRequest = {url:snapshot.built.url, method:snapshot.method, headers:snapshot.built.init.headers, body:snapshot.bodyText, bodyKind:snapshot.bodyKind, built:snapshot.built};
    updateCurl();
    get('status').textContent = '전송 중 — 입력이 바뀌면 응답은 전송 시점 snapshot으로 표시됩니다.';
    try {
      const response = await runFetch(snapshot.built.url, snapshot.built.init);
      const body = await response.text();
      const duration = Math.max(0, readNow() - started);
      const responseHeaders = Object.fromEntries(response.headers?.entries?.() ?? []);
      const analysis = inspectServiceResponse(snapshot.recipe, {status:response.status, body, headers:response.headers ?? responseHeaders, requestUrl:snapshot.built.url});
      const unchanged = revision === sentRevision && !editedAfterSend && snapshot.base === safeOrigin(get('base').value) && snapshot.project === projectFor();
      const accepted = normalFailureText(snapshot.recipe, response.status);
      get('result').hidden = false;
      get('actual-status').textContent = String(response.status);
      get('duration').textContent = `${duration.toFixed(1)} ms`;
      get('verdict').textContent = `${accepted} ${analysis.note}`;
      get('response-headers').textContent = JSON.stringify(responseHeaders, null, 2);
      get('response-body').textContent = body;
      get('snapshot').textContent = unchanged
        ? `전송 snapshot: ${snapshot.method} ${snapshot.built.url}`
        : `전송 snapshot의 응답입니다. 전송 뒤 입력이 변경되어 현재 폼에 결과/ID를 연결하지 않았습니다. 요청 당시: ${snapshot.method} ${snapshot.built.url}`;
      get('status').textContent = unchanged ? '요청 완료 — 실제 응답을 확인하세요.' : '이전 입력 snapshot의 응답 도착 — 현재 입력과 분리했습니다.';
      if (analysis.resourceId && unchanged && snapshot.resourceKey) {
        if (store) { try { store.setItem(storageKey(snapshot.resourceKey, snapshot.base), analysis.resourceId); } catch {} }
        if (snapshot.resourceKey === [...(snapshot.path.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g))].map(m=>m[1])[0] || snapshot.recipe?.capture?.key) get('resource-id').value = analysis.resourceId;
        get('status').textContent = `요청 완료 — 선언된 ${snapshot.resourceKey}=${analysis.resourceId}를 현재 project/server 세션에 연결했습니다.`;
      } else if (!analysis.resourceId && unchanged && snapshot.resourceKey && snapshot.method === 'POST' && analysis.statusMatches && analysis.bodyMatches && snapshot.recipe?.capture?.key === snapshot.resourceKey) {
        if (store) { try { store.removeItem(storageKey(snapshot.resourceKey, snapshot.base, snapshot.recipe)); } catch {} }
        get('resource-id').value = '';
        get('status').textContent = `요청은 성공했지만 생성 ID를 확인하지 못해 이 project/server의 기존 ${snapshot.resourceKey} 값을 지웠습니다. 다른 서버와 project의 ID는 유지했습니다.`;
      }
    } catch (error) {
      const fileProtocol = doc.location?.protocol === 'file:';
      get('result').hidden = false;
      get('actual-status').textContent = '응답 없음'; get('duration').textContent = `${Math.max(0, readNow() - started).toFixed(1)} ms`;
      get('verdict').textContent = `브라우저에서 HTTP 상태와 본문을 읽지 못했습니다. ${fileProtocol ? '문서를 file://로 열었으므로 HTTP 문서 서버로 다시 열어 주세요. ' : ''}CORS 정책 또는 서버 연결을 확인하세요. 요청 실패를 성공으로 판정하지 않습니다.`;
      get('response-headers').textContent = '읽을 수 없음'; get('response-body').textContent = String(error?.message ?? error);
      get('snapshot').textContent = `실패한 전송 snapshot: ${snapshot.method} ${snapshot.built.url}`;
      get('status').textContent = '요청 결과를 읽지 못했습니다.';
    } finally { pending = false; updateSendState(); }
  }

  function updateCurl() {
    try {
      const snapshot = lastRequest ?? readSnapshot();
      const parts = ['curl', '-i', '-X', shellQuote(snapshot.method)];
      for (const [key,value] of Object.entries(snapshot.built?.init?.headers ?? snapshot.headers ?? {})) {
        if (key.toLowerCase() === 'authorization' && !get('curl-token').checked) continue;
        parts.push('-H', shellQuote(`${key}: ${value}`));
      }
      const body = snapshot.body ?? snapshot.built?.init?.body;
      if (body && typeof body === 'string' && snapshot.bodyKind !== 'multipart') parts.push('--data-raw', shellQuote(body));
      if (snapshot.bodyKind === 'multipart') {
        const fields = parseObject(snapshot.body, 'Multipart fields');
        for (const [key,value] of Object.entries(fields)) for (const item of Array.isArray(value) ? value : [value]) parts.push('-F', shellQuote(`${key}=${item}`));
        parts.push('-F', shellQuote(`${get('file-field').value}=@<파일경로>`));
      }
      parts.push(shellQuote(snapshot.url ?? snapshot.built.url));
      get('curl').value = parts.join(' ');
    } catch (error) { get('curl').value = `# ${error.message}`; }
  }

  async function copyCurl() {
    updateCurl();
    const value = get('curl').value;
    try {
      const writer = deps.clipboard?.writeText?.bind(deps.clipboard) ?? doc.defaultView?.navigator?.clipboard?.writeText?.bind(doc.defaultView.navigator.clipboard);
      if (writer) { await writer(value); get('status').textContent = 'curl 명령을 복사했습니다.'; return; }
      get('curl').focus(); get('curl').select();
      const copied = doc.execCommand?.('copy');
      get('status').textContent = copied ? 'curl 명령을 복사했습니다.' : '명령을 선택했습니다. 수동으로 복사해 주세요.';
    } catch { get('curl').focus(); get('curl').select(); get('status').textContent = '자동 복사에 실패했습니다. 선택된 명령을 수동으로 복사해 주세요.'; }
  }

  function saveManualId() {
    const key = root.dataset.srqResourceKey, id = get('resource-id').value.trim(), base = safeOrigin(get('base').value);
    if (!key || !base || !store) return;
    try {
      if (/^[1-9][0-9]*$/.test(id)) store.setItem(storageKey(key, base), id);
      else store.removeItem(storageKey(key, base));
    } catch {}
  }

  recipeSelect?.addEventListener('change', selectRecipe);
  get('example')?.addEventListener('change', () => {
    const example = activeCases[Number(get('example').value)];
    if (!example) return;
    if (example.body !== undefined) get('body').value = typeof example.body === 'string' ? example.body : JSON.stringify(example.body, null, 2);
    if (example.bodyKind) get('body-kind').value = example.bodyKind;
    if (example.query) get('query').value = JSON.stringify(example.query, null, 2);
    if (example.headers) get('headers').value = JSON.stringify(example.headers, null, 2);
    get('body').closest('.srq-body-field').hidden = get('body-kind').value === 'none'; get('file-row').hidden = get('body-kind').value !== 'multipart'; updateBodyLabel();
    revision++; editedAfterSend = pending || editedAfterSend; updateSendState();
    get('status').textContent = 'Source 사례의 요청 입력을 적용했습니다. 전송은 직접 눌러야 합니다.';
  });
  get('apply-binding')?.addEventListener('click', applyBinding);
  get('send')?.addEventListener('click', sendRequest);
  get('copy-curl')?.addEventListener('click', copyCurl);
  get('clear-id')?.addEventListener('click', () => { const key=root.dataset.srqResourceKey,base=safeOrigin(get('base').value); if(key&&base&&store)try{store.removeItem(storageKey(key,base));}catch{} get('resource-id').value=''; revision++; });
  get('body-kind')?.addEventListener('change', () => { get('body').closest('.srq-body-field').hidden = get('body-kind').value === 'none'; get('file-row').hidden = get('body-kind').value !== 'multipart'; updateBodyLabel(); });
  get('base')?.addEventListener('change', () => { restoreId(); revision++; editedAfterSend=true; updateSendState(); updateCurl(); });
  get('resource-id')?.addEventListener('change', saveManualId);
  get('curl-token')?.addEventListener('change', updateCurl);
  get('cookies')?.addEventListener('change', () => { updateCookieState(); revision++; if (pending) editedAfterSend=true; updateSendState(); updateCurl(); });
  for (const eventName of ['input','change']) root.addEventListener(eventName, event => {
    if (event.target.matches('[data-srq-send],[data-srq-copy-curl],[data-srq-apply-binding],[data-srq-clear-id],[data-srq-recipe]')) return;
    revision++; if (pending) { editedAfterSend = true; get('status').textContent = '전송 뒤 입력 변경됨 — 응답은 이전 snapshot에만 연결됩니다.'; }
    updateSendState(); if (event.target.matches('[data-srq-method],[data-srq-path],[data-srq-body-kind],[data-srq-query],[data-srq-headers],[data-srq-token],[data-srq-manual-binding]')) updateCurl();
  });
  if (recipes.length) selectRecipe(); else { fillRecipe(null); }
  updateSendState(); updateCurl();
  return {root, sendRequest, applyBinding, get currentRecipe(){return currentRecipe;}};
}

function expectedLabel(recipe) {
  if (!recipe) return 'API를 직접 등록해 주세요.';
  if (recipe.userDefinedContract && !recipe.contractRegistered) return '내 프로젝트에서 정한 계약 · 아직 등록하지 않았습니다.';
  const statuses = recipe.expected?.statuses ?? (recipe.expectedStatus ? [recipe.expectedStatus] : []);
  const fields = recipe.expected?.bodyMode !== 'empty' && recipe.expected?.fields?.length ? ` · 필수 필드 ${recipe.expected.fields.join(', ')}` : '';
  const failures = recipe.failures ?? recipe.expected?.failures ?? [];
  const failureStatuses = [...new Set(failures.flatMap(item=>item.statuses ?? [item.status]).filter(Number.isInteger))];
  const failureLabel = failureStatuses.length ? ` · 기획한 실패 ${failureStatuses.join(', ')}` : '';
  const contractLabel = recipe.userDefinedContract ? '내 프로젝트에서 정한 계약 · ' : '';
  return `${contractLabel}${recipe.method ?? '미입력'} ${recipe.path ?? '경로 미입력'} · 기대 HTTP ${statuses.length ? statuses.join(' 또는 ') : '미등록'} · 본문 ${recipe.expected?.bodyMode ?? '미등록'}${fields}${failureLabel}`;
}

function normalFailureText(recipe, status) {
  const normal = recipe?.expected?.statuses ?? (recipe?.expectedStatus ? [recipe.expectedStatus] : []);
  const declaredFailures = recipe?.failures ?? recipe?.expected?.failures ?? [];
  const failure = declaredFailures.find(item => (item.statuses ?? [item.status]).includes(Number(status)));
  if (failure) {
    const when = failure.when ?? failure.description ?? `HTTP ${status}`;
    const result = failure.result ? ` 결과: ${failure.result}.` : '';
    const unchanged = failure.unchanged ? ` 유지되어야 할 값: ${failure.unchanged}.` : '';
    return `기획한 실패 응답: ${when}.${result}${unchanged}`;
  }
  if (normal.includes(Number(status))) return '기획한 정상 범위의 HTTP 상태입니다.';
  return '기획상 실패/미등록 HTTP 상태입니다.';
}

function parseObject(value, label) {
  let parsed;
  try { parsed = JSON.parse(value || '{}'); } catch { throw new Error(`${label}는 JSON object여야 합니다.`); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(`${label}는 JSON object여야 합니다.`);
  return parsed;
}

function validateBindingDefinition({method, path, statuses, fields}) {
  const normalizedMethod = String(method ?? '').trim().toUpperCase();
  if (!['GET','HEAD','POST','PUT','PATCH','DELETE','OPTIONS'].includes(normalizedMethod)) throw new Error('요청 방식(HTTP 메서드)을 선택해 주세요.');
  const normalizedPath = String(path ?? '').trim();
  if (!normalizedPath.startsWith('/') || normalizedPath.startsWith('//') || /[?#\\\s\u0000-\u001f]/.test(normalizedPath) || normalizedPath.split('/').some(part=>part==='.'||part==='..')) {
    throw new Error('경로는 query/fragment 없는 /상대경로로 입력해 주세요. 절대 URL과 // 경로는 저장할 수 없습니다.');
  }
  const pathWithoutVars = normalizedPath.replace(/\{[A-Za-z][A-Za-z0-9_]*\}/g,'');
  if (/[{}]/.test(pathWithoutVars)) throw new Error('경로 변수는 {name} 형식으로 입력해 주세요.');
  const statusValues = Array.isArray(statuses) ? statuses : String(statuses ?? '').split(',').map(value=>value.trim());
  const normalizedStatuses = statusValues.map(value=>Number(value));
  if (!normalizedStatuses.length || normalizedStatuses.some((value,index)=>!Number.isInteger(value)||value<100||value>599||String(value)!==String(statusValues[index]).trim())) {
    throw new Error('기대 상태 코드는 100~599 숫자로 입력해 주세요.');
  }
  const fieldValues = Array.isArray(fields) ? fields : String(fields ?? '').split(',').map(value=>value.trim()).filter(Boolean);
  const fieldPattern = /^[A-Za-z_$][A-Za-z0-9_$]*(\.[A-Za-z_$][A-Za-z0-9_$]*)*$/;
  if (fieldValues.some(value=>typeof value!=='string'||!fieldPattern.test(value)||value.split('.').some(part=>['__proto__','constructor','prototype'].includes(part)))) {
    throw new Error('JSON 응답 필드는 안전한 점 구분 이름으로 입력해 주세요.');
  }
  return {method:normalizedMethod,path:normalizedPath,statuses:[...new Set(normalizedStatuses)],fields:[...new Set(fieldValues)]};
}

function validateStoredBindingDefinition(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const allowed = new Set(['method','path','statuses','fields']);
  if (Object.keys(value).some(key=>!allowed.has(key))) return null;
  try { return validateBindingDefinition(value); } catch { return null; }
}

function safeSessionStorage(doc) { try { return doc.defaultView?.sessionStorage ?? null; } catch { return null; } }
function safeLocalStorage(doc) { try { return doc.defaultView?.localStorage ?? null; } catch { return null; } }
function safeOrigin(value) { try { const url = new URL(value); return ['http:','https:'].includes(url.protocol) && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash ? url.origin : ''; } catch { return ''; } }
function shellQuote(value) { return `'${String(value).replace(/'/g, `'\\''`)}'`; }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])); }
function isAuthorizationBinding(binding) { return /(?:^|\.)header\.authorization$/i.test(binding.name) || /header\.authorization/i.test(binding.expression); }
function manualBindingHint(binding) {
  if (/\.body\.id$/i.test(binding.name)) return '앞 요청의 실제 응답에서 확인한 ID 또는 이 과제의 seed/fixture ID를 입력하세요. 원문 ID 형식을 유지합니다.';
  return '원문이 가리키는 앞 요청의 실제 응답 또는 seed/fixture 값을 확인해 직접 입력하세요.';
}
