const mounted = new WeakSet();

export function mountCoursePostVisual(doc) {
  for (const root of doc.querySelectorAll('.course-post-visual[data-cpv-root]')) {
    if (mounted.has(root)) continue;
    mounted.add(root);
    const views = [...root.querySelectorAll('[data-cpv-view]')];
    const values = root.querySelector('[data-cpv-values]');
    const figure = root.querySelector('[data-cpv-figure]');
    const stateTabs = [...root.querySelectorAll('[data-cpv-state]')];
    const panels = [...root.querySelectorAll('[data-cpv-panel]')];
    const selectView = (name, focus = false) => {
      const isFigure = name === 'figure';
      values.hidden = isFigure;
      figure.hidden = !isFigure;
      root.querySelector('[data-cpv-state-tools]').hidden = isFigure;
      views.forEach((button) => {
        const selected = button.dataset.cpvView === name;
        button.setAttribute('aria-selected', String(selected));
        button.tabIndex = selected ? 0 : -1;
        if (selected && focus) button.focus();
      });
    };
    const selectState = (id, focus = false) => {
      stateTabs.forEach((button) => {
        const selected = button.dataset.cpvState === id;
        button.setAttribute('aria-selected', String(selected));
        button.tabIndex = selected ? 0 : -1;
        if (selected && focus) button.focus();
      });
      panels.forEach((panel) => { panel.hidden = panel.dataset.cpvPanel !== id; });
    };
    views.forEach((button) => button.addEventListener('click', () => selectView(button.dataset.cpvView)));
    stateTabs.forEach((button, index) => button.addEventListener('click', () => selectState(button.dataset.cpvState)));
    const move = (event, buttons, index) => {
      let next = null;
      if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = buttons.length - 1;
      if (next === null) return;
      event.preventDefault();
      if (buttons === stateTabs) selectState(buttons[next].dataset.cpvState, true);
      else selectView(buttons[next].dataset.cpvView, true);
    };
    stateTabs.forEach((button, i) => button.addEventListener('keydown', (event) => move(event, stateTabs, i)));
    views.forEach((button, i) => button.addEventListener('keydown', (event) => move(event, views, i)));
  }
}
