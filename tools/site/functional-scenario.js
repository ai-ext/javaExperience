// 요청은 명시적 전송에서만 실행한다. 학습용 상태·자기확인은 서버 결과와 분리한다.
(() => {
  'use strict';
  const CHECK_KEY = 'javaExperience.functional.selfChecks.v1';
  const validId = value => typeof value === 'string' && /^[1-9][0-9]*$/.test(value);

  function init(root) {
    if (root.dataset.fwInitialized) return;
    root.dataset.fwInitialized = 'true';
    const data = JSON.parse(root.querySelector('[data-fw-data]').textContent);
    const likeScope = data.captureScope === 'like';
    const ID_KEY = likeScope ? 'javaExperience.functional.like.capturedId.v1' : 'javaExperience.functional.capturedId.v1';
    const BASE_KEY = likeScope ? 'javaExperience.functional.like.serverBase.v1' : 'javaExperience.functional.serverBase.v1';
    const form = root.querySelector('[data-fw-form]');
    const status = root.querySelector('[data-fw-status]');
    const output = root.querySelector('[data-fw-response]');
    const send = root.querySelector('[data-fw-send]');
    const idInput = root.querySelector('[data-fw-id]');
    const baseInput = root.querySelector('[data-fw-base]');
    const tokenInput = root.querySelector('[data-fw-token]');
    const bodyInput = root.querySelector('[data-fw-body]');
    const copyButton = root.querySelector('[data-fw-copy-request]');
    const copyStatus = root.querySelector('[data-fw-copy-status]');
    const startup = root.querySelector('[data-fw-startup]');
    const fileNote = root.querySelector('[data-fw-file-note]');
    if (fileNote) fileNote.hidden = window.location.protocol !== 'file:';
    const curlFallback = root.querySelector('[data-fw-curl-fallback]');
    const curlText = root.querySelector('[data-fw-curl-text]');
    let copyVersion = 0;
    const storageNotice = root.querySelector('[data-fw-storage]');
    const captured = root.querySelector('[data-fw-captured]');
    let pending = false, revision = 0, hasResult = false;

    const fileCopy = root.querySelector('[data-fw-file-copy]');
    const fileCopyStatus = root.querySelector('[data-fw-file-copy-status]');
    const fileFallback = root.querySelector('[data-fw-file-copy-fallback]');
    const fileText = root.querySelector('[data-fw-file-copy-text]');
    if (fileCopy && fileCopyStatus && fileFallback && fileText) {
      fileCopy.disabled = false;
      fileCopy.addEventListener('click', async () => {
        const path = fileCopy.dataset.fwFileCopyPath;
        fileCopyStatus.hidden = false;
        fileFallback.hidden = true;
        try {
          if (typeof window.navigator.clipboard?.writeText !== 'function') throw new Error('clipboard unavailable');
          await window.navigator.clipboard.writeText(path);
          fileCopyStatus.textContent = '파일 경로를 복사했습니다. IDE의 파일 찾기에 붙여 넣으세요.';
        } catch {
          fileFallback.hidden = false;
          fileCopyStatus.textContent = '클립보드를 사용할 수 없습니다. 아래 경로를 직접 복사하세요.';
          fileText.focus(); fileText.select();
        }
      });
    }

    function storage(kind, action, key, value) {
      try {
        if (action === 'get') return window[kind].getItem(key);
        if (action === 'set') window[kind].setItem(key, value);
        if (action === 'remove') window[kind].removeItem(key);
      } catch {
        storageNotice.textContent = '브라우저 저장소를 사용할 수 없어 이어서 학습하는 기록을 저장하지 못했습니다. id를 직접 복사해 다음 과제에 입력하세요.';
      }
      return null;
    }
    function normalizeBase(value) {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('서버 주소는 인증 정보·쿼리·fragment가 없는 http 또는 https URL로 입력하세요.');
      return url.href.replace(/\/$/, '');
    }
    const storedBase = storage('sessionStorage', 'get', BASE_KEY)
      || (likeScope ? storage('sessionStorage', 'get', 'javaExperience.functional.serverBase.v1') : null);
    if (storedBase) {
      try { baseInput.value = normalizeBase(storedBase); } catch { /* 잘못 저장된 주소는 기본값 유지 */ }
    }
    let knownBase = normalizeBase(baseInput.value);
    const storedId = storage('sessionStorage', 'get', ID_KEY);
    if (validId(storedId) && storedBase === knownBase) {
      idInput.value = storedId;
      captured.textContent = storedId;
    } else if (storedId) storage('sessionStorage', 'remove', ID_KEY);

    function checksFromStorage() {
      try {
        const value = JSON.parse(storage('localStorage', 'get', CHECK_KEY) || '{}');
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
      } catch { return {}; }
    }
    function showChecks() {
      const checkedIds = [...root.querySelectorAll('[data-fw-check]:checked')].map(input => input.value);
      const complete = checkedIds.length === data.completionIds.length;
      root.dataset.fwSelfComplete = String(complete);
      root.querySelector('[data-fw-progress]').textContent = `${checkedIds.length} / ${data.completionIds.length}개 자기확인${complete ? ' · 모든 항목 직접 확인' : ''}`;
      return { taskId: data.id, checkedIds, complete };
    }
    function restoreChecks() {
      const saved = checksFromStorage()[data.id];
      const ids = Array.isArray(saved) ? saved : [];
      root.querySelectorAll('[data-fw-check]').forEach(input => { input.checked = ids.includes(input.value); });
      showChecks();
    }
    restoreChecks();
    root.querySelectorAll('[data-fw-check]').forEach(input => input.addEventListener('change', () => {
      const progress = showChecks();
      // 다른 과제·다른 탭의 저장 내용을 먼저 읽어 합친다.
      const saved = checksFromStorage();
      saved[data.id] = progress.checkedIds;
      storage('localStorage', 'set', CHECK_KEY, JSON.stringify(saved));
      document.dispatchEvent(new CustomEvent('functional-progress-change', { bubbles: true, detail: progress }));
    }));
    window.addEventListener('storage', event => { if (event.key === CHECK_KEY || event.key === null) restoreChecks(); });

    const tabs = [...root.querySelectorAll('[data-fw-state]')];
    function selectState(tab, focus = false) {
      tabs.forEach(item => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
      });
      root.querySelectorAll('[data-fw-state-panel]').forEach(panel => { panel.hidden = panel.dataset.fwStatePanel !== tab.dataset.fwState; });
      if (focus) tab.focus();
    }
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectState(tab));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        selectState(tabs[next], true);
      });
    });
    function openAnchor() {
      if (window.location.hash === '#functional-setup') root.querySelector('#functional-setup').open = true;
    }
    openAnchor();
    window.addEventListener('hashchange', openAnchor);
    root.querySelectorAll('a[href="#functional-setup"]').forEach(link => link.addEventListener('click', openAnchor));

    function endpoint() {
      let route = data.api.path;
      if (route.includes('{id}')) {
        if (!validId(idInput.value.trim())) throw new Error('작성 응답에서 받은 양의 정수 id를 입력하세요.');
        route = route.replace('{id}', encodeURIComponent(idInput.value.trim()));
      }
      root.querySelectorAll('[data-fw-path]').forEach(input => { route = route.replace(`{${input.dataset.fwPath}}`, encodeURIComponent(input.value.trim())); });
      const url = new URL(normalizeBase(baseInput.value) + route);
      root.querySelectorAll('[data-fw-query]').forEach(input => url.searchParams.set(input.dataset.fwQuery, input.value));
      return url.href;
    }
    function refreshPreview() {
      let url;
      try { url = endpoint(); } catch { url = data.api.path; }
      root.querySelector('[data-fw-request-preview]').textContent = `${data.api.method} ${url}`;
    }
    function changed() {
      revision++;
      copyVersion++;
      if (copyStatus?.textContent) copyStatus.textContent = '입력 변경 · 이전 복사 내용은 현재 요청과 다릅니다. 다시 복사하세요.';
      if (curlText) curlText.value = '';
      if (curlFallback) curlFallback.hidden = true;
      let currentBase;
      try { currentBase = normalizeBase(baseInput.value); } catch { currentBase = null; }
      if (currentBase !== knownBase) {
        knownBase = currentBase;
        idInput.value = '';
        captured.textContent = '아직 없음';
        storage('sessionStorage', 'remove', ID_KEY);
        storage('sessionStorage', 'remove', BASE_KEY);
        storageNotice.textContent = '서버 주소가 바뀌어 이전 서버의 id 연결을 해제했습니다. 이 서버의 id를 직접 입력하거나 새 글을 작성하세요.';
      }
      if (pending) status.textContent = '전송 중 · 입력 변경됨 (전송 당시 요청의 응답 대기)';
      else if (hasResult) {
        status.textContent = '입력 변경 · 아래는 이전 요청 결과입니다. 현재 입력은 미실행입니다.';
        root.dataset.fwRequestState = 'stale';
      } else if (root.dataset.fwRequestState === 'error') {
        status.textContent = '미실행 · 입력을 바꿨습니다. 전송 전에 다시 확인하세요.';
        root.dataset.fwRequestState = 'idle';
      }
      refreshPreview();
    }
    form.addEventListener('input', changed);
    form.addEventListener('change', changed);
    root.querySelectorAll('[data-fw-variant]').forEach(button => button.addEventListener('click', () => {
      bodyInput.value = JSON.stringify(data.variants[Number(button.dataset.fwVariant)].body, null, 2);
      changed();
    }));
    refreshPreview();

    function readRequest() {
      if (!form.reportValidity()) return null;
      const url = endpoint();
      const base = normalizeBase(baseInput.value);
      let body;
      if (bodyInput && ['POST', 'PATCH'].includes(data.api.method)) {
        try { JSON.parse(bodyInput.value); } catch { throw new Error('요청 본문의 JSON 문법을 확인하세요. 아직 전송하지 않았습니다.'); }
        body = bodyInput.value;
      }
      const headers = { Accept: 'application/json' };
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      const token = tokenInput.value.trim().replace(/^Bearer\s+/i, '');
      if (token) headers.Authorization = `Bearer ${token}`;
      return { url, base, body, headers };
    }
    // 모든 argv를 POSIX single quote로 감싼다. 내부 '는 닫기 + escape + 열기로 보존한다.
    const shellQuote = value => "'" + String(value).replace(/'/g, "'\\''") + "'";
    copyButton?.addEventListener('click', async () => {
      const version = ++copyVersion;
      curlText.value = '';
      curlFallback.hidden = true;
      let request;
      try {
        request = readRequest();
        if (!request) { copyStatus.textContent = '요청 입력을 확인하세요. 복사하지 않았습니다.'; return; }
      } catch (error) {
        copyStatus.textContent = error.message;
        return;
      }
      const argv = ['curl', '--request', data.api.method, '--url', request.url];
      for (const [name, value] of Object.entries(request.headers)) argv.push('--header', `${name}: ${value}`);
      if (request.body !== undefined) argv.push('--data-raw', request.body);
      const command = argv.map(shellQuote).join(' ');
      copyStatus.textContent = 'curl 명령 복사 중 · 아직 실행하지 않았습니다.';
      try {
        if (typeof window.navigator.clipboard?.writeText !== 'function') throw new Error('clipboard unavailable');
        await window.navigator.clipboard.writeText(command);
        if (version !== copyVersion) return;
        copyStatus.textContent = 'curl 명령을 복사했습니다. 실제 요청은 실행하지 않았습니다.';
      } catch {
        if (version !== copyVersion) return;
        curlText.value = command;
        curlFallback.hidden = false;
        copyStatus.textContent = '클립보드 복사를 사용할 수 없습니다. 선택된 명령을 직접 복사하세요. 아직 실행하지 않았습니다.';
        curlText.focus();
        curlText.select();
      }
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (pending) return;
      let request;
      try {
        request = readRequest();
        if (!request) return;
      } catch (error) {
        status.textContent = error.message;
        root.dataset.fwRequestState = 'error';
        return;
      }
      const { url, body, base, headers } = request;
      const requestedPostId = idInput.value.trim();
      const controller = new AbortController();
      const requestedRevision = revision;
      if (data.id === 'create') {
        // 새 작성 결과가 이전 글의 id를 그대로 이어받지 않게 실제 전송 전에 해제한다.
        const previousId = idInput.value.trim();
        idInput.value = '';
        captured.textContent = '아직 없음';
        storageNotice.textContent = previousId
          ? `새 작성 요청을 시작해 이전 글 id ${previousId}의 연결을 해제했습니다. 이번 응답의 id와 Location을 확인한 뒤 연결합니다.`
          : '이번 작성 응답의 숫자 id와 Location을 확인한 뒤 다음 과제에 연결합니다.';
        storage('sessionStorage', 'remove', ID_KEY);
        storage('sessionStorage', 'remove', BASE_KEY);
      }
      pending = true;
      send.disabled = true;
      form.setAttribute('aria-busy', 'true');
      root.dataset.fwRequestState = 'pending';
      status.textContent = '전송 중 · 서버 응답 대기';
      output.textContent = `${data.api.method} ${url}\n서버 응답을 기다리고 있습니다.`;
      let timedOut = false, timer;
      try {
        const request = (async () => {
          const response = await window.fetch(url, { method: data.api.method, headers, body, signal: controller.signal, credentials: 'omit', cache: 'no-store', redirect: 'error' });
          const text = await response.text();
          return { response, text };
        })();
        const timeout = new Promise((_resolve, reject) => {
          timer = window.setTimeout(() => {
            timedOut = true;
            controller.abort();
            reject(new Error('timeout'));
          }, Number(root.dataset.requestTimeout) || 15000);
        });
        const { response, text } = await Promise.race([request, timeout]);
        const isStale = revision !== requestedRevision;
        const expected = response.status === data.expectedStatus;
        const location = response.headers.get('location');
        const visibleHeaders = [
          ['Content-Type', response.headers.get('content-type')],
          ['Location', location],
          ['WWW-Authenticate', response.headers.get('www-authenticate')],
        ].map(([name, value]) => `${name}: ${value == null ? '미확인 (헤더가 없거나 브라우저에 노출되지 않음)' : value}`).join('\n');
        const bodyText = text === '' ? '(본문 없음)' : text;
        output.textContent = `${data.api.method} ${url}\nHTTP ${response.status}\n${visibleHeaders}\n\n${bodyText}`;
        status.textContent = `HTTP ${response.status} 수신 · ${expected ? '기대 상태 코드와 일치' : `기대 상태 코드는 ${data.expectedStatus}`}${response.status === 204 && text !== '' ? ' · 204인데 본문이 있습니다. 확인이 필요합니다.' : ''}${isStale ? ' · 입력이 바뀌어 현재 입력의 결과가 아닙니다.' : ' · 응답 필드와 DB는 직접 확인하세요.'}`;
        root.dataset.fwRequestState = isStale ? 'stale' : 'received';
        hasResult = true;
        // 확정된 삭제의 연결만 해제한다. 다른 서버·다른 글과 CRUD의 404 확인 id는 유지한다.
        if (data.id === 'delete' && response.status === 204 && validId(requestedPostId)
            && storage('sessionStorage', 'get', 'javaExperience.functional.like.serverBase.v1') === base
            && storage('sessionStorage', 'get', 'javaExperience.functional.like.capturedId.v1') === requestedPostId) {
          storage('sessionStorage', 'remove', 'javaExperience.functional.like.capturedId.v1');
          storageNotice.textContent = `삭제한 글 ${requestedPostId}의 좋아요 이어가기 id를 해제했습니다. CRUD의 삭제 후 확인에는 같은 id를 계속 사용할 수 있습니다.`;
        }
        // 응답의 id 연결과 학습 완료 판정은 별개다.
        if (data.id === 'create' && response.status === 201 && !isStale) {
          let created;
          try { created = JSON.parse(text); } catch { /* 비 JSON 응답은 id로 연결하지 않는다. */ }
          const rawId = created?.id;
          const safeId = typeof rawId === 'number' && Number.isSafeInteger(rawId) && rawId > 0;
          let matchingLocation = false;
          if (safeId && location) {
            try {
              const actualLocation = new URL(location, url);
              const expectedLocation = new URL(`${url.replace(/\/$/, '')}/${rawId}`);
              matchingLocation = actualLocation.href === expectedLocation.href;
            } catch { /* 잘못된 Location은 자동 연결하지 않는다. */ }
          }
          if (safeId && matchingLocation) {
            const id = String(rawId);
            idInput.value = id;
            captured.textContent = id;
            storageNotice.textContent = '이번 응답의 숫자 id와 동일 서버의 Location이 일치해 다음 과제에 연결했습니다. 응답 필드와 DB 확인은 별도로 필요합니다.';
            storage('sessionStorage', 'set', ID_KEY, id);
            storage('sessionStorage', 'set', BASE_KEY, base);
          } else if (rawId === undefined || rawId === null) {
            storageNotice.textContent = '201 응답의 body.id가 없습니다. 이전 글의 id는 해제했습니다. 응답과 서버를 직접 확인한 뒤 다음 과제에서 id를 수동 입력하세요.';
          } else if (typeof rawId !== 'number') {
            storageNotice.textContent = 'body.id는 정본의 Long처럼 JSON 숫자여야 합니다. 자동 연결하지 않았습니다. 응답과 Location을 직접 확인한 뒤 다음 과제에서 id를 수동 입력하세요.';
          } else if (!safeId) {
            storageNotice.textContent = 'body.id가 JavaScript에서 안전하게 표현할 수 있는 양의 정수 범위가 아닙니다. 자동 연결하지 않았습니다. 원본 응답을 확인하세요.';
          } else if (!location) {
            storageNotice.textContent = 'Location을 브라우저에서 읽지 못해 일치 여부는 미확인입니다. 자동 연결하지 않았습니다. 서버 CORS의 Location 노출 설정과 원본 응답을 확인한 뒤 다음 과제에서 id를 수동 입력하세요.';
          } else {
            storageNotice.textContent = 'body.id와 동일 요청 서버의 Location이 불일치합니다. 자동 연결하지 않았습니다. 응답과 서버를 직접 확인한 뒤 다음 과제에서 id를 수동 입력하세요.';
          }
        } else if (data.id !== 'create' && validId(idInput.value.trim()) && !isStale) {
          let validLike = !likeScope;
          if (likeScope && response.status === data.expectedStatus) {
            try {
              const value = JSON.parse(text);
              validLike = Number.isSafeInteger(value.postId) && String(value.postId) === idInput.value.trim()
                && value.liked === (data.api.method === 'PUT')
                && Number.isSafeInteger(value.likeCount) && value.likeCount >= 0;
            } catch { /* 원문 응답은 유지하고 유효 id로 자동 연결하지 않는다. */ }
          }
          if (validLike) {
            storage('sessionStorage', 'set', ID_KEY, idInput.value.trim());
            storage('sessionStorage', 'set', BASE_KEY, base);
            captured.textContent = idInput.value.trim();
          } else {
            storage('sessionStorage', 'remove', ID_KEY);
            captured.textContent = '유효한 좋아요 응답 id 없음';
            storageNotice.textContent = '기대 상태·postId·liked·likeCount가 맞는 성공 응답만 취소 과제로 이어갑니다. 실제 응답을 확인한 뒤 id를 다시 입력할 수 있습니다.';
          }
        }
      } catch (error) {
        hasResult = true;
        root.dataset.fwRequestState = 'error';
        status.textContent = timedOut ? '요청 시간 초과 · 서버 처리 결과 미확인' : '요청 실패 · 서버 처리 결과 미확인';
        output.textContent = `${data.api.method} ${url}\n${timedOut ? '15초 안에 응답을 받지 못했습니다.' : '브라우저에서 응답을 읽지 못했습니다.'}\n서버 실행·주소·HTTPS 혼합 콘텐츠·CORS 설정을 확인하세요. 서버 CORS의 Authorization 허용과 Location 노출 설정도 확인하세요.\n응답을 읽지 못해도 서버가 변경을 처리했을 수 있습니다. 특히 POST·PATCH·DELETE와 조회수를 쓰는 상세 GET은 DB를 확인한 뒤 다시 전송하세요.`;
        if (window.location.protocol === 'file:') {
          const documentUrl = new URL(data.pagePath, 'http://localhost:3000/').href;
          output.textContent += `\n\n학습 화면을 file://로 열었습니다. HTML이 있는 javaExperience 저장소 루트에서 python3 -m http.server 3000 --bind 127.0.0.1 을 직접 실행한 뒤 ${documentUrl} 으로 여세요. 3000은 문서 서버이며, 별도 starter 폴더의 백엔드 http://localhost:8080 및 DB와 구분합니다. 서버 실행이나 연결 확인은 자동으로 수행하지 않습니다.`;
        }
      } finally {
        window.clearTimeout(timer);
        pending = false;
        send.disabled = false;
        form.setAttribute('aria-busy', 'false');
      }
    });
    // 명시 전송 처리기를 연결한 뒤에만 활성화한다. 기본 HTML 제출에는 입력값을 싣지 않는다.
    send.disabled = false;
    if (copyButton) copyButton.disabled = false;
    if (startup) startup.hidden = true;
  }
  function initLegacy() {
    if (document.documentElement.dataset.fwLegacyReady) return;
    document.documentElement.dataset.fwLegacyReady = 'true';
    function revealLegacy() {
      let id;
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      const target = document.getElementById(id);
      const legacy = document.getElementById('legacy-scenarios');
      if (!target || !legacy?.contains(target)) return;
      for (let node = target; node; node = node.parentElement) {
        if (node.tagName === 'DETAILS') node.open = true;
      }
      target.scrollIntoView?.({ block: 'start' });
    }
    // 열람만 돕는다. 기존 hash handler와 진도 기록에는 관여하지 않는다.
    window.addEventListener('hashchange', revealLegacy);
    revealLegacy();
  }
  function start() {
    initLegacy();
    document.querySelectorAll('[data-fw-root]').forEach(init);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
