// import 시 DOM이나 브라우저 상태를 건드리지 않는다. 강조는 설명 UI 안에서만 바꾼다.
const initialized = new WeakSet();

function selectField(root, field) {
  const button = [...root.querySelectorAll('[data-frv-field]')].find(item => item.dataset.frvField === field);
  if (!button) return;
  root.dataset.frvSelected = field;
  for (const item of root.querySelectorAll('[data-frv-field]')) item.setAttribute('aria-pressed', String(item === button));
  for (const item of root.querySelectorAll('[data-frv-fields]')) item.classList.toggle('is-linked', item.dataset.frvFields.split(' ').includes(field));
  root.querySelector('[data-frv-connection]').textContent = button.dataset.frvDescription;
}

function synchronize(root, field) {
  const scope = root.closest('[data-fw-root]');
  const peers = scope ? [...scope.querySelectorAll('[data-frv-root]')].filter(item => item.dataset.frvTask === root.dataset.frvTask) : [root];
  for (const peer of peers) selectField(peer, field);
}

export function initFunctionalRuntimeVisuals(doc = document) {
  const roots = [...doc.querySelectorAll('[data-frv-root]')];
  if (doc.matches?.('[data-frv-root]')) roots.unshift(doc);
  for (const root of roots) {
    if (initialized.has(root)) continue;
    initialized.add(root);
    const scope = root.closest('[data-fw-root]');
    const previous = scope && [...scope.querySelectorAll('[data-frv-root]')].find(peer => peer !== root && initialized.has(peer) && peer.dataset.frvTask === root.dataset.frvTask);
    selectField(root, previous?.dataset.frvSelected || root.dataset.frvSelected);
    root.addEventListener('click', event => {
      const button = event.target.closest('[data-frv-field]');
      if (button && button.closest('[data-frv-root]') === root) synchronize(root, button.dataset.frvField);
    });
    root.addEventListener('keydown', event => {
      const button = event.target.closest('[data-frv-field]');
      if (!button || button.closest('[data-frv-root]') !== root) return;
      const buttons = [...root.querySelectorAll('[data-frv-field]')];
      const index = buttons.indexOf(button);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : ['ArrowRight', 'ArrowDown'].includes(event.key) ? (index + 1) % buttons.length : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? (index + buttons.length - 1) % buttons.length : null;
      if (next == null) return;
      event.preventDefault();
      synchronize(root, buttons[next].dataset.frvField);
      buttons[next].focus();
    });
  }
}
