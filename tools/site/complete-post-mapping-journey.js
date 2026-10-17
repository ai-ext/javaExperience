document.querySelectorAll('.mapping-journey').forEach((journey) => {
  const panels = [...journey.querySelectorAll('[data-mapping-panel]')];
  const requestA = document.querySelector('.api-request[data-request-id="A"]');
  const requestO1 = document.querySelector('.api-request[data-request-id="O1"]');
  const serverUrl = document.querySelector('.lesson-scene .server-url');
  let lastPostId = null;

  if (requestA) journey.querySelector('[data-mapping-request-run-slot]').append(requestA);
  if (requestO1) journey.querySelector('[data-mapping-request-observation-slot]').append(requestO1);
  for (const request of [requestA, requestO1]) {
    const editor = request?.querySelector('.request-editor');
    const actions = editor?.querySelector('.request-actions');
    if (actions) editor.prepend(actions);
  }

  const renderSql = () => {
    const id = lastPostId ?? '{id}';
    journey.querySelector('[data-mapping-post-id]').textContent = lastPostId == null ? '아직 id를 받지 않았어요' : `id = ${id}`;
    journey.querySelector('[data-mapping-post-id-note]').textContent = lastPostId == null
      ? '앞 화면에서 정상 요청 A′를 보내세요.'
      : '두 번째 201 응답의 id입니다. 이 글의 DB 행을 조회하세요.';
    journey.querySelector('[data-mapping-sql="time"]').textContent = `SELECT published_at, created_at FROM post WHERE id = ${id};`;
    journey.querySelector('[data-mapping-sql="values"]').textContent = `SELECT status, author_id, view_count, like_count, comment_count, deleted_at FROM post WHERE id = ${id};`;
    journey.querySelector('[data-mapping-sql="full"]').textContent = `SELECT board_id, author_id, status, visibility, published_at IS NOT NULL AS published, published_at = created_at AS same_time, like_count, comment_count, deleted_at IS NULL AS not_deleted FROM post WHERE id = ${id};`;
    for (const button of journey.querySelectorAll('[data-mapping-copy]')) button.disabled = lastPostId == null;
  };
  const updateNormal = () => {
    if (!requestA) return;
    const response = requestA.querySelector('.request-response');
    const status = requestA.querySelector('.request-status');
    const statusText = response.hidden ? '' : response.querySelector('.response-status').textContent.trim();
    const bodyText = response.hidden ? '' : response.querySelector('.response-body').textContent.trim();
    journey.querySelector('[data-mapping-run-status]').textContent = statusText || status.textContent.trim() || '아직 실행 전';
    let actual = bodyText;
    lastPostId = null;
    if ((statusText.match(/\b201\b/g) || []).length === 2) {
      try {
        const rows = JSON.parse(bodyText);
        const bodies = rows.map((row) => typeof row.body === 'string' ? JSON.parse(row.body) : row.body);
        const ids = bodies.map((body) => body.id);
        if (ids.every((id) => Number.isSafeInteger(id) && id > 0) && ids[1] > ids[0]) lastPostId = ids[1];
        actual = bodies.map((body, index) => `#${index + 1} id ${body.id ?? '?'} · author ${body.author?.id ?? '?'} / ${body.author?.nickname ?? '?'} · tags ${Array.isArray(body.tags) ? body.tags.join(', ') : '(없음)'}`).join('\n');
      } catch { /* 계약 밖 응답은 실제 원문을 그대로 표시한다. */ }
    }
    journey.querySelector('[data-mapping-run-result]').textContent = actual;
    renderSql();
  };
  const updateObservation = () => {
    if (!requestO1) return;
    const response = requestO1.querySelector('.request-response');
    const status = requestO1.querySelector('.request-status');
    journey.querySelector('[data-mapping-observation-status]').textContent = response.hidden
      ? status.textContent.trim() || '아직 실행 전'
      : response.querySelector('.response-status').textContent.trim();
  };
  if (requestA) {
    new MutationObserver(updateNormal).observe(requestA, { childList: true, subtree: true, attributes: true, characterData: true });
    updateNormal();
  }
  if (requestO1) {
    new MutationObserver(updateObservation).observe(requestO1, { childList: true, subtree: true, attributes: true, characterData: true });
    updateObservation();
  }

  const show = (name) => {
    for (const panel of panels) panel.hidden = panel.dataset.mappingPanel !== name;
    journey.dataset.mappingScreen = name;
    if (serverUrl && name === 'run') journey.querySelector('[data-mapping-server-run-slot]').append(serverUrl);
    if (serverUrl && name === 'observation') journey.querySelector('[data-mapping-server-observation-slot]').append(serverUrl);
    journey.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  journey.querySelectorAll('[data-mapping-go]').forEach((button) => button.addEventListener('click', () => show(button.dataset.mappingGo)));

  const cases = {
    known: ['서버 시작 때 발견', '<code>view_cnt</code>는 <code>post</code>에 없습니다. 엔티티가 이 이름을 가리키므로 시작 때 잡습니다.'],
    unknown: ['저장 요청 때 발견', '<code>updated_at</code>은 DB에서 필수인데 엔티티가 모릅니다. 시작 검증은 통과해도 INSERT 때 DB가 거절합니다.'],
  };
  journey.querySelectorAll('[data-mapping-case]').forEach((button) => button.addEventListener('click', () => {
    for (const item of journey.querySelectorAll('[data-mapping-case]')) item.setAttribute('aria-pressed', String(item === button));
    const [title, body] = cases[button.dataset.mappingCase];
    journey.querySelector('[data-mapping-case-title]').textContent = title;
    journey.querySelector('[data-mapping-case-body]').innerHTML = body;
    journey.querySelector('[data-mapping-image-known]').hidden = button.dataset.mappingCase !== 'known';
    journey.querySelector('[data-mapping-image-unknown]').hidden = button.dataset.mappingCase !== 'unknown';
  }));

  const imageFields = {
    author: ['Member author', 'author_id · BIGINT FK', '회원 id 2'],
    content: ['String content', 'content · TEXT', '요청 본문의 글 내용'],
    status: ['String status', 'status · VARCHAR(20)', '서버가 PUBLISHED로 지정'],
    viewCount: ['Integer viewCount', 'view_count · INT', '서버가 0으로 지정'],
    publishedAt: ['LocalDateTime publishedAt', 'published_at · DATETIME', '서버가 이번 글의 now로 지정'],
  };
  journey.querySelectorAll('[data-mapping-image-field]').forEach((button) => button.addEventListener('click', () => {
    const [javaField, column, value] = imageFields[button.dataset.mappingImageField];
    journey.querySelectorAll('[data-mapping-image-field]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    journey.querySelector('[data-mapping-image-java]').textContent = javaField;
    journey.querySelector('[data-mapping-image-column]').textContent = column;
    journey.querySelector('[data-mapping-image-value]').textContent = value;
  }));

  journey.querySelectorAll('[data-mapping-copy]').forEach((button) => button.addEventListener('click', async () => {
    if (button.disabled) return;
    const kind = button.dataset.mappingCopy;
    const code = journey.querySelector(`[data-mapping-sql="${kind}"]`);
    const state = journey.querySelector(`[data-mapping-copy-state="${kind}"]`);
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
    if (requestO1 && location.hash === `#${requestO1.id}`) show('observation');
  };
  window.addEventListener('hashchange', revealRequest);
  revealRequest();
});
