document.querySelectorAll('.mybatis-focused').forEach((root) => {
  const panels = [...root.querySelectorAll('[data-mybatis-panel]')];
  const show = (name) => {
    for (const panel of panels) panel.hidden = panel.dataset.mybatisPanel !== name;
    root.dataset.mybatisScreen = name;
    root.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  root.querySelectorAll('[data-mybatis-go]').forEach((button) => button.addEventListener('click', () => show(button.dataset.mybatisGo)));
  root.querySelectorAll('[data-mybatis-source]').forEach((link) => link.addEventListener('click', () => {
    for (let parent = document.getElementById(decodeURIComponent(link.hash.slice(1)))?.parentElement; parent; parent = parent.parentElement) {
      if (parent.tagName === 'DETAILS') parent.open = true;
    }
  }));
});
