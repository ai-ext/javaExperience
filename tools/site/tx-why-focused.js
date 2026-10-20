document.querySelectorAll('.tx-why-focused').forEach((root) => {
  const panels = [...root.querySelectorAll('[data-tx-why-panel]')];
  root.querySelectorAll('[data-tx-why-go]').forEach((button) => button.addEventListener('click', () => {
    const name = button.dataset.txWhyGo;
    for (const panel of panels) panel.hidden = panel.dataset.txWhyPanel !== name;
    root.dataset.txWhyScreen = name;
    root.scrollIntoView({ block: 'start', behavior: 'instant' });
  }));
});
