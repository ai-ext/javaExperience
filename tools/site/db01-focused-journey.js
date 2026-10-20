document.querySelectorAll('.db01-focused').forEach((journey) => {
  const panels = [...journey.querySelectorAll('[data-db01-panel]')];
  const fields = {
    title: ['title', 'post.title', '글 145 · 스프링 트랜잭션 전파 삽질기'],
    authorNickname: ['authorNickname', 'post.author_id → member.id → member.nickname', '글 145 · 밤샘개발자'],
    likeCount: ['likeCount', 'post.like_count', '글 145 · 20'],
    tags: ['tags[]', 'post.id → post_tag.post_id → tag.name', '글 145 · java'],
    publishedAt: ['publishedAt', 'post.published_at', '글 145 · 발행 시각'],
  };
  const show = (name) => {
    for (const panel of panels) panel.hidden = panel.dataset.db01Panel !== name;
    journey.dataset.db01Screen = name;
    journey.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  for (const button of journey.querySelectorAll('[data-db01-go]')) {
    button.addEventListener('click', () => show(button.dataset.db01Go));
  }
  for (const link of journey.querySelectorAll('[data-db01-source]')) {
    link.addEventListener('click', () => {
      const details = document.querySelector('#db01-original');
      if (details) details.open = true;
    });
  }
  for (const button of journey.querySelectorAll('[data-db01-field]')) {
    button.addEventListener('click', () => {
      for (const item of journey.querySelectorAll('[data-db01-field]')) item.setAttribute('aria-pressed', String(item === button));
      const [name, path, value] = fields[button.dataset.db01Field];
      journey.querySelector('[data-db01-field-name]').textContent = name;
      journey.querySelector('[data-db01-field-path]').textContent = path;
      journey.querySelector('[data-db01-field-value]').textContent = value;
    });
  }

  const idInput = journey.querySelector('[data-db01-page-ids]');
  const tagSql = journey.querySelector('[data-db01-tags-sql]');
  const tagButton = journey.querySelector('[data-db01-copy="tags"]');
  const tagState = journey.querySelector('[data-db01-copy-state="tags"]');
  const refreshTagSql = () => {
    const raw = idInput.value.trim();
    const values = raw.split(',').map((value) => value.trim());
    const valid = values.length > 0 && values.length <= 20
      && values.every((value) => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0);
    tagButton.disabled = !valid;
    tagState.textContent = valid ? '' : '현재 페이지의 양수 글 ID를 쉼표로 최대 20개 입력하세요.';
    if (!valid) return;
    tagSql.textContent = `SELECT pt.post_id, t.name\nFROM post_tag pt\nJOIN tag t ON t.id = pt.tag_id\nWHERE pt.post_id IN (${values.map(Number).join(',')})\nORDER BY pt.post_id, t.name;`;
  };
  idInput.addEventListener('input', refreshTagSql);
  refreshTagSql();

  for (const button of journey.querySelectorAll('[data-db01-copy]')) {
    button.addEventListener('click', async () => {
      if (button.disabled) return;
      const kind = button.dataset.db01Copy;
      const code = journey.querySelector(kind === 'main' ? '[data-db01-main-sql]' : '[data-db01-tags-sql]');
      const state = journey.querySelector(`[data-db01-copy-state="${kind}"]`);
      try {
        await navigator.clipboard.writeText(code.textContent);
        state.textContent = 'SQL을 복사했습니다. practice DB 클라이언트에서 직접 실행하세요.';
      } catch {
        const selection = window.getSelection();
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.addRange(range);
        state.textContent = 'SQL을 선택했습니다. 직접 복사해 practice DB에서 실행하세요.';
      }
    });
  }
  show('scenario');
});
