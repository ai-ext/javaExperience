document.querySelectorAll('.config-concept-journey').forEach((journey) => {
  const panels = [...journey.querySelectorAll('[data-cc-screen]')];
  const show = (index) => {
    if (!panels[index]) return;
    panels.forEach((panel, position) => { panel.hidden = position !== index; });
    journey.querySelectorAll('.cc-rail [data-cc-go]').forEach((button) => {
      button.setAttribute('aria-current', Number(button.dataset.ccGo) === index ? 'step' : 'false');
    });
    journey.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  journey.querySelectorAll('[data-cc-go]').forEach((button) => button.addEventListener('click', () => show(Number(button.dataset.ccGo))));
});
