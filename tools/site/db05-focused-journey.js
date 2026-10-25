document.querySelectorAll('.db05-focused').forEach((journey) => {
  const panels = [...journey.querySelectorAll('[data-db05-panel]')];
  const show = (name, scroll = true) => {
    const active = panels.find((panel) => panel.dataset.db05Panel === name);
    if (!active) return;
    for (const panel of panels) panel.hidden = panel !== active;
    journey.dataset.db05Screen = name;
    if (scroll) journey.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  for (const button of journey.querySelectorAll('[data-db05-go]')) button.addEventListener('click', () => show(button.dataset.db05Go));
  for (const button of journey.querySelectorAll('[data-db05-like]')) {
    button.addEventListener('click', () => {
      for (const item of journey.querySelectorAll('[data-db05-like]')) item.setAttribute('aria-pressed', String(item === button));
      for (const cell of journey.querySelectorAll('[data-db05-matrix-like]')) cell.dataset.highlighted = String(cell.dataset.db05MatrixLike === button.dataset.db05Like);
    });
  }
  journey.querySelector('[data-db05-like="41"]').click();
  for (const button of journey.querySelectorAll('[data-db05-copy]')) {
    button.addEventListener('click', async () => {
      const key = button.dataset.db05Copy;
      const code = journey.querySelector(`[data-db05-sql="${key}"]`);
      const state = journey.querySelector(`[data-db05-copy-state="${key}"]`);
      try {
        await navigator.clipboard.writeText(code.textContent);
        state.textContent = key === 'm6' ? 'SQL 뼈대를 복사했습니다. :since와 :now를 구현에서 바인딩하세요.' : 'SQL을 복사했습니다. 해당 DB에서 직접 실행하세요.';
      } catch {
        const selection = window.getSelection();
        selection.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(code);
        selection.addRange(range);
        state.textContent = 'SQL을 선택했습니다. 직접 복사해 사용하세요.';
      }
    });
  }
  show('scenario', false);
});
