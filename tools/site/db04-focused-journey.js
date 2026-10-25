document.querySelectorAll('.db04-focused').forEach((journey) => {
  const panels = [...journey.querySelectorAll('[data-db04-panel]')];
  const original = document.querySelector('#db04-original');
  const show = (name, scroll = true) => {
    const active = panels.find((panel) => panel.dataset.db04Panel === name);
    if (!active) return;
    for (const panel of panels) panel.hidden = panel !== active;
    journey.dataset.db04Screen = name;
    if (scroll) journey.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  for (const button of journey.querySelectorAll('[data-db04-go]')) button.addEventListener('click', () => show(button.dataset.db04Go));
  for (const link of journey.querySelectorAll('[data-db04-source]')) link.addEventListener('click', () => { if (original) original.open = true; });

  for (const button of journey.querySelectorAll('[data-db04-tag]')) {
    button.addEventListener('click', () => {
      for (const item of journey.querySelectorAll('[data-db04-tag]')) item.setAttribute('aria-pressed', String(item === button));
      journey.querySelector('[data-db04-tag-route]').textContent = button.dataset.db04Tag === 'spring' ? 'id 2 · spring' : 'id 3 · jpa';
    });
  }
  for (const button of journey.querySelectorAll('[data-db04-projection]')) {
    button.addEventListener('click', () => {
      const withTag = button.dataset.db04Projection === 'tag';
      for (const item of journey.querySelectorAll('[data-db04-projection]')) item.setAttribute('aria-pressed', String(item === button));
      journey.querySelector('[data-db04-selected-columns]').textContent = withTag ? 'p.id · p.title · p.published_at · t.name' : 'p.id · p.title · p.published_at';
      journey.querySelector('[data-db04-projection-result]').textContent = withTag ? 'post id 2 · spring / post id 2 · jpa' : 'post id 2 · 한 행';
      journey.querySelector('[data-db04-projection-note]').textContent = withTag ? '태그 이름이 달라 두 행 모두 남습니다.' : 'spring·jpa가 있어도 글 열의 조합이 같습니다.';
    });
  }
  for (const button of journey.querySelectorAll('[data-db04-copy]')) {
    button.addEventListener('click', async () => {
      const key = button.dataset.db04Copy;
      const code = journey.querySelector(`[data-db04-sql="${key}"]`);
      const state = journey.querySelector(`[data-db04-copy-state="${key}"]`);
      try {
        await navigator.clipboard.writeText(code.textContent);
        state.textContent = 'SQL을 복사했습니다. community practice DB에서 실행하세요.';
      } catch {
        const selection = window.getSelection();
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.addRange(range);
        state.textContent = 'SQL을 선택했습니다. 직접 복사해 DB에서 실행하세요.';
      }
    });
  }
  show('scenario', false);
});
