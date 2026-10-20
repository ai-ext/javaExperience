document.querySelectorAll('.first-db-journey').forEach((journey) => {
  const panels = [...journey.querySelectorAll('[data-db-panel]')];
  const request = document.querySelector('.api-request[data-request-id="A"]');
  const serverUrl = document.querySelector('.lesson-scene .server-url');
  const actual = journey.querySelector('[data-db-actual]');
  const actualBody = journey.querySelector('[data-db-actual-body]');
  const responseId = journey.querySelector('[data-db-response-id]');
  const responseNote = journey.querySelector('[data-db-response-note]');
  const expectedId = journey.querySelector('[data-db-expected-id]');
  const query = journey.querySelector('[data-db-query]');
  const copy = journey.querySelector('[data-db-copy]');
  let savedId = null;

  if (request && serverUrl) {
    journey.querySelector('[data-db-server-slot]').append(serverUrl);
    journey.querySelector('[data-db-request-slot]').append(request);
    const update = () => {
      const result = request.querySelector('.request-response');
      const status = request.querySelector('.request-status');
      const statusText = result.hidden ? '' : result.querySelector('.response-status').textContent.trim();
      const bodyText = result.hidden ? '' : result.querySelector('.response-body').textContent.trim();
      actual.textContent = statusText || status.textContent.trim() || '아직 실행 전';
      actualBody.textContent = bodyText;
      savedId = null;
      if ((statusText.match(/\b201\b/g) || []).length === 2) {
        try {
          const rows = JSON.parse(bodyText);
          const last = Array.isArray(rows) ? rows.at(-1) : rows;
          const body = typeof last?.body === 'string' ? JSON.parse(last.body) : last;
          if (Number.isSafeInteger(body?.id) && body.id > 0) savedId = body.id;
        } catch { /* 유효한 id가 확인되기 전에는 DB 조회를 활성화하지 않는다. */ }
      }
      responseId.textContent = savedId == null ? '아직 id를 받지 않았어요' : `id = ${savedId}`;
      responseNote.textContent = savedId == null ? '앞 화면에서 정상 요청 A를 보내세요.' : '두 번째 201 응답의 id입니다. 같은 id의 DB 행을 조회하세요.';
      expectedId.textContent = savedId == null ? '{id}' : String(savedId);
      query.textContent = `SELECT id, board_id, author_id, title, visibility\nFROM post WHERE id = ${savedId ?? '{id}'};`;
      copy.disabled = savedId == null;
    };
    new MutationObserver(update).observe(request, { childList: true, subtree: true, attributes: true, characterData: true });
    update();
  }

  const show = (name) => {
    for (const panel of panels) panel.hidden = panel.dataset.dbPanel !== name;
    journey.dataset.dbScreen = name;
    journey.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  journey.querySelectorAll('[data-db-go]').forEach((button) => button.addEventListener('click', () => show(button.dataset.dbGo)));
  copy.addEventListener('click', async () => {
    if (savedId == null) return;
    const sql = query.textContent;
    const state = journey.querySelector('[data-db-copy-state]');
    try {
      await navigator.clipboard.writeText(sql);
      state.textContent = '조회 SQL을 복사했습니다. DB 도구에 붙여 넣어 실행하세요.';
    } catch {
      const selection = window.getSelection();
      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(query);
      selection.addRange(range);
      state.textContent = 'SQL을 선택했습니다. 직접 복사해 DB 도구에 붙여 넣으세요.';
    }
  });
  const revealRequest = () => { if (location.hash === `#${request?.id}`) show('run'); };
  window.addEventListener('hashchange', revealRequest);
  revealRequest();
});
