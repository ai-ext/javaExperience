document.querySelectorAll('.tx-life-focused').forEach((root) => {
  const panels = [...root.querySelectorAll('[data-tx-life-panel]')];
  const show = (name) => {
    for (const panel of panels) panel.hidden = panel.dataset.txLifePanel !== name;
    root.dataset.txLifeScreen = name;
    root.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  root.querySelectorAll('[data-tx-life-go]').forEach((button) => button.addEventListener('click', () => show(button.dataset.txLifeGo)));
  root.querySelectorAll('[data-tx-life-source]').forEach((link) => link.addEventListener('click', () => {
    const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    for (let parent = target?.parentElement; parent; parent = parent.parentElement) {
      if (parent.tagName === 'DETAILS') parent.open = true;
    }
  }));
});
