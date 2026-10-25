import { COURSE_API_CONTRACTS, evaluateApiResponse, makeRequest, normalizeApiBase } from './course-api-contracts.mjs';

const STORAGE_KEY = 'javaexperience.course.api-context.v1';
const mounted = new WeakSet();
const documentStates = new WeakMap();

const positiveId = (value) => typeof value === 'string' && /^[1-9][0-9]*$/.test(value);
const select = (root, name) => root.querySelector(`[data-ca-${name}]`);
const setText = (root, name, value) => { const node = select(root, name); if (node) node.textContent = value; };
const safeContext = (value) => {
  if (!value || value.version !== 1 || typeof value.base !== 'string' || !positiveId(value.id) || !['location', 'manual'].includes(value.provenance)) return false;
  try { return normalizeApiBase(value.base) === value.base; } catch { return false; }
};
const quote = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`;

function readStorage(storage) {
  try {
    const value = JSON.parse(storage?.getItem(STORAGE_KEY) || 'null');
    return safeContext(value) ? value : null;
  } catch { return null; }
}

function mountCourseApiTools(doc, { fetchImpl, storage, clipboard } = {}) {
  if (!doc?.querySelectorAll) return;
  const view = doc.defaultView;
  const sendFetch = fetchImpl || view?.fetch?.bind(view);
  let store;
  try { store = storage !== undefined ? storage : view?.sessionStorage; } catch { store = null; }
  const clip = clipboard || view?.navigator?.clipboard;
  let state = documentStates.get(doc);
  if (!state) { state = { roots: new Set(), context: null }; documentStates.set(doc, state); }
  for (const existing of state.roots) if (!existing.isConnected) state.roots.delete(existing);
  if (state.roots.size === 0) state.context = null;
  const roots = state.roots;
  const docRoots = [...doc.querySelectorAll('[data-ca-root]')];
  for (const root of docRoots) {
    if (mounted.has(root)) continue;
    mounted.add(root); roots.add(root);
    let data = {};
    try { data = JSON.parse(select(root, 'data')?.textContent || '{}'); } catch {}
    const contracts = (data.contractIds || []).map(id => COURSE_API_CONTRACTS.find(c => c.id === id)).filter(Boolean);
    let contract = contracts[0];
    const drafts = new Map();
    let pending = false;
    const form = select(root, 'form');
    const get = key => select(root, key)?.value ?? '';
    const syncContextLabel = () => {
      const saved = state.context && state.context.base === safeOrigin(get('base')) && state.context.id === get('id') ? state.context : null;
      setText(root, 'context', saved ? (saved.provenance === 'manual' ? `수동 연결 id ${saved.id} · 사용자가 직접 입력한 id·서버 존재 확인 아님` : `생성 응답 Location에서 확인한 id ${saved.id}`) : '연결한 글 id 없음');
    };
    const storageNotice = message => setText(root, 'storage', message);
    const safeOrigin = value => { try { return normalizeApiBase(value); } catch { return null; } };
    const propagate = (record, clear = false) => {
      for (const other of roots) {
        if (!other.isConnected) { roots.delete(other); continue; }
        const otherBase = safeOrigin(select(other, 'base')?.value || '');
        const otherId = select(other, 'id');
        if (otherBase === record.base && (!otherId?.value || (clear && otherId.value === record.id))) {
          otherId.value = clear ? '' : record.id;
          otherId?.dispatchEvent(new view.Event('input', { bubbles: true }));
        }
      }
    };
    const saveContext = (record, remove = false) => {
      state.context = remove ? null : record;
      if (!store) {
        storageNotice(remove
          ? '브라우저 저장소를 사용할 수 없어 연결 정보는 이 화면이 열린 동안에만 해제됩니다.'
          : '브라우저 저장소를 사용할 수 없어 연결 정보는 이 화면이 열린 동안에만 유지됩니다.');
      } else {
        try {
          if (remove) store.removeItem(STORAGE_KEY);
          else store.setItem(STORAGE_KEY, JSON.stringify(record));
          storageNotice('');
        } catch {
          storageNotice(remove
            ? '브라우저 저장소를 사용할 수 없어 연결 정보는 이 화면이 열린 동안에만 해제됩니다.'
            : '브라우저 저장소를 사용할 수 없어 연결 정보는 이 화면이 열린 동안에만 유지됩니다.');
        }
      }
      syncContextLabel();
    };
    const renderSql = () => {
      const sql = select(root, 'sql');
      if (!sql || !contract) return;
      const fragment = doc.createDocumentFragment();
      for (const item of contract.dbSql) {
        const article = doc.createElement('article');
        const h = doc.createElement('h5'); h.textContent = item.title; article.append(h);
        const p = doc.createElement('p'); p.textContent = item.explanation; article.append(p);
        const pre = doc.createElement('pre'); const code = doc.createElement('code');
        let statement = item.sql;
        const id = get('id');
        if (positiveId(id)) statement = statement.replaceAll(':postId', id);
        code.textContent = statement; pre.append(code); article.append(pre); fragment.append(article);
      }
      sql.replaceChildren(fragment);
    };
    const fillContract = () => {
      if (!contract) return;
      const bodyField = select(root, 'body-field');
      const queryField = select(root, 'query-fields');
      const noBody = select(root, 'no-body');
      if (bodyField) bodyField.hidden = contract.requestBody === null;
      if (queryField) queryField.hidden = contract.id !== 'list';
      if (noBody) noBody.hidden = contract.requestBody !== null;
      if (contract.requestBody !== null && select(root, 'body')) select(root, 'body').value = drafts.has(contract.id) ? drafts.get(contract.id) : JSON.stringify(contract.requestBody, null, 2);
      setText(root, 'method', contract.method);
      setText(root, 'path', contract.path);
      setText(root, 'expected', `기대 ${contract.expectedStatus}`);
      setText(root, 'description', contract.description);
      const checks = select(root, 'checks');
      if (checks) { checks.replaceChildren(...contract.expectedChecks.map(item => { const li = doc.createElement('li'); li.textContent = item; return li; })); }
      renderSql();
      const summary = root.querySelector('.ca-summary-contract'); if (summary) summary.textContent = `${contract.method} ${contract.path}`;
      const button = select(root, 'contract'); if (button) button.value = contract.id;
      updatePreview();
    };
    const requestNow = () => makeRequest(contract, { base: get('base'), id: get('id'), body: get('body'), query: Object.fromEntries([...root.querySelectorAll('[data-ca-query]')].map(el => [el.dataset.caQuery, el.value])), token: get('token') });
    const updatePreview = () => {
      try { const req = requestNow(); setText(root, 'preview', `${req.method} ${req.url}`); }
      catch (error) { setText(root, 'preview', error.message); }
    };
    const inputChanged = () => { updatePreview(); syncContextLabel(); renderSql(); };
    for (const key of ['base', 'id', 'token', 'body']) select(root, key)?.addEventListener('input', inputChanged);
    root.querySelectorAll('[data-ca-query]').forEach(el => { el.addEventListener('input', updatePreview); el.addEventListener('change', updatePreview); });
    select(root, 'contract')?.addEventListener('change', event => {
      if (contract?.requestBody !== null) drafts.set(contract.id, get('body'));
      contract = contracts.find(item => item.id === event.currentTarget.value) || contract;
      fillContract();
    });
    select(root, 'remember')?.addEventListener('click', () => {
      try {
        const base = normalizeApiBase(get('base'));
        const id = get('id');
        if (!positiveId(id)) throw new Error('글 ID는 양의 정수여야 합니다.');
        const record = { version: 1, base, id, provenance: 'manual' };
        saveContext(record); propagate(record);
      } catch (error) { setText(root, 'feedback', error.message); }
    });
    select(root, 'copy')?.addEventListener('click', async () => {
      try {
        const req = requestNow();
        let command = `curl -i -X ${quote(req.method)} ${quote(req.url)}`;
        for (const [name, value] of Object.entries(req.headers)) command += ` -H ${quote(`${name}: ${value}`)}`;
        if (req.body !== undefined) command += ` --data-raw ${quote(req.body)}`;
        const fallback = select(root, 'fallback'); const area = select(root, 'curl');
        if (!clip?.writeText) throw new Error('clipboard unavailable');
        await clip.writeText(command);
        if (fallback) fallback.hidden = true; if (area) area.hidden = true;
        setText(root, 'feedback', '요청 명령을 복사했습니다.');
      } catch {
        const req = (() => { try { return requestNow(); } catch { return null; } })();
        if (!req) { setText(root, 'feedback', '요청 입력을 확인해 주세요.'); return; }
        let command = `curl -i -X ${quote(req.method)} ${quote(req.url)}`;
        for (const [name, value] of Object.entries(req.headers)) command += ` -H ${quote(`${name}: ${value}`)}`;
        if (req.body !== undefined) command += ` --data-raw ${quote(req.body)}`;
        const fallback = select(root, 'fallback'); const area = select(root, 'curl');
        if (fallback) fallback.hidden = false; if (area) { area.hidden = false; area.value = command; area.focus(); area.select(); }
        setText(root, 'feedback', '클립보드에 복사하지 못했습니다. 아래 명령을 직접 복사하세요.');
      }
    });
    form?.addEventListener('submit', async event => {
      event.preventDefault();
      if (pending) return;
      let request;
      try { request = makeRequest(contract, { base: get('base'), id: get('id'), body: get('body'), query: Object.fromEntries([...root.querySelectorAll('[data-ca-query]')].map(el => [el.dataset.caQuery, el.value])), token: get('token') }); }
      catch (error) { setText(root, 'feedback', error.message); return; }
      if (typeof sendFetch !== 'function') { setText(root, 'feedback', 'fetch를 사용할 수 없습니다.'); return; }
      const snapshot = { contract, base: normalizeApiBase(get('base')), id: get('id'), token: get('token').trim(), request, body: get('body'), query: [...root.querySelectorAll('[data-ca-query]')].map(el => el.value) };
      pending = true;
      const sendButton = select(root, 'send'); if (sendButton) sendButton.disabled = true;
      const sent = select(root, 'sent-request'); if (sent) sent.textContent = `마지막 전송: ${request.method} ${request.url}`;
      const sentBody = select(root, 'sent-body');
      const lastRequest = select(root, 'last-request');
      if (sentBody) sentBody.textContent = request.body === undefined ? '본문 없음' : request.body;
      if (lastRequest) lastRequest.hidden = false;
      setText(root, 'status', '요청 중');
      setText(root, 'response', '응답 대기 중');
      setText(root, 'headers', '응답 헤더 대기 중');
      setText(root, 'verdict', '응답을 기다리는 중입니다.');
      setText(root, 'feedback', '요청 중…');
      try {
        const init = { method: request.method, headers: request.headers };
        if (request.body !== undefined) init.body = request.body;
        const response = await sendFetch(request.url, init);
        let raw;
        setText(root, 'status', `HTTP ${response.status}`);
        const headerNode = select(root, 'headers');
        let headerEntries = [];
        try { headerEntries = [...response.headers.entries()]; } catch {}
        if (headerNode) headerNode.textContent = headerEntries.length ? headerEntries.map(([name, value]) => `${name}: ${value}`).join('\n') : '읽을 수 있는 응답 헤더가 없습니다.';
        let location = null;
        try { location = response.headers.get('Location'); } catch {}
        try { raw = await response.text(); } catch (error) {
          setText(root, 'response', '응답 본문을 확보하지 못했습니다.');
          setText(root, 'verdict', 'HTTP 상태와 읽을 수 있는 헤더는 확인했지만 본문 형식을 판단할 수 없습니다.');
          setText(root, 'feedback', `응답 본문을 읽지 못했습니다: ${error?.message || '읽기 오류'}`);
          return;
        }
        const responseNode = select(root, 'response'); if (responseNode) responseNode.textContent = raw;
        const verdict = evaluateApiResponse(snapshot.contract, { status: response.status, body: raw, location, requestUrl: snapshot.request.url });
        setText(root, 'verdict', verdict.note);
        const currentQuery = [...root.querySelectorAll('[data-ca-query]')].map(el => el.value);
        const stateChanged = safeOrigin(get('base')) !== snapshot.base
          || get('id') !== snapshot.id
          || get('token').trim() !== snapshot.token
          || contract !== snapshot.contract
          || (snapshot.contract.requestBody !== null && get('body') !== snapshot.body)
          || (snapshot.contract.id === 'list' && currentQuery.some((value, index) => value !== snapshot.query[index]));
        if (stateChanged) setText(root, 'verdict', `${verdict.note} 응답은 전송 당시 입력에 대한 결과이며 현재 입력과 다를 수 있습니다.`);
        if (snapshot.contract.id === 'create' && verdict.createdId && !stateChanged) {
          const created = { version: 1, base: snapshot.base, id: verdict.createdId, provenance: 'location' };
          saveContext(created); const idInput = select(root, 'id'); if (idInput) idInput.value = created.id; syncContextLabel(); renderSql(); propagate(created);
        }
        if (snapshot.contract.id === 'delete' && response.status === 204 && raw === '') {
          const saved = state.context;
          if (saved?.base === snapshot.base && saved.id === snapshot.id) saveContext(saved, true);
          for (const other of roots) {
            const otherBase = safeOrigin(select(other, 'base')?.value || ''); const otherId = select(other, 'id');
            if (otherBase === snapshot.base && otherId?.value === snapshot.id) { otherId.value = ''; otherId.dispatchEvent(new view.Event('input', { bubbles: true })); }
          }
        }
        setText(root, 'feedback', '응답을 받았습니다. 아래는 마지막 실제 전송의 결과입니다.');
      } catch (error) {
        setText(root, 'status', '응답 확인 불가');
        setText(root, 'response', '응답을 받지 못했습니다.');
        setText(root, 'headers', '응답 헤더를 받지 못했습니다.');
        setText(root, 'verdict', '서버 응답을 받지 못해 상태와 본문 형식을 판단할 수 없습니다.');
        setText(root, 'feedback', `요청을 완료하지 못했습니다: ${error?.message || '네트워크 오류'}`);
      } finally {
        pending = false; if (sendButton) sendButton.disabled = false;
      }
    });
    const remembered = readStorage(store) || state.context;
    if (remembered) {
      state.context = remembered;
      const baseInput = select(root, 'base');
      if (baseInput && baseInput.value === 'http://localhost:8080' && remembered.base !== baseInput.value) baseInput.value = remembered.base;
      if (safeOrigin(get('base')) === remembered.base && !get('id')) select(root, 'id').value = remembered.id;
    }
    const initial = state.context;
    if (initial && safeOrigin(get('base')) === initial.base && !get('id')) select(root, 'id').value = initial.id;
    select(root, 'send') && (select(root, 'send').disabled = false);
    select(root, 'copy') && (select(root, 'copy').disabled = false);
    select(root, 'remember') && (select(root, 'remember').disabled = false);
    fillContract(); syncContextLabel(); renderSql();
  }
}

export { mountCourseApiTools };
