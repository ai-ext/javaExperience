document.querySelectorAll('.db02-focused').forEach((journey) => {
  const panels = [...journey.querySelectorAll('[data-db02-panel]')];
  const original = document.querySelector('#db02-original');
  const show = (name) => {
    const active = panels.find((panel) => panel.dataset.db02Panel === name);
    if (!active) return;
    for (const panel of panels) panel.hidden = panel !== active;
    journey.dataset.db02Screen = name;
    journey.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  for (const button of journey.querySelectorAll('[data-db02-go]')) button.addEventListener('click', () => show(button.dataset.db02Go));
  for (const link of journey.querySelectorAll('[data-db02-source]')) link.addEventListener('click', () => { if (original) original.open = true; });
  const copy = journey.querySelector('[data-db02-copy]');
  copy.addEventListener('click', async () => {
    const code = journey.querySelector('[data-db02-sql]');
    const state = journey.querySelector('[data-db02-copy-state]');
    try {
      await navigator.clipboard.writeText(code.textContent);
      state.textContent = 'SQL을 복사했습니다. practice DB에서 직접 실행하세요.';
    } catch {
      const selection = window.getSelection();
      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.addRange(range);
      state.textContent = 'SQL을 선택했습니다. 직접 복사해 practice DB에서 실행하세요.';
    }
  });
  show('scenario');
});
