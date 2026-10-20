document.querySelectorAll('.db03-focused').forEach((journey) => {
  const panels = [...journey.querySelectorAll('[data-db03-panel]')];
  const original = document.querySelector('#db03-original');
  const show = (name) => {
    const active = panels.find((panel) => panel.dataset.db03Panel === name);
    if (!active) return;
    for (const panel of panels) panel.hidden = panel !== active;
    journey.dataset.db03Screen = name;
    journey.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  for (const button of journey.querySelectorAll('[data-db03-go]')) button.addEventListener('click', () => show(button.dataset.db03Go));
  for (const link of journey.querySelectorAll('[data-db03-source]')) link.addEventListener('click', () => { if (original) original.open = true; });
  journey.querySelector('[data-db03-copy]').addEventListener('click', async () => {
    const code = journey.querySelector('[data-db03-sql]');
    const state = journey.querySelector('[data-db03-copy-state]');
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
