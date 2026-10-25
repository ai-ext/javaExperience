document.querySelectorAll('.token-journey').forEach((journey) => {
  const panels = [...journey.querySelectorAll('[data-token-panel]')];
  const ids = Array.from({ length: 11 }, (_, index) => `T${index + 1}`);
  const requests = new Map(ids.map((id) => [id, document.querySelector(`.api-request[data-request-id="${id}"]`)]));
  const serverUrl = document.querySelector('.lesson-scene .server-url');
  const cases = {
    normal: ['T1'],
    spoof: ['T2'],
    unauthorized: ['T3', 'T4', 'T5', 'T6', 'T7'],
    priority: ['T9'],
    suspended: ['T8'],
    notice: ['T10', 'T11'],
  };
  const selected = Object.fromEntries(Object.entries(cases).map(([name, values]) => [name, values[0]]));
  const postIdInput = journey.querySelector('[data-token-post-id]');

  const updateSql = () => {
    const value = Number(postIdInput.value);
    const valid = Number.isSafeInteger(value) && value > 0;
    journey.querySelector('[data-token-sql="D1"]').textContent = `SELECT author_id FROM post WHERE id = ${valid ? value : '{id}'};`;
    journey.querySelector('[data-token-copy="D1"]').disabled = !valid;
  };
  postIdInput.addEventListener('input', updateSql);
  updateSql();

  for (const [id, request] of requests) {
    if (!request) continue;
    journey.querySelector(`[data-token-request="${id}"]`)?.append(request);
    const editor = request.querySelector('.request-editor');
    const actions = editor?.querySelector('.request-actions');
    if (actions) editor.prepend(actions);
    if (id === 'T1') request.querySelector('.send-request')?.addEventListener('click', () => {
      postIdInput.value = '';
      updateSql();
    });
    const actual = journey.querySelector(`[data-token-actual="${id}"]`);
    const update = () => {
      const response = request.querySelector('.request-response');
      const status = response?.hidden
        ? request.querySelector('.request-status')?.textContent.trim()
        : response.querySelector('.response-status')?.textContent.trim();
      actual.textContent = status || '아직 실행 전';
      if (id === 'T1' && response && !response.hidden && /\b201\b/.test(status || '')) {
        try {
          const body = JSON.parse(response.querySelector('.response-body').textContent);
          if (Number.isSafeInteger(body.id) && body.id > 0) {
            postIdInput.value = String(body.id);
            updateSql();
          }
        } catch { /* 실제 응답이 계약과 다르면 원문 응답만 보여 준다. */ }
      }
    };
    new MutationObserver(update).observe(request, { childList: true, subtree: true, attributes: true, characterData: true });
    update();
  }

  const showCase = (name, id) => {
    selected[name] = id;
    const panel = journey.querySelector(`[data-token-panel="${name}"]`);
    for (const pair of panel.querySelectorAll('[data-token-case]')) pair.hidden = pair.dataset.tokenCase !== id;
    for (const button of panel.querySelectorAll('[data-token-select]')) {
      button.setAttribute('aria-pressed', String(button.dataset.tokenSelect === id));
    }
    if (serverUrl) panel.querySelector(`[data-token-server="${id}"]`)?.append(serverUrl);
    if (name === 'notice') {
      panel.querySelector('[data-token-role-member]').textContent = id === 'T10' ? '회원 1 · ADMIN' : '회원 2 · USER';
      panel.querySelector('[data-token-role-result]').textContent = id === 'T10' ? '허용' : '거절';
    }
  };
  const show = (name, scroll = true) => {
    for (const panel of panels) panel.hidden = panel.dataset.tokenPanel !== name;
    journey.dataset.tokenScreen = name;
    if (cases[name]) showCase(name, selected[name]);
    if (scroll) journey.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  for (const button of journey.querySelectorAll('[data-token-go]')) {
    button.addEventListener('click', () => show(button.dataset.tokenGo));
  }
  for (const button of journey.querySelectorAll('[data-token-select]')) {
    button.addEventListener('click', () => showCase(button.closest('[data-token-panel]').dataset.tokenPanel, button.dataset.tokenSelect));
  }
  for (const button of journey.querySelectorAll('[data-token-preflight]')) {
    button.addEventListener('click', () => {
      const kind = button.dataset.tokenPreflight;
      for (const item of journey.querySelectorAll('[data-token-preflight]')) item.setAttribute('aria-pressed', String(item === button));
      for (const panel of journey.querySelectorAll('[data-token-preflight-panel]')) panel.hidden = panel.dataset.tokenPreflightPanel !== kind;
    });
  }
  for (const button of journey.querySelectorAll('[data-token-copy]')) {
    button.addEventListener('click', async () => {
      if (button.disabled) return;
      const kind = button.dataset.tokenCopy;
      const code = journey.querySelector(`[data-token-sql="${kind}"]`);
      const state = journey.querySelector(`[data-token-copy-state="${kind}"]`);
      try {
        await navigator.clipboard.writeText(code.textContent);
        state.textContent = 'SQL을 복사했습니다. 별도 DB 도구에서 실행하세요.';
      } catch {
        const selection = window.getSelection();
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.addRange(range);
        state.textContent = 'SQL을 선택했습니다. 직접 복사해 DB 도구에서 실행하세요.';
      }
    });
  }
  const revealRequest = () => {
    const hit = [...requests.entries()].find(([, request]) => request && location.hash === `#${request.id}`);
    if (!hit) return;
    const name = Object.entries(cases).find(([, values]) => values.includes(hit[0]))?.[0];
    if (!name) return;
    selected[name] = hit[0];
    show(name);
  };
  window.addEventListener('hashchange', revealRequest);
  for (const [name, values] of Object.entries(cases)) showCase(name, values[0]);
  show('scenario', false);
  revealRequest();
});
