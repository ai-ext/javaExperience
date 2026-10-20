document.querySelectorAll('.tx-journey').forEach((journey) => {
  const panels = [...journey.querySelectorAll('[data-tx-panel]')];
  const requestA = document.querySelector('.api-request[data-request-id="A"]');
  const requestO2 = document.querySelector('.api-request[data-request-id="O2"]');
  const serverUrl = document.querySelector('.lesson-scene .server-url');
  let lastPostId = null;

  if (requestA) journey.querySelector('[data-tx-request-run-slot]').append(requestA);
  if (requestO2) journey.querySelector('[data-tx-request-failure-slot]').append(requestO2);
  for (const request of [requestA, requestO2]) {
    if (!request) continue;
    const editor = request.querySelector('.request-editor');
    const actions = editor?.querySelector('.request-actions');
    if (actions) editor.prepend(actions);
  }

  const updateNormal = () => {
    if (!requestA) return;
    const response = requestA.querySelector('.request-response');
    const status = requestA.querySelector('.request-status');
    const statusText = response.hidden ? '' : response.querySelector('.response-status').textContent.trim();
    const bodyText = response.hidden ? '' : response.querySelector('.response-body').textContent.trim();
    journey.querySelector('[data-tx-run-status]').textContent = statusText || status.textContent.trim() || '아직 실행 전';
    let actual = bodyText;
    lastPostId = null;
    if ((statusText.match(/\b201\b/g) || []).length === 2) {
      try {
        const rows = JSON.parse(bodyText);
        const bodies = rows.map((row) => typeof row.body === 'string' ? JSON.parse(row.body) : row.body);
        const ids = bodies.map((body) => body.id);
        const tags = bodies.map((body) => body.tags);
        if (ids.every((id) => Number.isSafeInteger(id) && id > 0) && ids[1] > ids[0]) {
          lastPostId = ids[1];
        }
        actual = bodies.map((body, index) => `#${index + 1} id ${body.id ?? '?'} · tags ${Array.isArray(tags[index]) ? tags[index].join(', ') : '(없음)'}`).join('\n');
      } catch { /* 예상하지 못한 본문은 원문 그대로 보여 준다. */ }
    }
    journey.querySelector('[data-tx-run-result]').textContent = actual;
    journey.querySelector('[data-tx-post-id]').textContent = lastPostId == null ? '아직 id를 받지 않았어요' : `id = ${lastPostId}`;
    journey.querySelector('[data-tx-post-id-note]').textContent = lastPostId == null
      ? '앞 화면에서 정상 요청 A를 보내세요.'
      : '두 번째 201 응답의 id입니다. 같은 글의 태그를 DB에서 조회하세요.';
    journey.querySelector('[data-tx-links-sql]').textContent = `SELECT t.name FROM post_tag pt JOIN tag t ON t.id = pt.tag_id\nWHERE pt.post_id = ${lastPostId ?? '{id}'} ORDER BY t.name;`;
    journey.querySelector('[data-tx-copy="links"]').disabled = lastPostId == null;
  };
  const updateFailure = () => {
    if (!requestO2) return;
    const response = requestO2.querySelector('.request-response');
    const status = requestO2.querySelector('.request-status');
    journey.querySelector('[data-tx-failure-status]').textContent = response.hidden
      ? status.textContent.trim() || '아직 실행 전'
      : response.querySelector('.response-status').textContent.trim();
  };
  if (requestA) {
    new MutationObserver(updateNormal).observe(requestA, { childList: true, subtree: true, attributes: true, characterData: true });
    updateNormal();
  }
  if (requestO2) {
    new MutationObserver(updateFailure).observe(requestO2, { childList: true, subtree: true, attributes: true, characterData: true });
    updateFailure();
  }

  const show = (name) => {
    for (const panel of panels) panel.hidden = panel.dataset.txPanel !== name;
    journey.dataset.txScreen = name;
    if (serverUrl && name === 'run') journey.querySelector('[data-tx-server-run-slot]').append(serverUrl);
    if (serverUrl && name === 'failure') journey.querySelector('[data-tx-server-failure-slot]').append(serverUrl);
    journey.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  journey.querySelectorAll('[data-tx-go]').forEach((button) => button.addEventListener('click', () => show(button.dataset.txGo)));

  journey.querySelectorAll('[data-tx-copy]').forEach((button) => button.addEventListener('click', async () => {
    const kind = button.dataset.txCopy;
    const code = journey.querySelector(`[data-tx-${kind}-sql]`);
    const state = journey.querySelector(`[data-tx-copy-state="${kind}"]`);
    if (!code || button.disabled) return;
    try {
      await navigator.clipboard.writeText(code.textContent);
      state.textContent = 'SQL을 복사했습니다. DB 도구에 붙여 넣어 실행하세요.';
    } catch {
      const selection = window.getSelection();
      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.addRange(range);
      state.textContent = 'SQL을 선택했습니다. 직접 복사해 DB 도구에 붙여 넣으세요.';
    }
  }));

  const revealRequest = () => {
    if (requestA && location.hash === `#${requestA.id}`) show('run');
    if (requestO2 && location.hash === `#${requestO2.id}`) show('failure');
  };
  window.addEventListener('hashchange', revealRequest);
  revealRequest();
});
