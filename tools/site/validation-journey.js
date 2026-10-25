document.querySelectorAll('.validation-journey').forEach((journey) => {
  const panels = [...journey.querySelectorAll('[data-validation-panel]')];
  const requestIds = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12'];
  const requests = new Map(requestIds.map((id) => [id, document.querySelector(`.api-request[data-request-id="${id}"]`)]));
  const serverUrl = document.querySelector('.lesson-scene .server-url');
  const caseGroups = {
    invalid: ['V1', 'V3', 'V4', 'V8'],
    default: ['V5'],
    board: ['V6', 'V7'],
    boundary: ['V2', 'V9', 'V10'],
    'null-tag': ['V11'],
    'case-tag': ['V12'],
  };
  const activeCase = Object.fromEntries(Object.entries(caseGroups).map(([panel, ids]) => [panel, ids[0]]));

  for (const [id, request] of requests) {
    if (!request) continue;
    journey.querySelector(`[data-validation-request="${id}"]`)?.append(request);
    const editor = request.querySelector('.request-editor');
    const actions = editor?.querySelector('.request-actions');
    if (actions) editor.prepend(actions);
    const actual = journey.querySelector(`[data-validation-actual="${id}"]`);
    const update = () => {
      const response = request.querySelector('.request-response');
      actual.textContent = response?.hidden
        ? request.querySelector('.request-status')?.textContent.trim() || '아직 실행 전'
        : response.querySelector('.response-status')?.textContent.trim() || '응답 확인';
    };
    new MutationObserver(update).observe(request, { childList: true, subtree: true, attributes: true, characterData: true });
    update();
  }

  const showCase = (panelName, id) => {
    activeCase[panelName] = id;
    const panel = journey.querySelector(`[data-validation-panel="${panelName}"]`);
    for (const pair of panel.querySelectorAll('[data-validation-case]')) pair.hidden = pair.dataset.validationCase !== id;
    for (const button of panel.querySelectorAll('[data-validation-select]')) {
      button.setAttribute('aria-pressed', String(button.dataset.validationSelect === id));
    }
    if (serverUrl) panel.querySelector(`[data-validation-server="${id}"]`)?.append(serverUrl);
  };
  const show = (name, scroll = true) => {
    for (const panel of panels) panel.hidden = panel.dataset.validationPanel !== name;
    journey.dataset.validationScreen = name;
    if (caseGroups[name]) showCase(name, activeCase[name]);
    if (scroll) journey.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  for (const button of journey.querySelectorAll('[data-validation-go]')) {
    button.addEventListener('click', () => show(button.dataset.validationGo));
  }
  for (const button of journey.querySelectorAll('[data-validation-select]')) {
    button.addEventListener('click', () => showCase(button.closest('[data-validation-panel]').dataset.validationPanel, button.dataset.validationSelect));
  }
  for (const button of journey.querySelectorAll('[data-validation-copy]')) {
    button.addEventListener('click', async () => {
      const id = button.dataset.validationCopy;
      const code = journey.querySelector(`[data-validation-sql="${id}"]`);
      const state = journey.querySelector(`[data-validation-copy-state="${id}"]`);
      try {
        await navigator.clipboard.writeText(code.textContent);
        state.textContent = 'SQL을 복사했습니다. DB 도구에서 직접 실행하세요.';
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
  const revealRequest = (scroll = true) => {
    const request = [...requests.entries()].find(([, node]) => node && location.hash === `#${node.id}`);
    if (!request) return;
    const panel = Object.entries(caseGroups).find(([, ids]) => ids.includes(request[0]))?.[0];
    if (!panel) return;
    activeCase[panel] = request[0];
    show(panel, scroll);
  };
  window.addEventListener('hashchange', revealRequest);
  for (const [panel, ids] of Object.entries(caseGroups)) showCase(panel, ids[0]);
  show('scenario', false);
  revealRequest(false);
});
